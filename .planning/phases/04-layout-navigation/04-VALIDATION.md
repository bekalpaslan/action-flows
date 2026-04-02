---
phase: 4
slug: layout-navigation
status: approved
nyquist_compliant: true
wave_0_complete: false
created: 2026-04-02
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.0.0 + @testing-library/react 14.1.2 |
| **Config file** | `packages/app/vitest.config.ts` |
| **Quick run command** | `cd packages/app && pnpm test` |
| **Full suite command** | `cd packages/app && pnpm test && pnpm type-check` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd packages/app && pnpm test`
- **After every plan wave:** Run `cd packages/app && pnpm test && pnpm type-check`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 1 | LAYOUT-01, LAYOUT-02 | unit | `cd packages/app && pnpm test` | Wave 0 | ⬜ pending |
| 04-01-02 | 01 | 1 | LAYOUT-04 | unit | `cd packages/app && pnpm test` | Wave 0 | ⬜ pending |
| 04-02-01 | 02 | 2 | LAYOUT-01, LAYOUT-02 | unit | `cd packages/app && pnpm vitest run src/workbenches/shell/AppShell.test.tsx` | Wave 0 | ⬜ pending |
| 04-02-02 | 02 | 2 | LAYOUT-02, LAYOUT-04 | unit | `cd packages/app && pnpm vitest run src/workbenches/sidebar/Sidebar.test.tsx` | Wave 0 | ⬜ pending |
| 04-03-01 | 03 | 2 | LAYOUT-03 | unit | `cd packages/app && pnpm vitest run src/workbenches/workspace/WorkspaceArea.test.tsx` | Wave 0 | ⬜ pending |
| 04-03-02 | 03 | 2 | LAYOUT-04 | unit | `cd packages/app && pnpm vitest run src/stores/uiStore.test.ts` | Wave 0 | ⬜ pending |
| 04-04-01 | 04 | 3 | LAYOUT-05 | unit | `cd packages/app && pnpm vitest run src/components/command-palette/CommandPalette.test.tsx` | Wave 0 | ⬜ pending |
| 04-04-02 | 04 | 3 | LAYOUT-05 | type-check | `pnpm type-check` | N/A | ⬜ pending |

---

## Wave 0 Requirements

- [ ] `packages/app/src/__tests__/setup.ts` — vitest setup with @testing-library/jest-dom
- [ ] `packages/app/src/workbenches/shell/AppShell.test.tsx` — covers LAYOUT-01
- [ ] `packages/app/src/workbenches/sidebar/Sidebar.test.tsx` — covers LAYOUT-02
- [ ] `packages/app/src/workbenches/workspace/WorkspaceArea.test.tsx` — covers LAYOUT-03
- [ ] `packages/app/src/stores/uiStore.test.ts` — covers LAYOUT-04
- [ ] `packages/app/src/components/command-palette/CommandPalette.test.tsx` — covers LAYOUT-05
- [ ] Mock for react-resizable-panels (PanelGroup, Panel, PanelResizeHandle render as divs)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Visual panel resize drag | LAYOUT-04 | Requires mouse interaction | Drag panel borders, verify resize and collapse at thresholds |
| Command palette focus trap | LAYOUT-05 | Requires keyboard interaction | Open Cmd+K, tab through items, Escape to close |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 30s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-04-02
