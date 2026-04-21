import { Server, type Socket } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import type { FastifyInstance } from 'fastify';
import { createRedisClient } from '../plugins/redis.js';
import { verifySupabaseToken } from '../auth/supabase.js';
import { eq } from 'drizzle-orm';
import { db, schema } from '../db/index.js';
import type { UserTier } from '../types/index.js';
import { TIER_RANK } from '../types/index.js';

let io: Server | null = null;

export function getIo(): Server {
  if (!io) throw new Error('Socket.io not initialised');
  return io;
}

export async function initWebSocket(fastify: FastifyInstance): Promise<Server> {
  const pubClient = createRedisClient();
  const subClient = createRedisClient();

  io = new Server(fastify.server, {
    cors: {
      origin: process.env['CORS_ORIGIN'] ?? '*',
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
  });

  io.adapter(createAdapter(pubClient, subClient));

  // ── Auth middleware ─────────────────────────────────────────────────────────

  io.use(async (socket: Socket, next) => {
    const token = socket.handshake.auth['token'] as string | undefined;

    if (!token) {
      return next(new Error('Authentication required'));
    }

    const supabaseUser = await verifySupabaseToken(token);
    if (!supabaseUser) {
      return next(new Error('Invalid token'));
    }

    const user = await db.query.users.findFirst({
      where: eq(schema.users.id, supabaseUser.id),
      columns: { id: true, tier: true },
    });

    if (!user) {
      return next(new Error('User not found'));
    }

    socket.data['userId'] = user.id;
    socket.data['userTier'] = user.tier as UserTier;
    next();
  });

  // ── Connection handler ──────────────────────────────────────────────────────

  io.on('connection', async (socket: Socket) => {
    const userId = socket.data['userId'] as string;
    const userTier = socket.data['userTier'] as UserTier;

    fastify.log.debug({ userId, userTier }, 'WebSocket client connected');

    // Subscribe to trip updates (all tiers)
    socket.on('subscribe:trip', (tripId: string) => {
      socket.join(`trip:${tripId}`);
    });

    socket.on('unsubscribe:trip', (tripId: string) => {
      socket.leave(`trip:${tripId}`);
    });

    // Subscribe to social intelligence feed (Nomad Pro only)
    socket.on('subscribe:social', (data: { countryCode: string; city: string }) => {
      if (TIER_RANK[userTier] < TIER_RANK['nomad_pro']) {
        socket.emit('error', {
          code: 'upgrade_required',
          message: 'Social Intelligence requires Nomad Pro',
        });
        return;
      }

      const room = `social:${data.countryCode}:${data.city}`;
      socket.join(room);
      fastify.log.debug({ userId, room }, 'Subscribed to social feed');
    });

    socket.on('unsubscribe:social', (data: { countryCode: string; city: string }) => {
      socket.leave(`social:${data.countryCode}:${data.city}`);
    });

    socket.on('disconnect', () => {
      fastify.log.debug({ userId }, 'WebSocket client disconnected');
    });
  });

  fastify.log.info('WebSocket server initialised with Redis adapter');
  return io;
}

// ── Emit helpers ──────────────────────────────────────────────────────────────

export function emitToTrip(tripId: string, event: string, data: unknown): void {
  io?.to(`trip:${tripId}`).emit(event, data);
}

export function emitGenerationComplete(params: {
  tripId: string;
  jobId: string;
  error?: string;
}): void {
  emitToTrip(params.tripId, 'generation_complete', {
    type: params.error ? 'generation_failed' : 'generation_complete',
    jobId: params.jobId,
    tripId: params.tripId,
    error: params.error,
  });
}
