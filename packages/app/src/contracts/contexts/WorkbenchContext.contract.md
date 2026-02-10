# Component Contract: WorkbenchContext

**File:** `packages/app/src/contexts/WorkbenchContext.tsx`
**Type:** utility
**Parent Group:** contexts
**Contract Version:** 1.0.0
**Last Reviewed:** 2026-02-10

---

## Identity

- **Component Name:** WorkbenchContext
- **Introduced:** 2026-01-20
- **Description:** Manages workbench navigation state, including active workbench selection (12 tabs: work, maintenance, explore, review, archive, settings, pm, harmony, canvas, editor, intel, respect), notification counts per workbench, back navigation history, and session filtering by routing context.

---

## Render Location

**Mounts Under:**
- App.tsx (root level provider)

**Render Conditions:**
1. Always renders (root provider)

**Positioning:** N/A (context provider)
**Z-Index:** N/A

---

## Lifecycle

**Mount Triggers:**
- Application initialization

**Key Effects:**
1. **Dependencies:** `[]` (mount only)
   - **Side Effects:** Loads active workbench from localStorage (`afw-active-workbench`), initializes workbench configs from DEFAULT_WORKBENCH_CONFIGS
   - **Cleanup:** None
   - **Condition:** On mount

2. **Dependencies:** `[activeWorkbench]`
   - **Side Effects:** Persists active workbench to localStorage
   - **Cleanup:** None
   - **Condition:** Whenever activeWorkbench changes

**Cleanup Actions:**
N/A (no cleanup required)

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
| setActiveWorkbench | `(id: WorkbenchId) => void` | All consumers | Changes active workbench, tracks previous for back navigation |
| addNotification | `(workbenchId: WorkbenchId) => void` | All consumers | Increments notification count for a workbench |
| clearNotifications | `(workbenchId: WorkbenchId) => void` | All consumers | Clears notification count for a workbench |
| goBack | `() => void` | All consumers | Navigates back to previous workbench |
| setRoutingFilter | `(filter: WorkbenchId \| null) => void` | All consumers | Sets session filtering by routing context |
| filterSessionsByContext | `(sessions: Session[]) => Session[]` | All consumers | Filters sessions by routing context |

---

## State Ownership

### Local State
| State | Type | Initial | Updated By |
|-------|------|---------|------------|
| activeWorkbench | WorkbenchId | `localStorage.getItem('afw-active-workbench') \|\| 'work'` | setActiveWorkbench, goBack |
| previousWorkbench | `WorkbenchId \| null` | `null` | setActiveWorkbench (automatically tracked) |
| workbenchConfigs | `Map<WorkbenchId, WorkbenchConfig>` | `DEFAULT_WORKBENCH_CONFIGS` | N/A (read-only, initialized once) |
| workbenchNotifications | `Map<WorkbenchId, number>` | `new Map()` | addNotification, clearNotifications |
| routingFilter | `WorkbenchId \| null` | `null` | setRoutingFilter |

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
- **Example:** `<WorkbenchProvider><App /></WorkbenchProvider>`

### Child Communication
- **Child:** TopBar, WorkbenchLayout, SessionSidebar
- **Mechanism:** Context value via useWorkbenchContext() or useActiveWorkbench()
- **Data Flow:** activeWorkbench, setActiveWorkbench, workbenchConfigs, workbenchNotifications, routingFilter, etc.

### Sibling Communication
N/A (provider has no siblings at app root)

### Context Interaction
- **Context:** WorkbenchContext
- **Role:** provider
- **Operations:** Provides workbench navigation state, notification counts, routing filter, back navigation

---

## Side Effects

### API Calls
N/A

### WebSocket Events
N/A (consumer of WebSocket events via child components, not directly)

### Timers
N/A

### LocalStorage Operations
| Key | Operation | Trigger | Value |
|-----|-----------|---------|-------|
| `afw-active-workbench` | read | Mount | WorkbenchId (e.g., 'work', 'maintenance', 'explore', ...) |
| `afw-active-workbench` | write | activeWorkbench changes | Current WorkbenchId |

### DOM Manipulation
N/A

### Electron IPC (if applicable)
N/A

---

## Test Hooks

**CSS Selectors:**
N/A (context provider, no visual elements)

**Data Test IDs:**
N/A

**ARIA Labels:**
N/A

**Visual Landmarks:**
N/A

---

## Health Checks

### Critical Checks (Must Pass)

#### HC-WB-001: Active Workbench Loads from localStorage
- **Type:** persistence
- **Target:** localStorage read on mount
- **Condition:** activeWorkbench matches localStorage value or defaults to 'work'
- **Failure Mode:** User loses workbench selection between sessions
- **Automation Script:**
```javascript
// Chrome MCP script
// Set a known workbench in localStorage
await evaluateScript(() => {
  localStorage.setItem('afw-active-workbench', 'maintenance');
});
// Refresh page to remount provider
await navigatePage({ type: 'reload' });
await new Promise(resolve => setTimeout(resolve, 1000));
// Check if activeWorkbench loaded correctly
const activeWorkbench = await evaluateScript(() => {
  return window.__REACT_DEVTOOLS_GLOBAL_HOOK__?.renderers?.get(1)?.findFiberByHostInstance?.(document.body)?.return?.return?.memoizedState?.memoizedState?.[0];
});
if (activeWorkbench !== 'maintenance') {
  throw new Error(`Expected 'maintenance', got: ${activeWorkbench}`);
}
```

#### HC-WB-002: setActiveWorkbench Updates State and localStorage
- **Type:** state-mutation
- **Target:** setActiveWorkbench function
- **Condition:** Calling setActiveWorkbench(id) updates activeWorkbench state and persists to localStorage
- **Failure Mode:** Workbench navigation breaks, no persistence
- **Automation Script:**
```javascript
// Chrome MCP script
const initialWorkbench = await evaluateScript(() => {
  const context = window.__REACT_DEVTOOLS_GLOBAL_HOOK__?.renderers?.get(1)?.findFiberByHostInstance?.(document.body)?.return?.return?.memoizedState?.memoizedState;
  return context?.[0];
});
// Simulate click on a different workbench tab (e.g., 'explore')
await click({ uid: 'workbench-tab-explore' }); // Assumes TopBar has data-testid
await new Promise(resolve => setTimeout(resolve, 200));
const newWorkbench = await evaluateScript(() => {
  return localStorage.getItem('afw-active-workbench');
});
if (newWorkbench !== 'explore') {
  throw new Error(`Expected 'explore' in localStorage, got: ${newWorkbench}`);
}
```

#### HC-WB-003: Notification Count Tracking
- **Type:** state-tracking
- **Target:** workbenchNotifications Map
- **Condition:** addNotification increments count, clearNotifications resets to 0
- **Failure Mode:** Notification badges on workbench tabs do not update
- **Automation Script:**
```javascript
// Chrome MCP script
await evaluateScript(() => {
  const context = window.__workbenchContext; // Assumes context is exposed for testing
  context.addNotification('work');
  context.addNotification('work');
  context.addNotification('work');
  const count = context.workbenchNotifications.get('work');
  if (count !== 3) throw new Error(`Expected count=3, got: ${count}`);
  context.clearNotifications('work');
  const clearedCount = context.workbenchNotifications.get('work');
  if (clearedCount !== 0) throw new Error(`Expected count=0 after clear, got: ${clearedCount}`);
  return { success: true };
});
```

### Warning Checks (Should Pass)

#### HC-WB-W001: Back Navigation History Tracking
- **Type:** navigation-history
- **Target:** previousWorkbench state
- **Condition:** setActiveWorkbench tracks previous workbench, goBack restores it
- **Failure Mode:** Back button does not work

#### HC-WB-W002: Routing Filter Applies Correctly
- **Type:** session-filtering
- **Target:** filterSessionsByContext function
- **Condition:** When routingFilter is set, only sessions with matching routingContext are returned
- **Failure Mode:** Session filtering does not work, all sessions shown regardless of filter

### Performance Benchmarks

| Metric | Threshold | Unit | Description |
|--------|-----------|------|-------------|
| context-read-time | 10 | ms | Time to read context value via useWorkbenchContext() |
| state-update-time | 50 | ms | Time from setActiveWorkbench call to re-render |
| localStorage-write-time | 20 | ms | Time to persist activeWorkbench to localStorage |

---

## Dependencies

**Required Contexts:**
N/A (this is a root provider)

**Required Hooks:**
N/A

**Child Components:**
N/A (wraps entire app)

**Required Props:**
- `children` (ReactNode)

---

## Notes

- 12 workbenches: work, maintenance, explore, review, archive, settings, pm, harmony, canvas, editor, intel, respect
- WorkbenchId is a branded type from @afw/shared
- DEFAULT_WORKBENCH_CONFIGS contains name, icon, color, description for each workbench
- Notification counts are stored in a Map, not persisted to localStorage (reset on app restart)
- Back navigation only tracks one level (previousWorkbench), not full history stack
- Routing filter allows filtering sessions by context (e.g., show only 'work' sessions on work workbench)
- useActiveWorkbench() is a convenience hook that returns only { activeWorkbench, setActiveWorkbench }
- useWorkbenchContext() hook throws if used outside provider (defensive programming)

---

**Contract Authored:** 2026-02-10
**Last Updated:** 2026-02-10
**Version:** 1.0.0
