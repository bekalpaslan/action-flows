---
phase: 05
slug: pipeline-visualization
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-02
---

# Phase 05 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.0.0 |
| **Config file** | packages/app/vitest.config.ts |
| **Quick run command** | `pnpm --filter @afw/app test -- --run` |
| **Full suite command** | `pnpm test` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm --filter @afw/app test -- --run`
- **After every plan wave:** Run `pnpm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| TBD | TBD | TBD | PIPE-01 | unit | `pnpm --filter @afw/app test -- --run` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | PIPE-02 | unit | `pnpm --filter @afw/app test -- --run` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | PIPE-03 | unit | `pnpm --filter @afw/app test -- --run` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | PIPE-04 | unit | `pnpm --filter @afw/app test -- --run` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | PIPE-05 | unit+integration | `pnpm --filter @afw/app test -- --run` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | PIPE-06 | unit | `pnpm --filter @afw/app test -- --run` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | PIPE-07 | unit | `pnpm --filter @afw/app test -- --run` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `packages/app/src/components/pipeline/__tests__/` — test directory for pipeline components
- [ ] `packages/app/vitest.config.ts` — add @xyflow/react module alias mock (same pattern as react-resizable-panels)
- [ ] Shared test fixtures for mock chain/step data

*Existing vitest infrastructure covers base requirements. Wave 0 adds pipeline-specific mocks.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Horizontal scroll on long pipelines | PIPE-04 | Requires real viewport measurement | Render pipeline with 15+ nodes, verify horizontal scrollbar appears and scrolls without layout break |
| Real-time node status animation | PIPE-05 | CSS transitions not measurable in happy-dom | Watch node transition from pending→running→complete, verify color/border changes animate smoothly |
| Diamond shape for gate nodes | PIPE-02 | SVG geometry requires visual inspection | Open pipeline with gate node, verify diamond shape renders correctly |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
