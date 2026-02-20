/**
 * Session Fixture for Playwright Tests
 *
 * This fixture automatically creates a session via API before a test runs,
 * navigates to the app, and cleans up after the test completes.
 *
 * Usage:
 *   import { test, expect } from '../fixtures/session-fixture';
 *
 *   test('my test', async ({ page, sessionId }) => {
 *     // sessionId is already created and available
 *     // page is navigated to the app
 *   });
 */

import { test as base, expect } from '@playwright/test';
import { SELECTORS, TIMEOUTS, API } from '../helpers/selectors';

type SessionFixture = {
  sessionId: string;
};

export const test = base.extend<SessionFixture>({
  sessionId: async ({ page }, use) => {
    // Navigate to app first so SessionContext is mounted
    await page.goto('/');
    await expect(page.locator(SELECTORS.workbenchLayout)).toBeVisible({
      timeout: TIMEOUTS.navigation,
    });

    // Create session via API — SessionContext will pick it up on next fetch/WS event
    const response = await page.request.post(API.sessions, {
      data: {
        cwd: process.cwd(),
        name: 'E2E Test Session',
      },
    });

    if (!response.ok()) {
      throw new Error(`Session creation failed: ${response.status()} ${await response.text()}`);
    }

    const body = await response.json();
    const id = body.id || body.sessionId || '';

    if (!id) {
      throw new Error(`Session creation returned no ID: ${JSON.stringify(body)}`);
    }

    // Reload page so SessionContext fetches the new session list
    await page.reload();
    await expect(page.locator(SELECTORS.workbenchLayout)).toBeVisible({
      timeout: TIMEOUTS.navigation,
    });

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
