---
phase: 08-neural-validation-safety
plan: 03
subsystem: ui
tags: [zustand, sonner, radix-tooltip, radix-dialog, websocket, validation, checkpoint, pipeline]

# Dependency graph
requires:
  - phase: 08-01
    provides: Design validation hooks (PreToolUse/PostToolUse) and design rules module
  - phase: 08-02
    provides: Shared validation types (ViolationSignal, CheckpointData, AutonomyLevel), backend validation/checkpoint routes and WS broadcasts
  - phase: 05-pipeline-visualization
    provides: Pipeline store, StepNode component, pipeline-types, pipeline-layout
  - phase: 04-layout-navigation
    provides: AppShell with panel layout, useWebSocket, uiStore
provides:
  - Zustand validationStore for per-workbench violations and autonomy levels
  - ViolationToast component with severity-colored sonner toasts
  - useViolationSignals hook subscribing to WS validation events
  - CheckpointMarker component with tooltip, relative timestamp, and revert dialog
  - StepNodeData extended with checkpoint field
  - pipelineStore.setCheckpoint action
  - useCheckpointSync hook mapping git checkpoints to pipeline step nodes
  - AppShell wiring of useViolationSignals and useCheckpointSync
affects: [08-04-approval-ui, phase-09]

# Tech tracking
tech-stack:
  added: []
  patterns: [per-workbench-map-store, ws-subscribe-in-useEffect, toast-custom-component, timestamp-based-checkpoint-matching]

key-files:
  created:
    - packages/app/src/stores/validationStore.ts
    - packages/app/src/components/ViolationToast.tsx
    - packages/app/src/hooks/useViolationSignals.ts
    - packages/app/src/components/pipeline/CheckpointMarker.tsx
    - packages/app/src/hooks/useCheckpointSync.ts
  modified:
    - packages/app/src/lib/pipeline-types.ts
    - packages/app/src/lib/pipeline-layout.ts
    - packages/app/src/stores/pipelineStore.ts
    - packages/app/src/stores/pipelineStore.test.ts
    - packages/app/src/components/pipeline/StepNode.tsx
    - packages/app/src/workbenches/shell/AppShell.tsx

key-decisions:
  - "ViolationToast uses toast.custom with createElement for sonner integration (not JSX in hook)"
  - "Checkpoint-to-step matching uses timestamp windows with sequential fallback heuristic"
  - "Both hooks subscribe to workbench channel AND _system channel for system-wide broadcasts"
  - "formatRelativeTime is local helper in CheckpointMarker (not shared utility) for simplicity"

patterns-established:
  - "WS event hook pattern: subscribe in useEffect, unsubscribe on cleanup, process via store.getState()"
  - "Checkpoint sync: timestamp-based window matching with sequential fallback for pairing"
  - "Severity-to-duration mapping: critical=Infinity, warning=8s, info=5s for toast persistence"

requirements-completed: [NEURAL-04, SAFETY-01, D-10]

# Metrics
duration: 7min
completed: 2026-04-03
---

# Phase 8 Plan 3: Frontend Validation Signals and Checkpoint Timeline Summary

**Violation toast system with severity-colored sonner toasts, checkpoint timeline on pipeline step nodes with revert dialog, and WS-driven checkpoint sync**

## Performance

- **Duration:** 7 min
- **Started:** 2026-04-03T14:33:28Z
- **Completed:** 2026-04-03T14:40:40Z
- **Tasks:** 3
- **Files modified:** 11

## Accomplishments
- Zustand validationStore with per-workbench violations and autonomy levels (Map pattern matching pipelineStore)
- ViolationToast renders severity-colored left border with Badge, description, and file path per UI-SPEC
- useViolationSignals subscribes to WS validation:violation events with correct durations (Infinity/8000/5000)
- CheckpointMarker renders dot with Radix tooltip (commit message truncated to 60 chars, relative timestamp, revert button)
- Revert confirmation dialog with "Revert to checkpoint?" / "Keep changes" buttons per UI-SPEC copywriting
- StepNode extended with checkpoint field and conditional CheckpointMarker rendering
- useCheckpointSync fetches checkpoints from backend and maps to pipeline nodes using timestamp-based heuristics
- Both hooks wired into AppShell with activeWorkbench parameter -- violation toasts and checkpoint data now live

## Task Commits

Each task was committed atomically:

1. **Task 1: Create validationStore, ViolationToast, and useViolationSignals hook** - `8c56f31` (feat)
2. **Task 2: Create CheckpointMarker, extend StepNodeData with checkpoint, wire into StepNode** - `e19e98d` (feat)
3. **Task 3: Create useCheckpointSync hook and wire into AppShell** - `b14c20f` (feat)

## Files Created/Modified
- `packages/app/src/stores/validationStore.ts` - Zustand store for per-workbench violations and autonomy levels
- `packages/app/src/components/ViolationToast.tsx` - Custom sonner toast with severity border coloring
- `packages/app/src/hooks/useViolationSignals.ts` - Hook subscribing to WS validation:violation and showing toasts
- `packages/app/src/components/pipeline/CheckpointMarker.tsx` - Dot + tooltip + revert dialog below step nodes
- `packages/app/src/hooks/useCheckpointSync.ts` - Hook syncing checkpoints from backend to pipeline nodes
- `packages/app/src/lib/pipeline-types.ts` - Added checkpoint field to StepNodeData
- `packages/app/src/lib/pipeline-layout.ts` - Added checkpoint: null default for step nodes
- `packages/app/src/stores/pipelineStore.ts` - Added setCheckpoint action
- `packages/app/src/stores/pipelineStore.test.ts` - Fixed test to include checkpoint field
- `packages/app/src/components/pipeline/StepNode.tsx` - Added CheckpointMarker rendering and revert handler
- `packages/app/src/workbenches/shell/AppShell.tsx` - Wired useViolationSignals and useCheckpointSync hooks

## Decisions Made
- ViolationToast uses `toast.custom` with `createElement` for proper sonner integration from a non-JSX hook context
- Checkpoint-to-step matching uses timestamp windows (step startedAt to next step startedAt) with sequential fallback for unmatched pairs
- Both hooks subscribe to workbench-specific channel AND `_system` channel for system-wide violation/checkpoint broadcasts
- `formatRelativeTime` is a local helper in CheckpointMarker rather than a shared utility -- keeps it simple and co-located

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed pipelineStore test missing checkpoint field**
- **Found during:** Task 2 (extending StepNodeData)
- **Issue:** Existing pipelineStore.test.ts created StepNodeData objects without the new checkpoint field, causing type error
- **Fix:** Added `checkpoint: null` to the test's makeNodes helper
- **Files modified:** packages/app/src/stores/pipelineStore.test.ts
- **Verification:** Type-check passes cleanly
- **Committed in:** e19e98d (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Test fix was necessary for type-check to pass after adding checkpoint field to StepNodeData. No scope creep.

## Issues Encountered
- Shared package needed to be built before app type-check could resolve @afw/shared validation types (pnpm install + build resolved it)
- Pre-existing backend type errors in sessionManager.ts and sessionStore.ts (from phase 06) -- out of scope, not caused by this plan

## Known Stubs
None -- all components are wired to real data sources (WebSocket events, API endpoints, and pipelineStore actions).

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Validation signal display is complete -- violation toasts appear when WebSocket broadcasts validation:violation events
- Checkpoint timeline is wired -- pipeline step nodes show checkpoint markers with revert capability
- Ready for Plan 04 (approval UI) which builds on the same validationStore and WS patterns
- The revert API (POST /api/checkpoints/revert) and checkpoint list API (GET /api/checkpoints) were built in Plan 02

## Self-Check: PASSED

- All 5 created files exist on disk
- All 3 task commits verified in git log (8c56f31, e19e98d, b14c20f)

---
*Phase: 08-neural-validation-safety*
*Completed: 2026-04-03*
