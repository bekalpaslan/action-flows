# ActionFlows Dashboard MCP Server

MCP server that provides control command tools for Claude orchestrators to interact with the ActionFlows Dashboard.

## Tools

### `check_commands`

Poll for pending control commands issued through the Dashboard UI.

**Input:**
- `session_id` (string, required): Claude session ID

**Output:**
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

**Command Types:**
- `pause`: Pause chain execution
- `resume`: Resume paused chain
- `cancel`: Cancel chain execution
- `retry`: Retry a failed step
- `skip`: Skip a step
- `abort`: Emergency abort

### `ack_command`

Acknowledge that a command has been processed.

**Input:**
- `command_id` (string, required): Command ID from `check_commands`
- `result` (string, optional): Result message
- `error` (string, optional): Error message if processing failed

**Output:**
```json
{
  "acknowledged": true,
  "command_id": "cmd-1234567890",
  "result": "Paused after step 3"
}
```

## Configuration

Set the backend URL via environment variable:

```bash
export AFW_BACKEND_URL=http://localhost:3001
```

Default: `http://localhost:3001`

## Usage in Claude Desktop

Add to `claude_desktop_config.json`:

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

## Integration with Orchestrator

The orchestrator should poll for commands during execution:

```markdown
## Execution Phase

After each step completion:
1. Poll: `check_commands(session_id)`
2. Process commands:
   - `pause`: Wait for `resume` command
   - `resume`: Continue execution
   - `cancel`: Abort remaining steps
   - `retry`: Respawn failed step with original inputs
   - `skip`: Skip step and mark as skipped
3. Acknowledge: `ack_command(command_id)` for each processed
4. Continue execution
```

## Development

```bash
# Build
pnpm run build

# Watch mode
pnpm run dev

# Start
pnpm run start
```

## Error Handling

The server gracefully degrades when the backend is unreachable:
- `check_commands` returns empty array on error
- `ack_command` returns error object with details

This ensures the orchestrator continues functioning even if the Dashboard is offline.
