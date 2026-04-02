---
phase: 05-pipeline-visualization
plan: 02
subsystem: ui
tags: [xyflow, react, pipeline, custom-nodes, smoothstep, cva, lucide]

# Dependency graph
requires:
  - phase: 05-pipeline-visualization
    provides: "@xyflow/react v12, pipeline types, dagre layout, pipelineStore, pipeline.css keyframes"
  - phase: 04-layout-shell
    provides: WorkbenchId type, uiStore, Button/Badge components
  - phase: 03-design-system
    provides: Tailwind v4 tokens, CVA, cn utility, component library
provides:
  - "StepNode custom @xyflow/react node (rounded rectangle with rich content per D-01)"
  - "GateNode custom @xyflow/react node (diamond shape per D-02)"
  - "PipelineEdge custom edge with animated dash for active paths"
  - "Module-level nodeTypes and edgeTypes constants"
  - "PipelineView container with ReactFlow, zoom/pan/fitView"
  - "PipelineEmptyState for no active chain"
  - "formatElapsed utility for elapsed time display"
affects: [05-03-PLAN]

# Tech tracking
tech-stack:
  added: []
  patterns: ["CVA status border variants on StepNode", "inner PipelineCanvas + ReactFlowProvider wrapper for useReactFlow", "module-level nodeTypes/edgeTypes constants per xyflow performance contract"]

key-files:
  created:
    - packages/app/src/components/pipeline/StepNode.tsx
    - packages/app/src/components/pipeline/GateNode.tsx
    - packages/app/src/components/pipeline/PipelineEdge.tsx
    - packages/app/src/components/pipeline/index.ts
    - packages/app/src/workbenches/workspace/PipelineView.tsx
    - packages/app/src/workbenches/workspace/PipelineEmptyState.tsx
  modified: []

key-decisions:
  - "Inner PipelineCanvas component wrapped by ReactFlowProvider for useReactFlow hook access (fitView)"
  - "Module-level nodeTypes/edgeTypes exported from pipeline/index.ts barrel file"
  - "CVA statusBorder variant for left border color on StepNode (5 status variants)"
  - "GateNode uses CSS rotate-45 with counter-rotate-45 inner content for diamond shape"

patterns-established:
  - "CVA status variants: statusBorder with border-l-[3px] and status-dependent color class"
  - "Inner canvas + Provider wrapper: split ReactFlow consumer into inner component for hook access"
  - "Pipeline barrel export: nodeTypes/edgeTypes/formatElapsed from components/pipeline/index.ts"

requirements-completed: [PIPE-01, PIPE-03, PIPE-05]

# Metrics
duration: 2min
completed: 2026-04-02
---

# Phase 05 Plan 02: Pipeline Visual Components Summary

**Custom StepNode (rounded rectangle), GateNode (diamond), PipelineEdge (animated smoothstep), PipelineView container with ReactFlow zoom/pan/fitView, and empty state**

## Performance

- **Duration:** 2 min
- **Started:** 2026-04-02T19:41:47Z
- **Completed:** 2026-04-02T19:44:38Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Built StepNode with rich content: status icon, step name, elapsed time, agent model, CVA left border
- Built GateNode as rotated diamond with GitBranch icon and label below
- Built PipelineEdge with animated dash pattern for active paths and status-based styling
- Built PipelineView container with ReactFlow, zoom constraints (0.25-2.0), fitView, and Fit View button
- Built PipelineEmptyState with centered GitBranch icon and instructional text
- All nodeTypes/edgeTypes defined as module-level constants per performance contract

## Task Commits

Each task was committed atomically:

1. **Task 1: Build StepNode, GateNode, and PipelineEdge custom components** - `7648cfe` (feat)
2. **Task 2: Build PipelineView container and PipelineEmptyState** - `7e76aee` (feat)

## Files Created/Modified
- `packages/app/src/components/pipeline/StepNode.tsx` - Custom node: rounded rectangle with status icon, name, elapsed time, model
- `packages/app/src/components/pipeline/GateNode.tsx` - Custom node: diamond shape with GitBranch icon
- `packages/app/src/components/pipeline/PipelineEdge.tsx` - Custom edge with animated smoothstep and status colors
- `packages/app/src/components/pipeline/index.ts` - Barrel exports: nodeTypes, edgeTypes, formatElapsed, component re-exports
- `packages/app/src/workbenches/workspace/PipelineView.tsx` - Main pipeline container with ReactFlow and fitView
- `packages/app/src/workbenches/workspace/PipelineEmptyState.tsx` - Empty state for no active chain

## Decisions Made
- Used inner PipelineCanvas component wrapped by ReactFlowProvider so useReactFlow (fitView) works correctly
- Exported nodeTypes/edgeTypes from a barrel index.ts rather than inlining in StepNode.tsx
- CVA statusBorder variant for the 3px left border color -- consistent with design system patterns
- GateNode diamond via CSS rotate-45 with -rotate-45 inner content to keep icon upright
- Handle positions on GateNode use explicit style offsets to account for rotation geometry

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Known Stubs

None -- all components are fully implemented with real rendering logic, design tokens, and proper type safety.

## Next Phase Readiness
- All visual components ready for Plan 03 (detail drawer, WebSocket event wiring, WorkspaceArea integration)
- PipelineView exports ready to replace PipelinePlaceholder in WorkspaceArea
- nodeTypes/edgeTypes, formatElapsed available for Plan 03 drawer and event handler

## Self-Check: PASSED

All 6 created files verified on disk. All 2 commit hashes (7648cfe, 7e76aee) found in git log.

---
*Phase: 05-pipeline-visualization*
*Completed: 2026-04-02*
