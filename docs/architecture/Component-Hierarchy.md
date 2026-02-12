# React Component Hierarchy and Organization Analysis

**ActionFlows Dashboard Frontend**

**Analysis Date:** 2026-02-12
**Scope:** `packages/app/src/components/`
**Total Components:** 194 files (.tsx/.ts)
**Total CSS Modules:** 104 files
**Total Directories:** 61 component groups

---

## 1. Complete Component Directory Structure Map

### Top-Level Components (7)
- `AppContent.tsx` — Main app entry (delegates to WorkbenchLayout)
- `WebSocketTest.tsx` — WebSocket connection testing utility
- `ChainDemo.tsx` — Chain visualization demo
- `ChainLiveMonitor.tsx` — Real-time chain monitoring
- `GateTraceViewer.tsx` — Gate traversal trace viewer
- `HarmonyHealthDashboard.tsx` — Harmony system health overview
- `HistoryBrowser.tsx` — Session history browser

### Component Groups by Category (61 directories)

#### **Layout & Shell (7 groups, 15 components)**
1. **Workbench/** — Main layout shell (1 component)
   - `WorkbenchLayout.tsx` (739 lines) — Root template, workbench routing
2. **AppSidebar/** — Vertical navigation sidebar (5 components)
   - `AppSidebar.tsx` (313 lines), `SidebarNavGroup.tsx`, `SidebarNavItem.tsx`, `SidebarSearch.tsx`, `SidebarUserProfile.tsx`
3. **SessionSidebar/** — Session management sidebar (2 components)
   - `SessionSidebar.tsx`, `SessionSidebarItem.tsx`
4. **RegionFocus/** — Region focus dual-panel view (1 component)
   - `RegionFocusView.tsx`
5. **SlidingChatWindow/** — Overlay chat window (2 components)
   - `SlidingChatWindow.tsx`, `ChatMinimizedIndicator.tsx`
6. **SessionPane/** — Session container pane (1 component)
   - `SessionPane.tsx`
7. **SessionPanel/** — Session control panel (5 components)
   - `ChatPanel.tsx` (992 lines, **most complex**), `SessionInfoPanel.tsx`, `ReminderButtonBar.tsx`, `ResizeHandle.tsx`, `FolderHierarchy.tsx`

#### **Visualization (5 groups, 23 components)**
1. **CosmicMap/** — Living Universe visualization (13 components)
   - `CosmicMap.tsx` (460 lines, main container)
   - `RegionStar.tsx`, `LightBridgeEdge.tsx`, `CosmicBackground.tsx`
   - `SparkAnimation.tsx`, `SparkParticle.tsx`
   - `BigBangAnimation.tsx`, `CommandCenter.tsx`
   - `GateCheckpoint.tsx`, `GateCheckpointMarker.tsx`
   - `MoonOrbit.tsx`, `LiveRegion.tsx`, `TraceRenderer.tsx`
2. **FlowVisualization/** — ReactFlow chain diagrams (4 components)
   - `FlowVisualization.tsx` (234 lines), `AnimatedStepNode.tsx`, `AnimatedFlowEdge.tsx`, `SwimlaneBackground.tsx`
3. **ChainDAG/** — Directed acyclic graph visualization (3 components)
   - `ChainDAG.tsx`, `StepNode.tsx`, `layout.ts`
4. **TimelineView/** — Timeline visualization (1 component)
   - `TimelineView.tsx`
5. **SessionTree/** — Session hierarchy tree (1 component)
   - `SessionTree.tsx`

#### **Stars (Workbenches) (10 groups, 23 components)**
1. `Stars/WorkStar.tsx` — Work workbench
2. `Stars/MaintenanceStar.tsx` — Maintenance workbench
3. `Stars/ExploreStar.tsx` — Explore workbench
4. `Stars/ReviewStar.tsx` — Review workbench
5. `Stars/PMStar.tsx` — Project management workbench
6. `Stars/ArchiveStar.tsx` — Archive workbench
7. `Stars/IntelStar.tsx` — Intelligence workbench
8. `Stars/SettingsStar.tsx` — Settings workbench
9. **Stars/RespectStar/** — Contract compliance workbench (5 components)
   - `RespectStar.tsx`, `ComponentHealthCard.tsx`, `CategorySection.tsx`, `LiveSpatialMonitor.tsx`, `RespectCheckControls.tsx`
10. **Stars/StoryStar/** — Narrative documentation workbench (5 components)
    - `StoryStar.tsx`, `ChapterViewer.tsx`, `ChapterList.tsx`, `ContinueButton.tsx`, `StoryMetadata.tsx`

#### **Tools (3 groups, 3 components)**
1. `Tools/EditorTool/EditorTool.tsx` — Code editor tool
2. `Tools/CanvasTool/CanvasTool.tsx` — Canvas tool
3. `Tools/CoverageTool/CoverageTool.tsx` — Test coverage tool

#### **Harmony & Quality (4 groups, 6 components)**
1. `Harmony/` — Harmony space (2 components)
   - `HarmonySpaceWorkbench.tsx`, `GateTraceViewer.tsx`
2. `HarmonyPanel/HarmonyPanel.tsx` — Harmony status panel
3. `HarmonyBadge/HarmonyBadge.tsx` — Harmony status badge
4. `HarmonyIndicator/HarmonyIndicator.tsx` — Harmony status indicator

#### **Communication & Interaction (7 groups, 18 components)**
1. `ConversationPanel/ConversationPanel.tsx` — Chat conversation interface
2. **DiscussButton/** — Context-aware discuss button (2 components)
   - `DiscussButton.tsx`, `DiscussDialog.tsx`
3. `OrchestratorButton/OrchestratorButton.tsx` — Orchestrator activation button
4. **CustomPromptButton/** — Custom prompt button (2 components)
   - `CustomPromptDialog.tsx`, `CustomPromptDialog.test.tsx`
5. **InlineButtons/** — Inline action buttons (2 components)
   - `InlineButtons.tsx`, `InlineButtonItem.tsx`
6. **PersistentToolbar/** — Persistent toolbar (2 components)
   - `PersistentToolbar.tsx`, `PersistentToolbarButton.tsx`
7. **QuickActionBar/** — Quick action bar (2 components)
   - `QuickActionBar.tsx`, `QuickActionButton.tsx`

#### **Intelligence & Data (4 groups, 19 components)**
1. **IntelDossier/** — Intelligence dossier system (12 components)
   - `DossierList.tsx`, `DossierCard.tsx`, `DossierView.tsx`, `DossierCreationDialog.tsx`, `WidgetRenderer.tsx`
   - **widgets/** (7 widgets): `StatCardWidget`, `InsightCardWidget`, `AlertPanelWidget`, `CodeHealthMeterWidget`, `FileTreeWidget`, `SnippetPreviewWidget`, `UnknownWidget`
2. **RegistryBrowser/** — Registry browser (3 components)
   - `RegistryBrowser.tsx`, `RegistryEntryCard.tsx`, `PackCard.tsx`
3. `SessionArchive/SessionArchive.tsx` — Session archive
4. `TelemetryViewer/TelemetryViewer.tsx` — Telemetry viewer

#### **Development Tools (6 groups, 18 components)**
1. **CodeEditor/** — Code editor (3 components)
   - `DiffView.tsx`, `EditorTabs.tsx`, `ConflictDialog.tsx`
2. **FileExplorer/** — File explorer (2 components)
   - `FileTree.tsx`, `FileIcon.tsx`
3. `Terminal/TerminalPanel.tsx` — Terminal panel
4. **ClaudeCliTerminal/** — Claude CLI terminal (5 components)
   - `ClaudeCliTerminal.tsx`, `ClaudeCliStartDialog.tsx`, `ProjectSelector.tsx`, `ProjectForm.tsx`, `DiscoveredSessionsList.tsx`
5. `StepInspector/StepInspector.tsx` — Step inspector
6. **SquadPanel/** — Agent squad panel (7 components)
   - `SquadPanel.tsx`, `SquadPanelDemo.tsx`, `AgentRow.tsx`, `AgentAvatar.tsx`, `AgentCharacterCard.tsx` (with test), `AgentLogPanel.tsx`, `LogBubble.tsx`

#### **UI Components (12 groups, 22 components)**
1. **CommandPalette/** — Command palette (3 components)
   - `CommandPalette.tsx`, `CommandPaletteInput.tsx`, `CommandPaletteResults.tsx`
2. **CommandCenter/** — Command center (3 components)
   - `ChainStatusIndicator.tsx`, `DiscoveryHint.tsx`, `discoveryConfig.ts`
3. **Settings/** — Settings panels (4 components)
   - `QuickActionSettings.tsx`, `FeatureFlagSettings.tsx`, `EvolutionSettings.tsx`, `PerformanceSettings.tsx`
4. `ErrorModal/ErrorModal.tsx` — Error modal
5. `DisambiguationModal/DisambiguationModal.tsx` — Disambiguation modal
6. `Toast/Toast.tsx` — Toast notifications
7. `Notifications/` — Notification system (directory exists)
8. `ThemeToggle/ThemeToggle.tsx` — Theme toggle
9. `VimModeIndicator/VimModeIndicator.tsx` — Vim mode indicator
10. `ControlButtons/ControlButtons.tsx` — Control buttons
11. **ChangePreview/** — Change preview (2 components)
    - `ChangePreview.tsx`, `types.ts`
12. `ChainBadge/ChainBadge.tsx` — Chain badge

#### **Common & Shared (5 groups, 7 components)**
1. `common/GlowIndicator.tsx` — Animated glow wrapper
2. **StarBookmark/** — Star bookmark (2 components)
   - `StarBookmark.tsx`, `StarBookmarkDialog.tsx`
3. `ModifierCard/ModifierCard.tsx` — Modifier card
4. `SessionTile/HybridFlowViz.tsx` — Session tile
5. `Onboarding/UniverseOnboarding.tsx` — Onboarding

---

## 2. Component Categorization (Atomic Design)

### Atoms (36 components — 18.6%)
**Definition:** Basic building blocks with no child components, minimal logic.

**Visual Indicators (7):**
- `common/GlowIndicator` — Animated glow wrapper (77 lines)
- `ChainBadge` — Chain status badge
- `HarmonyBadge` — Harmony status badge
- `HarmonyIndicator` — Harmony status indicator
- `VimModeIndicator` — Vim mode indicator
- `ThemeToggle` — Theme toggle button
- `ChatMinimizedIndicator` — Chat minimized indicator

**Interactive Elements (5):**
- `InlineButtonItem` — Single inline button
- `PersistentToolbarButton` — Toolbar button
- `QuickActionButton` — Quick action button
- `SidebarNavItem` — Sidebar navigation item
- `ResizeHandle` — Resize handle

**Widget Atoms (8):**
- `StatCardWidget` — Stat display card (46 lines)
- `InsightCardWidget` — Insight card
- `AlertPanelWidget` — Alert panel
- `CodeHealthMeterWidget` — Health meter
- `FileTreeWidget` — File tree widget
- `SnippetPreviewWidget` — Code snippet preview
- `UnknownWidget` — Fallback widget
- `FileIcon` — File icon

**Visualization Primitives (9):**
- `SparkParticle` — Spark particle
- `MoonOrbit` — Moon orbit
- `GateCheckpointMarker` — Gate marker
- `LiveRegion` — Live region announcer
- `StepNode` (ChainDAG) — Step node
- `AnimatedFlowEdge` — Animated edge
- `AnimatedStepNode` — Animated step node
- `SwimlaneBackground` — Swimlane background
- `CosmicBackground` — Cosmic background

**Story Components (2):**
- `ContinueButton` — Continue button
- `StoryMetadata` — Story metadata display

**Other Atoms (5):**
- `AgentAvatar` — Agent avatar
- `LogBubble` — Log bubble
- `SessionSidebarItem` — Session sidebar item
- `PackCard` — Pack card
- `CategorySection` — Category section

### Molecules (45 components — 23.2%)
**Definition:** Composite components built from atoms, focused single responsibility.

**Navigation Molecules (3):**
- `SidebarNavGroup` — Collapsible nav group (uses SidebarNavItem)
- `SidebarSearch` — Search input with icon
- `SidebarUserProfile` — User profile card

**Input Molecules (2):**
- `CommandPaletteInput` — Command input with icon
- `CommandPaletteResults` — Results list

**Visualization Molecules (9):**
- `RegionStar` — Star node with interaction
- `LightBridgeEdge` — Animated edge
- `TraceRenderer` — Trace path renderer
- `SparkAnimation` — Spark animation (uses SparkParticle)
- `GateCheckpoint` — Gate checkpoint display
- `HybridFlowViz` — Hybrid flow visualization
- `ChainStatusIndicator` — Chain status display
- `DiscoveryHint` — Discovery hint card
- `EditorTabs` — Editor tabs

**Interaction Molecules (7):**
- `DiscussButton` — Context-aware button
- `OrchestratorButton` — Orchestrator button
- `StarBookmark` — Bookmark button
- `ControlButtons` — Control button group
- `ReminderButtonBar` — Reminder button bar
- `InlineButtons` — Inline button group
- `Toast` — Toast notification

**Data Display Molecules (11):**
- `DossierCard` — Dossier preview card
- `ModifierCard` — Modifier card
- `RegistryEntryCard` — Registry entry card
- `WidgetRenderer` — Widget renderer
- `FolderHierarchy` — Folder hierarchy tree
- `ComponentHealthCard` — Component health card
- `SessionInfoPanel` — Session info panel
- `LiveSpatialMonitor` — Live spatial monitor
- `RespectCheckControls` — Respect check controls
- `AgentRow` — Agent row
- `AgentCharacterCard` — Agent character card

**Form & Input Molecules (2):**
- `ProjectSelector` — Project selector
- `ProjectForm` — Project form

**Story Molecules (2):**
- `ChapterList` — Chapter list
- `ChapterViewer` — Chapter viewer

**Other Molecules (9):**
- `AgentLogPanel` — Agent log panel
- `BigBangAnimation` — Big Bang animation
- `CommandCenter` (CosmicMap) — Command center
- `UniverseOnboarding` — Universe onboarding
- `MoonOrbit` — Moon orbit (borderline atom/molecule)
- `GateCheckpointMarker` — Gate marker (borderline atom/molecule)
- `ChangePreview` — Change preview
- `ConflictDialog` — Merge conflict dialog
- `StarBookmarkDialog` — Bookmark dialog

### Organisms (58 components — 29.9%)
**Definition:** Complex components combining molecules, complete sections.

**Major Layouts (5):**
- `WorkbenchLayout` — Main app shell (739 lines)
- `AppSidebar` — Navigation sidebar (313 lines)
- `SessionSidebar` — Session sidebar
- `SlidingChatWindow` — Sliding chat overlay
- `RegionFocusView` — Dual-panel region view

**Visualization Organisms (4):**
- `CosmicMap` — Universe visualization (460 lines, 13 child components)
- `FlowVisualization` — ReactFlow chain diagram (234 lines)
- `ChainDAG` — DAG visualization
- `TimelineView` — Timeline

**Workbench Organisms (Stars) (10):**
- `WorkStar`, `MaintenanceStar`, `ExploreStar`, `ReviewStar`, `PMStar`, `ArchiveStar`, `IntelStar`, `SettingsStar`, `RespectStar`, `StoryStar`

**Communication Organisms (4):**
- `ChatPanel` — Chat interface (992 lines, **largest component**)
- `ConversationPanel` — Conversation panel
- `DiscussDialog` — Discuss dialog
- `CustomPromptDialog` — Custom prompt dialog

**Tool Organisms (9):**
- `EditorTool`, `CanvasTool`, `CoverageTool`
- `ClaudeCliTerminal` — Claude CLI terminal
- `Terminal` — Terminal panel
- `FileExplorer` — File explorer (FileTree)
- `StepInspector` — Step inspector
- `SquadPanel` — Agent squad panel
- `CodeEditor` — Code editor (DiffView + EditorTabs)

**Intelligence Organisms (6):**
- `DossierView` — Dossier viewer (grid layout, widgets)
- `DossierList` — Dossier list
- `RegistryBrowser` — Registry browser
- `SessionArchive` — Session archive
- `TelemetryViewer` — Telemetry viewer
- `HarmonySpaceWorkbench` — Harmony workbench

**Settings Organisms (4):**
- `QuickActionSettings`, `FeatureFlagSettings`, `EvolutionSettings`, `PerformanceSettings`

**Dialog Organisms (5):**
- `DossierCreationDialog`, `ClaudeCliStartDialog`, `DisambiguationModal`, `ErrorModal`, `StarBookmarkDialog`

**Other Organisms (11):**
- `CommandPalette` — Command palette
- `SessionPane` — Session pane
- `QuickActionBar` — Quick action bar
- `PersistentToolbar` — Persistent toolbar
- `HarmonyPanel` — Harmony panel
- `HarmonyHealthDashboard` — Harmony dashboard
- `GateTraceViewer` (2 copies) — Gate trace viewer
- `HistoryBrowser` — History browser
- `ChainLiveMonitor` — Chain monitor
- `ChainDemo` — Chain demo
- `WebSocketTest` — WebSocket test
- `SessionTree` — Session tree
- `DiscoveredSessionsList` — Discovered sessions list

### Templates (1 component — 0.5%)
**Definition:** Page-level layouts defining overall structure.

- `WorkbenchLayout` — Main app template (also counted in organisms)

---

## 3. Composition Patterns

### Higher-Order Components (HOCs)
**Count:** 0 (none detected)

### Render Props
**Count:** Minimal usage
- **Example:** `IntelDossier/WidgetRenderer` — Delegates to widget components based on type

### Custom Hooks (88 imports detected across 57 files)
**Primary Pattern:** Custom hooks for state logic + React hooks for local UI state

**Most Used Custom Hooks:**
- `useWorkbenchContext` (21 occurrences) — Active workbench, navigation
- `useWebSocketContext` (21 occurrences) — WebSocket connection, events
- `useSessionContext` (17 occurrences) — Session data
- `useDiscussButton` (15 occurrences) — Discuss dialog integration
- `useFeatureFlagSimple` (12 occurrences) — Feature toggles
- `useChatWindowContext` (8 occurrences) — Chat window state
- `useUniverseContext` (6 occurrences) — Universe graph data
- `useChatMessages` (5 occurrences) — Chat message state
- `usePromptButtons` (4 occurrences) — Context-aware prompts

**React Hooks Usage:**
- **98 components** use `useState`, `useEffect`, `useCallback`, `useMemo`
- Heavy use of `useCallback` for memoized event handlers (prevents re-renders)
- `useMemo` for expensive computations (layout calculations, transformations)
- `useRef` for DOM manipulation, timeouts, refs
- `useReactFlow` for ReactFlow integrations (CosmicMap, FlowVisualization, ChainDAG)

### Component Composition
**Primary Pattern:** Component composition via children prop + explicit component nesting

**Examples:**
1. **CosmicMap** → `RegionStar` + `LightBridgeEdge` + `SparkAnimation` + `CommandCenter` + `BigBangAnimation`
2. **WorkbenchLayout** → `AppSidebar` + `SessionSidebar` + Workbench Content + `SlidingChatWindow`
3. **FlowVisualization** → ReactFlow + `AnimatedStepNode` + `AnimatedFlowEdge` + `SwimlaneBackground`
4. **ChatPanel** → Messages + `ReminderButtonBar` + Prompt Buttons + Input + Model Selector + `DiscussButton`
5. **AppSidebar** → `SidebarNavGroup` → `SidebarNavItem`
6. **IntelDossier** → `DossierList` + `DossierView` → `WidgetRenderer` → Widget Components

---

## 4. Props Flow and Data Dependencies

### Context Consumption (35 context imports across 21 files)
**Pattern:** Contexts provide global state, components consume via hooks.

#### Primary Contexts (in order of usage)
1. **WorkbenchContext** (21 uses)
   - **Provides:** activeWorkbench, setActiveWorkbench, workbenchNotifications
   - **Consumed by:** WorkbenchLayout, AppSidebar, all Stars
2. **WebSocketContext** (21 uses)
   - **Provides:** send, onEvent, status
   - **Consumed by:** Chat components, visualization components
3. **SessionContext** (17 uses)
   - **Provides:** getSession, sessions
   - **Consumed by:** SessionSidebar, WorkStar, ChatPanel
4. **DiscussContext** (15 uses)
   - **Provides:** registerChatInput, unregisterChatInput
   - **Consumed by:** All DiscussButton integrations
5. **UniverseContext** (6 uses)
   - **Provides:** universe, navigateToRegion, targetWorkbenchId
   - **Consumed by:** CosmicMap, WorkbenchLayout
6. **ChatWindowContext** (8 uses)
   - **Provides:** sessionId, openChat, closeChat, selectedModel
   - **Consumed by:** SlidingChatWindow, ChatPanel
7. **ThemeContext** (implied, via ThemeToggle)
8. **FeatureFlagContext** (implied, via useFeatureFlag)

### Data Flow Architecture
**Pattern:** Top-down props + Context for cross-cutting concerns

#### Top-Down Props Flow
- `WorkbenchLayout` → Star Components (sessions, handlers)
- `CosmicMap` → `RegionStar` (region data)
- `FlowVisualization` → `AnimatedStepNode` (step data)
- `ChatPanel` → child components (messages, state)

#### Context-Driven State
- **Global State:** Workbench selection, WebSocket connection, Universe graph
- **Feature Toggles:** Feature flags (cosmic map, command center, spark animations)
- **Theme:** Dark/light mode
- **Session Management:** Active sessions, chat windows

#### Event Flow
1. **User Interaction** → Component handler → Context action
2. **WebSocket Event** → Context listener → Component state update
3. **Navigation** → Context update → Component re-render

---

## 5. Shared vs Feature-Specific Components

### Shared Components (42 — 21.6%)
**Definition:** Reusable across multiple features, no domain coupling.

#### UI Primitives (27)
- `common/GlowIndicator`, `ChainBadge`, `HarmonyBadge`, `HarmonyIndicator`, `ThemeToggle`, `VimModeIndicator`, `Toast`, `ErrorModal`, `DisambiguationModal`, `InlineButtons`, `InlineButtonItem`, `PersistentToolbar`, `PersistentToolbarButton`, `QuickActionBar`, `QuickActionButton`, `ControlButtons`, `ChangePreview`, `ModifierCard`, `StarBookmark`, `StarBookmarkDialog`
- AppSidebar subcomponents: `SidebarNavGroup`, `SidebarNavItem`, `SidebarSearch`, `SidebarUserProfile`

#### Visualization Primitives (15)
- FlowVisualization: `AnimatedStepNode`, `AnimatedFlowEdge`, `SwimlaneBackground`
- ChainDAG: `StepNode`, `layout.ts`
- CosmicMap: `RegionStar`, `LightBridgeEdge`, `SparkAnimation`, `SparkParticle`, `GateCheckpoint`, `GateCheckpointMarker`, `MoonOrbit`, `LiveRegion`, `TraceRenderer`, `CosmicBackground`

### Feature-Specific Components (152 — 78.4%)
**Definition:** Coupled to specific domains, not reusable without modification.

#### Workbench-Specific (40)
- All Star components, Settings/*, Harmony/*, HarmonyPanel, HarmonyHealthDashboard

#### Session Management (25)
- SessionSidebar, SessionPanel/*, SessionArchive, ClaudeCliTerminal/*, ConversationPanel, ChatPanel

#### Intelligence (19)
- IntelDossier/*, RegistryBrowser/*, TelemetryViewer, SquadPanel/*

#### Development Tools (12)
- CodeEditor/*, FileExplorer/*, Terminal, Tools/*, StepInspector

#### Visualization (9)
- CosmicMap (main), FlowVisualization (main), ChainDAG (main), TimelineView, BigBangAnimation, CommandCenter/*, ChainLiveMonitor, ChainDemo

#### Other (47)
- WorkbenchLayout, RegionFocusView, SlidingChatWindow/*, CommandPalette/*, DiscussButton/*, OrchestratorButton, CustomPromptButton/*, Onboarding, HistoryBrowser, GateTraceViewer, WebSocketTest

---

## 6. Reusability Metrics and Component Coupling

### Component Reusability Score
**Methodology:** (Shared Components / Total Components) × 100

**Score:** (42 / 194) × 100 = **21.6%**

### Reusability by Category
- **Atoms:** 90% reusable (32/36)
- **Molecules:** 60% reusable (27/45)
- **Organisms:** 5% reusable (3/58) — CosmicMap primitives only
- **Templates:** 0% reusable (0/1)

### Component Coupling Analysis

#### Low Coupling (Highly Reusable) — 42 components
- All atoms (UI primitives, widgets, indicators)
- Navigation molecules (SidebarNavGroup, SidebarNavItem)
- Visualization molecules (RegionStar, LightBridgeEdge, AnimatedStepNode, AnimatedFlowEdge)

#### Medium Coupling (Contextual Reusability) — 45 components
- Molecules with domain logic (DiscussButton, OrchestratorButton, DossierCard)
- Settings components (could be reused in similar apps)
- Visualization organisms (FlowVisualization, ChainDAG could be adapted)

#### High Coupling (Feature-Specific) — 107 components
- All Star workbenches (coupled to ActionFlows domain)
- Session management (coupled to session model)
- Intelligence dossiers (coupled to intel domain)
- Claude CLI terminal (coupled to CLI service)
- Harmony components (coupled to contract compliance domain)

---

## 7. Atomic Design Alignment Assessment

### Strengths ✅

1. **Clear Atom Layer** (36 components)
   - Well-defined primitive components
   - Single responsibility principle
   - Minimal dependencies
   - Good examples: `GlowIndicator`, `StatCardWidget`, `SparkParticle`

2. **Strong Molecule Layer** (45 components)
   - Focused compositions of atoms
   - Clear boundaries
   - Reusable patterns
   - Good examples: `SidebarNavGroup`, `RegionStar`, `DiscussButton`

3. **Consistent Naming Conventions**
   - Star suffix for workbenches
   - Panel/Bar suffix for containers
   - Dialog/Modal suffix for overlays
   - Widget suffix for grid items

4. **Barrel Exports** (20+ index.ts files)
   - Clean public APIs
   - Type exports alongside components
   - Prevents internal coupling

5. **Co-located Styles**
   - 104 CSS files, ~1:1 mapping to components
   - BEM-like naming (e.g., `.chat-panel__input-field`)
   - CSS custom properties for theming
   - Global tokens: `cosmic-tokens.css`

### Weaknesses ⚠️

1. **Organism Bloat** (58 components, 30% of total)
   - Many large, complex organisms
     - **ChatPanel:** 992 lines
     - **WorkbenchLayout:** 739 lines
     - **CosmicMap:** 460 lines
   - Could be split into smaller organisms

2. **Mixed Responsibilities in Organisms**
   - `CosmicMap`: visualization + animation + command center + onboarding (460 lines)
   - `SettingsStar`: tabs + forms + feature flags (complex)
   - Could benefit from further decomposition

3. **Inconsistent Component Granularity**
   - Some atoms are too complex (e.g., `LiveSpatialMonitor` could be molecule)
   - Some molecules are too simple (e.g., `ContinueButton` could be atom)

4. **Feature-Specific Components Dominate** (78% of total)
   - Only 22% shared components
   - Limited reusability outside ActionFlows domain
   - Opportunity to extract more generic patterns

5. **No Explicit Template Layer** (just 1 template)
   - `WorkbenchLayout` is both template and organism
   - Could benefit from explicit page templates

6. **Context Overuse**
   - 7-8 contexts consumed by many components
   - Increases coupling
   - Makes components harder to test in isolation

### Opportunities for Improvement 🎯

1. **Extract More Atoms**
   - SessionStatusBadge (from ChatPanel header)
   - IconButton (from multiple locations)
   - Badge (generic badge component)
   - Chip (generic chip component)
   - LoadingSpinner (from multiple locations)

2. **Refactor Large Organisms**
   - Split `ChatPanel` → ChatHeader + MessageList + ChatInput organisms
   - Split `CosmicMap` → CosmicMapCanvas + CosmicMapControls
   - Split `SettingsStar` → SettingsLayout + SettingsSections

3. **Create Template Layer**
   - DualPanelTemplate (for region focus, chat split views)
   - WorkbenchTemplate (for star layouts)
   - DialogTemplate (for modals)

4. **Extract Generic Patterns**
   - Generic VirtualizedList (for message lists, session lists)
   - Generic Tree component (for file explorer, session tree, folder hierarchy)
   - Generic Card component (base for DossierCard, ModifierCard, etc.)
   - Generic Toolbar (base for PersistentToolbar, QuickActionBar)

5. **Reduce Context Coupling**
   - Use composition instead of contexts where possible
   - Create facade hooks (e.g., `useWorkbench` = `useWorkbenchContext` + `useSessionContext`)
   - Consider Zustand or Jotai for simpler state

---

## 8. Key Architecture Observations

### 1. ReactFlow Dominance
- **3 major visualizations** use ReactFlow (CosmicMap, FlowVisualization, ChainDAG)
- **Custom node types:** RegionStar, AnimatedStepNode, StepNode
- **Custom edge types:** LightBridgeEdge, AnimatedFlowEdge
- **Pattern:** ReactFlow + custom SVG/Canvas for rich animations

### 2. Context-First State Management
- **11 Context providers** (ThemeProvider, WebSocketProvider, SessionProvider, etc.)
- **Deeply nested** (8 levels deep in some paths)
- **Challenge:** Hard to test components in isolation
- **Opportunity:** Could consolidate with Zustand/Jotai for simplification

### 3. CSS Modules + BEM
- **104 CSS files** alongside components
- **BEM naming:** `.component-name__element--modifier`
- **CSS variables** for theming (cosmic-tokens.css)
- **Global stylesheet:** styles/index.css

### 4. Heavy Use of Custom Hooks
- **88+ custom hook imports** detected
- **Pattern:** Extract logic to hooks, components stay presentational
- **Example:** `useWorkbenchContext` combines workbench selection + navigation

### 5. Feature Flags Everywhere
- **FeatureFlagContext** drives visibility of new features
- **Examples:** Cosmic Map, Command Center, Spark animations, Evolution Settings
- **Benefit:** Safe rollout of new features

---

## Conclusion

The ActionFlows Dashboard frontend implements a **well-structured component hierarchy** following atomic design principles with **194 reusable components** organized into:

- **Atoms (36):** UI primitives, 90% reusable
- **Molecules (45):** Focused compositions, 60% reusable
- **Organisms (58):** Complex sections, 5% reusable (mostly ActionFlows-specific)
- **Templates (1):** Page layouts

**Key Strengths:**
- Clear separation of concerns
- Consistent naming conventions
- Modular CSS with co-located styles
- Extensive custom hook library
- Feature flag-driven experimentation

**Recommendations:**
- Refactor large organisms (ChatPanel, CosmicMap) into smaller pieces
- Extract more generic patterns from domain-specific components
- Simplify context nesting with state management library (Zustand)
- Add explicit Template layer for page layouts
