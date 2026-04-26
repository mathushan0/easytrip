import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { randomInt } from 'crypto';
import { db, schema } from '../db/index.js';
import { supabaseAdmin } from '../auth/supabase.js';
import { verifyJWT } from '../auth/middleware.js';
import { redis } from '../plugins/redis.js';
import { AppError } from '../errors/index.js';
import { config } from '../config/index.js';

// ── Validation schemas ────────────────────────────────────────────────────────

const AppleSignInSchema = z.object({
  identity_token: z.string().min(1),
  name: z.string().optional(), // only on first sign-in from Apple
  email: z.string().email().optional(),
});

const GoogleSignInSchema = z.object({
  id_token: z.string().min(1),
});

const SendOtpSchema = z.object({
  email: z.string().email(),
});

const VerifyOtpSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
});

// ── Helpers ───────────────────────────────────────────────────────────────────

const OTP_TTL = 10 * 60; // 10 minutes in seconds
const OTP_KEY = (email: string) => `otp:${email.toLowerCase()}`;

function generateOtp(): string {
  return String(randomInt(100000, 999999));
}

async function sendOtpEmail(email: string, otp: string): Promise<void> {
  if (!config.resend.apiKey) {
    // Dev fallback — log to console
    console.info(`[DEV] OTP for ${email}: ${otp}`);
    return;
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.resend.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'EasyTrip <noreply@easytrip.app>',
      to: [email],
      subject: 'Your EasyTrip sign-in code',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:auto">
          <h2>Sign in to EasyTrip</h2>
          <p>Your one-time code is:</p>
          <p style="font-size:2rem;font-weight:bold;letter-spacing:0.2em">${otp}</p>
          <p>This code expires in 10 minutes. Do not share it with anyone.</p>
        </div>
      `,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new AppError(502, 'email_send_failed', `Failed to send OTP email: ${body}`);
  }
}

async function upsertUser(params: {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
}): Promise<typeof schema.users.$inferSelect> {
  const existing = await db.query.users.findFirst({
    where: eq(schema.users.id, params.id),
  });

  if (existing) {
    // Update only if we have fresh data
    const updates: Partial<typeof schema.users.$inferInsert> = { updatedAt: new Date() };
    if (params.name && !existing.displayName) updates.displayName = params.name;
    if (params.avatarUrl && params.avatarUrl !== existing.avatarUrl) {
      updates.avatarUrl = params.avatarUrl;
    }

    const [updated] = await db
      .update(schema.users)
      .set(updates)
      .where(eq(schema.users.id, params.id))
      .returning();
    return updated;
  }

  const [created] = await db
    .insert(schema.users)
    .values({
      id: params.id,
      email: params.email,
      displayName: params.name,
      avatarUrl: params.avatarUrl,
    })
    .returning();
  return created;
}

// ── Route registration ────────────────────────────────────────────────────────

export async function authRoutes(fastify: FastifyInstance) {
  // ── POST /auth/apple ──────────────────────────────────────────────────────

  fastify.post('/auth/apple', async (request, reply) => {
    const body = AppleSignInSchema.parse(request.body);

    const { data, error } = await supabaseAdmin.auth.signInWithIdToken({
      provider: 'apple',
      token: body.identity_token,
    });

    if (error || !data.user || !data.session) {
      throw new AppError(401, 'apple_auth_failed', error?.message ?? 'Apple sign-in failed');
    }

    const user = await upsertUser({
      id: data.user.id,
      email: data.user.email!,
      name: body.name ?? data.user.user_metadata?.full_name,
      avatarUrl: data.user.user_metadata?.avatar_url,
    });

    reply.send({
      data: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_in: data.session.expires_in,
        user,
      },
    });
  });

  // ── POST /auth/google ─────────────────────────────────────────────────────

  fastify.post('/auth/google', async (request, reply) => {
    const body = GoogleSignInSchema.parse(request.body);

    const { data, error } = await supabaseAdmin.auth.signInWithIdToken({
      provider: 'google',
      token: body.id_token,
    });

    if (error || !data.user || !data.session) {
      throw new AppError(401, 'google_auth_failed', error?.message ?? 'Google sign-in failed');
    }

    const meta = data.user.user_metadata ?? {};

    const user = await upsertUser({
      id: data.user.id,
      email: data.user.email!,
      name: meta.full_name ?? meta.name,
      avatarUrl: meta.avatar_url ?? meta.picture,
    });

    reply.send({
      data: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_in: data.session.expires_in,
        user,
      },
    });
  });

  // ── POST /auth/email/send-otp ─────────────────────────────────────────────

  fastify.post('/auth/email/send-otp', async (request, reply) => {
    const { email } = SendOtpSchema.parse(request.body);

    // Rate-limit: allow only 3 OTP requests per email per 15 minutes
    const rateLimitKey = `otp:ratelimit:${email.toLowerCase()}`;
    const attempts = await redis.incr(rateLimitKey);
    if (attempts === 1) await redis.expire(rateLimitKey, 15 * 60);
    if (attempts > 3) {
      throw new AppError(429, 'otp_rate_limited', 'Too many OTP requests. Please wait 15 minutes.');
    }

    const otp = generateOtp();
    await redis.setex(OTP_KEY(email), OTP_TTL, otp);
    await sendOtpEmail(email, otp);

    reply.send({ data: { message: 'OTP sent successfully. Check your email.' } });
  });

  // ── POST /auth/email/verify-otp ───────────────────────────────────────────

  fastify.post('/auth/email/verify-otp', async (request, reply) => {
    const { email, otp } = VerifyOtpSchema.parse(request.body);

    const storedOtp = await redis.get(OTP_KEY(email));

    if (!storedOtp) {
      throw new AppError(400, 'otp_expired', 'OTP has expired or was never issued. Request a new one.');
    }

    if (storedOtp !== otp) {
      throw new AppError(400, 'otp_invalid', 'Invalid OTP code.');
    }

    // Consume OTP (one-time use)
    await redis.del(OTP_KEY(email));

    // Check if a user exists for this email in Supabase (could be from different provider)
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase(),
    );

    if (existingUser) {
      const providers = existingUser.identities?.map((i) => i.provider) ?? [];
      const hasEmailProvider = providers.includes('email');

      if (!hasEmailProvider && providers.length > 0) {
        // Account exists via different provider
        const providerName =
          providers[0] === 'apple'
            ? 'Apple'
            : providers[0] === 'google'
              ? 'Google'
              : providers[0];

        throw new AppError(
          409,
          'provider_conflict',
          `An account with this email already exists. Please sign in with ${providerName} instead.`,
        );
      }
    }

    // Sign in or create via Supabase magic link flow (OTP)
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email,
    });

    if (error || !data.user) {
      throw new AppError(500, 'auth_link_failed', error?.message ?? 'Failed to create session');
    }

    // Create session token
    const { data: sessionData, error: sessionError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        email_confirm: true,
      });

    // User may already exist — get them
    const userId = sessionData?.user?.id ?? existingUser?.id;

    if (!userId) {
      throw new AppError(500, 'user_creation_failed', 'Failed to resolve user account');
    }

    // Create a session for the user
    const { data: session, error: sessionErr } =
      await supabaseAdmin.auth.admin.createSession({ user_id: userId });

    if (sessionErr || !session) {
      // Fallback: generate sign-in link token
      throw new AppError(500, 'session_failed', sessionErr?.message ?? 'Failed to create session');
    }

    const user = await upsertUser({ id: userId, email });

    reply.send({
      data: {
        access_token: session.session.access_token,
        refresh_token: session.session.refresh_token,
        expires_in: session.session.expires_in,
        user,
      },
    });
  });

  // ── GET /auth/profile ─────────────────────────────────────────────────────

  fastify.get('/auth/profile', { preHandler: [verifyJWT] }, async (request, reply) => {
    const user = await db.query.users.findFirst({
      where: eq(schema.users.id, request.userId),
      with: { themePreferences: true },
    });

    if (!user) {
      throw new AppError(404, 'user_not_found', 'User profile not found');
    }

    reply.send({ data: user });
  });
}
