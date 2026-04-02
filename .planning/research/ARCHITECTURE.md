# Architecture Patterns

**Domain:** Agentic personal OS dashboard
**Researched:** 2026-04-01

## Recommended Architecture

The system follows a **local-first, session-per-workbench** architecture. The backend is the brain (session management, hook handling, state coordination). The frontend is the face (visualization, interaction, component rendering). Claude Code hooks are the nervous system (validation, lifecycle events, compliance enforcement).

```
+--------------------+     WebSocket      +----------------------+
|                    | <================> |                      |
|   React Frontend   |     HTTP/REST      |   Express Backend    |
|   (Electron/Web)   | <---------------> |   (Port 3001)        |
|                    |                    |                      |
|  - 3-Panel Layout  |                    |  - SessionManager    |
|  - Pipeline View   |                    |  - HookHandler       |
|  - Chat Panels     |                    |  - WorkbenchRegistry |
|  - Component Lib   |                    |  - WebSocket Hub     |
|                    |                    |                      |
+--------------------+                    +----------+-----------+
                                                     |
                                          Agent SDK  |  Hooks (HTTP)
                                                     |
                                          +----------v-----------+
                                          |                      |
                                          |   Claude Code CLI    |
                                          |   (Local Machine)    |
                                          |                      |
                                          |  - Sessions (~/.claude/projects/)
                                          |  - Hooks (.claude/settings.json)
                                          |  - MCP Servers       |
                                          |  - Skills            |
                                          |                      |
                                          +----------------------+
```

### Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| **SessionManager** (backend) | Creates, resumes, and streams Claude sessions per workbench. Maps workbenchId to sessionId. Handles session lifecycle (create, resume, fork, close). | Agent SDK (spawn/stream), WebSocket Hub (broadcast messages), HookHandler (lifecycle events) |
| **HookHandler** (backend) | Receives HTTP POST from Claude Code hooks. Processes validation results, lifecycle events. Routes to appropriate services. | Express routes (incoming hooks), SessionManager (validation feedback), WebSocket Hub (broadcast to frontend) |
| **WorkbenchRegistry** (backend) | Manages workbench definitions, default 7 + custom. Tracks which session belongs to which workbench. | SessionManager (workbench-session mapping), REST API (CRUD), Storage (persistence) |
| **WebSocket Hub** (backend) | Multiplexes real-time events to frontend. Channels per workbench for scoped messaging. | SessionManager (session messages), HookHandler (lifecycle events), Frontend (browser WebSocket) |
| **PipelineStore** (frontend, zustand) | Holds ReactFlow nodes/edges for each workbench's pipeline visualization. Updated by WebSocket events. | WebSocket (incoming events), ReactFlow (render nodes/edges) |
| **SessionStore** (frontend, zustand) | Tracks session state per workbench (connected, disconnected, loading). Holds chat history for rendering. | WebSocket (session events), Chat Panel (render messages) |
| **UIStore** (frontend, zustand) | UI state: active workbench, panel sizes, sidebar collapse, command palette open. | All frontend components (read/write), localStorage (persistence) |
| **Component Library** (frontend) | Reusable UI components built from Radix + Tailwind + CVA. The single source of truth for visual elements. | All frontend components (compose from library) |

### Data Flow

**Chat Message Flow (User -> Agent -> User):**
1. User types in chat panel (frontend)
2. Frontend sends message via WebSocket to backend
3. Backend's SessionManager forwards to Agent SDK `streamInput()`
4. Agent SDK streams responses as `SDKMessage` async generator
5. Backend broadcasts each message chunk via WebSocket
6. Frontend's SessionStore receives, Chat Panel renders incrementally

**Pipeline Update Flow (Agent Activity -> Visualization):**
1. Claude Code hook fires (SubagentStart, PreToolUse, PostToolUse, SubagentStop)
2. Hook sends HTTP POST to backend's HookHandler
3. HookHandler translates hook event into pipeline node update
4. Backend broadcasts node update via WebSocket
5. Frontend's PipelineStore updates ReactFlow nodes/edges
6. Pipeline visualizer re-renders affected nodes only

**Neural Validation Flow (Agent Edit -> Validate -> Feedback):**
1. Agent writes/edits a file (triggers PostToolUse hook)
2. PostToolUse HTTP hook POSTs file content to backend
3. Backend's HookHandler runs design system compliance checks
4. If violation found: returns `{ decision: "block", additionalContext: "Fix: use Button variant='primary' instead of raw CSS" }`
5. Claude Code feeds additionalContext back to agent
6. Agent self-corrects based on feedback

## Patterns to Follow

### Pattern 1: Store-Per-Domain (Zustand Slices)

**What:** Separate zustand stores for pipeline, session, and UI state. Not one monolithic store.

**When:** Always. Each domain has different update frequencies and subscribers.

**Example:**
```typescript
// stores/pipeline.ts
import { create } from 'zustand';
import type { Node, Edge } from '@xyflow/react';

interface PipelineState {
  nodes: Record<string, Node[]>;  // keyed by workbenchId
  edges: Record<string, Edge[]>;
  updateNode: (workbenchId: string, nodeId: string, data: Partial<Node>) => void;
  setChain: (workbenchId: string, nodes: Node[], edges: Edge[]) => void;
}

export const usePipelineStore = create<PipelineState>((set) => ({
  nodes: {},
  edges: {},
  updateNode: (workbenchId, nodeId, data) =>
    set((state) => ({
      nodes: {
        ...state.nodes,
        [workbenchId]: state.nodes[workbenchId]?.map((n) =>
          n.id === nodeId ? { ...n, ...data } : n
        ) ?? [],
      },
    })),
  setChain: (workbenchId, nodes, edges) =>
    set((state) => ({
      nodes: { ...state.nodes, [workbenchId]: nodes },
      edges: { ...state.edges, [workbenchId]: edges },
    })),
}));
```

### Pattern 2: Component Library as Infrastructure

**What:** Every UI element comes from the component library. Components use CVA for variants, Radix for behavior, Tailwind for styling.

**When:** Every new component, every agent-generated UI, every workbench page.

**Example:**
```typescript
// components/ui/card.tsx
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const cardVariants = cva(
  'rounded-lg border border-border bg-surface p-4 transition-shadow',
  {
    variants: {
      elevation: {
        flat: '',
        raised: 'shadow-md',
        floating: 'shadow-lg shadow-accent/5',
      },
      interactive: {
        true: 'cursor-pointer hover:border-accent/30 hover:shadow-accent/10',
        false: '',
      },
    },
    defaultVariants: { elevation: 'flat', interactive: false },
  }
);

interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

export function Card({ elevation, interactive, className, ...props }: CardProps) {
  return (
    <div className={cn(cardVariants({ elevation, interactive }), className)} {...props} />
  );
}
```

### Pattern 3: Hook-Driven Pipeline Updates

**What:** Pipeline visualizer state is driven entirely by Claude Code hook events. No polling.

**When:** Every chain execution, every agent spawn.

**Example:**
```typescript
// backend: routes/hooks.ts
router.post('/api/hooks/agent-started', (req, res) => {
  const { agent_type, agent_id, session_id } = req.body;
  const workbenchId = sessionManager.getWorkbenchForSession(session_id);

  wsHub.broadcast(workbenchId, {
    type: 'pipeline:node-add',
    node: {
      id: agent_id,
      type: 'step',
      data: { label: agent_type, status: 'running' },
    },
  });

  res.json({ continue: true });
});
```

### Pattern 4: Session Resume on Reconnect

**What:** When the app restarts, the backend resumes existing sessions rather than creating new ones.

**When:** Every app start, every Electron window restoration.

**Example:**
```typescript
// backend: services/SessionManager.ts
async resumeWorkbench(workbenchId: string): Promise<void> {
  const sessionId = await this.registry.getSessionId(workbenchId);
  if (!sessionId) return;

  const session = query({
    prompt: streamInput,  // async iterable for multi-turn
    options: {
      resume: sessionId,
      cwd: this.projectDir,
      settingSources: ['user', 'project', 'local'],
      persistSession: true,
    },
  });

  this.activeSessions.set(workbenchId, session);
}
```

## Anti-Patterns to Avoid

### Anti-Pattern 1: Global State Store

**What:** Putting all state (UI, sessions, pipelines, chat) in a single zustand store.

**Why bad:** Different update frequencies cause unnecessary re-renders. Pipeline updates (high frequency) trigger chat panel re-renders (should only update on new messages). Performance degrades as state grows.

**Instead:** Separate stores per domain: `usePipelineStore`, `useSessionStore`, `useUIStore`. Components subscribe to exactly the store they need.

### Anti-Pattern 2: Polling for Session State

**What:** Frontend polling the backend every N seconds to check session status.

**Why bad:** Wasteful, laggy, scales poorly. The system already has WebSocket for real-time communication.

**Instead:** All session state changes flow through WebSocket. Hooks push events. Backend broadcasts immediately.

### Anti-Pattern 3: Direct Agent SDK Calls from Frontend

**What:** Frontend importing `@anthropic-ai/claude-agent-sdk` and calling `query()` directly.

**Why bad:** The Agent SDK spawns `child_process` -- this only works in Node.js, not in browser context. Even in Electron's renderer process, spawning processes is unsafe and bypasses the backend's session management.

**Instead:** Frontend communicates with backend via WebSocket/REST. Backend is the sole owner of Agent SDK sessions.

### Anti-Pattern 4: Raw CSS Alongside Component Library

**What:** Writing CSS files for new components instead of using Tailwind utilities and CVA variants.

**Why bad:** Breaks the design system enforcement constraint. Agents that see raw CSS in the codebase will imitate the pattern. The neural validation layer would need to catch and reject every instance.

**Instead:** All styling through Tailwind utilities. Component variants through CVA. The `cn()` utility for merging classes. No `.css` files for new components (only the global token layer).

### Anti-Pattern 5: One Session Per User (Not Per Workbench)

**What:** Sharing a single Claude session across all workbenches.

**Why bad:** Context bleed between workbenches. A coding conversation in Work workbench pollutes the PM workbench's context. Session length grows unbounded, hitting context limits faster.

**Instead:** One session per workbench. Each workbench has its own conversation history, agent context, and session lifecycle. Independent resume, independent context.

## Scalability Considerations

| Concern | At 7 workbenches (default) | At 20+ workbenches (custom) | Mitigation |
|---------|---------------------------|----------------------------|------------|
| Memory (sessions) | ~7 Agent SDK processes. Each is a child process with its own Node.js instance. ~50-100MB per process. | 20+ processes = 1-2GB RAM. Becomes a concern. | Lazy session initialization: only spawn when workbench is actively used. Suspend idle sessions after timeout. Resume on demand. |
| WebSocket channels | 7 channels, low message volume per channel. Trivial. | 20+ channels, but still scoped traffic. Still manageable. | No change needed. WebSocket is inherently multiplexed. |
| Pipeline nodes | ~5-20 nodes per active chain. ReactFlow handles this easily. | Same per workbench. No cumulative effect since only active workbench renders. | Only render the active workbench's pipeline. Zustand store holds all, but React only subscribes to active. |
| Hook HTTP requests | ~1-5 hooks fire per agent action. Backend handles synchronously. | Same rate per workbench. Concurrent workbenches may spike to ~50 hooks/sec. | Hook handlers should be non-blocking. Use async processing. Queue heavy validation (prompt hooks) behind lightweight checks (command hooks). |
| Session files on disk | `~/.claude/projects/` grows with session transcripts. ~1-10MB per session. | 100+ sessions over time = ~1GB. Manageable for desktop. | Session archival: compress or move old sessions. Agent SDK `listSessions()` supports pagination. |

---

## Sources

- [Agent SDK TypeScript Reference](https://platform.claude.com/docs/en/agent-sdk/typescript) -- Session management, query options, streaming
- [Claude Code Hooks Reference](https://code.claude.com/docs/en/hooks) -- Hook events, HTTP handler type, SubagentStart/Stop
- [React Flow v12 Documentation](https://reactflow.dev/) -- Node types, edge types, performance
- [Zustand Documentation](https://docs.pmnd.rs/zustand/getting-started/introduction) -- Store patterns, middleware

---
*Architecture patterns for: Agentic personal OS dashboard*
*Researched: 2026-04-01*
