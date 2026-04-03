---
phase: 07-chat-panel
plan: 02
subsystem: ui
tags: [react-markdown, shiki, react-shiki, lucide-react, radix-ui, chat, message-rendering, tdd]

# Dependency graph
requires:
  - phase: 07-chat-panel-01
    provides: ChatMessage, ToolCall, ParsedQuestion, AskUserQuestion types, chatStore, shiki/react-shiki deps
  - phase: 03-design-system
    provides: Button, Card, Badge, RadioGroup, Checkbox, Input, Tooltip design system components
provides:
  - MarkdownRenderer component with react-markdown + shiki syntax highlighting, copy button, language badge
  - ToolCallCard component with collapsible tool display, icon mapping, three status states
  - AskUserRenderer component with RadioGroup, Checkbox, Input, confirmation interactive renderers
  - MessageBubble component with role-based rendering (user/agent/system), streaming cursor, memo optimization
  - AskUserRenderer unit test suite (6 tests)
affects: [07-03, 07-04, chat-panel, message-list]

# Tech tracking
tech-stack:
  added: []
  patterns: [markdownComponents defined outside component to avoid re-renders, React.memo with custom comparator on MessageBubble, TDD for interactive components]

key-files:
  created:
    - packages/app/src/workbenches/chat/MarkdownRenderer.tsx
    - packages/app/src/workbenches/chat/ToolCallCard.tsx
    - packages/app/src/workbenches/chat/AskUserRenderer.tsx
    - packages/app/src/workbenches/chat/MessageBubble.tsx
    - packages/app/src/workbenches/chat/__tests__/AskUserRenderer.test.tsx
  modified:
    - packages/app/package.json
    - packages/app/vitest.config.ts
    - pnpm-lock.yaml

key-decisions:
  - "markdownComponents object defined OUTSIDE MarkdownRenderer function to avoid re-creation on each render"
  - "ShikiHighlighter uses children prop (not code prop) per react-shiki v0.9.2 API"
  - "ReactMarkdown wrapped in div for className passthrough (className not a valid ReactMarkdown prop)"
  - "MessageBubble.memo compares message.id + status + content.length for efficient re-render gating"
  - "AskUserRenderer confirmation type uses direct Yes/No buttons (immediate submit) rather than Send Response flow"

patterns-established:
  - "Code block pattern: ShikiHighlighter with showLanguage=false, custom Badge for language label, CopyButton overlay"
  - "Tool icon mapping pattern: TOOL_ICONS record with LucideIcon values, fallback to Wrench"
  - "Interactive question pattern: per-type render functions within single component, isSubmitDisabled guard"

requirements-completed: [CHAT-01, CHAT-03, CHAT-05, CHAT-06]

# Metrics
duration: 7min
completed: 2026-04-03
---

# Phase 7 Plan 2: Message Rendering Pipeline Summary

**MarkdownRenderer with shiki syntax highlighting, ToolCallCard with 10-tool icon mapping, AskUserRenderer with 4 interaction types (6 tests), and MessageBubble with role-based rendering and streaming cursor**

## Performance

- **Duration:** 7 min
- **Started:** 2026-04-03T11:20:45Z
- **Completed:** 2026-04-03T11:28:20Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- MarkdownRenderer wraps react-markdown with design system token classes for all block elements (p, h1-h3, ul, ol, li, blockquote, hr, a, table, th, td) and shiki-powered syntax-highlighted code blocks with copy button and language badge
- ToolCallCard renders collapsible tool call details with 10-tool icon mapping (Edit, Write, Read, Bash, Glob, Grep, WebSearch, WebFetch, TodoWrite, default), three status states (running spinner, error icon, complete), keyboard accessible with aria-expanded
- AskUserRenderer handles single_select (RadioGroup), multi_select (Checkbox), free_text (Input), and confirmation (Yes/No buttons) with disabled state after submission and Submitted badge -- all 6 unit tests passing
- MessageBubble renders user (right-aligned surface-3), agent (left-aligned with workbench icon, markdown, tool calls, streaming cursor), and system (centered muted) messages with React.memo optimization

## Task Commits

Each task was committed atomically:

1. **Task 1: Build MarkdownRenderer and ToolCallCard** - `ee1b285` (feat)
2. **Task 2 RED: Failing AskUserRenderer tests** - `d3915d3` (test)
3. **Task 2 GREEN: AskUserRenderer and MessageBubble implementation** - `b3d1aa1` (feat)

## Files Created/Modified
- `packages/app/src/workbenches/chat/MarkdownRenderer.tsx` - react-markdown wrapper with shiki code blocks, copy button, language badge, design system token classes
- `packages/app/src/workbenches/chat/ToolCallCard.tsx` - Collapsible tool call card with icon mapping, status states, keyboard accessible
- `packages/app/src/workbenches/chat/AskUserRenderer.tsx` - Interactive AskUserQuestion renderer with RadioGroup, Checkbox, Input, Yes/No buttons, submit/disabled flow
- `packages/app/src/workbenches/chat/MessageBubble.tsx` - Role-based message renderer with markdown, tool calls, streaming cursor, React.memo
- `packages/app/src/workbenches/chat/__tests__/AskUserRenderer.test.tsx` - 6 test cases covering all question types and submit flow
- `packages/app/src/lib/chat-types.ts` - Copied from Plan 01 (chat type contracts)
- `packages/app/src/__tests__/__mocks__/shiki.ts` - Shiki test mock
- `packages/app/src/__tests__/__mocks__/react-shiki.ts` - React-shiki test mock
- `packages/app/package.json` - Added shiki and react-shiki dependencies
- `packages/app/vitest.config.ts` - Added shiki and react-shiki mock aliases
- `pnpm-lock.yaml` - Lockfile update

## Decisions Made
- markdownComponents defined outside the component function to avoid re-creation per render (per plan instruction)
- Used ShikiHighlighter `children` prop instead of `code` prop to match react-shiki v0.9.2 API
- Wrapped ReactMarkdown in a div for className passthrough since className is not a valid ReactMarkdown prop
- MessageBubble uses custom memo comparator (id + status + content.length) for efficient streaming updates
- Confirmation type uses direct Yes/No button onClick with immediate onSubmit, separate from the Send Response submit flow

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Installed shiki and react-shiki in worktree**
- **Found during:** Task 1
- **Issue:** shiki and react-shiki were installed in Plan 01 on the main repo but not present in this worktree's package.json
- **Fix:** `pnpm add shiki@^3.23.0 react-shiki@^0.9.2` in packages/app
- **Files modified:** packages/app/package.json, pnpm-lock.yaml
- **Verification:** Dependencies resolve, TypeScript compiles
- **Committed in:** ee1b285 (Task 1 commit)

**2. [Rule 3 - Blocking] Copied chat-types.ts from main repo**
- **Found during:** Task 1
- **Issue:** chat-types.ts was created in Plan 01 on the main repo but not in this worktree
- **Fix:** Copied from main repo to worktree
- **Files modified:** packages/app/src/lib/chat-types.ts
- **Committed in:** ee1b285 (Task 1 commit)

**3. [Rule 3 - Blocking] Added shiki/react-shiki test mocks and vitest aliases**
- **Found during:** Task 1
- **Issue:** Test mocks and vitest aliases for shiki/react-shiki were set up in Plan 01 but not in this worktree
- **Fix:** Copied mock files and added alias entries to vitest.config.ts
- **Files modified:** packages/app/src/__tests__/__mocks__/shiki.ts, packages/app/src/__tests__/__mocks__/react-shiki.ts, packages/app/vitest.config.ts
- **Committed in:** ee1b285 (Task 1 commit)

**4. [Rule 1 - Bug] Fixed ShikiHighlighter prop API**
- **Found during:** Task 1
- **Issue:** Plan specified `code` prop but react-shiki v0.9.2 uses `children` for code content
- **Fix:** Changed from `code={codeString}` to `>{codeString}</ShikiHighlighter>` children prop
- **Files modified:** packages/app/src/workbenches/chat/MarkdownRenderer.tsx
- **Committed in:** ee1b285 (Task 1 commit)

**5. [Rule 1 - Bug] Fixed ReactMarkdown className prop**
- **Found during:** Task 1
- **Issue:** Plan specified `className` on ReactMarkdown but it's not a valid prop in react-markdown v10
- **Fix:** Wrapped ReactMarkdown in a div that receives the className
- **Files modified:** packages/app/src/workbenches/chat/MarkdownRenderer.tsx
- **Committed in:** ee1b285 (Task 1 commit)

---

**Total deviations:** 5 auto-fixed (3 blocking, 2 bugs)
**Impact on plan:** All auto-fixes necessary for worktree compilation and API correctness. No scope creep.

## Issues Encountered
None beyond the blocking dependencies and API corrections resolved above.

## User Setup Required
None - no external service configuration required.

## Known Stubs
None - all components are fully implemented with design system tokens, interactive controls, and proper state management.

## Next Phase Readiness
- MarkdownRenderer, ToolCallCard, AskUserRenderer, MessageBubble ready for MessageList composition in Plan 04
- Components ready for ChatPanel integration in Plan 03 (ChatInput, ChatHeader, ChatPanel layout)
- AskUserRenderer test suite provides regression coverage for interactive question flows

## Self-Check: PASSED

All 5 created files verified on disk. All 3 commit hashes (ee1b285, d3915d3, b3d1aa1) verified in git log.

---
*Phase: 07-chat-panel*
*Completed: 2026-04-03*
