import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { eq, and, asc } from 'drizzle-orm';
import { db, schema } from '../db/index.js';
import { verifyJWT, requireTier } from '../auth/middleware.js';
import { NotFoundError, ForbiddenError } from '../errors/index.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

async function assertTripOwner(tripId: string, userId: string) {
  const trip = await db.query.trips.findFirst({
    where: and(eq(schema.trips.id, tripId), eq(schema.trips.userId, userId)),
    columns: { id: true },
  });
  if (!trip) throw new NotFoundError('Trip');
}

async function assertDayOwner(dayId: string, tripId: string) {
  const day = await db.query.itineraryDays.findFirst({
    where: and(eq(schema.itineraryDays.id, dayId), eq(schema.itineraryDays.tripId, tripId)),
    columns: { id: true },
  });
  if (!day) throw new NotFoundError('Day');
  return day;
}

// ── Schemas ───────────────────────────────────────────────────────────────────

const UpdateDaySchema = z.object({
  title: z.string().optional(),
  summary: z.string().optional(),
});

const CreateTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  category: z
    .enum(['food', 'landmark', 'transport', 'culture', 'budget', 'accommodation', 'general'])
    .default('general'),
  start_time: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional(),
  end_time: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional(),
  duration_minutes: z.number().int().positive().optional(),
  venue_id: z.string().uuid().optional(),
  estimated_cost: z.number().nonnegative().optional(),
  currency: z.string().length(3).optional(),
  position: z.number().int().nonneg().optional(),
});

const UpdateTaskSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  category: z
    .enum(['food', 'landmark', 'transport', 'culture', 'budget', 'accommodation', 'general'])
    .optional(),
  start_time: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional(),
  end_time: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional(),
  is_completed: z.boolean().optional(),
  actual_cost: z.number().nonnegative().optional(),
  estimated_cost: z.number().nonnegative().optional(),
  tips: z.string().optional(),
});

const ReorderTasksSchema = z.object({
  task_ids: z.array(z.string().uuid()).min(1),
});

// ── Routes ────────────────────────────────────────────────────────────────────

export async function itineraryRoutes(fastify: FastifyInstance) {
  // GET /trips/:tripId/days
  fastify.get('/trips/:tripId/days', { preHandler: [verifyJWT] }, async (request, reply) => {
    const { tripId } = request.params as { tripId: string };
    await assertTripOwner(tripId, request.userId);

    const days = await db.query.itineraryDays.findMany({
      where: eq(schema.itineraryDays.tripId, tripId),
      with: {
        tasks: {
          orderBy: [asc(schema.tasks.position)],
          with: { venue: true },
        },
      },
      orderBy: [asc(schema.itineraryDays.dayNumber)],
    });

    reply.send({ data: days });
  });

  // GET /trips/:tripId/days/:dayId
  fastify.get('/trips/:tripId/days/:dayId', { preHandler: [verifyJWT] }, async (request, reply) => {
    const { tripId, dayId } = request.params as { tripId: string; dayId: string };
    await assertTripOwner(tripId, request.userId);

    const day = await db.query.itineraryDays.findFirst({
      where: and(
        eq(schema.itineraryDays.id, dayId),
        eq(schema.itineraryDays.tripId, tripId),
      ),
      with: {
        tasks: {
          orderBy: [asc(schema.tasks.position)],
          with: { venue: true },
        },
      },
    });

    if (!day) throw new NotFoundError('Day');
    reply.send({ data: day });
  });

  // PATCH /trips/:tripId/days/:dayId
  fastify.patch('/trips/:tripId/days/:dayId', { preHandler: [verifyJWT] }, async (request, reply) => {
    const { tripId, dayId } = request.params as { tripId: string; dayId: string };
    await assertTripOwner(tripId, request.userId);
    await assertDayOwner(dayId, tripId);

    const body = UpdateDaySchema.parse(request.body);

    const [updated] = await db
      .update(schema.itineraryDays)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(schema.itineraryDays.id, dayId))
      .returning();

    reply.send({ data: updated });
  });

  // GET /trips/:tripId/days/:dayId/tasks
  fastify.get('/trips/:tripId/days/:dayId/tasks', { preHandler: [verifyJWT] }, async (request, reply) => {
    const { tripId, dayId } = request.params as { tripId: string; dayId: string };
    await assertTripOwner(tripId, request.userId);

    const tasks = await db.query.tasks.findMany({
      where: and(eq(schema.tasks.dayId, dayId), eq(schema.tasks.tripId, tripId)),
      orderBy: [asc(schema.tasks.position)],
      with: { venue: true },
    });

    reply.send({ data: tasks });
  });

  // POST /trips/:tripId/days/:dayId/tasks [Voyager+]
  fastify.post(
    '/trips/:tripId/days/:dayId/tasks',
    { preHandler: [verifyJWT, requireTier('voyager')] },
    async (request, reply) => {
      const { tripId, dayId } = request.params as { tripId: string; dayId: string };
      await assertTripOwner(tripId, request.userId);
      await assertDayOwner(dayId, tripId);

      const body = CreateTaskSchema.parse(request.body);

      // Get max position
      const existing = await db.query.tasks.findMany({
        where: eq(schema.tasks.dayId, dayId),
        columns: { position: true },
        orderBy: [asc(schema.tasks.position)],
      });

      const position = body.position ?? (existing.length > 0
        ? (existing[existing.length - 1]?.position ?? 0) + 1
        : 0);

      const [task] = await db
        .insert(schema.tasks)
        .values({
          dayId,
          tripId,
          position,
          title: body.title,
          description: body.description,
          category: body.category,
          startTime: body.start_time,
          endTime: body.end_time,
          durationMinutes: body.duration_minutes,
          venueId: body.venue_id,
          estimatedCost: body.estimated_cost?.toString(),
          currency: body.currency,
          isCustom: true,
        })
        .returning();

      reply.code(201).send({ data: task });
    },
  );

  // PATCH /trips/:tripId/days/:dayId/tasks/:taskId
  fastify.patch(
    '/trips/:tripId/days/:dayId/tasks/:taskId',
    { preHandler: [verifyJWT] },
    async (request, reply) => {
      const { tripId, dayId, taskId } = request.params as {
        tripId: string;
        dayId: string;
        taskId: string;
      };
      await assertTripOwner(tripId, request.userId);

      const body = UpdateTaskSchema.parse(request.body);

      const task = await db.query.tasks.findFirst({
        where: and(eq(schema.tasks.id, taskId), eq(schema.tasks.dayId, dayId)),
        columns: { id: true },
      });
      if (!task) throw new NotFoundError('Task');

      const updates: Partial<typeof schema.tasks.$inferInsert> = {};
      if (body.title !== undefined) updates.title = body.title;
      if (body.description !== undefined) updates.description = body.description;
      if (body.category !== undefined) updates.category = body.category;
      if (body.start_time !== undefined) updates.startTime = body.start_time;
      if (body.end_time !== undefined) updates.endTime = body.end_time;
      if (body.is_completed !== undefined) {
        updates.isCompleted = body.is_completed;
        updates.completedAt = body.is_completed ? new Date() : null;
      }
      if (body.actual_cost !== undefined) updates.actualCost = body.actual_cost.toString();
      if (body.estimated_cost !== undefined) updates.estimatedCost = body.estimated_cost.toString();
      if (body.tips !== undefined) updates.tips = body.tips;
      updates.updatedAt = new Date();

      const [updated] = await db
        .update(schema.tasks)
        .set(updates)
        .where(eq(schema.tasks.id, taskId))
        .returning();

      reply.send({ data: updated });
    },
  );

  // DELETE /trips/:tripId/days/:dayId/tasks/:taskId
  fastify.delete(
    '/trips/:tripId/days/:dayId/tasks/:taskId',
    { preHandler: [verifyJWT] },
    async (request, reply) => {
      const { tripId, dayId, taskId } = request.params as {
        tripId: string;
        dayId: string;
        taskId: string;
      };
      await assertTripOwner(tripId, request.userId);

      const task = await db.query.tasks.findFirst({
        where: and(
          eq(schema.tasks.id, taskId),
          eq(schema.tasks.dayId, dayId),
          eq(schema.tasks.tripId, tripId),
        ),
        columns: { id: true },
      });
      if (!task) throw new NotFoundError('Task');

      await db.delete(schema.tasks).where(eq(schema.tasks.id, taskId));
      reply.code(204).send();
    },
  );

  // POST /trips/:tripId/days/:dayId/tasks/reorder
  fastify.post(
    '/trips/:tripId/days/:dayId/tasks/reorder',
    { preHandler: [verifyJWT] },
    async (request, reply) => {
      const { tripId, dayId } = request.params as { tripId: string; dayId: string };
      await assertTripOwner(tripId, request.userId);

      const { task_ids } = ReorderTasksSchema.parse(request.body);

      // Update positions in order
      await Promise.all(
        task_ids.map((id, idx) =>
          db
            .update(schema.tasks)
            .set({ position: idx, updatedAt: new Date() })
            .where(
              and(eq(schema.tasks.id, id), eq(schema.tasks.dayId, dayId)),
            ),
        ),
      );

      reply.send({ data: { reordered: task_ids.length } });
    },
  );
}
