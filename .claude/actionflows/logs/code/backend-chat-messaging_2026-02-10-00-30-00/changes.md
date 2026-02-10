# Code Changes: Backend Chat Messaging Layer

## Files Modified

| File | Change |
|------|--------|
| `packages/shared/src/models.ts` | Added `ChatMessage` interface with id, sessionId, role, content, timestamp, messageType, and metadata fields |
| `packages/shared/src/events.ts` | Added `ChatMessageEvent` and `ChatHistoryEvent` interfaces; added to `WorkspaceEvent` union; added type guards `isChatMessage` and `isChatHistory`; added import for `ChatMessage` from models |
| `packages/shared/src/index.ts` | Exported `ChatMessage`, `ChatMessageEvent`, and `ChatHistoryEvent` |
| `packages/backend/src/services/claudeCliSession.ts` | Added `StreamJsonMessage` interface for raw parsed JSON; added `raw-json` event type to emit parsed JSONL objects for aggregation; added overloads for `on`/`off` with `raw-json` event |
| `packages/backend/src/services/claudeCliManager.ts` | Added aggregators map per session; created `ClaudeCliMessageAggregator` per session in `startSession()`; added `raw-json` handler for message boundary detection (assistant, result, error, stream_event types); captures initial prompt as user message; disposes aggregator on exit; added `getAggregator()` method; cleanup in `stopAllSessions()` |
| `packages/backend/src/storage/index.ts` | Extended `Storage` interface with `getChatHistory()`, `addChatMessage()`, `clearChatHistory()` methods and `chatHistory` map |
| `packages/backend/src/storage/memory.ts` | Implemented chat history storage with `Map<SessionId, ChatMessage[]>`, FIFO eviction at 1000 messages per session, cleanup on session eviction |
| `packages/backend/src/storage/redis.ts` | Implemented chat history storage using Redis lists (`chat:{sessionId}` keys), with 1000-message limit, 24-hour TTL |
| `packages/backend/src/ws/handler.ts` | On subscribe: sends `chat:history` event with full conversation history for reconnect; on input: captures user message via aggregator or direct storage, broadcasts `chat:message` event for user messages |
| `packages/backend/src/routes/sessions.ts` | Added `GET /api/sessions/:id/chat` endpoint returning chat history for a session |

## Files Created

| File | Purpose |
|------|---------|
| `packages/backend/src/services/claudeCliMessageAggregator.ts` | Message aggregation service that buffers stream-JSON chunks, detects message boundaries (result, error, message_stop, 2s timeout fallback), and emits complete ChatMessage objects. Supports user/assistant/system message creation. |

## Verification

- Type check (shared): PASS
- Type check (backend): PASS
- Build (shared): PASS
- Build (backend): PASS
- Type check (frontend): Pre-existing errors unrelated to changes (verified by stash/unstash comparison)
- Notes: Frontend type errors existed before these changes and are not caused by the chat messaging implementation

## Architecture Summary

### Data Flow

```
Claude CLI stdout
  -> ClaudeCliSession.parseStreamJson()
    -> Emits 'raw-json' events with parsed StreamJsonMessage objects
      -> ClaudeCliManager 'raw-json' handler
        -> ClaudeCliMessageAggregator.appendChunk() / setMetadata() / finalizeMessage()
          -> Message callback fires
            -> storage.addChatMessage() (persists to history)
            -> broadcast chat:message event (WebSocket)

User sends input (WebSocket)
  -> ws/handler.ts 'input' case
    -> aggregator.createUserMessage() (creates + emits + stores user ChatMessage)
    -> cliSession.sendInput() (pipes to Claude CLI stdin)

Client subscribes to session (WebSocket)
  -> ws/handler.ts 'subscribe' case
    -> storage.getChatHistory() (loads full history)
    -> Sends chat:history event to client (enables reconnect replay)
```

### Message Boundary Detection

| Signal | Action |
|--------|--------|
| `type: 'assistant'` | Accumulate content, extract model/stopReason metadata |
| `type: 'result'` | Finalize message, extract cost/duration metadata |
| `type: 'error'` | Immediate finalize as error message |
| `type: 'stream_event' + content_block_delta` | Accumulate text chunks |
| `type: 'stream_event' + content_block_start (tool_use)` | Finalize previous, start tool_use message |
| `type: 'stream_event' + message_stop` | Finalize message |
| 2-second timeout | Fallback finalize for chunks without explicit boundary |

### Backward Compatibility

- Existing `claude-cli:output` events continue to be broadcast (marked as deprecated)
- New `chat:message` events are broadcast in parallel
- Both event types carry the same session data
- Frontend can consume either format during migration
