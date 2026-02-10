# CliPanel Race Condition Fixes

## Date
2026-02-09

## Summary
Fixed critical race conditions in `CliPanel.tsx` auto-start CLI session logic. All five identified issues have been resolved.

## Files Modified
- `packages/app/src/components/SessionPanel/CliPanel.tsx`

## Changes

### 1. Added Synchronous State Tracking (CRITICAL)
**Issue:** `handleSendCommand` awaited `startCliSession()` but read stale `cliState` from closure. React state updates are async.

**Fix:** Added `cliStateRef` useRef for synchronous state tracking:
```typescript
const cliStateRef = useRef<CliSessionState>('not-started');

const setCliStateSync = useCallback((state: CliSessionState) => {
  cliStateRef.current = state;
  setCliState(state);
}, []);
```

All state updates now use `setCliStateSync()` to update both ref (immediate) and state (for UI).

### 2. Fixed startCliSession Return Value (MEDIUM)
**Issue:** Backend may still be spawning when input is sent. No signal if start succeeded.

**Fix:** Changed `startCliSession()` to return `Promise<boolean>`:
- Returns `true` if session successfully started
- Returns `false` if session failed to start
- Early return `true` if already running

### 3. Fixed Retry Logic (HIGH)
**Issue:** When `cliState === 'stopped'`, code reset to `'not-started'` then called `startCliSession()`, but guard checked closure value.

**Fix:** Changed `startCliSession` guard to:
```typescript
if (cliStateRef.current !== 'not-started' && cliStateRef.current !== 'stopped') {
  return cliStateRef.current === 'running'; // Already running
}
```

Now allows retry from 'stopped' state.

### 4. Fixed Error Recovery (HIGH)
**Issue:** Poor error recovery - state set to `'stopped'` and error thrown, but catch block didn't reset state.

**Fix:** `startCliSession` now returns `false` on error instead of throwing. Caller checks return value:
```typescript
const started = await startCliSession();
if (!started) {
  setIsSending(false);
  return;
}
```

### 5. Removed Dead Code (CLEANUP)
**Issue:** The `if (cliState === 'starting')` block in `handleSendCommand` was unreachable and confusing.

**Fix:** Removed the dead code. New logic waits for `startCliSession()` Promise to resolve, checking its boolean return value.

### 6. Simplified handleSendCommand Logic
**Before:**
```typescript
if (cliState === 'not-started') {
  await startCliSession();
} else if (cliState === 'stopped') {
  setCliState('not-started');
  await startCliSession();
}

if (cliState === 'starting') { /* unreachable */ }

// Send input (may send before backend ready!)
```

**After:**
```typescript
if (cliStateRef.current !== 'running') {
  const started = await startCliSession();
  if (!started) {
    setIsSending(false);
    return;
  }
}

// Only send input if session confirmed running
```

## Technical Details

### Race Condition Analysis
1. **Closure State Problem:** Async function captures state at invocation time. By the time `await` resolves, state may have changed, but function still sees old value.
2. **React State Batching:** `setState` doesn't update immediately. Next line of code still sees old value.
3. **Solution:** useRef for synchronous reads + setState for UI updates.

### State Synchronization Pattern
```typescript
// WRONG - reads stale closure value
if (cliState === 'stopped') {
  setCliState('not-started');
  await startCliSession(); // Guard checks OLD cliState value
}

// CORRECT - ref updated immediately
if (cliStateRef.current !== 'running') {
  const started = await startCliSession(); // Uses ref internally
  if (!started) return;
}
```

## Testing Recommendations
1. Test auto-start from 'not-started' state
2. Test retry from 'stopped' state after failed start
3. Test rapid command input during session startup
4. Test command input when backend spawn fails
5. Test multiple quick commands in succession

## Dependencies
- No new dependencies added
- Maintains existing xterm.js integration
- Maintains WebSocket integration pattern

## Type Safety
All changes are fully type-safe:
- `cliStateRef` typed as `useRef<CliSessionState>`
- `setCliStateSync` typed as `(state: CliSessionState) => void`
- `startCliSession` return type changed to `Promise<boolean>`

## Backward Compatibility
✅ No breaking changes
✅ Component props unchanged
✅ WebSocket message format unchanged
✅ Terminal display behavior unchanged
