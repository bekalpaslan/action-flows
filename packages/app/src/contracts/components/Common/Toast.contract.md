# Component Contract: Toast

**File:** `packages/app/src/components/Toast/Toast.tsx`
**Type:** widget
**Parent Group:** Common
**Contract Version:** 1.0.0
**Last Reviewed:** 2026-02-10

---

## Identity

- **Component Name:** Toast (and ToastContainer)
- **Introduced:** 2025-10-15
- **Description:** Notification toast component with auto-dismiss and manual close button

---

## Render Location

**Mounts Under:**
- ToastContainer (renders multiple toasts)
- ToastContainer mounts under app root (typically)

**Render Conditions:**
1. Toast renders when passed to ToastContainer
2. Auto-dismisses after duration (default 3s)

**Positioning:** fixed (via container)
**Z-Index:** 1000 (toast-container)

---

## Lifecycle

**Mount Triggers:**
- ToastContext.showToast() called
- New toast added to toasts array

**Key Effects:**
1. **Dependencies:** `[toast.id, duration, onDismiss]`
   - **Side Effects:** setTimeout to auto-dismiss after duration
   - **Cleanup:** clearTimeout
   - **Condition:** Always runs on mount

**Cleanup Actions:**
- Clears auto-dismiss timeout

**Unmount Triggers:**
- Auto-dismiss timeout fires
- User clicks close button
- onDismiss(toast.id) called

---

## Props Contract

### Inputs (Toast component)
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| toast | ToastMessage | ✅ | N/A | Toast data (id, message, type) |
| onDismiss | (id: string) => void | ✅ | N/A | Callback to dismiss toast |
| duration | number | ❌ | 3000 | Auto-dismiss duration in ms |

### Inputs (ToastContainer component)
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| toasts | ToastMessage[] | ✅ | N/A | Array of active toasts |
| onDismiss | (id: string) => void | ✅ | N/A | Callback to dismiss toast |

### Callbacks Up (to parent)
| Callback | Signature | Description |
|----------|-----------|-------------|
| onDismiss | `(id: string) => void` | Called when toast auto-dismisses or user clicks close |

### Callbacks Down (to children)
N/A — Toast is leaf component

---

## State Ownership

### Local State
N/A — Stateless (timer managed via useEffect)

### Context Consumption
N/A — Used by ToastContext, but Toast itself does not consume context

### Derived State
| Name | Type | Dependencies | Computation |
|------|------|--------------|-------------|
| icon | string | `[toast.type]` | getIcon() returns emoji based on type |

### Custom Hooks
None

---

## Interactions

### Parent Communication
- **Mechanism:** prop-callback
- **Description:** Calls onDismiss(toast.id) on timeout or close click
- **Example:** `onDismiss(toast.id)` → ToastContext removes toast from array

### Child Communication
N/A — No children

### Sibling Communication
N/A — Each toast is independent

### Context Interaction
N/A — ToastContext renders ToastContainer, but Toast component does not consume context

---

## Side Effects

### API Calls
N/A

### WebSocket Events
N/A

### Timers
| Type | Duration | Purpose | Cleanup |
|------|----------|---------|---------|
| timeout | 3000ms (configurable) | Auto-dismiss toast | ✅ |

### LocalStorage Operations
N/A

### DOM Manipulation
N/A

### Electron IPC (if applicable)
N/A

---

## Test Hooks

**CSS Selectors:**
- `.toast-container`
- `.toast`
- `.toast-info`
- `.toast-success`
- `.toast-warning`
- `.toast-error`
- `.toast-icon`
- `.toast-message`
- `.toast-close`

**Data Test IDs:**
N/A

**ARIA Labels:**
- `role="alert"` on toast
- `aria-live="polite"` on toast
- `aria-label="Dismiss notification"` on close button
- `aria-hidden="true"` on icon

**Visual Landmarks:**
1. Icon (`.toast-icon`) — Emoji indicator of type
2. Message text (`.toast-message`) — Toast content
3. Close button (`.toast-close`) — X button to dismiss

---

## Health Checks

### Critical Checks (Must Pass)

#### HC-T-01: Toast Renders
- **Type:** render
- **Target:** Toast element
- **Condition:** `.toast` exists with message
- **Failure Mode:** Toast not visible
- **Automation Script:**
```javascript
// Chrome MCP script
// Trigger toast (e.g., via context)
const toast = await page.waitForSelector('.toast', { timeout: 1000 });
console.assert(toast !== null, 'Toast not rendered');
const message = await toast.$eval('.toast-message', el => el.textContent);
console.assert(message.length > 0, 'Toast message empty');
```

#### HC-T-02: Auto-Dismiss
- **Type:** lifecycle
- **Target:** setTimeout cleanup
- **Condition:** Toast disappears after duration
- **Failure Mode:** Toast persists indefinitely
- **Automation Script:**
```javascript
// Chrome MCP script
const toast = await page.waitForSelector('.toast');
await page.waitForTimeout(3500); // duration + buffer
const stillExists = await page.$('.toast');
console.assert(stillExists === null, 'Toast did not auto-dismiss');
```

#### HC-T-03: Manual Dismiss
- **Type:** interaction
- **Target:** Close button
- **Condition:** Clicking close button calls onDismiss
- **Failure Mode:** Close button does not work
- **Automation Script:**
```javascript
// Chrome MCP script
const toast = await page.waitForSelector('.toast');
await page.click('.toast-close');
await page.waitForTimeout(100);
const stillExists = await page.$('.toast');
console.assert(stillExists === null, 'Toast did not dismiss on close click');
```

### Warning Checks (Should Pass)

#### HC-T-04: Icon Matches Type
- **Type:** visual-consistency
- **Target:** Icon character
- **Condition:** ✓ for success, ⚠ for warning, ✕ for error, ℹ for info
- **Failure Mode:** Wrong icon displayed

### Performance Benchmarks

| Metric | Threshold | Unit | Description |
|--------|-----------|------|-------------|
| render-time | 50 | ms | Time to paint toast |
| dismiss-accuracy | ±100 | ms | Accuracy of auto-dismiss timing |

---

## Dependencies

**Required Contexts:**
None (Toast component is context-agnostic)

**Required Hooks:**
None

**Child Components:**
None

**Required Props:**
- `toast`
- `onDismiss`

---

## Notes

- ToastContainer returns null when toasts array empty
- Toasts stack vertically (CSS handles positioning)
- Toast types: info (blue), success (green), warning (yellow), error (red)
- Icons are emoji: ℹ, ✓, ⚠, ✕
- Close button stops event propagation (no background click)
- Auto-dismiss cleanup ensures no memory leaks
- Duration configurable per toast (default 3000ms)
- ARIA role="alert" for screen reader announcements
- Toast message can be plain text or formatted string

---

**Contract Authored:** 2026-02-10
**Last Updated:** 2026-02-10
**Version:** 1.0.0
