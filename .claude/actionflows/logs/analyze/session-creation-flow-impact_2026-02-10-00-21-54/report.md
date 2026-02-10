# Session Creation Flow Analysis: Live Update Failure

**Aspect:** impact
**Scope:** Session creation end-to-end flow (backend → WebSocket → frontend)
**Date:** 2026-02-10
**Agent:** analyze/

---

## Executive Summary

**IDENTIFIED ROOT CAUSE:** Newly created sessions do not appear in the UI without a page refresh due to **THREE CRITICAL GAPS** in the live update chain:

1. **Backend does not emit WebSocket event** when creating sessions via POST /api/sessions
2. **Event type mismatch** - Frontend listens for `session:updated` which does not exist
3. **Subscription architecture mismatch** - Frontend only receives events for subscribed sessions, but session list never subscribes to anything

The live update chain is **completely broken** at multiple points.

---

## 1. Backend Session Creation Route Analysis

### File: `packages/backend/src/routes/sessions.ts`

**Lines 76-128: POST /api/sessions**

```typescript
router.post('/', sessionCreateLimiter, validateBody(createSessionSchema), async (req, res) => {
  // ... validation ...

  const session: Session = {
    id: brandedTypes.sessionId(`session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`),
    cwd,
    hostname,
    platform,
    user: userId ? brandedTypes.userId(userId) : undefined,
    chains: [],
    status: 'pending',
    startedAt: brandedTypes.currentTimestamp(),
  };

  await Promise.resolve(storage.setSession(session));

  // Start file watching for this session
  await startWatching(session.id, cwd);

  res.status(201).json(session);  // ❌ Returns HTTP 201, but NO WebSocket event emitted
});
```

**FINDING #1: No WebSocket Event Emitted**

- `broadcastEvent` is imported (line 8) but **NEVER CALLED**
- Session is saved to storage
- File watching is started
- HTTP response is sent
- **NO WEBSOCKET EVENT IS BROADCAST TO CONNECTED CLIENTS**

**Evidence:**
- `broadcastEvent()` function exists in `packages/backend/src/ws/handler.ts` (lines 161-178)
- `clientRegistry.getAllClients()` is available to get all connected WebSocket clients
- But POST /api/sessions route never calls either function

---

## 2. WebSocket Event Type Analysis

### File: `packages/shared/src/events.ts`

**Session lifecycle events defined:**

| Event Type | Line | Purpose |
|------------|------|---------|
| `session:started` | 45-57 | Emitted when hook starts a session (not API creation) |
| `session:ended` | 59-72 | Emitted when session completes |

**FINDING #2: Missing Event Type**

The event `session:updated` referenced by the frontend **DOES NOT EXIST** in the type system.

**Evidence:**
```bash
$ grep -r "session:updated" packages/shared/src/
# No results
```

Only two session lifecycle events exist: `session:started` and `session:ended`.

---

## 3. Frontend Session List Hook Analysis

### File: `packages/app/src/hooks/useAllSessions.ts`

**Lines 113-175: WebSocket event handler**

```typescript
const handleSessionEvent = useCallback((event: WorkspaceEvent) => {
  if (
    event.type === 'session:started' ||     // ✅ Exists
    event.type === 'session:updated' ||     // ❌ Does NOT exist
    event.type === 'session:ended'          // ✅ Exists
  ) {
    const sessionData = event.data as SessionEventData;

    setSessions((prevSessions) => {
      const existingIndex = prevSessions.findIndex(
        (s) => s.id === sessionData.id
      );

      if (event.type === 'session:started' && existingIndex === -1) {
        // Add new session to list
        return [...prevSessions, {...}];
      }
      // ...
    });
  }
}, []);
```

**FINDING #3: Event Type Mismatch**

Frontend listens for three event types:
- `session:started` - ✅ Valid type, but NOT emitted by POST /api/sessions
- `session:updated` - ❌ **PHANTOM EVENT** - does not exist in type system
- `session:ended` - ✅ Valid type, not relevant for creation

**The only valid event that could add a session to the list (`session:started`) is never emitted by the session creation route.**

---

## 4. WebSocket Subscription Architecture Analysis

### File: `packages/app/src/hooks/useWebSocket.ts`

**Lines 80-83: Event filtering by subscription**

```typescript
// Only process events for subscribed sessions
if (subscribedSessionsRef.current.has(data.sessionId)) {
  onEvent?.(data as WorkspaceEvent);
}
```

**FINDING #4: Subscription-Based Event Filtering**

The WebSocket client **ONLY processes events for sessions it has explicitly subscribed to**.

**Subscription Flow:**
1. Component calls `subscribe(sessionId)` → adds to `subscribedSessionsRef`
2. WebSocket message arrives with `sessionId` field
3. If `subscribedSessionsRef.current.has(sessionId)` → event is processed
4. Otherwise → **event is silently dropped**

**Problem for Session List:**
- Session list needs to know about **ALL sessions** across **ALL users**
- But it never subscribes to any specific sessionId
- Even if backend emitted `session:started` with a new sessionId, the frontend would **drop the event** because it's not subscribed to that sessionId

**Usage Pattern Analysis:**
```bash
$ grep -r "subscribe(" packages/app/src/hooks/useAllSessions.ts
# No results - useAllSessions NEVER calls subscribe()
```

The session list hook never subscribes to anything, so it can never receive session-scoped events.

---

## 5. Current Event Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ USER ACTION: Create Session via Dashboard                   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │ POST /api/sessions   │
          │ (backend route)      │
          └──────────┬───────────┘
                     │
                     ├─► storage.setSession(session)  ✅
                     ├─► startWatching(session.id)    ✅
                     ├─► res.status(201).json(session) ✅
                     │
                     └─► broadcastEvent(...)  ❌ MISSING


┌─────────────────────────────────────────────────────────────┐
│ FRONTEND: useAllSessions hook                               │
├─────────────────────────────────────────────────────────────┤
│ - Fetches sessions on mount: GET /api/sessions  ✅          │
│ - Listens for WebSocket events:                            │
│   • session:started   ← Never emitted by POST route ❌      │
│   • session:updated   ← Does not exist in type system ❌    │
│   • session:ended     ← Only emitted on completion ❌       │
│ - No subscription to sessionIds                             │
│ - Would drop events even if emitted ❌                      │
└─────────────────────────────────────────────────────────────┘
```

**Result:** Frontend only sees new session after manual page refresh triggers `fetchSessions()`.

---

## 6. Related Code Locations

### Backend

| File | Lines | Description |
|------|-------|-------------|
| `packages/backend/src/routes/sessions.ts` | 76-128 | POST route - needs to emit event |
| `packages/backend/src/ws/handler.ts` | 161-178 | `broadcastEvent()` function |
| `packages/backend/src/ws/clientRegistry.ts` | 159-161 | `getAllClients()` method |

### Frontend

| File | Lines | Description |
|------|-------|-------------|
| `packages/app/src/hooks/useAllSessions.ts` | 113-175 | Event handler with phantom event type |
| `packages/app/src/hooks/useWebSocket.ts` | 80-83 | Subscription-based event filtering |

### Shared

| File | Lines | Description |
|------|-------|-------------|
| `packages/shared/src/events.ts` | 45-72 | Session event type definitions |

---

## 7. Recommendations

### Fix Option A: Add WebSocket Broadcast to Backend (Quick Fix)

**File:** `packages/backend/src/routes/sessions.ts`

**After line 109** (after `storage.setSession(session)`):

```typescript
// Broadcast session:started event to all connected clients
const sessionStartedEvent: SessionStartedEvent = {
  type: 'session:started',
  sessionId: session.id,
  timestamp: session.startedAt,
  cwd: session.cwd,
  user: session.user,
  hostname: session.hostname,
  platform: session.platform,
};

const allClients = clientRegistry.getAllClients();
broadcastEvent(allClients, sessionStartedEvent, session.id);
```

**Pros:**
- Uses existing event type
- Frontend already has handler for `session:started`
- Simple addition, no breaking changes

**Cons:**
- Requires frontend to implement global session subscription (see Option B)

### Fix Option B: Global Session Subscription (Frontend Architecture Change)

**Problem:** Frontend only processes events for subscribed sessions.

**Solution:** Implement a "global" or "broadcast" sessionId that receives all session-level events.

**File:** `packages/app/src/hooks/useAllSessions.ts`

```typescript
const GLOBAL_SESSION_ID = '__GLOBAL__' as SessionId;

useEffect(() => {
  // Subscribe to global session events
  wsContext.subscribe(GLOBAL_SESSION_ID);

  return () => {
    wsContext.unsubscribe(GLOBAL_SESSION_ID);
  };
}, [wsContext]);
```

**Backend adjustment:** Broadcast session events with both the specific sessionId AND the global sessionId.

### Fix Option C: Remove Subscription Filter for Session Events

**File:** `packages/app/src/hooks/useWebSocket.ts`

**Lines 74-83:** Modify event filtering logic

```typescript
// Validate required fields for workspace events
if (!data.type || !data.timestamp) {
  console.warn('Invalid event structure received:', data);
  return;
}

// Session lifecycle events are always processed (no subscription required)
const isSessionEvent = data.type.startsWith('session:');

// Process event if subscribed OR if it's a session lifecycle event
if (isSessionEvent || subscribedSessionsRef.current.has(data.sessionId)) {
  onEvent?.(data as WorkspaceEvent);
}
```

**Pros:**
- Allows session list to receive all session events without subscription
- Minimal code change
- Aligns with use case: session list needs global visibility

**Cons:**
- Breaks subscription isolation for session events
- All clients receive all session events (may increase network traffic)

### Fix Option D: Remove Phantom Event Type

**File:** `packages/app/src/hooks/useAllSessions.ts`

**Line 116:** Remove reference to non-existent event type

```typescript
if (
  event.type === 'session:started' ||
  // event.type === 'session:updated' ||  ← REMOVE THIS
  event.type === 'session:ended'
) {
```

**This is required regardless of which fix is chosen.**

---

## 8. Recommended Implementation Order

1. **Remove phantom event** (Fix Option D) - immediate cleanup
2. **Add backend broadcast** (Fix Option A) - restore event emission
3. **Choose subscription strategy:**
   - Option B (global session ID) for strict isolation, OR
   - Option C (remove filter for session events) for simplicity

**Estimated Effort:** 1-2 hours total

**Impact:** Restores real-time session list updates

**Testing Checklist:**
- [ ] Create session via POST /api/sessions
- [ ] Verify `session:started` event is emitted via WebSocket
- [ ] Verify frontend session list updates without refresh
- [ ] Verify multiple clients receive the update
- [ ] Verify no duplicate sessions in list

---

## Appendix A: Alternative Event Types Considered

**Why not create `session:created`?**
- `session:started` already exists and serves the same purpose
- Frontend already has handler logic for it
- Creating a new event type adds unnecessary complexity

**Why not reuse `session:ended` for updates?**
- Semantically incorrect - `ended` implies completion
- Would break existing logic that marks sessions as completed

**Why `session:updated` doesn't exist:**
- Session updates (status changes, summary changes) happen via PUT /api/sessions/:id
- That route also doesn't emit events (separate issue)
- Core issue is **creation** events, not update events
