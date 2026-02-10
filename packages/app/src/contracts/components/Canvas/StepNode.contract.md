# Component Contract: StepNode

**File:** `packages/app/src/components/ChainDAG/StepNode.tsx`
**Type:** widget
**Parent Group:** Canvas & Visualization
**Contract Version:** 1.0.0
**Last Reviewed:** 2026-02-10

---

## Identity

- **Component Name:** StepNode
- **Introduced:** 2025-Q4
- **Description:** ReactFlow custom node renderer for ChainDAG with parallel group indicator and status icons.

---

## Render Location

**Mounts Under:**
- ChainDAG (via ReactFlow)

**Render Conditions:**
1. Chain has steps to display
2. ReactFlow renders nodeType="stepNode"

**Positioning:** absolute (controlled by ReactFlow)
**Z-Index:** N/A (ReactFlow manages layering)

---

## Lifecycle

**Mount Triggers:**
- ReactFlow renders nodes

**Key Effects:**
None (stateless pure component)

**Cleanup Actions:**
None

**Unmount Triggers:**
- Step removed from chain or ReactFlow unmounts

---

## Props Contract

### Inputs
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| data.step | ChainStep | ✅ | N/A | Step object with status, action, model, etc. |
| data.isSelected | boolean | ✅ | N/A | Whether this node is selected |
| data.onSelect | (stepNumber: number) => void | ✅ | N/A | Selection callback |
| data.parallelGroupSize | number | ✅ | N/A | Size of parallel group (1 if not parallel) |

### Callbacks Up (to parent)
| Callback | Signature | Description |
|----------|-----------|-------------|
| onSelect | `(stepNumber: number) => void` | Called when node is clicked |

### Callbacks Down (to children)
None (leaf component)

---

## State Ownership

### Local State
None (stateless component)

### Context Consumption
None

### Derived State
| Name | Type | Dependencies | Computation |
|------|------|--------------|-------------|
| statusClass | string | `[step.status]` | Maps status to CSS class `status-${step.status}` |
| fadeInClass | string | `[step.status]` | Applies "fade-in" when status is in_progress or completed |

### Custom Hooks
None

---

## Interactions

### Parent Communication
- **Mechanism:** prop-callback
- **Description:** Calls onSelect when clicked or Enter/Space pressed
- **Example:** User clicks node → onSelect(stepNumber) → parent updates selection

### Child Communication
None (no child components)

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
None

### LocalStorage Operations
None

### DOM Manipulation
None (declarative React rendering)

### Electron IPC
None

---

## Test Hooks

**CSS Selectors:**
- `.step-node`
- `.step-node.selected`
- `.step-node.parallel`
- `.parallel-indicator`
- `.step-node-header`
- `.step-number`
- `.step-node-action`
- `.step-node-model`
- `.model-badge`
- `.step-node-duration`
- `.step-node-error`
- `.step-node-spinner`

**Data Test IDs:**
None

**ARIA Labels:**
- `role="button"`
- `tabIndex={0}` for keyboard accessibility

**Visual Landmarks:**
1. Step number badge at top (`.step-number`)
2. Parallel indicator "∥" if part of parallel group (`.parallel-indicator`)
3. Action name center (`.step-node-action`)
4. Model badge (`.model-badge`)
5. Duration/error/spinner based on status

---

## Health Checks

### Critical Checks (Must Pass)

#### HC-SN-001: Node Render
- **Type:** render
- **Target:** StepNode elements
- **Condition:** `.step-node` elements exist for each chain step
- **Failure Mode:** DAG appears empty
- **Automation Script:**
```javascript
const nodes = document.querySelectorAll('.step-node');
if (nodes.length === 0) throw new Error('No nodes rendered');
return true;
```

#### HC-SN-002: Selection Highlight
- **Type:** render
- **Target:** Selected node class
- **Condition:** `.step-node.selected` exists when a node is selected
- **Failure Mode:** No visual feedback for selection
- **Automation Script:**
```javascript
const selected = document.querySelector('.step-node.selected');
return { hasSelection: !!selected };
```

### Warning Checks (Should Pass)

#### HC-SN-003: Status Styling
- **Type:** render
- **Target:** Status class application
- **Condition:** Node has class matching its status
- **Failure Mode:** Incorrect visual status indicators

#### HC-SN-004: Parallel Indicator
- **Type:** render
- **Target:** Parallel group badge
- **Condition:** `.parallel-indicator` exists when parallelGroupSize > 1
- **Failure Mode:** Unclear which steps run in parallel

### Performance Benchmarks

| Metric | Threshold | Unit | Description |
|--------|-----------|------|-------------|
| render-time | 50 | ms | Time to render single node |

---

## Dependencies

**Required Contexts:**
None

**Required Hooks:**
None (pure functional component)

**Child Components:**
- Handle (from ReactFlow, for edges)

**Required Props:**
- data.step
- data.isSelected
- data.onSelect
- data.parallelGroupSize

---

## Notes

- This is a ReactFlow custom node component
- formatDuration utility converts milliseconds to human-readable format (ms, s, m s)
- Keyboard accessible via Enter and Space keys
- Fade-in animation applied on status change (in_progress, completed)
- Parallel indicator "∥" shows when node is part of a parallel group
- ReactFlow Handles positioned at Top (target) and Bottom (source) for edges
- Status-specific content:
  - `completed`: Shows duration
  - `failed`: Shows error message
  - `in_progress`: Shows spinner

---

**Contract Authored:** 2026-02-10
**Last Updated:** 2026-02-10
**Version:** 1.0.0
