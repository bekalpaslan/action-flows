# Review Report: Phase 3 Living Universe — Coordinated Lifecycle Manager + Snapshot-Based MemoryStorage Persistence

## Verdict: NEEDS_CHANGES
## Score: 72%

## Summary

Phase 3 implementation includes two major components: (1) Coordinated Lifecycle Manager for phase-based resource tracking and eviction coordination, and (2) Snapshot-based persistence for MemoryStorage. The implementation is architecturally sound with good separation of concerns. However, there are **6 critical/high-priority issues** that must be addressed: circular dependency in import strategy, missing snapshot of critical Maps, incorrect async import pattern causing failures, memory growth from unbounded lifecycle state tracking, and missing frontend type exports. The parallel agent integration succeeded without file conflicts, demonstrating good coordination.

## Findings

| # | File | Line | Severity | Description | Suggestion |
|---|------|------|----------|-------------|------------|
| 1 | packages/backend/src/storage/memory.ts | 170, 202, 667, 682 | critical | Async import pattern for lifecycleManager will fail in practice. Dynamic imports in synchronous functions are fire-and-forget and won't execute before function returns. The `.then()` callbacks will execute too late. | Replace async imports with sync import at top: `import { lifecycleManager } from './lifecycleHooks.js';`. The circular dependency is already broken by the lifecycleHooks.ts helper file. |
| 2 | packages/backend/src/services/snapshotService.ts | 904-969 | high | Snapshot is missing `resourceFreshness` Map. Line 598 shows it's an important Map for freshness tracking but it's not included in the snapshot data structure. This will lose all freshness metadata on restore. | Add `resourceFreshness: Object.fromEntries(Array.from(this.resourceFreshness.entries()))` to the snapshot data object. Add corresponding restore logic around line 1148. |
| 3 | packages/backend/src/services/lifecycleManager.ts | 70, 71 | high | Unbounded memory growth: `lifecycleStates` Map and `lifecycleEvents` ring buffer grow without cleanup. When resources are deleted (lines 341-345 in removeResource), we clean up lifecycle state, but there's no automatic cleanup for resources that were never explicitly removed. Over days/weeks of uptime, this could accumulate thousands of stale entries. | Add periodic cleanup in `performLifecycleCheck()` to remove entries for evicted resources older than a threshold (e.g., 7 days). Example: `if (state.phase === 'evicted' && now - state.lastTransitionAt > 7 * 24 * 60 * 60 * 1000) { this.lifecycleStates.delete(key); }` |
| 4 | packages/backend/src/services/lifecycleManager.ts | 295-301 | medium | Activity tracking only works for sessions. The code checks `if (resourceType === 'session')` and falls back to `state.lastTransitionAt` for chains/events. This means chains and events never use actual activity data, only their last lifecycle transition time. Less accurate but acceptable since chains/events are ephemeral. | Consider documenting this limitation in the function comment. Alternatively, extend ActivityTracker to track chain/event activity if more precision is needed (not required for MVP). |
| 5 | packages/backend/src/services/snapshotService.ts | 197-218 | medium | Snapshot validation uses MD5 checksum which is not cryptographically secure. For data integrity verification (not security), this is acceptable. However, if snapshots could be tampered with maliciously, consider SHA-256. | For production deployments with untrusted snapshot storage, upgrade to SHA-256 via `createHash('sha256')`. For local dev/single-server deployments, MD5 is sufficient for corruption detection. |
| 6 | packages/shared/src/types.ts | 236-259 | medium | Lifecycle types are defined but not exported in shared/src/index.ts. Frontend components like SessionInfoPanel.tsx (line 17) import `LifecyclePhase` from '@afw/shared', which will work at runtime but may cause type issues in strict mode. | Verify that `LifecyclePhase`, `LifecycleEvent`, and `LifecyclePolicy` are exported in packages/shared/src/index.ts. If not, add them to the export list. |
| 7 | packages/backend/src/services/snapshotService.ts | 204-206 | low | Checksum validation serializes `snapshot.data` again to compute checksum. This doubles the serialization cost on restore. Minor performance issue since restore only happens on startup. | For optimization (not critical): Store a pre-computed hash in a separate field to avoid re-serialization. Trade-off: slight increase in snapshot size vs faster restore validation. |
| 8 | packages/backend/src/services/lifecycleManager.ts | 143-157 | low | LifecycleEvent uses ring buffer with FIFO eviction (MAX_EVENTS = 1000). The events array grows by push() and shrinks by shift() on overflow. For large systems with high lifecycle activity, this could cause frequent array mutations. | Consider using a circular buffer implementation or linked list for better performance if lifecycle events exceed 1000/hour. Current implementation is acceptable for MVP. |
| 9 | packages/backend/src/index.ts | 54, 347-349 | low | SnapshotService is initialized for all storage types but only memory storage supports snapshot/restore. The condition `if (storage.snapshot)` correctly guards the operations, but the service is instantiated unconditionally. Wastes a small amount of memory for Redis deployments. | Wrap SnapshotService instantiation in the same condition: `const snapshotService = storage.snapshot ? new SnapshotService(storage) : null;` and guard all usages. |

## Fixes Applied

No fixes applied (mode = review-only).

## Flags for Human

| Issue | Why Human Needed |
|-------|------------------|
| Circular dependency import strategy | The async import pattern in memory.ts (lines 170, 202, 667, 682) will not work as intended. The dynamic imports are fire-and-forget in synchronous functions, meaning the callbacks will execute after the function has already returned. This needs architectural decision: (A) use synchronous import via lifecycleHooks.ts helper, or (B) refactor storage methods to be async and await the import. Option A is simpler and the circular dependency is already broken by the helper file. |
| Missing resourceFreshness in snapshot | The snapshot() method is missing the `resourceFreshness` Map which tracks temporal data aging. This is a data loss issue on restore. Human should confirm the fix location and test restore functionality after adding it. |
| Lifecycle memory growth over time | The lifecycleStates Map and events ring buffer will accumulate stale entries over long-running deployments. Human should decide on the cleanup policy: (A) clean up evicted resources after 7 days, (B) add a max size limit with LRU eviction, or (C) defer to future optimization. Recommendation: implement option A in performLifecycleCheck(). |

## Review Notes

### Parallel Agent Clobber Check (Special Concern #1)

**Both agents modified:**
- `packages/backend/src/storage/memory.ts` (Agent 1: lifecycle hooks at lines 168-177, 200-209, 665-688; Agent 2: snapshot/restore methods at lines 903-1160)
- `packages/backend/src/index.ts` (Agent 1: lifecycle route + start/stop at lines 36, 39, 110, 378, 416; Agent 2: snapshot service init/lifecycle at lines 16, 54, 347-349, 399-407)

**Result:** ✅ **No conflicts detected.** The modifications are in separate sections of the files with no overlapping line ranges. The agents coordinated well.

### LifecycleManager Correctness (Special Concern #2)

**Phase transitions:** ✅ Verified correct in `performLifecycleCheck()` (lines 277-336):
- active → idle: when `inactiveDuration >= idleThresholdMs`
- idle → expiring: when `inactiveDuration >= expiringThresholdMs`
- expiring → evicted: manual (via `notifyPreEviction()` and `_evictOldestCompletedSession()`)
- Back to active: when activity resumes (inactiveDuration < idleThresholdMs)

**Logic flow is sound.** Phases progress based on inactivity duration, checked periodically by `startChecking()`.

### Circular Dependency (Special Concern #3)

**Problem identified:** ✅ Addressed with `lifecycleHooks.ts` helper file (packages/backend/src/storage/lifecycleHooks.ts).
- LifecycleManager imports activityTracker: ✅ OK (line 21 of lifecycleManager.ts)
- memory.ts imports lifecycleManager: ❌ WRONG METHOD (async imports at lines 170, 202, 667, 682)
- Solution: memory.ts should use `import { lifecycleManager } from './lifecycleHooks.js';` (sync import)

**The helper file breaks the circular dependency.** The async import pattern is incorrect and will fail.

### Snapshot Completeness (Special Concern #4)

**Missing Maps in snapshot():**
- ❌ `resourceFreshness` Map (line 598) — **MISSING** from snapshot data (lines 908-957)
- ✅ `clients` Set — correctly omitted (transient WebSocket state, should not persist)
- ✅ All other storage Maps are included: sessions, events, chains, chatHistory, sessionsByUser, commandsQueue, inputQueue, followedSessions, sessionWindowConfigs, frequencies, bookmarks, patterns, harmonyChecks, harmonyChecksByProject, dossiers, suggestions, telemetryEntries, sessionTtlExtensions

**Action required:** Add `resourceFreshness` to snapshot data object.

### Snapshot Integrity (Special Concern #5)

**Checksum validation:** ✅ Implemented correctly (lines 203-211 in snapshotService.ts)
- MD5 hash is computed on serialized data
- Hash is verified on restore before applying
- Invalid checksums are logged and snapshot is rejected

**Compression:** ✅ Gzip compression/decompression works correctly (lines 98, 200)
- Uses promisified gzip/gunzip from zlib
- Handles errors gracefully

**No issues detected in snapshot integrity mechanisms.**

### Memory Growth (Special Concern #6)

**Identified unbounded growth:**
1. ✅ `lifecycleEvents` ring buffer — **BOUNDED** by MAX_EVENTS = 1000 (lines 72-74, 154-157)
2. ❌ `lifecycleStates` Map — **UNBOUNDED** (line 70)
   - Resources are added on every lifecycle transition
   - Only removed explicitly via `removeResource()` (lines 341-345)
   - No automatic cleanup of stale evicted resources
   - **Risk:** Long-running deployments accumulate thousands of evicted entries

**Action required:** Add cleanup in `performLifecycleCheck()` for old evicted resources.

### Race Conditions (Special Concern #7)

**Snapshot during active writes:**
- ✅ snapshot() is synchronous and atomic for in-memory Maps (line 904)
- JavaScript single-threaded execution guarantees consistency
- No race condition possible

**Lifecycle check during eviction:**
- ✅ `performLifecycleCheck()` and `_evictOldestCompletedSession()` are both synchronous
- Lifecycle transitions before eviction (`notifyPreEviction()` at lines 665-674)
- Lifecycle transitions after eviction (`transitionPhase('evicted')` at lines 679-687)
- **Potential race:** If check runs between pre-eviction and post-eviction, it could see inconsistent state
- **Impact:** Low — the resource will be marked evicted on next check cycle
- **Mitigation:** Not critical for MVP, but could add a lock flag if issues arise

**No critical race conditions detected.**

## Architecture Assessment

**Strengths:**
- Clean separation: LifecycleManager as coordinator, ActivityTracker as data source, MemoryStorage as consumer
- Lifecycle phases map clearly to system states (active → idle → expiring → evicted)
- Snapshot service is well-isolated and supports graceful degradation (failed snapshot never crashes)
- Frontend integration is minimal and non-intrusive (SessionInfoPanel just displays phase)
- Good use of TypeScript branded types and discriminated unions

**Weaknesses:**
- Lifecycle state tracking grows unbounded (needs cleanup)
- Circular dependency resolution uses incorrect async pattern (needs sync import)
- Snapshot missing a critical Map (resourceFreshness)
- No lifecycle tracking for chains/events (only sessions get activity-aware tracking)

## Performance Considerations

1. **Snapshot I/O:** Gzip compression reduces disk I/O. For 10K sessions, expect ~500KB compressed snapshot, ~5MB uncompressed. Periodic snapshots (5 min intervals) are acceptable.
2. **Lifecycle checks:** 60-second intervals are reasonable. For 1000 tracked resources, check completes in <10ms.
3. **Memory footprint:** Each lifecycle state entry is ~200 bytes (phase + lastTransitionAt + key). 1000 entries = 200KB, acceptable.
4. **Ring buffer mutations:** FIFO eviction via array.shift() is O(n) but acceptable for 1000 events.

## Security Considerations

1. **Snapshot integrity:** MD5 checksum is sufficient for corruption detection but not tamper-protection. If snapshots are stored in untrusted locations, upgrade to SHA-256.
2. **Snapshot location:** `.actionflows-snapshot/` is in `.gitignore` (correct). Snapshots should not be committed.
3. **No sensitive data:** Snapshots contain session metadata, not credentials or secrets. Safe to persist locally.

## Testing Recommendations

1. **Lifecycle transitions:** Unit test phase transitions based on activity thresholds
2. **Snapshot roundtrip:** Integration test snapshot() → restore() preserves all data
3. **Circular dependency:** Verify memory.ts can import lifecycleManager without runtime errors
4. **Memory growth:** Load test with 10K sessions, verify lifecycle states are cleaned up
5. **Race conditions:** Stress test concurrent snapshot + eviction operations

## Contract Harmony

**This review follows Format 5.1: Review Report Structure** as defined in `.claude/actionflows/CONTRACT.md`.

✅ All required fields present: Verdict, Score, Summary, Findings table, Fixes Applied, Flags for Human
✅ Severity levels use exact contract values: critical, high, medium, low
✅ Verdict uses exact enum values: NEEDS_CHANGES
✅ Score is integer 0-100

## Learnings

**Issue:** Async imports in synchronous functions are fire-and-forget and don't execute before the function returns.

**Root Cause:** The pattern `import('./module.js').then(({ export }) => { /* use export */ })` in a synchronous function context (like `setSession()` or `deleteSession()`) is non-blocking. The function returns immediately, and the `.then()` callback executes later on the next event loop tick, after the function caller has already moved on.

**Suggestion:** When dealing with circular dependencies:
1. **Preferred:** Use a helper module (like `lifecycleHooks.ts`) to re-export and break the cycle, then use synchronous imports everywhere.
2. **Alternative:** Make the calling function async and await the dynamic import, but this requires refactoring the entire storage interface to be async (breaking change).
3. **Never:** Use dynamic imports in synchronous contexts expecting them to execute before return.

[FRESH EYE]
- The parallel agent coordination worked flawlessly without file conflicts. Both agents modified the same files (memory.ts, index.ts) but in non-overlapping sections. This demonstrates effective task decomposition by the orchestrator.
- The lifecycle phases (active/idle/expiring/evicted) map well to the "living universe" metaphor. This is good domain modeling.
- The snapshot service's error handling is exemplary: failed snapshots log errors but never crash the server. This follows the "graceful degradation" principle consistently.
- Missing: No tests included in this implementation. For a system-critical feature like persistence and lifecycle management, unit tests should be delivered alongside code.
