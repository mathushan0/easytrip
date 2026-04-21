import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { eq, and, isNull, count, desc } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { db, schema } from '../db/index.js';
import { verifyJWT, requireTier } from '../auth/middleware.js';
import { NotFoundError, UpgradeRequiredError } from '../errors/index.js';
import { Queue } from 'bullmq';
import { createRedisClient } from '../plugins/redis.js';
import { redis } from '../plugins/redis.js';
import crypto from 'crypto';

// ── Validation schemas ────────────────────────────────────────────────────────

const CreateTripSchema = z.object({
  destination: z.string().min(2),
  country_code: z.string().length(2),
  city: z.string().optional(),
  destination_lat: z.number().optional(),
  destination_lng: z.number().optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  timezone: z.string().default('UTC'),
  budget_amount: z.number().positive().optional(),
  budget_currency: z.string().length(3).default('GBP'),
  trip_type: z.enum(['solo', 'couple', 'family', 'group', 'business']).optional(),
  travel_preferences: z
    .object({
      dietary: z.array(z.string()).default([]),
      pace: z.enum(['relaxed', 'moderate', 'packed']).default('moderate'),
      interests: z.array(z.string()).default([]),
    })
    .optional(),
});

const UpdateTripSchema = CreateTripSchema.partial();

const GenerateItinerarySchema = z.object({
  force_regenerate: z.boolean().default(false),
});

// ── Generation queue ──────────────────────────────────────────────────────────

const generationQueue = new Queue('itinerary:generation', {
  connection: createRedisClient(),
});

// ── Route registration ────────────────────────────────────────────────────────

export async function tripsRoutes(fastify: FastifyInstance) {
  // GET /trips — list user's trips
  fastify.get('/trips', { preHandler: [verifyJWT] }, async (request, reply) => {
    const { userId } = request;
    const { page = '1', limit = '20', status } = request.query as Record<string, string>;

    const pageNum = parseInt(page, 10);
    const limitNum = Math.min(parseInt(limit, 10), 50);
    const offset = (pageNum - 1) * limitNum;

    const conditions = [eq(schema.trips.userId, userId), isNull(schema.trips.deletedAt)];
    if (status) {
      conditions.push(
        eq(schema.trips.status, status as 'draft' | 'active' | 'archived'),
      );
    }

    const [trips, totalResult] = await Promise.all([
      db.query.trips.findMany({
        where: and(...conditions),
        orderBy: [desc(schema.trips.createdAt)],
        limit: limitNum,
        offset,
      }),
      db.select({ count: count() }).from(schema.trips).where(and(...conditions)),
    ]);

    const total = totalResult[0]?.count ?? 0;

    reply.send({
      data: trips,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        has_more: offset + trips.length < total,
      },
    });
  });

  // POST /trips — create new trip
  fastify.post('/trips', { preHandler: [verifyJWT] }, async (request, reply) => {
    const { userId, userTier } = request;
    const body = CreateTripSchema.parse(request.body);

    // Enforce trip limit for explorer tier
    if (userTier === 'explorer') {
      const [result] = await db
        .select({ count: count() })
        .from(schema.trips)
        .where(and(eq(schema.trips.userId, userId), isNull(schema.trips.deletedAt)));
      if ((result?.count ?? 0) >= 3) {
        throw new UpgradeRequiredError('voyager', 'trip_limit');
      }
    }

    // Calculate duration
    const start = new Date(body.start_date);
    const end = new Date(body.end_date);
    const durationDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // Enforce day limit for explorer tier
    if (userTier === 'explorer' && durationDays > 3) {
      throw new UpgradeRequiredError('voyager', 'day_limit');
    }

    const [trip] = await db
      .insert(schema.trips)
      .values({
        userId,
        destination: body.destination,
        countryCode: body.country_code,
        city: body.city,
        destinationLat: body.destination_lat?.toString(),
        destinationLng: body.destination_lng?.toString(),
        startDate: body.start_date,
        endDate: body.end_date,
        durationDays,
        timezone: body.timezone,
        budgetAmount: body.budget_amount?.toString(),
        budgetCurrency: body.budget_currency,
        tripType: body.trip_type,
        travelPreferences: body.travel_preferences ?? null,
        status: 'draft',
      })
      .returning();

    // Update user stats
    await db
      .update(schema.users)
      .set({
        totalTrips: db.$count(schema.trips, and(eq(schema.trips.userId, userId), isNull(schema.trips.deletedAt))),
        updatedAt: new Date(),
      })
      .where(eq(schema.users.id, userId));

    reply.code(201).send({ data: trip });
  });

  // GET /trips/:tripId
  fastify.get('/trips/:tripId', { preHandler: [verifyJWT] }, async (request, reply) => {
    const { tripId } = request.params as { tripId: string };
    const { userId } = request;

    const trip = await db.query.trips.findFirst({
      where: and(
        eq(schema.trips.id, tripId),
        eq(schema.trips.userId, userId),
        isNull(schema.trips.deletedAt),
      ),
      with: {
        days: {
          with: { tasks: { orderBy: [schema.tasks.position] } },
          orderBy: [schema.itineraryDays.dayNumber],
        },
        budget: true,
      },
    });

    if (!trip) throw new NotFoundError('Trip');
    reply.send({ data: trip });
  });

  // PATCH /trips/:tripId
  fastify.patch('/trips/:tripId', { preHandler: [verifyJWT] }, async (request, reply) => {
    const { tripId } = request.params as { tripId: string };
    const { userId, userTier } = request;
    const body = UpdateTripSchema.parse(request.body);

    const existing = await db.query.trips.findFirst({
      where: and(
        eq(schema.trips.id, tripId),
        eq(schema.trips.userId, userId),
        isNull(schema.trips.deletedAt),
      ),
    });
    if (!existing) throw new NotFoundError('Trip');

    const updates: Partial<typeof schema.trips.$inferInsert> = {};
    if (body.destination) updates.destination = body.destination;
    if (body.country_code) updates.countryCode = body.country_code;
    if (body.city !== undefined) updates.city = body.city;
    if (body.start_date) updates.startDate = body.start_date;
    if (body.end_date) updates.endDate = body.end_date;
    if (body.budget_amount !== undefined) updates.budgetAmount = body.budget_amount?.toString();
    if (body.budget_currency) updates.budgetCurrency = body.budget_currency;
    if (body.trip_type) updates.tripType = body.trip_type;
    if (body.travel_preferences) updates.travelPreferences = body.travel_preferences;
    updates.updatedAt = new Date();

    const [updated] = await db
      .update(schema.trips)
      .set(updates)
      .where(eq(schema.trips.id, tripId))
      .returning();

    reply.send({ data: updated });
  });

  // DELETE /trips/:tripId — soft delete
  fastify.delete('/trips/:tripId', { preHandler: [verifyJWT] }, async (request, reply) => {
    const { tripId } = request.params as { tripId: string };
    const { userId } = request;

    const existing = await db.query.trips.findFirst({
      where: and(
        eq(schema.trips.id, tripId),
        eq(schema.trips.userId, userId),
        isNull(schema.trips.deletedAt),
      ),
    });
    if (!existing) throw new NotFoundError('Trip');

    await db
      .update(schema.trips)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(schema.trips.id, tripId));

    reply.code(204).send();
  });

  // POST /trips/:tripId/generate — trigger AI itinerary generation
  fastify.post('/trips/:tripId/generate', { preHandler: [verifyJWT], config: { rateLimit: { max: 10, timeWindow: '1 minute' } } }, async (request, reply) => {
    const { tripId } = request.params as { tripId: string };
    const { userId, userTier } = request;
    const body = GenerateItinerarySchema.parse(request.body ?? {});

    const trip = await db.query.trips.findFirst({
      where: and(
        eq(schema.trips.id, tripId),
        eq(schema.trips.userId, userId),
        isNull(schema.trips.deletedAt),
      ),
    });
    if (!trip) throw new NotFoundError('Trip');

    // Explorer tier: check generation limit
    if (userTier === 'explorer') {
      const genCount = await redis.incr(`gen:count:${userId}`);
      if (genCount === 1) await redis.expire(`gen:count:${userId}`, 60 * 60 * 24 * 365 * 10); // Lifetime
      if (genCount > 3) {
        throw new UpgradeRequiredError('voyager', 'generation_limit');
      }
    }

    const jobId = randomUUID();

    await generationQueue.add(
      `generate:${tripId}`,
      { tripId, userId, userTier, jobId, forceRegenerate: body.force_regenerate },
      {
        jobId,
        priority: userTier === 'nomad_pro' ? 1 : userTier === 'voyager' ? 5 : 10,
        attempts: 2,
        backoff: { type: 'fixed', delay: 5000 },
      },
    );

    // Mark trip as being generated
    await db
      .update(schema.trips)
      .set({ status: 'draft', updatedAt: new Date() })
      .where(eq(schema.trips.id, tripId));

    reply.code(202).send({ data: { jobId, status: 'queued' } });
  });

  // GET /trips/:tripId/status — generation status polling fallback
  fastify.get('/trips/:tripId/status', { preHandler: [verifyJWT] }, async (request, reply) => {
    const { tripId } = request.params as { tripId: string };
    const { userId } = request;

    const trip = await db.query.trips.findFirst({
      where: and(
        eq(schema.trips.id, tripId),
        eq(schema.trips.userId, userId),
      ),
      columns: { id: true, status: true, aiModelUsed: true, destinationConfidence: true },
    });

    if (!trip) throw new NotFoundError('Trip');
    reply.send({ data: trip });
  });

  // POST /trips/:tripId/regenerate-day [Voyager+]
  fastify.post(
    '/trips/:tripId/regenerate-day',
    { preHandler: [verifyJWT, requireTier('voyager')] },
    async (request, reply) => {
      const { tripId } = request.params as { tripId: string };
      const { userId } = request;
      const { day_number } = request.body as { day_number: number };

      const trip = await db.query.trips.findFirst({
        where: and(eq(schema.trips.id, tripId), eq(schema.trips.userId, userId)),
      });
      if (!trip) throw new NotFoundError('Trip');

      const jobId = randomUUID();
      await generationQueue.add(
        `regenerate-day:${tripId}:${day_number}`,
        { tripId, userId, jobId, dayNumber: day_number, mode: 'single_day' },
        { jobId, priority: 3 },
      );

      reply.code(202).send({ data: { jobId, status: 'queued' } });
    },
  );

  // GET /trips/:tripId/share-token [Voyager+]
  fastify.get(
    '/trips/:tripId/share-token',
    { preHandler: [verifyJWT, requireTier('voyager')] },
    async (request, reply) => {
      const { tripId } = request.params as { tripId: string };
      const { userId } = request;

      let trip = await db.query.trips.findFirst({
        where: and(eq(schema.trips.id, tripId), eq(schema.trips.userId, userId)),
        columns: { id: true, shareToken: true, isShared: true },
      });
      if (!trip) throw new NotFoundError('Trip');

      if (!trip.shareToken) {
        const token = crypto.randomBytes(16).toString('hex');
        [trip] = await db
          .update(schema.trips)
          .set({ shareToken: token, isShared: true, updatedAt: new Date() })
          .where(eq(schema.trips.id, tripId))
          .returning();
      }

      reply.send({ data: { share_token: trip!.shareToken, share_url: `https://easytrip.app/share/${trip!.shareToken}` } });
    },
  );

  // GET /trips/shared/:token — public share view (no auth)
  fastify.get('/trips/shared/:token', async (request, reply) => {
    const { token } = request.params as { token: string };

    const trip = await db.query.trips.findFirst({
      where: and(
        eq(schema.trips.shareToken, token),
        eq(schema.trips.isShared, true),
        isNull(schema.trips.deletedAt),
      ),
      with: {
        days: {
          with: { tasks: { orderBy: [schema.tasks.position] } },
          orderBy: [schema.itineraryDays.dayNumber],
        },
      },
    });

    if (!trip) throw new NotFoundError('Shared trip');

    // Return limited data (no user info)
    reply.send({
      data: {
        destination: trip.destination,
        country_code: trip.countryCode,
        start_date: trip.startDate,
        end_date: trip.endDate,
        duration_days: trip.durationDays,
        days: trip.days,
      },
    });
  });
}
