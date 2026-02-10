# E2E Test Setup and Monorepo Structure Analysis

**Aspect:** structure, coverage, inventory
**Scope:** test/e2e/*, package.json (root + all packages), tsconfig files, vitest configs
**Date:** 2026-02-10
**Agent:** analyze

---

## 1. Current Test Framework Status

### 1.1 E2E Test Infrastructure

| Aspect | Status | Details |
|--------|--------|---------|
| **Framework** | Chrome MCP (Custom) | Not traditional Playwright/Cypress - AI-guided via MCP tools |
| **Location** | test/e2e/ | 4 test files + utilities + docs |
| **Execution** | Manual (Claude) | Claude reads test definitions and executes steps via Chrome MCP |
| **Test Runner** | None | E2E tests are NOT run by Vitest - they're structured definitions |
| **Purpose** | Happy path validation | Session creation, chat messaging, WebSocket connection |
| **Backend Port** | 3001 | Configurable via PORT env var |
| **Frontend Port** | 5173 | Vite dev server port (hardcoded in tests) |

### 1.2 Existing E2E Test Files

| File | Type | Purpose | Steps | Status |
|------|------|---------|-------|--------|
| chrome-mcp-utils.ts | Types + Constants | Shared utilities, type definitions, constants | N/A | Exported |
| chrome-mcp-happy-path.test.ts | Test Definition | Full E2E flow: session→chat→message | 13 | Production |
| chrome-mcp-respect-check.test.ts | Test Definition | Component layout & render validation | N/A | Production |
| chrome-mcp-respect-helpers.ts | Helpers | Respect check helper functions | N/A | Supporting |
| README.md | Documentation | Test execution guide, best practices | N/A | Current |

### 1.3 Current Unit Test Infrastructure (Vitest)

| Package | Test Location | Config | Tests Found | Test Runner |
|---------|---|---|---|---|
| @afw/backend | packages/backend/src/__tests__/ | vitest.config.ts | 3 files (confidence, integration, routing) | Vitest + Node env |
| @afw/app | packages/app/src/__tests__/ | vitest.config.ts | setup.ts present | Vitest + happy-dom |
| @afw/shared | packages/shared/src/ | None | No tests | N/A |
| @afw/mcp-server | packages/mcp-server/src/ | None | No tests | N/A |
| @afw/hooks | packages/hooks/src/ | None | No tests | N/A |

---

## 2. Monorepo Structure for Playwright Configuration

### 2.1 Workspace Organization

```
D:/ActionFlowsDashboard/
├── package.json (root - workspace definition)
├── tsconfig.base.json (shared TypeScript config)
├── packages/
│   ├── backend/         (Express API - port 3001)
│   │   ├── package.json
│   │   ├── vitest.config.ts
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts
│   │       └── __tests__/
│   ├── app/             (React + Electron frontend - port 5173)
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   ├── vitest.config.ts
│   │   ├── tsconfig.json
│   │   └── src/
│   ├── shared/          (Shared types - no tests)
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   ├── mcp-server/      (MCP integration - no tests)
│   │   ├── package.json
│   │   └── src/
│   └── hooks/           (Claude Code hooks - no tests)
│       └── package.json
└── test/
    ├── e2e/             (Chrome MCP tests)
    │   ├── chrome-mcp-utils.ts
    │   ├── chrome-mcp-happy-path.test.ts
    │   ├── chrome-mcp-respect-check.test.ts
    │   ├── README.md
    │   └── reports/
    └── curl-commands.sh
```

### 2.2 Workspace Configuration (Root package.json)

```json
{
  "workspaces": ["packages/*"],
  "packageManager": "pnpm@8.0.0",
  "scripts": {
    "dev": "pnpm -r --parallel dev",
    "dev:backend": "pnpm -F @afw/backend dev",
    "dev:app": "pnpm -F @afw/app dev",
    "test": "pnpm -r test",
    "test:e2e": "bash test/curl-commands.sh"  // Not for Chrome MCP tests
  }
}
```

### 2.3 TypeScript Path Mapping (tsconfig.base.json)

```json
{
  "paths": {
    "@afw/shared": ["packages/shared/src/index.ts"],
    "@afw/backend": ["packages/backend/src/index.ts"],
    "@afw/app": ["packages/app/src/index.ts"]
  }
}
```

---

## 3. Package.json Scripts Analysis

### 3.1 Root Scripts

| Script | Command | Purpose | Runs |
|--------|---------|---------|------|
| dev | pnpm -r --parallel dev | Start all dev servers | Backend + Frontend |
| dev:backend | pnpm -F @afw/backend dev | Backend only (port 3001) | ts-node-dev on src/index.ts |
| dev:app | pnpm -F @afw/app dev | Frontend only (port 5173) | Vite dev server |
| test | pnpm -r test | Run all Vitest suites | Vitest (backend + app) |
| test:e2e | bash test/curl-commands.sh | cURL-based E2E tests | HTTP requests only |

### 3.2 Backend Scripts (packages/backend/package.json)

| Script | Command | Purpose |
|--------|---------|---------|
| dev | npx tsx watch src/index.ts | Watch mode with tsx (TypeScript executor) |
| build | tsc | Compile TypeScript to dist/ |
| test | vitest run | Run tests once |
| test:watch | vitest | Watch mode tests |
| type-check | tsc --noEmit | Type checking only |

### 3.3 Frontend Scripts (packages/app/package.json)

| Script | Command | Purpose |
|--------|---------|---------|
| dev | vite | Start Vite dev server (port 5173) |
| dev:electron | concurrently ... | Start Vite + Electron |
| build | vite build && electron-builder | Build web + Electron packages |
| test | vitest run | Run tests once |
| test:watch | vitest | Watch mode tests |
| type-check | tsc --noEmit | Type checking only |

---

## 4. Chrome MCP Test Pattern Inventory

### 4.1 Test Step Types

| Tool | Used In | Purpose | Params |
|------|---------|---------|--------|
| navigate_page | happy-path (step 2) | Load URL, handles navigation | type, url, timeout |
| take_snapshot | happy-path (steps 3, 6, 8, 11) | Get a11y tree (UIDs) | none |
| click | happy-path (steps 4, 10) | Click element by UID | uid, includeSnapshot |
| fill | happy-path (step 9) | Type into textarea | uid, value |
| wait_for | happy-path (step 11) | Wait for text | text, timeout |
| evaluate_script | happy-path (steps 1, 7, 12, 13) | Execute JavaScript | function |
| list_network_requests | happy-path (step 5) | Get all requests | resourceTypes |
| get_network_request | happy-path (step 5b) | Get request details | reqid |
| take_screenshot | happy-path (optional) | Visual screenshot | uid, fullPage, format |
| list_console_messages | (available) | Get console logs | types |

### 4.2 Assertion Types

| Assertion Type | Used In | Example |
|---|---|---|
| snapshot_contains_text | step03, step06 | Check "No sessions yet" text |
| snapshot_has_element | step03, step06, step08 | Check button exists |
| response_status | (not used in happy-path) | HTTP status codes |
| response_contains | step05b | Response body field check |
| truthy | steps 1, 2, 4, 7, 9, 10, 11, 12 | Boolean validation |
| network_request_exists | step05 | POST /api/sessions called |
| network_status_code | step05b | Check 201 status |
| websocket_connected | step07 | WebSocket status |

### 4.3 Context Data Flow

| Context Key | Set By | Used By | Value Type |
|---|---|---|---|
| sessionId | step05b | step12, step13 | string (UUID) |
| elementUids.newSessionBtn | step03 (manual) | step04 | string (UID from snapshot) |
| elementUids.chatInput | step08 (manual) | step09 | string (UID) |
| elementUids.chatSendBtn | step08 (manual) | step10 | string (UID) |
| networkReqIds.createSession | step05 (manual) | step05b | number (request ID) |

---

## 5. Base URLs and Port Configuration

### 5.1 Hardcoded Values

| Component | URL | Port | Configurable |
|-----------|-----|------|---|
| Backend API | http://localhost:3001 | 3001 | NO - hardcoded in chrome-mcp-utils.ts |
| Frontend App | http://localhost:5173 | 5173 | NO - hardcoded in chrome-mcp-utils.ts |
| WebSocket Proxy | ws://localhost:3001 | 3001 | N/A (via vite.config.ts proxy) |

### 5.2 Vite Dev Proxy Configuration (packages/app/vite.config.ts)

```typescript
server: {
  port: 5173,
  proxy: {
    '/api': {
      target: 'http://localhost:3001',
      changeOrigin: true,
    },
    '/ws': {
      target: 'ws://localhost:3001',
      ws: true,
    },
  },
}
```

---

## 6. Test Helpers and Utilities

### 6.1 Chrome MCP Utils (chrome-mcp-utils.ts)

**Exported Interfaces:**
- TestStep
- TestContext
- TestResult
- TestSuiteResult
- Assertion
- RespectCheckResult

**Exported Constants:**
- BACKEND_URL = 'http://localhost:3001'
- FRONTEND_URL = 'http://localhost:5173'
- TIMEOUTS = { navigation: 10s, element: 5s, network: 3s, websocket: 2s, messageDisplay: 5s }
- TEST_MESSAGE = 'Hello from E2E test! This is an automated Chrome MCP test message.'
- SCREENSHOT_DIR = 'test/e2e/reports/screenshots'
- SELECTORS = { newSessionBtn, sessionItem, chatInput, chatSendBtn, etc. }
- API_ENDPOINTS = { health, sessions, sessionById, sessionChat }

### 6.2 Respect Check Helpers (chrome-mcp-respect-helpers.ts)

- Helper functions for layout validation
- Component rendering checks
- CSS class verification

---

## 7. Optimal Playwright Configuration Placement

### 7.1 Recommended Architecture

**Option A: Root-Level playwright.config.ts (RECOMMENDED)**

```
D:/ActionFlowsDashboard/
├── playwright.config.ts          # <-- Shared config for all tests
├── test/
│   ├── e2e/                      # Keep existing Chrome MCP tests
│   │   └── *.test.ts
│   └── playwright/               # NEW: Playwright-specific E2E tests
│       ├── happy-path.spec.ts
│       ├── session-mgmt.spec.ts
│       └── fixtures/
│           └── app.ts
└── packages/
```

**Advantages:**
- Single source of truth for E2E config
- Can reference both frontend + backend ports
- Clean separation: Chrome MCP in test/e2e/, Playwright in test/playwright/
- Easy workspace script: `pnpm test:pw` (runs Playwright only)

### 7.2 Playwright Config Structure

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './test/playwright',
  fullyParallel: true,
  forbidOnly: process.env.CI ? true : false,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 4,
  reporter: [
    ['html'],
    ['junit', { outputFile: 'test-results/junit.xml' }],
  ],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: [
    {
      command: 'pnpm dev:backend',
      url: 'http://localhost:3001/health',
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    },
    {
      command: 'pnpm dev:app',
      url: 'http://localhost:5173',
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    },
  ],
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
  ],
});
```

---

## 8. Package Dependencies for Playwright

### 8.1 Required Packages

| Package | Version | Purpose | Workspace |
|---------|---------|---------|-----------|
| @playwright/test | ^1.40.0 | Test framework & runner | Root devDependencies |
| @types/node | ^20.10.6 | Node types | Already present |
| typescript | ^5.3.3 | TypeScript support | Already present |

### 8.2 Already Present (No Installation Needed)

- TypeScript ^5.3.3
- @types/node ^20.10.6
- pnpm package manager

---

## 9. Test Organization Recommendations

### 9.1 Suggested Directory Structure

```
test/
├── e2e/                         # Chrome MCP AI-guided tests
│   ├── chrome-mcp-utils.ts
│   ├── chrome-mcp-happy-path.test.ts
│   ├── chrome-mcp-respect-check.test.ts
│   └── README.md
├── playwright/                  # NEW: Playwright-based E2E tests
│   ├── auth.spec.ts            # Login/logout flows
│   ├── session-crud.spec.ts    # Create, read, update, delete sessions
│   ├── chat.spec.ts            # Message sending, display
│   ├── visual.spec.ts          # Visual regression, layout
│   └── fixtures/
│       ├── app.ts              # App fixture with logged-in state
│       ├── session.ts          # Pre-created session fixture
│       └── data.ts             # Test data generators
├── curl-commands.sh            # Legacy cURL-based tests
└── README.md
```

### 9.2 Test File Naming Convention

- **Playwright**: `*.spec.ts` (standard Playwright convention)
- **Chrome MCP**: `*.test.ts` (distinguishes from Playwright)
- **Fixtures**: `*.ts` in fixtures/ folder
- **Utilities**: Named exports in shared files

---

## 10. Integration Points: Playwright ↔ Existing Infrastructure

### 10.1 Base URL Configuration

| Use Case | Value | Source |
|----------|-------|--------|
| Frontend baseURL | http://localhost:5173 | From chrome-mcp-utils.ts or playwright.config.ts |
| Backend API | http://localhost:3001 | From frontend vite proxy or direct calls |
| WebSocket | ws://localhost:3001 | Backend WebSocket URL |

### 10.2 Environment Variables

**Recommended additions to playwright.config.ts:**

```typescript
const API_BASE_URL = process.env.API_URL || 'http://localhost:3001';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const WS_URL = process.env.WS_URL || 'ws://localhost:3001';
```

### 10.3 API Endpoint Reuse

**Existing endpoints (from chrome-mcp-utils.ts):**
```typescript
export const API_ENDPOINTS = {
  health: '/health',
  sessions: '/api/sessions',
  sessionById: (id: string) => `/api/sessions/${id}`,
  sessionChat: (id: string) => `/api/sessions/${id}/chat`,
};
```

**Recommendation:** Move to shared utilities file that both Chrome MCP and Playwright can import.

---

## 11. Script Additions for Root package.json

### 11.1 Recommended New Scripts

```json
{
  "scripts": {
    "test:pw": "playwright test",
    "test:pw:debug": "playwright test --debug",
    "test:pw:ui": "playwright test --ui",
    "test:pw:headed": "playwright test --headed",
    "test:e2e:all": "pnpm test:pw && bash test/curl-commands.sh",
    "test:report": "playwright show-report"
  }
}
```

### 11.2 CI/CD Integration

```bash
# CI environment would use:
pnpm test:pw --reporter=junit
# Or with configuration:
playwright test --config=playwright.config.ts --reporter=github
```

---

## 12. TypeScript Configuration for Playwright

### 12.1 tsconfig Adjustments (Recommended)

**No changes needed to tsconfig.base.json**, but Playwright will use:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
  }
}
```

### 12.2 Playwright Configuration File Type

```typescript
// playwright.config.ts uses:
import { defineConfig } from '@playwright/test';
```

---

## 13. Inventory of Selector/Locator Values

### 13.1 Element Selectors from SELECTORS Constant

| Element | Selector/Class | UI Component | Used In |
|---------|---|---|---|
| New Session Button | sidebar-new-session-btn | Plus button in sidebar | Session creation |
| Session Item | session-sidebar-item | Sidebar session entry | Session list |
| Chat Input | chat-panel__input-field | Textarea for messages | Message input |
| Chat Send Button | chat-panel__send-btn | Send button | Message submission |
| Chat Messages | chat-panel__messages | Message list container | Message display |
| Chat Info Bar | chat-panel__info-bar | Info/status bar | Session info |

### 13.2 Layout Components from Respect Check

| Component | Class | Purpose |
|-----------|-------|---------|
| Workbench Layout | workbench-layout | Main layout container |
| Workbench Body | workbench-body | Main body area |
| Workbench Main | workbench-main | Primary content |
| Left Panel Stack | left-panel-stack | Left sidebar |
| Session Panel | session-panel-layout | Session section |
| Right Visualization | right-visualization-area | Flow/chain viz |
| Top Bar | top-bar | Header tabs |

---

## Recommendations

### Immediate (For Playwright Setup)

1. **Create playwright.config.ts** at root level with:
   - webServer configuration for both backend (3001) and frontend (5173)
   - baseURL = http://localhost:5173
   - Reporters: HTML, JUnit, GitHub Actions (if CI)
   - Projects: Chromium, Firefox (optional: Webkit)

2. **Add Playwright as devDependency** to root package.json:
   ```bash
   pnpm add -D @playwright/test
   ```

3. **Create test/playwright/ directory** with subdirectories:
   - fixtures/ (app.ts, session.ts, data.ts)
   - (empty, ready for spec files)

4. **Create shared utilities file** (test/utilities/api.ts):
   - Move API_ENDPOINTS from chrome-mcp-utils.ts
   - Both frameworks can import and reuse

5. **Update root package.json scripts** with test:pw variants

### Follow-Up (For Integration)

6. **Migrate Chrome MCP test constants** to shared config:
   - TIMEOUTS, SELECTORS, API_ENDPOINTS
   - Benefits: DRY principle, single source of truth

7. **Create Playwright fixture for authenticated state**:
   - Base on Chrome MCP login steps
   - Reusable across test files

8. **Document Playwright usage** in test/README.md

---

## Validation Checklist

- [x] Existing test infrastructure mapped (Chrome MCP + Vitest)
- [x] Monorepo workspace structure analyzed
- [x] Port configuration identified (3001, 5173)
- [x] Package.json scripts inventoried
- [x] TypeScript configuration verified
- [x] Selector values extracted from code
- [x] Test helper functions catalogued
- [x] Recommended Playwright config structure defined
- [x] Integration points identified
- [x] File placement strategy provided

