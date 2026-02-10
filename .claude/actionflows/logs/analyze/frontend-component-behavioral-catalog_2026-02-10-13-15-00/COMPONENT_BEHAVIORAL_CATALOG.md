# ActionFlows Dashboard — Frontend Component Behavioral Catalog

**Generated:** 2026-02-10
**Scope:** `packages/app/src/components/`, `packages/app/src/contexts/`, `packages/app/src/hooks/`
**Purpose:** Full inventory of React components with behavioral contracts for health checks and E2E testing

---

## Executive Summary

**Total Inventory:**
- **110 Component files** (.tsx in components/)
- **38 Custom hooks** (.ts in hooks/)
- **7 Context providers** (.tsx/.ts in contexts/)

**Architecture Pattern:** Context-based state + WebSocket real-time updates + React Flow visualization

**Key Communication Channels:**
- WebSocket events via `WebSocketContext`
- Discuss system via `DiscussContext`
- Workbench navigation via `WorkbenchContext`
- Theme management via `ThemeContext`
- Toast notifications via `ToastContext`
- Vim navigation via `VimNavigationContext`

---

## 1. Context Providers (Global State Management)

### 1.1 WebSocketContext
**File:** `packages/app/src/contexts/WebSocketContext.tsx`

**State Managed:**
- Connection status: `connecting | connected | disconnected | error | polling`
- WebSocket connection to `ws://localhost:3001/ws`
- Event subscription registry (sessionId-based)
- Error state

**Lifecycle:**
- Mount: Establishes WebSocket connection
- Provides: `send()`, `subscribe()`, `unsubscribe()`, `onEvent()`
- Cleanup: Closes connection, stops polling fallback
- Reconnect: Exponential backoff (3s base, max 30s)
- Heartbeat: 30s ping, 30s timeout
- Fallback: HTTP polling after 3 consecutive failures

**Side Effects:**
- WebSocket connection to backend
- Automatic reconnection with backoff
- HTTP polling fallback (5s interval)
- Heartbeat ping every 25s

**Consumers:** All components needing real-time updates (SessionPanel, FlowVisualization, SessionSidebar, etc.)

---

### 1.2 WorkbenchContext
**File:** `packages/app/src/contexts/WorkbenchContext.tsx`

**State Managed:**
- Active workbench ID (9 tabs: work, maintenance, explore, review, archive, settings, pm, harmony, canvas, editor, intel, respect)
- Workbench configurations (DEFAULT_WORKBENCH_CONFIGS from shared)
- Notification counts per workbench (Map<WorkbenchId, number>)
- Previous workbench (for back navigation)
- Routing filter (null | WorkbenchId) for session filtering

**Lifecycle:**
- Mount: Loads active workbench from localStorage (`afw-active-workbench`)
- Provides: `setActiveWorkbench()`, `addNotification()`, `clearNotifications()`, `goBack()`, `filterSessionsByContext()`
- Cleanup: None (persists to localStorage)

**Side Effects:**
- localStorage persistence on workbench change

**Consumers:** TopBar, WorkbenchLayout, SessionSidebar

---

### 1.3 ThemeContext
**File:** `packages/app/src/contexts/ThemeContext.tsx`

**State Managed:**
- Theme setting: `dark | light | system`
- Resolved theme: `dark | light`

**Lifecycle:**
- Mount: Loads from localStorage (`actionflows:theme`), applies to `document.documentElement`
- Provides: `setTheme()`, `toggleTheme()`, `isDark`, `isLight`, `isSystem`
- Cleanup: Removes media query listeners

**Side Effects:**
- Sets `data-theme` attribute on `<html>`
- Listens to `(prefers-color-scheme: dark)` media query
- localStorage persistence

**Consumers:** ThemeToggle, global CSS (`:root[data-theme="dark"]`)

---

### 1.4 ToastContext
**File:** `packages/app/src/contexts/ToastContext.tsx`

**State Managed:**
- Active toast messages (id, message, type, duration)

**Lifecycle:**
- Mount: None
- Provides: `showToast(message, type, duration)`
- Cleanup: Auto-dismisses toasts after duration (default 3s)

**Side Effects:**
- Renders ToastContainer with active toasts
- Auto-dismiss timers

**Consumers:** Any component needing notifications (SessionSidebar, FileExplorer, etc.)

---

### 1.5 VimNavigationContext
**File:** `packages/app/src/contexts/VimNavigationContext.tsx`

**State Managed:**
- Vim mode: `normal | insert | visual | command`
- Enabled state (localStorage: `actionflows:vim:enabled`)
- Current target (focused element ID)
- Target registry (all navigable element IDs)

**Lifecycle:**
- Mount: Loads enabled state from localStorage
- Provides: `setMode()`, `registerTarget()`, `unregisterTarget()`, `navigateNext()`, `navigatePrev()`, `navigateFirst()`, `navigateLast()`
- Cleanup: None

**Side Effects:**
- localStorage persistence for enabled state

**Consumers:** VimModeIndicator, components with Vim navigation

---

### 1.6 DiscussContext
**File:** `packages/app/src/contexts/DiscussContext.tsx`

**State Managed:**
- Chat input setter function (ref-based, not state)

**Lifecycle:**
- Mount: None
- Provides: `registerChatInput()`, `unregisterChatInput()`, `prefillChatInput()`
- Cleanup: None

**Side Effects:**
- None (pure coordination layer)

**Pattern:** Ref-based registration to avoid re-renders

**Consumers:**
- **Provider:** ChatPanel (registers input setter)
- **Consumers:** All 41+ components with DiscussButton

---

## 2. Core Layout Components

### 2.1 AppContent
**File:** `packages/app/src/components/AppContent.tsx`

**Render Tree:** Root → AppContent → WorkbenchLayout

**Props:** None

**State:** None

**Lifecycle:** Mount only (renders WorkbenchLayout)

**Interactions:** None (pass-through)

---

### 2.2 WorkbenchLayout
**File:** `packages/app/src/components/Workbench/WorkbenchLayout.tsx`

**Render Tree:**
```
WorkbenchLayout
├── TopBar
├── DashboardSidebar (always visible)
├── SessionSidebar (conditional: canWorkbenchHaveSessions(activeWorkbench))
└── <workbench-specific content>
    ├── WorkWorkbench
    ├── MaintenanceWorkbench
    ├── ExploreWorkbench
    ├── ReviewWorkbench
    ├── ArchiveWorkbench
    ├── SettingsWorkbench
    ├── PMWorkbench
    ├── HarmonyWorkbench
    ├── CanvasWorkbench
    ├── EditorWorkbench
    ├── IntelWorkbench
    └── RespectWorkbench
```

**Props:** `children?: ReactNode`

**State:**
- `attachedSessions: Session[]` — Sessions attached to current workbench
- `activeSessionId: SessionId | undefined` — Currently active session
- `transitionClass: string` — CSS class for workbench transitions
- `demoTasks: PMTask[]` — Demo data for PM workbench
- `demoDocs: DocLink[]` — Demo data for PM workbench
- `demoMilestones: Milestone[]` — Demo data for PM workbench

**Context Consumed:** `useWorkbenchContext()` for active workbench state

**Lifecycle:**
- Mount: Initializes demo data, loads active workbench
- Effect (activeWorkbench): Triggers transition animation (180ms)
- Effect (transitionTimeout): Cleanup on unmount

**Props Down:**
- Passes `onAttachSession`, `onSessionClose`, `onSessionDetach`, `onSessionInput` to workbenches
- Passes `activeSessionId` to SessionSidebar and workbenches
- Passes `archivedSessions` to ArchiveWorkbench

**Callbacks Up:**
- `handleAttachSession()` — Fetches session from API, adds to attachedSessions
- `handleSessionClose()` — Removes from attachedSessions
- `handleSessionDetach()` — Removes from attachedSessions
- `handleArchiveRestore()` — Calls useSessionArchive.restoreSession()
- `handleArchiveDelete()` — Calls useSessionArchive.deleteArchive()
- `handleFileSelect()` / `handleFileOpen()` — Logs to console
- `handleTaskCreate()` / `handleTaskStatusChange()` / `handleTaskDelete()` — PM workbench handlers

**Side Effects:**
- HTTP GET `/api/sessions/:sessionId` on attach
- HTTP POST `/api/sessions` on new session
- CSS transition classes for smooth workbench switching

**Event Flows:**
- User clicks workbench tab → TopBar calls `setActiveWorkbench()` → Context updates → WorkbenchLayout re-renders with new content
- User attaches session → SessionSidebar calls `onAttachSession` → HTTP fetch → Updates attachedSessions state
- User creates new session → SessionSidebar calls `onNewSession` → HTTP POST → Calls handleAttachSession with new ID

---

### 2.3 TopBar
**File:** `packages/app/src/components/TopBar/TopBar.tsx`

**Render Tree:** TopBar → WorkbenchTab (×12 tabs)

**Props:**
- `activeWorkbench: WorkbenchId`
- `onWorkbenchChange: (id: WorkbenchId) => void`

**State:** None (stateless presentation)

**Context Consumed:** `useWorkbenchContext()` for notification counts

**Lifecycle:** Render only

**Props Down:**
- Passes `workbench`, `isActive`, `notificationCount`, `onClick` to each WorkbenchTab

**Callbacks Up:**
- `onClick` → Calls `onWorkbenchChange(workbenchId)`

**Event Flows:**
- User clicks tab → Calls `onWorkbenchChange()` → WorkbenchContext updates → WorkbenchLayout re-renders

---

### 2.4 SessionSidebar
**File:** `packages/app/src/components/SessionSidebar/SessionSidebar.tsx`

**Render Tree:**
```
SessionSidebar
├── Header (title, DiscussButton, + button)
├── Active Sessions section
│   └── SessionSidebarItem (multiple)
├── Divider
├── Recent Sessions section
│   └── SessionSidebarItem (multiple)
└── Footer (session count)
```

**Props:**
- `onAttachSession?: (sessionId: SessionId) => void`
- `activeSessionId?: SessionId`
- `onNewSession?: () => void`
- `onSessionDeleted?: (sessionId: SessionId) => void`

**State:** None (uses useSessionSidebar hook)

**Custom Hook:** `useSessionSidebar()` — Fetches active/recent sessions, manages notifications

**Context Consumed:** `useDiscussButton()` for discuss dialog

**Lifecycle:**
- Mount: Hook fetches sessions via HTTP GET `/api/sessions`
- WebSocket: Auto-updates on `session:started`, `session:ended`, `session:deleted` events

**Props Down:**
- Passes `session`, `notificationCount`, `isActive`, `onClick`, `onDelete` to each SessionSidebarItem

**Callbacks Up:**
- `onClick(sessionId)` → Calls `onAttachSession(sessionId)`
- `onNewSession()` → Parent creates new session
- `onDelete(sessionId)` → HTTP DELETE `/api/sessions/:sessionId` → Calls `onSessionDeleted()` if active

**Side Effects:**
- HTTP GET `/api/sessions` (via hook)
- HTTP DELETE `/api/sessions/:sessionId`
- WebSocket subscription (via hook)

**Event Flows:**
- User clicks session item → Calls `onAttachSession()` → WorkbenchLayout fetches session details → Updates attachedSessions
- User clicks delete → Confirmation → HTTP DELETE → WebSocket broadcasts `session:deleted` → UI updates globally
- User clicks + button → Calls `onNewSession()` → WorkbenchLayout creates session → Auto-attaches

---

## 3. Session Panel System (25/75 Split Architecture)

### 3.1 SessionPanelLayout
**File:** `packages/app/src/components/SessionPanel/SessionPanelLayout.tsx`

**Render Tree:**
```
SessionPanelLayout
├── LeftPanelStack (25% default, resizable)
└── RightVisualizationArea (75% default, resizable)
└── ResizeHandle (drag to adjust split)
```

**Props:**
- `session: Session`
- `onSessionClose?: () => void`
- `onSessionDetach?: () => void`
- `onSubmitInput?: (input: string) => Promise<void>`
- `onNodeClick?: (nodeId: string) => void`
- `onAgentClick?: (agentId: string) => void`
- `onSelectFlow?: (flow: FlowAction) => void`
- `flows?: FlowAction[]`
- `actions?: FlowAction[]`
- `showAgents?: boolean`
- `defaultSplitRatio?: number` (default: 25%)

**State:**
- `splitRatio: number` — Percentage for left panel (15-40%)
- `isDragging: boolean` — Drag state for resize handle

**Lifecycle:**
- Mount: Loads saved split ratio from localStorage (`session-panel-split-ratio-${sessionId}`)
- Effect (session.id): Updates split ratio when session changes
- Cleanup: None

**Props Down:**
- Passes `session`, `onSubmitInput`, `onSelectFlow`, `flows`, `actions` to LeftPanelStack
- Passes `session`, `onNodeClick`, `onAgentClick`, `showAgents` to RightVisualizationArea
- Passes `onDrag`, `onDragStart`, `onDragEnd` to ResizeHandle

**Callbacks Up:**
- `handleDrag(deltaX)` → Calculates new split ratio, clamps to 15-40%
- `handleDragStart()` → Sets `isDragging: true`
- `handleDragEnd()` → Saves split ratio to localStorage, sets `isDragging: false`

**Side Effects:**
- localStorage persistence: `session-panel-split-ratio-${sessionId}`

**Event Flows:**
- User drags resize handle → ResizeHandle emits `onDrag(deltaX)` → Updates splitRatio → Re-renders with new widths
- User releases handle → Saves to localStorage → Persists across sessions

---

### 3.2 LeftPanelStack
**File:** `packages/app/src/components/SessionPanel/LeftPanelStack.tsx`

**Render Tree:**
```
LeftPanelStack
└── ChatPanel (flex: 1, fills entire space)
```

**Props:**
- `session: Session`
- `onSendMessage?: (message: string) => Promise<void>`
- `onSubmitInput?: (input: string) => Promise<void>` (legacy)
- `onSelectFlow?: (flow: FlowAction) => void`
- `flows?: FlowAction[]`
- `actions?: FlowAction[]`
- `panelHeights?: PanelHeightConfig`

**State:** None (pass-through container)

**Lifecycle:** Render only

**Props Down:**
- Passes `sessionId`, `session`, `collapsible: true` to ChatPanel

**Callbacks Up:**
- Uses `onSendMessage` || `onSubmitInput` (backward compat)

**Notes:**
- Simplified from original 5-panel accordion to single ChatPanel
- ChatPanel now includes integrated session info header

---

### 3.3 RightVisualizationArea
**File:** `packages/app/src/components/SessionPanel/RightVisualizationArea.tsx`

**Render Tree:**
```
RightVisualizationArea
└── FlowVisualization (if session has chains)
    └── ReactFlow
        ├── AnimatedStepNode (multiple)
        ├── AnimatedFlowEdge (multiple)
        ├── SwimlaneBackground
        ├── Controls
        ├── MiniMap
        └── Background
```

**Props:**
- `session: Session`
- `onNodeClick?: (nodeId: string) => void`
- `onAgentClick?: (agentId: string) => void`
- `showAgents?: boolean`

**State:** None (conditional rendering based on session.chains)

**Lifecycle:** Render only

**Props Down:**
- Passes `chain`, `onStepClick`, `enableAnimations: true` to FlowVisualization

**Event Flows:**
- User clicks step node → FlowVisualization emits `onStepClick(stepNumber)` → Parent shows StepInspector

---

### 3.4 ChatPanel (formerly ConversationPanel)
**File:** `packages/app/src/components/ConversationPanel/ConversationPanel.tsx`

**Render Tree:**
```
ChatPanel
├── Header (title, awaiting badge, DiscussButton)
├── Messages container
│   ├── Message (role: assistant | user) (multiple)
│   │   ├── Role label
│   │   ├── Content
│   │   ├── InlineButtons (if hasInlineButtons)
│   │   └── Timestamp
│   └── Auto-scroll anchor
├── Quick responses (if available)
└── Input area
    ├── Textarea
    └── Send button
```

**Props:**
- `session: Session`
- `onSubmitInput: (input: string) => Promise<void>`

**State:**
- `input: string` — Current input text
- `messages: Message[]` — Full conversation history
- `isSending: boolean` — Submit state

**Context Consumed:** `useDiscussButton()` for discuss dialog

**Lifecycle:**
- Mount: Registers chat input setter with DiscussContext
- Effect (session): Extracts messages from chain steps + lastPrompt
- Effect (messages): Auto-scrolls to bottom
- Cleanup: Unregisters from DiscussContext

**Props Down:**
- Passes `messageContent`, `sessionId`, `buttons`, `onAction` to InlineButtons
- Passes `componentName`, `componentContext`, `onSend`, `onClose` to DiscussDialog

**Callbacks Up:**
- `handleSubmit(inputText)` → Calls `onSubmitInput(inputText)` → Adds user message to local state
- `handleQuickResponse(response)` → Calls `handleSubmit(response)`

**Side Effects:**
- Auto-scroll to bottom on new messages
- Registers chat input setter in DiscussContext (allows DiscussButton to prefill input)

**Event Flows:**
- User types message + presses Enter → Calls `onSubmitInput()` → Backend processes → WebSocket emits response → Updates session.lastPrompt → Component re-renders with new message
- User clicks quick response button → Submits response → Same flow as above
- User clicks DiscussButton elsewhere → Opens DiscussDialog → Sends message → Prefills chat input via DiscussContext

**Await State:**
- `session.conversationState === 'awaiting_input'` → Enables input field, shows "Awaiting Input" badge
- Otherwise → Disables input field, shows "Session is not awaiting input" notice

**Message Extraction:**
1. Chain steps (completed) → Extract `description` or `result`
2. `session.lastPrompt` → Current awaiting prompt
3. User submissions → Tracked in local state
4. Sorted chronologically by timestamp

---

## 4. Visualization Components

### 4.1 FlowVisualization
**File:** `packages/app/src/components/FlowVisualization/FlowVisualization.tsx`

**Render Tree:**
```
FlowVisualization
└── ReactFlow
    ├── Panel (top-left) → SwimlaneBackground
    ├── Panel (top-right) → DiscussButton
    ├── AnimatedStepNode (multiple)
    ├── AnimatedFlowEdge (multiple)
    ├── Background
    ├── Controls
    └── MiniMap
```

**Props:**
- `chain: Chain`
- `onStepClick?: (stepNumber: number) => void`
- `enableAnimations?: boolean` (default: true)

**State:**
- `selectedStep: number | null` — Currently selected step
- `flowNodes: Node[]` — ReactFlow nodes (synced with computed nodes)
- `flowEdges: Edge[]` — ReactFlow edges (synced with computed edges)

**Context Consumed:** `useDiscussButton()`, `useReactFlow()` for fitView

**Custom Hooks:** None (uses ReactFlow hooks)

**Lifecycle:**
- Mount: Computes swimlane layout, builds nodes/edges
- Effect (chain.id): Calls `fitView()` after 100ms delay
- Effect (nodes): Syncs to flowNodes state
- Effect (edges): Syncs to flowEdges state

**Computed Values:**
- `swimlaneAssignments` — Maps steps to swimlanes (useMemo)
- `swimlaneNames` — Unique swimlane names (useMemo)
- `nodes` — ReactFlow nodes with AnimatedStepNode type (useMemo)
- `edges` — ReactFlow edges with AnimatedFlowEdge type (useMemo)

**Props Down:**
- Passes `step`, `stepNumber`, `action`, `status`, `description`, `model`, `animationState`, `onInspect` to AnimatedStepNode (via node data)
- Passes `dataLabel`, `active`, `sourceStep`, `targetStep` to AnimatedFlowEdge (via edge data)

**Callbacks Up:**
- `onInspect(stepNumber)` → Sets selectedStep → Calls `onStepClick(stepNumber)`

**Side Effects:**
- ReactFlow auto-fit view on chain change

**Animation States:**
- `pending` → `slide-in`
- `in_progress` → `pulse`
- `completed` → `shrink`
- `failed` → `shake`
- Others → `idle`

**Event Flows:**
- User clicks step node → Node calls `onInspect(stepNumber)` → FlowVisualization sets selectedStep → Calls `onStepClick()` → Parent shows StepInspector

---

### 4.2 AnimatedStepNode
**File:** `packages/app/src/components/FlowVisualization/AnimatedStepNode.tsx`

**Props (via node.data):**
- `step: ChainStep`
- `stepNumber: StepNumber`
- `action: string`
- `status: StepStatus`
- `description?: string`
- `model?: string`
- `animationState?: FlowNodeData['animationState']`
- `onInspect?: (stepNumber: number) => void`

**State:** None (presentation only)

**Lifecycle:** Render only

**CSS Classes:** Applies `animation-{state}` class for CSS animations

**Event Flows:**
- User clicks node → Calls `onInspect(stepNumber)` if provided

---

### 4.3 ChainDAG
**File:** `packages/app/src/components/ChainDAG/ChainDAG.tsx`

**Render Tree:**
```
ChainDAG
└── ReactFlow
    ├── StepNode (multiple)
    ├── Controls
    └── Background
```

**Props:**
- `chain: Chain`
- `onStepSelect?: (stepNumber: number) => void`

**State:**
- `nodes: Node[]`
- `edges: Edge[]`

**Custom Hook:** Uses `dagre` layout algorithm

**Lifecycle:**
- Mount: Builds DAG layout from chain steps
- Effect (chain): Rebuilds nodes/edges when chain changes

**Props Down:**
- Passes `step` to StepNode (via node data)

**Callbacks Up:**
- `onNodeClick` → Calls `onStepSelect(stepNumber)`

**Event Flows:**
- User clicks step → Calls `onStepSelect()` → Parent shows StepInspector

---

## 5. Terminal Components

### 5.1 ClaudeCliTerminal
**File:** `packages/app/src/components/ClaudeCliTerminal/ClaudeCliTerminal.tsx`

**Render Tree:**
```
ClaudeCliTerminal
├── Toolbar (DiscussButton, Stop, Clear, Close)
├── XTerm terminal (ref-based)
└── DiscussDialog
```

**Props:**
- `sessionId: SessionId`
- `onClose?: () => void`

**State:**
- `isTerminalReady: boolean`

**Refs:**
- `terminalRef: HTMLDivElement` — DOM element for xterm
- `xtermRef: XTerm` — xterm.js instance
- `fitAddonRef: FitAddon` — xterm fit addon
- `inputBufferRef: string` — Current input line

**Context Consumed:** `useWebSocketContext()`, `useDiscussButton()`

**Custom Hooks:** `useClaudeCliControl(sessionId)` for sendInput/stop

**Lifecycle:**
- Mount: Creates xterm instance, loads FitAddon, subscribes to WebSocket events
- Effect (isTerminalReady): Attaches `onData` handler for user input
- Effect (sessionId): Subscribes/unsubscribes to WebSocket for this session
- Effect (onEvent): Listens for `claude-cli:output` and `claude-cli:exited` events
- Effect (resize): Auto-fit terminal on window resize
- Cleanup: Disposes xterm instance, unsubscribes from WebSocket

**Props Down:** None (self-contained)

**Callbacks Up:**
- `onClose()` — Called when user clicks Close button

**Side Effects:**
- xterm.js terminal rendering
- WebSocket subscription for session events
- HTTP POST `/api/claude-cli/:sessionId/input` on user input (via hook)
- HTTP POST `/api/claude-cli/:sessionId/stop` on stop (via hook)

**Event Flows:**
- User types in terminal → `onData` captures → Buffers until Enter → Calls `sendInput(buffer)` → Backend processes → WebSocket emits `claude-cli:output` → Terminal renders output
- User presses Ctrl+C → Clears buffer → Displays `^C`
- User presses Backspace → Removes last char from buffer → Echoes backspace
- User clicks Stop → Calls `stop()` → Backend terminates CLI process

**Terminal Features:**
- Interactive stdin (disableStdin: false)
- Cursor blink
- Dark theme with ANSI color support
- Backspace, Enter, Ctrl+C handling
- Auto-fit on resize

---

### 5.2 TerminalPanel
**File:** `packages/app/src/components/Terminal/TerminalPanel.tsx`

**Render Tree:** Similar to ClaudeCliTerminal but with different context

**Props:**
- `sessionId: SessionId`

**State:** Similar to ClaudeCliTerminal

**Differences:**
- No Claude CLI-specific hooks
- Uses `useTerminalEvents()` for generic terminal events

---

## 6. Discussion System (DiscussButton Pattern)

### 6.1 DiscussButton
**File:** `packages/app/src/components/DiscussButton/DiscussButton.tsx`

**Props:**
- `componentName: string`
- `onClick: () => void`
- `disabled?: boolean`
- `size?: 'small' | 'medium'` (default: medium)
- `className?: string`

**State:** None (presentation only)

**Lifecycle:** Render only

**Event Flows:**
- User clicks button → Calls `onClick()` → Parent opens DiscussDialog

**Visual:**
- `size="medium"` → Shows icon + "Let's Discuss" label
- `size="small"` → Icon only (with tooltip)

---

### 6.2 DiscussDialog
**File:** `packages/app/src/components/DiscussButton/DiscussDialog.tsx`

**Render Tree:**
```
DiscussDialog (modal)
├── Backdrop
└── Content
    ├── Header (title, close button)
    ├── Context display (collapsible JSON)
    ├── Textarea (message input)
    └── Footer (Cancel, Send buttons)
```

**Props:**
- `isOpen: boolean`
- `componentName: string`
- `componentContext?: Record<string, unknown>`
- `onSend: (message: string) => void`
- `onClose: () => void`

**State:**
- `message: string` — User's discussion message
- `showContext: boolean` — Whether to show component context

**Lifecycle:**
- Mount: None
- Cleanup: None

**Props Down:** None

**Callbacks Up:**
- `onSend(message)` → Parent formats message with context → Sends to ChatPanel via DiscussContext
- `onClose()` → Parent closes dialog

**Event Flows:**
- User types message → Updates local state
- User clicks Send → Calls `onSend(message)` → Dialog closes → Message appears in ChatPanel

**Integration Pattern:**
```tsx
// Component using DiscussButton
const { isDialogOpen, openDialog, closeDialog, handleSend } = useDiscussButton({
  componentName: 'MyComponent',
  getContext: () => ({ someState: value }),
});

return (
  <>
    <DiscussButton componentName="MyComponent" onClick={openDialog} />
    <DiscussDialog
      isOpen={isDialogOpen}
      componentName="MyComponent"
      componentContext={getContext?.()}
      onSend={handleSend}
      onClose={closeDialog}
    />
  </>
);
```

---

### 6.3 useDiscussButton Hook
**File:** `packages/app/src/hooks/useDiscussButton.ts`

**Params:**
- `componentName: string`
- `getContext?: () => Record<string, unknown>`

**Returns:**
- `isDialogOpen: boolean`
- `openDialog: () => void`
- `closeDialog: () => void`
- `handleSend: (message: string) => void`

**Behavior:**
- `handleSend()` formats message with markdown `<details>` block for context
- Calls `prefillChatInput()` from DiscussContext
- **Does NOT close dialog** — caller should call `closeDialog()` after `handleSend()`

**Context Consumed:** `useDiscussContext()`

---

## 7. Custom Hooks Inventory

### 7.1 Data Fetching Hooks

#### useAllSessions
**File:** `packages/app/src/hooks/useAllSessions.ts`

**Returns:**
- `sessions: Session[]`
- `loading: boolean`
- `error: Error | null`
- `refresh: () => void`
- `addSession: (session: Session) => void`

**Behavior:**
- HTTP GET `/api/sessions` on mount
- WebSocket subscription for `session:started`, `session:ended`, `session:deleted`
- Auto-updates state on events

**Side Effects:**
- HTTP GET on mount
- WebSocket event subscription

---

#### useUserSessions
**File:** `packages/app/src/hooks/useUserSessions.ts`

**Returns:**
- `sessions: Session[]`
- `loading: boolean`
- `error: Error | null`
- `refresh: () => void`

**Behavior:**
- Similar to useAllSessions but filters by user

---

#### useSessionSidebar
**File:** `packages/app/src/hooks/useSessionSidebar.ts`

**Returns:**
- `activeSessions: Session[]` (status: in_progress)
- `recentSessions: Session[]` (last 10)
- `notificationCounts: Map<SessionId, number>`
- `attachSession: (sessionId: SessionId) => void`

**Behavior:**
- Uses `useAllSessions()` internally
- Filters sessions by status
- Tracks notification counts
- Calls parent `onAttachSession` callback

**Side Effects:**
- Increments notification counts on new events (via useNotificationGlow)

---

#### useDossiers
**File:** `packages/app/src/hooks/useDossiers.ts`

**Returns:**
- `dossiers: IntelDossier[]`
- `loading: boolean`
- `error: Error | null`
- `refresh: () => void`

**Behavior:**
- HTTP GET `/api/dossiers` on mount

---

### 7.2 State Management Hooks

#### useChainState
**File:** `packages/app/src/hooks/useChainState.ts`

**Returns:**
- `chain: Chain | null`
- `updateStep: (stepNumber: number, updates: Partial<ChainStep>) => void`
- `setChain: (chain: Chain) => void`

**Behavior:**
- Maintains chain state
- Updates individual steps immutably
- Recalculates chain status/stats on step update

---

#### useChainEvents
**File:** `packages/app/src/hooks/useChainEvents.ts`

**Returns:**
- `chainEventSummary: ChainEventSummary | null`

**Behavior:**
- Listens for chain-related WebSocket events
- Aggregates events into summary (started, completed, failed, skipped)

---

### 7.3 Control Hooks

#### useSessionControls
**File:** `packages/app/src/hooks/useSessionControls.ts`

**Returns:**
- `pause: (sessionId, graceful?, reason?) => Promise<void>`
- `resume: (sessionId) => Promise<void>`
- `cancel: (sessionId, reason?) => Promise<void>`
- `retry: (sessionId, stepNumber) => Promise<void>`
- `skip: (sessionId, stepNumber) => Promise<void>`

**Behavior:**
- HTTP POST `/api/sessions/:sessionId/commands` for each control action

**Side Effects:**
- HTTP POST for each command

---

#### useClaudeCliControl
**File:** `packages/app/src/hooks/useClaudeCliControl.ts`

**Returns:**
- `sendInput: (input: string) => Promise<void>`
- `stop: () => Promise<void>`
- `isLoading: boolean`
- `error: Error | null`

**Behavior:**
- HTTP POST `/api/claude-cli/:sessionId/input`
- HTTP POST `/api/claude-cli/:sessionId/stop`

---

### 7.4 WebSocket Hooks

#### useWebSocket
**File:** `packages/app/src/hooks/useWebSocket.ts`

**Returns:**
- `status: ConnectionStatus`
- `send: (message: WorkspaceEvent) => void`
- `subscribe: (sessionId: SessionId) => void`
- `unsubscribe: (sessionId: SessionId) => void`
- `error: Error | null`

**Behavior:**
- Establishes WebSocket connection to `ws://localhost:3001/ws`
- Auto-reconnect with exponential backoff
- Heartbeat ping every 25s, timeout after 30s
- HTTP polling fallback after 3 consecutive failures (5s interval)

**Side Effects:**
- WebSocket connection
- Auto-reconnection
- HTTP polling fallback
- Heartbeat ping timers

---

#### useEvents
**File:** `packages/app/src/hooks/useEvents.ts`

**Returns:**
- `events: WorkspaceEvent[]`
- `latestEvent: WorkspaceEvent | null`

**Behavior:**
- Subscribes to WebSocket events via context
- Maintains event history

---

### 7.5 Notification Hooks

#### useNotifications
**File:** `packages/app/src/hooks/useNotifications.ts`

**Returns:**
- `showNotification: (options: NotificationOptions) => Promise<boolean>`

**Behavior:**
- Calls Electron IPC `show-notification` via `window.electron.ipcRenderer`

**Side Effects:**
- Electron native notifications (if running in Electron)

---

#### useNotificationGlow
**File:** `packages/app/src/hooks/useNotificationGlow.ts`

**Returns:**
- `registerSession: (sessionId, workbenchId) => void`
- `unregisterSession: (sessionId) => void`
- `addNotification: (sessionId, input: NotificationInput) => void`
- `clearNotifications: (sessionId) => void`
- `getGlowState: (sessionId) => GlowState | null`

**Behavior:**
- Tracks notification counts per session
- Maps sessions to workbenches
- Provides glow state for UI indicators

---

### 7.6 File System Hooks

#### useFileTree
**File:** `packages/app/src/hooks/useFileTree.ts`

**Returns:**
- `fileTree: FileNode | null`
- `loading: boolean`
- `error: Error | null`
- `refresh: () => void`

**Behavior:**
- HTTP GET `/api/files/tree` for session's working directory

---

#### useEditorFiles
**File:** `packages/app/src/hooks/useEditorFiles.ts`

**Returns:**
- `openFiles: FileTab[]`
- `activeFile: string | null`
- `openFile: (path: string) => Promise<void>`
- `closeFile: (path: string) => void`
- `setActiveFile: (path: string) => void`

**Behavior:**
- Manages open editor tabs
- HTTP GET `/api/files/content/:path` to load file content

---

#### useFileSyncManager
**File:** `packages/app/src/hooks/useFileSyncManager.ts`

**Returns:**
- `startSync: (sessionId: SessionId) => void`
- `stopSync: () => void`
- `isSyncing: boolean`

**Behavior:**
- WebSocket subscription for file change events
- Auto-reloads files in editor when backend emits `file:changed` events

---

### 7.7 UI State Hooks

#### useCommandPalette
**File:** `packages/app/src/hooks/useCommandPalette.ts`

**Returns:**
- `isOpen: boolean`
- `open: () => void`
- `close: () => void`
- `toggle: () => void`

**Behavior:**
- Manages command palette open state
- Listens for Ctrl+K / Cmd+K keyboard shortcut

---

#### useVimNavigation
**File:** `packages/app/src/hooks/useVimNavigation.ts`

**Returns:**
- Uses `VimNavigationContext` internally

**Behavior:**
- Keyboard navigation with Vim bindings (j/k/h/l/gg/G)

---

#### useKeyboardShortcuts
**File:** `packages/app/src/hooks/useKeyboardShortcuts.ts`

**Returns:** None (registers global shortcuts)

**Behavior:**
- Registers keyboard shortcuts for workbench navigation, command palette, etc.

---

### 7.8 Harmony & Telemetry Hooks

#### useHarmonyMetrics
**File:** `packages/app/src/hooks/useHarmonyMetrics.ts`

**Returns:**
- `metrics: HarmonyMetrics | null`
- `loading: boolean`
- `error: Error | null`
- `refresh: () => void`

**Behavior:**
- HTTP GET `/api/harmony/metrics` for orchestrator contract drift detection

---

#### useStreamJsonEnrichment
**File:** `packages/app/src/hooks/useStreamJsonEnrichment.ts`

**Returns:**
- `enrichedData: any`

**Behavior:**
- Parses streaming JSON from backend events
- Enriches with metadata for visualization

---

## 8. Workbench-Specific Components

### 8.1 WorkWorkbench
**File:** `packages/app/src/components/Workbench/WorkWorkbench.tsx`

**Render Tree:**
```
WorkWorkbench
└── SessionPanelLayout (for each attached session)
```

**Props:**
- `sessions: Session[]`
- `activeSessionId?: SessionId`
- `onSessionClose: (sessionId: string) => void`
- `onSessionDetach: (sessionId: string) => void`
- `onSessionInput: (sessionId: string, input: string) => Promise<void>`
- `onNodeClick: (sessionId: string, nodeId: string) => void`
- `onAgentClick: (sessionId: string, agentId: string) => void`
- `flows: FlowAction[]`
- `actions: FlowAction[]`

**State:** None (renders attached sessions)

**Lifecycle:** Render only

**Props Down:**
- Passes `session`, `onSubmitInput`, `onNodeClick`, `onAgentClick`, `flows`, `actions` to each SessionPanelLayout

---

### 8.2 ExploreWorkbench
**File:** `packages/app/src/components/Workbench/ExploreWorkbench.tsx`

**Render Tree:**
```
ExploreWorkbench
├── Sidebar (FileTree)
└── Main area (FileExplorer or placeholder)
```

**Props:**
- `sessionId?: SessionId`
- `onFileSelect?: (path: string) => void`
- `onFileOpen?: (path: string) => void`

**State:**
- `selectedFile: string | null`

**Custom Hooks:** `useFileTree(sessionId)` for file tree data

**Lifecycle:**
- Mount: Fetches file tree for session's cwd

---

### 8.3 HarmonyWorkbench
**File:** `packages/app/src/components/Workbench/HarmonyWorkbench.tsx`

**Render Tree:**
```
HarmonyWorkbench
└── HarmonyPanel
    ├── Metrics display
    ├── Contract drift warnings
    └── Recommendations
```

**Props:**
- `sessionId?: SessionId`

**Custom Hooks:** `useHarmonyMetrics()` for contract drift detection

---

### 8.4 PMWorkbench
**File:** `packages/app/src/components/Workbench/PMWorkbench.tsx`

**Render Tree:**
```
PMWorkbench
├── Task board (Kanban)
├── Doc links
└── Milestones
```

**Props:**
- `tasks: PMTask[]`
- `docs: DocLink[]`
- `milestones: Milestone[]`
- `onTaskCreate: (task) => void`
- `onTaskStatusChange: (taskId, status) => void`
- `onTaskDelete: (taskId) => void`
- `onDocClick: (docId) => void`

**State:**
- Managed by parent (WorkbenchLayout)

---

### 8.5 ArchiveWorkbench
**File:** `packages/app/src/components/Workbench/ArchiveWorkbench.tsx`

**Render Tree:**
```
ArchiveWorkbench
└── SessionArchive
    ├── Archived session cards
    └── Actions (Restore, Delete, Clear All)
```

**Props:**
- `archivedSessions: Session[]`
- `onRestore: (sessionId: string) => void`
- `onDelete: (sessionId: string) => void`
- `onClearAll: () => void`

**Custom Hooks:** None (data from parent via useSessionArchive)

---

### 8.6 RespectWorkbench
**File:** `packages/app/src/components/Workbench/RespectWorkbench/RespectWorkbench.tsx`

**Render Tree:**
```
RespectWorkbench
├── RespectCheckControls (Run, Clear)
├── CategorySection (multiple)
│   └── ComponentHealthCard (multiple)
└── LiveSpatialMonitor (sidebar)
```

**Props:** None

**State:**
- `checkResults: RespectCheckResult[]`
- `selectedComponent: string | null`

**Custom Hooks:** `useRespectCheck()` for running health checks

**Behavior:**
- Runs spatial respect checks on UI components
- Displays health scores, violations, and recommendations

---

## 9. Small/Reusable Components

### 9.1 ChainBadge
**File:** `packages/app/src/components/ChainBadge/ChainBadge.tsx`

**Props:** `status: ChainStatus`

**State:** None

**Lifecycle:** Render only

**Visual:** Color-coded badge for chain status (pending, in_progress, completed, failed, mixed)

---

### 9.2 HarmonyBadge
**File:** `packages/app/src/components/HarmonyBadge/HarmonyBadge.tsx`

**Props:** `level: HarmonyLevel` (in-harmony, degraded, out-of-harmony)

**State:** None

**Lifecycle:** Render only

**Visual:** Color-coded badge with icon

---

### 9.3 GlowIndicator
**File:** `packages/app/src/components/common/GlowIndicator.tsx`

**Props:**
- `count: number`
- `urgency?: 'normal' | 'critical' | 'low'`

**State:** None

**Lifecycle:** Render only

**Visual:** Animated glow with notification count

---

### 9.4 ThemeToggle
**File:** `packages/app/src/components/ThemeToggle/ThemeToggle.tsx`

**Props:** None

**State:** None (uses ThemeContext)

**Context Consumed:** `useTheme()`

**Event Flows:**
- User clicks button → Calls `toggleTheme()` → ThemeContext updates → Document theme changes

---

### 9.5 CommandPalette
**File:** `packages/app/src/components/CommandPalette/CommandPalette.tsx`

**Render Tree:**
```
CommandPalette (modal)
├── Input field
└── Results list (filtered commands)
```

**Props:** None

**State:**
- `query: string`
- `filteredCommands: Command[]`
- `selectedIndex: number`

**Context Consumed:** `useCommandPalette()`, `useWorkbenchContext()`

**Lifecycle:**
- Mount: Registers Ctrl+K / Cmd+K listener
- Cleanup: Unregisters listener

**Event Flows:**
- User presses Ctrl+K → Opens palette
- User types query → Filters commands
- User presses Enter → Executes selected command → Closes palette

---

### 9.6 Toast
**File:** `packages/app/src/components/Toast/Toast.tsx`

**Props:**
- `toasts: ToastMessage[]`
- `onDismiss: (id: string) => void`

**State:** None (presentation only)

**Lifecycle:** Render only

**Visual:** Stacked toast messages (bottom-right corner)

---

## 10. Component Interaction Patterns

### 10.1 Parent-Child Prop Flow

**Pattern:**
```
Parent (state owner)
  ↓ props (data, callbacks)
Child (presentation)
  ↑ callbacks (events)
Parent (state update)
```

**Example:**
```
WorkbenchLayout (manages attachedSessions)
  ↓ onAttachSession
SessionSidebar (renders session list)
  ↑ onClick(sessionId)
WorkbenchLayout (fetches session, updates state)
```

---

### 10.2 Context-Based Communication

**Pattern:**
```
Provider (root)
  ↓ context value
Consumer (deep in tree)
  → uses context
Provider (state update)
  ↓ all consumers re-render
```

**Example:**
```
WebSocketProvider (root)
  ↓ onEvent registration
FlowVisualization (deep)
  → subscribes to events
Backend (emits event)
  → WebSocket receives
  → All subscribers notified
```

---

### 10.3 Custom Hook Extraction

**Pattern:**
```
Component
  → uses custom hook
Hook (manages complex logic)
  → returns state + actions
Component (renders with hook data)
```

**Example:**
```
SessionSidebar
  → useSessionSidebar()
Hook (fetches sessions, tracks notifications)
  → returns { activeSessions, recentSessions, notificationCounts }
SessionSidebar (renders with data)
```

---

### 10.4 WebSocket Event Flow

**Pattern:**
```
Backend (emits event)
  → WebSocket connection
  → WebSocketContext.handleMessage()
  → onEvent callback registry
  → Component event handlers
  → State updates
  → Re-render
```

**Example:**
```
Backend (session:started)
  → WS emits { type: 'session:started', sessionId, ... }
  → WebSocketContext receives
  → useAllSessions.handleSessionEvent()
  → setSessions([...prev, newSession])
  → SessionSidebar re-renders with new session
```

---

### 10.5 Discuss System Flow

**Pattern:**
```
Component A (anywhere)
  → DiscussButton onClick
  → DiscussDialog opens
  → User types message
  → onSend(message)
  → useDiscussButton.handleSend()
  → prefillChatInput(formattedMessage)
  → DiscussContext.chatInputSetterRef()
  → ChatPanel.setInput(message)
  → Input field updates
  → User sends message
```

**Example:**
```
FlowVisualization
  → User clicks DiscussButton
  → Dialog opens
  → User types "Why is step 3 failing?"
  → Sends with context: { chainId, stepCount, selectedStep }
  → Formatted message sent to ChatPanel
  → ChatPanel prefills input with formatted message
  → User reviews, edits if needed
  → Submits to backend
```

---

## 11. Side Effects Summary

### HTTP Requests (API Calls)

| Endpoint | Method | Triggered By | Components |
|----------|--------|--------------|------------|
| `/api/sessions` | GET | Mount, refresh | useAllSessions, useUserSessions, useSessionSidebar |
| `/api/sessions` | POST | New session button | WorkbenchLayout |
| `/api/sessions/:id` | GET | Session attach | WorkbenchLayout |
| `/api/sessions/:id` | DELETE | Delete button | SessionSidebar |
| `/api/sessions/:id/commands` | POST | Control buttons | useSessionControls |
| `/api/claude-cli/:id/input` | POST | Terminal input | useClaudeCliControl |
| `/api/claude-cli/:id/stop` | POST | Stop button | useClaudeCliControl |
| `/api/files/tree` | GET | Mount, refresh | useFileTree |
| `/api/files/content/:path` | GET | File open | useEditorFiles |
| `/api/harmony/metrics` | GET | Mount, refresh | useHarmonyMetrics |
| `/api/dossiers` | GET | Mount, refresh | useDossiers |

---

### WebSocket Events

| Event Type | Emitted By | Subscribed By | Action |
|------------|------------|---------------|--------|
| `session:started` | Backend | useAllSessions, useUserSessions | Add new session to list |
| `session:ended` | Backend | useAllSessions, useUserSessions | Update session status to completed |
| `session:deleted` | Backend | useAllSessions, useUserSessions | Remove session from list |
| `chain:started` | Backend | useChainEvents | Add chain to session |
| `step:started` | Backend | useChainState | Update step status to in_progress |
| `step:completed` | Backend | useChainState | Update step status to completed |
| `step:failed` | Backend | useChainState | Update step status to failed |
| `claude-cli:output` | Backend | ClaudeCliTerminal | Write to terminal |
| `claude-cli:exited` | Backend | ClaudeCliTerminal | Show exit message |
| `file:changed` | Backend | useFileSyncManager | Reload file in editor |
| `registry-event` | Backend | useButtonActions | Update button registry |

---

### LocalStorage Persistence

| Key | Value | Written By | Read By |
|-----|-------|------------|---------|
| `afw-active-workbench` | WorkbenchId | WorkbenchContext | WorkbenchContext (mount) |
| `actionflows:theme` | Theme | ThemeContext | ThemeContext (mount) |
| `actionflows:vim:enabled` | boolean | VimNavigationContext | VimNavigationContext (mount) |
| `session-panel-split-ratio-${sessionId}` | number (15-40) | SessionPanelLayout | SessionPanelLayout (mount) |

---

### Timers & Intervals

| Timer | Interval | Component | Purpose |
|-------|----------|-----------|---------|
| Reconnect timeout | 3s-30s (exponential backoff) | useWebSocket | Auto-reconnect WebSocket |
| Heartbeat timeout | 30s | useWebSocket | Detect stale connection |
| Ping interval | 25s | useWebSocket | Keep connection alive |
| Polling interval | 5s | useWebSocket | HTTP fallback polling |
| Toast dismiss | 3s (default) | ToastContext | Auto-dismiss notifications |
| Transition timeout | 180ms | WorkbenchLayout | Workbench switch animation |
| FitView delay | 100ms | FlowVisualization | ReactFlow auto-fit |

---

## 12. Re-render Triggers

### Component Re-renders When:

| Component | Re-renders When |
|-----------|-----------------|
| WorkbenchLayout | activeWorkbench changes (context), attachedSessions updates, activeSessionId changes |
| SessionSidebar | activeSessions/recentSessions update (hook), notificationCounts update (hook) |
| SessionPanelLayout | session prop changes, splitRatio updates (drag), isDragging state changes |
| ChatPanel | session.lastPrompt changes, messages array updates, input state changes, isSending changes |
| FlowVisualization | chain prop changes, flowNodes/flowEdges update (computed), selectedStep changes |
| TopBar | activeWorkbench changes (context), workbenchNotifications update (context) |
| ThemeToggle | theme/resolvedTheme changes (context) |
| CommandPalette | query changes, filteredCommands updates, isOpen changes (context) |

---

### State Update Sources:

1. **User Interactions**
   - Click, keyboard, drag, input
   - Triggers: `setState()`, callback props

2. **WebSocket Events**
   - Real-time backend updates
   - Triggers: Event handlers in hooks/components

3. **HTTP Responses**
   - API fetch results
   - Triggers: `setState()` in async callbacks

4. **Context Updates**
   - Global state changes
   - Triggers: Context provider `setState()`

5. **Timer Callbacks**
   - Auto-dismiss, auto-reconnect, polling
   - Triggers: `setTimeout()`, `setInterval()`

---

## 13. Component Mount Lifecycle Summary

### Initialization Order (App Start):

1. **App.tsx** (root)
2. **ThemeProvider** → Loads theme from localStorage, applies to DOM
3. **WebSocketProvider** → Establishes WS connection, starts heartbeat
4. **WorkbenchProvider** → Loads active workbench from localStorage
5. **ToastProvider** → Initializes empty toast array
6. **VimNavigationProvider** → Loads vim enabled state
7. **DiscussProvider** → Initializes chatInputSetterRef
8. **AppContent** → Renders WorkbenchLayout
9. **WorkbenchLayout** → Renders TopBar, DashboardSidebar, SessionSidebar (conditional), active workbench
10. **SessionSidebar** → Fetches sessions via useSessionSidebar → HTTP GET `/api/sessions`
11. **WorkWorkbench** (if active) → Renders SessionPanelLayout for each attached session
12. **SessionPanelLayout** → Loads split ratio from localStorage, renders LeftPanelStack + RightVisualizationArea
13. **ChatPanel** → Registers chatInputSetter with DiscussContext, extracts messages from session
14. **FlowVisualization** → Computes layout, renders ReactFlow with AnimatedStepNode/AnimatedFlowEdge

### Session Attach Flow:

1. User clicks session in SessionSidebar
2. SessionSidebar calls `onAttachSession(sessionId)`
3. WorkbenchLayout calls `handleAttachSession(sessionId)`
4. HTTP GET `/api/sessions/:sessionId`
5. Response received → Adds session to `attachedSessions` state
6. WorkbenchLayout re-renders → Passes new session to WorkWorkbench
7. WorkWorkbench renders SessionPanelLayout for new session
8. SessionPanelLayout subscribes to WebSocket events for sessionId
9. ChatPanel extracts messages from session.lastPrompt + chains
10. FlowVisualization renders chain steps as ReactFlow nodes

### WebSocket Event Update Flow:

1. Backend emits `step:completed` event
2. WebSocket receives JSON, parses in `handleMessage()`
3. Calls all registered `onEvent()` callbacks
4. `useChainState.updateStep()` called
5. Updates step in chain, recalculates stats
6. `setChain()` triggers re-render
7. FlowVisualization receives new chain prop
8. Recomputes nodes/edges (useMemo)
9. ReactFlow re-renders with updated node status
10. AnimatedStepNode applies new animation class

---

## 14. Error Handling Patterns

### HTTP Error Handling:

```tsx
try {
  const response = await fetch('/api/sessions');
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  const data = await response.json();
  // Process data
} catch (error) {
  console.error('Failed to fetch sessions:', error);
  setError(error as Error);
  // Optional: Show toast notification
}
```

### WebSocket Error Handling:

```tsx
ws.addEventListener('error', (event) => {
  console.error('WebSocket error:', event);
  setStatus('error');
  setError(new Error('WebSocket connection error'));
  // Fallback to HTTP polling after 3 failures
});
```

### Component Error Boundaries:

- None currently implemented
- Recommendation: Add error boundaries for workbench components

---

## 15. Testing Recommendations

### Unit Tests:

1. **Custom Hooks**
   - Test `useChainState.updateStep()` immutability
   - Test `useDiscussButton.handleSend()` formatting
   - Test `useWebSocket` reconnect logic

2. **Pure Components**
   - ChainBadge status colors
   - HarmonyBadge levels
   - DiscussButton size variants

### Integration Tests:

1. **Context + Component**
   - ThemeProvider + ThemeToggle
   - WorkbenchProvider + TopBar
   - DiscussProvider + DiscussButton + ChatPanel

2. **Hook + API**
   - useAllSessions fetch + WebSocket updates
   - useSessionControls command sending
   - useClaudeCliControl input handling

### E2E Tests (Chrome MCP):

1. **Session Lifecycle**
   - Create session → Appears in SessionSidebar
   - Attach session → SessionPanelLayout renders
   - Delete session → Removed from list

2. **Workbench Navigation**
   - Click tab → Content switches
   - Notification badge → Updates on event
   - Back button → Returns to previous

3. **Chat Interaction**
   - Type message → Send → Appears in history
   - Quick response → Auto-submit
   - DiscussButton → Opens dialog → Sends → Prefills chat

4. **Flow Visualization**
   - Chain loaded → Nodes render
   - Click step → StepInspector opens
   - Step status changes → Node updates

5. **Terminal Interaction**
   - Type in ClaudeCliTerminal → Echo
   - Press Enter → Sends input
   - Output received → Displays in terminal

---

## 16. Performance Considerations

### Memoization:

- FlowVisualization: `useMemo` for nodes, edges, swimlane layout
- WorkbenchLayout: `useMemo` for workbench configs
- All context providers: `useMemo` for context value

### Callback Stability:

- All event handlers: `useCallback` to prevent re-renders
- WebSocket `handleMessage`: Empty deps for stable identity

### Virtualization Opportunities:

- SessionSidebar: Long session lists (not implemented)
- ChatPanel: Long message histories (not implemented)
- FileTree: Deep directory trees (not implemented)

### Bundle Size:

- ReactFlow: Large (300KB+), consider code splitting
- xterm.js: Large (200KB+), already lazy-loaded in ClaudeCliTerminal
- Monaco Editor: Very large (500KB+), used in EditorWorkbench

---

## 17. Accessibility Notes

### Keyboard Navigation:

- CommandPalette: Ctrl+K / Cmd+K shortcut
- Vim mode: j/k/h/l/gg/G navigation
- Tab focus: Most buttons/inputs support Tab navigation

### ARIA Labels:

- DiscussButton: `aria-label="Discuss {componentName}"`
- SessionSidebar: `aria-label="Session navigation sidebar"`
- Workbench tabs: Should add aria-selected (TODO)

### Screen Reader Support:

- Limited (not prioritized in current implementation)
- Recommendations: Add more ARIA labels, roles, live regions

---

## 18. Future Behavioral Contract Schema

### Proposed Schema Structure:

```typescript
interface ComponentBehavioralContract {
  componentName: string;
  filePath: string;
  dependencies: {
    contexts: string[];
    hooks: string[];
    children: string[];
  };
  state: {
    local: StateField[];
    context: ContextField[];
  };
  props: PropField[];
  lifecycle: {
    mount: SideEffect[];
    unmount: SideEffect[];
    effects: EffectRule[];
  };
  interactions: {
    userEvents: UserEventHandler[];
    webSocketEvents: WebSocketEventHandler[];
    apiCalls: APICallDefinition[];
  };
  renders: {
    conditions: RenderCondition[];
    children: ChildComponent[];
  };
  healthChecks: {
    critical: HealthCheck[];
    warning: HealthCheck[];
  };
}
```

### Health Check Examples:

```typescript
// Critical: ChatPanel must register with DiscussContext
{
  type: 'context-registration',
  component: 'ChatPanel',
  context: 'DiscussContext',
  method: 'registerChatInput',
  failureMode: 'DiscussButton will not work',
}

// Critical: WebSocketContext must establish connection within 5s
{
  type: 'connection-timeout',
  component: 'WebSocketContext',
  timeout: 5000,
  fallback: 'HTTP polling',
  failureMode: 'Real-time updates will not work',
}

// Warning: SessionSidebar should show sessions within 2s
{
  type: 'data-fetch-timeout',
  component: 'SessionSidebar',
  hook: 'useSessionSidebar',
  timeout: 2000,
  failureMode: 'UI will show loading state',
}
```

---

## Appendix: Component File Listing

**Total: 110 TSX files, 38 hooks, 7 contexts**

### Components by Directory:

```
packages/app/src/components/
├── AppContent.tsx (1 file)
├── ChainBadge/ (1 file)
├── ChainDAG/ (2 files: ChainDAG, StepNode)
├── ChainDemo.tsx
├── ChainLiveMonitor.tsx
├── ChangePreview/ (1 file: ChangePreview)
├── ClaudeCliTerminal/ (5 files: ClaudeCliTerminal, ProjectSelector, ProjectForm, ClaudeCliStartDialog, DiscoveredSessionsList)
├── CodeEditor/ (3 files: EditorTabs, ConflictDialog, DiffView)
├── CommandPalette/ (3 files: CommandPalette, CommandPaletteInput, CommandPaletteResults)
├── common/ (1 file: GlowIndicator)
├── ConversationPanel/ (1 file: ConversationPanel)
├── ControlButtons/ (1 file: ControlButtons)
├── CustomPromptButton/ (1 file: CustomPromptDialog)
├── DashboardSidebar/ (1 file: index.ts)
├── DisambiguationModal/ (1 file: DisambiguationModal)
├── DiscussButton/ (2 files: DiscussButton, DiscussDialog)
├── FileExplorer/ (2 files: FileTree, FileIcon)
├── FlowVisualization/ (4 files: FlowVisualization, AnimatedFlowEdge, SwimlaneBackground, AnimatedStepNode)
├── HarmonyBadge/ (1 file: HarmonyBadge)
├── HarmonyIndicator/ (1 file: HarmonyIndicator)
├── HarmonyPanel/ (1 file: HarmonyPanel)
├── HistoryBrowser.tsx
├── InlineButtons/ (1 file: InlineButtonItem)
├── IntelDossier/ (4 files: DossierView, DossierList, DossierCreationDialog, WidgetRenderer)
│   └── widgets/ (7 files: StatCard, InsightCard, AlertPanel, CodeHealthMeter, FileTree, SnippetPreview, Unknown)
├── ModifierCard/ (1 file: ModifierCard)
├── PersistentToolbar/ (1 file: PersistentToolbarButton)
├── QuickActionBar/ (1 file: QuickActionButton)
├── RegistryBrowser/ (3 files: RegistryBrowser, RegistryEntryCard, PackCard)
├── SessionArchive/ (1 file: SessionArchive)
├── SessionPane/ (1 file: SessionPane)
├── SessionPanel/ (5 files: SessionPanelLayout, LeftPanelStack, RightVisualizationArea, ResizeHandle, FolderHierarchy)
├── SessionSidebar/ (2 files: SessionSidebar, SessionSidebarItem)
├── SessionTile/ (1 file: HybridFlowViz)
├── SessionTree/ (1 file: SessionTree)
├── SquadPanel/ (7 files: SquadPanel, AgentRow, AgentAvatar, AgentLogPanel, AgentCharacterCard, LogBubble, SquadPanelDemo)
├── StarBookmark/ (2 files: StarBookmark, StarBookmarkDialog)
├── StepInspector/ (1 file: StepInspector)
├── TelemetryViewer/ (1 file: TelemetryViewer)
├── Terminal/ (1 file: TerminalPanel)
├── ThemeToggle/ (1 file: ThemeToggle)
├── TimelineView/ (1 file: TimelineView)
├── Toast/ (1 file: Toast)
├── TopBar/ (1 file: WorkbenchTab)
├── VimModeIndicator/ (1 file: VimModeIndicator)
├── WebSocketTest.tsx
└── Workbench/ (12 files: WorkbenchLayout, WorkWorkbench, MaintenanceWorkbench, ExploreWorkbench, ReviewWorkbench, ArchiveWorkbench, SettingsWorkbench, PMWorkbench, HarmonyWorkbench, CanvasWorkbench, EditorWorkbench, IntelWorkbench)
    └── RespectWorkbench/ (4 files: RespectWorkbench, RespectCheckControls, ComponentHealthCard, LiveSpatialMonitor, CategorySection)
```

### Hooks:

```
packages/app/src/hooks/
├── index.ts (re-exports)
├── useAllSessions.ts
├── useAttachedSessions.ts
├── useButtonActions.ts
├── useChainEvents.ts
├── useChainState.ts
├── useChatMessages.ts
├── useClaudeCliControl.ts
├── useClaudeCliSessions.ts
├── useCommandPalette.ts
├── useCustomPromptButtons.ts
├── useDiscoveredSessions.ts
├── useDiscussButton.ts
├── useDossiers.ts
├── useEditorFiles.ts
├── useEvents.ts
├── useFileSyncManager.ts
├── useFileTree.ts
├── useFlowAnimations.ts
├── useFreshness.ts
├── useHarmonyMetrics.ts
├── useKeyboardShortcuts.ts
├── useNotificationGlow.ts
├── useNotifications.ts
├── usePromptButtons.ts
├── useProjects.ts
├── useSessionArchive.ts
├── useSessionControls.ts
├── useSessionInput.ts
├── useSessionSidebar.ts
├── useStreamJsonEnrichment.ts
├── useTerminalEvents.ts
├── useUserSessions.ts
├── useUsers.ts
├── useVimNavigation.ts
└── useWebSocket.ts
```

### Contexts:

```
packages/app/src/contexts/
├── index.ts (re-exports)
├── DiscussContext.tsx
├── ThemeContext.tsx
├── ToastContext.tsx
├── VimNavigationContext.tsx
├── WebSocketContext.tsx
└── WorkbenchContext.tsx
```

---

**End of Component Behavioral Catalog**
**Generated:** 2026-02-10
**By:** Claude Opus 4.6 (analyze agent)
