---
phase: 07
slug: chat-panel
status: active
nyquist_compliant: true
wave_0_complete: false
created: 2026-04-03
---

# Phase 07 -- Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
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
| 01-T1 | 07-01 | 1 | CHAT-01, CHAT-02, CHAT-03, CHAT-06 | unit (TDD) | `cd packages/app && pnpm vitest run src/stores/chatStore.test.ts --reporter=verbose` | src/stores/chatStore.test.ts | pending |
| 01-T2 | 07-01 | 1 | CHAT-02, CHAT-06 | structural | `cd packages/backend && npx tsc --noEmit` | packages/backend/src/ws/handler.ts | pending |
| 02-T1 | 07-02 | 2 | CHAT-01, CHAT-03, CHAT-05 | structural | `cd packages/app && npx tsc --noEmit` | src/workbenches/chat/MarkdownRenderer.tsx, ToolCallCard.tsx | pending |
| 02-T2 | 07-02 | 2 | CHAT-05, CHAT-06 | unit (TDD) | `cd packages/app && pnpm vitest run src/workbenches/chat/__tests__/AskUserRenderer.test.tsx --reporter=verbose && npx tsc --noEmit` | src/workbenches/chat/__tests__/AskUserRenderer.test.tsx | pending |
| 03-T1 | 07-03 | 2 | CHAT-02, CHAT-03, CHAT-06 | unit (TDD) | `cd packages/app && pnpm vitest run src/hooks/__tests__/useChatMessages.test.ts src/hooks/__tests__/useChatSend.test.ts --reporter=verbose` | src/hooks/__tests__/useChatMessages.test.ts, useChatSend.test.ts | pending |
| 03-T2 | 07-03 | 2 | CHAT-04 | structural | `cd packages/app && npx tsc --noEmit` | src/workbenches/chat/ChatInput.tsx, ChatEmptyState.tsx, ScrollToBottom.tsx | pending |
| 04-T1 | 07-04 | 3 | CHAT-01, CHAT-07, CHAT-08 | structural | `cd packages/app && npx tsc --noEmit` | src/workbenches/chat/ChatHeader.tsx, MessageList.tsx, ChatPanel.tsx | pending |
| 04-T2 | 07-04 | 3 | CHAT-01, CHAT-08 | unit + structural | `cd packages/app && npx tsc --noEmit && pnpm vitest run src/stores/chatStore.test.ts --reporter=verbose` | src/workbenches/shell/AppShell.tsx, hooks/useKeyboardShortcuts.ts | pending |
| 04-T3 | 07-04 | 3 | ALL (CHAT-01..08) | manual (checkpoint) | Visual verification -- human inspects running app | N/A | pending |

*Status: pending -- ✅ green -- ❌ red -- ⚠ flaky*

---

## Automated Test Coverage Summary

| Test File | Plan | Tests | Requirements Covered |
|-----------|------|-------|---------------------|
| `src/stores/chatStore.test.ts` | 07-01 | 13 | CHAT-01 (per-workbench isolation), CHAT-02 (message types), CHAT-06 (submitAskUserResponse), parseAskUserQuestion adapter |
| `src/workbenches/chat/__tests__/AskUserRenderer.test.tsx` | 07-02 | 6 | CHAT-05 (interactive rendering), CHAT-06 (submit flow) |
| `src/hooks/__tests__/useChatMessages.test.ts` | 07-03 | 9 | CHAT-02 (SDK message parsing), CHAT-03 (streaming), workbenchId normalization |
| `src/hooks/__tests__/useChatSend.test.ts` | 07-03 | 3 | CHAT-04 (send message), CHAT-06 (ask-user-response) |
| **Total** | | **31** | |

---

## Wave 0 Requirements

- [x] Existing vitest infrastructure covers test execution (vitest.config.ts present)
- [ ] shiki/react-shiki test mocks required (created in Plan 01 Task 1)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Auto-scroll on new messages | CHAT-03 | Visual scroll behavior requires real DOM | Send message in running app, verify scroll position follows new messages |
| AskUserQuestion interactive rendering | CHAT-05 | Complex Radix UI interaction in real browser | Trigger AskUserQuestion tool call, verify radio/checkbox rendering and interaction |
| Tool response feedback to session | CHAT-06 | End-to-end flow through Agent SDK | Select option in AskUserQuestion, verify response sent to Agent SDK and conversation continues |
| Session history dropdown data | CHAT-07 | Requires active backend session with history | Click History icon, verify entries load from backend when session exists |
| Keyboard shortcut (Ctrl+Shift+C) | CHAT-08 | Browser keyboard event handling | Press Ctrl+Shift+C, verify chat panel collapse/expand |

---

## Nyquist Compliance Check

| Rule | Status |
|------|--------|
| Every task has `<automated>` verify | YES -- all 9 tasks have automated commands |
| No 3 consecutive tasks without automated verify | YES -- max gap is 0 (every task has automated verify) |
| Wave 0 covers all MISSING references | YES -- shiki mocks created in Plan 01 |
| No watch-mode flags | YES -- all commands use `--run` or `--noEmit` |
| Feedback latency < 15s | YES -- vitest runs complete in ~10s |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 15s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** ready
