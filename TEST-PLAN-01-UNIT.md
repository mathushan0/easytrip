# Test Plan 1: Unit Tests

## Overview
Comprehensive unit test coverage for EasyTrip components, stores, API client, and utilities. 

**Scope:** Component logic, Zustand stores, API client (axios + retry), theme utilities, auth helpers, offline caching.

**Tools:** Jest + React Native Testing Library (for components), Manual mocks for external APIs.

**Target Coverage:** >80% lines, >75% branches.

---

## 1. Component Unit Tests

### 1.1 Atoms (Base UI Components)

#### Button Component
- **File:** `src/components/atoms/Button.tsx`
- **Test Cases:**
  - Renders with label text
  - Applies `disabled` prop → element disabled, opacity reduced
  - Calls `onPress` callback when pressed
  - Applies variant styles (`primary`, `secondary`, `ghost`)
  - Applies size variants (`sm`, `md`, `lg`)
  - Renders loading spinner when `loading={true}`
  - Disables interaction while loading
  - Applies theme colors dynamically

#### TextInput Component
- **File:** `src/components/atoms/TextInput.tsx`
- **Test Cases:**
  - Renders with placeholder text
  - Updates value on user input
  - Calls `onChangeText` callback with value
  - Validates input (if `type="email"` → email format)
  - Shows/hides password on `secureTextEntry`
  - Applies error state styling on `error={true}`
  - Displays error message below input
  - Focuses on ref call
  - Clears on ref method

#### Badge Component
- **File:** `src/components/atoms/Badge.tsx`
- **Test Cases:**
  - Renders label with background color
  - Applies `variant` styles (`success`, `warning`, `error`, `info`)
  - Renders `onClose` button when dismissible
  - Removes on close button press
  - Applies size variants

#### Modal Component
- **File:** `src/components/atoms/Modal.tsx`
- **Test Cases:**
  - Does not render when `visible={false}`
  - Renders overlay + content when `visible={true}`
  - Calls `onClose` when backdrop pressed
  - Calls `onClose` on close button
  - Disables backdrop press if `closeOnBackdropPress={false}`
  - Renders custom header and footer
  - Animation transitions smoothly on show/hide
  - Keyboard does not dismiss modal

#### Card Component
- **File:** `src/components/atoms/Card.tsx`
- **Test Cases:**
  - Renders children inside card container
  - Applies shadow styling
  - Applies padding/spacing
  - Renders optional header and footer sections
  - Handles `onPress` callback (if interactive)
  - Applies hover state on desktop

### 1.2 Molecules (Composed Components)

#### VenueCard Component
- **File:** `src/components/shared/VenueCard.tsx`
- **Test Cases:**
  - Displays venue image, name, rating, distance, type
  - Renders stars for rating (1–5)
  - Formats distance with unit (km/mi based on region)
  - Calls `onPress` when tapped
  - Shows "Saved" indicator if in favorites
  - Renders price tier ($, $$, $$$)
  - Opens on map on "View on Map" tap

#### TripCard Component
- **File:** `src/components/molecules/TripCard.tsx` (if exists, or infer from structure)
- **Test Cases:**
  - Displays trip destination, duration, dates
  - Shows status badge (draft, active, completed)
  - Renders progress percentage
  - Calls `onPress` to navigate to trip
  - Shows "Continue" button for in-progress trips
  - Displays trip cover image

---

## 2. Store Unit Tests (Zustand)

### 2.1 User Store
- **File:** `src/stores/useUserStore.ts` (if exists)
- **Test Cases:**
  - Initial state: `user=null`, `isAuthenticated=false`
  - `setUser(user)` → updates state
  - `setUser(user)` → `isAuthenticated=true`
  - `logout()` → resets to initial state
  - `setTheme(theme)` → updates `theme` in state
  - `setPushNotifications(enabled)` → toggles notifications
  - Persists to MMKV on every state change
  - Recovers from MMKV on hydration

### 2.2 Trip Store
- **File:** `src/stores/useTripStore.ts` (if exists)
- **Test Cases:**
  - `setCurrentTrip(trip)` → updates `currentTrip`
  - `addTrip(trip)` → appends to `trips[]`
  - `removeTrip(tripId)` → filters from `trips[]`
  - `updateTrip(tripId, data)` → merges updates
  - `setDays(days)` → updates `days[]` for current trip
  - `addDay(day)` → appends day
  - `updateDay(dayId, updates)` → merges day changes
  - `setItinerary(itinerary)` → updates itinerary

### 2.3 Theme Store
- **File:** `src/stores/useThemeStore.ts` (if exists)
- **Test Cases:**
  - Supports 4 themes: `light`, `dark`, `forest`, `ocean`
  - `setTheme(theme)` → updates current theme
  - `getColors()` → returns correct tokens for active theme
  - Persists selected theme to MMKV
  - Recovers theme from MMKV on app launch
  - Default theme matches device preference (light/dark)

### 2.4 Offline Store
- **File:** `src/stores/useOfflineStore.ts` (if exists)
- **Test Cases:**
  - Marks actions as "pending" when offline
  - `setSyncQueue(actions)` → stores pending actions
  - `clearSyncQueue()` → empties queue
  - `isSynced` getter reflects queue status
  - Persists queue to MMKV

---

## 3. API Client Unit Tests

### 3.1 API Client with Retry Logic
- **File:** `src/services/api.ts`
- **Test Cases:**
  - Default headers include `Authorization: Bearer <token>`
  - POST/PUT/PATCH requests serialize body as JSON
  - Retry on 5xx errors (max 3 attempts)
  - Backoff: 1s, 2s, 4s (exponential)
  - **Does NOT retry** on 4xx errors
  - Timeout after 30s (configurable)
  - Throws `ApiError` with status, message, details
  - Handles network errors (no internet)
  - Converts `AxiosError` to custom error class
  - Sets `Content-Type: application/json` automatically

### 3.2 Supabase Auth Client
- **File:** `src/services/auth.ts` (if exists)
- **Test Cases:**
  - `signUp(email, password)` → calls Supabase auth
  - `signIn(email, password)` → returns session + user
  - `signOut()` → clears token from storage
  - `refreshToken()` → exchanges refresh token
  - `getCurrentUser()` → returns `user | null`
  - Stores token in MMKV, retrieves on init
  - Handles auth errors (invalid credentials, user exists)

### 3.3 Stripe Payment Client
- **File:** `src/services/payments.ts` (if exists)
- **Test Cases:**
  - `getProducts()` → fetches tier info (Explorer, Voyager, Pro)
  - `createPaymentIntent(productId)` → returns client secret
  - `confirmPayment(paymentMethodId, clientSecret)` → processes payment
  - Handles `requires_action` (3D Secure) responses
  - Throws payment errors (declined, insufficient funds)
  - Caches products in-memory (5-min TTL)

---

## 4. Utility Function Tests

### 4.1 Theme Utilities
- **File:** `src/theme/index.ts` or similar
- **Test Cases:**
  - `getThemeColor(theme, tokenName)` → returns correct hex
  - All 4 themes have complete token set
  - Token names are consistent across themes
  - Colors meet WCAG AA contrast ratio (4.5:1 for text)

### 4.2 Date & Time Utilities
- **File:** `src/lib/dates.ts` or similar (if exists)
- **Test Cases:**
  - `formatDate(date, 'YYYY-MM-DD')` → returns formatted string
  - `getDaysBetween(start, end)` → returns integer count
  - `isTodayOrFuture(date)` → boolean
  - `formatDuration(days)` → "5 days", "1 day", "30 days"

### 4.3 Authentication Utilities
- **File:** `src/lib/auth.ts` or similar
- **Test Cases:**
  - `canAccess(feature, tierName)` → boolean based on tier (Explorer/Voyager/Pro)
  - `getFeatureLimits(tier)` → { tripsCount: N, daysPerTrip: N, ... }
  - `isFeatureUnlocked(feature, user)` → checks user tier

### 4.4 Offline Caching Utilities
- **File:** `src/lib/offline.ts` or similar
- **Test Cases:**
  - `saveToMMKV(key, value)` → persists object
  - `getFromMMKV(key)` → retrieves + parses JSON
  - `deleteFromMMKV(key)` → removes entry
  - Handles large objects (>5MB) gracefully
  - Throws error if storage full

---

## 5. Test Implementation Examples

### Component Test Example (Button)
```typescript
// src/components/atoms/__tests__/Button.test.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import Button from '../Button';

describe('Button Component', () => {
  it('renders with label', () => {
    const { getByText } = render(<Button label="Click me" />);
    expect(getByText('Click me')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByRole } = render(
      <Button label="Test" onPress={onPress} />
    );
    fireEvent.press(getByRole('button'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('disables button when loading=true', () => {
    const { getByRole } = render(
      <Button label="Loading" loading={true} />
    );
    const btn = getByRole('button');
    expect(btn.props.disabled).toBe(true);
  });

  it('applies theme colors', () => {
    const { getByRole } = render(<Button label="Test" variant="primary" />);
    const btn = getByRole('button');
    expect(btn.props.style).toContain({
      backgroundColor: expect.any(String),
    });
  });
});
```

### Store Test Example (Zustand)
```typescript
// src/stores/__tests__/useUserStore.test.ts
import { renderHook, act } from '@testing-library/react-native';
import useUserStore from '../useUserStore';

describe('useUserStore', () => {
  beforeEach(() => {
    useUserStore.setState({
      user: null,
      isAuthenticated: false,
    });
  });

  it('initializes with null user', () => {
    const { result } = renderHook(() => useUserStore());
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('setUser updates user and auth flag', () => {
    const { result } = renderHook(() => useUserStore());
    const mockUser = { id: '1', email: 'test@example.com' };
    
    act(() => {
      result.current.setUser(mockUser);
    });
    
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('logout clears user', () => {
    const { result } = renderHook(() => useUserStore());
    const mockUser = { id: '1', email: 'test@example.com' };
    
    act(() => {
      result.current.setUser(mockUser);
      result.current.logout();
    });
    
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });
});
```

### API Client Test Example
```typescript
// src/services/__tests__/api.test.ts
import { apiClient } from '../api';
import axios from 'axios';
jest.mock('axios');

describe('API Client', () => {
  const mockAxios = axios as jest.Mocked<typeof axios>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retries 5xx errors with exponential backoff', async () => {
    mockAxios.request
      .mockRejectedValueOnce({ response: { status: 500 } })
      .mockRejectedValueOnce({ response: { status: 500 } })
      .mockResolvedValueOnce({ data: { success: true } });

    const result = await apiClient.get('/test');
    expect(result.data.success).toBe(true);
    expect(mockAxios.request).toHaveBeenCalledTimes(3);
  });

  it('does not retry 4xx errors', async () => {
    mockAxios.request.mockRejectedValue({ response: { status: 404 } });
    
    await expect(apiClient.get('/notfound')).rejects.toThrow();
    expect(mockAxios.request).toHaveBeenCalledTimes(1);
  });

  it('includes auth header', async () => {
    mockAxios.request.mockResolvedValue({ data: {} });
    await apiClient.get('/trips');
    
    expect(mockAxios.request).toHaveBeenCalledWith(
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: expect.stringContaining('Bearer'),
        }),
      })
    );
  });
});
```

---

## 6. Jest Configuration

Create `jest.config.js` in project root:

```javascript
module.exports = {
  preset: 'react-native',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.stories.tsx',
    '!src/types/**',
  ],
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
```

---

## 7. Running Unit Tests

```bash
# Run all unit tests
npm test

# Run with coverage
npm test -- --coverage

# Watch mode
npm test -- --watch

# Specific test file
npm test Button.test.tsx
```

---

## 8. Acceptance Criteria

✅ All component render tests pass
✅ Store state management tests pass
✅ API client retry logic tested
✅ Theme utilities tests pass
✅ Coverage >80% lines, >75% branches
✅ No flaky tests (rerun 3x, all pass)
✅ Test execution <60s

---

## 9. Deliverables

- `src/components/atoms/__tests__/*.test.tsx` (10+ test files)
- `src/stores/__tests__/*.test.ts` (4+ test files)
- `src/services/__tests__/*.test.ts` (3+ test files)
- `jest.config.js` + `jest.setup.js`
- Coverage report: `coverage/index.html`
