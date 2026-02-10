# Session Creation Flow Impact Analysis

**Aspect:** impact
**Scope:** Session creation flow — from UI button click through API call, WebSocket event propagation, state management, to session list rendering
**Date:** 2026-02-09
**Agent:** analyze/

---

## 1. Flow Trace Summary

The session creation flow spans three layers:

1. **Frontend UI Layer** — `SessionSidebar` component with "New Session" button
2. **API Layer** — `POST /api/sessions` endpoint creates session in storage
3. **State Management Layer** — `useAllSessions` hook manages session list state

**Critical Finding:** The API endpoint successfully creates the session but **DOES NOT broadcast a WebSocket event**. The frontend relies on WebSocket events to update the session list in real-time.

---

## 2. Button Click Handler (Frontend)

**File:** `packages/app/src/components/Workbench/WorkbenchLayout.tsx`

**Location:** Lines 587-602

**Flow:**
```typescript
onNewSession={async () => {
  const res = await fetch('http://localhost:3001/api/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cwd: 'D:/ActionFlowsDashboard' }),
  });
  const data = await res.json();
  const newId = data.id as SessionId;
  handleAttachSession(newId);  // ← Fetches session AGAIN via GET
}}
```

**Observation:**
- API call succeeds (returns status 201 + session object)
- The response `data` contains the full session object but it's **NOT USED**
- Instead, `handleAttachSession()` makes a **SECOND API call** to `GET /api/sessions/:id`
- The newly created session is added to `attachedSessions` local state, but **NOT** to the global session list

---

## 3. API Endpoint (Backend)

**File:** `packages/backend/src/routes/sessions.ts`

**Location:** Lines 74-126 (`POST /api/sessions`)

**Flow:**
```typescript
router.post('/', sessionCreateLimiter, validateBody(createSessionSchema), async (req, res) => {
  const session: Session = {
    id: brandedTypes.sessionId(`session-${Date.now()}-...`),
    cwd, hostname, platform, user, chains: [],
    status: 'pending',
    startedAt: brandedTypes.currentTimestamp(),
  };

  await storage.setSession(session);
  await startWatching(session.id, cwd);

  res.status(201).json(session);  // ← Returns session object
});
```

**Critical Gap:**
- Session is created and stored successfully
- Response includes full session object
- **NO WebSocket event is broadcast** (no call to `broadcastEvent()`)
- The frontend never receives a `session:started` event

---

## 4. WebSocket Event Handling (Frontend)

**File:** `packages/app/src/hooks/useAllSessions.ts`

**Location:** Lines 113-175

**Flow:**
```typescript
const handleSessionEvent = useCallback((event: WorkspaceEvent) => {
  if (event.type === 'session:started' ||
      event.type === 'session:updated' ||
      event.type === 'session:ended') {

    const sessionData = event.data;
    setSessions((prevSessions) => {
      if (event.type === 'session:started' && existingIndex === -1) {
        return [...prevSessions, sessionData];  // ← Adds to list
      }
      // ... update/remove logic
    });
  }
}, []);
```

**Expected Behavior:**
- When a `session:started` event is received, the new session is added to the `sessions` array
- The `SessionSidebar` component (which uses `useAllSessions` via `useSessionSidebar`) would re-render with the new session

**Actual Behavior:**
- No `session:started` event is ever broadcast from the backend
- The session list never updates
- User must manually refresh the page to see the new session

---

## 5. Session List Rendering (Frontend)

**File:** `packages/app/src/components/SessionSidebar/SessionSidebar.tsx`

**Location:** Lines 36-41

**Flow:**
```typescript
const { activeSessions, recentSessions } = useSessionSidebar(onAttachSession);

// useSessionSidebar internally calls useAllSessions:
const { sessions } = useAllSessions();
const activeSessions = sessions.filter(s => s.status === 'in_progress');
const recentSessions = [...sessions].sort(...).slice(0, 10);
```

**Observation:**
- The `SessionSidebar` correctly uses `useAllSessions` hook for data
- The hook correctly listens for WebSocket events
- The component would render correctly **IF** it received the event
- The problem is NOT in the UI layer

---

## 6. Root Cause Identification

**THE BREAK POINT:** Backend `POST /api/sessions` endpoint (line 118 in `packages/backend/src/routes/sessions.ts`)

**What's Missing:**
```typescript
// After creating the session, this code should exist but DOESN'T:
const event: WorkspaceEvent = {
  type: 'session:started',
  sessionId: session.id,
  timestamp: session.startedAt,
  data: session,
};
broadcastEvent(clientRegistry.getAllClients(), event);
```

**Evidence:**
1. The `broadcastEvent()` function exists in `packages/backend/src/ws/handler.ts` (lines 161-178)
2. It's used elsewhere (claudeCliManager, harmonyDetector)
3. It's **NOT** called after session creation
4. The frontend hook is correctly configured to listen for `session:started` events
5. The frontend state update logic is correct

**Why It Breaks:**
- Frontend expects real-time updates via WebSocket
- Backend doesn't send the expected event
- Frontend only updates session list when WebSocket events arrive OR when the page is refreshed (which triggers `fetchSessions()`)

---

## 7. Secondary Issue: Duplicate API Call

**File:** `packages/app/src/components/Workbench/WorkbenchLayout.tsx` (line 596)

**Problem:**
```typescript
const data = await res.json();  // ← Has full session object
const newId = data.id as SessionId;
handleAttachSession(newId);  // ← Makes ANOTHER GET request
```

**Impact:**
- Unnecessary network round-trip
- Increases latency
- The POST response already includes the session object — should be used directly

**Recommendation:**
```typescript
const data = await res.json();
const session: Session = {
  id: data.id as SessionId,
  cwd: data.cwd,
  status: data.status,
  startedAt: data.startedAt,
  // ... map all fields
};
// Directly add to state without fetching again
setAttachedSessions((prev) => [...prev, session]);
setActiveSessionId(session.id);
```

---

## 8. State Isolation Issue

**File:** `packages/app/src/components/Workbench/WorkbenchLayout.tsx` (lines 265-266)

**Problem:**
```typescript
const [attachedSessions, setAttachedSessions] = useState<Session[]>([]);
```

vs.

**File:** `packages/app/src/hooks/useAllSessions.ts` (line 33)
```typescript
const [sessions, setSessions] = useState<Session[]>([]);
```

**Two separate state buckets:**
1. `attachedSessions` — Local state in `WorkbenchLayout`, used for active workbench tabs
2. `sessions` — Global state in `useAllSessions`, used for `SessionSidebar` list

**Impact:**
- When `handleAttachSession()` is called, it only updates `attachedSessions` (local state)
- The global `sessions` state (used by `SessionSidebar`) is **NEVER UPDATED** manually
- The sidebar list relies exclusively on WebSocket events to update `sessions`
- Without the WebSocket event, the sidebar never shows the new session

**This is actually correct architecture** — the frontend is designed to be event-driven. The bug is in the backend, not the state isolation.

---

## 9. Workaround Detection

**File:** `packages/app/src/hooks/useAllSessions.ts` (lines 190-195)

**Code:**
```typescript
const addSession = useCallback((session: Session) => {
  setSessions((prev) => {
    if (prev.some((s) => s.id === session.id)) return prev;
    return [...prev, session];
  });
}, []);
```

**Observation:**
- The hook provides an `addSession()` method to manually inject a session
- This method is **EXPORTED** but **NEVER CALLED** by the button handler
- This could be used as a workaround until the backend is fixed

**Potential Fix (Frontend-only workaround):**
```typescript
// In WorkbenchLayout.tsx
import { useAllSessions } from '../../hooks/useAllSessions';

const { addSession } = useAllSessions();

onNewSession={async () => {
  const res = await fetch('http://localhost:3001/api/sessions', ...);
  const data = await res.json();
  const session = { id: data.id, cwd: data.cwd, ... };

  addSession(session);  // ← Manually inject into global state
  handleAttachSession(data.id);
}}
```

---

## Recommendations

### Critical (Must Fix)

1. **Add WebSocket broadcast to session creation endpoint**
   - File: `packages/backend/src/routes/sessions.ts`
   - Location: After line 118 (`res.status(201).json(session)`)
   - Add:
     ```typescript
     import { clientRegistry } from '../ws/clientRegistry.js';
     import { broadcastEvent } from '../ws/handler.js';

     // After creating session
     const event: WorkspaceEvent = {
       type: 'session:started',
       sessionId: session.id,
       timestamp: session.startedAt,
       data: session,
     };
     broadcastEvent(clientRegistry.getAllClients(), event);
     ```

### Performance Optimization

2. **Eliminate duplicate API call**
   - File: `packages/app/src/components/Workbench/WorkbenchLayout.tsx`
   - Location: Lines 587-602
   - Use the POST response directly instead of making a GET request
   - Reduces session creation latency by ~50%

### Defensive Coding (Optional)

3. **Add fallback to useAllSessions**
   - If WebSocket is disconnected, periodically poll `GET /api/sessions`
   - Ensures UI doesn't get stuck even if WebSocket fails
   - Already has `refresh()` method — could be called on an interval

4. **Use the exported addSession() workaround temporarily**
   - Manually inject the session after API response
   - Provides immediate UI feedback while waiting for WebSocket fix
   - Remove once backend broadcasts events

---

## Test Plan

After implementing the fix, verify:

1. **Primary Flow:**
   - Click "New Session" button
   - Session appears in sidebar list immediately (no refresh needed)
   - Session status shows "pending"
   - Session is clickable and attaches to workbench

2. **Multi-Client Scenario:**
   - Open dashboard in two browser tabs
   - Create session in Tab 1
   - Verify session appears in Tab 2's sidebar (via WebSocket)

3. **WebSocket Reconnection:**
   - Disconnect WebSocket
   - Create session
   - Reconnect WebSocket
   - Verify session appears after reconnection (via refresh)

4. **Error Handling:**
   - Test with invalid `cwd` path
   - Test with denied system path (`/etc`, `C:\Windows`)
   - Verify proper error messages, no partial state

---

## Related Files

| File | Role | Status |
|------|------|--------|
| `packages/backend/src/routes/sessions.ts` | Session creation API | ❌ Missing event broadcast |
| `packages/backend/src/ws/handler.ts` | WebSocket event broadcaster | ✅ Function exists, not called |
| `packages/backend/src/ws/clientRegistry.ts` | Client connection registry | ✅ Works correctly |
| `packages/app/src/hooks/useAllSessions.ts` | Session list state hook | ✅ Correctly listens for events |
| `packages/app/src/hooks/useSessionSidebar.ts` | Sidebar state hook | ✅ Correctly uses useAllSessions |
| `packages/app/src/components/SessionSidebar/SessionSidebar.tsx` | Sidebar UI component | ✅ Correctly renders from hook |
| `packages/app/src/components/Workbench/WorkbenchLayout.tsx` | Button click handler | ⚠️ Makes duplicate API call |
| `packages/app/src/contexts/WebSocketContext.tsx` | WebSocket provider | ✅ Works correctly |
| `packages/shared/src/events.ts` | Event type definitions | ✅ Defines session:started |

---

## Impact Assessment

**Severity:** Medium-High
**User Impact:** High (breaks core feature)
**Technical Complexity:** Low (1 line fix)
**Scope:** Backend only (minimal change)

**Workaround Exists:** Yes (manual page refresh)

**Blocks:** Real-time collaboration, multi-client sync, event-driven architecture demo

**Dependencies:** None — fix is isolated to session creation endpoint
