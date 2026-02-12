# Component Contract: DiscoveredSessionsList

**File:** `packages/app/src/components/ClaudeCliTerminal/DiscoveredSessionsList.tsx`
**Type:** widget
**Parent Group:** Terminal Components
**Contract Version:** 1.0.0
**Last Reviewed:** 2026-02-10

## Identity
- **Component Name:** DiscoveredSessionsList
- **Introduced:** 2025-Q4
- **Description:** Shows externally-running Claude Code sessions with "Start Here" buttons.

---

## Render Location

**Mounts Under:**
- ClaudeCliStartDialog (parent component)

**Render Conditions:**
1. When `sessions.length > 0` (returns null if empty or loading)
2. When `isLoading === false`

**Positioning:** relative (default)
**Z-Index:** N/A

---

## Lifecycle

Pure render component. No effects or lifecycle hooks. Renders based solely on prop changes.

---

## State Ownership

None — props only. This is a stateless presentational component that receives all data via props.

---

## Props Contract
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| sessions | DiscoveredClaudeSession[] | ✅ | Discovered sessions |
| isLoading | boolean | ✅ | Loading state |
| onStartHere | (cwd: string) => void | ✅ | Start callback |

---

## Interactions

### Parent Communication
- **Mechanism:** prop-callback
- **Description:** Calls `onStartHere(cwd)` when user clicks "Start Here" button on a discovered session
- **Example:** User sees running Claude Code session, clicks "Start Here" → `onStartHere(cwd)` → Parent updates prompt+cwd

### Child Communication
- **Child:** none
- **Mechanism:** none
- **Description:** Pure render component with no child components

### Sibling Communication
- **Sibling:** ProjectSelector, ProjectForm
- **Mechanism:** parent-mediated
- **Description:** Selecting a discovered session updates parent state which may affect sibling visibility

### Context Interaction
- **Context:** none
- **Role:** none
- **Operations:** none

---

## Side Effects

None — pure presentation component with no side effects.

---

## Test Hooks
**CSS Selectors:** Session items, alive indicator dot, Start Here button

**Chrome MCP Health Check:**
```javascript
async function checkDiscoveredSessions() {
  const items = document.querySelectorAll('[style*="display: flex"]');
  if (items.length === 0) return { noSessions: true };
  const startBtn = items[0]?.querySelector('button:contains("Start Here")');
  return { sessionCount: items.length, hasButton: !!startBtn };
}
```

---
**Version:** 1.0.0
