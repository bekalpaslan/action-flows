# Component Contract: HybridFlowViz

**File:** `packages/app/src/components/SessionTile/HybridFlowViz.tsx`
**Type:** feature
**Parent Group:** Canvas & Visualization
**Contract Version:** 1.0.0
**Last Reviewed:** 2026-02-10

---

## Identity

- **Component Name:** HybridFlowViz
- **Introduced:** 2025-Q4
- **Description:** Combines FlowVisualization DAG with SquadPanel agent overlay for integrated visualization.

---

## Render Location

**Mounts Under:**
- SessionTile or other parent containers

**Render Conditions:**
1. Valid sessionId and chain provided

**Positioning:** relative
**Z-Index:** N/A (overlay handled internally)

---

## Lifecycle

**Mount Triggers:**
- Parent renders with valid sessionId and chain

**Key Effects:**
None (stateless component with useMemo optimization)

**Cleanup Actions:**
- ReactFlowProvider cleanup (handled by library)

**Unmount Triggers:**
- Parent unmounts

---

## Props Contract

### Inputs
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| sessionId | SessionId | ✅ | N/A | Session identifier |
| chain | Chain | ✅ | N/A | Chain to visualize |
| chainId | ChainId | ❌ | undefined | Optional chain ID (reserved for future tracking) |
| onNodeClick | (nodeId: string) => void | ❌ | undefined | Node click callback |
| onAgentClick | (agentId: string) => void | ❌ | undefined | Agent click callback |
| showAgents | boolean | ❌ | true | Show agent overlay |
| enableAnimations | boolean | ❌ | true | Enable flow animations |
| overlayPosition | 'top-left'\|'top-right'\|'bottom-left'\|'bottom-right' | ❌ | 'bottom-right' | Squad overlay position |
| overlayOpacity | number | ❌ | 0.9 | Overlay opacity (0-1) |

### Callbacks Up (to parent)
| Callback | Signature | Description |
|----------|-----------|-------------|
| onNodeClick | `(nodeId: string) => void` | Called when DAG node is clicked |
| onAgentClick | `(agentId: string) => void` | Called when agent avatar is clicked |

### Callbacks Down (to children)
| Callback | Signature | Passed To | Description |
|----------|-----------|-----------|-------------|
| handleStepClick | `(stepNumber: number) => void` | FlowVisualization | Converts stepNumber to nodeId for onNodeClick |
| onAgentClick | `(agentId: string) => void` | SquadPanel | Agent click passthrough |

---

## State Ownership

### Local State
None

### Context Consumption
None

### Derived State
| Name | Type | Dependencies | Computation |
|------|------|--------------|-------------|
| handleStepClick | `(stepNumber: number) => void` | `[onNodeClick]` | Converts stepNumber to `step-${stepNumber}` nodeId format |

### Custom Hooks
None

---

## Interactions

### Parent Communication
- **Mechanism:** prop-callback
- **Description:** Passes click events (node, agent) to parent via callbacks
- **Example:** Parent receives node click to open inspector

### Child Communication
- **Child:** FlowVisualization
- **Mechanism:** props
- **Data Flow:** Passes chain, sessionId, handleStepClick, enableAnimations

- **Child:** SquadPanel
- **Mechanism:** props
- **Data Flow:** Passes sessionId, onAgentClick, placement="overlay", position, opacity

### Sibling Communication
None

### Context Interaction
- **Context:** ReactFlowProvider
- **Role:** provider
- **Operations:** Wraps FlowVisualization for ReactFlow context

---

## Side Effects

### API Calls
None

### WebSocket Events
None

### Timers
None

### LocalStorage Operations
None

### DOM Manipulation
None

### Electron IPC
None

---

## Test Hooks

**CSS Selectors:**
- `.hybrid-flow-viz`
- `.hybrid-flow-viz__flow-container`
- `.hybrid-flow-viz__squad-overlay`

**Data Test IDs:**
None

**ARIA Labels:**
None

**Visual Landmarks:**
1. Full-size ReactFlow DAG visualization (`.hybrid-flow-viz__flow-container`)
2. Floating SquadPanel overlay (`.hybrid-flow-viz__squad-overlay`) at configured position

---

## Health Checks

### Critical Checks (Must Pass)

#### HC-HFV-001: Component Render
- **Type:** render
- **Target:** HybridFlowViz container
- **Condition:** `.hybrid-flow-viz` exists
- **Failure Mode:** No visualization UI
- **Automation Script:**
```javascript
const container = document.querySelector('.hybrid-flow-viz');
if (!container) throw new Error('HybridFlowViz not rendered');
return true;
```

#### HC-HFV-002: Flow Container
- **Type:** render
- **Target:** FlowVisualization area
- **Condition:** `.hybrid-flow-viz__flow-container` exists
- **Failure Mode:** DAG not displayed
- **Automation Script:**
```javascript
const container = document.querySelector('.hybrid-flow-viz');
const flowArea = container.querySelector('.hybrid-flow-viz__flow-container');
if (!flowArea) throw new Error('Flow container missing');
return true;
```

### Warning Checks (Should Pass)

#### HC-HFV-003: Squad Overlay
- **Type:** render
- **Target:** SquadPanel overlay
- **Condition:** `.hybrid-flow-viz__squad-overlay` exists when showAgents=true
- **Failure Mode:** No agent avatars displayed
- **Automation Script:**
```javascript
const container = document.querySelector('.hybrid-flow-viz');
const squadOverlay = container.querySelector('.hybrid-flow-viz__squad-overlay');
return { hasSquad: !!squadOverlay };
```

### Performance Benchmarks

| Metric | Threshold | Unit | Description |
|--------|-----------|------|-------------|
| render-time | 150 | ms | Time to first paint (includes ReactFlow init) |

---

## Dependencies

**Required Contexts:**
- ReactFlowProvider (internally provided)

**Required Hooks:**
- useMemo

**Child Components:**
- FlowVisualization
- SquadPanel

**Required Props:**
- sessionId
- chain

---

## Notes

- This component provides a unified view of chain execution + agent activity
- ReactFlowProvider wraps FlowVisualization (required by ReactFlow)
- SquadPanel uses `placement="overlay"` to float above the DAG
- chainId prop is reserved for future use (chain-specific tracking/telemetry)
- handleStepClick converts stepNumber to nodeId format: `step-${stepNumber}`
- overlayOpacity defaults to 0.9 for semi-transparent agent panel
- Dark theme compatible with smooth transitions

---

**Contract Authored:** 2026-02-10
**Last Updated:** 2026-02-10
**Version:** 1.0.0
