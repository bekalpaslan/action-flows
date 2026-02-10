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

/**
 * Select a session from the sidebar by session ID
 * @param page Playwright page
 * @param sessionId The session ID to select (will match button text containing this ID)
 */
export async function selectSession(
  page: Page,
  sessionId: string
): Promise<void> {
  // Session name div has title=full session ID
  const sessionButton = page.locator(`${SELECTORS.sessionSidebarItem}:has([title="${sessionId}"])`);

  await sessionButton.click();
  await page.waitForTimeout(300); // Allow UI to update
}

/**
 * Get the currently displayed session ID snippet from the info bar
 * @returns The truncated session ID text (e.g. "session-...nzbl") displayed in the dashboard
 */
export async function getCurrentSessionId(page: Page): Promise<string> {
  const sessionIdText = page.locator('.chat-panel__info-session-id-text');
  const text = await sessionIdText.textContent({ timeout: TIMEOUTS.element });
  return text?.trim() || '';
}
