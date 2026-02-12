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

## Render Location

Renders as a grid cell within the IntelDossier/DossierView layout container (via WidgetRenderer). Used as a fallback when a widget type is not found in WIDGET_REGISTRY. Positioned based on `span` prop (CSS Grid column span).

---

## Lifecycle

Pure render component. No effects or lifecycle hooks. Displays widget type name and JSON stringified data. No side effects on mount/unmount.

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

## State Ownership

None — this widget renders from props only. Type name and data are passed as direct props; no local state management.

---

## Interactions

### Parent Communication
- **Mechanism:** none
- **Description:** Fallback widget renders debug information without callbacks
- **Example:** WidgetRenderer encounters unknown type → renders UnknownWidget

### Child Communication
- **Child:** none
- **Mechanism:** none
- **Description:** Pure render component with no child components

### Sibling Communication
- **Sibling:** Other widgets in DossierView grid
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
- `.widget-unknown`
- `.widget-unknown__header`
- `.widget-unknown__type`
- `.widget-unknown__data`

---

**Contract Authored:** 2026-02-10
**Version:** 1.0.0
