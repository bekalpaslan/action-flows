# Component Contract: DiscussButton

**File:** `packages/app/src/components/DiscussButton/DiscussButton.tsx`
**Type:** utility
**Parent Group:** Discussion System
**Contract Version:** 1.0.0
**Last Reviewed:** 2026-02-10

---

## Identity

- **Component Name:** DiscussButton
- **Introduced:** 2025-Q4
- **Description:** Compact button for opening discussion dialogs, appears in 41+ components across the app, supports medium (with label) and small (icon-only) sizes.

---

## Render Location

**Mounts Under:**
- 41+ components across the app (WorkbenchLayout, FileExplorer, Terminal components, etc.)

**Render Conditions:**
1. Parent component renders it

**Positioning:** inline (button element)
**Z-Index:** N/A

---

## Lifecycle

**Mount Triggers:**
- Parent component renders

**Key Effects:**
None (stateless button)

**Cleanup Actions:**
None

**Unmount Triggers:**
- Parent unmounts

---

## Props Contract

### Inputs
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| componentName | string | ✅ | N/A | Name of component this button refers to |
| onClick | () => void | ✅ | N/A | Callback when clicked |
| disabled | boolean | ❌ | false | Whether button is disabled |
| size | 'small'\|'medium' | ❌ | 'medium' | Size variant (medium shows label, small icon-only) |
| className | string | ❌ | '' | Additional CSS classes |

### Callbacks Up (to parent)
| Callback | Signature | Description |
|----------|-----------|-------------|
| onClick | `() => void` | Called when button is clicked |

### Callbacks Down (to children)
None (no children)

---

## State Ownership

### Local State
None (stateless component)

### Context Consumption
None

### Derived State
| Name | Type | Dependencies | Computation |
|------|------|--------------|-------------|
| buttonClasses | string | `[size, disabled, className]` | Combines CSS classes based on props |

### Custom Hooks
None

---

## Interactions

### Parent Communication
- **Mechanism:** prop-callback
- **Description:** Calls onClick when button is pressed
- **Example:** Parent opens DiscussDialog on click

### Child Communication
None (leaf component)

### Sibling Communication
None

### Context Interaction
None

---

## Side Effects

### API Calls
None

### WebSocket Events
None

### Timers
None

### LocalStorage Operations
None

### DOM Manipulation
None

### Electron IPC
None

---

## Test Hooks

**CSS Selectors:**
- `.discuss-button`
- `.discuss-button--small`
- `.discuss-button--medium`
- `.discuss-button--disabled`
- `.discuss-button__icon`
- `.discuss-button__label`

**Data Test IDs:**
None

**ARIA Labels:**
- `aria-label="Discuss {componentName}"`
- `title` attribute for small size (tooltip)
- `aria-hidden="true"` on SVG icon

**Visual Landmarks:**
1. Speech bubble icon (SVG, 14x14px)
2. "Let's Discuss" label (medium size only)

---

## Health Checks

### Critical Checks (Must Pass)

#### HC-DB-001: Button Render
- **Type:** render
- **Target:** DiscussButton elements
- **Condition:** `.discuss-button` exists in parent components
- **Failure Mode:** No way to open discuss dialogs
- **Automation Script:**
```javascript
const buttons = document.querySelectorAll('.discuss-button');
if (buttons.length === 0) throw new Error('No discuss buttons found');
return true;
```

#### HC-DB-002: Icon Render
- **Type:** render
- **Target:** SVG icon
- **Condition:** `.discuss-button__icon` exists in button
- **Failure Mode:** Button appears empty
- **Automation Script:**
```javascript
const firstButton = document.querySelector('.discuss-button');
const hasIcon = firstButton.querySelector('.discuss-button__icon');
if (!hasIcon) throw new Error('Button missing icon');
return true;
```

### Warning Checks (Should Pass)

#### HC-DB-003: Dialog Opens
- **Type:** interaction
- **Target:** onClick callback
- **Condition:** Dialog appears after click
- **Failure Mode:** Button click has no effect
- **Automation Script:**
```javascript
const firstButton = document.querySelector('.discuss-button');
firstButton.click();
await new Promise(r => setTimeout(r, 300));
const dialog = document.querySelector('.discuss-dialog');
return { dialogOpened: !!dialog };
```

### Performance Benchmarks

| Metric | Threshold | Unit | Description |
|--------|-----------|------|-------------|
| render-time | 10 | ms | Time to render button |

---

## Dependencies

**Required Contexts:**
None

**Required Hooks:**
None

**Child Components:**
None

**Required Props:**
- componentName
- onClick

---

## Notes

- Pure presentational component with no internal state
- SVG speech bubble icon is inline (no external assets)
- Size variants: medium (full button with label), small (icon-only)
- Used in 41+ components across the app for consistent discussion access
- Parent component is responsible for dialog state management

---

**Contract Authored:** 2026-02-10
**Last Updated:** 2026-02-10
**Version:** 1.0.0
