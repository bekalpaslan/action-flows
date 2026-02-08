# Orchestrator Integration Guide

This guide explains how to integrate ActionFlows Dashboard control features into your orchestrator (e.g., `.claude/CLAUDE.md` in ActionFlows projects).

## Overview

The Dashboard provides **bidirectional control** of chain execution through MCP tools. The orchestrator polls for commands issued through the Dashboard UI and responds accordingly.

## Prerequisites

1. **MCP Server Running**: The ActionFlows Dashboard MCP server must be configured in Claude Desktop
2. **Backend Running**: The Dashboard backend must be accessible at the configured URL
3. **Session ID**: The orchestrator must know its session ID (from environment or configuration)

## Integration Steps

### Step 1: Configure MCP Server

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "actionflows-dashboard": {
      "command": "node",
      "args": ["/path/to/ActionFlowsDashboard/packages/mcp-server/dist/index.js"],
      "env": {
        "AFW_BACKEND_URL": "http://localhost:3001"
      }
    }
  }
}
```

### Step 2: Update Orchestrator Execution Phase

Modify your orchestrator's execution logic to poll for commands after each step:

#### Before (without Dashboard control):

```markdown
## Execution Phase

For each step in chain:
1. Spawn agent
2. Wait for completion
3. Continue to next step
```

#### After (with Dashboard control):

```markdown
## Execution Phase

For each step in chain:
1. **Check for control commands** → `check_commands(session_id)`
2. **Process pending commands**:
   - `pause`: Wait for `resume` command
   - `resume`: Continue execution
   - `cancel`: Abort remaining steps, mark chain as cancelled
   - `retry`: Respawn failed step with original inputs
   - `skip`: Mark step as skipped, continue to next
3. **Acknowledge processed commands** → `ack_command(command_id)`
4. Spawn agent (if not cancelled/paused)
5. Wait for completion
6. Continue to next step
```

### Step 3: Command Processing Logic

#### Pause Command

```
1. Poll: check_commands(session_id)
2. Receive: { type: "pause", id: "cmd-123" }
3. Acknowledge: ack_command("cmd-123", result: "Paused after step 3")
4. Enter wait loop:
   - Poll every 5 seconds for resume command
   - Display: "Chain paused. Waiting for resume..."
5. Receive: { type: "resume", id: "cmd-456" }
6. Acknowledge: ack_command("cmd-456", result: "Resumed from step 4")
7. Continue execution
```

#### Cancel Command

```
1. Poll: check_commands(session_id)
2. Receive: { type: "cancel", id: "cmd-789" }
3. Acknowledge: ack_command("cmd-789", result: "Cancelled chain, preserving completed steps")
4. Mark remaining steps as skipped
5. Mark chain as cancelled
6. Exit execution loop
```

#### Retry Command

```
1. Poll: check_commands(session_id)
2. Receive: { type: "retry", id: "cmd-101", target: { stepNumber: 3 } }
3. Acknowledge: ack_command("cmd-101", result: "Retrying step 3")
4. Find step 3 in chain
5. Respawn agent with original inputs
6. Update step status to "in_progress"
7. Wait for completion
8. Continue execution
```

#### Skip Command

```
1. Poll: check_commands(session_id)
2. Receive: { type: "skip", id: "cmd-202", target: { stepNumber: 5 } }
3. Acknowledge: ack_command("cmd-202", result: "Skipped step 5")
4. Mark step 5 as "skipped"
5. Continue to next step
```

### Step 4: Error Handling

The MCP tools gracefully degrade when the backend is unavailable:

```typescript
// check_commands returns empty array on error
{
  "commands": [],
  "error": "Backend unreachable"
}

// Orchestrator should:
// 1. Log the error (optional)
// 2. Continue execution as if no commands were pending
// 3. Do NOT fail the entire chain due to Dashboard unavailability
```

## Example Integration

Here's a pseudo-code example of the execution loop with control integration:

```python
def execute_chain(chain):
    session_id = get_session_id()

    for step in chain.steps:
        # Check for control commands
        commands = check_commands(session_id)

        for cmd in commands:
            if cmd.type == "pause":
                ack_command(cmd.id, result=f"Paused after step {step.number - 1}")
                wait_for_resume(session_id)

            elif cmd.type == "cancel":
                ack_command(cmd.id, result="Cancelled chain")
                mark_remaining_steps_skipped(chain, step.number)
                return  # Exit execution

            elif cmd.type == "retry" and cmd.target.stepNumber == step.number:
                ack_command(cmd.id, result=f"Retrying step {step.number}")
                # Fall through to respawn agent below

            elif cmd.type == "skip" and cmd.target.stepNumber == step.number:
                ack_command(cmd.id, result=f"Skipped step {step.number}")
                mark_step_skipped(step)
                continue  # Skip to next step

        # Execute step (if not skipped)
        if step.status != "skipped":
            spawn_agent(step)
            wait_for_completion(step)

def wait_for_resume(session_id):
    while True:
        commands = check_commands(session_id)
        for cmd in commands:
            if cmd.type == "resume":
                ack_command(cmd.id, result="Resumed execution")
                return
        sleep(5)  # Poll every 5 seconds
```

## Testing

### Manual Test

1. **Start a chain** in Claude
2. **Open Dashboard** and attach the session
3. **Click Pause** while chain is running
4. **Verify** orchestrator pauses after current step
5. **Click Resume** and verify execution continues
6. **Click Cancel** and verify chain aborts cleanly

### Automated Test

See `test/e2e/control-flow.test.ts` for automated testing examples.

## Troubleshooting

### Commands Not Being Processed

**Symptom**: Clicking Pause/Cancel has no effect

**Causes**:
1. MCP server not configured correctly
2. Orchestrator not polling `check_commands`
3. Backend unreachable from MCP server

**Solution**:
```bash
# Check MCP server logs
tail -f ~/Library/Logs/Claude/mcp*.log

# Verify backend is accessible
curl http://localhost:3001/api/sessions/test-session/commands

# Test MCP tool manually in Claude
check_commands(session_id: "your-session-id")
```

### Commands Expire Before Processing

**Symptom**: "Command expired" message in Dashboard

**Cause**: Orchestrator not polling frequently enough (commands expire after 5 minutes)

**Solution**:
- Poll after each step completion
- Add polling during long-running steps if possible
- Reduce command expiration time in backend if needed

### Pause Doesn't Stop Current Step

**Expected**: Pause waits for current step to complete gracefully

**Not a Bug**: The pause command completes the current step before pausing. This is intentional to avoid corrupting agent state.

**Workaround**: Use Cancel if you need to stop immediately (current step will be interrupted).

## Advanced: Graceful vs Immediate Pause

The Dashboard supports two pause modes:

```typescript
// Graceful pause (default): Complete current step before pausing
{ type: "pause", payload: { graceful: true } }

// Immediate pause: Interrupt current step
{ type: "pause", payload: { graceful: false } }
```

Implement immediate pause if your agents support mid-execution interruption.

## Command Reference

### check_commands

**Input**:
```json
{
  "session_id": "abc123"
}
```

**Output**:
```json
{
  "session_id": "abc123",
  "commands": [
    {
      "id": "cmd-1234567890",
      "type": "pause",
      "target": null
    },
    {
      "id": "cmd-0987654321",
      "type": "retry",
      "target": { "stepNumber": 3 }
    }
  ]
}
```

### ack_command

**Input**:
```json
{
  "command_id": "cmd-1234567890",
  "result": "Paused after step 3",
  "error": null
}
```

**Output**:
```json
{
  "acknowledged": true,
  "command_id": "cmd-1234567890"
}
```

## See Also

- [MCP Server README](../packages/mcp-server/README.md)
- [Control Interface Spec](../openspec/changes/add-actionflows-dashboard/specs/control-interface/spec.md)
- [API Reference](../api/API_REFERENCE.md)
