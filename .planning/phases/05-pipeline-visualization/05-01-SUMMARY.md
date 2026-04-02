---
phase: 05-pipeline-visualization
plan: 01
subsystem: ui
tags: [xyflow, dagre, zustand, pipeline, react, typescript]

# Dependency graph
requires:
  - phase: 04-layout-shell
    provides: WorkbenchId type, uiStore pattern, vitest test infrastructure
  - phase: 01-backend-foundation
    provides: ChainStepSnapshot type in @afw/shared
provides:
  - "@xyflow/react v12 installed and configured with test mock"
  - "Pipeline type definitions (StepNodeData, GateNodeData, PipelineState)"
  - "Dagre layout utility (layoutPipeline) with fork/merge support"
  - "Per-workbench pipeline zustand store (usePipelineStore)"
  - "Pipeline CSS keyframes (pulse, edge-flow) with reduced-motion"
affects: [05-02-PLAN, 05-03-PLAN]

# Tech tracking
tech-stack:
  added: ["@xyflow/react ^12.10.2"]
  patterns: ["dagre center-to-topleft position adjustment", "per-workbench Map state in zustand", "gate detection via action name pattern matching"]

key-files:
  created:
    - packages/app/src/lib/pipeline-types.ts
    - packages/app/src/lib/pipeline-layout.ts
    - packages/app/src/lib/pipeline-layout.test.ts
    - packages/app/src/stores/pipelineStore.ts
    - packages/app/src/stores/pipelineStore.test.ts
    - packages/app/src/components/pipeline/pipeline.css
    - packages/app/src/__tests__/__mocks__/xyflow-react.ts
  modified:
    - packages/app/package.json
    - packages/app/vitest.config.ts
    - pnpm-lock.yaml

key-decisions:
  - "Replaced deprecated reactflow/reactflow-core with @xyflow/react v12 for current API and active maintenance"
  - "Gate detection uses action name pattern matching (gate/check/decision) as naming convention per RESEARCH.md"
  - "Per-workbench state uses Map<WorkbenchId, PipelineState> in zustand for independent pipeline isolation"
  - "Immutable updates in store (new Map, new array) to satisfy @xyflow/react v12 change detection"

patterns-established:
  - "dagre center-to-topleft: node positions adjusted from dagre center to top-left for @xyflow/react"
  - "gate detection: isGateStep() checks action name for gate/check/decision keywords (case-insensitive)"
  - "per-workbench Map state: zustand store uses Map<WorkbenchId, T> pattern for workbench-scoped state"
  - "xyflow test mock: comprehensive stub at __mocks__/xyflow-react.ts aliased via vitest config"

requirements-completed: [PIPE-02, PIPE-04, PIPE-07]

# Metrics
duration: 4min
completed: 2026-04-02
---

# Phase 05 Plan 01: Pipeline Foundation Summary

**@xyflow/react v12 with dagre layout engine, pipeline type contracts, per-workbench zustand store, and 19 passing tests**

## Performance

- **Duration:** 4 min
- **Started:** 2026-04-02T19:33:02Z
- **Completed:** 2026-04-02T19:37:51Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments
- Installed @xyflow/react v12, removed deprecated reactflow and @reactflow/core
- Built dagre layout utility converting ChainStepSnapshot[] to positioned nodes/edges with fork/merge support
- Created per-workbench pipeline zustand store with init, update, select, clear, and edge update actions
- Established pipeline type definitions (StepNodeData, GateNodeData, PipelineState)
- Added CSS keyframes (pulse, edge-flow) with prefers-reduced-motion support
- Set up comprehensive @xyflow/react test mock for happy-dom environment
- All 19 new tests pass (13 layout, 6 store), 24 total app tests pass

## Task Commits

Each task was committed atomically:

1. **Task 1: Install @xyflow/react, remove deprecated reactflow, add test mock, create pipeline types and CSS keyframes** - `21679e5` (feat)
2. **Task 2 RED: Add failing tests for layout utility and store** - `dc34b3c` (test)
3. **Task 2 GREEN: Implement pipeline layout utility and per-workbench store** - `fd0e328` (feat)

## Files Created/Modified
- `packages/app/src/lib/pipeline-types.ts` - Pipeline type definitions (StepNodeData, GateNodeData, PipelineState, NodeStatus)
- `packages/app/src/lib/pipeline-layout.ts` - Dagre layout utility converting ChainStepSnapshot[] to positioned xyflow nodes/edges
- `packages/app/src/lib/pipeline-layout.test.ts` - 13 tests covering sequential, fork, merge, gate detection, empty input, position adjustment
- `packages/app/src/stores/pipelineStore.ts` - Zustand store with per-workbench pipeline state Map
- `packages/app/src/stores/pipelineStore.test.ts` - 6 tests covering init, update, select, clear, isolation, edge update
- `packages/app/src/components/pipeline/pipeline.css` - CSS keyframes for pipeline animations with reduced-motion
- `packages/app/src/__tests__/__mocks__/xyflow-react.ts` - Comprehensive @xyflow/react mock for happy-dom test environment
- `packages/app/vitest.config.ts` - Added @xyflow/react alias to resolve.alias
- `packages/app/package.json` - Added @xyflow/react, removed reactflow and @reactflow/core
- `pnpm-lock.yaml` - Updated lockfile

## Decisions Made
- Replaced deprecated reactflow/@reactflow/core with @xyflow/react v12 for current API surface and active maintenance
- Gate detection uses action name pattern matching (gate/check/decision) -- simple naming convention per RESEARCH.md
- Per-workbench state uses Map<WorkbenchId, PipelineState> in zustand for independent pipeline isolation (PIPE-07)
- Immutable updates in store (new Map, new arrays) to satisfy @xyflow/react v12 change detection requirements

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Pre-existing uuid type error in `pnpm type-check` (TS2688: Cannot find type definition file for 'uuid') -- confirmed pre-existing, not introduced by this plan. Out of scope.

## User Setup Required

None - no external service configuration required.

## Known Stubs

None -- all types, functions, and store actions are fully implemented with real logic and passing tests.

## Next Phase Readiness
- Pipeline foundation is complete: types, layout engine, store, test infrastructure
- Ready for Plan 02 (StepNode/GateNode components, custom edge, ReactFlow canvas)
- All exports needed by Plan 02 are in place: layoutPipeline, usePipelineStore, PipelineNode types, CSS keyframes

## Self-Check: PASSED

All 7 created files verified on disk. All 3 commit hashes (21679e5, dc34b3c, fd0e328) found in git log.

---
*Phase: 05-pipeline-visualization*
*Completed: 2026-04-02*
