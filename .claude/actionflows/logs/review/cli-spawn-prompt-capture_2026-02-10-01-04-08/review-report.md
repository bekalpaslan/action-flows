# Review Report: CLI Spawn Prompt Capture Implementation

## Verdict: APPROVED
## Score: 95%

## Summary

The implementation correctly adds passive capture of Task tool spawn prompts from the Claude CLI stream. All three files exhibit proper type safety, follow existing patterns, and maintain backward compatibility. The extraction logic correctly uses type guards to safely access nested properties. Minor documentation improvements and test coverage would further strengthen the implementation.

## Findings

| # | File | Line | Severity | Description | Suggestion |
|---|------|------|----------|-------------|------------|
| 1 | packages/backend/src/services/claudeCliManager.ts | 281-291 | low | Type guard is verbose but safe. Could be extracted to a utility function for reusability. | Consider extracting `isTaskToolInput` type guard: `function isTaskToolInput(input: unknown): input is { prompt: string } { ... }` |
| 2 | packages/shared/src/models.ts | 470-480 | low | New metadata fields lack JSDoc comments while existing fields like `model` and `stopReason` also lack them (existing pattern). | Add JSDoc comments to all metadata fields for clarity: `/** Tool use ID for correlation with tool_result events */` |
| 3 | packages/backend/src/services/claudeCliSession.ts | 21-27 | low | New `content_block` fields (`id`, `input`) are correctly optional but lack inline comments explaining their purpose. | Add inline comment: `id?: string; // Tool use ID (only present for tool_use events)` |

## Fixes Applied

N/A — Review-only mode (no fixes applied).

## Flags for Human

| Issue | Why Human Needed |
|-------|-----------------|
| Test Coverage | Implementation lacks unit tests for spawn prompt extraction logic. The code/ agent's changes.md recommends adding tests (lines 127-162), but tests were not implemented. Human should decide whether to add tests in follow-up or accept as-is. |
| Dashboard UI Integration | New metadata fields (`spawnPrompt`, `toolUseId`, `toolInput`) are captured but not yet consumed by frontend. Human should decide priority for UI features to display spawn prompts in chat history or step inspector. |

## Detailed Analysis

### Type Safety ✅

**models.ts (lines 474-476):**
- New optional metadata fields correctly typed:
  - `toolUseId?: string` — String type appropriate for Claude API tool use IDs
  - `toolInput?: unknown` — Correctly uses `unknown` for unvalidated external data (safer than `any`)
  - `spawnPrompt?: string` — String type appropriate for prompt content
- All fields are optional (backward compatible)
- No `any` types used
- Follows existing metadata pattern (consistent with `model?`, `stopReason?`, etc.)

**claudeCliSession.ts (lines 24-25):**
- Extended `StreamJsonMessage.event.content_block` interface:
  - `id?: string` — Correct type for tool use IDs from Claude API
  - `input?: unknown` — Correctly uses `unknown` (follows TypeScript best practices for unvalidated data)
- Both fields optional (backward compatible with existing parsers)
- No breaking changes to existing stream parsing logic

**claudeCliManager.ts (lines 275-291):**
- Type guards correctly validate nested properties before access:
  - Line 278: `if (msg.event.content_block.input)` — Checks existence
  - Line 281-285: Validates `input` is object, non-null, and has `prompt` property
  - Line 287: `(msg.event.content_block.input as { prompt?: unknown })` — Safe type assertion
  - Line 288: `typeof prompt === 'string'` — Runtime type validation
- No unsafe type assertions or forced type coercion
- Follows defensive programming pattern (guard against malformed data)

### Stream Parsing Correctness ✅

**Event Detection (lines 266-292):**
- Correctly detects `content_block_start` event with `type === 'tool_use'`
- Correctly checks `msg.event.content_block.name === 'Task'` to filter only Task tool spawns
- Extraction logic is isolated to the correct event type (won't misfire on other events)

**Message Boundary Handling (lines 268-270):**
- Correctly finalizes buffered content before starting new tool_use message
- Prevents content cross-contamination between messages

**Metadata Flow:**
- Lines 275-276: Captures `toolUseId` for ALL tool_use events (generic)
- Lines 278-291: Captures `toolInput` and `spawnPrompt` (Task-specific)
- Uses aggregator's `setMetadata()` method (correct API)
- Metadata is preserved through message finalization (verified in ClaudeCliMessageAggregator.ts lines 98-100)

### Backward Compatibility ✅

**No Breaking Changes:**
- All new metadata fields are optional (existing ChatMessage objects valid)
- No changes to required fields or existing field types
- StreamJsonMessage extension is additive-only (existing parsers unaffected)
- Existing event handlers in claudeCliManager.ts remain unchanged

**Graceful Degradation:**
- If `content_block.id` missing → no error, just no `toolUseId` metadata
- If `content_block.input` missing → no error, just no `toolInput`/`spawnPrompt`
- If `input.prompt` missing or not a string → no error, just no `spawnPrompt`
- All guards use early-return pattern (safe failure mode)

**Storage Compatibility:**
- ChatMessage type used in storage layer (MemoryStorage, Redis) accepts optional metadata
- New fields will be transparently stored/retrieved (no schema migration needed)
- WebSocket events broadcast ChatMessage with new fields (clients can ignore unknown fields)

### Performance & Security ✅

**Performance:**
- No new loops or expensive operations
- Type guards are O(1) checks (constant time)
- No redundant data copying (metadata set by reference)
- No memory leaks (metadata cleared on message finalize)

**Security:**
- Uses `unknown` type for untrusted data (safer than `any`)
- Runtime type validation before string coercion (lines 283-288)
- No eval, no dynamic property access by string keys
- No injection risks (spawn prompt is just stored, not executed)
- Input length validation already exists in claudeCliSession.sendInput (line 235-237)

### Pattern Adherence ✅

**Backend Patterns:**
- Follows existing aggregator metadata pattern (same as `model`, `stopReason`, `toolName`)
- Uses discriminated union pattern for event types (existing)
- Async/await not needed (synchronous metadata setting)
- No fire-and-forget promises

**Shared Patterns:**
- ChatMessage follows existing interface pattern (optional fields)
- No branded types needed (toolUseId, spawnPrompt are simple strings, not domain IDs)
- ES module exports (existing)

**TypeScript Patterns:**
- Type guards for runtime validation (best practice)
- Optional chaining candidates: Could use `msg.event.content_block?.name` (but existing code doesn't use ?. extensively, so current style is consistent)

### Edge Cases Considered ✅

1. **Empty spawn prompt:** Line 288 validates `typeof prompt === 'string'` (empty string "" is valid and will be captured)
2. **Non-Task tool_use:** Line 282 filters `name === 'Task'` (other tools like Bash, Read, etc. won't populate `spawnPrompt`)
3. **Malformed input object:** Lines 283-285 check object type and property existence (guards against `input: null`, `input: "string"`, etc.)
4. **Missing content_block:** Line 278 checks existence before access (guards against undefined)
5. **Multiple tool_use in single message:** Each `content_block_start` event triggers new metadata set (overwrites previous, which is correct because each assistant message should have one primary tool_use)

### Test Coverage Gap ⚠️

**Missing Tests:**
- No unit tests for spawn prompt extraction logic
- Existing test file `packages/backend/src/__tests__/claudeCliManager.test.ts` not modified
- Recommended test case (from changes.md lines 127-162) not implemented:
  - Mock `stream_event` with Task tool input
  - Verify `metadata.spawnPrompt` populated
  - Verify `metadata.toolUseId` captured
  - Verify non-Task tools don't set `spawnPrompt`

**Impact:**
- Logic is simple and well-guarded, so low risk of regression
- However, future changes to stream parsing could break this without test coverage alerting

**Recommendation:**
- Add unit test in follow-up commit (suggested in changes.md)
- Test should cover: happy path (Task with prompt), missing fields, non-Task tools

### Fresh Eye Observations

**[FRESH EYE] Metadata Field Naming Consistency:**
- Existing fields use camelCase: `stopReason`, `toolName`, `stepNumber`
- New fields also use camelCase: `toolUseId`, `toolInput`, `spawnPrompt`
- Consistent naming ✅

**[FRESH EYE] Tool Input Storage:**
- `toolInput` stores the ENTIRE tool input object (could be large for complex tools)
- Only `spawnPrompt` field is extracted for Task tools
- This is correct design (preserves full context for future use cases), but:
  - Could add comment explaining why full `input` is stored: "Stores full tool input for debugging and future feature extensions"
  - Frontend might want to display other fields from toolInput for non-Task tools

**[FRESH EYE] Stream Event Type Coverage:**
- Implementation only handles `content_block_start` event type
- Does NOT handle `content_block_stop` (correct, because we only need start event for metadata)
- Does NOT handle `tool_result` events (out of scope for this feature)
- This is correct scoping ✅

**[FRESH EYE] Aggregator Metadata Persistence:**
- Reviewed ClaudeCliMessageAggregator.ts (lines 66-71, 98-100)
- Metadata is correctly copied to finalized message (spread operator on line 99)
- Metadata is correctly reset after finalize (line 106)
- No risk of metadata leaking between messages ✅

**[FRESH EYE] WebSocket Broadcast:**
- ChatMessage with new metadata fields is broadcast via `chat:message` event (line 217-223)
- Frontend will receive `spawnPrompt` field in real-time
- Frontend components (ChatPanel, etc.) currently don't display it (future enhancement)

## Learnings

**Issue:** None — Implementation follows specification exactly and maintains high quality standards.

**Root Cause:** N/A

**Suggestion:** Future implementations should include unit tests in the same commit/chain as the feature code to ensure test coverage from day one.

**[FRESH EYE]:** The spawn prompt capture feature enables powerful dashboard transparency features:
1. **Subagent Inspector** — Show full spawn prompts for each Task tool_use
2. **Chain Debugging** — Trace how orchestrator instructions are passed to agents
3. **Prompt Optimization** — Compare spawn prompts across successful/failed steps
4. **Audit Trail** — Record exact instructions given to each spawned agent

This metadata unlocks significant observability improvements for the ActionFlows system. Consider prioritizing UI components to surface this data (e.g., expandable spawn prompt viewer in chat history, step detail panel with full toolInput inspection).
