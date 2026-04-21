import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { db, schema } from '../db/index.js';
import { verifyJWT, requireTier, blacklistToken } from '../auth/middleware.js';
import { NotFoundError } from '../errors/index.js';
import { supabaseAdmin } from '../auth/supabase.js';

const UpdateProfileSchema = z.object({
  display_name: z.string().min(1).max(100).optional(),
  preferred_currency: z.string().length(3).optional(),
  preferred_language: z.string().min(2).max(10).optional(),
  avatar_url: z.string().url().optional(),
});

const UpdateThemeSchema = z.object({
  theme: z.enum(['dark_light', 'aurora_dark', 'warm_sand', 'electric']),
});

const UpdateCategoryColoursSchema = z.object({
  food: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  landmarks: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  transport: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  culture: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  budget: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  accommodation: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});

export async function userRoutes(fastify: FastifyInstance) {
  // GET /users/me
  fastify.get('/users/me', { preHandler: [verifyJWT] }, async (request, reply) => {
    const user = await db.query.users.findFirst({
      where: eq(schema.users.id, request.userId),
      with: { themePreferences: true },
    });
    if (!user) throw new NotFoundError('User');
    reply.send({ data: user });
  });

  // PATCH /users/me
  fastify.patch('/users/me', { preHandler: [verifyJWT] }, async (request, reply) => {
    const body = UpdateProfileSchema.parse(request.body);

    const updates: Partial<typeof schema.users.$inferInsert> = { updatedAt: new Date() };
    if (body.display_name !== undefined) updates.displayName = body.display_name;
    if (body.preferred_currency !== undefined) updates.preferredCurrency = body.preferred_currency;
    if (body.preferred_language !== undefined) updates.preferredLanguage = body.preferred_language;
    if (body.avatar_url !== undefined) updates.avatarUrl = body.avatar_url;

    const [updated] = await db
      .update(schema.users)
      .set(updates)
      .where(eq(schema.users.id, request.userId))
      .returning();

    reply.send({ data: updated });
  });

  // GET /users/me/achievements
  fastify.get('/users/me/achievements', { preHandler: [verifyJWT] }, async (request, reply) => {
    const userAchievements = await db.query.userAchievements.findMany({
      where: eq(schema.userAchievements.userId, request.userId),
      with: { achievement: true },
    });

    // Also return all available achievements with earned status
    const allAchievements = await db.query.achievements.findMany();

    const earnedIds = new Set(userAchievements.map((ua) => ua.achievementId));

    const result = allAchievements.map((a) => ({
      ...a,
      earned: earnedIds.has(a.id),
      earned_at: userAchievements.find((ua) => ua.achievementId === a.id)?.earnedAt ?? null,
    }));

    reply.send({ data: result });
  });

  // GET /users/me/entitlements
  fastify.get('/users/me/entitlements', { preHandler: [verifyJWT] }, async (request, reply) => {
    const user = await db.query.users.findFirst({
      where: eq(schema.users.id, request.userId),
      columns: { tier: true, tierSource: true, tierExpiresAt: true },
    });

    if (!user) throw new NotFoundError('User');

    const features = {
      explorer: ['basic_itinerary', 'basic_translation', 'map_view'],
      voyager: ['unlimited_trips', 'ocr_translation', 'phrasebook', 'custom_tasks', 'themes', 'share_trips'],
      nomad_pro: ['social_intelligence', 'ai_assistant', 'live_updates', 'concurrent_generation'],
    };

    const tierFeatures = [
      ...features.explorer,
      ...(user.tier !== 'explorer' ? features.voyager : []),
      ...(user.tier === 'nomad_pro' ? features.nomad_pro : []),
    ];

    reply.send({
      data: {
        tier: user.tier,
        tier_source: user.tierSource,
        tier_expires_at: user.tierExpiresAt,
        features: tierFeatures,
      },
    });
  });

  // DELETE /users/me — GDPR account deletion
  fastify.delete('/users/me', { preHandler: [verifyJWT] }, async (request, reply) => {
    const { userId } = request;

    // Soft delete — hard delete happens via scheduled job after 30 days
    await db
      .update(schema.users)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(schema.users.id, userId));

    // Invalidate Supabase session
    await supabaseAdmin.auth.admin.deleteUser(userId);

    const token = request.headers.authorization?.slice(7) ?? '';
    await blacklistToken(token, 86400 * 30);

    reply.code(204).send();
  });

  // PATCH /settings/theme [Voyager+]
  fastify.patch(
    '/settings/theme',
    { preHandler: [verifyJWT, requireTier('voyager')] },
    async (request, reply) => {
      const { theme } = UpdateThemeSchema.parse(request.body);

      await db
        .insert(schema.themePreferences)
        .values({ userId: request.userId, activeTheme: theme })
        .onConflictDoUpdate({
          target: schema.themePreferences.userId,
          set: { activeTheme: theme, updatedAt: new Date() },
        });

      await db
        .update(schema.users)
        .set({ theme, updatedAt: new Date() })
        .where(eq(schema.users.id, request.userId));

      reply.send({ data: { theme } });
    },
  );

  // PATCH /settings/category-colours [Voyager+]
  fastify.patch(
    '/settings/category-colours',
    { preHandler: [verifyJWT, requireTier('voyager')] },
    async (request, reply) => {
      const colours = UpdateCategoryColoursSchema.parse(request.body);

      await db
        .update(schema.users)
        .set({ categoryColours: colours, updatedAt: new Date() })
        .where(eq(schema.users.id, request.userId));

      reply.send({ data: { category_colours: colours } });
    },
  );

  // POST /notifications/register-token
  fastify.post('/notifications/register-token', { preHandler: [verifyJWT] }, async (request, reply) => {
    // Store FCM/APNs tokens — stored in Redis for push notification service
    const { token, platform } = request.body as { token: string; platform: 'ios' | 'android' };
    const key = `push:token:${request.userId}:${platform}`;
    await import('../plugins/redis.js').then(({ redis }) =>
      redis.setex(key, 86400 * 365, token),
    );
    reply.code(201).send({ data: { registered: true } });
  });

  // DELETE /notifications/register-token
  fastify.delete('/notifications/register-token', { preHandler: [verifyJWT] }, async (request, reply) => {
    const { platform } = request.body as { platform: 'ios' | 'android' };
    const key = `push:token:${request.userId}:${platform}`;
    await import('../plugins/redis.js').then(({ redis }) => redis.del(key));
    reply.code(204).send();
  });
}
