# Component Contract: ProjectForm

**File:** `packages/app/src/components/ClaudeCliTerminal/ProjectForm.tsx`
**Type:** widget
**Parent Group:** Terminal Components
**Contract Version:** 1.0.0
**Last Reviewed:** 2026-02-10

## Identity
- **Component Name:** ProjectForm
- **Introduced:** 2025-Q4
- **Description:** Modal form for creating/editing projects with auto-detection.

---

## Render Location

**Mounts Under:**
- ClaudeCliStartDialog (conditional, replaces dialog when mode is 'add-project' or 'edit-project')

**Render Conditions:**
1. ClaudeCliStartDialog mode === 'add-project' (for new project creation)
2. ClaudeCliStartDialog mode === 'edit-project' (for editing existing project)

**Positioning:** fixed
**Z-Index:** 1001 (overlays ClaudeCliStartDialog)

---

## Lifecycle

**Mount Triggers:**
- User clicks "Add New Project" button
- User clicks "Edit Project Settings" button

**Key Effects:**
None — form state is managed purely via useState hooks, no side effects for lifecycle management.

**Cleanup Actions:**
- None (component cleans up on unmount naturally)

**Unmount Triggers:**
- User clicks Cancel button
- Form successfully saved (onSave + callback to parent)

---

## State Ownership

### Local State
| State | Type | Initial | Updated By |
|-------|------|---------|------------|
| cwd | string | initialData?.cwd \|\| '' | setCwd (input change) |
| name | string | initialData?.name \|\| '' | setName (input change) |
| description | string | initialData?.description \|\| '' | setDescription (textarea change) |
| defaultPromptTemplate | string | initialData?.defaultPromptTemplate \|\| '' | setDefaultPromptTemplate (textarea change) |
| mcpConfigPath | string | initialData?.mcpConfigPath \|\| '' | setMcpConfigPath (input change) |
| selectedFlags | string[] | initialData?.defaultCliFlags \|\| [] | handleFlagToggle (checkbox toggle) |
| detecting | boolean | false | setDetecting (during auto-detect) |
| detectionResult | ProjectAutoDetectionResult \| null | null | setDetectionResult (from onDetect callback) |

### Context Consumption
None — uses custom props for all external data

### Derived State
None — all state is primitive

---

## Props Contract
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| mode | 'create'\|'edit' | ✅ | Form mode |
| initialData | Partial<Project> | ❌ | Initial data |
| onSave | (data) => Promise<void> | ✅ | Save callback |
| onCancel | () => void | ✅ | Cancel callback |
| onDetect | (cwd: string) => Promise<Result> | ❌ | Auto-detect |
| isLoading | boolean | ✅ | Loading state |

---

## Interactions

### Parent Communication
- **Mechanism:** prop-callback
- **Description:** Calls `onSave(data)` when user submits form; calls `onCancel()` when user clicks Cancel
- **Example:** User fills form and clicks Save → `onSave(projectData)` → Parent updates projects list

### Child Communication
- **Child:** none
- **Mechanism:** none
- **Description:** Form contains only input elements, no child components

### Sibling Communication
- **Sibling:** ProjectSelector (via parent)
- **Mechanism:** parent-mediated
- **Description:** After saving project, parent updates ProjectSelector's project list

### Context Interaction
- **Context:** none
- **Role:** none
- **Operations:** none

---

## Side Effects

### API Calls
- POST /api/projects (if mode === 'create') - Creates new project
- PUT /api/projects/:id (if mode === 'edit') - Updates existing project
- POST /api/projects/detect (if onDetect called) - Auto-detects project settings from directory

### Timers
None

---

## Test Hooks
**CSS Selectors:** Modal backdrop, cwd input, Detect button, Submit button

**Chrome MCP Health Check:**
```javascript
async function checkProjectForm() {
  const modal = document.querySelector('[style*="position: fixed"]');
  if (!modal) throw new Error('Modal not rendered');
  const detectBtn = modal.querySelector('button:contains("Detect")');
  return { hasModal: true, hasDetect: !!detectBtn };
}
```

---
**Version:** 1.0.0
