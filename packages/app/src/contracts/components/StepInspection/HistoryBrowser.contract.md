# Component Contract: HistoryBrowser

**File:** `packages/app/src/components/HistoryBrowser.tsx`
**Type:** feature
**Parent Group:** StepInspection (history)
**Contract Version:** 1.0.0
**Last Reviewed:** 2026-02-10

---

## Identity

- **Component Name:** HistoryBrowser
- **Introduced:** 2025-12-10 (estimated)
- **Description:** Three-column browser for viewing past execution sessions with 7-day retention. Lists available dates, sessions for selected date, and detailed session information with chains and events.

---

## Render Location

**Mounts Under:**
- ArchiveWorkbench or HistoryView

**Render Conditions:**
1. When user navigates to history view

**Positioning:** relative
**Z-Index:** N/A

---

## Lifecycle

**Mount Triggers:**
- Parent workbench activates

**Key Effects:**
1. **Dependencies:** `[backendUrl]`
   - **Side Effects:** HTTP GET `/api/history/dates` to load available dates
   - **Cleanup:** None
   - **Condition:** Runs on mount
2. **Dependencies:** `[selectedDate, backendUrl]`
   - **Side Effects:** HTTP GET `/api/history/sessions/:date` to load session IDs
   - **Cleanup:** None
   - **Condition:** Runs when selectedDate changes

**Cleanup Actions:**
None

**Unmount Triggers:**
- User switches to different workbench

---

## Props Contract

### Inputs
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| backendUrl | string | ✅ | N/A | Backend base URL (e.g., 'http://localhost:3001') |
| onSessionSelect | (snapshot: SessionSnapshot) => void | ❌ | undefined | Callback when session selected from list |

### Callbacks Up (to parent)
| Callback | Signature | Description |
|----------|-----------|-------------|
| onSessionSelect | `(snapshot: SessionSnapshot) => void` | Fires when user clicks session in list |

### Callbacks Down (to children)
None (internal list rendering)

---

## State Ownership

### Local State
| State | Type | Initial | Updated By |
|-------|------|---------|------------|
| availableDates | string[] | [] | `loadAvailableDates` (HTTP response) |
| selectedDate | string \| null | null | User clicks date in list |
| sessionIds | string[] | [] | `loadSessionsForDate` (HTTP response) |
| selectedSession | SessionSnapshot \| null | null | `loadSession` (HTTP response) |
| loading | boolean | false | All load functions |
| error | string \| null | null | All load functions (catch blocks) |

### Context Consumption
None

### Derived State
None

### Custom Hooks
None

---

## Interactions

### Parent Communication
- **Mechanism:** prop-callback
- **Description:** Notifies parent when session selected (for opening in viewer)
- **Example:** `onSessionSelect?.(snapshot)`

### Child Communication
None (leaf component with internal lists)

### Sibling Communication
None

### Context Interaction
None

---

## Side Effects

### API Calls
| Endpoint | Method | Trigger | Response Handling |
|----------|--------|---------|-------------------|
| `/api/history/dates` | GET | Mount | Sets `availableDates` array, auto-selects most recent |
| `/api/history/sessions/:date` | GET | Date selection | Sets `sessionIds` array |
| `/api/history/session/:sessionId?date=:date` | GET | Session click | Sets `selectedSession` object |

### WebSocket Events
None

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
- `.history-browser`
- `.history-header`
- `.retention-note` (7-day retention indicator)
- `.error-message` (error state)
- `.history-content` (three-column layout)
- `.date-list` (left column)
- `.date-list ul li` (date items)
- `.date-list li.selected` (selected date)
- `.session-list` (middle column)
- `.session-list ul li` (session items)
- `.session-list li.selected` (selected session)
- `.session-id` (session ID text)
- `.session-details` (right column)
- `.details-grid` (session metadata grid)
- `.detail-item` (individual metadata field)
- `.session-summary` (session summary text)
- `.loading` (loading state)
- `.empty-state` (no data state)

**Data Test IDs:**
None

**ARIA Labels:**
None (semantic HTML structure)

**Visual Landmarks:**
1. Date list (`.date-list`) — Left column with available dates
2. Session list (`.session-list`) — Middle column with session IDs for selected date
3. Session details (`.session-details`) — Right column with full session metadata
4. Retention note (`.retention-note`) — "7-day retention" label in header

---

## Health Checks

### Critical Checks (Must Pass)

#### HC-HBR-001: Dates Load on Mount
- **Type:** connection
- **Target:** `/api/history/dates` endpoint
- **Condition:** HTTP GET succeeds and returns dates array
- **Failure Mode:** History browser unusable, no dates shown
- **Automation Script:**
```javascript
// Chrome MCP script
await fetch('http://localhost:3001/api/history/dates')
  .then(res => res.json())
  .then(data => {
    if (!data.dates || !Array.isArray(data.dates)) {
      throw new Error('History dates API failed');
    }
    console.log('Available dates:', data.dates.length);
  });
```

#### HC-HBR-002: Session IDs Load for Selected Date
- **Type:** connection
- **Target:** `/api/history/sessions/:date` endpoint
- **Condition:** Selecting date fetches session IDs
- **Failure Mode:** Cannot browse sessions for date
- **Automation Script:**
```javascript
// Chrome MCP script
const date = document.querySelector('.date-list li');
date.click();
setTimeout(async () => {
  const sessionItems = document.querySelectorAll('.session-list li');
  if (sessionItems.length === 0) {
    console.warn('No sessions found for selected date');
  }
}, 500);
```

#### HC-HBR-003: Session Details Load on Click
- **Type:** interaction
- **Target:** Session list item click
- **Condition:** Clicking session fetches full SessionSnapshot
- **Failure Mode:** Cannot view session details
- **Automation Script:**
```javascript
// Chrome MCP script
const sessionItem = document.querySelector('.session-list li');
sessionItem.click();
setTimeout(() => {
  const details = document.querySelector('.session-details');
  if (!details) throw new Error('Session details not loading');
}, 500);
```

### Warning Checks (Should Pass)

#### HC-HBR-004: Loading States Show
- **Type:** render
- **Target:** `.loading` elements
- **Condition:** Loading indicators appear during fetch operations
- **Failure Mode:** No feedback during load

### Performance Benchmarks

| Metric | Threshold | Unit | Description |
|--------|-----------|------|-------------|
| api-dates | 200 | ms | Time to fetch available dates |
| api-sessions | 300 | ms | Time to fetch session IDs for date |
| api-snapshot | 400 | ms | Time to fetch full session snapshot |

---

## Dependencies

**Required Contexts:**
None

**Required Hooks:**
None

**Child Components:**
None (internal list rendering)

**Required Props:**
- `backendUrl` (string)

---

## Notes

**SessionSnapshot Structure:**
- `session`: Full Session object with chains, status, cwd, user
- `events`: Array of WorkspaceEvents associated with session
- `timing`: Start/end timestamps, duration

**Retention Policy:**
- 7-day retention for historical sessions
- Older sessions automatically purged by backend

**Date Formatting:**
- Stored as ISO 8601 date strings (YYYY-MM-DD)
- Displayed as human-readable (e.g., "Feb 10, 2026")

**Duration Formatting:**
- Calculates duration from start to end timestamps
- Shows "Xm Ys" format
- Shows "In progress" if session has no end timestamp

**Auto-Select Behavior:**
- Automatically selects most recent date on mount
- Loads sessions for auto-selected date

---

**Contract Authored:** 2026-02-10
**Last Updated:** 2026-02-10
**Version:** 1.0.0
