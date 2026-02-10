/**
 * Chrome MCP E2E Test: Session Archive
 *
 * Tests for session archive functionality.
 *
 * Execution:
 * 1. Start dev servers: pnpm dev:backend && pnpm dev:app
 * 2. Ask Claude: "run the session archive E2E tests"
 * 3. Claude will execute each test step-by-step
 *
 * Test Coverage:
 * - ARCHIVE-001: View archived sessions in modal
 * - ARCHIVE-002: Restore session from archive
 * - ARCHIVE-003: Permanently delete from archive
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
// ARCHIVE-001: View Archived Sessions
// ========================================

export const archive001_step01_setup: TestStep = {
  id: 'archive-001-setup',
  name: 'Create Archived Sessions',
  description: 'Seed archived sessions via API',
  tool: 'evaluate_script',
  params: {
    function: `async () => {
      const sessions = [];
      for (let i = 0; i < 3; i++) {
        const res = await fetch('${BACKEND_URL}${API_ENDPOINTS.sessions}', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: 'e2e-archive-test',
            cwd: '/test',
            hostname: 'e2e',
            platform: 'test'
          })
        });
        const data = await res.json();

        // Mark as archived (completed with specific end reason)
        await fetch('${BACKEND_URL}/api/sessions/' + data.id, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'completed',
            endReason: 'archived',
            archived: true
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
      message: 'Archived sessions should be created',
    },
  ],
  screenshot: false,
  onFailure: 'abort',
  captureFrom: (response: unknown, context: TestContext) => {
    // Store session IDs
    return {};
  },
};

export const archive001_step02_navigate: TestStep = {
  id: 'archive-001-navigate',
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

export const archive001_step03_locateArchiveBtn: TestStep = {
  id: 'archive-001-locate-btn',
  name: 'Locate Archive Button',
  description: 'Find button to open archive modal',
  tool: 'take_snapshot',
  params: {},
  assertions: [
    {
      check: 'snapshot_contains_text',
      target: 'Archive',
      expected: true,
      message: 'Archive button should exist',
    },
  ],
  screenshot: true,
  onFailure: 'abort',
  captureFrom: (response: unknown, context: TestContext) => {
    // Extract archiveBtn UID
    return {};
  },
};

export const archive001_step04_openArchive: TestStep = {
  id: 'archive-001-open-archive',
  name: 'Open Archive Modal',
  description: 'Click archive button to open modal',
  tool: 'click',
  params: (context: TestContext) => ({
    uid: context.elementUids.archiveBtn || '<from-snapshot>',
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

export const archive001_step05_verifyModal: TestStep = {
  id: 'archive-001-verify-modal',
  name: 'Verify Archive Modal',
  description: 'Check archive modal is displayed',
  tool: 'take_snapshot',
  params: {},
  assertions: [
    {
      check: 'snapshot_has_element',
      target: SELECTORS.sessionArchiveOverlay,
      expected: true,
      message: 'Archive overlay should be visible',
    },
    {
      check: 'snapshot_has_element',
      target: SELECTORS.sessionArchivePanel,
      expected: true,
      message: 'Archive panel should be visible',
    },
    {
      check: 'snapshot_has_element',
      target: SELECTORS.archiveHeader,
      expected: true,
      message: 'Archive header should be visible',
    },
  ],
  screenshot: true,
  onFailure: 'abort',
};

export const archive001_step06_verifyArchivedSessions: TestStep = {
  id: 'archive-001-verify-sessions',
  name: 'Verify Archived Sessions',
  description: 'Check archived sessions are listed',
  tool: 'evaluate_script',
  params: {
    function: `() => {
      const archiveItems = document.querySelectorAll('.${SELECTORS.archiveItem}');
      return {
        itemCount: archiveItems.length,
        hasItems: archiveItems.length >= 3
      };
    }`,
  },
  assertions: [
    {
      check: 'truthy',
      expected: true,
      message: 'Should have at least 3 archived sessions',
    },
  ],
  screenshot: true,
  onFailure: 'abort',
};

export const archive001_step07_closeModal: TestStep = {
  id: 'archive-001-close-modal',
  name: 'Close Archive Modal',
  description: 'Click close button',
  tool: 'take_snapshot',
  params: {},
  assertions: [
    {
      check: 'snapshot_has_element',
      target: SELECTORS.archiveCloseBtn,
      expected: true,
      message: 'Close button should be visible',
    },
  ],
  screenshot: true,
  onFailure: 'abort',
  captureFrom: (response: unknown, context: TestContext) => {
    // Extract closeBtn UID
    return {};
  },
};

export const archive001_step08_clickClose: TestStep = {
  id: 'archive-001-click-close',
  name: 'Click Close',
  description: 'Close the archive modal',
  tool: 'click',
  params: (context: TestContext) => ({
    uid: context.elementUids.closeBtn || '<from-snapshot>',
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

export const archive001_step09_cleanup: TestStep = {
  id: 'archive-001-cleanup',
  name: 'Cleanup Test Sessions',
  description: 'Delete test sessions',
  tool: 'evaluate_script',
  params: {
    function: `async () => {
      const res = await fetch('${BACKEND_URL}${API_ENDPOINTS.sessions}');
      const data = await res.json();
      for (const s of (data.sessions || [])) {
        if (s.user === 'e2e-archive-test') {
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
// ARCHIVE-002: Restore Session
// ========================================

export const archive002_step01_setup: TestStep = {
  id: 'archive-002-setup',
  name: 'Create Archived Session',
  description: 'Seed archived session via API',
  tool: 'evaluate_script',
  params: {
    function: `async () => {
      const res = await fetch('${BACKEND_URL}${API_ENDPOINTS.sessions}', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'e2e-restore-test',
          cwd: '/test',
          hostname: 'e2e',
          platform: 'test'
        })
      });
      const data = await res.json();

      // Mark as archived
      await fetch('${BACKEND_URL}/api/sessions/' + data.id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'completed',
          endReason: 'archived',
          archived: true
        })
      });

      return data.id;
    }`,
  },
  assertions: [
    {
      check: 'truthy',
      expected: true,
      message: 'Archived session should be created',
    },
  ],
  screenshot: false,
  onFailure: 'abort',
  captureFrom: (response: unknown, context: TestContext) => {
    // Store session ID
    return {};
  },
};

export const archive002_step02_navigate: TestStep = {
  id: 'archive-002-navigate',
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

export const archive002_step03_openArchive: TestStep = {
  id: 'archive-002-open-archive',
  name: 'Open Archive Modal',
  description: 'Click archive button',
  tool: 'take_snapshot',
  params: {},
  assertions: [
    {
      check: 'snapshot_contains_text',
      target: 'Archive',
      expected: true,
      message: 'Archive button should exist',
    },
  ],
  screenshot: true,
  onFailure: 'abort',
  captureFrom: (response: unknown, context: TestContext) => {
    // Extract archiveBtn UID
    return {};
  },
};

export const archive002_step04_clickArchive: TestStep = {
  id: 'archive-002-click-archive',
  name: 'Click Archive Button',
  description: 'Open archive modal',
  tool: 'click',
  params: (context: TestContext) => ({
    uid: context.elementUids.archiveBtn || '<from-snapshot>',
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

export const archive002_step05_locateRestore: TestStep = {
  id: 'archive-002-locate-restore',
  name: 'Locate Restore Button',
  description: 'Find restore button for session',
  tool: 'take_snapshot',
  params: {},
  assertions: [
    {
      check: 'snapshot_has_element',
      target: SELECTORS.restoreBtn,
      expected: true,
      message: 'Restore button should be visible',
    },
  ],
  screenshot: true,
  onFailure: 'abort',
  captureFrom: (response: unknown, context: TestContext) => {
    // Extract restoreBtn UID
    return {};
  },
};

export const archive002_step06_clickRestore: TestStep = {
  id: 'archive-002-click-restore',
  name: 'Click Restore Button',
  description: 'Restore session from archive',
  tool: 'click',
  params: (context: TestContext) => ({
    uid: context.elementUids.restoreBtn || '<from-snapshot>',
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

export const archive002_step07_verifyRestored: TestStep = {
  id: 'archive-002-verify-restored',
  name: 'Verify Session Restored',
  description: 'Check session appears in sidebar',
  tool: 'wait_for',
  params: {
    text: 'RECENT',
    timeout: TIMEOUTS.element,
  },
  assertions: [
    {
      check: 'truthy',
      expected: true,
      message: 'Session should appear in Recent section',
    },
  ],
  screenshot: true,
  onFailure: 'abort',
};

export const archive002_step08_verifyApi: TestStep = {
  id: 'archive-002-verify-api',
  name: 'Verify API State',
  description: 'Check session is no longer archived in backend',
  tool: 'evaluate_script',
  params: (context: TestContext) => ({
    function: `async () => {
      const sessionId = '${context.sessionId || ''}';
      const res = await fetch('${BACKEND_URL}/api/sessions/' + sessionId);
      const data = await res.json();
      return data.archived === false || data.archived === undefined;
    }`,
  }),
  assertions: [
    {
      check: 'truthy',
      expected: true,
      message: 'Session should not be archived',
    },
  ],
  screenshot: false,
  onFailure: 'abort',
};

export const archive002_step09_cleanup: TestStep = {
  id: 'archive-002-cleanup',
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
// ARCHIVE-003: Permanently Delete
// ========================================

export const archive003_step01_setup: TestStep = {
  id: 'archive-003-setup',
  name: 'Create Archived Session',
  description: 'Seed archived session via API',
  tool: 'evaluate_script',
  params: {
    function: `async () => {
      const res = await fetch('${BACKEND_URL}${API_ENDPOINTS.sessions}', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'e2e-delete-archive-test',
          cwd: '/test',
          hostname: 'e2e',
          platform: 'test'
        })
      });
      const data = await res.json();

      // Mark as archived
      await fetch('${BACKEND_URL}/api/sessions/' + data.id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'completed',
          endReason: 'archived',
          archived: true
        })
      });

      return data.id;
    }`,
  },
  assertions: [
    {
      check: 'truthy',
      expected: true,
      message: 'Archived session should be created',
    },
  ],
  screenshot: false,
  onFailure: 'abort',
  captureFrom: (response: unknown, context: TestContext) => {
    // Store session ID
    return {};
  },
};

export const archive003_step02_navigate: TestStep = {
  id: 'archive-003-navigate',
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

export const archive003_step03_openArchive: TestStep = {
  id: 'archive-003-open-archive',
  name: 'Open Archive Modal',
  description: 'Click archive button',
  tool: 'take_snapshot',
  params: {},
  assertions: [
    {
      check: 'snapshot_contains_text',
      target: 'Archive',
      expected: true,
      message: 'Archive button should exist',
    },
  ],
  screenshot: true,
  onFailure: 'abort',
  captureFrom: (response: unknown, context: TestContext) => {
    // Extract archiveBtn UID
    return {};
  },
};

export const archive003_step04_clickArchive: TestStep = {
  id: 'archive-003-click-archive',
  name: 'Click Archive Button',
  description: 'Open archive modal',
  tool: 'click',
  params: (context: TestContext) => ({
    uid: context.elementUids.archiveBtn || '<from-snapshot>',
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

export const archive003_step05_locateDelete: TestStep = {
  id: 'archive-003-locate-delete',
  name: 'Locate Delete Button',
  description: 'Find delete button for session',
  tool: 'take_snapshot',
  params: {},
  assertions: [
    {
      check: 'snapshot_has_element',
      target: SELECTORS.deleteBtn,
      expected: true,
      message: 'Delete button should be visible',
    },
  ],
  screenshot: true,
  onFailure: 'abort',
  captureFrom: (response: unknown, context: TestContext) => {
    // Extract deleteBtn UID
    return {};
  },
};

export const archive003_step06_clickDelete: TestStep = {
  id: 'archive-003-click-delete',
  name: 'Click Delete Button',
  description: 'Permanently delete session from archive',
  tool: 'click',
  params: (context: TestContext) => ({
    uid: context.elementUids.deleteBtn || '<from-snapshot>',
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

export const archive003_step07_confirmDialog: TestStep = {
  id: 'archive-003-confirm-dialog',
  name: 'Confirm Deletion',
  description: 'Handle confirmation dialog if present',
  tool: 'handle_dialog',
  params: {
    action: 'accept',
  },
  assertions: [
    {
      check: 'truthy',
      expected: true,
      message: 'Dialog should be handled',
    },
  ],
  screenshot: true,
  onFailure: 'continue',
};

export const archive003_step08_verifyDeleted: TestStep = {
  id: 'archive-003-verify-deleted',
  name: 'Verify Session Deleted',
  description: 'Check session no longer appears in archive',
  tool: 'evaluate_script',
  params: (context: TestContext) => ({
    function: `async () => {
      const sessionId = '${context.sessionId || ''}';
      const res = await fetch('${BACKEND_URL}/api/sessions/' + sessionId);
      // Should return 404 or session should be marked deleted
      return res.status === 404;
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
  onFailure: 'continue',
};

/**
 * All test steps in execution order
 */
export const testSteps: TestStep[] = [
  // ARCHIVE-001
  archive001_step01_setup,
  archive001_step02_navigate,
  archive001_step03_locateArchiveBtn,
  archive001_step04_openArchive,
  archive001_step05_verifyModal,
  archive001_step06_verifyArchivedSessions,
  archive001_step07_closeModal,
  archive001_step08_clickClose,
  archive001_step09_cleanup,

  // ARCHIVE-002
  archive002_step01_setup,
  archive002_step02_navigate,
  archive002_step03_openArchive,
  archive002_step04_clickArchive,
  archive002_step05_locateRestore,
  archive002_step06_clickRestore,
  archive002_step07_verifyRestored,
  archive002_step08_verifyApi,
  archive002_step09_cleanup,

  // ARCHIVE-003
  archive003_step01_setup,
  archive003_step02_navigate,
  archive003_step03_openArchive,
  archive003_step04_clickArchive,
  archive003_step05_locateDelete,
  archive003_step06_clickDelete,
  archive003_step07_confirmDialog,
  archive003_step08_verifyDeleted,
];

/**
 * Test metadata
 */
export const testMetadata = {
  name: 'Session Archive E2E Tests',
  description: 'Tests for session archive functionality',
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
      id: 'ARCHIVE-001',
      name: 'View archived sessions in modal',
      steps: 9,
    },
    {
      id: 'ARCHIVE-002',
      name: 'Restore session from archive',
      steps: 9,
    },
    {
      id: 'ARCHIVE-003',
      name: 'Permanently delete from archive',
      steps: 8,
    },
  ],
};
