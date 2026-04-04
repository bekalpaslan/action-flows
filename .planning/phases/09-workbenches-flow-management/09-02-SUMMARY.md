---
phase: 09-workbenches-flow-management
plan: 02
subsystem: api, state-management
tags: [zustand, express, flows, actions, workbench-personalities, zod]

# Dependency graph
requires:
  - phase: 06-agent-sessions-status
    provides: sessionManager with WORKBENCH_PERSONALITIES import, session-events.ts
  - phase: 05-pipeline-visualization
    provides: zustand store patterns (pipelineStore)
provides:
  - flowStore zustand store with loadFlows, getFlowsByContext, addFlow
  - flowSeeder service parsing FLOWS.md into storage on startup
  - GET /api/actions endpoint serving ACTIONS.md as structured JSON
  - Updated FlowMetadata.category with archive and studio workbench IDs
  - WORKBENCH_PERSONALITIES synced with Plan 01 systemPromptSnippet values (D-07)
affects: [09-03-flow-browser-composer, 09-01-workbench-pages, 09-04-workbench-content]

# Tech tracking
tech-stack:
  added: []
  patterns: [flow-seeder-idempotent-startup, legacy-category-mapping, markdown-to-json-parser]

key-files:
  created:
    - packages/backend/src/services/flowSeeder.ts
    - packages/backend/src/routes/actions.ts
    - packages/app/src/stores/flowStore.ts
  modified:
    - packages/shared/src/models.ts
    - packages/shared/src/session-events.ts
    - packages/backend/src/routes/flows.ts
    - packages/backend/src/index.ts

key-decisions:
  - "Flow seeder uses monorepo root resolution (walk up to packages/) for FLOWS.md path"
  - "Legacy category mapping includes 'respect' -> 'work' (per checker feedback, FLOW-02)"
  - "Actions endpoint caches parsed result in memory for subsequent requests"
  - "WORKBENCH_PERSONALITIES updated to shorter, more focused personality strings per D-07"

patterns-established:
  - "Markdown-to-JSON parsing: regex-based table row extraction with category header tracking"
  - "Idempotent seeder: check storage.keys() count before seeding, skip if non-zero"
  - "Legacy category normalization in frontend via CATEGORY_MAP lookup"

requirements-completed: [FLOW-01, FLOW-02, BENCH-08]

# Metrics
duration: 10min
completed: 2026-04-03
---

# Phase 9 Plan 02: Flow Data Layer Summary

**Flow data layer with FLOWS.md seeder, ACTIONS.md API, zustand flowStore, and legacy category mapping for all 7 workbench IDs**

## Performance

- **Duration:** 10 min
- **Started:** 2026-04-03T22:32:30Z
- **Completed:** 2026-04-03T22:43:25Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Backend category validation expanded to include all 7 workbench IDs (archive, studio added alongside 5 existing + 2 legacy)
- Flow seeder service parses FLOWS.md on startup and populates storage idempotently
- GET /api/actions endpoint serves parsed ACTIONS.md as structured JSON for FlowComposer
- Frontend flowStore provides getFlowsByContext() with legacy category mapping (maintenance->work, intel->explore, respect->work)
- WORKBENCH_PERSONALITIES synced with Plan 01 systemPromptSnippet values for D-07 backend injection

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix backend category enum, create flow seeder, sync WORKBENCH_PERSONALITIES** - `fa0e52d` (feat)
2. **Task 2: Create GET /api/actions endpoint and frontend flowStore** - `859efa4` (feat)

## Files Created/Modified
- `packages/backend/src/services/flowSeeder.ts` - Parses FLOWS.md and seeds flows into storage on startup
- `packages/backend/src/routes/actions.ts` - GET /api/actions serving parsed ACTIONS.md as JSON
- `packages/app/src/stores/flowStore.ts` - Zustand store with loadFlows, getFlowsByContext, addFlow
- `packages/shared/src/models.ts` - FlowMetadata.category union extended with 'archive' and 'studio'
- `packages/shared/src/session-events.ts` - WORKBENCH_PERSONALITIES updated to match Plan 01 values
- `packages/backend/src/routes/flows.ts` - Zod category enums updated for all 7 workbench IDs
- `packages/backend/src/index.ts` - Mounted /api/actions route and wired flowSeeder into startup

## Decisions Made
- Flow seeder resolves monorepo root by walking up from cwd until `packages/` directory is found, matching the pattern used by ConversationWatcher
- Actions endpoint caches parsed ACTIONS.md in memory after first request for performance
- Legacy 'respect' category mapped to 'work' (per checker feedback on FLOW-02 completeness)
- WORKBENCH_PERSONALITIES strings shortened to focused, action-oriented format matching Plan 01 systemPromptSnippet values

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Merged master into worktree for session-events.ts availability**
- **Found during:** Task 1 (reading session-events.ts)
- **Issue:** session-events.ts did not exist in the worktree branch (created in Phase 6-8, not yet merged)
- **Fix:** Merged master into worktree branch to bring in session-events.ts and other Phase 6-8 artifacts
- **Files modified:** Multiple (fast-forward merge of 155 files from master)
- **Verification:** session-events.ts accessible and editable after merge
- **Committed in:** Merge commit (before task commits)

**2. [Rule 3 - Blocking] Actions route monorepo root resolution**
- **Found during:** Task 2 (creating actions.ts route)
- **Issue:** Plan's actions.ts used `process.cwd()` directly for ACTIONS.md path, but backend may run from packages/backend/ not monorepo root
- **Fix:** Added monorepo root resolution (walk up to packages/ directory) matching flowSeeder pattern
- **Files modified:** packages/backend/src/routes/actions.ts
- **Verification:** Path resolution logic matches established pattern from flowSeeder and ConversationWatcher
- **Committed in:** 859efa4 (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both auto-fixes necessary for correct execution. No scope creep.

## Issues Encountered
- Backend tsc reports type mismatch for FlowMetadata.category at flows.ts line 158 because the worktree's @afw/shared resolves through node_modules symlink to the main repo's stale dist (does not include archive/studio). This is a worktree build artifact issue, not a code bug -- the source types are correctly updated.

## Known Stubs
None -- all data paths are wired: flowStore fetches from /api/flows, seeder writes to flow:* keys, actions route reads ACTIONS.md.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- flowStore ready for FlowBrowser and FlowComposer consumption (Plan 03)
- /api/actions ready for FlowComposer action catalog (Plan 03)
- WORKBENCH_PERSONALITIES ready for Plan 01 types.ts alignment
- Flow seeder populates initial data on backend startup for immediate flow browsing

## Self-Check: PASSED

All created files verified present. All commit hashes verified in git log.

---
*Phase: 09-workbenches-flow-management*
*Completed: 2026-04-03*
