# Component Contract: DossierList

**File:** `packages/app/src/components/IntelDossier/DossierList.tsx`
**Type:** feature
**Parent Group:** IntelDossier
**Contract Version:** 1.0.0
**Last Reviewed:** 2026-02-10

---

## Identity

- **Component Name:** DossierList
- **Introduced:** 2024-Q4 (estimated)
- **Description:** Vertical list of dossier cards for Intel workbench sidebar. Renders DossierCard components with selection state and empty state handling.

---

## Render Location

**Mounts Under:**
- IntelWorkbench (sidebar/left panel)

**Render Conditions:**
1. Always renders (shows empty state when no dossiers)

**Positioning:** relative (fills sidebar area)
**Z-Index:** N/A

---

## Lifecycle

**Mount Triggers:**
- IntelWorkbench mounts

**Key Effects:**
- None (purely presentational)

**Cleanup Actions:**
- None

**Unmount Triggers:**
- IntelWorkbench unmounts

---

## Props Contract

### Inputs
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| dossiers | `IntelDossier[]` | ✅ | N/A | List of dossiers to display |
| selectedId | `string \| null` | ✅ | N/A | Currently selected dossier ID |
| onSelect | `(dossierId: string) => void` | ✅ | N/A | Callback when dossier is selected |

### Callbacks Up (to parent)
| Callback | Signature | Description |
|----------|-----------|-------------|
| onSelect | `(dossierId: string) => void` | Called when user clicks a dossier card |

### Callbacks Down (to children)
| Callback | Signature | Passed To | Description |
|----------|-----------|-----------|-------------|
| onClick | `() => void` | DossierCard | Triggers selection for this dossier |

---

## State Ownership

### Local State
| State | Type | Initial | Updated By |
|-------|------|---------|------------|
| N/A | N/A | N/A | Stateless (selection managed by parent) |

### Context Consumption
| Context | Values Used |
|---------|-------------|
| DiscussContext | `registerChatInput`, `prefillChatInput` (via useDiscussButton) |

### Derived State
| Name | Type | Dependencies | Computation |
|------|------|--------------|-------------|
| N/A | N/A | N/A | N/A |

### Custom Hooks
- `useDiscussButton({ componentName, getContext })` — Manages discuss dialog

---

## Interactions

### Parent Communication
- **Mechanism:** prop-callback
- **Description:** Calls `onSelect(dossierId)` when card is clicked
- **Example:** User clicks card → `onSelect('dossier-123')` → Parent updates selectedId

### Child Communication
- **Child:** DossierCard
- **Mechanism:** props
- **Data Flow:** Passes `dossier`, `isSelected`, `onClick` to each card

### Sibling Communication
- **Sibling:** DossierView (via parent)
- **Mechanism:** parent-mediated
- **Description:** Selection updates DossierView content

---

## Side Effects

None (purely presentational)

---

## Test Hooks

**CSS Selectors:**
- `.dossier-list`
- `.dossier-list--empty`
- `.dossier-list__header`
- `.dossier-list__title`
- `.dossier-list__count`
- `.dossier-list__items`
- `.dossier-list__empty-state`
- `.dossier-list__empty-message`
- `.dossier-list__empty-hint`

**ARIA Labels:**
- N/A (should add aria-label="Dossier list")

---

## Health Checks

### Critical Checks

#### HC-DL-01: List Rendering
- **Type:** render
- **Target:** DossierCard components
- **Condition:** Each dossier renders a DossierCard
- **Failure Mode:** Cards don't render
- **Automation Script:**
```javascript
const snapshot = await take_snapshot();
const cardCount = (snapshot.match(/dossier-card/g) || []).length;
assert(cardCount === dossiers.length, 'All dossiers should render as cards');
```

#### HC-DL-02: Empty State
- **Type:** render-condition
- **Target:** Empty state message
- **Condition:** Shows "No dossiers yet" when list is empty
- **Failure Mode:** Blank screen, no guidance
- **Automation Script:**
```javascript
// Navigate to Intel workbench with no dossiers
const snapshot = await take_snapshot();
assert(snapshot.includes('No dossiers yet'), 'Empty state should show');
```

---

## Dependencies

- DossierCard (child)
- DiscussButton
- DiscussDialog

**Required Props:**
- All props are required

---

**Contract Authored:** 2026-02-10
**Version:** 1.0.0
