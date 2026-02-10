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
