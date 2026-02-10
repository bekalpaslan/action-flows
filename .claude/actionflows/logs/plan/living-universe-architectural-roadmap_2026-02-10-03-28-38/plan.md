# Implementation Plan: Living Universe Architectural Improvements

## Executive Summary

This roadmap addresses 6 critical architectural pressure points discovered through a "living universe" analysis of the ActionFlows Dashboard. The improvements enhance the system's resilience, observability, and longevity by introducing:
1. **Freshness awareness** (temporal gradients for data aging)
2. **Structured telemetry** (capture currently-lost observability data)
3. **Activity-aware TTLs** (temporal reconciliation between event-time and wall-clock time)
4. **Persistent dev storage** (snapshot-based resurrection for MemoryStorage)
5. **Circuit breakers** (cascading failure isolation)
6. **Coordinated lifecycle management** (unified cleanup orchestration)

**Phasing strategy:** Start with foundational observability (Phase 1), add resilience mechanisms (Phase 2), then optimize lifecycle management (Phase 3).

---

## Priority & Phasing

### Phase 1: Observability Foundation (Weeks 1-2)
**Goal:** Capture data that currently vanishes + establish freshness awareness

- **Step 2:** Structured Telemetry Layer (BLACK HOLES) — **HIGH PRIORITY**
- **Step 1:** Freshness Metadata System (DATA AGING) — **MEDIUM PRIORITY**

**Rationale:** Can't improve what you can't measure. Telemetry is the eyes/ears for diagnosing issues. Freshness awareness enables smarter caching/invalidation decisions.

### Phase 2: Resilience Mechanisms (Weeks 3-4)
**Goal:** Prevent cascading failures + add fallback modes

- **Step 5:** Circuit Breaker Infrastructure (CASCADING FAILURE) — **HIGH PRIORITY**
- **Step 3:** Activity-Aware TTL System (DUAL-TIME DIVERGENCE) — **MEDIUM PRIORITY**

**Rationale:** Circuit breakers protect the system from total failure when components die. Activity-aware TTLs prevent premature session expiration (critical for long-running chains).

### Phase 3: Lifecycle Optimization (Weeks 5-6)
**Goal:** Unified cleanup + dev persistence

- **Step 6:** Coordinated Lifecycle Manager (DECOMPOSER BLINDNESS) — **MEDIUM PRIORITY**
- **Step 4:** Snapshot-Based MemoryStorage Persistence (MEMORYSTORAGE AMNESIA) — **LOW PRIORITY**

**Rationale:** Improves developer experience + reduces coordination bugs between cleanup mechanisms.

---

## Step 1: Freshness Metadata System (Data Aging Awareness)

### Problem Statement
Data in the system is binary: present or gone. No concept of "stale" or "fresh." Components consuming session data can't know "this session was last updated 45 minutes ago and might be stale." This leads to:
- UI showing stale data without warning
- Consumers unable to preemptively refresh aging data
- No cache invalidation based on age

### Solution Architecture
Introduce a **Freshness Metadata Layer** that tracks `lastModifiedAt` timestamps for all major resource types (sessions, chains, events, chat history) and provides freshness queries.

### Affected Files

**Shared Package (Types):**
- `packages/shared/src/types.ts` — Add `FreshnessMetadata` type:
  ```typescript
  export type FreshnessGrade = 'fresh' | 'recent' | 'aging' | 'stale';
  export interface FreshnessMetadata {
    lastModifiedAt: Timestamp;
    lastAccessedAt: Timestamp;
    freshnessGrade: FreshnessGrade;
    ageMs: DurationMs;
  }
  ```

**Backend (Storage Layer):**
- `packages/backend/src/storage/memory.ts` — Add freshness tracking maps:
  - `sessionFreshness: Map<SessionId, Timestamp>`
  - `chainFreshness: Map<ChainId, Timestamp>`
  - `eventFreshness: Map<SessionId, Timestamp>`
- Add methods:
  - `updateFreshness(resourceType, resourceId, timestamp)`
  - `getFreshness(resourceType, resourceId): FreshnessMetadata`
  - `getStaleResources(resourceType, staleThreshold: DurationMs): ResourceId[]`

- `packages/backend/src/storage/redis.ts` — Similar changes, use Redis `ZADD` for sorted sets by timestamp for efficient stale queries

**Backend (API Layer):**
- `packages/backend/src/routes/sessions.ts` — Add `GET /api/sessions/:id/freshness` endpoint
- `packages/backend/src/routes/events.ts` — Add `freshness` field to event list responses

**Frontend (Hooks):**
- `packages/app/src/hooks/useFreshness.ts` (NEW) — React hook for freshness queries:
  ```typescript
  export function useFreshness(resourceType: 'session' | 'chain' | 'events', resourceId: string) {
    const [freshness, setFreshness] = useState<FreshnessMetadata | null>(null);
    // Poll freshness API every 30s
  }
  ```

**Frontend (UI):**
- `packages/app/src/components/SessionList/SessionListItem.tsx` — Show freshness indicator (green dot = fresh, yellow = aging, red = stale)
- `packages/app/src/components/ChainDAG/ChainDAG.tsx` — Dim stale chains in visualization

### Implementation Steps

1. **Define freshness types** in `shared/src/types.ts` (30 min)
2. **Add freshness tracking to MemoryStorage** (2 hours)
   - Intercept all `setSession()`, `addChain()`, `addEvent()` calls to update freshness
   - Implement freshness calculation based on age thresholds:
     - `fresh`: < 1 minute
     - `recent`: 1-30 minutes
     - `aging`: 30 minutes - 2 hours
     - `stale`: > 2 hours
3. **Add freshness tracking to RedisStorage** (2 hours)
   - Use sorted sets (ZADD) with timestamps as scores
   - Implement `ZRANGEBYSCORE` queries for stale resource detection
4. **Create freshness API endpoint** (1 hour)
5. **Build frontend hook + UI indicators** (3 hours)
6. **Write tests** (2 hours)

### Dependencies
- None (foundational feature)

### Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Performance overhead (extra writes per operation) | Low | Batch freshness updates in memory, flush to Redis async |
| Race conditions (freshness updated after resource deleted) | Low | Check resource existence before freshness query |
| Frontend polling adds network overhead | Low | Use 30s polling interval, only for visible resources |

### Effort Estimate
**Medium (M)** — ~10 hours of dev work across 3 packages

---

## Step 2: Structured Telemetry Layer (Black Holes)

### Problem Statement
Three categories of data currently vanish:
1. **console.log() black hole** — Logs go to stdout, not queryable or stored
2. **Error-swallowing catch blocks** — Errors logged then dropped (e.g., fileWatcher.ts:266-268)
3. **Rate-limited message drops** — Excess messages silently discarded

This creates observability blind spots. Cannot answer: "What errors occurred in the last hour?" or "How many messages were rate-limited today?"

### Solution Architecture
Introduce a **StructuredTelemetry Service** that:
- Replaces all `console.log()` calls with structured logging (Winston)
- Captures errors from try/catch blocks into a queryable store
- Tracks rate-limit violations and other silent drops
- Provides query API for telemetry data

### Affected Files

**Shared Package (Types):**
- `packages/shared/src/types.ts` — Add telemetry types:
  ```typescript
  export type TelemetryLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  export interface TelemetryEntry {
    id: string;
    timestamp: Timestamp;
    level: TelemetryLevel;
    source: string; // e.g., 'fileWatcher', 'wsHandler'
    message: string;
    metadata?: Record<string, unknown>;
    sessionId?: SessionId;
    userId?: UserId;
  }
  ```

**Backend (New Service):**
- `packages/backend/src/services/telemetry.ts` (NEW) — Structured telemetry service:
  ```typescript
  import winston from 'winston';

  class TelemetryService {
    private logger: winston.Logger;
    private recentEntries: TelemetryEntry[] = []; // Last 1000 entries in memory

    log(level: TelemetryLevel, source: string, message: string, metadata?: Record<string, unknown>);
    query(filters: TelemetryQueryFilter): TelemetryEntry[];
    flush(): void; // Write recent entries to storage
  }

  export const telemetry = new TelemetryService();
  ```

**Backend (Storage Layer):**
- `packages/backend/src/storage/memory.ts` — Add telemetry storage:
  - `telemetryEntries: TelemetryEntry[]` (FIFO, max 10K entries)
  - `addTelemetryEntry(entry: TelemetryEntry): void`
  - `queryTelemetry(filter: TelemetryQueryFilter): TelemetryEntry[]`

- `packages/backend/src/storage/redis.ts` — Same, with 7-day TTL

**Backend (Service Instrumentation):**
- `packages/backend/src/services/fileWatcher.ts` — Replace all `console.log()` with `telemetry.log()`, add error capture in catch blocks (line 266-268)
- `packages/backend/src/ws/clientRegistry.ts` — Log rate-limit violations to telemetry
- `packages/backend/src/services/claudeCliManager.ts` — Replace console logs
- `packages/backend/src/index.ts` — Replace console logs in heartbeat, startup, shutdown

**Backend (API Layer):**
- `packages/backend/src/routes/telemetry.ts` (NEW) — API endpoints:
  - `GET /api/telemetry` — Query telemetry entries with filters (level, source, timeRange, sessionId)
  - `GET /api/telemetry/stats` — Aggregate stats (error count by source, rate-limit violations)

**Frontend (UI):**
- `packages/app/src/components/TelemetryViewer/TelemetryViewer.tsx` (NEW) — Log viewer panel (filterable table)
- Add to Workbench or as modal accessible from toolbar

### Implementation Steps

1. **Install Winston** — `pnpm add winston` (5 min)
2. **Create TelemetryService** in `services/telemetry.ts` (2 hours)
   - Configure Winston with console + in-memory transports
   - Implement FIFO buffer for recent entries
3. **Add telemetry storage to MemoryStorage + RedisStorage** (1 hour)
4. **Instrument 4 critical services** (3 hours)
   - fileWatcher.ts, clientRegistry.ts, claudeCliManager.ts, index.ts
   - Replace ~40 console.log() calls + 12 error-swallowing catch blocks
5. **Create telemetry API routes** (2 hours)
6. **Build TelemetryViewer UI component** (4 hours)
7. **Write tests** (2 hours)

### Dependencies
- None (foundational feature)

### Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Memory overhead (storing 10K telemetry entries) | Low | FIFO eviction + compression for old entries |
| Performance impact (every log call writes to storage) | Medium | Async batch writes to storage, Winston buffers logs |
| Breaking existing log parsing tools | Low | Winston can still write to stdout in same format |

### Effort Estimate
**Large (L)** — ~14 hours of dev work, high instrumentation surface area

---

## Step 3: Activity-Aware TTL System (Dual-Time Divergence)

### Problem Statement
Chain execution lives in **event-time** (step completion signals), but TTLs and cleanup live in **wall-clock time**. A session could expire mid-chain because the TTL doesn't know the chain is still actively executing. This causes:
- Sessions evicted while agents are still working
- Frontend loses connection to active sessions
- Data loss for long-running chains (> 24 hours)

### Solution Architecture
Introduce **Activity-Aware TTL** that extends TTLs automatically when activity is detected (new events, step progress, input received).

### Affected Files

**Shared Package (Types):**
- `packages/shared/src/types.ts` — Add activity tracking fields to Session type:
  ```typescript
  export interface Session {
    // ... existing fields
    lastActivityAt?: Timestamp; // NEW
    activityTtlExtensions?: number; // NEW - count of extensions
  }
  ```

**Backend (Storage Layer):**
- `packages/backend/src/storage/redis.ts` — Modify TTL management:
  - `extendSessionTtl(sessionId: SessionId, activityType: string): void` — Extend by 6 hours on activity
  - Hook into `addEvent()`, `addChain()`, `queueInput()` to auto-extend TTL
  - Track extension count to prevent indefinite extensions (max 4 extensions = 24h + 4*6h = 48h total)

- `packages/backend/src/storage/memory.ts` — Similar changes (simulate TTL expiration with last-activity checks)

**Backend (Service Layer):**
- `packages/backend/src/services/activityTracker.ts` (NEW) — Activity detection service:
  ```typescript
  export class ActivityTracker {
    trackActivity(sessionId: SessionId, activityType: 'event' | 'input' | 'step_progress'): void;
    isSessionActive(sessionId: SessionId): boolean;
    getInactiveSessions(inactiveThreshold: DurationMs): SessionId[];
  }
  ```

**Backend (Integration Points):**
- `packages/backend/src/ws/handler.ts` — Call `activityTracker.trackActivity()` on input messages
- `packages/backend/src/routes/events.ts` — Call `activityTracker.trackActivity()` when events added
- `packages/backend/src/services/claudeCliManager.ts` — Track activity when Claude CLI outputs messages

**Backend (API Layer):**
- `packages/backend/src/routes/sessions.ts` — Add `lastActivityAt` field to session responses

**Frontend (UI):**
- `packages/app/src/components/SessionList/SessionListItem.tsx` — Show "Active" badge for sessions with recent activity (< 5 minutes)

### Implementation Steps

1. **Define activity types and tracking logic** (1 hour)
2. **Add activity fields to Session type** (30 min)
3. **Create ActivityTracker service** (2 hours)
4. **Modify RedisStorage TTL logic** (3 hours)
   - Implement auto-extension on activity
   - Add max extension limit (prevent indefinite growth)
5. **Instrument activity tracking points** (2 hours)
   - 3 integration points: wsHandler, events router, claudeCliManager
6. **Update frontend to show activity status** (1 hour)
7. **Write tests** (2 hours)

### Dependencies
- **Step 2 (Telemetry)** — Log TTL extensions for observability

### Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Indefinite TTL extensions (sessions never expire) | High | Hard cap on extension count (max 4 extensions) |
| Race condition (TTL expires just before extension) | Low | Extension adds time from current TTL, not from scratch |
| Increased Redis memory usage (longer TTLs) | Medium | Monitor Redis memory, add alerting |

### Effort Estimate
**Medium (M)** — ~11 hours of dev work

---

## Step 4: Snapshot-Based MemoryStorage Persistence (MemoryStorage Amnesia)

### Problem Statement
Dev mode loses **everything** on process restart. Every time the backend restarts during development:
- All sessions vanish
- Chat history lost
- Frontend sees empty dashboard

This is a poor developer experience. Production uses Redis (persistent), but dev mode has no persistence layer.

### Solution Architecture
Add **snapshot-to-disk** capability for MemoryStorage:
- Serialize storage state to JSON on interval (every 5 minutes)
- Serialize on graceful shutdown (SIGTERM/SIGINT)
- Deserialize on startup (restore from snapshot)
- Store snapshots in `.actionflows-snapshot/` directory (gitignored)

### Affected Files

**Backend (Storage Layer):**
- `packages/backend/src/storage/memory.ts` — Add snapshot methods:
  ```typescript
  export interface MemoryStorage {
    // ... existing methods
    snapshot(): StorageSnapshot; // NEW
    restore(snapshot: StorageSnapshot): void; // NEW
  }

  interface StorageSnapshot {
    sessions: Array<Session>;
    events: Array<{ sessionId: SessionId; events: WorkspaceEvent[] }>;
    chains: Array<{ sessionId: SessionId; chains: Chain[] }>;
    chatHistory: Array<{ sessionId: SessionId; messages: ChatMessage[] }>;
    // ... other maps
    timestamp: Timestamp;
  }
  ```

**Backend (New Service):**
- `packages/backend/src/services/snapshotService.ts` (NEW) — Snapshot orchestration:
  ```typescript
  export class SnapshotService {
    private snapshotDir = '.actionflows-snapshot';
    private intervalId: NodeJS.Timeout | null = null;

    start(): void; // Start 5-minute interval snapshots
    stop(): void; // Stop interval
    saveSnapshot(): Promise<void>; // Write storage.snapshot() to disk
    loadSnapshot(): Promise<StorageSnapshot | null>; // Read latest snapshot
  }
  ```

**Backend (Server Lifecycle):**
- `packages/backend/src/index.ts` — Integrate snapshot service:
  - On startup: `await snapshotService.loadSnapshot()` if using MemoryStorage
  - Start snapshot interval: `snapshotService.start()`
  - On shutdown: `await snapshotService.saveSnapshot()` before process exit

**Infrastructure:**
- `.gitignore` — Add `.actionflows-snapshot/`

### Implementation Steps

1. **Create `.actionflows-snapshot/` directory structure** (15 min)
2. **Implement `snapshot()` method in MemoryStorage** (2 hours)
   - Serialize all Map structures to JSON
   - Handle Set → Array conversions
3. **Implement `restore()` method in MemoryStorage** (2 hours)
   - Deserialize JSON to Maps/Sets
   - Validate snapshot version compatibility
4. **Create SnapshotService** (3 hours)
   - File I/O with compression (gzip)
   - Rotation (keep last 3 snapshots)
5. **Integrate with server lifecycle** (1 hour)
6. **Add snapshot metadata** (version, timestamp, checksum) (1 hour)
7. **Write tests** (2 hours)

### Dependencies
- None (isolated feature)

### Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Snapshot file corruption | Medium | Keep 3 rotated snapshots, add checksum validation |
| Large snapshot files (slow I/O) | Low | Compress with gzip, async writes don't block server |
| Race condition (snapshot during state mutation) | Medium | Clone storage state before serialization |

### Effort Estimate
**Medium (M)** — ~11 hours of dev work

---

## Step 5: Circuit Breaker Infrastructure (Cascading Failure)

### Problem Statement
When critical components fail, the entire system fails:
- **Storage dies** → Process restart required (no fallback)
- **WebSocket server dies** → Frontend goes blind (no HTTP fallback)
- **File watcher dies** → File changes invisible (no recovery)

No circuit breakers, no graceful degradation, no isolation of failure domains.

### Solution Architecture
Introduce **Circuit Breaker Pattern** for 3 critical components:
1. **StorageCircuitBreaker** — Wrap storage calls, fallback to in-memory cache on Redis failure
2. **WebSocketCircuitBreaker** — Detect WebSocket death, fallback to HTTP polling for events
3. **FileWatcherCircuitBreaker** — Detect watcher crashes, restart automatically with backoff

### Affected Files

**Backend (New Infrastructure):**
- `packages/backend/src/infrastructure/circuitBreaker.ts` (NEW) — Generic circuit breaker:
  ```typescript
  type CircuitState = 'closed' | 'open' | 'half-open';

  export class CircuitBreaker<T> {
    private state: CircuitState = 'closed';
    private failureCount = 0;
    private failureThreshold = 5;
    private resetTimeout = 30000; // 30s

    async execute(operation: () => Promise<T>, fallback: () => Promise<T>): Promise<T>;
  }
  ```

**Backend (Storage Layer):**
- `packages/backend/src/storage/resilientStorage.ts` (NEW) — Wrapper around storage with circuit breaker:
  ```typescript
  export class ResilientStorage implements Storage {
    private circuitBreaker: CircuitBreaker<unknown>;
    private primaryStorage: Storage; // Redis or Memory
    private fallbackStorage: MemoryStorage; // Always in-memory fallback

    // All methods proxy through circuitBreaker.execute()
  }
  ```

**Backend (WebSocket):**
- `packages/backend/src/ws/resilientWebSocket.ts` (NEW) — WebSocket health monitor + HTTP fallback:
  ```typescript
  export class ResilientWebSocketServer {
    private healthCheckInterval: NodeJS.Timeout;
    private isHealthy = true;

    enableHttpFallback(): void; // Activate HTTP polling endpoints
    disableHttpFallback(): void; // Restore WebSocket-only mode
  }
  ```

- `packages/backend/src/routes/events.ts` — Add HTTP polling endpoint:
  - `GET /api/events/poll/:sessionId` — Long-polling endpoint (30s timeout)

**Backend (File Watcher):**
- `packages/backend/src/services/fileWatcher.ts` — Add auto-restart logic:
  ```typescript
  function startWatchingWithRetry(sessionId: SessionId, cwd: string, maxRetries = 3): void {
    let retryCount = 0;
    const startWithBackoff = () => {
      try {
        startWatching(sessionId, cwd);
      } catch (err) {
        telemetry.log('error', 'fileWatcher', 'Watcher crash, retrying...', { retryCount });
        if (retryCount < maxRetries) {
          setTimeout(startWithBackoff, Math.pow(2, retryCount) * 1000); // Exponential backoff
          retryCount++;
        }
      }
    };
    startWithBackoff();
  }
  ```

**Backend (Server Integration):**
- `packages/backend/src/index.ts` — Replace direct storage with ResilientStorage

**Frontend (Hooks):**
- `packages/app/src/hooks/useWebSocket.ts` — Add HTTP fallback detection:
  - If WebSocket connection fails after 3 retries, switch to HTTP polling
  - Show banner: "Real-time updates unavailable, using polling mode"

### Implementation Steps

1. **Create generic CircuitBreaker class** (3 hours)
2. **Implement ResilientStorage wrapper** (4 hours)
   - Fallback to in-memory cache on Redis failure
   - Log circuit state transitions to telemetry
3. **Add WebSocket health monitoring** (3 hours)
   - HTTP polling fallback endpoints
4. **Implement FileWatcher auto-restart** (2 hours)
5. **Integrate ResilientStorage into server** (1 hour)
6. **Build frontend HTTP polling fallback** (3 hours)
7. **Write tests** (3 hours)

### Dependencies
- **Step 2 (Telemetry)** — Log circuit breaker state transitions

### Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Fallback mode hides real failure (silent degradation) | Medium | Log all circuit breaker state changes, show UI warning |
| HTTP polling adds server load | Medium | Rate-limit polling endpoints, max 1 req/5s per client |
| Circuit breaker false positives (temporary network blip) | Low | 5-failure threshold before opening circuit |

### Effort Estimate
**Extra Large (XL)** — ~19 hours of dev work, complex integration

---

## Step 6: Coordinated Lifecycle Manager (Decomposer Blindness)

### Problem Statement
Three cleanup mechanisms operate independently:
1. **Cleanup service** — Daily file cleanup (7-day retention)
2. **FIFO eviction** — MemoryStorage evicts at capacity limits
3. **Redis TTL** — Automatic key expiration (24h for sessions)

No coordination. Data could be evicted from memory while still actively referenced by frontend. No holistic view of data lifecycle.

### Solution Architecture
Introduce **LifecycleManager** that orchestrates all cleanup mechanisms:
- Centralized lifecycle policies (per resource type)
- Coordination between FIFO eviction and Redis TTL
- Pre-eviction notifications (allow components to save state)
- Lifecycle event stream (for observability)

### Affected Files

**Shared Package (Types):**
- `packages/shared/src/types.ts` — Add lifecycle event types:
  ```typescript
  export type LifecyclePhase = 'active' | 'idle' | 'expiring' | 'evicted';
  export interface LifecycleEvent {
    type: 'lifecycle:transition';
    resourceType: 'session' | 'chain' | 'event';
    resourceId: string;
    fromPhase: LifecyclePhase;
    toPhase: LifecyclePhase;
    reason: string;
    timestamp: Timestamp;
  }
  ```

**Backend (New Service):**
- `packages/backend/src/services/lifecycleManager.ts` (NEW) — Lifecycle orchestration:
  ```typescript
  interface LifecyclePolicy {
    resourceType: 'session' | 'chain' | 'event';
    idleThreshold: DurationMs; // Time before marking as idle
    expiringThreshold: DurationMs; // Time before marking as expiring
    evictionStrategy: 'lru' | 'fifo' | 'ttl';
  }

  export class LifecycleManager {
    private policies: Map<string, LifecyclePolicy>;
    private lifecycleStates: Map<string, LifecyclePhase>;

    registerPolicy(policy: LifecyclePolicy): void;
    checkLifecycle(resourceType: string, resourceId: string): void;
    notifyPreEviction(resourceType: string, resourceId: string): void;
    transitionPhase(resourceType: string, resourceId: string, toPhase: LifecyclePhase, reason: string): void;
  }
  ```

**Backend (Storage Layer):**
- `packages/backend/src/storage/memory.ts` — Hook eviction to LifecycleManager:
  - Call `lifecycleManager.notifyPreEviction()` before `_evictOldestCompletedSession()`
  - Emit lifecycle events on eviction

- `packages/backend/src/storage/redis.ts` — Similar hooks for TTL-based eviction:
  - Use Redis keyspace notifications to detect expirations
  - Call `lifecycleManager.transitionPhase()` on TTL expiration

**Backend (Service Integration):**
- `packages/backend/src/services/cleanup.ts` — Coordinate with LifecycleManager:
  - Query `lifecycleManager.getEvictableResources()` before cleanup
  - Emit lifecycle events when deleting date folders

**Backend (API Layer):**
- `packages/backend/src/routes/lifecycle.ts` (NEW) — Lifecycle query endpoints:
  - `GET /api/lifecycle/:resourceType` — Get lifecycle states
  - `GET /api/lifecycle/policies` — Get lifecycle policies

**Frontend (UI):**
- `packages/app/src/components/SessionList/SessionListItem.tsx` — Show lifecycle phase indicator:
  - Green = active, Yellow = idle, Orange = expiring, Red = evicted

### Implementation Steps

1. **Define lifecycle policies** (1 hour)
2. **Create LifecycleManager service** (4 hours)
   - Implement phase transition logic
   - Emit lifecycle events to storage + telemetry
3. **Hook FIFO eviction in MemoryStorage** (2 hours)
4. **Hook Redis TTL expiration** (3 hours)
   - Enable Redis keyspace notifications
   - Listen for expired key events
5. **Integrate CleanupService with LifecycleManager** (2 hours)
6. **Create lifecycle API routes** (2 hours)
7. **Build frontend lifecycle indicators** (2 hours)
8. **Write tests** (3 hours)

### Dependencies
- **Step 2 (Telemetry)** — Log lifecycle transitions
- **Step 3 (Activity-Aware TTL)** — Activity tracking informs lifecycle phases

### Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Increased complexity (one more orchestration layer) | Medium | Keep LifecycleManager stateless, policies config-driven |
| Race condition (eviction + access) | Low | Pre-eviction notification gives components time to react |
| Redis keyspace notifications not enabled | High | Auto-enable on startup, fail loudly if Redis doesn't support it |

### Effort Estimate
**Large (L)** — ~19 hours of dev work, high coordination surface

---

## Dependency Graph

```
Phase 1 (Foundation):
  Step 2 (Telemetry) ──┐
  Step 1 (Freshness)   │
                       │
Phase 2 (Resilience):  │
  Step 5 (Circuit Breakers) ──┐
  Step 3 (Activity-Aware TTL) ├──> Depends on Step 2 (Telemetry)
                       │
Phase 3 (Lifecycle):   │
  Step 6 (Lifecycle Manager) ──┴──> Depends on Step 2 (Telemetry), Step 3 (Activity TTL)
  Step 4 (Snapshot Persistence) ──> Independent
```

**Critical Path:** Step 2 → Step 3 → Step 6 (Telemetry enables Activity TTL, which informs Lifecycle Manager)

---

## Risk Matrix

| Step | Risk Level | Mitigation Strategy |
|------|-----------|---------------------|
| **Step 1: Freshness** | 🟢 Low | Isolated feature, additive (no breaking changes) |
| **Step 2: Telemetry** | 🟡 Medium | High instrumentation surface, but Winston is battle-tested |
| **Step 3: Activity TTL** | 🟡 Medium | TTL extension logic must prevent indefinite growth |
| **Step 4: Snapshot** | 🟢 Low | Dev-only feature, no production impact |
| **Step 5: Circuit Breakers** | 🔴 High | Complex integration, fallback modes need thorough testing |
| **Step 6: Lifecycle Manager** | 🟡 Medium | Coordination complexity, but benefits outweigh risks |

---

## Verification Checklist

### Phase 1 (Observability Foundation)
- [ ] Freshness queries return correct grades (fresh/recent/aging/stale)
- [ ] UI shows freshness indicators for sessions
- [ ] Telemetry captures all error types (console, catch blocks, rate-limits)
- [ ] Telemetry API returns queryable entries
- [ ] Winston logs still write to stdout (backward compatibility)

### Phase 2 (Resilience Mechanisms)
- [ ] Circuit breaker opens after 5 consecutive failures
- [ ] Circuit breaker resets to closed after 30s timeout
- [ ] HTTP polling fallback activates when WebSocket fails
- [ ] FileWatcher auto-restarts after crash with exponential backoff
- [ ] Activity-aware TTLs extend on new events/input
- [ ] Sessions with active chains don't expire prematurely

### Phase 3 (Lifecycle Optimization)
- [ ] MemoryStorage snapshot saves/restores all data correctly
- [ ] Snapshot files are gzipped and rotated (keep last 3)
- [ ] LifecycleManager emits pre-eviction notifications
- [ ] Lifecycle phases transition correctly (active → idle → expiring → evicted)
- [ ] CleanupService coordinates with LifecycleManager

### Cross-Cutting
- [ ] Type check passes across all packages (`pnpm type-check`)
- [ ] Existing tests pass (`pnpm test`)
- [ ] No new console.log() calls (all use telemetry)
- [ ] Redis storage tests pass for all new features
- [ ] Electron app builds successfully

---

## Effort Summary

| Step | Effort | Days (1 dev) | Priority |
|------|--------|--------------|----------|
| Step 1: Freshness Metadata | Medium | 1.5 | Medium |
| Step 2: Structured Telemetry | Large | 2 | **High** |
| Step 3: Activity-Aware TTL | Medium | 1.5 | Medium |
| Step 4: Snapshot Persistence | Medium | 1.5 | Low |
| Step 5: Circuit Breakers | Extra Large | 2.5 | **High** |
| Step 6: Lifecycle Manager | Large | 2.5 | Medium |
| **TOTAL** | **~11.5 days** | **~2.3 weeks** | — |

**Timeline with 1 developer:**
- Phase 1: 3.5 days (1 week)
- Phase 2: 4 days (1 week)
- Phase 3: 4 days (1 week)

**Timeline with 2 developers (parallel work):**
- Phase 1: 2 days (telemetry + freshness in parallel)
- Phase 2: 2.5 days (circuit breakers + activity TTL in parallel)
- Phase 3: 2.5 days (lifecycle manager + snapshots in parallel)
- **TOTAL: ~7 days (1.5 weeks)**

---

## Post-Implementation Monitoring

After completing all 6 improvements, monitor these metrics:

### Observability Metrics (Steps 1-2)
- **Telemetry volume:** Entries/minute by level (debug, info, warn, error)
- **Freshness distribution:** % of sessions in each grade (fresh/recent/aging/stale)
- **Error capture rate:** Errors logged before vs. after telemetry system

### Resilience Metrics (Steps 3-5)
- **Circuit breaker trips:** Count of opens/closes per component per day
- **HTTP fallback activations:** Count of WebSocket → HTTP polling transitions
- **TTL extensions:** Average extensions per session, max extension count hit rate
- **FileWatcher restarts:** Crash count + successful restart rate

### Lifecycle Metrics (Steps 4-6)
- **Snapshot success rate:** % of successful snapshot writes/restores
- **Lifecycle transitions:** Count of phase transitions per resource type per day
- **Pre-eviction notifications:** % of evictions with successful notification delivery

---

## Learnings

**Issue:** N/A (planning phase)

**Root Cause:** N/A

**Suggestion:** N/A

[FRESH EYE] The universe analysis revealed that the system currently operates like a living organism with **no memory of its own health**. The telemetry system (Step 2) is not just about logging — it's about giving the system **self-awareness**. Once the system can observe its own internal state (errors, TTL extensions, circuit breaker trips), it can begin to **self-heal** (e.g., auto-restart failed watchers, extend TTLs on activity). The phasing strategy intentionally builds observability FIRST, because you can't improve what you can't measure.

The freshness system (Step 1) introduces a concept foreign to most systems: **temporal gradients**. Data isn't just "alive" or "dead" — it exists on a spectrum of staleness. This enables smarter caching, preemptive refreshing, and user warnings about outdated data.

The activity-aware TTL system (Step 3) solves a deep temporal mismatch: **event-time vs. wall-clock time**. Chains execute in event-time (step completions), but TTLs expire in wall-clock time. By bridging these two temporal systems, we prevent the tragic scenario of a session expiring mid-chain because the wall-clock TTL didn't know the chain was still alive in event-time.

The circuit breaker infrastructure (Step 5) is the most complex improvement but also the most critical for production resilience. It transforms the system from **brittle** (one component dies → everything dies) to **antifragile** (component failures are isolated, fallback modes activate automatically).

The coordinated lifecycle manager (Step 6) is the final piece: unifying three independent cleanup mechanisms (FIFO eviction, Redis TTL, daily cleanup service) into one orchestrated system. This prevents the current chaos where data can be evicted from memory while still referenced by the frontend.
