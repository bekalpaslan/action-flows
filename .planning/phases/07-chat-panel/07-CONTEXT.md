# Phase 7: Chat Panel - Context

**Gathered:** 2026-04-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Build the per-workbench chat panel in the right column. Each workbench has its own independent chat backed by a persistent Claude session (from Phase 6). Agent messages render as rich markdown with streaming. Tool calls show as collapsible cards. AskUserQuestion renders as full interactive components from the design system. Session history accessible via expandable menu.

</domain>

<decisions>
## Implementation Decisions

### Message Rendering
- **D-01:** Rich markdown rendering — agent messages display as formatted markdown (headers, code blocks, lists, tables, inline code). Like Claude's web UI.
- **D-02:** Streaming tokens — tokens appear as they're generated. Feels responsive and alive. Standard chat UX.

### Tool Call Display
- **D-03:** Collapsible tool cards — tool calls (Edit, Bash, Read, Write, etc.) show as compact cards with icon + tool name + summary. Click to expand for full input/output. Like Cursor's tool call rendering.

### Interactive Tool Calls
- **D-04:** Full component rendering for AskUserQuestion — radio buttons, checkboxes, option cards with descriptions, previews. Matching the full AskUserQuestion schema. Built from design system components (Radio, Checkbox, Card, Button).
- **D-05:** User selections from interactive tool calls are captured and fed back as tool responses to the Claude session.

### Chat Infrastructure
- **D-06:** Each workbench has its own independent chat panel backed by its persistent session (from Phase 6).
- **D-07:** Scrollable message history with auto-scroll on new messages.
- **D-08:** Fixed input row at bottom: text input + submit button.
- **D-09:** Expandable menu for current workbench's session history.
- **D-10:** Session connect/disconnect status indicator in the chat panel.

### Claude's Discretion
- Markdown rendering library choice (react-markdown, marked, etc.)
- Syntax highlighting for code blocks (shiki, prism, highlight.js)
- How to parse AskUserQuestion tool call JSON from the Agent SDK stream
- Streaming chunk buffering strategy (character-by-character vs line-by-line)
- Tool card icon mapping (which icon per tool type)
- Session history UI design (dropdown, sidebar drawer, etc.)
- How to handle multi-turn tool calls (agent calls tool, waits for response, continues)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Session Infrastructure (Phase 6 output)
- SessionManager service — provides session per workbench
- WebSocket channel messages — session events stream to frontend

### Design System (Phase 3 output)
- `packages/app/src/components/ui/index.ts` — Component library (Radio, Checkbox, Card, Button, Input, Badge, Tooltip, Dialog)
- `packages/app/src/components/ui/manifest.json` — Agent-readable component registry

### Layout (Phase 4 output)
- Chat panel region in the right column of AppShell PanelGroup
- ChatPlaceholder.tsx being replaced

### Research
- `.planning/research/STACK.md` — Agent SDK streaming, AskUserQuestion schema
- `.planning/research/FEATURES.md` — Interactive tool call rendering as table stakes
- `.planning/research/PITFALLS.md` — P15 (AskUserQuestion schema drift — adapter layer with fallback)

</canonical_refs>

<code_context>
## Existing Code Insights

### What Gets Replaced
- `ChatPlaceholder.tsx` — replaced with full chat panel component

### What Gets Created
- Chat panel container component
- Message list component (scrollable, auto-scroll)
- Message bubble component (user vs agent styling)
- Markdown renderer for agent messages
- Tool call card component (collapsible)
- AskUserQuestion renderer (interactive components)
- Chat input component (text input + submit)
- Session history menu component
- Chat zustand store (messages, input state, history)

### Integration Points
- Phase 6 SessionManager — provides session data
- WebSocket channel — streams agent responses
- Design system components — all UI composed from library
- Pipeline visualizer — chain events may appear in chat context

</code_context>

<specifics>
## Specific Ideas

The chat should feel like a real conversation — not a log viewer. Streaming makes it feel alive. Tool cards keep the conversation clean (you see what the agent did without walls of code). The AskUserQuestion rendering is the signature feature — it proves the "agents use system components" principle by rendering agent questions as designed UI elements the user clicks.

</specifics>

<deferred>
## Deferred Ideas

- Chat window visual redesign (Figma forthcoming) — Phase 7 uses design system defaults, redesign comes later
- Rich message formatting beyond markdown (embeds, cards, widgets) — future enhancement

</deferred>

---

*Phase: 07-chat-panel*
*Context gathered: 2026-04-02*
