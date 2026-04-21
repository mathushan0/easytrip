import Redis from 'ioredis';
import { config } from '../config/index.js';

export const redis = new Redis(config.redis.url, {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: false,
});

redis.on('error', (err) => {
  console.error('Redis error:', err.message);
});

redis.on('connect', () => {
  console.info('Redis connected');
});

// ── BullMQ-specific clients (separate connections per BullMQ requirement) ─────

export function createRedisClient() {
  return new Redis(config.redis.url, {
    maxRetriesPerRequest: null, // BullMQ requirement
    enableReadyCheck: false,
  });
}
