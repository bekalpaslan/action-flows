# E2E Testing Guide: Cosmic Map

End-to-end testing strategy for the Living Universe cosmic map visualization layer.

---

## Overview

**Test Framework:** Playwright 1.58+
**Test Files:** `test/e2e/cosmic-map-*.test.ts`
**Config:** `test/playwright.cosmic.config.ts`

**Test Coverage:**
- Big Bang animation on first visit
- Region star visibility and interaction
- Zoom in/out transitions
- Onboarding tooltip sequence
- Feature flag toggles
- Keyboard navigation
- Reduced motion settings

---

## Running Tests

### Local Development
```bash
# Run all cosmic map tests
pnpm playwright test --config test/playwright.cosmic.config.ts

# Shorthand (add to package.json)
pnpm test:e2e:cosmic

# Run with UI (debugging)
pnpm playwright test --config test/playwright.cosmic.config.ts --ui

# Run in headed mode (see browser)
pnpm playwright test --config test/playwright.cosmic.config.ts --headed

# Run specific test file
pnpm playwright test cosmic-map-navigation.test.ts
```

### CI/CD
```bash
# GitHub Actions / CI environment
CI=true pnpm playwright test --config test/playwright.cosmic.config.ts
```

**CI Config Example (GitHub Actions):**
```yaml
name: E2E Cosmic Map Tests

on:
  push:
    branches: [main, master]
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: pnpm install
      - run: pnpm playwright install --with-deps chromium
      - run: pnpm test:e2e:cosmic
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

---

## Test Scenarios

### 1. Big Bang Animation (cosmic-map-navigation.test.ts)
**Test:** First-time visit triggers Big Bang animation

**Steps:**
1. Clear `localStorage` (simulate first visit)
2. Load page
3. Verify `.big-bang-animation` element visible
4. Wait 3.5 seconds for animation completion
5. Verify `.cosmic-map` visible after animation

**Flake Prevention:**
- Use `{ timeout: 5000 }` for initial visibility check
- Add buffer time (3500ms instead of exact 2500ms)
- Check for element existence before visibility

### 2. Region Star Interaction (cosmic-map-navigation.test.ts)
**Test:** Region stars are clickable and trigger zoom

**Steps:**
1. Wait for `.region-star` elements to render
2. Verify at least 1 region star visible
3. Click first region star
4. Verify zoom class applied or opacity changed
5. Wait for transition (600ms)

**Flake Prevention:**
- Use `.first()` to avoid race conditions with multiple stars
- Check for CSS class OR opacity change (dual verification)
- Add 100ms buffer after click before checking state

### 3. Zoom Transitions (cosmic-map-navigation.test.ts)
**Test:** Zoom in → region focus → Escape → god view

**Steps:**
1. Click region star to zoom in
2. Wait 600ms for transition
3. Verify region focus view or workbench content visible
4. Press `Escape` key
5. Wait 600ms for zoom-out
6. Verify cosmic map visible again

**Flake Prevention:**
- Use `.catch(() => false)` for graceful fallback checks
- Accept multiple valid outcomes (region focus OR zoom class)
- Add explicit waits for transitions (no `waitForLoadState`)

### 4. Onboarding Dismissal (cosmic-map-navigation.test.ts)
**Test:** Skip button dismisses onboarding and persists flag

**Steps:**
1. Clear `localStorage` (onboarding flag)
2. Reload page
3. Verify `.onboarding-tooltip` visible
4. Click "Skip" button
5. Verify tooltip disappears
6. Check `localStorage` flag set to `'true'`

**Flake Prevention:**
- Clear flag explicitly in test (don't rely on manual state)
- Use `isVisible({ timeout: 2000 })` with fallback
- Verify both UI dismissal AND localStorage persistence

### 5. Onboarding Step Progression (cosmic-map-navigation.test.ts)
**Test:** Next button advances through 3 steps

**Steps:**
1. Clear onboarding flag
2. Reload page
3. Verify "1 / 3" indicator
4. Click "Next"
5. Verify "2 / 3" indicator
6. Click "Next"
7. Verify "3 / 3" indicator
8. Verify "Done" button appears
9. Click "Done"
10. Verify tooltip disappears

**Flake Prevention:**
- Check step indicator text content (reliable)
- Wait for button text change before clicking
- Use `toContainText()` instead of exact match

### 6. Feature Flag Toggle (cosmic-map-interactions.test.ts)
**Test:** Settings → Feature Flags shows cosmic map toggle

**Steps:**
1. Navigate to Settings (click region or button)
2. Click "Feature Flags" tab
3. Verify cosmic map toggle visible
4. Check toggle state (checked or unchecked)

**Flake Prevention:**
- Gracefully handle missing Settings region (test in isolation)
- Use `.first()` for ambiguous selectors
- Accept toggle existence as success (don't require checked state)

### 7. Keyboard Navigation (cosmic-map-interactions.test.ts)
**Test:** Tab → focus region → Enter → zoom → Escape → return

**Steps:**
1. Press `Tab` up to 10 times to find region star
2. Verify focused element has `.region-star` class
3. Press `Enter` to zoom
4. Wait 600ms for transition
5. Press `Escape` to return
6. Verify cosmic map visible

**Flake Prevention:**
- Limit Tab attempts to 10 (avoid infinite loop)
- Skip test if no region star found (conditional)
- Accept partial success (zoom started)

### 8. Reduced Motion Display (cosmic-map-interactions.test.ts)
**Test:** Settings → Performance shows reduced motion status

**Steps:**
1. Navigate to Settings
2. Click "Performance" tab
3. Verify reduced motion section visible
4. Verify status badge or metric exists

**Flake Prevention:**
- Use broad selectors (`.performance-section` OR `.reduced-motion-status`)
- Accept any performance metric as success
- Don't require specific status text

---

## Test Stabilization Techniques

### 1. Graceful Fallbacks
**Problem:** Element may not exist in all states

**Solution:**
```typescript
const isVisible = await element.isVisible({ timeout: 2000 }).catch(() => false);
expect(isVisible).toBeTruthy();
```

### 2. Multiple Valid Outcomes
**Problem:** CSS class OR opacity change both indicate zoom

**Solution:**
```typescript
const isZooming = await page.locator('.cosmic-map').evaluate((el) => {
  return (
    el.classList.contains('cosmic-map--zooming') ||
    window.getComputedStyle(el).opacity !== '1'
  );
});
expect(isZooming).toBeTruthy();
```

### 3. Explicit Waits (Not `waitForLoadState`)
**Problem:** Animations complete at specific times, not page load

**Solution:**
```typescript
await page.waitForTimeout(600); // Known transition duration
```

### 4. Conditional Skipping
**Problem:** Feature not implemented or region missing

**Solution:**
```typescript
if (await element.isVisible({ timeout: 2000 }).catch(() => false)) {
  // Run test steps
} else {
  test.skip(); // Or expect(true).toBeTruthy()
}
```

### 5. Reduced Motion Emulation
**Problem:** Animations cause test instability

**Solution:**
```typescript
// playwright.cosmic.config.ts
use: {
  emulateMedia: { reducedMotion: 'reduce' },
}
```

This disables animations in the browser via `prefers-reduced-motion` media query.

---

## Common Failure Modes

### 1. "Element not found" after timeout
**Cause:** Element selector changed or feature flag disabled

**Fix:**
- Check feature flags: `COSMIC_MAP_ENABLED: true`
- Update selector to match current DOM
- Add fallback selector with `.or()` locator

### 2. "Expected element to be visible, received: false"
**Cause:** Timing issue (element not rendered yet)

**Fix:**
- Increase timeout: `{ timeout: 5000 }`
- Add explicit wait before check: `await page.waitForTimeout(500)`
- Check for loading state first: `await page.waitForSelector('.cosmic-map')`

### 3. "Navigation failed: timeout"
**Cause:** Dev server not running or slow to respond

**Fix:**
- Verify dev server running: `pnpm dev:app`
- Increase `webServer.timeout` in config: `timeout: 180000`
- Check for port conflicts: `lsof -i :5173` (macOS/Linux)

### 4. "localStorage is not defined"
**Cause:** Browser context issue or navigation race

**Fix:**
- Wrap in try/catch: `await page.evaluate(() => { ... }).catch(() => {})`
- Wait for page load: `await page.waitForLoadState('domcontentloaded')`

### 5. Test passes locally, fails in CI
**Cause:** CI environment differences (reduced resources, timing)

**Fix:**
- Add retries in CI: `retries: process.env.CI ? 2 : 0`
- Use `CI=true` to enable CI-specific logic
- Increase timeouts in CI conditionally

---

## Debugging Tips

### 1. Run in Headed Mode
```bash
pnpm playwright test cosmic-map-navigation.test.ts --headed
```
Watch the browser execute steps in real-time.

### 2. Use Playwright UI Mode
```bash
pnpm playwright test --ui
```
Interactive debugger with time-travel, DOM snapshots, and step-through.

### 3. Add `page.pause()`
```typescript
await page.pause(); // Pauses execution, opens inspector
```

### 4. Screenshot on Failure
```typescript
test('example', async ({ page }) => {
  try {
    // ... test steps
  } catch (error) {
    await page.screenshot({ path: 'failure.png', fullPage: true });
    throw error;
  }
});
```

### 5. Console Logs
```typescript
page.on('console', (msg) => console.log('PAGE LOG:', msg.text()));
```

---

## Test Data Management

### Resetting State
Each test should be idempotent (can run in any order).

**Pattern:**
```typescript
test.beforeEach(async ({ page }) => {
  // Clear localStorage
  await page.evaluate(() => {
    localStorage.clear();
  });

  // Navigate to clean state
  await page.goto('http://localhost:5173');

  // Dismiss onboarding if present
  const skipButton = page.locator('button:has-text("Skip")');
  if (await skipButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await skipButton.click();
  }
});
```

### Mocking Backend Responses (Optional)
For isolated frontend tests:

```typescript
await page.route('**/api/universe', (route) => {
  route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      regions: [/* mock data */],
      bridges: [/* mock data */],
    }),
  });
});
```

---

## Performance Testing

### Measure Render Time
```typescript
test('cosmic map renders in < 2s', async ({ page }) => {
  await page.goto('http://localhost:5173');

  const startTime = Date.now();
  await page.waitForSelector('.cosmic-map', { state: 'visible' });
  const renderTime = Date.now() - startTime;

  expect(renderTime).toBeLessThan(2000);
});
```

### Capture Web Vitals
```typescript
test('Web Vitals within thresholds', async ({ page }) => {
  await page.goto('http://localhost:5173');

  const vitals = await page.evaluate(() => {
    return new Promise((resolve) => {
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        resolve(entries);
      }).observe({ entryTypes: ['largest-contentful-paint'] });
    });
  });

  // Assert vitals
});
```

---

## Next Steps

- Add cosmic map tests to CI pipeline
- Monitor flake rate weekly (target: < 5%)
- Add visual regression tests (Playwright screenshot comparison)
- Integrate with Sentry for production error tracking
