-- EasyTrip initial migration
-- Generated schema — apply via `drizzle-kit migrate` or `tsx src/db/migrate.ts`

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Auto-update updated_at trigger function
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ── Users ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  tier TEXT NOT NULL DEFAULT 'explorer'
    CHECK (tier IN ('explorer', 'voyager', 'nomad_pro')),
  tier_source TEXT,
  tier_expires_at TIMESTAMPTZ,
  preferred_currency TEXT NOT NULL DEFAULT 'GBP',
  preferred_language TEXT NOT NULL DEFAULT 'en',
  theme TEXT NOT NULL DEFAULT 'dark_light'
    CHECK (theme IN ('dark_light', 'aurora_dark', 'warm_sand', 'electric')),
  category_colours JSONB,
  total_trips INT NOT NULL DEFAULT 0,
  total_days INT NOT NULL DEFAULT 0,
  total_tasks_completed INT NOT NULL DEFAULT 0,
  countries_visited TEXT[] DEFAULT '{}',
  referral_code TEXT UNIQUE,
  referred_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_users_tier ON users(tier);
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);

CREATE TRIGGER set_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ── Subscriptions ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  provider TEXT NOT NULL CHECK (provider IN ('stripe', 'apple_iap', 'google_iap')),
  provider_subscription_id TEXT,
  provider_customer_id TEXT,
  product_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'cancelled', 'expired', 'pending', 'past_due')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  raw_webhook JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_provider_id ON subscriptions(provider_subscription_id);

CREATE TRIGGER set_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- Entitlement helper
CREATE OR REPLACE FUNCTION get_user_tier(p_user_id UUID) RETURNS TEXT AS $$
  SELECT tier FROM users WHERE id = p_user_id;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ── Venues ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS venues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  google_place_id TEXT UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  sub_category TEXT,
  address TEXT,
  city TEXT,
  country_code TEXT,
  lat DECIMAL(9,6),
  lng DECIMAL(9,6),
  phone TEXT,
  website TEXT,
  google_rating DECIMAL(2,1),
  google_review_count INT,
  price_level SMALLINT,
  opening_hours JSONB,
  hours_fetched_at TIMESTAMPTZ,
  photos JSONB,
  estimated_cost_low DECIMAL(10,2),
  estimated_cost_high DECIMAL(10,2),
  cost_currency TEXT,
  entry_fee DECIMAL(10,2),
  booking_url TEXT,
  peak_hours JSONB,
  dietary_tags TEXT[],
  places_api_fetched_at TIMESTAMPTZ,
  places_api_version TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_venues_google_place_id ON venues(google_place_id);
CREATE INDEX IF NOT EXISTS idx_venues_country ON venues(country_code);
CREATE INDEX IF NOT EXISTS idx_venues_category ON venues(category);

CREATE TRIGGER set_venues_updated_at
  BEFORE UPDATE ON venues
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ── Trips ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  destination TEXT NOT NULL,
  country_code TEXT NOT NULL,
  city TEXT,
  destination_lat DECIMAL(9,6),
  destination_lng DECIMAL(9,6),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  duration_days INT NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  budget_amount DECIMAL(12,2),
  budget_currency TEXT NOT NULL DEFAULT 'GBP',
  trip_type TEXT,
  travel_preferences JSONB,
  ai_model_used TEXT,
  generation_prompt_version TEXT,
  destination_confidence TEXT CHECK (destination_confidence IN ('high', 'medium', 'low')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'archived')),
  share_token TEXT UNIQUE,
  is_shared BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_trips_user_id ON trips(user_id);
CREATE INDEX IF NOT EXISTS idx_trips_status ON trips(user_id, status);
CREATE INDEX IF NOT EXISTS idx_trips_country ON trips(country_code);

CREATE TRIGGER set_trips_updated_at
  BEFORE UPDATE ON trips
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ── Itinerary Days ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS itinerary_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  day_number INT NOT NULL,
  date DATE NOT NULL,
  title TEXT,
  summary TEXT,
  weather_snapshot JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(trip_id, day_number)
);

CREATE INDEX IF NOT EXISTS idx_itinerary_days_trip_id ON itinerary_days(trip_id);

CREATE TRIGGER set_itinerary_days_updated_at
  BEFORE UPDATE ON itinerary_days
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ── Tasks ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_id UUID NOT NULL REFERENCES itinerary_days(id) ON DELETE CASCADE,
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  position SMALLINT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general'
    CHECK (category IN ('food', 'landmark', 'transport', 'culture', 'budget', 'accommodation', 'general')),
  start_time TIME,
  end_time TIME,
  duration_minutes INT,
  venue_id UUID REFERENCES venues(id),
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  is_custom BOOLEAN NOT NULL DEFAULT FALSE,
  travel_time_to_next_minutes INT,
  transport_mode TEXT CHECK (transport_mode IN ('walk', 'metro', 'bus', 'taxi', 'bike')),
  estimated_cost DECIMAL(10,2),
  actual_cost DECIMAL(10,2),
  currency TEXT,
  tips TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_day_id ON tasks(day_id);
CREATE INDEX IF NOT EXISTS idx_tasks_trip_id ON tasks(trip_id);
CREATE INDEX IF NOT EXISTS idx_tasks_position ON tasks(day_id, position);

CREATE TRIGGER set_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ── Social Posts ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS social_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL CHECK (platform IN ('youtube', 'tiktok', 'twitter', 'instagram', 'facebook', 'reddit', 'blog', 'review_site')),
  platform_post_id TEXT,
  post_url TEXT,
  title TEXT,
  content_snippet TEXT,
  destination TEXT,
  city TEXT,
  country_code TEXT,
  venue_id UUID REFERENCES venues(id),
  creator_username TEXT,
  creator_display_name TEXT,
  creator_follower_count BIGINT DEFAULT 0,
  creator_verified BOOLEAN DEFAULT FALSE,
  likes_count BIGINT DEFAULT 0,
  views_count BIGINT DEFAULT 0,
  comments_count BIGINT DEFAULT 0,
  shares_count BIGINT DEFAULT 0,
  content_type TEXT CHECK (content_type IN ('influencer_pick', 'pricing_intel', 'travel_tip', 'hidden_gem', 'warning', 'general')),
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  trend_score SMALLINT CHECK (trend_score >= 0 AND trend_score <= 100),
  posted_at TIMESTAMPTZ,
  crawled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  extracted_at TIMESTAMPTZ,
  score_updated_at TIMESTAMPTZ,
  thumbnail_url TEXT,
  extraction_confidence TEXT CHECK (extraction_confidence IN ('high', 'medium', 'low')),
  raw_extraction JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_social_posts_country ON social_posts(country_code);
CREATE INDEX IF NOT EXISTS idx_social_posts_city ON social_posts(city);
CREATE INDEX IF NOT EXISTS idx_social_posts_trend_score ON social_posts(trend_score DESC) WHERE extraction_confidence = 'high';
CREATE INDEX IF NOT EXISTS idx_social_posts_posted_at ON social_posts(posted_at DESC);
CREATE INDEX IF NOT EXISTS idx_social_posts_venue ON social_posts(venue_id);

-- ── Crawl Jobs ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS crawl_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL,
  target TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  posts_found INT DEFAULT 0,
  posts_extracted INT DEFAULT 0,
  status TEXT CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Budgets ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL UNIQUE REFERENCES trips(id) ON DELETE CASCADE,
  total_amount DECIMAL(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'GBP',
  food_allocation DECIMAL(12,2),
  transport_allocation DECIMAL(12,2),
  accommodation_allocation DECIMAL(12,2),
  activities_allocation DECIMAL(12,2),
  other_allocation DECIMAL(12,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_budgets_updated_at
  BEFORE UPDATE ON budgets
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ── Expenses ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  amount DECIMAL(12,2) NOT NULL,
  currency TEXT NOT NULL,
  amount_in_base DECIMAL(12,2),
  exchange_rate DECIMAL(12,6),
  category TEXT NOT NULL CHECK (category IN ('food', 'transport', 'accommodation', 'activities', 'shopping', 'other')),
  description TEXT,
  venue_id UUID REFERENCES venues(id),
  task_id UUID REFERENCES tasks(id),
  logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expenses_trip_id ON expenses(trip_id);

-- ── Phrasebook ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS phrasebook_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  language_code TEXT NOT NULL,
  language_name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('greetings', 'transport', 'food', 'emergency', 'shopping', 'accommodation', 'general')),
  phrase_en TEXT NOT NULL,
  phrase_native TEXT NOT NULL,
  romanisation TEXT,
  phonetic TEXT,
  audio_url TEXT,
  audio_generated_at TIMESTAMPTZ,
  is_custom BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_phrasebook_language ON phrasebook_entries(language_code);
CREATE INDEX IF NOT EXISTS idx_phrasebook_category ON phrasebook_entries(language_code, category);

CREATE TABLE IF NOT EXISTS saved_phrases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  phrase_id UUID REFERENCES phrasebook_entries(id),
  custom_phrase_en TEXT,
  custom_phrase_native TEXT,
  language_code TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Theme Preferences ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS theme_preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  active_theme TEXT NOT NULL DEFAULT 'dark_light',
  aurora_dark_colours JSONB,
  warm_sand_colours JSONB,
  electric_colours JSONB,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Achievements ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS achievements (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  tier_required TEXT DEFAULT 'voyager',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_achievements (
  user_id UUID NOT NULL REFERENCES users(id),
  achievement_id TEXT NOT NULL REFERENCES achievements(id),
  earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, achievement_id)
);

-- ── Transport Passes ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS transport_passes (
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

CREATE INDEX IF NOT EXISTS idx_transport_passes_city ON transport_passes(city);
CREATE INDEX IF NOT EXISTS idx_transport_passes_country ON transport_passes(country_code);

CREATE TRIGGER set_transport_passes_updated_at
  BEFORE UPDATE ON transport_passes
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ── AI Conversations ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_ai_conversations_updated_at
  BEFORE UPDATE ON ai_conversations
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TABLE IF NOT EXISTS ai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  token_count INT,
  model_used TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation ON ai_messages(conversation_id, created_at);

-- ── Seed data: Achievements ─────────────────────────────────────────────────

INSERT INTO achievements (id, name, description, icon, tier_required) VALUES
  ('first_trip', 'First Adventure', 'Created your first trip', '✈️', 'explorer'),
  ('ten_countries', 'World Traveller', 'Visited 10 countries', '🌍', 'voyager'),
  ('early_bird', 'Early Bird', 'Joined EasyTrip in the first month', '🐦', 'explorer'),
  ('hundred_tasks', 'Busy Explorer', 'Completed 100 tasks', '✅', 'voyager'),
  ('five_trips', 'Seasoned Traveller', 'Created 5 trips', '🧳', 'voyager'),
  ('pro_user', 'Nomad Pro', 'Upgraded to Nomad Pro', '⭐', 'nomad_pro')
ON CONFLICT (id) DO NOTHING;
