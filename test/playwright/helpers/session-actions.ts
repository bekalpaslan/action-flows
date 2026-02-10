/**
 * Reusable Session Actions for Playwright Tests
 *
 * Common operations on sessions and chat that can be reused across test files.
 */

import { Page, expect } from '@playwright/test';
import { SELECTORS, TIMEOUTS } from './selectors';

/**
 * Create a new session via UI
 * @returns The session ID from the API response
 */
export async function createSession(page: Page): Promise<string> {
  await page.locator(SELECTORS.sidebarNewSessionBtn).click();

  // Wait for the API call to complete
  const response = await page.waitForResponse(
    (res) =>
      res.url().includes('/api/sessions') &&
      res.request().method() === 'POST',
    { timeout: TIMEOUTS.network }
  );

  const body = await response.json();
  return body.id || body.sessionId || '';
}

/**
 * Send a chat message in the current session
 */
export async function sendChatMessage(
  page: Page,
  message: string
): Promise<void> {
  const input = page.locator(SELECTORS.chatInput);
  await input.fill(message);
  await page.locator(SELECTORS.chatSendBtn).click();
}

/**
 * Wait for the session sidebar to be visible
 */
export async function waitForSessionSidebar(page: Page): Promise<void> {
  await expect(page.locator(SELECTORS.sessionSidebar)).toBeVisible({
    timeout: TIMEOUTS.element,
  });
}
