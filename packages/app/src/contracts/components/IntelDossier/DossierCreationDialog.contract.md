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
