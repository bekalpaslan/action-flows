# Component Contract: WidgetRenderer

**File:** `packages/app/src/components/IntelDossier/WidgetRenderer.tsx`
**Type:** feature
**Parent Group:** IntelDossier
**Contract Version:** 1.0.0
**Last Reviewed:** 2026-02-10

---

## Identity

- **Component Name:** WidgetRenderer
- **Introduced:** 2024-Q4
- **Description:** Renders a grid layout of widgets based on LayoutDescriptor. Supports grid-2col, grid-3col, and stack layouts. Falls back to UnknownWidget for unrecognized widget types.

---

## Render Location

Renders as the main layout container within IntelDossier/DossierView. Wraps all widgets in a CSS Grid container. Layout class applied: `widget-layout widget-layout--{layout}` (e.g., `widget-layout--grid-2col`).

---

## Lifecycle

Pure render component. No effects or lifecycle hooks. Maps layoutDescriptor.widgets array to JSX on each render, looking up components from WIDGET_REGISTRY. No side effects on mount/unmount.

---

## Props Contract

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| layoutDescriptor | `LayoutDescriptor` | ✅ | Contains layout type ('grid-2col', 'grid-3col', 'stack') and widget definitions |

---

## State Ownership

None — computed from props only. Layout type and widget list are derived from `layoutDescriptor` prop; no local state management.

---

## Behavior

- Maps widget types to registered components via `WIDGET_REGISTRY`
- Renders UnknownWidget for unrecognized types
- Applies layout CSS class: `widget-layout--{layout}`
- Each widget receives: data, span props
- Widget types: StatCard, InsightCard, AlertPanel, CodeHealthMeter, FileTree, SnippetPreview

---

## Test Hooks

**CSS Classes:**
- `.widget-layout`
- `.widget-layout--grid-2col`
- `.widget-layout--grid-3col`
- `.widget-layout--stack`

---

## Health Checks

#### HC-WR-01: Widget Registry Lookup
- **Type:** logic
- **Target:** Widget component resolution
- **Condition:** Known widget types render correct components, unknown types render UnknownWidget
- **Failure Mode:** Missing widgets, runtime errors
- **Automation Script:**
```javascript
const snapshot = await take_snapshot();
assert(snapshot.includes('widget-stat-card') || snapshot.includes('widget-unknown'), 'Widgets should render');
```

---

**Contract Authored:** 2026-02-10
**Version:** 1.0.0
