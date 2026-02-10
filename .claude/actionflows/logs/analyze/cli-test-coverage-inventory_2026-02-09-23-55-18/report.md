# CLI Integration Test Coverage Gap Analysis

**Aspect:** Test Coverage Inventory
**Scope:** packages/backend/src/__tests__/, packages/backend/src/services/__tests__/, claudeCliSession.ts, claudeCliManager.ts
**Date:** 2026-02-09
**Agent:** analyze/

---

## Executive Summary

**Current State:** ZERO test coverage for Claude CLI integration layer.

**Finding:** No existing tests cover `claudeCliSession.ts` (292 lines) or `claudeCliManager.ts` (390 lines). The 9 existing test files focus on other backend services (fileWatcher, storage, routing, WebSocket handlers, integration flows).

**Impact:** Critical CLI integration features (subprocess management, stream-json parsing, WebSocket event broadcasting, session lifecycle) are completely untested.

**Recommendation:** Write comprehensive test suite covering all 6 categories with 90%+ coverage target (approximately 800-1000 lines of test code needed).

---

## 1. Existing Test Coverage Inventory

### Test Files Found (9 files)

| Test File | Lines | Coverage Area |
|-----------|-------|---------------|
| `integration.test.ts` | 333 | End-to-end API + WebSocket flows |
| `helpers.ts` | 410 | Test utilities (server, WS client, mocks) |
| `fileWatcher.test.ts` | 652 | File system watching (chokidar) |
| `confidenceScorer.test.ts` | ? | Confidence scoring |
| `memory.test.ts` | ? | Memory storage backend |
| `filePersistence.test.ts` | ? | File persistence |
| `redis.test.ts` | ? | Redis storage backend |
| `errorHandler.test.ts` | ? | Middleware error handling |
| `handler.test.ts` (ws/) | ? | WebSocket connection handling |
| `contextRouter.test.ts` | ? | Routing logic |

**Key Finding:** `fileWatcher.test.ts` provides the ONLY example of mocking child processes in the codebase (via chokidar mocking pattern). No tests directly mock Node.js `spawn()` or ChildProcess.

### Existing Test Helpers & Patterns

**Reusable from `helpers.ts`:**
- `createTestServer()` - HTTP + WebSocket test server setup
- `createWebSocketClient()` - WS client connection helper
- `createMockEvent()` - Factory for typed WorkspaceEvent mocks
- `waitFor()` - Async condition polling
- `waitForMessage()` - WS message waiting with predicate
- `cleanup()` - Resource teardown

**Mock Patterns from `fileWatcher.test.ts`:**
- `vi.mock()` for external dependencies (chokidar, storage)
- Event handler registration pattern (`on('event', handler)`)
- Debounce testing with `setTimeout` delays
- Graceful error handling verification

**Test Naming Conventions:**
- `{service}.test.ts` in `__tests__/` or `services/__tests__/`
- Vitest framework (`describe`, `it`, `expect`, `beforeEach`, `afterEach`, `vi`)
- TypeScript with full type safety from `@afw/shared`

---

## 2. Coverage Gap Analysis by Category

### Category 1: CLI Process Lifecycle
**Target Coverage:** 90%

#### Current Coverage: 0%
**NO TESTS EXIST**

#### What's Missing (CRITICAL GAPS):

1. **Process Spawning**
   - `ClaudeCliSessionProcess.start()` spawns `claude` command with piped stdio
   - Success path: spawn event, PID assignment, status transition (starting → running)
   - Failure path: spawn error, invalid command, ENOENT (command not found)
   - Environment merging: `CI: '1'` forced, custom env vars passed

2. **Status Transitions**
   - Constructor: `status: 'starting'`
   - After spawn: `status: 'running'`
   - After stop(): `status: 'stopped'`
   - On error: `status: 'error'`
   - Verify `isRunning()` returns correct boolean

3. **Process Termination**
   - `stop(signal)` sends SIGTERM/SIGKILL to child process
   - Exit event handler: captures exit code, signal, sets endedAt timestamp
   - Buffer cleanup: `stdoutBuffer = ''` to prevent memory leak
   - Double-stop prevention: throws error if process already stopped

4. **Process Info & Metadata**
   - `getInfo()` returns full `ClaudeCliSession` object
   - `pid` tracked correctly (null before spawn, assigned after)
   - `spawnArgs` stored accurately
   - `metadata` preserved (prompt, flags)

**Files Requiring Tests:**
- `claudeCliSession.ts` lines 119-193 (start method)
- `claudeCliSession.ts` lines 233-246 (stop method)
- `claudeCliSession.ts` lines 251-260 (isRunning, getInfo)

**Priority:** P0 (CRITICAL) - Core functionality, no fallback

---

### Category 2: Stream-json Parsing
**Target Coverage:** 95%

#### Current Coverage: 0%
**NO TESTS EXIST**

#### What's Missing (CRITICAL GAPS):

1. **JSONL Buffering**
   - `parseStreamJson()` accumulates chunks into `stdoutBuffer`
   - Handles partial lines (incomplete JSON at chunk boundary)
   - Preserves last incomplete line for next chunk
   - MAX_BUFFER_SIZE enforcement (1MB limit, resets on overflow)

2. **Content Extraction**
   - **Type: assistant** → Extract `message.content` (including empty strings)
   - **Type: result** → Extract `result` text
   - **Type: error** → Extract `error` text, prefix with `[ERROR]`
   - **Unknown types** → Log but don't display

3. **Malformed JSON Handling**
   - JSON.parse() failures → Log warning, pass raw text as fallback
   - Empty lines → Skip silently
   - Mixed valid/invalid lines → Continue processing valid lines
   - Long lines (truncated at 100 chars in logs)

4. **Edge Cases**
   - Empty chunk → No-op
   - Chunk with only newlines → No output
   - Multiple complete lines in one chunk → All parsed
   - Chunk ends mid-JSON → Buffered for next chunk
   - Buffer overflow → Reset and continue (no crash)

**Files Requiring Tests:**
- `claudeCliSession.ts` lines 60-114 (parseStreamJson method)
- Integration with stdout data handler (lines 143-154)

**Priority:** P0 (CRITICAL) - Data integrity, potential data loss on failure

---

### Category 3: WebSocket Event Broadcasting
**Target Coverage:** 85%

#### Current Coverage: 0%
**NO TESTS EXIST**

#### What's Missing (HIGH PRIORITY):

1. **ClaudeCliOutputEvent Delivery**
   - stdout handler → `ClaudeCliOutputEvent` with stream: 'stdout'
   - stderr handler → `ClaudeCliOutputEvent` with stream: 'stderr'
   - Event structure: `{ type, sessionId, output, stream, timestamp }`
   - Broadcast function invocation (registered via `setBroadcastFunction`)

2. **ClaudeCliStartedEvent**
   - Sent after successful spawn + initial prompt sent
   - Includes: `pid`, `cwd`, `args`, `prompt`, `timestamp`
   - Type: `'claude-cli:started'`

3. **ClaudeCliExitedEvent**
   - Sent on process exit
   - Includes: `exitCode`, `exitSignal`, `duration`, `timestamp`
   - Type: `'claude-cli:exited'`

4. **Storage Integration**
   - Session stored in storage via `storage.setSession()` (line 312)
   - `SessionStartedEvent` stored via `storage.addEvent()` (line 323)
   - `SessionEndedEvent` stored on exit (line 257)
   - Final status update: 'completed' or 'failed' based on exit code

**Files Requiring Tests:**
- `claudeCliManager.ts` lines 203-273 (event handlers)
- `claudeCliManager.ts` lines 286-296 (started event)
- `claudeCliManager.ts` lines 225-267 (exit event + storage update)

**Priority:** P1 (HIGH) - User-visible feature, dashboard won't show CLI output without this

---

### Category 4: Session Management
**Target Coverage:** 90%

#### Current Coverage: 0%
**NO TESTS EXIST**

#### What's Missing (HIGH PRIORITY):

1. **Session Start**
   - `claudeCliManager.startSession()` creates new `ClaudeCliSessionProcess`
   - Validates cwd for security (path traversal, system directories)
   - Validates flags (allowed prefixes, no command injection chars)
   - Enforces session limit (default 5, configurable via env var)
   - Prevents duplicate session IDs
   - Updates project lastUsedAt if projectId provided

2. **Session Retrieval**
   - `getSession(sessionId)` returns process or undefined
   - `listSessions()` returns all active session IDs
   - `getSessionCount()` returns number of active sessions

3. **Session Termination**
   - `stopSession(sessionId, signal)` stops specific session
   - Returns false if session not found (idempotent)
   - `stopAllSessions()` for graceful shutdown
   - Sessions auto-removed from map on exit

4. **Edge Cases**
   - Starting session when at limit → throws error
   - Starting duplicate session ID → throws error
   - Stopping non-existent session → returns false (no throw)
   - Graceful shutdown → all sessions stopped cleanly

**Files Requiring Tests:**
- `claudeCliManager.ts` lines 127-331 (startSession method)
- `claudeCliManager.ts` lines 336-386 (getSession, stopSession, listSessions, stopAllSessions)
- `claudeCliManager.ts` lines 67-97 (validateCwd security checks)
- `claudeCliManager.ts` lines 102-122 (validateFlags security checks)

**Priority:** P1 (HIGH) - Security-critical, session isolation depends on this

---

### Category 5: Stdin Communication
**Target Coverage:** 95%

#### Current Coverage: 0%
**NO TESTS EXIST**

#### What's Missing (HIGH PRIORITY):

1. **JSONL Formatting**
   - `sendInput(input)` wraps user text in stream-json format
   - Message structure: `{ type: 'user', message: { role: 'user', content: input.trim() } }`
   - Appends newline (`\n`) for JSONL protocol
   - UTF-8 encoding specified

2. **Initial Prompt Delivery**
   - After process spawns, sends initial prompt if provided (line 282)
   - Timing: AFTER spawn succeeds, BEFORE broadcasting started event
   - Critical for avoiding "Prompt is too long" error (--print mode stdin-only)

3. **Input Validation**
   - Length check: max 100KB to prevent resource exhaustion
   - Null byte check: rejects inputs containing `\0`
   - Writable stream check: verifies stdin is writable before write
   - Throws error if process not running

4. **Write Error Handling**
   - Catches write errors (broken pipe, EPIPE)
   - Logs error to console
   - Re-throws error to caller (API route handles it)

**Files Requiring Tests:**
   - `claudeCliSession.ts` lines 198-228 (sendInput method)
   - `claudeCliManager.ts` lines 280-283 (initial prompt send)

**Priority:** P1 (HIGH) - Core interaction model, breaks user experience if fails

---

### Category 6: Error Scenarios
**Target Coverage:** 80%

#### Current Coverage: 0%
**NO TESTS EXIST**

#### What's Missing (MEDIUM PRIORITY):

1. **Process Crash**
   - Child process exits unexpectedly (non-zero code)
   - Error event handler logs and sets `status: 'error'`
   - Session removed from manager's map
   - Storage updated with final status 'failed'

2. **Invalid Working Directory**
   - `validateCwd()` throws on non-existent directory
   - Prevents path traversal with `..` in normalized path
   - Blocks access to system directories (/etc, C:\Windows, etc.)
   - Uses realpath to resolve symlinks

3. **Command Injection Prevention**
   - `validateFlags()` checks for dangerous chars: `[;&|` $(){}[]<>\]`
   - Only allows known safe flag prefixes (--debug, --print, --mcp-config, etc.)
   - Rejects flags not starting with dash

4. **Resource Limits**
   - MAX_SESSIONS enforced (default 5)
   - Input size limit (100KB per message)
   - Buffer size limit (1MB for stdout accumulation)
   - Graceful degradation on limit hit (error returned, not crash)

**Files Requiring Tests:**
   - `claudeCliManager.ts` lines 67-122 (security validators)
   - `claudeCliSession.ts` lines 174-179 (error event handler)
   - `claudeCliManager.ts` lines 269-273 (error cleanup)
   - `claudeCliManager.ts` lines 136-144 (session limit enforcement)

**Priority:** P2 (MEDIUM) - Security hardening, but multiple defense layers exist

---

## 3. Mock Strategy & Test Utilities

### Recommended Mock Architecture

#### 1. Mock ChildProcess (CRITICAL)

```typescript
// packages/backend/src/__tests__/mocks/childProcess.mock.ts
import { EventEmitter } from 'events';
import type { ChildProcess, Readable, Writable } from 'child_process';

export class MockChildProcess extends EventEmitter {
  public pid: number | undefined;
  public exitCode: number | null = null;
  public signalCode: NodeJS.Signals | null = null;
  public stdin: MockWritable;
  public stdout: MockReadable;
  public stderr: MockReadable;
  public killed = false;

  constructor() {
    super();
    this.stdin = new MockWritable();
    this.stdout = new MockReadable();
    this.stderr = new MockReadable();
  }

  kill(signal?: NodeJS.Signals): boolean {
    this.killed = true;
    this.emit('exit', 0, signal || null);
    return true;
  }

  // Methods to simulate CLI behavior
  simulateSpawn(pid: number): void {
    this.pid = pid;
    setImmediate(() => this.emit('spawn'));
  }

  simulateOutput(data: string, stream: 'stdout' | 'stderr' = 'stdout'): void {
    this[stream].push(data);
  }

  simulateExit(code: number, signal: NodeJS.Signals | null = null): void {
    this.exitCode = code;
    this.signalCode = signal;
    this.emit('exit', code, signal);
  }

  simulateError(error: Error): void {
    this.emit('error', error);
  }
}
```

#### 2. Mock spawn() Function

```typescript
// Mock in test file
vi.mock('child_process', () => ({
  spawn: vi.fn((command, args, options) => {
    const mockProcess = new MockChildProcess();
    // Optionally auto-spawn for success cases
    if (!options._simulateSpawnError) {
      mockProcess.simulateSpawn(12345);
    }
    return mockProcess;
  }),
}));
```

#### 3. Test Helper: Claude CLI Output Simulator

```typescript
// packages/backend/src/__tests__/helpers/cliSimulator.ts
export class ClaudeCliSimulator {
  static generateStreamJsonLine(
    type: 'assistant' | 'result' | 'error',
    content: string
  ): string {
    const payload =
      type === 'assistant'
        ? { type, message: { role: 'assistant', content } }
        : type === 'result'
        ? { type, result: content }
        : { type, error: content };
    return JSON.stringify(payload) + '\n';
  }

  static generatePartialLine(fullLine: string, splitAt: number): [string, string] {
    return [fullLine.slice(0, splitAt), fullLine.slice(splitAt)];
  }

  static generateMalformedJson(): string {
    return '{"type":"assistant","message":{"role":"as\n'; // Incomplete JSON
  }
}
```

#### 4. WebSocket Broadcast Spy

```typescript
// Reuse pattern from fileWatcher.test.ts
let broadcastSpy: ReturnType<typeof vi.fn>;

beforeEach(() => {
  broadcastSpy = vi.fn();
  claudeCliManager.setBroadcastFunction(broadcastSpy);
});

// Then assert:
expect(broadcastSpy).toHaveBeenCalledWith(
  sessionId,
  expect.objectContaining({
    type: 'claude-cli:output',
    output: 'expected output',
    stream: 'stdout',
  })
);
```

---

## 4. Recommended Test File Structure

### File 1: `claudeCliSession.test.ts` (400-500 lines)

**Scope:** Unit tests for ClaudeCliSessionProcess class

**Test Suites:**
1. Process Lifecycle (spawn, status transitions, isRunning)
2. Stream-json Parsing (JSONL buffering, content extraction, malformed JSON)
3. Stdin Communication (JSONL formatting, input validation, write errors)
4. Event Handlers (stdout, stderr, exit, error)
5. Buffer Management (overflow protection, cleanup on exit)
6. Edge Cases (double start, stop before start, null bytes)

**Dependencies to Mock:**
- `child_process.spawn`
- ChildProcess event emitters (stdout, stderr, exit, error)

---

### File 2: `claudeCliManager.test.ts` (400-500 lines)

**Scope:** Integration tests for ClaudeCliManager singleton

**Test Suites:**
1. Session Management (start, get, list, stop, stopAll)
2. Security Validation (validateCwd, validateFlags)
3. Session Limits (max sessions, duplicate IDs)
4. WebSocket Event Broadcasting (started, output, exited events)
5. Storage Integration (session persistence, event storage)
6. MCP Config Generation (auto-config vs provided path)
7. Project Storage Updates (lastUsedAt fire-and-forget)
8. Graceful Shutdown (stopAllSessions cleanup)

**Dependencies to Mock:**
- `child_process.spawn` (via ClaudeCliSessionProcess)
- `storage.setSession`, `storage.addEvent`
- `projectStorage.updateLastUsed`

---

## 5. Priority & Effort Estimates

| Category | Priority | Estimated Effort | Complexity | Risk if Untested |
|----------|----------|------------------|------------|------------------|
| **1. Process Lifecycle** | P0 | 4-5 hours | Medium | HIGH - Core feature broken |
| **2. Stream-json Parsing** | P0 | 5-6 hours | High | HIGH - Data loss/corruption |
| **3. WebSocket Broadcasting** | P1 | 3-4 hours | Low-Medium | MEDIUM - Dashboard blind |
| **4. Session Management** | P1 | 4-5 hours | Medium | HIGH - Security vulnerabilities |
| **5. Stdin Communication** | P1 | 3-4 hours | Low-Medium | MEDIUM - User input fails |
| **6. Error Scenarios** | P2 | 3-4 hours | Medium | LOW - Multiple safety nets |
| **TOTAL** | - | **22-28 hours** | - | - |

**Estimated Test Code:** 800-1000 lines total (2 files)

---

## 6. Test Infrastructure Needs

### New Test Utilities to Create

1. **MockChildProcess class** (100 lines) - Simulate spawn/stdio/exit/error
2. **ClaudeCliSimulator helper** (50 lines) - Generate stream-json output
3. **Security test fixtures** (50 lines) - Invalid paths, malicious flags

### Existing Utilities to Reuse

- `createMockEvent()` from `helpers.ts` (for ClaudeCliStartedEvent, etc.)
- `waitFor()` from `helpers.ts` (for async process spawn)
- Mock patterns from `fileWatcher.test.ts` (event handlers, debounce)

### Vitest Configuration

**No changes needed** - Existing setup supports:
- TypeScript compilation
- Module mocking with `vi.mock()`
- Async test support
- Coverage reporting

---

## 7. Coverage Targets by File

| File | Lines | Testable Lines | Target Coverage | Est. Tests Needed |
|------|-------|----------------|-----------------|-------------------|
| `claudeCliSession.ts` | 292 | ~250 | 90% (225 lines) | 30-35 tests |
| `claudeCliManager.ts` | 390 | ~340 | 90% (306 lines) | 35-40 tests |
| **TOTAL** | **682** | **~590** | **90% (531 lines)** | **65-75 tests** |

**Note:** Lines 1-50 (imports, types, comments) typically excluded from coverage. Target 90% of executable lines.

---

## 8. Recommended Test Execution Order

### Phase 1: Foundation (Day 1-2, ~10 hours)
1. Create MockChildProcess helper
2. Write Category 1 tests (Process Lifecycle)
3. Write Category 2 tests (Stream-json Parsing)

**Deliverable:** `claudeCliSession.test.ts` with 80%+ coverage

---

### Phase 2: Integration (Day 3-4, ~10 hours)
4. Write Category 3 tests (WebSocket Broadcasting)
5. Write Category 4 tests (Session Management)
6. Write Category 5 tests (Stdin Communication)

**Deliverable:** `claudeCliManager.test.ts` with 80%+ coverage

---

### Phase 3: Hardening (Day 5, ~6 hours)
7. Write Category 6 tests (Error Scenarios)
8. Add edge case tests (race conditions, resource limits)
9. Run coverage report, fill gaps to 90%+

**Deliverable:** 90%+ coverage across both files

---

## 9. Sample Test Cases (High-Value Examples)

### Category 1: Process Lifecycle
```typescript
it('should spawn Claude CLI with correct arguments', async () => {
  const session = new ClaudeCliSessionProcess(
    sessionId,
    '/test/cwd',
    ['--print', '--input-format', 'stream-json']
  );
  await session.start();

  expect(spawn).toHaveBeenCalledWith('claude', expect.arrayContaining([
    '--print',
    '--input-format', 'stream-json',
    '--output-format', 'stream-json',
  ]), expect.objectContaining({
    cwd: '/test/cwd',
    stdio: ['pipe', 'pipe', 'pipe'],
    env: expect.objectContaining({ CI: '1' }),
  }));
});
```

### Category 2: Stream-json Parsing
```typescript
it('should handle partial JSON lines across chunks', () => {
  const session = new ClaudeCliSessionProcess(sessionId, '/test', []);

  // First chunk: incomplete JSON
  const chunk1 = '{"type":"assistant","message":{"role":"a';
  const output1 = session['parseStreamJson'](chunk1); // Access private method in test
  expect(output1).toBe(''); // Nothing parsed yet

  // Second chunk: completes JSON
  const chunk2 = 'ssistant","content":"Hello"}}\n';
  const output2 = session['parseStreamJson'](chunk2);
  expect(output2).toBe('Hello'); // Now parsed
});
```

### Category 3: WebSocket Broadcasting
```typescript
it('should broadcast ClaudeCliOutputEvent on stdout', async () => {
  const broadcastSpy = vi.fn();
  claudeCliManager.setBroadcastFunction(broadcastSpy);

  await claudeCliManager.startSession(sessionId, '/test', 'Hello');
  const mockProcess = spawn.mock.results[0].value;

  mockProcess.simulateOutput('{"type":"assistant","message":{"content":"Response"}}\n');

  expect(broadcastSpy).toHaveBeenCalledWith(sessionId, {
    type: 'claude-cli:output',
    sessionId,
    output: 'Response',
    stream: 'stdout',
    timestamp: expect.any(String),
  });
});
```

### Category 4: Session Management
```typescript
it('should prevent duplicate session IDs', async () => {
  await claudeCliManager.startSession(sessionId, '/test1');

  await expect(
    claudeCliManager.startSession(sessionId, '/test2')
  ).rejects.toThrow('Claude CLI session session-1 already exists');
});
```

### Category 5: Stdin Communication
```typescript
it('should format stdin input as stream-json JSONL', () => {
  const session = new ClaudeCliSessionProcess(sessionId, '/test', []);
  session.start();

  session.sendInput('Test message');

  expect(mockProcess.stdin.write).toHaveBeenCalledWith(
    '{"type":"user","message":{"role":"user","content":"Test message"}}\n',
    'utf8'
  );
});
```

### Category 6: Error Scenarios
```typescript
it('should reject path traversal attempts in cwd', async () => {
  await expect(
    claudeCliManager.startSession(sessionId, '/safe/../../etc/passwd')
  ).rejects.toThrow('Path traversal detected in cwd');
});
```

---

## 10. Recommendations

### Immediate Actions (P0)

1. **Create test file stubs** - Set up `claudeCliSession.test.ts` and `claudeCliManager.test.ts`
2. **Build MockChildProcess** - Foundation for all CLI tests
3. **Write smoke tests** - One happy-path test per category to validate mock architecture

### Phase 1 Priorities (P0-P1)

1. Category 1: Process Lifecycle (CRITICAL)
2. Category 2: Stream-json Parsing (CRITICAL)
3. Category 4: Session Management (security-critical)

### Phase 2 Priorities (P1-P2)

4. Category 3: WebSocket Broadcasting
5. Category 5: Stdin Communication
6. Category 6: Error Scenarios

### Long-term Improvements

- **Performance tests** - Measure spawn time, throughput, memory under load
- **Integration tests** - End-to-end API route → ClaudeCliManager → WebSocket flow
- **Fuzz testing** - Random stream-json input to find edge cases
- **Security audit tests** - Penetration testing for command injection, path traversal

---

## 11. Dependencies & Blockers

### No Blockers Identified

All necessary infrastructure exists:
- Vitest test framework configured
- TypeScript compilation working
- Mock patterns established in `fileWatcher.test.ts`
- Helper utilities available in `helpers.ts`

### External Dependencies

- **Vitest** (already installed) - Test runner
- **child_process** (Node.js built-in) - No additional install
- **ws** (already installed) - WebSocket testing

### Knowledge Transfer Needs

- **Stream-json protocol** - Understanding JSONL format for Claude CLI
- **ChildProcess mocking** - Node.js process mocking techniques
- **Security validation logic** - Path traversal, command injection patterns

---

## Appendix A: Files Analyzed

### Implementation Files (2 files, 682 lines)
- `packages/backend/src/services/claudeCliSession.ts` (292 lines)
- `packages/backend/src/services/claudeCliManager.ts` (390 lines)

### Test Files (9 files, ~2000+ lines)
- `packages/backend/src/__tests__/integration.test.ts` (333 lines)
- `packages/backend/src/__tests__/helpers.ts` (410 lines)
- `packages/backend/src/services/__tests__/fileWatcher.test.ts` (652 lines)
- `packages/backend/src/__tests__/confidenceScorer.test.ts`
- `packages/backend/src/middleware/__tests__/errorHandler.test.ts`
- `packages/backend/src/ws/__tests__/handler.test.ts`
- `packages/backend/src/storage/__tests__/memory.test.ts`
- `packages/backend/src/storage/__tests__/filePersistence.test.ts`
- `packages/backend/src/storage/__tests__/redis.test.ts`
- `packages/backend/src/__tests__/routing/contextRouter.test.ts`

### Related Files
- `packages/backend/src/routes/claudeCli.ts` (190 lines) - API routes (not in scope but reference for integration tests)
- `packages/shared/src/events.ts` - Event type definitions (ClaudeCliStartedEvent, etc.)

---

## Appendix B: Event Type Definitions

### Claude CLI Events (3 types)

```typescript
// packages/shared/src/events.ts

export interface ClaudeCliStartedEvent extends BaseEvent {
  type: 'claude-cli:started';
  pid: number;
  cwd: string;
  args: string[];
  prompt: string | null;
}

export interface ClaudeCliOutputEvent extends BaseEvent {
  type: 'claude-cli:output';
  output: string;
  stream: 'stdout' | 'stderr';
}

export interface ClaudeCliExitedEvent extends BaseEvent {
  type: 'claude-cli:exited';
  exitCode: number | null;
  exitSignal: string | null;
  duration: DurationMs;
}
```

These are part of the `WorkspaceEvent` discriminated union and must be tested for correct structure and WebSocket delivery.

---

## Summary

**Current Coverage:** 0% (NO TESTS)
**Target Coverage:** 90% (531/590 testable lines)
**Estimated Effort:** 22-28 hours over 5 days
**Test Files to Create:** 2 (`claudeCliSession.test.ts`, `claudeCliManager.test.ts`)
**Test Count:** 65-75 tests across 6 categories
**Priority:** P0-P1 (CRITICAL - covers security, data integrity, core features)

**Next Step:** Create `claudeCliSession.test.ts` with MockChildProcess and Category 1 tests (Process Lifecycle).
