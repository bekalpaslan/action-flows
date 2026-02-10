# Implementation Plan: CLI Terminal to Mobile-Format Chat Conversion

## Overview

This plan converts the left panel (25% width) from a 4-panel vertical stack (SessionInfoPanel, CliPanel, ConversationPanel, SmartPromptLibrary) into a unified mobile-format chat interface with context-aware prompt buttons. The backend already outputs clean text (not terminal codes) via stream-JSON parsing, so the primary work is **message aggregation + frontend chat UI**.

The new layout will be: **SessionInfoPanel (compact header) + ChatPanel (fills remaining space, includes prompt buttons at bottom)**.

---

## Steps

### Step 1: Define Shared Types for Chat Messages

**Package:** `packages/shared/`
**Files:**
- `packages/shared/src/events.ts` (extend)
- `packages/shared/src/models.ts` (extend)

**Changes:**

1. **Add `ChatMessage` interface to `models.ts`:**
   ```typescript
   export interface ChatMessage {
     id: string;  // Message ID (generated)
     role: 'user' | 'assistant' | 'system';
     content: string;
     timestamp: Timestamp;
     messageType?: 'text' | 'tool_use' | 'tool_result' | 'error';
     metadata?: {
       model?: string;
       stopReason?: string;
       toolName?: string;
       stepNumber?: number;
     };
   }
   ```

2. **Add `ChatMessageEvent` to `events.ts`:**
   ```typescript
   export interface ChatMessageEvent extends BaseEvent {
     type: 'chat:message';
     message: ChatMessage;
     sessionId: SessionId;
     timestamp: Timestamp;
   }

   export interface ChatHistoryEvent extends BaseEvent {
     type: 'chat:history';
     messages: ChatMessage[];
     sessionId: SessionId;
     timestamp: Timestamp;
   }
   ```

3. **Extend `Session` interface in `models.ts`:**
   ```typescript
   export interface Session {
     // ... existing fields
     conversationHistory?: ChatMessage[];  // NEW: Chat message history
   }
   ```

4. **Add to `WorkspaceEvent` union in `events.ts`:**
   ```typescript
   export type WorkspaceEvent =
     // ... existing types
     | ChatMessageEvent
     | ChatHistoryEvent;
   ```

**Depends on:** Nothing
**Why:** Shared types must be defined first. All packages import from `@afw/shared`.

---

### Step 2: Backend Message Aggregation Service

**Package:** `packages/backend/`
**Files:**
- `packages/backend/src/services/claudeCliMessageAggregator.ts` (create)
- `packages/backend/src/services/claudeCliSession.ts` (modify)
- `packages/backend/src/services/claudeCliManager.ts` (modify)

**Changes:**

1. **Create `claudeCliMessageAggregator.ts`:**
   - Service to aggregate stream-JSON chunks into complete `ChatMessage` objects
   - Parse stream-JSON types: `system`, `stream_event`, `assistant`, `result`, `error`
   - Buffer chunks until message boundaries detected (e.g., `type: 'result'`)
   - Emit complete messages via callback
   - Extract metadata: model, stopReason, toolName
   - Generate unique message IDs

2. **Modify `claudeCliSession.ts` (parseStreamJson):**
   - Instead of broadcasting raw `output` chunks, pipe to `MessageAggregator`
   - Aggregator callback emits complete messages
   - Broadcast `chat:message` events instead of `claude-cli:output`
   - Keep `claude-cli:output` as fallback for backward compatibility (mark as deprecated)

3. **Modify `claudeCliManager.ts`:**
   - Instantiate `MessageAggregator` per session
   - Store conversation history in session metadata: `session.conversationHistory`
   - On session start, restore history from storage
   - On exit, persist final history to storage
   - Broadcast `chat:history` event on session reconnect

**Key Logic:**
```typescript
// Message boundary detection
if (msg.type === 'result' || msg.type === 'error') {
  // End of assistant turn → finalize message
  aggregator.finalizeMessage();
}

if (msg.type === 'stream_event' && msg.event?.type === 'content_block_delta') {
  // Accumulate text chunks
  aggregator.appendChunk(msg.event.delta.text);
}
```

**Depends on:** Step 1 (shared types)

---

### Step 3: Backend Storage Extension for Chat History

**Package:** `packages/backend/`
**Files:**
- `packages/backend/src/storage/index.ts` (modify interface)
- `packages/backend/src/storage/memory.ts` (implement)
- `packages/backend/src/storage/redis.ts` (implement)

**Changes:**

1. **Extend `Storage` interface:**
   ```typescript
   interface Storage {
     // ... existing methods
     getChatHistory(sessionId: SessionId): Promise<ChatMessage[]> | ChatMessage[];
     addChatMessage(sessionId: SessionId, message: ChatMessage): Promise<void> | void;
     clearChatHistory(sessionId: SessionId): Promise<void> | void;
   }
   ```

2. **Implement in `memory.ts`:**
   - Add `chatHistory: Map<SessionId, ChatMessage[]>`
   - Methods: get, add, clear

3. **Implement in `redis.ts`:**
   - Key: `chat:{sessionId}`
   - Store as JSON array
   - Methods: get (parse JSON), add (append), clear (delete key)

**Depends on:** Step 1 (shared types)

---

### Step 4: Backend WebSocket Event Broadcasting for Chat

**Package:** `packages/backend/`
**Files:**
- `packages/backend/src/index.ts` (modify broadcast registration)
- `packages/backend/src/ws/handler.ts` (modify)

**Changes:**

1. **Extend `broadcastClaudeCliEvent` in `index.ts`:**
   - Add handling for `chat:message` and `chat:history` event types
   - Broadcast to subscribed clients

2. **Modify WebSocket handler in `ws/handler.ts`:**
   - On `subscribe` message, send initial `chat:history` event (if any)
   - This enables frontend to replay conversation on reconnect

**Depends on:** Step 2 (message aggregator)

---

### Step 5: Frontend Chat Message Hook

**Package:** `packages/app/`
**Files:**
- `packages/app/src/hooks/useChatMessages.ts` (create)

**Changes:**

Create custom hook `useChatMessages(sessionId)`:
- Subscribe to WebSocket events: `chat:message`, `chat:history`
- Maintain local state: `messages: ChatMessage[]`
- Auto-scroll to bottom when new message arrives
- Deduplicate messages by ID (in case of duplicate events)
- Return: `{ messages, isLoading, error }`

**Key Logic:**
```typescript
useEffect(() => {
  const unsubscribe = onEvent?.((event) => {
    if (event.sessionId !== sessionId) return;

    if (event.type === 'chat:message') {
      setMessages(prev => [...prev, event.message]);
    }

    if (event.type === 'chat:history') {
      setMessages(event.messages);
    }
  });

  return unsubscribe;
}, [sessionId, onEvent]);
```

**Depends on:** Step 1 (shared types)

---

### Step 6: Frontend Prompt Button Context Engine

**Package:** `packages/app/`
**Files:**
- `packages/app/src/services/promptButtonSelector.ts` (create)
- `packages/app/src/hooks/usePromptButtons.ts` (create)

**Changes:**

1. **Create `promptButtonSelector.ts`:**
   - Service to select context-appropriate buttons
   - Input: `{ sessionStatus, lastMessageContent, conversationState, chainState, availableCommands }`
   - Output: `ButtonDefinition[]` (from existing SmartPromptLibrary types)
   - Logic:
     - If `conversationState === 'awaiting_input'` → show quick-response buttons
     - If last message contains code → show "Apply", "Review", "Modify" buttons
     - If last message is error → show "Retry", "Skip", "Debug" buttons
     - If chain is paused → show "Resume", "Cancel" buttons
     - Default → show flows/actions from SmartPromptLibrary

2. **Create `usePromptButtons(sessionId, messages)` hook:**
   - Calls `promptButtonSelector` to get buttons
   - Returns: `{ buttons, onButtonClick }`
   - Handles button actions: send command, send quick-response, trigger flow

**Depends on:** Step 1 (shared types), existing SmartPromptLibrary

---

### Step 7: Frontend ChatPanel Component

**Package:** `packages/app/`
**Files:**
- `packages/app/src/components/SessionPanel/ChatPanel.tsx` (create)
- `packages/app/src/components/SessionPanel/ChatPanel.css` (create)

**Changes:**

Create new `ChatPanel` component:

**Props:**
```typescript
interface ChatPanelProps {
  sessionId: SessionId;
  onSendMessage: (message: string) => Promise<void>;
  collapsible?: boolean;
}
```

**Layout:**
```
┌──────────────────────────┐
│ Header: "Chat" [collapse]│
├──────────────────────────┤
│ Messages Container       │
│ (flex: 1, overflow-y)    │
│                          │
│ ┌──────────────────────┐ │
│ │ Assistant message    │ │
│ │ (bubble, left-align) │ │
│ └──────────────────────┘ │
│   ┌────────────────────┐ │
│   │ User message       │ │
│   │ (bubble, right)    │ │
│   └────────────────────┘ │
├──────────────────────────┤
│ Prompt Buttons Grid      │
│ [Approve] [Reject]       │
│ [Resume] [Cancel]        │
├──────────────────────────┤
│ Input Field + Send       │
└──────────────────────────┘
```

**Features:**
- Use `useChatMessages(sessionId)` hook
- Use `usePromptButtons(sessionId, messages)` hook
- Message bubbles: assistant (left, gray), user (right, blue)
- Auto-scroll to bottom on new message
- Timestamps on messages
- Prompt buttons grid (auto-layout based on count)
- Text input + Send button at bottom
- Collapse to 32px header when collapsed

**Styling:**
- Mobile-first design (optimized for narrow 25% panel)
- Rounded message bubbles
- Smooth scrolling
- Button grid: 2-column layout on narrow screens
- Dark theme (match existing CliPanel)

**Depends on:** Step 5 (useChatMessages hook), Step 6 (usePromptButtons hook)

---

### Step 8: Replace CliPanel with ChatPanel in LeftPanelStack

**Package:** `packages/app/`
**Files:**
- `packages/app/src/components/SessionPanel/LeftPanelStack.tsx` (modify)
- `packages/app/src/components/SessionPanel/LeftPanelStack.css` (modify)

**Changes:**

1. **Modify `LeftPanelStack.tsx`:**
   ```diff
   - import { CliPanel } from './CliPanel';
   - import { ConversationPanel } from './ConversationPanel';
   - import { SmartPromptLibrary } from './SmartPromptLibrary';
   + import { ChatPanel } from './ChatPanel';

   - {/* Panel 2: CliPanel */}
   - <div className="left-panel-stack__panel left-panel-stack__panel--cli" style={{ flex: 1 }}>
   -   <CliPanel sessionId={session.id} collapsible />
   - </div>
   -
   - {/* Panel 3: ConversationPanel */}
   - <div className="left-panel-stack__panel" style={{ height: 200 }}>
   -   <ConversationPanel session={session} onSubmitInput={handleSubmitInput} collapsible />
   - </div>
   -
   - {/* Panel 4: SmartPromptLibrary */}
   - <div className="left-panel-stack__panel" style={{ height: 160 }}>
   -   <SmartPromptLibrary flows={flows} actions={actions} onSelectFlow={handleSelectFlow} />
   - </div>

   + {/* Panel 2: ChatPanel (replaces CliPanel + ConversationPanel + SmartPromptLibrary) */}
   + <div className="left-panel-stack__panel left-panel-stack__panel--chat" style={{ flex: 1 }}>
   +   <ChatPanel sessionId={session.id} onSendMessage={handleSendMessage} collapsible />
   + </div>
   ```

2. **Modify `LeftPanelStack.css`:**
   ```diff
   - .left-panel-stack__panel--cli {
   -   flex: 1;
   -   min-height: 200px;
   - }

   + .left-panel-stack__panel--chat {
   +   flex: 1;
   +   min-height: 300px;
   + }
   ```

3. **Update panel numbering:**
   - Panel 1: SessionInfoPanel (unchanged)
   - Panel 2: ChatPanel (NEW, replaces 3 panels)

**Depends on:** Step 7 (ChatPanel component)

---

### Step 9: Remove Deprecated CLI Components

**Package:** `packages/app/`
**Files:**
- `packages/app/src/components/SessionPanel/CliPanel.tsx` (delete)
- `packages/app/src/components/SessionPanel/CliPanel.css` (delete)
- `packages/app/src/components/SessionPanel/ConversationPanel.tsx` (delete)
- `packages/app/src/components/SessionPanel/ConversationPanel.css` (delete)
- `packages/app/src/components/SessionPanel/SmartPromptLibrary.tsx` (delete)
- `packages/app/src/components/SessionPanel/SmartPromptLibrary.css` (delete)
- `packages/app/src/components/SessionPanel/index.ts` (modify exports)

**Changes:**

1. Delete the 6 files listed above
2. Update `index.ts` exports:
   ```diff
   - export { CliPanel } from './CliPanel';
   - export { ConversationPanel } from './ConversationPanel';
   - export { SmartPromptLibrary } from './SmartPromptLibrary';
   + export { ChatPanel } from './ChatPanel';
   ```

**Evaluation: xterm dependencies**
Search codebase for other usages of xterm before removing dependencies:
- `ClaudeCliTerminal.tsx` - Still uses xterm (keep dependency)
- `TerminalPanel.tsx` - Still uses xterm (keep dependency)
- **Decision:** Do NOT remove xterm dependencies

**Depends on:** Step 8 (LeftPanelStack updated)

---

### Step 10: Update Backend Event Compatibility

**Package:** `packages/backend/`
**Files:**
- `packages/backend/src/services/claudeCliSession.ts` (add backward compatibility)

**Changes:**

**Dual Event Broadcasting:**
- Continue emitting `claude-cli:output` events (for backward compatibility)
- Add `chat:message` events (new format)
- Frontend can consume either format
- Gradual migration path

**Deprecation Notice:**
Add comment:
```typescript
// DEPRECATED: claude-cli:output events will be removed in v2.0
// Use chat:message events instead
```

**Depends on:** Step 2 (message aggregator), Step 4 (WebSocket broadcasting)

---

### Step 11: Frontend Input Handling Migration

**Package:** `packages/app/`
**Files:**
- `packages/app/src/components/SessionPanel/LeftPanelStack.tsx` (modify handlers)

**Changes:**

**Replace `handleSubmitInput` logic:**

Current:
```typescript
const handleSubmitInput = async (input: string) => {
  // Submit to /api/sessions/:id/input
  await sessionService.submitInput(sessionId, input);
};
```

New:
```typescript
const handleSendMessage = async (message: string) => {
  // Option A: Direct WebSocket send (preferred)
  send({
    type: 'input',
    sessionId: sessionId,
    payload: message,
    timestamp: new Date().toISOString(),
  } as WorkspaceEvent);

  // Option B: HTTP fallback
  // await sessionService.submitInput(sessionId, message);
};
```

**Why:** Chat interface sends messages via WebSocket, not HTTP. Backend already pipes WebSocket `input` events to CLI stdin.

**Depends on:** Step 7 (ChatPanel component)

---

### Step 12: Frontend Type Check and Build

**Package:** All packages
**Files:** N/A (validation step)

**Changes:**

1. Run type check across all packages:
   ```bash
   pnpm type-check
   ```

2. Fix any TypeScript errors:
   - Import path corrections
   - Type annotation fixes
   - Missing property definitions

3. Build all packages:
   ```bash
   pnpm build
   ```

4. Verify build output:
   - `packages/shared/dist/` contains updated types
   - `packages/backend/dist/` compiles successfully
   - `packages/app/dist/` compiles successfully

**Depends on:** Steps 1-11 (all implementation steps)

---

## Dependency Graph

```
Step 1 (shared types)
  ├──> Step 2 (backend message aggregator)
  │      └──> Step 4 (WebSocket broadcasting)
  │             └──> Step 10 (backward compatibility)
  ├──> Step 3 (storage extension)
  ├──> Step 5 (useChatMessages hook)
  │      └──> Step 7 (ChatPanel component)
  │             └──> Step 8 (LeftPanelStack update)
  │                    └──> Step 9 (cleanup)
  │                           └──> Step 12 (validation)
  └──> Step 6 (usePromptButtons hook)
         └──> Step 7 (ChatPanel component)

Step 11 (input handling) → Step 12 (validation) [parallel with Step 9]
```

**Critical Path:**
Step 1 → Step 2 → Step 4 → Step 7 → Step 8 → Step 9 → Step 12

**Parallelizable:**
- Step 3 (storage) can be done in parallel with Step 2 (both depend only on Step 1)
- Step 5 and Step 6 (hooks) can be done in parallel (both depend only on Step 1)
- Step 11 (input handling) can be done in parallel with Step 9 (cleanup)

---

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Message boundary detection failure** | Chat shows incomplete messages or garbled text | Add fallback timer (2s timeout) to finalize messages even without `result` event. Test with slow/fast responses. |
| **WebSocket event duplication** | Duplicate messages in chat UI | Implement message deduplication by ID in `useChatMessages` hook. Store seen message IDs in Set. |
| **Conversation history loss on reconnect** | Users lose context when page reloads | Persist history in backend storage (Step 3). Broadcast `chat:history` on reconnect (Step 4). |
| **Prompt button context mismatch** | Wrong buttons shown for current state | Add extensive context detection tests. Use default "general" buttons as fallback. |
| **Narrow panel UI overflow** | Buttons/messages overflow on 25% width panel | Use mobile-first CSS with flexbox/grid. Test at 280px min-width. Implement horizontal scroll as fallback. |
| **Backward compatibility break** | Existing ClaudeCliTerminal stops working | Keep `claude-cli:output` events alongside `chat:message` (Step 10). Deprecate gradually. |
| **Stream-JSON parsing errors** | Backend crashes on malformed JSON | Add try-catch in `parseStreamJson`. Fall back to raw text on parse errors. 1MB buffer limit prevents memory exhaustion. |
| **Type mismatches after shared types update** | Frontend/backend compile errors | Run `pnpm build` in shared package first. Then rebuild backend and frontend. Use strict TypeScript checks. |

---

## Verification

- [ ] Type check passes across all packages (`pnpm type-check`)
- [ ] Build succeeds for shared, backend, frontend (`pnpm build`)
- [ ] Existing tests pass (`pnpm test`)
- [ ] New functionality verified:
  - [ ] Chat messages display in ChatPanel
  - [ ] User can send messages via input field
  - [ ] User can send messages via prompt buttons
  - [ ] Prompt buttons change based on context (awaiting input, error, code change)
  - [ ] Conversation history persists on page reload
  - [ ] Message timestamps display correctly
  - [ ] Auto-scroll to bottom works
  - [ ] Collapse/expand ChatPanel works
  - [ ] SessionInfoPanel still displays at top
  - [ ] Layout responsive on narrow screens (280px min-width)
- [ ] Backend WebSocket events verified:
  - [ ] `chat:message` events broadcast on CLI output
  - [ ] `chat:history` event sent on reconnect
  - [ ] Message aggregator correctly buffers chunks
  - [ ] Tool use messages tagged with `messageType: 'tool_use'`
  - [ ] Error messages tagged with `messageType: 'error'`
- [ ] Cleanup verified:
  - [ ] CliPanel, ConversationPanel, SmartPromptLibrary removed
  - [ ] No import errors for deleted components
  - [ ] CSS files for deleted components removed
  - [ ] xterm dependencies kept (still used by ClaudeCliTerminal, TerminalPanel)

---

## Implementation Notes

### Stream-JSON Message Types (from backend analysis)

The Claude CLI's stream-JSON output emits these message types:

1. **`type: 'system'`** - Initialization messages (ignore)
2. **`type: 'stream_event'`** - Streaming content chunks
   - `event.type === 'content_block_delta'` → Text chunk (accumulate)
   - `event.type === 'content_block_start'` → Tool use start (extract tool name)
   - `event.type === 'message_stop'` → End of message (boundary)
3. **`type: 'assistant'`** - Complete assistant message (fallback)
4. **`type: 'result'`** - Turn completion with metadata (cost, duration, stop reason)
5. **`type: 'error'`** - Error message

### Message Aggregation Strategy

**Chunk Accumulation:**
```typescript
class MessageAggregator {
  private buffer: string = '';
  private currentMessageId: string | null = null;
  private currentMetadata: any = {};

  appendChunk(text: string) {
    if (!this.currentMessageId) {
      this.currentMessageId = generateId();
    }
    this.buffer += text;
  }

  setMetadata(key: string, value: any) {
    this.currentMetadata[key] = value;
  }

  finalizeMessage(): ChatMessage | null {
    if (!this.buffer.trim()) return null;

    const message: ChatMessage = {
      id: this.currentMessageId!,
      role: 'assistant',
      content: this.buffer,
      timestamp: new Date().toISOString(),
      messageType: this.currentMetadata.toolName ? 'tool_use' : 'text',
      metadata: this.currentMetadata,
    };

    // Reset buffer
    this.buffer = '';
    this.currentMessageId = null;
    this.currentMetadata = {};

    return message;
  }
}
```

### Prompt Button Selection Logic

**Context Detection:**
```typescript
function selectPromptButtons(context: {
  sessionStatus: SessionStatus;
  lastMessage?: ChatMessage;
  conversationState?: 'idle' | 'awaiting_input';
  chainState?: 'running' | 'paused' | 'completed';
}): ButtonDefinition[] {
  const buttons: ButtonDefinition[] = [];

  // Quick responses for awaiting input
  if (context.conversationState === 'awaiting_input') {
    buttons.push(
      { id: 'approve', label: 'Approve', icon: '✅', action: { type: 'quick-action', payload: { response: 'yes' } } },
      { id: 'reject', label: 'Reject', icon: '❌', action: { type: 'quick-action', payload: { response: 'no' } } }
    );
  }

  // Chain control buttons
  if (context.chainState === 'paused') {
    buttons.push(
      { id: 'resume', label: 'Resume', icon: '▶️', action: { type: 'command', commandType: 'resume' } },
      { id: 'cancel', label: 'Cancel', icon: '🛑', action: { type: 'command', commandType: 'cancel' } }
    );
  }

  // Error recovery buttons
  if (context.lastMessage?.messageType === 'error') {
    buttons.push(
      { id: 'retry', label: 'Retry', icon: '🔄', action: { type: 'command', commandType: 'retry' } },
      { id: 'skip', label: 'Skip', icon: '⏭️', action: { type: 'command', commandType: 'skip' } }
    );
  }

  // Code action buttons
  if (context.lastMessage?.content.includes('```')) {
    buttons.push(
      { id: 'apply', label: 'Apply', icon: '✨', action: { type: 'command', commandType: 'apply' } },
      { id: 'review', label: 'Review', icon: '👁️', action: { type: 'command', commandType: 'review' } }
    );
  }

  // Default: flows/actions from library (if no specific context matched)
  if (buttons.length === 0) {
    buttons.push(...getDefaultFlowButtons());
  }

  return buttons;
}
```

### CSS Layout for ChatPanel

**Mobile-First Approach (280px min-width):**
```css
.chat-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-width: 280px;
}

.chat-panel-header {
  flex-shrink: 0;
  height: 32px;
  /* ... header styles ... */
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.message-bubble {
  max-width: 85%;
  padding: 8px 12px;
  border-radius: 12px;
  word-wrap: break-word;
}

.message-bubble--assistant {
  align-self: flex-start;
  background: var(--panel-bg-elevated);
}

.message-bubble--user {
  align-self: flex-end;
  background: var(--btn-bg-primary);
}

.prompt-buttons-grid {
  flex-shrink: 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 6px;
  padding: 8px 12px;
  border-top: 1px solid var(--panel-border-default);
}

.input-area {
  flex-shrink: 0;
  padding: 8px 12px;
  border-top: 1px solid var(--panel-border-default);
  display: flex;
  gap: 6px;
}

.input-field {
  flex: 1;
  min-height: 36px;
  max-height: 120px;
  resize: vertical;
}

.send-button {
  flex-shrink: 0;
  width: 48px;
}
```

---

## Future Enhancements (Out of Scope)

- **Rich message rendering:** Markdown formatting, code highlighting, image support
- **Message editing:** Edit previous user messages
- **Message reactions:** Emoji reactions on messages
- **Voice input:** Speech-to-text for message input
- **Message search:** Full-text search across conversation history
- **Export conversation:** Export as markdown/PDF
- **Multi-session chat:** Chat across multiple sessions simultaneously
- **AI-suggested prompts:** ML-based prompt suggestions based on conversation context

---

**End of Plan**
