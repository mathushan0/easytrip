import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { eq, and, isNull, asc } from 'drizzle-orm';
import { db, schema } from '../db/index.js';
import { verifyJWT, requireTier } from '../auth/middleware.js';
import { NotFoundError, ValidationError } from '../errors/index.js';
import { generateAssistantReply, type AssistantMessage } from '../services/ai.js';
import { redis } from '../plugins/redis.js';

// ── Validation schemas ────────────────────────────────────────────────────────

const ChatSchema = z.object({
  trip_id: z.string().uuid(),
  message: z.string().min(1).max(2000),
});

// ── Redis conversation key ────────────────────────────────────────────────────

function conversationKey(userId: string, tripId: string): string {
  return `assistant:conversation:${userId}:${tripId}`;
}

// ── Build trip context string ─────────────────────────────────────────────────

async function buildTripContext(tripId: string, userId: string): Promise<string> {
  const trip = await db.query.trips.findFirst({
    where: and(
      eq(schema.trips.id, tripId),
      eq(schema.trips.userId, userId),
      isNull(schema.trips.deletedAt),
    ),
    with: {
      days: {
        with: { tasks: { orderBy: [asc(schema.tasks.position)] } },
        orderBy: [asc(schema.itineraryDays.dayNumber)],
      },
    },
  });

  if (!trip) throw new NotFoundError('Trip');

  const lines: string[] = [
    `Destination: ${trip.destination} (${trip.countryCode})`,
    `Dates: ${trip.startDate} to ${trip.endDate} (${trip.durationDays} days)`,
    `Type: ${trip.tripType ?? 'unspecified'}`,
    `Budget: ${trip.budgetAmount ? `${trip.budgetCurrency} ${trip.budgetAmount}` : 'unspecified'}`,
  ];

  if (trip.travelPreferences) {
    const prefs = trip.travelPreferences as Record<string, unknown>;
    if (Array.isArray(prefs['dietary']) && prefs['dietary'].length > 0) {
      lines.push(`Dietary: ${(prefs['dietary'] as string[]).join(', ')}`);
    }
    if (Array.isArray(prefs['interests']) && prefs['interests'].length > 0) {
      lines.push(`Interests: ${(prefs['interests'] as string[]).join(', ')}`);
    }
  }

  if (trip.days && trip.days.length > 0) {
    lines.push('');
    lines.push('Itinerary summary:');
    for (const day of trip.days) {
      lines.push(`  Day ${day.dayNumber}: ${day.title} — ${day.summary ?? ''}`);
    }
  }

  return lines.join('\n');
}

// ── Route registration ────────────────────────────────────────────────────────

export async function aiAssistantRoutes(fastify: FastifyInstance) {
  // POST /assistant/chat — send message and get AI reply [Nomad Pro only]
  fastify.post(
    '/assistant/chat',
    {
      preHandler: [verifyJWT, requireTier('nomad_pro')],
      config: { rateLimit: { max: 10, timeWindow: '1 minute' } },
    },
    async (request, reply) => {
      const { userId } = request;
      const body = ChatSchema.parse(request.body);

      // Verify trip belongs to user
      const trip = await db.query.trips.findFirst({
        where: and(
          eq(schema.trips.id, body.trip_id),
          eq(schema.trips.userId, userId),
          isNull(schema.trips.deletedAt),
        ),
        columns: { id: true },
      });
      if (!trip) throw new NotFoundError('Trip');

      // Load conversation history from Redis
      const key = conversationKey(userId, body.trip_id);
      const rawHistory = await redis.get(key);
      const history: AssistantMessage[] = rawHistory ? (JSON.parse(rawHistory) as AssistantMessage[]) : [];

      // Append user message
      history.push({ role: 'user', content: body.message });

      // Enforce context window — keep last 20 messages
      const windowedHistory = history.slice(-20);

      // Build trip context
      const tripContext = await buildTripContext(body.trip_id, userId);

      // Call AI
      const result = await generateAssistantReply(windowedHistory, tripContext);

      // Append assistant reply
      windowedHistory.push({ role: 'assistant', content: result.content });

      // Persist conversation (24h TTL)
      await redis.setex(key, 60 * 60 * 24, JSON.stringify(windowedHistory));

      reply.send({
        data: {
          message: result.content,
          model_used: result.modelUsed,
          token_count: result.tokenCount,
          message_count: windowedHistory.length,
        },
      });
    },
  );

  // GET /assistant/conversations/:tripId — get chat history [Nomad Pro only]
  fastify.get(
    '/assistant/conversations/:tripId',
    { preHandler: [verifyJWT, requireTier('nomad_pro')] },
    async (request, reply) => {
      const { userId } = request;
      const { tripId } = request.params as { tripId: string };

      // Verify trip ownership
      const trip = await db.query.trips.findFirst({
        where: and(
          eq(schema.trips.id, tripId),
          eq(schema.trips.userId, userId),
          isNull(schema.trips.deletedAt),
        ),
        columns: { id: true },
      });
      if (!trip) throw new NotFoundError('Trip');

      const key = conversationKey(userId, tripId);
      const rawHistory = await redis.get(key);
      const history: AssistantMessage[] = rawHistory ? (JSON.parse(rawHistory) as AssistantMessage[]) : [];

      reply.send({
        data: {
          trip_id: tripId,
          messages: history,
          message_count: history.length,
        },
      });
    },
  );

  // DELETE /assistant/conversations/:tripId — clear chat history [Nomad Pro only]
  fastify.delete(
    '/assistant/conversations/:tripId',
    { preHandler: [verifyJWT, requireTier('nomad_pro')] },
    async (request, reply) => {
      const { userId } = request;
      const { tripId } = request.params as { tripId: string };

      // Verify trip ownership
      const trip = await db.query.trips.findFirst({
        where: and(
          eq(schema.trips.id, tripId),
          eq(schema.trips.userId, userId),
          isNull(schema.trips.deletedAt),
        ),
        columns: { id: true },
      });
      if (!trip) throw new NotFoundError('Trip');

      const key = conversationKey(userId, tripId);
      await redis.del(key);

      reply.code(204).send();
    },
  );
}
