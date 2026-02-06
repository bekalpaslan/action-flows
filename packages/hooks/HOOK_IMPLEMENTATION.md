# Hook Scripts Implementation Guide

## Overview

This package contains hook scripts for the ActionFlows system that integrate with Claude Code to track step execution events.

## Hook Scripts

### 1. afw-step-spawned.ts (PreToolUse Hook)

**Purpose**: Captures when Claude Code is about to spawn a subagent step

**Trigger**: PreToolUse hook event

**Input Format** (stdin):
```json
{
  "session_id": "string",
  "tool_name": "Task",
  "tool_input": {
    "description": "Step N: Description",
    "prompt": "Full prompt text...",
    "model": "haiku|sonnet|opus"
  }
}
```

**Processing**:
1. Validates JSON structure
2. Extracts sessionId from `session_id`
3. Extracts action from prompt (regex: `/\.?\.?\.?\/actions\/([a-z\-]+)\//i`)
4. Extracts model from `tool_input.model`
5. Extracts description from `tool_input.description`
6. Parses stepNumber from description (pattern: `Step N`)
7. Creates StepSpawnedEvent
8. POSTs to backend

**Output Event**:
```typescript
interface StepSpawnedEvent {
  type: 'step:spawned';
  sessionId: SessionId;
  timestamp: Timestamp;
  stepNumber: StepNumber;        // Parsed from description
  action?: string | null;         // Extracted from prompt
  model?: ModelString | null;     // From tool_input
  description?: string | null;    // Preserved
  inputs?: Record<string, unknown> | null;
  waitsFor?: StepNumber[] | null;
}
```

**Error Handling**: Silent failure - always exits with code 0

### 2. afw-step-completed.ts (SubagentStop Hook)

**Purpose**: Captures when a subagent completes execution

**Trigger**: SubagentStop hook event

**Input Format** (stdin):
```json
{
  "session_id": "string",
  "agent_id": "string",
  "exit_status": "completed|error|cancelled",
  "duration_ms": number,
  "output": "agent output text"
}
```

**Processing**:
1. Validates JSON structure
2. Parses agent output for:
   - Step number (Step N patterns)
   - Action name (action/ patterns)
   - Result/summary
   - Learning sections
3. Maps exit_status to Status enum
4. Creates StepCompletedEvent
5. POSTs to backend

## Utilities

### http.ts

Handles HTTP POST requests to backend API:

```typescript
export async function postEvent(
  backendUrl: string,
  event: WorkspaceEvent
): Promise<boolean>
```

**Features**:
- Accepts any WorkspaceEvent type
- 5-second timeout via AbortSignal
- Silent failure (returns false on error)
- Never throws exceptions

### settings.ts

Reads configuration from settings file and environment variables:

```typescript
export function readSettings(): HookSettings

interface HookSettings {
  backendUrl: string;           // Default: http://localhost:3001
  user?: string;                // Optional
  enabled: boolean;             // Default: true
}
```

**Configuration Sources** (in priority order):
1. `.claude/settings.json` file
2. Environment variables:
   - `AFW_BACKEND_URL`
   - `AFW_USER`
   - `AFW_ENABLED`
3. Hardcoded defaults

**Settings File Location**: `.claude/settings.json` in workspace root

**Example Settings File**:
```json
{
  "backendUrl": "http://localhost:3001",
  "user": "developer-name",
  "enabled": true
}
```

### parser.ts

Parses agent output to extract structured data:

```typescript
export function parseAgentOutput(output: string): ParsedAgentOutput

interface ParsedAgentOutput {
  stepNumber?: number | null;
  action?: string | null;
  result?: string | null;
  learning?: string | null;
}
```

**Parsing Patterns**:
- Step numbers: `Step N` (e.g., "Step 1", "## Step 2 complete")
- Actions: `action/` (e.g., ".../actions/review/")
- Results: "Result:", "Summary:", "Outcome:" headers
- Learning: "## Learnings" or "## Learning" sections

## Configuration

### Environment Variables

```bash
# Backend URL (default: http://localhost:3001)
export AFW_BACKEND_URL=http://localhost:3001

# User identifier (optional)
export AFW_USER=developer-name

# Enable/disable hooks (default: true)
export AFW_ENABLED=true
```

### Settings File

Create `.claude/settings.json` in workspace root:

```json
{
  "backendUrl": "http://localhost:3001",
  "user": "your-name",
  "enabled": true
}
```

## Building

```bash
# Build TypeScript
npm run build

# Type check only
npm run type-check
```

Output: `dist/` directory with compiled JavaScript

## Integration with Claude Code

Configure Claude Code to use these hooks:

1. **PreToolUse Hook** → `afw-step-spawned.js`
   - Runs before spawning a step
   - Captures initial step data

2. **SubagentStop Hook** → `afw-step-completed.js`
   - Runs after step completes
   - Captures results and output

## Event Flow

```
User Request
    ↓
Orchestrator compiles chain
    ↓
For each step:
    ├─ afw-step-spawned (PreToolUse)
    │  └─ POSTs StepSpawnedEvent
    ├─ Claude Code runs step
    └─ afw-step-completed (SubagentStop)
       └─ POSTs StepCompletedEvent
    ↓
Backend receives events
    ↓
Events stored in database
    ↓
Dashboard visualizes execution
```

## Backend API Endpoint

**POST** `/api/events`

**Content-Type**: `application/json`

**Payload**: Any WorkspaceEvent type

**Success Response**: 2xx status code

**Timeout**: 5 seconds per request

## Error Scenarios

| Scenario | Behavior |
|----------|----------|
| Invalid JSON | Log error, exit 0 |
| Missing fields | Log error, exit 0 |
| Invalid action path | action = null |
| No step number in description | stepNumber = 0 |
| Network timeout | Log error, exit 0 |
| Backend returns error | Log error, exit 0 |
| Settings file missing | Use defaults, proceed |

**Key Principle**: All errors are logged but silent. Hooks never block Claude Code execution.

## Debugging

### Enable Debug Logging

Logs appear on stderr. Common scenarios:

```bash
# Missing settings file (uses defaults)
# Hook tries to connect to http://localhost:3001

# Invalid backend URL
Failed to post event: Connection refused

# Invalid JSON from stdin
Failed to parse JSON from stdin

# Missing required fields
Invalid hook data format
```

### Manual Testing

Test afw-step-spawned with stdin:

```bash
cat << 'JSON' | npx ts-node src/afw-step-spawned.ts
{
  "session_id": "test-123",
  "tool_name": "Task",
  "tool_input": {
    "description": "Step 1: Analysis",
    "prompt": "Read ./actions/analyze/agent.md",
    "model": "haiku"
  }
}
JSON
```

## Testing Checklist

- [ ] Settings file is read correctly
- [ ] Environment variable overrides work
- [ ] Hook data validation catches errors
- [ ] Action extraction from prompt works
- [ ] Step number extraction from description works
- [ ] Events POST to backend successfully
- [ ] Timeouts are respected (5s max)
- [ ] Errors are logged but silent
- [ ] Exit code is always 0

## Dependencies

- `@afw/shared` - Type definitions and utilities
- `typescript` - For compilation
- `@types/node` - Node.js type definitions

## File Structure

```
packages/hooks/
├── src/
│   ├── afw-step-spawned.ts       (NEW)
│   ├── afw-step-completed.ts     (existing)
│   └── utils/
│       ├── http.ts               (updated)
│       ├── settings.ts           (updated)
│       └── parser.ts             (existing)
├── dist/                          (compiled output)
├── package.json
├── tsconfig.json
└── HOOK_IMPLEMENTATION.md         (this file)
```

## Performance Characteristics

- **Startup time**: < 100ms
- **Parsing time**: < 10ms
- **Network request**: 5s timeout
- **Memory usage**: < 10MB
- **CPU impact**: Minimal (I/O bound)

## Security Considerations

- Hooks have access to cwd and environment
- No credentials stored in hook scripts
- Backend URL read from settings file (not hardcoded)
- All input validated before processing
- No shell command execution

## Future Enhancements

- [ ] Batch event posting
- [ ] Local event queue if backend unavailable
- [ ] Metrics collection
- [ ] Compressed event payloads
- [ ] Webhook retry logic
- [ ] Event filtering configuration
