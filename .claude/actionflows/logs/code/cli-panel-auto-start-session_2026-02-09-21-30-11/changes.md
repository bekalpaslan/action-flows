# CLI Panel Auto-Start Session Fix

## Summary

Fixed CliPanel to automatically start a Claude CLI session before sending input. Previously, when users typed commands and pressed Enter, the WebSocket would send an `input` message but no Claude CLI process was running, causing the backend to log: `"Input queued for session ... (no active CLI session)"`.

## Changes Made

### File: `packages/app/src/components/SessionPanel/CliPanel.tsx`

#### 1. Added Import
- Imported `claudeCliService` from `../../services/claudeCliService`

#### 2. Added Props
- Added `cwd?: string` prop (defaults to `'D:/ActionFlowsDashboard'`)

#### 3. Added Types
- Added `CliSessionState` type: `'not-started' | 'starting' | 'running' | 'stopped'`

#### 4. Added State
- Added `cliState` state variable to track CLI session lifecycle

#### 5. Added `startCliSession` Function
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

#### 6. Updated `handleSendCommand` Function
- Now checks `cliState` before sending input
- Auto-starts CLI session if state is `'not-started'`
- Retries start if state is `'stopped'` (from previous failure)
- Provides user feedback during session startup

#### 7. Updated Exit Event Handler
- Sets `cliState` to `'stopped'` when CLI session exits
- Allows users to restart by typing a new command

## User Experience

### Before
1. User types command and presses Enter
2. Input is sent via WebSocket but no CLI process exists
3. Backend logs: "Input queued for session ... (no active CLI session)"
4. No terminal output, command is lost

### After
1. User types command and presses Enter
2. Terminal shows: "Starting Claude CLI session..."
3. `claudeCliService.startSession()` is called with sessionId and cwd
4. Terminal shows: "✓ CLI session ready"
5. Command is echoed and sent via WebSocket
6. Backend receives input and pipes it to the running CLI process
7. User sees Claude CLI output in the terminal

### Error Handling
- If session fails to start, terminal shows error message
- State is set to `'stopped'`
- User can retry by typing a new command
- Terminal shows: "Retry by typing a command."

### Session Lifecycle
- **not-started** → Initial state, no CLI process spawned yet
- **starting** → `startSession()` in progress, user sees "Starting..." message
- **running** → CLI process is running, input can be sent
- **stopped** → CLI process exited or failed, can be restarted on next command

## Technical Details

### API Call
```typescript
claudeCliService.startSession(sessionId, cwd)
```

### Backend Endpoint
`POST /api/claude-cli/start`

### Default Working Directory
`D:/ActionFlowsDashboard` (project root)

### WebSocket Flow (After Fix)
1. Component calls `claudeCliService.startSession()` (REST API)
2. Backend spawns Claude CLI process for the session
3. Component sends input via WebSocket `type: 'input'`
4. Backend pipes WebSocket input to CLI process stdin
5. CLI process stdout/stderr is broadcast via WebSocket `type: 'claude-cli:output'`
6. Component receives output events and displays in xterm.js terminal

## Files Modified

- `D:/ActionFlowsDashboard/packages/app/src/components/SessionPanel/CliPanel.tsx`

## Type Safety

No new TypeScript errors introduced. The existing type check errors in the project are unrelated to these changes.

## Testing Recommendations

1. Open CliPanel component
2. Type a command (e.g., "help")
3. Press Enter
4. Verify terminal shows:
   - "Starting Claude CLI session..."
   - "✓ CLI session ready"
   - "$ help"
   - Claude CLI output
5. Type another command
6. Verify it works without re-starting the session
7. Test error handling by stopping the backend during session start
8. Verify retry works after failure
