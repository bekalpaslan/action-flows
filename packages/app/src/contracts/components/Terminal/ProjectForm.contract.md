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

## Props Contract
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| mode | 'create'\|'edit' | ✅ | Form mode |
| initialData | Partial<Project> | ❌ | Initial data |
| onSave | (data) => Promise<void> | ✅ | Save callback |
| onCancel | () => void | ✅ | Cancel callback |
| onDetect | (cwd: string) => Promise<Result> | ❌ | Auto-detect |
| isLoading | boolean | ✅ | Loading state |

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
