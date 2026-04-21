import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { verifyJWT } from '../auth/middleware.js';
import { searchNearby, searchPlaces } from '../services/places.js';
import { redis } from '../plugins/redis.js';
import { generateAssistantReply } from '../services/ai.js';

const FoodSearchSchema = z.object({
  lat: z.coerce.number(),
  lng: z.coerce.number(),
  radius: z.coerce.number().default(2000),
  cuisine: z.string().optional(),
  dietary: z.array(z.string()).default([]),
  budget: z.enum(['budget', 'mid', 'luxury']).optional(),
  query: z.string().optional(),
});

export async function foodRoutes(fastify: FastifyInstance) {
  // GET /food/search
  fastify.get('/food/search', { preHandler: [verifyJWT] }, async (request, reply) => {
    const params = FoodSearchSchema.parse(request.query);

    let venues;
    if (params.cuisine || params.query) {
      const q = [params.query, params.cuisine, ...params.dietary].filter(Boolean).join(' ') + ' restaurant';
      venues = await searchPlaces({
        query: q,
        lat: params.lat,
        lng: params.lng,
        radiusMeters: params.radius,
      });
    } else {
      venues = await searchNearby({
        lat: params.lat,
        lng: params.lng,
        radiusMeters: params.radius,
        category: 'food',
      });
    }

    // Filter by dietary tags if provided
    if (params.dietary.length > 0) {
      venues = venues.filter((v: { dietaryTags?: string[] }) =>
        params.dietary.some((d) => v.dietaryTags?.includes(d)),
      );
    }

    // Filter by price level if budget specified
    if (params.budget) {
      const priceMap = { budget: [1, 2], mid: [2, 3], luxury: [3, 4] };
      const levels = priceMap[params.budget];
      venues = venues.filter(
        (v: { priceLevel?: number }) => !v.priceLevel || levels.includes(v.priceLevel),
      );
    }

    reply.send({ data: venues });
  });

  // GET /food/areas
  fastify.get('/food/areas', { preHandler: [verifyJWT] }, async (request, reply) => {
    const { destination, lat, lng } = request.query as {
      destination?: string;
      lat?: string;
      lng?: string;
    };

    if (!destination) {
      return reply.code(400).send({ error: 'validation_error', message: 'destination required' });
    }

    const cacheKey = `food:areas:${destination}`;
    const cached = await redis.get(cacheKey);
    if (cached) return reply.send({ data: JSON.parse(cached) });

    // Use AI to generate food area recommendations
    const { content } = await generateAssistantReply(
      [
        {
          role: 'user',
          content: `List the 5 best food areas/neighbourhoods in ${destination} for tourists. Return JSON array: [{name, description, best_for, approx_cost_per_meal_gbp}]`,
        },
      ],
      `Location: ${destination}`,
    );

    let areas;
    try {
      areas = JSON.parse(content);
    } catch {
      areas = [];
    }

    await redis.setex(cacheKey, 86400 * 7, JSON.stringify(areas)); // 7 day cache
    reply.send({ data: areas });
  });

  // GET /food/local-dishes
  fastify.get('/food/local-dishes', { preHandler: [verifyJWT] }, async (request, reply) => {
    const { country_code, city } = request.query as { country_code?: string; city?: string };

    if (!country_code) {
      return reply.code(400).send({ error: 'validation_error', message: 'country_code required' });
    }

    const cacheKey = `food:local-dishes:${country_code}:${city ?? ''}`;
    const cached = await redis.get(cacheKey);
    if (cached) return reply.send({ data: JSON.parse(cached) });

    const location = city ? `${city}, ${country_code}` : country_code;
    const { content } = await generateAssistantReply(
      [
        {
          role: 'user',
          content: `List 10 must-try local dishes in ${location}. Return JSON array: [{name, description, where_to_try, approx_price_gbp, is_vegetarian, is_vegan}]`,
        },
      ],
      `Location: ${location}`,
    );

    let dishes;
    try {
      dishes = JSON.parse(content);
    } catch {
      dishes = [];
    }

    await redis.setex(cacheKey, 86400 * 7, JSON.stringify(dishes));
    reply.send({ data: dishes });
  });
}
