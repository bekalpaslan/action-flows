# Component Behavioral Contracts Index

## Overview
This directory contains behavioral contract files (.contract.md) for all P0 components in the ActionFlows Dashboard. Contracts define the component interface, lifecycle, state management, and test hooks.

## Quick Links by Category

### Cosmic Map System (14 contracts)
- [CosmicMap.contract.md](./CosmicMap/CosmicMap.contract.md) — Main universe visualization
- [RegionStar.contract.md](./CosmicMap/RegionStar.contract.md) — Workbench region nodes
- [LightBridgeEdge.contract.md](./CosmicMap/LightBridgeEdge.contract.md) — Region connections
- [CosmicBackground.contract.md](./CosmicMap/CosmicBackground.contract.md) — Canvas background
- [BigBangAnimation.contract.md](./CosmicMap/BigBangAnimation.contract.md) — Initial animation
- [CommandCenter.contract.md](./CosmicMap/CommandCenter.contract.md) — Bottom control bar
- [GateCheckpoint.contract.md](./CosmicMap/GateCheckpoint.contract.md) — Decision points
- [GateCheckpointMarker.contract.md](./CosmicMap/GateCheckpointMarker.contract.md) — Gate visualization
- [SparkAnimation.contract.md](./CosmicMap/SparkAnimation.contract.md) — Traversal animation
- [SparkParticle.contract.md](./CosmicMap/SparkParticle.contract.md) — Particle element
- [LiveRegion.contract.md](./CosmicMap/LiveRegion.contract.md) — ARIA announcements
- [MoonOrbit.contract.md](./CosmicMap/MoonOrbit.contract.md) — Orbital animation
- [TraceRenderer.contract.md](./CosmicMap/TraceRenderer.contract.md) — Execution traces

### Star Navigation Workbenches (10 contracts)
- [WorkStarWorkbench.contract.md](./Workbench/WorkStarWorkbench.contract.md) — Tasks & execution
- [MaintenanceStarWorkbench.contract.md](./Workbench/MaintenanceStarWorkbench.contract.md) — Issues & bugs
- [ExploreStarWorkbench.contract.md](./Workbench/ExploreStarWorkbench.contract.md) — Discovery
- [ReviewStarWorkbench.contract.md](./Workbench/ReviewStarWorkbench.contract.md) — Code reviews
- [ArchiveStarWorkbench.contract.md](./Workbench/ArchiveStarWorkbench.contract.md) — Completed work
- [SettingsStarWorkbench.contract.md](./Workbench/SettingsStarWorkbench.contract.md) — Configuration
- [PMStarWorkbench.contract.md](./Workbench/PMStarWorkbench.contract.md) — Project management
- [IntelStarWorkbench.contract.md](./Workbench/IntelStarWorkbench.contract.md) — Intelligence dossiers
- [RespectStarWorkbench.contract.md](./Workbench/RespectStarWorkbench.contract.md) — Collaboration
- [StoryStarWorkbench.contract.md](./Workbench/StoryStarWorkbench.contract.md) — User stories

### Session & Chat (4 contracts)
- [SessionPanel.contract.md](./SessionPanel/SessionPanel.contract.md) — Session container
- [ChatPanel.contract.md](./SessionPanel/ChatPanel.contract.md) — Chat interface
- [ReminderButtonBar.contract.md](./SessionPanel/ReminderButtonBar.contract.md) — Prompt buttons
- [FolderHierarchy.contract.md](./SessionPanel/FolderHierarchy.contract.md) — File tree

### Core Components (14 contracts)
- [CodeEditor.contract.md](./Tools/EditorTool/CodeEditor.contract.md) — Monaco editor
- [Terminal.contract.md](./Terminal/Terminal.contract.md) — xterm.js terminal
- [OrchestratorButton.contract.md](./OrchestratorButton/OrchestratorButton.contract.md) — Chat wrapper
- [DiscussButton.contract.md](./DiscussButton/DiscussButton.contract.md) — Discussion opener
- [CommandPalette.contract.md](./CommandPalette/CommandPalette.contract.md) — Ctrl+K overlay
- [ControlButtons.contract.md](./ControlButtons/ControlButtons.contract.md) — Execution controls
- [ChainBadge.contract.md](./ChainBadge/ChainBadge.contract.md) — Status badge
- [ChainDAG.contract.md](./ChainDAG/ChainDAG.contract.md) — Execution graph
- [ChainLiveMonitor.contract.md](./ChainLiveMonitor.contract.md) — Real-time monitor
- [ChangePreview.contract.md](./ChangePreview/ChangePreview.contract.md) — Diff viewer
- [ConversationPanel.contract.md](./ConversationPanel/ConversationPanel.contract.md) — Chat history
- [AppContent.contract.md](./AppContent.contract.md) — Content wrapper
- [AppSidebar.contract.md](./AppSidebar/AppSidebar.contract.md) — Navigation sidebar

### Utilities (2 contracts)
- [LoadingSpinner.contract.md](./common/LoadingSpinner.contract.md) — Loading indicator
- [GlowIndicator.contract.md](./common/GlowIndicator.contract.md) — Status indicator

## Contract Structure

Each contract contains 7 required sections:

### 1. Identity
- Component name and file path
- Component type (Presentation/Container/Feature/Page)
- Last update date

### 2. Render Location
- Where in the UI the component appears
- Context within the layout

### 3. Lifecycle
- Mount behavior (initialization)
- Update behavior (re-rendering)
- Unmount behavior (cleanup)

### 4. Props Contract
- TypeScript interface definition
- All accepted props
- Default values

### 5. State Ownership
- Internal state management
- Context subscriptions
- Derived/computed values

### 6. Interactions
- User actions (click, type, keyboard)
- Event handlers
- WebSocket subscriptions

### 7. Test Hooks
- data-testid attribute values
- Aria labels and roles
- Test selectors

## Usage Guidelines

### For Test Development
Use the test hooks defined in each contract to select elements:

```typescript
// Example from ChatPanel contract
screen.getByTestId('chat-panel')
screen.getByTestId('message-list')
screen.getByTestId('message-{id}')
screen.getByTestId('send-button')
```

### For Component Development
Reference the Props Contract and State Ownership sections to understand:
- What props a component accepts
- How to manage internal state
- When to use context vs. local state

### For Integration
Check the Interactions section to understand:
- How components communicate with parents
- Which callbacks to implement
- What events to listen for

### For Accessibility
Review the Test Hooks section for:
- Required aria-labels
- Proper role attributes
- Keyboard navigation support

### For Maintenance
Use the Lifecycle section to understand:
- What happens on mount (subscriptions, initialization)
- What to clean up on unmount
- How to handle prop changes

## Related Documents

- [CONTRACT_MANIFEST.md](../../CONTRACT_MANIFEST.md) — Complete file listing with descriptions
- [CONTRACT_VALIDATION.txt](../../CONTRACT_VALIDATION.txt) — Creation report and validation
- [SYSTEM.md](../.claude/actionflows/docs/living/SYSTEM.md) — 7-layer architecture
- [CLAUDE.md](../.claude/CLAUDE.md) — Project instructions

## Statistics

- **Total Contracts:** 42 files
- **Total Lines:** 1,774
- **Categories:** 5 major categories
- **Last Updated:** 2026-02-12

## Standards

All contracts follow:
- Markdown format (.contract.md)
- 7-section template
- Component naming conventions
- 7-layer architecture alignment
- Accessibility-first design
- Test hook naming conventions

## Maintenance

When updating components:
1. Update the corresponding .contract.md file
2. Update the "Last Updated" date
3. Ensure Props Contract matches actual implementation
4. Update Test Hooks section with any new data-testid values
5. Keep State Ownership and Lifecycle in sync with code

## Questions?

Refer to the specific contract file for component-level details, or see:
- PROJECT_INSTRUCTIONS.md for framework guidelines
- SYSTEM.md for architectural context
