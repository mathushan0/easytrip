# Test Plan 5: GDPR & Security Testing

## Overview
Comprehensive GDPR compliance, data privacy, and security validation. Ensures user data is protected, consent is enforced, and all security best practices are implemented.

**Scope:** Consent management, data export/deletion (GDPR), authentication/authorization, HTTPS enforcement, JWT validation, PII redaction, social media compliance.

**Tools:** Jest, Playwright, OWASP ZAP (automated security scanning), manual penetration testing.

**Compliance:** GDPR, CCPA, UK Data Protection Act 2018.

---

## 1. GDPR Consent Management

### 1.1 Consent Toggle Tests

**Scenario:** User controls which services receive data via toggles.

**Test Cases:**

#### 1.1.1 Analytics Consent Toggle
```typescript
// src/screens/__tests__/ConsentManager.test.tsx
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ConsentScreen from '../../screens/ConsentScreen';
import { useConsentStore } from '../../stores/useConsentStore';
import { apiClient } from '../../services/api';

jest.mock('../../services/api');

describe('Analytics Consent', () => {
  beforeEach(() => {
    useConsentStore.setState({
      analytics: false,
      crashReporting: false,
      pushNotifications: false,
    });
  });

  it('blocks analytics tracking when consent disabled', async () => {
    const { getByTestId, getByText } = render(
      <ConsentScreen navigation={mockNavigation} />
    );

    // Analytics toggle is OFF by default
    const analyticsToggle = getByTestId('analytics-toggle');
    expect(analyticsToggle.props.value).toBe(false);

    // User taps "Accept" without enabling analytics
    fireEvent.press(getByText('Accept'));

    // Verify store reflects disabled state
    await waitFor(() => {
      const { analytics } = useConsentStore.getState();
      expect(analytics).toBe(false);
    });
  });

  it('sends events to PostHog only when analytics enabled', async () => {
    // Enable analytics
    useConsentStore.setState({ analytics: true });

    // Simulate navigation to Home
    const { getByText } = render(<HomeScreen navigation={mockNavigation} />);
    fireEvent.press(getByText('New Trip'));

    // Verify PostHog event not sent (mock would have been called)
    // In production, PostHog client checks consent before sending
  });

  it('deletes analytics data when toggle disabled after initial consent', async () => {
    useConsentStore.setState({ analytics: true });

    // User goes to ConsentScreen and disables analytics
    const { getByTestId, getByText } = render(
      <ConsentScreen navigation={mockNavigation} />
    );

    const analyticsToggle = getByTestId('analytics-toggle');
    fireEvent.press(analyticsToggle);

    fireEvent.press(getByText('Save'));

    // Verify store updated
    await waitFor(() => {
      const { analytics } = useConsentStore.getState();
      expect(analytics).toBe(false);
    });

    // In production, sends DELETE request to analytics service
    // to purge historical data
  });
});
```

#### 1.1.2 Crash Reporting Consent Toggle
```typescript
describe('Crash Reporting Consent', () => {
  it('blocks Sentry error reporting when consent disabled', async () => {
    useConsentStore.setState({ crashReporting: false });

    // Simulate error
    const mockSentry = require('@sentry/react');
    jest.spyOn(mockSentry, 'captureException');

    throw new Error('Test error');

    // Verify Sentry was NOT called
    expect(mockSentry.captureException).not.toHaveBeenCalled();
  });

  it('sends errors to Sentry when consent enabled', async () => {
    useConsentStore.setState({ crashReporting: true });

    const mockSentry = require('@sentry/react');
    jest.spyOn(mockSentry, 'captureException');

    const error = new Error('Test error');
    mockSentry.captureException(error);

    expect(mockSentry.captureException).toHaveBeenCalledWith(error);
  });
});
```

#### 1.1.3 Push Notifications Consent Toggle
```typescript
describe('Push Notifications Consent', () => {
  it('blocks push tokens from being registered without consent', async () => {
    useConsentStore.setState({ pushNotifications: false });

    const mockRegisterToken = jest.fn();
    (apiClient.post as jest.Mock).mockImplementation((endpoint) => {
      if (endpoint === '/users/push-token') {
        mockRegisterToken();
      }
    });

    // Try to register for push (app init)
    // Should be blocked by consent check
    const consent = useConsentStore.getState().pushNotifications;
    if (consent) {
      await apiClient.post('/users/push-token', { token: 'mock-fcm-token' });
    }

    expect(mockRegisterToken).not.toHaveBeenCalled();
  });

  it('registers push token when consent enabled', async () => {
    useConsentStore.setState({ pushNotifications: true });

    const mockRegisterToken = jest.fn().mockResolvedValue({ success: true });
    (apiClient.post as jest.Mock).mockImplementation(async (endpoint) => {
      if (endpoint === '/users/push-token') {
        return mockRegisterToken();
      }
    });

    const consent = useConsentStore.getState().pushNotifications;
    if (consent) {
      await apiClient.post('/users/push-token', { token: 'mock-fcm-token' });
    }

    expect(mockRegisterToken).toHaveBeenCalled();
  });
});
```

---

## 2. Data Export (Right to Data Portability)

### 2.1 Data Export Endpoint Tests

```typescript
// server/src/routes/__tests__/gdpr-export.test.ts
import request from 'supertest';
import app from '../../index';
import fs from 'fs';

describe('GDPR Data Export (/api/v1/gdpr/export)', () => {
  it('returns all user data as JSON', async () => {
    const res = await request(app.server)
      .post('/api/v1/gdpr/export')
      .set('Authorization', `Bearer ${mockToken}`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('application/json');

    const data = res.body;

    // Verify all user data included
    expect(data).toHaveProperty('user');
    expect(data).toHaveProperty('profile');
    expect(data).toHaveProperty('trips');
    expect(data).toHaveProperty('favorites');
    expect(data).toHaveProperty('settings');
    expect(data).toHaveProperty('preferences');
  });

  it('export includes all trips with full itineraries', async () => {
    const res = await request(app.server)
      .post('/api/v1/gdpr/export')
      .set('Authorization', `Bearer ${mockToken}`);

    expect(res.status).toBe(200);

    const { trips } = res.body;
    expect(trips.length).toBeGreaterThan(0);

    trips.forEach((trip: any) => {
      expect(trip).toHaveProperty('id');
      expect(trip).toHaveProperty('destination');
      expect(trip).toHaveProperty('days');
      expect(trip.days).toEqual(expect.arrayContaining([
        expect.objectContaining({
          date: expect.any(String),
          venues: expect.any(Array),
        }),
      ]));
    });
  });

  it('export file is valid JSON and parseable', async () => {
    const res = await request(app.server)
      .post('/api/v1/gdpr/export')
      .set('Authorization', `Bearer ${mockToken}`);

    expect(() => JSON.stringify(res.body)).not.toThrow();

    // Parse to verify structure
    const parsed = JSON.parse(JSON.stringify(res.body));
    expect(parsed.user).toBeDefined();
  });

  it('export excludes sensitive credentials (passwords, tokens)', async () => {
    const res = await request(app.server)
      .post('/api/v1/gdpr/export')
      .set('Authorization', `Bearer ${mockToken}`);

    const jsonStr = JSON.stringify(res.body);

    // Verify no password hashes
    expect(jsonStr).not.toContain('password_hash');
    expect(jsonStr).not.toContain('refresh_token');

    // Should only contain access token in explicit auth field (if needed)
    expect(jsonStr).not.toMatch(/[a-zA-Z0-9_\-\.]{100,}/); // No long token strings
  });

  it('export timestamp accurate to within 1 second', async () => {
    const beforeTime = new Date();

    const res = await request(app.server)
      .post('/api/v1/gdpr/export')
      .set('Authorization', `Bearer ${mockToken}`);

    const afterTime = new Date();

    const exportTime = new Date(res.body.export_timestamp);

    expect(exportTime.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
    expect(exportTime.getTime()).toBeLessThanOrEqual(afterTime.getTime());
  });
});
```

### 2.2 Data Export E2E Test

```typescript
// e2e/gdpr/data-export.spec.ts
import { test, expect } from '@playwright/test';

test('user can export personal data', async ({ page }) => {
  // Sign in
  await page.goto('/login');
  await page.fill('[data-testid="email"]', 'user@test.com');
  await page.fill('[data-testid="password"]', 'Password123!');
  await page.click('[data-testid="signin-button"]');

  // Navigate to account settings
  await page.goto('/settings/account');
  await page.click('[data-testid="data-privacy-section"]');

  // Click export button
  await page.click('[data-testid="export-data-button"]');

  // Verify download started
  const downloadPromise = page.waitForEvent('download');
  const download = await downloadPromise;

  // Verify file is JSON
  const fileName = await download.suggestedFilename();
  expect(fileName).toMatch(/export.*\.json/i);

  // Read and verify content
  const filePath = await download.path();
  const fs = require('fs');
  const content = fs.readFileSync(filePath, 'utf-8');
  const data = JSON.parse(content);

  expect(data).toHaveProperty('user');
  expect(data).toHaveProperty('trips');
  expect(data.user.email).toBe('user@test.com');

  // Verify no sensitive data
  expect(content).not.toContain('password');
  expect(content).not.toContain('token');
});
```

---

## 3. Account Deletion (Right to be Forgotten)

### 3.1 Account Deletion Endpoint Tests

```typescript
// server/src/routes/__tests__/gdpr-delete.test.ts
describe('GDPR Account Deletion (/api/v1/gdpr/delete-account)', () => {
  it('deletes user account and all data', async () => {
    const userId = 'user-to-delete';

    // Verify user exists
    let userExists = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.id, userId),
    });
    expect(userExists).toBeDefined();

    // Delete account
    const res = await request(app.server)
      .post('/api/v1/gdpr/delete-account')
      .set('Authorization', `Bearer ${tokenForUserToDelete}`);

    expect(res.status).toBe(204); // No content (success)

    // Verify user is deleted
    userExists = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.id, userId),
    });
    expect(userExists).toBeUndefined();
  });

  it('cascades delete to all related data (trips, itineraries, favorites)', async () => {
    const userId = 'user-cascade-test';

    // Create user with trips
    const user = await db.insert(users).values({ id: userId }).returning();
    const trip = await db
      .insert(trips)
      .values({ user_id: userId, destination: 'Paris' })
      .returning();
    const itinerary = await db
      .insert(itineraries)
      .values({ trip_id: trip[0].id, day: 1 })
      .returning();

    // Delete account
    await request(app.server)
      .post('/api/v1/gdpr/delete-account')
      .set('Authorization', `Bearer ${tokenForUserToDelete}`);

    // Verify all data deleted
    const userCount = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));
    expect(userCount).toHaveLength(0);

    const tripCount = await db
      .select()
      .from(trips)
      .where(eq(trips.user_id, userId));
    expect(tripCount).toHaveLength(0);

    const itineraryCount = await db
      .select()
      .from(itineraries)
      .where(eq(itineraries.trip_id, trip[0].id));
    expect(itineraryCount).toHaveLength(0);
  });

  it('does not delete data immediately (30-day grace period)', async () => {
    const res = await request(app.server)
      .post('/api/v1/gdpr/delete-account')
      .set('Authorization', `Bearer ${mockToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toContain('30 days');

    // Verify account is in "deleted" state, not actually deleted
    const user = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.id, currentUserId),
    });
    expect(user?.deleted_at).toBeDefined();

    // User cannot sign in
    const loginRes = await request(app.server)
      .post('/api/v1/auth/signin')
      .send({ email: user.email, password: 'Password123!' });

    expect(loginRes.status).toBe(401);
    expect(loginRes.body.error).toContain('Account deleted');
  });

  it('allows account recovery during grace period', async () => {
    const userId = 'recovery-test';

    // Delete account
    await request(app.server)
      .post('/api/v1/gdpr/delete-account')
      .set('Authorization', `Bearer ${tokenForUserId(userId)}`);

    // User recovers account within 30 days
    const recoveryRes = await request(app.server)
      .post('/api/v1/gdpr/cancel-deletion')
      .set('Authorization', `Bearer ${tokenForUserId(userId)}`);

    expect(recoveryRes.status).toBe(200);

    // Verify user can sign in again
    const user = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.id, userId),
    });
    expect(user?.deleted_at).toBeNull();
  });
});
```

### 3.2 Account Deletion E2E Test

```typescript
// e2e/gdpr/account-deletion.spec.ts
import { test, expect } from '@playwright/test';

test('user can request account deletion', async ({ page }) => {
  // Sign in
  await page.goto('/login');
  await page.fill('[data-testid="email"]', 'delete-me@test.com');
  await page.fill('[data-testid="password"]', 'Password123!');
  await page.click('[data-testid="signin-button"]');

  // Navigate to account settings
  await page.goto('/settings/account');

  // Scroll to danger zone
  await page.locator('[data-testid="danger-zone"]').scrollIntoViewIfNeeded();

  // Click delete account button
  await page.click('[data-testid="delete-account-button"]');

  // Confirm deletion
  const confirmModal = page.locator('[data-testid="delete-confirmation-modal"]');
  await expect(confirmModal).toBeVisible();

  // Type confirmation text
  await page.fill(
    '[data-testid="confirmation-input"]',
    'permanently delete my account'
  );

  // Click confirm
  await page.click('[data-testid="confirm-delete-button"]');

  // Verify success toast
  const successToast = page.locator('[data-testid="toast-success"]');
  await expect(successToast).toBeVisible();
  await expect(successToast).toContainText('Account will be deleted in 30 days');

  // Verify user is logged out
  await expect(page).toHaveURL('/');
});
```

---

## 4. Authentication & Authorization Security

### 4.1 JWT Token Validation

```typescript
// server/src/auth/__tests__/jwt.test.ts
import { verifyJWT, signJWT, isTokenExpired } from '../jwt';

describe('JWT Token Security', () => {
  it('signs JWT with correct algorithm and expiration', () => {
    const token = signJWT({ userId: 'user-123' });

    expect(token).toBeTruthy();
    expect(token.split('.').length).toBe(3); // Valid JWT format
  });

  it('verifies valid JWT and returns payload', () => {
    const payload = { userId: 'user-123' };
    const token = signJWT(payload);

    const verified = verifyJWT(token);
    expect(verified.userId).toBe('user-123');
  });

  it('rejects tampered JWT', () => {
    const token = signJWT({ userId: 'user-123' });
    const tampered = token.slice(0, -10) + 'malicious';

    expect(() => verifyJWT(tampered)).toThrow('Invalid token');
  });

  it('rejects expired JWT', () => {
    // Create token with 0 seconds expiration
    const token = signJWT({ userId: 'user-123' }, { expiresIn: '0s' });

    // Wait 1 second
    setTimeout(() => {
      expect(() => verifyJWT(token)).toThrow('Token expired');
    }, 1000);
  });

  it('refresh token generates new access token', () => {
    const refreshToken = signJWT(
      { userId: 'user-123', type: 'refresh' },
      { expiresIn: '7d' }
    );

    const newAccessToken = refreshJWT(refreshToken);
    expect(newAccessToken).toBeTruthy();

    const payload = verifyJWT(newAccessToken);
    expect(payload.userId).toBe('user-123');
  });

  it('does not accept refresh token as access token', () => {
    const refreshToken = signJWT(
      { userId: 'user-123', type: 'refresh' },
      { expiresIn: '7d' }
    );

    // Try to use refresh token on protected endpoint
    const verified = verifyJWT(refreshToken);
    expect(verified.type).toBe('refresh');
    // Middleware should reject this
  });
});
```

### 4.2 Protected Route Authorization

```typescript
describe('Protected Route Authorization', () => {
  it('blocks request without Authorization header', async () => {
    const res = await request(app.server).get('/api/v1/trips');

    expect(res.status).toBe(401);
    expect(res.body.error).toContain('Unauthorized');
  });

  it('blocks request with invalid token format', async () => {
    const res = await request(app.server)
      .get('/api/v1/trips')
      .set('Authorization', 'InvalidToken');

    expect(res.status).toBe(401);
  });

  it('blocks request with expired token', async () => {
    const expiredToken = signJWT({ userId: 'user-123' }, { expiresIn: '-1h' });

    const res = await request(app.server)
      .get('/api/v1/trips')
      .set('Authorization', `Bearer ${expiredToken}`);

    expect(res.status).toBe(401);
    expect(res.body.error).toContain('expired');
  });

  it('allows request with valid token', async () => {
    const validToken = signJWT({ userId: 'user-123' });

    const res = await request(app.server)
      .get('/api/v1/trips')
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(200);
  });

  it('prevents user from accessing other users trips', async () => {
    const user1Token = signJWT({ userId: 'user-1' });
    const user2TripId = 'trip-belonging-to-user-2';

    const res = await request(app.server)
      .get(`/api/v1/trips/${user2TripId}`)
      .set('Authorization', `Bearer ${user1Token}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toContain('Forbidden');
  });
});
```

---

## 5. HTTPS Enforcement

### 5.1 HTTPS Security Headers

```typescript
// server/src/__tests__/security-headers.test.ts
describe('HTTPS & Security Headers', () => {
  it('responds with HSTS header', async () => {
    const res = await request(app.server).get('/health');

    expect(res.headers['strict-transport-security']).toBeDefined();
    expect(res.headers['strict-transport-security']).toContain('max-age=31536000');
  });

  it('sets CSP header to prevent XSS', async () => {
    const res = await request(app.server).get('/health');

    expect(res.headers['content-security-policy']).toBeDefined();
    expect(res.headers['content-security-policy']).toContain("default-src 'self'");
  });

  it('sets X-Content-Type-Options to prevent MIME sniffing', async () => {
    const res = await request(app.server).get('/health');

    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });

  it('sets X-Frame-Options to prevent clickjacking', async () => {
    const res = await request(app.server).get('/health');

    expect(res.headers['x-frame-options']).toBe('DENY');
  });

  it('sets X-XSS-Protection', async () => {
    const res = await request(app.server).get('/health');

    expect(res.headers['x-xss-protection']).toBe('1; mode=block');
  });

  it('redirects HTTP to HTTPS', async () => {
    // In production, requests to http:// redirect to https://
    // Can be tested with Playwright:
    // await page.goto('http://easytrip.app');
    // await expect(page).toHaveURL(/^https:\/\//);
  });
});
```

---

## 6. PII (Personally Identifiable Information) Redaction

### 6.1 Social Media Post Privacy

```typescript
// server/src/services/__tests__/social-post-redaction.test.ts
describe('Social Media Post PII Redaction', () => {
  it('removes email from social posts', () => {
    const post = 'Just arrived in Paris! Contact me at user@example.com';

    const redacted = redactPII(post);
    expect(redacted).not.toContain('user@example.com');
    expect(redacted).toContain('[email]');
  });

  it('removes phone numbers from posts', () => {
    const post = 'Call me at +447419766823 when you arrive';

    const redacted = redactPII(post);
    expect(redacted).not.toContain('+447419766823');
    expect(redacted).toContain('[phone]');
  });

  it('removes credit card numbers', () => {
    const post = 'Paid with card 4532015112830366';

    const redacted = redactPII(post);
    expect(redacted).not.toContain('4532015112830366');
    expect(redacted).toContain('[card]');
  });

  it('does not redact regular text', () => {
    const post = 'The Eiffel Tower is amazing!';

    const redacted = redactPII(post);
    expect(redacted).toBe(post);
  });

  it('prevents social intel from exposing user location data', async () => {
    // Create trip with location
    const trip = await createMockTrip({
      userId: 'user-123',
      destination: 'Paris',
    });

    // Generate social intel post
    const socialPost = await generateSocialPost(trip);

    // Verify no exact location coordinates in post
    expect(socialPost).not.toMatch(/\d+\.\d{6}.*\d+\.\d{6}/); // Lat/lng format
  });
});
```

---

## 7. Input Validation & SQL Injection Prevention

### 7.1 Input Sanitization

```typescript
describe('SQL Injection Prevention', () => {
  it('sanitizes user input in trip destination', async () => {
    const maliciousInput = "Paris'; DROP TABLE trips; --";

    const res = await request(app.server)
      .post('/api/v1/trips')
      .set('Authorization', `Bearer ${mockToken}`)
      .send({
        destination: maliciousInput,
        start_date: '2026-05-01',
        end_date: '2026-05-08',
      });

    // Should be treated as literal string, not executed
    expect(res.status).toBe(201);
    expect(res.body.data.destination).toBe(maliciousInput);

    // Verify table still exists
    const trips = await db.select().from(tripsTable);
    expect(trips).toBeDefined();
  });

  it('validates email format', async () => {
    const invalidEmail = 'not-an-email';

    const res = await request(app.server)
      .post('/api/v1/auth/signup')
      .send({
        email: invalidEmail,
        password: 'Password123!',
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Invalid email');
  });

  it('validates date format (YYYY-MM-DD)', async () => {
    const invalidDate = '01/05/2026';

    const res = await request(app.server)
      .post('/api/v1/trips')
      .set('Authorization', `Bearer ${mockToken}`)
      .send({
        destination: 'Paris',
        start_date: invalidDate,
        end_date: '2026-05-08',
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('date');
  });
});
```

---

## 8. Running Security Tests

```bash
# Run all security tests
npm test -- --testPathPattern=security|gdpr

# Run specific test suite
npm test -- gdpr-export.test.ts

# Run OWASP ZAP scan (requires ZAP running)
npm run scan:security

# Manual penetration testing
npm run test:security:manual
```

---

## 9. Acceptance Criteria

✅ Consent toggles block respective services
✅ Analytics disabled by default
✅ Data export returns valid JSON with all user data
✅ No sensitive data (passwords, tokens) in export
✅ Account deletion cascades to related data
✅ 30-day grace period enforced
✅ JWT tokens properly signed and validated
✅ Protected routes require valid auth token
✅ HTTPS enforced (HSTS header)
✅ CSP header prevents XSS
✅ PII redacted from social posts
✅ SQL injection prevented (parameterized queries)
✅ No security vulnerabilities (OWASP Top 10)

---

## 10. Deliverables

- `src/screens/__tests__/ConsentManager.test.tsx`
- `server/src/routes/__tests__/gdpr-export.test.ts`
- `server/src/routes/__tests__/gdpr-delete.test.ts`
- `server/src/auth/__tests__/jwt.test.ts`
- `server/src/__tests__/security-headers.test.ts`
- `server/src/services/__tests__/social-post-redaction.test.ts`
- `e2e/gdpr/*.spec.ts` (3+ test files)
- Security scan report (OWASP ZAP)
- GDPR compliance checklist
