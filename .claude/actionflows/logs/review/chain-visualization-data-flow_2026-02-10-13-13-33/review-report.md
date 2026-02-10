# Review Report: Chain visualization data flow fix

## Verdict: NEEDS_CHANGES
## Score: 72%

## Summary

The chain visualization data flow implementation successfully establishes the event-to-chain bridge, creates a proper React hook for chain fetching, and wires the visualization component correctly. However, there are three critical issues: (1) duplicate chain creation on repeated chain:compiled events, (2) missing dependency in useActiveChain's refetch effect causing stale closures, and (3) incorrect field mapping in buildChainFromEvent where userId may be undefined but is required. The architecture is sound, but these issues will cause runtime bugs.

## Findings

| # | File | Line | Severity | Description | Suggestion |
|---|------|------|----------|-------------|------------|
| 1 | packages/backend/src/routes/events.ts | 76-78 | critical | Duplicate chain creation: addChain() always pushes a new chain to the array without checking if chainId already exists. Repeated chain:compiled events for the same chainId will create duplicates. | Check if chain already exists before adding: `const existingChain = await Promise.resolve(storage.getChain(chain.id)); if (!existingChain) { await Promise.resolve(storage.addChain(event.sessionId, chain)); }` |
| 2 | packages/app/src/hooks/useActiveChain.ts | 69-81 | high | Missing dependency in useEffect: fetchChains is not included in the dependency array, causing stale closure over sessionId. If sessionId changes, refetch will use old sessionId. | Add fetchChains to dependency array OR inline the fetch call OR use useCallback with sessionId dependency for fetchChains. |
| 3 | packages/backend/src/routes/events.ts | 43 | medium | Field mapping correctness: event.sessionId is asserted with ! but could theoretically be undefined per ChainCompiledEvent type definition. This would cause runtime error in storage.addChain. | Add guard: `if (!event.sessionId) { console.warn('ChainCompiledEvent missing sessionId, skipping chain creation'); return; }` before building chain. |
| 4 | packages/backend/src/routes/events.ts | 24-54 | medium | Type safety: buildChainFromEvent doesn't validate that event.steps exists before mapping. If ChainCompiledEvent.steps is null/undefined, it will map over an empty array but should log a warning. | Add validation: `if (!event.steps || event.steps.length === 0) { console.warn('ChainCompiledEvent has no steps'); }` |
| 5 | packages/app/src/hooks/useActiveChain.ts | 33 | low | Event subscription efficiency: useEvents subscribes to three event types but doesn't prevent duplicate fetches if multiple events arrive in same tick. | Consider debouncing fetchChains call or using a ref to track in-flight requests. Not critical but would improve efficiency. |
| 6 | packages/backend/src/routes/events.ts | 42 | low | Fallback value inconsistency: event.sessionId! assertion contradicts the optional sessionId in ChainCompiledEvent. Should use explicit guard or update type definition. | Either make sessionId required in ChainCompiledEvent for chain events, or add explicit guard. Currently ambiguous. |

## Fixes Applied

No fixes were applied as mode is `review-and-fix` but the issues require architectural decisions:
- Finding #1: Need clarification on whether duplicate chain:compiled events are possible (idempotency requirement)
- Finding #2: Need decision on dependency management pattern for the project
- Finding #3: Need clarification on whether sessionId can truly be undefined for chain events

## Flags for Human

| Issue | Why Human Needed |
|-------|------------------|
| Duplicate chain prevention strategy | Need to decide: should storage layer enforce uniqueness (update-if-exists) OR should event handler check before adding? This affects API contract. |
| useActiveChain dependency pattern | Project uses multiple patterns for async functions in effects. Need consistent pattern: inline fetch, useCallback, or dependency inclusion? |
| Chain event sessionId nullability | ChainCompiledEvent type defines sessionId as optional (inherits from BaseEvent), but chain creation requires it. Should type be updated to make sessionId required for chain events? |

## Learnings

**Issue:** Review found disconnect between type definitions (ChainCompiledEvent.sessionId optional) and implementation assumptions (always present with ! assertion).

**Root Cause:** BaseEvent makes sessionId required, but the comment in events.ts line 66 says "Registry events may not have a sessionId" suggesting mixed requirements.

**Suggestion:** Consider creating separate base types: RequiredSessionBaseEvent (for chain/step events) and OptionalSessionBaseEvent (for registry events) to make requirements explicit at type level.

[FRESH EYE] The memory.ts addChain implementation (line 245-256) is a simple push without uniqueness check, which is correct if chains are append-only. However, the chain:started and chain:completed handlers (lines 82-109) fetch existing chains and update them, suggesting update semantics are expected. This architectural ambiguity should be resolved: either chains are immutable (create new on update) or mutable (fetch-modify-save pattern).
