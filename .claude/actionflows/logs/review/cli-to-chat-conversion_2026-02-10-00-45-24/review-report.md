# Review Report: CLI-to-Chat Conversion Implementation

## Verdict: NEEDS_CHANGES
## Score: 82%

## Summary
The CLI-to-chat conversion is well-architected and demonstrates strong TypeScript usage with proper type safety. The message aggregation approach is solid, and the WebSocket event flow is correctly implemented. However, there are critical issues with memory leaks in event listeners, a race condition in the aggregator callback registration, and inconsistent error handling patterns. The frontend chat UI is well-designed but has accessibility gaps and missing cleanup logic.

## Findings

| # | File | Line | Severity | Description | Suggestion |
|---|------|------|----------|-------------|------------|
| 1 | claudeCliManager.ts | 211-224 | critical | Memory leak: aggregator callback creates closure over `storage` with async Promise.resolve but never removes listener on session cleanup | Add `aggregator.setMessageCallback(null)` in stopSession/stopAllSessions cleanup logic before dispose() |
| 2 | claudeCliManager.ts | 206-209 | high | Race condition: aggregator is created and stored in map, but callback is registered AFTER event listeners are attached (line 228). If raw-json event fires before line 211, aggregator will emit without callback registered | Move `aggregator.setMessageCallback(...)` to line 208, immediately after `this.aggregators.set()` |
| 3 | claudeCliSession.ts | 52-53 | high | Memory leak: stdoutBuffer is unbounded for incomplete JSONL lines. If malformed stream never sends newline, buffer grows infinitely | Add MAX_LINE_SIZE check (e.g. 100KB) in parseStreamJson before accumulating to stdoutBuffer. Reset buffer if exceeded |
| 4 | claudeCliSession.ts | 111 | medium | Aggregator emits raw-json event with parsed message, but parseStreamJson returns extracted string content. These are two different things - event handlers receive StreamJsonMessage but stdout handlers receive string | Document this dual-path architecture clearly. Consider renaming events to 'raw-json-parsed' vs 'stdout-text' for clarity |
| 5 | ws/handler.ts | 102-123 | medium | Chat history is sent on subscribe, but if getChatHistory throws (Redis connection lost), error is logged but subscription still confirms. Client thinks it subscribed successfully but has incomplete state | Wrap history broadcast in try-catch and send degraded-state notification to client if history fetch fails |
| 6 | claudeCliMessageAggregator.ts | 84-115 | medium | finalizeMessage returns ChatMessage but the return value is never used by callers (claudeCliManager.ts line 253, 261, 277). Inconsistent with dispose() which does use the return | Remove return value from finalizeMessage signature. If needed for testing, expose getLastMessage() getter instead |
| 7 | useChatMessages.ts | 106-112 | medium | useEffect subscribes to session but never checks if sessionId changed while subscription was pending. If user switches sessions quickly, old subscription cleanup might race with new subscription | Add ref to track subscription state and cancel pending operations on cleanup |
| 8 | ChatPanel.tsx | 86-90 | low | Auto-scroll uses smooth behavior but doesn't check if user has manually scrolled up. This interrupts reading previous messages when new messages arrive | Add scroll position detection: only auto-scroll if already at bottom (messagesContainer.scrollTop + clientHeight >= scrollHeight - 50) |
| 9 | ChatPanel.tsx | 54-56 | low | cliStateRef is updated separately from cliState, creating two sources of truth. If setCliState is batched by React, ref and state can briefly desync | Use useReducer or merge into single ref with state setter callback: setCliState(s => { cliStateRef.current = s; return s; }) |
| 10 | storage/memory.ts | 523-530 | low | addChatMessage uses FIFO eviction (splice at start) but getChatHistory returns full array. Max limit is 1000 but frontend doesn't know this - could receive 1000+ messages from reconnect | Document MAX_CHAT_MESSAGES_PER_SESSION in shared types as ChatHistoryLimits constant. Frontend should handle truncated history gracefully |
| 11 | storage/redis.ts | 850-852 | low | Redis chat history uses ltrim -1000 -1 which keeps LAST 1000 messages (most recent). But memory storage splices from start, keeping FIRST 1000 after eviction. Inconsistent behavior between storage backends | Standardize to keep most recent: memory should use splice(0, messages.length - MAX) instead of splice at limit check |
| 12 | ChatPanel.tsx | - | low | No aria-live region for new messages. Screen reader users won't be notified when new messages arrive | Add `<div aria-live="polite" aria-atomic="true" className="sr-only">{messages.length > 0 && messages[messages.length-1].content.substring(0,100)}</div>` |
| 13 | promptButtonSelector.ts | 52-61 | low | Quick responses from session.lastPrompt are mapped to buttons but no deduplication. If session has ['Yes', 'No'] and approval buttons also add Yes/No, duplicates appear | Add Set-based deduplication by button.id before returning from selectPromptButtons |
| 14 | ChatPanel.css | 203-209 | low | .chat-bubble--assistant has border-bottom-left-radius: 4px but .chat-bubble--user has border-bottom-right-radius: 4px. This creates asymmetric bubble tails, but no visual issue mentioned. Potential design inconsistency? | Verify with designer if intentional. If not, use consistent radius or remove tail styling |
| 15 | models.ts | 449-478 | low | ChatMessage interface has metadata.durationMs (number) but ws/handler.ts line 147-154 creates message with duration as string. Type mismatch | Update ChatMessage.metadata.durationMs type to `number \| undefined` and fix ws/handler.ts to not stringify duration |

## Fixes Applied
(None - mode = review-only)

## Flags for Human

| Issue | Why Human Needed |
|-------|------------------|
| Stream-JSON parsing architecture | The dual-path architecture (raw-json events + stdout text extraction) is complex. Confirm this is the intended design vs. emitting only chat:message events from aggregator |
| Chat history reconnect UX | When client reconnects, it receives full history via chat:history event. For long sessions (1000 messages), this could be slow. Consider pagination or replay-from-timestamp strategy |
| Aggregator timeout strategy | 2-second timeout for finalizing messages is hardcoded. Should this be configurable per session type? (e.g. slower for analysis tasks, faster for chat) |
| Message deduplication strategy | useChatMessages uses seenIdsRef Set that grows unbounded. For long sessions, this could consume memory. Consider LRU cache or periodic cleanup |
| Error message categorization | Backend emits errors as ChatMessage with messageType: 'error', but some errors come from stderr (line 129 useChatMessages.ts) and others from stream_event.type='error'. Standardize error handling |
| Frontend-backend type sync | Frontend defines local ChatMessage type (useChatMessages.ts line 19-33) that duplicates shared/models.ts ChatMessage. This will cause drift. Use shared type or add comment explaining temporary duplication |

---

## Learnings

**Issue:** Memory leaks in aggregator callback and unbounded buffer growth
**Root Cause:** Callback functions create closures over storage/session context but aren't cleaned up on session end. JSONL line buffer doesn't have size limit.
**Suggestion:** Always clean up event listeners and callbacks in dispose() methods. Add bounded buffer limits for any accumulation logic.

[FRESH EYE] The ClaudeCliMessageAggregator class is well-designed with timeout-based finalization, but the callback pattern creates tight coupling with storage. Consider using EventEmitter pattern instead: `aggregator.on('message', callback)` with automatic cleanup on `dispose()`. This would make cleanup more explicit and prevent forgotten listener leaks.

[FRESH EYE] Redis and Memory storage have different FIFO eviction semantics (Redis keeps most recent, Memory keeps oldest). This is a subtle bug that will cause test failures when switching storage backends. Add integration tests that verify eviction behavior matches across both implementations.

[FRESH EYE] The frontend useChatMessages hook manually parses stream-JSON and aggregates messages. This duplicates logic already in ClaudeCliMessageAggregator on backend. Once backend starts emitting chat:message events, this frontend parsing can be removed entirely. Consider adding a feature flag to enable/disable frontend aggregation for smooth migration.
