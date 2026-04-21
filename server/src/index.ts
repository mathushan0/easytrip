import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import rawBody from 'fastify-raw-body';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter.js';
import { FastifyAdapter } from '@bull-board/fastify';
import { Queue } from 'bullmq';

import { config } from './config/index.js';
import { AppError, serializeError } from './errors/index.js';
import { redis, createRedisClient } from './plugins/redis.js';
import { initWebSocket } from './ws/index.js';

import { tripsRoutes } from './routes/trips.js';
import { userRoutes } from './routes/user.js';
import { itineraryRoutes } from './routes/itinerary.js';
import { budgetRoutes } from './routes/budget.js';
import { venueRoutes } from './routes/venues.js';
import { foodRoutes } from './routes/food.js';
import { transportRoutes } from './routes/transport.js';
import { translatorRoutes } from './routes/translator.js';
import { socialRoutes } from './routes/social.js';
import { subscriptionRoutes } from './routes/subscription.js';
import { aiAssistantRoutes } from './routes/ai-assistant.js';
import { iapRoutes } from './routes/iap.js';

const fastify = Fastify({
  logger: {
    level: config.logLevel,
    ...(config.env === 'development'
      ? {
          transport: {
            target: 'pino-pretty',
            options: { colorize: true, translateTime: 'HH:MM:ss', ignore: 'pid,hostname' },
          },
        }
      : {}),
  },
});

async function build() {
  // ── Raw body (needed for Stripe webhooks) ────────────────────────────────────
  await fastify.register(rawBody, {
    field: 'rawBody',
    global: false,
    encoding: 'utf8',
    runFirst: true,
  });

  // ── Security headers ─────────────────────────────────────────────────────────
  await fastify.register(helmet, {
    contentSecurityPolicy: false, // CSP managed at CDN level
  });

  // ── CORS ─────────────────────────────────────────────────────────────────────
  await fastify.register(cors, {
    origin: config.corsOrigin.split(',').map((o) => o.trim()),
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // ── Rate limiting ─────────────────────────────────────────────────────────────
  await fastify.register(rateLimit, {
    global: true,
    max: 100,
    timeWindow: '1 minute',
    redis,
    keyGenerator: (request) =>
      (request as { userId?: string }).userId ??
      request.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() ??
      request.ip,
    errorResponseBuilder: (_request, context) => ({
      error: 'rate_limit_exceeded',
      message: `Too many requests. Retry after ${context.after}`,
    }),
  });

  // ── OpenAPI / Swagger ────────────────────────────────────────────────────────
  await fastify.register(swagger, {
    openapi: {
      info: { title: 'EasyTrip API', version: '1.0.0', description: 'EasyTrip backend API' },
      components: {
        securitySchemes: {
          bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        },
      },
      security: [{ bearerAuth: [] }],
    },
  });

  await fastify.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: { deepLinking: true },
  });

  // ── Bull Board ───────────────────────────────────────────────────────────────
  const generationQueue = new Queue('itinerary:generation', { connection: createRedisClient() });
  const socialQueue = new Queue('social:crawl', { connection: createRedisClient() });

  const bullBoardAdapter = new FastifyAdapter();
  createBullBoard({
    queues: [new BullMQAdapter(generationQueue), new BullMQAdapter(socialQueue)],
    serverAdapter: bullBoardAdapter,
  });
  bullBoardAdapter.setBasePath('/admin/queues');

  // Protect Bull Board with HTTP Basic Auth
  fastify.addHook('onRequest', async (request, reply) => {
    if (!request.url.startsWith('/admin/queues')) return;
    const authHeader = request.headers.authorization ?? '';
    if (!authHeader.startsWith('Basic ')) {
      reply.header('WWW-Authenticate', 'Basic realm="EasyTrip Admin"');
      reply.code(401).send({ error: 'unauthorized', message: 'Admin authentication required' });
      return;
    }
    const credentials = Buffer.from(authHeader.slice(6), 'base64').toString('utf8');
    const [username, ...rest] = credentials.split(':');
    const password = rest.join(':');
    if (username !== config.admin.username || password !== config.admin.password) {
      reply.header('WWW-Authenticate', 'Basic realm="EasyTrip Admin"');
      reply.code(401).send({ error: 'unauthorized', message: 'Invalid admin credentials' });
      return;
    }
  });

  await fastify.register(bullBoardAdapter.registerPlugin(), { prefix: '/admin/queues' });

  // ── Health check ─────────────────────────────────────────────────────────────
  fastify.get('/health', { logLevel: 'warn' }, async (_req, reply) => {
    const redisOk = await redis.ping().then(() => true).catch(() => false);
    reply.send({ status: redisOk ? 'ok' : 'degraded', redis: redisOk ? 'ok' : 'error' });
  });

  // ── Routes ───────────────────────────────────────────────────────────────────
  const API_PREFIX = '/api/v1';

  await fastify.register(tripsRoutes, { prefix: API_PREFIX });
  await fastify.register(userRoutes, { prefix: API_PREFIX });
  await fastify.register(itineraryRoutes, { prefix: API_PREFIX });
  await fastify.register(budgetRoutes, { prefix: API_PREFIX });
  await fastify.register(venueRoutes, { prefix: API_PREFIX });
  await fastify.register(foodRoutes, { prefix: API_PREFIX });
  await fastify.register(transportRoutes, { prefix: API_PREFIX });
  await fastify.register(translatorRoutes, { prefix: API_PREFIX });
  await fastify.register(socialRoutes, { prefix: API_PREFIX });
  await fastify.register(subscriptionRoutes, { prefix: API_PREFIX });
  await fastify.register(aiAssistantRoutes, { prefix: API_PREFIX });
  await fastify.register(iapRoutes, { prefix: API_PREFIX });

  // ── Global error handler ─────────────────────────────────────────────────────
  fastify.setErrorHandler((err, request, reply) => {
    if (err instanceof AppError) {
      reply.code(err.statusCode).send(serializeError(err));
      return;
    }

    // Zod validation errors forwarded by Fastify
    if (err.name === 'ZodError') {
      reply.code(422).send({ error: 'validation_error', message: err.message });
      return;
    }

    fastify.log.error({ err, url: request.url, method: request.method }, 'Unhandled error');
    reply.code(500).send({ error: 'internal_server_error', message: 'An unexpected error occurred' });
  });

  // ── WebSocket ────────────────────────────────────────────────────────────────
  await initWebSocket(fastify);

  return fastify;
}

async function start() {
  try {
    const app = await build();
    await app.listen({ port: config.port, host: '0.0.0.0' });
    app.log.info(`EasyTrip server running on port ${config.port} [${config.env}]`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

start();
