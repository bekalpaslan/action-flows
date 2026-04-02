---
phase: 06-agent-sessions-status
plan: 03
subsystem: backend
tags: [agent-sdk, websocket, health-monitor, heartbeat, session-lifecycle, resurrection]

requires:
  - phase: 06-01
    provides: SessionManager, BackendSessionStore, shared session-events types
provides:
  - SessionHealthMonitor with heartbeat-based disconnection detection and resurrection
  - WebSocket handler extensions for session:start, session:stop, session:switch, session:history commands
  - Backend startup wiring for SessionManager and SessionHealthMonitor initialization
  - Graceful shutdown of session infrastructure
affects: [06-04, 07-chat-panel]

tech-stack:
  added: []
  patterns: [heartbeat-health-monitor, resurrection-from-local-logs, ws-session-commands]

key-files:
  created:
    - packages/backend/src/services/sessionHealthMonitor.ts
  modified:
    - packages/backend/src/ws/handler.ts
    - packages/backend/src/schemas/ws.ts
    - packages/backend/src/index.ts

key-decisions:
  - "Heartbeat interval 15s with 30s stale threshold — worst-case detection within 30s per SESSION-04"
  - "Two-strategy resurrection: resume stored session ID first, then discover from local session list"
  - "Session commands added as new Zod discriminated union members with channel + payload shape"
  - "SessionManager initialized after conversation watcher in server startup — graceful degradation if init fails"

patterns-established:
  - "Heartbeat health monitor pattern: periodic interval checks all active sessions, verifies via Agent SDK, triggers resurrection on failure"
  - "Session lifecycle commands via WebSocket: session:start/stop/switch/history with consistent error handling"

requirements-completed: [SESSION-04, SESSION-05, SESSION-07, STATUS-03]

duration: 5min
completed: 2026-04-02
---

# Phase 6 Plan 3: Health Monitor, WS Commands & Backend Wiring Summary

**Heartbeat-based session health monitor with 30s disconnection detection, session resurrection from local logs, and WebSocket session lifecycle commands wired into backend startup**

## Performance

- **Duration:** 5 min
- **Started:** 2026-04-02T22:48:15Z
- **Completed:** 2026-04-02T22:53:20Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Built SessionHealthMonitor with 15s heartbeat interval detecting stale sessions within 30s
- Two-strategy resurrection: resume stored session ID, then discover from local Agent SDK session list
- Extended WebSocket handler with session:start, session:stop, session:switch, session:history commands
- Wired SessionManager and SessionHealthMonitor into backend startup with graceful degradation
- Added graceful shutdown for session infrastructure (health monitor stop + session manager shutdown)

## Task Commits

Each task was committed atomically:

1. **Task 1: Build SessionHealthMonitor service** - `668739b` (feat)
2. **Task 2: Extend WS handler with session commands and wire backend startup** - `34e6e8f` (feat)

## Files Created/Modified
- `packages/backend/src/services/sessionHealthMonitor.ts` - Heartbeat health monitor with resurrection logic
- `packages/backend/src/ws/handler.ts` - Extended with session:start/stop/switch/history command handlers
- `packages/backend/src/schemas/ws.ts` - New Zod schemas for session lifecycle message types
- `packages/backend/src/index.ts` - SessionManager and SessionHealthMonitor init on startup + shutdown

## Decisions Made
- Used 15s heartbeat interval (HEARTBEAT_INTERVAL_MS) so worst-case detection is 2x = 30s, meeting SESSION-04 requirement
- Resurrection strategy prioritizes resume over discovery -- resuming a stored session ID is cheaper than scanning local JSONL files
- Session commands in WS handler use `(message as any).payload` cast pattern consistent with existing capability message handling
- SessionManager init placed after conversation watcher but before universe graph init in startup sequence

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Worktree was behind master and missing Plan 01 output files (sessionManager.ts, sessionStore.ts, session-events.ts) -- resolved by merging master into worktree branch
- Shared package needed rebuild for type exports to be available to backend TypeScript compilation

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Health monitor and WS commands are ready for Plan 04 (frontend integration)
- Frontend can now send session:start/stop/switch via WebSocket to control Agent SDK sessions
- SessionHealthMonitor will auto-detect and attempt resurrection of disconnected sessions

## Self-Check: PASSED

- [x] sessionHealthMonitor.ts exists
- [x] Commit 668739b exists (Task 1)
- [x] Commit 34e6e8f exists (Task 2)
- [x] Exports: SessionHealthMonitor, sessionHealthMonitor, initSessionHealthMonitor
- [x] HEARTBEAT_INTERVAL_MS = 15_000
- [x] STALE_THRESHOLD_MS = 30_000
- [x] TypeScript compiles cleanly

---
*Phase: 06-agent-sessions-status*
*Completed: 2026-04-02*
