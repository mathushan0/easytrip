import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  integer,
  smallint,
  decimal,
  date,
  time,
  jsonb,
  uniqueIndex,
  index,
  primaryKey,
  check,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

// ── Helpers ───────────────────────────────────────────────────────────────────

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
};

const softDelete = {
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
};

// ── Users ─────────────────────────────────────────────────────────────────────

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey(), // mirrors Supabase auth.users.id
    email: text('email').unique().notNull(),
    displayName: text('display_name'),
    avatarUrl: text('avatar_url'),
    tier: text('tier', { enum: ['explorer', 'voyager', 'nomad_pro'] })
      .notNull()
      .default('explorer'),
    tierSource: text('tier_source'),
    tierExpiresAt: timestamp('tier_expires_at', { withTimezone: true }),

    // Preferences
    preferredCurrency: text('preferred_currency').notNull().default('GBP'),
    preferredLanguage: text('preferred_language').notNull().default('en'),
    theme: text('theme', { enum: ['dark_light', 'aurora_dark', 'warm_sand', 'electric'] })
      .notNull()
      .default('dark_light'),
    categoryColours: jsonb('category_colours'),

    // Stats
    totalTrips: integer('total_trips').notNull().default(0),
    totalDays: integer('total_days').notNull().default(0),
    totalTasksCompleted: integer('total_tasks_completed').notNull().default(0),
    countriesVisited: text('countries_visited').array().default(sql`'{}'::text[]`),

    // Referral
    referralCode: text('referral_code').unique(),
    referredBy: uuid('referred_by'),

    ...timestamps,
    ...softDelete,
  },
  (t) => ({
    tierIdx: index('idx_users_tier').on(t.tier),
    referralIdx: index('idx_users_referral_code').on(t.referralCode),
  }),
);

// ── Subscriptions ─────────────────────────────────────────────────────────────

export const subscriptions = pgTable(
  'subscriptions',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid('user_id').notNull().references(() => users.id),
    provider: text('provider', { enum: ['stripe', 'apple_iap', 'google_iap'] }).notNull(),
    providerSubscriptionId: text('provider_subscription_id'),
    providerCustomerId: text('provider_customer_id'),
    productId: text('product_id').notNull(),
    status: text('status', {
      enum: ['active', 'cancelled', 'expired', 'pending', 'past_due'],
    }).notNull(),
    currentPeriodStart: timestamp('current_period_start', { withTimezone: true }),
    currentPeriodEnd: timestamp('current_period_end', { withTimezone: true }),
    cancelAtPeriodEnd: boolean('cancel_at_period_end').default(false),
    rawWebhook: jsonb('raw_webhook'),
    ...timestamps,
  },
  (t) => ({
    userIdx: index('idx_subscriptions_user_id').on(t.userId),
    providerIdx: index('idx_subscriptions_provider_id').on(t.providerSubscriptionId),
  }),
);

// ── Trips ─────────────────────────────────────────────────────────────────────

export const trips = pgTable(
  'trips',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid('user_id').notNull().references(() => users.id),
    destination: text('destination').notNull(),
    countryCode: text('country_code').notNull(),
    city: text('city'),
    destinationLat: decimal('destination_lat', { precision: 9, scale: 6 }),
    destinationLng: decimal('destination_lng', { precision: 9, scale: 6 }),
    startDate: date('start_date').notNull(),
    endDate: date('end_date').notNull(),
    durationDays: integer('duration_days').notNull(),
    timezone: text('timezone').notNull().default('UTC'),
    budgetAmount: decimal('budget_amount', { precision: 12, scale: 2 }),
    budgetCurrency: text('budget_currency').notNull().default('GBP'),
    tripType: text('trip_type'),
    travelPreferences: jsonb('travel_preferences'),
    aiModelUsed: text('ai_model_used'),
    generationPromptVersion: text('generation_prompt_version'),
    destinationConfidence: text('destination_confidence', {
      enum: ['high', 'medium', 'low'],
    }),
    status: text('status', { enum: ['draft', 'active', 'archived'] })
      .notNull()
      .default('active'),
    shareToken: text('share_token').unique(),
    isShared: boolean('is_shared').default(false),
    ...timestamps,
    ...softDelete,
  },
  (t) => ({
    userIdx: index('idx_trips_user_id').on(t.userId),
    statusIdx: index('idx_trips_status').on(t.userId, t.status),
    countryIdx: index('idx_trips_country').on(t.countryCode),
  }),
);

// ── Itinerary Days ────────────────────────────────────────────────────────────

export const itineraryDays = pgTable(
  'itinerary_days',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    tripId: uuid('trip_id')
      .notNull()
      .references(() => trips.id, { onDelete: 'cascade' }),
    dayNumber: integer('day_number').notNull(),
    date: date('date').notNull(),
    title: text('title'),
    summary: text('summary'),
    weatherSnapshot: jsonb('weather_snapshot'),
    ...timestamps,
  },
  (t) => ({
    tripIdx: index('idx_itinerary_days_trip_id').on(t.tripId),
    uniqueTripDay: uniqueIndex('uq_itinerary_days_trip_day').on(t.tripId, t.dayNumber),
  }),
);

// ── Venues ────────────────────────────────────────────────────────────────────

export const venues = pgTable(
  'venues',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    googlePlaceId: text('google_place_id').unique(),
    name: text('name').notNull(),
    category: text('category').notNull(),
    subCategory: text('sub_category'),
    address: text('address'),
    city: text('city'),
    countryCode: text('country_code'),
    lat: decimal('lat', { precision: 9, scale: 6 }),
    lng: decimal('lng', { precision: 9, scale: 6 }),
    phone: text('phone'),
    website: text('website'),
    googleRating: decimal('google_rating', { precision: 2, scale: 1 }),
    googleReviewCount: integer('google_review_count'),
    priceLevel: smallint('price_level'),
    openingHours: jsonb('opening_hours'),
    hoursFetchedAt: timestamp('hours_fetched_at', { withTimezone: true }),
    photos: jsonb('photos'),
    estimatedCostLow: decimal('estimated_cost_low', { precision: 10, scale: 2 }),
    estimatedCostHigh: decimal('estimated_cost_high', { precision: 10, scale: 2 }),
    costCurrency: text('cost_currency'),
    entryFee: decimal('entry_fee', { precision: 10, scale: 2 }),
    bookingUrl: text('booking_url'),
    peakHours: jsonb('peak_hours'),
    dietaryTags: text('dietary_tags').array(),
    placesApiFetchedAt: timestamp('places_api_fetched_at', { withTimezone: true }),
    placesApiVersion: text('places_api_version'),
    ...timestamps,
  },
  (t) => ({
    googlePlaceIdx: index('idx_venues_google_place_id').on(t.googlePlaceId),
    countryIdx: index('idx_venues_country').on(t.countryCode),
    categoryIdx: index('idx_venues_category').on(t.category),
  }),
);

// ── Tasks ─────────────────────────────────────────────────────────────────────

export const tasks = pgTable(
  'tasks',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    dayId: uuid('day_id')
      .notNull()
      .references(() => itineraryDays.id, { onDelete: 'cascade' }),
    tripId: uuid('trip_id')
      .notNull()
      .references(() => trips.id, { onDelete: 'cascade' }),
    position: smallint('position').notNull(),
    title: text('title').notNull(),
    description: text('description'),
    category: text('category', {
      enum: ['food', 'landmark', 'transport', 'culture', 'budget', 'accommodation', 'general'],
    })
      .notNull()
      .default('general'),
    startTime: time('start_time'),
    endTime: time('end_time'),
    durationMinutes: integer('duration_minutes'),
    venueId: uuid('venue_id').references(() => venues.id),
    isCompleted: boolean('is_completed').notNull().default(false),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    isCustom: boolean('is_custom').notNull().default(false),
    travelTimeToNextMinutes: integer('travel_time_to_next_minutes'),
    transportMode: text('transport_mode', {
      enum: ['walk', 'metro', 'bus', 'taxi', 'bike'],
    }),
    estimatedCost: decimal('estimated_cost', { precision: 10, scale: 2 }),
    actualCost: decimal('actual_cost', { precision: 10, scale: 2 }),
    currency: text('currency'),
    tips: text('tips'),
    ...timestamps,
  },
  (t) => ({
    dayIdx: index('idx_tasks_day_id').on(t.dayId),
    tripIdx: index('idx_tasks_trip_id').on(t.tripId),
    positionIdx: index('idx_tasks_position').on(t.dayId, t.position),
  }),
);

// ── Social Posts ──────────────────────────────────────────────────────────────

export const socialPosts = pgTable(
  'social_posts',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    platform: text('platform', {
      enum: ['youtube', 'tiktok', 'twitter', 'instagram', 'facebook', 'reddit', 'blog', 'review_site'],
    }).notNull(),
    platformPostId: text('platform_post_id'),
    postUrl: text('post_url'),
    title: text('title'),
    contentSnippet: text('content_snippet'),
    destination: text('destination'),
    city: text('city'),
    countryCode: text('country_code'),
    venueId: uuid('venue_id').references(() => venues.id),
    creatorUsername: text('creator_username'),
    creatorDisplayName: text('creator_display_name'),
    creatorFollowerCount: decimal('creator_follower_count', { precision: 20, scale: 0 }),
    creatorVerified: boolean('creator_verified').default(false),
    likesCount: decimal('likes_count', { precision: 20, scale: 0 }).default('0'),
    viewsCount: decimal('views_count', { precision: 20, scale: 0 }).default('0'),
    commentsCount: decimal('comments_count', { precision: 20, scale: 0 }).default('0'),
    sharesCount: decimal('shares_count', { precision: 20, scale: 0 }).default('0'),
    contentType: text('content_type', {
      enum: ['influencer_pick', 'pricing_intel', 'travel_tip', 'hidden_gem', 'warning', 'general'],
    }),
    sentiment: text('sentiment', { enum: ['positive', 'neutral', 'negative'] }),
    trendScore: smallint('trend_score'),
    postedAt: timestamp('posted_at', { withTimezone: true }),
    crawledAt: timestamp('crawled_at', { withTimezone: true }).notNull().defaultNow(),
    extractedAt: timestamp('extracted_at', { withTimezone: true }),
    scoreUpdatedAt: timestamp('score_updated_at', { withTimezone: true }),
    thumbnailUrl: text('thumbnail_url'),
    extractionConfidence: text('extraction_confidence', {
      enum: ['high', 'medium', 'low'],
    }),
    rawExtraction: jsonb('raw_extraction'),
    ...timestamps,
  },
  (t) => ({
    countryIdx: index('idx_social_posts_country').on(t.countryCode),
    cityIdx: index('idx_social_posts_city').on(t.city),
    trendIdx: index('idx_social_posts_trend_score').on(t.trendScore),
    postedIdx: index('idx_social_posts_posted_at').on(t.postedAt),
    venueIdx: index('idx_social_posts_venue').on(t.venueId),
  }),
);

// ── Crawl Jobs ────────────────────────────────────────────────────────────────

export const crawlJobs = pgTable('crawl_jobs', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  platform: text('platform').notNull(),
  target: text('target'),
  startedAt: timestamp('started_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  postsFound: integer('posts_found').default(0),
  postsExtracted: integer('posts_extracted').default(0),
  status: text('status', { enum: ['pending', 'running', 'completed', 'failed'] }),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ── Budgets ───────────────────────────────────────────────────────────────────

export const budgets = pgTable(
  'budgets',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    tripId: uuid('trip_id')
      .notNull()
      .unique()
      .references(() => trips.id, { onDelete: 'cascade' }),
    totalAmount: decimal('total_amount', { precision: 12, scale: 2 }).notNull(),
    currency: text('currency').notNull().default('GBP'),
    foodAllocation: decimal('food_allocation', { precision: 12, scale: 2 }),
    transportAllocation: decimal('transport_allocation', { precision: 12, scale: 2 }),
    accommodationAllocation: decimal('accommodation_allocation', { precision: 12, scale: 2 }),
    activitiesAllocation: decimal('activities_allocation', { precision: 12, scale: 2 }),
    otherAllocation: decimal('other_allocation', { precision: 12, scale: 2 }),
    ...timestamps,
  },
);

// ── Expenses ──────────────────────────────────────────────────────────────────

export const expenses = pgTable(
  'expenses',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    tripId: uuid('trip_id')
      .notNull()
      .references(() => trips.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').notNull().references(() => users.id),
    amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
    currency: text('currency').notNull(),
    amountInBase: decimal('amount_in_base', { precision: 12, scale: 2 }),
    exchangeRate: decimal('exchange_rate', { precision: 12, scale: 6 }),
    category: text('category', {
      enum: ['food', 'transport', 'accommodation', 'activities', 'shopping', 'other'],
    }).notNull(),
    description: text('description'),
    venueId: uuid('venue_id').references(() => venues.id),
    taskId: uuid('task_id').references(() => tasks.id),
    loggedAt: timestamp('logged_at', { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    tripIdx: index('idx_expenses_trip_id').on(t.tripId),
  }),
);

// ── Phrasebook Entries ────────────────────────────────────────────────────────

export const phrasebookEntries = pgTable(
  'phrasebook_entries',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    languageCode: text('language_code').notNull(),
    languageName: text('language_name').notNull(),
    category: text('category', {
      enum: ['greetings', 'transport', 'food', 'emergency', 'shopping', 'accommodation', 'general'],
    }).notNull(),
    phraseEn: text('phrase_en').notNull(),
    phraseNative: text('phrase_native').notNull(),
    romanisation: text('romanisation'),
    phonetic: text('phonetic'),
    audioUrl: text('audio_url'),
    audioGeneratedAt: timestamp('audio_generated_at', { withTimezone: true }),
    isCustom: boolean('is_custom').default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    languageIdx: index('idx_phrasebook_language').on(t.languageCode),
    languageCategoryIdx: index('idx_phrasebook_category').on(t.languageCode, t.category),
  }),
);

// ── Saved Phrases ─────────────────────────────────────────────────────────────

export const savedPhrases = pgTable('saved_phrases', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid('user_id').notNull().references(() => users.id),
  phraseId: uuid('phrase_id').references(() => phrasebookEntries.id),
  customPhraseEn: text('custom_phrase_en'),
  customPhraseNative: text('custom_phrase_native'),
  languageCode: text('language_code').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ── Theme Preferences ─────────────────────────────────────────────────────────

export const themePreferences = pgTable('theme_preferences', {
  userId: uuid('user_id').primaryKey().references(() => users.id),
  activeTheme: text('active_theme').notNull().default('dark_light'),
  auroraDarkColours: jsonb('aurora_dark_colours'),
  warmSandColours: jsonb('warm_sand_colours'),
  electricColours: jsonb('electric_colours'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ── Achievements ──────────────────────────────────────────────────────────────

export const achievements = pgTable('achievements', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  icon: text('icon'),
  tierRequired: text('tier_required').default('voyager'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const userAchievements = pgTable(
  'user_achievements',
  {
    userId: uuid('user_id').notNull().references(() => users.id),
    achievementId: text('achievement_id').notNull().references(() => achievements.id),
    earnedAt: timestamp('earned_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.achievementId] }),
  }),
);

// ── Transport Passes ──────────────────────────────────────────────────────────

export const transportPasses = pgTable(
  'transport_passes',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    city: text('city').notNull(),
    countryCode: text('country_code').notNull(),
    passName: text('pass_name').notNull(),
    description: text('description'),
    coverage: text('coverage'),
    costAmount: decimal('cost_amount', { precision: 10, scale: 2 }),
    costCurrency: text('cost_currency'),
    validityPeriod: text('validity_period'),
    purchaseLocations: text('purchase_locations'),
    websiteUrl: text('website_url'),
    lastVerifiedAt: date('last_verified_at'),
    ...timestamps,
  },
  (t) => ({
    cityIdx: index('idx_transport_passes_city').on(t.city),
    countryIdx: index('idx_transport_passes_country').on(t.countryCode),
  }),
);

// ── AI Conversations ──────────────────────────────────────────────────────────

export const aiConversations = pgTable('ai_conversations', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  tripId: uuid('trip_id')
    .notNull()
    .references(() => trips.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id),
  ...timestamps,
});

export const aiMessages = pgTable(
  'ai_messages',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    conversationId: uuid('conversation_id')
      .notNull()
      .references(() => aiConversations.id, { onDelete: 'cascade' }),
    role: text('role', { enum: ['user', 'assistant', 'system'] }).notNull(),
    content: text('content').notNull(),
    tokenCount: integer('token_count'),
    modelUsed: text('model_used'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    conversationIdx: index('idx_ai_messages_conversation').on(t.conversationId, t.createdAt),
  }),
);

// ── Relations ─────────────────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ many, one }) => ({
  trips: many(trips),
  subscriptions: many(subscriptions),
  expenses: many(expenses),
  savedPhrases: many(savedPhrases),
  userAchievements: many(userAchievements),
  themePreferences: one(themePreferences, {
    fields: [users.id],
    references: [themePreferences.userId],
  }),
}));

export const tripsRelations = relations(trips, ({ one, many }) => ({
  user: one(users, { fields: [trips.userId], references: [users.id] }),
  days: many(itineraryDays),
  tasks: many(tasks),
  budget: one(budgets, { fields: [trips.id], references: [budgets.tripId] }),
  expenses: many(expenses),
  aiConversations: many(aiConversations),
}));

export const itineraryDaysRelations = relations(itineraryDays, ({ one, many }) => ({
  trip: one(trips, { fields: [itineraryDays.tripId], references: [trips.id] }),
  tasks: many(tasks),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  day: one(itineraryDays, { fields: [tasks.dayId], references: [itineraryDays.id] }),
  trip: one(trips, { fields: [tasks.tripId], references: [trips.id] }),
  venue: one(venues, { fields: [tasks.venueId], references: [venues.id] }),
}));

export const aiConversationsRelations = relations(aiConversations, ({ one, many }) => ({
  trip: one(trips, { fields: [aiConversations.tripId], references: [trips.id] }),
  user: one(users, { fields: [aiConversations.userId], references: [users.id] }),
  messages: many(aiMessages),
}));

// ── GDPR: User Consents ───────────────────────────────────────────────────────

export const userConsents = pgTable('user_consents', {
  userId: uuid('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  consentAnalytics: boolean('consent_analytics').notNull().default(false),
  consentCrashReporting: boolean('consent_crash_reporting').notNull().default(false),
  consentPushNotifications: boolean('consent_push_notifications').notNull().default(false),
  consentGivenAt: timestamp('consent_given_at', { withTimezone: true }).notNull().defaultNow(),
  consentUpdatedAt: timestamp('consent_updated_at', { withTimezone: true }).notNull().defaultNow(),
  consentVersion: text('consent_version').notNull().default('1.0'),
});

// ── GDPR: Data Deletion Requests ──────────────────────────────────────────────

export const dataDeletionRequests = pgTable(
  'data_deletion_requests',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid('user_id').notNull(), // not FK — user may already be deleted
    requestedAt: timestamp('requested_at', { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    status: text('status', { enum: ['pending', 'processing', 'completed', 'failed'] })
      .notNull()
      .default('pending'),
  },
  (t) => ({
    userIdx: index('idx_data_deletion_requests_user_id').on(t.userId),
    statusIdx: index('idx_data_deletion_requests_status').on(t.status),
  }),
);

// ── GDPR: Data Retention Log ──────────────────────────────────────────────────

export const dataRetentionLog = pgTable(
  'data_retention_log',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    recordType: text('record_type').notNull(),
    recordId: text('record_id').notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }).notNull().defaultNow(),
    deletionReason: text('deletion_reason').notNull(),
  },
  (t) => ({
    deletedAtIdx: index('idx_data_retention_log_deleted_at').on(t.deletedAt),
    recordTypeIdx: index('idx_data_retention_log_record_type').on(t.recordType),
  }),
);

// ── Device Tokens (Push Notifications) ───────────────────────────────────────

export const deviceTokens = pgTable(
  'device_tokens',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    token: text('token').notNull(),
    platform: text('platform', { enum: ['ios', 'android'] }).notNull(),
    registeredAt: timestamp('registered_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userIdx: index('idx_device_tokens_user_id').on(t.userId),
    tokenUniq: uniqueIndex('uq_device_tokens_token').on(t.token),
  }),
);

// ── Dismissed Venues ──────────────────────────────────────────────────────────

export const dismissedVenues = pgTable(
  'dismissed_venues',
  {
    tripId: uuid('trip_id').notNull().references(() => trips.id, { onDelete: 'cascade' }),
    venueId: uuid('venue_id').notNull().references(() => venues.id, { onDelete: 'cascade' }),
    dismissedAt: timestamp('dismissed_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.tripId, t.venueId] }),
    tripIdx: index('idx_dismissed_venues_trip_id').on(t.tripId),
  }),
);

// ── User Favourites ───────────────────────────────────────────────────────────

export const userFavourites = pgTable(
  'user_favourites',
  {
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    venueId: uuid('venue_id').notNull().references(() => venues.id, { onDelete: 'cascade' }),
    savedAt: timestamp('saved_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.venueId] }),
    userIdx: index('idx_user_favourites_user_id').on(t.userId),
  }),
);

// ── Community Tips ────────────────────────────────────────────────────────────

export const communityTips = pgTable(
  'community_tips',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    venueId: uuid('venue_id').notNull().references(() => venues.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    tipText: text('tip_text').notNull(),
    approved: boolean('approved').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    venueIdx: index('idx_community_tips_venue_id').on(t.venueId),
    userIdx: index('idx_community_tips_user_id').on(t.userId),
  }),
);
