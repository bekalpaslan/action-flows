---
phase: 07-chat-panel
plan: 04
subsystem: ui
tags: [react, zustand, websocket, chat, status-dot, dropdown-menu, keyboard-shortcuts, auto-scroll]

# Dependency graph
requires:
  - phase: 07-01
    provides: chatStore, chat-types, sessionStore
  - phase: 07-02
    provides: MarkdownRenderer, ToolCallCard, AskUserRenderer, MessageBubble
  - phase: 07-03
    provides: useChatMessages, useAutoScroll, useChatSend, ChatInput, ChatEmptyState, ScrollToBottom
  - phase: 06-agent-sessions-status
    provides: SessionManager, session:history WS handler
provides:
  - ChatHeader with StatusDot, session history dropdown loading real data via session:history WS request
  - MessageList with auto-scroll, ScrollToBottom, and ChatEmptyState
  - ChatPanel composing header + message list + input as per-workbench chat experience
  - AppShell wired with ChatPanel replacing ChatPlaceholder
  - Ctrl+Shift+C keyboard shortcut for chat panel collapse/expand
affects: [08-neural-validation, future-chat-enhancements]

# Tech tracking
tech-stack:
  added: []
  patterns: [session:history WS request/subscribe pattern for real data loading, imperative panel handle for keyboard shortcut]

key-files:
  created:
    - packages/app/src/workbenches/chat/ChatHeader.tsx
    - packages/app/src/workbenches/chat/MessageList.tsx
    - packages/app/src/workbenches/chat/ChatPanel.tsx
  modified:
    - packages/app/src/workbenches/shell/AppShell.tsx
    - packages/app/src/workbenches/chat/ChatPlaceholder.tsx
    - packages/app/src/hooks/useKeyboardShortcuts.ts

key-decisions:
  - "ChatHeader sends session:history WS request on dropdown open and subscribes to _system channel for response (real data loading per CHAT-07)"
  - "MessageList uses relative container with absolute ScrollToBottom for overlay positioning"
  - "ChatPanel calls useChatMessages() internally (not in AppShell) to avoid double-subscription"
  - "Ctrl+Shift+C uses imperative panelHandles.chat.isCollapsed/expand/collapse matching Ctrl+B sidebar pattern"

patterns-established:
  - "WS request/response pattern: send typed request, subscribe to _system channel, filter by type+workbenchId in response"
  - "Panel keyboard toggle pattern: imperative panelHandles with isCollapsed/expand/collapse"

requirements-completed: [CHAT-01, CHAT-02, CHAT-03, CHAT-04, CHAT-05, CHAT-06, CHAT-07, CHAT-08]

# Metrics
duration: 5min
completed: 2026-04-03
---

# Phase 7 Plan 4: Chat Panel Assembly Summary

**ChatPanel with StatusDot header, session history dropdown via WS request (CHAT-07), auto-scrolling MessageList, and Ctrl+Shift+C toggle wired into AppShell**

## Performance

- **Duration:** 5 min
- **Started:** 2026-04-03T11:33:52Z
- **Completed:** 2026-04-03T11:39:41Z
- **Tasks:** 2 of 3 (Task 3 is human-verify checkpoint)
- **Files modified:** 21

## Accomplishments
- ChatHeader with StatusDot showing session status, label text per status (Connected/Connecting/Disconnected/Error), session history dropdown loading real data via session:history WS request, and overflow menu
- MessageList with auto-scroll on new messages, ScrollToBottom button with unread count, ChatEmptyState fallback when no messages
- ChatPanel composing all chat components with per-workbench state from chatStore, useChatMessages for WS subscription, and useChatSend for message sending
- AppShell updated to render ChatPanel instead of ChatPlaceholder
- Ctrl+Shift+C keyboard shortcut added using imperative panel handle pattern

## Task Commits

Each task was committed atomically:

1. **Task 1: Build ChatHeader, MessageList, and ChatPanel** - `54953ac` (feat)
2. **Task 2: Wire ChatPanel into AppShell and add keyboard shortcut** - `2fed5b7` (feat)
3. **Task 3: Visual verification** - checkpoint (awaiting human verification)

## Files Created/Modified
- `packages/app/src/workbenches/chat/ChatHeader.tsx` - Chat header with StatusDot, session history dropdown (WS data), overflow menu
- `packages/app/src/workbenches/chat/MessageList.tsx` - Scrollable message container with auto-scroll and empty state
- `packages/app/src/workbenches/chat/ChatPanel.tsx` - Main chat panel composing header + messages + input
- `packages/app/src/workbenches/shell/AppShell.tsx` - Replaced ChatPlaceholder with ChatPanel
- `packages/app/src/workbenches/chat/ChatPlaceholder.tsx` - Reduced to null-returning stub
- `packages/app/src/hooks/useKeyboardShortcuts.ts` - Added Ctrl+Shift+C chat toggle
- `packages/app/src/components/ui/status-dot.tsx` - Copied from main repo (Phase 6 dependency)
- `packages/app/src/stores/sessionStore.ts` - Copied from main repo (Phase 6 dependency)
- `packages/app/src/stores/chatStore.ts` - Copied from main repo (Plan 01 dependency)
- `packages/app/src/stores/chatStore.test.ts` - Copied from main repo (Plan 01 dependency)
- `packages/app/src/lib/chat-types.ts` - Copied from main repo (Plan 01 dependency)
- `packages/app/src/hooks/useChatMessages.ts` - Copied from main repo (Plan 03 dependency)
- `packages/app/src/hooks/useAutoScroll.ts` - Copied from main repo (Plan 03 dependency)
- `packages/app/src/hooks/useChatSend.ts` - Copied from main repo (Plan 03 dependency)
- `packages/app/src/workbenches/chat/MessageBubble.tsx` - Copied from main repo (Plan 02 dependency)
- `packages/app/src/workbenches/chat/ChatInput.tsx` - Copied from main repo (Plan 03 dependency)
- `packages/app/src/workbenches/chat/ChatEmptyState.tsx` - Copied from main repo (Plan 03 dependency)
- `packages/app/src/workbenches/chat/ScrollToBottom.tsx` - Copied from main repo (Plan 03 dependency)
- `packages/app/src/workbenches/chat/MarkdownRenderer.tsx` - Copied from main repo (Plan 02 dependency)
- `packages/app/src/workbenches/chat/ToolCallCard.tsx` - Copied from main repo (Plan 02 dependency)
- `packages/app/src/workbenches/chat/AskUserRenderer.tsx` - Copied from main repo (Plan 02 dependency)

## Decisions Made
- ChatHeader sends session:history WS request on dropdown open and subscribes to _system channel for response, matching the real data loading requirement (CHAT-07)
- MessageList uses relative container with absolute-positioned ScrollToBottom for proper overlay without layout shift
- ChatPanel calls useChatMessages() internally rather than at AppShell level to avoid double-subscription
- Ctrl+Shift+C keyboard shortcut follows exact same imperative panelHandles pattern as existing Ctrl+B sidebar toggle

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Copied dependency files from Plans 01-03 and Phase 6**
- **Found during:** Task 1 (worktree missing prerequisite files)
- **Issue:** This worktree did not contain files created by Plans 01-03 (chatStore, sessionStore, chat-types, hooks, chat components) or Phase 6 (status-dot) since those were created in other worktrees/main repo
- **Fix:** Copied all 14 dependency files from main repo to worktree
- **Files modified:** 14 files across stores, hooks, lib, components/ui, and workbenches/chat
- **Verification:** TypeScript compiles, chatStore tests pass (13/13)
- **Committed in:** 54953ac (Task 1 commit)

**2. [Rule 1 - Bug] Fixed null typing on ScrollToBottom props in MessageList**
- **Found during:** Task 1 (TypeScript compilation)
- **Issue:** `isUserScrolled.current` and `unreadCount.current` from useAutoScroll refs can be `null` in strict TypeScript, but ScrollToBottom expects `boolean` and `number`
- **Fix:** Added null-coalescing defaults (`?? false` and `?? 0`)
- **Files modified:** packages/app/src/workbenches/chat/MessageList.tsx
- **Verification:** TypeScript compiles with zero errors
- **Committed in:** 54953ac (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug)
**Impact on plan:** Both auto-fixes necessary for worktree compilation. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Known Stubs
None - all components are fully implemented and wired to their data sources. ChatHeader loads real session history via WS request (not hardcoded). ChatPanel reads real state from chatStore and sessionStore.

## Next Phase Readiness
- Full chat panel assembled and rendering in the right column
- Ready for visual verification (Task 3 checkpoint)
- All CHAT requirements satisfied at the code level, pending visual confirmation

## Self-Check: PASSED

All 6 key files verified on disk. Both commit hashes (54953ac, 2fed5b7) verified in git log.

---
*Phase: 07-chat-panel*
*Completed: 2026-04-03*
