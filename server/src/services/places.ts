import axios from 'axios';
import { eq, and, isNotNull } from 'drizzle-orm';
import { config } from '../config/index.js';
import { db, schema } from '../db/index.js';
import { redis } from '../plugins/redis.js';

const PLACES_CACHE_TTL = 6 * 60 * 60; // 6 hours

const googlePlaces = axios.create({
  baseURL: 'https://places.googleapis.com/v1',
  headers: {
    'X-Goog-Api-Key': config.google.placesApiKey,
    'Content-Type': 'application/json',
  },
});

// ── Field masks ───────────────────────────────────────────────────────────────

const PLACE_FIELDS = [
  'id',
  'displayName',
  'location',
  'rating',
  'userRatingCount',
  'regularOpeningHours',
  'photos',
  'priceLevel',
  'websiteUri',
  'internationalPhoneNumber',
  'formattedAddress',
  'types',
  'primaryType',
].join(',');

// ── Category → Google Places type mapping ─────────────────────────────────────

const CATEGORY_TYPE_MAP: Record<string, string> = {
  food: 'restaurant',
  restaurant: 'restaurant',
  cafe: 'cafe',
  bar: 'bar',
  landmark: 'tourist_attraction',
  museum: 'museum',
  hotel: 'lodging',
  shopping: 'shopping_mall',
  transport: 'transit_station',
  park: 'park',
  nightlife: 'night_club',
};

function mapCategoryToGoogleType(category: string): string {
  return CATEGORY_TYPE_MAP[category.toLowerCase()] ?? 'point_of_interest';
}

// ── Map Google Place to DB venue ──────────────────────────────────────────────

function mapGooglePlaceToVenue(place: Record<string, unknown>): Partial<typeof schema.venues.$inferInsert> {
  const loc = place.location as { latitude?: number; longitude?: number } | undefined;
  const name = (place.displayName as { text?: string } | undefined)?.text ?? '';
  const photos = Array.isArray(place.photos)
    ? (place.photos as Array<{ name?: string }>).slice(0, 5).map((p) => ({
        url: `https://places.googleapis.com/v1/${p.name}/media?maxWidthPx=800&key=${config.google.placesApiKey}`,
        source: 'google',
        attribution: 'Google Places',
      }))
    : [];

  return {
    googlePlaceId: place.id as string,
    name,
    category: (place.primaryType as string) ?? 'point_of_interest',
    address: place.formattedAddress as string | undefined,
    lat: loc?.latitude?.toString() ?? undefined,
    lng: loc?.longitude?.toString() ?? undefined,
    phone: place.internationalPhoneNumber as string | undefined,
    website: place.websiteUri as string | undefined,
    googleRating: place.rating?.toString() ?? undefined,
    googleReviewCount: place.userRatingCount as number | undefined,
    priceLevel: place.priceLevel as number | undefined,
    openingHours: place.regularOpeningHours ?? null,
    hoursFetchedAt: new Date(),
    photos,
    placesApiFetchedAt: new Date(),
    placesApiVersion: 'v1',
  };
}

// ── Search nearby ─────────────────────────────────────────────────────────────

export async function searchNearby(params: {
  lat: number;
  lng: number;
  radiusMeters: number;
  category: string;
  maxResults?: number;
}) {
  const cacheKey = `places:nearby:${params.lat.toFixed(3)}:${params.lng.toFixed(3)}:${params.radiusMeters}:${params.category}`;
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const response = await googlePlaces.post(
    '/places:searchNearby',
    {
      includedTypes: [mapCategoryToGoogleType(params.category)],
      locationRestriction: {
        circle: {
          center: { latitude: params.lat, longitude: params.lng },
          radius: params.radiusMeters,
        },
      },
      maxResultCount: params.maxResults ?? 20,
      rankPreference: 'POPULARITY',
    },
    {
      headers: { 'X-Goog-FieldMask': PLACE_FIELDS },
    },
  );

  const venues = (response.data.places ?? []).map(mapGooglePlaceToVenue);

  // Upsert into DB
  for (const venue of venues) {
    if (venue.googlePlaceId) {
      await db
        .insert(schema.venues)
        .values(venue as typeof schema.venues.$inferInsert)
        .onConflictDoUpdate({
          target: schema.venues.googlePlaceId,
          set: {
            ...venue,
            updatedAt: new Date(),
          },
        });
    }
  }

  await redis.setex(cacheKey, PLACES_CACHE_TTL, JSON.stringify(venues));
  return venues;
}

// ── Get venue detail ──────────────────────────────────────────────────────────

export async function getVenueDetail(googlePlaceIdOrUuid: string) {
  const cacheKey = `places:detail:${googlePlaceIdOrUuid}`;
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  // Try DB first
  const isUuid = /^[0-9a-f-]{36}$/i.test(googlePlaceIdOrUuid);
  let venue = await db.query.venues.findFirst({
    where: isUuid
      ? eq(schema.venues.id, googlePlaceIdOrUuid)
      : eq(schema.venues.googlePlaceId, googlePlaceIdOrUuid),
  });

  // Check if data is stale (> 6h old)
  const isStale = !venue?.placesApiFetchedAt ||
    Date.now() - new Date(venue.placesApiFetchedAt).getTime() > PLACES_CACHE_TTL * 1000;

  const placeId = venue?.googlePlaceId ?? (!isUuid ? googlePlaceIdOrUuid : null);

  if (placeId && isStale) {
    try {
      const response = await googlePlaces.get(`/places/${placeId}`, {
        headers: { 'X-Goog-FieldMask': PLACE_FIELDS },
      });

      const updated = mapGooglePlaceToVenue(response.data);
      if (venue) {
        await db
          .update(schema.venues)
          .set({ ...updated, updatedAt: new Date() })
          .where(eq(schema.venues.id, venue.id));
      } else {
        const inserted = await db
          .insert(schema.venues)
          .values(updated as typeof schema.venues.$inferInsert)
          .returning();
        venue = inserted[0];
      }

      venue = await db.query.venues.findFirst({
        where: eq(schema.venues.googlePlaceId, placeId),
      });
    } catch {
      // Use stale data if API fails
    }
  }

  if (venue) {
    await redis.setex(cacheKey, PLACES_CACHE_TTL, JSON.stringify(venue));
  }

  return venue;
}

// ── Text search ───────────────────────────────────────────────────────────────

export async function searchPlaces(params: {
  query: string;
  lat?: number;
  lng?: number;
  radiusMeters?: number;
}) {
  const cacheKey = `places:search:${params.query}:${params.lat ?? ''}:${params.lng ?? ''}`;
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const body: Record<string, unknown> = { textQuery: params.query };
  if (params.lat && params.lng) {
    body.locationBias = {
      circle: {
        center: { latitude: params.lat, longitude: params.lng },
        radius: params.radiusMeters ?? 50000,
      },
    };
  }

  const response = await googlePlaces.post('/places:searchText', body, {
    headers: { 'X-Goog-FieldMask': PLACE_FIELDS },
  });

  const venues = (response.data.places ?? []).map(mapGooglePlaceToVenue);
  await redis.setex(cacheKey, PLACES_CACHE_TTL, JSON.stringify(venues));
  return venues;
}
