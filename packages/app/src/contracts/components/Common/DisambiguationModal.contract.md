# Component Contract: DisambiguationModal

**File:** `packages/app/src/components/DisambiguationModal/DisambiguationModal.tsx`
**Type:** widget
**Parent Group:** Common
**Contract Version:** 1.0.0
**Last Reviewed:** 2026-02-10

---

## Identity

- **Component Name:** DisambiguationModal
- **Introduced:** 2025-12-15
- **Description:** Modal for selecting between multiple matching workbench contexts when user request is ambiguous

---

## Render Location

**Mounts Under:**
- Context router
- Navigation disambiguation flows

**Render Conditions:**
1. Returns null when `isOpen === false`
2. Renders modal when `isOpen === true`

**Positioning:** fixed (modal overlay)
**Z-Index:** 2000 (backdrop), 2001 (modal)

---

## Lifecycle

**Mount Triggers:**
- Context router detects ambiguous request
- Multiple workbench contexts match user input

**Key Effects:**
None — Pure presentation component

**Cleanup Actions:**
None

**Unmount Triggers:**
- User selects a context
- User clicks Cancel
- User clicks backdrop

---

## Props Contract

### Inputs
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| isOpen | boolean | ✅ | N/A | Whether modal is visible |
| request | DisambiguationRequest | ✅ | N/A | Request data with originalRequest and possibleContexts |
| onSelect | (context: WorkbenchId) => void | ✅ | N/A | Callback when user selects context |
| onCancel | () => void | ✅ | N/A | Callback when user cancels |

### Callbacks Up (to parent)
| Callback | Signature | Description |
|----------|-----------|-------------|
| onSelect | `(context: WorkbenchId) => void` | User selects a context option |
| onCancel | `() => void` | User cancels selection |

### Callbacks Down (to children)
N/A — No child components

---

## State Ownership

### Local State
N/A — Stateless

### Context Consumption
N/A

### Derived State
| Name | Type | Dependencies | Computation |
|------|------|--------------|-------------|
| config | WorkbenchConfig | `[option.context]` | DEFAULT_WORKBENCH_CONFIGS[option.context] |
| confidencePercent | number | `[option.score]` | Math.round(option.score * 100) |

### Custom Hooks
None

---

## Interactions

### Parent Communication
- **Mechanism:** prop-callback
- **Description:** Calls onSelect(contextId) or onCancel() based on user action
- **Example:** `onSelect(option.context)` when user clicks context option button

### Child Communication
N/A — No children

### Sibling Communication
N/A

### Context Interaction
N/A

---

## Side Effects

None — Pure presentation component

---

## Test Hooks

**CSS Selectors:**
- `.disambiguation-modal-backdrop`
- `.disambiguation-modal`
- `.disambiguation-modal-header`
- `.disambiguation-modal-body`
- `.disambiguation-request`
- `.request-text`
- `.context-options`
- `.context-option`
- `.context-icon`
- `.context-details`
- `.context-name`
- `.context-confidence`
- `.context-purpose`
- `.confidence-bar-container`
- `.confidence-bar`
- `.btn-cancel`

**Data Test IDs:**
N/A

**ARIA Labels:**
N/A — All buttons use text labels

**Visual Landmarks:**
1. Request display (`.request-text`) — Shows original user request
2. Context option cards (`.context-option`) — Clickable cards for each context
3. Confidence bars (`.confidence-bar`) — Visual indicator of match score
4. Cancel button (`.btn-cancel`) — Bottom of modal

---

## Health Checks

### Critical Checks (Must Pass)

#### HC-DM-01: Modal Renders When Open
- **Type:** conditional-render
- **Target:** Modal element
- **Condition:** Renders when isOpen=true, returns null when isOpen=false
- **Failure Mode:** Modal visible when closed or invisible when open

#### HC-DM-02: Context Options Render
- **Type:** render
- **Target:** Context option buttons
- **Condition:** One button per possibleContexts entry
- **Failure Mode:** Options not displayed
- **Automation Script:**
```javascript
const options = await page.$$('.context-option');
console.assert(options.length > 0, 'No context options rendered');
```

#### HC-DM-03: Context Selection
- **Type:** interaction
- **Target:** Context option button
- **Condition:** Clicking option calls onSelect with correct context ID
- **Failure Mode:** Selection not triggered or wrong context passed

#### HC-DM-04: Backdrop Click to Cancel
- **Type:** interaction
- **Target:** Backdrop overlay
- **Condition:** Clicking backdrop calls onCancel
- **Failure Mode:** Modal persists after backdrop click

### Warning Checks (Should Pass)

#### HC-DM-05: Confidence Bar Width
- **Type:** visual-consistency
- **Target:** Confidence bar width
- **Condition:** Width matches confidence percentage
- **Failure Mode:** Incorrect visual representation

### Performance Benchmarks

| Metric | Threshold | Unit | Description |
|--------|-----------|------|-------------|
| modal-open-time | 100 | ms | Time to render modal |

---

## Dependencies

**Required Contexts:**
None

**Required Hooks:**
None

**Child Components:**
None

**Required Props:**
- `isOpen`
- `request`
- `onSelect`
- `onCancel`

---

## Notes

- Returns null early when isOpen=false (conditional render)
- Backdrop click event checks `e.target === e.currentTarget` to prevent child clicks from closing
- Context option includes: icon, name, confidence percentage, purpose description, confidence bar
- DEFAULT_WORKBENCH_CONFIGS provides icon, label, tooltip for each workbench
- Confidence score displayed as percentage (0-100)
- Confidence bar width set via inline style (percentage)
- Modal has fixed positioning with backdrop overlay
- Cancel button only action in footer (no Confirm button needed)

---

**Contract Authored:** 2026-02-10
**Last Updated:** 2026-02-10
**Version:** 1.0.0
