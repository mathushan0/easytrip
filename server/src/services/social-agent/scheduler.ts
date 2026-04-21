import { Queue, Worker, type Job } from 'bullmq';
import { gt, desc } from 'drizzle-orm';
import { db, schema } from '../../db/index.js';
import { createRedisClient } from '../../plugins/redis.js';
import { redis } from '../../plugins/redis.js';
import { YouTubeExtractor } from './extractors/youtube.js';
import { RedditExtractor } from './extractors/reddit.js';
import { TwitterExtractor } from './extractors/twitter.js';
import { extractSocialPost } from '../ai.js';
import { scorePosts } from './scoring.js';
import type { RawPost, ExtractedPost } from '../../types/index.js';
import { eq } from 'drizzle-orm';

// ── Always-crawl destinations (top 50 global travel spots) ───────────────────

const ALWAYS_CRAWL_DESTINATIONS = [
  'Paris France', 'Tokyo Japan', 'London UK', 'New York USA', 'Rome Italy',
  'Barcelona Spain', 'Amsterdam Netherlands', 'Sydney Australia', 'Bangkok Thailand',
  'Dubai UAE', 'Istanbul Turkey', 'Prague Czech Republic', 'Vienna Austria',
  'Singapore', 'Lisbon Portugal', 'Seoul South Korea', 'Bali Indonesia',
  'Rio de Janeiro Brazil', 'Cape Town South Africa', 'Marrakech Morocco',
  'Edinburgh Scotland', 'Kyoto Japan', 'Santorini Greece', 'Dubrovnik Croatia',
  'Budapest Hungary', 'Reykjavik Iceland', 'Havana Cuba', 'Cartagena Colombia',
  'Ho Chi Minh City Vietnam', 'New Zealand Queenstown',
];

// ── Queue setup ───────────────────────────────────────────────────────────────

const connection = createRedisClient();

export const crawlQueue = new Queue('social:crawl', { connection });
export const extractionQueue = new Queue('social:extraction', { connection });
export const scoringQueue = new Queue('social:scoring', { connection });

// ── Get active crawl targets ──────────────────────────────────────────────────

async function getActiveCrawlTargets(): Promise<string[]> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const recentTrips = await db
    .selectDistinct({ city: schema.trips.city, country: schema.trips.countryCode })
    .from(schema.trips)
    .where(gt(schema.trips.startDate, sevenDaysAgo.toISOString().split('T')[0]));

  const tripDestinations = recentTrips
    .filter((t) => t.city)
    .map((t) => `${t.city} ${t.country}`.trim());

  return [...new Set([...ALWAYS_CRAWL_DESTINATIONS, ...tripDestinations])];
}

// ── Schedule crawls ───────────────────────────────────────────────────────────

export async function scheduleCrawls(): Promise<void> {
  const targets = await getActiveCrawlTargets();
  const platforms = ['youtube', 'reddit', 'twitter'];

  for (const destination of targets) {
    for (const platform of platforms) {
      await crawlQueue.add(
        `crawl:${platform}:${destination}`,
        { platform, destination },
        {
          removeOnComplete: 100,
          removeOnFail: 50,
          attempts: 3,
          backoff: { type: 'exponential', delay: 5000 },
        },
      );
    }
  }
}

// ── Crawl Worker ──────────────────────────────────────────────────────────────

const youtube = new YouTubeExtractor();
const reddit = new RedditExtractor();
const twitter = new TwitterExtractor();

export const crawlWorker = new Worker(
  'social:crawl',
  async (job: Job<{ platform: string; destination: string }>) => {
    const { platform, destination } = job.data;

    // Record job start
    const [crawlJob] = await db
      .insert(schema.crawlJobs)
      .values({ platform, target: destination, status: 'running', startedAt: new Date() })
      .returning();

    try {
      let posts: RawPost[] = [];

      switch (platform) {
        case 'youtube':
          posts = await youtube.searchVideos(destination);
          break;
        case 'reddit':
          posts = await reddit.searchPosts(destination);
          break;
        case 'twitter':
          posts = await twitter.searchTweets(destination);
          break;
        default:
          throw new Error(`Unknown platform: ${platform}`);
      }

      // Enqueue for extraction
      for (const post of posts) {
        await extractionQueue.add(`extract:${platform}:${post.platform_post_id}`, post, {
          removeOnComplete: 50,
          attempts: 2,
        });
      }

      await db
        .update(schema.crawlJobs)
        .set({ status: 'completed', completedAt: new Date(), postsFound: posts.length })
        .where(eq(schema.crawlJobs.id, crawlJob.id));
    } catch (err) {
      await db
        .update(schema.crawlJobs)
        .set({ status: 'failed', completedAt: new Date(), errorMessage: (err as Error).message })
        .where(eq(schema.crawlJobs.id, crawlJob.id));
      throw err;
    }
  },
  { connection: createRedisClient(), concurrency: 5 },
);

// ── Extraction Worker ─────────────────────────────────────────────────────────

export const extractionWorker = new Worker(
  'social:extraction',
  async (job: Job<RawPost>) => {
    const rawPost = job.data;
    const content = `${rawPost.title ?? ''}\n${rawPost.content ?? ''}`.trim();

    if (!content) return;

    const extracted = await extractSocialPost(content);
    if (!extracted || !extracted.city) return; // Skip non-travel posts

    const enrichedPost: ExtractedPost = {
      ...rawPost,
      ...extracted,
      extraction_confidence: extracted.extraction_confidence,
    };

    await scoringQueue.add(`score:${rawPost.platform}:${rawPost.platform_post_id}`, enrichedPost, {
      removeOnComplete: 50,
    });
  },
  { connection: createRedisClient(), concurrency: 10 },
);

// ── Scoring + Persist Worker ──────────────────────────────────────────────────

export const scoringWorker = new Worker(
  'social:scoring',
  async (job: Job<ExtractedPost>) => {
    const post = job.data;
    const [scored] = scorePosts([post]);

    // Upsert into DB
    await db
      .insert(schema.socialPosts)
      .values({
        platform: post.platform as typeof schema.socialPosts.$inferInsert['platform'],
        platformPostId: post.platform_post_id,
        postUrl: post.post_url,
        title: post.title,
        contentSnippet: post.content_snippet?.slice(0, 300),
        destination: post.destination,
        city: post.city,
        countryCode: post.country_code,
        creatorUsername: post.creator_username,
        creatorDisplayName: post.creator_display_name,
        creatorFollowerCount: post.creator_follower_count?.toString(),
        likesCount: post.likes_count?.toString() ?? '0',
        viewsCount: post.views_count?.toString() ?? '0',
        commentsCount: post.comments_count?.toString() ?? '0',
        sharesCount: post.shares_count?.toString() ?? '0',
        contentType: scored.content_type as typeof schema.socialPosts.$inferInsert['contentType'],
        sentiment: scored.sentiment as typeof schema.socialPosts.$inferInsert['sentiment'],
        trendScore: scored.trend_score,
        postedAt: post.posted_at ? new Date(post.posted_at) : undefined,
        extractedAt: new Date(),
        scoreUpdatedAt: new Date(),
        thumbnailUrl: post.thumbnail_url,
        extractionConfidence: scored.extraction_confidence,
        rawExtraction: scored as unknown as Record<string, unknown>,
      })
      .onConflictDoUpdate({
        target: [schema.socialPosts.platformPostId],
        set: {
          trendScore: scored.trend_score,
          scoreUpdatedAt: new Date(),
          updatedAt: new Date(),
        },
      });

    // Push high-scoring posts to Redis pub/sub for WebSocket delivery
    if (scored.trend_score >= 70 && scored.city && scored.country_code) {
      const channel = `social:${scored.country_code}:${scored.city}`;
      await redis.publish(
        channel,
        JSON.stringify({
          type: 'social_post',
          post: {
            platform: scored.platform,
            creator_username: scored.creator_username,
            content_snippet: scored.content_snippet,
            trend_score: scored.trend_score,
            post_url: scored.post_url,
          },
        }),
      );
    }
  },
  { connection: createRedisClient(), concurrency: 20 },
);

// ── Start all workers ─────────────────────────────────────────────────────────

export function startSocialAgent(): void {
  console.info('Social Intelligence Agent workers started');

  // Schedule crawls every 30 minutes
  setInterval(
    () => {
      scheduleCrawls().catch((err) => console.error('Failed to schedule crawls:', err));
    },
    30 * 60 * 1000,
  );

  // Initial crawl on startup
  scheduleCrawls().catch((err) => console.error('Initial crawl scheduling failed:', err));
}
