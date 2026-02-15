# E2E Playwright Flow

> Create and execute browser-based end-to-end tests using Playwright MCP.

---

## When to Use

- Creating new E2E test suites for UI features or workflows
- Validating behavioral contracts through browser automation
- Running health checks defined in behavioral contracts (HC-XX-NNN)
- Testing user flows that require browser interaction (navigation, form filling, assertions)
- Regression testing before major releases
- When human requests "create E2E test", "test browser behavior", or "validate UI contract"
- **PREFERRED over e2e-chrome-mcp/** for new tests (richer API, better form handling, network monitoring)

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
3. Playwright MCP available in orchestrator environment (no profile lock constraints like Chrome MCP)

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
1. Test file location (test/e2e/playwright-{feature}.test.ts)
2. Test scenarios (array of { name, steps, preconditions, assertions })
3. Playwright MCP action mappings:
   - browser_navigate → navigate to URL
   - browser_snapshot → get a11y tree + refs
   - browser_click → click element by ref
   - browser_fill_form → fill multiple fields efficiently
   - browser_type → type into single field
   - browser_wait_for → wait for text/element
   - browser_evaluate → run JS assertions
   - browser_take_screenshot → capture on failure
4. Selector mapping (contract selectors → a11y tree refs)
5. Mock data (if needed for test execution)
6. Network assertions (if API calls validated)
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
- output_path: test/e2e/playwright-{feature}.test.ts
- style: Match Playwright test definition format (see § Test File Format below)

Test file must export:
- export const tests: TestDefinition[] with each test scenario
- Each TestDefinition: { id, name, description, steps: TestStep[] }
- Each TestStep uses Playwright MCP tools: navigate, snapshot, click, fill_form, type, wait_for, evaluate
- Use a11y tree refs (from snapshots) NOT CSS selectors
- Include contract health check IDs (HC-XX-NNN) in test metadata
- Use browser_fill_form for multi-field forms (more efficient than field-by-field)
- Include network assertions if contract validates API calls
```

**Gate:** Test code file generated and syntax-valid.

---

### Step 5: Mode Branch

**If mode = "create-only":**
- Skip Step 6
- Flow ends after code review (Step 7)
- Test file ready for manual execution or future automation

**If mode = "create-and-execute":**
- Proceed to Step 6 (Playwright Test Execution)

---

### Step 6: Execute Tests via Playwright MCP (create-and-execute mode only)

**Action:** ORCHESTRATOR-DIRECT (Playwright Test Executor)
**Model:** N/A (Orchestrator uses MCP tools)
**Waits for:** Step 4 + prerequisites verified

**Execution (Orchestrator Direct):**

The orchestrator directly executes the test file using Playwright MCP tools:

1. **Load test definitions** from Step 4 output file
2. **For each test:**
   - Navigate to frontend URL (`http://localhost:5173`)
   - Take snapshot to get a11y tree and refs
   - Execute TestSteps in sequence:
     - `browser_navigate`: Go to test URL
     - `browser_snapshot`: Get current page state + refs
     - `browser_click`: Click element by ref
     - `browser_fill_form`: Fill multiple fields at once
     - `browser_type`: Type into single field
     - `browser_wait_for`: Wait for text/element to appear
     - `browser_evaluate`: Run JS assertions
     - `browser_take_screenshot`: Capture on failure
     - `browser_network_requests`: Monitor network calls (if needed)
   - Capture pass/fail with screenshots/assertions
3. **Output results** to log folder with:
   - Test name, status (pass/fail)
   - Assertion results
   - Screenshots (on failure)
   - Network logs (if monitored)
   - Execution time

**Critical Notes:**
- This is NOT delegation — Orchestrator is the executor (same as registry edits)
- Playwright uses a11y snapshots + refs, NOT CSS selectors
- Snapshots obtained via `browser_snapshot` provide refs for interaction
- No profile lock constraints (unlike Chrome MCP)
- Both backend (3001) + frontend (5173) must be running

**Gate:** Tests executed. Results logged.

---

### Step 7: Review Test Results

**Action:** `.claude/actionflows/actions/review/`
**Model:** sonnet
**Waits for:** Step 6 (if create-and-execute) or Step 4 (if create-only)

**Spawn:**
```
Read your definition in .claude/actionflows/actions/review/agent.md

Input:
- scope: Test results from Step 6 (if create-and-execute) OR test code from Step 4 (if create-only)
- type: test-review
- context: Test plan from Step 3, contract expectations

Review and report:
1. Pass/fail summary (X passing, Y failing) — if create-and-execute
2. Failed test root causes (selector errors, app bugs, test logic) — if create-and-execute
3. Code quality (test definitions well-formed?) — if create-only
4. Coverage assessment (which contracts validated?)
5. Recommendations (fix test logic vs app bugs vs contract drift)
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
                    ├──→ Step 2 (plan) → Step 3 (HUMAN GATE) → Step 4 (code) → Step 6 (playwright-test) → Step 7 (review) → END
```

---

## Chains With

- ← Triggered when human requests "create E2E test" or "test browser behavior"
- ← Triggered when new behavioral contracts are created (contract-index/)
- → code-and-review/ (to fix app bugs discovered by tests)
- → post-completion/ (after test execution and review complete)
- → contract-compliance-audit/ (when test results reveal contract drift)

---

## Example: Create-and-Execute Mode

```
Human: "Create and run an E2E test for ChatPanel message submission using Playwright"

Orchestrator Routes to: e2e-playwright/, mode=create-and-execute

Step 1: Analyze behavioral contracts for ChatPanel
- Identifies HC-CP-001: Message submission workflow
- Extracts assertions: message appears in chat, backend receives event

Step 2: Plan test scenarios
- Test name: "User submits message and sees it in chat"
- Steps:
  1. Navigate to http://localhost:5173
  2. Take snapshot (get refs for input, send button, chat area)
  3. Fill form with message text (use browser_fill_form)
  4. Click send button (by ref)
  5. Wait for message to appear in chat
  6. Evaluate: message.text === "Hello"
  7. Monitor network (verify WebSocket message sent)

Step 3: HUMAN GATE
Approve? → YES

Step 4: Code generation
- Generates test/e2e/playwright-chatpanel-submit.test.ts
- Exports TestDefinition with steps + HC-CP-001 reference
- Uses browser_fill_form for efficiency

Step 6: Orchestrator executes test via Playwright MCP
- Prerequisite checks pass (backend at 3001, frontend at 5173, Playwright available)
- Loads test definition from Step 4
- Runs test steps using MCP tools:
  1. browser_navigate("http://localhost:5173")
  2. browser_snapshot() → gets refs
  3. browser_fill_form([{ref: "input-field", value: "Hello"}])
  4. browser_click(ref="send-button")
  5. browser_wait_for("Hello") → finds message in chat
  6. browser_evaluate() → asserts message.text === "Hello"
  7. browser_network_requests() → verifies WebSocket event
- Result: ✅ PASS

Step 7: Review
- Test passed, HC-CP-001 validated
- Coverage: 100% of contract assertions
- Network monitoring confirmed WebSocket message sent
- Flow ends

Output: Test execution log with screenshots + network logs + pass status
```

---

## Test File Format Reference

Tests must follow this structure:

```typescript
import type { TestDefinition, TestStep } from '../playwright-utils';

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
        description: 'Get current page state and refs',
      },
      {
        action: 'fill_form',
        fields: [
          { name: 'message', ref: '{ref-from-snapshot}', type: 'textbox', value: 'Test message' }
        ],
        description: 'Fill message input',
      },
      {
        action: 'click',
        ref: '{send-button-ref}',
        description: 'Click send button',
      },
      {
        action: 'wait_for',
        text: 'Test message',
        timeout: 5000,
        description: 'Wait for message to appear in chat',
      },
      {
        action: 'evaluate',
        function: '() => document.querySelector(".message")?.textContent === "Test message"',
        description: 'Assert message matches input',
      },
    ],
  },
];
```

---

## MCP Tool ID Reference

When the orchestrator executes Playwright steps, use these exact MCP tool IDs:

| Shorthand | Full MCP Tool ID |
|-----------|-----------------|
| browser_navigate | `mcp__plugin_playwright_playwright__browser_navigate` |
| browser_snapshot | `mcp__plugin_playwright_playwright__browser_snapshot` |
| browser_click | `mcp__plugin_playwright_playwright__browser_click` |
| browser_fill_form | `mcp__plugin_playwright_playwright__browser_fill_form` |
| browser_type | `mcp__plugin_playwright_playwright__browser_type` |
| browser_wait_for | `mcp__plugin_playwright_playwright__browser_wait_for` |
| browser_evaluate | `mcp__plugin_playwright_playwright__browser_evaluate` |
| browser_take_screenshot | `mcp__plugin_playwright_playwright__browser_take_screenshot` |
| browser_network_requests | `mcp__plugin_playwright_playwright__browser_network_requests` |
| browser_press_key | `mcp__plugin_playwright_playwright__browser_press_key` |
| browser_hover | `mcp__plugin_playwright_playwright__browser_hover` |
| browser_console_messages | `mcp__plugin_playwright_playwright__browser_console_messages` |
| browser_tabs | `mcp__plugin_playwright_playwright__browser_tabs` |
| browser_close | `mcp__plugin_playwright_playwright__browser_close` |
| browser_install | `mcp__plugin_playwright_playwright__browser_install` |

---

## Playwright vs Chrome MCP

| Feature | Playwright MCP | Chrome MCP |
|---------|---------------|------------|
| Form filling | `browser_fill_form` (multi-field) | Manual field-by-field |
| Network monitoring | `browser_network_requests` | Not available |
| File upload | `browser_file_upload` | Not available |
| Tab management | `browser_tabs` | Limited |
| Keyboard interaction | `browser_press_key` | Limited |
| Profile lock | ❌ No constraint | ✅ One instance at a time |
| Industry adoption | ✅ Playwright standard | Chrome DevTools Protocol |

**Recommendation:** Use e2e-playwright/ for new tests. Keep e2e-chrome-mcp/ for backward compatibility.

---

## Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| "Ref not found" during click/fill | Verify snapshot taken after page load, use newer ref |
| Test timeout waiting for text | Increase timeout, or add explicit waits between steps |
| Backend/frontend not running | Start `pnpm dev:backend` and `pnpm dev:app` in separate terminals |
| Selector mismatch (CSS vs ref) | Use refs from a11y snapshots, not CSS class names |
| Contract health check not found | Verify HC-XX-NNN ID in contract files (`packages/app/src/contracts/`) |
| Network assertion fails | Check browser_network_requests filter settings, verify API call timing |

---

## Notes

- **Playwright execution is orchestrator-direct:** Not a delegated step. Orchestrator uses MCP tools like registry edits.
- **A11y trees > CSS selectors:** Playwright snapshots provide refs. Always use refs for interaction.
- **No profile lock:** Unlike Chrome MCP, Playwright handles multiple instances gracefully.
- **Backend + Frontend required:** Both must be running for test execution mode.
- **Test definitions are durable:** Test files can be stored, re-run, and versioned in git.
- **Contract-driven:** Tests validate behavioral contracts (HC-XX-NNN). Link tests to contracts for compliance tracking.
- **Network monitoring:** Use `browser_network_requests` to validate API calls, WebSocket events.
- **Preferred for new tests:** Richer API than Chrome MCP. Use e2e-playwright/ for all new E2E tests.
