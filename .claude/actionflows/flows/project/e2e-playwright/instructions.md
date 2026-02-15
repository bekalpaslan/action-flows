# E2E Playwright Flow

> Create and execute headless browser-based end-to-end tests using Playwright MCP.

---

## When to Use

- Creating E2E test suites for CI/CD pipelines (headless, parallel-friendly)
- Validating behavioral contracts in automated test environments
- Regression testing before deployments
- Testing user flows that require browser interaction but don't need visual debugging
- When human requests "create Playwright E2E test", "test in CI", or "headless browser test"
- When Chrome MCP is unavailable (no desktop, CI environment, profile lock issues)

---

## Required Inputs From Human

| Input | Description | Example |
|-------|-------------|---------|
| scope | What to test — component, feature, or user flow | "Session lifecycle", "Chain execution", "Cosmic map navigation" |
| contracts | Behavioral contract IDs to test or "derive from scope" | "HC-SL-001, HC-SL-002" or "derive from scope" |
| mode | Execution mode | "create-only" (default) or "create-and-execute" |
| focus | Narrow focus for test design (optional) | "happy path", "error handling", "accessibility" |

---

## Prerequisites

**For create-and-execute mode:**
1. Backend running at `http://localhost:3001` (`pnpm dev:backend`)
2. Frontend running at `http://localhost:5173` (`pnpm dev:app`)
3. Playwright MCP server available

If any prerequisite fails → Flow errors. Human must fix and re-run.

**For create-only mode:**
- No prerequisites (just generates test files)

---

## Action Sequence

### Step 1: Analyze Behavioral Contracts

**Action:** `.claude/actionflows/actions/analyze/`
**Model:** sonnet
**Waits for:** None (parallel-eligible)

**Spawn:**
```
Read your definition in .claude/actionflows/actions/analyze/agent.md

Input:
- aspect: behavioral-contracts
- scope: {contracts from human or "derive from scope: {scope}"}
- context: {scope from human}
- depth: structured

Output format:
For each contract, identify:
1. Health check ID (HC-XX-NNN)
2. Test assertions (what the contract validates)
3. UI interactions needed (navigate, click, fill, wait)
4. Test preconditions (setup required)
5. Expected outcomes (pass/fail criteria)
```

**Gate:** Contract analysis delivered. Test vectors identified.

---

### Step 2: Plan Test Scenarios

**Action:** `.claude/actionflows/actions/plan/`
**Model:** sonnet
**Waits for:** Step 1

**Spawn after Step 1:**
```
Read your definition in .claude/actionflows/actions/plan/agent.md

Input:
- requirements: Design Playwright E2E test scenarios from contract analysis (Step 1)
- context: Contract health checks, scope, focus (if provided)
- depth: detailed
- output_format: structured test plan

Output: Test plan with:
1. Test file location (test/e2e/playwright/{feature}.playwright.ts)
2. Test scenarios (array of { name, steps, preconditions, assertions })
3. Playwright MCP tool mappings (browser_navigate, browser_snapshot, browser_click, browser_fill_form, browser_wait_for, browser_evaluate)
4. Element selection strategy (accessibility tree refs from snapshots)
5. Mock data (if needed for test execution)
6. Cleanup steps (delete test sessions, reset state)
```

**Gate:** Test plan delivered. Scenarios ready for coding.

---

### Step 3: HUMAN GATE

Present test plan for approval.

- **Accept:** Proceed to Step 4 (Code)
- **Modify:** Human provides adjustments, loop back to Step 2 with modifications
- **Reject:** Flow ends (no code changes)

---

### Step 4: Generate Test Code

**Action:** `.claude/actionflows/actions/code/`
**Model:** haiku
**Waits for:** Human approves Step 3

**Spawn after Human approves Step 3:**
```
Read your definition in .claude/actionflows/actions/code/agent.md

Input:
- task: Create Playwright test definition file from approved test plan (Step 3)
- context: Test plan, contract health checks, element selection strategy
- output_path: test/e2e/playwright/{feature}.playwright.ts
- style: Match existing test/e2e/playwright/*.playwright.ts format

Test file must export:
- export const {testName}Test with structure: { name, prerequisites, steps, cleanup }
- Each step: { name, tool, params, expect, screenshot, onFailure }
- Use Playwright MCP tools: browser_navigate, browser_snapshot, browser_click, browser_fill_form, browser_wait_for, browser_evaluate
- Use element refs from snapshots, NOT hardcoded CSS selectors
- Include contract health check IDs (HC-XX-NNN) in test metadata
```

**Gate:** Test code file generated and syntax-valid.

---

### Step 5: Mode Branch

**If mode = "create-only":**
- Skip Steps 6-7
- Flow ends after code review
- Test file ready for manual execution or CI integration

**If mode = "create-and-execute":**
- Proceed to Step 6 (Playwright Test Execution)

---

### Step 6: Execute Tests via Playwright MCP (create-and-execute mode only)

**Action:** `.claude/actionflows/actions/test/e2e-playwright`
**Model:** sonnet
**Waits for:** Step 4 + prerequisites verified

**Spawn after Step 4:**
```
Read your definition in .claude/actionflows/actions/test/e2e-playwright/agent.md

Input:
- test_file: {output_path from Step 4}
- mode: sequential
- screenshot_on_fail: true
- context: Test plan from Step 3, contracts validated

Execute tests using Playwright MCP tools:
1. Load Playwright MCP tools via ToolSearch query="playwright"
2. Verify prerequisites (backend :3001, frontend :5173)
3. For each test scenario:
   - Execute test steps sequentially
   - Capture screenshots on failure
   - Report pass/fail with details
4. Generate test-results.md with summary + failures + screenshots
```

**Gate:** Tests executed. Results logged.

---

### Step 7: Review Test Results

**Action:** `.claude/actionflows/actions/review/`
**Model:** sonnet
**Waits for:** Step 6 (create-and-execute) OR Step 4 (create-only)

**Spawn after Step 6 (create-and-execute):**
```
Read your definition in .claude/actionflows/actions/review/agent.md

Input:
- scope: Test results from Step 6 (execution log) OR test code from Step 4 (create-only)
- type: test-review
- context: Test plan from Step 3, contract expectations

Review and report:
1. Pass/fail summary (X passing, Y failing)
2. Failed test root causes (selector errors, app bugs, test logic, timing issues)
3. Coverage assessment (which contracts validated?)
4. Recommendations (fix test logic vs app bugs vs contract drift)
```

**Gate:** Test results reviewed. Issues documented.

---

## Dependencies

### Mode: create-only
```
Step 1 (analyze)  ──┐
                    ├──→ Step 2 (plan) → Step 3 (HUMAN GATE) → Step 4 (code) → Step 7 (review) → END
```

### Mode: create-and-execute
```
Step 1 (analyze)  ──┐
                    ├──→ Step 2 (plan) → Step 3 (HUMAN GATE) → Step 4 (code) → Step 6 (test/e2e-playwright) → Step 7 (review) → END
```

**Parallel groups:**
- None (sequential dependency chain)

---

## Chains With

- ← Triggered when human requests "create Playwright E2E test" or "test for CI"
- ← Triggered when new behavioral contracts are created (contract-index/)
- → code-and-review/ (to fix app bugs discovered by tests)
- → post-completion/ (after test execution and review complete)
- → contract-compliance-audit/ (when test results reveal contract drift)

---

## Example: Create-Only Mode

```
Human: "Create a Playwright E2E test for session lifecycle (create, update, delete)"

Orchestrator Routes to: e2e-playwright/, mode=create-only

Step 1: Analyze behavioral contracts for session lifecycle
- Identifies HC-SL-001: Session creation workflow
- Identifies HC-SL-002: Session status progression
- Identifies HC-SL-003: Session deletion
- Extracts assertions: session appears in sidebar, status updates, deletion removes from UI

Step 2: Plan test scenarios
- Test name: "Session Lifecycle"
- Prerequisites: backend:3001, frontend:5173
- Steps:
  1. Navigate to http://localhost:5173
  2. Take snapshot (get element refs for "New Session" button)
  3. Click "New Session" button
  4. Wait for session to appear in sidebar
  5. Update session status via API (simulate in-progress)
  6. Reload page, verify status dot updated
  7. Delete session via UI
  8. Verify session removed from sidebar
- Cleanup: None needed (test cleans up after itself)

Step 3: HUMAN GATE
Approve? → YES

Step 4: Code generation
- Generates test/e2e/playwright/session-lifecycle.playwright.ts
- Exports sessionLifecycleTest with steps + HC-SL-001, HC-SL-002, HC-SL-003 references
- Uses browser_navigate, browser_snapshot, browser_click, browser_wait_for, browser_evaluate

Step 7: Review
- Confirms test code is well-formed
- Verifies contract IDs included
- Flow ends

Output: test/e2e/playwright/session-lifecycle.playwright.ts ready for CI integration
```

---

## Example: Create-and-Execute Mode

```
Human: "Create and run Playwright E2E tests for session lifecycle. Backend and frontend are running."

Orchestrator Routes to: e2e-playwright/, mode=create-and-execute

[Steps 1-4: Same as create-only mode]

Step 5: Mode branch → create-and-execute detected

Step 6: Execute tests via Playwright MCP
- Prerequisite checks pass (backend at 3001, frontend at 5173, Playwright available)
- Loads test definition from Step 4
- Runs test steps using Playwright MCP tools:
  1. browser_navigate("http://localhost:5173")
  2. browser_snapshot() → gets element refs
  3. browser_click(element="New Session button")
  4. browser_wait_for(text="Session created")
  5. browser_evaluate(script="fetch API to update status")
  6. browser_navigate(type="reload")
  7. browser_snapshot() → verify status dot color changed
  8. browser_click(element="Delete button")
  9. browser_wait_for(text="Session deleted")
- Result: ✅ PASS (all steps succeeded)

Step 7: Review
- Test passed, HC-SL-001, HC-SL-002, HC-SL-003 validated
- Coverage: 100% of session lifecycle contracts
- Flow ends

Output: Test execution log with pass status + screenshots
```

---

## Test File Format Reference

Tests must follow this structure (TypeScript):

```typescript
/**
 * Session Lifecycle E2E Test
 * Tests: Create session → verify sidebar → update session → delete → verify deletion
 * Prerequisites: Backend running on :3001, Frontend running on :5173
 */
export const sessionLifecycleTest = {
  name: 'Session Lifecycle',
  prerequisites: ['backend:3001', 'frontend:5173'],
  steps: [
    {
      name: 'Navigate to dashboard',
      tool: 'browser_navigate',
      params: { url: 'http://localhost:5173' },
      expect: { title: /ActionFlows/ },
      screenshot: true,
      onFailure: 'abort',
    },
    {
      name: 'Take initial snapshot',
      tool: 'browser_snapshot',
      params: {},
      expect: { contains: ['New Session', 'Cosmic Map'] },
      screenshot: true,
      onFailure: 'abort',
    },
    {
      name: 'Click New Session',
      tool: 'browser_click',
      params: { element: 'New Session button' },
      expect: { snapshot_contains: ['Session created'] },
      screenshot: true,
      onFailure: 'abort',
    },
    // ... more steps
  ],
  cleanup: [
    { tool: 'browser_close', params: {} }
  ]
};
```

---

## Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| Playwright MCP not available | Verify MCP server running, or use create-only mode |
| Element ref not found | Verify snapshot taken after page load, use updated refs |
| Test timeout waiting for element | Increase timeout, or add explicit waits between steps |
| Backend/frontend not running | Start `pnpm dev:backend` and `pnpm dev:app` in separate terminals |
| Selector mismatch | Use element refs from accessibility snapshots, not CSS selectors |
| Test passes locally but fails in CI | Check CI environment has backend/frontend running, adjust timeouts |

---

## Notes

- **Headless-friendly:** Playwright MCP runs without visible browser windows (CI-compatible)
- **Parallel execution:** Tests can run in parallel (unlike Chrome MCP with profile lock)
- **Accessibility tree refs:** Use snapshot-based element refs, not hardcoded CSS selectors
- **Backend + Frontend required:** Both must be running for test execution mode
- **CI integration:** Playwright tests are designed for CI/CD pipelines
- **Contract-driven:** Tests validate behavioral contracts (HC-XX-NNN). Link tests to contracts for compliance tracking.
- **Chrome MCP vs Playwright MCP:** Use Chrome for desktop debugging, Playwright for automation

---
