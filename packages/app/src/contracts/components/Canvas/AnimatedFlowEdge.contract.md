# Component Contract: AnimatedFlowEdge

**File:** `packages/app/src/components/FlowVisualization/AnimatedFlowEdge.tsx`
**Type:** widget
**Parent Group:** Canvas & Visualization
**Contract Version:** 1.0.0
**Last Reviewed:** 2026-02-10

---

## Identity

- **Component Name:** AnimatedFlowEdge
- **Introduced:** 2025-Q4
- **Description:** Custom ReactFlow edge with animated particles for active data flow, smooth step paths, and optional data labels.

---

## Render Location

**Mounts Under:**
- FlowVisualization (via ReactFlow edgeTypes registry)

**Render Conditions:**
1. Rendered by ReactFlow for each edge in the edges array
2. Edge type must be 'animatedEdge'
3. Source and target nodes exist

**Positioning:** SVG path (managed by ReactFlow layout engine)
**Z-Index:** Below nodes (ReactFlow default)

---

## Lifecycle

**Mount Triggers:**
- ReactFlow renders edge based on edges array
- Dependency added between steps

**Key Effects:**
None (pure SVG rendering with CSS animations)

**Cleanup Actions:**
None (ReactFlow handles edge lifecycle)

**Unmount Triggers:**
- Edge removed from edges array
- Dependency removed from chain
- Component unmounted

---

## Props Contract

### Inputs
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| id | string | ✅ | N/A | Unique edge identifier (format: "edge-{sourceNum}-{targetNum}") |
| sourceX | number | ✅ | N/A | X coordinate of source node |
| sourceY | number | ✅ | N/A | Y coordinate of source node |
| targetX | number | ✅ | N/A | X coordinate of target node |
| targetY | number | ✅ | N/A | Y coordinate of target node |
| sourcePosition | Position | ✅ | N/A | Source handle position (Top, Bottom, Left, Right) |
| targetPosition | Position | ✅ | N/A | Target handle position |
| style | CSSProperties | ❌ | {} | Custom inline styles |
| data | AnimatedFlowEdgeData | ❌ | undefined | Edge data (dataLabel, active, sourceStep, targetStep) |
| data.dataLabel | string | ❌ | undefined | Label to display on edge |
| data.active | boolean | ❌ | false | Whether edge is active (animated particles) |
| data.sourceStep | StepNumber | ❌ | undefined | Source step number |
| data.targetStep | StepNumber | ❌ | undefined | Target step number |
| markerEnd | MarkerType | ❌ | undefined | Arrow marker configuration |

### Callbacks Up (to parent)
None (edges are non-interactive)

### Callbacks Down (to children)
None (leaf component)

---

## State Ownership

### Local State
None (stateless presentation component)

### Context Consumption
None

### Derived State
| Name | Type | Dependencies | Computation |
|------|------|--------------|-------------|
| edgePath | string | `sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition` | getSmoothStepPath() from ReactFlow |
| labelX | number | edgePath | Midpoint X for label positioning |
| labelY | number | edgePath | Midpoint Y for label positioning |
| isActive | boolean | `data?.active` | Coalesces data.active to boolean |
| dataLabel | string \| undefined | `data?.dataLabel` | Extract label from data |

### Custom Hooks
None

---

## Interactions

### Parent Communication
None (edges are display-only)

### Child Communication
- **Child:** BaseEdge (ReactFlow component)
- **Mechanism:** props
- **Data Flow:** Passes path, markerEnd, style

- **Child:** EdgeLabelRenderer (ReactFlow component)
- **Mechanism:** props
- **Data Flow:** Renders label positioned at midpoint

- **Child:** SVG circle elements (animated particles)
- **Mechanism:** props
- **Data Flow:** animateMotion along edge path

### Sibling Communication
None

### Context Interaction
None

---

## Side Effects

### API Calls
None

### WebSocket Events
None

### Timers
None (animations via CSS)

### LocalStorage Operations
None

### DOM Manipulation
None (pure React/SVG rendering)

### Electron IPC (if applicable)
None

---

## Test Hooks

**CSS Selectors:**
- `.react-flow__edge` (ReactFlow default)
- `.edge-particle` (animated circles)
- `.edge-label` (label container)
- `.edge-label-content` (label text)

**Data Test IDs:**
None (edges identified by id prop)

**ARIA Labels:**
None (edges are decorative SVG paths)

**Visual Landmarks:**
1. Smooth step path — Orthogonal line connecting nodes
2. Animated particles — Traveling circles on active edges (yellow)
3. Data label — Text label at edge midpoint
4. Arrow marker — Directional arrowhead at target

---

## Health Checks

### Critical Checks (Must Pass)

#### HC-AFE001: Edge Path Rendered
- **Type:** render
- **Target:** SVG path element with correct d attribute
- **Condition:** Path connects source to target smoothly
- **Failure Mode:** No connection between nodes, broken dependency visualization
- **Automation Script:**
```javascript
async function checkEdgeRender(sourceNum, targetNum) {
  const edgeId = `edge-${sourceNum}-${targetNum}`;
  const edge = document.querySelector(`[data-id="${edgeId}"]`);
  if (!edge) throw new Error(`Edge ${edgeId} not rendered`);

  const path = edge.querySelector('path');
  if (!path || !path.getAttribute('d')) throw new Error('Edge path missing');

  return { edgeId, pathLength: path.getTotalLength() };
}
```

#### HC-AFE002: Active Edge Has Animated Particles
- **Type:** render
- **Target:** SVG circle elements with animateMotion
- **Condition:** Active edges have 2 traveling particles
- **Failure Mode:** No visual feedback for active data flow
- **Automation Script:**
```javascript
async function checkActiveEdgeAnimation(sourceNum, targetNum) {
  const edgeId = `edge-${sourceNum}-${targetNum}`;
  const edge = document.querySelector(`[data-id="${edgeId}"]`);
  if (!edge) throw new Error('Edge not found');

  const particles = edge.querySelectorAll('.edge-particle');
  if (particles.length !== 2) throw new Error('Active edge should have 2 particles');

  const animations = edge.querySelectorAll('animateMotion');
  if (animations.length !== 2) throw new Error('Missing animateMotion elements');

  return { particleCount: particles.length };
}
```

#### HC-AFE003: Edge Label Positioned Correctly
- **Type:** render
- **Target:** EdgeLabelRenderer with label at midpoint
- **Condition:** Label is centered on edge path
- **Failure Mode:** Misaligned or overlapping labels
- **Automation Script:**
```javascript
async function checkEdgeLabel(sourceNum, targetNum, expectedLabel) {
  const edgeId = `edge-${sourceNum}-${targetNum}`;
  const labels = Array.from(document.querySelectorAll('.edge-label-content'));
  const label = labels.find(l => l.textContent === expectedLabel);

  if (!label) throw new Error(`Label "${expectedLabel}" not found`);

  // Check positioning (should be near edge midpoint)
  const rect = label.getBoundingClientRect();
  if (rect.x === 0 && rect.y === 0) throw new Error('Label not positioned');

  return { label: expectedLabel, position: { x: rect.x, y: rect.y } };
}
```

### Warning Checks (Should Pass)

#### HC-AFE004: Dashed Style for Inactive Edges
- **Type:** render
- **Target:** Stroke-dasharray for inactive edges
- **Condition:** Inactive edges have dashed stroke
- **Failure Mode:** All edges look the same, harder to distinguish active flow

#### HC-AFE005: Color Coding Active vs Inactive
- **Type:** render
- **Target:** Stroke color (#fbc02d for active, #bdbdbd for inactive)
- **Condition:** Color matches active state
- **Failure Mode:** Confusing visual hierarchy

### Performance Benchmarks

| Metric | Threshold | Unit | Description |
|--------|-----------|------|-------------|
| edge-render-time | 20 | ms | Time to render single edge |
| particle-animation-smooth | 60 | fps | Smoothness of particle motion |
| label-position-calc | 10 | ms | Time to calculate label position |

---

## Dependencies

**Required Contexts:**
None

**Required Hooks:**
None

**Child Components:**
- BaseEdge (ReactFlow component)
- EdgeLabelRenderer (ReactFlow component)

**Required Props:**
- `sourceX`, `sourceY`, `targetX`, `targetY` (coordinates)
- `sourcePosition`, `targetPosition` (handle positions)

---

## Notes

**Edge Styling:**
- Active edges: Solid yellow (#fbc02d), strokeWidth: 2
- Inactive edges: Dashed gray (#bdbdbd), strokeWidth: 2, dasharray: "5, 5"
- Arrow marker: Matches edge color

**Particle Animation:**
- Duration: 2s per particle
- Repeat: Infinite
- Offset: Second particle starts at 0.5s (staggered)
- Color: Yellow (#fbc02d)
- Radius: 3px

**Path Type:**
- Smooth step path (orthogonal routing with rounded corners)
- Avoids diagonal lines for cleaner appearance
- Compatible with swimlane layout (vertical lanes)

**Data Label Styling:**
- Background: White with border
- Padding: 4px 8px
- Border-radius: 4px
- Position: Absolute at edge midpoint
- Active edges: Highlighted style (optional)

**Future Enhancements:**
- Add edge thickness variation based on data volume
- Support custom particle colors/shapes
- Add hover tooltips with dependency details
- Support conditional edge rendering (hide when zoomed out)

---

**Contract Authored:** 2026-02-10
**Last Updated:** 2026-02-10
**Version:** 1.0.0
