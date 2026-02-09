# Code Changes: WS Input CLI Pipe

## Files Modified

| File | Change |
|------|--------|
| `packages/backend/src/ws/handler.ts` | Added direct piping of WebSocket `input` messages to running Claude CLI session stdin. Import `claudeCliManager`, check if CLI session exists and is running, pipe input via `sendInput()`, fallback to `storage.queueInput()` if no CLI session or on error. Added comprehensive error handling and logging. |

## Files Created

None - only modified existing file.

## Implementation Details

### Changes to handler.ts

1. **Import Addition (line 6):**
   - Added import: `import { claudeCliManager } from '../services/claudeCliManager.js';`
   - This provides access to the singleton CLI manager instance

2. **Input Case Handler (lines 109-130):**
   - Previously: Simple `storage.queueInput()` call
   - Now: Three-tier approach:
     1. **Primary path:** Try to get CLI session via `claudeCliManager.getSession()`
        - If session exists and `isRunning()`: call `sendInput(String(message.payload))`
        - Log: "Input piped to CLI session"
     2. **Fallback path:** If no CLI session or not running:
        - Call `storage.queueInput()` (existing behavior preserved)
        - Log: "Input queued (no active CLI session)"
     3. **Error path:** Catch any errors during piping:
        - Log error details
        - Call `storage.queueInput()` as fallback
        - Log: "Input queued (piping failed)"

### Type Safety

- Uses `SessionId` branded type from `@afw/shared`
- Validates session existence and running state via `isRunning()` method
- Converts payload to string via `String()` for stdin write
- Preserves all existing error handling and validation logic

### Backward Compatibility

- **Preserved existing behavior:** `storage.queueInput()` still called as fallback
- No breaking changes to WebSocket message format
- No changes to other message types (subscribe, unsubscribe, ping)
- Maintains all existing security checks (API key validation, rate limiting, session ownership)

## Verification

- **Type check:** ✅ PASS
- **Notes:** All TypeScript compilation successful across all packages
- **Testing recommendation:** Test with active CLI session to verify stdin piping works correctly
- **Deployment note:** No schema changes, safe to deploy without migration

## Technical Notes

### How It Works

When a WebSocket client sends an `input` message:
1. Message validated via `wsMessageSchema` (existing validation)
2. Handler checks if `claudeCliManager` has a running CLI session for this `sessionId`
3. If yes: writes directly to the child process stdin via `sendInput()`
4. The Claude CLI process receives the input as if typed by a user
5. CLI output captured via stdout/stderr handlers (existing functionality)
6. Output broadcast back to WebSocket clients via existing event system

### Integration Points

- **claudeCliManager:** Singleton service managing all CLI sessions
- **ClaudeCliSessionProcess:** Wraps individual CLI subprocess with bidirectional I/O
- **sendInput():** Writes to stdin with validation (max 100KB, no null bytes, newline-terminated)
- **storage.queueInput():** Existing queue mechanism, now used only as fallback

### Security Considerations

- Input validated at multiple layers:
  - WebSocket message validation (existing)
  - Rate limiting (existing)
  - Session ownership check (existing)
  - CLI session state validation (new)
  - stdin input validation in `sendInput()` (existing in ClaudeCliSession)
- Error handling prevents crashes on invalid input or session state

## Follow-up Recommendations

1. **Frontend Integration:** Update frontend to send `input` messages when user types in terminal
2. **Testing:** Add integration tests for WS input → CLI stdin pipeline
3. **Monitoring:** Add metrics for piping success/failure rates
4. **Documentation:** Update API docs to reflect input piping behavior
