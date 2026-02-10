# Component Contract: HarmonyBadge

**File:** `packages/app/src/components/HarmonyBadge/HarmonyBadge.tsx`
**Type:** widget
**Parent Group:** Common
**Contract Version:** 1.0.0
**Last Reviewed:** 2026-02-10

---

## Identity

- **Component Name:** HarmonyBadge
- **Introduced:** 2025-11-15
- **Description:** Displays harmony percentage with color-coded status (green ≥90%, yellow 70-89%, orange 50-69%, red <50%)

---

## Render Location

**Mounts Under:**
- HarmonyWorkbench dashboard
- Session headers
- Contract drift reports

**Render Conditions:**
1. Always renders when passed percentage prop

**Positioning:** inline-flex
**Z-Index:** N/A

---

## Lifecycle

**Mount Triggers:**
- Parent renders with harmony percentage

**Key Effects:**
None — Pure presentation component

**Cleanup Actions:**
None

**Unmount Triggers:**
- Parent unmounts

---

## Props Contract

### Inputs
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| percentage | number | ✅ | N/A | Harmony percentage (0-100) |
| showLabel | boolean | ❌ | false | Whether to show text label (In Harmony / Degraded / etc.) |
| size | 'small' \| 'medium' \| 'large' | ❌ | 'medium' | Badge size variant |
| onClick | () => void | ❌ | undefined | Optional click handler |
| className | string | ❌ | '' | Additional CSS classes |

### Callbacks Up (to parent)
| Callback | Signature | Description |
|----------|-----------|-------------|
| onClick | `() => void` | Called when badge is clicked |

### Callbacks Down (to children)
N/A

---

## State Ownership

### Local State
N/A — Stateless

### Context Consumption
N/A

### Derived State
| Name | Type | Dependencies | Computation |
|------|------|--------------|-------------|
| color | string | `[percentage]` | useHarmonyStatus(percentage).color → green/yellow/orange/red |
| label | string | `[percentage]` | useHarmonyStatus(percentage).label → In Harmony/Degraded/etc |
| classes | string | `[size, color, className]` | Concatenates CSS classes |

### Custom Hooks
- `useHarmonyStatus(percentage)` — Returns {color, label} based on thresholds

---

## Interactions

### Parent Communication
- **Mechanism:** prop-callback
- **Description:** Calls onClick if provided
- **Example:** `onClick={() => showHarmonyDetails()}`

### Child Communication
N/A

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
- `.harmony-badge`
- `.harmony-badge--small`
- `.harmony-badge--medium`
- `.harmony-badge--large`
- `.harmony-badge--green`
- `.harmony-badge--yellow`
- `.harmony-badge--orange`
- `.harmony-badge--red`
- `.harmony-badge__icon`
- `.harmony-badge__percentage`
- `.harmony-badge__label`

**Data Test IDs:**
N/A

**ARIA Labels:**
N/A — Uses title attribute

**Visual Landmarks:**
1. Icon (`.harmony-badge__icon`) — ✓ (green), ⚠ (yellow/orange), ✗ (red)
2. Percentage display (`.harmony-badge__percentage`) — Shows N%
3. Optional label (`.harmony-badge__label`) — Text status label

---

## Health Checks

### Critical Checks (Must Pass)

#### HC-HB-01: Badge Renders with Color
- **Type:** render
- **Target:** Badge with correct color class
- **Condition:** Color class matches percentage threshold
- **Failure Mode:** Wrong color for percentage
- **Automation Script:**
```javascript
// Chrome MCP script
const badge = await page.$('.harmony-badge');
const percentage = await badge.$eval('.harmony-badge__percentage', el =>
  parseInt(el.textContent)
);
const isGreen = await badge.$('.harmony-badge--green');
if (percentage >= 90) {
  console.assert(isGreen !== null, 'Badge should be green for ≥90%');
}
```

#### HC-HB-02: Correct Icon for Status
- **Type:** conditional-render
- **Target:** Icon character
- **Condition:** ✓ for green, ⚠ for yellow/orange, ✗ for red
- **Failure Mode:** Wrong icon displayed
- **Automation Script:**
```javascript
// Chrome MCP script
const icon = await page.$eval('.harmony-badge__icon', el => el.textContent);
const isGreen = await page.$('.harmony-badge--green');
if (isGreen) {
  console.assert(icon === '✓', 'Icon should be ✓ for green status');
}
```

### Warning Checks (Should Pass)

#### HC-HB-03: Label Visibility
- **Type:** conditional-render
- **Target:** `.harmony-badge__label`
- **Condition:** Only visible when showLabel={true}
- **Failure Mode:** Label always shown or never shown

### Performance Benchmarks

| Metric | Threshold | Unit | Description |
|--------|-----------|------|-------------|
| render-time | 5 | ms | Time to paint badge (micro-component) |

---

## Dependencies

**Required Contexts:**
None

**Required Hooks:**
- `useHarmonyStatus(percentage)` — Maps percentage to color/label

**Child Components:**
None

**Required Props:**
- `percentage`

---

## Notes

- Color thresholds: green ≥90%, yellow 70-89%, orange 50-69%, red <50%
- Label text: "In Harmony", "Degraded", "Needs Attention", "Critical"
- Icon is purely decorative (aria-hidden not set, but could be added)
- Percentage displayed without decimals (N%)
- Tooltip shows full status: "Harmony: X.X% (Label)"
- onClick adds role="button" and tabIndex={0} for accessibility
- Size variants control badge dimensions via CSS classes

---

**Contract Authored:** 2026-02-10
**Last Updated:** 2026-02-10
**Version:** 1.0.0
