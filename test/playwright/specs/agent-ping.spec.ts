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
 */

import { test, expect } from '../fixtures/session-fixture';
import { SELECTORS, TIMEOUTS } from '../helpers/selectors';
import { waitForMessage } from '../helpers/session-actions';

test.describe('Agent Ping E2E', () => {
  // Set timeout for entire describe block
  test.setTimeout(TIMEOUTS.testTotal);

  test.beforeEach(async ({ page, sessionId }) => {
    // The SlidingChatWindow is always in the DOM but has width: 0% when closed.
    // We need to open it and select the session. Use the session select dropdown
    // which is always rendered — selecting a session in it also opens the chat.

    // Wait for the session dropdown to be in the DOM (even at 0 width)
    const sessionSelect = page.locator('select[aria-label="Select chat session"]');
    await expect(sessionSelect).toBeAttached({ timeout: TIMEOUTS.element });

    // Wait for the session option to appear in the dropdown (proves API session was fetched)
    await expect(sessionSelect.locator(`option[value="${sessionId}"]`)).toBeAttached({ timeout: TIMEOUTS.element });

    // Select the session — this triggers setSessionId AND openChat if not already open
    // (see SlidingChatWindow.tsx line 122: if (val && !isOpen) openChat('session-select'))
    await sessionSelect.selectOption({ value: sessionId }, { force: true });

    // Wait for ChatPanel to mount after session selection triggers React state update
    await expect(page.locator(SELECTORS.chatPanel)).toBeVisible({ timeout: 10000 });
  });

  test('happy path - send message and receive response @e2e @critical @chat', async ({ page }) => {
    // PHASE 1: Input Capture
    const input = page.locator(SELECTORS.chatInputTestId);
    await input.fill('ping');

    // Verify input value
    await expect(input).toHaveValue('ping');

    // PHASE 2: Send Button State
    const sendBtn = page.locator(SELECTORS.chatSendBtnTestId);
    await expect(sendBtn).toBeEnabled();

    // PHASE 3: Message Submission
    await sendBtn.click();

    // Verify input cleared
    await expect(input).toHaveValue('');

    // PHASE 4: User Message Appears
    const userMsg = page.locator(SELECTORS.chatMessageByIndex(1));
    await expect(userMsg).toBeVisible({ timeout: TIMEOUTS.userMessage });

    // Verify user message content
    const userContent = userMsg.locator(SELECTORS.chatBubbleContent);
    await expect(userContent).toContainText('ping');

    // Verify user role styling
    await expect(userMsg).toHaveClass(/chat-bubble--user/);

    // PHASE 5: Assistant Response Appears
    const assistantMsg = page.locator(SELECTORS.chatMessageByIndex(2));
    await expect(assistantMsg).toBeVisible({ timeout: TIMEOUTS.assistantResponse });

    // Verify assistant message has content
    const assistantContent = assistantMsg.locator(SELECTORS.chatBubbleContent);
    const content = await assistantContent.textContent();
    expect(content).toBeTruthy();
    expect(content!.length).toBeGreaterThan(0);

    // Verify assistant role styling
    await expect(assistantMsg).toHaveClass(/chat-bubble--assistant/);

    // PHASE 6: Metadata Verification
    const timestamp = assistantMsg.locator(SELECTORS.chatBubbleTimestamp);
    await expect(timestamp).toBeVisible();
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

  test('input field clears after send @e2e @chat', async ({ page }) => {
    const input = page.locator(SELECTORS.chatInputTestId);
    const sendBtn = page.locator(SELECTORS.chatSendBtnTestId);

    // Type message
    await input.fill('test message');
    await expect(input).toHaveValue('test message');

    // Click send
    await sendBtn.click();

    // Verify input value is empty
    await expect(input).toHaveValue('');

    // Verify input field is re-enabled (not disabled)
    await expect(input).toBeEnabled();
  });

  test('message order and roles @e2e @chat', async ({ page }) => {
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

  test('message metadata rendering @e2e @chat', async ({ page }) => {
    const input = page.locator(SELECTORS.chatInputTestId);
    const sendBtn = page.locator(SELECTORS.chatSendBtnTestId);

    // Send message
    await input.fill('ping');
    await sendBtn.click();

    // Wait for assistant response
    const assistantMsg = page.locator(SELECTORS.chatMessageByIndex(2));
    await expect(assistantMsg).toBeVisible({ timeout: TIMEOUTS.assistantResponse });

    // Verify timestamp element exists and is visible
    const timestamp = assistantMsg.locator(SELECTORS.chatBubbleTimestamp);
    await expect(timestamp).toBeVisible();

    // Verify timestamp has content (should be a date/time string)
    const timestampText = await timestamp.textContent();
    expect(timestampText).toBeTruthy();
    expect(timestampText!.length).toBeGreaterThan(0);
  });

  test('auto-scroll behavior @e2e @chat', async ({ page }) => {
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
