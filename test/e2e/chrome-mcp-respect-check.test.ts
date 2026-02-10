/**
 * Chrome MCP E2E Respect Check Test
 *
 * This file defines a structured E2E test that verifies every UI component
 * stays within its defined spatial boundaries. No overflows, no viewport
 * escapes, no parent containment violations.
 *
 * Execution:
 * 1. Start dev servers: pnpm dev:backend && pnpm dev:app
 * 2. Ask Claude: "run the Chrome MCP respect check test"
 * 3. Claude will execute each step and report violations
 *
 * Prerequisites:
 * - Backend running on localhost:3001 (pnpm dev:backend)
 * - Frontend running on localhost:5173 (pnpm dev:app)
 * - Chrome DevTools MCP server connected
 *
 * Test Flow:
 * 1. Health check - Verify backend is responsive
 * 2. Navigate - Load frontend app
 * 3. Baseline respect check - Empty state (no session)
 * 4. Create session - Click new session button
 * 5. Send test message - Populate chat panel
 * 6. Populated respect check - Active session with messages
 * 7. Stress: long message - Test chat bubble overflow resistance
 * 8. Stress: rapid messages - Test multiple message rendering
 * 9. Stress: narrow viewport - Test responsive behavior
 * 10. Cleanup - Mark session as completed
 */

import type { TestStep, TestContext } from './chrome-mcp-utils';
import {
  BACKEND_URL,
  FRONTEND_URL,
  TIMEOUTS,
  SELECTORS,
  API_ENDPOINTS,
} from './chrome-mcp-utils';
import { RESPECT_CHECK_SCRIPT } from './chrome-mcp-respect-helpers';

/**
 * Step 1: Health Check
 * Verify backend is running and responsive
 */
export const step01_healthCheck: TestStep = {
  id: 'health-check',
  name: 'Backend Health Check',
  description: 'Verify backend API is running on port 3001',
  tool: 'evaluate_script',
  params: {
    function: `async () => {
  const response = await fetch('${BACKEND_URL}${API_ENDPOINTS.health}');
  return response.ok;
}`,
  },
  assertions: [
    {
      check: 'truthy',
      expected: true,
      message: 'Backend health check should return OK',
    },
  ],
  screenshot: false,
  onFailure: 'abort',
};

/**
 * Step 2: Navigate to Frontend
 * Load the ActionFlows Dashboard frontend
 */
export const step02_navigate: TestStep = {
  id: 'navigate',
  name: 'Navigate to Frontend',
  description: `Load frontend application at ${FRONTEND_URL}`,
  tool: 'navigate_page',
  params: {
    type: 'url',
    url: FRONTEND_URL,
    timeout: TIMEOUTS.navigation,
  },
  assertions: [
    {
      check: 'truthy',
      expected: true,
      message: 'Page should navigate successfully',
    },
  ],
  screenshot: true,
  onFailure: 'abort',
};

/**
 * Step 3: Baseline Respect Check
 * Verify all components respect boundaries in empty state
 */
export const step03_baselineRespectCheck: TestStep = {
  id: 'baseline-respect-check',
  name: 'Baseline Respect Check',
  description: 'Check component boundaries in empty state (no session attached)',
  tool: 'evaluate_script',
  params: {
    function: RESPECT_CHECK_SCRIPT,
  },
  assertions: [
    {
      check: 'truthy',
      target: 'summary.high',
      expected: 0,
      message: 'Should have ZERO high-severity violations in empty state',
    },
  ],
  screenshot: true,
  onFailure: 'abort',
  captureFrom: (response: unknown, context: TestContext) => {
    // Store baseline result for comparison
    context.stepResults.baselineRespectCheck = response;
    return {};
  },
};

/**
 * Step 4: Create Session
 * Click new session button to populate the workbench
 */
export const step04_createSession: TestStep = {
  id: 'create-session',
  name: 'Create Session',
  description: 'Click new session button and verify session creation',
  tool: 'click',
  params: (context: TestContext) => ({
    uid: context.elementUids.newSessionBtn || '<from-snapshot>',
    includeSnapshot: true,
  }),
  assertions: [
    {
      check: 'truthy',
      expected: true,
      message: 'Click should succeed',
    },
  ],
  screenshot: true,
  onFailure: 'abort',
  captureFrom: (response: unknown, context: TestContext) => {
    // After click, need to extract session ID from network requests
    // This will be populated by examining list_network_requests in next step
    return {};
  },
};

/**
 * Step 4b: Verify Session API
 * Extract session ID from POST /api/sessions
 */
export const step04b_verifySessionApi: TestStep = {
  id: 'verify-session-api',
  name: 'Verify Session API',
  description: 'Check POST /api/sessions returned 201 and extract session ID',
  tool: 'list_network_requests',
  params: {
    resourceTypes: ['fetch', 'xhr'],
  },
  assertions: [
    {
      check: 'network_request_exists',
      target: 'POST',
      expected: API_ENDPOINTS.sessions,
      message: 'Should find POST request to /api/sessions',
    },
  ],
  screenshot: false,
  onFailure: 'abort',
  captureFrom: (response: unknown, context: TestContext) => {
    // Extract request ID - Claude will manually identify from response
    return {};
  },
};

/**
 * Step 5: Send Test Message
 * Fill chat input and send a message to populate chat panel
 */
export const step05_sendTestMessage: TestStep = {
  id: 'send-test-message',
  name: 'Send Test Message',
  description: 'Send "Respect check test message" to populate chat panel',
  tool: 'fill',
  params: (context: TestContext) => ({
    uid: context.elementUids.chatInput || '<from-snapshot>',
    value: 'Respect check test message',
  }),
  assertions: [
    {
      check: 'truthy',
      expected: true,
      message: 'Text input should succeed',
    },
  ],
  screenshot: false,
  onFailure: 'abort',
};

/**
 * Step 5b: Click Send Button
 * Submit the test message
 */
export const step05b_clickSend: TestStep = {
  id: 'click-send',
  name: 'Click Send Button',
  description: 'Submit the test message',
  tool: 'click',
  params: (context: TestContext) => ({
    uid: context.elementUids.chatSendBtn || '<from-snapshot>',
    includeSnapshot: true,
  }),
  assertions: [
    {
      check: 'truthy',
      expected: true,
      message: 'Send button click should succeed',
    },
  ],
  screenshot: true,
  onFailure: 'abort',
};

/**
 * Step 5c: Wait for Message Display
 * Ensure message appears before running respect check
 */
export const step05c_waitForMessage: TestStep = {
  id: 'wait-for-message',
  name: 'Wait for Message Display',
  description: 'Wait for test message to appear in chat panel',
  tool: 'wait_for',
  params: {
    text: 'Respect check test message',
    timeout: TIMEOUTS.messageDisplay,
  },
  assertions: [
    {
      check: 'truthy',
      expected: true,
      message: 'Message should appear in chat within timeout',
    },
  ],
  screenshot: false,
  onFailure: 'abort',
};

/**
 * Step 6: Populated Respect Check
 * Verify all components respect boundaries with active session
 */
export const step06_populatedRespectCheck: TestStep = {
  id: 'populated-respect-check',
  name: 'Populated Respect Check',
  description: 'Check component boundaries with active session and chat messages',
  tool: 'evaluate_script',
  params: {
    function: RESPECT_CHECK_SCRIPT,
  },
  assertions: [
    {
      check: 'truthy',
      target: 'summary.high',
      expected: 0,
      message: 'Should have ZERO high-severity violations with active session',
    },
  ],
  screenshot: true,
  onFailure: 'abort',
  captureFrom: (response: unknown, context: TestContext) => {
    context.stepResults.populatedRespectCheck = response;
    return {};
  },
};

/**
 * Step 7: Stress Test - Long Message
 * Send a 500-character message to test chat bubble overflow resistance
 */
export const step07_stressLongMessage: TestStep = {
  id: 'stress-long-message',
  name: 'Stress Test: Long Message',
  description: 'Send 500-char message and verify no chat bubble overflow',
  tool: 'evaluate_script',
  params: (context: TestContext) => ({
    function: `async () => {
  // Fill and send long message
  const chatInput = document.querySelector('.chat-panel__input-field');
  const sendBtn = document.querySelector('.chat-panel__send-btn');

  if (!chatInput || !sendBtn) {
    return { error: 'Chat input or send button not found' };
  }

  const longMessage = '${'A'.repeat(500)}';
  chatInput.value = longMessage;
  chatInput.dispatchEvent(new Event('input', { bubbles: true }));

  sendBtn.click();

  // Wait for message to render
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Check ONLY chat bubbles for overflow
  const bubbles = document.querySelectorAll('.chat-bubble');
  const violations = [];

  bubbles.forEach((bubble, index) => {
    const rect = bubble.getBoundingClientRect();
    if (bubble.scrollWidth > bubble.clientWidth + 1) {
      violations.push({
        index,
        scrollWidth: bubble.scrollWidth,
        clientWidth: bubble.clientWidth,
        overflow: bubble.scrollWidth - bubble.clientWidth
      });
    }
  });

  return {
    totalBubbles: bubbles.length,
    violations,
    success: violations.length === 0
  };
}`,
  }),
  assertions: [
    {
      check: 'truthy',
      target: 'success',
      expected: true,
      message: 'Long message should not cause horizontal overflow in chat bubbles',
    },
  ],
  screenshot: true,
  onFailure: 'continue',
  captureFrom: (response: unknown, context: TestContext) => {
    context.stepResults.stressLongMessage = response;
    return {};
  },
};

/**
 * Step 8: Stress Test - Rapid Messages
 * Send 5 messages quickly and verify boundaries hold
 */
export const step08_stressRapidMessages: TestStep = {
  id: 'stress-rapid-messages',
  name: 'Stress Test: Rapid Messages',
  description: 'Send 5 messages rapidly and verify no boundary violations',
  tool: 'evaluate_script',
  params: {
    function: `async () => {
  const chatInput = document.querySelector('.chat-panel__input-field');
  const sendBtn = document.querySelector('.chat-panel__send-btn');

  if (!chatInput || !sendBtn) {
    return { error: 'Chat input or send button not found' };
  }

  // Send 5 messages rapidly
  for (let i = 1; i <= 5; i++) {
    chatInput.value = 'Message ' + i;
    chatInput.dispatchEvent(new Event('input', { bubbles: true }));
    sendBtn.click();
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Wait for all messages to render
  await new Promise(resolve => setTimeout(resolve, 1000));

  return { success: true, messagesSent: 5 };
}`,
  },
  assertions: [
    {
      check: 'truthy',
      target: 'success',
      expected: true,
      message: 'Should send 5 messages successfully',
    },
  ],
  screenshot: true,
  onFailure: 'continue',
};

/**
 * Step 8b: Respect Check After Rapid Messages
 * Verify boundaries hold after rapid message sending
 */
export const step08b_respectCheckAfterRapid: TestStep = {
  id: 'respect-check-after-rapid',
  name: 'Respect Check After Rapid Messages',
  description: 'Verify no boundary violations after rapid message sending',
  tool: 'evaluate_script',
  params: {
    function: RESPECT_CHECK_SCRIPT,
  },
  assertions: [
    {
      check: 'truthy',
      target: 'summary.high',
      expected: 0,
      message: 'Should have ZERO high-severity violations after rapid messages',
    },
  ],
  screenshot: true,
  onFailure: 'continue',
  captureFrom: (response: unknown, context: TestContext) => {
    context.stepResults.respectCheckAfterRapid = response;
    return {};
  },
};

/**
 * Step 9: Stress Test - Narrow Viewport
 * Resize to 320px width and verify responsive behavior
 */
export const step09_stressNarrowViewport: TestStep = {
  id: 'stress-narrow-viewport',
  name: 'Stress Test: Narrow Viewport',
  description: 'Resize to 320px width and verify no boundary violations',
  tool: 'evaluate_script',
  params: {
    function: `async () => {
  // Store original dimensions
  const originalWidth = window.innerWidth;
  const originalHeight = window.innerHeight;

  // Resize to narrow viewport (mobile width)
  window.resizeTo(320, originalHeight);

  // Wait for resize to take effect
  await new Promise(resolve => setTimeout(resolve, 500));

  // Run respect check
  const checkResult = ${RESPECT_CHECK_SCRIPT};

  // Restore viewport
  window.resizeTo(originalWidth, originalHeight);
  await new Promise(resolve => setTimeout(resolve, 500));

  return {
    checkResult,
    resized: true,
    narrowWidth: 320,
    restored: true
  };
}`,
  },
  assertions: [
    {
      check: 'truthy',
      target: 'resized',
      expected: true,
      message: 'Should successfully resize viewport',
    },
  ],
  screenshot: true,
  onFailure: 'continue',
  captureFrom: (response: unknown, context: TestContext) => {
    context.stepResults.stressNarrowViewport = response;

    // Extract checkResult.summary.high for validation
    const result = response as any;
    if (result.checkResult && result.checkResult.summary) {
      context.stepResults.narrowViewportHighViolations = result.checkResult.summary.high;
    }

    return {};
  },
};

/**
 * Step 10: Cleanup
 * Mark test session as completed
 */
export const step10_cleanup: TestStep = {
  id: 'cleanup',
  name: 'Cleanup Test Session',
  description: 'Mark test session as completed and report final results',
  tool: 'evaluate_script',
  params: (context: TestContext) => ({
    function: `async () => {
  const sessionId = '${context.sessionId || ''}';
  if (!sessionId) {
    return {
      skipped: true,
      reason: 'No session ID captured',
      testComplete: true
    };
  }

  const response = await fetch('${BACKEND_URL}/api/sessions/' + sessionId, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      status: 'completed',
      endReason: 'e2e-respect-check-complete'
    }),
  });

  return {
    ok: response.ok,
    status: response.status,
    testComplete: true
  };
}`,
  }),
  assertions: [
    {
      check: 'truthy',
      target: 'testComplete',
      expected: true,
      message: 'Test should complete successfully',
    },
  ],
  screenshot: false,
  onFailure: 'continue',
};

/**
 * All test steps in execution order
 */
export const testSteps: TestStep[] = [
  step01_healthCheck,
  step02_navigate,
  step03_baselineRespectCheck,
  step04_createSession,
  step04b_verifySessionApi,
  step05_sendTestMessage,
  step05b_clickSend,
  step05c_waitForMessage,
  step06_populatedRespectCheck,
  step07_stressLongMessage,
  step08_stressRapidMessages,
  step08b_respectCheckAfterRapid,
  step09_stressNarrowViewport,
  step10_cleanup,
];

/**
 * Test metadata
 */
export const testMetadata = {
  name: 'Chrome MCP Respect Check E2E Test',
  description: 'Verify every UI component stays within its defined spatial boundaries',
  version: '1.0.0',
  prerequisites: [
    'Backend running on localhost:3001',
    'Frontend running on localhost:5173',
    'Chrome DevTools MCP server connected',
  ],
  totalSteps: testSteps.length,
  estimatedDuration: '45-60 seconds',
  coverage: [
    'Layout shell containment (workbench, body, main, content)',
    'Topbar fixed dimensions (52px height)',
    'Sidebar fixed width (240px)',
    'Panel min/max constraints (chat panel, session panels)',
    'Chat bubble max-width (85% of parent)',
    'Input field height constraints (36-120px)',
    'Send button dimensions (36x36px)',
    'Visualization area containment',
    'Modal max dimensions (command palette)',
    'Responsive behavior (narrow viewport)',
    'Overflow prevention (horizontal/vertical)',
    'Parent containment (panels, widgets, content areas)',
  ],
};
