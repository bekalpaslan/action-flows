# Chain Visualization Data Flow Gap Analysis

**Metadata:**
- **Aspect:** Data Flow & System Integration
- **Scope:** Chain visualization pipeline from orchestrator → backend → frontend
- **Date:** 2026-02-10
- **Agent:** Analysis Agent

---

## 1. Executive Summary

The Chain DAG / Flow Visualization panel shows "No Active Chain" because **chains are never stored in the backend database**. The dashboard is correctly querying `GET /api/sessions/:id/chains`, which returns `[]` because no chains exist in storage.

**Root Cause:** The orchestrator (Claude Code CLI) compiles chains as **markdown tables in chat messages**. These are text rendered in the chat panel, not structured Chain objects. There is no mechanism to convert these text representations into backend Chain records.

**Critical Gap:** The `ChainCompiledEvent` is emitted by the hook but **only stores event data, not Chain objects**. Events and Chains are separate storage domains, and there is no bridge between them.

---

## 2. Current Data Flow (As-Built)

### 2.1 Chain Compilation (Orchestrator → Chat)

```
┌─────────────────────────────────────────────────────────────┐
│ Orchestrator (Claude Code CLI)                              │
│ - Compiles chain as markdown table                          │
│ - Renders to chat stream:                                   │
│   ## Chain: Title                                            │
│   | # | Action | Model | Inputs | Waits For | Status |      │
│   |---|--------|-------|--------|-----------|--------|      │
│   | 1 | code/  | haiku | ...    | —         | Pending|      │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼ (Stop hook fires)
┌─────────────────────────────────────────────────────────────┐
│ afw-chain-parse.ts Hook                                      │
│ - Parses markdown table from chat message                   │
│ - Extracts: title, steps[], source, executionMode           │
│ - Builds ChainCompiledEvent                                 │
│ - POST /api/events                                          │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ Backend: POST /api/events (events.ts)                       │
│ - Validates event schema                                    │
│ - Calls: storage.addEvent(sessionId, event)                 │
│ - Stores in: events Map<SessionId, WorkspaceEvent[]>        │
│ - Broadcasts event via WebSocket                            │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ Storage Layer (memory.ts)                                   │
│ - addEvent() → events.set(sessionId, [events])              │
│                                                              │
│ PROBLEM: No chain storage happens here!                     │
│                                                              │
│ chains Map<SessionId, Chain[]> remains EMPTY                │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Chain Retrieval (Frontend → Backend)

```
┌─────────────────────────────────────────────────────────────┐
│ FlowVisualization.tsx / ChainDAG.tsx                         │
│ - Requires: chain: Chain prop                               │
│ - Prop provided by parent component                         │
│ - Parent must fetch chain from backend                      │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼ (Query chains endpoint)
┌─────────────────────────────────────────────────────────────┐
│ Frontend: GET /api/sessions/:id/chains                      │
│ - Expected: Array<Chain> with steps, status, etc.           │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ Backend: GET /api/sessions/:id/chains (sessions.ts:282)     │
│ - Calls: storage.getChains(sessionId)                       │
│ - Returns: chains from chains Map                           │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ Storage Layer (memory.ts:257)                               │
│ getChains(sessionId: SessionId): Chain[] {                  │
│   return this.chains.get(sessionId) || [];                  │
│ }                                                            │
│                                                              │
│ RESULT: Returns [] because chains Map is empty              │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. The Missing Link: Event → Chain Conversion

### 3.1 What Exists

**Type Definitions:**
- `Chain` interface (`packages/shared/src/models.ts:65-122`)
  - Has full structure: id, sessionId, title, steps[], status, timestamps
- `ChainCompiledEvent` interface (`packages/shared/src/events.ts:86-102`)
  - Has parsed data: chainId, title, steps (as ChainStepSnapshot[]), source, executionMode

**Storage Methods:**
- `storage.addChain(sessionId, chain)` — EXISTS (memory.ts:245)
- `storage.getChains(sessionId)` — EXISTS (memory.ts:257)
- `storage.getChain(chainId)` — EXISTS (memory.ts:260)

**Hook Infrastructure:**
- `afw-chain-parse.ts` — Parses markdown tables, emits ChainCompiledEvent
- Event storage — Works correctly (events are stored)
- WebSocket broadcasting — Works correctly (events reach frontend)

### 3.2 What's Missing

**NO mechanism to:**
1. Convert `ChainCompiledEvent` → `Chain` object
2. Call `storage.addChain()` when a ChainCompiledEvent is received
3. Create subsequent Chain objects when `chain:started` or `chain:completed` events arrive

**Location of the Gap:**
The conversion should happen in `packages/backend/src/routes/events.ts` after receiving a ChainCompiledEvent, but currently the code only stores the event:

```typescript
// Current code (events.ts:23-35)
router.post('/', writeLimiter, validateBody(createEventSchema), async (req, res) => {
  const event: WorkspaceEvent = req.body;

  if (event.sessionId) {
    await Promise.resolve(storage.addEvent(event.sessionId, event));
    // ⬆️ STOPS HERE — never creates a Chain object
  }

  // Missing:
  // if (event.type === 'chain:compiled') {
  //   const chainEvent = event as ChainCompiledEvent;
  //   const chain = buildChainFromEvent(chainEvent);
  //   await Promise.resolve(storage.addChain(event.sessionId, chain));
  // }
});
```

---

## 4. WebSocket Events (Chain-Related)

The shared types define these chain events:

**Event Types:**
- `chain:compiled` — When orchestrator compiles a chain (markdown table parsed)
- `chain:started` — When execution begins (currently not emitted)
- `chain:completed` — When execution finishes (currently not emitted)

**Event Flow:**
1. Hook emits `chain:compiled` event → backend stores event → broadcasts to frontend
2. Frontend can subscribe to events via WebSocket (`useEvents` hook)
3. BUT: Events ≠ Chains. Events are ephemeral notifications. Chains are persistent objects.

**Verification:**
- `useChainEvents.ts` listens for `step:spawned`, `step:completed`, etc. (not chain events)
- `useChainState.ts` expects a Chain object to be provided, doesn't fetch it
- NO hook or component currently listens to `chain:compiled` to fetch/construct chains

---

## 5. Component Requirements

### 5.1 ChainDAG Component

**File:** `packages/app/src/components/ChainDAG/ChainDAG.tsx`

**Props:**
```typescript
interface ChainDAGProps {
  chain: Chain;  // ⬅️ Requires full Chain object
  onStepSelected?: (stepNumber: StepNumber) => void;
  onStepUpdate?: (stepNumber: number, updates: any) => void;
}
```

**Data Source:** Props (expects parent to provide `chain`)

**Current State:** Will render "No Active Chain" if `chain` prop is undefined/null

### 5.2 FlowVisualization Component

**File:** `packages/app/src/components/FlowVisualization/FlowVisualization.tsx`

**Props:**
```typescript
export interface FlowVisualizationProps {
  chain: Chain;  // ⬅️ Requires full Chain object
  onStepClick?: (stepNumber: number) => void;
  enableAnimations?: boolean;
}
```

**Data Source:** Props (expects parent to provide `chain`)

**Usage:** Called from session window or workbench with `chain` prop

---

## 6. MCP Server

**File:** `packages/mcp-server/src/index.ts`

**Capabilities:**
- `check_commands` — Poll for control commands (pause, resume, cancel)
- `ack_command` — Acknowledge command processing

**Chain-Related:** NONE. The MCP server only handles control commands, not chain data.

---

## 7. Recommended Fix Approach

### 7.1 Backend: Event-to-Chain Bridge (Primary Fix)

**File to Modify:** `packages/backend/src/routes/events.ts`

**Changes:**
1. Add helper function to convert `ChainCompiledEvent` → `Chain`:
   ```typescript
   function buildChainFromEvent(event: ChainCompiledEvent): Chain {
     return {
       id: event.chainId || brandedTypes.chainId(`${event.sessionId}-${Date.now()}`),
       sessionId: event.sessionId,
       userId: event.user,
       title: event.title || 'Untitled Chain',
       steps: (event.steps || []).map(s => ({
         stepNumber: brandedTypes.stepNumber(s.stepNumber),
         action: s.action,
         model: s.model as ModelString || 'haiku',
         inputs: s.inputs || {},
         waitsFor: s.waitsFor?.map(n => brandedTypes.stepNumber(n)) || [],
         status: 'pending' as StatusString,
         description: s.description,
       })),
       source: event.source || 'composed',
       ref: event.ref,
       status: 'pending',
       compiledAt: event.timestamp,
       executionMode: event.executionMode,
     };
   }
   ```

2. In `POST /api/events` handler, detect `chain:compiled` and create Chain:
   ```typescript
   if (event.sessionId) {
     await Promise.resolve(storage.addEvent(event.sessionId, event));

     // NEW: Convert chain events to Chain objects
     if (event.type === 'chain:compiled') {
       const chainEvent = event as ChainCompiledEvent;
       const chain = buildChainFromEvent(chainEvent);
       await Promise.resolve(storage.addChain(event.sessionId, chain));
       console.log(`[API] Created chain: ${chain.id} with ${chain.steps.length} steps`);
     }
   }
   ```

3. Handle `chain:started` and `chain:completed` events to update Chain status:
   ```typescript
   if (event.type === 'chain:started') {
     const chainEvent = event as ChainStartedEvent;
     const chain = await storage.getChain(chainEvent.chainId);
     if (chain) {
       chain.status = 'in_progress';
       chain.startedAt = event.timestamp;
       await storage.addChain(event.sessionId, chain); // Update
     }
   }
   ```

**Effort:** 2-3 hours (includes testing)

### 7.2 Frontend: Chain Fetching Hook (Optional Enhancement)

**File to Create:** `packages/app/src/hooks/useActiveChain.ts`

**Purpose:** Fetch and subscribe to chain updates for a session

```typescript
export function useActiveChain(sessionId: SessionId) {
  const [chains, setChains] = useState<Chain[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch chains on mount
    fetch(`/api/sessions/${sessionId}/chains`)
      .then(res => res.json())
      .then(data => {
        setChains(data.chains || []);
        setLoading(false);
      });

    // Listen for chain:compiled events and refetch
    // ... WebSocket subscription logic
  }, [sessionId]);

  return {
    activeChain: chains[chains.length - 1], // Most recent
    allChains: chains,
    loading,
  };
}
```

**Effort:** 1-2 hours

### 7.3 Alternative: Parse Chains from Chat Messages (Not Recommended)

Instead of using events, parse chains directly from chat message history.

**Pros:** Works with existing chat infrastructure
**Cons:**
- Fragile (depends on markdown format)
- Duplication of parsing logic (hook already does this)
- No real-time updates
- Requires reprocessing chat history on every load

**Verdict:** Avoid this approach. Use events → chains bridge instead.

---

## 8. Type Mapping Reference

### ChainCompiledEvent → Chain

| ChainCompiledEvent Field | Chain Field | Transformation |
|--------------------------|-------------|----------------|
| `chainId` | `id` | Direct (or generate if missing) |
| `sessionId` | `sessionId` | Direct |
| `user` | `userId` | Direct |
| `title` | `title` | Default to "Untitled Chain" if null |
| `steps` (ChainStepSnapshot[]) | `steps` (ChainStep[]) | Map + add status='pending' |
| `source` | `source` | Default to 'composed' if null |
| `ref` | `ref` | Direct |
| `timestamp` | `compiledAt` | Direct |
| `executionMode` | `executionMode` | Direct |
| N/A | `status` | Set to 'pending' |

### ChainStepSnapshot → ChainStep

| Snapshot Field | Step Field | Notes |
|----------------|------------|-------|
| `stepNumber` | `stepNumber` | Cast to StepNumber brand |
| `action` | `action` | Direct |
| `model` | `model` | Cast to ModelString (default 'haiku') |
| `inputs` | `inputs` | Default to {} if missing |
| `waitsFor` | `waitsFor` | Map numbers to StepNumber[] |
| `description` | `description` | Direct |
| N/A | `status` | Set to 'pending' |

---

## 9. Files Requiring Changes

### Backend Changes (Required)

1. **`packages/backend/src/routes/events.ts`** (PRIMARY FIX)
   - Add `buildChainFromEvent()` helper
   - Add chain creation logic in POST /api/events
   - Add chain update logic for chain:started, chain:completed
   - **Lines to modify:** ~30-60 (new function + event handler additions)

2. **`packages/backend/src/storage/memory.ts`** (NO CHANGES NEEDED)
   - `addChain()`, `getChains()` already exist and work correctly

3. **`packages/backend/src/storage/redis.ts`** (FOLLOW-UP)
   - Implement same chain creation logic for Redis storage
   - **Effort:** 1-2 hours (after memory storage works)

### Frontend Changes (Optional Enhancement)

4. **`packages/app/src/hooks/useActiveChain.ts`** (NEW FILE)
   - Create hook to fetch chains for a session
   - Listen to WebSocket for chain updates
   - **Lines:** ~80-100

5. **Component Integration** (IF using new hook)
   - Modify parent components to use `useActiveChain(sessionId)`
   - Pass fetched chain to ChainDAG/FlowVisualization
   - Files: WorkbenchLayout.tsx, SessionPanel.tsx, etc.
   - **Effort:** 30 minutes per component

### Hook Changes (Optional)

6. **`packages/hooks/src/afw-step-spawned.ts`** (ENHANCEMENT)
   - Emit `chain:started` when step 1 spawns
   - **Effort:** 15 minutes

7. **`packages/hooks/src/afw-step-completed.ts`** (ENHANCEMENT)
   - Detect when last step completes
   - Emit `chain:completed` event
   - **Effort:** 30 minutes

---

## 10. Testing Strategy

### 10.1 Backend Testing

**Manual Test:**
1. Start backend: `pnpm dev:backend`
2. Create session: `POST /api/sessions` with valid cwd
3. Mock ChainCompiledEvent: `POST /api/events` with:
   ```json
   {
     "type": "chain:compiled",
     "sessionId": "session-123",
     "timestamp": "2026-02-10T13:00:00Z",
     "chainId": "chain-456",
     "title": "Test Chain",
     "steps": [
       {"stepNumber": 1, "action": "code/", "model": "haiku", "inputs": {}, "waitsFor": []}
     ],
     "source": "flow",
     "executionMode": "sequential"
   }
   ```
4. Query chains: `GET /api/sessions/session-123/chains`
5. Verify response contains 1 chain with correct data

**Unit Test:**
- Add test to `packages/backend/src/__tests__/routes.test.ts`
- Test `buildChainFromEvent()` function
- Test POST /api/events with chain:compiled creates chain

### 10.2 Integration Testing

**E2E Test with Real Hook:**
1. Install hooks: `pnpm --filter @afw/hooks build && pnpm --filter @afw/hooks install-hooks`
2. Start backend and frontend
3. Run orchestrator: Compile a real chain
4. Verify chain appears in dashboard

### 10.3 Frontend Testing

**Component Test:**
1. Mock fetch for `/api/sessions/:id/chains` to return test chain
2. Render ChainDAG with fetched chain
3. Verify nodes and edges render correctly

---

## 11. Effort Estimate

### Minimum Viable Fix (Backend Only)

| Task | Effort | Priority |
|------|--------|----------|
| Add buildChainFromEvent helper | 30 min | P0 |
| Modify POST /api/events handler | 1 hour | P0 |
| Add chain:started/completed logic | 1 hour | P1 |
| Backend testing | 1 hour | P0 |
| **Total** | **3.5 hours** | - |

### Complete Solution (Backend + Frontend)

| Task | Effort | Priority |
|------|--------|----------|
| Backend changes (above) | 3.5 hours | P0 |
| Create useActiveChain hook | 1 hour | P1 |
| Update parent components | 1 hour | P1 |
| Hook enhancements (chain events) | 45 min | P2 |
| Redis storage support | 2 hours | P2 |
| E2E testing | 1 hour | P1 |
| **Total** | **9.25 hours** | - |

---

## 12. Recommendations

### Immediate (P0)
1. ✅ Implement `buildChainFromEvent()` in events.ts
2. ✅ Add chain creation logic to POST /api/events
3. ✅ Test with mock ChainCompiledEvent

### Short-Term (P1)
4. ✅ Add chain update logic for chain:started, chain:completed
5. ✅ Create `useActiveChain()` hook
6. ✅ Update parent components to fetch chains
7. ✅ E2E test with real orchestrator

### Medium-Term (P2)
8. Enhance hooks to emit chain:started/completed
9. Add Redis storage support for chains
10. Add chain status badges in session list
11. Add "View Chain" button in chat when chain compiled

### Long-Term (P3)
12. Chain history view (show past chains in session)
13. Chain comparison (diff two executions)
14. Chain templates (save chains as reusable flows)

---

## Learnings

**Issue:** Chain visualization broken due to missing event-to-domain-object conversion
**Root Cause:** Events (ephemeral notifications) treated same as domain objects (persistent entities)
**Suggestion:** Event handlers should bridge to domain storage when events represent entity lifecycle changes

**[FRESH EYE]** The hook infrastructure is solid and the event parsing works correctly. The problem is architectural: treating events as the single source of truth instead of using events to trigger domain model updates. This pattern (event → domain conversion) should be applied to other entity types like Steps when they have their own lifecycle events.

---

## Appendix: Key File Paths

### Backend
- Storage interface: `packages/backend/src/storage/index.ts`
- Memory storage: `packages/backend/src/storage/memory.ts`
- Events route: `packages/backend/src/routes/events.ts`
- Sessions route: `packages/backend/src/routes/sessions.ts`
- WebSocket handler: `packages/backend/src/ws/handler.ts`

### Frontend
- ChainDAG component: `packages/app/src/components/ChainDAG/ChainDAG.tsx`
- FlowVisualization: `packages/app/src/components/FlowVisualization/FlowVisualization.tsx`
- Chain state hook: `packages/app/src/hooks/useChainState.ts`
- Chain events hook: `packages/app/src/hooks/useChainEvents.ts`

### Shared
- Type definitions: `packages/shared/src/types.ts`
- Model definitions: `packages/shared/src/models.ts`
- Event definitions: `packages/shared/src/events.ts`

### Hooks
- Chain parser: `packages/hooks/src/afw-chain-parse.ts`
- Step spawned: `packages/hooks/src/afw-step-spawned.ts`
- Step completed: `packages/hooks/src/afw-step-completed.ts`

### MCP
- MCP server: `packages/mcp-server/src/index.ts`
