# End-to-End Test: Framework Integration (Phase 12)

This document specifies end-to-end tests for ActionFlows Workspace framework integration.

## Test Suite Overview

| Test ID | Scenario | Status | Priority |
|---------|----------|--------|----------|
| FI-001 | Bootstrap with Workspace enabled | Manual | Critical |
| FI-002 | Bootstrap with Workspace disabled | Manual | Critical |
| FI-003 | Format enforcement warnings | Manual | High |
| FI-004 | Chain compilation parsing | Manual | Critical |
| FI-005 | Step spawn/complete tracking | Manual | Critical |
| FI-006 | Control commands (pause/cancel) | Manual | High |
| FI-007 | Input injection via Dashboard | Manual | High |
| FI-008 | Terminal output streaming | Manual | High |
| FI-009 | Session start/end tracking | Manual | Critical |
| FI-010 | Graceful degradation (backend down) | Manual | Critical |
| FI-011 | Hook script silent failure | Manual | Critical |

---

## FI-001: Bootstrap with Workspace Enabled

### Objective
Verify that bootstrap script correctly configures Workspace integration when user opts in.

### Prerequisites
- ActionFlows Workspace backend NOT running (we're just testing config, not connection)
- Target project with `.claude/` directory (or will be created)
- Hook scripts exist in `D:/ActionFlowsDashboard/packages/hooks/src/`

### Steps
1. Run bootstrap script:
   ```bash
   cd D:/ActionFlowsDashboard
   node scripts/bootstrap-hooks.ts /path/to/test-project
   ```

2. Answer prompts:
   - Enable Workspace? **YES**
   - Backend URL: **http://localhost:3001**
   - Username: **test-user**
   - Enable format enforcement? **YES**
   - Customize hooks? **NO** (all enabled)

3. Verify `.claude/settings.json` created with:
   ```json
   {
     "workspace": {
       "enabled": true,
       "backendUrl": "http://localhost:3001",
       "user": "test-user",
       "hooks": { /* all true */ },
       "formatEnforcement": { "enabled": true, ... },
       "polling": { ... }
     }
   }
   ```

4. Verify `.claude/hooks/` directory created

5. Verify all 9 hook scripts copied:
   - afw-format-check.ts
   - afw-chain-parse.ts
   - afw-step-spawned.ts
   - afw-step-completed.ts
   - afw-control-check.ts
   - afw-input-inject.ts
   - afw-output-capture.ts
   - afw-session-start.ts
   - afw-session-end.ts

6. Verify `utils/` directory copied with 3 files:
   - utils/http.ts
   - utils/parser.ts
   - utils/settings.ts

7. Verify hooks are executable (Unix):
   ```bash
   ls -la .claude/hooks/*.ts
   # Should show -rwxr-xr-x permissions
   ```

### Expected Result
- ✓ Settings file created with correct structure
- ✓ All hooks copied to `.claude/hooks/`
- ✓ Utils copied to `.claude/hooks/utils/`
- ✓ Scripts are executable
- ✓ Bootstrap script exits with code 0
- ✓ Success message displayed

### Failure Modes
- Settings file malformed → Bootstrap should fail with error
- Hook scripts missing → Bootstrap should warn but continue
- Utils missing → Bootstrap should warn

---

## FI-002: Bootstrap with Workspace Disabled

### Objective
Verify that bootstrap script creates minimal config when user opts out.

### Prerequisites
- Same as FI-001

### Steps
1. Run bootstrap script
2. Answer prompts:
   - Enable Workspace? **NO**

3. Verify `.claude/settings.json` created with:
   ```json
   {
     "workspace": {
       "enabled": false,
       "backendUrl": "http://localhost:3001"
     }
   }
   ```

4. Verify `.claude/hooks/` directory NOT created (or empty)

5. Verify no hook scripts copied

### Expected Result
- ✓ Settings file created with `enabled: false`
- ✓ No hooks installed
- ✓ Bootstrap completes successfully

---

## FI-003: Format Enforcement Warnings

### Objective
Verify that format check hook detects violations and emits warnings without blocking.

### Prerequisites
- Workspace enabled in `.claude/settings.json`
- `afw-format-check` hook installed
- Backend NOT required (this hook doesn't POST events)

### Steps
1. Start Claude Code session in test project

2. As orchestrator, compile a chain with violations:
   ```markdown
   ## Chain Missing Metadata

   | # | Action | Model |
   |---|--------|-------|
   | 1 | code   | haiku |
   ```

3. Check for systemMessage warning in conversation

4. Verify warning lists violations:
   - Missing Source field
   - Missing Type field
   - Missing Ref field
   - Missing Key Inputs column
   - Missing Waits For column
   - Missing Status column
   - Missing Execution mode

5. Verify orchestration continues (not blocked)

6. Now compile a compliant chain:
   ```markdown
   ## Chain: Test Chain

   **Request:** Test format check
   **Source:** Test
   **Type:** test
   **Ref:** First run

   | # | Action | Model | Key Inputs | Waits For | Status |
   |---|--------|-------|------------|-----------|--------|
   | 1 | code/  | haiku | task=test  | —         | Pending |

   **Execution:** Sequential

   Execute?
   ```

7. Verify NO warning appears (compliant format)

### Expected Result
- ✓ Violations detected and warned
- ✓ Warning is non-blocking (execution continues)
- ✓ Compliant chains pass without warning

---

## FI-004: Chain Compilation Parsing

### Objective
Verify that chain parse hook extracts chain structure and POSTs to backend.

### Prerequisites
- Workspace enabled
- Backend running
- `afw-chain-parse` hook installed

### Steps
1. Start backend:
   ```bash
   cd D:/ActionFlowsDashboard/packages/backend
   npm run dev
   ```

2. Start Claude Code session

3. As orchestrator, compile a chain:
   ```markdown
   ## Chain: Test Review Chain

   **Request:** Review auth code
   **Source:** code-review/ flow
   **Type:** code-review
   **Ref:** Similar to execution-123

   | # | Action  | Model  | Key Inputs    | Waits For | Status  |
   |---|---------|--------|---------------|-----------|---------|
   | 1 | code/   | haiku  | task=fix bug  | —         | Pending |
   | 2 | review/ | sonnet | scope=Step 1  | #1        | Pending |
   | 3 | notify/ | haiku  | summary=done  | #2        | Pending |

   **Execution:** Sequential

   Execute?
   ```

4. Check backend logs for `ChainCompiledEvent` received

5. Open Dashboard and verify chain appears with:
   - Title: "Test Review Chain"
   - Source: "code-review/"
   - 3 steps with correct actions/models
   - Execution mode: Sequential
   - Dependencies: Step 2 waits for 1, Step 3 waits for 2

### Expected Result
- ✓ Chain parsed correctly from markdown table
- ✓ Event POSTed to backend
- ✓ Chain visible in Dashboard

---

## FI-005: Step Spawn/Complete Tracking

### Objective
Verify that step lifecycle hooks emit events as agents spawn and complete.

### Prerequisites
- Workspace enabled
- Backend running
- `afw-step-spawned` and `afw-step-completed` hooks installed

### Steps
1. Start backend and Dashboard

2. Compile and execute a simple chain:
   ```markdown
   ## Chain: Single Step Test

   **Request:** Test step tracking
   **Source:** Test
   **Type:** test
   **Ref:** First run

   | # | Action  | Model  | Key Inputs | Waits For | Status  |
   |---|---------|--------|------------|-----------|---------|
   | 1 | notify/ | haiku  | test=true  | —         | Pending |

   **Execution:** Single step
   ```

3. Spawn the step (invoke Task tool)

4. Verify Dashboard shows:
   - Step 1 spawned (node turns yellow)
   - Action: "notify/"
   - Model: "haiku"

5. Wait for step to complete

6. Verify Dashboard shows:
   - Step 1 completed (node turns green)
   - Duration displayed
   - Result summary shown

7. Check backend logs for:
   - `StepSpawnedEvent` received
   - `StepCompletedEvent` received

### Expected Result
- ✓ Spawn event emitted when Task tool called
- ✓ Complete event emitted when agent finishes
- ✓ Dashboard visualizes step lifecycle in real-time

---

## FI-006: Control Commands (Pause/Cancel)

### Objective
Verify that Dashboard control commands (pause/cancel) are enforced by hook.

### Prerequisites
- Workspace enabled
- Backend running
- Dashboard running
- `afw-control-check` hook installed

### Steps
1. Start session and compile a multi-step chain

2. Begin execution (spawn Step 1)

3. While Step 1 is running, click **Pause** in Dashboard

4. Verify Dashboard shows "Paused" state

5. Attempt to spawn Step 2 (orchestrator tries to continue)

6. Verify `afw-control-check` hook BLOCKS the tool call (exit code 2)

7. Verify Claude receives error message:
   ```
   [ActionFlows Dashboard] PAUSE command pending
   Chain paused by Dashboard user. Please resume or cancel from Dashboard.
   ```

8. Click **Resume** in Dashboard

9. Verify next Task spawn succeeds (not blocked)

10. Repeat test with **Cancel** command:
    - Click Cancel in Dashboard
    - Verify next Task spawn is blocked
    - Verify "CANCEL command pending" message

### Expected Result
- ✓ Pause command blocks subsequent spawns
- ✓ Cancel command blocks subsequent spawns
- ✓ Error message displayed to orchestrator
- ✓ Resume clears pause state

---

## FI-007: Input Injection via Dashboard

### Objective
Verify that Dashboard conversation interface injects user input into orchestrator.

### Prerequisites
- Workspace enabled
- Backend running
- Dashboard running
- `afw-input-inject` hook installed

### Steps
1. Start session

2. As orchestrator, ask a question:
   ```markdown
   ## Chain: Test Chain

   ... (chain details)

   Execute?
   ```

3. Verify Dashboard conversation panel shows:
   - "Awaiting input" indicator (pulsing dot)
   - Question text: "Execute?"
   - Quick response buttons: [Yes] [No] [Show details]

4. In Dashboard, click **Yes** button

5. Verify `afw-input-inject` hook receives input from backend

6. Verify orchestrator receives systemMessage:
   ```
   User: Yes
   ```

7. Verify orchestration continues with "Yes" as answer

8. Test timeout scenario:
   - Ask another question
   - Wait 30+ seconds without responding
   - Verify hook times out and returns:
     ```
     [Awaiting Dashboard input...]
     ```

### Expected Result
- ✓ Dashboard detects question and shows input UI
- ✓ User input injected as systemMessage
- ✓ Orchestrator receives input and continues
- ✓ Timeout handled gracefully

---

## FI-008: Terminal Output Streaming

### Objective
Verify that agent terminal output streams to Dashboard.

### Prerequisites
- Workspace enabled
- Backend running
- Dashboard running
- `afw-output-capture` hook installed

### Steps
1. Start session and execute a chain with a bash-heavy agent

2. Spawn an agent that runs bash commands:
   ```
   Task(prompt="Run: echo 'Hello World' && ls")
   ```

3. Verify Dashboard terminal panel shows:
   - `[#1 code/] Hello World` (stdout in white)
   - `[#1 code/] file1.txt` (stdout in white)
   - `[#1 code/] file2.txt` (stdout in white)

4. Test stderr:
   ```
   Task(prompt="Run: cat nonexistent.txt")
   ```

5. Verify Dashboard terminal shows:
   - `[#2 code/] cat: nonexistent.txt: No such file or directory` (stderr in red)

6. Verify step attribution:
   - Each line prefixed with step number and action

### Expected Result
- ✓ Stdout captured and displayed
- ✓ Stderr captured and displayed (different color)
- ✓ Step attribution shown
- ✓ Output appears in real-time

---

## FI-009: Session Start/End Tracking

### Objective
Verify that session lifecycle events are emitted and tracked.

### Prerequisites
- Workspace enabled
- Backend running
- Dashboard running
- `afw-session-start` and `afw-session-end` hooks installed

### Steps
1. Start Claude Code session in test project

2. Verify Dashboard shows:
   - New session appears in user list
   - Session ID displayed
   - CWD shown
   - Status: "Active"

3. Check backend logs for `SessionStartedEvent`

4. Perform some work (compile and execute a chain)

5. End Claude Code session (Ctrl+D or exit)

6. Verify Dashboard shows:
   - Session status changes to "Ended"
   - Duration calculated

7. Check backend logs for `SessionEndedEvent`

8. Verify session data saved to JSON:
   ```bash
   ls D:/ActionFlowsDashboard/packages/backend/data/sessions/
   # Should see YYYY-MM-DD.json file
   ```

9. Verify Redis cleanup (session no longer in memory)

### Expected Result
- ✓ Session start detected and registered
- ✓ Session appears in Dashboard immediately
- ✓ Session end detected and finalized
- ✓ Data persisted to JSON
- ✓ Redis cleaned up

---

## FI-010: Graceful Degradation (Backend Down)

### Objective
Verify that hooks fail silently when backend is unreachable.

### Prerequisites
- Workspace enabled in settings
- All hooks installed
- Backend NOT running (deliberately)

### Steps
1. Stop backend server:
   ```bash
   # Kill backend process
   ```

2. Start Claude Code session

3. Verify session starts normally (no crash)

4. Compile and execute a chain

5. Verify orchestration proceeds normally:
   - No hook errors block execution
   - Chain compilation succeeds
   - Step spawning succeeds
   - Steps complete successfully

6. Check Claude Code output for hook warnings:
   ```
   [AFW] Failed to post event to backend
   Error posting event: fetch failed
   ```

7. Verify warnings are logged but don't crash

8. Verify all hooks exit with code 0 (silent failure)

### Expected Result
- ✓ Orchestration continues when backend down
- ✓ No crashes or fatal errors
- ✓ Hooks log warnings but don't throw
- ✓ All hooks exit with code 0

---

## FI-011: Hook Script Silent Failure

### Objective
Verify that ALL hooks implement silent failure pattern (exit 0 on errors).

### Prerequisites
- All hooks installed
- Backend NOT running (to trigger errors)

### Steps
1. Test each hook individually with malformed input or backend failure

2. **afw-format-check:**
   - Feed malformed JSON to stdin
   - Verify exits with code 0

3. **afw-chain-parse:**
   - Feed malformed JSON
   - Verify exits with code 0 (no POST failure crash)

4. **afw-step-spawned:**
   - Feed JSON missing required fields
   - Verify exits with code 0

5. **afw-step-completed:**
   - Feed JSON missing required fields
   - Verify exits with code 0

6. **afw-control-check:**
   - Backend down (can't fetch commands)
   - Verify exits with code 0 (allows tool call)

7. **afw-input-inject:**
   - Backend down (can't poll for input)
   - Verify exits with code 0 (returns timeout message)

8. **afw-output-capture:**
   - Backend down (can't POST output)
   - Verify exits with code 0

9. **afw-session-start:**
   - Backend down (can't POST event)
   - Verify exits with code 0

10. **afw-session-end:**
    - Backend down (can't POST event)
    - Verify exits with code 0

### Expected Result
- ✓ All hooks handle errors gracefully
- ✓ All hooks exit with code 0 on failure
- ✓ No uncaught exceptions
- ✓ Orchestration never blocked by hook failures

---

## Test Execution Log

| Test ID | Date | Tester | Status | Notes |
|---------|------|--------|--------|-------|
| FI-001 | | | ⏳ Pending | |
| FI-002 | | | ⏳ Pending | |
| FI-003 | | | ⏳ Pending | |
| FI-004 | | | ⏳ Pending | |
| FI-005 | | | ⏳ Pending | |
| FI-006 | | | ⏳ Pending | |
| FI-007 | | | ⏳ Pending | |
| FI-008 | | | ⏳ Pending | |
| FI-009 | | | ⏳ Pending | |
| FI-010 | | | ⏳ Pending | |
| FI-011 | | | ⏳ Pending | |

---

## Automated Testing (Future)

While the above tests are manual, they can be partially automated:

- **FI-001, FI-002:** Shell script to run bootstrap and verify files
- **FI-010, FI-011:** Unit tests that mock backend failures and verify exit codes
- **FI-003:** Snapshot testing for format violations
- **FI-004:** JSON comparison of parsed chain vs expected structure

Consider creating:
- `test/e2e/bootstrap.spec.ts` (automated FI-001, FI-002)
- `test/unit/hooks/*.spec.ts` (automated FI-011)
- `test/integration/chain-parse.spec.ts` (automated FI-004)

---

## Troubleshooting Guide

### Problem: Hooks not executing
**Symptoms:** No events appearing in Dashboard, no warnings in Claude output

**Solutions:**
- Verify hooks are in `.claude/hooks/` directory
- Verify hooks are executable (`chmod +x .claude/hooks/*.ts`)
- Check Claude Code version supports hooks
- Set `AFW_ENABLED=true` environment variable
- Check for TypeScript compilation errors

### Problem: "Module not found" errors
**Symptoms:** Hooks crash with import errors

**Solutions:**
- Verify `utils/` directory copied to `.claude/hooks/utils/`
- Verify `@afw/shared` package exists in monorepo
- Check Node.js version (must support ESM imports)
- Verify `packages/shared` is built (`pnpm build` in monorepo root)

### Problem: Events not reaching Dashboard
**Symptoms:** Hooks execute but Dashboard empty

**Solutions:**
- Verify backend is running (`curl http://localhost:3001/health`)
- Check backend URL in settings matches actual backend
- Check WebSocket connection in Dashboard (check browser console)
- Verify Redis is running
- Check backend logs for errors

### Problem: Format warnings too noisy
**Symptoms:** Every chain gets format warning

**Solutions:**
- Disable format check: Set `workspace.hooks.formatCheck: false`
- Or set `AFW_FORMAT_CHECK_ENABLED=false` environment variable
- Or ignore specific violations in settings

---

## Success Criteria

Phase 12 is complete when:
- ✅ All 11 tests pass
- ✅ Bootstrap script works for both enabled and disabled cases
- ✅ All hooks implement silent failure
- ✅ Format enforcement warns but doesn't block
- ✅ Chain parsing works end-to-end
- ✅ Graceful degradation confirmed (backend down = no crash)
- ✅ Documentation complete (BOOTSTRAP_TEMPLATE.md, settings schema)
