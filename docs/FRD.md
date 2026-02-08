# Functional Requirements Document (FRD)
## ActionFlows Dashboard

**Document Version:** 1.0
**Generated:** 2026-02-08
**Author:** Agent
**Status:** Complete

---

## Executive Summary

The **ActionFlows Dashboard** is a real-time monitoring and control system for AI agent orchestration flows. It enables users to create and manage orchestration sessions, view chains of AI-driven steps as interactive visualizations (DAG, Timeline, Flow), edit code files with conflict resolution, stream terminal output with session identification, control Claude Code sessions, and discover active IDE sessions via lock files.

The system operates across a monorepo architecture (Express backend + React frontend + Electron desktop) with real-time event streaming via WebSocket, Redis pub/sub, and dual storage backends (memory for dev, Redis for prod).

---

## 1. Executive Summary

### Vision
The ActionFlows Dashboard is a **real-time monitoring and control dashboard** for orchestrating AI agent workflows. It enables operators to visualize orchestration sessions, monitor autonomous agent execution, inspect step outputs, and actively control chain execution through a responsive web and Electron interface.

### Status
**✅ ~85% Complete**
- Core architecture and infrastructure fully implemented
- All major feature screens and components built
- Real-time WebSocket integration operational
- Visual flow visualization and session management functional
- Some analytics and dashboard screens in progress

### Key Metrics
- **Backend:** 11 API route modules, 38 endpoints, dual-mode storage (Memory/Redis)
- **Frontend:** 96 source files, 41 components, 25 custom hooks, multi-visualization support
- **Shared Types:** 108 exports, 149 type definitions, 26 event types, 9 command types
- **Framework:** 3 departments, 9 flows, 13 actions, 7 agent definitions
- **Security:** API key auth, rate limiting, path validation, CORS, WebSocket session ownership

### Primary Use Cases
1. **Session Monitoring:** Watch active orchestration sessions in real-time
2. **Chain Visualization:** Display orchestrated chains as DAG, timeline, or swimlane views
3. **Step Inspection:** Examine step inputs, outputs, errors, and durations
4. **Execution Control:** Pause, resume, cancel, retry, or skip chain execution
5. **User Input:** Provide interactive input to sessions awaiting responses
6. **File Management:** Browse, edit, and track project files being modified by agents
7. **Terminal Integration:** Monitor agent terminal output and Claude CLI sessions
8. **Session History:** Archive and review completed sessions

---

## 2. Project Overview

### What is ActionFlows Dashboard?
A web-based and desktop application for real-time orchestration of AI agents. The system enables a central orchestrator (Claude agent) to delegate work to specialized agents through compiled chains of actions. The dashboard visualizes each step of execution, enables human approval gates, and provides operators with complete visibility into agent behavior.

### Why It Exists
AI orchestration requires coordination and visibility:
- **Without Dashboard:** Orchestrator and agents operate blindly; no visibility into execution; no human control points
- **With Dashboard:** Humans can monitor progress, intervene when needed, review agent outputs, and maintain oversight of autonomous workflows

### Who Uses It
1. **Orchestrator Operators:** Manage orchestration sessions, approve chains, provide input
2. **Developers:** Inspect session details, debug failed steps, edit files, review agent outputs
3. **Observers/Auditors:** Review execution history, analyze agent performance patterns

### Core Capabilities
- Real-time event streaming via WebSocket
- Multiple visualization modes (DAG, timeline, swimlane grid)
- Multi-session attachment (1-6 sessions simultaneously)
- Terminal integration (xterm.js with agent output)
- Code editor (Monaco, 20+ languages, multi-tab)
- File browser with diff and sync
- Interactive user input during sessions
- Desktop (Electron) and web deployment

---

## 3. Framework Philosophy

### 3.1 "It's a Sin" — The Core Metaphor

The ActionFlows framework enforces a strict boundary: **the orchestrator must delegate, never produce content directly.**

**The Sin Test:**
```
Before any action:
  Am I about to produce content (write, code, analyze)?
    → YES → It's a sin. Compile a chain and spawn an agent.
    → NO  → Am I coordinating?
             → YES → Proceed
             → NO  → Delegate it
```

**Why this matters:** The orchestrator's role is routing and oversight, not execution. Violating this boundary creates brittle systems that lack specialization.

**Dashboard representation:** Chains must be approved by human gates before agent execution. Dashboard visualizes this boundary.

### 3.2 Delegation Model

**Orchestrator Responsibilities:**
1. Registry line edits (add/remove entries in INDEX.md, FLOWS.md)
2. Quick triage fixes (1-3 file mechanical changes, high confidence)
3. Chain compilation (selecting and sequencing actions)
4. Agent spawning (invoking specialized agents with context)

**Agent Responsibilities:**
- Execute single mission (analyze, code, review, test, etc.)
- Report discoveries (via `[FRESH EYE]` tags in output)
- Never further delegate work
- Validate output before completion

**Meta-Task Threshold:**

| Criteria | Direct | Delegate |
|----------|--------|----------|
| Lines changed | < 5 | 5+ |
| Files affected | 1 | 2+ |
| Nature | Mechanical | Creative |
| Judgment | High confidence | Uncertain |

Example: Updating a version number in package.json = direct. Refactoring authentication = delegate.

### 3.3 Framework Harmony System

ActionFlows enforces synchronized evolution between orchestrator and dashboard through a **4-part harmony system**:

**1. Orchestrator Contract (`.claude/actionflows/CONTRACT.md`)**
- Formal specification of all 17+ orchestrator output formats
- TypeScript definitions in `packages/shared/src/contract/`
- Versioned (CONTRACT_VERSION) with migration support

**2. Onboarding Questionnaire**
- Interactive teaching flow (Module 9: Harmony)
- Teaches humans how harmony works and why it matters
- Progressive disclosure: Beginner → Intermediate → Advanced

**3. Harmony Detection**
- Backend service: `packages/backend/src/services/harmonyDetector.ts`
- Real-time validation of every orchestrator output
- Broadcasts violations via WebSocket

**4. Philosophy Documentation**
- Harmony concept embedded in ORCHESTRATOR.md, agent-standards, project docs
- Cross-references throughout framework files

**Living Software Model:**
- Traditional software: Static code, manual changes, quality degrades
- Living software: Evolves through use, agent learnings, quality improves
- Harmony system: Enables evolution without breaking sync

**Harmony States:**
- ✅ **Valid:** Output matches contract, all features work
- ⚠️ **Degraded:** Partial parse, some features unavailable
- ❌ **Violation:** Parse failed, graceful degradation

**Dashboard representation:**
- Harmony panel shows real-time status
- Violation alerts notify when parsing fails
- Metrics track harmony percentage over time

**Evolution workflow:**
1. Define new format in CONTRACT.md
2. Add TypeScript parser
3. Update ORCHESTRATOR.md examples
4. Update dashboard components
5. Increment CONTRACT_VERSION if breaking
6. Run harmony:check validation

### 3.4 Session-Start Protocol

**Before responding to any human request:**
1. Read `project.config.md` — Project context (tech stack, paths, ports)
2. Read `ORGANIZATION.md` — Department routing (Framework, Engineering, QA)
3. Read `FLOWS.md` — Available flows and chain patterns
4. Read `logs/INDEX.md` — Execution history

**Why this forces routing mode:** Prevents "how can I help?" default behavior. Pushes orchestrator to consult registries and follow established patterns.

**Dashboard reflection:** Session start is the entry point; dashboard shows which flows are available and which past executions can be reviewed.

### 3.5 Proactive Coordination

Once a chain is approved, the orchestrator **autonomously** follows through:
- Execute entire chain without stopping between steps
- Evaluate **six triggers** after every step (agent signals, pattern matches, dependencies, quality issues, redesign needs, reuse opportunities)
- Preemptively recompile chain mid-execution if conditions change

**Dashboard support:** Chain status shows current step, allows pause/resume for re-evaluation.

### 3.6 Agent Identity Isolation

Three-layer defense prevents agents from reading orchestrator files:

1. **Spawn Prompt Guard:** "Do NOT read ORCHESTRATOR.md"
2. **agent-standards #9:** "Never read ORCHESTRATOR.md, never delegate"
3. **CLAUDE.md Conditional:** "Spawned subagents: ignore this section"

**Why three layers?** Defense-in-depth. Prevents single-point failures.

### 3.7 Learning Capture

**Fresh Eye discoveries:** Agents tag unexpected findings with `[FRESH EYE]` and report them to orchestrator.

**Orchestrator response:** Reviews discovery, decides whether to implement fix immediately or defer. Fixes are recorded in `logs/LEARNINGS.md` with root cause and prevention strategy.

**Dashboard role:** Surface learnings as they're discovered; enable operator to mark interesting findings for archival.

---

## 4. User Personas & Stories

### Persona 1: Orchestrator Operator

**Role:** Initiates and manages orchestration sessions
**Technical Level:** Expert (Claude agent or power user)
**Primary Tools:** CLAUDE.md, FLOWS.md, logs/INDEX.md

**User Stories:**
- "As an orchestrator, I want to see all active sessions so I can track parallel work"
- "As an orchestrator, I want to approve or reject proposed chains before execution"
- "As an orchestrator, I want to pause a chain mid-execution if I notice an issue"
- "As an orchestrator, I want to view learnings from agents so I can improve future chains"

**Key Workflows:**
1. Session start → Read registries → Route to appropriate flow
2. Compile chain → Present chain with approval prompt
3. Monitor execution → Intervene if needed (pause/resume/cancel)
4. Review learnings → Document patterns in LEARNINGS.md

### Persona 2: Developer

**Role:** Inspects and debugs session execution
**Technical Level:** Advanced (familiar with codebase)
**Primary Tools:** File editor, terminal, step inspector

**User Stories:**
- "As a developer, I want to inspect step inputs and outputs to understand what agents did"
- "As a developer, I want to review terminal output to see execution logs"
- "As a developer, I want to edit files directly in the dashboard and see changes reflected"
- "As a developer, I want to retry failed steps with different inputs"

**Key Workflows:**
1. Attach to session → Select chain and step
2. Inspect step details → View I/O, error messages, duration
3. Review terminal output → Search for errors or specific patterns
4. Edit files → Resolve conflicts, apply fixes inline
5. Retry step → Re-execute with same or modified inputs

### Persona 3: Observer/Auditor

**Role:** Reviews execution history and analyzes patterns
**Technical Level:** Intermediate (understands orchestration concepts)
**Primary Tools:** Session archive, history browser, statistics

**User Stories:**
- "As an auditor, I want to load archived sessions to review past work"
- "As an auditor, I want to compare execution patterns across multiple sessions"
- "As an auditor, I want to filter sessions by date, user, and status"
- "As an auditor, I want to export session results for reporting"

**Key Workflows:**
1. Browse archives → Filter by date range and user
2. Load session snapshot → View chains and steps
3. Analyze execution → Review durations, error rates, step patterns
4. Export results → Download JSON or PDF report

---

## 5. Functional Areas by Package

### 5.1 Backend Package

**Location:** `packages/backend/`
**Framework:** Express 4.18 + TypeScript + ws 8.14.2 + ioredis 5.3
**Status:** ✅ Feature-complete with minor TODOs

#### 5.1.1 API Routes (11 Modules, 38 Endpoints)

##### Sessions Route
**File:** `routes/sessions.ts`
**Endpoints:** 8 total

| Endpoint | Method | Purpose | Status |
|----------|--------|---------|--------|
| `/` | POST | Create new session | ✅ Complete |
| `/` | GET | List all sessions | ✅ Complete (memory only; Redis limitation noted) |
| `/:id` | GET | Get session with chains | ✅ Complete |
| `/:id` | PUT | Update session status | ✅ Complete |
| `/:id/chains` | GET | List session chains | ✅ Complete |
| `/:id/input` | POST | Queue user input | ✅ Complete |
| `/:id/input` | GET | Long-poll for input | ✅ Complete |
| `/:id/awaiting` | POST | Mark session awaiting input | ✅ Complete |

**Key Features:**
- Path validation (denies /etc, /sys, /proc, C:\Windows, etc.)
- File watching on session creation
- Long-polling for hook integration
- Conversation state tracking

**Gaps:**
- 🔧 **WebSocket broadcast for awaiting input** (sessions.ts:359) — TODO: emit via WS after POST /sessions/:id/awaiting
- 🔧 **Redis session listing** (sessions.ts:135) — Empty with Redis (no key scan implementation)

##### Commands Route
**File:** `routes/commands.ts`
**Endpoints:** 3 total

| Endpoint | Method | Purpose | Status |
|----------|--------|---------|--------|
| `/:id/commands` | POST | Queue command | ✅ Complete |
| `/:id/commands` | GET | Get pending commands | ✅ Complete |
| `/:commandId/ack` | POST | Acknowledge command | ⏳ Partial |

**Key Features:**
- Command ID generation (cmd-${Date.now()}-${Math.random()})
- Polling-friendly auto-clear on fetch
- Sanitized logging

**Gaps:**
- 🔧 **Command ACK persistence** (commands.ts:88) — Results logged but not stored
- 🔧 **Command validation** — No existence check on ACK

##### Events Route
**File:** `routes/events.ts`
**Endpoints:** 4 total

| Endpoint | Method | Purpose | Status |
|----------|--------|---------|--------|
| `/` | POST | Receive & store event | ✅ Complete |
| `/:sessionId` | GET | Get all events | ✅ Complete |
| `/:sessionId?since=<ts>` | GET | Get events since timestamp | ✅ Complete |
| `/:sessionId/recent` | GET | Get recent events | ✅ Complete |

**Key Features:**
- Event storage with FIFO eviction (10K per session)
- Active step tracking for file attribution
- Timestamp filtering

##### Users Route
**File:** `routes/users.ts`
**Endpoints:** 2 total

| Endpoint | Method | Purpose | Status |
|----------|--------|---------|--------|
| `/` | GET | List users | ✅ Complete |
| `/:userId/sessions` | GET | Get user's sessions | ✅ Complete |

**Gap:** Duplicate route definitions (also in sessions.ts) — 🔧 **consolidation opportunity**

##### History Route
**File:** `routes/history.ts`
**Endpoints:** 5 total

| Endpoint | Method | Purpose | Status |
|----------|--------|---------|--------|
| `/dates` | GET | List history dates | ✅ Complete |
| `/sessions/:date` | GET | List sessions for date | ✅ Complete |
| `/session/:sessionId` | GET | Load session snapshot | ✅ Complete |
| `/stats` | GET | Storage statistics | ✅ Complete |
| `/cleanup` | POST | Trigger cleanup | ✅ Complete |

**Key Features:**
- File-based persistence (history/{YYYY-MM-DD}/session-{id}.json)
- 7-day retention policy
- Query old snapshots by date

##### Files Route
**File:** `routes/files.ts`
**Endpoints:** 4 total

| Endpoint | Method | Purpose | Status |
|----------|--------|---------|--------|
| `/:sessionId/tree` | GET | Get directory tree | ✅ Complete |
| `/:sessionId/read` | GET | Read file content | ✅ Complete |
| `/:sessionId/write` | POST | Write file content | ✅ Complete |
| `/:sessionId/diff` | GET | Get file diff | ⏳ Partial |

**Key Features:**
- Path validation (prevents traversal)
- 10MB file size limits
- Recursive tree with depth limit
- Hidden file filtering

**Gaps:**
- 🔧 **File diff snapshots** (files.ts:274) — Shows current only, no previous versions

##### Terminal Route
**File:** `routes/terminal.ts`
**Endpoints:** 3 total

| Endpoint | Method | Purpose | Status |
|----------|--------|---------|--------|
| `/:sessionId/output` | POST | Post terminal output | ✅ Complete |
| `/:sessionId/buffer` | GET | Get buffer | ✅ Complete |
| `/:sessionId/buffer` | DELETE | Clear buffer | ✅ Complete |

**Key Features:**
- Dual storage (in-memory + WebSocket broadcast)
- Stream separation (stdout/stderr)
- Step attribution

##### Claude CLI Route
**File:** `routes/claudeCli.ts`
**Endpoints:** 5 total

| Endpoint | Method | Purpose | Status |
|----------|--------|---------|--------|
| `/start` | POST | Start Claude CLI session | ✅ Complete |
| `/:sessionId/input` | POST | Send stdin | ✅ Complete |
| `/:sessionId/stop` | POST | Stop session | ✅ Complete |
| `/:sessionId/status` | GET | Get status | ✅ Complete |
| `/sessions` | GET | List active sessions | ✅ Complete |

**Key Features:**
- Process validation and spawning
- MCP config auto-generation
- Environment variable validation
- Max 5 concurrent sessions

##### Session Windows Route
**File:** `routes/sessionWindows.ts`
**Endpoints:** 5 total

| Endpoint | Method | Purpose | Status |
|----------|--------|---------|--------|
| `/` | GET | List followed sessions | ✅ Complete |
| `/:id/enriched` | GET | Get detailed data | ✅ Complete |
| `/:id/follow` | POST | Mark followed | ✅ Complete |
| `/:id/follow` | DELETE | Unmark followed | ✅ Complete |
| `/:id/config` | PUT | Update config | ✅ Complete |

**Key Features:**
- Followed sessions tracking
- Per-session window config
- Auto-enrichment with chains/events

##### Projects Route
**File:** `routes/projects.ts`
**Endpoints:** 6 total

| Endpoint | Method | Purpose | Status |
|----------|--------|---------|--------|
| `/` | GET | List projects | ✅ Complete |
| `/detect` | POST | Auto-detect project | ✅ Complete |
| `/:id` | GET | Get project | ✅ Complete |
| `/` | POST | Create project | ✅ Complete |
| `/:id` | PUT | Update project | ✅ Complete |
| `/:id` | DELETE | Delete project | ✅ Complete |

**Key Features:**
- Project type detection
- Environment variable validation
- MCP config path management
- Quick action presets

##### Discovery Route
**File:** `routes/discovery.ts`
**Endpoints:** 1 total

| Endpoint | Method | Purpose | Status |
|----------|--------|---------|--------|
| `/sessions` | GET | Discover running CLI sessions | ✅ Complete |

**Key Features:**
- IDE lock file scanning
- PID validation
- Optional enrichment

#### 5.1.2 WebSocket Implementation

**File:** `ws/handler.ts`
**Client Registry:** `ws/clientRegistry.ts`

**Message Types:**
- `subscribe` / `unsubscribe` — Session subscription
- `input` — Queue input
- `ping` — Keepalive
- `subscription_confirmed` / `event` / `command` / `error` — Server responses

**Security:**
- Per-message API key validation ✅
- Session ownership validation ✅
- Rate limiting (50 msgs/sec per client) ✅
- Max 1000 clients ✅

#### 5.1.3 Storage Layer

**Dual Backends:**
- **Memory (dev):** Synchronous, in-process
- **Redis (prod):** Asynchronous, distributed with pub/sub

**Bounds:**
- 10K events per session (FIFO eviction)
- 100 chains per session (FIFO)
- 1000 sessions total (evict oldest completed/failed)

**Operations:** Sessions (CRUD), Chains (append), Events (append), Commands (queue), Input (queue), Clients (set), FollowedSessions (set), SessionWindowConfigs (map)

#### 5.1.4 Services (7 Modules)

1. **Claude CLI Manager** — Process control, MCP config, env validation
2. **File Watcher** — Chokidar-based change detection, step attribution, debounce
3. **Project Detector** — Auto-detect project type and metadata
4. **Project Storage** — Persist project registry to filesystem
5. **Claude Session Discovery** — Scan IDE lock files for running sessions
6. **Terminal Buffer** — FIFO output buffering per session
7. **Cleanup Service** — Scheduled history cleanup (7-day retention)

#### 5.1.5 Middleware Stack

- **Authentication:** API key (Bearer/query/x-api-key header)
- **Rate Limiting:** General (100/15min), write (50/min), session create (10/min)
- **Validation:** Zod schema per route
- **Path Validation:** Traversal prevention, symlink resolution
- **Error Handler:** Sanitized responses, status codes

---

### 5.2 Frontend Package

**Location:** `packages/app/`
**Framework:** React 18.2 + TypeScript + Vite 5 + Electron 28
**Status:** ✅ ~85% Complete

#### 5.2.1 Component Inventory (41 Components, 7,172 LOC)

##### Layout & Structure (3 Components)

| Component | Status | Purpose |
|-----------|--------|---------|
| **AppContent** | ✅ | Main layout with tab navigation, session grid, terminal |
| **SplitPaneLayout** | ✅ | Dynamic 1-6 session grid layout |
| **SessionPane** | ✅ | Single session display (DAG/timeline/swimlane, inspector, controls) |

##### Visualization & Flow (7 Components)

| Component | Status | Purpose |
|-----------|--------|---------|
| **FlowVisualization** | ✅ | ReactFlow with swimlane layout, animated nodes/edges |
| **AnimatedStepNode** | ✅ | Custom node with status animations |
| **AnimatedFlowEdge** | ✅ | Custom edge with flow indicators |
| **SwimlaneBackground** | ✅ | Visual swimlane grouping |
| **TimelineView** | ✅ | Sequential timeline visualization |
| **ChainDAG** | ⏳ | Legacy DAG (being replaced by FlowVisualization) |
| **ChainBadge** | ✅ | Status badge with progress |

##### Session & User Management (7 Components)

| Component | Status | Purpose |
|-----------|--------|---------|
| **UserSidebar** | ✅ | User selection, session filtering |
| **SessionTree** | ✅ | Hierarchical session/chain tree |
| **SessionWindowSidebar** | ✅ | Alternative session window mode |
| **SessionWindowGrid** | ✅ | Session tiles layout |
| **SessionArchive** | ⏳ | Historical sessions (missing filters/export) |

**Improvements needed:**
- 🔧 Session archive filters (date range, user, status)
- 🔧 Session comparison
- 🔧 Export/download functionality

##### Code Editor & File Explorer (7 Components)

| Component | Status | Purpose |
|-----------|--------|---------|
| **CodeEditor** | ✅ | Multi-tab Monaco editor with file sync |
| **EditorTabs** | ✅ | Tab management |
| **ConflictDialog** | ✅ | Conflict resolution UI |
| **DiffView** | ✅ | Side-by-side diff |
| **FileExplorer** | ✅ | Tree navigation with search |
| **FileTree** | ✅ | Recursive tree rendering |
| **FileIcon** | ✅ | File type icons |

**Improvements:**
- 🔧 Find & replace
- 🔧 Code formatting (Prettier)
- 🔧 Advanced multi-cursor editing
- 🔧 Virtualization for large trees

##### Terminal & CLI (7 Components)

| Component | Status | Purpose |
|-----------|--------|---------|
| **TerminalPanel** | ⏳ | xterm.js container (single-session reference) |
| **TerminalTabs** | ✅ | Multi-session terminal tabs |
| **ClaudeCliTerminal** | ✅ | Interactive Claude CLI |
| **ClaudeCliStartDialog** | ✅ | Session creation dialog |
| **ProjectSelector** | ✅ | Project selection UI |
| **ProjectForm** | ✅ | Project details form |
| **DiscoveredSessionsList** | ✅ | Auto-discovered sessions |

##### Inspection & Details (3 Components)

| Component | Status | Purpose |
|-----------|--------|---------|
| **StepInspector** | ✅ | Step detail viewer (I/O, errors, duration) |
| **ConversationPanel** | ✅ | User input interface |
| **NotificationManager** | ✅ | Desktop notifications |

##### Controls & Actions (4 Components)

| Component | Status | Purpose |
|-----------|--------|---------|
| **ControlButtons** | ✅ | Pause, resume, cancel, retry, skip |
| **QuickActionBar** | ✅ | Quick access actions |
| **QuickActionButton** | ✅ | Individual action button |
| **QuickActionSettings** | ✅ | Configure quick actions |

##### Specialized Components (4 Components)

| Component | Status | Purpose |
|-----------|--------|---------|
| **Toast** | ✅ | Toast messages |
| **ChainDemo** | 🚧 | Demo/test component |
| **ChainLiveMonitor** | 🚧 | Live monitoring (placeholder) |
| **HistoryBrowser** | 🚧 | Session history (incomplete) |

**Dashboard Screens (TODO):**
- 🚧 Dashboard screen (navigation exists, content missing)
- 🚧 Flows screen (visualization of FLOWS.md)
- 🚧 Actions screen (visualization of ACTIONS.md)
- 🚧 Logs screen (execution logs and learnings)
- 🚧 Settings screen (partial implementation)

**Improvement estimate:** 3-4 weeks per screen

#### 5.2.2 Custom Hooks (25 Hooks, 3,086 LOC)

**WebSocket & Events:**
- `useWebSocket` — Core connection management
- `useWebSocketContext` — Context consumer
- `useEvents` — Subscribe to session events
- `useLatestEvent` — Get recent event by type
- `useFilteredEvents` — Filter events by type
- `useEventStats` — Event statistics

**Chain & Session State:**
- `useChainState` — Manage chain with immutable updates
- `useChainEvents` — Get events for specific chain
- `useChainEventSummary` — Summarize chain events

**Session Management:**
- `useUsers` — Get users and current user
- `useUserSessions` — Get sessions for user
- `useAttachedSessions` — Manage attached sessions (max N)
- `useAllSessions` — Get all available sessions
- `useSessionWindows` — Manage session window state

**File & Editor:**
- `useFileTree` — Get project file tree
- `useEditorFiles` — Manage open editor files
- `useFileSyncManager` — Handle file sync conflicts

**Terminal & CLI:**
- `useTerminalEvents` — Terminal output events
- `useClaudeCliControl` — Control Claude CLI session
- `useClaudeCliSessions` — Manage CLI sessions
- `useDiscoveredSessions` — Auto-discovered sessions

**User & Archive:**
- `useSessionInput` — Submit user input
- `useSessionArchive` — Access archived sessions
- `useProjects` — Project management

**UI Effects:**
- `useNotifications` — Desktop notifications
- `useKeyboardShortcuts` — Keyboard shortcut handling (⏳ basic)
- `useFlowAnimations` — Animation state management
- `useStreamJsonEnrichment` — Parse streamed JSON

#### 5.2.3 Contexts & Services

**WebSocketContext:** Global connection state, event callbacks, subscribe/unsubscribe

**ClaudeCliService:** API client for CLI management (start, stop, input, status, discovery)
**ProjectService:** API client for project management (CRUD)

#### 5.2.4 Utilities

- `chainTypeDetection.ts` — Detect chain type from metadata
- `contextPatternMatcher.ts` — Parse context patterns
- `sessionLifecycle.ts` — Session lifecycle helpers
- `streamJsonParser.ts` — Parse streaming JSON
- `swimlaneLayout.ts` — Calculate swimlane positions
- `monaco-config.ts` — Monaco editor configuration

#### 5.2.5 Tech Stack

- React 18.2 + TypeScript 5.4
- Vite 5.0 (dev server port 5173)
- Electron 28.0 (desktop builds)
- ReactFlow 11.10 (DAG visualization)
- Monaco Editor 4.7 (code editor, 20+ languages)
- xterm.js 5.3 (terminal emulation)

---

### 5.3 Shared Package

**Location:** `packages/shared/`
**Status:** ✅ Comprehensive type system, 108 exports

#### 5.3.1 Type System (149 Type Definitions)

**Branded Types (7):**
- `SessionId` — Session identifier
- `ChainId` — Chain identifier
- `StepId` — Step identifier
- `StepNumber` — Step number (1-indexed)
- `UserId` — User identifier
- `Timestamp` — ISO 8601 timestamp
- `DurationMs` — Duration in milliseconds

**Enumerations (5):**
- `Status` — pending, in_progress, completed, failed, skipped
- `Model` — haiku, sonnet, opus
- `ChainSource` — flow, composed, meta-task
- `SessionState` — idle, awaiting_input, receiving_input, active
- `PromptType` — binary, text, chain_approval

#### 5.3.2 Domain Models

**Core Entities:**
- `Session` (18 fields) — Work session container
- `Chain` (17 fields) — Compiled sequence of steps
- `ChainStep` (13 fields) — Individual step
- `User` — User identifier and metadata
- `ExecutionPlan` (12 fields) — Proposed plan with approval workflow
- `ExecutionMetrics` — Aggregated statistics

**Supporting Models:**
- `ClaudeCliSession` — Spawned subprocess
- `DiscoveredClaudeSession` — Auto-discovered from IDE
- `ChainTemplate` — Reusable pattern
- `ActionRegistryEntry` — Action definition

#### 5.3.3 Event System (26 Event Types)

**Discriminated Union:** `WorkspaceEvent` with `type` field discriminator

**Categories:**

| Category | Count | Examples |
|----------|-------|----------|
| Session Lifecycle | 2 | SessionStartedEvent, SessionEndedEvent |
| Chain Lifecycle | 3 | ChainCompiledEvent, ChainStartedEvent, ChainCompletedEvent |
| Step Execution | 4 | StepSpawnedEvent, StepStartedEvent, StepCompletedEvent, StepFailedEvent |
| User Interaction | 2 | AwaitingInputEvent, InputReceivedEvent |
| File System | 3 | FileCreatedEvent, FileModifiedEvent, FileDeletedEvent |
| Claude CLI | 3 | ClaudeCliStartedEvent, ClaudeCliOutputEvent, ClaudeCliExitedEvent |
| System/Registry | 2 | RegistryLineUpdatedEvent, ExecutionLogCreatedEvent |
| Diagnostics | 2 | ErrorOccurredEvent, WarningOccurredEvent |
| Terminal | 1 | TerminalOutputEvent |
| Session Window | 4 | SessionFollowedEvent, SessionUnfollowedEvent, QuickActionTriggeredEvent, FlowNodeClickedEvent |

**Event Guards:** 17 type guard functions for runtime type narrowing

#### 5.3.4 Command System (9 Command Types)

**Session-Level Commands:**
- `PauseCommand` — Graceful pause
- `ResumeCommand` — Resume execution
- `CancelCommand` — Cancel current chain
- `AbortCommand` — Emergency stop

**Step-Level Commands:**
- `RetryCommand` — Retry step
- `SkipCommand` — Skip step

**CLI Control Commands:**
- `ClaudeCliStartCommand` — Start subprocess
- `ClaudeCliSendInputCommand` — Send stdin
- `ClaudeCliStopCommand` — Terminate subprocess

**Support Utilities:**
- `CommandValidator` class with validation logic
- `CommandBuilder` fluent API for construction
- `CommandPayload` wrapper with metadata
- `commandGuards` type guard functions (6 guards)

#### 5.3.5 Session Window System (7 Types)

- `SessionWindowState` — Display state (expanded/collapsed, fullscreen, followed)
- `SessionWindowConfig` — User preferences (animations, quick actions)
- `QuickActionDefinition` — Button definition with icon, value, patterns
- `QuickActionPreset` — Preset collection
- `FlowNodeData` — ReactFlow node metadata (swimlane, animation, parallel groups)
- `FlowEdgeData` — ReactFlow edge metadata
- `SessionWindowLayout` — Grid layout calculation

#### 5.3.6 Project Registry (3 Types)

- `ProjectId` — Branded UUID
- `Project` — Registered project with config and defaults
- `ProjectAutoDetectionResult` — Detection result with type and MCP path

---

### 5.4 MCP Server

**Location:** `packages/mcp-server/`
**Status:** ✅ Functional but minimal

#### 5.4.1 Protocol & Transport

**Protocol:** Model Context Protocol 1.0
**Transport:** StdioServerTransport (stdin/stdout)
**Backend URL:** `http://localhost:3001` (configurable via AFW_BACKEND_URL)

#### 5.4.2 Tools (2 Current)

| Tool | Purpose | Inputs | Implementation |
|------|---------|--------|-----------------|
| `check_commands` | Poll pending commands | session_id (string) | HTTP GET /api/sessions/{id}/commands |
| `ack_command` | Acknowledge command | command_id, result?, error? | HTTP POST /api/commands/{id}/ack |

**Status:** ✅ Functional, 🔧 **Type safety gap** — Hardcoded interfaces instead of importing from shared

#### 5.4.3 Improvement Opportunities

- 🔧 **Type Safety:** Import `CommandPayload`, `Command`, `CommandResult` from @afw/shared
- 🔧 **Tool Expansion:** Add `list_sessions`, `get_session`, `get_events`, `subscribe_events`
- 🔧 **Input Validation:** Add Zod schema validation for tool parameters
- 🔧 **Backend Validation:** Check backend availability on startup

---

### 5.5 ActionFlows Framework

**Location:** `.claude/actionflows/`
**Status:** ✅ Structurally sound, 100% registry-to-filesystem alignment

#### 5.5.1 Core Philosophy

**"It's a Sin" Principle:**
- Orchestrator must delegate, never produce content
- Sin test enforced at pre-action gate
- Three-layer identity isolation prevents agent misconduct

**Delegation Model:**
- Orchestrator: Registry edits, quick triage, chain compilation, agent spawning
- Agents: Single mission execution, no further delegation
- Meta-task threshold: < 5 lines + 1 file = direct; otherwise delegate

#### 5.5.2 Organization (3 Departments)

| Department | Owns | Key Flows |
|------------|------|-----------|
| **Framework** | ActionFlows maintenance | flow-creation/, action-creation/, framework-health/ |
| **Engineering** | Code implementation, reviews | code-and-review/, bug-triage/ |
| **QA** | Audits, quality sweeps | audit-and-fix/ |

#### 5.5.3 Flows (9 Flows)

**Framework Flows:**
1. `flow-creation/` — plan → human gate → code → review
2. `action-creation/` — plan → human gate → code → review
3. `action-deletion/` — analyze → code → review
4. `framework-health/` — analyze
5. `doc-reorganization/` — analyze → human gate → plan → human gate → code → review

**Engineering Flows:**
1. `code-and-review/` — code → review → (loop if needed)
2. `bug-triage/` — analyze → code → test → review
3. `post-completion/` — commit → registry update

**QA Flows:**
1. `audit-and-fix/` — audit → review

#### 5.5.4 Actions (13 Actions)

**Generic Actions (7):**
- `analyze/` — Codebase analysis (Sonnet)
- `code/` — Code implementation (Haiku, has backend/frontend variants)
- `review/` — Code review with optional fix mode (Sonnet)
- `test/` — Execute tests (Haiku)
- `audit/` — Comprehensive audits (Opus)
- `plan/` — Implementation planning (Sonnet)
- `commit/` — Git commit + push (Haiku)

**Stack-Specific Actions (2):**
- `code/backend/` — Express/TypeScript specialization
- `code/frontend/` — React/Vite specialization

**Abstract Actions (4):**
- `_abstract/agent-standards/` — 11 behavioral principles
- `_abstract/create-log-folder/` — Datetime folder creation
- `_abstract/post-completion/` — Commit → registry update
- `_abstract/update-queue/` — Status progression in Queue.md

#### 5.5.5 Agent Definitions (7 Agents)

All agents follow standard template:
1. **Mission statement** — Clear one-sentence purpose
2. **Extends section** — Which abstract behaviors apply
3. **Steps to Complete** — Numbered, sequential instructions
4. **Project Context** — Tech stack, paths, ports injected
5. **Constraints** — DO / DO NOT rules
6. **Learnings Output** — Required format with `[FRESH EYE]` tags

**Behavioral Standards (11 Principles):**
1. Single Responsibility
2. Token Efficiency
3. Fresh Eye Discovery
4. Parallel Safety
5. Verify, Don't Assume
6. Explicit Over Implicit
7. Output Boundaries
8. Graceful Degradation
9. **Identity Boundary** (never read ORCHESTRATOR.md, never delegate)
10. Pre-Completion Validation
11. Output Boundary (reinforced)

#### 5.5.6 Execution History & Learnings

**logs/INDEX.md:** Registry of past executions (currently sparse, will populate)

**logs/LEARNINGS.md:** Captured patterns (currently 4 learnings documented)

**Pattern Documentation:**
- Indirect references anti-pattern
- Orchestrator staying in lane
- Registry-only edits
- Explicit required steps

#### 5.5.7 Checklists

**Structure:** `checklists/functional/` and `checklists/technical/`

**Status:** 🟡 **Structure exists** but no checklists implemented yet (expected for new framework)

#### 5.5.8 Dashboard Visualization Requirements

The dashboard must represent the orchestration lifecycle:

1. **Session View:** Show orchestrator at entry point (session start); visualize which registries are available
2. **Flow View:** Display available flows from FLOWS.md; show routing logic from ORGANIZATION.md
3. **Chain View:** Visualize compiled chain with DAG/timeline; show step dependencies and executor swimlanes
4. **Control Points:** Human gates must be clearly marked (awaiting approval); enable approve/reject buttons
5. **Agent Execution:** Show real-time agent output; stream log folder contents as agent executes
6. **Learning Surface:** Highlight `[FRESH EYE]` discoveries; enable promotion to LEARNINGS.md
7. **Registry Access:** Read-only access to FLOWS.md, ACTIONS.md, logs/INDEX.md for operator reference

---

## 6. Feature Catalog

### Complete Feature Matrix

| Feature | Component/Module | Package | Status | Notes |
|---------|------------------|---------|--------|-------|
| **API & Backend Services** | | | | |
| Session CRUD | sessions.ts | Backend | ✅ | Create, read, update, delete sessions |
| Command queuing | commands.ts | Backend | ⏳ | Queue, fetch, acknowledge (ACK is stub) |
| Event storage | events.ts | Backend | ✅ | Store, query, broadcast events |
| User aggregation | users.ts | Backend | ✅ | List users, get sessions per user |
| History archival | history.ts | Backend | ✅ | File-based 7-day retention |
| File operations | files.ts | Backend | ⏳ | Read, write, tree (diff incomplete) |
| Terminal output | terminal.ts | Backend | ✅ | Buffer, post, clear |
| Claude CLI control | claudeCli.ts | Backend | ✅ | Start, input, stop, status |
| Session windows | sessionWindows.ts | Backend | ✅ | Follow/unfollow, config persistence |
| Project registry | projects.ts | Backend | ✅ | CRUD, detection, metadata |
| Session discovery | discovery.ts | Backend | ✅ | IDE lock file scanning |
| **WebSocket & Real-time** | | | | |
| WebSocket connection | ws/handler.ts | Backend | ✅ | Subscription-based event streaming |
| Client registry | ws/clientRegistry.ts | Backend | ✅ | Manage connected clients |
| Per-message auth | ws/handler.ts | Backend | ✅ | Validate API key per message |
| Rate limiting | ws/clientRegistry.ts | Backend | ✅ | 50 msgs/sec per client |
| **Storage & Persistence** | | | | |
| Memory storage | storage/memory.ts | Backend | ✅ | In-process FIFO eviction |
| Redis storage | storage/redis.ts | Backend | ✅ | Distributed with pub/sub |
| File watcher | fileWatcher.ts | Backend | ✅ | Chokidar-based change detection |
| **Frontend Layout & Navigation** | | | | |
| Multi-tab interface | AppContent.tsx | Frontend | ✅ | Sessions/Dashboard/Flows/Actions/Logs/Settings |
| Session grid (1-6) | SplitPaneLayout.tsx | Frontend | ✅ | Dynamic layout for multiple sessions |
| Session window mode | SessionWindowGrid.tsx | Frontend | ✅ | Alternative tile-based layout |
| Sidebar panels | UserSidebar.tsx, FileExplorer.tsx | Frontend | ✅ | Collapsible navigation |
| **Visualization** | | | | |
| Flow DAG (ReactFlow) | FlowVisualization.tsx | Frontend | ✅ | Primary swimlane-based visualization |
| Swimlane layout | swimlaneLayout.ts | Frontend | ✅ | Automatic node positioning |
| Animated nodes | AnimatedStepNode.tsx | Frontend | ✅ | Status-based animations |
| Animated edges | AnimatedFlowEdge.tsx | Frontend | ✅ | Flow indicators |
| Timeline view | TimelineView.tsx | Frontend | ✅ | Sequential visualization |
| Legacy DAG | ChainDAG.tsx | Frontend | ⏳ | Being replaced |
| Mini-map | FlowVisualization.tsx | Frontend | ✅ | Navigation overview |
| **Session Management** | | | | |
| Session listing | SessionTree.tsx | Frontend | ✅ | Hierarchical view |
| User management | UserSidebar.tsx | Frontend | ✅ | Selection and filtering |
| Session attachment | AppContent.tsx | Frontend | ✅ | Max 6 sessions |
| Session window follow | SessionWindowGrid.tsx | Frontend | ✅ | Alternative mode |
| Session archiving | SessionArchive.tsx | Frontend | ⏳ | Basic, missing filters/export |
| **Code Editor** | | | | |
| Multi-tab editor | CodeEditor.tsx | Frontend | ✅ | Open/close tabs |
| Syntax highlighting | Monaco Editor | Frontend | ✅ | 20+ languages |
| File explorer | FileExplorer.tsx | Frontend | ✅ | Tree navigation |
| Conflict resolution | ConflictDialog.tsx | Frontend | ✅ | Side-by-side diff |
| File sync | useFileSyncManager | Frontend | ✅ | WebSocket-based |
| Language detection | monaco-config.ts | Frontend | ✅ | Auto-detect from extension |
| **Terminal** | | | | |
| Multi-session tabs | TerminalTabs.tsx | Frontend | ✅ | xterm.js-based |
| Interactive CLI | ClaudeCliTerminal.tsx | Frontend | ✅ | Bidirectional I/O |
| Terminal search | TerminalPanel.tsx | Frontend | ✅ | Search addon |
| Output buffering | terminalBuffer.ts | Backend | ✅ | FIFO per-session |
| **Step Inspection** | | | | |
| Step details | StepInspector.tsx | Frontend | ✅ | Full metadata |
| Input/output view | StepInspector.tsx | Frontend | ✅ | JSON formatting |
| Error display | StepInspector.tsx | Frontend | ✅ | Full error messages |
| Duration tracking | Chain model | Shared | ✅ | startedAt, completedAt |
| **Controls & Commands** | | | | |
| Pause/Resume | ControlButtons.tsx | Frontend | ✅ | Session control |
| Cancel/Retry/Skip | ControlButtons.tsx | Frontend | ✅ | Step control |
| User input | ConversationPanel.tsx | Frontend | ✅ | Interactive input |
| Quick actions | QuickActionBar.tsx | Frontend | ✅ | Customizable buttons |
| Command validation | CommandValidator | Shared | ✅ | Enum + rules |
| **Notifications & Feedback** | | | | |
| Toast messages | Toast.tsx | Frontend | ✅ | UI feedback |
| Desktop notifications | NotificationManager.tsx | Frontend | ✅ | Step/chain events |
| **CLI Integration** | | | | |
| Claude CLI launcher | ClaudeCliStartDialog.tsx | Frontend | ✅ | Session creation |
| Project selection | ProjectSelector.tsx | Frontend | ✅ | Project management |
| Session discovery | DiscoveredSessionsList.tsx | Frontend | ✅ | IDE detection |
| **Type System** | | | | |
| Branded types | types.ts | Shared | ✅ | 7 branded types |
| Domain models | models.ts | Shared | ✅ | 12+ entities |
| Event system | events.ts | Shared | ✅ | 26 event types + guards |
| Command system | commands.ts | Shared | ✅ | 9 command types + builders |
| Session windows | sessionWindows.ts | Shared | ✅ | 7 UI state types |
| **MCP Tools** | | | | |
| check_commands | mcp-server/index.ts | MCP Server | ✅ | Command polling |
| ack_command | mcp-server/index.ts | MCP Server | ✅ | Command acknowledgment |
| **Orchestration Framework** | | | | |
| Flows (9 flows) | FLOWS.md | Framework | ✅ | All flows with instructions |
| Actions (13 actions) | ACTIONS.md | Framework | ✅ | All actions with agent.md |
| Agents (7 agents) | actions/{agent}/agent.md | Framework | ✅ | All agent definitions |
| Abstract behaviors (4) | actions/_abstract/ | Framework | ✅ | Shared patterns |
| Department routing | ORGANIZATION.md | Framework | ✅ | Framework/Engineering/QA |
| Session-start protocol | ORCHESTRATOR.md | Framework | ✅ | Forcing function |
| **Authentication & Security** | | | | |
| API key auth | auth.ts | Backend | ✅ | Bearer/query/header |
| CORS | index.ts | Backend | ✅ | Configurable whitelist |
| Rate limiting | rateLimit.ts | Backend | ✅ | Global + per-endpoint |
| Path validation | validatePath.ts | Backend | ✅ | Traversal prevention |
| Input validation | validate.ts | Backend | ✅ | Zod schemas |
| Error sanitization | errorHandler.ts | Backend | ✅ | No stack traces |
| WebSocket auth | ws/handler.ts | Backend | ✅ | Per-message validation |
| Session ownership | ws/handler.ts | Backend | ✅ | User scoping |

**Legend:** ✅ Complete | ⏳ Partial | 🚧 TODO

---

## 7. Improvement Backlog

### HIGH PRIORITY (Blocking Features)

#### 1. Complete Dashboard Screens
- **Scope:** 5 screens (Dashboard, Flows, Actions, Logs, Settings)
- **Effort:** 3-4 weeks per screen
- **Impact:** Enables visualization of framework registries
- **Details:**
  - **Dashboard:** Key metrics, active sessions, recent chains
  - **Flows:** List all flows, show chain structure, execution history
  - **Actions:** List all actions, show agent definitions, model selection
  - **Logs:** Execution logs, learnings registry, audit trail
  - **Settings:** User preferences, quick action customization

#### 2. Session Archive Enhancements
- **Scope:** Filters, export, comparison
- **Effort:** 2 weeks
- **Impact:** Enables historical analysis and reporting
- **Features:**
  - Date range filtering
  - User/status filtering
  - Session comparison (side-by-side chains)
  - Export to JSON/PDF

#### 3. Performance Optimization
- **Scope:** Large list virtualization
- **Effort:** 1-2 weeks
- **Impact:** Handles 1000+ files/sessions without lag
- **Targets:**
  - FileExplorer virtualization
  - SessionTree virtualization
  - Event list pagination

#### 4. MCP Server Type Safety
- **Scope:** Import shared types, add validation
- **Effort:** 1 week
- **Impact:** Type-safe boundary at CLI integration
- **Changes:**
  - Import `CommandPayload`, `Command`, `CommandResult`
  - Add Zod schema validation
  - Add backend availability check

#### 5. File Diff Implementation
- **Scope:** Track file snapshots, show changes
- **Effort:** 1 week
- **Impact:** Shows what agents modified
- **Approach:**
  - Capture snapshots on step start
  - Compare current vs. snapshot
  - Highlight additions/deletions

#### 6. Command ACK Persistence
- **Scope:** Store command results
- **Effort:** 1 week
- **Impact:** Audit trail of command execution
- **Changes:**
  - Store result/error in session history
  - Expose via history/stats endpoints
  - Log to execution record

### MEDIUM PRIORITY (Enhancement)

#### 7. UX Enhancements
- **Scope:** Shortcuts, error boundaries, confirmations
- **Effort:** 2-3 weeks
- **Details:**
  - Expand keyboard shortcuts
  - Add error boundaries to component trees
  - Add confirmation dialogs for destructive actions
  - Consistent loading states

#### 8. Accessibility Improvements
- **Scope:** ARIA labels, keyboard navigation, screen readers
- **Effort:** 1-2 weeks
- **Testing:** axe-core integration

#### 9. Advanced Editor Features
- **Scope:** Find/replace, formatting, multi-cursor
- **Effort:** 1-2 weeks
- **Uses:** Monaco built-in APIs

#### 10. Backend Command Validation
- **Scope:** Zod schemas, CommandValidator
- **Effort:** 1 week
- **Impact:** Enforce command structure at API boundary

#### 11. Event Handler Mapping
- **Scope:** Document coverage
- **Effort:** 1 week (documentation)
- **Current:** 10/26 events explicitly handled
- **Gap:** File events, Registry events, Warning events

#### 12. Redis Session Listing
- **Scope:** Implement key scanning
- **Effort:** 1 week
- **Impact:** GET /api/sessions works with Redis

#### 13. WebSocket Awaiting Input Broadcast
- **Scope:** Emit event on POST /sessions/:id/awaiting
- **Effort:** 1 day
- **Impact:** Clients notified of session state change

#### 14. Duplicate User Routes Consolidation
- **Scope:** Remove user routes from sessions.ts
- **Effort:** 1 day
- **Impact:** Single source of truth

### LOW PRIORITY (Enhancement)

#### 15. Theme Customization
- **Scope:** Colors, fonts, dark/light mode
- **Effort:** 1 week
- **Targets:** Swimlane colors, component colors

#### 16. Analytics & Insights
- **Scope:** Statistics, success rates, bottleneck identification
- **Effort:** 2-3 weeks
- **Features:**
  - Session duration distribution
  - Success/failure rates by step type
  - Performance bottleneck identification

#### 17. Export & Reporting
- **Scope:** Session export, PDF reports
- **Effort:** 2 weeks
- **Formats:** JSON, PDF, CSV

#### 18. Missing Flows
- **Scope:** performance-tune/, docs-update/, test-coverage-sweep/, security-patch/
- **Effort:** 1 week per flow
- **Impact:** Framework extensibility

#### 19. Checklist Implementation
- **Scope:** Populate functional/ and technical/ checklists
- **Effort:** 2 weeks
- **References:** Used by review/ and audit/ agents

#### 20. MCP Tool Expansion
- **Scope:** Add list_sessions, get_session, get_events, subscribe_events
- **Effort:** 2-3 weeks
- **Impact:** Richer CLI integration

#### 21. Pagination Types
- **Scope:** PaginatedResult<T>, CursorPageInfo
- **Effort:** 1 week
- **Impact:** API scalability as data grows

#### 22. Validation Result Types
- **Scope:** ValidationResult<T> for consistent error reporting
- **Effort:** 1 week
- **Usage:** CommandValidator, input validation

---

## 8. Non-Functional Requirements Preview

*Detailed specifications in SRD; summary here:*

### Performance
- **Rate Limits:** 100 req/15min (general), 50 req/min (write), 10 req/min (session create), 50 msgs/sec (WebSocket)
- **Event Eviction:** 10K per session, 100 chains per session
- **Client Capacity:** Max 1000 WebSocket clients
- **Recommended:** Virtualize large lists, lazy-load components, pagination for events

### Security
- ✅ API key authentication (Bearer/query/x-api-key)
- ✅ Path traversal validation
- ✅ CORS whitelist
- ✅ Rate limiting
- ✅ Input sanitization (Zod)
- ✅ Error message sanitization
- ✅ WebSocket auth (per-message)

### Scalability
- Memory backend: Suitable for dev (single-process)
- Redis backend: Production horizontal scaling
- Event pub/sub: Broadcast across instances
- Need: Session enumeration for Redis (currently missing)

### Reliability
- Graceful shutdown: Cleanup, watchers, CLI sessions, clients
- Error handling: Sanitized responses, logging
- Cleanup service: 7-day history retention
- Terminal buffer: In-memory FIFO

### Usability
- Real-time feedback: WebSocket events, toasts, notifications
- Intuitive controls: Pause/resume/cancel/retry/skip
- Clear visualization: Swimlanes, color-coded status
- Need: Error boundaries, loading states

---

## 9. Glossary

### Core Domain Terms

**Session:** A user's orchestration work session. Contains chains, events, and conversation state. Identified by `SessionId`.

**Chain:** A compiled sequence of steps representing a coordinated unit of work. Contains chain steps with dependencies. Identified by `ChainId`.

**Step:** An individual action within a chain (e.g., "run code analysis"). Identified by `StepId`. Has status (pending, in_progress, completed, failed, skipped) and tracks inputs, outputs, duration.

**Step Number:** Ordinal position of a step within a chain (1-indexed). Used for reference in commands like "retry step 3".

**User:** The human operator or observer. Identified by `UserId`. Associated with sessions for permission/history tracking.

**Command:** Control instruction sent to a session (pause, resume, cancel, retry, skip). Queued and polled by agents.

**Event:** State change notification broadcast via WebSocket (session started, step completed, file modified, etc.). 26 event types in `WorkspaceEvent` discriminated union.

### Framework Terms

**Orchestrator:** The coordinating Claude agent that reads registries, compiles chains, spawns specialized agents, and evaluates step boundaries.

**Agent:** Specialized executor with single mission (analyze, code, review, test, etc.). Executes without further delegation.

**Spawn:** Invoking an agent with standardized prompt structure including identity guards and context injection.

**Flow:** A chain template defining sequence of actions. Example: `code-and-review/` = code → review → (loop if needed).

**Action:** A reusable unit of work executed by agents. Generic (code, review, test) or stack-specific (code/backend).

**Fresh Eye:** Unexpected discovery by an agent tagged with `[FRESH EYE]` and reported to orchestrator for decision.

**Human Gate:** Approval point in a chain (after planning, before coding) where orchestrator must approve continuation.

### Visualization Terms

**DAG (Directed Acyclic Graph):** Visualization showing steps as nodes with dependency edges. Primary mode using FlowVisualization.

**Timeline:** Sequential visualization showing steps vertically with time flowing down.

**Swimlane:** Visual grouping of steps by executor/module. Steps in same swimlane are grouped together; edges between swimlanes show cross-module dependencies.

**Animated Node:** ReactFlow node with status-based animations (slide-in for pending, pulse for executing, checkmark for complete).

### Type System Terms

**Branded Type:** TypeScript type with unique brand symbol preventing accidental mixing. Example: `SessionId` branded string prevents confusing with `ChainId`.

**Discriminated Union:** Union type with discriminator field (e.g., `WorkspaceEvent` has `type` field). Enables type narrowing based on `type` value.

**Type Guard:** Function returning `value is SpecificType`, used with discriminated unions. Example: `eventGuards.isStepCompleted(event)`.

### Technical Terms

**WebSocket:** Bidirectional protocol for real-time event streaming. Backend broadcasts events; frontend subscribes to sessions.

**Subscription:** Client requests to receive events for specific session. Multiple clients can subscribe to same session.

**Redis Pub/Sub:** Distributed message broadcast across backend instances via `afw:events` channel.

**Storage Interface:** Unified interface with Memory (dev) and Redis (prod) implementations. Same API, different backing.

**MCP (Model Context Protocol):** Standard for AI tool integration. Dashboard exposes tools for orchestrators to query command status.

---

## Appendix: Status Legend

**Status Markers Used Throughout:**

- ✅ **Complete** — Feature fully implemented and tested
- ⏳ **Partial** — Feature partially implemented; gaps or TODOs remain
- 🚧 **TODO** — Feature planned but not yet implemented
- 🔧 **Improvement** — Gap identified, flagged for future work

---

**Document Generated:** 2026-02-08
**Analysis Sources:** backend-analysis.md, frontend-analysis.md, shared-mcp-analysis.md, framework-analysis.md
**Next Phase:** SRD (Software Requirements Document) with detailed technical specifications
