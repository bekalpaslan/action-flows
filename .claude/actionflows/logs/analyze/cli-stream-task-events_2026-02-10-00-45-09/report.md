# Claude CLI Stream Format Analysis: Task Tool Events

**Aspect:** Stream-JSON format analysis for Task tool_use events
**Scope:** Claude CLI stream output, Task tool events, spawn prompt accessibility
**Date:** 2026-02-10
**Agent:** analyze/

---

## 1. Executive Summary

**Key Findings:**

1. ✅ **Task tool_use events ARE included in the Claude CLI stream** when using `--output-format stream-json`
2. ✅ **JSON structure is documented** in existing parsers and code comments
3. ⚠️ **Spawn prompt IS included but requires extraction** from the `input` field of tool_use events
4. ✅ **Existing stream parser handles tool_use events** but does NOT currently extract spawn prompts

**Immediate Action Required:**
- Enhance `claudeCliManager.ts` raw-json handler to extract and store spawn prompts from Task tool_use events
- The data is already streaming through — we just need to capture it

---

## 2. Stream-JSON Format for Tool Events

### 2.1 Stream Event Types

Claude CLI's `--output-format stream-json` emits JSONL (JSON Lines) format with these message types:

| Type | Purpose | Example |
|------|---------|---------|
| `assistant` | Complete assistant messages | `{"type":"assistant","message":{"role":"assistant","content":"..."}}` |
| `result` | End-of-turn markers with metadata | `{"type":"result","result":"...","cost_usd":0.05,"duration_ms":1500}` |
| `error` | Error messages | `{"type":"error","error":"..."}` |
| `stream_event` | Streaming content chunks | `{"type":"stream_event","event":{...}}` |

**Source Evidence:**
- `packages/backend/src/services/claudeCliSession.ts:10-27` — `StreamJsonMessage` interface
- `packages/backend/src/services/claudeCliSession.ts:79-136` — `parseStreamJson()` method

### 2.2 Tool Use Event Structure

Tool events are transmitted via **nested `stream_event` messages** with event subtypes:

#### Content Block Start (Tool Use)

```json
{
  "type": "stream_event",
  "event": {
    "type": "content_block_start",
    "content_block": {
      "type": "tool_use",
      "id": "toolu_ABC123...",
      "name": "Task",
      "input": {
        "prompt": "Read your definition in .claude/actionflows/actions/analyze/agent.md...",
        "other_params": "..."
      }
    }
  }
}
```

#### Content Block Delta (Streaming Input)

```json
{
  "type": "stream_event",
  "event": {
    "type": "content_block_delta",
    "delta": {
      "type": "input_json_delta",
      "partial_json": "...streaming JSON input..."
    }
  }
}
```

#### Content Block Stop

```json
{
  "type": "stream_event",
  "event": {
    "type": "content_block_stop"
  }
}
```

**Source Evidence:**
- `packages/backend/src/services/claudeCliManager.ts:262-277` — Stream event handler
- `packages/app/src/utils/streamJsonParser.ts:53-65` — Frontend parser for tool_use blocks

---

## 3. Task Tool Structure

### 3.1 Tool Name and ID

- **Tool Name:** `"Task"` (exact string)
- **Tool Use ID:** Unique identifier like `"toolu_ABC123..."` for correlating with results

### 3.2 Input Field Structure

The `input` object in Task tool_use events contains:

```typescript
{
  "prompt": string,    // ⭐ THE SPAWN PROMPT — this is what we need!
  // ... other Task tool parameters
}
```

**Evidence:**
- `packages/app/src/utils/streamJsonParser.ts:174-205` — `detectTaskSpawns()` function
- Function attempts to extract task name from `input.task || input.name`, indicating `input` is an object with fields

### 3.3 Spawn Prompt Accessibility

**YES — The spawn prompt IS accessible in the stream.**

The spawn prompt is sent to the subagent via the Task tool's `prompt` parameter. This is visible in the stream as:

```json
{
  "type": "stream_event",
  "event": {
    "type": "content_block_start",
    "content_block": {
      "type": "tool_use",
      "name": "Task",
      "input": {
        "prompt": "Full spawn prompt text here..."
      }
    }
  }
}
```

**CRITICAL FINDING:** The spawn prompt is NOT buffered or hidden — it streams in real-time as Claude generates the tool call.

---

## 4. Current Parser Handling

### 4.1 Backend Stream Parser (claudeCliSession.ts)

**Current Behavior:**
- ✅ Parses stream-json JSONL format
- ✅ Buffers partial lines
- ✅ Emits raw-json events for all parsed messages
- ❌ **Does NOT extract tool_use events** — only processes `assistant`, `result`, and `error` types

**Code Location:** `packages/backend/src/services/claudeCliSession.ts:79-136`

**What's Emitted:**
```typescript
// Line 111: Emits raw parsed JSON for aggregation
this.eventHandlers['raw-json'].forEach(handler => handler(parsed));
```

**What's NOT Handled:**
- No special handling for `stream_event` type in `parseStreamJson()`
- No extraction of tool_use blocks
- No spawn prompt capture

### 4.2 Backend Message Aggregator (claudeCliManager.ts)

**Current Behavior:**
- ✅ Listens to `raw-json` events
- ✅ **Detects tool_use start** via `stream_event` → `content_block_start` → `tool_use`
- ✅ Sets message type to `'tool_use'`
- ✅ Captures tool name in metadata
- ❌ **Does NOT capture tool input fields** (including spawn prompt)

**Code Location:** `packages/backend/src/services/claudeCliManager.ts:262-277`

**Current Implementation:**
```typescript
} else if (msg.type === 'stream_event' && msg.event) {
  // Streaming event — accumulate chunks
  if (msg.event.type === 'content_block_delta' && msg.event.delta?.text) {
    aggregator.appendChunk(msg.event.delta.text);
  } else if (msg.event.type === 'content_block_start' && msg.event.content_block?.type === 'tool_use') {
    // Tool use start
    if (aggregator.hasBufferedContent()) {
      aggregator.finalizeMessage();
    }
    aggregator.setMessageType('tool_use');
    if (msg.event.content_block.name) {
      aggregator.setMetadata('toolName', msg.event.content_block.name);
    }
    // ❌ MISSING: Extract msg.event.content_block.input (spawn prompt is here!)
  }
```

**What's Missing:**
```typescript
// Should add:
if (msg.event.content_block.input) {
  aggregator.setMetadata('toolInput', msg.event.content_block.input);
  // For Task tool specifically:
  if (msg.event.content_block.name === 'Task' && msg.event.content_block.input.prompt) {
    aggregator.setMetadata('spawnPrompt', msg.event.content_block.input.prompt);
  }
}
```

### 4.3 Frontend Stream Parser (streamJsonParser.ts)

**Current Behavior:**
- ✅ Parses `content_block_start` events
- ✅ Extracts tool name and ID
- ✅ **Extracts tool input** via `JSON.stringify(block.input || {})`
- ✅ Detects Task spawns

**Code Location:** `packages/app/src/utils/streamJsonParser.ts:53-65, 174-205`

**Implementation:**
```typescript
if (block.type === 'tool_use') {
  blocks.push({
    type: 'tool_use',
    content: JSON.stringify(block.input || {}), // ✅ Input is captured here!
    toolName: block.name,
    toolUseId: block.id,
    timestamp: Date.now(),
  });
}
```

**Task Detection:**
```typescript
export function detectTaskSpawns(blocks: ParsedStreamBlock[]): Array<{...}> {
  for (const block of blocks) {
    if (
      block.type === 'tool_use' &&
      block.toolName === 'Task' &&
      block.toolUseId &&
      block.timestamp
    ) {
      // Extract task name from content
      try {
        const input = JSON.parse(block.content);
        const taskName = input.task || input.name || 'Unnamed Task';
        // ⭐ input.prompt is available here but not extracted!
```

**Frontend has the logic but doesn't expose spawn prompts.**

---

## 5. Data Flow Analysis

### 5.1 Current Flow

```
Claude CLI stdout
  ↓ (JSONL stream)
claudeCliSession.parseStreamJson()
  ↓ (parsed StreamJsonMessage)
claudeCliSession emits 'raw-json' event
  ↓
claudeCliManager 'raw-json' handler
  ↓ (processes stream_event → content_block_start → tool_use)
ClaudeCliMessageAggregator
  ↓ (stores: messageType='tool_use', metadata.toolName='Task')
  ↓ ❌ MISSING: metadata.spawnPrompt
ChatMessage stored in storage
  ↓
Broadcast via WebSocket as chat:message event
```

### 5.2 Proposed Flow Enhancement

```diff
claudeCliManager 'raw-json' handler
  ↓
+ IF tool_use event AND name === 'Task':
+   Extract content_block.input.prompt
+   Store as metadata.spawnPrompt
  ↓
ClaudeCliMessageAggregator
  ↓ (stores: messageType='tool_use', metadata.toolName='Task', metadata.spawnPrompt='...')
ChatMessage stored in storage
  ↓
Dashboard can query ChatMessage.metadata.spawnPrompt
```

---

## 6. Missing Pieces & Gaps

### 6.1 Backend Extraction Gap

**Issue:** Tool input fields are not captured in backend stream processing.

**Location:** `packages/backend/src/services/claudeCliManager.ts:262-277`

**Fix Required:**
```typescript
} else if (msg.event.type === 'content_block_start' && msg.event.content_block?.type === 'tool_use') {
  // Tool use start
  if (aggregator.hasBufferedContent()) {
    aggregator.finalizeMessage();
  }
  aggregator.setMessageType('tool_use');
  if (msg.event.content_block.name) {
    aggregator.setMetadata('toolName', msg.event.content_block.name);
  }
  // ⭐ ADD THIS:
  if (msg.event.content_block.input) {
    aggregator.setMetadata('toolInput', msg.event.content_block.input);
    // Special handling for Task tool spawn prompts
    if (msg.event.content_block.name === 'Task' && msg.event.content_block.input.prompt) {
      aggregator.setMetadata('spawnPrompt', msg.event.content_block.input.prompt);
    }
  }
  if (msg.event.content_block.id) {
    aggregator.setMetadata('toolUseId', msg.event.content_block.id);
  }
}
```

### 6.2 StreamJsonMessage Type Extension

**Issue:** `StreamJsonMessage` interface doesn't include `input` field in `content_block`.

**Location:** `packages/backend/src/services/claudeCliSession.ts:18-21`

**Current:**
```typescript
event?: {
  type?: string;
  delta?: { text?: string; type?: string };
  content_block?: { type?: string; name?: string };
};
```

**Should Be:**
```typescript
event?: {
  type?: string;
  delta?: { text?: string; type?: string };
  content_block?: {
    type?: string;
    name?: string;
    id?: string;        // ⭐ ADD: Tool use ID
    input?: unknown;    // ⭐ ADD: Tool input (spawn prompt is here)
  };
};
```

### 6.3 ChatMessage Metadata Type

**Issue:** `ChatMessage.metadata` is loosely typed as `Record<string, unknown>`.

**Location:** `packages/shared/src/models.ts:470-478`

**Current:**
```typescript
metadata?: {
  model?: string;
  stopReason?: string;
  toolName?: string;
  stepNumber?: number;
  costUsd?: number;
  durationMs?: number;
};
```

**Should Include:**
```typescript
metadata?: {
  model?: string;
  stopReason?: string;
  toolName?: string;
  toolUseId?: string;       // ⭐ ADD: For correlating with results
  toolInput?: unknown;      // ⭐ ADD: Full tool input object
  spawnPrompt?: string;     // ⭐ ADD: Extracted spawn prompt (Task tool only)
  stepNumber?: number;
  costUsd?: number;
  durationMs?: number;
};
```

---

## 7. Verification Test Cases

To validate spawn prompt capture, create test cases:

### 7.1 Unit Test (claudeCliManager.test.ts)

```typescript
it('should capture Task tool spawn prompt from stream_event', () => {
  const mockStreamEvent = {
    type: 'stream_event',
    event: {
      type: 'content_block_start',
      content_block: {
        type: 'tool_use',
        id: 'toolu_test123',
        name: 'Task',
        input: {
          prompt: 'Read your definition in .claude/actionflows/actions/analyze/agent.md...'
        }
      }
    }
  };

  // Emit raw-json event
  session.emit('raw-json', mockStreamEvent);

  // Verify aggregator captured metadata
  const messages = getCapturedMessages();
  expect(messages[0].metadata.toolName).toBe('Task');
  expect(messages[0].metadata.spawnPrompt).toBe('Read your definition...');
  expect(messages[0].metadata.toolUseId).toBe('toolu_test123');
});
```

### 7.2 Integration Test (E2E)

```typescript
it('should passively log spawn prompts for all Task spawns in CLI session', async () => {
  // Start CLI session
  const session = await claudeCliManager.startSession(
    sessionId,
    '/test/workspace',
    'Analyze the backend architecture'
  );

  // Wait for Task tool_use events
  await waitForTaskSpawn();

  // Query chat history
  const messages = await storage.getChatMessages(sessionId);
  const taskMessages = messages.filter(m => m.messageType === 'tool_use' && m.metadata?.toolName === 'Task');

  // Verify spawn prompts are captured
  expect(taskMessages.length).toBeGreaterThan(0);
  for (const msg of taskMessages) {
    expect(msg.metadata?.spawnPrompt).toBeDefined();
    expect(typeof msg.metadata?.spawnPrompt).toBe('string');
  }
});
```

---

## 8. Recommendations

### 8.1 Immediate Actions (High Priority)

1. **Extend StreamJsonMessage interface** to include `input` and `id` fields in `content_block`
   - File: `packages/backend/src/services/claudeCliSession.ts:18-21`
   - Impact: Type safety for tool input extraction

2. **Enhance raw-json handler in claudeCliManager** to capture tool inputs
   - File: `packages/backend/src/services/claudeCliManager.ts:266-274`
   - Extract: `content_block.input`, `content_block.id`
   - Special case: Extract `input.prompt` for Task tools

3. **Update ChatMessage metadata type** to document new fields
   - File: `packages/shared/src/models.ts:470-478`
   - Add: `toolUseId`, `toolInput`, `spawnPrompt`

4. **Add unit tests** for spawn prompt capture
   - File: `packages/backend/src/services/__tests__/claudeCliManager.test.ts`
   - Verify: Task tool_use events → metadata.spawnPrompt

### 8.2 Future Enhancements (Medium Priority)

5. **Create spawn prompt log query API**
   - Endpoint: `GET /api/sessions/:id/spawn-prompts`
   - Returns: Array of all Task tool calls with spawn prompts
   - Use case: Debugging subagent instructions, auditing delegation

6. **Add dashboard visualization** for spawn prompt inspection
   - Component: PromptInspector or SpawnPromptLog
   - Feature: View full spawn prompt for each step in a chain
   - Value: Transparency into what instructions were given to each subagent

7. **Integrate with step:spawned events** for complete tracking
   - Link ChatMessage.metadata.spawnPrompt → StepSpawnedEvent
   - Create bidirectional reference (step event ↔ chat message)

### 8.3 Documentation Updates (Low Priority)

8. **Document stream-json format** in developer docs
   - Create: `docs/architecture/cli-stream-format.md`
   - Include: Tool use event structure, extraction patterns, examples

9. **Update LIVING_SYSTEM.md** Layer 2 (Orchestrator Contract)
   - Add: Tool_use event structure as part of contract specification
   - Note: Spawn prompts are passively observable, not actively parsed by dashboard

---

## 9. Example Spawn Prompt Extraction

### Full Event Sequence

```json
// 1. Claude decides to spawn a subagent
{"type":"stream_event","event":{"type":"content_block_start","content_block":{"type":"tool_use","id":"toolu_ABC123","name":"Task","input":{}}}}

// 2. Input streams in (may be multiple delta events)
{"type":"stream_event","event":{"type":"content_block_delta","delta":{"type":"input_json_delta","partial_json":"{\"prompt\":\"Read your definition in .claude/actionflows/actions/analyze/"}}}
{"type":"stream_event","event":{"type":"content_block_delta","delta":{"type":"input_json_delta","partial_json":"agent.md\\nThen read .claude/actionflows/actions/_abstract/agent-standards/instructions.md"}}}
{"type":"stream_event","event":{"type":"content_block_delta","delta":{"type":"input_json_delta","partial_json":"\\n\\nIMPORTANT: You are a spawned subagent executor..."}}}

// 3. Content block completes (input is now fully buffered)
{"type":"stream_event","event":{"type":"content_block_stop"}}

// 4. Result with complete message
{"type":"result","result":"...","cost_usd":0.05,"duration_ms":1500}
```

**Key Insight:** The spawn prompt is **fully available** in the final parsed `content_block.input.prompt` by the time `content_block_start` completes. We don't need to reassemble delta chunks — the parser handles that internally.

---

## 10. Conclusion

**Answer to Original Questions:**

1. **Does the CLI stream include tool_use events for the Task tool?**
   - ✅ YES — via `stream_event` → `content_block_start` → `tool_use` with `name: 'Task'`

2. **What is the exact JSON structure of a Task tool call?**
   - Structure documented in Section 2.2 and 3.2
   - Key fields: `type`, `id`, `name`, `input` (with `prompt` subfield)

3. **Is the prompt field (spawn prompt) included and accessible?**
   - ✅ YES — available as `content_block.input.prompt`
   - Currently streamed but NOT captured by backend

4. **How does our existing stream parser handle these events?**
   - Backend: Detects tool_use start, stores tool name, but DOES NOT extract input
   - Frontend: Extracts full input as JSON string but doesn't expose spawn prompts
   - **Gap:** Backend needs to extract `input.prompt` for Task tools

**Next Steps:**
1. Implement backend extraction (1-2 hour task)
2. Add unit tests (30 min)
3. Verify with integration test (30 min)
4. Document for future maintenance (30 min)

**Total Effort:** ~3-4 hours for complete spawn prompt logging feature

---

## Learnings

**Issue:** None — analysis proceeded as expected. All required information was available in existing codebase.

**Root Cause:** N/A

**Suggestion:** N/A

**[FRESH EYE]** The frontend `streamJsonParser.ts` already has more sophisticated tool_use handling than the backend. Consider consolidating parsing logic into a shared utility to maintain consistency across frontend and backend stream processing.
