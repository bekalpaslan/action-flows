# E2E Chrome MCP Flow

> Create and execute browser-based end-to-end tests using Chrome DevTools MCP.

---

## When to Use

- Creating new E2E test suites for UI features or workflows
- Validating behavioral contracts through browser automation
- Running health checks defined in behavioral contracts (HC-XX-NNN)
- Testing user flows that require browser interaction (navigation, form filling, assertions)
- Regression testing before major releases
- When human requests "create E2E test", "test browser behavior", or "validate UI contract"

---

## Required Inputs From Human

| Input | Description | Example |
|-------|-------------|---------|
| scope | What to test — component, feature, or user flow | "ChatPanel message submission", "Session switching", "all" |
| contracts | Behavioral contract IDs to test or "derive from scope" | "HC-CP-001, HC-CP-002" or "derive from scope" |
| mode | Execution mode | "create-only" (default) or "create-and-execute" |
| focus | Narrow focus for test design (optional) | "happy path", "error handling", "accessibility" |

---

## Prerequisites

**CRITICAL:** Before executing tests (mode=create-and-execute), verify:
1. Backend running at `http://localhost:3001` (`pnpm dev:backend`)
2. Frontend running at `http://localhost:5173` (`pnpm dev:app`)
3. No other Chrome instances with same profile (Chrome MCP profile lock constraint)
4. Chrome DevTools MCP available in orchestrator environment

If any prerequisite fails → Flow errors. Human must fix and re-run.

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
3. UI selectors/interactions needed
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
- requirements: Design E2E test scenarios from contract analysis (Step 1)
- context: Contract health checks, scope, focus (if provided)
- depth: detailed
- output_format: structured test plan

Output: Test plan with:
1. Test file location (test/e2e/chrome-mcp-{feature}.test.ts)
2. Test scenarios (array of { name, steps, preconditions, assertions })
3. Chrome MCP action mappings (navigate, snapshot, click, fill, wait_for, evaluate_script)
4. Selector mapping (contract selectors → a11y tree UIDs)
5. Mock data (if needed for test execution)
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
- task: Create test definition file from approved test plan (Step 3)
- context: Test plan, contract health checks, selector mappings
- output_path: test/e2e/chrome-mcp-{feature}.test.ts
- style: Match existing test/e2e/chrome-mcp-*.test.ts format

Test file must export:
- export const tests: TestDefinition[] with each test scenario
- Each TestDefinition: { id, name, description, steps: TestStep[] }
- Each TestStep uses Chrome MCP tools: navigate, snapshot, click, fill, wait_for, evaluate_script
- Use a11y tree UIDs (from snapshots) NOT CSS selectors
- Include contract health check IDs (HC-XX-NNN) in test metadata
```

**Gate:** Test code file generated and syntax-valid.

---

### Step 5: Mode Branch

**If mode = "create-only":**
- Skip Steps 6-7
- Flow ends after code review
- Test file ready for manual execution or future automation

**If mode = "create-and-execute":**
- Proceed to Step 6 (Chrome MCP Test Execution)

---

### Step 6: Execute Tests via Chrome MCP (create-and-execute mode only)

**Action:** ORCHESTRATOR-DIRECT (Chrome MCP Test Executor)
**Model:** N/A (Orchestrator uses MCP tools)
**Waits for:** Step 4 + prerequisites verified

**Execution (Orchestrator Direct):**

The orchestrator directly executes the test file using Chrome MCP tools:

1. **Load test definitions** from Step 4 output file
2. **For each test:**
   - Navigate to frontend URL (`http://localhost:5173`)
   - Take snapshot to get a11y tree and UIDs
   - Execute TestSteps in sequence:
     - `navigate_page`: Go to test URL
     - `take_snapshot`: Get current page state + UIDs
     - `click`: Click element by UID
     - `fill`: Fill form field by UID
     - `wait_for`: Wait for text to appear
     - `evaluate_script`: Run JS assertions
   - Capture pass/fail with screenshots/assertions
3. **Output results** to log folder with:
   - Test name, status (pass/fail)
   - Assertion results
   - Screenshots (on failure)
   - Execution time

**Critical Notes:**
- This is NOT delegation — Orchestrator is the executor (same as registry edits)
- Chrome MCP uses a11y snapshots + UIDs, NOT CSS selectors
- Snapshots obtained via `take_snapshot` provide UIDs for interaction
- One Chrome instance at a time (profile lock constraint)
- Both backend (3001) + frontend (5173) must be running

**Gate:** Tests executed. Results logged.

---

### Step 7: Review Test Execution Results

**Action:** `.claude/actionflows/actions/review/`
**Model:** sonnet
**Waits for:** Step 6

**Spawn after Step 6:**
```
Read your definition in .claude/actionflows/actions/review/agent.md

Input:
- scope: Test results from Step 6 (execution log)
- type: test-review
- context: Test plan from Step 3, contract expectations

Review and report:
1. Pass/fail summary (X passing, Y failing)
2. Failed test root causes (selector errors, app bugs, test logic)
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
                    ├──→ Step 2 (plan) → Step 3 (HUMAN GATE) → Step 4 (code) → Step 6 (chrome-mcp-test) → Step 7 (review) → END
```

**Parallel groups:**
- Steps 1 and 2 could run in parallel if Step 1 completes early (but Step 2 depends on Step 1 output)

---

## Chains With

- ← Triggered when human requests "create E2E test" or "test browser behavior"
- ← Triggered when new behavioral contracts are created (contract-index/)
- → code-and-review/ (to fix app bugs discovered by tests)
- → post-completion/ (after test execution and review complete)
- → contract-compliance-audit/ (when test results reveal contract drift)

---

## Example: Create-Only Mode

```
Human: "Create an E2E test for ChatPanel message submission (contract HC-CP-001)"

Orchestrator Routes to: e2e-chrome-mcp/, mode=create-only

Step 1: Analyze behavioral contracts for ChatPanel
- Identifies HC-CP-001: Message submission workflow
- Extracts assertions: message appears in chat, backend receives event

Step 2: Plan test scenarios
- Test name: "User submits message and sees it in chat"
- Steps:
  1. Navigate to http://localhost:5173
  2. Take snapshot (get UIDs for input, send button, chat area)
  3. Click input field (by UID)
  4. Fill with "Hello"
  5. Click send button (by UID)
  6. Wait for message to appear in chat
  7. Evaluate: message.text === "Hello"

Step 3: HUMAN GATE
Approve? → YES

Step 4: Code generation
- Generates test/e2e/chrome-mcp-chatpanel-submit.test.ts
- Exports TestDefinition with steps + HC-CP-001 reference

Step 7: Review
- Confirms test code is well-formed
- Flow ends

Output: test/e2e/chrome-mcp-chatpanel-submit.test.ts ready for use
```

---

## Example: Create-and-Execute Mode

```
Human: "Create and run an E2E test for ChatPanel. I just started backend and frontend."

Orchestrator Routes to: e2e-chrome-mcp/, mode=create-and-execute

[Steps 1-4: Same as create-only mode]

Step 5: Mode branch → create-and-execute detected

Step 6: Orchestrator executes test via Chrome MCP
- Prerequisite checks pass (backend at 3001, frontend at 5173, Chrome available)
- Loads test definition from Step 4
- Runs test steps using MCP tools:
  1. navigate_page("http://localhost:5173")
  2. take_snapshot() → gets UIDs
  3. click(uid="input-field")
  4. fill(uid="input-field", value="Hello")
  5. click(uid="send-button")
  6. wait_for("Hello") → finds message in chat
  7. evaluate_script() → asserts message.text === "Hello"
- Result: ✅ PASS

Step 7: Review
- Test passed, HC-CP-001 validated
- Coverage: 100% of contract assertions
- Flow ends

Output: Test execution log with screenshots + pass status
```

---

## Example: Create-and-Execute Mode with Failure

```
Human: Same request, but Chrome MCP test fails.

[Steps 1-6: Same, but Step 6 execution fails]

Step 6 Failure:
- Test tries to click input field (by UID from snapshot)
- MCP tool returns: "UID not found in current snapshot"
- Root cause: After navigation, page changed but UID mappings stale

Step 7: Review
- Failure root cause: Selector drift or timing issue
- Recommendation: Add explicit wait before snapshot, or use more stable selector
- Flow ends (or loops back to Step 2 for test plan adjustment)

Output: Test execution log with failure details + diagnostic screenshots
```

---

## Test File Format Reference

Tests must follow the structure in `test/e2e/chrome-mcp-*.test.ts`:

```typescript
import type { TestDefinition, TestStep } from '../chrome-mcp-utils';

export const tests: TestDefinition[] = [
  {
    id: 'HC-CP-001-submit-message',
    name: 'User submits message and sees it in chat',
    description: 'Validates ChatPanel message submission contract (HC-CP-001)',
    steps: [
      {
        action: 'navigate',
        url: 'http://localhost:5173',
      },
      {
        action: 'snapshot',
        description: 'Get current page state and UIDs',
      },
      {
        action: 'click',
        uid: '{uid-from-snapshot}',
        description: 'Click message input field',
      },
      {
        action: 'fill',
        uid: '{uid-from-snapshot}',
        value: 'Test message',
        description: 'Type message',
      },
      {
        action: 'click',
        uid: '{uid-from-snapshot}',
        description: 'Click send button',
      },
      {
        action: 'wait_for',
        text: 'Test message',
        timeout: 5000,
        description: 'Wait for message to appear in chat',
      },
      {
        action: 'evaluate_script',
        script: 'document.querySelector(".message")?.textContent === "Test message"',
        description: 'Assert message matches input',
      },
    ],
  },
];
```

---

## Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| Chrome MCP profile lock error | Close all Chrome instances, try again |
| "UID not found" during click/fill | Verify snapshot taken after page load, use newer UID |
| Test timeout waiting for text | Increase timeout, or add explicit waits between steps |
| Backend/frontend not running | Start `pnpm dev:backend` and `pnpm dev:app` in separate terminals |
| Selector mismatch (CSS vs UID) | Use UIDs from a11y snapshots, not CSS class names |
| Contract health check not found | Verify HC-XX-NNN ID in contract files (`packages/app/src/contracts/`) |

---

## Notes

- **Chrome MCP execution is orchestrator-direct:** Not a delegated step. Orchestrator uses MCP tools like registry edits.
- **A11y trees > CSS selectors:** Chrome MCP snapshots provide UIDs. Always use UIDs for interaction.
- **One instance at a time:** Chrome DevTools MCP profile constraint. Close other Chrome before testing.
- **Backend + Frontend required:** Both must be running for test execution mode.
- **Test definitions are durable:** Test files can be stored, re-run, and versioned in git.
- **Contract-driven:** Tests validate behavioral contracts (HC-XX-NNN). Link tests to contracts for compliance tracking.

---
