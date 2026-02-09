# Implementation Plan: SquadPanel Component Architecture

## Overview

The SquadPanel is an anime-style character visualization panel for the ActionFlows Dashboard that displays active agents with personality, animations, and real-time status updates. This architecture follows the Persona 5 UI aesthetic with Studio Ghibli motion principles, using React components with CSS-based animations and WebSocket-driven state updates. The implementation leverages existing frontend patterns: Context + Hooks for data flow, plain CSS keyframes for animations, and the established component folder structure (ComponentName/{tsx, css, index.ts}).

---

## Component Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│ SquadPanel (Container)                                          │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ AgentRow (Layout)                                           │ │
│ │ ┌─────────────┬───────────────────────────────┬──────────┐ │ │
│ │ │             │ AgentCharacterCard            │          │ │ │
│ │ │ Subagents   │ (Orchestrator - 1.5x size)    │ Subagents│ │ │
│ │ │ (Left)      │ ┌───────────────────────────┐ │ (Right)  │ │ │
│ │ │             │ │ AgentAvatar               │ │          │ │ │
│ │ │ [Explore]   │ │  - SVG/PNG character      │ │ [Write]  │ │ │
│ │ │ [Plan]      │ │  - Aura (glow effect)     │ │ [Edit]   │ │ │
│ │ │ [Bash]      │ │  - Eye tracking (hover)   │ │ [Grep]   │ │ │
│ │ │ [Read]      │ │  - Expression states      │ │ [Glob]   │ │ │
│ │ │             │ └───────────────────────────┘ │          │ │ │
│ │ │             │ AgentStatusBar                │          │ │ │
│ │ │             │  - Name + archetype           │          │ │ │
│ │ │             │  - Status text (hover)        │          │ │ │
│ │ │             │  - Progress bar (hover)       │          │ │ │
│ │ │             └───────────────────────────────┘          │ │ │
│ │ │                                                         │ │ │
│ │ │ AgentCharacterCard (subagent)                          │ │ │
│ │ │ ┌─────────────────────────────────────────────┐        │ │ │
│ │ │ │ AgentAvatar (compact)                       │        │ │ │
│ │ │ │ AgentStatusBar (minimal)                    │        │ │ │
│ │ │ └─────────────────────────────────────────────┘        │ │ │
│ │ └─────────────┴───────────────────────────────┴──────────┘ │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ AgentLogPanel (Expandable - rendered inline below clicked card)│
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ LogBubble (chat-style)                                      │ │
│ │ ┌─────────────────────────────────────────────────────────┐ │ │
│ │ │ [Timestamp] Message text with color coding              │ │ │
│ │ │ - Info: neutral gray                                    │ │ │
│ │ │ - Success: soft green                                   │ │ │
│ │ │ - Error: soft red                                       │ │ │
│ │ │ - Thinking: soft purple                                 │ │ │
│ │ │ - Warning: soft amber                                   │ │ │
│ │ └─────────────────────────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘

State Management Flow:
┌──────────────────┐
│ WebSocketContext │ ← Broadcasts WorkspaceEvent
└────────┬─────────┘
         │
    ┌────▼────────────────┐
    │ useAgentTracking    │ ← Hook: Listens to step/chain events
    │ (custom hook)       │    Maps events → AgentCharacter state
    └────────┬────────────┘
             │
        ┌────▼──────────┐
        │ SquadPanel    │ ← Container: Manages agent collection
        │ (component)   │    Provides expandedAgentId state
        └───────┬───────┘
                │
    ┌───────────▼──────────────┐
    │ AgentCharacterCard       │ ← Receives AgentCharacter data
    │                          │    Handles hover/click interactions
    └─────────┬────────────────┘
              │
    ┌─────────▼─────────────┐
    │ AgentAvatar           │ ← Pure presentational
    │ AgentStatusBar        │    CSS animations driven by props
    │ AgentLogPanel         │
    └───────────────────────┘
```

---

## File Structure

```
packages/app/src/components/SquadPanel/
├── index.ts                      # Public exports
├── SquadPanel.tsx                # Main container component
├── SquadPanel.css                # Container styles
├── AgentRow.tsx                  # Layout component for agent arrangement
├── AgentRow.css                  # Row layout styles
├── AgentCharacterCard.tsx        # Individual agent card with interactions
├── AgentCharacterCard.css        # Card styles + hover/click transitions
├── AgentAvatar.tsx               # Character visual with expression states
├── AgentAvatar.css               # Avatar animations + aura effects
├── AgentStatusBar.tsx            # Status text + progress bar overlay
├── AgentStatusBar.css            # Status bar styles
├── AgentLogPanel.tsx             # Expandable log display
├── AgentLogPanel.css             # Log panel + expand animation
├── LogBubble.tsx                 # Individual log message bubble
├── LogBubble.css                 # Bubble styles + color coding
├── types.ts                      # Component prop types (already exists)
└── animations.css                # Shared keyframe definitions

packages/app/src/hooks/
├── useAgentTracking.ts           # Hook: Maps WebSocket events → agent state
└── useAgentInteractions.ts       # Hook: Manages hover/click/expand state

packages/app/src/assets/agents/   # Character artwork directory
├── orchestrator-idle.svg
├── orchestrator-thinking.svg
├── orchestrator-working.svg
├── orchestrator-success.svg
├── orchestrator-error.svg
├── orchestrator-spawning.svg
├── explore-idle.svg
├── explore-thinking.svg
├── explore-working.svg
├── explore-success.svg
├── explore-error.svg
└── ... (repeat for all 9 agents)
```

---

## Component Interfaces

### SquadPanel (Container)

**Purpose:** Root component that manages the collection of agents and orchestrates layout.

```typescript
interface SquadPanelProps {
  /** Current session ID to track agents for */
  sessionId: SessionId | null;

  /** Placement of the panel (affects layout) */
  placement?: 'left' | 'right' | 'bottom';

  /** Optional CSS className */
  className?: string;

  /** Callback when an agent is clicked */
  onAgentClick?: (agentId: string) => void;

  /** Enable/disable audio cues */
  audioEnabled?: boolean;
}

interface SquadPanelState {
  /** Map of agent ID → AgentCharacter */
  agents: Map<string, AgentCharacter>;

  /** ID of currently expanded agent (for log panel) */
  expandedAgentId: string | null;

  /** ID of orchestrator agent (always present) */
  orchestratorId: string;
}
```

**Responsibilities:**
- Use `useAgentTracking(sessionId)` hook to get agent collection
- Manage `expandedAgentId` state for log panel visibility
- Render AgentRow with orchestrator + subagents
- Render AgentLogPanel conditionally below clicked agent

---

### AgentRow (Layout)

**Purpose:** Handles responsive layout arrangement of agents.

```typescript
interface AgentRowProps {
  /** The orchestrator agent (center, 1.5x size) */
  orchestrator: AgentCharacter;

  /** Subagents to distribute on left/right */
  subagents: AgentCharacter[];

  /** Currently expanded agent ID (for visual indicator) */
  expandedAgentId: string | null;

  /** Callbacks */
  onAgentHover: (agentId: string, isHovering: boolean) => void;
  onAgentClick: (agentId: string) => void;
}
```

**Responsibilities:**
- Split subagents into left/right arrays
- Render orchestrator in center at 1.5x scale
- Apply responsive layout (collapse to icon grid on narrow viewports)
- Pass hover/click events up to parent

---

### AgentCharacterCard

**Purpose:** Individual agent card with visual character, status, and interaction handling.

```typescript
interface AgentCharacterCardProps {
  /** Agent data */
  agent: AgentCharacter;

  /** Size variant */
  size: 'orchestrator' | 'subagent';

  /** Is this agent currently expanded? */
  isExpanded: boolean;

  /** Callbacks */
  onHover: (isHovering: boolean) => void;
  onClick: () => void;

  /** Optional CSS className */
  className?: string;
}

interface AgentCharacterCardState {
  /** Is mouse hovering? */
  isHovered: boolean;

  /** Eye tracking position (for hover effect) */
  eyePosition: { x: number; y: number } | null;
}
```

**Responsibilities:**
- Render AgentAvatar with current status
- Render AgentStatusBar (visible on hover or when expanded)
- Handle mouse enter/leave for hover effects
- Handle click to toggle expanded state
- Apply scale transform on hover (1.05-1.1x)
- Track cursor position for eye-following effect

---

### AgentAvatar

**Purpose:** Pure presentational component for character visual with expression states and aura.

```typescript
interface AgentAvatarProps {
  /** Agent role (determines color scheme + artwork) */
  role: AgentRole;

  /** Current status (determines expression) */
  status: AgentStatus;

  /** Is hovering? (affects aura intensity) */
  isHovered: boolean;

  /** Eye tracking target (for hover effect) */
  eyeTarget: { x: number; y: number } | null;

  /** Size variant */
  size: 'orchestrator' | 'subagent';

  /** Optional CSS className */
  className?: string;
}
```

**Responsibilities:**
- Load appropriate character artwork based on role + status
- Render aura div with glow effect (intensity based on status + hover)
- Apply CSS animation classes based on status:
  - idle: gentle float + blink
  - thinking: sway animation
  - working: active pulse
  - success: sparkle burst
  - error: jolt + recover
  - spawning: materialize fade-in
- Apply eye-tracking transform when eyeTarget is provided

**CSS Classes:**
- `.agent-avatar-{role}` (color scheme)
- `.agent-avatar-{status}` (animation state)
- `.agent-avatar-hovered` (aura intensity boost)
- `.agent-avatar-{size}` (scale multiplier)

---

### AgentStatusBar

**Purpose:** Displays agent name, archetype, current action, and progress.

```typescript
interface AgentStatusBarProps {
  /** Agent character data */
  agent: AgentCharacter;

  /** Is hovering? (affects visibility of progress bar) */
  isHovered: boolean;

  /** Is expanded? (keeps status visible) */
  isExpanded: boolean;

  /** Optional CSS className */
  className?: string;
}
```

**Responsibilities:**
- Show name + archetype label (always visible)
- Show currentAction text (visible on hover or expanded)
- Show progress bar (visible on hover or expanded, animated fill)
- Apply smooth opacity transitions

**CSS Classes:**
- `.agent-status-bar`
- `.status-bar-visible` (hover or expanded)
- `.status-bar-progress` (animated width transition)

---

### AgentLogPanel

**Purpose:** Expandable log display that unfolds inline beneath an agent card.

```typescript
interface AgentLogPanelProps {
  /** Agent whose logs to display */
  agent: AgentCharacter;

  /** Is this panel expanded? */
  isExpanded: boolean;

  /** Max height before scrolling */
  maxHeight?: number;

  /** Optional CSS className */
  className?: string;
}
```

**Responsibilities:**
- Render list of LogBubble components from agent.logs
- Apply expand/collapse animation (height + opacity)
- Auto-scroll to bottom when new logs arrive
- Apply border color matching agent's glow color

**CSS Classes:**
- `.agent-log-panel`
- `.log-panel-expanded` (height animation trigger)
- `.log-panel-border-{role}` (border color per agent)

---

### LogBubble

**Purpose:** Individual log message with timestamp and type-based styling.

```typescript
interface LogBubbleProps {
  /** Log entry data */
  log: AgentLog;

  /** Optional CSS className */
  className?: string;
}
```

**Responsibilities:**
- Display timestamp in readable format
- Display message text
- Apply background color based on log.type
- Render subtle icon indicator for colorblind users

**CSS Classes:**
- `.log-bubble`
- `.log-bubble-{type}` (info/success/error/thinking/warning)

---

## State Management Approach

### Primary Hook: useAgentTracking

**Purpose:** Listens to WebSocket events and maintains a map of active agents with their current state.

**Location:** `packages/app/src/hooks/useAgentTracking.ts`

```typescript
interface UseAgentTrackingResult {
  /** Map of agentId → AgentCharacter */
  agents: Map<string, AgentCharacter>;

  /** Orchestrator agent (always present) */
  orchestrator: AgentCharacter | null;

  /** List of subagents (excludes orchestrator) */
  subagents: AgentCharacter[];
}

export function useAgentTracking(
  sessionId: SessionId | null
): UseAgentTrackingResult;
```

**Logic:**
1. Use `useWebSocketContext()` to access onEvent
2. Register event callback that filters by sessionId
3. Maintain internal Map<agentId, AgentCharacter>
4. Event mappings:
   - `session:started` → Create orchestrator agent (status: idle)
   - `chain:compiled` → Create plan agent (status: thinking)
   - `step:spawned` → Create agent based on action field (status: spawning → idle)
   - `step:started` → Update agent status to working, set currentAction
   - `step:completed` → Update agent status to success, add success log
   - `step:failed` → Update agent status to error, add error log
   - `step:output` → Add info log to agent
   - `chain:completed` → Update orchestrator status based on overall result
5. Auto-cleanup: Remove agents that have been idle for >30s (configurable)
6. Return memoized agents map, orchestrator, and subagents array

**Dependencies:**
- `useWebSocketContext` (from `contexts/WebSocketContext.tsx`)
- `useState` + `useEffect` + `useMemo` (React)
- `eventGuards` (from `@afw/shared`)

---

### Secondary Hook: useAgentInteractions

**Purpose:** Manages hover state, click state, and eye-tracking calculations.

**Location:** `packages/app/src/hooks/useAgentInteractions.ts`

```typescript
interface UseAgentInteractionsResult {
  /** Currently hovered agent ID */
  hoveredAgentId: string | null;

  /** Set hovered agent */
  setHoveredAgent: (agentId: string | null) => void;

  /** Currently expanded agent ID */
  expandedAgentId: string | null;

  /** Toggle expanded state for an agent */
  toggleExpanded: (agentId: string) => void;

  /** Calculate eye target position from mouse event */
  calculateEyeTarget: (
    event: React.MouseEvent,
    agentElement: HTMLElement
  ) => { x: number; y: number };
}

export function useAgentInteractions(): UseAgentInteractionsResult;
```

**Logic:**
1. `useState` for hoveredAgentId and expandedAgentId
2. `toggleExpanded` collapses previous agent and expands new one (or collapses current)
3. `calculateEyeTarget` computes normalized coordinates relative to avatar center
4. Return handlers and state

---

### Context Usage

**No new context required.** The component will use the existing `WebSocketContext` via the `useAgentTracking` hook.

---

## CSS Animation Keyframes

**Location:** `packages/app/src/components/SquadPanel/animations.css`

### Core Animations

```css
/* Idle state: gentle float + blink */
@keyframes agent-float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-8px); }
}

@keyframes agent-blink {
  0%, 90%, 100% { opacity: 1; }
  95% { opacity: 0; }
}

/* Thinking state: sway motion */
@keyframes agent-sway {
  0%, 100% { transform: rotate(-2deg); }
  50% { transform: rotate(2deg); }
}

/* Working state: active pulse */
@keyframes agent-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

/* Success state: sparkle burst */
@keyframes agent-sparkle {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.2); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}

/* Error state: jolt + recover */
@keyframes agent-jolt {
  0% { transform: translateX(0); }
  25% { transform: translateX(-10px); }
  50% { transform: translateX(10px); }
  75% { transform: translateX(-5px); }
  100% { transform: translateX(0); }
}

/* Spawning state: materialize fade-in */
@keyframes agent-spawn {
  0% { opacity: 0; transform: scale(0.5); }
  100% { opacity: 1; transform: scale(1); }
}

/* Aura pulse (intensity varies by state) */
@keyframes aura-pulse-idle {
  0%, 100% { opacity: 0.3; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.1); }
}

@keyframes aura-pulse-active {
  0%, 100% { opacity: 0.6; transform: scale(1); }
  50% { opacity: 0.8; transform: scale(1.15); }
}

@keyframes aura-pulse-error {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.7; }
}

/* Expand/collapse animation for log panel */
@keyframes log-panel-expand {
  from {
    max-height: 0;
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    max-height: 400px;
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes log-panel-collapse {
  from {
    max-height: 400px;
    opacity: 1;
    transform: translateY(0);
  }
  to {
    max-height: 0;
    opacity: 0;
    transform: translateY(-10px);
  }
}

/* Hover scale animation */
@keyframes agent-hover {
  from { transform: scale(1); }
  to { transform: scale(1.1); }
}

/* Progress bar fill animation */
@keyframes progress-fill {
  from { width: 0%; }
  to { width: var(--progress-width); }
}
```

### Easing Functions

```css
:root {
  --ease-natural: cubic-bezier(0.25, 0.8, 0.25, 1);
  --ease-ghibli: cubic-bezier(0.4, 0.0, 0.2, 1);
  --ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
}
```

### Accessibility Support

```css
@media (prefers-reduced-motion: reduce) {
  /* Disable all animations except essential UI feedback */
  .agent-avatar,
  .agent-aura,
  .log-panel {
    animation: none !important;
    transition: opacity 0.2s ease, transform 0.2s ease;
  }

  /* Keep only click/hover scale for usability feedback */
  .agent-character-card:hover {
    transform: scale(1.05);
    transition: transform 0.2s ease;
  }
}
```

---

## Integration Points

### 1. Main Application Layout

**File:** `packages/app/src/App.tsx` or layout component

**Integration:**
```tsx
import { SquadPanel } from './components/SquadPanel';

function AppLayout() {
  const { currentSessionId } = useSession(); // Existing session context

  return (
    <div className="app-layout">
      <SidePanel position="left">
        <SquadPanel
          sessionId={currentSessionId}
          placement="left"
          audioEnabled={settings.audioEnabled}
        />
      </SidePanel>

      <MainContent>
        {/* Existing dashboard content */}
      </MainContent>
    </div>
  );
}
```

### 2. WebSocketContext

**Already integrated.** The `useAgentTracking` hook will consume the existing context.

### 3. Shared Types

**File:** `packages/app/src/components/SquadPanel/types.ts` (already exists)

**Imports needed:**
```typescript
import type { SessionId, StepNumber } from '@afw/shared';
import type { WorkspaceEvent } from '@afw/shared';
```

### 4. Event Mapping Strategy

**Key decision:** Map WebSocket event actions to agent roles.

**Mapping table:**

| Event Action Field | Agent Role | Notes |
|-------------------|-----------|-------|
| `explore`, `search`, `discover` | explore | File system navigation |
| `plan`, `design`, `architect` | plan | Planning and design tasks |
| `bash`, `shell`, `execute` | bash | Terminal commands |
| `read`, `parse`, `analyze` | read | File reading |
| `write`, `create`, `generate` | write | File creation |
| `edit`, `modify`, `update` | edit | File modifications |
| `grep`, `search`, `find` | grep | Content search |
| `glob`, `match`, `pattern` | glob | File pattern matching |
| `orchestrator` (special) | orchestrator | Session-level events |

**Fallback:** If action doesn't match any pattern, default to `orchestrator` role.

### 5. Asset Loading

**Placeholder strategy for Phase 1:**
- Use CSS background colors + emoji/Unicode symbols for character representations
- Aura effects via CSS box-shadow + radial-gradient
- Future: Replace with SVG artwork from design phase

**Example placeholder:**
```tsx
// AgentAvatar.tsx
function getAgentEmoji(role: AgentRole): string {
  const emojiMap = {
    orchestrator: '👨‍🎤',
    explore: '🔭',
    plan: '♟️',
    bash: '🔧',
    read: '📖',
    write: '✍️',
    edit: '✂️',
    grep: '🔍',
    glob: '🗺️',
  };
  return emojiMap[role];
}
```

### 6. Responsive Breakpoints

**Breakpoints to support:**

| Breakpoint | Behavior |
|-----------|----------|
| `>= 1200px` | Full layout: orchestrator center, subagents flanking |
| `768px - 1199px` | Compact: orchestrator center, subagents in 2 columns |
| `< 768px` | Icon grid: all agents same size, 3x3 grid, tap for details |

### 7. Testing Integration Points

**Files to create tests for:**
- `useAgentTracking.test.ts` - Mock WebSocket events, verify agent state updates
- `SquadPanel.test.tsx` - Render tests with mock agent data
- `AgentCharacterCard.test.tsx` - Interaction tests (hover, click, expand)

---

## Implementation Order

### Phase 1: Core Structure (No animations, placeholder visuals)
1. Create `types.ts` (extend existing)
2. Create `useAgentTracking` hook with basic event mapping
3. Create `SquadPanel` container component with placeholder layout
4. Create `AgentCharacterCard` with basic hover/click handling
5. Create `AgentAvatar` with emoji placeholders + CSS color backgrounds
6. Create `AgentStatusBar` with text-only display
7. Verify: Agents appear and update status based on mocked events

### Phase 2: Interactions + Log Panel
8. Create `useAgentInteractions` hook with expand/collapse logic
9. Create `AgentLogPanel` with expand/collapse animation
10. Create `LogBubble` with color-coded styling
11. Integrate log panel into SquadPanel (render conditionally)
12. Verify: Click agent → log panel expands, shows logs, collapses on re-click

### Phase 3: Animations + Visual Polish
13. Create `animations.css` with all keyframes
14. Add animation classes to `AgentAvatar.css` (float, sway, pulse, etc.)
15. Add aura pulse effects to `AgentAvatar.css`
16. Add hover scale + eye tracking to `AgentCharacterCard`
17. Add progress bar animation to `AgentStatusBar`
18. Verify: All animations trigger correctly, respect prefers-reduced-motion

### Phase 4: Responsive Layout
19. Create `AgentRow` component with flexible layout
20. Add responsive CSS breakpoints to all component stylesheets
21. Test on narrow viewports (icon grid mode)
22. Verify: Layout adapts smoothly across breakpoints

### Phase 5: Asset Integration (Future)
23. Replace emoji placeholders with SVG character artwork
24. Add expression state artwork variants (idle, thinking, working, etc.)
25. Optimize asset loading (lazy load, sprite sheets)
26. Verify: Artwork displays correctly, loads efficiently

---

## Dependencies

### New Dependencies
**None.** All animations are CSS-based. All state management uses existing React hooks and WebSocketContext.

### Existing Dependencies
- `react` (18.2) - Already installed
- `@afw/shared` - Already installed (for types + event guards)
- `WebSocketContext` - Already implemented at `packages/app/src/contexts/WebSocketContext.tsx`

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Event mapping ambiguity** - Some actions may not clearly map to a single agent role | Medium | Implement fallback logic; use orchestrator as default; add logging to track unmapped actions for refinement |
| **Animation performance** - Multiple agents with simultaneous animations could cause jank | Medium | Use CSS transforms (GPU-accelerated); limit aura pulse to requestAnimationFrame; add performance monitoring |
| **State synchronization** - Agent state may desync if events arrive out of order | Low | Add event sequence numbers; implement optimistic updates with reconciliation; use timestamp-based deduplication |
| **Accessibility** - Complex animations may violate WCAG motion guidelines | High | Implement prefers-reduced-motion; provide text-only fallback mode; test with screen readers |
| **Memory leaks** - Long-running sessions may accumulate logs without cleanup | Medium | Implement log rotation (keep last 100 entries per agent); auto-cleanup idle agents after 30s; add memory usage monitoring |
| **Responsive layout complexity** - Orchestrator + flanking subagents may not adapt well to narrow viewports | Low | Implement progressive layout degradation; test across breakpoints; add icon-only fallback mode |

---

## Verification Checklist

### Phase 1 Completion
- [ ] `useAgentTracking` hook returns map of agents based on WebSocket events
- [ ] SquadPanel renders orchestrator in center, subagents on sides
- [ ] AgentCharacterCard displays agent name, archetype, and status
- [ ] Agent status updates in real-time when events arrive
- [ ] No console errors or TypeScript warnings

### Phase 2 Completion
- [ ] Clicking an agent expands log panel inline
- [ ] Log panel displays color-coded log bubbles
- [ ] Clicking expanded agent collapses log panel
- [ ] Log panel auto-scrolls to bottom on new log entries
- [ ] Expand/collapse animation is smooth (300-400ms duration)

### Phase 3 Completion
- [ ] Idle agents float gently with slow blink animation
- [ ] Working agents show active pulse animation
- [ ] Success agents show sparkle burst animation
- [ ] Error agents show jolt animation
- [ ] Aura intensity matches status (idle: dim, working: bright, error: flicker)
- [ ] Hover triggers scale-up (1.1x) and brightens aura
- [ ] Progress bar animates smoothly to current percentage
- [ ] All animations respect prefers-reduced-motion setting

### Phase 4 Completion
- [ ] Layout adapts correctly at 1200px breakpoint (compact mode)
- [ ] Layout adapts correctly at 768px breakpoint (icon grid mode)
- [ ] Touch interactions work on mobile devices
- [ ] Log panel becomes modal on narrow viewports
- [ ] No horizontal overflow or layout breaks

### Phase 5 Completion (Future)
- [ ] SVG artwork loads and displays correctly for all agents
- [ ] Expression state transitions are smooth (cross-fade)
- [ ] Asset loading does not block UI rendering
- [ ] Total asset bundle size is acceptable (<2MB)

---

## Future Enhancements

### Audio Integration
- Implement subtle UI sound cues (spawn, complete, error)
- Use Web Audio API with volume control
- Provide audio toggle in settings
- Respect user's system audio preferences

### Advanced Interactions
- Drag agents to reorder (priority hints)
- Click-and-hold for quick actions (pause, skip, retry)
- Double-click to jump to related step in ReactFlow canvas
- Right-click context menu for agent-specific actions

### Analytics Overlays
- Show agent utilization heatmap (how often each agent is used)
- Display average completion time per agent
- Show error rate per agent type
- Provide "most active agent" badge

### Accessibility++
- Add ARIA live regions for screen reader announcements
- Provide keyboard navigation (Tab through agents, Enter to expand)
- Add high-contrast mode toggle
- Support voice commands for agent interaction (future WebSpeech API)

---

## Learnings

**Issue:** None — execution proceeded as expected.

**Root Cause:** N/A

**Suggestion:** N/A

**[FRESH EYE]**

During codebase exploration, I discovered:

1. **Existing pattern detector framework** - The app already has pattern detection logic in `packages/app/src/utils/chainTypeDetection.ts` that could be extended to improve agent role mapping accuracy. We could analyze step action patterns over time to auto-classify ambiguous actions.

2. **Animation queue pattern** - The `useFlowAnimations` hook implements a staggered animation queue with `ANIMATION_STAGGER_DELAY`. This same pattern should be reused for SquadPanel to prevent simultaneous agent animations from overlapping (e.g., when multiple agents spawn at once).

3. **Event guards library** - The shared package provides `eventGuards` helper functions (e.g., `isStepSpawned`, `isStepStarted`) that should be used consistently in `useAgentTracking` instead of manual event.type checks. This ensures type safety and prevents typos.

4. **Dark mode architecture** - Several existing components use `@media (prefers-color-scheme: dark)` for dark mode. SquadPanel should follow this pattern, but I also noticed no global theme context exists. Consider adding a theme context in the future to support manual dark/light mode toggle beyond OS preference.

5. **Memory management precedent** - The `useWebSocket` hook in `packages/app/src/hooks/useWebSocket.ts` already implements connection cleanup and event callback deregistration. The `useAgentTracking` hook should follow the same cleanup pattern to prevent memory leaks when sessionId changes.

These discoveries inform the implementation approach and should be documented for the coding phase.
