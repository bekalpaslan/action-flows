# Component Contract: ResizeHandle

**File:** `packages/app/src/components/SessionPanel/ResizeHandle.tsx`
**Type:** utility
**Parent Group:** SessionPanel/
**Contract Version:** 1.0.0
**Last Reviewed:** 2026-02-10

---

## Identity

- **Component Name:** ResizeHandle
- **Introduced:** 2026-01-15
- **Description:** Draggable vertical divider for resizing left/right split ratio with visual feedback on hover/drag and double-click reset placeholder.

---

## Render Location

**Mounts Under:**
- SessionPanelLayout (between left and right panels)

**Render Conditions:**
1. Always renders when SessionPanelLayout mounts
2. Positioned between left and right panels

**Positioning:** relative (positioned by parent flex layout)
**Z-Index:** N/A (but should layer above panels for cursor)

---

## Lifecycle

**Mount Triggers:**
- SessionPanelLayout mounts

**Key Effects:**
1. **Dependencies:** `[handleMouseMove, handleMouseUp]`
   - **Side Effects:** Adds global mousemove and mouseup event listeners
   - **Cleanup:** Removes event listeners
   - **Condition:** Runs on mount and when handlers change

**Cleanup Actions:**
- Removes document-level mousemove and mouseup event listeners

**Unmount Triggers:**
- SessionPanelLayout unmounts

---

## Props Contract

### Inputs
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| onDrag | `(deltaX: number) => void` | ✅ | N/A | Callback with delta X in pixels |
| onDragStart | `() => void` | ❌ | N/A | Callback when drag starts |
| onDragEnd | `() => void` | ❌ | N/A | Callback when drag ends |

### Callbacks Up (to parent)
| Callback | Signature | Description |
|----------|-----------|-------------|
| onDrag | `(deltaX: number) => void` | Mouse moves during drag → emits delta |
| onDragStart | `() => void` | Mouse down → drag starts |
| onDragEnd | `() => void` | Mouse up → drag ends, parent saves to localStorage |

### Callbacks Down (to children)
| Callback | Signature | Passed To | Description |
|----------|-----------|-----------|-------------|
| N/A | N/A | N/A | Leaf component, no children |

---

## State Ownership

### Local State
| State | Type | Initial | Updated By |
|-------|------|---------|------------|
| N/A (refs only) | N/A | N/A | Uses refs for drag state |

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
- **Description:** Emits drag events to parent for split ratio calculation
- **Example:**
  ```tsx
  handleMouseMove(e) → deltaX = e.clientX - lastX → onDrag(deltaX)
  ```

### Child Communication
- **Child:** None
- **Mechanism:** N/A
- **Data Flow:** N/A

### Sibling Communication
- **Sibling:** None
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
| N/A | N/A | N/A | N/A |

### WebSocket Events
| Event Type | Trigger | Handler |
|------------|---------|---------|
| N/A | N/A | N/A |

### Timers
| Type | Duration | Purpose | Cleanup |
|------|----------|---------|---------|
| N/A | N/A | N/A | N/A |

### LocalStorage Operations
| Key | Operation | Trigger | Value |
|-----|-----------|---------|-------|
| N/A | N/A | N/A | N/A (handled by parent) |

### DOM Manipulation
| Target | Operation | Trigger |
|--------|-----------|---------|
| `.resize-handle` | Add/remove `.dragging` class | Drag start/end |

### Electron IPC (if applicable)
| Channel | Direction | Purpose |
|---------|-----------|---------|
| N/A | N/A | N/A |

---

## Test Hooks

**CSS Selectors:**
- `.resize-handle`
- `.resize-handle.dragging`

**Data Test IDs:**
- N/A (use CSS selectors)

**ARIA Labels:**
- `role="separator"`
- `aria-label="Resize panel divider"`
- `aria-orientation="vertical"`

**Visual Landmarks:**
1. Vertical divider (`.resize-handle`) — 4px wide, col-resize cursor
2. Dragging state (`.resize-handle.dragging`) — Active drag visual feedback

---

## Health Checks

### Critical Checks (Must Pass)

#### HC-RH-001: Mouse Down Triggers Drag Start
- **Type:** interaction
- **Target:** mousedown event handler
- **Condition:** onDragStart called, dragging class added
- **Failure Mode:** Cannot start drag
- **Automation Script:**
```javascript
const handle = await page.locator('.resize-handle').first();

// Mouse down on handle
await handle.hover();
await page.mouse.down();

// Verify dragging class added
await page.waitForSelector('.resize-handle.dragging', { timeout: 100 });

// Clean up
await page.mouse.up();
```

#### HC-RH-002: Mouse Move Emits Delta
- **Type:** interaction
- **Target:** mousemove event during drag
- **Condition:** onDrag called with correct delta
- **Failure Mode:** Drag does not resize panels
- **Automation Script:**
```javascript
const handle = await page.locator('.resize-handle').first();
const leftPanel = await page.locator('.session-panel-layout__left');

// Get initial width
const initialWidth = await leftPanel.evaluate(el => {
  return parseFloat(window.getComputedStyle(el).width);
});

// Start drag
await handle.hover();
await page.mouse.down();

// Move 100px right
await page.mouse.move(100, 0, { steps: 5 });

// Verify width changed
const newWidth = await leftPanel.evaluate(el => {
  return parseFloat(window.getComputedStyle(el).width);
});

if (newWidth <= initialWidth) {
  throw new Error('Drag did not update panel width');
}

// Clean up
await page.mouse.up();
```

#### HC-RH-003: Mouse Up Triggers Drag End
- **Type:** interaction
- **Target:** mouseup event handler
- **Condition:** onDragEnd called, dragging class removed
- **Failure Mode:** Drag state persists, no localStorage save
- **Automation Script:**
```javascript
const handle = await page.locator('.resize-handle').first();

// Start drag
await handle.hover();
await page.mouse.down();
await page.mouse.move(50, 0);

// Verify dragging
await page.waitForSelector('.resize-handle.dragging', { timeout: 100 });

// Release
await page.mouse.up();

// Verify dragging class removed
await page.waitForSelector('.resize-handle.dragging', { state: 'hidden', timeout: 500 });
```

#### HC-RH-004: Global Event Listeners
- **Type:** event-handling
- **Target:** document-level mousemove and mouseup
- **Condition:** Events captured even when cursor leaves handle
- **Failure Mode:** Drag stops when cursor moves fast
- **Automation Script:**
```javascript
const handle = await page.locator('.resize-handle').first();

// Start drag
await handle.hover();
await page.mouse.down();

// Move cursor away from handle (but keep dragging)
await page.mouse.move(300, 0, { steps: 10 });

// Verify panel still updating
const leftPanel = await page.locator('.session-panel-layout__left');
const width = await leftPanel.evaluate(el => {
  return parseFloat(window.getComputedStyle(el).width);
});

// Should have increased width
if (width < 200) {
  throw new Error('Drag stopped when cursor moved away from handle');
}

await page.mouse.up();
```

#### HC-RH-005: Double-Click Handler (Placeholder)
- **Type:** interaction
- **Target:** onDoubleClick event
- **Condition:** Logs message (future: reset to default)
- **Failure Mode:** No-op for now
- **Automation Script:**
```javascript
const handle = await page.locator('.resize-handle').first();

// Set up console listener
const consoleMessages = [];
page.on('console', msg => consoleMessages.push(msg.text()));

// Double-click handle
await handle.dblclick();

// Verify log message
await page.waitForTimeout(100);
const hasResetLog = consoleMessages.some(msg =>
  msg.includes('Double-click detected') || msg.includes('reset')
);

if (!hasResetLog) {
  throw new Error('Double-click handler not triggered');
}
```

### Warning Checks (Should Pass)

#### HC-RH-006: Cursor Style
- **Type:** visual-feedback
- **Target:** col-resize cursor on hover
- **Condition:** Cursor changes to col-resize
- **Failure Mode:** Poor UX, unclear interaction

### Performance Benchmarks

| Metric | Threshold | Unit | Description |
|--------|-----------|------|-------------|
| drag-responsiveness | 16 | ms | Frame time during drag (60fps) |
| event-handler-time | 1 | ms | Time to process mouse event |
| class-toggle | 5 | ms | Time to add/remove dragging class |

---

## Dependencies

**Required Contexts:**
- None

**Required Hooks:**
- None

**Child Components:**
- None

**Required Props:**
- `onDrag`

---

## Notes

- **4px width:** Styled as 4px wide vertical divider
- **col-resize cursor:** CSS cursor indicates draggable handle
- **Global listeners:** Uses document-level events to track mouse outside handle
- **Ref-based state:** Uses refs instead of state to avoid re-renders during drag (isDraggingRef, lastXRef)
- **Delta calculation:** Emits delta X (current - last) rather than absolute position
- **Dragging class:** Applied to handle for CSS styling during drag
- **Event cleanup:** Removes global listeners on unmount to prevent memory leaks
- **Prevent default:** mousedown calls preventDefault to avoid text selection

### Future Enhancements
- Double-click to reset split ratio to 50/50

---

**Contract Authored:** 2026-02-10
**Last Updated:** 2026-02-10
**Version:** 1.0.0
