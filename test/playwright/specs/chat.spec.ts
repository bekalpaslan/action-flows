/**
 * Chat Panel Tests
 *
 * Tests for chat panel functionality:
 * - Chat input visibility
 * - Send button visibility
 * - Message display
 *
 * Tags: @chat
 *
 * Note: These tests use the session fixture to automatically
 * create a session before each test runs.
 */

import { test, expect } from '../fixtures/session-fixture';
import { SELECTORS, TIMEOUTS } from '../helpers/selectors';

test.describe('Chat Panel', { tag: '@chat' }, () => {
  test('chat input visible after session created @ui', async ({
    page,
    sessionId,
  }) => {
    // Session fixture already created a session
    // Click on the session to open chat
    await page.locator(SELECTORS.sessionSidebarItem).first().click();
    await expect(page.locator(SELECTORS.chatInput)).toBeVisible({
      timeout: TIMEOUTS.element,
    });
  });

  test('send button visible @ui', async ({ page, sessionId }) => {
    await page.locator(SELECTORS.sessionSidebarItem).first().click();
    await expect(page.locator(SELECTORS.chatSendBtn)).toBeVisible({
      timeout: TIMEOUTS.element,
    });
  });
});
