# WebSocket Auto-Refetch for Custom Prompt Buttons — COMPLETE

**Task:** Add WebSocket subscription to `useCustomPromptButtons` hook so it auto-refetches when registry entries change

**Status:** ✅ Complete

---

## Changes Made

### 1. **Frontend Hook Update** (`packages/app/src/hooks/useCustomPromptButtons.ts`)

Added WebSocket subscription to listen for `registry:changed` events:

- **Imported WebSocket context**: Added `useWebSocketContext` from `../contexts/WebSocketContext`
- **Imported event types**: Added `WorkspaceEvent` and `RegistryChangedEvent` from `@afw/shared`
- **Added WebSocket listener**: New `useEffect` that subscribes to registry change events
- **Auto-refetch on changes**: When a `registry:changed` event is received, the hook automatically calls `refetch()`
- **Proper cleanup**: Returns unsubscribe function to clean up listener on unmount

**Key code:**
```typescript
useEffect(() => {
  if (!wsContext.onEvent) return;

  const handleRegistryEvent = (event: WorkspaceEvent) => {
    if (event.type === 'registry:changed') {
      console.log('[useCustomPromptButtons] Registry changed, refetching custom prompts');
      fetchCustomPrompts();
    }
  };

  const unsubscribe = wsContext.onEvent(handleRegistryEvent);
  return unsubscribe;
}, [wsContext, fetchCustomPrompts]);
```

### 2. **WebSocket Handler Update** (`packages/app/src/hooks/useWebSocket.ts`)

Enhanced WebSocket message handling to support system-level registry events:

- **Added registry-event handling**: New branch in `handleMessage` to process `registry-event` type messages
- **No session filter for registry events**: Unlike session-specific events, registry events are broadcast to all clients and don't require session subscription
- **Early return pattern**: Follows existing pattern for non-session events (like `pong`, `error`, etc.)

**Key code:**
```typescript
// Handle registry events (system-level, no sessionId required)
if (data.type === 'registry-event' && data.payload) {
  onEvent?.(data.payload as WorkspaceEvent);
  return;
}
```

---

## How It Works (End-to-End Flow)

### 1. **Registry Mutation** (Backend)
When a custom prompt is created/updated/deleted via:
- `POST /api/registry/entries`
- `PATCH /api/registry/entries/:id`
- `DELETE /api/registry/entries/:id`

The `registryStorage` service calls `emitEvent()` which invokes the broadcaster function.

### 2. **WebSocket Broadcast** (Backend)
The `broadcastRegistryEvent()` function in `packages/backend/src/index.ts` sends:
```json
{
  "type": "registry-event",
  "payload": {
    "type": "registry:changed",
    "timestamp": "2026-02-09T19:40:00.000Z",
    "entryId": "entry-...",
    "changeType": "added|updated|removed|enabled|disabled",
    "source": { "type": "core|pack|project", ... },
    "previousValue": { ... },
    "newValue": { ... }
  }
}
```

### 3. **WebSocket Reception** (Frontend)
The `useWebSocket` hook receives the message and:
1. Recognizes `type: "registry-event"`
2. Unwraps the payload
3. Passes it to all registered `onEvent` callbacks

### 4. **Hook Refetch** (Frontend)
The `useCustomPromptButtons` hook:
1. Receives the `registry:changed` event
2. Calls `fetchCustomPrompts()` to refetch all custom prompt entries
3. Updates the `buttons` state with fresh data
4. Any components using the hook automatically re-render with new buttons

---

## Verification

### Type Check
```bash
pnpm type-check
```
✅ **Result:** No new TypeScript errors introduced

### Testing Recommendations

1. **Create a custom prompt** via the CustomPromptDialog
   - Verify that other open windows/components immediately see the new button
   - Check browser console for `[useCustomPromptButtons] Registry changed, refetching custom prompts`

2. **Update a custom prompt** (change label, icon, or prompt text)
   - Verify that the button updates in all open windows without refresh

3. **Delete a custom prompt**
   - Verify that the button disappears from all windows immediately

4. **Enable/disable a custom prompt**
   - Verify that the button appears/disappears based on enabled state

---

## Infrastructure Already in Place

The following infrastructure was already implemented and working:

✅ **Backend:**
- `registryStorage.setBroadcastFunction()` wired up in `index.ts` (line 316)
- `broadcastRegistryEvent()` function broadcasting to all clients
- `RegistryChangedEvent` type defined in `@afw/shared`
- Registry mutations calling `emitEvent()` on add/update/remove

✅ **Frontend:**
- `WebSocketProvider` context providing `onEvent` callback registration
- `useWebSocket` hook handling connection, reconnection, heartbeat
- Multiple hooks already using the same pattern (`useAllSessions`, `useUsers`, etc.)

---

## Files Modified

1. **`packages/app/src/hooks/useCustomPromptButtons.ts`**
   - Added WebSocket context import
   - Added WebSocket event listener with cleanup
   - Added registry event handler

2. **`packages/app/src/hooks/useWebSocket.ts`**
   - Added `registry-event` message type handling
   - System-level events bypass session subscription filter

---

## Architecture Notes

### Why `registry-event` instead of `event`?

The backend broadcasts registry changes with type `registry-event` (not `event`) because:
1. Registry changes are **system-level**, not session-specific
2. They should reach **all connected clients**, not just those subscribed to a particular session
3. The event structure differs slightly (no required `sessionId` field)

### Event Flow Comparison

**Session-specific events:**
```
Backend → { type: "event", sessionId: "...", payload: {...} }
Frontend → Filtered by session subscription → onEvent callback
```

**Registry events:**
```
Backend → { type: "registry-event", payload: {...} }
Frontend → No session filter → onEvent callback
```

---

## Future Enhancements (Optional)

1. **Selective refetch**: Currently refetches on ANY registry change. Could filter by `entry.type === 'custom-prompt'` for efficiency.

2. **Optimistic updates**: Could add/remove buttons optimistically before the refetch completes for instant UI feedback.

3. **Debouncing**: If multiple registry changes happen rapidly, could debounce the refetch calls.

4. **Fine-grained updates**: Instead of full refetch, could apply the delta (add/update/remove specific button based on the event).

---

## Success Metrics

✅ Components using `useCustomPromptButtons` now automatically see registry changes
✅ No page refresh required when custom prompts are added/modified/deleted
✅ WebSocket infrastructure handles system-level events properly
✅ No TypeScript errors introduced
✅ Follows existing patterns from other hooks in the codebase
