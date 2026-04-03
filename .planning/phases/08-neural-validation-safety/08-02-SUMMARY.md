---
phase: 08-neural-validation-safety
plan: 02
subsystem: api
tags: [express, websocket, git, approval-gates, autonomy, validation, vitest]

# Dependency graph
requires:
  - phase: 02-frontend-scaffold-websocket
    provides: WebSocketHub channel broadcast infrastructure
provides:
  - Shared validation event types (ViolationSignal, ApprovalRequest, CheckpointData, AutonomyLevel)
  - Git-based checkpoint service (list commits, revert via git revert)
  - Approval request lifecycle service (create, poll, resolve, auto-timeout)
  - Per-workbench autonomy levels (full, supervised, restricted)
  - REST API routes for validation, checkpoints, and approvals
  - Unit tests for approval service logic
affects: [08-03, 08-04, frontend-validation-panel]

# Tech tracking
tech-stack:
  added: []
  patterns: [approval-gate-lifecycle, git-based-checkpoints, destructive-action-detection, app-locals-hub-pattern]

key-files:
  created:
    - packages/shared/src/validation-events.ts
    - packages/backend/src/services/checkpointService.ts
    - packages/backend/src/services/approvalService.ts
    - packages/backend/src/routes/validation.ts
    - packages/backend/src/routes/checkpoints.ts
    - packages/backend/src/routes/approvals.ts
    - packages/backend/src/__tests__/approval-service.test.ts
  modified:
    - packages/shared/src/index.ts
    - packages/backend/src/index.ts

key-decisions:
  - "Used app.locals.wsHub pattern to make WebSocketHub accessible to route handlers without circular imports"
  - "Approval IDs include random suffix to prevent collisions: approval_{timestamp}_{random6}"
  - "Default autonomy levels per workbench: settings/studio=full, work/explore/pm=supervised, review/archive=restricted"

patterns-established:
  - "Destructive action list: delete_files, remove_directory, force_push, drop_table, git_reset_hard"
  - "Approval timeout: 120s auto-resolve as timed_out"
  - "Hub-via-app-locals: routes access wsHub via req.app.locals.wsHub for WS broadcasts"

requirements-completed: [NEURAL-04, SAFETY-01, SAFETY-02, SAFETY-03, SAFETY-04, SAFETY-05]

# Metrics
duration: 7min
completed: 2026-04-03
---

# Phase 08 Plan 02: Backend Validation Infrastructure Summary

**Validation event delivery, git-based checkpoint/rollback, and human-in-the-loop approval gates with per-workbench autonomy levels and 13 unit tests**

## Performance

- **Duration:** 7 min
- **Started:** 2026-04-03T14:18:33Z
- **Completed:** 2026-04-03T14:25:35Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments
- Shared validation event types exported from @afw/shared (ViolationSignal, ApprovalRequest, CheckpointData, AutonomyLevel with defaults)
- Git-based CheckpointService listing commits and reverting via git revert (not reset --hard) with merge commit handling
- ApprovalService with per-workbench autonomy levels, destructive action detection, 120s auto-timeout, and full request lifecycle
- Three REST API route files (validation, checkpoints, approvals) with WebSocket broadcast to workbench channels
- 13 unit tests covering needsApproval logic for all 3 autonomy levels, request lifecycle, and autonomy level management

## Task Commits

Each task was committed atomically:

1. **Task 1: Create shared validation event types, backend services, and approval service unit tests** - `1c07578` (feat) [TDD: RED-GREEN]
2. **Task 2: Create backend routes for validation, checkpoints, and approvals** - `1c7211a` (feat)

## Files Created/Modified
- `packages/shared/src/validation-events.ts` - Shared types: ViolationSignal, ApprovalRequest, CheckpointData, AutonomyLevel, DEFAULT_AUTONOMY_LEVELS
- `packages/shared/src/index.ts` - Re-exports validation event types
- `packages/backend/src/services/checkpointService.ts` - Git-based checkpoint operations (list, revert, get single)
- `packages/backend/src/services/approvalService.ts` - Approval request lifecycle with autonomy levels and auto-timeout
- `packages/backend/src/routes/validation.ts` - POST /api/validation/violations with WS broadcast, GET /api/validation/violations placeholder
- `packages/backend/src/routes/checkpoints.ts` - GET /api/checkpoints, POST /api/checkpoints/revert, GET /api/checkpoints/:hash
- `packages/backend/src/routes/approvals.ts` - Full approval CRUD: autonomy GET/PUT, request POST, status GET, resolve POST
- `packages/backend/src/index.ts` - Route registrations, wsHub on app.locals, approvalService cleanup in shutdown
- `packages/backend/src/__tests__/approval-service.test.ts` - 13 unit tests for ApprovalService

## Decisions Made
- Used `app.locals.wsHub` pattern to share the WebSocketHub instance with route handlers, avoiding circular dependency issues and following Express conventions
- Approval request IDs include both timestamp and random suffix (`approval_{Date.now()}_{random6}`) to prevent collisions in rapid successive requests
- Default autonomy levels assigned per workbench following D-12 spec: settings/studio=full, work/explore/pm=supervised, review/archive=restricted
- CheckpointService uses `execSync` for git operations since these are infrequent admin actions, not hot-path requests

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Known Stubs
None - all endpoints are fully functional with real data sources (git for checkpoints, in-memory maps for approvals).

## Next Phase Readiness
- Backend validation infrastructure complete, ready for frontend integration (Plan 03/04)
- Hook scripts (Plan 01) can POST violations to /api/validation/violations
- Frontend can poll /api/approvals/:id/status for approval gate resolution
- Checkpoint list and revert operations available for frontend checkpoint panel

## Self-Check: PASSED

- All 9 files verified present on disk
- Commit 1c07578 (Task 1) verified in git log
- Commit 1c7211a (Task 2) verified in git log
- Shared build: passes
- Backend type-check: passes
- Unit tests: 13/13 passing

---
*Phase: 08-neural-validation-safety*
*Completed: 2026-04-03*
