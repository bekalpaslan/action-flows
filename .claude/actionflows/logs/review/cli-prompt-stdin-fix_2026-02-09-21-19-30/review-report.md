# Review Report: CLI Prompt Stdin Fix

## Verdict: APPROVED
## Score: 95%

## Summary

The fix correctly resolves the "Prompt is too long" error by moving the initial prompt from CLI arguments to stdin. The solution is architecturally sound and addresses the root cause (one-shot mode limitation in Claude CLI's `--print` with argument). The implementation uses the proper `spawn` event timing to ensure stdin is ready before sending input. Minor documentation improvements recommended but not blocking.

## Findings

| # | File | Line | Severity | Description | Suggestion |
|---|------|------|----------|-------------|------------|
| 1 | packages/backend/src/services/claudeCliManager.ts | 161-163 | low | Comment references "one-shot" behavior but doesn't explain what happens after one-shot | Consider expanding: "Claude CLI's --print mode with an argument is one-shot (accepts only that prompt) and rejects stdin follow-ups with 'Prompt is too long' error, making multi-turn conversations impossible." |
| 2 | packages/backend/src/services/claudeCliManager.ts | 280-283 | low | No error handling for sendInput call | Wrap in try-catch to handle edge cases where process might have exited between start() completion and sendInput() call |

## Fixes Applied

N/A (review-only mode)

## Flags for Human

None — All changes are correct and safe to merge.

---

## Detailed Analysis

### 1. **Correctness — PASS**

The fix correctly addresses the root cause:
- **Problem identified correctly:** CLI `--print` mode with argument is one-shot only
- **Solution is sound:** Sending initial prompt via stdin after process starts
- **Timing is safe:** Uses `spawn` event (line 110-113 in claudeCliSession.ts) which guarantees stdin is available

### 2. **Race Condition Check — PASS**

**Critical Question:** Is `session.sendInput(prompt)` called after process is fully started?

**Answer: YES — Safe timing guaranteed by `spawn` event**

The sequence is:
1. Line 277: `await session.start()` — This returns a Promise that resolves on `spawn` event
2. Line 110-113 (claudeCliSession.ts): The `spawn` event fires when subprocess is ready and stdin is open
3. Line 280-283: `session.sendInput(prompt)` — Only called AFTER start() resolves (spawn complete)

**Verification:**
- `start()` is async and awaits the `spawn` event (line 110-113)
- `sendInput()` checks `this.process.stdin.writable` (line 131-133) before writing
- No race condition possible

### 3. **Comments Accuracy — PASS (with minor note)**

- Line 161-163: Accurately explains why NOT to pass prompt as CLI arg
- Line 185-186: Clear NOTE referencing the explanation
- Line 281-283: Accurate comment explaining stdin prompt send

**Minor improvement suggested:** The comment at line 161-163 could be more explicit about the error message ("Prompt is too long") for future debugging.

### 4. **Other Files Check — PASS**

Verified all files that interact with `claudeCliManager.startSession()`:
- **claudeCli.ts (line 48-56):** Still passes `prompt` parameter — CORRECT (manager now handles it via stdin)
- **ws/handler.ts (line 113-116):** Uses `sendInput()` for follow-up messages — CORRECT (unchanged)

No other files need changes. The API contract remains the same.

### 5. **Type Check — PASS**

According to changes.md, type check passed for backend package. Pre-existing frontend type errors are unrelated to this change.

### 6. **Security — PASS**

- `sendInput()` already validates input (length < 100KB, no null bytes) — line 136-143 in claudeCliSession.ts
- No new injection vectors introduced
- Stdin communication is properly encapsulated

### 7. **Behavioral Change — CORRECT**

**Before:** Prompt passed as CLI argument → One-shot mode → Follow-up stdin rejected
**After:** Prompt sent via stdin after start → Multi-turn conversation mode → Follow-up stdin accepted

This is the INTENDED behavior change and fixes the bug.

---

## Fresh Eye Observations

**[FRESH EYE]** The `sendInput()` method (line 280-283) is called synchronously after `await session.start()` without error handling. While the `spawn` event guarantees stdin is ready, there's a theoretical edge case where the process could exit immediately after spawning (e.g., if Claude CLI detects invalid config). Consider adding a try-catch:

```typescript
// If initial prompt provided, send it as the first stdin message
if (prompt) {
  try {
    session.sendInput(prompt);
  } catch (error) {
    console.warn(`[ClaudeCliManager] Failed to send initial prompt:`, error);
    // Process will continue, client will receive error via stderr events
  }
}
```

This is non-blocking because:
1. The error is already logged in `sendInput()` (line 153)
2. The process exit handler (line 225-266) will catch process failures
3. Client receives all output via WebSocket events

---

## Recommendation

**APPROVED for merge.** The fix is correct, safe, and addresses the root cause. The two findings above are minor documentation/defensive-coding improvements that can be addressed in follow-up work if desired, but are not blockers.
