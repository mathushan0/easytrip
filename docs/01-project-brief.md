# EasyTrip — Project Brief v1.0
**Produced by:** Briefing Analyst  
**Date:** 2026-04-21  
**Status:** Ready for Systems Architect handoff

---

## 1. Project Overview & Goals

**EasyTrip** is an AI-powered global travel companion app for iOS and Android. The user decides *where* to go — EasyTrip handles everything after that: generating a full day-by-day itinerary, routing transport, finding food, translating language, tracking budget, and running a 24/7 autonomous social media intelligence agent that surfaces trending spots from real influencers.

### Primary Goals
- Become the single app a traveller needs from landing to leaving
- Differentiate on: live social intelligence (no competitor does this in real time), editorial design quality, and AI-driven replanning
- Monetise via freemium → one-time purchase → recurring subscription funnel

### North Star Metric
**Trips created per active user per month** — proxy for genuine utility and retention

### Business Goals
- App Store / Play Store launch within ~14 weeks (per spec phases)
- Revenue from Day 1 via Voyager (one-time) and Nomad Pro (recurring)
- Establish social intelligence moat before copycats emerge

---

## 2. Target Audience

| Segment | Profile | Primary Need | Likely Tier |
|---|---|---|---|
| **Solo Backpackers** | 20–35, budget-conscious, adventurous | Fast itinerary, offline access, budget tracking | Voyager (one-time) |
| **Millennial Leisure Travellers** | 28–42, Instagram-aware, city breaks | Social picks, aesthetic UI, restaurant discovery | Nomad Pro |
| **Digital Nomads** | Location-independent workers | Multi-city trips, long-stay planning, reliability | Nomad Pro |
| **Luxury/Experience Travellers** | 35–55, quality-focused | Celeb picks, curated recommendations, low friction | Nomad Pro |
| **Casual Tourists** | First-time travellers, families | Simple wizard, emergency info, translation | Free → Voyager |
| **Business Travellers** (v2) | Frequent flyers, expense tracking | Fast planning, airport transfers, budget export | Voyager/Pro |

**Primary persona for v1:** Solo or couple leisure traveller, 25–40, smartphone-native, has used Google Trips or Wanderlog, frustrated by fragmentation across apps.

---

## 3. Core Features — Prioritised

### P0 — Must have in v1 (MVP cannot ship without these)

| Feature | Screen | Notes |
|---|---|---|
| Auth (Google/Apple + email) | SCR-01 | Supabase Auth |
| Trip creation wizard (dest, dates, budget, prefs) | SCR-03 | 3-step, generates itinerary |
| AI itinerary generation | SCR-04 | OpenAI/Claude API, full day-by-day |
| Daily planner with timed checkbox list | SCR-05 | Core differentiator |
| Drag-to-reorder tasks | SCR-05 | Must feel polished |
| Place detail (hours, how to get there, entry fee) | SCR-06 | Google Places API |
| Transport routing (multi-modal) | SCR-07 | Google Directions API |
| Food & dining screen with filters | SCR-08 | Google Places + dietary filters |
| Text translation | SCR-09 | Google Translate or LibreTranslate |
| Budget tracker (manual entry + currency) | SCR-11 | Open Exchange Rates |
| Settings (theme, currency, language, account) | SCR-12 | |
| Free tier enforcement (3-day/3-trip limit) | — | Paywall logic |
| Stripe payment + Voyager unlock | — | IAP (iOS/Android) + Stripe web |
| Home dashboard with active trip card | SCR-02 | |

### P1 — Should ship in v1 (strong differentiation, achievable)

| Feature | Screen | Tier |
|---|---|---|
| Aurora Dark + Warm Sand + Electric themes | SCR-12 | Voyager+ |
| Category colour customisation | SCR-12 | Voyager+ |
| Camera OCR translation | SCR-09 | Voyager+ |
| Phrasebook + audio pronunciation | SCR-09 | Voyager+ |
| Offline itinerary access | — | Voyager+ |
| Weather-aware suggestions | SCR-03/04 | Voyager+ |
| Push notifications | — | Voyager+ |
| Trip cost summary + estimates | SCR-04/11 | Voyager+ |
| Peak hour warnings | SCR-06/07 | Voyager+ |
| Hidden gems section | SCR-08 | Voyager+ |
| Share daily plan / social share cards | SCR-04 | Voyager+ |
| Travel achievement badges | SCR-13 | Voyager+ |
| Profile + countries visited map | SCR-13 | Voyager+ |
| Nomad Pro subscription (£2.99/mo) | — | Subscription |
| Conversational AI Trip Assistant | SCR-14 | Nomad Pro |

### P2 — Post-MVP / v2 (aspirational, defer unless time allows)

| Feature | Tier | Reason to Defer |
|---|---|---|
| 24/7 Social Intelligence Agent | Nomad Pro | Highest complexity, legal risk, API cost |
| Social Intelligence screen (SCR-10) | Nomad Pro | Depends on crawl infrastructure |
| Influencer/Celeb Picks on venue cards | Nomad Pro | Depends on social agent |
| Real-time disruption alerts via WebSocket | Nomad Pro | Infra complexity |
| Group planner sync | Nomad Pro | Realtime collab = significant scope |
| Multi-city trip planning | Nomad Pro | AI complexity leap |
| Offline maps download | Nomad Pro | Storage + licensing |
| Trip mood board | Nomad Pro | Low utility, high effort |
| Apple Watch / Wear OS | Nomad Pro | Platform complexity |
| Voice navigation ("What's next?") | — | Native OS integration |
| Referral programme | — | Growth feature, not core |
| Evening mode | — | AI complexity, defer |
| Trip journal / memory book | — | Post-trip, not MVP |
| YouTube vlog integration on home | — | API costs + UI complexity |
| Accessibility mode (step-free) | — | Routing API gaps globally |

---

## 4. Pricing Model Analysis

### Current Proposed Model
| Tier | Price | Type |
|---|---|---|
| Explorer | Free | Freemium |
| Voyager | £4.99 | One-time purchase (lifetime) |
| Nomad Pro | £2.99/mo or £24.99/yr | Subscription |

### Analysis

**Strengths:**
- £4.99 one-time is a low-friction conversion. Easy impulse buy for a traveller mid-planning.
- Subscription tier justified by real ongoing cost (AI API calls, crawler infrastructure, social agent).
- Annual plan (£24.99 = ~£2.08/mo) gives ~31% discount — good incentive.

**Concerns & Flags:**
1. **⚠️ AMBIGUITY: App Store / Play Store IAP vs direct Stripe** — Apple takes 30% (15% for small dev) on IAP. The £4.99 one-time must go through IAP on iOS (no choice for in-app purchases per Apple policy). Stripe can only be used for web checkout or where Apple/Google's rules permit. Plan: IAP for mobile, Stripe for web. Brief the architect on this.
2. **⚠️ LTV concern on Voyager:** A £4.99 one-time buyer gives zero recurring revenue. The model bets on Voyager → Pro upgrades. Need in-app conversion prompts at the right moments (e.g., when user hits social agent teaser).
3. **Free tier is generous enough** — 3 trips + 3-day limit is meaningful access. Users can validate before paying.
4. **Pricing may need geo-localisation** — £2.99/mo is expensive in some markets (India, SE Asia). Consider regional pricing via Apple/Google price tiers.
5. **Nomad Pro feature lock-in** — Social agent, AI assistant, and real-time alerts are genuinely subscription-worthy because they have real ongoing server costs. Good alignment of value and cost.

**Recommendation:** The model is sound. Focus conversion energy on Voyager upsell (low-friction, one-time), then nurture to Pro. Add contextual upsell prompts: "This place is trending — unlock Social Intelligence in Pro."

---

## 5. Technical Constraints & Architecture Considerations

### Frontend
- React Native + Expo — good choice, cross-platform, but **Expo limitations** apply: camera OCR (Expo Camera), custom native modules may need bare workflow or Expo Dev Client.
- WatermelonDB for offline storage is the right call — better than MMKV alone for relational offline data (itineraries, places).
- Three-theme ThemeProvider via CSS variables: straightforward with React Native StyleSheet + context, but test theme switching performance on Android (re-renders can be heavy).
- react-native-reanimated v3 required for drag-and-drop on Daily Planner — confirm compatibility with Expo SDK version.

### Backend
- Fastify is a good choice (faster than Express, TypeScript-native).
- PostgreSQL + Redis is proven for this scale.
- **⚠️ WebSocket with Socket.io on AWS Fargate** — stateless containers need sticky sessions or Redis pub/sub for socket routing. Plan this carefully.
- BullMQ for crawler jobs is appropriate — but the crawler fleet will be the most expensive compute component.

### Social Intelligence Agent
- **This is the hardest technical component by far.** Playwright crawling at scale on AWS ECS is expensive and brittle. Instagram, TikTok, and Twitter/X actively fight scraping.
- YouTube Data API and Reddit API are relatively stable.
- Twitter/X API v2: Basic tier is heavily rate-limited. Elevated/Pro access costs $100–$5000/month. Factor this into cost model.
- Instagram has no public API for this use case — scraping only, high breakage risk.
- TikTok has no public API for venue extraction — scraping only.
- **Recommendation:** Start social agent with Reddit + YouTube (API-based, stable). Add Twitter/X at additional cost. Treat Instagram/TikTok as v2 until API situation resolves.

### API Cost Estimates (Monthly, rough)
| API | Usage Pattern | Est. Monthly Cost |
|---|---|---|
| OpenAI/Claude (itinerary + assistant) | ~50k trips/mo | $500–$2,000 |
| Google Places API | ~200k lookups/mo | $300–$800 |
| Google Maps Directions | ~100k routes/mo | $200–$500 |
| Google Translate | ~1M chars/mo | $20 |
| OpenWeatherMap | Free tier likely sufficient | $0–$20 |
| Twitter/X API | Elevated access | $100–$500 |
| YouTube Data API | Quota-based, likely free tier | $0 |
| Unsplash | Free tier | $0 |
| Open Exchange Rates | ~$10/mo | $10 |
| **Total (conservative)** | | **~$1,100–$3,850/mo** |

At £2.99/mo Pro subscription: need ~550–1,300 active Pro subscribers just to cover API costs. This is achievable but the social agent infrastructure adds significant fixed cost on top.

### Platform Constraints
- **Apple App Store:** Human review required. Travel apps reviewed carefully. IAP for all paid features.
- **Google Play:** Faster review. Same IAP rules apply.
- **⚠️ Expo managed workflow limitations:** Push notifications (FCM/APNs) need Expo's push service or bare workflow. Camera OCR and offline maps may require bare workflow. Decide early.

---

## 6. MVP Definition — v1 vs v2

### v1 Ships (14-week target)
The core travel companion loop:
1. **Auth** → create account, sign in
2. **Trip creation wizard** → destination, dates, budget, preferences
3. **AI itinerary generation** → full day-by-day plan
4. **Daily planner** → timed checklist, drag-to-reorder, custom tasks, progress tracking
5. **Place detail** → photos, hours, transport, entry fee
6. **Transport screen** → multi-modal routing, travel pass info
7. **Food & dining** → filtered restaurant discovery, local dishes
8. **Text translation** → with phrasebook
9. **Budget tracker** → manual expenses, currency conversion, category breakdown
10. **All 3 themes** → theme switching (Voyager+)
11. **Offline itinerary** → cached JSON, readable without network
12. **Push notifications** → trip reminders
13. **Profile + achievements** → gamification layer
14. **Stripe + IAP** → Voyager one-time + Nomad Pro subscription
15. **Conversational AI Assistant** → basic context-aware chat (Pro)
16. **Camera OCR translation** → Voyager+
17. **Weather-aware suggestions** → Voyager+

### v1 Explicitly Deferred (→ v2)
See Section 11.

### v1 Scope Decision Rationale
The 24/7 Social Intelligence Agent is the biggest cut from v1. It's the most compelling feature but also:
- Highest build complexity (crawlers, extraction, scoring, WebSocket delivery)
- Highest legal risk (scraping, GDPR)
- Highest ongoing cost
- Requires real data to be valuable — cold start problem on launch

**Recommended approach:** Build the Social Agent backend in parallel with v1 app. Soft-launch Social Intelligence in Pro as a "beta" feature 4–6 weeks post-launch once the data pipeline is stable. This lets v1 ship on time without blocking the most expensive feature.

---

## 7. Timeline Estimate

*Assumes AI agents building, but with human oversight and QA. Spec phases are broadly correct but optimistic on Polish and Launch.*

| Phase | Weeks | Deliverables |
|---|---|---|
| Phase 1: Core | 1–3 | Auth, trip wizard, AI generation, daily planner |
| Phase 2: Destinations | 4–6 | Place detail, transport, food, maps, budget tracker |
| Phase 3: Intelligence | 7–9 | Social agent (parallel track), AI assistant, weather |
| Phase 4: Polish | 10–11 | All 3 themes, translator (OCR), offline, push notifs |
| Phase 5: Monetisation | 12 | Stripe, IAP, paywall logic, subscription mgmt |
| Phase 6: Launch | 13–14 | QA, TestFlight beta, App Store/Play submission |
| **Buffer** | +2 | App review delays, bug fixes, resubmission |

**Realistic launch: 16 weeks** (14 weeks build + 2 weeks review/fix buffer)

**⚠️ Risk:** Apple review alone can take 1–7 days. Rejections for payment/subscription handling are common. Build in buffer.

**Social Agent parallel track:** Start crawler infrastructure in Week 7. Target soft-launch as Pro beta feature at Week 18 (4 weeks post app launch).

---

## 8. Revenue Model & Monetisation Strategy

### Revenue Streams
1. **Voyager £4.99 one-time** — High volume, low friction. Target: casual and first-time travellers.
2. **Nomad Pro £2.99/mo / £24.99/yr** — Recurring revenue. Target: frequent travellers, digital nomads.
3. **Future: Affiliate commissions** — Flight search (Skyscanner), hotel booking (Booking.com/Agoda), activity booking (GetYourGuide, Viator). This is v2 but could be significant.
4. **Future: White-label API** — Tour operators. v2+ enterprise play.

### Conversion Funnel
```
Free → Voyager: Show paywalls naturally at trip #4, day #4, and on theme/OCR features
Voyager → Pro: Contextual upsells when user encounters Social Intelligence previews
Free → Pro: Direct pitch in onboarding for frequent travellers
```

### Contextual Upsell Triggers (in-app)
- Hitting 3-trip limit → "Going somewhere new? Unlock unlimited trips"
- Viewing a venue → "🔥 This place is trending. See who's been here" (teaser)
- In translator → "Tap to translate with camera" (OCR paywall)
- On transport screen → "Download offline maps for this trip" (Pro paywall)
- In AI assistant (SCR-14) → Pro gate with preview of what it can do

### Referral Programme (v1.5 — quick win post-launch)
Share → both get 3 months Pro free. Low cost (Pro margin allows it), high virality potential.

### Unit Economics (rough)
- At £4.99 Voyager: 100% margin minus IAP fee (~85p cut = ~£4.14 net)
- At £2.99/mo Pro: minus IAP fee (~50p) = ~£2.49 net. Minus API costs per user (~£0.50–£1.50 depending on usage) = ~£1–£2 net per user per month
- **Need ~2,000 active Pro subscribers to cover £2,000/mo API + infra costs**

---

## 9. Competitive Analysis

| Competitor | Strengths | Weaknesses | EasyTrip Edge |
|---|---|---|---|
| **TripIt** | Import from emails, business focus, polished | No AI generation, no social intel, dated UX | AI itinerary + social agent + modern design |
| **Wanderlog** | Free, collaborative, Google Maps integration | Basic AI, no social intelligence, busy UI | Better AI, social agent, cleaner UX, offline |
| **Google Trips (discontinued/Maps)** | Google data quality, deep integration | Not a standalone app, no AI planning | Dedicated app with AI + social intel |
| **Tripadvisor** | Massive review database, booking integration | No itinerary planning, ad-heavy, old UX | Planning-first, AI-first, no ads |
| **Wanderlog** | Good for couples/groups | Limited AI, no social agent | Social intelligence, AI replanning |
| **Sygic Travel** | Offline maps, city guides | No AI, no social intel, dry UX | AI + social + editorial design |

### Differentiation Summary
No competitor combines:
1. AI-generated day-by-day itinerary with timed checklist
2. 24/7 live social media intelligence (influencer picks, trend scores)
3. Editorial-quality design with multiple themes
4. Adaptive AI replanning mid-trip

The social intelligence agent is the genuine moat — but only once it's live and has real data. Until then, EasyTrip competes on UX quality and AI generation quality.

---

## 10. Risks & Assumptions

### High Risk
| Risk | Impact | Mitigation |
|---|---|---|
| **Social scraping legality** | Legal action, app removal | Use official APIs first; display attribution; 50-word quote limit; GDPR review pre-launch; consult IP lawyer |
| **Instagram/TikTok API access** | Social agent incomplete | Start with Reddit/YouTube; treat IG/TikTok as v2 |
| **Twitter/X API cost escalation** | $500–$5000/mo | Budget cap; tier access; cache aggressively |
| **Apple IAP rejection** | Launch delay | Follow Apple HIG exactly; no mention of alternative payments |
| **AI API cost overrun** | Unprofitable at scale | Per-user rate limiting; cache itineraries; cheaper models for non-critical tasks |
| **Crawler breakage** | Social agent goes dark | Redundant sources; monitoring; graceful degradation |

### Medium Risk
| Risk | Impact | Mitigation |
|---|---|---|
| **Google Places API cost at scale** | $800+/mo | Aggressive caching (Redis); avoid redundant lookups |
| **App review rejection** | 1–4 week delay | Submit early; follow guidelines; have contingency |
| **Cold start on social agent** | No data = no value | Seed with Reddit/YouTube data before launch |
| **Offline data storage size** | UX complaints | Compress itinerary JSON; lazy-load photos |
| **Multi-timezone trip planning bugs** | Bad itineraries | Thorough timezone handling in AI prompts |

### Assumptions Made (to be validated)
1. Users will pay £4.99 one-time before seeing the social agent — assumed based on core itinerary value
2. AI itinerary quality will be high enough on first generation — requires prompt engineering investment
3. Google Places has sufficient data globally (195+ countries) — largely true but gaps in rural/developing regions
4. Expo SDK supports all required native features (OCR, push, offline) — validate before committing
5. 14-week timeline is achievable with AI agent build pipeline — optimistic, 16 weeks more realistic

---

## 11. Out of Scope for v1 (Explicit)

The following are **explicitly not in v1** regardless of what the spec mentions:

- ❌ 24/7 Social Intelligence Agent (full production) — v1.5 soft beta, v2 full
- ❌ Social Intelligence screen (SCR-10) — blocked by above
- ❌ Influencer/Celeb Picks on venue cards — blocked by above
- ❌ Real-time disruption alerts (WebSocket to client) — infra complexity
- ❌ Group planner sync / collaborative trips — realtime collab scope
- ❌ Multi-city trip planning — AI complexity
- ❌ Offline maps download — licensing + storage
- ❌ Trip mood board — low priority
- ❌ Apple Watch / Wear OS companion — separate platform
- ❌ Voice navigation ("What's next?") — native OS integration complexity
- ❌ Referral programme — post-launch growth feature
- ❌ Evening mode — AI feature, defer
- ❌ Trip journal / memory book — post-trip UX, not core
- ❌ YouTube vlog feed on home screen — API cost + UI
- ❌ Accessibility mode (step-free routing) — routing API gaps
- ❌ Flight search (Skyscanner affiliate) — v2 revenue stream
- ❌ Hotel booking integration — v2 revenue stream
- ❌ Web app — v2
- ❌ White-label API — v2 enterprise
- ❌ Visa & entry requirement checker — third-party data source TBD
- ❌ Carbon footprint tracker — low priority
- ❌ EasyTrip for Business — v2+ segment
- ❌ Travel safety intelligence (FCO/State Dept alerts) — additional API + legal review
- ❌ Ticket price alerts — notification infra + travel API
- ❌ Community tips layer — UGC moderation complexity
- ❌ CSV budget export — nice to have, minor

---

## 12. Handoff Notes for Systems Architect

### Immediate Decisions Required

1. **Expo managed vs bare workflow** — OCR camera, offline maps (v2), and some notification edge cases may require bare. Decide early to avoid painful migration mid-build.

2. **IAP strategy** — Voyager (£4.99 one-time) must use Apple/Google IAP on mobile. Stripe for web. The architect must design a unified entitlement system that reconciles purchases from both channels per user account.

3. **Social Agent as separate service** — The crawler/extraction pipeline should be a standalone microservice, not coupled to the main API. It writes to the same PostgreSQL but runs on its own ECS tasks. This lets it be built/deployed independently.

4. **WebSocket architecture** — If real-time Social Agent updates are in scope (v1.5+), Fastify with socket.io on Fargate needs Redis pub/sub (not in-memory) for horizontal scaling. Design this from day 1 even if v1 doesn't use it.

5. **AI prompt architecture** — Itinerary generation is the core product. The architect should plan for:
   - Prompt versioning (prompts will be iterated)
   - Structured JSON output from LLM (validated with Zod)
   - Fallback model (if Claude is down, fall back to GPT-4o and vice versa)
   - Caching generated itineraries (same destination + dates + prefs = same result)

6. **Offline data model** — Define what gets cached for offline: itinerary JSON, place details, translated phrasebook. Do not cache maps in v1. Use WatermelonDB schema designed for this from day 1.

7. **Multi-currency handling** — Store all monetary values in the trip's base currency. Convert at display time using Open Exchange Rates. Never store converted values.

8. **Theme system** — ThemeProvider must be implemented at app root level before any UI work begins. All colour values via theme tokens — no hardcoded hex in components.

9. **Rate limiting on AI endpoints** — Free users: 3 trips total, 3-day max. Voyager: unlimited but rate-limit concurrent generation (1 at a time). Pro: priority queue. Enforce server-side, not just client-side.

10. **GDPR / data residency** — If launching in EU, Supabase region must be EU. Social Intelligence data (usernames, follower counts) needs GDPR review. Legal consultation recommended before EU launch.

### Key Integration Points
- `Supabase Auth` → JWT passed to Fastify → all routes authenticated
- `Stripe + IAP` → webhook to backend → update `user.tier` in PostgreSQL → client re-fetches entitlements
- `BullMQ` → crawler jobs → Claude extraction → PostgreSQL social_posts table → WebSocket to clients (v1.5)
- `Google Places` → cached in Redis (TTL 24h) → served to client via Fastify

### Recommended First Build Sprint
1. Supabase Auth + user schema
2. ThemeProvider + Aurora Dark theme (other themes follow the pattern)
3. Trip creation wizard → AI generation endpoint (Claude/GPT) → itinerary JSON model
4. Daily planner UI (this is the hero screen — get it right early)

---

## Ambiguities & Open Questions

1. **⚠️ Which AI model is primary?** Spec says "OpenAI / Claude API" — pick one as primary, one as fallback. Affects prompt design.
2. **⚠️ iOS only or iOS + Android simultaneously?** Spec implies both but dual-platform submission doubles QA effort. Consider iOS first?
3. **⚠️ Target markets for launch?** UK only, or global Day 1? Affects currency defaults, legal review, regional pricing.
4. **⚠️ User-generated content?** Spec mentions community tips (v2) but is there any UGC in v1? If not, confirm.
5. **⚠️ Phrasebook content source?** Where do phrasebook entries come from? Pre-seeded database? AI-generated? Curated CSV? Not specified.
6. **⚠️ "Live" opening hours** — Google Places API has opening hours but they're not truly real-time (no live changes). Don't promise "live" in marketing copy without caveat.
7. **⚠️ Trademark registration timeline** — Spec mentions trademark EasyTrip in UK/EU/US. This takes months and must start immediately (not at launch).
8. **⚠️ Photography** — Spec mentions "high-quality photography" (Voyager). Unsplash is free but requires attribution. Google Places photos have their own TOS. Clarify licensing strategy.
9. **⚠️ "195+ countries"** — AI itinerary quality will vary massively by destination. Manage user expectations. Consider a confidence indicator ("limited data available for this destination").
10. **⚠️ Travel pass info** — Where does this data come from? (e.g., Oyster card, Paris Navigo, NYC MetroCard). No API for this exists universally — likely needs a curated database.

---

*Brief complete. Ready for Systems Architect review.*
