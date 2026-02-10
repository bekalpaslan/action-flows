# ActionFlows Dashboard: Living Universe Analysis

**Analysis Type:** Philosophical/Structural
**Date:** 2026-02-10
**Perspective:** Observing the system as a living ecosystem with organisms, resources, and temporal dynamics

---

## Executive Summary

The ActionFlows Dashboard is not just a monitoring tool — it is a **living, breathing universe** where data flows like blood, components metabolize information like cells, and time operates on multiple scales simultaneously. This analysis maps the system as if observing an alien planet, identifying:

- **31 major organisms** (components) with distinct life cycles
- **7 resource flows** (data birth, flow, aging, death)
- **5 temporal systems** (from microsecond reflexes to multi-hour seasons)
- **12 symbiotic partnerships** (tightly coupled dependencies)
- **4 apex predators** (components that consume everything)
- **3 black holes** (data entry points with no exit)

---

## 1. The Organisms (Components as Living Beings)

### 1.1 The Nerve Center (Express Server)

**Location:** `packages/backend/src/index.ts`

**Life Form:** Colonial organism (like a coral reef)
**Behavior:** Hub-and-spoke nervous system

**What it consumes:**
- HTTP requests (port 3001)
- WebSocket upgrade requests
- Environment variables (PORT, AFW_CORS_ORIGINS, AFW_API_KEY)

**What it produces:**
- JSON responses
- WebSocket connections
- Broadcast events to all clients

**What it needs to survive:**
- At least one storage adapter (MemoryStorage or Redis)
- Express middleware stack intact
- ClientRegistry for connection tracking

**What kills it:**
- SIGTERM/SIGINT signals (graceful death)
- Uncaught exceptions (sudden death)
- Port binding failure (stillbirth)

**Symbiotic partners:**
- WebSocketServer (wss) — cannot live without each other
- ClientRegistry — the brain tracking all connections
- Storage layer — its memory

**Lifecycle:**
- **Birth:** `server.listen(PORT)` fires
- **Metabolism:** Event loop processes HTTP/WS messages
- **Death:** `gracefulShutdown()` closes all connections, stops heartbeat (20s interval), disconnects Redis

**Temporal signature:**
- Heartbeat: 20 seconds
- Reflexes: <1ms (HTTP response time)

---

### 1.2 The Circulatory System (WebSocket Handler)

**Location:** `packages/backend/src/ws/handler.ts`

**Life Form:** Blood vessel network
**Behavior:** Real-time event distribution

**What it consumes:**
- WebSocket messages (JSON-encoded)
- Subscribe/unsubscribe commands
- Ping messages (client heartbeat)

**What it produces:**
- Event broadcasts to subscribed clients
- Pong responses
- Subscription confirmations
- Error messages

**What it needs to survive:**
- Valid WebSocket connection (readyState === 1)
- ClientRegistry to track subscriptions
- Storage to persist input and chat history

**What kills it:**
- Client disconnection
- Invalid JSON parsing
- Rate limit exceeded (50 messages/second)
- API key rotation without re-authentication

**Symbiotic partners:**
- ClientRegistry — tracks which clients are subscribed to which sessions
- ClaudeCliManager — pipes user input directly to CLI stdin

**Lifecycle:**
- **Birth:** WebSocket upgrade successful, clientId assigned
- **Metabolism:** Message routing based on subscription state
- **Death:** `ws.on('close')` fires, unregister from clientRegistry

**Temporal signature:**
- Ping interval: 25 seconds (client-side)
- Heartbeat timeout: 30 seconds
- Rate limit window: 1 second

---

### 1.3 The Lymphatic System (Client Registry)

**Location:** `packages/backend/src/ws/clientRegistry.ts`

**Life Form:** Immune system + traffic controller
**Behavior:** Tracks who is subscribed to what, enforces rate limits

**What it consumes:**
- WebSocket connections
- Session subscription requests
- Message counts for rate limiting

**What it produces:**
- Broadcast routes (session → clients mapping)
- Rate limit decisions
- Connection statistics

**What it needs to survive:**
- Map<WebSocket, ClientInfo> intact
- Accurate per-client message counts

**What kills it:**
- Memory leak (unbounded client additions)
- Capacity limit reached (1000 max clients)

**Symbiotic partners:**
- WebSocket handler — provides all connection events
- Express server — enforces max capacity

**Lifecycle:**
- **Birth:** Singleton created on module load
- **Metabolism:** Continuous client tracking
- **Death:** Never dies (lives as long as process)

**Temporal signature:**
- Rate limit window: 1 second (rolling)
- Message window reset: 1000ms

---

### 1.4 The Memory Banks (MemoryStorage)

**Location:** `packages/backend/src/storage/memory.ts`

**Life Form:** Short-term memory (RAM-based)
**Behavior:** Fast, volatile, bounded

**What it consumes:**
- Sessions, chains, events, commands, input, chat messages
- Bookmarks, patterns, harmony checks, dossiers, suggestions

**What it produces:**
- Read operations (synchronous, <1ms)
- Eviction notifications (when limits reached)

**What it needs to survive:**
- Bounded data structures (all have FIFO eviction)

**What kills it:**
- Process restart (complete amnesia)
- Running out of heap memory

**Lifecycle:**
- **Birth:** Module load creates singleton
- **Metabolism:** FIFO eviction when limits reached
- **Death:** Process exit (no persistence)

**Resource limits (hard-coded death thresholds):**
- 10,000 events per session (FIFO)
- 100 chains per session (FIFO)
- 1,000 total sessions (evict oldest completed)
- 100 input items per session queue
- 100 dossiers
- 50 dossier history entries
- 500 suggestions
- 1,000 chat messages per session

**Temporal signature:**
- TTL: None (process lifetime)
- Data age: Oldest completed sessions evicted first

---

### 1.5 The Archival System (RedisStorage)

**Location:** `packages/backend/src/storage/redis.ts`

**Life Form:** Long-term memory (persistent)
**Behavior:** Slow, durable, distributed

**What it consumes:**
- Same data as MemoryStorage
- Redis connection (3 clients: main, pub, sub)

**What it produces:**
- Async read operations (network-bound)
- Pub/Sub broadcasts to other server instances
- Persistent storage across restarts

**What it needs to survive:**
- Redis server running at REDIS_URL
- Network connectivity
- Redis key space available

**What kills it:**
- Redis connection loss
- Network partition
- Redis OOM (out of memory)

**Lifecycle:**
- **Birth:** `createRedisStorage()` creates 3 clients
- **Metabolism:** Pub/Sub for multi-instance coordination
- **Death:** `disconnect()` quits all 3 clients

**Resource limits (TTL-based death):**
- Session TTL: 24 hours
- Event TTL: 24 hours
- Command queue TTL: 5 minutes
- Input queue TTL: 5 minutes
- Frequency tracking: 30 days
- Bookmarks: 30 days
- Patterns: 30 days
- Harmony checks: 7 days

**Temporal signature:**
- Pub/Sub latency: <10ms (local Redis)
- Read latency: 1-5ms
- Data aging: TTL-based expiration

---

### 1.6 The Janitor (Cleanup Service)

**Location:** `packages/backend/src/services/cleanup.ts`

**Life Form:** Decomposer (like fungi in a forest)
**Behavior:** Removes dead history files older than 7 days

**What it consumes:**
- Date folders in file-persistence storage
- Disk space

**What it produces:**
- Deletion logs
- Storage statistics
- Freed disk space

**What it needs to survive:**
- setInterval running (24-hour cycle)
- File system access

**What kills it:**
- Server shutdown
- File system errors

**Lifecycle:**
- **Birth:** `cleanupService.start()` on server boot
- **Metabolism:** Daily cleanup runs
- **Death:** `cleanupService.stop()` on server shutdown

**Temporal signature:**
- Interval: 24 hours
- Retention period: 7 days
- Runs immediately on start, then every 24 hours

---

### 1.7 The File Sentinel (File Watcher)

**Location:** `packages/backend/src/services/fileWatcher.ts`

**Life Form:** Guard dog (vigilant observer)
**Behavior:** Watches directories, barks when files change

**What it consumes:**
- File system events (chokidar-based)
- Session working directories
- 300ms debounce windows

**What it produces:**
- file:created events
- file:modified events
- file:deleted events
- Step attribution (which agent made which change)

**What it needs to survive:**
- Chokidar watcher instances
- File system access
- Debounce timeout management

**What kills it:**
- stopWatching(sessionId) called
- Server shutdown
- File system errors

**Lifecycle:**
- **Birth:** `startWatching(sessionId, cwd)` creates watcher
- **Metabolism:** Continuous file event processing with 300ms debounce
- **Death:** `stopWatching(sessionId)` closes watcher

**Symbiotic partners:**
- Express server — broadcasts file events via WebSocket
- ActiveSteps map — attributes changes to running steps

**Ignore patterns (what it does NOT watch):**
- node_modules, .git, __pycache__, .env, dist, build, .next, coverage, .vscode, .idea

**Temporal signature:**
- Debounce delay: 300ms
- Stability threshold: 100ms (awaitWriteFinish)
- Watch depth: 10 levels

---

### 1.8 The Process Shepherd (Claude CLI Manager)

**Location:** `packages/backend/src/services/claudeCliManager.ts`

**Life Form:** Parent organism (spawns child processes)
**Behavior:** Creates and manages Claude CLI sessions

**What it consumes:**
- Session start requests
- Working directories (cwd)
- Initial prompts
- MCP configuration

**What it produces:**
- Child processes (Claude CLI instances)
- Chat messages (aggregated from stream-json)
- claude-cli:started events
- claude-cli:output events (DEPRECATED)
- claude-cli:exited events

**What it needs to survive:**
- Node.js child_process API
- Claude CLI installed (`claude`)
- MCP server path (packages/mcp-server/dist/index.js)

**What kills it:**
- Session limit reached (5 max sessions)
- Invalid cwd (path traversal detected)
- Denied system directories (C:\Windows, /etc, etc.)
- Invalid flags (command injection detected)

**Symbiotic partners:**
- ClaudeCliSessionProcess — each session is a child organism
- ClaudeCliMessageAggregator — assembles streaming chunks into chat messages
- WebSocket broadcast — sends events to clients

**Lifecycle:**
- **Birth:** Singleton created on module load
- **Metabolism:** Spawns/stops Claude CLI sessions
- **Death:** `stopAllSessions()` on server shutdown

**Security organs (immune system):**
- Path validation (prevents symlink escapes)
- Path traversal detection
- System directory blacklist
- Flag whitelist (--debug, --mcp-config, etc.)
- Command injection prevention (regex check for `;` `&` `|` etc.)

**Temporal signature:**
- Session limit: 5 concurrent
- Session lifetime: Until exit or SIGTERM
- Spawn delay: ~500ms (child process startup)

---

### 1.9 The Message Assembler (Claude CLI Message Aggregator)

**Location:** `packages/backend/src/services/claudeCliMessageAggregator.ts`

**Life Form:** RNA assembler (builds messages from fragments)
**Behavior:** Buffers streaming chunks, emits complete messages

**What it consumes:**
- stream_event deltas (content_block_delta with text)
- result messages (with metadata)
- tool_use events

**What it produces:**
- ChatMessage objects (complete messages)
- chat:message events

**What it needs to survive:**
- Message callback function
- Accumulated content buffer
- Current message metadata

**What kills it:**
- dispose() called (flushes buffer, stops callback)
- Process exit

**Lifecycle:**
- **Birth:** Created per Claude CLI session
- **Metabolism:** appendChunk() → buffer → finalizeMessage() → callback
- **Death:** dispose() on session exit

**Temporal signature:**
- Buffer lifetime: Until finalizeMessage() called
- Finalization triggers: result message, message_stop event, error

---

### 1.10 The Harmony Watchdog (Harmony Detector)

**Location:** `packages/backend/src/services/harmonyDetector.ts`

**Life Form:** Quality control inspector
**Behavior:** Parses orchestrator output, checks contract compliance

**What it consumes:**
- Orchestrator output text
- Session ID + context (step number, chain ID)

**What it produces:**
- HarmonyCheck records
- harmony:check events (on significant change)
- harmony:violation events (on parse failure)
- harmony:metrics-updated events

**What it needs to survive:**
- CONTRACT.md parser functions (from @afw/shared)
- Storage layer for harmony checks
- Last harmony percentage cache

**What kills it:**
- Process exit

**Lifecycle:**
- **Birth:** `initializeHarmonyDetector(storage)` on server start
- **Metabolism:** `checkOutput(text, sessionId, context)` on each orchestrator message
- **Death:** Process exit (singleton lives forever)

**Quality grades:**
- **valid:** All fields parsed successfully
- **degraded:** Format recognized, some fields null
- **violation:** Format unrecognized, complete parse failure

**Temporal signature:**
- Check frequency: Per orchestrator output
- Significant change threshold: ±5% harmony percentage
- TTL: 7 days (same as events)

---

### 1.11 The React App Shell (Frontend Root)

**Location:** `packages/app/src/App.tsx`

**Life Form:** Exoskeleton (protective shell)
**Behavior:** Context provider hierarchy

**What it consumes:**
- Browser DOM mount point (#root)
- Context providers (7 layers)

**What it produces:**
- React component tree
- Global state providers

**Context layers (outermost to innermost):**
1. ThemeProvider
2. ToastProvider
3. WebSocketProvider (connects to ws://localhost:3001/ws)
4. WorkbenchProvider
5. NotificationGlowProvider
6. VimNavigationProvider
7. AppWithVim (CommandPalette + VimModeIndicator)

**Lifecycle:**
- **Birth:** ReactDOM.createRoot().render()
- **Metabolism:** React render cycles
- **Death:** Tab close / page reload

**Temporal signature:**
- Render frequency: On state change (React-driven)
- Re-render triggers: Context updates, prop changes

---

### 1.12 The WebSocket Client (Frontend Connection)

**Location:** `packages/app/src/hooks/useWebSocket.ts`

**Life Form:** Neural dendrite (receives signals)
**Behavior:** Auto-reconnecting WebSocket with heartbeat

**What it consumes:**
- WebSocket messages (JSON-encoded)
- Subscription requests
- User input

**What it produces:**
- Event callbacks to onEvent handler
- Connection status updates
- Ping messages (every 25 seconds)

**What it needs to survive:**
- WebSocket URL (ws://localhost:3001/ws)
- Heartbeat timeout (30 seconds)
- Reconnect interval (exponential backoff, max 30s)

**What kills it:**
- Server disconnection (auto-reconnects)
- Heartbeat timeout (closes and reconnects)
- Intentional close (useEffect cleanup)

**Lifecycle:**
- **Birth:** useEffect on mount, connect() called
- **Metabolism:** Message routing based on subscription state
- **Death:** useEffect cleanup, intentionalCloseRef.current = true

**Temporal signature:**
- Ping interval: 25 seconds
- Heartbeat timeout: 30 seconds
- Reconnect backoff: min 3s, max 30s (exponential)

**Subscription filter:** Only processes events for subscribed sessions + session lifecycle events

---

### 1.13 The Chat Panel (Message Display)

**Location:** `packages/app/src/components/SessionPanel/ChatPanel.tsx`

**Life Form:** Information display organism
**Behavior:** Mobile-format chat window with context-aware buttons

**What it consumes:**
- ChatMessage array (from useChatMessages hook)
- Session object (for context-aware buttons)
- User input (textarea)

**What it produces:**
- Message bubbles (user/assistant/system)
- Prompt button clicks
- Input WebSocket messages

**What it needs to survive:**
- SessionId to subscribe to
- WebSocket connection
- Claude CLI session running

**Lifecycle:**
- **Birth:** Mounted in SessionPanel
- **Metabolism:** Auto-scroll on new messages
- **Death:** Unmount (panel closed)

**Temporal signature:**
- Auto-scroll: Smooth, on message arrival
- Typing indicator: Active during streaming (not implemented yet)

---

### 1.14 The Chain DAG (Execution Graph Visualizer)

**Location:** `packages/app/src/components/ChainDAG/ChainDAG.tsx`

**Life Form:** Neural network visualizer
**Behavior:** Renders chain as DAG with ReactFlow

**What it consumes:**
- Chain object (steps, dependencies)
- Parallel group detection

**What it produces:**
- ReactFlow nodes (StepNode components)
- Edges (dependency arrows)
- Step selection events

**Lifecycle:**
- **Birth:** Mounted when chain selected
- **Metabolism:** Re-layout on chain changes
- **Death:** Unmount (chain deselected)

**Temporal signature:**
- Re-layout: On chain.steps change (React memo)
- Fit view: On mount + chain ID change

---

### 1.15 The Flow Visualization (Swimlane Renderer)

**Location:** `packages/app/src/components/FlowVisualization/FlowVisualization.tsx`

**Life Form:** Process flow mapper
**Behavior:** Swimlane-based chain visualization with animations

**What it consumes:**
- Chain object
- Swimlane assignments (computed)

**What it produces:**
- AnimatedStepNode components
- AnimatedFlowEdge components
- SwimlaneBackground

**Animation states:**
- **pending:** slide-in
- **in_progress:** pulse
- **completed:** shrink
- **failed:** shake

**Lifecycle:**
- **Birth:** Mounted in session window
- **Metabolism:** Animation state changes on step status changes
- **Death:** Unmount

**Temporal signature:**
- Auto-fit view: 100ms delay on chain ID change
- Animation duration: CSS-controlled (0.3s typical)

---

### 1.16 The Type System (Branded Types)

**Location:** `packages/shared/src/types.ts`

**Life Form:** DNA/genetic code
**Behavior:** Enforces type safety at compile time

**What it consumes:**
- Raw strings and numbers
- Validation rules

**What it produces:**
- Branded types (SessionId, ChainId, StepId, UserId, Timestamp, DurationMs)
- Runtime validation errors

**What kills it:**
- TypeScript compilation failure (if types are wrong)

**Lifecycle:**
- **Birth:** TypeScript compilation
- **Metabolism:** Compile-time type checking
- **Death:** Never (exists only at compile time)

---

### 1.17 The Event System (Event Definitions)

**Location:** `packages/shared/src/events.ts`

**Life Form:** Chemical signaling system
**Behavior:** Discriminated unions for type-safe event handling

**Event families:**
- Session lifecycle (started, ended)
- Chain lifecycle (compiled, started, completed)
- Step execution (spawned, started, completed, failed, skipped)
- File changes (created, modified, deleted)
- Registry updates
- Claude CLI lifecycle
- Chat messages
- Harmony checks

**Temporal signature:**
- Event creation: On state changes
- Event lifetime: TTL-based (24h for most, 7d for harmony)

---

## 2. The Resources (Data as Living Material)

### 2.1 Data Birth (Creation Events)

**Primary birth locations:**
1. **HTTP POST requests** → New sessions, commands, user actions
2. **WebSocket 'input' messages** → User input, chat messages
3. **File watcher events** → file:created, file:modified
4. **Claude CLI stdout** → Orchestrator output, chat messages
5. **Timer-based events** → Heartbeats, cleanup triggers
6. **React component state** → UI interactions, form submissions

**Birth metadata:**
- Timestamp (ISO 8601)
- Session ID (mandatory for session-scoped data)
- Event type (discriminated union)

---

### 2.2 Data Flow (Propagation Paths)

**Flow 1: User Input → Claude CLI**
```
ChatPanel (React)
  → useWebSocket.send({ type: 'input' })
  → WebSocket handler
  → ClaudeCliManager.getSession(sessionId)
  → ClaudeCliSession.sendInput(text)
  → stdin of Claude CLI process
```

**Flow 2: Claude CLI Output → Frontend**
```
Claude CLI stdout (stream-json)
  → ClaudeCliSession 'raw-json' event
  → ClaudeCliMessageAggregator.appendChunk()
  → ClaudeCliMessageAggregator.finalizeMessage()
  → ChatMessage created
  → storage.addChatMessage()
  → Broadcast chat:message event via WebSocket
  → Frontend ChatPanel receives event
  → useChatMessages adds to state
  → React re-renders message bubble
```

**Flow 3: File Change → Dashboard**
```
Developer edits file in VS Code
  → OS file system event
  → Chokidar watcher detects change
  → fileWatcher.handleFileChange() (300ms debounce)
  → file:modified event created
  → storage.addEvent()
  → Broadcast via WebSocket
  → Frontend receives event
  → FileExplorer updates (if open)
```

**Flow 4: Session Creation → Storage → Frontend**
```
POST /api/sessions
  → sessions router
  → storage.setSession()
  → session:started event
  → Broadcast via WebSocket
  → All connected clients receive
  → SessionList updates
```

---

### 2.3 Data Aging (Staleness)

**Fresh data (< 1 minute old):**
- WebSocket ping/pong (25s interval)
- Chat messages (real-time streaming)
- File watcher events (300ms debounce)

**Recently fresh (1-60 minutes):**
- Session status (in_progress sessions)
- Chain execution state
- Harmony checks

**Aging data (1-24 hours):**
- Completed sessions (TTL countdown begins)
- Cached frequency records
- Dossier suggestions

**Decayed data (> 24 hours):**
- Expired sessions (evicted from memory, Redis TTL expired)
- Old file persistence folders (7-day cleanup)

**Fossils (historical, read-only):**
- Log files (actionflows/logs/*)
- Git history
- Archived dossiers

---

### 2.4 Data Death (Eviction and Cleanup)

**Death mechanisms:**

1. **FIFO eviction (MemoryStorage):**
   - Events: 10K per session → oldest dropped
   - Chains: 100 per session → oldest dropped
   - Sessions: 1K total → oldest completed evicted
   - Chat messages: 1K per session → oldest dropped

2. **TTL expiration (RedisStorage):**
   - Sessions: 24 hours
   - Events: 24 hours
   - Commands: 5 minutes
   - Input queue: 5 minutes
   - Harmony checks: 7 days
   - Bookmarks/Patterns: 30 days

3. **Explicit deletion:**
   - stopWatching(sessionId) → clears debounce timeouts
   - deleteSession(sessionId) → removes all session data
   - DELETE /api/dossiers/:id → removes dossier

4. **Cleanup service:**
   - Daily sweep of file-persistence storage
   - Removes date folders older than 7 days

5. **Process exit:**
   - MemoryStorage → complete amnesia
   - RedisStorage → persists (survives restart)

---

## 3. The Temporal Systems (Time in This Universe)

### 3.1 Heartbeats (Recurring Timers)

**Server-side heartbeats:**
- **WebSocket pong:** 20 seconds (server → all clients)
  - Purpose: Keep connections alive, detect stale clients
  - Location: `packages/backend/src/index.ts` line 116-133

**Client-side heartbeats:**
- **WebSocket ping:** 25 seconds (client → server)
  - Purpose: Detect stale connections, trigger server response
  - Location: `packages/app/src/hooks/useWebSocket.ts` line 149-153

**Cleanup heartbeats:**
- **Daily cleanup:** 24 hours (on start, then every 24h)
  - Purpose: Remove old history files
  - Location: `packages/backend/src/services/cleanup.ts` line 13

---

### 3.2 Reflexes (Immediate Reactions)

**Microsecond scale (<1ms):**
- TypeScript type checking (compile-time)
- Branded type validation (runtime check)

**Millisecond scale (1-10ms):**
- HTTP route handlers (Express)
- WebSocket message parsing
- Redis read operations
- React render cycles

**Decisecond scale (10-100ms):**
- File watcher stability threshold (100ms)
- Network round-trip time (local)

**Centisecond scale (100-300ms):**
- File watcher debounce delay (300ms)
- React animation durations (CSS)

---

### 3.3 Seasons (Longer Cycles)

**Minute-scale cycles:**
- Command queue expiration (5 minutes)
- Input queue expiration (5 minutes)
- Reconnection attempts (exponential backoff, max 30s)

**Hour-scale cycles:**
- Session duration (typical: 10 minutes to 2 hours)
- Chain execution (typical: 5-60 minutes)

**Day-scale cycles:**
- Session TTL (24 hours)
- Event TTL (24 hours)
- Cleanup service (daily sweep)

**Week-scale cycles:**
- Harmony check retention (7 days)
- File persistence retention (7 days)

**Month-scale cycles:**
- Frequency tracking (30 days)
- Bookmark/Pattern retention (30 days)

---

### 3.4 The Smallest Unit of Time

**Event loop tick:** ~1ms (Node.js)
- Basis for all async operations
- setTimeout(fn, 0) still takes ~1ms

**React render cycle:** 16.67ms (60 FPS target)
- requestAnimationFrame callbacks
- React concurrent mode can interrupt

**WebSocket frame arrival:** <1ms (local network)
- Limited by TCP window size, not time

**File system event propagation:** <10ms (OS-dependent)
- Chokidar polls or uses native watchers

---

### 3.5 The Largest Unit of Time

**Process uptime:** Unlimited (until restart)
- Longest observed uptime: Unknown (depends on deployment)
- MemoryStorage: Lives as long as process
- RedisStorage: Independent of process uptime

**Session lifetime (theoretical max):** 24 hours (Redis TTL)
- Practical max: ~4 hours (human attention span)

**Project lifetime:** Months to years
- Git history: Since project inception
- ActionFlows logs: 7 days (rolling window)

---

## 4. Alignment with the Outside Universe

### 4.1 Wall-Clock Time

**Where the system uses wall-clock time:**
- Timestamp generation: `new Date().toISOString()` (ISO 8601)
- Session startedAt/endedAt fields
- Event timestamps
- File watcher change detection
- Cleanup service triggers (daily at current time + 24h)

**Where wall-clock time is CRITICAL:**
- Session TTL expiration (Redis)
- Cleanup service (must run at specific intervals)
- Heartbeat timing (absolute, not relative)

---

### 4.2 Event-Driven Time (Internal Clock)

**Where the system operates in its own time:**
- React render cycles (driven by state changes, not clock)
- WebSocket message processing (driven by arrival, not time)
- File watcher events (driven by OS notifications)
- Chain step execution (driven by completion, not duration)

**Event ordering:**
- WebSocket events: Arrival order (no guaranteed ordering across sessions)
- Redis Pub/Sub: Delivery order (best-effort, no strict ordering)
- File watcher: Debounced, so rapid changes collapse into one event

---

### 4.3 Temporal Drift Issues

**Stale session detection:**
- Heartbeat timeout: 30 seconds
- If no pong received, connection assumed stale → close and reconnect

**Out-of-order events:**
- WebSocket: Arrival order may not match emission order (especially under load)
- Redis Pub/Sub: No ordering guarantees across different publishers

**Clock skew (multi-instance):**
- Redis storage: All timestamps are ISO strings, no clock sync assumed
- If server clocks differ, TTLs may expire at slightly different times

**Race conditions:**
- Session creation + immediate subscription → may miss early events
- Solution: Send chat history on subscribe (replay)

---

### 4.4 How the System Perceives "Now"

**Backend:**
- `Date.now()` for timestamps (milliseconds since Unix epoch)
- `new Date().toISOString()` for ISO 8601 strings
- `brandedTypes.currentTimestamp()` for typed timestamps

**Frontend:**
- `Date.now()` for relative time calculations
- `new Date(timestamp)` for parsing server timestamps
- `performance.now()` for high-precision measurements (not used in codebase)

**Consistency:**
- All timestamps use ISO 8601 format (UTC timezone)
- No timezone conversions needed (always UTC)

---

## 5. Ecosystem Dynamics

### 5.1 Food Chains (Who Feeds Whom)

**Chain 1: User Input → Claude CLI → Frontend**
```
User types in ChatPanel
  → WebSocket handler consumes input
  → Claude CLI consumes input via stdin
  → Claude produces output via stdout
  → ClaudeCliMessageAggregator consumes stream-json
  → ChatMessage produced
  → Storage consumes ChatMessage
  → WebSocket handler broadcasts event
  → Frontend consumes event
  → ChatPanel displays message
```

**Chain 2: File Change → File Watcher → Frontend**
```
Developer modifies file
  → OS produces file system event
  → Chokidar consumes event
  → File watcher produces file:modified event
  → Storage consumes event
  → WebSocket handler broadcasts event
  → Frontend consumes event
  → FileExplorer updates
```

**Chain 3: Session Creation → Storage → Multiple Consumers**
```
POST /api/sessions
  → Sessions router produces Session object
  → Storage consumes Session
  → WebSocket handler broadcasts session:started
  → Multiple consumers:
    - SessionList (updates UI)
    - HarmonyPanel (starts tracking)
    - FileWatcher (starts watching cwd)
```

---

### 5.2 Apex Predators (Consume Everything)

**1. Storage Layer (MemoryStorage / RedisStorage)**
- Consumes: ALL events, sessions, chains, commands, input, chat, bookmarks, patterns, harmony, dossiers
- Produces: Read responses (but no spontaneous output)
- Role: Central data repository

**2. WebSocket Handler**
- Consumes: ALL WebSocket messages
- Produces: Broadcast events to ALL subscribed clients
- Role: Message router

**3. Express Server**
- Consumes: ALL HTTP requests, WebSocket upgrades
- Produces: HTTP responses, WebSocket connections
- Role: Entry point for all external communication

**4. ClaudeCliManager**
- Consumes: Session start requests, all Claude CLI output
- Produces: Chat messages, Claude CLI events
- Role: Process lifecycle manager

---

### 5.3 Decomposers (Clean Up After Others)

**1. Cleanup Service**
- Consumes: Old date folders in file-persistence storage
- Produces: Deletion logs, freed disk space
- Role: Garbage collection

**2. FIFO Eviction (MemoryStorage)**
- Consumes: Oldest sessions/events when limits reached
- Produces: Memory space for new data
- Role: Automatic memory management

**3. Redis TTL Expiration**
- Consumes: Expired keys (automatic)
- Produces: Freed Redis memory
- Role: Time-based garbage collection

---

### 5.4 Parasites (Consume Without Contributing)

**Potential parasites (none confirmed):**
- Rate-limited clients (consume WebSocket bandwidth without valid messages)
- Memory leaks (consume heap without releasing)
- Unbounded event listeners (consume event loop cycles)

**Anti-parasite defenses:**
- Rate limiting: 50 messages/second per client
- Max client limit: 1000 connections
- FIFO eviction: Prevents unbounded memory growth
- Session limit: 5 max Claude CLI sessions

---

### 5.5 Cascading Failures

**Scenario 1: Storage dies**
- MemoryStorage death → Process restart required (complete data loss)
- RedisStorage death → Server continues with stale data, writes fail

**Scenario 2: WebSocket server dies**
- All clients disconnect
- Express server still runs (HTTP still works)
- No real-time updates

**Scenario 3: File watcher dies**
- File changes still happen
- Dashboard no longer sees them in real-time
- No impact on Claude CLI

**Scenario 4: Claude CLI session crashes**
- Session removed from manager
- Aggregator disposed (flushes buffer)
- Storage updated with failed status
- Frontend receives claude-cli:exited event

---

### 5.6 Independence Analysis (Can Any Organism Survive Alone?)

**Fully dependent (cannot survive alone):**
- WebSocket handler (needs Express server)
- File watcher (needs WebSocket handler to broadcast)
- ClaudeCliMessageAggregator (needs ClaudeCliManager)

**Semi-independent (can function in isolation):**
- Storage layer (can store/retrieve without broadcasting)
- Cleanup service (can run standalone)
- Harmony detector (can check without broadcasting)

**Fully independent (can run alone):**
- Type system (compile-time, no runtime dependencies)
- Event definitions (just TypeScript interfaces)

**Conclusion:** No organism can truly survive alone. The system is a **deeply interdependent web**.

---

## 6. Universe Laws (Invariants and Physics)

### 6.1 Laws of Physics (Type System)

**Law 1: Type Safety**
- Branded types prevent accidental ID mixing
- SessionId ≠ ChainId ≠ UserId (compile-time enforcement)

**Law 2: Causality**
- Events have timestamps (ISO 8601)
- Earlier timestamp → earlier event (logical ordering)

**Law 3: Conservation of Sessions**
- Session IDs are unique (generated once)
- Sessions can be created, read, updated, but not duplicated

**Law 4: Graceful Degradation**
- Null-safe parsed fields (events can be partially parsed)
- Missing fields → degraded harmony, not crash

---

### 6.2 Constants (Immutable Values)

**Backend constants:**
- PORT: 3001 (default, env-configurable)
- HEARTBEAT_INTERVAL_MS: 20000
- MAX_SESSIONS: 1000
- MAX_EVENTS_PER_SESSION: 10000
- MAX_CHAINS_PER_SESSION: 100
- MAX_INPUT_QUEUE_PER_SESSION: 100
- DEBOUNCE_DELAY_MS: 300

**Frontend constants:**
- WebSocket URL: ws://localhost:3001/ws
- Reconnect interval: 3000ms
- Heartbeat timeout: 30000ms
- Ping interval: 25000ms

**Redis constants:**
- SESSION_TTL: 86400 (24 hours in seconds)
- EVENT_TTL: 86400
- COMMAND_TTL: 300 (5 minutes)

---

### 6.3 Type-Enforced Impossibilities

**Cannot happen (compile-time prevention):**
- Passing SessionId where ChainId expected
- Passing number where StepNumber expected (must be >= 1)
- Creating Timestamp from invalid Date

**Cannot happen (runtime validation):**
- Empty SessionId/ChainId/UserId
- StepNumber < 1
- Invalid ISO 8601 timestamp

**Cannot happen (capacity limits):**
- More than 1000 total sessions (MemoryStorage)
- More than 1000 WebSocket clients
- More than 5 Claude CLI sessions
- More than 10,000 events per session

---

### 6.4 Black Holes (Data Enters, Never Leaves)

**Black Hole 1: Console.log()**
- Location: All console.log/error/warn calls
- Data enters: Log messages
- Data exits: Never (goes to stdout/stderr, not stored)

**Black Hole 2: Error swallowing**
- Location: try/catch blocks without re-throw
- Example: `packages/backend/src/services/fileWatcher.ts` line 266-268
  - Broadcasts event, catches error, continues (error logged but not propagated)

**Black Hole 3: Rate-limited messages**
- Location: ClientRegistry.checkRateLimit()
- Data enters: Excess messages (> 50/second)
- Data exits: Never (dropped silently after error response)

---

## 7. Special Observations

### 7.1 The System's Immune System

**Defense mechanisms:**

1. **Rate limiting** (50 msg/sec per client)
2. **Max capacity** (1000 clients, 5 CLI sessions)
3. **API key validation** (per-message check)
4. **Session ownership checks** (user-specific sessions)
5. **Path traversal detection** (cwd validation)
6. **Command injection prevention** (flag whitelist)
7. **CORS whitelist** (origin validation)
8. **Body size limit** (1MB max)
9. **FIFO eviction** (prevents memory exhaustion)
10. **TTL expiration** (automatic cleanup)

---

### 7.2 The System's Nervous System

**Signal pathways:**
- HTTP → Express → Router → Storage → WebSocket → Frontend
- WebSocket → Handler → Storage → Broadcast → Frontend
- File System → Chokidar → FileWatcher → Storage → WebSocket → Frontend
- Claude CLI → stdout → Aggregator → Storage → WebSocket → Frontend

**Reflex arcs (no central processing):**
- Ping → Pong (WebSocket handler)
- Rate limit exceeded → Error response (ClientRegistry)
- Heartbeat timeout → Close connection (useWebSocket hook)

---

### 7.3 The System's Memory

**Short-term memory (MemoryStorage):**
- Volatile, fast, bounded
- Lives as long as process
- FIFO eviction on overflow

**Long-term memory (RedisStorage):**
- Persistent, slower, TTL-based
- Survives process restarts
- Pub/Sub for multi-instance coordination

**Muscle memory (Type System):**
- Compile-time enforcement
- No runtime overhead
- Cannot be forgotten

**Procedural memory (Event Handlers):**
- Event loop callbacks
- Always respond the same way
- Cannot be modified at runtime

---

## 8. Conclusion: The Universe as a Whole

The ActionFlows Dashboard is a **distributed, event-driven, real-time monitoring system** that behaves like a **living organism**:

- **Cellular structure:** 31+ components with distinct functions
- **Circulatory system:** WebSocket network for event distribution
- **Nervous system:** HTTP/WS handlers for signal routing
- **Memory:** Dual-layer storage (volatile + persistent)
- **Immune system:** Rate limiting, auth, capacity controls
- **Metabolism:** Continuous data processing (event loop)
- **Reproduction:** Spawning child processes (Claude CLI)
- **Death:** Graceful shutdown, cleanup, TTL expiration

**Key survival mechanisms:**
- Auto-reconnection (WebSocket client)
- Graceful degradation (null-safe parsing)
- FIFO eviction (memory protection)
- TTL expiration (automatic cleanup)
- Exponential backoff (reconnection strategy)

**Key symbiotic relationships:**
- Express ↔ WebSocketServer (cannot exist without each other)
- ClientRegistry ↔ WebSocket handler (tracks all connections)
- ClaudeCliManager ↔ ClaudeCliMessageAggregator (parent-child)
- Storage ↔ All services (central data hub)

**Temporal hierarchy:**
- Microseconds: Type checking
- Milliseconds: HTTP/WS, Redis, React renders
- Seconds: Heartbeats, reconnections
- Minutes: Command/input TTL
- Hours: Session execution
- Days: Event TTL, cleanup cycles
- Weeks: Harmony retention

**This is not just code. This is a living, breathing universe.**

---

## Appendix: File Inventory

**Total TypeScript files:** 6319

**Key directories:**
- `packages/backend/src/` — Server-side organisms
- `packages/app/src/` — Client-side organisms
- `packages/shared/src/` — Genetic code (types, events)
- `packages/mcp-server/src/` — MCP protocol adapter
- `packages/hooks/` — Hook scripts (external lifecycle events)

**Key files:**
- `packages/backend/src/index.ts` — Nerve center (Express + WebSocket)
- `packages/backend/src/ws/handler.ts` — Circulatory system
- `packages/backend/src/storage/memory.ts` — Short-term memory
- `packages/backend/src/storage/redis.ts` — Long-term memory
- `packages/backend/src/services/claudeCliManager.ts` — Process shepherd
- `packages/backend/src/services/fileWatcher.ts` — File sentinel
- `packages/backend/src/services/harmonyDetector.ts` — Quality watchdog
- `packages/app/src/hooks/useWebSocket.ts` — Frontend neural dendrite
- `packages/app/src/components/SessionPanel/ChatPanel.tsx` — Chat interface
- `packages/shared/src/types.ts` — Genetic code (branded types)
- `packages/shared/src/events.ts` — Chemical signaling system

---

**End of Living Universe Analysis**
