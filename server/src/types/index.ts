import type { FastifyRequest, FastifyReply } from 'fastify';

// ── Tier System ──────────────────────────────────────────────────────────────

export type UserTier = 'explorer' | 'voyager' | 'nomad_pro';

export const TIER_RANK: Record<UserTier, number> = {
  explorer: 0,
  voyager: 1,
  nomad_pro: 2,
};

// ── Augmented Fastify types ──────────────────────────────────────────────────

declare module 'fastify' {
  interface FastifyRequest {
    userId: string;
    userTier: UserTier;
    rawBody?: Buffer;
  }
}

// ── API Response shapes ──────────────────────────────────────────────────────

export interface ApiSuccess<T = unknown> {
  data: T;
  meta?: Record<string, unknown>;
}

export interface ApiError {
  error: string;
  message: string;
  code?: string;
  required_tier?: UserTier;
  upsell_context?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    has_more: boolean;
  };
}

// ── Route handler types ──────────────────────────────────────────────────────

export type RouteHandler<
  Params = unknown,
  Query = unknown,
  Body = unknown,
> = (
  request: FastifyRequest<{ Params: Params; Querystring: Query; Body: Body }>,
  reply: FastifyReply,
) => Promise<void>;

// ── AI / LLM ─────────────────────────────────────────────────────────────────

export interface Prompt {
  system: string;
  user: string;
  model?: string;
}

export interface GenerationContext {
  destination: string;
  startDate: string;
  endDate: string;
  timezone: string;
  durationDays: number;
  tripType: string;
  budgetTier: 'budget' | 'mid' | 'luxury';
  budgetAmount: number;
  currency: string;
  interests: string[];
  dietary: string[];
  pace: string;
  weatherForecast: WeatherForecast[];
  confirmedVenues: VenueContext[];
  transportPasses: TransportPassContext[];
  localDishes: string[];
}

export interface WeatherForecast {
  date: string;
  temp_min: number;
  temp_max: number;
  condition: string;
  icon: string;
}

export interface VenueContext {
  name: string;
  address: string;
  category: string;
  google_place_id?: string;
  rating?: number;
  price_level?: number;
}

export interface TransportPassContext {
  pass_name: string;
  description: string;
  coverage: string;
  cost_amount: number;
  cost_currency: string;
}

// ── Social Agent ─────────────────────────────────────────────────────────────

export interface RawPost {
  platform: string;
  platform_post_id?: string;
  post_url?: string;
  title?: string;
  content?: string;
  creator_username?: string;
  creator_display_name?: string;
  creator_follower_count?: number;
  likes_count?: number;
  views_count?: number;
  comments_count?: number;
  shares_count?: number;
  posted_at?: string;
  thumbnail_url?: string;
}

export interface ExtractedPost extends RawPost {
  destination?: string;
  city?: string;
  country_code?: string;
  venue_name?: string;
  content_snippet?: string;
  content_type?: string;
  sentiment?: string;
  extraction_confidence: 'high' | 'medium' | 'low';
}

export interface ScoredPost extends ExtractedPost {
  trend_score: number;
}

// ── WebSocket events ─────────────────────────────────────────────────────────

export interface SocialUpdateEvent {
  type: 'social_post';
  post: {
    id: string;
    platform: string;
    venue_id?: string;
    creator_username?: string;
    content_snippet?: string;
    trend_score: number;
    post_url?: string;
  };
}

export interface GenerationCompleteEvent {
  type: 'generation_complete' | 'generation_failed';
  jobId: string;
  tripId?: string;
  error?: string;
}

// ── Subscription ─────────────────────────────────────────────────────────────

export type SubscriptionStatus =
  | 'active'
  | 'cancelled'
  | 'expired'
  | 'pending'
  | 'past_due';

export type SubscriptionProvider = 'stripe' | 'apple_iap' | 'google_iap';
