# Testing Patterns

**Analysis Date:** 2026-04-01

## Test Framework

**Runner:**
- Vitest 4.0.0
- Config: `packages/backend/vitest.config.ts` and `packages/app/vitest.config.ts`
- Node environment for backend, happy-dom for frontend

**Assertion Library:**
- Vitest built-in (expect API compatible with Jest)
- `@testing-library/react` for React component testing
- `@testing-library/jest-dom` for DOM matchers

**Run Commands:**
```bash
pnpm test                 # Run all tests (vitest run)
pnpm test:watch          # Watch mode
pnpm -F @afw/backend test                # Backend tests only
pnpm -F @afw/app test                    # Frontend tests only
```

## Test File Organization

**Location:**
- Backend: `packages/backend/src/**/__tests__/` (co-located with source)
- Frontend: `packages/app/src/**/__tests__/` (co-located with source)
- Contract tests: `packages/app/src/__tests__/contracts/` (centralized)

**Naming:**
- `*.test.ts` or `*.spec.ts` suffix
- Example: `errorHandler.test.ts`, `useChatMessages.test.ts`

**Structure:**
```
packages/backend/src/
├── middleware/
│   ├── errorHandler.ts
│   └── __tests__/
│       └── errorHandler.test.ts
├── routes/
│   ├── sessions.ts
│   └── __tests__/
│       └── sessions.test.ts
└── services/
    ├── frequencyTracker.ts
    └── frequencyTracker.test.ts

packages/app/src/
├── hooks/
│   ├── useChatMessages.ts
│   └── __tests__/
│       └── useChatMessages.test.ts
├── components/
│   └── ControlButtons/
│       ├── ControlButtons.tsx
│       └── __tests__/
│           └── ControlButtons.test.ts
└── __tests__/
    ├── setup.ts
    ├── contracts/
    │   ├── contract-completeness.test.ts
    │   ├── contract-css-classes.test.ts
    │   └── ...
    └── __mocks__/
        ├── monaco-config.ts
        ├── monaco-editor.ts
        └── monaco-worker.ts
```

## Test Structure

**Suite Organization (Backend):**
```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { sanitizeError, globalErrorHandler } from '../errorHandler.js';

describe('errorHandler', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    mockReq = { method: 'GET', path: '/api/test' } as any;
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    mockNext = vi.fn();
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('sanitizeError', () => {
    it('should return error message for Error instances', () => {
      const error = new Error('Something went wrong');
      const result = sanitizeError(error);
      expect(result).toBe('Something went wrong');
    });
  });
});
```

**Suite Organization (Frontend/React):**
```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useChatMessages } from '../useChatMessages';
import type { SessionId } from '@afw/shared';

/**
 * useChatMessages Hook Tests (P0)
 *
 * Tests core hook initialization and message state management.
 * Full integration testing with WebSocket server is covered by E2E tests.
 */
describe('useChatMessages Hook', () => {
  const testSessionId = 'test-session-123' as SessionId;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it('should initialize with empty messages', () => {
    const { result } = renderHook(() => useChatMessages(testSessionId));
    expect(result.current.messages).toEqual([]);
  });
});
```

**Patterns:**
- `describe()` blocks organize test suites (often nested by feature/function)
- `beforeEach()` sets up test fixtures (mocks, spies, state)
- `afterEach()` cleans up with `vi.restoreAllMocks()` and `vi.clearAllTimers()`
- `it()` defines individual test case
- Comments above describe blocks document test scope (e.g., "P0 - critical path")

## Mocking

**Framework:** Vitest's `vi` module

**Patterns:**
```typescript
// Mock Express middleware
mockRes = {
  status: vi.fn().mockReturnThis(),
  json: vi.fn().mockReturnThis(),
};

// Mock console methods
const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

// Mock environment variables
vi.stubEnv('NODE_ENV', 'development');
vi.unstubAllEnvs(); // Clean up after

// Mock modules
vi.mock('../../contexts/WebSocketContext', () => ({
  useWebSocketContext: () => mockWebSocketContext,
}));

// Mock functions in hooks
const mockWebSocketContext = {
  status: 'connected' as const,
  error: null,
  send: vi.fn(),
  subscribe: vi.fn(),
  unsubscribe: vi.fn(),
  onEvent: vi.fn((callback: (event: any) => void) => {
    mockEventCallback = callback;
    return vi.fn();
  }),
};
```

**What to Mock:**
- External dependencies (context providers, API calls, WebSocket)
- Browser APIs (window.matchMedia, WebSocket)
- File system operations in backend tests
- Express request/response objects

**What NOT to Mock:**
- Core business logic being tested
- Pure utility functions
- Type definitions or interfaces
- Data structures/models from shared package

## Fixtures and Factories

**Test Data:**
```typescript
// Simple fixture values
const testSessionId = 'test-session-123' as SessionId;

// Destructuring with defaults
const mockReq = {
  method: 'GET',
  path: '/api/test',
} as any;

// Factory patterns for repeated objects
function createMockResponse() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
}
```

**Location:**
- Fixtures defined inline in test files for simple cases
- Mock implementations often at module level (e.g., `mockWebSocketContext`)
- Setup files: `packages/app/src/__tests__/setup.ts`

**Setup File (packages/app/src/__tests__/setup.ts):**
- Global mock implementations: window.matchMedia, WebSocket, import.meta.env
- Test environment configuration via vitest.config.ts `setupFiles` option
- Called before all tests run

## Coverage

**Requirements:** Not enforced (no minimum coverage configured)

**View Coverage:**
```bash
pnpm test:watch    # Run in watch mode with coverage reporter enabled
pnpm test          # Generate coverage reports in coverage/ directory
```

**Configuration:**
- Provider: `v8`
- Reporters: `text`, `json`, `html`
- Excludes: `node_modules/`, `dist/`

**Coverage is tracked but not gated** — no CI/CD enforcement detected in configs.

## Test Types

**Unit Tests:**
- Scope: Individual functions, hooks, middleware
- Approach: Mock external dependencies, test one thing per test case
- Examples: `errorHandler.test.ts`, `useChatMessages.test.ts`
- Focus: Happy path + error cases + edge cases

**Integration Tests:**
- Not explicitly structured, but some contract tests verify component composition
- Example: `contract-completeness.test.ts` verifies all contracts meet requirements
- Cross-module tests for WebSocket integration (planned for E2E)

**E2E Tests:**
- Framework: Playwright 1.58.2
- Location: `test/e2e/`, `test/playwright.config.ts`
- Run: `pnpm test:pw`, `pnpm test:pw:ui`, `pnpm test:pw:headed`
- Scope: Full user workflows across backend + frontend
- Report: `pnpm test:pw:report`

## Common Patterns

**Async Testing (Hooks):**
```typescript
// Using renderHook with act() for state updates
import { renderHook, act } from '@testing-library/react';

it('should add user message locally', () => {
  const { result } = renderHook(() => useChatMessages(testSessionId));

  act(() => {
    result.current.addUserMessage('Test message');
  });

  expect(result.current.messages).toHaveLength(1);
  expect(result.current.messages[0].role).toBe('user');
});
```

**Async Testing (Backend/Middleware):**
```typescript
// For async functions that return promises
it('should handle async operations', async () => {
  const result = await asyncFunction();
  expect(result).toBeDefined();
});

// Note: No explicit async/await in most backend tests since they're synchronous handlers
```

**Error Testing:**
```typescript
// Production mode sanitization
vi.stubEnv('NODE_ENV', 'production');
const error = new Error('Sensitive: password=abc123');
globalErrorHandler(error, mockReq as Request, mockRes as Response, mockNext);

expect(mockRes.json).toHaveBeenCalledWith({
  error: 'Internal server error',
  message: 'An internal error occurred', // Sanitized, not original message
});
vi.unstubAllEnvs();
```

**Lifecycle Testing:**
```typescript
it('should unsubscribe from WebSocket on unmount', () => {
  const { unmount } = renderHook(() => useChatMessages(testSessionId));
  unmount();
  expect(mockWebSocketContext.unsubscribe).toHaveBeenCalledWith(testSessionId);
});

it('should clear messages when session changes', () => {
  const { result, rerender } = renderHook(
    ({ sessionId }) => useChatMessages(sessionId),
    { initialProps: { sessionId: testSessionId } }
  );

  act(() => {
    result.current.addUserMessage('Test');
  });
  expect(result.current.messages).toHaveLength(1);

  const newSessionId = 'new-session' as SessionId;
  act(() => {
    rerender({ sessionId: newSessionId });
  });

  expect(result.current.messages).toHaveLength(0);
});
```

**Spy/Mock Verification:**
```typescript
// Verify function was called with specific arguments
expect(mockWebSocketContext.subscribe).toHaveBeenCalledWith(testSessionId);

// Verify spy was called
expect(consoleErrorSpy).toHaveBeenCalledWith(
  '[Error Handler] GET /api/test:',
  error
);

// Verify function NOT called
expect(mockNext).not.toHaveBeenCalled();
```

## Contract Tests

**Purpose:** Verify component behavioral contracts are complete and compliant

**Examples from `packages/app/src/__tests__/contracts/`:**
- `contract-completeness.test.ts`: All contracts have required sections
- `contract-css-classes.test.ts`: CSS classes used in components match contract definitions
- `contract-props-match.test.ts`: Props match component implementation
- `contract-health-selectors.test.ts`: Health/status indicators accessible
- `contract-file-paths.test.ts`: File paths in contracts are correct

**Pattern (from contract-completeness.test.ts):**
```typescript
describe('Contract Completeness', () => {
  it('should have all required sections', () => {
    const sections = getRequiredSections();
    contracts.forEach(contract => {
      sections.forEach(section => {
        expect(hasSection(contract, section)).toBe(true);
      });
    });
  });

  it('should have meaningful content in critical sections', () => {
    CRITICAL_SECTIONS.forEach(section => {
      const content = getSectionContent(contract, section);
      expect(content.split('\n').length).toBeGreaterThan(MINIMUM_CONTENT[section]);
    });
  });
});
```

## Test Timeout Configuration

**Settings (vitest.config.ts):**
```typescript
test: {
  testTimeout: 10000,  // 10 seconds per test
  hookTimeout: 10000,  // 10 seconds for setup/teardown
}
```

**Used for:**
- Async operations that might take time
- WebSocket/network tests
- File system operations

## Environment & Setup

**Test Environment (Backend):**
- `environment: 'node'`
- Direct Node.js module resolution

**Test Environment (Frontend):**
- `environment: 'happy-dom'`
- Lightweight DOM implementation for React testing
- Less resource-intensive than jsdom

**Setup Files:**
- `packages/app/src/__tests__/setup.ts`: Global mocks, window.matchMedia, WebSocket, import.meta.env

**Module Aliases (Frontend):**
- Configured in vitest.config.ts for test resolution
- Includes monaco-editor mocks to avoid import errors in tests

## Vitest Configuration

**Backend (packages/backend/vitest.config.ts):**
```typescript
export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['**/*.{test,spec}.?(c|m)[jt]s?(x)'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
    testTimeout: 10000,
    hookTimeout: 10000,
  },
});
```

**Frontend (packages/app/vitest.config.ts):**
```typescript
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./src/__tests__/setup.ts'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/dist-electron/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'dist/', 'dist-electron/', '**/*.test.ts', '**/*.test.tsx'],
    },
    testTimeout: 10000,
    hookTimeout: 10000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      './monaco-config': path.resolve(__dirname, './src/__tests__/__mocks__/monaco-config.ts'),
      'monaco-editor': path.resolve(__dirname, './src/__tests__/__mocks__/monaco-editor.ts'),
      'monaco-editor/esm/vs/editor/editor.worker?worker': path.resolve(__dirname, './src/__tests__/__mocks__/monaco-worker.ts'),
    },
  },
});
```

---

*Testing analysis: 2026-04-01*
