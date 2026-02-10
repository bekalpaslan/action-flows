# Component Contract: SwimlaneBackground

**File:** `packages/app/src/components/FlowVisualization/SwimlaneBackground.tsx`
**Type:** widget
**Parent Group:** Canvas & Visualization
**Contract Version:** 1.0.0
**Last Reviewed:** 2026-02-10

---

## Identity

- **Component Name:** SwimlaneBackground
- **Introduced:** 2025-Q4
- **Description:** Visual overlay for ReactFlow canvas showing horizontal lanes with action type labels (analyze, code, review, etc.).

---

## Render Location

**Mounts Under:**
- FlowVisualization (via ReactFlow Panel component, position="top-left")

**Render Conditions:**
1. Rendered as panel overlay on ReactFlow canvas
2. Always visible when FlowVisualization is mounted
3. swimlaneNames array has at least one element

**Positioning:** absolute (ReactFlow Panel component handles positioning)
**Z-Index:** 10 (above canvas, below controls)

---

## Lifecycle

**Mount Triggers:**
- FlowVisualization mounts with chain data
- swimlaneNames array is computed from chain

**Key Effects:**
None (pure rendering component)

**Cleanup Actions:**
None

**Unmount Triggers:**
- FlowVisualization unmounts
- Chain removed

---

## Props Contract

### Inputs
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| swimlaneNames | string[] | ✅ | N/A | Array of unique action type names (e.g., ["analyze", "code", "review"]) |
| swimlaneHeight | number | ❌ | 180 | Height of each lane in pixels |

### Callbacks Up (to parent)
None (display-only component)

### Callbacks Down (to children)
None (no children)

---

## State Ownership

### Local State
None (stateless presentation component)

### Context Consumption
None

### Derived State
None

### Custom Hooks
None

---

## Interactions

### Parent Communication
None (display-only)

### Child Communication
None (leaf component)

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
None (pure React rendering)

### Electron IPC (if applicable)
None

---

## Test Hooks

**CSS Selectors:**
- `.swimlane-background`
- `.swimlane`
- `.swimlane-label`

**Data Test IDs:**
None (could add `data-testid="swimlane-${name}"`)

**ARIA Labels:**
None (decorative visual element)

**Visual Landmarks:**
1. Horizontal lanes (`.swimlane`) — Alternating gray backgrounds
2. Action type labels (`.swimlane-label`) — White badges with action names (top-left of each lane)
3. Lane dividers — 1px solid borders between lanes

---

## Health Checks

### Critical Checks (Must Pass)

#### HC-SB001: Swimlanes Rendered for Each Action Type
- **Type:** render
- **Target:** Swimlane divs with correct count and labels
- **Condition:** Number of `.swimlane` elements equals swimlaneNames.length
- **Failure Mode:** Missing lanes, incorrect grouping
- **Automation Script:**
```javascript
async function checkSwimlaneRender(expectedNames) {
  const lanes = document.querySelectorAll('.swimlane');
  if (lanes.length !== expectedNames.length) {
    throw new Error(`Expected ${expectedNames.length} lanes, found ${lanes.length}`);
  }

  const labels = document.querySelectorAll('.swimlane-label');
  const labelTexts = Array.from(labels).map(l => l.textContent.toLowerCase());

  for (const name of expectedNames) {
    if (!labelTexts.includes(name.toLowerCase())) {
      throw new Error(`Missing swimlane label: ${name}`);
    }
  }

  return { laneCount: lanes.length, labels: labelTexts };
}
```

#### HC-SB002: Alternating Lane Backgrounds
- **Type:** render
- **Target:** Odd/even lanes have different background colors
- **Condition:** Even-index lanes are #fafafa, odd-index lanes are #f5f5f5
- **Failure Mode:** No visual separation between lanes
- **Automation Script:**
```javascript
async function checkLaneBackgrounds() {
  const lanes = document.querySelectorAll('.swimlane');
  const backgrounds = Array.from(lanes).map(l =>
    window.getComputedStyle(l).backgroundColor
  );

  const expectedEven = 'rgb(250, 250, 250)'; // #fafafa
  const expectedOdd = 'rgb(245, 245, 245)'; // #f5f5f5

  for (let i = 0; i < backgrounds.length; i++) {
    const expected = i % 2 === 0 ? expectedEven : expectedOdd;
    if (backgrounds[i] !== expected) {
      throw new Error(`Lane ${i} has wrong background: ${backgrounds[i]}`);
    }
  }

  return { backgrounds };
}
```

#### HC-SB003: Lane Heights Match swimlaneHeight Prop
- **Type:** render
- **Target:** Each lane div has height equal to swimlaneHeight
- **Condition:** Computed height matches prop (default 180px)
- **Failure Mode:** Misaligned nodes, wrong vertical spacing
- **Automation Script:**
```javascript
async function checkLaneHeights(expectedHeight = 180) {
  const lanes = document.querySelectorAll('.swimlane');
  for (let i = 0; i < lanes.length; i++) {
    const height = lanes[i].getBoundingClientRect().height;
    if (Math.abs(height - expectedHeight) > 1) {
      throw new Error(`Lane ${i} height ${height}px !== ${expectedHeight}px`);
    }
  }

  return { laneHeights: Array.from(lanes).map(l => l.getBoundingClientRect().height) };
}
```

### Warning Checks (Should Pass)

#### HC-SB004: Label Styling Consistency
- **Type:** render
- **Target:** All labels have consistent styling (font, padding, border)
- **Condition:** Labels are white background, 1px border, 4px border-radius
- **Failure Mode:** Inconsistent visual appearance

### Performance Benchmarks

| Metric | Threshold | Unit | Description |
|--------|-----------|------|-------------|
| render-time | 50 | ms | Time to render all swimlanes |
| layout-shift | 0 | px | Cumulative layout shift (should be 0) |

---

## Dependencies

**Required Contexts:**
None

**Required Hooks:**
None

**Child Components:**
None

**Required Props:**
- `swimlaneNames` (string[])

---

## Notes

**Lane Styling:**
- Even lanes (index 0, 2, 4...): #fafafa background
- Odd lanes (index 1, 3, 5...): #f5f5f5 background
- Border: 1px solid #e0e0e0 at bottom of each lane
- Pointer events: none (non-interactive, nodes can be clicked through)

**Label Styling:**
- Position: Absolute, top: 10px, left: 10px
- Background: White
- Border: 1px solid #e0e0e0
- Border-radius: 4px
- Padding: 4px 12px
- Font: 12px, weight 600, color #666
- Text-transform: Capitalize
- Box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1)

**Positioning Logic:**
- Each lane positioned at `yPos = index * swimlaneHeight`
- Lanes are positioned absolutely within ReactFlow Panel
- Panel uses top-left position (non-intrusive)

**Future Enhancements:**
- Add collapsible lanes
- Support custom lane colors per action type
- Add lane filtering (hide/show specific action types)
- Support horizontal swimlanes (for time-based layout)

---

**Contract Authored:** 2026-02-10
**Last Updated:** 2026-02-10
**Version:** 1.0.0
