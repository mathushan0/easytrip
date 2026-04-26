/**
 * Redis cache helpers — typed wrappers with TTL strategies per EasyTrip spec.
 *
 * TTL Strategy:
 *   - Routes:        7 days  (transport / directions)
 *   - Translations:  30 days (anonymised, keyed by content hash)
 *   - Exchange rates: 24 hours
 *   - Venue details:  7 days
 *   - Social feed:    real-time (no TTL, updated via WebSocket push)
 */

import { createHash } from 'crypto';
import { redis } from '../plugins/redis.js';

// ── TTL constants ──────────────────────────────────────────────────────────────

export const TTL = {
  ROUTE: 7 * 24 * 60 * 60,           // 7 days
  TRANSLATION: 30 * 24 * 60 * 60,    // 30 days
  EXCHANGE_RATE: 24 * 60 * 60,       // 24 hours
  VENUE: 7 * 24 * 60 * 60,           // 7 days
  OTP: 10 * 60,                       // 10 minutes
  USER_TIER: 5 * 60,                  // 5 minutes
} as const;

// ── Key builders ───────────────────────────────────────────────────────────────

export const CacheKey = {
  route: (from: string, to: string) => `route:${from}:${to}`,
  translation: (text: string, targetLang: string) => {
    const hash = createHash('sha256').update(`${text}:${targetLang}`).digest('hex').slice(0, 16);
    return `translate:${hash}`;
  },
  exchangeRate: (date: string) => `rates:${date}`,
  venue: (venueId: string) => `venue:${venueId}`,
  socialFeed: (destinationId: string) => `social:${destinationId}:posts`,
  userTier: (userId: string) => `user:tier:${userId}`,
  tokenBlacklist: (tokenSuffix: string) => `token:blacklist:${tokenSuffix}`,
};

// ── Generic helpers ────────────────────────────────────────────────────────────

export async function cacheGet<T>(key: string): Promise<T | null> {
  const raw = await redis.get(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  await redis.setex(key, ttlSeconds, JSON.stringify(value));
}

export async function cacheDel(key: string): Promise<void> {
  await redis.del(key);
}

export async function cacheSetNoExpiry(key: string, value: unknown): Promise<void> {
  await redis.set(key, JSON.stringify(value));
}

// ── Domain-specific helpers ────────────────────────────────────────────────────

/**
 * Cache a transport route for 7 days.
 */
export async function cacheRoute(from: string, to: string, routeData: unknown): Promise<void> {
  await cacheSet(CacheKey.route(from, to), routeData, TTL.ROUTE);
}

export async function getCachedRoute<T>(from: string, to: string): Promise<T | null> {
  return cacheGet<T>(CacheKey.route(from, to));
}

/**
 * Cache a translation for 30 days (anonymised — hashed input, no user ID).
 */
export async function cacheTranslation(
  text: string,
  targetLang: string,
  result: unknown,
): Promise<void> {
  await cacheSet(CacheKey.translation(text, targetLang), result, TTL.TRANSLATION);
}

export async function getCachedTranslation<T>(
  text: string,
  targetLang: string,
): Promise<T | null> {
  return cacheGet<T>(CacheKey.translation(text, targetLang));
}

/**
 * Cache exchange rates for 24 hours (keyed by date so yesterday's cache stays
 * valid for historical calculations).
 */
export async function cacheExchangeRates(date: string, rates: unknown): Promise<void> {
  await cacheSet(CacheKey.exchangeRate(date), rates, TTL.EXCHANGE_RATE);
}

export async function getCachedExchangeRates<T>(date: string): Promise<T | null> {
  return cacheGet<T>(CacheKey.exchangeRate(date));
}

/**
 * Cache venue details for 7 days.
 */
export async function cacheVenue(venueId: string, venueData: unknown): Promise<void> {
  await cacheSet(CacheKey.venue(venueId), venueData, TTL.VENUE);
}

export async function getCachedVenue<T>(venueId: string): Promise<T | null> {
  return cacheGet<T>(CacheKey.venue(venueId));
}

/**
 * Social feed — no TTL, updated real-time via WebSocket.
 */
export async function cacheSocialFeed(destinationId: string, posts: unknown): Promise<void> {
  await cacheSetNoExpiry(CacheKey.socialFeed(destinationId), posts);
}

export async function getCachedSocialFeed<T>(destinationId: string): Promise<T | null> {
  return cacheGet<T>(CacheKey.socialFeed(destinationId));
}
