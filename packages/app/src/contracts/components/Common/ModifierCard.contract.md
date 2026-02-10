# Component Contract: ModifierCard

**File:** `packages/app/src/components/ModifierCard/ModifierCard.tsx`
**Type:** widget
**Parent Group:** Common
**Contract Version:** 1.0.0
**Last Reviewed:** 2026-02-10

---

## Identity

- **Component Name:** ModifierCard
- **Introduced:** 2025-12-01
- **Description:** Display card for self-modification templates showing modifier details, confidence score, current vs. proposed values, and Preview/Apply actions

---

## Render Location

**Mounts Under:**
- Self-modification workflow UIs
- Settings panels for template management

**Render Conditions:**
1. Always renders

**Positioning:** relative
**Z-Index:** N/A

---

## Lifecycle

**Mount Triggers:**
- Parent renders modifier list

**Key Effects:**
None — API calls triggered by user actions

**Cleanup Actions:**
None

**Unmount Triggers:**
- Parent unmounts

---

## Props Contract

### Inputs
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| modifier | ModifierDefinition & {id, name} | ✅ | N/A | Modifier definition data |
| onApply | (modifierId: string) => void | ❌ | undefined | Callback when Apply clicked |
| onPreview | (modifierId: string) => void | ❌ | undefined | Callback when Preview clicked |
| disabled | boolean | ❌ | false | Whether actions are disabled |
| confidence | number | ❌ | undefined | Confidence score (0-100) |
| currentValue | string | ❌ | undefined | Current value for comparison |
| proposedValue | string | ❌ | undefined | Proposed value after modification |

### Callbacks Up (to parent)
| Callback | Signature | Description |
|----------|-----------|-------------|
| onApply | `(modifierId: string) => void` | User clicks Apply button |
| onPreview | `(modifierId: string) => void` | User clicks Preview button |

### Callbacks Down (to children)
N/A

---

## State Ownership

### Local State
| State | Type | Initial | Updated By |
|-------|------|---------|------------|
| isApplying | boolean | false | handleApply (start/end) |
| applied | boolean | false | handleApply (success) |
| error | string \| null | null | handleApply (catch) |

### Context Consumption
N/A

### Derived State
| Name | Type | Dependencies | Computation |
|------|------|--------------|-------------|
| tierClass | string | `[modifier.targetTier]` | `tier-${modifier.targetTier}` |
| cardClass | string | `[disabled, applied, error]` | Concatenates state classes |
| targetSummary | string | `[modifier.fileChangeTemplates]` | First 2 file targets + count |

### Custom Hooks
None

---

## Interactions

### Parent Communication
- **Mechanism:** prop-callback
- **Description:** Calls onPreview/onApply with modifier ID
- **Example:** `onPreview?.(modifier.id)`

### Child Communication
N/A

### Sibling Communication
N/A

### Context Interaction
N/A

---

## Side Effects

### API Calls
N/A — Parent handles API calls (onApply may trigger async operations)

---

## Test Hooks

**CSS Selectors:**
- `.modifier-card`
- `.modifier-header`
- `.modifier-tier`
- `.confidence-badge`
- `.applied-badge`
- `.modifier-name`
- `.modifier-description`
- `.modifier-target`
- `.modifier-comparison`
- `.modifier-validation`
- `.preview-btn`
- `.apply-btn`
- `.spinner`

**Data Test IDs:**
N/A

**ARIA Labels:**
N/A — All buttons use text labels

**Visual Landmarks:**
1. Tier badge (`.modifier-tier`) — Shows targetTier (tier-1, tier-2, tier-3)
2. Confidence badge (`.confidence-badge`) — Shows percentage with color coding
3. Applied badge (`.applied-badge`) — Shows when modification applied
4. Comparison section (`.modifier-comparison`) — Current vs. Proposed values

---

## Health Checks

### Critical Checks (Must Pass)

#### HC-MC-01: Card Renders
- **Type:** render
- **Target:** Modifier card
- **Condition:** `.modifier-card` exists with modifier data
- **Failure Mode:** Card not visible
- **Automation Script:**
```javascript
const card = await page.$('.modifier-card');
console.assert(card !== null, 'Modifier card not rendered');
const name = await card.$eval('.modifier-name', el => el.textContent);
console.assert(name.length > 0, 'Modifier name empty');
```

#### HC-MC-02: Preview Button Works
- **Type:** interaction
- **Target:** Preview button
- **Condition:** Clicking calls onPreview
- **Failure Mode:** Preview not triggered

#### HC-MC-03: Apply Button State Management
- **Type:** state-management
- **Target:** Apply button disabled states
- **Condition:** Disabled when isApplying or applied or disabled prop
- **Failure Mode:** Multiple apply operations triggered

### Warning Checks (Should Pass)

#### HC-MC-04: Validation Indicators
- **Type:** visual-consistency
- **Target:** Validation badges (TypeCheck, Lint, Test)
- **Condition:** Show enabled/disabled based on modifier.validation
- **Failure Mode:** Incorrect validation state displayed

### Performance Benchmarks

| Metric | Threshold | Unit | Description |
|--------|-----------|------|-------------|
| render-time | 50 | ms | Time to paint card |

---

## Dependencies

**Required Contexts:**
None

**Required Hooks:**
None

**Child Components:**
None

**Required Props:**
- `modifier`

---

## Notes

- Tier badge color-coded: tier-1 (high priority), tier-2 (medium), tier-3 (low)
- Confidence badge color: high (≥80%, green), medium (50-79%, yellow), low (<50%, red)
- Target summary shows first 2 files + count if more
- Comparison section only shown if currentValue or proposedValue provided
- Validation indicators show TypeCheck, Lint, Test enabled/disabled states
- Apply button shows spinner and "Applying..." text during operation
- Applied state persists (button shows "Applied" and disabled)
- Error state shows error message below validation section

---

**Contract Authored:** 2026-02-10
**Last Updated:** 2026-02-10
**Version:** 1.0.0
