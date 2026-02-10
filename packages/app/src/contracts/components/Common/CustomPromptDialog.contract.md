# Component Contract: CustomPromptDialog

**File:** `packages/app/src/components/CustomPromptButton/CustomPromptDialog.tsx`
**Type:** widget
**Parent Group:** Common
**Contract Version:** 1.0.0
**Last Reviewed:** 2026-02-10

---

## Identity

- **Component Name:** CustomPromptDialog
- **Introduced:** 2025-12-01
- **Description:** Modal dialog for creating custom prompt buttons with alias, prompt, icon, context patterns, and alwaysShow checkbox

---

## Render Location

**Mounts Under:**
- RegistryBrowser (when "+ Custom Prompt" clicked)
- Settings panels

**Render Conditions:**
1. Always renders when mounted (no conditional render)
2. Mounted/unmounted by parent based on open state

**Positioning:** fixed (modal overlay)
**Z-Index:** 2000 (backdrop), 2001 (dialog)

---

## Lifecycle

**Mount Triggers:**
- User clicks "+ Custom Prompt" button
- Parent sets showCustomPromptDialog=true

**Key Effects:**
None — Pure form component

**Cleanup Actions:**
None

**Unmount Triggers:**
- User submits form
- User clicks Cancel
- User clicks X close button
- Parent sets showCustomPromptDialog=false

---

## Props Contract

### Inputs
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| onSubmit | (label, prompt, icon?, contextPatterns?, alwaysShow?) => void | ✅ | N/A | Callback when form submitted |
| onCancel | () => void | ✅ | N/A | Callback when user cancels |
| isLoading | boolean | ❌ | false | Whether submission is in progress |

### Callbacks Up (to parent)
| Callback | Signature | Description |
|----------|-----------|-------------|
| onSubmit | `(label: string, prompt: string, icon?: string, contextPatterns?: string[], alwaysShow?: boolean) => void` | User submits valid form |
| onCancel | `() => void` | User cancels dialog |

### Callbacks Down (to children)
N/A — No child components

---

## State Ownership

### Local State
| State | Type | Initial | Updated By |
|-------|------|---------|------------|
| label | string | '' | setLabel (input change) |
| prompt | string | '' | setPrompt (textarea change) |
| icon | string | '' | setIcon (input change) |
| contextPatterns | string | '' | setContextPatterns (textarea change) |
| alwaysShow | boolean | false | setAlwaysShow (checkbox change) |

### Context Consumption
N/A

### Derived State
| Name | Type | Dependencies | Computation |
|------|------|--------------|-------------|
| isValid | boolean | `[label, prompt]` | label.trim().length > 0 && prompt.trim().length > 0 |

### Custom Hooks
None

---

## Interactions

### Parent Communication
- **Mechanism:** prop-callback
- **Description:** Calls onSubmit with form values or onCancel to close
- **Example:** `onSubmit(label.trim(), prompt.trim(), icon.trim() || undefined, patterns.length > 0 ? patterns : undefined, alwaysShow)`

### Child Communication
N/A — No children

### Sibling Communication
N/A

### Context Interaction
N/A

---

## Side Effects

None — Parent handles API calls

---

## Test Hooks

**CSS Selectors:**
- `.custom-prompt-dialog-backdrop`
- `.custom-prompt-dialog`
- `.custom-prompt-dialog-header`
- `.custom-prompt-dialog-body`
- `.close-button`
- `.form-group`
- `.form-label`
- `.text-input`
- `.textarea-input`
- `.context-patterns-input`
- `.checkbox-label`
- `.custom-prompt-dialog-actions`
- `.btn-primary`
- `.btn-secondary`

**Data Test IDs:**
N/A

**ARIA Labels:**
- `aria-label="Close dialog"` on close button
- `htmlFor` on labels (label, prompt, icon, contextPatterns)

**Visual Landmarks:**
1. Header with close button (`.custom-prompt-dialog-header`)
2. Form fields (`.form-group`) — Label, prompt, icon, context patterns, alwaysShow
3. Character counter on prompt field — Shows "X/2000"
4. Action buttons (`.custom-prompt-dialog-actions`) — Create + Cancel

---

## Health Checks

### Critical Checks (Must Pass)

#### HC-CPD-01: Dialog Renders
- **Type:** render
- **Target:** Dialog element
- **Condition:** `.custom-prompt-dialog` exists with form
- **Failure Mode:** Dialog not visible

#### HC-CPD-02: Required Field Validation
- **Type:** validation
- **Target:** Submit button enabled state
- **Condition:** Disabled when label or prompt empty
- **Failure Mode:** Can submit empty form
- **Automation Script:**
```javascript
const submitBtn = await page.$('.btn-primary');
const isDisabled = await submitBtn.evaluate(el => el.disabled);
console.assert(isDisabled === true, 'Submit button should be disabled when fields empty');
```

#### HC-CPD-03: Form Submission
- **Type:** interaction
- **Target:** Submit button
- **Condition:** Clicking valid form calls onSubmit with correct values
- **Failure Mode:** Form values not passed to parent

#### HC-CPD-04: Cancel Actions
- **Type:** interaction
- **Target:** Close button, Cancel button, backdrop (potentially)
- **Condition:** All cancel actions call onCancel
- **Failure Mode:** Dialog persists after cancel

### Warning Checks (Should Pass)

#### HC-CPD-05: Context Patterns Parsing
- **Type:** logic
- **Target:** Context patterns split and filter
- **Condition:** Splits by newline, trims, filters empty lines
- **Failure Mode:** Empty patterns passed to API

#### HC-CPD-06: Character Counter
- **Type:** visual-feedback
- **Target:** Prompt character count display
- **Condition:** Shows current/max (X/2000)
- **Failure Mode:** Counter not updating

### Performance Benchmarks

| Metric | Threshold | Unit | Description |
|--------|-----------|------|-------------|
| dialog-open-time | 100 | ms | Time to render dialog |
| input-response-time | 50 | ms | Time to update character counter |

---

## Dependencies

**Required Contexts:**
None

**Required Hooks:**
None

**Child Components:**
None

**Required Props:**
- `onSubmit`
- `onCancel`

---

## Notes

- Two required fields: label (alias) and prompt (payload)
- Optional fields: icon (emoji/name), contextPatterns (regex, one per line), alwaysShow (checkbox)
- Label max length: 100 characters
- Prompt max length: 2000 characters (shows counter "X/2000")
- Icon max length: 10 characters (typically emoji)
- Context patterns textarea: newline-separated, parsed on submit
- Context patterns split by `\n`, trim, filter empty for submission
- Icon defaults to 💬 if empty (handled by parent/API)
- alwaysShow=true ignores context detection (button always visible)
- Submit button disabled during isLoading or when form invalid
- Close button (X) in header, Cancel button in footer
- Backdrop click does NOT close (intentional UX decision for form safety)

---

**Contract Authored:** 2026-02-10
**Last Updated:** 2026-02-10
**Version:** 1.0.0
