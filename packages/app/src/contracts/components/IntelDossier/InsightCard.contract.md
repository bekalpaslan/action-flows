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

## Props Contract

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| data.text | `string` | ✅ | Insight text content |
| data.confidence | `number` | ❌ | Confidence percentage 0-100 |
| data.category | `string` | ❌ | Category label |
| span | `number` | ✅ | Grid column span |

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
