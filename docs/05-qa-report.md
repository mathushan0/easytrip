# EasyTrip — QA Report v1.0
**Produced by:** QA Engineer  
**Date:** 2026-04-21  
**Codebase:** Frontend 57 files · Backend 39 files  
**Verdict:** ⛔ **REVISION REQUIRED**

---

## Executive Summary

The EasyTrip codebase demonstrates strong architectural foundations: the theme system is complete and well-structured, the database schema aligns with architecture requirements, the backend security model (JWT, tier gating, rate limiting) is correctly implemented, and the Social Intelligence Agent pipeline is built and functional at the service layer. However, **critical blockers prevent this build from being shippable**: all 14 screens use hardcoded mock data with no real API calls, the trip creation wizard does not call the backend, drag-to-reorder (a P0 requirement) is not implemented, and the frontend is missing several core dependencies from `package.json`. These are not polish issues — they represent fundamental integration gaps.

---

## Review Scope & Coverage

Files reviewed: all 57 frontend files, 39 backend files, 4 doc files, 6 infra/config files.

---

## Feature Area Results

### 1. TypeScript Correctness & Import Integrity

**Status: ❌ FAIL**

| Severity | Issue | Location |
|---|---|---|
| **MAJOR** | `ProfileScreen.tsx` imports `LinearGradient` from `react-native-linear-gradient` — not installed. Other screens correctly use `expo-linear-gradient`. This import will crash on build. | `src/screens/ProfileScreen.tsx:5` |
| **MAJOR** | `react-native-mmkv` is used in `ThemeProvider.tsx`, `userStore.ts` (MMKV for auth token storage) but is **absent from `package.json`**. Build will fail. | `package.json` |
| **MAJOR** | `WatermelonDB` is not in `package.json` despite being the central offline-first database in the architecture. No offline models exist. | `package.json` |
| **MAJOR** | `expo-in-app-purchases` is not in `package.json`. Required for Apple/Google IAP — a P0 monetisation requirement. | `package.json` |
| **MAJOR** | `socket.io-client` is not in `package.json`. Required for live Social Intelligence WebSocket feed. | `package.json` |
| **MAJOR** | `@react-native-community/netinfo` is not in `package.json`. Required for offline detection hook in architecture. | `package.json` |
| **MINOR** | `server/src/index.ts` imports `createRedisClient` twice on line 13 (duplicate named import from same module). | `server/src/index.ts:13` |
| **MINOR** | `ItineraryOverviewScreen.tsx` has a duplicate `endTime: '15:30'` field in a Task object literal (TypeScript should warn; harmless at runtime but sloppy). | `src/screens/ItineraryOverviewScreen.tsx` |
| **MINOR** | `DailyPlannerScreen.tsx` uses `task.category as any` when calling `resolvedCategoryColour()`. The type is `TaskCategory`, which is a subtype of `CategoryKey` — a proper cast or type guard should be used. | `src/screens/DailyPlannerScreen.tsx` |
| **MINOR** | Architecture specifies Expo SDK 52; `package.json` declares `"expo": "~51.0.0"`. Minor but should align with architecture doc. | `package.json` |
| **MINOR** | Architecture specifies Zustand v5; `package.json` has `^4.5.5`. API differs; `create()` signature changed in v5. | `package.json` |

**Tagged to:** Frontend Developer

---

### 2. All 14 Screens Implemented Against Spec (01-project-brief.md)

**Status: ⚠️ PARTIAL PASS — screens exist but are not integrated**

All 14 screens listed in the Project Brief are present as files:

| Screen | File | UI Shell | API Integrated | Notes |
|---|---|---|---|---|
| SCR-01 Auth (Onboarding) | `OnboardingScreen.tsx` | ✅ | ❌ | No OAuth/email login wired |
| SCR-02 Home Dashboard | `HomeScreen.tsx` | ✅ | ❌ | All mock data |
| SCR-03 Trip Creator | `TripCreatorScreen.tsx` | ✅ | ❌ | Generate button uses setTimeout loop, no API call |
| SCR-04 Itinerary Overview | `ItineraryOverviewScreen.tsx` | ✅ | ❌ | Mock days/tasks hardcoded |
| SCR-05 Daily Planner | `DailyPlannerScreen.tsx` | ✅ | ❌ | Mock tasks, no drag-to-reorder |
| SCR-06 Place Detail | `PlaceDetailScreen.tsx` | ✅ | ❌ | Mock venue data |
| SCR-07 Transport | `TransportScreen.tsx` | ✅ | ❌ | Mock routes |
| SCR-08 Food & Dining | `FoodDiningScreen.tsx` | ✅ | ❌ | Mock restaurants |
| SCR-09 Translator | `TranslatorScreen.tsx` | ✅ | ❌ | Mock phrases, no translation API call |
| SCR-10 Social Intelligence | `SocialIntelligenceScreen.tsx` | ✅ | ❌ | Mock posts; note: spec deferred this to v1.5 |
| SCR-11 Budget Tracker | `BudgetTrackerScreen.tsx` | ✅ | ❌ | Mock budget/expenses |
| SCR-12 Settings | `SettingsScreen.tsx` | ✅ | ⚠️ | Theme switching fires `setTheme()` which syncs to server (non-blocking) |
| SCR-13 Profile | `ProfileScreen.tsx` | ✅ | ❌ | Mock user data; import crash (see §1) |
| SCR-14 AI Assistant | `AIAssistantScreen.tsx` | ✅ | ❌ | Mock messages, no API call |

**Critical issues:**

| Severity | Issue | Location |
|---|---|---|
| **CRITICAL** | **Zero screens make real API calls.** Every screen uses hardcoded `MOCK_*` constants. This is a scaffolded UI, not a functional product. TanStack Query is configured but not used in any screen. | All screen files |
| **CRITICAL** | **Auth screens are `PlaceholderScreen` stubs** (`SignIn`, `SignUp` in `RootNavigator`). Only the Onboarding visual shell exists. No Supabase Auth integration in the client. | `src/navigation/RootNavigator.tsx` |
| **CRITICAL** | **Drag-to-reorder (P0 requirement) is not implemented.** `DailyPlannerScreen.tsx` uses standard `ScrollView` + `TouchableOpacity`. `react-native-draggable-flatlist` is in `package.json` but not used anywhere. The trip store has `reorderTasks()` but it's never called. | `src/screens/DailyPlannerScreen.tsx` |
| **MAJOR** | `TripCreatorScreen.handleGenerate()` simulates generation progress with `setTimeout` but never calls `POST /trips/:id/generate`. No trip is ever created or submitted to the backend. | `src/screens/TripCreatorScreen.tsx:76-88` |

**Tagged to:** Frontend Developer

---

### 3. Theme System (3 Themes)

**Status: ✅ PASS**

The theme system is the strongest part of the frontend build. Full review:

- All 4 themes (`dark_light`, `aurora_dark`, `warm_sand`, `electric`) are fully defined in `tokens.ts` with complete token sets (backgrounds, text, brands, categories, gradients, typography, effects).
- `ThemeProvider` correctly reads from MMKV, applies tier gating (Explorer locked to `dark_light`), handles category colour overrides per theme, and fires a non-blocking server sync on change.
- `useTheme()`, `useThemeTokens()`, `useGlassStyle()`, `useCategoryColour()` hooks are clean and well-separated.
- All reviewed screens use `theme.*` tokens consistently — no hardcoded hex values found in component StyleSheet calls.
- Electric theme has correct theme-specific props (`scanline_opacity`, `grid_opacity`, `neon_glow_color`) typed as optional on `ThemeTokens`.

| Severity | Issue | Location |
|---|---|---|
| **MINOR** | `ThemeProvider` initialises by calling `useUserTier()` inside `useState()` initialiser. If the Zustand store hasn't hydrated MMKV yet on cold start, the tier could briefly be `'explorer'`, causing a paid theme to fall back to `dark_light` for one frame before correcting. A `useEffect` re-check after mount would prevent this flicker. | `src/theme/ThemeProvider.tsx:55-60` |
| **MINOR** | `setTheme()` silently returns without error when an Explorer user attempts to set a paid theme. The caller (`SettingsScreen`) is expected to show an upsell before calling `setTheme`, but there's no thrown error or callback to confirm the gate was triggered. | `src/theme/ThemeProvider.tsx:79` |

**Tagged to:** Frontend Developer (minor fixes only)

---

### 4. Backend Routes vs Frontend API Calls

**Status: ⚠️ PARTIAL — backend routes are well-built, but frontend doesn't call them**

Backend route coverage vs architecture spec:

| Route Group | Implemented | Notes |
|---|---|---|
| `/trips` CRUD | ✅ | Complete: list, create, get, update, delete, generate, status, regenerate-day, share-token, public share |
| `/subscriptions` | ✅ | Plans, status, subscribe (Stripe checkout), cancel, portal, Stripe webhook |
| `/itinerary` (days/tasks) | ✅ | Separate route file exists |
| `/budget` + `/expenses` | ✅ | Route file exists |
| `/venues` + `/food` + `/transport` | ✅ | Route files exist |
| `/translator` | ✅ | Route file exists |
| `/social` | ✅ | Route file exists |
| `/ai-assistant` | ✅ | Route file exists |
| `/auth/*` | ❌ | **No auth route handler in backend.** Architecture doc lists 9 auth endpoints (`/auth/register`, `/auth/login`, `/auth/oauth/google`, etc.). Auth is handled by Supabase but the Fastify app exposes no auth proxy routes. Client would need to call Supabase SDK directly — acceptable, but this is an architecture deviation not documented. |
| `/payments/verify-iap` | ❌ | **No IAP verification endpoint.** Architecture specifies `POST /payments/verify-iap` for Apple/Google receipt verification. Not implemented. |
| `/notifications/register-token` | ❌ | Push token registration endpoint not implemented |
| `/weather` | ✅ | Weather service exists |

**Critical API contract mismatch:**

| Severity | Issue | Location |
|---|---|---|
| **CRITICAL** | **API URL prefix mismatch.** Frontend `.env.example` sets `EXPO_PUBLIC_API_URL=http://localhost:3000/v1`. Backend registers all routes at `/api/v1`. The correct URL should be `.../api/v1`. Any frontend client using the env var will get 404 on every request. | `.env.example`, `server/src/index.ts:94` |
| **CRITICAL** | **No `POST /payments/verify-iap` endpoint.** iOS and Android IAP purchases cannot be verified server-side. This blocks Voyager and Nomad Pro unlocks via mobile stores. | `server/src/routes/subscription.ts` |
| **MAJOR** | Architecture defines payment routes under `/payments/*` but implementation uses `/subscriptions/*`. While internally consistent, this deviates from the architecture spec and will confuse future developers. | `server/src/routes/subscription.ts` |
| **MAJOR** | `POST /auth/register`, `POST /auth/login`, etc. are not implemented in Fastify. If the frontend uses the Supabase JS SDK directly (bypassing the API), the architecture's JWT flow still works, but it should be documented as a deliberate decision. | No auth route file |

**Tagged to:** Backend Developer, Frontend Developer

---

### 5. Security

**Status: ⚠️ MOSTLY PASS — several issues need fixing**

**Positive findings:**
- JWT verification correctly fetches tier from DB (not JWT claims) — prevents tier spoofing after subscription changes.
- Token blacklisting on logout via Redis is implemented.
- Redis cache invalidation on tier change (`invalidateUserTierCache`) is correctly wired into both the auth middleware and Stripe webhook handlers.
- Free tier enforcement is server-side (not client-only): trip count limit, day limit, and generation limit all enforced in route handlers.
- Stripe webhook signature verification with raw body is correctly implemented.
- All API inputs validated with Zod before processing.
- No SQL injection risk (Drizzle ORM uses parameterised queries exclusively).
- No secrets in source code or `.env.example` (all values are placeholders).
- CORS origin from config (not hardcoded).
- Auth header checked for `Bearer ` prefix correctly.

| Severity | Issue | Location |
|---|---|---|
| **CRITICAL** | **Bull Board admin UI (`/admin/queues`) is exposed without authentication.** Any unauthenticated user can view job queues, retry failed jobs, and drain queues. This must be protected by at minimum HTTP Basic Auth or an internal network restriction. | `server/src/index.ts:57-63` |
| **MAJOR** | **Token blacklist uses only the last 16 chars of the JWT as the fingerprint** (`token.slice(-16)`). This is collision-prone — two different JWTs could share the same last 16 characters. Should use a proper hash (e.g., SHA-256 of full token) or store the full JTI claim. | `server/src/auth/middleware.ts:blacklistToken()` |
| **MAJOR** | **Google Maps API key is exposed in client `.env.example`** (`EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`). While noting that restriction by bundle ID is mentioned, the `.env.example` and comments should strongly emphasise this restriction is **mandatory**, not optional. An unrestricted key in a published app will be abused. | `.env.example` |
| **MINOR** | `config.ts` uses `optional()` for `TWITTER_BEARER_TOKEN`, `YOUTUBE_API_KEY`, `REDDIT_*` — these will silently be empty strings if not set, which will cause runtime errors in the social agent rather than fail-fast on startup. Consider validating social config at startup only if social agent is enabled. | `server/src/config/index.ts` |

**Tagged to:** Backend Developer, DevOps

---

### 6. Database Schema vs Architecture Doc

**Status: ✅ PASS with minor issues**

The Drizzle ORM schema in `schema.ts` is a faithful implementation of the architecture's SQL schema (§4 of `02-architecture.md`). All 13 tables are present: `users`, `subscriptions`, `trips`, `itinerary_days`, `venues`, `tasks`, `social_posts`, `crawl_jobs`, `budgets`, `expenses`, `phrasebook_entries`, `saved_phrases`, `theme_preferences`, `achievements`, `user_achievements`, `transport_passes`, `ai_conversations`, `ai_messages`. All relations are defined correctly.

| Severity | Issue | Location |
|---|---|---|
| **MAJOR** | **`social_posts.platformPostId` is not marked UNIQUE in the schema**, but the scoring worker's `onConflictDoUpdate` uses it as the conflict target. Without a unique index, this will throw a Drizzle/PostgreSQL runtime error on any upsert. The architecture SQL spec defines no unique constraint on this column either — the conflict target should be explicitly indexed as UNIQUE, or the upsert logic should use `platform + platformPostId` composite uniqueness. | `server/src/db/schema.ts:socialPosts`, `server/src/services/social-agent/scheduler.ts:scoringWorker` |
| **MAJOR** | **`db.$count()` used inside `.set()` in a Drizzle update.** In `trips.ts`, after creating a trip, the code does `db.update(users).set({ totalTrips: db.$count(schema.trips, ...) })`. Drizzle's `$count()` returns a subquery expression — this is valid in Drizzle's `select()` but its use inside `.set()` is non-standard and likely produces incorrect SQL. This will silently set `total_trips` to an unexpected value or throw at runtime. Should be calculated as a separate query and set as a number. | `server/src/routes/trips.ts:95-100` |
| **MINOR** | `trips` schema adds `coverPhotoUrl` field used in `HomeScreen.tsx` MOCK data and `Trip` type definition, but this column is **not in the Drizzle schema or the architecture SQL**. If queried, it will silently return `undefined`. Should be added to schema or removed from type. | `server/src/db/schema.ts:trips`, `src/types/index.ts:Trip` |
| **MINOR** | Architecture schema uses `BIGINT` for social post counts (`likes_count`, etc.) but schema.ts uses `decimal(20, 0)`. Functionally equivalent but semantically unusual and TypeScript types will be `string` not `number` when reading, requiring explicit conversion. | `server/src/db/schema.ts:socialPosts` |

**Tagged to:** Backend Developer

---

### 7. Social Intelligence Agent Architecture

**Status: ✅ PASS — architecture is solid**

The Social Intelligence Agent is one of the best-executed parts of the backend:

- Three-layer pipeline (crawl → extract → score → persist → push) is correctly implemented via BullMQ workers.
- `BaseCrawler` with `checkRobotsTxt()` respects robots.txt as required by the legal brief.
- `User-Agent: EasyTripBot/1.0 (+https://easytrip.app/bot)` is set as required.
- Trend score formula matches the architecture spec (reach + engagement + recency + velocity + sentiment).
- High-scoring posts (≥70) are published to Redis pub/sub channels for WebSocket delivery.
- `scheduleCrawls()` correctly merges `ALWAYS_CRAWL_DESTINATIONS` with active trip destinations from the DB.
- Extractor files for YouTube, Reddit, Twitter exist and are wired to the crawl worker.
- `extractSocialPost()` uses GPT-4o mini as specified, with Zod output validation.
- `startSocialAgent()` sets up the 30-minute interval correctly.

| Severity | Issue | Location |
|---|---|---|
| **MAJOR** | **`onConflictDoUpdate` target bug** (described in §6 above — repeated here for visibility). The scoring worker will throw at runtime when attempting to upsert a social post that already exists. | `server/src/services/social-agent/scheduler.ts:scoringWorker` |
| **MINOR** | The social agent workers (`crawlWorker`, `extractionWorker`, `scoringWorker`) are defined in `scheduler.ts` but `startSocialAgent()` is never called from `server/src/index.ts`. The main server starts without launching the social agent workers. This needs either a `startSocialAgent()` call in `index.ts` or a separate process entrypoint (the architecture recommends a separate ECS task — so this is likely intentional but needs documentation). | `server/src/index.ts`, `server/src/services/social-agent/scheduler.ts` |
| **MINOR** | Content snippet is truncated to 300 chars in the scoring worker but the architecture spec and GDPR section state max 50 words. These limits should align. | `server/src/services/social-agent/scheduler.ts:172` |

**Tagged to:** Backend Developer

---

### 8. Payment Flow (Stripe + IAP)

**Status: ❌ FAIL — IAP is missing**

**Stripe (web):**
- `createCheckoutSession()` correctly uses `payment` mode for Voyager lifetime and `subscription` mode for Pro.
- Webhook handler verifies Stripe signature using raw body — correctly implemented.
- `handleCheckoutComplete()` upserts subscription and updates user tier.
- `syncStripeSubscription()` handles renewals, cancellations, and downgrades.
- `handlePaymentFailed()` marks subscription as `past_due` without immediately revoking access (correct grace period behaviour).
- `cancelSubscription()` correctly uses `cancel_at_period_end: true`.

**Apple/Google IAP:**

| Severity | Issue | Location |
|---|---|---|
| **CRITICAL** | **No `POST /payments/verify-iap` endpoint exists in the backend.** Mobile IAP purchases (which are required for App Store compliance) have no server-side verification path. Voyager and Pro cannot be unlocked via iOS/Android stores. | `server/src/routes/subscription.ts` |
| **CRITICAL** | **`expo-in-app-purchases` is not in frontend `package.json`.** No StoreKit 2 / Google Play Billing integration exists in the frontend. | `package.json` |
| **MAJOR** | **Voyager price in `PLANS` constant is `price: 999` (£9.99 in pence), but the Project Brief specifies £4.99.** Either the constant uses the wrong unit (should be `499`) or the price is wrong. | `server/src/routes/subscription.ts:38` |
| **MINOR** | Apple Server Notifications webhook endpoint (`POST /webhooks/apple-iap`) is listed in the architecture but not implemented. Passive subscription renewals/cancellations from Apple will not be handled. | Missing |
| **MINOR** | Google Play Developer API notification webhook (`POST /webhooks/google-iap`) is also absent. | Missing |

**Tagged to:** Backend Developer, Frontend Developer

---

### 9. Offline-First Capability

**Status: ❌ FAIL — not implemented**

The architecture's offline-first strategy (WatermelonDB, MMKV, TanStack Query `offlineFirst`) is defined in the architecture document but not present in the actual codebase.

| Severity | Issue | Location |
|---|---|---|
| **CRITICAL** | **WatermelonDB is not in `package.json` and not used anywhere.** No offline database models (`Trip`, `ItineraryDay`, `Task`) exist. No WatermelonDB schema is defined. The entire offline-first layer is absent. | `package.json` |
| **CRITICAL** | **`@react-native-community/netinfo` is not in `package.json`.** The `useNetworkStatus` hook specified in the architecture cannot be implemented without it. | `package.json` |
| **MAJOR** | **TanStack Query `networkMode: 'offlineFirst'`** is not set in the `queryClient` configuration in `App.tsx`. Default mode is `'online'`, which will cause queries to fail silently when offline. | `App.tsx:10-16` |
| **MAJOR** | **No sync endpoint implementation.** The architecture defines `GET /sync/state` and `POST /sync/push` for reconnect sync. These endpoints are not in any route file. | Missing route file |
| **MAJOR** | The `Entitlements.hasOfflinePacks` flag is correctly defined in `userStore.ts`, but there is no download UI or offline pack storage anywhere in the frontend. | `src/stores/userStore.ts` |

**Tagged to:** Frontend Developer, Backend Developer

---

### 10. Missing Files or Incomplete Implementations

**Status: ❌ FAIL — significant gaps**

| Severity | Issue | Notes |
|---|---|---|
| **CRITICAL** | **No `SignInScreen` or `SignUpScreen` files exist.** Both are `PlaceholderScreen` in `RootNavigator`. Users cannot authenticate. | Tagged: Frontend Developer |
| **CRITICAL** | **No API client service file.** `ThemeProvider.tsx` dynamically imports `@services/apiClient` for server sync, but no `apiClient.ts` file exists in the project. This dynamic import will fail at runtime. | Tagged: Frontend Developer |
| **MAJOR** | **No `Suspense` boundary wrapping `React.lazy(OnboardingScreen)`.** `RootNavigator` uses `React.lazy` for `OnboardingScreen` but renders it without a `<Suspense fallback={...}>` wrapper. This will throw a runtime error when the lazy component suspends. | Tagged: Frontend Developer |
| **MAJOR** | **No navigation wiring between screens.** Quick Actions in `HomeScreen` do nothing (no `navigation.navigate()` calls). "View Itinerary →" button has no `onPress` handler connected to navigation. The app is visually complete but not navigable. | Tagged: Frontend Developer |
| **MAJOR** | **No font loading implementation.** The architecture specifies loading Google Fonts via `expo-font` at boot. `App.tsx` has no `useFonts()` or `expo-splash-screen` handling. All `font_display`, `font_body`, etc. theme tokens will render with system fallback fonts, breaking all 3 paid themes' typography. | Tagged: Frontend Developer |
| **MAJOR** | **CI/CD workflows reference `deploy-server.sh` and `build-mobile.sh`** which exist as scripts but the server deploy workflow (`deploy-server.yml`) has not been reviewed against actual ECS/ECR infrastructure configuration in `infra/terraform/`. Terraform files reference resources but `main.tf` should be reviewed for completeness before apply. | Tagged: DevOps |
| **MINOR** | **No `.gitignore` entry for `server/.env`** — only root `.gitignore` was visible. Verify `server/.env` (containing real secrets in dev) is properly git-ignored. | Tagged: DevOps |
| **MINOR** | **`ctaSection` in `TripCreatorScreen` has `borderTopWidth: 1` but no `borderTopColor` applied** (relies on default which is transparent on some platforms). Should add `{ borderTopColor: theme.border_default }` inline. | Tagged: Frontend Developer |

---

## Issues Summary

| Severity | Count |
|---|---|
| 🔴 CRITICAL | 12 |
| 🟠 MAJOR | 22 |
| 🟡 MINOR | 14 |
| **Total** | **48** |

---

## Revision Requests by Agent

### → Frontend Developer (Priority: P0 — blocks all user flows)

**CRITICAL (must fix before any testing):**
1. Add `react-native-mmkv`, `@react-native-community/netinfo`, `expo-in-app-purchases`, `socket.io-client` to `package.json`
2. Fix `ProfileScreen.tsx` import: `react-native-linear-gradient` → `expo-linear-gradient`
3. Create `SignInScreen.tsx` and `SignUpScreen.tsx` with Supabase Auth integration (Google OAuth, Apple OAuth, email/password)
4. Create `src/services/apiClient.ts` with authenticated Axios/fetch wrapper using MMKV token
5. Wire all 14 screens to real API endpoints via TanStack Query hooks; remove all `MOCK_*` constants
6. Implement drag-to-reorder in `DailyPlannerScreen` using `react-native-draggable-flatlist`
7. Wrap `React.lazy(OnboardingScreen)` in a `<Suspense>` boundary in `RootNavigator`
8. Implement `expo-in-app-purchases` StoreKit 2 / Google Play Billing flow in payment screen

**MAJOR:**
9. Add `useFonts()` in `App.tsx` and handle splash screen until fonts load
10. Fix API base URL in `.env.example`: `http://localhost:3000/api/v1` (not `/v1`)
11. Set TanStack Query `networkMode: 'offlineFirst'` in `queryClient` config
12. Wire navigation between all screens (`HomeScreen` Quick Actions, "View Itinerary" etc.)
13. Replace `task.category as any` with proper type assertion in `DailyPlannerScreen`
14. Add `borderTopColor: theme.border_default` to `ctaSection` in `TripCreatorScreen`

### → Backend Developer (Priority: P0)

**CRITICAL:**
1. Implement `POST /subscriptions/verify-iap` with Apple App Store Server API and Google Play Developer API verification
2. Fix `socialPosts.platformPostId` — add UNIQUE constraint to schema and migration, or change upsert to use `platform + platformPostId` composite
3. Secure `/admin/queues` — add Basic Auth or internal-only network rule

**MAJOR:**
4. Fix `db.$count()` misuse in `trips.ts` POST handler — calculate count as separate query, then set as integer
5. Add `POST /webhooks/apple-iap` and `POST /webhooks/google-iap` webhook handlers
6. Fix Voyager price in PLANS: `price: 999` should be `499` (£4.99 per Project Brief)
7. Add `coverPhotoUrl` column to `trips` Drizzle schema (or remove from `Trip` type)
8. Fix token blacklist: use `crypto.createHash('sha256').update(token).digest('hex')` instead of `token.slice(-16)`
9. Add `POST /sync/state` and `POST /sync/push` endpoints for offline sync
10. Add `POST /notifications/register-token` endpoint for push token registration
11. Document whether auth routes (`/auth/register` etc.) are intentionally handled by Supabase SDK directly (update architecture doc §5)
12. Restrict content snippet to 50 words max in scoring worker (architecture + GDPR requirement)
13. Ensure `startSocialAgent()` is called (either from `index.ts` or documented as separate ECS entrypoint)

### → DevOps / Infrastructure

1. Verify `server/.env` is in `.gitignore`
2. Restrict Google Maps API key in GCP console to iOS bundle ID + Android package before any beta release
3. Review Terraform `main.tf` for completeness before `terraform apply`
4. Bull Board admin route must be blocked at ALB level (security group or path rule) before production deploy

---

## What's Working Well

The foundations are genuinely strong. These don't need changes:

- **Theme system** — complete, correct, well-architected. All 4 themes are production-ready.
- **Database schema** — matches architecture spec almost exactly; well-indexed, correctly soft-deleted.
- **Auth middleware** — JWT verification, tier gating, blacklisting, and cache invalidation are all correct.
- **AI generation service** — Claude primary / GPT-4o fallback with Zod validation, retry logic, and timeout handling is clean and production-ready.
- **Stripe integration** — webhook handling, entitlement sync, and subscription state machine are correct.
- **Social Agent scoring** — formula is implemented faithfully with the correct weights.
- **Server architecture** — Fastify setup, Bull Board, Redis, rate limiting, CORS, Swagger all configured correctly.
- **Type system** — shared types (`src/types/index.ts`) are comprehensive and correctly model all domain entities.
- **Zustand stores** — `userStore`, `tripStore`, `subscriptionStore` are well-designed with correct selectors.
- **UI shells** — all 14 screens are visually implemented to spec with correct theme token usage.

---

## Recommended Build Sequence for Next Sprint

Given the gaps found, the recommended order to unblock the most value:

1. `apiClient.ts` → auth token injection (1 day)
2. `SignInScreen` / `SignUpScreen` with Supabase Auth (2 days)
3. Font loading in `App.tsx` (0.5 days)
4. Fix `package.json` missing deps + `ProfileScreen` import (0.5 days)
5. Wire `TripCreatorScreen` → `POST /trips` → `POST /trips/:id/generate` → poll status (2 days)
6. Wire `DailyPlannerScreen` with drag-to-reorder + real task API calls (2 days)
7. Fix backend blockers: IAP endpoint, `$count` bug, `platformPostId` unique constraint (1 day each)
8. Remaining screens → TanStack Query integration (3–4 days)

**Estimated time to shippable MVP: 12–15 developer-days of focused integration work.**

---

*QA Report complete. Build is not approved for beta distribution in current state.*
