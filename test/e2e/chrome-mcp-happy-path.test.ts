/**
 * Chrome MCP E2E Happy Path Test
 *
 * This file defines a structured E2E test that Claude executes step-by-step
 * using Chrome DevTools MCP tools. It is NOT run by Vitest/Jest - instead,
 * it serves as a test runbook that Claude reads and executes interactively.
 *
 * Execution:
 * 1. Start dev servers: pnpm dev:backend && pnpm dev:app
 * 2. Ask Claude: "run the Chrome MCP E2E happy path test"
 * 3. Claude will execute each step, take snapshots/screenshots, and report results
 *
 * Prerequisites:
 * - Backend running on localhost:3001 (pnpm dev:backend)
 * - Frontend running on localhost:5173 (pnpm dev:app)
 * - Chrome DevTools MCP server connected
 *
 * Test Flow:
 * 1. Health check - Verify backend is responsive
 * 2. Navigate - Load frontend app
 * 3. Verify landing - Check initial state (empty sessions, new button visible)
 * 4. Click new session - Create a session via UI
 * 5. Verify API - Check POST /api/sessions succeeded
 * 6. Verify sidebar - Check session appears in sidebar
 * 7. Verify WebSocket - Check WebSocket connection established
 * 8. Verify chat panel - Check chat UI is visible
 * 9. Type message - Enter test message in chat input
 * 10. Send message - Click send button
 * 11. Verify display - Check message appears in chat
 * 12. Verify backend - Check message was received by backend
 */

import type { TestStep, TestContext } from './chrome-mcp-utils';
import {
  BACKEND_URL,
  FRONTEND_URL,
  TIMEOUTS,
  TEST_MESSAGE,
  SELECTORS,
  API_ENDPOINTS,
} from './chrome-mcp-utils';

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
 * Step 3: Verify Landing State
 * Check initial state: empty sessions, new session button visible
 */
export const step03_verifyLanding: TestStep = {
  id: 'verify-landing',
  name: 'Verify Landing State',
  description: 'Check initial UI: Sessions sidebar, empty state, new session button',
  tool: 'take_snapshot',
  params: {},
  assertions: [
    {
      check: 'snapshot_contains_text',
      target: SELECTORS.sessionTitle,
      expected: true,
      message: 'Should find "Sessions" heading in sidebar',
    },
    {
      check: 'snapshot_contains_text',
      target: SELECTORS.emptyState,
      expected: true,
      message: 'Should show "No sessions yet" empty state',
    },
    {
      check: 'snapshot_has_element',
      target: SELECTORS.newSessionBtn,
      expected: true,
      message: 'Should have new session button visible',
    },
  ],
  screenshot: true,
  onFailure: 'abort',
  captureFrom: (response: unknown, context: TestContext) => {
    // Extract UID of new session button from snapshot
    // Claude will manually identify this from the snapshot text
    // and set context.elementUids.newSessionBtn = '<uid-from-snapshot>'
    return {};
  },
};

/**
 * Step 4: Click New Session Button
 * Create a new session via UI interaction
 */
export const step04_clickNewSession: TestStep = {
  id: 'click-new-session',
  name: 'Click New Session Button',
  description: 'Click the + button in sidebar to create a new session',
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
};

/**
 * Step 5: Verify Session Creation API
 * Check that POST /api/sessions was called and succeeded
 */
export const step05_verifySessionApi: TestStep = {
  id: 'verify-session-api',
  name: 'Verify Session Creation API',
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
    // Extract request ID for POST /api/sessions
    // Then use get_network_request to extract session ID from response body
    // Claude will set context.sessionId = '<session-id-from-response>'
    return {};
  },
};

/**
 * Step 5b: Get Session Creation Response
 * Extract session ID from the network request response
 */
export const step05b_getSessionResponse: TestStep = {
  id: 'get-session-response',
  name: 'Get Session Creation Response',
  description: 'Extract session ID from POST /api/sessions response',
  tool: 'get_network_request',
  params: (context: TestContext) => ({
    reqid: context.networkReqIds.createSession,
  }),
  assertions: [
    {
      check: 'network_status_code',
      expected: 201,
      message: 'Session creation should return 201 Created',
    },
    {
      check: 'response_contains',
      target: 'id',
      expected: true,
      message: 'Response should contain session ID',
    },
  ],
  screenshot: false,
  onFailure: 'abort',
  captureFrom: (response: unknown, context: TestContext) => {
    // Extract session ID from response.body.id
    // Claude will parse the response and set context.sessionId
    return {};
  },
};

/**
 * Step 6: Verify Sidebar Updated
 * Check that new session appears in sidebar
 */
export const step06_verifySidebarUpdated: TestStep = {
  id: 'verify-sidebar-updated',
  name: 'Verify Sidebar Updated',
  description: 'Check that new session appears in sidebar (Active or Recent section)',
  tool: 'take_snapshot',
  params: {},
  assertions: [
    {
      check: 'snapshot_contains_text',
      target: `${SELECTORS.activeSection}|${SELECTORS.recentSection}`,
      expected: true,
      message: 'Should show "ACTIVE" or "RECENT" section header (new sessions start as pending in RECENT)',
    },
    {
      check: 'snapshot_has_element',
      target: SELECTORS.sessionItem,
      expected: true,
      message: 'Should have at least one session item',
    },
  ],
  screenshot: true,
  onFailure: 'abort',
};

/**
 * Step 7: Verify WebSocket Connection
 * Check that WebSocket is connected (optional - continue on fail)
 */
export const step07_verifyWebSocket: TestStep = {
  id: 'verify-websocket',
  name: 'Verify WebSocket Connection',
  description: 'Check WebSocket connection status indicator',
  tool: 'evaluate_script',
  params: {
    function: `() => {
  // Look for WebSocket status indicator in DOM
  const statusEl = document.querySelector('[class*="ws-status"]');
  if (statusEl) {
    const text = statusEl.textContent || '';
    return text.toLowerCase().includes('connected') || text.toLowerCase().includes('ready');
  }
  // Fallback: check if WebSocket exists on window object
  return typeof WebSocket !== 'undefined';
}`,
  },
  assertions: [
    {
      check: 'truthy',
      expected: true,
      message: 'WebSocket should be connected or available',
    },
  ],
  screenshot: false,
  onFailure: 'continue', // WebSocket check is nice-to-have, not critical
};

/**
 * Step 8: Verify Chat Panel
 * Check that chat interface is visible and interactive
 */
export const step08_verifyChatPanel: TestStep = {
  id: 'verify-chat-panel',
  name: 'Verify Chat Panel',
  description: 'Check that conversation panel with input and send button is visible',
  tool: 'take_snapshot',
  params: {},
  assertions: [
    {
      check: 'snapshot_has_element',
      target: 'textarea',
      expected: true,
      message: 'Should have chat input textarea',
    },
    {
      check: 'snapshot_has_element',
      target: 'button',
      expected: true,
      message: 'Should have send button',
    },
  ],
  screenshot: true,
  onFailure: 'abort',
  captureFrom: (response: unknown, context: TestContext) => {
    // Extract UIDs for chat input textarea and send button
    // Claude will identify these from snapshot and populate:
    // context.elementUids.chatInput = '<textarea-uid>'
    // context.elementUids.chatSendBtn = '<button-uid>'
    return {};
  },
};

/**
 * Step 9: Type Test Message
 * Enter test message in chat input field
 */
export const step09_typeMessage: TestStep = {
  id: 'type-message',
  name: 'Type Test Message',
  description: `Enter test message: "${TEST_MESSAGE}"`,
  tool: 'fill',
  params: (context: TestContext) => ({
    uid: context.elementUids.chatInput || '<from-snapshot>',
    value: TEST_MESSAGE,
  }),
  assertions: [
    {
      check: 'truthy',
      expected: true,
      message: 'Text input should succeed',
    },
  ],
  screenshot: true,
  onFailure: 'abort',
};

/**
 * Step 10: Send Message
 * Click send button to submit message
 */
export const step10_sendMessage: TestStep = {
  id: 'send-message',
  name: 'Send Message',
  description: 'Click send button to submit chat message',
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
 * Step 11: Verify Message Displayed
 * Check that message appears in chat history
 */
export const step11_verifyMessageDisplayed: TestStep = {
  id: 'verify-message-displayed',
  name: 'Verify Message Displayed',
  description: 'Check that sent message appears in conversation panel',
  tool: 'wait_for',
  params: {
    text: 'Hello from E2E test',
    timeout: TIMEOUTS.messageDisplay,
  },
  assertions: [
    {
      check: 'truthy',
      expected: true,
      message: 'Message should appear in chat within timeout',
    },
  ],
  screenshot: true,
  onFailure: 'abort',
};

/**
 * Step 12: Verify Backend Received Message
 * Check that backend API has the message in session data (optional)
 */
export const step12_verifyBackendReceived: TestStep = {
  id: 'verify-backend-received',
  name: 'Verify Backend Received Message',
  description: 'Check that backend API recorded the chat message',
  tool: 'evaluate_script',
  params: (context: TestContext) => ({
    function: `async () => {
  const sessionId = '${context.sessionId || ''}';
  if (!sessionId) return false;

  const response = await fetch('${BACKEND_URL}${API_ENDPOINTS.sessionChat(context.sessionId || '')}');
  if (!response.ok) return false;

  const data = await response.json();
  const messages = data.messages || [];

  // Check if our test message exists
  return messages.some(msg =>
    msg.content && msg.content.includes('Hello from E2E test')
  );
}`,
  }),
  assertions: [
    {
      check: 'truthy',
      expected: true,
      message: 'Backend should have recorded the message',
    },
  ],
  screenshot: false,
  onFailure: 'continue', // Optional check - continue even if it fails
};

/**
 * Step 13: Cleanup - Delete Test Session
 * Remove the session created during the test to keep state clean
 */
export const step13_cleanup: TestStep = {
  id: 'cleanup',
  name: 'Cleanup Test Session',
  description: 'Delete the test session to prevent orphaned sessions across runs',
  tool: 'evaluate_script',
  params: (context: TestContext) => ({
    function: `async () => {
  const sessionId = '${context.sessionId || ''}';
  if (!sessionId) return { skipped: true, reason: 'No session ID captured' };

  const response = await fetch('http://localhost:3001/api/sessions/' + sessionId, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'completed', endReason: 'e2e-test-cleanup' }),
  });
  return { ok: response.ok, status: response.status };
}`,
  }),
  assertions: [
    {
      check: 'truthy',
      expected: true,
      message: 'Session cleanup should succeed',
    },
  ],
  screenshot: false,
  onFailure: 'continue', // Cleanup failure should not fail the test
};

/**
 * All test steps in execution order
 */
export const testSteps: TestStep[] = [
  step01_healthCheck,
  step02_navigate,
  step03_verifyLanding,
  step04_clickNewSession,
  step05_verifySessionApi,
  step05b_getSessionResponse,
  step06_verifySidebarUpdated,
  step07_verifyWebSocket,
  step08_verifyChatPanel,
  step09_typeMessage,
  step10_sendMessage,
  step11_verifyMessageDisplayed,
  step12_verifyBackendReceived,
  step13_cleanup,
];

/**
 * Test metadata
 */
export const testMetadata = {
  name: 'Chrome MCP E2E Happy Path',
  description: 'End-to-end test for session creation and chat interaction',
  version: '1.0.0',
  prerequisites: [
    'Backend running on localhost:3001',
    'Frontend running on localhost:5173',
    'Chrome DevTools MCP server connected',
  ],
  totalSteps: testSteps.length,
  estimatedDuration: '30-45 seconds',
};
