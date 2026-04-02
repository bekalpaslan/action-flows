---
phase: 01-typescript-foundation
plan: 03
subsystem: backend
tags: [typescript, null-guards, param-validation, branded-types, routes, cli]

# Dependency graph
requires:
  - phase: 01-typescript-foundation (plan 01)
    provides: "Clean shared artifact types with sessionId/timestamp, storage layer fixes"
  - phase: 01-typescript-foundation (plan 02)
    provides: "All 16 backend service files compile with zero TypeScript errors"
provides:
  - "Zero TypeScript errors across all backend packages (backend, shared, hooks, mcp-server)"
  - "All route handlers validate req.params with early-return 400 guards"
  - "CLI entry points validate arguments with null guards"
  - "Complete UniverseGraph initialization with all required metadata fields"
  - "Optional delete() KV method on Storage interface for flow unregistration"
affects: [phase-02+, frontend-rebuild, agent-patterns]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Route param validation: extract param, guard with if (!param), return 400"
    - "WorkspaceEvent union narrowing: 'sessionId' in event before accessing sessionId"
    - "Optional chaining for regex match groups: match?.[1]?.trim() ?? ''"
    - "Branded type constructors: toUserId(), toSessionId() instead of as-casts"

key-files:
  created: []
  modified:
    - packages/backend/src/routes/events.ts
    - packages/backend/src/routes/dossiers.ts
    - packages/backend/src/routes/lifecycle.ts
    - packages/backend/src/routes/sessions.ts
    - packages/backend/src/routes/analytics.ts
    - packages/backend/src/routes/suggestions.ts
    - packages/backend/src/routes/patterns.ts
    - packages/backend/src/routes/healingRecommendations.ts
    - packages/backend/src/routes/flows.ts
    - packages/backend/src/cli/harmony-enforce.ts
    - packages/backend/src/cli/validate-contracts.ts
    - packages/backend/src/utils/shellEscape.ts
    - packages/backend/src/index.ts
    - packages/backend/src/storage/index.ts
    - packages/backend/src/storage/redis.ts

key-decisions:
  - "Added optional delete() to Storage interface (same pattern as existing set/get/keys) for flow unregistration"
  - "Used 'sessionId' in event narrowing for WorkspaceEvent union instead of as-any casts"
  - "Used brandedTypes.currentTimestamp() for UniverseGraph metadata instead of string cast"
  - "Used toUserId() constructor instead of as-any for UserId branded type in sessions routes"

patterns-established:
  - "Route param guard: if (!param) return res.status(400).json({ error: 'Missing required parameter: ...' })"
  - "Regex group guard: match?.[N]?.method() ?? default"
  - "Array index guard: const item = arr[i]; if (item) { ... }"

requirements-completed: [FOUND-01, FOUND-02]

# Metrics
duration: 17min
completed: 2026-04-02
---

# Phase 01 Plan 03: Routes, CLI, and Entry Point TypeScript Fixes Summary

**Zero backend TypeScript errors with param validation guards on all route handlers, null-safe CLI args, and complete UniverseGraph initialization**

## Performance

- **Duration:** 17 min
- **Started:** 2026-04-02T01:07:11Z
- **Completed:** 2026-04-02T01:24:08Z
- **Tasks:** 2
- **Files modified:** 15

## Accomplishments
- Resolved all 36 TypeScript errors across 9 route files, 2 CLI files, 1 utility, and 1 entry point
- Zero TypeScript errors in backend, shared, hooks, second-opinion, and mcp-server packages
- 945 backend tests pass with zero regressions
- Production build (pnpm build) succeeds
- All 9 target route files and 4 non-route target files have zero `as any` casts
- Removed all `as any` casts from events.ts (3 removed), flows.ts (1 removed), sessions.ts (4 removed)

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix route handler TypeScript errors (9 route files + 2 storage files)** - `2f055da` (fix)
2. **Task 2: Fix CLI, utilities, entry point, and run final verification** - `7102045` (fix)

## Files Created/Modified
- `packages/backend/src/routes/events.ts` - WorkspaceEvent union narrowing with 'sessionId' in event, previousStep null guard, removed 3 as-any casts, ChainId branded Map type
- `packages/backend/src/routes/dossiers.ts` - Added param validation guards on 5 handlers (GET, PUT, DELETE, GET history, POST analyze)
- `packages/backend/src/routes/lifecycle.ts` - Added resourceType param validation guard
- `packages/backend/src/routes/sessions.ts` - Added id param guard on PUT handler, replaced as-any with toUserId() in 2 user session handlers
- `packages/backend/src/routes/analytics.ts` - Null guard for regex match groups in parseTimeRange
- `packages/backend/src/routes/suggestions.ts` - Added id param guards on DELETE and POST promote handlers
- `packages/backend/src/routes/patterns.ts` - Added bookmarkId param guard on DELETE handler
- `packages/backend/src/routes/healingRecommendations.ts` - Added id param guard on PATCH handler
- `packages/backend/src/routes/flows.ts` - Removed as-any cast on storage.delete() call
- `packages/backend/src/storage/index.ts` - Added optional delete?() to Storage interface
- `packages/backend/src/storage/redis.ts` - Implemented delete() KV method and added to RedisStorage type
- `packages/backend/src/cli/harmony-enforce.ts` - Null guards for regex match groups (id, name, priority)
- `packages/backend/src/cli/validate-contracts.ts` - Optional chaining for propsMatch group access
- `packages/backend/src/utils/shellEscape.ts` - Optional chaining for baseCmdMatch group access
- `packages/backend/src/index.ts` - Complete UniverseGraph metadata with discoveryTriggers, evolutionHistory, mapBounds; replaced as-any with ProjectId cast

## Decisions Made
- Added optional `delete?(key: string)` method to Storage interface following the same pattern as existing `set?`, `get?`, `keys?` optional KV methods -- this enables flow unregistration without `as any`
- Used `'sessionId' in event` narrowing guard for WorkspaceEvent union access (consistent with Plan 01 pattern) to remove `as any` casts from events.ts step handling code
- Used `brandedTypes.currentTimestamp()` for UniverseGraph metadata timestamps instead of casting `new Date().toISOString()` -- avoids branded type bypass
- Used `toUserId()` constructor for session user lookup instead of `as any` cast -- proper branded type usage

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added delete() to Storage interface for flow unregistration**
- **Found during:** Task 1 (flows.ts error)
- **Issue:** `storage.delete` referenced in flows.ts but no `delete` method on Storage interface; code used `(storage as any).delete(key)` as workaround
- **Fix:** Added optional `delete?(key: string): Promise<boolean> | boolean` to Storage interface and implemented in RedisStorage
- **Files modified:** packages/backend/src/storage/index.ts, packages/backend/src/storage/redis.ts
- **Verification:** Type-check passes, flows.ts no longer needs as-any cast
- **Committed in:** 2f055da (Task 1 commit)

**2. [Rule 1 - Bug] UniverseGraph metadata missing required fields**
- **Found during:** Task 2 (index.ts error)
- **Issue:** UniverseMetadata interface requires evolutionHistory, totalInteractions, discoveredRegionCount, totalRegionCount, mapBounds but init only provided version, createdAt, lastModifiedAt
- **Fix:** Added all required fields with proper defaults and used brandedTypes.currentTimestamp() for timestamps
- **Files modified:** packages/backend/src/index.ts
- **Verification:** Type-check passes with zero errors
- **Committed in:** 7102045 (Task 2 commit)

**3. [Rule 1 - Bug] Removed pre-existing as-any casts from target route files**
- **Found during:** Task 1 (events.ts, sessions.ts)
- **Issue:** events.ts had 3 as-any casts (stepEvent, chainId), sessions.ts had 4 as-any casts (userId) that were pre-existing but violated FOUND-02
- **Fix:** Used proper type narrowing (event.stepNumber after type guard), ChainId branded Map type, and toUserId() constructor
- **Files modified:** packages/backend/src/routes/events.ts, packages/backend/src/routes/sessions.ts
- **Verification:** Type-check passes, no as-any in any of the 13 target files
- **Committed in:** 2f055da (Task 1), 7102045 (Task 2)

**4. [Rule 2 - Missing Critical] Added delete() to RedisStorage type interface**
- **Found during:** Task 2 (redis.ts type error)
- **Issue:** Implementation added delete() method to redis object but RedisStorage type interface did not include it
- **Fix:** Added delete() signature to RedisStorage interface
- **Files modified:** packages/backend/src/storage/redis.ts
- **Verification:** Type-check passes
- **Committed in:** 7102045 (Task 2 commit)

---

**Total deviations:** 4 auto-fixed (2 bugs, 2 missing critical)
**Impact on plan:** All auto-fixes necessary for type correctness and FOUND-02 compliance. No scope creep.

## Known Stubs
None -- all changes are type fixes with no UI or data dependencies.

## Deferred Items
- Pre-existing `as any` casts exist in 20+ files outside the plan's target files (middleware, services, surfaces, ws, schemas) -- these are documented but not in scope for Plan 03
- Pre-existing `as SessionId` branded type casts in sessions.ts route handlers (30+ occurrences) are functional but could be replaced with toSessionId() in a future cleanup
- Pre-existing TypeScript errors in packages/app (bundleAnalyzer, electron, tests) are not caused by backend changes and require separate frontend cleanup
- Pre-existing frontend test failures (contract file path validation) are unrelated to backend type fixes

## Issues Encountered
None -- plan executed cleanly with expected error counts matching research predictions.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 01 (typescript-foundation) is complete: zero backend TypeScript errors, all tests pass, build succeeds
- Patterns established (param guards, type narrowing, branded constructors) are ready for agents to imitate in subsequent phases
- Frontend TypeScript errors remain (out of Phase 01 scope) and will need separate attention

## Self-Check: PASSED

- 01-03-SUMMARY.md: FOUND
- Commit 2f055da: FOUND
- Commit 7102045: FOUND
- All 15 modified files: FOUND

---
*Phase: 01-typescript-foundation*
*Completed: 2026-04-02*
