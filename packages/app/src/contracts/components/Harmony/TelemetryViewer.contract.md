# Component Contract: TelemetryViewer

**File:** `packages/app/src/components/TelemetryViewer/TelemetryViewer.tsx`
**Type:** feature
**Parent Group:** Harmony
**Contract Version:** 1.0.0
**Last Reviewed:** 2026-02-10

---

## Identity

- **Component Name:** TelemetryViewer
- **Introduced:** 2025-12-20 (estimated)
- **Description:** Filterable log table for structured telemetry entries showing system events, errors, and debug information with level and source filtering. Auto-refreshes every 10 seconds.

---

## Render Location

**Mounts Under:**
- HarmonyWorkbench or SettingsWorkbench

**Render Conditions:**
1. Always renders when parent workbench is active

**Positioning:** relative
**Z-Index:** N/A

---

## Lifecycle

**Mount Triggers:**
- Parent workbench activates

**Key Effects:**
1. **Dependencies:** `[levelFilter, sourceFilter]`
   - **Side Effects:** HTTP GET `/api/telemetry?level={level}&source={source}&limit=100`
   - **Cleanup:** Clears interval on unmount
   - **Condition:** Runs on mount and when filters change
2. **Dependencies:** `[]` (interval setup)
   - **Side Effects:** Sets 10s interval to refetch telemetry and stats
   - **Cleanup:** Clears interval
   - **Condition:** Runs once on mount

**Cleanup Actions:**
- Clears auto-refresh interval

**Unmount Triggers:**
- User switches to different workbench

---

## Props Contract

### Inputs
None (self-contained component)

### Callbacks Up (to parent)
None

### Callbacks Down (to children)
None

---

## State Ownership

### Local State
| State | Type | Initial | Updated By |
|-------|------|---------|------------|
| entries | TelemetryEntry[] | [] | `fetchTelemetry` (HTTP response) |
| stats | TelemetryStats \| null | null | `fetchStats` (HTTP response) |
| levelFilter | TelemetryLevel \| 'all' | 'all' | Select onChange |
| sourceFilter | string | 'all' | Select onChange |
| sources | string[] | [] | `fetchStats` (extracted from stats.bySource) |

### Context Consumption
None

### Derived State
None

### Custom Hooks
None

---

## Interactions

### Parent Communication
None (standalone feature)

### Child Communication
None (leaf component with internal table)

### Sibling Communication
None

### Context Interaction
None

---

## Side Effects

### API Calls
| Endpoint | Method | Trigger | Response Handling |
|----------|--------|---------|-------------------|
| `/api/telemetry` | GET | Mount, filter change, 10s interval | Sets `entries` array |
| `/api/telemetry/stats` | GET | Mount, 10s interval | Sets `stats` object and extracts `sources` |

### WebSocket Events
None

### Timers
| Type | Duration | Purpose | Cleanup |
|------|----------|---------|---------|
| interval | 10000ms | Auto-refresh telemetry and stats | ✅ |

### LocalStorage Operations
None

### DOM Manipulation
None

### Electron IPC (if applicable)
N/A

---

## Test Hooks

**CSS Selectors:**
- `.telemetry-viewer`
- `.telemetry-viewer__header`
- `.telemetry-viewer__title`
- `.telemetry-viewer__filters`
- `.telemetry-viewer__filter-select` (level and source dropdowns)
- `.telemetry-viewer__stats` (stats overview)
- `.telemetry-viewer__stat`
- `.telemetry-viewer__table-container`
- `.telemetry-viewer__table`
- `.telemetry-viewer__table-header`
- `.telemetry-viewer__table-row`, `.telemetry-viewer__table-row--{level}`
- `.telemetry-viewer__table-cell--timestamp`, `.telemetry-viewer__table-cell--level`, `.telemetry-viewer__table-cell--source`, `.telemetry-viewer__table-cell--message`
- `.telemetry-viewer__level--{level}` (level badge)
- `.telemetry-viewer__empty` (empty state)

**Data Test IDs:**
None

**ARIA Labels:**
None (semantic table structure)

**Visual Landmarks:**
1. Filter controls (`.telemetry-viewer__filters`) — Level and source dropdowns
2. Stats overview (`.telemetry-viewer__stats`) — Total entries, errors, sources count
3. Table header (`.telemetry-viewer__table-header`) — Column labels
4. Table rows (`.telemetry-viewer__table-row`) — Color-coded by level
5. Empty state (`.telemetry-viewer__empty`) — When no entries match filter

---

## Health Checks

### Critical Checks (Must Pass)

#### HC-TV-001: Telemetry API Fetches Data
- **Type:** connection
- **Target:** `/api/telemetry` endpoint
- **Condition:** HTTP GET succeeds and returns entries array
- **Failure Mode:** Table shows empty state or fails to load
- **Automation Script:**
```javascript
// Chrome MCP script
await fetch('http://localhost:3001/api/telemetry?limit=10')
  .then(res => res.json())
  .then(data => {
    if (!data.success) throw new Error('Telemetry API failed');
    console.log('Telemetry entries loaded:', data.entries.length);
  });
```

#### HC-TV-002: Level Filter Updates Query
- **Type:** interaction
- **Target:** Level filter select
- **Condition:** Changing level filter refetches telemetry with `level` query param
- **Failure Mode:** Filter non-functional, shows all entries
- **Automation Script:**
```javascript
// Chrome MCP script
const levelSelect = document.querySelector('.telemetry-viewer__filters select[value="all"]');
levelSelect.value = 'error';
levelSelect.dispatchEvent(new Event('change', { bubbles: true }));
setTimeout(() => {
  const rows = document.querySelectorAll('.telemetry-viewer__table-row--error');
  if (rows.length === 0) console.warn('Error filter not applied');
}, 500);
```

#### HC-TV-003: Auto-Refresh Active
- **Type:** timer
- **Target:** 10s interval
- **Condition:** Telemetry refetches every 10 seconds
- **Failure Mode:** Stale data, no real-time updates
- **Automation Script:**
```javascript
// Chrome MCP script
// Cannot directly test interval, but can verify data updates
const initialCount = document.querySelectorAll('.telemetry-viewer__table-row').length;
setTimeout(() => {
  const newCount = document.querySelectorAll('.telemetry-viewer__table-row').length;
  if (newCount === initialCount) console.warn('Auto-refresh may not be working (no new entries)');
}, 11000);
```

### Warning Checks (Should Pass)

#### HC-TV-004: Stats Overview Displays
- **Type:** render
- **Target:** `.telemetry-viewer__stats`
- **Condition:** Stats display total entries, errors, sources count
- **Failure Mode:** Missing context for telemetry data

### Performance Benchmarks

| Metric | Threshold | Unit | Description |
|--------|-----------|------|-------------|
| api-fetch-100 | 200 | ms | Time to fetch 100 telemetry entries |
| render-100-rows | 150 | ms | Time to render 100 table rows |

---

## Dependencies

**Required Contexts:**
None

**Required Hooks:**
None

**Child Components:**
None (internal table rendering)

**Required Props:**
None

---

## Notes

**Telemetry Entry Structure:**
- `id`: Unique identifier
- `timestamp`: ISO 8601 timestamp
- `level`: 'debug' | 'info' | 'warn' | 'error'
- `source`: Source component or module
- `message`: Log message text

**Stats Structure:**
- `totalEntries`: Total number of telemetry entries
- `errorCount`: Count of error-level entries
- `bySource`: Object mapping source names to counts
- `byLevel`: Object mapping levels to counts

**Filtering:**
- Level filter: 'all', 'debug', 'info', 'warn', 'error'
- Source filter: 'all', or any source from `sources` array
- Filters apply as query params to `/api/telemetry`

**Auto-Refresh:**
- Interval: 10 seconds
- Fetches both telemetry entries and stats
- Runs until component unmounts

---

**Contract Authored:** 2026-02-10
**Last Updated:** 2026-02-10
**Version:** 1.0.0
