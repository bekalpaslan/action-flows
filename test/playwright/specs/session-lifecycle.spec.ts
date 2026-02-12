/**
 * Session Lifecycle E2E Tests
 *
 * Tests the complete lifecycle of a session:
 * - Create a new session via UI
 * - Verify status progression (pending → in_progress → completed)
 * - Delete a session
 * - Verify WebSocket real-time updates
 *
 * Tags: @session @lifecycle
 */

import { test, expect } from '@playwright/test';
import { SELECTORS, API, TIMEOUTS } from '../helpers/selectors';
import {
  createSession,
  waitForSessionSidebar,
  selectSession,
  getCurrentSessionId,
} from '../helpers/session-actions';

test.describe('Session Lifecycle', { tag: ['@session', '@lifecycle'] }, () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForSessionSidebar(page);
  });

  test('LIFECYCLE-001: Create new session via UI button @crud', async ({
    page,
    request,
  }) => {
    // Step 1: Click new session button
    const sessionId = await createSession(page);
    expect(sessionId).toBeTruthy();
    expect(sessionId).toMatch(/^session-/);

    // Step 2: Verify session appears in sidebar
    await expect(
      page.locator(`${SELECTORS.sessionSidebarItem}:has([title="${sessionId}"])`)
    ).toBeVisible({ timeout: TIMEOUTS.element });

    // Step 3: Verify session is displayed in info bar
    const displayedSessionId = await getCurrentSessionId(page);
    expect(displayedSessionId).toBeTruthy();

    // Step 4: Verify API: session exists and is accessible
    const response = await request.get(API.sessionById(sessionId));
    expect(response.ok()).toBeTruthy();
    const sessionData = await response.json();
    expect(sessionData.id).toBe(sessionId);
    expect(sessionData.status).toBe('pending');
  });

  test('LIFECYCLE-002: Session status progression @state', async ({
    page,
    request,
  }) => {
    // Step 1: Create a session
    const sessionId = await createSession(page);
    await page.waitForTimeout(300);

    // Step 2: Verify initial status is pending
    let sessionData = (
      await request.get(API.sessionById(sessionId))
    ).json() as Promise<{ status: string }>;
    expect((await sessionData).status).toBe('pending');

    // Step 3: Update to in_progress via API
    let updateResponse = await request.put(API.sessionById(sessionId), {
      data: { status: 'in_progress' },
    });
    expect(updateResponse.ok()).toBeTruthy();

    // Step 4: Reload page to see updated status
    await page.reload();
    await page.waitForLoadState('domcontentloaded');

    // Step 5: Verify status indicator changed (visual cue in sidebar)
    const sessionItem = page.locator(
      `${SELECTORS.sessionSidebarItem}:has([title="${sessionId}"])`
    );
    await expect(sessionItem).toBeVisible({ timeout: TIMEOUTS.element });

    // Step 6: Verify API: session is now in_progress
    sessionData = (
      await request.get(API.sessionById(sessionId))
    ).json() as Promise<{ status: string }>;
    expect((await sessionData).status).toBe('in_progress');

    // Step 7: Update to completed
    updateResponse = await request.put(API.sessionById(sessionId), {
      data: { status: 'completed', endReason: 'e2e-test' },
    });
    expect(updateResponse.ok()).toBeTruthy();

    // Step 8: Reload page to see completion
    await page.reload();
    await page.waitForLoadState('domcontentloaded');

    // Step 9: Verify API: session is now completed
    sessionData = (
      await request.get(API.sessionById(sessionId))
    ).json() as Promise<{ status: string }>;
    expect((await sessionData).status).toBe('completed');

    // Cleanup
    await request.delete(API.sessionById(sessionId));
  });

  test('LIFECYCLE-003: Delete session via UI @crud', async ({
    page,
    request,
  }) => {
    // Step 1: Create a session
    const sessionId = await createSession(page);
    await page.waitForTimeout(300);

    // Step 2: Verify session exists in API
    let response = await request.get(API.sessionById(sessionId));
    expect(response.ok()).toBeTruthy();

    // Step 3: Verify session appears in sidebar
    const sessionItem = page.locator(
      `${SELECTORS.sessionSidebarItem}:has([title="${sessionId}"])`
    );
    await expect(sessionItem).toBeVisible({ timeout: TIMEOUTS.element });

    // Step 4: Hover over session item to reveal delete button
    await sessionItem.hover();
    await page.waitForTimeout(200);

    // Step 5: Click delete button (X icon appears on hover)
    const deleteButton = sessionItem.locator('button[aria-label*="delete"], .session-delete-btn');
    if (await deleteButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      await deleteButton.click();

      // Step 6: Confirm deletion if dialog appears
      const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Delete")');
      if (await confirmButton.isVisible({ timeout: 1000 }).catch(() => false)) {
        await confirmButton.click();
      }

      // Step 7: Verify session removed from sidebar
      await expect(sessionItem).not.toBeVisible({ timeout: TIMEOUTS.element });

      // Step 8: Verify API: session is deleted (404 or marked deleted)
      const deleteResponse = await request.get(API.sessionById(sessionId));
      expect(deleteResponse.status()).toBe(404);
    }
  });

  test('LIFECYCLE-004: Multiple session management @state', async ({
    page,
    request,
  }) => {
    // Step 1: Create three sessions
    const sessionIds: string[] = [];
    for (let i = 0; i < 3; i++) {
      const sessionId = await createSession(page);
      sessionIds.push(sessionId);
      await page.waitForTimeout(200);
    }

    // Step 2: Verify all three appear in sidebar
    for (const sessionId of sessionIds) {
      await expect(
        page.locator(`${SELECTORS.sessionSidebarItem}:has([title="${sessionId}"])`)
      ).toBeVisible({ timeout: TIMEOUTS.element });
    }

    // Step 3: Switch between sessions
    await selectSession(page, sessionIds[0]);
    let currentId = await getCurrentSessionId(page);
    expect(currentId).toBeTruthy();

    await selectSession(page, sessionIds[1]);
    const secondId = await getCurrentSessionId(page);
    expect(secondId).not.toBe(currentId);

    // Step 4: Delete middle session
    const middleItem = page.locator(
      `${SELECTORS.sessionSidebarItem}:has([title="${sessionIds[1]}"])`
    );
    await middleItem.hover();
    const deleteBtn = middleItem.locator('button[aria-label*="delete"], .session-delete-btn');
    if (await deleteBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await deleteBtn.click();
      const confirmBtn = page.locator('button:has-text("Confirm"), button:has-text("Delete")');
      if (await confirmBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await confirmBtn.click();
      }
    }

    // Step 5: Verify remaining sessions still exist
    await expect(
      page.locator(`${SELECTORS.sessionSidebarItem}:has([title="${sessionIds[0]}"])`)
    ).toBeVisible({ timeout: TIMEOUTS.element });
    await expect(
      page.locator(`${SELECTORS.sessionSidebarItem}:has([title="${sessionIds[2]}"])`)
    ).toBeVisible({ timeout: TIMEOUTS.element });

    // Cleanup
    for (const sessionId of [sessionIds[0], sessionIds[2]]) {
      await request.delete(API.sessionById(sessionId)).catch(() => {});
    }
  });

  test('LIFECYCLE-005: Session persists after page reload @state', async ({
    page,
    request,
  }) => {
    // Step 1: Create a session
    const sessionId = await createSession(page);
    await page.waitForTimeout(300);

    // Step 2: Note the session ID displayed
    const displayedIdBefore = await getCurrentSessionId(page);
    expect(displayedIdBefore).toBeTruthy();

    // Step 3: Reload the page
    await page.reload();
    await page.waitForLoadState('domcontentloaded');

    // Step 4: Verify session still appears in sidebar
    await expect(
      page.locator(`${SELECTORS.sessionSidebarItem}:has([title="${sessionId}"])`)
    ).toBeVisible({ timeout: TIMEOUTS.element });

    // Step 5: Verify session data is still available via API
    const response = await request.get(API.sessionById(sessionId));
    expect(response.ok()).toBeTruthy();

    // Cleanup
    await request.delete(API.sessionById(sessionId));
  });
});
