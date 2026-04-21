import type { FastifyRequest, FastifyReply } from 'fastify';
import { eq } from 'drizzle-orm';
import { verifySupabaseToken } from './supabase.js';
import { db, schema } from '../db/index.js';
import { UnauthorizedError, UpgradeRequiredError } from '../errors/index.js';
import { TIER_RANK, type UserTier } from '../types/index.js';
import { redis } from '../plugins/redis.js';

// ── verifyJWT middleware ──────────────────────────────────────────────────────

export async function verifyJWT(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const authHeader = request.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    reply.code(401).send({ error: 'unauthorized', message: 'Missing Authorization header' });
    return;
  }

  const token = authHeader.slice(7);

  // Check token blacklist (logged-out tokens)
  const blacklisted = await redis.get(`token:blacklist:${token.slice(-16)}`);
  if (blacklisted) {
    reply.code(401).send({ error: 'unauthorized', message: 'Token has been revoked' });
    return;
  }

  const supabaseUser = await verifySupabaseToken(token);
  if (!supabaseUser) {
    reply.code(401).send({ error: 'unauthorized', message: 'Invalid or expired token' });
    return;
  }

  // Fetch tier from DB — do not trust JWT claims for tier (updated via webhooks)
  const cacheKey = `user:tier:${supabaseUser.id}`;
  let tier: UserTier;

  const cached = await redis.get(cacheKey);
  if (cached) {
    tier = cached as UserTier;
  } else {
    const user = await db.query.users.findFirst({
      where: eq(schema.users.id, supabaseUser.id),
      columns: { tier: true },
    });

    if (!user) {
      // First-time user — auto-create record from Supabase user
      await db.insert(schema.users).values({
        id: supabaseUser.id,
        email: supabaseUser.email ?? '',
        tier: 'explorer',
      }).onConflictDoNothing();
      tier = 'explorer';
    } else {
      tier = user.tier as UserTier;
    }

    // Cache for 5 minutes (tier changes via webhooks invalidate this)
    await redis.setex(cacheKey, 300, tier);
  }

  request.userId = supabaseUser.id;
  request.userTier = tier;
}

// ── requireTier middleware factory ────────────────────────────────────────────

export function requireTier(minTier: UserTier) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    if (TIER_RANK[request.userTier] < TIER_RANK[minTier]) {
      const url = (request.routeOptions as { url?: string }).url;
      reply.code(403).send({
        error: 'upgrade_required',
        message: `This feature requires ${minTier} or higher`,
        required_tier: minTier,
        upsell_context: url,
      });
    }
  };
}

// ── invalidateUserTierCache ───────────────────────────────────────────────────
// Called after subscription changes so next request fetches fresh tier

export async function invalidateUserTierCache(userId: string): Promise<void> {
  await redis.del(`user:tier:${userId}`);
}

// ── blacklistToken ────────────────────────────────────────────────────────────
// Called on logout — blacklists the last 16 chars of token (fingerprint)

export async function blacklistToken(token: string, ttlSeconds = 86400): Promise<void> {
  await redis.setex(`token:blacklist:${token.slice(-16)}`, ttlSeconds, '1');
}
