# CLI Integration Test Flow

> Systematically test CLI integrations for the ActionFlows Dashboard.

---

## When to Use

- After CLI-related code changes (claudeCliSession.ts, claudeCliManager.ts, CLI routes)
- Before releases to validate CLI integration stability
- After dependency updates affecting child_process, ws, or stream-json
- When adding new CLI features requiring expanded test coverage
- When investigating CLI bugs to reproduce and validate fixes

---

## Required Inputs From Human

| Input | Description | Example |
|-------|-------------|---------|
| scope | What to test | "cli-session", "cli-manager", "integration", "all" |
| mode | Action to take | "analyze-only", "analyze-and-code", "full" (default) |
| focus | Narrow focus (optional) | "stream-json parsing", "process lifecycle" |

---

## Modes

### analyze-only
- Inventory existing CLI tests
- Identify coverage gaps
- Output analysis report (no changes)

### analyze-and-code
- Run analysis step
- Generate tests for identified gaps
- Stop before running tests

### full (default)
- Analyze → Code → Test → Review
- Complete test lifecycle
- All steps executed sequentially

---

## Action Sequence

### Step 1: Analyze CLI Tests

**Action:** `analyze/`
**Model:** haiku

**Spawn:**
```
Analyze existing CLI integration tests in the ActionFlows Dashboard.

Focus areas:
- {focus if provided, else "all CLI test coverage"}

Inventory:
1. Existing test files in packages/backend/src/__tests__/ and services/__tests__/
2. Current test coverage by category:
   - CLI process lifecycle (spawn, stdin, stdout, exit)
   - Stream-json parsing (JSONL buffering, content extraction)
   - WebSocket event broadcasting
   - Session management (create, retrieve, stop)
   - stdin communication (message formatting, validation)
   - Error scenarios (crashes, malformed JSON, failures)
3. Gap analysis (what's missing in each category)
4. Test patterns used (mocking strategy, fixtures, helpers)

Output as structured report:
- Current coverage summary
- Gap list with priority (CRITICAL, HIGH, MEDIUM, LOW)
- Recommended tests to write
```

**Gate:** Analysis complete. Gap report delivered.

---

### Step 2: Generate Tests (conditional)

**Action:** `code/`
**Model:** sonnet
**Condition:** gaps identified from Step 1 AND (mode is "analyze-and-code" OR "full")

**Spawn:**
```
Read your definition in .claude/actionflows/actions/code/agent.md

Input:
- task: Write integration tests for CLI service
- context: packages/backend/src/services/claudeCliSession.ts, claudeCliManager.ts, __tests__/ helpers
- component: backend
- gaps: {gap list from Step 1 analysis}

Requirements:
1. Create/update test files:
   - packages/backend/src/services/__tests__/claudeCliSession.test.ts (unit tests)
   - packages/backend/src/services/__tests__/claudeCliManager.test.ts (unit tests)
   - packages/backend/src/__tests__/claudeCli.integration.test.ts (integration tests)

2. Cover all categories from Step 1 gaps:
   - CLI process lifecycle (spawn args, startup, status, exit)
   - Stream-json parsing (JSONL buffering, JSON extraction, malformed handling)
   - WebSocket events (ClaudeCliStartedEvent, ClaudeCliOutputEvent, ClaudeCliExitedEvent)
   - Session management (start, get, list, stop)
   - stdin communication (message formatting, validation)
   - Error scenarios (process crash, stdin failure, invalid input)

3. Follow existing patterns:
   - Mock child_process.spawn for unit tests
   - Use helpers from __tests__/helpers.ts
   - Use Vitest + describe/it structure
   - Ensure test isolation (reset state between tests)

4. Type-check after writing
```

**Gate:** Tests implemented, type-check passes.

---

### Step 3: Run Tests (conditional)

**Action:** `test/`
**Model:** haiku
**Condition:** mode is "full"

**Spawn:**
```
Run CLI integration tests and report results.

Execute:
- pnpm -F @afw/backend test src/services/__tests__/claudeCliSession.test.ts
- pnpm -F @afw/backend test src/services/__tests__/claudeCliManager.test.ts
- pnpm -F @afw/backend test src/__tests__/claudeCli.integration.test.ts

Report:
- Pass/fail counts for each file
- Failed test names and error messages
- Coverage metrics for CLI-related code
- Any timeout or resource warnings
```

**Gate:** Test results captured.

---

### Step 4: Review Results (conditional)

**Action:** `review/`
**Model:** sonnet
**Condition:** mode is "full"

**Spawn:**
```
Read your definition in .claude/actionflows/actions/review/agent.md

Input:
- scope: {test files from Step 2 or existing test files}
- type: test-review

Evaluate:
1. Test coverage completeness (all 6 categories from analysis covered?)
2. Test isolation (no shared state between tests?)
3. Mock quality (realistic behavior, proper expectations?)
4. Error scenario coverage (edge cases tested?)
5. Integration test safety (no real Claude CLI calls in CI?)
6. Performance (no unexpectedly slow tests?)

Provide:
- Coverage assessment
- Quality verdict (PASS, NEEDS_CHANGES)
- Specific recommendations for improvements
- Any gaps still remaining
```

**Gate:** Review verdict delivered.

---

## Dependencies

### mode: analyze-only
```
Step 1 (analyze) → Done
```

### mode: analyze-and-code
```
Step 1 (analyze) → Step 2 (code) → Done
```

### mode: full
```
Step 1 (analyze) → Step 2 (code) → Step 3 (test) → Step 4 (review)
```

---

## Chains With

- → `code-and-review/` (if tests need additional refactoring)
- → `post-completion/` (after review APPROVED)
- ← Manual trigger with `/cli-integration-test [scope] [mode] [focus]`
- ← Auto-triggered after CLI-related changes (if configured)

---

## Example Usage

```
# Just analyze current test coverage
/cli-integration-test scope=all mode=analyze-only

# Analyze and generate tests
/cli-integration-test scope=all mode=analyze-and-code

# Full flow: analyze, code, test, review
/cli-integration-test scope=all mode=full

# Focus on specific area
/cli-integration-test scope=all mode=full focus="stream-json parsing"

# Test specific component
/cli-integration-test scope=cli-session mode=full
```

---

## Example Output (analyze-only)

```
## CLI Integration Test Analysis

### Current Coverage Summary
| Category | Covered | Gaps | Priority |
|----------|---------|------|----------|
| Process Lifecycle | 70% | 3 | HIGH |
| Stream-json Parsing | 85% | 2 | HIGH |
| WebSocket Events | 60% | 4 | CRITICAL |
| Session Management | 75% | 2 | MEDIUM |
| stdin Communication | 90% | 1 | LOW |
| Error Scenarios | 50% | 5 | CRITICAL |

### Gap List (Prioritized)

**CRITICAL:**
1. WebSocket ClaudeCliExitedEvent broadcast on process exit
2. Error handling for process crash during operation
3. Stream-json malformed JSON fallback behavior

**HIGH:**
1. Process spawn with --input-format stream-json validation
2. WebSocket ClaudeCliOutputEvent for stderr output

...

### Recommended Actions
1. Write WebSocket event tests (4 gaps, blocks stability)
2. Write error scenario tests (5 gaps, blocks reliability)
3. Write stream-json edge case tests (2 gaps)
```

---

## Example Output (full chain)

```
## CLI Integration Test Report

### Step 1: Analysis
- 6 existing test files found
- 12 total gaps identified across all categories
- Priority: 3 CRITICAL, 4 HIGH, 5 MEDIUM

### Step 2: Generated Tests
- claudeCliSession.test.ts: 14 new tests
- claudeCliManager.test.ts: 9 new tests
- claudeCli.integration.test.ts: 8 new integration tests

### Step 3: Test Results
- Total: 31 tests
- Passed: 31 ✅
- Failed: 0
- Skipped: 0
- Duration: 2.4s

### Step 4: Review
- Coverage: Excellent (95%+ across all categories)
- Quality: APPROVED
- Recommendations: None blocking

### Verdict
✅ CLI integration tests comprehensive and passing.
Ready for production release.
```
