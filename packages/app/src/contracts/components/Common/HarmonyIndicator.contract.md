# Component Contract: HarmonyIndicator

**File:** `packages/app/src/components/HarmonyIndicator/HarmonyIndicator.tsx`
**Type:** widget
**Parent Group:** Common
**Contract Version:** 1.0.0
**Last Reviewed:** 2026-02-10

---

## Identity

- **Component Name:** HarmonyIndicator
- **Introduced:** 2025-11-15
- **Description:** Small inline indicator showing harmony check status with icon (✓ valid, ⚠ degraded, ✗ violation) and DiscussButton

---

## Render Location

**Mounts Under:**
- Session headers
- Step nodes
- Output parsing status displays

**Render Conditions:**
1. Always renders when status prop provided

**Positioning:** inline-flex
**Z-Index:** N/A

---

## Lifecycle

**Mount Triggers:**
- Parent renders with harmony status

**Key Effects:**
None — Pure presentation component with discuss integration

**Cleanup Actions:**
None

**Unmount Triggers:**
- Parent unmounts

---

## Props Contract

### Inputs
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| status | 'valid' \| 'degraded' \| 'violation' | ✅ | N/A | Harmony check status |
| tooltip | string | ❌ | undefined | Custom tooltip text (falls back to default) |
| className | string | ❌ | '' | Additional CSS classes |

### Callbacks Up (to parent)
N/A — No callbacks

### Callbacks Down (to children)
| Callback | Signature | Passed To | Description |
|----------|-----------|-----------|-------------|
| handleSend | `(message: string) => void` | DiscussDialog | Sends discuss message |

---

## State Ownership

### Local State
N/A — All state managed by useDiscussButton hook

### Context Consumption
| Context | Values Used |
|---------|-------------|
| DiscussContext | via useDiscussButton hook |

### Derived State
| Name | Type | Dependencies | Computation |
|------|------|--------------|-------------|
| title | string | `[status, tooltip]` | Uses tooltip or falls back to default text for status |
| classes | string | `[status, className]` | Concatenates CSS classes |

### Custom Hooks
- `useDiscussButton({ componentName, getContext })` — DiscussButton integration

---

## Interactions

### Parent Communication
N/A — No callbacks to parent

### Child Communication
- **Child:** DiscussButton
- **Mechanism:** props
- **Data Flow:** Passes componentName, onClick

- **Child:** DiscussDialog
- **Mechanism:** props
- **Data Flow:** Passes isOpen, componentName, componentContext, onSend, onClose

### Sibling Communication
N/A

### Context Interaction
- **Context:** DiscussContext
- **Role:** consumer (via hook)
- **Operations:** Opens discuss dialog, sends formatted messages

---

## Side Effects

None — Pure presentation component

---

## Test Hooks

**CSS Selectors:**
- `.harmony-indicator`
- `.harmony-indicator--valid`
- `.harmony-indicator--degraded`
- `.harmony-indicator--violation`
- `.harmony-indicator__icon`

**Data Test IDs:**
N/A

**ARIA Labels:**
N/A — Uses title attribute

**Visual Landmarks:**
1. Icon (`.harmony-indicator__icon`) — ✓ (valid), ⚠ (degraded), ✗ (violation)
2. DiscussButton — Small button next to icon

---

## Health Checks

### Critical Checks (Must Pass)

#### HC-HI-01: Indicator Renders
- **Type:** render
- **Target:** Indicator element with status class
- **Condition:** `.harmony-indicator--{status}` exists
- **Failure Mode:** Indicator not visible
- **Automation Script:**
```javascript
// Chrome MCP script
const indicator = await page.$('.harmony-indicator');
console.assert(indicator !== null, 'Harmony indicator not rendered');
const hasStatusClass = await indicator.evaluate(el =>
  el.classList.contains('harmony-indicator--valid') ||
  el.classList.contains('harmony-indicator--degraded') ||
  el.classList.contains('harmony-indicator--violation')
);
console.assert(hasStatusClass, 'No status class applied');
```

#### HC-HI-02: Correct Icon for Status
- **Type:** conditional-render
- **Target:** Icon character
- **Condition:** ✓ for valid, ⚠ for degraded, ✗ for violation
- **Failure Mode:** Wrong icon displayed
- **Automation Script:**
```javascript
// Chrome MCP script
const icon = await page.$eval('.harmony-indicator__icon', el => el.textContent);
const isValid = await page.$('.harmony-indicator--valid');
if (isValid) {
  console.assert(icon === '✓', 'Icon should be ✓ for valid status');
}
```

### Warning Checks (Should Pass)

#### HC-HI-03: DiscussButton Present
- **Type:** render
- **Target:** DiscussButton component
- **Condition:** Button renders next to icon
- **Failure Mode:** DiscussButton missing

### Performance Benchmarks

| Metric | Threshold | Unit | Description |
|--------|-----------|------|-------------|
| render-time | 5 | ms | Time to paint indicator (micro-component) |

---

## Dependencies

**Required Contexts:**
- DiscussContext (via hook)

**Required Hooks:**
- `useDiscussButton()`

**Child Components:**
- DiscussButton
- DiscussDialog

**Required Props:**
- `status`

---

## Notes

- Default tooltips: "Valid harmony - output parsed successfully", "Degraded harmony - partial parse", "Harmony violation - output failed to parse"
- DiscussButton integration allows user to ask questions about harmony status
- Component context includes status and tooltip for discuss messages
- Icon colors: green (valid), yellow (degraded), red (violation)
- Small widget meant for inline use in headers and status bars

---

**Contract Authored:** 2026-02-10
**Last Updated:** 2026-02-10
**Version:** 1.0.0
