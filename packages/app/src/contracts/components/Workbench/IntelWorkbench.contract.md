# Component Contract: IntelWorkbench

**File:** `packages/app/src/components/Workbench/IntelWorkbench.tsx`
**Type:** page
**Parent Group:** Workbench
**Contract Version:** 1.0.0
**Last Reviewed:** 2026-02-10

---

## Identity

- **Component Name:** IntelWorkbench
- **Introduced:** 2026-02-03
- **Description:** Dossier-based intelligence monitoring and analysis workbench. Features dossier list, creation dialog, and widget-based dossier view.

---

## Render Location

**Mounts Under:**
- WorkbenchLayout (when `activeWorkbench === 'intel'`)

**Render Conditions:**
1. User selects "Intel" tab in TopBar

**Positioning:** relative
**Z-Index:** N/A

---

## Lifecycle

**Mount Triggers:**
- User navigates to Intel workbench

**Key Effects:**
None

**Cleanup Actions:**
None

**Unmount Triggers:**
- User switches workbenches

---

## Props Contract

### Inputs
None - Data managed via hook

### Callbacks Up (to parent)
None

### Callbacks Down (to children)
| Callback | Signature | Passed To | Description |
|----------|-----------|-----------|-------------|
| onSelect | `(dossierId) => void` | DossierList | Selects dossier |
| onAnalyze | `() => void` | DossierView | Triggers analysis |
| onDelete | `() => void` | DossierView | Deletes dossier |
| onSubmit | `(name, targets, context) => Promise<void>` | DossierCreationDialog | Creates dossier |

---

## State Ownership

### Local State
| State | Type | Initial | Updated By |
|-------|------|---------|------------|
| selectedDossierId | `DossierId \| null` | `null` | handleDossierSelect |
| showCreateDialog | `boolean` | `false` | setShowCreateDialog |

### Context Consumption
| Context | Values Used |
|---------|-------------|
| DiscussContext | `prefillChatInput()` |

### Derived State
| Name | Type | Dependencies | Computation |
|------|------|--------------|-------------|
| selectedDossier | `IntelDossier \| null` | `[dossiers, selectedDossierId]` | Finds dossier by ID |

### Custom Hooks
- `useDossiers()` — Fetches dossiers, provides createDossier/deleteDossier/triggerAnalysis functions
- `useDiscussButton()` — Manages DiscussButton dialog

---

## Interactions

### Parent Communication
N/A

### Child Communication
- **Child:** DossierList
- **Mechanism:** props
- **Data Flow:** Passes dossiers array, selectedId, onSelect callback
- **Child:** DossierView
- **Mechanism:** props
- **Data Flow:** Passes selectedDossier, onAnalyze, onDelete callbacks
- **Child:** DossierCreationDialog
- **Mechanism:** props
- **Data Flow:** Passes onSubmit, onClose callbacks

### Sibling Communication
N/A

### Context Interaction
- **Context:** DiscussContext
- **Role:** consumer
- **Operations:** Opens discuss dialog with dossier context

---

## Side Effects

### API Calls
| Endpoint | Method | Trigger | Response Handling |
|----------|--------|---------|-------------------|
| `/api/dossiers` | GET | Mount, refresh | Updates dossiers list via hook |
| `/api/dossiers` | POST | Create dossier | Adds new dossier to list |
| `/api/dossiers/:id` | DELETE | Delete button | Removes dossier from list |
| `/api/dossiers/:id/analyze` | POST | Analyze button | Triggers analysis |

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
- `.intel-workbench`
- `.intel-workbench__new-btn`
- `.intel-workbench__sidebar`
- `.intel-workbench__main`
- `.intel-workbench__empty`
- `.dossier-list`
- `.dossier-list-item`
- `.dossier-view`

**Data Test IDs:**
N/A

**ARIA Labels:**
N/A

**Visual Landmarks:**
1. Header with "+ New Dossier" button (`.intel-workbench__header`)
2. Dossier list sidebar (`.intel-workbench__sidebar`) — Scrollable list
3. Dossier view main area (`.intel-workbench__main`) — Selected dossier or empty state
4. Creation dialog (modal) — Appears when "+ New Dossier" clicked

---

## Health Checks

### Critical Checks (Must Pass)

#### HC-IW-001: Dossiers Load
- **Type:** api-call
- **Target:** GET `/api/dossiers`
- **Condition:** Dossiers loaded within 5s
- **Failure Mode:** No dossiers visible
- **Automation Script:**
```javascript
const startTime = Date.now();
const checkLoad = async () => {
  const list = document.querySelector('.dossier-list');
  return list !== null && (Date.now() - startTime) < 5000;
};
return await checkLoad();
```

#### HC-IW-002: Dossier Selection Works
- **Type:** user-action
- **Target:** Dossier list items
- **Condition:** Clicking item selects dossier
- **Failure Mode:** Can't view dossiers
- **Automation Script:**
```javascript
const firstItem = document.querySelector('.dossier-list-item');
firstItem.click();
await new Promise(resolve => setTimeout(resolve, 100));
const dossierView = document.querySelector('.dossier-view');
return dossierView !== null;
```

#### HC-IW-003: Dossier Creation Works
- **Type:** api-call
- **Target:** POST `/api/dossiers`
- **Condition:** Creating dossier adds to list
- **Failure Mode:** Can't create dossiers
- **Automation Script:**
```javascript
const newBtn = document.querySelector('.intel-workbench__new-btn');
newBtn.click();
await new Promise(resolve => setTimeout(resolve, 100));
const dialog = document.querySelector('.dossier-creation-dialog');
return dialog !== null;
```

#### HC-IW-004: Empty State Displays
- **Type:** conditional-render
- **Target:** Empty state message
- **Condition:** Shows when no dossier selected
- **Failure Mode:** Blank screen
- **Automation Script:**
```javascript
// Ensure no dossier selected
const emptyState = document.querySelector('.intel-workbench__empty');
return emptyState !== null && emptyState.textContent.includes('No Dossier Selected');
```

### Warning Checks (Should Pass)

#### HC-IW-005: Analyze Button Works
- **Type:** user-action
- **Target:** Analyze button in DossierView
- **Condition:** Button triggers analysis
- **Failure Mode:** Can't run analysis

#### HC-IW-006: Delete Dossier Works
- **Type:** user-action
- **Target:** Delete button in DossierView
- **Condition:** Button deletes dossier
- **Failure Mode:** Can't remove dossiers

---

## Dependencies

**Required Contexts:**
- DiscussContext

**Required Hooks:**
- useDossiers
- useDiscussButton

**Child Components:**
- DossierList (from `../IntelDossier`)
- DossierView (from `../IntelDossier`)
- DossierCreationDialog (from `../IntelDossier`)
- DiscussButton
- DiscussDialog

**Required Props:**
None

---

## Notes

- Dossiers represent intelligence targets for monitoring
- DossierView uses widget-based layout rendering system
- Creation dialog requires: name, targets (array), context (string)
- useDossiers hook manages all CRUD operations
- Empty state shows: "Select a dossier from the list or create a new one to get started."

---

**Contract Authored:** 2026-02-10
**Last Updated:** 2026-02-10
**Version:** 1.0.0
