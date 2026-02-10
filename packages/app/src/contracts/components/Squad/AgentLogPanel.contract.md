# Component Contract: AgentLogPanel

**File:** `packages/app/src/components/SquadPanel/AgentLogPanel.tsx`
**Type:** widget
**Parent Group:** Squad
**Contract Version:** 1.0.0
**Last Reviewed:** 2026-02-10

---

## Identity

- **Component Name:** AgentLogPanel
- **Introduced:** 2026-02-09
- **Description:** Expandable log display that unfolds inline beneath agent card, showing color-coded log bubbles with auto-scroll to bottom on new entries.

---

## Render Location

**Mounts Under:**
- AgentRow (within `.agent-row-slot`)

**Render Conditions:**
1. Always mounts when AgentRow renders
2. Only visible when `isExpanded` prop is true

**Positioning:** relative
**Z-Index:** N/A

---

## Lifecycle

**Mount Triggers:**
- AgentRow mounts with agent data

**Key Effects:**
1. **Dependencies:** `[isExpanded, agent.logs]`
   - **Side Effects:** Auto-scrolls to bottom when panel expands or new logs arrive
   - **Cleanup:** Clears setTimeout for scroll animation
   - **Condition:** Runs when `isExpanded` is true

**Cleanup Actions:**
- Clears auto-scroll timeout

**Unmount Triggers:**
- AgentRow unmounts

---

## Props Contract

### Inputs
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| agent | Agent | ✅ | N/A | Agent data with logs array |
| isExpanded | boolean | ✅ | N/A | Whether panel is expanded |
| maxHeight | number (px) | ❌ | 400 | Maximum height in pixels |
| className | string | ❌ | '' | Additional CSS classes |

### Callbacks Up (to parent)
None

### Callbacks Down (to children)
| Callback | Signature | Passed To | Description |
|----------|-----------|-----------|-------------|
| N/A | N/A | LogBubble | Each log rendered as LogBubble (no callbacks) |

---

## State Ownership

### Local State
None

### Context Consumption
None

### Derived State
None

### Custom Hooks
None

---

## Interactions

### Parent Communication
None (receives props only)

### Child Communication
- **Child:** LogBubble
- **Mechanism:** props
- **Data Flow:** Passes individual log object to each LogBubble

### Sibling Communication
None

### Context Interaction
None

---

## Side Effects

### API Calls
None

### WebSocket Events
None (data comes from parent via props)

### Timers
| Type | Duration | Purpose | Cleanup |
|------|----------|---------|---------|
| timeout | 0ms | Auto-scroll to bottom after DOM update | ✅ |

### LocalStorage Operations
None

### DOM Manipulation
| Target | Operation | Trigger |
|--------|-----------|---------|
| `.log-panel-scroll-container` | `scrollTo({ top: scrollHeight, behavior: 'smooth' })` | When `isExpanded` or `agent.logs` changes |

### Electron IPC (if applicable)
N/A

---

## Test Hooks

**CSS Selectors:**
- `.agent-log-panel`
- `.log-panel-expanded` (when `isExpanded` is true)
- `.log-panel-border-{role}` (border color matches agent role)
- `.log-panel-header`
- `.log-panel-agent-name`
- `.log-panel-count` (log count badge)
- `.log-panel-scroll-container`
- `.log-panel-empty` (when no logs)
- `.log-bubbles-list`

**Data Test IDs:**
None

**ARIA Labels:**
None (relies on semantic HTML)

**Visual Landmarks:**
1. Panel header (`.log-panel-header`) — Shows agent name + log count
2. Scroll container (`.log-panel-scroll-container`) — Vertical scrolling area
3. Empty state (`.log-panel-empty`) — "No logs yet. Waiting for output..."
4. Log bubbles list (`.log-bubbles-list`) — Vertical stack of LogBubbles

---

## Health Checks

### Critical Checks (Must Pass)

#### HC-ALP-001: Panel Expands on `isExpanded` True
- **Type:** render
- **Target:** `.agent-log-panel`
- **Condition:** Element rendered and visible when `isExpanded` is true
- **Failure Mode:** Panel does not expand, logs hidden
- **Automation Script:**
```javascript
// Chrome MCP script
const panel = document.querySelector('.agent-log-panel.log-panel-expanded');
if (!panel) throw new Error('Log panel not rendering in expanded state');
const style = window.getComputedStyle(panel);
if (style.display === 'none') throw new Error('Log panel hidden despite isExpanded=true');
```

#### HC-ALP-002: Auto-Scroll to Bottom
- **Type:** interaction
- **Target:** `.log-panel-scroll-container`
- **Condition:** `scrollTop` equals `scrollHeight - clientHeight` after new log
- **Failure Mode:** User misses latest logs, must manually scroll
- **Automation Script:**
```javascript
// Chrome MCP script
const container = document.querySelector('.log-panel-scroll-container');
if (!container) throw new Error('Scroll container not rendered');
// After adding a new log (simulated), check scroll position
setTimeout(() => {
  const atBottom = container.scrollTop >= (container.scrollHeight - container.clientHeight - 10);
  if (!atBottom) console.warn('Panel not auto-scrolled to bottom');
}, 100);
```

#### HC-ALP-003: LogBubbles Render for Each Log
- **Type:** render
- **Target:** `.log-bubbles-list .log-bubble`
- **Condition:** Number of `.log-bubble` elements equals `agent.logs.length`
- **Failure Mode:** Logs data present but not visualized
- **Automation Script:**
```javascript
// Chrome MCP script
const bubbles = document.querySelectorAll('.log-bubbles-list .log-bubble');
const logCount = parseInt(document.querySelector('.log-panel-count')?.textContent || '0');
if (bubbles.length !== logCount) {
  throw new Error(`Log bubble count mismatch: ${bubbles.length} rendered vs ${logCount} expected`);
}
```

### Warning Checks (Should Pass)

#### HC-ALP-004: Empty State Message
- **Type:** render
- **Target:** `.log-panel-empty`
- **Condition:** Element visible when `agent.logs.length === 0`
- **Failure Mode:** Confusing UI with no content

### Performance Benchmarks

| Metric | Threshold | Unit | Description |
|--------|-----------|------|-------------|
| expand-animation | 150 | ms | Time to expand panel |
| scroll-animation | 100 | ms | Time to auto-scroll to bottom |
| render-50-logs | 200 | ms | Time to render 50 LogBubbles |

---

## Dependencies

**Required Contexts:**
None

**Required Hooks:**
None

**Child Components:**
- LogBubble

**Required Props:**
- `agent` (Agent with `.logs` array)
- `isExpanded` (boolean)

---

## Notes

**Auto-Scroll Behavior:**
- Scrolls to bottom when panel first expands (`isExpanded` changes to true)
- Scrolls to bottom when new logs arrive (`agent.logs.length` increases)
- Uses `setTimeout(0)` to ensure DOM has updated before scrolling
- Smooth scroll animation via `behavior: 'smooth'`

**Border Color:**
- Dynamically applies `.log-panel-border-{role}` class
- CSS uses `--glow-color` custom property from agent role

**Empty State:**
- Shows "No logs yet. Waiting for output..." when `agent.logs.length === 0`
- Empty state styled as centered text in muted color

---

**Contract Authored:** 2026-02-10
**Last Updated:** 2026-02-10
**Version:** 1.0.0
