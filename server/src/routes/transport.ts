import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import axios from 'axios';
import { db, schema } from '../db/index.js';
import { verifyJWT } from '../auth/middleware.js';
import { config } from '../config/index.js';
import { redis } from '../plugins/redis.js';
import crypto from 'crypto';

const RouteRequestSchema = z.object({
  origin_lat: z.number(),
  origin_lng: z.number(),
  destination_lat: z.number(),
  destination_lng: z.number(),
  depart_at: z.string().datetime().optional(),
  modes: z
    .array(z.enum(['WALK', 'DRIVE', 'TRANSIT', 'BICYCLE', 'TWO_WHEELER']))
    .default(['TRANSIT', 'WALK']),
});

function hashRoute(data: unknown): string {
  return crypto.createHash('md5').update(JSON.stringify(data)).digest('hex').slice(0, 16);
}

export async function transportRoutes(fastify: FastifyInstance) {
  // POST /transport/route
  fastify.post('/transport/route', { preHandler: [verifyJWT] }, async (request, reply) => {
    const body = RouteRequestSchema.parse(request.body);

    const cacheKey = `route:${hashRoute(body)}`;
    const cached = await redis.get(cacheKey);
    if (cached) return reply.send({ data: JSON.parse(cached) });

    const routeResults: unknown[] = [];

    for (const mode of body.modes) {
      try {
        const response = await axios.post(
          'https://routes.googleapis.com/directions/v2:computeRoutes',
          {
            origin: {
              location: { latLng: { latitude: body.origin_lat, longitude: body.origin_lng } },
            },
            destination: {
              location: {
                latLng: { latitude: body.destination_lat, longitude: body.destination_lng },
              },
            },
            travelMode: mode,
            departureTime: body.depart_at ?? new Date().toISOString(),
            computeAlternativeRoutes: false,
          },
          {
            headers: {
              'X-Goog-Api-Key': config.google.mapsApiKey,
              'X-Goog-FieldMask':
                'routes.duration,routes.distanceMeters,routes.legs,routes.polyline.encodedPolyline',
              'Content-Type': 'application/json',
            },
          },
        );

        const route = response.data.routes?.[0];
        if (route) {
          routeResults.push({ mode, ...route });
        }
      } catch (err) {
        fastify.log.warn({ mode, err }, 'Route computation failed for mode');
      }
    }

    await redis.setex(cacheKey, 3600, JSON.stringify(routeResults));
    reply.send({ data: routeResults });
  });

  // GET /transport/passes
  fastify.get('/transport/passes', { preHandler: [verifyJWT] }, async (request, reply) => {
    const { city, country_code } = request.query as { city?: string; country_code?: string };

    if (!city && !country_code) {
      return reply.code(400).send({
        error: 'validation_error',
        message: 'Provide city or country_code',
      });
    }

    const conditions = [];
    if (city) conditions.push(eq(schema.transportPasses.city, city));
    if (country_code) conditions.push(eq(schema.transportPasses.countryCode, country_code));

    const passes = await db.query.transportPasses.findMany({
      where: conditions.length > 1 ? and(...conditions) : conditions[0],
    });

    reply.send({ data: passes });
  });
}
