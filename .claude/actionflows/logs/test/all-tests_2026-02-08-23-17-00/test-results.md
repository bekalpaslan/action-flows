# Test Results: all

## Summary
- **Passed:** 116
- **Failed:** 0
- **Skipped:** 0
- **Coverage:** 35.25% (statements), 21.37% (branches), 35.11% (functions), 36.21% (lines)

## Test Files
All 6 test files passed:
1. `src/__tests__/confidenceScorer.test.ts` — 19 tests
2. `src/services/frequencyTracker.test.ts` — 14 tests
3. `src/middleware/__tests__/errorHandler.test.ts` — 14 tests
4. `src/storage/__tests__/memory.test.ts` — 41 tests
5. `src/ws/__tests__/handler.test.ts` — 20 tests
6. `src/__tests__/integration.test.ts` — 8 tests

## Failures
None — all tests passed.

## Coverage Report

### Overall Coverage by Module
| Module | Statements | Branches | Functions | Lines |
|--------|-----------|----------|-----------|-------|
| **All files** | **35.25%** | **21.37%** | **35.11%** | **36.21%** |
| __tests__ | 46.66% | 12.82% | 58.06% | 46.93% |
| middleware | 56.25% | 54.54% | 50% | 56.25% |
| routes | 44.21% | 29.89% | 41.37% | 44.11% |
| schemas | 90% | 100% | 20% | 90% |
| services | 64.96% | 55% | 61.53% | 64.66% |
| storage | 8.26% | 5.76% | 11.29% | 8.85% |
| ws | 72.8% | 51.92% | 80% | 75.45% |

### High Coverage Areas (>80%)
| File | Statement | Branch | Function | Line |
|------|-----------|--------|----------|------|
| errorHandler.ts | 100% | 100% | 100% | 100% |
| ws.ts | 100% | 100% | 100% | 100% |
| confidenceScorer.test.ts | 100% | 100% | 100% | 100% |
| frequencyTracker.ts | 86.27% | 75% | 81.25% | 88.88% |
| rateLimit.ts | 83.33% | 100% | 66.66% | 83.33% |
| api.ts (schemas) | 88.57% | 100% | 20% | 88.57% |

### Critical Low Coverage Areas (<20%)
| File | Statement | Branch | Function | Line | Uncovered Lines |
|------|-----------|--------|----------|------|-----------------|
| redis.ts | 0% | 0% | 0% | 0% | 77-717 |
| persistence.ts | 30.76% | 0% | 30.76% | 30.76% | 29-30,70-160 |
| fileWatcher.ts | 39.24% | 9.09% | 33.33% | 39.24% | 48-52,70-154,187-300 |
| memory.ts | 11.45% | 9.62% | 15.09% | 12.71% | 60-105,232,236-512 |
| validate.ts | 38.09% | 28.57% | 33.33% | 38.09% | 22-34,59-75 |

## Key Findings

### Execution Status
- **Duration:** 1.57 seconds
- **Environment Setup:** Fast (1ms)
- **Import Time:** 1.92s
- **Test Execution:** 449ms
- **Transformation:** 1.16s

### Coverage Gaps
The following areas have minimal or no test coverage:

1. **Redis Storage Module** (`redis.ts`) — 0% coverage
   - Production storage backend completely untested
   - Risk: Redis integration failures would go undetected

2. **File Watcher Service** (`fileWatcher.ts`) — 39.24% coverage
   - Core file monitoring logic largely untested
   - Lines 187-300 contain action spawning/log parsing logic without coverage

3. **Persistence Layer** (`persistence.ts`) — 30.76% coverage
   - Session history saving logic has 0% branch coverage
   - Lines 70-160 contain core persistence routines

4. **Memory Storage Adapter** (`memory.ts`) — 11.45% coverage
   - Main in-memory store implementation under-tested
   - 277 uncovered lines of business logic

### Recommendations
1. **Priority 1:** Add tests for Redis integration (currently 0% coverage)
2. **Priority 2:** Expand file watcher test coverage (focus on lines 187-300)
3. **Priority 3:** Test persistence layer session history logic
4. **Priority 4:** Increase memory storage adapter coverage (currently only 11.45%)
5. **Priority 5:** Add branch coverage for middleware validation (`validate.ts`)

### Test Execution Notes
- All 116 tests executed successfully with no timeouts or errors
- Integration tests include end-to-end WebSocket, event, and command flows
- Test helpers properly set up and tear down servers/connections
- No skipped tests detected
