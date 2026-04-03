---
phase: 07-chat-panel
plan: 01
subsystem: ui, api
tags: [zustand, shiki, react-shiki, websocket, chat, agent-sdk, typescript]

# Dependency graph
requires:
  - phase: 05-pipeline-visualization
    provides: zustand store pattern (Map<WorkbenchId, T>), pipelineStore reference
  - phase: 06-agent-sessions-status
    provides: SessionManager, ManagedSession, sessionStore, session-events types
provides:
  - ChatMessage, ToolCall, ParsedQuestion, AskUserQuestion, WorkbenchChat type contracts
  - useChatStore zustand store with per-workbench chat state management
  - parseAskUserQuestion adapter for Agent SDK AskUserQuestion input
  - buildAskUserResponse helper for constructing SDK responses
  - Backend chat:send and chat:ask-user-response WebSocket handlers
  - shiki/react-shiki test mocks and vitest aliases
  - getSessionForWorkbench method on SessionManager
affects: [07-02, 07-03, 07-04, chat-components, message-rendering]

# Tech tracking
tech-stack:
  added: [shiki ^3.23.0, react-shiki ^0.9.2, @anthropic-ai/claude-agent-sdk ^0.2.91]
  patterns: [per-workbench chat state Map, parseAskUserQuestion adapter, sendMessage guard pattern]

key-files:
  created:
    - packages/app/src/lib/chat-types.ts
    - packages/app/src/stores/chatStore.ts
    - packages/app/src/stores/chatStore.test.ts
    - packages/app/src/__tests__/__mocks__/shiki.ts
    - packages/app/src/__tests__/__mocks__/react-shiki.ts
    - packages/shared/src/session-events.ts
    - packages/backend/src/services/sessionManager.ts
    - packages/backend/src/services/sessionStore.ts
  modified:
    - packages/app/package.json
    - packages/app/vitest.config.ts
    - packages/backend/package.json
    - packages/backend/src/ws/handler.ts
    - packages/backend/src/schemas/ws.ts
    - packages/shared/src/index.ts
    - pnpm-lock.yaml

key-decisions:
  - "Map<WorkbenchId, WorkbenchChat> pattern for per-workbench chat state isolation (same pattern as pipelineStore)"
  - "parseAskUserQuestion returns ParsedQuestion[] with graceful fallback to empty array on malformed input"
  - "sendMessage guard pattern: both chat handlers check if (!chatSession?.sendMessage) before calling"
  - "chat:ask-user-response uses JSON.stringify(askResponse) through sendMessage (Agent SDK input stream)"
  - "Zod schemas added to discriminated union for chat:send and chat:ask-user-response validation"

patterns-established:
  - "Chat store Map pattern: Map<WorkbenchId, WorkbenchChat> with getChat returning defaults"
  - "sendMessage guard: check sendMessage exists before calling (optional on ManagedSession)"
  - "Agent SDK adapter: parseAskUserQuestion isolates UI from raw SDK schema"

requirements-completed: [CHAT-01, CHAT-02, CHAT-03, CHAT-06]

# Metrics
duration: 9min
completed: 2026-04-03
---

# Phase 7 Plan 1: Chat Data Layer Summary

**Zustand chatStore with per-workbench state, chat type contracts, backend WS handlers for chat:send and chat:ask-user-response, shiki/react-shiki installed and mocked**

## Performance

- **Duration:** 9 min
- **Started:** 2026-04-03T11:04:26Z
- **Completed:** 2026-04-03T11:13:46Z
- **Tasks:** 2
- **Files modified:** 15

## Accomplishments
- Chat type contracts defined: ChatMessage, ToolCall, ParsedQuestion, AskUserQuestion, WorkbenchChat with full type safety
- chatStore zustand store with Map<WorkbenchId, WorkbenchChat> providing independent per-workbench chat state (13 tests passing)
- Backend WebSocket handler extended with chat:send and chat:ask-user-response, both guarded for optional sendMessage on ManagedSession
- shiki and react-shiki installed as frontend dependencies with test mocks configured

## Task Commits

Each task was committed atomically:

1. **Task 1: Install shiki/react-shiki, define chat types, build chatStore with tests** - `86da54d` (feat)
2. **Task 2: Add backend WebSocket handlers for chat:send and chat:ask-user-response** - `0117e27` (feat)

## Files Created/Modified
- `packages/app/src/lib/chat-types.ts` - ChatMessage, ToolCall, ParsedQuestion, AskUserQuestion, WorkbenchChat types + parseAskUserQuestion adapter + buildAskUserResponse helper
- `packages/app/src/stores/chatStore.ts` - Zustand store with per-workbench chat state and all mutation methods
- `packages/app/src/stores/chatStore.test.ts` - 13 test cases covering all store operations, isolation, and adapter functions
- `packages/app/src/__tests__/__mocks__/shiki.ts` - Shiki test mock (createHighlighter)
- `packages/app/src/__tests__/__mocks__/react-shiki.ts` - React-shiki test mock (ShikiHighlighter, isInlineCode, useShikiHighlighter)
- `packages/app/vitest.config.ts` - Added shiki and react-shiki alias entries for test mocking
- `packages/app/package.json` - Added shiki ^3.23.0 and react-shiki ^0.9.2 dependencies
- `packages/backend/src/ws/handler.ts` - Added chat:send and chat:ask-user-response cases with sendMessage guards
- `packages/backend/src/schemas/ws.ts` - Added chatSendMessage and chatAskUserResponseMessage Zod schemas
- `packages/backend/src/services/sessionManager.ts` - SessionManager with getSessionForWorkbench method
- `packages/backend/src/services/sessionStore.ts` - BackendSessionStore with ManagedSession interface
- `packages/shared/src/session-events.ts` - SessionStatus, SessionStatusEvent, WORKBENCH_PERSONALITIES exports
- `packages/shared/src/index.ts` - Added session lifecycle type exports
- `packages/backend/package.json` - Added @anthropic-ai/claude-agent-sdk dependency

## Decisions Made
- Used Map<WorkbenchId, WorkbenchChat> pattern matching existing pipelineStore for consistency
- parseAskUserQuestion returns empty array on any error for graceful UI fallback
- Both WS handlers guard sendMessage as optional (expected when no session is active)
- Agent SDK response sent via JSON.stringify through sendMessage input stream
- Added Zod validation schemas for chat messages to maintain discriminated union pattern

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added session-events.ts to @afw/shared**
- **Found during:** Task 2 (backend WS handler)
- **Issue:** sessionManager.ts and sessionStore.ts depend on SessionStatus, SessionStatusEvent, WORKBENCH_PERSONALITIES from @afw/shared which did not exist in this worktree (Phase 6 additions)
- **Fix:** Created session-events.ts in shared package with all required types and exported from index.ts
- **Files modified:** packages/shared/src/session-events.ts, packages/shared/src/index.ts
- **Verification:** `npx tsc --noEmit` passes with zero errors
- **Committed in:** 0117e27 (Task 2 commit)

**2. [Rule 3 - Blocking] Installed @anthropic-ai/claude-agent-sdk**
- **Found during:** Task 2 (backend WS handler)
- **Issue:** sessionManager.ts imports from @anthropic-ai/claude-agent-sdk which was not in worktree's package.json
- **Fix:** `pnpm add @anthropic-ai/claude-agent-sdk@^0.2.90`
- **Files modified:** packages/backend/package.json, pnpm-lock.yaml
- **Verification:** TypeScript compiles cleanly
- **Committed in:** 0117e27 (Task 2 commit)

**3. [Rule 3 - Blocking] Copied sessionManager.ts and sessionStore.ts from main repo**
- **Found during:** Task 2 (backend WS handler)
- **Issue:** These files are Phase 6 artifacts not yet present in this worktree, required for handler integration
- **Fix:** Copied from main repo and added getSessionForWorkbench method
- **Files modified:** packages/backend/src/services/sessionManager.ts, packages/backend/src/services/sessionStore.ts
- **Verification:** Backend compiles with zero errors
- **Committed in:** 0117e27 (Task 2 commit)

---

**Total deviations:** 3 auto-fixed (3 blocking)
**Impact on plan:** All auto-fixes necessary for worktree compilation. Phase 6 dependencies needed to be brought into this worktree. No scope creep.

## Issues Encountered
None beyond the blocking dependencies resolved above.

## User Setup Required
None - no external service configuration required.

## Known Stubs
None - all types are fully defined, store methods are fully implemented, WS handlers route to real SessionManager.

## Next Phase Readiness
- Chat type contracts ready for UI components (07-02: ChatInput, ChatBubble, ChatPanel)
- chatStore ready for hook integration (useChatMessages, useChatInput in 07-03)
- Backend handlers ready for end-to-end chat messaging once SessionManager sessions are active
- shiki mocks configured for any test that imports chat rendering components

## Self-Check: PASSED

All 9 created files verified on disk. Both commit hashes (86da54d, 0117e27) verified in git log.

---
*Phase: 07-chat-panel*
*Completed: 2026-04-03*
