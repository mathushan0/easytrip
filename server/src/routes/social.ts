import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { eq, and, desc, gte, sql } from 'drizzle-orm';
import { db, schema } from '../db/index.js';
import { verifyJWT, requireTier } from '../auth/middleware.js';

const FeedQuerySchema = z.object({
  country_code: z.string().length(2).optional(),
  city: z.string().optional(),
  filter: z.enum(['food', 'landmark', 'general', 'all']).default('all'),
  sort: z.enum(['trend_score', 'posted_at', 'engagement']).default('trend_score'),
  limit: z.coerce.number().int().max(50).default(20),
  offset: z.coerce.number().int().default(0),
});

export async function socialRoutes(fastify: FastifyInstance) {
  // GET /social-intel/feed [Nomad Pro]
  fastify.get(
    '/social-intel/feed',
    {
      preHandler: [verifyJWT, requireTier('nomad_pro')],
      config: { rateLimit: { max: 5, timeWindow: '1 minute' } },
    },
    async (request, reply) => {
      const params = FeedQuerySchema.parse(request.query);

      if (!params.country_code && !params.city) {
        return reply.code(400).send({
          error: 'validation_error',
          message: 'Provide country_code or city',
        });
      }

      const conditions = [
        eq(schema.socialPosts.extractionConfidence, 'high'),
        gte(
          schema.socialPosts.postedAt,
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        ),
      ];

      if (params.country_code) {
        conditions.push(eq(schema.socialPosts.countryCode, params.country_code));
      }
      if (params.city) {
        conditions.push(eq(schema.socialPosts.city, params.city));
      }
      if (params.filter !== 'all') {
        const contentTypeMap: Record<string, string[]> = {
          food: ['influencer_pick', 'pricing_intel'],
          landmark: ['hidden_gem', 'travel_tip'],
          general: ['general', 'travel_tip'],
        };
        const types = contentTypeMap[params.filter] ?? [];
        if (types.length > 0) {
          conditions.push(
            sql`${schema.socialPosts.contentType} = ANY(${types})`,
          );
        }
      }

      const orderColumn =
        params.sort === 'posted_at'
          ? desc(schema.socialPosts.postedAt)
          : desc(schema.socialPosts.trendScore);

      const posts = await db.query.socialPosts.findMany({
        where: and(...conditions),
        orderBy: [orderColumn],
        limit: params.limit,
        offset: params.offset,
        with: { venue: { columns: { id: true, name: true, category: true } } },
      });

      reply.send({ data: posts });
    },
  );

  // GET /social-intel/trending [Nomad Pro]
  fastify.get(
    '/social-intel/trending',
    { preHandler: [verifyJWT, requireTier('nomad_pro')] },
    async (request, reply) => {
      const { limit = '10' } = request.query as { limit?: string };

      // Aggregate trend scores by destination in last 7 days
      const trending = await db
        .select({
          city: schema.socialPosts.city,
          country_code: schema.socialPosts.countryCode,
          avg_trend_score: sql<number>`AVG(${schema.socialPosts.trendScore})`,
          post_count: sql<number>`COUNT(*)`,
        })
        .from(schema.socialPosts)
        .where(
          and(
            eq(schema.socialPosts.extractionConfidence, 'high'),
            gte(
              schema.socialPosts.postedAt,
              new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            ),
          ),
        )
        .groupBy(schema.socialPosts.city, schema.socialPosts.countryCode)
        .orderBy(desc(sql`AVG(${schema.socialPosts.trendScore})`))
        .limit(parseInt(limit, 10));

      reply.send({ data: trending });
    },
  );

  // GET /social-intel/celeb-picks [Nomad Pro]
  fastify.get(
    '/social-intel/celeb-picks',
    { preHandler: [verifyJWT, requireTier('nomad_pro')] },
    async (request, reply) => {
      const { country_code, city } = request.query as {
        country_code?: string;
        city?: string;
      };

      const conditions = [
        eq(schema.socialPosts.creatorVerified, true),
        eq(schema.socialPosts.extractionConfidence, 'high'),
        gte(
          schema.socialPosts.postedAt,
          new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        ),
      ];

      if (country_code) conditions.push(eq(schema.socialPosts.countryCode, country_code));
      if (city) conditions.push(eq(schema.socialPosts.city, city));

      const posts = await db.query.socialPosts.findMany({
        where: and(...conditions),
        orderBy: [desc(schema.socialPosts.trendScore)],
        limit: 20,
      });

      reply.send({ data: posts });
    },
  );
}
