# Technical Analysis: CliPanel Auto-Start Implementation

## Overview

This document provides deep-dive technical analysis of the race conditions and state management issues found in the CliPanel auto-start implementation.

---

## Critical Issue #1: React State Update Timing vs Await

### Problem Statement

```typescript
// Line 304-320 in CliPanel.tsx
const handleSendCommand = useCallback(async () => {
  // ... setup code ...

  try {
    // Start CLI session if not already started
    if (cliState === 'not-started') {
      await startCliSession();  // ← This changes cliState to 'running' internally
    }

    // Wait if session is still starting
    if (cliState === 'starting') {  // ← BUT this reads OLD state value!
      // This block is unreachable due to stale state
    }
  }
  // ...
});
```

### Root Cause

React state updates (`setCliState`) are **asynchronous** and batched. When `await startCliSession()` completes:
1. Inside `startCliSession`, `setCliState('running')` is called (line 85)
2. The `await` returns control to `handleSendCommand`
3. The next line reads `cliState` - but React hasn't re-rendered yet
4. `cliState` still holds the **old value** from the previous render cycle

### Proof

```typescript
// Inside startCliSession (line 72-101)
const startCliSession = useCallback(async () => {
  if (cliState !== 'not-started') return;

  setCliState('starting');  // ← Queue state update
  const terminal = terminalInstanceRef.current;

  try {
    // ... start session ...
    await claudeCliService.startSession(sessionId, cwd);

    setCliState('running');  // ← Queue another state update
    // ...
  } catch (error) {
    setCliState('stopped');  // ← Or this one
    throw error;
  }
}, [sessionId, cwd, cliState]);  // ← cliState dependency means this reads from closure
```

When `handleSendCommand` does `await startCliSession()`, it waits for the async work (API call) to complete, but **NOT** for React re-renders. The `cliState` variable in `handleSendCommand`'s scope is frozen at the value from when the render occurred.

### Impact

- The check `if (cliState === 'starting')` is always false (dead code)
- Input is sent immediately after `startSession()` API call returns, without confirming backend process is ready
- If backend takes 100-500ms to spawn CLI process, input arrives too early and gets queued instead of piped

### Fix Options

**Option A: Remove redundant check (simplest)**
```typescript
if (cliState === 'not-started') {
  await startCliSession();
  // State is now 'running' - proceed to send input
}
// Remove the 'starting' check entirely
```

**Option B: Use ref for synchronous tracking**
```typescript
const cliStateRef = useRef<CliSessionState>('not-started');

const startCliSession = useCallback(async () => {
  if (cliStateRef.current !== 'not-started') return;

  cliStateRef.current = 'starting';
  setCliState('starting');  // For UI display

  try {
    await claudeCliService.startSession(sessionId, cwd);
    cliStateRef.current = 'running';
    setCliState('running');
  } catch (error) {
    cliStateRef.current = 'stopped';
    setCliState('stopped');
    throw error;
  }
}, [sessionId, cwd]);

// In handleSendCommand:
if (cliStateRef.current === 'not-started') {
  await startCliSession();
}
```

**Option C: Add backend confirmation polling**
```typescript
if (cliState === 'not-started') {
  await startCliSession();

  // Poll backend to confirm session is running
  let retries = 0;
  while (retries < 10) {
    const status = await claudeCliService.getSessionStatus(sessionId);
    if (status.isRunning) break;
    await new Promise(r => setTimeout(r, 100));
    retries++;
  }
}
```

---

## Critical Issue #2: Broken Retry Flow

### Problem Statement

```typescript
// Line 308-311
} else if (cliState === 'stopped') {
  // Retry start if previously failed
  setCliState('not-started');  // ← Queue async state update
  await startCliSession();     // ← But guard checks current state immediately
}

// Line 73 in startCliSession
if (cliState !== 'not-started') return;  // ← Still sees 'stopped'!
```

### Execution Flow

1. User types command, `cliState` is `'stopped'` (from previous failure)
2. Code calls `setCliState('not-started')` - queues update, doesn't apply immediately
3. Code calls `await startCliSession()`
4. Inside `startCliSession`, guard reads `cliState` from closure - still `'stopped'`
5. Guard condition `if (cliState !== 'not-started') return;` passes → early return
6. No retry happens, user sees no error (silent failure)

### Why This Happens

The `cliState` dependency in `startCliSession`'s `useCallback` dependencies (line 101) means the function **closes over** the `cliState` value from the render when it was created. When called synchronously after `setCliState`, it sees the old value.

### Fix

**Option A: Force parameter (recommended)**
```typescript
const startCliSession = useCallback(async (force = false) => {
  if (!force && cliState !== 'not-started') return;

  setCliState('starting');
  // ... rest of implementation
}, [sessionId, cwd, cliState]);

// In handleSendCommand:
} else if (cliState === 'stopped') {
  await startCliSession(true);  // Force retry
}
```

**Option B: Relaxed guard**
```typescript
const startCliSession = useCallback(async () => {
  // Only prevent duplicate starts, allow retry from stopped
  if (cliState === 'running' || cliState === 'starting') return;

  setCliState('starting');
  // ... rest of implementation
}, [sessionId, cwd, cliState]);
```

---

## High Priority Issue: Input Sent Before Backend Ready

### Problem Statement

```typescript
// Line 329-334
send({
  type: 'input',
  sessionId: sessionId,
  payload: command,
  timestamp: new Date().toISOString(),
} as unknown as WorkspaceEvent);
```

This happens immediately after `await claudeCliService.startSession()` returns. However:

1. `startSession()` is a REST API call that returns as soon as backend creates the session object
2. Backend still needs to:
   - Spawn child process (`spawn('claude-cli', ...)`)
   - Wait for process to initialize
   - Set up stdout/stderr listeners
   - Mark session as `isRunning()`

This can take 100-500ms depending on system load.

### Backend Behavior

From `packages/backend/src/ws/handler.ts` line 109-130:

```typescript
case 'input':
  if (message.payload) {
    try {
      const cliSession = claudeCliManager.getSession(message.sessionId);
      if (cliSession && cliSession.isRunning()) {
        // ✅ Pipe input directly to Claude CLI stdin
        cliSession.sendInput(String(message.payload));
      } else {
        // ⚠️ Fallback: queue input for later processing
        await storage.queueInput(message.sessionId, message.payload);
        console.log(`[WS] Input queued (no active CLI session)`);
      }
    }
  }
  break;
```

**If input arrives before `isRunning()` is true:** Input gets queued in storage but **never consumed** (no dequeue mechanism visible in codebase).

### Impact

- User types command, presses Enter
- Frontend shows "$ {command}" in terminal (line 325)
- Input disappears into queue, never executes
- No feedback to user that command is waiting
- Appears as if command was ignored

### Fix Options

**Option A: Add readiness check**
```typescript
if (cliState === 'not-started') {
  await startCliSession();

  // Wait for backend confirmation
  const maxWait = 5000; // 5 seconds
  const startTime = Date.now();

  while (Date.now() - startTime < maxWait) {
    const status = await claudeCliService.getSessionStatus(sessionId);
    if (status.isRunning) break;
    await new Promise(r => setTimeout(r, 100));
  }
}
```

**Option B: Backend-side solution (better)**

Modify backend WS handler to:
1. Queue input if session not ready (already done)
2. Add dequeue mechanism: when `ClaudeCliSessionProcess` becomes ready, automatically flush queued input
3. Frontend doesn't need to change

```typescript
// In ClaudeCliSessionProcess.constructor
this.process.on('spawn', () => {
  this.running = true;
  this.flushQueuedInput();  // ← New method
});

private async flushQueuedInput() {
  const queued = await storage.getQueuedInput(this.sessionId);
  for (const input of queued) {
    this.sendInput(input);
  }
  await storage.clearQueuedInput(this.sessionId);
}
```

**Option C: Show pending state in UI**
```typescript
// Add loading state
const [isPending, setIsPending] = useState(false);

if (cliState === 'not-started') {
  setIsPending(true);
  terminal.writeln('\x1b[90mStarting session and sending command...\x1b[0m');
  await startCliSession();
  setIsPending(false);
}

// Disable input field while pending
<input
  disabled={isSending || isPending}
  // ...
/>
```

---

## Additional Observations

### Import Correctness ✅

```typescript
import { claudeCliService } from '../../services/claudeCliService';
```

Path is correct. Service is singleton exported from the module. No issues found.

### WebSocket Output Handling ✅

Lines 193-292 handle WebSocket events correctly:
- Event filtering by sessionId (line 201)
- Stream-json parsing for stdout (lines 219-273)
- Stderr handling (lines 213-217)
- CLI exit events (lines 279-288)
- Line buffering for partial chunks (lines 220-222)

No regressions detected.

### State Transitions

Current state machine:

```
not-started → starting → running
            ↓           ↓
          stopped ← ← ← ←
```

Issues:
- No transition from `stopped` back to `not-started` (retry broken)
- No timeout from `starting` to `stopped` (can hang forever)
- `starting` state is set but never actually checked (dead state)

Recommended state machine:

```
not-started → starting → running → stopped
    ↑           ↓                      ↓
    └──────── error ← ← ← ← ← ← ← ← ←
```

With explicit error state and retry mechanism.

---

## Recommendations

### Priority 1 (Critical - Blocks Core Feature)

1. **Fix race condition in handleSendCommand** - Use Option B (ref tracking) or Option A (remove check)
2. **Fix broken retry flow** - Use Option A (force parameter) or Option B (relaxed guard)
3. **Add backend readiness check** - Use Option B (backend dequeue) or Option A (frontend polling)

### Priority 2 (High - Poor UX)

4. **Reset state on error** - Add `setCliState('not-started')` in catch block
5. **Add timeout handling** - If `startCliSession` takes > 10s, show error and allow retry
6. **Show pending state** - Disable input, show spinner, indicate to user that session is starting

### Priority 3 (Medium - Code Quality)

7. **Remove dead code** - Delete unreachable `if (cliState === 'starting')` block
8. **Add TypeScript strict mode** - Many `as unknown as` casts suggest loose typing
9. **Extract state machine** - Consider XState or explicit state transition table

### Priority 4 (Low - Nice to Have)

10. **Add unit tests** - Mock WebSocket, test state transitions, verify error handling
11. **Add E2E test** - Verify auto-start flow end-to-end with real backend
12. **Improve terminal UX** - Add clear button, command history (up arrow), autocomplete

---

## Testing Checklist

Before deploying fix:

- [ ] Happy path: Type command on first load → session starts → command executes
- [ ] Error recovery: Fail first start → type command → retry works
- [ ] Race condition: Fast typing after load → verify input doesn't get lost
- [ ] Backend slow start: Delay backend spawn → verify input waits or queues correctly
- [ ] Multiple commands: Send command → wait → send another → verify both execute
- [ ] WebSocket disconnect: Kill WS connection → verify error shown to user
- [ ] Session limit: Start MAX_SESSIONS → verify new start shows clear error

---

## Contract Compliance

This review report follows `.claude/actionflows/CONTRACT.md` § Format 5.1: Review Report Structure.

**Required fields present:**
- ✅ Verdict: NEEDS_CHANGES
- ✅ Score: 72%
- ✅ Summary (3 sentences)
- ✅ Findings table (6 findings with all required columns)
- ✅ Fixes Applied (N/A for review-only)
- ✅ Flags for Human (3 architectural decisions)

**Severity distribution:**
- Critical: 1 (race condition causing input loss)
- High: 2 (broken retry + poor error recovery)
- Medium: 2 (timing issue + overly strict guard)
- Low: 1 (dead code)

**Dashboard compatibility:**
- Report parseable by `ReviewReportViewer` component
- Findings table renders in `FindingsTable` with severity badges
- Verdict banner shows NEEDS_CHANGES with 72% score
