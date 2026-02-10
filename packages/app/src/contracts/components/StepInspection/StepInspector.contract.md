# Component Contract: StepInspector

**File:** `packages/app/src/components/StepInspector/StepInspector.tsx`
**Type:** feature
**Parent Group:** StepInspection
**Contract Version:** 1.0.0
**Last Reviewed:** 2026-02-10

---

## Identity

- **Component Name:** StepInspector
- **Introduced:** 2025-11-20 (estimated)
- **Description:** Side panel for detailed step examination showing step details, inputs, outputs, errors, learning information, and control actions (retry, skip). Includes DiscussButton integration and ESC key to close.

---

## Render Location

**Mounts Under:**
- TimelineView (right sidebar)
- FlowVisualization (overlay or sidebar)

**Render Conditions:**
1. Always mounts (renders empty state when `step` prop is null)
2. Shows details when `step` prop is non-null

**Positioning:** fixed (sidebar)
**Z-Index:** 100 (overlay mode)

---

## Lifecycle

**Mount Triggers:**
- Parent visualization component mounts

**Key Effects:**
1. **Dependencies:** `[step, onClose]`
   - **Side Effects:** Registers ESC keydown listener
   - **Cleanup:** Removes keydown listener
   - **Condition:** Runs when step is non-null

**Cleanup Actions:**
- Removes ESC keydown listener

**Unmount Triggers:**
- Parent visualization unmounts

---

## Props Contract

### Inputs
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| step | ChainStep \| null | ✅ | N/A | Step data to inspect (null shows empty state) |
| sessionId | SessionId | ❌ | undefined | Session ID for retry/skip control actions |
| onClose | () => void | ❌ | undefined | Callback when close button clicked or ESC pressed |

### Callbacks Up (to parent)
| Callback | Signature | Description |
|----------|-----------|-------------|
| onClose | `() => void` | Fires when user closes inspector |

### Callbacks Down (to children)
None (leaf feature component)

---

## State Ownership

### Local State
| State | Type | Initial | Updated By |
|-------|------|---------|------------|
| isRetrying | boolean | false | `handleRetry` (async state) |
| isSkipping | boolean | false | `handleSkip` (async state) |

### Context Consumption
| Context | Values Used |
|---------|-------------|
| DiscussContext | `registerChatInput`, `prefillChatInput` |

### Derived State
| Name | Type | Dependencies | Computation |
|------|------|--------------|-------------|
| statusColor | string | `[step.status]` | `getStatusColor(step.status)` |

### Custom Hooks
- `useSessionControls()` — Provides `retry()`, `skip()` control functions
- `useDiscussButton({ componentName, getContext })` — DiscussDialog state

---

## Interactions

### Parent Communication
- **Mechanism:** prop-callback
- **Description:** Notifies parent when close button clicked or ESC pressed
- **Example:** `onClose?.()`

### Child Communication
None (leaf component)

### Sibling Communication
None

### Context Interaction
- **Context:** DiscussContext
- **Role:** consumer
- **Operations:** Opens DiscussDialog to send step context to ChatPanel

---

## Side Effects

### API Calls
| Endpoint | Method | Trigger | Response Handling |
|----------|--------|---------|-------------------|
| `/api/sessions/:sessionId/commands` | POST | Retry button click | Sends `{ command: 'retry', stepNumber }` |
| `/api/sessions/:sessionId/commands` | POST | Skip button click | Sends `{ command: 'skip', stepNumber }` |

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
- `.step-inspector`
- `.step-inspector-empty` (empty state when no step selected)
- `.inspector-placeholder` (empty state content)
- `.inspector-header`
- `.inspector-header-content`
- `.inspector-title`
- `.inspector-step-number`
- `.inspector-header-actions`
- `.inspector-close-btn`
- `.inspector-status-bar`
- `.inspector-status-badge`, `.status-{status}`
- `.inspector-model-badge`, `.model-{model}`
- `.inspector-step-controls` (retry/skip buttons)
- `.inspector-control-btn`, `.retry-btn`, `.skip-btn`
- `.inspector-content` (scrollable content area)
- `.inspector-section` (Details, Inputs, Output, Learning sections)
- `.inspector-details-grid`
- `.detail-item`, `.detail-item.full-width`
- `.inspector-key-value-list` (inputs)
- `.kv-item`, `.kv-key`, `.kv-value`
- `.output-block`, `.output-success`, `.output-error`
- `.learning-block`

**Data Test IDs:**
None

**ARIA Labels:**
- `role="button"` on close button
- `aria-label="Close inspector"`
- `title="Close (ESC)"`
- Button titles for retry/skip actions

**Visual Landmarks:**
1. Header with step number and action (`.inspector-header`) — Shows step identity
2. Status bar with badges (`.inspector-status-bar`) — Status and model indicators
3. Control buttons (`.inspector-step-controls`) — Retry/skip actions (if `sessionId` provided)
4. Scrollable content (`.inspector-content`) — Details, inputs, outputs, learning
5. Close button (`.inspector-close-btn`) — Top-right corner

---

## Health Checks

### Critical Checks (Must Pass)

#### HC-SI-001: Inspector Renders with Step Data
- **Type:** render
- **Target:** `.step-inspector`
- **Condition:** When `step` is non-null, inspector shows step details
- **Failure Mode:** Empty state shown despite step data
- **Automation Script:**
```javascript
// Chrome MCP script
const inspector = document.querySelector('.step-inspector');
if (!inspector) throw new Error('StepInspector not rendering');
const stepNumber = inspector.querySelector('.inspector-step-number');
if (step && !stepNumber) throw new Error('Step number missing despite step prop');
```

#### HC-SI-002: Empty State When No Step
- **Type:** render
- **Target:** `.step-inspector-empty`
- **Condition:** When `step` is null, shows "Select a step to view details"
- **Failure Mode:** Confusing blank panel
- **Automation Script:**
```javascript
// Chrome MCP script
// Simulate null step prop
const emptyInspector = document.querySelector('.step-inspector-empty');
if (!emptyInspector) console.warn('Empty state not rendering when step is null');
```

#### HC-SI-003: ESC Key Closes Inspector
- **Type:** interaction
- **Target:** Keydown listener
- **Condition:** Pressing ESC calls `onClose` callback
- **Failure Mode:** Cannot close inspector with keyboard
- **Automation Script:**
```javascript
// Chrome MCP script
let closeCalled = false;
const originalOnClose = window.__inspectorOnClose;
window.__inspectorOnClose = () => { closeCalled = true; };
document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
setTimeout(() => {
  if (!closeCalled) throw new Error('ESC key not calling onClose');
  window.__inspectorOnClose = originalOnClose;
}, 100);
```

### Warning Checks (Should Pass)

#### HC-SI-004: Retry Button Visible for Failed Steps
- **Type:** render
- **Target:** `.retry-btn`
- **Condition:** Retry button shows when `step.status === 'failed'` and `sessionId` provided
- **Failure Mode:** User cannot retry failed steps

#### HC-SI-005: Skip Button Visible for Failed/Pending Steps
- **Type:** render
- **Target:** `.skip-btn`
- **Condition:** Skip button shows when `step.status` is 'failed' or 'pending' and `sessionId` provided
- **Failure Mode:** User cannot skip problematic steps

### Performance Benchmarks

| Metric | Threshold | Unit | Description |
|--------|-----------|------|-------------|
| render-time | 50 | ms | Time to render inspector with step data |
| esc-response | 16 | ms | Time from ESC key to onClose callback |

---

## Dependencies

**Required Contexts:**
- DiscussContext

**Required Hooks:**
- `useSessionControls()` (for retry/skip actions)
- `useDiscussButton({ componentName, getContext })`

**Child Components:**
- DiscussButton
- DiscussDialog

**Required Props:**
- `step` (ChainStep | null)

---

## Notes

**Status Color Mapping:**
- `pending`: #bdbdbd
- `in_progress`: #fbc02d
- `completed`: #4caf50
- `failed`: #f44336
- `skipped`: #9e9e9e

**Duration Formatting:**
- < 1s: "Xms"
- < 1min: "X.Xs"
- ≥ 1min: "Xm Ys"

**Control Actions:**
- **Retry**: Available for failed steps only, calls `/api/sessions/:sessionId/commands` with `{ command: 'retry', stepNumber }`
- **Skip**: Available for failed or pending steps, shows confirmation dialog, calls `/api/sessions/:sessionId/commands` with `{ command: 'skip', stepNumber }`

**Keyboard Shortcuts:**
- ESC: Close inspector (calls `onClose` callback)

**Sections:**
- **Details**: Status, model, duration, timestamps, description, dependencies
- **Inputs**: Key-value pairs of step inputs (JSON formatted)
- **Output**: Result (success) or error message
- **Learning**: Step-specific learning notes (if available)

---

**Contract Authored:** 2026-02-10
**Last Updated:** 2026-02-10
**Version:** 1.0.0
