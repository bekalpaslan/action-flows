# Code Changes: cli-prompt-stdin-fix

## Files Modified

| File | Change |
|------|--------|
| packages/backend/src/services/claudeCliManager.ts | Fixed architecture mismatch: stopped passing initial prompt as CLI argument, now sending via stdin instead |

## Files Created

None.

## Summary

Fixed the "Prompt is too long" error by correcting the architecture mismatch in claudeCliManager.ts.

**Root cause:** The code was passing the initial prompt as a command-line argument to `claude --print`, but Claude CLI's `--print` mode with an initial prompt argument is one-shot and rejects stdin follow-ups with "Prompt is too long".

**Solution:**
1. Removed code that pushed prompt to CLI args (lines 182-185)
2. Added code to send prompt via `session.sendInput(prompt)` after process starts (line 281-283)
3. Added explanatory comments to prevent future regression (lines 161-163, 185-186)

## Changes Detail

### 1. Updated comment block (lines 157-163)
Added IMPORTANT note explaining why the initial prompt should NOT be passed as a CLI argument, referencing the one-shot limitation of `--print` mode.

### 2. Removed prompt from CLI args (lines 185-186)
Replaced the original code:
```typescript
// Add prompt if provided (required for --print mode)
if (prompt) {
  args.push(prompt);
}
```

With a NOTE comment:
```typescript
// NOTE: Do NOT add prompt to args. It will be sent via stdin after process starts.
// See comment at line 161-163 for explanation.
```

### 3. Send prompt via stdin (lines 280-283)
Added after `await session.start()`:
```typescript
// If initial prompt provided, send it as the first stdin message
if (prompt) {
  session.sendInput(prompt);
}
```

## Verification

- Type check: PASS (backend package)
- Notes: Pre-existing frontend type errors unrelated to this change

## Expected Behavior After Fix

1. When `POST /api/claude-cli/sessions` is called with a prompt, the CLI process will start with `--print` mode and stream-json flags
2. The initial prompt will be sent as the first stdin message after the process starts
3. Follow-up messages via `POST /api/claude-cli/sessions/:id/input` will now work correctly without "Prompt is too long" errors
4. The CLI will accept multi-turn conversations in stream-json mode
