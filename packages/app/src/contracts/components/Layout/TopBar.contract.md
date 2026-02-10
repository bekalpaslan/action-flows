# Component Contract: TopBar

**File:** `packages/app/src/components/TopBar/TopBar.tsx`
**Type:** widget
**Parent Group:** components/TopBar
**Contract Version:** 1.0.0
**Last Reviewed:** 2026-02-10

---

## Identity

- **Component Name:** TopBar
- **Introduced:** 2026-01-20
- **Description:** Main navigation header with 12 workbench tabs, WebSocket connection status indicator, and theme toggle. Horizontal tab bar at the top of the dashboard.

---

## Render Location

**Mounts Under:**
- WorkbenchLayout

**Render Conditions:**
1. Always renders (persistent navigation)

**Positioning:** sticky (top: 0)
**Z-Index:** 100 (stays above content on scroll)

---

## Lifecycle

**Mount Triggers:**
- WorkbenchLayout mount

**Key Effects:**
N/A (stateless component)

**Cleanup Actions:**
N/A

**Unmount Triggers:**
- WorkbenchLayout unmount (never in normal operation)

---

## Props Contract

### Inputs
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| activeWorkbench | WorkbenchId | ✅ | N/A | Currently active workbench (e.g., 'work', 'maintenance', ...) |
| onWorkbenchChange | `(workbenchId: WorkbenchId) => void` | ✅ | N/A | Callback when user clicks a workbench tab |

### Callbacks Up (to parent)
| Callback | Signature | Description |
|----------|-----------|-------------|
| onWorkbenchChange | `(workbenchId: WorkbenchId) => void` | Called when user clicks a workbench tab, parent updates activeWorkbench |

### Callbacks Down (to children)
| Callback | Signature | Passed To | Description |
|----------|-----------|-----------|-------------|
| onClick | `() => void` | WorkbenchTab (each tab) | Calls onWorkbenchChange with specific workbenchId |

---

## State Ownership

### Local State
N/A (stateless presentation component)

### Context Consumption
| Context | Values Used |
|---------|-------------|
| WebSocketContext | status, error |
| WorkbenchContext | workbenchNotifications |

### Derived State
| Name | Type | Dependencies | Computation |
|------|------|--------------|-------------|
| statusText | string | `[status, error]` | Maps status to display text ('Connected', 'Connecting...', 'Disconnected', 'Connection Error') |
| statusClass | string | `[status]` | Maps status to CSS class ('connected', 'connecting', 'disconnected', 'error') |

### Custom Hooks
N/A

---

## Interactions

### Parent Communication
- **Mechanism:** Callback prop
- **Description:** Calls onWorkbenchChange when user clicks a tab
- **Example:** User clicks 'explore' tab → TopBar calls onWorkbenchChange('explore') → WorkbenchLayout updates activeWorkbench

### Child Communication
- **Child:** WorkbenchTab (12 instances), ThemeToggle
- **Mechanism:** Props
- **Data Flow:** Passes workbench config, isActive, notificationCount, onClick to each WorkbenchTab

### Sibling Communication
N/A (no sibling coordination)

### Context Interaction
- **Context:** WebSocketContext
- **Role:** consumer
- **Operations:** Reads status and error for connection indicator
- **Context:** WorkbenchContext
- **Role:** consumer
- **Operations:** Reads workbenchNotifications for notification badges on tabs

---

## Side Effects

### API Calls
N/A

### WebSocket Events
N/A (displays status, does not manage connection)

### Timers
N/A

### LocalStorage Operations
N/A

### DOM Manipulation
N/A

### Electron IPC (if applicable)
N/A

---

## Test Hooks

**CSS Selectors:**
- `.top-bar` (root element)
- `.top-bar-tabs` (tab navigation container)
- `.top-bar-status` (status indicator container)
- `.status` (connection status element)
- `.status.connected`, `.status.connecting`, `.status.disconnected`, `.status.error` (status variants)

**Data Test IDs:**
- `data-testid="top-bar"`
- `data-testid="workbench-tab-{workbenchId}"` (e.g., `workbench-tab-work`, `workbench-tab-maintenance`, ...)
- `data-testid="connection-status"`
- `data-testid="theme-toggle"`

**ARIA Labels:**
- `aria-label="Workbench navigation"` on `.top-bar-tabs` nav
- `role="status"` on `.status` element
- `aria-live="polite"` on `.status` element (announces connection changes to screen readers)

**Visual Landmarks:**
1. 12 workbench tabs in horizontal row (`.top-bar-tabs`)
2. Active tab has `.workbench-tab--active` class and bottom border highlight
3. Notification badges appear on tabs with unread counts (red dot with number)
4. Connection status indicator on the right (green dot = connected, gray = disconnected, red = error)
5. Theme toggle button on the right (sun/moon icon)

---

## Health Checks

### Critical Checks (Must Pass)

#### HC-TB-001: All 12 Workbench Tabs Render
- **Type:** render
- **Target:** WorkbenchTab components
- **Condition:** 12 tabs are present in DOM (work, maintenance, explore, review, archive, settings, pm, harmony, canvas, editor, intel, respect)
- **Failure Mode:** Missing workbenches, navigation incomplete
- **Automation Script:**
```javascript
// Chrome MCP script
await new Promise(resolve => setTimeout(resolve, 1000));
const snapshot = await takeSnapshot();
const workbenches = ['work', 'maintenance', 'explore', 'review', 'archive', 'settings', 'pm', 'harmony', 'canvas', 'editor', 'intel', 'respect'];
for (const wb of workbenches) {
  if (!snapshot.includes(`workbench-tab-${wb}`)) {
    throw new Error(`Missing workbench tab: ${wb}`);
  }
}
```

#### HC-TB-002: Active Tab Visual Highlight
- **Type:** ui-state
- **Target:** Active tab CSS class
- **Condition:** Active tab has `.workbench-tab--active` class and bottom border
- **Failure Mode:** User cannot tell which workbench is active
- **Automation Script:**
```javascript
// Chrome MCP script
// Click on 'explore' tab
await click({ uid: 'workbench-tab-explore' });
await new Promise(resolve => setTimeout(resolve, 200));
// Check if 'explore' tab has active class
const hasActiveClass = await evaluateScript(() => {
  const exploreTab = document.querySelector('[data-testid="workbench-tab-explore"]');
  return exploreTab?.classList.contains('workbench-tab--active');
});
if (!hasActiveClass) {
  throw new Error('Active tab does not have active class');
}
```

#### HC-TB-003: Tab Click Triggers onWorkbenchChange
- **Type:** interaction
- **Target:** onClick handler on WorkbenchTab
- **Condition:** Clicking a tab calls onWorkbenchChange with correct workbenchId
- **Failure Mode:** Workbench navigation does not work
- **Automation Script:**
```javascript
// Chrome MCP script
const initialWorkbench = await evaluateScript(() => {
  return localStorage.getItem('afw-active-workbench');
});
// Click on a different tab (e.g., 'pm')
await click({ uid: 'workbench-tab-pm' });
await new Promise(resolve => setTimeout(resolve, 300));
const newWorkbench = await evaluateScript(() => {
  return localStorage.getItem('afw-active-workbench');
});
if (newWorkbench !== 'pm') {
  throw new Error(`Expected 'pm', got: ${newWorkbench}`);
}
```

#### HC-TB-004: Connection Status Displays Correctly
- **Type:** status-indicator
- **Target:** Connection status element
- **Condition:** Status text and CSS class reflect WebSocket connection status
- **Failure Mode:** User unaware of connection issues
- **Automation Script:**
```javascript
// Chrome MCP script
await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for connection
const statusText = await evaluateScript(() => {
  return document.querySelector('[data-testid="connection-status"]')?.textContent;
});
const statusClass = await evaluateScript(() => {
  const statusEl = document.querySelector('[data-testid="connection-status"]');
  if (statusEl?.classList.contains('connected')) return 'connected';
  if (statusEl?.classList.contains('error')) return 'error';
  if (statusEl?.classList.contains('disconnected')) return 'disconnected';
  return 'connecting';
});
if (statusClass !== 'connected' && statusClass !== 'polling') {
  throw new Error(`Expected 'connected', got: ${statusClass} (${statusText})`);
}
```

### Warning Checks (Should Pass)

#### HC-TB-W001: Notification Badges Display
- **Type:** ui-feature
- **Target:** Notification count badges on tabs
- **Condition:** When workbenchNotifications has count > 0, badge appears on tab
- **Failure Mode:** User misses important notifications

#### HC-TB-W002: Theme Toggle Works
- **Type:** ui-feature
- **Target:** ThemeToggle component
- **Condition:** Clicking theme toggle changes theme (tested in ThemeContext contract)
- **Failure Mode:** Cannot change theme from TopBar

### Performance Benchmarks

| Metric | Threshold | Unit | Description |
|--------|-----------|------|-------------|
| render-time | 100 | ms | Time to render TopBar with all 12 tabs |
| tab-click-response | 50 | ms | Time from tab click to onWorkbenchChange call |
| status-update-time | 100 | ms | Time from WebSocket status change to UI update |

---

## Dependencies

**Required Contexts:**
- WebSocketContext (status, error)
- WorkbenchContext (workbenchNotifications)

**Required Hooks:**
N/A

**Child Components:**
- WorkbenchTab (12 instances)
- ThemeToggle

**Required Props:**
- `activeWorkbench`
- `onWorkbenchChange`

---

## Notes

- 12 workbenches: work, maintenance, explore, review, archive, settings, pm, harmony, canvas, editor, intel, respect
- WORKBENCH_IDS array from @afw/shared ensures consistent ordering
- DEFAULT_WORKBENCH_CONFIGS provides name, icon, color, description for each tab
- WorkbenchTab component handles individual tab rendering (icon, label, active state, notification badge)
- Connection status maps to 4 states: connecting (gray), connected (green), disconnected (gray), error (red)
- ThemeToggle renders sun/moon icon based on current theme
- TopBar is sticky positioned, stays at top on scroll
- Notification badges show count from workbenchNotifications Map (managed by WorkbenchContext)
- Error message (if present) is appended to status text: "Connection Error - {error.message}"

---

**Contract Authored:** 2026-02-10
**Last Updated:** 2026-02-10
**Version:** 1.0.0
