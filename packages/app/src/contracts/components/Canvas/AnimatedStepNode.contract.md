# Component Contract: AnimatedStepNode

**File:** `packages/app/src/components/FlowVisualization/AnimatedStepNode.tsx`
**Type:** widget
**Parent Group:** Canvas & Visualization
**Contract Version:** 1.0.0
**Last Reviewed:** 2026-02-10

---

## Identity

- **Component Name:** AnimatedStepNode
- **Introduced:** 2025-Q4
- **Description:** Custom ReactFlow node for rendering individual chain steps with status-based animations, model badges, and duration display.

---

## Render Location

**Mounts Under:**
- FlowVisualization (via ReactFlow nodeTypes registry)

**Render Conditions:**
1. Rendered by ReactFlow for each node in the nodes array
2. Node type must be 'animatedStep'

**Positioning:** absolute (managed by ReactFlow layout engine)
**Z-Index:** Managed by ReactFlow (nodes are above edges)

---

## Lifecycle

**Mount Triggers:**
- ReactFlow renders node based on nodes array
- New step added to chain

**Key Effects:**
None (pure rendering component with no effects)

**Cleanup Actions:**
- None (ReactFlow handles node lifecycle)

**Unmount Triggers:**
- Node removed from nodes array
- Step removed from chain
- Component unmounted

---

## Props Contract

### Inputs
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| data | AnimatedStepNodeData | ✅ | N/A | Node data containing step, onInspect, animationState |
| data.step | ChainStep | ✅ | N/A | Step object with status, action, model, etc. |
| data.stepNumber | StepNumber | ✅ | N/A | Step number for display |
| data.action | string | ✅ | N/A | Action name (analyze, code, review, etc.) |
| data.status | StepStatus | ✅ | N/A | Step status (pending, in_progress, completed, failed, skipped) |
| data.description | string | ❌ | undefined | Step description text |
| data.model | string | ❌ | undefined | Model identifier (opus, sonnet, haiku) |
| data.animationState | FlowNodeData['animationState'] | ❌ | undefined | Animation state (slide-in, pulse, shrink, shake, idle) |
| data.onInspect | (stepNumber: number) => void | ❌ | undefined | Callback when node is clicked |

### Callbacks Up (to parent)
| Callback | Signature | Description |
|----------|-----------|-------------|
| onInspect | `(stepNumber: number) => void` | Emits step number when node is clicked |

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
| animationClass | string | `animationState` | Maps state to CSS class (anim-${state}) |
| statusClass | string | `step.status` | Maps status to CSS class (status-${status}) |

### Custom Hooks
None

---

## Interactions

### Parent Communication
- **Mechanism:** prop-callback
- **Description:** Emits stepNumber via onInspect when clicked
- **Example:** User clicks node → handleClick() → onInspect(stepNumber) → FlowVisualization updates selectedStep

### Child Communication
- **Child:** StatusIcon (internal helper component)
- **Mechanism:** props
- **Data Flow:** Passes step.status for icon rendering

- **Child:** Handle (ReactFlow component)
- **Mechanism:** props
- **Data Flow:** Renders input/output handles based on step dependencies

### Sibling Communication
None (nodes don't communicate directly)

### Context Interaction
None

---

## Side Effects

### API Calls
None

### WebSocket Events
None (receives updates via props)

### Timers
None

### LocalStorage Operations
None

### DOM Manipulation
None (pure React rendering)

### Electron IPC (if applicable)
None

---

## Test Hooks

**CSS Selectors:**
- `.animated-step-node`
- `.animated-step-node.status-completed`
- `.animated-step-node.status-in_progress`
- `.animated-step-node.anim-pulse`
- `.node-header`
- `.step-number`
- `.node-action`
- `.node-model`
- `.model-badge`
- `.node-duration`
- `.node-error`
- `.node-spinner`

**Data Test IDs:**
None (could add `data-testid="step-node-${stepNumber}"`)

**ARIA Labels:**
- `role="button"` on root div
- `tabIndex={0}` for keyboard accessibility
- `title={step.description || step.action}` for tooltip

**Visual Landmarks:**
1. Step number badge (`.step-number`) — e.g., "#1", "#2"
2. Status icon (`.status-icon`) — Visual indicator (✓, ✗, ⟳, ⊘, ○)
3. Action label (`.node-action`) — Action name (analyze, code, etc.)
4. Model badge (`.model-badge`) — Model type (opus, sonnet, haiku)
5. Spinner (`.node-spinner`) — Loading indicator for in_progress status

---

## Health Checks

### Critical Checks (Must Pass)

#### HC-ASN001: Node Renders with Step Data
- **Type:** render
- **Target:** Node root div with correct classes
- **Condition:** `.animated-step-node` exists, has status and animation classes
- **Failure Mode:** Blank or missing node
- **Automation Script:**
```javascript
async function checkNodeRender(stepNumber) {
  const node = document.querySelector(`.animated-step-node:has(.step-number:contains("#${stepNumber}"))`);
  if (!node) throw new Error(`Node ${stepNumber} not rendered`);

  const hasStatusClass = Array.from(node.classList).some(c => c.startsWith('status-'));
  if (!hasStatusClass) throw new Error('Missing status class');

  return { rendered: true, classes: Array.from(node.classList) };
}
```

#### HC-ASN002: Status Icon Matches Status
- **Type:** render
- **Target:** StatusIcon component shows correct icon
- **Condition:** Icon matches step.status (✓=completed, ✗=failed, etc.)
- **Failure Mode:** Wrong icon, confusing status indication
- **Automation Script:**
```javascript
async function checkStatusIcon(stepNumber, expectedStatus) {
  const node = document.querySelector(`.animated-step-node:has(.step-number:contains("#${stepNumber}"))`);
  const statusIcon = node?.querySelector('.status-icon');
  if (!statusIcon) throw new Error('Status icon missing');

  const iconMap = { completed: '✓', failed: '✗', in_progress: '⟳', skipped: '⊘', pending: '○' };
  const expectedIcon = iconMap[expectedStatus];

  if (!statusIcon.textContent.includes(expectedIcon)) {
    throw new Error(`Icon mismatch: expected ${expectedIcon}, got ${statusIcon.textContent}`);
  }

  return { status: expectedStatus, icon: statusIcon.textContent };
}
```

#### HC-ASN003: Node Click Triggers Inspect
- **Type:** interaction
- **Target:** onInspect callback invoked on click
- **Condition:** Clicking node emits stepNumber
- **Failure Mode:** No inspect panel opens
- **Automation Script:**
```javascript
async function testNodeClick(stepNumber) {
  const node = document.querySelector(`.animated-step-node:has(.step-number:contains("#${stepNumber}"))`);
  if (!node) throw new Error('Node not found');

  node.click();
  await new Promise(resolve => setTimeout(resolve, 300));

  // Check if inspect panel opened
  const inspector = document.querySelector('.step-inspector');
  if (!inspector) throw new Error('Inspector did not open');

  return { clicked: true, inspectorOpen: true };
}
```

### Warning Checks (Should Pass)

#### HC-ASN004: Animation Classes Applied
- **Type:** render
- **Target:** CSS animation classes (anim-pulse, anim-slide-in, etc.)
- **Condition:** Node has animation class matching animationState prop
- **Failure Mode:** No visual animation feedback

#### HC-ASN005: Model Badge Displayed
- **Type:** render
- **Target:** Model badge when step.model is present
- **Condition:** `.model-badge` exists with model name
- **Failure Mode:** Missing model attribution

#### HC-ASN006: Duration Displayed for Completed Steps
- **Type:** render
- **Target:** Duration text for completed steps
- **Condition:** `.node-duration` shows formatted duration (e.g., "2.5s", "1m 30s")
- **Failure Mode:** Missing duration information

### Performance Benchmarks

| Metric | Threshold | Unit | Description |
|--------|-----------|------|-------------|
| node-render-time | 50 | ms | Time to render single node |
| animation-transition | 300 | ms | Duration of CSS animation transitions |
| click-response | 100 | ms | Time from click to onInspect callback |

---

## Dependencies

**Required Contexts:**
None

**Required Hooks:**
None

**Child Components:**
- StatusIcon (internal helper)
- Handle (ReactFlow component for connection points)

**Required Props:**
- `data.step` (ChainStep object)
- `data.stepNumber` (StepNumber)

---

## Notes

**Status Colors:**
- Completed: Green (#4caf50)
- Failed: Red (#f44336)
- In Progress: Yellow (#fbc02d)
- Pending: Gray (#ccc)
- Skipped: Dark gray (#999)

**Animation States:**
- slide-in: Node enters from left (for pending → in_progress)
- pulse: Continuous pulsing border (for in_progress)
- shrink: Subtle scale-down (for completed)
- shake: Horizontal shake (for failed)
- idle: No animation

**Model Badge Colors:**
- opus: Blue
- sonnet: Green
- haiku: Purple
- (Colors defined in CSS)

**Keyboard Accessibility:**
- Enter/Space keys trigger click (onKeyDown handler)
- tabIndex={0} allows keyboard focus
- role="button" for screen readers

**Duration Formatting:**
- < 1s: "XXXms"
- < 60s: "X.Xs"
- >= 60s: "Xm Ys"

**Future Enhancements:**
- Add tooltip with full step details
- Support nested/grouped nodes for sub-steps
- Add progress bar for long-running steps
- Support custom node colors via props

---

**Contract Authored:** 2026-02-10
**Last Updated:** 2026-02-10
**Version:** 1.0.0
