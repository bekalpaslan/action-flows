# ActionFlows Dashboard Backend — Comprehensive Functionality Analysis

**Generated:** 2026-02-08
**Scope:** `packages/backend/`
**Analysis Type:** Full inventory, architecture review, and improvement assessment

---

## Executive Summary

The ActionFlows Backend is a **Express 4.18 + TypeScript + WebSocket** server providing real-time monitoring and control for AI agent orchestration. The backend implements:

- **11 API route modules** providing 30+ REST endpoints
- **WebSocket-based event streaming** with session subscriptions
- **Dual storage backends** (Memory for dev, Redis for production)
- **File watching and attribution** for tracking step-level changes
- **Terminal output buffering** for streaming shell execution
- **Claude CLI session management** with process control
- **Project registry** for persistent configuration
- **Multi-layer security** (API keys, rate limiting, path validation)

**Health Status:** ✅ Functional, well-structured, with clear security patterns and minor gaps.

---

## 1. API ENDPOINTS INVENTORY

### 1.1 Sessions Management (`/api/sessions`)

| Endpoint | Method | Purpose | Auth | Rate Limit |
|----------|--------|---------|------|-----------|
| `/api/sessions` | `POST` | Create new session | ✅ | Session-specific |
| `/api/sessions` | `GET` | List all active sessions | ✅ | General |
| `/api/sessions/:id` | `GET` | Get session with chains | ✅ | General |
| `/api/sessions/:id` | `PUT` | Update session (status, summary) | ✅ | Write |
| `/api/sessions/:id/chains` | `GET` | Get all chains in session | ✅ | General |
| `/api/sessions/:id/input` | `POST` | Submit user input | ✅ | Write |
| `/api/sessions/:id/input` | `GET` | Poll for pending input (long-polling) | ✅ | General |
| `/api/sessions/:id/awaiting` | `POST` | Mark session awaiting input | ✅ | Write |

**File:** `packages/backend/src/routes/sessions.ts` (543 lines)

**Key Features:**
- Directory validation and system path protection (DENIED_PATHS list)
- File watching automatic start/stop
- Session history persistence to disk
- Long-polling input with 60-second timeout cap
- User session tracking by UserId

**Request/Response Example:**
```typescript
// POST /api/sessions
Request: { cwd: string, hostname: string, platform: string, userId?: string }
Response: Session { id, cwd, chains: [], status: 'pending', startedAt }

// PUT /api/sessions/:id
Request: { status?: 'completed' | 'failed', summary?: string, endReason?: string }
Response: Updated Session object
```

---

### 1.2 Commands Queue (`/api/commands`)

| Endpoint | Method | Purpose | Auth | Rate Limit |
|----------|--------|---------|------|-----------|
| `/api/sessions/:id/commands` | `POST` | Queue command (pause/resume/cancel) | ✅ | Write |
| `/api/sessions/:id/commands` | `GET` | Get pending commands (polling) | ✅ | General |
| `/api/commands/:commandId/ack` | `POST` | Acknowledge command receipt | ✅ | General |

**File:** `packages/backend/src/routes/commands.ts` (110 lines)

**Key Features:**
- Commands auto-clear after fetch (consumed by hook)
- Command ID generation with timestamp + random
- Acknowledgment endpoint for hook feedback

**Request/Response Example:**
```typescript
// POST /api/sessions/:id/commands
Request: { type: string, payload?: object }
Response: { success: true, commandId, command: { type, payload, issuedAt } }

// POST /api/commands/:commandId/ack
Request: { result?: any, error?: string }
Response: { success: true, commandId, acknowledged: true }
```

---

### 1.3 Events & Telemetry (`/api/events`)

| Endpoint | Method | Purpose | Auth | Rate Limit |
|----------|--------|---------|------|-----------|
| `/api/events` | `POST` | Store event from hook | ✅ | Write |
| `/api/events/:sessionId` | `GET` | Get all events | ✅ | General |
| `/api/events/:sessionId/recent` | `GET` | Get recent events (limit/time filter) | ✅ | General |

**File:** `packages/backend/src/routes/events.ts` (125 lines)

**Key Features:**
- Event storage with Redis pub/sub broadcast
- Timestamp-based filtering (`since` parameter)
- Recent events with configurable limit (max 1000) and time window
- Active step tracking for file change attribution
- Memory limit: 10K events per session (FIFO eviction)

**Request/Response Example:**
```typescript
// POST /api/events
Request: WorkspaceEvent (from @afw/shared)
Response: { success: true, eventId, sessionId }

// GET /api/events/:sessionId/recent?limit=50&seconds=60
Response: { sessionId, count, cutoffTime, events: WorkspaceEvent[] }
```

---

### 1.4 Terminal Output (`/api/terminal`)

| Endpoint | Method | Purpose | Auth | Rate Limit |
|----------|--------|---------|------|-----------|
| `/api/terminal/:sessionId/output` | `POST` | Post stdout/stderr from step | ✅ | Write |
| `/api/terminal/:sessionId/buffer` | `GET` | Get buffered terminal output | ✅ | General |
| `/api/terminal/:sessionId/buffer` | `DELETE` | Clear buffer | ✅ | Write |

**File:** `packages/backend/src/routes/terminal.ts` (114 lines)

**Key Features:**
- In-memory line buffer with limit query
- Stream separation (stdout/stderr)
- Step attribution for changes
- Broadcast to WebSocket clients
- TerminalBuffer service in `packages/backend/src/services/terminalBuffer.ts`

**Request/Response Example:**
```typescript
// POST /api/terminal/:sessionId/output
Request: { output: string, stream: 'stdout'|'stderr', stepNumber?: number, action?: string }
Response: { success: true, buffered: number }

// GET /api/terminal/:sessionId/buffer?limit=1000
Response: { sessionId, buffer: OutputLine[], totalSize, returned, truncated }
```

---

### 1.5 File Operations (`/api/files`)

| Endpoint | Method | Purpose | Auth | Rate Limit |
|----------|--------|---------|------|-----------|
| `/api/files/:sessionId/tree` | `GET` | Get directory structure (depth 3) | ✅ | General |
| `/api/files/:sessionId/read` | `GET` | Read file content (10MB limit) | ✅ | General |
| `/api/files/:sessionId/write` | `POST` | Write file content (10MB limit) | ✅ | Write |
| `/api/files/:sessionId/diff` | `GET` | Get file diff (stub) | ✅ | General |

**File:** `packages/backend/src/routes/files.ts` (304 lines)

**Key Features:**
- Path validation middleware to prevent traversal
- Directory tree recursion (configurable depth, default 3)
- File size limits (10MB read/write)
- Hidden file filtering (skip `.` prefixes)
- Ignore patterns: node_modules, __pycache__, dist, build
- File diff placeholder (Phase 10 feature)

**Request/Response Example:**
```typescript
// GET /api/files/:sessionId/tree?depth=3&showHidden=false
Response: { sessionId, cwd, depth, tree: DirectoryEntry[] }

// GET /api/files/:sessionId/read?path=src/index.ts
Response: { sessionId, path, content, encoding, size, modified }
```

---

### 1.6 History & Persistence (`/api/history`)

| Endpoint | Method | Purpose | Auth | Rate Limit |
|----------|--------|---------|------|-----------|
| `/api/history/dates` | `GET` | List dates with saved sessions | ✅ | General |
| `/api/history/sessions/:date` | `GET` | Get session IDs for a date | ✅ | General |
| `/api/history/session/:sessionId` | `GET` | Load session snapshot | ✅ | General |
| `/api/history/stats` | `GET` | Get storage statistics | ✅ | General |
| `/api/history/cleanup` | `POST` | Trigger cleanup of old data | ✅ | Write |

**File:** `packages/backend/src/routes/history.ts` (102 lines)

**Key Features:**
- File persistence to disk (daily folders)
- Date-based session querying
- 7-day retention with cleanup service
- Storage stats reporting

**Request/Response Example:**
```typescript
// GET /api/history/sessions/2026-02-08
Response: { date: '2026-02-08', sessionIds: SessionId[] }

// GET /api/history/session/:sessionId?date=2026-02-08
Response: Snapshot { session, events, chains }
```

---

### 1.7 Claude CLI Management (`/api/claude-cli`)

| Endpoint | Method | Purpose | Auth | Rate Limit |
|----------|--------|---------|------|-----------|
| `/api/claude-cli/start` | `POST` | Start Claude CLI process | ✅ | Write |
| `/api/claude-cli/:sessionId/input` | `POST` | Send stdin to Claude | ✅ | Write |
| `/api/claude-cli/:sessionId/stop` | `POST` | Stop Claude process | ✅ | Write |
| `/api/claude-cli/:sessionId/status` | `GET` | Get process status | ✅ | General |

**File:** `packages/backend/src/routes/claudeCli.ts` (truncated, see full file for complete impl)

**Key Features:**
- Process management via `claudeCliManager` service
- Environment variable validation
- MCP config path support
- Project lastUsedAt tracking (fire-and-forget)
- CLI flags and prompt support

**Request/Response Example:**
```typescript
// POST /api/claude-cli/start
Request: {
  sessionId, cwd, prompt, flags?: string[],
  projectId?: ProjectId, envVars?: object,
  mcpConfigPath?: string, user?: string
}
Response: { success: true, session: ClaudeCliSessionInfo }
```

---

### 1.8 Session Windows (`/api/session-windows`)

| Endpoint | Method | Purpose | Auth | Rate Limit |
|----------|--------|---------|------|-----------|
| `/api/session-windows` | `GET` | Get all followed windows | ✅ | General |
| `/api/session-windows/:id/enriched` | `GET` | Get enriched session data | ✅ | General |
| `/api/session-windows/:id/follow` | `POST` | Mark session as followed | ✅ | Write |
| `/api/session-windows/:id/follow` | `DELETE` | Unmark as followed | ✅ | Write |
| `/api/session-windows/:id/config` | `PUT` | Update window config | ✅ | Write |

**File:** `packages/backend/src/routes/sessionWindows.ts` (194 lines)

**Key Features:**
- Followed sessions tracking
- Rich data enrichment (session + chains + config)
- Window configuration persistence

---

### 1.9 Projects Registry (`/api/projects`)

| Endpoint | Method | Purpose | Auth | Rate Limit |
|----------|--------|---------|------|-----------|
| `/api/projects` | `GET` | List projects (sorted by lastUsedAt) | ✅ | General |
| `/api/projects` | `POST` | Create project | ✅ | Write |
| `/api/projects/:id` | `GET` | Get project by ID | ✅ | General |
| `/api/projects/:id` | `PUT` | Update project | ✅ | Write |
| `/api/projects/:id` | `DELETE` | Delete project | ✅ | Write |
| `/api/projects/detect` | `POST` | Auto-detect project metadata | ✅ | Write |

**File:** `packages/backend/src/routes/projects.ts` (250+ lines)

**Key Features:**
- Project CRUD with file persistence
- Auto-detection of project type (Node, Python, etc.)
- Environment variable validation
- MCP config path support
- Quick action presets storage

---

### 1.10 Session Discovery (`/api/discovery`)

| Endpoint | Method | Purpose | Auth | Rate Limit |
|----------|--------|---------|------|-----------|
| `/api/discovery/sessions` | `GET` | Discover running Claude Code sessions | ✅ | General |

**File:** `packages/backend/src/routes/discovery.ts` (42 lines)

**Key Features:**
- IDE lock file scanning for active Claude sessions
- Optional JSONL enrichment
- Alive PID filtering

**Request/Response Example:**
```typescript
// GET /api/discovery/sessions?enrich=true&aliveOnly=true
Response: { count, sessions: DiscoveredSession[], discoveredAt }
```

---

### 1.11 Users (`/api/users`)

| Endpoint | Method | Purpose | Auth | Rate Limit |
|----------|--------|---------|------|-----------|
| `/api/users` | `GET` | Get active users with session counts | ✅ | General |
| `/api/users/:userId/sessions` | `GET` | Get all sessions for user | ✅ | General |

**File:** `packages/backend/src/routes/users.ts` (79 lines)

**Key Features:**
- User session aggregation
- Online status detection (pending/in_progress)
- User-based access control foundation

---

## 2. WEBSOCKET FUNCTIONALITY

### 2.1 WebSocket Message Types

**File:** `packages/backend/src/ws/handler.ts` (150+ lines)

**Server → Client (Broadcasts):**
```typescript
type WSBroadcast = {
  type: 'event' | 'command' | 'pong' | 'subscription_confirmed' | 'error',
  sessionId?: string,
  payload?: unknown,
  clientId?: string,
  details?: unknown
}
```

**Client → Server (Messages):**
```typescript
type ClientMessage =
  | { type: 'subscribe', sessionId: SessionId }
  | { type: 'unsubscribe', sessionId: SessionId }
  | { type: 'input', sessionId: SessionId, payload: unknown }
  | { type: 'ping' }
```

### 2.2 WebSocket Features

| Feature | Status | Details |
|---------|--------|---------|
| **Client Registry** | ✅ | Tracks subscriptions, rate limiting, API key validation |
| **Authentication** | ✅ | Per-message API key validation + rotation detection |
| **Rate Limiting** | ✅ | 50 msg/sec per client with 1s window |
| **Session Subscriptions** | ✅ | Per-client subscription state, broadcast to subscribers |
| **Max Clients** | ✅ | Hard limit 1000, rejected with 1008 status |
| **Input Queuing** | ✅ | WebSocket → Input queue for hook polling |
| **Payload Security** | ✅ | 1MB max payload limit |

### 2.3 Client Registry (`packages/backend/src/ws/clientRegistry.ts`)

**Key Methods:**
- `register(ws, clientId, apiKey?, userId?)` — Register with capacity check
- `subscribe(ws, sessionId)` — Add to session subscribers
- `unsubscribe(ws, sessionId)` — Remove from session subscribers
- `validateApiKey(ws, currentApiKey)` — Per-message validation with rotation support
- `checkRateLimit(ws)` — Enforce 50 msg/sec per client
- `broadcastToSession(sessionId, message)` — Send to all subscribers
- `getAllClients()` — Get all registered WebSockets

---

## 3. STORAGE ARCHITECTURE

### 3.1 Storage Interface (`packages/backend/src/storage/index.ts`)

**Unified interface supporting both Memory and Redis backends:**

```typescript
export interface Storage {
  // Sessions
  getSession(sessionId): Session | Promise<Session | undefined>
  setSession(session): void | Promise<void>

  // Events
  addEvent(sessionId, event): void | Promise<void>
  getEvents(sessionId): WorkspaceEvent[] | Promise<WorkspaceEvent[]>
  getEventsSince(sessionId, timestamp): WorkspaceEvent[] | Promise<WorkspaceEvent[]>

  // Chains
  addChain(sessionId, chain): void | Promise<void>
  getChains(sessionId): Chain[] | Promise<Chain[]>

  // Commands & Input queues
  queueCommand(sessionId, command): void | Promise<void>
  getCommands(sessionId): CommandPayload[] | Promise<CommandPayload[]>
  queueInput(sessionId, input): void | Promise<void>
  getInput(sessionId): unknown[] | Promise<unknown[]>

  // Session windows
  followSession(sessionId): void | Promise<void>
  getFollowedSessions(): SessionId[] | Promise<SessionId[]>

  // Pub/Sub (Redis only)
  subscribe?(channel, callback): Promise<void>
  publish?(channel, message): Promise<void>
}
```

### 3.2 Memory Storage (`packages/backend/src/storage/memory.ts`)

**Synchronous in-memory storage with eviction policies:**

| Data Structure | Map Type | Limit | Eviction |
|---|---|---|---|
| `sessions` | `Map<SessionId, Session>` | 1,000 | FIFO (oldest completed) |
| `events` | `Map<SessionId, WorkspaceEvent[]>` | 10,000 per session | FIFO (per-session) |
| `chains` | `Map<SessionId, Chain[]>` | 100 per session | FIFO (per-session) |
| `commandsQueue` | `Map<SessionId, CommandPayload[]>` | Unlimited | Auto-clear after fetch |
| `inputQueue` | `Map<SessionId, unknown[]>` | 100 per session | Silently drop excess |
| `clients` | `Set<{ clientId, sessionId? }>` | Unlimited | Manual removal |

**Eviction Behavior:**
- When sessions reach 1K limit: evict oldest completed/failed
- Auto-clear commands after `getCommands()` fetch
- Auto-clear input after `getInput()` fetch
- Silent drop if input queue full

### 3.3 Redis Storage (`packages/backend/src/storage/redis.ts`)

**Async persistent storage with pub/sub:**

**Key Prefix Strategy:**
```
afw:sessions:{sessionId}        → Session JSON
afw:events:{sessionId}          → Event list (ZSET by timestamp)
afw:chains:{sessionId}          → Chain list
afw:commands:{sessionId}        → Command queue (LIST)
afw:input:{sessionId}           → Input queue (LIST)
afw:followed_sessions           → Set of followed session IDs
afw:window_config:{sessionId}   → Window config JSON
```

**TTL Configuration:**
- Sessions: 24 hours (86400s)
- Events: 24 hours
- Other data: No explicit TTL (expires with session)

**Pub/Sub Channels:**
- `afw:events` — Event broadcasts for distributed clients
- `afw:commands` — Command distribution (if implemented)

### 3.4 File Persistence (`packages/backend/src/storage/file-persistence.ts`)

**Purpose:** Archive completed sessions for history retention

**Directory Structure:**
```
data/history/
  2026-02-08/
    session-xxx-yyy.json        → Session metadata
    session-xxx-yyy.events.json → Event log
    session-xxx-yyy.chains.json → Chain snapshots
  2026-02-07/
    ...
```

**Retention Policy:**
- Daily folders created
- 7-day retention (cleanup daily)
- Triggered on session completion or manual POST `/api/history/cleanup`

---

## 4. SECURITY ARCHITECTURE

### 4.1 Authentication Layers

| Layer | Method | Location | Scope |
|-------|--------|----------|-------|
| **API Key** | Header/Query | `middleware/auth.ts` | All routes + WS upgrade |
| **Per-Message** | Client registry | `ws/clientRegistry.ts` | WebSocket messages |
| **Session Ownership** | UserId check | `ws/handler.ts` | WS subscriptions |
| **Path Validation** | Denied paths list | `routes/sessions.ts` | Session creation |

**Key Implementation:**
```typescript
// Auth middleware (enabled if AFW_API_KEY set)
const apiKey = process.env.AFW_API_KEY;
if (apiKey && providedKey !== apiKey) {
  return res.status(401).json({ error: 'Unauthorized' });
}

// Per-message API key rotation detection
validateApiKey(ws, currentApiKey) {
  if (client.apiKey && client.apiKey !== currentApiKey) {
    return false; // Reject on key rotation
  }
}
```

### 4.2 Path Security

**Denied Paths (`routes/sessions.ts:27-53`):**
```
/etc, /sys, /proc, /dev, /root, /boot, /bin, /sbin
C:\Windows, C:\Program Files, C:\ProgramData
C:\System Volume Information, C:\$Recycle.Bin
```

**Validation:** `isPathDenied(filePath)` checks normalized path against deny list

### 4.3 Input Validation

**Zod Schemas (`schemas/api.ts`):**
- `createSessionSchema` — cwd, hostname, platform, userId
- `createEventSchema` — WorkspaceEvent shape validation
- `terminalOutputSchema` — output, stream, stepNumber, action
- `claudeCliStartSchema` — sessionId, cwd, prompt, flags, envVars, etc.

All POST/PUT routes use `validateBody(schema)` middleware

### 4.4 Rate Limiting

| Limiter | Limit | Window | Routes |
|---------|-------|--------|--------|
| `generalLimiter` | 1,000 req | 15 min | All /api routes |
| `writeLimiter` | 30 req | 15 min | POST/PUT write ops |
| `sessionCreateLimiter` | 10 req | 15 min | POST /api/sessions |
| **WebSocket** | 50 msg/sec | 1 sec | Per-client message handling |

**Configuration:**
- Can be disabled via `AFW_RATE_LIMIT_DISABLED=true`
- IP-based key generation

### 4.5 Additional Protections

| Protection | Mechanism | Example |
|---|---|---|
| **CORS** | Origin whitelist | `AFW_CORS_ORIGINS` env var, default localhost:5173,3001 |
| **Body size limit** | 1MB | `express.json({ limit: '1mb' })` |
| **File size limit** | 10MB | Read/write file operations |
| **WS payload limit** | 1MB | `WebSocketServer({ maxPayload: 1024*1024 })` |
| **Env var validation** | Regex patterns | `ProjectDetector.validateEnvVarKey/Value()` |
| **Long-poll timeout cap** | 60 seconds max | `GET /api/sessions/:id/input?timeout=60000` |
| **Watch depth limit** | 10 levels | Chokidar watch depth to prevent resource exhaustion |

---

## 5. SERVICES & UTILITIES

### 5.1 Core Services

| Service | File | Purpose | Key Methods |
|---------|------|---------|-------------|
| **FileWatcher** | `services/fileWatcher.ts` | Monitor file changes, attribute to steps | `startWatching()`, `stopWatching()`, `setActiveStep()` |
| **TerminalBuffer** | `services/terminalBuffer.ts` | Buffer stdout/stderr | `append()`, `getRecentBuffer()`, `getBufferSize()` |
| **ClaudeCliManager** | `services/claudeCliManager.ts` | Manage Claude CLI processes | `startSession()`, `stopSession()`, `getSession()` |
| **ProjectDetector** | `services/projectDetector.ts` | Auto-detect project type | `detectProject()`, `validateEnvVarKey/Value()` |
| **ProjectStorage** | `services/projectStorage.ts` | Persist projects to disk | `createProject()`, `getProject()`, `updateLastUsed()` |
| **ClaudeSessionDiscovery** | `services/claudeSessionDiscovery.ts` | Find running Claude sessions | `discoverSessions()` |
| **Cleanup** | `services/cleanup.ts` | Daily session cleanup | `start()`, `stop()` |

### 5.2 Middleware Stack

| Middleware | File | Purpose |
|------------|------|---------|
| `authMiddleware` | `middleware/auth.ts` | API key validation |
| `generalLimiter` | `middleware/rateLimit.ts` | Global rate limiting |
| `writeLimiter` | `middleware/rateLimit.ts` | Write endpoint limiting |
| `validateBody(schema)` | `middleware/validate.ts` | Zod schema validation |
| `validateFilePath(param)` | `middleware/validatePath.ts` | Path traversal prevention |
| `validateSessionIdParam()` | `middleware/validate.ts` | Session ID parameter validation |
| `globalErrorHandler` | `middleware/errorHandler.ts` | Error response normalization |

### 5.3 Utility Functions

**Error Sanitization:**
```typescript
// middleware/errorHandler.ts
function sanitizeError(error: unknown): string {
  // Return safe message, hide implementation details
}
```

**Shell Escaping:**
```typescript
// utils/shellEscape.ts
function escapeShellArg(arg: string): string {
  // Prevent shell injection
}
```

---

## 6. INVENTORY METRICS

### 6.1 Code Statistics

| Metric | Count |
|--------|-------|
| Total `.ts` files | 37 |
| Route files | 11 |
| Service files | 7 |
| Middleware files | 7 |
| Storage files | 3 |
| Test files | 2 |
| Utility/Schema files | 7 |
| **API Routes** | 30+ |
| **WebSocket Event Types** | 4 (subscribe, unsubscribe, input, ping) |

### 6.2 Storage Capacity

| Resource | Limit | Location |
|----------|-------|----------|
| Max sessions in memory | 1,000 | memory.ts:16 |
| Max events per session | 10,000 | memory.ts:14 |
| Max chains per session | 100 | memory.ts:15 |
| Max input queue per session | 100 | memory.ts:17 |
| Max WS clients | 1,000 | clientRegistry.ts:37 |
| WS message rate limit | 50 msg/sec | clientRegistry.ts:19 |
| WS payload size | 1MB | index.ts:91 |
| File read/write size | 10MB | routes/files.ts:152, 213 |
| Watch directory depth | 10 levels | services/fileWatcher.ts:88 |

---

## 7. MISSING PIECES & IMPROVEMENT AREAS

### 7.1 Incomplete Features (TODOs in Code)

| Issue | Location | Impact | Priority |
|-------|----------|--------|----------|
| **TODO: Broadcast awaiting_input event** | `routes/sessions.ts:359` | WebSocket clients won't get awaiting state | Medium |
| **TODO: Broadcast input_received event** | `routes/sessions.ts:453` | Clients unaware of input reception | Medium |
| **TODO: Phase 10 file diff snapshots** | `routes/files.ts:274` | Diff endpoint returns placeholder | Low |
| **TODO: Update window config broadcast** | Unknown | Config changes not broadcast | Low |

### 7.2 Architectural Inconsistencies

| Issue | Details | Recommendation |
|-------|---------|-----------------|
| **Duplicate user routes** | `/api/sessions/users` AND `/api/users` defined in two places | Consolidate endpoint definition (route ordering issue in `sessions.ts` vs `users.ts`) |
| **Redis listing limitation** | GET `/api/sessions` returns empty for Redis (can't list all keys) | Implement Redis SCAN for pagination |
| **Sync vs Async chaos** | Memory storage is sync, Redis is async; all wrapped in `Promise.resolve()` | Consider AsyncStorage base class or unified wrapper |
| **Missing event broadcast** | Not all events are WebSocket-broadcast (awaiting_input, input_received) | Implement systematic event broadcasts |
| **Input queue silently drops** | When queue at limit, new input is silently dropped | Consider returning 429 (Too Many Requests) instead |

### 7.3 Missing Endpoints/Features

| Feature | Expected Endpoint | Status | Notes |
|---------|-------------------|--------|-------|
| **Chain CRUD** | `POST /api/chains`, `PUT /api/chains/:id` | Missing | Only readable via session |
| **Step CRUD** | `POST /api/steps`, `GET /api/steps/:id` | Missing | Only through events |
| **User creation** | `POST /api/users` | Missing | No user management |
| **Session forking** | `POST /api/sessions/:id/fork` | Missing | No session branching |
| **Bulk operations** | `POST /api/sessions/bulk`, `DELETE /api/sessions/bulk` | Missing | Only single-session ops |
| **WebSocket compression** | Per-message deflate | Not enabled | Could reduce bandwidth |
| **Health metrics** | `GET /api/metrics` | Missing | No Prometheus-style metrics |
| **Graceful shutdown** | Implemented but no endpoint | Hidden | Good internal behavior |

### 7.4 Security Gaps

| Gap | Severity | Details | Fix |
|-----|----------|---------|-----|
| **API key in query params** | Medium | `?apiKey=xxx` in URL logs | Remove support, use headers only |
| **No request logging** | Low | Can't audit API access | Add structured logging middleware |
| **No HTTPS enforcement** | Medium | Can send API keys unencrypted | Document HTTPS requirement |
| **File symlink following** | Medium | Chokidar might follow symlinks | Add `followSymlinks: false` to watcher config |
| **No user-level isolation** | High | Users can access each other's sessions if ID known | Implement ACL/ownership checks on all endpoints |

### 7.5 Performance Concerns

| Issue | Impact | Scale | Recommendation |
|-------|--------|-------|-----------------|
| **Memory eviction FIFO** | Oldest completed sessions evicted, might lose data | 1K sessions | Implement TTL + LRU combo |
| **No pagination on lists** | Large responses (all sessions, all projects) | 1K+ items | Add limit/offset pagination |
| **Full event list retrieval** | 10K events per session in memory | Slow clients | Implement cursor-based pagination |
| **Recursive directory tree** | Deep traversal can be expensive | Large codebases (100K+ files) | Add async iteration or streaming |
| **Terminal buffer unbounded** | Could grow large in memory | Long-running sessions | Implement circular buffer or size limit |
| **No connection pooling** | Each instance creates 3 Redis connections | Multiple instances | Consider Redis connection pool |

### 7.6 Testing Gaps

| Area | Coverage | Files |
|------|----------|-------|
| **Unit tests** | Minimal | 2 test files in `__tests__/` |
| **Route integration** | Not visible | Need `/api/*` endpoint tests |
| **Storage adapters** | Not visible | Need memory vs Redis tests |
| **WebSocket** | Not visible | Need subscription/broadcast tests |
| **Auth/Security** | Not visible | Need auth bypass tests |
| **Error handling** | Not visible | Need error scenario tests |

---

## 8. ARCHITECTURE DIAGRAMS & FLOW

### 8.1 Request Flow (REST)

```
Client HTTP Request
    ↓
Express Middleware Stack
    ├→ CORS
    ├→ Auth (API key)
    ├→ Rate Limit
    ├→ Body Parser
    └→ Route Handler
        ↓
    Validation Middleware
        ├→ validateBody(schema)
        ├→ validateFilePath()
        └→ validateSessionIdParam()
            ↓
        Route Logic
            ├→ storage.getSession()
            ├→ storage.addEvent()
            ├→ fs.readFile() / fs.writeFile()
            └→ Service calls (FileWatcher, ClaudeCli, etc.)
                ↓
        Response
    ↓
Express Error Handler
    ↓
HTTP Response (with sanitized error if exception)
```

### 8.2 WebSocket Flow

```
Client WebSocket Request
    ↓
HTTP Upgrade Check (status 101 Switching Protocols)
    ↓
API Key Validation (query param or header)
    ↓
clientRegistry.register(ws, clientId, apiKey)
    ├→ Reject if at 1000 client limit
    └→ Success → emit 'connection' event
        ↓
    handleWebSocket(ws, clientId, storage)
        ↓
    Send subscription_confirmed
        ↓
    Wait for incoming message
        ├→ validateApiKey() per-message
        ├→ checkRateLimit() (50 msg/sec)
        ├→ Parse JSON + validate schema
        └→ Message handler
            ├→ 'subscribe' → clientRegistry.subscribe(ws, sessionId)
            ├→ 'unsubscribe' → clientRegistry.unsubscribe(ws, sessionId)
            ├→ 'input' → storage.queueInput(sessionId, payload)
            └→ 'ping' → send 'pong'
                ↓
            broadcastToSession(sessionId, message)
                ├→ Find all subscribed clients for session
                └→ Send to each (WebSocket.send())
```

### 8.3 Event Broadcasting (Redis)

```
Hook → POST /api/events
    ↓
validateBody() → Event validation
    ↓
storage.addEvent(sessionId, event)
    ├→ Memory: Direct Map storage
    └→ Redis: LPUSH to list + EXPIRE + PUBLISH to afw:events
        ↓
Redis Pub/Sub Subscriber (initialized in initializeRedisPubSub)
    ↓
Receive message on 'afw:events' channel
    ↓
clientRegistry.broadcastToSession(sessionId, message)
    ↓
All connected WS clients subscribed to sessionId receive event
```

### 8.4 Session Lifecycle

```
POST /api/sessions (Create)
    ↓
Directory validation + Security check
    ↓
storage.setSession(session { status: 'pending', ... })
    ↓
startWatching(sessionId, cwd)
    ├→ Chokidar watches directory
    └→ File changes → broadcastFileEvent()
        ↓
Hook connects to Claude CLI
    ↓
POST /api/events (chain:started, step:spawned, etc.)
    ↓
PUT /api/sessions/:id { status: 'completed' }
    ↓
stopWatching(sessionId)
    ↓
filePersistence.saveSession(sessionId, session, events)
    ├→ Write to data/history/{date}/
    └→ 7-day cleanup service deletes old folders
        ↓
GET /api/history/session/:sessionId (later)
    ↓
Load from archive
```

---

## 9. TECHNICAL DEBT & RECOMMENDATIONS

### 9.1 Refactoring Priorities

**P0 — Critical (Breaking)**
1. Implement per-session ACL to prevent cross-user session access
2. Remove API key from query params (security logging risk)
3. Fix duplicate `/api/users` routes (consolidate definition)

**P1 — High (Functional Gaps)**
1. Complete missing event broadcasts (awaiting_input, input_received)
2. Implement Redis listing with pagination
3. Add streaming/pagination for large datasets

**P2 — Medium (Quality)**
1. Unify sync/async storage handling (AsyncStorage base class)
2. Add comprehensive test coverage (integration tests)
3. Implement proper error recovery for file watcher
4. Add request/response logging middleware

**P3 — Low (Nice-to-have)**
1. Enable WebSocket per-message deflate compression
2. Add Prometheus metrics endpoint
3. Implement session forking/branching
4. Add bulk operation endpoints

### 9.2 Code Quality Improvements

```typescript
// BEFORE: Type chaos with Promise.resolve()
const session = await Promise.resolve(storage.getSession(id));

// AFTER: Unified async wrapper
const session = await ensureAsync(storage.getSession(id));

// Function
function ensureAsync<T>(val: T | Promise<T>): Promise<T> {
  return val instanceof Promise ? val : Promise.resolve(val);
}
```

### 9.3 Documentation Gaps

Missing:
- OpenAPI/Swagger spec for REST API
- WebSocket message protocol specification
- Storage backend comparison guide
- Deployment runbook (Redis setup, scaling)
- Security hardening checklist
- Rate limit tuning guide

---

## 10. FRESH EYE OBSERVATIONS

### ✓ What Works Well

1. **Clean separation of concerns** — Middleware, routes, services, storage all isolated
2. **Strong TypeScript discipline** — Branded types, Zod validation across codebase
3. **Thoughtful security** — Multiple auth layers, path validation, rate limiting
4. **Flexible storage** — Unified interface supports memory and Redis seamlessly
5. **Session persistence** — File-based history prevents data loss
6. **WebSocket design** — Subscription model clean, rate limiting per-client
7. **Error handling** — Sanitization prevents info leaks

### ⚠️ Concerning Patterns

1. **API key in URLs** — Query parameter leaks secrets in logs, browser history
2. **Silent drops** — Input queue silently drops at limit, no client feedback
3. **Eviction policy** — FIFO eviction of sessions loses oldest data, should be TTL + LRU
4. **Missing broadcasts** — Two event types (awaiting_input, input_received) not broadcast
5. **No user isolation** — Users discoverable if ID is known, no ownership checks on read
6. **Redis limitations** — GET /api/sessions empty for Redis (no SCAN support)
7. **Promise.resolve() everywhere** — Covers sync/async mismatch but masks design issue

### 🚀 Opportunities

1. **Streaming endpoints** — Replace full-list endpoints with cursor-based pagination
2. **WebSocket compression** — Enable deflate for bandwidth reduction (large event streams)
3. **Metrics endpoint** — Prometheus `/metrics` for monitoring
4. **Health status** — Enhance `/health` with storage backend, file watcher, Redis status
5. **Graceful degradation** — Implement circuit breaker for file watcher, Redis pub/sub failures
6. **Request tracing** — Add correlation ID middleware for distributed debugging

---

## 11. SUMMARY TABLE

### Routes & Endpoints

| Category | Count | Lines | Status |
|----------|-------|-------|--------|
| **Sessions** | 8 | 543 | ✅ Complete |
| **Commands** | 3 | 110 | ✅ Complete |
| **Events** | 3 | 125 | ✅ Complete |
| **Terminal** | 3 | 114 | ✅ Complete |
| **Files** | 4 | 304 | ✅ Complete |
| **History** | 5 | 102 | ✅ Complete |
| **Claude CLI** | 4 | 150+ | ✅ Complete |
| **Session Windows** | 5 | 194 | ✅ Complete |
| **Projects** | 6 | 250+ | ✅ Complete |
| **Discovery** | 1 | 42 | ✅ Complete |
| **Users** | 2 | 79 | ✅ Complete |
| **TOTAL** | **44** | **2,013** | ✅ |

### Security Posture

| Layer | Status | Strength |
|-------|--------|----------|
| API Authentication | ✅ | API key (env-configurable) |
| Per-Message Auth | ✅ | API key rotation detection |
| Input Validation | ✅ | Zod schemas on all POST/PUT |
| Path Security | ✅ | Deny list + validation middleware |
| Rate Limiting | ✅ | 3-tier (general, write, session-create) + WS per-client |
| CORS | ✅ | Origin whitelist |
| Session Ownership | ⚠️ | Partially (WS only, not REST) |

### Feature Completeness

| Feature | Status | Notes |
|---------|--------|-------|
| Session CRUD | ✅ Complete | Includes history, cleanup |
| Command Queue | ✅ Complete | Polling-based |
| Event Streaming | ✅ Complete | WebSocket + Redis pub/sub |
| Terminal Output | ✅ Complete | Buffering + broadcast |
| File Operations | ✅ Complete | Tree, read, write (diff pending) |
| Claude CLI Control | ✅ Complete | Start, input, stop, status |
| Project Registry | ✅ Complete | CRUD + auto-detect |
| Session Discovery | ✅ Complete | IDE lock files |
| User Management | ⚠️ Partial | Read-only, no creation |
| WebSocket | ✅ Complete | Subscribe, unsubscribe, input, ping |

---

## CONCLUSION

The ActionFlows Backend is a **well-architected, production-ready** orchestration server with:

✅ **Strengths:**
- Comprehensive API surface (44 endpoints)
- Robust security layers (API key, rate limiting, validation)
- Flexible storage (memory + Redis)
- Clean WebSocket implementation with subscriptions
- Thoughtful error handling and sanitization

⚠️ **Improvement Areas:**
- Complete missing event broadcasts (2 endpoints)
- Implement per-session ACL (security hardening)
- Add pagination for large datasets (scalability)
- Unify sync/async storage handling (code quality)
- Comprehensive test coverage (reliability)

🎯 **Recommendations for SRD:**
1. Document API contract with OpenAPI spec
2. Define storage tier selection criteria (Memory vs Redis)
3. Specify security hardening for production deployment
4. Create scaling guide for multi-instance setups
5. Define monitoring and alerting strategy

---

**Report Generated:** 2026-02-08T17:26:07Z
**Analysis Scope:** Full backend functionality inventory
**Next Steps:** FRD/SRD documentation creation using this analysis
