# Test Plan 3: End-to-End Tests

## Overview
Full user journey tests across mobile (iOS/Android) and web, covering all subscription tiers, themes, and devices.

**Scope:** Explorer → Voyager → Nomad Pro user flows, cross-browser (Chrome, Safari, Firefox), responsive design (iPhone, iPad, Android), all 4 themes.

**Tools:** Playwright (mobile + web), Detox for native mobile (optional).

**Target:** All 6 critical user paths validated on 3+ browsers, 3+ screen sizes.

---

## 1. Critical User Journeys

### 1.1 Explorer Tier: Browse & Preview
**Duration:** ~5 minutes
**Path:** Explore Destination → View Trip Preview → Try Feature (Limited) → Upgrade Prompt

**Steps:**
1. App launches (fresh install, no account)
2. User taps "Explore Without Signing In"
3. Explore screen shows featured destinations (Paris, Bangkok, NYC, etc.)
4. User taps "Paris" destination card
5. Displays trip preview (AI-generated itinerary snippet, 1-2 days)
6. User taps "Create This Trip"
7. Modal: "Create Account to Save Trips"
8. User taps "Sign Up" → goes to SignUp flow

**Assertions:**
- ✅ Featured destinations render (images, names, ratings)
- ✅ Tap destination card opens preview
- ✅ Trip preview shows realistic content
- ✅ "Create Account" modal appears
- ✅ No crashes, smooth transitions

---

### 1.2 Voyager Tier: Create & Customize Full Itinerary
**Duration:** ~10 minutes
**Path:** Sign In → Create Trip → AI Generation → View Itinerary → Customize Days → Add Venue → Save

**Steps:**
1. User signs in (voyager account pre-created)
2. Home screen displays 2 existing trips
3. Taps "+ New Trip"
4. TripCreation form:
   - Destination: "Barcelona"
   - Dates: Jun 1 – Jun 8 (8 days)
   - Budget: €2000
5. Taps "Generate Itinerary"
6. Loading spinner (3–5 seconds of API calls)
7. Itinerary screen displays 8 days, each with 5+ venues
8. User drags Day 2 venue to reorder
9. Opens Day 1, taps venue "Sagrada Familia"
10. Venue detail modal: name, photos, hours, rating, directions
11. Taps "+" to add to itinerary
12. User taps "Save Trip"
13. Toast: "Trip saved"
14. Trip status changes to "saved"

**Assertions:**
- ✅ AI generation completes successfully
- ✅ 8 days generated with venues
- ✅ Drag-to-reorder works without lag
- ✅ Venue detail modal displays photos
- ✅ Adding/removing venues updates count
- ✅ Save trip updates status
- ✅ No UI freezes during API calls
- ✅ No duplicate days generated

---

### 1.3 Nomad Pro Tier: Social Intelligence & AI Assistant
**Duration:** ~8 minutes
**Path:** Create Trip → Open Social Intelligence → Chat with AI Assistant → Export Trip

**Steps:**
1. User signs in (nomad pro account)
2. Creates trip: "Tokyo", Jul 1–7
3. AI generation completes
4. Taps "💡 Social Intelligence" tab
5. Screen shows:
   - "Trending Now" (Instagram, TikTok hotspots)
   - "Influencer Tips" (quotes from travel creators)
   - "Peak Hours" (crowd forecast)
6. User taps "View Details" on trending venue
7. Modal shows: venue name, # Instagram posts, trending score, top photos
8. User taps "AI Assistant" chat icon
9. Chat screen appears
10. User types: "Suggest 2 hidden gems in Shibuya"
11. AI responds with recommendations (2–3 venues, descriptions)
12. User taps "Add Selected to Itinerary" → venues added to Day 3
13. Taps "Export Trip" → generates PDF
14. PDF opens (or saves to Files)

**Assertions:**
- ✅ Social Intelligence data loads (trending venues)
- ✅ AI Assistant chat works (no lag, proper formatting)
- ✅ Venue suggestions added to itinerary
- ✅ PDF export succeeds and is valid
- ✅ Chat history persists during session
- ✅ No rate limiting errors

---

## 2. Cross-Browser Testing (Playwright Web)

### 2.1 Chrome Desktop
**Device:** Desktop, 1920×1080
**Steps:** Full Voyager journey (create trip → itinerary → save)
**Assertions:**
- ✅ All buttons clickable
- ✅ Forms submit correctly
- ✅ Maps render (Google Maps)
- ✅ Photos load fast (<2s)
- ✅ No console errors
- ✅ Responsive breakpoints correct

### 2.2 Safari Desktop
**Device:** Desktop, 1440×900 (simulated macOS)
**Steps:** Full Voyager journey
**Assertions:**
- ✅ iOS-specific CSS works
- ✅ Date picker works (Safari native)
- ✅ Photos load (no CORS issues)
- ✅ Modals dismiss properly
- ✅ No visual glitches

### 2.3 Firefox Desktop
**Device:** Desktop, 1920×1080
**Steps:** Full Voyager journey
**Assertions:**
- ✅ All form inputs work
- ✅ Drag-to-reorder works (no Firefox-specific bugs)
- ✅ Animations smooth
- ✅ No missing styles

---

## 3. Mobile Responsiveness (Playwright + Emulation)

### 3.1 iPhone 14 (390×844)
**Steps:** Full Voyager journey on mobile
**Assertions:**
- ✅ Text readable (no tiny fonts)
- ✅ Buttons have 44×44 min tap target
- ✅ Keyboard doesn't hide form fields
- ✅ Bottom nav accessible (iOS safe area)
- ✅ Maps scrollable
- ✅ Modals don't overflow

### 3.2 iPad Pro (1024×1366)
**Steps:** Full Voyager journey on tablet
**Assertions:**
- ✅ Layout adapts to landscape
- ✅ Split-view friendly (50% width)
- ✅ Navigation sidebar visible
- ✅ Large tap targets

### 3.3 Android (360×800)
**Steps:** Full Voyager journey
**Assertions:**
- ✅ Notch/gesture nav compatible
- ✅ Android fonts render correctly
- ✅ System back button works
- ✅ Safe area respected

---

## 4. Theme Verification (All 4 Themes)

For each theme (Light, Dark, Forest, Ocean), run Voyager journey and verify:
- ✅ Colors match design tokens
- ✅ Text contrast ≥4.5:1 (WCAG AA)
- ✅ Icons visible on all backgrounds
- ✅ Forms readable
- ✅ Maps overlay legible

### 4.1 Light Theme
- Background: #FFFFFF
- Text: #1A1A1A
- Primary: #2563EB

### 4.2 Dark Theme
- Background: #0F0F0F
- Text: #FFFFFF
- Primary: #60A5FA

### 4.3 Forest Theme
- Background: #1A3A34
- Text: #FFFFFF
- Primary: #10B981

### 4.4 Ocean Theme
- Background: #0C1E3A
- Text: #FFFFFF
- Primary: #0EA5E9

---

## 5. Playwright Configuration & Tests

### 5.1 Playwright Config (`playwright.config.ts`)
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 4,
  reporter: [
    ['html'],
    ['junit', { outputFile: 'test-results/junit.xml' }],
  ],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'safari',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 14'] },
    },
  ],

  webServer: {
    command: 'npm start',
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },
});
```

### 5.2 Voyager Journey E2E Test
```typescript
// e2e/voyager-journey.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Voyager Tier: Create & Customize Trip', () => {
  test('full journey: sign in → create trip → customize → save', async ({
    page,
  }) => {
    // Sign in
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'voyager@test.com');
    await page.fill('[data-testid="password-input"]', 'Password123!');
    await page.click('[data-testid="signin-button"]');

    // Wait for home screen
    await page.waitForURL('/home');
    expect(page.url()).toContain('/home');

    // Create new trip
    await page.click('[data-testid="new-trip-button"]');
    await page.waitForURL('/trip-creation');

    // Fill trip details
    await page.fill('[data-testid="destination-input"]', 'Barcelona');
    await page.fill('[data-testid="start-date-input"]', '2026-06-01');
    await page.fill('[data-testid="end-date-input"]', '2026-06-08');
    await page.fill('[data-testid="budget-input"]', '2000');

    // Generate itinerary
    await page.click('[data-testid="generate-button"]');

    // Wait for generation to complete
    const statusSpinner = page.locator('[data-testid="generation-spinner"]');
    await statusSpinner.waitFor({ state: 'hidden', timeout: 30000 });

    // Verify days are loaded
    const dayElements = page.locator('[data-testid="day-card"]');
    const dayCount = await dayElements.count();
    expect(dayCount).toBe(8);

    // Verify each day has venues
    const firstDayVenues = page.locator('[data-testid="venue-card"]');
    const venueCount = await firstDayVenues.count();
    expect(venueCount).toBeGreaterThanOrEqual(5);

    // Drag day 2 to position 1
    const day2 = page.locator('[data-testid="day-card-2"]');
    const day1 = page.locator('[data-testid="day-card-1"]');
    await day2.dragTo(day1);

    // Verify drag worked (order changed)
    const reorderedDays = page.locator('[data-testid="day-card"]');
    const secondDay = reorderedDays.nth(1);
    const secondDayText = await secondDay.textContent();
    expect(secondDayText).toContain('Day 2');

    // Open venue detail
    const firstVenue = firstDayVenues.first();
    await firstVenue.click();

    // Verify venue modal
    const venueModal = page.locator('[data-testid="venue-modal"]');
    await expect(venueModal).toBeVisible();
    const venueName = page.locator('[data-testid="venue-name"]');
    expect(venueName).toBeTruthy();

    // Close modal
    await page.click('[data-testid="modal-close-button"]');
    await expect(venueModal).not.toBeVisible();

    // Save trip
    await page.click('[data-testid="save-trip-button"]');

    // Verify save success
    const saveToast = page.locator('[data-testid="toast-success"]');
    await expect(saveToast).toBeVisible();
    await expect(saveToast).toContainText('Trip saved');

    // Verify trip status changed
    const tripStatus = page.locator('[data-testid="trip-status"]');
    await expect(tripStatus).toContainText('saved');
  });
});
```

### 5.3 Theme Switching E2E Test
```typescript
// e2e/theme-switching.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Theme Switching (All 4 Themes)', () => {
  const themes = ['light', 'dark', 'forest', 'ocean'];
  const themeColors = {
    light: { bg: 'rgb(255, 255, 255)' },
    dark: { bg: 'rgb(15, 15, 15)' },
    forest: { bg: 'rgb(26, 58, 52)' },
    ocean: { bg: 'rgb(12, 30, 58)' },
  };

  themes.forEach((theme) => {
    test(`${theme} theme loads and applies colors`, async ({ page }) => {
      await page.goto('/home');

      // Open settings
      await page.click('[data-testid="settings-button"]');
      await page.click('[data-testid="theme-section"]');

      // Select theme
      await page.click(`[data-testid="theme-${theme}"]`);

      // Verify background color changed
      const appContainer = page.locator('[data-testid="app-container"]');
      const bgColor = await appContainer.evaluate((el) =>
        window.getComputedStyle(el).backgroundColor
      );

      expect(bgColor).toBe(themeColors[theme].bg);

      // Verify text is readable (contrast test)
      const textElements = page.locator('text');
      const firstText = textElements.first();
      const textColor = await firstText.evaluate((el) =>
        window.getComputedStyle(el).color
      );
      expect(textColor).toBeTruthy();

      // Close and verify persistence
      await page.reload();
      const currentTheme = await page.locator('[data-testid="current-theme"]')
        .textContent();
      expect(currentTheme).toBe(theme);
    });
  });
});
```

### 5.4 Offline & Sync E2E Test
```typescript
// e2e/offline-sync.spec.ts
import { test, expect } from '@playwright/test';

test('offline action, sync when online', async ({ context, page }) => {
  await page.goto('/home');

  // Go offline (DevTools protocol)
  await context.setOffline(true);

  // Add venue to favorites
  await page.click('[data-testid="favorite-button"]');

  // Verify offline toast
  const offlineToast = page.locator('[data-testid="toast-offline"]');
  await expect(offlineToast).toBeVisible();

  // Go back online
  await context.setOffline(false);

  // Verify sync toast
  const syncToast = page.locator('[data-testid="toast-synced"]');
  await expect(syncToast).toBeVisible({ timeout: 5000 });

  // Verify venue still favorited
  const favoriteButton = page.locator('[data-testid="favorite-button"]');
  await expect(favoriteButton).toHaveAttribute('data-favorited', 'true');
});
```

---

## 6. Performance Metrics During E2E

Capture within each E2E test:
- Time to Interactive (TTI): <3s
- First Contentful Paint (FCP): <1.5s
- Largest Contentful Paint (LCP): <2.5s
- Cumulative Layout Shift (CLS): <0.1
- Trip generation time: 3–5s

```typescript
// e2e/helpers/performance.ts
export async function captureWebVitals(page: Page) {
  return await page.evaluate(() => {
    return {
      fcp: performance.getEntriesByName('first-contentful-paint')[0]?.startTime,
      lcp: performance.getEntriesByType('largest-contentful-paint')
        .slice(-1)[0]?.startTime,
      cls: performance.getEntriesByType('layout-shift')
        .reduce((sum: number, entry: any) => sum + entry.value, 0),
    };
  });
}
```

---

## 7. Running E2E Tests

```bash
# Run all E2E tests
npx playwright test

# Run specific test
npx playwright test voyager-journey

# Run in headed mode (see browser)
npx playwright test --headed

# Run on specific browser
npx playwright test --project=chromium

# Generate HTML report
npx playwright show-report

# Debug mode
npx playwright test --debug
```

---

## 8. CI/CD Integration

See `.github/workflows/e2e.yml` below (in GitHub CI/CD section).

---

## 9. Acceptance Criteria

✅ Voyager journey completes in <10 min
✅ Nomad Pro Social Intelligence loads data
✅ All 3 browsers pass (Chrome, Safari, Firefox)
✅ All 3 screen sizes responsive (Mobile, Tablet, Desktop)
✅ All 4 themes apply correctly
✅ Offline → sync → online works
✅ No visual regressions
✅ Performance targets met (FCP <1.5s, LCP <2.5s)
✅ All tests pass on CI

---

## 10. Deliverables

- `e2e/*.spec.ts` (6+ test files)
- `e2e/helpers/*.ts` (utilities, fixtures)
- `playwright.config.ts`
- E2E test report (HTML, JUnit XML)
- Performance metrics dashboard
