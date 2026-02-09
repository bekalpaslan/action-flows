# ActionFlows Dashboard — Frontend Analysis Report

**Date:** 2026-02-08
**Scope:** `packages/app/` (React 18.2 + Vite 5 + Electron 28)
**Analyzed:** Components, hooks, contexts, Electron integration, UI/UX patterns

---

## Executive Summary

The ActionFlows Dashboard frontend is a sophisticated real-time monitoring and control system for AI agent orchestration flows. Built on React 18 with Vite, it features:

- **Real-time WebSocket** event streaming with session subscriptions
- **Multiple visualization modes** (DAG, Timeline, Flow with swimlanes)
- **Multi-session orchestration** with split-pane and session window layouts
- **Integrated code editor** (Monaco) with file sync conflict resolution
- **Terminal emulation** (xterm.js) with multi-session support and combined output
- **Electron desktop** integration with tray, notifications, and native packaging
- **Claude CLI integration** for direct session management

The codebase demonstrates mature architecture with custom hooks for state management, proper context providers for WebSocket connectivity, and comprehensive UI component library.

---

## 1. Components Inventory

### 1.1 Top-Level Layout Components

| Component | Path | Purpose |
|-----------|------|---------|
| **App** | `App.tsx` | Root component; WebSocket provider wrapper |
| **AppContent** | `AppContent.tsx` | Main workspace layout orchestrator; tab navigation; session/window mode toggle |
| **SplitPaneLayout** | `SplitPaneLayout/SplitPaneLayout.tsx` | Dynamic grid layout for attached sessions (1-7+) |
| **SessionPane** | `SessionPane/SessionPane.tsx` | Single session display with DAG/Timeline toggle; controls; conversation panel |

### 1.2 Sidebar Components

| Component | Path | Purpose |
|-----------|------|---------|
| **UserSidebar** | `UserSidebar/UserSidebar.tsx` | User list with online status, session counts, expandable session trees |
| **SessionTree** | `SessionTree/SessionTree.tsx` | Nested session browser per user |
| **SessionWindowSidebar** | `SessionWindowSidebar/SessionWindowSidebar.tsx` | Follow/unfollow sessions for window mode |
| **SessionWindowGrid** | `SessionWindowGrid/SessionWindowGrid.tsx` | Responsive grid for followed sessions |
| **SessionWindowTile** | `SessionWindowGrid/SessionWindowTile.tsx` | Individual session window tile |

### 1.3 Visualization Components

| Component | Path | Purpose |
|-----------|------|---------|
| **ChainDAG** | `ChainDAG/ChainDAG.tsx` | DAG view with ReactFlow, parallel group detection, step inspector |
| **StepNode** | `ChainDAG/StepNode.tsx` | Individual step node in DAG; clickable for inspection |
| **TimelineView** | `TimelineView/TimelineView.tsx` | Horizontal timeline of chain execution |
| **FlowVisualization** | `FlowVisualization/FlowVisualization.tsx` | Swimlane layout with animated edges and step nodes |
| **AnimatedStepNode** | `FlowVisualization/AnimatedStepNode.tsx` | Animated node component (slide-in, pulse, shrink, shake) |
| **AnimatedFlowEdge** | `FlowVisualization/AnimatedFlowEdge.tsx` | Animated edge connector |
| **SwimlaneBackground** | `FlowVisualization/SwimlaneBackground.tsx` | Swimlane lane separator visual |
| **ChainBadge** | `ChainBadge/ChainBadge.tsx` | Badge indicating chain type (sequential, parallel, hybrid) |

### 1.4 Editor & Terminal Components

| Component | Path | Purpose |
|-----------|------|---------|
| **CodeEditor** | `CodeEditor/CodeEditor.tsx` | Monaco editor with multi-tab, syntax highlighting, save (Ctrl+S), conflict resolution |
| **EditorTabs** | `CodeEditor/EditorTabs.tsx` | Tab bar for open files |
| **ConflictDialog** | `CodeEditor/ConflictDialog.tsx` | Conflict resolution UI (keep/take-theirs/diff) |
| **DiffView** | `CodeEditor/DiffView.tsx` | Diff viewer component |
| **TerminalTabs** | `Terminal/TerminalTabs.tsx` | Multi-session xterm.js with tab switching; combined mode; collapsible |
| **TerminalPanel** | `Terminal/TerminalPanel.tsx` | Single-session terminal (kept for reference) |
| **ClaudeCliTerminal** | `ClaudeCliTerminal/ClaudeCliTerminal.tsx` | Interactive xterm for Claude CLI input/output |

### 1.5 Control & Interaction Components

| Component | Path | Purpose |
|-----------|------|---------|
| **ControlButtons** | `ControlButtons/ControlButtons.tsx` | Pause, Resume, Cancel buttons with confirmation |
| **ConversationPanel** | `ConversationPanel/ConversationPanel.tsx` | Chat-like UI for Claude prompts; quick response buttons |
| **StepInspector** | `StepInspector/StepInspector.tsx` | Details panel for selected step (input, output, errors) |
| **QuickActionBar** | `QuickActionBar/QuickActionBar.tsx` | Quick action buttons (customizable) |
| **NotificationManager** | `NotificationManager.tsx` | Background listener for step failures, chain completions |

### 1.6 File Management Components

| Component | Path | Purpose |
|-----------|------|---------|
| **FileExplorer** | `FileExplorer/FileExplorer.tsx` | Tree view of session working directory; show hidden toggle |
| **FileTree** | `FileExplorer/FileTree.tsx` | Recursive file tree with expand/collapse; double-click to open |
| **FileIcon** | `FileExplorer/FileIcon.tsx` | File type icon resolver |

### 1.7 Claude CLI Management Components

| Component | Path | Purpose |
|-----------|------|---------|
| **ClaudeCliStartDialog** | `ClaudeCliTerminal/ClaudeCliStartDialog.tsx` | Dialog to start new Claude CLI session |
| **ProjectSelector** | `ClaudeCliTerminal/ProjectSelector.tsx` | Project selection dropdown |
| **ProjectForm** | `ClaudeCliTerminal/ProjectForm.tsx` | Project configuration form |
| **DiscoveredSessionsList** | `ClaudeCliTerminal/DiscoveredSessionsList.tsx` | List of auto-discovered IDE lock file sessions |

### 1.8 Archive & History Components

| Component | Path | Purpose |
|-----------|------|---------|
| **SessionArchive** | `SessionArchive/SessionArchive.tsx` | Historical session browser (planned) |
| **HistoryBrowser** | `HistoryBrowser.tsx` | Session history explorer |

### 1.9 Utility Components

| Component | Path | Purpose |
|-----------|------|---------|
| **Toast** | `Toast/Toast.tsx` | Dismissible toast notifications |
| **WebSocketTest** | `WebSocketTest.tsx` | Diagnostic WebSocket tester |
| **ChainDemo** | `ChainDemo.tsx` | Demo component for testing |
| **ChainLiveMonitor** | `ChainLiveMonitor.tsx` | Real-time chain monitoring display |

**Total: 45 components** (26 main feature components, 19 utilities/supporting)

---

## 2. Hooks Inventory (25 Custom Hooks)

| Hook | Path | Purpose |
|------|------|---------|
| **useWebSocket** | `useWebSocket.ts` | Core WebSocket connector with auto-reconnect, heartbeat, subscriptions |
| **useEvents** | `useEvents.ts` | Parses and filters WebSocket events |
| **useChainState** | `useChainState.ts` | Manages chain state from events |
| **useChainEvents** | `useChainEvents.ts` | Filters events for specific chain |
| **useSessionControls** | `useSessionControls.ts` | Send pause/resume/cancel commands |
| **useSessionInput** | `useSessionInput.ts` | Submit user input to sessions |
| **useNotifications** | `useNotifications.ts` | Desktop notifications (Electron) |
| **useUsers** | `useUsers.ts` | Fetch and manage active users |
| **useUserSessions** | `useUserSessions.ts` | Get sessions for specific user |
| **useAllSessions** | `useAllSessions.ts` | Fetch all sessions from GET /api/sessions |
| **useAttachedSessions** | `useAttachedSessions.ts` | Manage pinned sessions (max 6) with localStorage persistence |
| **useSessionWindows** | `useSessionWindows.ts` | Follow/unfollow sessions; CLI bindings |
| **useFileTree** | `useFileTree.ts` | Build file tree from API; lazy loading |
| **useEditorFiles** | `useEditorFiles.ts` | Read/write files via API |
| **useFileSyncManager** | `useFileSyncManager.ts` | Detect file conflicts; sync with filesystem |
| **useTerminalEvents** | `useTerminalEvents.ts` | Subscribe to terminal output events |
| **useClaudeCliControl** | `useClaudeCliControl.ts` | Send input to Claude CLI; stop session |
| **useClaudeCliSessions** | `useClaudeCliSessions.ts` | Discover IDE lock file sessions |
| **useDiscoveredSessions** | `useDiscoveredSessions.ts` | Poll discovered sessions |
| **useProjects** | `useProjects.ts` | Project registry management |
| **useSessionArchive** | `useSessionArchive.ts` | Historical session queries |
| **useFlowAnimations** | `useFlowAnimations.ts` | Animation state for flow visualization |
| **useStreamJsonEnrichment** | `useStreamJsonEnrichment.ts` | Parse streamed JSON responses |
| **useKeyboardShortcuts** | `useKeyboardShortcuts.ts` | Global keyboard event binding |

---

## 3. Contexts & Providers

### 3.1 WebSocketContext
**File:** `contexts/WebSocketContext.tsx`

Provides centralized WebSocket connectivity:
- **Status:** `'connecting' | 'connected' | 'disconnected' | 'error'`
- **Methods:**
  - `send(message: WorkspaceEvent)` — Send custom event
  - `subscribe(sessionId: SessionId)` — Subscribe to session
  - `unsubscribe(sessionId: SessionId)` — Unsubscribe from session
  - `onEvent(callback)` — Register event listener (returns unsubscribe function)
- **Features:**
  - Multi-callback support via Set
  - Auto-reconnect with exponential backoff (3s → 30s max)
  - Heartbeat timeout detection (30s)
  - Type-safe event parsing with validation

**Key Pattern:** Event callbacks stored in Set for multi-subscriber support; unregister function provided to cleanup.

---

## 4. UI Screens & User Interactions

### 4.1 Main Workspace Screen (`AppContent.tsx`)

**Header Navigation:**
- Title: "ActionFlows Workspace"
- Tabs: Sessions, Dashboard, Flows, Actions, Logs, Settings (tabs 2-6 not yet implemented)
- Mode Toggle: "Classic Mode" ↔ "Session Window Mode"
- New Session Button: Start Claude CLI session
- WebSocket Status Indicator: Connected/Disconnected/Error/Connecting

**Body Layout (Classic Mode):**
```
┌─ Left Sidebar ──────┐ ┌─ Main Content ────────────────────┐ ┌─ Code Editor ─┐
│ Users               │ │ SplitPaneLayout                   │ │ Tabs          │
│ ├─ User1 (Online)   │ │ ├─ SessionPane 1 (50% width)      │ │ ├─ file.ts    │
│ │  └─ Session       │ │ │  ├─ Header (controls, status)   │ │ │ (editing)   │
│ ├─ User2 (Online)   │ │ │  ├─ DAG/Timeline View           │ │ │               │
│ │  └─ Session       │ │ │  └─ Conversation Panel          │ │ └─ Editor Area │
│ │                   │ │ ├─ SessionPane 2 (50% width)      │ │               │
│ File Explorer       │ │ └─ ...                            │ │               │
│ ├─ src/             │ │                                   │ │               │
│ │ ├─ main.ts        │ │                                   │ │               │
│ │ └─ ...            │ │                                   │ │               │
│                     │ │                                   │ │               │
└─────────────────────┘ └───────────────────────────────────┘ └───────────────┘
├─────────────────────────────────────────────────────────────────────────────┤
│ Terminal Tabs (Collapsible)                              [Tab1] [Tab2] [+]   │
│ ├─ Combined Output Enabled                                                   │
│ └─ Agent output, stderr colored red, step attribution [#3 action]           │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Interactions:**
- Click user → highlight sessions for that user
- Double-click file → open in editor
- Click session in sidebar → attach/follow
- Click session tab → detach
- Select step in DAG → open StepInspector

### 4.2 Session Window Mode

Alternative layout:
```
┌─ Sidebar ────────┐ ┌─ Grid of Followed Sessions ─────────────────────────┐
│ All Sessions     │ │ [Session Tile] [Session Tile]                       │
│ ├─ Session A     │ │ [Session Tile] [Session Tile]                       │
│ ├─ Session B ✓   │ │ ...                                                  │
│ └─ Session C     │ │ (Responsive: 1 wide, 2x2, 2x3, 3-column grid)       │
│                  │ │                                                      │
│ [Follow] [×]     │ │ Each tile shows:                                     │
│                  │ │ - Session header                                    │
│                  │ │ - Flow visualization with swimlane layout           │
│                  │ │ - Conversation panel                                │
│                  │ │ - Close button                                      │
└──────────────────┘ └──────────────────────────────────────────────────────┘
```

### 4.3 Session Pane Detail View

**Header:**
- User avatar + name + session ID truncated (8 chars)
- Status badge (Idle/Active/Complete/Failed)
- Control buttons (Pause/Resume, Cancel)
- View toggle (DAG ↔ Timeline)
- Detach/Close (×) button

**Content Area (with active chain):**
```
┌─ Visualization (60%) ──────────────┐ ┌─ Conversation Panel (40%) ────┐
│ DAG or Timeline View               │ │ Claude's last prompt           │
│ ├─ Chain title                     │ │ ├─ Quick response buttons      │
│ ├─ Stats (5 steps, 3 completed)    │ │ ├─ Message history            │
│ ├─ Nodes/Timeline                  │ │ ├─ Input field                │
│ └─ Minimap                         │ │ └─ Send button                │
└────────────────────────────────────┘ └───────────────────────────────┘
```

**Content Area (no active chain):**
- Session details grid: Status, Directory, Host, Platform, Started, Duration, Type
- Placeholder: "Waiting for orchestrator to compile a chain..."

**Footer:**
- Chain title, step count (e.g., "5 steps")

### 4.4 DAG Visualization Screen

**Features:**
- **Nodes:** Step bubbles with color-coded status (pending/in-progress/completed/failed/skipped)
- **Edges:** Directed arrows showing dependencies; animated when active
- **Controls:** Pan, zoom (0.1x–2x), fit-to-view, minimap
- **Interaction:** Click step → highlights and opens StepInspector
- **Stats header:** Total steps, completed count, failed count, in-progress count, parallel group count
- **Legend:** Color key for statuses
- **Parallel grouping:** Visual indication of concurrent steps
- **Badge:** Chain type (Sequential, Parallel, Hybrid)

### 4.5 Timeline View Screen

Alternative to DAG:
- Horizontal timeline of steps left-to-right
- Each step as block with status color
- Duration labels
- Click to inspect
- Better for long sequential chains

### 4.6 Flow Visualization with Swimlanes

Advanced view for session windows:
- **Swimlanes:** Grouped by step category/assignee
- **Animated nodes:** Entrance animation (slide-in), execution (pulse), completion (shrink), error (shake)
- **Animated edges:** Golden arrows for active data flow
- **Background:** Swimlane separators for visual grouping

### 4.7 Code Editor Panel (Right Sidebar)

**Features:**
- **Multi-tab:** Multiple files open simultaneously
- **Languages:** TypeScript, Python, JSON, YAML, SQL, Go, Rust, Java, C++, C#, Ruby, PHP, Markdown, HTML, CSS, Shell
- **Syntax highlighting:** via Monaco editor
- **Keyboard shortcuts:**
  - `Ctrl+S` — Save file
  - `Ctrl+G` — Go to line
  - `Ctrl+F` — Find
  - `Shift+Enter` — New line in input
- **File sync:**
  - Detects external modifications
  - Conflict resolution dialog (keep mine / take theirs / show diff)
  - Toast notifications for conflicts
- **Status:** Dirty flag on unsaved changes
- **Line numbers:** On; word wrap enabled
- **Theme:** Dark mode (`vs-dark`)
- **Minimap:** Enabled

**Conflict Resolution UI:**
```
┌────────────────────────────────────┐
│ File Conflict Detected             │
│ "path/to/file.ts"                  │
├────────────────────────────────────┤
│ Your version: 152 lines            │
│ External version: 156 lines        │
├────────────────────────────────────┤
│ [Show Diff] [Keep Mine] [Take...]  │
└────────────────────────────────────┘
```

### 4.8 Terminal Panel (Bottom)

**Features:**
- **Multi-tab:** One tab per attached session
- **Combined mode:** Interleaved output from all sessions with session ID prefix
- **Resizable:** Drag top border to adjust height (100–600px)
- **Collapsible:** Toggle collapsed state
- **Output formatting:**
  - Step attribution: `[#3 action]` in color (yellow for stdout, red for stderr)
  - Session ID prefix in combined mode: `[abc12345]`
- **Search:** Ctrl+Shift+F (xterm search addon)
- **Clear:** Clear terminal output
- **Export:** Download terminal log as text file

**Interactions:**
- Click tab → switch sessions (not in combined mode)
- Toggle combined mode → merge all session outputs chronologically
- Drag resize handle → adjust height
- Click collapse button → minimize to 32px header

### 4.9 File Explorer Sidebar (Left)

**Features:**
- **Tree view:** Nested directories with expand/collapse
- **File icons:** Inferred from extension (📄 generic, 🐍 Python, ⚙ config, etc.)
- **Lazy loading:** Directories load on expand
- **Hidden files:** Toggle show/hide with eye icon
- **Refresh:** Refresh entire tree
- **Interaction:**
  - Single-click → select/highlight
  - Double-click → open in editor
  - Right-click → (context menu not shown but implied)
- **Collapsible:** Toggle with arrow button

### 4.10 User Sidebar (Left)

**Features:**
- **User list:** Sorted by online status, then session count (descending)
- **User avatar:** 2-letter initials in circle
- **Status indicator:** Green dot if online
- **Session count badge:** Number badge
- **"You" label:** Highlights current user
- **Session tree:** Expandable tree of user's sessions when expanded
- **Attach/detach:** Buttons per session
- **Collapsible:** Toggle with arrow button
- **Footer:** Total user count, online count

---

## 5. Key Features & Workflows

### 5.1 Real-Time Session Monitoring

**Data Flow:**
1. WebSocket connects to `ws://localhost:3001/ws`
2. Components subscribe to session IDs
3. Server sends `session:started`, `session:updated`, `chain:started`, `step:started`, `step:completed`, etc.
4. `useWebSocket` dispatches to all registered callbacks
5. `useChainState`, `useChainEvents` filter for relevant events
6. UI re-renders in near real-time

**Subscription Model:**
```typescript
useEffect(() => {
  wsContext.subscribe(sessionId);
  return () => wsContext.unsubscribe(sessionId);
}, [sessionId]);
```

### 5.2 Multi-Session Orchestration

**Features:**
- Pin up to 6 sessions for focused monitoring
- Auto-layout: 1 → full width, 2 → 50/50, 3 → 2:1 grid, 4+ → 2x2+ grid
- Responsive resizing
- Independent pause/resume/cancel per session
- Conversation context per session

**State Management:**
```
useAllSessions() → [Session, Session, ...]
  ↓
useAttachedSessions(maxAttached: 6) → [attached Sessions]
  ↓
SplitPaneLayout renders SessionPane for each
```

### 5.3 DAG Visualization & Parallel Detection

**Algorithm:**
1. Build dependency graph from `step.dependencies` array
2. Detect parallel groups: steps with same dependencies can run concurrently
3. Calculate node positions using hierarchical layout algorithm
4. Render in ReactFlow with animated edges
5. Click step → open inspector with input/output/errors/logs

**Step Status Colors:**
- Pending: #ccc (gray)
- In Progress: #fbc02d (gold)
- Completed: #4caf50 (green)
- Failed: #f44336 (red)
- Skipped: #999 (dark gray)

### 5.4 Code Editing with Conflict Resolution

**Workflow:**
1. User opens file from file explorer
2. Monaco editor renders with syntax highlighting
3. WebSocket emits `file:modified` event (external change)
4. `useFileSyncManager` detects conflict
5. ConflictDialog prompts user: keep mine / take theirs / diff
6. User resolution updates editor state
7. Ctrl+S saves file via API

**C1 Fix Note:** File sync events listened to and conflict detected via WebSocket event interception.

### 5.5 Terminal Output Attribution

**Feature:** Step attribution in terminal output to know which step produced which output.

**Format:**
```
[#3 analyze] Starting analysis...
[#3 analyze] Found 42 issues
[#4 summarize] Summarizing results...
```

**In Combined Mode:**
```
[abc12345] [#3 analyze] Starting analysis...
[def67890] [#2 compile] Compiling code...
```

### 5.6 Claude CLI Integration

**Workflow:**
1. "New Session" button → `ClaudeCliStartDialog`
2. Select project (or auto-discover from IDE lock file)
3. `claudeCliService.startSession(sessionId, cwd)` spawns CLI process
4. Session injected into `useAllSessions` state
5. Auto-attach to `useAttachedSessions`
6. Render `ClaudeCliTerminal` with interactive xterm
7. User types → sent to Claude via `useClaudeCliControl.sendInput()`
8. Claude output streamed back → `claude-cli:output` event
9. Terminal writes output; session ends → `claude-cli:exited` event

**Key:** CLI binding stored in `useSessionWindows.cliBindings` Map.

### 5.7 Electron Integration

**Features:**
- **Window management:** Minimize to tray instead of taskbar
- **On close:** Hide window (keep app running); on app quit: close for real
- **Tray menu:** Show/Hide app, Quit
- **Notifications:** Desktop notifications via IPC
- **Preload:** Secure bridge with whitelisted IPC channels
  - Invoke: `ping`, `show-notification`
  - Send: `close-app`
  - On: `update-available`

**Main Process (`electron/main.ts`):**
```typescript
createWindow() → BrowserWindow
  - Load http://localhost:5173 (dev) or dist/index.html (prod)
  - Preload security boundary
  - Minimize → hide (not taskbar)
  - Close → hide (not quit)

createTray() → Tray
  - Context menu: Show / Quit
  - Click toggle: Show/hide window
```

**Preload (`electron/preload.ts`):**
```typescript
window.electron.ipcRenderer.invoke('show-notification', {
  title, body, urgency
})
```

**Usage in React:**
```typescript
const showDesktopNotification = async (title: string, body: string) => {
  if (window.electron?.ipcRenderer) {
    await window.electron.ipcRenderer.invoke('show-notification', {
      title, body, urgency: 'normal'
    })
  }
}
```

---

## 6. Data Flow & Architecture Patterns

### 6.1 WebSocket Event Model

**Event Types (from backend):**
- `session:started` — New session created
- `session:updated` — Session state changed
- `session:ended` — Session completed or failed
- `chain:started` — Chain execution begins
- `chain:completed` — Chain finished
- `chain:failed` — Chain error
- `step:started` — Step began
- `step:completed` — Step finished
- `step:failed` — Step error
- `terminal:output` — Terminal line with optional step attribution
- `file:modified` — File changed externally
- `file:deleted` — File removed
- `claude-cli:output` — Claude CLI stdout/stderr
- `claude-cli:exited` — Claude CLI session ended

**Pattern:**
```typescript
interface WorkspaceEvent {
  type: 'session:started' | 'step:completed' | ...;
  sessionId: SessionId;
  timestamp: string;
  data: {
    [key: string]: any;
  };
}
```

### 6.2 Component Composition & Prop Drilling

**Pattern:** Props flow down, callbacks flow up.

```
AppContent
├─ useAllSessions() → allSessions
├─ useAttachedSessions(allSessions) → attachedSessionIds, attachedSessions
├─ SplitPaneLayout (sessions, onDetach, onClose)
│  └─ SessionPane[] (session, onDetach, onClose)
│     ├─ ChainDAG (chain, onStepSelected)
│     ├─ ConversationPanel (session, onSubmitInput)
│     └─ StepInspector (step, onClose)
└─ TerminalTabs (sessionIds, onHeightChange, ...)
```

**Optimization:** `useCallback` prevents child re-renders on parent updates; memoized hooks cache expensive computations.

### 6.3 Local Storage Persistence

**useAttachedSessions:**
- Persists attached session IDs to localStorage under key `attached-sessions`
- On mount, hydrates from storage
- On change, updates storage
- Max 6 sessions; auto-removes oldest when limit exceeded

### 6.4 Error Handling & Fallbacks

**Patterns:**
- Try/catch in async hooks with error state setters
- Toast notifications for user-facing errors
- Console logs for developer debugging (prefixed with `[HookName]`)
- Empty states in UI (e.g., "No sessions attached")
- Disabled buttons with title hints when unavailable

---

## 7. Improvement Areas & Issues

### 7.1 Incomplete Screens

**Issue:** 5 of 6 tabs in navigation (Dashboard, Flows, Actions, Logs, Settings) are stub placeholders.

**Evidence:** `AppContent.tsx` line 237–243:
```tsx
<main className="app-main">
  <div className="placeholder-tab">
    <h2>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h2>
    <p>This section is not yet implemented.</p>
  </div>
</main>
```

**Recommendation:** Prioritize and implement dashboard/analytics views (chain history, execution metrics, performance graphs).

### 7.2 File Sync Conflict Detection

**Issue:** `useFileSyncManager` provides conflict detection, but **diff viewer is simplified** (shows only line counts in alert).

**Evidence:** `CodeEditor.tsx` line 210–224:
```typescript
alert(`Diff View (simplified):\n\n...Full diff viewer coming soon...`)
```

**Recommendation:** Integrate a proper diff library (e.g., `diff-match-patch` or `monaco.editor.createDiffEditor`).

### 7.3 Hardcoded WebSocket URL

**Issue:** WebSocket URL hardcoded in `App.tsx`: `ws://localhost:3001/ws`

**Evidence:** `App.tsx` line 7:
```tsx
<WebSocketProvider url="ws://localhost:3001/ws">
```

**Recommendation:** Use environment variable `VITE_WS_URL` with fallback to derived from `window.location.origin`.

### 7.4 Missing Session Control Feedback

**Issue:** No visual feedback when pause/resume/cancel commands are submitted. User doesn't know if command reached server.

**Evidence:** `ControlButtons.tsx` shows "Pausing..." state locally but doesn't wait for server confirmation.

**Recommendation:** Subscribe to `session:updated` event and reflect confirmed state back to UI.

### 7.5 Stale Closures in Terminal Output

**Issue:** `writeOutput` callback in `TerminalTabs` uses ref (`tabsRef.current`) to avoid stale closure, but pattern is fragile.

**Evidence:** Line 268:
```typescript
}, []); // No dependencies - uses refs for stable callback
```

**Recommendation:** Consider using a reducer pattern or ref-based state machine for terminal management.

### 7.6 Terminal Combined Mode Implementation Gap

**Issue:** Combined mode is implemented but there's no ordering guarantee if events arrive out of sequence or with clock skew.

**Recommendation:** Use server-generated timestamp as canonical order; buffer events briefly before rendering to ensure chronological display.

### 7.7 File Tree Lazy Loading Incomplete

**Issue:** `useFileTree` API fetches entire tree in one shot; "lazy loading" comment suggests incremental loading not yet implemented.

**Evidence:** `useFileTree.ts` — fetches `GET /api/sessions/{id}/files` which likely returns full tree.

**Recommendation:** Implement backend API to fetch directory contents on-demand: `GET /api/sessions/{id}/files/{path}`.

### 7.8 Keyboard Shortcut Conflicts

**Issue:** `useKeyboardShortcuts` exists but unclear what it binds or if it conflicts with browser/editor shortcuts.

**Evidence:** Hook defined but usage not found in main AppContent flow.

**Recommendation:** Document all shortcuts (Ctrl+S for editor, etc.) and test for conflicts.

### 7.9 Performance: No Code Splitting for Large Components

**Issue:** Monaco editor and ReactFlow bundled into main chunk; could slow initial load.

**Evidence:** `vite.config.ts` has manual chunk for Monaco but not for ReactFlow or other heavy libs.

**Recommendation:** Add to rollupOptions.output.manualChunks: `{ 'reactflow': ['reactflow', '@reactflow/core'] }`.

### 7.10 Missing Accessibility Features

**Issue:** Some components lack ARIA labels or keyboard navigation support.

**Examples:**
- SessionPane controls: buttons have titles but some lack aria-label
- Tab navigation: not keyboard accessible (no focus trap)
- Modal dialogs: no focus management (should trap focus)

**Recommendation:** Add aria-label to all interactive elements; implement FocusTrap for dialogs; support Tab/Shift+Tab navigation.

### 7.11 "Doesn't Make Sense" Observations

**Observations that deserve clarification:**

1. **useSessionWindows vs useSessionInput:** Two separate hooks managing sessions. Why not unified? Answer likely: Windows are for "following" UI; Input for "current session" operations. But could be clearer.

2. **Multiple session state hooks:** `useChainState`, `useChainEvents`, `useSessionInput`, `useSessionControls` — proliferation of similar hooks. Could be consolidated into a single `useSessionState` facade.

3. **File explorer opens files but no double-click handler visible in FileExplorer:** Files clicked but where's the callback? Answer: `onFileOpen={handleFileOpen}` → `setFileToOpen` → `CodeEditor` watches `fileToOpen` prop. Indirect but works.

4. **TerminalPanel vs TerminalTabs:** Both exist. TerminalPanel says "kept for reference" but takes up code. Should be deleted or documented as legacy.

5. **Electron tray always shown:** App starts with tray regardless of desktop environment. On Linux without system tray, this might be problematic. Should detect tray support.

6. **QuickActionBar imported but not used in AppContent:** Component exists and is exported but not rendered. Is it a planned feature?

7. **SessionArchive and HistoryBrowser:** Both seem to overlap in purpose. One is for historical sessions, one for history—unclear distinction.

---

## 8. Technical Debt & Architecture Concerns

### 8.1 Context Sprawl

**Issue:** Single `WebSocketContext` but many hooks creating their own state (users, sessions, files). Could lead to desync.

**Solution:** Consider a unified `DataStore` context or Redux-like state management for complex apps.

### 8.2 WebSocket Subscription Lifecycle

**Issue:** No automatic cleanup if session is detached while event listener is still registered.

**Pattern:**
```typescript
useEffect(() => {
  wsContext.subscribe(sessionId);
  return () => wsContext.unsubscribe(sessionId);
}, [sessionId]); // If sessionId changes, unsubscribe from old, subscribe to new
```

**Risk:** If component unmounts before effect cleanup, orphaned subscriptions could accumulate.

### 8.3 No Retry Logic for Failed API Calls

**Issue:** File operations (read/write) fail silently if API is down.

**Evidence:** `useEditorFiles`, `useFileTree` don't implement retry with exponential backoff.

**Recommendation:** Wrap API calls in retry utility:
```typescript
async function retryAsync<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === maxRetries - 1) throw err;
      await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i)));
    }
  }
}
```

### 8.4 Memory Leaks in Terminal

**Issue:** `TerminalTabs` creates XTerm instances per session. If sessions are created/destroyed rapidly, old terminals might not be GC'd if not disposed.

**Evidence:** Cleanup in useEffect, but useCallback with `[]` deps is fragile.

### 8.5 No Suspense Boundaries

**Issue:** Async data (file tree, sessions) triggers loading states but no `Suspense` boundaries for graceful fallback.

### 8.6 Type Safety Gaps

**Issue:** Some event payloads are `any` type, especially in `useEvents`, `useChainState`.

**Recommendation:** Strengthen shared type definitions in `@afw/shared` and enforce strict payload typing.

---

## 9. UI/UX Observations

### 9.1 Strong Points

- **Visual Hierarchy:** Clear separation of concerns (sidebar, main, editor, terminal)
- **Responsive Layout:** Grid adapts to session count intelligently
- **Real-time Feedback:** DAG updates immediately as steps progress
- **Multi-modal:** DAG, Timeline, Flow views offer different perspectives
- **Dark Theme:** Professional appearance; reduces eye strain
- **Collapsible Panels:** User can customize layout for focus

### 9.2 Pain Points

- **No Search/Filter:** Can't search sessions or steps by name/ID
- **No Session Grouping:** All sessions flat list; no folders/tags
- **Limited Sorting:** Only sorts by online status and count; no date, name, status
- **No Session Summary:** At a glance, what happened in this session? Need to open each chain
- **Terminal Output Scrollback:** No pagination or limits; large sessions could freeze UI
- **Monaco Theme Locked:** Editor always dark; no light mode option
- **No Undo/Redo in File Editor:** Changes lost if accidental
- **No Breadcrumb Navigation:** In file tree, hard to see path context when deep

### 9.3 Interaction Improvements

- Add **quick filters:** Running / Completed / Failed sessions
- Add **session compare:** View two sessions side-by-side for diff analysis
- Add **step replay:** Run a single step in isolation for debugging
- Add **keyboard shortcuts panel:** Accessible via Ctrl+Shift+?
- Add **zoom levels:** For readability (font size, compact mode)
- Add **session preview:** Hover tooltip showing mini summary

---

## 10. Component Dependency Map

```
App
└─ WebSocketProvider (context)
   └─ AppContent
      ├─ useWebSocketContext
      ├─ useUsers
      ├─ useAllSessions
      ├─ useAttachedSessions
      ├─ useSessionWindows
      │
      ├─ UserSidebar
      │  ├─ useUserSessions (per user)
      │  └─ SessionTree
      │     └─ onClick → onSessionAttach/Detach
      │
      ├─ FileExplorer
      │  └─ useFileTree
      │     └─ FileTree (recursive)
      │
      ├─ SplitPaneLayout (or SessionWindowGrid)
      │  └─ SessionPane[] (dynamic count)
      │     ├─ ChainDAG (or TimelineView)
      │     │  ├─ StepNode[]
      │     │  └─ StepInspector
      │     ├─ ControlButtons
      │     │  └─ useSessionControls
      │     └─ ConversationPanel
      │        └─ useSessionInput
      │
      ├─ CodeEditor
      │  ├─ useEditorFiles
      │  ├─ useFileSyncManager
      │  ├─ EditorTabs
      │  ├─ ConflictDialog
      │  └─ ToastContainer
      │
      └─ TerminalTabs
         ├─ useTerminalEvents
         └─ XTerm[] (one per session)

NotificationManager (background)
└─ useNotifications
   └─ Desktop notifications via Electron IPC
```

---

## 11. File Statistics

| Metric | Count |
|--------|-------|
| **Components** | 45 |
| **Custom Hooks** | 25 |
| **Contexts** | 1 (WebSocketContext) |
| **Utilities** | 8+ (chainTypeDetection, streamJsonParser, swimlaneLayout, etc.) |
| **Total .tsx/.ts files** | 120+ |
| **Dependencies** | ~15 major (React, ReactFlow, Monaco, xterm, Electron, etc.) |

---

## 12. Environment & Configuration

| Item | Value |
|------|-------|
| **Dev Server Port** | 5173 (Vite) |
| **Backend API URL** | http://localhost:3001 (configurable) |
| **WebSocket URL** | ws://localhost:3001/ws (hardcoded) |
| **Backend Proxy** | /api → 3001, /ws → 3001 (in dev) |
| **Build Output** | dist/ (React), dist-electron/ (Electron main/preload) |
| **Electron Main Entry** | electron/main.ts |
| **Preload Entry** | electron/preload.ts |
| **App Name** | ActionFlows Workspace |
| **Default Window Size** | 1200x800 (min 800x600) |

---

## 13. Summary of Missing Features

### 13.1 Planned but Not Implemented

1. **Dashboard Tab** — Session analytics, execution graphs
2. **Flows Tab** — Flow templates, saved workflows
3. **Actions Tab** — Quick action definitions
4. **Logs Tab** — Full session/chain/step logs browser
5. **Settings Tab** — User preferences, theme, keyboard shortcuts
6. **Diff Viewer** — Proper file diff in code editor
7. **Session Archive** — Historical session search/replay
8. **Session Compare** — Side-by-side diff of two sessions
9. **Breadcrumb Navigation** — File path context
10. **Full-text Search** — Search sessions, chains, steps, logs

### 13.2 Not Evident But Could Be Useful

1. **Export/Report Generation** — Session summary as PDF
2. **Remote Access** — Share session link with team
3. **Collaboration** — Multi-user real-time session view
4. **Alerts/Webhooks** — Custom notifications on failure
5. **Metrics Dashboard** — Charts: success rate, avg duration, top errors
6. **Session Replay** — Step-by-step re-execution with breakpoints
7. **Code Coverage** — Integration with coverage tools
8. **Integration Tests** — Run chain against test data

---

## 14. Recommended Next Steps

### 14.1 Priority: Critical

1. **Implement missing tabs** (Dashboard, Settings)
2. **Fix WebSocket URL hardcoding** → Environment variable
3. **Add proper diff viewer** for conflict resolution
4. **Implement retry logic** for flaky API calls

### 14.2 Priority: High

5. **Add session filtering** (Running / Complete / Failed)
6. **Implement file tree lazy loading** on demand
7. **Add keyboard shortcut hints** throughout UI
8. **Consolidate session state hooks** into unified API

### 14.3 Priority: Medium

9. **Improve terminal output buffering** for performance
10. **Add accessibility labels** (ARIA) to all components
11. **Implement code splitting** for large libraries
12. **Add dark/light theme toggle**

---

## Conclusion

The ActionFlows Dashboard frontend is a mature, feature-rich application with well-organized component structure, custom hooks for reusability, and real-time data synchronization. The architecture leverages React best practices, context providers, and Electron for desktop deployment.

**Key strengths:**
- Modular component design
- Real-time WebSocket streaming
- Multi-session orchestration with flexible layouts
- Integrated code editing and terminal
- Electron desktop integration with tray

**Key weaknesses:**
- Incomplete feature implementation (5 tabs)
- Hardcoded URLs
- Simplified diff viewer
- No full-text search or advanced filtering
- Performance concerns with large terminal outputs

**Overall Assessment:** Production-ready for core session monitoring and orchestration. Needs completion of planned features and performance optimization for enterprise scale.

---

**Report Generated:** 2026-02-08
**Analysis Agent:** Frontend Functionality Analyzer
**Scope Verified:** packages/app/ (React + Electron)
