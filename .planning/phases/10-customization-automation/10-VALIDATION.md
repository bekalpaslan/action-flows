---
phase: 10
slug: customization-automation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-05
---

# Phase 10 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.0.0 (frontend + shared), vitest (backend) |
| **Config file** | `packages/app/vitest.config.ts`, `packages/backend/vitest.config.ts` |
| **Quick run command** | `pnpm --filter @afw/app test -- --run` (frontend) / `pnpm --filter @afw/backend test -- --run` (backend) |
| **Full suite command** | `pnpm test` |
| **Estimated runtime** | ~45 seconds (full), ~10 seconds (per-package) |

---

## Sampling Rate

- **After every task commit:** Run `pnpm type-check` + affected package test suite
- **After every plan wave:** Run `pnpm test` full suite
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

Populated by planner. Each task must have either:
- `<automated>` verify command that exits 0 on success, OR
- Wave 0 dependency (test infrastructure file that doesn't yet exist)

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 10-XX-XX | XX | X | CUSTOM-0X | unit/integration/e2e | `{command}` | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Populated during planning. Candidates based on RESEARCH.md Validation Architecture:

- [ ] `packages/backend/src/services/__tests__/healingQuotaTracker.test.ts` — daily quota enforcement
- [ ] `packages/backend/src/services/__tests__/schedulerService.test.ts` — Croner integration, pause/resume, nextRun introspection
- [ ] `packages/backend/src/services/__tests__/skillService.test.ts` — workbench-scoped CRUD + invocation guard
- [ ] `packages/backend/src/services/__tests__/customWorkbenchService.test.ts` — lifecycle + WorkbenchId branding
- [ ] `packages/backend/src/services/__tests__/forkService.test.ts` — fork metadata + sessionManager integration
- [ ] `packages/app/src/stores/__tests__/scheduledTaskStore.test.ts` — optimistic updates, sync with backend
- [ ] `packages/app/src/stores/__tests__/skillStore.test.ts` — per-workbench scoping
- [ ] `packages/app/src/stores/__tests__/customWorkbenchStore.test.ts` — dynamic workbench list
- [ ] `packages/app/src/stores/__tests__/forkStore.test.ts` — fork tree state
- [ ] Test fixtures: mock sessions, mock flows, mock storage

*Final list to be locked during planning based on task breakdown.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Self-healing approval checkpoint renders in chat | CUSTOM-01 | Requires live Claude session + `/btw` signal end-to-end | Trigger runtime error in flow, verify chat shows approval prompt with Approve/Investigate buttons |
| Scheduled task fires at cron-specified time | CUSTOM-03 | Requires actual time passage | Create task with `* * * * *` cron, wait 60s, verify execution history shows 1 run |
| Session fork UI shows visual tree at fork point | CUSTOM-05 | Visual hierarchy/layout inspection | Fork a session mid-conversation, verify UI shows tree with parent + 2 branches |
| Custom workbench persists across app restart | CUSTOM-04 | Requires Electron restart | Create custom workbench, close Electron, reopen, verify workbench still in sidebar |
| `/btw` signal triggers healing flow in active session | CUSTOM-01 | Integration across hook → signal → SessionManager → chat | Trigger contract violation, verify `/btw` signal reaches active workbench session, verify healing prompt appears |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags (all test commands use `--run`)
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
