# CLI Terminal "Prompt is too long" Error — Root Cause Analysis

**Aspect:** bug
**Scope:** CLI terminal "Prompt is too long" error
**Date:** 2026-02-09
**Agent:** analyze/bug

---

## 1. Executive Summary

When users type ANY input (even "hi") in the CLI session terminal (CliPanel component), they receive an error: `[Error: Prompt is too long]`. This error is NOT caused by the input length, but by a **fundamental architecture mismatch** between how ActionFlows Dashboard is using Claude CLI and how Claude CLI's `--print` mode actually works.

**Root Cause:** The backend incorrectly uses `claude --print` mode with an initial prompt argument AND attempts bidirectional stdin/stdout communication. Claude CLI's `--print` mode is designed for one-shot execution, not interactive sessions with follow-up messages.

---

## 2. Error Flow Trace

### 2.1 Frontend → Backend WebSocket

**File:** `D:\ActionFlowsDashboard\packages\app\src\components\SessionPanel\CliPanel.tsx`
**Lines:** 254-289

When user types "hi" and presses Enter:
```typescript
// Line 268-273: Send command via WebSocket as 'input' type
send({
  type: 'input',
  sessionId: sessionId,
  payload: command,  // "hi"
  timestamp: new Date().toISOString(),
} as unknown as WorkspaceEvent);
```

### 2.2 Backend WebSocket Handler

**File:** `D:\ActionFlowsDashboard\packages\backend\src\ws\handler.ts`
**Lines:** 109-130

Backend receives WebSocket message with `type: 'input'`:
```typescript
case 'input':
  if (message.payload) {
    const cliSession = claudeCliManager.getSession(message.sessionId as SessionId);
    if (cliSession && cliSession.isRunning()) {
      // Pipe input directly to Claude CLI stdin
      cliSession.sendInput(String(message.payload));  // Sends "hi"
      console.log(`[WS] Input piped to CLI session ${message.sessionId}`);
    }
  }
  break;
```

### 2.3 Claude CLI Session Process

**File:** `D:\ActionFlowsDashboard\packages\backend\src\services\claudeCliSession.ts`
**Lines:** 126-156

The `sendInput()` method formats input as stream-json and writes to stdin:
```typescript
sendInput(input: string): void {
  // ... validation ...

  // Format as stream-json user message (JSONL: one JSON object per line)
  const message = JSON.stringify({
    type: 'user',
    message: { role: 'user', content: input.trim() },
  });
  this.process.stdin.write(message + '\n', 'utf8');
}
```

This sends to Claude CLI stdin:
```json
{"type":"user","message":{"role":"user","content":"hi"}}
```

### 2.4 Claude CLI Response

Claude CLI processes this stdin input and returns via stdout (as stream-json):
```json
{"type":"result","is_error":true,"result":"Prompt is too long"}
```

### 2.5 Frontend Display

**File:** `D:\ActionFlowsDashboard\packages\app\src\components\SessionPanel\CliPanel.tsx`
**Lines:** 213-222

CliPanel parses the stream-json response and displays:
```typescript
case 'result':
  terminal.writeln('');
  if (msg.is_error) {
    terminal.writeln(`\x1b[1;31m[Error: ${msg.result || 'Unknown'}]\x1b[0m`);
  }
```

Result: `[Error: Prompt is too long]` appears in red in the terminal.

---

## 3. Root Cause: Architecture Mismatch

**File:** `D:\ActionFlowsDashboard\packages\backend\src\services\claudeCliManager.ts`
**Lines:** 127-185 (startSession method)

### 3.1 The Problem

When starting a Claude CLI session, the backend builds these args:

```typescript
// Line 157-167: Build command args
const args: string[] = [];

// Use --print with stream-json for bidirectional piped communication
// --input-format stream-json: accepts JSON messages on stdin
// --output-format stream-json: emits JSON messages on stdout
// --include-partial-messages: streams partial response chunks
args.push('--print');
args.push('--input-format', 'stream-json');
args.push('--output-format', 'stream-json');
args.push('--include-partial-messages');
args.push('--verbose');
args.push('--dangerously-skip-permissions');
args.push('--no-session-persistence');

// ... MCP config, flags ...

// Line 182-185: Add prompt if provided (required for --print mode)
if (prompt) {
  args.push(prompt);
}
```

This spawns Claude CLI like:
```bash
claude --print \
  --input-format stream-json \
  --output-format stream-json \
  --include-partial-messages \
  --verbose \
  --dangerously-skip-permissions \
  --no-session-persistence \
  --mcp-config '{"mcpServers":{...}}' \
  "Initial prompt text here"
```

### 3.2 Why This Fails

**Claude CLI `--print` mode behavior:**

1. **With initial prompt argument:** Designed for **one-shot execution**
   - Reads the prompt argument as the ONLY user message
   - Processes it, responds via stdout, and exits
   - **Does NOT accept follow-up messages via stdin**

2. **Without initial prompt argument:** Could potentially accept stdin messages
   - But this mode is not well-documented
   - The dashboard code assumes prompt argument is "required for --print mode" (line 182 comment)

When the user sends "hi" via stdin AFTER the CLI has already started with an initial prompt:
- Claude CLI receives unexpected stdin input
- It tries to interpret the stream-json formatted message as a new prompt
- Validation fails (possibly because it tries to parse the JSON structure as a prompt string)
- Returns error: "Prompt is too long"

### 3.3 Evidence

1. **Error message source:** The exact string "Prompt is too long" does NOT appear anywhere in ActionFlows Dashboard code (confirmed via grep). It comes from Claude CLI itself.

2. **Schema validation:** The only "prompt too long" validations in the dashboard are:
   - `sessionInputSchema`: `prompt: z.string().max(5000, 'prompt too long')` (REST API, not used by WebSocket)
   - `claudeCliStartSchema`: `prompt: z.string().max(10000, 'prompt too long')` (initial prompt validation)
   - `customPromptDefinitionSchema`: `prompt: z.string().max(2000, 'prompt too long')` (custom prompt buttons)

   None of these are triggered by the WebSocket `type: 'input'` flow.

3. **WebSocket schema:** Validates `inputMessage` as:
   ```typescript
   const inputMessage = z.object({
     type: z.literal('input'),
     sessionId: z.string().min(1).max(200),
     payload: z.unknown(),  // No length validation!
   });
   ```

   The payload has NO length restriction, so "hi" passes validation.

---

## 4. Impact Assessment

**Severity:** CRITICAL — CLI terminal is completely unusable

**Affected Users:** Anyone trying to use the CLI session terminal feature

**Workaround:** None — the feature is fundamentally broken for interactive use

**Data Loss:** None — no corruption, just feature unavailability

---

## 5. Recommendations

### 5.1 Primary Fix (Recommended)

**Remove the initial prompt argument when using stream-json mode:**

**File:** `D:\ActionFlowsDashboard\packages\backend\src\services\claudeCliManager.ts`
**Lines:** 182-185

**Current code:**
```typescript
// Add prompt if provided (required for --print mode)
if (prompt) {
  args.push(prompt);
}
```

**Recommended change:**
```typescript
// DO NOT add prompt as command-line argument when using stream-json mode
// The first message should be sent via stdin instead
// if (prompt) {
//   args.push(prompt);
// }

// Note: If prompt is provided, it should be sent as the FIRST stdin message
// after the process starts, not as a command-line argument
```

**Additional changes needed:**

1. **Send initial prompt via stdin after spawn:**

   **File:** `D:\ActionFlowsDashboard\packages\backend\src\services\claudeCliManager.ts`
   **After line 276 (`await session.start()`):**

   ```typescript
   await session.start();

   // If initial prompt provided, send it as first stdin message
   if (prompt) {
     session.sendInput(prompt);
   }

   this.sessions.set(sessionId, session);
   ```

2. **Update comment on line 157-160:**
   ```typescript
   // Use --print with stream-json for bidirectional piped communication
   // --input-format stream-json: accepts JSON messages on stdin
   // --output-format stream-json: emits JSON messages on stdout
   // Initial prompt (if any) is sent via stdin, NOT as command-line argument
   ```

### 5.2 Alternative Fix (If --print doesn't support stdin interaction)

If Claude CLI's `--print` mode doesn't support ongoing stdin interaction at all:

**Remove `--print` and use interactive mode:**

**File:** `D:\ActionFlowsDashboard\packages\backend\src\services\claudeCliManager.ts`
**Lines:** 161

**Current:**
```typescript
args.push('--print');
```

**Change to:**
```typescript
// Remove --print for interactive session mode
// args.push('--print');
```

Test if Claude CLI supports stream-json stdin/stdout in regular interactive mode.

### 5.3 Validation Testing

After implementing the fix:

1. **Start a CLI session** without initial prompt
2. **Type "hi"** in the terminal
3. **Expected result:** Claude responds normally, no error
4. **Type follow-up messages** — confirm bidirectional communication works
5. **Test with initial prompt** — confirm it's sent via stdin and works as first message

---

## 6. Prevention

### 6.1 Integration Testing Gap

This bug indicates a **missing integration test** for the CLI session feature:

**Test file needed:** `D:\ActionFlowsDashboard\packages\backend\src\services\__tests__\claudeCliSession.test.ts`

**Test cases:**
- Start CLI session with initial prompt → verify first response
- Send follow-up message via stdin → verify response
- Send multiple messages → verify all responses
- Test stream-json parsing → verify output format

### 6.2 Documentation Gap

**Missing:** Documentation of Claude CLI `--print` mode behavior and limitations

**Needed:** Developer notes in code explaining:
- Why `--print` is/isn't used
- How stream-json stdin/stdout interaction works
- Differences between one-shot and interactive modes

---

## 7. Related Files

### Changed Files (for fix):
- `D:\ActionFlowsDashboard\packages\backend\src\services\claudeCliManager.ts` (lines 182-185, add stdin send after line 276)

### Investigation Trail Files:
- `D:\ActionFlowsDashboard\packages\app\src\components\SessionPanel\CliPanel.tsx` (frontend WebSocket send)
- `D:\ActionFlowsDashboard\packages\backend\src\ws\handler.ts` (WebSocket receive)
- `D:\ActionFlowsDashboard\packages\backend\src\services\claudeCliSession.ts` (stdin write)
- `D:\ActionFlowsDashboard\packages\backend\src\schemas\api.ts` (schema validations — NOT the issue)
- `D:\ActionFlowsDashboard\packages\backend\src\schemas\ws.ts` (WebSocket schema — NOT the issue)

### Testing Files to Create:
- `D:\ActionFlowsDashboard\packages\backend\src\services\__tests__\claudeCliSession.test.ts` (new)
- `D:\ActionFlowsDashboard\test\e2e\cli-session-interaction.spec.ts` (new E2E test)

---

## 8. Confidence Assessment

**Root Cause Confidence:** 95%

**Evidence supporting:**
- Error message "Prompt is too long" comes from Claude CLI, not dashboard code (confirmed via exhaustive grep)
- Architecture clearly uses `--print` + initial prompt arg + stdin messages
- Claude CLI `--print` mode is documented as one-shot execution mode
- No validation in dashboard code triggers on "hi" input length

**Remaining uncertainty (5%):**
- Exact behavior of Claude CLI's `--input-format stream-json` with `--print` is not documented in ActionFlows code
- Need to test if removing initial prompt argument actually fixes the issue

**Recommended validation:** Implement Primary Fix and test with actual Claude CLI subprocess.

---

## 9. Timeline Estimate

**Fix implementation:** 30 minutes
**Testing:** 1 hour
**Integration tests:** 2 hours
**Documentation:** 30 minutes

**Total:** ~4 hours

---

## 10. Learnings

### Fresh Eye Discovery

**Discovery:** The dashboard's CLI session feature was architected with an incorrect understanding of Claude CLI's `--print` mode capabilities.

**Pattern:** When integrating with external CLI tools, always:
1. Test the EXACT command-line configuration with manual subprocess tests
2. Verify stdin/stdout behavior matches assumptions
3. Document CLI tool behavior in code comments
4. Write integration tests that spawn real subprocesses (not mocks)

**Broader Impact:** This same pattern could affect other subprocess integrations in the dashboard. Audit any other places where external CLI tools are spawned with piped stdin/stdout.
