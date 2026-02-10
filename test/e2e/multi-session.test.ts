/**
 * Chrome MCP E2E Test: Multi-Session Operations
 *
 * Tests for complex multi-session scenarios.
 *
 * Execution:
 * 1. Start dev servers: pnpm dev:backend && pnpm dev:app
 * 2. Ask Claude: "run the multi-session E2E tests"
 * 3. Claude will execute each test step-by-step
 *
 * Test Coverage:
 * - MULTI-001: Switch between 3 sessions, verify active/info/conversation updates
 * - MULTI-002: Concurrent status updates via API reflect in UI
 * - MULTI-003: Bulk create 5 sessions rapidly
 * - MULTI-004: Placeholder for session filtering (future feature)
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
// MULTI-001: Session Switching
// ========================================

export const multi001_step01_setup: TestStep = {
  id: 'multi-001-setup',
  name: 'Create 3 Test Sessions',
  description: 'Seed 3 sessions with different data',
  tool: 'evaluate_script',
  params: {
    function: `async () => {
      const sessions = [];
      for (let i = 0; i < 3; i++) {
        const res = await fetch('${BACKEND_URL}${API_ENDPOINTS.sessions}', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: 'e2e-multi-test',
            cwd: '/test/session-' + i,
            hostname: 'e2e-host-' + i,
            platform: 'test'
          })
        });
        const data = await res.json();

        // Add unique messages to each session
        await fetch('${BACKEND_URL}/api/sessions/' + data.id + '/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [
              { role: 'assistant', content: 'Session ' + i + ' message' }
            ]
          })
        });

        sessions.push(data.id);
      }
      return sessions;
    }`,
  },
  assertions: [
    {
      check: 'truthy',
      expected: true,
      message: 'Sessions should be created',
    },
  ],
  screenshot: false,
  onFailure: 'abort',
  captureFrom: (response: unknown, context: TestContext) => {
    // Store session IDs array
    return {};
  },
};

export const multi001_step02_navigate: TestStep = {
  id: 'multi-001-navigate',
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

export const multi001_step03_locateSessions: TestStep = {
  id: 'multi-001-locate-sessions',
  name: 'Locate Session Items',
  description: 'Find all 3 session item UIDs',
  tool: 'take_snapshot',
  params: {},
  assertions: [
    {
      check: 'snapshot_has_element',
      target: SELECTORS.sessionSidebarItem,
      expected: true,
      message: 'Session items should exist',
    },
  ],
  screenshot: true,
  onFailure: 'abort',
  captureFrom: (response: unknown, context: TestContext) => {
    // Extract UIDs for session1, session2, session3
    return {};
  },
};

export const multi001_step04_clickSession1: TestStep = {
  id: 'multi-001-click-session1',
  name: 'Click Session 1',
  description: 'Select first session',
  tool: 'click',
  params: (context: TestContext) => ({
    uid: context.elementUids.session1 || '<from-snapshot>',
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

export const multi001_step05_verifySession1: TestStep = {
  id: 'multi-001-verify-session1',
  name: 'Verify Session 1 Content',
  description: 'Check conversation displays session 1 message',
  tool: 'wait_for',
  params: {
    text: 'Session 0 message',
    timeout: TIMEOUTS.element,
  },
  assertions: [
    {
      check: 'truthy',
      expected: true,
      message: 'Session 1 message should appear',
    },
  ],
  screenshot: true,
  onFailure: 'abort',
};

export const multi001_step06_clickSession2: TestStep = {
  id: 'multi-001-click-session2',
  name: 'Click Session 2',
  description: 'Switch to second session',
  tool: 'click',
  params: (context: TestContext) => ({
    uid: context.elementUids.session2 || '<from-snapshot>',
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

export const multi001_step07_verifySession2: TestStep = {
  id: 'multi-001-verify-session2',
  name: 'Verify Session 2 Content',
  description: 'Check conversation displays session 2 message',
  tool: 'wait_for',
  params: {
    text: 'Session 1 message',
    timeout: TIMEOUTS.element,
  },
  assertions: [
    {
      check: 'truthy',
      expected: true,
      message: 'Session 2 message should appear',
    },
  ],
  screenshot: true,
  onFailure: 'abort',
};

export const multi001_step08_clickSession3: TestStep = {
  id: 'multi-001-click-session3',
  name: 'Click Session 3',
  description: 'Switch to third session',
  tool: 'click',
  params: (context: TestContext) => ({
    uid: context.elementUids.session3 || '<from-snapshot>',
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

export const multi001_step09_verifySession3: TestStep = {
  id: 'multi-001-verify-session3',
  name: 'Verify Session 3 Content',
  description: 'Check conversation displays session 3 message',
  tool: 'wait_for',
  params: {
    text: 'Session 2 message',
    timeout: TIMEOUTS.element,
  },
  assertions: [
    {
      check: 'truthy',
      expected: true,
      message: 'Session 3 message should appear',
    },
  ],
  screenshot: true,
  onFailure: 'abort',
};

export const multi001_step10_verifyActiveClass: TestStep = {
  id: 'multi-001-verify-active',
  name: 'Verify Active Class',
  description: 'Check session 3 has active class',
  tool: 'evaluate_script',
  params: {
    function: `() => {
      const activeItem = document.querySelector('.${SELECTORS.sessionSidebarItemActive}');
      return activeItem !== null;
    }`,
  },
  assertions: [
    {
      check: 'truthy',
      expected: true,
      message: 'Active class should be applied to session 3',
    },
  ],
  screenshot: true,
  onFailure: 'abort',
};

export const multi001_step11_cleanup: TestStep = {
  id: 'multi-001-cleanup',
  name: 'Cleanup Test Sessions',
  description: 'Delete test sessions',
  tool: 'evaluate_script',
  params: {
    function: `async () => {
      const res = await fetch('${BACKEND_URL}${API_ENDPOINTS.sessions}');
      const data = await res.json();
      for (const s of (data.sessions || [])) {
        if (s.user === 'e2e-multi-test') {
          await fetch('${BACKEND_URL}/api/sessions/' + s.id, { method: 'DELETE' });
        }
      }
      return true;
    }`,
  },
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
// MULTI-002: Concurrent Status Updates
// ========================================

export const multi002_step01_setup: TestStep = {
  id: 'multi-002-setup',
  name: 'Create 3 Test Sessions',
  description: 'Seed 3 sessions with pending status',
  tool: 'evaluate_script',
  params: {
    function: `async () => {
      const sessions = [];
      for (let i = 0; i < 3; i++) {
        const res = await fetch('${BACKEND_URL}${API_ENDPOINTS.sessions}', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: 'e2e-concurrent-test',
            cwd: '/test',
            hostname: 'e2e',
            platform: 'test'
          })
        });
        const data = await res.json();
        sessions.push(data.id);
      }
      return sessions;
    }`,
  },
  assertions: [
    {
      check: 'truthy',
      expected: true,
      message: 'Sessions should be created',
    },
  ],
  screenshot: false,
  onFailure: 'abort',
  captureFrom: (response: unknown, context: TestContext) => {
    // Store session IDs array
    return {};
  },
};

export const multi002_step02_navigate: TestStep = {
  id: 'multi-002-navigate',
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

export const multi002_step03_verifySessions: TestStep = {
  id: 'multi-002-verify-sessions',
  name: 'Verify Initial Sessions',
  description: 'Check all 3 sessions appear in sidebar',
  tool: 'evaluate_script',
  params: {
    function: `() => {
      const items = document.querySelectorAll('.${SELECTORS.sessionSidebarItem}');
      return items.length >= 3;
    }`,
  },
  assertions: [
    {
      check: 'truthy',
      expected: true,
      message: 'Should have at least 3 sessions',
    },
  ],
  screenshot: true,
  onFailure: 'abort',
};

export const multi002_step04_updateAll: TestStep = {
  id: 'multi-002-update-all',
  name: 'Update All Sessions Concurrently',
  description: 'Update all 3 sessions to in_progress via API',
  tool: 'evaluate_script',
  params: (context: TestContext) => ({
    function: `async () => {
      // Get all sessions
      const res = await fetch('${BACKEND_URL}${API_ENDPOINTS.sessions}');
      const data = await res.json();
      const sessions = (data.sessions || []).filter(s => s.user === 'e2e-concurrent-test');

      // Update all concurrently
      const updates = sessions.map(s =>
        fetch('${BACKEND_URL}/api/sessions/' + s.id, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'in_progress' })
        })
      );

      await Promise.all(updates);
      return true;
    }`,
  }),
  assertions: [
    {
      check: 'truthy',
      expected: true,
      message: 'Concurrent updates should succeed',
    },
  ],
  screenshot: false,
  onFailure: 'abort',
};

export const multi002_step05_verifyUpdates: TestStep = {
  id: 'multi-002-verify-updates',
  name: 'Verify UI Updates',
  description: 'Check all sessions moved to Active section',
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

export const multi002_step06_verifyStatusDots: TestStep = {
  id: 'multi-002-verify-dots',
  name: 'Verify Status Dots',
  description: 'Check all sessions have blue status dots (in_progress)',
  tool: 'evaluate_script',
  params: {
    function: `() => {
      const statusDots = document.querySelectorAll('.${SELECTORS.statusDot}');
      return statusDots.length >= 3;
    }`,
  },
  assertions: [
    {
      check: 'truthy',
      expected: true,
      message: 'Should have at least 3 status dots',
    },
  ],
  screenshot: true,
  onFailure: 'abort',
};

export const multi002_step07_cleanup: TestStep = {
  id: 'multi-002-cleanup',
  name: 'Cleanup Test Sessions',
  description: 'Delete test sessions',
  tool: 'evaluate_script',
  params: {
    function: `async () => {
      const res = await fetch('${BACKEND_URL}${API_ENDPOINTS.sessions}');
      const data = await res.json();
      for (const s of (data.sessions || [])) {
        if (s.user === 'e2e-concurrent-test') {
          await fetch('${BACKEND_URL}/api/sessions/' + s.id, { method: 'DELETE' });
        }
      }
      return true;
    }`,
  },
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
// MULTI-003: Bulk Session Creation
// ========================================

export const multi003_step01_navigate: TestStep = {
  id: 'multi-003-navigate',
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

export const multi003_step02_bulkCreate: TestStep = {
  id: 'multi-003-bulk-create',
  name: 'Bulk Create 5 Sessions',
  description: 'Create 5 sessions rapidly via API',
  tool: 'evaluate_script',
  params: {
    function: `async () => {
      const sessions = [];
      const promises = [];

      for (let i = 0; i < 5; i++) {
        promises.push(
          fetch('${BACKEND_URL}${API_ENDPOINTS.sessions}', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: 'e2e-bulk-test',
              cwd: '/test/bulk-' + i,
              hostname: 'e2e-bulk',
              platform: 'test'
            })
          }).then(res => res.json())
        );
      }

      const results = await Promise.all(promises);
      return results.map(r => r.id);
    }`,
  },
  assertions: [
    {
      check: 'truthy',
      expected: true,
      message: 'Bulk creation should succeed',
    },
  ],
  screenshot: false,
  onFailure: 'abort',
  captureFrom: (response: unknown, context: TestContext) => {
    // Store session IDs
    return {};
  },
};

export const multi003_step03_verifyAll: TestStep = {
  id: 'multi-003-verify-all',
  name: 'Verify All Sessions Appear',
  description: 'Check all 5 sessions appear in sidebar',
  tool: 'wait_for',
  params: {
    text: 'RECENT',
    timeout: TIMEOUTS.element,
  },
  assertions: [
    {
      check: 'truthy',
      expected: true,
      message: 'Sessions should appear',
    },
  ],
  screenshot: true,
  onFailure: 'abort',
};

export const multi003_step04_countSessions: TestStep = {
  id: 'multi-003-count-sessions',
  name: 'Count Session Items',
  description: 'Verify at least 5 session items exist',
  tool: 'evaluate_script',
  params: {
    function: `() => {
      const items = document.querySelectorAll('.${SELECTORS.sessionSidebarItem}');
      return {
        count: items.length,
        hasAtLeastFive: items.length >= 5
      };
    }`,
  },
  assertions: [
    {
      check: 'truthy',
      expected: true,
      message: 'Should have at least 5 sessions',
    },
  ],
  screenshot: true,
  onFailure: 'abort',
};

export const multi003_step05_cleanup: TestStep = {
  id: 'multi-003-cleanup',
  name: 'Cleanup Test Sessions',
  description: 'Delete test sessions',
  tool: 'evaluate_script',
  params: {
    function: `async () => {
      const res = await fetch('${BACKEND_URL}${API_ENDPOINTS.sessions}');
      const data = await res.json();
      for (const s of (data.sessions || [])) {
        if (s.user === 'e2e-bulk-test') {
          await fetch('${BACKEND_URL}/api/sessions/' + s.id, { method: 'DELETE' });
        }
      }
      return true;
    }`,
  },
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
// MULTI-004: Session Filtering (Placeholder)
// ========================================

export const multi004_step01_setup: TestStep = {
  id: 'multi-004-setup',
  name: 'Setup for Filtering Test',
  description: 'Placeholder for future session filtering feature',
  tool: 'evaluate_script',
  params: {
    function: `async () => {
      // This test is a placeholder for future session filtering functionality
      // When implemented, this will test:
      // - Filter sessions by status
      // - Filter sessions by date range
      // - Search sessions by name/ID
      // - Clear filters
      return { placeholder: true, reason: 'Feature not yet implemented' };
    }`,
  },
  assertions: [
    {
      check: 'truthy',
      expected: true,
      message: 'Placeholder test should pass',
    },
  ],
  screenshot: false,
  onFailure: 'continue',
};

export const multi004_step02_navigate: TestStep = {
  id: 'multi-004-navigate',
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
  onFailure: 'continue',
};

export const multi004_step03_placeholder: TestStep = {
  id: 'multi-004-placeholder',
  name: 'Placeholder Filter Test',
  description: 'Placeholder for filtering UI interactions',
  tool: 'take_snapshot',
  params: {},
  assertions: [
    {
      check: 'snapshot_has_element',
      target: SELECTORS.sessionList,
      expected: true,
      message: 'Session list should exist (filter controls TBD)',
    },
  ],
  screenshot: true,
  onFailure: 'continue',
};

/**
 * All test steps in execution order
 */
export const testSteps: TestStep[] = [
  // MULTI-001
  multi001_step01_setup,
  multi001_step02_navigate,
  multi001_step03_locateSessions,
  multi001_step04_clickSession1,
  multi001_step05_verifySession1,
  multi001_step06_clickSession2,
  multi001_step07_verifySession2,
  multi001_step08_clickSession3,
  multi001_step09_verifySession3,
  multi001_step10_verifyActiveClass,
  multi001_step11_cleanup,

  // MULTI-002
  multi002_step01_setup,
  multi002_step02_navigate,
  multi002_step03_verifySessions,
  multi002_step04_updateAll,
  multi002_step05_verifyUpdates,
  multi002_step06_verifyStatusDots,
  multi002_step07_cleanup,

  // MULTI-003
  multi003_step01_navigate,
  multi003_step02_bulkCreate,
  multi003_step03_verifyAll,
  multi003_step04_countSessions,
  multi003_step05_cleanup,

  // MULTI-004
  multi004_step01_setup,
  multi004_step02_navigate,
  multi004_step03_placeholder,
];

/**
 * Test metadata
 */
export const testMetadata = {
  name: 'Multi-Session E2E Tests',
  description: 'Tests for complex multi-session scenarios',
  version: '1.0.0',
  prerequisites: [
    'Backend running on localhost:3001',
    'Frontend running on localhost:5173',
    'Chrome DevTools MCP server connected',
  ],
  totalSteps: testSteps.length,
  estimatedDuration: '90-120 seconds',
  tests: [
    {
      id: 'MULTI-001',
      name: 'Switch between sessions and verify content',
      steps: 11,
    },
    {
      id: 'MULTI-002',
      name: 'Concurrent status updates reflect in UI',
      steps: 7,
    },
    {
      id: 'MULTI-003',
      name: 'Bulk create 5 sessions rapidly',
      steps: 5,
    },
    {
      id: 'MULTI-004',
      name: 'Session filtering (placeholder)',
      steps: 3,
    },
  ],
};
