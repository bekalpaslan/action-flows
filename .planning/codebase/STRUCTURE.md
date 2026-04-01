# Codebase Structure

**Analysis Date:** 2026-04-01

## Directory Layout

```
ActionFlowsDashboard/                         # Monorepo root
├── packages/                                  # pnpm workspaces
│   ├── shared/                                # Shared types & schemas
│   │   └── src/
│   │       ├── types.ts                       # Branded strings, domain types
│   │       ├── events.ts                      # WorkspaceEvent types
│   │       ├── models.ts                      # Session, Chain, User models
│   │       ├── commands.ts                    # Command types
│   │       ├── auth/                          # Auth types
│   │       ├── contract/                      # Contract validation schemas
│   │       ├── contracts/                     # Component contract types
│   │       ├── routing/                       # Routing types
│   │       ├── schemas/                       # Zod schemas for validation
│   │       └── index.ts                       # Central export
│   │
│   ├── backend/                               # Express server
│   │   └── src/
│   │       ├── index.ts                       # Entry point, Express setup
│   │       ├── middleware/                    # Cross-cutting concerns
│   │       │   ├── auth.ts                    # API key validation
│   │       │   ├── authorize.ts               # Authorization checks
│   │       │   ├── errorHandler.ts            # Global error handling
│   │       │   ├── rateLimit.ts               # Rate limiting
│   │       │   ├── validate.ts                # Request validation
│   │       │   └── __tests__/                 # Middleware tests
│   │       │
│   │       ├── routes/                        # HTTP endpoints (40+ files)
│   │       │   ├── sessions.ts                # Session CRUD
│   │       │   ├── commands.ts                # Command queueing
│   │       │   ├── files.ts                   # File operations
│   │       │   ├── harmony.ts                 # Harmony metrics
│   │       │   ├── flows.ts                   # Flow definitions
│   │       │   ├── artifacts.ts               # Artifact storage
│   │       │   ├── dossiers.ts                # Intel dossiers
│   │       │   ├── registry.ts                # Registry operations
│   │       │   ├── contracts.ts               # Contract validation
│   │       │   ├── surfaces/                  # Surface integrations
│   │       │   │   └── slack.ts               # Slack notifications
│   │       │   ├── discovery.ts               # Session discovery
│   │       │   ├── universe.ts                # Universe graph
│   │       │   ├── terminal.ts                # Terminal output
│   │       │   ├── events.ts                  # Event streaming
│   │       │   ├── claudeCli.ts               # Claude CLI integration
│   │       │   └── __tests__/                 # Route tests
│   │       │
│   │       ├── services/                      # Business logic (50+ files)
│   │       │   ├── harmonyDetector.ts         # Harmony violation detection
│   │       │   ├── gateCheckpoint.ts          # Execution gate tracing
│   │       │   ├── gateValidator.ts           # Gate compliance validation
│   │       │   ├── healingRecommendations.ts  # Healing recommendation engine
│   │       │   ├── healthScoreCalculator.ts   # Health aggregation
│   │       │   ├── sparkBroadcaster.ts        # Chain execution visualization
│   │       │   ├── fileWatcher.ts             # File system monitoring
│   │       │   ├── claudeCliManager.ts        # Claude CLI session mgmt
│   │       │   ├── discoveryService.ts        # Pattern discovery
│   │       │   ├── conversationWatcher.ts     # JSONL log monitoring
│   │       │   ├── personalityParser.ts       # Agent personality parsing
│   │       │   ├── agentValidator.ts          # Agent behavior validation
│   │       │   ├── registryStorage.ts         # Registry persistence
│   │       │   ├── bridgeStrengthService.ts   # Bridge strength tracking
│   │       │   ├── capabilityRegistry.ts      # Capability tracking
│   │       │   ├── activityTracker.ts         # User activity logging
│   │       │   ├── artifactParser.ts          # Artifact extraction
│   │       │   ├── checkpoints/               # Gate checkpoint implementations
│   │       │   └── __tests__/                 # Service tests
│   │       │
│   │       ├── storage/                       # Data persistence layer
│   │       │   ├── index.ts                   # Storage interface
│   │       │   ├── memory.ts                  # Memory backend (Maps)
│   │       │   ├── redis.ts                   # Redis backend
│   │       │   ├── resilientStorage.ts        # Circuit breaker wrapper
│   │       │   ├── file-persistence.ts        # File backup
│   │       │   └── __tests__/                 # Storage tests
│   │       │
│   │       ├── ws/                            # WebSocket handling
│   │       │   ├── handler.ts                 # Message routing & processing
│   │       │   ├── clientRegistry.ts          # Connection tracking
│   │       │   └── __tests__/                 # WebSocket tests
│   │       │
│   │       ├── schemas/                       # Zod validation schemas
│   │       │   ├── api.ts                     # REST API schemas
│   │       │   └── ws.ts                      # WebSocket message schemas
│   │       │
│   │       ├── types/                         # Backend-specific types
│   │       ├── utils/                         # Backend utilities
│   │       ├── cli/                           # CLI commands (contract validation)
│   │       ├── infrastructure/                # Infrastructure patterns
│   │       │   └── circuitBreaker.ts          # Circuit breaker implementation
│   │       ├── mcp/                           # MCP server integration
│   │       ├── routing/                       # Routing logic
│   │       └── __tests__/                     # Integration tests
│   │
│   ├── app/                                   # React frontend (Vite + Electron)
│   │   └── src/
│   │       ├── main.tsx                       # Vite entry point
│   │       ├── App.tsx                        # Root component with Providers
│   │       ├── index.css                      # Global styles
│   │       ├── contexts/                      # React Contexts (global state)
│   │       │   ├── WebSocketContext.tsx       # WebSocket connection
│   │       │   ├── SessionContext.tsx         # Session state management
│   │       │   ├── AuthContext.tsx            # User authentication
│   │       │   ├── WorkbenchContext.tsx       # Workbench windows
│   │       │   ├── UniverseContext.tsx        # Cosmic map
│   │       │   ├── HarmonyContext.tsx         # Harmony metrics
│   │       │   ├── DiscoveryContext.tsx       # Session discovery
│   │       │   ├── ChatWindowContext.tsx      # Chat/conversation
│   │       │   ├── TerminalContext.tsx        # Terminal output
│   │       │   ├── ThemeContext.tsx           # Theme management
│   │       │   ├── FeatureFlagsContext.tsx    # Feature toggles
│   │       │   ├── ToastContext.tsx           # Toast notifications
│   │       │   ├── VimNavigationContext.tsx   # Vim mode
│   │       │   └── __tests__/                 # Context tests
│   │       │
│   │       ├── hooks/                         # Custom React hooks (60+ files)
│   │       │   ├── useWebSocket.ts            # WebSocket connection hook
│   │       │   ├── useSessionControls.ts      # Session operations
│   │       │   ├── useChainState.ts           # Chain state management
│   │       │   ├── useChainEvents.ts          # Chain event subscriptions
│   │       │   ├── useFileTree.ts             # File tree state
│   │       │   ├── useTerminalEvents.ts       # Terminal event subscriptions
│   │       │   ├── useDossiers.ts             # Intel dossier operations
│   │       │   ├── useHarmonyMetrics.ts       # Harmony data fetching
│   │       │   ├── useHarmonyHealth.ts        # Health score tracking
│   │       │   ├── useFreshness.ts            # Freshness grade calculation
│   │       │   ├── useFlowBrowser.ts          # Flow exploration
│   │       │   ├── useDiscoveredSessions.ts   # Session discovery
│   │       │   ├── useAnalytics.ts            # Analytics data
│   │       │   ├── useErrors.ts               # Error tracking
│   │       │   ├── useAuth.ts                 # Auth operations
│   │       │   ├── useSessionInput.ts         # Session input queueing
│   │       │   ├── useCommandPalette.ts       # Command palette actions
│   │       │   ├── useKeyboardShortcuts.ts    # Keyboard event handling
│   │       │   ├── useVimNavigation.ts        # Vim mode navigation
│   │       │   ├── useServiceWorker.ts        # Service worker registration
│   │       │   ├── useNotifications.ts        # Notification management
│   │       │   ├── useGateTraces.ts           # Gate trace viewing
│   │       │   └── __tests__/                 # Hook tests
│   │       │
│   │       ├── components/                    # React components (50+ dirs)
│   │       │   ├── AppContent.tsx             # Main app layout
│   │       │   ├── AppSidebar/                # Sidebar navigation
│   │       │   ├── Dashboard/                 # Dashboard views
│   │       │   ├── CommandPalette/            # Command palette
│   │       │   ├── CommandCenter/             # Command center UI
│   │       │   ├── ConversationPanel/         # Chat interface
│   │       │   ├── ChainViz/                  # Chain visualization
│   │       │   ├── ChainDAG/                  # DAG visualization
│   │       │   ├── CosmicMap/                 # Universe map
│   │       │   ├── FileExplorer/              # File browser
│   │       │   ├── CodeEditor/                # Code editing
│   │       │   ├── ClaudeCliTerminal/         # Terminal emulator
│   │       │   ├── Harmony/                   # Harmony UI
│   │       │   ├── HarmonyPanel/              # Harmony details
│   │       │   ├── HarmonyHealthDashboard/   # Health visualization
│   │       │   ├── HarmonyIndicator/          # Health indicator
│   │       │   ├── HarmonyBadge/              # Status badge
│   │       │   ├── IntelDossier/              # Dossier UI
│   │       │   ├── FlowBrowser/               # Flow exploration
│   │       │   ├── FlowVisualization/         # Flow diagram
│   │       │   ├── Discovery/                 # Discovery interface
│   │       │   ├── Inspector/                 # Inspector panel
│   │       │   ├── ErrorModal/                # Error display
│   │       │   ├── ChangePreview/             # File diff viewer
│   │       │   ├── CustomPromptButton/        # Prompt button
│   │       │   ├── PersistentToolbar/         # Persistent controls
│   │       │   ├── SquadPanel/                # Agent UI
│   │       │   ├── Auth/                      # Login/auth UI
│   │       │   ├── layout/                    # Layout components
│   │       │   ├── common/                    # Shared components
│   │       │   ├── GateTraceViewer.tsx        # Gate trace display
│   │       │   ├── AnalyticsDashboard/        # Analytics view
│   │       │   ├── Figma/                     # Figma integration UI
│   │       │   └── __tests__/                 # Component tests
│   │       │
│   │       ├── services/                      # Frontend services
│   │       │   └── api/                       # API client methods
│   │       │
│   │       ├── stores/                        # State management (non-Context)
│   │       ├── utils/                         # Frontend utilities
│   │       ├── types/                         # Frontend-specific types
│   │       ├── contracts/                     # Component contracts
│   │       │   ├── hooks/                     # Hook contracts
│   │       │   └── contexts/                  # Context contracts
│   │       ├── config/                        # Configuration
│   │       ├── styles/                        # CSS
│   │       │   ├── themes/                    # Theme definitions
│   │       │   └── animations/                # Animation definitions
│   │       ├── capabilities/                  # Dashboard capability implementations
│   │       ├── systems/                       # System integrations
│   │       ├── data/                          # Static data
│   │       ├── electron/                      # Electron main process
│   │       ├── public/                        # Static assets
│   │       └── __tests__/                     # App tests
│   │
│   ├── hooks/                                 # Claude Code hook scripts
│   │   └── src/
│   │       ├── hooks/                         # Hook implementations
│   │       └── utils/                         # Hook utilities
│   │
│   ├── mcp-server/                            # MCP server for Claude integration
│   │   └── src/
│   │       └── index.ts                       # MCP server entry
│   │
│   └── second-opinion/                        # Review/audit agent
│       └── src/
│
├── test/                                      # End-to-end tests
│   ├── e2e/                                   # E2E test specs
│   ├── playwright.cosmic.config.ts            # Playwright config
│   └── curl-commands.sh                       # API test script
│
├── .claude/                                   # Project instructions
│   ├── CLAUDE.md                              # This project's Claude context
│   ├── actionflows/                           # ActionFlows framework docs
│   │   ├── ORCHESTRATOR.md                    # Orchestrator behavior
│   │   ├── project.config.md                  # Project configuration
│   │   ├── docs/                              # Architecture documentation
│   │   ├── FLOWS.md                           # Registered flows
│   │   ├── ACTIONS.md                         # Registered actions
│   │   ├── CONTEXTS.md                        # Routing contexts
│   │   ├── INDEX.md                           # Command registry
│   │   └── LEARNINGS.md                       # Discoveries & patterns
│   │
│   └── skills/                                # Custom skills
│
├── docs/                                      # Project documentation
│   ├── PROJECT_DASHBOARD.md                   # Feature status & roadmap
│   ├── DOCS_INDEX.md                          # Documentation index
│   └── [feature docs]/                        # Feature-specific docs
│
├── scripts/                                   # Build/dev scripts
│   ├── setup-hooks.sh                         # Git hook setup
│   ├── health-check.ts                        # Server health check
│   ├── toggle-provider.sh                     # Provider switching
│   └── validate-routing.ts                    # Routing validation
│
├── package.json                               # Workspace root (pnpm)
├── tsconfig.json                              # TypeScript config
├── .gitignore                                 # Git ignore rules
├── .gitattributes                             # Line ending rules
├── .husky/                                    # Git hooks
└── .actionflows-snapshot/                     # Snapshot backups
```

## Directory Purposes

**packages/shared/**
- Purpose: Single source of truth for types consumed by backend and frontend
- Contains: Branded types, domain models, event schemas, command types, validation schemas
- Key files: `types.ts` (branded strings), `events.ts` (WorkspaceEvent), `models.ts` (Session/Chain)

**packages/backend/src/routes/**
- Purpose: HTTP endpoint handlers
- Contains: 40+ Express routers for different domains (sessions, commands, harmony, flows, etc.)
- Pattern: Each route file imports services and storage, validates input with Zod, calls service methods, returns JSON
- Key files: `sessions.ts` (session CRUD), `commands.ts` (command queueing), `harmony.ts` (metrics endpoints)

**packages/backend/src/services/**
- Purpose: Business logic, state transitions, external integrations
- Contains: Domain services (HarmonyDetector, GateCheckpoint, SparkBroadcaster, etc.)
- Key files: `harmonyDetector.ts` (violation detection), `gateCheckpoint.ts` (execution tracing), `fileWatcher.ts` (FS monitoring)

**packages/backend/src/storage/**
- Purpose: Data persistence layer—abstracts Memory vs. Redis
- Contains: Storage interface, in-memory implementation, Redis implementation
- Key files: `index.ts` (interface—all services use this), `memory.ts` (dev), `redis.ts` (prod)

**packages/backend/src/ws/**
- Purpose: WebSocket message routing and client connection management
- Contains: Message handler, client registry
- Key files: `handler.ts` (subscribe/unsubscribe/input logic), `clientRegistry.ts` (connection tracking, broadcasting)

**packages/app/src/contexts/**
- Purpose: React global state via Contexts
- Contains: Providers for WebSocket, Session, Auth, Universe, Harmony, Discovery, etc.
- Pattern: Each context exported with useContextHook for access in components
- Key files: `WebSocketContext.tsx` (connection), `SessionContext.tsx` (all sessions), `AuthContext.tsx` (user)

**packages/app/src/hooks/**
- Purpose: Reusable stateful logic
- Contains: 60+ custom hooks for API calls, state management, event subscriptions
- Pattern: Hooks use useContext (Contexts) + fetch() or WebSocket messaging
- Key files: `useWebSocket.ts` (raw WebSocket), `useSessionControls.ts` (CRUD), `useChainEvents.ts` (subscriptions)

**packages/app/src/components/**
- Purpose: UI components
- Contains: 50+ component directories organized by feature (Harmony, ChainViz, Inspector, etc.)
- Pattern: Components consume Contexts via useContext(), call hooks, render UI

## Key File Locations

**Entry Points:**
- `packages/backend/src/index.ts` - Express server initialization (routes, WebSocket, services)
- `packages/app/src/main.tsx` - React DOM render entry
- `packages/app/src/App.tsx` - Root component (Context Providers)

**Configuration:**
- `package.json` - Workspace and root scripts
- `packages/backend/package.json` - Backend dependencies
- `packages/app/package.json` - Frontend dependencies
- `.env`, `.env.local` - Environment variables (development)
- `.claude/actionflows/project.config.md` - Project-specific orchestrator config

**Core Logic:**
- `packages/shared/src/` - All domain types and interfaces
- `packages/backend/src/storage/index.ts` - Central storage interface
- `packages/backend/src/ws/clientRegistry.ts` - WebSocket client tracking & broadcasting
- `packages/app/src/contexts/WebSocketContext.tsx` - Frontend WebSocket connection

**Testing:**
- `packages/backend/src/__tests__/` - Integration & feature tests
- `packages/app/src/__tests__/` - Component & utility tests
- `test/e2e/` - End-to-end Playwright specs

## Naming Conventions

**Files:**
- Components: PascalCase (e.g., `SessionPanel.tsx`, `ChainViz.tsx`)
- Hooks: camelCase with `use` prefix (e.g., `useSessionControls.ts`, `useChainState.ts`)
- Services: camelCase (e.g., `harmonyDetector.ts`, `fileWatcher.ts`)
- Routes: camelCase (e.g., `sessions.ts`, `commands.ts`)
- Types/Interfaces: camelCase (e.g., `sessionTypes.ts`, `harmonyTypes.ts`)
- Tests: Same name + `.test.ts` or `__tests__/[name].test.ts`

**Directories:**
- Feature directories: PascalCase (e.g., `Harmony/`, `ChainViz/`, `FileExplorer/`)
- Utility/service directories: camelCase (e.g., `services/`, `utils/`, `hooks/`)
- System directories: lowercase (e.g., `storage/`, `routes/`, `schemas/`, `middleware/`)

**Functions/Methods:**
- Actions: verb-noun camelCase (e.g., `createSession()`, `deleteChain()`, `broadcastEvent()`)
- Getters: `get[Noun]()` (e.g., `getSession()`, `getChains()`)
- Setters: `set[Noun]()` (e.g., `setSession()`)
- Handlers: `handle[Noun]()` or `on[Event]()` (e.g., `handleWebSocket()`, `onMessage()`)
- Hooks: `use[Noun]()` (e.g., `useSessionControls()`)

**Variables/Constants:**
- Session/Chain IDs: UPPERCASE_SNAKE_CASE (e.g., `SESSION_ID`, `CHAIN_ID`)
- Enums: UPPERCASE_SNAKE_CASE (e.g., `Status.PENDING`, `CircuitState.OPEN`)
- URLs: lowerCamelCase (e.g., `apiBaseUrl`, `wsUrl`)
- React state: lowerCamelCase (e.g., `sessionList`, `activeChainId`)

## Where to Add New Code

**New Feature:**
- Primary code: `packages/backend/src/routes/[feature].ts` (HTTP endpoints) + `packages/backend/src/services/[feature].ts` (logic)
- Frontend: `packages/app/src/components/[Feature]/` (UI) + `packages/app/src/hooks/use[Feature].ts` (logic)
- Shared types: `packages/shared/src/[feature]Types.ts` (if new domain types needed)
- Tests: `packages/backend/src/routes/__tests__/[feature].test.ts` + `packages/app/src/components/[Feature]/__tests__/`

**New Component/Module:**
- React component: `packages/app/src/components/[ComponentName]/index.tsx` or `[ComponentName].tsx`
- Component styles: Co-located `[ComponentName].css` or `styles/` subdirectory
- Custom hook: `packages/app/src/hooks/use[HookName].ts`
- Context: `packages/app/src/contexts/[FeatureContext].tsx`
- Service: `packages/backend/src/services/[serviceName].ts` (singleton pattern, export getter function)

**Utilities:**
- Shared helpers: `packages/shared/src/` (if used by both backend & frontend) or specific package `utils/` directory
- Backend utils: `packages/backend/src/utils/[utilName].ts`
- Frontend utils: `packages/app/src/utils/[utilName].ts`
- Hook utilities: `packages/app/src/hooks/__tests__/helpers.ts`

**API Routes:**
- Location: `packages/backend/src/routes/[feature].ts`
- Pattern: Export Router with `const router = Router(); router.get(...); export default router;`
- Register in: `packages/backend/src/index.ts` - `app.use('/api/[feature]', [feature]Router)`
- Validation: Use Zod schema from `packages/backend/src/schemas/api.ts`
- Error handling: Let global error handler catch, or catch and call `sanitizeError()`

**Tests:**
- Location:
  - Services: `packages/backend/src/services/__tests__/[service].test.ts`
  - Routes: `packages/backend/src/routes/__tests__/[route].test.ts`
  - Components: `packages/app/src/components/[Component]/__tests__/[Component].test.tsx`
- Framework: Vitest (backend), Vitest + React Testing Library (frontend)
- Pattern: Use mocking for external services, test behavior not implementation

## Special Directories

**packages/backend/.actionflows-snapshot/**
- Purpose: Snapshot backups for MemoryStorage persistence
- Generated: Yes (by SnapshotService on shutdown)
- Committed: No (in .gitignore)

**packages/app/dist/ & packages/app/dist-electron/**
- Purpose: Build outputs
- Generated: Yes (by `pnpm build`)
- Committed: No

**packages/app/electron/**
- Purpose: Electron main process code (desktop app wrapper)
- Generated: No
- Committed: Yes

**.claude/actionflows/**
- Purpose: ActionFlows framework documentation and project configuration
- Generated: Partially (LEARNINGS.md auto-updated)
- Committed: Yes

**test/e2e/**
- Purpose: End-to-end test specs using Playwright
- Generated: No
- Committed: Yes

---

*Structure analysis: 2026-04-01*
