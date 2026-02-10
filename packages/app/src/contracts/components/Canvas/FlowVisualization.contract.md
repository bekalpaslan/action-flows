# Component Contract: FlowVisualization

**File:** `packages/app/src/components/FlowVisualization/FlowVisualization.tsx`
**Type:** feature
**Parent Group:** Canvas & Visualization
**Contract Version:** 1.0.0
**Last Reviewed:** 2026-02-10

---

## Identity

- **Component Name:** FlowVisualization
- **Introduced:** 2025-Q4
- **Description:** Main ReactFlow-based visualization for chain execution flow with swimlane layout, animated nodes/edges, and real-time status updates.

---

## Render Location

**Mounts Under:**
- RightVisualizationArea
- HybridFlowViz

**Render Conditions:**
1. Chain prop is provided (`chain` is not null)
2. Chain has at least one step (`chain.steps.length > 0`)

**Positioning:** relative (fills container)
**Z-Index:** 0 (base canvas), 10 for panels

---

## Lifecycle

**Mount Triggers:**
- User attaches a session with an active chain
- Chain data is loaded from backend

**Key Effects:**
1. **Dependencies:** `[nodes, setFlowNodes]`
   - **Side Effects:** Updates ReactFlow nodes state when computed nodes change
   - **Cleanup:** None
   - **Condition:** Runs whenever computed nodes array changes

2. **Dependencies:** `[edges, setFlowEdges]`
   - **Side Effects:** Updates ReactFlow edges state when computed edges change
   - **Cleanup:** None
   - **Condition:** Runs whenever computed edges array changes

3. **Dependencies:** `[chain.id, fitView]`
   - **Side Effects:** Auto-fits view with 20% padding after 100ms delay
   - **Cleanup:** Clears timeout on unmount
   - **Condition:** Runs when chain.id changes (new chain loaded)

**Cleanup Actions:**
- Clears fitView timeout
- ReactFlow cleanup handled by library

**Unmount Triggers:**
- Session is closed/detached
- User navigates away from flow visualization

---

## Props Contract

### Inputs
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| chain | Chain | ✅ | N/A | Chain object with steps and metadata |
| onStepClick | (stepNumber: number) => void | ❌ | undefined | Callback when a step node is clicked |
| enableAnimations | boolean | ❌ | true | Enable node animation states |

### Callbacks Up (to parent)
| Callback | Signature | Description |
|----------|-----------|-------------|
| onStepClick | `(stepNumber: number) => void` | Emits step number when node is clicked for inspection |

### Callbacks Down (to children)
| Callback | Signature | Passed To | Description |
|----------|-----------|-----------|-------------|
| onInspect | `(stepNumber: number) => void` | AnimatedStepNode | Triggers when node is clicked, calls onStepClick |
| openDialog | `() => void` | DiscussButton | Opens discuss dialog for FlowVisualization |

---

## State Ownership

### Local State
| State | Type | Initial | Updated By |
|-------|------|---------|------------|
| selectedStep | number \| null | null | onInspect callback from AnimatedStepNode |
| flowNodes | Node[] | computed nodes | setFlowNodes via useNodesState |
| flowEdges | Edge[] | computed edges | setFlowEdges via useEdgesState |

### Context Consumption
| Context | Values Used |
|---------|-------------|
| DiscussContext | prefillChatInput (via useDiscussButton) |
| ReactFlowContext | fitView (from useReactFlow) |

### Derived State
| Name | Type | Dependencies | Computation |
|------|------|--------------|-------------|
| swimlaneAssignments | Map<stepNum, lane> | `[chain]` | assignSwimlanes(chain) - maps steps to action types |
| swimlaneNames | string[] | `[chain]` | getSwimlaneNames(chain) - unique action types |
| nodes | Node<AnimatedStepNodeData>[] | `[chain.steps, swimlaneAssignments, onStepClick, enableAnimations]` | Computes positions, animation states, builds ReactFlow nodes |
| edges | Edge[] | `[chain.steps]` | calculateSwimlaneEdges - builds edges from waitsFor dependencies |

### Custom Hooks
- `useReactFlow()` — ReactFlow library hook for fitView and other canvas operations
- `useNodesState()` — ReactFlow hook for managing nodes with change handlers
- `useEdgesState()` — ReactFlow hook for managing edges with change handlers
- `useDiscussButton()` — Opens discuss dialog with chain context

---

## Interactions

### Parent Communication
- **Mechanism:** prop-callback
- **Description:** Emits step number when node is clicked via onStepClick callback
- **Example:** `onStepClick?.(stepNumber)` → Parent opens StepInspector panel

### Child Communication
- **Child:** AnimatedStepNode (via ReactFlow nodeTypes)
- **Mechanism:** props (node.data)
- **Data Flow:** Passes step, status, animation state, onInspect callback to each node

- **Child:** AnimatedFlowEdge (via ReactFlow edgeTypes)
- **Mechanism:** props (edge.data)
- **Data Flow:** Passes dataLabel, active state, source/target step numbers

- **Child:** SwimlaneBackground
- **Mechanism:** props
- **Data Flow:** Passes swimlaneNames array for rendering lane labels

- **Child:** DiscussButton + DiscussDialog
- **Mechanism:** props + context
- **Data Flow:** Passes componentName, onClick, chain context (chainId, title, stepCount, selectedStep)

### Sibling Communication
- **Sibling:** None (self-contained visualization)
- **Mechanism:** N/A
- **Description:** N/A

### Context Interaction
- **Context:** DiscussContext
- **Role:** consumer
- **Operations:** Prefills chat input when discuss dialog sends message

- **Context:** ReactFlowContext (implicit)
- **Role:** consumer (via useReactFlow)
- **Operations:** fitView, zoom controls

---

## Side Effects

### API Calls
| Endpoint | Method | Trigger | Response Handling |
|----------|--------|---------|-------------------|
| None | N/A | N/A | N/A (receives data via props) |

### WebSocket Events
| Event Type | Trigger | Handler |
|------------|---------|---------|
| None (indirect) | N/A | Parent receives events and updates chain prop |

### Timers
| Type | Duration | Purpose | Cleanup |
|------|----------|---------|---------|
| timeout | 100ms | Delay fitView to allow layout to settle | ✅ Cleared on unmount/re-trigger |

### LocalStorage Operations
| Key | Operation | Trigger | Value |
|-----|-----------|---------|-------|
| None | N/A | N/A | N/A |

### DOM Manipulation
| Target | Operation | Trigger |
|--------|-----------|---------|
| ReactFlow canvas | Auto-fit view | Chain change, manual zoom/pan |

### Electron IPC (if applicable)
| Channel | Direction | Purpose |
|---------|-----------|---------|
| None | N/A | N/A |

---

## Test Hooks

**CSS Selectors:**
- `.flow-visualization`
- `.swimlane-panel`
- `.flow-discuss-panel`
- `.react-flow`

**Data Test IDs:**
- None currently (could add `data-testid="flow-visualization-canvas"`)

**ARIA Labels:**
- None explicit (ReactFlow has internal aria labels)

**Visual Landmarks:**
1. ReactFlow canvas (`.react-flow`) — Main interactive flow diagram
2. SwimlaneBackground panel (`.swimlane-panel`) — Top-left overlay with action type labels
3. DiscussButton panel (`.flow-discuss-panel`) — Top-right overlay
4. MiniMap (ReactFlow built-in) — Bottom-right navigation thumbnail
5. Controls (ReactFlow built-in) — Bottom-left zoom/fit controls

---

## Health Checks

### Critical Checks (Must Pass)

#### HC-FV001: ReactFlow Rendering
- **Type:** render
- **Target:** ReactFlow canvas with nodes and edges
- **Condition:** `.react-flow` exists, nodes and edges arrays have correct lengths
- **Failure Mode:** Blank canvas, no visualization
- **Automation Script:**
```javascript
async function checkFlowVisualizationRender() {
  const canvas = document.querySelector('.flow-visualization .react-flow');
  if (!canvas) throw new Error('ReactFlow canvas not rendered');

  const nodes = canvas.querySelectorAll('.react-flow__node');
  const edges = canvas.querySelectorAll('.react-flow__edge');

  if (nodes.length === 0) throw new Error('No nodes rendered');
  if (edges.length === 0 && nodes.length > 1) throw new Error('No edges for multi-node chain');

  return { nodeCount: nodes.length, edgeCount: edges.length };
}
```

#### HC-FV002: Swimlane Layout
- **Type:** render
- **Target:** SwimlaneBackground with action type labels
- **Condition:** `.swimlane-panel` exists, swimlane labels visible
- **Failure Mode:** No action type grouping, nodes not organized vertically
- **Automation Script:**
```javascript
async function checkSwimlaneLayout() {
  const panel = document.querySelector('.swimlane-panel');
  if (!panel) throw new Error('Swimlane panel not rendered');

  const swimlanes = panel.querySelectorAll('.swimlane');
  const labels = panel.querySelectorAll('.swimlane-label');

  if (swimlanes.length === 0) throw new Error('No swimlanes rendered');
  if (labels.length !== swimlanes.length) throw new Error('Swimlane label mismatch');

  return { swimlaneCount: swimlanes.length };
}
```

#### HC-FV003: Node Click Interaction
- **Type:** interaction
- **Target:** AnimatedStepNode click triggers onStepClick callback
- **Condition:** Clicking node emits stepNumber
- **Failure Mode:** Node inspector doesn't open, no step details
- **Automation Script:**
```javascript
async function testNodeClick() {
  const firstNode = document.querySelector('.animated-step-node');
  if (!firstNode) throw new Error('No nodes to click');

  // Click node and wait for callback
  firstNode.click();

  // Check if parent received event (via StepInspector opening)
  await new Promise(resolve => setTimeout(resolve, 500));
  const inspector = document.querySelector('.step-inspector');

  if (!inspector) throw new Error('Node click did not trigger inspector');
  return { nodeClicked: true };
}
```

### Warning Checks (Should Pass)

#### HC-FV004: Animation States Applied
- **Type:** render
- **Target:** AnimatedStepNode CSS classes for status
- **Condition:** Nodes have correct animation classes (anim-pulse, anim-slide-in, etc.)
- **Failure Mode:** No visual feedback for status changes

#### HC-FV005: FitView Auto-Execution
- **Type:** lifecycle
- **Target:** fitView() called after chain change
- **Condition:** Canvas view adjusted after 100ms
- **Failure Mode:** User must manually zoom/pan to see all nodes

### Performance Benchmarks

| Metric | Threshold | Unit | Description |
|--------|-----------|------|-------------|
| initial-render | 500 | ms | Time to render initial canvas with nodes |
| fitview-delay | 150 | ms | Time for fitView to execute and settle |
| node-update | 100 | ms | Time to update single node status |
| large-chain-render | 2000 | ms | Time to render 50+ step chain |

---

## Dependencies

**Required Contexts:**
- DiscussContext (via useDiscussButton)
- ReactFlowContext (implicit, provided by ReactFlowProvider in parent)

**Required Hooks:**
- useReactFlow (ReactFlow library)
- useNodesState (ReactFlow library)
- useEdgesState (ReactFlow library)
- useDiscussButton (custom)

**Child Components:**
- AnimatedStepNode (custom node type)
- AnimatedFlowEdge (custom edge type)
- SwimlaneBackground (panel overlay)
- DiscussButton
- DiscussDialog
- ReactFlow (Controls, Background, MiniMap)

**Required Props:**
- `chain` (Chain object with steps)

---

## Notes

**Design Patterns:**
- Uses ReactFlow's custom node/edge system for full control over rendering
- Swimlane layout algorithm groups steps by action type (analyze, code, review, etc.)
- Animation states map to step status: pending → slide-in, in_progress → pulse, completed → shrink, failed → shake
- MiniMap provides color-coded status overview (green=completed, red=failed, yellow=in_progress, gray=pending)

**Performance Optimizations:**
- useMemo for expensive layout computations (swimlanes, nodes, edges)
- ReactFlow handles virtualization for large graphs (50+ nodes)
- FitView delayed 100ms to avoid layout thrashing

**Known Limitations:**
- Very large chains (200+ steps) may experience slow layout computation
- Swimlane layout assumes single action type per step (no hybrid steps)
- No zoom persistence across component remounts

**Future Enhancements:**
- Persist zoom/pan state in localStorage
- Add step filtering by status
- Support custom swimlane grouping (by agent, by module, etc.)
- Add step search/highlight feature

---

**Contract Authored:** 2026-02-10
**Last Updated:** 2026-02-10
**Version:** 1.0.0
