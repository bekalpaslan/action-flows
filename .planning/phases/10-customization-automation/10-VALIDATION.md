---
phase: 10
slug: customization-automation
status: draft
nyquist_compliant: true
wave_0_complete: false
wave_0_plan: "10-00"
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

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | Status |
|---------|------|------|-------------|-----------|-------------------|--------|
| 10-00-01 | 00 | 0 | CUSTOM-01, CUSTOM-02, CUSTOM-03 | scaffold | `ls packages/backend/src/services/__tests__/{healingQuotaTracker,skillService,schedulerService}.test.ts` | pending |
| 10-01-* | 01 | 1 | CUSTOM-01..07 | type-check | `pnpm type-check` | pending |
| 10-02-* | 02 | 2 | CUSTOM-02 | unit + type-check | `pnpm --filter @afw/backend test -- --run --reporter=verbose packages/backend/src/services/__tests__/skillService.test.ts && pnpm type-check` | pending |
| 10-03-* | 03 | 2 | CUSTOM-03 | unit + type-check | `pnpm --filter @afw/backend test -- --run --reporter=verbose packages/backend/src/services/__tests__/schedulerService.test.ts && pnpm type-check` | pending |
| 10-04-* | 04 | 2 | CUSTOM-01 | unit + type-check | `pnpm --filter @afw/backend test -- --run --reporter=verbose packages/backend/src/services/__tests__/healingQuotaTracker.test.ts && pnpm type-check` | pending |
| 10-05-* | 05 | 2 | CUSTOM-04 | type-check | `pnpm type-check` | pending |
| 10-06-* | 06 | 2 | CUSTOM-05 | type-check | `pnpm type-check` | pending |
| 10-07-* | 07 | 3 | CUSTOM-06, CUSTOM-07 | type-check | `pnpm type-check` | pending |

*Status: pending · green · red · flaky*

---

## Wave 0 Requirements

Wave 0 plan: **10-00-PLAN.md** (wave: 0, depends_on: [])

Creates test scaffolds that implementation plans will make pass:

- [x] `packages/backend/src/services/__tests__/healingQuotaTracker.test.ts` — daily quota enforcement (Plan 10-00)
- [x] `packages/backend/src/services/__tests__/skillService.test.ts` — workbench-scoped CRUD + invocation guard (Plan 10-00)
- [x] `packages/backend/src/services/__tests__/schedulerService.test.ts` — Croner integration, pause/resume, nextRun introspection (Plan 10-00)

Deferred to future phases (not critical for Phase 10 Nyquist compliance):
- [ ] `packages/backend/src/services/__tests__/customWorkbenchService.test.ts` — lifecycle + WorkbenchId branding
- [ ] `packages/backend/src/services/__tests__/forkService.test.ts` — fork metadata + sessionManager integration
- [ ] `packages/app/src/stores/__tests__/scheduledTaskStore.test.ts` — optimistic updates, sync with backend
- [ ] `packages/app/src/stores/__tests__/skillStore.test.ts` — per-workbench scoping
- [ ] `packages/app/src/stores/__tests__/customWorkbenchStore.test.ts` — dynamic workbench list
- [ ] `packages/app/src/stores/__tests__/forkStore.test.ts` — fork tree state
- [ ] Test fixtures: mock sessions, mock flows, mock storage

*Three critical backend services covered by Wave 0. Frontend store tests and remaining backend tests deferred — type-check provides baseline verification for those plans.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Self-healing approval checkpoint renders in chat | CUSTOM-01 | Requires live Claude session + `/btw` signal end-to-end | Trigger runtime error in flow, verify chat shows approval prompt with Approve/Investigate buttons |
| Scheduled task fires at cron-specified time | CUSTOM-03 | Requires actual time passage | Create task with `* * * * *` cron, wait 60s, verify execution history shows 1 run |
| Session fork UI shows visual tree at fork point | CUSTOM-05 | Visual hierarchy/layout inspection | Fork a session mid-conversation, verify UI shows tree with parent + 2 branches |
| Custom workbench persists across app restart | CUSTOM-04 | Requires Electron restart | Create custom workbench, close Electron, reopen, verify workbench still in sidebar |
| `/btw` signal triggers healing flow in active session | CUSTOM-01 | Integration across hook -> signal -> SessionManager -> chat | Trigger contract violation, verify `/btw` signal reaches active workbench session, verify healing prompt appears |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers critical MISSING references (3 of 3 core services)
- [x] No watch-mode flags (all test commands use `--run`)
- [x] Feedback latency < 60s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
