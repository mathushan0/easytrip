# Test Plan 4: Performance Testing

## Overview
Comprehensive performance auditing covering Web Vitals, bundle optimization, API response times, and Lighthouse scores.

**Scope:** Lighthouse audits, bundle size tracking, API latency, rendering performance, database query optimization.

**Tools:** Lighthouse CI, bundlesize, API load testing (k6), Performance Observer API.

**Targets:**
- Lighthouse Performance: >80
- Lighthouse Accessibility: >90
- Bundle Size: <500KB (main)
- FCP: <1.5s
- LCP: <2.5s
- CLS: <0.1
- API response time: <200ms (p95)

---

## 1. Lighthouse Audits

### 1.1 Lighthouse Configuration

Create `lighthouse-config.json`:
```json
{
  "extends": "lighthouse:default",
  "settings": {
    "onlyCategories": [
      "performance",
      "accessibility",
      "best-practices",
      "seo"
    ],
    "precomputedLanternConfigs": {
      "4G": {
        "latency": 50,
        "throughput": 4000000,
        "rtt": 20,
        "mobileSlow4G": false
      }
    },
    "skipAudits": ["unused-css-rules"]
  }
}
```

### 1.2 Lighthouse CI Setup

Create `.lighthouserc.json`:
```json
{
  "ci": {
    "collect": {
      "url": [
        "http://localhost:3000/home",
        "http://localhost:3000/trip-creation",
        "http://localhost:3000/itinerary/trip-123"
      ],
      "numberOfRuns": 3,
      "settings": {
        "configPath": "./lighthouse-config.json"
      }
    },
    "upload": {
      "target": "filesystem",
      "outputDir": "./lighthouse-reports"
    },
    "assert": {
      "preset": "lighthouse:recommended",
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.8 }],
        "categories:accessibility": ["error", { "minScore": 0.9 }],
        "categories:best-practices": ["error", { "minScore": 0.85 }],
        "categories:seo": ["error", { "minScore": 0.85 }]
      }
    }
  }
}
```

### 1.3 Performance Audit Test

```typescript
// e2e/performance/lighthouse.spec.ts
import { test, expect } from '@playwright/test';
import * as lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';

test('Lighthouse audit: Home screen', async () => {
  let chrome: any;

  try {
    chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] });

    const options = {
      logLevel: 'info',
      output: 'json',
      onlyCategories: ['performance', 'accessibility'],
      port: chrome.port,
    };

    const runnerResult = await lighthouse(
      'http://localhost:3000/home',
      options
    );

    const scores = runnerResult?.lhr?.categories;

    // Assert performance
    expect(scores?.performance?.score).toBeGreaterThanOrEqual(0.8);

    // Assert accessibility
    expect(scores?.accessibility?.score).toBeGreaterThanOrEqual(0.9);

    // Assert best practices
    expect(scores?.['best-practices']?.score).toBeGreaterThanOrEqual(0.85);

    // Log results
    console.log('Lighthouse scores:', {
      performance: scores?.performance?.score,
      accessibility: scores?.accessibility?.score,
    });
  } finally {
    if (chrome) {
      await chromeLauncher.kill(chrome.pid);
    }
  }
});
```

---

## 2. Web Vitals Monitoring

### 2.1 Custom Web Vitals Collector

```typescript
// src/lib/web-vitals.ts
import { getCLS, getFCP, getLCP, getFID, getTTFB } from 'web-vitals';

export interface WebVitalsMetrics {
  fcp: number; // First Contentful Paint
  lcp: number; // Largest Contentful Paint
  cls: number; // Cumulative Layout Shift
  fid: number; // First Input Delay
  ttfb: number; // Time to First Byte
}

export function initWebVitalsMonitoring() {
  const metrics: WebVitalsMetrics = {};

  getCLS((metric) => {
    metrics.cls = metric.value;
    console.log(`CLS: ${metric.value}`);
  });

  getFCP((metric) => {
    metrics.fcp = metric.value;
    console.log(`FCP: ${metric.value}ms`);
  });

  getLCP((metric) => {
    metrics.lcp = metric.value;
    console.log(`LCP: ${metric.value}ms`);
  });

  getFID((metric) => {
    metrics.fid = metric.value;
    console.log(`FID: ${metric.value}ms`);
  });

  getTTFB((metric) => {
    metrics.ttfb = metric.value;
    console.log(`TTFB: ${metric.value}ms`);
  });

  return metrics;
}

export function sendMetricsToAnalytics(metrics: WebVitalsMetrics) {
  if (navigator.sendBeacon) {
    navigator.sendBeacon('/api/metrics', JSON.stringify(metrics));
  }
}
```

### 2.2 Web Vitals E2E Tests

```typescript
// e2e/performance/web-vitals.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Web Vitals Performance', () => {
  test('Home screen: FCP < 1.5s, LCP < 2.5s, CLS < 0.1', async ({ page }) => {
    const vitals = await page.evaluate(() => {
      return new Promise((resolve) => {
        const metrics: any = {};

        // Observe CLS
        if ('PerformanceObserver' in window) {
          const clsObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (!(entry as any).hadRecentInput) {
                metrics.cls = (metrics.cls || 0) + (entry as any).value;
              }
            }
          });
          clsObserver.observe({ entryTypes: ['layout-shift'] });

          // Observe LCP
          const lcpObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            metrics.lcp = entries[entries.length - 1].startTime;
          });
          lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

          // Get FCP
          const fcpEntry = performance
            .getEntriesByName('first-contentful-paint')[0];
          metrics.fcp = fcpEntry?.startTime || 0;

          // Resolve after 3s (give time for all metrics to populate)
          setTimeout(() => resolve(metrics), 3000);
        }
      });
    });

    console.log('Web Vitals:', vitals);

    // Assert targets
    expect(vitals.fcp).toBeLessThan(1500); // 1.5s
    expect(vitals.lcp).toBeLessThan(2500); // 2.5s
    expect(vitals.cls).toBeLessThan(0.1);
  });

  test('Itinerary screen: Smooth scrolling (FPS > 50)', async ({ page }) => {
    await page.goto('/itinerary/trip-123');

    // Measure scroll performance
    const frameData = await page.evaluate(() => {
      let frameCount = 0;
      let lastTime = performance.now();

      return new Promise((resolve) => {
        const callback = () => {
          frameCount++;
          const now = performance.now();
          if (now - lastTime >= 1000) {
            // Every 1 second, check FPS
            resolve({ fps: frameCount });
          } else {
            requestAnimationFrame(callback);
          }
        };
        requestAnimationFrame(callback);
      });
    });

    expect(frameData.fps).toBeGreaterThan(50);
  });
});
```

---

## 3. Bundle Size Tracking

### 3.1 Bundle Size Configuration

Create `bundlesize.config.json`:
```json
{
  "files": [
    {
      "name": "main.js",
      "path": "./dist/main.*.js",
      "maxSize": "500kb"
    },
    {
      "name": "vendor.js",
      "path": "./dist/vendor.*.js",
      "maxSize": "300kb"
    },
    {
      "name": "app.css",
      "path": "./dist/app.*.css",
      "maxSize": "50kb"
    }
  ]
}
```

### 3.2 Bundle Analysis Script

```bash
#!/bin/bash
# scripts/analyze-bundle.sh

echo "Building..."
npm run build

echo "Analyzing bundle..."
npx webpack-bundle-analyzer dist/stats.json

echo "Checking size limits..."
npx bundlesize
```

### 3.3 Bundle Size Test

```typescript
// test/performance/bundle-size.test.ts
import fs from 'fs';
import path from 'path';

describe('Bundle Size Performance', () => {
  const distDir = path.resolve(__dirname, '../../dist');

  it('main.js bundle < 500KB', () => {
    const mainFile = fs.readdirSync(distDir).find((f) =>
      f.startsWith('main.')
    );
    const size = fs.statSync(path.join(distDir, mainFile)).size / 1024;
    console.log(`main.js: ${size.toFixed(2)} KB`);
    expect(size).toBeLessThan(500);
  });

  it('vendor.js bundle < 300KB', () => {
    const vendorFile = fs.readdirSync(distDir).find((f) =>
      f.startsWith('vendor.')
    );
    const size = fs.statSync(path.join(distDir, vendorFile)).size / 1024;
    console.log(`vendor.js: ${size.toFixed(2)} KB`);
    expect(size).toBeLessThan(300);
  });

  it('CSS bundle < 50KB', () => {
    const cssFile = fs.readdirSync(distDir).find((f) => f.endsWith('.css'));
    const size = fs.statSync(path.join(distDir, cssFile)).size / 1024;
    console.log(`app.css: ${size.toFixed(2)} KB`);
    expect(size).toBeLessThan(50);
  });
});
```

---

## 4. API Response Time Testing

### 4.1 API Load Testing with k6

Create `k6-load-test.js`:
```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 10, // 10 virtual users
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(95)<200'], // 95th percentile < 200ms
    http_req_failed: ['rate<0.1'], // Error rate < 10%
  },
};

export default function () {
  // Test /api/v1/trips
  const tripsRes = http.get(
    'http://localhost:3000/api/v1/trips?limit=20',
    {
      headers: {
        Authorization: 'Bearer mock-token',
      },
    }
  );

  check(tripsRes, {
    'trips status is 200': (r) => r.status === 200,
    'trips response < 200ms': (r) => r.timings.duration < 200,
  });

  sleep(1);

  // Test /api/v1/trips/:id
  const tripRes = http.get('http://localhost:3000/api/v1/trips/trip-123', {
    headers: {
      Authorization: 'Bearer mock-token',
    },
  });

  check(tripRes, {
    'trip detail status is 200': (r) => r.status === 200,
    'trip detail response < 200ms': (r) => r.timings.duration < 200,
  });

  sleep(1);

  // Test /api/v1/venues search
  const venuesRes = http.get(
    'http://localhost:3000/api/v1/venues?lat=48.858&lng=2.294&radius=5',
    {
      headers: {
        Authorization: 'Bearer mock-token',
      },
    }
  );

  check(venuesRes, {
    'venues status is 200': (r) => r.status === 200,
    'venues response < 200ms': (r) => r.timings.duration < 200,
  });

  sleep(1);
}
```

### 4.2 API Response Time Test

```typescript
// server/src/routes/__tests__/performance.test.ts
import request from 'supertest';
import app from '../../index';

describe('API Response Time Performance', () => {
  it('GET /trips responds in < 200ms', async () => {
    const start = performance.now();

    const res = await request(app.server)
      .get('/api/v1/trips?limit=20')
      .set('Authorization', `Bearer ${mockToken}`);

    const duration = performance.now() - start;

    expect(res.status).toBe(200);
    expect(duration).toBeLessThan(200);
    console.log(`GET /trips: ${duration.toFixed(2)}ms`);
  });

  it('GET /trips/:id responds in < 200ms', async () => {
    const start = performance.now();

    const res = await request(app.server)
      .get('/api/v1/trips/trip-123')
      .set('Authorization', `Bearer ${mockToken}`);

    const duration = performance.now() - start;

    expect(res.status).toBe(200);
    expect(duration).toBeLessThan(200);
    console.log(`GET /trips/:id: ${duration.toFixed(2)}ms`);
  });

  it('POST /trips responds in < 500ms (includes AI generation)', async () => {
    const start = performance.now();

    const res = await request(app.server)
      .post('/api/v1/trips')
      .set('Authorization', `Bearer ${mockToken}`)
      .send({
        destination: 'London',
        start_date: '2026-05-01',
        end_date: '2026-05-08',
      });

    const duration = performance.now() - start;

    expect(res.status).toBe(201);
    expect(duration).toBeLessThan(500);
    console.log(`POST /trips: ${duration.toFixed(2)}ms`);
  });

  it('99th percentile response time < 400ms', async () => {
    const times = [];

    for (let i = 0; i < 100; i++) {
      const start = performance.now();

      await request(app.server)
        .get('/api/v1/trips?limit=20')
        .set('Authorization', `Bearer ${mockToken}`);

      times.push(performance.now() - start);
    }

    times.sort((a, b) => a - b);
    const p99 = times[Math.floor(times.length * 0.99)];

    console.log(`P99 response time: ${p99.toFixed(2)}ms`);
    expect(p99).toBeLessThan(400);
  });
});
```

---

## 5. Database Query Performance

### 5.1 Query Time Tests

```typescript
// server/src/db/__tests__/query-performance.test.ts
import { db } from '../index';
import { trips, venues } from '../schema';
import { eq } from 'drizzle-orm';

describe('Database Query Performance', () => {
  it('fetching 100 trips < 50ms', async () => {
    const start = performance.now();

    const result = await db
      .select()
      .from(trips)
      .limit(100);

    const duration = performance.now() - start;

    expect(duration).toBeLessThan(50);
    console.log(`Fetch 100 trips: ${duration.toFixed(2)}ms`);
  });

  it('joining trips + venues < 100ms', async () => {
    const start = performance.now();

    const result = await db
      .select()
      .from(trips)
      .innerJoin(venues, eq(trips.id, venues.trip_id))
      .limit(1000);

    const duration = performance.now() - start;

    expect(duration).toBeLessThan(100);
    console.log(`Join trips+venues (1000 rows): ${duration.toFixed(2)}ms`);
  });
});
```

### 5.2 Index Verification

Create `scripts/check-indexes.sql`:
```sql
-- Verify all critical indexes exist
SELECT
  schemaname, tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Check index usage
SELECT
  idx_scan,
  idx_tup_read,
  idx_tup_fetch,
  indexrelname
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

---

## 6. Rendering Performance

### 6.1 React Component Render Times

```typescript
// src/components/__tests__/render-performance.test.tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import { Itinerary } from '../screens/Itinerary';

describe('Component Render Performance', () => {
  it('renders Itinerary with 100 venues < 500ms', () => {
    const mockTrip = {
      id: '1',
      days: Array(8)
        .fill(null)
        .map((_, i) => ({
          id: `day-${i}`,
          venues: Array(12)
            .fill(null)
            .map((_, j) => ({
              id: `venue-${i}-${j}`,
              name: `Venue ${j}`,
              lat: 48.858,
              lng: 2.294,
            })),
        })),
    };

    const start = performance.now();

    render(<Itinerary trip={mockTrip} />);

    const duration = performance.now() - start;

    console.log(`Render Itinerary (96 venues): ${duration.toFixed(2)}ms`);
    expect(duration).toBeLessThan(500);
  });

  it('drag-to-reorder 20 items remains 60+ FPS', async () => {
    // Test with Playwright perf observer
  });
});
```

---

## 7. Performance Dashboard (Optional)

Create `scripts/performance-dashboard.js` to track metrics over time:

```javascript
// Stores metrics in JSON file, tracks trends
const fs = require('fs');
const path = require('path');

const metricsFile = path.resolve(__dirname, '../performance-metrics.json');

function recordMetrics(metrics) {
  const existing = JSON.parse(
    fs.readFileSync(metricsFile, 'utf-8') || '{"history": []}'
  );

  existing.history.push({
    timestamp: new Date().toISOString(),
    ...metrics,
  });

  // Keep last 30 runs
  if (existing.history.length > 30) {
    existing.history = existing.history.slice(-30);
  }

  fs.writeFileSync(metricsFile, JSON.stringify(existing, null, 2));
}

module.exports = { recordMetrics };
```

---

## 8. Running Performance Tests

```bash
# Lighthouse CI
npm run lighthouse:ci

# Bundle analysis
npm run bundle:analyze

# Web Vitals E2E
npx playwright test e2e/performance/web-vitals.spec.ts

# API load test (k6)
k6 run k6-load-test.js

# Database performance
npm test -- --testPathPattern=query-performance

# Full performance suite
npm run test:performance
```

---

## 9. CI/CD Performance Checks

Add to `.github/workflows/performance.yml`:

```yaml
name: Performance Tests

on: [push, pull_request]

jobs:
  performance:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Install dependencies
        run: npm install

      - name: Start server
        run: npm run dev &

      - name: Lighthouse CI
        run: npm run lighthouse:ci

      - name: Bundle size check
        run: npx bundlesize

      - name: API load test
        run: k6 run k6-load-test.js

      - name: Upload results
        uses: actions/upload-artifact@v3
        with:
          name: performance-reports
          path: |
            lighthouse-reports/
            coverage/
```

---

## 10. Acceptance Criteria

✅ Lighthouse Performance >80
✅ Lighthouse Accessibility >90
✅ FCP <1.5s
✅ LCP <2.5s
✅ CLS <0.1
✅ Bundle size: main <500KB, vendor <300KB
✅ API p95 response time <200ms
✅ Database queries <100ms
✅ Component render time <500ms
✅ No performance regressions vs. main branch

---

## 11. Deliverables

- `lighthouse-config.json` + `.lighthouserc.json`
- `bundlesize.config.json`
- `k6-load-test.js`
- `e2e/performance/*.spec.ts` (3+ test files)
- `server/src/**/__tests__/performance.test.ts`
- `scripts/analyze-bundle.sh`, `check-indexes.sql`
- Performance report (HTML, JSON)
- Dashboard: `performance-metrics.json`
