# Implementation Plan: FRD & SRD Documentation for ActionFlows Dashboard

**Generated:** 2026-02-08T17:07:45Z
**Planning Agent:** Sonnet 4.5
**Scope:** Create comprehensive Functional Requirements Document (FRD) and Software Requirements Document (SRD)
**Input Analysis:** 6 analysis files from frd-srd-analysis_2026-02-08-16-56-16/ (~300KB)

---

## Overview

This plan outlines the creation of two authoritative documents:

1. **FRD (Functional Requirements Document):** Project overview, user stories, feature catalog, functionality per package, improvement backlog
2. **SRD (Software Requirements Document):** System architecture, technical specifications, API contracts, data models, framework philosophy, non-functional requirements

Both documents will:
- Synthesize findings from 6 detailed analysis files (backend, frontend, shared+mcp, framework, ollama)
- Capture **all current functionality** with status markers (✅ Complete, ⏳ Partial, 🚧 TODO)
- Flag **improvement areas and gaps** identified in analyses
- Explain **framework philosophy** (delegation-first, "it's a sin" metaphor)
- Serve as authoritative reference for development, onboarding, and architectural decisions

**Deliverables:**
- `docs/FRD.md` — Functional Requirements Document (~8,000-12,000 words)
- `docs/SRD.md` — Software Requirements Document (~10,000-15,000 words)
- Both documents structured for maintainability (TOC, clear sections, improvement flags)

---

## Steps

### Step 1: Design FRD Structure
**Package:** docs/
**Files:** Design document structure outline (internal planning step)
**Changes:**
- Design comprehensive FRD structure covering:
  1. **Executive Summary** — Project vision, status, key metrics
  2. **Project Overview** — What ActionFlows Dashboard is, why it exists, who uses it
  3. **Framework Philosophy** — Delegation-first model, "it's a sin" metaphor, orchestrator vs. agent boundaries
  4. **User Personas & Stories** — Roles (orchestrator, developer, observer), workflows
  5. **Functional Areas by Package:**
     - **Backend Package** — 11 API routes, WebSocket, storage, services, middleware (from backend-analysis.md)
     - **Frontend Package** — 96 files, 41 components, 25 hooks, visualization modes (from frontend-analysis.md)
     - **Shared Package** — 108 type exports, 26 event types, 9 command types (from shared-mcp-analysis.md)
     - **MCP Server** — 2 tools, command polling (from shared-mcp-analysis.md)
     - **ActionFlows Framework** — Flows, actions, agents, orchestration lifecycle (from framework-analysis.md)
  6. **Feature Catalog** — Complete inventory with status markers (✅/⏳/🚧)
  7. **Improvement Backlog** — Gaps and enhancement opportunities organized by priority
  8. **Non-Functional Requirements Preview** — Performance, security, scalability considerations
  9. **Glossary** — Domain terms (SessionId, ChainId, StepNumber, branded types, etc.)
- Include TOC with deep linking for navigation
- Use tables extensively for readability and scanability
- Flag improvement areas inline with 🔧/⚠️ markers

**Depends on:** Nothing
**Output:** FRD structure outline (internal)

---

### Step 2: Design SRD Structure
**Package:** docs/
**Files:** Design document structure outline (internal planning step)
**Changes:**
- Design comprehensive SRD structure covering:
  1. **System Architecture Overview**
     - Monorepo structure (pnpm workspaces, 5 packages)
     - Data flow: Orchestrator → Backend → Frontend
     - WebSocket architecture (subscription model)
     - Storage layer (dual-mode: Memory + Redis)
  2. **Technical Specifications by Package:**
     - **Backend Technical Spec:**
       - Express 4.18 + TypeScript + ws 8.14.2
       - 38 API endpoints across 11 routes
       - Middleware stack (auth, rate limiting, validation)
       - Security features (API key auth, path validation, CORS)
       - Storage interface and implementations
       - Service layer (Claude CLI, file watcher, project detector, etc.)
     - **Frontend Technical Spec:**
       - React 18.2 + TypeScript 5.4 + Vite 5 + Electron 28
       - Component architecture (41 components, 21 directories)
       - Hook-based state management (25 custom hooks)
       - WebSocket context and real-time event handling
       - Visualization technologies (ReactFlow, Monaco, xterm)
       - Services and utilities
     - **Shared Package Technical Spec:**
       - Branded type system (7 branded types)
       - Event system (26 event types, discriminated union)
       - Command system (9 command types, validation, builders)
       - Domain models (Chain, Session, ExecutionPlan, etc.)
       - Type export strategy (108 exports)
     - **MCP Server Technical Spec:**
       - Model Context Protocol 1.0
       - Tool definitions (check_commands, ack_command)
       - Backend integration pattern
       - Type safety gaps and recommendations
  3. **API Contracts:**
     - REST API endpoint catalog (38 endpoints with schemas)
     - WebSocket message types (subscribe, event, command, etc.)
     - MCP tool specifications
  4. **Data Models:**
     - Core entities (Session, Chain, Step, User)
     - Event types catalog (26 types with schemas)
     - Command types catalog (9 types with schemas)
     - Storage schemas (Map structures, eviction policies)
  5. **Framework Philosophy & Design Patterns:**
     - "It's a sin" metaphor (orchestrator boundaries)
     - Delegation model (orchestrator vs. agent responsibilities)
     - Session-start protocol (forcing function)
     - Proactive coordination (step boundary evaluation)
     - Agent identity isolation (three-layer defense)
     - Spawn pattern (standardized agent invocation)
     - Flow structure (sequential, gates, loops)
     - Learning capture (Fresh Eye discoveries)
  6. **Non-Functional Requirements:**
     - Performance: Rate limits, event eviction, pagination needs
     - Security: Authentication, path validation, sanitization
     - Scalability: Redis pub/sub, storage bounds, client limits
     - Reliability: Graceful degradation, error handling, cleanup
     - Maintainability: Type safety, code organization, testing gaps
  7. **Deployment & Operations:**
     - Build process (pnpm workspaces)
     - Port configuration (backend=3001, vite=5173)
     - Environment variables
     - Electron build targets (Windows, macOS, Linux)
  8. **Testing Strategy:**
     - Current coverage (integration tests only)
     - Recommended approach (unit, integration, E2E)
  9. **Improvement Roadmap:**
     - Technical debt items from analyses
     - Type safety enhancements (MCP server)
     - Missing features (pagination, validation results)
     - Performance optimizations (virtualization, memoization)
  10. **Glossary & Appendices:**
      - Technical term definitions
      - Dependency versions
      - File structure reference

**Depends on:** Nothing
**Output:** SRD structure outline (internal)

---

### Step 3: Write FRD — Project Overview & Philosophy
**Package:** docs/
**Files:** `docs/FRD.md` (initial creation with sections 1-3)
**Changes:**
- Create `docs/FRD.md`
- Write **Executive Summary:**
  - Project vision: Real-time monitoring and control dashboard for AI agent orchestration
  - Status: ~85% complete (core features working, polish/analytics screens pending)
  - Key metrics: 11 backend routes, 38 API endpoints, 96 frontend files, 41 components, 25 hooks
- Write **Project Overview:**
  - What: Dashboard for visualizing and controlling ActionFlows orchestration sessions
  - Why: Enables visibility into delegation-based AI workflows, command/control of execution chains
  - Who: AI researchers, orchestrator operators, developers working with Claude Code
  - Core capabilities: Session monitoring, chain visualization (DAG/timeline), terminal integration, file editing, CLI control
- Write **Framework Philosophy:**
  - **"It's a Sin" Metaphor:** Orchestrator must delegate, never produce content directly
  - **Delegation Model:** Orchestrator compiles chains, spawns agents; agents execute without further delegation
  - **Session-Start Protocol:** Forces routing mode instead of help mode
  - **Proactive Coordination:** Autonomous chain execution with step boundary evaluation
  - **Identity Isolation:** Three-layer defense prevents orchestrator/agent confusion
  - **Spawn Pattern:** Standardized agent invocation with context injection
  - **Learning Capture:** Agents report Fresh Eye discoveries, orchestrator owns fixes
- Source key insights from framework-analysis.md (philosophy sections)
- Include visual diagram of orchestration lifecycle if beneficial

**Depends on:** Step 1 (FRD structure design)
**Output:** `docs/FRD.md` with sections 1-3 complete

---

### Step 4: Write FRD — User Personas & Stories
**Package:** docs/
**Files:** `docs/FRD.md` (continue writing section 4)
**Changes:**
- Write **User Personas & Stories:**
  - **Persona 1: Orchestrator Operator**
    - Needs: Monitor active sessions, approve chains, control execution (pause/resume/cancel)
    - Workflows: Session start → routing → chain approval → execution monitoring → result review
  - **Persona 2: Developer**
    - Needs: Inspect session details, review agent outputs, debug failed steps, edit files inline
    - Workflows: Attach to session → inspect step I/O → edit files → review terminal output → retry failed steps
  - **Persona 3: Observer/Auditor**
    - Needs: Review session history, analyze execution patterns, assess agent performance
    - Workflows: Browse archives → load session snapshot → review chains → export results
- Include user story examples for each workflow
- Map user needs to feature areas (visualization, controls, inspection, history)

**Depends on:** Step 3
**Output:** `docs/FRD.md` with section 4 complete

---

### Step 5: Write FRD — Functional Areas (Backend)
**Package:** docs/
**Files:** `docs/FRD.md` (continue writing section 5.1)
**Changes:**
- Write **Functional Areas — Backend Package:**
  - **API Routes Inventory:**
    - Sessions Route: 8 endpoints (CRUD, input polling, awaiting state) — ✅ Complete with 1 TODO (awaiting broadcast)
    - Commands Route: 3 endpoints (queue, poll, ack) — ⏳ Partial (ACK is stub)
    - Events Route: 4 endpoints (post, get, since, recent) — ✅ Complete
    - Users Route: 2 endpoints (list, get sessions) — ✅ Complete with consolidation opportunity
    - History Route: 5 endpoints (dates, sessions, load, stats, cleanup) — ✅ Complete
    - Files Route: 4 endpoints (tree, read, write, diff) — ⏳ Partial (diff incomplete)
    - Terminal Route: 3 endpoints (output, buffer, clear) — ✅ Complete
    - Claude CLI Route: 5 endpoints (start, input, stop, status, list) — ✅ Complete
    - Session Windows Route: 5 endpoints (list, enriched, follow, unfollow, config) — ✅ Complete
    - Projects Route: 6 endpoints (list, detect, get, create, update, delete) — ✅ Complete
    - Discovery Route: 1 endpoint (discover sessions) — ✅ Complete
  - **WebSocket Implementation:**
    - Message types: subscribe, unsubscribe, input, ping, subscription_confirmed, event, command, error
    - Security: API key validation, rate limiting (50 msgs/sec), session ownership
    - Client registry: Max 1000 clients, subscription management
  - **Storage Layer:**
    - Dual backends: MemoryStorage (dev), RedisStorage (prod)
    - Operations: Sessions, Chains, Events, Commands, Input queues, Clients, FollowedSessions, SessionWindowConfigs
    - Bounds: 10K events/session, 100 chains/session, 1000 sessions total
  - **Services:**
    - Claude CLI Manager: Process control, env validation, MCP config
    - File Watcher: Change detection with step attribution
    - Project Detector: Auto-detect project type
    - Claude Session Discovery: IDE lock file scanning
    - Terminal Buffer: FIFO output buffering
    - Cleanup Service: History file retention
  - **Middleware:**
    - Authentication: API key with Bearer/query/header support
    - Error Handler: Sanitized error responses
    - Rate Limiting: General (100/15min), write (50/min), session create (10/min)
    - Validation: Zod schema validation
    - Path Validation: Traversal prevention, symlink resolution
- **Improvement Areas:**
  - 🔧 WebSocket broadcast for awaiting input (TODO at sessions.ts:359)
  - 🔧 File diff implementation (missing snapshots)
  - 🔧 Command ACK persistence (results logged but not stored)
  - 🔧 Redis session listing (no key scan)
  - 🔧 Duplicate user routes (consolidation needed)
- Source: backend-analysis.md sections 1-11

**Depends on:** Step 4
**Output:** `docs/FRD.md` with section 5.1 complete

---

### Step 6: Write FRD — Functional Areas (Frontend)
**Package:** docs/
**Files:** `docs/FRD.md` (continue writing section 5.2)
**Changes:**
- Write **Functional Areas — Frontend Package:**
  - **Component Inventory (41 components, 21 directories):**
    - **Layout & Structure (3 components):**
      - AppContent: Main layout with tab navigation — ✅ Complete
      - SplitPaneLayout: Dynamic 1-6 session grid — ✅ Complete
      - SessionPane: Single session display — ✅ Complete
    - **Visualization & Flow (7 components):**
      - FlowVisualization: ReactFlow with swimlanes — ✅ Complete
      - AnimatedStepNode: Custom node with animations — ✅ Complete
      - AnimatedFlowEdge: Custom edge with flow animation — ✅ Complete
      - SwimlaneBackground: Visual grouping — ✅ Complete
      - TimelineView: Sequential timeline — ✅ Complete
      - ChainDAG: Legacy DAG (being replaced) — ⏳ Partial
      - ChainBadge: Status badge — ✅ Complete
    - **Session & User Management (7 components):**
      - UserSidebar: User/session selection — ✅ Complete
      - SessionTree: Hierarchical session tree — ✅ Complete
      - SessionWindowSidebar: Session window mode sidebar — ✅ Complete
      - SessionWindowGrid: Session tiles layout — ✅ Complete
      - SessionArchive: Historical sessions — ⏳ Partial (missing filters/export)
    - **Code Editor & File Explorer (7 components):**
      - CodeEditor: Multi-tab Monaco editor — ✅ Complete
      - EditorTabs: Tab management — ✅ Complete
      - ConflictDialog: Edit conflict resolution — ✅ Complete
      - DiffView: Side-by-side diff — ✅ Complete
      - FileExplorer: Tree navigation — ✅ Complete
      - FileTree: Recursive file tree — ✅ Complete
      - FileIcon: Type icons — ✅ Complete
    - **Terminal & CLI (7 components):**
      - TerminalPanel: xterm.js container — ⏳ Partial (single-session reference)
      - TerminalTabs: Multi-session terminal — ✅ Complete
      - ClaudeCliTerminal: Interactive CLI — ✅ Complete
      - ClaudeCliStartDialog: Session creation — ✅ Complete
      - ProjectSelector: Project selection — ✅ Complete
      - ProjectForm: Project details form — ✅ Complete
      - DiscoveredSessionsList: Auto-discovered sessions — ✅ Complete
    - **Inspection & Details (3 components):**
      - StepInspector: Step detail viewer — ✅ Complete
      - ConversationPanel: User input interface — ✅ Complete
      - NotificationManager: Background notifications — ✅ Complete
    - **Controls & Actions (4 components):**
      - ControlButtons: Session control panel — ✅ Complete
      - QuickActionBar: Quick access actions — ✅ Complete
      - QuickActionButton: Individual action button — ✅ Complete
      - QuickActionSettings: Configure quick actions — ✅ Complete
    - **Specialized Components (3 components):**
      - Toast: Toast messages — ✅ Complete
      - ChainDemo: Demo component — 🚧 Stub
      - ChainLiveMonitor: Live monitoring — 🚧 Stub
      - HistoryBrowser: Session history — 🚧 Stub
      - WebSocketTest: Dev testing — 🚧 Debug
  - **Hooks Inventory (25 custom hooks):**
    - WebSocket & Events: useWebSocket, useWebSocketContext, useEvents, useLatestEvent, useFilteredEvents, useEventStats
    - Chain & Session State: useChainState, useChainEvents, useChainEventSummary
    - Session Management: useUsers, useUserSessions, useAttachedSessions, useAllSessions, useSessionWindows
    - File & Editor: useFileTree, useEditorFiles, useFileSyncManager
    - Terminal & CLI: useTerminalEvents, useClaudeCliControl, useClaudeCliSessions, useDiscoveredSessions
    - User & Archive: useSessionInput, useSessionArchive, useProjects
    - UI Effects: useNotifications, useKeyboardShortcuts, useFlowAnimations, useStreamJsonEnrichment
  - **Contexts:** WebSocketContext (global connection state)
  - **Services:** ClaudeCliService (API client), ProjectService (API client)
  - **Utilities:** 5 modules (chainTypeDetection, contextPatternMatcher, sessionLifecycle, streamJsonParser, swimlaneLayout)
- **Implementation Status:**
  - ✅ ~85% Complete: Core architecture, all major components, real-time integration
  - ⏳ Partial (6 features): Session archive, DAG viz, keyboard shortcuts, live monitoring, history browser
  - 🚧 TODO (5 screens): Dashboard, Flows, Actions, Logs, Settings
- **Improvement Areas:**
  - 🔧 Complete Dashboard screens (Flows, Actions, Logs, Settings) — 3-4 weeks per screen
  - 🔧 Session archive enhancements (filters, export, comparison) — 2 weeks
  - 🔧 Performance optimization (virtualization for large lists) — 1-2 weeks
  - 🔧 UX enhancements (keyboard shortcuts, error boundaries, confirmations) — 2-3 weeks
  - 🔧 Accessibility improvements (ARIA labels, keyboard nav) — 1-2 weeks
  - 🔧 Advanced editor features (find/replace, formatting, multi-cursor) — 1-2 weeks
- Source: frontend-analysis.md sections 1-9, appendices

**Depends on:** Step 5
**Output:** `docs/FRD.md` with section 5.2 complete

---

### Step 7: Write FRD — Functional Areas (Shared + MCP + Framework)
**Package:** docs/
**Files:** `docs/FRD.md` (continue writing sections 5.3, 5.4, 5.5)
**Changes:**
- Write **Functional Areas — Shared Package:**
  - **Type System:** 108 exports, 149 type definitions
  - **Branded Types:** 7 types (SessionId, ChainId, StepId, StepNumber, UserId, Timestamp, DurationMs)
  - **Enumerations:** 5 enums (Status, Model, ChainSource, SessionState, PromptType)
  - **Domain Models:** 12+ entities (Chain, Session, ExecutionPlan, ChainStep, etc.)
  - **Event System:** 26 event types in discriminated union, 17 type guards
  - **Command System:** 9 command types, CommandValidator, CommandBuilder, 6 type guards
  - **Session Windows:** 7 UI state types (SessionWindowState, QuickActionDefinition, FlowNodeData, etc.)
  - **Project Registry:** 3 types (ProjectId, Project, ProjectAutoDetectionResult)
  - Source: shared-mcp-analysis.md sections A, B
- Write **Functional Areas — MCP Server:**
  - **Protocol:** Model Context Protocol 1.0
  - **Tools (2 current):**
    - check_commands: Poll pending control commands for session
    - ack_command: Acknowledge command processing with result
  - **Backend Communication:** HTTP fetch to localhost:3001
  - **Status:** ✅ Functional but minimal
  - **Improvement Areas:**
    - 🔧 Type safety gap: No imports from @afw/shared (uses local interfaces)
    - 🔧 Limited tool surface: Only 2 tools when event/session system is much larger
    - 🔧 Recommended expansion: list_sessions, get_session, get_events, subscribe_events
  - Source: shared-mcp-analysis.md section "MCP Server Implementation"
- Write **Functional Areas — ActionFlows Framework:**
  - **Philosophy:** "It's a sin" metaphor, delegation-first orchestration
  - **Organization:** 3 departments (Framework, Engineering, QA)
  - **Flows:** 9 flows (flow-creation, action-creation, code-and-review, bug-triage, etc.)
  - **Actions:** 13 actions (7 generic, 2 stack-specific, 4 abstract)
  - **Agents:** 7 agent definitions (analyze, code, review, plan, audit, commit, test)
  - **Abstract Behaviors:** agent-standards (11 principles), create-log-folder, post-completion, update-queue
  - **Execution History:** logs/INDEX.md (1 execution recorded), logs/LEARNINGS.md (4 learnings)
  - **Checklists:** Structure exists (functional/, technical/), but no checklists implemented yet
  - **Status:** ✅ Structurally sound, 100% registry-to-filesystem alignment
  - **Improvement Areas:**
    - 🔧 Flow coverage gaps: performance-tune/, docs-update/, test-coverage-sweep/, security-patch/
    - 🔧 Checklist implementation: Structure exists, content pending
  - Source: framework-analysis.md sections 1-20

**Depends on:** Step 6
**Output:** `docs/FRD.md` with sections 5.3, 5.4, 5.5 complete

---

### Step 8: Write FRD — Feature Catalog & Improvement Backlog
**Package:** docs/
**Files:** `docs/FRD.md` (continue writing sections 6, 7)
**Changes:**
- Write **Feature Catalog:**
  - Comprehensive table of all features across packages
  - Columns: Feature, Component/Module, Package, Status (✅/⏳/🚧), Notes
  - Categories:
    - API & Backend Services
    - WebSocket & Real-time
    - Storage & Persistence
    - Frontend Layout & Navigation
    - Visualization (DAG, Timeline, Grid)
    - Session & User Management
    - Code Editor & File Management
    - Terminal & CLI Integration
    - Step Inspection & Details
    - Controls & Commands
    - Notifications & Feedback
    - Orchestration Framework
    - Type System & Contracts
    - MCP Tools
  - Source: Synthesize from all analysis files
- Write **Improvement Backlog:**
  - Organize by priority: HIGH, MEDIUM, LOW
  - Each item includes: Area, Issue, Impact, Effort Estimate, Source
  - HIGH PRIORITY items:
    - Complete Dashboard screens (5 screens, 3-4 weeks each)
    - Session archive enhancements (2 weeks)
    - Performance optimization (1-2 weeks)
    - Type safety for MCP server (1 week)
    - File diff implementation (1 week)
    - Command ACK persistence (1 week)
  - MEDIUM PRIORITY items:
    - UX enhancements (2-3 weeks)
    - Accessibility improvements (1-2 weeks)
    - Advanced editor features (1-2 weeks)
    - Backend command validation (1 week)
    - Event handler mapping (1 week)
    - Redis session listing (1 week)
  - LOW PRIORITY items:
    - Theme customization (1 week)
    - Analytics & insights (2-3 weeks)
    - Export & reporting (2 weeks)
    - Missing flows (performance-tune, docs-update, etc.)
    - Checklist implementation
  - Source: Improvement sections from all analysis files

**Depends on:** Step 7
**Output:** `docs/FRD.md` with sections 6, 7 complete

---

### Step 9: Write FRD — Non-Functional Requirements Preview & Glossary
**Package:** docs/
**Files:** `docs/FRD.md` (complete final sections 8, 9)
**Changes:**
- Write **Non-Functional Requirements Preview:**
  - Brief overview of non-functional concerns (detailed in SRD)
  - Performance: Rate limits, event eviction, pagination needs
  - Security: API key auth, path validation, CORS, sanitization
  - Scalability: WebSocket client limits (1000), storage bounds, Redis pub/sub
  - Reliability: Graceful degradation, error handling, cleanup services
  - Maintainability: Type safety, code organization, testing gaps
  - Usability: Real-time feedback, intuitive controls, visualization clarity
- Write **Glossary:**
  - Define domain terms and branded types
  - SessionId, ChainId, StepId, StepNumber, UserId, Timestamp, DurationMs
  - Chain, Step, Session, User, Command, Event
  - Orchestrator, Agent, Spawn, Human Gate, Fresh Eye
  - DAG (Directed Acyclic Graph), Timeline, Swimlane
  - WebSocket Subscription, Event Broadcasting
  - MCP (Model Context Protocol), Tool
  - ReactFlow, Monaco Editor, xterm.js
- Add TOC (Table of Contents) at top of document with deep links
- Finalize document formatting and review for consistency

**Depends on:** Step 8
**Output:** `docs/FRD.md` COMPLETE

---

### Step 10: Write SRD — System Architecture Overview
**Package:** docs/
**Files:** `docs/SRD.md` (initial creation with section 1)
**Changes:**
- Create `docs/SRD.md`
- Write **System Architecture Overview:**
  - **Monorepo Structure:** pnpm workspaces with 5 packages (backend, app, shared, mcp-server, hooks)
  - **Architecture Diagram:** ASCII or Mermaid diagram showing:
    - Human/Orchestrator → Backend API + WebSocket → Frontend Dashboard
    - Shared types as contract layer
    - MCP server as external integration point
    - Electron desktop wrapper
  - **Data Flow Model:**
    - Orchestrator compiles chain → POST /api/chains → Backend stores → Broadcasts ChainCreated event → Frontend updates ReactFlow
    - Agent completes step → POST /api/events → Backend stores → Broadcasts StepCompleted event → Frontend updates node status
    - User clicks "Approve Chain" → POST /api/chains/{id}/approve → Backend updates status → Broadcasts ChainApproved → Orchestrator receives signal
    - Frontend subscribes to session → WebSocket subscribe message → Backend validates → Registers subscription → Broadcasts events to subscriber
  - **WebSocket Architecture:**
    - Subscription-based model (client subscribes to specific sessions)
    - Message types: subscribe, unsubscribe, input, ping, event, command, error
    - Client registry: Max 1000 clients, subscription tracking per client
    - Security: API key validation per message, session ownership checks
    - Rate limiting: 50 msgs/sec per client
  - **Storage Layer Architecture:**
    - Dual-mode: MemoryStorage (dev, sync) vs. RedisStorage (prod, async + pub/sub)
    - Unified Storage interface for backend routes
    - Storage operations: Sessions, Chains, Events, Commands, Input queues, Clients, FollowedSessions, Configs
    - Eviction policies: 10K events/session (FIFO), 100 chains/session (FIFO), 1000 sessions total (oldest completed/failed)
  - **Tech Stack Summary:**
    - Backend: Express 4.18 + TypeScript + ws 8.14.2 + ioredis 5.3 + Zod
    - Frontend: React 18.2 + TypeScript 5.4 + Vite 5 + Electron 28 + ReactFlow 11.10 + Monaco 4.7 + xterm 5.3
    - Shared: TypeScript branded types, discriminated unions
    - MCP: Model Context Protocol 1.0 (StdioServerTransport)
- Source: backend-analysis.md (architecture section), frontend-analysis.md (tech stack), shared-mcp-analysis.md (type dependency graph)

**Depends on:** Step 9 (FRD complete)
**Output:** `docs/SRD.md` with section 1 complete

---

### Step 11: Write SRD — Backend Technical Spec
**Package:** docs/
**Files:** `docs/SRD.md` (continue writing section 2.1)
**Changes:**
- Write **Technical Specifications — Backend Package:**
  - **Entry Point:** packages/backend/src/index.ts
    - Express app creation with middleware stack
    - 11 API router mounts at /api/* paths
    - WebSocket server on /ws with upgrade handling
    - Storage initialization (memory or Redis)
    - Broadcast functions for file/terminal/CLI events
    - Graceful shutdown (cleanup, file watchers, CLI sessions, WebSocket clients, Redis disconnect)
  - **API Endpoint Catalog (38 endpoints):**
    - Complete table with columns: Route, Method, Path, Purpose, Request Schema, Response Schema, Status
    - Sessions (8): POST /, GET /, GET /:id, PUT /:id, GET /:id/chains, POST /:id/input, GET /:id/input, POST /:id/awaiting
    - Commands (3): POST /:id/commands, GET /:id/commands, POST /:commandId/ack
    - Events (4): POST /, GET /:sessionId, GET /:sessionId?since=<ts>, GET /:sessionId/recent
    - Users (2): GET /, GET /:userId/sessions
    - History (5): GET /dates, GET /sessions/:date, GET /session/:sessionId, GET /stats, POST /cleanup
    - Files (4): GET /:sessionId/tree, GET /:sessionId/read, POST /:sessionId/write, GET /:sessionId/diff
    - Terminal (3): POST /:sessionId/output, GET /:sessionId/buffer, DELETE /:sessionId/buffer
    - Claude CLI (5): POST /start, POST /:sessionId/input, POST /:sessionId/stop, GET /:sessionId/status, GET /sessions
    - Session Windows (5): GET /, GET /:id/enriched, POST /:id/follow, DELETE /:id/follow, PUT /:id/config
    - Projects (6): GET /, POST /detect, GET /:id, POST /, PUT /:id, DELETE /:id
    - Discovery (1): GET /sessions
  - **Middleware Stack:**
    - CORS: Configurable whitelist, credentials support
    - Body Parsing: JSON with 1MB limit, 10MB for file routes
    - Authentication: API key lookup (Bearer/query/x-api-key header), dev mode (auth disabled if no key)
    - Rate Limiting: General (100 req/15min), write (50 req/min), session create (10 req/min)
    - Validation: Zod schema validation, validateBody/validateSessionIdParam middlewares
    - Path Validation: Traversal prevention, symlink resolution, session cwd enforcement
    - Error Handler: Sanitized error responses, status codes, logging
  - **WebSocket Handler (ws/handler.ts):**
    - Message routing by type (subscribe, unsubscribe, input, ping)
    - Per-message API key validation
    - Session ownership validation on subscribe
    - Rate limit check (50 msgs/sec)
    - Response types: subscription_confirmed, event, command, error, pong
  - **Client Registry (ws/clientRegistry.ts):**
    - Client tracking: clientId, subscribedSessionIds, connectedAt, messageCount, apiKey, userId
    - Operations: register (max 1000), unregister, subscribe, unsubscribe, broadcastToSession, broadcastToAll
    - Rate limit enforcement (50 msgs/sec window)
  - **Storage Interface (storage/index.ts):**
    - Unified interface for sync (Memory) and async (Redis) backends
    - Operations: Sessions (CRUD, user tracking), Chains (append-only), Events (append-only with eviction), Commands (queue), Input (queue), Clients (set), FollowedSessions (set), SessionWindowConfigs (map)
    - Helper: isAsyncStorage() type guard
  - **Memory Storage (storage/memory.ts):**
    - Bounds: 10K events/session, 100 chains/session, 1000 sessions, 100 input items/queue
    - Eviction: FIFO for events/chains, oldest completed/failed for sessions
    - User tracking: userToSessions map (populated on session create)
  - **Redis Storage (storage/redis.ts):**
    - Uses ioredis 5.3 with pub/sub
    - Key patterns: afw:session:{id}, afw:chain:{sessionId}, afw:events:{sessionId}, etc.
    - Pub/Sub: afw:events channel for event broadcasting across instances
    - Missing: Session listing (no key scan implementation)
  - **Services:**
    - Claude CLI Manager (services/claudeCliManager.ts): Process spawning, env validation, MCP config auto-gen, stdin/stdout capture, signal handling, max 5 concurrent sessions
    - File Watcher (services/fileWatcher.ts): Chokidar-based monitoring, ignore patterns, debounce (300ms), step attribution, depth limit (10), stability threshold (100ms)
    - Project Detector (services/projectDetector.ts): Auto-detect project type from directory, env var validation
    - Project Storage (services/projectStorage.ts): File-based project registry, CRUD, lastUsedAt tracking
    - Claude Session Discovery (services/claudeSessionDiscovery.ts): IDE lock file scanning, PID validation, optional enrichment
    - Terminal Buffer (services/terminalBuffer.ts): FIFO per-session buffers, stream separation (stdout/stderr), step attribution
    - Cleanup Service (services/cleanup.ts): Daily scheduled cleanup, 7-day retention for history files
  - **Security Features:**
    - API key authentication (environment-based)
    - Path traversal validation (DENIED_PATHS, symlink resolution)
    - CORS whitelist enforcement
    - Rate limiting (global + per-endpoint)
    - Payload limits (1MB global, 10MB files)
    - WebSocket auth (upgrade + per-message)
    - Session ownership (user scoping on subscribe)
    - Input sanitization (Zod schemas)
    - Error message sanitization (no stack traces to clients)
  - **Partial/TODO Items:**
    - 🔧 Awaiting input broadcast (sessions.ts:359)
    - 🔧 File diff snapshots (files.ts:274)
    - 🔧 Command ACK persistence (commands.ts:88)
    - 🔧 Redis session listing (sessions.ts:135)
    - 🔧 Duplicate user routes (consolidation needed)
- Source: backend-analysis.md sections 1-11

**Depends on:** Step 10
**Output:** `docs/SRD.md` with section 2.1 complete

---

### Step 12: Write SRD — Frontend Technical Spec
**Package:** docs/
**Files:** `docs/SRD.md` (continue writing section 2.2)
**Changes:**
- Write **Technical Specifications — Frontend Package:**
  - **Entry Point:** packages/app/src/main.tsx (React DOM root)
  - **Root Component:** packages/app/src/App.tsx (WebSocketProvider wrapper, AppContent)
  - **Tech Stack:**
    - React 18.2 + TypeScript 5.4
    - Build: Vite 5.0 (dev server port 5173)
    - Desktop: Electron 28.0 (NSIS/DMG/AppImage builds)
    - Visualization: ReactFlow 11.10 (flow DAG rendering)
    - Code Editor: Monaco Editor 4.7 (20+ languages)
    - Terminal: xterm.js 5.3 (with fit and search addons)
  - **Component Architecture:**
    - 41 components organized in 21 directories (~7172 LOC)
    - Categories: Layout & Structure, Visualization & Flow, Session & User Management, Code Editor & File Explorer, Terminal & CLI, Inspection & Details, Controls & Actions, Specialized Components
    - Design patterns: Container/Presenter, Context consumers, Hook-based state, Portal rendering (Toast)
  - **Hook-Based State Management:**
    - 25 custom hooks (~3086 LOC)
    - WebSocket & Events (6): useWebSocket (core connection), useWebSocketContext (context consumer), useEvents (subscription), useLatestEvent, useFilteredEvents, useEventStats
    - Chain & Session State (4): useChainState (immutable updates), useChainEvents, useChainEventSummary
    - Session Management (5): useUsers, useUserSessions, useAttachedSessions (max N enforcement), useAllSessions, useSessionWindows
    - File & Editor (3): useFileTree, useEditorFiles (tab management), useFileSyncManager (conflict resolution)
    - Terminal & CLI (3): useTerminalEvents, useClaudeCliControl, useClaudeCliSessions, useDiscoveredSessions
    - User & Archive (3): useSessionInput, useSessionArchive, useProjects
    - UI Effects (4): useNotifications (desktop notifications), useKeyboardShortcuts, useFlowAnimations, useStreamJsonEnrichment
  - **Context Architecture:**
    - WebSocketContext (contexts/WebSocketContext.tsx): Global WebSocket connection, event callback registration, subscribe/unsubscribe, send messages
  - **Service Layer:**
    - ClaudeCliService (services/claudeCliService.ts): HTTP client for CLI session management (start, stop, send input, get status, discover projects/sessions)
    - ProjectService (services/projectService.ts): HTTP client for project management (create, list, get, update)
  - **Utilities:**
    - chainTypeDetection.ts: Detect chain type from metadata
    - contextPatternMatcher.ts: Parse context patterns
    - sessionLifecycle.ts: Session lifecycle helpers
    - streamJsonParser.ts: Parse streaming JSON
    - swimlaneLayout.ts: Calculate swimlane positions for ReactFlow nodes
    - monaco-config.ts: Monaco editor language/theme configuration
  - **Visualization Technologies:**
    - ReactFlow: Custom nodes (AnimatedStepNode), custom edges (AnimatedFlowEdge), swimlane layout algorithm, mini-map, zoom/pan
    - Monaco Editor: Multi-tab editor, 20+ language syntax highlighting, conflict dialog, diff view, file sync via WebSocket
    - xterm.js: Multi-session terminal tabs, interactive Claude CLI terminal, search addon, fit addon
  - **Real-Time Event Handling:**
    - WebSocket connection established on app load
    - Subscribe to sessions on user action (attach session)
    - Event handlers update React state (useEvents, useChainState)
    - Re-render triggers on state change (immutable updates)
  - **File Structure:**
    - packages/app/src/components/ (21 directories)
    - packages/app/src/hooks/ (24 hook files + index)
    - packages/app/src/contexts/ (WebSocketContext)
    - packages/app/src/services/ (2 services)
    - packages/app/src/utils/ (5 utilities)
    - packages/app/src/main.tsx, App.tsx, index.css, App.css
  - **Build & Deployment:**
    - Dev: pnpm dev:app (Vite dev server, port 5173)
    - Build: pnpm build (Vite production build)
    - Electron: pnpm electron-build:win/mac/linux/all
    - Distribution: NSIS (Windows), DMG (macOS), AppImage/deb/rpm (Linux), portable exe (Windows)
  - **Partial/TODO Items:**
    - 🚧 Dashboard screen (navigation exists, content missing)
    - 🚧 Flows screen (navigation exists, content missing)
    - 🚧 Actions screen (navigation exists, content missing)
    - 🚧 Logs screen (navigation exists, content missing)
    - 🚧 Settings screen (navigation exists, partial content)
    - ⏳ Session archive (missing filters, export, comparison)
    - ⏳ ChainDAG (being replaced by FlowVisualization)
    - ⏳ Keyboard shortcuts (basic implementation)
  - **Improvement Areas:**
    - 🔧 Performance optimization: Virtualize large lists (FileExplorer, SessionTree)
    - 🔧 Accessibility: ARIA labels, keyboard navigation, screen reader support
    - 🔧 Error boundaries: Add to component trees
    - 🔧 Loading states: Consistent async operation feedback
    - 🔧 Advanced editor: Find/replace, formatting, multi-cursor
- Source: frontend-analysis.md sections 1-9, appendices

**Depends on:** Step 11
**Output:** `docs/SRD.md` with section 2.2 complete

---

### Step 13: Write SRD — Shared & MCP Technical Specs
**Package:** docs/
**Files:** `docs/SRD.md` (continue writing sections 2.3, 2.4)
**Changes:**
- Write **Technical Specifications — Shared Package:**
  - **Package Structure:** packages/shared/src/ (7 TypeScript files, 1,963 lines)
  - **Type System Design:**
    - Branded string types (7): SessionId, ChainId, StepId, StepNumber, UserId, Timestamp, DurationMs
    - Factory functions: brandedTypes object with constructors + validation
    - Duration utility: duration.ms(), duration.fromSeconds(), duration.fromMinutes()
  - **Enumerations (5):**
    - Status: pending, in_progress, completed, failed, skipped
    - Model: haiku, sonnet, opus
    - ChainSource: flow, composed, meta-task
    - SessionState: idle, awaiting_input, receiving_input, active
    - PromptType: binary, text, chain_approval
    - String union duplicates (StatusString, ModelString, ChainSourceString) for flexibility
  - **Domain Models (12+ entities):**
    - Core: ChainStep (13 fields), Chain (17 fields), Session (18 fields)
    - Planning: ExecutionPlan (12 fields), ExecutionPlanStep
    - Templates: ActionRegistryEntry, FlowDefinition, ChainTemplate, ChainTemplateStep, TemplateParameter
    - CLI: ClaudeCliSession, DiscoveredClaudeSession, DiscoveredSessionEnrichment
    - Metrics: ExecutionMetrics, InputDefinition
  - **Event System (26 types):**
    - Categories: Session Lifecycle (2), Chain Lifecycle (3), Step Execution (4), User Interaction (2), File System (3), Claude CLI (3), System/Registry (2), Diagnostics (2), Terminal (1), Session Window (4)
    - Discriminated union: WorkspaceEvent (type field discriminator)
    - Event guards: 17 type guard functions (eventGuards object)
    - Graceful degradation pattern: automatic/parsed/inferred fields
  - **Command System (9 types):**
    - Session-level: PauseCommand, ResumeCommand, CancelCommand, AbortCommand
    - Step-level: RetryCommand, SkipCommand
    - CLI control: ClaudeCliStartCommand, ClaudeCliSendInputCommand, ClaudeCliStopCommand
    - Support utilities: CommandValidator class, CommandBuilder fluent API, CommandPayload wrapper, CommandResult, commandGuards (6 guards)
  - **Session Windows System (7 types):**
    - SessionWindowState: Display state (expanded/collapsed, full-screen, followed)
    - SessionWindowConfig: User preferences (animations, quick actions, auto-archive)
    - QuickActionDefinition: Button definition with icon, value, context patterns
    - QuickActionPreset: Preset collection
    - FlowNodeData: ReactFlow node metadata (swimlane, animation, parallel groups)
    - FlowEdgeData: ReactFlow edge metadata (animation progress, data labels)
    - SessionWindowLayout: Grid layout calculation (columns, rows)
  - **Project Registry (3 types):**
    - ProjectId: Branded UUID identifier
    - Project: Registered project with config, defaults, quick actions
    - ProjectAutoDetectionResult: Detection result with project type and MCP config path
  - **Export Strategy:**
    - Central barrel: packages/shared/src/index.ts (108 exports)
    - Categories: Base Types (8), Enumerations (5), Factories (2), Events (24), Event Utilities (1), Models (20), Commands (9), Command Utilities (3), Session Windows (8), Project Registry (3), Legacy Compat (4)
  - **Type Usage Metrics:**
    - Backend: 26 files import from shared, highest usage: SessionId (14x), WorkspaceEvent (7x)
    - Frontend: 66 files import from shared, primary usage through hooks
    - MCP Server: 0 direct imports (GAP)
  - **Type Dependency Graph:**
    - types.ts (base) → models.ts → events.ts, commands.ts, sessionWindows.ts, projects.ts → index.ts → Backend/Frontend/MCP
- Write **Technical Specifications — MCP Server:**
  - **Package Structure:** packages/mcp-server/src/index.ts (309 lines, TypeScript)
  - **Protocol:** Model Context Protocol 1.0 (MCP SDK Server with StdioServerTransport)
  - **Tool Inventory (2 tools):**
    - check_commands: Input: session_id (string), Output: Array of {id, type, target}, Implementation: HTTP GET /api/sessions/{id}/commands
    - ack_command: Input: command_id, result (optional), error (optional), Output: {acknowledged, command_id, result}, Implementation: HTTP POST /api/commands/{id}/ack
  - **Backend Communication:**
    - Default URL: http://localhost:3001 (configurable via AFW_BACKEND_URL)
    - Transport: HTTP fetch (untyped)
    - Error handling: Graceful degradation (returns empty array on failure)
  - **Tool Registration:**
    - ListToolsRequestSchema handler: Returns tool schemas
    - CallToolRequestSchema handler: Routes tool calls by name
  - **Type Safety Status:**
    - ❌ Local CommandResponse interface (not imported from shared)
    - ❌ Local AckResponse interface (not imported from shared)
    - ❌ Raw string response handling (no event type checking)
    - ❌ No use of shared types (CommandPayload, WorkspaceEvent)
  - **Improvement Areas:**
    - 🔧 Type safety gap: Import CommandPayload, Command, CommandResult from @afw/shared
    - 🔧 Limited tool surface: Expand to list_sessions, get_session, get_events, subscribe_events
    - 🔧 Input validation: Add schema validation for tool parameters
    - 🔧 Backend URL validation: Check backend availability on startup
- Source: shared-mcp-analysis.md sections A, B, MCP Server Implementation, Type Usage Analysis

**Depends on:** Step 12
**Output:** `docs/SRD.md` with sections 2.3, 2.4 complete

---

### Step 14: Write SRD — API Contracts
**Package:** docs/
**Files:** `docs/SRD.md` (continue writing section 3)
**Changes:**
- Write **API Contracts:**
  - **REST API Endpoint Catalog (38 endpoints):**
    - Complete reference table with columns: Route, Method, Path, Request, Response, Status
    - Include Zod schema references for validation
    - Sessions, Commands, Events, Users, History, Files, Terminal, Claude CLI, Session Windows, Projects, Discovery
    - Source: backend-analysis.md API Routes Inventory
  - **WebSocket Message Types:**
    - Client→Server: subscribe (sessionId), unsubscribe (sessionId), input (sessionId, payload), ping
    - Server→Client: subscription_confirmed (sessionId), event (sessionId, payload), command (sessionId, command), error (code, message), pong
    - Message format: JSON with { type, ...fields }
    - Source: backend-analysis.md WebSocket Implementation section
  - **MCP Tool Specifications:**
    - check_commands: { name, description, inputSchema: {session_id: string}, outputSchema: Array<Command> }
    - ack_command: { name, description, inputSchema: {command_id: string, result?: any, error?: string}, outputSchema: {acknowledged: boolean, command_id: string, result?: any} }
    - Source: shared-mcp-analysis.md MCP Server Implementation

**Depends on:** Step 13
**Output:** `docs/SRD.md` with section 3 complete

---

### Step 15: Write SRD — Data Models
**Package:** docs/
**Files:** `docs/SRD.md` (continue writing section 4)
**Changes:**
- Write **Data Models:**
  - **Core Entities:**
    - Session: 18 fields (id, userId, title, cwd, status, conversationState, awaitingInputPrompt, quickResponseOptions, completedAt, chains, etc.)
    - Chain: 17 fields (id, sessionId, title, status, steps, createdAt, startedAt, completedAt, etc.)
    - Step: 13 fields (id, stepNumber, action, status, input, output, error, model, startedAt, completedAt, duration, etc.)
    - User: userId, name, online status
  - **Event Types Catalog (26 types):**
    - Table with columns: Event Type, Discriminator (type field), Fields, Category
    - Session: SessionStartedEvent, SessionEndedEvent
    - Chain: ChainCompiledEvent, ChainStartedEvent, ChainCompletedEvent
    - Step: StepSpawnedEvent, StepStartedEvent, StepCompletedEvent, StepFailedEvent
    - User Interaction: AwaitingInputEvent, InputReceivedEvent
    - File System: FileCreatedEvent, FileModifiedEvent, FileDeletedEvent
    - Claude CLI: ClaudeCliStartedEvent, ClaudeCliOutputEvent, ClaudeCliExitedEvent
    - System/Registry: RegistryLineUpdatedEvent, ExecutionLogCreatedEvent
    - Diagnostics: ErrorOccurredEvent, WarningOccurredEvent
    - Terminal: TerminalOutputEvent
    - Session Window: SessionFollowedEvent, SessionUnfollowedEvent, QuickActionTriggeredEvent, FlowNodeClickedEvent
  - **Command Types Catalog (9 types):**
    - Table with columns: Command Type, Target Level, Fields
    - Session-level: PauseCommand, ResumeCommand, CancelCommand, AbortCommand
    - Step-level: RetryCommand (stepNumber), SkipCommand (stepNumber)
    - CLI: ClaudeCliStartCommand (cwd, flags, env), ClaudeCliSendInputCommand (sessionId, input), ClaudeCliStopCommand (sessionId, signal)
  - **Storage Schemas:**
    - Memory Storage: Map<SessionId, Session>, Map<SessionId, Chain[]>, Map<SessionId, WorkspaceEvent[]>, Map<SessionId, CommandPayload[]>, Map<SessionId, unknown[]>, Set<{clientId, sessionId}>, Set<SessionId>, Map<SessionId, SessionWindowConfig>
    - Redis Storage: Key patterns (afw:session:{id}, afw:chain:{sessionId}, afw:events:{sessionId}, afw:commands:{sessionId}, afw:input:{sessionId}, afw:clients, afw:followed, afw:sessionWindowConfig:{id})
    - Eviction policies: 10K events/session (FIFO), 100 chains/session (FIFO), 1000 sessions (oldest completed/failed), 100 input items/queue
- Source: shared-mcp-analysis.md sections A, B; backend-analysis.md Storage Layer section

**Depends on:** Step 14
**Output:** `docs/SRD.md` with section 4 complete

---

### Step 16: Write SRD — Framework Philosophy & Design Patterns
**Package:** docs/
**Files:** `docs/SRD.md` (continue writing section 5)
**Changes:**
- Write **Framework Philosophy & Design Patterns:**
  - **"It's a Sin" Metaphor:**
    - Orchestrator must delegate, never produce content directly
    - Sin test: "Am I about to produce content? → YES → Compile a chain."
    - Objection protocol: Allows orchestrator to challenge false accusations with citation
    - Quick triage mode: Limited exception for 1-3 file mechanical fixes (solo dev optimization)
  - **Delegation Model:**
    - Orchestrator responsibilities: Registry line edits, quick triage, chain compilation, agent spawning
    - Agent responsibilities: Execute mission, report learnings, never delegate further
    - Meta-task threshold: < 5 lines + 1 file = direct; 5+ lines or 2+ files = delegate
  - **Session-Start Protocol:**
    - Forces routing mode instead of help mode
    - Required reads: project.config.md, ORGANIZATION.md, FLOWS.md, logs/INDEX.md
    - Prevents "how can I help?" default behavior
  - **Proactive Coordination:**
    - Autonomous chain execution once approved
    - Step Boundary Evaluation: Six triggers after EVERY step (agent signals, patterns, dependencies, quality, redesign, reuse)
    - Preemptive recompilation: Mid-chain plan adjustments without waiting
  - **Agent Identity Isolation:**
    - Three-layer defense:
      1. Spawn prompt guard: "Do NOT read ORCHESTRATOR.md"
      2. agent-standards #9: "Never read ORCHESTRATOR.md, never delegate"
      3. CLAUDE.md conditional: "Spawned subagents: ignore this"
    - Prevents agents from crossing into orchestrator territory
  - **Spawn Pattern:**
    - Standard template: Task(subagent_type, model, run_in_background, prompt)
    - Prompt structure: agent.md reference, identity guard, boundary guard, project context injection, input specification
    - Config injection rule: "ALWAYS inject relevant project config into agent prompts"
  - **Flow Structure:**
    - Sequential: analyze → code → test → review → commit
    - Human gates: plan → human gate → code (approval required)
    - Feedback loops: code → review → (NEEDS_CHANGES → back to code)
    - No parallel execution in current flows (all sequential or single-step)
  - **Learning Capture:**
    - Agents report Fresh Eye discoveries with `[FRESH EYE]` tag
    - Orchestrator surfaces learnings in "Agent Learning" format
    - Orchestrator owns decision to implement fixes
    - LEARNINGS.md registry accumulates patterns
  - **Abstract Behaviors:**
    - agent-standards: 11 principles (Single Responsibility, Token Efficiency, Fresh Eye Discovery, Parallel Safety, Verify Don't Assume, Explicit Over Implicit, Output Boundaries, Graceful Degradation, Identity Boundary, Pre-Completion Validation)
    - create-log-folder: Datetime folder creation with Windows shell substitution warnings
    - post-completion: Commit → update INDEX.md
    - update-queue: Status progression (PENDING → IN_PROGRESS → REVIEW_READY → APPROVED)
- Source: framework-analysis.md sections 1-9, 19-20

**Depends on:** Step 15
**Output:** `docs/SRD.md` with section 5 complete

---

### Step 17: Write SRD — Non-Functional Requirements
**Package:** docs/
**Files:** `docs/SRD.md` (continue writing section 6)
**Changes:**
- Write **Non-Functional Requirements:**
  - **Performance:**
    - Rate limits: General (100 req/15min), Write (50 req/min), Session create (10 req/min), WebSocket (50 msgs/sec per client)
    - Event eviction: 10K events/session (FIFO), 100 chains/session (FIFO)
    - Pagination needs: Large event lists, session history (currently no pagination implemented)
    - Frontend optimization needs: Virtualize large lists (FileExplorer, SessionTree)
    - Debounce: File watcher (300ms), stability threshold (100ms)
  - **Security:**
    - Authentication: API key with Bearer/query/x-api-key header support, dev mode (auth disabled if no key)
    - Path validation: Traversal prevention, symlink resolution, DENIED_PATHS enforcement
    - CORS: Configurable whitelist, credentials support
    - Sanitization: Error messages (no stack traces), input validation (Zod schemas)
    - WebSocket: Per-message API key validation, session ownership checks
    - Payload limits: 1MB global, 10MB files
  - **Scalability:**
    - WebSocket client limits: Max 1000 clients
    - Storage bounds: 1000 sessions (memory), 10K events/session, 100 chains/session
    - Redis pub/sub: Horizontal scaling for event broadcasting
    - Eviction policies: Prevent unbounded growth
  - **Reliability:**
    - Graceful degradation: Continue on failure, report issues
    - Error handling: Sanitized responses, logging, status codes
    - Cleanup services: 7-day history retention, scheduled cleanup
    - Graceful shutdown: Cleanup, file watchers, CLI sessions, WebSocket clients, Redis disconnect
  - **Maintainability:**
    - Type safety: TypeScript throughout, branded types, discriminated unions
    - Code organization: Monorepo with clear package boundaries
    - Testing gaps: Integration tests only, no unit/E2E coverage (recommended)
    - Documentation: Framework philosophy documented, API endpoint catalog (this SRD)
  - **Usability:**
    - Real-time feedback: WebSocket events, toast notifications, desktop notifications
    - Intuitive controls: Pause/resume/cancel/retry/skip buttons, status-dependent enable/disable
    - Visualization clarity: Swimlane layout, animated nodes/edges, color-coded statuses
    - Error boundaries needed: Add to component trees for better error recovery
    - Loading states needed: Consistent async operation feedback
- Source: backend-analysis.md Security Assessment, frontend-analysis.md Improvement Areas, all analyses' gap sections

**Depends on:** Step 16
**Output:** `docs/SRD.md` with section 6 complete

---

### Step 18: Write SRD — Deployment, Testing, Improvement Roadmap
**Package:** docs/
**Files:** `docs/SRD.md` (continue writing sections 7, 8, 9)
**Changes:**
- Write **Deployment & Operations:**
  - **Build Process:**
    - pnpm install: Install all dependencies
    - pnpm build: Build all packages
    - pnpm dev: Run all dev servers (backend + frontend)
    - pnpm dev:backend: Backend only (port 3001)
    - pnpm dev:app: Frontend only (port 5173)
    - pnpm type-check: TypeScript check across all packages
    - pnpm lint: Run linter
    - pnpm test: Run tests (Vitest)
    - pnpm test:e2e: Run E2E tests
    - pnpm electron-build: Build Electron app (targets: win, mac, linux, all)
  - **Port Configuration:**
    - Backend: 3001 (configurable via PORT env var)
    - Vite dev: 5173
    - Electron: Desktop app (no port)
  - **Environment Variables:**
    - AFW_API_KEY: API key for authentication (optional in dev)
    - AFW_BACKEND_URL: Backend URL for MCP server (default: http://localhost:3001)
    - AFW_CLAUDE_CLI_MAX_SESSIONS: Max concurrent Claude CLI sessions (default: 5)
    - PORT: Backend port (default: 3001)
  - **Electron Build Targets:**
    - Windows: NSIS installer, portable exe
    - macOS: DMG, hardened runtime enabled
    - Linux: AppImage, deb, rpm
  - **Distribution:**
    - App name: "ActionFlows Workspace"
    - Product ID: com.actionflows.workspace
    - Auto-update: Disabled
- Write **Testing Strategy:**
  - **Current Coverage:**
    - Backend: Integration test suite (integration.test.ts), no unit tests
    - Frontend: No automated tests (manual testing only)
    - Shared: No tests
    - MCP Server: No tests
  - **Recommended Approach:**
    - Unit tests: Hooks (useEvents, useChainState), Storage (memory, redis), Services (claudeCliManager, fileWatcher), Command/Event validators
    - Integration tests: API endpoints, WebSocket handlers, Event broadcasting
    - Component tests: Complex UI (FlowVisualization, CodeEditor, TerminalTabs)
    - E2E tests: Session creation → chain execution → visualization → controls (Playwright/Cypress)
    - Accessibility tests: axe-core integration
  - **Test Coverage Goals:**
    - Backend: 80% unit coverage, full integration coverage for API routes
    - Frontend: 70% component coverage, key hooks unit tested
    - Shared: 90% coverage for validators, type guards
- Write **Improvement Roadmap:**
  - **HIGH PRIORITY:**
    - Complete Dashboard screens (5 screens: Dashboard, Flows, Actions, Logs, Settings) — 3-4 weeks per screen
    - Session archive enhancements (filters, export, comparison) — 2 weeks
    - Performance optimization (virtualization for large lists) — 1-2 weeks
    - Type safety for MCP server (import shared types, Zod validation) — 1 week
    - File diff implementation (snapshot tracking) — 1 week
    - Command ACK persistence (store results) — 1 week
  - **MEDIUM PRIORITY:**
    - UX enhancements (keyboard shortcuts, error boundaries, confirmations) — 2-3 weeks
    - Accessibility improvements (ARIA labels, keyboard nav, screen readers) — 1-2 weeks
    - Advanced editor features (find/replace, formatting, multi-cursor) — 1-2 weeks
    - Backend command validation (Zod schemas, CommandValidator integration) — 1 week
    - Event handler mapping (document which events handled by which services) — 1 week
    - Redis session listing (key scan or session ID set) — 1 week
    - Awaiting input broadcast (WebSocket event) — 1 week
    - Duplicate user routes consolidation — 1 day
  - **LOW PRIORITY:**
    - Theme customization (swimlane colors, component colors, dark/light mode) — 1 week
    - Analytics & insights (session statistics, success rates, performance bottlenecks) — 2-3 weeks
    - Export & reporting (session JSON/PDF, execution reports, session video) — 2 weeks
    - Missing flows (performance-tune/, docs-update/, test-coverage-sweep/, security-patch/) — 1 week per flow
    - Checklist implementation (populate functional/ and technical/ checklists) — 2 weeks
    - Test coverage (unit/integration/E2E as per testing strategy) — 4-6 weeks
    - MCP tool expansion (list_sessions, get_session, get_events, subscribe_events) — 2-3 weeks
    - Pagination types (PaginatedResult<T>, CursorPageInfo) — 1 week
    - Validation result types (ValidationResult<T>) — 1 week
- Source: Improvement sections from all analyses, Testing sections from backend/frontend analyses

**Depends on:** Step 17
**Output:** `docs/SRD.md` with sections 7, 8, 9 complete

---

### Step 19: Write SRD — Glossary & Finalize
**Package:** docs/
**Files:** `docs/SRD.md` (complete final section 10 and TOC)
**Changes:**
- Write **Glossary & Appendices:**
  - **Technical Terms:**
    - Branded Type: TypeScript type with unique brand symbol for ID safety
    - Discriminated Union: Union type with discriminator field (e.g., WorkspaceEvent with 'type' field)
    - FIFO: First-In-First-Out (eviction policy)
    - Pub/Sub: Publish-Subscribe pattern (Redis event broadcasting)
    - Graceful Degradation: Continue operation with reduced functionality on error
    - MCP: Model Context Protocol (standard for AI tool integration)
    - StdioServerTransport: MCP transport over stdin/stdout
  - **Domain Terms:**
    - SessionId, ChainId, StepId, StepNumber, UserId, Timestamp, DurationMs: Branded identifiers
    - Chain: Sequence of steps within a session
    - Step: Individual action within a chain
    - Session: User's orchestration session
    - User: Human operating the session
    - Command: Control instruction (pause, resume, cancel, retry, skip)
    - Event: State change broadcast via WebSocket
    - Orchestrator: Claude agent compiling chains and spawning agents
    - Agent: Specialized executor (analyze/, code/, review/, etc.)
    - Spawn: Invoking an agent with standardized prompt
    - Human Gate: Approval point in chain execution
    - Fresh Eye: Unexpected issue discovered by agent
    - DAG: Directed Acyclic Graph (visualization mode)
    - Timeline: Sequential visualization mode
    - Swimlane: Visual grouping by executor/module
  - **Dependency Versions:**
    - Backend: Express 4.18.2, ws 8.14.2, ioredis 5.3.0, zod 3.22.0, chokidar 3.5.3, cors 2.8.5, express-rate-limit 7.1.0
    - Frontend: React 18.2.0, TypeScript 5.4.0, Vite 5.0.0, Electron 28.0.0, ReactFlow 11.10.0, Monaco 4.7.0, xterm 5.3.0, @xterm/addon-fit 0.11.0, @xterm/addon-search 0.16.0
    - Shared: TypeScript 5.4.0 (ES modules)
    - MCP: @modelcontextprotocol/sdk (latest)
  - **File Structure Reference:**
    - Monorepo structure overview (packages/backend, packages/app, packages/shared, packages/mcp-server, packages/hooks)
    - Backend: routes/, storage/, ws/, services/, middleware/, schemas/
    - Frontend: components/, hooks/, contexts/, services/, utils/
    - Shared: types.ts, models.ts, events.ts, commands.ts, sessionWindows.ts, projects.ts, index.ts
    - Framework: .claude/actionflows/ (ORGANIZATION.md, FLOWS.md, ACTIONS.md, flows/, actions/, logs/, checklists/)
- Add **Table of Contents (TOC)** at top of document with deep links to all sections
- Finalize document formatting and review for consistency

**Depends on:** Step 18
**Output:** `docs/SRD.md` COMPLETE

---

### Step 20: Pre-Completion Validation
**Package:** All
**Files:** Verify both documents exist and are non-empty
**Changes:**
- Check `docs/FRD.md` exists and is > 0 bytes (target: 8,000-12,000 words, ~25-40 KB)
- Check `docs/SRD.md` exists and is > 0 bytes (target: 10,000-15,000 words, ~30-50 KB)
- Verify log folder `.claude/actionflows/logs/plan/frd-srd-docs_2026-02-08-17-07-45/` contains this plan.md
- Report success status
- If any file missing or empty, report failure before completing

**Depends on:** Step 19
**Output:** Validation report

---

## Dependency Graph

```
Step 1 (FRD structure design) → Step 3 (FRD sections 1-3)
Step 2 (SRD structure design) → Step 10 (SRD section 1)

Step 3 → Step 4 → Step 5 → Step 6 → Step 7 → Step 8 → Step 9 (FRD complete)
Step 10 → Step 11 → Step 12 → Step 13 → Step 14 → Step 15 → Step 16 → Step 17 → Step 18 → Step 19 (SRD complete)

Step 9 + Step 19 → Step 20 (validation)
```

**Parallel opportunities:** Steps 1 and 2 can be done in parallel (design phase). Steps 3-9 (FRD writing) and Steps 10-19 (SRD writing) are sequential within each document but parallel across documents.

---

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| FRD/SRD too long (readability) | Medium | Use tables extensively, clear TOCs, section markers |
| Analysis synthesis accuracy | High | Cross-reference all analyses, verify status markers, flag uncertainties |
| Improvement areas not comprehensive | Medium | Review each analysis's gap sections, consolidate into backlog |
| Framework philosophy not clear | High | Dedicate full section to "it's a sin" metaphor with examples, diagrams |
| Type catalog overwhelming | Medium | Organize by category, use tables, provide examples for complex types |
| Maintenance burden (docs go stale) | Medium | Flag improvement areas inline (🔧), note status markers (✅⏳🚧) for easy updates |
| Missing context from Ollama files | Low | Ollama analyses appear out of scope (dependency usage, not ActionFlows features) |

---

## Verification

- [ ] FRD.md exists and contains all sections (1-9)
- [ ] FRD.md includes TOC with deep links
- [ ] FRD.md captures all functionality from analyses with status markers
- [ ] FRD.md flags all improvement areas from analyses
- [ ] FRD.md explains framework philosophy clearly
- [ ] SRD.md exists and contains all sections (1-10)
- [ ] SRD.md includes TOC with deep links
- [ ] SRD.md documents system architecture with diagrams
- [ ] SRD.md catalogs all API contracts (REST, WebSocket, MCP)
- [ ] SRD.md documents all data models (entities, events, commands)
- [ ] SRD.md explains framework design patterns
- [ ] SRD.md addresses non-functional requirements
- [ ] SRD.md includes deployment, testing, improvement roadmap
- [ ] Both documents are readable and maintainable
- [ ] Type check passes across all packages (no changes to code, only docs)
- [ ] Log folder contains plan.md

---

## Notes

### Analysis Input Summary

1. **backend-analysis.md (34KB):** 11 API routes, 38 endpoints, WebSocket, dual storage, 7 services, middleware, security. Status: ✅ Feature-complete with TODOs.
2. **frontend-analysis.md (41KB):** 96 files, 41 components, 25 hooks, ReactFlow/Monaco/xterm. Status: ~85% complete, missing 5 screens.
3. **shared-mcp-analysis.md (21KB):** 108 type exports, 26 events, 9 commands, 2 MCP tools. Status: ✅ Types excellent, MCP needs type safety.
4. **framework-analysis.md (32KB):** ActionFlows philosophy, 9 flows, 13 actions, 7 agents. Status: 🟢 Structurally sound, 100% alignment.
5. **ollama-deps-analysis.md (107KB, not read):** Dependency analysis (appears out of scope for ActionFlows Dashboard features).
6. **ollama-project-overview.md (105KB, not read):** Project overview (appears out of scope for ActionFlows Dashboard features).

**Total Synthesized:** ~128KB from 4 core analyses (backend, frontend, shared+mcp, framework). Ollama files omitted as they focus on Ollama dependency usage rather than ActionFlows Dashboard functionality.

### Document Size Targets

- **FRD:** 8,000-12,000 words (user-facing functional view)
- **SRD:** 10,000-15,000 words (technical architecture and specifications)

### Learnings Capture Format

Planning agents must report learnings in the orchestrator's expected format:

```
## Learnings

**Issue:** {What happened}
**Root Cause:** {Why}
**Suggestion:** {How to prevent}

[FRESH EYE] {Any discoveries outside explicit instructions}

Or: None — execution proceeded as expected.
```

---

**Plan Complete**
