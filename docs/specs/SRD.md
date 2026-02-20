# ActionFlows Dashboard — Software Requirements Document (SRD)

**Version:** 1.0 (Complete Specification)
**Date:** 2026-02-08
**Status:** Ready for Implementation
**Audience:** Architects, Developers, DevOps Engineers, Technical Leads

This comprehensive SRD provides the technical architecture, implementation patterns, dependency graphs, risk assessment, and QA strategy for ActionFlows Dashboard using a three-layer architecture: **Orchestrator-Level** (routing decisions), **Agent-Level** (implementation patterns), and **Cross-Cutting Concerns** (error handling, security, performance).

**Key Metrics:**
- 44 API endpoints across 11 route modules
- 45 frontend components with 25 custom hooks
- 84 shared type definitions with 8 branded string types
- 24 discriminated union event types
- 41-step implementation sequence (15 weeks, 9 phases)

---

## EXECUTIVE SUMMARY

The ActionFlows Dashboard is a **comprehensive real-time monitoring and control system** for AI agent orchestration flows. This SRD provides complete technical specification across three architectural layers:

**Living Universe Architecture:**

This SRD specifies a system that embodies the Living Universe philosophy: software that grows through use, heals itself through harmony detection, and evolves new capabilities through pattern recognition.

**The Physics-Brain-Will Architecture:**

- **Three-layer structure** mirrors the triad: Orchestrator-Level (brain), Agent-Level (hands), Cross-Cutting (shared laws/physics)
- **Harmony system** = the immune system that detects when physics and behavior are out of sync
- **Memory layer** = accumulated wisdom that makes the brain smarter over time
- **Self-modification pipeline** = the mechanism by which the brain reshapes the physics

The dashboard is not static monitoring—it's a **living visualizer** that shows evolution in action. You see the brain coordinating, the hands executing, and the physics being reshaped.

**Layer 1: Orchestrator-Level Design**
- Department routing (Engineering dept → code-and-review flow)
- Action chain composition (shared types → backend → frontend → review)
- Model selection (haiku for execution, sonnet for review, opus for audit)
- Implementation sequence strategy (41 steps, 9 phases, critical path 12 days)

**Layer 2: Agent-Level Design**
- Backend patterns (Express middleware, Zod validation, Storage interface, WebSocket, Redis pub/sub, file watcher)
- Frontend patterns (React hooks, Context providers, derived state, memoization)
- Shared patterns (branded types, discriminated unions, type guards)

**Layer 3: Cross-Cutting Concerns**
- Error handling (backend sanitization, frontend try/catch, graceful degradation)
- Security (API key validation, path traversal prevention, rate limiting, Zod validation)
- Performance (target metrics, optimization strategies, monitoring)
- Testing & QA (unit, integration, E2E, code review checklist, security audit)

---

## SECTION 1: ARCHITECTURE OVERVIEW

### 1.1 Monorepo Structure

```
ActionFlowsDashboard/
├── packages/
│   ├── backend/          # Express API + WebSocket (37 .ts files, 2,013 LOC)
│   ├── app/              # React + Electron (120+ files, 45 components)
│   ├── shared/           # Shared types (7 modules, 84 types, 1,970 LOC)
│   ├── mcp-server/       # MCP protocol server (309 LOC, 2 tools)
│   └── hooks/            # Claude Code hooks (Bash scripts)
├── data/
│   ├── history/          # Session persistence (7-day retention)
│   └── projects/         # Project configurations (JSON)
├── .claude/
│   └── actionflows/      # Framework orchestration files
└── test/
    └── e2e/              # Playwright E2E tests
```

### 1.2 Data Flow Architecture

```
Claude Code Hook (HTTP POST)
    ↓ (with API key)
Backend API (Express 4.18.3)
    ├→ Auth middleware (validate API key)
    ├→ Rate limit middleware
    ├→ Zod schema validation
    └→ Route handler
        ↓ (Storage write + broadcast)
Storage Layer
    ├→ Memory (dev): Sync Maps
    └→ Redis (prod): Async + pub/sub
        ↓ (Redis pub/sub on 'afw:events' channel)
Harmony Detector
    ├→ Parse orchestrator output using contract parsers
    ├→ Validate structure against CONTRACT.md specification
    └→ Broadcast harmony events (valid/degraded/violation)
        ↓ (WebSocket harmony:check, harmony:violation)
Dashboard Harmony Panel
    ├→ Real-time harmony status display
    ├→ Violation alerts
    └→ Historical metrics
        ↓
WebSocket Server
    ├→ Client registry (per-session subscriptions)
    └→ Per-client rate limiting (50 msg/sec)
        ↓ (JSON broadcast)
Frontend WebSocketContext
    ├→ Auto-reconnect (exponential backoff 3s→30s)
    ├→ Multi-callback support
    └→ Type-safe event dispatching
        ↓ (React Context dispatch)
React Components & Hooks
    ├→ useChainState, useEvents, useTerminalEvents
    ├→ ChainDAG (ReactFlow 100+ steps)
    ├→ TerminalTabs (xterm.js, 10K+ lines)
    └→ CodeEditor (Monaco, 10K line files)
        ↓ (User interaction)
Command Queue
    ├→ POST /api/sessions/:id/commands
    └→ GET /api/sessions/:id/commands (polling)
        ↓ (Hook fetches and executes)
Loop closes with event posting
```

### 1.3 Tech Stack Per Package

**packages/backend/**
- Express 4.18.3, ws 8.14.2, ioredis 5.3.2, Zod 3.22.4, chokidar 3.5.3

**packages/app/**
- React 18.2.0, Vite 5.0.8, Electron 28.1.0, ReactFlow 11.10.4, Monaco 0.45.0, xterm 5.3.0

**packages/shared/**
- TypeScript 5.3.3, ES modules (with .js extensions)

**packages/mcp-server/**
- @modelcontextprotocol/sdk 1.0.0, node-fetch 3.3.2

---

## SECTION 2: ORCHESTRATOR-LEVEL DESIGN

### 2.1 Department & Flow Routing

**Engineering Department** owns all ActionFlows Dashboard feature implementation.

| Requirement Type | Flow | Chain | Rationale |
|---|---|---|---|
| Session Management (SM-01 to SM-05) | code-and-review/ | code/backend → code/frontend → review/ | Multi-package API + UI |
| Chain Orchestration (CO-01 to CO-03) | code-and-review/ | code/backend → review/ | Core logic, backend-only |
| Step Execution (SE-01 to SE-03) | code-and-review/ | code/backend → review/ | Agent framework |
| Command Queue (CQ-01 to CQ-02) | code-and-review/ | code/backend → code/frontend → review/ | API + polling |
| Event Streaming (ES-01 to ES-03) | code-and-review/ | code/ → code/backend → code/frontend → review/ | Cross-package |
| File Operations (FO-01 to FO-04) | code-and-review/ | code/backend → code/frontend → review/ | CRUD + watching |
| Terminal Output (TO-01 to TO-03) | code-and-review/ | code/backend → code/frontend → review/ | Buffering + display |
| Claude CLI (CLI-01 to CLI-04) | code-and-review/ | code/backend → code/frontend → review/ | Subprocess mgmt |
| Session Windows (SW-01 to SW-04) | code-and-review/ | code/frontend → review/ | Frontend-only state |
| Project Registry (PR-01 to PR-05) | code-and-review/ | code/backend → code/frontend → review/ | Storage + forms |
| Session Discovery (SD-01) | code-and-review/ | code/backend → review/ | IDE lock file scan |
| User Management (UM-01 to UM-02) | code-and-review/ | code/backend → code/frontend → review/ | Aggregation + UI |
| Security (SA-01 to SA-04) | audit-and-fix/ | audit/ → code/ → review/ | Security audit + fixes |
| Frontend UI (UI-01 to UI-20) | code-and-review/ | code/frontend → review/ | React components |

### 2.2 Action Chain Composition Patterns

**Pattern 1: Shared Types → Backend → Frontend**

```
Step 1: code/
  Define ChainStep interface additions
  Update WorkspaceEvent discriminated union

Step 2: code/backend
  Implement API endpoints (GET /api/sessions/:id/chains)
  Add route handlers + storage operations

Step 3: code/frontend
  Create React hooks (useChainState)
  Implement components (ChainDAG, SessionPane)

Step 4: review/
  Verify type safety + API contract
  Check component integration + accessibility
```

Example: REQ-ES-03 WebSocket Subscriptions (4 steps, 4 days)

**Pattern 2: Backend-Only Feature**

```
Step 1: code/backend
  Implement routes + middleware

Step 2: review/
  Security audit + performance check
```

Example: REQ-FO-04 File Watching (2 steps, 2 days)

**Pattern 3: Frontend-Only Feature**

```
Step 1: code/frontend
  Implement component + hooks + state

Step 2: review/
  UX/accessibility check
```

Example: REQ-SW-04 Window Configuration (2 steps, 2 days)

**Pattern 4: Cross-Package Refactor**

```
Step 1: analyze/
  Map dependencies + breaking changes

Step 2: plan/
  Document migration strategy

Steps 3-5: code/
  Update shared → backend → frontend

Step 6: test/
  Integration testing

Step 7: review/
  Architecture sign-off
```

### 2.3 Model Selection Rationale

| Action | Model | Rationale |
|--------|-------|-----------|
| code/backend, code/frontend, code/, test/ | haiku | Fast execution, simple patterns |
| review/, analyze/, plan/ | sonnet | Judgment for code quality, architecture |
| audit/ | opus | Deep security/performance analysis |

### 2.4 Implementation Sequence

**Critical Path (Serial):**
1. Shared types (2 days) → Session API (2 days) → WebSocket (4 days) → Frontend Context (2 days) → SessionPane (2 days) = **12 days**

**Parallelizable (After Step 5 WebSocket):**
- File Operations API + UI (2 weeks)
- Terminal Operations API + UI (1 week)
- Claude CLI (1 week)
- Other components (2 weeks)

**Optimized Total: 9 weeks** (4 weeks critical + 5 weeks parallel)

---

## SECTION 3: AGENT-LEVEL DESIGN

### 3.1 Backend Implementation Patterns

**Pattern 1: Express Router Middleware Chain**

All routes follow: Auth → Rate Limit → Validate → Route Handler → Error Handler

```typescript
router.post(
  '/',
  authMiddleware,           // API key validation
  writeLimiter,             // 30 req/15min
  validateBody(schema),     // Zod validation
  async (req, res, next) => {
    try {
      const result = await business_logic();
      res.json({ success: true, data: result });
    } catch (error) {
      next(error); // Global handler
    }
  }
);
```

**Pattern 2: Zod Validation Schemas**

```typescript
export const createSessionSchema = z.object({
  cwd: z.string()
    .min(1)
    .refine(path => !isPathDenied(path), 'System paths forbidden'),
  hostname: z.string().optional(),
});
```

**Pattern 3: Storage Provider Interface**

Unified interface supporting Memory (dev) and Redis (prod):

```typescript
interface Storage {
  getSession(sessionId: SessionId): Session | Promise<Session | undefined>;
  setSession(session: Session): void | Promise<void>;
  addEvent(sessionId: SessionId, event: WorkspaceEvent): void | Promise<void>;
  // ... more methods
}
```

Memory: Synchronous Maps. Redis: Async with TTL 24h and pub/sub.

**Pattern 4: WebSocket Event Handlers**

Per-message API key validation + rate limit:

```typescript
ws.on('message', async (data) => {
  const msg = JSON.parse(data);

  if (!clientRegistry.validateApiKey(ws, msg.apiKey)) {
    ws.send(JSON.stringify({ type: 'error', message: 'Invalid key' }));
    return;
  }

  if (!clientRegistry.checkRateLimit(ws)) {
    ws.send(JSON.stringify({ type: 'error', message: 'Rate limit' }));
    return;
  }

  // Handle message...
});
```

**Pattern 5: Redis Pub/Sub Broadcasting**

```typescript
async addEvent(sessionId, event) {
  // Store in Redis
  await this.client.lpush(`afw:events:${sessionId}`, JSON.stringify(event));
  await this.client.expire(`afw:events:${sessionId}`, 86400);

  // Publish to subscribers
  await this.publisher.publish('afw:events', JSON.stringify({ sessionId, event }));
}
```

**Pattern 6: File Watcher with Step Attribution**

```typescript
startWatching(sessionId, cwd) {
  const watcher = chokidar.watch(cwd, { depth: 10, persistent: true });

  watcher.on('change', (path) => {
    const activeStep = this.activeSteps.get(sessionId);
    broadcastFileEvent({
      type: 'file:modified',
      path,
      stepNumber: activeStep?.stepNumber,
      action: activeStep?.action,
    });
  });
}

setActiveStep(sessionId, stepNumber, action) {
  this.activeSteps.set(sessionId, { stepNumber, action });
}
```

**Pattern 7: HarmonyDetector Service**

```typescript
// Backend service for real-time validation of orchestrator output
class HarmonyDetector {
  checkOutput(text: string, sessionId: SessionId, context?: string): HarmonyCheck {
    // Parse output using contract-defined parsers
    const parsed = parseOrchestratorOutput(text);

    // Validate structure against CONTRACT.md specification
    if (!parsed || !validateStructure(parsed)) {
      return {
        valid: false,
        violations: extractViolations(parsed),
        degraded: true
      };
    }

    // Broadcast harmony events via WebSocket
    this.broadcast({
      type: 'harmony:check',
      sessionId,
      status: 'valid'
    });

    return { valid: true, violations: [] };
  }

  getHarmonyMetrics(target: SessionId, type: 'session' | 'global'): HarmonyMetrics {
    // Aggregate metrics: percentage valid, violation counts, trends
    return this.storage.getMetrics(target, type);
  }
}
```

**HarmonyDetector Service**
**Location:** `packages/backend/src/services/harmonyDetector.ts`
**Purpose:** Real-time validation of orchestrator output compliance with CONTRACT.md
**Dependencies:**
- `@afw/shared/contract` (parsers, patterns, types)
- `@afw/shared/harmonyTypes` (HarmonyCheck, HarmonyMetrics)
**Methods:**
- `checkOutput(text, sessionId, context)` — Parse and validate output
- `getHarmonyMetrics(target, type)` — Aggregate metrics
- `getHarmonyChecks(target, filter)` — Query violation history
**Events:** Broadcasts `harmony:check`, `harmony:violation`, `harmony:metrics-updated`
**Configuration:** maxTextLength=500, significantChangeThreshold=5%, maxViolationsPerSession=100, ttlDays=7

### 3.2 Frontend Implementation Patterns

**Pattern 1: React Hooks (useState, useEffect, useCallback)**

```typescript
export function useChainState(events: WorkspaceEvent[]): Chain | null {
  const [chain, setChain] = useState<Chain | null>(null);

  useEffect(() => {
    const compiledEvent = events.find(eventGuards.isChainCompiled);
    if (!compiledEvent) return;

    const newChain: Chain = { /* ... */ };

    // Update state from step events
    for (const event of events) {
      if (eventGuards.isStepCompleted(event)) {
        const step = newChain.steps.find(s => s.stepNumber === event.stepNumber);
        if (step) step.status = 'completed';
      }
    }

    setChain(newChain);
  }, [events]);

  return chain;
}
```

**Pattern 2: Context Providers with Auto-Reconnect**

```typescript
export function WebSocketProvider({ url, children }) {
  const [status, setStatus] = useState('connecting');
  const wsRef = useRef<WebSocket | null>(null);
  const callbacksRef = useRef(new Set());

  useEffect(() => {
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.addEventListener('open', () => setStatus('connected'));
    ws.addEventListener('message', (event) => {
      const message = JSON.parse(event.data);
      callbacksRef.current.forEach(cb => cb(message));
    });
    ws.addEventListener('close', () => setStatus('disconnected'));

    return () => ws.close();
  }, [url]);

  const onEvent = useCallback((callback) => {
    callbacksRef.current.add(callback);
    return () => callbacksRef.current.delete(callback);
  }, []);

  return (
    <WebSocketContext.Provider value={{ status, onEvent }}>
      {children}
    </WebSocketContext.Provider>
  );
}
```

**Pattern 3: useCallback to Prevent Child Re-renders**

```typescript
export function SessionPane({ session, onDetach }) {
  const handlePause = useCallback(async () => {
    await api.post(`/api/sessions/${session.id}/commands`, {
      command: { type: 'pause' }
    });
  }, [session.id]);

  return (
    <SessionHeader onPause={handlePause} />
  );
}
```

### 3.3 Shared Type Patterns

**Pattern 1: Branded Types with Factory Validation**

```typescript
export type SessionId = string & { readonly __brand: 'SessionId' };

export const brandedTypes = {
  sessionId(value: string): SessionId {
    if (!value || value.trim().length === 0) {
      throw new Error('SessionId cannot be empty');
    }
    return value as SessionId;
  },

  stepNumber(value: number): StepNumber {
    if (!Number.isInteger(value) || value < 1) {
      throw new Error('StepNumber must be >= 1');
    }
    return value as StepNumber;
  },

  timestamp(value: string | Date): Timestamp {
    return (typeof value === 'string' ? value : value.toISOString()) as Timestamp;
  },
};
```

**Pattern 2: Discriminated Unions with Type Guards**

```typescript
export type WorkspaceEvent =
  | SessionStartedEvent
  | ChainCompiledEvent
  | StepStartedEvent
  | StepCompletedEvent
  | // ... 20 more event types

export const eventGuards = {
  isSessionStarted(e: WorkspaceEvent): e is SessionStartedEvent {
    return e.type === 'session:started';
  },

  isChainCompiled(e: WorkspaceEvent): e is ChainCompiledEvent {
    return e.type === 'chain:compiled';
  },
  // ... more guards
};

// Usage: Type-safe narrowing
if (eventGuards.isStepStarted(event)) {
  console.log(event.stepNumber); // Known to exist
}
```

---

## SECTION 4: CROSS-CUTTING CONCERNS

### 4.1 Error Handling Strategy

**Backend:**
1. Route handler try/catch
2. Global error middleware (sanitizes, logs)
3. Returns 400/500 JSON response (no stack traces)

**Frontend:**
1. useAsyncOperation hook catches errors
2. Toast notification shows user-friendly message
3. Error logged with component context

**Graceful Degradation:**
- File watcher errors logged, watcher continues
- Redis failures fallback to polling
- Input queue overflow returns 429 (not silent drop)

### 4.2 Security Architecture

**API Key Validation:**
- Header: `X-API-Key: value`
- Query: `?apiKey=value` (risky, logs leakage)
- Per-message validation in WebSocket (catches key rotation)

**Path Validation:**
- Deny list: `/etc, /sys, C:\Windows, C:\Program Files, etc.`
- Normalization before check
- All file operations validated

**Input Validation:**
- All POST/PUT have Zod schemas
- Custom `.refine()` for domain logic
- Returns 400 with error details

**Rate Limiting:**
- General: 1,000 req/15min per IP
- Write: 30 req/15min per IP
- WebSocket: 50 msg/sec per client

### 4.3 Performance Targets & Optimization

| Operation | Target | Strategy |
|-----------|--------|----------|
| Session creation | < 100ms | Parallel path validation + watcher start |
| Event storage + broadcast | < 10ms | In-memory first, async Redis |
| File tree (1K files) | < 500ms | Depth limit (3 levels) |
| Terminal buffer (10K lines) | < 100ms | Line limit, FIFO eviction |
| DAG rendering (100+ steps) | 60fps | ReactFlow memoization, virtualization |
| Code editor (10K lines) | < 500ms | Viewport-only syntax highlighting |

**Optimizations:**
- Event: immediate memory, async Redis → non-blocking
- File tree: depth limit prevents expensive traversal
- Terminal: circular buffer, no unbounded growth
- Frontend: memoization, lazy load heavy libs

### 4.4 Monitoring & Logging

**Backend:**
```typescript
console.log(`[Session] Created ${sessionId} at ${cwd}`);
console.log(`[Event] ${event.type} for session ${sessionId}`);
console.error(`[Error] ${error.message}`);
```

**Frontend (dev only):**
```typescript
if (process.env.NODE_ENV === 'development') {
  console.log(`[WebSocket] Connected`);
  console.log(`[ChainDAG] Rendering ${steps.length} steps`);
}
```

**Missing (Phase 2):**
- Prometheus `/metrics` endpoint
- Request tracing (correlation IDs)
- Performance monitoring dashboard

---

## SECTION 5: IMPLEMENTATION SEQUENCE

### 5.1 41-Step Plan (9 Phases, 15 Weeks)

#### Phase 1: Foundation (Week 1, 6 steps)
1. Define shared types (Session, Chain, Step, User) — **2 days**
2. Define branded types (SessionId, ChainId, StepId, etc.) — **1 day**
3. Define event types & guards (24 events) — **2 days**
4. Define command types & validators — **1 day**
5. Setup Express app + middleware stack — **1 day**
6. Implement session storage interface (Memory + Redis) — **2 days**

#### Phase 2: Session Management API (Weeks 2-3, 6 steps)
7. POST /api/sessions (create) — **1 day**
8. GET /api/sessions (list) — **0.5 days**
9. PUT /api/sessions/:id (update) — **0.5 days**
10. Session history persistence — **1 day**
11. GET /api/sessions/:id (with chains) — **0.5 days**
12. Review session endpoints — **1 day**

#### Phase 3: WebSocket Infrastructure (Weeks 3-4, 5 steps)
13. WebSocket server + client registry — **2 days**
14. Event storage + Redis pub/sub — **2 days**
15. WebSocket event handlers (subscribe/input) — **1 day**
16. Test WebSocket flow — **1 day**
17. Review WebSocket — **1 day**

#### Phase 4: Frontend WebSocket (Week 4, 4 steps)
18. WebSocketContext + useWebSocket hook — **1 day**
19. Event filtering hooks — **1 day**
20. Vite setup + Electron skeleton — **1 day**
21. Review frontend WebSocket — **1 day**

#### Phase 5: Core UI (Weeks 5-6, 6 steps)
22. SessionPane component — **2 days**
23. ChainDAG (ReactFlow) — **2 days**
24. UserSidebar — **1 day**
25. ControlButtons — **1 day**
26. StepInspector modal — **1 day**
27. Review UI — **1 day**

#### Phase 6: File & Terminal Ops (Week 7, 7 steps)
28. File tree API — **1 day**
29. File read/write API — **1 day**
30. File watcher service — **1 day**
31. Terminal output buffer — **1 day**
32. FileExplorer + CodeEditor — **2 days**
33. TerminalTabs — **2 days**
34. Review file/terminal — **1 day**

#### Phase 7: Claude CLI (Week 8, 5 steps)
35. Claude CLI manager — **2 days**
36. Command queue API — **1 day**
37. Session discovery — **1 day**
38. ClaudeCliTerminal component — **1 day**
39. Project registry — **1 day**
40. Review CLI — **1 day**

#### Phase 8: Advanced Features (Week 9, 1 step)
41. Session windows grid — **1 day**

#### Phase 9: Security & Integration (Weeks 9-15, 4 steps)
42. Security audit — **2 days**
43. Fix critical findings — **2 days**
44. E2E testing — **3 days**
45. Final review + deployment prep — **2 days**

### 5.2 Dependency Graph

```
Shared Types (Phase 1)
    ↓ (blocks all)
Session API (Phase 2)
    ↓ (blocks WebSocket)
WebSocket (Phase 3)
    ↓ (blocks Frontend Context)
Frontend Context (Phase 4)
    ├→ Core UI (Phase 5)
    ├→ File Ops (Phase 6, parallel)
    ├→ Terminal (Phase 6, parallel)
    └→ CLI (Phase 7, parallel)
        ↓
Advanced Features (Phase 8)
    ↓
Security & Integration (Phase 9)
```

### 5.3 Critical Path Analysis

**Serial Dependencies (12 days, 2.4 weeks):**
1. Shared types (2 days)
2. Session API (2 days)
3. WebSocket (4 days)
4. Frontend Context (2 days)
5. SessionPane (2 days)

**Can Parallelize (5 weeks):**
- File API + UI (2 weeks)
- Terminal API + UI (1 week)
- CLI implementation (1 week)
- Other UI components (2 weeks)

**Optimized Total: 9 weeks** (4 weeks critical path + 5 weeks parallel)

---

## SECTION 6: RISK ASSESSMENT

### 6.1 Architectural Risks

| Risk | Impact | Likelihood | Mitigation | Detection |
|------|--------|-----------|-----------|-----------|
| WebSocket protocol change breaks clients | HIGH | MEDIUM | Implement protocol versioning | E2E tests, compatibility suite |
| Redis pub/sub failures | HIGH | LOW | Circuit breaker fallback to polling | Monitoring, health checks |
| Storage eviction loses sessions | MEDIUM | LOW | Switch to LRU + TTL | Load testing, audit |
| File watcher symlink following | MEDIUM | MEDIUM | Add `followSymlinks: false` | Security audit |
| Electron IPC boundary breach | HIGH | LOW | Whitelist channels in preload | Security audit, fuzzing |

### 6.2 Data Integrity Risks

| Risk | Impact | Likelihood | Mitigation | Detection |
|------|--------|-----------|-----------|-----------|
| Redis failover loses events | HIGH | LOW | Enable AOF persistence | Redis monitoring |
| File conflicts overwrite changes | MEDIUM | HIGH | Conflict detection + diff | Conflict dialog, timestamp |
| Terminal buffer overflow | MEDIUM | MEDIUM | Circular buffer + size limit | Memory monitoring |
| Event loss on backend crash | MEDIUM | LOW | Persist to disk before Redis | Audit trail |

### 6.3 Security Risks

| Risk | Impact | Likelihood | Mitigation | Detection |
|------|--------|-----------|-----------|-----------|
| Path traversal via symlinks | HIGH | MEDIUM | Validate paths, deny system | Path tests, audit |
| API key leakage in logs | MEDIUM | MEDIUM | Log sanitization | Grep logs, code review |
| Command injection via output | MEDIUM | LOW | HTML escape, use xterm safely | Security audit, fuzzing |
| Session enumeration (no ACL) | MEDIUM | HIGH | Implement per-session ACL | Access control tests |
| WebSocket auth bypass | HIGH | LOW | Per-message validation | Fuzz testing |

### 6.4 Performance Risks

| Risk | Impact | Likelihood | Mitigation | Detection |
|------|--------|-----------|-----------|-----------|
| Large file tree (1M+ files) timeout | MEDIUM | LOW | Streaming + pagination | Load test (1M files) |
| Event broadcast lag (1000+ clients) | MEDIUM | LOW | Use Redis pub/sub, batch | Scale test (1K clients) |
| Monaco editor freeze (50K lines) | MEDIUM | MEDIUM | Viewport-only rendering | Performance profile |
| xterm slowdown (100K lines) | MEDIUM | MEDIUM | Circular buffer, limit | Performance tests |

### 6.5 Mitigation Checklist

**Before Production Deploy:**
- [ ] Load test with 1K concurrent sessions
- [ ] Load test with 1K WebSocket clients
- [ ] Security audit (all 5 critical findings)
- [ ] Path traversal tests (symlinks, ../, system paths)
- [ ] API key rotation test
- [ ] Redis failover test
- [ ] Rate limiting test (verify 429)
- [ ] File conflict resolution test
- [ ] Terminal buffer overflow test (100K lines)
- [ ] Full E2E session lifecycle test

---

## SECTION 7: QUALITY ASSURANCE

### 7.1 Testing Strategy

**Unit Tests (80% target for shared types):**
```typescript
describe('Branded Types', () => {
  test('sessionId rejects empty', () => {
    expect(() => brandedTypes.sessionId('')).toThrow();
  });
  test('stepNumber enforces >= 1', () => {
    expect(() => brandedTypes.stepNumber(0)).toThrow();
    expect(brandedTypes.stepNumber(1)).toBe(1);
  });
});

describe('EventGuards', () => {
  test('isSessionStarted narrows type', () => {
    const event = createSessionStartedEvent();
    if (eventGuards.isSessionStarted(event)) {
      expect(event.cwd).toBeDefined();
    }
  });
});
```

**Integration Tests:**
```typescript
describe('WebSocket Event Flow', () => {
  test('client receives event after subscription', async () => {
    const ws = new WebSocket(`ws://localhost:3001/ws?apiKey=${KEY}`);
    const msgPromise = new Promise(resolve => {
      ws.on('message', resolve);
    });

    ws.send(JSON.stringify({ type: 'subscribe', sessionId }));

    await api.post('/api/events', {
      type: 'session:started',
      sessionId,
      cwd: '/tmp',
      timestamp: new Date().toISOString(),
    });

    const msg = await msgPromise;
    expect(msg.type).toBe('session:started');
  });
});
```

**E2E Tests (Full lifecycle):**
```typescript
describe('E2E: Session Lifecycle', () => {
  test('session flows from create through completion', async () => {
    // 1. Create session
    const sessionRes = await api.post('/api/sessions', { cwd: TEST_DIR });
    const sessionId = sessionRes.data.id;

    // 2. Connect WebSocket
    const ws = connectWebSocket(sessionId);
    const events = [];
    ws.on('message', msg => events.push(JSON.parse(msg)));

    // 3-5. Simulate execution...

    // 6. Verify session completed
    const session = await api.get(`/api/sessions/${sessionId}`);
    expect(session.data.status).toBe('completed');
  });
});
```

### 7.2 Code Review Checklist

**For Every PR:**

- [ ] **Types:**
  - No `any` types (except Express extensions)
  - Branded types for IDs
  - Discriminated unions for events
  - Zod schemas for requests

- [ ] **Error Handling:**
  - Try/catch with logging
  - Error messages don't leak details
  - Graceful degradation
  - User-facing errors actionable

- [ ] **Security:**
  - API key validation
  - Path validation (no traversal)
  - Zod input validation
  - No secrets in logs

- [ ] **Performance:**
  - No N+1 queries
  - Limits checked
  - Async non-blocking
  - WebSocket rate limits

- [ ] **Testing:**
  - Unit tests for shared types
  - Integration tests for APIs
  - E2E for features
  - >= 70% coverage

- [ ] **Documentation:**
  - JSDoc for public functions
  - Comments for complex logic
  - Schema change docs
  - API contract changes

### 7.3 Security Audit Checklist

**Before Production:**

- [ ] **Authentication:**
  - [ ] API key validation (header + query)
  - [ ] Per-message WebSocket validation
  - [ ] Key rotation detection
  - [ ] No key leakage in logs

- [ ] **Authorization:**
  - [ ] Per-session ACL implemented
  - [ ] Users can't bypass validation

- [ ] **Input Validation:**
  - [ ] All POST/PUT have Zod
  - [ ] Path validation works
  - [ ] File sizes limited (10MB)
  - [ ] Recursion depth limited

- [ ] **Data Protection:**
  - [ ] Sensitive data not logged
  - [ ] Error messages sanitized
  - [ ] File content not exposed
  - [ ] Event payloads validated

- [ ] **Infrastructure:**
  - [ ] HTTPS enforced (prod)
  - [ ] CORS origins whitelisted
  - [ ] Rate limiting enabled
  - [ ] Request size limits (1MB)

---

## SECTION 8: LEARNINGS & IMPROVEMENT AREAS

### 8.1 Technical Debt

| Item | Severity | Impact | Fix | Effort |
|------|----------|--------|-----|--------|
| Generic `Record<string, unknown>` | MEDIUM | Loose typing | Define InputSchema per action | 3 days |
| 20+ type assertions (`as any`) | MEDIUM | False safety | Proper Express/ReactFlow types | 2 days |
| No per-session ACL | HIGH | Security risk | Add userId checks to all endpoints | 2 days |
| API key in query params | MEDIUM | Logs leakage | Header-only support | 1 day |
| Missing event broadcasts | MEDIUM | UI desync | Broadcast awaiting_input events | 1 day |
| No request logging | LOW | Can't audit | Add structured logging | 1 day |
| Redis listing broken | MEDIUM | Feature gap | Implement SCAN pagination | 1 day |

### 8.2 Phase 2+ Improvements

1. **Flow Visualization Swimlanes** (1 week)
   - Swimlane grouping by agent/category
   - Animated node entrance (slide-in, pulse)
   - Animated edges (golden flow)

2. **Session Replay & Debugging** (2 weeks)
   - Step-level replay, breakpoints, time-travel

3. **Multi-User Collaboration** (3 weeks)
   - Session sharing, comments, diff

4. **Metrics & Analytics** (2 weeks)
   - Success rate, duration, top errors

5. **Advanced Search** (1 week)
   - Full-text, filters, saved views

### 8.3 Framework Learnings

**Lesson 1: Type Safety Prevents Silent Failures**
- Branded types caught 3 identity-mixing bugs
- Recommendation: Extend to ActionName, FlowName

**Lesson 2: Discriminated Unions Enable Exhaustive Matching**
- Event type guards caught 2 missing cases
- Recommendation: Use for Command subtypes, Error types

**Lesson 3: Storage Abstraction Enables Flexibility**
- Memory/Redis dual implementation supports dev & prod
- Recommendation: Apply pattern to FileWatcher, ClaudeCliManager

**Lesson 4: WebSocket Rate Limiting Essential**
- Single client can DOS others without it
- Recommendation: Document as non-negotiable

**Lesson 5: Error Sanitization Prevents Info Leaks**
- Stack traces in errors exposed implementation
- Recommendation: Audit all error paths

---

## APPENDIX A: API ENDPOINT SUMMARY

**44 Endpoints across 11 modules:**

| Module | Count | Methods |
|--------|-------|---------|
| Sessions | 8 | POST, GET, PUT (create, list, get, update, input, awaiting) |
| Commands | 3 | POST, GET, POST /ack |
| Events | 3 | POST, GET, GET /recent |
| Terminal | 3 | POST, GET, DELETE |
| Files | 4 | GET (tree, read), POST (write), GET (diff) |
| History | 5 | GET /dates, /sessions, /:sessionId, /stats, POST /cleanup |
| Claude CLI | 4 | POST /start, /input, /stop, GET /status |
| Session Windows | 5 | GET, /enriched, POST /follow, DELETE /follow, PUT /config |
| Projects | 6 | GET, POST, GET/:id, PUT, DELETE, POST /detect |
| Discovery | 1 | GET /sessions |
| Users | 2 | GET, GET/:userId/sessions |

---

## APPENDIX B: SHARED TYPE DEFINITIONS

**84 exported types across 7 modules:**

- types.ts (12): Branded types, enums, utilities
- models.ts (15): Session, Chain, Step, User, Command
- events.ts (30): 24 event types + 6 guards/utilities
- commands.ts (12): Command types, validators, builder
- sessionWindows.ts (8): UI state, layouts, quick actions
- projects.ts (3): Project registry, detection
- index.ts (4): Legacy, re-exports

---

## CONCLUSION

This comprehensive SRD provides a complete technical specification across three layers:

1. **Orchestrator-Level:** Clear routing (Engineering dept), chain composition patterns, model selection rationale
2. **Agent-Level:** 6 backend patterns, 4 frontend patterns, 2 shared type patterns with code examples
3. **Cross-Cutting:** Error handling, security architecture, performance optimization, testing & QA

**Critical Success Factors:**
- Type safety via branded types + discriminated unions
- Unified storage interface (Memory/Redis)
- Per-session ACL implementation
- WebSocket subscription model
- File watcher with step attribution

**Implementation:** 41 steps across 9 phases (15 weeks), critical path 12 days (2.4 weeks), optimized total 9 weeks.

---

**Document Status:** ✅ COMPLETE
**Approval:** Ready for Implementation Phase 1-9
**Next Steps:** Begin Phase 1 (Shared Types + Foundation)

---

**Cross-References:**
- [FRD.md](./FRD.md) — Functional requirements
- [DOCS_INDEX.md](./DOCS_INDEX.md) — Documentation index
- [FRONTEND_IMPLEMENTATION_STATUS.md](./status/FRONTEND_IMPLEMENTATION_STATUS.md) — Frontend status
- [IMPLEMENTATION_STATUS.md](./status/IMPLEMENTATION_STATUS.md) — Backend status
