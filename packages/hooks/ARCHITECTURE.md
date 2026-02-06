# ActionFlows Hooks Architecture

## System Overview

Claude Code sends step completion events via SubagentStop hook. The hook captures execution data, parses structured information from agent output, and posts a StepCompletedEvent to the backend dashboard.

```
Claude Code Execution
        ↓
SubagentStop Hook Triggered
        ↓
afw-step-completed.ts receives stdin JSON
        ↓
Validates and parses data
        ↓
POSTs StepCompletedEvent to backend
        ↓
Backend stores in database
        ↓
Dashboard updates in real-time
```

## Data Processing Pipeline

### 1. Input Reception
- Claude Code SubagentStop hook sends JSON to stdin
- Hook data contains: session_id, agent_id, exit_status, duration_ms, output
- Input validated before processing

### 2. Data Extraction

**Automatic Fields** (always available):
- sessionId - from session_id
- duration - from duration_ms
- timestamp - generated current time

**Parsed Fields** (extracted via regex, nullable):
- stepNumber - pattern: "Step N"
- action - pattern: "action/"
- result - pattern: "Result:" or last line
- learning - pattern: "## Learnings" section

**Mapped Fields** (transformed from input):
- status - exit_status mapped to Status enum
- succeeded - computed from status

### 3. Event Construction
Builds StepCompletedEvent with all extracted data

### 4. Transmission
POSTs event to backend /api/events endpoint

### 5. Backend Processing
- Receives and validates event
- Stores in database
- Updates execution state
- Notifies dashboard

## Shared Utilities

### settings.ts
- Reads AFW_BACKEND_URL from environment
- Defaults to http://localhost:3000
- Used by both step-spawned and step-completed hooks

### http.ts
- postEvent(url, event) - POSTs WorkspaceEvent to backend
- 5-second request timeout
- Never throws (silent failure)
- Returns boolean success/failure

### parser.ts
- parseAgentOutput(output) - Main parser
- parseStepNumber, parseAction, parseResult, parseLearning
- Multiple regex patterns with fallbacks
- All return null on no match

## Error Handling Strategy

All errors are non-fatal with silent failure mode:
- Invalid JSON → log error → exit 0
- Invalid structure → log error → exit 0
- Network error → log error → exit 0
- Unexpected error → log error → exit 0

This ensures hook failures don't block Claude Code subprocess.

## Type System

Uses branded types for safety:
- SessionId (string branded)
- StepNumber (number branded)
- Timestamp (string branded)
- DurationMs (number branded)

Factory functions ensure proper type construction:
- brandedTypes.sessionId(str)
- brandedTypes.stepNumber(num)
- brandedTypes.currentTimestamp()
- duration.ms(num)

## Configuration

### Environment Variables
- AFW_BACKEND_URL - Backend endpoint (default: http://localhost:3000)

### Timeouts
- Stdin read: 5 seconds
- HTTP request: 5 seconds

### Hook Execution
- Typical time: 15-250ms
- Memory: ~21MB per invocation
- No persistence between calls

## Deployment Scenarios

### Local Development
- Backend: npm run dev (port 3000)
- ENV: AFW_BACKEND_URL=http://localhost:3000
- Hook connects locally

### Docker Compose
- Backend: http://backend:3000
- ENV: AFW_BACKEND_URL=http://backend:3000
- Container DNS resolves service name

### Kubernetes
- Backend: http://dashboard-backend:3000
- ENV: AFW_BACKEND_URL=http://dashboard-backend:3000
- Service DNS available in cluster

## Event Flow

```
Claude Code Subagent Finishes
  ↓
SubagentStop Hook Fires
  ├─ Receives JSON via stdin
  ├─ Validates structure
  ├─ Parses agent output
  ├─ Maps exit_status
  └─ Constructs event

StepCompletedEvent
  ├─ type: 'step:completed'
  ├─ sessionId: SessionId
  ├─ timestamp: Timestamp
  ├─ stepNumber: StepNumber
  ├─ duration: DurationMs
  ├─ action?: string | null
  ├─ status?: string | null
  ├─ result?: string | null
  ├─ learning?: string | null
  ├─ succeeded: boolean
  └─ outputLength?: number

Backend /api/events
  ├─ Receives POST
  ├─ Validates event
  ├─ Stores in database
  ├─ Updates chain state
  └─ Notifies clients

Dashboard
  ├─ WebSocket notification
  ├─ Fetches event details
  ├─ Re-renders execution view
  └─ Updates timeline
```

## Parsing Strategy

### Regex Patterns (in priority order)

**Step Number**
- Pattern: `/(?:^|\s|##)\s*(?:Step|step)\s+(\d+)/m`
- Matches: "Step 1", "## Step 2", " step 3", etc.

**Action**
- Primary: `/(?:Spawning\s+Step\s+\d+:\s+|Step\s+\d+:\s+)([a-z\-]+)(?:\/)?/i`
- Fallback: `/([a-z\-]+)\/(?:\s|$)/i`
- Matches: "Step 1: code/" or "code/"

**Result**
- Primary: `/(?:^|\n)\s*(?:Result|Summary|Outcome):\s*(.+?)(?:\n|$)/im`
- Fallback: Last line if <200 chars

**Learning**
- Primary: `/(?:^|\n)(?:##|###)\s+(?:Learning|Learnings)[\s\S]*?/im`
- Fallback: `/Agent Learning[\s\S]*?(?:Issue|Suggested fix):/i`

### Graceful Degradation
- All patterns have fallbacks
- No match returns null (not error)
- Event posts even with null fields
- Backend UI handles missing data

## Performance

### Typical Execution Time
- Stdin read: 1-100ms
- JSON parse: <1ms
- Validation: <1ms
- Output parsing: 1-5ms
- Event construction: <1ms
- HTTP POST: 10-200ms
- Total: 15-250ms

### Resource Usage
- Node.js base: ~20MB
- Hook script: ~1MB
- Event JSON: 1-5KB
- Total per call: ~21MB
- No memory leaks (process exits)

## Security Considerations

### Input Validation
- Type checking on all fields
- No arbitrary code execution
- JSON parsing with error handling
- Regex patterns don't have catastrophic backtracking

### Network
- HTTPS support in future
- No authentication in current version
- 5-second timeout prevents hanging
- Silent failure on network errors

### Data Handling
- No sensitive data in logs
- Environment variables used for configuration
- Output truncated for very long agent outputs
- No persistent storage in hook

## Future Enhancements

1. Structured output parsing (JSON from agents)
2. Custom regex patterns via configuration
3. Event batching and buffering
4. Retry logic with exponential backoff
5. Metrics and telemetry collection
6. Offline mode with local queue
7. HTTPS certificate handling
8. Custom event transformations
9. Integration with observability tools
10. Performance optimization and caching
