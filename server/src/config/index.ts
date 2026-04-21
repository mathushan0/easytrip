// Config — reads from environment variables.
// In production, secrets are injected from AWS Secrets Manager via ECS task env.

function required(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required environment variable: ${key}`);
  return val;
}

function optional(key: string, fallback = ''): string {
  return process.env[key] ?? fallback;
}

export const config = {
  env: optional('NODE_ENV', 'development') as 'development' | 'staging' | 'production',
  port: parseInt(optional('PORT', '3000'), 10),
  logLevel: optional('LOG_LEVEL', 'info'),
  corsOrigin: optional('CORS_ORIGIN', 'http://localhost:8081'),
  promptVersion: optional('PROMPT_VERSION', 'v1.0'),

  db: {
    url: required('DATABASE_URL'),
  },

  redis: {
    url: required('REDIS_URL'),
  },

  supabase: {
    url: required('SUPABASE_URL'),
    anonKey: required('SUPABASE_ANON_KEY'),
    serviceRoleKey: required('SUPABASE_SERVICE_ROLE_KEY'),
  },

  ai: {
    anthropicApiKey: required('ANTHROPIC_API_KEY'),
    openaiApiKey: required('OPENAI_API_KEY'),
  },

  google: {
    placesApiKey: required('GOOGLE_PLACES_API_KEY'),
    mapsApiKey: required('GOOGLE_MAPS_API_KEY'),
    translateApiKey: required('GOOGLE_TRANSLATE_API_KEY'),
    visionApiKey: required('GOOGLE_CLOUD_VISION_API_KEY'),
    ttsApiKey: required('GOOGLE_CLOUD_TTS_API_KEY'),
    playPackageName: optional('GOOGLE_PLAY_PACKAGE_NAME', 'app.easytrip'),
    playServiceAccountKey: optional('GOOGLE_PLAY_SERVICE_ACCOUNT_KEY'),
  },

  stripe: {
    secretKey: required('STRIPE_SECRET_KEY'),
    webhookSecret: required('STRIPE_WEBHOOK_SECRET'),
    prices: {
      voyagerLifetime: required('STRIPE_PRICE_VOYAGER_LIFETIME'),
      proMonthly: required('STRIPE_PRICE_PRO_MONTHLY'),
      proAnnual: required('STRIPE_PRICE_PRO_ANNUAL'),
    },
  },

  social: {
    twitterBearerToken: optional('TWITTER_BEARER_TOKEN'),
    youtubeApiKey: optional('YOUTUBE_API_KEY'),
    redditClientId: optional('REDDIT_CLIENT_ID'),
    redditClientSecret: optional('REDDIT_CLIENT_SECRET'),
  },

  resend: {
    apiKey: optional('RESEND_API_KEY'),
  },

  openExchangeRates: {
    appId: optional('OPEN_EXCHANGE_RATES_APP_ID'),
  },

  openWeatherMap: {
    apiKey: optional('OPENWEATHERMAP_API_KEY'),
  },

  admin: {
    username: optional('ADMIN_USERNAME', 'admin'),
    password: required('ADMIN_PASSWORD'),
  },

  apple: {
    iapSharedSecret: optional('APPLE_IAP_SHARED_SECRET'),
    bundleId: optional('APPLE_BUNDLE_ID', 'app.easytrip'),
  },

  aws: {
    region: optional('AWS_REGION', 'eu-west-1'),
    s3BucketName: optional('S3_BUCKET_NAME', 'easytrip-media-dev'),
    cloudfrontDomain: optional('CLOUDFRONT_DOMAIN', 'media.easytrip.app'),
  },

  libreTranslate: {
    url: optional('LIBRETRANSLATE_URL', 'http://localhost:5000'),
  },
} as const;

export type Config = typeof config;
