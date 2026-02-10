# Component Contract: InsightCardWidget

**File:** `packages/app/src/components/IntelDossier/widgets/InsightCardWidget.tsx`
**Type:** widget
**Parent Group:** IntelDossier/widgets
**Contract Version:** 1.0.0
**Last Reviewed:** 2026-02-10

---

## Identity

- **Component Name:** InsightCardWidget
- **Introduced:** 2024-Q4
- **Description:** Card displaying natural language insight text with optional confidence percentage bar and category badge.

---

## Render Location

Renders as a grid cell within the IntelDossier/DossierView layout container. Positioned based on `span` prop (CSS Grid column span). Typically displayed in grid layouts to present analysis insights or recommendations.

---

## Lifecycle

Pure render component. No effects or lifecycle hooks. Conditionally renders category badge and confidence bar based on prop availability. No side effects on mount/unmount.

---

## Props Contract

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| data.text | `string` | ✅ | Insight text content |
| data.confidence | `number` | ❌ | Confidence percentage 0-100 |
| data.category | `string` | ❌ | Category label |
| span | `number` | ✅ | Grid column span |

---

## State Ownership

None — this widget renders from props only. Text, confidence, and category are passed via `data` prop; no local state management.

---

## Test Hooks

**CSS Classes:**
- `.widget-insight-card`
- `.widget-insight-card__category`
- `.widget-insight-card__text`
- `.widget-insight-card__confidence`
- `.widget-insight-card__confidence-bar`
- `.widget-insight-card__confidence-fill`
- `.widget-insight-card__confidence-label`

---

**Contract Authored:** 2026-02-10
**Version:** 1.0.0
