# Analysis: Frontend Component Behavioral Catalog

**Agent:** analyze
**Date:** 2026-02-10
**Session:** frontend-component-behavioral-catalog_2026-02-10-13-15-00

---

## Task

Produce a comprehensive behavioral catalog of all ActionFlows Dashboard frontend components to support:
- Health check schema design
- E2E test creation
- Component contract validation
- System architecture documentation

---

## Scope

- **Directories:** `packages/app/src/components/`, `packages/app/src/contexts/`, `packages/app/src/hooks/`
- **Inventory:** 110 components, 38 hooks, 7 contexts
- **Depth:** Full behavioral contracts including lifecycle, state, interactions, side effects, event flows

---

## Deliverables

### Primary Output

**File:** `COMPONENT_BEHAVIORAL_CATALOG.md`
**Size:** ~87KB
**Sections:** 18 major sections + appendix

### Coverage

1. **Context Providers (6)** — Global state management with WebSocket, Workbench, Theme, Toast, Vim, Discuss systems
2. **Core Layout (4)** — App shell, workbench navigation, session sidebar, top bar
3. **Session Panel System (4)** — 25/75 split architecture with chat, visualization, resize
4. **Visualization (3)** — ReactFlow integration, animated nodes, DAG layout
5. **Terminal (2)** — Claude CLI + generic terminal with xterm.js
6. **Discussion System (3)** — DiscussButton pattern with context-based routing
7. **Custom Hooks (38)** — Data fetching, state management, controls, WebSocket, notifications, file system, UI state
8. **Workbenches (12)** — Work, maintenance, explore, review, archive, settings, PM, harmony, canvas, editor, intel, respect
9. **Small/Reusable (9)** — Badges, toggles, indicators, palettes, toasts
10. **Interaction Patterns (5)** — Parent-child props, context communication, hooks, WebSocket events, discuss flow
11. **Side Effects** — HTTP requests (11 endpoints), WebSocket events (11 types), localStorage (4 keys), timers (7 types)
12. **Re-render Triggers** — 5 sources with component-specific breakdowns
13. **Mount Lifecycle** — 13-step initialization order + session attach flow + WebSocket update flow
14. **Error Handling** — HTTP, WebSocket, error boundary patterns
15. **Testing Recommendations** — Unit, integration, E2E test categories
16. **Performance** — Memoization, callback stability, virtualization, bundle size
17. **Accessibility** — Keyboard navigation, ARIA labels, screen reader support
18. **Future Schema** — Proposed behavioral contract TypeScript interface

---

## Key Findings

### Architecture Patterns

1. **Context-Centric State**
   - 6 global contexts for cross-cutting concerns
   - Ref-based registration for DiscussContext (zero re-renders)
   - localStorage persistence for user preferences

2. **WebSocket-First Updates**
   - Real-time event streaming to all subscribed components
   - Automatic fallback to HTTP polling (5s interval) after 3 failures
   - Heartbeat ping (25s) + timeout (30s) for stale detection

3. **ReactFlow Visualization**
   - Swimlane layout algorithm for chain steps
   - Animated nodes with status-based transitions
   - Memoized node/edge computation for performance

4. **Session Panel 25/75 Split**
   - Resizable with localStorage persistence per session
   - ChatPanel with integrated session info header
   - FlowVisualization with ReactFlow controls

5. **DiscussButton Pattern**
   - 41+ components with "Let's Discuss" button
   - Context-based routing to ChatPanel input
   - Zero rewiring required (ref-based registration)

### Component Interactions

**Communication Channels:**
- Props down, callbacks up (standard React)
- Context for global state (6 providers)
- WebSocket events for real-time updates (11 event types)
- Custom hooks for complex logic (38 hooks)

**Event Flow Example (Session Attachment):**
```
User clicks session
→ SessionSidebar.onClick(sessionId)
→ WorkbenchLayout.handleAttachSession(sessionId)
→ HTTP GET /api/sessions/:sessionId
→ setState(attachedSessions)
→ WorkWorkbench re-renders
→ SessionPanelLayout subscribes to WebSocket
→ ChatPanel extracts messages
→ FlowVisualization renders nodes
```

### Side Effects Inventory

**HTTP Requests:** 11 API endpoints
- GET /api/sessions (mount)
- POST /api/sessions (new session)
- DELETE /api/sessions/:id (delete)
- POST /api/sessions/:id/commands (controls)
- POST /api/claude-cli/:id/input (terminal)
- GET /api/files/tree (explorer)
- GET /api/harmony/metrics (health)

**WebSocket Events:** 11 event types
- session:started/ended/deleted
- chain:started
- step:started/completed/failed
- claude-cli:output/exited
- file:changed
- registry-event

**LocalStorage:** 4 persisted keys
- afw-active-workbench
- actionflows:theme
- actionflows:vim:enabled
- session-panel-split-ratio-${sessionId}

**Timers:** 7 timer types
- WebSocket reconnect (3s-30s backoff)
- Heartbeat timeout (30s)
- Ping interval (25s)
- Polling fallback (5s)
- Toast dismiss (3s)
- Workbench transition (180ms)
- ReactFlow fitView (100ms)

### Performance Insights

**Memoization:**
- FlowVisualization: nodes, edges, swimlane layout
- All context providers: context value
- WebSocket handleMessage: stable empty deps

**Bundle Size Concerns:**
- ReactFlow: 300KB+
- xterm.js: 200KB+
- Monaco Editor: 500KB+

**Virtualization Gaps:**
- SessionSidebar: Long session lists (not implemented)
- ChatPanel: Long message histories (not implemented)
- FileTree: Deep directories (not implemented)

### Testing Gaps

**Current State:**
- 1 unit test file (useCustomPromptButtons.test.ts)
- 1 component test file (AgentCharacterCard.test.tsx)
- No integration tests
- No E2E tests

**Recommendations:**
1. Unit tests for all custom hooks (38 hooks)
2. Integration tests for context + component pairs (6 providers)
3. E2E tests for critical flows (session lifecycle, chat, visualization)

---

## Behavioral Contract Schema Design

### Proposed TypeScript Interface

```typescript
interface ComponentBehavioralContract {
  componentName: string;
  filePath: string;
  dependencies: {
    contexts: string[];
    hooks: string[];
    children: string[];
  };
  state: {
    local: StateField[];
    context: ContextField[];
  };
  props: PropField[];
  lifecycle: {
    mount: SideEffect[];
    unmount: SideEffect[];
    effects: EffectRule[];
  };
  interactions: {
    userEvents: UserEventHandler[];
    webSocketEvents: WebSocketEventHandler[];
    apiCalls: APICallDefinition[];
  };
  renders: {
    conditions: RenderCondition[];
    children: ChildComponent[];
  };
  healthChecks: {
    critical: HealthCheck[];
    warning: HealthCheck[];
  };
}
```

### Health Check Categories

**Critical (System-Breaking):**
- Context registration (ChatPanel → DiscussContext)
- WebSocket connection timeout (5s)
- API endpoint availability
- Required props presence

**Warning (Degraded Experience):**
- Data fetch timeout (2s)
- Slow render performance (>100ms)
- Missing optional features
- Accessibility violations

---

## Usage

This catalog serves as the **source of truth** for:

1. **Health Check Implementation**
   - Extract critical dependencies from each component
   - Generate automated checks for lifecycle requirements
   - Validate WebSocket subscriptions and API calls

2. **E2E Test Creation**
   - Use event flows to generate test scenarios
   - Map user interactions to expected state changes
   - Validate side effects (HTTP, WebSocket, localStorage)

3. **Architecture Documentation**
   - Component render trees for onboarding
   - Interaction patterns for new features
   - Performance considerations for optimization

4. **Contract Validation**
   - Ensure props match behavioral expectations
   - Verify context consumption patterns
   - Validate hook dependencies

---

## Next Steps

1. **Generate Health Check Schema** (plan agent)
   - Design JSON schema for behavioral contracts
   - Define health check rules per component type
   - Create validation tooling

2. **Implement E2E Tests** (code agent)
   - Session lifecycle tests
   - Workbench navigation tests
   - Chat interaction tests
   - Visualization tests

3. **Add Unit Tests** (code agent)
   - Test all 38 custom hooks
   - Test pure components (badges, toggles)
   - Test context providers

4. **Performance Audit** (analyze agent)
   - Profile re-render frequency
   - Measure bundle size impact
   - Identify virtualization opportunities

---

## Files

- `COMPONENT_BEHAVIORAL_CATALOG.md` — Full component inventory with behavioral contracts

---

**Agent:** analyze
**Model:** claude-sonnet-4-5-20250929
**Status:** Complete
