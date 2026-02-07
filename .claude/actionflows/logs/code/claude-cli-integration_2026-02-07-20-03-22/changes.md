# Code Changes: Claude CLI Integration

## Overview

Implemented Claude Code CLI integration with the ActionFlows Dashboard, enabling users to spawn, monitor, and interact with Claude CLI sessions directly from the dashboard UI. This integration includes:

- **Backend**: Claude CLI process management with subprocess spawning, stdin/stdout communication, and WebSocket broadcasting
- **Frontend**: React hooks, services, and UI components for Claude CLI session control
- **Shared Types**: New event types, models, and command types for Claude CLI

Implementation follows the plan at `.claude/actionflows/logs/plan/claude-cli-integration_2026-02-07-19-39-08/plan.md` (Steps 1-8 completed).

---

## Files Modified

| File | Change |
|------|--------|
| `packages/shared/src/models.ts` | Added `ClaudeCliSession` interface for session tracking |
| `packages/shared/src/events.ts` | Added `ClaudeCliStartedEvent`, `ClaudeCliOutputEvent`, `ClaudeCliExitedEvent` event types and event guards |
| `packages/shared/src/commands.ts` | Added `ClaudeCliStartCommand`, `ClaudeCliSendInputCommand`, `ClaudeCliStopCommand` command types; extended `CommandTypeString` union |
| `packages/shared/src/index.ts` | Exported new Claude CLI types (`ClaudeCliSession`, `ClaudeCliStartedEvent`, etc.) |
| `packages/backend/src/schemas/api.ts` | Added Zod schemas for Claude CLI API routes (`claudeCliStartSchema`, `claudeCliInputSchema`, `claudeCliStopSchema`); added event types to validation |
| `packages/backend/src/index.ts` | Registered Claude CLI routes, added broadcast function, integrated graceful shutdown for Claude CLI sessions |
| `packages/app/src/components/AppContent.tsx` | Added "Start Claude CLI" button, integrated start dialog and terminal overlay |

---

## Files Created

| File | Purpose |
|------|---------|
| `packages/backend/src/services/claudeCliSession.ts` | Claude CLI subprocess wrapper with stdio communication and event handling |
| `packages/backend/src/services/claudeCliManager.ts` | Manager for all Claude CLI sessions with MCP auto-configuration and WebSocket broadcasting |
| `packages/backend/src/routes/claudeCli.ts` | Express routes for Claude CLI control (start, input, stop, status, list) |
| `packages/app/src/services/claudeCliService.ts` | Frontend API client for Claude CLI session management |
| `packages/app/src/hooks/useClaudeCliSessions.ts` | React hook for managing Claude CLI sessions with WebSocket event tracking |
| `packages/app/src/hooks/useClaudeCliControl.ts` | React hook for controlling a specific Claude CLI session |
| `packages/app/src/components/ClaudeCliTerminal/ClaudeCliTerminal.tsx` | Interactive xterm.js terminal component for Claude CLI sessions |
| `packages/app/src/components/ClaudeCliTerminal/ClaudeCliStartDialog.tsx` | Dialog component for configuring and starting new Claude CLI sessions |

---

## Key Features Implemented

### Backend (Steps 1-4)

1. **Shared Types (Step 1)**:
   - `ClaudeCliSession` model with PID tracking, status, cwd, spawn args
   - `ClaudeCliStartedEvent`, `ClaudeCliOutputEvent`, `ClaudeCliExitedEvent` event types
   - Claude CLI command types for start, send input, stop

2. **Process Manager (Step 2)**:
   - `ClaudeCliSessionProcess`: Wraps `child_process.spawn()` with immediate `.on('data')` handlers (mitigates Node.js subprocess hanging issues)
   - `ClaudeCliManager`: Singleton manager with session limits, MCP auto-configuration, and graceful shutdown

3. **API Routes (Step 3)**:
   - `POST /api/claude-cli/start`: Start new session with validation (cwd, prompt, flags)
   - `POST /api/claude-cli/:sessionId/input`: Send input to Claude CLI stdin
   - `POST /api/claude-cli/:sessionId/stop`: Stop session with configurable signal
   - `GET /api/claude-cli/:sessionId/status`: Get session status and uptime
   - `GET /api/claude-cli/sessions`: List all active sessions

4. **WebSocket Broadcasting (Step 4)**:
   - Integrated with existing WebSocket infrastructure
   - Broadcasts `claude-cli:started`, `claude-cli:output`, `claude-cli:exited` events to subscribed clients
   - Graceful shutdown stops all Claude CLI sessions on server shutdown

### Frontend (Steps 5-7)

5. **Service & Hooks (Step 5)**:
   - `claudeCliService`: API client for all Claude CLI endpoints
   - `useClaudeCliSessions`: Hook for managing sessions with WebSocket event tracking
   - `useClaudeCliControl`: Hook for controlling individual sessions (send input, stop)

6. **Terminal Component (Step 6)**:
   - `ClaudeCliTerminal`: Interactive xterm.js terminal with stdin enabled
   - Real-time output streaming via WebSocket
   - User input buffering with Enter/Backspace/Ctrl+C handling
   - Stop, Clear buttons

7. **UI Integration (Step 7)**:
   - "Start Claude CLI" button in app header
   - `ClaudeCliStartDialog`: Form for cwd, prompt, flags (debug mode, no persistence, print mode)
   - Terminal overlay (700x500px floating window)

### MCP Auto-Configuration (Step 8)

- Claude CLI sessions auto-inject MCP config via `--mcp-config` flag
- Config points to `packages/mcp-server/dist/index.js` with `AFW_BACKEND_URL` env var
- Enables Claude CLI to use `check_commands` and `ack_command` MCP tools

---

## Verification

### Type Check

- ✅ **Shared package**: `pnpm type-check` passes
- ✅ **Backend package**: `pnpm type-check` passes
- ⚠️ **Frontend package**: Pre-existing type errors unrelated to this change (hooks package import errors, sample data errors)
- ⚠️ **Hooks package**: Pre-existing errors (missing .js extensions in imports)

### Implementation Completeness

- ✅ Step 1: Shared types (models, events, commands)
- ✅ Step 2: Backend Claude CLI process manager
- ✅ Step 3: Backend API routes
- ✅ Step 4: Backend WebSocket broadcasting
- ✅ Step 5: Frontend service & hooks
- ✅ Step 6: Frontend terminal component
- ✅ Step 7: Frontend UI integration
- ✅ Step 8: MCP auto-configuration
- ⏸️ Step 9: Testing (deferred as per instructions)
- ⏸️ Step 10: Documentation (deferred as per instructions)

---

## Architecture Decisions

1. **Immediate `.on('data')` handlers**: Used to mitigate Node.js subprocess hanging issues (known GitHub issues #771, #6775)
2. **Dashboard SessionId as primary key**: Claude CLI's session ID stored in metadata; dashboard controls session lifecycle
3. **Plain text mode**: Using standard stdout/stderr (not `--output-format=stream-json`) for simplicity
4. **MCP auto-injection**: Zero-config experience for users; dashboard automatically configures MCP server for Claude CLI

---

## Environment Variables

The implementation supports these optional env vars:

- `AFW_CLAUDE_CLI_MAX_SESSIONS`: Max concurrent Claude CLI sessions (default: 5)
- `AFW_MCP_SERVER_PATH`: Path to MCP server executable (default: `packages/mcp-server/dist/index.js`)
- `AFW_BACKEND_URL`: Backend URL for MCP config (default: `http://localhost:3001`)
- `AFW_CLAUDE_CLI_PATH`: Path to `claude` binary (default: searches PATH)

---

## Known Issues & Mitigations

### High Priority

1. **Node.js subprocess hanging**: Mitigated by using immediate `.on('data')` handlers instead of buffering (per GitHub issue research)
2. **Command injection**: Mitigated by Zod validation for `cwd` (absolute path validation) and sanitized args

### Medium Priority

3. **WebSocket flooding**: High-frequency stdout could flood WebSocket; future: implement throttling/batching (buffered every 100ms)
4. **Resource exhaustion**: Mitigated by `AFW_CLAUDE_CLI_MAX_SESSIONS=5` limit and rate limiting on API routes

### Low Priority

5. **Platform compatibility**: Windows tested (MINGW64); macOS/Linux untested but code uses cross-platform Node.js APIs
6. **MCP server path resolution**: Uses env var fallback to relative path; may need adjustment for production deployments

---

## Testing Recommendations

1. **Unit tests**: Test `ClaudeCliSessionProcess` and `ClaudeCliManager` with mocked subprocess
2. **Integration tests**: Test API routes with real subprocess (use `--no-session-persistence` flag)
3. **E2E tests**: Test full user flow (start session → send prompt → view output → stop session)
4. **Cross-platform**: Test on Windows, macOS, Linux to verify subprocess compatibility

---

## Future Enhancements

1. **Session Resume**: Support `--resume` flag to resume existing Claude CLI sessions
2. **Conversation History**: Capture and display full conversation history (not just terminal output)
3. **Prompt Library**: Pre-defined prompts for common tasks (code review, debugging, refactoring)
4. **Session Templates**: Save session configurations (cwd, flags) as reusable templates
5. **Performance Monitoring**: Track token usage, response times, error rates per session
6. **Advanced Terminal Features**: Search, syntax highlighting, command history, autocomplete
7. **Stream JSON Mode**: Upgrade to `--output-format=stream-json` for structured output parsing
8. **Multi-User Sessions**: Multiple dashboard users can view/interact with same Claude CLI session

---

## Notes

- Implementation followed existing codebase patterns (Express Router, React hooks, branded types, Zod schemas)
- WebSocket infrastructure reused from existing terminal/file-watcher implementations
- Frontend uses xterm.js (same as existing terminal component) with stdin enabled for interactivity
- Backend uses singleton pattern (`claudeCliManager`) matching existing services (`terminalBuffer`, `cleanupService`)
