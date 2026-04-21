# EasyTrip — Master Development Specification v2.0

## Executive Summary
EasyTrip is a worldwide, AI-powered travel planning app. The user already knows where they want to go — EasyTrip does everything after that decision. It generates a full day-by-day itinerary, routes transport, finds food, translates languages, tracks budget, and monitors social media 24/7 to surface trending recommendations from real influencers and travellers. Works for every country on earth. One-time purchase app with optional subscription for advanced features.

## Core Premise — The One Thing No Other App Does
EasyTrip combines: a timed daily checkbox planner + AI-generated itineraries + live influencer/celebrity social media intelligence + 3 switchable design themes (Pro) + a 24/7 autonomous research agent that continuously discovers new restaurants, venues, and travel tips from YouTube, TikTok, Twitter/X, Instagram, Facebook, Reddit, and travel blogs — updating the app in real time.

## IP Notice
Trademark "EasyTrip" in UK, EU, US before launch. Register app icon as design right. The three-theme switching system, 24/7 Social Intelligence Agent, colour-coded category UI model, and adaptive AI re-planner are all original.

## Three Themes
1. **Aurora Dark** (default for paid) — Deep space + northern lights. Glass morphism cards 7% opacity. Teal + purple gradients. Font: Outfit 900 + JetBrains Mono. Categories: Teal (food), Purple (landmarks), Gold (transport), Red (alerts).
2. **Warm Sand** — Editorial travel journal. Cream backgrounds + paper grain. Earth tones. Font: Cormorant Garamond italic + Figtree + Azeret Mono. Categories: Terracotta (food), Olive (landmarks), Dusty blue (transport), Saffron (budget).
3. **Electric** — Futuristic neon. Near-black + scanline texture + grid overlay. Neon lime, cyan, hot pink. Font: Barlow Condensed 900 + IBM Plex Mono. Categories: Neon lime (primary), Cyan (transport), Hot pink (food), Neon orange (budget).

Theme implementation: CSS variable system via ThemeProvider context. Store selected theme in user profile DB. Free users get basic dark/light toggle. Paid users get all 3 full themes.

### Category Colour Customisation
Within each theme, paid users can customise colours for each category (Food, Landmarks, Transport, Culture, Budget). Stored per-user, persists across sessions. Settings → Appearance → Category Colours.

## 24/7 Social Intelligence Agent

### Input Sources (monitored continuously)
- YouTube — Travel vlogs, reviews, destination guides, food tours
- TikTok — Trending restaurants, hidden gems, viral spots
- Twitter/X — Celeb dining posts, influencer trip threads
- Instagram — Location tags, Reels, story highlights
- Facebook — Travel groups, page reviews, local recommendations
- Reddit — r/travel, r/solotravel, city subreddits
- Travel Blogs — Nomadic Matt, The Points Guy, Lonely Planet
- Review Sites — Yelp, Tripadvisor, Google Maps, Eater, Timeout

### What the Agent Extracts
1. **Influencer Picks** — Named influencer + post + restaurant/location + follower count + engagement score
2. **Pricing Intelligence** — Real prices from traveller reports, not Google estimates
3. **Travel Tips** — Transport hacks, pass recommendations, local advice
4. **Hidden Gems** — Viral places not on mainstream apps (detected by engagement spikes)
5. **Warnings & Closures** — Tourist traps, reported closures, scams, safety notices
6. **Trend Score** — Proprietary 0-100 score from: follower count × engagement rate × recency × mentions × sentiment

### Technical Architecture
- **Crawl Layer** — Playwright + Puppeteer (JS-heavy), Scrapy (static), official APIs. Runs every 30 min per platform.
- **AI Extraction Layer** — LLM (Claude/GPT) structured extraction: location, city, country, sentiment, prices, transport tips. JSON output. High confidence only.
- **Scoring & Ranking** — Trend Score formula. Rising scores surface in "Trending Now" and "Celeb Picks".
- **Live App Update** — WebSocket for active users. Background refresh for offline. Venue cards update within minutes of major influencer post.

### What Users See (Pro)
On each venue card: social proof section with post thumbnail + creator name + follower count + quoted review (max 50 words) + post date + "View Post" link.

### Legal
- Only display publicly available posts with attribution
- Quote max 50 words, link to original
- Use official APIs where available (YouTube Data API, Twitter/X API v2, Reddit API)
- Respect robots.txt and rate limits for platforms without APIs
- GDPR review before EU launch
- Store only public username and follower count

## Pricing Tiers

### Explorer (FREE)
- 3-day trip limit
- AI itinerary generation (3 trips)
- Basic theme (light/dark toggle)
- Text translation
- Destination search (195+ countries)
- Timed checkbox planner
- Travel time between stops
- Restaurant recommendations
- Local must-eat dishes
- Emergency info panel

### Voyager (£4.99 one-time)
- Unlimited trips, any length
- Regenerate/tweak individual days
- All 3 premium themes
- Category colour customisation
- Camera OCR translation
- Phrasebook + audio pronunciation
- Multi-modal transport routing
- Taxi/Uber estimates
- Travel pass info
- Peak hour warnings
- Entry fees + booking links
- Hidden gems
- Dietary filters
- Reservation links
- Price per person estimates
- Trip cost tracker
- Offline itinerary access
- Weather-aware suggestions
- Push notifications
- Share daily plan
- Social share cards
- Travel achievement badges
- High-quality photography
- Saved phrases library
- Drag-to-reorder tasks
- Add custom tasks
- Airport transfers
- Best food areas/markets

### Nomad Pro (£2.99/month or £24.99/year)
Everything in Voyager PLUS:
- 24/7 Social Intelligence Agent
- Trending Now section
- Influencer & Celeb Picks
- Real-time disruption alerts
- Smart AI re-planning
- Conversational AI trip assistant
- Adaptive re-planning
- Personalised trip history
- Priority AI generation
- Group planner sync
- Multi-city trip planning
- Offline maps download
- Offline language packs
- Trip mood board
- Apple Watch / Wear OS
- Social Intelligence screen

## 14 Screens

### SCR-01: Onboarding
Logo animation, welcome copy, "Get Started" CTA, "Sign In" ghost button, social sign-in (Google, Apple), 3-bullet value prop.

### SCR-02: Home / Dashboard
Greeting + active trip card with day counter, quick action buttons (+ New Trip, Translate, Transport), recent trips, trending destinations (Pro), navigation bar.

### SCR-03: Trip Creator
3-step wizard: Step 1 = Destination + Dates + Duration. Step 2 = Budget toggle + custom £ input. Step 3 = Trip type + travel preferences. Generate button with loading animation. Show estimated cost before generating.

### SCR-04: Itinerary Overview
Day tab strip (horizontal scroll), map/list view toggle, trip cost summary, each day shows # attractions/meals/transport legs, share/export buttons, edit trip settings.

### SCR-05: Daily Planner
Day header with date + progress %, progress bar, scrollable timed checkbox list, active task highlighted, drag handle on each task, "Add Custom Task" FAB, day summary footer.

### SCR-06: Place Detail
Photo carousel, name/rating/category chip, opening hours (live), peak hours bar chart, how to get there (multi-modal), entry fee + book button, Influencer Picks (Pro), Add to Day button.

### SCR-07: Transport
From/To inputs, map with route overlay, option cards (metro/taxi/walk/bike) with time + cost, travel pass recommendation, real-time disruption alert (Pro), save route button.

### SCR-08: Food & Dining
Filter bar (cuisine/budget/dietary/distance), restaurant cards with photo/rating/price/cuisine, "Celeb Pick" badge (Pro), local dishes section, best food area map.

### SCR-09: Translator
Language pair selector, text input, translation output, audio playback, camera button (OCR), phrasebook tab, saved phrases tab, offline pack download (Pro), romanisation toggle.

### SCR-10: Social Intelligence (PRO ONLY)
Live feed of influencer/celeb posts about current destination. Filter: food/landmarks/transport/general. Sorted by: Trend Score, Recency, Follower count.

### SCR-11: Budget Tracker
Total budget, spent vs remaining, visual progress bar, category breakdown, log expense button, currency auto-conversion, CSV export.

### SCR-12: Settings
Theme switcher, category colour customisation, language, currency, notifications, offline data, account, subscription management, about/legal.

### SCR-13: Profile
Countries visited map (interactive), total trips/days/tasks stats, past trips list, achievements/badges, social share card generator, edit profile.

### SCR-14: AI Trip Assistant (PRO ONLY)
Chat interface with context-aware trip AI. Knows current trip, itinerary position, budget remaining. Can add tasks, reorder day, find alternatives. History stored per trip.

## Tech Stack

### Frontend (Mobile)
- React Native + Expo (iOS + Android)
- TypeScript strict mode
- Zustand (global state)
- React Query (server state, caching)
- react-native-maps (Google Maps SDK)
- react-native-reanimated (animations, drag)
- ThemeProvider context
- WatermelonDB or MMKV (offline storage)
- Expo Camera (OCR)
- Firebase FCM (push notifications)
- Sentry (crash reporting)
- PostHog (analytics, feature flags)

### Backend
- Node.js + Fastify (REST API)
- PostgreSQL (primary DB)
- Redis (caching, sessions, rate limiting)
- Supabase Auth (authentication + JWT)
- AWS ECS / Fargate (containerised)
- AWS S3 (media storage)
- WebSocket / Socket.io (live Social Agent updates)
- BullMQ + Redis (job queuing for crawlers)
- Stripe (payments)
- Resend (transactional email)

### Social Intelligence Agent
- Playwright + Puppeteer (JS-heavy crawling)
- Scrapy (static crawling)
- Claude/GPT API (structured extraction)
- BullMQ (scheduled jobs, every 30 min)
- PostgreSQL (extracted data storage)

### APIs
- Google Places API (venues, photos, reviews, opening hours)
- Google Maps Directions API (routing)
- OpenAI / Claude API (itinerary generation, trip assistant)
- Google Translate API or LibreTranslate
- YouTube Data API v3
- Twitter/X API v2
- Reddit API
- Unsplash API (photography)
- Open Exchange Rates API (currency)
- OpenWeatherMap API (weather)
- Stripe API (payments)

## Design Language
- **Refined editorial dark** aesthetic
- Fonts: Syne (display, 800 weight), Instrument Serif (accent italic), DM Sans (body), JetBrains Mono (code/labels)
- Background: #090b12
- Surface: #0f1219
- Brand palette: Lime #b8ff57, Cyan #38e8d8, Coral #ff5f5f, Gold #f5c842, Violet #9b6fff
- Grain texture overlay
- Glass morphism cards
- Animated aurora orbs
- Timeline with gradient colour dots
- Card hover effects (translate Y + border glow)

## Development Phases
1. Phase 1 (Weeks 1-3): Core — Auth, trip creation, itinerary generation, daily planner
2. Phase 2 (Weeks 4-6): Destinations — Place details, transport, food, maps
3. Phase 3 (Weeks 7-9): Intelligence — Social agent, crawlers, extraction, scoring
4. Phase 4 (Weeks 10-11): Polish — Themes, translator, budget tracker, offline
5. Phase 5 (Week 12): Monetisation — Stripe, IAP, subscription management
6. Phase 6 (Weeks 13-14): Launch — QA, TestFlight, App Store submission

## Additional Recommendations (v1)
- YouTube vlog integration on home screen
- Live weather re-planning notifications
- Referral programme (share → both get 3 months Pro free)
- Evening mode (after 6pm shows bars, dinner, late-night transport)
- Trip journal / memory book (auto-generated end-of-trip)
- Accessibility mode (wheelchair, step-free routes)
- Voice navigation (hands-free "What's next?")
- Live currency conversion on all prices
- Travel safety intelligence (FCO/State Dept alerts)
- Ticket price alerts
- Community tips layer

## v2 Roadmap (post-launch)
- Flight search (Skyscanner affiliate)
- Hotel booking (Booking.com affiliate)
- Apple Watch companion
- Group trip collaboration with real-time sync
- Web app for desktop planning
- White-label API for tour operators
- Visa & entry requirement checker
- Carbon footprint tracker
- EasyTrip for Business
