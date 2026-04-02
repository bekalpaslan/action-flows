---
phase: 06
slug: agent-sessions-status
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-02
---

# Phase 06 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.0 |
| **Config file** | packages/app/vitest.config.ts |
| **Quick run command** | `pnpm --filter @afw/app test` |
| **Full suite command** | `pnpm --filter @afw/app test && pnpm --filter @afw/backend test` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm --filter @afw/app test`
- **After every plan wave:** Run `pnpm --filter @afw/app test && pnpm --filter @afw/backend test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 06-01-01 | 01 | 1 | SESSION-01 | unit | `pnpm --filter @afw/backend test` | ❌ W0 | ⬜ pending |
| 06-01-02 | 01 | 1 | SESSION-02 | unit | `pnpm --filter @afw/backend test` | ❌ W0 | ⬜ pending |
| 06-02-01 | 02 | 2 | STATUS-01 | unit | `pnpm --filter @afw/app test` | ❌ W0 | ⬜ pending |
| 06-02-02 | 02 | 2 | STATUS-02 | unit | `pnpm --filter @afw/app test` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Backend test infrastructure for SessionManager (mock Agent SDK)
- [ ] Frontend test infrastructure for AgentStatusPanel (mock WebSocket events)

*Existing vitest infrastructure from Phase 5 covers test runner setup.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Session persists across app restart | SESSION-03 | Requires Electron restart cycle | Start session, close app, reopen, verify --resume reconnects |
| Health monitor detects disconnection | SESSION-04 | Requires real Agent SDK timeout | Disconnect network, verify detection within 30s |
| Toast notifications render correctly | STATUS-03 | Visual rendering | Trigger session events, verify toast appearance |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
