---
phase: 05-pipeline-visualization
verified: 2026-04-02T20:48:14Z
status: passed
score: 11/11 must-haves verified
re_verification: true
gaps:
  - truth: "Running nodes show live elapsed time counter"
    status: resolved
    reason: "useElapsedTime hook is implemented but never called. StepNode and PipelineDrawer both read data.elapsedMs (only set on step:completed). Running nodes display '--' instead of a ticking counter."
    artifacts:
      - path: "packages/app/src/hooks/useElapsedTime.ts"
        issue: "Exported but never imported or called anywhere in the codebase"
      - path: "packages/app/src/components/pipeline/StepNode.tsx"
        issue: "Renders data.elapsedMs directly (null during running state) — does not call useElapsedTime"
      - path: "packages/app/src/workbenches/workspace/PipelineDrawer.tsx"
        issue: "Duration row renders data.elapsedMs directly — shows '--' for in-progress steps"
    missing:
      - "Call useElapsedTime(data.startedAt, data.status === 'running') inside StepNode and use the returned value for elapsed display when running"
      - "Optionally wire the same hook in PipelineDrawer for the Duration metadata row"
human_verification:
  - test: "Visual pipeline rendering in browser"
    expected: "Pipeline region shows 'No active chain' with GitBranch icon and instructional text when no chain is active. Switching workbenches does not break the pipeline region. No React errors in console."
    why_human: "Cannot launch dev server during automated verification. Visual layout, CSS animation rendering, and React runtime behavior require browser inspection."
  - test: "Live chain execution pipeline"
    expected: "When a chain is started from chat, nodes appear as rounded rectangles in horizontal order, gates appear as diamonds, edges animate for active steps, and the drawer opens on node click showing step metadata."
    why_human: "Requires backend event emission (Phase 6 scope) to produce live chain events. Cannot simulate full round-trip in automated checks."
---

# Phase 05: Pipeline Visualization Verification Report

**Phase Goal:** Users watch live chain execution as a horizontal node-based pipeline that updates in real-time
**Verified:** 2026-04-02T20:48:14Z
**Status:** gaps_found (1 gap)
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| #  | Truth | Status | Evidence |
|----|-------|--------|----------|
| 1  | Pipeline data types exist and model step nodes, gate nodes, and per-workbench state | VERIFIED | `pipeline-types.ts` exports `StepNodeData`, `GateNodeData`, `NodeStatus`, `PipelineState`, `createEmptyPipelineState` |
| 2  | Dagre layout utility converts ChainStepSnapshot[] to positioned nodes and edges with fork/merge support | VERIFIED | `layoutPipeline` in `pipeline-layout.ts`; 7 layout tests + 5 gate/constant tests pass |
| 3  | Zustand store holds per-workbench pipeline state with init, update, select, and clear actions | VERIFIED | `usePipelineStore` uses `Map<WorkbenchId, PipelineState>`; 6 store tests pass, workbench isolation confirmed |
| 4  | Test infrastructure mocks @xyflow/react for happy-dom | VERIFIED | `__mocks__/xyflow-react.ts` aliased in `vitest.config.ts`; 19 tests pass |
| 5  | Steps render as rounded rectangles with name, status icon, elapsed time, and agent model | VERIFIED | `StepNode.tsx` renders all required content with CVA status border, STATUS_ICONS map, Handle components |
| 6  | Decision gates render as diamond shapes with centered icon and label below | VERIFIED | `GateNode.tsx` uses `rotate-45` / `-rotate-45` with GitBranch icon and label below |
| 7  | Pipeline renders horizontally left-to-right with smoothstep edges | VERIFIED | `PipelineView.tsx` uses ReactFlow with dagre LR layout; `PipelineEdge.tsx` uses `getSmoothStepPath` |
| 8  | Empty state shows when no active chain | VERIFIED | `PipelineEmptyState.tsx` renders "No active chain" with GitBranch icon and instructional text |
| 9  | Pipeline supports fitView and zoom constraints (0.25 to 2.0) | VERIFIED | `minZoom={0.25}`, `maxZoom={2.0}`, `fitView` prop, Maximize2 button with `aria-label="Fit pipeline to view"` |
| 10 | WebSocket chain/step events update pipeline nodes in real-time | VERIFIED | `usePipelineEvents.ts` handles all 7 event types via RAF batching; wired in `PipelineView` via `usePipelineEvents(workbenchId)` |
| 11 | Running nodes show live elapsed time counter | FAILED | `useElapsedTime.ts` is implemented correctly but never imported or called. Both `StepNode` and `PipelineDrawer` read `data.elapsedMs` which is only set on `step:completed` — running nodes display `--` |

**Score:** 10/11 truths verified

---

### Success Criteria Verification

| # | Success Criterion | Status | Evidence |
|---|-------------------|--------|----------|
| 1 | Horizontal pipeline renders from JSON data structure (not hardcoded) | VERIFIED | `layoutPipeline(steps)` converts `ChainStepSnapshot[]`; `initChain` populates store; `PipelineView` selects `pipelines.get(workbenchId)` |
| 2 | Steps as rounded rectangles, gates as diamonds | VERIFIED | `StepNode` uses `rounded-md` with `statusBorder` CVA; `GateNode` uses `w-16 h-16 rotate-45` |
| 3 | Fork (1-to-N) and merge (N-to-1) visually | VERIFIED | `layoutPipeline` creates multiple edges from a single source node (fork) and into a single target node (merge) via `waitsFor`; 2 passing tests confirm |
| 4 | Long pipelines scroll horizontally without breaking layout | VERIFIED | ReactFlow `minZoom={0.25}` allows full pipeline at small scale; `fitView` auto-scales; native ReactFlow pan/zoom handles overflow |
| 5 | Node status updates in real-time via WebSocket (all transitions visible) | VERIFIED | All transitions covered: `step:started` → running, `step:completed` → complete, `step:failed` → failed, `step:skipped` → skipped; edge status also updates |
| 6 | Switching workbenches shows that workbench's own pipeline | VERIFIED | `Map<WorkbenchId, PipelineState>` in store; `PipelineView` selects by `workbenchId` prop passed from `WorkspaceArea` |

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `packages/app/src/lib/pipeline-types.ts` | Type definitions | VERIFIED | Exports `NodeStatus`, `StepNodeData`, `GateNodeData`, `PipelineNodeData`, `PipelineState`, `createEmptyPipelineState` |
| `packages/app/src/lib/pipeline-layout.ts` | Dagre layout utility | VERIFIED | Exports `layoutPipeline`, `STEP_WIDTH`, `STEP_HEIGHT`, `GATE_SIZE`, `isGateStep`; real dagre logic |
| `packages/app/src/stores/pipelineStore.ts` | Per-workbench Zustand store | VERIFIED | Exports `usePipelineStore` with all 5 actions; `Map<WorkbenchId, PipelineState>` with immutable updates |
| `packages/app/src/components/pipeline/pipeline.css` | CSS keyframes | VERIFIED | Contains `@keyframes pipeline-pulse`, `@keyframes pipeline-edge-flow`, `prefers-reduced-motion` block |
| `packages/app/src/__tests__/__mocks__/xyflow-react.ts` | @xyflow/react test mock | VERIFIED | Aliased in `vitest.config.ts`; exports `ReactFlow`, `Handle`, `Position`, `useReactFlow`, `BaseEdge`, `getSmoothStepPath`, `ReactFlowProvider` |
| `packages/app/src/components/pipeline/StepNode.tsx` | Custom step node | VERIFIED | Exports `StepNode`, `formatElapsed`; CVA statusBorder, STATUS_ICONS map, Handle components |
| `packages/app/src/components/pipeline/GateNode.tsx` | Custom gate node | VERIFIED | Exports `GateNode`; diamond via `rotate-45` / `-rotate-45`, GitBranch icon |
| `packages/app/src/components/pipeline/PipelineEdge.tsx` | Custom edge | VERIFIED | Exports `PipelineEdge`; `getSmoothStepPath`, animated active state, 4 status styles |
| `packages/app/src/components/pipeline/index.ts` | Barrel with module-level constants | VERIFIED | Exports `nodeTypes`, `edgeTypes` as module-level constants; re-exports `StepNode`, `GateNode`, `PipelineEdge`, `formatElapsed` |
| `packages/app/src/workbenches/workspace/PipelineView.tsx` | Pipeline container | VERIFIED | Inner `PipelineCanvas` + `ReactFlowProvider` pattern; `usePipelineEvents(workbenchId)`, `PipelineDrawer`, `PipelineEmptyState`, `fitView`, zoom constraints |
| `packages/app/src/workbenches/workspace/PipelineEmptyState.tsx` | Empty state | VERIFIED | "No active chain" text, GitBranch icon, instructional text |
| `packages/app/src/hooks/usePipelineEvents.ts` | WebSocket event hook | VERIFIED | All 7 event types handled; RAF batching; `wsClient.subscribe(workbenchId, ...)` |
| `packages/app/src/hooks/useElapsedTime.ts` | Live elapsed time hook | ORPHANED | Correctly implemented (`setInterval` 1s, cleanup, returns `number \| null`) but never called anywhere in the codebase |
| `packages/app/src/workbenches/workspace/PipelineDrawer.tsx` | Node detail drawer | VERIFIED | `role="dialog"`, `aria-labelledby="drawer-title"`, 320px right overlay, Escape key handler, focus management, step/gate variants |
| `packages/app/src/workbenches/workspace/PipelinePlaceholder.tsx` | Deleted | VERIFIED | File does not exist; no remaining references in `src/` (comment in `PipelineView.tsx` only) |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `pipeline-layout.ts` | `@afw/shared` events.ts | `import type { ChainStepSnapshot }` | WIRED | Line 3: `import type { ChainStepSnapshot } from '@afw/shared'` |
| `pipelineStore.ts` | `pipeline-types.ts` | type imports | WIRED | Line 4: `import type { PipelineNode, PipelineState, StepNodeData, GateNodeData } from '../lib/pipeline-types'` |
| `StepNode.tsx` | `pipeline-types.ts` | `StepNodeData` import | WIRED | Line 11: `import type { StepNodeData, NodeStatus } from '@/lib/pipeline-types'` |
| `PipelineView.tsx` | `pipelineStore.ts` | `usePipelineStore` selector | WIRED | Lines 6, 22-23: selector narrowed to `workbenchId` |
| `usePipelineEvents.ts` | `ws-client.ts` | `wsClient.subscribe` | WIRED | Line 157: `const unsub = wsClient.subscribe(workbenchId, ...)` |
| `usePipelineEvents.ts` | `pipelineStore.ts` | store action dispatch | WIRED | Lines 24-27: narrow selectors for each action; line 42: `usePipelineStore.getState()` for edge lookup |
| `PipelineView.tsx` | `PipelineView.tsx` (via `usePipelineEvents`) | WebSocket hook wired | WIRED | Line 85: `usePipelineEvents(workbenchId)` |
| `WorkspaceArea.tsx` | `PipelineView.tsx` | component import | WIRED | Line 5: `import { PipelineView } from './PipelineView'`; line 46: `<PipelineView workbenchId={workbenchId} />` |
| `useElapsedTime.ts` | `StepNode.tsx` or `PipelineDrawer.tsx` | hook call | NOT WIRED | `useElapsedTime` is never imported or called; hook is an orphan |

---

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `PipelineView.tsx` | `pipeline` (nodes + edges) | `usePipelineStore(s => s.pipelines.get(workbenchId))` populated by `usePipelineEvents` from `wsClient.subscribe` → `chain:compiled` → `layoutPipeline(steps)` | Yes — real layout from backend-emitted `ChainStepSnapshot[]` | FLOWING |
| `StepNode.tsx` | `data.status`, `data.name`, `data.elapsedMs` | Props from ReactFlow node; `data` populated via `initChain` / `updateNodeStatus` in `usePipelineEvents` | Yes — driven by WebSocket events | FLOWING for status; STATIC for elapsedMs during running (shows `--`) |
| `PipelineDrawer.tsx` | `pipeline.nodes`, `pipeline.selectedNodeId` | `usePipelineStore` selector; `selectNode` called from `PipelineView` `onNodeClick` handler | Yes — real node data from store | FLOWING |
| `useElapsedTime.ts` | `elapsed` (ms counter) | `setInterval` ticking from `startedAt` | Yes — correct implementation | DISCONNECTED — never called from any component |

---

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| layoutPipeline converts 3 sequential steps to 3 nodes + 2 edges | `pnpm --filter @afw/app exec vitest run src/lib/pipeline-layout.test.ts` | 13 layout tests pass | PASS |
| isGateStep detects gate/check/decision actions (case-insensitive) | same test run | 5 gate detection tests pass | PASS |
| pipelineStore: per-workbench isolation (init on work, no effect on explore) | `pnpm --filter @afw/app exec vitest run src/stores/pipelineStore.test.ts` | 6 store tests pass including isolation test | PASS |
| pipelineStore: selectNode opens drawer, null closes it | same test run | passes | PASS |
| @xyflow/react installed, deprecated reactflow removed | `grep "@xyflow/react" packages/app/package.json` | `"@xyflow/react": "^12.10.2"` found; no `reactflow` or `@reactflow/core` entry | PASS |
| useElapsedTime called during running state | `grep -rn "useElapsedTime" packages/app/src/` | Only definition found, zero call sites | FAIL |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| PIPE-01 | 05-02-PLAN | Horizontal node-based pipeline showing live chain execution | SATISFIED | `PipelineView` renders ReactFlow with horizontal dagre LR layout; wired to store and WebSocket events |
| PIPE-02 | 05-01-PLAN | Data-driven rendering from configurable JSON structure | SATISFIED | `layoutPipeline(steps)` converts `ChainStepSnapshot[]`; nodes and edges from store, not hardcoded |
| PIPE-03 | 05-02-PLAN | Two node shapes: rounded rectangles (steps) and diamonds (gates) | SATISFIED | `StepNode` (`rounded-md`) and `GateNode` (`rotate-45`) registered as `nodeTypes` in ReactFlow |
| PIPE-04 | 05-01-PLAN | Fork (1→N) and merge (N→1) support | SATISFIED | `layoutPipeline` builds multiple edges from/to nodes via `waitsFor`; dagre handles graph layout; 2 tests confirm |
| PIPE-05 | 05-02-PLAN | Horizontally scrollable for long chains | SATISFIED | ReactFlow native pan/zoom with `minZoom={0.25}` allows full pipeline viewing; `fitView` auto-scales |
| PIPE-06 | 05-03-PLAN | Real-time status updates via WebSocket | SATISFIED | `usePipelineEvents` handles 7 event types; RAF batching; wired in `PipelineView` |
| PIPE-07 | 05-01-PLAN, 05-03-PLAN | Pipeline state scoped per workbench | SATISFIED | `Map<WorkbenchId, PipelineState>` in store; `PipelineView` selects by `workbenchId`; `WorkspaceArea` passes `workbenchId` prop |

All 7 PIPE requirements satisfied. No orphaned requirements.

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `packages/app/src/hooks/useElapsedTime.ts` | 8 | Hook exported but never called anywhere in codebase | Warning | Running nodes display `--` instead of live elapsed time counter; contradicts Plan 03 truth "Running nodes show live elapsed time counter" |

No stub comments, placeholder returns, or empty implementations found in any pipeline file.
Pre-existing type error `TS2688: Cannot find type definition file for 'uuid'` confirmed pre-existing (documented in 05-01 and 05-03 summaries before phase changes).

---

### Human Verification Required

#### 1. Visual Pipeline Rendering

**Test:** Start `pnpm dev`, open `http://localhost:5173`, observe the pipeline region (top ~30% of workspace).
**Expected:**
- Pipeline region shows "No active chain" centered with GitBranch icon and text "Start a chain from the chat panel to see it execute here."
- Fit View button (Maximize2 icon) visible in top-right of pipeline region.
- Switching between workbenches in sidebar does not break the pipeline region or produce console errors.
- Resizing the separator between pipeline and content panels works smoothly.
**Why human:** Cannot launch dev server in automated verification. Visual layout and CSS rendering require browser.

#### 2. Live Chain Execution

**Test:** Trigger a chain from the chat panel (requires backend running and Phase 6 event emission).
**Expected:**
- Nodes appear as rounded rectangles in horizontal left-to-right order.
- Running nodes pulse (animate-pipeline-pulse) and animate edges (animate-pipeline-edge-flow).
- Node status transitions (pending → running → complete/failed) change the left border color and icon.
- Clicking a node opens the detail drawer from the right, showing metadata, inputs, result, and file changes.
- Pressing Escape or clicking X closes the drawer.
- Switching workbenches while a chain runs shows empty state in the other workbench, not the running chain.
**Why human:** Requires backend Phase 6 event emission and full round-trip behavior; cannot simulate in automated checks.

---

### Gaps Summary

**1 gap found** — the `useElapsedTime` hook was built per plan but never wired to any component.

**Root cause:** The hook is implemented correctly in `packages/app/src/hooks/useElapsedTime.ts` and returns live `elapsed: number | null`. However, `StepNode` and `PipelineDrawer` both read `data.elapsedMs` directly from the store, which is only populated when `step:completed` fires (setting the final duration). During the `running` phase, `data.elapsedMs` is null and both components display `--`.

**Impact on success criteria:** The 6 success criteria from ROADMAP.md are all met. This gap affects Plan 03's internal truth "Running nodes show live elapsed time counter" — which is an intermediate requirement, not a top-level success criterion. However it represents incomplete delivery of a planned feature.

**Fix scope:** Small — add `useElapsedTime(data.startedAt, data.status === 'running')` call in `StepNode`, use the returned value as the display value when running, fall back to `data.elapsedMs` when not running. Optionally mirror in `PipelineDrawer` Duration row.

---

_Verified: 2026-04-02T20:48:14Z_
_Verifier: Claude (gsd-verifier)_
