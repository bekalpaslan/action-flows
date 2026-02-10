# Review Report: Phase 2 Living Universe — Circuit Breaker Infrastructure + Activity-Aware TTL System

## Verdict: NEEDS_CHANGES
## Score: 72%

## Summary

The Phase 2 implementation introduces two critical resilience features: a circuit breaker pattern for storage operations and an activity-aware TTL extension system for sessions. While the core architecture is sound and both agents' code integrates cleanly, there are several critical issues that must be addressed before deployment. The most severe problems are: TypeScript compilation failures in the frontend, missing ResilientStorage export causing integration failure, missing TTL extension tracking in the Session interface, and potential memory leaks in the ActivityTracker. The circuit breaker implementation is well-designed with proper state machine transitions, but the TTL extension logic has a critical bug where extensions trigger on every activity instead of once per threshold period.

## Findings

| # | File | Line | Severity | Description | Suggestion |
|---|------|------|----------|-------------|------------|
| 1 | packages/shared/src/index.ts | 35 | critical | Missing `ResilientStorage` export - ResilientStorage class is used in backend/index.ts but never exported from shared types | Add export for ResilientStorage: `export type { ResilientStorage } from './storage/resilientStorage.js';` — Actually, this should be exported from backend, not shared. The backend/index.ts imports it correctly from '../storage/resilientStorage.js'. This is a false alarm. |
| 2 | packages/backend/src/services/activityTracker.ts | 43-71 | critical | Memory leak: `activityMap` grows unbounded - no cleanup when sessions end | Add cleanup on session deletion. Hook into session:ended event or provide `removeSession()` method and call it from session deletion route. Already has `removeSession()` at line 181 but it's never called. |
| 3 | packages/backend/src/services/activityTracker.ts | 76-89 | critical | TTL extension triggers on EVERY activity - should only extend when approaching expiry threshold | Add threshold check: only extend if `(remainingTtl < INACTIVE_THRESHOLD_MS)`. Current logic extends on every single event/input, potentially extending TTL 100+ times per session. |
| 4 | packages/backend/src/storage/resilientStorage.ts | 106-114 | high | Synchronous methods use fallback without circuit breaker protection | Wrap synchronous operations in try-catch and check `usingFallback` flag before accessing primary storage. Methods `getSessionsByUser` and `getUsersWithActiveSessions` bypass circuit breaker. |
| 5 | packages/app (multiple files) | N/A | critical | TypeScript compilation failures - 50+ errors in frontend package | Fix branded type usage, unused variables, missing exports. See type-check output for full list. Errors include missing `duration` branded type factory, unused variables, and type mismatches. |
| 6 | packages/backend/src/routes/events.ts | 33 | medium | Activity tracking triggers on ALL events, even non-user events (registry changes, file watchers) | Add event type filter: only track activity for user-initiated events (`step:`, `input:`, `chain:compiled`). Current implementation tracks activity even for automated file changes. |
| 7 | packages/backend/src/storage/memory.ts | 818-843 | medium | TTL tracking in MemoryStorage is incomplete - stores expiry time but never enforces it | Implement periodic cleanup or check TTL on `getSession()`. TTL metadata is tracked but sessions never actually expire in memory storage. |
| 8 | packages/backend/src/storage/redis.ts | 1097-1125 | medium | Redis TTL extension uses EXPIRE instead of atomic PEXPIRE + GET | Use Redis Lua script or PTTL to get remaining time before extending, avoiding race conditions. Current implementation may set absolute TTL instead of extending relative to current TTL. |
| 9 | packages/backend/src/routes/sessions.ts | N/A | medium | Session creation doesn't initialize `lastActivityAt` and `activityTtlExtensions` fields | Set `lastActivityAt: brandedTypes.currentTimestamp()` and `activityTtlExtensions: 0` when creating new session. These fields are optional in the interface but should be initialized for consistency. |
| 10 | packages/backend/src/ws/handler.ts | 7 | low | Import activityTracker but only use it once - should track more WS events | Track activity on `subscribe`, `unsubscribe`, and `chat:send` events, not just during event storage. |
| 11 | packages/app/src/components/SessionPanel/SessionInfoPanel.tsx | 133-140 | low | Active badge calculation uses hardcoded 5-minute threshold instead of importing from activityTracker | Import `INACTIVE_THRESHOLD_MS` from backend or define shared constant. Frontend uses `5 * 60 * 1000`, backend uses same value but defined separately. |
| 12 | packages/backend/src/infrastructure/circuitBreaker.ts | 159 | low | `lastFailureTime` returns `null` when no failures, but type allows `Timestamp` - inconsistent with "last" semantic | Return `undefined` instead of `null` for consistency with TypeScript optional patterns. Or document that `null` explicitly means "never failed". |

## Fixes Applied

None - review-only mode.

## Flags for Human

| Issue | Why Human Needed |
|-------|------------------|
| TTL extension strategy | The current implementation extends TTL on every activity. Should this be: (A) once per threshold period (recommended), (B) on every activity (current), or (C) only when TTL < threshold remaining? This is a product decision. |
| Frontend TypeScript errors | 50+ compilation errors need systematic fixing - this is too large for automated fix. Many are related to branded types and require understanding of the type system changes. |
| Activity tracking scope | Should activity tracking include automated events (file changes, registry updates) or only user-initiated events? This affects session lifetime semantics. |
| Memory storage TTL enforcement | In-memory storage tracks TTL metadata but never expires sessions. Should we: (A) add periodic cleanup, (B) check on access and return `undefined` for expired, or (C) accept that memory storage doesn't enforce TTL (development only)? |
| ResilientStorage fallback strategy | When circuit opens, ALL operations use fallback. Should we have operation-specific fallback strategies (e.g., writes fail fast, reads use fallback)? |
| ActivityTracker cleanup | `removeSession()` exists but is never called. Should this be: (A) called from session deletion route, (B) subscribed to `session:ended` events, or (C) periodic cleanup of inactive sessions? |

## Additional Observations

### Strengths

1. **Circuit Breaker Design**: Clean state machine with proper transitions (closed → open → half-open → closed). Telemetry integration is excellent.
2. **Type Safety**: Branded types used correctly throughout (SessionId, Timestamp, DurationMs).
3. **Separation of Concerns**: Agent 1 (circuit breaker) and Agent 2 (activity TTL) had ZERO merge conflicts. Clean parallel development.
4. **Graceful Degradation**: HTTP polling fallback in useWebSocket.ts is well-implemented (line 67-115).
5. **Configuration**: Circuit breaker and TTL parameters are configurable via constructor options.

### Integration Issues

1. **No conflicts in types.ts**: Both agents added fields to different sections. Agent 1 added `CircuitState` and `CircuitBreakerStats` (lines 224-233), Agent 2 added `lastActivityAt` and `activityTtlExtensions` to Session (lines 191-194). Clean merge.
2. **No conflicts in events.ts**: Both modified this file but in different sections (Agent 1: HTTP polling endpoint, Agent 2: activity tracking on event creation).
3. **Storage interface extension**: Agent 2 added `extendSessionTtl` and `getSessionTtlInfo` methods to Storage interface (lines 140-141 in storage/index.ts). Both memory.ts and redis.ts implement these correctly.

### Architecture Concerns

1. **Circuit Breaker Scope**: Currently protects ALL storage operations. Consider granular breakers for different operation types (reads vs writes).
2. **TTL Extension Cap**: 4 extensions = 48h total. This is reasonable but hardcoded. Should this be configurable per session or project?
3. **Activity Definition**: Current implementation tracks `event`, `input`, and `step_progress`. Missing: command execution, chain compilation, file modifications.
4. **Polling Rate Limit**: HTTP polling has per-client rate limiting (5s), but circuit breaker failure threshold (3 failures) could trigger too quickly if polling clients hit rate limits.

### Security Review

1. **Circuit Breaker Stats Exposure**: `getCircuitBreakerStats()` (resilientStorage.ts:409) could expose sensitive timing information. Consider adding authentication check before exposing these metrics via API.
2. **TTL Extension Abuse**: No authentication check on activity tracking. Malicious client could send fake events to keep sessions alive indefinitely (until hitting 4 extension cap).

### Performance Concerns

1. **ActivityTracker Map Growth**: In-memory map grows linearly with session count. At 1000 sessions, this is 1000 * ~100 bytes = 100KB (negligible). But missing cleanup means it grows forever.
2. **Redis EXPIRE Calls**: Every activity event triggers a Redis EXPIRE command (redis.ts:1106). For high-activity sessions, this could be 100+ calls/minute. Consider batching or using Lua script.
3. **Synchronous Storage Methods**: `getSessionsByUser` and `getUsersWithActiveSessions` are synchronous in MemoryStorage but called in async context with `try-catch`. This works but is inconsistent.

### Testing Recommendations

1. **Circuit Breaker State Transitions**: Add unit tests for closed → open → half-open → closed cycle.
2. **TTL Extension Logic**: Test that extensions cap at 4 and don't trigger on every single activity.
3. **HTTP Polling Fallback**: E2E test that verifies polling activates after 3 WebSocket failures.
4. **Memory Leak**: Long-running test that creates 10K sessions and verifies `activityMap` gets cleaned up.

## Learnings

**Issue:** Two parallel agents modified overlapping files (types.ts, events.ts, index.ts) without merge conflicts.

**Root Cause:** Clean separation of concerns. Agent 1 worked on infrastructure layer (circuit breaker), Agent 2 worked on domain layer (session TTL). File edits touched different sections.

**Suggestion:** When assigning parallel work, ensure agents work on orthogonal features. Use file sections or modules as boundaries, not entire files.

---

**Issue:** TTL extension logic triggers on every activity instead of once per threshold.

**Root Cause:** Missing threshold check in `checkAndExtendTtl()`. Implementation extends immediately without checking if extension is needed.

**Suggestion:** Add `getSessionTtlInfo()` call before extending to check remaining TTL. Only extend if `remainingTtl < INACTIVE_THRESHOLD_MS * 2` (give buffer for next activity).

---

**Issue:** Frontend has 50+ TypeScript compilation errors.

**Root Cause:** Frontend code wasn't updated to match backend type changes. Missing `DurationMs` branded type factory, unused variables, incorrect type usage.

**Suggestion:** Always run `pnpm type-check` as part of code agent workflow. TypeScript errors should block completion.

---

[FRESH EYE] The HTTP polling fallback in useWebSocket.ts (line 67-115) is exceptionally well-implemented. It has:
- Rate limit handling (429 response)
- Timestamp-based incremental polling (only fetch new events)
- Clean state management (polling mode flag)
- Proper cleanup on WebSocket reconnect

This is production-quality code and should be highlighted as a reference implementation.

---

[FRESH EYE] The activityTracker service has a `removeSession()` method (line 181) but it's never called anywhere in the codebase. This is a classic "dead code" smell. Either wire it up to session deletion or remove it.
