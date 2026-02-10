# Component Contract: UnknownWidget

**File:** `packages/app/src/components/IntelDossier/widgets/UnknownWidget.tsx`
**Type:** widget
**Parent Group:** IntelDossier/widgets
**Contract Version:** 1.0.0
**Last Reviewed:** 2026-02-10

---

## Identity

- **Component Name:** UnknownWidget
- **Introduced:** 2024-Q4
- **Description:** Fallback widget for unrecognized widget types. Displays widget type name and raw formatted JSON data for debugging.

---

## Props Contract

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| type | `string` | ✅ | Unknown widget type name |
| data | `Record<string, unknown>` | ✅ | Widget data object |
| span | `number` | ✅ | Grid column span |

---

## Behavior

- Displays type name with "Unknown Widget: " prefix
- Renders data as formatted JSON with 2-space indentation
- Allows developers to see widget data for debugging

---

## Test Hooks

**CSS Classes:**
- `.widget-unknown`
- `.widget-unknown__header`
- `.widget-unknown__type`
- `.widget-unknown__data`

---

**Contract Authored:** 2026-02-10
**Version:** 1.0.0
