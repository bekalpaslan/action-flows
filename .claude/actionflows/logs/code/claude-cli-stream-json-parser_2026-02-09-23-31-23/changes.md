# Code Changes: Claude CLI Stream-JSON Parser

## Files Modified

| File | Change |
|------|--------|
| `packages/backend/src/services/claudeCliSession.ts` | Added stream-json JSONL parser to extract clean text content from Claude CLI stdout |

## Implementation Details

### Added Components

1. **Private buffer field** (line 35):
   - `stdoutBuffer: string` - Accumulates partial JSONL lines between chunks

2. **Stream-JSON parser method** (lines 54-112):
   - `parseStreamJson(chunk: string): string` - Parses JSONL format from Claude CLI
   - Handles line buffering for chunked streams
   - Extracts content from JSON message types:
     - `assistant` messages → extracts `message.content`
     - `result` messages → extracts `result` field
     - `error` messages → extracts `error` field with `[ERROR]` prefix
     - Unknown types → logs but doesn't display
   - Fallback to raw text on JSON parse errors with warning log

3. **Updated stdout handler** (lines 132-143):
   - Logs received chunk byte count for debugging
   - Calls `parseStreamJson()` to extract clean text
   - Only broadcasts if parsed content is non-empty (complete lines)
   - Preserves immediate data handler pattern (no async) to prevent buffering hangs

### Message Type Handling

The parser handles Claude CLI's `--output-format stream-json` JSONL format:

```json
{"type":"assistant","message":{"role":"assistant","content":"Hello!"}}
{"type":"result","result":"Task completed"}
{"type":"error","error":"Something went wrong"}
```

Each JSON object is on a single line, and the parser extracts the relevant text content.

### Edge Cases Handled

- Partial JSON lines from chunked Node.js streams → buffered until complete
- Empty lines → skipped
- Malformed JSON → logged with warning, raw text passed as fallback
- Very large messages → handled incrementally via line buffer
- Multiple complete lines in single chunk → all processed

## Verification

- **Type check (backend):** PASS
- **Type check (full workspace):** Frontend has pre-existing errors, backend clean
- **Notes:** Implementation follows existing Express + TypeScript patterns, preserves immediate data handler to prevent buffering hangs, maintains event handler interface compatibility

## Root Cause Fixed

The Claude CLI subprocess was configured with `--output-format stream-json` (claudeCliManager.ts lines 157-167) which emits JSONL on stdout. The original stdout handler (lines 80-83) treated output as raw text and broadcast it directly without JSON parsing.

Now the stdout handler:
1. Accumulates chunks into a line buffer
2. Splits buffer by newlines (JSONL format)
3. Parses each complete JSON line
4. Extracts clean text content from the parsed structure
5. Passes clean text to event handlers (not raw JSON)
6. Keeps last incomplete fragment in buffer for next chunk

Frontend components already correctly consume `ClaudeCliOutputEvent.output` as string, so no frontend changes needed.
