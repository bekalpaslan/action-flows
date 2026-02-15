/**
 * Playwright E2E Test: Session Lifecycle
 *
 * Tests for session creation, status updates, and deletion.
 *
 * Execution:
 * 1. Start dev servers: pnpm dev:backend && pnpm dev:app
 * 2. Ask Claude: "run the Playwright session lifecycle E2E tests"
 * 3. Claude will load Playwright MCP tools and execute each test step-by-step
 *
 * Test Coverage:
 * - LIFECYCLE-001: Create new session via UI button
 * - LIFECYCLE-002: Session status progression (pending → in_progress → completed)
 * - LIFECYCLE-003: Delete session via UI interaction
 *
 * Prerequisites:
 * - Backend running on localhost:3001
 * - Frontend running on localhost:5173
 * - Playwright MCP server available
 */

// ========================================
// Test Configuration
// ========================================

export const BACKEND_URL = 'http://localhost:3001';
export const FRONTEND_URL = 'http://localhost:5173';

export const TIMEOUTS = {
  navigation: 10000, // 10s for page load
  action: 5000,      // 5s for UI interactions
  api: 3000,         // 3s for API calls
};

// ========================================
// LIFECYCLE-001: Create New Session
// ========================================

export const lifecycle001_createSession = {
  name: 'LIFECYCLE-001: Create New Session',
  description: 'Test session creation via UI button click',
  prerequisites: ['backend:3001', 'frontend:5173'],
  steps: [
    {
      name: 'Navigate to frontend',
      tool: 'browser_navigate',
      params: {
        url: FRONTEND_URL,
        timeout: TIMEOUTS.navigation,
      },
      expect: { url: FRONTEND_URL },
      screenshot: true,
      onFailure: 'abort',
    },
    {
      name: 'Take initial snapshot',
      tool: 'browser_snapshot',
      params: {},
      expect: { contains: ['Sessions', 'Cosmic Map'] },
      screenshot: true,
      onFailure: 'abort',
      captureRefs: ['newSessionButton'], // Extract element ref for "New Session" button
    },
    {
      name: 'Click New Session button',
      tool: 'browser_click',
      params: { element: 'newSessionButton' }, // Uses ref from snapshot
      expect: { action_succeeded: true },
      screenshot: true,
      onFailure: 'abort',
    },
    {
      name: 'Wait for session creation',
      tool: 'browser_wait_for',
      params: {
        condition: 'text',
        value: 'Session',
        timeout: TIMEOUTS.action,
      },
      expect: { found: true },
      screenshot: true,
      onFailure: 'abort',
    },
    {
      name: 'Verify session in sidebar',
      tool: 'browser_snapshot',
      params: {},
      expect: { contains: ['RECENT', 'Session'] },
      screenshot: true,
      onFailure: 'abort',
      captureRefs: ['sessionItem'], // Extract session item ref for later tests
    },
    {
      name: 'Extract session ID from network',
      tool: 'browser_network_requests',
      params: {
        method: 'POST',
        url_pattern: '/api/sessions',
      },
      expect: { request_found: true, status: 201 },
      screenshot: false,
      onFailure: 'abort',
      captureData: ['sessionId'], // Extract session ID from response
    },
  ],
  cleanup: [
    {
      name: 'Delete test session',
      tool: 'browser_evaluate',
      params: {
        script: `
          const sessionId = context.sessionId;
          if (sessionId) {
            fetch('${BACKEND_URL}/api/sessions/' + sessionId, { method: 'DELETE' });
          }
        `,
      },
    },
  ],
};

// ========================================
// LIFECYCLE-002: Session Status Progression
// ========================================

export const lifecycle002_statusProgression = {
  name: 'LIFECYCLE-002: Session Status Progression',
  description: 'Test session status updates (pending → in_progress → completed)',
  prerequisites: ['backend:3001', 'frontend:5173'],
  steps: [
    {
      name: 'Create test session via API',
      tool: 'browser_evaluate',
      params: {
        script: `
          const res = await fetch('${BACKEND_URL}/api/sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: 'e2e-playwright-test',
              cwd: '/test',
              hostname: 'playwright',
              platform: 'test'
            })
          });
          const data = await res.json();
          return data.id;
        `,
      },
      expect: { returns_value: true },
      screenshot: false,
      onFailure: 'abort',
      captureData: ['sessionId'],
    },
    {
      name: 'Navigate to frontend',
      tool: 'browser_navigate',
      params: {
        url: FRONTEND_URL,
        timeout: TIMEOUTS.navigation,
      },
      expect: { url: FRONTEND_URL },
      screenshot: true,
      onFailure: 'abort',
    },
    {
      name: 'Verify session in RECENT section (pending status)',
      tool: 'browser_snapshot',
      params: {},
      expect: { contains: ['RECENT'] },
      screenshot: true,
      onFailure: 'abort',
    },
    {
      name: 'Update session to in_progress',
      tool: 'browser_evaluate',
      params: {
        script: `
          const sessionId = context.sessionId;
          const res = await fetch('${BACKEND_URL}/api/sessions/' + sessionId, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'in_progress' })
          });
          return res.ok;
        `,
      },
      expect: { returns_true: true },
      screenshot: false,
      onFailure: 'abort',
    },
    {
      name: 'Reload page',
      tool: 'browser_navigate',
      params: {
        url: FRONTEND_URL,
        timeout: TIMEOUTS.navigation,
      },
      expect: { url: FRONTEND_URL },
      screenshot: true,
      onFailure: 'abort',
    },
    {
      name: 'Verify session moved to ACTIVE section',
      tool: 'browser_snapshot',
      params: {},
      expect: { contains: ['ACTIVE'] },
      screenshot: true,
      onFailure: 'abort',
    },
    {
      name: 'Update session to completed',
      tool: 'browser_evaluate',
      params: {
        script: `
          const sessionId = context.sessionId;
          const res = await fetch('${BACKEND_URL}/api/sessions/' + sessionId, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'completed', endReason: 'test-complete' })
          });
          return res.ok;
        `,
      },
      expect: { returns_true: true },
      screenshot: false,
      onFailure: 'abort',
    },
    {
      name: 'Reload page',
      tool: 'browser_navigate',
      params: {
        url: FRONTEND_URL,
        timeout: TIMEOUTS.navigation,
      },
      expect: { url: FRONTEND_URL },
      screenshot: true,
      onFailure: 'abort',
    },
    {
      name: 'Verify session in RECENT section (completed status)',
      tool: 'browser_snapshot',
      params: {},
      expect: { contains: ['RECENT'] },
      screenshot: true,
      onFailure: 'continue',
    },
  ],
  cleanup: [
    {
      name: 'Delete test session',
      tool: 'browser_evaluate',
      params: {
        script: `
          const sessionId = context.sessionId;
          if (sessionId) {
            fetch('${BACKEND_URL}/api/sessions/' + sessionId, { method: 'DELETE' });
          }
        `,
      },
    },
  ],
};

// ========================================
// LIFECYCLE-003: Delete Session
// ========================================

export const lifecycle003_deleteSession = {
  name: 'LIFECYCLE-003: Delete Session',
  description: 'Test session deletion via UI interaction',
  prerequisites: ['backend:3001', 'frontend:5173'],
  steps: [
    {
      name: 'Create test session via API',
      tool: 'browser_evaluate',
      params: {
        script: `
          const res = await fetch('${BACKEND_URL}/api/sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: 'e2e-delete-test',
              cwd: '/test',
              hostname: 'playwright',
              platform: 'test'
            })
          });
          const data = await res.json();
          return data.id;
        `,
      },
      expect: { returns_value: true },
      screenshot: false,
      onFailure: 'abort',
      captureData: ['sessionId'],
    },
    {
      name: 'Navigate to frontend',
      tool: 'browser_navigate',
      params: {
        url: FRONTEND_URL,
        timeout: TIMEOUTS.navigation,
      },
      expect: { url: FRONTEND_URL },
      screenshot: true,
      onFailure: 'abort',
    },
    {
      name: 'Locate session item in sidebar',
      tool: 'browser_snapshot',
      params: {},
      expect: { contains: ['Session'] },
      screenshot: true,
      onFailure: 'abort',
      captureRefs: ['sessionItem'],
    },
    {
      name: 'Hover over session item',
      tool: 'browser_hover',
      params: { element: 'sessionItem' },
      expect: { action_succeeded: true },
      screenshot: true,
      onFailure: 'abort',
    },
    {
      name: 'Take snapshot to find delete button',
      tool: 'browser_snapshot',
      params: {},
      expect: { contains: ['Delete', '×'] },
      screenshot: true,
      onFailure: 'abort',
      captureRefs: ['deleteButton'],
    },
    {
      name: 'Click delete button',
      tool: 'browser_click',
      params: { element: 'deleteButton' },
      expect: { action_succeeded: true },
      screenshot: true,
      onFailure: 'abort',
    },
    {
      name: 'Verify session removed',
      tool: 'browser_evaluate',
      params: {
        script: `
          const sessionId = context.sessionId;
          const res = await fetch('${BACKEND_URL}/api/sessions/' + sessionId);
          return res.status === 404 || (await res.json()).status === 'deleted';
        `,
      },
      expect: { returns_true: true },
      screenshot: true,
      onFailure: 'abort',
    },
  ],
  cleanup: [], // Session already deleted in test
};

// ========================================
// Test Metadata
// ========================================

export const testMetadata = {
  name: 'Session Lifecycle E2E Tests (Playwright)',
  description: 'Tests for session creation, status progression, and deletion using Playwright MCP',
  version: '1.0.0',
  prerequisites: [
    'Backend running on localhost:3001',
    'Frontend running on localhost:5173',
    'Playwright MCP server available',
  ],
  tests: [
    lifecycle001_createSession,
    lifecycle002_statusProgression,
    lifecycle003_deleteSession,
  ],
  estimatedDuration: '60-90 seconds',
};
