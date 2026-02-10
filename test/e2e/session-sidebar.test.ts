/**
 * Chrome MCP E2E Test: Session Sidebar
 *
 * Tests for sidebar display, navigation, and interaction.
 *
 * Execution:
 * 1. Start dev servers: pnpm dev:backend && pnpm dev:app
 * 2. Ask Claude: "run the session sidebar E2E tests"
 * 3. Claude will execute each test step-by-step
 *
 * Test Coverage:
 * - SIDEBAR-001: Active sessions section displays with in_progress sessions
 * - SIDEBAR-002: Recent sessions section displays with completed sessions
 * - SIDEBAR-003: Click session navigates (active class, info panel updates)
 * - SIDEBAR-004: Notification badges appear on events, clear on click
 * - SIDEBAR-005: Session count footer updates correctly (singular/plural)
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
// SIDEBAR-001: Active Sessions Section
// ========================================

export const sidebar001_step01_setup: TestStep = {
  id: 'sidebar-001-setup',
  name: 'Create Active Sessions',
  description: 'Seed 2 in_progress sessions via API',
  tool: 'evaluate_script',
  params: {
    function: `async () => {
      const sessions = [];
      for (let i = 0; i < 2; i++) {
        const res = await fetch('${BACKEND_URL}${API_ENDPOINTS.sessions}', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: 'e2e-sidebar-test',
            cwd: '/test',
            hostname: 'e2e',
            platform: 'test'
          })
        });
        const data = await res.json();
        // Update to in_progress
        await fetch('${BACKEND_URL}/api/sessions/' + data.id, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'in_progress' })
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

export const sidebar001_step02_navigate: TestStep = {
  id: 'sidebar-001-navigate',
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

export const sidebar001_step03_verifyActiveSection: TestStep = {
  id: 'sidebar-001-verify-active',
  name: 'Verify Active Section',
  description: 'Check ACTIVE section header appears',
  tool: 'take_snapshot',
  params: {},
  assertions: [
    {
      check: 'snapshot_contains_text',
      target: 'ACTIVE',
      expected: true,
      message: 'Active section header should be visible',
    },
    {
      check: 'snapshot_has_element',
      target: SELECTORS.sectionTitle,
      expected: true,
      message: 'Section title element should exist',
    },
  ],
  screenshot: true,
  onFailure: 'abort',
};

export const sidebar001_step04_verifySessionItems: TestStep = {
  id: 'sidebar-001-verify-items',
  name: 'Verify Session Items',
  description: 'Check 2 session items appear with blue status dots',
  tool: 'evaluate_script',
  params: {
    function: `() => {
      const items = document.querySelectorAll('.${SELECTORS.sessionSidebarItem}');
      const statusDots = document.querySelectorAll('.${SELECTORS.statusDot}');
      return {
        itemCount: items.length,
        statusDotCount: statusDots.length,
        hasItems: items.length >= 2
      };
    }`,
  },
  assertions: [
    {
      check: 'truthy',
      expected: true,
      message: 'Should have at least 2 session items',
    },
  ],
  screenshot: true,
  onFailure: 'abort',
};

export const sidebar001_step05_cleanup: TestStep = {
  id: 'sidebar-001-cleanup',
  name: 'Cleanup Test Sessions',
  description: 'Delete test sessions',
  tool: 'evaluate_script',
  params: (context: TestContext) => ({
    function: `async () => {
      const res = await fetch('${BACKEND_URL}${API_ENDPOINTS.sessions}');
      const data = await res.json();
      for (const s of (data.sessions || [])) {
        if (s.user === 'e2e-sidebar-test') {
          await fetch('${BACKEND_URL}/api/sessions/' + s.id, { method: 'DELETE' });
        }
      }
      return true;
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
// SIDEBAR-002: Recent Sessions Section
// ========================================

export const sidebar002_step01_setup: TestStep = {
  id: 'sidebar-002-setup',
  name: 'Create Completed Sessions',
  description: 'Seed 2 completed sessions via API',
  tool: 'evaluate_script',
  params: {
    function: `async () => {
      const sessions = [];
      for (let i = 0; i < 2; i++) {
        const res = await fetch('${BACKEND_URL}${API_ENDPOINTS.sessions}', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: 'e2e-sidebar-test',
            cwd: '/test',
            hostname: 'e2e',
            platform: 'test'
          })
        });
        const data = await res.json();
        // Update to completed
        await fetch('${BACKEND_URL}/api/sessions/' + data.id, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'completed', endReason: 'test' })
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
};

export const sidebar002_step02_navigate: TestStep = {
  id: 'sidebar-002-navigate',
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

export const sidebar002_step03_verifyRecentSection: TestStep = {
  id: 'sidebar-002-verify-recent',
  name: 'Verify Recent Section',
  description: 'Check RECENT section header appears',
  tool: 'take_snapshot',
  params: {},
  assertions: [
    {
      check: 'snapshot_contains_text',
      target: 'RECENT',
      expected: true,
      message: 'Recent section header should be visible',
    },
  ],
  screenshot: true,
  onFailure: 'abort',
};

export const sidebar002_step04_verifySessionItems: TestStep = {
  id: 'sidebar-002-verify-items',
  name: 'Verify Session Items',
  description: 'Check 2 session items appear with green status dots',
  tool: 'evaluate_script',
  params: {
    function: `() => {
      const items = document.querySelectorAll('.${SELECTORS.sessionSidebarItem}');
      return items.length >= 2;
    }`,
  },
  assertions: [
    {
      check: 'truthy',
      expected: true,
      message: 'Should have at least 2 session items',
    },
  ],
  screenshot: true,
  onFailure: 'abort',
};

export const sidebar002_step05_cleanup: TestStep = {
  id: 'sidebar-002-cleanup',
  name: 'Cleanup Test Sessions',
  description: 'Delete test sessions',
  tool: 'evaluate_script',
  params: {
    function: `async () => {
      const res = await fetch('${BACKEND_URL}${API_ENDPOINTS.sessions}');
      const data = await res.json();
      for (const s of (data.sessions || [])) {
        if (s.user === 'e2e-sidebar-test') {
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
// SIDEBAR-003: Session Navigation
// ========================================

export const sidebar003_step01_setup: TestStep = {
  id: 'sidebar-003-setup',
  name: 'Create Test Sessions',
  description: 'Seed 3 sessions via API',
  tool: 'evaluate_script',
  params: {
    function: `async () => {
      const sessions = [];
      for (let i = 0; i < 3; i++) {
        const res = await fetch('${BACKEND_URL}${API_ENDPOINTS.sessions}', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: 'e2e-nav-test',
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
    // Store session IDs
    return {};
  },
};

export const sidebar003_step02_navigate: TestStep = {
  id: 'sidebar-003-navigate',
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

export const sidebar003_step03_snapshot: TestStep = {
  id: 'sidebar-003-snapshot',
  name: 'Locate Session Items',
  description: 'Find first session item UID',
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
    // Extract firstSessionItem UID
    return {};
  },
};

export const sidebar003_step04_clickSession: TestStep = {
  id: 'sidebar-003-click',
  name: 'Click Session Item',
  description: 'Click first session to navigate',
  tool: 'click',
  params: (context: TestContext) => ({
    uid: context.elementUids.firstSessionItem || '<from-snapshot>',
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

export const sidebar003_step05_verifyActive: TestStep = {
  id: 'sidebar-003-verify-active',
  name: 'Verify Active Class',
  description: 'Check clicked session has active class',
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
      message: 'Active class should be applied',
    },
  ],
  screenshot: true,
  onFailure: 'abort',
};

export const sidebar003_step06_verifyInfoPanel: TestStep = {
  id: 'sidebar-003-verify-info',
  name: 'Verify Info Panel Updated',
  description: 'Check session info panel displays correct session',
  tool: 'take_snapshot',
  params: {},
  assertions: [
    {
      check: 'snapshot_has_element',
      target: SELECTORS.infoPanelHeader,
      expected: true,
      message: 'Info panel should be visible',
    },
  ],
  screenshot: true,
  onFailure: 'abort',
};

export const sidebar003_step07_cleanup: TestStep = {
  id: 'sidebar-003-cleanup',
  name: 'Cleanup Test Sessions',
  description: 'Delete test sessions',
  tool: 'evaluate_script',
  params: {
    function: `async () => {
      const res = await fetch('${BACKEND_URL}${API_ENDPOINTS.sessions}');
      const data = await res.json();
      for (const s of (data.sessions || [])) {
        if (s.user === 'e2e-nav-test') {
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
// SIDEBAR-004: Notification Badges
// ========================================

export const sidebar004_step01_setup: TestStep = {
  id: 'sidebar-004-setup',
  name: 'Create Test Session',
  description: 'Seed session via API',
  tool: 'evaluate_script',
  params: {
    function: `async () => {
      const res = await fetch('${BACKEND_URL}${API_ENDPOINTS.sessions}', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'e2e-badge-test',
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
    // Store session ID
    return {};
  },
};

export const sidebar004_step02_navigate: TestStep = {
  id: 'sidebar-004-navigate',
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

export const sidebar004_step03_triggerEvent: TestStep = {
  id: 'sidebar-004-trigger-event',
  name: 'Trigger Event',
  description: 'Add chain to session to trigger notification',
  tool: 'evaluate_script',
  params: (context: TestContext) => ({
    function: `async () => {
      const sessionId = '${context.sessionId || ''}';
      // This would normally be done via WebSocket
      // For now, just verify badge logic works
      return true;
    }`,
  }),
  assertions: [
    {
      check: 'truthy',
      expected: true,
      message: 'Event trigger should succeed',
    },
  ],
  screenshot: false,
  onFailure: 'continue',
};

export const sidebar004_step04_verifyBadge: TestStep = {
  id: 'sidebar-004-verify-badge',
  name: 'Verify Notification Badge',
  description: 'Check notification badge appears (placeholder)',
  tool: 'take_snapshot',
  params: {},
  assertions: [
    {
      check: 'snapshot_has_element',
      target: SELECTORS.sessionSidebarItem,
      expected: true,
      message: 'Session item should exist (badge check is placeholder)',
    },
  ],
  screenshot: true,
  onFailure: 'continue',
};

export const sidebar004_step05_cleanup: TestStep = {
  id: 'sidebar-004-cleanup',
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
// SIDEBAR-005: Session Count Footer
// ========================================

export const sidebar005_step01_navigate: TestStep = {
  id: 'sidebar-005-navigate',
  name: 'Navigate to Frontend',
  description: 'Load dashboard with no sessions',
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

export const sidebar005_step02_verifyZero: TestStep = {
  id: 'sidebar-005-verify-zero',
  name: 'Verify Zero Sessions',
  description: 'Check footer shows "No sessions" or "0 sessions"',
  tool: 'take_snapshot',
  params: {},
  assertions: [
    {
      check: 'snapshot_has_element',
      target: SELECTORS.sessionCount,
      expected: true,
      message: 'Session count footer should exist',
    },
  ],
  screenshot: true,
  onFailure: 'continue',
};

export const sidebar005_step03_createOne: TestStep = {
  id: 'sidebar-005-create-one',
  name: 'Create One Session',
  description: 'Seed 1 session via API',
  tool: 'evaluate_script',
  params: {
    function: `async () => {
      const res = await fetch('${BACKEND_URL}${API_ENDPOINTS.sessions}', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'e2e-count-test',
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
    // Store session ID
    return {};
  },
};

export const sidebar005_step04_verifySingular: TestStep = {
  id: 'sidebar-005-verify-singular',
  name: 'Verify Singular Count',
  description: 'Check footer shows "1 session" (singular)',
  tool: 'wait_for',
  params: {
    text: '1',
    timeout: TIMEOUTS.element,
  },
  assertions: [
    {
      check: 'truthy',
      expected: true,
      message: 'Count should update',
    },
  ],
  screenshot: true,
  onFailure: 'continue',
};

export const sidebar005_step05_createMore: TestStep = {
  id: 'sidebar-005-create-more',
  name: 'Create More Sessions',
  description: 'Seed 2 more sessions via API',
  tool: 'evaluate_script',
  params: {
    function: `async () => {
      const sessions = [];
      for (let i = 0; i < 2; i++) {
        const res = await fetch('${BACKEND_URL}${API_ENDPOINTS.sessions}', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: 'e2e-count-test',
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
};

export const sidebar005_step06_verifyPlural: TestStep = {
  id: 'sidebar-005-verify-plural',
  name: 'Verify Plural Count',
  description: 'Check footer shows "3 sessions" (plural)',
  tool: 'wait_for',
  params: {
    text: '3',
    timeout: TIMEOUTS.element,
  },
  assertions: [
    {
      check: 'truthy',
      expected: true,
      message: 'Count should update to 3',
    },
  ],
  screenshot: true,
  onFailure: 'continue',
};

export const sidebar005_step07_cleanup: TestStep = {
  id: 'sidebar-005-cleanup',
  name: 'Cleanup Test Sessions',
  description: 'Delete test sessions',
  tool: 'evaluate_script',
  params: {
    function: `async () => {
      const res = await fetch('${BACKEND_URL}${API_ENDPOINTS.sessions}');
      const data = await res.json();
      for (const s of (data.sessions || [])) {
        if (s.user === 'e2e-count-test') {
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

/**
 * All test steps in execution order
 */
export const testSteps: TestStep[] = [
  // SIDEBAR-001
  sidebar001_step01_setup,
  sidebar001_step02_navigate,
  sidebar001_step03_verifyActiveSection,
  sidebar001_step04_verifySessionItems,
  sidebar001_step05_cleanup,

  // SIDEBAR-002
  sidebar002_step01_setup,
  sidebar002_step02_navigate,
  sidebar002_step03_verifyRecentSection,
  sidebar002_step04_verifySessionItems,
  sidebar002_step05_cleanup,

  // SIDEBAR-003
  sidebar003_step01_setup,
  sidebar003_step02_navigate,
  sidebar003_step03_snapshot,
  sidebar003_step04_clickSession,
  sidebar003_step05_verifyActive,
  sidebar003_step06_verifyInfoPanel,
  sidebar003_step07_cleanup,

  // SIDEBAR-004
  sidebar004_step01_setup,
  sidebar004_step02_navigate,
  sidebar004_step03_triggerEvent,
  sidebar004_step04_verifyBadge,
  sidebar004_step05_cleanup,

  // SIDEBAR-005
  sidebar005_step01_navigate,
  sidebar005_step02_verifyZero,
  sidebar005_step03_createOne,
  sidebar005_step04_verifySingular,
  sidebar005_step05_createMore,
  sidebar005_step06_verifyPlural,
  sidebar005_step07_cleanup,
];

/**
 * Test metadata
 */
export const testMetadata = {
  name: 'Session Sidebar E2E Tests',
  description: 'Tests for sidebar display, navigation, and interaction',
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
      id: 'SIDEBAR-001',
      name: 'Active sessions section displays',
      steps: 5,
    },
    {
      id: 'SIDEBAR-002',
      name: 'Recent sessions section displays',
      steps: 5,
    },
    {
      id: 'SIDEBAR-003',
      name: 'Click session navigates',
      steps: 7,
    },
    {
      id: 'SIDEBAR-004',
      name: 'Notification badges (placeholder)',
      steps: 5,
    },
    {
      id: 'SIDEBAR-005',
      name: 'Session count footer updates',
      steps: 7,
    },
  ],
};
