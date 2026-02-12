# Test Report Template

**Purpose:** Used by `test/` action agents to document test execution results
**Contract Reference:** None (free-form documentation)
**Parser:** None (displayed as markdown in dashboard)
**Producer:** See `.claude/actionflows/actions/test/agent.md`

---

## Required Sections

These sections MUST be present in every test report:

1. **Title** — `# Test Results: {description}`
2. **Summary** — Overall test counts and execution metadata
3. **Test Files** — Breakdown by test file with pass/fail status

---

## Optional Sections

These sections are conditional:

- **Issues Fixed** — Required if failures were encountered and fixed
- **Test Coverage** — Include if `coverage: true` in inputs
- **Learnings** — Optional Issue/Root Cause/Suggestion pattern

---

## Template Structure

```markdown
# Test Results: {description}

## Summary

**Test Execution Date:** {YYYY-MM-DD}
**Test Framework:** {framework}
**Total Test Files:** {count}
**Total Tests:** {count}

### Overall Results
- **Passed:** {count}
- **Failed:** {count}
- **Skipped:** {count}
- **Success Rate:** {percentage}%

---

## Test Files

### 1. {filename.test.ts}
**Location:** `{path}`
**Tests:** {count}
**Duration:** ~{time}

**Status:** ✅ All tests passed

#### Test Categories
1. **{Category}** ({count} tests)
   - {Description}

---

### 2. {filename.test.ts}
**Location:** `{path}`
**Tests:** {count}
**Duration:** ~{time}

**Status:** ❌ {count} failures

#### Test Categories
1. **{Category}** ({count} tests)
   - {Description}

#### Issues Fixed

**Test:** `{test name}`

**Problem:** {Description}

**Root Cause:** {Analysis}

**Fix Applied:**
```typescript
{Code snippet}
```

**Explanation:** {Why this fixes it}

---

## Test Coverage

### Covered Scenarios

✅ {Scenario 1}
✅ {Scenario 2}

### Uncovered Scenarios

❌ {Scenario 1}
❌ {Scenario 2}

---

## Learnings

**Issue:** {Description}

**Root Cause:** {Analysis}

**Suggestion:** {Fix}
```

---

## Field Descriptions

### Summary

**Test Execution Date:** Date tests were run (YYYY-MM-DD format)

**Test Framework:** Framework used (e.g., "Vitest 1.0", "Jest 29")

**Total Test Files:** Number of test files executed

**Total Tests:** Total number of individual test cases

**Overall Results:**
- **Passed:** Count of passing tests
- **Failed:** Count of failing tests
- **Skipped:** Count of skipped/pending tests
- **Success Rate:** Calculated as `(passed / total) * 100`

### Test Files

**Numbered list** of test files (### 1., ### 2., etc.)

**For each test file:**
- **Location:** Relative path from project root
- **Tests:** Number of tests in this file
- **Duration:** Approximate execution time
- **Status:** ✅ (all passed) or ❌ (N failures)
- **Test Categories:** Logical grouping of tests within the file

### Test Categories

- Group related tests within a file
- Use numbered list format (1., 2., 3., ...)
- Include count of tests in each category
- Brief description of what the category tests

### Issues Fixed

**Only include if test failures occurred and were fixed**

**For each fixed issue:**
- **Test:** Name of the failing test
- **Problem:** What failed (assertion error, exception, etc.)
- **Root Cause:** Why it failed (code bug, stale mock, etc.)
- **Fix Applied:** Code snippet showing the fix
- **Explanation:** Why this fix resolves the issue

### Test Coverage

**Only include if `coverage: true` in inputs**

**Covered Scenarios:**
- List of test scenarios that have coverage
- Use ✅ emoji for covered items

**Uncovered Scenarios:**
- List of scenarios that need tests
- Use ❌ emoji for uncovered items

**Coverage Table (optional):**
```markdown
| File | Coverage | Uncovered Lines |
|------|----------|----------------|
| {path} | {X}% | {line ranges} |
```

### Learnings

- Optional section at the end
- Use the standard Issue/Root Cause/Suggestion pattern
- Document test failures, flaky tests, or framework issues
- Include `[FRESH EYE]` insights if discovered during testing

---

## Example

```markdown
# Test Results: Backend CLI Integration Tests

## Summary

**Test Execution Date:** 2026-02-13
**Test Framework:** Vitest 1.0
**Total Test Files:** 3
**Total Tests:** 42

### Overall Results
- **Passed:** 40
- **Failed:** 2
- **Skipped:** 0
- **Success Rate:** 95%

---

## Test Files

### 1. cli.test.ts
**Location:** `packages/backend/src/__tests__/cli.test.ts`
**Tests:** 15
**Duration:** ~2.5s

**Status:** ✅ All tests passed

#### Test Categories
1. **Start Command** (5 tests)
   - Tests server startup with various configurations
   - Validates port binding and error handling
2. **Health Command** (5 tests)
   - Tests health check endpoint connectivity
   - Validates response format
3. **Migrate Command** (5 tests)
   - Tests database migration execution
   - Validates rollback scenarios

---

### 2. storage.test.ts
**Location:** `packages/backend/src/__tests__/storage.test.ts`
**Tests:** 18
**Duration:** ~3.2s

**Status:** ❌ 2 failures

#### Test Categories
1. **Session Management** (10 tests)
   - Tests session CRUD operations
   - 2 failures related to Redis connection
2. **Chain Management** (8 tests)
   - Tests chain storage and retrieval

#### Issues Fixed

**Test:** `should store and retrieve session with Redis`

**Problem:** Test failed with "Connection refused" error when connecting to Redis

**Root Cause:** Test assumes Redis is running on localhost:6379, but CI environment uses Redis container on different port

**Fix Applied:**
```typescript
// Before: Hardcoded Redis host
const storage = new RedisStorage('localhost:6379');

// After: Use environment variable
const storage = new RedisStorage(process.env.REDIS_URL || 'localhost:6379');
```

**Explanation:** This allows tests to use the correct Redis URL in any environment, including CI where Redis runs in a container.

---

**Test:** `should handle Redis connection failure gracefully`

**Problem:** Test expected specific error message, but received generic connection error

**Root Cause:** Redis client error messages vary across versions

**Fix Applied:**
```typescript
// Before: Exact message match
expect(error.message).toBe('Connection refused');

// After: Partial message match
expect(error.message).toContain('Connection');
```

**Explanation:** This makes the test resilient to Redis client version changes.

---

### 3. integration.test.ts
**Location:** `packages/backend/src/__tests__/integration.test.ts`
**Tests:** 9
**Duration:** ~5.1s

**Status:** ✅ All tests passed

#### Test Categories
1. **End-to-End Flows** (9 tests)
   - Tests complete session lifecycle
   - Tests WebSocket message flow

---

## Test Coverage

### Covered Scenarios

✅ Session creation and retrieval
✅ Chain execution lifecycle
✅ WebSocket event broadcasting
✅ Error handling and validation
✅ CLI command execution

### Uncovered Scenarios

❌ Redis connection pooling edge cases
❌ Concurrent session modifications
❌ WebSocket reconnection handling

---

## Learnings

**Issue:** Redis tests failed in CI environment due to hardcoded connection string

**Root Cause:** Tests assumed Redis is always at localhost:6379, but CI uses containerized Redis with dynamic ports

**Suggestion:** Always use environment variables for external service connections (databases, Redis, etc.)

**[FRESH EYE]** Consider adding a test setup helper that automatically starts Redis/PostgreSQL containers for integration tests, similar to how Testcontainers works in Java.
```

---

## Cross-References

- **Agent Definition:** `.claude/actionflows/actions/test/agent.md`
- **Contract Specification:** N/A (free-form documentation)
- **Frontend Display:** Dashboard displays as markdown (no parsing)
- **Related Templates:** `TEMPLATE.changes.md`, `TEMPLATE.review-report.md`
