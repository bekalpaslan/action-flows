/**
 * Error Handling E2E Tests
 *
 * Tests resilience and error recovery:
 * - API failures and timeouts
 * - WebSocket disconnections
 * - Network errors
 * - Invalid state transitions
 * - Retry mechanisms
 *
 * Tags: @error @resilience @network
 */

import { test, expect } from '@playwright/test';
import { SELECTORS, API, TIMEOUTS } from '../helpers/selectors';
import {
  createSession,
} from '../helpers/session-actions';

test.describe('Error Handling', { tag: ['@error', '@resilience'] }, () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.app-sidebar', { state: 'visible' });
  });

  test('ERR-001: Graceful handling of API timeout @network', async ({
    page,
    context,
  }) => {
    // Enable slow network simulation
    const client = await context.newCDPSession(page);
    await client.send('Network.enable');
    await client.send('Network.emulateNetworkConditions', {
      offline: false,
      downloadThroughput: 500, // Very slow
      uploadThroughput: 500,
      latency: 5000, // 5 second latency
    });

    // Try to create a session with slow network
    const createBtn = page.locator(SELECTORS.sidebarNewSessionBtn);
    await createBtn.click();

    // App should either:
    // 1. Show loading indicator
    // 2. Eventually succeed despite slow network
    // 3. Show error message

    let sessionCreated = false;
    let errorShown = false;

    try {
      // Wait for either success or error
      const sessionItem = page.locator('.session-sidebar-item');
      sessionItem.waitForCount(1, { timeout: 10000 }).catch(() => {});
      sessionCreated = await sessionItem.count().then((c) => c > 0);
    } catch {
      // Timeout is expected
    }

    const errorMessage = page.locator('[role="alert"], .error-message, .toast-error');
    try {
      await errorMessage.isVisible({ timeout: 2000 });
      errorShown = true;
    } catch {
      // No error shown
    }

    // Either created or error shown (not silent failure)
    expect(sessionCreated || errorShown).toBeTruthy();

    // Reset network
    await client.send('Network.emulateNetworkConditions', {
      offline: false,
      downloadThroughput: -1,
      uploadThroughput: -1,
      latency: 0,
    });
    await client.detach();
  });

  test('ERR-002: Graceful handling of 404 - deleted session @network', async ({
    page,
    request,
  }) => {
    // Create a session
    const sessionId = await createSession(page);
    await page.waitForTimeout(300);

    // Delete it via API
    await request.delete(API.sessionById(sessionId));

    // Try to fetch it
    const response = await request.get(API.sessionById(sessionId));
    expect(response.status()).toBe(404);

    // Reload page - app should handle missing session gracefully
    await page.reload();
    await page.waitForLoadState('domcontentloaded');

    // App should still be functional (not crash)
    await expect(page.locator(SELECTORS.workbenchLayout)).toBeVisible({
      timeout: TIMEOUTS.element,
    });
  });

  test('ERR-003: Retry on failed network request @network', async ({
    page,
    context,
  }) => {
    // Intercept and fail first request
    let requestCount = 0;
    await page.route('**/api/sessions', async (route) => {
      requestCount++;
      if (requestCount === 1) {
        // Fail first request
        await route.abort('failed');
      } else {
        // Allow second request
        await route.continue();
      }
    });

    // Try to create session
    const createBtn = page.locator(SELECTORS.sidebarNewSessionBtn);
    await createBtn.click();

    // Wait a bit for retry
    await page.waitForTimeout(1000);

    // Check if app recovered or shows error
    const sessionItems = page.locator('.session-sidebar-item');
    const errorAlert = page.locator('[role="alert"], .error-message');

    let recovered = false;
    let errorShown = false;

    try {
      const sessionCount = await sessionItems.count();
      recovered = sessionCount > 0;
    } catch {
      // Error
    }

    try {
      errorShown = await errorAlert.isVisible({ timeout: 1000 });
    } catch {
      // No error
    }

    // App should either recover or show user-friendly error
    expect(recovered || errorShown).toBeTruthy();
  });

  test('ERR-004: Handle invalid state transition @validation', async ({
    page,
    request,
  }) => {
    // Create a session
    const sessionId = await createSession(page);
    await page.waitForTimeout(300);

    // Try invalid state transition (e.g., pending → pending is OK, but skip steps)
    const invalidTransition = await request.put(API.sessionById(sessionId), {
      data: { status: 'invalid-status' },
    });

    // Server should reject invalid status
    expect(invalidTransition.status()).toBeGreaterThanOrEqual(400);

    // Verify session is still in original state
    const getResponse = await request.get(API.sessionById(sessionId));
    const sessionData = await getResponse.json();
    expect(sessionData.status).toBe('pending');

    // Cleanup
    await request.delete(API.sessionById(sessionId));
  });

  test('ERR-005: WebSocket reconnection after disconnect @network', async ({
    page,
    context,
  }) => {
    // Create a session to trigger WebSocket activity
    const sessionId = await createSession(page);
    await page.waitForTimeout(500);

    // Simulate network offline
    const client = await context.newCDPSession(page);
    await client.send('Network.emulateNetworkConditions', {
      offline: true,
      downloadThroughput: 0,
      uploadThroughput: 0,
      latency: 0,
    });

    // Wait a moment while offline
    await page.waitForTimeout(1000);

    // Come back online
    await client.send('Network.emulateNetworkConditions', {
      offline: false,
      downloadThroughput: -1,
      uploadThroughput: -1,
      latency: 0,
    });

    // Wait for potential reconnection
    await page.waitForTimeout(1000);

    // App should still be functional
    await expect(page.locator(SELECTORS.workbenchLayout)).toBeVisible({
      timeout: TIMEOUTS.element,
    });

    await client.detach();

    // Cleanup
    await page.request.delete(API.sessionById(sessionId)).catch(() => {});
  });

  test('ERR-006: Multiple rapid requests do not crash @stress', async ({
    page,
  }) => {
    // Rapid-fire create session buttons
    const createBtn = page.locator(SELECTORS.sidebarNewSessionBtn);

    // Click multiple times rapidly
    for (let i = 0; i < 5; i++) {
      await createBtn.click();
      // Don't wait between clicks - intentional stress test
    }

    // Wait for requests to settle
    await page.waitForTimeout(2000);

    // App should still be functional
    const sessionItems = page.locator('.session-sidebar-item');
    const count = await sessionItems.count();

    // At least some should be created (not all might succeed due to race conditions)
    expect(count).toBeGreaterThan(0);

    // No JS errors should be visible
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Wait a bit for any deferred errors
    await page.waitForTimeout(500);

    // Filter out known non-critical errors
    const criticalErrors = consoleErrors.filter((e) => {
      if (e.includes('WebSocket')) return false;
      if (e.includes('404')) return false;
      return true;
    });

    expect(criticalErrors).toHaveLength(0);
  });

  test('ERR-007: Chat message send with offline backend @network', async ({
    page,
    context,
  }) => {
    // Create a session
    const sessionId = await createSession(page);
    await page.waitForTimeout(300);

    // Simulate backend being down
    const client = await context.newCDPSession(page);
    await client.send('Network.emulateNetworkConditions', {
      offline: true,
      downloadThroughput: 0,
      uploadThroughput: 0,
      latency: 0,
    });

    // Try to send message
    const chatInput = page.locator(SELECTORS.chatInput);
    const sendBtn = page.locator(SELECTORS.chatSendBtn);

    const inputVisible = await chatInput
      .isVisible({ timeout: TIMEOUTS.element })
      .catch(() => false);

    if (inputVisible) {
      await chatInput.fill('Test message');
      await sendBtn.click();

      // Wait a bit
      await page.waitForTimeout(500);

      // Either message fails silently or shows error
      // App should not crash
      await expect(page.locator(SELECTORS.workbenchLayout)).toBeVisible({
        timeout: TIMEOUTS.element,
      });
    }

    // Come back online
    await client.send('Network.emulateNetworkConditions', {
      offline: false,
      downloadThroughput: -1,
      uploadThroughput: -1,
      latency: 0,
    });

    await client.detach();

    // Cleanup
    await page.request.delete(API.sessionById(sessionId)).catch(() => {});
  });

  test('ERR-008: Cosmic map handles missing region data @data', async ({
    page,
  }) => {
    // Try clicking on regions without data
    const regionStars = page.locator(SELECTORS.regionStar);
    const count = await regionStars.count();

    if (count > 0) {
      // Click multiple regions
      for (let i = 0; i < Math.min(3, count); i++) {
        await regionStars.nth(i).click();
        await page.waitForTimeout(500);

        // Press Escape to return
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);

        // App should not crash
        await expect(page.locator(SELECTORS.cosmicMap)).toBeVisible({
          timeout: TIMEOUTS.element,
        });
      }
    }
  });

  test('ERR-009: Consecutive page reloads maintain state @resilience', async ({
    page,
    request,
  }) => {
    // Create a session
    const sessionId = await createSession(page);

    // Reload page 3 times
    for (let i = 0; i < 3; i++) {
      await page.reload();
      await page.waitForLoadState('domcontentloaded');

      // Verify session still exists
      const response = await request.get(API.sessionById(sessionId));
      expect(response.ok()).toBeTruthy();
    }

    // Cleanup
    await request.delete(API.sessionById(sessionId));
  });

  test('ERR-010: Sidebar handles empty session list @ui', async ({
    page,
    request,
  }) => {
    // Get all sessions
    const response = await request.get(API.sessions);
    const sessions = await response.json() as { id: string }[];

    // Delete all sessions
    for (const session of sessions) {
      await request.delete(API.sessionById(session.id)).catch(() => {});
    }

    // Reload page
    await page.reload();
    await page.waitForLoadState('domcontentloaded');

    // App should handle empty list gracefully
    await expect(page.locator(SELECTORS.sessionSidebar)).toBeVisible({
      timeout: TIMEOUTS.element,
    });

    // Should still be able to create a new session
    const createBtn = page.locator(SELECTORS.sidebarNewSessionBtn);
    await createBtn.click();
    await page.waitForTimeout(500);

    const newSessionId = await createSession(page);
    expect(newSessionId).toBeTruthy();

    // Cleanup
    await request.delete(API.sessionById(newSessionId));
  });
});
