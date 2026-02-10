# Component Contract: SnippetPreviewWidget

**File:** `packages/app/src/components/IntelDossier/widgets/SnippetPreviewWidget.tsx`
**Type:** widget
**Parent Group:** IntelDossier/widgets
**Contract Version:** 1.0.0
**Last Reviewed:** 2026-02-10

---

## Identity

- **Component Name:** SnippetPreviewWidget
- **Introduced:** 2024-Q4
- **Description:** Code snippet excerpt with file path, line range (e.g., `:10-20`), language badge, and optional annotation.

---

## Render Location

Renders as a grid cell within the IntelDossier/DossierView layout container. Positioned based on `span` prop (CSS Grid column span). Typically displayed in grid layouts to show code excerpts or relevant file snippets.

---

## Lifecycle

Pure render component. No effects or lifecycle hooks. Computes line range string on each render from lineStart/lineEnd props. No side effects on mount/unmount.

---

## Props Contract

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| data.file | `string` | ✅ | File path |
| data.code | `string` | ✅ | Code snippet text |
| data.lineStart | `number` | ❌ | Start line number |
| data.lineEnd | `number` | ❌ | End line number |
| data.language | `string` | ❌ | Language label (e.g., 'TypeScript') |
| data.annotation | `string` | ❌ | Annotation/explanation text |
| span | `number` | ✅ | Grid column span |

---

## State Ownership

None — this widget renders from props only. Code, file path, line range, and annotation are passed via `data` prop; no local state management.

---

## Test Hooks

**CSS Classes:**
- `.widget-snippet-preview`
- `.widget-snippet-preview__header`
- `.widget-snippet-preview__file`
- `.widget-snippet-preview__language`
- `.widget-snippet-preview__code`
- `.widget-snippet-preview__annotation`

---

**Contract Authored:** 2026-02-10
**Version:** 1.0.0
