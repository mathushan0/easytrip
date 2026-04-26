// ─────────────────────────────────────────────────────────────────────────────
// EASYTRIP — CORE TYPES
// ─────────────────────────────────────────────────────────────────────────────

// ─── User & Auth ─────────────────────────────────────────────────────────────

export type UserTier = 'explorer' | 'voyager' | 'nomad_pro';
export type TierSource = 'stripe' | 'apple_iap' | 'google_iap' | 'manual';
export type ThemeName = 'bubbly' | 'dark_light' | 'aurora_dark' | 'warm_sand' | 'electric';

export interface User {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  tier: UserTier;
  tierSource: TierSource | null;
  tierExpiresAt: string | null; // ISO date string
  preferredCurrency: string;
  preferredLanguage: string;
  theme: ThemeName;
  categoryColours: Partial<CategoryColours> | null;
  totalTrips: number;
  totalDays: number;
  totalTasksCompleted: number;
  countriesVisited: string[]; // ISO 3166-1 alpha-2
  referralCode: string | null;
  referredBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserStats {
  totalTrips: number;
  totalDays: number;
  totalTasksCompleted: number;
  countriesVisited: string[];
}

// ─── Subscriptions ───────────────────────────────────────────────────────────

export type SubscriptionProvider = 'stripe' | 'apple_iap' | 'google_iap';
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired' | 'pending' | 'past_due';
export type ProductId =
  | 'voyager_lifetime'
  | 'nomad_pro_monthly'
  | 'nomad_pro_annual';

export interface Subscription {
  id: string;
  userId: string;
  provider: SubscriptionProvider;
  providerSubscriptionId: string | null;
  providerCustomerId: string | null;
  productId: ProductId;
  status: SubscriptionStatus;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null; // null for lifetime
  cancelAtPeriodEnd: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Entitlements {
  tier: UserTier;
  canCreateTrips: boolean;
  maxTripDays: number | null; // null = unlimited
  maxActiveTrips: number | null;
  hasThemes: boolean;
  hasCameraTranslate: boolean;
  hasOfflinePacks: boolean;
  hasDragToReorder: boolean;
  hasSocialIntelligence: boolean;
  hasAiAssistant: boolean;
  hasRealtimeDisruptions: boolean;
  hasExport: boolean;
}

// ─── Trips ────────────────────────────────────────────────────────────────────

export type TripStatus = 'draft' | 'active' | 'archived';
export type TripType = 'solo' | 'couple' | 'family' | 'group' | 'business';
export type TravelPace = 'relaxed' | 'balanced' | 'packed';
export type DestinationConfidence = 'high' | 'medium' | 'low';

export interface TravelPreferences {
  dietary: string[];
  pace: TravelPace;
  interests: string[];
  tripType: TripType;
}

export interface Trip {
  id: string;
  userId: string;
  destination: string;
  countryCode: string;
  city: string | null;
  destinationLat: number | null;
  destinationLng: number | null;
  startDate: string; // YYYY-MM-DD
  endDate: string;
  durationDays: number;
  timezone: string;
  budgetAmount: number | null;
  budgetCurrency: string;
  tripType: TripType | null;
  travelPreferences: TravelPreferences | null;
  aiModelUsed: string | null;
  generationPromptVersion: string | null;
  destinationConfidence: DestinationConfidence | null;
  status: TripStatus;
  shareToken: string | null;
  isShared: boolean;
  coverPhotoUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TripWithDays extends Trip {
  days: ItineraryDay[];
}

// ─── Itinerary ────────────────────────────────────────────────────────────────

export interface WeatherSnapshot {
  temp: number;
  condition: string;
  icon: string;
  humidity?: number;
  windSpeed?: number;
}

export interface ItineraryDay {
  id: string;
  tripId: string;
  dayNumber: number;
  date: string; // YYYY-MM-DD
  title: string | null;
  summary: string | null;
  weatherSnapshot: WeatherSnapshot | null;
  tasks: Task[];
  createdAt: string;
  updatedAt: string;
}

// ─── Tasks ────────────────────────────────────────────────────────────────────

export type TaskCategory =
  | 'food'
  | 'landmark'
  | 'transport'
  | 'culture'
  | 'budget'
  | 'accommodation'
  | 'general';

export type TransportMode = 'walk' | 'metro' | 'bus' | 'taxi' | 'bike';

export interface Task {
  id: string;
  dayId: string;
  tripId: string;
  position: number;
  title: string;
  description: string | null;
  category: TaskCategory;
  startTime: string | null; // HH:MM
  endTime: string | null;
  durationMinutes: number | null;
  venueId: string | null;
  venue: Venue | null;
  isCompleted: boolean;
  completedAt: string | null;
  isCustom: boolean;
  travelTimeToNextMinutes: number | null;
  transportMode: TransportMode | null;
  estimatedCost: number | null;
  actualCost: number | null;
  currency: string | null;
  tips: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Venues ───────────────────────────────────────────────────────────────────

export type PriceLevel = 1 | 2 | 3 | 4;

export interface OpeningHours {
  monday?: string[];
  tuesday?: string[];
  wednesday?: string[];
  thursday?: string[];
  friday?: string[];
  saturday?: string[];
  sunday?: string[];
  isOpen?: boolean;
  closesAt?: string;
}

export interface VenuePhoto {
  url: string;
  source: 'google' | 'unsplash' | 'pexels';
  attribution: string | null;
  width: number;
  height: number;
}

export interface PeakHoursData {
  monday: number[];    // 24 hourly values, 0-100
  tuesday: number[];
  wednesday: number[];
  thursday: number[];
  friday: number[];
  saturday: number[];
  sunday: number[];
}

export interface Venue {
  id: string;
  googlePlaceId: string | null;
  name: string;
  category: string;
  subCategory: string | null;
  address: string | null;
  city: string | null;
  countryCode: string | null;
  lat: number | null;
  lng: number | null;
  phone: string | null;
  website: string | null;
  googleRating: number | null;
  googleReviewCount: number | null;
  priceLevel: PriceLevel | null;
  openingHours: OpeningHours | null;
  hoursLastFetchedAt: string | null;
  photos: VenuePhoto[];
  estimatedCostLow: number | null;
  estimatedCostHigh: number | null;
  costCurrency: string | null;
  entryFee: number | null;
  bookingUrl: string | null;
  peakHours: PeakHoursData | null;
  dietaryTags: string[];
  createdAt: string;
  updatedAt: string;
}

// ─── Social Intelligence ──────────────────────────────────────────────────────

export type SocialPlatform =
  | 'youtube'
  | 'tiktok'
  | 'twitter'
  | 'instagram'
  | 'facebook'
  | 'reddit'
  | 'blog'
  | 'review_site';

export type ContentType =
  | 'influencer_pick'
  | 'pricing_intel'
  | 'travel_tip'
  | 'hidden_gem'
  | 'warning'
  | 'general';

export type Sentiment = 'positive' | 'neutral' | 'negative';

export type ExtractionConfidence = 'high' | 'medium' | 'low';

export interface SocialPost {
  id: string;
  platform: SocialPlatform;
  platformPostId: string | null;
  postUrl: string | null;
  title: string | null;
  contentSnippet: string | null; // max 50 words
  destination: string | null;
  city: string | null;
  countryCode: string | null;
  venueId: string | null;
  venue: Venue | null;
  creatorUsername: string | null;
  creatorDisplayName: string | null;
  creatorFollowerCount: number | null;
  creatorVerified: boolean;
  likesCount: number;
  viewsCount: number;
  commentsCount: number;
  sharesCount: number;
  contentType: ContentType | null;
  sentiment: Sentiment | null;
  trendScore: number | null; // 0-100
  postedAt: string | null;
  crawledAt: string;
  thumbnailUrl: string | null;
  extractionConfidence: ExtractionConfidence | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Budget & Expenses ────────────────────────────────────────────────────────

export type ExpenseCategory =
  | 'food'
  | 'transport'
  | 'accommodation'
  | 'activities'
  | 'shopping'
  | 'other';

export interface Budget {
  id: string;
  tripId: string;
  totalAmount: number;
  currency: string;
  foodAllocation: number | null;
  transportAllocation: number | null;
  accommodationAllocation: number | null;
  activitiesAllocation: number | null;
  otherAllocation: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetWithSpend extends Budget {
  totalSpent: number;
  remaining: number;
  spentByCategory: Record<ExpenseCategory, number>;
}

export interface Expense {
  id: string;
  tripId: string;
  userId: string;
  amount: number;
  currency: string;
  amountInBase: number | null;
  exchangeRate: number | null;
  category: ExpenseCategory;
  description: string | null;
  venueId: string | null;
  taskId: string | null;
  loggedAt: string;
  createdAt: string;
}

// ─── Theme ────────────────────────────────────────────────────────────────────

export type CategoryKey =
  | 'food'
  | 'landmark'
  | 'transport'
  | 'culture'
  | 'budget'
  | 'accommodation'
  | 'general';

export type CategoryColours = Record<CategoryKey, string>;

export interface ThemeTokens {
  // Backgrounds
  bg_primary: string;
  bg_surface: string;
  bg_raised: string;
  bg_glass: string;
  bg_glass_border: string;

  // Text
  text_primary: string;
  text_secondary: string;
  text_disabled: string;
  text_inverse: string;

  // Brand palette
  brand_lime: string;
  brand_cyan: string;
  brand_coral: string;
  brand_gold: string;
  brand_violet: string;

  // Categories (overridable per user)
  category_food: string;
  category_landmark: string;
  category_transport: string;
  category_culture: string;
  category_budget: string;
  category_accommodation: string;
  category_general: string;

  // Gradients
  gradient_primary: [string, string];
  gradient_hero: [string, string];
  gradient_cta: [string, string];

  // Interactive states
  interactive_primary: string;
  interactive_hover: string;
  interactive_pressed: string;
  interactive_ghost: string;

  // Borders
  border_default: string;
  border_focus: string;
  border_error: string;
  border_success: string;

  // System colours
  system_success: string;
  system_warning: string;
  system_error: string;
  system_info: string;

  // Typography
  font_display: string;
  font_serif: string;
  font_body: string;
  font_body_medium: string;
  font_mono: string;

  // Spacing (constant across themes)
  space_xs: 4;
  space_sm: 8;
  space_md: 16;
  space_lg: 24;
  space_xl: 32;
  space_2xl: 48;
  space_3xl: 64;

  // Radii (constant across themes)
  radius_sm: 8;
  radius_md: 12;
  radius_lg: 16;
  radius_xl: 24;
  radius_full: 999;

  // Effects
  glass_opacity: number;
  grain_opacity: number;
  shadow_card: string;
  shadow_modal: string;
  blur_glass: number;

  // Map
  map_style_id: string;

  // Theme-specific optional fields
  scanline_opacity?: number;    // Electric only
  grid_opacity?: number;        // Electric only
  neon_glow_color?: string;     // Electric only
  neon_glow_intensity?: number; // Electric only
}

export interface ThemeContextType {
  theme: ThemeTokens;
  themeName: ThemeName;
  setTheme: (name: ThemeName) => void;
  categoryColours: Partial<CategoryColours>;
  setCategoryColour: (category: CategoryKey, colour: string) => void;
  resolvedCategoryColour: (category: CategoryKey) => string;
}

// ─── Navigation ───────────────────────────────────────────────────────────────

export type RootStackParamList = {
  Onboarding: undefined;
  SignIn: undefined;
  SignUp: undefined;
  Main: undefined;
};

export type TabParamList = {
  Home: undefined;
  Trips: undefined;
  Create: undefined;
  Assistant: undefined;
  Profile: undefined;
};

export type HomeStackParamList = {
  HomeScreen: undefined;
};

export type TripsStackParamList = {
  TripsScreen: undefined;
  TripDetail: { tripId: string };
  DayPlanner: { tripId: string; dayId: string };
};

export type TranslateStackParamList = {
  TranslateScreen: undefined;
};

export type ProfileStackParamList = {
  ProfileScreen: undefined;
  Settings: undefined;
};

export type ModalStackParamList = {
  PlaceDetail: { placeId: string };
  Transport: { fromVenueId?: string; toVenueId?: string };
  Food: { tripId?: string };
  Budget: { tripId: string };
  SocialIntelligence: { tripId?: string; city?: string; countryCode?: string };
};

// ─── API ──────────────────────────────────────────────────────────────────────

export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
  requiredTier?: UserTier;
  upsellContext?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface GenerationJob {
  jobId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number; // 0-100
  currentStep: string | null;
  tripId: string | null;
  error: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── AI ───────────────────────────────────────────────────────────────────────

export interface AiMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  tokenCount: number | null;
  modelUsed: string | null;
  createdAt: string;
}

export interface AiConversation {
  id: string;
  tripId: string;
  userId: string;
  messages: AiMessage[];
  createdAt: string;
  updatedAt: string;
}

// ─── Translations ─────────────────────────────────────────────────────────────

export type PhraseCategory =
  | 'greetings'
  | 'transport'
  | 'food'
  | 'emergency'
  | 'shopping'
  | 'accommodation'
  | 'general';

export interface PhrasebookEntry {
  id: string;
  languageCode: string;
  languageName: string;
  category: PhraseCategory;
  phraseEn: string;
  phraseNative: string;
  romanisation: string | null;
  phonetic: string | null;
  audioUrl: string | null;
  audioGeneratedAt: string | null;
  isCustom: boolean;
  createdAt: string;
}

export interface TranslationResult {
  originalText: string;
  translatedText: string;
  detectedSourceLanguage: string;
  targetLanguage: string;
  romanisation: string | null;
}

export interface OcrTranslationResult extends TranslationResult {
  blocks: OcrBlock[];
  imageWidth: number;
  imageHeight: number;
}

export interface OcrBlock {
  text: string;
  translatedText: string;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

// ─── Transport ────────────────────────────────────────────────────────────────

export interface RouteOption {
  mode: TransportMode;
  durationMinutes: number;
  distanceMetres: number;
  estimatedCost: number | null;
  currency: string | null;
  departureTime: string | null;
  steps: RouteStep[];
  polyline: LatLng[];
  isRecommended: boolean;
}

export interface RouteStep {
  instruction: string;
  mode: TransportMode;
  durationMinutes: number;
  distanceMetres: number;
  lineCode?: string;  // Metro line code
  departureStop?: string;
  arrivalStop?: string;
}

export interface LatLng {
  latitude: number;
  longitude: number;
}

export interface TransportPass {
  id: string;
  city: string;
  countryCode: string;
  passName: string;
  description: string | null;
  coverage: string | null;
  costAmount: number | null;
  costCurrency: string | null;
  validityPeriod: string | null;
  purchaseLocations: string | null;
  websiteUrl: string | null;
  lastVerifiedAt: string | null;
}

// ─── Achievements ─────────────────────────────────────────────────────────────

export interface Achievement {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  tierRequired: UserTier;
  createdAt: string;
}

export interface UserAchievement {
  achievement: Achievement;
  earnedAt: string;
}

// ─── Notifications ────────────────────────────────────────────────────────────

export interface PushNotificationData {
  type: 'trip_reminder' | 'generation_complete' | 'social_update' | 'disruption';
  tripId?: string;
  jobId?: string;
  message: string;
}

// ─── Misc ─────────────────────────────────────────────────────────────────────

export interface WeatherForecast {
  date: string;
  tempHigh: number;
  tempLow: number;
  condition: string;
  icon: string;
  precipitation: number;
  humidity: number;
}

export interface ExchangeRate {
  base: string;
  rates: Record<string, number>;
  updatedAt: string;
}
