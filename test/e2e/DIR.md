# e2e/

End-to-end browser-based tests for ActionFlows Dashboard. Tests validate user flows, UI interactions, and behavioral contracts.

## Test Frameworks

### Chrome DevTools MCP Tests
Browser-based E2E tests using Chrome DevTools MCP. Requires visible browser window.

**Test Files:**
- `chrome-mcp-happy-path.test.ts` — Basic session + chat flow
- `session-lifecycle.test.ts` — Session creation, status, deletion
- `session-sidebar.test.ts` — Sidebar interactions
- `session-info-panel.test.ts` — Session detail panel
- `conversation-panel.test.ts` — Chat interface
- `session-archive.test.ts` — Session archival
- `multi-session.test.ts` — Multiple session handling
- `cosmic-map-navigation.test.ts` — Cosmic map navigation
- `cosmic-map-interactions.test.ts` — Cosmic map interactions
- `accessibility-cosmic-map.test.ts` — Cosmic map accessibility
- `accessibility-keyboard-navigation.test.ts` — Keyboard navigation

**Helpers:**
- `chrome-mcp-helpers.ts` — Shared test utilities
- `chrome-mcp-utils.ts` — Type definitions and constants
- `chrome-mcp-respect-helpers.ts` — Respect protocol helpers
- `chrome-mcp-respect-check.test.ts` — Respect protocol validation

**Generated Tests:**
- `generated/` — Auto-generated component tests

### Playwright MCP Tests
Headless browser-based E2E tests using Playwright MCP. Designed for CI/CD pipelines.

**Test Directory:**
- `playwright/` — see `playwright/DIR.md` for test catalog

**Test Files:**
- `session-lifecycle.playwright.ts` — Session CRUD operations
- `chain-execution.playwright.ts` — Chain compilation and execution
- `cosmic-map.playwright.ts` — Cosmic map visualization and interactions

## Execution

### Chrome MCP Tests
Executed by orchestrator directly using Chrome DevTools MCP tools.

**Prerequisites:**
- Backend running on localhost:3001
- Frontend running on localhost:5173
- Chrome DevTools MCP server connected
- No other Chrome instances with same profile

**Ask Claude:**
```
"run the session lifecycle E2E tests"
"run the Chrome MCP happy path test"
```

### Playwright MCP Tests
Executed by test/e2e-playwright agent using Playwright MCP tools.

**Prerequisites:**
- Backend running on localhost:3001
- Frontend running on localhost:5173
- Playwright MCP server available

**Ask Claude:**
```
"run the Playwright session lifecycle E2E tests"
"run the Playwright chain execution E2E tests"
"run the Playwright cosmic map E2E tests"
```

## Test Patterns

### Chrome MCP Pattern
- Uses accessibility tree snapshots for element UIDs
- Synchronous execution (profile lock constraint)
- Best for desktop debugging and visual inspection
- Requires visible browser window

### Playwright MCP Pattern
- Uses accessibility tree refs from snapshots
- Supports parallel execution
- Best for CI/CD pipelines and regression testing
- Headless-friendly

## Common Issues

| Issue | Fix |
|-------|-----|
| Chrome MCP profile lock error | Close all Chrome instances, try again |
| "Element ref not found" during interaction | Verify snapshot taken after page load, use updated refs |
| Test timeout waiting for element | Increase timeout, or add explicit waits between steps |
| Backend/frontend not running | Start `pnpm dev:backend` and `pnpm dev:app` in separate terminals |
| Playwright MCP not available | Verify MCP server running, or use create-only mode for test generation |

## Notes

- **Element Selection:** Use accessibility tree refs/UIDs from snapshots, NOT hardcoded CSS selectors
- **Prerequisites:** Always verify backend (3001) and frontend (5173) running before test execution
- **Cleanup:** Tests should clean up created sessions/chains to prevent state pollution
- **Screenshots:** Captured on failure for debugging
- **Contract Validation:** Tests linked to behavioral contracts (HC-XX-NNN) for compliance tracking
