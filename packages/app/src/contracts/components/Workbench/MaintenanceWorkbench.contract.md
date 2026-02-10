# Component Contract: MaintenanceWorkbench

**File:** `packages/app/src/components/Workbench/MaintenanceWorkbench.tsx`
**Type:** page
**Parent Group:** Workbench
**Contract Version:** 1.0.0
**Last Reviewed:** 2026-02-10

---

## Identity

- **Component Name:** MaintenanceWorkbench
- **Introduced:** 2026-01-20
- **Description:** System health dashboard for monitoring WebSocket connection, backend health, active sessions count, and recent errors. Provides manual and auto-refresh capabilities.

---

## Render Location

**Mounts Under:**
- WorkbenchLayout (when `activeWorkbench === 'maintenance'`)

**Render Conditions:**
1. User selects "Maintenance" tab in TopBar (`activeWorkbench === 'maintenance'`)

**Positioning:** relative
**Z-Index:** N/A

---

## Lifecycle

**Mount Triggers:**
- User navigates to Maintenance workbench via TopBar tab

**Key Effects:**
1. **Dependencies:** `[fetchHealth]`
   - **Side Effects:** Fetches backend health on component mount
   - **Cleanup:** None
   - **Condition:** Runs once on mount

2. **Dependencies:** `[wsError, addError]`
   - **Side Effects:** Adds WebSocket error to recent errors list
   - **Cleanup:** None
   - **Condition:** Runs when wsError changes

3. **Dependencies:** `[sessionsError, addError]`
   - **Side Effects:** Adds session fetch error to recent errors list
   - **Cleanup:** None
   - **Condition:** Runs when sessionsError changes

4. **Dependencies:** `[autoRefresh, handleRefresh]`
   - **Side Effects:** Auto-refreshes metrics every 30s when enabled
   - **Cleanup:** Clears interval
   - **Condition:** Runs when autoRefresh is true

**Cleanup Actions:**
- Clears auto-refresh interval

**Unmount Triggers:**
- User switches to different workbench tab

---

## Props Contract

### Inputs
None - This component does not accept props

### Callbacks Up (to parent)
None

### Callbacks Down (to children)
None (no child components beyond primitives)

---

## State Ownership

### Local State
| State | Type | Initial | Updated By |
|-------|------|---------|------------|
| metrics | `SystemMetrics` | `{ health: null, healthError: null, lastChecked: null }` | fetchHealth, setMetrics |
| recentErrors | `RecentError[]` | `[]` | addError |
| autoRefresh | `boolean` | `false` | handleAutoRefreshToggle |
| isRefreshing | `boolean` | `false` | handleRefresh |

### Context Consumption
| Context | Values Used |
|---------|-------------|
| WebSocketContext | `status`, `error` |
| DiscussContext | `prefillChatInput()` |

### Derived State
| Name | Type | Dependencies | Computation |
|------|------|--------------|-------------|
| activeSessions | `number` | `[sessions]` | Count sessions with status 'in_progress' or 'pending' |
| overallStatus | `'healthy' \| 'degraded' \| 'error'` | `[wsStatus, metrics, recentErrors]` | Computed based on error states |

### Custom Hooks
- `useAllSessions()` — Fetches all sessions with auto-refresh
- `useDiscussButton()` — Manages DiscussButton dialog state

---

## Interactions

### Parent Communication
- **Mechanism:** N/A
- **Description:** No parent callbacks
- **Example:** N/A

### Child Communication
- **Child:** N/A (uses primitive elements)
- **Mechanism:** N/A
- **Data Flow:** N/A

### Sibling Communication
- **Sibling:** N/A
- **Mechanism:** N/A
- **Description:** N/A

### Context Interaction
- **Context:** WebSocketContext
- **Role:** consumer
- **Operations:** Monitors connection status and errors

---

## Side Effects

### API Calls
| Endpoint | Method | Trigger | Response Handling |
|----------|--------|---------|-------------------|
| `/health` | GET | Mount, manual refresh, auto-refresh | Updates metrics.health with uptime |

### WebSocket Events
N/A - Monitors WebSocket status passively via context

### Timers
| Type | Duration | Purpose | Cleanup |
|------|----------|---------|---------|
| interval | 30000ms | Auto-refresh metrics | ✅ |

### LocalStorage Operations
N/A

### DOM Manipulation
N/A

### Electron IPC (if applicable)
N/A

---

## Test Hooks

**CSS Selectors:**
- `.maintenance-workbench`
- `.maintenance-workbench__header`
- `.maintenance-workbench__title`
- `.maintenance-workbench__status-badge`
- `.maintenance-workbench__auto-refresh`
- `.maintenance-workbench__refresh-btn`
- `.metric-card`
- `.metric-card__status`
- `.errors-section__list`
- `.error-item`

**Data Test IDs:**
N/A

**ARIA Labels:**
N/A

**Visual Landmarks:**
1. Header with status badge (`.maintenance-workbench__status-badge`) — Shows overall health (healthy, degraded, error)
2. Metrics grid (`.maintenance-workbench__metrics-grid`) — 4 metric cards (WebSocket, Backend, Sessions, Last Check)
3. Recent errors section (`.maintenance-workbench__errors-section`) — Error log list

---

## Health Checks

### Critical Checks (Must Pass)

#### HC-MW-001: Component Renders
- **Type:** render
- **Target:** `.maintenance-workbench` element
- **Condition:** Element exists in DOM
- **Failure Mode:** Workbench does not appear
- **Automation Script:**
```javascript
const workbench = document.querySelector('.maintenance-workbench');
return workbench !== null;
```

#### HC-MW-002: Backend Health Fetched
- **Type:** api-call
- **Target:** GET `/health`
- **Condition:** Health data fetched within 5s of mount
- **Failure Mode:** No backend health information
- **Automation Script:**
```javascript
const startTime = Date.now();
const checkHealth = async () => {
  const response = await fetch('http://localhost:3001/health');
  return response.ok && (Date.now() - startTime) < 5000;
};
return await checkHealth();
```

#### HC-MW-003: WebSocket Status Displays
- **Type:** context-binding
- **Target:** `.metric-card__status` in WebSocket card
- **Condition:** Shows current connection status (connected, connecting, disconnected, error)
- **Failure Mode:** Users don't know WebSocket state
- **Automation Script:**
```javascript
const wsCard = Array.from(document.querySelectorAll('.metric-card'))
  .find(card => card.textContent.includes('WebSocket'));
const statusEl = wsCard?.querySelector('.metric-card__status');
const validStatuses = ['Connected', 'Connecting...', 'Disconnected', 'Error'];
return statusEl && validStatuses.includes(statusEl.textContent);
```

#### HC-MW-004: Overall Status Badge Updates
- **Type:** state-update
- **Target:** `.maintenance-workbench__status-badge`
- **Condition:** Badge shows "All Systems Operational", "Degraded Performance", or "System Issues Detected"
- **Failure Mode:** No quick health overview
- **Automation Script:**
```javascript
const badge = document.querySelector('.maintenance-workbench__status-badge');
const validStates = ['All Systems Operational', 'Degraded Performance', 'System Issues Detected'];
return badge && validStates.some(state => badge.textContent.includes(state));
```

#### HC-MW-005: Auto-Refresh Works
- **Type:** interval
- **Target:** Auto-refresh mechanism
- **Condition:** When enabled, metrics refresh every 30s
- **Failure Mode:** Stale health data
- **Automation Script:**
```javascript
// Enable auto-refresh
const checkbox = document.querySelector('.maintenance-workbench__auto-refresh input[type="checkbox"]');
checkbox.checked = true;
checkbox.dispatchEvent(new Event('change', { bubbles: true }));

// Wait 31s and verify health endpoint was called twice
await new Promise(resolve => setTimeout(resolve, 31000));
return true; // Verify via network monitoring
```

### Warning Checks (Should Pass)

#### HC-MW-006: Recent Errors Cleared
- **Type:** user-action
- **Target:** Clear All button in errors section
- **Condition:** Button clears all errors from list
- **Failure Mode:** Error list clutter

#### HC-MW-007: Manual Refresh Button Works
- **Type:** user-action
- **Target:** Refresh button
- **Condition:** Button triggers metrics refresh
- **Failure Mode:** No way to force-refresh

---

## Dependencies

**Required Contexts:**
- WebSocketContext (for connection status)
- DiscussContext (for DiscussButton)

**Required Hooks:**
- useAllSessions
- useDiscussButton

**Child Components:**
- DiscussButton
- DiscussDialog

**Required Props:**
None

---

## Notes

- This is the system health monitoring dashboard.
- Auto-refresh interval is 30 seconds.
- Recent errors are capped at 10 items (FIFO).
- Error sources: `'websocket' | 'api' | 'session'`.
- Overall status logic: Error if wsStatus !== 'connected' OR healthError. Degraded if recentErrors.length > 0. Otherwise healthy.
- Health check includes uptime display formatted as "Xd Xh Xm Xs".

---

**Contract Authored:** 2026-02-10
**Last Updated:** 2026-02-10
**Version:** 1.0.0
