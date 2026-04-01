# Codebase Concerns

**Analysis Date:** 2026-04-01

## Critical Type Safety Failures

**Backend TypeScript compilation fails:**
- Issue: 150+ type errors blocking build. Widespread undefined handling and type mismatches.
- Files: `packages/backend/src/routes/*`, `packages/backend/src/services/*`, `packages/backend/src/storage/*`
- Impact: Cannot run `pnpm type-check` successfully. Hides real errors. Brittle codebase.
- Fix approach:
  - Priority 1: Fix parameter types in route handlers (harmony-enforce.ts, dossiers.ts, lifecycle.ts, etc.) — most errors are `string | undefined` being passed to `string` parameters
  - Priority 2: Fix Storage interface mismatches (redis.ts missing `getUser/setUser/deleteUser/getUsersByRole`, `listSessions` property not in type)
  - Priority 3: Fix event type unions (WorkspaceEvent missing `timestamp` on some variants, `sessionId` not guaranteed)
  - Priority 4: Fix analytics branded type issues (DurationMs not properly cast from `number`)

## Skipped Redis Pub/Sub Tests

**Redis publish/subscribe functionality untested:**
- Issue: 4 integration tests skipped with `it.skip` — Redis pub/sub handler implementation missing or broken
- Files: `packages/backend/src/storage/__tests__/redis.test.ts` (lines 371, 1264, 1280, 1301)
- Symptoms: Cannot run `pnpm test` with full coverage. Unknown if Redis pub/sub works in production.
- Trigger: Tests attempt to subscribe to channels and verify message delivery
- Workaround: None — pub/sub not functional
- Fix approach: Either implement the pub/sub handler in redis.ts or mark feature as not-yet-supported

## Incomplete Surface Adapter Implementations

**Multi-surface orchestration stubs with no implementation:**
- Files:
  - `packages/backend/src/surfaces/SlackAdapter.ts`
  - `packages/backend/src/surfaces/VSCodeAdapter.ts`
  - `packages/backend/src/surfaces/MobileAdapter.ts`
  - `packages/backend/src/surfaces/CLIAdapter.ts`
- Issue: 30+ TODO comments across adapters. All have stub `initialize()`, `send()`, `shutdown()` methods that log but don't execute.
- Impact:
  - Slack integration returns hardcoded stub responses
  - VS Code IDE integration non-functional
  - Mobile push notifications not wired
  - CLI input passthrough incomplete
- Current state: Part of "Phase 2A — Multi-Surface Orchestration" but not scheduled
- Fix approach: Complete one adapter at a time (start with Slack SDK initialization)

## Router Handler Parameter Validation Gaps

**Undefined parameters passed to route handlers:**
- Files: `packages/backend/src/routes/dossiers.ts`, `packages/backend/src/routes/analytics.ts`, `packages/backend/src/routes/lifecycle.ts`, `packages/backend/src/routes/sessions.ts`
- Issue: Routes extract `req.params.id` without null checks before passing to handlers expecting `string`
- Example: `packages/backend/src/routes/dossiers.ts:129` — `req.params.dossierId` may be `undefined`
- Trigger: Requests to endpoints with missing/malformed path parameters
- Impact: Runtime crashes instead of graceful 400 Bad Request responses
- Fix approach: Add pre-validation middleware or use Zod schemas at route entry points

## WorkspaceEvent Type Union Incomplete

**Event handler assumes all WorkspaceEvents have timestamp + sessionId:**
- Files: `packages/backend/src/storage/memory.ts:311`, `packages/backend/src/storage/redis.ts:301`, `packages/backend/src/routes/events.ts:106`
- Issue: TypeScript warns that `ArtifactCreatedMessage` and other event variants don't include `timestamp` or `sessionId`
- Symptoms: Code assumes these fields exist but union type doesn't guarantee them
- Impact: Events may be stored/retrieved with missing metadata. Filtering by timestamp breaks.
- Fix approach: Either add mandatory fields to all WorkspaceEvent variants or use type guards before accessing

## UniverseGraph Initialization Incomplete

**Missing required property in initial universe creation:**
- File: `packages/backend/src/index.ts:760`
- Issue: Creating UniverseGraph with `metadata`, `regions`, `bridges` but missing required `discoveryTriggers` field
- Impact: Universe initialization may fail or create invalid state
- Fix approach: Initialize `discoveryTriggers` array (empty or with defaults)

## Gateway Parameter Extraction Issues

**Multiple files extract optional params without defaults:**
- Files:
  - `packages/backend/src/cli/harmony-enforce.ts:56` (4 undefined params passed to function)
  - `packages/backend/src/routes/analytics.ts:42`
  - `packages/backend/src/routes/healingRecommendations.ts:131`
  - `packages/backend/src/routes/patterns.ts:234`
- Issue: `req.params` or `req.query` values are `string | undefined` but functions expect `string`
- Fix approach: Use `??` operator or add guard clauses before parameter use

## Possible Undefined Access in Conditional Logic

**Code assumes objects are defined after optional checks:**
- Files:
  - `packages/backend/src/services/layerResolver.ts:222, 264, 266, 277-280, 382-386` (8 locations accessing possibly-undefined `winner` or `effectiveEntry`)
  - `packages/backend/src/services/lifecycleManager.ts:237` (indexing possibly-undefined variable)
  - `packages/backend/src/storage/memory.ts:452` (indexing possibly-undefined variable)
- Issue: Variables may be `undefined` after assignment but code continues without null check
- Trigger: Edge cases in layer resolution or lifecycle transitions
- Fix approach: Add explicit null checks or use optional chaining before access

## Service Placeholder Implementations

**Multiple services have TODO implementation stubs:**
- `packages/backend/src/surfaces/surfaceManager.ts:109` — "TODO: Queue the input to orchestrator"
- `packages/backend/src/services/stepExecutor.ts:271` — "TODO: Replace mock result with actual agent spawning"
- `packages/backend/src/services/stepExecutor.ts:321` — "TODO: Implement route handler in packages/backend/src/routes/chains.ts"
- `packages/backend/src/services/evolutionService.ts:667, 757` — "TODO: Integrate with storage service"
- `packages/backend/src/services/gateValidator.ts:131` — "TODO: Integrate with packages/backend/src/services/harmonyDetector.ts"
- Issue: Mock implementations may silently pass tests. Production code returns placeholder results.
- Impact: Core orchestration features (agent spawning, chain execution) non-functional
- Fix approach: Replace mocks with actual implementations before production release

## WebSocket Event Broadcasting Incomplete

**Multiple routes TODO event broadcasting:**
- Files:
  - `packages/backend/src/routes/sessions.ts:585` — "TODO: Broadcast awaiting_input event via WebSocket"
  - `packages/backend/src/routes/sessions.ts:679` — "TODO: Broadcast input_received event via WebSocket"
  - `packages/backend/src/routes/surfaces/slack.ts:103-144` — "TODO: Handle different event types (message, app_mention, etc.)"
- Issue: Event broadcast placeholders don't actually send to connected clients
- Impact: UI doesn't update in real-time when input/commands are processed
- Fix approach: Implement WebSocket broadcast using established patterns from other routes

## Storage Interface Misalignment

**Redis storage doesn't implement full Storage interface:**
- File: `packages/backend/src/storage/index.ts:207`
- Missing methods: `getUser`, `setUser`, `deleteUser`, `getUsersByRole`, (also `listSessions` in redis.ts:204)
- Issue: RedisStorage interface incomplete relative to Storage contract
- Impact: User management features may not work with Redis backend
- Fix approach: Either implement missing methods or remove from Storage interface if not needed

## Artifact Parser Unsafe Object Access

**Undefined object dereferencing in artifact parsing:**
- File: `packages/backend/src/services/artifactParser.ts:39, 70`
- Issue: Accessing properties on possibly-undefined objects without null checks
- Impact: Parser may crash on malformed artifacts
- Fix approach: Add early returns or type guards

## Electron Backend Process Cleanup

**Potential resource leak in Electron main process:**
- File: `packages/app/electron/main.ts:48-64`
- Issue: Event listeners on `stdout`, `stderr`, `error`, `exit` added without corresponding cleanup
- Concern: If backend is restarted multiple times, listeners accumulate
- Impact: Memory leak, multiple handlers firing for same events
- Fix approach: Store listener references and remove them before re-spawning backend

## ConversationWatcher Retry Loop Interval

**File watch polling may miss rapid events:**
- File: `packages/backend/src/services/conversationWatcher.ts:736, 749-751`
- Issue: Polling interval set to 10 seconds (RETRY_INTERVAL_MS = 10_000)
- Impact: New Claude Code sessions may take up to 10s to be discovered
- Acceptable for: Discovery of new sessions (infrequent)
- Critical if: Real-time message streaming requires sub-second latency
- Fix approach: Use file system events (chokidar) instead of polling for existing connections, keep polling only for new session discovery

## Test Coverage Gaps

**Skipped accessibility and contract tests:**
- File: `packages/app/src/components/FlowVisualization/AnimatedStepNode.a11y.test.tsx:51` — "should have no accessibility violations" skipped
- Multiple contract completeness tests skipped in `packages/app/src/__tests__/contracts/` when files not found
- Issue: Critical a11y tests not running. No enforcement of CSS/component contracts.
- Impact: Accessibility regressions won't be caught. UI component contracts may drift from reality.
- Fix approach: Enable a11y tests and establish baseline, add contract files for missing components

## File Persistence Type Mismatch

**Optional chaining returns undefined but code expects null:**
- File: `packages/backend/src/storage/file-persistence.ts:163-164`
- Issue: `variable?.property` returns `undefined` but type signature requires `string | null`
- Impact: Type mismatch may cause subtle serialization bugs
- Fix approach: Normalize returns to always use `null` for missing values

## Branded Type Inconsistencies

**DurationMs branded type misused as plain number:**
- Files: `packages/backend/src/services/analyticsAggregator.ts:160-161, 242-243, 313, 409`
- Issue: Assigning plain `number` to `DurationMs` (branded type with Symbol requirement)
- Impact: Type safety of DurationMs compromised. Real duration tracking may be unreliable.
- Fix approach: Use `brandedTypes.durationMs()` wrapper when creating DurationMs values

## Missing Flow Method in Storage

**Storage interface references `delete` method that doesn't exist:**
- File: `packages/backend/src/routes/flows.ts:314`
- Issue: `storage.delete()` called but not defined in Storage interface
- Impact: Flow deletion will crash at runtime
- Fix approach: Implement `delete` method in both memory and Redis storage adapters

## Analytics Property Missing

**FlowAnalytics type missing executionCount property:**
- File: `packages/backend/src/services/analyticsAggregator.ts:250`
- Issue: Code accesses `.executionCount` but type doesn't include this field
- Impact: Analytics aggregation incorrect for flow execution tracking
- Fix approach: Add `executionCount` to FlowAnalytics type definition in shared package

## Event Filtering Type Guards

**WorkspaceEvent union types lack complete type guards:**
- Files: `packages/backend/src/routes/events.ts` throughout
- Issue: Code assumes `previousStep` exists on all step-related events without guarding
- Example: Line 221 accesses `previousStep` without confirming event type
- Impact: Runtime crashes on unexpected event shapes
- Fix approach: Use discriminated unions with proper type guards

## Shell Escape Utility Incomplete

**Possible undefined in shell escape logic:**
- File: `packages/backend/src/utils/shellEscape.ts:46`
- Issue: Array access on possibly-undefined result
- Impact: Shell commands may be constructed incorrectly
- Fix approach: Add null check before array indexing

## Summary by Priority

**🔴 Critical (Blocks shipping):**
- TypeScript compilation must pass (`pnpm type-check`)
- Storage interface must be complete
- Agent spawning must be implemented (not mock)

**🟠 High (Functional gaps):**
- Redis pub/sub tests must pass or feature disabled
- Event broadcasting must work end-to-end
- Parameter validation must prevent undefined crashes

**🟡 Medium (Quality/stability):**
- All TODO service implementations completed
- Accessibility tests enabled
- Resource cleanup in Electron

**🔵 Low (Polish/optimization):**
- Conversation watcher polling interval optimization
- Branded type consistency fixes
- File persistence null handling

---

*Concerns audit: 2026-04-01*
