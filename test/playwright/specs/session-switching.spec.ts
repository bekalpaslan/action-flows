/**
 * Session Switching Tests
 *
 * Tests for switching between multiple sessions and verifying
 * that the Work Dashboard content updates to reflect the selected session.
 *
 * Key regression guard: When switching sessions, the displayed session ID
 * in the dashboard info bar must change to match the selected session.
 *
 * Tags: @session @dashboard
 */

import { test, expect } from '@playwright/test';
import { SELECTORS, TIMEOUTS } from '../helpers/selectors';
import {
  createSession,
  waitForSessionSidebar,
  selectSession,
  getCurrentSessionId,
} from '../helpers/session-actions';

test.describe('Session Switching', { tag: ['@session', '@dashboard'] }, () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForSessionSidebar(page);
  });

  test('switching between sessions updates dashboard content @crud', async ({
    page,
  }) => {
    // Step 1: Create first session
    const firstSessionId = await createSession(page);
    expect(firstSessionId).toBeTruthy();

    // Step 2: Verify first session appears in sidebar
    await expect(
      page.locator(`${SELECTORS.sessionSidebarItem}:has([title="${firstSessionId}"])`)
    ).toBeVisible({ timeout: TIMEOUTS.element });

    // Step 3: Verify dashboard shows first session
    const displayedSession1 = await getCurrentSessionId(page);
    expect(displayedSession1).toContain('session-');
    expect(displayedSession1.length).toBeGreaterThan(10);

    // Step 4: Create second session
    const secondSessionId = await createSession(page);
    expect(secondSessionId).toBeTruthy();
    expect(secondSessionId).not.toBe(firstSessionId);

    // Step 5: Verify second session appears in sidebar
    await expect(
      page.locator(`${SELECTORS.sessionSidebarItem}:has([title="${secondSessionId}"])`)
    ).toBeVisible({ timeout: TIMEOUTS.element });

    // Step 6: Dashboard should now show second session (newly created)
    const displayedSession2 = await getCurrentSessionId(page);
    expect(displayedSession2).not.toBe(displayedSession1);

    // Step 7: Click first session in sidebar
    await selectSession(page, firstSessionId);

    // Step 8: Assert dashboard header/status reflects first session's data
    const afterSwitch1 = await getCurrentSessionId(page);
    expect(afterSwitch1).toBe(displayedSession1);

    // Step 9: Click second session in sidebar
    await selectSession(page, secondSessionId);

    // Step 10: Assert dashboard header/status reflects second session's data
    const afterSwitch2 = await getCurrentSessionId(page);
    expect(afterSwitch2).toBe(displayedSession2);

    // Final verification: Session IDs are distinct
    expect(afterSwitch1).not.toBe(afterSwitch2);
  });

  test('session sidebar shows all created sessions @ui', async ({ page }) => {
    // Create 3 sessions
    const sessionIds: string[] = [];
    for (let i = 0; i < 3; i++) {
      const sessionId = await createSession(page);
      sessionIds.push(sessionId);
    }

    // Verify all 3 appear in sidebar
    for (const sessionId of sessionIds) {
      await expect(
        page.locator(`${SELECTORS.sessionSidebarItem}:has([title="${sessionId}"])`)
      ).toBeVisible({ timeout: TIMEOUTS.element });
    }

    // Verify we have at least 3 session items
    const sessionItems = page.locator(SELECTORS.sessionSidebarItem);
    const count = await sessionItems.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test('dashboard displays Work Dashboard heading @ui', async ({ page }) => {
    // Verify the Work Dashboard heading is visible
    await expect(page.locator(SELECTORS.dashboardHeading)).toBeVisible({
      timeout: TIMEOUTS.element,
    });
  });
});
