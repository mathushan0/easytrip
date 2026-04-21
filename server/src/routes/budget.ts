import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { eq, and, sum, sql } from 'drizzle-orm';
import { db, schema } from '../db/index.js';
import { verifyJWT } from '../auth/middleware.js';
import { NotFoundError } from '../errors/index.js';
import { getExchangeRates } from '../services/translate.js';

const UpdateBudgetSchema = z.object({
  total_amount: z.number().positive().optional(),
  currency: z.string().length(3).optional(),
  food_allocation: z.number().nonnegative().optional(),
  transport_allocation: z.number().nonnegative().optional(),
  accommodation_allocation: z.number().nonnegative().optional(),
  activities_allocation: z.number().nonnegative().optional(),
  other_allocation: z.number().nonnegative().optional(),
});

const CreateExpenseSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().length(3),
  category: z.enum(['food', 'transport', 'accommodation', 'activities', 'shopping', 'other']),
  description: z.string().optional(),
  venue_id: z.string().uuid().optional(),
  task_id: z.string().uuid().optional(),
  logged_at: z.string().datetime().optional(),
});

const UpdateExpenseSchema = CreateExpenseSchema.partial();

async function assertTripOwner(tripId: string, userId: string) {
  const trip = await db.query.trips.findFirst({
    where: and(eq(schema.trips.id, tripId), eq(schema.trips.userId, userId)),
    columns: { id: true, budgetCurrency: true },
  });
  if (!trip) throw new NotFoundError('Trip');
  return trip;
}

export async function budgetRoutes(fastify: FastifyInstance) {
  // GET /trips/:tripId/budget
  fastify.get('/trips/:tripId/budget', { preHandler: [verifyJWT] }, async (request, reply) => {
    const { tripId } = request.params as { tripId: string };
    const trip = await assertTripOwner(tripId, request.userId);

    const budget = await db.query.budgets.findFirst({
      where: eq(schema.budgets.tripId, tripId),
    });

    // Calculate spending by category
    const spending = await db
      .select({
        category: schema.expenses.category,
        total: sum(schema.expenses.amountInBase),
      })
      .from(schema.expenses)
      .where(eq(schema.expenses.tripId, tripId))
      .groupBy(schema.expenses.category);

    const totalSpent = spending.reduce((acc, s) => acc + parseFloat(s.total ?? '0'), 0);

    reply.send({
      data: {
        budget,
        spending: Object.fromEntries(spending.map((s) => [s.category, parseFloat(s.total ?? '0')])),
        total_spent: totalSpent,
        remaining: budget ? parseFloat(budget.totalAmount) - totalSpent : null,
      },
    });
  });

  // PATCH /trips/:tripId/budget
  fastify.patch('/trips/:tripId/budget', { preHandler: [verifyJWT] }, async (request, reply) => {
    const { tripId } = request.params as { tripId: string };
    await assertTripOwner(tripId, request.userId);

    const body = UpdateBudgetSchema.parse(request.body);

    const existing = await db.query.budgets.findFirst({
      where: eq(schema.budgets.tripId, tripId),
    });

    if (existing) {
      const [updated] = await db
        .update(schema.budgets)
        .set({
          totalAmount: body.total_amount?.toString() ?? existing.totalAmount,
          currency: body.currency ?? existing.currency,
          foodAllocation: body.food_allocation?.toString(),
          transportAllocation: body.transport_allocation?.toString(),
          accommodationAllocation: body.accommodation_allocation?.toString(),
          activitiesAllocation: body.activities_allocation?.toString(),
          otherAllocation: body.other_allocation?.toString(),
          updatedAt: new Date(),
        })
        .where(eq(schema.budgets.id, existing.id))
        .returning();
      reply.send({ data: updated });
    } else {
      const [created] = await db
        .insert(schema.budgets)
        .values({
          tripId,
          totalAmount: body.total_amount?.toString() ?? '0',
          currency: body.currency ?? 'GBP',
          foodAllocation: body.food_allocation?.toString(),
          transportAllocation: body.transport_allocation?.toString(),
          accommodationAllocation: body.accommodation_allocation?.toString(),
          activitiesAllocation: body.activities_allocation?.toString(),
          otherAllocation: body.other_allocation?.toString(),
        })
        .returning();
      reply.code(201).send({ data: created });
    }
  });

  // POST /trips/:tripId/expenses
  fastify.post('/trips/:tripId/expenses', { preHandler: [verifyJWT] }, async (request, reply) => {
    const { tripId } = request.params as { tripId: string };
    const trip = await assertTripOwner(tripId, request.userId);

    const body = CreateExpenseSchema.parse(request.body);

    // Convert to base currency
    let amountInBase = body.amount;
    let exchangeRate = 1;
    const baseCurrency = trip.budgetCurrency;

    if (body.currency !== baseCurrency) {
      try {
        const rates = await getExchangeRates(baseCurrency);
        exchangeRate = 1 / (rates[body.currency] ?? 1);
        amountInBase = body.amount * exchangeRate;
      } catch {
        // Store original amount if conversion fails
      }
    }

    const [expense] = await db
      .insert(schema.expenses)
      .values({
        tripId,
        userId: request.userId,
        amount: body.amount.toString(),
        currency: body.currency,
        amountInBase: amountInBase.toString(),
        exchangeRate: exchangeRate.toString(),
        category: body.category,
        description: body.description,
        venueId: body.venue_id,
        taskId: body.task_id,
        loggedAt: body.logged_at ? new Date(body.logged_at) : new Date(),
      })
      .returning();

    reply.code(201).send({ data: expense });
  });

  // GET /trips/:tripId/expenses
  fastify.get('/trips/:tripId/expenses', { preHandler: [verifyJWT] }, async (request, reply) => {
    const { tripId } = request.params as { tripId: string };
    await assertTripOwner(tripId, request.userId);

    const { category, limit = '100', offset = '0' } = request.query as Record<string, string>;

    const conditions = [eq(schema.expenses.tripId, tripId)];
    if (category) {
      conditions.push(
        eq(
          schema.expenses.category,
          category as typeof schema.expenses.$inferSelect['category'],
        ),
      );
    }

    const expenses = await db.query.expenses.findMany({
      where: and(...conditions),
      orderBy: [schema.expenses.loggedAt],
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
    });

    reply.send({ data: expenses });
  });

  // PATCH /trips/:tripId/expenses/:id
  fastify.patch(
    '/trips/:tripId/expenses/:id',
    { preHandler: [verifyJWT] },
    async (request, reply) => {
      const { tripId, id } = request.params as { tripId: string; id: string };
      await assertTripOwner(tripId, request.userId);

      const body = UpdateExpenseSchema.parse(request.body);

      const expense = await db.query.expenses.findFirst({
        where: and(eq(schema.expenses.id, id), eq(schema.expenses.tripId, tripId)),
      });
      if (!expense) throw new NotFoundError('Expense');

      const [updated] = await db
        .update(schema.expenses)
        .set({
          amount: body.amount?.toString(),
          currency: body.currency,
          category: body.category,
          description: body.description,
          loggedAt: body.logged_at ? new Date(body.logged_at) : undefined,
        })
        .where(eq(schema.expenses.id, id))
        .returning();

      reply.send({ data: updated });
    },
  );

  // DELETE /trips/:tripId/expenses/:id
  fastify.delete(
    '/trips/:tripId/expenses/:id',
    { preHandler: [verifyJWT] },
    async (request, reply) => {
      const { tripId, id } = request.params as { tripId: string; id: string };
      await assertTripOwner(tripId, request.userId);

      await db
        .delete(schema.expenses)
        .where(and(eq(schema.expenses.id, id), eq(schema.expenses.tripId, tripId)));

      reply.code(204).send();
    },
  );

  // GET /currency/rates
  fastify.get('/currency/rates', { preHandler: [verifyJWT] }, async (request, reply) => {
    const { base = 'GBP' } = request.query as { base?: string };
    const rates = await getExchangeRates(base);
    reply.send({ data: { base, rates } });
  });
}
