# Testing Guide — ActionFlows Dashboard

> Comprehensive guide to testing strategies, patterns, and workflows for the ActionFlows Dashboard.

## Table of Contents

- [Testing Overview](#testing-overview)
- [Unit Tests (Vitest)](#unit-tests-vitest)
- [E2E Tests (Playwright)](#e2e-tests-playwright)
- [Contract Validation](#contract-validation)
- [Performance Testing](#performance-testing)
- [Coverage Reports](#coverage-reports)
- [CI/CD Integration](#cicd-integration)
- [Testing Workflows](#testing-workflows)
- [Debugging Tests](#debugging-tests)

---

## Testing Overview

The ActionFlows Dashboard uses a **three-tier testing strategy**:

| Tier | Tool | Purpose | Speed | Coverage |
|------|------|---------|-------|----------|
| **Unit** | Vitest | Test functions, components, utilities | Fast | 60-70% |
| **E2E** | Playwright | Test user workflows across UI | Slow | 30-40% |
| **Contract** | Custom | Validate orchestrator output format | Fast | N/A |

### Testing Philosophy

- **Unit tests** catch logic bugs early
- **E2E tests** catch integration issues
- **Contract tests** ensure harmony between orchestrator and dashboard

---

## Unit Tests (Vitest)

### Configuration

Both packages (backend, app) use **Vitest** with this structure:

```
packages/backend/src/__tests__/
├── routes/
│   ├── sessions.test.ts
│   └── events.test.ts
├── services/
│   ├── storage.test.ts
│   └── harmony.test.ts
└── utils/
    └── parser.test.ts
```

Each `.ts` file has a corresponding `.test.ts` file in `__tests__/`.

### Running Unit Tests

```bash
# Run all tests once
pnpm test

# Run tests in watch mode (re-runs on file change)
pnpm test:watch

# Run specific package
pnpm -F @afw/backend test
pnpm -F @afw/app test

# Run specific test file
pnpm test -- sessions.test.ts

# Run tests matching pattern
pnpm test -- --grep "Session"

# Run with coverage report
pnpm test -- --coverage
```

### Writing Unit Tests

#### Backend Test Example

Create `packages/backend/src/__tests__/services/storage.test.ts`:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MemoryStorage } from '../../storage/memory.js';

describe('MemoryStorage', () => {
  let storage: MemoryStorage;

  beforeEach(() => {
    storage = new MemoryStorage();
  });

  describe('save and get', () => {
    it('should save and retrieve a session', async () => {
      const sessionData = {
        id: 'session-123',
        userId: 'user-456',
        createdAt: new Date(),
      };

      await storage.saveSession(sessionData);
      const retrieved = await storage.getSession('session-123');

      expect(retrieved).toEqual(sessionData);
    });

    it('should return null for non-existent session', async () => {
      const result = await storage.getSession('non-existent');
      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete a session', async () => {
      await storage.saveSession({ id: 'session-123', /* ... */ });
      await storage.deleteSession('session-123');
      const result = await storage.getSession('session-123');

      expect(result).toBeNull();
    });
  });

  describe('list', () => {
    it('should list all sessions', async () => {
      await storage.saveSession({ id: 'session-1', /* ... */ });
      await storage.saveSession({ id: 'session-2', /* ... */ });

      const sessions = await storage.listSessions();
      expect(sessions).toHaveLength(2);
    });

    it('should return empty array when no sessions', async () => {
      const sessions = await storage.listSessions();
      expect(sessions).toEqual([]);
    });
  });
});
```

#### Frontend Component Test Example

Create `packages/app/src/__tests__/components/Button.test.tsx`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../../components/Button';

describe('Button Component', () => {
  it('should render button with text', () => {
    render(<Button>Click Me</Button>);
    expect(screen.getByText('Click Me')).toBeInTheDocument();
  });

  it('should call onClick when clicked', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click Me</Button>);

    await userEvent.click(screen.getByText('Click Me'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('should apply primary variant styles', () => {
    render(<Button variant="primary">Primary</Button>);
    const button = screen.getByText('Primary');

    expect(button).toHaveClass('primary');
  });

  it('should apply secondary variant styles', () => {
    render(<Button variant="secondary">Secondary</Button>);
    const button = screen.getByText('Secondary');

    expect(button).toHaveClass('secondary');
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

### Mocking Strategies

#### Mocking External Services

```typescript
import { vi } from 'vitest';

// Mock fetch
global.fetch = vi.fn();

// Mock WebSocket
class MockWebSocket {
  send = vi.fn();
  addEventListener = vi.fn();
  removeEventListener = vi.fn();
}

vi.stubGlobal('WebSocket', MockWebSocket);
```

#### Mocking Module Exports

```typescript
import { vi } from 'vitest';

// In your test
vi.mock('../../services/storage.js', () => ({
  storage: {
    getSession: vi.fn(() => Promise.resolve({ id: 'session-123' })),
    saveSession: vi.fn(),
  },
}));
```

#### Mocking React Context

```typescript
import { render } from '@testing-library/react';
import { SessionContext } from '../../contexts/SessionContext';

const mockSession = { id: 'session-123', userId: 'user-456' };

render(
  <SessionContext.Provider value={mockSession}>
    <MyComponent />
  </SessionContext.Provider>
);
```

### Test Patterns

#### Testing Async Code

```typescript
it('should fetch data', async () => {
  const { result } = renderHook(() => useFetchData());

  // Initially loading
  expect(result.current.loading).toBe(true);

  // Wait for promise
  await waitFor(() => {
    expect(result.current.loading).toBe(false);
  });

  // Check result
  expect(result.current.data).toEqual({ /* ... */ });
});
```

#### Testing Hooks

```typescript
import { renderHook, act } from '@testing-library/react';

it('should increment counter', () => {
  const { result } = renderHook(() => useCounter());

  expect(result.current.count).toBe(0);

  act(() => {
    result.current.increment();
  });

  expect(result.current.count).toBe(1);
});
```

#### Testing Error Cases

```typescript
it('should handle storage errors gracefully', async () => {
  const storage = new MemoryStorage();
  const error = new Error('Storage failed');

  vi.spyOn(storage, 'saveSession').mockRejectedValue(error);

  expect(() => storage.saveSession(data)).rejects.toThrow('Storage failed');
});
```

---

## E2E Tests (Playwright)

### Configuration

Playwright tests are in `test/e2e/` and use browser automation to test full workflows.

```bash
# Run all E2E tests
pnpm test:pw

# Run tests in UI mode (interactive)
pnpm test:pw:ui

# Run tests in headed mode (see browser)
pnpm test:pw:headed

# Run specific test file
pnpm test:pw -- sessions.spec.ts

# Run tests matching pattern
pnpm test:pw -- --grep "Session creation"
```

### Writing E2E Tests

Create `test/e2e/sessions.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Session Management', () => {
  test.beforeEach(async ({ page }) => {
    // Start backend before each test
    // Start app before each test
    await page.goto('http://localhost:5173');
  });

  test('should create a new session', async ({ page }) => {
    // 1. Click "New Session" button
    await page.click('[data-testid="new-session-button"]');

    // 2. Verify dialog appears
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();

    // 3. Fill form
    await page.fill('[name="sessionName"]', 'Test Session');
    await page.fill('[name="userId"]', 'test-user');

    // 4. Submit
    await page.click('button:has-text("Create")');

    // 5. Verify session appears in list
    await expect(
      page.locator('text=Test Session')
    ).toBeVisible();
  });

  test('should delete a session', async ({ page }) => {
    // Assume session exists from previous test
    await page.click('[data-testid="session-123"] [aria-label="Delete"]');

    // Verify confirmation dialog
    await expect(
      page.locator('text=Are you sure?')
    ).toBeVisible();

    // Confirm deletion
    await page.click('button:has-text("Yes, Delete")');

    // Verify session removed
    await expect(
      page.locator('text=Test Session')
    ).not.toBeVisible();
  });

  test('should list all sessions', async ({ page }) => {
    // Get session list
    const sessions = await page.locator('[data-testid^="session-item-"]').count();

    // Should have at least one
    expect(sessions).toBeGreaterThan(0);
  });
});
```

### Test Utilities

#### Custom Fixtures (Reusable Setup)

Create `test/fixtures/auth.ts`:

```typescript
import { test as base } from '@playwright/test';

type AuthFixture = {
  authenticatedPage: typeof base;
};

export const test = base.extend<AuthFixture>({
  authenticatedPage: async ({ page }, use) => {
    // Login before test
    await page.goto('http://localhost:5173/login');
    await page.fill('[name="username"]', 'testuser');
    await page.fill('[name="password"]', 'password123');
    await page.click('button:has-text("Login")');

    // Wait for redirect
    await page.waitForURL('http://localhost:5173/dashboard');

    // Make page available to test
    await use(page);

    // Cleanup after test (logout)
    await page.click('[aria-label="Logout"]');
  },
});
```

Use in test:

```typescript
import { test } from '../fixtures/auth';

test('authenticated user can create session', async ({ authenticatedPage }) => {
  // User is already logged in
  await authenticatedPage.click('[data-testid="new-session"]');
});
```

#### Wait Patterns

```typescript
// Wait for element to appear
await page.waitForSelector('[data-testid="loading-spinner"]', { state: 'hidden' });

// Wait for network request
await page.waitForResponse(
  response => response.url().includes('/api/sessions') && response.status() === 200
);

// Wait for function condition
await page.waitForFunction(() => {
  return document.querySelectorAll('[role="listitem"]').length > 0;
});

// Wait for navigation
await page.waitForURL('**/dashboard');
```

### Screenshot & Debug

```typescript
test('should display dashboard', async ({ page }) => {
  await page.goto('http://localhost:5173');

  // Take screenshot for manual inspection
  await page.screenshot({ path: 'dashboard.png' });

  // Debug: Print HTML
  console.log(await page.content());

  // Debug: Inspect element
  const button = page.locator('[data-testid="submit"]');
  console.log(await button.getAttribute('class'));

  // Pause for manual inspection
  await page.pause();
});
```

---

## Contract Validation

The ActionFlows Dashboard has a **contract** that defines the format orchestrator output must follow. Backend validates this in real-time.

### Running Contract Tests

```bash
# Validate backend against contract
pnpm -F @afw/backend test -- contracts

# Validate frontend against contract
pnpm -F @afw/app contract:compliance
```

### Understanding Contract Errors

If you see "harmony degraded" or "contract violation":

1. **Read the error message** — Shows which field is invalid
2. **Check CONTRACT.md** — See what format is required
3. **Inspect the actual output** — Compare to spec
4. **Fix the orchestrator** — Update output format or increment version

Example contract error:

```
CONTRACT VIOLATION: Expected 'status' to be 'pending', 'in_progress', or 'completed'
Got: 'waiting'
File: orchestrator output
Suggestion: Update orchestrator to use valid status values
```

---

## Performance Testing

### Lighthouse

Check frontend performance metrics:

```bash
# Run Lighthouse audit
pnpm -F @afw/app perf:check

# Generate performance report
pnpm -F @afw/app analyze:report
```

Check for:
- **FCP (First Contentful Paint)**: < 1.8s
- **LCP (Largest Contentful Paint)**: < 2.5s
- **CLS (Cumulative Layout Shift)**: < 0.1
- **FID (First Input Delay)**: < 100ms

### Benchmarking

Create `packages/backend/src/__tests__/perf/storage.bench.ts`:

```typescript
import { bench, describe } from 'vitest';
import { MemoryStorage } from '../../storage/memory.js';

describe('Storage performance', () => {
  bench('save 1000 sessions', async () => {
    const storage = new MemoryStorage();

    for (let i = 0; i < 1000; i++) {
      await storage.saveSession({
        id: `session-${i}`,
        userId: 'user-1',
      });
    }
  });

  bench('retrieve session', async () => {
    const storage = new MemoryStorage();
    await storage.saveSession({ id: 'session-1', userId: 'user-1' });

    // This will be benchmarked
    await storage.getSession('session-1');
  });
});
```

Run benchmarks:

```bash
pnpm test -- --bench
```

---

## Coverage Reports

Generate coverage for all packages:

```bash
# All packages
pnpm test -- --coverage

# Specific package
pnpm -F @afw/backend test -- --coverage

# Output formats
pnpm test -- --coverage --reporter=html  # HTML report
pnpm test -- --coverage --reporter=json  # JSON report
```

Coverage report opens in `coverage/index.html`.

### Coverage Goals

| Type | Target |
|------|--------|
| Statements | 80% |
| Branches | 75% |
| Functions | 80% |
| Lines | 80% |

Focus on:
- **Happy path**: Core user flows (100%)
- **Error handling**: Exception cases (80%)
- **Edge cases**: Boundaries (60%)
- **Utils**: Helper functions (90%)

---

## CI/CD Integration

Tests run automatically on:
- **Push to branch** — All tests must pass
- **Pull request** — Tests block merge if failing
- **Release** — Full suite runs before deploy

### GitHub Actions

Tests run via `.github/workflows/test.yml`:

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'pnpm'

      - run: pnpm install
      - run: pnpm type-check
      - run: pnpm lint
      - run: pnpm test
      - run: pnpm test:pw
```

### Pre-commit Hooks

Run tests before committing:

```bash
# Setup hooks
pnpm setup:hooks

# Hooks will run:
# - pnpm type-check
# - pnpm lint
# - pnpm test (unit tests only)
```

---

## Testing Workflows

### TDD (Test-Driven Development)

1. **Write test** for desired behavior
2. **Run test** (fails) — RED
3. **Write code** to pass test — GREEN
4. **Refactor** while tests pass — REFACTOR

```bash
# Watch tests while developing
pnpm test:watch

# In editor: Edit test → Edit code → Tests pass
```

### Adding a Feature

1. **Understand requirements**
2. **Write E2E test** — How user will interact
3. **Write unit tests** — How components work
4. **Implement feature** — Make tests pass
5. **Verify contract** — Ensure harmony
6. **Run full suite** — All tests pass
7. **Commit** with tests

### Debugging Failed Tests

```bash
# 1. Run test in watch mode
pnpm test:watch

# 2. Add debug output
console.log('Debug:', value);

# 3. Use .only to focus on one test
it.only('should work', () => { /* ... */ });

# 4. Add breakpoint in VSCode debugger
debugger; // Pauses test execution

# 5. Run specific test
pnpm test -- --grep "exact test name"
```

---

## Debugging Tests

### VSCode Debugging

Add to `.vscode/launch.json`:

```json
{
  "name": "Debug Tests",
  "type": "node",
  "request": "launch",
  "runtimeExecutable": "pnpm",
  "runtimeArgs": ["test"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

Then:
1. Press F5 to start debugging
2. Set breakpoints in test files
3. Step through execution

### Playwright Inspector

```bash
# Run tests with Playwright Inspector
PWDEBUG=1 pnpm test:pw

# Allows stepping through browser actions
```

### Common Test Issues

#### "Test timeout"

```typescript
// Increase timeout for slow tests
test('slow operation', async ({ page }) => {
  // ...
}, { timeout: 30000 }); // 30 seconds
```

#### "Element not found"

```typescript
// Wait for element with explicit wait
await page.waitForSelector('[data-testid="my-element"]', { timeout: 5000 });
await expect(page.locator('[data-testid="my-element"]')).toBeVisible();
```

#### "Flaky tests"

```typescript
// Use more reliable selectors
❌ page.click('button')  // Too generic
✅ page.click('[data-testid="submit-button"]')  // Specific

// Wait for stable state
await page.waitForLoadState('networkidle');
await page.waitForFunction(() => {
  return document.querySelectorAll('.loading').length === 0;
});
```

---

## Summary

### Quick Reference

```bash
# Unit tests
pnpm test              # Run once
pnpm test:watch        # Watch mode

# E2E tests
pnpm test:pw           # Run once
pnpm test:pw:ui        # Interactive UI
pnpm test:pw:headed    # See browser

# Coverage
pnpm test -- --coverage

# Contract
pnpm -F @afw/backend test -- contracts

# Performance
pnpm -F @afw/app perf:check
```

### Key Files

| Path | Purpose |
|------|---------|
| `packages/backend/src/__tests__/` | Backend unit tests |
| `packages/app/src/__tests__/` | Frontend unit tests |
| `test/e2e/` | E2E tests |
| `test/playwright/` | Playwright config & fixtures |
| `docs/CONTRACT.md` | Contract specification |

For more details, see:
- [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md) — Setup & dev workflows
- [CONTRIBUTING.md](./CONTRIBUTING.md) — PR checklist & test requirements
- `.github/workflows/` — CI/CD pipeline
