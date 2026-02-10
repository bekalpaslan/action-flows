# CLI Panel / Terminal Components Analysis

**Date:** 2026-02-10
**Scope:** All xterm/terminal/CLI-related components in the frontend
**Context:** Replacing CLI terminal panel with mobile-format chat window

---

## Executive Summary

The CLI terminal functionality is deeply integrated into the left panel (25% width) of the SessionPanelLayout. The system uses **xterm.js** for terminal rendering and connects to Claude Code CLI sessions via WebSocket. The primary component is `CliPanel`, which sits in position #2 of a 4-panel vertical stack within the left sidebar.

**Key Finding:** The CLI panel is NOT a full-screen component but rather a **flexible-height panel** within a left sidebar that takes 25% of the screen width by default (resizable between 15-40%).

---

## 1. Component Hierarchy

### Top-Level Layout

```
SessionPanelLayout (25/75 horizontal split)
├── Left Panel (25% width, resizable 15-40%)
│   └── LeftPanelStack (vertical stack of 4 panels)
│       ├── 1. SessionInfoPanel (auto height)
│       ├── 2. CliPanel (flex: 1, grows to fill)
│       ├── 3. ConversationPanel (200px fixed)
│       └── 4. SmartPromptLibrary (160px fixed)
└── Right Panel (75% width)
    └── RightVisualizationArea (flow visualization)
```

### File Locations

| Component | Path | Status |
|-----------|------|--------|
| **CliPanel** | `packages/app/src/components/SessionPanel/CliPanel.tsx` | ✅ Primary CLI component |
| **CliPanel.css** | `packages/app/src/components/SessionPanel/CliPanel.css` | ✅ Dark theme, narrow panel styles |
| **LeftPanelStack** | `packages/app/src/components/SessionPanel/LeftPanelStack.tsx` | ✅ Container for all left panels |
| **LeftPanelStack.css** | `packages/app/src/components/SessionPanel/LeftPanelStack.css` | ✅ Vertical stacking layout |
| **SessionPanelLayout** | `packages/app/src/components/SessionPanel/SessionPanelLayout.tsx` | ✅ Top-level 25/75 split |
| **SessionPanelLayout.css** | `packages/app/src/components/SessionPanel/SessionPanelLayout.css` | ✅ Horizontal split styles |
| **ClaudeCliTerminal** | `packages/app/src/components/ClaudeCliTerminal/ClaudeCliTerminal.tsx` | ⚠️ Interactive terminal (less used) |
| **TerminalPanel** | `packages/app/src/components/Terminal/TerminalPanel.tsx` | ⚠️ Read-only terminal (deprecated note) |

---

## 2. Primary Component: CliPanel

**File:** `D:/ActionFlowsDashboard/packages/app/src/components/SessionPanel/CliPanel.tsx`

### Props Interface

```typescript
export interface CliPanelProps {
  sessionId: SessionId;         // REQUIRED
  height?: number | string;     // Default: 200 (not used in LeftPanelStack)
  onCommand?: (command: string) => void;
  collapsible?: boolean;        // Default: true
  cwd?: string;                 // Default: 'D:/ActionFlowsDashboard'
}
```

### Key Features

1. **xterm.js Integration**
   - Terminal instance created with `new Terminal()`
   - FitAddon for responsive sizing
   - Dark theme with Cascadia Code font
   - 10,000 line scrollback buffer

2. **WebSocket Connection**
   - Subscribes to session events via `useWebSocketContext()`
   - Listens for `claude-cli:output` events
   - Listens for `claude-cli:exited` events
   - Sends commands via WebSocket with type `'input'`

3. **Stream-JSON Parser**
   - Parses Claude CLI stdout as JSONL format
   - Handles message types: `system`, `stream_event`, `assistant`, `result`
   - Extracts text deltas from `content_block_delta` events
   - Displays tool usage with yellow highlighting
   - Shows cost/duration metadata on completion

4. **CLI Session Lifecycle**
   - States: `'not-started' | 'starting' | 'running' | 'stopped'`
   - Auto-starts session on first command
   - Uses `claudeCliService.startSession()` to initialize
   - Displays retry prompt on failure

5. **UI Components**
   - **Header:** Collapsible with "CLI" title
   - **Terminal Display:** xterm.js container (flex: 1)
   - **Command Input:** Text field with $ prompt symbol
   - **Send Button:** Icon button with spinner during send

### Layout Strategy

```css
/* CliPanel is sized by parent (LeftPanelStack), NOT by its own height prop */
.left-panel-stack__panel--cli {
  flex: 1;              /* Grows to fill remaining space */
  min-height: 200px;    /* Minimum height constraint */
}
```

**Important:** The `height` prop is NOT used in production. LeftPanelStack sets `flex: 1` to make CliPanel fill the remaining vertical space after fixed-height panels.

---

## 3. Layout Positioning: Left Panel (25% Width)

**File:** `D:/ActionFlowsDashboard/packages/app/src/components/SessionPanel/SessionPanelLayout.tsx`

### Horizontal Split Strategy

```typescript
const DEFAULT_SPLIT_RATIO = 25;           // 25% for left panel
const MIN_LEFT_WIDTH_PERCENT = 15;        // Minimum: 15%
const MAX_LEFT_WIDTH_PERCENT = 40;        // Maximum: 40%
```

### Layout Structure

```css
.session-panel-layout {
  display: flex;
  flex-direction: row;
  height: 100%;
  width: 100%;
}

.session-panel-layout__left {
  width: 25%;                /* Default, controlled by splitRatio state */
  min-width: 280px;
  max-width: 50%;
  border-right: 1px solid #404040;
}

.session-panel-layout__right {
  width: 75%;                /* 100% - splitRatio */
  flex: 1;
}
```

### Resize Handle

- **Component:** `ResizeHandle` (between left and right panels)
- **Behavior:** Drag to adjust split ratio
- **Persistence:** Saves ratio to `localStorage` per session
- **Key:** `session-panel-split-ratio-${sessionId}`

### Responsive Behavior

```css
@media (max-width: 800px) {
  /* Stack vertically on narrow screens */
  .session-panel-layout {
    flex-direction: column;
  }
  .session-panel-layout__left {
    width: 100% !important;
    height: 40%;
  }
  .session-panel-layout__right {
    width: 100% !important;
    height: 60%;
  }
}
```

---

## 4. Vertical Panel Stack (Left Sidebar)

**File:** `D:/ActionFlowsDashboard/packages/app/src/components/SessionPanel/LeftPanelStack.tsx`

### Panel Order (Top to Bottom)

| # | Component | Height Strategy | Purpose |
|---|-----------|----------------|---------|
| 1 | SessionInfoPanel | `auto` (flex-shrink: 0) | Session metadata display |
| 2 | **CliPanel** | `flex: 1` (grows) | **CLI terminal (TARGET FOR REMOVAL)** |
| 3 | ConversationPanel | `200px` (flex-shrink: 0) | Message history |
| 4 | SmartPromptLibrary | `160px` (flex-shrink: 0) | Flow/action buttons |

### Collapse Detection

```css
/* Wrapper collapses when child has .collapsed class */
.left-panel-stack__panel:has(> .collapsed) {
  flex: 0 0 auto !important;
  height: 32px !important;
  min-height: 32px !important;
  overflow: hidden;
}
```

When CliPanel is collapsed, it shows only the 32px header with "CLI" title.

### Panel Number Badges

Each panel has a numbered badge (1-4) positioned at `top: 4px; right: 28px`.

---

## 5. xterm.js Integration Points

### Dependencies

```json
{
  "xterm": "^5.3.0",
  "@xterm/addon-fit": "^0.8.0",
  "@xterm/addon-search": "^0.13.0"  // Only in TerminalPanel
}
```

### Terminal Configuration (CliPanel)

```typescript
const terminal = new Terminal({
  cursorBlink: true,
  cursorStyle: 'block',
  fontSize: 13,
  fontFamily: '"Cascadia Code", "Fira Code", "Consolas", monospace',
  theme: {
    background: '#0a0a0a',
    foreground: '#d4d4d4',
    cursor: '#d4d4d4',
    // ... (full color palette defined)
  },
  allowProposedApi: true,
  scrollback: 10000,
  convertEol: true,
});
```

### FitAddon Usage

```typescript
const fitAddon = new FitAddon();
terminal.loadAddon(fitAddon);
terminal.open(terminalRef.current);
fitAddon.fit();  // Auto-resize to container dimensions

// Re-fit on window resize
window.addEventListener('resize', () => fitAddon.fit());
```

### Terminal Lifecycle

1. **Initialization:** Created in `useEffect` when `terminalRef.current` exists and `!isCollapsed`
2. **Disposal:** Cleaned up when component unmounts or collapses
3. **Re-creation:** New terminal instance created when expanding from collapsed state

---

## 6. WebSocket Event Handling

### Context Provider

**File:** `D:/ActionFlowsDashboard/packages/app/src/contexts/WebSocketContext.tsx`

```typescript
interface WebSocketContextType {
  status: ConnectionStatus;
  error: Error | null;
  send: (message: WorkspaceEvent) => void;
  subscribe: (sessionId: SessionId) => void;
  unsubscribe: (sessionId: SessionId) => void;
  onEvent: ((callback: (event: WorkspaceEvent) => void) => () => void) | null;
}
```

### Event Types Consumed by CliPanel

#### 1. `claude-cli:output` (ClaudeCliOutputEvent)

**Source:** `packages/shared/src/events.ts:427-436`

```typescript
export interface ClaudeCliOutputEvent extends BaseEvent {
  type: 'claude-cli:output';
  output: string;          // Raw stdout/stderr chunk
  stream: 'stdout' | 'stderr';
  timestamp: Timestamp;
}
```

**Handler Logic:**

```typescript
if (event.type === 'claude-cli:output') {
  const outputEvent = event as ClaudeCliOutputEvent;
  const raw = outputEvent.output;
  const isError = outputEvent.stream === 'stderr';

  if (isError) {
    terminal.write('\x1b[31m' + raw + '\x1b[0m');  // Red text
  } else {
    // Parse stream-json JSONL (handles partial lines across chunks)
    const buffered = lineBufferRef.current + raw;
    const lines = buffered.split('\n');
    lineBufferRef.current = lines.pop() || '';

    for (const line of lines) {
      const msg = JSON.parse(line);
      // Handle msg.type: 'system', 'stream_event', 'assistant', 'result'
    }
  }
}
```

#### 2. `claude-cli:exited` (ClaudeCliExitedEvent)

**Source:** `packages/shared/src/events.ts:438-448`

```typescript
export interface ClaudeCliExitedEvent extends BaseEvent {
  type: 'claude-cli:exited';
  exitCode: number | null;
  exitSignal: string | null;
  duration: DurationMs;
  timestamp: Timestamp;
}
```

**Handler Logic:**

```typescript
if (event.type === 'claude-cli:exited') {
  setCliStateSync('stopped');
  terminal.writeln('\x1b[1;33mClaude CLI session ended\x1b[0m');
}
```

### Event Publishing (Command Sent)

```typescript
send({
  type: 'input',
  sessionId: sessionId,
  payload: command,
  timestamp: new Date().toISOString(),
} as unknown as WorkspaceEvent);
```

**Note:** The `'input'` event type is NOT defined in `events.ts`. This appears to be a custom event type handled by the backend WebSocket handler.

---

## 7. Backend Integration: claudeCliService

**File:** `D:/ActionFlowsDashboard/packages/app/src/services/claudeCliService.ts`

### API Methods

```typescript
class ClaudeCliService {
  baseUrl: string = 'http://localhost:3001';

  // Start a new Claude CLI session
  async startSession(
    sessionId: SessionId,
    cwd: string,
    prompt?: string,
    flags?: string[],
    projectId?: ProjectId,
    envVars?: Record<string, string>,
    mcpConfigPath?: string
  ): Promise<ClaudeCliSession>

  // Send input to Claude CLI session
  async sendInput(sessionId: SessionId, input: string): Promise<void>

  // Stop a Claude CLI session
  async stopSession(sessionId: SessionId, signal?: 'SIGTERM' | 'SIGINT' | 'SIGKILL'): Promise<void>

  // Get Claude CLI session status
  async getSessionStatus(sessionId: SessionId): Promise<{
    session: ClaudeCliSession;
    uptime: number;
    isRunning: boolean;
  }>

  // List all active Claude CLI sessions
  async listSessions(): Promise<ClaudeCliSession[]>

  // Discover externally-running Claude Code sessions
  async discoverSessions(opts?: {
    enrich?: boolean;
    aliveOnly?: boolean;
  }): Promise<DiscoveredClaudeSession[]>
}

export const claudeCliService = new ClaudeCliService();
```

### API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/claude-cli/start` | Start CLI session |
| POST | `/api/claude-cli/${sessionId}/input` | Send command |
| POST | `/api/claude-cli/${sessionId}/stop` | Stop session |
| GET | `/api/claude-cli/${sessionId}/status` | Get session status |
| GET | `/api/claude-cli/sessions` | List all sessions |
| GET | `/api/discovery/sessions` | Discover external sessions |

---

## 8. Hook: useClaudeCliControl

**File:** `D:/ActionFlowsDashboard/packages/app/src/hooks/useClaudeCliControl.ts`

### Interface

```typescript
export interface UseClaudeCliControlReturn {
  sendInput: (input: string) => Promise<void>;
  stop: (signal?: 'SIGTERM' | 'SIGINT' | 'SIGKILL') => Promise<void>;
  isLoading: boolean;
  error: Error | null;
}
```

### Usage

```typescript
const { sendInput, stop, isLoading, error } = useClaudeCliControl(sessionId);
```

**Note:** This hook is used by `ClaudeCliTerminal` but NOT by `CliPanel`. CliPanel directly uses `claudeCliService`.

---

## 9. Alternative Terminal Components (Less Used)

### ClaudeCliTerminal

**File:** `D:/ActionFlowsDashboard/packages/app/src/components/ClaudeCliTerminal/ClaudeCliTerminal.tsx`

**Differences from CliPanel:**
- **Interactive stdin:** `disableStdin: false` (allows typing directly in terminal)
- **Toolbar:** Stop, Clear, Close buttons
- **No collapse:** Always expanded
- **Different styling:** Inline styles instead of CSS module

**Usage Context:** Appears to be for interactive sessions where user types directly in terminal rather than using separate input field.

### TerminalPanel

**File:** `D:/ActionFlowsDashboard/packages/app/src/components/Terminal/TerminalPanel.tsx`

**Status:** Marked as deprecated with note:

> NOTE: This component is designed for single-session terminal mode.
> Currently, TerminalTabs is used in AppContent for multi-session support.
> This file is kept for potential future use or as reference implementation.

**Differences:**
- Read-only terminal (`disableStdin: true`)
- Resizable height with drag handle
- Search addon support
- Export terminal content to .log file
- Step attribution (shows `[#N action]` prefix)

---

## 10. Styling Approach

### CSS Design System

All components use CSS custom properties from global design system:

```css
/* Panel backgrounds */
var(--panel-bg-base)
var(--panel-bg-elevated)
var(--panel-bg-inset)
var(--panel-header-bg)

/* Borders and shadows */
var(--panel-border-default)
var(--panel-glow-default)
var(--panel-glow-hover)
var(--panel-radius-sm)

/* Input fields */
var(--input-bg-default)
var(--input-border-default)
var(--input-border-focus)
var(--input-glow-default)
var(--input-glow-focus)
var(--input-radius-md)

/* Buttons */
var(--btn-bg-primary)
var(--btn-glow-default)
var(--btn-glow-hover)
var(--btn-radius-md)

/* Text colors */
var(--text-primary)
var(--text-secondary)
var(--text-tertiary)

/* Transitions */
var(--transition-colors)
var(--transition-all)
```

### CliPanel Specific Styles

**File:** `D:/ActionFlowsDashboard/packages/app/src/components/SessionPanel/CliPanel.css`

**Key Classes:**

```css
.cli-panel                    /* Main container */
.cli-panel.collapsed          /* Collapsed state (32px height) */
.cli-panel-header             /* Collapsible header */
.cli-terminal-container       /* xterm.js wrapper (flex: 1) */
.cli-input-container          /* Command input row */
.cli-input-prompt             /* $ symbol */
.cli-input-field              /* Text input */
.cli-send-button              /* Send button */
.send-icon                    /* SVG icon */
.send-icon.spinning           /* Spinner animation */
```

**Responsive Adjustments:**

```css
@media (max-width: 320px) {
  /* Smaller padding, font sizes, icons for very narrow panels */
}
```

**Scrollbar Styling:**

Custom WebKit scrollbar for xterm viewport (6px width, dark theme).

---

## 11. Data Flow Summary

```
User Types Command
  ↓
CliPanel.handleSendCommand()
  ↓
claudeCliService.startSession() [if not running]
  ↓
WebSocket.send({ type: 'input', sessionId, payload: command })
  ↓
Backend Spawns Claude CLI Process
  ↓
Backend Streams stdout/stderr to WebSocket
  ↓
WebSocket Emits 'claude-cli:output' Event
  ↓
CliPanel Event Handler Receives Event
  ↓
Parse stream-json JSONL
  ↓
Extract text deltas from content_block_delta
  ↓
terminal.write(text)
  ↓
xterm.js Renders Text to Canvas
```

---

## 12. Removal Impact Analysis

### Components to Remove/Replace

1. **CliPanel.tsx** ✅ Primary target
2. **CliPanel.css** ✅ Styles for CliPanel

### Components to Modify

1. **LeftPanelStack.tsx** ⚠️ Remove panel #2, adjust layout
2. **LeftPanelStack.css** ⚠️ Remove `.left-panel-stack__panel--cli` styles
3. **SessionPanelLayout.tsx** ⚠️ May need layout adjustments if removing left panel entirely

### Components to Keep (Potentially)

1. **ClaudeCliTerminal.tsx** - May be useful for other features
2. **TerminalPanel.tsx** - Already deprecated, no impact
3. **claudeCliService.ts** - Backend API client (reusable)
4. **useClaudeCliControl.ts** - Hook for CLI control (reusable)

### Dependencies to Evaluate

```json
{
  "xterm": "^5.3.0",               // May remove if no other usage
  "@xterm/addon-fit": "^0.8.0",    // May remove if no other usage
}
```

**Action:** Search codebase for other usages of xterm before removing dependencies.

### WebSocket Events to Preserve

- `claude-cli:output` - Still needed if chat window displays CLI output
- `claude-cli:exited` - Still needed for session lifecycle
- `'input'` type - Still needed for sending commands

### Backend Routes to Preserve

All routes in `claudeCliService` should remain intact:
- `/api/claude-cli/start`
- `/api/claude-cli/${sessionId}/input`
- `/api/claude-cli/${sessionId}/stop`
- `/api/claude-cli/sessions`
- `/api/discovery/sessions`

---

## 13. Replacement Strategy Recommendations

### Option A: Replace CliPanel with ChatPanel

```typescript
// LeftPanelStack.tsx
<div className="left-panel-stack__panel left-panel-stack__panel--chat" style={{ flex: 1 }}>
  <ChatPanel sessionId={session.id} />
</div>
```

**Pros:**
- Minimal layout changes
- Keeps 4-panel vertical stack structure
- Preserves flex: 1 growth behavior

**Cons:**
- Chat window still constrained to narrow left panel (25% width)

### Option B: Replace Left Panel Entirely

```typescript
// SessionPanelLayout.tsx
<div className="session-panel-layout__left">
  <MobileChatWindow sessionId={session.id} />
</div>
```

**Pros:**
- Full control over left panel space
- Can implement mobile-style chat UI
- Simpler component hierarchy

**Cons:**
- Loses SessionInfoPanel, ConversationPanel, SmartPromptLibrary
- May need to relocate those features

### Option C: Overlay Chat Window

```typescript
// SessionPanelLayout.tsx
<div className="session-panel-layout">
  <MobileChatOverlay sessionId={session.id} />
  {/* Existing left/right panels */}
</div>
```

**Pros:**
- No layout disruption
- Chat can be positioned anywhere (bottom-right, etc.)
- Can be toggled on/off

**Cons:**
- Overlay may obscure visualization
- More complex z-index management

---

## 14. File Dependency Graph

```
SessionPanelLayout.tsx
├── imports LeftPanelStack.tsx
│   ├── imports CliPanel.tsx ← TARGET FOR REMOVAL
│   │   ├── imports CliPanel.css
│   │   ├── uses claudeCliService.ts
│   │   ├── uses WebSocketContext.tsx
│   │   └── uses xterm, @xterm/addon-fit
│   ├── imports SessionInfoPanel.tsx
│   ├── imports ConversationPanel.tsx
│   └── imports SmartPromptLibrary.tsx
├── imports RightVisualizationArea.tsx
└── imports ResizeHandle.tsx
```

### Import Statements to Update

**LeftPanelStack.tsx:**

```diff
- import { CliPanel } from './CliPanel';
+ import { ChatPanel } from './ChatPanel';  // Or whatever replaces it
```

---

## 15. Testing Considerations

### Components Using CliPanel

Search for:
```typescript
import { CliPanel }
<CliPanel
```

**Result:** Only `LeftPanelStack.tsx` uses CliPanel directly.

### Components Using claudeCliService

**Files Found:**
1. `CliPanel.tsx`
2. `ClaudeCliTerminal.tsx`
3. `useClaudeCliControl.ts`
4. `useClaudeCliSessions.ts`
5. `useDiscoveredSessions.ts`

**Action:** Ensure new chat component uses `claudeCliService` for backend communication.

### Components Using xterm

**Files Found:**
1. `CliPanel.tsx`
2. `ClaudeCliTerminal.tsx`
3. `TerminalPanel.tsx`

**Action:** If all three are removed, xterm dependencies can be removed from `package.json`.

---

## 16. Summary Checklist for Replacement

### Files to Delete
- [ ] `packages/app/src/components/SessionPanel/CliPanel.tsx`
- [ ] `packages/app/src/components/SessionPanel/CliPanel.css`

### Files to Modify
- [ ] `packages/app/src/components/SessionPanel/LeftPanelStack.tsx`
  - Remove CliPanel import
  - Remove panel #2 from JSX
  - Adjust panel numbering (1, 3→2, 4→3)
  - Update panel heights if needed
- [ ] `packages/app/src/components/SessionPanel/LeftPanelStack.css`
  - Remove `.left-panel-stack__panel--cli` styles
- [ ] `packages/app/src/components/SessionPanel/index.ts`
  - Remove CliPanel export

### New Files to Create
- [ ] Chat component (ChatPanel, MobileChatWindow, or ChatOverlay)
- [ ] Chat component CSS
- [ ] Add to `index.ts` exports

### Dependencies to Evaluate
- [ ] Check if any other components use `xterm` or `@xterm/addon-fit`
- [ ] Remove dependencies if unused

### Backend to Preserve
- [ ] Keep all `/api/claude-cli/*` routes
- [ ] Keep `claudeCliService.ts`
- [ ] Keep WebSocket event types: `claude-cli:output`, `claude-cli:exited`

### Testing to Perform
- [ ] Verify chat component receives `claude-cli:output` events
- [ ] Verify command sending via WebSocket
- [ ] Test session lifecycle (start, input, exit)
- [ ] Test collapse/expand behavior (if applicable)
- [ ] Test responsive layout on narrow screens
- [ ] Verify other panels (SessionInfo, Conversation, SmartPrompt) still function

---

## 17. Visual Layout Diagram

```
┌────────────────────────────────────────────────────────────────────┐
│                     SessionPanelLayout                              │
│  ┌──────────────────────────┬──────────────────────────────────┐  │
│  │  Left Panel (25%)        │  Right Panel (75%)               │  │
│  │  ┌────────────────────┐  │  ┌──────────────────────────┐   │  │
│  │  │ 1. SessionInfo     │  │  │                          │   │  │
│  │  │    (auto height)   │  │  │  RightVisualizationArea  │   │  │
│  │  └────────────────────┘  │  │  (Flow visualization)    │   │  │
│  │  ┌────────────────────┐  │  │                          │   │  │
│  │  │ 2. CliPanel        │  │  │                          │   │  │
│  │  │    (flex: 1) ←─────┼──┼──┼── TARGET FOR REMOVAL     │   │  │
│  │  │    ┌──────────────┐│  │  │                          │   │  │
│  │  │    │ xterm.js     ││  │  │                          │   │  │
│  │  │    │ terminal     ││  │  │                          │   │  │
│  │  │    └──────────────┘│  │  │                          │   │  │
│  │  │    ┌──────────────┐│  │  │                          │   │  │
│  │  │    │ $ [input]  ➤ ││  │  │                          │   │  │
│  │  │    └──────────────┘│  │  │                          │   │  │
│  │  └────────────────────┘  │  │                          │   │  │
│  │  ┌────────────────────┐  │  │                          │   │  │
│  │  │ 3. Conversation    │  │  │                          │   │  │
│  │  │    (200px)         │  │  │                          │   │  │
│  │  └────────────────────┘  │  │                          │   │  │
│  │  ┌────────────────────┐  │  │                          │   │  │
│  │  │ 4. SmartPrompt     │  │  │                          │   │  │
│  │  │    (160px)         │  │  │                          │   │  │
│  │  └────────────────────┘  │  └──────────────────────────┘   │  │
│  └──────────────────────────┴──────────────────────────────────┘  │
│                            ▲                                       │
│                    Resize Handle (draggable)                       │
└────────────────────────────────────────────────────────────────────┘
```

---

## 18. Code Snippets for Reference

### CliPanel Command Send Handler

```typescript
const handleSendCommand = useCallback(async () => {
  if (!commandInput.trim() || isSending) return;

  setIsSending(true);
  const command = commandInput.trim();
  const terminal = terminalInstanceRef.current;

  try {
    // Start CLI session if not running
    if (cliStateRef.current !== 'running') {
      const started = await startCliSession();
      if (!started) {
        setIsSending(false);
        return;
      }
    }

    // Echo command to terminal
    if (terminal) {
      terminal.writeln(`\x1b[1;32m$ ${command}\x1b[0m`);
    }

    // Send command via WebSocket
    send({
      type: 'input',
      sessionId: sessionId,
      payload: command,
      timestamp: new Date().toISOString(),
    } as unknown as WorkspaceEvent);

    onCommand?.(command);
    setCommandInput('');
  } catch (error) {
    if (terminal) {
      terminal.writeln(`\x1b[1;31mError: ${error.message}\x1b[0m`);
    }
  } finally {
    setIsSending(false);
  }
}, [commandInput, isSending, sessionId, onCommand, send, startCliSession]);
```

### Stream-JSON Parser Logic

```typescript
// Parse stream-json JSONL (handles partial lines across chunks)
const buffered = lineBufferRef.current + raw;
const lines = buffered.split('\n');
lineBufferRef.current = lines.pop() || '';

for (const line of lines) {
  const trimmed = line.trim();
  if (!trimmed) continue;

  try {
    const msg = JSON.parse(trimmed);

    switch (msg.type) {
      case 'system':
        // Silently ignore init messages
        break;

      case 'stream_event': {
        const ev = msg.event;
        if (!ev) break;
        if (ev.type === 'content_block_delta' && ev.delta?.type === 'text_delta' && ev.delta.text) {
          terminal.write(ev.delta.text);
        }
        if (ev.type === 'content_block_start' && ev.content_block?.type === 'tool_use') {
          terminal.writeln('');
          terminal.write(`\x1b[1;33m[Tool: ${ev.content_block.name}]\x1b[0m `);
        }
        if (ev.type === 'message_stop') {
          terminal.writeln('');
        }
        break;
      }

      case 'result':
        terminal.writeln('');
        if (msg.is_error) {
          terminal.writeln(`\x1b[1;31m[Error: ${msg.result || 'Unknown'}]\x1b[0m`);
        } else {
          const cost = msg.total_cost_usd != null ? `$${msg.total_cost_usd.toFixed(4)}` : '';
          const dur = msg.duration_ms != null ? `${(msg.duration_ms / 1000).toFixed(1)}s` : '';
          const meta = [dur, cost].filter(Boolean).join(' | ');
          terminal.writeln(`\x1b[90m[${meta}]\x1b[0m`);
        }
        break;

      default:
        break;
    }
  } catch {
    terminal.writeln(trimmed);
  }
}
```

---

## Appendix A: Full File Paths

```
D:/ActionFlowsDashboard/packages/app/src/components/SessionPanel/CliPanel.tsx
D:/ActionFlowsDashboard/packages/app/src/components/SessionPanel/CliPanel.css
D:/ActionFlowsDashboard/packages/app/src/components/SessionPanel/LeftPanelStack.tsx
D:/ActionFlowsDashboard/packages/app/src/components/SessionPanel/LeftPanelStack.css
D:/ActionFlowsDashboard/packages/app/src/components/SessionPanel/SessionPanelLayout.tsx
D:/ActionFlowsDashboard/packages/app/src/components/SessionPanel/SessionPanelLayout.css
D:/ActionFlowsDashboard/packages/app/src/components/SessionPanel/ResizeHandle.tsx
D:/ActionFlowsDashboard/packages/app/src/components/ClaudeCliTerminal/ClaudeCliTerminal.tsx
D:/ActionFlowsDashboard/packages/app/src/components/Terminal/TerminalPanel.tsx
D:/ActionFlowsDashboard/packages/app/src/services/claudeCliService.ts
D:/ActionFlowsDashboard/packages/app/src/hooks/useClaudeCliControl.ts
D:/ActionFlowsDashboard/packages/app/src/contexts/WebSocketContext.tsx
D:/ActionFlowsDashboard/packages/shared/src/events.ts
```

---

**End of Analysis**
