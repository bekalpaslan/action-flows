# Chrome MCP E2E Tests

End-to-end tests for the ActionFlows Dashboard using Chrome DevTools MCP (Model Context Protocol).

## What are Chrome MCP E2E Tests?

Unlike traditional E2E tests that run in a test runner (like Playwright or Cypress), Chrome MCP E2E tests are **structured test definitions** that Claude reads and executes step-by-step using Chrome DevTools MCP tools.

### How it Works

1. **Test Definition**: Tests are defined as TypeScript files with structured step definitions
2. **Claude Execution**: Claude reads the test file and executes each step using MCP tools
3. **Interactive Feedback**: Claude provides real-time feedback, screenshots, and results
4. **Manual Review**: You can review snapshots, screenshots, and results interactively

### Benefits

- **AI-Powered Testing**: Claude understands context and can adapt to UI changes
- **Visual Feedback**: Screenshots and snapshots for every step
- **Flexible Assertions**: Natural language assertions that Claude interprets
- **Easy Debugging**: Claude can explain failures and suggest fixes

## Prerequisites

Before running Chrome MCP E2E tests, ensure:

1. **Backend is running** on `localhost:3001`:
   ```bash
   pnpm dev:backend
   ```

2. **Frontend is running** on `localhost:5173`:
   ```bash
   pnpm dev:app
   ```

3. **Chrome DevTools MCP server is connected** (Claude should have access to Chrome MCP tools)

## Running Tests

To run a test, simply ask Claude:

```
Run the Chrome MCP E2E happy path test
```

Or be more specific:

```
Execute test/e2e/chrome-mcp-happy-path.test.ts step by step
```

Claude will:
1. Read the test definition file
2. Execute each step in order
3. Take snapshots and screenshots
4. Validate assertions
5. Provide a summary report

## Test Structure

Each test file exports:

### Test Steps

An array of `TestStep` objects, each containing:

```typescript
interface TestStep {
  id: string;                    // Unique step ID
  name: string;                  // Human-readable name
  description: string;           // What this step does
  tool: ChromeMcpTool;          // MCP tool to use
  params: Record<string, any>;  // Tool parameters
  assertions: Assertion[];       // Validations
  screenshot: boolean;           // Capture screenshot?
  onFailure: 'abort' | 'retry' | 'continue';
  captureFrom?: (response) => Record<string, any>;  // Extract data
}
```

### Test Context

State that carries between steps:

```typescript
interface TestContext {
  sessionId?: string;                        // Extracted session ID
  elementUids: Record<string, string>;       // Element UIDs from snapshots
  networkReqIds: Record<string, number>;     // Network request IDs
  stepResults: Record<string, any>;          // Previous step results
}
```

### Assertions

Validations performed after each step:

```typescript
interface Assertion {
  check: 'snapshot_contains_text' | 'snapshot_has_element' | 'truthy' | ...;
  target?: string;    // What to check
  expected: any;      // Expected value
  message: string;    // Failure message
}
```

## Available Tests

### `chrome-mcp-happy-path.test.ts`

**Full E2E happy path test** covering:

1. ✅ Backend health check
2. ✅ Navigate to frontend
3. ✅ Verify landing state (empty sessions)
4. ✅ Click new session button
5. ✅ Verify session creation API (POST /api/sessions)
6. ✅ Verify session appears in sidebar
7. ✅ Verify WebSocket connection
8. ✅ Verify chat panel is visible
9. ✅ Type test message
10. ✅ Send message
11. ✅ Verify message displayed
12. ✅ Verify backend received message

**Duration**: ~30-45 seconds

**Prerequisite checks**: Backend health, frontend load

## Writing New Tests

To create a new Chrome MCP E2E test:

### 1. Create Test File

Create a new file in `test/e2e/` with `.test.ts` suffix:

```typescript
// test/e2e/my-feature.test.ts
import type { TestStep, TestContext } from './chrome-mcp-utils';
import { BACKEND_URL, FRONTEND_URL, TIMEOUTS } from './chrome-mcp-utils';

export const step01_myFirstStep: TestStep = {
  id: 'my-first-step',
  name: 'My First Step',
  description: 'Description of what this step does',
  tool: 'navigate_page',
  params: { type: 'url', url: FRONTEND_URL },
  assertions: [
    { check: 'truthy', expected: true, message: 'Should succeed' }
  ],
  screenshot: true,
  onFailure: 'abort',
};

// Add more steps...

export const testSteps: TestStep[] = [
  step01_myFirstStep,
  // ... more steps
];

export const testMetadata = {
  name: 'My Feature Test',
  description: 'Tests my feature',
  version: '1.0.0',
  prerequisites: ['Backend running', 'Frontend running'],
  totalSteps: testSteps.length,
  estimatedDuration: '15-30 seconds',
};
```

### 2. Define Test Steps

Use available Chrome MCP tools:

- **`navigate_page`**: Load a URL
- **`take_snapshot`**: Get text snapshot of page (accessibility tree)
- **`click`**: Click an element by UID
- **`fill`**: Type into input field
- **`wait_for`**: Wait for text to appear
- **`press_key`**: Press keyboard keys
- **`evaluate_script`**: Run JavaScript in page context
- **`list_network_requests`**: Get network requests
- **`get_network_request`**: Get details of specific request
- **`take_screenshot`**: Capture visual screenshot
- **`list_console_messages`**: Get console logs

### 3. Add Assertions

Validate results using assertion types:

- **`snapshot_contains_text`**: Text exists in snapshot
- **`snapshot_has_element`**: Element exists (by class/type)
- **`response_status`**: HTTP status code check
- **`response_contains`**: Response body contains value
- **`truthy`**: Value is truthy
- **`network_request_exists`**: Network request was made
- **`network_status_code`**: Specific HTTP status
- **`websocket_connected`**: WebSocket is connected

### 4. Capture Context Data

Use `captureFrom` to extract data for later steps:

```typescript
captureFrom: (response: unknown, context: TestContext) => {
  // Extract session ID from API response
  const data = response as { id: string };
  return { sessionId: data.id };
}
```

### 5. Handle Dynamic UIDs

For element interactions (click, fill), use placeholders:

```typescript
params: (context: TestContext) => ({
  uid: context.elementUids.myButton || '<from-snapshot>',
}),
```

Claude will:
1. Take a snapshot
2. Identify the element UID
3. Store it in `context.elementUids.myButton`
4. Use it in the next step

## Tips & Best Practices

### Screenshot Strategy

- Always screenshot on navigation
- Screenshot before/after important interactions
- Skip screenshots for API-only checks to save time

### Failure Handling

- **`abort`**: Stop test immediately (use for critical failures)
- **`retry`**: Retry step once (use for flaky operations)
- **`continue`**: Log failure but continue (use for optional checks)

### Context Naming

Use clear, semantic names for context values:

```typescript
context.elementUids.newSessionBtn    // ✅ Clear
context.elementUids.btn1             // ❌ Unclear
```

### Assertion Messages

Write helpful failure messages:

```typescript
message: 'Should find "Sessions" heading in sidebar'  // ✅ Specific
message: 'Check failed'                              // ❌ Vague
```

### Test Organization

- One test file per major feature/flow
- Keep steps focused and atomic
- Use descriptive step IDs and names
- Export individual steps for reusability

## Troubleshooting

### Test Fails at Navigation

- Verify frontend is running: `curl http://localhost:5173`
- Check browser console for errors
- Increase `TIMEOUTS.navigation` if needed

### Element Not Found

- Take snapshot and inspect element UIDs
- Check CSS class names in snapshot vs. `SELECTORS`
- Verify element is visible (not hidden or lazy-loaded)

### Network Request Not Found

- Check request type filter (`resourceTypes`)
- Verify timing - request may not have completed
- Use `wait_for` before checking network requests

### WebSocket Issues

- Check backend WebSocket server is running
- Verify WebSocket URL in frontend code
- WebSocket checks use `onFailure: 'continue'` to avoid blocking

## File Reference

```
test/e2e/
├── chrome-mcp-utils.ts           # Type definitions, constants, helpers
├── chrome-mcp-happy-path.test.ts # Main happy path test
├── README.md                      # This file
└── reports/
    └── screenshots/               # Screenshot output directory
```

## Configuration

Edit `chrome-mcp-utils.ts` to customize:

- **URLs**: `BACKEND_URL`, `FRONTEND_URL`
- **Timeouts**: `TIMEOUTS.*`
- **Selectors**: `SELECTORS.*`
- **Test message**: `TEST_MESSAGE`

## Examples

### Simple Navigation Test

```typescript
export const step_navigate: TestStep = {
  id: 'navigate',
  tool: 'navigate_page',
  params: { type: 'url', url: FRONTEND_URL },
  assertions: [{ check: 'truthy', expected: true, message: 'Navigate OK' }],
  screenshot: true,
  onFailure: 'abort',
};
```

### Click Element Test

```typescript
export const step_click: TestStep = {
  id: 'click-button',
  tool: 'click',
  params: (ctx) => ({ uid: ctx.elementUids.myBtn }),
  assertions: [{ check: 'truthy', expected: true, message: 'Click OK' }],
  screenshot: true,
  onFailure: 'abort',
};
```

### API Check Test

```typescript
export const step_api: TestStep = {
  id: 'check-api',
  tool: 'evaluate_script',
  params: {
    function: `async () => {
      const res = await fetch('${BACKEND_URL}/api/sessions');
      return res.ok;
    }`,
  },
  assertions: [{ check: 'truthy', expected: true, message: 'API OK' }],
  screenshot: false,
  onFailure: 'abort',
};
```

## Resources

- [Chrome DevTools Protocol](https://chromaticqa.com/docs/chrome-devtools-protocol)
- [Model Context Protocol (MCP)](https://modelcontextprotocol.io/)
- [ActionFlows Dashboard Docs](../../docs/)

## Support

For questions or issues:

1. Check this README
2. Review existing test examples
3. Ask Claude to explain a specific step
4. Review Chrome MCP tool documentation
