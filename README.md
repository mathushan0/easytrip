# EasyTrip

> AI-powered global travel companion for iOS and Android.

EasyTrip generates a full day-by-day itinerary from a destination and dates, then handles everything after that: transport routing, restaurant discovery, translation, budget tracking, and a 24/7 social intelligence agent that surfaces trending spots from real influencers.

---

## Quick Start

### Mobile App

```bash
git clone https://github.com/your-org/easytrip.git
cd easytrip
npm install
cp .env.example .env   # fill in required keys (see Environment Variables)
npm start              # opens Expo Dev Tools
```

Press `i` for iOS simulator, `a` for Android emulator, or scan the QR code with Expo Go.

### Server

```bash
cd server
npm install
cp .env.example .env   # fill in all credentials
docker compose -f ../infra/docker-compose.prod.yml --profile local up -d postgres redis
npm run db:migrate
npm run dev
```

API runs at `http://localhost:3000`. Swagger UI at `http://localhost:3000/docs`.

### One-command setup (recommended for new contributors)

```bash
chmod +x scripts/setup.sh
./scripts/setup.sh
```

This installs dependencies, copies env files, starts local Docker services, runs migrations, and verifies the build.

---

## Setup Guides

- **[macOS Developer Setup](MACOS-SETUP.md)** — Complete step-by-step guide for macOS (Big Sur+): prerequisites, Node.js/nvm, frontend/backend setup, database configuration, authentication, development workflow, and troubleshooting.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile | React Native + Expo SDK 51 (Dev Client) |
| Language | TypeScript (strict) |
| State | Zustand v4 + TanStack Query v5 |
| Offline DB | WatermelonDB |
| Fast KV | MMKV |
| Navigation | React Navigation v6 |
| Animations | react-native-reanimated v3 |
| Maps | react-native-maps (Google Maps) |
| Server | Node.js 20 + Fastify v4 |
| ORM | Drizzle ORM |
| Database | PostgreSQL 16 |
| Cache / Queue | Redis 7 + BullMQ |
| Auth | Supabase Auth |
| AI (primary) | Claude 3.5 Sonnet (Anthropic) |
| AI (fallback) | GPT-4o (OpenAI) |
| Payments | Stripe + Apple IAP + Google IAP |
| Infra | AWS ECS/Fargate + RDS + ElastiCache |
| CI/CD | GitHub Actions + EAS Build |

---

## Project Structure

```
easytrip/
├── App.tsx                    # App entry point
├── app.json                   # Expo config
├── eas.json                   # EAS Build profiles
├── package.json               # Mobile dependencies
├── src/
│   ├── components/
│   │   ├── atoms/             # Base UI (Button, Badge, TextInput…)
│   │   ├── molecules/         # Composed components (VenueCard, TripCard…)
│   │   └── organisms/         # Feature sections (BudgetBreakdown…)
│   ├── navigation/            # Stack + tab navigators
│   ├── screens/               # One file per screen
│   ├── services/              # API client, IAP, Socket.io client
│   ├── stores/                # Zustand stores (user, trip, theme…)
│   └── theme/                 # ThemeProvider, tokens, fonts
├── server/
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── src/
│       ├── auth/              # JWT middleware, Supabase helpers
│       ├── config/            # Env config
│       ├── db/                # Drizzle schema, migrations
│       ├── errors/            # Typed error classes
│       ├── plugins/           # Redis plugin
│       ├── routes/            # One file per feature module
│       ├── services/          # AI, Places, Translate, Social Agent…
│       ├── types/             # Shared TypeScript types
│       └── ws/                # Socket.io WebSocket server
├── infra/
│   ├── Caddyfile              # Caddy reverse proxy config
│   ├── docker-compose.prod.yml
│   └── terraform/             # AWS infrastructure (ECS, RDS, Redis…)
├── scripts/
│   ├── setup.sh               # One-command dev setup
│   ├── build-mobile.sh        # EAS build wrapper
│   ├── deploy-server.sh       # ECS deploy script
│   └── run-tests.sh           # Full test suite runner
└── docs/
    ├── 01-project-brief.md
    ├── 02-architecture.md
    ├── 03-ux-design.md
    ├── 04-deployment.md
    ├── 05-qa-report.md
    ├── 06-api-docs.md
    └── 07-user-guide.md
```

---

## Development Setup

### Prerequisites

- Node.js 22 LTS (use [nvm](https://github.com/nvm-sh/nvm))
- Docker Desktop
- Xcode (iOS) or Android Studio (Android)
- An [Expo](https://expo.dev) account

### Step by step

1. **Clone and install**
   ```bash
   git clone https://github.com/your-org/easytrip.git
   cd easytrip
   npm install
   cd server && npm install && cd ..
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env            # mobile env vars
   cp server/.env.example server/.env  # server secrets
   ```
   Edit both files. See [Environment Variables](#environment-variables) below.

3. **Start local services**
   ```bash
   docker compose -f infra/docker-compose.prod.yml --profile local up -d
   ```

4. **Run migrations**
   ```bash
   cd server && npm run db:migrate && cd ..
   ```

5. **Start server**
   ```bash
   cd server && npm run dev
   ```

6. **Start mobile**
   ```bash
   npm start   # in project root
   ```

### Running tests

```bash
./scripts/run-tests.sh          # everything
cd server && npm test           # server unit tests only
```

---

## Building for iOS / Android (EAS)

Builds are managed via [Expo Application Services (EAS)](https://expo.dev/eas).

### One-time setup

```bash
npm install -g eas-cli
eas login
eas build:configure
```

Update `app.json` with your `extra.eas.projectId` from the Expo dashboard.

### Build commands

```bash
# Internal TestFlight / Play beta
eas build --profile preview --platform ios
eas build --profile preview --platform android

# App Store / Play Store production build
eas build --profile production --platform all
```

### Submit to stores

```bash
eas submit --profile production --platform ios
eas submit --profile production --platform android
```

### OTA Updates (no store review required)

For JS-only changes (no native module changes):

```bash
eas update --channel production --message "Fix: budget tracker rounding"
```

---

## Server Deployment

### Docker (production simulation)

```bash
# Build image
docker build -t easytrip-api ./server

# Run full stack
docker compose -f infra/docker-compose.prod.yml up -d
```

### AWS (ECS / Fargate)

Infrastructure is defined in `infra/terraform/`. See `docs/04-deployment.md` for the full deployment guide.

```bash
# First-time Terraform setup
cd infra/terraform
terraform init
terraform plan
terraform apply

# Deploy a new server image
./scripts/deploy-server.sh
```

The deploy script:
1. Builds the Docker image
2. Pushes to AWS ECR
3. Runs DB migrations as an ECS one-off task
4. Updates the ECS service (blue/green, automatic rollback on health check failure)

### Admin interfaces

- **Swagger UI:** `https://api.easytrip.app/docs`
- **BullMQ Dashboard:** `https://api.easytrip.app/admin/queues` (HTTP Basic Auth)
- **Health check:** `GET /health`

---

## Environment Variables

### Mobile (`.env`)

| Variable | Description |
|---|---|
| `EXPO_PUBLIC_API_URL` | Backend API base URL |
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` | Google Maps SDK key (restrict to bundle ID) |
| `EXPO_PUBLIC_POSTHOG_KEY` | PostHog analytics key |
| `EXPO_PUBLIC_SENTRY_DSN` | Sentry error tracking DSN |
| `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (web checkout only) |
| `EXPO_PUBLIC_SOCIAL_INTEL_ENABLED` | Set `true` to enable Social Intelligence UI (v1.5+) |
| `EXPO_PUBLIC_ENVIRONMENT` | `development` \| `staging` \| `production` |

All mobile variables are prefixed `EXPO_PUBLIC_` and are safe to include in the JS bundle. **Do not put secrets here.**

### Server (`server/.env`)

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-only, never expose) |
| `ANTHROPIC_API_KEY` | Anthropic Claude API key (primary AI) |
| `OPENAI_API_KEY` | OpenAI API key (fallback AI + social extraction) |
| `GOOGLE_PLACES_API_KEY` | Google Places API (New) key |
| `GOOGLE_MAPS_API_KEY` | Google Directions API key |
| `GOOGLE_TRANSLATE_API_KEY` | Google Cloud Translation key |
| `GOOGLE_CLOUD_VISION_API_KEY` | Google Cloud Vision (OCR) key |
| `GOOGLE_CLOUD_TTS_API_KEY` | Google Cloud TTS key |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `STRIPE_PRICE_VOYAGER_LIFETIME` | Stripe Price ID for Voyager one-time |
| `STRIPE_PRICE_PRO_MONTHLY` | Stripe Price ID for Nomad Pro monthly |
| `STRIPE_PRICE_PRO_ANNUAL` | Stripe Price ID for Nomad Pro annual |
| `TWITTER_BEARER_TOKEN` | Twitter/X API v2 Bearer token |
| `YOUTUBE_API_KEY` | YouTube Data API v3 key |
| `REDDIT_CLIENT_ID` | Reddit app client ID |
| `REDDIT_CLIENT_SECRET` | Reddit app client secret |
| `RESEND_API_KEY` | Resend transactional email key |
| `OPEN_EXCHANGE_RATES_APP_ID` | Open Exchange Rates app ID |
| `OPENWEATHERMAP_API_KEY` | OpenWeatherMap API key |
| `SENTRY_DSN` | Sentry DSN (server-side) |
| `AWS_REGION` | AWS region (default: `eu-west-1`) |
| `S3_BUCKET_NAME` | S3 bucket for media/audio storage |
| `CLOUDFRONT_DOMAIN` | CloudFront domain for media CDN |
| `LIBRETRANSLATE_URL` | LibreTranslate instance URL (translation fallback) |
| `PORT` | Server port (default: `3000`) |
| `NODE_ENV` | `development` \| `staging` \| `production` |
| `CORS_ORIGIN` | Allowed CORS origins (comma-separated) |
| `PROMPT_VERSION` | AI prompt template version (default: `v1.0`) |

In production (AWS ECS), secrets are injected via AWS Secrets Manager — no `.env` file is present on the server.

---

## Subscription Tiers

| Tier | Price | Limits |
|---|---|---|
| **Explorer** (free) | £0 | 3 trips, 3-day max per trip |
| **Voyager** | £4.99 one-time | Unlimited trips + days, themes, OCR, offline, sharing |
| **Nomad Pro** | £2.99/mo or £24.99/yr | Everything in Voyager + Social Intelligence + AI Assistant |

---

## Contributing

1. Fork the repository and create a branch: `git checkout -b feat/your-feature`
2. Run `./scripts/setup.sh` to set up your local environment
3. Make changes. Follow the existing TypeScript and ESLint config (no `any`, no hardcoded hex colours in components)
4. Run tests: `./scripts/run-tests.sh`
5. Submit a PR with a clear description. Link any related issues.

**Code style:**
- All colours via theme tokens (`theme.surface`, `theme.text_primary`) — never hardcoded hex
- Zod for all external input validation (API requests, LLM output)
- Drizzle ORM for all DB access — no raw SQL strings
- Server-side tier enforcement only (client paywalls are UX, not security)

**Commit convention:** `type(scope): message` — e.g. `feat(planner): add drag-to-reorder`, `fix(budget): currency rounding`

---

## Links

- **Staging API:** `https://api-staging.easytrip.app`
- **Production API:** `https://api.easytrip.app`
- **API Docs (Swagger):** `https://api.easytrip.app/docs`
- **Architecture:** `docs/02-architecture.md`
- **Deployment guide:** `docs/04-deployment.md`
- **QA report:** `docs/05-qa-report.md`
