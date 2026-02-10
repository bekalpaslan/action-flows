# WebSocket Events for Dossiers — Implementation Summary

**Task:** Step 13 from Intel Dossier plan — Add WebSocket broadcast events for dossier lifecycle operations

**Date:** 2026-02-09

---

## Changes Made

### 1. Added `broadcastDossierEvent` Function
**File:** `D:\ActionFlowsDashboard\packages\backend\src\index.ts`

Added new global broadcast function following the existing pattern (similar to `broadcastRegistryEvent`):

```typescript
function broadcastDossierEvent(
  eventType: 'dossier:created' | 'dossier:updated' | 'dossier:deleted' | 'dossier:analyzing' | 'dossier:analyzed',
  dossierId: string,
  data?: any
) {
  const message = JSON.stringify({
    type: eventType,
    dossierId,
    data,
  });

  // Broadcast to all connected clients since dossiers are global
  clientRegistry.getAllClients().forEach((client) => {
    if (client.readyState === 1) { // WebSocket.OPEN
      client.send(message);
    }
  });
}
```

**Rationale:** Dossiers are global resources (not session-specific), so events broadcast to ALL connected WebSocket clients, similar to registry events.

---

### 2. Wired Broadcast Function via Setter Pattern
**File:** `D:\ActionFlowsDashboard\packages\backend\src\index.ts`

- Imported `setBroadcastDossierFunction` from dossiers router
- Added initialization call in server startup: `setBroadcastDossierFunction(broadcastDossierEvent);`

**Follows existing pattern:** Same approach used for terminal, file watcher, registry, and harmony broadcasts.

---

### 3. Added Setter Function in Dossiers Router
**File:** `D:\ActionFlowsDashboard\packages\backend\src\routes\dossiers.ts`

```typescript
let broadcastDossierEvent: ((
  eventType: 'dossier:created' | 'dossier:updated' | 'dossier:deleted' | 'dossier:analyzing' | 'dossier:analyzed',
  dossierId: string,
  data?: any
) => void) | null = null;

export function setBroadcastDossierFunction(fn: (
  eventType: 'dossier:created' | 'dossier:updated' | 'dossier:deleted' | 'dossier:analyzing' | 'dossier:analyzed',
  dossierId: string,
  data?: any
) => void) {
  broadcastDossierEvent = fn;
}
```

---

### 4. Wired Broadcasts in All CRUD Operations

#### POST `/api/dossiers` (Create)
- Broadcasts `dossier:created` with `{ dossierId, name }`
- Sent after successful storage write

#### PUT `/api/dossiers/:id` (Update)
- Broadcasts `dossier:updated` with `{ dossierId }`
- Sent after successful metadata update

#### DELETE `/api/dossiers/:id` (Delete)
- Broadcasts `dossier:deleted` with `{ dossierId }`
- Sent after successful deletion

#### POST `/api/dossiers/:id/analyze` (Trigger Analysis)
- Broadcasts `dossier:analyzing` with `{ dossierId, status: 'analyzing' }`
- Sent when analysis is triggered (Phase 1: status update only)

---

## Event Format

All dossier events follow this structure:

```typescript
{
  type: 'dossier:created' | 'dossier:updated' | 'dossier:deleted' | 'dossier:analyzing' | 'dossier:analyzed',
  dossierId: string,
  data?: {
    dossierId: string,
    name?: string,         // Only for dossier:created
    status?: string        // Only for dossier:analyzing
  }
}
```

---

## Testing

- ✅ TypeScript type-check passes (`pnpm -F @afw/backend type-check`)
- ✅ Follows existing broadcast patterns (terminal, registry, harmony)
- ✅ Broadcasts are guarded with null checks (`if (broadcastDossierEvent)`)
- ✅ Events sent AFTER successful storage operations

---

## Next Steps (Not Implemented)

1. **Frontend WebSocket Handler:**
   - Add dossier event listener in `useWebSocket.ts`
   - Handle events in IntelDossier UI components
   - Trigger refetch/UI updates on events

2. **WS Schema Documentation:**
   - Optional: Add dossier event types to `packages/backend/src/schemas/ws.ts` (currently only defines client→server messages, not server→client events)

3. **Phase 2 Analysis Integration:**
   - When actual agent spawning is implemented, broadcast `dossier:analyzed` event when analysis completes
   - Include analysis results in event data

---

## Files Modified

1. `D:\ActionFlowsDashboard\packages\backend\src\index.ts`
   - Added `broadcastDossierEvent` function
   - Imported `setBroadcastDossierFunction`
   - Wired broadcast function initialization

2. `D:\ActionFlowsDashboard\packages\backend\src\routes\dossiers.ts`
   - Added setter function for broadcast
   - Wired broadcasts in CREATE, UPDATE, DELETE, ANALYZE endpoints

---

## Verification Commands

```bash
# Type-check
pnpm -F @afw/backend type-check

# Test WebSocket events (manual)
# 1. Start backend: pnpm dev:backend
# 2. Connect WebSocket client to ws://localhost:3001/ws
# 3. Create/update/delete dossier via API
# 4. Observe broadcast events in WebSocket client
```
