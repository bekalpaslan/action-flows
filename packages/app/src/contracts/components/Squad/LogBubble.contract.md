# Component Contract: LogBubble

**File:** `packages/app/src/components/SquadPanel/LogBubble.tsx`
**Type:** widget
**Parent Group:** Squad
**Contract Version:** 1.0.0
**Last Reviewed:** 2026-02-10

---

## Identity

- **Component Name:** LogBubble
- **Introduced:** 2026-02-09
- **Description:** Individual log message bubble with timestamp and type-based color coding (info, success, error, thinking, warning). Includes icon indicators for colorblind accessibility.

---

## Render Location

**Mounts Under:**
- AgentLogPanel (within `.log-bubbles-list`)

**Render Conditions:**
1. Always renders when parent has logs to display

**Positioning:** relative
**Z-Index:** N/A

---

## Lifecycle

**Mount Triggers:**
- AgentLogPanel renders log entry

**Key Effects:**
None (pure presentation)

**Cleanup Actions:**
None

**Unmount Triggers:**
- AgentLogPanel unmounts or log entry removed

---

## Props Contract

### Inputs
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| log | AgentLog | ✅ | N/A | Log entry (id, type, message, timestamp) |
| className | string | ❌ | '' | Additional CSS classes |

### Callbacks Up (to parent)
None

### Callbacks Down (to children)
None

---

## State Ownership

### Local State
None

### Context Consumption
None

### Derived State
| Name | Type | Dependencies | Computation |
|------|------|--------------|-------------|
| icon | string | `[log.type]` | `getLogTypeIcon(log.type)` emoji mapping |
| timestamp | string | `[log.timestamp]` | `formatTimestamp(log.timestamp)` relative time |

### Custom Hooks
None

---

## Interactions

### Parent Communication
None (receives props only)

### Child Communication
None (leaf component)

### Sibling Communication
None

### Context Interaction
None

---

## Side Effects

### API Calls
None

### WebSocket Events
None

### Timers
None

### LocalStorage Operations
None

### DOM Manipulation
None

### Electron IPC (if applicable)
N/A

---

## Test Hooks

**CSS Selectors:**
- `.log-bubble`
- `.log-bubble-info`, `.log-bubble-success`, `.log-bubble-error`, `.log-bubble-thinking`, `.log-bubble-warning`
- `.log-bubble-content`
- `.log-bubble-header`
- `.log-bubble-icon`
- `.log-bubble-message`
- `.log-bubble-timestamp`

**Data Test IDs:**
None

**ARIA Labels:**
None (semantic HTML with icons)

**Visual Landmarks:**
1. Icon indicator (`.log-bubble-icon`) — Emoji matching log type
2. Message text (`.log-bubble-message`) — Log content
3. Timestamp (`.log-bubble-timestamp`) — Relative time format

---

## Health Checks

### Critical Checks (Must Pass)

#### HC-LB-001: Bubble Renders with Message
- **Type:** render
- **Target:** `.log-bubble`
- **Condition:** Element exists with `.log-bubble-message` containing text
- **Failure Mode:** Log data present but not displayed
- **Automation Script:**
```javascript
// Chrome MCP script
const bubbles = document.querySelectorAll('.log-bubble');
bubbles.forEach(bubble => {
  const message = bubble.querySelector('.log-bubble-message');
  if (!message || !message.textContent.trim()) {
    throw new Error('LogBubble missing message text');
  }
});
```

#### HC-LB-002: Type-Based Color Coding
- **Type:** render
- **Target:** `.log-bubble-{type}` class
- **Condition:** Bubble has correct type class (info, success, error, thinking, warning)
- **Failure Mode:** Color coding broken, accessibility issue
- **Automation Script:**
```javascript
// Chrome MCP script
const bubble = document.querySelector('.log-bubble');
const hasTypeClass = bubble.classList.contains('log-bubble-info') ||
                     bubble.classList.contains('log-bubble-success') ||
                     bubble.classList.contains('log-bubble-error') ||
                     bubble.classList.contains('log-bubble-thinking') ||
                     bubble.classList.contains('log-bubble-warning');
if (!hasTypeClass) throw new Error('LogBubble missing type class');
```

#### HC-LB-003: Icon Matches Type
- **Type:** render
- **Target:** `.log-bubble-icon`
- **Condition:** Icon content matches log type (ℹ️, ✓, ✕, ◆, ⚠)
- **Failure Mode:** Visual inconsistency, confusion
- **Automation Script:**
```javascript
// Chrome MCP script
const bubble = document.querySelector('.log-bubble-info');
const icon = bubble?.querySelector('.log-bubble-icon');
if (!icon || icon.textContent !== 'ℹ️') {
  console.warn('Icon mismatch for log type');
}
```

### Warning Checks (Should Pass)

#### HC-LB-004: Timestamp Formatting
- **Type:** render
- **Target:** `.log-bubble-timestamp`
- **Condition:** Timestamp shows relative time (just now, 5m ago, 2h ago, etc.)
- **Failure Mode:** Confusing absolute timestamps

### Performance Benchmarks

| Metric | Threshold | Unit | Description |
|--------|-----------|------|-------------|
| render-time | 5 | ms | Time to mount single LogBubble |

---

## Dependencies

**Required Contexts:**
None

**Required Hooks:**
None

**Child Components:**
None (leaf component)

**Required Props:**
- `log` (AgentLog with id, type, message, timestamp)

---

## Notes

**Log Type Colors:**
- `info`: Neutral gray (default, progress updates)
- `success`: Soft green (#4caf50) for completed tasks
- `error`: Soft red (#f44336) for failures
- `thinking`: Soft purple (#9c27b0) for processing
- `warning`: Soft amber (#ff9800) for cautions

**Icon Mapping:**
- `info`: ℹ️
- `success`: ✓
- `error`: ✕
- `thinking`: ◆
- `warning`: ⚠

**Timestamp Formatting:**
- < 1 min: "just now"
- < 1 hour: "Xm ago"
- < 24 hours: "Xh ago"
- ≥ 24 hours: Short date format (e.g., "Feb 10, 2:30 PM")

---

**Contract Authored:** 2026-02-10
**Last Updated:** 2026-02-10
**Version:** 1.0.0
