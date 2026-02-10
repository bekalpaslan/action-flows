# Component Contract: FileTreeWidget

**File:** `packages/app/src/components/IntelDossier/widgets/FileTreeWidget.tsx`
**Type:** widget
**Parent Group:** IntelDossier/widgets
**Contract Version:** 1.0.0
**Last Reviewed:** 2026-02-10

---

## Identity

- **Component Name:** FileTreeWidget
- **Introduced:** 2024-Q4
- **Description:** Simple nested file tree widget with folders (📂 open, 📁 closed) and files (📄). Uses recursive FileTreeNode component for expansion.

---

## Props Contract

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| data.root | `string` | ✅ | Root path display label |
| data.nodes | `FileNode[]` | ✅ | Tree structure array |
| span | `number` | ✅ | Grid column span |

---

## State (per FileTreeNode)

- isExpanded: boolean (default: true)

---

## Test Hooks

**CSS Classes:**
- `.widget-file-tree`
- `.widget-file-tree__root`
- `.widget-file-tree__nodes`
- `.widget-file-tree__node`
- `.widget-file-tree__node-label`
- `.widget-file-tree__icon`
- `.widget-file-tree__name`
- `.widget-file-tree__children`

---

**Contract Authored:** 2026-02-10
**Version:** 1.0.0
