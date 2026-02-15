/**
 * Playwright E2E Test: Chain Execution
 *
 * Tests for chain compilation, step execution, and state progression.
 *
 * Execution:
 * 1. Start dev servers: pnpm dev:backend && pnpm dev:app
 * 2. Ask Claude: "run the Playwright chain execution E2E tests"
 * 3. Claude will load Playwright MCP tools and execute each test step-by-step
 *
 * Test Coverage:
 * - CHAIN-001: Chain compilation from user request
 * - CHAIN-002: Step execution and status updates
 * - CHAIN-003: Chain completion and results
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
  api: 3000,
  chainExecution: 15000, // Longer timeout for chain execution
};

// ========================================
// CHAIN-001: Chain Compilation
// ========================================

export const chain001_compilation = {
  name: 'CHAIN-001: Chain Compilation',
  description: 'Test chain compilation from user request',
  prerequisites: ['backend:3001', 'frontend:5173'],
  steps: [
    {
      name: 'Create test session',
      tool: 'browser_evaluate',
      params: {
        script: `
          const res = await fetch('${BACKEND_URL}/api/sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: 'e2e-chain-test',
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
      name: 'Create chain via API',
      tool: 'browser_evaluate',
      params: {
        script: `
          const sessionId = context.sessionId;
          const res = await fetch('${BACKEND_URL}/api/chains', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId: sessionId,
              request: 'Test chain execution'
            })
          });
          const data = await res.json();
          return data.id;
        `,
      },
      expect: { returns_value: true },
      screenshot: false,
      onFailure: 'abort',
      captureData: ['chainId'],
    },
    {
      name: 'Verify chain appears in UI',
      tool: 'browser_wait_for',
      params: {
        condition: 'text',
        value: 'Chain',
        timeout: TIMEOUTS.action,
      },
      expect: { found: true },
      screenshot: true,
      onFailure: 'abort',
    },
    {
      name: 'Take snapshot to verify chain details',
      tool: 'browser_snapshot',
      params: {},
      expect: { contains: ['Chain', 'Step'] },
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
// CHAIN-002: Step Execution
// ========================================

export const chain002_stepExecution = {
  name: 'CHAIN-002: Step Execution',
  description: 'Test step-by-step chain execution and status updates',
  prerequisites: ['backend:3001', 'frontend:5173'],
  steps: [
    {
      name: 'Create test session',
      tool: 'browser_evaluate',
      params: {
        script: `
          const res = await fetch('${BACKEND_URL}/api/sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: 'e2e-step-test',
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
      name: 'Create chain with steps',
      tool: 'browser_evaluate',
      params: {
        script: `
          const sessionId = context.sessionId;
          const res = await fetch('${BACKEND_URL}/api/chains', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId: sessionId,
              request: 'Multi-step test chain',
              steps: [
                { id: 'step-1', action: 'analyze', status: 'pending' },
                { id: 'step-2', action: 'code', status: 'pending' },
                { id: 'step-3', action: 'review', status: 'pending' }
              ]
            })
          });
          const data = await res.json();
          return data.id;
        `,
      },
      expect: { returns_value: true },
      screenshot: false,
      onFailure: 'abort',
      captureData: ['chainId'],
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
      name: 'Start step execution',
      tool: 'browser_evaluate',
      params: {
        script: `
          const chainId = context.chainId;
          const res = await fetch('${BACKEND_URL}/api/chains/' + chainId + '/steps/step-1', {
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
      name: 'Verify step status in UI',
      tool: 'browser_wait_for',
      params: {
        condition: 'text',
        value: 'in_progress',
        timeout: TIMEOUTS.action,
      },
      expect: { found: true },
      screenshot: true,
      onFailure: 'continue',
    },
    {
      name: 'Complete step',
      tool: 'browser_evaluate',
      params: {
        script: `
          const chainId = context.chainId;
          const res = await fetch('${BACKEND_URL}/api/chains/' + chainId + '/steps/step-1', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'completed' })
          });
          return res.ok;
        `,
      },
      expect: { returns_true: true },
      screenshot: false,
      onFailure: 'abort',
    },
    {
      name: 'Verify step completion in UI',
      tool: 'browser_snapshot',
      params: {},
      expect: { contains: ['completed'] },
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
// CHAIN-003: Chain Completion
// ========================================

export const chain003_completion = {
  name: 'CHAIN-003: Chain Completion',
  description: 'Test chain completion and results display',
  prerequisites: ['backend:3001', 'frontend:5173'],
  steps: [
    {
      name: 'Create test session',
      tool: 'browser_evaluate',
      params: {
        script: `
          const res = await fetch('${BACKEND_URL}/api/sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: 'e2e-completion-test',
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
      name: 'Create and complete chain',
      tool: 'browser_evaluate',
      params: {
        script: `
          const sessionId = context.sessionId;
          const res = await fetch('${BACKEND_URL}/api/chains', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId: sessionId,
              request: 'Quick test chain',
              steps: [
                { id: 'step-1', action: 'analyze', status: 'completed' }
              ],
              status: 'completed'
            })
          });
          const data = await res.json();
          return data.id;
        `,
      },
      expect: { returns_value: true },
      screenshot: false,
      onFailure: 'abort',
      captureData: ['chainId'],
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
      name: 'Verify chain completion in UI',
      tool: 'browser_wait_for',
      params: {
        condition: 'text',
        value: 'completed',
        timeout: TIMEOUTS.action,
      },
      expect: { found: true },
      screenshot: true,
      onFailure: 'continue',
    },
    {
      name: 'Take snapshot to verify results',
      tool: 'browser_snapshot',
      params: {},
      expect: { contains: ['Chain', 'completed'] },
      screenshot: true,
      onFailure: 'continue',
    },
    {
      name: 'Verify chain results via API',
      tool: 'browser_evaluate',
      params: {
        script: `
          const chainId = context.chainId;
          const res = await fetch('${BACKEND_URL}/api/chains/' + chainId);
          const data = await res.json();
          return data.status === 'completed' && data.steps.length > 0;
        `,
      },
      expect: { returns_true: true },
      screenshot: false,
      onFailure: 'abort',
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
  name: 'Chain Execution E2E Tests (Playwright)',
  description: 'Tests for chain compilation, step execution, and completion using Playwright MCP',
  version: '1.0.0',
  prerequisites: [
    'Backend running on localhost:3001',
    'Frontend running on localhost:5173',
    'Playwright MCP server available',
  ],
  tests: [
    chain001_compilation,
    chain002_stepExecution,
    chain003_completion,
  ],
  estimatedDuration: '90-120 seconds',
};
