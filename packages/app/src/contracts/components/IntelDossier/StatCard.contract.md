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

## Props Contract

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| data.label | `string` | ✅ | Stat label text |
| data.value | `string \| number` | ✅ | Stat value |
| data.trend | `'up' \| 'down' \| 'neutral'` | ❌ | Trend direction |
| data.unit | `string` | ❌ | Unit suffix (e.g., '%', 'ms') |
| span | `number` | ✅ | Grid column span (1-3) |

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
