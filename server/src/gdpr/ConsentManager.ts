/**
 * ConsentManager — Singleton that gates analytics, crash reporting, and push
 * notification calls behind user-granted GDPR consent.
 *
 * Usage:
 *   const cm = ConsentManager.getInstance();
 *   await cm.loadConsent(userId);
 *   if (cm.hasAnalyticsConsent(userId)) { ... }
 */

import { eq } from 'drizzle-orm';
import { db, schema } from '../db/index.js';

type ConsentRecord = {
  analytics: boolean;
  crash: boolean;
  push: boolean;
};

export class ConsentManager {
  private static instance: ConsentManager;

  // In-memory consent cache keyed by userId
  private cache = new Map<string, ConsentRecord>();

  private constructor() {}

  static getInstance(): ConsentManager {
    if (!ConsentManager.instance) {
      ConsentManager.instance = new ConsentManager();
    }
    return ConsentManager.instance;
  }

  // ── Load ────────────────────────────────────────────────────────────────────

  async loadConsent(userId: string): Promise<ConsentRecord> {
    const existing = await db.query.userConsents.findFirst({
      where: eq(schema.userConsents.userId, userId),
    });

    const record: ConsentRecord = {
      analytics: existing?.consentAnalytics ?? false,
      crash: existing?.consentCrashReporting ?? false,
      push: existing?.consentPushNotifications ?? false,
    };

    this.cache.set(userId, record);
    return record;
  }

  // ── Getters ─────────────────────────────────────────────────────────────────

  hasAnalyticsConsent(userId: string): boolean {
    return this.cache.get(userId)?.analytics ?? false;
  }

  hasCrashConsent(userId: string): boolean {
    return this.cache.get(userId)?.crash ?? false;
  }

  hasPushConsent(userId: string): boolean {
    return this.cache.get(userId)?.push ?? false;
  }

  // ── Update ──────────────────────────────────────────────────────────────────

  async saveConsent(
    userId: string,
    consent: { analytics: boolean; crash: boolean; push: boolean },
    version = '1.0',
  ): Promise<void> {
    const now = new Date();
    await db
      .insert(schema.userConsents)
      .values({
        userId,
        consentAnalytics: consent.analytics,
        consentCrashReporting: consent.crash,
        consentPushNotifications: consent.push,
        consentGivenAt: now,
        consentUpdatedAt: now,
        consentVersion: version,
      })
      .onConflictDoUpdate({
        target: schema.userConsents.userId,
        set: {
          consentAnalytics: consent.analytics,
          consentCrashReporting: consent.crash,
          consentPushNotifications: consent.push,
          consentUpdatedAt: now,
          consentVersion: version,
        },
      });

    this.cache.set(userId, consent);

    // If analytics withdrawn, signal opt-out side-effects
    if (!consent.analytics) {
      this.onAnalyticsOptOut(userId);
    }

    if (!consent.crash) {
      this.onCrashOptOut(userId);
    }
  }

  async updateConsent(
    userId: string,
    field: 'analytics' | 'crash' | 'push',
    value: boolean,
  ): Promise<void> {
    const current = this.cache.get(userId) ?? (await this.loadConsent(userId));
    const updated = { ...current, [field]: value };
    await this.saveConsent(userId, updated);
  }

  // ── Side effects ─────────────────────────────────────────────────────────────

  private onAnalyticsOptOut(userId: string): void {
    // PostHog opt-out — called if PostHog SDK is initialised server-side
    // posthog.optOut() would go here; client handles this via /gdpr/consent response
    console.info(`[GDPR] Analytics opt-out recorded for user ${userId}`);
  }

  private onCrashOptOut(userId: string): void {
    // Sentry opt-out signal
    console.info(`[GDPR] Crash reporting opt-out recorded for user ${userId}`);
  }

  // ── Cache management ──────────────────────────────────────────────────────────

  evict(userId: string): void {
    this.cache.delete(userId);
  }

  clearAll(): void {
    this.cache.clear();
  }
}

export const consentManager = ConsentManager.getInstance();
