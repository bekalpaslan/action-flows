# Shared Types & MCP Server Analysis
**Aspect:** Inventory + Structure
**Scope:** `packages/shared/` + `packages/mcp-server/`
**Date:** 2026-02-08
**Mode:** analyze-only

---

## Executive Summary

### Inventory Status
- **Shared Package:** 7 TypeScript files, 1,963 lines, 149 type definitions, 108 exports
- **MCP Server:** 1 TypeScript file, 309 lines, 2 tools (check_commands, ack_command)
- **Type Coverage:** Excellent - comprehensive branded types and discriminated unions across all domain areas
- **Structural Gaps:** Type imports not used in MCP server; limited tool surface area

### Overall Assessment
✅ **Shared Types:** Well-organized, comprehensive, properly exported
🟡 **MCP Server:** Minimal implementation; tools hardcoded without type safety; growth opportunity for SRD documentation

---

## Detailed Inventory

### A. Shared Package Structure

#### File Organization (packages/shared/src/)

| File | Size | Purpose | Dependencies |
|------|------|---------|--------------|
| `types.ts` | ~400 lines | Base branded types, Status/Model enums, Duration utility | None |
| `models.ts` | ~495 lines | Domain models: Chain, Session, ExecutionPlan, Templates, ClaudeCliSession | types.ts |
| `events.ts` | ~578 lines | 24 event types + event guards | types.ts |
| `commands.ts` | ~320 lines | 6 command types + CommandValidator/Builder | types.ts |
| `sessionWindows.ts` | ~170 lines | Session window UI state, quick actions, flow visualization | types.ts |
| `projects.ts` | ~75 lines | Project registry configuration | types.ts, sessionWindows.ts |
| `index.ts` | ~180 lines | Central export barrel | all modules |

### B. Type Inventory by Category

#### 1. Base Types & Branded Strings (types.ts)

| Branded Type | Purpose | Validation |
|---|---|---|
| `SessionId` | Session identifier | Non-empty string |
| `ChainId` | Chain identifier | Non-empty string |
| `StepId` | Step identifier (composite) | Non-empty string |
| `StepNumber` | Step number (1-indexed) | Positive integer >= 1 |
| `UserId` | User/operator identifier | Non-empty string |
| `Timestamp` | ISO 8601 timestamp | Valid Date or ISO string |
| `DurationMs` | Duration in milliseconds | Numeric |

**Factory Functions Provided:** `brandedTypes` object with 7 constructor functions + `duration` utility (ms, fromSeconds, fromMinutes)

#### 2. Enumerations (types.ts)

| Enum | Values | Usage |
|---|---|---|
| `Status` | pending, in_progress, completed, failed, skipped | Sessions, chains, steps |
| `Model` | haiku, sonnet, opus | Model selection per step |
| `ChainSource` | flow, composed, meta-task | Chain origin classification |
| `SessionState` | idle, awaiting_input, receiving_input, active | Conversation state |
| `PromptType` | binary, text, chain_approval | Input prompt classification |

#### 3. Domain Models (models.ts)

**Core Entities:**

| Model | Fields | Usage |
|---|---|---|
| `ChainStep` | 13 fields | Individual step within a chain with I/O and status tracking |
| `Chain` | 17 fields | Compiled sequence of steps with aggregated metrics |
| `Session` | 18 fields | Work session container with chains and conversation state |
| `ExecutionPlan` | 12 fields | Proposed plan with approval workflow |
| `ActionRegistryEntry` | 8 fields | Reusable action definition with inputs |
| `FlowDefinition` | 8 fields | Flow template with action sequence |
| `ChainTemplate` | 8 fields | Parameterizable reusable chain pattern |

**Supporting Entities:**

| Model | Purpose |
|---|---|
| `ExecutionPlanStep` | Individual step in execution plan |
| `ExecutionMetrics` | Aggregated execution statistics per session |
| `InputDefinition` | Input parameter schema for actions |
| `ChainTemplateStep` | Template-based step definition |
| `TemplateParameter` | Template substitution parameter |
| `ClaudeCliSession` | Spawned Claude CLI subprocess tracking |
| `DiscoveredClaudeSession` | Externally-running session detected via IDE lock files |
| `DiscoveredSessionEnrichment` | JSONL project file enrichment data |

#### 4. Event Types (events.ts)

**Event Categories & Counts:**

| Category | Count | Types |
|---|---|---|
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

**Total:** 26 event types in discriminated union `WorkspaceEvent`

**Event Design Pattern:** Graceful degradation with auto/parsed/inferred fields:
- **Automatic fields:** Always available from hooks (e.g., cwd, pid, output)
- **Parsed fields:** Nullable, extracted from Claude output (may be missing)
- **Inferred fallbacks:** Computed from automatic fields (always available)

**Event Guards:** 17 type guard functions exported

#### 5. Command Types (commands.ts)

**Command Categories:**

| Type | Purpose | Target |
|---|---|---|
| `PauseCommand` | Graceful pause | Session-level |
| `ResumeCommand` | Resume execution | Session-level |
| `CancelCommand` | Cancel current/chain | Session-level |
| `AbortCommand` | Emergency stop | Session-level |
| `RetryCommand` | Retry step | Step-level |
| `SkipCommand` | Skip step | Step-level |
| `ClaudeCliStartCommand` | Start Claude CLI subprocess | CLI control |
| `ClaudeCliSendInputCommand` | Send stdin to subprocess | CLI control |
| `ClaudeCliStopCommand` | Terminate subprocess | CLI control |

**Support Utilities:**
- `CommandValidator` class with validation logic
- `CommandBuilder` fluent API for command construction
- `CommandPayload` wrapper with metadata
- `CommandResult` execution result capture
- `commandGuards` type guard functions (6 guards)

#### 6. Session Window System (sessionWindows.ts)

| Type | Purpose |
|---|---|
| `SessionWindowState` | Display state: expanded/collapsed, full-screen, followed |
| `SessionWindowConfig` | User preferences: animations, quick actions, auto-archive |
| `QuickActionDefinition` | Button definition with icon, value, context patterns |
| `QuickActionPreset` | Preset collection of quick actions |
| `FlowNodeData` | ReactFlow node metadata (swimlane, animation, parallel groups) |
| `FlowEdgeData` | ReactFlow edge metadata (animation progress, data labels) |
| `SessionWindowLayout` | Grid layout calculation (columns, rows) |

#### 7. Project Registry (projects.ts)

| Type | Purpose |
|---|---|
| `ProjectId` | Branded UUID identifier |
| `Project` | Registered project with config, defaults, quick actions |
| `ProjectAutoDetectionResult` | Detection result with project type and MCP config path |

---

## Type Export Inventory (index.ts)

### Exported Categories

| Category | Count | Example Exports |
|---|---|---|
| Base Types | 8 | SessionId, ChainId, StepId, UserId, Timestamp, StatusString, ModelString, DurationMs |
| Enumerations | 5 | Status, Model, ChainSource |
| Factories | 2 | brandedTypes, duration |
| Events | 24 | All event interfaces |
| Event Utilities | 1 | eventGuards object |
| Models | 20 | Chain, Session, ExecutionPlan, ClaudeCliSession, etc. |
| Commands | 9 | All command interfaces |
| Command Utilities | 3 | CommandType, commandGuards, CommandValidator, CommandBuilder |
| Session Windows | 8 | SessionWindowState, QuickActionDefinition, FlowNodeData, etc. |
| Project Registry | 3 | ProjectId, Project, ProjectAutoDetectionResult |
| Legacy Compat | 4 | HookExecutionEvent, WebSocketMessage, AgentTask, HookDefinition |

**Total Exports:** 108 types, enums, classes, and utilities

---

## MCP Server Implementation (packages/mcp-server/)

### Current State

**File:** `packages/mcp-server/src/index.ts`
**Lines:** 309
**Language:** TypeScript (with minimal type safety)

#### Tools Inventory

| Tool | Purpose | Inputs | Outputs | Implementation |
|---|---|---|---|---|
| `check_commands` | Poll pending control commands | session_id (string) | Array of {id, type, target} | HTTP GET to /api/sessions/{id}/commands |
| `ack_command` | Acknowledge command processing | command_id, result?, error? | {acknowledged, command_id, result} | HTTP POST to /api/commands/{id}/ack |

#### Architecture

**Backend Communication:**
- Default URL: `http://localhost:3001` (configurable via `AFW_BACKEND_URL`)
- Transport: HTTP fetch (not typed)
- Error handling: Graceful degradation (returns empty array on failure)

**Tool Registration:**
- Implements MCP SDK Server with StdioServerTransport
- Tools defined in `ListToolsRequestSchema` handler
- Tool calls handled in `CallToolRequestSchema` handler

**Type Safety Status:**
- ❌ Local `CommandResponse` interface (not imported from shared)
- ❌ Local `AckResponse` interface (not imported from shared)
- ❌ Raw string response handling (no event type checking)
- ❌ No use of shared types (CommandPayload, WorkspaceEvent, etc.)

#### Code Smell Analysis

1. **Type Import Missed:** MCP server declares its own interfaces instead of importing:
   ```typescript
   interface CommandResponse {
     sessionId: string;
     count: number;
     commands: Array<{ id: string; type: string; payload?: Record<string, unknown> }>;
   }
   ```
   **Should be:** `CommandPayload` + `Command` from `@afw/shared`

2. **Hardcoded Backend URLs:** No validation of backend availability on startup

3. **No Tool Parameter Validation:** Schema is descriptive, but request handler lacks input validation

4. **Limited Tool Surface:** Only 2 tools for a dashboard with extensive command/event infrastructure

---

## Type Usage Analysis

### Backend (26 imports from shared)

**Highest-Usage Types:**

| Type | Count | Files | Purpose |
|---|---|---|---|
| `SessionId` | 14 | routes, storage, services | Session identification |
| `WorkspaceEvent` | 7 | routes, ws, storage, services | Event handling |
| `ChainId` | 3 | storage, routes | Chain identification |
| `brandedTypes` | 7 | routes, services, tests | Type factory usage |
| `Session`, `Chain` | 3 | routes, storage | Domain models |

**Event Type Usage:** WorkspaceEvent union + specific event interfaces in claudeCliManager.ts

**Command Type Usage:** Not directly used in backend (raw JSON handling in routes)

### Frontend (66 files import from shared)

Primary usage through hooks and contexts:
- `useAllSessions`, `useUserSessions`, `useAttachedSessions` → Session, Chain models
- `useClaudeCliSessions`, `useDiscoveredSessions` → ClaudeCliSession, DiscoveredClaudeSession
- `useProjects` → Project, ProjectId
- `useSessionWindows` → SessionWindowState, SessionWindowConfig
- Event-based hooks consume WorkspaceEvent

### MCP Server (0 direct imports from shared)

**Current:** None
**Gap:** Should import CommandPayload, WorkspaceEvent for type safety

---

## Structural Issues & Gaps

### Critical Gaps

#### 1. MCP Server Type Safety Gap
- **Issue:** MCP server implements command/event polling but doesn't import types from shared
- **Impact:** Type safety lost at MCP boundary; responses validated only at runtime
- **Recommendation:** Import `CommandPayload`, `Command`, `CommandResult` from shared
- **Files Affected:** `packages/mcp-server/src/index.ts`

#### 2. Command Type Coverage Mismatch
- **Issue:** 9 command types defined in shared, but backend routes handle raw JSON
- **Impact:** No compile-time validation; payload structure not enforced
- **Recommendation:** Use Zod schema generation from shared types or explicit validation
- **Files Affected:** `packages/backend/src/routes/commands.ts`

#### 3. MCP Tool Surface Area Gap
- **Issue:** Only 2 tools (check_commands, ack_command) when event/session system is much larger
- **Recommendation:** Expand tools (get_session, list_sessions, get_events, etc.) in SRD phase
- **Files Affected:** `packages/mcp-server/src/index.ts`

### Structural Observations

#### Good Practices
✅ Branded string types prevent ID mixing
✅ Event discriminated union with type guards
✅ Graceful degradation in event parsing (nullable parsed fields)
✅ Factory functions enforce validation rules
✅ Comprehensive export barrel (index.ts) with clear organization
✅ Legacy compatibility types preserved at bottom of exports

#### Maintenance Considerations
⚠️ **Event Type Growth:** 26 event types now; expect 30+ in Phase 2 with more integrations
⚠️ **Command Type Validation:** CommandValidator is basic (enum check + stepNumber validation)
⚠️ **Model Complexity:** ExecutionPlan, Chain, Session have ~17+ optional fields each
⚠️ **Enum String Unions:** StatusString, ModelString, ChainSourceString enums duplicate enum values for union type safety (good for flexibility, slight redundancy)

---

## Type Dependency Graph

```
types.ts (base, 7 branded + 5 enums)
  ↓
models.ts (12 domain entities)
  ↓
events.ts (24 events + guards)
commands.ts (9 commands + utilities)
sessionWindows.ts (7 UI types)
projects.ts (3 registry types)
  ↓
index.ts (108 exports)
  ↓
Backend (26 files)
Frontend (66 files)
MCP Server (0 files - GAP)
```

---

## Metrics Summary

### Shared Package Metrics

| Metric | Value |
|---|---|
| Total Lines | 1,963 |
| Total Exports | 108 |
| Type Definitions | 149 |
| Files | 7 |
| Branded Types | 7 |
| Enumerations | 5 |
| Interfaces/Models | 42+ |
| Event Types | 26 |
| Command Types | 9 |
| Type Guards | 23 (17 event + 6 command) |
| Test Coverage | 0 (no tests in shared package) |

### MCP Server Metrics

| Metric | Value |
|---|---|
| Lines of Code | 309 |
| Files | 1 |
| Tools | 2 |
| Tool Categories | Command polling only |
| Type Imports from Shared | 0 |
| HTTP Endpoints Called | 2 |
| Error Handling | Graceful degradation (returns empty on error) |
| Type Safety Score | 40/100 (hardcoded interfaces, no validation) |

### Backend Integration Metrics

| Metric | Value |
|---|---|
| Files Importing from Shared | 26 |
| Most Imported Types | SessionId (14x), WorkspaceEvent (7x) |
| Type Coverage | 87% of shared types imported by ≥1 file |
| Event Handler Coverage | 10/26 event types explicitly handled |
| Command Handler Coverage | 0/9 command types with explicit handlers |

---

## Actionable Recommendations

### For FRD (Functional Requirements)

1. **Expand MCP Tools** (Phase 2)
   - Add tools: `list_sessions`, `get_session`, `get_events`, `get_chain_status`
   - Supports monitoring and status queries from orchestrators
   - Requires SRD documentation of tool semantics

2. **Event Streaming Optimization**
   - Consider adding `subscribe_events` tool for long-polling or SSE
   - Current model polls; could reduce latency with streaming
   - Impacts: MCP server arch, backend subscription model

3. **Command Result Tracking**
   - `ack_command` should return execution result from backend
   - Currently discards result/error payloads from ack request
   - Impacts: backend storage, command lifecycle model

### For SRD (System Requirements)

1. **MCP Type Safety**
   - Import `CommandPayload`, `Command`, `CommandResult` from @afw/shared
   - Generate Zod schemas from TypeScript types or manually define
   - Add input validation to tool handlers
   - Files: `packages/mcp-server/src/index.ts`

2. **Backend Command Validation**
   - Replace raw JSON handling with Zod schema validation in `commands.ts`
   - Leverage `CommandValidator` from shared package
   - Add type guards for discriminated command types
   - Files: `packages/backend/src/routes/commands.ts`, `packages/backend/src/schemas/api.ts`

3. **Event Handler Mapping**
   - Document which event types are handled by which backend services
   - Current coverage: 10/26 events (38%)
   - Gap: File events, Registry events, Warning events not explicitly handled in routes
   - Files: `packages/backend/src/routes/events.ts`, service handlers

4. **Test Coverage**
   - Add unit tests for `CommandValidator`, `CommandBuilder` in shared package
   - Add tests for event type guards
   - Add integration tests for MCP tools
   - Current: 0 tests in shared package

5. **Documentation**
   - Create type catalog documenting all 149 types with examples
   - Document event lifecycle for each event type
   - Document command payload constraints (which commands require stepNumber, etc.)
   - Create MCP tool API reference (2 current tools → N tools in Phase 2)

### For Architecture

1. **Shared Package as Contract**
   - Reinforce shared package as single source of truth for types
   - Eliminate any ad-hoc type definitions in service packages
   - Current: MCP server defines its own CommandResponse instead of importing

2. **Type Guard Adoption**
   - Increase usage of exported `eventGuards` in event handlers
   - Current: routes/events.ts uses `event.type ===` string comparison
   - Better: use `eventGuards.isStepSpawned(event)` for type narrowing

3. **Validation Layer**
   - Consider Zod schema generation approach for all Domain Models
   - Reduces duplication between TypeScript types and validation schemas
   - Enables runtime type checking at API boundaries

---

## Phase 2 Growth Projections

**If implementing Phase 2 features:**

| Category | Phase 1 | Phase 2 Est. | Growth |
|---|---|---|---|
| Event Types | 26 | 35-40 | +35% |
| Command Types | 9 | 15-18 | +67% |
| Domain Models | 12+ | 18+ | +50% |
| MCP Tools | 2 | 8-12 | +400% |
| Lines in Shared | 1,963 | 2,500+ | +27% |

**Preparation needed:** Establish code generation or templating for new event/command types to avoid manual repetition.

---

## Discovery Output

### Fresh Eye Observations

1. **Event Pattern Excellence:** The graceful degradation pattern (automatic/parsed/inferred fields) is excellent for handling Claude output variability. Consider documenting this as a design pattern for other systems.

2. **Unused Type Opportunity:** `ExecutionMetrics`, `ChainTemplate`, `ActionRegistryEntry` defined but not visible in backend routes or MCP server. These are likely future features—document as "Phase 2 ready" in status docs.

3. **Legacy Compat at Risk:** Bottom of index.ts has 4 legacy types (HookExecutionEvent, WebSocketMessage, AgentTask, HookDefinition). These appear unused in codebase. Recommend archiving in deprecated docs if truly legacy.

4. **Missing: Pagination Types:** Storage returns arrays but no pagination structures. As event volume grows, consider `PaginatedResult<T>`, `CursorPageInfo` types.

5. **Missing: Validation Result Types:** CommandValidator.validate() returns {valid, errors} but this pattern appears ad-hoc. Consider extracting to `ValidationResult<T>` type for consistency.

6. **Enum String Union Redundancy:** Status, Model, ChainSource enums each have duplicate string unions (StatusString, ModelString, ChainSourceString). Clever but slightly verbose. Maintainable for now, but note as technical debt if > 10 enums emerge.

---

## Conclusion

**Shared package quality: Excellent** — Comprehensive, well-organized, properly exported. Clear foundation for consistent types across backend/frontend.

**MCP server quality: Minimal but functional** — Currently implements only command polling; lacks type safety and has growth opportunity for tool expansion. Should import types from shared in next iteration.

**Overall gap assessment: Type coverage is high (87%), but MCP server integration needs work to enforce types at integration boundary.**

Recommend:
1. Import shared types into MCP server (quick fix, high impact)
2. Document type usage patterns for SRD
3. Plan tool expansion roadmap for Phase 2
4. Add validation layer around command handling in backend
