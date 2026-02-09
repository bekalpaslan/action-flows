# Code Changes: ws-server-heartbeat

## Files Modified
| File | Change |
|------|--------|
| packages/backend/src/index.ts | Added server-side WebSocket heartbeat mechanism with 20-second interval to prevent client disconnects during idle sessions |

## Files Created
None

## Implementation Details

### Added Server-Side Heartbeat
- Created `startServerHeartbeat()` function that sends `{ "type": "pong" }` messages to all connected clients every 20 seconds
- Created `stopServerHeartbeat()` function for cleanup during shutdown
- Integrated heartbeat start into server initialization (after `cleanupService.start()`)
- Integrated heartbeat stop into graceful shutdown (before cleanup service stop)

### Rationale
The frontend WebSocket client (`useWebSocket.ts`) has a 30-second heartbeat timeout. Without server-side keepalive messages, idle sessions trigger constant disconnect/reconnect cycles. The 20-second server heartbeat ensures the frontend receives at least one message before the 30-second timeout, keeping the connection alive.

### Message Format
The server sends `{ "type": "pong" }` which matches the existing message format that the frontend's `handleMessage` function expects. The frontend resets its heartbeat timer on ANY incoming message (line 126 of `useWebSocket.ts`), so this simple message is sufficient.

## Verification
- Type check: PASS
- Notes: All TypeScript types validated successfully across all packages
