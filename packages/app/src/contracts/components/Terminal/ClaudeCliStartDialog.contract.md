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

## Props Contract
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| onClose | () => void | ✅ | Close callback |
| onSessionStarted | (sessionId: SessionId) => void | ❌ | Started callback |

## Custom Hooks
- useClaudeCliSessions() - startSession
- useProjects() - createProject, updateProject, detectProject
- useDiscoveredSessions() - Live session discovery

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
