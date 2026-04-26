import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db, schema } from '../db/index.js';
import { verifyJWT } from '../auth/middleware.js';
import { supabaseAdmin } from '../auth/supabase.js';
import { AppError } from '../errors/index.js';
import { consentManager } from '../gdpr/ConsentManager.js';

// ── Validation schemas ────────────────────────────────────────────────────────

const SaveConsentSchema = z.object({
  consent_analytics: z.boolean(),
  consent_crash_reporting: z.boolean(),
  consent_push_notifications: z.boolean(),
  consent_version: z.string().default('1.0'),
});

const UpdateConsentSchema = z.object({
  field: z.enum(['analytics', 'crash', 'push']),
  value: z.boolean(),
});

const RegisterDeviceTokenSchema = z.object({
  token: z.string().min(1),
  platform: z.enum(['ios', 'android']),
});

// ── Route registration ────────────────────────────────────────────────────────

export async function gdprRoutes(fastify: FastifyInstance) {
  // ── POST /gdpr/consent — Save full consent record ─────────────────────────

  fastify.post('/gdpr/consent', { preHandler: [verifyJWT] }, async (request, reply) => {
    const body = SaveConsentSchema.parse(request.body);

    await consentManager.saveConsent(
      request.userId,
      {
        analytics: body.consent_analytics,
        crash: body.consent_crash_reporting,
        push: body.consent_push_notifications,
      },
      body.consent_version,
    );

    reply.send({ data: { message: 'Consent preferences saved.' } });
  });

  // ── POST /gdpr/consent/update — Update a single consent field ─────────────

  fastify.post('/gdpr/consent/update', { preHandler: [verifyJWT] }, async (request, reply) => {
    const body = UpdateConsentSchema.parse(request.body);

    await consentManager.updateConsent(request.userId, body.field, body.value);

    reply.send({ data: { message: `Consent for '${body.field}' updated to ${body.value}.` } });
  });

  // ── GET /gdpr/export — Full data portability export ───────────────────────

  fastify.get('/gdpr/export', { preHandler: [verifyJWT] }, async (request, reply) => {
    const userId = request.userId;

    const [
      user,
      trips,
      consents,
      deviceTokens,
      expenses,
      savedPhrases,
      userAchievements,
      userFavourites,
      communityTips,
    ] = await Promise.all([
      db.query.users.findFirst({ where: eq(schema.users.id, userId) }),
      db.query.trips.findMany({ where: eq(schema.trips.userId, userId) }),
      db.query.userConsents.findFirst({ where: eq(schema.userConsents.userId, userId) }),
      db.query.deviceTokens.findMany({ where: eq(schema.deviceTokens.userId, userId) }),
      db.query.expenses.findMany({ where: eq(schema.expenses.userId, userId) }),
      db.query.savedPhrases.findMany({ where: eq(schema.savedPhrases.userId, userId) }),
      db.query.userAchievements.findMany({ where: eq(schema.userAchievements.userId, userId) }),
      db.query.userFavourites.findMany({ where: eq(schema.userFavourites.userId, userId) }),
      db.query.communityTips.findMany({ where: eq(schema.communityTips.userId, userId) }),
    ]);

    reply
      .header('Content-Disposition', `attachment; filename="easytrip-data-export-${userId}.json"`)
      .header('Content-Type', 'application/json')
      .send({
        exported_at: new Date().toISOString(),
        user_id: userId,
        data: {
          profile: user,
          trips,
          consent_preferences: consents,
          device_tokens: deviceTokens.map((d) => ({
            platform: d.platform,
            registered_at: d.registeredAt,
          })), // omit actual tokens for security
          expenses,
          saved_phrases: savedPhrases,
          achievements: userAchievements,
          favourites: userFavourites,
          community_tips: communityTips,
        },
      });
  });

  // ── POST /gdpr/delete-account — Permanent account deletion ────────────────

  fastify.post('/gdpr/delete-account', { preHandler: [verifyJWT] }, async (request, reply) => {
    const userId = request.userId;

    // Log the deletion request for audit trail
    await db.insert(schema.dataDeletionRequests).values({
      userId,
      status: 'pending',
    });

    // Log to retention log before deletion
    await db.insert(schema.dataRetentionLog).values({
      recordType: 'user',
      recordId: userId,
      deletionReason: 'user_requested_gdpr_deletion',
    });

    // Delete from Supabase Auth (cascades via DB triggers / FK cascades)
    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (authDeleteError) {
      fastify.log.error({ userId, err: authDeleteError }, 'Failed to delete Supabase auth user');
    }

    // Delete from users table — cascades to all user-generated content
    // (trips → itinerary_days → tasks, expenses, device_tokens, consents, etc.)
    await db.delete(schema.users).where(eq(schema.users.id, userId));

    // Mark deletion request as completed
    await db
      .update(schema.dataDeletionRequests)
      .set({ status: 'completed', completedAt: new Date() })
      .where(eq(schema.dataDeletionRequests.userId, userId));

    // Evict from consent cache
    consentManager.evict(userId);

    reply.send({
      data: {
        message: 'Your account and all associated data have been deleted.',
      },
    });
  });

  // ── POST /gdpr/withdraw-push-consent — Opt out of push notifications ──────

  fastify.post('/gdpr/withdraw-push-consent', { preHandler: [verifyJWT] }, async (request, reply) => {
    const userId = request.userId;

    // Delete all device tokens for this user
    await db.delete(schema.deviceTokens).where(eq(schema.deviceTokens.userId, userId));

    // Update consent record
    await consentManager.updateConsent(userId, 'push', false);

    reply.send({ data: { message: 'Push notification consent withdrawn. Tokens removed.' } });
  });

  // ── POST /gdpr/device-token — Register a push token ──────────────────────

  fastify.post('/gdpr/device-token', { preHandler: [verifyJWT] }, async (request, reply) => {
    const body = RegisterDeviceTokenSchema.parse(request.body);

    // Check user has push consent before registering
    const consent = await consentManager.loadConsent(request.userId);
    if (!consent.push) {
      throw new AppError(
        403,
        'push_consent_required',
        'Push notification consent is required to register a device token.',
      );
    }

    await db
      .insert(schema.deviceTokens)
      .values({
        userId: request.userId,
        token: body.token,
        platform: body.platform,
      })
      .onConflictDoNothing();

    reply.send({ data: { message: 'Device token registered.' } });
  });
}
