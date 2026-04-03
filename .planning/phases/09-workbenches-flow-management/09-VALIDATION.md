---
phase: 09
slug: workbenches-flow-management
status: active
nyquist_compliant: true
wave_0_complete: false
created: 2026-04-03
---

# Phase 09 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | packages/app/vitest.config.ts |
| **Quick run command** | `pnpm --filter @afw/app test -- --run` |
| **Full suite command** | `pnpm test` |
| **Estimated runtime** | ~20 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm type-check`
- **After every plan wave:** Run `pnpm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 20 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 09-01-T1 | 01 | 1 | BENCH-08 | type-check | `cd packages/app && npx tsc --noEmit --pretty 2>&1 \| head -30` | N/A | pending |
| 09-01-T2 | 01 | 1 | BENCH-08 | type-check | `cd packages/app && npx tsc --noEmit --pretty 2>&1 \| head -30` | N/A | pending |
| 09-02-T1 | 02 | 1 | FLOW-01, FLOW-02, BENCH-08 | type-check | `cd packages/backend && npx tsc --noEmit --pretty 2>&1 \| head -30` | N/A | pending |
| 09-02-T2 | 02 | 1 | FLOW-01, FLOW-02 | type-check | `cd packages/app && npx tsc --noEmit --pretty 2>&1 \| head -20 && cd ../backend && npx tsc --noEmit --pretty 2>&1 \| head -20` | N/A | pending |
| 09-03-T1 | 03 | 2 | BENCH-09, FLOW-03 | type-check | `cd packages/app && npx tsc --noEmit --pretty 2>&1 \| head -30` | N/A | pending |
| 09-03-T2 | 03 | 2 | BENCH-09, FLOW-04 | type-check | `cd packages/app && npx tsc --noEmit --pretty 2>&1 \| head -30` | N/A | pending |
| 09-04-T1 | 04 | 3 | BENCH-01, BENCH-02 | type-check | `cd packages/app && npx tsc --noEmit --pretty 2>&1 \| head -30` | N/A | pending |
| 09-04-T2 | 04 | 3 | BENCH-03, BENCH-04 | type-check | `cd packages/app && npx tsc --noEmit --pretty 2>&1 \| head -30` | N/A | pending |
| 09-05-T1 | 05 | 3 | BENCH-05, BENCH-06 | type-check | `cd packages/app && npx tsc --noEmit --pretty 2>&1 \| head -30` | N/A | pending |
| 09-05-T2 | 05 | 3 | BENCH-07 | type-check | `cd packages/app && npx tsc --noEmit --pretty 2>&1 \| head -30` | N/A | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

- [x] Existing vitest infrastructure covers test execution
- [ ] flowStore unit tests (created during planning -- Wave 0 gap, tests created during execution)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Each workbench shows domain-specific content | BENCH-01..07 | Visual layout verification | Navigate to each workbench, verify unique content renders |
| Agent greeting with personality | BENCH-08 | Text content + tone verification | Start session on each workbench, verify greeting matches personality |
| Flow cards display correctly | FLOW-01 | Visual card layout | Navigate to any workbench, verify flow cards appear with name, description, Run button |
| Flow execution via chat | FLOW-02 | End-to-end chat trigger | Click Run on a flow, verify chat message sent and agent responds |
| Flow composition drag-reorder | FLOW-03 | Drag interaction | Open composition dialog, add actions, drag to reorder, save |
| Studio component preview | BENCH-06 | Live render verification | Navigate to Studio, select a component, verify preview renders |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 20s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved
