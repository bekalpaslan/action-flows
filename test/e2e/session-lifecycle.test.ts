/**
 * Chrome MCP E2E Test: Session Lifecycle
 *
 * Tests for session creation, status progression, and deletion.
 *
 * Execution:
 * 1. Start dev servers: pnpm dev:backend && pnpm dev:app
 * 2. Ask Claude: "run the session lifecycle E2E tests"
 * 3. Claude will execute each test step-by-step
 *
 * Test Coverage:
 * - LIFECYCLE-001: Create new session via UI button
 * - LIFECYCLE-002: Session status progression (pending → in_progress → completed)
 * - LIFECYCLE-003: Delete session via hover + delete button click
 */

import type { TestStep, TestContext } from './chrome-mcp-utils';
import {
  BACKEND_URL,
  FRONTEND_URL,
  TIMEOUTS,
  SELECTORS,
  API_ENDPOINTS,
} from './chrome-mcp-utils';

// ========================================
// LIFECYCLE-001: Create New Session
// ========================================

export const lifecycle001_step01_navigate: TestStep = {
  id: 'lifecycle-001-navigate',
  name: 'Navigate to Frontend',
  description: 'Load the ActionFlows Dashboard',
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

export const lifecycle001_step02_snapshot: TestStep = {
  id: 'lifecycle-001-snapshot',
  name: 'Take Snapshot for New Session Button',
  description: 'Capture snapshot to locate new session button UID',
  tool: 'take_snapshot',
  params: {},
  assertions: [
    {
      check: 'snapshot_has_element',
      target: SELECTORS.newSessionBtn,
      expected: true,
      message: 'New session button should be visible',
    },
  ],
  screenshot: true,
  onFailure: 'abort',
  captureFrom: (response: unknown, context: TestContext) => {
    // Claude will extract newSessionBtn UID from snapshot
    return {};
  },
};

export const lifecycle001_step03_clickNewSession: TestStep = {
  id: 'lifecycle-001-click',
  name: 'Click New Session Button',
  description: 'Create a new session via UI',
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

export const lifecycle001_step04_verifySession: TestStep = {
  id: 'lifecycle-001-verify',
  name: 'Verify Session Created',
  description: 'Check that session appears in sidebar',
  tool: 'take_snapshot',
  params: {},
  assertions: [
    {
      check: 'snapshot_has_element',
      target: SELECTORS.sessionSidebarItem,
      expected: true,
      message: 'Session item should appear in sidebar',
    },
  ],
  screenshot: true,
  onFailure: 'abort',
  captureFrom: (response: unknown, context: TestContext) => {
    // Extract session ID from API network request
    return {};
  },
};

export const lifecycle001_step05_getSessionId: TestStep = {
  id: 'lifecycle-001-get-id',
  name: 'Extract Session ID',
  description: 'Get session ID from POST /api/sessions response',
  tool: 'list_network_requests',
  params: {
    resourceTypes: ['fetch', 'xhr'],
  },
  assertions: [
    {
      check: 'network_request_exists',
      target: 'POST',
      expected: API_ENDPOINTS.sessions,
      message: 'Should find session creation request',
    },
  ],
  screenshot: false,
  onFailure: 'abort',
  captureFrom: (response: unknown, context: TestContext) => {
    // Extract createSession request ID
    return {};
  },
};

export const lifecycle001_step06_getResponse: TestStep = {
  id: 'lifecycle-001-get-response',
  name: 'Get Session Creation Response',
  description: 'Extract session ID from response body',
  tool: 'get_network_request',
  params: (context: TestContext) => ({
    reqid: context.networkReqIds.createSession,
  }),
  assertions: [
    {
      check: 'network_status_code',
      expected: 201,
      message: 'Session creation should return 201',
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
    // Parse response body and set context.sessionId
    return {};
  },
};

// ========================================
// LIFECYCLE-002: Status Progression
// ========================================

export const lifecycle002_step01_setup: TestStep = {
  id: 'lifecycle-002-setup',
  name: 'Create Test Session',
  description: 'Seed session via API for status progression test',
  tool: 'evaluate_script',
  params: {
    function: `async () => {
      const res = await fetch('${BACKEND_URL}${API_ENDPOINTS.sessions}', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'e2e-lifecycle-test',
          cwd: '/test',
          hostname: 'e2e',
          platform: 'test'
        })
      });
      const data = await res.json();
      return data.id;
    }`,
  },
  assertions: [
    {
      check: 'truthy',
      expected: true,
      message: 'Session should be created',
    },
  ],
  screenshot: false,
  onFailure: 'abort',
  captureFrom: (response: unknown, context: TestContext) => {
    // Set context.sessionId from response
    return {};
  },
};

export const lifecycle002_step02_navigate: TestStep = {
  id: 'lifecycle-002-navigate',
  name: 'Navigate to Frontend',
  description: 'Load dashboard to view session',
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
      message: 'Page should load',
    },
  ],
  screenshot: true,
  onFailure: 'abort',
};

export const lifecycle002_step03_verifyPending: TestStep = {
  id: 'lifecycle-002-verify-pending',
  name: 'Verify Pending Status',
  description: 'Check status dot shows pending (gray)',
  tool: 'take_snapshot',
  params: {},
  assertions: [
    {
      check: 'snapshot_has_element',
      target: SELECTORS.statusDot,
      expected: true,
      message: 'Status dot should be visible',
    },
  ],
  screenshot: true,
  onFailure: 'abort',
  captureFrom: (response: unknown, context: TestContext) => {
    // Extract statusDot UID
    return {};
  },
};

export const lifecycle002_step04_updateToInProgress: TestStep = {
  id: 'lifecycle-002-update-in-progress',
  name: 'Update to In Progress',
  description: 'Change session status to in_progress via API',
  tool: 'evaluate_script',
  params: (context: TestContext) => ({
    function: `async () => {
      const sessionId = '${context.sessionId || ''}';
      const res = await fetch('${BACKEND_URL}/api/sessions/' + sessionId, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'in_progress' })
      });
      return res.ok;
    }`,
  }),
  assertions: [
    {
      check: 'truthy',
      expected: true,
      message: 'Status update should succeed',
    },
  ],
  screenshot: false,
  onFailure: 'abort',
};

export const lifecycle002_step05_verifyInProgress: TestStep = {
  id: 'lifecycle-002-verify-in-progress',
  name: 'Verify In Progress Status',
  description: 'Wait for status dot to change color (blue)',
  tool: 'wait_for',
  params: {
    text: 'ACTIVE',
    timeout: TIMEOUTS.element,
  },
  assertions: [
    {
      check: 'truthy',
      expected: true,
      message: 'Active section should appear',
    },
  ],
  screenshot: true,
  onFailure: 'abort',
};

export const lifecycle002_step06_updateToCompleted: TestStep = {
  id: 'lifecycle-002-update-completed',
  name: 'Update to Completed',
  description: 'Change session status to completed via API',
  tool: 'evaluate_script',
  params: (context: TestContext) => ({
    function: `async () => {
      const sessionId = '${context.sessionId || ''}';
      const res = await fetch('${BACKEND_URL}/api/sessions/' + sessionId, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed', endReason: 'test-complete' })
      });
      return res.ok;
    }`,
  }),
  assertions: [
    {
      check: 'truthy',
      expected: true,
      message: 'Status update should succeed',
    },
  ],
  screenshot: false,
  onFailure: 'abort',
};

export const lifecycle002_step07_verifyCompleted: TestStep = {
  id: 'lifecycle-002-verify-completed',
  name: 'Verify Completed Status',
  description: 'Check session moved to Recent section with green dot',
  tool: 'wait_for',
  params: {
    text: 'RECENT',
    timeout: TIMEOUTS.element,
  },
  assertions: [
    {
      check: 'truthy',
      expected: true,
      message: 'Recent section should appear',
    },
  ],
  screenshot: true,
  onFailure: 'abort',
};

export const lifecycle002_step08_cleanup: TestStep = {
  id: 'lifecycle-002-cleanup',
  name: 'Cleanup Test Session',
  description: 'Delete test session',
  tool: 'evaluate_script',
  params: (context: TestContext) => ({
    function: `async () => {
      const sessionId = '${context.sessionId || ''}';
      const res = await fetch('${BACKEND_URL}/api/sessions/' + sessionId, {
        method: 'DELETE'
      });
      return res.ok;
    }`,
  }),
  assertions: [
    {
      check: 'truthy',
      expected: true,
      message: 'Cleanup should succeed',
    },
  ],
  screenshot: false,
  onFailure: 'continue',
};

// ========================================
// LIFECYCLE-003: Delete Session
// ========================================

export const lifecycle003_step01_setup: TestStep = {
  id: 'lifecycle-003-setup',
  name: 'Create Test Session',
  description: 'Seed session via API for deletion test',
  tool: 'evaluate_script',
  params: {
    function: `async () => {
      const res = await fetch('${BACKEND_URL}${API_ENDPOINTS.sessions}', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'e2e-delete-test',
          cwd: '/test',
          hostname: 'e2e',
          platform: 'test'
        })
      });
      const data = await res.json();
      return data.id;
    }`,
  },
  assertions: [
    {
      check: 'truthy',
      expected: true,
      message: 'Session should be created',
    },
  ],
  screenshot: false,
  onFailure: 'abort',
  captureFrom: (response: unknown, context: TestContext) => {
    // Set context.sessionId
    return {};
  },
};

export const lifecycle003_step02_navigate: TestStep = {
  id: 'lifecycle-003-navigate',
  name: 'Navigate to Frontend',
  description: 'Load dashboard',
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
      message: 'Page should load',
    },
  ],
  screenshot: true,
  onFailure: 'abort',
};

export const lifecycle003_step03_snapshot: TestStep = {
  id: 'lifecycle-003-snapshot',
  name: 'Locate Session Item',
  description: 'Find session item UID in sidebar',
  tool: 'take_snapshot',
  params: {},
  assertions: [
    {
      check: 'snapshot_has_element',
      target: SELECTORS.sessionSidebarItem,
      expected: true,
      message: 'Session item should exist',
    },
  ],
  screenshot: true,
  onFailure: 'abort',
  captureFrom: (response: unknown, context: TestContext) => {
    // Extract sessionItem UID
    return {};
  },
};

export const lifecycle003_step04_hover: TestStep = {
  id: 'lifecycle-003-hover',
  name: 'Hover Over Session',
  description: 'Hover to reveal delete button',
  tool: 'hover',
  params: (context: TestContext) => ({
    uid: context.elementUids.sessionItem || '<from-snapshot>',
    includeSnapshot: true,
  }),
  assertions: [
    {
      check: 'truthy',
      expected: true,
      message: 'Hover should succeed',
    },
  ],
  screenshot: true,
  onFailure: 'abort',
  captureFrom: (response: unknown, context: TestContext) => {
    // Extract deleteBtn UID from updated snapshot
    return {};
  },
};

export const lifecycle003_step05_clickDelete: TestStep = {
  id: 'lifecycle-003-click-delete',
  name: 'Click Delete Button',
  description: 'Click the X button to delete session',
  tool: 'click',
  params: (context: TestContext) => ({
    uid: context.elementUids.deleteBtn || '<from-snapshot>',
    includeSnapshot: true,
  }),
  assertions: [
    {
      check: 'truthy',
      expected: true,
      message: 'Delete click should succeed',
    },
  ],
  screenshot: true,
  onFailure: 'abort',
};

export const lifecycle003_step06_verifyDeleted: TestStep = {
  id: 'lifecycle-003-verify-deleted',
  name: 'Verify Session Deleted',
  description: 'Check session no longer appears in sidebar',
  tool: 'evaluate_script',
  params: (context: TestContext) => ({
    function: `async () => {
      const sessionId = '${context.sessionId || ''}';
      const res = await fetch('${BACKEND_URL}/api/sessions/' + sessionId);
      // Should return 404 or session should be marked deleted
      return res.status === 404 || (await res.json()).status === 'deleted';
    }`,
  }),
  assertions: [
    {
      check: 'truthy',
      expected: true,
      message: 'Session should be deleted',
    },
  ],
  screenshot: true,
  onFailure: 'abort',
};

/**
 * All test steps in execution order
 */
export const testSteps: TestStep[] = [
  // LIFECYCLE-001
  lifecycle001_step01_navigate,
  lifecycle001_step02_snapshot,
  lifecycle001_step03_clickNewSession,
  lifecycle001_step04_verifySession,
  lifecycle001_step05_getSessionId,
  lifecycle001_step06_getResponse,

  // LIFECYCLE-002
  lifecycle002_step01_setup,
  lifecycle002_step02_navigate,
  lifecycle002_step03_verifyPending,
  lifecycle002_step04_updateToInProgress,
  lifecycle002_step05_verifyInProgress,
  lifecycle002_step06_updateToCompleted,
  lifecycle002_step07_verifyCompleted,
  lifecycle002_step08_cleanup,

  // LIFECYCLE-003
  lifecycle003_step01_setup,
  lifecycle003_step02_navigate,
  lifecycle003_step03_snapshot,
  lifecycle003_step04_hover,
  lifecycle003_step05_clickDelete,
  lifecycle003_step06_verifyDeleted,
];

/**
 * Test metadata
 */
export const testMetadata = {
  name: 'Session Lifecycle E2E Tests',
  description: 'Tests for session creation, status progression, and deletion',
  version: '1.0.0',
  prerequisites: [
    'Backend running on localhost:3001',
    'Frontend running on localhost:5173',
    'Chrome DevTools MCP server connected',
  ],
  totalSteps: testSteps.length,
  estimatedDuration: '60-90 seconds',
  tests: [
    {
      id: 'LIFECYCLE-001',
      name: 'Create new session via UI button',
      steps: 6,
    },
    {
      id: 'LIFECYCLE-002',
      name: 'Session status progression',
      steps: 8,
    },
    {
      id: 'LIFECYCLE-003',
      name: 'Delete session via hover + delete button',
      steps: 6,
    },
  ],
};
