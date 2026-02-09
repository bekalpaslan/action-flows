# Backend Analysis: Inventory & Functionality

**Timestamp:** 2026-02-08T16:56:16Z
**Scope:** `packages/backend/`
**Analysis Type:** Inventory + Functionality Assessment
**Mode:** Analyze-Only

---

## Executive Summary

The ActionFlows Dashboard backend is a **fully-featured Express 4.18 + WebSocket orchestration server** with:
- **11 API route modules** covering sessions, commands, events, files, terminal, Claude CLI, discovery, projects, history, users, and session windows
- **Dual-mode storage** supporting both in-memory (dev) and Redis (prod)
- **WebSocket-first architecture** with subscription-based event broadcasting and client management
- **Security hardening**: API key auth, rate limiting, file path validation, CORS, payload limits
- **Service layer** for Claude CLI process management, file watching, project detection, and session discovery

**Status:** Feature-complete with some partial implementations and known TODOs flagged for future work.

---

## Architecture Overview

### Entry Point
**File:** `packages/backend/src/index.ts`

**Responsibilities:**
1. Create Express app with middleware stack (CORS, body limits, auth, rate limiting, error handling)
2. Mount 11 API routers at `/api/*` paths
3. Setup WebSocket server on `/ws` with upgrade handling
4. Initialize storage (memory or Redis)
5. Setup broadcast functions for file events, terminal output, Claude CLI events
6. Manage graceful shutdown with cleanup

**Observations:**
- Middleware chain is well-ordered (CORS → body parsing → auth → rate limit → error handler)
- WebSocket upgrade handler includes API key validation before establishing connection
- Redis Pub/Sub initialization deferred until server startup (async pattern)
- Graceful shutdown covers: cleanup service, file watchers, Claude CLI sessions, WebSocket clients, Redis disconnect

---

## API Routes Inventory

### 1. **Sessions Route** (`/api/sessions`)
**File:** `packages/backend/src/routes/sessions.ts`
**Pattern:** RESTful + Input/Command Polling

| Endpoint | Method | Purpose | Status | Notes |
|----------|--------|---------|--------|-------|
| `/` | POST | Create new session | ✅ Complete | Validates cwd exists, denies system paths, starts file watcher |
| `/` | GET | List all sessions | ✅ Complete | Memory only (Redis limitation noted) |
| `/:id` | GET | Get session with chains | ✅ Complete | Includes enriched chain data |
| `/:id` | PUT | Update session status/metadata | ✅ Complete | Triggers file watcher stop & history persistence on completion |
| `/:id/chains` | GET | List session chains | ✅ Complete | Returns all chains for a session |
| `/:id/input` | POST | Queue user input | ✅ Complete | Payload validation via schema |
| `/:id/input` | GET | Long-poll for input | ✅ Complete | Supports timeout (capped 60s), 500ms poll interval |
| `/:id/awaiting` | POST | Mark session awaiting input | ✅ Complete | Sets conversationState, stores prompt context, **TODO: broadcast via WS** |

**Key Features:**
- Path validation: Denies access to `/etc`, `/sys`, `/proc`, `C:\Windows`, etc. (DENIED_PATHS list)
- File watching: Starts on session create, stops on completion
- Long-polling: For hook integration (prevents constant API calls)
- Conversation state: Tracks `awaiting_input`, stores prompt and quick responses

**Issues/Gaps:**
1. **TODO at line 359:** WebSocket broadcast for awaiting_input events not implemented
2. **Redis limitation:** `GET /api/sessions` returns empty with Redis (no key scan)
3. **Input queue lifecycle:** Only cleared after retrieval, but accumulates if never polled
4. **Session history:** File persistence happens on session end, but only to disk (not real-time audit)

---

### 2. **Commands Route** (`/api/commands`)
**File:** `packages/backend/src/routes/commands.ts`
**Pattern:** Command Queue + Polling

| Endpoint | Method | Purpose | Status | Notes |
|----------|--------|---------|--------|-------|
| `/:id/commands` | POST | Queue command for session | ✅ Complete | Generates commandId, stores with timestamp |
| `/:id/commands` | GET | Get pending commands | ✅ Complete | Auto-clears after fetch (polling pattern) |
| `/:commandId/ack` | POST | Acknowledge command processed | ⏳ Partial | Accepts result/error, logs without storing |

**Key Features:**
- Command ID generation: `cmd-${Date.now()}-${Math.random()}`
- Polling-friendly: Auto-clears on fetch (acts as queue)
- Sanitized logging: Command result not logged (security)

**Issues/Gaps:**
1. **ACK handler is a stub:** Logs but doesn't store result/error (line 88-101)
2. **No command timeout:** Commands stay in queue indefinitely if not fetched
3. **No result persistence:** Command outcomes are lost after ACK
4. **Missing validation:** `/:commandId/ack` doesn't validate commandId exists

---

### 3. **Events Route** (`/api/events`)
**File:** `packages/backend/src/routes/events.ts`
**Pattern:** Event Store + Broadcast

| Endpoint | Method | Purpose | Status | Notes |
|----------|--------|---------|--------|-------|
| `/` | POST | Receive & store event | ✅ Complete | Validates schema, stores, updates active step for file attribution |
| `/:sessionId` | GET | Get all events for session | ✅ Complete | Returns full event history |
| `/:sessionId?since=<ts>` | GET | Get events since timestamp | ✅ Complete | Filters by ISO timestamp |
| `/:sessionId/recent` | GET | Get recent events | ✅ Complete | Limits to N events or M seconds (max 50, 60s default) |

**Key Features:**
- Event storage: In-memory Map<SessionId, WorkspaceEvent[]> with FIFO eviction (max 10K per session)
- Active step tracking: File changes attributed to currently-running step
- Timestamp filtering: Supports since-based queries for incremental sync
- Recent query: Safe limits (1000 event cap, 60s window)

**Observations:**
- Event type detection: `step:spawned`, `step:started` → set active, `step:completed`, `step:failed` → clear active
- Redis Pub/Sub path: Events published to `afw:events` channel (index.ts handles broadcast)
- Memory bound: 10K events per session (oldest evicted when full)

---

### 4. **Users Route** (`/api/users`)
**File:** `packages/backend/src/routes/users.ts`
**Pattern:** User + Session Aggregation

| Endpoint | Method | Purpose | Status | Notes |
|----------|--------|---------|--------|-------|
| `/` | GET | List users with session counts | ✅ Complete | Includes online status (in_progress/pending) |
| `/:userId/sessions` | GET | Get sessions for user | ✅ Complete | Filters to user's sessions only |

**Note:** Also defined in sessions.ts (duplicate routes at lines 481-541). **Consolidation opportunity.**

---

### 5. **History Route** (`/api/history`)
**File:** `packages/backend/src/routes/history.ts`
**Pattern:** File-Persisted Session Archive

| Endpoint | Method | Purpose | Status | Notes |
|----------|--------|---------|--------|-------|
| `/dates` | GET | List available history dates | ✅ Complete | Returns YYYY-MM-DD folders |
| `/sessions/:date` | GET | List session IDs for date | ✅ Complete | Scans date folder |
| `/session/:sessionId?date=<date>` | GET | Load session snapshot | ✅ Complete | Loads from date folder (defaults to today) |
| `/stats` | GET | Storage statistics | ✅ Complete | File count, disk usage, date coverage |
| `/cleanup` | POST | Manually trigger old file cleanup | ✅ Complete | Deletes files older than retention period |

**Key Features:**
- File-based persistence: Each completed session → `history/{YYYY-MM-DD}/session-{id}.json`
- Retention policy: 7 days default (cleanup service)
- Query flexibility: Can retrieve old snapshots by date

**Issues/Gaps:**
1. **No real-time persistence:** History only written on session completion (no mid-session snapshots)
2. **No granular event archival:** Only session + events snapshot, no incremental history
3. **Cleanup is fire-and-forget:** POST endpoint doesn't validate cleanup success

---

### 6. **Files Route** (`/api/files`)
**File:** `packages/backend/src/routes/files.ts`
**Pattern:** File Explorer + Editor Integration

| Endpoint | Method | Purpose | Status | Notes |
|----------|--------|---------|--------|-------|
| `/:sessionId/tree` | GET | Get directory tree | ✅ Complete | Recursive, depth-limited (max 3), hides node_modules/dist/build |
| `/:sessionId/read?path=<path>` | GET | Read file content | ✅ Complete | Max 10MB, validates path within session cwd |
| `/:sessionId/write?path=<path>` | POST | Write file content | ✅ Complete | Max 10MB content, validates path |
| `/:sessionId/diff?path=<path>` | GET | Get file diff | ⏳ Partial | Stub: returns current content only, **TODO: snapshot tracking** |

**Key Features:**
- Path validation: Custom middleware `validateFilePath` prevents directory traversal
- Size limits: 10MB for both read and write
- Tree building: Recursive with depth limit, FIFO sort (dirs first)
- Filtering: Skips hidden files, node_modules, __pycache__, dist, build

**Issues/Gaps:**
1. **Diff is incomplete (line 256-302):** No previous version snapshots, shows "not implemented" message
2. **No atomic writes:** No locking for concurrent file access
3. **No change tracking:** No audit trail of file modifications (only current state)
4. **Depth limit hardcoded:** No way to request deeper trees from API

---

### 7. **Terminal Route** (`/api/terminal`)
**File:** `packages/backend/src/routes/terminal.ts`
**Pattern:** Output Streaming + Buffering

| Endpoint | Method | Purpose | Status | Notes |
|----------|--------|---------|--------|-------|
| `/:sessionId/output` | POST | Post terminal output | ✅ Complete | Buffers stdout/stderr, broadcasts via WS |
| `/:sessionId/buffer` | GET | Get recent terminal output | ✅ Complete | Returns last N lines (default 1000) |
| `/:sessionId/buffer` | DELETE | Clear terminal buffer | ✅ Complete | Clears in-memory buffer |

**Key Features:**
- Dual storage: In-memory buffer + WebSocket broadcast
- Stream separation: stdout/stderr tracked separately
- Step attribution: Can associate output with specific step number
- Buffering: Configurable limit, default 1000 lines

**Observations:**
- `terminalBuffer` service: FIFO queue with per-session buffers
- WebSocket broadcast: Every POST → event sent to subscribers
- No persistence: Buffer cleared on server restart or session cleanup

---

### 8. **Claude CLI Route** (`/api/claude-cli`)
**File:** `packages/backend/src/routes/claudeCli.ts`
**Pattern:** Process Control + Session Lifecycle

| Endpoint | Method | Purpose | Status | Notes |
|----------|--------|---------|--------|-------|
| `/start` | POST | Start Claude CLI session | ✅ Complete | Validates cwd, env vars, spawns process, returns session info |
| `/:sessionId/input` | POST | Send stdin to process | ✅ Complete | Writes to child process stdin |
| `/:sessionId/stop` | POST | Stop Claude CLI session | ✅ Complete | Sends signal (SIGTERM default), cleans up process |
| `/:sessionId/status` | GET | Get session status | ✅ Complete | Returns info + uptime |
| `/sessions` | GET | List active CLI sessions | ✅ Complete | Returns all managed sessions |

**Key Features:**
- Process spawning: Validates cwd (no system paths), env vars, MCP config
- Environment validation: Key/value validation via `ProjectDetector` helper
- MCP auto-config: Generates config if not provided, sets up actionflows-dashboard server
- Project tracking: Updates lastUsedAt on project startup
- Signal handling: Configurable stop signal (default SIGTERM)

**Issues/Gaps:**
1. **MCP config hardcoding:** Config path auto-generated, no fallback if path invalid
2. **Process leak risk:** If session stop fails, process may remain orphaned
3. **Input buffering:** No input queue, direct stdin write (immediate delivery only)
4. **No output capture:** Output must be posted separately via terminal route

---

### 9. **Session Windows Route** (`/api/session-windows`)
**File:** `packages/backend/src/routes/sessionWindows.ts`
**Pattern:** UI State Persistence + Session Following

| Endpoint | Method | Purpose | Status | Notes |
|----------|--------|---------|--------|-------|
| `/` | GET | List followed sessions (enriched) | ✅ Complete | Returns session + current chain + events count |
| `/:id/enriched` | GET | Get detailed enriched data | ✅ Complete | Includes all chains, events, config |
| `/:id/follow` | POST | Mark session as followed | ✅ Complete | Adds to followed set |
| `/:id/follow` | DELETE | Unmark session as followed | ✅ Complete | Removes from followed set + config |
| `/:id/config` | PUT | Update session window config | ✅ Complete | Stores custom window layout/state |

**Key Features:**
- Followed sessions: Subset of all sessions (user's interest list)
- Session window config: Custom per-session UI state (layout, zoom, viewport)
- Enrichment: Auto-includes session metadata, chains, events

**Observations:**
- Config storage: Optional (storage.setSessionWindowConfig is conditional)
- Cleanup: Deleting follow also clears associated config
- No user scoping: Any user can follow any session (permission model simplified)

---

### 10. **Projects Route** (`/api/projects`)
**File:** `packages/backend/src/routes/projects.ts`
**Pattern:** Project Registry + Metadata Management

| Endpoint | Method | Purpose | Status | Notes |
|----------|--------|---------|--------|-------|
| `/` | GET | List all projects (sorted by lastUsedAt) | ✅ Complete | Returns projects with metadata |
| `/detect` | POST | Auto-detect project from cwd | ✅ Complete | Scans for package.json, pyproject.toml, etc. |
| `/:id` | GET | Get project by ID | ✅ Complete | Returns full project object |
| `/` | POST | Create new project | ✅ Complete | Validates env vars, stores with defaults |
| `/:id` | PUT | Update project | ✅ Complete | Partial update, env var validation |
| `/:id` | DELETE | Delete project | ✅ Complete | Soft or hard delete |

**Key Features:**
- Project detection: Reads cwd for common manifest files, detects type
- Environment variables: Validated keys/values, prevents injection
- MCP config: Optional path, validated if provided
- Quick action presets: Stored per-project for quick commands
- Metadata: Name, description, default CLI flags, default prompt template

**Issues/Gaps:**
1. **Detection is stateless:** Auto-detect doesn't save (must POST to create)
2. **No duplicate detection:** Same cwd can be registered multiple times
3. **No project validation:** No check if cwd still exists after registration
4. **Missing update validation:** PUT accepts partial updates without existence check (line 153)

---

### 11. **Discovery Route** (`/api/discovery`)
**File:** `packages/backend/src/routes/discovery.ts`
**Pattern:** External Session Discovery

| Endpoint | Method | Purpose | Status | Notes |
|----------|--------|---------|--------|-------|
| `/sessions` | GET | Discover running Claude CLI sessions | ✅ Complete | Scans IDE lock files for active Claude Code instances |

**Query Parameters:**
- `enrich=true`: Include JSONL enrichment (project type detection)
- `aliveOnly=true`: Filter to sessions with live PIDs only

**Key Features:**
- IDE lock file scanning: Detects running Claude Code from lock files
- PID validation: Checks if process still running
- Optional enrichment: Detect project type per session
- Timestamp: Returns discovery time for cache validation

**Observations:**
- Service: `claudeSessionDiscovery` (separate service)
- Use case: Dashboard can show running CLI sessions without polling project registry

---

## WebSocket Implementation

### Handler
**File:** `packages/backend/src/ws/handler.ts`

**Message Types:**
| Type | Direction | Purpose | Notes |
|------|-----------|---------|-------|
| `subscribe` | client→server | Subscribe to session events | Validates session exists, user ownership |
| `unsubscribe` | client→server | Unsubscribe from session | Cleans up subscriptions |
| `input` | client→server | Queue input for session | Mirrors POST endpoint |
| `ping` | client→server | Keepalive check | Responds with `pong` |
| `subscription_confirmed` | server→client | ACK subscription | Sent on connect and after subscribe |
| `event` | server→client | Broadcast event | Includes sessionId and payload |
| `command` | server→client | Send command | Rarely used (HTTP preferred) |
| `error` | server→client | Error notification | Auth failures, rate limits, validation |

**Security Features:**
1. **Fix 1:** Per-message API key validation (checks rotation)
2. **Fix 2:** Session ownership validation (user scoping)
3. **Fix 4:** Rate limit check (50 msgs/sec per client)
4. Rate limiting: 1000 max clients, 50 msgs/sec window

**Message Flow:**
```
1. Client connects → Register in clientRegistry
2. Client sends { type: 'subscribe', sessionId: '...' }
3. Server validates session exists + user ownership
4. Server calls clientRegistry.subscribe(ws, sessionId)
5. Events for sessionId broadcast to all subscribed clients
6. Client closes → Auto-unsubscribe all sessions
```

### Client Registry
**File:** `packages/backend/src/ws/clientRegistry.ts`

**Tracked Per-Client:**
- `clientId`: Unique identifier
- `subscribedSessionIds`: Set of sessions subscribed to
- `connectedAt`: Connection timestamp
- `messageCount` + `messageWindowStart`: Rate limit tracking
- `apiKey`: Stored from handshake (per-message validation)
- `userId`: For session ownership checks

**Operations:**
- `register()`: Add client, check capacity (max 1000)
- `unregister()`: Remove client, cleanup subscriptions
- `subscribe()`: Add session to subscription set
- `unsubscribe()`: Remove session from subscription set
- `broadcastToSession()`: Send to all subscribed clients for a session
- `broadcastToAll()`: Send to all connected clients
- `validateApiKey()`: Check API key still matches env var
- `checkRateLimit()`: Enforce 50 msgs/sec per client

---

## Storage Layer

### Design
**File:** `packages/backend/src/storage/index.ts`

**Architecture:**
- Unified `Storage` interface with dual implementations
- Memory backend for development (sync)
- Redis backend for production (async with pub/sub)
- Both backends satisfy same interface
- Helper: `isAsyncStorage()` to detect backend type

**Storage Interface:**

| Operation | Type | Description |
|-----------|------|-------------|
| Sessions | Map<SessionId, Session> | CRUD + user tracking |
| Chains | Map<SessionId, Chain[]> | Append-only per session |
| Events | Map<SessionId, WorkspaceEvent[]> | Append-only with FIFO eviction |
| Commands | Map<SessionId, CommandPayload[]> | Queue (auto-clear on read) |
| Input | Map<SessionId, unknown[]> | Queue (auto-clear on read) |
| Clients | Set<{clientId, sessionId}> | Connected WebSocket clients |
| FollowedSessions | Set<SessionId> | UI favorite sessions |
| SessionWindowConfigs | Map<SessionId, Config> | Per-session UI state |
| Pub/Sub | subscribe/publish (Redis only) | Redis event broadcasting |

### Memory Storage
**File:** `packages/backend/src/storage/memory.ts`

**Bounds:**
- Max 10K events per session (FIFO eviction)
- Max 100 chains per session (FIFO eviction)
- Max 1000 sessions total (evict oldest completed/failed)
- Max 100 input items per queue

**Key Methods:**
- `getSession()`: O(1) lookup
- `addEvent()`: O(1) append, evict if needed
- `addChain()`: O(1) append, evict if needed
- `getEvents()`, `getEventsSince()`: O(n) filter
- `getChain()`: O(n*m) search across sessions
- `setSession()`: Tracks user→sessions mapping for aggregation

**Issues:**
1. **User tracking:** Only populated from session creation, doesn't track removal (potential stale refs)
2. **Chain lookup:** Linear search across all chains (expensive for many sessions)
3. **Memory leak risk:** Completed sessions evicted, but events/chains maps not cleaned up at same time
4. **Eviction policy:** Evicts oldest completed/failed, but could leave younger pending sessions (unfair)

---

## Middleware Stack

### Authentication (`auth.ts`)
- **Lookup order:** Authorization: Bearer, query ?apiKey, x-api-key header
- **Dev mode:** If AFW_API_KEY not set, auth disabled
- **Prod mode:** Validates key matches, returns 401 if missing/invalid
- **Logging:** Warns on unauthorized attempts

### Error Handler (`errorHandler.ts`)
- **Sanitize function:** Strips sensitive details from error messages
- **Global catch:** Must be mounted after all routes
- **Status codes:** 500 for unhandled, custom for validation

### Rate Limiting (`rateLimit.ts`)
- **Limiters:**
  - `generalLimiter`: 100 requests per 15 minutes on `/api` (express-rate-limit)
  - `writeLimiter`: 50 requests per minute on write endpoints
  - `sessionCreateLimiter`: 10 requests per minute on POST /sessions
- **Keying:** By IP address (req.ip)

### Validation (`validate.ts`)
- **Pattern:** Zod schema per route
- **Usage:** `validateBody(schema)` middleware
- **Session param validation:** `validateSessionIdParam()` for path params

### Path Validation (`validatePath.ts`)
- **Middleware:** `validateFilePath(paramName)`
- **Checks:**
  - Session exists
  - Path within session cwd
  - No directory traversal (`..` sequences)
  - Resolves symlinks to prevent escapes
- **Result:** Sets `req.validatedPath` and `req.session`

---

## Services Layer

### 1. Claude CLI Manager (`claudeCliManager.ts`)
**Singleton:** Manages all Claude Code CLI process instances

**Capabilities:**
- Spawn process with environment validation
- MCP config auto-generation (or use provided)
- stdin/stdout capture and broadcast
- Process termination with signal handling
- Session lifecycle tracking (started, output, exited events)

**Limits:**
- Max 5 concurrent sessions (configurable via AFW_CLAUDE_CLI_MAX_SESSIONS)
- Validates cwd (no system paths)
- Validates env vars (key/value format)
- Validates CLI flags (prevents injection)

**Broadcast:** Events (started, output, exited) sent to WebSocket subscribers

---

### 2. File Watcher (`fileWatcher.ts`)
**Purpose:** Monitor project directories, broadcast change events with step attribution

**Features:**
- Chokidar-based monitoring (recursive, efficient)
- Ignore patterns: node_modules, .git, __pycache__, dist, build, .env, etc.
- Debounce: 300ms for rapid changes
- Step attribution: Changes attributed to currently-running step
- Depth limit: Max depth 10 (security against symlink attacks)
- Stability threshold: Wait 100ms after last change before firing event

**Active Step Tracking:**
- `setActiveStep(sessionId, stepNumber, action)`: Called on step:spawned/started
- `clearActiveStep(sessionId)`: Called on step:completed/failed
- File changes while step active → include stepNumber in event

**Events Broadcast:**
- `file:created`: New file added
- `file:modified`: File changed
- `file:deleted`: File removed

---

### 3. Project Detector (`projectDetector.ts`)
**Purpose:** Auto-detect project type from directory contents

**Detection:**
- Scans for package.json (Node), pyproject.toml (Python), etc.
- Validates environment variable keys/values
- Returns project metadata (type, framework, entry point)

---

### 4. Project Storage (`projectStorage.ts`)
**Purpose:** Persist project registry to file system

**Operations:**
- CRUD on project records
- Update lastUsedAt timestamp
- Filter by metadata
- Sorted by usage

---

### 5. Claude Session Discovery (`claudeSessionDiscovery.ts`)
**Purpose:** Find running Claude Code CLI sessions from IDE lock files

**Capabilities:**
- Scan lock file locations
- Validate PID alive
- Optional enrichment (project type detection)
- Return discovered sessions

---

### 6. Terminal Buffer (`terminalBuffer.ts`)
**Purpose:** In-memory FIFO buffer for terminal output

**Features:**
- Per-session buffers
- Stream separation (stdout/stderr)
- Step attribution (optional)
- Recent query support
- Clear operation

---

### 7. Cleanup Service (`cleanup.ts`)
**Purpose:** Periodic maintenance (remove old history files)

**Frequency:**
- Daily schedule (configurable)
- Removes files older than 7 days
- Scheduled on server startup

---

## Data Flow Diagrams

### Session Creation Flow
```
POST /api/sessions
  ↓ validateBody(createSessionSchema)
  ↓ validateBody(checks cwd exists, not system path)
  ↓ storage.setSession(session)
  ↓ fileWatcher.startWatching(sessionId, cwd)
  ↓ Response: { session }
  ↓ Client connects WebSocket and subscribes to sessionId
  ↓ Future file changes broadcast via WebSocket
```

### Command Execution Flow
```
POST /api/commands/{id}/commands (Queue)
  ↓ validateBody(createCommandSchema)
  ↓ storage.queueCommand(sessionId, command)
  ↓ Response: { commandId }

Claude CLI Hook polls GET /api/commands/{id}/commands
  ↓ storage.getCommands(sessionId) [clears queue]
  ↓ Executes command locally
  ↓ Optional: POST /api/commands/{commandId}/ack (result logged but not stored)
```

### Event Broadcast Flow (Memory)
```
POST /api/events (Hook posts event)
  ↓ validateBody(createEventSchema)
  ↓ storage.addEvent(sessionId, event)
  ↓ broadcastFileEvent/broadcastTerminalEvent/broadcastClaudeCliEvent()
  ↓ clientRegistry.broadcastToSession(sessionId, message)
  ↓ All subscribed WebSocket clients receive { type: 'event', payload: event }
```

### Event Broadcast Flow (Redis)
```
POST /api/events (Hook posts event)
  ↓ validateBody(createEventSchema)
  ↓ asyncStorage.addEvent(sessionId, event) [stores in Redis]
  ↓ asyncStorage.publish('afw:events', { sessionId, event })
  ↓ index.ts Redis Pub/Sub subscriber receives message
  ↓ clientRegistry.broadcastToSession(sessionId, message)
  ↓ All subscribed WebSocket clients receive { type: 'event', payload: event }
```

---

## Status Summary

| Category | Status | Notes |
|----------|--------|-------|
| **Routes** | ✅ Complete | 11 routes, all endpoints functional |
| **REST API** | ✅ Complete | Standard CRUD patterns |
| **WebSocket** | ✅ Complete | Subscription-based, auth, rate limit |
| **Storage** | ✅ Complete | Memory + Redis dual backend |
| **Authentication** | ✅ Complete | API key + per-message validation |
| **Rate Limiting** | ✅ Complete | Global + per-endpoint limiters |
| **File Watching** | ✅ Complete | Debounced, step-attributed, broadcaster |
| **Claude CLI** | ✅ Complete | Process control, env validation |
| **Project Registry** | ✅ Complete | CRUD + detection |
| **Session Discovery** | ✅ Complete | IDE lock file scanning |
| **History Archival** | ✅ Complete | File-based, 7-day retention |
| **Terminal Buffering** | ✅ Complete | FIFO, per-session, stream-separated |

### Partial/TODO Items

| Item | Location | Status | Impact |
|------|----------|--------|--------|
| Awaiting input broadcast | sessions.ts:359 | 🚧 TODO | WebSocket won't notify on awaiting state |
| File diff snapshots | files.ts:274 | 🚧 TODO | Diff shows current only, not changes |
| Command ACK persistence | commands.ts:88 | ⏳ Partial | Results logged but not stored |
| Session listing on Redis | sessions.ts:135 | ⏳ Partial | Returns empty (no key scan impl) |
| User route duplication | sessions.ts vs users.ts | 🔧 Consolidate | Same endpoints in 2 files |

---

## Improvement Areas

### 1. **Async/Await Consistency**
**Current:** Mixed `await Promise.resolve()` pattern for storage operations
**Issue:** Storage interface mixes sync and async methods; code uses Promise.resolve to handle both
**Recommendation:** Adopt full async storage interface, migrate memory storage to async wrapper

Example (sessions.ts:107):
```typescript
await Promise.resolve(storage.setSession(session));
```

### 2. **Error Messages in Logs**
**Current:** sanitizeError() strips sensitive details for API responses
**Issue:** Some routes use error.message directly (projects.ts:181), others sanitize
**Recommendation:** Consistent error handling across all routes

### 3. **TODO WebSocket Broadcast**
**Location:** sessions.ts:359
**Issue:** Awaiting input state change not broadcast, clients must poll to detect state change
**Recommendation:** Emit `session:awaiting_input` event via WebSocket after POST /sessions/:id/awaiting

### 4. **File Diff Implementation**
**Location:** files.ts:256
**Current:** Returns empty diff with "not implemented" message
**Recommendation:** Implement file snapshot system or use file watching events to track changes

### 5. **Redis Storage Limitation**
**Location:** sessions.ts:135
**Issue:** GET /api/sessions returns empty with Redis (no key enumeration)
**Recommendation:** Maintain separate set of active session IDs in Redis, or use SCAN pattern

### 6. **Command ACK Result Handling**
**Location:** commands.ts:88
**Current:** ACK accepts result/error but logs without storage
**Recommendation:** Store command results in session history or events store for audit trail

### 7. **Input Queue Lifecycle**
**Location:** memory.ts & sessions.ts
**Issue:** Input items only cleared after retrieval; if hook never polls, queue grows
**Recommendation:** Add TTL or max queue size enforcement

### 8. **Duplicate User Routes**
**Location:** sessions.ts:481-541 AND users.ts
**Issue:** Same endpoints defined in two files
**Recommendation:** Keep single authoritative location, remove duplicate from sessions.ts

### 9. **Project Duplicate Detection**
**Location:** projects.ts:98
**Issue:** No check if cwd already registered
**Recommendation:** Search existing projects by cwd before create, merge if found

### 10. **File Depth Limit Flexibility**
**Location:** files.ts:99
**Current:** Tree endpoint has hard max depth of 3, but always called with ?depth param
**Recommendation:** Pass depth as parameter consistently, no hard cap (let client request what needed)

---

## Security Assessment

### Strengths
1. ✅ Path traversal validation (`validatePath` middleware)
2. ✅ System directory denial (DENIED_PATHS in sessions.ts & claudeCliManager.ts)
3. ✅ API key authentication (environment-based, per-message validation)
4. ✅ CORS whitelist (configurable, enforced)
5. ✅ Rate limiting (global + per-endpoint)
6. ✅ Payload limits (1MB global, 10MB per file)
7. ✅ WebSocket auth (API key on upgrade + per-message)
8. ✅ Session ownership (user scoping on subscribe)
9. ✅ Input sanitization (Zod schemas)
10. ✅ Error message sanitization (no stack traces to clients)

### Potential Gaps
1. ⚠️ Long-polling timeout cap is 60s (could be abused for resource exhaustion)
2. ⚠️ No rate limit on file read (10MB each, but unlimited requests)
3. ⚠️ No request body size validation beyond Content-Length
4. ⚠️ WebSocket doesn't enforce subscription before sending input messages
5. ⚠️ No input validation on terminal output POST (trusts hook to send valid UTF-8)

---

## Metrics

### Code Organization
- **Routes:** 11 modules (single responsibility)
- **Services:** 7 modules (feature-specific)
- **Middleware:** 5 modules (cross-cutting)
- **Storage:** 2 implementations + 1 interface
- **WebSocket:** 2 modules (handler + registry)
- **Total Source Files:** ~40 TypeScript files

### Test Coverage
- **Test files:** 2 files (integration.test.ts, helpers.ts)
- **Coverage:** Integration test suite, no unit test coverage observed
- **Recommendation:** Add unit tests for storage, middleware, services

### Dependencies
- **Core:** express 4.18.2, ws 8.14.2, ioredis 5.3.0, zod 3.22.0
- **Utilities:** cors 2.8.5, chokidar 3.5.3, express-rate-limit 7.1.0
- **Lean:** No large frameworks beyond Express, minimal external deps

---

## API Endpoint Summary

**Total Endpoints: 38**

| Module | GET | POST | PUT | DELETE | Total |
|--------|-----|------|-----|--------|-------|
| Sessions | 3 | 3 | 1 | 0 | 7 |
| Commands | 1 | 2 | 0 | 0 | 3 |
| Events | 3 | 1 | 0 | 0 | 4 |
| Users | 2 | 0 | 0 | 0 | 2 |
| History | 4 | 1 | 0 | 0 | 5 |
| Files | 3 | 1 | 0 | 0 | 4 |
| Terminal | 1 | 1 | 0 | 1 | 3 |
| Claude CLI | 2 | 2 | 0 | 0 | 4 |
| Session Windows | 2 | 2 | 1 | 1 | 6 |
| Projects | 3 | 2 | 1 | 1 | 7 |
| Discovery | 1 | 0 | 0 | 0 | 1 |
| **TOTAL** | **25** | **15** | **3** | **2** | **38** |

---

## Conclusion

The ActionFlows Dashboard backend is a **mature, well-architected orchestration server** with:
- Comprehensive API coverage for session management, event streaming, and command execution
- Enterprise-grade security (auth, rate limiting, path validation, CORS)
- Flexible storage (memory for dev, Redis for prod)
- WebSocket-first event distribution architecture
- Clean service layer for domain logic (Claude CLI, file watching, project detection)

**Key Strengths:**
- Unified Storage interface enabling dual backends
- Subscription-based WebSocket architecture (efficient broadcasting)
- Comprehensive path validation preventing system access
- API key authentication with per-message validation

**Primary Gaps:**
- Some TODO features (awaiting input broadcast, file diff snapshots)
- Partial command result persistence
- Limited test coverage
- Duplicate user route definitions
- Minor inconsistencies in error handling

**Recommendation:** Address TODO items and consolidate duplicate routes. The core architecture is solid and production-ready for Phase 9+ feature expansion.

---

**Analysis Completed:** 2026-02-08T16:56:16Z
