# Component Contract: ChainDAG

**File:** `packages/app/src/components/ChainDAG/ChainDAG.tsx`
**Type:** feature
**Parent Group:** Canvas & Visualization
**Contract Version:** 1.0.0
**Last Reviewed:** 2026-02-10

---

## Identity

- **Component Name:** ChainDAG
- **Introduced:** 2025-Q4
- **Description:** Directed acyclic graph visualization with automatic layout, parallel group detection, and integrated StepInspector panel.

---

## Render Location

**Mounts Under:**
- ChainDemo
- ChainLiveMonitor
- Standalone visualizations

**Render Conditions:**
1. Chain prop provided with valid steps array
2. Rendered as full-page layout with header, canvas, legend, and inspector

**Positioning:** relative (flex container)
**Z-Index:** N/A (page-level component)

---

## Lifecycle

**Mount Triggers:**
- Chain loaded from API or demo data
- User navigates to DAG view

**Key Effects:**
1. **Dependencies:** `[nodes, setFlowNodes]`
   - **Side Effects:** Updates ReactFlow nodes when computed nodes change
   - **Cleanup:** None
   - **Condition:** Runs when nodes array is recomputed

2. **Dependencies:** `[edges, setFlowEdges]`
   - **Side Effects:** Updates ReactFlow edges when computed edges change
   - **Cleanup:** None
   - **Condition:** Runs when edges array is recomputed

**Cleanup Actions:**
- ReactFlow cleanup handled by library

**Unmount Triggers:**
- User navigates away
- Chain is unloaded

---

## Props Contract

### Inputs
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| chain | Chain | ✅ | N/A | Chain object with steps, title, status |
| onStepSelected | (stepNumber: StepNumber) => void | ❌ | undefined | Callback when step is selected |
| onStepUpdate | (stepNumber: number, updates: any) => void | ❌ | undefined | Callback for updating step (demo mode) |

### Callbacks Up (to parent)
| Callback | Signature | Description |
|----------|-----------|-------------|
| onStepSelected | `(stepNumber: StepNumber) => void` | Emits step number when selected |
| onStepUpdate | `(stepNumber: number, updates: any) => void` | Emits step updates (used in demo scenarios) |

### Callbacks Down (to children)
| Callback | Signature | Passed To | Description |
|----------|-----------|-----------|-------------|
| onSelect | `(stepNumber: number) => void` | StepNode | Handles step selection |
| onSend | `(message: string) => void` | DiscussDialog | Handles discuss message sending |

---

## State Ownership

### Local State
| State | Type | Initial | Updated By |
|-------|------|---------|------------|
| selectedStep | number \| null | null | handleStepSelect from node click |
| flowNodes | Node[] | computed nodes | setFlowNodes via useNodesState |
| flowEdges | Edge[] | computed edges | setFlowEdges via useEdgesState |

### Context Consumption
| Context | Values Used |
|---------|-------------|
| DiscussContext | prefillChatInput (via useDiscussButton) |

### Derived State
| Name | Type | Dependencies | Computation |
|------|------|--------------|-------------|
| chainMetadata | ChainMetadata | `[chain]` | detectChainType(chain) - analyzes chain pattern |
| stats | ChainStats | `[chain.steps]` | Counts steps by status (total, completed, failed, inProgress, etc.) |
| parallelGroups | number[][] | `[chain.steps]` | detectParallelGroups - finds steps that can run concurrently |
| parallelGroupMap | Map<number, number> | `[parallelGroups]` | Maps step number to group size |
| nodes | Node[] | `[chain.steps, selectedStep, parallelGroupMap]` | Applies DAG layout, builds ReactFlow nodes |
| edges | Edge[] | `[chain.steps]` | Builds edges from waitsFor dependencies |
| selectedStepData | ChainStep \| undefined | `[chain.steps, selectedStep]` | Finds selected step data |

### Custom Hooks
- `useNodesState()` — ReactFlow hook for node management
- `useEdgesState()` — ReactFlow hook for edge management
- `useDiscussButton()` — Opens discuss dialog
- `useCallback()` — Memoizes handleStepSelect

---

## Interactions

### Parent Communication
- **Mechanism:** prop-callback
- **Description:** Emits selected step number and updates via callbacks
- **Example:** User clicks node → handleStepSelect → onStepSelected(stepNumber)

### Child Communication
- **Child:** StepNode (via ReactFlow nodeTypes)
- **Mechanism:** props (node.data)
- **Data Flow:** Passes step, isSelected, onSelect, parallelGroupSize

- **Child:** ChainBadge
- **Mechanism:** props
- **Data Flow:** Passes chainMetadata for badge rendering

- **Child:** StepInspector
- **Mechanism:** props
- **Data Flow:** Passes selectedStepData, onClose callback

- **Child:** DiscussButton + DiscussDialog
- **Mechanism:** props + context
- **Data Flow:** Passes componentName, chain context, onSend

### Sibling Communication
None (self-contained)

### Context Interaction
- **Context:** DiscussContext
- **Role:** consumer
- **Operations:** Prefills chat input when discuss message sent

---

## Side Effects

### API Calls
None (receives data via props)

### WebSocket Events
None (parent handles events)

### Timers
None

### LocalStorage Operations
None

### DOM Manipulation
None (React + ReactFlow rendering)

### Electron IPC (if applicable)
None

---

## Test Hooks

**CSS Selectors:**
- `.chain-dag-container`
- `.chain-dag-header`
- `.chain-dag-title`
- `.chain-dag-stats`
- `.chain-dag-canvas`
- `.chain-dag-legend`
- `.step-node`

**Data Test IDs:**
None (could add `data-testid="chain-dag-canvas"`)

**ARIA Labels:**
None explicit

**Visual Landmarks:**
1. Header section (`.chain-dag-header`) — Title, badge, stats, DiscussButton
2. Canvas area (`.chain-dag-canvas`) — ReactFlow DAG visualization
3. Legend (`.chain-dag-legend`) — Status indicator key
4. StepInspector panel (right side) — Detailed step view

---

## Health Checks

### Critical Checks (Must Pass)

#### HC-CD001: DAG Layout Applied
- **Type:** render
- **Target:** Nodes positioned in hierarchical layout
- **Condition:** No overlapping nodes, clear dependency flow
- **Failure Mode:** Overlapping nodes, unreadable graph
- **Automation Script:**
```javascript
async function checkDAGLayout() {
  const nodes = document.querySelectorAll('.step-node');
  if (nodes.length === 0) throw new Error('No nodes rendered');

  // Check for overlaps
  const rects = Array.from(nodes).map(n => n.getBoundingClientRect());
  for (let i = 0; i < rects.length; i++) {
    for (let j = i + 1; j < rects.length; j++) {
      if (rectsOverlap(rects[i], rects[j])) {
        throw new Error(`Nodes ${i} and ${j} overlap`);
      }
    }
  }

  return { nodeCount: nodes.length, noOverlaps: true };
}

function rectsOverlap(a, b) {
  return !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom);
}
```

#### HC-CD002: Parallel Groups Detected and Displayed
- **Type:** render
- **Target:** Nodes in parallel groups have indicator
- **Condition:** Parallel indicator (∥) shown on nodes in groups of 2+
- **Failure Mode:** Missing parallel indication, confusing dependency structure
- **Automation Script:**
```javascript
async function checkParallelGroups() {
  const header = document.querySelector('.chain-dag-header');
  const statsText = header?.textContent || '';
  const parallelGroupMatch = statsText.match(/(\\d+)\\s+parallel groups/);

  if (!parallelGroupMatch) throw new Error('Parallel group count not displayed');

  const groupCount = parseInt(parallelGroupMatch[1]);
  const indicators = document.querySelectorAll('.parallel-indicator');

  if (groupCount > 0 && indicators.length === 0) {
    throw new Error('Parallel groups exist but no indicators shown');
  }

  return { parallelGroups: groupCount, indicators: indicators.length };
}
```

#### HC-CD003: StepInspector Opens on Selection
- **Type:** interaction
- **Target:** StepInspector panel renders when step selected
- **Condition:** Inspector visible with correct step data
- **Failure Mode:** No details panel, can't inspect step
- **Automation Script:**
```javascript
async function testStepInspection() {
  const firstNode = document.querySelector('.step-node');
  if (!firstNode) throw new Error('No nodes to select');

  firstNode.click();
  await new Promise(resolve => setTimeout(resolve, 300));

  const inspector = document.querySelector('.step-inspector');
  if (!inspector) throw new Error('Inspector did not open');

  const stepData = inspector.textContent;
  if (!stepData.includes('#')) throw new Error('No step number in inspector');

  return { inspectorOpen: true };
}
```

### Warning Checks (Should Pass)

#### HC-CD004: Stats Accuracy
- **Type:** render
- **Target:** Stats section shows correct counts
- **Condition:** Stats match chain.steps counts
- **Failure Mode:** Misleading metrics

#### HC-CD005: Legend Rendered
- **Type:** render
- **Target:** Status legend with all 5 statuses
- **Condition:** Pending, In Progress, Completed, Failed, Skipped all shown
- **Failure Mode:** Users don't know color meaning

### Performance Benchmarks

| Metric | Threshold | Unit | Description |
|--------|-----------|------|-------------|
| dag-layout-time | 500 | ms | Time to compute and render DAG layout |
| node-selection | 100 | ms | Time to update selectedStep and re-render |
| large-chain-render | 2000 | ms | Time to render 50+ step chain |

---

## Dependencies

**Required Contexts:**
- DiscussContext (via useDiscussButton)

**Required Hooks:**
- useNodesState (ReactFlow)
- useEdgesState (ReactFlow)
- useCallback (React)
- useMemo (React)
- useState (React)
- useDiscussButton (custom)

**Child Components:**
- StepNode (custom node type)
- ChainBadge
- StepInspector
- DiscussButton
- DiscussDialog
- ReactFlow (Controls, Background, MiniMap)

**Required Props:**
- `chain` (Chain object)

---

## Notes

**DAG Layout:**
- Uses dagre library for hierarchical layout
- Nodes arranged left-to-right by dependency level
- Parallel steps positioned vertically at same x-coordinate

**Parallel Group Detection:**
- Analyzes waitsFor dependencies
- Groups steps with identical dependency sets
- Displays group size as indicator on nodes

**Chain Type Detection:**
- Analyzes chain structure to identify patterns
- Types: linear, parallel, hybrid, complex
- Displayed in ChainBadge

**Stats Calculation:**
- Total: chain.steps.length
- Completed: steps.filter(s => s.status === 'completed').length
- Similar for other statuses
- Parallel groups: parallelGroups.length

**Future Enhancements:**
- Add step filtering by status/action
- Support zoom to selected node
- Add minimap highlighting for selected step
- Support export to image/SVG

---

**Contract Authored:** 2026-02-10
**Last Updated:** 2026-02-10
**Version:** 1.0.0
