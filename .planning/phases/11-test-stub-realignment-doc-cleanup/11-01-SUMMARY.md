---
phase: 11-test-stub-realignment-doc-cleanup
plan: 01
subsystem: testing
tags: [vitest, backend, mock-storage, glob-patterns, scope-isolation]

# Dependency graph
requires:
  - phase: 10-customization-automation
    provides: SkillService, HealingQuotaTracker, ScheduledTaskService implementations against which Wave 0 stubs were originally written
provides:
  - Backend test suite passes 0 failures across packages/backend/src/services/__tests__/
  - skillService.test.ts realigned to real two-arg createSkill(workbenchId, data) API with trigger/action fields
  - healingQuotaTracker.test.ts mock storage now handles multi-wildcard glob patterns
  - schedulerService.test.ts deleted (stale Wave 0 artifact for renamed/refactored service)
affects:
  - 11-02-doc-cleanup (parallel sibling)
  - v4.8-milestone archival (clean test baseline prerequisite)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Mock storage glob-to-regex conversion: split('*') + escape segments + join('.*') for multi-wildcard support, mirroring production Memory/Redis Storage.keys() behaviour"
    - "Scope isolation enforced via storage key prefix (skill:${workbenchId}:${id}) rather than runtime guard — wrong-workbench lookups return null naturally"

key-files:
  created: []
  modified:
    - packages/backend/src/services/__tests__/skillService.test.ts
    - packages/backend/src/services/__tests__/healingQuotaTracker.test.ts
  deleted:
    - packages/backend/src/services/__tests__/schedulerService.test.ts

key-decisions:
  - "D-01/D-02: delete schedulerService.test.ts rather than rewrite against ScheduledTaskService — Wave 0 stub had different name, different methods, no production value"
  - "D-03/D-04: rewrite the 5 failing skillService tests against the real two-arg createSkill API with trigger/action field names"
  - "D-05: leave the 2 originally-passing skillService tests untouched"
  - "D-06/D-07: investigated single healingQuotaTracker failure; root cause is the test's mock storage using single-wildcard String.replace, not a service bug — fix the mock"

patterns-established:
  - "Test mocks for Storage must mirror multi-wildcard glob semantics (production Memory/Redis already handle this)"
  - "Workbench scope isolation: storage key prefix is the source of truth, not runtime checks"

requirements-completed: [cleanup]

# Metrics
duration: 8min
completed: 2026-04-10
---

# Phase 11 Plan 01: Test Stub Realignment Summary

**Three stale Wave 0 backend test stubs realigned: schedulerService.test.ts deleted, skillService.test.ts rewritten against the real two-arg createSkill API, healingQuotaTracker.test.ts mock storage fixed to handle multi-wildcard glob patterns — backend test suite now passes 0 failures.**

## Performance

- **Duration:** 8 min
- **Started:** 2026-04-10T22:41:54Z
- **Completed:** 2026-04-10T22:50:21Z
- **Tasks:** 3
- **Files modified:** 2 (1 rewritten, 1 fixed)
- **Files deleted:** 1

## Accomplishments

- **Backend test suite is now green:** 42 test files passing (was 40 passed + 3 failed), 981 tests passing (was 975 passed + 6 failed), 4 skipped
- **schedulerService.test.ts removed:** stale TDD RED-phase artifact that imported a non-existent module path and used a class name (`SchedulerService`) plus methods (`toggleTask`, `recordExecution`, `getExecutionHistory`, `enabled` field) that never existed on the real `ScheduledTaskService`
- **skillService.test.ts realigned:** all 5 failing tests rewritten against the real `createSkill(workbenchId: string, data: { name, description, trigger, action })` signature; the 2 originally-passing tests left untouched per D-05
- **healingQuotaTracker.test.ts root-caused and fixed:** the failing `getActiveCircuitBreakers` test was being broken by the test file's own mock — the production service is correct
- **Zero production code touched:** `git diff` of `skillService.ts`, `healingQuotaTracker.ts`, `scheduledTaskService.ts` is empty

## Task Commits

Each task was committed atomically:

1. **Task 1: Delete stale schedulerService.test.ts** - `f784d98` (chore)
2. **Task 2: Rewrite skillService tests against real two-arg API** - `ae86480` (test)
3. **Task 3: Fix healingQuotaTracker mock storage multi-wildcard bug** - `1ddb144` (fix)

## Test Counts

### Baseline (before this plan)

```
Test Files: 3 failed | 40 passed (43)
Tests:      6 failed | 975 passed | 4 skipped (985)
```

The 3 failing files were:
- `schedulerService.test.ts` — module-not-found at import time, 0 visible tests
- `skillService.test.ts` — 2 passing + 5 failing
- `healingQuotaTracker.test.ts` — 5 passing + 1 failing

### Target / End State

```
Test Files: 42 passed (42)
Tests:      981 passed | 4 skipped (985)
```

Net change:
- `-3` failing files
- `-6` failing tests
- `+5` newly passing tests (the 5 rewritten skillService tests + 1 fixed healingQuotaTracker test, minus the deleted schedulerService file which previously contributed a file failure but 0 visible test cases)

### Per-file end state for the 3 target files

| File                              | Tests | Status                         |
| --------------------------------- | ----- | ------------------------------ |
| `schedulerService.test.ts`        | n/a   | DELETED                        |
| `skillService.test.ts`            | 7     | All passing (5 rewritten, 2 preserved) |
| `healingQuotaTracker.test.ts`     | 6     | All passing                    |

## Files Created/Modified

- `packages/backend/src/services/__tests__/schedulerService.test.ts` — **deleted** via `git rm` (stale Wave 0 stub)
- `packages/backend/src/services/__tests__/skillService.test.ts` — rewritten: 5 failing tests realigned to real two-arg `createSkill`/`updateSkill`/`deleteSkill` signatures with `trigger`/`action` field names; scope-guard test now uses the natural storage-key isolation rather than the non-existent `invokeSkill()` method
- `packages/backend/src/services/__tests__/healingQuotaTracker.test.ts` — mock storage `keys()` function rewritten to convert glob patterns to regex via `split('*')` + segment escape + `join('.*')`, fixing multi-wildcard support so `healingQuota:*:*:${date}` matches stored keys correctly

### Specific tests rewritten in skillService.test.ts (the 5 failing ones)

1. `createSkill > should store skill scoped to workbenchId` — switched from one-arg `createSkill({ workbenchId, ..., triggerPattern, actionDescription })` to two-arg `createSkill('work', { ..., trigger, action })`
2. `listSkills > should return only skills for the specified workbenchId (scope isolation)` — same two-arg conversion applied to both creates
3. `updateSkill > should modify name and description` (renamed from `should modify name/description and update updatedAt`) — switched to three-arg `updateSkill('work', created.id, updates)`; dropped the `updatedAt` assertion (real `Skill` type has no `updatedAt` field per `packages/shared/src/skillTypes.ts`); replaced with a name-changed assertion to preserve the test's "update worked" intent
4. `deleteSkill > should remove skill from storage` — switched to two-arg `deleteSkill('work', skill.id)` and now asserts the boolean `true` return value; subsequent `getSkill('work', skill.id)` and `listSkills('work')` calls verify removal
5. `scope guard > should not find skill from a different workbench (scope isolation)` (renamed from `should not allow invoking skill from a different workbench`) — replaced the call to the non-existent `service.invokeSkill(skill.id, 'explore')` with `service.getSkill('explore', skill.id)` returning null because the storage key is `skill:work:${id}` not `skill:explore:${id}`; positive control verifies the skill is still retrievable from the owning workbench

The 2 originally-passing tests (`listSkills > should return empty array for workbench with no skills` and `getSkill > should return null for non-existent skill`) were left exactly as-is per D-05.

### Mock storage regex fix in healingQuotaTracker.test.ts

The test file's `createMockStorage().keys` function previously did:

```typescript
keys: vi.fn((pattern: string) => {
  const prefix = pattern.replace('*', '');
  return [...data.keys()].filter(k => k.startsWith(prefix));
}),
```

`String.prototype.replace` with a string argument only replaces the FIRST occurrence. The healing quota tracker calls `storage.keys('healingQuota:*:*:${today}')` (two wildcards), so the mock was converting that to `'healingQuota::*:${today}'` and filtering by `startsWith` — no real keys (e.g., `'healingQuota:work:build-flow:2026-04-05'`) match that mangled prefix, so the test saw `breakers.length === 0` instead of 1.

The fix converts the glob pattern to a proper regex by splitting on `*`, escaping regex metacharacters in each literal segment, and joining with `.*`:

```typescript
keys: vi.fn((pattern: string) => {
  const regexSource = pattern
    .split('*')
    .map(segment => segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('.*');
  const regex = new RegExp(`^${regexSource}$`);
  return [...data.keys()].filter(k => regex.test(k));
}),
```

This mirrors the existing `redis.test.ts` mock at line 115 (`pattern.replace(/\*/g, '.*')`) and matches the production Memory and Redis Storage `keys()` semantics, both of which already handle multi-wildcard patterns correctly. The fix is scoped to `healingQuotaTracker.test.ts` only — `skillService.test.ts` only uses single-wildcard patterns (`skill:work:*`) and was deliberately not modified, and the scheduler test file is being deleted in Task 1.

### Confirmation that no production service code was touched

```bash
$ git diff packages/backend/src/services/healingQuotaTracker.ts
(empty)
$ git diff packages/backend/src/services/skillService.ts
(empty)
$ git diff packages/backend/src/services/scheduledTaskService.ts
(empty)
```

All three production services are byte-identical to their pre-plan state. Only test files changed.

## Decisions Made

All decisions were locked in `.planning/phases/11-test-stub-realignment-doc-cleanup/11-CONTEXT.md` before execution:

- **D-01/D-02:** Delete `schedulerService.test.ts` rather than rewrite against `ScheduledTaskService`. The Wave 0 stub had a different name, different methods, and a non-existent enabled field. Re-creating equivalent unit tests against the renamed service is explicitly out of scope.
- **D-03/D-04:** Rewrite the 5 failing skillService tests against the real two-arg `createSkill(workbenchId, data)` API with `trigger`/`action` field names (not `triggerPattern`/`actionDescription`).
- **D-05:** Leave the 2 originally-passing skillService tests untouched. Neither test was rewritten; both still appear in the file with their original wording and signatures.
- **D-06/D-07:** Investigate the single `getActiveCircuitBreakers` failure. Root cause: test mock storage using single-wildcard `String.replace`. Production storage implementations (Memory, Redis) handle multi-wildcards correctly — the bug is in the simplified test mock, not the service. Fix the mock; do not touch the service.

## Deviations from Plan

**None — plan executed exactly as written.**

The plan was an unusually high-fidelity gap-closure plan with copy-paste-ready code blocks for all three tasks, including pre-computed root-cause analysis for the healing quota mock bug. Every action was applied verbatim. One small comment-cleanup adjustment was made to the skillService.test.ts header to satisfy a literal grep acceptance criterion (`grep -c "triggerPattern|actionDescription|invokeSkill"` returning 0) — the original draft mentioned the stale identifiers in a documentation comment for context, but the criterion treated those as forbidden tokens, so the comment was reworded to avoid them while preserving the migration note. This is not a deviation from intent — the test logic is unchanged.

## Issues Encountered

- **Worktree missing dependencies:** the worktree was freshly created with no `node_modules`. Resolved by running `pnpm install --prefer-offline` (~35s) and then `pnpm --filter @afw/shared build` to produce the `@afw/shared` package's dist output that vitest needs to resolve the workspace import. After that, the baseline test run reproduced the documented failure state (3 failed files / 6 failed tests / 7 passing) exactly.
- **Worktree branch base predates phase 11 PLAN.md commit:** the worktree was branched from `0eb0c23`, which is before the commit (`4b63124` on master) that added `11-01-PLAN.md` and `11-02-PLAN.md` to the phase directory. The plan content was provided via the orchestrator's prompt context, so this had no impact on execution. The SUMMARY.md is being written alongside the existing CONTEXT.md and will land in the correct location once the orchestrator merges this worktree.
- **CRLF warning during commits:** Git emitted a `LF will be replaced by CRLF` warning when committing the test files. This is a Windows-only autocrlf cosmetic warning and does not affect file content or behaviour.

## User Setup Required

None — pure test cleanup, no external services or environment variables involved.

## Next Phase Readiness

- Backend test baseline is green: `pnpm --filter @afw/backend test` exits 0
- Plan 11-02 (doc cleanup, parallel sibling) can merge independently — zero file overlap
- After both 11-01 and 11-02 land, the milestone success criterion "All 3 stale Wave 0 test stubs in `packages/backend/src/services/__tests__/` pass or are replaced" is satisfied
- v4.8 milestone archival can proceed with a clean test suite

## Self-Check: PASSED

Verified post-write:

- `packages/backend/src/services/__tests__/schedulerService.test.ts` — MISSING (deleted, as expected)
- `packages/backend/src/services/__tests__/skillService.test.ts` — FOUND, contains 5 instances of `service.createSkill('` and 0 instances of `triggerPattern|actionDescription|invokeSkill`
- `packages/backend/src/services/__tests__/healingQuotaTracker.test.ts` — FOUND, contains 1 `new RegExp` and 0 instances of `pattern.replace('*', '')`
- Commit `f784d98` — FOUND in `git log` (Task 1: delete scheduler)
- Commit `ae86480` — FOUND in `git log` (Task 2: rewrite skill)
- Commit `1ddb144` — FOUND in `git log` (Task 3: fix healing mock)
- `pnpm --filter @afw/backend test` — exits 0, 42 test files passed, 981 tests passed, 4 skipped, 0 failed
- Production services (`skillService.ts`, `healingQuotaTracker.ts`, `scheduledTaskService.ts`) — `git diff` empty for all three

---

*Phase: 11-test-stub-realignment-doc-cleanup*
*Plan: 01*
*Completed: 2026-04-10*
