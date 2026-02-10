# Frontend Harmony Consumption Audit — Layer 1 (Ground Truth)

**Audit Date:** 2026-02-09
**Scope:** D:/ActionFlowsDashboard/packages/app/src/components/ + D:/ActionFlowsDashboard/packages/app/src/hooks/
**Purpose:** Document EXACTLY what data shapes the frontend expects from parsed orchestrator output

---

## Executive Summary

The ActionFlows Dashboard frontend consumes orchestrator output through a **dual-layer architecture**:

1. **WebSocket Event Stream** (primary) — Typed events from `@afw/shared/events.ts`
2. **Session State Models** (derived) — Aggregated `Session`, `Chain`, and `ChainStep` models from `@afw/shared/models.ts`

### Critical Finding

**The frontend does NOT directly parse orchestrator markdown.** All parsing happens in the backend/hooks layer, and the frontend consumes structured TypeScript interfaces. The harmony contract is therefore:

- **Load-bearing:** Event field names, model interfaces, and status enums
- **Evolvable:** Raw markdown text (stored in `raw` fields, rendered as fallback)

---

## Part 1: Core Data Models (from @afw/shared)

### 1.1 ChainStep Interface

**File:** `packages/shared/src/models.ts` (lines 21-60)

**Required Fields:**
```typescript
stepNumber: StepNumber;        // 1-indexed step number
action: string;                // e.g., "analyze/", "code/backend/"
model: ModelString;            // "haiku" | "sonnet" | "opus"
inputs: Record<string, unknown>; // Key-value inputs for the step
waitsFor: StepNumber[];        // Dependencies (empty array if none)
status: StatusString;          // "pending" | "in_progress" | "completed" | "failed" | "skipped"
```

**Optional Fields (with UI impact):**
```typescript
description?: string;          // Shown in StepInspector, ConversationPanel
startedAt?: Timestamp;         // ISO 8601 string, used in TimelineView
completedAt?: Timestamp;       // ISO 8601 string, used in TimelineView
duration?: DurationMs;         // Number (milliseconds), formatted in StepNode
result?: unknown;              // Displayed in StepInspector output section
error?: string;                // Displayed in StepNode error badge, StepInspector
learning?: string;             // Displayed in StepInspector learning section
```

**Consumed By:**
- `ChainDAG/StepNode.tsx` — Renders node with status color, model badge, duration, error
- `StepInspector/StepInspector.tsx` — Detailed step view (all fields)
- `ConversationPanel/ConversationPanel.tsx` — Extracts description/result for messages
- `FlowVisualization/AnimatedStepNode.tsx` — Animations based on status
- `TimelineView/TimelineView.tsx` — Positions steps by startedAt/completedAt

**Format Assumptions:**
- `stepNumber` is always a number (branded as `StepNumber`)
- `status` must be one of the valid `StatusString` values
- `model` must be one of the valid `ModelString` values ("haiku", "sonnet", "opus")
- `duration` is in milliseconds (number)
- `waitsFor` is an array of numbers (can be empty)

---

### 1.2 Chain Interface

**File:** `packages/shared/src/models.ts` (lines 65-122)

**Required Fields:**
```typescript
id: ChainId;                   // Unique chain identifier
sessionId: SessionId;          // Parent session
title: string;                 // Human-readable chain title
steps: ChainStep[];            // Array of ChainStep objects
source: ChainSourceString;     // "flow" | "composed" | "meta-task"
status: StatusString;          // Overall chain status
compiledAt: Timestamp;         // ISO 8601 string
```

**Optional Fields (with UI impact):**
```typescript
ref?: string;                  // Flow name or reference, shown in ChainBadge
startedAt?: Timestamp;         // ISO 8601 string
completedAt?: Timestamp;       // ISO 8601 string
duration?: DurationMs;         // Number (milliseconds)
successfulSteps?: number;      // Stats shown in ChainDAG header
failedSteps?: number;          // Stats shown in ChainDAG header
skippedSteps?: number;         // Stats shown in ChainDAG header
summary?: string;              // Shown in completion messages
executionMode?: "sequential" | "parallel" | "mixed"; // Affects layout
currentStep?: StepNumber;      // Highlighted in real-time views
estimatedDuration?: DurationMs; // Not currently used in UI
userId?: UserId;               // Not currently used in UI
```

**Consumed By:**
- `ChainDAG/ChainDAG.tsx` — Main chain visualization (title, stats, steps)
- `ChainLiveMonitor.tsx` — Real-time updates (uses useChainState hook)
- `FlowVisualization/FlowVisualization.tsx` — Swimlane layout (steps, executionMode)
- `TimelineView/TimelineView.tsx` — Timeline positioning (compiledAt, steps)
- `ChainBadge/ChainBadge.tsx` — Badge rendering (source, ref)

**Format Assumptions:**
- `steps` is always an array (can be empty)
- `title` is always a non-empty string
- `status` matches chain-level status values
- `executionMode` is auto-detected if not provided (from layout.ts detectParallelGroups)

---

### 1.3 Session Interface

**File:** `packages/shared/src/models.ts` (lines 127-189)

**Required Fields:**
```typescript
id: SessionId;                 // Unique session identifier
cwd: string;                   // Working directory
chains: Chain[];               // Array of chains (can be empty)
status: StatusString;          // Session status
startedAt: Timestamp;          // ISO 8601 string
```

**Optional Fields (with UI impact):**
```typescript
user?: UserId;                 // Not currently shown in UI
hostname?: string;             // Not currently shown in UI
platform?: string;             // Not currently shown in UI
currentChain?: Chain;          // Displayed in active session views
conversationState?: "idle" | "awaiting_input" | "receiving_input" | "active";
lastPrompt?: {                 // CRITICAL for ConversationPanel
  text: string;
  type: "binary" | "text" | "chain_approval";
  quickResponses?: string[];
  timestamp: Timestamp;
};
endedAt?: Timestamp;           // ISO 8601 string
duration?: DurationMs;         // Number (milliseconds)
endReason?: string;            // Shown in session summary
summary?: string;              // Shown in session summary
totalStepsExecuted?: number;   // Stats (not currently displayed)
totalChainsCompleted?: number; // Stats (not currently displayed)
criticalErrors?: string[];     // Error list (not currently displayed)
metadata?: Record<string, unknown>; // Generic metadata
```

**Consumed By:**
- `ConversationPanel/ConversationPanel.tsx` — **HEAVILY USED** (lastPrompt, conversationState, chains)
- `SessionInfoPanel/SessionInfoPanel.tsx` — Metadata display (id, cwd, status, timestamps)
- `SessionSidebarItem.tsx` — List item rendering (id, status, cwd)

**Format Assumptions:**
- `conversationState` determines input field enablement
- `lastPrompt.quickResponses` is an array of strings (can be undefined)
- `chains` is always an array (can be empty)
- `currentChain` is either a full Chain object or undefined

---

## Part 2: WebSocket Event Shapes

### 2.1 ChainCompiledEvent

**File:** `packages/shared/src/events.ts` (lines 78-94)

**Consumed Fields:**
```typescript
type: "chain:compiled";
chainId?: ChainId;
title?: string | null;         // Used in SquadPanel logs
steps?: ChainStepSnapshot[] | null; // Full step array
source?: ChainSourceString | null;
ref?: string | null;
totalSteps?: number | null;
executionMode?: "sequential" | "parallel" | "mixed";
estimatedDuration?: DurationMs;
```

**ChainStepSnapshot Shape:**
```typescript
stepNumber: number;
action: string;
model?: string;
inputs?: Record<string, unknown>;
waitsFor?: number[];
description?: string;
```

**Consumed By:**
- `useAgentTracking.ts` (line 266) — Orchestrator status update
  - Reads: `event.title`
  - Updates orchestrator agent log: "Compiled chain: {title}"

**Missing Fields Alert:** None. All fields are nullable for graceful degradation.

---

### 2.2 StepSpawnedEvent

**File:** `packages/shared/src/events.ts` (lines 142-162)

**Consumed Fields:**
```typescript
type: "step:spawned";
stepNumber: StepNumber;        // REQUIRED
action?: string | null;        // Used for agent role mapping
model?: ModelString | null;
inputs?: Record<string, unknown> | null;
description?: string | null;
waitsFor?: StepNumber[] | null;
estimatedDuration?: DurationMs;
subagentType?: string;
parentStepId?: string | null;  // Future nesting support
depth?: number;                // Future nesting support
```

**Consumed By:**
- `useAgentTracking.ts` (line 184) — Creates agent card for step
  - Reads: `event.stepNumber`, `event.action`
  - Creates agent ID: `step-{stepNumber}-{sessionId}`
  - Maps action → role via `mapActionToRole(event.action)`
  - Sets currentAction: `event.action || "Initializing..."`

**Critical Dependencies:**
- `event.action` MUST be present for meaningful role assignment
- Default role is "analyze" if action is null/undefined

---

### 2.3 StepStartedEvent

**File:** `packages/shared/src/events.ts` (lines 164-176)

**Consumed Fields:**
```typescript
type: "step:started";
stepNumber: StepNumber;        // REQUIRED
action?: string | null;
agentName?: string | null;
startedAt: Timestamp;          // Inferred fallback
```

**Consumed By:**
- `useAgentTracking.ts` (line 214) — Updates agent status
  - Reads: `event.stepNumber`, `event.action`
  - Updates agent status to "working"
  - Adds log: `"Started: {action || 'unknown action'}"`

---

### 2.4 StepCompletedEvent

**File:** `packages/shared/src/events.ts` (lines 178-200)

**Consumed Fields:**
```typescript
type: "step:completed";
stepNumber: StepNumber;        // REQUIRED
duration: DurationMs;          // REQUIRED
action?: string | null;
status?: StatusString | null;
result?: unknown | null;
learning?: string | null;
fileChanges?: FileChange[] | null;
summary?: string | null;       // USED for log message
succeeded: boolean;            // Inferred fallback
outputLength?: number;
parentStepId?: string | null;
depth?: number;
```

**Consumed By:**
- `useAgentTracking.ts` (line 222) — Updates agent status + logs
  - Reads: `event.stepNumber`, `event.summary`, `event.status`
  - Updates agent status to "success"
  - Adds log: `event.summary || "Status: {status}" || "Completed successfully"`
  - Sets agent progress to 100%
- `useChainEvents.ts` (line 49) — Updates chain step state
  - Reads: `event.stepNumber`, `event.duration`
  - Calls updateStep callback with status="completed", duration

**Format Expectations:**
- `summary` is preferred for log display (one-line result)
- Falls back to `status` if summary is null
- Falls back to generic "Completed successfully" if both are null

---

### 2.5 StepFailedEvent

**File:** `packages/shared/src/events.ts` (lines 202-218)

**Consumed Fields:**
```typescript
type: "step:failed";
stepNumber: StepNumber;        // REQUIRED
action?: string | null;
error?: string | null;         // USED for log display
errorType?: string | null;
stackTrace?: string | null;
suggestion?: string | null;    // USED for enhanced log
isCritical: boolean;           // Inferred fallback
isRetryable: boolean;          // Inferred fallback
```

**Consumed By:**
- `useAgentTracking.ts` (line 250) — Updates agent status + logs
  - Reads: `event.stepNumber`, `event.error`, `event.suggestion`
  - Updates agent status to "error"
  - Adds log: `"Error: {error || 'Unknown error'}. Suggestion: {suggestion}"` (if suggestion present)
  - Adds log: `"Error: {error}"` (if no suggestion)
  - Falls back to "Failed" if error is null
- `useChainEvents.ts` (line 59) — Updates chain step state
  - Reads: `event.stepNumber`, `event.error`
  - Calls updateStep callback with status="failed", error

**Format Expectations:**
- `error` should be a short, human-readable error message
- `suggestion` is optional but highly valued for user guidance

---

### 2.6 ChainCompletedEvent

**File:** `packages/shared/src/events.ts` (lines 119-136)

**Consumed Fields:**
```typescript
type: "chain:completed";
chainId: ChainId;              // REQUIRED
duration: DurationMs;          // REQUIRED
title?: string | null;
status?: StatusString | null;
successfulSteps?: number | null;
failedSteps?: number | null;
skippedSteps?: number | null;
summary?: string | null;       // USED for log display
overallStatus: "success" | "partial" | "failure"; // REQUIRED (inferred fallback)
```

**Consumed By:**
- `useAgentTracking.ts` (line 280) — Updates orchestrator status
  - Reads: `event.overallStatus`, `event.summary`
  - Updates orchestrator status: "success" if overallStatus="success", else "idle"
  - Adds log: `event.summary || "Chain completed: {overallStatus}"`

**Format Expectations:**
- `overallStatus` drives orchestrator badge color
- `summary` is preferred for final completion message

---

### 2.7 SessionStartedEvent

**File:** `packages/shared/src/events.ts` (lines 45-57)

**Consumed Fields:**
```typescript
type: "session:started";
cwd: string;                   // REQUIRED
user?: UserId;
hostname?: string;
platform?: string;
```

**Consumed By:**
- `useAgentTracking.ts` (line 154) — Creates orchestrator agent
  - Reads: (no fields used directly)
  - Creates orchestrator agent ID: `orchestrator-{sessionId}`
  - Sets status to "idle"
  - Sets currentAction to "Initializing session..."

---

## Part 3: Component-Specific Expectations

### 3.1 ChainDAG Component

**File:** `packages/app/src/components/ChainDAG/ChainDAG.tsx`

**Props:**
```typescript
chain: Chain;                  // Full Chain object (required)
onStepSelected?: (stepNumber: StepNumber) => void;
onStepUpdate?: (stepNumber: number, updates: any) => void;
```

**Data Consumed from Chain:**
- `chain.title` (line 149) — Header title
- `chain.steps` (line 52, 72, 89, 103, 129) — Rendered as nodes/edges
- `chain.steps[].stepNumber` (line 74, 85, 120) — Node ID generation
- `chain.steps[].action` (line 66) — Node label
- `chain.steps[].model` (line 69) — Model badge
- `chain.steps[].status` (line 129-133) — Node color, stats
- `chain.steps[].waitsFor` (line 51, 93) — Edge dependencies
- `chain.steps[].duration` (line 72) — Duration badge (if completed)
- `chain.steps[].error` (line 78) — Error badge (if failed)
- `chain.steps[].description` — Not directly used in ChainDAG (passed to StepInspector)

**Computed Metadata:**
- Parallel groups (from `detectParallelGroups(chain.steps)`) — line 52
- Chain type (from `detectChainType(chain)`) — line 45
- Stats: total, completed, failed, inProgress, pending, skipped — line 129-133

**Hardcoded Assumptions:**
- Step status is one of: "pending", "in_progress", "completed", "failed", "skipped"
- `waitsFor` is an array (can be empty)
- `duration` is a number in milliseconds

---

### 3.2 StepNode Component

**File:** `packages/app/src/components/ChainDAG/StepNode.tsx`

**Props (via data):**
```typescript
data: {
  step: ChainStep;             // Full step object
  isSelected: boolean;
  onSelect: (stepNumber: number) => void;
  parallelGroupSize: number;   // From parent ChainDAG
}
```

**Data Consumed from step:**
- `step.stepNumber` (line 58) — "#{stepNumber}"
- `step.action` (line 66) — Action label
- `step.model` (line 69) — Model badge class
- `step.status` (line 24, 28, 72, 78, 84) — Status-based rendering
- `step.duration` (line 72-75) — Duration badge (if completed)
- `step.error` (line 78-81) — Error badge (if failed)
- `step.waitsFor` (line 51) — Input handle visibility

**Format Assumptions:**
- `step.status` triggers different visual states (colors, animations)
- `step.duration` is formatted via formatDuration() — expects milliseconds
- `step.error` is displayed as-is (truncated with title attribute)

---

### 3.3 StepInspector Component

**File:** `packages/app/src/components/StepInspector/StepInspector.tsx`

**Props:**
```typescript
step: ChainStep | null;        // Full step object or null
sessionId?: SessionId;         // For retry/skip commands
onClose?: () => void;
```

**Data Consumed from step:**
- `step.stepNumber` (line 160) — "Step #{stepNumber}"
- `step.action` (line 161) — Action title
- `step.status` (line 67-81, 149, 174-176, 189-208, 222-224) — Status badge, controls
- `step.model` (line 179-183, 228-232) — Model badge
- `step.duration` (line 234-240) — Duration display
- `step.startedAt` (line 243-249) — Timestamp
- `step.completedAt` (line 252-258) — Timestamp
- `step.description` (line 261-266) — Full description text
- `step.waitsFor` (line 268-279) — Dependencies list
- `step.inputs` (line 284-302) — Inputs table (all key-value pairs)
- `step.result` (line 309-319) — Output display (formatted as JSON if object)
- `step.error` (line 322-329) — Error display
- `step.learning` (line 334-341) — Learning block

**Format Assumptions:**
- `step.inputs` is always a Record<string, unknown> (empty object if no inputs)
- `step.result` can be any type (formatted via formatValue helper)
- `step.waitsFor` is an array of numbers
- `step.status = "failed"` enables Retry button
- `step.status = "failed" | "pending"` enables Skip button

---

### 3.4 ConversationPanel Component

**File:** `packages/app/src/components/ConversationPanel/ConversationPanel.tsx`

**Props:**
```typescript
session: Session;              // Full Session object
onSubmitInput: (input: string) => Promise<void>;
```

**Data Consumed from session:**
- `session.conversationState` (line 85) — Enables/disables input field
- `session.lastPrompt` (line 88, 128-135) — Latest prompt message
  - `lastPrompt.text` (line 131) — Message content
  - `lastPrompt.timestamp` (line 132) — Message timestamp
  - `lastPrompt.quickResponses` (line 88, 231-243) — Quick response buttons
- `session.chains` (line 107) — Extracted for message history
  - `chain.steps` (line 109) — Step results as messages
  - `step.description` (line 112) — Message content
  - `step.result` (line 112) — Fallback message content
  - `step.completedAt` (line 117) — Message timestamp
  - `step.startedAt` (line 117) — Fallback timestamp
  - `step.stepNumber` (line 118) — Message metadata

**Message Construction Logic:**
1. Extract completed step descriptions/results as assistant messages
2. Add lastPrompt as most recent assistant message (if present)
3. Sort all messages by timestamp (chronological)
4. Render with InlineButtons placeholder for latest message

**Format Assumptions:**
- `conversationState = "awaiting_input"` enables input field
- `quickResponses` is an array of strings (can be empty or undefined)
- `lastPrompt.text` is always a non-empty string (if lastPrompt exists)
- Step descriptions/results can be null (filtered out if both are null)

---

### 3.5 SquadPanel Component

**File:** `packages/app/src/components/SquadPanel/SquadPanel.tsx`

**Props:**
```typescript
sessionId: SessionId;          // Used by useAgentTracking hook
placement?: "left" | "right" | "bottom" | "overlay";
overlayPosition?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
overlayOpacity?: number;       // 0-1
className?: string;
onAgentClick?: (agentId: string) => void;
audioEnabled?: boolean;
```

**Data Consumed (via useAgentTracking):**
- Event stream from WebSocketContext
- Filters by `event.sessionId` (line 151)
- Builds agent characters from events:
  - `SessionStartedEvent` → Creates orchestrator agent
  - `StepSpawnedEvent` → Creates subagent (action → role mapping)
  - `StepStartedEvent` → Updates agent status to "working"
  - `StepCompletedEvent` → Updates agent status to "success", adds log
  - `StepFailedEvent` → Updates agent status to "error", adds log
  - `ChainCompiledEvent` → Updates orchestrator to "thinking"
  - `ChainCompletedEvent` → Updates orchestrator to "success"/"idle"

**AgentCharacter Shape (derived):**
```typescript
id: string;                    // e.g., "step-1-session-123"
role: "orchestrator" | "analyze" | "code" | "review" | "test" | "plan";
name: string;                  // Role-specific name (e.g., "Analyzer", "Coder")
status: "idle" | "spawning" | "working" | "thinking" | "success" | "error";
logs: Array<{
  id: string;
  type: "info" | "success" | "error" | "thinking" | "warning";
  message: string;
  timestamp: number;
}>;
progress: number;              // 0-100
currentAction: string;         // e.g., "analyze/", "Initializing..."
parentId?: string;             // For nested agents
```

**Format Assumptions:**
- `event.action` drives role detection (via `mapActionToRole()`)
- Agent logs are capped at MAX_LOGS_PER_AGENT (100)
- Agents auto-cleanup after IDLE_AGENT_TIMEOUT_MS (30s)

---

### 3.6 FlowVisualization Component

**File:** `packages/app/src/components/FlowVisualization/FlowVisualization.tsx`

**Props:**
```typescript
chain: Chain;                  // Full Chain object
onStepClick?: (stepNumber: number) => void;
enableAnimations?: boolean;    // Default true
```

**Data Consumed from Chain:**
- `chain.steps` (line 59, 69) — Swimlane layout + node rendering
- `chain.steps[].stepNumber` (line 74, 96) — Node ID
- `chain.steps[].action` (line 97) — Node label
- `chain.steps[].status` (line 76-87, 98) — Animation state
- `chain.steps[].description` (line 99) — Node tooltip
- `chain.steps[].model` (line 100) — Model badge

**Swimlane Layout (from utils/swimlaneLayout.ts):**
- Assigns steps to swimlanes based on `action` (e.g., "code" → "Development")
- Positions nodes vertically within swimlanes
- Detects parallel execution groups

**Animation States (based on status):**
- `pending` → "slide-in"
- `in_progress` → "pulse"
- `completed` → "shrink"
- `failed` → "shake"
- (no animations if `enableAnimations=false`)

---

### 3.7 TimelineView Component

**File:** `packages/app/src/components/TimelineView/TimelineView.tsx`

**Props:**
```typescript
chain: Chain;                  // Full Chain object
onStepSelected?: (stepNumber: StepNumber) => void;
```

**Data Consumed from Chain:**
- `chain.compiledAt` (line 31) — Baseline time
- `chain.steps` (line 38, 65) — Timeline position calculation
- `chain.steps[].stepNumber` (line 77) — Step identification
- `chain.steps[].startedAt` (line 39, 66) — Start position
- `chain.steps[].completedAt` (line 40-41, 67-71) — End position, width
- `chain.steps[].status` — Not directly used (affects rendering color)

**Timeline Calculation Logic:**
1. Find min/max time range from all step start/end times
2. Add 5% padding on each side
3. Calculate left position: `((startTime - paddedMin) / paddedDuration) * 100`
4. Calculate width: `((endTime - startTime) / paddedDuration) * 100`
5. Stack overlapping steps into rows (greedy algorithm)

**Format Assumptions:**
- `startedAt` and `completedAt` are ISO 8601 strings (parseable by `new Date()`)
- If step hasn't started, uses `Date.now()` as fallback
- If step started but not completed, end time = `Date.now()`

---

## Part 4: Hooks Consuming Events

### 4.1 useChainState Hook

**File:** `packages/app/src/hooks/useChainState.ts`

**Purpose:** Maintains chain state and updates individual steps

**State Shape:**
```typescript
chain: Chain | null;
```

**Methods:**
```typescript
updateStep(stepNumber: number, updates: Partial<ChainStep>) => void;
setChain(chain: Chain) => void;
```

**Update Logic (lines 29-98):**
- Finds step by `stepNumber`
- Merges partial updates into step
- Recalculates chain stats: `successfulSteps`, `failedSteps`, `skippedSteps`
- Updates chain status based on step statuses:
  - `inProgressCount > 0` → status = "in_progress"
  - `pendingCount = 0 && failedSteps = 0` → status = "completed"
  - `failedSteps > 0` → status = "mixed"

**Format Assumptions:**
- `stepNumber` is unique within chain
- `updates` can include any ChainStep field
- Step status must be one of: "pending", "in_progress", "completed", "failed", "skipped"

---

### 4.2 useChainEvents Hook

**File:** `packages/app/src/hooks/useChainEvents.ts`

**Purpose:** Connects WebSocket events to chain state updates

**Event Handlers:**
- `onStepSpawned(stepNumber)` (line 40-46)
- `onStepCompleted(stepNumber, duration)` (line 49-56)
- `onStepFailed(stepNumber, error)` (line 59-66)
- `onStepSkipped(stepNumber)` (line 69-75)

**Data Extracted from Events:**
- `step_spawned`: `event.data.stepNumber || event.data.step` (line 42)
- `step_completed`: `event.data.stepNumber || event.data.step`, `event.data.duration` (line 51-52)
- `step_failed`: `event.data.stepNumber || event.data.step`, `event.data.error || event.data.message` (line 61-62)
- `step_skipped`: `event.data.stepNumber || event.data.step` (line 71)

**Format Assumptions:**
- Events have `data` field (fallback to `event` itself)
- `stepNumber` field may be named `stepNumber` or `step`
- Duration is a number (milliseconds)
- Error is a string

---

### 4.3 useEvents Hook

**File:** `packages/app/src/hooks/useEvents.ts`

**Purpose:** Subscribe to WebSocket events for a session

**Usage Pattern:**
```typescript
const events = useEvents(sessionId, ["step_spawned", "step_completed"]);
```

**Filtering:**
- By `sessionId` (line 36)
- By `eventTypes` array (line 41)

**Storage:**
- Local state array: `events: WorkspaceEvent[]`
- Appends new events to end of array (line 45)

**Format Assumptions:**
- All events have `type`, `sessionId`, `timestamp` fields
- Event type strings match expected values (e.g., "step_spawned", not "step:spawned")

---

### 4.4 useWebSocket Hook

**File:** `packages/app/src/hooks/useWebSocket.ts`

**Purpose:** Low-level WebSocket connection management

**Message Parsing (lines 50-91):**
1. Parse JSON from `event.data`
2. Handle special message types:
   - `subscription_confirmed` → Silent
   - `pong` → Silent
   - `error` → Log warning
   - `registry-event` → Unwrap payload and emit
3. Unwrap broadcast wrapper: `{ type: "event", payload: <actual event> }`
4. Validate required fields: `type`, `sessionId`, `timestamp`
5. Filter by subscribed sessions
6. Emit to `onEvent` callback

**Subscription Management:**
- `subscribe(sessionId)` (line 190-205) — Adds to subscribed set, sends subscribe message
- `unsubscribe(sessionId)` (line 208-223) — Removes from set, sends unsubscribe message

**Format Assumptions:**
- WebSocket messages are JSON
- Events have `type`, `sessionId`, `timestamp` (validated on line 75)
- Broadcast wrapper has `{ type: "event", sessionId, payload }` shape
- Registry events have `{ type: "registry-event", payload }` shape

---

## Part 5: Stale/Unused Fields

### 5.1 Potentially Stale Props

**ChainLiveMonitor.tsx:**
- `initialChain?: any` (line 14) — Type is `any` (not type-safe)
- Used in useMemo (line 33-37) but never passed by parent components

**Recommendation:** Remove or type properly.

---

### 5.2 Unused Session Fields

**From Session interface (not rendered in UI):**
- `user?: UserId` — Not displayed in SessionInfoPanel
- `hostname?: string` — Not displayed
- `platform?: string` — Not displayed
- `totalStepsExecuted?: number` — Stats not shown
- `totalChainsCompleted?: number` — Stats not shown
- `criticalErrors?: string[]` — Error list not rendered
- `metadata?: Record<string, unknown>` — Generic metadata not used

**Recommendation:** These are future-proofing fields. Keep in contract but mark as optional.

---

### 5.3 Unused Chain Fields

**From Chain interface:**
- `userId?: UserId` — Not displayed
- `estimatedDuration?: DurationMs` — Not shown in ChainDAG (though calculated internally)

**Recommendation:** Keep for future features.

---

## Part 6: Hardcoded Format Assumptions (Red Flags)

### 6.1 Status Enum Values

**Defined in:** `packages/shared/src/types.ts` (StatusString type)

**Expected Values:**
- "pending"
- "in_progress"
- "completed"
- "failed"
- "skipped"
- "mixed" (chain-level only)

**Used in:**
- ChainDAG.tsx (line 129-133) — Stats calculation
- StepNode.tsx (line 24) — CSS class generation
- StepInspector.tsx (line 67-81) — Status badge color
- useChainState.ts (line 59-66, 70-82) — Status recalculation

**Risk:** If orchestrator outputs a different status string (e.g., "SUCCESS" instead of "completed"), it will not match and UI will default to "pending" rendering.

**Mitigation:** Status values are contract-defined (load-bearing). Orchestrator MUST use exact strings.

---

### 6.2 Model Enum Values

**Defined in:** `packages/shared/src/types.ts` (ModelString type)

**Expected Values:**
- "haiku"
- "sonnet"
- "opus"

**Used in:**
- StepNode.tsx (line 69) — CSS class `model-${step.model}`
- StepInspector.tsx (line 179-183, 228-232) — Model badge class

**Risk:** If orchestrator outputs "claude-haiku" or "Haiku", CSS classes won't match.

**Mitigation:** Model values are contract-defined (load-bearing). Orchestrator MUST use exact strings.

---

### 6.3 Action Name Format

**Expected Format:** `{action}/` or `{action}/{stack}/` (e.g., "analyze/", "code/backend/")

**Used in:**
- SquadPanel/useAgentTracking.ts (line 188) — `mapActionToRole(event.action)`
- FlowVisualization (swimlane assignment) — Extracts base action name

**mapActionToRole Logic (from types.ts):**
```typescript
if (!action) return "analyze";
if (action.includes("code")) return "code";
if (action.includes("review")) return "review";
if (action.includes("test")) return "test";
if (action.includes("plan")) return "plan";
return "analyze"; // Default
```

**Risk:** Loose matching (substring search). "review-pr/" → "review", "review/" → "review", "code-review/" → "code" (not "review").

**Mitigation:** Action names are free-form but should follow conventions. SquadPanel has graceful fallback.

---

### 6.4 Event Type Strings

**Expected Format:** "type:subtype" (e.g., "step:spawned", "chain:compiled")

**Consumed in:**
- useChainEvents.ts (line 22-27) — Listens for specific event types
- useAgentTracking.ts (line 154, 184, 214, 222, 250, 266, 280) — Event type guards

**Risk:** If backend emits "step_spawned" instead of "step:spawned", event won't be recognized.

**Current State:** Backend uses ":" separator (e.g., "step:spawned"). Frontend expects same.

**Mitigation:** Event type strings are contract-defined (load-bearing).

---

### 6.5 Timestamp Format

**Expected Format:** ISO 8601 string (e.g., "2026-02-09T12:34:56.789Z")

**Used in:**
- TimelineView.tsx (line 31, 39, 40) — `new Date(timestamp).getTime()`
- ConversationPanel.tsx (line 138) — `new Date(timestamp).getTime()`
- SessionInfoPanel.tsx (line 30-42) — Relative time formatting

**Risk:** If timestamp is a Unix epoch number (not ISO string), `new Date()` will misinterpret.

**Mitigation:** Timestamp format is contract-defined (load-bearing). All timestamps must be ISO 8601 strings.

---

### 6.6 Duration Format

**Expected Format:** Number (milliseconds)

**Used in:**
- StepNode.tsx (line 100-109) — formatDuration() helper
- StepInspector.tsx (line 20-29) — formatDuration() helper
- ChainDAG.tsx (line 247-257) — formatDuration() helper

**formatDuration Logic:**
- `< 1000ms` → "{ms}ms"
- `< 60000ms` → "{s}s"
- `>= 60000ms` → "{m}m {s}s"

**Risk:** If duration is in seconds (not milliseconds), values will be 1000x off.

**Mitigation:** Duration format is contract-defined (load-bearing). Always use milliseconds.

---

## Part 7: Components Expecting Data No Parser Provides

**None found.** All components consume data from well-typed interfaces. Any missing fields are handled with null checks or optional chaining.

**Graceful Degradation Examples:**
- StepInspector: `step.description` undefined → Section not rendered
- ConversationPanel: `session.lastPrompt` undefined → No latest message shown
- ChainDAG: `step.duration` undefined → No duration badge shown
- SquadPanel: `event.action` null → Default role "analyze"

---

## Part 8: Contract-Critical Fields (Load-Bearing)

**These fields MUST be present and correctly formatted for UI to function:**

### Events:
- `type` (string) — Event discriminator
- `sessionId` (SessionId) — Event routing
- `timestamp` (ISO 8601 string) — Event ordering
- `stepNumber` (number) — Step identification
- `duration` (number, milliseconds) — StepCompletedEvent, ChainCompletedEvent
- `chainId` (ChainId) — Chain identification

### Models:
- `Chain.steps` (ChainStep[]) — Required for all visualizations
- `ChainStep.stepNumber` (number) — Step identification
- `ChainStep.action` (string) — Step label
- `ChainStep.model` (ModelString: "haiku" | "sonnet" | "opus") — Model badge
- `ChainStep.status` (StatusString: "pending" | "in_progress" | "completed" | "failed" | "skipped") — Status rendering
- `ChainStep.waitsFor` (number[]) — Dependency graph

### Session:
- `Session.id` (SessionId) — Session identification
- `Session.cwd` (string) — Working directory
- `Session.chains` (Chain[]) — Message history source
- `Session.startedAt` (ISO 8601 string) — Timestamp
- `Session.conversationState` ("idle" | "awaiting_input" | ...) — Input enablement

---

## Part 9: Recommendations

### 9.1 Type Safety Improvements

**ChainLiveMonitor.tsx (line 14):**
```typescript
// CURRENT (BAD):
initialChain?: any;

// RECOMMENDED:
initialChain?: Chain;
```

**useChainEvents.ts (line 41-42, 51-52, 61-62):**
```typescript
// CURRENT (FRAGILE):
const data = (event as any).data || {};
const stepNumber = data.stepNumber || data.step;

// RECOMMENDED (define event payload types):
interface StepSpawnedEventData {
  stepNumber: number;
}
const data = (event as StepSpawnedEvent).data;
```

---

### 9.2 Missing Field Warnings

Add console warnings when critical fields are missing:

**Example (in useAgentTracking.ts):**
```typescript
if (!event.action) {
  console.warn(`[useAgentTracking] StepSpawnedEvent missing action for step ${event.stepNumber}`);
}
```

---

### 9.3 Validation Layer

Add runtime validation at the WebSocket message parsing layer:

**Example (in useWebSocket.ts):**
```typescript
import { eventGuards } from '@afw/shared';

if (eventGuards.isStepCompleted(data)) {
  if (typeof data.duration !== 'number') {
    console.error('[WebSocket] Invalid duration in StepCompletedEvent:', data);
  }
}
```

---

## Part 10: Summary Table — Component Data Dependencies

| Component | Required Fields | Optional Fields (with UI impact) | Graceful Degradation |
|-----------|----------------|----------------------------------|---------------------|
| **ChainDAG** | `chain.steps[]`, `step.stepNumber`, `step.action`, `step.status` | `step.model`, `step.duration`, `step.error`, `step.waitsFor` | Missing duration → no badge, missing error → no error badge |
| **StepNode** | `step.stepNumber`, `step.action`, `step.status` | `step.model`, `step.duration`, `step.error` | Missing model → no badge, missing duration → no badge |
| **StepInspector** | `step.stepNumber`, `step.action`, `step.status` | `step.description`, `step.inputs`, `step.result`, `step.error`, `step.learning`, `step.waitsFor` | All optional sections hidden if fields missing |
| **ConversationPanel** | `session.conversationState`, `session.chains` | `session.lastPrompt`, `step.description`, `step.result` | Missing lastPrompt → no latest message, missing descriptions → empty history |
| **SquadPanel** | `event.stepNumber` | `event.action`, `event.summary`, `event.error`, `event.suggestion` | Missing action → default role "analyze", missing summary → generic log |
| **FlowVisualization** | `chain.steps[]`, `step.stepNumber`, `step.action`, `step.status` | `step.description`, `step.model` | Missing description → no tooltip |
| **TimelineView** | `chain.compiledAt`, `chain.steps[]`, `step.stepNumber` | `step.startedAt`, `step.completedAt` | Missing timestamps → uses Date.now() |
| **SessionInfoPanel** | `session.id`, `session.cwd`, `session.status`, `session.startedAt` | `session.endedAt`, `session.duration` | Missing endedAt → shows "Active" |

---

## Conclusion

The ActionFlows Dashboard frontend is **well-architected** for graceful degradation. All components use nullable/optional fields and provide fallback rendering. However, the contract is **load-bearing** for these specific fields:

### Critical Contract Fields (MUST be correct):
1. **Event types** — "step:spawned", "chain:compiled", etc. (colon separator)
2. **Status values** — "pending", "in_progress", "completed", "failed", "skipped"
3. **Model values** — "haiku", "sonnet", "opus"
4. **Timestamp format** — ISO 8601 strings
5. **Duration format** — Milliseconds (number)
6. **Step numbers** — Numbers (not strings)

### Evolvable Fields (Can evolve freely):
- `description`, `summary`, `learning`, `error`, `suggestion` — Free-form text
- `inputs`, `result`, `metadata` — JSON objects (rendered as-is)
- Raw markdown (not consumed by frontend)

**Next Steps:**
1. Audit backend parsing layer (Layer 2) to ensure it produces these exact shapes
2. Audit orchestrator output (Layer 3) to ensure it follows markdown contract
3. Flag any mismatches and design migration strategy
