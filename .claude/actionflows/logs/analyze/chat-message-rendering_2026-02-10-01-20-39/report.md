# Frontend Chat Message Rendering System Analysis

**Aspect:** structure
**Scope:** packages/app/src/components/SessionPanel/ChatPanel.tsx, ChatPanel.css, useChatMessages.ts, packages/shared/src/models.ts
**Date:** 2026-02-10
**Agent:** analyze/

---

## 1. Message Rendering Component Architecture

### 1.1 Core Component
**File:** `D:/ActionFlowsDashboard/packages/app/src/components/SessionPanel/ChatPanel.tsx`

**Component:** `ChatPanel` (lines 118-533)
- **Purpose:** Mobile-format chat interface for Claude CLI sessions
- **State Management:** Uses `useChatMessages` hook for message state
- **Message Rendering:** Handled by `renderMessage()` function (lines 303-347)

### 1.2 Message Rendering Function
**Location:** ChatPanel.tsx, lines 303-347

```typescript
const renderMessage = (msg: ChatMessage, idx: number) => {
  const isUser = msg.role === 'user';
  const isSystem = msg.role === 'system';
  const isError = msg.messageType === 'error';
  const isToolUse = msg.messageType === 'tool_use';

  const bubbleClasses = [
    'chat-bubble',
    `chat-bubble--${msg.role}`,
    isError ? 'chat-bubble--error' : '',
    isToolUse ? 'chat-bubble--tool_use' : '',
  ].filter(Boolean).join(' ');

  return (
    <div key={msg.id || idx} className={bubbleClasses}>
      {/* Role label */}
      {!isSystem && (
        <span className="chat-bubble__role">
          {isUser ? 'You' : 'Claude'}
        </span>
      )}

      {/* Tool badge */}
      {isToolUse && msg.metadata?.toolName && (
        <span className="chat-bubble__tool-badge">
          Tool: {msg.metadata.toolName}
        </span>
      )}

      {/* Message content */}
      <div className="chat-bubble__content">{msg.content}</div>

      {/* Metadata footer */}
      <div className="chat-bubble__metadata">
        <span className="chat-bubble__timestamp">{formatTime(msg.timestamp)}</span>
        {msg.metadata?.cost && (
          <span className="chat-bubble__cost">{msg.metadata.cost}</span>
        )}
        {msg.metadata?.duration && (
          <span className="chat-bubble__cost">{msg.metadata.duration}</span>
        )}
      </div>
    </div>
  );
};
```

**Current Structure:**
1. **Role label** (`.chat-bubble__role`) - "You" or "Claude"
2. **Tool badge** (`.chat-bubble__tool-badge`) - Shows when `messageType === 'tool_use'` and `metadata.toolName` exists
3. **Message content** (`.chat-bubble__content`) - Plain text content
4. **Metadata footer** (`.chat-bubble__metadata`) - Timestamp, cost, duration

---

## 2. Message Metadata Access and Display

### 2.1 Current Metadata Fields Displayed
From `renderMessage()` function:
- ✅ `metadata.toolName` - Displayed in tool badge (line 326-330)
- ✅ `metadata.cost` - Displayed in footer (line 338-340)
- ✅ `metadata.duration` - Displayed in footer (line 341-343)

### 2.2 New Metadata Fields (Not Yet Displayed)
From `packages/shared/src/models.ts` (lines 470-480):
- ❌ `metadata.spawnPrompt` (string) - **Not accessed**
- ❌ `metadata.toolUseId` (string) - **Not accessed**
- ❌ `metadata.toolInput` (object) - **Not accessed**

### 2.3 Metadata Type Definition
**File:** `packages/app/src/hooks/useChatMessages.ts` (lines 21-28)

```typescript
metadata?: {
  model?: string;
  stopReason?: string;
  toolName?: string;
  stepNumber?: number;
  cost?: string;
  duration?: string;
}
```

**Note:** Local type is **out of sync** with shared package. Missing new fields:
- `toolUseId?: string`
- `toolInput?: unknown`
- `spawnPrompt?: string`

### 2.4 Metadata Mapping from Backend Events
**File:** `packages/app/src/hooks/useChatMessages.ts` (lines 88-103)

Backend event metadata fields are mapped to display-friendly format:
- `costUsd` (number) → `cost` (string, formatted as "$X.XXXX")
- `durationMs` (number) → `duration` (string, formatted as "X.Xs")

**Missing mappings:**
- No mapping for `spawnPrompt`, `toolUseId`, `toolInput`

---

## 3. CSS Patterns and Class Naming Conventions

### 3.1 Component Naming Convention
**Pattern:** BEM (Block-Element-Modifier)

**Block:** `.chat-panel`
**Elements:**
- `.chat-panel-header`
- `.chat-panel__messages`
- `.chat-panel__input-area`
- `.chat-panel__prompt-buttons`
- `.chat-panel__info-bar`

**Chat Bubble Block:** `.chat-bubble`
**Elements:**
- `.chat-bubble__role`
- `.chat-bubble__tool-badge`
- `.chat-bubble__content`
- `.chat-bubble__metadata`
- `.chat-bubble__timestamp`
- `.chat-bubble__cost`

**Modifiers:**
- `.chat-bubble--user`
- `.chat-bubble--assistant`
- `.chat-bubble--system`
- `.chat-bubble--error`
- `.chat-bubble--tool_use`

### 3.2 Key CSS Classes for Message Bubbles
**File:** `D:/ActionFlowsDashboard/packages/app/src/components/SessionPanel/ChatPanel.css`

| CSS Class | Purpose | Lines |
|-----------|---------|-------|
| `.chat-bubble` | Base message bubble container | 316-326 |
| `.chat-bubble--assistant` | Left-aligned gray bubble | 340-345 |
| `.chat-bubble--user` | Right-aligned blue bubble | 348-353 |
| `.chat-bubble--system` | Centered muted bubble | 356-366 |
| `.chat-bubble--error` | Error state bubble | 369-376 |
| `.chat-bubble--tool_use` | Tool use indicator | 379-390 |
| `.chat-bubble__role` | Role label (You/Claude) | 392-398 |
| `.chat-bubble__content` | Message text content | 404-411 |
| `.chat-bubble__metadata` | Footer metadata row | 413-418 |
| `.chat-bubble__timestamp` | Timestamp text | 420-423 |
| `.chat-bubble__cost` | Cost/duration chips | 425-431 |
| `.chat-bubble__tool-badge` | Tool name badge | 379-390 |

### 3.3 Design Tokens and Variables
**Commonly used:**
- `var(--panel-bg-elevated)` - Background for assistant messages
- `var(--btn-bg-primary)` - Background for user messages
- `var(--text-primary)` - Primary text color
- `var(--text-secondary)` - Secondary/muted text
- `var(--text-tertiary)` - Timestamps and metadata
- `var(--panel-border-default)` - Border styling
- `var(--font-mono)` - Monospace font family (e.g., for code)

---

## 4. Existing Expandable/Collapsible UI Patterns

### 4.1 DossierView Pattern (Reference Implementation)
**File:** `D:/ActionFlowsDashboard/packages/app/src/components/IntelDossier/DossierView.tsx` (lines 80-104)

**Implementation:**
```tsx
const [targetsExpanded, setTargetsExpanded] = useState(false);

<div className="dossier-view__section">
  <button
    className="dossier-view__section-header"
    onClick={() => setTargetsExpanded(!targetsExpanded)}
  >
    <span className="dossier-view__section-icon">
      {targetsExpanded ? '▼' : '▶'}
    </span>
    <span className="dossier-view__section-title">
      Targets ({dossier.targets.length})
    </span>
  </button>
  {targetsExpanded && (
    <div className="dossier-view__section-content">
      {/* Content here */}
    </div>
  )}
</div>
```

**CSS Pattern (DossierView.css):**
- `.dossier-view__section` - Outer container (lines 138-145)
- `.dossier-view__section-header` - Clickable header button (lines 147-158)
- `.dossier-view__section-icon` - Expand/collapse arrow (lines 164-168)
- `.dossier-view__section-title` - Section title (lines 170-174)
- `.dossier-view__section-content` - Collapsible content (lines 176-178)

**Key Features:**
- ▶/▼ arrow indicators
- Smooth hover states (`.dossier-view__section-header:hover`)
- Transition on icon rotation
- Full-width clickable header
- Content padding when expanded

### 4.2 Code Block Pattern (Reference Implementation)
**File:** `D:/ActionFlowsDashboard/packages/app/src/components/IntelDossier/widgets/widgets.css` (lines 370-386)

```css
.widget-snippet-preview__code {
  margin: 0;
  padding: var(--space-3);
  background: var(--app-bg-primary);
  border: var(--panel-border-default);
  border-radius: var(--btn-radius-sm);
  overflow-x: auto;
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  line-height: 1.5;
  color: var(--text-primary);
}

.widget-snippet-preview__code code {
  font-family: inherit;
  font-size: inherit;
}
```

**Usage Pattern:**
```tsx
<pre className="widget-snippet-preview__code">
  <code>{codeContent}</code>
</pre>
```

### 4.3 ChatPanel Collapsible Header
**File:** `D:/ActionFlowsDashboard/packages/app/src/components/SessionPanel/ChatPanel.tsx` (lines 356-400)

The ChatPanel itself has a collapsible pattern:
- State: `const [isCollapsed, setIsCollapsed] = useState(false);`
- Toggle button with chevron icon (lines 379-398)
- Conditional rendering based on `!isCollapsed`

---

## 5. Insertion Point for Spawn Prompt Expandable Section

### 5.1 Recommended Insertion Location
**Within `renderMessage()` function**, between the **tool badge** and **message content**.

**Current Order:**
1. Role label
2. Tool badge ← **INSERT HERE**
3. Message content
4. Metadata footer

**Proposed Structure:**
```tsx
{/* Tool badge */}
{isToolUse && msg.metadata?.toolName && (
  <span className="chat-bubble__tool-badge">
    Tool: {msg.metadata.toolName}
  </span>
)}

{/* NEW: Spawn prompt expandable section */}
{isToolUse && msg.metadata?.spawnPrompt && (
  <SpawnPromptSection prompt={msg.metadata.spawnPrompt} />
)}

{/* Message content */}
<div className="chat-bubble__content">{msg.content}</div>
```

### 5.2 Alternative: Inline Expandable Within Message Bubble
Instead of a separate component, directly integrate:

```tsx
{isToolUse && msg.metadata?.spawnPrompt && (
  <div className="chat-bubble__spawn-prompt">
    <button
      className="chat-bubble__spawn-prompt-header"
      onClick={() => toggleSpawnPrompt(msg.id)}
    >
      <span className="chat-bubble__spawn-prompt-icon">
        {isSpawnPromptExpanded(msg.id) ? '▼' : '▶'}
      </span>
      <span className="chat-bubble__spawn-prompt-label">
        Spawn Prompt
      </span>
    </button>
    {isSpawnPromptExpanded(msg.id) && (
      <pre className="chat-bubble__spawn-prompt-content">
        <code>{msg.metadata.spawnPrompt}</code>
      </pre>
    )}
  </div>
)}
```

### 5.3 State Management for Expansion
**Option A:** Component-level state (simple)
```tsx
const [expandedSpawnPrompts, setExpandedSpawnPrompts] = useState<Set<string>>(new Set());

const toggleSpawnPrompt = (msgId: string) => {
  setExpandedSpawnPrompts(prev => {
    const next = new Set(prev);
    if (next.has(msgId)) {
      next.delete(msgId);
    } else {
      next.add(msgId);
    }
    return next;
  });
};

const isSpawnPromptExpanded = (msgId: string) => expandedSpawnPrompts.has(msgId);
```

**Option B:** Per-message state with index tracking (simpler for small lists)
```tsx
const [expandedMsgIndex, setExpandedMsgIndex] = useState<number | null>(null);
```

---

## 6. CSS Class Naming Recommendations

Following existing BEM convention in ChatPanel:

| CSS Class | Purpose |
|-----------|---------|
| `.chat-bubble__spawn-prompt` | Container for spawn prompt section |
| `.chat-bubble__spawn-prompt-header` | Clickable header button |
| `.chat-bubble__spawn-prompt-icon` | ▶/▼ expand/collapse icon |
| `.chat-bubble__spawn-prompt-label` | "Spawn Prompt" label text |
| `.chat-bubble__spawn-prompt-content` | Expandable code block content |
| `.chat-bubble__spawn-prompt-content code` | Code element within pre |

**Style inspiration from:**
- `.dossier-view__section-*` (DossierView.css, lines 138-178) for collapsible structure
- `.widget-snippet-preview__code` (widgets.css, lines 370-386) for code block styling
- `.chat-bubble__tool-badge` (ChatPanel.css, lines 379-390) for badge styling

---

## 7. Exact Component Structure Summary

### 7.1 ChatPanel Component Hierarchy
```
ChatPanel (ChatPanel.tsx:118-533)
├── Header (lines 356-400)
│   ├── Left section (title, status badge, message count)
│   ├── Right section (live badge, collapse toggle)
├── Session Info Bar (lines 402-436)
│   ├── Session ID button
│   ├── Timestamp chip
│   ├── Duration chip
│   ├── Chain count chip
│   └── Active chain chip
├── Messages Container (lines 442-468)
│   ├── Empty state
│   ├── Message bubbles (mapped via renderMessage)
│   ├── Typing indicator
│   └── Scroll anchor
├── Prompt Buttons Grid (lines 470-485)
└── Input Area (lines 487-528)
    ├── Textarea
    └── Send button
```

### 7.2 Message Bubble Component Structure
```
.chat-bubble (div)
├── .chat-bubble__role (span) - "You" or "Claude"
├── .chat-bubble__tool-badge (span) - "Tool: {toolName}"
│   [INSERTION POINT for spawn prompt section]
├── .chat-bubble__content (div) - Message text
└── .chat-bubble__metadata (div)
    ├── .chat-bubble__timestamp (span)
    ├── .chat-bubble__cost (span) - cost
    └── .chat-bubble__cost (span) - duration
```

### 7.3 Props Flow
```
ChatPanel
  ↓ sessionId
useChatMessages(sessionId)
  ↓ messages: ChatMessage[]
renderMessage(msg: ChatMessage, idx: number)
  → renders .chat-bubble with msg.role, msg.content, msg.metadata
```

---

## 8. Type Definitions and Interfaces

### 8.1 ChatMessage Type (Frontend)
**File:** `packages/app/src/hooks/useChatMessages.ts` (lines 15-29)

```typescript
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  messageType?: 'text' | 'tool_use' | 'tool_result' | 'error';
  metadata?: {
    model?: string;
    stopReason?: string;
    toolName?: string;
    stepNumber?: number;
    cost?: string;        // Formatted from costUsd
    duration?: string;    // Formatted from durationMs
  };
}
```

**Missing fields** (present in shared package but not in frontend type):
- `toolUseId?: string;`
- `toolInput?: unknown;`
- `spawnPrompt?: string;`

### 8.2 ChatMessage Type (Shared Package)
**File:** `packages/shared/src/models.ts` (lines 450-481)

```typescript
export interface ChatMessage {
  id: string;
  sessionId: SessionId;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Timestamp;
  messageType?: 'text' | 'tool_use' | 'tool_result' | 'error';
  metadata?: {
    model?: string;
    stopReason?: string;
    toolName?: string;
    toolUseId?: string;      // ← NEW
    toolInput?: unknown;     // ← NEW
    spawnPrompt?: string;    // ← NEW
    stepNumber?: number;
    costUsd?: number;
    durationMs?: number;
  };
}
```

### 8.3 Type Sync Issue
**Action Required:** Update frontend `ChatMessage` type in `useChatMessages.ts` to include:
- `toolUseId?: string`
- `toolInput?: unknown`
- `spawnPrompt?: string`

---

## 9. Backend Event Parsing

### 9.1 chat:message Event Handler
**File:** `packages/app/src/hooks/useChatMessages.ts` (lines 66-114)

Current mapping:
```typescript
const chatMsg: ChatMessage = {
  id: msg.id,
  role: (msg.role as ChatMessage['role']) || 'assistant',
  content: msg.content || '',
  timestamp: msg.timestamp || new Date().toISOString(),
  messageType: (msg.messageType as ChatMessage['messageType']) || 'text',
  metadata: msg.metadata
    ? {
        model: msg.metadata.model as string | undefined,
        stopReason: msg.metadata.stopReason as string | undefined,
        toolName: msg.metadata.toolName as string | undefined,
        cost: typeof msg.metadata.costUsd === 'number'
          ? `$${msg.metadata.costUsd.toFixed(4)}`
          : undefined,
        duration: typeof msg.metadata.durationMs === 'number'
          ? `${(msg.metadata.durationMs / 1000).toFixed(1)}s`
          : undefined,
      }
    : undefined,
};
```

**Missing metadata fields in mapping:**
- `toolUseId`
- `toolInput`
- `spawnPrompt`

**Required Update:**
Add these fields to the metadata mapping:
```typescript
metadata: msg.metadata
  ? {
      model: msg.metadata.model as string | undefined,
      stopReason: msg.metadata.stopReason as string | undefined,
      toolName: msg.metadata.toolName as string | undefined,
      toolUseId: msg.metadata.toolUseId as string | undefined,  // ← ADD
      toolInput: msg.metadata.toolInput,                         // ← ADD
      spawnPrompt: msg.metadata.spawnPrompt as string | undefined, // ← ADD
      cost: typeof msg.metadata.costUsd === 'number'
        ? `$${msg.metadata.costUsd.toFixed(4)}`
        : undefined,
      duration: typeof msg.metadata.durationMs === 'number'
        ? `${(msg.metadata.durationMs / 1000).toFixed(1)}s`
        : undefined,
    }
  : undefined,
```

---

## Recommendations

### Priority 1: Type Synchronization
1. **Update `useChatMessages.ts` ChatMessage interface** to include:
   - `toolUseId?: string`
   - `toolInput?: unknown`
   - `spawnPrompt?: string`

2. **Update event handler mapping** (lines 88-103) to pass through new fields

### Priority 2: UI Implementation
1. **Add expandable spawn prompt section** to `renderMessage()` function
   - Use DossierView collapsible pattern as template
   - Insert between tool badge and message content
   - Show only when `msg.messageType === 'tool_use'` AND `msg.metadata?.spawnPrompt` exists

2. **Create CSS classes** following BEM convention:
   - `.chat-bubble__spawn-prompt`
   - `.chat-bubble__spawn-prompt-header`
   - `.chat-bubble__spawn-prompt-icon`
   - `.chat-bubble__spawn-prompt-label`
   - `.chat-bubble__spawn-prompt-content`

3. **Style code block** using existing pattern from `widgets.css`:
   - Monospace font (`var(--font-mono)`)
   - Dark background (`var(--app-bg-primary)`)
   - Border and border-radius
   - Horizontal scroll for long lines

### Priority 3: State Management
1. **Add expansion state** to ChatPanel component:
   ```tsx
   const [expandedSpawnPrompts, setExpandedSpawnPrompts] = useState<Set<string>>(new Set());
   ```

2. **Add toggle handler** for expand/collapse:
   ```tsx
   const toggleSpawnPrompt = useCallback((msgId: string) => {
     setExpandedSpawnPrompts(prev => {
       const next = new Set(prev);
       if (next.has(msgId)) next.delete(msgId);
       else next.add(msgId);
       return next;
     });
   }, []);
   ```

### Priority 4: Accessibility
1. Add ARIA attributes:
   - `aria-expanded` on header button
   - `aria-controls` linking header to content
   - `aria-label` for screen readers

2. Keyboard support:
   - Enter/Space to toggle
   - Tab navigation

---

## File Reference Summary

| File Path | Lines | Purpose |
|-----------|-------|---------|
| `packages/app/src/components/SessionPanel/ChatPanel.tsx` | 303-347 | `renderMessage()` function - message bubble rendering |
| `packages/app/src/components/SessionPanel/ChatPanel.css` | 316-431 | Message bubble styles and BEM classes |
| `packages/app/src/hooks/useChatMessages.ts` | 15-29 | Frontend `ChatMessage` type (needs update) |
| `packages/app/src/hooks/useChatMessages.ts` | 66-114 | Backend event → ChatMessage mapping (needs update) |
| `packages/shared/src/models.ts` | 450-481 | Shared `ChatMessage` type (source of truth) |
| `packages/app/src/components/IntelDossier/DossierView.tsx` | 80-104 | Expandable section reference implementation |
| `packages/app/src/components/IntelDossier/DossierView.css` | 138-178 | Collapsible section CSS pattern |
| `packages/app/src/components/IntelDossier/widgets/widgets.css` | 370-386 | Code block CSS pattern |

---

**End of Analysis Report**
