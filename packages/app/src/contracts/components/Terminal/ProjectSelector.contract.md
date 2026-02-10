# Component Contract: ProjectSelector

**File:** `packages/app/src/components/ClaudeCliTerminal/ProjectSelector.tsx`
**Type:** widget
**Parent Group:** Terminal Components
**Contract Version:** 1.0.0
**Last Reviewed:** 2026-02-10

## Identity
- **Component Name:** ProjectSelector
- **Introduced:** 2025-Q4
- **Description:** Dropdown for selecting registered projects with "Add New Project" option.

---

## Render Location

**Mounts Under:**
- ClaudeCliStartDialog (parent component, mode === 'select-project')

**Render Conditions:**
1. Always renders when parent is in 'select-project' mode
2. Shows projects list and "Add New Project" option

**Positioning:** relative (default)
**Z-Index:** N/A

---

## Lifecycle

Pure render component. No effects or lifecycle hooks. Renders based solely on prop changes and handles onChange events.

---

## State Ownership

None — props only. This is a stateless presentational component. All state is managed by parent (ClaudeCliStartDialog).

---

## Props Contract
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| projects | Project[] | ✅ | Available projects |
| selectedProjectId | ProjectId \| null | ✅ | Selected project |
| onSelectProject | (project: Project \| null) => void | ✅ | Selection callback |
| onAddNewProject | () => void | ✅ | Add new callback |

## Test Hooks
**CSS Selectors:** `select`, `option[value="__add_new__"]`

**Chrome MCP Health Check:**
```javascript
async function checkProjectSelector() {
  const selector = document.querySelector('select');
  if (!selector) throw new Error('Selector not rendered');
  const addNew = selector.querySelector('option[value="__add_new__"]');
  return { hasSelector: true, hasAddNew: !!addNew };
}
```

---
**Version:** 1.0.0
