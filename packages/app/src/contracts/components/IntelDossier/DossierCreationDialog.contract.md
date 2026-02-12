# Component Contract: DossierCreationDialog

**File:** `packages/app/src/components/IntelDossier/DossierCreationDialog.tsx`
**Type:** widget
**Parent Group:** IntelDossier
**Contract Version:** 1.0.0
**Last Reviewed:** 2026-02-10

---

## Identity

- **Component Name:** DossierCreationDialog
- **Introduced:** 2024-Q4
- **Description:** Modal dialog for creating Intel Dossiers with name, multi-input target paths, and optional context textarea.

---

## Render Location

Renders as a fixed-position modal overlay above the main DossierView or DossierList component. Backdrop covers full viewport; dialog centered. Positioned via CSS (dossier-creation-dialog-backdrop, dossier-creation-dialog).

---

## Lifecycle

Uses React hooks: `useState` for form state (name, targets, context) and `useCallback` for event handlers (handleSubmit, handleAddTarget, handleRemoveTarget, handleTargetChange). No side effects on mount/unmount — form state initialized via default values. Handlers prevent re-creation on each render.

---

## Props Contract

### Inputs
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| onSubmit | `(name, targets[], context) => void` | ✅ | N/A | Callback when form submitted with valid data |
| onClose | `() => void` | ✅ | N/A | Callback to close dialog |
| isLoading | `boolean` | ❌ | `false` | Disables form during submission |

---

## State Ownership

### Local State
| State | Type | Initial | Updated By |
|-------|------|---------|------------|
| name | `string` | `''` | Input onChange |
| targets | `string[]` | `['']` | handleAddTarget, handleRemoveTarget, handleTargetChange |
| context | `string` | `''` | Textarea onChange |

---

## Interactions

### Parent Communication
- **Mechanism:** prop-callback
- **Description:** Calls `onSubmit(name, targets, context)` when form is submitted; calls `onClose()` when dialog closes
- **Example:** User enters name and targets, clicks submit → `onSubmit(name, targets[], context)` → Parent creates dossier

### Child Communication
- **Child:** none
- **Mechanism:** none
- **Description:** Dialog contains only form inputs, no child components

### Sibling Communication
- **Sibling:** DossierList, DossierView
- **Mechanism:** parent-mediated
- **Description:** After submission, parent updates dossier list which updates siblings

### Context Interaction
- **Context:** none
- **Role:** none
- **Operations:** none

---

## Side Effects

None — form is controlled entirely via props and local state.

---

## Test Hooks

**CSS Classes:**
- `.dossier-creation-dialog`
- `.dossier-creation-dialog-backdrop`
- `.dossier-creation-dialog-header`
- `.dossier-creation-dialog-body`
- `.text-input`
- `.target-input`
- `.target-input-row`
- `.btn-add-target`
- `.btn-remove-target`
- `.textarea-input`
- `.close-button`

**ARIA:**
- `aria-label="Close dialog"`

---

## Health Checks

#### HC-DCD-01: Form Validation
- **Type:** validation
- **Target:** Submit button enable/disable
- **Condition:** Button disabled unless name filled and at least one non-empty target
- **Failure Mode:** Can submit invalid form
- **Automation Script:**
```javascript
await click({ uid: '.dossier-creation-dialog button[type="submit"]' });
// Should not submit if name empty
```

---

**Contract Authored:** 2026-02-10
**Version:** 1.0.0
