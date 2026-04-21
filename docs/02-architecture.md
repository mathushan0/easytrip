# EasyTrip — Architecture Document v1.0
**Produced by:** Systems Architect  
**Date:** 2026-04-21  
**Status:** Draft — Ready for Lead Developer Review

---

## Table of Contents

1. [Open Questions — Resolved](#1-open-questions--resolved)
2. [Tech Stack Confirmation](#2-tech-stack-confirmation)
3. [System Architecture Diagram](#3-system-architecture-diagram)
4. [Database Schema](#4-database-schema)
5. [API Endpoint Design](#5-api-endpoint-design)
6. [Authentication & Authorization](#6-authentication--authorization)
7. [AI Itinerary Generation Pipeline](#7-ai-itinerary-generation-pipeline)
8. [Social Intelligence Agent Architecture](#8-social-intelligence-agent-architecture)
9. [Real-Time Architecture](#9-real-time-architecture)
10. [Offline-First Strategy](#10-offline-first-strategy)
11. [Payment Architecture](#11-payment-architecture)
12. [Theme System Architecture](#12-theme-system-architecture)
13. [Map & Routing Integration](#13-map--routing-integration)
14. [Translation Service Architecture](#14-translation-service-architecture)
15. [Infrastructure & Deployment](#15-infrastructure--deployment)
16. [Cost Estimates](#16-cost-estimates)
17. [Security Considerations](#17-security-considerations)
18. [Performance & Scaling Strategy](#18-performance--scaling-strategy)
19. [Trade-offs](#19-trade-offs)

---

## 1. Open Questions — Resolved

These ten questions from the Project Brief handoff notes are resolved here. These decisions are foundational — changing them later is expensive.

### Q1: Which AI model is primary?
**Decision: Claude 3.5 Sonnet as primary; GPT-4o as fallback.**

Rationale: Claude has a significantly larger context window (200k tokens vs GPT-4o's 128k), which matters for long multi-day itineraries. Claude's structured output (JSON mode) is reliable, and the pricing is comparable. The system will use an abstraction layer (`LLMClient`) so the model can be swapped without changing prompt logic. Fallback triggers automatically on 5xx errors or >10s response latency.

**Model assignment by task:**
| Task | Primary | Fallback |
|---|---|---|
| Itinerary generation | Claude 3.5 Sonnet | GPT-4o |
| AI Trip Assistant (chat) | Claude 3.5 Haiku (cheaper for conversational) | GPT-4o mini |
| Social agent extraction | GPT-4o mini (batch, cost-sensitive) | Claude Haiku |
| Translation fallback | Claude Haiku | — |

### Q2: iOS only or iOS + Android simultaneously?
**Decision: iOS and Android simultaneously, but iOS is the QA priority.**

Rationale: React Native + Expo produces both from one codebase. Running iOS-only for launch halves the addressable market and the Play Store review is faster. QA plan: iOS gets full manual regression; Android gets automated E2E (Detox) + smoke test on 3 real devices (Pixel 6, Samsung S22, budget mid-range). Submit to both stores in the same week.

### Q3: Target markets for launch?
**Decision: UK + Ireland launch, with global access from Day 1.**

Rationale: UK is home market, simplifies initial legal/tax complexity. App available globally on stores (no geo-restriction) but marketing spend is UK-focused. Currency defaults to GBP. Regional pricing via Apple/Google price tiers activated at launch (not as an afterthought). GDPR applies from Day 1. US-specific compliance (e.g., state privacy laws) deferred to v1.5.

### Q4: User-generated content in v1?
**Decision: No UGC in v1.** 

The only user data displayed to others is (a) shared trip cards (image exports, no in-app social feed), and (b) Group planner sync (deferred to v2). No moderation infrastructure needed in v1.

### Q5: Phrasebook content source?
**Decision: Pre-seeded curated database, AI-supplemented at request time.**

A base phrasebook of ~200 phrases per language (greetings, transport, food, emergency, shopping) is seeded into the DB as a CSV import. Covers the top 40 travel languages at launch. AI generates additional context-specific phrases at request time (e.g., "how to order vegetarian food in Japanese"). Audio pronunciation is generated via a TTS API (Google Cloud TTS or ElevenLabs) and cached in S3. New phrase audio is generated on demand and cached; subsequent requests are served from cache.

### Q6: "Live" opening hours clarification?
**Decision: Use Google Places `opening_hours` data with an honest staleness indicator.**

Google Places hours are updated by business owners and Google's teams but are not real-time. Display them with a label: "Hours from Google — verify on arrival." Cache TTL for place details: 6 hours. Do not use the word "live" in marketing copy for hours. This is a marketing/copy constraint, not an architecture constraint.

### Q7: Trademark registration timeline?
**Decision: Outside architecture scope.** Flag to Mathu: trademark applications in UK (UKIPO), EU (EUIPO), and US (USPTO) must be filed before soft-launch, not at launch. This is a legal action item, not a build item. Architecture note: the `EasyTrip` brand name, three-theme system, and Social Intelligence Agent are all novel enough to document as IP even before formal registration.

### Q8: Photography licensing strategy?
**Decision: Google Places Photos (first priority) + Unsplash (fallback) + Pexels (tertiary).**

- **Google Places Photos:** Best contextual match. TOS allows display within apps. Attribution required. Cache aggressively.
- **Unsplash:** Free, high quality, requires photo credit link. Used for destination hero images.
- **Pexels:** Free alternative, similar TOS to Unsplash.
- **No user-uploaded photos in v1.**
- All photo URLs stored in DB with `source` and `attribution` fields. Frontend renders attribution where required.

### Q9: "195+ countries" quality caveat?
**Decision: Implement a destination confidence score at itinerary generation time.**

The AI prompt includes a system instruction to assess data confidence and return a `destination_confidence` field: `high` / `medium` / `low`. Low confidence triggers an in-app banner: "We have limited local data for [destination] — recommendations may be less precise. We'll improve over time." This manages expectations without removing functionality.

### Q10: Travel pass info data source?
**Decision: Curated static database, manually maintained, supplemented by AI.**

No universal API exists for transport passes. We maintain a `transport_passes` table seeded with major cities' pass info (Oyster/London, Navigo/Paris, Metrocard/NYC, Suica/Tokyo, etc.) — covering the top 50 transit systems at launch. Data includes: pass name, cost, coverage, purchase locations, validity period, and a last-verified date. AI itinerary generation uses this table as context when suggesting transport. Data updated quarterly by a human editor. Users can flag outdated info (v2).

---

## 2. Tech Stack Confirmation

The spec's recommended stack is confirmed with the following amendments and clarifications.

### 2.1 Frontend

| Component | Decision | Rationale |
|---|---|---|
| Framework | React Native + Expo SDK 52 | Cross-platform, mature ecosystem |
| **Workflow** | **Expo Dev Client (bare-ish)** | Not managed workflow. Camera OCR (Expo Camera) and some push notification edge cases need Dev Client. Avoids painful migration later. |
| Language | TypeScript (strict) | Non-negotiable for a team this size |
| State | Zustand v5 | Simple, fast, no boilerplate |
| Server state | TanStack Query v5 | Caching, background refetch, offline support |
| Offline DB | WatermelonDB | Relational offline data (itineraries, places) |
| Fast KV store | MMKV | Auth tokens, theme prefs, session state |
| Navigation | Expo Router v3 (file-based) | Built on React Navigation, type-safe routes |
| Animations | react-native-reanimated v3 | Required for drag-to-reorder |
| Drag and drop | react-native-drag-sort | Wraps Reanimated, handles DnD |
| Maps | react-native-maps + Google Maps SDK | Standard choice |
| Push notifications | Expo Notifications + FCM/APNs | Expo handles the abstraction |
| Analytics | PostHog (React Native SDK) | Feature flags + analytics in one |
| Crash reporting | Sentry | Industry standard |
| Camera/OCR | Expo Camera + Google Cloud Vision API | Cloud Vision handles the OCR server-side |
| Fonts | expo-font + Google Fonts | Load all theme fonts at boot |

### 2.2 Backend

| Component | Decision | Rationale |
|---|---|---|
| Runtime | Node.js 22 LTS | LTS stability |
| Framework | Fastify v4 | Faster than Express, TypeScript-native |
| ORM | Drizzle ORM | Type-safe, lightweight, fast migrations |
| Primary DB | PostgreSQL 16 (AWS RDS) | Proven, ACID, JSONB for flexible fields |
| Cache / Queue | Redis 7 (AWS ElastiCache) | Caching + BullMQ + pub/sub |
| Job queue | BullMQ | Built on Redis, supports priorities |
| Auth | Supabase Auth (standalone, not full Supabase) | JWT, social OAuth, email OTP |
| WebSocket | Socket.io on Fastify (fastify-socket.io) | Redis adapter for horizontal scaling |
| Payments | Stripe API + webhook handler | Web payments |
| Email | Resend | Transactional email |
| File storage | AWS S3 + CloudFront CDN | Media and audio caches |
| Validation | Zod | Runtime schema validation (LLM output + API input) |
| Container | Docker + AWS ECS/Fargate | Managed serverless containers |
| Secret management | AWS Secrets Manager | No secrets in env files |

### 2.3 Social Intelligence Agent (Separate Service)

| Component | Decision |
|---|---|
| Crawling (JS-heavy) | Playwright (Node.js) on headless Chromium |
| Crawling (static) | Axios + Cheerio (lighter than Scrapy, same JS ecosystem) |
| Official APIs | YouTube Data API v3, Reddit API, Twitter/X Basic |
| Extraction | GPT-4o mini (structured JSON, cheaper for batch) |
| Scheduling | BullMQ (repeatable jobs, every 30 min per source) |
| Storage | Shared PostgreSQL (social schema) |
| Deployment | Separate ECS task definition (can scale independently) |

### 2.4 External APIs

| API | Usage | Notes |
|---|---|---|
| Claude 3.5 Sonnet (Anthropic) | Itinerary generation | Primary AI |
| GPT-4o / 4o mini (OpenAI) | Fallback AI + social extraction | |
| Google Places API (New) | Venue data, photos, hours | Use New API (not legacy) |
| Google Maps Directions API | Multi-modal routing | |
| Google Cloud Vision API | Camera OCR | Server-side call |
| Google Cloud TTS | Phrase audio generation | Cache in S3 |
| Google Translate API | Text translation | Primary |
| LibreTranslate | Translation fallback | Self-host or hosted |
| YouTube Data API v3 | Social agent — video data | Free quota |
| Twitter/X API v2 (Basic) | Social agent — posts | $100/mo |
| Reddit API | Social agent — posts | Free |
| Open Exchange Rates | Currency conversion | $10/mo |
| OpenWeatherMap | Weather data | Free tier |
| Stripe | Payments | Web + webhooks |
| Resend | Email | Transactional |
| Unsplash API | Destination photos | Free, attribution required |
| Sentry | Error tracking | |
| PostHog | Analytics + feature flags | |

---

## 3. System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        EASYTRIP SYSTEM ARCHITECTURE                      │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────┐
│         MOBILE APP               │
│   React Native + Expo Dev Client │
│                                  │
│  ┌─────────┐  ┌────────────────┐ │
│  │ Zustand │  │  TanStack      │ │
│  │ (state) │  │  Query (cache) │ │
│  └─────────┘  └────────────────┘ │
│  ┌─────────────────────────────┐ │
│  │     WatermelonDB (offline)  │ │
│  │     MMKV (fast KV / auth)   │ │
│  └─────────────────────────────┘ │
│  ┌──────────┐  ┌───────────────┐ │
│  │ Expo     │  │ react-native- │ │
│  │ Camera   │  │ maps (Google) │ │
│  └──────────┘  └───────────────┘ │
│  ┌─────────────────────────────┐ │
│  │  Socket.io client           │ │
│  │  (Social Agent live feed)   │ │
│  └─────────────────────────────┘ │
└──────────────┬───────────────────┘
               │ HTTPS REST + WSS
               ▼
┌─────────────────────────────────────────────────────────┐
│                   AWS ECS / FARGATE                       │
│                                                           │
│  ┌─────────────────────────────────────────────────────┐ │
│  │              MAIN API SERVICE                        │ │
│  │            Node.js + Fastify v4                      │ │
│  │                                                       │ │
│  │  /auth      /trips      /places    /transport        │ │
│  │  /food      /translate  /budget    /social-intel     │ │
│  │  /payments  /users      /ai        /notifications    │ │
│  │                                                       │ │
│  │  ┌──────────────────┐  ┌───────────────────────────┐ │ │
│  │  │  Socket.io       │  │  LLMClient (abstraction)  │ │ │
│  │  │  + Redis Adapter │  │  Claude → GPT-4o fallback │ │ │
│  │  └──────────────────┘  └───────────────────────────┘ │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                           │
│  ┌─────────────────────────────────────────────────────┐ │
│  │          SOCIAL INTELLIGENCE AGENT SERVICE           │ │
│  │           (Separate ECS Task Definition)             │ │
│  │                                                       │ │
│  │  BullMQ Workers:                                      │ │
│  │  ├── YouTubeCrawler (API, every 30min)                │ │
│  │  ├── RedditCrawler  (API, every 30min)                │ │
│  │  ├── TwitterCrawler (API v2, every 30min)             │ │
│  │  ├── PlaywrightCrawler (JS-heavy, every 60min)        │ │
│  │  ├── ExtractionWorker (GPT-4o mini batch)             │ │
│  │  ├── ScoringWorker (Trend Score formula)              │ │
│  │  └── PushWorker (→ Redis pub/sub → Socket.io)         │ │
│  └─────────────────────────────────────────────────────┘ │
└────────────────┬─────────────────────────────────────────┘
                 │
       ┌─────────┴──────────┐
       │                    │
       ▼                    ▼
┌─────────────┐    ┌────────────────────────┐
│ PostgreSQL  │    │  Redis 7               │
│ AWS RDS     │    │  AWS ElastiCache       │
│             │    │                        │
│ - users     │    │  - API response cache  │
│ - trips     │    │  - Session tokens      │
│ - itins     │    │  - Rate limit counters │
│ - places    │    │  - BullMQ queues       │
│ - social    │    │  - Socket.io pub/sub   │
│ - budgets   │    │  - Google Places cache │
│ - subs      │    │  - Itinerary cache     │
└─────────────┘    └────────────────────────┘

       ┌──────────────────────────────────┐
       │         EXTERNAL SERVICES        │
       │                                  │
       │  ┌──────────┐  ┌──────────────┐ │
       │  │ Supabase │  │   Stripe     │ │
       │  │ Auth     │  │  Webhooks    │ │
       │  └──────────┘  └──────────────┘ │
       │  ┌──────────┐  ┌──────────────┐ │
       │  │ Claude   │  │  OpenAI      │ │
       │  │ API      │  │  API         │ │
       │  └──────────┘  └──────────────┘ │
       │  ┌──────────┐  ┌──────────────┐ │
       │  │ Google   │  │  AWS S3 +    │ │
       │  │ APIs     │  │  CloudFront  │ │
       │  └──────────┘  └──────────────┘ │
       │  ┌──────────┐  ┌──────────────┐ │
       │  │ FCM /    │  │  Resend      │ │
       │  │ APNs     │  │  (Email)     │ │
       │  └──────────┘  └──────────────┘ │
       └──────────────────────────────────┘
```

---

## 4. Database Schema

All tables use PostgreSQL 16. UUIDs as primary keys (gen_random_uuid()). `created_at` / `updated_at` on all tables via trigger. Soft deletes (`deleted_at`) where noted.

### 4.1 Users & Authentication

```sql
-- Users (mirrors Supabase auth.users, extends it)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  tier TEXT NOT NULL DEFAULT 'explorer'  -- 'explorer' | 'voyager' | 'nomad_pro'
    CHECK (tier IN ('explorer', 'voyager', 'nomad_pro')),
  tier_source TEXT,                       -- 'stripe' | 'apple_iap' | 'google_iap' | 'manual'
  tier_expires_at TIMESTAMPTZ,            -- NULL = lifetime (Voyager) or current period end (Pro)
  
  -- Preferences
  preferred_currency TEXT NOT NULL DEFAULT 'GBP',
  preferred_language TEXT NOT NULL DEFAULT 'en',
  theme TEXT NOT NULL DEFAULT 'dark_light'
    CHECK (theme IN ('dark_light', 'aurora_dark', 'warm_sand', 'electric')),
  category_colours JSONB,                 -- {"food": "#hex", "landmarks": "#hex", ...}
  
  -- Stats
  total_trips INT NOT NULL DEFAULT 0,
  total_days INT NOT NULL DEFAULT 0,
  total_tasks_completed INT NOT NULL DEFAULT 0,
  countries_visited TEXT[] DEFAULT '{}',  -- ISO 3166-1 alpha-2 array
  
  -- Referral
  referral_code TEXT UNIQUE,
  referred_by UUID REFERENCES users(id),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_users_tier ON users(tier);
CREATE INDEX idx_users_referral_code ON users(referral_code);
```

### 4.2 Subscriptions & Entitlements

```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  
  -- Source of truth
  provider TEXT NOT NULL 
    CHECK (provider IN ('stripe', 'apple_iap', 'google_iap')),
  provider_subscription_id TEXT,         -- Stripe sub ID / Apple original_transaction_id
  provider_customer_id TEXT,             -- Stripe customer ID
  
  product_id TEXT NOT NULL,              -- 'voyager_lifetime' | 'nomad_pro_monthly' | 'nomad_pro_annual'
  status TEXT NOT NULL 
    CHECK (status IN ('active', 'cancelled', 'expired', 'pending', 'past_due')),
  
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,        -- NULL for lifetime
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  
  raw_webhook JSONB,                     -- Store last webhook payload for debugging
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_provider_id ON subscriptions(provider_subscription_id);

-- Entitlement check function
CREATE OR REPLACE FUNCTION get_user_tier(p_user_id UUID) RETURNS TEXT AS $$
  SELECT tier FROM users WHERE id = p_user_id;
$$ LANGUAGE sql STABLE SECURITY DEFINER;
```

### 4.3 Trips

```sql
CREATE TABLE trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  
  -- Destination
  destination TEXT NOT NULL,             -- "Tokyo, Japan"
  country_code TEXT NOT NULL,            -- ISO 3166-1 alpha-2
  city TEXT,
  destination_lat DECIMAL(9,6),
  destination_lng DECIMAL(9,6),
  
  -- Dates
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  duration_days INT NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'UTC',  -- IANA timezone string
  
  -- Budget
  budget_amount DECIMAL(12,2),
  budget_currency TEXT NOT NULL DEFAULT 'GBP',
  trip_type TEXT,                        -- 'solo' | 'couple' | 'family' | 'group' | 'business'
  
  -- AI Generation
  travel_preferences JSONB,              -- {"dietary": ["vegan"], "pace": "relaxed", "interests": [...]}
  ai_model_used TEXT,                    -- 'claude-3-5-sonnet' | 'gpt-4o'
  generation_prompt_version TEXT,        -- e.g., 'v2.3' — for prompt iteration tracking
  destination_confidence TEXT 
    CHECK (destination_confidence IN ('high', 'medium', 'low')),
  
  -- Status
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('draft', 'active', 'archived')),
  
  -- Sharing
  share_token TEXT UNIQUE,               -- Public share URL token
  is_shared BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_trips_user_id ON trips(user_id);
CREATE INDEX idx_trips_status ON trips(user_id, status);
CREATE INDEX idx_trips_country ON trips(country_code);
```

### 4.4 Itinerary Structure

```sql
-- Itinerary days (one per calendar day of trip)
CREATE TABLE itinerary_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  day_number INT NOT NULL,               -- 1-based
  date DATE NOT NULL,
  title TEXT,                            -- AI-generated day title, e.g., "Temple District & Street Food"
  summary TEXT,                          -- Short AI summary of the day
  weather_snapshot JSONB,               -- {temp, condition, icon} cached at generation time
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(trip_id, day_number)
);

CREATE INDEX idx_itinerary_days_trip_id ON itinerary_days(trip_id);

-- Tasks (individual items in the daily planner)
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_id UUID NOT NULL REFERENCES itinerary_days(id) ON DELETE CASCADE,
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE, -- denormalized for query perf
  
  -- Position
  position SMALLINT NOT NULL,            -- Sort order (0-based)
  
  -- Content
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general'
    CHECK (category IN ('food', 'landmark', 'transport', 'culture', 'budget', 'accommodation', 'general')),
  
  -- Timing
  start_time TIME,                       -- Local time
  end_time TIME,
  duration_minutes INT,
  
  -- Venue link
  venue_id UUID REFERENCES venues(id),
  
  -- Status
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  is_custom BOOLEAN NOT NULL DEFAULT FALSE,  -- User-added vs AI-generated
  
  -- Transport
  travel_time_to_next_minutes INT,
  transport_mode TEXT,                   -- 'walk' | 'metro' | 'bus' | 'taxi' | 'bike'
  
  -- Cost
  estimated_cost DECIMAL(10,2),
  actual_cost DECIMAL(10,2),
  currency TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tasks_day_id ON tasks(day_id);
CREATE INDEX idx_tasks_trip_id ON tasks(trip_id);
CREATE INDEX idx_tasks_position ON tasks(day_id, position);
```

### 4.5 Venues & Places

```sql
CREATE TABLE venues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Google Places data
  google_place_id TEXT UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  sub_category TEXT,
  
  -- Location
  address TEXT,
  city TEXT,
  country_code TEXT,
  lat DECIMAL(9,6),
  lng DECIMAL(9,6),
  
  -- Details
  phone TEXT,
  website TEXT,
  google_rating DECIMAL(2,1),
  google_review_count INT,
  price_level SMALLINT,                  -- 1-4 (Google scale)
  
  -- Hours
  opening_hours JSONB,                   -- Google's structured hours object
  hours_fetched_at TIMESTAMPTZ,
  
  -- Photos
  photos JSONB,                          -- [{url, source, attribution, width, height}]
  
  -- EasyTrip-enriched
  estimated_cost_low DECIMAL(10,2),
  estimated_cost_high DECIMAL(10,2),
  cost_currency TEXT,
  entry_fee DECIMAL(10,2),
  booking_url TEXT,
  
  -- Peak hours (from Google Popular Times data)
  peak_hours JSONB,                      -- {monday: [0,0,...,100,...,0], ...} (hourly, 0-100)
  
  -- Dietary tags
  dietary_tags TEXT[],                   -- ['vegan', 'halal', 'vegetarian', 'gluten_free']
  
  -- Caching
  places_api_fetched_at TIMESTAMPTZ,
  places_api_version TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_venues_google_place_id ON venues(google_place_id);
CREATE INDEX idx_venues_location ON venues USING GIST (point(lat, lng));
CREATE INDEX idx_venues_country ON venues(country_code);
CREATE INDEX idx_venues_category ON venues(category);
```

### 4.6 Social Intelligence Data

```sql
-- Raw crawled posts
CREATE TABLE social_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Source
  platform TEXT NOT NULL
    CHECK (platform IN ('youtube', 'tiktok', 'twitter', 'instagram', 'facebook', 'reddit', 'blog', 'review_site')),
  platform_post_id TEXT,
  post_url TEXT,
  
  -- Content (extracted by LLM)
  title TEXT,
  content_snippet TEXT,                  -- max 50 words (GDPR + fair use)
  
  -- Location extracted
  destination TEXT,
  city TEXT,
  country_code TEXT,
  venue_id UUID REFERENCES venues(id),
  
  -- Creator
  creator_username TEXT,
  creator_display_name TEXT,
  creator_follower_count BIGINT,
  creator_verified BOOLEAN DEFAULT FALSE,
  
  -- Engagement
  likes_count BIGINT DEFAULT 0,
  views_count BIGINT DEFAULT 0,
  comments_count BIGINT DEFAULT 0,
  shares_count BIGINT DEFAULT 0,
  
  -- Classification
  content_type TEXT 
    CHECK (content_type IN ('influencer_pick', 'pricing_intel', 'travel_tip', 'hidden_gem', 'warning', 'general')),
  sentiment TEXT 
    CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  
  -- Trend Score (0-100, calculated by ScoringWorker)
  trend_score SMALLINT CHECK (trend_score >= 0 AND trend_score <= 100),
  
  -- Timing
  posted_at TIMESTAMPTZ,
  crawled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  extracted_at TIMESTAMPTZ,
  score_updated_at TIMESTAMPTZ,
  
  -- Metadata
  thumbnail_url TEXT,
  extraction_confidence TEXT 
    CHECK (extraction_confidence IN ('high', 'medium', 'low')),
  raw_extraction JSONB,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_social_posts_country ON social_posts(country_code);
CREATE INDEX idx_social_posts_city ON social_posts(city);
CREATE INDEX idx_social_posts_trend_score ON social_posts(trend_score DESC) WHERE extraction_confidence = 'high';
CREATE INDEX idx_social_posts_posted_at ON social_posts(posted_at DESC);
CREATE INDEX idx_social_posts_venue ON social_posts(venue_id);

-- Crawl job tracking
CREATE TABLE crawl_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL,
  target TEXT,                           -- search query or URL
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  posts_found INT DEFAULT 0,
  posts_extracted INT DEFAULT 0,
  status TEXT CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 4.7 Budget & Expenses

```sql
CREATE TABLE budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  total_amount DECIMAL(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'GBP',
  
  -- Category allocations
  food_allocation DECIMAL(12,2),
  transport_allocation DECIMAL(12,2),
  accommodation_allocation DECIMAL(12,2),
  activities_allocation DECIMAL(12,2),
  other_allocation DECIMAL(12,2),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(trip_id)
);

CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  
  amount DECIMAL(12,2) NOT NULL,
  currency TEXT NOT NULL,
  amount_in_base DECIMAL(12,2),          -- Converted to trip base currency at log time
  exchange_rate DECIMAL(12,6),
  
  category TEXT NOT NULL
    CHECK (category IN ('food', 'transport', 'accommodation', 'activities', 'shopping', 'other')),
  
  description TEXT,
  venue_id UUID REFERENCES venues(id),
  task_id UUID REFERENCES tasks(id),
  
  logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_expenses_trip_id ON expenses(trip_id);
```

### 4.8 Translations & Phrasebook

```sql
CREATE TABLE phrasebook_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  language_code TEXT NOT NULL,           -- ISO 639-1
  language_name TEXT NOT NULL,
  category TEXT NOT NULL 
    CHECK (category IN ('greetings', 'transport', 'food', 'emergency', 'shopping', 'accommodation', 'general')),
  
  phrase_en TEXT NOT NULL,
  phrase_native TEXT NOT NULL,
  romanisation TEXT,
  phonetic TEXT,
  
  audio_url TEXT,                        -- S3 URL, generated on demand
  audio_generated_at TIMESTAMPTZ,
  
  is_custom BOOLEAN DEFAULT FALSE,       -- User-added phrase
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_phrasebook_language ON phrasebook_entries(language_code);
CREATE INDEX idx_phrasebook_category ON phrasebook_entries(language_code, category);

CREATE TABLE saved_phrases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  phrase_id UUID REFERENCES phrasebook_entries(id),
  custom_phrase_en TEXT,                 -- For user-saved ad-hoc translations
  custom_phrase_native TEXT,
  language_code TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 4.9 Themes & Preferences

```sql
CREATE TABLE theme_preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  active_theme TEXT NOT NULL DEFAULT 'dark_light',
  -- Category colour overrides per theme
  aurora_dark_colours JSONB,            -- {food: "#hex", landmarks: "#hex", ...}
  warm_sand_colours JSONB,
  electric_colours JSONB,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 4.10 Achievements

```sql
CREATE TABLE achievements (
  id TEXT PRIMARY KEY,                   -- 'first_trip', 'ten_countries', 'early_bird', etc.
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  tier_required TEXT DEFAULT 'voyager',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE user_achievements (
  user_id UUID NOT NULL REFERENCES users(id),
  achievement_id TEXT NOT NULL REFERENCES achievements(id),
  earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, achievement_id)
);
```

### 4.11 Transport Passes (Curated)

```sql
CREATE TABLE transport_passes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city TEXT NOT NULL,
  country_code TEXT NOT NULL,
  pass_name TEXT NOT NULL,
  description TEXT,
  coverage TEXT,
  cost_amount DECIMAL(10,2),
  cost_currency TEXT,
  validity_period TEXT,
  purchase_locations TEXT,
  website_url TEXT,
  last_verified_at DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_transport_passes_city ON transport_passes(city);
CREATE INDEX idx_transport_passes_country ON transport_passes(country_code);
```

### 4.12 AI Conversations (Trip Assistant)

```sql
CREATE TABLE ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE ai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  token_count INT,
  model_used TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_messages_conversation ON ai_messages(conversation_id, created_at);
```

---

## 5. API Endpoint Design

Base URL: `https://api.easytrip.app/v1`

All endpoints (except `/auth/*` and `/webhooks/*`) require `Authorization: Bearer <jwt>` header.
Tier enforcement is handled by the `requireTier` middleware.

### 5.1 Authentication

```
POST   /auth/register                  — Email + password registration
POST   /auth/login                     — Email + password login
POST   /auth/oauth/google              — Google OAuth callback
POST   /auth/oauth/apple               — Apple OAuth callback
POST   /auth/refresh                   — Refresh JWT
POST   /auth/logout                    — Invalidate session
POST   /auth/forgot-password           — Send reset email
POST   /auth/reset-password            — Confirm reset
GET    /auth/me                        — Current user + tier
```

### 5.2 Users & Profile

```
GET    /users/me                       — Full profile + stats
PATCH  /users/me                       — Update profile (name, currency, language)
GET    /users/me/achievements          — All earned achievements
GET    /users/me/entitlements          — Tier + feature flags
DELETE /users/me                       — Account deletion (GDPR)
```

### 5.3 Trips

```
GET    /trips                          — List user's trips (paginated)
POST   /trips                          — Create new trip (wizard step 1-3 data)
GET    /trips/:tripId                  — Get trip + itinerary overview
PATCH  /trips/:tripId                  — Update trip settings
DELETE /trips/:tripId                  — Soft delete trip
POST   /trips/:tripId/generate         — Trigger AI itinerary generation [ASYNC]
GET    /trips/:tripId/status           — Get generation status (polling fallback)
POST   /trips/:tripId/regenerate-day   — Regenerate single day [Voyager+]
GET    /trips/:tripId/share-token      — Get/create share token [Voyager+]
GET    /trips/shared/:token            — Public share view (no auth)
POST   /trips/:tripId/export           — Export as PDF/JSON [Voyager+]
```

### 5.4 Itinerary & Tasks

```
GET    /trips/:tripId/days             — All days + tasks
GET    /trips/:tripId/days/:dayId      — Single day detail
PATCH  /trips/:tripId/days/:dayId      — Update day (title, summary)

GET    /trips/:tripId/days/:dayId/tasks            — List tasks
POST   /trips/:tripId/days/:dayId/tasks            — Add custom task [Voyager+]
PATCH  /trips/:tripId/days/:dayId/tasks/:taskId    — Update task (complete, edit)
DELETE /trips/:tripId/days/:dayId/tasks/:taskId    — Delete task
POST   /trips/:tripId/days/:dayId/tasks/reorder    — Drag-to-reorder (send new position array)
```

### 5.5 Places & Venues

```
GET    /places/search                  — Search venues (lat/lng + radius + category + query)
GET    /places/:placeId                — Venue detail (Google Place ID or our UUID)
GET    /places/:placeId/photos         — Venue photos
GET    /places/:placeId/social-intel   — Social posts about this venue [Nomad Pro]
POST   /places/:placeId/favourite      — Save to trip [Voyager+]
```

### 5.6 Transport

```
POST   /transport/route                — Multi-modal route (from, to, depart_at, modes)
GET    /transport/passes               — Travel passes for a city (city + country_code)
GET    /transport/disruptions          — Real-time disruptions [Nomad Pro, v1.5]
```

### 5.7 Food & Dining

```
GET    /food/search                    — Restaurant search (lat/lng, cuisine, dietary, budget)
GET    /food/areas                     — Best food areas for a destination
GET    /food/local-dishes              — Local dishes for a country/city
```

### 5.8 Translation

```
POST   /translate/text                 — Translate text (source → target language)
POST   /translate/ocr                  — OCR image + translate [Voyager+]
GET    /translate/phrasebook           — Phrasebook for language + category
GET    /translate/phrasebook/:phraseId/audio  — Get/generate audio for phrase [Voyager+]
POST   /translate/saved                — Save phrase to library [Voyager+]
GET    /translate/saved                — Get saved phrases [Voyager+]
```

### 5.9 Budget & Expenses

```
GET    /trips/:tripId/budget           — Budget overview + breakdown
PATCH  /trips/:tripId/budget           — Update budget allocations
POST   /trips/:tripId/expenses         — Log expense
GET    /trips/:tripId/expenses         — List expenses
PATCH  /trips/:tripId/expenses/:id     — Edit expense
DELETE /trips/:tripId/expenses/:id     — Delete expense
GET    /currency/rates                 — Latest exchange rates
```

### 5.10 Social Intelligence

```
GET    /social-intel/feed              — Live feed for destination [Nomad Pro]
       ?country_code=JP&city=Tokyo&filter=food&sort=trend_score
GET    /social-intel/trending          — Trending destinations [Nomad Pro]
GET    /social-intel/celeb-picks       — Celeb/influencer picks [Nomad Pro]
```

### 5.11 AI & Assistant

```
POST   /ai/generate-itinerary          — Trigger generation (returns jobId)
GET    /ai/jobs/:jobId                 — Poll generation job status
GET    /trips/:tripId/assistant        — Get conversation history [Nomad Pro]
POST   /trips/:tripId/assistant/message — Send message to AI assistant [Nomad Pro]
DELETE /trips/:tripId/assistant        — Clear conversation history
```

### 5.12 Payments

```
POST   /payments/create-checkout       — Create Stripe checkout session (web)
POST   /payments/verify-iap            — Verify Apple/Google IAP receipt
GET    /payments/subscription          — Current subscription details
POST   /payments/cancel-subscription   — Cancel Pro subscription
GET    /payments/billing-portal        — Stripe billing portal URL
POST   /webhooks/stripe                — Stripe webhook receiver
POST   /webhooks/apple-iap             — Apple server notification
POST   /webhooks/google-iap            — Google Play notification
```

### 5.13 Notifications & Settings

```
POST   /notifications/register-token   — Register FCM/APNs device token
DELETE /notifications/register-token   — Unregister device
PATCH  /settings/theme                 — Update theme preference [Voyager+]
PATCH  /settings/category-colours      — Update category colours [Voyager+]
```

### 5.14 Weather

```
GET    /weather                        — Weather for destination + dates
       ?lat=35.6762&lng=139.6503&start_date=2026-06-01&end_date=2026-06-07
```

---

## 6. Authentication & Authorization

### 6.1 Flow

```
Mobile App
  → Supabase Auth (Google/Apple OAuth or email)
  → Supabase issues JWT (access token, refresh token)
  → App stores JWT in MMKV (encrypted)
  → All API requests: Authorization: Bearer <jwt>
  → Fastify middleware verifies JWT signature (Supabase public key)
  → Attaches user_id + tier to request context
```

### 6.2 JWT Verification Middleware

```typescript
// fastify-supabase-auth plugin
const verifyJWT = async (request: FastifyRequest, reply: FastifyReply) => {
  const token = request.headers.authorization?.split(' ')[1];
  if (!token) return reply.code(401).send({ error: 'Unauthorized' });

  const { data: user, error } = await supabase.auth.getUser(token);
  if (error || !user) return reply.code(401).send({ error: 'Invalid token' });

  // Fetch tier from our users table (not from JWT claims — tier changes 
  // happen via webhooks and we need real-time accuracy)
  const { tier } = await db.query.users.findFirst({
    where: eq(users.id, user.user.id),
    columns: { tier: true }
  });

  request.userId = user.user.id;
  request.userTier = tier;
};
```

### 6.3 Tier-Based Feature Gating

```typescript
// Middleware factory
const requireTier = (minTier: 'voyager' | 'nomad_pro') => {
  const tierRank = { explorer: 0, voyager: 1, nomad_pro: 2 };
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (tierRank[request.userTier] < tierRank[minTier]) {
      return reply.code(403).send({ 
        error: 'upgrade_required',
        required_tier: minTier,
        upsell_context: getUpsellContext(request.routeOptions.url)
      });
    }
  };
};

// Route example
fastify.post('/translate/ocr', { 
  preHandler: [verifyJWT, requireTier('voyager')] 
}, ocrHandler);
```

### 6.4 Free Tier Enforcement

Server-side enforcement only (client-side paywalls are UI, not security):

```typescript
// Trip creation guard
const enforceTripLimits = async (userId: string, tier: string) => {
  if (tier === 'explorer') {
    const count = await db.count(trips).where(and(
      eq(trips.userId, userId),
      isNull(trips.deletedAt)
    ));
    if (count >= 3) throw new UpgradeRequiredError('voyager', 'trip_limit');
  }
};

// Itinerary generation guard
const enforceDayLimit = (durationDays: number, tier: string) => {
  if (tier === 'explorer' && durationDays > 3) {
    throw new UpgradeRequiredError('voyager', 'day_limit');
  }
};
```

---

## 7. AI Itinerary Generation Pipeline

### 7.1 Overview

```
Client request → POST /ai/generate-itinerary
  → Validate inputs (Zod)
  → Check tier limits
  → Check cache (same destination + dates + prefs hash → return cached)
  → Enqueue BullMQ job (returns jobId immediately)
  → Client polls GET /ai/jobs/:jobId (or receives SSE update)
  → Worker: fetch context data (weather, places, transport passes, local dishes)
  → Worker: build prompt with context
  → Worker: call LLMClient (Claude → GPT-4o fallback)
  → Worker: validate output with Zod schema
  → Worker: upsert to DB (trips, itinerary_days, tasks, venues)
  → Worker: push completion via WebSocket or SSE
  → Client receives completed itinerary
```

### 7.2 Cache Key Strategy

```typescript
const buildCacheKey = (params: GenerationParams): string => {
  const normalized = {
    destination: params.destination.toLowerCase().trim(),
    start_date: params.startDate,
    duration_days: params.durationDays,
    budget_tier: bucketBudget(params.budgetAmount), // 'budget' | 'mid' | 'luxury'
    trip_type: params.tripType,
    dietary: [...params.dietary].sort().join(','),
    interests: [...params.interests].sort().join(','),
  };
  return `itinerary:v2:${hashObject(normalized)}`;
};
// TTL: 24h. Same inputs = same itinerary served from cache.
// Pro users get fresh generation by default (can be toggled).
```

### 7.3 Prompt Architecture

**System Prompt (versioned, stored in DB as `prompt_templates`):**

```
You are EasyTrip's AI travel planner. Generate a detailed, day-by-day travel itinerary.

RULES:
- Return ONLY valid JSON matching the schema below. No markdown, no prose.
- Use local time for all times. Include timezone offset.
- Include realistic travel times between venues.
- Suggest real, verified venues (you will be given a list of confirmed venues to use).
- Match the user's budget tier, dietary requirements, and interests.
- Peak hour warnings where relevant (rush hours, popular attraction queues).
- Provide a destination_confidence field: "high" | "medium" | "low".
- If confidence is low, add a note in the day summary.

OUTPUT SCHEMA: [Zod schema serialised as JSON Schema]
```

**User Prompt template:**

```typescript
const buildUserPrompt = (ctx: GenerationContext): string => `
Generate a ${ctx.durationDays}-day itinerary for ${ctx.destination}.

TRIP DETAILS:
- Dates: ${ctx.startDate} to ${ctx.endDate} (${ctx.timezone})
- Traveller: ${ctx.tripType}
- Budget: ${ctx.budgetTier} (total budget: ${ctx.budgetAmount} ${ctx.currency})
- Interests: ${ctx.interests.join(', ')}
- Dietary requirements: ${ctx.dietary.join(', ') || 'none'}
- Pace preference: ${ctx.pace}

WEATHER FORECAST:
${JSON.stringify(ctx.weatherForecast)}

CONFIRMED VENUES (use these where relevant, you may add others):
${JSON.stringify(ctx.confirmedVenues.slice(0, 20))}

TRANSPORT PASSES AVAILABLE:
${JSON.stringify(ctx.transportPasses)}

LOCAL DISHES TO FEATURE:
${ctx.localDishes.join(', ')}

TRAVEL PASS INFO:
${JSON.stringify(ctx.transportPasses)}

Generate the full itinerary. Be specific. Include opening times, costs, and how to get there.
`;
```

### 7.4 Output Schema (Zod)

```typescript
const TaskSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  category: z.enum(['food', 'landmark', 'transport', 'culture', 'budget', 'accommodation', 'general']),
  start_time: z.string().regex(/^\d{2}:\d{2}$/),
  end_time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  duration_minutes: z.number().int().optional(),
  venue_name: z.string().optional(),
  venue_address: z.string().optional(),
  google_place_id: z.string().optional(),
  estimated_cost: z.number().optional(),
  travel_time_to_next_minutes: z.number().int().optional(),
  transport_mode: z.enum(['walk', 'metro', 'bus', 'taxi', 'bike']).optional(),
  tips: z.string().optional(),
});

const DaySchema = z.object({
  day_number: z.number().int().min(1),
  title: z.string(),
  summary: z.string(),
  tasks: z.array(TaskSchema).min(3).max(12),
});

const ItineraryOutputSchema = z.object({
  destination_confidence: z.enum(['high', 'medium', 'low']),
  confidence_note: z.string().optional(),
  days: z.array(DaySchema),
  estimated_total_cost: z.number(),
  currency: z.string().length(3),
  ai_tips: z.array(z.string()).max(5),
});
```

### 7.5 Retry & Fallback Logic

```typescript
class LLMClient {
  async generate(prompt: Prompt): Promise<ItineraryOutput> {
    const providers = [
      { name: 'claude', fn: this.callClaude.bind(this) },
      { name: 'openai', fn: this.callOpenAI.bind(this) },
    ];
    
    for (const provider of providers) {
      try {
        const raw = await Promise.race([
          provider.fn(prompt),
          timeout(30_000) // 30s timeout per attempt
        ]);
        const parsed = ItineraryOutputSchema.safeParse(raw);
        if (parsed.success) return parsed.data;
        // If Zod fails, try next provider
        logger.warn(`${provider.name} returned invalid schema, trying fallback`);
      } catch (e) {
        logger.error(`${provider.name} failed: ${e.message}`);
      }
    }
    throw new GenerationError('All AI providers failed');
  }
}
```

### 7.6 Rate Limiting by Tier

```
Explorer:  Max 3 total generations (lifetime), max 3 days per trip
Voyager:   Unlimited, max 1 concurrent generation per user, queue depth 3
Pro:       Unlimited, max 3 concurrent, priority queue (processed first)
```

---

## 8. Social Intelligence Agent Architecture

### 8.1 Overview

The Social Intelligence Agent is a **separate ECS service** that shares the PostgreSQL database but has no runtime dependency on the main API. It can be deployed, scaled, and disabled independently.

### 8.2 Pipeline

```
CRAWL LAYER
  ├── APIWorker (YouTube, Reddit, Twitter/X via official APIs)
  │     Schedule: every 30 min per platform per active destination
  │     Output: raw posts → RawPostsQueue (BullMQ)
  │
  └── PlaywrightWorker (blogs, review aggregators)
        Schedule: every 60 min (rate-limit sensitive)
        Output: scraped HTML → RawPostsQueue (BullMQ)

EXTRACTION LAYER
  └── ExtractionWorker
        Input: RawPostsQueue
        Process: GPT-4o mini with structured JSON prompt
        Prompt: "Extract venue name, city, country, sentiment, price mentions,
                 content type, and a 50-word max summary from this post.
                 Return null if no travel venue is mentioned.
                 Respond ONLY with JSON."
        Output: Validated ExtractedPost → ExtractedQueue (BullMQ)

SCORING LAYER
  └── ScoringWorker
        Input: ExtractedQueue
        Formula: 
          trend_score = (
            log10(follower_count + 1) * 15 +    // reach (0-30)
            engagement_rate * 25 +               // engagement (0-25)
            recency_score * 20 +                 // 0-20 based on hours since post
            mention_velocity * 20 +              // same venue mentioned N times recently
            sentiment_score * 15                 // positive=15, neutral=7, negative=0
          ) clamped to 0-100
        Output: Updates social_posts.trend_score

PUSH LAYER
  └── PushWorker
        Trigger: High-scoring post (score > 70) or score spike (+20 in 1h)
        Output: Publishes to Redis pub/sub channel: 
                `social:${country_code}:${city}` 
                → Socket.io server picks up and fans out to subscribed clients
```

### 8.3 Destination Targeting

The agent doesn't crawl everything — it focuses crawls on:
1. Destinations with active trips in the last 7 days (from `trips` table)
2. Top 50 global travel destinations (static list, always crawled)
3. Trending destination candidates (social mentions rising)

```typescript
// CrawlScheduler runs every 15 min
const getActiveCrawlTargets = async (): Promise<string[]> => {
  const recentDestinations = await db.selectDistinct({ city: trips.city })
    .from(trips)
    .where(gt(trips.startDate, subDays(new Date(), 7)));
  
  return [...new Set([
    ...ALWAYS_CRAWL_DESTINATIONS,
    ...recentDestinations.map(d => d.city)
  ])];
};
```

### 8.4 Phase-in Plan (addressing Project Brief recommendation)

- **Launch (v1):** Social agent backend running in "silent mode" — crawling and populating DB, not surfaced to users. Data quality validation period.
- **v1.5 (4-6 weeks post-launch):** Enable Social Intelligence screen (SCR-10) and venue card social proof for Pro users as "Beta" feature.
- **v2:** Full production, additional sources, enhanced scoring.

**Source priority:**
1. Reddit API — stable, free, high-quality travel content
2. YouTube Data API v3 — stable, free quota, excellent for travel vlogs
3. Twitter/X Basic API — $100/mo, some rate limits, but workable
4. Playwright scraping — blogs, review sites (respecting robots.txt)
5. Instagram/TikTok — v2 only (no stable API, high scraping risk)

---

## 9. Real-Time Architecture

### 9.1 Socket.io with Redis Adapter

All WebSocket connections go through Socket.io on the main Fastify service. Redis pub/sub is used for horizontal scaling across multiple ECS instances.

```typescript
// fastify-socket.io setup
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';

const pubClient = new Redis(process.env.REDIS_URL);
const subClient = pubClient.duplicate();

io.adapter(createAdapter(pubClient, subClient));

// Client subscribes to destination room
io.on('connection', (socket) => {
  const { tripId, city, countryCode } = socket.handshake.auth;
  
  // Verify JWT
  const user = await verifySocketJWT(socket);
  if (!user || user.tier !== 'nomad_pro') {
    socket.disconnect();
    return;
  }
  
  // Join destination room
  socket.join(`social:${countryCode}:${city}`);
  socket.join(`trip:${tripId}`); // For trip-specific updates
});
```

### 9.2 Event Types

```typescript
// Social intelligence update
interface SocialUpdateEvent {
  type: 'social_post';
  post: {
    id: string;
    platform: string;
    venue_id: string;
    creator_username: string;
    content_snippet: string;
    trend_score: number;
    post_url: string;
  };
}

// Itinerary generation complete
interface GenerationCompleteEvent {
  type: 'generation_complete' | 'generation_failed';
  jobId: string;
  tripId?: string;
  error?: string;
}

// Trip disruption alert (v1.5)
interface DisruptionAlertEvent {
  type: 'disruption';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  affects: string[]; // Task IDs or venue IDs
}
```

### 9.3 SSE Fallback

For environments where WebSocket is blocked (some enterprise networks, proxy issues), a Server-Sent Events endpoint provides the same real-time data:

```
GET /sse/social-intel?country_code=JP&city=Tokyo
GET /sse/trip/:tripId/generation
```

---

## 10. Offline-First Strategy

### 10.1 What Is Cached Offline

| Data | Storage | TTL / Policy |
|---|---|---|
| Current trip itinerary (JSON) | WatermelonDB | Permanent until trip deleted |
| Task completion state | WatermelonDB | Sync on reconnect |
| Venue details for trip tasks | WatermelonDB | Downloaded when trip created |
| Phrasebook (selected languages) | WatermelonDB | Manual download [Voyager+] |
| Exchange rates | MMKV | 6-hour TTL |
| Auth tokens | MMKV encrypted | Standard JWT TTL |
| Theme preferences | MMKV | Permanent |
| Trip photos (thumbnails) | expo-file-system | Downloaded when trip created |

**Not cached offline (v1):**
- Maps (v2)
- Social intelligence feed
- AI assistant
- Live transport routing (requires network)

### 10.2 WatermelonDB Schema

```typescript
// models/Trip.ts
class Trip extends Model {
  static table = 'trips';
  @field('server_id') serverId!: string;
  @field('destination') destination!: string;
  @field('start_date') startDate!: string;
  @field('end_date') endDate!: string;
  @field('status') status!: string;
  @field('synced_at') syncedAt!: number;
  @children('itinerary_days') days!: Query<ItineraryDay>;
}

// models/ItineraryDay.ts
class ItineraryDay extends Model {
  static table = 'itinerary_days';
  @field('server_id') serverId!: string;
  @relation('trips', 'trip_id') trip!: Relation<Trip>;
  @field('day_number') dayNumber!: number;
  @field('date') date!: string;
  @field('title') title!: string;
  @children('tasks') tasks!: Query<Task>;
}

// models/Task.ts
class Task extends Model {
  static table = 'tasks';
  @field('server_id') serverId!: string;
  @relation('itinerary_days', 'day_id') day!: Relation<ItineraryDay>;
  @field('position') position!: number;
  @field('title') title!: string;
  @field('category') category!: string;
  @field('start_time') startTime!: string;
  @field('is_completed') isCompleted!: boolean;
  @field('is_dirty') isDirty!: boolean;  // Modified offline, needs sync
  @field('completed_at') completedAt!: number | null;
}
```

### 10.3 Sync Protocol

```
ON RECONNECT:
  1. GET /sync/state?since=<last_sync_timestamp>
     Server returns: {updated: [...], deleted: [...], server_time: <timestamp>}
  2. Apply server changes to WatermelonDB (server wins for itinerary structure)
  3. Push dirty local changes (completed tasks, custom tasks, expense logs)
     POST /sync/push {changes: [{table, serverId, fields, updatedAt}]}
  4. Server applies user changes (user wins for completion state + custom tasks)
  5. Update last_sync_timestamp in MMKV

CONFLICT RESOLUTION:
  - Itinerary structure (positions, AI tasks): server wins
  - Task completion state: last-write wins (timestamp comparison)
  - Custom tasks created offline: merged (no conflict possible)
  - Expenses logged offline: merged (additive, no conflict)
```

### 10.4 Offline Detection

```typescript
// useNetworkStatus hook
import NetInfo from '@react-native-community/netinfo';

const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(true);
  
  useEffect(() => {
    return NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected && state.isInternetReachable);
    });
  }, []);
  
  return isOnline;
};
```

TanStack Query's `networkMode: 'offlineFirst'` ensures queries don't fail when offline — they return cached data and queue mutations for replay.

---

## 11. Payment Architecture

### 11.1 Unified Entitlement System

The core challenge: a user might purchase via Stripe (web), Apple IAP (iOS), or Google IAP (Android). The `users.tier` field is the single source of truth. All payment channels write to this via webhooks.

```
PURCHASE FLOWS:

1. WEB (Stripe):
   Client → POST /payments/create-checkout → Stripe Checkout Session URL
   → User pays on Stripe hosted page
   → Stripe webhook → POST /webhooks/stripe
   → Handler verifies signature, updates users.tier + inserts subscription
   → Client polls GET /users/me/entitlements to detect upgrade

2. iOS (Apple IAP):
   Client → StoreKit 2 purchase flow
   → Client sends receipt → POST /payments/verify-iap
   → Server verifies with Apple API (App Store Server API)
   → Server updates users.tier + inserts subscription
   → Response confirms entitlement

3. Android (Google IAP):
   Client → Google Play Billing purchase flow
   → Client sends purchaseToken → POST /payments/verify-iap
   → Server verifies with Google Play Developer API
   → Server updates users.tier + inserts subscription

4. SUBSCRIPTION RENEWALS (passive):
   Stripe/Apple/Google → webhook → server updates tier/expiry
   Client detects on next app open via GET /users/me/entitlements
```

### 11.2 Product IDs

```
Stripe:      price_voyager_lifetime, price_nomad_pro_monthly, price_nomad_pro_annual
Apple IAP:   app.easytrip.voyager.lifetime, app.easytrip.pro.monthly, app.easytrip.pro.annual
Google IAP:  easytrip_voyager_lifetime, easytrip_pro_monthly, easytrip_pro_annual
```

### 11.3 Webhook Handlers

All webhook endpoints verify signatures before processing:

```typescript
// Stripe webhook
app.post('/webhooks/stripe', {
  config: { rawBody: true } // Fastify raw body plugin required
}, async (request, reply) => {
  const sig = request.headers['stripe-signature'];
  const event = stripe.webhooks.constructEvent(
    request.rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET
  );
  
  switch (event.type) {
    case 'checkout.session.completed':
      await handleStripeCheckoutComplete(event.data.object);
      break;
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
      await syncStripeSubscription(event.data.object);
      break;
    case 'invoice.payment_failed':
      await handlePaymentFailed(event.data.object);
      break;
  }
  
  reply.send({ received: true });
});
```

### 11.4 Apple Guideline Compliance

Critical: the app must NOT mention Stripe or alternative payment methods in any iOS UI. The iOS app shows only Apple IAP purchase sheets. The web checkout (for non-iOS users) is a separate flow entirely. Failure to comply results in App Store rejection.

The `create-checkout` endpoint is called from web contexts only. The mobile app uses `expo-in-app-purchases` (wraps StoreKit 2 / Google Play Billing).

### 11.5 Subscription State Machine

```
                    ┌──────────┐
             ┌─────►│  active  │◄─────────┐
             │      └────┬─────┘          │
    payment  │           │ cancel         │ re-subscribe
    succeeds │           ▼                │
             │   ┌──────────────┐         │
             │   │ cancel_at_  │         │
             │   │ period_end  │─────────┘
             │   └──────┬──────┘
             │          │ period ends
             │          ▼
             │   ┌──────────┐    grace    ┌──────────┐
             │   │ expired  │────period──►│ past_due │
             │   └──────────┘             └────┬─────┘
             │                                 │ payment fails
             └─────────────────────────────────┘
```

---

## 12. Theme System Architecture

### 12.1 ThemeProvider

The ThemeProvider is mounted at the app root (`app/_layout.tsx`) before any screen renders. All colour values flow through theme tokens — zero hardcoded hex values in components.

```typescript
// themes/tokens.ts
export const THEMES = {
  dark_light: {
    // Free tier - basic dark/light
    background: '#09090B',
    surface: '#18181B',
    text_primary: '#FAFAFA',
    text_secondary: '#A1A1AA',
    accent: '#6366F1',
    // category defaults
    food: '#22C55E',
    landmarks: '#8B5CF6',
    transport: '#F59E0B',
    culture: '#3B82F6',
    budget: '#EF4444',
  },
  aurora_dark: {
    background: '#090b12',
    surface: '#0f1219',
    text_primary: '#F0F4FF',
    text_secondary: '#8892B0',
    accent_primary: '#38e8d8',   // Teal
    accent_secondary: '#9b6fff', // Purple
    glass_opacity: 0.07,
    food: '#38e8d8',       // Teal
    landmarks: '#9b6fff',  // Purple
    transport: '#f5c842',  // Gold
    culture: '#9b6fff',
    budget: '#ff5f5f',     // Red (alerts)
    // fonts
    font_display: 'Outfit_900Black',
    font_mono: 'JetBrainsMono_400Regular',
  },
  warm_sand: {
    background: '#F5F0E8',
    surface: '#EDE8DC',
    text_primary: '#2C2416',
    text_secondary: '#6B5E4E',
    food: '#C9613E',       // Terracotta
    landmarks: '#7B8B3E',  // Olive
    transport: '#6B8CAE',  // Dusty blue
    culture: '#7B8B3E',
    budget: '#D4843A',     // Saffron
    font_display: 'CormorantGaramond_700Italic',
    font_body: 'Figtree_400Regular',
    font_mono: 'AzeretMono_400Regular',
  },
  electric: {
    background: '#080808',
    surface: '#0F0F0F',
    text_primary: '#EEFF00',
    text_secondary: '#9CA3AF',
    food: '#FF2D78',       // Hot pink
    landmarks: '#C6FF00',  // Neon lime
    transport: '#00F0FF',  // Cyan
    culture: '#C6FF00',
    budget: '#FF8C00',     // Neon orange
    font_display: 'BarlowCondensed_900Black',
    font_mono: 'IBMPlexMono_400Regular',
  },
} as const;

export type ThemeName = keyof typeof THEMES;
export type ThemeTokens = typeof THEMES[ThemeName];
```

### 12.2 ThemeContext

```typescript
// contexts/ThemeContext.tsx
const ThemeContext = createContext<{
  theme: ThemeTokens;
  themeName: ThemeName;
  setTheme: (name: ThemeName) => void;
  categoryColours: CategoryColours;
  setCategoryColour: (category: string, colour: string) => void;
}>(null!);

export const ThemeProvider = ({ children }: PropsWithChildren) => {
  const userTier = useUserTier();
  const stored = MMKV.getString('theme_name') as ThemeName | undefined;
  
  // Tier gate: non-paid users get dark_light only
  const allowedThemes = userTier === 'explorer' 
    ? ['dark_light'] 
    : Object.keys(THEMES);
  
  const [themeName, setThemeNameState] = useState<ThemeName>(
    stored && allowedThemes.includes(stored) ? stored : 'dark_light'
  );
  
  // Per-user category colour overrides (from server, stored in MMKV)
  const [categoryColours, setCategoryColoursState] = useState(
    loadCategoryColours(themeName)
  );
  
  const theme = useMemo(() => ({
    ...THEMES[themeName],
    ...categoryColours, // User overrides take precedence
  }), [themeName, categoryColours]);
  
  const setTheme = (name: ThemeName) => {
    if (!allowedThemes.includes(name)) throw new UpgradeRequired('voyager');
    MMKV.set('theme_name', name);
    setThemeNameState(name);
    // Sync to server (non-blocking)
    api.patch('/settings/theme', { theme: name }).catch(noop);
  };
  
  return (
    <ThemeContext.Provider value={{ theme, themeName, setTheme, categoryColours, setCategoryColour }}>
      {children}
    </ThemeContext.Provider>
  );
};
```

### 12.3 Component Usage

```typescript
// All components use theme tokens, never hardcoded values
const useTheme = () => useContext(ThemeContext);

const VenueCard = () => {
  const { theme } = useTheme();
  return (
    <View style={{ backgroundColor: theme.surface }}>
      <Text style={{ color: theme.text_primary }}>...</Text>
      <CategoryChip 
        category="food" 
        style={{ backgroundColor: theme.food }} 
      />
    </View>
  );
};
```

### 12.4 Theme Switching Performance

Theme switches trigger a re-render of the entire component tree via context. To prevent jank:
- Use `React.memo` on all leaf components
- ThemeContext only updates when theme actually changes
- Heavy animations pause during theme switch (500ms grace period)
- Test on low-end Android (Samsung A series) — this is the performance baseline

---

## 13. Map & Routing Integration

### 13.1 Google Places API (New)

Using the **Places API (New)** — the legacy Places API is deprecated.

```typescript
// services/places.ts
const PLACES_CACHE_TTL = 6 * 60 * 60; // 6 hours

export const searchNearby = async (
  lat: number, lng: number, 
  radius: number, 
  category: string
): Promise<Venue[]> => {
  const cacheKey = `places:nearby:${lat}:${lng}:${radius}:${category}`;
  
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);
  
  const response = await googleMapsClient.post('/places:searchNearby', {
    includedTypes: [mapCategoryToGoogleType(category)],
    locationRestriction: {
      circle: { center: { latitude: lat, longitude: lng }, radius }
    },
    maxResultCount: 20,
    rankPreference: 'POPULARITY',
    fields: ['id', 'displayName', 'location', 'rating', 'userRatingCount', 
             'regularOpeningHours', 'photos', 'priceLevel', 'websiteUri',
             'internationalPhoneNumber', 'currentOpeningHours'],
  });
  
  const venues = response.places.map(mapGooglePlaceToVenue);
  await redis.setex(cacheKey, PLACES_CACHE_TTL, JSON.stringify(venues));
  return venues;
};
```

**API cost reduction strategies:**
- Field masks: only request needed fields (reduces cost)
- Aggressive Redis caching (6h TTL for venue details, 24h for photos)
- Never call Places Detail for a venue we already have cached
- Batch nearby search results before detail lookups

### 13.2 Directions API

```typescript
export const getRoute = async (
  origin: LatLng,
  destination: LatLng,
  modes: TransportMode[],
  departureTime: Date
): Promise<RouteOptions[]> => {
  const cacheKey = `route:${hashRoute(origin, destination, modes, departureTime)}`;
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);
  
  const routes = await Promise.all(modes.map(mode =>
    googleMapsClient.post('/directions/v2:computeRoutes', {
      origin: { location: { latLng: origin } },
      destination: { location: { latLng: destination } },
      travelMode: mapToGoogleMode(mode),
      departureTime: departureTime.toISOString(),
      computeAlternativeRoutes: false,
    })
  ));
  
  const result = routes.map(formatRoute);
  await redis.setex(cacheKey, 3600, JSON.stringify(result)); // 1h TTL
  return result;
};
```

### 13.3 React Native Maps Integration

```typescript
// components/TripMap.tsx
import MapView, { Marker, Polyline } from 'react-native-maps';

// Map style varies by theme
const MAP_STYLES = {
  aurora_dark: DARK_MAP_STYLE,   // Custom dark JSON style
  warm_sand: SEPIA_MAP_STYLE,
  electric: NIGHT_MAP_STYLE,
  dark_light: 'standard',
};

const TripMap = ({ tasks, route }) => {
  const { themeName } = useTheme();
  
  return (
    <MapView
      provider={PROVIDER_GOOGLE}
      customMapStyle={MAP_STYLES[themeName]}
      showsUserLocation
      showsMyLocationButton={false}
    >
      {tasks.map(task => (
        <Marker key={task.id} coordinate={task.venue?.location}>
          <CategoryMarker category={task.category} />
        </Marker>
      ))}
      {route && <Polyline coordinates={route.polyline} strokeColor={theme.accent_primary} />}
    </MapView>
  );
};
```

---

## 14. Translation Service Architecture

### 14.1 Text Translation

Primary: Google Cloud Translation API (v2 — simple text, cheap)  
Fallback: LibreTranslate (self-hosted on a t3.small in same region for zero extra latency)

```typescript
export const translateText = async (
  text: string,
  targetLang: string,
  sourceLang?: string
): Promise<TranslationResult> => {
  const cacheKey = `translate:${hashText(text)}:${sourceLang || 'auto'}:${targetLang}`;
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);
  
  try {
    const result = await googleTranslate.translate(text, {
      from: sourceLang,
      to: targetLang,
    });
    const translated = { text: result[0], source_lang: result[1].data.translations[0].detectedSourceLanguage };
    await redis.setex(cacheKey, 86400, JSON.stringify(translated)); // 24h TTL
    return translated;
  } catch (e) {
    // Fallback to LibreTranslate
    return libreTranslate.translate(text, sourceLang || 'auto', targetLang);
  }
};
```

### 14.2 Camera OCR Translation

OCR is handled server-side via Google Cloud Vision API:

```
Client → captures image with Expo Camera
       → sends image as base64 to POST /translate/ocr
       → Server calls Google Cloud Vision (DOCUMENT_TEXT_DETECTION)
       → Extracts detected text blocks
       → Sends to translation pipeline
       → Returns: {detected_text, translated_text, language_detected, blocks: [{text, translated, bounds}]}
Client → overlays translated text on image using detected bounds
```

Cost optimisation: resize images to max 1024px before sending to Vision API (reduces bytes processed).

### 14.3 Audio Pronunciation

```
GET /translate/phrasebook/:phraseId/audio

1. Check phrasebook_entries.audio_url (S3 URL)
2. If exists → redirect to CloudFront URL (cached at CDN)
3. If not exists:
   a. Call Google Cloud TTS: SSML with native pronunciation, 
      target language, neural voice
   b. Upload MP3 to S3: phrases/{lang}/{phraseId}.mp3
   c. Update phrasebook_entries.audio_url
   d. Return CloudFront URL
```

All phrase audio is generated once and cached permanently in S3/CloudFront. No per-request TTS calls for standard phrases.

### 14.4 Offline Language Packs (Voyager+)

```
POST /translate/offline-pack/download?language=ja

Server:
  1. Checks if pack exists in S3: offline-packs/v1/{language}.zip
  2. Pack contains: phrasebook JSON + all audio MP3s for that language
  3. Returns pre-signed S3 URL (expires 15 min)
  4. Pack size: ~5-10MB per language

Client:
  1. Downloads zip to app storage
  2. Extracts to WatermelonDB (phrases) + local file system (audio)
  3. Translation works offline using stored phrases only 
     (not full translation engine offline — that's v2)
```

---

## 15. Infrastructure & Deployment

### 15.1 AWS Architecture

```
REGION: eu-west-1 (Ireland) — primary
         us-east-1 — future secondary

VPC:
  Private subnets: ECS tasks, RDS, ElastiCache
  Public subnets: ALB, NAT Gateway

COMPUTE:
  AWS ECS / Fargate:
  ├── Main API Service
  │     Min: 2 tasks (always-on, no cold start)
  │     Max: 20 tasks (auto-scale on CPU >70% or request queue depth)
  │     Task size: 0.5 vCPU / 1GB RAM (main API)
  │     Container: ghcr.io/easytrip/api:latest
  │
  └── Social Agent Service
        Min: 1 task
        Max: 5 tasks (scale on BullMQ queue depth)
        Task size: 1 vCPU / 2GB RAM (Playwright needs memory)
        Container: ghcr.io/easytrip/social-agent:latest

LOAD BALANCER:
  AWS ALB → ECS tasks
  Path-based routing: /api/* → Main API, /ws → Socket.io

DATABASE:
  AWS RDS PostgreSQL 16
  Instance: db.t4g.medium (launch) → db.r7g.large (scale)
  Multi-AZ: Yes (from day 1)
  Storage: gp3, 100GB initial, auto-scale

CACHE:
  AWS ElastiCache Redis 7 (Cluster Mode Disabled for simplicity at launch)
  Instance: cache.r7g.large
  Multi-AZ with auto-failover

STORAGE:
  AWS S3: easytrip-media-prod
  CloudFront CDN: media.easytrip.app
  Buckets: /photos, /phrases-audio, /offline-packs, /user-exports

CDN:
  CloudFront for all static assets and S3 media
  Cache-Control: max-age=31536000 for audio/photos

SECRETS:
  AWS Secrets Manager for all API keys
  Injected as environment variables at task start

LOGGING:
  AWS CloudWatch Logs → Log Groups per service
  Structured JSON logging (pino)

MONITORING:
  AWS CloudWatch metrics + alarms
  Sentry (application errors)
  PostHog (product analytics)
```

### 15.2 CI/CD Pipeline

```
GitHub Repository
  └── github/workflows/
      ├── ci.yml         — PR: lint, type-check, unit tests, Drizzle schema check
      ├── staging.yml    — Push to main: build + deploy to staging (ECS staging cluster)
      └── production.yml — Tag v*: build + deploy to production (manual approval gate)

DEPLOYMENT FLOW:
  1. Push to main branch
  2. GitHub Actions: pnpm test + pnpm build
  3. Docker build: ghcr.io/easytrip/api:sha-{commit}
  4. Push to ECR
  5. ECS update-service --force-new-deployment
  6. Blue/green deployment via ALB (ECS handles this natively with deployment circuit breaker)
  7. If health checks fail → automatic rollback

DATABASE MIGRATIONS:
  Drizzle ORM migrations
  Run as an ECS one-off task before service update
  Migration: drizzle-kit migrate (applies pending migrations)
  Rollback: manual (always write reversible migrations)

ENVIRONMENTS:
  staging.easytrip.app  — Staging (same config, smaller instances)
  api.easytrip.app      — Production
```

### 15.3 Mobile CI/CD

```
EAS Build (Expo Application Services):
  ├── eas build --profile preview  — Internal TestFlight/Play beta
  └── eas build --profile production — App Store / Play Store submission

EAS Submit:
  eas submit --platform ios
  eas submit --platform android

OTA Updates (Expo Updates):
  Non-native changes: ship instantly via EAS Update
  Native changes: require full app store build
  Strategy: Ship JS/UI changes via OTA; native module changes via store
```

---

## 16. Cost Estimates

### 16.1 API Costs

| Service | Usage (1k MAU) | $/mo | Usage (10k MAU) | $/mo |
|---|---|---|---|---|
| Claude 3.5 Sonnet (itinerary) | ~5k generations/mo | ~$150 | ~50k generations | ~$1,500 |
| Claude Haiku (assistant) | ~20k messages/mo | ~$10 | ~200k messages | ~$100 |
| GPT-4o mini (social extraction) | ~100k extractions | ~$10 | ~500k extractions | ~$50 |
| Google Places API | ~50k lookups | ~$150 | ~500k lookups | ~$1,500 |
| Google Directions API | ~20k routes | ~$100 | ~200k routes | ~$1,000 |
| Google Translate | ~500k chars | ~$5 | ~5M chars | ~$50 |
| Google Cloud Vision (OCR) | ~5k images | ~$8 | ~50k images | ~$80 |
| Google Cloud TTS | ~10k phrases | ~$5 | cached, ~$5 | ~$5 |
| Twitter/X API Basic | flat | $100 | flat | $100 |
| YouTube Data API | free quota | $0 | free quota | $0 |
| Open Exchange Rates | flat | $10 | flat | $10 |
| OpenWeatherMap | free tier | $0 | paid tier | $40 |
| **API Total** | | **~$548** | | **~$4,435** |

### 16.2 Infrastructure Costs

| Service | Launch (1k MAU) | $/mo | Scale (10k MAU) | $/mo |
|---|---|---|---|---|
| ECS Fargate (API, 2 tasks) | 0.5vCPU × 2 | ~$30 | 20 tasks | ~$300 |
| ECS Fargate (Social Agent) | 1 task | ~$20 | 5 tasks | ~$100 |
| RDS PostgreSQL (t4g.medium) | Multi-AZ | ~$80 | r7g.large Multi-AZ | ~$300 |
| ElastiCache Redis (r7g.large) | | ~$120 | r7g.xlarge | ~$240 |
| ALB | | ~$25 | | ~$25 |
| S3 + CloudFront | ~50GB | ~$15 | ~500GB | ~$80 |
| NAT Gateway | | ~$35 | | ~$70 |
| CloudWatch | | ~$10 | | ~$30 |
| AWS Secrets Manager | | ~$5 | | ~$10 |
| Sentry | | ~$26 | | ~$80 |
| PostHog | free tier | $0 | ~$0 (self-host) | $0 |
| Resend email | free tier | $0 | | ~$20 |
| **Infra Total** | | **~$366** | | **~$1,255** |

### 16.3 Total Cost Summary

| Scale | API | Infra | **Total** | Rev needed (break-even at £2.99 Pro) |
|---|---|---|---|---|
| 1k MAU | $548 | $366 | **~$914 (~£720/mo)** | ~290 active Pro subs |
| 5k MAU | ~$2,500 | ~$700 | **~$3,200 (~£2,500/mo)** | ~1,000 active Pro subs |
| 10k MAU | $4,435 | $1,255 | **~$5,690 (~£4,500/mo)** | ~1,800 active Pro subs |
| 50k MAU | ~$20k | ~$5k | **~$25k (~£20k/mo)** | ~8,000 active Pro subs |

**Key observation:** At 10k MAU, ~18% Pro conversion covers costs. Industry benchmark for premium travel apps is 8-15% paid conversion — close but manageable. Voyager one-time purchases add significant buffer. Social agent costs (Playwright fleet) are the biggest variable cost lever — disable gracefully if subscriber count doesn't justify it.

---

## 17. Security Considerations

### 17.1 API Key Management

- All API keys stored in AWS Secrets Manager, never in environment files or source code
- Separate key sets for staging and production
- Google API key restricted by: iOS bundle ID, Android package name, API whitelist
- Stripe webhook secrets rotated quarterly
- Twitter/X API credentials scoped to read-only

### 17.2 Authentication Security

- JWT verified on every request (Supabase Auth JWKS endpoint)
- Refresh tokens stored encrypted in MMKV on device (not AsyncStorage)
- Session invalidation on logout — token blacklisted in Redis for remaining TTL
- OAuth state parameter validated to prevent CSRF
- Rate limiting on auth endpoints: 10 attempts per IP per 15 min (Redis sliding window)

### 17.3 Rate Limiting

```typescript
// Tiered rate limits
const RATE_LIMITS = {
  explorer: { 
    global: '100/hour',
    ai_generate: '3/lifetime',
    translate: '50/day',
  },
  voyager: {
    global: '500/hour',
    ai_generate: '1/concurrent',
    translate: '500/day',
  },
  nomad_pro: {
    global: '2000/hour',
    ai_generate: '3/concurrent',
    translate: 'unlimited',
  },
};
```

### 17.4 User Data & GDPR

- EU users: data stored in eu-west-1 (Ireland) — compliant with GDPR Art. 45
- Data minimisation: only collect what's needed for feature function
- User deletion: `DELETE /users/me` triggers cascade delete of all user data within 30 days (soft delete first, hard delete via scheduled job)
- Data export: `GET /users/me/export` returns GDPR-compliant JSON data package
- Privacy policy covers: what data is collected, how it's used, third-party processors (Google, Stripe, Anthropic, OpenAI)
- Cookie consent: N/A (native app), but in-app analytics consent at onboarding

### 17.5 Social Intelligence Agent — Legal

- **Display rule:** max 50-word quote, always link to original post, always attribute creator username
- **Official APIs first:** YouTube, Reddit, Twitter/X — use official APIs with ToS compliance
- **robots.txt respected:** Playwright crawler reads and honours robots.txt before crawling
- **User-Agent disclosed:** crawler identifies as "EasyTripBot/1.0 (+https://easytrip.app/bot)"
- **No PII stored beyond:** public username, follower count, post URL — all public data
- **GDPR note:** Public posts from EU users may still be personal data under GDPR. Legal review required before EU launch of social agent feature.
- **Instagram/TikTok deferred:** No scraping of these platforms in v1 — too high legal risk

### 17.6 Input Validation & Injection Prevention

- All API inputs validated with Zod before processing
- SQL injection: impossible via Drizzle ORM (parameterised queries only)
- LLM prompt injection: user inputs sanitised before insertion into AI prompts; system prompt in separate messages array
- File upload: OCR images validated for MIME type (image/jpeg, image/png, image/webp only), max 10MB, scanned by AWS Macie in production
- XSS: N/A (native app), but API responses used in WebView components sanitised

### 17.7 Infrastructure Security

- VPC: ECS tasks and databases in private subnets (no direct internet access)
- Security groups: principle of least privilege (API → RDS on 5432 only, API → Redis on 6379 only)
- ECS tasks run as non-root user
- Container images scanned by Amazon ECR on push (vulnerability scanning)
- CloudTrail enabled for all AWS API calls
- WAF on ALB: rate limiting, geo-blocking if needed

---

## 18. Performance & Scaling Strategy

### 18.1 Response Time Targets

| Endpoint | P50 target | P99 target |
|---|---|---|
| GET /trips (list) | <100ms | <300ms |
| GET /trips/:id (detail) | <150ms | <400ms |
| GET /places/search | <200ms | <500ms |
| POST /translate/text | <300ms | <800ms |
| POST /ai/generate (queued) | immediate (jobId) | — |
| AI generation (async) | <30s | <90s |
| WebSocket message delivery | <500ms | <2s |

### 18.2 Caching Strategy

```
L1 (TanStack Query, client): 
  staleTime: 5 min for places/routes
  staleTime: 0 for trip state (always fresh)
  offlineFirst: true for all queries

L2 (Redis, server): 
  Google Places search: 6h TTL
  Venue detail: 6h TTL  
  Route: 1h TTL
  Exchange rates: 1h TTL
  Itinerary (same params): 24h TTL
  Phrasebook: 7d TTL
  Weather: 3h TTL

L3 (WatermelonDB, device):
  Full itinerary: permanent
  Venue detail for trip tasks: permanent
  Phrasebook (downloaded): permanent

L4 (CloudFront CDN):
  Phrase audio files: 1 year
  Venue photos: 24h
  App static assets: 1 year
```

### 18.3 Database Performance

```sql
-- Partitioning for social_posts (high write volume)
-- Partition by month
CREATE TABLE social_posts_2026_04 PARTITION OF social_posts
  FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');

-- Purge old data: social posts > 90 days (low value, high volume)
-- Scheduled via pg_cron or BullMQ daily job

-- Connection pooling
-- AWS RDS Proxy in front of PostgreSQL (critical for Fargate — no persistent connections)
-- Pool size: min 5, max 20 per ECS task
```

### 18.4 AI Generation Performance

- BullMQ priority queues: Pro users processed ahead of Voyager
- Itinerary caching: same inputs → same result from cache (no AI call)
- Streaming response: for long trips (7+ days), stream partial days to client as they're generated (reduces perceived latency)
- Timeout: 30s per LLM call, 2 retries, then fallback model

### 18.5 Mobile Performance

- React Navigation lazy loading: only render the current screen and adjacent screens
- Image lazy loading with progressive blur placeholders
- FlatList (not ScrollView) for all long lists
- react-native-fast-image for aggressive photo caching
- WatermelonDB queries on background thread (never blocks UI)
- Reanimated worklets run on UI thread (gestures are buttery smooth)
- Theme switching: debounced, 500ms delay prevents accidental switches causing jank
- Bundle size target: <60MB (after OTA JS bundle, ex native code)

### 18.6 Horizontal Scaling

- ECS services are stateless — all state in PostgreSQL/Redis
- Auto-scaling based on ALB request count and ECS CPU metrics
- Social Agent scales on BullMQ queue depth (more destinations = more workers)
- Redis ElastiCache: upgrade to cluster mode if single node approaches limits
- Read replicas for PostgreSQL when read load dominates (analytics queries offloaded first)

---

## 19. Trade-offs

### 19.1 Expo Dev Client vs Managed Workflow
**Decision:** Dev Client.  
**Trade-off:** Slightly more complex build pipeline (EAS Build required), but avoids a painful mid-project migration when we hit native module requirements (Camera OCR, background sync, push notification edge cases). The complexity cost is front-loaded and manageable.

### 19.2 WatermelonDB vs SQLite + custom
**Decision:** WatermelonDB.  
**Trade-off:** WatermelonDB has a learning curve and its own query API. However, it handles sync protocols, background threading, and relational offline data natively — building this ourselves would take weeks. Cost: ~2 days of setup. Save: ~3 weeks of custom offline sync code.

### 19.3 Claude as Primary AI vs OpenAI
**Decision:** Claude 3.5 Sonnet primary.  
**Trade-off:** Claude's structured JSON output and larger context window win for itinerary generation. Risk: Anthropic rate limits/outages (mitigated by GPT-4o fallback). If OpenAI releases a significantly better model mid-build, the `LLMClient` abstraction makes switching trivial.

### 19.4 Single-region vs Multi-region
**Decision:** Single region (eu-west-1) at launch.  
**Trade-off:** Higher latency for Asia-Pacific users (Australia, Japan — major travel markets). Acceptable at launch. Mitigated by CloudFront CDN for static assets. Multi-region becomes necessary at ~50k MAU or if we pursue AU/APAC marketing actively. The architecture supports it (stateless services, RDS Global Database-compatible schema).

### 19.5 Social Agent Deferred to v1.5
**Decision:** Build in parallel, soft-launch post-app-launch.  
**Trade-off:** The social agent is the primary product differentiator. Deferring means EasyTrip v1 competes on AI itinerary quality and UX alone — which is still strong, but the moat isn't fully deployed. The alternative (blocking ship on social agent) risks never shipping. The phased approach is correct.

### 19.6 RDS vs Supabase Full Stack
**Decision:** Supabase Auth only, AWS RDS for database.  
**Trade-off:** We lose Supabase's realtime subscriptions and edge functions, but gain full control over PostgreSQL configuration, connection pooling (RDS Proxy), query optimization, and partitioning. Supabase's opinionated stack would constrain the Social Agent architecture. Using only Auth is the best of both worlds.

### 19.7 Stripe + IAP vs IAP-only
**Decision:** Both.  
**Trade-off:** Supporting both payment channels doubles webhook handling complexity. Required by business reality: Apple mandates IAP for iOS in-app purchases; Stripe covers web + promotional codes + B2B. The unified entitlement system (single `users.tier` source of truth) manages this complexity cleanly.

### 19.8 LibreTranslate Self-hosted Fallback
**Decision:** Self-hosted LibreTranslate on t3.small as Google Translate fallback.  
**Trade-off:** Adds one small instance to manage. Benefit: zero additional API cost for fallback, <100ms latency in same region, protects against Google Translate outages. Cost: ~$20/mo. Worth it.

### 19.9 Google Places Aggressive Caching (6h TTL)
**Decision:** 6-hour Redis cache for place details.  
**Trade-off:** Opening hours or ratings may be slightly stale. Acceptable — Google's own data updates slowly. Benefit: ~60% reduction in Places API calls at steady state. We display "last updated X hours ago" on details page for transparency.

### 19.10 No Real-time Disruption Alerts in v1
**Decision:** Deferred to v1.5.  
**Trade-off:** Pro users can't see live transport disruptions. The WebSocket infrastructure is built and ready; adding disruption data is a data source problem not an architecture problem. This is a good v1.5 quick win after social agent stabilises.

---

## Appendix A: Environment Variables

```bash
# Database
DATABASE_URL=postgresql://...
REDIS_URL=redis://...

# Auth
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...  # Server-side only, never in client

# AI
ANTHROPIC_API_KEY=...
OPENAI_API_KEY=...

# Google
GOOGLE_PLACES_API_KEY=...    # Restricted by bundle ID
GOOGLE_MAPS_API_KEY=...      # Restricted by bundle ID
GOOGLE_TRANSLATE_API_KEY=...
GOOGLE_CLOUD_VISION_API_KEY=...
GOOGLE_CLOUD_TTS_API_KEY=...

# Payments
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
STRIPE_PRICE_VOYAGER_LIFETIME=price_xxx
STRIPE_PRICE_PRO_MONTHLY=price_xxx
STRIPE_PRICE_PRO_ANNUAL=price_xxx

# Social
TWITTER_BEARER_TOKEN=...
YOUTUBE_API_KEY=...
REDDIT_CLIENT_ID=...
REDDIT_CLIENT_SECRET=...

# Services
RESEND_API_KEY=...
OPEN_EXCHANGE_RATES_APP_ID=...
OPENWEATHERMAP_API_KEY=...
SENTRY_DSN=...

# AWS
AWS_REGION=eu-west-1
S3_BUCKET_NAME=easytrip-media-prod
CLOUDFRONT_DOMAIN=media.easytrip.app

# App
NODE_ENV=production
PORT=3000
LOG_LEVEL=info
PROMPT_VERSION=v1.0
```

---

## Appendix B: First Sprint Checklist

Following the Project Brief's recommendation:

1. ✅ **Supabase Auth setup** — configure providers (Google, Apple, email), JWT config, Fastify middleware
2. ✅ **Drizzle ORM + migrations** — users, subscriptions schema, run first migration on RDS
3. ✅ **ThemeProvider + Aurora Dark** — all theme tokens defined, context wired at app root, test on iOS + Android
4. ✅ **Expo Dev Client build** — EAS Build configured, dev client installed on test devices
5. ✅ **Trip creation wizard** — 3-step form, Zod validation, POST /trips endpoint
6. ✅ **AI generation endpoint** — LLMClient abstraction, Claude call, Zod output validation, BullMQ job
7. ✅ **Itinerary schema in DB** — trips, itinerary_days, tasks tables
8. ✅ **Daily planner UI** — hero screen, drag-to-reorder (Reanimated), task completion, progress bar

---

*Architecture document complete. Ready for Lead Developer review.*

*Next: 03-frontend-spec.md (component breakdown, screen-by-screen implementation guide)*
