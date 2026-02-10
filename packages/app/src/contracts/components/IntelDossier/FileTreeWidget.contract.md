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

## Render Location

Renders as a grid cell within the IntelDossier/DossierView layout container. Positioned based on `span` prop (CSS Grid column span). Typically displayed in grid layouts to visualize file structure or codebase organization.

---

## Lifecycle

FileTreeWidget itself is pure (no effects). FileTreeNode child component uses `useState(true)` for local `isExpanded` state, toggled via onClick on node labels. Each node manages its own expansion state independently.

---

## Props Contract

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| data.root | `string` | ✅ | Root path display label |
| data.nodes | `FileNode[]` | ✅ | Tree structure array |
| span | `number` | ✅ | Grid column span |

---

## State Ownership

Per FileTreeNode child: `isExpanded: boolean` (default: true). Parent FileTreeWidget itself is stateless — props only.

---

## Interactions

Clicking on a node label with children toggles its `isExpanded` state, expanding or collapsing its children. Non-leaf nodes (directories with children) display clickable labels; leaf nodes (files) are not interactive.

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
