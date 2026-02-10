# Audit Report: Backwards Harmony Cross-Reference

## Score: 28/100

**Audit Date:** 2026-02-09
**Type:** Architecture (Backwards Harmony Audit -- Cross-Reference)
**Scope:** Cross-reference of Layer 1 (Frontend), Layer 2 (Parsers), Layer 3 (Specs) + source code validation

---

## Severity Distribution

| Severity | Count |
|----------|-------|
| CRITICAL | 3 |
| HIGH | 5 |
| MEDIUM | 6 |
| LOW | 4 |

---

## A. Layer Mismatch Matrix

For each of the 17 contract formats, here is the cross-layer reality:

| # | Format | Frontend Consumes? | Parser Exists? | Fully Specified? | Field Mismatches? | Harmony Detector Correct? |
|---|--------|-------------------|----------------|------------------|-------------------|--------------------------|
| 1.1 | Chain Compilation | NO (via WebSocket events, not parser) | YES (real impl) | YES | NO | YES (fields match) |
| 1.2 | Chain Execution Start | NO | YES (real impl) | YES | NO | BROKEN (`chainId`/`status` not in parsed output) |
| 1.3 | Chain Status Update | NO | YES (real impl) | YES | NO | BROKEN (`progress`/`currentStep` not in parsed output) |
| 1.4 | Execution Complete | NO | YES (real impl) | YES | NO | BROKEN (`status`/`summary` ambiguous -- overlaps with other formats) |
| 2.1 | Step Completion | NO (via WebSocket events) | YES (real impl) | YES | NO | YES (fields match) |
| 2.2 | Dual Output | NO | YES (real impl) | YES | YES | BROKEN (`actionOutput`/`secondOpinionOutput` vs `originalResult`/`secondOpinionModel`) |
| 2.3 | Second Opinion Skip | NO | YES (real impl) | YES | NO | BROKEN (`reason` not in parsed output, `skipReason` is) |
| 3.1 | Human Gate | NO | YES (real impl) | YES (free-form) | YES | BROKEN (`question`/`context` vs `stepNumber`/`prompt`) |
| 3.2 | Learning Surface | NO | YES (real impl) | YES | YES | BROKEN (`question`/`options` vs `fromAction`/`issue`/`suggestedFix`) |
| 3.3 | Session Start Protocol | NO | YES (real impl) | YES | YES | BROKEN (`topic`/`participant` vs `projectName`/`flowCount`) |
| 4.1 | Registry Update | NO | YES (real impl) | YES | YES | BROKEN (`entry` not in parsed output, `line` is) |
| 4.2 | INDEX.md Entry | NO | YES (real impl) | YES | YES | BROKEN (`file`/`line` checked -- `file` not in parsed output) |
| 4.3 | LEARNINGS.md Entry | NO | YES (real impl) | YES | YES | BROKEN (`learning` not in parsed output) |
| 5.1 | Review Report | NO (no ReviewReportViewer component) | YES (real impl) | YES | NO | YES (fields match) |
| 5.2 | Analysis Report | NO (no AnalysisReportViewer component) | YES (real impl) | YES | YES | BROKEN (`scope`/`findings` -- `findings` not in AnalysisReportParsed) |
| 5.3 | Brainstorm Transcript | NO (no BrainstormViewer component) | YES (real impl) | YES | YES | BROKEN (`transcript`/`ideas` vs `idea`/`classification`/`questions`) |
| 6.1 | Error Announcement | NO (no ErrorModal component) | YES (real impl) | YES | NO | YES (fields match) |
| 6.2 | Context Routing | NO (no RoutingIndicator component) | YES (real impl) | YES | NO | YES (fields match) |

### Summary:
- **Parsers exist for all 17/17 formats** (Layer 2 report was correct)
- **Frontend consumes 0/17 parsers** (confirmed -- zero imports)
- **Specs exist for 17/17 formats** (Layer 3 report was correct about specs)
- **Harmony detector `getFormatName` is broken for 12/17 formats** (uses wrong field names)
- **0/17 format-specific dashboard components exist** (all are aspirational names in PARSER_PRIORITY.md)

---

## B. Architecture Gap Analysis

### B.1 Why Don't Parsers Connect to Frontend?

**Finding: The parsers and the frontend are solving different problems.**

The contract parsers (`packages/shared/src/contract/`) parse **orchestrator markdown text** (e.g., `## Chain: Build Auth`). The frontend consumes **structured WebSocket events** (e.g., `{ type: "chain:compiled", title: "Build Auth", steps: [...] }`).

These are fundamentally different data flows:

```
FLOW A: Orchestrator text -> Contract Parsers -> Harmony Detector (monitoring only)
FLOW B: Hooks emit events -> Backend stores + broadcasts -> Frontend renders

The parsers parse TEXT.
The frontend consumes EVENTS.
They never need to touch.
```

**Is this by design?** Partially. The architecture has two intentional consumers:
1. **Harmony Detector** uses parsers to validate orchestrator output compliance (monitoring)
2. **Frontend** uses typed WebSocket events for real-time rendering

The gap is that parsers were ALSO intended to be used by a future "frontend parser layer" (see PARSER_PRIORITY.md component names), but this was never built. The current architecture bypasses parsers entirely because the hooks system pre-structures data as typed events.

### B.2 Full Data Flow Trace

**How orchestrator output actually reaches the frontend:**

```
1. Claude Code hooks (packages/hooks/) detect orchestrator output
   |
2. Hooks emit HTTP POST to /api/events with pre-structured WorkspaceEvent
   |  (The hook does the "parsing" -- it creates typed events from raw output)
   |
3. Backend events.ts route:
   |  - Validates with Zod schema (createEventSchema)
   |  - Stores event in storage (memory/Redis)
   |  - DOES NOT call harmony detector
   |  - DOES NOT call contract parsers
   |
4. Backend index.ts broadcasts event to WebSocket clients
   |  (Wraps in { type: "event", sessionId, payload: <event> })
   |
5. Frontend useWebSocket.ts receives message:
   |  - Unwraps broadcast wrapper
   |  - Validates required fields (type, sessionId, timestamp)
   |  - Filters by subscribed sessions
   |  - Emits to onEvent callbacks
   |
6. Frontend hooks consume typed events:
   |  - useAgentTracking.ts: Uses eventGuards (step:spawned, step:completed, etc.)
   |  - useChainEvents.ts: BROKEN -- listens for underscore events (step_spawned)
   |  - useEvents.ts: Generic event filtering
   |
7. Components render from typed interfaces:
   - ChainDAG, StepNode, StepInspector, SquadPanel, etc.
   - All read from Session/Chain/ChainStep TypeScript interfaces
   - No markdown parsing anywhere in frontend
```

**The real parsing happens in the hooks system** (packages/hooks/), NOT in the backend or frontend. The hooks transform raw Claude output into structured events before they ever reach the backend.

### B.3 Where Does Real Parsing Happen?

| Layer | Does Parsing? | What It Parses | What It Produces |
|-------|--------------|----------------|------------------|
| Hooks (packages/hooks/) | YES | Raw Claude CLI output | Structured WorkspaceEvents |
| Backend events route | NO | Already-structured events | Stores + broadcasts as-is |
| Harmony Detector | YES (monitoring only) | Raw text (on manual trigger) | HarmonyCheck results |
| Contract Parsers | YES (unused automatically) | Orchestrator markdown text | Parsed format objects |
| Frontend | NO | N/A | Renders typed events directly |

---

## C. Dead Code / Dead Spec Detection

### C.1 Dead Code: Harmony Detector `getFormatName`

**File:** `packages/backend/src/services/harmonyDetector.ts:199-222`
**Status:** DEAD / BROKEN

The `getFormatName` method checks for field names that do NOT exist in the actual parser output types:

| Format | `getFormatName` Checks | Actual Parser Fields | Match? |
|--------|----------------------|---------------------|--------|
| DualOutput | `actionOutput`, `secondOpinionOutput` | `originalResult`, `secondOpinionModel` | NO |
| RegistryUpdate | `file`, `action`, `entry` | `title`, `file`, `action`, `line` | PARTIAL (no `entry`) |
| LearningSurface | `question`, `options` | `fromAction`, `issue`, `suggestedFix` | NO |
| IndexEntry | `file`, `line` | `date`, `pattern`, `commitHash` | NO |
| ChainExecutionStart | `chainId`, `status` | `title`, `stepNumber`, `action`, `model` | NO |
| AnalysisReport | `scope`, `findings` | `title`, `aspect`, `sections` | NO |
| SessionStartProtocol | `topic`, `participant` | `projectName`, `flowCount` | NO |
| ExecutionComplete | `status`, `summary` | `title`, `steps`, `logsPath` | NO |
| SecondOpinionSkip | `reason`, `skipReason` | `stepNumber`, `action`, `skipReason` | PARTIAL (no `reason`) |
| LearningEntry | `title`, `learning` | `actionType`, `issueTitle`, `solution` | NO |
| ChainStatusUpdate | `progress`, `currentStep` | `title`, `changes`, `steps` | NO |
| BrainstormTranscript | `transcript`, `ideas` | `idea`, `classification`, `questions` | PARTIAL |
| HumanGate | `question`, `context` | `stepNumber`, `content`, `prompt` | NO |

**Result:** 12 of 17 format names will return `'Unknown'` even when the parser correctly identifies the format. Only ChainCompilation, StepCompletion, ReviewReport, ErrorAnnouncement, and ContextRouting return correct names.

### C.2 Dead Code: `useChainEvents.ts` Event Subscriptions

**File:** `packages/app/src/hooks/useChainEvents.ts:22-27`
**Status:** DEAD

Subscribes to `step_spawned`, `step_completed`, `step_failed`, `step_skipped` (underscore convention), but actual event types use colon convention: `step:spawned`, `step:completed`, `step:failed`. The `useEvents` hook filters by `event.type`, so these strings will never match.

Additionally, `step_skipped` / `step:skipped` is not defined as an event type anywhere in `packages/shared/src/events.ts`. There is no `StepSkippedEvent` interface.

**Impact:** Any component using `useChainEvents` will never receive step lifecycle events.

### C.3 Dead Code: `useChainEvents.ts` Data Access Pattern

**File:** `packages/app/src/hooks/useChainEvents.ts:41-42`
**Status:** DEAD

Accesses `event.data.stepNumber` and `event.data.step`, but WorkspaceEvent types put fields at the top level (`event.stepNumber`), not nested inside `event.data`. This is a secondary failure even if the event type strings were fixed.

### C.4 Dead Specs: PARSER_PRIORITY.md Component Names

**File:** `packages/app/docs/PARSER_PRIORITY.md`
**Status:** ASPIRATIONAL (not implemented)

Every dashboard component listed in PARSER_PRIORITY.md is aspirational. None exist:

| Component Name | Exists? |
|---------------|---------|
| ChainVisualization | NO |
| ChainTable | NO |
| ProgressTracker | NO |
| StepProgressBar | NO |
| ExecutionLog | NO |
| ReviewReportViewer | NO |
| FindingsTable | NO |
| VerdictBanner | NO |
| ErrorModal | NO |
| RecoveryOptionsPanel | NO |
| DualOutputViewer | NO |
| ComparisonPanel | NO |
| LearningsCard | NO |
| ApprovalDialog | NO |
| RegistryLiveView | NO |
| FileChangeIndicator | NO |
| ExecutionTimeline | NO |
| StartTimestamp | NO |
| SummaryCard | NO |
| LogsLinkButton | NO |
| ExecutionHistory | NO |
| PastChainsTable | NO |
| MidChainProgressUpdate | NO |
| SkipNotification | NO |
| PastLearningsViewer | NO |
| HumanGateDisplay | NO |
| SessionMetadataPanel | NO |
| BrainstormViewer | NO |
| RoutingIndicator | NO |
| AnalysisReportViewer | NO |
| MetricsDisplay | NO |

**Actual components that render chain/step data:** ChainDAG, StepNode, StepInspector, FlowVisualization, TimelineView, ConversationPanel, SquadPanel, SessionInfoPanel. These all consume typed WebSocket events, NOT parser output.

### C.5 Dead Feature: Automatic Harmony Detection on Events

**Expected behavior:** Events route calls harmony detector on each incoming event.
**Actual behavior:** Harmony detector `checkOutput` is ONLY called via manual HTTP endpoint `POST /api/harmony/:sessionId/check`.

The events route (`packages/backend/src/routes/events.ts`) does NOT call `harmonyDetector.checkOutput()`. This means harmony detection is **not automatic** -- it only runs when explicitly triggered via the API.

### C.6 Parsers That Exist But Nothing Uses Automatically

All 17 contract parsers are only reachable through:
1. The master parser `parseOrchestratorOutput()` -- called only by `harmonyDetector.checkOutput()`
2. `harmonyDetector.checkOutput()` -- called only by `POST /api/harmony/:sessionId/check` (manual trigger)

**No parser is ever called in the normal event pipeline.** The entire contract parser system is functionally dormant in the normal data flow.

### C.7 Types Defined But Never Instantiated (Frontend)

From `packages/shared/src/models.ts`:
- `Session.user` -- Never displayed in UI
- `Session.hostname` -- Never displayed in UI
- `Session.platform` -- Never displayed in UI
- `Session.totalStepsExecuted` -- Never displayed in UI
- `Session.totalChainsCompleted` -- Never displayed in UI
- `Session.criticalErrors` -- Never displayed in UI
- `Chain.userId` -- Never displayed in UI
- `Chain.estimatedDuration` -- Never displayed in UI

These are future-proofing fields, not dead code per se.

---

## D. Harmony Health Score

### Overall Assessment: 28/100

| Category | Score | Weight | Notes |
|----------|-------|--------|-------|
| Spec Completeness | 95/100 | 20% | 17/17 formats fully specified |
| Parser Implementation | 90/100 | 20% | 17/17 parsers exist with real logic |
| Parser-Spec Alignment | 70/100 | 15% | Parser field names match types, but some regex edge cases |
| Harmony Detector Accuracy | 12/100 | 15% | Only 5/17 format names detected correctly |
| Frontend Integration | 0/100 | 20% | Zero frontend usage of contract parsers |
| Test Coverage | 0/100 | 10% | Zero parser tests, zero harmony detector tests |

### Breakdown by Status:

| Status | Count | Formats |
|--------|-------|---------|
| **In Harmony** (spec <-> parser <-> some consumer) | 1 | Manual harmony check API endpoint works for text input |
| **Aspirational** (specified + implemented but unwired) | 17 | All 17 formats have specs and parsers but are disconnected from normal flow |
| **Broken** (mismatched between layers) | 12 | Harmony detector `getFormatName` returns wrong results for 12/17 formats |

### The Two Parallel Universes:

**Universe A: The Contract System**
- 17 format specifications in CONTRACT.md
- 17 parsers in packages/shared/src/contract/
- 17 type guards in guards.ts
- Harmony detector service
- All well-structured, well-typed, well-documented
- **Used by:** Nothing in the normal flow (only manual API trigger)

**Universe B: The Event System**
- ~30 event types in packages/shared/src/events.ts
- Event guards for type narrowing
- Hooks that create events from raw output
- useWebSocket -> useEvents -> useAgentTracking
- Components that render from typed interfaces
- **Used by:** Everything in the actual dashboard

These two universes are almost completely disconnected. Universe A exists as monitoring infrastructure; Universe B is the actual real-time data flow. The "harmony" system monitors compliance of text that has already been converted to events by a separate mechanism.

---

## E. Priority Remediation List

### CRITICAL (3 findings)

#### C1. Harmony Detector `getFormatName` Uses Wrong Field Names
- **File:** `packages/backend/src/services/harmonyDetector.ts:199-222`
- **Description:** `getFormatName()` checks for field names (`actionOutput`, `entry`, `question`, `topic`, `transcript`, `ideas`, etc.) that do not exist in the actual parsed type interfaces. 12 of 17 formats return `'Unknown'` even after successful parsing.
- **Impact:** Harmony metrics are unreliable. A correctly parsed format can be reported as "unknown format" to the dashboard, corrupting all compliance percentages.
- **Remediation:** Replace manual field checks with type guard imports:
  ```typescript
  if (isChainCompilationParsed(parsed)) return 'ChainCompilation';
  if (isStepCompletionParsed(parsed)) return 'StepCompletion';
  // ... etc.
  ```
- **Status:** Found

#### C2. `useChainEvents.ts` Event Type Mismatch
- **File:** `packages/app/src/hooks/useChainEvents.ts:22-27, 40-76`
- **Description:** Hook subscribes to `step_spawned`, `step_completed`, `step_failed`, `step_skipped` (underscore convention). Actual event types use `step:spawned`, `step:completed`, `step:failed` (colon convention). Also accesses nested `event.data.stepNumber` instead of top-level `event.stepNumber`.
- **Impact:** Any component using `useChainEvents` will never receive events. Chain state tracking via this hook is completely broken.
- **Remediation:** Change event type strings to colon convention and access fields at top level:
  ```typescript
  const events = useEvents(sessionId, ['step:spawned', 'step:completed', 'step:failed']);
  // ... and access event.stepNumber instead of event.data.stepNumber
  ```
- **Status:** Found

#### C3. No `StepSkippedEvent` Type Exists
- **File:** `packages/shared/src/events.ts` (missing), `packages/app/src/hooks/useChainEvents.ts:69-75`
- **Description:** `useChainEvents` listens for `step_skipped` events, but no `StepSkippedEvent` interface is defined in the shared events module. The `WorkspaceEvent` union type has no skip event.
- **Impact:** Step skipping functionality cannot work through the event system. Frontend has no way to know a step was skipped.
- **Remediation:** Either add `StepSkippedEvent` to events.ts, or handle skipping via `StepCompletedEvent` with `status: 'skipped'`.
- **Status:** Found

---

### HIGH (5 findings)

#### H1. Contract Parsers Are Never Called Automatically
- **File:** `packages/backend/src/routes/events.ts` (missing call), `packages/backend/src/services/harmonyDetector.ts`
- **Description:** The events route receives, stores, and broadcasts events without ever calling `harmonyDetector.checkOutput()`. Harmony detection only works via manual API call `POST /api/harmony/:sessionId/check`.
- **Impact:** Harmony monitoring does not work in real-time. The dashboard's harmony metrics are never automatically updated during normal operation.
- **Remediation:** Add automatic harmony checking in the events pipeline, or integrate it into the hooks system.
- **Status:** Found

#### H2. PARSER_PRIORITY.md References 31 Non-Existent Components
- **File:** `packages/app/docs/PARSER_PRIORITY.md`
- **Description:** All 31 dashboard component names listed as "consumers" (ChainVisualization, ReviewReportViewer, ErrorModal, etc.) do not exist. Actual components have different names (ChainDAG, StepInspector, etc.) and consume events, not parser output.
- **Impact:** Documentation is misleading. Developers following PARSER_PRIORITY.md will create components that don't integrate with the existing architecture.
- **Remediation:** Update PARSER_PRIORITY.md to reference actual components and clarify the event-based architecture vs parser-based architecture.
- **Status:** Found

#### H3. Two Competing Data Models for Same Domain
- **File:** `packages/shared/src/contract/types/` vs `packages/shared/src/events.ts` + `packages/shared/src/models.ts`
- **Description:** The contract types (`ChainCompilationParsed`, `StepCompletionParsed`, etc.) define one data model for parsed markdown. The event types (`ChainCompiledEvent`, `StepCompletedEvent`, etc.) define a different data model for real-time events. These have different field names, different structures, and different nullable semantics.
- **Impact:** Confusion about which types to use. New features could be built against the wrong data model.
- **Remediation:** Document the distinction clearly. Contract types are for text parsing (monitoring). Event types are for real-time data flow (rendering).
- **Status:** Found

#### H4. Layer 3 Report Claims "Only 8/17 Parsers Implemented"
- **File:** Layer 3 report (`specification-contract-layer` report)
- **Description:** The Layer 3 report states 8 parsers are implemented and 7 are TODO. In reality, all 17 parsers are implemented with real parsing logic. The report conflated PARSER_PRIORITY.md's "dashboard component status" with "parser implementation status."
- **Impact:** Incorrect information could lead to duplicate implementation work.
- **Remediation:** Correct PARSER_PRIORITY.md to distinguish "parser implemented" from "dashboard component implemented."
- **Status:** Found

#### H5. Harmony Detector's `getMissingFields` Reports All Nullable Fields as "Missing"
- **File:** `packages/backend/src/services/harmonyDetector.ts:227-241`
- **Description:** The `getMissingFields` method reports every `null` field as "missing," but parsers intentionally return `null` for optional fields. A partially matching format (normal behavior) will always be reported as "degraded."
- **Impact:** Inflated degradation count. Even perfectly normal partial matches are flagged as problems.
- **Remediation:** Distinguish required vs optional fields per format. Only report truly required `null` fields as missing.
- **Status:** Found

---

### MEDIUM (6 findings)

#### M1. Zero Test Coverage for Contract Parsers
- **Description:** No test files exist for any of the 17 parsers, guards, or the master parser function. No tests for the harmony detector service.
- **Impact:** Parser behavior is unverified. Edge cases, malformed input, and regression risks are unmitigated.
- **Remediation:** Create unit tests for all parsers with known-good input, edge cases, and malformed input.
- **Status:** Found

#### M2. Weak Type Guards (Presence-Only Checking)
- **File:** `packages/shared/src/contract/guards.ts`
- **Description:** All type guards check field presence (`'field' in obj`) but not field types or non-null values. A fully-null object passes all guards.
- **Impact:** Type narrowing is unreliable at runtime. Code using guards for control flow may execute with unexpected null values.
- **Remediation:** Add structural checks (e.g., `typeof obj.stepNumber === 'number'`) or create strict variants.
- **Status:** Found

#### M3. `ChainLiveMonitor.tsx` Uses `any` Type for `initialChain`
- **File:** `packages/app/src/components/ChainLiveMonitor.tsx` (line 14 per Layer 1 report)
- **Description:** The `initialChain` prop uses `any` type instead of `Chain`.
- **Impact:** Type safety bypass. Incorrect data could be passed without compile-time errors.
- **Remediation:** Change type to `Chain | undefined`.
- **Status:** Found

#### M4. No Contract Version Validation in Event Pipeline
- **Description:** Events flow through the system without contract version validation. The `contractVersion` field exists in parsed types but is never checked against supported versions.
- **Impact:** Breaking contract changes could pass through without detection.
- **Remediation:** Add version validation in harmony detector and/or event validation middleware.
- **Status:** Found

#### M5. `useAgentTracking` References `state.orchestratorId` in useEffect Dependency
- **File:** `packages/app/src/components/SquadPanel/useAgentTracking.ts:297`
- **Description:** The effect that handles events includes `state.orchestratorId` as a dependency. This causes the effect to re-run every time orchestrator state changes, potentially missing events during re-subscription.
- **Impact:** Possible event loss during re-subscription cycles.
- **Remediation:** Use a ref for orchestratorId to avoid effect re-runs.
- **Status:** Found

#### M6. Layer 2 Report's "Zero Frontend Usage" Finding Is Misleading
- **Description:** Layer 2 report says "Zero frontend usage" and implies this might be a gap to fix. In reality, the frontend CORRECTLY doesn't use parsers because it consumes pre-structured events, not raw text. This is by design.
- **Impact:** Could trigger unnecessary "migration" work to integrate parsers into frontend.
- **Remediation:** Document this as intentional architecture: hooks produce events, frontend consumes events, parsers monitor compliance.
- **Status:** Found

---

### LOW (4 findings)

#### L1. Contract Evolution Process References Non-Existent `harmony:check` Command
- **File:** `.claude/actionflows/docs/CONTRACT_EVOLUTION.md` (references `pnpm run harmony:check`)
- **Description:** The validation command `pnpm run harmony:check` is referenced in agent-standards but may not exist as a real script.
- **Impact:** Agents attempting to validate their output will fail silently.
- **Remediation:** Implement the script or remove the reference.
- **Status:** Found

#### L2. Unused Session Fields Future-Proofing
- **File:** `packages/shared/src/models.ts`
- **Description:** 8 Session/Chain fields are defined but never rendered in UI (user, hostname, platform, totalStepsExecuted, etc.).
- **Impact:** None (intentional future-proofing). No harm, minor code bloat.
- **Remediation:** Keep as-is; mark with `@future` jsdoc annotation.
- **Status:** Found

#### L3. Format 6.2 Legacy Naming
- **File:** CONTRACT.md, parsers
- **Description:** Format 6.2 is named "Department Routing" but the system now uses "Context Routing." Parser correctly uses `parseContextRouting`, but docs still reference "Department."
- **Impact:** Naming confusion. No functional impact.
- **Remediation:** Update all references from "Department" to "Context."
- **Status:** Found

#### L4. Harmony Detector `getFormatName` Duplicates Guard Logic
- **File:** `packages/backend/src/services/harmonyDetector.ts:199-222`
- **Description:** Manual field checks instead of using existing type guards. (Subsumed by C1 -- the field checks are also wrong, but even if correct, they duplicate guard logic.)
- **Impact:** Maintenance burden. Changes to guards won't propagate to format detection.
- **Remediation:** Use type guard functions (same fix as C1).
- **Status:** Found

---

## Discrepancy Resolution: "17/17 Exist" vs "Only 8/17 Implemented"

**Layer 2 (Parser report) claimed:** 17/17 parsers exist and are callable.
**Layer 3 (Specs report) claimed:** Only 8/17 parsers are implemented, 7 are TODO, 2 are FUTURE.

**Resolution:** Both reports are partially correct about different things.

- **Parser code exists for 17/17 formats.** All have real implementations with regex matching, field extraction, and typed return values. Layer 2 was correct about this.
- **PARSER_PRIORITY.md marks only 6/17 as "IMPLEMENTED."** This refers to **dashboard component integration**, not parser code existence. Layer 3 was reading PARSER_PRIORITY.md's component status, not the actual parser codebase.
- The confusion stems from PARSER_PRIORITY.md using "IMPLEMENTED" to mean "parser + component + integration complete" while Layer 2 interpreted "implemented" as "parser code exists."

**Actual state:**
- 17/17 parser functions exist with real code
- 0/17 have frontend component consumers
- 1/17 has any automated consumer (harmony detector, but with wrong field matching)
- 0/17 have unit tests

---

## Architecture Diagram

```
                    UNIVERSE A (Monitoring)              UNIVERSE B (Real-Time)
                    ========================             =======================

Orchestrator   -->  Raw Markdown Text                    Claude CLI Output
                    |                                    |
                    v                                    v
                    Contract Parsers (17)                Hooks (packages/hooks/)
                    |                                    |
                    v                                    v
                    Harmony Detector                     Structured WorkspaceEvents
                    (manual trigger only)                |
                    |                                    v
                    v                                    POST /api/events
                    HarmonyCheck stored                  |
                    |                                    v
                    v                                    Store + WebSocket Broadcast
                    harmony:check event ----+            |
                    harmony:violation event |            v
                                           |            useWebSocket (unwrap)
                                           |            |
                                           |            v
                                           +--------->  useAgentTracking (event guards)
                                                        useChainEvents (BROKEN)
                                                        useEvents (generic)
                                                        |
                                                        v
                                                        ChainDAG, StepNode, SquadPanel,
                                                        FlowVisualization, TimelineView, etc.
```

---

## Learnings

**Issue:** Three analysis agents produced reports with contradictory claims about parser implementation status (17/17 vs 8/17).
**Root Cause:** PARSER_PRIORITY.md conflates "parser implementation status" with "dashboard component integration status." Layer 2 read the parser code directly; Layer 3 read PARSER_PRIORITY.md's checklist. Both were correct about what they measured, but measured different things.
**Suggestion:** PARSER_PRIORITY.md should have separate columns for "Parser Code Exists," "Parser Tested," "Dashboard Component Exists," and "End-to-End Integrated."

**Issue:** Harmony detector `getFormatName` uses field names that don't match actual parser output types, causing 12/17 formats to return "Unknown."
**Root Cause:** The method was likely written from memory or from an older version of the type definitions, not copy-pasted from the actual type interfaces. No tests catch this.
**Suggestion:** Always derive detection logic from type guards (which are auto-aligned with types), never from manual field name checks.

[FRESH EYE] The most significant discovery is that the contract parser system and the event system are two completely parallel architectures that were apparently designed independently:
- The contract parsers were built to parse orchestrator markdown text into typed objects
- The event system was built to stream structured events from hooks to the frontend
- Neither system depends on or is aware of the other (except the harmony detector, which bridges them poorly)
- The frontend was NEVER designed to consume parser output -- it was always designed around WebSocket events
- This means the entire parser infrastructure (17 parsers, 17 types, 17 guards, 6 pattern modules) exists primarily as monitoring/compliance infrastructure, not as a rendering pipeline
- This architecture is actually reasonable for its purpose (contract monitoring), but the documentation (PARSER_PRIORITY.md, agent-standards) incorrectly implies parsers should be used for frontend rendering

---

## Pre-Completion Validation

**Log Folder Checklist:**
- [x] Log folder exists: `.claude/actionflows/logs/audit/backwards-harmony-cross-reference_2026-02-09-20-32-57/`
- [x] Contains output file: `audit-report.md`
- [x] File is non-empty
- [x] Folder path follows `logs/audit/{description}_{datetime}/` format
- [x] Description is kebab-case
