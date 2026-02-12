# Component Contract: StatCardWidget

**File:** `packages/app/src/components/IntelDossier/widgets/StatCardWidget.tsx`
**Type:** widget
**Parent Group:** IntelDossier/widgets
**Contract Version:** 1.0.0
**Last Reviewed:** 2026-02-10

---

## Identity

- **Component Name:** StatCardWidget
- **Introduced:** 2024-Q4
- **Description:** Small card showing a labeled statistic with optional trend indicator (↑ up, ↓ down) and unit suffix.

---

## Render Location

Renders as a grid cell within the IntelDossier/DossierView layout container. Positioned based on `span` prop (CSS Grid column span). Typically displayed in grid layouts (often 2-3 stats per row) to show key metrics.

---

## Lifecycle

Pure render component. No effects or lifecycle hooks. Computes trend icon and CSS class based on trend prop on each render. No side effects on mount/unmount.

---

## Props Contract

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| data.label | `string` | ✅ | Stat label text |
| data.value | `string \| number` | ✅ | Stat value |
| data.trend | `'up' \| 'down' \| 'neutral'` | ❌ | Trend direction |
| data.unit | `string` | ❌ | Unit suffix (e.g., '%', 'ms') |
| span | `number` | ✅ | Grid column span (1-3) |

---

## State Ownership

None — this widget renders from props only. Label, value, trend, and unit are passed via `data` prop; no local state management.

---

## Interactions

### Parent Communication
- **Mechanism:** none
- **Description:** Stateless widget renders stat data without callbacks
- **Example:** Parent passes `data.label` and `data.value` → Widget renders stat card

### Child Communication
- **Child:** none
- **Mechanism:** none
- **Description:** Pure render component with no child components

### Sibling Communication
- **Sibling:** Other stat cards in DossierView grid
- **Mechanism:** parent-mediated
- **Description:** Grid layout positioning via `span` prop coordinates widget placement

### Context Interaction
- **Context:** none
- **Role:** none
- **Operations:** none

---

## Side Effects

None — pure presentation component with no side effects.

---

## Test Hooks

**CSS Classes:**
- `.widget-stat-card`
- `.widget-stat-card__label`
- `.widget-stat-card__value`
- `.widget-stat-card__unit`
- `.widget-stat-card__trend`
- `.widget-stat-card__trend--up`
- `.widget-stat-card__trend--down`
- `.widget-stat-card__trend--neutral`

---

**Contract Authored:** 2026-02-10
**Version:** 1.0.0
