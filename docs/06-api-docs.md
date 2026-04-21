# EasyTrip API Reference

**Version:** 1.0.0  
**Base URL:** `https://api.easytrip.app/api/v1`  
**Swagger UI:** `https://api.easytrip.app/docs`

---

## Overview

### Authentication

All endpoints (except `/auth/*`, `/health`, and public share endpoints) require a JWT in the `Authorization` header:

```
Authorization: Bearer <supabase-jwt>
```

Tokens are issued by Supabase Auth. Obtain one via the `/auth/login` or OAuth endpoints. Tokens expire per Supabase JWT settings; use `/auth/refresh` to renew.

### Tier Gating

Endpoints marked with a tier badge require the user to be on that subscription level or above. Calling a gated endpoint with an insufficient tier returns:

```json
HTTP 403
{
  "error": "upgrade_required",
  "required_tier": "voyager",
  "upsell_context": "..."
}
```

**Tier hierarchy:** `explorer` < `voyager` < `nomad_pro`

### Standard Response Format

**Success:**
```json
{ "data": { ... } }
```

**Paginated list:**
```json
{
  "data": [...],
  "meta": { "total": 42, "page": 1, "limit": 20, "has_more": true }
}
```

**Error:**
```json
{ "error": "error_code", "message": "Human-readable description" }
```

### Rate Limits

Global rate limit is applied per authenticated user (or IP for unauthenticated):

| Tier | Global | AI Generate | Social Feed |
|---|---|---|---|
| Explorer | 100 req/min | 3 lifetime | — |
| Voyager | 100 req/min | 1 concurrent | — |
| Nomad Pro | 100 req/min | 3 concurrent (priority) | 5 req/min |

Rate limit errors return HTTP `429` with a `Retry-After` header.

---

## Authentication

### `POST /auth/register`

Register with email and password.

**Request:**
```json
{ "email": "user@example.com", "password": "securepassword" }
```

**Response `201`:**
```json
{ "data": { "user": { "id": "uuid", "email": "..." }, "access_token": "...", "refresh_token": "..." } }
```

---

### `POST /auth/login`

Email + password login.

**Request:**
```json
{ "email": "user@example.com", "password": "securepassword" }
```

**Response `200`:** Same as register.

---

### `POST /auth/oauth/google`
### `POST /auth/oauth/apple`

OAuth callback handlers. Called with the OAuth code from the provider.

**Request:**
```json
{ "code": "oauth-code", "redirect_uri": "easytrip://auth/callback" }
```

---

### `POST /auth/refresh`

Exchange a refresh token for a new access token.

**Request:**
```json
{ "refresh_token": "..." }
```

---

### `POST /auth/logout`

Invalidates the current session.

---

### `POST /auth/forgot-password` / `POST /auth/reset-password`

Sends a reset email / confirms the reset with a new password.

---

### `GET /auth/me`

Returns the current authenticated user and their tier.

**Response:**
```json
{
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "display_name": "Alex",
    "tier": "voyager",
    "preferred_currency": "GBP",
    "preferred_language": "en",
    "theme": "aurora_dark"
  }
}
```

---

## Users & Profile

### `GET /users/me`

Full profile including stats and countries visited.

### `PATCH /users/me`

Update profile fields.

**Request (all optional):**
```json
{
  "display_name": "Alex",
  "preferred_currency": "EUR",
  "preferred_language": "fr",
  "avatar_url": "https://..."
}
```

### `GET /users/me/achievements`

Returns all earned achievements.

**Response:**
```json
{
  "data": [
    { "id": "first_trip", "name": "First Adventure", "earned_at": "2026-04-20T10:00:00Z" }
  ]
}
```

### `GET /users/me/entitlements`

Returns the user's current tier and feature flags. Poll this after a purchase to detect upgrades.

**Response:**
```json
{
  "data": {
    "tier": "nomad_pro",
    "tier_expires_at": "2026-05-20T00:00:00Z",
    "features": {
      "unlimited_trips": true,
      "themes": true,
      "ocr_translation": true,
      "offline_access": true,
      "social_intelligence": true,
      "ai_assistant": true
    }
  }
}
```

### `DELETE /users/me`

Initiates account deletion (GDPR). Soft-deletes all user data immediately; hard delete runs within 30 days.

---

## Trips

### `GET /trips`

List the authenticated user's trips.

**Query params:** `page` (default 1), `limit` (default 20, max 50), `status` (`draft` | `active` | `archived`)

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "destination": "Tokyo, Japan",
      "country_code": "JP",
      "start_date": "2026-06-01",
      "end_date": "2026-06-07",
      "duration_days": 7,
      "status": "active",
      "destination_confidence": "high"
    }
  ],
  "meta": { "total": 3, "page": 1, "limit": 20, "has_more": false }
}
```

---

### `POST /trips`

Create a new trip. This creates the trip record but does not generate the itinerary — call `/trips/:id/generate` next.

**Explorer tier:** max 3 trips, max 3-day duration. Returns `403 upgrade_required` if exceeded.

**Request:**
```json
{
  "destination": "Tokyo, Japan",
  "country_code": "JP",
  "city": "Tokyo",
  "destination_lat": 35.6762,
  "destination_lng": 139.6503,
  "start_date": "2026-06-01",
  "end_date": "2026-06-07",
  "timezone": "Asia/Tokyo",
  "budget_amount": 1500,
  "budget_currency": "GBP",
  "trip_type": "solo",
  "travel_preferences": {
    "dietary": ["vegetarian"],
    "pace": "moderate",
    "interests": ["food", "temples", "street art"]
  }
}
```

**Response `201`:** Full trip object.

---

### `GET /trips/:tripId`

Returns the trip with all itinerary days and tasks.

---

### `PATCH /trips/:tripId`

Update trip settings. Same fields as create, all optional.

---

### `DELETE /trips/:tripId`

Soft-deletes the trip (recoverable for 30 days).

---

### `POST /trips/:tripId/generate`

Trigger AI itinerary generation. Returns a `jobId` immediately; generation happens asynchronously (typically 10–30s).

**Request:**
```json
{ "force_regenerate": false }
```

**Response `202`:**
```json
{ "data": { "jobId": "uuid", "status": "queued" } }
```

Poll `GET /trips/:tripId/status` or listen for the `generation_complete` WebSocket event.

---

### `GET /trips/:tripId/status`

Poll generation status.

**Response:**
```json
{
  "data": {
    "id": "uuid",
    "status": "active",
    "ai_model_used": "claude-3-5-sonnet",
    "destination_confidence": "high"
  }
}
```

`status` values: `draft` (pending/generating), `active` (ready), `archived`

---

### `POST /trips/:tripId/regenerate-day` 🔒 Voyager+

Regenerate a single day without affecting the rest.

**Request:**
```json
{ "day_number": 3 }
```

**Response `202`:** `{ "data": { "jobId": "uuid", "status": "queued" } }`

---

### `GET /trips/:tripId/share-token` 🔒 Voyager+

Get or create a public share link.

**Response:**
```json
{
  "data": {
    "share_token": "abc123hex",
    "share_url": "https://easytrip.app/share/abc123hex"
  }
}
```

---

### `GET /trips/shared/:token`

Public endpoint (no auth). Returns a limited view of a shared trip.

---

## Itinerary & Tasks

### `GET /trips/:tripId/days`

All itinerary days with tasks and venue details.

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "day_number": 1,
      "date": "2026-06-01",
      "title": "Temples & Street Food",
      "summary": "Start in Asakusa, explore Nakamise, end with ramen in Shinjuku.",
      "tasks": [
        {
          "id": "uuid",
          "position": 0,
          "title": "Sensō-ji Temple",
          "category": "landmark",
          "start_time": "09:00",
          "end_time": "10:30",
          "duration_minutes": 90,
          "is_completed": false,
          "estimated_cost": 0,
          "travel_time_to_next_minutes": 15,
          "transport_mode": "walk",
          "venue": { "id": "uuid", "name": "Sensō-ji", "lat": 35.7147, "lng": 139.7966 }
        }
      ]
    }
  ]
}
```

---

### `GET /trips/:tripId/days/:dayId`

Single day with full task detail.

---

### `PATCH /trips/:tripId/days/:dayId`

Update day title or summary.

**Request:**
```json
{ "title": "My custom day title", "summary": "Updated summary" }
```

---

### `GET /trips/:tripId/days/:dayId/tasks`

List tasks for a day, ordered by position.

---

### `POST /trips/:tripId/days/:dayId/tasks` 🔒 Voyager+

Add a custom task to a day.

**Request:**
```json
{
  "title": "Afternoon coffee at Fuglen",
  "category": "food",
  "start_time": "14:30",
  "duration_minutes": 45,
  "estimated_cost": 5,
  "currency": "GBP"
}
```

**Response `201`:** Task object.

---

### `PATCH /trips/:tripId/days/:dayId/tasks/:taskId`

Update a task. Used for marking complete, editing times, logging actual cost.

**Request (all optional):**
```json
{
  "is_completed": true,
  "actual_cost": 12.50,
  "start_time": "10:15"
}
```

---

### `DELETE /trips/:tripId/days/:dayId/tasks/:taskId`

Delete a task.

---

### `POST /trips/:tripId/days/:dayId/tasks/reorder`

Reorder tasks by sending the new ordered array of task IDs.

**Request:**
```json
{ "task_ids": ["uuid-1", "uuid-3", "uuid-2"] }
```

**Response:** `{ "data": { "reordered": 3 } }`

---

## Places & Venues

### `GET /places/search`

Search for venues near a location.

**Query params:**

| Param | Type | Description |
|---|---|---|
| `lat` | number | Latitude |
| `lng` | number | Longitude |
| `radius` | number | Radius in metres (max 50000) |
| `category` | string | `food` \| `landmark` \| `transport` \| `culture` \| `accommodation` |
| `query` | string | Free text search |

**Response:** Array of venue objects.

---

### `GET /places/:placeId`

Venue detail. `:placeId` can be a Google Place ID or our internal UUID.

**Response:**
```json
{
  "data": {
    "id": "uuid",
    "name": "Tsukiji Outer Market",
    "category": "food",
    "address": "4 Chome-16-2 Tsukiji, Chuo City, Tokyo",
    "lat": 35.6654,
    "lng": 139.7707,
    "google_rating": 4.3,
    "google_review_count": 12500,
    "price_level": 2,
    "opening_hours": { "monday": [{ "open": "05:00", "close": "14:00" }], "..." : "..." },
    "photos": [{ "url": "https://...", "source": "google", "attribution": "..." }],
    "entry_fee": 0,
    "dietary_tags": ["vegan", "halal"],
    "peak_hours": { "monday": [0, 0, 5, 20, 60, 95, 100, 80, 40, 20, 10, 5] }
  }
}
```

---

### `GET /places/:placeId/photos`

Venue photos with attribution.

---

### `GET /places/:placeId/social-intel` 🔒 Nomad Pro

Social media posts mentioning this venue.

---

### `POST /places/:placeId/favourite` 🔒 Voyager+

Save venue to a trip.

**Request:** `{ "trip_id": "uuid" }`

---

## Transport

### `POST /transport/route`

Multi-modal route calculation.

**Request:**
```json
{
  "from": { "lat": 35.6762, "lng": 139.6503 },
  "to": { "lat": 35.6895, "lng": 139.6917 },
  "depart_at": "2026-06-01T09:00:00+09:00",
  "modes": ["walk", "metro"]
}
```

**Response:**
```json
{
  "data": [
    {
      "mode": "metro",
      "duration_minutes": 22,
      "distance_km": 8.4,
      "steps": [
        { "instruction": "Walk to Shibuya Station", "duration_minutes": 5 },
        { "instruction": "Take Ginza Line to Asakusa", "duration_minutes": 17 }
      ],
      "fare_estimate": { "amount": 2.10, "currency": "GBP" }
    }
  ]
}
```

---

### `GET /transport/passes`

Travel passes for a city.

**Query params:** `city`, `country_code`

**Response:**
```json
{
  "data": [
    {
      "pass_name": "Suica Card",
      "description": "Reloadable IC card for trains, buses, and convenience stores.",
      "cost_amount": 5.00,
      "cost_currency": "GBP",
      "validity_period": "Indefinite (balance kept)",
      "purchase_locations": "All JR stations, airports",
      "website_url": "https://www.jreast.co.jp/e/pass/suica.html",
      "last_verified_at": "2026-01-15"
    }
  ]
}
```

---

### `GET /transport/disruptions` 🔒 Nomad Pro *(v1.5)*

Live transport disruptions for a destination.

---

## Food & Dining

### `GET /food/search`

Restaurant search with filters.

**Query params:** `lat`, `lng`, `cuisine` (string), `dietary` (comma-separated: `vegan,halal,gluten_free`), `budget` (`budget` | `mid` | `luxury`), `radius`

---

### `GET /food/areas`

Best food areas for a destination.

**Query params:** `destination` or `country_code` + `city`

---

### `GET /food/local-dishes`

Recommended local dishes.

**Query params:** `country_code`, `city` (optional)

**Response:**
```json
{
  "data": [
    { "name": "Ramen", "description": "Wheat noodles in broth, served hot.", "category": "main" }
  ]
}
```

---

## Translation

### `POST /translate/text`

Translate text.

**Request:**
```json
{
  "text": "Where is the nearest metro station?",
  "target_lang": "ja",
  "source_lang": "en"
}
```

**Response:**
```json
{
  "data": {
    "text": "最寄りの地下鉄駅はどこですか？",
    "source_lang": "en"
  }
}
```

---

### `POST /translate/ocr` 🔒 Voyager+

OCR a photo and translate the detected text.

**Request:**
```json
{
  "image_base64": "data:image/jpeg;base64,...",
  "target_lang": "en"
}
```

**Response:**
```json
{
  "data": {
    "detected_text": "入口禁止",
    "translated_text": "No Entry",
    "language_detected": "ja",
    "blocks": [
      {
        "text": "入口禁止",
        "translated": "No Entry",
        "bounds": { "x": 10, "y": 20, "width": 120, "height": 40 }
      }
    ]
  }
}
```

---

### `GET /translate/phrasebook`

Get phrasebook entries for a language.

**Query params:** `language` (ISO 639-1, e.g. `ja`), `category` (optional: `greetings` | `transport` | `food` | `emergency` | `shopping` | `accommodation` | `general`)

---

### `GET /translate/phrasebook/:phraseId/audio` 🔒 Voyager+

Get audio pronunciation for a phrase. Returns a pre-signed CloudFront URL. Audio is generated on first request and cached permanently.

---

### `POST /translate/saved` 🔒 Voyager+

Save a phrase to the user's library.

**Request:**
```json
{
  "phrase_id": "uuid",
  "language_code": "ja"
}
```

---

### `GET /translate/saved` 🔒 Voyager+

Get user's saved phrases.

---

## Budget & Expenses

### `GET /trips/:tripId/budget`

Budget overview with spending by category.

**Response:**
```json
{
  "data": {
    "budget": {
      "total_amount": "1500.00",
      "currency": "GBP",
      "food_allocation": "400.00",
      "transport_allocation": "200.00",
      "accommodation_allocation": "600.00",
      "activities_allocation": "200.00",
      "other_allocation": "100.00"
    },
    "spending": {
      "food": 85.50,
      "transport": 32.00,
      "accommodation": 0,
      "activities": 0,
      "shopping": 0,
      "other": 0
    },
    "total_spent": 117.50,
    "remaining": 1382.50
  }
}
```

---

### `PATCH /trips/:tripId/budget`

Update budget or category allocations.

**Request (all optional):**
```json
{
  "total_amount": 2000,
  "currency": "GBP",
  "food_allocation": 500
}
```

---

### `POST /trips/:tripId/expenses`

Log an expense. Amounts are automatically converted to the trip's base currency.

**Request:**
```json
{
  "amount": 12.50,
  "currency": "GBP",
  "category": "food",
  "description": "Ramen at Ichiran",
  "venue_id": "uuid",
  "logged_at": "2026-06-02T12:30:00Z"
}
```

---

### `GET /trips/:tripId/expenses`

List expenses. **Query params:** `category`, `limit`, `offset`

---

### `PATCH /trips/:tripId/expenses/:id` / `DELETE /trips/:tripId/expenses/:id`

Edit or delete an expense.

---

### `GET /currency/rates`

Latest exchange rates.

**Query params:** `base` (default `GBP`)

**Response:**
```json
{ "data": { "base": "GBP", "rates": { "USD": 1.27, "EUR": 1.18, "JPY": 195.4 } } }
```

---

## Social Intelligence 🔒 Nomad Pro

### `GET /social-intel/feed`

Live social media feed for a destination.

**Query params:**

| Param | Default | Description |
|---|---|---|
| `country_code` | — | ISO country code (required if no `city`) |
| `city` | — | City name (required if no `country_code`) |
| `filter` | `all` | `food` \| `landmark` \| `general` \| `all` |
| `sort` | `trend_score` | `trend_score` \| `posted_at` |
| `limit` | 20 | Max 50 |
| `offset` | 0 | Pagination offset |

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "platform": "youtube",
      "post_url": "https://youtube.com/...",
      "title": "Hidden Ramen Spots in Tokyo",
      "content_snippet": "Found this incredible tiny ramen shop in Shibuya...",
      "creator_username": "foodiejourneys",
      "creator_follower_count": 250000,
      "creator_verified": false,
      "trend_score": 87,
      "sentiment": "positive",
      "content_type": "influencer_pick",
      "posted_at": "2026-04-18T14:00:00Z",
      "venue": { "id": "uuid", "name": "Fuunji Ramen", "category": "food" }
    }
  ]
}
```

---

### `GET /social-intel/trending`

Trending destinations by aggregate trend score over the last 7 days.

**Query params:** `limit` (default 10)

**Response:**
```json
{
  "data": [
    { "city": "Kyoto", "country_code": "JP", "avg_trend_score": 82.4, "post_count": 143 }
  ]
}
```

---

### `GET /social-intel/celeb-picks`

Posts from verified creators only.

**Query params:** `country_code`, `city`

---

## AI Assistant 🔒 Nomad Pro

### `POST /assistant/chat`

Send a message to the AI trip assistant. Maintains conversation context per trip.

**Request:**
```json
{
  "trip_id": "uuid",
  "message": "Can you suggest a quieter alternative to Sensō-ji for Day 1?"
}
```

**Response:**
```json
{
  "data": {
    "reply": "Yanaka Ginza is a great quieter alternative — a historic shopping street in a less-touristed neighbourhood of Tokyo...",
    "conversation_id": "uuid"
  }
}
```

---

### `GET /trips/:tripId/assistant`

Get conversation history for a trip.

---

### `DELETE /trips/:tripId/assistant`

Clear conversation history.

---

## Payments

### `POST /payments/create-checkout`

Create a Stripe Checkout session for web purchase.

**Request:**
```json
{ "product_id": "voyager_lifetime" }
```

`product_id` options: `voyager_lifetime` | `nomad_pro_monthly` | `nomad_pro_annual`

**Response:**
```json
{ "data": { "checkout_url": "https://checkout.stripe.com/c/pay/..." } }
```

---

### `POST /payments/verify-iap`

Verify a mobile in-app purchase (Apple or Google).

**Request:**
```json
{
  "platform": "apple",
  "receipt": "...",
  "product_id": "app.easytrip.voyager.lifetime"
}
```

**Response:**
```json
{ "data": { "tier": "voyager", "verified": true } }
```

---

### `GET /payments/subscription`

Current subscription details.

---

### `POST /payments/cancel-subscription`

Cancel Pro subscription (effective at period end).

---

### `GET /payments/billing-portal`

Stripe billing portal URL for managing payment methods and invoices (web users only).

---

## Webhooks

These endpoints are called by payment providers — do not call them directly.

| Endpoint | Caller |
|---|---|
| `POST /webhooks/stripe` | Stripe |
| `POST /webhooks/apple-iap` | Apple App Store Server Notifications |
| `POST /webhooks/google-iap` | Google Play Real-Time Notifications |

All webhook endpoints verify cryptographic signatures before processing.

---

## Notifications & Settings

### `POST /notifications/register-token`

Register a device push token (FCM/APNs).

**Request:**
```json
{ "token": "fcm-token", "platform": "android" }
```

### `DELETE /notifications/register-token`

Deregister device push token.

### `PATCH /settings/theme` 🔒 Voyager+

Update theme preference.

**Request:**
```json
{ "theme": "aurora_dark" }
```

Allowed values: `dark_light` (free), `aurora_dark`, `warm_sand`, `electric` (Voyager+)

### `PATCH /settings/category-colours` 🔒 Voyager+

Override category colours for the active theme.

**Request:**
```json
{ "food": "#FF6B6B", "landmarks": "#4ECDC4" }
```

---

## Weather

### `GET /weather`

Weather forecast for a destination.

**Query params:** `lat`, `lng`, `start_date` (YYYY-MM-DD), `end_date` (YYYY-MM-DD)

**Response:**
```json
{
  "data": [
    {
      "date": "2026-06-01",
      "temp_high": 28,
      "temp_low": 22,
      "condition": "Partly cloudy",
      "icon": "partly_cloudy",
      "precipitation_chance": 15
    }
  ]
}
```

---

## Health Check

### `GET /health`

Returns server and Redis status. No auth required.

**Response:**
```json
{ "status": "ok", "redis": "ok" }
```

---

## WebSocket Events

Connect to `wss://api.easytrip.app` with Socket.io:

```js
import { io } from 'socket.io-client';

const socket = io('wss://api.easytrip.app', {
  auth: { token: '<supabase-jwt>' }
});
```

### Client → Server events

| Event | Payload | Description |
|---|---|---|
| `subscribe:trip` | `tripId: string` | Join trip room for generation updates |
| `unsubscribe:trip` | `tripId: string` | Leave trip room |
| `subscribe:social` | `{ countryCode: string, city: string }` | Subscribe to social feed (Nomad Pro only) |
| `unsubscribe:social` | `{ countryCode: string, city: string }` | Unsubscribe from social feed |

### Server → Client events

| Event | Payload | Description |
|---|---|---|
| `generation_complete` | `{ type, jobId, tripId }` | Itinerary generation finished |
| `generation_failed` | `{ type, jobId, error }` | Itinerary generation failed |
| `social_post` | Social post object | New high-scoring social post for subscribed destination |
| `error` | `{ code, message }` | Server-side error (e.g. `upgrade_required`) |

---

## Error Codes

| Code | HTTP | Description |
|---|---|---|
| `unauthorized` | 401 | No or invalid JWT |
| `forbidden` | 403 | Valid JWT but insufficient permissions |
| `upgrade_required` | 403 | Feature requires a higher tier |
| `not_found` | 404 | Resource not found |
| `validation_error` | 422 | Request body failed Zod validation |
| `rate_limit_exceeded` | 429 | Too many requests |
| `trip_limit` | 403 | Explorer tier trip limit reached |
| `day_limit` | 403 | Explorer tier day limit reached |
| `generation_limit` | 403 | Explorer tier AI generation limit reached |
| `internal_server_error` | 500 | Unexpected server error |

---

## Product IDs Reference

| Tier | Stripe | Apple IAP | Google IAP |
|---|---|---|---|
| Voyager (lifetime) | `price_voyager_lifetime` | `app.easytrip.voyager.lifetime` | `easytrip_voyager_lifetime` |
| Nomad Pro (monthly) | `price_nomad_pro_monthly` | `app.easytrip.pro.monthly` | `easytrip_pro_monthly` |
| Nomad Pro (annual) | `price_nomad_pro_annual` | `app.easytrip.pro.annual` | `easytrip_pro_annual` |
