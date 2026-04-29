# Test Plan 2: Integration Tests

## Overview
Tests for end-to-end workflows combining frontend components, Zustand stores, API client, and backend API. Focus on real user flows and state synchronization.

**Scope:** Sign-in → Home, Trip creation → Itinerary planning, Theme persistence, Offline caching + sync, Backend API integration.

**Tools:** Jest + React Native Testing Library for component integration, Supertest for API routes.

**Target:** All critical user paths validated, no state inconsistencies.

---

## 1. Authentication Flow Integration Tests

### 1.1 Sign-In → ProfileSetup → Home

**Scenario:** User signs in with email/password, completes profile, lands on Home.

**Steps:**
1. User navigates to Sign-In screen
2. Enters email: `test@example.com`, password: `Password123!`
3. Taps "Sign In"
4. API returns `{ accessToken, refreshToken, user: { id, email } }`
5. App stores tokens in MMKV, updates `useUserStore`
6. App navigates to ProfileSetup screen
7. User selects avatar, sets preferences (theme, notifications)
8. Taps "Continue to Home"
9. API PATCH `/users/me` saves profile
10. App displays Home screen with user's name

**Assertions:**
- ✅ Tokens persisted to MMKV
- ✅ `useUserStore.user` === signed-in user
- ✅ `useUserStore.isAuthenticated === true`
- ✅ Theme from profile loaded into `useThemeStore`
- ✅ Navigation state cleared (no back button to Sign-In)
- ✅ Home screen fetches user trips
- ✅ User avatar displays on Home header

**Test Code:**
```typescript
// src/screens/__tests__/AuthFlow.integration.test.tsx
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import SignInScreen from '../../screens/SignInScreen';
import { useUserStore } from '../../stores/useUserStore';
import { apiClient } from '../../services/api';

jest.mock('../../services/api');

describe('Auth Flow Integration', () => {
  beforeEach(() => {
    useUserStore.setState({ user: null, isAuthenticated: false });
  });

  it('signs in user, saves tokens, navigates to ProfileSetup', async () => {
    const mockApiCall = jest.fn().mockResolvedValue({
      data: {
        accessToken: 'mock-token',
        refreshToken: 'mock-refresh',
        user: { id: '1', email: 'test@example.com', name: null },
      },
    });
    (apiClient.post as jest.Mock) = mockApiCall;

    const { getByPlaceholderText, getByText } = render(
      <SignInScreen navigation={mockNavigation} />
    );

    fireEvent.changeText(
      getByPlaceholderText('Email'),
      'test@example.com'
    );
    fireEvent.changeText(
      getByPlaceholderText('Password'),
      'Password123!'
    );
    fireEvent.press(getByText('Sign In'));

    await waitFor(() => {
      expect(mockApiCall).toHaveBeenCalledWith('/auth/signin', {
        email: 'test@example.com',
        password: 'Password123!',
      });
    });

    await waitFor(() => {
      const { isAuthenticated } = useUserStore.getState();
      expect(isAuthenticated).toBe(true);
    });
  });
});
```

---

## 2. Trip Creation & Itinerary Flow

### 2.1 Trip Creation → Day Generation → Itinerary View

**Scenario:** User creates new trip, backend generates AI itinerary, user views planner.

**Steps:**
1. User taps "New Trip" on Home
2. Enters destination: `Paris`, dates: `2026-06-01` → `2026-06-08`
3. Taps "Generate Itinerary"
4. API POST `/trips` → returns `tripId: 'trip-123'`
5. API initiates background job to generate days (AI + Places)
6. Frontend polls GET `/trips/trip-123/status` every 3s
7. Status: `generating` → `ready`
8. App fetches GET `/trips/trip-123/days` (8 days with venues)
9. Displays itinerary in TripDetailScreen
10. User reorders day via drag-to-reorder
11. App PATCH `/trips/trip-123/days/:dayId` with new position

**Assertions:**
- ✅ Trip created with status `draft`
- ✅ 8 days generated (start_date to end_date inclusive)
- ✅ Each day has ≥5 venues
- ✅ Drag-to-reorder updates `useTripStore.days`
- ✅ PATCH request includes `position` field
- ✅ Offline: stores pending reorder, syncs when online

**Test Code:**
```typescript
// src/screens/__tests__/TripCreationFlow.integration.test.tsx
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import TripCreationScreen from '../../screens/TripCreationScreen';
import { apiClient } from '../../services/api';
import { useTripStore } from '../../stores/useTripStore';

jest.mock('../../services/api');

describe('Trip Creation & Itinerary Flow', () => {
  beforeEach(() => {
    useTripStore.setState({ currentTrip: null, days: [] });
  });

  it('creates trip, generates days, displays itinerary', async () => {
    const mockPost = jest.fn().mockResolvedValue({
      data: { id: 'trip-123', destination: 'Paris', status: 'draft' },
    });
    const mockGet = jest
      .fn()
      .mockResolvedValueOnce({
        data: { status: 'generating', progress: 30 },
      })
      .mockResolvedValueOnce({
        data: { status: 'ready', progress: 100 },
      })
      .mockResolvedValueOnce({
        data: [
          {
            id: 'day-1',
            date: '2026-06-01',
            venues: [
              { id: 'v1', name: 'Eiffel Tower', lat: 48.858, lng: 2.294 },
            ],
          },
        ],
      });

    (apiClient.post as jest.Mock) = mockPost;
    (apiClient.get as jest.Mock) = mockGet;

    const { getByText, getByPlaceholderText } = render(
      <TripCreationScreen navigation={mockNavigation} />
    );

    // Enter destination
    fireEvent.changeText(getByPlaceholderText('Destination'), 'Paris');
    fireEvent.changeText(getByPlaceholderText('Start Date'), '2026-06-01');
    fireEvent.changeText(getByPlaceholderText('End Date'), '2026-06-08');

    // Create trip
    fireEvent.press(getByText('Generate Itinerary'));

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith('/trips', {
        destination: 'Paris',
        start_date: '2026-06-01',
        end_date: '2026-06-08',
      });
    });

    // Poll for status
    await waitFor(() => {
      expect(mockGet).toHaveBeenCalledWith('/trips/trip-123/status');
    });

    // Verify trip store updated
    await waitFor(() => {
      const { currentTrip } = useTripStore.getState();
      expect(currentTrip?.id).toBe('trip-123');
    });
  });
});
```

---

## 3. Theme Switching & Persistence

### 3.1 Theme Selection → MMKV Persistence → App Restart

**Scenario:** User selects "Forest" theme, closes app, reopens—theme persists.

**Steps:**
1. User opens Settings screen
2. Selects theme: "Forest" (from 4 options: Light, Dark, Forest, Ocean)
3. App calls `useThemeStore.setTheme('forest')`
4. Store saves to MMKV: `mmkv.set('theme', 'forest')`
5. All UI colors update in real-time (via context consumer)
6. User closes and reopens app
7. App initializes `useThemeStore` from MMKV hydration
8. Theme is still "Forest"

**Assertions:**
- ✅ Theme selector updates `useThemeStore`
- ✅ MMKV persists theme
- ✅ All theme-dependent colors change
- ✅ App restart loads theme from MMKV
- ✅ No white flash (theme loaded before render)
- ✅ Theme colors match design tokens

**Test Code:**
```typescript
// src/screens/__tests__/ThemePersistence.integration.test.tsx
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import SettingsScreen from '../../screens/SettingsScreen';
import { useThemeStore } from '../../stores/useThemeStore';
import { MMKV } from 'react-native-mmkv';

jest.mock('react-native-mmkv');

describe('Theme Persistence Integration', () => {
  const mockMMKV = MMKV as jest.Mocked<typeof MMKV>;

  beforeEach(() => {
    useThemeStore.setState({ theme: 'light' });
    mockMMKV.set.mockClear();
    mockMMKV.getString.mockReturnValue('light');
  });

  it('persists theme to MMKV and restores on app restart', async () => {
    const { getByText } = render(<SettingsScreen navigation={mockNavigation} />);

    // Select Forest theme
    fireEvent.press(getByText('Forest'));

    await waitFor(() => {
      expect(useThemeStore.getState().theme).toBe('forest');
    });

    // Verify MMKV save
    expect(mockMMKV.set).toHaveBeenCalledWith('theme', 'forest');

    // Simulate app restart (MMKV returns persisted value)
    mockMMKV.getString.mockReturnValue('forest');

    // Reinitialize store
    useThemeStore.getState().hydrate?.();

    await waitFor(() => {
      expect(useThemeStore.getState().theme).toBe('forest');
    });
  });
});
```

---

## 4. Offline-First MMKV Caching

### 4.1 Offline Action Queueing & Sync

**Scenario:** User offline, adds venue to favorite, comes online, sync completes.

**Steps:**
1. User goes offline (disable airplane mode)
2. User taps heart icon on venue → `POST /venues/venue-123/favorite`
3. API call fails (no internet)
4. App catches error, adds action to offline queue:
   ```
   { action: 'favorite_venue', payload: { venueId: 'venue-123' }, timestamp }
   ```
5. Stores queue in MMKV
6. Shows toast: "Saved offline. Will sync when online."
7. UI shows venue as favorited (optimistic)
8. User goes online
9. App detects online, starts sync job
10. Resends all queued actions in order
11. API succeeds, removes from queue
12. Toast: "Synced 1 action"

**Assertions:**
- ✅ Offline action saved to queue (MMKV)
- ✅ UI optimistically updates
- ✅ Queue persists across app close
- ✅ Online detection triggers sync
- ✅ Actions processed in order (FIFO)
- ✅ Successful actions removed from queue
- ✅ Failed actions remain (for retry)

**Test Code:**
```typescript
// src/lib/__tests__/offline-sync.integration.test.ts
import { useOfflineStore } from '../../stores/useOfflineStore';
import { apiClient } from '../../services/api';
import NetInfo from '@react-native-community/netinfo';

jest.mock('../../services/api');
jest.mock('@react-native-community/netinfo');

describe('Offline Sync Integration', () => {
  beforeEach(() => {
    useOfflineStore.setState({ queue: [] });
  });

  it('queues action offline, syncs when online', async () => {
    const mockPost = jest.fn().mockResolvedValue({ data: { success: true } });
    (apiClient.post as jest.Mock) = mockPost;

    // Simulate offline
    const mockNetInfo = NetInfo as jest.Mocked<typeof NetInfo>;
    mockNetInfo.fetch.mockResolvedValue({
      isConnected: false,
      isInternetReachable: false,
    } as any);

    // User adds venue to favorites (offline)
    const action = {
      action: 'favorite_venue',
      payload: { venueId: 'v-123' },
    };

    useOfflineStore.getState().addToQueue(action);

    let { queue } = useOfflineStore.getState();
    expect(queue).toHaveLength(1);

    // Go online
    mockNetInfo.fetch.mockResolvedValue({
      isConnected: true,
      isInternetReachable: true,
    } as any);

    // Trigger sync
    await useOfflineStore.getState().syncQueue();

    // Verify API called and queue cleared
    expect(mockPost).toHaveBeenCalledWith('/venues/v-123/favorite', {});

    ({ queue } = useOfflineStore.getState());
    expect(queue).toHaveLength(0);
  });
});
```

---

## 5. Backend API Integration Tests

### 5.1 Trip Endpoints Integration

**Scenario:** Full CRUD cycle for trips via Fastify API.

**Tools:** Supertest + mocked Supabase/database.

**Test Code:**
```typescript
// server/src/routes/__tests__/trips.integration.test.ts
import request from 'supertest';
import fastify from 'fastify';
import tripsRoutes from '../trips';
import { mockDatabase } from '../../db/__mocks__';

describe('Trip Routes Integration', () => {
  let app: any;

  beforeAll(async () => {
    app = fastify();
    app.register(tripsRoutes);
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('creates, retrieves, updates, deletes trip', async () => {
    const tripData = {
      destination: 'Bangkok',
      country_code: 'TH',
      start_date: '2026-07-01',
      end_date: '2026-07-14',
    };

    // CREATE
    const createRes = await request(app.server)
      .post('/trips')
      .set('Authorization', `Bearer ${mockToken}`)
      .send(tripData);

    expect(createRes.status).toBe(201);
    const tripId = createRes.body.data.id;

    // READ
    const getRes = await request(app.server)
      .get(`/trips/${tripId}`)
      .set('Authorization', `Bearer ${mockToken}`);

    expect(getRes.status).toBe(200);
    expect(getRes.body.data.destination).toBe('Bangkok');

    // UPDATE
    const updateRes = await request(app.server)
      .patch(`/trips/${tripId}`)
      .set('Authorization', `Bearer ${mockToken}`)
      .send({ notes: 'Amazing trip!' });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.notes).toBe('Amazing trip!');

    // DELETE
    const deleteRes = await request(app.server)
      .delete(`/trips/${tripId}`)
      .set('Authorization', `Bearer ${mockToken}`);

    expect(deleteRes.status).toBe(204);
  });
});
```

---

## 6. Subscription Tier Enforcement

### 6.1 Feature Access by Tier

**Scenario:** Explorer user tries to create 4th trip (limit: 3), fails. Voyager user succeeds.

**Steps:**
1. Explorer user has 3 trips
2. Attempts POST `/trips` for 4th
3. Backend checks `user.tier === 'explorer'`
4. Returns `403 Forbidden` with reason: `"Trip limit exceeded (3/3)"`
5. Frontend shows modal: "Upgrade to Voyager for unlimited trips"

6. Voyager user (limit: unlimited)
7. POST `/trips` succeeds

**Test Code:**
```typescript
// server/src/routes/__tests__/tier-enforcement.integration.test.ts
describe('Subscription Tier Enforcement', () => {
  it('blocks explorer from creating 4th trip', async () => {
    // Create 3 trips first
    for (let i = 0; i < 3; i++) {
      await mockDatabase.trips.create({
        user_id: explorerId,
        destination: `City${i}`,
      });
    }

    const res = await request(app.server)
      .post('/trips')
      .set('Authorization', `Bearer ${explorerToken}`)
      .send({ destination: 'London' });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('TRIP_LIMIT_EXCEEDED');
  });

  it('allows voyager to create unlimited trips', async () => {
    for (let i = 0; i < 5; i++) {
      const res = await request(app.server)
        .post('/trips')
        .set('Authorization', `Bearer ${voyagerToken}`)
        .send({ destination: `City${i}` });

      expect(res.status).toBe(201);
    }
  });
});
```

---

## 7. Running Integration Tests

```bash
# Run all integration tests
npm test -- --testPathPattern=integration

# Run specific flow
npm test -- AuthFlow.integration.test

# With coverage
npm test -- --coverage --testPathPattern=integration

# Watch mode
npm test -- --watch --testPathPattern=integration
```

---

## 8. Acceptance Criteria

✅ Auth flow: sign-in → profile → home
✅ Trip creation: destination → generation → itinerary
✅ Theme persistence: select → save → restart → load
✅ Offline queueing: action offline → queue → sync online
✅ API integration: CRUD endpoints tested with real schema
✅ Tier enforcement: feature limits enforced per tier
✅ No race conditions in state updates
✅ All tests pass in <120s

---

## 9. Deliverables

- `src/screens/__tests__/*.integration.test.tsx` (5+ files)
- `src/lib/__tests__/offline-sync.integration.test.ts`
- `server/src/routes/__tests__/*.integration.test.ts` (4+ files)
- Integration test suite report with timing
