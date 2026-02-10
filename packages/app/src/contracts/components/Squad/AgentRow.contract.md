# Component Contract: AgentRow

**File:** `packages/app/src/components/SquadPanel/AgentRow.tsx`
**Type:** feature
**Parent Group:** Squad
**Contract Version:** 1.0.0
**Last Reviewed:** 2026-02-10

---

## Identity

- **Component Name:** AgentRow
- **Introduced:** 2026-02-09
- **Description:** Responsive layout container that arranges orchestrator (center) and subagents (flanking left/right) with adaptive breakpoints for compact and icon-grid layouts.

---

## Render Location

**Mounts Under:**
- SquadPanel

**Render Conditions:**
1. When parent SquadPanel has `orchestrator` data (non-null)
2. Always renders when mounted (no conditional rendering within component)

**Positioning:** relative
**Z-Index:** N/A

---

## Lifecycle

**Mount Triggers:**
- SquadPanel receives orchestrator from `useAgentTracking()`

**Key Effects:**
None (stateless layout component)

**Cleanup Actions:**
None

**Unmount Triggers:**
- SquadPanel unmounts

---

## Props Contract

### Inputs
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| orchestrator | Agent | ✅ | N/A | Orchestrator agent data (name, role, status, logs) |
| subagents | Agent[] | ✅ | N/A | Array of subagent data objects |
| expandedAgentId | string \| null | ✅ | N/A | Currently expanded agent ID (only one at a time) |
| onAgentHover | (agentId: string, isHovering: boolean) => void | ✅ | N/A | Hover state callback for eye tracking |
| onAgentClick | (agentId: string) => void | ✅ | N/A | Click callback to toggle log panel |

### Callbacks Up (to parent)
| Callback | Signature | Description |
|----------|-----------|-------------|
| onAgentHover | `(agentId: string, isHovering: boolean) => void` | Reports hover state changes |
| onAgentClick | `(agentId: string) => void` | Reports agent card clicks |

### Callbacks Down (to children)
| Callback | Signature | Passed To | Description |
|----------|-----------|-----------|-------------|
| onHover | `(isHovering: boolean) => void` | AgentCharacterCard | Hover state for individual card |
| onClick | `() => void` | AgentCharacterCard | Click handler for card |

---

## State Ownership

### Local State
None (stateless presentation)

### Context Consumption
None

### Derived State
| Name | Type | Dependencies | Computation |
|------|------|--------------|-------------|
| leftAgents | Agent[] | `[subagents]` | `subagents.filter((_, i) => i % 2 === 0)` |
| rightAgents | Agent[] | `[subagents]` | `subagents.filter((_, i) => i % 2 === 1)` |

### Custom Hooks
None

---

## Interactions

### Parent Communication
- **Mechanism:** prop-callback
- **Description:** Forwards hover/click events from AgentCharacterCard to parent
- **Example:** `onAgentClick(agent.id)` when card clicked

### Child Communication
- **Child:** AgentCharacterCard, AgentLogPanel
- **Mechanism:** props
- **Data Flow:** Passes agent data, expand state, and callbacks to each card/panel pair

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
- `.agent-row`
- `.agent-row-side.side-left` (left subagents column)
- `.agent-row-side.side-right` (right subagents column)
- `.agent-row-orchestrator` (center orchestrator)
- `.agent-row-slot` (individual agent container)

**Data Test IDs:**
None

**ARIA Labels:**
None (relies on child components' ARIA labels)

**Visual Landmarks:**
1. Center orchestrator slot (`.agent-row-orchestrator`) — Always present, 1.5x size
2. Left/right side columns (`.agent-row-side`) — Even-indexed subagents on left, odd on right
3. Agent slots (`.agent-row-slot`) — Vertical stack of card + log panel

---

## Health Checks

### Critical Checks (Must Pass)

#### HC-AR-001: Orchestrator Renders in Center
- **Type:** render
- **Target:** `.agent-row-orchestrator`
- **Condition:** Element exists and contains AgentCharacterCard with `size="orchestrator"`
- **Failure Mode:** Orchestrator not visible, layout breaks
- **Automation Script:**
```javascript
// Chrome MCP script
const orch = document.querySelector('.agent-row-orchestrator');
if (!orch) throw new Error('Orchestrator slot missing');
const orchCard = orch.querySelector('.agent-character-card.size-orchestrator');
if (!orchCard) throw new Error('Orchestrator card not rendering with size-orchestrator class');
```

#### HC-AR-002: Subagents Distributed Left/Right
- **Type:** render
- **Target:** `.agent-row-side.side-left`, `.agent-row-side.side-right`
- **Condition:** Left side has even-indexed subagents, right has odd-indexed
- **Failure Mode:** Layout asymmetry, visual imbalance
- **Automation Script:**
```javascript
// Chrome MCP script
const leftSlots = document.querySelectorAll('.agent-row-side.side-left .agent-row-slot');
const rightSlots = document.querySelectorAll('.agent-row-side.side-right .agent-row-slot');
const total = leftSlots.length + rightSlots.length;
console.log(`Distribution: ${leftSlots.length} left, ${rightSlots.length} right (total ${total})`);
```

#### HC-AR-003: Log Panels Inline Below Cards
- **Type:** render
- **Target:** `.agent-row-slot` structure
- **Condition:** Each slot contains AgentCharacterCard followed by AgentLogPanel
- **Failure Mode:** Log panels detached from cards, layout breaks
- **Automation Script:**
```javascript
// Chrome MCP script
const slots = document.querySelectorAll('.agent-row-slot');
slots.forEach(slot => {
  const card = slot.querySelector('.agent-character-card');
  const panel = slot.querySelector('.agent-log-panel');
  if (!card || !panel) {
    throw new Error('Slot missing card or log panel');
  }
});
```

### Warning Checks (Should Pass)

#### HC-AR-004: Responsive Breakpoints
- **Type:** style
- **Target:** `.agent-row` CSS media queries
- **Condition:** Layout switches at 1200px (full), 768px (compact), <768px (icon grid)
- **Failure Mode:** Layout doesn't adapt to screen size

### Performance Benchmarks

| Metric | Threshold | Unit | Description |
|--------|-----------|------|-------------|
| render-6-agents | 100 | ms | Time to render orchestrator + 5 subagents |
| layout-recalc | 16 | ms | Time to recalculate layout on window resize |

---

## Dependencies

**Required Contexts:**
None

**Required Hooks:**
None

**Child Components:**
- AgentCharacterCard
- AgentLogPanel

**Required Props:**
- `orchestrator` (Agent)
- `subagents` (Agent[])
- `expandedAgentId` (string | null)
- `onAgentHover` (function)
- `onAgentClick` (function)

---

## Notes

**Responsive Breakpoints:**
- **≥1200px (Full layout):** Orchestrator center, subagents flanking left/right in columns
- **768-1199px (Compact layout):** Orchestrator center, subagents in 2-column grid below
- **<768px (Icon grid):** All agents same size in 3-column grid

**Distribution Algorithm:**
- Left side: subagents at even indices (0, 2, 4, ...)
- Right side: subagents at odd indices (1, 3, 5, ...)
- Ensures visual balance when subagent count is even

**Expand State Behavior:**
- Only ONE agent can be expanded at a time (enforced by parent)
- Log panel expands inline below its card within `.agent-row-slot`

---

**Contract Authored:** 2026-02-10
**Last Updated:** 2026-02-10
**Version:** 1.0.0
