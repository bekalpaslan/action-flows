# Architecture

**Analysis Date:** 2026-04-01

## Pattern Overview

**Overall:** Monorepo with layered Express backend and React frontend connected via WebSocket, using a unified Storage abstraction (Memory/Redis) as the central state container.

**Key Characteristics:**
- **Layered Backend:** Middleware → Routes → Services → Storage
- **Storage-Centric:** All state flows through unified `Storage` interface (`packages/backend/src/storage/index.ts`)
- **Event-Driven WebSocket:** Server broadcasts events to subscribed session clients; clients send commands via WebSocket
- **Context-Based Frontend:** React Contexts manage global state (Auth, Session, WebSocket, Universe, Harmony, Discovery)
- **Branded Types:** Domain concepts use branded strings (SessionId, ChainId, StepId, UserId) for type safety
- **Multi-Surface Capable:** Supports web (React), desktop (Electron), and CLI clients via single backend

## Layers

**Middleware Layer:**
- Purpose: Cross-cutting concerns before routes execute
- Location: `packages/backend/src/middleware/`
- Contains: Authentication (`auth.ts`), rate limiting (`rateLimit.ts`), validation (`validate.ts`), error handling (`errorHandler.ts`)
- Depends on: Express, environment config
- Used by: All HTTP routes via Express app stack

**Routes Layer:**
- Purpose: HTTP endpoints that handle client requests and invoke services
- Location: `packages/backend/src/routes/`
- Contains: 40+ route files (sessions, commands, files, harmony, flows, artifacts, etc.)
- Pattern: Each route imports services, validates input, calls service methods, returns response
- Depends on: Services, Storage, Schemas, Middleware
- Used by: Express app router

**Services Layer:**
- Purpose: Business logic, state transitions, external integrations
- Location: `packages/backend/src/services/`
- Contains: Domain-specific services (SessionService via sessions.ts route, HarmonyDetector, GateCheckpoint, FileWatcher, SparkBroadcaster, PersonalityParser, etc.)
- Pattern: Services are typically singletons initialized at startup (e.g., `initializeHarmonyDetector()`, `initSparkBroadcaster()`)
- Depends on: Storage, external libraries, other services
- Used by: Routes, WebSocket handlers, initialization code

**Storage Layer:**
- Purpose: Data persistence abstraction supporting memory (dev) and Redis (prod)
- Location: `packages/backend/src/storage/`
- Contains:
  - `index.ts`: Unified Storage interface (40+ methods)
  - `memory.ts`: In-memory Map-based storage
  - `redis.ts`: Redis backend
  - `resilientStorage.ts`: Circuit breaker wrapper
  - `file-persistence.ts`: File-based backup
- Pattern: Dual interface—sync for Memory, async (Promises) for Redis; callers use `Promise.resolve()` for compatibility
- Used by: All services, routes, WebSocket handlers

**WebSocket Layer:**
- Purpose: Real-time server-to-client event broadcasting and client-to-server command handling
- Location: `packages/backend/src/ws/`
- Contains:
  - `handler.ts`: Message router (subscribe, unsubscribe, input, capability invocation)
  - `clientRegistry.ts`: Client connection tracking, rate limiting, broadcast routing
- Patterns:
  - **Subscribe:** Client subscribes to session → clientRegistry links client to session
  - **Broadcast:** Services call `broadcastFileEvent()`, `broadcastHarmonyEvent()`, etc. → clientRegistry routes to session subscribers
  - **Commands:** Client sends command → stored in session's command queue
  - **Capability Invocation:** Client calls dashboard capability via WebSocket with correlationId
- Entry point: HTTP upgrade at `server.on('upgrade', ...)` in `index.ts`

**Frontend Contexts (React):**
- Purpose: Global state management at app level
- Location: `packages/app/src/contexts/`
- Key contexts:
  - `WebSocketContext.tsx`: Manages WebSocket connection, sends/receives messages
  - `SessionContext.tsx`: All sessions state, active session, create/delete
  - `AuthContext.tsx`: User authentication, token management
  - `WorkbenchContext.tsx`: Workbench windows, layout
  - `UniverseContext.tsx`: Cosmic map state (regions, bridges)
  - `HarmonyContext.tsx`: Harmony metrics and health scores
  - `DiscoveryContext.tsx`: Discovered sessions and patterns
  - `ChatWindowContext.tsx`: Chat/conversation panel state
  - `TerminalContext.tsx`: Terminal session output
- Pattern: Provider wrapper at App root → useContext hooks in components

**Frontend Hooks (React):**
- Purpose: Reusable stateful logic for components
- Location: `packages/app/src/hooks/`
- Contains: 60+ hooks (useWebSocket, useChainState, useSessionControls, useFileTree, useDossiers, etc.)
- Pattern: Custom hooks encapsulate API calls, Context consumption, local state, event subscriptions
- Example: `useSessionControls()` calls service methods, `useChainEvents()` subscribes to WebSocket events

## Data Flow

**Session Creation & Event Broadcasting:**

1. User clicks "New Session" in UI
2. Frontend calls `POST /api/sessions` with cwd, name
3. Sessions route validates input, calls storage.setSession(), storage.addChain()
4. Route returns Session object with sessionId
5. Frontend's SessionContext updates local sessions list
6. User selects session → frontend WebSocket client sends `subscribe` message
7. WebSocket handler calls `clientRegistry.subscribe(ws, sessionId)`
8. Now any service event for that sessionId broadcasts via `clientRegistry.broadcastToSession(sessionId, message)`

**File Change Notification:**

1. FileWatcher detects file change
2. Calls `broadcastFileEvent(sessionId, { type: 'file_modified', ...})`
3. clientRegistry broadcasts to all clients subscribed to sessionId
4. Frontend receives via WebSocket, updates FileExplorer UI

**Harmony Detection & Healing:**

1. GateCheckpoint service emits gate traces on `gate:checkpoint` event
2. HealthScoreCalculator ingests traces → calculates health score
3. If score drops below threshold, emits `harmony:threshold_exceeded`
4. HealingRecommendationEngine subscribes, analyzes violations
5. Returns healing recommendations
6. All events broadcast to WebSocket clients

**State Management Flow:**

```
User Action (UI)
    ↓
HTTP API or WebSocket Message
    ↓
Route Handler validates input (schema)
    ↓
Service Layer (business logic)
    ↓
Storage.get/set operations
    ↓
Broadcast Event (if shared state)
    ↓
WebSocket clients update (real-time)
```

## Key Abstractions

**Storage Interface:**
- Purpose: Unified data persistence abstraction
- Examples: `packages/backend/src/storage/index.ts` (interface), `memory.ts` (implementation), `redis.ts` (implementation)
- Pattern: All storage operations go through this interface—enables swapping backend at runtime
- Methods: getSession, setSession, addChain, getChain, addEvent, getEvents, etc. (sync or Promise-wrapped)

**Branded Types (Domain Safety):**
- Purpose: Distinguish between similarly-shaped values (e.g., multiple UUIDs)
- Examples: SessionId, ChainId, StepId, UserId, Timestamp, RegionId (from `packages/shared/src/types.ts`)
- Pattern: `type SessionId = string & { readonly __brand: 'SessionId' }`
- Used by: Type system to catch mistakes at compile time (cannot accidentally pass ChainId where SessionId expected)

**WorkspaceEvent Union:**
- Purpose: Type-safe event system with discriminated unions
- Examples: FileCreatedEvent, FileModifiedEvent, ChatMessageEvent, TerminalOutputEvent (from `packages/shared/src/events.ts`)
- Pattern: Each event has `type` field that narrows the event to specific structure
- Used by: WebSocket broadcasts, event storage, client message handlers

**Session & Chain:**
- Purpose: Core domain models representing orchestration state
- Session: User's orchestration workspace (id, userId, cwd, status, createdAt, updatedAt, metadata)
- Chain: Sequence of steps within session (id, sessionId, status, steps[], commands[], inputs[])
- Used by: All session/chain operations, workflows

**ClientRegistry:**
- Purpose: Track WebSocket client connections, subscriptions, rate limits
- Pattern: Singleton at `packages/backend/src/ws/clientRegistry.ts`
- Methods: register(), unregister(), subscribe(), unsubscribe(), broadcastToSession(), broadcastToAll()
- Used by: WebSocket handler, broadcast functions

## Entry Points

**Backend Entry:**
- Location: `packages/backend/src/index.ts`
- Triggers: `node packages/backend/dist/index.js` (or `pnpm dev:backend`)
- Responsibilities:
  1. Initialize Express app with middleware
  2. Register HTTP routes
  3. Create HTTP server and WebSocket server
  4. Initialize services (HarmonyDetector, SparkBroadcaster, GateCheckpoint, etc.)
  5. Start listening on PORT (default 3001)
  6. Set up graceful shutdown handlers

**Frontend Entry:**
- Location: `packages/app/src/main.tsx`
- Triggers: `npm run dev` (Vite dev server at 5173)
- Responsibilities:
  1. Render React root with nested Providers (Contexts)
  2. Load App component which renders AppContent
  3. Initialize service worker for offline caching

**Shared Types Entry:**
- Location: `packages/shared/src/index.ts`
- Purpose: Centralized export of types used by backend and frontend
- Contains: Domain types, branded strings, event types, commands, schemas

## Error Handling

**Strategy:** Layered error handling with global error handler middleware

**Patterns:**

1. **Route-Level Validation:**
   ```typescript
   const result = schema.safeParse(input);
   if (!result.success) {
     res.status(400).json({ error: 'Validation failed', details: result.error });
   }
   ```
   Location: In route handlers before service calls

2. **Service-Level Error Propagation:**
   - Services throw descriptive errors (e.g., "Session not found", "Invalid chain state")
   - Routes catch and respond with HTTP status (400, 404, 500)
   - Location: `packages/backend/src/middleware/errorHandler.ts` - global handler

3. **WebSocket Error Handling:**
   - Per-message error response: `{ type: 'error', payload: 'error message' }`
   - Connection-level: Rate limit exceeded → close with code 1008
   - Location: `packages/backend/src/ws/handler.ts`

4. **Frontend Error Handling:**
   - API errors caught in hooks → toast notifications or fallback UI
   - WebSocket connection lost → reconnection with exponential backoff
   - Location: `packages/app/src/contexts/WebSocketContext.tsx`

## Cross-Cutting Concerns

**Logging:**
- Backend: Console.log with `[Component]` prefix (e.g., `[WS]`, `[FileWatcher]`, `[HarmonyDetector]`)
- Frontend: console.log in development, error/warn for issues
- File: Optional file-based logging via FILE_LOG_ENABLED env var

**Validation:**
- Backend: Zod schemas in `packages/backend/src/schemas/` (api.ts, ws.ts, etc.)
- Frontend: Form validation in component state + API response validation
- Shared: Contract validation (component-level contracts) in `packages/app/src/contracts/`

**Authentication:**
- Mechanism: API Key or Bearer token in Authorization header / x-api-key header
- Middleware: `packages/backend/src/middleware/auth.ts` - validates all HTTP requests
- WebSocket: Per-connection validation at upgrade + per-message re-validation
- Dev Mode: Optional (AFW_API_KEY env var not set = auth disabled)

**Authorization (Fix 2):**
- Session Ownership: If session has `user` field, client's userId must match
- Implemented in: `packages/backend/src/ws/handler.ts` (subscribe validation)

**Rate Limiting:**
- HTTP: Per-IP rate limiting via `generalLimiter` middleware
- Session Create: Stricter limits via `sessionCreateLimiter`
- WebSocket: Per-client message rate limit tracking in clientRegistry
- Location: `packages/backend/src/middleware/rateLimit.ts`

**Monitoring & Observability:**
- Gate Checkpoints: `packages/backend/src/services/gateCheckpoint.ts` - traces execution with ledger
- ConversationWatcher: Monitors Claude Code JSONL logs for gate compliance
- HealthScoreCalculator: Aggregates traces into health score
- Activity Tracking: `activityTracker` records user actions

---

*Architecture analysis: 2026-04-01*
