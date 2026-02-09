# FRD/SRD Document Plan

**Generated:** 2026-02-08
**Purpose:** Comprehensive outlines for Functional Requirements Document (FRD) and Software Requirements Document (SRD)
**Based on:** 4 complete analysis reports (backend, frontend, shared/MCP, framework philosophy)

---

## Executive Summary

This document provides detailed outlines for both the FRD and SRD, incorporating findings from all four analysis reports. The structure follows ActionFlows framework philosophy: strict separation between coordination (orchestrator) and execution (agent) perspectives, action-sized feature decomposition, and explicit dependency tracking.

**Document Purposes:**
- **FRD:** Human-facing requirements with orchestrator routing guide
- **SRD:** Three-layer technical design (orchestrator → agent → cross-cutting)

---

## PART 1: FRD OUTLINE

### 1. Overview & Scope

#### 1.1 Project Context
- **Name:** ActionFlows Dashboard
- **Description:** Real-time monitoring and control dashboard for AI agent orchestration flows
- **Architecture:** Monorepo (pnpm workspaces) with 5 packages
- **Tech Stack Summary:**
  - Backend: Express 4.18 + TypeScript + ws 8.14.2 + ioredis 5.3 + Zod
  - Frontend: React 18.2 + Vite 5 + Electron 28 + ReactFlow 11.10 + Monaco + xterm
  - Shared: Branded types, discriminated unions, ES modules
  - MCP Server: Model Context Protocol 1.0
  - Hooks: Claude Code integration scripts

#### 1.2 Human-Facing Goals
- **Primary Goal:** Enable real-time monitoring and control of AI agent orchestration flows
- **Secondary Goals:**
  - Multi-session orchestration with flexible layouts
  - Code editing with conflict resolution
  - Terminal output attribution and streaming
  - Desktop integration via Electron
  - Claude CLI session management
  - Project registry for persistent configuration

#### 1.3 Out of Scope
- Multi-user collaboration (real-time session sharing)
- Session replay with step-by-step debugging
- Code coverage integration
- Remote access/sharing (share session link)
- Metrics dashboard (Prometheus-style)
- Webhook/alert customization
- Session forking/branching

---

### 2. Domain Model

#### 2.1 Core Concepts

**Session (Branded SessionId)**
- Represents a user's orchestration session
- Lifecycle: created → running → paused → resumed → completed/cancelled
- Attributes: cwd, user, chains, status, conversationState, metadata
- State Machine: idle → awaiting_input → receiving_input → active

**Chain (Branded ChainId)**
- Represents a sequence of steps within a session
- Attributes: title, steps, source, status, executionMode, duration
- Source Types: flow, composed, meta-task
- Execution Modes: sequential, parallel, mixed

**Step (Branded StepId, StepNumber)**
- Represents an individual action within a chain
- Attributes: action, model, inputs, dependencies, status, result, learning
- Status: pending → in_progress → completed/failed/skipped
- Supports nesting: parentStepId, depth

**User (Branded UserId)**
- Human operating the session
- Attributes: id, online status, session count
- Supports session aggregation and filtering

**Command**
- Control instruction for session/chain/step
- Types: pause, resume, cancel, abort, retry, skip
- Types (Claude CLI): start, send-input, stop
- Attributes: type, stepNumber?, reason?, options?

**Event (WorkspaceEvent discriminated union)**
- State change broadcast via WebSocket
- 24 event types across 8 categories
- Categories: session lifecycle, chain lifecycle, step execution, user interaction, file system, registry, terminal/CLI, errors/warnings, session windows

#### 2.2 Entity Relationships

```
User 1:N Session
Session 1:N Chain
Chain 1:N Step
Session 1:N Command (queue)
Session 1:N Event (history)
Session 1:N FileChange
Session 0:1 ClaudeCliSession
Project 1:N QuickActionDefinition
```

#### 2.3 Branded Type Definitions

All IDs use branded string types to prevent mixing:
- `SessionId = string & { readonly __brand: 'SessionId' }`
- `ChainId = string & { readonly __brand: 'ChainId' }`
- `StepId = string & { readonly __brand: 'StepId' }`
- `StepNumber = number & { readonly __brand: 'StepNumber' }` (1-indexed)
- `UserId = string & { readonly __brand: 'UserId' }`
- `ProjectId = string & { readonly __brand: 'ProjectId' }`
- `Timestamp = string & { readonly __brand: 'Timestamp' }` (ISO 8601)
- `DurationMs = number & { readonly __brand: 'DurationMs' }`

Factory functions enforce validation (non-empty strings, StepNumber >= 1, valid Date for Timestamp).

---

### 3. User Requirements

#### 3.1 Session Management

**REQ-SM-01: Create Session**
- User Story: As a user, I can create a new orchestration session with a working directory
- Acceptance Criteria:
  - Directory validation (no system paths: /etc, C:\Windows, etc.)
  - Session ID generation (branded SessionId)
  - File watching auto-start
  - WebSocket subscription established
  - Session appears in user sidebar
- Non-Functional: < 100ms response time

**REQ-SM-02: List Sessions**
- User Story: As a user, I can view all active sessions sorted by status and timestamp
- Acceptance Criteria:
  - Supports filtering by user
  - Supports filtering by status (pending, in_progress, completed, failed)
  - Pagination support (limit/offset)
  - Returns enriched session data (chains, config)
- Non-Functional: < 200ms for 1000 sessions

**REQ-SM-03: Update Session**
- User Story: As a user, I can mark a session as completed/failed with summary and end reason
- Acceptance Criteria:
  - Stops file watching
  - Persists session to file history (data/history/{date}/)
  - Broadcasts session:ended event
  - Updates session status badge in UI
- Non-Functional: Persistence within 500ms

**REQ-SM-04: Session Input**
- User Story: As a user, I can submit input to a session awaiting user response
- Acceptance Criteria:
  - Long-polling support (60s timeout cap)
  - Queue management (max 100 inputs per session)
  - Input source tracking (terminal/dashboard/api)
  - Broadcasts input_received event
- Non-Functional: Input delivery within 100ms

**REQ-SM-05: Session History**
- User Story: As a user, I can browse historical sessions by date
- Acceptance Criteria:
  - List dates with saved sessions
  - Get session IDs for a specific date
  - Load full session snapshot (session + events + chains)
  - 7-day retention with cleanup
- Non-Functional: < 300ms load time for session snapshot

#### 3.2 Chain Orchestration

**REQ-CO-01: Compile Chain**
- User Story: As orchestrator, I can compile a chain of actions with dependencies
- Acceptance Criteria:
  - Supports sequential, parallel, and mixed execution modes
  - Dependency graph validation (no cycles)
  - Step numbering (1-indexed)
  - Estimated duration calculation
  - Broadcasts chain:compiled event
- Non-Functional: < 50ms compilation time for 100-step chain

**REQ-CO-02: Start Chain**
- User Story: As orchestrator, I can start executing a compiled chain
- Acceptance Criteria:
  - Spawns agents for parallel steps
  - Respects waitsFor dependencies
  - Tracks current step
  - Broadcasts chain:started, step:started events
- Non-Functional: Agent spawn latency < 200ms

**REQ-CO-03: Chain Completion**
- User Story: As orchestrator, I can track chain completion with success/failure counts
- Acceptance Criteria:
  - Counts successful, failed, skipped steps
  - Calculates total duration
  - Determines overall status (success/partial/failure)
  - Broadcasts chain:completed event
- Non-Functional: Status update within 100ms

#### 3.3 Step Execution

**REQ-SE-01: Spawn Step**
- User Story: As orchestrator, I can spawn a step with action, model, and inputs
- Acceptance Criteria:
  - Validates action exists in ACTIONS.md
  - Validates model (haiku/sonnet/opus)
  - Validates inputs schema (if defined)
  - Supports nested spawning (parentStepId, depth)
  - Broadcasts step:spawned event
- Non-Functional: < 100ms spawn time

**REQ-SE-02: Execute Step**
- User Story: As agent, I can execute my assigned step and report results
- Acceptance Criteria:
  - Creates log folder (.claude/actionflows/logs/{action}/{description}_{datetime}/)
  - Reads agent.md instructions
  - Produces output files (logs, code changes, reports)
  - Reports file changes
  - Reports learnings (Issue, Root Cause, Suggestion)
  - Broadcasts step:completed or step:failed event
- Non-Functional: Learnings output required in all cases

**REQ-SE-03: Step Failure Handling**
- User Story: As orchestrator, I can handle step failures with retry/skip options
- Acceptance Criteria:
  - Captures error message, type, stack trace
  - Determines if error is retryable
  - Suggests mitigation
  - Broadcasts step:failed event with error context
  - Supports graceful degradation (continue remaining steps)
- Non-Functional: Error sanitization prevents info leaks

#### 3.4 Command Queue

**REQ-CQ-01: Queue Command**
- User Story: As user, I can queue a control command for a session/chain/step
- Acceptance Criteria:
  - Supports pause, resume, cancel, abort, retry, skip
  - Command ID generation (timestamp + random)
  - Broadcasts command event
  - Auto-clear after hook fetch
- Non-Functional: < 50ms queue time

**REQ-CQ-02: Poll Commands**
- User Story: As hook, I can poll for pending commands and acknowledge receipt
- Acceptance Criteria:
  - GET /api/sessions/:id/commands returns pending commands
  - POST /api/commands/:id/ack acknowledges command
  - Supports result/error reporting in acknowledgment
- Non-Functional: Polling interval recommended 500ms

#### 3.5 Event Streaming

**REQ-ES-01: Store Events**
- User Story: As hook, I can store events for a session with WebSocket broadcast
- Acceptance Criteria:
  - Validates event schema (Zod)
  - Stores in memory (10K limit per session, FIFO eviction)
  - Stores in Redis (24h TTL, ZSET by timestamp)
  - Publishes to Redis pub/sub (afw:events channel)
  - Broadcasts to WebSocket subscribers
- Non-Functional: < 10ms event storage + broadcast

**REQ-ES-02: Query Events**
- User Story: As user, I can query events for a session with filtering
- Acceptance Criteria:
  - Get all events (GET /api/events/:sessionId)
  - Get recent events (limit, time window)
  - Filter by timestamp (since parameter)
  - Filter by event type
- Non-Functional: < 100ms for 10K events

**REQ-ES-03: WebSocket Subscriptions**
- User Story: As frontend, I can subscribe to session events via WebSocket
- Acceptance Criteria:
  - Client sends {type: 'subscribe', sessionId}
  - Server tracks subscriptions per client
  - Broadcasts events only to subscribed clients
  - Supports multiple sessions per client
  - Heartbeat timeout detection (30s)
- Non-Functional: Max 1000 concurrent clients, 50 msg/sec per client

#### 3.6 File Operations

**REQ-FO-01: File Tree**
- User Story: As user, I can browse session working directory as a tree
- Acceptance Criteria:
  - Recursive directory traversal (depth limit 3, configurable)
  - Hidden file filtering (toggle)
  - Ignore patterns (node_modules, __pycache__, dist, build)
  - Returns DirectoryEntry[] with type, size, modified
- Non-Functional: < 500ms for 1000 files

**REQ-FO-02: Read File**
- User Story: As user, I can read file contents from session directory
- Acceptance Criteria:
  - Path validation (prevent traversal)
  - Size limit (10MB)
  - Encoding detection (UTF-8, binary)
  - Returns content, size, modified timestamp
- Non-Functional: < 200ms for 1MB file

**REQ-FO-03: Write File**
- User Story: As agent, I can write file contents to session directory
- Acceptance Criteria:
  - Path validation
  - Size limit (10MB)
  - Atomic write (temp file → rename)
  - File change attribution (stepNumber, action)
  - Broadcasts file:modified or file:created event
- Non-Functional: < 300ms for 1MB file

**REQ-FO-04: File Watching**
- User Story: As system, I can detect external file changes and attribute to steps
- Acceptance Criteria:
  - Chokidar watcher with depth limit (10 levels)
  - Tracks active step for attribution
  - Broadcasts file:created, file:modified, file:deleted events
  - Auto-start on session create, auto-stop on session end
- Non-Functional: < 100ms change detection latency

#### 3.7 Terminal Output

**REQ-TO-01: Post Output**
- User Story: As agent, I can post stdout/stderr output to terminal buffer
- Acceptance Criteria:
  - Stream separation (stdout/stderr)
  - Step attribution (stepNumber, action)
  - In-memory line buffer
  - Broadcasts terminal:output event
- Non-Functional: < 10ms buffer append

**REQ-TO-02: Get Buffer**
- User Story: As user, I can retrieve buffered terminal output with limit
- Acceptance Criteria:
  - Returns OutputLine[] with stream, timestamp, stepNumber, text
  - Supports limit parameter (max returned lines)
  - Returns total size, returned count, truncated flag
- Non-Functional: < 100ms for 10K lines

**REQ-TO-03: Clear Buffer**
- User Story: As user, I can clear terminal buffer for a session
- Acceptance Criteria:
  - Removes all buffered lines
  - Returns success confirmation
- Non-Functional: < 50ms

#### 3.8 Claude CLI Management

**REQ-CLI-01: Start Session**
- User Story: As user, I can start a Claude CLI process for a session
- Acceptance Criteria:
  - Validates environment variables (API key)
  - Validates MCP config path (if provided)
  - Spawns subprocess with args
  - Tracks PID, cwd, prompt
  - Updates project lastUsedAt (fire-and-forget)
  - Broadcasts claude-cli:started event
- Non-Functional: < 500ms spawn time

**REQ-CLI-02: Send Input**
- User Story: As user, I can send stdin to Claude CLI process
- Acceptance Criteria:
  - Validates session exists and is running
  - Writes to process stdin
  - Broadcasts input event
- Non-Functional: < 50ms input delivery

**REQ-CLI-03: Stop Session**
- User Story: As user, I can stop a Claude CLI process
- Acceptance Criteria:
  - Supports signal selection (SIGTERM/SIGINT/SIGKILL)
  - Graceful shutdown with timeout
  - Captures exit code and signal
  - Broadcasts claude-cli:exited event
- Non-Functional: Graceful timeout 5s

**REQ-CLI-04: Stream Output**
- User Story: As system, I can stream Claude CLI stdout/stderr to dashboard
- Acceptance Criteria:
  - Captures process output in real-time
  - Broadcasts claude-cli:output events
  - Supports ANSI color codes
- Non-Functional: < 100ms streaming latency

#### 3.9 Session Windows

**REQ-SW-01: Follow Session**
- User Story: As user, I can mark a session as "followed" for window mode
- Acceptance Criteria:
  - Stores followed state in storage
  - Returns current followed sessions
  - Broadcasts session:followed event
- Non-Functional: < 50ms

**REQ-SW-02: Unfollow Session**
- User Story: As user, I can unfollow a session
- Acceptance Criteria:
  - Removes followed state
  - Broadcasts session:unfollowed event
- Non-Functional: < 50ms

**REQ-SW-03: Enriched Session Data**
- User Story: As user, I can get enriched session data for window display
- Acceptance Criteria:
  - Returns session + chains + window config
  - Includes CLI binding if exists
  - Returns quick actions
- Non-Functional: < 200ms

**REQ-SW-04: Window Configuration**
- User Story: As user, I can update window layout preferences
- Acceptance Criteria:
  - Stores grid position, expanded state, fullScreen flag
  - Persists to storage
- Non-Functional: < 50ms

#### 3.10 Project Registry

**REQ-PR-01: Create Project**
- User Story: As user, I can create a project configuration
- Acceptance Criteria:
  - Validates cwd exists
  - Validates environment variables (key/value regex)
  - Validates MCP config path (if provided)
  - Generates ProjectId (branded)
  - Persists to data/projects/{projectId}.json
  - Returns created project
- Non-Functional: < 100ms

**REQ-PR-02: List Projects**
- User Story: As user, I can list all projects sorted by last used
- Acceptance Criteria:
  - Sorts by lastUsedAt descending
  - Returns all project metadata
- Non-Functional: < 100ms for 100 projects

**REQ-PR-03: Auto-Detect Project**
- User Story: As user, I can auto-detect project type and metadata
- Acceptance Criteria:
  - Detects project type (monorepo, nodejs, python, other)
  - Detects ActionFlows framework (checks .claude/actionflows/)
  - Detects MCP config (checks .claude/mcp.json)
  - Suggests CLI flags based on project type
  - Returns ProjectAutoDetectionResult
- Non-Functional: < 500ms filesystem scan

**REQ-PR-04: Update Project**
- User Story: As user, I can update project configuration
- Acceptance Criteria:
  - Supports partial updates
  - Validates changed fields
  - Updates lastUsedAt if cwd accessed
  - Persists changes
- Non-Functional: < 100ms

**REQ-PR-05: Delete Project**
- User Story: As user, I can delete a project configuration
- Acceptance Criteria:
  - Removes project file from disk
  - Returns success confirmation
- Non-Functional: < 100ms

#### 3.11 Session Discovery

**REQ-SD-01: Discover Sessions**
- User Story: As user, I can discover running Claude Code sessions via IDE lock files
- Acceptance Criteria:
  - Scans for .code/ide-lock-*.lock files
  - Parses lock file metadata (PID, cwd)
  - Filters by alive PIDs (if aliveOnly=true)
  - Enriches with JSONL data (if enrich=true)
  - Returns DiscoveredSession[] with enrichment
- Non-Functional: < 1s for 10 lock files

#### 3.12 User Management

**REQ-UM-01: List Users**
- User Story: As user, I can view all active users with session counts
- Acceptance Criteria:
  - Aggregates sessions by UserId
  - Calculates online status (has pending/in_progress session)
  - Returns user list sorted by online status, then session count
- Non-Functional: < 100ms for 100 users

**REQ-UM-02: User Sessions**
- User Story: As user, I can view all sessions for a specific user
- Acceptance Criteria:
  - Filters sessions by UserId
  - Returns full session objects
- Non-Functional: < 100ms

#### 3.13 Security & Authentication

**REQ-SA-01: API Key Authentication**
- User Story: As system, I can protect API endpoints with API key
- Acceptance Criteria:
  - Validates AFW_API_KEY environment variable
  - Supports header (X-API-Key) and query param (apiKey)
  - Returns 401 Unauthorized on invalid key
  - Supports key rotation via config
- Non-Functional: < 5ms validation overhead

**REQ-SA-02: Rate Limiting**
- User Story: As system, I can rate limit API requests to prevent abuse
- Acceptance Criteria:
  - General limiter: 1000 req / 15 min
  - Write limiter: 30 req / 15 min
  - Session create limiter: 10 req / 15 min
  - WebSocket: 50 msg/sec per client
  - Returns 429 Too Many Requests
- Non-Functional: Configurable via AFW_RATE_LIMIT_DISABLED

**REQ-SA-03: Path Validation**
- User Story: As system, I can prevent path traversal attacks
- Acceptance Criteria:
  - Validates file paths against deny list
  - Normalizes paths before checking
  - Denies: /etc, /sys, /proc, /dev, /root, /boot, /bin, /sbin, C:\Windows, C:\Program Files
  - Returns 403 Forbidden
- Non-Functional: < 1ms validation

**REQ-SA-04: Input Validation**
- User Story: As system, I can validate all request payloads with Zod schemas
- Acceptance Criteria:
  - Defines schemas for all POST/PUT requests
  - Returns 400 Bad Request with validation errors
  - Sanitizes error messages (no stack traces)
- Non-Functional: < 5ms validation

#### 3.14 Frontend UI Requirements

**REQ-UI-01: Session List Sidebar**
- User Story: As user, I can browse users and their sessions in left sidebar
- Acceptance Criteria:
  - User avatar (2-letter initials)
  - Online status indicator (green dot)
  - Session count badge
  - Expandable session tree per user
  - Attach/detach buttons per session
  - "You" label for current user
- Non-Functional: Smooth animation, keyboard navigation

**REQ-UI-02: File Explorer Sidebar**
- User Story: As user, I can browse session directory in left sidebar
- Acceptance Criteria:
  - Tree view with expand/collapse
  - File type icons
  - Hidden file toggle
  - Refresh button
  - Double-click to open in editor
- Non-Functional: Lazy loading for deep trees

**REQ-UI-03: Session Pane**
- User Story: As user, I can view a session with chain visualization and conversation
- Acceptance Criteria:
  - Header: user avatar, session ID, status badge, control buttons, view toggle, close (×)
  - Content: DAG/Timeline view (60%) + ConversationPanel (40%)
  - Footer: chain title, step count
  - Empty state: "Waiting for orchestrator to compile a chain..."
- Non-Functional: Responsive layout, min 400px width

**REQ-UI-04: DAG Visualization**
- User Story: As user, I can view chain as directed acyclic graph
- Acceptance Criteria:
  - Nodes: step bubbles with status colors
  - Edges: directed arrows, animated when active
  - Controls: pan, zoom (0.1x–2x), fit-to-view, minimap
  - Stats header: total steps, completed, failed, in-progress, parallel groups
  - Legend: color key for statuses
  - Click step → open StepInspector
- Non-Functional: 60fps animation, handles 100+ steps

**REQ-UI-05: Timeline View**
- User Story: As user, I can view chain as horizontal timeline
- Acceptance Criteria:
  - Steps left-to-right
  - Status color blocks
  - Duration labels
  - Click to inspect
- Non-Functional: Better for long sequential chains

**REQ-UI-06: Flow Visualization with Swimlanes**
- User Story: As user, I can view chain with swimlane layout and animations
- Acceptance Criteria:
  - Swimlanes grouped by category
  - Animated nodes: slide-in, pulse, shrink, shake
  - Animated edges: golden arrows for active flow
  - Swimlane background separators
- Non-Functional: Phase 2 feature, 60fps animation

**REQ-UI-07: Code Editor Panel**
- User Story: As user, I can edit files in right sidebar with Monaco editor
- Acceptance Criteria:
  - Multi-tab support
  - Syntax highlighting (15+ languages)
  - Ctrl+S to save
  - Conflict detection and resolution dialog
  - Dirty flag on unsaved changes
  - Dark theme, line numbers, word wrap, minimap
- Non-Functional: < 500ms file load for 10K lines

**REQ-UI-08: Terminal Panel**
- User Story: As user, I can view terminal output in bottom panel
- Acceptance Criteria:
  - Multi-tab (one per attached session)
  - Combined mode (interleaved output with session ID prefix)
  - Resizable (100–600px height)
  - Collapsible
  - Step attribution: [#3 action] in color
  - Search (Ctrl+Shift+F)
  - Clear, export buttons
- Non-Functional: Handles 10K lines without lag

**REQ-UI-09: Conversation Panel**
- User Story: As user, I can interact with Claude via conversation panel
- Acceptance Criteria:
  - Displays last prompt
  - Quick response buttons (if provided)
  - Message history
  - Input field with Send button
  - Shift+Enter for new line
- Non-Functional: Input submit < 100ms

**REQ-UI-10: Control Buttons**
- User Story: As user, I can pause/resume/cancel sessions with control buttons
- Acceptance Criteria:
  - Pause button (graceful vs immediate option)
  - Resume button (from current vs beginning option)
  - Cancel button (step-only vs entire chain option)
  - Confirmation dialog for destructive actions
  - Disabled states with title hints
- Non-Functional: Visual feedback on command submission

**REQ-UI-11: Step Inspector**
- User Story: As user, I can view step details in modal/panel
- Acceptance Criteria:
  - Input parameters (formatted JSON)
  - Output/result (formatted)
  - Errors (if failed)
  - Learnings (Issue, Root Cause, Suggestion)
  - File changes list
  - Close button
- Non-Functional: Modal overlay, keyboard Esc to close

**REQ-UI-12: Notification Manager**
- User Story: As user, I receive desktop notifications for important events
- Acceptance Criteria:
  - Step failures (if isCritical=true)
  - Chain completions
  - Electron IPC invoke: show-notification
  - Notification contains title, body, urgency
- Non-Functional: System tray integration, respects OS notification settings

**REQ-UI-13: Toast Notifications**
- User Story: As user, I see toast messages for UI actions
- Acceptance Criteria:
  - File save confirmations
  - Conflict warnings
  - Error messages
  - Auto-dismiss (5s default)
  - Dismissible with × button
- Non-Functional: Non-blocking, max 3 concurrent toasts

**REQ-UI-14: Session Window Mode**
- User Story: As user, I can switch to session window mode for grid layout
- Acceptance Criteria:
  - Sidebar: all sessions with follow/unfollow buttons
  - Grid: responsive (1 wide, 2x2, 2x3, 3-column)
  - Each tile: session header, flow visualization, conversation panel, close button
  - Tile resizing, rearrangement
- Non-Functional: Smooth layout transitions

**REQ-UI-15: Split Pane Layout**
- User Story: As user, I can view multiple sessions in split panes (classic mode)
- Acceptance Criteria:
  - Dynamic grid: 1 → full width, 2 → 50/50, 3 → 2:1, 4+ → 2x2+
  - Max 6 attached sessions (localStorage persistence)
  - Independent controls per pane
  - Detach button per pane
- Non-Functional: Auto-layout on attach/detach

**REQ-UI-16: Claude CLI Dialog**
- User Story: As user, I can start a new Claude CLI session via dialog
- Acceptance Criteria:
  - Project selector dropdown
  - Prompt input field
  - CLI flags input (optional)
  - Environment variables input (optional)
  - MCP config path input (optional)
  - Start button, Cancel button
- Non-Functional: Form validation before submit

**REQ-UI-17: Project Configuration Form**
- User Story: As user, I can create/edit project configurations
- Acceptance Criteria:
  - Name, cwd inputs
  - Default CLI flags (array input)
  - Default prompt template (textarea)
  - MCP config path input
  - Environment variables (key-value pairs)
  - Quick action presets (array of definitions)
  - Description textarea
  - Save, Cancel buttons
- Non-Functional: Validation on save

**REQ-UI-18: Discovered Sessions List**
- User Story: As user, I can view auto-discovered IDE lock file sessions
- Acceptance Criteria:
  - List with cwd, PID, last activity
  - Enrichment data (if available): latest session ID, last prompt, git branch
  - Attach button per session
  - Refresh button
- Non-Functional: Auto-refresh every 10s

**REQ-UI-19: WebSocket Status Indicator**
- User Story: As user, I can see WebSocket connection status
- Acceptance Criteria:
  - States: Connecting (yellow), Connected (green), Disconnected (red), Error (red)
  - Tooltip shows details
  - Reconnect button (if disconnected)
- Non-Functional: Real-time status updates

**REQ-UI-20: Electron Tray Integration**
- User Story: As user, I can minimize app to system tray
- Acceptance Criteria:
  - Tray icon with context menu
  - Menu: Show/Hide, Quit
  - Click tray → toggle window visibility
  - On close → hide window (not quit)
  - On app quit → close window for real
- Non-Functional: Works on Windows, macOS, Linux

---

### 4. Orchestrator Routing Guide

#### 4.1 Department Mapping

| Requirement Type | Department | Rationale |
|-----------------|-----------|-----------|
| Session management (REQ-SM-*) | Engineering | Backend API + frontend UI |
| Chain orchestration (REQ-CO-*) | Engineering | Core orchestration logic |
| Step execution (REQ-SE-*) | Engineering | Agent execution framework |
| Command queue (REQ-CQ-*) | Engineering | Backend API + hook integration |
| Event streaming (REQ-ES-*) | Engineering | WebSocket + Redis pub/sub |
| File operations (REQ-FO-*) | Engineering | Backend API + frontend UI |
| Terminal output (REQ-TO-*) | Engineering | Backend buffering + frontend xterm |
| Claude CLI (REQ-CLI-*) | Engineering | Backend subprocess + frontend UI |
| Session windows (REQ-SW-*) | Engineering | Frontend UI state |
| Project registry (REQ-PR-*) | Engineering | Backend persistence + frontend forms |
| Session discovery (REQ-SD-*) | Engineering | Backend filesystem scan |
| User management (REQ-UM-*) | Engineering | Backend aggregation + frontend UI |
| Security (REQ-SA-*) | QA | Security audit + remediation |
| Frontend UI (REQ-UI-*) | Engineering | React components + Electron |

#### 4.2 Flow Identification

| Requirement | Existing Flow | Action Composition |
|------------|--------------|-------------------|
| REQ-SM-01 to REQ-SM-05 | code-and-review/ | code/backend → review/ |
| REQ-CO-01 to REQ-CO-03 | code-and-review/ | code/backend → review/ |
| REQ-SE-01 to REQ-SE-03 | code-and-review/ | code/backend → review/ |
| REQ-CQ-01 to REQ-CQ-02 | code-and-review/ | code/backend → review/ |
| REQ-ES-01 to REQ-ES-03 | code-and-review/ | code/backend → code/frontend → review/ |
| REQ-FO-01 to REQ-FO-04 | code-and-review/ | code/backend → code/frontend → review/ |
| REQ-TO-01 to REQ-TO-03 | code-and-review/ | code/backend → code/frontend → review/ |
| REQ-CLI-01 to REQ-CLI-04 | code-and-review/ | code/backend → code/frontend → review/ |
| REQ-SW-01 to REQ-SW-04 | code-and-review/ | code/frontend → review/ |
| REQ-PR-01 to REQ-PR-05 | code-and-review/ | code/backend → code/frontend → review/ |
| REQ-SD-01 | code-and-review/ | code/backend → review/ |
| REQ-UM-01 to REQ-UM-02 | code-and-review/ | code/backend → code/frontend → review/ |
| REQ-SA-01 to REQ-SA-04 | audit-and-fix/ | audit/ → review/ |
| REQ-UI-01 to REQ-UI-20 | code-and-review/ | code/frontend → review/ |

#### 4.3 Action Chain Patterns

**Pattern 1: Shared Types → Backend → Frontend**
- Step 1: Define types in packages/shared/src/ (code/)
- Step 2: Implement backend API in packages/backend/src/ (code/backend)
- Step 3: Implement frontend UI in packages/app/src/ (code/frontend)
- Step 4: Review all changes (review/)
- Example: REQ-ES-03 WebSocket Subscriptions

**Pattern 2: Backend-Only Feature**
- Step 1: Implement in packages/backend/src/ (code/backend)
- Step 2: Review changes (review/)
- Example: REQ-FO-04 File Watching

**Pattern 3: Frontend-Only Feature**
- Step 1: Implement in packages/app/src/ (code/frontend)
- Step 2: Review changes (review/)
- Example: REQ-UI-14 Session Window Mode

**Pattern 4: Security Audit → Remediation**
- Step 1: Audit security (audit/)
- Step 2: Review findings (review/)
- Step 3: (If critical findings) Fix vulnerabilities (code/backend or code/frontend)
- Step 4: Re-review (review/)
- Example: REQ-SA-01 to REQ-SA-04

**Pattern 5: Cross-Package Refactor**
- Step 1: Analyze dependencies (analyze/)
- Step 2: Plan refactoring (plan/)
- Step 3: Update shared types (code/)
- Step 4: Update backend (code/backend)
- Step 5: Update frontend (code/frontend)
- Step 6: Run tests (test/)
- Step 7: Review all changes (review/)
- Example: Moving functionality between packages

---

### 5. Dependency Matrix

#### 5.1 Feature-to-Feature Dependencies

```
Session Management (REQ-SM-*)
    ↓ requires
Domain Model (Section 2) [branded types, Session interface]
    ↓ required by
Chain Orchestration (REQ-CO-*)
    ↓ required by
Step Execution (REQ-SE-*)

Event Streaming (REQ-ES-*)
    ← uses
Session Management, Chain Orchestration, Step Execution

File Operations (REQ-FO-*)
    ← uses
Session Management (for path validation)

Terminal Output (REQ-TO-*)
    ← uses
Session Management, Step Execution (for attribution)

Claude CLI (REQ-CLI-*)
    ← uses
Session Management, Project Registry, Event Streaming

Session Windows (REQ-SW-*)
    ← uses
Session Management

Project Registry (REQ-PR-*)
    ← used by
Claude CLI

Session Discovery (REQ-SD-*)
    → independent

User Management (REQ-UM-*)
    ← uses
Session Management

Security (REQ-SA-*)
    → applies to all

Frontend UI (REQ-UI-*)
    ← uses
All backend features
```

#### 5.2 Parallel vs Sequential Work

**Can Be Done in Parallel (after shared types defined):**
- REQ-SM-* (Session API) + REQ-CO-* (Chain API) + REQ-SE-* (Step API)
- REQ-FO-* (File API) + REQ-TO-* (Terminal API) + REQ-CLI-* (CLI API)
- REQ-PR-* (Project API) + REQ-SD-* (Discovery API) + REQ-UM-* (User API)
- REQ-UI-01 to REQ-UI-20 (Frontend components, after backend APIs ready)

**Must Be Done Sequentially:**
1. Domain Model (Section 2) — Defines types
2. Backend APIs (REQ-SM-* through REQ-UM-*) — Implements data layer
3. Frontend UI (REQ-UI-*) — Consumes backend APIs
4. Security Audit (REQ-SA-*) — Validates implementation

#### 5.3 Critical Path Analysis

**Critical Path (must be sequential):**
```
1. Domain Model (branded types, interfaces) — 1 day
    ↓
2. Storage Layer (Memory + Redis) — 2 days
    ↓
3. Session Management API — 1 day
    ↓
4. Chain/Step Orchestration API — 2 days
    ↓
5. Event Streaming (WebSocket + Redis pub/sub) — 2 days
    ↓
6. Frontend WebSocket Context — 1 day
    ↓
7. Frontend Session Pane + DAG — 3 days
    ↓
8. Integration Testing — 2 days
```

**Total Critical Path: ~14 days**

**Parallelizable Work (can reduce total time):**
- File Operations API (2 days) in parallel with Step 4
- Terminal Output API (1 day) in parallel with Step 4
- Claude CLI API (2 days) in parallel with Step 5
- Project Registry API (1 day) in parallel with Step 5
- Frontend File Explorer + Code Editor (3 days) in parallel with Step 7
- Frontend Terminal Panel (2 days) in parallel with Step 7
- Frontend Control Buttons + Conversation (2 days) in parallel with Step 7

**Optimized Total Time: ~14 days** (critical path dominates)

---

### 6. Non-Functional Requirements

#### 6.1 Performance

**NFR-P-01: API Response Time**
- Target: < 200ms for 95th percentile
- Measurement: Response time from request receipt to response send
- Applies to: All GET/POST/PUT/DELETE endpoints

**NFR-P-02: WebSocket Event Latency**
- Target: < 100ms from event storage to client receipt
- Measurement: Timestamp delta between storage and client onmessage
- Applies to: All WebSocket broadcasts

**NFR-P-03: File Tree Loading**
- Target: < 500ms for 1000 files
- Measurement: Time from API call to response
- Applies to: GET /api/files/:sessionId/tree

**NFR-P-04: Terminal Output Rendering**
- Target: Handle 10K lines without lag
- Measurement: Scroll performance, no dropped frames
- Applies to: xterm.js rendering in TerminalTabs

**NFR-P-05: DAG Visualization**
- Target: 60fps animation for 100+ steps
- Measurement: Frame rate during pan/zoom/step updates
- Applies to: ReactFlow in ChainDAG

**NFR-P-06: Code Editor Loading**
- Target: < 500ms for 10K lines
- Measurement: Time from file open to editor ready
- Applies to: Monaco editor in CodeEditor

#### 6.2 Scalability

**NFR-S-01: Concurrent Sessions**
- Target: 1000 active sessions in memory
- Eviction: FIFO (oldest completed)
- Applies to: Memory storage backend

**NFR-S-02: Events Per Session**
- Target: 10K events per session
- Eviction: FIFO (oldest events)
- Applies to: Memory storage backend

**NFR-S-03: WebSocket Clients**
- Target: 1000 concurrent clients
- Rate limit: 50 msg/sec per client
- Applies to: WebSocket server

**NFR-S-04: API Rate Limiting**
- General: 1000 req / 15 min per IP
- Write: 30 req / 15 min per IP
- Session create: 10 req / 15 min per IP
- Applies to: All API routes

#### 6.3 Reliability

**NFR-R-01: Session Persistence**
- Target: 7-day retention for completed sessions
- Mechanism: File persistence to data/history/{date}/
- Applies to: Session history

**NFR-R-02: WebSocket Auto-Reconnect**
- Target: Reconnect within 30s on disconnect
- Mechanism: Exponential backoff (3s → 30s max)
- Applies to: WebSocketContext

**NFR-R-03: Graceful Degradation**
- Target: Step failure doesn't crash chain
- Mechanism: Continue remaining steps, report failures
- Applies to: Step execution

**NFR-R-04: Error Sanitization**
- Target: No stack traces or implementation details in API responses
- Mechanism: Error handler middleware
- Applies to: All API routes

#### 6.4 Security

**NFR-SEC-01: API Key Enforcement**
- Mechanism: AFW_API_KEY environment variable
- Supports: Header (X-API-Key) and query param (apiKey)
- Applies to: All API routes + WebSocket upgrade

**NFR-SEC-02: Path Traversal Prevention**
- Mechanism: Deny list + path normalization
- Denies: System paths (/etc, C:\Windows, etc.)
- Applies to: File operations

**NFR-SEC-03: Input Validation**
- Mechanism: Zod schemas on all POST/PUT requests
- Validation: Type, format, length, required fields
- Applies to: All API routes

**NFR-SEC-04: Rate Limiting**
- Mechanism: express-rate-limit middleware
- Configurable: AFW_RATE_LIMIT_DISABLED=true to disable
- Applies to: All API routes + WebSocket

**NFR-SEC-05: CORS**
- Mechanism: Origin whitelist (AFW_CORS_ORIGINS env var)
- Default: localhost:5173, localhost:3001
- Applies to: All API routes

**NFR-SEC-06: Body Size Limit**
- Limit: 1MB for HTTP requests, 1MB for WebSocket messages
- Mechanism: express.json({ limit: '1mb' })
- Applies to: All API routes + WebSocket

#### 6.5 Usability

**NFR-U-01: Keyboard Navigation**
- Target: All interactive elements accessible via keyboard
- Mechanism: Tab order, focus traps, Esc to close
- Applies to: All frontend UI

**NFR-U-02: ARIA Labels**
- Target: All controls have aria-label or title
- Mechanism: Accessibility attributes
- Applies to: All frontend UI

**NFR-U-03: Dark Theme**
- Target: Dark mode enabled by default
- Mechanism: CSS variables, Monaco vs-dark theme
- Applies to: All frontend UI

**NFR-U-04: Responsive Layout**
- Target: Adapts to window size (min 800x600)
- Mechanism: CSS Grid, flexbox
- Applies to: All frontend UI

**NFR-U-05: Loading States**
- Target: All async operations show loading indicator
- Mechanism: Skeleton loaders, spinners
- Applies to: All frontend UI

---

## PART 2: SRD OUTLINE

### 1. Architecture Overview

#### 1.1 Monorepo Structure

```
ActionFlowsDashboard/
├── packages/
│   ├── backend/          # Express API + WebSocket server
│   ├── app/              # React frontend + Electron
│   ├── shared/           # Shared TypeScript types
│   ├── mcp-server/       # Model Context Protocol server
│   └── hooks/            # Claude Code hook scripts
├── data/
│   ├── history/          # Session persistence (7-day retention)
│   └── projects/         # Project configurations
├── .claude/
│   └── actionflows/      # Framework files (orchestrator, flows, actions)
└── test/
    └── e2e/              # End-to-end tests
```

#### 1.2 Data Flow

```
Claude Code Hook
    ↓ (HTTP POST)
Backend API (Express)
    ↓ (Storage write + Redis pub/sub)
Storage Layer (Memory or Redis)
    ↓ (WebSocket broadcast)
Frontend WebSocketContext
    ↓ (React Context)
Frontend Components
    ↓ (User interaction)
Backend API Commands
    ↓ (Polling by hook)
Claude Code Hook
```

#### 1.3 Tech Stack Per Package

**packages/backend/**
- Express 4.18.3 (HTTP server)
- ws 8.14.2 (WebSocket server)
- ioredis 5.3.2 (Redis client)
- Zod 3.22.4 (schema validation)
- chokidar 3.5.3 (file watching)
- TypeScript 5.3.3 (type safety)

**packages/app/**
- React 18.2.0 (UI framework)
- Vite 5.0.8 (build tool)
- Electron 28.1.0 (desktop app)
- ReactFlow 11.10.4 (DAG visualization)
- Monaco Editor 0.45.0 (code editor)
- xterm 5.3.0 (terminal emulator)
- TypeScript 5.3.3 (type safety)

**packages/shared/**
- TypeScript 5.3.3 (type definitions)
- ES modules (import/export with .js extensions)

**packages/mcp-server/**
- @modelcontextprotocol/sdk 1.0.0 (MCP protocol)
- node-fetch 3.3.2 (HTTP client)
- TypeScript 5.3.3 (type safety)

**packages/hooks/**
- Bash scripts (session-start, session-end, step-complete, etc.)

---

### 2. Orchestrator-Level Design

#### 2.1 Department/Flow Routing Decisions

**Session Management (REQ-SM-*):**
- Department: Engineering
- Flow: code-and-review/
- Rationale: Backend API implementation + frontend integration

**Chain Orchestration (REQ-CO-*):**
- Department: Engineering
- Flow: code-and-review/
- Rationale: Core orchestration logic in backend

**Step Execution (REQ-SE-*):**
- Department: Engineering
- Flow: code-and-review/
- Rationale: Agent execution framework in backend

**Event Streaming (REQ-ES-*):**
- Department: Engineering
- Flow: code-and-review/
- Chain: code/backend (WebSocket + Redis) → code/frontend (WebSocketContext) → review/
- Rationale: Cross-package feature requiring coordination

**File Operations (REQ-FO-*):**
- Department: Engineering
- Flow: code-and-review/
- Chain: code/backend (API endpoints) → code/frontend (FileExplorer + CodeEditor) → review/
- Rationale: Cross-package feature

**Terminal Output (REQ-TO-*):**
- Department: Engineering
- Flow: code-and-review/
- Chain: code/backend (buffering service) → code/frontend (TerminalTabs) → review/
- Rationale: Cross-package feature

**Claude CLI (REQ-CLI-*):**
- Department: Engineering
- Flow: code-and-review/
- Chain: code/backend (subprocess management) → code/frontend (ClaudeCliTerminal) → review/
- Rationale: Cross-package feature

**Session Windows (REQ-SW-*):**
- Department: Engineering
- Flow: code-and-review/
- Chain: code/frontend → review/
- Rationale: Frontend-only UI state

**Project Registry (REQ-PR-*):**
- Department: Engineering
- Flow: code-and-review/
- Chain: code/backend (file persistence) → code/frontend (ProjectForm) → review/
- Rationale: Cross-package feature

**Session Discovery (REQ-SD-*):**
- Department: Engineering
- Flow: code-and-review/
- Chain: code/backend → review/
- Rationale: Backend-only filesystem scan

**User Management (REQ-UM-*):**
- Department: Engineering
- Flow: code-and-review/
- Chain: code/backend (aggregation) → code/frontend (UserSidebar) → review/
- Rationale: Cross-package feature

**Security (REQ-SA-*):**
- Department: QA
- Flow: audit-and-fix/
- Chain: audit/ → review/ → (if critical) code/backend → review/
- Rationale: Security audit with optional remediation

**Frontend UI (REQ-UI-*):**
- Department: Engineering
- Flow: code-and-review/
- Chain: code/frontend → review/
- Rationale: React component implementation

#### 2.2 Action Chain Composition

**Example: REQ-ES-03 WebSocket Subscriptions**

Chain:
1. **code/** — Define WorkspaceEvent discriminated union in packages/shared/src/events.ts
2. **code/backend** — Implement WebSocket handler in packages/backend/src/ws/handler.ts
   - Subscribe message handling
   - Client registry tracking
   - Broadcast to subscribers
3. **code/frontend** — Implement WebSocketContext in packages/app/src/contexts/WebSocketContext.tsx
   - useWebSocket hook
   - Subscribe/unsubscribe methods
   - Event callback registration
4. **review/** — Review all changes
   - Type safety verification
   - Security review (authentication, rate limiting)
   - Error handling review

**Example: REQ-UI-07 Code Editor Panel**

Chain:
1. **code/frontend** — Implement CodeEditor component in packages/app/src/components/CodeEditor/
   - CodeEditor.tsx (Monaco integration)
   - EditorTabs.tsx (tab bar)
   - ConflictDialog.tsx (conflict resolution)
   - DiffView.tsx (diff viewer)
2. **code/frontend** — Implement useEditorFiles hook in packages/app/src/hooks/
   - Read file via API
   - Write file via API
   - Dirty state tracking
3. **code/frontend** — Implement useFileSyncManager hook in packages/app/src/hooks/
   - Detect file:modified events
   - Compare timestamps
   - Trigger conflict dialog
4. **review/** — Review all changes
   - Conflict detection logic
   - Performance (large file handling)
   - Keyboard shortcuts

#### 2.3 Model Selection Rationale

| Action | Model | Rationale |
|--------|-------|-----------|
| code/backend | haiku | Simple CRUD endpoints, predictable patterns |
| code/frontend | haiku | React component implementation, standard hooks |
| code/ (shared types) | haiku | Type definitions, straightforward syntax |
| review/ | sonnet | Needs judgment for code quality, security, patterns |
| audit/ | opus | Deep security/performance analysis |
| analyze/ | sonnet | Codebase understanding, dependency analysis |
| plan/ | sonnet | Implementation planning, risk assessment |
| test/ | haiku | Execute tests, report results |
| commit/ | haiku | Git commit + push |

---

### 3. Agent-Level Design

#### 3.1 Backend Patterns

**Pattern 1: Express Router Middleware Chain**

```typescript
// packages/backend/src/routes/{resource}.ts
import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { generalLimiter, writeLimiter } from '../middleware/rateLimit.js';
import { validateBody } from '../middleware/validate.js';
import { createResourceSchema } from '../schemas/api.js';

const router = Router();

// GET /{resource} - List resources
router.get('/', authMiddleware, generalLimiter, async (req, res) => {
  // Implementation
});

// POST /{resource} - Create resource
router.post(
  '/',
  authMiddleware,
  writeLimiter,
  validateBody(createResourceSchema),
  async (req, res) => {
    // Implementation
  }
);

export default router;
```

**Pattern 2: Zod Validation Schemas**

```typescript
// packages/backend/src/schemas/api.ts
import { z } from 'zod';

export const createSessionSchema = z.object({
  cwd: z.string().min(1),
  hostname: z.string().optional(),
  platform: z.string().optional(),
  userId: z.string().optional(),
});

// Usage in route
const validated = createSessionSchema.parse(req.body);
```

**Pattern 3: Storage Provider Interface**

```typescript
// packages/backend/src/storage/index.ts
export interface Storage {
  // Sessions
  getSession(sessionId: SessionId): Promise<Session | undefined>;
  setSession(session: Session): Promise<void>;

  // Events
  addEvent(sessionId: SessionId, event: WorkspaceEvent): Promise<void>;
  getEvents(sessionId: SessionId): Promise<WorkspaceEvent[]>;

  // Chains
  addChain(sessionId: SessionId, chain: Chain): Promise<void>;
  getChains(sessionId: SessionId): Promise<Chain[]>;

  // Commands
  queueCommand(sessionId: SessionId, command: CommandPayload): Promise<void>;
  getCommands(sessionId: SessionId): Promise<CommandPayload[]>;

  // Pub/Sub (Redis only)
  subscribe?(channel: string, callback: (message: string) => void): Promise<void>;
  publish?(channel: string, message: string): Promise<void>;
}
```

**Pattern 4: WebSocket Event Handlers**

```typescript
// packages/backend/src/ws/handler.ts
export function handleWebSocket(
  ws: WebSocket,
  clientId: string,
  storage: Storage
) {
  ws.on('message', async (data: RawData) => {
    const message = JSON.parse(data.toString());

    // Validate API key per-message
    if (!clientRegistry.validateApiKey(ws, message.apiKey)) {
      ws.send(JSON.stringify({ type: 'error', message: 'Invalid API key' }));
      return;
    }

    // Check rate limit
    if (!clientRegistry.checkRateLimit(ws)) {
      ws.send(JSON.stringify({ type: 'error', message: 'Rate limit exceeded' }));
      return;
    }

    // Handle message type
    switch (message.type) {
      case 'subscribe':
        clientRegistry.subscribe(ws, message.sessionId);
        break;
      case 'unsubscribe':
        clientRegistry.unsubscribe(ws, message.sessionId);
        break;
      case 'input':
        await storage.queueInput(message.sessionId, message.payload);
        break;
      case 'ping':
        ws.send(JSON.stringify({ type: 'pong' }));
        break;
    }
  });
}
```

**Pattern 5: Redis Pub/Sub Broadcasting**

```typescript
// packages/backend/src/storage/redis.ts
async addEvent(sessionId: SessionId, event: WorkspaceEvent): Promise<void> {
  // Store in Redis
  await this.client.lpush(`afw:events:${sessionId}`, JSON.stringify(event));
  await this.client.expire(`afw:events:${sessionId}`, 86400); // 24h TTL

  // Publish to subscribers
  await this.publisher.publish('afw:events', JSON.stringify({
    sessionId,
    event
  }));
}
```

**Pattern 6: File Watcher with Step Attribution**

```typescript
// packages/backend/src/services/fileWatcher.ts
export class FileWatcher {
  private watchers = new Map<SessionId, FSWatcher>();
  private activeSteps = new Map<SessionId, { stepNumber: StepNumber; action: string }>();

  setActiveStep(sessionId: SessionId, stepNumber: StepNumber, action: string) {
    this.activeSteps.set(sessionId, { stepNumber, action });
  }

  startWatching(sessionId: SessionId, cwd: string) {
    const watcher = chokidar.watch(cwd, {
      ignored: /(^|[\/\\])\../, // Ignore dotfiles
      persistent: true,
      depth: 10
    });

    watcher.on('change', (path) => {
      const activeStep = this.activeSteps.get(sessionId);
      this.broadcastFileEvent({
        type: 'file:modified',
        sessionId,
        path,
        stepNumber: activeStep?.stepNumber,
        action: activeStep?.action,
        timestamp: brandedTypes.currentTimestamp()
      });
    });

    this.watchers.set(sessionId, watcher);
  }
}
```

#### 3.2 Frontend Patterns

**Pattern 1: React Hooks (useState, useEffect, useCallback)**

```typescript
// packages/app/src/hooks/useChainState.ts
export function useChainState(events: WorkspaceEvent[]): Chain | null {
  const [chain, setChain] = useState<Chain | null>(null);

  useEffect(() => {
    // Filter events for chain
    const chainEvents = events.filter(e =>
      e.type.startsWith('chain:') || e.type.startsWith('step:')
    );

    // Build chain state from events
    const compiledEvent = chainEvents.find(eventGuards.isChainCompiled);
    if (!compiledEvent) return;

    const newChain: Chain = {
      id: compiledEvent.chainId!,
      sessionId: compiledEvent.sessionId,
      title: compiledEvent.title || 'Untitled Chain',
      steps: compiledEvent.steps || [],
      source: compiledEvent.source || 'composed',
      status: 'pending',
      compiledAt: compiledEvent.timestamp,
    };

    setChain(newChain);
  }, [events]);

  return chain;
}
```

**Pattern 2: Context Providers**

```typescript
// packages/app/src/contexts/WebSocketContext.tsx
interface WebSocketContextValue {
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  send: (message: WorkspaceEvent) => void;
  subscribe: (sessionId: SessionId) => void;
  unsubscribe: (sessionId: SessionId) => void;
  onEvent: (callback: (event: WorkspaceEvent) => void) => () => void;
}

export const WebSocketContext = createContext<WebSocketContextValue | null>(null);

export function WebSocketProvider({ url, children }: Props) {
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('connecting');
  const wsRef = useRef<WebSocket | null>(null);
  const callbacksRef = useRef<Set<(event: WorkspaceEvent) => void>>(new Set());

  // Connection management
  useEffect(() => {
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => setStatus('connected');
    ws.onclose = () => setStatus('disconnected');
    ws.onerror = () => setStatus('error');

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      callbacksRef.current.forEach(cb => cb(message));
    };

    return () => ws.close();
  }, [url]);

  const subscribe = useCallback((sessionId: SessionId) => {
    wsRef.current?.send(JSON.stringify({ type: 'subscribe', sessionId }));
  }, []);

  const onEvent = useCallback((callback: (event: WorkspaceEvent) => void) => {
    callbacksRef.current.add(callback);
    return () => callbacksRef.current.delete(callback);
  }, []);

  return (
    <WebSocketContext.Provider value={{ status, send, subscribe, unsubscribe, onEvent }}>
      {children}
    </WebSocketContext.Provider>
  );
}
```

**Pattern 3: WebSocket Hooks**

```typescript
// packages/app/src/hooks/useEvents.ts
export function useEvents(sessionId: SessionId): WorkspaceEvent[] {
  const wsContext = useContext(WebSocketContext);
  const [events, setEvents] = useState<WorkspaceEvent[]>([]);

  useEffect(() => {
    if (!wsContext) return;

    // Subscribe to session
    wsContext.subscribe(sessionId);

    // Register event callback
    const unsubscribe = wsContext.onEvent((event) => {
      if (event.sessionId === sessionId) {
        setEvents(prev => [...prev, event]);
      }
    });

    // Cleanup
    return () => {
      wsContext.unsubscribe(sessionId);
      unsubscribe();
    };
  }, [sessionId, wsContext]);

  return events;
}
```

**Pattern 4: Electron IPC Boundaries**

```typescript
// packages/app/electron/preload.ts
import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    invoke: (channel: string, ...args: any[]) => {
      const whitelist = ['ping', 'show-notification'];
      if (whitelist.includes(channel)) {
        return ipcRenderer.invoke(channel, ...args);
      }
    },
    send: (channel: string, ...args: any[]) => {
      const whitelist = ['close-app'];
      if (whitelist.includes(channel)) {
        ipcRenderer.send(channel, ...args);
      }
    },
    on: (channel: string, func: (...args: any[]) => void) => {
      const whitelist = ['update-available'];
      if (whitelist.includes(channel)) {
        ipcRenderer.on(channel, (event: IpcRendererEvent, ...args: any[]) => func(...args));
      }
    }
  }
});
```

```typescript
// packages/app/src/hooks/useNotifications.ts
export function useNotifications() {
  const showDesktopNotification = async (title: string, body: string) => {
    if (window.electron?.ipcRenderer) {
      await window.electron.ipcRenderer.invoke('show-notification', {
        title,
        body,
        urgency: 'normal'
      });
    }
  };

  return { showDesktopNotification };
}
```

**Pattern 5: Component Composition & Prop Drilling**

```typescript
// packages/app/src/components/AppContent.tsx
export function AppContent() {
  const allSessions = useAllSessions();
  const { attachedSessionIds, attachedSessions, attachSession, detachSession } = useAttachedSessions(allSessions, 6);

  return (
    <div className="app-content">
      <UserSidebar onSessionAttach={attachSession} />
      <SplitPaneLayout
        sessions={attachedSessions}
        onDetach={detachSession}
        onClose={detachSession}
      />
    </div>
  );
}
```

**Pattern 6: Local Storage Persistence**

```typescript
// packages/app/src/hooks/useAttachedSessions.ts
export function useAttachedSessions(allSessions: Session[], maxAttached: number = 6) {
  const [attachedIds, setAttachedIds] = useState<SessionId[]>(() => {
    const stored = localStorage.getItem('attached-sessions');
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    localStorage.setItem('attached-sessions', JSON.stringify(attachedIds));
  }, [attachedIds]);

  const attachSession = useCallback((sessionId: SessionId) => {
    setAttachedIds(prev => {
      if (prev.includes(sessionId)) return prev;
      const newIds = [...prev, sessionId];
      // Evict oldest if exceeds max
      if (newIds.length > maxAttached) {
        newIds.shift();
      }
      return newIds;
    });
  }, [maxAttached]);

  return { attachedSessionIds: attachedIds, attachSession, detachSession };
}
```

#### 3.3 Shared Patterns

**Pattern 1: Branded String Types**

```typescript
// packages/shared/src/types.ts
export type SessionId = string & { readonly __brand: 'SessionId' };
export type ChainId = string & { readonly __brand: 'ChainId' };
export type StepId = string & { readonly __brand: 'StepId' };
export type StepNumber = number & { readonly __brand: 'StepNumber' };

export const brandedTypes = {
  sessionId: (value: string): SessionId => {
    if (!value || value.trim().length === 0) {
      throw new Error('SessionId cannot be empty');
    }
    return value as SessionId;
  },

  stepNumber: (value: number): StepNumber => {
    if (!Number.isInteger(value) || value < 1) {
      throw new Error('StepNumber must be integer >= 1');
    }
    return value as StepNumber;
  },

  timestamp: (value: string | Date): Timestamp => {
    if (value instanceof Date) {
      if (isNaN(value.getTime())) {
        throw new Error('Invalid Date for Timestamp');
      }
      return value.toISOString() as Timestamp;
    }
    return value as Timestamp;
  }
};
```

**Pattern 2: Discriminated Unions**

```typescript
// packages/shared/src/events.ts
export type WorkspaceEvent =
  | SessionStartedEvent
  | SessionEndedEvent
  | ChainCompiledEvent
  | ChainStartedEvent
  | ChainCompletedEvent
  | StepSpawnedEvent
  | StepStartedEvent
  | StepCompletedEvent
  | StepFailedEvent
  | AwaitingInputEvent
  | InputReceivedEvent
  | FileCreatedEvent
  | FileModifiedEvent
  | FileDeletedEvent
  | TerminalOutputEvent
  | ClaudeCliStartedEvent
  | ClaudeCliOutputEvent
  | ClaudeCliExitedEvent
  | ErrorOccurredEvent
  | WarningOccurredEvent
  | SessionFollowedEvent
  | SessionUnfollowedEvent
  | QuickActionTriggeredEvent
  | FlowNodeClickedEvent;

export const eventGuards = {
  isSessionStarted: (event: WorkspaceEvent): event is SessionStartedEvent =>
    event.type === 'session:started',
  isChainCompiled: (event: WorkspaceEvent): event is ChainCompiledEvent =>
    event.type === 'chain:compiled',
  // ... 22 more guards
};
```

**Pattern 3: ES Module Structure**

```typescript
// packages/shared/src/index.ts
// Re-export all types with .js extension in imports
export * from './types.js';
export * from './models.js';
export * from './events.js';
export * from './commands.js';
export * from './sessionWindows.js';
export * from './projects.js';
```

```json
// packages/shared/package.json
{
  "type": "module",
  "exports": {
    ".": "./src/index.ts"
  }
}
```

---

### 4. Implementation Sequence

#### 4.1 Phase 1: Foundation (Weeks 1-2)

**Week 1: Shared Types + Storage Layer**

Step 1: Define Shared Types
- Action: code/
- Package: packages/shared/src/
- Files: types.ts, models.ts, events.ts, commands.ts
- Deliverable: Branded types, domain models, event discriminated union
- Dependencies: None
- Parallelizable: No

Step 2: Implement Storage Interface
- Action: code/backend
- Package: packages/backend/src/storage/
- Files: index.ts (interface), memory.ts, redis.ts
- Deliverable: Memory and Redis storage backends
- Dependencies: Step 1 (shared types)
- Parallelizable: No

Step 3: Review Shared Types + Storage
- Action: review/
- Scope: packages/shared/, packages/backend/src/storage/
- Focus: Type safety, storage contract consistency
- Dependencies: Step 1, Step 2
- Parallelizable: No

**Week 2: Core Backend APIs (Parallel)**

Step 4a: Implement Session Management API
- Action: code/backend
- Package: packages/backend/src/routes/
- Files: sessions.ts
- Deliverable: POST/GET/PUT /api/sessions endpoints
- Dependencies: Step 3
- Parallelizable: Yes (with 4b, 4c)

Step 4b: Implement Chain/Step API
- Action: code/backend
- Package: packages/backend/src/routes/
- Files: chains.ts (if separate), events.ts
- Deliverable: Chain compilation, step spawning, event storage
- Dependencies: Step 3
- Parallelizable: Yes (with 4a, 4c)

Step 4c: Implement Command Queue API
- Action: code/backend
- Package: packages/backend/src/routes/
- Files: commands.ts
- Deliverable: POST/GET /api/sessions/:id/commands, POST /api/commands/:id/ack
- Dependencies: Step 3
- Parallelizable: Yes (with 4a, 4b)

Step 5: Review Core Backend APIs
- Action: review/
- Scope: packages/backend/src/routes/ (sessions, events, commands)
- Focus: API contract consistency, error handling, security
- Dependencies: Step 4a, 4b, 4c
- Parallelizable: No

#### 4.2 Phase 2: Real-Time Infrastructure (Weeks 3-4)

**Week 3: WebSocket + Event Streaming**

Step 6: Implement WebSocket Server
- Action: code/backend
- Package: packages/backend/src/ws/
- Files: handler.ts, clientRegistry.ts
- Deliverable: WebSocket server with subscribe/unsubscribe, broadcast
- Dependencies: Step 5
- Parallelizable: No

Step 7: Implement Redis Pub/Sub
- Action: code/backend
- Package: packages/backend/src/storage/
- Files: redis.ts (add pub/sub methods)
- Deliverable: Redis pub/sub for distributed event broadcasting
- Dependencies: Step 6
- Parallelizable: No

Step 8: Review WebSocket + Redis Pub/Sub
- Action: review/
- Scope: packages/backend/src/ws/, packages/backend/src/storage/redis.ts
- Focus: WebSocket security, pub/sub reliability, error handling
- Dependencies: Step 7
- Parallelizable: No

**Week 4: File Operations + Terminal + CLI (Parallel)**

Step 9a: Implement File Operations API
- Action: code/backend
- Package: packages/backend/src/routes/
- Files: files.ts
- Deliverable: GET /api/files/:sessionId/tree, GET/POST /api/files/:sessionId/read|write
- Dependencies: Step 8
- Parallelizable: Yes (with 9b, 9c)

Step 9b: Implement Terminal Output API
- Action: code/backend
- Package: packages/backend/src/routes/, packages/backend/src/services/
- Files: terminal.ts, terminalBuffer.ts
- Deliverable: POST/GET/DELETE /api/terminal/:sessionId/output|buffer
- Dependencies: Step 8
- Parallelizable: Yes (with 9a, 9c)

Step 9c: Implement Claude CLI API
- Action: code/backend
- Package: packages/backend/src/routes/, packages/backend/src/services/
- Files: claudeCli.ts, claudeCliManager.ts
- Deliverable: POST /api/claude-cli/start, POST /api/claude-cli/:sessionId/input|stop
- Dependencies: Step 8
- Parallelizable: Yes (with 9a, 9b)

Step 10: Review File/Terminal/CLI APIs
- Action: review/
- Scope: packages/backend/src/routes/ (files, terminal, claudeCli)
- Focus: Path security, subprocess security, error handling
- Dependencies: Step 9a, 9b, 9c
- Parallelizable: No

#### 4.3 Phase 3: Supporting Backend APIs (Week 5)

**Week 5: Session Windows, Projects, Discovery, Users (Parallel)**

Step 11a: Implement Session Windows API
- Action: code/backend
- Package: packages/backend/src/routes/
- Files: sessionWindows.ts
- Deliverable: GET/POST/DELETE /api/session-windows endpoints
- Dependencies: Step 10
- Parallelizable: Yes (with 11b, 11c, 11d)

Step 11b: Implement Project Registry API
- Action: code/backend
- Package: packages/backend/src/routes/, packages/backend/src/services/
- Files: projects.ts, projectStorage.ts, projectDetector.ts
- Deliverable: CRUD /api/projects endpoints, auto-detect
- Dependencies: Step 10
- Parallelizable: Yes (with 11a, 11c, 11d)

Step 11c: Implement Session Discovery API
- Action: code/backend
- Package: packages/backend/src/routes/, packages/backend/src/services/
- Files: discovery.ts, claudeSessionDiscovery.ts
- Deliverable: GET /api/discovery/sessions
- Dependencies: Step 10
- Parallelizable: Yes (with 11a, 11b, 11d)

Step 11d: Implement User Management API
- Action: code/backend
- Package: packages/backend/src/routes/
- Files: users.ts
- Deliverable: GET /api/users, GET /api/users/:userId/sessions
- Dependencies: Step 10
- Parallelizable: Yes (with 11a, 11b, 11c)

Step 12: Review Supporting APIs
- Action: review/
- Scope: packages/backend/src/routes/ (sessionWindows, projects, discovery, users)
- Focus: API completeness, consistency with core APIs
- Dependencies: Step 11a, 11b, 11c, 11d
- Parallelizable: No

#### 4.4 Phase 4: Frontend Foundation (Weeks 6-7)

**Week 6: WebSocket Context + Core Hooks**

Step 13: Implement WebSocketContext
- Action: code/frontend
- Package: packages/app/src/contexts/
- Files: WebSocketContext.tsx
- Deliverable: WebSocket provider with subscribe/unsubscribe, event callbacks
- Dependencies: Step 12
- Parallelizable: No

Step 14: Implement Core Hooks (Parallel)
- Action: code/frontend
- Package: packages/app/src/hooks/
- Files: useWebSocket.ts, useEvents.ts, useChainState.ts, useChainEvents.ts, useSessionControls.ts, useSessionInput.ts
- Deliverable: Hooks for WebSocket, events, chain state, session controls
- Dependencies: Step 13
- Parallelizable: Yes (all hooks can be implemented in parallel)

Step 15: Review WebSocket Context + Core Hooks
- Action: review/
- Scope: packages/app/src/contexts/, packages/app/src/hooks/
- Focus: WebSocket lifecycle, memory leaks, error handling
- Dependencies: Step 14
- Parallelizable: No

**Week 7: Session Pane + DAG Visualization**

Step 16: Implement SessionPane Component
- Action: code/frontend
- Package: packages/app/src/components/SessionPane/
- Files: SessionPane.tsx
- Deliverable: Session header, content area, footer, view toggle
- Dependencies: Step 15
- Parallelizable: No

Step 17: Implement ChainDAG Component
- Action: code/frontend
- Package: packages/app/src/components/ChainDAG/
- Files: ChainDAG.tsx, StepNode.tsx
- Deliverable: DAG visualization with ReactFlow, parallel group detection, step inspector
- Dependencies: Step 16
- Parallelizable: No

Step 18: Review SessionPane + ChainDAG
- Action: review/
- Scope: packages/app/src/components/SessionPane/, packages/app/src/components/ChainDAG/
- Focus: Performance (100+ steps), interaction (click, pan, zoom), accessibility
- Dependencies: Step 17
- Parallelizable: No

#### 4.5 Phase 5: Additional Frontend UI (Weeks 8-10)

**Week 8: Code Editor + File Explorer**

Step 19: Implement CodeEditor Component (Parallel)
- Action: code/frontend
- Package: packages/app/src/components/CodeEditor/
- Files: CodeEditor.tsx, EditorTabs.tsx, ConflictDialog.tsx, DiffView.tsx
- Deliverable: Monaco editor with multi-tab, conflict resolution
- Dependencies: Step 18
- Parallelizable: Yes (with Step 20)

Step 20: Implement FileExplorer Component (Parallel)
- Action: code/frontend
- Package: packages/app/src/components/FileExplorer/
- Files: FileExplorer.tsx, FileTree.tsx, FileIcon.tsx
- Deliverable: Tree view with expand/collapse, hidden file toggle
- Dependencies: Step 18
- Parallelizable: Yes (with Step 19)

Step 21: Review CodeEditor + FileExplorer
- Action: review/
- Scope: packages/app/src/components/CodeEditor/, packages/app/src/components/FileExplorer/
- Focus: Conflict detection logic, file tree performance, keyboard shortcuts
- Dependencies: Step 19, Step 20
- Parallelizable: No

**Week 9: Terminal + Control Buttons + Conversation**

Step 22: Implement TerminalTabs Component
- Action: code/frontend
- Package: packages/app/src/components/Terminal/
- Files: TerminalTabs.tsx
- Deliverable: Multi-tab xterm with combined mode, step attribution
- Dependencies: Step 21
- Parallelizable: Yes (with Step 23, Step 24)

Step 23: Implement ControlButtons Component
- Action: code/frontend
- Package: packages/app/src/components/ControlButtons/
- Files: ControlButtons.tsx
- Deliverable: Pause/resume/cancel buttons with confirmation
- Dependencies: Step 21
- Parallelizable: Yes (with Step 22, Step 24)

Step 24: Implement ConversationPanel Component
- Action: code/frontend
- Package: packages/app/src/components/ConversationPanel/
- Files: ConversationPanel.tsx
- Deliverable: Chat-like UI with quick responses, input field
- Dependencies: Step 21
- Parallelizable: Yes (with Step 22, Step 23)

Step 25: Review Terminal + Controls + Conversation
- Action: review/
- Scope: packages/app/src/components/Terminal/, ControlButtons/, ConversationPanel/
- Focus: Terminal performance (10K lines), control command flow, conversation UX
- Dependencies: Step 22, Step 23, Step 24
- Parallelizable: No

**Week 10: Sidebars + Layout Components**

Step 26: Implement UserSidebar Component
- Action: code/frontend
- Package: packages/app/src/components/UserSidebar/
- Files: UserSidebar.tsx, SessionTree.tsx
- Deliverable: User list with session trees, attach/detach buttons
- Dependencies: Step 25
- Parallelizable: Yes (with Step 27, Step 28)

Step 27: Implement SessionWindowSidebar Component
- Action: code/frontend
- Package: packages/app/src/components/SessionWindowSidebar/
- Files: SessionWindowSidebar.tsx
- Deliverable: Follow/unfollow sessions for window mode
- Dependencies: Step 25
- Parallelizable: Yes (with Step 26, Step 28)

Step 28: Implement SplitPaneLayout + SessionWindowGrid
- Action: code/frontend
- Package: packages/app/src/components/SplitPaneLayout/, SessionWindowGrid/
- Files: SplitPaneLayout.tsx, SessionWindowGrid.tsx, SessionWindowTile.tsx
- Deliverable: Dynamic grid layout for 1-7+ sessions, responsive tiles
- Dependencies: Step 25
- Parallelizable: Yes (with Step 26, Step 27)

Step 29: Review Sidebars + Layouts
- Action: review/
- Scope: packages/app/src/components/ (UserSidebar, SessionWindowSidebar, SplitPaneLayout, SessionWindowGrid)
- Focus: Layout responsiveness, state management, performance
- Dependencies: Step 26, Step 27, Step 28
- Parallelizable: No

#### 4.6 Phase 6: Claude CLI + Project Management (Week 11)

**Week 11: Claude CLI Integration**

Step 30: Implement ClaudeCliTerminal Component
- Action: code/frontend
- Package: packages/app/src/components/ClaudeCliTerminal/
- Files: ClaudeCliTerminal.tsx, ClaudeCliStartDialog.tsx, ProjectSelector.tsx, ProjectForm.tsx, DiscoveredSessionsList.tsx
- Deliverable: Interactive xterm for Claude CLI, start dialog, project management
- Dependencies: Step 29
- Parallelizable: No

Step 31: Review Claude CLI Integration
- Action: review/
- Scope: packages/app/src/components/ClaudeCliTerminal/
- Focus: Subprocess lifecycle, input/output streaming, project configuration
- Dependencies: Step 30
- Parallelizable: No

#### 4.7 Phase 7: Electron Integration (Week 12)

**Week 12: Electron Main Process + Preload**

Step 32: Implement Electron Main Process
- Action: code/frontend
- Package: packages/app/electron/
- Files: main.ts, preload.ts
- Deliverable: Window management, tray integration, IPC boundaries, notifications
- Dependencies: Step 31
- Parallelizable: No

Step 33: Review Electron Integration
- Action: review/
- Scope: packages/app/electron/
- Focus: Security (preload whitelist), tray behavior, notification permissions
- Dependencies: Step 32
- Parallelizable: No

#### 4.8 Phase 8: Security Audit + Testing (Weeks 13-14)

**Week 13: Security Audit**

Step 34: Security Audit
- Action: audit/
- Scope: All packages (focus on backend security, Electron security)
- Type: Security
- Deliverable: Audit report with findings (CRITICAL, HIGH, MEDIUM, LOW)
- Dependencies: Step 33
- Parallelizable: No

Step 35: Security Remediation (if CRITICAL/HIGH findings)
- Action: code/backend or code/frontend (based on findings)
- Scope: Affected packages
- Deliverable: Fixes for critical/high findings
- Dependencies: Step 34
- Parallelizable: No (depends on audit findings)

Step 36: Review Security Remediation
- Action: review/
- Scope: Files changed in Step 35
- Focus: Verify fixes address findings, no new vulnerabilities
- Dependencies: Step 35
- Parallelizable: No

**Week 14: Integration Testing**

Step 37: Write Integration Tests
- Action: test/
- Scope: E2E scenarios
- Type: Integration
- Test Cases:
  - Session creation → chain compilation → step execution → completion
  - WebSocket subscription → event broadcast → UI update
  - File operations: read → edit → save → conflict detection → resolution
  - Terminal output streaming → step attribution → combined mode
  - Claude CLI: start → input → output → stop
  - Control commands: pause → resume → cancel
- Dependencies: Step 36
- Parallelizable: No

Step 38: Review Integration Tests
- Action: review/
- Scope: test/e2e/
- Focus: Coverage of critical paths, test reliability, assertions
- Dependencies: Step 37
- Parallelizable: No

#### 4.9 Phase 9: Post-Completion (Week 15)

**Week 15: Documentation + Commit + Registry Update**

Step 39: Commit All Changes
- Action: commit/
- Scope: All modified files
- Summary: "feat: Implement ActionFlows Dashboard — complete FRD/SRD implementation"
- Files: List all modified packages
- Dependencies: Step 38
- Parallelizable: No

Step 40: Update Documentation
- Action: code/ (for documentation files)
- Scope: docs/DOCS_INDEX.md, docs/status/IMPLEMENTATION_STATUS.md, docs/status/FRONTEND_IMPLEMENTATION_STATUS.md
- Deliverable: Updated status files reflecting completed features
- Dependencies: Step 39
- Parallelizable: No

Step 41: Update Registry
- Action: Registry line edit (orchestrator direct action)
- Scope: .claude/actionflows/logs/INDEX.md
- Entry: Add execution log line for this implementation
- Dependencies: Step 40
- Parallelizable: No

---

### 5. Risk Assessment

#### 5.1 WebSocket Protocol Changes

| Risk | Impact | Mitigation | Detection |
|------|--------|------------|-----------|
| WebSocket message schema change breaks existing clients | HIGH | Version negotiation, backward compatibility layer | E2E tests, protocol audit |
| Redis pub/sub failure causes event loss | MEDIUM | Graceful degradation to direct WebSocket broadcast | Monitoring, integration tests |
| WebSocket connection leak on rapid reconnect | MEDIUM | Connection pooling, max client limit (1000), cleanup on disconnect | Load testing, memory profiling |
| Heartbeat timeout too aggressive (30s) | LOW | Configurable timeout, exponential backoff | User feedback, timeout logs |

#### 5.2 Breaking API Changes

| Risk | Impact | Mitigation | Detection |
|------|--------|------------|-----------|
| Shared type changes break backend/frontend | HIGH | Strict versioning, TypeScript strict mode | Type checking, integration tests |
| Branded type validation breaks existing data | MEDIUM | Grandfather old data, add migration | Unit tests for factory functions |
| Event discriminated union changes break event guards | MEDIUM | Exhaustive pattern matching, tests for all event types | Unit tests for guards |
| Storage interface changes break Redis/Memory backends | HIGH | Interface versioning, adapter pattern | Storage integration tests |

#### 5.3 Storage Migrations

| Risk | Impact | Mitigation | Detection |
|------|--------|------------|-----------|
| Redis key prefix change requires migration | HIGH | Blue-green deployment, dual-write period | Smoke tests in production |
| Memory eviction policy change loses data | MEDIUM | Configurable limits, clear documentation | Monitoring, user feedback |
| File persistence format change breaks history load | MEDIUM | Versioned format, migration script | History load tests |
| 7-day retention cleanup deletes active session | LOW | Validate session status before delete | Cleanup service tests |

#### 5.4 Electron Security

| Risk | Impact | Mitigation | Detection |
|------|--------|------------|-----------|
| Preload whitelist bypass allows arbitrary IPC | CRITICAL | Code review, strict whitelist, no dynamic channel names | Security audit, penetration testing |
| Insecure IPC handler allows file system access | HIGH | Path validation in main process, sandboxed renderer | Security audit |
| XSS in terminal output allows code execution | HIGH | Sanitize terminal output, disable node integration in renderer | XSS testing, CSP headers |
| Tray persistence reveals sensitive data | LOW | Clear tray on quit, no session data in tray menu | Manual testing |

#### 5.5 Performance Bottlenecks

| Risk | Impact | Mitigation | Detection |
|------|--------|------------|-----------|
| DAG visualization lags with 100+ steps | HIGH | Virtual rendering, memoization, debounced updates | Performance profiling, load testing |
| Terminal rendering freezes with 10K+ lines | MEDIUM | Circular buffer, pagination, virtualized scrolling | Performance profiling |
| File tree load times out for large codebases | MEDIUM | Lazy loading, depth limit, ignore patterns | Performance testing on large repos |
| WebSocket message flood causes UI freeze | MEDIUM | Throttling, batching, backpressure | Stress testing |
| Code editor slow to load large files (10K+ lines) | LOW | Streaming load, syntax highlighting only for visible viewport | Performance testing |

#### 5.6 Concurrency Issues

| Risk | Impact | Mitigation | Detection |
|------|--------|------------|-----------|
| Race condition on file write + read causes conflict false positive | MEDIUM | File watching debounce, timestamp comparison with tolerance | Integration tests |
| Parallel step spawning exceeds system resources | MEDIUM | Concurrency limit, queue with backpressure | Stress testing |
| WebSocket broadcast to 1000 clients causes server overload | HIGH | Batching, pub/sub offload to Redis, rate limiting | Load testing |
| Memory storage FIFO eviction races with read | LOW | Locking, atomic operations | Stress testing |

#### 5.7 Error Handling Gaps

| Risk | Impact | Mitigation | Detection |
|------|--------|------------|-----------|
| Uncaught WebSocket error crashes server | HIGH | Global error handler, graceful shutdown | Error injection testing |
| File watcher error stops all file change detection | MEDIUM | Per-session watcher isolation, restart on error | Error injection testing |
| Redis connection loss halts event streaming | HIGH | Reconnection logic, fallback to Memory storage | Chaos engineering |
| Electron main process crash loses all sessions | HIGH | Session persistence on crash, auto-save | Crash testing |

---

### 6. Quality Assurance

#### 6.1 Testing Strategy

**Unit Testing**
- Scope: Shared types (branded type factories, event guards, command validators)
- Framework: Vitest
- Coverage Target: 80%+ for shared types
- Key Tests:
  - Branded type validation (empty strings, invalid formats)
  - Event guard type narrowing
  - Command validator rules
  - Zod schema validation

**Integration Testing**
- Scope: Backend API routes + Storage layer
- Framework: Vitest + Supertest
- Coverage Target: 70%+ for critical paths
- Key Tests:
  - Session CRUD flow
  - Event storage + retrieval
  - Command queue + acknowledgment
  - File operations with path validation
  - WebSocket subscribe + broadcast

**E2E Testing**
- Scope: Full user workflows (frontend + backend + WebSocket)
- Framework: Playwright (or similar)
- Coverage Target: Critical paths only
- Key Scenarios:
  - Session creation → chain compilation → step execution → completion
  - WebSocket subscription → event broadcast → UI update
  - File read → edit → save → conflict resolution
  - Terminal output streaming with step attribution
  - Claude CLI lifecycle (start → input → output → stop)
  - Control commands (pause → resume → cancel)

**Security Testing**
- Scope: API authentication, path validation, XSS, CSRF
- Tools: Manual audit + automated scanners
- Coverage: All endpoints, Electron IPC boundaries
- Key Tests:
  - API key bypass attempts
  - Path traversal attacks
  - XSS in terminal output
  - CSRF in WebSocket messages
  - Electron preload whitelist bypass

**Performance Testing**
- Scope: DAG visualization, terminal rendering, WebSocket broadcast
- Tools: Lighthouse, React DevTools Profiler
- Coverage: High-load scenarios
- Key Tests:
  - DAG with 100+ steps
  - Terminal with 10K+ lines
  - WebSocket broadcast to 1000 clients
  - File tree for 10K+ files

#### 6.2 Review Checklists

**Code Review Checklist (review/ action)**
- [ ] Type safety: No `as any` without justification
- [ ] Error handling: Try/catch on all async operations
- [ ] Security: Input validation, path validation, no secrets in logs
- [ ] Performance: No N+1 queries, memoized expensive computations
- [ ] Accessibility: ARIA labels on all controls
- [ ] Documentation: JSDoc comments on public APIs
- [ ] Tests: Unit tests for business logic
- [ ] Naming: Clear, consistent, follows conventions

**Security Review Checklist (audit/ action)**
- [ ] Authentication: API key required, validated per-message
- [ ] Authorization: Session ownership checks (if multi-user)
- [ ] Input validation: Zod schemas on all POST/PUT
- [ ] Path validation: Deny list checked, no traversal
- [ ] Rate limiting: Applied to all endpoints
- [ ] CORS: Origin whitelist enforced
- [ ] XSS: Sanitize all user-generated content
- [ ] CSRF: WebSocket messages validated
- [ ] Secrets: No hardcoded API keys, env vars only
- [ ] Electron: Preload whitelist enforced, node integration disabled

**Performance Review Checklist (audit/ action)**
- [ ] API response time: < 200ms for 95th percentile
- [ ] WebSocket latency: < 100ms event delivery
- [ ] UI rendering: 60fps for animations
- [ ] Memory leaks: No subscription leaks, no DOM leaks
- [ ] Bundle size: Code splitting for large libs (Monaco, ReactFlow)
- [ ] Network: Minimal requests, batching where possible

#### 6.3 Audit Scope

**Security Audit (REQ-SA-*)**
- Scope: All packages (focus on backend + Electron)
- Type: Security
- Depth: Deep (CRITICAL, HIGH, MEDIUM, LOW findings)
- Deliverable: Audit report with remediation plan

**Performance Audit**
- Scope: Frontend (DAG, terminal, code editor)
- Type: Performance
- Depth: Medium (identify bottlenecks, suggest optimizations)
- Deliverable: Performance report with optimization plan

**Architecture Audit**
- Scope: Cross-package patterns, dependency graph
- Type: Architecture
- Depth: High-level (identify debt, suggest refactoring)
- Deliverable: Architecture review with refactoring priorities

---

### 7. Learnings Integration

#### 7.1 Known Anti-Patterns to Avoid

**From Backend Analysis:**
1. **Duplicate user routes** — `/api/sessions/users` AND `/api/users` defined in two places
   - Fix: Consolidate route definition, resolve ordering issue
2. **Silent drops** — Input queue silently drops at limit (100 inputs)
   - Fix: Return 429 Too Many Requests instead
3. **Redis listing limitation** — GET `/api/sessions` returns empty for Redis (can't list all keys)
   - Fix: Implement Redis SCAN for pagination
4. **Promise.resolve() everywhere** — Covers sync/async mismatch but masks design issue
   - Fix: Unified async wrapper or AsyncStorage base class

**From Frontend Analysis:**
5. **Hardcoded WebSocket URL** — `ws://localhost:3001/ws` in App.tsx
   - Fix: Use environment variable `VITE_WS_URL` with fallback
6. **Stale closures in terminal** — `writeOutput` callback uses ref to avoid stale closure
   - Fix: Consider reducer pattern or ref-based state machine
7. **No code splitting** — Monaco and ReactFlow bundled into main chunk
   - Fix: Add to rollupOptions.output.manualChunks
8. **Missing accessibility** — Some components lack ARIA labels, keyboard navigation
   - Fix: Add aria-label to all interactive elements, implement FocusTrap for dialogs

**From Shared Types Analysis:**
9. **Generic metadata fields** — `Record<string, unknown>` on Session, CLI session, plan
   - Fix: Define typed metadata interfaces
10. **Type assertions** — 20+ `as any` instead of proper types
    - Fix: Define Express Request extension type, ReactFlow node.data type

#### 7.2 Proven Approaches to Follow

**From Backend Analysis:**
1. **Branded types** — Excellent prevention of ID mixing
2. **Zod validation** — Enforced on all POST/PUT requests
3. **Multi-layer security** — API key + rate limiting + path validation
4. **Graceful degradation** — Step failure doesn't crash chain
5. **File persistence** — 7-day retention for session history
6. **WebSocket subscription model** — Per-client subscriptions, broadcast to subscribers

**From Frontend Analysis:**
7. **Custom hooks** — Encapsulate reusable state logic (useChainState, useSessionControls)
8. **Context providers** — Centralized WebSocket connectivity
9. **Component composition** — Props down, callbacks up pattern
10. **Local storage persistence** — Attached sessions persisted across restarts

**From Shared Types Analysis:**
11. **Event type guards** — Discriminated unions with exhaustive pattern matching
12. **Command builder pattern** — Fluent API with validation
13. **Null-safe event fields** — Three-tier pattern (automatic, parsed, inferred)

#### 7.3 Root Cause Documentation

**From Framework Analysis:**
1. **Issue:** Orchestrator reading project code files violates "it's a sin"
   - **Root Cause:** Lack of pre-action gate enforcement
   - **Fix:** Implement mental checklist before any tool call (Gate 1: Registry edit? Gate 2: Chain compiled? Gate 3: What tool?)

2. **Issue:** Quick triage mode allows content production by orchestrator
   - **Root Cause:** Solo developer pragmatism vs ideological purity
   - **Fix:** Document as "bounded escape hatch" with clear criteria (< 3 files, mechanical changes, single-package)

3. **Issue:** Missing event broadcasts (awaiting_input, input_received)
   - **Root Cause:** Incomplete WebSocket integration
   - **Fix:** Add broadcasts to sessions.ts POST endpoints

4. **Issue:** No pagination on lists (sessions, projects, events)
   - **Root Cause:** Initial implementation focused on simplicity
   - **Fix:** Add limit/offset pagination to all list endpoints

---

## PART 3: CROSS-REFERENCE MATRIX

### FRD Requirements → SRD Sections Mapping

| FRD Requirement | SRD Section | Notes |
|----------------|-------------|-------|
| REQ-SM-01 to REQ-SM-05 (Session Management) | 3.1 Backend Patterns → Pattern 1, 2, 3 | Express Router, Zod validation, Storage interface |
| REQ-CO-01 to REQ-CO-03 (Chain Orchestration) | 3.1 Backend Patterns → Pattern 3 | Storage interface for chain management |
| REQ-SE-01 to REQ-SE-03 (Step Execution) | 3.1 Backend Patterns → Pattern 6 | File watcher with step attribution |
| REQ-CQ-01 to REQ-CQ-02 (Command Queue) | 3.1 Backend Patterns → Pattern 1, 3 | Express Router + Storage |
| REQ-ES-01 to REQ-ES-03 (Event Streaming) | 3.1 Backend Patterns → Pattern 4, 5; 3.2 Frontend Patterns → Pattern 2, 3 | WebSocket handler, Redis pub/sub, WebSocketContext, hooks |
| REQ-FO-01 to REQ-FO-04 (File Operations) | 3.1 Backend Patterns → Pattern 1, 6; 3.2 Frontend Patterns → Pattern 1 | Express Router, file watcher, React hooks |
| REQ-TO-01 to REQ-TO-03 (Terminal Output) | 3.1 Backend Patterns → Pattern 1; 3.2 Frontend Patterns → Pattern 1 | Express Router + React hooks for xterm |
| REQ-CLI-01 to REQ-CLI-04 (Claude CLI) | 3.1 Backend Patterns → Pattern 1; 3.2 Frontend Patterns → Pattern 1, 4 | Subprocess management, Electron IPC |
| REQ-SW-01 to REQ-SW-04 (Session Windows) | 3.1 Backend Patterns → Pattern 3; 3.2 Frontend Patterns → Pattern 6 | Storage + LocalStorage persistence |
| REQ-PR-01 to REQ-PR-05 (Project Registry) | 3.1 Backend Patterns → Pattern 1 | Express Router + file persistence |
| REQ-SD-01 (Session Discovery) | 3.1 Backend Patterns → Pattern 1 | Filesystem scan service |
| REQ-UM-01 to REQ-UM-02 (User Management) | 3.1 Backend Patterns → Pattern 3 | Storage aggregation |
| REQ-SA-01 to REQ-SA-04 (Security) | 3.1 Backend Patterns → Pattern 1 | Middleware stack (auth, rate limit, validation) |
| REQ-UI-01 to REQ-UI-20 (Frontend UI) | 3.2 Frontend Patterns → Pattern 1, 2, 3, 5, 6 | React hooks, contexts, component composition, localStorage |

---

## PART 4: IMPROVEMENT AREAS SUMMARY

### 4.1 Consolidated from Backend Analysis

| Issue | Location | Impact | Priority | Fix |
|-------|----------|--------|----------|-----|
| TODO: Broadcast awaiting_input event | routes/sessions.ts:359 | Medium | Medium | Add WebSocket broadcast |
| TODO: Broadcast input_received event | routes/sessions.ts:453 | Medium | Medium | Add WebSocket broadcast |
| Duplicate user routes | routes/sessions.ts + routes/users.ts | Low | Low | Consolidate definition |
| Redis listing limitation | GET /api/sessions | Medium | High | Implement Redis SCAN |
| Sync vs Async chaos | storage/ | Medium | Medium | Unified async wrapper |
| Input queue silently drops | routes/sessions.ts | Low | Medium | Return 429 on overflow |
| API key in query params | middleware/auth.ts | Medium | High | Remove support, headers only |
| No request logging | All routes | Low | Low | Add structured logging middleware |
| File symlink following | services/fileWatcher.ts | Medium | Medium | Add followSymlinks: false |
| No user-level isolation | All routes | High | High | Implement ACL/ownership checks |
| Memory eviction FIFO | storage/memory.ts | Medium | Medium | TTL + LRU combo |
| No pagination on lists | routes/ | Medium | High | Add limit/offset |

### 4.2 Consolidated from Frontend Analysis

| Issue | Location | Impact | Priority | Fix |
|-------|----------|--------|----------|-----|
| Incomplete screens (5 tabs) | AppContent.tsx | High | Low | Implement Dashboard, Logs, Settings |
| File sync diff viewer simplified | CodeEditor.tsx | Medium | Medium | Integrate proper diff library |
| Hardcoded WebSocket URL | App.tsx | Medium | High | Use VITE_WS_URL env var |
| No session control feedback | ControlButtons.tsx | Low | Medium | Subscribe to session:updated event |
| Stale closures in terminal | TerminalTabs.tsx | Low | Low | Reducer pattern |
| Terminal combined mode ordering | TerminalTabs.tsx | Low | Low | Server timestamp canonical order |
| File tree lazy loading incomplete | useFileTree.ts | Medium | Medium | On-demand API endpoint |
| Keyboard shortcut conflicts | useKeyboardShortcuts.ts | Low | Low | Document shortcuts, test conflicts |
| No code splitting for ReactFlow | vite.config.ts | Medium | Medium | Add to manualChunks |
| Missing accessibility features | Many components | Medium | High | ARIA labels, focus management |

### 4.3 Consolidated from Shared Types Analysis

| Issue | Location | Impact | Priority | Fix |
|-------|----------|--------|----------|-----|
| Generic metadata fields | types.ts, models.ts | Medium | Medium | Define typed metadata interfaces |
| Generic inputs/result fields | models.ts (ChainStep) | High | High | Define InputSchema registry |
| Vague ref field | models.ts (Chain) | Low | Low | Discriminated union for ChainRef |
| Inconsistent enum vs string union | types.ts | Low | Low | Use enum consistently |
| Missing validation in CommandValidator | commands.ts | Medium | Medium | Expand validator to check CLI commands |
| No StepId composition spec | types.ts | Low | Low | Document format, add factory |
| FileChange type minimal | models.ts | Low | Low | Add sizeBytes, diffHunks, language |
| No error type hierarchy | events.ts | Medium | Medium | Define StepError interface |
| Type assertions (20+ as any) | Backend, frontend | High | High | Define proper types |
| No unit tests for shared types | N/A | High | High | Add unit tests |

### 4.4 Consolidated from Framework Analysis

| Issue | Location | Impact | Priority | Fix |
|-------|----------|--------|----------|-----|
| No automated testing flow | FLOWS.md | Medium | Medium | Create test-coverage-improvement/ flow |
| No database migration flow | FLOWS.md | Medium | Low | Create storage-migration/ flow |
| No performance optimization flow | FLOWS.md | Medium | Low | Create performance-optimization/ flow |
| No cross-package refactoring flow | FLOWS.md | Medium | Medium | Create cross-package-refactor/ flow |
| Limited action mode documentation | ACTIONS.md | Low | Low | Add decision matrix |
| No rollback flow | FLOWS.md | Low | Low | Create rollback/ action + flow |
| No self-optimization flow | FLOWS.md | Low | Low | Create framework-optimization/ flow |
| No execution analytics | FLOWS.md | Low | Low | Create execution-analytics/ flow |
| No checklist creation flow | FLOWS.md | Low | Low | Create checklist-creation/ flow |

---

## PART 5: FRAMEWORK PHILOSOPHY INTEGRATION POINTS

### 5.1 Where to Explain Philosophy Dependency

**In FRD:**
- Section 1.1 (Project Context) — Brief mention of ActionFlows framework as orchestration engine
- Section 2.1 (Core Concepts) — Explain Session/Chain/Step as framework embodiments
- Section 4 (Orchestrator Routing Guide) — Explain department/flow routing, action composition
- Section 5 (Dependency Matrix) — Explain action-sized chunks, parallel vs sequential work

**In SRD:**
- Section 1.1 (Monorepo Structure) — Explain .claude/actionflows/ framework files
- Section 2 (Orchestrator-Level Design) — Deep dive into routing decisions, flow identification, model selection
- Section 3 (Agent-Level Design) — Explain backend/frontend patterns as agent implementation patterns
- Section 4 (Implementation Sequence) — Explain steps as spawned actions, dependencies as action chains
- Section 7 (Learnings Integration) — Explain root cause fixing philosophy, learning surface

### 5.2 Philosophy Principles Embedded in Dashboard

| Dashboard Feature | Framework Principle |
|------------------|-------------------|
| Session lifecycle | "Plan First, Execute Second" |
| Chain dependency graph | Explicit dependency tracking |
| Step status tracking | Execution history (INDEX.md) |
| Agent output viewing | Learning surface & fresh eye discovery |
| Error boundary UI | Graceful degradation |
| Retry/skip controls | Root cause fixing + chain recompilation |
| Orchestrator vs Agent panels | Strict delegation boundary |

### 5.3 How Philosophy Shapes Documentation

**FRD Constraints:**
- No implementation details (Express routes, React components)
- Action-oriented language (verb phrasing)
- Explicit approval gates identified
- Domain-focused, not implementation-focused

**SRD Constraints:**
- Three-layer structure (orchestrator → agent → cross-cutting)
- Explicit action chains for every feature
- Risk tables for breaking changes
- Pattern-reuse focused (recurring patterns → flows/actions)

---

## Conclusion

This document provides comprehensive outlines for both the Functional Requirements Document (FRD) and Software Requirements Document (SRD) for the ActionFlows Dashboard project. The outlines incorporate findings from all four analysis reports (backend, frontend, shared/MCP, framework philosophy) and follow the framework's core principles of strict delegation, action-sized decomposition, and explicit dependency tracking.

**Key Deliverables:**
1. **FRD Outline** — 6 main sections with 20+ user requirements, orchestrator routing guide, dependency matrix
2. **SRD Outline** — 7 main sections with three-layer design (orchestrator → agent → cross-cutting), implementation sequence (41 steps across 15 weeks), risk assessment, quality assurance
3. **Cross-Reference Matrix** — Maps FRD requirements to SRD sections
4. **Improvement Areas Summary** — Consolidates 40+ issues from all 4 analyses with priority and fix recommendations
5. **Framework Philosophy Integration Points** — Identifies where to explain framework dependency in both documents

**Next Steps:**
1. Review this plan with the human
2. Use this outline as scaffolding for writing the full FRD document
3. Use this outline as scaffolding for writing the full SRD document
4. Ensure all improvement areas are captured as follow-up work items

---

## Learnings

**Issue:** None — execution proceeded as expected.

**Root Cause:** N/A

**Suggestion:** N/A

[FRESH EYE] The cross-reference matrix revealed that almost all FRD requirements map to common SRD patterns (Express Router, React hooks, WebSocket context). This suggests the architecture is consistent and predictable, which is a strength. However, it also indicates potential for over-abstraction — if every feature follows the same pattern, perhaps some patterns could be further simplified or extracted into reusable scaffolding (e.g., route generator, component generator).

The improvement areas summary shows that most issues fall into three categories: missing features (flows, tests, docs), type safety gaps (generic types, assertions), and architectural inconsistencies (duplicate routes, sync/async mismatch). This suggests a systematic refactoring opportunity: tackle type safety first (high impact, foundational), then architectural consistency (medium impact, reduces debt), then missing features (low impact, nice-to-have).

The framework philosophy integration points highlight a tension: the FRD/SRD structure mirrors the orchestrator/agent boundary, but the dashboard itself IS BOTH (it monitors orchestration AND executes as an application). This meta-level complexity deserves explicit acknowledgment in the documents to avoid confusion.
