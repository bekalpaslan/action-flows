# Implementation Plan: Claude CLI Integration with ActionFlows Dashboard

## Overview

This plan integrates Claude Code CLI with the ActionFlows Dashboard, enabling users to spawn, monitor, and interact with Claude CLI sessions from the dashboard UI. The integration leverages the existing MCP server, hooks infrastructure, WebSocket system, and terminal components. The architecture uses subprocess spawning with Node.js child_process, bidirectional communication via stdin/stdout, session lifecycle management, and real-time output streaming through the dashboard's WebSocket infrastructure.

The integration supports multiple concurrent Claude CLI sessions, each tracked as a dashboard session with full monitoring capabilities (terminal output, file changes, command control), and provides a rich UI for starting Claude CLI with custom flags, selecting working directories, and managing session lifecycle.

## Research Summary

### Claude Code CLI Capabilities

Based on research and CLI help output:

1. **Command Structure**: Claude CLI supports interactive sessions (default) and non-interactive mode (`--print`)
2. **Session Management**: Sessions can be resumed (`--resume`, `--continue`), forked (`--fork-session`), and have unique session IDs (`--session-id`)
3. **Programmatic Control**:
   - Input format options: `text` (default) or `stream-json` for realtime streaming input
   - Output format options: `text`, `json`, or `stream-json` for realtime streaming output
   - Flags: `--no-session-persistence` for ephemeral sessions, `--debug` for debug output
4. **MCP Integration**: Claude CLI loads MCP servers via `--mcp-config` (JSON files or strings)
5. **Tool Control**: Supports `--allowed-tools`, `--disallowed-tools`, `--tools` for fine-grained control
6. **Settings**: Can override settings via `--settings` (file or JSON string)

### Known Challenges (from research)

1. **Node.js Subprocess Issues**: GitHub issues indicate Claude CLI can hang when spawned from Node.js test environments ([Issue #771](https://github.com/anthropics/claude-code/issues/771), [Issue #6775](https://github.com/anthropics/claude-code/issues/6775))
2. **Workarounds**: Use direct `child_process.spawn()` with proper stdio configuration, avoid buffering issues by handling stdout/stderr streams immediately
3. **Platform-Specific**: Windows may require `CREATE_NEW_PROCESS_GROUP` or similar flags (though this is Python-specific; Node.js equivalent needs investigation)

### Existing Integration Points

1. **MCP Server** (packages/mcp-server/): Already provides `check_commands` and `ack_command` tools for ActionFlows → Claude CLI communication
2. **Hooks** (packages/hooks/): Already posts events to backend (SessionStarted, StepCompleted, TerminalOutput, etc.)
3. **Terminal Infrastructure**: xterm.js embedded terminal with real-time output streaming via WebSocket
4. **WebSocket System**: Full bidirectional communication with session subscriptions, event broadcasting
5. **Session Management**: Existing Session model tracks sessionId, user, cwd, status, chains

## Steps

### Step 1: Shared Types for Claude CLI Sessions

**Package:** packages/shared/

**Files:**
- `packages/shared/src/models.ts` (modify)
- `packages/shared/src/events.ts` (modify)
- `packages/shared/src/commands.ts` (modify)

**Changes:**
1. Add `ClaudeCliSession` interface to `models.ts`:
   ```typescript
   export interface ClaudeCliSession {
     id: SessionId;
     pid: number | null; // Process ID of spawned Claude CLI
     status: 'starting' | 'running' | 'paused' | 'stopped' | 'error';
     cwd: string;
     startedAt: Timestamp;
     endedAt?: Timestamp;
     exitCode?: number;
     exitSignal?: string;
     spawnArgs: string[]; // Full command args used to spawn
     metadata?: {
       user?: UserId;
       prompt?: string;
       flags?: Record<string, unknown>;
     };
   }
   ```

2. Add new event types to `events.ts`:
   ```typescript
   export interface ClaudeCliStartedEvent extends BaseEvent {
     type: 'claude-cli:started';
     pid: number;
     cwd: string;
     args: string[];
   }

   export interface ClaudeCliOutputEvent extends BaseEvent {
     type: 'claude-cli:output';
     output: string;
     stream: 'stdout' | 'stderr';
   }

   export interface ClaudeCliExitedEvent extends BaseEvent {
     type: 'claude-cli:exited';
     exitCode: number | null;
     exitSignal: string | null;
     duration: DurationMs;
   }
   ```
   Add these to the `WorkspaceEvent` union type.

3. Add CLI-specific commands to `commands.ts`:
   ```typescript
   export interface ClaudeCliStartCommand extends Command {
     type: 'claude-cli:start';
     cwd: string;
     prompt?: string;
     flags?: string[]; // Additional CLI flags
   }

   export interface ClaudeCliSendInputCommand extends Command {
     type: 'claude-cli:send-input';
     input: string;
   }

   export interface ClaudeCliStopCommand extends Command {
     type: 'claude-cli:stop';
     signal?: 'SIGTERM' | 'SIGINT' | 'SIGKILL';
   }
   ```

**Depends on:** Nothing

**Risks:**
- Breaking change: Adding new event types affects all event handlers
- Mitigation: Use discriminated union types (already in place), handlers ignore unknown events by default

---

### Step 2: Backend Claude CLI Process Manager

**Package:** packages/backend/

**Files:**
- `packages/backend/src/services/claudeCliManager.ts` (create)
- `packages/backend/src/services/claudeCliSession.ts` (create)

**Changes:**

1. Create `claudeCliSession.ts` - Individual session wrapper:
   ```typescript
   import { spawn, ChildProcess } from 'child_process';
   import type { SessionId, ClaudeCliSession } from '@afw/shared';

   export class ClaudeCliSessionProcess {
     private process: ChildProcess | null = null;
     private sessionInfo: ClaudeCliSession;
     private stdoutBuffer: string = '';
     private stderrBuffer: string = '';

     constructor(sessionId: SessionId, cwd: string, args: string[]);

     async start(): Promise<void>; // Spawns claude CLI subprocess
     sendInput(input: string): void; // Writes to stdin
     stop(signal?: NodeJS.Signals): void; // Kills process
     isRunning(): boolean;
     getInfo(): ClaudeCliSession;

     // Event emitters for stdout, stderr, exit
     on(event: 'stdout', handler: (data: string) => void): void;
     on(event: 'stderr', handler: (data: string) => void): void;
     on(event: 'exit', handler: (code: number | null, signal: string | null) => void): void;
   }
   ```

2. Create `claudeCliManager.ts` - Manager for all CLI sessions:
   ```typescript
   import type { SessionId } from '@afw/shared';
   import { ClaudeCliSessionProcess } from './claudeCliSession.js';

   export class ClaudeCliManager {
     private sessions: Map<SessionId, ClaudeCliSessionProcess> = new Map();

     startSession(sessionId: SessionId, cwd: string, args: string[]): ClaudeCliSessionProcess;
     getSession(sessionId: SessionId): ClaudeCliSessionProcess | undefined;
     stopSession(sessionId: SessionId, signal?: NodeJS.Signals): boolean;
     listSessions(): SessionId[];
     stopAllSessions(): void;
   }

   export const claudeCliManager = new ClaudeCliManager();
   ```

**Implementation Details:**
- Use `child_process.spawn('claude', args, { cwd, stdio: ['pipe', 'pipe', 'pipe'] })`
- Handle stdout/stderr with `.on('data')` immediately (avoid buffering issues)
- Handle process exit with `.on('exit')` and `.on('error')`
- Use `escapeShellArg` from `utils/shellEscape.ts` for argument sanitization
- Validate `cwd` with `validatePath` middleware logic
- Broadcast events via storage (for WebSocket propagation)

**Depends on:** Step 1 (shared types)

**Risks:**
- Node.js subprocess hanging (known issue from research)
- Mitigation: Use `.on('data')` handlers immediately, avoid buffering; test with various Claude CLI flags
- Command injection if args not escaped
- Mitigation: Use `escapeShellArg` and validate all user inputs; restrict `cwd` to safe directories

---

### Step 3: Backend API Routes for Claude CLI Control

**Package:** packages/backend/

**Files:**
- `packages/backend/src/routes/claudeCli.ts` (create)
- `packages/backend/src/index.ts` (modify)

**Changes:**

1. Create `routes/claudeCli.ts`:
   ```typescript
   import { Router } from 'express';
   import { claudeCliManager } from '../services/claudeCliManager.js';
   import { validateBody } from '../middleware/validate.js';
   import { writeLimiter } from '../middleware/rateLimit.js';
   import type { SessionId } from '@afw/shared';

   const router = Router();

   // POST /api/claude-cli/start
   // Body: { sessionId, cwd, prompt?, flags?: string[] }
   router.post('/start', writeLimiter, validateBody(startSessionSchema), (req, res) => {
     // Start Claude CLI session
     // Broadcast ClaudeCliStartedEvent via WebSocket
   });

   // POST /api/claude-cli/:sessionId/input
   // Body: { input: string }
   router.post('/:sessionId/input', writeLimiter, validateBody(inputSchema), (req, res) => {
     // Send input to Claude CLI stdin
   });

   // POST /api/claude-cli/:sessionId/stop
   // Body: { signal?: 'SIGTERM' | 'SIGINT' | 'SIGKILL' }
   router.post('/:sessionId/stop', writeLimiter, (req, res) => {
     // Stop Claude CLI session
     // Broadcast ClaudeCliExitedEvent
   });

   // GET /api/claude-cli/:sessionId/status
   router.get('/:sessionId/status', (req, res) => {
     // Return session info (PID, status, uptime)
   });

   // GET /api/claude-cli/sessions
   router.get('/sessions', (req, res) => {
     // List all active Claude CLI sessions
   });

   export default router;
   ```

2. Modify `index.ts`:
   - Import `claudeCliRouter`
   - Add route: `app.use('/api/claude-cli', claudeCliRouter);`
   - Add graceful shutdown: `claudeCliManager.stopAllSessions()` in shutdown handler

3. Create Zod schemas in `schemas/api.ts`:
   ```typescript
   export const startSessionSchema = z.object({
     sessionId: z.string(),
     cwd: z.string(),
     prompt: z.string().optional(),
     flags: z.array(z.string()).optional(),
   });

   export const inputSchema = z.object({
     input: z.string(),
   });
   ```

**Depends on:** Step 2 (Claude CLI manager)

**Risks:**
- Path traversal if `cwd` not validated
- Mitigation: Use `validatePath` middleware to restrict to allowed directories
- Resource exhaustion (too many Claude CLI processes)
- Mitigation: Apply rate limiting; set max concurrent sessions limit (e.g., 5)

---

### Step 4: Backend WebSocket Event Broadcasting for Claude CLI

**Package:** packages/backend/

**Files:**
- `packages/backend/src/services/claudeCliManager.ts` (modify)
- `packages/backend/src/index.ts` (modify)

**Changes:**

1. Modify `claudeCliManager.ts` to accept broadcast callback:
   ```typescript
   export class ClaudeCliManager {
     private broadcastFunction: ((sessionId: SessionId, event: WorkspaceEvent) => void) | null = null;

     setBroadcastFunction(fn: (sessionId: SessionId, event: WorkspaceEvent) => void): void {
       this.broadcastFunction = fn;
     }

     private broadcast(sessionId: SessionId, event: WorkspaceEvent): void {
       if (this.broadcastFunction) {
         this.broadcastFunction(sessionId, event);
       }
     }
   }
   ```

2. In `ClaudeCliSessionProcess`, emit events via manager:
   - On process start: broadcast `ClaudeCliStartedEvent`
   - On stdout data: broadcast `ClaudeCliOutputEvent` (type: 'claude-cli:output', stream: 'stdout')
   - On stderr data: broadcast `ClaudeCliOutputEvent` (type: 'claude-cli:output', stream: 'stderr')
   - On process exit: broadcast `ClaudeCliExitedEvent`

3. Modify `index.ts`:
   - Create `broadcastClaudeCliEvent` function (similar to `broadcastTerminalEvent`)
   - Call `claudeCliManager.setBroadcastFunction(broadcastClaudeCliEvent)` after server starts

**Depends on:** Step 3 (API routes), Step 2 (manager), Step 1 (event types)

**Risks:**
- High-frequency stdout/stderr events may flood WebSocket
- Mitigation: Implement buffering/throttling (batch events every 100ms); send diffs instead of full output

---

### Step 5: Frontend Claude CLI Service & Hooks

**Package:** packages/app/

**Files:**
- `packages/app/src/services/claudeCliService.ts` (create)
- `packages/app/src/hooks/useClaudeCliSessions.ts` (create)
- `packages/app/src/hooks/useClaudeCliControl.ts` (create)

**Changes:**

1. Create `services/claudeCliService.ts`:
   ```typescript
   import type { SessionId, ClaudeCliSession } from '@afw/shared';

   export class ClaudeCliService {
     private baseUrl: string;

     async startSession(sessionId: SessionId, cwd: string, prompt?: string, flags?: string[]): Promise<void>;
     async sendInput(sessionId: SessionId, input: string): Promise<void>;
     async stopSession(sessionId: SessionId, signal?: string): Promise<void>;
     async getSessionStatus(sessionId: SessionId): Promise<ClaudeCliSession>;
     async listSessions(): Promise<SessionId[]>;
   }

   export const claudeCliService = new ClaudeCliService('http://localhost:3001');
   ```

2. Create `hooks/useClaudeCliSessions.ts`:
   ```typescript
   import { useState, useEffect } from 'react';
   import { useWebSocket } from './useWebSocket';
   import type { ClaudeCliSession, SessionId } from '@afw/shared';

   export function useClaudeCliSessions(): {
     sessions: Map<SessionId, ClaudeCliSession>;
     startSession: (sessionId: SessionId, cwd: string, prompt?: string, flags?: string[]) => Promise<void>;
     stopSession: (sessionId: SessionId) => Promise<void>;
     getSession: (sessionId: SessionId) => ClaudeCliSession | undefined;
   } {
     const [sessions, setSessions] = useState<Map<SessionId, ClaudeCliSession>>(new Map());
     const { addEventListener } = useWebSocket();

     // Listen for ClaudeCliStartedEvent, ClaudeCliExitedEvent
     // Update sessions map

     return { sessions, startSession, stopSession, getSession };
   }
   ```

3. Create `hooks/useClaudeCliControl.ts`:
   ```typescript
   import { useCallback } from 'react';
   import { claudeCliService } from '../services/claudeCliService';
   import type { SessionId } from '@afw/shared';

   export function useClaudeCliControl(sessionId: SessionId) {
     const sendInput = useCallback(async (input: string) => {
       await claudeCliService.sendInput(sessionId, input);
     }, [sessionId]);

     const stop = useCallback(async () => {
       await claudeCliService.stopSession(sessionId);
     }, [sessionId]);

     return { sendInput, stop };
   }
   ```

**Depends on:** Step 4 (WebSocket events), Step 3 (API routes)

**Risks:**
- Race conditions if multiple components start/stop sessions concurrently
- Mitigation: Use atomic operations; backend should validate session ownership before actions

---

### Step 6: Frontend Claude CLI Terminal Component

**Package:** packages/app/

**Files:**
- `packages/app/src/components/ClaudeCliTerminal/ClaudeCliTerminal.tsx` (create)
- `packages/app/src/components/ClaudeCliTerminal/ClaudeCliStartDialog.tsx` (create)

**Changes:**

1. Create `ClaudeCliTerminal.tsx`:
   ```typescript
   import React, { useEffect, useRef } from 'react';
   import { Terminal as XTerm } from 'xterm';
   import { FitAddon } from '@xterm/addon-fit';
   import 'xterm/css/xterm.css';
   import { useWebSocket } from '../../hooks/useWebSocket';
   import { useClaudeCliControl } from '../../hooks/useClaudeCliControl';
   import type { SessionId, ClaudeCliOutputEvent } from '@afw/shared';

   interface ClaudeCliTerminalProps {
     sessionId: SessionId;
   }

   export function ClaudeCliTerminal({ sessionId }: ClaudeCliTerminalProps) {
     const xtermRef = useRef<XTerm | null>(null);
     const { addEventListener } = useWebSocket();
     const { sendInput, stop } = useClaudeCliControl(sessionId);

     // Initialize xterm.js with stdin enabled (interactive)
     // Listen for ClaudeCliOutputEvent via WebSocket
     // Write output to terminal
     // On user input: call sendInput()

     return (
       <div className="claude-cli-terminal">
         {/* Terminal container */}
         {/* Control buttons: Stop, Clear, Export */}
       </div>
     );
   }
   ```

2. Create `ClaudeCliStartDialog.tsx`:
   ```typescript
   import React, { useState } from 'react';
   import type { SessionId } from '@afw/shared';
   import { useClaudeCliSessions } from '../../hooks/useClaudeCliSessions';

   interface ClaudeCliStartDialogProps {
     onClose: () => void;
   }

   export function ClaudeCliStartDialog({ onClose }: ClaudeCliStartDialogProps) {
     const [cwd, setCwd] = useState('');
     const [prompt, setPrompt] = useState('');
     const [flags, setFlags] = useState<string[]>([]);
     const { startSession } = useClaudeCliSessions();

     const handleStart = async () => {
       const sessionId = crypto.randomUUID() as SessionId;
       await startSession(sessionId, cwd, prompt, flags);
       onClose();
     };

     return (
       <dialog className="claude-cli-start-dialog">
         {/* Form: CWD input, Prompt textarea, Flags checkboxes */}
         {/* Start button, Cancel button */}
       </dialog>
     );
   }
   ```

**Depends on:** Step 5 (frontend services/hooks)

**Risks:**
- Terminal input not properly forwarded to Claude CLI stdin
- Mitigation: Test interactive prompts; ensure newline characters are sent correctly
- UI performance issues if output rate is high
- Mitigation: Use xterm.js buffering; throttle writes

---

### Step 7: Frontend Dashboard UI Integration

**Package:** packages/app/

**Files:**
- `packages/app/src/components/AppContent.tsx` (modify)
- `packages/app/src/components/SessionTree/SessionTree.tsx` (modify)
- `packages/app/src/components/Terminal/TerminalTabs.tsx` (modify)

**Changes:**

1. Modify `AppContent.tsx`:
   - Add "Start Claude CLI" button in main toolbar/menu
   - On click: open `ClaudeCliStartDialog`
   - After session starts: add tab to `TerminalTabs` with `ClaudeCliTerminal` component

2. Modify `SessionTree.tsx`:
   - Show Claude CLI sessions alongside ActionFlows sessions
   - Use distinct icon/badge (e.g., "🤖 Claude CLI")
   - Right-click context menu: Stop, View Terminal

3. Modify `TerminalTabs.tsx`:
   - Support multiple terminal types: `actionflows` (existing) or `claude-cli`
   - Render `ClaudeCliTerminal` component for CLI sessions
   - Show session type in tab label

**Depends on:** Step 6 (terminal component)

**Risks:**
- UI clutter if too many sessions are active
- Mitigation: Add session limit (e.g., max 5 Claude CLI sessions); show warning before starting more
- Confusing UX distinguishing ActionFlows sessions vs Claude CLI sessions
- Mitigation: Use clear visual indicators (icons, colors, labels)

---

### Step 8: Backend MCP Configuration for Claude CLI Sessions

**Package:** packages/backend/

**Files:**
- `packages/backend/src/services/claudeCliManager.ts` (modify)

**Changes:**

1. Modify `ClaudeCliSessionProcess.start()` to auto-configure MCP server:
   - Generate MCP config JSON pointing to dashboard's MCP server:
     ```json
     {
       "mcpServers": {
         "actionflows-dashboard": {
           "command": "node",
           "args": ["<path-to-mcp-server>/dist/index.js"],
           "env": {
             "AFW_BACKEND_URL": "http://localhost:3001"
           }
         }
       }
     }
     ```
   - Pass config via `--mcp-config` flag: `--mcp-config '${JSON.stringify(mcpConfig)}'`
   - This enables Claude CLI to use `check_commands` and `ack_command` tools

2. Store MCP config path/string in `ClaudeCliSession.metadata`

**Depends on:** Step 2 (CLI manager)

**Risks:**
- MCP server path resolution (where is mcp-server package installed?)
- Mitigation: Use environment variable `AFW_MCP_SERVER_PATH` or detect via `require.resolve('@afw/mcp-server')`
- MCP server not running or unreachable
- Mitigation: Test connection before spawning Claude CLI; log errors if MCP tools fail

---

### Step 9: Testing & Validation

**Package:** packages/backend/, packages/app/

**Files:**
- `packages/backend/src/__tests__/claudeCliManager.test.ts` (create)
- `packages/backend/src/__tests__/integration-claudeCli.test.ts` (create)
- `test/e2e/claude-cli-integration.spec.ts` (create)

**Changes:**

1. Create unit tests for `claudeCliManager.test.ts`:
   - Test process spawning, input sending, stopping
   - Mock `child_process.spawn` to avoid actual subprocess
   - Verify event broadcasting

2. Create integration tests for `integration-claudeCli.test.ts`:
   - Test full API flow: POST /start → POST /input → POST /stop
   - Verify WebSocket events are broadcast
   - Test session cleanup on process exit

3. Create E2E test for `claude-cli-integration.spec.ts`:
   - Launch dashboard
   - Start Claude CLI session from UI
   - Send prompt via terminal
   - Verify output appears in terminal
   - Stop session
   - Verify session cleanup

**Depends on:** All previous steps

**Risks:**
- E2E tests may be flaky if Claude CLI takes too long to respond
- Mitigation: Use timeouts and retries; mock Claude CLI responses for deterministic testing
- Tests may spawn actual Claude CLI processes (slow, requires API key)
- Mitigation: Use mock subprocess for unit/integration tests; E2E tests can use `--no-session-persistence` flag

---

### Step 10: Documentation & Configuration

**Package:** Root, packages/

**Files:**
- `README.md` (modify)
- `packages/backend/README.md` (modify)
- `packages/mcp-server/README.md` (modify)
- `.env.example` (create/modify)

**Changes:**

1. Update root `README.md`:
   - Add "Claude CLI Integration" section
   - Explain how to start Claude CLI from dashboard
   - Document configuration options (max sessions, MCP server path)

2. Update `packages/backend/README.md`:
   - Document `/api/claude-cli` endpoints
   - Explain WebSocket events for Claude CLI
   - Document environment variables

3. Update `packages/mcp-server/README.md`:
   - Explain how MCP server is auto-configured for Claude CLI sessions
   - Document `check_commands` and `ack_command` usage

4. Create/modify `.env.example`:
   ```
   AFW_CLAUDE_CLI_MAX_SESSIONS=5
   AFW_MCP_SERVER_PATH=/path/to/mcp-server/dist/index.js
   AFW_CLAUDE_CLI_PATH=/path/to/claude (optional, defaults to 'claude' in PATH)
   ```

**Depends on:** All implementation steps

**Risks:**
- Documentation may become outdated as implementation evolves
- Mitigation: Update docs alongside code changes; add automated doc checks

---

## Dependency Graph

```
Step 1 (shared types)
  ↓
Step 2 (backend CLI manager) ──→ Step 8 (MCP config)
  ↓
Step 3 (backend API routes)
  ↓
Step 4 (WebSocket broadcasting)
  ↓
Step 5 (frontend services/hooks)
  ↓
Step 6 (frontend terminal component)
  ↓
Step 7 (UI integration)
  ↓
Step 9 (testing) ←─────────────────┘
  ↓
Step 10 (documentation)
```

Steps 1-7 are sequential (each depends on previous). Step 8 can be done in parallel with Step 3-7 (depends only on Step 2). Step 9 requires all implementation steps. Step 10 is final documentation pass.

---

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Node.js subprocess hanging (known GitHub issues) | HIGH - Claude CLI sessions may become unresponsive | Use immediate `.on('data')` handlers for stdout/stderr; test with various Claude CLI flags; implement watchdog timer to detect hangs |
| Command injection via unsanitized args/cwd | CRITICAL - Security vulnerability | Use `escapeShellArg` for all args; validate `cwd` with `validatePath`; restrict to allowed directories |
| WebSocket flooding from high-frequency stdout | MEDIUM - Performance degradation | Implement buffering/throttling (batch events every 100ms); use xterm.js built-in buffering |
| Resource exhaustion (too many Claude CLI processes) | HIGH - Server overload | Apply rate limiting; set max concurrent sessions limit (e.g., 5); track memory usage |
| MCP server path resolution issues | MEDIUM - Claude CLI won't have control tools | Use environment variable `AFW_MCP_SERVER_PATH`; fallback to `require.resolve`; test during startup |
| Race conditions in session start/stop | MEDIUM - Duplicate sessions or orphaned processes | Use atomic operations; validate session ownership before actions; lock session during state transitions |
| Platform-specific subprocess issues (Windows) | MEDIUM - Cross-platform compatibility | Test on Windows, macOS, Linux; use platform-agnostic flags; document platform-specific requirements |
| Claude CLI API changes (future breaking changes) | LOW - Integration breaks with new Claude CLI versions | Pin Claude CLI version in docs; monitor GitHub releases; add version detection |
| Terminal input not forwarded correctly | HIGH - Interactive prompts fail | Test with various input types (text, binary choice, code); ensure newlines are sent; handle stdin errors |
| Session cleanup on dashboard crash | MEDIUM - Orphaned Claude CLI processes | Implement process tracking file; add startup orphan detection; use `--no-session-persistence` flag |

---

## Verification

- [ ] Type check passes across all packages (`pnpm type-check`)
- [ ] All existing tests pass (`pnpm test`)
- [ ] New unit tests pass (claudeCliManager, claudeCliSession)
- [ ] New integration tests pass (API routes, WebSocket events)
- [ ] E2E test passes (full user flow: start → interact → stop)
- [ ] Claude CLI sessions appear in dashboard UI
- [ ] Terminal output streams in real-time
- [ ] Input is successfully sent to Claude CLI stdin
- [ ] Sessions stop cleanly (no orphaned processes)
- [ ] MCP server is auto-configured and accessible from Claude CLI
- [ ] Multiple concurrent sessions work without interference
- [ ] WebSocket events are received by frontend
- [ ] Session cleanup occurs on dashboard shutdown
- [ ] Documentation is up-to-date and accurate

---

## Implementation Notes

### Architecture Decisions

1. **Subprocess vs SDK**: Use subprocess spawning (`child_process.spawn`) instead of Claude Agent SDK because:
   - SDK is TypeScript/Python library for embedding Claude logic, not for controlling Claude CLI
   - Subprocess gives full control over CLI lifecycle, stdio, and environment
   - Existing dashboard already has subprocess infrastructure (terminal service)

2. **Session ID Mapping**: Claude CLI generates its own session IDs. Options:
   - **Chosen**: Use dashboard's SessionId as primary key; store Claude CLI's session ID in metadata
   - Alternative: Use Claude CLI's session ID directly (requires parsing from output)
   - Rationale: Dashboard SessionId is generated before spawning, allows pre-allocation of UI resources

3. **Input/Output Handling**: Use `stream-json` mode vs plain text:
   - **Chosen**: Start with plain text mode for simplicity; upgrade to `stream-json` in future iteration
   - Rationale: Plain text easier to implement initially; `stream-json` requires parsing JSON lines (more complex)

4. **MCP Configuration**: Auto-inject vs manual setup:
   - **Chosen**: Auto-inject MCP config via `--mcp-config` flag
   - Rationale: Zero-config experience for users; dashboard controls MCP server lifecycle

### Future Enhancements

1. **Session Resume**: Support `--resume` flag to resume existing Claude CLI sessions
2. **Conversation History**: Capture and display full conversation history (not just terminal output)
3. **Prompt Library**: Pre-defined prompts for common tasks (code review, debugging, refactoring)
4. **Session Templates**: Save session configurations (cwd, flags) as reusable templates
5. **Multi-Agent Orchestration**: Use Claude CLI sessions as subagents in ActionFlows chains
6. **Performance Monitoring**: Track token usage, response times, error rates per Claude CLI session
7. **Advanced Terminal Features**: Search, syntax highlighting, command history, autocomplete
8. **Claude CLI Version Detection**: Automatically detect installed Claude CLI version and adjust flags
9. **Session Persistence**: Save Claude CLI session state to resume after dashboard restart
10. **Collaborative Sessions**: Multiple dashboard users can view/interact with same Claude CLI session

### Research Sources

- [Claude Code CLI Documentation](https://code.claude.com/docs/en/overview)
- [Claude Code GitHub Repository](https://github.com/anthropics/claude-code)
- [Run Claude Code programmatically - Claude Code Docs](https://code.claude.com/docs/en/headless)
- [GitHub Issue #771: Claude Code can't be spawned from Node.js](https://github.com/anthropics/claude-code/issues/771)
- [GitHub Issue #6775: Claude Code hangs when spawned from Node.js test environments](https://github.com/anthropics/claude-code/issues/6775)
- [@anthropic-ai/claude-code - npm](https://www.npmjs.com/package/@anthropic-ai/claude-code)
- [Claude Agent SDK Documentation](https://docs.anthropic.com/en/docs/claude-code/sdk)

---

## Learnings

**Issue:** Initial research revealed Node.js subprocess hanging issues with Claude CLI (GitHub issues #771, #6775).

**Root Cause:** Claude CLI performs shell snapshot on startup which may hang when spawned from Node.js test environments. The issue is specific to certain subprocess configurations (e.g., buffering stdout/stderr instead of streaming).

**Suggestion:** Implement immediate `.on('data')` handlers for stdout/stderr to avoid buffering. Test with various Claude CLI flags to find optimal configuration. Consider adding a watchdog timer to detect hangs (e.g., if no output within 10 seconds, restart process). Document the known issue and workarounds.

**[FRESH EYE]** The existing MCP server infrastructure is perfectly positioned for this integration. The dashboard already has a fully-functional MCP server that provides `check_commands` and `ack_command` tools, which means Claude CLI sessions spawned from the dashboard can immediately interact with the dashboard's control system. This is a major architectural advantage that wasn't explicitly stated in the requirements but emerged from codebase exploration. The hooks package also shows a mature pattern for posting events (SessionStarted, TerminalOutput, etc.), which suggests the integration can leverage these existing event types with minimal new types needed. Finally, the existing terminal infrastructure (xterm.js, WebSocket streaming, TerminalOutputEvent) is already built for exactly this use case — the Claude CLI integration is essentially extending terminal capabilities to support interactive AI sessions instead of just command output.

**[FRESH EYE]** The `--output-format=stream-json` and `--input-format=stream-json` flags in Claude CLI are powerful but under-documented. These enable bidirectional JSON streaming which could allow the dashboard to parse structured responses from Claude CLI (e.g., detecting when Claude is asking a question vs providing output vs executing a tool). This could enable advanced UI features like auto-expanding file changes, inline diffs, and prompt suggestions. Consider this for a future iteration (Phase 2) after basic integration is stable.
