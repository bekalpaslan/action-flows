# Chat Panel Reactivity Bug Analysis

**Aspect:** Structure & Data Flow
**Scope:** ChatPanel.tsx, useChatMessages.ts, useWebSocket.ts, WebSocketContext.tsx
**Date:** 2026-02-10
**Agent:** analyze/

---

## 1. Executive Summary

**Problem:** New chat messages arrive via WebSocket but don't trigger React re-renders in the ChatPanel component. Messages only appear after user switches tabs (forcing a re-render).

**Root Cause:** Stale closure in the WebSocket event listener. The `handleMessage` callback in `useWebSocket.ts` is wrapped in `useCallback` with `onEvent` in the dependency array (line 94), but the `onEvent` function in `WebSocketContext.tsx` is also wrapped in `useCallback` with an empty dependency array (line 54). This creates a closure over the initial `eventCallbacksRef.current` Set, which never gets updated when new listeners register.

**Impact:** Critical UX failure - Claude's responses appear to be missing until user accidentally triggers a re-render.

---

## 2. Data Flow Trace (WS → UI)

### Step 1: WebSocket Message Arrival
**File:** `packages/app/src/hooks/useWebSocket.ts` (lines 151-154)

```typescript
ws.addEventListener('message', (event) => {
  resetHeartbeat();
  handleMessage(event);
});
```

**Status:** ✅ Working - Events are received

---

### Step 2: Event Parsing & Dispatch
**File:** `packages/app/src/hooks/useWebSocket.ts` (lines 50-95)

```typescript
const handleMessage = useCallback(
  (event: MessageEvent) => {
    // ... parse JSON, unwrap payload ...
    if (isSessionLifecycleEvent || subscribedSessionsRef.current.has(data.sessionId)) {
      onEvent?.(data as WorkspaceEvent); // ⚠️ Calls onEvent from context
    }
  },
  [onEvent] // ⚠️ Dependency on onEvent
);
```

**Status:** ✅ Working - Parses correctly, calls `onEvent`

**Issue Begins Here:** The `onEvent` function comes from context and changes identity when wrapped in `useCallback`.

---

### Step 3: Context Event Broadcasting
**File:** `packages/app/src/contexts/WebSocketContext.tsx` (lines 34-36, 45-55)

```typescript
// This function is created ONCE with empty deps
const handleEvent = useCallback((event: WorkspaceEvent) => {
  eventCallbacksRef.current.forEach(callback => callback(event));
}, []); // ⚠️ Empty dependency array - STALE CLOSURE

const registerEventCallback = useCallback(
  (callback: (event: WorkspaceEvent) => void) => {
    eventCallbacksRef.current.add(callback); // ✅ Ref gets updated
    return () => {
      eventCallbacksRef.current.delete(callback);
    };
  },
  [] // ⚠️ Empty dependency array
);
```

**Status:** ⚠️ **BROKEN - Root Cause Identified**

**Problem:**
- `handleEvent` is passed to `useWebSocket` as the `onEvent` prop (line 40)
- Because `handleEvent` has empty deps, it closes over the INITIAL `eventCallbacksRef.current` Set
- When components register new callbacks via `registerEventCallback`, they modify the ref
- But `handleEvent` still has a closure over the OLD empty Set
- Result: New callbacks are never invoked

**Why it works after tab switch:**
- Tab switch causes full component re-mount
- Re-mount creates a NEW `handleEvent` closure with the current ref value
- This temporarily appears to work until the next callback registration

---

### Step 4: Message State Update (never reached)
**File:** `packages/app/src/hooks/useChatMessages.ts` (lines 63-196)

```typescript
useEffect(() => {
  if (!onEvent) return;

  const unsubscribeEvent = onEvent((event: WorkspaceEvent) => {
    // ... handle chat:message events ...
    setMessages(prev => [...prev, chatMsg]); // ❌ Never called
  });

  return unsubscribeEvent;
}, [sessionId, onEvent]); // ⚠️ onEvent dependency causes re-registration
```

**Status:** ❌ Never executes - callback is registered but never invoked

---

### Step 5: Component Re-render (never triggered)
**File:** `packages/app/src/components/SessionPanel/ChatPanel.tsx` (line 137)

```typescript
const { messages, addUserMessage } = useChatMessages(sessionId);
```

**Status:** ❌ No re-render - `messages` state never updates

---

## 3. Closure Chain Breakdown

```
useWebSocket (handleMessage)
  ↓ calls
WebSocketContext (handleEvent) ← STALE CLOSURE over empty Set
  ↓ should iterate
eventCallbacksRef.current ← Ref is updated correctly
  ↓ but iteration never happens
useChatMessages (event handler) ← Never invoked
  ↓ never calls
setMessages(...)
  ↓ never triggers
ChatPanel re-render
```

---

## 4. Why Tab Switch "Fixes" It

When user switches tabs:
1. Component unmounts/remounts OR React's reconciliation triggers
2. New effect runs in `useChatMessages`
3. New callback registered via `onEvent`
4. Ref gets NEW callback added
5. BUT: Still using stale `handleEvent` closure
6. However, if WebSocket reconnects OR new event arrives during re-mount window, the new closure gets picked up
7. Messages appear (temporarily)

This is NOT a real fix - it's a race condition that occasionally works.

---

## 5. Verification of Root Cause

### Evidence 1: Console Logs
The debug logs in `useChatMessages.ts` line 67 show:
```
[CHAT-DEBUG] event received: chat:message session: <id> expected: <id> match: true
```

This proves:
- WebSocket events ARE arriving
- Session IDs match correctly
- Event handlers ARE registered
- But `setMessages` is never called (no subsequent logs)

### Evidence 2: Callback Registration Timing
- `useChatMessages` effect runs with `[sessionId, onEvent]` deps (line 196)
- Every time `onEvent` changes identity, callback re-registers
- But `handleEvent` already has stale closure by then

### Evidence 3: Empty Dependency Arrays
- `handleEvent` in WebSocketContext.tsx line 36: `[]`
- `registerEventCallback` in WebSocketContext.tsx line 54: `[]`
- These create permanent closures that never update

---

## 6. Fix Strategy

### Option A: Remove useCallback Wrapper (Simple)
**File:** `packages/app/src/contexts/WebSocketContext.tsx`

```typescript
// Remove useCallback from handleEvent
const handleEvent = (event: WorkspaceEvent) => {
  eventCallbacksRef.current.forEach(callback => callback(event));
};
```

**Pros:** Simple, direct fix
**Cons:** `handleEvent` changes identity on every render, causing `useWebSocket` to re-register

---

### Option B: Add Ref Indirection (Recommended)
**File:** `packages/app/src/contexts/WebSocketContext.tsx`

```typescript
// Stable callback that always uses current ref
const handleEvent = useCallback((event: WorkspaceEvent) => {
  // Access ref at CALL TIME, not closure time
  const callbacks = Array.from(eventCallbacksRef.current);
  callbacks.forEach(callback => callback(event));
}, []); // Empty deps OK because we access ref dynamically
```

**Pros:** Maintains stable identity, no re-registrations
**Cons:** Requires understanding of closure timing

---

### Option C: Use Ref for Handler (Alternative)
**File:** `packages/app/src/contexts/WebSocketContext.tsx`

```typescript
const handleEventRef = useRef((event: WorkspaceEvent) => {
  eventCallbacksRef.current.forEach(callback => callback(event));
});

// Update ref on every render
handleEventRef.current = (event: WorkspaceEvent) => {
  eventCallbacksRef.current.forEach(callback => callback(event));
};

const { status, error, send, subscribe, unsubscribe } = useWebSocket({
  url,
  onEvent: (event) => handleEventRef.current(event), // Stable wrapper
  reconnectInterval: 3000,
  heartbeatInterval: 30000,
});
```

**Pros:** Most explicit about mutation timing
**Cons:** More verbose

---

## 7. Testing Verification

After fix, verify:

1. **Fresh session:** Send message → Claude responds → response appears immediately
2. **No tab switch:** Keep focus on chat panel → messages still appear
3. **Multiple messages:** Send several in succession → all appear in order
4. **Console logs:** `[CHAT-DEBUG] chat:message payload` followed by message rendering
5. **WebSocket reconnect:** Kill backend → restart → messages resume appearing

---

## 8. Related Issues (Fresh Eye)

### [FRESH EYE] Dependency Array Inconsistency
- `useChatMessages` effect has `[sessionId, onEvent]` deps (line 196)
- This causes effect to re-run every time `onEvent` identity changes
- But `onEvent` should be stable (that's why it has empty deps in context)
- Suggests the empty deps were intentional for stability
- But the implementation doesn't match the intent

### [FRESH EYE] Debug Logs Still Present
- Lines 54, 67, 72 in `useChatMessages.ts` have `console.log` statements
- Should be removed or gated behind debug flag after fix

### [FRESH EYE] Session Lifecycle Event Bypass
- Line 82-85 in `useWebSocket.ts` bypasses subscription check for `session:*` events
- But `useChatMessages` has explicit `sessionId` check on line 68
- Redundant filtering - could be simplified

---

## Recommendations

### Priority 1: Fix Stale Closure (Critical)
**Action:** Apply Option B (Ref Indirection) to `WebSocketContext.tsx`
**Files:** `packages/app/src/contexts/WebSocketContext.tsx` (lines 34-36)
**Impact:** Resolves root cause, minimal code change

### Priority 2: Remove Debug Logs (Cleanup)
**Action:** Remove or gate console.log statements
**Files:** `packages/app/src/hooks/useChatMessages.ts` (lines 54, 67, 72)
**Impact:** Cleaner production code

### Priority 3: Verify Session Filtering (Optimization)
**Action:** Review if double session filtering is needed
**Files:** `packages/app/src/hooks/useWebSocket.ts` (lines 82-85), `packages/app/src/hooks/useChatMessages.ts` (line 68)
**Impact:** Code clarity

---

## Appendix: Closure Mechanics

### Why Empty Deps Create Stale Closures

```javascript
// Component renders at T1
const ref = useRef(new Set());
const callback = useCallback(() => {
  ref.current.forEach(fn => fn()); // Closes over ref at T1
}, []); // Empty deps = never re-creates

// At T2, something adds to ref
ref.current.add(newFunction);

// At T3, callback is invoked
callback(); // Still iterating over T1's Set (empty)
```

**Key Insight:** Refs are mutable, but closures capture VALUES at creation time. The ref object itself is stable, but the Set inside it is new. The closure captures `ref.current` which WAS an empty Set at T1.

**Fix:** Access `ref.current` at CALL TIME inside the callback body:
```javascript
const callback = useCallback(() => {
  const currentCallbacks = Array.from(ref.current); // Access NOW
  currentCallbacks.forEach(fn => fn());
}, []);
```

This works because we're not closing over `ref.current`'s value - we're closing over the `ref` object itself, which is stable.

---

## Learnings

**Issue:** Chat messages arrive via WebSocket but don't trigger React re-renders until user switches tabs.

**Root Cause:** Stale closure in `WebSocketContext.tsx` - the `handleEvent` callback closes over an empty `eventCallbacksRef.current` Set at initialization time. When components register new event listeners, they update the ref, but the closure still iterates over the old empty Set.

**Suggestion:** When using `useCallback` with refs, ensure the callback accesses `ref.current` at CALL TIME, not at closure creation time. Empty dependency arrays are correct for stability, but the callback body must read the ref dynamically. Add a lint rule or code review checkpoint for "useCallback + ref + empty deps" patterns.

**[FRESH EYE]** The commit message for 7e5ff5a mentions fixing JSONL re-parsing, but this revealed a deeper reactivity bug in the event broadcasting layer. The fix correctly moved from stdout parsing to structured events, but the event delivery mechanism itself has a closure bug. Also found debug logs that should be removed, and redundant session filtering that could be simplified.
