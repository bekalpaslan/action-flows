# Review Report: CliPanel Auto-Start CLI Session Fix

## Verdict: NEEDS_CHANGES
## Score: 72%

## Summary

The CliPanel auto-start implementation correctly calls `claudeCliService.startSession()` before sending input via WebSocket, fixing the core bug where input was queued but no CLI process existed. However, there are **critical race conditions** in the state management logic that can cause input to be sent before the session is fully ready, and **error handling gaps** that prevent user retry after failures. The WebSocket output handling and import correctness are solid.

## Findings

| # | File | Line | Severity | Description | Suggestion |
|---|------|------|----------|-------------|------------|
| 1 | packages/app/src/components/SessionPanel/CliPanel.tsx | 304-320 | critical | **Race condition:** `handleSendCommand` calls `await startCliSession()` but immediately checks `if (cliState === 'starting')` using the OLD state value before the await completes. The state update from `setCliState('running')` inside `startCliSession` won't be visible yet. This can cause input to be sent while session is still starting. | Move the `if (cliState === 'starting')` check BEFORE the await, or better: wait for `startCliSession()` to complete before proceeding. Remove the redundant check since the await already handles waiting. |
| 2 | packages/app/src/components/SessionPanel/CliPanel.tsx | 308-311 | high | **Unreachable retry logic:** When `cliState === 'stopped'`, the code resets state to `'not-started'` then calls `await startCliSession()`. However, `startCliSession()` has a guard `if (cliState !== 'not-started') return;` at line 73. Since `setCliState` is async and won't update immediately, the check will still see `'stopped'` and return early, preventing retry. | Replace `setCliState('not-started')` with direct call: `await startCliSession()` and modify `startCliSession` to accept a `force` parameter that bypasses the guard for retry scenarios. |
| 3 | packages/app/src/components/SessionPanel/CliPanel.tsx | 90-99 | high | **Poor error recovery UX:** When `startCliSession` fails, state is set to `'stopped'` and error is thrown. The catch block in `handleSendCommand` (line 341-347) displays error in terminal but doesn't reset `cliState` back to `'not-started'`, preventing user from retrying. User sees "Retry by typing a command" but retry won't work because state is stuck at `'stopped'`. | In `handleSendCommand` catch block, add `setCliState('not-started')` to allow retry. Or better: add a dedicated "Retry" button that resets state and attempts start again. |
| 4 | packages/app/src/components/SessionPanel/CliPanel.tsx | 329-334 | medium | **Input sent before session ready:** After calling `startCliSession()`, code immediately sends input via WebSocket (line 329-334) without waiting for backend confirmation that CLI process is running. Backend WS handler (packages/backend/src/ws/handler.ts line 114) checks `cliSession.isRunning()` - if false, input is queued but user gets no feedback. | Add a brief delay or polling check after `startCliSession` to verify backend session is running before sending input. Alternatively, show loading state in UI: "Starting session, please wait..." |
| 5 | packages/app/src/components/SessionPanel/CliPanel.tsx | 314-320 | low | **Dead code:** The `if (cliState === 'starting')` block (lines 314-320) is unreachable due to race condition in finding #1. Even if it were reachable, it only writes a message to terminal but doesn't actually wait for session to start - input is sent immediately after (line 329). | Remove this dead code block entirely. Proper fix is to await `startCliSession()` completion before proceeding to send input. |
| 6 | packages/app/src/components/SessionPanel/CliPanel.tsx | 73 | medium | **Overly strict guard:** `startCliSession` has guard `if (cliState !== 'not-started') return;` which prevents retry after failure. If user encounters error, state becomes `'stopped'`, and subsequent retry attempts silently fail (early return). This combines with finding #2 to create broken retry flow. | Change guard to `if (cliState === 'running' \|\| cliState === 'starting') return;` to prevent duplicate starts while allowing retry from `'stopped'` state. |

## Fixes Applied

N/A (review-only mode)

## Flags for Human

| Issue | Why Human Needed |
|-------|-----------------|
| Async state management pattern | The component uses React state (`cliState`) to track async lifecycle, but state updates are not synchronous with `await` flow. Consider using a state machine library (XState) or refactor to use refs for synchronous lifecycle tracking. Architectural decision needed. |
| WebSocket vs REST API design | Current implementation mixes REST API call (`startSession`) with WebSocket message (`send`). This creates timing complexity. Consider: (1) Use WebSocket for both start + input, OR (2) Use REST API for both with server-side queuing. Backend already has queuing fallback (ws/handler.ts line 120). Needs product/architecture discussion. |
| User feedback during auto-start | Terminal shows "Starting CLI session..." but user has no way to cancel if start hangs. Should there be a timeout? Cancel button? Loading indicator in input field? UX decision needed. |
