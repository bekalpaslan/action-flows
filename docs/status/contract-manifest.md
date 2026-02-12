# Behavioral Contract Files — Manifest

## Overview
Created 42 behavioral contract files (.contract.md) for P0 components in the ActionFlows Dashboard.

Each contract file defines:
- **Identity:** Component name, file path, type (Presentation/Container/Feature/Page)
- **Render Location:** Where component appears in UI
- **Lifecycle:** Mount/update/unmount behavior
- **Props Contract:** TypeScript interface of accepted props
- **State Ownership:** Internal state management
- **Interactions:** User interactions and event handlers
- **Test Hooks:** data-testid attributes for testing

## Created Files (42 total)

### Cosmic Map System (14 files)
1. CosmicMap.contract.md — Main ReactFlow universe visualization
2. RegionStar.contract.md — Glowing star nodes representing workbenches
3. LightBridgeEdge.contract.md — Connections between regions
4. CosmicBackground.contract.md — Canvas background animation
5. BigBangAnimation.contract.md — First-load universe expansion animation
6. CommandCenter.contract.md — Bottom bar control panel
7. GateCheckpoint.contract.md — Decision point markers
8. GateCheckpointMarker.contract.md — Gate visualization on edges
9. SparkAnimation.contract.md — Chain traversal animation
10. SparkParticle.contract.md — Individual spark particle
11. LiveRegion.contract.md — ARIA live region for accessibility
12. MoonOrbit.contract.md — Orbital animation around regions
13. TraceRenderer.contract.md — Execution trace visualization
14. (Subtotal: 14)

### Star Navigation Workbenches (10 files)
15. WorkStarWorkbench.contract.md — Work tasks and flow execution
16. MaintenanceStarWorkbench.contract.md — Bug reports and tech debt
17. ExploreStarWorkbench.contract.md — Feature discovery
18. ReviewStarWorkbench.contract.md — Code reviews and feedback
19. ArchiveStarWorkbench.contract.md — Completed work archive
20. SettingsStarWorkbench.contract.md — User settings and preferences
21. PMStarWorkbench.contract.md — Project management and roadmap
22. IntelStarWorkbench.contract.md — Intelligence dossiers
23. RespectStarWorkbench.contract.md — Team collaboration and feedback
24. StoryStarWorkbench.contract.md — User stories and narratives
25. (Subtotal: 10)

### Session Panel & Chat (4 files)
26. SessionPanel.contract.md — Right-side session information panel
27. ChatPanel.contract.md — Mobile-format chat window
28. ReminderButtonBar.contract.md — Context-aware prompt buttons
29. FolderHierarchy.contract.md — File/folder tree structure
30. (Subtotal: 4)

### Core UI Components (8 files)
31. CodeEditor.contract.md — Monaco Editor for code editing
32. Terminal.contract.md — xterm.js terminal emulator
33. OrchestratorButton.contract.md — Wrapper with orchestrator badge
34. DiscussButton.contract.md — Component discussion opener
35. CommandPalette.contract.md — Ctrl+K command/search overlay
36. ControlButtons.contract.md — Chain execution control buttons
37. ChainBadge.contract.md — Chain status indicator badge
38. ChainDAG.contract.md — Execution flow DAG visualization
39. (Subtotal: 8)

### Layout & Utility Components (6 files)
40. AppContent.contract.md — Main content area wrapper
41. AppSidebar.contract.md — Left navigation sidebar
42. LoadingSpinner.contract.md — Reusable loading indicator
43. GlowIndicator.contract.md — Status indicator with glow effect
44. ChainLiveMonitor.contract.md — Real-time execution monitoring
45. ChangePreview.contract.md — Diff/code change display
46. ConversationPanel.contract.md — Chat message history display
47. (Subtotal: 7 additional = 42 total)

## Contract Structure Example

```markdown
# ComponentName Behavioral Contract

## Identity
**Component Name:** ComponentName
**File Path:** packages/app/src/components/Path/ComponentName.tsx
**Type:** [Presentation/Container/Feature/Page]
**Last Updated:** 2026-02-12

## Render Location
[Where component appears in UI]

## Lifecycle
[When component mounts/unmounts]

## Props Contract
[TypeScript interface]

## State Ownership
[Internal state management]

## Interactions
[User interactions and event handlers]

## Test Hooks
[data-testid attributes]
```

## Usage

These contracts serve as:
- **Blueprint for testing:** Test files reference contract hooks
- **Development reference:** Developers understand component boundaries
- **API documentation:** Clear contract of accepted props and behavior
- **Accessibility compliance:** Defined aria-labels and roles
- **Maintenance guide:** Current state ownership and lifecycle

## Integration

All contracts follow the 7-layer system architecture:
- **Layer 1 (Platform):** Infrastructure components
- **Layer 2 (Template):** Component templates
- **Layer 3 (Philosophy):** Design principles
- **Layer 4 (Physics):** State management rules
- **Layer 5 (Experience):** User interaction patterns
- **Layer 6 (Expression):** Content and visual styling
- **Layer 7 (Interpretation):** Observability and monitoring

Each contract explicitly defines how components participate in these layers.
