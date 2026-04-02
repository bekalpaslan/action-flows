# Phase 5: Pipeline Visualization - Research

**Researched:** 2026-04-02
**Domain:** Real-time node-based pipeline visualization with @xyflow/react v12, zustand state management, dagre layout, WebSocket event integration
**Confidence:** HIGH

## Summary

Phase 5 replaces the `PipelinePlaceholder.tsx` component with a live, interactive horizontal node-based pipeline powered by @xyflow/react v12. The pipeline occupies the top ~25% of the workspace and visualizes chain execution in real-time. Two custom node types (StepNode as rounded rectangle, GateNode as diamond) receive status updates via WebSocket events routed through the existing channel-per-workbench architecture. The detail drawer overlays the pipeline region from the right when a node is clicked.

The technical domain is well-understood. The project already has zustand 5.0.12, dagre 0.8.5 with types, lucide-react 1.7.0, and the full Radix + Tailwind + CVA design system in place. The only new dependency is `@xyflow/react` ^12.10.2, which replaces the deprecated `reactflow` 11 and `@reactflow/core` 11 packages currently in package.json. The shared types package already defines all chain/step event types (ChainCompiledEvent, StepStartedEvent, etc.) and ChainStepSnapshot -- the data contract between backend events and frontend pipeline rendering is already established.

**Primary recommendation:** Install @xyflow/react, remove reactflow + @reactflow/core, build custom nodes as module-level components with CVA-styled internals, drive all state through a per-workbench zustand store, and subscribe to WebSocket channel events via the existing wsClient singleton.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Rich nodes -- each node shows step name, status icon, elapsed time, agent model. Not minimal.
- **D-02:** Two node shapes: rounded rectangles (steps) and diamonds (decision gates) -- per original requirements.
- **D-03:** Clicking a pipeline node opens a side panel/drawer over the pipeline with node details (logs, output, agent info). Does NOT affect the content area below.
- **D-04:** Active chain only -- pipeline shows the currently executing chain. Completed chains go to workbench history (accessible via content area).
- **D-05:** Pipeline state driven by WebSocket chain events (pending -> running -> complete/failed transitions).
- **D-06:** Pipeline state scoped per workbench -- switching workbenches shows that workbench's pipeline.
- **D-07:** Support forking (1->N) and merging (N->1) in visual layout.

### Claude's Discretion
- @xyflow/react v12 custom node component design
- How to render the side panel/drawer (Radix Dialog/Sheet or custom)
- Animation for status transitions (pulse, color fade, etc.)
- How to handle the "no active chain" empty state
- Node layout algorithm (dagre, elk, or manual positioning)
- How elapsed time updates in real-time (interval vs WebSocket heartbeat)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PIPE-01 | Horizontal node-based pipeline showing live chain execution | @xyflow/react v12 with rankdir: 'LR' dagre layout, WebSocket event subscription via wsClient |
| PIPE-02 | Data-driven rendering from configurable data structure (JSON nodes + edges) | ChainStepSnapshot[] from chain:compiled event drives node/edge generation; dagre computes positions |
| PIPE-03 | Two node shapes: rounded rectangles (steps) and diamonds (decision gates) | StepNode and GateNode as custom @xyflow/react node types with distinct CSS/SVG rendering |
| PIPE-04 | Support forking (1->N) and merging (N->1) in pipelines | Dagre handles fan-out/fan-in natively via waitsFor dependency edges from ChainStepSnapshot |
| PIPE-05 | Horizontally scrollable for long chains | @xyflow/react built-in viewport with fitView + zoom constraints (0.25 - 2.0) |
| PIPE-06 | Real-time status updates via WebSocket | usePipelineEvents hook subscribes to channel events, updates pipelineStore per step:started/completed/failed/skipped |
| PIPE-07 | Pipeline state scoped per workbench | pipelineStore holds Map<WorkbenchId, PipelineState>; activeWorkbench selector drives which pipeline renders |
</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @xyflow/react | 12.10.2 | Node-based pipeline visualization | Official successor to reactflow 11. Better TypeScript generics (Node<TData, TType>), node.measured dimensions, SSR support, dark mode. Required upgrade since reactflow 11 is deprecated. |
| zustand | 5.0.12 (installed) | Per-workbench pipeline state | Already used for uiStore and wsStore. Selector pattern prevents re-render cascades. Module-level store means no provider pyramid. |
| dagre | 0.8.5 (installed) | Automatic horizontal graph layout | Already installed with @types/dagre. Handles rankdir: 'LR', forking, merging natively. Simple API, no async. |
| lucide-react | 1.7.0 (installed) | Status icons for nodes | Already used throughout the design system. CheckCircle2, XCircle, Loader2, SkipForward, Circle, GitBranch, Maximize2, X. |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @radix-ui/react-dialog | 1.1.15 (installed) | Drawer component foundation | For focus trapping, Escape handling, and ARIA dialog semantics in the node detail drawer |
| class-variance-authority | 0.7.1 (installed) | Node variant styling | For node status variants (pending/running/complete/failed/skipped border and icon styling) |
| tailwind-merge + clsx | 3.5.0 / 2.1.1 (installed) | Class composition via cn() | All component className merging follows existing cn() pattern |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| dagre for layout | elkjs | ELK is more powerful (layered, force, stress algorithms) but async, larger bundle (800KB vs 40KB), and dagre already installed and sufficient for typical 3-15 step chains |
| Custom drawer | @radix-ui/react-sheet or Vaul | Vaul is a separate dependency. The drawer is constrained to the pipeline region (not full viewport), so a positioned div with focus management is simpler than a portal-based sheet |
| CSS keyframes for pulse | framer-motion | Framer-motion adds ~30KB for animations achievable with 5 lines of CSS keyframes. Not justified for pulse + edge flow. |

**Installation:**
```bash
cd packages/app
pnpm add @xyflow/react@^12.10.2
pnpm remove reactflow @reactflow/core
```

**Version verification:**
- @xyflow/react: 12.10.2 confirmed via `npm view @xyflow/react version` on 2026-04-02
- dagre: 0.8.5 (already in package.json, confirmed via npm view)
- zustand: 5.0.12 (already in package.json, confirmed via npm view)

## Architecture Patterns

### Recommended Project Structure

```
packages/app/src/
  workbenches/workspace/
    PipelineView.tsx               # Main pipeline container (replaces PipelinePlaceholder.tsx)
    PipelineEmptyState.tsx         # Empty state when no active chain
    PipelineDrawer.tsx             # Node detail drawer overlay
  components/pipeline/
    StepNode.tsx                   # Custom @xyflow/react node: rounded rectangle
    GateNode.tsx                   # Custom @xyflow/react node: diamond
    PipelineEdge.tsx               # Custom edge with animated flow
    pipeline.css                   # Pipeline-specific keyframes (pulse, edge-flow)
  stores/
    pipelineStore.ts               # Zustand store: per-workbench pipeline state
  hooks/
    usePipelineEvents.ts           # WebSocket subscription hook
    useElapsedTime.ts              # Live elapsed time counter for running nodes
  lib/
    pipeline-layout.ts             # Dagre layout utility: chain data -> positioned nodes + edges
```

### Pattern 1: Zustand Per-Workbench Pipeline Store

**What:** A single zustand store holds pipeline state for each workbench in a Map. Selectors scope to the active workbench. All pipeline mutations go through store actions.

**When to use:** Always -- this is the single source of truth for pipeline node state, edge state, selected node, and drawer visibility.

**Example:**
```typescript
// Source: Project pattern (zustand module singleton, no provider)
import { create } from 'zustand';
import type { Node, Edge } from '@xyflow/react';
import type { WorkbenchId } from '@/lib/types';

interface PipelineState {
  nodes: Node[];
  edges: Edge[];
  selectedNodeId: string | null;
  drawerOpen: boolean;
  chainId: string | null;
}

interface PipelineStore {
  pipelines: Map<WorkbenchId, PipelineState>;
  // Actions
  initChain: (workbenchId: WorkbenchId, chainId: string, nodes: Node[], edges: Edge[]) => void;
  updateNodeStatus: (workbenchId: WorkbenchId, nodeId: string, data: Partial<StepNodeData>) => void;
  selectNode: (workbenchId: WorkbenchId, nodeId: string | null) => void;
  clearPipeline: (workbenchId: WorkbenchId) => void;
}

export const usePipelineStore = create<PipelineStore>((set) => ({
  pipelines: new Map(),
  initChain: (workbenchId, chainId, nodes, edges) =>
    set((state) => {
      const next = new Map(state.pipelines);
      next.set(workbenchId, { nodes, edges, selectedNodeId: null, drawerOpen: false, chainId });
      return { pipelines: next };
    }),
  // ... other actions
}));
```

### Pattern 2: Custom Node as Module-Level Component with Type<TData, TType>

**What:** Custom nodes are React components defined at module scope (never inline) and registered in a module-level nodeTypes constant. Node data uses @xyflow/react v12 type generics.

**When to use:** All custom pipeline nodes (StepNode, GateNode).

**Example:**
```typescript
// Source: https://reactflow.dev/learn/advanced-use/typescript
import type { Node, NodeProps } from '@xyflow/react';
import { Handle, Position } from '@xyflow/react';

// v12: Use type (not interface) for Node generic
type StepNodeData = {
  type: 'step';
  stepNumber: number;
  name: string;
  status: 'pending' | 'running' | 'complete' | 'failed' | 'skipped';
  elapsedMs: number | null;
  agentModel: string | null;
};
type StepNodeType = Node<StepNodeData, 'step'>;

// Module-level component (NEVER inline)
export function StepNode({ data, selected }: NodeProps<StepNodeType>) {
  return (
    <div className={cn(
      'min-w-[160px] rounded-md bg-surface-2 border shadow-sm p-3',
      statusBorderClass(data.status),
      selected && 'ring-2 ring-accent shadow-glow-focus',
    )}>
      <Handle type="target" position={Position.Left} />
      {/* Node content */}
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

// Module-level constant (NEVER inside a component)
export const nodeTypes = { step: StepNode, gate: GateNode };
```

### Pattern 3: Dagre Layout for Horizontal Pipelines (v12 API)

**What:** A utility function converts ChainStepSnapshot[] to positioned @xyflow/react nodes and edges using dagre with rankdir: 'LR'.

**When to use:** When chain:compiled event arrives with the step list.

**Critical v12 note:** In v12, `node.width`/`node.height` are used as inline styles (fixed dimensions), not measured references. For dagre layout with known node sizes, set width/height directly on nodes. dagre calculates center positions -- subtract half dimensions for @xyflow/react's top-left anchor.

**Example:**
```typescript
// Source: https://reactflow.dev/examples/layout/dagre + v12 migration guide
import dagre from 'dagre';
import type { Node, Edge } from '@xyflow/react';
import type { ChainStepSnapshot } from '@afw/shared';

const STEP_WIDTH = 160;
const STEP_HEIGHT = 88;
const GATE_SIZE = 64;

export function layoutPipeline(
  steps: ChainStepSnapshot[],
): { nodes: Node[]; edges: Edge[] } {
  const g = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'LR', nodesep: 24, ranksep: 48 });

  // Add nodes
  steps.forEach((step) => {
    const isGate = /* determine from step properties */;
    const w = isGate ? GATE_SIZE : STEP_WIDTH;
    const h = isGate ? GATE_SIZE : STEP_HEIGHT;
    g.setNode(String(step.stepNumber), { width: w, height: h });
  });

  // Add edges from waitsFor dependencies + sequential fallback
  steps.forEach((step) => {
    if (step.waitsFor?.length) {
      step.waitsFor.forEach((dep) => g.setEdge(String(dep), String(step.stepNumber)));
    } else if (step.stepNumber > 1) {
      g.setEdge(String(step.stepNumber - 1), String(step.stepNumber));
    }
  });

  dagre.layout(g);

  const nodes: Node[] = steps.map((step) => {
    const pos = g.node(String(step.stepNumber));
    const isGate = /* determine */;
    const w = isGate ? GATE_SIZE : STEP_WIDTH;
    const h = isGate ? GATE_SIZE : STEP_HEIGHT;
    return {
      id: String(step.stepNumber),
      type: isGate ? 'gate' : 'step',
      position: { x: pos.x - w / 2, y: pos.y - h / 2 },
      data: { /* map from ChainStepSnapshot */ },
    };
  });

  // ... edges similarly
  return { nodes, edges };
}
```

### Pattern 4: WebSocket Event to Store Mapping

**What:** A hook subscribes to the active workbench channel via wsClient and dispatches to pipelineStore actions based on event type.

**When to use:** In PipelineView, called once per mount.

**Example:**
```typescript
// Source: Project pattern (wsClient.subscribe + wsStore channel)
import { useEffect } from 'react';
import { wsClient } from '@/lib/ws-client';
import type { WSEnvelope } from '@afw/shared';

export function usePipelineEvents(workbenchId: WorkbenchId) {
  const initChain = usePipelineStore((s) => s.initChain);
  const updateNodeStatus = usePipelineStore((s) => s.updateNodeStatus);

  useEffect(() => {
    const unsub = wsClient.subscribe(workbenchId, (envelope: WSEnvelope) => {
      switch (envelope.type) {
        case 'chain:compiled':
          // Parse payload, run dagre layout, call initChain
          break;
        case 'step:started':
          updateNodeStatus(workbenchId, /* stepNumber */, { status: 'running' });
          break;
        // ... other events
      }
    });
    return unsub;
  }, [workbenchId, initChain, updateNodeStatus]);
}
```

### Pattern 5: Drawer as Positioned Overlay (Not Portal)

**What:** The node detail drawer is an absolutely-positioned div within the pipeline container, sliding in from the right edge. It uses Radix Dialog primitives for focus trapping and ARIA but renders inside the pipeline region, not as a portal.

**When to use:** For the PIPE-03 / D-03 interaction where clicking a node opens details without affecting the content area below.

**Rationale:** A portal-based dialog/sheet would render at the document root and potentially overlay the content area. The drawer must be constrained to the pipeline region. Using position: absolute within the pipeline container achieves this naturally.

### Anti-Patterns to Avoid

- **Inline nodeTypes/edgeTypes:** Defining `const nodeTypes = { step: StepNode }` inside a React component causes ReactFlow to re-register types on every render, destroying internal state. ALWAYS define at module level.
- **React useState for node/edge state:** Using useState instead of zustand causes the entire ReactFlow canvas to re-render on every status update. Use zustand with fine-grained selectors.
- **Object mutation for node updates:** @xyflow/react v12 explicitly dropped support for mutation-based updates. Always spread: `{ ...node, data: { ...node.data, status: 'running' } }`.
- **Reading node.width/height for layout in v12:** In v12, node.width/height are inline style overrides, not measured values. Use node.measured.width/height for post-render measurements, or use known dimensions for dagre pre-layout.
- **Pipeline CSS keyframes in theme.css:** Pipeline animations (pulse, edge-flow) are pipeline-specific, not design system tokens. They belong in `components/pipeline/pipeline.css`, not in `styles/theme.css`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Graph layout algorithm | Custom position calculation for fork/merge paths | dagre 0.8.5 with rankdir: 'LR' | Fork (1-to-N) and merge (N-to-1) require topological sort + layer assignment + crossing minimization. dagre handles all of this. |
| SVG edge path calculation | Manual SVG path string construction | @xyflow/react getSmoothStepPath() | Built-in path generators handle source/target positions, offsets, and border radii. SmoothStep is specified in UI-SPEC for right-angle routing. |
| Focus trap for drawer | Manual focusin/focusout handlers | @radix-ui/react-dialog primitives | Focus trapping, Escape key, ARIA roles, and return-focus-to-trigger are complex accessibility requirements handled by Radix. |
| Elapsed time formatting | Custom duration formatter | Simple utility function | Format is simple ("12s", "1m 23s") but the real complexity is the setInterval lifecycle (start/stop on status change, cleanup on unmount). A dedicated useElapsedTime hook isolates this. |
| WebSocket reconnection | Custom reconnect logic | Existing wsClient singleton | wsClient already handles exponential backoff reconnection, status listeners, and channel subscription/unsubscription. |

**Key insight:** The most dangerous hand-roll in this phase is node positioning. Even a 5-step pipeline with one fork and one merge has non-trivial layout requirements. dagre solves this with a single function call.

## Common Pitfalls

### Pitfall 1: nodeTypes Object Recreation Causes Node Unmount/Remount

**What goes wrong:** If the `nodeTypes` object is created inside a React component, ReactFlow receives a new reference on every render and re-registers all node types, causing all custom nodes to unmount and remount. This destroys internal node state, kills animations mid-transition, and causes visible flicker.

**Why it happens:** JavaScript object identity comparison (`===`) sees a new object as different even if contents are identical. ReactFlow uses reference equality for nodeTypes/edgeTypes.

**How to avoid:** Define `const nodeTypes = { step: StepNode, gate: GateNode }` at module level, outside any component. Same for edgeTypes.

**Warning signs:** Nodes flash/remount on any parent state change. Animations restart unexpectedly. Console warnings about node type re-registration.

### Pitfall 2: Zustand Selector Granularity and Re-Render Cascades

**What goes wrong:** Using `usePipelineStore((s) => s.pipelines)` in a component causes re-render whenever ANY workbench's pipeline changes. With 7 workbenches receiving events, even inactive pipelines trigger re-renders in the visible one.

**Why it happens:** Zustand uses reference equality for selector results. A Map/object containing all pipelines changes reference whenever any entry changes.

**How to avoid:** Narrow selectors: `usePipelineStore((s) => s.pipelines.get(activeWorkbench)?.nodes ?? [])`. Each component selects only the data it needs. Individual node components should select only their own node data.

**Warning signs:** React DevTools profiler shows PipelineView re-rendering on events for non-active workbenches. Performance degrades with multiple workbenches subscribed to events.

### Pitfall 3: WebSocket Event Batching Required for Rapid Status Updates

**What goes wrong:** When a chain has 10+ steps completing in rapid succession (e.g., a fast chain), each step:completed event triggers a separate zustand state update, which triggers a separate React render. This creates visible jank as nodes flash through states.

**Why it happens:** WebSocket messages arrive individually. Without batching, each message triggers an immediate store update and React render cycle.

**How to avoid:** Buffer incoming pipeline events for ~100ms using requestAnimationFrame before applying to the store. Apply all buffered updates in a single batch.

**Warning signs:** Node status transitions feel choppy during fast chain execution. React DevTools shows rapid consecutive renders of the pipeline component.

### Pitfall 4: dagre Position Uses Center Coordinates, ReactFlow Uses Top-Left

**What goes wrong:** dagre returns node positions as center (x, y) of the node rectangle. @xyflow/react positions nodes by their top-left corner. If you pass dagre's positions directly, all nodes are offset by half their width/height to the right and down.

**Why it happens:** Different coordinate systems between the two libraries.

**How to avoid:** Always adjust: `position: { x: dagreX - nodeWidth / 2, y: dagreY - nodeHeight / 2 }`.

**Warning signs:** Nodes appear shifted relative to edges. Edges connect to the wrong position on nodes. Fork/merge patterns look asymmetric.

### Pitfall 5: Diamond Node Handle Positions After CSS Rotation

**What goes wrong:** The GateNode diamond is a 64x64 square rotated 45 degrees via CSS transform. The Handle components (source/target connection points) are positioned relative to the pre-rotation bounding box, causing edges to connect at visually wrong positions.

**Why it happens:** CSS transforms are visual only -- they don't affect the DOM layout or the positions that @xyflow/react calculates for handles.

**How to avoid:** Use custom handle offsets or position the Handle components with explicit CSS to account for the rotation geometry. Test handle positions visually with actual edges before implementing full pipeline.

**Warning signs:** Edges connecting to diamond corners instead of the logical left/right center points.

### Pitfall 6: Testing @xyflow/react Components in happy-dom

**What goes wrong:** @xyflow/react relies on DOM measurements (getBoundingClientRect, ResizeObserver) that happy-dom does not fully implement. Tests fail or produce zero-dimension nodes.

**Why it happens:** The existing test environment uses happy-dom (vitest.config.ts), which has minimal layout support compared to jsdom.

**How to avoid:** Mock @xyflow/react at the module level in vitest.config.ts (same pattern used for react-resizable-panels). Test pipeline store logic separately from rendering. For integration tests that need ReactFlow rendering, use Playwright e2e tests.

**Warning signs:** Test errors about undefined getBoundingClientRect or ResizeObserver. Node dimensions are always 0 in tests.

## Code Examples

### Custom StepNode with Status Variants

```typescript
// Source: @xyflow/react v12 custom nodes + project CVA pattern
import type { Node, NodeProps } from '@xyflow/react';
import { Handle, Position } from '@xyflow/react';
import { cn } from '@/lib/utils';
import { cva } from 'class-variance-authority';
import { CheckCircle2, XCircle, Loader2, SkipForward, Circle } from 'lucide-react';

type StepNodeData = {
  type: 'step';
  stepNumber: number;
  name: string;
  status: 'pending' | 'running' | 'complete' | 'failed' | 'skipped';
  elapsedMs: number | null;
  agentModel: string | null;
};
type StepNodeType = Node<StepNodeData, 'step'>;

const statusBorder = cva('border-l-[3px]', {
  variants: {
    status: {
      pending: 'border-l-border',
      running: 'border-l-accent',
      complete: 'border-l-success',
      failed: 'border-l-destructive',
      skipped: 'border-l-border',
    },
  },
});

const STATUS_ICONS = {
  pending: Circle,
  running: Loader2,
  complete: CheckCircle2,
  failed: XCircle,
  skipped: SkipForward,
} as const;

export function StepNode({ data, selected }: NodeProps<StepNodeType>) {
  const Icon = STATUS_ICONS[data.status];
  return (
    <div
      className={cn(
        'min-w-[160px] rounded-md bg-surface-2 border border-border p-3',
        'shadow-sm hover:shadow-md hover:border-border-strong transition-shadow',
        statusBorder({ status: data.status }),
        data.status === 'running' && 'animate-pipeline-pulse',
        selected && 'ring-2 ring-accent shadow-glow-focus',
      )}
    >
      <Handle type="target" position={Position.Left} className="!bg-border-strong !w-2 !h-2" />
      <div className="flex items-center gap-2">
        <Icon
          size={16}
          className={cn(
            data.status === 'running' && 'animate-spin text-accent',
            data.status === 'complete' && 'text-success',
            data.status === 'failed' && 'text-destructive',
            data.status === 'pending' && 'text-text-muted',
            data.status === 'skipped' && 'text-text-muted',
          )}
        />
        <span className="text-caption font-semibold truncate max-w-[120px]">{data.name}</span>
      </div>
      <div className="text-caption text-text-dim mt-1">
        {data.elapsedMs != null ? formatElapsed(data.elapsedMs) : '--'}
      </div>
      {data.agentModel && (
        <div className="text-caption text-text-muted truncate">{data.agentModel}</div>
      )}
      <Handle type="source" position={Position.Right} className="!bg-border-strong !w-2 !h-2" />
    </div>
  );
}
```

### Pipeline Layout Utility with dagre

```typescript
// Source: https://reactflow.dev/examples/layout/dagre adapted for v12
import dagre from 'dagre';
import type { Node, Edge } from '@xyflow/react';
import type { ChainStepSnapshot } from '@afw/shared';

const STEP_W = 160;
const STEP_H = 88;
const GATE_W = 64;
const GATE_H = 64;

export function layoutPipeline(steps: ChainStepSnapshot[]): { nodes: Node[]; edges: Edge[] } {
  const g = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'LR', nodesep: 24, ranksep: 48 });

  steps.forEach((step) => {
    const w = STEP_W; // Use GATE_W for gate-type detection
    const h = STEP_H;
    g.setNode(String(step.stepNumber), { width: w, height: h });
  });

  steps.forEach((step, i) => {
    if (step.waitsFor?.length) {
      step.waitsFor.forEach((dep) => {
        g.setEdge(String(dep), String(step.stepNumber));
      });
    } else if (i > 0) {
      // Sequential fallback: connect to previous step
      g.setEdge(String(steps[i - 1].stepNumber), String(step.stepNumber));
    }
  });

  dagre.layout(g);

  const nodes: Node[] = steps.map((step) => {
    const pos = g.node(String(step.stepNumber));
    const w = STEP_W;
    const h = STEP_H;
    return {
      id: String(step.stepNumber),
      type: 'step',
      position: { x: pos.x - w / 2, y: pos.y - h / 2 },
      data: {
        type: 'step' as const,
        stepNumber: step.stepNumber,
        name: step.action,
        status: 'pending' as const,
        elapsedMs: null,
        agentModel: step.model ?? null,
        description: step.description ?? null,
        inputs: step.inputs ?? null,
        result: null,
        error: null,
        suggestion: null,
        fileChanges: null,
        startedAt: null,
      },
    };
  });

  const edges: Edge[] = [];
  steps.forEach((step, i) => {
    if (step.waitsFor?.length) {
      step.waitsFor.forEach((dep) => {
        edges.push({
          id: `e-${dep}-${step.stepNumber}`,
          source: String(dep),
          target: String(step.stepNumber),
          type: 'smoothstep',
        });
      });
    } else if (i > 0) {
      edges.push({
        id: `e-${steps[i - 1].stepNumber}-${step.stepNumber}`,
        source: String(steps[i - 1].stepNumber),
        target: String(step.stepNumber),
        type: 'smoothstep',
      });
    }
  });

  return { nodes, edges };
}
```

### useElapsedTime Hook

```typescript
// Source: Project pattern (interval-based with cleanup)
import { useState, useEffect, useRef } from 'react';

export function useElapsedTime(
  startedAt: string | null,
  isRunning: boolean,
): number | null {
  const [elapsed, setElapsed] = useState<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isRunning || !startedAt) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    const start = new Date(startedAt).getTime();
    const tick = () => setElapsed(Date.now() - start);
    tick(); // Immediate first tick
    intervalRef.current = setInterval(tick, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, startedAt]);

  return elapsed;
}
```

### Pipeline CSS Keyframes

```css
/* components/pipeline/pipeline.css */
/* Source: UI-SPEC animation contract */
@keyframes pipeline-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(62, 103, 191, 0); }
  50% { box-shadow: 0 0 8px 2px rgba(62, 103, 191, 0.15); }
}

@keyframes pipeline-edge-flow {
  from { stroke-dashoffset: 24; }
  to { stroke-dashoffset: 0; }
}

.animate-pipeline-pulse {
  animation: pipeline-pulse 2000ms ease-in-out infinite;
}

.animate-pipeline-edge-flow {
  stroke-dasharray: 8 4;
  animation: pipeline-edge-flow 1000ms linear infinite;
}

@media (prefers-reduced-motion: reduce) {
  .animate-pipeline-pulse {
    animation: none;
    box-shadow: var(--shadow-glow-default);
  }
  .animate-pipeline-edge-flow {
    animation: none;
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `import ReactFlow from 'reactflow'` | `import { ReactFlow } from '@xyflow/react'` | v12 (July 2024) | Package rename + named exports only |
| `node.width` / `node.height` as measured | `node.measured.width` / `node.measured.height` | v12 | width/height now used as inline style overrides; measured values moved to .measured |
| Object mutation for node updates | Immutable spread updates only | v12 | `{ ...node, data: { ...node.data, status: 'running' } }` required |
| `node.parentNode` | `node.parentId` | v12 | Subflow parent reference renamed |
| `onEdgeUpdate` | `onReconnect` | v12 | Edge reconnection API renamed |
| `reactflow/dist/style.css` | `@xyflow/react/dist/style.css` | v12 | Style import path changed |

**Deprecated/outdated:**
- `reactflow` npm package: Deprecated, renamed to `@xyflow/react`. No further updates.
- `@reactflow/core`: Internal package, should not be directly installed. Remove from dependencies.
- `nodeInternals` store key: Renamed to `nodeLookup` in v12.

## Project Constraints (from CLAUDE.md)

- **Tech stack:** React 18 + TypeScript + Vite, pnpm monorepo -- all new code must use existing stack
- **Design system enforcement:** No raw CSS in agent output. Pipeline components must use design tokens from theme.css (bg-surface-2, text-accent, border-border, etc.)
- **Naming conventions:** React components PascalCase .tsx, hooks camelCase with use prefix, stores camelCase .ts
- **Import organization:** @afw/shared for shared types, @ alias for src/ paths
- **Branded types:** Use ChainId, StepNumber, SessionId from @afw/shared (no as-any bypasses)
- **Error handling:** Try-catch for async, structured logging with [ModuleName] prefix
- **TypeScript strict mode:** strict: true, noUncheckedIndexedAccess: true
- **GSD workflow:** All work through GSD commands

## Open Questions

1. **Gate node detection from ChainStepSnapshot**
   - What we know: ChainStepSnapshot has `action`, `model`, `inputs`, `waitsFor` fields. There is no explicit `type: 'gate'` field.
   - What's unclear: How to distinguish a decision gate from a regular step in the chain:compiled payload.
   - Recommendation: Use a naming convention (action contains "gate", "check", or "decision") or add a `nodeType` field to ChainStepSnapshot in @afw/shared. For Phase 5, use naming convention with a fallback to 'step' type. The shared type can be enhanced in a follow-up.

2. **Backend chain event emission**
   - What we know: Event types (ChainCompiledEvent, StepStartedEvent, etc.) are fully defined in @afw/shared. WebSocketHub supports channel-based broadcasting.
   - What's unclear: Whether the backend currently emits these events through the hub channels. Phase 5 is frontend-only per scope, but the pipeline needs events to display anything meaningful.
   - Recommendation: For development/testing, create a mock event emitter that simulates a chain lifecycle. Document the backend event emission contract so Phase 6 (sessions) can wire it up.

3. **Chain completion transition timing**
   - What we know: UI-SPEC says pipeline remains visible for 5 seconds after chain completes, then transitions to empty state.
   - What's unclear: Whether this should be cancelable (e.g., if a new chain starts within those 5 seconds).
   - Recommendation: Use a timeout that is cleared if a new chain:compiled event arrives. If a new chain starts during the 5-second window, immediately replace with the new pipeline.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.0.0 |
| Config file | packages/app/vitest.config.ts |
| Quick run command | `cd packages/app && pnpm test -- --run` |
| Full suite command | `cd packages/app && pnpm test` |

### Phase Requirements -> Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PIPE-01 | Pipeline renders nodes and edges from JSON | unit (store) + e2e | `cd packages/app && pnpm vitest run src/stores/pipelineStore.test.ts` | No -- Wave 0 |
| PIPE-02 | Data-driven rendering from ChainStepSnapshot[] | unit (layout util) | `cd packages/app && pnpm vitest run src/lib/pipeline-layout.test.ts` | No -- Wave 0 |
| PIPE-03 | StepNode renders as rounded rect, GateNode as diamond | unit (node components) | `cd packages/app && pnpm vitest run src/components/pipeline/StepNode.test.tsx` | No -- Wave 0 |
| PIPE-04 | Fork/merge edges rendered correctly | unit (layout util) | `cd packages/app && pnpm vitest run src/lib/pipeline-layout.test.ts` | No -- Wave 0 |
| PIPE-05 | Horizontal scroll for long chains | e2e | `cd packages/app && pnpm test:e2e -- pipeline` | No -- manual verification |
| PIPE-06 | Real-time status updates via WebSocket | unit (hook + store) | `cd packages/app && pnpm vitest run src/hooks/usePipelineEvents.test.ts` | No -- Wave 0 |
| PIPE-07 | Per-workbench pipeline state | unit (store) | `cd packages/app && pnpm vitest run src/stores/pipelineStore.test.ts` | No -- Wave 0 |

### Sampling Rate
- **Per task commit:** `cd packages/app && pnpm vitest run --reporter=verbose`
- **Per wave merge:** `cd packages/app && pnpm test && pnpm type-check`
- **Phase gate:** Full suite green + type-check clean before /gsd:verify-work

### Wave 0 Gaps
- [ ] `packages/app/src/stores/pipelineStore.test.ts` -- covers PIPE-01, PIPE-07
- [ ] `packages/app/src/lib/pipeline-layout.test.ts` -- covers PIPE-02, PIPE-04
- [ ] `packages/app/src/components/pipeline/StepNode.test.tsx` -- covers PIPE-03
- [ ] `packages/app/src/hooks/usePipelineEvents.test.ts` -- covers PIPE-06
- [ ] `packages/app/src/__tests__/__mocks__/xyflow-react.ts` -- mock for @xyflow/react (same pattern as resizable-panels mock)
- [ ] vitest.config.ts alias addition: `'@xyflow/react': path.resolve(__dirname, './src/__tests__/__mocks__/xyflow-react.ts')`

## Sources

### Primary (HIGH confidence)
- [@xyflow/react Custom Nodes](https://reactflow.dev/learn/customization/custom-nodes) - Custom node pattern, Handle positions, nodeTypes registration
- [@xyflow/react TypeScript Guide](https://reactflow.dev/learn/advanced-use/typescript) - Node<TData, TType> generics, NodeProps typing, union types
- [@xyflow/react v12 Migration Guide](https://reactflow.dev/learn/troubleshooting/migrate-to-v12) - All breaking changes, package rename, measured dimensions, immutable updates
- [@xyflow/react Custom Edges](https://reactflow.dev/learn/customization/custom-edges) - BaseEdge, getSmoothStepPath, EdgeProps typing
- [@xyflow/react Dagre Layout Example](https://reactflow.dev/examples/layout/dagre) - dagre integration, position adjustment, horizontal layout
- @xyflow/react npm: version 12.10.2 confirmed via npm view 2026-04-02
- dagre npm: version 0.8.5 confirmed via npm view 2026-04-02
- zustand npm: version 5.0.12 confirmed via npm view 2026-04-02
- Project codebase: packages/shared/src/events.ts (ChainCompiledEvent, ChainStepSnapshot, StepStartedEvent, etc.)
- Project codebase: packages/app/src/lib/ws-client.ts (WSClient singleton, subscribe/dispatch pattern)
- Project codebase: packages/app/src/stores/uiStore.ts (zustand module-singleton pattern)
- Project codebase: packages/app/src/workbenches/workspace/WorkspaceArea.tsx (PipelinePlaceholder integration point)
- Project codebase: packages/app/src/styles/theme.css (design token system, semantic colors, glow shadows)

### Secondary (MEDIUM confidence)
- [xyflow v12 Discussion](https://github.com/xyflow/xyflow/discussions/3764) - Community migration experiences, edge cases
- .planning/research/STACK.md - @xyflow/react recommendation, migration strategy
- .planning/research/PITFALLS.md - P7: ReactFlow performance pitfalls (zustand state, memoized handlers)

### Tertiary (LOW confidence)
- None -- all critical claims verified with official documentation and local codebase inspection.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - @xyflow/react v12 API verified via official docs and npm; all other dependencies already installed and confirmed
- Architecture: HIGH - Patterns directly match existing project conventions (zustand stores, wsClient subscription, CVA variants, cn() utility); @xyflow/react API verified
- Pitfalls: HIGH - Documented from official v12 migration guide and project-specific constraints (happy-dom testing, diamond handle positions)

**Research date:** 2026-04-02
**Valid until:** 2026-05-02 (stable -- @xyflow/react v12 is a major release, dagre is mature/unchanged)
