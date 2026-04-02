# Phase 6: Agent Sessions & Status - Research

**Researched:** 2026-04-02
**Domain:** Persistent Claude sessions per workbench via Agent SDK, session lifecycle management, multi-agent status dashboard
**Confidence:** HIGH

## Summary

Phase 6 connects each workbench to a persistent Claude Code session managed by the `@anthropic-ai/claude-agent-sdk` (v0.2.90). The backend SessionManager is the sole owner of Agent SDK calls; the frontend communicates exclusively via the existing WebSocket hub. The phase has two major deliverables: (1) a backend SessionManager service handling session create/resume/suspend/stop/health-check lifecycle, and (2) a frontend AgentStatusPanel (task-manager-style collapsible panel) with toast notifications via sonner.

The Agent SDK provides two API surfaces: the stable V1 `query()` async generator and the preview V2 `unstable_v2_createSession()`/`unstable_v2_resumeSession()` with `send()`/`stream()`. V1 is the correct choice for production -- V2 is explicitly marked unstable and lacks features like session forking. Key API capabilities for this phase: `resume` option for session persistence, `startup()` for pre-warming (20x faster first query), `listSessions()` for discovery, `getSessionMessages()` for history, and `forkSession` for branching. Session state persists automatically to `~/.claude/projects/`.

The frontend builds on completed Phase 3 (design system), Phase 4 (layout), and Phase 5 (pipeline) infrastructure. The status panel integrates as a third vertical Panel in WorkspaceArea. The sessionStore (zustand) manages per-workbench session state. WebSocket events drive all state transitions -- no polling.

**Primary recommendation:** Use the V1 `query()` API with `resume` option for session persistence. Backend SessionManager owns all Agent SDK calls. Frontend receives session lifecycle events through the existing WSEnvelope-based WebSocket hub channel system.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Grace period on workbench switch -- previous session stays live for ~30s after switching, in case user switches back quickly. Then suspends. Saves tokens while avoiding unnecessary reconnection churn.
- **D-02:** Only the active workbench (plus any in grace period) holds a live session. All others are suspended.
- **D-03:** Backend SessionManager is the sole owner of Agent SDK calls -- frontend communicates via WebSocket only (carried from REQUIREMENTS).
- **D-04:** Dedicated collapsible status panel at the bottom of the workspace -- shows all agents: name, workbench, status (running/suspended/idle/error), elapsed time. Like a task manager.
- **D-05:** No sidebar badges for status -- the dedicated panel is the single source of truth for session state.
- **D-06:** Users can manually start or stop any workbench session from the status panel. Power user control over token spend. Force-start spins up a session for a workbench you're not currently viewing. Force-stop kills a session immediately (no grace period).
- **D-07:** Toast notification when a session disconnects + auto-reconnect in background. Status panel shows real-time state. Non-intrusive -- user isn't blocked.
- **D-08:** Session resurrection from local conversation logs as source of truth (per research -- remote sessions can silently disconnect).
- **D-09:** Health monitor with heartbeat-based detection (<30s latency per research).

### Claude's Discretion
- Agent SDK `resume` vs `streamInput` for session persistence
- Session ID storage mechanism (localStorage, backend state, or both)
- Status panel positioning (bottom of workspace vs floating)
- Grace period exact duration (30s is approximate)
- How to handle multiple sessions during grace period overlap
- Token budget tracking/display (if feasible)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SESSION-01 | Persistent Claude session per workbench via Agent SDK | Agent SDK `query()` with `resume` option; `startup()` for pre-warm; V1 stable API verified at v0.2.90 |
| SESSION-02 | Lazy session activation -- only active workbench holds a live session | Grace period pattern (D-01/D-02); `AbortController` for session cleanup; suspend-to-disk model |
| SESSION-03 | Session resume across app restarts via `--resume` with session ID mapping | `resume` option on `query()`; sessions persist to `~/.claude/projects/` automatically; `listSessions(dir)` for discovery |
| SESSION-04 | Session health monitoring with heartbeat-based detection (<30s latency) | Backend heartbeat interval with `query.initializationResult()` check; health state broadcast via WSEnvelope |
| SESSION-05 | Session resurrection using local conversation logs as source of truth | `getSessionMessages(sessionId)` for history replay; `listSessions()` for session discovery after crash |
| SESSION-06 | Backend (SessionManager) is sole owner of Agent SDK calls -- frontend communicates via WebSocket only | Existing WebSocketHub + WSEnvelope infrastructure from Phase 2; new session event types on system channel |
| SESSION-07 | Session history searchable per workbench via `listSessions()` + `getSessionMessages()` | Both functions verified in Agent SDK v0.2.90 API; pagination via limit/offset |
| SESSION-08 | Workbench-scoped agent personality (Review = strict, Explore = curious, PM = strategic) | `systemPrompt` option on `query()`; `AgentDefinition` for subagent personality config |
| SESSION-09 | Session forking -- branch a conversation to explore alternatives | `forkSession` option on `query()`; V1 only (not in V2 preview) |
| STATUS-01 | Multi-agent status dashboard showing running agents, workbench, status, elapsed time | AgentStatusPanel component per UI-SPEC; sessionStore zustand pattern; reuses `useElapsedTime` from Phase 5 |
| STATUS-02 | Toast notification system for agent events | sonner 2.0.7 with custom theme; deduplication via `id` parameter; events mapped in UI-SPEC |
| STATUS-03 | SubagentStart/SubagentStop hooks feed agent lifecycle into status registry | Agent SDK `includeHookEvents` option (v0.2.89+); `hook_started`/`hook_response` message types |
</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@anthropic-ai/claude-agent-sdk` | 0.2.90 | Persistent Claude sessions per workbench | Official SDK. Provides `query()` with `resume`, `startup()` pre-warm, `listSessions()`, `getSessionMessages()`, `forkSession`. Replaces deprecated `@anthropic-ai/claude-code`. |
| `sonner` | 2.0.7 | Toast notifications for session events | Lightweight, accessible toast system. Built-in ARIA live region. Deduplication via `id` param. Confirmed latest on npm. |
| `zustand` | 5.0.12 | Session state store (already installed) | Existing pattern. New `sessionStore` follows `pipelineStore` and `uiStore` conventions. |

### Supporting (Already Installed)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `react-resizable-panels` | 4.8.0 | Status panel as collapsible bottom panel in WorkspaceArea | Panel/Separator/Group API already used for pipeline + content split |
| `lucide-react` | 1.7.0 | Status icons (Loader2, Circle, Pause, AlertCircle, Square, Play) | All icons specified in UI-SPEC |
| `class-variance-authority` | 0.7.1 | StatusDot component variants | CVA variant pattern for status colors |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| V1 `query()` API | V2 `unstable_v2_createSession()` | V2 is simpler for multi-turn but explicitly marked unstable, lacks `forkSession`, and APIs may change. V1 is stable and feature-complete. |
| `resume` option (V1) | `unstable_v2_resumeSession()` (V2) | Same tradeoff -- V2 is ergonomically cleaner but unstable. |
| sonner | react-hot-toast | react-hot-toast is unmaintained, has accessibility gaps. Sonner is recommended in project STACK.md. |
| Backend-only session ID storage | localStorage + backend | Backend-only is simpler. Backend is the sole session owner (D-03). Frontend reads session state via WebSocket, never stores session IDs. |

**Installation:**
```bash
# Backend: Agent SDK (new dependency)
cd packages/backend
pnpm add @anthropic-ai/claude-agent-sdk@^0.2.90

# Frontend: Toast library (new dependency)
cd packages/app
pnpm add sonner@^2.0.7
```

**Version verification:**
- `@anthropic-ai/claude-agent-sdk`: 0.2.90 (verified via `npm view` 2026-04-02)
- `sonner`: 2.0.7 (verified via `npm view` 2026-04-02)
- `zustand`: 5.0.12 (already installed)
- `react-resizable-panels`: 4.8.0 (already installed)
- `lucide-react`: 1.7.0 (already installed)

## Architecture Patterns

### Recommended Project Structure

```
packages/backend/src/
  services/
    sessionManager.ts           # SessionManager class -- creates, resumes, suspends, stops sessions
    sessionHealthMonitor.ts     # Heartbeat-based health check loop (<30s detection)
    sessionStore.ts             # Backend in-memory session state (workbenchId -> sessionId mapping)
  ws/
    hub.ts                      # Extended: session lifecycle event broadcasting
    handler.ts                  # Extended: session:start, session:stop message handling

packages/app/src/
  stores/
    sessionStore.ts             # Zustand: per-workbench session state (Map<WorkbenchId, WorkbenchSession>)
  hooks/
    useSessionEvents.ts         # WebSocket subscription: maps session events to sessionStore
    useSessionToasts.ts         # Fires sonner toasts on session lifecycle events
  workbenches/workspace/
    AgentStatusPanel.tsx         # Collapsible bottom panel with session table
    AgentStatusRow.tsx           # Single workbench row (status dot, name, status, elapsed, actions)
    SessionControls.tsx          # Start/stop action buttons with stop confirmation
    WorkspaceArea.tsx            # Extended: third vertical Panel for status panel
  workbenches/shell/
    AppShell.tsx                 # Extended: mount sonner <Toaster /> component
  components/ui/
    status-dot.tsx               # Reusable 8px dot with pulse animation variant
  styles/
    session.css                  # Pulse animation keyframes only

packages/shared/src/
  session-events.ts             # New session lifecycle event types for WSEnvelope
```

### Pattern 1: Backend SessionManager Service

**What:** Singleton service that maps WorkbenchId to Agent SDK sessions. Sole owner of all Agent SDK calls.

**When to use:** All session lifecycle operations (create, resume, suspend, stop, health check).

**Example:**
```typescript
// Source: Agent SDK v0.2.90 official docs + project architecture patterns
import { query, listSessions, getSessionMessages, startup } from '@anthropic-ai/claude-agent-sdk';
import type { Query, SDKMessage } from '@anthropic-ai/claude-agent-sdk';

interface ManagedSession {
  workbenchId: string;
  sessionId: string | null;
  query: Query | null;
  status: 'stopped' | 'connecting' | 'idle' | 'running' | 'suspended' | 'error';
  startedAt: string | null;
  graceTimeout: ReturnType<typeof setTimeout> | null;
  abortController: AbortController | null;
}

class SessionManager {
  private sessions = new Map<string, ManagedSession>();
  private projectDir: string;
  private hub: WebSocketHub;
  private preWarmed = false;

  async initialize(): Promise<void> {
    // Pre-warm the CLI subprocess (20x faster first query)
    await startup();
    this.preWarmed = true;
  }

  async startSession(workbenchId: string): Promise<void> {
    const existing = this.sessions.get(workbenchId);
    if (existing?.status === 'idle' || existing?.status === 'running') return;

    const abortController = new AbortController();
    const existingSessionId = existing?.sessionId;

    this.broadcastStatus(workbenchId, 'connecting');

    const session = query({
      prompt: streamInput, // AsyncIterable for multi-turn
      options: {
        resume: existingSessionId ?? undefined,
        cwd: this.projectDir,
        abortController,
        settingSources: ['user', 'project', 'local'],
        persistSession: true,
        systemPrompt: { type: 'preset', preset: 'claude_code' },
        stderr: (data) => console.error(`[Session:${workbenchId}]`, data),
      }
    });

    // Stream messages to frontend via WebSocket hub
    this.consumeStream(workbenchId, session);
  }

  async suspendSession(workbenchId: string): Promise<void> {
    const session = this.sessions.get(workbenchId);
    if (!session?.query) return;
    session.query.close();
    session.query = null;
    session.status = 'suspended';
    this.broadcastStatus(workbenchId, 'suspended');
  }
}
```

### Pattern 2: Grace Period on Workbench Switch (D-01)

**What:** When user switches workbenches, previous session enters a ~30s grace period before suspending. Switching back cancels the timer.

**When to use:** Every workbench switch event.

**Example:**
```typescript
// Source: CONTEXT.md D-01, D-02
const GRACE_PERIOD_MS = 30_000;

handleWorkbenchSwitch(newWorkbenchId: string, previousWorkbenchId: string): void {
  // Cancel any existing grace period for the new workbench
  const newSession = this.sessions.get(newWorkbenchId);
  if (newSession?.graceTimeout) {
    clearTimeout(newSession.graceTimeout);
    newSession.graceTimeout = null;
    // Session was in grace period -- reactivate
    this.broadcastStatus(newWorkbenchId, newSession.status === 'suspended' ? 'idle' : newSession.status);
  }

  // Start grace period for previous workbench
  const prevSession = this.sessions.get(previousWorkbenchId);
  if (prevSession && (prevSession.status === 'idle' || prevSession.status === 'running')) {
    this.broadcastStatus(previousWorkbenchId, 'suspended');
    prevSession.graceTimeout = setTimeout(() => {
      this.suspendSession(previousWorkbenchId);
      prevSession.graceTimeout = null;
    }, GRACE_PERIOD_MS);
  }
}
```

### Pattern 3: Session Resume on App Restart (SESSION-03)

**What:** Backend persists workbenchId-to-sessionId mapping. On startup, resumes known sessions for the active workbench.

**When to use:** Backend initialization, after WebSocket connection established.

**Example:**
```typescript
// Source: Agent SDK docs -- resume option
async resumeWorkbenchSession(workbenchId: string): Promise<void> {
  const sessionId = this.getStoredSessionId(workbenchId);
  if (!sessionId) return;

  // Verify session still exists
  const info = await getSessionInfo(sessionId, { dir: this.projectDir });
  if (!info) {
    this.clearStoredSessionId(workbenchId);
    return;
  }

  // Resume with stored session ID
  const session = query({
    prompt: streamInput,
    options: {
      resume: sessionId,
      cwd: this.projectDir,
      persistSession: true,
      settingSources: ['user', 'project', 'local'],
      systemPrompt: { type: 'preset', preset: 'claude_code' },
    }
  });
  // ... consume stream
}
```

### Pattern 4: Frontend Session Store (Zustand)

**What:** Dedicated zustand store for per-workbench session state. Driven entirely by WebSocket events.

**When to use:** All frontend session state management.

**Example:**
```typescript
// Source: UI-SPEC Session Store Contract + existing pipelineStore pattern
import { create } from 'zustand';
import type { WorkbenchId } from '@/lib/types';

type SessionStatus = 'stopped' | 'connecting' | 'idle' | 'running' | 'suspended' | 'error';

interface WorkbenchSession {
  workbenchId: WorkbenchId;
  sessionId: string | null;
  status: SessionStatus;
  startedAt: string | null;
  lastActivity: string | null;
  error: string | null;
}

interface SessionState {
  sessions: Map<WorkbenchId, WorkbenchSession>;
  statusPanelCollapsed: boolean;
  updateSession: (id: WorkbenchId, update: Partial<WorkbenchSession>) => void;
  setStatusPanelCollapsed: (collapsed: boolean) => void;
  toggleStatusPanel: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  sessions: new Map(),
  statusPanelCollapsed: true,
  updateSession: (id, update) =>
    set((state) => {
      const next = new Map(state.sessions);
      const existing = next.get(id) ?? {
        workbenchId: id,
        sessionId: null,
        status: 'stopped' as const,
        startedAt: null,
        lastActivity: null,
        error: null,
      };
      next.set(id, { ...existing, ...update });
      return { sessions: next };
    }),
  setStatusPanelCollapsed: (collapsed) => set({ statusPanelCollapsed: collapsed }),
  toggleStatusPanel: () => set((s) => ({ statusPanelCollapsed: !s.statusPanelCollapsed })),
}));
```

### Pattern 5: WebSocket Session Events via WSEnvelope

**What:** Session lifecycle events use the existing WSEnvelope channel system. Backend broadcasts session state changes to the `_system` channel (or a dedicated `sessions` channel).

**When to use:** All session state transitions.

**Example:**
```typescript
// Source: packages/shared/src/ws-envelope.ts + existing hub.broadcast pattern
// New event types for session lifecycle
interface SessionStatusEvent {
  workbenchId: string;
  sessionId: string | null;
  status: SessionStatus;
  startedAt: string | null;
  error: string | null;
}

// Backend broadcasts:
const envelope: WSEnvelope = {
  channel: '_system',
  type: 'session:status',
  payload: {
    workbenchId: 'work',
    sessionId: 'uuid-here',
    status: 'idle',
    startedAt: new Date().toISOString(),
    error: null,
  } satisfies SessionStatusEvent,
  ts: new Date().toISOString(),
};
hub.broadcastAll(JSON.stringify(envelope));
```

### Anti-Patterns to Avoid

- **Direct Agent SDK calls from frontend:** The Agent SDK spawns child_process -- only works in Node.js. Frontend MUST go through WebSocket to backend (D-03).
- **Polling for session state:** All session state changes flow through WebSocket. Never poll REST endpoints for status.
- **One session for all workbenches:** Context bleed between workbenches. Each workbench gets its own session with independent context (SESSION-01).
- **Storing session IDs in localStorage:** Backend is the sole session owner. Frontend reads state from sessionStore, which is driven by WebSocket events. No localStorage session state.
- **Running all 7 sessions simultaneously:** Token budget explosion (Pitfall P1). Only active workbench + grace period sessions are live (D-02).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Toast notifications | Custom div-based notification system | `sonner` 2.0.7 | Auto-dismiss, deduplication via `id`, ARIA live region, prefers-reduced-motion support, stacking/positioning all handled |
| Session persistence to disk | Custom file-based session storage | Agent SDK `persistSession: true` | Sessions auto-persist to `~/.claude/projects/`. Resuming via `resume: sessionId` handles all serialization. |
| Session discovery | Custom file scanning for JSONL logs | Agent SDK `listSessions({ dir })` | Returns typed `SDKSessionInfo[]` with pagination, sorted by `lastModified` descending |
| Session message history | Parsing JSONL conversation logs | Agent SDK `getSessionMessages(sessionId)` | Typed `SessionMessage[]` with limit/offset pagination. Official API, not reverse-engineering. |
| CLI pre-warming | No-op first query to warm up | Agent SDK `startup()` | 20x faster first query. Added in v0.2.89. |
| Child process management | Raw `child_process.spawn()` | Agent SDK `query()` with `abortController` | SDK manages process lifecycle, stdout/stderr handling, cleanup. `query.close()` for teardown. |
| Elapsed time counter | Custom setInterval timer | Existing `useElapsedTime` hook from Phase 5 | Already built and tested. Accepts `startedAt` and `isRunning`, returns elapsed ms. |

**Key insight:** The Agent SDK handles all session persistence, resume, and process lifecycle. The SessionManager only needs to map workbenchIds to sessions and manage the lazy activation / grace period logic. Do not replicate what the SDK already provides.

## Common Pitfalls

### Pitfall 1: Token Budget Explosion (from PITFALLS.md P1)
**What goes wrong:** Running 7+ persistent sessions drains the 5-hour token quota in minutes.
**Why it happens:** Each session maintains its own context window. Idle sessions accumulate overhead from heartbeats and context refreshes.
**How to avoid:** Lazy activation (D-02). Only active workbench + grace period sessions are live. Grace period (D-01) is 30s, not indefinite. `query.close()` to fully release suspended sessions.
**Warning signs:** Users hitting rate limits within first hour. Token consumption on idle workbenches.

### Pitfall 2: Silent Session Disconnection (from PITFALLS.md P2)
**What goes wrong:** Remote sessions drop silently with no recovery indication.
**Why it happens:** Claude Code's auto-reconnection has documented bugs. Session IDs can change after reboots.
**How to avoid:** Health monitor with heartbeat-based detection <30s (D-09). Session resurrection from local logs as source of truth (D-08). `getSessionInfo(sessionId)` to verify session exists before resume attempt.
**Warning signs:** Chat panel shows "connected" but agent hasn't responded in >60s. ConversationWatcher JSONL log stops updating.

### Pitfall 3: Process Lifecycle Leaks in Electron (from PITFALLS.md P9)
**What goes wrong:** Event listeners accumulate on child processes across session restart cycles.
**Why it happens:** Scaling from 1 managed process to 7+ multiplies the existing listener leak pattern.
**How to avoid:** Use `AbortController` per session. Call `query.close()` on suspend/stop. Never add listeners without corresponding cleanup. SessionManager tracks active sessions and prevents duplicate spawns.
**Warning signs:** Electron main process memory growing. Orphaned Claude Code processes after app close.

### Pitfall 4: Stream Consumption Race Conditions
**What goes wrong:** Multiple components try to consume the same `query()` async generator, or the generator is consumed after `close()`.
**Why it happens:** The `query()` return is an async generator -- only one consumer can iterate it. If the frontend triggers a suspend while the backend is mid-stream, the generator throws.
**How to avoid:** Single consumer pattern: the SessionManager's `consumeStream()` method is the sole consumer. Use try/catch around the `for await` loop. Check `abortController.signal.aborted` before processing messages.
**Warning signs:** `ERR_STREAM_WRITE_AFTER_END` errors. Missing messages in the frontend.

### Pitfall 5: Workbench Switch During Active Session
**What goes wrong:** User switches workbenches rapidly. Grace period timers overlap. Multiple sessions try to activate/deactivate simultaneously.
**Why it happens:** Each switch starts a new grace period for the old workbench and potentially cancels one for the new workbench. Without proper cleanup, timers accumulate.
**How to avoid:** Clear all grace period timers on workbench switch before setting new ones. Use a Map for tracking timeouts per workbenchId. The grace period handler must be idempotent -- suspending an already-suspended session is a no-op.
**Warning signs:** Console logs showing duplicate suspend calls. Session status flickering between states.

### Pitfall 6: Windows File Locking (from PITFALLS.md P16)
**What goes wrong:** EBUSY errors when resuming sessions while ConversationWatcher reads JSONL files.
**Why it happens:** Windows file locks prevent multiple processes from reading/writing the same session file.
**How to avoid:** One Agent SDK process per session ID at any time. SessionManager tracks active sessions. Open JSONL files in read-only non-exclusive mode for any monitoring.
**Warning signs:** EBUSY or EPERM errors in stderr on Windows.

## Code Examples

### Agent SDK Session Create with Resume

```typescript
// Source: https://platform.claude.com/docs/en/agent-sdk/typescript
import { query, startup, type Query, type SDKMessage } from '@anthropic-ai/claude-agent-sdk';

// Pre-warm (call once at backend startup)
await startup();

// Create or resume a session
const abortController = new AbortController();
const session: Query = query({
  prompt: 'Hello, this is the Work workbench.',
  options: {
    resume: 'existing-session-uuid', // omit for new session
    cwd: '/path/to/project',
    abortController,
    persistSession: true,
    settingSources: ['user', 'project', 'local'],
    systemPrompt: { type: 'preset', preset: 'claude_code' },
    stderr: (data: string) => console.error('[Session]', data),
  }
});

// Consume the stream -- single consumer pattern
for await (const message of session) {
  const sessionId = message.session_id; // Extract session ID for storage
  // Route messages to WebSocket hub for frontend
  hub.broadcastAll(JSON.stringify({
    channel: '_system',
    type: `session:message`,
    payload: { workbenchId: 'work', message },
  }));
}
```

### Multi-Turn via streamInput

```typescript
// Source: Agent SDK docs -- streaming input for multi-turn
import { query, type SDKUserMessage } from '@anthropic-ai/claude-agent-sdk';

// Create an async iterable for multi-turn
const inputQueue: SDKUserMessage[] = [];
let resolveNext: (() => void) | null = null;

async function* createInputStream(): AsyncIterable<SDKUserMessage> {
  while (true) {
    if (inputQueue.length === 0) {
      await new Promise<void>((resolve) => { resolveNext = resolve; });
    }
    const msg = inputQueue.shift();
    if (msg) yield msg;
  }
}

const session = query({
  prompt: createInputStream(),
  options: { resume: existingId, cwd: projectDir, persistSession: true }
});

// To send a message from the frontend (via WebSocket handler):
function sendUserMessage(text: string, sessionId: string) {
  inputQueue.push({
    type: 'user',
    session_id: sessionId,
    message: { role: 'user', content: [{ type: 'text', text }] },
    parent_tool_use_id: null,
  });
  resolveNext?.();
}
```

### Session Discovery and History

```typescript
// Source: Agent SDK docs -- listSessions, getSessionMessages, getSessionInfo
import { listSessions, getSessionMessages, getSessionInfo } from '@anthropic-ai/claude-agent-sdk';

// List recent sessions for this project
const sessions = await listSessions({ dir: '/path/to/project', limit: 10 });

// Get session info without full scan
const info = await getSessionInfo('uuid', { dir: '/path/to/project' });

// Get conversation history with pagination
const messages = await getSessionMessages('uuid', {
  dir: '/path/to/project',
  limit: 50,
  offset: 0,
});
```

### Sonner Toast Integration

```typescript
// Source: sonner docs + UI-SPEC Toast Contract
import { toast } from 'sonner';

// Mount <Toaster /> in AppShell.tsx
// <Toaster position="bottom-right" toastOptions={{ ... }} />

// Session connected toast with deduplication
toast.success('Work agent connected', {
  id: `work-connected`, // Dedup key
  description: 'New session started.',
  duration: 4000,
});

// Persistent toast for disconnection (stays until reconnected)
toast.warning('Work agent disconnected', {
  id: `work-disconnected`,
  description: 'Reconnecting automatically...',
  duration: Infinity,
});

// Dismiss on reconnect
toast.dismiss('work-disconnected');
toast.success('Work agent reconnected', {
  id: `work-reconnected`,
  description: 'Session restored.',
  duration: 3000,
});
```

### Status Panel in WorkspaceArea (extending existing pattern)

```typescript
// Source: Existing WorkspaceArea.tsx + UI-SPEC Panel Layout
import { Group, Panel, Separator, type PanelSize } from 'react-resizable-panels';

// WorkspaceArea becomes a 3-panel vertical split:
// Pipeline (top) | Content (middle) | Status Panel (bottom)
export function WorkspaceArea({ workbenchId }: WorkspaceAreaProps) {
  const statusPanelCollapsed = useSessionStore((s) => s.statusPanelCollapsed);
  const setStatusPanelCollapsed = useSessionStore((s) => s.setStatusPanelCollapsed);

  return (
    <Group orientation="vertical">
      <Panel id="pipeline" defaultSize="25%" /* ... */ />
      <Separator /* existing pattern */ />
      <Panel id="content" defaultSize="50%" minSize="30%">
        <Page />
      </Panel>
      <Separator /* ... */ />
      <Panel
        id="status-panel"
        defaultSize="25%"
        minSize="15%"
        maxSize="40%"
        collapsible
        collapsedSize="0%"
        onResize={(size: PanelSize) => {
          setStatusPanelCollapsed(size.asPercentage === 0);
        }}
      >
        <AgentStatusPanel />
      </Panel>
    </Group>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `@anthropic-ai/claude-code` package | `@anthropic-ai/claude-agent-sdk` | Renamed ~2025 | Must use new package name. Import paths unchanged. |
| Raw `child_process` for CLI sessions | Agent SDK `query()` | Agent SDK v0.1.x+ | SDK handles process lifecycle, streaming, cleanup. |
| Manual JSONL parsing for history | `getSessionMessages()` | v0.2.59 | Official paginated API replaces reverse-engineering. |
| No pre-warming | `startup()` for 20x faster first query | v0.2.89 | Call once at backend init. Significant UX improvement. |
| `streamInput()` on Query object | Same, but V2 `send()`/`stream()` preview available | v0.2.89+ | V2 is simpler but unstable. Stick with V1 for production. |
| No hook lifecycle events | `includeHookEvents` option | v0.2.89 | Enables `hook_started`/`hook_progress`/`hook_response` for STATUS-03. |
| No session info lookup | `getSessionInfo(sessionId)` | v0.2.75 | Single session metadata without full directory scan. |
| No session tagging | `tagSession(sessionId, tag)` | v0.2.75 | Can tag workbench sessions for organization. |

**Deprecated/outdated:**
- `@anthropic-ai/claude-code`: Renamed. Use `@anthropic-ai/claude-agent-sdk`.
- `maxThinkingTokens` option: Deprecated. Use `thinking` option instead.
- Existing `claudeCliManager.ts` + `claudeCliSession.ts`: Legacy raw CLI session management. Phase 6 replaces with Agent SDK-based SessionManager. These files are not deleted (they serve existing routes) but SessionManager is the new path for workbench sessions.

## Open Questions

1. **V2 API Stability Timeline**
   - What we know: V2 (`unstable_v2_*`) provides cleaner multi-turn with `send()`/`stream()`. Missing `forkSession`.
   - What's unclear: When V2 becomes stable. Whether V1 will be deprecated.
   - Recommendation: Build on V1. If V2 stabilizes during development, the SessionManager abstraction layer makes migration straightforward -- only `startSession()` and `sendMessage()` internals change.

2. **Token Budget Visibility**
   - What we know: Agent SDK v0.2.84 added `taskBudget` option. `SDKResultMessage` includes `total_cost_usd` and `usage`. `getContextUsage()` (v0.2.86) returns context window breakdown.
   - What's unclear: Whether real-time token tracking is feasible without waiting for `result` messages.
   - Recommendation: Track cumulative cost per workbench from `SDKResultMessage.total_cost_usd`. Display in status panel if feasible. Defer real-time budget as stretch goal.

3. **Grace Period Interaction with Running Agent**
   - What we know: Grace period is ~30s (D-01). User can force-stop (D-06).
   - What's unclear: What happens if an agent is actively processing a tool call when the grace period expires? Does `query.close()` wait for the current tool call to complete?
   - Recommendation: Grace period suspends at the boundary -- if agent is mid-execution, extend grace period until the current turn completes. Use `query.interrupt()` before `close()` for immediate force-stop.

4. **Existing claudeCliManager Coexistence**
   - What we know: `claudeCliManager.ts` manages CLI sessions for existing routes. SessionManager is the new service for workbench-scoped sessions.
   - What's unclear: Whether existing CLI routes should migrate to SessionManager or coexist.
   - Recommendation: Coexist for Phase 6. SessionManager handles workbench sessions only. Legacy routes continue using claudeCliManager. Consolidation is a future cleanup task.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Agent SDK backend | To verify at runtime | -- | Required, no fallback |
| Claude Code CLI | Agent SDK spawns CLI subprocess | To verify at runtime | -- | Agent SDK bundles its own CLI executable via `pathToClaudeCodeExecutable` |
| pnpm | Package installation | Available | 10.29.3 | -- |
| WebSocket (ws) | Backend real-time events | Available | 8.14.2 | -- |

**Note:** The Agent SDK includes its own bundled CLI executable. It does NOT require a separate Claude Code CLI installation unless `pathToClaudeCodeExecutable` is explicitly set. Verify at runtime by calling `startup()` -- if it fails, the CLI is not available.

**Missing dependencies with no fallback:**
- None identified. Agent SDK bundles its own executable.

**Missing dependencies with fallback:**
- Claude Code CLI authentication: If not authenticated, Agent SDK calls fail. The SessionManager should catch auth errors and surface them as session status `'error'` with a descriptive message.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.0.0 |
| Config file | `packages/app/vitest.config.ts` (frontend), `packages/backend/vitest.config.ts` (backend) |
| Quick run command | `pnpm --filter @afw/app test -- --run` |
| Full suite command | `pnpm test` |

### Phase Requirements to Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SESSION-01 | SessionManager creates Agent SDK sessions per workbench | unit (mocked SDK) | `pnpm --filter @afw/backend test -- --run packages/backend/src/services/__tests__/sessionManager.test.ts` | Wave 0 |
| SESSION-02 | Only active workbench + grace period sessions are live | unit | Same test file, lazy activation tests | Wave 0 |
| SESSION-03 | Sessions resume with stored session ID | unit (mocked SDK) | Same test file, resume tests | Wave 0 |
| SESSION-04 | Health monitor detects disconnection <30s | unit | `pnpm --filter @afw/backend test -- --run packages/backend/src/services/__tests__/sessionHealthMonitor.test.ts` | Wave 0 |
| SESSION-06 | Frontend communicates via WebSocket only | unit | `pnpm --filter @afw/app test -- --run src/stores/sessionStore.test.ts` | Wave 0 |
| STATUS-01 | Status panel shows all workbench sessions | unit (component) | `pnpm --filter @afw/app test -- --run src/workbenches/workspace/AgentStatusPanel.test.tsx` | Wave 0 |
| STATUS-02 | Toasts fire on session events | unit (hook) | `pnpm --filter @afw/app test -- --run src/hooks/useSessionToasts.test.ts` | Wave 0 |

### Sampling Rate
- **Per task commit:** `pnpm --filter @afw/app test -- --run` and `pnpm --filter @afw/backend test -- --run`
- **Per wave merge:** `pnpm test` (all packages)
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `packages/backend/src/services/__tests__/sessionManager.test.ts` -- covers SESSION-01, SESSION-02, SESSION-03
- [ ] `packages/backend/src/services/__tests__/sessionHealthMonitor.test.ts` -- covers SESSION-04
- [ ] `packages/app/src/stores/sessionStore.test.ts` -- covers SESSION-06, STATUS-01 (store layer)
- [ ] `packages/app/src/workbenches/workspace/AgentStatusPanel.test.tsx` -- covers STATUS-01 (rendering)
- [ ] `packages/app/src/hooks/useSessionToasts.test.ts` -- covers STATUS-02
- [ ] Agent SDK mock: `packages/backend/src/services/__tests__/__mocks__/claude-agent-sdk.ts` -- mock `query`, `startup`, `listSessions`, `getSessionMessages`

## Project Constraints (from CLAUDE.md)

- **Tech stack:** React 18 + TypeScript + Vite (frontend), Express + ws (backend), pnpm monorepo -- preserve existing stack
- **Design system enforcement:** No raw CSS in agent output. Component library is the only way agents build UI
- **Electron:** Desktop app wrapper must continue to function -- session lifecycle must not leak processes
- **Contract system:** Existing 17 output format contracts must be preserved
- **Naming:** React components PascalCase, hooks `use` prefix, services camelCase, constants UPPER_SNAKE_CASE
- **Branded types:** SessionId, ChainId, StepId, UserId must be used correctly
- **Logging:** `[ModuleName]` prefix format (e.g., `[SessionManager]`, `[SessionHealth]`)
- **Error handling:** Try-catch for async, silent failure for secondary services, graceful degradation
- **Module design:** Named exports, barrel files for package API, ES modules throughout
- **Git:** Conventional commits, `Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>`

## Sources

### Primary (HIGH confidence)
- [Agent SDK TypeScript Reference](https://platform.claude.com/docs/en/agent-sdk/typescript) -- Full API: `query()`, Options, SDKMessage types, `listSessions()`, `getSessionMessages()`, `getSessionInfo()`, `startup()`, `forkSession`
- [Agent SDK V2 Preview](https://platform.claude.com/docs/en/agent-sdk/typescript-v2-preview) -- `unstable_v2_createSession()`, `send()`/`stream()` pattern, session resume
- [Agent SDK Changelog](https://github.com/anthropics/claude-agent-sdk-typescript/blob/main/CHANGELOG.md) -- v0.2.89: `startup()`, `includeHookEvents`, `listSubagents()`; v0.2.90: parity with Claude Code v2.1.90
- npm registry: `@anthropic-ai/claude-agent-sdk` v0.2.90, `sonner` v2.0.7 (verified 2026-04-02)

### Secondary (MEDIUM confidence)
- `.planning/research/STACK.md` -- Project stack research (2026-04-01), Agent SDK patterns
- `.planning/research/ARCHITECTURE.md` -- SessionManager as backend-only service, WebSocket hub for frontend
- `.planning/research/PITFALLS.md` -- P1 (token explosion), P2 (silent disconnects), P9 (Electron process leaks), P16 (Windows file locking)

### Tertiary (LOW confidence)
- V2 API stability timeline -- no official timeline found for when `unstable_v2_*` becomes stable
- Token budget real-time tracking feasibility -- `getContextUsage()` exists but real-time overhead unknown

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- Agent SDK v0.2.90 verified on npm, API docs fetched and cross-referenced with changelog
- Architecture: HIGH -- Builds on verified Phase 2/3/4/5 infrastructure (WebSocket hub, zustand stores, resizable panels)
- Pitfalls: HIGH -- Drawn from project-specific PITFALLS.md with additional Agent SDK-specific patterns from official docs
- Frontend UI: HIGH -- UI-SPEC provides exact component specs, spacing, colors, typography, interaction contracts

**Research date:** 2026-04-02
**Valid until:** 2026-04-16 (Agent SDK version moves fast; re-verify if >2 weeks pass)
