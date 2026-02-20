/**
 * Agent Ping E2E Test Suite
 *
 * Tests the complete message lifecycle from user input to agent response:
 * 1. User types message in chat panel
 * 2. Message sent via WebSocket to backend
 * 3. Backend pipes to Claude CLI
 * 4. CLI processes and responds
 * 5. Response rendered in UI
 *
 * This is a critical path test that validates end-to-end integration.
 *
 * Tests tagged @requires-cli need a real Claude CLI process responding.
 * Tests without that tag validate UI behavior only.
 */

import { test, expect } from '../fixtures/session-fixture';
import { SELECTORS, TIMEOUTS } from '../helpers/selectors';
import { waitForMessage } from '../helpers/session-actions';

test.describe('Agent Ping E2E', () => {
  // Set timeout for entire describe block
  test.setTimeout(TIMEOUTS.testTotal);

  test.beforeEach(async ({ page, sessionId }) => {
    // Open the SlidingChatWindow and select the test session using the exposed
    // __chatWindowContext (available in dev mode via ChatWindowContext.tsx)
    await page.evaluate(async (sid) => {
      const ctx = (window as any).__chatWindowContext;
      if (!ctx) throw new Error('__chatWindowContext not found — is the app running in dev mode?');
      // Open chat and set session
      await ctx.openChat('e2e-test');
      ctx.setSessionId(sid);
    }, sessionId);

    // Wait for ChatPanel to mount after session selection triggers React state update
    await expect(page.locator(SELECTORS.chatPanel)).toBeVisible({ timeout: 10000 });

    // Hide the floating health widget that overlaps the send button area
    await page.evaluate(() => {
      const widget = document.querySelector('.health-widget') as HTMLElement;
      if (widget) widget.style.display = 'none';
    });
  });

  test('send button state management @e2e @chat', async ({ page }) => {
    const input = page.locator(SELECTORS.chatInputTestId);
    const sendBtn = page.locator(SELECTORS.chatSendBtnTestId);

    // Verify send button is disabled when input is empty
    await expect(input).toHaveValue('');
    await expect(sendBtn).toBeDisabled();

    // Type text → verify button is enabled
    await input.fill('test message');
    await expect(sendBtn).toBeEnabled();

    // Clear text → verify button is disabled again
    await input.clear();
    await expect(sendBtn).toBeDisabled();
  });

  test('input field clears after send @e2e @chat @requires-cli', async ({ page }) => {
    const input = page.locator(SELECTORS.chatInputTestId);
    const sendBtn = page.locator(SELECTORS.chatSendBtnTestId);

    // Type message
    await input.fill('test message');
    await expect(input).toHaveValue('test message');

    // Click send (force: true to bypass health widget overlap)
    await sendBtn.click();

    // Verify input value is empty
    await expect(input).toHaveValue('');

    // Verify input field is re-enabled (not disabled)
    await expect(input).toBeEnabled();
  });

  test('user message appears after send @e2e @chat', async ({ page }) => {
    const input = page.locator(SELECTORS.chatInputTestId);
    const sendBtn = page.locator(SELECTORS.chatSendBtnTestId);

    // Send message "ping"
    await input.fill('ping');
    await sendBtn.click();

    // Wait for any message to appear in the message list
    // (could be user message or error message depending on CLI availability)
    const firstMsg = page.locator('[data-testid^="message-msg-"]').first();
    await expect(firstMsg).toBeVisible({ timeout: TIMEOUTS.userMessage });

    // Verify the message has user role styling
    await expect(firstMsg).toHaveClass(/chat-bubble--user/);
  });

  test('user message has timestamp @e2e @chat', async ({ page }) => {
    const input = page.locator(SELECTORS.chatInputTestId);
    const sendBtn = page.locator(SELECTORS.chatSendBtnTestId);

    // Send message
    await input.fill('ping');
    await sendBtn.click();

    // Wait for user message
    const userMsg = page.locator(SELECTORS.chatMessageByIndex(1));
    await expect(userMsg).toBeVisible({ timeout: TIMEOUTS.userMessage });

    // Verify timestamp element exists and has content
    const timestamp = userMsg.locator(SELECTORS.chatBubbleTimestamp);
    await expect(timestamp).toBeVisible();
    const timestampText = await timestamp.textContent();
    expect(timestampText).toBeTruthy();
    expect(timestampText!.length).toBeGreaterThan(0);
  });

  // --- Tests below require a live Claude CLI responding to messages ---

  test('happy path - send message and receive response @e2e @critical @chat @requires-cli', async ({ page }) => {
    const input = page.locator(SELECTORS.chatInputTestId);
    const sendBtn = page.locator(SELECTORS.chatSendBtnTestId);

    // Send message
    await input.fill('ping');
    await sendBtn.click();

    // Wait for user message
    const userMsg = page.locator(SELECTORS.chatMessageByIndex(1));
    await expect(userMsg).toBeVisible({ timeout: TIMEOUTS.userMessage });
    await expect(userMsg).toHaveClass(/chat-bubble--user/);

    // Wait for assistant response
    const assistantMsg = page.locator(SELECTORS.chatMessageByIndex(2));
    await expect(assistantMsg).toBeVisible({ timeout: TIMEOUTS.assistantResponse });

    // Verify assistant message has content
    const assistantContent = assistantMsg.locator(SELECTORS.chatBubbleContent);
    const content = await assistantContent.textContent();
    expect(content).toBeTruthy();
    expect(content!.length).toBeGreaterThan(0);

    // Verify assistant role styling
    await expect(assistantMsg).toHaveClass(/chat-bubble--assistant/);

    // Verify timestamp
    const timestamp = assistantMsg.locator(SELECTORS.chatBubbleTimestamp);
    await expect(timestamp).toBeVisible();
  });

  test('message order and roles @e2e @chat @requires-cli', async ({ page }) => {
    const input = page.locator(SELECTORS.chatInputTestId);
    const sendBtn = page.locator(SELECTORS.chatSendBtnTestId);

    // Send message "ping"
    await input.fill('ping');
    await sendBtn.click();

    // Wait for user message (index 1)
    await waitForMessage(page, 1, 'user', TIMEOUTS.userMessage);

    // Wait for assistant message (index 2)
    await waitForMessage(page, 2, 'assistant', TIMEOUTS.assistantResponse);

    // Assert message count = 2
    const allMessages = await page.locator('[data-testid^="message-msg-"]').count();
    expect(allMessages).toBe(2);

    // Verify first message has user role
    const firstMsg = page.locator(SELECTORS.chatMessageByIndex(1));
    await expect(firstMsg).toHaveClass(/chat-bubble--user/);

    // Verify second message has assistant role
    const secondMsg = page.locator(SELECTORS.chatMessageByIndex(2));
    await expect(secondMsg).toHaveClass(/chat-bubble--assistant/);
  });

  test('auto-scroll behavior @e2e @chat @requires-cli', async ({ page }) => {
    const input = page.locator(SELECTORS.chatInputTestId);
    const sendBtn = page.locator(SELECTORS.chatSendBtnTestId);

    // Send message
    await input.fill('ping');
    await sendBtn.click();

    // Wait for assistant response
    const assistantMsg = page.locator(SELECTORS.chatMessageByIndex(2));
    await expect(assistantMsg).toBeVisible({ timeout: TIMEOUTS.assistantResponse });

    // Check if last message is in viewport (scroll position)
    const isInViewport = await assistantMsg.evaluate((el) => {
      const rect = el.getBoundingClientRect();
      return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
      );
    });

    expect(isInViewport).toBe(true);
  });
});
