import Stripe from 'stripe';
import { eq } from 'drizzle-orm';
import { config } from '../config/index.js';
import { db, schema } from '../db/index.js';
import { invalidateUserTierCache } from '../auth/middleware.js';
import type { UserTier } from '../types/index.js';

export const stripe = new Stripe(config.stripe.secretKey, {
  apiVersion: '2024-06-20',
});

// ── Product → tier mapping ────────────────────────────────────────────────────

function productIdToTier(productId: string): UserTier {
  const map: Record<string, UserTier> = {
    [config.stripe.prices.voyagerLifetime]: 'voyager',
    [config.stripe.prices.proMonthly]: 'nomad_pro',
    [config.stripe.prices.proAnnual]: 'nomad_pro',
  };
  return map[productId] ?? 'explorer';
}

// ── Create Stripe checkout session ───────────────────────────────────────────

export async function createCheckoutSession(params: {
  userId: string;
  userEmail: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<string> {
  const session = await stripe.checkout.sessions.create({
    mode: params.priceId === config.stripe.prices.voyagerLifetime ? 'payment' : 'subscription',
    customer_email: params.userEmail,
    line_items: [{ price: params.priceId, quantity: 1 }],
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: { userId: params.userId },
    allow_promotion_codes: true,
  });

  return session.url!;
}

// ── Get Stripe billing portal URL ────────────────────────────────────────────

export async function getBillingPortalUrl(
  customerId: string,
  returnUrl: string,
): Promise<string> {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
  return session.url;
}

// ── Webhook handlers ──────────────────────────────────────────────────────────

export async function handleCheckoutComplete(session: Stripe.Checkout.Session): Promise<void> {
  const userId = session.metadata?.userId;
  if (!userId) return;

  const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
  const priceId = lineItems.data[0]?.price?.id;
  if (!priceId) return;

  const tier = productIdToTier(priceId);

  // Upsert subscription
  await db
    .insert(schema.subscriptions)
    .values({
      userId,
      provider: 'stripe',
      providerSubscriptionId: session.subscription as string | undefined,
      providerCustomerId: session.customer as string,
      productId: priceId,
      status: 'active',
      currentPeriodStart: new Date(),
      rawWebhook: session as unknown as Record<string, unknown>,
    })
    .onConflictDoUpdate({
      target: schema.subscriptions.providerSubscriptionId,
      set: {
        status: 'active',
        rawWebhook: session as unknown as Record<string, unknown>,
        updatedAt: new Date(),
      },
    });

  // Update user tier
  await db
    .update(schema.users)
    .set({
      tier,
      tierSource: 'stripe',
      tierExpiresAt: tier === 'voyager' ? null : undefined, // Lifetime = no expiry
      updatedAt: new Date(),
    })
    .where(eq(schema.users.id, userId));

  await invalidateUserTierCache(userId);
}

export async function syncStripeSubscription(subscription: Stripe.Subscription): Promise<void> {
  // Find userId via customer ID
  const existing = await db.query.subscriptions.findFirst({
    where: eq(schema.subscriptions.providerCustomerId, subscription.customer as string),
  });

  if (!existing) return;

  const priceId = subscription.items.data[0]?.price?.id ?? '';
  const tier = productIdToTier(priceId);
  const isActive = subscription.status === 'active';

  await db
    .update(schema.subscriptions)
    .set({
      status: subscription.status as 'active' | 'cancelled' | 'expired' | 'pending' | 'past_due',
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      rawWebhook: subscription as unknown as Record<string, unknown>,
      updatedAt: new Date(),
    })
    .where(eq(schema.subscriptions.id, existing.id));

  // Downgrade to explorer if cancelled/expired
  const newTier: UserTier = isActive ? tier : 'explorer';

  await db
    .update(schema.users)
    .set({
      tier: newTier,
      tierExpiresAt: isActive ? new Date(subscription.current_period_end * 1000) : null,
      updatedAt: new Date(),
    })
    .where(eq(schema.users.id, existing.userId));

  await invalidateUserTierCache(existing.userId);
}

export async function handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
  const customerId = invoice.customer as string;

  const existing = await db.query.subscriptions.findFirst({
    where: eq(schema.subscriptions.providerCustomerId, customerId),
  });

  if (!existing) return;

  await db
    .update(schema.subscriptions)
    .set({
      status: 'past_due',
      updatedAt: new Date(),
    })
    .where(eq(schema.subscriptions.id, existing.id));

  // Don't immediately revoke access — give grace period (Stripe handles dunning)
}

// ── Cancel subscription ───────────────────────────────────────────────────────

export async function cancelSubscription(userId: string): Promise<void> {
  const sub = await db.query.subscriptions.findFirst({
    where: eq(schema.subscriptions.userId, userId),
  });

  if (!sub?.providerSubscriptionId) {
    throw new Error('No active Stripe subscription found');
  }

  await stripe.subscriptions.update(sub.providerSubscriptionId, {
    cancel_at_period_end: true,
  });

  await db
    .update(schema.subscriptions)
    .set({ cancelAtPeriodEnd: true, updatedAt: new Date() })
    .where(eq(schema.subscriptions.id, sub.id));
}
