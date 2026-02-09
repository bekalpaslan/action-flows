# Implementation Plan: 25/75 Vertical Split Session Panel Architecture

## Overview

This plan outlines the migration from the current horizontal SessionTile layout (25% left panel / 75% right panel within a tile) to a new persistent vertical split panel architecture where the left 25% of the screen contains a stacked panel system for session control/conversation, and the right 75% contains the flow visualization workspace. The redesign extracts existing panels from SessionTile, creates new smart prompt and folder hierarchy panels, and reorganizes the layout to support persistent multi-panel workflows.

**Key Architectural Shift:**
- **From:** SessionTile as monolithic container with overlay conversation panel
- **To:** WorkbenchLayout-level persistent split with composable left panel stack + right visualization area

---

## Component Architecture

### Top-Level Layout Structure

```
WorkbenchLayout
├── TopBar (existing, unchanged)
├── SessionSidebar (existing, unchanged)
├── Main Content Area
│   ├── SessionPanelLayout (NEW — replaces SessionTile container)
│   │   ├── LeftPanelStack (NEW — 25% width, vertical panels)
│   │   │   ├── SessionInfoPanel (refactored SessionDetailsPanel)
│   │   │   ├── CliPanel (refactored SessionCliPanel)
│   │   │   ├── ConversationPanel (extracted from SlidingWindow)
│   │   │   ├── SmartPromptLibrary (NEW — flow/checklist buttons)
│   │   │   └── FolderHierarchy (NEW — workspace navigation)
│   │   └── RightVisualizationArea (NEW — 75% width)
│   │       └── HybridFlowViz (existing, repositioned)
│   └── ResizeHandle (NEW — between left/right panels)
└── BottomControlPanel (existing — to be deprecated/removed)
```

---

## New Components to Create

### 1. SessionPanelLayout

**Purpose:** Top-level container for the 25/75 split layout, replacing SessionTile as the session container.

**File Path:** `D:/ActionFlowsDashboard/packages/app/src/components/SessionPanel/SessionPanelLayout.tsx`

**Props Interface:**
```typescript
interface SessionPanelLayoutProps {
  session: Session;
  onSessionClose?: () => void;
  onSessionDetach?: () => void;
  onSubmitInput?: (input: string) => Promise<void>;
  onNodeClick?: (nodeId: string) => void;
  onAgentClick?: (agentId: string) => void;
  onSelectFlow?: (flow: FlowAction) => void;
  flows?: FlowAction[];
  actions?: FlowAction[];
  showAgents?: boolean;
  defaultSplitRatio?: number; // default: 25 (left panel percentage)
}
```

**Responsibilities:**
- Manage left/right split ratio (resizable)
- Persist split ratio to localStorage: `session-panel-split-ratio`
- Provide resize handle with drag interaction
- Pass session context to all child panels
- Coordinate panel callbacks (input submission, flow selection)

**State:**
```typescript
const [splitRatio, setSplitRatio] = useState(25); // Percentage for left panel
const [isDragging, setIsDragging] = useState(false);
```

**Layout Style:**
- `display: flex`
- `flex-direction: row`
- `height: 100%`
- Left panel: `width: {splitRatio}%`
- Right panel: `width: {100 - splitRatio}%`
- Min width for left: `280px` (prevents collapse below usable size)
- Max width for left: `50%` (prevents right panel from being too narrow)

---

### 2. LeftPanelStack

**Purpose:** Vertical stacking container for all left-side panels with configurable panel heights.

**File Path:** `D:/ActionFlowsDashboard/packages/app/src/components/SessionPanel/LeftPanelStack.tsx`

**Props Interface:**
```typescript
interface LeftPanelStackProps {
  session: Session;
  onSubmitInput?: (input: string) => Promise<void>;
  onSelectFlow?: (flow: FlowAction) => void;
  flows?: FlowAction[];
  actions?: FlowAction[];
  panelHeights?: PanelHeightConfig; // Optional custom heights
}

interface PanelHeightConfig {
  sessionInfo?: number | string; // e.g., 120 (px) or '15%'
  cli?: number | string;          // e.g., 200 or '25%'
  conversation?: number | string; // e.g., 'flex-1' (grows to fill)
  smartPrompt?: number | string;  // e.g., 180 or '20%'
  folderHierarchy?: number | string; // e.g., 200 or '15%'
}
```

**Default Panel Heights:**
- SessionInfoPanel: `120px` (fixed — 4-5 info rows)
- CliPanel: `200px` (fixed — 10-12 terminal lines)
- ConversationPanel: `flex: 1` (grows to fill available space)
- SmartPromptLibrary: `180px` (fixed — 3 rows of buttons at 60px each)
- FolderHierarchy: `200px` (fixed — 8-10 folder items)

**Responsibilities:**
- Stack panels vertically with specified heights
- Manage panel collapse/expand state (optional future enhancement)
- Pass session + callbacks to child panels
- Handle overflow (scrollable panels where needed)

**State:**
```typescript
const [collapsedPanels, setCollapsedPanels] = useState<Set<string>>(new Set());
```

**Layout Style:**
- `display: flex`
- `flex-direction: column`
- `height: 100%`
- `overflow: hidden`
- Child panels use `flex-shrink: 0` for fixed heights, `flex: 1` for flexible heights

---

### 3. SessionInfoPanel (refactored SessionDetailsPanel)

**Purpose:** Display session metadata in a compact, horizontally-optimized layout.

**File Path:** `D:/ActionFlowsDashboard/packages/app/src/components/SessionPanel/SessionInfoPanel.tsx`

**Migration:** Refactor existing `SessionDetailsPanel.tsx` to optimize for narrow vertical panel.

**Props Interface:**
```typescript
interface SessionInfoPanelProps {
  session: Session;
  compact?: boolean; // Inherited, but less relevant in fixed panel
}
```

**Layout Changes:**
- Remove internal scrolling (fixed height panel)
- Optimize info rows for narrow width (160-280px typical width)
- Use truncation for long paths/IDs
- Keep copy-to-clipboard for session ID
- Status badge at top (full width, prominent)
- Info grid: 2 columns for key-value pairs where space allows

**Visual Design:**
- Background: `#1a1a1a`
- Border-bottom: `1px solid #333`
- Padding: `12px`
- Font size: `12px` (labels), `14px` (values)

---

### 4. CliPanel (refactored SessionCliPanel)

**Purpose:** Persistent terminal display for session CLI output.

**File Path:** `D:/ActionFlowsDashboard/packages/app/src/components/SessionPanel/CliPanel.tsx`

**Migration:** Extract from SessionTile and adapt for fixed-height panel.

**Props Interface:**
```typescript
interface CliPanelProps {
  sessionId: SessionId;
  height?: number | string; // Passed from LeftPanelStack
  onCommand?: (command: string) => void;
  collapsible?: boolean; // Future: Allow collapse to title bar
}
```

**Layout Changes:**
- Terminal container: `height: calc(100% - 40px)` (reserve 40px for input)
- Command input at bottom (fixed position within panel)
- xterm.js viewport: auto-scroll, fit to container
- Header bar with "CLI" label + collapse button (if collapsible)

**Visual Design:**
- Background: `#0a0a0a`
- Border-bottom: `1px solid #333`
- No internal borders (seamless terminal)

---

### 5. ConversationPanel (extracted from SlidingWindow)

**Purpose:** Persistent conversation history and input field, no longer an overlay.

**File Path:** `D:/ActionFlowsDashboard/packages/app/src/components/SessionPanel/ConversationPanel.tsx`

**Migration:** Adapt existing `ConversationPanel.tsx` for persistent panel layout (remove SlidingWindow wrapper).

**Props Interface:**
```typescript
interface ConversationPanelProps {
  session: Session;
  onSubmitInput: (input: string) => Promise<void>;
  height?: number | string; // Passed from LeftPanelStack
  collapsible?: boolean; // Future: Allow collapse to title bar
}
```

**Layout Changes:**
- Remove SlidingWindow dependency
- Add header bar with "Conversation" label + message count
- Messages container: `flex: 1; overflow-y: auto`
- Input area at bottom: `height: 80px` (text area + send button)
- Auto-scroll to bottom on new messages (existing behavior)

**Visual Design:**
- Background: `#1e1e1e`
- Border-bottom: `1px solid #333`
- Message bubbles: assistant (left-aligned, `#2a2a2a`), user (right-aligned, `#1a4d7a`)
- Input area: `#1a1a1a` background, `#404040` border

---

### 6. SmartPromptLibrary

**Purpose:** Button grid for invoking flows, checklists, and saved prompts. Replaces/extends FlowActionPicker functionality.

**File Path:** `D:/ActionFlowsDashboard/packages/app/src/components/SessionPanel/SmartPromptLibrary.tsx`

**Props Interface:**
```typescript
interface SmartPromptLibraryProps {
  flows: FlowAction[];
  actions: FlowAction[];
  checklists?: ChecklistItem[]; // Future: Checklist registry
  humanPrompts?: HumanPromptItem[]; // Future: Saved prompt templates
  onSelectFlow: (item: FlowAction) => void;
  onSelectChecklist?: (item: ChecklistItem) => void;
  onSelectPrompt?: (item: HumanPromptItem) => void;
  height?: number | string; // Passed from LeftPanelStack
}

interface ChecklistItem {
  id: string;
  name: string;
  icon?: string;
  category: 'pre-commit' | 'review' | 'deploy' | 'security';
  items: string[]; // Checklist items
}

interface HumanPromptItem {
  id: string;
  name: string;
  icon?: string;
  prompt: string; // Template with {placeholders}
  category: 'debug' | 'refactor' | 'feature';
}
```

**Layout Structure:**
```
SmartPromptLibrary
├── Header ("Smart Prompts" + search icon)
├── Tabs (Flows | Actions | Checklists | Prompts)
└── Button Grid (scrollable)
    └── Button (icon + label, 60px height, 100% width)
```

**Interaction:**
- Clicking a button appends flow/checklist/prompt context to the active input field (ConversationPanel or CliPanel)
- Supports search/filter (similar to FlowActionPicker)
- Grouped by category (collapsible sections)
- Recent/favorites at top (persistent localStorage)

**Visual Design:**
- Background: `#1a1a1a`
- Border-bottom: `1px solid #333`
- Buttons: `#2a2a2a` background, `#4a9eff` on hover, `#1a4d7a` when active
- Icon + label layout: icon left (24px), label right (truncate if needed)

**Data Source:**
- Flows/actions: Passed from WorkbenchLayout (static for now, backend registry in future)
- Checklists: To be implemented (registry at `.claude/actionflows/checklists/`)
- Human prompts: To be implemented (registry at `.claude/actionflows/prompts/`)

---

### 7. FolderHierarchy

**Purpose:** Workspace navigation panel showing project folder structure, quick file access.

**File Path:** `D:/ActionFlowsDashboard/packages/app/src/components/SessionPanel/FolderHierarchy.tsx`

**Props Interface:**
```typescript
interface FolderHierarchyProps {
  workspaceRoot: string; // From session.workingDirectory
  onFileSelect?: (filePath: string) => void; // Future: Open in editor
  height?: number | string; // Passed from LeftPanelStack
}
```

**Layout Structure:**
```
FolderHierarchy
├── Header ("Workspace" + root path)
├── Search/Filter Input
└── Tree View (scrollable)
    ├── Folder (collapsible)
    │   ├── File (clickable)
    │   └── Subfolder (collapsible)
    └── File (clickable)
```

**Interaction:**
- Click folder: Toggle expand/collapse
- Click file: Emit onFileSelect event (future: open in editor workbench)
- Right-click: Context menu (copy path, reveal in system file explorer)
- Search: Filter by file name (highlight matches)

**Data Source:**
- Fetch folder structure from backend API: `GET /api/workspace/:sessionId/files`
- Cache structure, refresh on file system events (if backend supports WebSocket updates)

**Visual Design:**
- Background: `#1a1a1a`
- Tree item: `#2a2a2a` on hover, `#1a4d7a` when selected
- Indent: `16px` per level
- Icons: Folder (📁), file (📄), special file types (e.g., .ts → TypeScript icon)

**Implementation Note:**
- Phase 1: Mock data (static tree from session.workingDirectory)
- Phase 2: Backend integration (file watcher + WebSocket updates)

---

### 8. RightVisualizationArea

**Purpose:** Container for HybridFlowViz, isolating visualization from left panel concerns.

**File Path:** `D:/ActionFlowsDashboard/packages/app/src/components/SessionPanel/RightVisualizationArea.tsx`

**Props Interface:**
```typescript
interface RightVisualizationAreaProps {
  session: Session;
  onNodeClick?: (nodeId: string) => void;
  onAgentClick?: (agentId: string) => void;
  showAgents?: boolean;
}
```

**Responsibilities:**
- Render HybridFlowViz at full width/height
- Pass through callbacks for node/agent clicks
- Future: Support multiple visualization modes (ReactFlow DAG, Gantt timeline, dependency graph)

**Layout Style:**
- `width: 100%; height: 100%`
- `position: relative` (for overlay positioning)
- Background: `#1a1a1a`

---

### 9. ResizeHandle

**Purpose:** Draggable handle for resizing left/right split ratio.

**File Path:** `D:/ActionFlowsDashboard/packages/app/src/components/SessionPanel/ResizeHandle.tsx`

**Props Interface:**
```typescript
interface ResizeHandleProps {
  onDrag: (deltaX: number) => void; // Emit drag delta in pixels
  onDragStart?: () => void;
  onDragEnd?: () => void;
}
```

**Interaction:**
- Drag horizontal: Adjust split ratio
- Double-click: Reset to default (25%)
- Keyboard: Arrow keys adjust by 1%

**Visual Design:**
- Width: `4px`
- Background: `#333` (idle), `#4a9eff` (hover/drag)
- Cursor: `col-resize`
- z-index: `10` (above panels)

---

## Component Tree Summary

```
SessionPanelLayout
├── LeftPanelStack
│   ├── SessionInfoPanel (refactored SessionDetailsPanel)
│   ├── CliPanel (refactored SessionCliPanel)
│   ├── ConversationPanel (extracted from SlidingWindow)
│   ├── SmartPromptLibrary (NEW)
│   └── FolderHierarchy (NEW)
├── ResizeHandle (NEW)
└── RightVisualizationArea (NEW)
    └── HybridFlowViz (existing, repositioned)
```

---

## Migration Strategy for Existing Components

### SessionTile → Deprecated

**Current Role:** Monolithic container for all session UI (details, CLI, flow viz, conversation overlay).

**Migration Path:**
1. **Phase 1:** Create SessionPanelLayout alongside SessionTile (both coexist).
2. **Phase 2:** Update WorkbenchLayout to use SessionPanelLayout instead of SessionTile.
3. **Phase 3:** Remove SessionTile after validation.

**Deprecation Timeline:**
- Week 1: Implement SessionPanelLayout + LeftPanelStack + new panels.
- Week 2: Migrate WorkbenchLayout to use SessionPanelLayout.
- Week 3: Remove SessionTile, SlidingWindow.

---

### SessionDetailsPanel → SessionInfoPanel

**Changes:**
- Rename file: `SessionDetailsPanel.tsx` → `SessionInfoPanel.tsx`
- Optimize layout for narrow vertical panel (160-280px width)
- Remove internal scrolling (fixed height)
- Simplify compact mode (less relevant in fixed panel)

**API Compatibility:** Props interface unchanged (only `session` + optional `compact`).

---

### SessionCliPanel → CliPanel

**Changes:**
- Rename file: `SessionCliPanel.tsx` → `CliPanel.tsx`
- Add header bar with "CLI" label (8px padding)
- Adjust terminal height calculation: `calc(100% - 48px)` (header + input)
- Add collapsible state (future enhancement)

**API Compatibility:** Props interface unchanged (only `sessionId` + optional `height`).

---

### ConversationPanel → Extracted from SlidingWindow

**Changes:**
- Remove SlidingWindow wrapper entirely
- Add header bar with "Conversation" label + message count
- Adjust layout for persistent panel (not overlay)
- Messages container becomes `flex: 1; overflow-y: auto`
- Input area remains at bottom (80px height)

**API Compatibility:** Props interface unchanged (only `session` + `onSubmitInput`).

---

### HybridFlowViz → Repositioned

**Changes:**
- No internal changes to component logic
- Parent container changes from SessionTile right panel to RightVisualizationArea
- Props remain identical

**API Compatibility:** Fully compatible, no migration needed.

---

### BottomControlPanel → To Be Deprecated

**Current Role:** Global input field + quick commands + flow picker.

**Replacement:**
- **HumanInputField** → Merged into ConversationPanel input area
- **FlowActionPicker** → Replaced by SmartPromptLibrary
- **QuickCommandGrid** → Deprecated (commands integrated into CLI or conversation)

**Migration Path:**
1. **Phase 1:** Implement SmartPromptLibrary with full flow/action/checklist support.
2. **Phase 2:** Integrate conversation input into ConversationPanel.
3. **Phase 3:** Remove BottomControlPanel after validation.

**Deprecation Timeline:**
- Week 2: Remove BottomControlPanel from WorkbenchLayout.
- Week 3: Delete component files.

---

## File Structure

### New Directory Layout

```
packages/app/src/components/
├── SessionPanel/ (NEW)
│   ├── SessionPanelLayout.tsx
│   ├── SessionPanelLayout.css
│   ├── LeftPanelStack.tsx
│   ├── LeftPanelStack.css
│   ├── SessionInfoPanel.tsx (refactored from SessionDetailsPanel)
│   ├── SessionInfoPanel.css
│   ├── CliPanel.tsx (refactored from SessionCliPanel)
│   ├── CliPanel.css
│   ├── ConversationPanel.tsx (moved from ../ConversationPanel/)
│   ├── ConversationPanel.css
│   ├── SmartPromptLibrary.tsx (NEW)
│   ├── SmartPromptLibrary.css
│   ├── FolderHierarchy.tsx (NEW)
│   ├── FolderHierarchy.css
│   ├── RightVisualizationArea.tsx (NEW)
│   ├── RightVisualizationArea.css
│   ├── ResizeHandle.tsx (NEW)
│   ├── ResizeHandle.css
│   └── index.ts (exports all panel components)
├── SessionTile/ (TO BE DEPRECATED)
│   ├── SessionTile.tsx
│   ├── SessionDetailsPanel.tsx → Migrate to SessionPanel/SessionInfoPanel.tsx
│   ├── SessionCliPanel.tsx → Migrate to SessionPanel/CliPanel.tsx
│   ├── SlidingWindow.tsx → Delete (no longer needed)
│   └── HybridFlowViz.tsx → Keep (moved to SessionPanel for imports)
├── ConversationPanel/ (TO BE MOVED)
│   ├── ConversationPanel.tsx → Move to SessionPanel/ConversationPanel.tsx
│   └── ConversationPanel.css → Move to SessionPanel/ConversationPanel.css
└── BottomControlPanel/ (TO BE DEPRECATED)
    ├── BottomControlPanel.tsx → Delete
    ├── HumanInputField.tsx → Delete (merged into ConversationPanel)
    ├── FlowActionPicker.tsx → Delete (replaced by SmartPromptLibrary)
    └── QuickCommandGrid.tsx → Delete
```

---

## Build Order & Parallel Execution Strategy

### Phase 1: Foundation (Parallel)

**Group A — Container Components (1 agent):**
- Create `SessionPanelLayout.tsx` + CSS
- Create `LeftPanelStack.tsx` + CSS
- Create `RightVisualizationArea.tsx` + CSS
- Create `ResizeHandle.tsx` + CSS

**Group B — Refactored Panels (1 agent):**
- Refactor `SessionDetailsPanel.tsx` → `SessionInfoPanel.tsx` + CSS
- Refactor `SessionCliPanel.tsx` → `CliPanel.tsx` + CSS
- Move `ConversationPanel.tsx` to SessionPanel/ + adapt layout

**Group C — New Panels (2 agents):**
- Agent 1: Create `SmartPromptLibrary.tsx` + CSS
- Agent 2: Create `FolderHierarchy.tsx` + CSS (mock data)

**Dependencies:** None (all can run in parallel).

**Deliverables:** 9 new component files + 9 CSS files.

---

### Phase 2: Integration (Sequential)

**Group D — WorkbenchLayout Integration (1 agent):**
- Update `WorkbenchLayout.tsx` to use SessionPanelLayout instead of SessionTile
- Pass session context + callbacks to SessionPanelLayout
- Add flows/actions data to SmartPromptLibrary props
- Remove BottomControlPanel from layout

**Dependencies:** Requires Phase 1 complete (all panel components exist).

**Deliverables:** Updated `WorkbenchLayout.tsx`.

---

### Phase 3: Cleanup (Sequential)

**Group E — Deprecation (1 agent):**
- Remove SessionTile component files
- Remove SlidingWindow component files
- Remove BottomControlPanel component files
- Update imports across codebase (SessionTileGrid, WorkWorkbench, etc.)
- Clean up unused CSS files

**Dependencies:** Requires Phase 2 complete (WorkbenchLayout migrated).

**Deliverables:** Deleted files, updated imports.

---

### Phase 4: Polish (Parallel)

**Group F — Enhancements (2 agents):**
- Agent 1: Add panel collapse/expand functionality to LeftPanelStack
- Agent 2: Implement FolderHierarchy backend integration (file watcher API)

**Dependencies:** Requires Phase 3 complete (cleanup done).

**Deliverables:** Enhanced features, backend API integration.

---

## Parallel Coding Agent Breakdown

### Batch 1: Core Panel Components (3 agents, parallel)

**Agent 1 — Layout Containers:**
- Input: Analysis report, SessionTile current structure, WorkbenchLayout context
- Tasks:
  - Create `SessionPanelLayout.tsx` with split ratio logic + resize handling
  - Create `LeftPanelStack.tsx` with vertical stacking + height management
  - Create `RightVisualizationArea.tsx` as simple wrapper for HybridFlowViz
  - Create `ResizeHandle.tsx` with drag interaction
- Output: 4 component files + 4 CSS files

**Agent 2 — Refactored Panels:**
- Input: Analysis report, SessionDetailsPanel source, SessionCliPanel source, ConversationPanel source
- Tasks:
  - Refactor SessionDetailsPanel → SessionInfoPanel (narrow layout optimization)
  - Refactor SessionCliPanel → CliPanel (add header bar)
  - Move ConversationPanel to SessionPanel/ (remove SlidingWindow wrapper)
- Output: 3 refactored component files + 3 CSS files

**Agent 3 — Smart Prompt Library:**
- Input: Analysis report, FlowActionPicker source, flow/action data structure
- Tasks:
  - Create SmartPromptLibrary component with tabs (Flows | Actions | Checklists | Prompts)
  - Implement button grid with search/filter
  - Add category grouping + recent/favorites
  - Design responsive button layout (60px height, icon + label)
- Output: 1 component file + 1 CSS file

---

### Batch 2: New Feature Panels (1 agent, parallel with Batch 1)

**Agent 4 — Folder Hierarchy:**
- Input: Analysis report, workspace API structure (if exists), file tree UI patterns
- Tasks:
  - Create FolderHierarchy component with tree view
  - Implement expand/collapse folders
  - Add search/filter by file name
  - Mock data source (static tree from session.workingDirectory)
  - Plan backend API integration (document in component comments)
- Output: 1 component file + 1 CSS file

---

### Batch 3: Integration (1 agent, sequential after Batch 1 + 2)

**Agent 5 — WorkbenchLayout Migration:**
- Input: All new panel components from Batch 1 + 2
- Tasks:
  - Update WorkbenchLayout to import SessionPanelLayout
  - Replace SessionTile usage with SessionPanelLayout
  - Pass flows/actions to SmartPromptLibrary via props
  - Remove BottomControlPanel from layout
  - Update callbacks for input submission + flow selection
- Output: Updated WorkbenchLayout.tsx

---

### Batch 4: Cleanup (1 agent, sequential after Batch 3)

**Agent 6 — Deprecation & Import Updates:**
- Input: Confirmation that SessionPanelLayout is working in WorkbenchLayout
- Tasks:
  - Delete SessionTile component files (SessionTile.tsx, SessionTile.css)
  - Delete SlidingWindow component files
  - Delete BottomControlPanel component files (BottomControlPanel.tsx, HumanInputField.tsx, FlowActionPicker.tsx, QuickCommandGrid.tsx)
  - Update imports in SessionTileGrid, WorkWorkbench, any other consumers
  - Clean up unused CSS files
- Output: Deleted files, updated imports, clean component tree

---

## Dependency Graph

```
Phase 1 (Parallel):
  Agent 1: Layout Containers (SessionPanelLayout, LeftPanelStack, RightVisualizationArea, ResizeHandle)
  Agent 2: Refactored Panels (SessionInfoPanel, CliPanel, ConversationPanel)
  Agent 3: Smart Prompt Library
  Agent 4: Folder Hierarchy
    ↓
Phase 2 (Sequential):
  Agent 5: WorkbenchLayout Integration
    ↓
Phase 3 (Sequential):
  Agent 6: Cleanup & Deprecation
    ↓
Phase 4 (Parallel, optional):
  Agent 7: Panel collapse/expand
  Agent 8: FolderHierarchy backend integration
```

---

## Props Interface Summary

### SessionPanelLayout
```typescript
{
  session: Session;
  onSessionClose?: () => void;
  onSessionDetach?: () => void;
  onSubmitInput?: (input: string) => Promise<void>;
  onNodeClick?: (nodeId: string) => void;
  onAgentClick?: (agentId: string) => void;
  onSelectFlow?: (flow: FlowAction) => void;
  flows?: FlowAction[];
  actions?: FlowAction[];
  showAgents?: boolean;
  defaultSplitRatio?: number;
}
```

### LeftPanelStack
```typescript
{
  session: Session;
  onSubmitInput?: (input: string) => Promise<void>;
  onSelectFlow?: (flow: FlowAction) => void;
  flows?: FlowAction[];
  actions?: FlowAction[];
  panelHeights?: PanelHeightConfig;
}
```

### SessionInfoPanel
```typescript
{
  session: Session;
  compact?: boolean;
}
```

### CliPanel
```typescript
{
  sessionId: SessionId;
  height?: number | string;
  onCommand?: (command: string) => void;
  collapsible?: boolean;
}
```

### ConversationPanel
```typescript
{
  session: Session;
  onSubmitInput: (input: string) => Promise<void>;
  height?: number | string;
  collapsible?: boolean;
}
```

### SmartPromptLibrary
```typescript
{
  flows: FlowAction[];
  actions: FlowAction[];
  checklists?: ChecklistItem[];
  humanPrompts?: HumanPromptItem[];
  onSelectFlow: (item: FlowAction) => void;
  onSelectChecklist?: (item: ChecklistItem) => void;
  onSelectPrompt?: (item: HumanPromptItem) => void;
  height?: number | string;
}
```

### FolderHierarchy
```typescript
{
  workspaceRoot: string;
  onFileSelect?: (filePath: string) => void;
  height?: number | string;
}
```

### RightVisualizationArea
```typescript
{
  session: Session;
  onNodeClick?: (nodeId: string) => void;
  onAgentClick?: (agentId: string) => void;
  showAgents?: boolean;
}
```

### ResizeHandle
```typescript
{
  onDrag: (deltaX: number) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}
```

---

## Risks & Mitigation

### Risk 1: Breaking Changes to SessionTile Consumers

**Impact:** Medium. SessionTileGrid, WorkWorkbench, and any other components using SessionTile will break.

**Mitigation:**
- Phase 1: Create SessionPanelLayout alongside SessionTile (both coexist).
- Phase 2: Migrate WorkbenchLayout first, test thoroughly.
- Phase 3: Remove SessionTile only after all consumers are migrated.
- Keep SessionTile props interface similar to SessionPanelLayout for easier migration.

---

### Risk 2: ConversationPanel State Loss

**Impact:** Medium. Moving ConversationPanel from overlay to persistent panel may lose message history state.

**Mitigation:**
- Ensure ConversationPanel reads message history from session object (not local state).
- Add unit tests for message extraction logic.
- Persist user submissions via backend API (future enhancement).

---

### Risk 3: FolderHierarchy Performance (Large Workspaces)

**Impact:** Medium. Rendering 10,000+ files in a tree view may cause lag.

**Mitigation:**
- Phase 1: Mock data with small tree (< 100 items).
- Phase 2: Implement virtualization (react-window or react-virtualized).
- Backend API: Paginate or lazy-load folders (expand on demand).
- Cache folder structure, refresh only on file system events.

---

### Risk 4: SmartPromptLibrary Data Source Undefined

**Impact:** Low. Checklists and human prompts registries do not exist yet.

**Mitigation:**
- Phase 1: Implement flows/actions tabs only (data already exists).
- Phase 2: Add Checklists tab (data from `.claude/actionflows/checklists/` registry).
- Phase 3: Add Prompts tab (data from `.claude/actionflows/prompts/` registry).
- Document data structure in component comments for future backend work.

---

### Risk 5: BottomControlPanel Removal Before Feature Parity

**Impact:** Medium. Removing BottomControlPanel before SmartPromptLibrary + ConversationPanel are fully functional may break user workflows.

**Mitigation:**
- Keep BottomControlPanel until Phase 2 complete (SmartPromptLibrary + ConversationPanel tested).
- Add feature flag: `ENABLE_NEW_PANEL_LAYOUT` to toggle between old/new layouts.
- Remove BottomControlPanel only after validation in production.

---

### Risk 6: Split Ratio Persistence Conflicts

**Impact:** Low. Multiple sessions may conflict with single localStorage key for split ratio.

**Mitigation:**
- Use per-session key: `session-panel-split-ratio-${sessionId}`.
- Add global default key: `session-panel-split-ratio-default` for new sessions.
- Provide reset button in UI (double-click resize handle).

---

## Verification Checklist

### Phase 1 Verification
- [ ] SessionPanelLayout renders with 25/75 split (default ratio)
- [ ] LeftPanelStack renders all 5 panels in vertical order
- [ ] SessionInfoPanel displays session metadata (ID, status, timestamps, chain count)
- [ ] CliPanel renders xterm.js terminal with command input
- [ ] ConversationPanel displays message history + input field
- [ ] SmartPromptLibrary renders flow/action buttons with search
- [ ] FolderHierarchy renders mock folder tree with expand/collapse
- [ ] RightVisualizationArea renders HybridFlowViz
- [ ] ResizeHandle allows drag to adjust split ratio
- [ ] All CSS files loaded, no styling conflicts

### Phase 2 Verification
- [ ] WorkbenchLayout uses SessionPanelLayout instead of SessionTile
- [ ] Session attachment flow works (SessionSidebar → WorkbenchLayout → SessionPanelLayout)
- [ ] Input submission works (ConversationPanel → WorkbenchLayout → backend)
- [ ] Flow selection works (SmartPromptLibrary → WorkbenchLayout → backend)
- [ ] Node click works (HybridFlowViz → WorkbenchLayout → backend)
- [ ] Agent click works (SquadPanel → WorkbenchLayout → backend)
- [ ] BottomControlPanel removed from layout
- [ ] No console errors or TypeScript errors

### Phase 3 Verification
- [ ] SessionTile component files deleted
- [ ] SlidingWindow component files deleted
- [ ] BottomControlPanel component files deleted
- [ ] No imports referencing deleted components
- [ ] Type check passes across all packages (`pnpm type-check`)
- [ ] Existing tests pass (`pnpm test`)
- [ ] No unused CSS files

### Phase 4 Verification (Optional)
- [ ] LeftPanelStack supports panel collapse/expand
- [ ] FolderHierarchy fetches data from backend API
- [ ] File watcher updates tree on file system changes
- [ ] Virtualization handles 1,000+ files without lag

---

## Implementation Notes

### TypeScript Considerations
- Import Session, SessionId, FlowAction from `@afw/shared`
- Use React.FC or function component declarations (consistent with codebase)
- Add JSDoc comments for all props interfaces
- Export components via `index.ts` barrel files

### Styling Conventions
- Use CSS modules for component-specific styles (e.g., `SessionPanelLayout.css`)
- Follow existing color palette (see analysis report for current colors)
- Dark theme by default (background: `#1a1a1a`, text: `#d4d4d4`)
- Consistent spacing: 8px base unit (padding/margin multiples of 8)
- Transitions: `150ms ease-in` (collapse), `200ms ease-out` (expand)

### Accessibility
- Add ARIA labels for all interactive elements
- Ensure keyboard navigation works (Tab, Enter, Escape)
- Focus management: trap focus in panels, restore focus after close
- Reduced motion support (respect `prefers-reduced-motion`)

### Performance
- Use React.memo for panels that don't need frequent re-renders (SessionInfoPanel, CliPanel)
- Debounce resize handle drag events (16ms throttle for 60fps)
- Virtualize FolderHierarchy tree (if > 500 items)
- Lazy load HybridFlowViz if off-screen (Intersection Observer)

---

## Future Enhancements

### Phase 5: Advanced Features
1. **Panel Reordering:** Drag-and-drop to reorder left panel stack
2. **Custom Panel Layouts:** Save/load panel height presets
3. **Multi-Session Views:** Split right visualization area (side-by-side sessions)
4. **Detachable Panels:** Pop out ConversationPanel or HybridFlowViz into separate window
5. **Theme Support:** Light mode, high contrast mode
6. **Checklist Registry:** Backend API for checklist management
7. **Prompt Templates:** Backend API for saved prompt templates

### Phase 6: Backend Integration
1. **Folder Hierarchy API:** `GET /api/workspace/:sessionId/files` (with pagination)
2. **File Watcher:** WebSocket events for file system changes
3. **Checklist Registry:** `GET /api/checklists`, `POST /api/checklists`
4. **Prompt Templates:** `GET /api/prompts`, `POST /api/prompts`
5. **Flow Execution:** `POST /api/sessions/:sessionId/execute-flow`

---

## Summary

This plan outlines a comprehensive migration from the current SessionTile monolithic layout to a new persistent 25/75 vertical split panel architecture. The redesign prioritizes:

1. **Modularity:** Each panel is a self-contained component with clear props interfaces.
2. **Reusability:** Panels can be composed in different layouts (future: detachable, reorderable).
3. **Parallel Development:** 4 agents can build core components simultaneously in Phase 1.
4. **Graceful Migration:** Old components coexist with new until validation is complete.
5. **Future-Proof:** Panel system supports advanced features (collapse, reorder, detach) without major refactoring.

**Build order enables parallel execution:**
- Phase 1: 4 agents build 9 components in parallel (no dependencies).
- Phase 2: 1 agent integrates into WorkbenchLayout (sequential).
- Phase 3: 1 agent cleans up deprecated components (sequential).
- Phase 4: 2 agents add enhancements (parallel).

**Total estimated components:**
- New: 9 components (SessionPanelLayout, LeftPanelStack, SessionInfoPanel, CliPanel, ConversationPanel, SmartPromptLibrary, FolderHierarchy, RightVisualizationArea, ResizeHandle)
- Refactored: 3 components (SessionInfoPanel from SessionDetailsPanel, CliPanel from SessionCliPanel, ConversationPanel extracted)
- Deprecated: 7 components (SessionTile, SlidingWindow, BottomControlPanel, HumanInputField, FlowActionPicker, QuickCommandGrid, SessionDetailsPanel duplicate)

**Key files created:**
- `packages/app/src/components/SessionPanel/SessionPanelLayout.tsx`
- `packages/app/src/components/SessionPanel/LeftPanelStack.tsx`
- `packages/app/src/components/SessionPanel/SessionInfoPanel.tsx`
- `packages/app/src/components/SessionPanel/CliPanel.tsx`
- `packages/app/src/components/SessionPanel/ConversationPanel.tsx`
- `packages/app/src/components/SessionPanel/SmartPromptLibrary.tsx`
- `packages/app/src/components/SessionPanel/FolderHierarchy.tsx`
- `packages/app/src/components/SessionPanel/RightVisualizationArea.tsx`
- `packages/app/src/components/SessionPanel/ResizeHandle.tsx`
- 9 corresponding CSS files

**Migration timeline:**
- Week 1: Phase 1 (parallel component builds)
- Week 2: Phase 2 (WorkbenchLayout integration) + Phase 3 (cleanup)
- Week 3: Phase 4 (polish + backend integration)
