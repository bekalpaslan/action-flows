# Component Contract: AgentCharacterCard

**File:** `packages/app/src/components/SquadPanel/AgentCharacterCard.tsx`
**Type:** widget
**Parent Group:** Squad
**Contract Version:** 1.0.0
**Last Reviewed:** 2026-02-10

---

## Identity

- **Component Name:** AgentCharacterCard
- **Introduced:** 2026-02-09
- **Description:** Interactive card with character avatar, name, archetype, status badge, progress bar, and expand indicator. Features hover effects (scale, aura brighten) and click-to-expand functionality.

---

## Render Location

**Mounts Under:**
- AgentRow (within `.agent-row-slot` or `.agent-row-orchestrator`)

**Render Conditions:**
1. Always renders when agent data is present

**Positioning:** relative
**Z-Index:** N/A

---

## Lifecycle

**Mount Triggers:**
- AgentRow renders agent slot

**Key Effects:**
None (local state only)

**Cleanup Actions:**
None

**Unmount Triggers:**
- AgentRow unmounts

---

## Props Contract

### Inputs
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| agent | Agent | ✅ | N/A | Agent data (role, status, name, progress, currentAction, logs) |
| size | 'orchestrator' \| 'subagent' | ✅ | N/A | Size variant |
| isExpanded | boolean | ✅ | N/A | Whether log panel is expanded |
| onHover | (isHovering: boolean) => void | ✅ | N/A | Hover state callback |
| onClick | () => void | ✅ | N/A | Click handler |
| className | string | ❌ | '' | Additional CSS classes |

### Callbacks Up (to parent)
| Callback | Signature | Description |
|----------|-----------|-------------|
| onHover | `(isHovering: boolean) => void` | Reports hover state changes |
| onClick | `() => void` | Fires when card clicked |

### Callbacks Down (to children)
| Callback | Signature | Passed To | Description |
|----------|-----------|-----------|-------------|
| N/A | N/A | AgentAvatar | Avatar receives props, no callbacks |

---

## State Ownership

### Local State
| State | Type | Initial | Updated By |
|-------|------|---------|------------|
| isHovered | boolean | false | `handleMouseEnter`, `handleMouseLeave` |
| eyeTarget | { x: number; y: number } \| null | null | `handleMouseMove` via `calculateEyeTarget` |

### Context Consumption
None

### Derived State
| Name | Type | Dependencies | Computation |
|------|------|--------------|-------------|
| agentName | string | `[agent.role, agent.name]` | `AGENT_NAMES[agent.role] \|\| agent.name` |
| agentArchetype | string | `[agent.role]` | `AGENT_ARCHETYPES[agent.role]` |
| colors | { primary, accent, glow } | `[agent.role]` | `AGENT_COLORS[agent.role]` |
| progress | number (0-100) | `[agent.progress, agent.status]` | `formatProgress(agent)` |
| statusText | string | `[agent.currentAction, agent.status]` | `getStatusText(agent)` |

### Custom Hooks
- `useAgentInteractions()` — Provides `calculateEyeTarget()` utility

---

## Interactions

### Parent Communication
- **Mechanism:** prop-callback
- **Description:** Reports hover and click events to parent
- **Example:** `onHover(true)` on mouse enter, `onClick()` on click

### Child Communication
- **Child:** AgentAvatar
- **Mechanism:** props
- **Data Flow:** Passes role, status, isHovered, eyeTarget, size

### Sibling Communication
None

### Context Interaction
None

---

## Side Effects

### API Calls
None

### WebSocket Events
None (data comes via props)

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
- `.agent-character-card`
- `.size-orchestrator`, `.size-subagent`
- `.status-thinking`, `.status-working`, `.status-error`, etc.
- `.is-expanded` (when log panel expanded)
- `.is-hovered` (when mouse over)
- `.card-avatar-container`
- `.card-info` (name + archetype)
- `.card-name`, `.card-archetype`
- `.card-status-section`
- `.status-badge`, `.status-indicator`
- `.progress-container`, `.progress-bar`
- `.card-expand-indicator`
- `.expand-icon` (▶/▼ icon)
- `.card-hint` (hover hint)

**Data Test IDs:**
None

**ARIA Labels:**
- `role="button"` on `.agent-character-card`
- `tabIndex={0}`
- `aria-label="{agentName} agent - {status} status"`
- `aria-expanded={isExpanded}`

**Visual Landmarks:**
1. Avatar at top (`.card-avatar-container`) — Character visual with aura
2. Name + archetype below avatar (`.card-info`) — Agent identity
3. Status badge (`.status-badge`) — Shows current action or status
4. Progress bar (`.progress-container`) — Visible on hover or when `status === 'working'`
5. Expand indicator (`.expand-icon`) — ▶ when collapsed, ▼ when expanded

---

## Health Checks

### Critical Checks (Must Pass)

#### HC-ACC-001: Card Renders with Avatar
- **Type:** render
- **Target:** `.agent-character-card`
- **Condition:** Card exists with child AgentAvatar
- **Failure Mode:** Agent not visualized
- **Automation Script:**
```javascript
// Chrome MCP script
const card = document.querySelector('.agent-character-card');
if (!card) throw new Error('AgentCharacterCard not rendering');
const avatar = card.querySelector('.agent-avatar');
if (!avatar) throw new Error('AgentAvatar missing inside card');
```

#### HC-ACC-002: Click Toggles Expand
- **Type:** interaction
- **Target:** `.agent-character-card` click handler
- **Condition:** Clicking card fires `onClick()` callback
- **Failure Mode:** Cannot expand log panel
- **Automation Script:**
```javascript
// Chrome MCP script
const card = document.querySelector('.agent-character-card');
let clicked = false;
card.addEventListener('click', () => { clicked = true; });
card.click();
setTimeout(() => {
  if (!clicked) throw new Error('Card click handler not firing');
}, 100);
```

#### HC-ACC-003: Hover Shows Progress Bar
- **Type:** interaction
- **Target:** `.progress-container`
- **Condition:** Element visible when `isHovered` or `isExpanded` or `status === 'working'`
- **Failure Mode:** User cannot see progress
- **Automation Script:**
```javascript
// Chrome MCP script
const card = document.querySelector('.agent-character-card');
card.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
setTimeout(() => {
  const progress = card.querySelector('.progress-container');
  const visible = progress && window.getComputedStyle(progress).display !== 'none';
  if (!visible) console.warn('Progress bar not showing on hover');
}, 50);
```

### Warning Checks (Should Pass)

#### HC-ACC-004: Eye Tracking Active on Hover
- **Type:** interaction
- **Target:** `eyeTarget` state updates
- **Condition:** `handleMouseMove` updates `eyeTarget` when `isHovered` is true
- **Failure Mode:** Eyes don't follow cursor

### Performance Benchmarks

| Metric | Threshold | Unit | Description |
|--------|-----------|------|-------------|
| render-time | 20 | ms | Time to mount card with avatar |
| hover-response | 16 | ms | Time from mouseenter to isHovered state update |

---

## Dependencies

**Required Contexts:**
None

**Required Hooks:**
- `useAgentInteractions()` (for `calculateEyeTarget()`)

**Child Components:**
- AgentAvatar

**Required Props:**
- `agent` (Agent)
- `size` ('orchestrator' | 'subagent')
- `isExpanded` (boolean)
- `onHover` (function)
- `onClick` (function)

---

## Notes

**Size Variants:**
- `size="orchestrator"`: 1.5x scale, larger avatar, prominent status badge
- `size="subagent"`: Standard scale

**Progress Calculation:**
- If `agent.progress` is defined: use clamped value (0-100)
- If undefined and `status === 'working'`: default to 50%
- Otherwise: 0%

**Status Text:**
- Shows `agent.currentAction` if available
- Falls back to capitalized `agent.status`

**Hover Hint:**
- Shows "Click to expand logs" or "Click to collapse logs" based on `isExpanded`
- Only visible when `isHovered` is true

---

**Contract Authored:** 2026-02-10
**Last Updated:** 2026-02-10
**Version:** 1.0.0
