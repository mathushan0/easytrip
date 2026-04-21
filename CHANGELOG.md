# Changelog

All notable changes to EasyTrip are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).  
EasyTrip uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] — 2026-04-21

Initial public release. Available on the App Store and Google Play.

### Added

#### Core travel features
- **Trip creation wizard** — 3-step flow: destination, dates/budget, preferences (pace, dietary, interests)
- **AI itinerary generation** — Full day-by-day plans powered by Claude 3.5 Sonnet with GPT-4o fallback; structured JSON output validated with Zod; automatic retry and model fallback
- **Daily planner** — Timed checklist with drag-to-reorder, task completion tracking, and progress bar
- **Place detail** — Venue photos, opening hours, entry fees, peak hour warnings, and Google rating
- **Transport screen** — Multi-modal route calculation (walk, metro, bus, taxi, bike) with Google Directions API
- **Travel pass info** — Curated pass data for 50+ major transit systems (Suica, Navigo, Oyster, MetroCard, etc.)
- **Food & dining** — Restaurant discovery with cuisine, dietary, and budget filters; local dishes per destination; best food areas
- **Budget tracker** — Manual expense logging, automatic currency conversion via Open Exchange Rates, per-category breakdown
- **Text translation** — Powered by Google Cloud Translation with LibreTranslate fallback
- **Phrasebook** — ~200 phrases per language across 40 travel languages; 7 categories

#### Voyager (£4.99 one-time)
- Unlimited trips and days (free tier: 3 trips, 3 days max)
- **Camera OCR translation** — Translate signs and menus by pointing the camera; Google Cloud Vision
- **Phrasebook audio** — Native-voice pronunciation for all phrases via Google Cloud TTS; cached to S3
- **Offline itinerary** — Full trip cached to device; WatermelonDB; sync on reconnect
- **Trip sharing** — Shareable public link with full itinerary view
- **Single-day regeneration** — Regenerate one day without affecting the rest
- **Custom tasks** — Add your own activities to any day
- **Aurora Dark, Warm Sand, Electric themes** — Three premium themes with unique typography
- **Category colour customisation** — Override category colours per theme
- **Weather-aware itinerary** — Forecast fetched at generation time; suggestions adapted to conditions
- **Offline language packs** — Download phrasebook + audio for a language (~5–10MB per language)
- **Trip cost summary** — Estimated total cost included at generation time

#### Nomad Pro (£2.99/mo or £24.99/yr)
- **AI Trip Assistant** — Conversational Claude-powered assistant with full trip context; conversation history per trip
- **Social Intelligence feed (Beta)** — Live social media posts from YouTube, Reddit, and Twitter/X; Trend Score (0–100); filter by category; sort by score or recency
- **Trending destinations** — Weekly trending city rankings by aggregate social signal
- **Celebrity/influencer picks** — Filtered view of posts from verified creators
- **Social proof on venue cards** — Trend badges on venues with detected social activity

#### Themes
- **Light/Dark** (free) — Clean minimal UI, follows system dark mode setting
- **Aurora Dark** (Voyager+) — Deep space dark with teal/purple gradients; Outfit + JetBrains Mono
- **Warm Sand** (Voyager+) — Warm terracotta, olive, dusty blue on off-white; Cormorant Garamond + Figtree
- **Electric** (Voyager+) — High-contrast dark with neon lime/pink; Barlow Condensed + IBM Plex Mono

#### Infrastructure
- **Server** — Fastify v4 on Node.js 20, deployed on AWS ECS/Fargate (eu-west-1)
- **Database** — PostgreSQL 16 on AWS RDS (Multi-AZ), Drizzle ORM
- **Cache/Queue** — Redis 7 on AWS ElastiCache, BullMQ for itinerary generation jobs
- **Auth** — Supabase Auth with Google, Apple, and email/password
- **Payments** — Stripe (web), Apple IAP (iOS), Google IAP (Android); unified entitlement system
- **WebSocket** — Socket.io with Redis adapter for real-time updates (generation complete, social feed)
- **Social Agent** — Separate ECS service; BullMQ crawl workers for YouTube, Reddit, Twitter/X; GPT-4o mini extraction; Trend Score formula
- **CDN** — AWS CloudFront for photos and phrase audio
- **CI/CD** — GitHub Actions + EAS Build; blue/green deployment with automatic rollback
- **Monitoring** — Sentry (errors), PostHog (analytics), CloudWatch (infra)

#### Destination coverage
- AI itinerary generation for 195+ countries
- Destination confidence indicator (`high` / `medium` / `low`) — low-confidence destinations show an honest advisory banner
- Transport pass data for 50 major transit systems
- Local dishes database for all supported countries

---

## Known Limitations — v1.0

- **Social Intelligence** is in Beta. Coverage is strongest for major global cities (London, Tokyo, Paris, New York, Bangkok, etc.). Less common destinations may have sparse data.
- **Opening hours** are sourced from Google Places and updated periodically — not real-time. Always verify on arrival.
- **Live transport disruptions** are not yet available (planned for v1.5).
- **Group trip sync** (collaborative editing) is not available in v1.0.
- **Offline maps** are not available — only itinerary data and venue details are cached offline.
- **Multi-city trips** (e.g. Tokyo → Kyoto → Osaka as one trip) require separate trips in v1.0.
- Instagram and TikTok are not yet included in Social Intelligence due to API availability constraints.

---

## Upcoming (v1.5 — estimated 6 weeks post-launch)

- Real-time transport disruption alerts (WebSocket)
- Social Intelligence expanded to more sources
- CSV budget export
- Referral programme (both users get 3 months Pro free)

---

*Release date: 21 April 2026*  
*Build: 1.0.0 (iOS 1, Android 1)*
