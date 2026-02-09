# FrequencyTracker Service Implementation

## Summary

Created `FrequencyTracker` service in `packages/backend/src/services/frequencyTracker.ts` implementing SRD Section 3.1. The service wraps Storage interface methods with threshold detection, trend analysis, and cleanup functionality.

## Files Created

### 1. `packages/backend/src/services/frequencyTracker.ts`
- **Lines:** 178
- **Exports:** `FrequencyTracker` class, `FREQUENCY_CONFIG` constant
- **Dependencies:** `@afw/shared` types, Storage interface
- **Key Methods:**
  - `track()` - Track action occurrence, detect threshold crossings
  - `query()` - Query frequency records with filtering (minCount, userId, since, orderBy)
  - `getTopActions()` - Get top N actions by frequency
  - `isPatternCandidate()` - Check if action crossed pattern threshold (≥5)
  - `isToolbarCandidate()` - Check if action crossed toolbar threshold (≥3)
  - `getTrend()` - Get frequency trend for last N days (default 7)
  - `cleanup()` - Remove daily counts older than retention period (90 days)

### 2. `packages/backend/src/services/frequencyTracker.test.ts`
- **Lines:** 397
- **Framework:** Vitest
- **Test Coverage:** 14 tests covering all public methods
- **All Tests Passing:** ✅

## Implementation Details

### FREQUENCY_CONFIG Constants
```typescript
{
  retentionDays: 90,        // Retain daily counts for 90 days
  patternThreshold: 5,      // Pattern detection at 5+ occurrences
  toolbarThreshold: 3,      // Toolbar suggestion at 3+ occurrences
}
```

### Key Features

1. **Async/Sync Storage Handling**
   - Service accepts both sync and async Storage implementations
   - Uses helper methods to handle Promise results transparently
   - Maintains compatibility with MemoryStorage and RedisStorage

2. **Frequency Tracking**
   - Wraps `storage.trackAction()` with threshold detection
   - Returns updated `FrequencyRecord` with current state
   - Supports optional projectId and userId scoping

3. **Query Interface**
   - Comprehensive filtering: minCount, userId, since timestamp
   - Sort options: count (default) or lastSeen
   - Respects limit parameter for result pagination

4. **Daily Trend Analysis**
   - `getTrend()` returns array of counts for last N days
   - ISO date keys (YYYY-MM-DD) for daily breakdown
   - Gracefully handles missing days (0 count)

5. **Data Cleanup**
   - `cleanup()` removes stale daily counts beyond 90-day window
   - Preserves total count and timestamps
   - Ready for periodic job execution

## Type Safety

✅ All TypeScript checks pass (no `any` types)
✅ Uses branded types from `@afw/shared`
✅ Full type inference for query parameters
✅ Proper async/Promise handling

## Testing

All 14 tests pass:
- track() functionality and threshold detection
- Pattern and toolbar candidate detection
- Trend analysis with configurable days
- Cleanup with retention period enforcement
- Query filtering by minCount, userId, since
- Sorting by count and lastSeen
- getTopActions with default/custom limits

## Integration Points

The service is ready to integrate with:
1. Route handlers for frequency endpoints
2. Event emission system for threshold notifications
3. Daily cron job for cleanup execution
4. Pattern detection engine (uses threshold checks)
5. Toolbar suggestion system (uses toolbar candidates)

## Notes

- Storage interface already implements `trackAction()`, `getFrequency()`, `getTopActions()`
- Service adds domain logic without duplicating storage responsibilities
- Follows Express backend patterns from existing services (cleanup.ts)
- Ready for use in routes, middleware, and background jobs
