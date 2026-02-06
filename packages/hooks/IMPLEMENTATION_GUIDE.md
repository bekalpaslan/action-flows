# afw-step-completed Implementation Guide

## Overview

`afw-step-completed.ts` is a SubagentStop hook script that captures the completion of Claude Code subagent step execution and posts a `StepCompletedEvent` to the ActionFlows Dashboard backend.

## Architecture

### Hook Lifecycle

```
Claude Code execution
        ↓
Subagent step completes
        ↓
SubagentStop hook triggered
        ↓
Hook receives JSON via stdin
        ↓
afw-step-completed.ts runs
        ├── Validate hook data
        ├── Parse agent output
        ├── Build event
        └── POST to backend
        ↓
Backend receives StepCompletedEvent
        ↓
Dashboard updates execution state
```

### File Structure

```
packages/hooks/
├── src/
│   ├── afw-step-spawned.ts           # PreToolUse hook (already exists)
│   ├── afw-step-completed.ts         # SubagentStop hook (NEW)
│   └── utils/
│       ├── settings.ts               # Configuration management
│       ├── http.ts                   # Network utilities
│       └── parser.ts                 # Agent output parsing
├── package.json                      # Dependencies
├── tsconfig.json                     # TypeScript config
└── README.md                         # User documentation
```

## Implementation Details

### 1. Input Validation

**Source**: Claude Code SubagentStop hook
**Format**: JSON via stdin

```json
{
  "session_id": "sess-uuid",
  "agent_id": "agent-instance-id",
  "exit_status": "completed" | "error" | "cancelled",
  "duration_ms": 12345,
  "output": "agent's stdout/stderr"
}
```

**Validation** (`validateHookData`):
- `session_id` must be string
- `agent_id` must be string
- `exit_status` must be one of: "completed", "error", "cancelled"
- `duration_ms` must be number
- `output` must be string

### 2. Data Extraction - Automatic Fields

These fields are always available from the hook data:

| Field | Source | Type | Usage |
|-------|--------|------|-------|
| `sessionId` | `session_id` | SessionId (branded) | Identifies execution session |
| `stepNumber` | Parsed from `output` | StepNumber | Step index (1-based) |
| `duration` | `duration_ms` | DurationMs (branded) | Execution time |

**Fallback behavior**:
- If `stepNumber` can't be parsed, defaults to `1`
- `duration` comes directly from hook data (no parsing needed)

### 3. Data Extraction - Parsed Fields

These fields are extracted from agent output using regex patterns. All are nullable.

#### Step Number Parsing

```typescript
// Pattern: "Step 1", "## Step 2", "step 3:", etc.
/(?:^|\s|##)\s*(?:Step|step)\s+(\d+)/m

// Examples that match:
// "Step 1: code/"
// "## Step 2 complete"
// " step 3 output"

// Fallback: 1
```

#### Action Name Parsing

```typescript
// Pattern 1: Context-based (PreferredFormat)
/(?:Spawning\s+Step\s+\d+:\s+|Step\s+\d+:\s+)([a-z\-]+)(?:\/)?/i

// Examples:
// "Spawning Step 1: review/"
// "Step 2: audit-findings"

// Pattern 2: Generic action pattern (Fallback)
/([a-z\-]+)\/(?:\s|$)/i

// Examples:
// "code/ -- Implementation"
// "notify/"

// Fallback: null
```

#### Result/Summary Parsing

```typescript
// Pattern 1: Explicit markers
/(?:^|\n)\s*(?:Result|Summary|Outcome):\s*(.+?)(?:\n|$)/im

// Examples:
// "Result: Implementation complete"
// "Summary: 3 files modified"

// Pattern 2: Last meaningful line (Fallback)
// Gets the last line if it's < 200 chars

// Fallback: null
```

#### Learning Parsing

```typescript
// Pattern 1: Markdown headers
/(?:^|\n)(?:##|###)\s+(?:Learning|Learnings)(?:.*?)(?:\n\n|$)([\s\S]*?)(?:\n##|$)/im

// Examples:
// "## Learnings"
// "### Learning"
// "### Learnings - Insights"

// Pattern 2: Agent Learning section (Fallback)
/Agent Learning[\s\S]*?(?:Issue|Suggested fix):\s*"?(.+?)"?(?:\n|$)/i

// Examples:
// "Agent Learning"
// "From: review/"
// "Issue: "{..."}"
// "Suggested fix: {..."}"

// Fallback: null
```

### 4. Status Mapping

Maps Claude Code exit status to ActionFlows Status enum:

| Claude Exit Status | Status Enum | Meaning |
|-------------------|-------------|---------|
| `"completed"` | `Status.COMPLETED` | Step finished successfully |
| `"error"` | `Status.FAILED` | Step encountered error |
| `"cancelled"` | `Status.SKIPPED` | Step was cancelled |

### 5. Event Construction

Builds `StepCompletedEvent`:

```typescript
interface StepCompletedEvent {
  // Event metadata
  type: 'step:completed';
  sessionId: SessionId;              // From hook session_id
  timestamp: Timestamp;              // Current ISO 8601 timestamp

  // Automatic fields (always available)
  stepNumber: StepNumber;            // Parsed or defaults to 1
  duration: DurationMs;              // From hook duration_ms

  // Parsed fields (nullable)
  action?: string | null;            // From output parsing
  status?: StatusString | null;      // Mapped from exit_status
  result?: unknown | null;           // From output parsing
  learning?: string | null;          // From output parsing

  // Inferred fallbacks
  succeeded: boolean;                // status === Status.COMPLETED
  outputLength?: number;             // Length of agent output
}
```

### 6. Event Posting

**Endpoint**: `POST {backendUrl}/api/events`
**Header**: `Content-Type: application/json`
**Body**: JSON-serialized `StepCompletedEvent`

**Configuration**:
- Backend URL from `AFW_BACKEND_URL` environment variable
- Default: `http://localhost:3000`
- Timeout: 5 seconds

**Failure handling**:
- Network errors are caught and logged
- Non-200 responses are logged
- All failures are silent (exit code 0)

### 7. Error Handling

All errors are **non-fatal** and follow **silent failure mode**:

| Error | Handling |
|-------|----------|
| Invalid JSON | Log to stderr, exit(0) |
| Invalid hook data | Log to stderr, exit(0) |
| POST network error | Log to stderr, exit(0) |
| POST non-200 response | Log to stderr, exit(0) |
| Unexpected error | Log to stderr, exit(0) |

**Why silent failure?**
- Claude Code subprocess should not be blocked
- Hook failures should not halt orchestrator execution
- Error logging enables debugging without affecting flow

## Testing

### Manual Test

```bash
# Set backend URL
export AFW_BACKEND_URL=http://localhost:3000

# Run hook with sample data
cat << 'EOF' | node dist/afw-step-completed.js
{
  "session_id": "test-sess-123",
  "agent_id": "test-agent-456",
  "exit_status": "completed",
  "duration_ms": 5000,
  "output": "Step 1 complete: code/\n\nResult: Implementation successful"
}
EOF
```

### Expected Output

**On success**:
- Exit code: 0
- stderr: (empty or debug logs if enabled)
- Backend receives: `StepCompletedEvent`

**On failure**:
- Exit code: 0 (always)
- stderr: Error message (e.g., "Failed to post event: 500 Internal Server Error")
- Backend receives: (nothing if POST failed)

## Deployment

### 1. Build

```bash
cd packages/hooks
npm run build
```

This generates `dist/afw-step-completed.js`

### 2. Install Hook

In Claude Code configuration:

```yaml
hooks:
  on_subagent_stop:
    script: "node /path/to/dist/afw-step-completed.js"
    env:
      AFW_BACKEND_URL: "http://backend:3000"
```

### 3. Verify Integration

Claude Code will:
1. Execute hook when subagent finishes
2. Pass JSON to hook via stdin
3. Hook POSTs event to backend
4. Backend stores in execution log

## Design Decisions

### 1. Graceful Degradation

All parsed fields are nullable. If output doesn't match expected patterns, the event still posts with `null` values rather than failing.

**Rationale**: Backend UI can handle missing values; hook failure blocks orchestration.

### 2. Silent Failure Mode

Exit code is always 0, even on errors.

**Rationale**: Hook runs in Claude Code subprocess. Failures should not block subsequent steps or the orchestrator.

### 3. Timeout (5 seconds)

HTTP request has 5-second timeout.

**Rationale**: Hook must not hang indefinitely. 5 seconds is reasonable for local/LAN backend.

### 4. Output Parsing Regex Patterns

Multiple fallback patterns with increasing generality.

**Rationale**: Agent output formats vary. Multiple patterns catch common formats while being resilient to variations.

### 5. Reusable Utilities

`settings.ts`, `http.ts`, `parser.ts` are separate modules.

**Rationale**:
- Shared with `afw-step-spawned.ts`
- Future hooks can reuse
- Easier to test and maintain

## Future Enhancements

1. **Configurable parsing patterns** - Allow custom regex via environment
2. **Structured agent output** - Support agents that emit JSON instead of text
3. **Event batching** - Buffer events and send in batches
4. **Retry logic** - Exponential backoff for transient failures
5. **Hook metrics** - Track success rates, latencies, patterns
6. **State tracking** - Maintain in-memory state across multiple steps
