---
phase: 08
slug: neural-validation-safety
status: ready
nyquist_compliant: true
wave_0_complete: false
created: 2026-04-03
updated: 2026-04-03
---

# Phase 08 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config files** | packages/app/vitest.config.ts, packages/backend/vitest.config.ts, packages/hooks/vitest.config.ts (created in 08-01) |
| **Quick run command** | `pnpm test -- --run` |
| **Full suite command** | `pnpm test` |
| **Estimated runtime** | ~25 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm type-check && pnpm test -- --run`
- **After every plan wave:** Run `pnpm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 25 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 08-01-T1 | 01 | 1 | NEURAL-01, NEURAL-07 | unit | `pnpm --filter @afw/hooks vitest run src/__tests__/design-rules.test.ts -x` | Wave 0 (created in this task) | pending |
| 08-01-T2 | 01 | 1 | NEURAL-02, NEURAL-03, NEURAL-05, NEURAL-06 | build + type | `pnpm --filter @afw/hooks build` | N/A (build verify) | pending |
| 08-02-T1 | 02 | 1 | SAFETY-02, SAFETY-03, SAFETY-04, SAFETY-05 | unit | `pnpm --filter @afw/backend vitest run src/__tests__/approval-service.test.ts -x` | Wave 0 (created in this task) | pending |
| 08-02-T2 | 02 | 1 | NEURAL-04, SAFETY-01 | type | `pnpm --filter @afw/backend type-check` | N/A (type verify) | pending |
| 08-03-T1 | 03 | 2 | NEURAL-04 | type | `pnpm --filter @afw/app type-check` | N/A (type verify) | pending |
| 08-03-T2 | 03 | 2 | SAFETY-01 | type | `pnpm --filter @afw/app type-check` | N/A (type verify) | pending |
| 08-03-T3 | 03 | 2 | NEURAL-04, SAFETY-01, D-10 | type + grep | `pnpm --filter @afw/app type-check && grep -c useViolationSignals packages/app/src/workbenches/shell/AppShell.tsx && grep -c useCheckpointSync packages/app/src/workbenches/shell/AppShell.tsx` | N/A (wiring verify) | pending |
| 08-04-T1 | 04 | 2 | SAFETY-02, SAFETY-03, SAFETY-04 | type | `pnpm --filter @afw/app type-check` | N/A (type verify) | pending |
| 08-04-T2 | 04 | 2 | SAFETY-05 | type | `pnpm --filter @afw/app type-check` | N/A (type verify) | pending |
| 08-04-T3 | 04 | 2 | SAFETY-02 | type + grep | `pnpm --filter @afw/app type-check && grep -c ApprovalGateCard packages/app/src/workbenches/chat/MessageBubble.tsx` | N/A (wiring verify) | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

- [x] Existing vitest infrastructure covers backend and app test execution
- [ ] `packages/hooks/vitest.config.ts` -- Created in 08-01-T1 (hooks package vitest config)
- [ ] `packages/hooks/src/__tests__/design-rules.test.ts` -- Created in 08-01-T1 (regex pattern tests)
- [ ] `packages/backend/src/__tests__/approval-service.test.ts` -- Created in 08-02-T1 (approval logic tests)

---

## Unit Test Coverage

### Plan 08-01: Design Rules (created in Task 1)

**File:** `packages/hooks/src/__tests__/design-rules.test.ts`

| Test Case | Pattern | Input | Expected |
|-----------|---------|-------|----------|
| no-raw-hex match | CRITICAL | `color: #fff` | match |
| no-raw-hex match | CRITICAL | `background-color: #1a2b3c` | match |
| no-raw-hex skip | CRITICAL | `var(--color-primary)` | no match |
| no-raw-color-fn match | CRITICAL | `color: rgb(255, 0, 0)` | match |
| no-raw-color-fn match | CRITICAL | `background: rgba(0,0,0,0.5)` | match |
| no-inline-style match | CRITICAL | `style={{ color: "red" }}` | match |
| no-inline-style skip | CRITICAL | `className="text-body"` | no match |
| hex-outside-tokens match | WARNING | `'#fff'` | match |
| hex-outside-tokens skip | WARNING | `var(--color-primary)` | no match |
| VALIDATED_EXTENSIONS | includes | `.tsx`, `.css` | true |
| VALIDATED_EXTENSIONS | excludes | `.ts`, `.js` | false |
| SKIP_PATTERNS match | skip | `Component.test.tsx` | match |
| SKIP_PATTERNS skip | skip | `Component.tsx` | no match |

### Plan 08-02: Approval Service (created in Task 1)

**File:** `packages/backend/src/__tests__/approval-service.test.ts`

| Test Case | Method | Input | Expected |
|-----------|--------|-------|----------|
| full autonomy never needs approval | needsApproval | ('settings', 'delete_files') | false |
| supervised needs approval for destructive | needsApproval | ('work', 'delete_files') | true |
| supervised allows normal edits | needsApproval | ('work', 'edit_file') | false |
| restricted always needs approval | needsApproval | ('review', 'edit_file') | true |
| create request returns pending | createRequest | valid params | status === 'pending' |
| resolve request changes status | resolveRequest | (id, 'approved') | status === 'approved' |
| resolve already resolved returns null | resolveRequest | (resolved_id, 'denied') | null |
| default autonomy level for workbench | getAutonomyLevel | ('work') | 'supervised' |
| set autonomy level persists | setAutonomyLevel | ('work', 'full') | getAutonomyLevel('work') === 'full' |
| unknown workbench defaults to supervised | getAutonomyLevel | ('unknown') | 'supervised' |

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| PreToolUse blocks raw CSS in real Claude Code session | NEURAL-01 | Requires live Claude Code hook execution | Trigger agent file write with inline style, verify hook blocks |
| Approval gate renders and responds in chat panel | SAFETY-02 | End-to-end hook-to-UI flow | Trigger destructive action, verify approval card appears, approve/deny |
| Checkpoint revert in pipeline UI | SAFETY-01 | Visual git revert interaction | Click revert on checkpoint marker, verify git state changes |
| /btw violation signal reaches agent | NEURAL-05 | Requires active Claude session | Trigger PostToolUse violation, verify agent receives signal |
| Violation toast appears in AppShell | NEURAL-04 | Visual toast with correct severity styling | Trigger validation:violation WS event, verify toast renders with correct color |
| Checkpoint markers appear on pipeline nodes | SAFETY-01, D-10 | Visual pipeline extension | Complete agent task, verify checkpoint dot appears below step node |

---

## Key Wiring Verifications

These verify that components are connected (not just created):

| Connection | Plan | Verify Command | Expected |
|------------|------|----------------|----------|
| useViolationSignals in AppShell | 08-03 | `grep -c "useViolationSignals" packages/app/src/workbenches/shell/AppShell.tsx` | >= 1 |
| useCheckpointSync in AppShell | 08-03 | `grep -c "useCheckpointSync" packages/app/src/workbenches/shell/AppShell.tsx` | >= 1 |
| ApprovalGateCard in MessageBubble | 08-04 | `grep -c "ApprovalGateCard" packages/app/src/workbenches/chat/MessageBubble.tsx` | >= 1 |
| approvalRequest field on ChatMessage | 08-04 | `grep -c "approvalRequest" packages/app/src/lib/chat-types.ts` | >= 1 |
| setCheckpoint in pipelineStore | 08-03 | `grep -c "setCheckpoint" packages/app/src/stores/pipelineStore.ts` | >= 1 |
| checkpoint field on StepNodeData | 08-03 | `grep -c "checkpoint" packages/app/src/lib/pipeline-types.ts` | >= 2 |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references (hooks vitest config + 2 test files)
- [x] No watch-mode flags
- [x] Feedback latency < 25s
- [x] `nyquist_compliant: true` set in frontmatter
- [x] Key wiring verifications added for all 3 blocker connections

**Approval:** ready
