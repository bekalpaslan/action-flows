# Implementation Plan: CLI Integration Test Flow

## Overview

Design a `cli-integration-test/` flow that provides systematic testing of CLI integration, addressing the recurring problem area that has required 5 fixes so far. The flow will use a chain pattern of `analyze → code → test → review` to inventory current tests, write missing tests, run them, and review results. Tests will focus on backend services (`claudeCliSession.ts`, `claudeCliManager.ts`) with Vitest-based unit and integration tests covering CLI process lifecycle, stream-json parsing, WebSocket broadcasting, session management, and error scenarios.

## Steps

### Step 1: Flow Definition and Registration
- **Package:** ActionFlows framework
- **Files:**
  - `.claude/actionflows/FLOWS.md` (modify)
  - `.claude/actionflows/actions/test/cli-integration/flow.md` (create)
- **Changes:**
  - Add `cli-integration-test/` flow to FLOWS.md under "review" context
  - Create flow definition document describing chain pattern and purpose
  - Document when to use this flow (after CLI changes, before releases)
- **Depends on:** Nothing

### Step 2: Test Inventory and Gap Analysis
- **Package:** Backend
- **Files:**
  - `.claude/actionflows/logs/analyze/cli-test-inventory_{datetime}/report.md` (create via analyze agent)
- **Changes:**
  - Use `analyze/` action to inventory existing CLI tests
  - Identify test coverage gaps across 5 fix areas:
    1. CLI argument handling (prompt via stdin, not CLI arg)
    2. Process lifecycle (spawn → stdin → stdout → teardown)
    3. Stream-json parsing (JSONL buffering, content extraction)
    4. WebSocket event broadcasting (ClaudeCliOutputEvent delivery)
    5. Session management (start, status, stop, input)
    6. Error scenarios (crashes, malformed JSON, stdin failures)
  - Map existing test patterns from `packages/backend/src/__tests__/integration.test.ts`
  - Identify test file structure: unit tests vs integration tests
- **Depends on:** Step 1 (flow definition provides context)

### Step 3: Test Implementation
- **Package:** Backend
- **Files to create:**
  - `packages/backend/src/services/__tests__/claudeCliSession.test.ts` (unit tests)
  - `packages/backend/src/services/__tests__/claudeCliManager.test.ts` (unit tests)
  - `packages/backend/src/__tests__/claudeCli.integration.test.ts` (integration tests)
- **Changes:**
  - **Unit Tests for ClaudeCliSessionProcess** (`claudeCliSession.test.ts`):
    - Test process spawn with correct args (`--print`, `--input-format stream-json`, etc.)
    - Test stdin write formatting (JSONL user messages)
    - Test stdout parsing (`parseStreamJson()` method)
      - JSONL buffering (incomplete lines stay in buffer)
      - Content extraction (assistant, result, error message types)
      - Malformed JSON handling (fallback to raw text)
    - Test process lifecycle (start → running → stop)
    - Test event handler registration (`on()`, `off()`)
    - Test error scenarios:
      - Process crash before start
      - Stdin write when process not running
      - Stdin write when stdin not writable
      - Input validation (size limit, null bytes)
  - **Unit Tests for ClaudeCliManager** (`claudeCliManager.test.ts`):
    - Test session limit enforcement (MAX_SESSIONS)
    - Test duplicate session prevention
    - Test cwd validation (path traversal, system directories)
    - Test flag validation (command injection prevention)
    - Test MCP config generation
    - Test session storage integration
    - Test broadcast function registration
    - Test session lifecycle in storage (status transitions)
  - **Integration Tests** (`claudeCli.integration.test.ts`):
    - Test full flow: start session → send input → receive output → stop
    - Test WebSocket broadcasting of ClaudeCliOutputEvent
    - Test session persistence in storage
    - Test multiple concurrent sessions
    - Test session cleanup on exit
    - Test error recovery (process crash, restart)
  - Use existing test helpers from `packages/backend/src/__tests__/helpers.ts`
  - Mock child_process.spawn for unit tests
  - Use real process for integration tests (with test safety guards)
- **Depends on:** Step 2 (gap analysis identifies what tests to write)

### Step 4: Test Execution
- **Package:** Backend
- **Files:**
  - `.claude/actionflows/logs/test/cli-integration-tests_{datetime}/test-results.md` (create via test agent)
- **Changes:**
  - Use `test/` action to run newly created tests
  - Execute: `pnpm -F @afw/backend test src/services/__tests__/claudeCliSession.test.ts`
  - Execute: `pnpm -F @afw/backend test src/services/__tests__/claudeCliManager.test.ts`
  - Execute: `pnpm -F @afw/backend test src/__tests__/claudeCli.integration.test.ts`
  - Report pass/fail counts and failure details
  - Capture coverage metrics for CLI-related code
- **Depends on:** Step 3 (tests must exist to run)

### Step 5: Review and Validation
- **Package:** Backend
- **Files:**
  - `.claude/actionflows/logs/review/cli-integration-tests_{datetime}/review.md` (create via review agent)
- **Changes:**
  - Use `review/` action to validate test quality
  - Check test coverage completeness (all 6 categories covered?)
  - Verify test isolation (no shared state between tests)
  - Verify mock quality (realistic CLI behavior)
  - Verify error scenario coverage
  - Verify integration test safety (no actual Claude CLI calls in CI)
  - Provide recommendations for test improvements
- **Depends on:** Step 4 (test results must exist to review)

## Dependency Graph

```
Step 1 (flow definition)
  ↓
Step 2 (analyze: inventory current tests)
  ↓
Step 3 (code: write missing tests)
  ↓
Step 4 (test: run tests)
  ↓
Step 5 (review: validate test quality)
```

All steps are sequential - each depends on the previous step completing.

## Test Categories and Coverage Targets

### Category 1: CLI Process Lifecycle
**Target Coverage: 90%+**
- Process spawn with correct arguments
- Process startup and PID assignment
- Process status transitions (starting → running → stopped)
- Process termination (SIGTERM, SIGKILL)
- Process error handling (spawn failures)

### Category 2: Stream-json Parsing
**Target Coverage: 95%+**
- JSONL line buffering (incomplete lines)
- Complete line extraction
- JSON message parsing (assistant, result, error types)
- Content extraction from nested structures
- Malformed JSON fallback
- Empty line handling
- Multi-chunk message assembly

### Category 3: WebSocket Event Broadcasting
**Target Coverage: 85%+**
- ClaudeCliStartedEvent broadcast on start
- ClaudeCliOutputEvent broadcast on stdout
- ClaudeCliOutputEvent broadcast on stderr
- ClaudeCliExitedEvent broadcast on exit
- Event format validation (timestamp, sessionId, payload)

### Category 4: Session Management
**Target Coverage: 90%+**
- Session creation (startSession)
- Session retrieval (getSession)
- Session listing (listSessions)
- Session termination (stopSession)
- Session storage integration
- Session limit enforcement
- Duplicate session prevention

### Category 5: Stdin Communication
**Target Coverage: 95%+**
- User message formatting (JSONL)
- Initial prompt delivery after spawn
- Follow-up input delivery
- Input validation (size, null bytes)
- Write error handling (process not running, stdin not writable)

### Category 6: Error Scenarios
**Target Coverage: 80%+**
- Process crash during operation
- Stdin write failure
- Stdout/stderr read errors
- Malformed JSON in stdout
- Invalid cwd (path traversal, nonexistent directory)
- Invalid flags (command injection attempts)
- Session limit exceeded
- Duplicate session IDs

## File Structure for New Test Files

```
packages/backend/src/
├── services/
│   ├── __tests__/
│   │   ├── claudeCliSession.test.ts      (NEW - Unit tests for ClaudeCliSessionProcess)
│   │   ├── claudeCliManager.test.ts      (NEW - Unit tests for ClaudeCliManager)
│   │   ├── fileWatcher.test.ts           (EXISTING)
│   │   └── ...
│   ├── claudeCliSession.ts               (EXISTING - System under test)
│   ├── claudeCliManager.ts               (EXISTING - System under test)
│   └── ...
├── __tests__/
│   ├── claudeCli.integration.test.ts     (NEW - End-to-end CLI integration tests)
│   ├── integration.test.ts               (EXISTING - Pattern reference)
│   ├── helpers.ts                        (EXISTING - Test utilities)
│   └── ...
└── ...
```

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Real Claude CLI process spawned in tests | Tests fail in CI/CD without Claude CLI installed | Mock child_process.spawn for unit tests; guard integration tests with env var check |
| Tests depend on external network | Flaky tests, CI failures | Use MCP config mocking; avoid real network calls |
| Race conditions in async process events | Intermittent test failures | Use proper async/await patterns; add event synchronization helpers |
| Stream-json parsing tests require realistic data | Tests miss edge cases | Capture real Claude CLI output samples; test with varied message types |
| Tests modify shared state (singleton manager) | Test isolation failures | Reset manager state in beforeEach; use unique session IDs per test |
| Integration tests are slow | Test suite timeout | Run integration tests separately from unit tests; use shorter timeouts |

## Verification

- [ ] Type check passes across all packages (`pnpm type-check`)
- [ ] All new tests pass (`pnpm -F @afw/backend test`)
- [ ] Existing integration tests still pass
- [ ] Coverage targets met for CLI-related code
- [ ] No console errors during test execution
- [ ] Tests run in isolation (can run individually)
- [ ] Tests clean up resources (no hanging processes)
- [ ] Flow definition registered in FLOWS.md
- [ ] Flow produces expected log structure

## Flow Usage Examples

### When to Use This Flow

1. **After CLI-related changes** - Any modification to `claudeCliSession.ts`, `claudeCliManager.ts`, or related routes
2. **Before releases** - Validate CLI integration stability before deploying
3. **After dependency updates** - Verify child_process, ws, or stream-json behavior
4. **When adding new CLI features** - Extend test suite to cover new functionality
5. **When investigating CLI bugs** - Run targeted tests to reproduce and validate fixes

### Flow Invocation Pattern

```
Human: "Run CLI integration tests"

Orchestrator:
  1. Spawns analyze/ agent to inventory current CLI tests
  2. Spawns code/ agent to write missing tests (if gaps found)
  3. Spawns test/ agent to run all CLI tests
  4. Spawns review/ agent to validate test quality
  5. Returns: Test results summary + coverage report + quality assessment
```

### Expected Outputs

- `.claude/actionflows/logs/analyze/cli-test-inventory_{datetime}/report.md` - Test coverage analysis
- `packages/backend/src/services/__tests__/claudeCliSession.test.ts` - Unit tests
- `packages/backend/src/services/__tests__/claudeCliManager.test.ts` - Unit tests
- `packages/backend/src/__tests__/claudeCli.integration.test.ts` - Integration tests
- `.claude/actionflows/logs/test/cli-integration-tests_{datetime}/test-results.md` - Test execution report
- `.claude/actionflows/logs/review/cli-integration-tests_{datetime}/review.md` - Quality review

## Test Patterns to Follow

Based on existing test patterns in `packages/backend/src/__tests__/integration.test.ts` and `helpers.ts`:

### Unit Test Pattern

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ClaudeCliSessionProcess } from '../claudeCliSession.js';
import { spawn } from 'child_process';

vi.mock('child_process');

describe('ClaudeCliSessionProcess', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
  });

  it('should spawn process with correct arguments', async () => {
    const mockProcess = createMockChildProcess();
    vi.mocked(spawn).mockReturnValue(mockProcess);

    const session = new ClaudeCliSessionProcess(
      brandedTypes.sessionId('test-session'),
      '/test/cwd',
      ['--print', '--input-format', 'stream-json']
    );

    await session.start();

    expect(spawn).toHaveBeenCalledWith(
      'claude',
      expect.arrayContaining(['--print', '--input-format', 'stream-json']),
      expect.objectContaining({ cwd: '/test/cwd' })
    );
  });
});
```

### Integration Test Pattern

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createTestServer, cleanup } from './helpers.js';
import { claudeCliManager } from '../services/claudeCliManager.js';

describe('Claude CLI Integration', () => {
  let testServerUrl: string;

  beforeEach(async () => {
    const serverInfo = await createTestServer();
    testServerUrl = serverInfo.apiUrl;
  });

  afterEach(async () => {
    await cleanup();
  });

  it('should start session and broadcast events', async () => {
    // Test implementation
  });
});
```

## Contract Compliance Notes

This flow produces log outputs that are NOT contract-defined (internal planning documents, test reports). The flow itself does not produce structured outputs consumed by the dashboard, so CONTRACT.md compliance is not required for flow outputs.

However, the tests being created SHOULD validate that the CLI integration produces contract-compliant WebSocket events:
- `ClaudeCliStartedEvent`
- `ClaudeCliOutputEvent`
- `ClaudeCliExitedEvent`

Test validation should verify these events match the shared type definitions in `packages/shared/src/events.ts`.

## Implementation Notes

### Mock Strategy for Unit Tests

**Child Process Mocking:**
- Mock `child_process.spawn()` to return a mock ChildProcess object
- Mock ChildProcess properties: pid, stdin, stdout, stderr, kill()
- Mock EventEmitter behavior: on(), emit()
- Simulate event sequences: spawn → data → exit

**Example Mock:**
```typescript
function createMockChildProcess() {
  const mockStdout = new EventEmitter();
  const mockStderr = new EventEmitter();
  const mockStdin = {
    write: vi.fn(),
    writable: true,
  };

  const mockProcess = new EventEmitter() as any;
  mockProcess.pid = 12345;
  mockProcess.stdout = mockStdout;
  mockProcess.stderr = mockStderr;
  mockProcess.stdin = mockStdin;
  mockProcess.kill = vi.fn();

  return mockProcess;
}
```

### Integration Test Safety

**Guards for CI/CD:**
```typescript
const SKIP_CLI_INTEGRATION = process.env.SKIP_CLI_INTEGRATION === 'true';

describe.skipIf(SKIP_CLI_INTEGRATION)('Claude CLI Integration', () => {
  // Real process integration tests
});
```

**Environment Variables:**
- `SKIP_CLI_INTEGRATION=true` - Skip integration tests in CI
- `AFW_CLAUDE_CLI_MAX_SESSIONS=2` - Limit sessions in tests
- `AFW_TEST_MODE=true` - Enable test-specific behavior

### Stream-json Test Data

**Capture Real Output:**
Save real Claude CLI output samples for test fixtures:
```json
{"type":"assistant","message":{"role":"assistant","content":"Hello! I'm ready to help."}}
{"type":"result","result":"Task completed successfully."}
{"type":"error","error":"Failed to connect to MCP server."}
```

**Test Fixture Location:**
`packages/backend/src/__tests__/fixtures/claude-cli-output.jsonl`

## Next Steps After This Plan

1. **Human Review** - Approve plan or request modifications
2. **Execute analyze/ step** - Inventory current CLI tests
3. **Execute code/ step** - Write missing tests based on analysis
4. **Execute test/ step** - Run new tests and validate
5. **Execute review/ step** - Quality check and final validation
6. **Register flow** - Add to FLOWS.md and create flow.md
7. **Document usage** - Update project docs with flow usage examples
