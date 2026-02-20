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
 * Select a session from the chat panel by session ID
 * @param page Playwright page
 * @param sessionId The session ID to select
 * @deprecated SessionSidebar component has been removed. This function is deprecated.
 */
export async function selectSession(
  page: Page,
  sessionId: string
): Promise<void> {
  // This function is no longer used since SessionSidebar has been removed.
  // Sessions are now managed through the ChatPanel interface.
  console.warn('selectSession is deprecated - SessionSidebar has been removed');
  throw new Error('selectSession no longer available - use ChatPanel session management instead');
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

/**
 * Wait for a chat message to appear by index and verify role
 * @param page Playwright page
 * @param index Message index (1-indexed)
 * @param role Expected role ('user' | 'assistant')
 * @param timeout Optional timeout in ms
 */
export async function waitForMessage(
  page: Page,
  index: number,
  role: 'user' | 'assistant',
  timeout: number = TIMEOUTS.message
): Promise<void> {
  const selector = `[data-testid="message-msg-${index}"]`;
  await expect(page.locator(selector)).toBeVisible({ timeout });

  const roleClass = role === 'user' ? 'chat-bubble--user' : 'chat-bubble--assistant';
  await expect(page.locator(selector)).toHaveClass(new RegExp(roleClass));
}
