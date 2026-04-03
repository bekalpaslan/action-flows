# Phase 7: Chat Panel - Research

**Researched:** 2026-04-03
**Domain:** Real-time chat panel with streaming markdown, interactive tool calls, and Agent SDK integration
**Confidence:** HIGH

## Summary

Phase 7 replaces the `ChatPlaceholder.tsx` stub with a full per-workbench chat panel. The chat panel lives in the right column of the AppShell PanelGroup and is backed by the Phase 6 SessionManager that already manages Agent SDK sessions per workbench. The primary technical challenges are: (1) parsing and rendering streaming Agent SDK messages as markdown with syntax highlighting, (2) rendering AskUserQuestion tool calls as interactive design system components, and (3) managing auto-scroll behavior during active streaming.

The existing infrastructure is well-prepared. The WebSocket multiplexing layer (`ws-client.ts` singleton), the SessionManager (`sessionManager.ts` with `consumeStream` already broadcasting `session:message` events), the zustand store pattern, and the full design system component library are all in place. The phase primarily adds frontend components that consume existing backend capabilities.

**Primary recommendation:** Build the chatStore first (zustand, per-workbench message state), then the message rendering pipeline (MarkdownRenderer with shiki, ToolCallCard, AskUserRenderer), then the container components (ChatPanel, ChatInput, MessageList with auto-scroll). Use `react-shiki` for syntax highlighting integration with react-markdown, and build the AskUserQuestion adapter layer to isolate from Agent SDK schema changes.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Rich markdown rendering -- agent messages display as formatted markdown (headers, code blocks, lists, tables, inline code)
- **D-02:** Streaming tokens -- tokens appear as they're generated, standard chat UX
- **D-03:** Collapsible tool cards -- tool calls show as compact cards with icon + tool name + summary, click to expand for full input/output
- **D-04:** Full component rendering for AskUserQuestion -- radio buttons, checkboxes, option cards with descriptions. Built from design system components (Radio, Checkbox, Card, Button)
- **D-05:** User selections from interactive tool calls are captured and fed back as tool responses to the Claude session
- **D-06:** Each workbench has its own independent chat panel backed by its persistent session (from Phase 6)
- **D-07:** Scrollable message history with auto-scroll on new messages
- **D-08:** Fixed input row at bottom: text input + submit button
- **D-09:** Expandable menu for current workbench's session history
- **D-10:** Session connect/disconnect status indicator in the chat panel

### Claude's Discretion
- Markdown rendering library choice (react-markdown already installed -- use it)
- Syntax highlighting for code blocks (shiki recommended)
- How to parse AskUserQuestion tool call JSON from the Agent SDK stream
- Streaming chunk buffering strategy
- Tool card icon mapping
- Session history UI design
- How to handle multi-turn tool calls

### Deferred Ideas (OUT OF SCOPE)
- Chat window visual redesign (Figma forthcoming) -- Phase 7 uses design system defaults
- Rich message formatting beyond markdown (embeds, cards, widgets) -- future enhancement
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CHAT-01 | Each workbench has its own independent chat panel (right column) | chatStore uses Map<WorkbenchId, WorkbenchChat>; AppShell already has chat Panel slot |
| CHAT-02 | Chat backed by persistent Claude remote session | SessionManager (Phase 6) already manages sessions; session:message events broadcast via WebSocket |
| CHAT-03 | Scrollable message history with auto-scroll on new messages | useAutoScroll hook with scroll-anchor detection; react-window for 100+ messages |
| CHAT-04 | Fixed input row: text input + submit button | ChatInput component with auto-growing textarea, Enter/Shift+Enter handling |
| CHAT-05 | Render AskUserQuestion as interactive UI components | AskUserQuestion adapter layer parses SDK schema into ParsedQuestion; renders with RadioGroup, Checkbox, Card |
| CHAT-06 | Capture user selections and feed back as tool responses | WebSocket message type 'chat:ask-user-response' sends answers back; backend routes to session.sendMessage |
| CHAT-07 | Expandable menu for session history | DropdownMenu (Radix) with listSessions data from backend via session:history WebSocket message |
| CHAT-08 | Session connect/disconnect status indicator | StatusDot (Phase 6) in chat header; maps SessionStatus to visual states |
</phase_requirements>

## Standard Stack

### Core (already installed -- no new installs except shiki)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-markdown | 10.1.0 | Markdown rendering for agent messages | Already installed, standard React markdown renderer, supports custom component overrides via `components` prop |
| rehype-raw | 7.0.0 | HTML passthrough in markdown | Already installed, needed for any raw HTML in agent responses |
| shiki | 3.23.0 | Syntax highlighting for code blocks | Latest stable v3 (v4 requires Node 20+, verify runtime). Tree-shakeable, async, supports custom themes |
| react-shiki | 0.9.2 | React wrapper for shiki | Provides ShikiHighlighter component and useShikiHighlighter hook, integrates cleanly with react-markdown's custom code component |
| zustand | 5.0.12 | Chat state management (chatStore) | Already installed, project standard for stores (wsStore, uiStore, sessionStore, pipelineStore) |
| react-window | 1.8.10 | Message list virtualization (100+ messages) | Already installed, standard for variable-height virtualized lists |
| @radix-ui/react-radio-group | 1.3.8 | AskUserQuestion single_select | Already installed |
| @radix-ui/react-checkbox | 1.3.3 | AskUserQuestion multi_select | Already installed |
| @radix-ui/react-dropdown-menu | 2.1.16 | Session history menu | Already installed |
| lucide-react | 1.7.0 | Tool call icons, UI icons | Already installed |

### New Dependencies

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| shiki | ^3.23.0 | Syntax highlighting engine | Agent message code blocks. Use `createHighlighter` (v3 API name) with lazy language loading. |
| react-shiki | ^0.9.2 | React integration for shiki | Pass as custom `code` component to react-markdown. Handles inline vs block code detection. |

**Note on shiki version:** The UI-SPEC specifies `shiki ^3.0.0`. Shiki v4.0.2 exists but requires Node.js >= 20. Use shiki 3.23.0 (latest v3) unless the runtime Node.js version is confirmed >= 20. The API is the same either way (`createHighlighter`, `codeToHtml`).

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| shiki + react-shiki | Prism.js / highlight.js | shiki is the modern standard with better theme support and tree-shakeability. Prism is legacy. |
| react-window | @tanstack/virtual | react-window is already installed and sufficient. @tanstack/virtual is more flexible but adds a new dependency. |
| DropdownMenu (session history) | Popover + custom list | DropdownMenu is already a design system component with correct ARIA, keyboard nav, and dismiss behavior built in. |

**Installation:**
```bash
cd packages/app
pnpm add shiki@^3.23.0 react-shiki@^0.9.2
```

## Architecture Patterns

### Recommended Project Structure
```
packages/app/src/
  workbenches/chat/
    ChatPanel.tsx              # Main container, replaces ChatPlaceholder
    ChatHeader.tsx             # Status dot + workbench label + history + menu
    MessageList.tsx            # Scrollable container with auto-scroll logic
    MessageBubble.tsx          # Single message: user/agent/system rendering
    MarkdownRenderer.tsx       # react-markdown + shiki wrapper with design system styles
    ToolCallCard.tsx           # Collapsible tool call card (icon + summary + expand)
    AskUserRenderer.tsx        # Interactive AskUserQuestion (adapter + RadioGroup/Checkbox/Card)
    ChatInput.tsx              # Auto-growing textarea + send button
    ScrollToBottom.tsx         # Floating scroll-to-bottom button with unread badge
    ChatEmptyState.tsx         # Empty state (connected vs disconnected variants)
  stores/
    chatStore.ts               # Zustand: per-workbench chat state (Map<WorkbenchId, WorkbenchChat>)
  hooks/
    useChatMessages.ts         # WebSocket subscription: session:message -> chatStore mapping
    useAutoScroll.ts           # Scroll-to-bottom with user-scroll-up detection
    useChatSend.ts             # Send user messages via WebSocket
```

### Pattern 1: Agent SDK Message Stream Parsing

**What:** The SessionManager (backend) streams raw `SDKMessage` objects to the frontend via `session:message` WebSocket events. The frontend `useChatMessages` hook must parse these into the chatStore's `ChatMessage` format.

**When to use:** Every incoming WebSocket message on the `_system` channel with type `session:message`.

**Key message types from the Agent SDK:**

| SDKMessage.type | Frontend action |
|-----------------|-----------------|
| `assistant` (SDKAssistantMessage) | Extract `message.content` blocks. Text blocks become agent message content. Tool use blocks become ToolCall entries. |
| `stream_event` (SDKPartialAssistantMessage) | Streaming delta. `event.type === 'content_block_delta'` with `delta.type === 'text_delta'` contains incremental text. `delta.type === 'input_json_delta'` contains tool input chunks. |
| `result` (SDKResultMessage) | Session turn complete. Finalize streaming message status. |
| `system` (SDKSystemMessage) | Init message with session metadata. Can be used for session info display. |

**Example: Mapping stream events to chat store updates:**
```typescript
// In useChatMessages.ts
function handleSessionMessage(workbenchId: WorkbenchId, sdkMessage: SDKMessage) {
  const store = useChatStore.getState();

  switch (sdkMessage.type) {
    case 'assistant': {
      // Full assistant message (non-streaming mode or final message)
      const content = sdkMessage.message.content;
      for (const block of content) {
        if (block.type === 'text') {
          store.addMessage(workbenchId, {
            id: sdkMessage.uuid,
            role: 'agent',
            content: block.text,
            timestamp: new Date().toISOString(),
            status: 'complete',
          });
        } else if (block.type === 'tool_use') {
          // Check if this is AskUserQuestion
          if (block.name === 'AskUserQuestion') {
            store.addAskUserQuestion(workbenchId, sdkMessage.uuid, block.input);
          } else {
            store.addToolCall(workbenchId, sdkMessage.uuid, {
              id: block.id,
              name: block.name,
              input: JSON.stringify(block.input),
              output: null,
              status: 'running',
            });
          }
        }
      }
      break;
    }

    case 'stream_event': {
      const event = sdkMessage.event;
      if (event.type === 'content_block_delta') {
        if (event.delta.type === 'text_delta') {
          store.appendStreamChunk(workbenchId, sdkMessage.uuid, event.delta.text);
        }
      } else if (event.type === 'content_block_start') {
        if (event.content_block.type === 'text') {
          store.addMessage(workbenchId, {
            id: `${sdkMessage.uuid}-${event.index}`,
            role: 'agent',
            content: '',
            timestamp: new Date().toISOString(),
            status: 'streaming',
          });
          store.setStreaming(workbenchId, true);
        }
      } else if (event.type === 'content_block_stop') {
        store.updateMessage(workbenchId, `${sdkMessage.uuid}-${event.index}`, {
          status: 'complete',
        });
        store.setStreaming(workbenchId, false);
      }
      break;
    }

    case 'result': {
      store.setStreaming(workbenchId, false);
      break;
    }
  }
}
```

### Pattern 2: AskUserQuestion Adapter Layer (Pitfall P15 Mitigation)

**What:** Parse the raw AskUserQuestion tool call input into a normalized `ParsedQuestion` interface before rendering. This isolates the UI from Agent SDK schema changes.

**Agent SDK AskUserQuestion Schema (verified from official docs):**
```typescript
// What the Agent SDK sends as tool input
interface AskUserQuestionInput {
  questions: Array<{
    question: string;           // Full question text
    header: string;             // Short label (max 12 chars)
    options: Array<{
      label: string;            // Option label
      description: string;      // Option description
      preview?: string;         // Optional HTML/markdown preview
    }>;
    multiSelect: boolean;       // true = checkboxes, false = radio
  }>;
}

// What we send back as the tool response (via canUseTool callback)
interface AskUserQuestionResponse {
  questions: AskUserQuestionInput['questions'];  // Pass through original
  answers: Record<string, string>;               // Map question text -> selected label(s)
  // For multiSelect: join labels with ", "
}
```

**Adapter mapping to UI-SPEC ParsedQuestion:**
```typescript
function parseAskUserQuestion(input: AskUserQuestionInput): ParsedQuestion[] {
  return input.questions.map((q) => ({
    type: q.multiSelect ? 'multi_select' : 'single_select',
    question: q.question,
    header: q.header,
    options: q.options.map((opt) => ({
      value: opt.label,
      label: opt.label,
      description: opt.description,
    })),
  }));
}

// Build response to send back to backend
function buildAskUserResponse(
  originalInput: AskUserQuestionInput,
  selections: Record<string, string | string[]>
): AskUserQuestionResponse {
  const answers: Record<string, string> = {};
  for (const q of originalInput.questions) {
    const selected = selections[q.question];
    answers[q.question] = Array.isArray(selected) ? selected.join(', ') : selected;
  }
  return { questions: originalInput.questions, answers };
}
```

**Fallback:** If `input.questions` is not an array or the schema is unrecognized, fall back to rendering the raw JSON as a code block within a standard agent message. Never crash.

### Pattern 3: WebSocket Message Flow for Chat

**What:** The complete flow from user input to agent response rendering.

**Existing backend infrastructure:**

1. **User sends message:** Frontend sends `{ type: 'input', sessionId, payload: text }` via WebSocket. The backend handler (`ws/handler.ts` line 142-201) already handles this -- it pipes input to the CLI session or queues it.

2. **Session status updates:** SessionManager broadcasts `session:status` events on `_system` channel. Frontend `useSessionEvents` already consumes these.

3. **Agent messages:** SessionManager `consumeStream` (line 162-239) broadcasts raw SDK messages as `session:message` events on `_system` channel.

**New WebSocket message types needed for Phase 7:**

| Type | Direction | Channel | Purpose |
|------|-----------|---------|---------|
| `chat:send` | Client -> Server | workbench channel | User sends a chat message (alternative to existing `input` type) |
| `chat:ask-user-response` | Client -> Server | workbench channel | User's AskUserQuestion selection |
| `session:message` | Server -> Client | `_system` | Already exists -- raw SDK message for chat rendering |
| `session:history` | Server -> Client | `_system` | Already exists -- session history response |

**Key insight:** The backend already broadcasts `session:message` events. The frontend just needs to parse them. No new backend routes are needed for basic chat functionality. The `chat:ask-user-response` message requires a new backend handler to route the response back through the SessionManager's `canUseTool` callback.

### Pattern 4: Auto-Scroll with User-Scroll-Up Detection

**What:** Auto-scroll follows streaming content unless the user has scrolled up to read previous messages.

```typescript
// useAutoScroll.ts
function useAutoScroll(messageListRef: RefObject<HTMLDivElement>) {
  const isUserScrolled = useRef(false);
  const unreadCount = useRef(0);

  const handleScroll = useCallback(() => {
    const el = messageListRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    isUserScrolled.current = distanceFromBottom > 100;
    if (!isUserScrolled.current) {
      unreadCount.current = 0;
    }
  }, []);

  const scrollToBottom = useCallback(() => {
    messageListRef.current?.scrollTo({
      top: messageListRef.current.scrollHeight,
      behavior: 'smooth',
    });
    isUserScrolled.current = false;
    unreadCount.current = 0;
  }, []);

  // Call this when new messages arrive
  const onNewMessage = useCallback((isUserMessage: boolean) => {
    if (isUserMessage || !isUserScrolled.current) {
      scrollToBottom();
    } else {
      unreadCount.current++;
    }
  }, [scrollToBottom]);

  return { handleScroll, scrollToBottom, onNewMessage, isUserScrolled, unreadCount };
}
```

### Anti-Patterns to Avoid

- **Direct SDKMessage rendering:** Never pass raw SDK messages to React components. Always parse through the chatStore adapter layer. SDK message format is not stable across versions.
- **Re-rendering entire message list on stream chunk:** Use React.memo on MessageBubble with (message.id, message.status, message.content.length) comparison. Only the actively streaming message should re-render.
- **Inline code component definitions:** Never define the react-markdown `components` object inside the render function -- creates new references on every render, defeating React.memo.
- **Synchronous shiki highlighting:** Always use async `createHighlighter` with lazy language loading. Synchronous highlighting blocks the main thread on large code blocks.
- **Storing parsed markdown AST:** Don't cache the markdown AST. react-markdown is fast enough for incremental re-parsing. Caching adds complexity without measurable benefit for chat-sized messages.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Markdown rendering | Custom markdown parser | react-markdown 10.1.0 | Handles partial markdown during streaming gracefully. Supports custom component overrides. Already installed. |
| Syntax highlighting | Regex-based highlighter | shiki 3.23.0 + react-shiki | 200+ language grammars, TextMate-accurate, tree-shakeable. Custom regex will miss edge cases. |
| Radio/checkbox groups | Custom radio buttons | @radix-ui/react-radio-group + @radix-ui/react-checkbox | Full ARIA compliance, keyboard navigation, focus management. Custom implementations miss a11y requirements. |
| Dropdown menus | Custom dropdown | @radix-ui/react-dropdown-menu | Collision-aware positioning, keyboard navigation, dismiss on outside click, submenus. |
| Scroll-to-bottom detection | IntersectionObserver heuristics | Simple scrollHeight - scrollTop - clientHeight math | IntersectionObserver adds complexity. Direct scroll math is simpler and more reliable. |
| Message list virtualization | Custom windowing | react-window (VariableSizeList) | Handles variable-height items, smooth scrolling, and efficient DOM recycling. Already installed. |

**Key insight:** The design system component library (Phase 3) provides RadioGroup, Checkbox, Card, Button, Badge, Input, DropdownMenu, Tooltip, StatusDot. Every interactive element in the chat panel should compose from these. No new primitives needed.

## Common Pitfalls

### Pitfall 1: Streaming Markdown Re-parse Jank

**What goes wrong:** Each streaming token triggers a react-markdown re-parse. For long messages with complex markdown (nested lists, tables), this creates visible jank.

**Why it happens:** react-markdown parses the full markdown string on every render. During streaming, the string grows token-by-token.

**How to avoid:** react-markdown is fast enough for most messages. If jank occurs: batch streaming chunks on a 50ms RAF timer (same pattern as Phase 5 pipeline events). Only the streaming message re-renders (React.memo on other messages). The UI-SPEC already specifies this as a fallback strategy.

**Warning signs:** Dropped frames in Chrome DevTools Performance tab during active streaming of long messages with code blocks.

### Pitfall 2: AskUserQuestion Schema Drift (Pitfall P15 from PITFALLS.md)

**What goes wrong:** The AskUserQuestion tool input schema is owned by the Agent SDK, not this project. If Anthropic changes the schema (adds fields, renames properties), the UI renderers break silently.

**Why it happens:** The UI directly destructures the tool input JSON.

**How to avoid:** Build the adapter layer (Pattern 2 above). Parse into the intermediate `ParsedQuestion` type. If parsing fails (unknown schema shape), fall back to rendering raw JSON as a code block inside a standard agent message. Never crash on unrecognized input.

**Warning signs:** Interactive UI not rendering (falling back to plain text) after an Agent SDK update.

### Pitfall 3: Session Message Event Structure Mismatch

**What goes wrong:** The SessionManager broadcasts raw SDK messages via `session:message` WebSocket events. The frontend assumes a specific message structure. If the SessionManager changes how it wraps messages, or if Agent SDK message types evolve, the chat panel breaks.

**Why it happens:** The `session:message` event payload is currently typed as `{ workbenchId, message }` where `message` is the raw `SDKMessage`. This is an untyped `unknown` on the frontend side.

**How to avoid:** Create a shared type for the `session:message` event payload in `@afw/shared`. Validate the message shape before processing. Handle unknown message types gracefully (log and skip, don't crash).

**Warning signs:** Console errors about undefined properties when accessing message fields. Chat panel showing no messages while session is visibly running.

### Pitfall 4: Input Row Textarea Auto-Grow Breaking Layout

**What goes wrong:** The auto-growing textarea (min 1 row, max 6 rows) pushes the message list upward and breaks scroll position. If scrollHeight calculation happens on the wrong frame, the textarea flickers.

**Why it happens:** Textarea height changes cause layout reflow. If the message list uses `flex-1` and the input row grows, the available space for messages shrinks, changing the scroll position.

**How to avoid:** Use CSS `field-sizing: content` (modern browsers) or a ref-based height calculation with `requestAnimationFrame`. Set `max-height` on the textarea corresponding to 6 lines. After resize, re-evaluate scroll position and auto-scroll if the user was at the bottom.

**Warning signs:** Message list scroll position jumping when user types multi-line input.

### Pitfall 5: shiki Bundle Size in Chat Context

**What goes wrong:** shiki's full bundle is ~1.2MB gzipped with all languages and themes. Loading it synchronously blocks first paint.

**Why it happens:** Importing `shiki` or `shiki/bundle/full` loads all grammars.

**How to avoid:** Use `shiki/bundle/web` (~695KB) or load languages lazily via `createHighlighter` with only the needed languages. The UI-SPEC specifies 8 languages (typescript, javascript, json, bash, css, html, python, markdown). Load these on first code block render, not on mount. react-shiki handles lazy loading automatically.

**Warning signs:** Large initial bundle size reported by vite-bundle-visualizer. Slow first code block render.

### Pitfall 6: Dual Message System Confusion

**What goes wrong:** The existing backend has TWO message systems: (1) the legacy `ChatMessage` type in `@afw/shared/models.ts` used by `claudeCliManager` and storage, and (2) the raw `SDKMessage` from the Agent SDK broadcast via `session:message`. The frontend must decide which to use.

**Why it happens:** The backend evolved incrementally. The `ChatMessage` model predates the Agent SDK integration.

**How to avoid:** For Phase 7, consume `session:message` events (raw SDK messages) as the primary data source for real-time chat. The `ChatMessage` storage model can be used for session history replay (existing `chat:history` event). The `useChatMessages` hook should handle both sources and normalize into the chatStore format.

**Warning signs:** Duplicate messages appearing in the chat. Messages from one source missing fields expected by the renderer.

## Code Examples

### react-markdown with Custom Code Component (shiki integration)

```typescript
// MarkdownRenderer.tsx
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import { ShikiHighlighter, isInlineCode } from 'react-shiki';
import { cn } from '@/lib/utils';

// Define components OUTSIDE the render function (anti-pattern: inline definition)
const markdownComponents = {
  code({ node, className, children, ...props }: any) {
    const match = /language-(\w+)/.exec(className || '');
    const language = match ? match[1] : undefined;

    // react-shiki's isInlineCode checks for absence of newlines
    if (isInlineCode(node)) {
      return (
        <code className="bg-surface-2 px-1.5 py-0.5 rounded-xs font-mono text-caption" {...props}>
          {children}
        </code>
      );
    }

    return (
      <ShikiHighlighter
        language={language ?? 'text'}
        theme="custom-dark" // Map to design tokens
        code={String(children).replace(/\n$/, '')}
      />
    );
  },
  p: ({ children }: any) => <p className="text-body mb-3 last:mb-0">{children}</p>,
  h1: ({ children }: any) => <h1 className="text-heading font-semibold mt-4 mb-2">{children}</h1>,
  h2: ({ children }: any) => <h2 className="text-heading font-semibold mt-3 mb-2">{children}</h2>,
  h3: ({ children }: any) => <h3 className="text-body font-semibold mt-3 mb-1">{children}</h3>,
  ul: ({ children }: any) => <ul className="list-disc pl-6 mb-3">{children}</ul>,
  ol: ({ children }: any) => <ol className="list-decimal pl-6 mb-3">{children}</ol>,
  li: ({ children }: any) => <li className="text-body mb-1">{children}</li>,
  blockquote: ({ children }: any) => (
    <blockquote className="border-l-2 border-border-strong pl-3 text-text-dim italic mb-3">
      {children}
    </blockquote>
  ),
  a: ({ href, children }: any) => (
    <a href={href} className="text-accent underline hover:text-accent/80" target="_blank" rel="noopener">
      {children}
    </a>
  ),
  table: ({ children }: any) => <table className="w-full border-collapse mb-3">{children}</table>,
  th: ({ children }: any) => (
    <th className="bg-surface-2 px-3 py-2 text-caption font-semibold text-left border-b border-border">
      {children}
    </th>
  ),
  td: ({ children }: any) => (
    <td className="px-3 py-2 text-caption border-b border-border">{children}</td>
  ),
};

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return (
    <ReactMarkdown
      rehypePlugins={[rehypeRaw]}
      components={markdownComponents}
      className={className}
    >
      {content}
    </ReactMarkdown>
  );
}
```

### AskUserQuestion Renderer with Design System Components

```typescript
// AskUserRenderer.tsx
import { useState } from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { ParsedQuestion } from './types';

interface AskUserRendererProps {
  question: ParsedQuestion;
  onSubmit: (response: string | string[]) => void;
  submitted: boolean;
}

export function AskUserRenderer({ question, onSubmit, submitted }: AskUserRendererProps) {
  const [selected, setSelected] = useState<string | string[]>(
    question.type === 'multi_select' ? [] : ''
  );

  if (question.type === 'single_select') {
    return (
      <div className="border-l-2 border-accent bg-surface-2 rounded-md p-3">
        <p className="text-body font-semibold mb-3">{question.question}</p>
        <RadioGroup
          value={typeof selected === 'string' ? selected : ''}
          onValueChange={(v) => setSelected(v)}
          disabled={submitted}
          className="gap-2"
        >
          {question.options?.map((opt) => (
            <Card
              key={opt.value}
              variant="flat"
              interactive={!submitted}
              className={cn(
                'p-3 flex items-center gap-3',
                selected === opt.value && 'border-accent bg-surface-3'
              )}
            >
              <RadioGroupItem value={opt.value} />
              <div>
                <div className="text-body">{opt.label}</div>
                {opt.description && (
                  <div className="text-caption text-text-dim">{opt.description}</div>
                )}
              </div>
            </Card>
          ))}
        </RadioGroup>
        <div className="mt-3 flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => onSubmit(selected)}
            disabled={submitted || !selected}
          >
            Send Response
          </Button>
          {submitted && <Badge variant="success" size="sm">Submitted</Badge>}
        </div>
      </div>
    );
  }

  // multi_select, free_text, confirmation handled similarly...
}
```

### chatStore Zustand Store

```typescript
// stores/chatStore.ts
import { create } from 'zustand';
import type { WorkbenchId } from '@/lib/types';

interface ChatMessage {
  id: string;
  role: 'user' | 'agent' | 'system';
  content: string;
  timestamp: string;
  status: 'sending' | 'sent' | 'streaming' | 'complete' | 'error';
  toolCalls?: ToolCall[];
  askUserQuestion?: AskUserQuestion;
}

interface ToolCall {
  id: string;
  name: string;
  input: string;
  output: string | null;
  status: 'running' | 'complete' | 'error';
}

interface WorkbenchChat {
  messages: ChatMessage[];
  inputValue: string;
  isStreaming: boolean;
  activeSessionId: string | null;
}

interface ChatState {
  chats: Map<WorkbenchId, WorkbenchChat>;
  getChat: (id: WorkbenchId) => WorkbenchChat;
  addMessage: (id: WorkbenchId, msg: ChatMessage) => void;
  appendStreamChunk: (id: WorkbenchId, msgId: string, chunk: string) => void;
  setInputValue: (id: WorkbenchId, value: string) => void;
  setStreaming: (id: WorkbenchId, streaming: boolean) => void;
  // ... other actions per UI-SPEC
}

const defaultChat = (): WorkbenchChat => ({
  messages: [],
  inputValue: '',
  isStreaming: false,
  activeSessionId: null,
});

export const useChatStore = create<ChatState>((set, get) => ({
  chats: new Map(),

  getChat: (id) => get().chats.get(id) ?? defaultChat(),

  addMessage: (id, msg) =>
    set((state) => {
      const next = new Map(state.chats);
      const chat = next.get(id) ?? defaultChat();
      next.set(id, { ...chat, messages: [...chat.messages, msg] });
      return { chats: next };
    }),

  appendStreamChunk: (id, msgId, chunk) =>
    set((state) => {
      const next = new Map(state.chats);
      const chat = next.get(id) ?? defaultChat();
      const messages = chat.messages.map((m) =>
        m.id === msgId ? { ...m, content: m.content + chunk } : m
      );
      next.set(id, { ...chat, messages });
      return { chats: next };
    }),

  setInputValue: (id, value) =>
    set((state) => {
      const next = new Map(state.chats);
      const chat = next.get(id) ?? defaultChat();
      next.set(id, { ...chat, inputValue: value });
      return { chats: next };
    }),

  setStreaming: (id, streaming) =>
    set((state) => {
      const next = new Map(state.chats);
      const chat = next.get(id) ?? defaultChat();
      next.set(id, { ...chat, isStreaming: streaming });
      return { chats: next };
    }),
}));
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| highlight.js / Prism.js | shiki (TextMate grammars) | 2024-2025 | More accurate highlighting, better theme support, smaller tree-shaken bundles |
| react-syntax-highlighter | react-shiki | 2025 | react-syntax-highlighter wraps Prism/highlight.js; react-shiki wraps shiki natively |
| `getHighlighter` (shiki v1-v2) | `createHighlighter` (shiki v3+) | shiki v3.0 | API renamed; old name deprecated |
| reactflow 11 | @xyflow/react 12 | 2024 | Already migrated in Phase 5 |
| Context providers for state | zustand stores | Phase 2 decision | Project-wide pattern; chatStore follows same pattern |

**Deprecated/outdated:**
- `@anthropic-ai/claude-code` package: renamed to `@anthropic-ai/claude-agent-sdk`. Already using correct package.
- shiki `getHighlighter`: renamed to `createHighlighter` in v3. Use `createHighlighter`.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.0.0 + happy-dom |
| Config file | `packages/app/vitest.config.ts` |
| Quick run command | `cd packages/app && pnpm test -- --run` |
| Full suite command | `cd packages/app && pnpm test` |

### Phase Requirements to Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CHAT-01 | ChatPanel renders for each workbench independently | unit | `cd packages/app && pnpm vitest run src/workbenches/chat/ChatPanel.test.tsx` | Wave 0 |
| CHAT-02 | chatStore tracks activeSessionId per workbench | unit | `cd packages/app && pnpm vitest run src/stores/chatStore.test.ts` | Wave 0 |
| CHAT-03 | useAutoScroll detects user scroll-up and resumes on scroll-to-bottom click | unit | `cd packages/app && pnpm vitest run src/hooks/useAutoScroll.test.ts` | Wave 0 |
| CHAT-04 | ChatInput sends message on Enter, inserts newline on Shift+Enter | unit | `cd packages/app && pnpm vitest run src/workbenches/chat/ChatInput.test.tsx` | Wave 0 |
| CHAT-05 | AskUserRenderer renders radio/checkbox for single_select/multi_select | unit | `cd packages/app && pnpm vitest run src/workbenches/chat/AskUserRenderer.test.tsx` | Wave 0 |
| CHAT-06 | submitAskUserResponse sends response via WebSocket | unit | `cd packages/app && pnpm vitest run src/hooks/useChatSend.test.ts` | Wave 0 |
| CHAT-07 | Session history menu loads and displays session list | unit | `cd packages/app && pnpm vitest run src/workbenches/chat/ChatHeader.test.tsx` | Wave 0 |
| CHAT-08 | StatusDot maps session status correctly in chat header | unit | `cd packages/app && pnpm vitest run src/workbenches/chat/ChatHeader.test.tsx` | Wave 0 |

### Sampling Rate
- **Per task commit:** `cd packages/app && pnpm vitest run --reporter=verbose`
- **Per wave merge:** `cd packages/app && pnpm test && pnpm type-check`
- **Phase gate:** Full suite green + type-check before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/stores/chatStore.test.ts` -- chatStore unit tests (addMessage, appendStreamChunk, setStreaming, getChat)
- [ ] `src/hooks/useAutoScroll.test.ts` -- scroll detection logic tests
- [ ] `src/hooks/useChatSend.test.ts` -- WebSocket message sending tests
- [ ] `src/workbenches/chat/ChatPanel.test.tsx` -- integration test for panel rendering
- [ ] `src/workbenches/chat/ChatInput.test.tsx` -- Enter/Shift+Enter behavior
- [ ] `src/workbenches/chat/AskUserRenderer.test.tsx` -- adapter layer + component rendering
- [ ] `src/workbenches/chat/ChatHeader.test.tsx` -- status dot + session history menu
- [ ] `src/__tests__/__mocks__/shiki.ts` -- mock for shiki in test environment (async highlight)
- [ ] `src/__tests__/__mocks__/react-shiki.ts` -- mock for react-shiki (render plain code blocks)

## Open Questions

1. **Backend AskUserQuestion routing**
   - What we know: The SessionManager uses `canUseTool` callback to handle AskUserQuestion. The frontend needs to send the user's response back.
   - What's unclear: The current `consumeStream` method broadcasts `session:message` but doesn't expose the `canUseTool` callback to the WebSocket layer. The AskUserQuestion response needs to be routed from WebSocket -> SessionManager -> canUseTool resolver.
   - Recommendation: The SessionManager needs a new method like `respondToToolCall(workbenchId, toolCallId, response)` that resolves the pending `canUseTool` promise. This may require storing a pending promise map. This is a backend change that should be planned as a task.

2. **Streaming partial messages vs complete messages**
   - What we know: The SessionManager can enable `includePartialMessages` in the query options to get `SDKPartialAssistantMessage` (stream_event) messages.
   - What's unclear: Whether `includePartialMessages` is currently enabled in the SessionManager. If not, we only get complete `SDKAssistantMessage` objects (no streaming UX).
   - Recommendation: Check the SessionManager query options. If `includePartialMessages` is not set, add it. The streaming experience (D-02) requires it.

3. **shiki version: v3 vs v4**
   - What we know: shiki v4.0.2 is the latest. v4 requires Node.js >= 20. The UI-SPEC says `^3.0.0`.
   - What's unclear: The project's runtime Node.js version constraint.
   - Recommendation: Use shiki 3.23.0 (latest v3). If Node.js >= 20 is confirmed, upgrade to v4 is trivial (same API, just Node.js requirement change).

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| react-markdown | Markdown rendering | Yes | 10.1.0 | -- |
| rehype-raw | HTML in markdown | Yes | 7.0.0 | -- |
| shiki | Syntax highlighting | No (new install) | 3.23.0 target | Plain code blocks without highlighting |
| react-shiki | React shiki wrapper | No (new install) | 0.9.2 target | Manual shiki integration |
| zustand | chatStore | Yes | 5.0.12 | -- |
| react-window | Message virtualization | Yes | 1.8.10 | -- |
| All Radix primitives | AskUserQuestion UI | Yes | Various | -- |
| StatusDot component | Session status | Yes | Phase 6 | -- |
| SessionManager | Session backend | Yes | Phase 6 | -- |
| WebSocket singleton | Message transport | Yes | Phase 2 | -- |

**Missing dependencies with no fallback:**
- None (shiki has a fallback of plain code blocks)

**Missing dependencies with fallback:**
- shiki + react-shiki: Need to install. Fallback: code blocks render with bg-surface-2 styling but no syntax highlighting.

## Project Constraints (from CLAUDE.md)

- **Tech stack:** React 18 + TypeScript + Vite (frontend), Express + ws (backend), pnpm monorepo -- preserve existing stack
- **Design system enforcement:** No raw CSS in agent output. Component library is the only way agents build UI
- **Naming:** React components PascalCase .tsx, hooks camelCase with `use` prefix, stores camelCase
- **Zustand stores:** Module singletons, not React context providers (Phase 2 decision)
- **WebSocket:** Single multiplexed connection via ws-client.ts singleton (Phase 2 decision)
- **TypeScript:** Strict mode, no `as any` bypasses, branded types for domain IDs
- **CSS:** Design-token-only CSS via var(--token) references, Tailwind v4 utility classes
- **Testing:** Vitest 4.0.0 + happy-dom for component tests

## Sources

### Primary (HIGH confidence)
- [Agent SDK TypeScript Reference](https://platform.claude.com/docs/en/agent-sdk/typescript) -- SDKMessage types, Query interface, streaming
- [Agent SDK User Input & AskUserQuestion](https://platform.claude.com/docs/en/agent-sdk/user-input) -- Complete AskUserQuestion schema, response format, canUseTool callback
- [Anthropic Messages Streaming](https://docs.anthropic.com/en/api/messages-streaming) -- BetaRawMessageStreamEvent types (content_block_delta, text_delta, input_json_delta)
- [react-markdown GitHub](https://github.com/remarkjs/react-markdown) -- Custom components prop API
- [react-shiki npm](https://www.npmjs.com/react-shiki) -- ShikiHighlighter component, isInlineCode utility
- [Shiki v3 Blog](https://shiki.style/blog/v3) -- createHighlighter API, engine changes
- [Shiki v4 Blog](https://shiki.style/blog/v4) -- Node.js 20 requirement, minor breaking changes

### Secondary (MEDIUM confidence)
- Existing codebase analysis: SessionManager.ts, ws-client.ts, handler.ts, sessionStore.ts, pipelineStore.ts patterns
- UI-SPEC (07-UI-SPEC.md) -- Detailed visual and interaction contracts
- CONTEXT.md (07-CONTEXT.md) -- User decisions D-01 through D-10

### Tertiary (LOW confidence)
- [Shiki custom themes](https://shiki.style/guide/install) -- Custom theme mapping to design tokens (needs verification against actual API)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- All libraries verified against npm registry and existing codebase. react-markdown, zustand, Radix primitives already installed. shiki/react-shiki versions confirmed.
- Architecture: HIGH -- Patterns derive from existing codebase (usePipelineEvents, useSessionEvents, pipelineStore). Agent SDK message format verified from official TypeScript reference.
- Pitfalls: HIGH -- P15 (AskUserQuestion schema drift) verified against actual SDK documentation. Streaming pitfalls confirmed by examining BetaRawMessageStreamEvent types.
- AskUserQuestion integration: HIGH -- Complete schema verified from official Agent SDK docs including response format.
- Backend routing for tool responses: MEDIUM -- The canUseTool -> WebSocket bridge is architecturally clear but requires new code.

**Research date:** 2026-04-03
**Valid until:** 2026-05-03 (30 days -- stable domain, shiki may release further v4 patches)
