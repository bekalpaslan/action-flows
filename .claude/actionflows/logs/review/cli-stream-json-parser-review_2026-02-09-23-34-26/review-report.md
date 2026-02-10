# Review Report: Stream-JSON Parser Implementation

## Verdict: NEEDS_CHANGES
## Score: 75%

## Summary

The stream-json parser implementation is fundamentally sound with good JSONL buffering logic and appropriate JSON parse error handling. However, there are several medium-severity issues that should be addressed: the buffer lacks memory safety bounds, the incomplete line handling has edge cases with consecutive chunks, and the content extraction logic misses handling for empty content fields. The implementation will work correctly in most scenarios but could fail or cause resource exhaustion in edge cases.

## Findings

| # | File | Line | Severity | Description | Suggestion |
|---|------|------|----------|-------------|------------|
| 1 | packages/backend/src/services/claudeCliSession.ts | 33 | medium | Buffer has no maximum size limit — could cause memory exhaustion with malformed input or very long message streams | Add buffer size limit (e.g., 1MB max) and truncate/reset if exceeded. Add logic: `if (this.stdoutBuffer.length > 1048576) { this.stdoutBuffer = lines[lines.length - 1] \|\| ''; console.warn('[ClaudeCliSession] Buffer overflow, resetting'); }` |
| 2 | packages/backend/src/services/claudeCliSession.ts | 64-67 | medium | Consecutive chunks that both end mid-line will cause last incomplete line from chunk N to be lost when chunk N+1 arrives (lines.pop() overwrites previous incomplete line) | Change buffer accumulation: Instead of `this.stdoutBuffer = lines.pop() \|\| ''`, use `this.stdoutBuffer = lines[lines.length - 1] \|\| ''` to preserve. Better yet, don't split-then-pop: keep buffer, find last complete newline, process up to there, keep remainder. |
| 3 | packages/backend/src/services/claudeCliSession.ts | 84-93 | medium | Content extraction doesn't handle empty strings — if `parsed.message.content === ''` or `parsed.result === ''`, empty string is truthy but produces no output, causing silent message loss | Add explicit empty string checks: `if (parsed.type === 'assistant' && parsed.message?.content !== undefined) { outputs.push(parsed.message.content); }` (check !== undefined instead of truthiness) |
| 4 | packages/backend/src/services/claudeCliSession.ts | 99-101 | low | JSON parse fallback passes raw text with potentially very long lines (substring(0, 100) only in log, full line goes to outputs) — could cause UI rendering issues | Either truncate fallback output to reasonable length (e.g., 10KB) or add length warning. Consider: `const truncated = trimmedLine.length > 10000 ? trimmedLine.substring(0, 10000) + '... [truncated]' : trimmedLine; outputs.push(truncated);` |
| 5 | packages/backend/src/services/claudeCliSession.ts | 84-96 | low | Unknown message types are logged but not surfaced to user — valid but unhandled message types would be invisible (e.g., future protocol additions like 'metadata', 'status') | Consider adding unknown message types to output with prefix like `[Unknown message type: ${parsed.type}]` or surface as debug output to stderr handlers |
| 6 | packages/backend/src/services/claudeCliSession.ts | 59-106 | low | No validation of JSON structure — assumes `parsed.type`, `parsed.message`, `parsed.result`, `parsed.error` exist but doesn't validate they are strings/objects | Add basic type validation: `if (typeof parsed.type !== 'string') continue;` before switch logic, and `if (typeof parsed.message?.content !== 'string') continue;` in content extraction |
| 7 | packages/backend/src/services/claudeCliSession.ts | 143-145 | medium | Race condition possible: if parseStreamJson() returns empty string because no complete lines exist yet, no broadcast happens — but subsequent chunk might complete the line, broadcasting only the second chunk's content (first chunk's partial data lost) | This is actually correct behavior (wait for complete line), but document this behavior in code comment: `// Note: Empty parsedOutput is expected when chunk contains incomplete JSON line` |
| 8 | packages/backend/src/services/claudeCliSession.ts | 33 | low | Buffer is never explicitly cleared on process exit — minor memory leak if manager keeps process objects after exit | Add buffer reset in exit handler (line ~159): `this.stdoutBuffer = '';` |

## Fixes Applied

No fixes applied (review-only mode).

## Flags for Human

| Issue | Why Human Needed |
|-------|------------------|
| Finding #2 - Buffer concatenation edge case | This is a subtle edge case that requires careful testing. The current implementation works for most real-world scenarios (complete chunks or single incomplete line), but consecutive incomplete chunks could cause data loss. Need to decide if this edge case is worth the complexity of a more sophisticated buffer. |
| Finding #7 - Empty broadcast interpretation | This is marked as a finding but is actually correct behavior. The human should confirm whether this deserves a clarifying comment or if the implementation is self-documenting enough. |
| Memory limit policy | Finding #1 suggests 1MB buffer limit. Human should decide appropriate limit based on expected Claude CLI output characteristics (normal messages vs. very long code generation). |

## Test Coverage Recommendations

The following test cases should be added to prevent regressions:

1. **Buffer overflow**: Send message larger than reasonable limit (10MB+), verify graceful handling
2. **Consecutive incomplete chunks**: Send `'{"type":"assi'` then `'stant","message":{"content":"hello"}}\\n'`, verify "hello" appears once
3. **Empty content fields**: Send `{"type":"assistant","message":{"content":""}}`, verify empty message is handled
4. **Malformed JSON with very long lines**: Send 100KB non-JSON line, verify truncation/logging
5. **Multiple complete messages in single chunk**: Send `'{"type":"assistant","message":{"content":"A"}}\\n{"type":"assistant","message":{"content":"B"}}\\n'`, verify both "A" and "B" appear
6. **Rapid consecutive chunks**: Send 100 small chunks rapidly, verify no message loss or race conditions
7. **Mixed complete and incomplete**: Send `'{"type":"assistant","message":{"content":"complete"}}\\n{"type":"assi'` then `'stant","message":{"content":"split"}}\\n'`, verify both messages appear

## Architecture Notes

**Positive patterns:**
- JSONL format is correct choice for streaming Claude CLI communication
- Buffer accumulation + split-by-newline is standard JSONL parsing pattern
- Fallback to raw text on parse error provides graceful degradation
- Separate event handlers maintain clean separation of concerns

**Potential improvements:**
- Consider using a battle-tested JSONL parsing library (e.g., `ndjson`, `jsonlines`) instead of hand-rolled parser
- If hand-rolling, extract to separate utility function/class for better testability
- Add metrics/logging for buffer high-water mark to monitor memory usage in production

## Contract Compliance

This code does not produce contract-defined output (it's internal parsing logic), so contract compliance N/A.

The parsed output is passed to event handlers which eventually produce `ClaudeCliOutputEvent` — those events should follow the event schema in `packages/shared/src/events.ts`.

---

**Review completed:** 2026-02-09 23:34:26
**Reviewed by:** review/ (sonnet)
**Files reviewed:** 1 (packages/backend/src/services/claudeCliSession.ts)
**Lines reviewed:** 283
