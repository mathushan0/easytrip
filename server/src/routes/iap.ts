import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db, schema } from '../db/index.js';
import { verifyJWT } from '../auth/middleware.js';
import { config } from '../config/index.js';
import { ValidationError, AppError } from '../errors/index.js';

// ── Validation schemas ────────────────────────────────────────────────────────

const AppleReceiptSchema = z.object({
  platform: z.literal('apple'),
  receipt_data: z.string().min(1),
  product_id: z.string().min(1),
});

const GoogleReceiptSchema = z.object({
  platform: z.literal('google'),
  purchase_token: z.string().min(1),
  product_id: z.string().min(1),
  package_name: z.string().optional(),
});

const VerifyReceiptSchema = z.discriminatedUnion('platform', [
  AppleReceiptSchema,
  GoogleReceiptSchema,
]);

// ── Apple product → tier mapping ─────────────────────────────────────────────

const APPLE_PRODUCT_TIER: Record<string, 'voyager' | 'nomad_pro'> = {
  'app.easytrip.voyager.lifetime': 'voyager',
  'app.easytrip.nomadpro.monthly': 'nomad_pro',
  'app.easytrip.nomadpro.annual': 'nomad_pro',
};

const GOOGLE_PRODUCT_TIER: Record<string, 'voyager' | 'nomad_pro'> = {
  'easytrip_voyager_lifetime': 'voyager',
  'easytrip_nomadpro_monthly': 'nomad_pro',
  'easytrip_nomadpro_annual': 'nomad_pro',
};

// ── Apple App Store Server API verification ───────────────────────────────────

async function verifyAppleReceipt(
  receiptData: string,
  productId: string,
): Promise<{ valid: boolean; transactionId?: string; expiresMs?: number }> {
  const sharedSecret = config.apple.iapSharedSecret;
  if (!sharedSecret) throw new AppError(503, 'iap_not_configured', 'Apple IAP not configured');

  // Try production first, fall back to sandbox
  const endpoints = [
    'https://buy.itunes.apple.com/verifyReceipt',
    'https://sandbox.itunes.apple.com/verifyReceipt',
  ];

  const payload = { 'receipt-data': receiptData, password: sharedSecret, 'exclude-old-transactions': true };

  for (const url of endpoints) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const body = (await res.json()) as {
      status: number;
      latest_receipt_info?: Array<{
        product_id: string;
        transaction_id: string;
        expires_date_ms?: string;
        cancellation_date_ms?: string;
      }>;
    };

    // 21007 = receipt is sandbox, retry sandbox endpoint
    if (body.status === 21007) continue;

    if (body.status !== 0) {
      return { valid: false };
    }

    // Find a matching, non-cancelled transaction
    const match = (body.latest_receipt_info ?? []).find(
      (t) =>
        t.product_id === productId &&
        !t.cancellation_date_ms,
    );

    if (!match) return { valid: false };

    return {
      valid: true,
      transactionId: match.transaction_id,
      expiresMs: match.expires_date_ms ? parseInt(match.expires_date_ms, 10) : undefined,
    };
  }

  return { valid: false };
}

// ── Google Play Developer API verification ────────────────────────────────────

async function verifyGoogleReceipt(
  purchaseToken: string,
  productId: string,
  packageName: string,
): Promise<{ valid: boolean; orderId?: string; expiresMs?: number }> {
  const serviceAccountKey = config.google.playServiceAccountKey;
  if (!serviceAccountKey) throw new AppError(503, 'iap_not_configured', 'Google Play IAP not configured');

  // Obtain an access token via service account JWT
  const keyData = JSON.parse(serviceAccountKey) as {
    client_email: string;
    private_key: string;
  };

  const now = Math.floor(Date.now() / 1000);
  const jwtHeader = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const jwtPayload = Buffer.from(
    JSON.stringify({
      iss: keyData.client_email,
      scope: 'https://www.googleapis.com/auth/androidpublisher',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
    }),
  ).toString('base64url');

  const { createSign } = await import('crypto');
  const sign = createSign('RSA-SHA256');
  sign.update(`${jwtHeader}.${jwtPayload}`);
  const signature = sign.sign(keyData.private_key, 'base64url');
  const jwt = `${jwtHeader}.${jwtPayload}.${signature}`;

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  const tokenBody = (await tokenRes.json()) as { access_token?: string };
  if (!tokenBody.access_token) return { valid: false };

  // Use inappproducts.purchases for one-time, subscriptions.purchases for subscriptions
  const isSubscription = productId.includes('monthly') || productId.includes('annual');
  const apiPath = isSubscription
    ? `subscriptions/${productId}/purchases/${purchaseToken}`
    : `products/${productId}/purchases/${purchaseToken}`;

  const verifyRes = await fetch(
    `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${packageName}/${apiPath}`,
    { headers: { Authorization: `Bearer ${tokenBody.access_token}` } },
  );

  if (!verifyRes.ok) return { valid: false };

  const purchase = (await verifyRes.json()) as {
    orderId?: string;
    purchaseState?: number; // 0 = purchased
    cancelReason?: number;
    expiryTimeMillis?: string;
    paymentState?: number;
  };

  // purchaseState 0 = purchased, not cancelled
  if (purchase.purchaseState !== undefined && purchase.purchaseState !== 0) {
    return { valid: false };
  }
  if (purchase.cancelReason !== undefined) return { valid: false };

  return {
    valid: true,
    orderId: purchase.orderId,
    expiresMs: purchase.expiryTimeMillis ? parseInt(purchase.expiryTimeMillis, 10) : undefined,
  };
}

// ── Route registration ────────────────────────────────────────────────────────

export async function iapRoutes(fastify: FastifyInstance) {
  // POST /subscriptions/verify-iap — verify Apple/Google IAP receipt and upgrade tier
  fastify.post(
    '/subscriptions/verify-iap',
    {
      preHandler: [verifyJWT],
      config: { rateLimit: { max: 10, timeWindow: '1 minute' } },
    },
    async (request, reply) => {
      const { userId } = request;
      const body = VerifyReceiptSchema.parse(request.body);

      let tierToGrant: 'voyager' | 'nomad_pro';
      let externalTransactionId: string | undefined;
      let expiresAt: Date | undefined;

      if (body.platform === 'apple') {
        const result = await verifyAppleReceipt(body.receipt_data, body.product_id);
        if (!result.valid) throw new ValidationError('Receipt validation failed with Apple');
        const mapped = APPLE_PRODUCT_TIER[body.product_id];
        if (!mapped) throw new ValidationError(`Unknown Apple product: ${body.product_id}`);
        tierToGrant = mapped;
        externalTransactionId = result.transactionId;
        if (result.expiresMs) expiresAt = new Date(result.expiresMs);
      } else {
        const packageName = body.package_name ?? config.google.playPackageName;
        const result = await verifyGoogleReceipt(body.purchase_token, body.product_id, packageName);
        if (!result.valid) throw new ValidationError('Receipt validation failed with Google Play');
        const mapped = GOOGLE_PRODUCT_TIER[body.product_id];
        if (!mapped) throw new ValidationError(`Unknown Google product: ${body.product_id}`);
        tierToGrant = mapped;
        externalTransactionId = result.orderId;
        if (result.expiresMs) expiresAt = new Date(result.expiresMs);
      }

      const provider = body.platform === 'apple' ? 'apple_iap' as const : 'google_iap' as const;

      // Upsert subscription record
      const existingSub = await db.query.subscriptions.findFirst({
        where: eq(schema.subscriptions.userId, userId),
      });

      if (existingSub) {
        await db
          .update(schema.subscriptions)
          .set({
            provider,
            status: 'active',
            productId: body.product_id,
            providerSubscriptionId: externalTransactionId ?? null,
            currentPeriodEnd: expiresAt ?? null,
            updatedAt: new Date(),
          })
          .where(eq(schema.subscriptions.userId, userId));
      } else {
        await db.insert(schema.subscriptions).values({
          userId,
          provider,
          status: 'active',
          productId: body.product_id,
          providerSubscriptionId: externalTransactionId,
          currentPeriodStart: new Date(),
          currentPeriodEnd: expiresAt ?? null,
        });
      }

      // Update user tier
      await db
        .update(schema.users)
        .set({ tier: tierToGrant, updatedAt: new Date() })
        .where(eq(schema.users.id, userId));

      reply.send({
        data: {
          tier: tierToGrant,
          provider,
          expiresAt: expiresAt?.toISOString() ?? null,
        },
      });
    },
  );
}
