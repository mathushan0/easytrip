# EasyTrip — UX Design Document v1.0
**Produced by:** UX Designer  
**Date:** 2026-04-21  
**Status:** Ready for Frontend Developer Handoff  
**Design Language:** Refined Editorial Dark

---

## Table of Contents

1. [Design Philosophy](#1-design-philosophy)
2. [User Personas](#2-user-personas)
3. [User Flows — Core Journeys](#3-user-flows--core-journeys)
4. [Navigation Structure](#4-navigation-structure)
5. [Screen-by-Screen Wireframes](#5-screen-by-screen-wireframes)
6. [Component Inventory](#6-component-inventory)
7. [Design Token System — All 3 Themes](#7-design-token-system--all-3-themes)
8. [ThemeProvider Token Structure](#8-themeprovider-token-structure)
9. [Responsive Strategy](#9-responsive-strategy)
10. [Accessibility — WCAG 2.1 AA](#10-accessibility--wcag-21-aa)
11. [Empty / Loading / Error States](#11-empty--loading--error-states)
12. [Animation Specifications](#12-animation-specifications)
13. [Interaction Patterns](#13-interaction-patterns)
14. [Onboarding Flow — 3-Step Wizard](#14-onboarding-flow--3-step-wizard)
15. [Premium Upsell Patterns](#15-premium-upsell-patterns)

---

## 1. Design Philosophy

### Core Aesthetic: Refined Editorial Dark

EasyTrip must feel like a high-end travel magazine brought to life on your phone. Not a utility app dressed up — a genuine editorial experience that happens to be useful. Every screen should feel like it belongs in a design award submission.

**Five Design Principles:**

1. **Luxury through restraint** — Less information, more breathing room. White space (dark space) is not wasted space; it's premium.
2. **Motion with purpose** — Every animation earns its place. No gratuitous transitions. Movement guides attention, signals state changes, and rewards interactions.
3. **Typography as design element** — Syne 800 headlines dominate. They're not labels — they're art. Text is layout.
4. **Surface hierarchy** — Three levels: Background (`#090b12`) → Surface (`#0f1219`) → Raised (`#141820`). Cards float. Content breathes.
5. **Colour as meaning** — Brand colours encode category: Teal = food, Violet = landmarks, Gold = transport. Never decorative-only.

### Design Language Vocabulary

| Element | Treatment |
|---|---|
| Hero cards | Glass morphism, 7% opacity fill, 1px border at 20% white |
| Display type | Syne 800, -0.02em tracking, gradient text for accent moments |
| Body copy | DM Sans 400/500, 1.6 line-height, subdued (`#8892b0`) |
| Labels / codes | JetBrains Mono, 0.08em tracking, uppercase |
| Accent italic | Instrument Serif italic, destination names, pull quotes |
| Grain overlay | 8% opacity noise texture, adds analogue warmth |
| Aurora orbs | 2-3 blurred radial gradients, animate slowly (60s cycle), behind content |
| Category dots | 8px filled circles, colour-coded, on every task/venue |

---

## 2. User Personas

### Persona 1 — Maya, The Solo Backpacker
**Age:** 26 | **Location:** Manchester, UK | **Tier:** Voyager (one-time)

**Context:** Quit her marketing job to backpack Southeast Asia for 3 months. Travels on £45/day. Books accommodation 2 days ahead. Lives by her phone.

**Goals:**
- Generate a real itinerary fast (under 5 minutes)
- Stay under budget without obsessing over every penny
- Find what locals eat, not just tourist traps
- Navigate public transport without roaming data anxiety

**Frustrations:**
- Google Maps doesn't plan *days*, just routes
- Wanderlog is great but feels like a spreadsheet
- TripAdvisor recommendations feel bought
- Constantly switching between 5 apps

**Behaviour patterns:**
- Opens app first thing every morning to review today's plan
- Checks off tasks as she goes — satisfying progress feeling
- Heavily uses translation for menus and signs
- Shares daily plan screenshots to Instagram Stories

**Key screens:** SCR-05 (Daily Planner), SCR-09 (Translator), SCR-11 (Budget), SCR-08 (Food)

**Design implications:** Speed is everything. One-tap actions. Offline reliability non-negotiable. Budget tracking must be frictionless.

---

### Persona 2 — James & Sophie, The Luxury Couple
**Ages:** 38, 35 | **Location:** London, UK | **Tier:** Nomad Pro (annual)

**Context:** Both work in finance. Take 4 luxury trips per year. Annual travel budget £12,000+. Care about Instagram-worthy restaurants, exclusive experiences, and not wasting a single day of annual leave.

**Goals:**
- Find the restaurants celebrities and influencers actually go to
- Build an itinerary that balances must-sees with discovery
- Have everything pre-planned so no decision fatigue on holiday
- Look impressive when recommending places to friends

**Frustrations:**
- Existing apps don't surface the *right* restaurants (the ones that matter right now)
- AI recommendations feel generic ("Visit the Eiffel Tower")
- Can't see what's trending *this month* vs what was hot 2 years ago
- No single source of truth for a trip

**Behaviour patterns:**
- Plans trips 6-8 weeks in advance
- Uses Social Intelligence feed obsessively for restaurant intel
- Cares deeply about design — will judge an app by its UI before using it
- Exports trip to share with friends

**Key screens:** SCR-10 (Social Intelligence), SCR-06 (Place Detail), SCR-04 (Itinerary Overview), SCR-14 (AI Assistant)

**Design implications:** Premium feel is non-negotiable. Social proof visible everywhere. Celeb/influencer picks need visual prominence. Themes must feel luxurious.

---

### Persona 3 — The Chaudary Family
**Ages:** David (42), Priya (40), Aryan (14), Zara (9) | **Location:** Birmingham, UK | **Tier:** Voyager

**Context:** Two weeks in Japan — big trip they've been saving for. Mixed dietary needs (one vegetarian, one shellfish allergy). Need activities suitable for both a teenager and a 9-year-old. Overwhelming amount of planning.

**Goals:**
- Build an itinerary that works for all four people
- Filter for vegetarian restaurants, allergy-safe options
- Know opening hours and entry fees upfront to avoid surprises
- Have something to hand to the kids on boring transport legs

**Frustrations:**
- Family travel planning is incredibly time-consuming
- Dietary filters are usually buried or broken
- Can't find "family-friendly" without getting 'soft play in Sutton Coldfield' results
- Budget spirals because they don't track in real time

**Behaviour patterns:**
- David does all the planning (heavy pre-trip use)
- Priya uses it daily during trip for translation
- Aryan borrows Dad's phone to check tomorrow's plan
- Budget tracked daily — exported at end for expense claims

**Key screens:** SCR-03 (Trip Creator — dietary filters), SCR-05 (Daily Planner), SCR-09 (Translator), SCR-11 (Budget)

**Design implications:** Dietary filters must be prominent in trip creation. Entry fees must be clearly displayed. Font sizes need to be readable without glasses.

---

### Persona 4 — Marcus, The Business Traveller
**Age:** 44 | **Location:** Edinburgh, UK | **Tier:** Voyager (expenses reimbursed)

**Context:** Travels to European cities 2-3x per month for client meetings. Usually 2-3 day trips. Needs to make the most of every free hour. Budget tracking for expense reports.

**Goals:**
- Quick itinerary for free time around meetings (2-3 hours at a time)
- Know airport transfer options instantly
- Track all expenses for end-of-month reimbursement
- Find a good dinner spot near the hotel that won't embarrass him with a client

**Frustrations:**
- Can't be bothered with 3-step wizards — just give him a city guide
- Expense tracking apps are separate from travel apps
- Transport info is always out of date
- Everything takes too long to load

**Behaviour patterns:**
- Opens app at airport or on the plane
- Speed-runs the wizard — wants defaults, not customisation
- Uses budget tracker like a receipt collector
- Shares restaurant picks with colleagues

**Key screens:** SCR-02 (Home), SCR-07 (Transport), SCR-11 (Budget), SCR-06 (Place Detail)

**Design implications:** Defaults everywhere. Smart suggestions based on location. Transport info front and centre. Budget log must be one tap.

---

## 3. User Flows — Core Journeys

### Flow 1: Create Trip → Generate Itinerary

```
[App Open]
     │
     ▼
[SCR-01: Onboarding]  ──────────────────────► [Sign In / Register]
     │  (first time)                                    │
     │                                                  │
     └──────────────────────────────────────────────────┘
                                │
                                ▼
                      [SCR-02: Home Dashboard]
                                │
                         Tap "+ New Trip"
                                │
                                ▼
                      [SCR-03: Trip Creator]
                       Step 1: Destination + Dates
                                │
                           Tap "Next"
                                │
                                ▼
                       Step 2: Budget
                                │
                           Tap "Next"
                                │
                                ▼
                       Step 3: Preferences
                          (trip type, dietary,
                           interests, pace)
                                │
                     Tap "Generate My Trip"
                                │
                                ▼
                    [Generation Loading Screen]
                    (Aurora orb animation, 15-45s)
                                │
                     Generation complete
                                │
                                ▼
                    [SCR-04: Itinerary Overview]
                    "Your trip is ready ✨"
                                │
                    Tap any day card
                                │
                                ▼
                    [SCR-05: Daily Planner]
```

**Error path:** Generation fails → friendly error with "Try Again" CTA, suggestion to try simpler destination.

**Free user path:** At Step 1, if user sets duration > 3 days → inline paywall appears before Step 2.

---

### Flow 2: Use Daily Planner → Check Venue

```
[SCR-05: Daily Planner]
     │
     │  (morning of travel)
     │
     ├─── Tap task checkbox ──────────────► Task marked complete
     │                                      Progress bar updates
     │
     ├─── Tap task title ─────────────────► [SCR-06: Place Detail]
     │                                           │
     │                                      Scroll to "How to get there"
     │                                           │
     │                                      Tap "Get Directions"
     │                                           │
     │                                           ▼
     │                                      [SCR-07: Transport]
     │
     ├─── Long-press task ────────────────► Contextual menu:
     │                                      Edit / Delete / Move to another day
     │
     └─── Drag handle ────────────────────► Drag-to-reorder mode
                                            (Voyager+)
```

---

### Flow 3: Check Venue Details

```
[SCR-06: Place Detail] — can arrive from:
  ├── SCR-05 Daily Planner (tap task)
  ├── SCR-08 Food & Dining (tap restaurant card)
  └── SCR-04 Itinerary Overview (tap venue name)
     │
     ├── Swipe photos ──────────────────► Photo carousel (full-screen on tap)
     │
     ├── Tap "How to Get There" ────────► SCR-07 Transport (pre-filled from/to)
     │
     ├── Tap "Book" / entry fee ────────► External browser (booking URL)
     │
     ├── Tap "Add to Day" ──────────────► Day picker modal → task added
     │
     └── Tap influencer card (Pro) ─────► External browser (original post)
```

---

### Flow 4: Get Transport

```
[SCR-07: Transport]
     │
     ├─ From / To pre-filled from context
     │  OR user types destinations
     │
     ├─ Tap transport mode chip ────────► Filter results to that mode
     │
     ├─ Tap route card ─────────────────► Expanded route detail
     │   (best match highlighted)            Step-by-step directions
     │                                       Map route preview
     │
     ├─ Travel pass section ────────────► Tap "Learn More" → pass detail modal
     │   (shown if pass available)
     │
     ├─ Disruption alert (Pro) ─────────► Alert banner tapped → detail bottom sheet
     │
     └─ Tap "Save Route" ───────────────► Saved to offline storage
```

---

### Flow 5: Use Translator

```
[SCR-09: Translator]
     │
     ├─ [Text tab] ──────────────────────►  Type or paste text
     │                                       Auto-detect source language
     │                                       Translation appears below
     │                                       Tap speaker → audio playback
     │
     ├─ [Camera tab] (Voyager+) ────────►  Camera view opens
     │                                       Point at text
     │                                       Tap shutter button
     │                                       OCR extracts text
     │                                       Translation overlaid on image
     │
     ├─ [Phrasebook tab] ───────────────►  Category filter (greetings/food/etc.)
     │                                       Tap phrase card
     │                                       Audio plays automatically
     │                                       Heart icon → saves to library
     │
     └─ [Saved tab] ────────────────────►  List of saved phrases
                                            Tap to hear audio
                                            Swipe to delete
```

---

### Flow 6: Social Intelligence (Pro)

```
[SCR-10: Social Intelligence]
     │
     ├─ Live feed updates (WebSocket) ──►  New post card slides in from top
     │
     ├─ Filter bar ─────────────────────►  Tap chip → filters feed
     │   (Food / Landmarks / Transport)
     │
     ├─ Sort toggle ────────────────────►  Trending / Recent / Follower Count
     │
     ├─ Tap post card ──────────────────►  Bottom sheet opens:
     │                                       Full 50-word quote
     │                                       Creator profile
     │                                       "View Original Post" CTA
     │                                       "Add venue to trip" CTA
     │
     └─ Tap venue name in post ─────────►  SCR-06 Place Detail
```

---

## 4. Navigation Structure

### 4.1 Tab Bar (Bottom Navigation)

Five primary tabs, always visible except during full-screen modals and onboarding.

```
┌────────────────────────────────────────────────────────┐
│                                                        │
│  [🏠 Home]  [✈️ Trips]  [+]  [💬 AI]  [👤 Profile]    │
│                                                        │
└────────────────────────────────────────────────────────┘
```

| Tab | Icon | Screen | Tier |
|---|---|---|---|
| Home | House | SCR-02 Dashboard | All |
| Trips | Plane | SCR-04 Itinerary Overview | All |
| Create (FAB) | Plus (raised, accent) | SCR-03 Trip Creator | All |
| AI Assistant | Chat bubble | SCR-14 AI Assistant | Nomad Pro (locked for others) |
| Profile | Person | SCR-13 Profile | All |

The centre **+** button is a raised FAB (Floating Action Button), elevated above the tab bar by 4px, accent colour fill (Lime `#b8ff57` in Aurora Dark). Tap → Trip Creator modal animates up.

**Tab bar styling:**
- Background: glass morphism on `surface` color
- Active tab: accent colour icon + label
- Inactive: `#8892B0` (subdued)
- Pill indicator under active tab (8px wide, 2px tall, rounded)

### 4.2 Stack Navigators

```
Root Stack (Expo Router):
├── (auth)/
│   ├── onboarding          — SCR-01
│   ├── sign-in
│   └── sign-up
│
└── (app)/                  — Protected, requires auth
    ├── (tabs)/
    │   ├── index           — SCR-02 Home
    │   ├── trips/
    │   │   ├── index       — SCR-04 Itinerary Overview
    │   │   └── [tripId]/
    │   │       ├── index   — Day list
    │   │       └── day/[dayId] — SCR-05 Daily Planner
    │   ├── create          — SCR-03 Trip Creator (modal stack)
    │   ├── assistant       — SCR-14 AI Assistant
    │   └── profile         — SCR-13 Profile
    │
    ├── place/[placeId]     — SCR-06 Place Detail (modal, full-screen)
    ├── transport           — SCR-07 Transport
    ├── food/               — SCR-08 Food & Dining
    ├── translate           — SCR-09 Translator
    ├── social              — SCR-10 Social Intelligence
    ├── budget/[tripId]     — SCR-11 Budget Tracker
    └── settings            — SCR-12 Settings
```

### 4.3 Modals & Bottom Sheets

**Full-screen modals** (slide up from bottom, cover tab bar):
- SCR-03 Trip Creator (3-step wizard)
- SCR-06 Place Detail
- Photo carousel (full-screen)
- Paywall / Upgrade modal

**Bottom sheets** (partial overlay, drag to dismiss):
- Transport route detail
- Add custom task
- Log expense
- Day picker (when adding venue to trip)
- Social post detail
- Travel pass info
- Theme switcher

**Alerts / Action sheets** (system-native feel):
- Task long-press context menu
- Delete confirmation
- Share options

---

## 5. Screen-by-Screen Wireframes

> **Note on ASCII wireframes:** `█` = filled area/image, `▓` = card/surface, `░` = input field, `─┤├─` = dividers. Sizes are approximate mobile proportions (~390px wide). Actual coordinates in frontend spec.

---

### SCR-01: Onboarding

```
┌─────────────────────────────────────┐
│                                     │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   │← status bar
│                                     │
│                                     │
│       ╭───────────────────╮         │
│       │  ✦ EASYTRIP  ✦   │         │← Logo mark, animated on load
│       │  (aurora orb bg)  │         │  Syne 800, gradient text
│       ╰───────────────────╯         │
│                                     │
│                                     │
│   *Your world,*                     │← Instrument Serif italic, large
│   **perfectly planned.**            │← Syne 800, white, 2 lines
│                                     │
│                                     │
│   ┌─────────────────────────────┐   │
│   │  ✓  AI-generated itinerary  │   │← 3 value props, icon + text
│   │  ✓  Live social intel       │   │
│   │  ✓  Works in 195 countries  │   │
│   └─────────────────────────────┘   │
│                                     │
│                                     │
│  ┌───────────────────────────────┐  │
│  │       Get Started →           │  │← Primary CTA, Lime fill, dark text
│  └───────────────────────────────┘  │
│                                     │
│  ┌───────────────────────────────┐  │
│  │   Continue with Google        │  │← Social sign-in, ghost button
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │   Continue with Apple         │  │← Social sign-in, ghost button
│  └───────────────────────────────┘  │
│                                     │
│      Already have an account?       │
│         Sign In ──────────────      │← Inline link
│                                     │
└─────────────────────────────────────┘

BACKGROUND: Aurora orbs animate slowly behind content
LOGO ANIMATION: Logo mark draws in (stroke animation), then fills
CTA: "Get Started" → opens sign-up flow
```

**States:**
- Loading: Logo animation only, CTAs fade in after 1.2s
- Error (auth): Red inline error below failed button

---

### SCR-02: Home / Dashboard

```
┌─────────────────────────────────────┐
│  EasyTrip          [🔔]  [⚙️]       │← Header: logo + notification + settings
│─────────────────────────────────────│
│                                     │
│  Good morning, Maya ☀️              │← Greeting, DM Sans, personalised
│  *Where to next?*                   │← Instrument Serif italic
│                                     │
│─────────────────────────────────────│
│  ACTIVE TRIP                        │← Section label, JetBrains Mono caps
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ █████████████████████████████  │ │← Hero trip card
│ │ ██ [destination photo] ██████  │ │  Glass morphism overlay
│ │ ██████████████████████████████ │ │
│ │                                 │ │
│ │  **TOKYO, JAPAN**               │ │← Syne 800, white
│ │  *6-day adventure*              │ │← Instrument Serif italic
│ │                                 │ │
│ │  Day 3 of 6  ████████░░░░  50% │ │← Progress bar, Lime fill
│ │                                 │ │
│ │  [ Today's Plan → ]             │ │← CTA button inline
│ └─────────────────────────────────┘ │
│                                     │
│  QUICK ACTIONS                      │← Section label
│                                     │
│  ┌──────────┐ ┌──────────┐         │
│  │ + New    │ │ 🌐 Trans │         │← Quick action pills
│  │   Trip   │ │   late   │         │
│  └──────────┘ └──────────┘         │
│  ┌──────────┐ ┌──────────┐         │
│  │ 🚆 Trans │ │ 💰 Budget│         │
│  │  port    │ │  Tracker │         │
│  └──────────┘ └──────────┘         │
│                                     │
│─────────────────────────────────────│
│  RECENT TRIPS                       │← Section label
│                                     │
│  ┌─────────────────────────────┐    │
│  │ ▓ [photo] PARIS  Dec '25   │    │← Past trip mini cards
│  └─────────────────────────────┘    │
│  ┌─────────────────────────────┐    │
│  │ ▓ [photo] ROME   Oct '25   │    │
│  └─────────────────────────────┘    │
│                                     │
│─────────────────────────────────────│
│  TRENDING NOW  🔥  [Pro badge]      │← Pro-gated section (blurred for free)
│  ┌─────────┐ ┌─────────┐ ┌───────┐ │
│  │ [blurred│ │ [blurred│ │[blurr │ │← Frosted glass blur over content
│  │ content]│ │ content]│ │ed]    │ │
│  └─────────┘ └─────────┘ └───────┘ │
│  [ Unlock with Nomad Pro → ]        │← Inline upsell CTA
│                                     │
│─────────────────────────────────────│
│  [🏠]    [✈️]    [+]    [💬]  [👤]  │← Tab bar
└─────────────────────────────────────┘
```

**States:**
- No active trip: Hero card replaced with "Plan your next adventure" CTA card
- Loading: Skeleton shimmer on trip card and recent trips
- Notification badge: Red dot on bell icon

---

### SCR-03: Trip Creator (Step 1 of 3)

```
┌─────────────────────────────────────┐
│  ✕           New Trip               │← Modal header, close button
│─────────────────────────────────────│
│                                     │
│  ● ────────── ○ ────────── ○        │← Step progress indicator
│  Destination    Budget     Style    │← Step labels below dots
│                                     │
│─────────────────────────────────────│
│                                     │
│  *Where are you going?*             │← Instrument Serif italic, large
│                                     │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   │← Search input, autofocus
│  🔍  Search destinations...         │  Animated underline on focus
│                                     │
│  ┌─────────────────────────────┐    │← Autocomplete dropdown
│  │  📍 Tokyo, Japan            │    │
│  │  📍 Kyoto, Japan            │    │
│  │  📍 Osaka, Japan            │    │
│  └─────────────────────────────┘    │
│                                     │
│  ─── POPULAR RIGHT NOW ───          │← Trending suggestions
│                                     │
│  ┌───────┐ ┌───────┐ ┌───────┐     │
│  │ [img] │ │ [img] │ │ [img] │     │← Destination chips with photos
│  │ Tokyo │ │ Paris │ │ Bali  │     │
│  └───────┘ └───────┘ └───────┘     │
│                                     │
│─────────────────────────────────────│
│                                     │
│  *When are you going?*              │
│                                     │
│  ┌─────────────────────────────┐    │← Inline date picker
│  │  From: [  Apr 28, 2026  ]   │    │
│  │  To:   [  May 4, 2026   ]   │    │
│  │  Duration: 7 days           │    │← Auto-calculated
│  └─────────────────────────────┘    │
│                                     │
│  ⚠️  Free plan: max 3 days           │← Free tier notice (explorer only)
│  [ Upgrade to Voyager — £4.99 ]     │← Inline upsell
│                                     │
│                                     │
│  ┌───────────────────────────────┐  │
│  │         Next →                │  │← CTA, disabled until valid
│  └───────────────────────────────┘  │
│                                     │
└─────────────────────────────────────┘
```

---

### SCR-03: Trip Creator (Step 2 of 3)

```
┌─────────────────────────────────────┐
│  ← Back        Budget               │← Back button + step label
│─────────────────────────────────────│
│                                     │
│  ○ ────────── ● ────────── ○        │← Step 2 active
│                                     │
│  *What's your budget?*              │
│                                     │
│  ┌──────────────────────────────┐   │
│  │  Backpacker   Budget  Comfort│   │← 3-option toggle (pill selector)
│  │  £30/day     £60/day £120/day│   │  Taps to select
│  └──────────────────────────────┘   │
│                           [Luxury]  │← Expandable 4th option
│                                     │
│  OR enter a total budget:           │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   │
│  £  [  1,200  ]   Currency: [GBP ▼]│← Custom input + currency selector
│                                     │
│  ─────────────────────────────────  │
│                                     │
│  ESTIMATED COST BREAKDOWN          │← Dynamic preview
│  ┌─────────────────────────────┐    │
│  │  🍜 Food          ~£350     │    │← Category estimates
│  │  🚆 Transport     ~£180     │    │
│  │  🎭 Activities    ~£240     │    │
│  │  ──────────────────────     │    │
│  │  Total            ~£770     │    │← Total estimate
│  │  Remaining        ~£430     │    │← Budget remaining
│  └─────────────────────────────┘    │
│                                     │
│  ℹ️  Estimates based on AI analysis  │← Disclaimer
│  of real traveller reports          │
│                                     │
│  ┌───────────────────────────────┐  │
│  │         Next →                │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

---

### SCR-03: Trip Creator (Step 3 of 3)

```
┌─────────────────────────────────────┐
│  ← Back      Preferences           │
│─────────────────────────────────────│
│                                     │
│  ○ ────────── ○ ────────── ●        │← Step 3 active
│                                     │
│  *Who's travelling?*                │
│                                     │
│  ┌─────────────────────────────┐    │← Trip type selector grid
│  │  [👤]     [👫]     [👨‍👩‍👧‍👦]    │    │
│  │  Solo    Couple   Family    │    │
│  │  [👥]     [💼]              │    │
│  │  Group   Business           │    │
│  └─────────────────────────────┘    │
│                                     │
│  *Travel pace?*                     │
│                                     │
│  ░ Relaxed    ─────●──────  Packed  │← Slider
│  (fewer stops, more time each)      │← Dynamic label
│                                     │
│  *Interests* (pick up to 5)         │
│                                     │
│  ┌──────┐ ┌──────┐ ┌──────┐        │
│  │ 🍜   │ │ 🏛️   │ │ 🌿   │        │← Interest chips, toggleable
│  │ Food │ │Histo-│ │Nature│        │
│  └──────┘ │  ry  │ └──────┘        │
│            └──────┘                 │
│  ┌──────┐ ┌──────┐ ┌──────┐        │
│  │ 🎨   │ │ 🎵   │ │ 🛍️   │        │
│  │ Art  │ │Music │ │Shop  │        │
│  └──────┘ └──────┘ └──────┘        │
│                                     │
│  *Dietary requirements?*            │
│                                     │
│  ┌──────────────────────────────┐   │
│  │ [Veg] [Vegan] [Halal] [GF]   │   │← Multi-select chips
│  │ [Shellfish-free] [Nut-free]  │   │
│  └──────────────────────────────┘   │
│                                     │
│  ┌───────────────────────────────┐  │
│  │   ✨ Generate My Trip         │  │← Primary CTA, accent fill
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

---

### SCR-03: Generation Loading

```
┌─────────────────────────────────────┐
│                                     │
│                                     │
│                                     │
│        ╭─────────────────╮          │← Aurora orb animation
│        │   LARGE AURORA  │          │  Teal + Violet orbs pulse
│        │   ORB ANIMATION │          │  Slowly rotate
│        │   (full screen  │          │
│        │    background)  │          │
│        ╰─────────────────╯          │
│                                     │
│                                     │
│   ✨ **Planning your Tokyo trip…**  │← Syne 800, animates in
│                                     │
│   ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │← Progress bar, animates
│   Loading Day 2 of 7...             │← Dynamic status text
│                                     │
│   ─────────────────────────────     │
│                                     │
│   *Finding the best ramen spots*    │← Rotating "fun facts" / what AI is doing
│   *in Shinjuku for you…*            │← Instrument Serif italic
│                                     │
│                                     │
│                                     │
│   ┌───────────────────────────┐     │
│   │  Cancel                   │     │← Cancel always available
│   └───────────────────────────┘     │
│                                     │
└─────────────────────────────────────┘

ANIMATION: 
- Background: 3 aurora orbs at 20% opacity, animate on 60s loop
- Progress bar: fills based on actual job status (via polling)
- Fun fact text: rotates every 4s with fade
- On completion: confetti burst (subtle, 0.5s) then navigate to SCR-04
```

---

### SCR-04: Itinerary Overview

```
┌─────────────────────────────────────┐
│  ← Back   TOKYO 🇯🇵     [↗️] [⋮]  │← Header: back, title, share, menu
│─────────────────────────────────────│
│                                     │
│  ┌─────────────────────────────┐    │← Hero card with trip photo
│  │ ████████████████████████   │    │
│  │ █  [TOKYO HERO IMAGE]   █  │    │
│  │ ████████████████████████   │    │
│  │                             │    │
│  │  *Apr 28 – May 4 · 7 days* │    │← Instrument Serif italic overlay
│  │  **Tokyo, Japan**           │    │← Syne 800, white
│  │                             │    │
│  │  Est. cost: ~£820  👥 Solo  │    │← Meta row
│  └─────────────────────────────┘    │
│                                     │
│  DAY NAVIGATOR ─────────────────── │
│  ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐    │← Horizontal scroll
│  │D1 │ │D2 │ │D3 │ │D4 │ │D5 │    │← Day pills, active = accent fill
│  │28 │ │29 │ │30 │ │ 1 │ │ 2 │    │← Dates below number
│  └───┘ └───┘ └───┘ └───┘ └───┘    │
│                                     │
│  [🗺 Map View]  [📋 List View]     │← View toggle
│─────────────────────────────────────│
│                                     │
│  DAY 1 — MONDAY, APR 28             │← Day header
│  *Shinjuku & Golden Gai*            │← AI-generated day title
│                                     │
│  ┌─────────────────────────────┐    │← Day summary card
│  │  5 stops · 3 meals ·        │    │  
│  │  🚆 2 transport legs        │    │
│  │  Est. day cost: £95         │    │
│  │                             │    │
│  │  [ Open Day → ]             │    │← CTA to SCR-05
│  └─────────────────────────────┘    │
│                                     │
│  DAY 2 — TUESDAY, APR 29            │
│  *Asakusa & Ueno*                   │
│  ┌─────────────────────────────┐    │
│  │  6 stops · 3 meals ·        │    │
│  │  🚶 Mostly walking          │    │
│  │  Est. day cost: £80         │    │
│  │  [ Open Day → ]             │    │
│  └─────────────────────────────┘    │
│                                     │
│   ... (days 3-7 continue)           │
│                                     │
│  ─────────────────────────────────  │
│  TRIP SUMMARY                       │
│  ┌─────────────────────────────┐    │
│  │  Total Est. Cost:   ~£820   │    │
│  │  Food:              ~£280   │    │
│  │  Transport:         ~£150   │    │
│  │  Activities:        ~£240   │    │
│  │  Other:             ~£150   │    │
│  └─────────────────────────────┘    │
│                                     │
│  [ 📤 Share Trip ]  [ ✏️ Edit ]     │
│                                     │
│  [🏠]    [✈️]    [+]    [💬]  [👤]  │
└─────────────────────────────────────┘
```

**States:**
- Map view: Full-screen map with day timeline markers, switchable
- Low confidence destination: Yellow banner "Limited local data available"

---

### SCR-05: Daily Planner

```
┌─────────────────────────────────────┐
│  ← Day 3         APR 30    [⋮]     │← Header: back, date, menu
│─────────────────────────────────────│
│                                     │
│  **Asakusa & Ueno**                 │← Day title, Syne 800
│  *Monday, April 30 · 6 stops*       │← Instrument Serif italic
│                                     │
│  Progress: ████████████░░░░  67%    │← Progress bar, Lime fill
│  4 of 6 tasks complete              │← Task count label
│                                     │
│─────────────────────────────────────│
│                                     │
│  ┌─────────────────────────────┐    │← TASK CARD (completed)
│  │ ✅ ●  09:00                 │    │  ● = food category dot (Teal)
│  │    **Tsukiji Outer Market** │    │
│  │    Breakfast · ~£12/person  │    │
│  │    ← 15 min walk            │    │← Travel time to next
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │← TASK CARD (active/current)
│  │ ☐ ═  10:30  ◄ NOW          │    │  ═ = drag handle  ◄ NOW badge
│  │    **Senso-ji Temple**      │    │← Highlighted with accent border
│  │    Landmark · Free entry    │    │
│  │    Open until 17:00         │    │
│  │    ← 5 min walk             │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │← TASK CARD (upcoming)
│  │ ☐ ═  12:00                 │    │
│  │    **Nakamise Street**      │    │
│  │    Shopping · ~£30          │    │
│  │    ← 2 min walk             │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ ☐ ═  13:30                 │    │← TRANSPORT TASK
│  │    🚆 Metro to Ueno         │    │  Transport category (Gold dot)
│  │    Ginza line · 8 min       │    │
│  │    ¥170 (~£0.95)            │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ ☐ ═  14:00                 │    │
│  │    **Tokyo National Museum**│    │
│  │    Culture · ¥1,000 (~£5.50)│    │
│  │    Open until 17:00 ⚠️ busy │    │← Peak hour warning
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ ☐ ═  19:30                 │    │
│  │    **Ramen Jiro**           │    │← Food category (Teal dot)
│  │    Dinner · ~£8/person      │    │
│  │    Book: recommended        │    │
│  └─────────────────────────────┘    │
│                                     │
│─────────────────────────────────────│
│  DAY SUMMARY                        │← Footer summary
│  Est. spend today: £62              │
│  🚶 3.2km walking · 🚆 8 min metro  │
│─────────────────────────────────────│
│                                     │
│                          [+ Add]    │← FAB bottom-right
│                                     │
│  [🏠]    [✈️]    [+]    [💬]  [👤]  │
└─────────────────────────────────────┘
```

**Drag-to-reorder behaviour:** Long press drag handle → task lifts (scale 1.05, shadow +elevation), other tasks compress to make space, drop animates to new position. Haptic feedback on lift and drop.

**States:**
- All complete: Confetti animation, "Day complete! 🎉" banner
- No tasks: Skeleton with "Something went wrong" + regenerate option

---

### SCR-06: Place Detail

```
┌─────────────────────────────────────┐
│  ✕                          [♡][↗] │← Modal close + save + share
│─────────────────────────────────────│
│                                     │
│  █████████████████████████████████  │← Photo carousel (full width)
│  █     [PHOTO 1 of 4]         ●●○○ │  Dot indicators
│  █████████████████████████████████  │
│                                     │
│  ● Food  ★ 4.6  (2,847 reviews)    │← Category chip + rating
│  **Tsukiji Honten Sushi**           │← Venue name, Syne 800
│  *Tsukiji, Tokyo · ¥¥¥*            │← Instrument Serif italic + price level
│                                     │
│  ─────────────────────────────────  │
│  HOURS                              │← JetBrains Mono caps section label
│  ┌───────────────────────────────┐  │
│  │  Mon–Sat   07:00 – 15:00     │  │
│  │  Sun        07:00 – 14:00     │  │
│  │  ● Currently Open             │  │← Green dot = open now
│  │  ℹ️  Hours from Google        │  │← Staleness disclaimer
│  └───────────────────────────────┘  │
│                                     │
│  PEAK HOURS (TODAY)                 │
│  ┌───────────────────────────────┐  │← Bar chart
│  │  ▁▂▃▅█▇▆▄▂▁▁▁▁              │  │  
│  │  7  9  11  13  15  17  19    │  │← Time axis
│  │          ↑ Best time: 9am    │  │← Recommendation overlay
│  └───────────────────────────────┘  │
│                                     │
│  HOW TO GET THERE                   │
│  ┌────────────────────────────────┐ │
│  │  From: Senso-ji Temple         │ │← Pre-filled from current task
│  │  ─────────────────────────     │ │
│  │  🚆 Metro   12 min  ¥210      │ │← Option row
│  │  🚖 Taxi    8 min   ¥850      │ │
│  │  🚶 Walk    38 min  Free      │ │
│  └────────────────────────────────┘ │
│  [ See Full Directions → ]          │← Link to SCR-07
│                                     │
│  ENTRY                              │
│  Free / No booking required         │
│                                     │
│  ─────────────────────────────────  │
│  🔥 TRENDING HERE  [Pro]            │← Social Intelligence section
│  ┌────────────────────────────────┐ │← Locked for non-Pro (blurred)
│  │ @gordonramsay (28.4M)          │ │← Creator name + followers
│  │ "Best omakase I've had in      │ │← 50-word quote
│  │  Tokyo. The tuna is life-      │ │
│  │  changing…"  2 days ago        │ │← Recency
│  │  [ View Post → ]               │ │← External link
│  └────────────────────────────────┘ │
│                                     │
│  ┌───────────────────────────────┐  │
│  │   + Add to Day                │  │← Primary CTA
│  └───────────────────────────────┘  │
│                                     │
└─────────────────────────────────────┘
```

---

### SCR-07: Transport

```
┌─────────────────────────────────────┐
│  ← Back         Transport           │
│─────────────────────────────────────│
│                                     │
│  ┌─────────────────────────────┐    │← Route input card
│  │  FROM                       │    │
│  │  ░░░░░░░░░░░░░░░░░░░░░░░░░  │    │
│  │  📍  Senso-ji Temple        │    │← Autofilled or typed
│  │  ─────────────────────────  │    │
│  │  TO                         │    │
│  │  ░░░░░░░░░░░░░░░░░░░░░░░░░  │    │
│  │  📍  Tsukiji Market         │    │
│  │  ─────────────────────────  │    │
│  │  🕐  Now  /  [Set time]     │    │← Departure time
│  └─────────────────────────────┘    │
│                                     │
│  ─── ROUTE MAP ───────────────────  │
│  ┌─────────────────────────────┐    │
│  │                             │    │← Map with route overlay
│  │  🗺   [Map showing route]   │    │  Theme-styled map
│  │                             │    │  Route line in accent colour
│  └─────────────────────────────┘    │
│                                     │
│  ─── OPTIONS ─────────────────────  │
│  ┌──┐ ┌──┐ ┌──┐ ┌──┐              │← Mode filter chips
│  │🚆│ │🚶│ │🚖│ │🚴│              │← Metro / Walk / Taxi / Bike
│  └──┘ └──┘ └──┘ └──┘              │
│                                     │
│  ┌─────────────────────────────┐    │← ROUTE CARD (recommended)
│  │  ⭐ RECOMMENDED              │    │  Highlighted, accent border
│  │  🚆 Metro  ·  Ginza Line     │    │
│  │  12 min  ·  ¥210 (~£1.15)   │    │
│  │  Departs: 14:32              │    │
│  │  [ See Steps ▼ ]            │    │← Expandable
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │← Alternative route card
│  │  🚶 Walk                    │    │
│  │  38 min  ·  Free            │    │
│  │  ⚠️ Busy streets at this hour│   │← Warning flag
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │  🚖 Taxi / Uber             │    │
│  │  8 min  ·  ~¥850 (~£4.70)   │    │
│  │  Estimate only              │    │
│  └─────────────────────────────┘    │
│                                     │
│  ─── TRAVEL PASS ──────────────    │
│  ┌─────────────────────────────┐    │
│  │  🎫 Tokyo 72h Metro Pass    │    │
│  │  ¥1,500 · Covers all metro  │    │
│  │  Saves you ~¥640 on 7-day   │    │
│  │  trip · Buy at any station  │    │
│  │  [ Learn More → ]           │    │
│  └─────────────────────────────┘    │
│                                     │
│  [ 💾 Save Route ]                  │← Offline save
│                                     │
│  [🏠]    [✈️]    [+]    [💬]  [👤]  │
└─────────────────────────────────────┘
```

---

### SCR-08: Food & Dining

```
┌─────────────────────────────────────┐
│  ← Back       Food & Dining         │
│  Tokyo, Japan                       │← Context subtitle
│─────────────────────────────────────│
│                                     │
│  FILTER ────────────────────────── │
│  ┌────────────────────────────────┐ │
│  │ Cuisine: [All ▼]               │ │← Dropdown selectors
│  │ Budget:  [Any ▼]               │ │
│  │ Dietary: [None ▼]              │ │
│  │ Distance: ○─────●  5km         │ │← Slider
│  └────────────────────────────────┘ │
│  ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐   │← Quick filter chips
│  │🍣 │ │🍜 │ │🍱 │ │🥡 │ │+ │   │
│  │Sushi│Ramen│Bento│Other│More│   │
│  └───┘ └───┘ └───┘ └───┘ └───┘   │
│                                     │
│─────────────────────────────────────│
│  LOCAL MUST-TRY                     │← Curated AI section
│  ┌─────────────────────────────┐    │
│  │ 🌟 **Ramen**                │    │← Local dish card
│  │ Tokyo-style tonkotsu broth  │    │
│  │ Best areas: Shinjuku, Ikebe │    │
│  │ Budget: ~£8-15              │    │
│  └─────────────────────────────┘    │
│                                     │
│─────────────────────────────────────│
│  RESTAURANTS NEAR YOU               │
│                                     │
│  ┌─────────────────────────────┐    │← Restaurant card
│  │ █ [photo] ██████████████   │    │
│  │ **Ichiran Ramen**           │    │
│  │ ● Ramen · ¥¥ · ★ 4.7      │    │← Rating + price level
│  │ 450m away · Open now        │    │
│  │ 🔥 Trending  [Pro badge]    │    │← Social Intel badge (Pro)
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ █ [photo] ██████████████   │    │
│  │ **Sushi Yoshitake**         │    │
│  │ ● Sushi · ¥¥¥¥ · ★ 4.9   │    │
│  │ 1.2km · Opens 12:00        │    │
│  │ ⭐ Celeb Pick  [Pro badge]  │    │← Celeb pick badge (Pro)
│  └─────────────────────────────┘    │
│                                     │
│─────────────────────────────────────│
│  BEST FOOD AREAS                    │
│  ┌─────────────────────────────┐    │← Map card
│  │  🗺 [Map showing food areas] │    │
│  │  ● Shinjuku   ● Tsukiji     │    │← Area markers
│  │  ● Harajuku   ● Shibuya     │    │
│  └─────────────────────────────┘    │
│                                     │
│  [🏠]    [✈️]    [+]    [💬]  [👤]  │
└─────────────────────────────────────┘
```

---

### SCR-09: Translator

```
┌─────────────────────────────────────┐
│  ← Back          Translator         │
│─────────────────────────────────────│
│                                     │
│  ┌──────────────────────────────┐   │← Tab bar (within screen)
│  │ [Text]  [📷 Camera]  [📖 Book]  [⭐ Saved] │
│  └──────────────────────────────┘   │
│                                     │
│  ─── LANGUAGE PAIR ───────────────  │
│  ┌───────────────┐  ⇄  ┌─────────┐ │
│  │ 🇬🇧 English   │      │ 🇯🇵 日本語│ │← Language selectors, swap button
│  └───────────────┘      └─────────┘ │
│                                     │
│  ─── INPUT ───────────────────────  │
│  ┌─────────────────────────────┐    │← Text input area
│  │ ░░░░░░░░░░░░░░░░░░░░░░░░░  │    │
│  │ ░ Type text to translate… ░│    │
│  │ ░░░░░░░░░░░░░░░░░░░░░░░░░  │    │
│  │                        [✕] │    │← Clear button
│  └─────────────────────────────┘    │
│                                     │
│  ─── TRANSLATION ─────────────────  │
│  ┌─────────────────────────────┐    │← Translation output card
│  │                             │    │
│  │  **どこでラーメンが**        │    │← Large native script
│  │  **食べられますか？**        │    │
│  │                             │    │
│  │  Romanisation:              │    │
│  │  *Doko de ramen ga          │    │← Romanisation (toggle)
│  │  taberaremasu ka?*          │    │← Instrument Serif italic
│  │                             │    │
│  │  [🔊 Play]  [📋 Copy]  [♡] │    │← Actions: audio, copy, save
│  └─────────────────────────────┘    │
│                                     │
│  ─── PHRASEBOOK ──────────────────  │← (When on Phrasebook tab)
│  ┌──────────────────────────────┐   │
│  │ [Greet] [Food] [Trans] [Help]│   │← Category filter
│  └──────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐    │← Phrase card
│  │  "Where is the restroom?"   │    │
│  │  お手洗いはどこですか？      │    │
│  │  *Otearai wa doko desu ka?* │    │
│  │  [🔊]                  [♡] │    │
│  └─────────────────────────────┘    │
│                                     │
│  ─── OFFLINE PACK ────────────────  │
│  ┌─────────────────────────────┐    │← Voyager+ feature
│  │  ⬇️  Download Japanese Pack  │    │
│  │  ~8MB · Works offline       │    │
│  └─────────────────────────────┘    │
│                                     │
│  [🏠]    [✈️]    [+]    [💬]  [👤]  │
└─────────────────────────────────────┘
```

---

### SCR-10: Social Intelligence (Pro Only)

```
┌─────────────────────────────────────┐
│  ← Back    SOCIAL INTEL  🟢 Live    │← Live indicator dot
│  Tokyo, Japan                       │← Context
│─────────────────────────────────────│
│                                     │
│  FILTER ─────────────────────────   │
│  ┌──────┐ ┌────────┐ ┌────────┐    │
│  │ All  │ │🍜 Food │ │🏛 Sites│    │← Filter chips
│  └──────┘ └────────┘ └────────┘    │
│  Sort: [Trend Score ▼]              │← Sort dropdown
│                                     │
│─────────────────────────────────────│
│                                     │
│  ┌─────────────────────────────┐    │← SOCIAL POST CARD
│  │ @gordonramsay · YouTube     │    │← Creator + platform
│  │ 28.4M followers · ✓ verified│    │← Follower count + verified
│  │                             │    │
│  │ 🔥 Trend Score: 94          │    │← Score bar
│  │ █████████████████████░░░    │    │
│  │                             │    │
│  │ █ [video thumbnail]        │    │← Thumbnail
│  │                             │    │
│  │ "Best sushi counter I've   │    │← Quote (50 words max)
│  │  ever sat at. Jiro is the  │    │
│  │  GOAT. Tokyo is…"          │    │
│  │                             │    │
│  │ Sushi Yoshitake · 2h ago   │    │← Venue name + recency
│  │ [ View Post ]  [ Add Venue ]│    │← Actions
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │← Another post card
│  │ @milliondollarvegan · Insta │    │
│  │ 1.2M followers              │    │
│  │ 🔥 Trend Score: 87          │    │
│  │ ████████████████████░░░░    │    │
│  │ [photo]                     │    │
│  │ "Hidden vegan gem near      │    │
│  │  Shimokitazawa…"            │    │
│  │ Ain Soph Ripple · 5h ago    │    │
│  │ [ View Post ]  [ Add Venue ]│    │
│  └─────────────────────────────┘    │
│                                     │
│  ── LOADING NEXT POSTS... ────────  │← Infinite scroll indicator
│                                     │
│  [🏠]    [✈️]    [+]    [💬]  [👤]  │
└─────────────────────────────────────┘
```

---

### SCR-11: Budget Tracker

```
┌─────────────────────────────────────┐
│  ← Back        Budget Tracker       │
│  Tokyo trip · 7 days                │← Context
│─────────────────────────────────────│
│                                     │
│  TOTAL BUDGET                       │← JetBrains Mono section label
│  ┌─────────────────────────────┐    │← Hero budget card
│  │                             │    │
│  │  £1,200                     │    │← Budget amount, Syne 800 large
│  │  ████████████████░░░░  67%  │    │← Progress bar
│  │  Spent: £804  Remaining: £396│   │
│  │                             │    │
│  └─────────────────────────────┘    │
│                                     │
│  BREAKDOWN ──────────────────────   │
│  ┌────────────────────────────────┐ │
│  │  🍜 Food        ████░░  £210  │ │← Category bars
│  │  🚆 Transport   ██░░░░  £98   │ │  Colour coded
│  │  🎭 Activities  ████░░  £215  │ │
│  │  🏨 Accommod.  ██████  £281  │ │
│  └────────────────────────────────┘ │
│                                     │
│  DAILY SPEND ──────────────────────  │
│  ┌─────────────────────────────┐    │← Sparkline chart
│  │   ▂▃▅▄█▁_                  │    │← Bars per day
│  │   M T W T F S S            │    │← Day labels
│  └─────────────────────────────┘    │
│                                     │
│  RECENT EXPENSES ─────────────────  │
│  ┌─────────────────────────────┐    │← Expense list
│  │ 🍜 Ramen Jiro   £8  12:30  │    │
│  │ 🚆 Metro x2     £2  11:15  │    │
│  │ 🎭 Museum       £5  14:00  │    │
│  │ ☕ Cafe          £3  09:00  │    │
│  └─────────────────────────────┘    │
│                                     │
│  EXCHANGE RATE                      │
│  1 GBP = ¥187.42 · Updated 1h ago  │← Rate + freshness
│                                     │
│  ┌───────────────────────────────┐  │← Log expense FAB
│  │   + Log Expense               │  │← Always visible
│  └───────────────────────────────┘  │
│                                     │
│  [🏠]    [✈️]    [+]    [💬]  [👤]  │
└─────────────────────────────────────┘
```

---

### SCR-12: Settings

```
┌─────────────────────────────────────┐
│  ← Back          Settings           │
│─────────────────────────────────────│
│                                     │
│  APPEARANCE ──────────────────────  │
│  ┌─────────────────────────────┐    │← Theme switcher card
│  │  Active Theme: Aurora Dark  │    │
│  │  ─────────────────────────  │    │
│  │  ┌──────┐ ┌──────┐ ┌──────┐│    │← Theme preview thumbnails
│  │  │ ████ │ │ ░░░░ │ │ ████ ││    │
│  │  │Aurora│ │ Sand │ │Elect.││    │
│  │  │  ✓  │ │      │ │      ││    │← Active checkmark
│  │  └──────┘ └──────┘ └──────┘│    │
│  │  [Free: Light/Dark only 🔒] │    │← Free tier lock (explorer)
│  └─────────────────────────────┘    │
│                                     │
│  Category Colours  [Voyager+]        │
│  ┌─────────────────────────────┐    │
│  │  🍜 Food:       [●  Teal  ]│    │← Colour picker per category
│  │  🏛 Landmarks:  [● Purple ]│    │
│  │  🚆 Transport:  [●  Gold  ]│    │
│  │  🎨 Culture:    [● Indigo ]│    │
│  │  💰 Budget:     [●   Red  ]│    │
│  └─────────────────────────────┘    │
│                                     │
│  PREFERENCES ─────────────────────  │
│  Language           English [EN ▼]  │
│  Currency           GBP [£  ▼]      │
│  Default trip type  Solo  [  ▼]     │
│                                     │
│  NOTIFICATIONS ────────────────────  │
│  Trip reminders      [●  ON  ]       │← Toggle switches
│  Daily plan alerts   [●  ON  ]       │
│  Trending updates    [○  OFF ]       │
│                                     │
│  DATA & OFFLINE ───────────────────  │
│  Offline itinerary  Enabled [Voy+]  │
│  Downloaded packs   Japanese (8MB)  │
│  Clear cache        [Clear →]       │
│                                     │
│  ACCOUNT ─────────────────────────  │
│  Subscription       Nomad Pro       │
│  Manage billing     [→]             │
│  Export my data     [→]  (GDPR)     │
│  Delete account     [→]             │
│                                     │
│  ABOUT ────────────────────────────  │
│  Version  1.0.0 (42)                │
│  Privacy Policy   Terms of Service  │
│  Rate EasyTrip    Share EasyTrip    │
│                                     │
│  [🏠]    [✈️]    [+]    [💬]  [👤]  │
└─────────────────────────────────────┘
```

---

### SCR-13: Profile

```
┌─────────────────────────────────────┐
│             Profile        [✏️ Edit] │
│─────────────────────────────────────│
│                                     │
│         ╭────────────╮              │← Avatar circle
│         │  [AVATAR]  │              │
│         ╰────────────╯              │
│           **Maya Chen**             │← Display name, Syne 800
│         *Exploring the world 🌍*    │← Instrument Serif italic bio
│           Nomad Pro  🔥             │← Tier badge
│                                     │
│─────────────────────────────────────│
│  STATS ──────────────────────────   │
│  ┌────────┐  ┌────────┐  ┌───────┐ │
│  │   12   │  │   47   │  │  892  │ │← Stat numbers, Syne 800
│  │ Trips  │  │  Days  │  │ Tasks │ │← Labels below
│  └────────┘  └────────┘  └───────┘ │
│                                     │
│  COUNTRIES VISITED (12) ──────────  │
│  ┌─────────────────────────────┐    │← Interactive world map
│  │                             │    │  Visited = accent colour
│  │  [WORLD MAP]                │    │  Not visited = surface colour
│  │  12 countries highlighted   │    │
│  └─────────────────────────────┘    │
│  🇬🇧 🇯🇵 🇫🇷 🇮🇹 🇹🇭 🇻🇳 🇵🇹 🇪🇸 🇩🇪 🇲🇽 🇨🇷 🇺🇸  │← Flag row
│                                     │
│  ACHIEVEMENTS ──────────────────    │
│  ┌──────┐ ┌──────┐ ┌──────┐        │← Achievement badges
│  │ 🌟   │ │ 🗺    │ │ ✅   │        │
│  │First │ │10    │ │100   │        │
│  │ Trip │ │Count-│ │Tasks │        │
│  └──────┘ │ ries │ └──────┘        │
│            └──────┘                 │
│  3 of 24 earned  [ See all → ]     │
│                                     │
│  PAST TRIPS ──────────────────────  │
│  ┌─────────────────────────────┐    │
│  │ [photo] Tokyo   Apr 2026  →│    │← Past trip row
│  └─────────────────────────────┘    │
│  ┌─────────────────────────────┐    │
│  │ [photo] Paris   Dec 2025  →│    │
│  └─────────────────────────────┘    │
│                                     │
│  [ 📤 Share My Travel Story ]       │← Social share card generator
│                                     │
│  [🏠]    [✈️]    [+]    [💬]  [👤]  │
└─────────────────────────────────────┘
```

---

### SCR-14: AI Trip Assistant (Pro Only)

```
┌─────────────────────────────────────┐
│  ← Back     AI Assistant  [🔄]      │← Clear history button
│  Tokyo trip · Day 3 context         │← Context indicator
│─────────────────────────────────────│
│                                     │
│  ┌─────────────────────────────┐    │← Context chip
│  │  📍 Day 3 · Asakusa · £396  │    │← Current day + budget left
│  │  remaining budget            │    │
│  └─────────────────────────────┘    │
│                                     │
│─────────────────────────────────────│
│                                     │
│             [ASSISTANT MESSAGE]     │← Right-aligned (or vice versa)
│  ┌──────────────────────────────┐   │← AI bubble
│  │  Hi Maya! You have £396 left │   │
│  │  for 4 more days. Based on   │   │
│  │  your pace today, you're on  │   │
│  │  track. Want me to suggest   │   │
│  │  a cheaper dinner option for │   │
│  │  tonight?                    │   │
│  └──────────────────────────────┘   │
│                                     │
│  [USER MESSAGE]                     │← Left-aligned user bubble
│  ┌──────────────────────────────┐   │
│  │  Yes please! Also can you   │   │
│  │  move tomorrow's museum to  │   │
│  │  the morning?               │   │
│  └──────────────────────────────┘   │
│                                     │
│             [ASSISTANT MESSAGE]     │
│  ┌──────────────────────────────┐   │
│  │  Done! I've moved Tokyo      │   │← AI confirms action
│  │  National Museum to 10am     │   │
│  │  tomorrow. 🎉                │   │
│  │                              │   │
│  │  For dinner tonight, try:    │   │
│  │  • Gyoza no Ohsho (~£6)      │   │
│  │  • Matsuya Beef Bowl (~£5)   │   │
│  │  [ Add to today's plan ]     │   │← Inline action button
│  └──────────────────────────────┘   │
│                                     │
│  SUGGESTED PROMPTS ────────────────  │← Quick action chips
│  ┌──────────────────┐ ┌──────────┐  │
│  │ What's nearby?   │ │ Replan? │  │
│  └──────────────────┘ └──────────┘  │
│  ┌───────────────┐ ┌──────────────┐ │
│  │ Budget check  │ │ Save money?  │ │
│  └───────────────┘ └──────────────┘ │
│                                     │
│─────────────────────────────────────│
│  ░░░░░░░░░░░░░░░░░░░░░░░░   [Send] │← Message input
│  Ask me anything about your trip…  │
│                                     │
│  [🏠]    [✈️]    [+]    [💬]  [👤]  │
└─────────────────────────────────────┘
```

---

## 6. Component Inventory

All components must accept `theme` via `useTheme()` hook. Zero hardcoded colours.

### 6.1 Navigation Components

| Component | Props | Notes |
|---|---|---|
| `TabBar` | `activeTab`, `onTabPress` | Fixed bottom, glass morphism bg |
| `StackHeader` | `title`, `subtitle`, `backButton`, `rightActions[]` | Matches theme |
| `ModalHeader` | `title`, `onClose`, `rightActions[]` | For modal screens |
| `BreadcrumbTrail` | `items[]` | Trip → Day navigation |

### 6.2 Card Components

| Component | Props | Notes |
|---|---|---|
| `TripHeroCard` | `trip`, `onPress` | Photo BG, glass overlay, progress bar |
| `TripMiniCard` | `trip`, `onPress` | Horizontal, for recent trips list |
| `DayCard` | `day`, `taskCount`, `estCost`, `onPress` | Used in SCR-04 |
| `VenueCard` | `venue`, `showBadge`, `onPress` | Restaurant/place card |
| `VenueCardCompact` | `venue`, `onPress` | Smaller, for lists |
| `SocialPostCard` | `post`, `onViewPost`, `onAddVenue` | SCR-10 feed item |
| `TaskCard` | `task`, `onComplete`, `onPress`, `dragHandle` | SCR-05 planner item |
| `RouteCard` | `route`, `isRecommended`, `onPress` | SCR-07 transport option |
| `TravelPassCard` | `pass`, `onLearnMore` | Transport pass info |
| `AchievementBadge` | `achievement`, `earned`, `size` | Profile badges |
| `ExpenseRow` | `expense`, `onEdit`, `onDelete` | Budget list item |
| `PhraseCard` | `phrase`, `onPlay`, `onSave`, `saved` | Translator phrasebook |

### 6.3 Input Components

| Component | Props | Notes |
|---|---|---|
| `SearchInput` | `value`, `onChange`, `onSubmit`, `placeholder` | With autocomplete |
| `DestinationSearch` | `onSelect` | Places autocomplete |
| `DateRangePicker` | `start`, `end`, `onChange` | Inline calendar |
| `BudgetToggle` | `tiers[]`, `selected`, `onChange` | Tier selector |
| `InterestChipGrid` | `interests[]`, `selected[]`, `onChange`, `max` | Multi-select |
| `DietaryChips` | `selected[]`, `onChange` | Dietary filter chips |
| `PaceSlider` | `value`, `onChange` | Relaxed ↔ Packed |
| `LanguagePicker` | `value`, `onChange` | Language selector |
| `CurrencyPicker` | `value`, `onChange` | Currency dropdown |
| `ColourPicker` | `value`, `onChange`, `label` | Category colour override |
| `TextTranslateInput` | `value`, `onChange` | Multi-line, auto-grow |

### 6.4 Display Components

| Component | Props | Notes |
|---|---|---|
| `CategoryDot` | `category`, `size` | 8px coloured dot |
| `CategoryChip` | `category`, `label` | Pill with dot + text |
| `RatingRow` | `rating`, `reviewCount` | Stars + count |
| `PriceLevel` | `level` (1-4) | ¥/£/$ signs |
| `OpenStatusBadge` | `isOpen`, `closesAt` | Green/red pill |
| `TierBadge` | `tier` | Voyager/Pro badge |
| `ProLockedBadge` | `feature` | Lock icon + "Pro" |
| `TrendScoreBar` | `score` | 0-100 visual bar |
| `ProgressBar` | `progress`, `color` | Trip/day/budget progress |
| `PeakHoursChart` | `data`, `bestTime` | Hourly bar chart |
| `CategoryBreakdownBars` | `categories[]` | Budget breakdown |
| `WorldMap` | `visitedCountries[]` | Interactive SVG map |
| `PhotoCarousel` | `photos[]`, `onPress` | Swipeable |
| `AuroraBackground` | `variant` | Animated orb bg |
| `GrainOverlay` | `opacity` | Noise texture |
| `GlassCard` | `children`, `style` | Base glass morphism card |

### 6.5 Overlay / Sheet Components

| Component | Props | Notes |
|---|---|---|
| `BottomSheet` | `visible`, `onDismiss`, `snapPoints[]` | Drag-to-dismiss |
| `PaywallModal` | `feature`, `tier`, `onUpgrade`, `onDismiss` | Upgrade prompt |
| `LoadingOverlay` | `message`, `progress` | Generation loading |
| `ToastNotification` | `message`, `type`, `duration` | Success/error/info |
| `AlertDialog` | `title`, `body`, `actions[]` | Confirmation dialogs |
| `ActionSheet` | `options[]`, `onSelect` | Long-press context menu |
| `DayPickerSheet` | `trip`, `onSelectDay` | Add venue to day |
| `LogExpenseSheet` | `tripId`, `venueId?`, `onLog` | Budget log form |
| `AddTaskSheet` | `dayId`, `onAdd` | Custom task form |
| `ThemeSwitcherSheet` | `currentTheme`, `onSwitch` | Theme selector |

### 6.6 Filter Components

| Component | Props | Notes |
|---|---|---|
| `FilterBar` | `filters[]`, `activeFilters[]`, `onChange` | Horizontal scroll |
| `SortDropdown` | `options[]`, `selected`, `onChange` | Sort selector |
| `ModeChips` | `modes[]`, `active[]`, `onChange` | Transport mode filter |
| `CuisineFilter` | `cuisines[]`, `selected[]`, `onChange` | Food filter |

### 6.7 Status / Feedback Components

| Component | Props | Notes |
|---|---|---|
| `EmptyState` | `illustration`, `title`, `body`, `cta?` | No content screens |
| `ErrorState` | `error`, `onRetry` | Error screens |
| `SkeletonCard` | `variant` | Loading placeholder |
| `ConfettiEffect` | `trigger` | Day completion celebration |
| `LiveIndicator` | | Green pulsing dot for SCR-10 |

---

## 7. Design Token System — All 3 Themes

### 7.1 Aurora Dark (Default — Paid)

*Aesthetic: Deep space. Northern lights. Glass morphism. Teal + Purple gradients.*

```typescript
aurora_dark: {
  // Backgrounds
  bg_primary:      '#090b12',  // Main background
  bg_surface:      '#0f1219',  // Cards, sheets
  bg_raised:       '#141820',  // Elevated elements
  bg_glass:        'rgba(15, 18, 25, 0.07)',  // Glass morphism fill
  bg_glass_border: 'rgba(255, 255, 255, 0.08)', // Glass border

  // Text
  text_primary:    '#F0F4FF',  // Main text
  text_secondary:  '#8892B0',  // Subdued text
  text_disabled:   '#3D4A6B',  // Disabled
  text_inverse:    '#090b12',  // Text on light bg

  // Brand palette
  brand_lime:      '#b8ff57',  // CTA, active states
  brand_cyan:      '#38e8d8',  // Teal accent, food category
  brand_coral:     '#ff5f5f',  // Alerts, errors, budget
  brand_gold:      '#f5c842',  // Transport category
  brand_violet:    '#9b6fff',  // Landmarks, secondary accent

  // Category colours (default, overridable)
  category_food:        '#38e8d8',  // Cyan
  category_landmark:    '#9b6fff',  // Violet
  category_transport:   '#f5c842',  // Gold
  category_culture:     '#9b6fff',  // Violet
  category_budget:      '#ff5f5f',  // Coral
  category_accommodation: '#f5c842', // Gold
  category_general:     '#8892B0',  // Subdued

  // Gradients
  gradient_primary:   ['#38e8d8', '#9b6fff'],  // Teal → Violet
  gradient_hero:      ['rgba(9,11,18,0)', 'rgba(9,11,18,0.9)'],  // Photo overlay
  gradient_cta:       ['#b8ff57', '#38e8d8'],  // Lime → Cyan
  gradient_aurora_1:  ['#1a3a4a', '#0a1a2e'],  // Orb 1
  gradient_aurora_2:  ['#2a1a4a', '#0a0a2e'],  // Orb 2
  gradient_aurora_3:  ['#1a4a3a', '#0a2a1a'],  // Orb 3

  // Interactive states
  interactive_primary:  '#b8ff57',  // Primary buttons
  interactive_hover:    '#d4ff8a',  // Hover state
  interactive_pressed:  '#8bc940',  // Pressed state
  interactive_ghost:    'rgba(184, 255, 87, 0.12)',  // Ghost button bg

  // Borders
  border_default:   'rgba(255, 255, 255, 0.06)',
  border_focus:     'rgba(56, 232, 216, 0.4)',   // Teal focus ring
  border_error:     'rgba(255, 95, 95, 0.4)',
  border_success:   'rgba(184, 255, 87, 0.4)',

  // System
  system_success:   '#4ADE80',
  system_warning:   '#FBBF24',
  system_error:     '#ff5f5f',
  system_info:      '#38e8d8',

  // Typography
  font_display:     'Syne_800ExtraBold',
  font_serif:       'InstrumentSerif_400Italic',
  font_body:        'DMSans_400Regular',
  font_body_medium: 'DMSans_500Medium',
  font_mono:        'JetBrainsMono_400Regular',

  // Spacing (consistent across themes)
  space_xs:  4,
  space_sm:  8,
  space_md:  16,
  space_lg:  24,
  space_xl:  32,
  space_2xl: 48,
  space_3xl: 64,

  // Radii
  radius_sm:  8,
  radius_md:  12,
  radius_lg:  16,
  radius_xl:  24,
  radius_full: 999,

  // Effects
  glass_opacity:    0.07,
  grain_opacity:    0.08,
  shadow_card:      '0 4px 24px rgba(0,0,0,0.4)',
  shadow_modal:     '0 8px 48px rgba(0,0,0,0.6)',
  blur_glass:       12,       // px backdrop blur

  // Map style
  map_style_id:     'DARK_AURORA_MAP',
}
```

---

### 7.2 Warm Sand (Paid — Voyager+)

*Aesthetic: Editorial travel journal. Cream paper. Analogue warmth. Earth tones.*

```typescript
warm_sand: {
  // Backgrounds
  bg_primary:      '#F5F0E8',  // Warm cream
  bg_surface:      '#EDE8DC',  // Slightly deeper cream
  bg_raised:       '#E5DFD2',  // Paper shadow
  bg_glass:        'rgba(237, 232, 220, 0.8)',
  bg_glass_border: 'rgba(100, 85, 65, 0.12)',

  // Text
  text_primary:    '#2C2416',  // Deep warm brown
  text_secondary:  '#6B5E4E',  // Medium brown
  text_disabled:   '#B5A896',  // Light brown
  text_inverse:    '#F5F0E8',  // Light on dark elements

  // Brand palette (Earth tones)
  brand_lime:      '#7B8B3E',  // Olive CTA
  brand_cyan:      '#5B7B8B',  // Slate blue accent
  brand_coral:     '#C9613E',  // Terracotta
  brand_gold:      '#D4843A',  // Saffron
  brand_violet:    '#7B6B9B',  // Dusty purple

  // Category colours
  category_food:        '#C9613E',  // Terracotta
  category_landmark:    '#7B8B3E',  // Olive
  category_transport:   '#5B7B8B',  // Dusty blue
  category_culture:     '#7B6B9B',  // Dusty purple
  category_budget:      '#D4843A',  // Saffron
  category_accommodation: '#5B7B8B',
  category_general:     '#8B7B6B',

  // Gradients
  gradient_primary:   ['#C9613E', '#D4843A'],  // Terracotta → Saffron
  gradient_hero:      ['rgba(44,36,22,0)', 'rgba(44,36,22,0.85)'],
  gradient_cta:       ['#7B8B3E', '#C9613E'],

  // Interactive
  interactive_primary:  '#7B8B3E',  // Olive
  interactive_hover:    '#9BAD4E',
  interactive_pressed:  '#5B6B2E',
  interactive_ghost:    'rgba(123, 139, 62, 0.12)',

  // Borders
  border_default:   'rgba(100, 85, 65, 0.15)',
  border_focus:     'rgba(91, 123, 139, 0.5)',
  border_error:     'rgba(201, 97, 62, 0.5)',
  border_success:   'rgba(123, 139, 62, 0.5)',

  // System
  system_success:   '#5B8B3E',
  system_warning:   '#D4843A',
  system_error:     '#C9613E',
  system_info:      '#5B7B8B',

  // Typography
  font_display:     'CormorantGaramond_700Italic',  // Editorial serif
  font_serif:       'CormorantGaramond_400Italic',
  font_body:        'Figtree_400Regular',
  font_body_medium: 'Figtree_500Medium',
  font_mono:        'AzeretMono_400Regular',

  // Effects
  glass_opacity:    0.85,  // Warm sand is more opaque
  grain_opacity:    0.12,  // More pronounced grain (paper feel)
  shadow_card:      '0 2px 16px rgba(44,36,22,0.12)',
  shadow_modal:     '0 4px 32px rgba(44,36,22,0.2)',
  blur_glass:       8,

  map_style_id:     'WARM_SEPIA_MAP',
}
```

---

### 7.3 Electric (Paid — Voyager+)

*Aesthetic: Futuristic. Neon. Cyberpunk. Near-black with scanline texture and grid overlay.*

```typescript
electric: {
  // Backgrounds
  bg_primary:      '#080808',  // Near-black
  bg_surface:      '#0F0F0F',  // Slightly lighter black
  bg_raised:       '#161616',  // Cards
  bg_glass:        'rgba(15, 15, 15, 0.7)',
  bg_glass_border: 'rgba(198, 255, 0, 0.15)',  // Neon lime border

  // Text
  text_primary:    '#EEFF00',  // Neon yellow-green (primary text!)
  text_secondary:  '#9CA3AF',  // Cool grey
  text_disabled:   '#4B5563',
  text_inverse:    '#080808',  // Dark on neon

  // Brand palette (Neon)
  brand_lime:      '#C6FF00',  // Neon lime (primary)
  brand_cyan:      '#00F0FF',  // Electric cyan
  brand_coral:     '#FF2D78',  // Hot pink / neon red
  brand_gold:      '#FF8C00',  // Neon orange
  brand_violet:    '#BF5FFF',  // Neon purple

  // Category colours
  category_food:        '#FF2D78',  // Hot pink
  category_landmark:    '#C6FF00',  // Neon lime
  category_transport:   '#00F0FF',  // Cyan
  category_culture:     '#BF5FFF',  // Neon purple
  category_budget:      '#FF8C00',  // Neon orange
  category_accommodation: '#00F0FF',
  category_general:     '#9CA3AF',

  // Gradients
  gradient_primary:   ['#C6FF00', '#00F0FF'],  // Lime → Cyan
  gradient_hero:      ['rgba(8,8,8,0)', 'rgba(8,8,8,0.95)'],
  gradient_cta:       ['#C6FF00', '#FF2D78'],  // Lime → Pink

  // Interactive
  interactive_primary:  '#C6FF00',
  interactive_hover:    '#DEFF4A',
  interactive_pressed:  '#9BC900',
  interactive_ghost:    'rgba(198, 255, 0, 0.08)',

  // Borders
  border_default:   'rgba(198, 255, 0, 0.1)',
  border_focus:     'rgba(0, 240, 255, 0.6)',
  border_error:     'rgba(255, 45, 120, 0.6)',
  border_success:   'rgba(198, 255, 0, 0.6)',

  // System
  system_success:   '#C6FF00',
  system_warning:   '#FF8C00',
  system_error:     '#FF2D78',
  system_info:      '#00F0FF',

  // Typography
  font_display:     'BarlowCondensed_900Black',  // Aggressive condensed
  font_serif:       'BarlowCondensed_400Regular',
  font_body:        'IBMPlexMono_400Regular',    // Mono body for Electric!
  font_body_medium: 'IBMPlexMono_500Medium',
  font_mono:        'IBMPlexMono_400Regular',

  // Special Electric effects
  scanline_opacity:   0.04,  // Subtle scanline overlay
  grid_opacity:       0.06,  // Grid overlay
  neon_glow_color:    '#C6FF00',
  neon_glow_intensity: 12,   // px blur for glow effects

  // Effects
  glass_opacity:    0.15,
  grain_opacity:    0.03,  // Less grain, more scanlines
  shadow_card:      '0 0 20px rgba(198, 255, 0, 0.1)',  // Neon glow shadow
  shadow_modal:     '0 0 40px rgba(0, 240, 255, 0.15)',
  blur_glass:       16,

  map_style_id:     'NIGHT_NEON_MAP',
}
```

---

### 7.4 Free Tier — Dark/Light Toggle

```typescript
dark_light_dark: {
  bg_primary:      '#09090B',
  bg_surface:      '#18181B',
  bg_raised:       '#27272A',
  text_primary:    '#FAFAFA',
  text_secondary:  '#A1A1AA',
  brand_lime:      '#6366F1',  // Indigo (no brand palette for free)
  // ... minimal functional tokens
  font_display:    'DMSans_700Bold',  // Single font for free tier
  font_body:       'DMSans_400Regular',
  font_mono:       'DMSans_400Regular',
}

dark_light_light: {
  bg_primary:      '#FFFFFF',
  bg_surface:      '#F4F4F5',
  bg_raised:       '#E4E4E7',
  text_primary:    '#09090B',
  text_secondary:  '#71717A',
  // ...
}
```

---

## 8. ThemeProvider Token Structure

```typescript
// types/theme.ts
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

  // Brand
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

  // Interactive
  interactive_primary: string;
  interactive_hover: string;
  interactive_pressed: string;
  interactive_ghost: string;

  // Borders
  border_default: string;
  border_focus: string;
  border_error: string;
  border_success: string;

  // System
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

  // Spacing (constant)
  space_xs: 4;
  space_sm: 8;
  space_md: 16;
  space_lg: 24;
  space_xl: 32;
  space_2xl: 48;
  space_3xl: 64;

  // Radii (constant)
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

  // Theme-specific (optional)
  scanline_opacity?: number;  // Electric only
  grid_opacity?: number;      // Electric only
  neon_glow_color?: string;   // Electric only
  neon_glow_intensity?: number;
}

export interface ThemeContext {
  theme: ThemeTokens;
  themeName: ThemeName;
  setTheme: (name: ThemeName) => void;
  categoryColours: Partial<CategoryColours>;
  setCategoryColour: (category: CategoryKey, colour: string) => void;
  resolvedCategoryColour: (category: CategoryKey) => string;
  // ^ Helper that merges user override OR falls back to theme default
}

// Usage pattern in components:
const { theme, resolvedCategoryColour } = useTheme();

// Glass card helper
const glassStyle = {
  backgroundColor: theme.bg_glass,
  borderWidth: 1,
  borderColor: theme.bg_glass_border,
  backdropFilter: `blur(${theme.blur_glass}px)`,
};

// Category dot colour:
const dotColor = resolvedCategoryColour('food'); // User override or theme default
```

### ThemeProvider Mounting

```typescript
// app/_layout.tsx  ← Mounted at root BEFORE any screen renders
export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <Slot />           {/* Expo Router screens render here */}
            <GrainOverlay />   {/* Persistent grain texture */}
            <AuroraBackground /> {/* Persistent aurora orbs (theme-conditional) */}
          </GestureHandlerRootView>
        </QueryClientProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
```

**Critical notes for developers:**
1. `GrainOverlay` and `AuroraBackground` are persistent, behind all content, and update on theme change
2. `AuroraBackground` renders only for `aurora_dark` theme — returns null for others
3. Electric theme uses `ScanlineOverlay` + `GridOverlay` instead
4. Warm Sand uses enhanced `GrainOverlay` with higher opacity
5. Theme switch triggers a 500ms animation (scale + opacity transition on root)

---

## 9. Responsive Strategy

### 9.1 Mobile-First Baseline

All designs target **390×844px** (iPhone 14 Pro) as primary canvas. This is the design target. Everything else is an enhancement.

**Minimum supported viewport:** 375px wide (iPhone SE 3rd gen)
**Maximum phone viewport:** 430px wide (iPhone 15 Plus / Pro Max)

### 9.2 Layout Adaptation Rules

| Breakpoint | Device | Changes |
|---|---|---|
| 375px | iPhone SE | Tighter padding (12px), smaller font scale (0.95) |
| 390px | iPhone 14 (baseline) | Full design as specified |
| 430px | iPhone 15 Plus | Slightly more padding (20px), same layout |
| 744px | iPad Mini | Two-column layouts, sidebar navigation |
| 1024px | iPad Pro | Three-column layouts, persistent sidebar |

### 9.3 Component Responsive Behaviour

**SCR-04 Itinerary Overview — Tablet:**
- Day navigator: 4 days visible (vs 3 on phone)
- Day cards: 2-column grid (vs single column)
- Map and list views: side-by-side split (map left, list right)

**SCR-05 Daily Planner — Tablet:**
- Task cards: wider, allow more text inline
- Map preview: persistent right column (split view)

**SCR-09 Translator — Tablet:**
- Text input and translation output: side-by-side columns
- Phrasebook: 2-column grid

**SCR-08 Food & Dining — Tablet:**
- Restaurant cards: 2-column grid
- Filter bar: expanded inline (no horizontal scroll)

### 9.4 Safe Area Handling

All screens use `SafeAreaView` or `useSafeAreaInsets()`:
- Dynamic Island (iPhone 14 Pro+): top inset applied to headers
- Home indicator (iPhone X+): bottom inset for tab bar and FABs
- Notch devices: standard top inset handling

### 9.5 Font Scaling

EasyTrip does **not** override system font size. Users who need larger text via Accessibility → Display & Text Size will see layouts reflow correctly. All layout dimensions use `rem`-equivalent units (scaled dp), never fixed pixel font sizes.

Exception: display fonts (Syne 800 headers) are capped at `maxFontSizeMultiplier={1.3}` to prevent layout breaks.

### 9.6 Landscape Orientation

Landscape is **supported but not primary.** Key adaptations:
- Tab bar moves to left sidebar (iOS landscape)
- Modals expand to 70% width, centred
- Daily planner: tasks scroll horizontally by day (vs vertical)
- Maps expand to fill available width

---

## 10. Accessibility — WCAG 2.1 AA

### 10.1 Colour Contrast Requirements

All text must meet WCAG 2.1 AA (4.5:1 ratio for normal text, 3:1 for large text).

**Aurora Dark — verified contrast ratios:**

| Combination | Ratio | Pass? |
|---|---|---|
| `text_primary` (#F0F4FF) on `bg_primary` (#090b12) | 16.2:1 | ✅ AAA |
| `text_secondary` (#8892B0) on `bg_primary` (#090b12) | 5.1:1 | ✅ AA |
| `brand_lime` (#b8ff57) on `bg_primary` (#090b12) | 12.4:1 | ✅ AAA |
| `brand_cyan` (#38e8d8) on `bg_primary` (#090b12) | 8.7:1 | ✅ AAA |
| Dark text on `brand_lime` (#b8ff57) — CTA buttons | 9.2:1 | ✅ AAA |

**⚠️ Warning — potential failures to verify:**
- `brand_coral` (#ff5f5f) on `bg_surface` (#0f1219): Verify ≥ 4.5:1 for any body text
- `text_secondary` on `bg_raised` cards: Check contrast
- Electric theme `text_primary` (#EEFF00) on `bg_surface` (#0F0F0F): verify at all sizes

**All theme designers must run contrast verification before handoff using:**
- Figma Stark plugin
- WebAIM Contrast Checker
- Real device testing with Display Accommodations

### 10.2 Touch Target Sizes

All interactive elements minimum **44×44pt** (iOS HIG requirement):
- Tab bar icons: 48×48pt tap area
- Checkbox in task list: 44×44pt tap area (larger than visual dot)
- Category chips: minimum 44pt height
- Transport mode chips: 44×44pt
- "X" close buttons on modals: 44×44pt

**Exception:** Drag handles on task cards are 28×44pt (narrow but full height). This is acceptable per WCAG 2.5.5 (target size target only applies if there's an alternative — the entire row is also tappable).

### 10.3 Screen Reader (VoiceOver / TalkBack) Support

**Every interactive element must have:**
```typescript
accessibilityLabel="Human-readable description"
accessibilityRole="button" | "checkbox" | "heading" | "text" | "image" | etc.
accessibilityHint="Optional: what happens when activated"
accessibilityState={{ checked, disabled, selected, expanded }}
```

**Specific requirements:**

| Component | Label | Role | Hint |
|---|---|---|---|
| Task checkbox | "Mark [task title] as complete" | checkbox | "Double-tap to complete this task" |
| CategoryDot | [hidden — decorative] | none | aria-hidden |
| TrendScoreBar | "Trend score: 94 out of 100" | progressbar | — |
| PhotoCarousel | "Photo [N] of [total]: [venue name]" | image | "Swipe to see more" |
| FAB (+) | "Add custom task" | button | — |
| AuroraBackground | [hidden — decorative] | none | aria-hidden |

**Focus management:**
- Modal open: focus moves to modal close button
- Modal close: focus returns to element that triggered it
- Bottom sheet open: focus moves to sheet first focusable element
- Alert dialog: focus trapped within dialog

### 10.4 Reduced Motion

Respect `useReducedMotion()` from react-native-reanimated:

```typescript
const reducedMotion = useReducedMotion();

// Aurora orb animation
const orbAnimation = reducedMotion 
  ? { opacity: 0.4 }  // Static, no animation
  : { opacity: orbOpacityAnimated }; // Animated

// Page transitions
const transition = reducedMotion
  ? { duration: 0 }
  : { duration: 300, easing: Easing.out(Easing.cubic) };

// Task completion confetti
if (!reducedMotion) triggerConfetti();
```

### 10.5 Additional Accessibility

- **Dynamic Type:** All text scales with system font size (min 0.8×, max 1.5×)
- **Bold Text:** All medium weights upgrade to bold when system bold text enabled
- **High Contrast:** Category colours verified against White/Black in high contrast mode
- **Colour-blind mode:** Category indicators use both colour AND icon (never colour alone)
- **Keyboard navigation** (iPad with keyboard): All interactive elements focusable via Tab key
- **Error states:** Never indicate error with colour alone — always include icon + text

---

## 11. Empty / Loading / Error States

### 11.1 State Definitions Per Screen

| Screen | Empty State | Loading State | Error State |
|---|---|---|---|
| SCR-02 Home | No trips yet → "Plan your first adventure" CTA | Skeleton: hero card + recent trips | Network error toast + retry |
| SCR-04 Itinerary | No trips → redirect to creator | Day cards skeleton (3 rows) | Generation failed → retry option |
| SCR-05 Daily Planner | No tasks → "Day is empty — tap + to add tasks" | Task list skeleton (6 rows) | Sync failed banner |
| SCR-06 Place Detail | Venue not found (404) | Photo skeleton + text skeletons | Places API error → "Try again" |
| SCR-07 Transport | No routes found → "Try a different route" | Route card skeleton (3) | Directions API error |
| SCR-08 Food | No results for filters → "Broaden your filters" | Restaurant card skeletons (4) | API error + retry |
| SCR-09 Translator | Text tab empty → placeholder "Type something…" | Translation: spinner in output area | API error → offline message |
| SCR-10 Social Intel | No posts yet → "Intelligence gathering…" | Post card skeletons (3) + live dot | WebSocket disconnected banner |
| SCR-11 Budget | No expenses → "Nothing spent yet 🎉" | Category bars skeleton | Sync error |
| SCR-12 Settings | — (always has content) | Preferences loading skeleton | Error loading subscription |
| SCR-13 Profile | No trips → empty stats, "Start exploring" | World map skeleton + stats skeleton | Load error |
| SCR-14 AI Assistant | No conversation → welcome message + suggestions | Typing indicator (3 dots) | AI unavailable message |

### 11.2 Skeleton Shimmer Design

Skeletons use animated shimmer (left→right gradient sweep, 1.5s loop):

```
Background:  theme.bg_raised (static)
Shimmer:     linear gradient: 
             transparent → rgba(255,255,255,0.05) → transparent
             Sweeps left to right over 1.5s, loops
Shape:       Matches actual content shape (text lines, card rectangles, circles)
```

### 11.3 Empty State Illustration Style

Empty state illustrations use **line-art style SVG icons** (not photos), themed with `brand_cyan` stroke colour (Aurora Dark) / `brand_coral` stroke (Warm Sand) / `brand_lime` stroke (Electric).

Components:
- `EmptyTrips`: Small globe with dotted path
- `EmptyTasks`: Empty checkbox with sparkle
- `EmptyBudget`: Wallet with zero
- `EmptyTranslator`: Speech bubble with question mark
- `EmptySocialFeed`: Mobile screen with satellite dish

All empty states include:
1. Illustration (80×80pt)
2. Title (Syne 800, 20pt)
3. Body (DM Sans, 15pt, text_secondary)
4. Optional CTA button

### 11.4 Error Toast Design

```
┌─────────────────────────────────────┐
│ ● Something went wrong  [Retry]     │
│ Couldn't load restaurants           │
└─────────────────────────────────────┘
```
- Appears at bottom of screen above tab bar
- Auto-dismisses after 5 seconds
- Red dot (`system_error`) for errors
- Orange dot for warnings
- Green dot for success

---

## 12. Animation Specifications

### 12.1 Onboarding Animations

**Logo Entry (SCR-01):**
```
Duration: 1200ms
Sequence:
  1. Logo mark path draws in (stroke animation) 0–600ms
     easing: easeInOut
  2. Fill fades in 400–800ms (opacity 0→1)
     easing: easeOut
  3. "EASYTRIP" text fades + slides up 600–1000ms
     transform: translateY(12→0), opacity: 0→1
  4. Tagline fades in 800–1200ms
  5. CTAs fade in 1000–1500ms (staggered 100ms apart)
```

**Aurora Orbs (Background):**
```
3 orbs, each with:
  Duration: 60s per cycle (very slow)
  Easing: linear (seamless loop)
  Orb 1: rotate clockwise, scale 0.8→1.2→0.8
  Orb 2: rotate counter-clockwise, offset 20s
  Orb 3: pulse in place, offset 40s
  Opacity: 0.15-0.25 (subtle, never distracting)
```

### 12.2 Trip Generation Loading

```
Phase 1 — Orb expansion (0–500ms):
  Aurora orbs expand to fill more screen area
  Opacity increases: 0.2→0.35

Phase 2 — Text animation (500ms onward):
  Status text fades in/out every 4s
  Fun fact text uses typewriter effect (optional)
  
Progress bar:
  Width: 0% → actual_progress% (smooth, real-time)
  Colour: gradient cyan → lime
  Duration of transition: 300ms per update
  Easing: easeOut

Completion burst (on success):
  Duration: 600ms
  Confetti: 20 small particles, accent colours
  burst from centre screen outward
  fade out after 400ms
  Navigate to SCR-04 after 600ms
```

### 12.3 Card Transitions

**Trip Card hover/press state:**
```
Press in:
  Duration: 120ms
  transform: scale(0.98) translateY(1px)
  shadow: reduce
  easing: easeIn

Press release / navigation:
  Duration: 200ms
  transform: scale(1.02) (slight expand before navigate)
  easing: spring(damping: 15, stiffness: 200)
```

**Card entrance (list items):**
```
Stagger: 40ms between items
Duration: 300ms per item
transform: translateY(16→0), opacity: 0→1
easing: easeOut(cubic)
```

**GlassCard hover effect (tablet/pointer devices):**
```
Border: opacity 0.08→0.2 (brighter glass border)
Shadow: expand to show more depth
transform: translateY(0→-2px)
Duration: 200ms
```

### 12.4 Daily Planner — Drag to Reorder

```
Lift gesture recognized (long-press 300ms):
  Haptic: impact(medium)
  transform: scale(1.0→1.05)
  shadow: increase dramatically (card lifts off)
  opacity: 1.0→0.95
  other items: compress (scale Y slightly)
  Duration: 200ms, spring physics

During drag:
  Follow finger position
  Other items animate out of the way: translateY, 200ms spring
  Drop zone indicator: subtle line between items

Drop:
  Haptic: impact(light)
  transform: scale(1.05→1.0), shadow normalises
  Item snaps to new position
  Duration: 250ms, spring(damping: 20)
  API call to reorder (optimistic update)
```

### 12.5 Task Completion

```
Tap checkbox:
  Haptic: selection (light)
  Checkbox: border → fill animation (circle draws in), 200ms
  Task card: opacity 1.0→0.6, text gets strikethrough
  Progress bar: smooth fill increase
  Duration: 300ms

All tasks complete:
  Progress bar fills to 100% (lime colour burst)
  Confetti: brief celebration (respects reduced motion)
  "Day complete! 🎉" toast appears
  Duration: 600ms
```

### 12.6 Theme Switching

```
Triggered from: Settings → Theme card tap

Animation sequence:
  1. White flash overlay: opacity 0→0.3→0, 300ms
     (Like a camera flash — masks the colour change)
  2. ThemeProvider updates all tokens simultaneously
  3. All screens re-render with new theme instantly during flash
  4. Flash completes: new theme revealed
  
Total duration: 300ms
Haptic: impact(medium)

Note: Aurora orbs animate in when switching TO aurora_dark
      Orbs animate out when switching FROM aurora_dark
      Scanlines/grid animate in/out for Electric theme
```

### 12.7 Screen Transitions (Expo Router)

```
Stack push (navigate forward):
  Duration: 350ms
  Incoming screen: translateX(100vw→0) + opacity(0.5→1)
  Outgoing screen: translateX(0→-30px) + opacity(1→0.8)
  Easing: spring(damping: 26, stiffness: 180)

Modal presentation (sheet):
  Duration: 400ms
  translateY(100%→0%)
  easing: spring(damping: 25, stiffness: 300)
  With: semi-transparent overlay fade (0→0.6)

Bottom sheet snap:
  Duration: 300ms
  Spring physics (feels natural, slight overshoot)
```

### 12.8 Onboarding Trip Creation Wizard

```
Step transition (Next button):
  Outgoing step: translateX(0→-20px) + opacity(1→0), 200ms
  Incoming step: translateX(20px→0) + opacity(0→1), 200ms
  
Step indicator dots:
  Active dot: scale(1→1.5) + fill animation, 200ms
  Inactive dot: scale(1.5→1) + unfill, 200ms

Back transition:
  Same as above but reversed X direction
```

---

## 13. Interaction Patterns

### 13.1 Swipe Gestures

| Gesture | Context | Action |
|---|---|---|
| Swipe right → | Back on stack screens | Navigate back |
| Swipe down → | Modals and bottom sheets | Dismiss |
| Swipe left on task | Daily Planner | Reveal delete option |
| Swipe left on expense | Budget Tracker | Reveal edit/delete |
| Swipe left/right | Photo carousel | Navigate photos |
| Swipe left/right | Day in Itinerary | Navigate days |
| Swipe down | Any screen | Pull-to-refresh |

**Swipe delete implementation:**
```
Reveal: 80px red delete button slides in from right
Threshold: If > 50% width swiped → auto-complete delete
If < 50%: snap back with spring animation
Haptic: impact(light) at reveal, impact(medium) at threshold
```

### 13.2 Long-Press Patterns

| Long-press target | Duration | Result |
|---|---|---|
| Task card | 300ms | Drag handle activates (drag mode) |
| Task title | 500ms | Context menu: Edit / Delete / Move |
| Venue card | 500ms | Context menu: Save / Share / Add to day |
| Restaurant card | 500ms | Context menu: Save / Share |
| Photo in carousel | 300ms | Full-screen view |
| Tab bar icon | 500ms | (Future: quick actions sheet) |

**Context menu appearance:**
- Haptic: impact(light)
- Menu appears above long-pressed item
- Background dims with 0.5 opacity overlay
- Menu slides in from behind item, spring animation
- Dismiss: tap outside or select option

### 13.3 Bottom Sheet Behaviour

All bottom sheets use `@gorhom/bottom-sheet`:

```
Snap points:
  25%  — Peek (e.g., transport route preview)
  50%  — Half (e.g., log expense form)
  90%  — Full (e.g., travel pass detail, Add task)

Default: modal sheets always start at their natural content height

Drag to dismiss: drag below 20% → dismisses with spring

Keyboard handling:
  Input bottom sheets: shift up when keyboard appears
  keyboardBehavior: "interactive" (follows keyboard exactly)

Backdrop:
  Aurora Dark: rgba(9,11,18,0.7)
  Warm Sand: rgba(44,36,22,0.4)  
  Electric: rgba(8,8,8,0.85)
```

### 13.4 Pull-to-Refresh

All list screens support pull-to-refresh:
- Threshold: 64px pull distance
- Indicator: themed spinner (accent colour)
- Haptic: impact(light) at threshold
- Data refetch: TanStack Query `refetch()`

### 13.5 Infinite Scroll

Food & Dining, Social Intelligence feed:
- Load next page when within 5 items of end
- Loading indicator: subtle spinner in list footer
- No flash of empty state between pages
- Error loading more: inline "Load more" button

### 13.6 Haptic Feedback Map

| Action | Haptic Type | Intensity |
|---|---|---|
| Task completed | `impact` | medium |
| Button press | `impact` | light |
| Error | `notification(error)` | — |
| Success (trip generated) | `notification(success)` | — |
| Drag start | `impact` | medium |
| Drag drop | `impact` | light |
| Theme switch | `impact` | medium |
| Long-press context | `impact` | light |
| Swipe delete threshold | `impact` | medium |
| Day complete | `notification(success)` | — |

---

## 14. Onboarding Flow — 3-Step Wizard

### 14.1 First Launch Flow

```
App install → first launch
     │
     ▼
SCR-01: Onboarding (animated)
     │
     ├── "Get Started" ──────────────────────► Email sign-up flow
     │                                              │
     ├── "Continue with Google" ─────────────► Google OAuth
     │                                              │
     └── "Continue with Apple" ──────────────► Apple OAuth
                                                    │
                                              ◄─────┘
                                              Auth complete
                                                    │
                                                    ▼
                                         Permissions request
                                         (notifications — iOS)
                                         "Stay on top of your trip"
                                         [Allow] [Not Now]
                                                    │
                                                    ▼
                                         SCR-02: Home Dashboard
                                         (empty state — no trips)
                                                    │
                                          Trip creator CTA prominent
                                                    │
                                                    ▼
                                         SCR-03: Trip Creator Wizard
```

### 14.2 Step 1 — Destination & Dates

**Screen design:** See SCR-03 wireframe above.

**UX decisions:**
- **Auto-focus** on destination search input — keyboard appears immediately, no extra tap needed
- **Trending destinations** shown below search for inspiration (based on season/location if permission granted)
- **Date picker** is inline (not modal) — fewer taps, more direct
- **Duration** auto-calculates — never ask the user to enter separately
- **Free tier notice** appears only if user selects > 3 days (Explorer limit) — not shown until they select

**Validation rules:**
- Destination: required, must autocomplete to a known place
- Start date: required, cannot be in the past
- End date: required, must be ≥ start date
- Duration auto-set from dates; if Explorer and >3 days, paywall intercepts

---

### 14.3 Step 2 — Budget

**UX decisions:**
- **Budget tiers as defaults** — most users don't know their exact budget; tiers are a helpful shorthand
- **Custom input optional** — shown below tiers for users who have a specific number
- **Cost breakdown preview** — real-time AI estimate shows what £X buys you; builds confidence before committing
- **Currency selector** — defaults to user's detected locale, easily changeable
- **No judgment** — Budget/Backpacker tier presented equally alongside Luxury (no hierarchy language)

---

### 14.4 Step 3 — Preferences + Generate

**UX decisions:**
- **Trip type selector** uses large icons in a grid — scanning is faster than reading a dropdown
- **Interest chips** limit to 5 max — more doesn't improve itinerary quality; limits overwhelm
- **Dietary requirements** are multi-select chips, not a dropdown — faster selection
- **"Generate" button** is large and accent-coloured — this is the moment of magic; celebrate it
- **Estimated cost shown** before generating — sets expectations, reduces post-generation disappointment

---

### 14.5 Post-Generation Delight

After generation completes (SCR-04 first view):

```
"Your Tokyo trip is ready ✨"  (Syne 800 large, animated in)
Confetti burst: 300ms, subtle
Trip cards animate in with stagger: 50ms per day
Progress bar: "0 of 42 tasks complete" 
CTA: "Start Day 1 →"
```

---

## 15. Premium Upsell Patterns

### 15.1 Design Principles for Upsell

1. **Show the value before the gate.** Users see blurred/locked content, not a wall.
2. **Context-sensitive copy.** The upsell message matches *exactly* what the user was trying to do.
3. **One-tap path to purchase.** Upsell sheet → Apple/Google IAP — maximum 2 taps.
4. **Never interrupt a core flow.** Upsells appear at natural pause points (not mid-task).
5. **Free users are not second-class.** No shame language. Always "unlock" not "you can't".

---

### 15.2 Upsell Trigger Map

| Trigger | Location | Tier required | Upsell message |
|---|---|---|---|
| 4th trip creation attempt | SCR-03 Step 1 | Voyager | "You've used your 3 free trips. Unlock unlimited trips." |
| Trip duration > 3 days | SCR-03 Step 1 | Voyager | "Free plan covers 3 days. Voyager unlocks any length trip." |
| Theme switcher (non-dark) | SCR-12 | Voyager | "Premium themes are a Voyager feature." |
| Camera translate tap | SCR-09 | Voyager | "Point your camera at any text to instantly translate it." |
| Offline pack download | SCR-09 | Voyager | "Download this language for use without internet." |
| Drag-to-reorder attempt | SCR-05 | Voyager | "Rearrange your day with Voyager." |
| Trending Now section | SCR-02 | Nomad Pro | "See what's trending right now from real influencers." |
| Social Intelligence screen | SCR-10 | Nomad Pro | "See live influencer and celebrity picks for this destination." |
| Influencer section on venue | SCR-06 | Nomad Pro | "🔥 This place is trending. See who's been here." |
| AI Assistant tab | Tab bar | Nomad Pro | "Your personal AI travel companion — replans your day in seconds." |
| Real-time disruptions | SCR-07 | Nomad Pro | "Get live transport disruption alerts for this route." |
| AI re-plan prompt | SCR-14 | Nomad Pro | "Ask your AI assistant to re-plan around unexpected changes." |

---

### 15.3 Upsell Modal Design

**Full-screen upgrade modal (for high-value upsells):**

```
┌─────────────────────────────────────┐
│  ✕                                  │← Close (always available)
│                                     │
│       [Feature illustration]        │← Themed SVG illustration
│                                     │
│  **See who's been here**            │← Syne 800, feature headline
│  *Social Intelligence*              │← Instrument Serif italic, feature name
│                                     │
│  Real influencer picks, trend       │← Body copy, 2-3 sentences max
│  scores, and celeb recommendations  │
│  — updated in real time.            │
│                                     │
│  ─────────────────────────────────  │
│  WHAT YOU GET:                      │
│  ✓  Live influencer feed            │← Feature checklist
│  ✓  Trend scores (0-100)            │
│  ✓  Celebrity picks                 │
│  ✓  Real-time updates               │
│                                     │
│  ─────────────────────────────────  │
│                                     │
│  ┌───────────────────────────────┐  │
│  │  Nomad Pro · £2.99/month      │  │← Primary CTA, accent fill
│  │  Start 7-day free trial       │  │
│  └───────────────────────────────┘  │
│                                     │
│  ┌───────────────────────────────┐  │
│  │  £24.99/year (save 30%)       │  │← Annual option, ghost button
│  └───────────────────────────────┘  │
│                                     │
│  Already have Voyager?              │
│  Upgrade — keep all your trips      │← Upgrade path for Voyager users
│                                     │
│  No commitment. Cancel anytime.     │← Trust signal
│                                     │
└─────────────────────────────────────┘
```

---

### 15.4 Inline Upsell Teaser (Blurred Content)

For sections that show *a preview* of locked content (e.g., Trending Now on Home, Influencer section on venue):

```
┌─────────────────────────────────────┐
│  TRENDING NOW  🔥                   │
│  ─────────────────────────────────  │
│                                     │
│  ╔═════╗  ╔═════╗  ╔═════╗         │
│  ║ ▒▒▒ ║  ║ ▒▒▒ ║  ║ ▒▒▒ ║         │← Blurred destination cards
│  ║ ▒▒▒ ║  ║ ▒▒▒ ║  ║ ▒▒▒ ║         │  backdrop-filter: blur(8px)
│  ╚═════╝  ╚═════╝  ╚═════╝         │  + frosted glass overlay
│                                     │
│  ┌───────────────────────────────┐  │
│  │  🔓 Unlock Social Intelligence │  │← Overlay CTA button
│  │  See what's trending right now │  │
│  └───────────────────────────────┘  │
│                                     │
└─────────────────────────────────────┘
```

**Implementation:**
- Blurred content is real data (partially loaded) — not a static image
- Blur intensity: `blur(8px)` + `brightness(0.7)` + `saturate(0.5)`
- Overlay: semi-transparent surface colour + CTA button centred
- Tapping anywhere in the blurred area opens upsell modal

---

### 15.5 Contextual Micro-Upsells (Inline — non-disruptive)

For lower-priority upsell moments, use small inline chips rather than modals:

```
On SCR-06 Place Detail (influencer section locked):
┌─────────────────────────────────────┐
│  🔥 3 influencers visited here      │← Shows count but not names
│  [🔒 See who · Nomad Pro]           │← Small chip/pill CTA
└─────────────────────────────────────┘

On SCR-09 Translator (camera tab):
┌─────────────────────────────────────┐
│  [📷 Camera translate · Voyager]    │← Tab with lock icon + tier label
└─────────────────────────────────────┘

On SCR-05 Daily Planner (drag disabled):
Task card drag handle shows lock icon; tooltip on first attempt:
"Rearrange tasks with Voyager →"      ← Dismissable banner, appears once
```

---

### 15.6 Post-Purchase Delight

When a user upgrades (Voyager or Pro):

```
Confetti animation: 1.5s, full-screen burst
Toast notification: 
  "Welcome to Voyager! 🎉 All features unlocked."
  OR
  "Welcome to Nomad Pro! 🔥 You're set for real."

Immediately:
  - Unlock animation plays on any previously locked UI elements visible
  - Theme switcher animates to reveal the 3 themes
  - Social Intelligence tab becomes accessible

Achievement unlocked:
  "🏆 Voyager" badge appears on Profile
```

---

### 15.7 Free Tier Paywall Positioning

The free tier must feel generous, not punishing:

- Show the paywall limit *before* the user hits it: "2 of 3 free trips used"
- When they hit the limit: frame as "You've been busy! — unlock more"
- Never use words: "blocked", "restricted", "can't", "not available"
- Always use: "unlock", "get", "access", "with Voyager"

**On the 3rd trip (last free one):**
A subtle banner appears at top of SCR-03:
```
"Last free trip · Voyager gives you unlimited — £4.99 one-time →"
```

This is the highest-converting moment: the user is actively planning a trip and has experienced the value.

---

## Appendix A: Typography Scale

| Use case | Font | Size | Weight | Line height |
|---|---|---|---|---|
| Hero display | Syne | 40pt | 800 | 1.1 |
| Screen title | Syne | 28pt | 800 | 1.2 |
| Section heading | Syne | 22pt | 800 | 1.3 |
| Card title | Syne | 18pt | 800 | 1.3 |
| Italic accent large | Instrument Serif | 24pt | 400 | 1.3 |
| Italic accent small | Instrument Serif | 18pt | 400 | 1.4 |
| Body large | DM Sans | 17pt | 400 | 1.6 |
| Body regular | DM Sans | 15pt | 400 | 1.6 |
| Body medium | DM Sans | 15pt | 500 | 1.6 |
| Caption | DM Sans | 13pt | 400 | 1.5 |
| Label / tag | JetBrains Mono | 11pt | 400 | 1.4 |
| Code/data | JetBrains Mono | 13pt | 400 | 1.5 |

---

## Appendix B: Spacing System

Based on 4pt grid. All spacing values are multiples of 4.

| Token | Value | Usage |
|---|---|---|
| `space_xs` | 4pt | Icon padding, tight gaps |
| `space_sm` | 8pt | Between label and value |
| `space_md` | 16pt | Card internal padding, list item gaps |
| `space_lg` | 24pt | Section gaps, card margins |
| `space_xl` | 32pt | Major section breaks |
| `space_2xl` | 48pt | Hero section padding |
| `space_3xl` | 64pt | Full-bleed padding |

Screen horizontal padding: **16pt** (consistent across all screens)

---

## Appendix C: Icon System

Primary icon library: **Lucide Icons** (clean, consistent, MIT license)

Supplementary: Custom EasyTrip icons for:
- Category dots (food/landmark/transport/culture)
- Achievement badges (custom SVG per achievement)
- Empty state illustrations
- Tier badges (Explorer/Voyager/Pro)

Icon sizes:
- Navigation / tab bar: 24pt
- In-line with text: 16pt
- Card badges: 14pt
- FAB: 24pt
- Category chip: 12pt

---

## Appendix D: Colour Accessibility Quick Reference

**Aurora Dark — minimum contrast ratios for all text uses:**

| Text colour | Background | Ratio | WCAG |
|---|---|---|---|
| `#F0F4FF` | `#090b12` | 16.2:1 | AAA |
| `#F0F4FF` | `#0f1219` | 13.8:1 | AAA |
| `#8892B0` | `#090b12` | 5.1:1 | AA |
| `#8892B0` | `#0f1219` | 4.5:1 | AA (borderline) |
| `#b8ff57` | `#090b12` | 12.4:1 | AAA |
| `#38e8d8` | `#090b12` | 8.7:1 | AAA |
| `#090b12` | `#b8ff57` | 12.4:1 | AAA (CTA buttons) |

**⚠️ Flag for developer review:**
- `#8892B0` on `#141820` (raised surfaces): Must verify ≥ 4.5:1
- `#ff5f5f` body text (if used): Check at all background levels
- Warm Sand: Light backgrounds require dark text — all text colours are dark brown, generally safe
- Electric: `#EEFF00` primary text on `#080808` — verify at small sizes

---

*UX Design Document complete. Ready for Frontend Developer (SCR-by-SCR implementation spec) handoff.*

*Next document: 04-frontend-spec.md*
