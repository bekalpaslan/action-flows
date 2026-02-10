# Component Contract: TimelineView

**File:** `packages/app/src/components/TimelineView/TimelineView.tsx`
**Type:** feature
**Parent Group:** Harmony (visualization)
**Contract Version:** 1.0.0
**Last Reviewed:** 2026-02-10

---

## Identity

- **Component Name:** TimelineView
- **Introduced:** 2025-12-18 (estimated)
- **Description:** Horizontal timeline visualization showing chain steps positioned by execution time with parallel steps stacked vertically. Includes StepInspector sidebar for detailed step examination.

---

## Render Location

**Mounts Under:**
- SessionPanel (alternative to FlowVisualization)
- TimelineModeToggle (user switches between flow graph and timeline)

**Render Conditions:**
1. When chain has at least one step
2. When user selects timeline view mode

**Positioning:** relative
**Z-Index:** N/A

---

## Lifecycle

**Mount Triggers:**
- Parent renders with chain data

**Key Effects:**
None (pure rendering based on props)

**Cleanup Actions:**
None

**Unmount Triggers:**
- User switches to different visualization mode or closes session

---

## Props Contract

### Inputs
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| chain | Chain | ✅ | N/A | Chain data with steps array |
| onStepSelected | (stepNumber: StepNumber) => void | ❌ | undefined | Callback when step clicked |

### Callbacks Up (to parent)
| Callback | Signature | Description |
|----------|-----------|-------------|
| onStepSelected | `(stepNumber: StepNumber) => void` | Fires when user clicks a step bar |

### Callbacks Down (to children)
| Callback | Signature | Passed To | Description |
|----------|-----------|-----------|-------------|
| onClose | `() => void` | StepInspector | Closes step inspector sidebar |

---

## State Ownership

### Local State
| State | Type | Initial | Updated By |
|-------|------|---------|------------|
| selectedStep | number \| null | null | `handleStepClick` (step bar click) |

### Context Consumption
| Context | Values Used |
|---------|-------------|
| DiscussContext | `registerChatInput`, `prefillChatInput` |

### Derived State
| Name | Type | Dependencies | Computation |
|------|------|--------------|-------------|
| chainMetadata | ChainMetadata | `[chain]` | `detectChainType(chain)` |
| stats | { total, completed, failed, inProgress } | `[chain.steps]` | Counts steps by status |
| positions | TimelinePosition[] | `[chain]` | `calculateTimelinePositions(chain)` |
| stepMap | Map<number, ChainStep> | `[chain.steps]` | Maps stepNumber to ChainStep |
| maxRows | number | `[positions]` | Max row value + 1 (for container height) |
| selectedStepData | ChainStep \| null | `[stepMap, selectedStep]` | `stepMap.get(selectedStep)` |

### Custom Hooks
- `useDiscussButton({ componentName, getContext })` — DiscussDialog state

---

## Interactions

### Parent Communication
- **Mechanism:** prop-callback
- **Description:** Notifies parent when step is selected
- **Example:** `onStepSelected?.(stepNumber)`

### Child Communication
- **Child:** StepInspector
- **Mechanism:** props
- **Data Flow:** Passes `step`, `onClose` callback

### Sibling Communication
None

### Context Interaction
- **Context:** DiscussContext
- **Role:** consumer
- **Operations:** Opens DiscussDialog to send timeline context to ChatPanel

---

## Side Effects

### API Calls
None

### WebSocket Events
None (data comes via props)

### Timers
None

### LocalStorage Operations
None

### DOM Manipulation
None

### Electron IPC (if applicable)
N/A

---

## Test Hooks

**CSS Selectors:**
- `.timeline-view-container`
- `.timeline-view-main`
- `.timeline-view-header`
- `.timeline-view-title`
- `.timeline-view-stats`
- `.timeline-view-stat`
- `.timeline-view-canvas`
- `.timeline-rows` (main timeline area)
- `.timeline-step` (individual step bars)
- `.timeline-step.completed`, `.timeline-step.failed`, `.timeline-step.in-progress`, `.timeline-step.pending`, `.timeline-step.skipped`
- `.timeline-step.selected` (selected step)
- `.timeline-step-content` (step details overlay)
- `.timeline-step-number`, `.timeline-step-action`, `.timeline-step-model`, `.timeline-step-duration`
- `.timeline-step-bar` (colored bar indicating status)
- `.timeline-axis` (time axis labels)
- `.timeline-view-legend` (status legend)

**Data Test IDs:**
None

**ARIA Labels:**
- `role="button"` on `.timeline-step`
- `tabIndex={0}` on step bars
- `aria-label="Step {N}: {action} using {model} model. Status: {status}"`
- `aria-pressed={isSelected}`

**Visual Landmarks:**
1. Header with chain title and stats (`.timeline-view-header`) — Shows total steps, completed, in progress, failed
2. Timeline canvas (`.timeline-view-canvas`) — Horizontal timeline with step bars
3. Time axis (`.timeline-axis`) — Start and End labels
4. Legend (`.timeline-view-legend`) — Color key for step statuses
5. StepInspector sidebar (`.step-inspector`) — Step details panel on right

---

## Health Checks

### Critical Checks (Must Pass)

#### HC-TLV-001: Step Bars Rendered
- **Type:** render
- **Target:** `.timeline-step`
- **Condition:** Number of step bars equals `chain.steps.length`
- **Failure Mode:** Steps missing from timeline
- **Automation Script:**
```javascript
// Chrome MCP script
const steps = document.querySelectorAll('.timeline-step');
const statsTotal = parseInt(document.querySelector('.timeline-view-stat span')?.textContent || '0');
if (steps.length !== statsTotal) {
  throw new Error(`Timeline step count mismatch: ${steps.length} vs ${statsTotal}`);
}
```

#### HC-TLV-002: Timeline Positioning Algorithm
- **Type:** render
- **Target:** `.timeline-step` inline styles (`left`, `width`, `top`)
- **Condition:** Steps positioned horizontally by time, stacked vertically for overlaps
- **Failure Mode:** Overlapping steps, incorrect timeline layout
- **Automation Script:**
```javascript
// Chrome MCP script
const steps = document.querySelectorAll('.timeline-step');
steps.forEach(step => {
  const left = step.style.left;
  const width = step.style.width;
  const top = step.style.top;
  if (!left || !width || !top) {
    throw new Error('Timeline step missing positioning styles');
  }
});
```

#### HC-TLV-003: Step Click Opens Inspector
- **Type:** interaction
- **Target:** `.timeline-step` click handler
- **Condition:** Clicking step updates `selectedStep` state and opens StepInspector
- **Failure Mode:** Cannot inspect step details
- **Automation Script:**
```javascript
// Chrome MCP script
const step = document.querySelector('.timeline-step');
step.click();
setTimeout(() => {
  const inspector = document.querySelector('.step-inspector:not(.step-inspector-empty)');
  if (!inspector) throw new Error('StepInspector not opening on step click');
}, 100);
```

### Warning Checks (Should Pass)

#### HC-TLV-004: Legend Matches Status Colors
- **Type:** render
- **Target:** `.timeline-view-legend .legend-indicator`
- **Condition:** Legend colors match step bar colors
- **Failure Mode:** Confusing color scheme

### Performance Benchmarks

| Metric | Threshold | Unit | Description |
|--------|-----------|------|-------------|
| render-20-steps | 150 | ms | Time to render timeline with 20 steps |
| layout-calculation | 50 | ms | Time to calculate timeline positions |

---

## Dependencies

**Required Contexts:**
- DiscussContext

**Required Hooks:**
- `useDiscussButton({ componentName, getContext })`

**Child Components:**
- ChainBadge
- StepInspector
- DiscussButton
- DiscussDialog

**Required Props:**
- `chain` (Chain)

---

## Notes

**Timeline Positioning Algorithm:**
1. Calculate time range from earliest `startedAt` to latest `completedAt` (or now)
2. Add 5% padding on each side
3. Position each step's left edge at `(startTime - paddedMin) / paddedDuration * 100`%
4. Set step width to `(endTime - startTime) / paddedDuration * 100`%
5. Stack overlapping steps in rows (row 0, row 1, etc.)

**Duration Formatting:**
- < 1s: "Xms"
- < 1min: "X.Xs"
- ≥ 1min: "Xm Ys"

**Status Colors:**
- `pending`: Gray (#bdbdbd)
- `in_progress`: Amber (#fbc02d)
- `completed`: Green (#4caf50)
- `failed`: Red (#f44336)
- `skipped`: Muted gray (#9e9e9e)

**Keyboard Navigation:**
- Enter or Space on focused step → Select step

---

**Contract Authored:** 2026-02-10
**Last Updated:** 2026-02-10
**Version:** 1.0.0
