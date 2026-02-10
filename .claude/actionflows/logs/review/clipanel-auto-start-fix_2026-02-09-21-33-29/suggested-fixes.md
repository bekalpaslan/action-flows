# Suggested Fixes for CliPanel Auto-Start

This document provides copy-paste ready code fixes for the issues identified in the review.

---

## Fix #1: Race Condition in handleSendCommand (CRITICAL)

**File:** `packages/app/src/components/SessionPanel/CliPanel.tsx`

**Current Code (Lines 297-351):**
```typescript
const handleSendCommand = useCallback(async () => {
  if (!commandInput.trim() || isSending) return;

  setIsSending(true);
  const command = commandInput.trim();

  try {
    // Start CLI session if not already started
    if (cliState === 'not-started') {
      await startCliSession();
    } else if (cliState === 'stopped') {
      // Retry start if previously failed
      setCliState('not-started');
      await startCliSession();
    }

    // Wait if session is still starting
    if (cliState === 'starting') {
      const terminal = terminalInstanceRef.current;
      if (terminal) {
        terminal.writeln('\x1b[90mWaiting for CLI session to start...\x1b[0m');
      }
      // Session will be ready when startCliSession completes
    }

    // Echo command to terminal
    const terminal = terminalInstanceRef.current;
    if (terminal) {
      terminal.writeln(`\x1b[1;32m$ ${command}\x1b[0m`);
    }

    // Send command via WebSocket
    send({
      type: 'input',
      sessionId: sessionId,
      payload: command,
      timestamp: new Date().toISOString(),
    } as unknown as WorkspaceEvent);

    onCommand?.(command);
    setCommandInput('');
  } catch (error) {
    const terminal = terminalInstanceRef.current;
    if (terminal) {
      terminal.writeln(
        `\x1b[1;31mError sending command: ${error instanceof Error ? error.message : 'Unknown error'}\x1b[0m`
      );
    }
  } finally {
    setIsSending(false);
  }
}, [commandInput, isSending, sessionId, onCommand, send, cliState, startCliSession]);
```

**Fixed Code:**
```typescript
const handleSendCommand = useCallback(async () => {
  if (!commandInput.trim() || isSending) return;

  setIsSending(true);
  const command = commandInput.trim();
  const terminal = terminalInstanceRef.current;

  try {
    // Start CLI session if not already started or stopped
    if (cliState === 'not-started' || cliState === 'stopped') {
      if (terminal) {
        terminal.writeln('\x1b[90mStarting CLI session...\x1b[0m');
      }
      await startCliSession(true); // Force parameter to allow retry
    }

    // Verify session is ready before sending input
    let retries = 0;
    const maxRetries = 20; // 2 seconds total (20 * 100ms)
    while (retries < maxRetries) {
      try {
        const status = await claudeCliService.getSessionStatus(sessionId);
        if (status.isRunning) break;
      } catch {
        // Session not found yet, continue polling
      }
      await new Promise(resolve => setTimeout(resolve, 100));
      retries++;
    }

    if (retries >= maxRetries) {
      throw new Error('CLI session failed to start within timeout');
    }

    // Echo command to terminal
    if (terminal) {
      terminal.writeln(`\x1b[1;32m$ ${command}\x1b[0m`);
    }

    // Send command via WebSocket
    send({
      type: 'input',
      sessionId: sessionId,
      payload: command,
      timestamp: new Date().toISOString(),
    } as unknown as WorkspaceEvent);

    onCommand?.(command);
    setCommandInput('');
  } catch (error) {
    if (terminal) {
      terminal.writeln(
        `\x1b[1;31mError: ${error instanceof Error ? error.message : 'Unknown error'}\x1b[0m`
      );
      terminal.writeln('\x1b[90mType a command to retry.\x1b[0m');
    }
    // Reset state to allow retry
    setCliState('not-started');
  } finally {
    setIsSending(false);
  }
}, [commandInput, isSending, sessionId, onCommand, send, cliState, startCliSession]);
```

**Key Changes:**
1. ✅ Removed dead code (`if (cliState === 'starting')` check)
2. ✅ Merged `not-started` and `stopped` conditions
3. ✅ Added `force` parameter to `startCliSession` call
4. ✅ Added polling loop to verify backend readiness
5. ✅ Added timeout (2 seconds) with clear error message
6. ✅ Reset state to `'not-started'` on error (enables retry)

---

## Fix #2: Broken Retry Logic in startCliSession (CRITICAL)

**File:** `packages/app/src/components/SessionPanel/CliPanel.tsx`

**Current Code (Lines 72-101):**
```typescript
const startCliSession = useCallback(async () => {
  if (cliState !== 'not-started') return;

  setCliState('starting');
  const terminal = terminalInstanceRef.current;

  try {
    if (terminal) {
      terminal.writeln('\x1b[90mStarting Claude CLI session...\x1b[0m');
    }

    await claudeCliService.startSession(sessionId, cwd);

    setCliState('running');
    if (terminal) {
      terminal.writeln('\x1b[1;32m✓ CLI session ready\x1b[0m');
      terminal.writeln('');
    }
  } catch (error) {
    setCliState('stopped');
    if (terminal) {
      terminal.writeln(
        `\x1b[1;31m✗ Failed to start CLI session: ${error instanceof Error ? error.message : 'Unknown error'}\x1b[0m`
      );
      terminal.writeln('\x1b[90mRetry by typing a command.\x1b[0m');
      terminal.writeln('');
    }
    throw error;
  }
}, [sessionId, cwd, cliState]);
```

**Fixed Code:**
```typescript
const startCliSession = useCallback(async (force = false) => {
  // Prevent duplicate starts, but allow retry from stopped state
  if (!force && (cliState === 'starting' || cliState === 'running')) {
    return;
  }

  setCliState('starting');
  const terminal = terminalInstanceRef.current;

  try {
    if (terminal) {
      terminal.writeln('\x1b[90mStarting Claude CLI session...\x1b[0m');
    }

    await claudeCliService.startSession(sessionId, cwd);

    setCliState('running');
    if (terminal) {
      terminal.writeln('\x1b[1;32m✓ CLI session ready\x1b[0m');
      terminal.writeln('');
    }
  } catch (error) {
    setCliState('stopped');
    if (terminal) {
      terminal.writeln(
        `\x1b[1;31m✗ Failed to start CLI session: ${error instanceof Error ? error.message : 'Unknown error'}\x1b[0m`
      );
      terminal.writeln('\x1b[90mRetry by typing a command.\x1b[0m');
      terminal.writeln('');
    }
    throw error;
  }
}, [sessionId, cwd, cliState]);
```

**Key Changes:**
1. ✅ Added `force` parameter to bypass guard for retry scenarios
2. ✅ Changed guard from `if (cliState !== 'not-started')` to explicit check for running/starting states
3. ✅ Allows retry when `cliState === 'stopped'`

---

## Fix #3: Add Missing Import (if needed)

**File:** `packages/app/src/components/SessionPanel/CliPanel.tsx`

**Verify this import exists at the top:**
```typescript
import { claudeCliService } from '../../services/claudeCliService';
```

**Current imports (Lines 16-23):**
```typescript
import React, { useEffect, useRef, useCallback, useState } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from '@xterm/addon-fit';
import type { SessionId, ClaudeCliOutputEvent, WorkspaceEvent } from '@afw/shared';
import { useWebSocketContext } from '../../contexts/WebSocketContext';
import { claudeCliService } from '../../services/claudeCliService';  // ← PRESENT ✅
import 'xterm/css/xterm.css';
import './CliPanel.css';
```

**Status:** ✅ Import already exists, no change needed.

---

## Fix #4: Optional UX Improvement - Add Visual Loading State

**File:** `packages/app/src/components/SessionPanel/CliPanel.tsx`

**Add state variable (after line 59):**
```typescript
const [isStartingSession, setIsStartingSession] = useState(false);
```

**Update handleSendCommand (wrap start logic):**
```typescript
try {
  if (cliState === 'not-started' || cliState === 'stopped') {
    setIsStartingSession(true);  // ← Add this
    if (terminal) {
      terminal.writeln('\x1b[90mStarting CLI session...\x1b[0m');
    }
    await startCliSession(true);

    // ... polling loop ...

    setIsStartingSession(false);  // ← Add this
  }
  // ... rest of code
} catch (error) {
  setIsStartingSession(false);  // ← Add this in catch too
  // ... error handling
}
```

**Update input field disabled state (line 416):**
```typescript
<input
  type="text"
  className="cli-input-field"
  value={commandInput}
  onChange={(e) => setCommandInput(e.target.value)}
  onKeyDown={handleKeyDown}
  placeholder={isStartingSession ? "Starting session..." : "Type command..."}
  disabled={isSending || isStartingSession}  // ← Add isStartingSession
  aria-label="Command input"
/>
```

**Update send button disabled state (line 422):**
```typescript
<button
  className="cli-send-button"
  onClick={handleSendCommand}
  disabled={!commandInput.trim() || isSending || isStartingSession}  // ← Add isStartingSession
  aria-label="Send command"
>
```

---

## Testing Script

After applying fixes, test with this script:

```bash
# Terminal 1: Start backend
cd D:/ActionFlowsDashboard
pnpm dev:backend

# Terminal 2: Start frontend
pnpm dev:app

# In browser DevTools Console:

// Test 1: Happy path - auto start on first command
// 1. Open CliPanel for a session
// 2. Type "hello" in input field
// 3. Press Enter
// 4. Verify: Terminal shows "Starting CLI session..." then "✓ CLI session ready" then "$ hello"
// 5. Verify: Claude responds with output

// Test 2: Error recovery - backend failure then retry
// 1. Stop backend (Ctrl+C in Terminal 1)
// 2. Type "test" and press Enter
// 3. Verify: Error shown "Failed to start CLI session"
// 4. Start backend again (pnpm dev:backend)
// 5. Type "test" again and press Enter
// 6. Verify: Session starts successfully this time

// Test 3: Race condition - fast typing
// 1. Refresh page (clear session state)
// 2. Quickly type "help" and press Enter (before session starts)
// 3. Verify: Input doesn't get lost, command executes after session ready

// Test 4: Multiple commands
// 1. After session running, type "ls" and press Enter
// 2. Wait for response
// 3. Type "pwd" and press Enter
// 4. Verify: Both commands execute in order

// Test 5: Timeout handling
// 1. Add artificial delay in backend startSession (sleep 10s)
// 2. Type command
// 3. Verify: After 2 seconds, shows "CLI session failed to start within timeout"
// 4. Remove delay, type command again
// 5. Verify: Retry works
```

---

## Diff Summary

**Files Changed:** 1
- `packages/app/src/components/SessionPanel/CliPanel.tsx`

**Lines Changed:** ~50 (out of 453 total lines = 11% of file)

**Functions Modified:** 2
- `startCliSession` (added force parameter, relaxed guard)
- `handleSendCommand` (fixed race condition, added polling, improved error recovery)

**Backwards Compatibility:** ✅ Yes
- All existing WebSocket output handling unchanged
- Terminal initialization unchanged
- Component props interface unchanged
- No breaking changes to parent components

**TypeScript Errors:** None expected
- All type signatures remain compatible
- `force` parameter is optional (defaults to false)
- Polling uses existing `getSessionStatus` API

---

## Verification Checklist

Before merging:

- [ ] Apply Fix #1 (handleSendCommand)
- [ ] Apply Fix #2 (startCliSession)
- [ ] Run `pnpm type-check` - no errors
- [ ] Run `pnpm lint` - no new warnings
- [ ] Test happy path (auto-start works)
- [ ] Test error recovery (retry works)
- [ ] Test race condition (fast typing doesn't lose input)
- [ ] Test multiple commands (session persists)
- [ ] Review console logs (no unexpected errors)
- [ ] Check browser DevTools Network tab (API calls look correct)
- [ ] Verify WebSocket messages (input sent after session ready)
