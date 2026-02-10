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
