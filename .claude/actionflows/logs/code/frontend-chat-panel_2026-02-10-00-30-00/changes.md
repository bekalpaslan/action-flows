# Code Changes: Frontend Chat Panel (CLI to Chat Conversion)

## Summary

Replaced the CLI terminal panel (CliPanel + ConversationPanel + SmartPromptLibrary) with a unified mobile-format ChatPanel in the left panel sidebar. The new ChatPanel aggregates claude-cli:output stream-JSON events into structured message bubbles and provides context-aware prompt buttons.

## Files Created

| File | Purpose |
|------|---------|
| `packages/app/src/components/SessionPanel/ChatPanel.tsx` | Mobile-format chat component with message bubbles, prompt buttons, input field, collapse/expand, auto-scroll |
| `packages/app/src/components/SessionPanel/ChatPanel.css` | Styles for ChatPanel (bubbles, prompt pills, input area, typing indicator, responsive) |
| `packages/app/src/hooks/useChatMessages.ts` | Hook that listens to claude-cli:output WebSocket events, parses stream-JSON, aggregates text deltas into ChatMessage objects |
| `packages/app/src/hooks/usePromptButtons.ts` | Hook that returns context-aware prompt buttons based on session state and chat messages |
| `packages/app/src/services/promptButtonSelector.ts` | Service that selects appropriate prompt buttons based on conversation context (approval, error recovery, chain control, code actions, defaults) |

## Files Modified

| File | Change |
|------|--------|
| `packages/app/src/components/SessionPanel/LeftPanelStack.tsx` | Replaced 4-panel layout (SessionInfo + CliPanel + ConversationPanel + SmartPromptLibrary) with 2-panel layout (SessionInfo + ChatPanel). Updated imports, props interface, and JSX. Kept backward-compatible props (onSubmitInput, flows, actions, onSelectFlow). |
| `packages/app/src/components/SessionPanel/LeftPanelStack.css` | Replaced .left-panel-stack__panel--cli, --conversation, --prompts with .left-panel-stack__panel--chat. Removed responsive rules for deleted panels. |
| `packages/app/src/components/SessionPanel/index.ts` | Replaced CliPanel/ConversationPanel/SmartPromptLibrary exports with ChatPanel export |

## Files Deleted

| File | Reason |
|------|--------|
| `packages/app/src/components/SessionPanel/CliPanel.tsx` | Replaced by ChatPanel |
| `packages/app/src/components/SessionPanel/CliPanel.css` | Replaced by ChatPanel.css |
| `packages/app/src/components/SessionPanel/ConversationPanel.tsx` | Replaced by ChatPanel |
| `packages/app/src/components/SessionPanel/ConversationPanel.css` | Replaced by ChatPanel.css |
| `packages/app/src/components/SessionPanel/SmartPromptLibrary.tsx` | Replaced by prompt buttons in ChatPanel |
| `packages/app/src/components/SessionPanel/SmartPromptLibrary.css` | Replaced by prompt button styles in ChatPanel.css |

## Architecture Notes

### ChatMessage Type
Defined locally in `useChatMessages.ts` as a temporary type. The backend agent is expected to add `ChatMessage` to `@afw/shared`. When that happens, the local type should be replaced with the shared import.

### Stream-JSON Parsing
The `useChatMessages` hook replicates the stream-JSON parsing logic from the old CliPanel but outputs structured `ChatMessage` objects instead of writing to an xterm terminal. It handles:
- `system` messages (ignored)
- `stream_event` with `content_block_delta` (text accumulation)
- `stream_event` with `content_block_start` for `tool_use` (tool badges)
- `stream_event` with `message_stop` (message boundary)
- `result` messages (cost/duration metadata)
- `error` messages
- stderr output (system error messages)

### Prompt Button Selection
The `promptButtonSelector` service determines which buttons to show based on:
1. Quick responses from session (binary prompts like yes/no)
2. Approval buttons when awaiting input
3. Error recovery (retry/skip) when last message is an error
4. Chain control (resume/cancel) when chain is paused
5. Code actions (apply/explain) when last message contains code blocks
6. Default prompts (continue/explain/status) as fallback

### Backward Compatibility
- `LeftPanelStack` still accepts `onSubmitInput`, `flows`, `actions`, `onSelectFlow` props for backward compatibility with `SessionPanelLayout`
- xterm dependencies are NOT removed (still used by ClaudeCliTerminal and TerminalPanel)
- `claude-cli:output` and `claude-cli:exited` events are still consumed (no backend changes needed)
- The separate `ConversationPanel` in `components/ConversationPanel/` (used by `SessionPane`) is untouched

## Verification

- Type check: PASS (0 errors in modified/created files; pre-existing errors in unrelated files unchanged)
- Build: PASS (Vite build + Electron packaging succeeded)
- Notes: Backend type-check errors exist for ChatMessage/ChatMessageEvent imports (backend agent's work, not frontend's responsibility). Shared types not yet updated.
