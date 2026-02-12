# Service Layer & Business Logic Architecture Analysis

## Executive Summary

The ActionFlows Dashboard backend implements a **layered service architecture** with clear separation of concerns between storage, services, and routes. The architecture follows modern Node.js patterns with TypeScript, dependency injection through constructor parameters, and event-driven communication via WebSockets.

---

## 1. Complete Service Inventory

### Core Infrastructure Services (8)
| Service | Responsibility | Dependencies | Public API |
|---------|---------------|--------------|------------|
| **ClaudeCliManager** | Manages Claude Code CLI sessions with MCP auto-config | ClaudeCliSession, Storage | `startSession()`, `stopSession()`, `getSession()`, `setBroadcastFunction()` |
| **FileWatcher** | Watches file system changes per session | chokidar, Storage | `startWatching()`, `stopWatching()`, `setBroadcastFunction()` |
| **SnapshotService** | Periodic snapshots for memory storage persistence | Storage | `start()`, `stop()`, `loadLatestSnapshot()`, `saveSnapshot()` |
| **CleanupService** | TTL-based cleanup of stale sessions/resources | Storage | `start()`, `stop()`, singleton pattern |
| **LifecycleManager** | Tracks resource lifecycle phases | Storage | `transitionPhase()`, `startChecking()`, `stopChecking()` |
| **Telemetry** | Centralized logging and metrics | Storage | `log()`, singleton pattern |
| **ActivityTracker** | Tracks user activity for TTL extension | Storage | `recordActivity()`, `getActivityStats()` |
| **TerminalBuffer** | Manages terminal output buffering | None | `append()`, `getBuffer()`, `clear()` |

### Discovery & Living Universe Services (4)
| Service | Responsibility | Dependencies | Public API |
|---------|---------------|--------------|------------|
| **DiscoveryService** | Evaluates discovery triggers, fog-of-war transitions | Storage | `evaluateDiscovery()`, `recordInteraction()`, `recordChainCompleted()` |
| **EvolutionService** | Simulates region growth/decay over time | Storage | `tick()`, `start()`, `stop()` |
| **ConnectionInference** | Infers connections between regions | ForceDirectedLayout | `inferConnections()`, `generateEdges()` |
| **ForceDirectedLayout** | Force-directed graph layout algorithm | None | `computeLayout()` |

### Contract Compliance & Validation Services (7)
| Service | Responsibility | Dependencies | Public API |
|---------|---------------|--------------|------------|
| **HarmonyDetector** | Monitors orchestrator output compliance | Storage, ContractParser | `checkOutput()`, `getHarmonyMetrics()`, `setBroadcastFunction()` |
| **AgentValidator** | Validates agent behavior contracts | Storage | `validateBehavior()`, `getViolations()` |
| **GateValidator** | Validates gate checkpoints | Storage | `validateGate()`, `getTraces()` |
| **GateCheckpoint** | Auditable gate verification system | Storage | `recordCheckpoint()`, `queryCheckpoints()` |
| **ConversationWatcher** | Monitors Claude Code JSONL logs | Storage, FileWatcher | `start()`, `stop()`, watches `.claude/conversations/` |
| **HealingRecommendations** | Generates healing recommendations | Storage, HealthScoreCalculator | `generateRecommendations()`, `acceptRecommendation()` |
| **HealthScoreCalculator** | Aggregates health scores | Storage | `calculateScore()`, `getHealthHistory()` |

### Data Analysis & Intelligence Services (8)
| Service | Responsibility | Dependencies | Public API |
|---------|---------------|--------------|------------|
| **ProjectDetector** | Detects project type from codebase | FileSystem | `detectProject()`, `analyzeStack()` |
| **ProjectStorage** | Persists project metadata | Storage | `saveProject()`, `getProject()` |
| **RegistryStorage** | Manages registry entries (flows, actions) | FileSystem | `loadRegistry()`, `saveEntry()`, `deleteEntry()` |
| **PatternAnalyzer** | Detects patterns in user behavior | FrequencyTracker | `analyzePatterns()`, `detectRepetition()` |
| **FrequencyTracker** | Tracks action frequency | Storage | `trackAction()`, `getFrequency()` |
| **ConfidenceScorer** | Scores pattern confidence | None | `score()` |
| **LayerResolver** | Resolves 7-layer system hierarchy | None | `resolveLayer()` |
| **StoryService** | Generates narrative story from session | Storage | `generateStory()` |

### Communication & Broadcasting Services (3)
| Service | Responsibility | Dependencies | Public API |
|---------|---------------|--------------|------------|
| **SparkBroadcaster** | Broadcasts spark traveling events (Phase 4) | EventEmitter | `emitSpark()`, `on('spark:traveling')` |
| **BridgeStrengthService** | Tracks bridge strength metrics | Storage | `recordStrength()`, `getBridgeMetrics()` |
| **ClaudeCliMessageAggregator** | Aggregates Claude CLI streaming output | None | `processMessage()`, `getAggregatedOutput()` |

**Total Services: 30 services**

---

## 2. Storage Layer Analysis

### Interface Design

The storage layer uses a **unified interface pattern** with dual implementations:

```typescript
// Unified Storage Interface
export interface Storage {
  // Core CRUD operations
  getSession(sessionId: SessionId): Session | Promise<Session>;
  setSession(session: Session): void | Promise<void>;
  deleteSession(sessionId: SessionId): void | Promise<void>;

  // Optional methods (implementation-specific)
  sessions?: Map<SessionId, Session>; // Memory only
  subscribe?(channel: string, callback): Promise<void>; // Redis only
  snapshot?(): any; // Memory only
}
```

### Implementation Comparison

| Feature | MemoryStorage | RedisStorage | ResilientStorage |
|---------|---------------|--------------|------------------|
| **Type** | Synchronous Maps | Async ioredis | Wrapper with fallback |
| **Persistence** | Snapshot files | Redis server | Primary → Memory fallback |
| **Pub/Sub** | ❌ No | ✅ Yes | Best-effort (Redis only) |
| **TTL** | Manual eviction | Native Redis TTL | Proxied to primary |
| **Scaling** | Single instance | Multi-instance | Single with resilience |
| **Circuit Breaker** | N/A | N/A | ✅ Yes (5 failures, 30s reset) |

### Data Access Patterns

1. **Direct Access** (Memory): `storage.sessions.get(sessionId)`
2. **Async Access** (Redis): `await storage.getSession(sessionId)`
3. **Hybrid Check**: `isAsyncStorage(storage)` to determine implementation

### Key Design Decisions

- **Sync/Async Abstraction**: Routes handle both with Promise.resolve()
- **Memory Bounds**: Hard limits (1K sessions, 10K events, 100 chains)
- **FIFO Eviction**: Oldest completed sessions evicted first
- **Lifecycle Hooks**: Integration with LifecycleManager for tracking
- **Freshness Tracking**: Timestamped access for staleness detection

---

## 3. Business Logic Distribution

### Separation of Concerns

```
┌─────────────────────────────────────────────────────────┐
│                        Routes                           │
│  - Request validation (Zod schemas)                     │
│  - HTTP concerns (status codes, headers)                │
│  - Input sanitization                                   │
│  - Response formatting                                  │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                       Services                          │
│  - Business logic                                       │
│  - Domain rules                                         │
│  - Coordination between resources                       │
│  - Event broadcasting                                   │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                       Storage                           │
│  - Data persistence                                     │
│  - CRUD operations                                      │
│  - Query filtering                                      │
│  - TTL enforcement                                      │
└─────────────────────────────────────────────────────────┘
```

### Examples by Layer

**Routes (`sessions.ts`):**
- ✅ Validate `cwd` is a directory
- ✅ Check denied paths (system directories)
- ✅ Apply rate limiting
- ✅ Format JSON responses
- ❌ NO business logic (session creation delegated to storage)

**Services (`harmonyDetector.ts`):**
- ✅ Parse orchestrator output
- ✅ Determine compliance (valid/degraded/violation)
- ✅ Calculate harmony metrics
- ✅ Broadcast violation events
- ❌ NO HTTP concerns
- ❌ NO direct storage manipulation (uses storage interface)

**Storage (`memory.ts`):**
- ✅ Store sessions in Map
- ✅ Enforce max session limit
- ✅ FIFO eviction
- ✅ Track freshness timestamps
- ❌ NO business rules (doesn't know what a "violation" is)

### Anti-Pattern Detection

**Good Separation:**
```typescript
// Route: Validates + delegates
router.post('/sessions', async (req, res) => {
  const validated = createSessionSchema.parse(req.body);
  await storage.setSession(validated);
  res.json(validated);
});
```

**Bad Coupling (NOT FOUND):**
```typescript
// Routes do NOT contain business logic like this:
// ❌ if (session.chains.length > 10) throw new Error(...)
```

---

## 4. Dependency Injection Patterns

### Service Registration

Services are initialized in **`index.ts`** using factory functions:

```typescript
// Phase 1: Create storage
const storage = new ResilientStorage(baseStorage);

// Phase 2: Initialize services with storage dependency
const harmonyDetector = initializeHarmonyDetector(storage);
const discoveryService = initDiscoveryService(storage);
const gateCheckpoint = initGateCheckpoint(storage);

// Phase 3: Wire event handlers
harmonyDetector.setBroadcastFunction(broadcastHarmonyEvent);
gateCheckpoint.on('gate:checkpoint', (trace) => { ... });
```

### Initialization Patterns

1. **Singleton Pattern**: `ClaudeCliManager`, `Telemetry`, `CleanupService`
2. **Factory Functions**: `initializeHarmonyDetector(storage)`
3. **Constructor Injection**: `new DiscoveryService(storage)`

### Service Lifecycle

```typescript
// Startup sequence (index.ts)
server.listen(PORT, async () => {
  await initializeRedisPubSub();           // 1. Pub/Sub
  await snapshotService.loadLatestSnapshot(); // 2. Restore state

  setBroadcastFunction(...);                // 3. Wire broadcasts
  await registryStorage.initialize();       // 4. Load registry

  initializeHarmonyDetector(storage);       // 5. Initialize services
  initDiscoveryService(storage);

  cleanupService.start();                   // 6. Start background tasks
  lifecycleManager.startChecking();
});

// Shutdown sequence (gracefulShutdown)
await snapshotService.saveSnapshot();       // 1. Save state
cleanupService.stop();                      // 2. Stop tasks
sparkBroadcaster.shutdown();                // 3. Cleanup services
await shutdownAllWatchers();                // 4. Close watchers
await storage.disconnect();                 // 5. Close connections
```

---

## 5. Service-to-Service Communication

### Communication Patterns

1. **Direct Method Calls**
   ```typescript
   // HarmonyDetector → Storage
   await this.storage.addHarmonyCheck(check);
   ```

2. **Event Emitter Pattern**
   ```typescript
   // SparkBroadcaster emits events
   sparkBroadcaster.on('spark:traveling', (event) => {
     clientRegistry.broadcastToSession(event.sessionId, message);
   });
   ```

3. **Broadcast Functions**
   ```typescript
   // Services register broadcast callbacks
   harmonyDetector.setBroadcastFunction(broadcastHarmonyEvent);
   ```

4. **Shared Storage State**
   ```typescript
   // Services coordinate via storage
   const session = await storage.getSession(sessionId);
   const chains = await storage.getChains(sessionId);
   ```

### Coupling Analysis

| Service Pair | Coupling Type | Coupling Level |
|--------------|---------------|----------------|
| Routes ↔ Storage | Interface dependency | **Low** ✅ |
| Services ↔ Storage | Interface dependency | **Low** ✅ |
| HarmonyDetector ↔ ContractParser | Module import | **Medium** ⚠️ |
| DiscoveryService ↔ EvolutionService | Independent | **None** ✅ |
| ClaudeCliManager ↔ ClaudeCliSession | Composition | **High** ⚠️ |

**Tight Coupling Identified:**
- `ClaudeCliManager` directly instantiates `ClaudeCliSession` (composition pattern)
- `HarmonyDetector` imports contract parser (could be injected)

**Recommendation:** Consider extracting contract parsing into a separate service for testability.

---

## 6. Data Flow Patterns

### Request → Response Flow

```
┌──────────┐     ┌────────────┐     ┌─────────────┐     ┌─────────┐
│  Client  │────▶│   Route    │────▶│   Service   │────▶│ Storage │
│ (HTTP)   │     │ (Express)  │     │  (Logic)    │     │ (Data)  │
└──────────┘     └────────────┘     └─────────────┘     └─────────┘
                      │                    │                   │
                      │ 1. Validate        │                   │
                      │ 2. Rate limit      │                   │
                      │                    │ 3. Business       │
                      │                    │    logic          │
                      │                    │                   │ 4. Persist
                      │                    │                   │
                      │◀───────────────────┘                   │
                      │ 5. Broadcast event                     │
                      │                                        │
                      │◀───────────────────────────────────────┘
                      │ 6. Format response                     │
                      │                                        │
                      ▼                                        │
```

### Example: Session Creation

1. **Route** (`sessions.ts:77`)
   - Validates `cwd` directory exists
   - Checks denied paths
   - Creates session object with branded types

2. **Storage** (`memory.ts:195`)
   - Checks session capacity (max 1000)
   - Evicts oldest completed session if full
   - Stores in sessions Map
   - Updates sessionsByUser index
   - Records freshness timestamp

3. **Side Effects**
   - `FileWatcher` starts watching cwd
   - `ClientRegistry` broadcasts `session:started` event
   - All connected WebSocket clients receive event

---

## 7. Best Practices Assessment

### ✅ Strengths

1. **Clear Separation of Concerns**
   - Routes handle HTTP
   - Services handle business logic
   - Storage handles data

2. **Type Safety**
   - Branded types (`SessionId`, `ChainId`)
   - Discriminated unions for events
   - Zod schemas for validation

3. **Error Handling**
   - Global error handler middleware
   - Sanitized error messages
   - Try-catch at route boundaries

4. **Security**
   - Path traversal prevention
   - System directory protection
   - Rate limiting (general, write, session creation)
   - Input validation (Zod schemas)

5. **Resilience**
   - Circuit breaker for Redis failures
   - Graceful degradation to memory storage
   - Snapshot/restore for persistence

6. **Observability**
   - Centralized telemetry service
   - Console logging with prefixes
   - Lifecycle tracking

### ⚠️ Areas for Improvement

1. **Service Registration**
   - Manual initialization in index.ts
   - No dependency injection container
   - **Recommendation:** Consider using InversifyJS or TSyringe

2. **Testing Complexity**
   - Singletons hard to mock
   - Storage coupling via module import
   - **Recommendation:** Inject storage via constructor everywhere

3. **Error Propagation**
   - Some services silently swallow errors
   - **Example:** File watcher failures don't fail session creation
   - **Recommendation:** Consistent error logging + telemetry

4. **Transaction Support**
   - No atomic operations across storage entities
   - **Example:** Session creation + file watcher start not atomic
   - **Recommendation:** Consider saga pattern for multi-step operations

5. **Service Discovery**
   - Services registered via global imports
   - **Recommendation:** Service locator pattern or DI container

---

## 8. Architectural Recommendations

### Short-Term (Quick Wins)

1. **Extract Contract Parser Service**
   ```typescript
   // Current
   import { parseOrchestratorOutput } from '@afw/shared';

   // Recommended
   class ContractParserService {
     constructor(private contractVersion: string) {}
     parse(text: string): ParsedOutput { ... }
   }
   ```

2. **Consistent Error Handling**
   - Add telemetry to all error boundaries
   - Return structured errors from services

3. **Service Health Checks**
   - Add `/health/services` endpoint
   - Report status of each service

### Medium-Term (Refactoring)

1. **Dependency Injection Container**
   ```typescript
   const container = new Container();
   container.bind(Storage).to(ResilientStorage);
   container.bind(HarmonyDetector).toSelf();

   // Routes become
   router.post('/', (req, res) => {
     const service = container.get(SessionService);
     service.createSession(req.body);
   });
   ```

2. **Service Layer Abstraction**
   - Create `SessionService` to encapsulate session logic
   - Move business rules from routes to services

3. **Event Bus**
   - Replace direct broadcast functions with event bus
   - Decouple services from WebSocket infrastructure

### Long-Term (Architecture Evolution)

1. **Command Query Responsibility Segregation (CQRS)**
   - Separate read/write models
   - Optimize queries independently

2. **Domain-Driven Design (DDD)**
   - Define aggregates (Session, Chain, Region)
   - Enforce consistency boundaries

3. **Microservices Extraction**
   - Claude CLI management → Separate service
   - File watching → Separate service
   - Allows independent scaling

---

## 9. Summary Metrics

| Metric | Value | Assessment |
|--------|-------|------------|
| **Total Services** | 30 | Well-modularized ✅ |
| **Service Lines of Code** | ~15,000 | Manageable ✅ |
| **Storage Implementations** | 3 (Memory, Redis, Resilient) | Good abstraction ✅ |
| **Routes** | 28 route files | Clear organization ✅ |
| **Coupling Level** | Low-Medium | Mostly decoupled ✅ |
| **Business Logic Location** | 80% in services | Good separation ✅ |
| **Test Coverage** | 5 test files | Needs improvement ⚠️ |
| **Singleton Services** | 8 | Consider DI container ⚠️ |

**Overall Assessment: Strong foundation with room for DI/testing improvements** ✅

---

## File Paths Referenced

### Storage Layer
- `/d/ActionFlowsDashboard/packages/backend/src/storage/index.ts`
- `/d/ActionFlowsDashboard/packages/backend/src/storage/memory.ts`
- `/d/ActionFlowsDashboard/packages/backend/src/storage/redis.ts`
- `/d/ActionFlowsDashboard/packages/backend/src/storage/resilientStorage.ts`
- `/d/ActionFlowsDashboard/packages/backend/src/storage/file-persistence.ts`

### Service Layer (Key Examples)
- `/d/ActionFlowsDashboard/packages/backend/src/services/claudeCliManager.ts`
- `/d/ActionFlowsDashboard/packages/backend/src/services/discoveryService.ts`
- `/d/ActionFlowsDashboard/packages/backend/src/services/harmonyDetector.ts`

### Routes Layer (Key Examples)
- `/d/ActionFlowsDashboard/packages/backend/src/routes/sessions.ts`
- `/d/ActionFlowsDashboard/packages/backend/src/routes/harmony.ts`

### Bootstrap
- `/d/ActionFlowsDashboard/packages/backend/src/index.ts`
