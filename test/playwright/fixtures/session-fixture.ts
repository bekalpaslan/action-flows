/**
 * Session Fixture for Playwright Tests
 *
 * This fixture automatically creates a session before a test runs
 * and cleans it up after the test completes.
 *
 * Usage:
 *   import { test, expect } from '../fixtures/session-fixture';
 *
 *   test('my test', async ({ page, sessionId }) => {
 *     // sessionId is already created and available
 *   });
 */

import { test as base, expect } from '@playwright/test';
import { SELECTORS, TIMEOUTS } from '../helpers/selectors';

type SessionFixture = {
  sessionId: string;
};

export const test = base.extend<SessionFixture>({
  sessionId: async ({ page }, use) => {
    // Setup: Navigate and create session
    await page.goto('/');
    await expect(page.locator(SELECTORS.workbenchLayout)).toBeVisible({
      timeout: TIMEOUTS.navigation,
    });

    await page.locator(SELECTORS.sidebarNewSessionBtn).click();

    const response = await page.waitForResponse(
      (res) =>
        res.url().includes('/api/sessions') &&
        res.request().method() === 'POST',
      { timeout: TIMEOUTS.network }
    );

    const body = await response.json();
    const id = body.id || body.sessionId || '';

    // Provide session ID to the test
    await use(id);

    // Teardown: Delete session (best effort, ignore failures)
    try {
      await page.request.delete(`http://localhost:3001/api/sessions/${id}`);
    } catch {
      // Ignore cleanup errors
    }
  },
});

export { expect } from '@playwright/test';
