# Component Contract: RespectWorkbench

**File:** `packages/app/src/components/Workbench/RespectWorkbench/RespectWorkbench.tsx`
**Type:** page
**Parent Group:** Workbench
**Contract Version:** 1.0.0
**Last Reviewed:** 2026-02-10

---

## Identity

- **Component Name:** RespectWorkbench
- **Introduced:** 2026-02-05
- **Description:** Live spatial health monitoring panel for UI components. Real-time boundary checks with categorized results, violation details, and auto-run on mount.

---

## Render Location

**Mounts Under:**
- WorkbenchLayout (when `activeWorkbench === 'respect'`)

**Render Conditions:**
1. User selects "Respect" tab in TopBar

**Positioning:** relative
**Z-Index:** N/A

---

## Lifecycle

**Mount Triggers:**
- User navigates to Respect workbench

**Key Effects:**
1. **Dependencies:** `[runCheck]`
   - **Side Effects:** Auto-runs spatial checks on component mount
   - **Cleanup:** None
   - **Condition:** Runs once on mount

**Cleanup Actions:**
None

**Unmount Triggers:**
- User switches workbenches

---

## Props Contract

### Inputs
None - All state managed internally via hooks

### Callbacks Up (to parent)
None

### Callbacks Down (to children)
| Callback | Signature | Passed To | Description |
|----------|-----------|-----------|-------------|
| onRunCheck | `() => void` | RespectCheckControls | Triggers spatial check |

---

## State Ownership

### Local State
None - All state managed via useRespectCheck hook

### Context Consumption
| Context | Values Used |
|---------|-------------|
| DiscussContext | `prefillChatInput()` |

### Derived State
N/A

### Custom Hooks
- `useRespectCheck()` — Manages respect check execution, results, and error state
- `useDiscussButton()` — Manages DiscussButton dialog

---

## Interactions

### Parent Communication
N/A

### Child Communication
- **Child:** RespectCheckControls
- **Mechanism:** props
- **Data Flow:** Passes runCheck callback, isRunning state, result data
- **Child:** LiveSpatialMonitor
- **Mechanism:** props
- **Data Flow:** Passes result data and error state

### Sibling Communication
N/A

### Context Interaction
- **Context:** DiscussContext
- **Role:** consumer
- **Operations:** Opens discuss dialog with spatial check context

---

## Side Effects

### API Calls
N/A - Spatial checks run in-browser via DOM queries

### WebSocket Events
N/A

### Timers
N/A

### LocalStorage Operations
N/A

### DOM Manipulation
| Target | Operation | Trigger |
|--------|-----------|---------|
| All UI components | Boundary checks (getBoundingClientRect) | runCheck() |

### Electron IPC (if applicable)
N/A

---

## Test Hooks

**CSS Selectors:**
- `.respect-workbench`
- `.respect-workbench__header`
- `.respect-workbench__title`
- `.respect-workbench__status-bar`
- `.respect-check-controls`
- `.live-spatial-monitor`

**Data Test IDs:**
N/A

**ARIA Labels:**
N/A

**Visual Landmarks:**
1. Header (`.respect-workbench__header`) — Title and DiscussButton
2. Check controls (`.respect-check-controls`) — Run button and result summary
3. Spatial monitor (`.live-spatial-monitor`) — Component health cards by category
4. Status bar (`.respect-workbench__status-bar`) — Last check timestamp

---

## Health Checks

### Critical Checks (Must Pass)

#### HC-RPW-001: Component Renders
- **Type:** render
- **Target:** `.respect-workbench` element
- **Condition:** Element exists in DOM
- **Failure Mode:** Workbench doesn't appear
- **Automation Script:**
```javascript
const workbench = document.querySelector('.respect-workbench');
return workbench !== null;
```

#### HC-RPW-002: Auto-Run Executes
- **Type:** lifecycle
- **Target:** useRespectCheck hook
- **Condition:** Spatial check runs automatically on mount
- **Failure Mode:** No initial results
- **Automation Script:**
```javascript
// Wait for auto-run to complete
await new Promise(resolve => setTimeout(resolve, 2000));
const monitor = document.querySelector('.live-spatial-monitor');
const hasResults = monitor && monitor.children.length > 0;
return hasResults;
```

#### HC-RPW-003: Check Controls Render
- **Type:** render
- **Target:** `.respect-check-controls`
- **Condition:** Controls appear with Run button
- **Failure Mode:** Can't trigger checks
- **Automation Script:**
```javascript
const controls = document.querySelector('.respect-check-controls');
const runBtn = controls?.querySelector('button');
return controls && runBtn !== null;
```

#### HC-RPW-004: Spatial Monitor Displays Results
- **Type:** render
- **Target:** `.live-spatial-monitor`
- **Condition:** Monitor shows check results by category
- **Failure Mode:** No results visible
- **Automation Script:**
```javascript
const monitor = document.querySelector('.live-spatial-monitor');
return monitor !== null;
```

#### HC-RPW-005: Manual Run Works
- **Type:** user-action
- **Target:** Run Check button
- **Condition:** Button triggers spatial check
- **Failure Mode:** Can't refresh checks
- **Automation Script:**
```javascript
const runBtn = document.querySelector('.respect-check-controls button');
runBtn.click();
await new Promise(resolve => setTimeout(resolve, 2000));
const statusBar = document.querySelector('.respect-workbench__status-bar');
return statusBar && statusBar.textContent.includes('Last check:');
```

### Warning Checks (Should Pass)

#### HC-RPW-006: Error Display Works
- **Type:** error-handling
- **Target:** Error message in monitor
- **Condition:** Errors shown when checks fail
- **Failure Mode:** Silent failures

---

## Dependencies

**Required Contexts:**
- DiscussContext

**Required Hooks:**
- useRespectCheck (from `./useRespectCheck`)
- useDiscussButton

**Child Components:**
- RespectCheckControls (from `./RespectCheckControls`)
- LiveSpatialMonitor (from `./LiveSpatialMonitor`)
- DiscussButton
- DiscussDialog

**Required Props:**
None

---

## Notes

- Auto-runs on mount for instant feedback
- Spatial checks validate: positioning, z-index, overflow, visibility, boundaries
- Results categorized by component type (layout, panel, widget, etc.)
- Check results include: component name, health score, violations, recommendations
- useRespectCheck hook provides: result, isRunning, error, runCheck(), lastCheckedAt
- Timestamp shows when last check completed

---

**Contract Authored:** 2026-02-10
**Last Updated:** 2026-02-10
**Version:** 1.0.0
