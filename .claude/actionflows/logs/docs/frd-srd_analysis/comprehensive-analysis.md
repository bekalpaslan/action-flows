# ActionFlows Dashboard - Comprehensive Project Analysis

**Analysis Date:** 2026-02-08
**Scope:** All packages (backend, frontend, shared, mcp-server, hooks)
**Mode:** Identify improvements
**Purpose:** Feed into FRD and SRD documentation

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Package Inventory](#2-package-inventory)
3. [Backend Analysis](#3-backend-analysis)
4. [Frontend Analysis](#4-frontend-analysis)
5. [Shared Package Analysis](#5-shared-package-analysis)
6. [MCP Server Analysis](#6-mcp-server-analysis)
7. [Hooks Package Analysis](#7-hooks-package-analysis)
8. [Cross-Package Dependencies](#8-cross-package-dependencies)
9. [API Endpoint Inventory](#9-api-endpoint-inventory)
10. [Event System Inventory](#10-event-system-inventory)
11. [Improvement Areas](#11-improvement-areas)
12. [Security Analysis](#12-security-analysis)
13. [Performance Considerations](#13-performance-considerations)
14. [Architecture Gaps](#14-architecture-gaps)

---

## 1. Executive Summary

ActionFlows Dashboard is a real-time monitoring and control dashboard for AI agent orchestration flows. It is structured as a **pnpm monorepo** with **5 packages** totaling approximately **36 backend source files**, **85+ frontend source files**, **7 shared type files**, **1 MCP server file**, and **11 hook source files**.

**Core value proposition:** Enables operators to observe, control, and interact with Claude Code sessions in real-time via a web/desktop interface, with features including:
- Session lifecycle tracking
- Chain/step DAG visualization
- File system monitoring with step attribution
- Claude CLI subprocess management
- Terminal output streaming
- Bidirectional input/command flow (dashboard <-> hooks)
- Session discovery from external IDE lock files
- Project registry for persistent configuration

---

## 2. Package Inventory

| Package | Name | Version | Source Files | Dependencies | Description |
|---------|------|---------|-------------|--------------|-------------|
| Backend | @afw/backend | 0.0.1 | 36 .ts files | 7 runtime, 7 dev | Express API + WebSocket server |
| Frontend | @afw/app | 0.1.0 | 85+ .tsx/.ts files | 9 runtime, 7 dev | React + Vite + Electron desktop app |
| Shared | @afw/shared | 0.0.1 | 7 .ts files | 0 runtime, 1 dev | TypeScript types and branded strings |
| MCP Server | @afw/mcp-server | 0.1.0 | 1 .ts file | 3 runtime, 2 dev | MCP protocol server for command polling |
| Hooks | @afw/hooks | 0.0.1 | 11 source .ts files | 1 runtime, 2 dev | Claude Code hook scripts |

---

## 3. Backend Analysis

### 3.1 Architecture

```
packages/backend/src/
  index.ts              -- Server entry point (Express + WS + graceful shutdown)
  types.ts              -- Backend-specific types
  routes/
    sessions.ts         -- Session CRUD + input queue + awaiting state
    events.ts           -- Event ingestion + retrieval
    commands.ts         -- Command queue + acknowledgment
    history.ts          -- File-based history persistence
    files.ts            -- File tree, read, write, diff
    terminal.ts         -- Terminal output buffer
    claudeCli.ts        -- Claude CLI session management
    sessionWindows.ts   -- Session window follow/config
    projects.ts         -- Project registry CRUD
    discovery.ts        -- Claude session discovery
    users.ts            -- User listing with sessions
  storage/
    index.ts            -- Storage factory (Memory/Redis selection)
    memory.ts           -- In-memory storage with eviction
    redis.ts            -- Redis storage with pub/sub
    file-persistence.ts -- File-based JSON session history
  ws/
    handler.ts          -- WebSocket message handler
    clientRegistry.ts   -- Client tracking with subscriptions + rate limiting
  services/
    cleanup.ts          -- Daily cleanup job
    fileWatcher.ts      -- chokidar-based file watching with debounce
    terminalBuffer.ts   -- In-memory terminal output buffer
    claudeCliManager.ts -- Claude CLI subprocess manager
    claudeCliSession.ts -- Single Claude CLI process wrapper
    claudeSessionDiscovery.ts -- IDE lock file scanner
    projectDetector.ts  -- Project metadata auto-detection
    projectStorage.ts   -- File-based project persistence
  middleware/
    auth.ts             -- API key authentication
    rateLimit.ts        -- Rate limiting (general, write, session-create)
    validate.ts         -- Zod schema validation
    validatePath.ts     -- File path traversal prevention
    errorHandler.ts     -- Error sanitization + global handler
  schemas/
    api.ts              -- Zod schemas for all REST endpoints
    ws.ts               -- Zod schemas for WebSocket messages
  __tests__/
    integration.test.ts -- Integration tests
    helpers.ts          -- Test helpers
```

### 3.2 Route Summary

| Route File | Base Path | Endpoints | Purpose |
|-----------|-----------|-----------|---------|
| sessions.ts | /api/sessions | 8 (POST, GET list, GET :id, PUT :id, GET chains, POST input, POST awaiting, GET input) | Session lifecycle management |
| events.ts | /api/events | 3 (POST, GET :sessionId, GET recent) | Event ingestion and retrieval |
| commands.ts | /api/commands | 3 (POST :id/commands, GET :id/commands, POST :commandId/ack) | Command queue management |
| history.ts | /api/history | 4 (GET dates, GET sessions/:date, GET session/:sessionId, GET stats, POST cleanup) | Persistent session history |
| files.ts | /api/files | 4 (GET tree, GET read, POST write, GET diff) | File system access |
| terminal.ts | /api/terminal | 3 (POST output, GET buffer, DELETE buffer) | Terminal output |
| claudeCli.ts | /api/claude-cli | 5 (POST start, POST input, POST stop, GET status, GET sessions) | Claude CLI management |
| sessionWindows.ts | /api/session-windows | 5 (GET list, GET enriched, POST follow, DELETE follow, PUT config) | Session window UI state |
| projects.ts | /api/projects | 5 (GET list, POST detect, GET :id, POST create, PUT :id, DELETE :id) | Project registry |
| discovery.ts | /api/discovery | 1 (GET sessions) | External session discovery |
| users.ts | /api/users | 2 (GET list, GET :userId/sessions) | User management |

**Total: 43 API endpoints**

### 3.3 Storage Architecture

Two storage backends with a unified interface:

**Memory Storage (MemoryStorage):**
- In-process Maps and Sets
- Eviction: 10K events/session, 100 chains/session, 1K total sessions, 100 input queue items
- User-session tracking (sessionsByUser Map)
- Session window state (followedSessions Set, sessionWindowConfigs Map)

**Redis Storage (RedisStorage):**
- TTL-based: Sessions 24h, Events 24h, Commands 5min, Input 5min
- Pub/Sub for multi-instance event broadcasting
- Session window state via Redis Sets and String keys
- Local in-memory client registry (per-instance)

**File Persistence (FilePersistence):**
- JSON files organized by date: `data/history/YYYY-MM-DD/<sessionId>.json`
- 7-day retention with daily cleanup

**Project Storage (ProjectStorage):**
- Single JSON file: `%APPDATA%/actionflows/projects.json` (Windows) or `~/.actionflows/projects.json`
- Atomic writes via temp file + rename
- Mutex-serialized writes

### 3.4 Services

| Service | File | Purpose | Singleton |
|---------|------|---------|-----------|
| CleanupService | cleanup.ts | Daily history cleanup (7-day retention) | Yes |
| FileWatcher | fileWatcher.ts | chokidar-based directory monitoring with step attribution | Module-level state |
| TerminalBufferService | terminalBuffer.ts | In-memory terminal output (50K lines/session) | Yes |
| ClaudeCliManager | claudeCliManager.ts | Multi-session Claude CLI subprocess orchestration (max 5) | Yes |
| ClaudeCliSessionProcess | claudeCliSession.ts | Single subprocess wrapper with stdio piping | No |
| ClaudeSessionDiscovery | claudeSessionDiscovery.ts | IDE lock file scanning + JSONL enrichment | Yes |
| ProjectDetector | projectDetector.ts | Project metadata auto-detection | Static class |
| ProjectStorage | projectStorage.ts | File-based project JSON persistence | Yes |

### 3.5 Middleware Stack

Applied in order:
1. **CORS** - Whitelist-based with configurable origins
2. **Body Parser** - JSON with 1MB limit
3. **Auth** - API key from header/query (optional in dev)
4. **General Rate Limit** - 1000 req/15min on /api/*
5. **Per-Route Rate Limits** - Write (30/15min), Session Create (10/15min)
6. **Zod Validation** - Per-route schema validation
7. **Path Validation** - Directory traversal prevention for file routes
8. **Global Error Handler** - Catch-all with sanitized responses

---

## 4. Frontend Analysis

### 4.1 Architecture

```
packages/app/src/
  main.tsx              -- Vite entry point
  App.tsx               -- Root component (WebSocket provider)
  App.css               -- Global styles
  monaco-config.ts      -- Monaco editor configuration
  components/
    AppContent.tsx       -- Main layout with header, sidebar, session panels
    WebSocketTest.tsx    -- WebSocket connection test component
    NotificationManager.tsx -- Browser notification manager
    HistoryBrowser.tsx   -- Historical session browser
    ChainDemo.tsx        -- Chain visualization demo
    ChainLiveMonitor.tsx -- Live chain monitoring
    ChainBadge/          -- Chain type badge component
    ChainDAG/            -- Chain DAG visualization (ReactFlow)
      ChainDAG.tsx       -- Main DAG component
      StepNode.tsx       -- Custom ReactFlow node
      layout.ts          -- Dagre-based auto-layout
    StepInspector/       -- Step detail inspector
    SessionTree/         -- Session tree navigator
    UserSidebar/         -- User list with sessions
    SessionPane/         -- Individual session pane
    SplitPaneLayout/     -- Multi-session split view
    ConversationPanel/   -- Chat-style conversation UI
    ControlButtons/      -- Pause/Resume/Cancel buttons
    FileExplorer/        -- File tree browser
      FileExplorer.tsx   -- Main explorer component
      FileTree.tsx       -- Recursive tree renderer
      FileIcon.tsx       -- File type icon mapper
    CodeEditor/          -- Monaco-based code editor
      CodeEditor.tsx     -- Main editor component
      EditorTabs.tsx     -- Tab bar for multiple files
      DiffView.tsx       -- Side-by-side diff viewer
      ConflictDialog.tsx -- File conflict resolution dialog
    Terminal/            -- Terminal output viewer
      TerminalPanel.tsx  -- xterm.js terminal
      TerminalTabs.tsx   -- Multi-session terminal tabs
    Toast/               -- Toast notification component
    ClaudeCliTerminal/   -- Claude CLI management
      ClaudeCliTerminal.tsx    -- CLI terminal interface
      ClaudeCliStartDialog.tsx -- Session start dialog
      DiscoveredSessionsList.tsx -- External session list
      ProjectSelector.tsx      -- Project picker
      ProjectForm.tsx          -- Project create/edit form
    SessionWindowSidebar/  -- Session window mode sidebar
      SessionWindowSidebar.tsx -- Main sidebar
      UserGroup.tsx            -- User group with sessions
      SessionItem.tsx          -- Individual session item
    SessionWindowGrid/     -- Session window grid
      SessionWindowGrid.tsx  -- Grid layout
      SessionWindowTile.tsx  -- Individual session tile
    FlowVisualization/     -- Enhanced flow visualization
      FlowVisualization.tsx    -- Main flow component
      AnimatedStepNode.tsx     -- Animated step nodes
      AnimatedFlowEdge.tsx     -- Animated edges
      SwimlaneBackground.tsx   -- Swimlane background
    QuickActionBar/        -- Quick action buttons
      QuickActionBar.tsx       -- Action bar
      QuickActionButton.tsx    -- Individual button
    SessionArchive/        -- Ended session archive
      SessionArchive.tsx       -- Archive viewer
    Settings/              -- Settings panels
      QuickActionSettings.tsx  -- Quick action configuration
  hooks/
    index.ts              -- Hook exports barrel
    useWebSocket.ts       -- WebSocket connection management
    useEvents.ts          -- Event stream subscription
    useChainEvents.ts     -- Chain-specific event filtering
    useChainState.ts      -- Chain state reconstruction from events
    useSessionControls.ts -- Pause/Resume/Cancel controls
    useSessionInput.ts    -- Input sending to sessions
    useNotifications.ts   -- Browser notification management
    useEditorFiles.ts     -- File content management
    useFileSyncManager.ts -- File change detection + conflict resolution
    useTerminalEvents.ts  -- Terminal output processing
    useFileTree.ts        -- File tree data fetching
    useKeyboardShortcuts.ts -- Global keyboard shortcuts
    useSessionWindows.ts  -- Session window follow/unfollow
    useFlowAnimations.ts  -- Flow visualization animation timing
    useStreamJsonEnrichment.ts -- JSON stream parsing for enrichment
    useSessionArchive.ts  -- Session archive lifecycle
    useClaudeCliControl.ts -- Claude CLI start/stop/input
    useClaudeCliSessions.ts -- Claude CLI session list
    useProjects.ts        -- Project registry CRUD hooks
    useDiscoveredSessions.ts -- External session discovery
    useUsers.ts           -- User data hooks
    useUserSessions.ts    -- Per-user session data
    useAllSessions.ts     -- All session aggregation
    useAttachedSessions.ts -- Attached session management
  contexts/
    index.ts              -- Context exports
    WebSocketContext.tsx   -- WebSocket connection provider
  services/
    claudeCliService.ts   -- Claude CLI HTTP service layer
    projectService.ts     -- Project registry HTTP service layer
  utils/
    chainTypeDetection.ts -- Chain type detection from events
    streamJsonParser.ts   -- JSON stream parser for enrichment
    sessionLifecycle.ts   -- Session lifecycle state machine
    swimlaneLayout.ts     -- Swimlane layout algorithm
    contextPatternMatcher.ts -- Context pattern matching for quick actions
  data/
    sampleChain.ts        -- Sample chain data for demos
```

### 4.2 Key Frontend Features

| Feature | Components | Hooks | Status |
|---------|-----------|-------|--------|
| WebSocket Connection | WebSocketContext, WebSocketTest | useWebSocket | Implemented |
| Session Monitoring | AppContent, UserSidebar, SessionPane | useUsers, useAllSessions, useAttachedSessions | Implemented |
| Chain DAG Visualization | ChainDAG, StepNode | useChainEvents, useChainState | Implemented |
| Flow Visualization (Animated) | FlowVisualization, AnimatedStepNode, AnimatedFlowEdge | useFlowAnimations | Implemented |
| Session Controls | ControlButtons | useSessionControls | Implemented |
| Conversation/Input | ConversationPanel | useSessionInput | Implemented |
| File Explorer | FileExplorer, FileTree, FileIcon | useFileTree | Implemented |
| Code Editor | CodeEditor, EditorTabs, DiffView, ConflictDialog | useEditorFiles, useFileSyncManager | Implemented |
| Terminal Viewer | TerminalPanel, TerminalTabs | useTerminalEvents | Implemented |
| Claude CLI Management | ClaudeCliTerminal, ClaudeCliStartDialog | useClaudeCliControl, useClaudeCliSessions | Implemented |
| Session Discovery | DiscoveredSessionsList | useDiscoveredSessions | Implemented |
| Project Registry | ProjectSelector, ProjectForm | useProjects | Implemented |
| Session Windows | SessionWindowGrid, SessionWindowTile | useSessionWindows | Implemented |
| Quick Actions | QuickActionBar, QuickActionSettings | -- | Implemented |
| Session Archive | SessionArchive | useSessionArchive | Implemented |
| Keyboard Shortcuts | -- | useKeyboardShortcuts | Implemented |
| Notifications | NotificationManager, Toast | useNotifications | Implemented |
| History Browser | HistoryBrowser | -- | Implemented |
| Swimlane Layout | SwimlaneBackground | swimlaneLayout.ts | Implemented |
| Tabs: Dashboard/Flows/Actions/Logs/Settings | -- | -- | Placeholder (not implemented) |

### 4.3 Two UI Modes

The frontend offers two view modes toggled via a button:

1. **Classic Mode:** UserSidebar + FileExplorer + SplitPaneLayout + CodeEditor + TerminalTabs
2. **Session Window Mode:** SessionWindowSidebar + SessionWindowGrid

---

## 5. Shared Package Analysis

### 5.1 Module Structure

| File | Exports | Purpose |
|------|---------|---------|
| types.ts | 9 branded types, 4 enums, factory functions | Core type system |
| events.ts | 24 event interfaces, WorkspaceEvent union, eventGuards | Full event taxonomy |
| models.ts | 15 interfaces (Session, Chain, ChainStep, etc.) | Domain models |
| commands.ts | CommandType enum, 9 command interfaces, CommandPayload, CommandResult, CommandBuilder, CommandValidator | Command system |
| sessionWindows.ts | 8 interfaces + types | Session window UI types |
| projects.ts | ProjectId branded type, Project, ProjectAutoDetectionResult | Project registry types |
| index.ts | Re-exports all + legacy types | Barrel export |

### 5.2 Branded Types

| Type | Brand | Factory |
|------|-------|---------|
| SessionId | 'SessionId' | brandedTypes.sessionId() |
| ChainId | 'ChainId' | brandedTypes.chainId() |
| StepId | 'StepId' | brandedTypes.stepId() |
| StepNumber | 'StepNumber' | brandedTypes.stepNumber() |
| UserId | 'UserId' | brandedTypes.userId() |
| Timestamp | 'Timestamp' | brandedTypes.timestamp() / currentTimestamp() |
| DurationMs | 'DurationMs' | duration.ms() / fromSeconds() / fromMinutes() |
| ProjectId | 'ProjectId' | (no factory, cast only) |

### 5.3 Event Types (24 total)

| Category | Events | Count |
|----------|--------|-------|
| Session Lifecycle | session:started, session:ended | 2 |
| Chain Lifecycle | chain:compiled, chain:started, chain:completed | 3 |
| Step Execution | step:spawned, step:started, step:completed, step:failed | 4 |
| User Interaction | interaction:awaiting-input, interaction:input-received | 2 |
| File System | file:created, file:modified, file:deleted | 3 |
| Registry/System | registry:line-updated, execution:log-created | 2 |
| Terminal | terminal:output | 1 |
| Claude CLI | claude-cli:started, claude-cli:output, claude-cli:exited | 3 |
| Diagnostics | error:occurred, warning:occurred | 2 |
| Session Windows | session:followed, session:unfollowed, quick-action:triggered, flow:node-clicked | 4 |

---

## 6. MCP Server Analysis

### 6.1 Purpose

Provides an MCP-protocol server that Claude Code can use (via `--mcp-config`) to poll for dashboard control commands during execution.

### 6.2 Tools

| Tool | Input | Output | Purpose |
|------|-------|--------|---------|
| check_commands | session_id: string | Array of pending commands | Poll for pause/cancel/resume commands |
| ack_command | command_id: string, result?: string, error?: string | Acknowledged status | Confirm command was processed |

### 6.3 Architecture

- Single file (309 lines)
- Uses StdioServerTransport (stdin/stdout)
- Proxies HTTP requests to backend API
- Graceful error handling (returns empty commands on failure)

---

## 7. Hooks Package Analysis

### 7.1 Hook Inventory

| Hook File | Claude Hook Type | Trigger | Purpose |
|-----------|-----------------|---------|---------|
| afw-session-start.ts | SessionStart | Session begins | Register session with backend |
| afw-session-end.ts | SessionEnd | Session ends | Finalize session, trigger persistence |
| afw-chain-parse.ts | Stop | Claude response ends | Parse chain compilation tables from output |
| afw-output-capture.ts | PostToolUse (Bash) | After Bash tool | Capture terminal output |
| afw-control-check.ts | PreToolUse (Task) | Before Task tool | Check for pause/cancel commands, block if pending |
| afw-input-inject.ts | PreToolUse | Before tool use | Inject dashboard input |
| afw-step-spawned.ts | PreToolUse (Task) | Before Task spawn | Report step spawned event |
| afw-step-completed.ts | PostToolUse (Task) | After Task completes | Report step completed event |
| afw-format-check.ts | Stop | Claude response ends | Format validation |

### 7.2 Utilities

| Utility | File | Purpose |
|---------|------|---------|
| settings | utils/settings.ts | Read config from .claude/settings.json + env vars |
| http | utils/http.ts | POST events to backend API |
| parser | utils/parser.ts | Parse chain tables and structured output |

### 7.3 Activation

Hooks are activated via `AFW_ENABLED=true` environment variable (default: false/disabled). Each hook reads stdin for JSON input, processes it, and exits with code 0 (allow) or 2 (block, for control-check).

---

## 8. Cross-Package Dependencies

```
@afw/shared (0 deps)
  ^-- @afw/backend (depends on @afw/shared)
  ^-- @afw/app (depends on @afw/shared)
  ^-- @afw/mcp-server (depends on @afw/shared)
  ^-- @afw/hooks (depends on @afw/shared)
```

- All packages depend on `@afw/shared` via `workspace:*`
- No circular dependencies exist
- Backend and frontend are independent (communicate via HTTP/WS)
- MCP server communicates with backend via HTTP
- Hooks communicate with backend via HTTP

---

## 9. API Endpoint Inventory

### REST Endpoints (43 total)

| Method | Path | Rate Limit | Validation | Purpose |
|--------|------|-----------|------------|---------|
| GET | /health | None | None | Health check |
| POST | /api/sessions | sessionCreate (10/15m) | createSessionSchema | Create session |
| GET | /api/sessions | general | None | List sessions |
| GET | /api/sessions/:id | general | None | Get session |
| PUT | /api/sessions/:id | write (30/15m) | updateSessionSchema | Update session |
| GET | /api/sessions/:id/chains | general | None | Get chains |
| POST | /api/sessions/:id/input | write | sessionInputSchema | Queue input |
| POST | /api/sessions/:id/awaiting | write | sessionAwaitingSchema | Mark awaiting |
| GET | /api/sessions/:id/input | general | None | Poll input (long-poll) |
| POST | /api/events | write | createEventSchema | Store event |
| GET | /api/events/:sessionId | general | None | Get events |
| GET | /api/events/:sessionId/recent | general | None | Get recent events |
| POST | /api/sessions/:id/commands | write | createCommandSchema | Queue command |
| GET | /api/sessions/:id/commands | general | None | Poll commands |
| POST | /api/commands/:commandId/ack | general | ackCommandSchema | Acknowledge command |
| GET | /api/history/dates | general | None | List history dates |
| GET | /api/history/sessions/:date | general | None | List sessions by date |
| GET | /api/history/session/:sessionId | general | None | Load session snapshot |
| GET | /api/history/stats | general | None | Storage statistics |
| POST | /api/history/cleanup | general | None | Manual cleanup |
| GET | /api/files/:sessionId/tree | general | None | File tree |
| GET | /api/files/:sessionId/read | general | validateFilePath | Read file |
| POST | /api/files/:sessionId/write | general | validateFilePath | Write file |
| GET | /api/files/:sessionId/diff | general | validateFilePath | File diff |
| POST | /api/terminal/:sessionId/output | write | terminalOutputSchema | Post terminal output |
| GET | /api/terminal/:sessionId/buffer | general | None | Get terminal buffer |
| DELETE | /api/terminal/:sessionId/buffer | general | None | Clear terminal buffer |
| POST | /api/claude-cli/start | write | claudeCliStartSchema | Start CLI session |
| POST | /api/claude-cli/:sessionId/input | write | claudeCliInputSchema | Send CLI input |
| POST | /api/claude-cli/:sessionId/stop | write | claudeCliStopSchema | Stop CLI session |
| GET | /api/claude-cli/:sessionId/status | general | None | CLI session status |
| GET | /api/claude-cli/sessions | general | None | List CLI sessions |
| GET | /api/session-windows | general | None | List followed sessions |
| GET | /api/session-windows/:id/enriched | general | validateSessionIdParam | Enriched session data |
| POST | /api/session-windows/:id/follow | write | validateSessionIdParam | Follow session |
| DELETE | /api/session-windows/:id/follow | write | validateSessionIdParam | Unfollow session |
| PUT | /api/session-windows/:id/config | write | sessionWindowConfigSchema | Update window config |
| GET | /api/projects | general | None | List projects |
| POST | /api/projects/detect | write | autoDetectProjectSchema | Auto-detect project |
| GET | /api/projects/:id | general | None | Get project |
| POST | /api/projects | write | createProjectSchema | Create project |
| PUT | /api/projects/:id | write | updateProjectSchema | Update project |
| DELETE | /api/projects/:id | write | None | Delete project |
| GET | /api/discovery/sessions | general | None | Discover sessions |
| GET | /api/users | general | None | List users |
| GET | /api/users/:userId/sessions | general | None | User sessions |

### WebSocket Messages (4 types)

| Type | Direction | Fields | Purpose |
|------|-----------|--------|---------|
| subscribe | Client -> Server | sessionId | Subscribe to session events |
| unsubscribe | Client -> Server | sessionId | Unsubscribe from session events |
| input | Client -> Server | sessionId, payload | Send input to session |
| ping | Client -> Server | -- | Keepalive |

### WebSocket Server Messages (5 types)

| Type | Direction | Fields | Purpose |
|------|-----------|--------|---------|
| subscription_confirmed | Server -> Client | sessionId, payload | Subscription confirmed |
| event | Server -> Client | sessionId, payload | Broadcast event |
| command | Server -> Client | sessionId, payload | Send command |
| pong | Server -> Client | clientId | Keepalive response |
| error | Server -> Client | payload, details | Error notification |

---

## 10. Event System Inventory

### Event Flow

```
Hooks (Claude Code) --> POST /api/events --> Backend Storage --> Redis Pub/Sub --> WebSocket --> Frontend
                                                                                    ^
                                                                                    |
Claude CLI Manager -----> Direct broadcast via clientRegistry ----------------------+
File Watcher --------> Direct broadcast via broadcastFunction ----------------------+
Terminal Buffer ------> Direct broadcast via broadcastTerminalFunction --------------+
```

### Event Producer Map

| Event Type | Producer(s) |
|------------|-------------|
| session:started | Hooks (afw-session-start), Claude CLI Manager |
| session:ended | Hooks (afw-session-end), Claude CLI Manager |
| chain:compiled | Hooks (afw-chain-parse) |
| chain:started | (No producer found - gap) |
| chain:completed | (No producer found - gap) |
| step:spawned | Hooks (afw-step-spawned) |
| step:started | (No producer found - gap) |
| step:completed | Hooks (afw-step-completed) |
| step:failed | (No producer found - gap) |
| interaction:awaiting-input | (No producer found - gap) |
| interaction:input-received | (No producer found - gap) |
| file:created | FileWatcher service |
| file:modified | FileWatcher service |
| file:deleted | FileWatcher service |
| terminal:output | Terminal route (from hooks) |
| claude-cli:started | Claude CLI Manager |
| claude-cli:output | Claude CLI Manager |
| claude-cli:exited | Claude CLI Manager |
| error:occurred | (No producer found - gap) |
| warning:occurred | (No producer found - gap) |
| session:followed | (No producer found - gap) |
| session:unfollowed | (No producer found - gap) |
| quick-action:triggered | (No producer found - gap) |
| flow:node-clicked | (No producer found - gap) |

---

## 11. Improvement Areas

### 11.1 CRITICAL Issues

| # | Area | Issue | Impact | File(s) |
|---|------|-------|--------|---------|
| C1 | **Duplicate Route Definitions** | Users routes are defined BOTH in `sessions.ts` (lines 481-541) AND in `users.ts`. The `sessions.ts` version registers `/users` and `/users/:userId/sessions` under the sessions router, meaning they'd be at `/api/sessions/users` and `/api/sessions/users/:userId/sessions`. The `users.ts` version registers at `/api/users` and `/api/users/:userId/sessions`. This creates duplicate, confusing API surfaces. | Route confusion, maintenance burden | `packages/backend/src/routes/sessions.ts`, `packages/backend/src/routes/users.ts` |
| C2 | **Duplicate DENIED_PATHS** | The sensitive directory deny list is duplicated in 3 places: `sessions.ts`, `validatePath.ts`, and `claudeCliManager.ts`. Each has slightly different entries. This will inevitably drift. | Security inconsistency | `sessions.ts`, `validatePath.ts`, `claudeCliManager.ts` |
| C3 | **Duplicate sanitizeError** | Error sanitization function is defined in both `errorHandler.ts` AND `projects.ts`. The `projects.ts` version lacks NODE_ENV-based behavior. | Inconsistent error handling | `packages/backend/src/middleware/errorHandler.ts`, `packages/backend/src/routes/projects.ts` |
| C4 | **Many Event Types Have No Producer** | 12 out of 24 event types (50%) have no code that actually produces them. Types like `chain:started`, `chain:completed`, `step:started`, `step:failed`, `interaction:awaiting-input`, `error:occurred`, etc. are defined but never emitted. | Event system is largely theoretical for half its types | See event producer map above |
| C5 | **Hardcoded WebSocket URL** | `App.tsx` hardcodes `ws://localhost:3001/ws`. No environment variable or configuration. | Cannot deploy to different hosts | `packages/app/src/App.tsx` |

### 11.2 HIGH Priority Issues

| # | Area | Issue | Impact | File(s) |
|---|------|-------|--------|---------|
| H1 | **Rate Limit on Write Too Restrictive** | Write endpoints limited to 30 req/15min. Hooks post events frequently (every bash output capture). This will cause hooks to be rate-limited during active sessions. | Hooks will be silently blocked | `packages/backend/src/middleware/rateLimit.ts` |
| H2 | **`afw-output-capture.ts` has DIFFERENT enable flag** | Uses `AFW_ENABLED === 'true'` (explicit true required), while all other hooks use `AFW_ENABLED !== 'false'` (default enabled). This means output capture is OFF by default while other hooks are ON. | Output capture silently disabled | `packages/hooks/src/afw-output-capture.ts` |
| H3 | **Long-polling without connection cleanup** | The `GET /api/sessions/:id/input` long-polling endpoint uses recursive `setTimeout` without tracking client disconnection. If the client disconnects, the poll loop continues indefinitely. | Memory/resource leak | `packages/backend/src/routes/sessions.ts` |
| H4 | **No pagination on session list** | `GET /api/sessions` returns ALL sessions from memory storage. No pagination, no limit. | Performance degradation at scale | `packages/backend/src/routes/sessions.ts` |
| H5 | **Redis storage missing user tracking** | Redis storage does NOT implement `getSessionsByUser` or `getUsersWithActiveSessions`. The unified `Storage` interface marks them as optional (`?`), but the users route calls them with optional chaining. Redis users get empty results. | Users feature broken with Redis | `packages/backend/src/storage/redis.ts`, `packages/backend/src/routes/users.ts` |
| H6 | **Frontend tabs are placeholders** | Dashboard, Flows, Actions, Logs, and Settings tabs show "This section is not yet implemented." | 5 of 6 tabs are empty | `packages/app/src/components/AppContent.tsx` |
| H7 | **No WebSocket reconnection with backoff** | Frontend WebSocket has basic reconnection but the strategy isn't clear from App.tsx. Connection failures will block the entire UI. | Poor resilience | `packages/app/src/App.tsx`, `packages/app/src/hooks/useWebSocket.ts` |
| H8 | **File diff endpoint is a placeholder** | `GET /api/files/:sessionId/diff` always returns empty string for `before` content with a note "Snapshot tracking not yet implemented." | Diff feature is non-functional | `packages/backend/src/routes/files.ts` |

### 11.3 MEDIUM Priority Issues

| # | Area | Issue | Impact | File(s) |
|---|------|-------|--------|---------|
| M1 | **Inconsistent use of `as any` casts** | Widespread use of `as any` throughout the codebase, especially in routes and storage interactions. This defeats TypeScript safety. | Reduced type safety | Multiple files |
| M2 | **`getCommands` clears queue on read** | Both memory and Redis `getCommands()` clear the command queue after reading. If a network error prevents the client from receiving the response, commands are lost. | Lost commands on network failure | `packages/backend/src/storage/memory.ts`, `packages/backend/src/storage/redis.ts` |
| M3 | **Missing test coverage** | Only 1 test file (`integration.test.ts`) exists. No unit tests for services, middleware, schemas, hooks, or frontend components. | No regression safety net | `packages/backend/src/__tests__/` |
| M4 | **No E2E test framework** | `pnpm test:e2e` runs a bash script (`test/curl-commands.sh`). No proper E2E framework (Playwright, Cypress). | Manual, unreliable testing | `package.json` |
| M5 | **`shellEscape.ts` exists but is unused** | Backend utility file exists but no code imports or uses it. | Dead code | `packages/backend/src/utils/shellEscape.ts` |
| M6 | **Hardcoded default CWD in frontend** | `AppContent.tsx` line 65 hardcodes `'D:/ActionFlowsDashboard'` as fallback CWD. | Machine-specific hardcoding | `packages/app/src/components/AppContent.tsx` |
| M7 | **`isMainModule` detection is fragile** | Backend `index.ts` uses URL comparison to detect if running as main module vs imported for tests. This comparison can fail with path normalization differences. | May fail on some platforms | `packages/backend/src/index.ts` |
| M8 | **No health check for Redis** | When Redis is configured but unavailable, the backend starts but silently fails all storage operations. No periodic health check or circuit breaker. | Silent data loss with Redis failure | `packages/backend/src/storage/redis.ts` |
| M9 | **No HTTPS/WSS support** | Server only listens on HTTP/WS. No TLS configuration. | Security concern for non-localhost | `packages/backend/src/index.ts` |
| M10 | **Version mismatch in packages** | Backend and shared are at 0.0.1, app and mcp-server are at 0.1.0. | Inconsistent versioning | All package.json files |
| M11 | **Electron integration not visible** | Despite having Electron dependencies and build scripts, there's no `electron/main.ts` or Electron-specific code in `packages/app/`. Electron may not actually work. | Electron build may be broken | `packages/app/` |
| M12 | **Session creation race condition** | When starting a CLI session via the frontend, a Session object is injected locally via `addSession()` while the backend also creates one. These could have different data. | Potential state inconsistency | `packages/app/src/components/AppContent.tsx` |
| M13 | **`readStdin` in hooks has race condition** | Both `afw-session-start.ts` and `afw-session-end.ts` use an async `readStdin()` with a 5-second timeout that rejects only if `!data`. If data arrives partially, it could resolve with incomplete JSON. | Partial JSON parsing errors | `packages/hooks/src/afw-session-start.ts`, `packages/hooks/src/afw-session-end.ts` |
| M14 | **No input validation on GET query params** | Most GET endpoints don't validate query parameters (e.g., `limit`, `seconds`, `since`, `depth`, `showHidden`). While some have `parseInt()` with defaults, there's no Zod validation. | Potential injection/unexpected behavior | Multiple route files |

### 11.4 LOW Priority / Code Quality Issues

| # | Area | Issue | Impact | File(s) |
|---|------|-------|--------|---------|
| L1 | **Legacy types in shared/index.ts** | `HookExecutionEvent`, `WebSocketMessage`, `AgentTask`, `HookDefinition` are exported as "legacy" but nothing uses them. | Dead code | `packages/shared/src/index.ts` |
| L2 | **Inconsistent semicolon usage** | Backend files mix semicolon and no-semicolon styles (e.g., `history.ts` has no semicolons, `sessions.ts` has semicolons). | Style inconsistency | Multiple files |
| L3 | **`@types/chokidar` is unnecessary** | Chokidar v3 ships its own TypeScript types. The separate `@types/chokidar` package is for v2 and may cause conflicts. | Potential type conflicts | `packages/backend/package.json` |
| L4 | **`ts-node-dev` in devDependencies but not used** | Backend uses `npx tsx watch` for dev, but still lists `ts-node-dev` as a dependency. | Unused dependency | `packages/backend/package.json` |
| L5 | **`node-fetch` v3 in backend devDependencies** | Listed as devDependency but native `fetch` is available in Node 18+. Only used in tests. | Unnecessary dependency | `packages/backend/package.json` |
| L6 | **Inconsistent `fs` import styles** | Some files use `import * as fs from 'fs'`, others use `import fs from 'fs/promises'`, some mix both. | Inconsistent patterns | Multiple files |
| L7 | **No lint or format configuration** | `pnpm lint` is defined but no ESLint or Prettier config files are visible. | Linting may not work | Root |
| L8 | **`pnpm-workspace.yaml` location** | Root `package.json` uses `workspaces` field, but pnpm typically uses `pnpm-workspace.yaml`. Need to verify which is active. | Build configuration uncertainty | Root |
| L9 | **`Math.random().toString(36).substr(2, 9)` for IDs** | Several places use this pattern for generating IDs. Not cryptographically random. For session IDs and command IDs, `crypto.randomUUID()` would be more appropriate. | Weak ID generation | Multiple files |
| L10 | **`import type` not consistently used** | Some imports use `import type { ... }` while others import types without the `type` keyword, potentially pulling in runtime code. | Bundle size, correctness | Multiple files |

---

## 12. Security Analysis

### 12.1 Implemented Security Measures

| Measure | Location | Status |
|---------|----------|--------|
| API Key Authentication | `middleware/auth.ts` | Implemented (optional in dev) |
| CORS Whitelist | `index.ts` | Implemented (configurable) |
| Rate Limiting | `middleware/rateLimit.ts` | Implemented (3 tiers) |
| Zod Request Validation | `schemas/api.ts`, `middleware/validate.ts` | Implemented for POST/PUT |
| Path Traversal Prevention | `middleware/validatePath.ts` | Implemented |
| System Directory Denial | `sessions.ts`, `validatePath.ts`, `claudeCliManager.ts` | Implemented (duplicated) |
| WebSocket API Key Validation | `clientRegistry.ts` | Implemented (per-message) |
| WebSocket Rate Limiting | `clientRegistry.ts` | Implemented (50 msg/sec) |
| WebSocket Max Clients | `clientRegistry.ts` | Implemented (1000 max) |
| WebSocket Max Payload | `index.ts` | Implemented (1MB) |
| Body Size Limit | `index.ts` | Implemented (1MB) |
| Error Sanitization | `middleware/errorHandler.ts` | Implemented (env-based) |
| Command Injection Prevention | `claudeCliManager.ts` | Implemented (flag whitelist) |
| Input Size Validation | `claudeCliSession.ts` | Implemented (100KB max) |
| File Size Limits | `routes/files.ts` | Implemented (10MB read/write) |
| Session Ownership Validation | `ws/handler.ts` | Implemented (userId check) |
| Env Var Key Validation | `projectDetector.ts` | Implemented (alphanumeric only) |

### 12.2 Security Gaps

| Gap | Risk | Recommendation |
|-----|------|----------------|
| No HTTPS/WSS | Medium | Add TLS support or document reverse proxy requirement |
| API key in query string | Low | API keys in URLs can be logged. Consider header-only in production |
| No CSRF protection | Low | Not critical for API-only backend, but worth noting |
| No request ID tracking | Low | Add correlation IDs for audit trail |
| File write without authorization | Medium | Any session can write to its CWD without user permission checks |
| History cleanup endpoint has no auth check beyond API key | Low | Consider admin-only access |
| `process.env` values used directly in Redis keys | Low | Validate Redis prefix to prevent key injection |

---

## 13. Performance Considerations

### 13.1 Bottlenecks

| Area | Concern | Impact |
|------|---------|--------|
| Memory Storage | All data in-process memory, no persistence between restarts | Data loss on restart (mitigated by file persistence for history) |
| File Watcher | One chokidar instance per session, depth=10 | Resource-heavy with many sessions |
| Terminal Buffer | 50K lines per session in memory | ~50MB per session worst case |
| Event Storage | 10K events per session in memory | ~10MB per session worst case |
| Redis `getEventsSince` | Loads ALL events then filters in Node.js | O(n) per query, should use sorted sets |
| Long-polling | Recursive setTimeout with 500ms interval | CPU waste per waiting client |
| File tree build | Recursive `fs.readdir` + `fs.stat` per entry | Slow for large directories |
| CLI Session Limit | Max 5 concurrent Claude CLI processes | May be too restrictive |

### 13.2 Scalability Limits

| Resource | Memory Storage Limit | Redis Limit | Notes |
|----------|---------------------|-------------|-------|
| Sessions | 1,000 | TTL-based (24h) | Memory evicts oldest completed |
| Events/session | 10,000 | TTL-based (24h) | Memory FIFO eviction |
| Chains/session | 100 | TTL-based (24h) | Memory FIFO eviction |
| WebSocket clients | 1,000 | 1,000 (per instance) | Hard limit in registry |
| Terminal lines/session | 50,000 | 50,000 | In-memory only |
| CLI sessions | 5 | 5 | Configurable via env var |

---

## 14. Architecture Gaps

### 14.1 Missing Functionality

| Feature | Status | Notes |
|---------|--------|-------|
| Session persistence across restarts | Partial | File persistence for history exists, but active sessions are lost |
| Multi-user authentication | Partial | API key is global, not per-user. No user accounts. |
| Role-based access control | Missing | All authenticated users have full access |
| Audit logging | Missing | No action audit trail |
| Metrics/monitoring | Missing | No Prometheus metrics, no health check for dependencies |
| Configuration management | Partial | Mix of env vars and hardcoded values |
| Database migration system | N/A | No SQL database (Memory/Redis/File only) |
| API versioning | Missing | All endpoints are unversioned |
| OpenAPI/Swagger documentation | Missing | No API documentation generation |
| Frontend error boundaries | Unknown | Need to verify React error boundary implementation |
| Offline support | Missing | No service worker, no offline capability |
| Session replay | Missing | Events are stored but no replay mechanism |
| Chain templates library | Partial | Types defined in shared but no backend CRUD |
| Execution metrics aggregation | Missing | Types defined in shared but no backend computation |
| Flow definition management | Missing | Types defined in shared but no backend CRUD |
| Action registry | Missing | Types defined in shared but no backend implementation |

### 14.2 Architectural Inconsistencies

| Inconsistency | Details |
|----------------|---------|
| Storage interface is sync+async hybrid | `Storage` interface returns `T | Promise<T>` for most methods, requiring `Promise.resolve()` wrapping everywhere. Should be fully async. |
| Event broadcasting paths differ | File events go through `broadcastFunction`, terminal events through `broadcastTerminalFunction`, CLI events through `broadcastClaudeCliEvent`, and Redis events through pub/sub. Should be unified. |
| Session creation dual-path | Sessions can be created via `POST /api/sessions` (from hooks) OR via `claudeCliManager.startSession()` (from CLI route). The two paths have different validation and behavior. |
| Frontend service layer inconsistency | `claudeCliService.ts` and `projectService.ts` exist as HTTP service layers, but most other data fetching is done directly in hooks. |
| Hooks use different stdin reading patterns | `afw-session-start.ts` and `afw-session-end.ts` use async `readStdin()`, while `afw-chain-parse.ts`, `afw-output-capture.ts`, and `afw-control-check.ts` use `fs.readFileSync(0, 'utf-8')`. |

---

## Appendix A: File Count Summary

| Package | Source Files (.ts/.tsx) | Test Files | Total |
|---------|----------------------|------------|-------|
| Backend | 36 | 2 | 38 |
| Frontend | 85+ | 0 | 85+ |
| Shared | 7 | 0 | 7 |
| MCP Server | 1 | 0 | 1 |
| Hooks (src only) | 11 | 0 | 11 |
| **Total** | **140+** | **2** | **142+** |

## Appendix B: External Dependencies

### Runtime Dependencies

| Package | Backend | Frontend | MCP | Hooks |
|---------|---------|----------|-----|-------|
| @afw/shared | x | x | x | x |
| express | x | | | |
| ws | x | | | |
| cors | x | | | |
| ioredis | x | | | |
| chokidar | x | | | |
| zod | x | | | |
| express-rate-limit | x | | | |
| react | | x | | |
| react-dom | | x | | |
| reactflow | | x | | |
| @reactflow/core | | x | | |
| @monaco-editor/react | | x | | |
| monaco-editor | | x | | |
| xterm | | x | | |
| @xterm/addon-fit | | x | | |
| @xterm/addon-search | | x | | |
| electron-is-dev | | x | | |
| @modelcontextprotocol/sdk | | | x | |
| node-fetch | | | x | |

### Dev Dependencies

| Package | Scope |
|---------|-------|
| typescript | All |
| @types/node | Root, Backend, MCP, Hooks |
| vite | Frontend |
| @vitejs/plugin-react | Frontend |
| electron | Frontend |
| electron-builder | Frontend |
| vite-plugin-electron | Frontend |
| vitest | Backend |
| supertest | Backend |

---

*This analysis is comprehensive and can be used as the foundation for Functional Requirements Document (FRD) and System Requirements Document (SRD) generation.*
