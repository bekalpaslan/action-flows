# Component Contract: GlowIndicator

**File:** `packages/app/src/components/common/GlowIndicator.tsx`
**Type:** widget
**Parent Group:** Common
**Contract Version:** 1.0.0
**Last Reviewed:** 2026-02-10

---

## Identity

- **Component Name:** GlowIndicator
- **Introduced:** 2025-09-15
- **Description:** Animated glow wrapper for notifications and status indicators with configurable pulse effect

---

## Render Location

**Mounts Under:**
- Any component needing notification glow effect
- Workbench tabs (notification badges)
- Session sidebar items

**Render Conditions:**
1. Always renders children (glow is conditional via CSS)

**Positioning:** inline (inherits from children)
**Z-Index:** N/A

---

## Lifecycle

**Mount Triggers:**
- Parent renders with glow indicator

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
| active | boolean | ✅ | N/A | Whether glow effect is active |
| level | 'info' \| 'success' \| 'warning' \| 'error' | ✅ | N/A | Glow color level |
| intensity | number | ❌ | 1 | Glow intensity (0-1) |
| pulse | boolean | ❌ | true | Whether to animate with pulse effect |
| children | ReactNode | ✅ | N/A | Content to wrap with glow |
| className | string | ❌ | '' | Additional CSS classes |

### Callbacks Up (to parent)
N/A

### Callbacks Down (to children)
N/A — Children rendered as-is

---

## State Ownership

### Local State
N/A — Stateless

### Context Consumption
N/A

### Derived State
| Name | Type | Dependencies | Computation |
|------|------|--------------|-------------|
| clampedIntensity | number | `[intensity]` | Math.max(0, Math.min(1, intensity)) |
| classes | string | `[active, level, pulse, className]` | Concatenates CSS classes conditionally |

### Custom Hooks
None

---

## Interactions

### Parent Communication
N/A — No callbacks

### Child Communication
- **Child:** Any ReactNode
- **Mechanism:** render prop (children)
- **Data Flow:** Children rendered unchanged, glow applied via wrapper CSS

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
- `.glow-indicator`
- `.glow-indicator--active`
- `.glow-indicator--info`
- `.glow-indicator--success`
- `.glow-indicator--warning`
- `.glow-indicator--error`
- `.glow-indicator--pulse`

**Data Test IDs:**
N/A

**ARIA Labels:**
- `role="status"` when active
- `aria-live="polite"` when active
- `aria-label="{level} notification"` when active

**Visual Landmarks:**
1. Glow effect (CSS box-shadow) — Colored glow around children
2. Pulse animation (CSS animation) — Pulsing glow when active

---

## Health Checks

### Critical Checks (Must Pass)

#### HC-GI-01: Wrapper Renders
- **Type:** render
- **Target:** Glow wrapper element
- **Condition:** `.glow-indicator` exists with children
- **Failure Mode:** Children not rendered
- **Automation Script:**
```javascript
// Chrome MCP script
const wrapper = await page.$('.glow-indicator');
console.assert(wrapper !== null, 'Glow indicator wrapper not rendered');
const hasChildren = await wrapper.evaluate(el => el.children.length > 0);
console.assert(hasChildren, 'Glow indicator has no children');
```

#### HC-GI-02: Active State Applies Classes
- **Type:** conditional-render
- **Target:** Active and level classes
- **Condition:** `.glow-indicator--active` and `.glow-indicator--{level}` applied when active=true
- **Failure Mode:** Glow effect not applied
- **Automation Script:**
```javascript
// Chrome MCP script
const isActive = await page.$('.glow-indicator--active');
if (isActive) {
  const hasLevelClass = await isActive.evaluate(el =>
    el.classList.contains('glow-indicator--info') ||
    el.classList.contains('glow-indicator--success') ||
    el.classList.contains('glow-indicator--warning') ||
    el.classList.contains('glow-indicator--error')
  );
  console.assert(hasLevelClass, 'No level class applied when active');
}
```

### Warning Checks (Should Pass)

#### HC-GI-03: Intensity Custom Property
- **Type:** style
- **Target:** CSS custom property `--glow-intensity`
- **Condition:** Set to clamped intensity value when active
- **Failure Mode:** Intensity not applied

### Performance Benchmarks

| Metric | Threshold | Unit | Description |
|--------|-----------|------|-------------|
| render-time | 10 | ms | Time to paint wrapper with children |
| animation-fps | 60 | fps | Pulse animation frame rate |

---

## Dependencies

**Required Contexts:**
None

**Required Hooks:**
None

**Child Components:**
None — Accepts any ReactNode

**Required Props:**
- `active`
- `level`
- `children`

---

## Notes

- Intensity clamped to 0-1 range for safety
- CSS custom property `--glow-intensity` allows dynamic glow strength
- Glow colors: info (blue), success (green), warning (yellow), error (red)
- Pulse animation implemented via CSS keyframes (@keyframes glow-pulse)
- ARIA attributes only added when active=true for accessibility
- Children rendered unchanged — glow is pure visual effect
- Can wrap any component: buttons, badges, tabs, etc.

---

**Contract Authored:** 2026-02-10
**Last Updated:** 2026-02-10
**Version:** 1.0.0
