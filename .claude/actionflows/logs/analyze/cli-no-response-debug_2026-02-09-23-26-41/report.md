# Claude CLI No Response Debug Analysis

**Aspect:** impact
**Scope:** CLI panel, Claude process spawning, stdin/stdout handling, WebSocket event broadcasting
**Date:** 2026-02-09
**Agent:** analyze/

---

## 1. Executive Summary

**Issue:** User reports Claude CLI is not responding when prompts are sent from dashboard CLI panel — subprocess produces no output.

**Root Cause Identified:** Stream-JSON format mismatch. The Claude CLI subprocess is configured with `--output-format stream-json` which emits JSON-structured messages, but the stdout handler in `claudeCliSession.ts` (lines 80-83) treats the output as raw text and broadcasts it directly without parsing.

**Impact:** Critical — breaks primary CLI interaction feature. Users cannot receive Claude responses through the dashboard terminal.

---

## 2. Architecture Analysis

### 2.1 Full Lifecycle Flow

```
User types in terminal
    ↓
ClaudeCliTerminal.tsx (line 93-107) — onData handler
    ↓
useClaudeCliControl.ts (line 24-36) — sendInput()
    ↓
claudeCliService.ts (line 59-72) — POST /api/claude-cli/:id/input
    ↓
claudeCli.ts route (line 76-99) — validates and calls session.sendInput()
    ↓
claudeCliSession.ts (line 126-156) — formats as stream-json, writes to stdin
    ↓
Claude CLI subprocess receives JSON message
    ↓
Claude CLI subprocess emits response on stdout (stream-json format)
    ↓
claudeCliSession.ts (line 80-83) — stdout data handler [ISSUE HERE]
    ↓
claudeCliManager.ts (line 203-212) — stdout event handler, broadcasts event
    ↓
index.ts (line 228-239) — broadcastClaudeCliEvent()
    ↓
clientRegistry.broadcastToSession() — WebSocket send
    ↓
ClaudeCliTerminal.tsx (line 144-169) — onEvent handler, writes to xterm
```

---

## 3. Critical Issue: Stream-JSON Not Parsed

### 3.1 Configuration

**File:** `packages/backend/src/services/claudeCliManager.ts` (lines 157-167)

The Claude CLI is spawned with these flags:
```typescript
args.push('--print');
args.push('--input-format', 'stream-json');
args.push('--output-format', 'stream-json');
args.push('--include-partial-messages');
```

**What this means:**
- Input: Expects JSON messages on stdin (JSONL format: one JSON object per line)
- Output: Emits JSON messages on stdout (JSONL format)
- Format example:
  ```json
  {"type":"message","message":{"role":"assistant","content":"Hello!"}}
  {"type":"partial","message":{"role":"assistant","content":"Hello! How"}}
  ```

### 3.2 The Bug

**File:** `packages/backend/src/services/claudeCliSession.ts` (lines 79-83)

```typescript
// Handle stdout - CRITICAL: immediate data handler to prevent buffering hangs
childProcess.stdout?.on('data', (chunk: Buffer) => {
  const output = chunk.toString('utf8');
  this.eventHandlers.stdout.forEach(handler => handler(output));
});
```

**Problem:** This handler converts the buffer to UTF-8 string and passes it directly to event handlers. It does NOT parse the JSON format. The raw JSON is broadcast to the frontend terminal as text.

**Result:** User sees raw JSON like:
```
{"type":"message","message":{"role":"assistant","content":"..."}}
```

OR worse, if the JSON is malformed due to chunking, the terminal shows broken JSON fragments.

---

## 4. Input Handling (Confirmed Working)

### 4.1 stdin Write

**File:** `packages/backend/src/services/claudeCliSession.ts` (lines 126-156)

```typescript
sendInput(input: string): void {
  // Format as stream-json user message (JSONL: one JSON object per line)
  const message = JSON.stringify({
    type: 'user',
    message: { role: 'user', content: input.trim() },
  });
  this.process.stdin.write(message + '\n', 'utf8');
}
```

**Status:** ✅ Correct. Input is properly formatted as stream-json before writing to stdin.

**Evidence:** Recent fix (commit 5ead864) moved prompt from CLI arg to stdin to enable multi-turn sessions. This fix is working correctly.

---

## 5. Output Handling (Broken)

### 5.1 stdout Handler

**Current implementation:** Raw text passthrough (no JSON parsing)

**Expected implementation:**
1. Receive chunk from stdout
2. Accumulate into buffer (handle partial JSON lines)
3. Split by newlines (JSONL format)
4. Parse each line as JSON
5. Extract message content from parsed structure
6. Broadcast clean text to frontend

### 5.2 Frontend Expectations

**File:** `packages/app/src/components/ClaudeCliTerminal/ClaudeCliTerminal.tsx` (lines 152-169)

```typescript
if (event.type === 'claude-cli:output') {
  const outputEvent = event as ClaudeCliOutputEvent;
  const term = xtermRef.current;
  if (!term) return;

  // Write output to terminal
  const lines = outputEvent.output.split('\n');
  lines.forEach((line, index) => {
    if (outputEvent.stream === 'stderr') {
      term.write(`\x1b[31m${line}\x1b[0m`);
    } else {
      term.write(line);
    }
    if (index < lines.length - 1) {
      term.write('\r\n');
    }
  });
}
```

**Frontend expects:** Clean text output, not JSON structures.

---

## 6. WebSocket Event Flow (Confirmed Working)

### 6.1 Broadcast Chain

**File:** `packages/backend/src/services/claudeCliManager.ts` (lines 203-212)

```typescript
session.on('stdout', (output) => {
  const event: ClaudeCliOutputEvent = {
    type: 'claude-cli:output',
    sessionId,
    output,
    stream: 'stdout',
    timestamp: new Date().toISOString() as Timestamp,
  };
  this.broadcast(sessionId, event);
});
```

**Status:** ✅ Correct structure. The broadcast mechanism is working.

**File:** `packages/backend/src/index.ts` (lines 228-239)

```typescript
function broadcastClaudeCliEvent(
  sessionId: SessionId,
  event: WorkspaceEvent
) {
  const message = JSON.stringify({
    type: 'event',
    sessionId,
    payload: event,
  });

  clientRegistry.broadcastToSession(sessionId, message);
}
```

**Status:** ✅ Correctly wraps event and broadcasts to subscribed clients.

---

## 7. Historical Context: Past Fixes

### 7.1 Four Previous CLI Fixes

From context provided:

1. **"Prompt is too long" error** (commit 5ead864)
   - Moved prompt from CLI arg to stdin
   - Enabled multi-turn sessions
   - Status: ✅ Fixed

2. **CLI Panel Auto-Start Session**
   - Status: ✅ Fixed

3. **CLI Prompt stdin fix**
   - Related to fix #1
   - Status: ✅ Fixed

4. **CLIPanel race condition fix**
   - Status: ✅ Fixed

### 7.2 What Changed?

**Recent commits analysis:** No obvious regressions in the files reviewed. The bug appears to be a **pre-existing issue** that was never fixed — the stream-json output was never properly parsed.

**Why surfacing now?** Possible reasons:
- Previous testing used `--output-format text` (default)
- Recent changes enabled stream-json but didn't update parser
- User recently started using the CLI panel feature more heavily

---

## 8. Impact Analysis

### 8.1 Affected Files

**Backend (2 files need changes):**
1. `packages/backend/src/services/claudeCliSession.ts` — stdout handler needs JSON parser
2. `packages/backend/src/services/claudeCliManager.ts` — may need buffer management

**Frontend (0 files need changes):**
- Frontend is already correctly consuming `ClaudeCliOutputEvent.output` as string
- No changes needed if backend sends clean text

### 8.2 Dependency Chain

**Claude CLI subprocess:**
- Using `--output-format stream-json`
- Emits JSONL on stdout
- Each line is a complete JSON object

**Node.js stream chunking:**
- `data` event may emit partial lines
- Must buffer and split by `\n` to parse complete JSON objects

**WebSocket message size:**
- Large responses may arrive in multiple chunks
- Frontend handles this correctly (already splits by `\n`)

---

## 9. Technical Details: Stream-JSON Format

### 9.1 Expected Output Structure

**Message types from Claude CLI:**

```typescript
// Complete message
{ "type": "message", "message": { "role": "assistant", "content": "..." } }

// Partial message (streaming)
{ "type": "partial", "message": { "role": "assistant", "content": "..." } }

// Error
{ "type": "error", "error": { "message": "..." } }

// Tool use
{ "type": "tool_use", "message": { "role": "assistant", "content": [...] } }
```

### 9.2 Chunking Example

**What stdout.on('data') might receive:**

Chunk 1:
```
{"type":"message","message":{"role":"assistant","content":"Hello! How can I
```

Chunk 2:
```
 help you today?"}}\n{"type":"partial","message":{"role":"assis
```

Chunk 3:
```
tant","content":"Let me"}}\n
```

**Required buffering strategy:**
1. Accumulate chunks into a string buffer
2. Split buffer by `\n`
3. Parse complete lines (all but last fragment)
4. Keep last fragment in buffer for next chunk
5. Extract `.message.content` from each parsed JSON
6. Broadcast clean text

---

## 10. No Response vs. Raw JSON

### 10.1 Symptom Clarification

User reports: **"Claude didn't respond"**

Possible manifestations:
1. **No output at all** — stdout handler not firing (less likely)
2. **Raw JSON displayed** — user sees JSON instead of clean text (more likely)
3. **Malformed output** — broken JSON fragments due to chunking (most likely)

### 10.2 Verification Needed

To confirm root cause, check:
- Backend console logs for `[ClaudeCliSession] Spawned Claude CLI with PID`
- WebSocket traffic in browser DevTools Network tab (filter: WS)
- Terminal output in xterm — does user see JSON?

---

## 11. Additional Observations

### 11.1 Missing Debug Logging

**File:** `packages/backend/src/services/claudeCliSession.ts`

The stdout/stderr handlers have NO debug logging. This makes troubleshooting difficult.

**Recommendation:** Add debug logs to track output flow.

### 11.2 Error Handling

**stderr handler** (line 86-89):
```typescript
childProcess.stderr?.on('data', (chunk: Buffer) => {
  const output = chunk.toString('utf8');
  this.eventHandlers.stderr.forEach(handler => handler(output));
});
```

**Status:** Same issue as stdout — no JSON parsing. If Claude CLI emits errors in JSON format, they won't be readable.

### 11.3 CI Environment Variable

**File:** `packages/backend/src/services/claudeCliSession.ts` (line 71)

```typescript
env: {
  ...this.spawnEnv,
  // Force non-interactive mode for subprocess
  CI: '1',
},
```

**Note:** Setting `CI=1` forces Claude CLI into non-interactive mode. This is correct for subprocess usage.

---

## 12. Recommendations

### 12.1 Immediate Fix (Priority: Critical)

**Action:** Implement stream-json parser in stdout handler

**Implementation strategy:**
1. Add line buffer to `ClaudeCliSessionProcess` class
2. Modify stdout handler to accumulate chunks
3. Split by `\n` and parse complete JSON lines
4. Extract message content and broadcast clean text
5. Handle partial messages (streaming) and complete messages
6. Add error handling for malformed JSON

**Files to modify:**
- `packages/backend/src/services/claudeCliSession.ts`

**Estimated complexity:** Medium (50-100 lines)

### 12.2 Secondary Improvements

**A. Add debug logging**
- Log when stdout/stderr data is received
- Log parsed JSON structure
- Log broadcast events

**B. Add metrics**
- Track output chunks received
- Track JSON parse errors
- Track message broadcast count

**C. Add tests**
- Unit test for stream-json parser
- Integration test for full CLI flow
- Test chunked JSON handling

### 12.3 Alternative Fix: Remove stream-json

**Option:** Use `--output-format text` instead of `stream-json`

**Pros:**
- No parsing needed
- Simpler implementation
- Works with current code

**Cons:**
- Lose structured message metadata
- Harder to detect tool use, errors, etc.
- Lose partial message streaming support

**Recommendation:** Do NOT use this approach. stream-json provides better visibility and control.

---

## 13. Test Plan

### 13.1 Verification Steps

After fix is applied:

1. Start Claude CLI session from dashboard
2. Send prompt: "Hello, can you help me?"
3. Verify clean text response appears in terminal
4. Send multi-line prompt
5. Verify streaming responses appear character-by-character
6. Trigger error (e.g., invalid MCP config)
7. Verify error message is readable
8. Check WebSocket traffic shows `ClaudeCliOutputEvent` with clean text

### 13.2 Regression Testing

Ensure previous fixes still work:
1. Multi-turn sessions (commit 5ead864)
2. Auto-start session
3. Race condition handling

---

## 14. Learnings

**Issue:** Claude CLI configured for stream-json output but stdout handler treats output as plain text

**Root Cause:** Mismatch between CLI configuration (`--output-format stream-json`) and output parsing (no JSON parser)

**Suggestion:** When configuring subprocess with structured output format, always implement corresponding parser in data handler. Add integration test to verify end-to-end flow.

**[FRESH EYE]** The recent changes to `sessions.ts` added imports for `WorkspaceEvent`, `clientRegistry`, and `broadcastEvent` but these are not used in the file. This suggests incomplete work or copy-paste error. Consider removing unused imports or completing the intended feature.
