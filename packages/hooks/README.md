# @afw/hooks - ActionFlows Claude Code Hook Scripts

Hook scripts that integrate Claude Code's execution lifecycle with the ActionFlows Dashboard backend event system.

## Hooks

### `afw-step-completed` - SubagentStop Hook

Triggered when Claude Code completes a subagent step execution.

#### Input (via stdin)

Receives SubagentStop hook data as JSON:

```json
{
  "session_id": "unique-session-identifier",
  "agent_id": "agent-instance-id",
  "exit_status": "completed" | "error" | "cancelled",
  "duration_ms": 12345,
  "output": "agent's final output text"
}
```

#### Processing

1. **Validates** hook data has all required fields
2. **Extracts automatic fields**:
   - `sessionId` - from `session_id`
   - `stepNumber` - parsed from output, falls back to 1
   - `duration` - from `duration_ms`
3. **Parses agent output** to extract:
   - `stepNumber` - regex pattern matching "Step 1", "## Step 2", etc.
   - `action` - regex pattern matching "action/" or step context
   - `result` - regex matching "Result:", "Summary:", or last meaningful line
   - `learning` - regex matching "## Learnings" section or "Agent Learning" pattern
4. **Maps exit status** to Status enum:
   - `"completed"` → `Status.COMPLETED`
   - `"error"` → `Status.FAILED`
   - `"cancelled"` → `Status.SKIPPED`
5. **Posts StepCompletedEvent** to backend `/api/events` endpoint

#### Configuration

- **Backend URL**: Read from `AFW_BACKEND_URL` environment variable
- **Defaults to**: `http://localhost:3000` if not set

#### Error Handling

- **Silent failure mode**: Exits with code 0 regardless of success
- **Non-blocking**: POST failures don't affect hook execution
- **Graceful degradation**: Missing parsed fields are nullable (null or undefined)

#### Event Type

Sends a `StepCompletedEvent` to the backend with:

```typescript
interface StepCompletedEvent extends BaseEvent {
  type: 'step:completed';
  stepNumber: StepNumber;
  duration: DurationMs;
  action?: string | null;           // Parsed from output
  status?: StatusString | null;      // Mapped from exit_status
  result?: unknown | null;           // Parsed from output
  learning?: string | null;          // Parsed from output
  succeeded: boolean;                // Computed from status
  outputLength?: number;             // Computed from output
}
```

## Utilities

### `settings.ts`

Provides hook configuration management:

- `readSettings()` - Loads settings from environment variables
- `validateSettings(settings)` - Validates required settings are present

### `http.ts`

Handles HTTP communication with backend:

- `postEvent(backendUrl, event)` - POSTs WorkspaceEvent to backend
  - Implements 5-second timeout
  - Returns boolean success/failure
  - Never throws (silent failure)

### `parser.ts`

Parses Claude Code agent output to extract structured data:

- `parseAgentOutput(output)` - Main parsing function returning `ParsedAgentOutput`
- `parseStepNumber(output)` - Extracts step number from text
- `parseAction(output)` - Extracts action name
- `parseResult(output)` - Extracts result/summary
- `parseLearning(output)` - Extracts learning section

All parsing functions return `null` if pattern not found (graceful degradation).

## Building

```bash
# Build hook scripts
npm run build

# Type checking
npm run type-check

# Watch mode (development)
npm run dev
```

## Integration

1. Set `AFW_BACKEND_URL` environment variable
2. Register `afw-step-completed` as SubagentStop hook in Claude Code
3. Hook receives stdin data when subagent completes
4. Events are automatically POSTed to dashboard backend

## Example Usage

```bash
# Simulate hook execution
echo '{"session_id":"sess-123","agent_id":"agent-456","exit_status":"completed","duration_ms":5000,"output":"Step 1 complete: code/"}' | \
  node dist/afw-step-completed.js
```

## Debugging

Hook logs errors to stderr:

- JSON parse failures
- Invalid hook data format
- Network/POST failures
- Unexpected errors

All errors are non-fatal (exit code 0) to prevent blocking Claude Code.
