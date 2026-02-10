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

---

## Appendix: Test Cases

### Test Case 1: Successful Step Completion

#### Input

```json
{
  "session_id": "sess-abc123",
  "agent_id": "agent-xyz789",
  "exit_status": "completed",
  "duration_ms": 5000,
  "output": "Step 1: code/\n\nResult: Implementation complete with 3 files modified"
}
```

#### Expected Output Event

```typescript
{
  type: 'step:completed',
  sessionId: 'sess-abc123',
  timestamp: '2026-02-06T12:34:56.789Z', // Current ISO time
  stepNumber: 1,
  duration: 5000,
  action: 'code',
  status: 'completed',
  result: 'Implementation complete with 3 files modified',
  learning: null,
  succeeded: true,
  outputLength: 108
}
```

#### Run Test

```bash
export AFW_BACKEND_URL=http://localhost:3000

cat << 'EOF' | node dist/afw-step-completed.js
{
  "session_id": "sess-abc123",
  "agent_id": "agent-xyz789",
  "exit_status": "completed",
  "duration_ms": 5000,
  "output": "Step 1: code/\n\nResult: Implementation complete with 3 files modified"
}
EOF
```

---

### Test Case 2: Failed Step with Error Status

#### Input

```json
{
  "session_id": "sess-def456",
  "agent_id": "agent-uv123",
  "exit_status": "error",
  "duration_ms": 2000,
  "output": "Step 2: review/\n\nError: File not found at path/to/file.ts"
}
```

#### Expected Output Event

```typescript
{
  type: 'step:completed',
  sessionId: 'sess-def456',
  timestamp: '2026-02-06T12:35:00.000Z',
  stepNumber: 2,
  duration: 2000,
  action: 'review',
  status: 'failed',
  result: 'Error: File not found at path/to/file.ts',
  learning: null,
  succeeded: false,
  outputLength: 89
}
```

#### Run Test

```bash
export AFW_BACKEND_URL=http://localhost:3000

cat << 'EOF' | node dist/afw-step-completed.js
{
  "session_id": "sess-def456",
  "agent_id": "agent-uv123",
  "exit_status": "error",
  "duration_ms": 2000,
  "output": "Step 2: review/\n\nError: File not found at path/to/file.ts"
}
EOF
```

---

### Test Case 3: Step with Learning Extracted

#### Input

```json
{
  "session_id": "sess-ghi789",
  "agent_id": "agent-mn456",
  "exit_status": "completed",
  "duration_ms": 8000,
  "output": "Step 3: audit/\n\nResult: Security audit complete\n\n## Learnings\n\nThe authentication flow needs to validate JWT expiry before caching tokens. This prevents edge cases where cached tokens persist beyond their validity window."
}
```

#### Expected Output Event

```typescript
{
  type: 'step:completed',
  sessionId: 'sess-ghi789',
  timestamp: '2026-02-06T12:35:10.000Z',
  stepNumber: 3,
  duration: 8000,
  action: 'audit',
  status: 'completed',
  result: 'Security audit complete',
  learning: 'The authentication flow needs to validate JWT expiry before caching tokens. This prevents edge cases where cached tokens persist beyond their validity window.',
  succeeded: true,
  outputLength: 312
}
```

#### Run Test

```bash
export AFW_BACKEND_URL=http://localhost:3000

cat << 'EOF' | node dist/afw-step-completed.js
{
  "session_id": "sess-ghi789",
  "agent_id": "agent-mn456",
  "exit_status": "completed",
  "duration_ms": 8000,
  "output": "Step 3: audit/\n\nResult: Security audit complete\n\n## Learnings\n\nThe authentication flow needs to validate JWT expiry before caching tokens. This prevents edge cases where cached tokens persist beyond their validity window."
}
EOF
```

---

### Test Case 4: Cancelled Step

#### Input

```json
{
  "session_id": "sess-jkl012",
  "agent_id": "agent-pq789",
  "exit_status": "cancelled",
  "duration_ms": 1500,
  "output": "Step 4: test/\n\nCancelled by user"
}
```

#### Expected Output Event

```typescript
{
  type: 'step:completed',
  sessionId: 'sess-jkl012',
  timestamp: '2026-02-06T12:35:15.000Z',
  stepNumber: 4,
  duration: 1500,
  action: 'test',
  status: 'skipped',
  result: 'Cancelled by user',
  learning: null,
  succeeded: false,
  outputLength: 54
}
```

#### Run Test

```bash
export AFW_BACKEND_URL=http://localhost:3000

cat << 'EOF' | node dist/afw-step-completed.js
{
  "session_id": "sess-jkl012",
  "agent_id": "agent-pq789",
  "exit_status": "cancelled",
  "duration_ms": 1500,
  "output": "Step 4: test/\n\nCancelled by user"
}
EOF
```

---

### Test Case 5: Output with Multiple Sections (Complex Parsing)

#### Input

```json
{
  "session_id": "sess-mno345",
  "agent_id": "agent-rs012",
  "exit_status": "completed",
  "duration_ms": 12000,
  "output": "Spawning Step 5: notify/\n\n## Execution Summary\nStarted at 2026-02-06T12:30:00Z\nCompleted at 2026-02-06T12:30:12Z\n\n## Result\nPosted notification to 5 channels successfully\n\n## Learnings\nSlack rate limiting should be respected with exponential backoff when posting to multiple channels concurrently."
}
```

#### Expected Output Event

```typescript
{
  type: 'step:completed',
  sessionId: 'sess-mno345',
  timestamp: '2026-02-06T12:35:20.000Z',
  stepNumber: 5,
  duration: 12000,
  action: 'notify',
  status: 'completed',
  result: 'Posted notification to 5 channels successfully',
  learning: 'Slack rate limiting should be respected with exponential backoff when posting to multiple channels concurrently.',
  succeeded: true,
  outputLength: 329
}
```

#### Run Test

```bash
export AFW_BACKEND_URL=http://localhost:3000

cat << 'EOF' | node dist/afw-step-completed.js
{
  "session_id": "sess-mno345",
  "agent_id": "agent-rs012",
  "exit_status": "completed",
  "duration_ms": 12000,
  "output": "Spawning Step 5: notify/\n\n## Execution Summary\nStarted at 2026-02-06T12:30:00Z\nCompleted at 2026-02-06T12:30:12Z\n\n## Result\nPosted notification to 5 channels successfully\n\n## Learnings\nSlack rate limiting should be respected with exponential backoff when posting to multiple channels concurrently."
}
EOF
```

---

### Test Case 6: Minimal Output (Graceful Degradation)

#### Input

```json
{
  "session_id": "sess-pqr678",
  "agent_id": "agent-tu345",
  "exit_status": "completed",
  "duration_ms": 3000,
  "output": "Done"
}
```

#### Expected Output Event

```typescript
{
  type: 'step:completed',
  sessionId: 'sess-pqr678',
  timestamp: '2026-02-06T12:35:25.000Z',
  stepNumber: 1,              // Falls back to 1 (no Step N found)
  duration: 3000,
  action: null,               // No action pattern found
  status: 'completed',
  result: 'Done',             // Last line used as result
  learning: null,             // No learning section
  succeeded: true,
  outputLength: 4
}
```

#### Run Test

```bash
export AFW_BACKEND_URL=http://localhost:3000

cat << 'EOF' | node dist/afw-step-completed.js
{
  "session_id": "sess-pqr678",
  "agent_id": "agent-tu345",
  "exit_status": "completed",
  "duration_ms": 3000,
  "output": "Done"
}
EOF
```

---

### Test Case 7: Invalid Input (JSON Parse Error)

#### Input

```
This is not JSON at all!
```

#### Expected Behavior

- Logs: `Failed to parse JSON from stdin`
- Exit code: 0
- Event: Not sent to backend

#### Run Test

```bash
export AFW_BACKEND_URL=http://localhost:3000

echo "This is not JSON at all!" | node dist/afw-step-completed.js
```

---

### Test Case 8: Missing Required Field

#### Input

```json
{
  "session_id": "sess-stu901",
  "agent_id": "agent-vw678",
  "exit_status": "completed"
}
```

#### Expected Behavior

- Logs: `Invalid hook data format`
- Exit code: 0
- Event: Not sent to backend

#### Run Test

```bash
export AFW_BACKEND_URL=http://localhost:3000

cat << 'EOF' | node dist/afw-step-completed.js
{
  "session_id": "sess-stu901",
  "agent_id": "agent-vw678",
  "exit_status": "completed"
}
EOF
```

---

### Test Case 9: Network Failure (Backend Unreachable)

#### Input

```json
{
  "session_id": "sess-vwx234",
  "agent_id": "agent-yz901",
  "exit_status": "completed",
  "duration_ms": 5000,
  "output": "Step 1: code/"
}
```

#### Expected Behavior

- Set `AFW_BACKEND_URL` to invalid URL (e.g., `http://unreachable:9999`)
- Logs: `Error posting event: [network error]`
- Exit code: 0 (silent failure)
- Event: Not sent (network failure)

#### Run Test

```bash
export AFW_BACKEND_URL=http://unreachable:9999

cat << 'EOF' | node dist/afw-step-completed.js
{
  "session_id": "sess-vwx234",
  "agent_id": "agent-yz901",
  "exit_status": "completed",
  "duration_ms": 5000,
  "output": "Step 1: code/"
}
EOF
```

---

## Automated Test Script

Save as `test-hook.sh`:

```bash
#!/bin/bash

set -e

export AFW_BACKEND_URL=http://localhost:3000

echo "Testing afw-step-completed hook..."
echo ""

# Test 1: Successful completion
echo "Test 1: Successful completion"
echo '{"session_id":"test-1","agent_id":"a1","exit_status":"completed","duration_ms":5000,"output":"Step 1: code/\n\nResult: Success"}' | \
  node dist/afw-step-completed.js && \
  echo "✓ PASS" || echo "✗ FAIL"
echo ""

# Test 2: Failed step
echo "Test 2: Failed step"
echo '{"session_id":"test-2","agent_id":"a2","exit_status":"error","duration_ms":2000,"output":"Step 2: review/\n\nError: File not found"}' | \
  node dist/afw-step-completed.js && \
  echo "✓ PASS" || echo "✗ FAIL"
echo ""

# Test 3: Cancelled step
echo "Test 3: Cancelled step"
echo '{"session_id":"test-3","agent_id":"a3","exit_status":"cancelled","duration_ms":1000,"output":"Cancelled"}' | \
  node dist/afw-step-completed.js && \
  echo "✓ PASS" || echo "✗ FAIL"
echo ""

# Test 4: Invalid JSON
echo "Test 4: Invalid JSON (expect error log)"
echo 'not json' | \
  node dist/afw-step-completed.js && \
  echo "✓ PASS (silent failure)" || echo "✗ FAIL"
echo ""

echo "All tests completed!"
```

Run with:
```bash
chmod +x test-hook.sh
./test-hook.sh
```

---

## Verification Checklist

After running tests, verify:

- [ ] Hook exits with code 0 in all cases
- [ ] Valid events reach backend `/api/events` endpoint
- [ ] Invalid inputs produce appropriate error logs
- [ ] Network failures don't crash the hook
- [ ] Parsed fields match expected values
- [ ] Status enum values are correct
- [ ] Step numbers parse correctly
- [ ] Learning sections extract properly
- [ ] Graceful degradation works (missing fields = null)
- [ ] Silent failure mode functions correctly

---

## Appendix: Parsing Pattern Details

### Detailed Regex Patterns and Examples

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
