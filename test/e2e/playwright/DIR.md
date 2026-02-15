# playwright/

Playwright MCP E2E test definitions for ActionFlows Dashboard. These tests are headless-friendly and designed for CI/CD pipelines.

## Test Files

- `session-lifecycle.playwright.ts` — Session creation, status updates, and deletion tests
  - LIFECYCLE-001: Create new session via UI
  - LIFECYCLE-002: Session status progression (pending → in_progress → completed)
  - LIFECYCLE-003: Delete session via UI

- `chain-execution.playwright.ts` — Chain compilation, step execution, and completion tests
  - CHAIN-001: Chain compilation from user request
  - CHAIN-002: Step execution and status updates
  - CHAIN-003: Chain completion and results

- `cosmic-map.playwright.ts` — Cosmic map visualization and interaction tests
  - MAP-001: Cosmic map initial render and layout
  - MAP-002: Node selection and detail view
  - MAP-003: Zoom and pan interactions

## Usage

Tests are executed by the Playwright E2E test agent (`.claude/actionflows/actions/test/e2e-playwright/agent.md`).

**Execute via Claude:**
```
"run the Playwright session lifecycle E2E tests"
"run the Playwright chain execution E2E tests"
"run the Playwright cosmic map E2E tests"
```

**Prerequisites:**
- Backend running on localhost:3001 (`pnpm dev:backend`)
- Frontend running on localhost:5173 (`pnpm dev:app`)
- Playwright MCP server available

## Test Structure

Each test file exports:
- `testMetadata` — Test suite metadata (name, description, prerequisites)
- Individual test objects — Test scenarios with steps, expectations, and cleanup

Each test step includes:
- `name` — Step description
- `tool` — Playwright MCP tool to use (browser_navigate, browser_click, etc.)
- `params` — Tool parameters
- `expect` — Expected outcome
- `screenshot` — Whether to capture screenshot
- `onFailure` — Failure handling (abort, continue)

## Playwright MCP Tools

- `browser_navigate` — Navigate to URL
- `browser_snapshot` — Get accessibility tree snapshot
- `browser_click` — Click element by ref
- `browser_fill_form` — Fill form fields
- `browser_wait_for` — Wait for condition
- `browser_evaluate` — Run JavaScript in page
- `browser_press_key` — Simulate key press
- `browser_console_messages` — Get console output
- `browser_network_requests` — Monitor network

## vs Chrome MCP

**Playwright MCP:**
- Headless-friendly
- CI-compatible
- Parallel execution support
- Modern browser APIs

**Chrome MCP:**
- Requires visible browser
- Desktop-only
- Profile lock constraint
- Better for visual debugging

Use Playwright for CI/CD pipelines and regression testing. Use Chrome for local development and visual inspection.
