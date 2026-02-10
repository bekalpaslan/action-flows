# Backend CLI Execution Architecture Analysis

**Aspect:** CLI session execution model and WebSocket event flow
**Scope:** Backend CLI/session routes, services, WebSocket communication, and data flow
**Date:** 2026-02-10
**Agent:** analyze/

---

## 1. Architecture Overview

The backend CLI execution system is composed of **three core layers**:

1. **HTTP Routes** (`routes/claudeCli.ts`) - REST API for CLI session control
2. **Session Manager** (`services/claudeCliManager.ts`) - Singleton service managing multiple CLI sessions
3. **Process Wrapper** (`services/claudeCliSession.ts`) - Individual subprocess lifecycle and stdio communication

**Key Architectural Decisions:**
- **Backend-only execution**: CLI processes spawn on backend using Node.js `child_process.spawn`
- **Bidirectional stdio**: Uses `--print --input-format stream-json --output-format stream-json` for piped JSON communication
- **WebSocket event broadcasting**: All CLI output streams as `claude-cli:output` events to subscribed frontend clients
- **Session-storage integration**: CLI sessions create `Session` records in storage (GET /api/sessions compatibility)

---

## 2. Session Creation and Lifecycle

### HTTP API Flow

**POST /api/claude-cli/start** (routes/claudeCli.ts:21-70)

**Request:**
```typescript
{
  sessionId: SessionId,
  cwd: string,
  prompt?: string,        // Initial prompt (sent via stdin, NOT CLI arg)
  flags?: string[],       // Validated whitelist
  projectId?: ProjectId,  // For usage tracking
  envVars?: Record<string, string>,
  mcpConfigPath?: string, // Auto-generated if not provided
  user?: string
}
```

**Security validations:**
1. Environment variable key/value validation (ProjectDetector rules)
2. CWD path validation (no symlink escapes, no system directories)
3. Flags whitelist validation (prevent command injection)
4. Session limit enforcement (default: 5 concurrent sessions)

**Process:**
1. Validate inputs (envVars, cwd, flags)
2. Call `claudeCliManager.startSession()`
3. Update project lastUsedAt (fire-and-forget)
4. Return session info

---

### Session Manager (claudeCliManager.ts)

**Singleton service** managing all CLI sessions. Key responsibilities:

**MCP Auto-Configuration:**
- Generates MCP config JSON if not provided
- Points to `packages/mcp-server/dist/index.js` with `AFW_BACKEND_URL` env var
- Enables ActionFlows Dashboard MCP server in Claude CLI

**Process Spawning:**
```typescript
args: [
  '--print',                      // Non-interactive output mode
  '--input-format', 'stream-json', // Accept JSON on stdin
  '--output-format', 'stream-json', // Emit JSON on stdout
  '--include-partial-messages',    // Stream chunks immediately
  '--verbose',
  '--dangerously-skip-permissions',
  '--no-session-persistence',
  '--mcp-config', mcpConfig
]
```

**CRITICAL NOTE (line 161-163):** Initial prompt is **NOT** passed as CLI argument. Claude CLI's `--print` mode with an argument is one-shot and rejects stdin follow-ups with "Prompt is too long". Instead, the prompt is sent as the **first stdin message** after process starts.

**Event Registration:**
- `stdout` → broadcasts `claude-cli:output` event (stream: 'stdout')
- `stderr` → broadcasts `claude-cli:output` event (stream: 'stderr')
- `exit` → broadcasts `claude-cli:exited` event, updates storage, removes from sessions map
- `error` → logs error, removes from sessions map

**Storage Integration (lines 298-323):**
Creates a `Session` record in storage:
```typescript
Session {
  id: sessionId,
  user: userId (from param or env),
  cwd: cwd,
  hostname: os.hostname(),
  platform: os.platform(),
  chains: [],
  status: 'in_progress',
  startedAt: now,
  metadata: { type: 'claude-cli', pid: info.pid }
}
```

Also stores `session:started` event for audit trail.

---

### Process Wrapper (claudeCliSession.ts)

**Per-session subprocess wrapper** with stdio management.

**Spawn Configuration:**
```typescript
spawn('claude', args, {
  cwd: session.cwd,
  stdio: ['pipe', 'pipe', 'pipe'],  // stdin, stdout, stderr piped
  shell: false,                      // No shell (security)
  env: { ...spawnEnv, CI: '1' }      // Force non-interactive
})
```

**Stream-JSON Parsing (lines 60-114):**

Critical implementation for handling Claude CLI's JSONL output format:

1. **Buffering:** Accumulates chunks until complete JSONL lines (newline-delimited)
2. **Line Processing:** Splits on `\n`, keeps last incomplete line in buffer
3. **JSON Parsing:** Parses each complete line as JSON
4. **Content Extraction:**
   - `{ type: 'assistant', message: { content: "..." } }` → extract content
   - `{ type: 'result', result: "..." }` → extract result
   - `{ type: 'error', error: "..." }` → extract error with `[ERROR]` prefix
5. **Fallback:** On parse failure, passes raw text
6. **Safety:** 1MB buffer limit to prevent memory exhaustion

**Stdin Communication (sendInput, lines 198-228):**

Formats user input as stream-json message:
```typescript
JSON.stringify({
  type: 'user',
  message: { role: 'user', content: input.trim() }
}) + '\n'
```

**Security validations:**
- Max 100KB input size
- No null bytes (subprocess safety)
- Stdin writability check

---

## 3. WebSocket Event Broadcasting

### Event Flow Architecture

**Broadcast Registration (index.ts:338):**
```typescript
claudeCliManager.setBroadcastFunction(broadcastClaudeCliEvent);
```

**Event Types:**

| Event Type | Trigger | Payload Fields |
|------------|---------|----------------|
| `claude-cli:started` | Process spawns | pid, cwd, args, prompt, timestamp |
| `claude-cli:output` | stdout/stderr data | output (parsed content), stream ('stdout'/'stderr'), timestamp |
| `claude-cli:exited` | Process exits | exitCode, exitSignal, duration, timestamp |

**Broadcasting Function (index.ts:227-239):**
```typescript
function broadcastClaudeCliEvent(sessionId, event) {
  const message = JSON.stringify({
    type: 'event',
    sessionId,
    payload: event
  });
  clientRegistry.broadcastToSession(sessionId, message);
}
```

**Client Subscription Model:**
- Clients subscribe to specific sessions via WebSocket message: `{ type: 'subscribe', sessionId }`
- Only subscribed clients receive CLI output events for that session
- Validation: Session must exist, user must have access (if session has user requirement)

---

### WebSocket Message Handling (ws/handler.ts)

**Inbound Message Types:**

| Type | Purpose | Handler |
|------|---------|---------|
| `subscribe` | Subscribe to session events | Validates session + user access, registers subscription |
| `unsubscribe` | Unsubscribe from session | Removes subscription |
| `input` | Send input to CLI stdin | Pipes to `cliSession.sendInput()` or queues if no CLI session |
| `ping` | Keepalive | Responds with `pong` |

**Input Piping (lines 109-130):**

Critical bidirectional flow:
1. Frontend sends `{ type: 'input', sessionId, payload: userInput }`
2. Backend checks if CLI session exists and is running
3. **Primary path:** Pipe directly to `cliSession.sendInput()` (stdin)
4. **Fallback path:** Queue input in storage if no active CLI session

This enables **real-time stdin injection** for interactive CLI prompts.

---

## 4. Session Routes Integration

### Regular Session Routes (routes/sessions.ts)

**Key insight:** CLI sessions **ARE** regular sessions. They appear in:
- `GET /api/sessions` - Lists all sessions (CLI sessions have `metadata.type: 'claude-cli'`)
- `GET /api/sessions/:id` - Get session details (includes CLI metadata)
- `PUT /api/sessions/:id` - Update session status

**Session Structure:**
```typescript
{
  id: sessionId,
  user?: UserId,
  cwd: string,
  hostname?: string,
  platform?: string,
  chains: Chain[],
  status: 'pending' | 'in_progress' | 'completed' | 'failed',
  startedAt: Timestamp,
  endedAt?: Timestamp,
  metadata?: { type: 'claude-cli', pid: number }
}
```

**Lifecycle:**
- **Created:** When CLI session starts (claudeCliManager line 298-323)
- **Updated:** On CLI exit (claudeCliManager line 238-262)
- **Status:** `in_progress` → `completed` (exit code 0) or `failed` (exit code non-zero)

---

### Input Queue Routes

**POST /api/sessions/:id/input** (sessions.ts:292-328)

Alternative to WebSocket input. Queues user input for later retrieval.

**GET /api/sessions/:id/input** (sessions.ts:382-477)

**Long-polling endpoint** for hooks to retrieve queued input:
- `timeout=0` → immediate return
- `timeout=60000` → poll every 500ms for up to 60s
- Returns first queued input and clears queue
- Updates session `conversationState` to `idle`

**Usage:** Stop hook can call this to get Dashboard-submitted input.

---

## 5. Data Flow Diagrams

### CLI Session Creation Flow

```
Frontend (HTTP)
  → POST /api/claude-cli/start { sessionId, cwd, prompt, ... }
    → routes/claudeCli.ts (validate)
      → claudeCliManager.startSession()
        → validateCwd() + validateFlags()
        → generateMcpConfig()
        → new ClaudeCliSessionProcess()
        → session.start() [spawn('claude', args)]
          → Register event handlers (stdout, stderr, exit)
          → storage.setSession(Session) [creates Session record]
          → storage.addEvent(session:started)
          → session.sendInput(prompt) [send initial prompt via stdin]
          → broadcastClaudeCliEvent(claude-cli:started)
            → clientRegistry.broadcastToSession()
              → WebSocket clients receive event
```

---

### CLI Output Streaming Flow

```
Claude CLI Process
  → stdout.on('data', chunk)
    → parseStreamJson(chunk) [accumulate JSONL lines]
      → Parse: { type: 'assistant', message: { content: "..." } }
        → Extract content text
          → stdout handler: broadcastClaudeCliEvent()
            → WebSocket message: { type: 'event', sessionId, payload: { type: 'claude-cli:output', output, stream: 'stdout' } }
              → Frontend receives event
                → Updates terminal UI or chat view
```

---

### Input Piping Flow (WebSocket)

```
Frontend (WebSocket)
  → { type: 'input', sessionId, payload: userInput }
    → ws/handler.ts handleWebSocket()
      → claudeCliManager.getSession(sessionId)
        → if (session.isRunning())
          → session.sendInput(userInput)
            → Format as stream-json: { type: 'user', message: { role: 'user', content } }
            → process.stdin.write(json + '\n')
              → Claude CLI receives user message
                → Processes input
                  → Emits response to stdout (cycles back to output streaming flow)
```

---

## 6. Storage Architecture

### Session Storage

**MemoryStorage (storage/memory.ts):**
- `sessions: Map<SessionId, Session>`
- `events: Map<SessionId, WorkspaceEvent[]>`
- Synchronous operations

**RedisStorage (storage/redis.ts):**
- `session:{sessionId}` keys → JSON serialized Session
- `events:{sessionId}` keys → JSON array of events
- Pub/sub for event broadcasting across backend instances
- Asynchronous operations (Promise-based)

**Storage Interface Duality:**
All methods return `T | Promise<T>` for transparent sync/async switching.

---

### Event Storage

**addEvent(sessionId, event):**
- Appends event to session's event array
- Used for audit trail and replay
- CLI events stored:
  - `session:started` (on CLI spawn)
  - `session:ended` (on CLI exit)
  - All CLI lifecycle events broadcasted via WebSocket

**getEvents(sessionId):**
- Returns all events for session
- Used by frontend for event history replay

---

## 7. Critical Implementation Details

### Stream-JSON Parser Rationale

**Why JSONL parsing is critical:**

Claude CLI's `--output-format stream-json` emits **newline-delimited JSON** (JSONL):
- Each line is a complete JSON object
- Lines may arrive in chunks (incomplete)
- Must buffer until `\n` to parse

**Buffer Management:**
- `stdoutBuffer` accumulates partial lines
- Split on `\n`, keep last incomplete line
- Parse complete lines immediately
- 1MB max buffer to prevent memory exhaustion

**Content Extraction:**
- Extracts clean text from JSON structure
- Removes protocol overhead for frontend display
- Fallback to raw text on parse errors

---

### Security Validations

**CWD Validation (claudeCliManager.ts:67-97):**
1. Resolve realpath (prevent symlink escapes)
2. Normalize path (prevent `..` traversal)
3. Check denied paths (system directories blacklist)

**Flags Validation (claudeCliManager.ts:102-122):**
1. Must start with `-` (valid flag format)
2. No shell metacharacters: `;`, `&`, `|`, `` ` ``, `$`, `()`, `{}`, etc.
3. Whitelist: `--debug`, `--no-session-persistence`, `--print`, `--mcp-config`, `--fast`, `--help`, `--version`

**Input Validation (claudeCliSession.ts:208-215):**
1. Max 100KB input size
2. No null bytes (subprocess safety)
3. Stdin writability check

---

### Process Lifecycle Safety

**Graceful Shutdown (index.ts:372-405):**
1. Stop server heartbeat
2. Stop cleanup service
3. Shutdown file watchers
4. **Stop all Claude CLI sessions** (`claudeCliManager.stopAllSessions()`)
5. Close WebSocket connections
6. Disconnect from Redis

**Session Cleanup on Exit:**
- Event handler auto-removes session from manager map
- Storage update with final status
- WebSocket broadcast of exit event

---

## 8. Key Findings Summary

| Aspect | Current Implementation | Notes |
|--------|------------------------|-------|
| **Process Model** | Backend-spawned `child_process.spawn('claude', ...)` | No terminal emulation (pty) - pure stdio pipes |
| **Communication** | Stream-JSON bidirectional (stdin/stdout) | JSON messages, not raw terminal escape codes |
| **Event Types** | `claude-cli:started`, `claude-cli:output`, `claude-cli:exited` | WebSocket broadcast to subscribed clients |
| **Session Storage** | Integrated with regular Session records | `metadata.type: 'claude-cli'` distinguishes CLI sessions |
| **Input Handling** | Direct stdin piping (WebSocket) + queue fallback (HTTP) | Real-time bidirectional flow |
| **Security** | CWD validation, flags whitelist, input size limits | Prevents command injection, path traversal, resource exhaustion |
| **MCP Integration** | Auto-generated MCP config pointing to `mcp-server/` | Enables Dashboard MCP tools in CLI |
| **Stream Parsing** | Custom JSONL parser with buffering | Extracts clean text from JSON protocol |

---

## 9. Adaptation Requirements for Chat UI Migration

**Current State:**
- CLI output is **parsed JSON** (clean text content)
- Events carry `output: string` field (already extracted from JSON)
- No terminal escape codes (not using pty)

**For Chat UI:**

### Option A: Direct Event Consumption
- Frontend listens to `claude-cli:output` events
- Display `output` field directly as chat message chunks
- Group consecutive chunks by `stream` type (stdout vs stderr)

### Option B: Message Aggregation Backend Layer
- Add service layer to aggregate chunks into complete messages
- Detect message boundaries (e.g., complete sentences, tool use blocks)
- Emit higher-level events: `claude-cli:message-chunk`, `claude-cli:message-complete`

### Required Changes:

1. **Message Formatting:**
   - Current: Raw text chunks
   - Needed: Structured chat messages (role, content, metadata)
   - Recommendation: Parse stream-json messages **before** broadcasting
   - Extract: `{ role: 'assistant', content: '...', type: 'text' | 'tool_use' }`

2. **Event Schema Extension:**
   ```typescript
   ClaudeCliMessageEvent {
     type: 'claude-cli:message',
     sessionId: SessionId,
     message: {
       role: 'user' | 'assistant',
       content: string,
       messageType: 'text' | 'tool_use' | 'tool_result',
       metadata?: { model?: string, stopReason?: string }
     },
     timestamp: Timestamp
   }
   ```

3. **State Management:**
   - Track conversation history per session
   - Store in `Session.metadata.conversationHistory`
   - Enable message replay on frontend reconnect

4. **Streaming Control:**
   - Current: Immediate chunk broadcast
   - Needed: Buffer until message boundaries
   - Challenge: Determine when assistant message is "complete"
   - Solution: Watch for `type: 'result'` messages (indicates turn completion)

---

## Recommendations

### 1. Message-Level Abstraction (High Priority)

**Problem:** Current output events are raw text chunks, not structured chat messages.

**Solution:**
- Extend `parseStreamJson()` to emit message-level events
- Create `ClaudeCliMessageEvent` type (extends `BaseEvent`)
- Add message aggregation service (`services/claudeCliMessageAggregator.ts`)

**Implementation Steps:**
1. Parse stream-json `type` field to detect message boundaries
2. Buffer chunks until message complete (e.g., `type: 'result'`)
3. Broadcast complete messages as structured events
4. Store conversation history in session metadata

---

### 2. Conversation History Storage (Medium Priority)

**Problem:** No persistent conversation history per CLI session.

**Solution:**
- Add `conversationHistory: ChatMessage[]` to `Session` type
- Store on `claude-cli:message` events
- Enable frontend reconnect/replay

**Schema:**
```typescript
interface ChatMessage {
  role: 'user' | 'assistant',
  content: string,
  timestamp: Timestamp,
  metadata?: { model?: string, stopReason?: string }
}
```

---

### 3. Tool Use Event Handling (Medium Priority)

**Problem:** Tool use messages need special rendering in chat UI.

**Solution:**
- Detect `tool_use` content blocks in stream-json
- Emit dedicated events: `claude-cli:tool-use-start`, `claude-cli:tool-use-complete`
- Include tool name, input, result in event payload

---

### 4. Error and Stop Reason Propagation (Low Priority)

**Problem:** No visibility into stop reasons (e.g., max_tokens, end_turn, tool_use).

**Solution:**
- Parse stream-json `stop_reason` field
- Include in message metadata
- Display in chat UI (e.g., "Response stopped: max tokens reached")

---

### 5. Multi-Session WebSocket Optimization (Low Priority)

**Problem:** Each WebSocket client subscribes to one session at a time.

**Solution:**
- Allow multi-session subscriptions per client
- Reduce WebSocket connection overhead
- Enable side-by-side session monitoring

---

### 6. Stream-JSON Protocol Documentation (High Priority)

**Problem:** No documented specification for Claude CLI's stream-json format.

**Action:**
- Document observed message types: `assistant`, `result`, `error`, `tool_use`
- Create schema validation (Zod)
- Add contract format for stream-json messages

---

## Appendix: File Inventory

| File Path | Purpose | Lines |
|-----------|---------|-------|
| `packages/backend/src/routes/claudeCli.ts` | REST API for CLI session control | 190 |
| `packages/backend/src/services/claudeCliManager.ts` | Singleton session manager | 390 |
| `packages/backend/src/services/claudeCliSession.ts` | Per-session subprocess wrapper | 292 |
| `packages/backend/src/routes/sessions.ts` | Regular session routes (CLI sessions appear here) | 546 |
| `packages/backend/src/ws/handler.ts` | WebSocket message handling + broadcasting | 205 |
| `packages/backend/src/index.ts` | Server initialization, broadcast registration | 412 |
| `packages/shared/src/events.ts` | Event type definitions (lines 412-448: CLI events) | 718 |
| `packages/shared/src/models.ts` | Session + ClaudeCliSession types | ~450 |
| `packages/backend/src/storage/index.ts` | Storage interface (session/event storage) | 151 |

**Total Lines Analyzed:** ~3,354 lines across 9 files

---

## Appendix: WebSocket Event Examples

### claude-cli:started
```json
{
  "type": "event",
  "sessionId": "session-1234567890-abc",
  "payload": {
    "type": "claude-cli:started",
    "sessionId": "session-1234567890-abc",
    "pid": 12345,
    "cwd": "/path/to/project",
    "args": ["--print", "--input-format", "stream-json", ...],
    "prompt": "Initial user prompt",
    "timestamp": "2026-02-10T00:19:05.123Z"
  }
}
```

### claude-cli:output
```json
{
  "type": "event",
  "sessionId": "session-1234567890-abc",
  "payload": {
    "type": "claude-cli:output",
    "sessionId": "session-1234567890-abc",
    "output": "Assistant response text chunk",
    "stream": "stdout",
    "timestamp": "2026-02-10T00:19:06.456Z"
  }
}
```

### claude-cli:exited
```json
{
  "type": "event",
  "sessionId": "session-1234567890-abc",
  "payload": {
    "type": "claude-cli:exited",
    "sessionId": "session-1234567890-abc",
    "exitCode": 0,
    "exitSignal": null,
    "duration": 65432,
    "timestamp": "2026-02-10T00:20:10.555Z"
  }
}
```
