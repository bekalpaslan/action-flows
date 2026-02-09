# Session Panel Layout Inventory

**Aspect:** inventory
**Scope:** packages/app/src/components/ — SessionSidebar, SessionTile, WorkbenchLayout, BottomControlPanel
**Date:** 2026-02-09
**Agent:** analyze/

---

## 1. Current Layout Architecture

### 1.1 Top-Level Structure

The application follows a shell layout pattern anchored in `WorkbenchLayout.tsx`:

```
App (contexts)
└── AppContent
    └── WorkbenchLayout
        ├── TopBar (workbench tabs)
        ├── SessionSidebar (fixed position, auto-hide, 40px collapsed / 280px expanded)
        ├── Main Content Area
        │   └── Workbench-specific content (Work, Editor, PM, etc.)
        └── BottomControlPanel (120px height, fixed at bottom)
```

**Key Files:**
- Entry: `packages/app/src/App.tsx`
- Main layout: `packages/app/src/components/Workbench/WorkbenchLayout.tsx`
- Layout styles: `packages/app/src/components/Workbench/WorkbenchLayout.css`

### 1.2 SessionSidebar (Left Edge)

**Location:** `packages/app/src/components/SessionSidebar/`

**Current Behavior:**
- **Fixed position** at left edge (z-index: 1000)
- Auto-hide: Collapses to 40px strip, expands to 280px on hover
- Shows active sessions (in_progress) + recent sessions (last 10)
- Notification badges for session events
- Smooth slide animation with reduced-motion support

**Component Structure:**
```tsx
SessionSidebar
├── SessionSidebarItem (per session)
└── useSessionSidebar hook (data fetching & state)
```

**Props:**
- `onAttachSession?: (sessionId: SessionId) => void`
- `activeSessionId?: SessionId`

**Layout Sections (top to bottom):**
1. Header: Icon + "Sessions" label
2. Active Sessions section (with count)
3. Divider
4. Recent Sessions section (with count)
5. Footer: Session count indicator

**Styles:**
- Background: `#1e1e1e`
- Border: `1px solid #404040`
- Transition: `width 150ms ease-in` (collapsed) / `200ms ease-out` (expanded)

---

## 2. Session Display Components

### 2.1 SessionTile (Main Session Container)

**Location:** `packages/app/src/components/SessionTile/SessionTile.tsx`

**Current Layout (Horizontal Split):**
```
SessionTile
├── Header Bar (40px height)
│   ├── Left: Title + Status Badge
│   └── Right: Conversation Button, Detach Button, Close Button
├── Content Area (flex: 1)
│   ├── Left Panel (25% width)
│   │   ├── SessionDetailsPanel (40% height)
│   │   └── SessionCliPanel (60% height)
│   └── Right Panel (75% width)
│       └── HybridFlowViz (full height)
└── SlidingWindow (overlay)
    └── ConversationPanel
```

**Props Interface:**
```tsx
{
  session: Session;
  onClose?: () => void;
  onDetach?: () => void;
  compact?: boolean;
  onSubmitInput?: (input: string) => Promise<void>;
  onNodeClick?: (nodeId: string) => void;
  onAgentClick?: (agentId: string) => void;
  showAgents?: boolean; // default: true
}
```

**Layout Variables:**
- Left panel width: `25%` (hardcoded in state: `leftPanelWidth`)
- Details section: `40%` height
- CLI section: `60%` height
- Responsive breakpoint: `800px` (stacks vertically)

**Styles:**
- Container: `display: flex; flex-direction: column; height: 100%`
- Background: `#1e1e1e`
- Border radius: `8px`
- Box shadow: `0 4px 12px rgba(0, 0, 0, 0.3)`

### 2.2 SessionDetailsPanel

**Location:** `packages/app/src/components/SessionTile/SessionDetailsPanel.tsx`

**Features:**
- Session ID with copy-to-clipboard
- Status badge (color-coded: green/blue/red/yellow/gray)
- Working directory (truncated to last 2 segments)
- Timestamps (relative: "5m ago", absolute on hover)
- Chain count + active chain info
- Platform info (hostname, OS)
- Compact mode support

**Props:**
```tsx
{
  session: Session;
  compact?: boolean;
}
```

**Utility Functions:**
- `formatRelativeTime(timestamp: number): string`
- `formatDuration(ms: number): string`
- `truncatePath(path: string, maxSegments = 2): string`
- `truncateSessionId(id: string): string`
- `getStatusColor(status: string): string`
- `getStatusText(status: string): string`

### 2.3 SessionCliPanel (Terminal)

**Location:** `packages/app/src/components/SessionTile/SessionCliPanel.tsx`

**Features:**
- xterm.js terminal display with dark theme
- WebSocket connection to session CLI output
- Command input field at bottom
- Auto-scroll on new output
- Full height within container (default: `100%`)

**Props:**
```tsx
{
  sessionId: SessionId;
  height?: number | string; // default: '100%'
  onCommand?: (command: string) => void;
}
```

**Dependencies:**
- `xterm` + `@xterm/addon-fit`
- `useWebSocketContext` for real-time CLI output
- `claudeCliService` for sending commands

**Layout:**
```
SessionCliPanel
├── Terminal Container (xterm.js mounted here)
└── Command Input Container
    ├── Prompt ($)
    ├── Input Field
    └── Send Button
```

**Color Scheme:**
- Background: `#0a0a0a`
- Foreground: `#d4d4d4`
- Font: `"Cascadia Code", "Fira Code", "Consolas", monospace`
- Font size: `14px`

### 2.4 HybridFlowViz (Flow Visualization)

**Location:** `packages/app/src/components/SessionTile/HybridFlowViz.tsx`

**Purpose:** Combines ReactFlow DAG with SquadPanel agents overlay

**Layout:**
```
HybridFlowViz
├── FlowVisualization (ReactFlow DAG, full container)
└── SquadPanel Overlay (positioned at bottom-right)
```

**Props:**
```tsx
{
  sessionId: SessionId;
  chain: Chain;
  chainId?: ChainId;
  onNodeClick?: (nodeId: string) => void;
  onAgentClick?: (agentId: string) => void;
  showAgents?: boolean; // default: true
  enableAnimations?: boolean; // default: true
  overlayPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  overlayOpacity?: number; // default: 0.9
}
```

**FlowVisualization Features:**
- ReactFlow nodes (AnimatedStepNode)
- Swimlane layout (per-agent lanes)
- Animated edges with data flow
- MiniMap + Controls
- Auto-fit view on chain change
- Custom node types: `animatedStep`
- Custom edge types: `animatedEdge`

### 2.5 SlidingWindow (Overlay Panel)

**Location:** `packages/app/src/components/SessionTile/SlidingWindow.tsx`

**Features:**
- Resizable panel sliding in from right edge
- Persistent width (localStorage: `sliding-window-width`)
- Default width: `400px` (min: `300px`, max: `800px`)
- Backdrop click to close
- Escape key to close
- Focus trap for accessibility

**Props:**
```tsx
{
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  width?: number | string;
  minWidth?: number; // default: 300
  maxWidth?: number; // default: 800
  children: React.ReactNode;
}
```

**Used For:**
- ConversationPanel (primary use case)

### 2.6 ConversationPanel

**Location:** `packages/app/src/components/ConversationPanel/ConversationPanel.tsx`

**Features:**
- Full conversation history from session data
- Claude responses (from chain steps + lastPrompt)
- User responses (tracked locally)
- Quick response buttons (binary prompts)
- Input field (disabled when not awaiting input)
- InlineButtons integration (demo buttons)
- Auto-scroll to bottom on new messages

**Props:**
```tsx
{
  session: Session;
  onSubmitInput: (input: string) => Promise<void>;
}
```

**Message Sources:**
1. Chain step results (completed steps with summaries)
2. lastPrompt (current awaiting prompt)
3. User submissions (local state)

**Layout:**
```
ConversationPanel
├── Header ("Conversation" + awaiting badge)
├── Messages Container (scrollable)
│   └── Message (role: assistant | user)
│       ├── Role label
│       ├── Content
│       ├── InlineButtons (if hasInlineButtons)
│       └── Timestamp
└── Input Area
    ├── Quick Responses (if available)
    └── Input Field + Send Button
```

---

## 3. Workbench-Level Components

### 3.1 WorkbenchLayout (Shell)

**Location:** `packages/app/src/components/Workbench/WorkbenchLayout.tsx`

**Responsibilities:**
- Top-level shell layout
- Workbench routing (work, editor, pm, review, etc.)
- Session attachment state management
- Transition animations between workbenches
- Static ActionFlows data (flows + actions arrays)

**State Management:**
- `attachedSessions: Session[]`
- `activeSessionId: SessionId | undefined`
- `transitionClass: string` (for workbench transitions)
- PM Workbench demo state (tasks, docs, milestones)

**Callbacks:**
- `handleAttachSession(sessionId: SessionId)`
- `handleSessionClose(sessionId: string)`
- `handleSessionDetach(sessionId: string)`
- `handleSessionInput(sessionId: string, input: string)`
- `handleNodeClick(sessionId: string, nodeId: string)`
- `handleAgentClick(sessionId: string, agentId: string)`

**Flow/Action Data:**
- Flows: `code-and-review`, `audit-and-fix`, `ideation`, `onboarding`, `doc-reorganization`
- Actions: `analyze`, `brainstorm`, `code`, `review`, `plan`, `test`, `commit`

### 3.2 WorkWorkbench

**Location:** `packages/app/src/components/Workbench/WorkWorkbench.tsx`

**Purpose:** Primary workbench for active development sessions

**Layout:**
```
WorkWorkbench
├── Header Bar
│   ├── Title ("Work Dashboard")
│   └── Session Count Badge
└── SessionTileGrid
```

**Props:**
```tsx
{
  sessions: Session[];
  onSessionClose?: (sessionId: string) => void;
  onSessionDetach?: (sessionId: string) => void;
  onSessionInput?: (sessionId: string, input: string) => Promise<void>;
  onNodeClick?: (sessionId: string, nodeId: string) => void;
  onAgentClick?: (sessionId: string, agentId: string) => void;
}
```

### 3.3 SessionTileGrid

**Location:** `packages/app/src/components/Workbench/SessionTileGrid.tsx`

**Layout Logic:**
- 1 tile: Full width/height (1 row × 1 col)
- 2 tiles: 50%/50% horizontal split (1 row × 2 cols)
- 3 tiles: 50%/50% top row, 100% bottom row (2 rows × 2 cols, last spans 2 cols)
- 4 tiles: 2×2 grid (2 rows × 2 cols)
- 5+ tiles: Warning + show first 4 only

**Compact Mode:**
- Enabled for 3+ sessions
- Reduces font sizes, hides labels, shrinks buttons

**Props:**
```tsx
{
  sessions: Session[];
  onSessionClose?: (sessionId: string) => void;
  onSessionDetach?: (sessionId: string) => void;
  onSessionInput?: (sessionId: string, input: string) => Promise<void>;
  onNodeClick?: (sessionId: string, nodeId: string) => void;
  onAgentClick?: (sessionId: string, agentId: string) => void;
}
```

---

## 4. BottomControlPanel

### 4.1 Main Panel

**Location:** `packages/app/src/components/BottomControlPanel/BottomControlPanel.tsx`

**Height:** `120px` (fixed)

**Layout (3 sections):**
```
BottomControlPanel
├── Left Section: QuickCommandGrid
├── Center Section: HumanInputField
└── Right Section: FlowActionPicker
```

**Props:**
```tsx
{
  sessionId?: SessionId;
  onSubmitInput: (value: string) => void;
  onExecuteCommand: (action: QuickCommandAction) => void;
  onSelectFlow: (item: FlowAction) => void;
  flows?: FlowAction[];
  actions?: FlowAction[];
  commands?: QuickCommand[];
  disabled?: boolean;
}
```

### 4.2 HumanInputField

**Location:** `packages/app/src/components/BottomControlPanel/HumanInputField.tsx`

**Features:**
- Text input with send button
- Session indicator (shows active session ID)
- Enter key to submit
- Loading spinner during send
- Focus state styling

**Props:**
```tsx
{
  placeholder?: string;
  onSubmit: (value: string) => void;
  disabled?: boolean;
  sessionId?: string;
}
```

### 4.3 FlowActionPicker

**Location:** `packages/app/src/components/BottomControlPanel/FlowActionPicker.tsx`

**Features:**
- Dropdown menu for flows + actions
- Search/filter by name or description
- Keyboard navigation (Arrow keys, Enter, Escape)
- Recent items section (optional)
- Icon + description per item

**Props:**
```tsx
{
  flows: FlowAction[];
  actions: FlowAction[];
  recentItems?: FlowAction[];
  onSelect: (item: FlowAction) => void;
  disabled?: boolean;
}
```

**Dropdown Structure:**
```
FlowActionPicker
├── Button (shows selected item or "Flows")
└── Dropdown (when open)
    ├── Search Input
    └── Sections
        ├── Recent (if available)
        ├── Flows
        └── Actions
```

### 4.4 QuickCommandGrid

**Location:** `packages/app/src/components/BottomControlPanel/QuickCommandGrid.tsx`

**Features:**
- Grid of quick command buttons
- Sorted by frequency (most used first)
- Limited to `maxVisible` (default: 8)
- Icon + label per button

**Props:**
```tsx
{
  commands?: QuickCommand[];
  onExecute: (action: QuickCommandAction) => void;
  maxVisible?: number; // default: 8
  disabled?: boolean;
}
```

---

## 5. Component Dependencies Map

### 5.1 Import Tree

```
WorkbenchLayout
├── TopBar
├── SessionSidebar
│   └── SessionSidebarItem
├── Workbench-specific (e.g., WorkWorkbench)
│   └── SessionTileGrid
│       └── SessionTile
│           ├── SessionDetailsPanel
│           ├── SessionCliPanel
│           ├── HybridFlowViz
│           │   ├── FlowVisualization
│           │   └── SquadPanel
│           └── SlidingWindow
│               └── ConversationPanel
│                   └── InlineButtons
└── BottomControlPanel
    ├── QuickCommandGrid
    ├── HumanInputField
    └── FlowActionPicker
```

### 5.2 Shared Types (from @afw/shared)

**Session-related:**
- `Session`, `SessionId`, `SessionStatus`
- `Chain`, `ChainId`, `Step`, `StepNumber`
- `User`, `UserId`

**Workbench-related:**
- `WorkbenchId`
- `canWorkbenchHaveSessions(workbenchId: WorkbenchId): boolean`

**Control-related:**
- `QuickCommand`, `QuickCommandAction`
- `FlowAction` (category: 'flow' | 'action')

**Conversation-related:**
- `ButtonDefinition`, `ButtonId`
- `ClaudeCliOutputEvent`, `WorkspaceEvent`

### 5.3 Context Dependencies

**Used in SessionTile & related:**
- `useWebSocketContext()` — Real-time events (CLI output, session updates)
- `useWorkbenchContext()` — Active workbench state

**Used in WorkbenchLayout:**
- `useWorkbenchContext()` — Workbench routing
- `useSessionArchive()` — Archive workbench state

**Used in SessionSidebar:**
- `useSessionSidebar()` — Session data fetching + notification counts

### 5.4 Service Dependencies

**claudeCliService:**
- Used by: `SessionCliPanel`
- Methods:
  - `sendInput(sessionId: SessionId, input: string): Promise<void>`

---

## 6. Layout Dimensions & Constraints

### 6.1 Fixed Dimensions

| Component | Dimension | Value |
|-----------|-----------|-------|
| TopBar | height | ~60px (varies by implementation) |
| SessionSidebar (collapsed) | width | 40px |
| SessionSidebar (expanded) | width | 280px |
| BottomControlPanel | height | 120px |
| SessionTile Header | height | 40px |
| SessionTile Header (compact) | height | 36px |

### 6.2 Percentage-Based Layout (SessionTile)

| Section | Dimension | Value |
|---------|-----------|-------|
| Left Panel | width | 25% |
| Right Panel | width | 75% |
| Details Section (left panel) | height | 40% |
| CLI Section (left panel) | height | 60% |

### 6.3 Responsive Breakpoints

| Breakpoint | Behavior |
|------------|----------|
| 800px | SessionTile stacks vertically (left panel: 40% height, right panel: 60% height) |
| 768px | WorkbenchLayout padding reduced to 0.75rem, SessionSidebar expanded width: 240px |
| 480px | WorkbenchLayout padding: 0.5rem, SessionSidebar margin removed |

### 6.4 Z-Index Layers

| Component | Z-Index | Purpose |
|-----------|---------|---------|
| SessionSidebar | 1000 | Fixed position at left edge |
| SlidingWindow backdrop | (implicit) | Modal overlay for ConversationPanel |
| TopBar | (implicit) | Header bar at top |

---

## 7. Reusable Components Inventory

### 7.1 Fully Reusable (No Session-Specific Logic)

| Component | Location | Props Interface |
|-----------|----------|-----------------|
| SlidingWindow | SessionTile/ | isOpen, onClose, title, width, children |
| FlowActionPicker | BottomControlPanel/ | flows, actions, recentItems, onSelect, disabled |
| QuickCommandGrid | BottomControlPanel/ | commands, onExecute, maxVisible, disabled |
| HumanInputField | BottomControlPanel/ | placeholder, onSubmit, disabled, sessionId |

### 7.2 Session-Bound (Requires Session Data)

| Component | Location | Key Dependencies |
|-----------|----------|------------------|
| SessionTile | SessionTile/ | Session object, callbacks |
| SessionDetailsPanel | SessionTile/ | Session object |
| SessionCliPanel | SessionTile/ | SessionId, WebSocket context |
| HybridFlowViz | SessionTile/ | SessionId, Chain object |
| ConversationPanel | ConversationPanel/ | Session object, onSubmitInput |

### 7.3 Layout Containers (Composable)

| Component | Location | Purpose |
|-----------|----------|---------|
| SessionTileGrid | Workbench/ | Grid layout for 1-4 SessionTiles |
| WorkWorkbench | Workbench/ | Header + SessionTileGrid wrapper |
| WorkbenchLayout | Workbench/ | Top-level shell with routing |

---

## 8. Data Flow Patterns

### 8.1 Session Attachment Flow

```
SessionSidebar click
  → useSessionSidebar.attachSession(sessionId)
    → WorkbenchLayout.handleAttachSession(sessionId)
      → Fetch session data from API
      → Add to attachedSessions state
      → Set as activeSessionId
        → Pass to WorkWorkbench
          → Pass to SessionTileGrid
            → Render SessionTile
```

### 8.2 CLI Input Flow

```
SessionCliPanel input
  → User types command + Enter
    → claudeCliService.sendInput(sessionId, command)
      → Backend processes command
        → WebSocket event: claude-cli:output
          → useWebSocketContext.onEvent()
            → SessionCliPanel writes to xterm.js
```

### 8.3 Conversation Input Flow

```
ConversationPanel input
  → User types message + Send
    → onSubmitInput(input)
      → WorkbenchLayout.handleSessionInput(sessionId, input)
        → TODO: Send to backend via WebSocket/claudeCliService
```

### 8.4 Flow/Action Selection Flow

```
FlowActionPicker dropdown
  → User selects flow or action
    → onSelect(item: FlowAction)
      → WorkbenchLayout.handleSelectFlow(item)
        → TODO: Execute flow/action on activeSessionId
```

---

## 9. Key Design Patterns

### 9.1 Layout Patterns

**Fixed Shell Layout:**
- TopBar + SessionSidebar + Main Content + BottomControlPanel
- SessionSidebar is fixed position (overlays main content)
- Main content has left margin when sidebar is present

**Panel Split Pattern (SessionTile):**
- Horizontal split: Left 25% / Right 75%
- Left panel vertical split: Top 40% / Bottom 60%
- Responsive: Stacks vertically below 800px

**Grid Adaptation (SessionTileGrid):**
- Dynamic grid calculation based on session count
- Compact mode for 3+ sessions
- Maximum 4 sessions displayed (warning for 5+)

### 9.2 Interaction Patterns

**Auto-Hide Sidebar:**
- Collapses to 40px strip
- Expands to 280px on hover
- Smooth transition with reduced-motion support

**Sliding Overlay:**
- SlidingWindow slides in from right edge
- Resizable with mouse drag
- Backdrop click or Escape key to close

**Focus Management:**
- Focus trap in SlidingWindow
- Auto-focus search input in FlowActionPicker
- Auto-focus command input in SessionCliPanel

### 9.3 State Management Patterns

**Controlled Components:**
- SessionTile: Receives session data via props
- ConversationPanel: Receives session + onSubmitInput callback
- FlowActionPicker: Controlled dropdown with internal filter state

**Derived State:**
- SessionDetailsPanel: Computes relative time, duration, status color from session
- SessionTileGrid: Computes layout config from session count

**Local State:**
- SlidingWindow: Persistent width (localStorage)
- FlowActionPicker: Search query, selected index
- ConversationPanel: Message history (derived from session + local submissions)

---

## 10. Gaps & Missing Pieces

### 10.1 Incomplete Integrations

1. **Flow/Action Execution:**
   - FlowActionPicker has TODO: "Execute flow/action on the active session"
   - No backend API for triggering flows/actions

2. **Session Input Submission:**
   - ConversationPanel has TODO: "Send input to backend via WebSocket"
   - SessionInput flow is incomplete

3. **Quick Commands:**
   - QuickCommandGrid has empty commands array in WorkbenchLayout
   - No command registry or backend integration

4. **Dynamic Flow/Action Data:**
   - WorkbenchLayout uses static arrays (ACTIONFLOWS_FLOWS, ACTIONFLOWS_ACTIONS)
   - TODO: "Replace with backend API when flows endpoint is implemented"

### 10.2 Architectural Limitations

1. **SessionTile Panel Resizing:**
   - Left panel width is state variable (`leftPanelWidth`) but no UI for resizing
   - No resize handle or drag functionality

2. **Multi-Session Context:**
   - BottomControlPanel is global (not per-session)
   - Input always goes to `activeSessionId` (no per-tile input)

3. **ConversationPanel Message History:**
   - Message extraction from session.chains is simplistic
   - No pagination or virtualization for long histories

4. **SessionSidebar Data Source:**
   - useSessionSidebar hook sources unclear (not included in inventory)
   - Notification count logic not visible

---

## 11. Component Props Summary Table

| Component | Key Props | Optional Props |
|-----------|-----------|----------------|
| **SessionTile** | session, onClose, onDetach, onSubmitInput | compact, onNodeClick, onAgentClick, showAgents |
| **SessionDetailsPanel** | session | compact |
| **SessionCliPanel** | sessionId | height, onCommand |
| **HybridFlowViz** | sessionId, chain | chainId, onNodeClick, onAgentClick, showAgents, enableAnimations, overlayPosition, overlayOpacity |
| **ConversationPanel** | session, onSubmitInput | (none) |
| **SlidingWindow** | isOpen, onClose, children | title, width, minWidth, maxWidth |
| **SessionSidebar** | — | onAttachSession, activeSessionId |
| **WorkbenchLayout** | — | children |
| **WorkWorkbench** | sessions | onSessionClose, onSessionDetach, onSessionInput, onNodeClick, onAgentClick |
| **SessionTileGrid** | sessions | onSessionClose, onSessionDetach, onSessionInput, onNodeClick, onAgentClick |
| **BottomControlPanel** | onSubmitInput, onExecuteCommand, onSelectFlow | sessionId, flows, actions, commands, disabled |
| **FlowActionPicker** | flows, actions, onSelect | recentItems, disabled |
| **QuickCommandGrid** | onExecute | commands, maxVisible, disabled |
| **HumanInputField** | onSubmit | placeholder, disabled, sessionId |

---

## 12. Recommendations

### 12.1 For Migration to 25/75 Vertical Split

**High Priority:**
1. **Extract SessionDetailsPanel + SessionCliPanel** from SessionTile
   - Make them standalone components in left panel (25%)
2. **Add ConversationPanel** to left panel stack
   - Currently in SlidingWindow overlay, should be persistent panel
3. **Add Smart Prompt Library** component
   - New component with flow buttons grid
   - Position below conversation panel
4. **Add Folder Hierarchy** component
   - New component for workspace navigation
   - Position at bottom of left panel
5. **Move HybridFlowViz** to right panel (75%)
   - Already isolated, just change parent container

**Reusable Components for Left Panel:**
- SessionDetailsPanel (already exists, needs minimal changes)
- SessionCliPanel (already exists, standalone)
- ConversationPanel (exists, extract from SlidingWindow)
- FlowActionPicker (exists, adapt for vertical layout)
- New: FolderHierarchy component

**Layout Changes:**
- SessionTile becomes simpler (just header + content wrapper)
- Left panel becomes stacked sections with fixed/flex heights
- Right panel becomes full-height visualization area
- Remove SlidingWindow overlay (ConversationPanel is now persistent)

### 12.2 For State Management

**Consider:**
1. **Session Context** — Centralize active session state
2. **Panel Sizing Context** — Manage left/right split percentage
3. **Conversation History Store** — Persist conversation messages separately

### 12.3 For Performance

**Optimizations:**
1. Virtualize message lists in ConversationPanel
2. Memoize SessionDetailsPanel computed values
3. Debounce SessionSidebar hover expansion
4. Lazy load FlowVisualization when panel is off-screen

---

## Learnings

**Issue:** SessionTile layout is hardcoded as horizontal split (25/75 left/right) with nested vertical split in left panel (40/60 details/CLI).

**Root Cause:** Current design treats SessionTile as monolithic container for all session UI. The planned redesign requires breaking SessionTile into composable panel components.

**Suggestion:**
1. Extract left panel components (SessionDetailsPanel, SessionCliPanel) as standalone reusable panels
2. Create new panel components (ConversationPanel, SmartPromptLibrary, FolderHierarchy)
3. Build new layout container (e.g., SessionPanelLayout) that composes these panels in 25/75 vertical split
4. Deprecate SessionTile or refactor it to use new panel system

**[FRESH EYE]** The BottomControlPanel contains FlowActionPicker which duplicates functionality planned for the Smart Prompt Library. Consider whether bottom panel should be removed or repurposed once left panel has flow buttons. Also, the static flow/action data in WorkbenchLayout suggests a missing backend registry system — this should be addressed before finalizing UI redesign.
