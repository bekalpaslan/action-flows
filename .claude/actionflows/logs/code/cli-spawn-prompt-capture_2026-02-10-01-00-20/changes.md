# Code Changes: CLI Spawn Prompt Capture

## Summary

Implemented passive capture of Task tool spawn prompts from the Claude CLI stream. The spawn prompt (the full instruction sent to each spawned subagent) is now extracted from `content_block_start` events and stored in ChatMessage metadata, enabling dashboard transparency into agent delegation.

## Files Modified

| File | Change |
|------|--------|
| `packages/backend/src/services/claudeCliSession.ts` | Extended `StreamJsonMessage.event.content_block` interface to include `id?: string` and `input?: unknown` fields for tool input extraction |
| `packages/shared/src/models.ts` | Extended `ChatMessage.metadata` type to include `toolUseId?: string`, `toolInput?: unknown`, and `spawnPrompt?: string` fields |
| `packages/backend/src/services/claudeCliManager.ts` | Enhanced `raw-json` handler to extract tool use ID, tool input, and spawn prompt (for Task tools specifically) from `content_block_start` events |

## Files Created

None — only modifications to existing files.

## Implementation Details

### 1. Type Extension (claudeCliSession.ts)

**Before:**
```typescript
content_block?: { type?: string; name?: string };
```

**After:**
```typescript
content_block?: {
  type?: string;
  name?: string;
  id?: string;        // Tool use ID for correlation
  input?: unknown;    // Tool input object (spawn prompt is here)
};
```

### 2. Metadata Type Extension (models.ts)

**Before:**
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

**After:**
```typescript
metadata?: {
  model?: string;
  stopReason?: string;
  toolName?: string;
  toolUseId?: string;       // NEW: Tool use ID
  toolInput?: unknown;      // NEW: Full tool input
  spawnPrompt?: string;     // NEW: Extracted spawn prompt (Task tool only)
  stepNumber?: number;
  costUsd?: number;
  durationMs?: number;
};
```

### 3. Stream Handler Enhancement (claudeCliManager.ts)

**Added logic at line 274-289:**
```typescript
if (msg.event.content_block.id) {
  aggregator.setMetadata('toolUseId', msg.event.content_block.id);
}
if (msg.event.content_block.input) {
  aggregator.setMetadata('toolInput', msg.event.content_block.input);
  // Special handling for Task tool spawn prompts
  if (
    msg.event.content_block.name === 'Task' &&
    typeof msg.event.content_block.input === 'object' &&
    msg.event.content_block.input !== null &&
    'prompt' in msg.event.content_block.input
  ) {
    const prompt = (msg.event.content_block.input as { prompt?: unknown }).prompt;
    if (typeof prompt === 'string') {
      aggregator.setMetadata('spawnPrompt', prompt);
    }
  }
}
```

**What this does:**
- Captures tool use ID for all tool_use events
- Captures full tool input object for all tools
- For Task tools specifically, extracts the `prompt` field and stores it as `spawnPrompt`
- Uses type guards to ensure safety when accessing nested properties

## Data Flow

```
Claude CLI stdout (stream-json JSONL)
  ↓
claudeCliSession.parseStreamJson()
  ↓ (emits raw-json event with StreamJsonMessage)
claudeCliManager raw-json handler
  ↓ (detects content_block_start with type=tool_use, name=Task)
Extract content_block.input.prompt
  ↓
aggregator.setMetadata('spawnPrompt', prompt)
  ↓
ChatMessage stored with metadata.spawnPrompt
  ↓
Broadcast via WebSocket as chat:message event
  ↓
Dashboard can query/display spawn prompts
```

## Verification

- **Type check (backend):** ✅ PASS
- **Type check (shared):** ✅ PASS
- **Type check (full workspace):** Frontend has pre-existing errors unrelated to these changes
- **Notes:** Implementation follows exact specification from analyze report at `.claude/actionflows/logs/analyze/cli-stream-task-events_2026-02-10-00-45-09/report.md`

## Testing Recommendations

### Unit Test (claudeCliManager.test.ts)

Add test case:
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

  session.emit('raw-json', mockStreamEvent);

  const messages = getCapturedMessages();
  expect(messages[0].metadata.toolName).toBe('Task');
  expect(messages[0].metadata.spawnPrompt).toBe('Read your definition...');
  expect(messages[0].metadata.toolUseId).toBe('toolu_test123');
});
```

### Integration Test

Verify spawn prompts are captured in live CLI sessions by:
1. Starting a CLI session with a prompt that spawns subagents
2. Querying chat history after Task tool_use events
3. Verifying `metadata.spawnPrompt` is populated for all Task messages

## Next Steps

1. **Add unit tests** for spawn prompt extraction logic
2. **Create dashboard UI** to display spawn prompts in chat history or step inspector
3. **Add API endpoint** `GET /api/sessions/:id/spawn-prompts` for querying all spawns
4. **Link with step events** — correlate ChatMessage.metadata.spawnPrompt with StepSpawnedEvent for bidirectional tracking
