/**
 * Playwright E2E Test: Cosmic Map Navigation
 *
 * Tests for cosmic map visualization, navigation, and interactions.
 *
 * Execution:
 * 1. Start dev servers: pnpm dev:backend && pnpm dev:app
 * 2. Ask Claude: "run the Playwright cosmic map E2E tests"
 * 3. Claude will load Playwright MCP tools and execute each test step-by-step
 *
 * Test Coverage:
 * - MAP-001: Cosmic map initial render and layout
 * - MAP-002: Node selection and detail view
 * - MAP-003: Zoom and pan interactions
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
  navigation: 10000,
  action: 5000,
  render: 8000, // Longer timeout for ReactFlow rendering
};

// ========================================
// MAP-001: Cosmic Map Render
// ========================================

export const map001_render = {
  name: 'MAP-001: Cosmic Map Render',
  description: 'Test cosmic map initial rendering and layout',
  prerequisites: ['backend:3001', 'frontend:5173'],
  steps: [
    {
      name: 'Create test session with chain',
      tool: 'browser_evaluate',
      params: {
        script: `
          // Create session
          const sessionRes = await fetch('${BACKEND_URL}/api/sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: 'e2e-map-test',
              cwd: '/test',
              hostname: 'playwright',
              platform: 'test'
            })
          });
          const session = await sessionRes.json();

          // Create chain with steps
          const chainRes = await fetch('${BACKEND_URL}/api/chains', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId: session.id,
              request: 'Test cosmic map',
              steps: [
                { id: 'step-1', action: 'analyze', status: 'completed' },
                { id: 'step-2', action: 'code', status: 'in_progress' },
                { id: 'step-3', action: 'review', status: 'pending' }
              ]
            })
          });
          const chain = await chainRes.json();

          return { sessionId: session.id, chainId: chain.id };
        `,
      },
      expect: { returns_value: true },
      screenshot: false,
      onFailure: 'abort',
      captureData: ['sessionId', 'chainId'],
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
      name: 'Wait for cosmic map to render',
      tool: 'browser_wait_for',
      params: {
        condition: 'selector',
        value: '.react-flow',
        timeout: TIMEOUTS.render,
      },
      expect: { found: true },
      screenshot: true,
      onFailure: 'abort',
    },
    {
      name: 'Take snapshot to verify map elements',
      tool: 'browser_snapshot',
      params: {},
      expect: { contains: ['Cosmic Map', 'Chain'] },
      screenshot: true,
      onFailure: 'continue',
    },
    {
      name: 'Verify nodes rendered',
      tool: 'browser_evaluate',
      params: {
        script: `
          const nodes = document.querySelectorAll('.react-flow__node');
          return nodes.length > 0;
        `,
      },
      expect: { returns_true: true },
      screenshot: true,
      onFailure: 'abort',
    },
    {
      name: 'Verify edges rendered',
      tool: 'browser_evaluate',
      params: {
        script: `
          const edges = document.querySelectorAll('.react-flow__edge');
          return edges.length > 0;
        `,
      },
      expect: { returns_true: true },
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
// MAP-002: Node Selection
// ========================================

export const map002_nodeSelection = {
  name: 'MAP-002: Node Selection',
  description: 'Test node selection and detail view',
  prerequisites: ['backend:3001', 'frontend:5173'],
  steps: [
    {
      name: 'Create test session with chain',
      tool: 'browser_evaluate',
      params: {
        script: `
          const sessionRes = await fetch('${BACKEND_URL}/api/sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: 'e2e-node-test',
              cwd: '/test',
              hostname: 'playwright',
              platform: 'test'
            })
          });
          const session = await sessionRes.json();

          const chainRes = await fetch('${BACKEND_URL}/api/chains', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId: session.id,
              request: 'Test node selection',
              steps: [
                { id: 'step-1', action: 'analyze', status: 'completed', result: 'Analysis complete' }
              ]
            })
          });
          const chain = await chainRes.json();

          return { sessionId: session.id, chainId: chain.id };
        `,
      },
      expect: { returns_value: true },
      screenshot: false,
      onFailure: 'abort',
      captureData: ['sessionId', 'chainId'],
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
      name: 'Wait for cosmic map',
      tool: 'browser_wait_for',
      params: {
        condition: 'selector',
        value: '.react-flow__node',
        timeout: TIMEOUTS.render,
      },
      expect: { found: true },
      screenshot: true,
      onFailure: 'abort',
    },
    {
      name: 'Get first node element',
      tool: 'browser_snapshot',
      params: {},
      expect: { contains: ['analyze', 'step'] },
      screenshot: true,
      onFailure: 'abort',
      captureRefs: ['firstNode'],
    },
    {
      name: 'Click on node',
      tool: 'browser_click',
      params: { element: 'firstNode' },
      expect: { action_succeeded: true },
      screenshot: true,
      onFailure: 'continue',
    },
    {
      name: 'Verify node selection state',
      tool: 'browser_evaluate',
      params: {
        script: `
          const selectedNode = document.querySelector('.react-flow__node.selected');
          return selectedNode !== null;
        `,
      },
      expect: { returns_true: true },
      screenshot: true,
      onFailure: 'continue',
    },
    {
      name: 'Verify detail panel appears',
      tool: 'browser_snapshot',
      params: {},
      expect: { contains: ['Detail', 'Step'] },
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
// MAP-003: Zoom and Pan
// ========================================

export const map003_zoomPan = {
  name: 'MAP-003: Zoom and Pan',
  description: 'Test zoom and pan interactions on cosmic map',
  prerequisites: ['backend:3001', 'frontend:5173'],
  steps: [
    {
      name: 'Create test session with chain',
      tool: 'browser_evaluate',
      params: {
        script: `
          const sessionRes = await fetch('${BACKEND_URL}/api/sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: 'e2e-zoom-test',
              cwd: '/test',
              hostname: 'playwright',
              platform: 'test'
            })
          });
          const session = await sessionRes.json();

          const chainRes = await fetch('${BACKEND_URL}/api/chains', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId: session.id,
              request: 'Test zoom/pan',
              steps: [
                { id: 'step-1', action: 'analyze', status: 'completed' },
                { id: 'step-2', action: 'code', status: 'completed' },
                { id: 'step-3', action: 'review', status: 'completed' }
              ]
            })
          });
          const chain = await chainRes.json();

          return { sessionId: session.id, chainId: chain.id };
        `,
      },
      expect: { returns_value: true },
      screenshot: false,
      onFailure: 'abort',
      captureData: ['sessionId', 'chainId'],
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
      name: 'Wait for cosmic map',
      tool: 'browser_wait_for',
      params: {
        condition: 'selector',
        value: '.react-flow',
        timeout: TIMEOUTS.render,
      },
      expect: { found: true },
      screenshot: true,
      onFailure: 'abort',
    },
    {
      name: 'Get initial viewport state',
      tool: 'browser_evaluate',
      params: {
        script: `
          const viewport = document.querySelector('.react-flow__viewport');
          const transform = viewport ? viewport.style.transform : null;
          return transform;
        `,
      },
      expect: { returns_value: true },
      screenshot: false,
      onFailure: 'abort',
      captureData: ['initialTransform'],
    },
    {
      name: 'Trigger zoom in (keyboard)',
      tool: 'browser_press_key',
      params: { key: '+', modifiers: ['Control'] },
      expect: { action_succeeded: true },
      screenshot: true,
      onFailure: 'continue',
    },
    {
      name: 'Verify zoom changed',
      tool: 'browser_evaluate',
      params: {
        script: `
          const viewport = document.querySelector('.react-flow__viewport');
          const newTransform = viewport ? viewport.style.transform : null;
          const initialTransform = context.initialTransform;
          return newTransform !== initialTransform;
        `,
      },
      expect: { returns_true: true },
      screenshot: true,
      onFailure: 'continue',
    },
    {
      name: 'Take snapshot after zoom',
      tool: 'browser_snapshot',
      params: {},
      expect: { contains: ['Cosmic Map'] },
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
// Test Metadata
// ========================================

export const testMetadata = {
  name: 'Cosmic Map E2E Tests (Playwright)',
  description: 'Tests for cosmic map visualization, navigation, and interactions using Playwright MCP',
  version: '1.0.0',
  prerequisites: [
    'Backend running on localhost:3001',
    'Frontend running on localhost:5173',
    'Playwright MCP server available',
  ],
  tests: [
    map001_render,
    map002_nodeSelection,
    map003_zoomPan,
  ],
  estimatedDuration: '90-120 seconds',
};
