# Component Contract: DossierView

**File:** `packages/app/src/components/IntelDossier/DossierView.tsx`
**Type:** feature
**Parent Group:** IntelDossier
**Contract Version:** 1.0.0
**Last Reviewed:** 2026-02-10

---

## Identity

- **Component Name:** DossierView
- **Introduced:** 2024-Q4 (estimated)
- **Description:** Full dossier detail view displaying header, metadata, collapsible targets and context sections, and widget layout grid. Shows empty state when dossier hasn't been analyzed yet.

---

## Render Location

**Mounts Under:**
- IntelWorkbench (main content area)

**Render Conditions:**
1. Dossier is selected from DossierList (`selectedDossier !== null`)
2. Component always renders when dossier prop is provided

**Positioning:** relative (fills main content area)
**Z-Index:** N/A

---

## Lifecycle

**Mount Triggers:**
- User selects dossier from DossierList

**Key Effects:**
- None (purely presentational, no side effects)

**Cleanup Actions:**
- None

**Unmount Triggers:**
- User selects different dossier
- User deselects dossier (navigates away)
- IntelWorkbench unmounts

---

## Props Contract

### Inputs
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| dossier | `IntelDossier` | ✅ | N/A | Dossier object to display |
| onAnalyze | `() => void` | ✅ | N/A | Callback when "Re-analyze" button clicked |
| onDelete | `() => void` | ✅ | N/A | Callback when "Delete" button clicked |

### Callbacks Up (to parent)
| Callback | Signature | Description |
|----------|-----------|-------------|
| onAnalyze | `() => void` | Triggers dossier re-analysis |
| onDelete | `() => void` | Triggers dossier deletion |

### Callbacks Down (to children)
| Callback | Signature | Passed To | Description |
|----------|-----------|-----------|-------------|
| openDialog | `() => void` | DiscussButton | Opens discuss dialog |
| handleSend | `(message: string) => void` | DiscussDialog | Sends discuss message |

---

## State Ownership

### Local State
| State | Type | Initial | Updated By |
|-------|------|---------|------------|
| targetsExpanded | `boolean` | `false` | Section header toggle |
| contextExpanded | `boolean` | `false` | Section header toggle |

### Context Consumption
| Context | Values Used |
|---------|-------------|
| DiscussContext | `registerChatInput`, `prefillChatInput` (via useDiscussButton) |

### Derived State
| Name | Type | Dependencies | Computation |
|------|------|--------------|-------------|
| statusClass | `string` | `dossier.status` | `` `dossier-view__status-badge--${dossier.status}` `` |
| formattedDate | `string` | `dossier.updatedAt` | `formatDate(dossier.updatedAt)` |

### Custom Hooks
- `useDiscussButton({ componentName, getContext })` — Manages discuss dialog state

---

## Interactions

### Parent Communication
- **Mechanism:** prop-callback
- **Description:** Calls parent callbacks for analysis and deletion actions
- **Example:** User clicks "Re-analyze" → `onAnalyze()` → Parent triggers backend analysis job

### Child Communication
- **Child:** WidgetRenderer
- **Mechanism:** props
- **Data Flow:** Passes `layoutDescriptor` to render widget grid

- **Child:** DiscussButton/DiscussDialog
- **Mechanism:** props
- **Data Flow:** Standard discuss button integration

### Sibling Communication
- **Sibling:** DossierList (via parent)
- **Mechanism:** parent-mediated
- **Description:** Deletion callback removes dossier from list

### Context Interaction
- **Context:** DiscussContext
- **Role:** consumer
- **Operations:** Prefills chat input with dossier context

---

## Side Effects

### API Calls
| Endpoint | Method | Trigger | Response Handling |
|----------|--------|---------|-------------------|
| N/A | N/A | N/A | API calls handled by parent |

### WebSocket Events
| Event Type | Trigger | Handler |
|------------|---------|---------|
| N/A | N/A | N/A |

### Timers
| Type | Duration | Purpose | Cleanup |
|------|----------|---------|---------|
| N/A | N/A | N/A | N/A |

### LocalStorage Operations
| Key | Operation | Trigger | Value |
|-----|-----------|---------|-------|
| N/A | N/A | N/A | N/A |

### DOM Manipulation
| Target | Operation | Trigger |
|--------|-----------|---------|
| N/A | N/A | N/A |

### Electron IPC (if applicable)
| Channel | Direction | Purpose |
|---------|-----------|---------|
| N/A | N/A | N/A |

---

## Test Hooks

**CSS Selectors:**
- `.dossier-view`
- `.dossier-view__header`
- `.dossier-view__name`
- `.dossier-view__status-badge`
- `.dossier-view__status-badge--pending`
- `.dossier-view__status-badge--analyzing`
- `.dossier-view__status-badge--completed`
- `.dossier-view__status-badge--failed`
- `.dossier-view__action-btn`
- `.dossier-view__action-btn--primary`
- `.dossier-view__action-btn--danger`
- `.dossier-view__error`
- `.dossier-view__section`
- `.dossier-view__section-header`
- `.dossier-view__targets-list`
- `.dossier-view__context-text`
- `.dossier-view__content`
- `.dossier-view__empty-state`

**Data Test IDs:**
- N/A

**ARIA Labels:**
- N/A (should add aria-expanded to collapsible sections)

**Visual Landmarks:**
1. Header bar (`.dossier-view__header`) — Name, status badge, action buttons
2. Status badge (`.dossier-view__status-badge`) — Color-coded status (pending/analyzing/completed/failed)
3. Action buttons (`.dossier-view__action-btn`) — Re-analyze (primary), Delete (danger)
4. Collapsible sections (`.dossier-view__section`) — Targets and Context with expand icons
5. Empty state (`.dossier-view__empty-state`) — Icon 📊, title, message when no analysis
6. Widget layout (`.dossier-view__content`) — Grid of rendered widgets

---

## Health Checks

### Critical Checks (Must Pass)

#### HC-DV-01: Dossier Metadata Display
- **Type:** render
- **Target:** Header section with name, status, metadata
- **Condition:** Dossier name, status badge, last updated date, analysis count all render correctly
- **Failure Mode:** Missing metadata, incorrect status display
- **Automation Script:**
```javascript
// Chrome MCP script
await navigate_page({ url: 'http://localhost:5173', type: 'url' });
await wait_for({ text: 'Intel', timeout: 5000 });
await click({ uid: '[aria-label="Intel tab button"]' });
await click({ uid: '.dossier-card' }); // Select first dossier
const snapshot = await take_snapshot();
const hasName = snapshot.includes('dossier-view__name');
const hasStatus = snapshot.includes('dossier-view__status-badge');
assert(hasName && hasStatus, 'Dossier name and status should display');
```

#### HC-DV-02: Action Buttons
- **Type:** interaction
- **Target:** Re-analyze and Delete buttons
- **Condition:** Buttons render, disabled during analysis, call callbacks on click
- **Failure Mode:** Buttons don't work, analyzing state not reflected
- **Automation Script:**
```javascript
// Chrome MCP script
await click({ uid: '.dossier-view__action-btn--primary' }); // Re-analyze
// Verify onAnalyze callback triggered (check for analyzing status)
```

#### HC-DV-03: Collapsible Sections
- **Type:** interaction
- **Target:** Targets and Context sections
- **Condition:** Clicking section header toggles content visibility, arrow icon rotates
- **Failure Mode:** Sections don't expand/collapse
- **Automation Script:**
```javascript
// Chrome MCP script
const before = await take_snapshot();
await click({ uid: '.dossier-view__section-header' });
const after = await take_snapshot();
assert(before !== after, 'Section content should toggle');
```

#### HC-DV-04: Empty State vs Widget Layout
- **Type:** render-condition
- **Target:** Empty state or widget renderer
- **Condition:** Shows empty state when `layoutDescriptor === null`, shows widgets otherwise
- **Failure Mode:** Wrong view renders, or nothing renders
- **Automation Script:**
```javascript
// Chrome MCP script
// Select unanalyzed dossier
await click({ uid: '.dossier-card[data-status="pending"]' });
const snapshot = await take_snapshot();
const hasEmpty = snapshot.includes('dossier-view__empty-state');
assert(hasEmpty, 'Empty state should show for unanalyzed dossier');
```

### Warning Checks (Should Pass)

#### HC-DV-05: Error Display
- **Type:** error-feedback
- **Target:** Error message section
- **Condition:** When `dossier.error` is set, shows error message
- **Failure Mode:** Error silently ignored, no user feedback

#### HC-DV-06: Status Badge Styling
- **Type:** visual-feedback
- **Target:** Status badge color coding
- **Condition:** Each status has distinct color: pending (gray), analyzing (blue), completed (green), failed (red)
- **Failure Mode:** Status indistinguishable, confusing UX

### Performance Benchmarks

| Metric | Threshold | Unit | Description |
|--------|-----------|------|-------------|
| render-time | 100 | ms | Time to render dossier view after selection |
| widget-layout-render | 500 | ms | Time to render widget grid (10+ widgets) |
| section-toggle | 50 | ms | Time to expand/collapse section |

---

## Dependencies

**Required Contexts:**
- DiscussContext

**Required Hooks:**
- `useDiscussButton()`

**Child Components:**
- WidgetRenderer (if layoutDescriptor not null)
- DiscussButton
- DiscussDialog

**Required Props:**
- `dossier` (required)
- `onAnalyze` (required)
- `onDelete` (required)

---

## Notes

### Dossier Status Values
- `pending` — Dossier created but not analyzed
- `analyzing` — Analysis in progress (disables buttons)
- `completed` — Analysis complete, widgets available
- `failed` — Analysis failed, error message shown

### Date Formatting
- Format: `MM/DD/YYYY HH:MM:SS` (locale-specific)
- Uses `toLocaleDateString()` + `toLocaleTimeString()`

### Collapsible Sections
- Default state: collapsed (both targets and context)
- Icons: `▶` (collapsed), `▼` (expanded)
- Targets section shows count: `Targets (N)`

### Empty State
- Icon: 📊 (chart emoji)
- Title: "No Analysis Yet"
- Message: "This dossier hasn't been analyzed yet. Click "Re-analyze" to start."
- Actionable guidance for user

### Widget Layout Rendering
- Delegates to WidgetRenderer component
- Passes entire `layoutDescriptor` object
- Supports grid-2col, grid-3col, stack layouts
- Widget types: StatCard, InsightCard, AlertPanel, CodeHealthMeter, FileTree, SnippetPreview, Unknown

---

**Contract Authored:** 2026-02-10
**Last Updated:** 2026-02-10
**Version:** 1.0.0
