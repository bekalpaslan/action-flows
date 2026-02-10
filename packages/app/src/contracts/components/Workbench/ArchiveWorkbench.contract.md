# Component Contract: ArchiveWorkbench

**File:** `packages/app/src/components/Workbench/ArchiveWorkbench.tsx`
**Type:** page
**Parent Group:** Workbench
**Contract Version:** 1.0.0
**Last Reviewed:** 2026-02-10

---

## Identity

- **Component Name:** ArchiveWorkbench
- **Introduced:** 2026-01-25
- **Description:** Session archive browser with search, filtering, sorting, and bulk actions. Displays archived/completed sessions in a table with restore and delete operations.

---

## Render Location

**Mounts Under:**
- WorkbenchLayout (when `activeWorkbench === 'archive'`)

**Render Conditions:**
1. User selects "Archive" tab in TopBar

**Positioning:** relative
**Z-Index:** N/A

---

## Lifecycle

**Mount Triggers:**
- User navigates to Archive workbench

**Key Effects:**
None

**Cleanup Actions:**
None

**Unmount Triggers:**
- User switches workbenches

---

## Props Contract

### Inputs
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| archivedSessions | `ArchivedSession[]` | ✅ | N/A | Archived sessions to display |
| onRestore | `(sessionId: string) => void` | ✅ | N/A | Callback when session is restored |
| onDelete | `(sessionId: string) => void` | ✅ | N/A | Callback when session is deleted |
| onClearAll | `() => void` | ❌ | undefined | Callback to clear all archives |

### Callbacks Up (to parent)
| Callback | Signature | Description |
|----------|-----------|-------------|
| onRestore | `(sessionId) => void` | Notifies parent to restore session |
| onDelete | `(sessionId) => void` | Notifies parent to delete session |
| onClearAll | `() => void` | Notifies parent to clear all archives |

### Callbacks Down (to children)
None (uses primitive table rows)

---

## State Ownership

### Local State
| State | Type | Initial | Updated By |
|-------|------|---------|------------|
| searchQuery | `string` | `''` | setSearchQuery |
| dateFrom | `string` | `''` | setDateFrom |
| dateTo | `string` | `''` | setDateTo |
| statusFilter | `string` | `'all'` | setStatusFilter |
| sortField | `'archivedAt' \| 'startedAt' \| 'chainsCount'` | `'archivedAt'` | setSortField |
| sortDirection | `'asc' \| 'desc'` | `'desc'` | setSortDirection |
| selectedIds | `Set<string>` | `new Set()` | toggleSelection, selectAll, deselectAll |

### Context Consumption
| Context | Values Used |
|---------|-------------|
| DiscussContext | `prefillChatInput()` |

### Derived State
| Name | Type | Dependencies | Computation |
|------|------|--------------|-------------|
| uniqueStatuses | `string[]` | `[archivedSessions]` | Extract unique session statuses |
| filteredSessions | `ArchivedSession[]` | `[archivedSessions, searchQuery, statusFilter, dateFrom, dateTo, sortField, sortDirection]` | Filters and sorts sessions |
| hasActiveFilters | `boolean` | `[searchQuery, dateFrom, dateTo, statusFilter]` | Checks if any filters active |

### Custom Hooks
- `useDiscussButton()` — Manages DiscussButton dialog

---

## Interactions

### Parent Communication
- **Mechanism:** prop-callback
- **Description:** Notifies parent of restore/delete actions
- **Example:** User clicks Restore → `onRestore(sessionId)` → Parent restores session

### Child Communication
N/A

### Sibling Communication
N/A

### Context Interaction
- **Context:** DiscussContext
- **Role:** consumer
- **Operations:** Opens discuss dialog with archive context

---

## Side Effects

### API Calls
N/A - Uses parent-provided data

### WebSocket Events
N/A

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
- `.archive-workbench`
- `.archive-workbench__filters`
- `.archive-filter-input`
- `.archive-filter-select`
- `.archive-table-header`
- `.archive-table-body`
- `.archive-table-row`
- `.archive-action-btn.restore-btn`
- `.archive-action-btn.delete-btn`
- `.bulk-action-btn`

**Data Test IDs:**
N/A

**ARIA Labels:**
N/A

**Visual Landmarks:**
1. Filter bar (`.archive-workbench__filters`) — Search, status, date range
2. Bulk actions bar (`.archive-workbench__bulk-actions`) — Appears when items selected
3. Table header (`.archive-table-header`) — Sortable columns
4. Table rows (`.archive-table-row`) — Session data with actions

---

## Health Checks

### Critical Checks (Must Pass)

#### HC-AW-001: Table Renders
- **Type:** render
- **Target:** `.archive-table-body`
- **Condition:** Table body exists
- **Failure Mode:** No archive visible
- **Automation Script:**
```javascript
const tableBody = document.querySelector('.archive-table-body');
return tableBody !== null;
```

#### HC-AW-002: Search Filters Sessions
- **Type:** user-input
- **Target:** Search input
- **Condition:** Typing filters sessions
- **Failure Mode:** Search doesn't work
- **Automation Script:**
```javascript
const input = document.querySelector('.archive-filter-input');
input.value = 'test';
input.dispatchEvent(new Event('change', { bubbles: true }));
await new Promise(resolve => setTimeout(resolve, 100));
return true; // Verify filtered count
```

#### HC-AW-003: Sort Columns Work
- **Type:** user-action
- **Target:** Table header cells
- **Condition:** Clicking headers sorts table
- **Failure Mode:** Can't sort
- **Automation Script:**
```javascript
const archivedAtCol = document.querySelector('.archive-cell-archived');
archivedAtCol.click();
await new Promise(resolve => setTimeout(resolve, 100));
const sortIndicator = archivedAtCol.querySelector('.sort-indicator');
return sortIndicator !== null;
```

#### HC-AW-004: Bulk Actions Work
- **Type:** user-action
- **Target:** Bulk action buttons
- **Condition:** Selecting sessions enables bulk actions
- **Failure Mode:** Can't bulk restore/delete
- **Automation Script:**
```javascript
const checkbox = document.querySelector('.archive-table-row input[type="checkbox"]');
checkbox.checked = true;
checkbox.dispatchEvent(new Event('change', { bubbles: true }));
await new Promise(resolve => setTimeout(resolve, 100));
const bulkBar = document.querySelector('.archive-workbench__bulk-actions');
return bulkBar !== null;
```

### Warning Checks (Should Pass)

#### HC-AW-005: Date Range Filter Works
- **Type:** user-input
- **Target:** Date inputs
- **Condition:** Setting dates filters sessions
- **Failure Mode:** Can't filter by date

---

## Dependencies

**Required Contexts:**
- DiscussContext

**Required Hooks:**
- useDiscussButton

**Child Components:**
- DiscussButton
- DiscussDialog

**Required Props:**
- `archivedSessions`
- `onRestore`
- `onDelete`

---

## Notes

- Date range filter: `dateFrom` is inclusive, `dateTo` adds 24h to include full day
- Bulk selection: Checkbox in header selects/deselects all filtered sessions
- Sort fields: archivedAt, startedAt, chainsCount
- Session duration computed from startedAt to endedAt (or now if still running)
- Delete actions require confirmation dialogs

---

**Contract Authored:** 2026-02-10
**Last Updated:** 2026-02-10
**Version:** 1.0.0
