import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import type Stripe from 'stripe';
import { db, schema } from '../db/index.js';
import { verifyJWT } from '../auth/middleware.js';
import { config } from '../config/index.js';
import { NotFoundError, ValidationError } from '../errors/index.js';
import {
  stripe,
  createCheckoutSession,
  getBillingPortalUrl,
  cancelSubscription,
  handleCheckoutComplete,
  syncStripeSubscription,
  handlePaymentFailed,
} from '../services/stripe.js';

// ── Validation schemas ────────────────────────────────────────────────────────

const SubscribeSchema = z.object({
  price_id: z.string().min(1),
  success_url: z.string().url(),
  cancel_url: z.string().url(),
});

// ── Plan definitions ──────────────────────────────────────────────────────────

const PLANS = [
  {
    id: 'explorer',
    name: 'Explorer',
    price: 0,
    currency: 'GBP',
    billing: 'free',
    features: [
      'Up to 3 trips',
      'Up to 3 days per trip',
      '3 AI generations lifetime',
      'Basic itinerary',
    ],
  },
  {
    id: 'voyager',
    name: 'Voyager',
    price: 999,
    currency: 'GBP',
    billing: 'one_time',
    price_id: config.stripe.prices.voyagerLifetime,
    features: [
      'Unlimited trips',
      'Up to 14 days per trip',
      'Unlimited AI generations',
      'Day regeneration',
      'Trip sharing',
      'Offline access',
    ],
  },
  {
    id: 'nomad_pro',
    name: 'Nomad Pro',
    billing: 'subscription',
    prices: [
      { id: config.stripe.prices.proMonthly, amount: 799, currency: 'GBP', interval: 'month' },
      { id: config.stripe.prices.proAnnual, amount: 6999, currency: 'GBP', interval: 'year' },
    ],
    features: [
      'Everything in Voyager',
      'AI trip assistant (chat)',
      'Social intelligence feed',
      'Budget tracking',
      'Real-time translator',
      'Priority AI queue',
    ],
  },
];

// ── Route registration ────────────────────────────────────────────────────────

export async function subscriptionRoutes(fastify: FastifyInstance) {
  // GET /subscriptions/plans — public, no auth required
  fastify.get('/subscriptions/plans', async (_request, reply) => {
    reply.send({ data: PLANS });
  });

  // GET /subscriptions/status — get current user's subscription status
  fastify.get('/subscriptions/status', { preHandler: [verifyJWT] }, async (request, reply) => {
    const { userId, userTier } = request;

    const subscription = await db.query.subscriptions.findFirst({
      where: eq(schema.subscriptions.userId, userId),
      columns: {
        id: true,
        provider: true,
        productId: true,
        status: true,
        currentPeriodStart: true,
        currentPeriodEnd: true,
        cancelAtPeriodEnd: true,
        createdAt: true,
      },
    });

    reply.send({
      data: {
        tier: userTier,
        subscription: subscription ?? null,
      },
    });
  });

  // POST /subscriptions/subscribe — create Stripe checkout session
  fastify.post('/subscriptions/subscribe', { preHandler: [verifyJWT] }, async (request, reply) => {
    const { userId } = request;
    const body = SubscribeSchema.parse(request.body);

    const user = await db.query.users.findFirst({
      where: eq(schema.users.id, userId),
      columns: { email: true },
    });

    if (!user) throw new NotFoundError('User');

    const checkoutUrl = await createCheckoutSession({
      userId,
      userEmail: user.email,
      priceId: body.price_id,
      successUrl: body.success_url,
      cancelUrl: body.cancel_url,
    });

    reply.send({ data: { checkout_url: checkoutUrl } });
  });

  // POST /subscriptions/cancel — cancel at period end
  fastify.post('/subscriptions/cancel', { preHandler: [verifyJWT] }, async (request, reply) => {
    const { userId } = request;

    await cancelSubscription(userId);

    reply.send({ data: { message: 'Subscription will cancel at the end of the current period' } });
  });

  // GET /subscriptions/portal — Stripe billing portal URL
  fastify.get('/subscriptions/portal', { preHandler: [verifyJWT] }, async (request, reply) => {
    const { userId } = request;
    const { return_url } = request.query as { return_url?: string };

    if (!return_url) {
      throw new ValidationError('return_url query parameter is required');
    }

    const sub = await db.query.subscriptions.findFirst({
      where: eq(schema.subscriptions.userId, userId),
      columns: { providerCustomerId: true },
    });

    if (!sub?.providerCustomerId) {
      throw new NotFoundError('Stripe customer');
    }

    const portalUrl = await getBillingPortalUrl(sub.providerCustomerId, return_url);
    reply.send({ data: { portal_url: portalUrl } });
  });

  // POST /subscriptions/webhook — Stripe webhook (raw body required)
  fastify.post(
    '/subscriptions/webhook',
    { config: { rawBody: true } },
    async (request, reply) => {
      const sig = request.headers['stripe-signature'] as string | undefined;

      if (!sig) {
        reply.code(400).send({ error: 'missing_signature' });
        return;
      }

      let event: Stripe.Event;

      try {
        const rawBody = (request as { rawBody?: string | Buffer }).rawBody;
        if (!rawBody) throw new Error('Missing raw body');
        event = stripe.webhooks.constructEvent(rawBody, sig, config.stripe.webhookSecret);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Webhook verification failed';
        fastify.log.warn({ err }, 'Stripe webhook verification failed');
        reply.code(400).send({ error: 'webhook_verification_failed', message: msg });
        return;
      }

      fastify.log.info({ type: event.type, id: event.id }, 'Stripe webhook received');

      try {
        switch (event.type) {
          case 'checkout.session.completed':
            await handleCheckoutComplete(event.data.object as Stripe.Checkout.Session);
            break;

          case 'customer.subscription.updated':
          case 'customer.subscription.deleted':
            await syncStripeSubscription(event.data.object as Stripe.Subscription);
            break;

          case 'invoice.payment_failed':
            await handlePaymentFailed(event.data.object as Stripe.Invoice);
            break;

          default:
            fastify.log.debug({ type: event.type }, 'Unhandled Stripe event type');
        }
      } catch (err) {
        fastify.log.error({ err, eventType: event.type }, 'Error processing Stripe webhook');
        // Return 500 so Stripe retries
        reply.code(500).send({ error: 'webhook_processing_failed' });
        return;
      }

      reply.send({ received: true });
    },
  );
}
