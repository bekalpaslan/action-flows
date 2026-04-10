# Phase 11: Test Stub Realignment & Doc Cleanup - Context

**Gathered:** 2026-04-11
**Status:** Ready for planning
**Source:** Derived from `.planning/v4.8-MILESTONE-AUDIT.md` (corrected 2026-04-11)

<domain>
## Phase Boundary

Close residual cleanup identified during v4.8 milestone audit correction. This phase has no functional requirements — all 74 milestone requirements are already verified satisfied in code. Scope is purely:

1. Realign 3 stale Wave 0 test stubs from Phase 10 so they exercise the real service APIs
2. Refresh stale REQUIREMENTS.md checkboxes for phases 6/7/8 (doc gap)
3. Generate missing Phase 04.1 VERIFICATION.md
4. Flip Phase 999.1 VALIDATION.md Nyquist flags that were never set to true after Wave 0 completed

**Out of scope:** Any new feature work, API changes, or behavior modifications. This is entirely cleanup before `/gsd:complete-milestone v4.8`.

</domain>

<decisions>
## Implementation Decisions

### Stale Test Stub 1: schedulerService.test.ts
- **D-01:** Delete the stale stub entirely. The file imports `../schedulerService.js` which does not exist and uses `SchedulerService` class name + different method signatures (`toggleTask`, `recordExecution`, `getExecutionHistory`, `enabled` field) that don't match the real `ScheduledTaskService`.
- **D-02:** Rely on existing route integration tests. The `ScheduledTaskService` is covered by `routes/__tests__/scheduledTasks.test.ts` (if it exists) and by manual/e2e verification. Re-creating 5 duplicate unit tests against the renamed service is make-work.
- **Rationale:** The Wave 0 stub was written before final implementation. The final implementation landed with a different name (`ScheduledTaskService`) and a different API shape. The stub is not a useful test — it's a historical artifact of the TDD RED phase that was never cleaned up.

### Stale Test Stub 2: skillService.test.ts
- **D-03:** Rewrite the 5 failing tests to match the real `SkillService` API.
- **D-04:** Real API signature:
  ```typescript
  createSkill(workbenchId: string, data: {
    name: string;
    description: string;
    trigger: string;    // NOT triggerPattern
    action: string;     // NOT actionDescription
  }): Promise<Skill>
  ```
- **D-05:** The 2 passing tests (if any) stay as-is. Only modify the 5 failing ones.
- **Rationale:** SkillService is a real, used service. The tests cover real behavior (scope isolation, CRUD, invocation guard). Just need to match the current API shape.

### Stale Test Stub 3: healingQuotaTracker.test.ts
- **D-06:** Investigate the single `getActiveCircuitBreakers` failure (expects length=1, receives 0). Determine whether it's a test setup issue (wrong preconditions) or a real service bug.
- **D-07:** If service bug: fix the service. If test bug: fix the test. Do NOT suppress or delete the test — HealingQuotaTracker is load-bearing for the circuit breaker behavior.
- **Rationale:** This is the only test that could represent a real latent bug. It deserves investigation, not deletion.

### Doc Staleness: REQUIREMENTS.md checkbox refresh
- **D-08:** Update the traceability table in `.planning/REQUIREMENTS.md` to flip `[ ]` → `[x]` and `Pending` → `Satisfied` for all 28 requirements verified in phase VERIFICATION files:
  - SESSION-01..09 (Phase 06)
  - STATUS-01..03 (Phase 06)
  - CHAT-01..08 (Phase 07)
  - NEURAL-01..07 (Phase 08)
  - SAFETY-01..05 (Phase 08)
- **D-09:** Cross-reference each against the phase VERIFICATION.md file before flipping. Do NOT flip any checkbox that isn't explicitly marked Satisfied in the corresponding verification report.
- **D-10:** Update the coverage count at the top of REQUIREMENTS.md after the flip.

### Doc Staleness: Phase 04.1 VERIFICATION.md
- **D-11:** Generate `.planning/phases/04.1-framework-docs-realignment-strip-cosmic-terminology-update-actionflows-framework-to-match-7-workbench-model-clean-stale-docs-and-tests/04.1-VERIFICATION.md` by reading all 5 Phase 04.1 SUMMARY.md files and synthesizing a verification report.
- **D-12:** Verification approach: grep-based validation that the success criteria from ROADMAP Phase 04.1 section are met. No running code — this was a pure docs/deletion phase.
- **D-13:** Expected status: `passed`. Phase 04.1 was a deletion + rewrite phase with low risk.

### Doc Staleness: Phase 999.1 VALIDATION.md Nyquist flags
- **D-14:** Flip `nyquist_compliant: false` → `nyquist_compliant: true` in `.planning/phases/999.1-history-and-memory-lifecycle-management/999.1-VALIDATION.md` frontmatter.
- **D-15:** Flip `wave_0_complete: false` → `wave_0_complete: true` in same frontmatter.
- **D-16:** Rationale: All Wave 0 test stubs were created during Plan 999.1-01 and ran GREEN by Plan 999.1-02 (verified via execution logs during phase execution).

### Claude's Discretion
- Exact wave grouping for the 4 cleanup task groups (all 4 are independent and can run in parallel as one Wave)
- How to structure the skillService.test.ts rewrite (per-test edit vs full file rewrite)
- Whether to add any new test cases beyond the 5 failing ones (do NOT — keep scope minimal)
- How to format the 04.1-VERIFICATION.md report (use the gsd-verifier template structure if available)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Audit (source of truth for scope)
- `.planning/v4.8-MILESTONE-AUDIT.md` — corrected audit with full cleanup catalog

### Stale test stubs (files to fix or delete)
- `packages/backend/src/services/__tests__/schedulerService.test.ts` — delete target
- `packages/backend/src/services/__tests__/skillService.test.ts` — rewrite target (5 failing tests)
- `packages/backend/src/services/__tests__/healingQuotaTracker.test.ts` — investigate target (1 failing test)

### Real service implementations (reference for API shape)
- `packages/backend/src/services/scheduledTaskService.ts` — real scheduler service (not the stale stub's target)
- `packages/backend/src/services/skillService.ts` — real skill service with current API
- `packages/backend/src/services/healingQuotaTracker.ts` — real healing quota tracker

### Doc staleness targets
- `.planning/REQUIREMENTS.md` — checkbox refresh target
- `.planning/phases/04.1-framework-docs-realignment-strip-cosmic-terminology-update-actionflows-framework-to-match-7-workbench-model-clean-stale-docs-and-tests/` — target for new VERIFICATION.md
- `.planning/phases/999.1-history-and-memory-lifecycle-management/999.1-VALIDATION.md` — Nyquist flag flip target

### Phase VERIFICATION files (source for checkbox refresh)
- `.planning/phases/06-agent-sessions-status/06-VERIFICATION.md`
- `.planning/phases/07-chat-panel/07-VERIFICATION.md`
- `.planning/phases/08-neural-validation-safety/08-VERIFICATION.md`

### Phase 04.1 SUMMARY files (source for VERIFICATION synthesis)
- `.planning/phases/04.1-framework-docs-realignment-strip-cosmic-terminology-update-actionflows-framework-to-match-7-workbench-model-clean-stale-docs-and-tests/04.1-01-SUMMARY.md`
- `.planning/phases/04.1-framework-docs-realignment-.../04.1-02-SUMMARY.md`
- `.planning/phases/04.1-framework-docs-realignment-.../04.1-03-SUMMARY.md`
- `.planning/phases/04.1-framework-docs-realignment-.../04.1-04-SUMMARY.md`
- `.planning/phases/04.1-framework-docs-realignment-.../04.1-05-SUMMARY.md`

</canonical_refs>

<code_context>
## Existing Code Insights

### Test Infrastructure
- Framework: Vitest 4.0.0
- Backend test command: `pnpm --filter @afw/backend test` or `pnpm --filter @afw/backend exec vitest run`
- Current state (2026-04-11 baseline): 3 test files failing, 40 passing; 6 tests failing, 975 passing, 4 skipped (985 total)
- Target end state: 0 failing tests in backend package (net change: -3 failing files, -6 failing tests, +5 passing tests from skillService rewrite)

### REQUIREMENTS.md Structure
- Uses markdown traceability table with columns: REQ-ID | Description | Priority | Phase | Status
- Status values: `Pending`, `Satisfied`, `Satisfied with follow-ups`, `Deferred`
- Checkbox column uses `[ ]` / `[x]` syntax
- Coverage count line near top: "X/Y requirements satisfied"

### Real SkillService API (packages/backend/src/services/skillService.ts)
```typescript
export class SkillService {
  constructor(private storage: Storage) {}
  
  async createSkill(
    workbenchId: string,   // SEPARATE ARG (not field in data)
    data: Omit<Skill, 'id' | 'createdAt' | 'workbenchId'>
    // Fields: name, description, trigger, action
  ): Promise<Skill>
  
  async listSkills(workbenchId: string): Promise<Skill[]>
  async updateSkill(workbenchId: string, skillId: SkillId, updates: ...): Promise<Skill>
  async deleteSkill(workbenchId: string, skillId: SkillId): Promise<void>
}
```

### Real HealingQuotaTracker failure
```
getActiveCircuitBreakers > should return only quotas where attemptsUsed >= maxAttempts
Expected: 1
Received: 0
  at healingQuotaTracker.test.ts:115:31
```

</code_context>

<deferred>
## Deferred Ideas

- Adding new test coverage beyond the 5 failing skillService tests — out of scope
- Running full test audit across the whole repo — out of scope
- Fixing pre-existing type issues anywhere else — out of scope
- Updating MEMORY.md with lessons learned — happens during complete-milestone, not this phase

</deferred>

---

*Phase: 11-test-stub-realignment-doc-cleanup*
*Context gathered: 2026-04-11 (derived from milestone audit)*
