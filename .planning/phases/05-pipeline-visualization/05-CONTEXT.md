# Phase 5: Pipeline Visualization - Context

**Gathered:** 2026-04-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Build the horizontal node-based pipeline visualizer in the top ~25% of the workspace. Shows live chain execution with real-time status updates via WebSocket. Uses @xyflow/react v12. Rich nodes with step details. Click-to-inspect via side panel/drawer. Active chain only — completed chains go to history.

</domain>

<decisions>
## Implementation Decisions

### Node Design
- **D-01:** Rich nodes — each node shows step name, status icon, elapsed time, agent model. Not minimal.
- **D-02:** Two node shapes: rounded rectangles (steps) and diamonds (decision gates) — per original requirements.

### Interaction
- **D-03:** Clicking a pipeline node opens a side panel/drawer over the pipeline with node details (logs, output, agent info). Does NOT affect the content area below.
- **D-04:** Active chain only — pipeline shows the currently executing chain. Completed chains go to workbench history (accessible via content area).

### Data Flow
- **D-05:** Pipeline state driven by WebSocket chain events (pending → running → complete/failed transitions).
- **D-06:** Pipeline state scoped per workbench — switching workbenches shows that workbench's pipeline.
- **D-07:** Support forking (1→N) and merging (N→1) in visual layout.

### Claude's Discretion
- @xyflow/react v12 custom node component design
- How to render the side panel/drawer (Radix Dialog/Sheet or custom)
- Animation for status transitions (pulse, color fade, etc.)
- How to handle the "no active chain" empty state
- Node layout algorithm (dagre, elk, or manual positioning)
- How elapsed time updates in real-time (interval vs WebSocket heartbeat)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Design System
- `packages/app/src/components/ui/index.ts` — Component library
- `packages/app/src/styles/theme.css` — Token system

### Workspace Infrastructure (Phase 4 output)
- `packages/app/src/workbenches/workspace/PipelinePlaceholder.tsx` — Placeholder being replaced
- `packages/app/src/workbenches/workspace/WorkspaceArea.tsx` — Parent container with vertical split

### WebSocket
- `packages/app/src/lib/ws-client.ts` — WebSocket client singleton
- `packages/app/src/stores/wsStore.ts` — Connection status store
- `packages/backend/src/ws/hub.ts` — Backend WebSocket hub with channel routing

### Research
- `.planning/research/STACK.md` — @xyflow/react v12 recommendation
- `.planning/research/PITFALLS.md` — P7 (ReactFlow performance — zustand state, batched updates, memoized handlers)

</canonical_refs>

<code_context>
## Existing Code Insights

### What Gets Replaced
- `PipelinePlaceholder.tsx` — replaced with actual pipeline component

### What Gets Created
- Pipeline container component with @xyflow/react
- Custom StepNode component (rounded rectangle)
- Custom GateNode component (diamond)
- Node detail drawer/panel
- Pipeline zustand store (nodes, edges, active chain state)
- WebSocket message handler for chain events

### Integration Points
- WebSocket channel events feed pipeline store updates
- uiStore.activeWorkbench determines which pipeline to show
- Clicking nodes opens detail panel

</code_context>

<specifics>
## Specific Ideas

The pipeline should feel alive — nodes should visually pulse or glow when actively running. Completed nodes should feel settled. Failed nodes should be clearly marked. The drawer should slide in from the right side of the pipeline region (not full screen).

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 05-pipeline-visualization*
*Context gathered: 2026-04-02*
