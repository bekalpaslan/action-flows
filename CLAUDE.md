<!-- GSD:project-start source:PROJECT.md -->
## Project

**ActionFlows Dashboard — Agentic Personal OS**

An agentic personal OS built on ActionFlows — a 3-panel dashboard where each workbench is backed by a persistent Claude remote session. Users express intention through natural language; agents build and shape the software using a shared component library and design system. Actions and flows are the building blocks agents use to execute work. The system validates itself through a neural layer (Claude Code hooks + `/btw` signals) and heals autonomously when contract violations occur.

**Core Value:** Agents build with the same components humans see — every button, card, table, and layout follows the design system. Consistency is not a guideline, it's enforced infrastructure.

### Constraints

- **Tech stack**: React 18 + TypeScript + Vite (frontend), Express + ws (backend), pnpm monorepo — preserve existing stack
- **Claude Code dependency**: Framework relies on Claude Code features (remote sessions, hooks, /btw, cron, streaming). Must work within Claude Code's capabilities and API surface
- **Design system enforcement**: No raw CSS in agent output. Component library is the only way agents build UI
- **Electron**: Desktop app wrapper must continue to function
- **Contract system**: Existing 17 output format contracts must be preserved or migrated, not discarded
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->
## Technology Stack

## Languages
- TypeScript 5.3.3 - Entire codebase (backend, frontend, shared types)
- JavaScript (ES modules) - Scripts and build tooling
- HTML/CSS - Frontend markup and styling
## Runtime
- Node.js (version not explicitly pinned, determined by system/CI)
- Electron 35.7.5 - Desktop application runtime
- pnpm 10.29.3 - Primary monorepo package manager
- Lockfile: pnpm-lock.yaml (managed)
## Frameworks
- Express 4.18.2 - HTTP server and REST API framework
- ws 8.14.2 - WebSocket server for real-time communication
- React 18.2.0 - UI component framework
- Vite 6.2.0 - Frontend build tool and dev server
- ReactFlow 11.10.0 - Flow/graph visualization component
- D3 7.9.0 - Data-driven document manipulation and visualization
- Dagre 0.8.5 - Directed graph layout library
- Monaco Editor 0.45.0 - Code editor component
- xterm 5.3.0 - Terminal emulation in browser
- electron-builder 26.7.0 - Electron app packaging and distribution
- vite-plugin-electron 0.29.0 - Vite plugin for Electron development
- concurrently 9.2.1 - Run multiple processes in parallel
- Vitest 4.0.0 - Unit test runner
- Playwright 1.58.2 - E2E testing framework
- @testing-library/react 14.1.2 - React component testing utilities
- jest-axe 10.0.0 - Accessibility testing
- Lighthouse 12.0.0 - Performance and accessibility auditing
- swagger-jsdoc 6.2.8 - OpenAPI spec generation from JSDoc comments
- swagger-ui-express 5.0.1 - Swagger UI server integration
## Key Dependencies
- @afw/shared (workspace:*) - Shared types, schemas, and utilities across packages
- zod 3.22.4 - Runtime schema validation (used in both backend and shared)
- @modelcontextprotocol/sdk 1.0.0 - MCP server implementation for tool integration
- ioredis 5.3.0 - Redis client for optional persistent storage
- uuid 13.0.0 - UUID generation for session/chain/step IDs
- chokidar 3.5.3 - File system watcher for project monitoring
- cors 2.8.5 - CORS middleware for cross-origin requests
- compression 1.7.1 - gzip/brotli response compression
- express-rate-limit 7.1.0 - Rate limiting middleware for API protection
- node-fetch 3.3.2 - HTTP client for external service calls
- react-dom 18.2.0 - React DOM rendering
- react-markdown 10.1.0 - Markdown rendering in React
- react-window 1.8.10 - Virtualized list component for large data sets
- @xterm/addon-fit 0.11.0 - xterm terminal fit plugin
- @xterm/addon-search 0.16.0 - xterm search plugin
- rehype-raw 7.0.0 - HTML processing for markdown
- web-vitals 5.1.0 - Core Web Vitals measurement
- @vitest/coverage-v8 4.0.18 - Code coverage reporting
- vite-bundle-visualizer 1.2.0 - Bundle analysis visualization
- terser 5.46.0 - JavaScript minification
- @axe-core/react 4.11.1 - Automated accessibility testing
- eslint-plugin-jsx-a11y 6.8.0 - JSX accessibility linting
## Configuration
- `.env.example` in `packages/backend/` documents required variables
- Environment variables control:
- `tsconfig.json` (root) - TypeScript compiler settings (ES modules, target es2020)
- `packages/backend/tsconfig.json` - Backend-specific configuration
- `packages/app/tsconfig.json` - Frontend-specific configuration
- `packages/shared/tsconfig.json` - Shared types configuration
- `vite.config.ts` - Frontend build configuration (react plugin, electron plugin, proxy settings)
- `playwright.config.ts` - E2E test configuration
- `electron-builder.json` (in package.json) - Electron packaging and distribution settings
## Platform Requirements
- Node.js (any recent LTS)
- pnpm 10.29.3
- Git (for version control)
- Bash/Unix shell (Windows: Git Bash or WSL for `test/curl-commands.sh`)
- **Web Deployment:** Node.js runtime + Redis (optional, MemoryStorage used if Redis unavailable)
- **Desktop:** Electron 35.7.5 (included in desktop build)
- **Ports:** Backend 3001 (configurable), Frontend 5173 (dev only)
## Development Commands
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

## Naming Patterns
- React components: PascalCase `.tsx` (e.g., `ControlButtons.tsx`, `AppContent.tsx`)
- Hooks: camelCase with `use` prefix (e.g., `useChatMessages.ts`, `useSessionControls.ts`)
- Services: camelCase (e.g., `fileWatcher.ts`, `harmonyDetector.ts`)
- Routes: lowercase kebab-case (e.g., `sessions.ts`, `terminal.ts`)
- Tests: `*.test.ts` or `*.spec.ts` suffix (e.g., `errorHandler.test.ts`)
- Contracts: `*.contract.md` for behavioral contracts (e.g., `AppContent.contract.md`)
- camelCase for all functions and methods
- Hook functions prefixed with `use` (React hooks pattern)
- Private/internal functions often prefixed with underscore or placed in utility files
- Handler functions suffixed with verb (e.g., `handlePause`, `handleCancelConfirm`, `handleWebSocket`)
- camelCase for all local variables and constants
- Boolean variables often prefixed with `is`, `has`, `should`, `can` (e.g., `isPausing`, `hasActiveChain`, `isPaused`)
- Event callbacks prefixed with `on` (e.g., `onEvent`, `onClose`)
- useState setters use `set` prefix (e.g., `setMessages`, `setShowCancelConfirm`)
- State tracking refs use `Ref` suffix (e.g., `seenIdsRef`, `heartbeatInterval`)
- Service instances use descriptive names (e.g., `clientRegistry`, `claudeCliManager`)
- PascalCase for all type/interface names (e.g., `ChatDisplayMessage`, `ControlButtonsProps`, `Session`)
- Branded string types use descriptive names (e.g., `SessionId`, `ChainId`, `StepId`, `UserId`, `Timestamp`)
- Event types suffixed with `Event` (e.g., `FileCreatedEvent`, `ChainCompletedEvent`, `HarmonyCheckEvent`)
- Props interfaces suffixed with `Props` (e.g., `ControlButtonsProps`, `ChainBadgeProps`)
- UPPER_SNAKE_CASE for all constants (e.g., `HEARTBEAT_INTERVAL_MS`, `IDLE_THRESHOLD_MS`, `DENIED_PATHS`)
- Environment variable names follow pattern `AFW_CONSTANT_NAME` (e.g., `AFW_CORS_ORIGINS`, `AFW_API_KEY`)
## Code Style
- No explicit ESLint/Prettier config found in repo root or packages
- Default to TypeScript strict mode settings (per `tsconfig.base.json`)
- Targets ES2022 with NodeNext module resolution
- TypeScript strict mode enabled with `strict: true`
- Additional safety: `noUncheckedIndexedAccess: true` to catch array bounds issues
- Force consistent casing with `forceConsistentCasingInFileNames: true`
- No ESLint configuration detected; follows TypeScript compiler rules
- All packages use ES modules (`"type": "module"` in package.json)
- Absolute paths via path aliases defined in `tsconfig.base.json`
- Workspace packages imported via `@afw/*` aliases (e.g., `@afw/shared`, `@afw/backend`)
## Import Organization
## Error Handling
- Try-catch blocks used for async operations and error boundary code
- Error sanitization via `sanitizeError()` function (`packages/backend/src/middleware/errorHandler.ts`)
- Silent failure pattern for secondary services: catch errors and log at debug level without crashing server
- Graceful degradation: services that fail to initialize log error but allow server to start
## Logging
- All logs include module/service prefix in square brackets: `[ModuleName]`
- Log levels: `console.log()` for info, `console.error()` for errors, `console.warn()` for warnings, `console.debug()` for debug
- Structured logging with consistent prefix format: `[ServiceName] Message here`
- Status indicators using emoji for visual scanning: `✅` (success), `❌` (error), `⚠️` (warning)
- Log example: `console.log('[WS] Server heartbeat started (20s interval, only to idle clients)')`
- Server startup displays ASCII banner with status information
## Comments
- Complex business logic requiring explanation
- Non-obvious design decisions (e.g., why silent failure is chosen)
- References to external specs or protocols (e.g., "Fix 5", "Component 3 - Agent Behavior Validation")
- Behavioral contracts: detailed inline comments in contract files explaining component lifecycle
- Used for exported functions and types
- Includes description, parameters, return types, and examples
- Example (from `useChatMessages.ts`):
- Functions document their purpose and key behaviors
- Types document nominal typing constraints (e.g., branded string types)
## Function Design
- Avoid parameter objects for simple cases; use typed objects when > 3 parameters
- Prefix booleans with `is`/`has`/`should` for clarity
- Props interfaces suffixed with `Props` for React components
- Promise-returning functions properly typed with return type annotations
- Void returns explicit for side-effect-only functions (e.g., middleware)
- Nullable returns marked with `| null` or `| undefined` for optional values
## Module Design
- Named exports for public API
- Default exports used rarely (primary component only)
- Barrel files (`index.ts`) export common types and functions from package
- `packages/shared/src/index.ts`: aggregates exports from types.ts, events.ts, models.ts, commands.ts
- `packages/backend/src/index.ts`: exports app, server, wss, storage for testing
- Service initialization functions exported for setup phase
## Branded Types & Type Safety
- All entity IDs are branded: `SessionId`, `ChainId`, `StepId`, `UserId`, `Timestamp`, `RegionId`, `EdgeId`
- Branded types prevent accidental mixing (e.g., can't assign `ChainId` to `SessionId`)
- Assertion/conversion functions provide runtime validation
## React Patterns
- All custom hooks follow `use` prefix convention
- Hooks manage local state with `useState` and effects with `useEffect`
- Context subscription via dedicated `use*Context()` hooks
- Functional components with TypeScript
- Props interfaces separate and well-typed
- Behavioral contracts document component lifecycle (e.g., `AppContent.contract.md`)
- Provider components wrap tree (e.g., `ThemeProvider`, `WebSocketProvider`, `SessionProvider`)
- Context hooks exported for consuming components
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

## Pattern Overview
- **Layered Backend:** Middleware → Routes → Services → Storage
- **Storage-Centric:** All state flows through unified `Storage` interface (`packages/backend/src/storage/index.ts`)
- **Event-Driven WebSocket:** Server broadcasts events to subscribed session clients; clients send commands via WebSocket
- **Context-Based Frontend:** React Contexts manage global state (Auth, Session, WebSocket, Universe, Harmony, Discovery)
- **Branded Types:** Domain concepts use branded strings (SessionId, ChainId, StepId, UserId) for type safety
- **Multi-Surface Capable:** Supports web (React), desktop (Electron), and CLI clients via single backend
## Layers
- Purpose: Cross-cutting concerns before routes execute
- Location: `packages/backend/src/middleware/`
- Contains: Authentication (`auth.ts`), rate limiting (`rateLimit.ts`), validation (`validate.ts`), error handling (`errorHandler.ts`)
- Depends on: Express, environment config
- Used by: All HTTP routes via Express app stack
- Purpose: HTTP endpoints that handle client requests and invoke services
- Location: `packages/backend/src/routes/`
- Contains: 40+ route files (sessions, commands, files, harmony, flows, artifacts, etc.)
- Pattern: Each route imports services, validates input, calls service methods, returns response
- Depends on: Services, Storage, Schemas, Middleware
- Used by: Express app router
- Purpose: Business logic, state transitions, external integrations
- Location: `packages/backend/src/services/`
- Contains: Domain-specific services (SessionService via sessions.ts route, HarmonyDetector, GateCheckpoint, FileWatcher, SparkBroadcaster, PersonalityParser, etc.)
- Pattern: Services are typically singletons initialized at startup (e.g., `initializeHarmonyDetector()`, `initSparkBroadcaster()`)
- Depends on: Storage, external libraries, other services
- Used by: Routes, WebSocket handlers, initialization code
- Purpose: Data persistence abstraction supporting memory (dev) and Redis (prod)
- Location: `packages/backend/src/storage/`
- Contains:
- Pattern: Dual interface—sync for Memory, async (Promises) for Redis; callers use `Promise.resolve()` for compatibility
- Used by: All services, routes, WebSocket handlers
- Purpose: Real-time server-to-client event broadcasting and client-to-server command handling
- Location: `packages/backend/src/ws/`
- Contains:
- Patterns:
- Entry point: HTTP upgrade at `server.on('upgrade', ...)` in `index.ts`
- Purpose: Global state management at app level
- Location: `packages/app/src/contexts/`
- Key contexts:
- Pattern: Provider wrapper at App root → useContext hooks in components
- Purpose: Reusable stateful logic for components
- Location: `packages/app/src/hooks/`
- Contains: 60+ hooks (useWebSocket, useChainState, useSessionControls, useFileTree, useDossiers, etc.)
- Pattern: Custom hooks encapsulate API calls, Context consumption, local state, event subscriptions
- Example: `useSessionControls()` calls service methods, `useChainEvents()` subscribes to WebSocket events
## Data Flow
```
```
## Key Abstractions
- Purpose: Unified data persistence abstraction
- Examples: `packages/backend/src/storage/index.ts` (interface), `memory.ts` (implementation), `redis.ts` (implementation)
- Pattern: All storage operations go through this interface—enables swapping backend at runtime
- Methods: getSession, setSession, addChain, getChain, addEvent, getEvents, etc. (sync or Promise-wrapped)
- Purpose: Distinguish between similarly-shaped values (e.g., multiple UUIDs)
- Examples: SessionId, ChainId, StepId, UserId, Timestamp, RegionId (from `packages/shared/src/types.ts`)
- Pattern: `type SessionId = string & { readonly __brand: 'SessionId' }`
- Used by: Type system to catch mistakes at compile time (cannot accidentally pass ChainId where SessionId expected)
- Purpose: Type-safe event system with discriminated unions
- Examples: FileCreatedEvent, FileModifiedEvent, ChatMessageEvent, TerminalOutputEvent (from `packages/shared/src/events.ts`)
- Pattern: Each event has `type` field that narrows the event to specific structure
- Used by: WebSocket broadcasts, event storage, client message handlers
- Purpose: Core domain models representing orchestration state
- Session: User's orchestration workspace (id, userId, cwd, status, createdAt, updatedAt, metadata)
- Chain: Sequence of steps within session (id, sessionId, status, steps[], commands[], inputs[])
- Used by: All session/chain operations, workflows
- Purpose: Track WebSocket client connections, subscriptions, rate limits
- Pattern: Singleton at `packages/backend/src/ws/clientRegistry.ts`
- Methods: register(), unregister(), subscribe(), unsubscribe(), broadcastToSession(), broadcastToAll()
- Used by: WebSocket handler, broadcast functions
## Entry Points
- Location: `packages/backend/src/index.ts`
- Triggers: `node packages/backend/dist/index.js` (or `pnpm dev:backend`)
- Responsibilities:
- Location: `packages/app/src/main.tsx`
- Triggers: `npm run dev` (Vite dev server at 5173)
- Responsibilities:
- Location: `packages/shared/src/index.ts`
- Purpose: Centralized export of types used by backend and frontend
- Contains: Domain types, branded strings, event types, commands, schemas
## Error Handling
## Cross-Cutting Concerns
- Backend: Console.log with `[Component]` prefix (e.g., `[WS]`, `[FileWatcher]`, `[HarmonyDetector]`)
- Frontend: console.log in development, error/warn for issues
- File: Optional file-based logging via FILE_LOG_ENABLED env var
- Backend: Zod schemas in `packages/backend/src/schemas/` (api.ts, ws.ts, etc.)
- Frontend: Form validation in component state + API response validation
- Shared: Contract validation (component-level contracts) in `packages/app/src/contracts/`
- Mechanism: API Key or Bearer token in Authorization header / x-api-key header
- Middleware: `packages/backend/src/middleware/auth.ts` - validates all HTTP requests
- WebSocket: Per-connection validation at upgrade + per-message re-validation
- Dev Mode: Optional (AFW_API_KEY env var not set = auth disabled)
- Session Ownership: If session has `user` field, client's userId must match
- Implemented in: `packages/backend/src/ws/handler.ts` (subscribe validation)
- HTTP: Per-IP rate limiting via `generalLimiter` middleware
- Session Create: Stricter limits via `sessionCreateLimiter`
- WebSocket: Per-client message rate limit tracking in clientRegistry
- Location: `packages/backend/src/middleware/rateLimit.ts`
- Gate Checkpoints: `packages/backend/src/services/gateCheckpoint.ts` - traces execution with ledger
- ConversationWatcher: Monitors Claude Code JSONL logs for gate compliance
- HealthScoreCalculator: Aggregates traces into health score
- Activity Tracking: `activityTracker` records user actions
<!-- GSD:architecture-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd:quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd:debug` for investigation and bug fixing
- `/gsd:execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd:profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
