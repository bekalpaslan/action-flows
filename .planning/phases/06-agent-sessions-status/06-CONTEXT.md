# Phase 6: Agent Sessions & Status - Context

**Gathered:** 2026-04-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Build the SessionManager backend service that creates and manages persistent Claude sessions per workbench via Agent SDK. Implement lazy session activation with a ~30s grace period on workbench switch. Create a dedicated agent status panel (task manager style). Add manual session start/stop controls. Implement health monitoring with toast notifications and auto-reconnect. Wire session lifecycle through WebSocket to frontend.

</domain>

<decisions>
## Implementation Decisions

### Session Lifecycle
- **D-01:** Grace period on workbench switch — previous session stays live for ~30s after switching, in case user switches back quickly. Then suspends. Saves tokens while avoiding unnecessary reconnection churn.
- **D-02:** Only the active workbench (plus any in grace period) holds a live session. All others are suspended.
- **D-03:** Backend SessionManager is the sole owner of Agent SDK calls — frontend communicates via WebSocket only (carried from REQUIREMENTS).

### Status Dashboard
- **D-04:** Dedicated collapsible status panel at the bottom of the workspace — shows all agents: name, workbench, status (running/suspended/idle/error), elapsed time. Like a task manager.
- **D-05:** No sidebar badges for status — the dedicated panel is the single source of truth for session state.

### Manual Control
- **D-06:** Users can manually start or stop any workbench session from the status panel. Power user control over token spend. Force-start spins up a session for a workbench you're not currently viewing. Force-stop kills a session immediately (no grace period).

### Health & Recovery
- **D-07:** Toast notification when a session disconnects + auto-reconnect in background. Status panel shows real-time state. Non-intrusive — user isn't blocked.
- **D-08:** Session resurrection from local conversation logs as source of truth (per research — remote sessions can silently disconnect).
- **D-09:** Health monitor with heartbeat-based detection (<30s latency per research).

### Claude's Discretion
- Agent SDK `resume` vs `streamInput` for session persistence
- Session ID storage mechanism (localStorage, backend state, or both)
- Status panel positioning (bottom of workspace vs floating)
- Grace period exact duration (30s is approximate)
- How to handle multiple sessions during grace period overlap
- Token budget tracking/display (if feasible)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Agent SDK
- `.planning/research/STACK.md` — @anthropic-ai/claude-agent-sdk v0.2.89, resume, streamInput, forkSession

### Architecture
- `.planning/research/ARCHITECTURE.md` — SessionManager as backend-only service, WebSocket hub for frontend communication
- `.planning/research/PITFALLS.md` — P1 (token explosion), P2 (silent disconnects), P9 (Electron process leaks)

### WebSocket Infrastructure (Phase 2 output)
- `packages/backend/src/ws/hub.ts` — Channel-per-workbench routing
- `packages/app/src/lib/ws-client.ts` — Frontend WebSocket singleton

### Design System (Phase 3 output)
- `packages/app/src/components/ui/index.ts` — Component library for status panel UI

</canonical_refs>

<code_context>
## Existing Code Insights

### What Gets Created
- Backend: SessionManager service (create, resume, suspend, stop, health check)
- Backend: Session lifecycle routes or WebSocket message handlers
- Frontend: Agent status panel component (collapsible, task manager style)
- Frontend: Session zustand store (per-workbench session state, health)
- Frontend: Toast integration for session events

### What Gets Extended
- Backend WebSocket hub — session lifecycle messages
- Frontend uiStore — status panel visibility toggle
- Backend index.ts — SessionManager initialization

### Integration Points
- Chat panel (Phase 7) will consume session state from this phase
- Neural validation (Phase 8) hooks into active sessions via /btw
- Pipeline visualizer (Phase 5) gets chain events from sessions

</code_context>

<specifics>
## Specific Ideas

The status panel should feel like Activity Monitor / Task Manager — clean table with sortable columns, clear status indicators, action buttons (start/stop) per row. When all sessions are idle, the panel should be minimal. When agents are working, it should feel alive with real-time updates.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 06-agent-sessions-status*
*Context gathered: 2026-04-02*
