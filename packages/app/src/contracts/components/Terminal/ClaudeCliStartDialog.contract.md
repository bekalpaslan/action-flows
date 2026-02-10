# Component Contract: ClaudeCliStartDialog

**File:** `packages/app/src/components/ClaudeCliTerminal/ClaudeCliStartDialog.tsx`
**Type:** feature
**Parent Group:** Terminal Components
**Contract Version:** 1.0.0
**Last Reviewed:** 2026-02-10

## Identity
- **Component Name:** ClaudeCliStartDialog
- **Introduced:** 2025-Q4
- **Description:** Dialog for starting Claude CLI sessions with project management.

---

## Render Location

**Mounts Under:**
- TerminalPanel (conditional)

**Render Conditions:**
1. When user initiates session creation (`isOpen === true`)
2. Dialog mode is not 'add-project' or 'edit-project' (otherwise renders ProjectForm instead)

**Positioning:** fixed
**Z-Index:** 1000

---

## Lifecycle

**Mount Triggers:**
- User clicks "New Session" button

**Key Effects:**
1. **Dependencies:** `[initialCwd]`
   - **Side Effects:** Sets initial working directory from Electron process.cwd()
   - **Cleanup:** None
   - **Condition:** Runs once on mount to capture current process directory

**Cleanup Actions:**
- None (component cleans up on unmount naturally)

**Unmount Triggers:**
- User clicks Cancel button
- Session successfully started (onSessionStarted + onClose)

---

## State Ownership

### Local State
| State | Type | Initial | Updated By |
|-------|------|---------|------------|
| mode | 'select-project' \| 'add-project' \| 'edit-project' | 'select-project' | handleAddNewProject, handleSaveProject, handleCancelProjectForm |
| selectedProject | Project \| null | null | handleProjectSelect, handleSaveProject |
| cwd | string | initialCwd (process.cwd()) | setCwd, handleStartFromDiscovery, handleProjectSelect |
| prompt | string | '' | setPrompt, handleProjectSelect, handleSaveProject |
| selectedFlags | string[] | [] | handleFlagToggle, handleProjectSelect, handleSaveProject |

### Context Consumption
None — uses custom hooks only

### Custom Hooks
- `useClaudeCliSessions()` — manages session creation state + isLoading, error
- `useProjects()` — manages projects CRUD + detection
- `useDiscoveredSessions()` — manages discovered sessions discovery polling

---

## Props Contract
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| onClose | () => void | ✅ | Close callback |
| onSessionStarted | (sessionId: SessionId) => void | ❌ | Started callback |

---

## Test Hooks
**CSS Selectors:** `.claude-cli-start-dialog`, ProjectSelector, Start button

**Chrome MCP Health Check:**
```javascript
async function checkStartDialog() {
  const dialog = document.querySelector('.claude-cli-start-dialog');
  if (!dialog) throw new Error('Dialog not rendered');
  const startBtn = dialog.querySelector('button:contains("Start")');
  return { hasDialog: true, hasStart: !!startBtn };
}
```

---
**Version:** 1.0.0
