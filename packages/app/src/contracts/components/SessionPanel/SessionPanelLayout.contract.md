# Component Contract: SessionInfoPanel (Consolidated Layout)

**File:** `packages/app/src/components/SessionPanel/SessionInfoPanel.tsx`
**Type:** feature
**Parent Group:** SessionPanel/
**Contract Version:** 1.0.0
**Last Reviewed:** 2026-02-10

---

## Identity

- **Component Name:** SessionInfoPanel (consolidated from SessionPanelLayout architecture)
- **Introduced:** 2026-01-15
- **Description:** Top-level 25/75 horizontal split container for session panel system with resizable left panels and visualization area, localStorage persistence per session.

---

## Render Location

**Mounts Under:**
- WorkWorkbench (for each attached session)
- Any workbench rendering session panels

**Render Conditions:**
1. Session prop provided
2. Session ID valid

**Positioning:** relative (fills parent container)
**Z-Index:** N/A

---

## Lifecycle

**Mount Triggers:**
- Session attached to workbench
- Parent renders SessionPanelLayout

**Key Effects:**
1. **Dependencies:** `[session.id, defaultSplitRatio]`
   - **Side Effects:** Loads saved split ratio from localStorage
   - **Cleanup:** None
   - **Condition:** Runs when session changes

**Cleanup Actions:**
- None (localStorage persists across sessions)

**Unmount Triggers:**
- Session detached
- Parent unmounts

---

## Props Contract

### Inputs
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| session | `Session` | ✅ | N/A | Session to display |
| onSessionClose | `() => void` | ❌ | N/A | Callback when session closed |
| onSessionDetach | `() => void` | ❌ | N/A | Callback when session detached |
| onSubmitInput | `(input: string) => Promise<void>` | ❌ | N/A | Callback when user submits input |
| onNodeClick | `(nodeId: string) => void` | ❌ | N/A | Callback when node clicked in viz |
| onAgentClick | `(agentId: string) => void` | ❌ | N/A | Callback when agent clicked |
| onSelectFlow | `(flow: FlowAction) => void` | ❌ | N/A | Callback when flow selected |
| flows | `FlowAction[]` | ❌ | `[]` | Available flows |
| actions | `FlowAction[]` | ❌ | `[]` | Available actions |
| showAgents | `boolean` | ❌ | `true` | Show agents overlay in viz |
| defaultSplitRatio | `number` | ❌ | `25` | Default left panel width (%) |

### Callbacks Up (to parent)
| Callback | Signature | Description |
|----------|-----------|-------------|
| onSessionClose | `() => void` | Session closed → parent removes |
| onSessionDetach | `() => void` | Session detached → parent removes |
| onSubmitInput | `(input: string) => Promise<void>` | User submits input → parent processes |
| onNodeClick | `(nodeId: string) => void` | User clicks node → parent handles |
| onAgentClick | `(agentId: string) => void` | User clicks agent → parent handles |
| onSelectFlow | `(flow: FlowAction) => void` | User selects flow → parent handles |

### Callbacks Down (to children)
| Callback | Signature | Passed To | Description |
|----------|-----------|-----------|-------------|
| onDrag | `(deltaX: number) => void` | ResizeHandle | Delta X → updates splitRatio |
| onDragStart | `() => void` | ResizeHandle | Drag starts → sets isDragging=true |
| onDragEnd | `() => void` | ResizeHandle | Drag ends → saves to localStorage |
| onSubmitInput | `(input: string) => Promise<void>` | LeftPanelStack | User input → parent callback |
| onSelectFlow | `(flow: FlowAction) => void` | LeftPanelStack | Flow select → parent callback |
| onNodeClick | `(nodeId: string) => void` | RightVisualizationArea | Node click → parent callback |
| onAgentClick | `(agentId: string) => void` | RightVisualizationArea | Agent click → parent callback |

---

## State Ownership

### Local State
| State | Type | Initial | Updated By |
|-------|------|---------|------------|
| splitRatio | `number` | `loadSplitRatio(session.id, defaultSplitRatio)` | setSplitRatio (drag handler) |
| isDragging | `boolean` | `false` | setIsDragging (drag start/end) |

### Context Consumption
| Context | Values Used |
|---------|-------------|
| N/A | N/A |

### Derived State
| Name | Type | Dependencies | Computation |
|------|------|--------------|-------------|
| N/A | N/A | N/A | N/A |

### Custom Hooks
- None

---

## Interactions

### Parent Communication
- **Mechanism:** prop-callback
- **Description:** Notifies parent of user actions (close, detach, input, clicks)
- **Example:**
  ```tsx
  onSubmitInput(input) → parent.handleSessionInput() → backend API call
  ```

### Child Communication
- **Child:** LeftPanelStack
- **Mechanism:** props
- **Data Flow:** Passes `session`, `onSubmitInput`, `onSelectFlow`, `flows`, `actions`

- **Child:** RightVisualizationArea
- **Mechanism:** props
- **Data Flow:** Passes `session`, `onNodeClick`, `onAgentClick`, `showAgents`

- **Child:** ResizeHandle
- **Mechanism:** props
- **Data Flow:** Passes `onDrag`, `onDragStart`, `onDragEnd` callbacks

### Sibling Communication
- **Sibling:** None (independent layout)
- **Mechanism:** N/A
- **Description:** N/A

### Context Interaction
- **Context:** None
- **Role:** N/A
- **Operations:** N/A

---

## Side Effects

### API Calls
| Endpoint | Method | Trigger | Response Handling |
|----------|--------|---------|-------------------|
| N/A | N/A | N/A | N/A (handled by children/parent) |

### WebSocket Events
| Event Type | Trigger | Handler |
|------------|---------|---------|
| N/A | N/A | N/A (handled by children) |

### Timers
| Type | Duration | Purpose | Cleanup |
|------|----------|---------|---------|
| N/A | N/A | N/A | N/A |

### LocalStorage Operations
| Key | Operation | Trigger | Value |
|-----|-----------|---------|-------|
| `session-panel-split-ratio-${sessionId}` | read | Mount, session change | Split ratio (15-40) |
| `session-panel-split-ratio-${sessionId}` | write | Drag end | Updated split ratio |

### DOM Manipulation
| Target | Operation | Trigger |
|--------|-----------|---------|
| Container width | Measure | Drag operation (calculates % from pixels) |

### Electron IPC (if applicable)
| Channel | Direction | Purpose |
|---------|-----------|---------|
| N/A | N/A | N/A |

---

## Test Hooks

**CSS Selectors:**
- `.session-panel-layout`
- `.session-panel-layout.dragging`
- `.session-panel-layout__left`
- `.session-panel-layout__right`

**Data Test IDs:**
- N/A (use CSS selectors)

**ARIA Labels:**
- None specified (consider adding for accessibility)

**Visual Landmarks:**
1. Left panel (`.session-panel-layout__left`) — ChatPanel container, default 25% width
2. Resize handle (`.resize-handle`) — Vertical 4px draggable divider
3. Right panel (`.session-panel-layout__right`) — Visualization area, default 75% width

---

## Health Checks

### Critical Checks (Must Pass)

#### HC-SPL-001: Initial Split Ratio
- **Type:** render
- **Target:** Left panel renders at correct width
- **Condition:** Width matches localStorage or default (25%)
- **Failure Mode:** Incorrect layout proportions
- **Automation Script:**
```javascript
// Navigate to session panel
const panel = await page.locator('.session-panel-layout').first();

// Get left panel width
const leftPanel = panel.locator('.session-panel-layout__left');
const leftWidth = await leftPanel.evaluate(el => {
  const computed = window.getComputedStyle(el);
  return parseFloat(computed.width);
});

// Get container width
const containerWidth = await panel.evaluate(el => parseFloat(window.getComputedStyle(el).width));

// Calculate percentage
const ratio = (leftWidth / containerWidth) * 100;

// Verify within expected range (15-40%, default 25%)
if (ratio < 15 || ratio > 40) {
  throw new Error(`Split ratio out of range: ${ratio}%`);
}
```

#### HC-SPL-002: Drag Resize Functionality
- **Type:** interaction
- **Target:** ResizeHandle drag updates widths
- **Condition:** Dragging handle adjusts left/right panel widths
- **Failure Mode:** Cannot resize panels
- **Automation Script:**
```javascript
const panel = await page.locator('.session-panel-layout').first();
const handle = panel.locator('.resize-handle');

// Get initial width
const initialWidth = await panel.locator('.session-panel-layout__left').evaluate(el => {
  return parseFloat(window.getComputedStyle(el).width);
});

// Drag handle 100px to the right
await handle.hover();
await page.mouse.down();
await page.mouse.move(100, 0, { steps: 5 });
await page.mouse.up();

// Get new width
await page.waitForTimeout(100);
const newWidth = await panel.locator('.session-panel-layout__left').evaluate(el => {
  return parseFloat(window.getComputedStyle(el).width);
});

// Verify width increased
if (newWidth <= initialWidth) {
  throw new Error('Drag did not increase left panel width');
}
```

#### HC-SPL-003: localStorage Persistence
- **Type:** data-persistence
- **Target:** Split ratio saves to localStorage on drag end
- **Condition:** Ratio persists across remounts
- **Failure Mode:** User preferences not saved
- **Automation Script:**
```javascript
const panel = await page.locator('.session-panel-layout').first();

// Get session ID
const sessionId = await panel.evaluate(() => {
  const leftPanel = document.querySelector('.session-panel-layout__left');
  // Extract from localStorage key or component props
  return 'test-session-id'; // Replace with actual extraction
});

// Drag to new ratio
const handle = panel.locator('.resize-handle');
await handle.hover();
await page.mouse.down();
await page.mouse.move(150, 0, { steps: 5 });
await page.mouse.up();

// Wait for save
await page.waitForTimeout(200);

// Check localStorage
const savedRatio = await page.evaluate((sid) => {
  return localStorage.getItem(`session-panel-split-ratio-${sid}`);
}, sessionId);

if (!savedRatio) {
  throw new Error('Split ratio not saved to localStorage');
}

const ratio = parseFloat(savedRatio);
if (ratio < 15 || ratio > 40) {
  throw new Error('Saved ratio out of valid range');
}
```

#### HC-SPL-004: Min/Max Constraints
- **Type:** validation
- **Target:** Split ratio clamped to 15-40%
- **Condition:** Dragging beyond limits clamps to min/max
- **Failure Mode:** Layout breaks with extreme ratios
- **Automation Script:**
```javascript
const panel = await page.locator('.session-panel-layout').first();
const handle = panel.locator('.resize-handle');

// Try to drag to minimum (far left)
await handle.hover();
await page.mouse.down();
await page.mouse.move(-1000, 0, { steps: 10 });
await page.mouse.up();

await page.waitForTimeout(100);

const minWidth = await panel.locator('.session-panel-layout__left').evaluate(el => {
  const width = parseFloat(window.getComputedStyle(el).width);
  const container = el.parentElement;
  const containerWidth = parseFloat(window.getComputedStyle(container).width);
  return (width / containerWidth) * 100;
});

// Verify clamped to min (15%)
if (minWidth < 14 || minWidth > 16) {
  throw new Error(`Min constraint not working: ${minWidth}%`);
}

// Try to drag to maximum (far right)
await handle.hover();
await page.mouse.down();
await page.mouse.move(2000, 0, { steps: 10 });
await page.mouse.up();

await page.waitForTimeout(100);

const maxWidth = await panel.locator('.session-panel-layout__left').evaluate(el => {
  const width = parseFloat(window.getComputedStyle(el).width);
  const container = el.parentElement;
  const containerWidth = parseFloat(window.getComputedStyle(container).width);
  return (width / containerWidth) * 100;
});

// Verify clamped to max (40%)
if (maxWidth < 39 || maxWidth > 41) {
  throw new Error(`Max constraint not working: ${maxWidth}%`);
}
```

### Warning Checks (Should Pass)

#### HC-SPL-005: Dragging CSS Class
- **Type:** visual-feedback
- **Target:** `.dragging` class applied during drag
- **Condition:** Class added on drag start, removed on drag end
- **Failure Mode:** Missing visual feedback

### Performance Benchmarks

| Metric | Threshold | Unit | Description |
|--------|-----------|------|-------------|
| initial-render | 200 | ms | Time from mount to first paint |
| drag-responsiveness | 16 | ms | Frame time during drag (60fps) |
| localStorage-write | 10 | ms | Time to save split ratio |

---

## Dependencies

**Required Contexts:**
- None

**Required Hooks:**
- None

**Child Components:**
- LeftPanelStack
- RightVisualizationArea
- ResizeHandle

**Required Props:**
- `session`

---

## Notes

- **25/75 split:** Default 25% left, 75% right (customizable via `defaultSplitRatio` prop)
- **Min/max constraints:** Left panel clamped to 15-40% to prevent unusable layouts
- **Per-session persistence:** Each session has its own split ratio saved in localStorage
- **Drag responsiveness:** Uses mousemove event with delta calculation for smooth resizing
- **Container width calculation:** Measures actual container width to convert pixels to percentage
- **Dragging class:** Applies `.dragging` class during drag for CSS cursor/transition control
- **Backward compat:** `onSubmitInput` passed to LeftPanelStack alongside `onSendMessage` for compatibility

---

**Contract Authored:** 2026-02-10
**Last Updated:** 2026-02-10
**Version:** 1.0.0
