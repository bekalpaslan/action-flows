---
phase: 02-frontend-scaffold-websocket
plan: 02
subsystem: websocket
tags: [websocket, channel-multiplexing, zod, ws, typescript]

# Dependency graph
requires:
  - phase: 01-typescript-hardening
    provides: "Branded types, clean TypeScript patterns, Storage interface"
provides:
  - "WebSocketHub class for channel-per-workbench message routing"
  - "WSEnvelope shared type contract between frontend and backend"
  - "SYSTEM_CHANNEL and BROADCAST_CHANNEL constants"
  - "channel:subscribe and channel:unsubscribe Zod schemas"
  - "broadcastToChannel utility in index.ts"
affects: [02-frontend-scaffold-websocket, 06-workbench-sessions]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Channel-per-workbench WebSocket multiplexing via WebSocketHub"
    - "Optional hub parameter for backward-compatible handler signature"
    - "Shared WSEnvelope type contract in @afw/shared"

key-files:
  created:
    - packages/shared/src/ws-envelope.ts
    - packages/backend/src/ws/hub.ts
  modified:
    - packages/shared/src/index.ts
    - packages/backend/src/schemas/ws.ts
    - packages/backend/src/ws/handler.ts
    - packages/backend/src/index.ts

key-decisions:
  - "Made hub parameter optional in handleWebSocket to avoid breaking test helpers"
  - "Used WSEnvelope as a lightweight interface (not Zod schema) for shared contract flexibility"
  - "Added hub cleanup in both close and error handlers for robust resource management"

patterns-established:
  - "Channel multiplexing: WebSocketHub manages per-channel subscriptions alongside session-based clientRegistry"
  - "Additive WebSocket evolution: new message types added to existing discriminated union without removing existing ones"

requirements-completed: [FOUND-03]

# Metrics
duration: 3min
completed: 2026-04-02
---

# Phase 02 Plan 02: WebSocket Channel Multiplexing Summary

**WebSocketHub with channel subscribe/unsubscribe routing, shared WSEnvelope type contract, and backward-compatible session broadcasting**

## Performance

- **Duration:** 3 min
- **Started:** 2026-04-02T08:55:29Z
- **Completed:** 2026-04-02T08:59:09Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Created WSEnvelope shared type with SYSTEM_CHANNEL and BROADCAST_CHANNEL constants in @afw/shared
- Built WebSocketHub class with subscribe/unsubscribe/broadcast/broadcastAll/unsubscribeAll methods
- Wired hub into handler and index.ts with Zod-validated channel:subscribe and channel:unsubscribe messages
- All 945 existing tests pass with zero regressions; all broadcastToSession calls preserved

## Task Commits

Each task was committed atomically:

1. **Task 1: Create shared WSEnvelope type and backend WebSocketHub class** - `5c5b863` (feat)
2. **Task 2: Wire hub into handler, add channel message schemas, update index.ts** - `cd88e8a` (feat)

## Files Created/Modified
- `packages/shared/src/ws-envelope.ts` - WSEnvelope interface, SYSTEM_CHANNEL, BROADCAST_CHANNEL, SystemMessageType
- `packages/shared/src/index.ts` - Added ws-envelope exports
- `packages/backend/src/ws/hub.ts` - WebSocketHub class for channel-per-workbench routing
- `packages/backend/src/schemas/ws.ts` - Added channel:subscribe and channel:unsubscribe Zod schemas
- `packages/backend/src/ws/handler.ts` - Added hub parameter, channel message routing in switch
- `packages/backend/src/index.ts` - Instantiated wsHub, wired to handler, added cleanup and broadcastToChannel

## Decisions Made
- Made hub parameter optional (`hub?: WebSocketHub`) in handleWebSocket to maintain backward compatibility with test helpers that call `handleWebSocket(ws, clientId, storage)` without a hub
- Used a lightweight TypeScript interface for WSEnvelope rather than a Zod schema to keep the shared contract flexible and avoid runtime validation overhead for every message
- Added hub cleanup (`wsHub.unsubscribeAll`) in both the `close` and `error` WebSocket event handlers to prevent channel subscription leaks

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- WebSocket channel infrastructure ready for frontend useWebSocket hook to subscribe to workbench channels
- broadcastToChannel utility available for future session event routing (Phase 6+)
- Existing session-based routing fully preserved for current features

---
*Phase: 02-frontend-scaffold-websocket*
*Completed: 2026-04-02*
