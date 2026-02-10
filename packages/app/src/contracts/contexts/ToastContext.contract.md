# Component Contract: ToastContext

**File:** `packages/app/src/contexts/ToastContext.tsx`
**Type:** utility
**Parent Group:** contexts
**Contract Version:** 1.0.0
**Last Reviewed:** 2026-02-10

---

## Identity

- **Component Name:** ToastContext
- **Introduced:** 2026-01-22
- **Description:** Provides global toast notification system for displaying temporary messages (info, success, warning, error) with auto-dismiss functionality. Renders ToastContainer component with active toasts.

---

## Render Location

**Mounts Under:**
- App.tsx (root level provider)

**Render Conditions:**
1. Always renders (root provider)

**Positioning:** N/A (context provider, but renders ToastContainer child)
**Z-Index:** N/A (ToastContainer has high z-index for visibility)

---

## Lifecycle

**Mount Triggers:**
- Application initialization

**Key Effects:**
N/A (no effects in provider, just state management)

**Cleanup Actions:**
- Auto-dismiss timers are cleared when toasts are removed

**Unmount Triggers:**
- Application shutdown (never unmounts in normal operation)

---

## Props Contract

### Inputs
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| children | ReactNode | ✅ | N/A | Child components to receive context |

### Callbacks Up (to parent)
N/A (root provider)

### Callbacks Down (to children)
| Callback | Signature | Passed To | Description |
|----------|-----------|-----------|-------------|
| showToast | `(message: string, type: 'info' \| 'success' \| 'warning' \| 'error', duration?: number) => void` | All consumers | Displays a toast notification with auto-dismiss |

---

## State Ownership

### Local State
| State | Type | Initial | Updated By |
|-------|------|---------|------------|
| toasts | `ToastMessage[]` | `[]` | showToast, handleDismiss, auto-dismiss timeout |

### Context Consumption
N/A (this is a provider)

### Derived State
N/A

### Custom Hooks
N/A

---

## Interactions

### Parent Communication
- **Mechanism:** Props
- **Description:** Receives children from App.tsx, wraps entire component tree
- **Example:** `<ToastProvider><App /></ToastProvider>`

### Child Communication
- **Child:** ToastContainer (rendered by provider)
- **Mechanism:** Props
- **Data Flow:** Passes toasts array and onDismiss callback to ToastContainer

### Sibling Communication
N/A (provider has no siblings at app root)

### Context Interaction
- **Context:** ToastContext
- **Role:** provider
- **Operations:** Provides showToast function for displaying notifications

---

## Side Effects

### API Calls
N/A

### WebSocket Events
N/A (toasts can be triggered by WebSocket events, but provider doesn't listen directly)

### Timers
| Type | Duration | Purpose | Cleanup |
|------|----------|---------|---------|
| timeout | 3000ms (default) | Auto-dismiss toast after duration | ✅ Cleared when toast is manually dismissed |

### LocalStorage Operations
N/A

### DOM Manipulation
N/A (rendering handled by React)

### Electron IPC (if applicable)
N/A

---

## Test Hooks

**CSS Selectors:**
- `.toast-container` (rendered by ToastContainer)
- `.toast` (individual toast elements)
- `.toast--info`, `.toast--success`, `.toast--warning`, `.toast--error` (toast type variants)

**Data Test IDs:**
- `data-testid="toast-container"`
- `data-testid="toast-{id}"` (individual toast with unique ID)

**ARIA Labels:**
- `role="status"` on toast container
- `aria-live="polite"` for info/success toasts
- `aria-live="assertive"` for warning/error toasts

**Visual Landmarks:**
- ToastContainer renders at bottom-right corner (position: fixed)
- Each toast has distinct background color based on type

---

## Health Checks

### Critical Checks (Must Pass)

#### HC-TO-001: Toast Displays on showToast Call
- **Type:** render
- **Target:** showToast function
- **Condition:** Calling showToast adds a toast to the UI within 100ms
- **Failure Mode:** Notifications do not appear, user feedback missing
- **Automation Script:**
```javascript
// Chrome MCP script
// Trigger a toast (e.g., via SessionSidebar delete action)
await click({ uid: 'session-delete-button-1' }); // Assumes delete triggers toast
await new Promise(resolve => setTimeout(resolve, 200));
// Check if toast container exists and has toasts
const snapshot = await takeSnapshot();
const toastExists = snapshot.includes('toast-container') && snapshot.includes('toast--');
if (!toastExists) {
  throw new Error('Toast did not appear after triggering action');
}
```

#### HC-TO-002: Toast Auto-Dismisses After Duration
- **Type:** lifecycle
- **Target:** Auto-dismiss timer
- **Condition:** Toast disappears after default 3000ms (or custom duration)
- **Failure Mode:** Toasts persist indefinitely, clutter UI
- **Automation Script:**
```javascript
// Chrome MCP script
// Show a toast with default duration
await evaluateScript(() => {
  const context = window.__toastContext; // Assumes context is exposed for testing
  context.showToast('Test message', 'info'); // Default 3000ms
});
await new Promise(resolve => setTimeout(resolve, 500));
// Check toast is visible
let snapshot = await takeSnapshot();
if (!snapshot.includes('Test message')) {
  throw new Error('Toast did not appear');
}
// Wait for auto-dismiss
await new Promise(resolve => setTimeout(resolve, 3000));
// Check toast is gone
snapshot = await takeSnapshot();
if (snapshot.includes('Test message')) {
  throw new Error('Toast did not auto-dismiss after 3000ms');
}
```

#### HC-TO-003: Multiple Toasts Stack Correctly
- **Type:** ui-layout
- **Target:** Toast container layout
- **Condition:** Multiple toasts display in a vertical stack, newest at bottom
- **Failure Mode:** Toasts overlap or do not display multiple notifications
- **Automation Script:**
```javascript
// Chrome MCP script
// Show multiple toasts
await evaluateScript(() => {
  const context = window.__toastContext;
  context.showToast('First toast', 'info');
  context.showToast('Second toast', 'success');
  context.showToast('Third toast', 'warning');
});
await new Promise(resolve => setTimeout(resolve, 300));
// Check all toasts are visible
const snapshot = await takeSnapshot();
const hasAll = snapshot.includes('First toast') && snapshot.includes('Second toast') && snapshot.includes('Third toast');
if (!hasAll) {
  throw new Error('Not all toasts are visible');
}
// Check stacking order (implementation-specific)
```

### Warning Checks (Should Pass)

#### HC-TO-W001: Custom Duration Works
- **Type:** configuration
- **Target:** duration parameter
- **Condition:** Passing custom duration to showToast overrides default 3000ms
- **Failure Mode:** Custom duration ignored, all toasts dismiss at 3000ms

#### HC-TO-W002: Manual Dismiss Works
- **Type:** ui-interaction
- **Target:** handleDismiss callback
- **Condition:** Clicking dismiss button (if present) removes toast immediately
- **Failure Mode:** Cannot manually dismiss toasts

### Performance Benchmarks

| Metric | Threshold | Unit | Description |
|--------|-----------|------|-------------|
| toast-render-time | 100 | ms | Time from showToast call to toast visible in DOM |
| toast-dismiss-time | 50 | ms | Time from dismiss trigger to toast removed from DOM |
| max-active-toasts | 5 | count | Maximum number of toasts before overflow/scroll (UI design decision) |

---

## Dependencies

**Required Contexts:**
N/A (this is a root provider)

**Required Hooks:**
N/A

**Child Components:**
- ToastContainer (from `../components/Toast/Toast`)

**Required Props:**
- `children` (ReactNode)

---

## Notes

- Toast types: 'info' | 'success' | 'warning' | 'error'
- Default duration: 3000ms (3 seconds)
- Each toast has a unique ID: `toast-${Date.now()}-${Math.random()}`
- ToastContainer is rendered as a sibling to children, not a wrapper
- toasts array is managed in provider state, passed as prop to ToastContainer
- Auto-dismiss uses setTimeout, cleared if toast is manually dismissed early
- useToast() hook throws if used outside provider (defensive programming)
- ToastContainer typically renders at bottom-right corner with fixed positioning

---

**Contract Authored:** 2026-02-10
**Last Updated:** 2026-02-10
**Version:** 1.0.0
