---
phase: 2
slug: frontend-scaffold-websocket
status: approved
nyquist_compliant: true
wave_0_complete: false
created: 2026-04-02
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.0 + happy-dom |
| **Config file** | `packages/app/vitest.config.ts`, `packages/backend/vitest.config.ts` |
| **Quick run command** | `pnpm type-check` |
| **Full suite command** | `pnpm type-check && pnpm test && pnpm build` |
| **Estimated runtime** | ~45 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm type-check`
- **After every plan wave:** Run `pnpm type-check && pnpm test`
- **Before `/gsd:verify-work`:** Full suite + `pnpm build` must succeed
- **Max feedback latency:** 45 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | FOUND-04 | type-check | `cd packages/app && npx tsc --noEmit` | N/A (compiler) | ⬜ pending |
| 02-01-02 | 01 | 1 | FOUND-04 | type-check | `cd packages/app && npx tsc --noEmit` | N/A (compiler) | ⬜ pending |
| 02-02-01 | 02 | 1 | FOUND-03 | type-check + test | `cd packages/backend && npx tsc --noEmit && pnpm test` | Exists (update) | ⬜ pending |
| 02-02-02 | 02 | 1 | FOUND-03 | type-check + test | `cd packages/backend && npx tsc --noEmit && pnpm test` | Exists (update) | ⬜ pending |
| 02-03-01 | 03 | 2 | FOUND-03 | type-check | `cd packages/app && npx tsc --noEmit` | Wave 0 | ⬜ pending |
| 02-03-02 | 03 | 2 | FOUND-03, FOUND-04 | build + smoke | `pnpm type-check && pnpm build` | N/A (build check) | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `packages/app/src/lib/ws-client.test.ts` — covers FOUND-03 (WebSocket client)
- [ ] `packages/backend/src/ws/__tests__/hub.test.ts` — covers FOUND-03 (backend hub)
- [ ] `packages/app/src/workbenches/shell/AppShell.test.tsx` — covers FOUND-04 (shell layout)
- [ ] `packages/app/src/workbenches/sidebar/SidebarPlaceholder.test.tsx` — covers FOUND-04 (sidebar)
- [ ] `packages/app/src/stores/uiStore.test.ts` — covers FOUND-04 (workbench switching)
- [ ] Update `packages/app/vitest.config.ts` to remove cosmic path aliases
- [ ] Update existing `packages/backend/src/ws/__tests__/handler.test.ts` for channel messages

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Electron app loads new shell | FOUND-04 | Visual UI verification | Run `pnpm build`, launch Electron, confirm 3-region layout renders |
| WebSocket connects in Electron | FOUND-03 | Requires running backend + Electron | Start backend, launch Electron, check WS status indicator shows "Connected" |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 45s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-04-02
