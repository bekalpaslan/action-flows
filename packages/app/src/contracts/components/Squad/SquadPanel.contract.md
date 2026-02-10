# Component Contract: SquadPanel

**File:** `packages/app/src/components/SquadPanel/SquadPanel.tsx`
**Type:** feature
**Parent Group:** Squad
**Contract Version:** 1.0.0
**Last Reviewed:** 2026-02-10

---

## Identity

- **Component Name:** SquadPanel
- **Introduced:** 2026-02-09
- **Description:** Main container for orchestrator + subagents visualization with character avatars, log panels, and responsive layout across multiple placements (left, right, bottom, overlay).

---

## Render Location

**Mounts Under:**
- WorkWorkbench
- ExploreWorkbench (optional, if multi-agent workflow enabled)

**Render Conditions:**
1. When session has active agents tracked by WebSocket (`useAgentTracking(sessionId)` returns non-empty data)
2. When `sessionId` prop is provided (`sessionId` is not null/undefined)

**Positioning:** relative (for `placement: 'left' | 'right' | 'bottom'`), fixed (for `placement: 'overlay'`)
**Z-Index:** 10 (DiscussButton overlay), 1 (base panel for overlay mode)

---

## Lifecycle

**Mount Triggers:**
- Workbench renders with active session containing agents
- WebSocket emits `agent:spawned` or `agent:started` events

**Key Effects:**
1. **Dependencies:** `[sessionId]`
   - **Side Effects:** Subscribes to WebSocket for agent events via `useAgentTracking()`
   - **Cleanup:** Unsubscribes from WebSocket on unmount
   - **Condition:** Always runs when `sessionId` changes

**Cleanup Actions:**
- WebSocket unsubscribe for agent-related events
- Clears agent hover states in `useAgentInteractions()`

**Unmount Triggers:**
- User switches to different workbench
- Session ends or is detached

---

## Props Contract

### Inputs
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| sessionId | SessionId \| null | ✅ | N/A | Session ID to track agents for (null in demo mode) |
| placement | 'left' \| 'right' \| 'bottom' \| 'overlay' | ❌ | 'left' | Placement mode for panel positioning |
| overlayPosition | 'top-left' \| 'top-right' \| 'bottom-left' \| 'bottom-right' | ❌ | 'bottom-right' | Corner position for overlay mode |
| overlayOpacity | number (0-1) | ❌ | 0.9 | Opacity for overlay mode backdrop |
| className | string | ❌ | '' | Additional CSS classes |
| onAgentClick | (agentId: string) => void | ❌ | undefined | Callback when agent card is clicked |
| audioEnabled | boolean | ❌ | false | Enable/disable audio cues for interactions |

### Callbacks Up (to parent)
| Callback | Signature | Description |
|----------|-----------|-------------|
| onAgentClick | `(agentId: string) => void` | Fires when user clicks an agent card |

### Callbacks Down (to children)
| Callback | Signature | Passed To | Description |
|----------|-----------|-----------|-------------|
| onAgentHover | `(agentId: string, isHovering: boolean) => void` | AgentRow | Tracks hover state for eye tracking animation |
| onAgentClick | `(agentId: string) => void` | AgentRow | Toggles log panel expand/collapse + parent callback |

---

## State Ownership

### Local State
None (state delegated to hooks)

### Context Consumption
| Context | Values Used |
|---------|-------------|
| DiscussContext | `registerChatInput`, `prefillChatInput` |

### Derived State
None

### Custom Hooks
- `useAgentTracking(sessionId)` — Fetches orchestrator & subagents from WebSocket events
- `useAgentInteractions()` — Manages hover, click, and expand states for all agents
- `useDiscussButton({ componentName, getContext })` — DiscussButton dialog state

---

## Interactions

### Parent Communication
- **Mechanism:** prop-callback
- **Description:** Notifies parent when agent card is clicked for logging/analytics
- **Example:** `onAgentClick?.('agent-123')`

### Child Communication
- **Child:** AgentRow
- **Mechanism:** props
- **Data Flow:** Passes orchestrator, subagents array, expandedAgentId, hover/click handlers

### Sibling Communication
None (isolated feature panel)

### Context Interaction
- **Context:** DiscussContext
- **Role:** consumer
- **Operations:** Opens DiscussDialog to send context-aware messages to ChatPanel

---

## Side Effects

### API Calls
None (data fetched via WebSocket)

### WebSocket Events
| Event Type | Trigger | Handler |
|------------|---------|---------|
| `agent:spawned` | Backend spawns new subagent | `useAgentTracking` adds to subagents array |
| `agent:started` | Agent begins execution | `useAgentTracking` updates agent status |
| `agent:log` | Agent emits log entry | `useAgentTracking` appends to agent.logs array |
| `agent:completed` | Agent finishes execution | `useAgentTracking` sets status to 'success' |
| `agent:failed` | Agent encounters error | `useAgentTracking` sets status to 'error' |

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
- `.squad-panel`
- `.placement-left`, `.placement-right`, `.placement-bottom`, `.placement-overlay`
- `.overlay-top-left`, `.overlay-top-right`, `.overlay-bottom-left`, `.overlay-bottom-right`
- `.squad-panel.is-empty` (empty state)

**Data Test IDs:**
None (uses CSS classes)

**ARIA Labels:**
- `role="region"` on `.squad-panel`
- `aria-label="Agent squad panel"`

**Visual Landmarks:**
1. DiscussButton in top-right corner (`.discuss-button-small`) — Fixed position overlay
2. AgentRow center orchestrator with 1.5x size — Distinct visual center
3. Empty state class `.is-empty` — When no agents loaded

---

## Health Checks

### Critical Checks (Must Pass)

#### HC-SQP-001: Panel Renders with SessionId
- **Type:** render
- **Target:** `.squad-panel`
- **Condition:** Element exists in DOM when `sessionId` prop is non-null
- **Failure Mode:** Panel does not appear, agents not visualized
- **Automation Script:**
```javascript
// Chrome MCP script
const panel = document.querySelector('.squad-panel');
if (!panel) throw new Error('SquadPanel failed to render');
if (panel.classList.contains('is-empty')) {
  console.warn('SquadPanel rendered but no agents loaded');
}
```

#### HC-SQP-002: WebSocket Subscription Active
- **Type:** connection
- **Target:** `useAgentTracking` hook
- **Condition:** WebSocket subscribed to agent events for sessionId
- **Failure Mode:** Real-time agent updates do not appear, panel remains empty
- **Automation Script:**
```javascript
// Chrome MCP script
const wsContext = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
// Check if WebSocket connection is active
const wsStatus = sessionStorage.getItem('ws-status');
if (wsStatus !== 'connected') {
  throw new Error('WebSocket not connected for agent tracking');
}
```

#### HC-SQP-003: AgentRow Renders Children
- **Type:** render
- **Target:** `.agent-row` within `.squad-panel`
- **Condition:** AgentRow renders when orchestrator or subagents exist
- **Failure Mode:** Agents fetched but not displayed
- **Automation Script:**
```javascript
// Chrome MCP script
const agentRow = document.querySelector('.agent-row');
if (!agentRow) {
  throw new Error('AgentRow failed to render inside SquadPanel');
}
```

### Warning Checks (Should Pass)

#### HC-SQP-004: DiscussButton Visible
- **Type:** render
- **Target:** DiscussButton in top-right corner
- **Condition:** Button renders with `size="small"`
- **Failure Mode:** User cannot discuss SquadPanel context

### Performance Benchmarks

| Metric | Threshold | Unit | Description |
|--------|-----------|------|-------------|
| render-time | 50 | ms | Time to mount SquadPanel |
| agent-row-render | 100 | ms | Time to render AgentRow with 6 agents |
| hover-response | 16 | ms | Time from hover to eye tracking update |

---

## Dependencies

**Required Contexts:**
- DiscussContext

**Required Hooks:**
- `useAgentTracking(sessionId)`
- `useAgentInteractions()`
- `useDiscussButton({ componentName, getContext })`

**Child Components:**
- AgentRow

**Required Props:**
- `sessionId` (SessionId | null)

---

## Notes

**Placement Modes:**
- `left` / `right` / `bottom`: Integrated into workbench layout as sidebars
- `overlay`: Floating panel with adjustable opacity and corner positioning

**Empty State Behavior:**
- Renders minimal `.squad-panel.is-empty` element when no orchestrator/subagents
- Does NOT render AgentRow in empty state

**Animation Integration:**
- Imports `./animations.css` for aura pulse, floating, and status transitions
- Animation classes applied by child components (AgentAvatar, AgentLogPanel)

**Audio Cues:**
- `audioEnabled` prop enables sound effects on interactions (not yet implemented)

---

**Contract Authored:** 2026-02-10
**Last Updated:** 2026-02-10
**Version:** 1.0.0
