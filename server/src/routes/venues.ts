import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { eq, desc, and } from 'drizzle-orm';
import { db, schema } from '../db/index.js';
import { verifyJWT, requireTier } from '../auth/middleware.js';
import { NotFoundError } from '../errors/index.js';
import { searchNearby, getVenueDetail, searchPlaces } from '../services/places.js';

const SearchQuerySchema = z.object({
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
  radius: z.coerce.number().default(5000),
  category: z.string().optional(),
  query: z.string().optional(),
});

export async function venuesRoutes(fastify: FastifyInstance) {
  // GET /places/search
  fastify.get('/places/search', { preHandler: [verifyJWT] }, async (request, reply) => {
    const params = SearchQuerySchema.parse(request.query);

    let venues;
    if (params.query) {
      venues = await searchPlaces({
        query: params.query,
        lat: params.lat,
        lng: params.lng,
        radiusMeters: params.radius,
      });
    } else if (params.lat && params.lng) {
      venues = await searchNearby({
        lat: params.lat,
        lng: params.lng,
        radiusMeters: params.radius,
        category: params.category ?? 'tourist_attraction',
      });
    } else {
      return reply.code(400).send({ error: 'validation_error', message: 'Provide query or lat/lng' });
    }

    reply.send({ data: venues });
  });

  // GET /places/:placeId
  fastify.get('/places/:placeId', { preHandler: [verifyJWT] }, async (request, reply) => {
    const { placeId } = request.params as { placeId: string };

    const venue = await getVenueDetail(placeId);
    if (!venue) throw new NotFoundError('Venue');

    reply.send({ data: venue });
  });

  // GET /places/:placeId/photos
  fastify.get('/places/:placeId/photos', { preHandler: [verifyJWT] }, async (request, reply) => {
    const { placeId } = request.params as { placeId: string };

    const venue = await db.query.venues.findFirst({
      where: eq(schema.venues.googlePlaceId, placeId),
      columns: { photos: true },
    });

    if (!venue) throw new NotFoundError('Venue');
    reply.send({ data: venue.photos ?? [] });
  });

  // GET /places/:placeId/social-intel [Nomad Pro]
  fastify.get(
    '/places/:placeId/social-intel',
    { preHandler: [verifyJWT, requireTier('nomad_pro')] },
    async (request, reply) => {
      const { placeId } = request.params as { placeId: string };

      const venue = await db.query.venues.findFirst({
        where: eq(schema.venues.googlePlaceId, placeId),
        columns: { id: true },
      });

      if (!venue) throw new NotFoundError('Venue');

      const posts = await db.query.socialPosts.findMany({
        where: and(
          eq(schema.socialPosts.venueId, venue.id),
        ),
        orderBy: [desc(schema.socialPosts.trendScore)],
        limit: 20,
      });

      reply.send({ data: posts });
    },
  );

  // POST /places/:placeId/favourite [Voyager+]
  fastify.post(
    '/places/:placeId/favourite',
    { preHandler: [verifyJWT, requireTier('voyager')] },
    async (request, reply) => {
      // Returns the venue so the client can associate it with a trip
      const { placeId } = request.params as { placeId: string };
      const venue = await getVenueDetail(placeId);
      if (!venue) throw new NotFoundError('Venue');

      reply.send({ data: venue });
    },
  );
}
