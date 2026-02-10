# Component Contract: CodeHealthMeterWidget

**File:** `packages/app/src/components/IntelDossier/widgets/CodeHealthMeterWidget.tsx`
**Type:** widget
**Parent Group:** IntelDossier/widgets
**Contract Version:** 1.0.0
**Last Reviewed:** 2026-02-10

---

## Identity

- **Component Name:** CodeHealthMeterWidget
- **Introduced:** 2024-Q4
- **Description:** Meter showing code health score (0-100) with optional factor breakdown bars. Color-coded: ≥80 good (green), ≥50 fair (yellow), <50 poor (red).

---

## Props Contract

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| data.score | `number` | ✅ | Health score 0-100 |
| data.factors | `Array<{label: string, value: number}>` | ❌ | Factor breakdown list |
| span | `number` | ✅ | Grid column span |

---

## Test Hooks

**CSS Classes:**
- `.widget-code-health`
- `.widget-code-health__title`
- `.widget-code-health__score-container`
- `.widget-code-health__score`
- `.widget-code-health__score--good`
- `.widget-code-health__score--medium`
- `.widget-code-health__score--poor`
- `.widget-code-health__score-value`
- `.widget-code-health__score-max`
- `.widget-code-health__score-label`
- `.widget-code-health__factors`
- `.widget-code-health__factor`
- `.widget-code-health__factor-label`
- `.widget-code-health__factor-bar`
- `.widget-code-health__factor-fill`
- `.widget-code-health__factor-value`

---

**Contract Authored:** 2026-02-10
**Version:** 1.0.0
