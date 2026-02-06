# End-to-End Control Flow Test

This document describes the manual end-to-end test for Phase 5 control features.

## Prerequisites

1. ActionFlows Dashboard backend running on `http://localhost:3001`
2. ActionFlows Dashboard app running (Electron or web)
3. MCP server configured in Claude Desktop
4. Claude session with ActionFlows orchestrator

## Test Scenario 1: Pause and Resume

### Setup

1. Start Claude session in a project with ActionFlows
2. Request orchestrator to compile a chain with 5+ steps
3. Open Dashboard and attach the session

### Test Steps

1. **Issue Pause Command**
   - Wait for chain to start executing (step 1 in progress)
   - Click "Pause" button in session pane header
   - **Expected**: Button changes to "Pausing..."

2. **Verify Pause Acknowledged**
   - **Expected**: Within 10 seconds, orchestrator acknowledges pause
   - **Expected**: Button changes to "Paused"
   - **Expected**: No new steps spawn after current step completes
   - **Expected**: Chain status shows "Paused"

3. **Issue Resume Command**
   - Click "Resume" button
   - **Expected**: Button changes to "Resuming..."

4. **Verify Resume Acknowledged**
   - **Expected**: Within 5 seconds, orchestrator acknowledges resume
   - **Expected**: Button changes back to "Pause"
   - **Expected**: Execution continues from next step
   - **Expected**: Chain status returns to "Running"

### Success Criteria

- ✅ Pause command queued successfully
- ✅ Orchestrator pauses after completing current step
- ✅ Resume command queued successfully
- ✅ Orchestrator resumes execution from next step
- ✅ All steps after pause complete normally

## Test Scenario 2: Cancel Chain

### Setup

1. Start Claude session and compile a chain with 5+ steps
2. Open Dashboard and attach the session

### Test Steps

1. **Issue Cancel Command**
   - Wait for chain to reach step 2 or 3
   - Click "Cancel" button
   - **Expected**: Confirmation dialog appears

2. **Confirm Cancellation**
   - Click "Yes, Cancel Chain"
   - **Expected**: Dialog closes
   - **Expected**: Button shows "Cancelling..."

3. **Verify Cancel Acknowledged**
   - **Expected**: Within 10 seconds, orchestrator acknowledges cancel
   - **Expected**: Orchestrator aborts remaining steps
   - **Expected**: Chain status shows "Cancelled"
   - **Expected**: Completed steps remain visible
   - **Expected**: Remaining steps marked as skipped or removed

### Success Criteria

- ✅ Cancel confirmation dialog works
- ✅ Cancel command queued successfully
- ✅ Orchestrator stops execution
- ✅ Partial progress preserved
- ✅ UI reflects cancelled state

## Test Scenario 3: Retry Failed Step

### Setup

1. Start Claude session and compile a chain
2. Introduce a failure (e.g., syntax error in code task)
3. Open Dashboard and attach the session
4. Wait for step to fail

### Test Steps

1. **Select Failed Step**
   - Click the failed step node in DAG
   - **Expected**: Step inspector opens on right side

2. **Verify Retry Button**
   - **Expected**: Retry button visible in inspector
   - **Expected**: Button shows "🔄 Retry"

3. **Issue Retry Command**
   - Click "Retry" button
   - **Expected**: Button shows "Retrying..."

4. **Verify Retry Acknowledged**
   - **Expected**: Within 10 seconds, orchestrator acknowledges retry
   - **Expected**: Step status changes to "In Progress"
   - **Expected**: Agent respawns with original inputs
   - **Expected**: After completion, status updates (success or failed again)

### Success Criteria

- ✅ Retry button appears on failed steps
- ✅ Retry command queued successfully
- ✅ Orchestrator respawns the failed step
- ✅ Step uses original inputs
- ✅ If successful, dependent steps can proceed

## Test Scenario 4: Skip Step

### Setup

1. Start Claude session and compile a chain
2. Open Dashboard and attach the session

### Test Steps

1. **Select Pending or Failed Step**
   - Click a pending or failed step
   - **Expected**: Step inspector opens

2. **Verify Skip Button**
   - **Expected**: Skip button visible
   - **Expected**: Button shows "⏭ Skip"

3. **Issue Skip Command**
   - Click "Skip" button
   - **Expected**: Confirmation dialog appears

4. **Confirm Skip**
   - Click "OK" in confirmation
   - **Expected**: Button shows "Skipping..."

5. **Verify Skip Acknowledged**
   - **Expected**: Within 10 seconds, orchestrator acknowledges skip
   - **Expected**: Step status changes to "Skipped"
   - **Expected**: Execution continues to next step
   - **Expected**: Dependent steps proceed (or skip if dependencies required)

### Success Criteria

- ✅ Skip button appears on pending/failed steps
- ✅ Skip confirmation works
- ✅ Skip command queued successfully
- ✅ Orchestrator marks step as skipped
- ✅ Execution continues to next step

## Test Scenario 5: Command Expiration

### Setup

1. Start Claude session but **don't** integrate control polling in orchestrator
2. Open Dashboard and attach the session

### Test Steps

1. **Issue Pause Command**
   - Click "Pause" button
   - **Expected**: Button shows "Pausing..."

2. **Wait 5+ Minutes**
   - Do NOT acknowledge the command in Claude
   - **Expected**: After 5 minutes, backend expires the command

3. **Verify Expiration**
   - **Expected**: Dashboard shows "Command expired - session may be disconnected"
   - **Expected**: Button returns to normal state

### Success Criteria

- ✅ Commands expire after 5 minutes
- ✅ UI reflects expiration
- ✅ Expired commands don't block new commands

## Test Scenario 6: Graceful Degradation (Backend Down)

### Setup

1. Start Claude session with control polling enabled
2. Open Dashboard and attach the session
3. **Stop the backend** (`Ctrl+C`)

### Test Steps

1. **Attempt to Issue Command**
   - Click "Pause" button
   - **Expected**: Button shows "Pausing..." briefly
   - **Expected**: Error message appears (console or toast)
   - **Expected**: Button returns to normal state

2. **Verify Orchestrator Continues**
   - In Claude session, verify orchestrator continues executing
   - **Expected**: `check_commands` returns empty array on error
   - **Expected**: Orchestrator does NOT fail
   - **Expected**: Chain execution proceeds normally

3. **Restart Backend**
   - Start backend again
   - Click "Pause" button
   - **Expected**: Command works normally after backend recovers

### Success Criteria

- ✅ Backend unavailable doesn't crash Dashboard
- ✅ Backend unavailable doesn't crash orchestrator
- ✅ Error messages shown to user
- ✅ System recovers when backend comes back online

## Test Scenario 7: Multiple Simultaneous Commands

### Setup

1. Start Claude session and compile a long chain (10+ steps)
2. Open Dashboard and attach the session

### Test Steps

1. **Issue Pause**
   - Click "Pause"
   - **Expected**: Command queued

2. **Immediately Issue Cancel**
   - Before pause is acknowledged, click "Cancel"
   - **Expected**: Cancel command also queued

3. **Verify Orchestrator Processes Both**
   - **Expected**: Orchestrator receives both commands
   - **Expected**: Cancel takes precedence (aborts chain)
   - **Expected**: Both commands acknowledged

### Success Criteria

- ✅ Multiple commands can be queued
- ✅ Orchestrator processes all commands
- ✅ Conflicting commands handled gracefully (last wins)

## Regression Tests

After all scenarios pass, verify that:

1. **Basic visualization still works** (DAG, Timeline, Step Inspector)
2. **Multi-session support still works** (attach multiple sessions)
3. **Real-time updates still work** (events propagate correctly)
4. **Session tree still works** (users and sessions display)

## Test Results

| Scenario | Date | Tester | Status | Notes |
|----------|------|--------|--------|-------|
| 1. Pause/Resume | | | ⬜ Not Run | |
| 2. Cancel | | | ⬜ Not Run | |
| 3. Retry | | | ⬜ Not Run | |
| 4. Skip | | | ⬜ Not Run | |
| 5. Expiration | | | ⬜ Not Run | |
| 6. Degradation | | | ⬜ Not Run | |
| 7. Multiple Commands | | | ⬜ Not Run | |
| Regression | | | ⬜ Not Run | |

**Status Legend**: ⬜ Not Run | ✅ Pass | ❌ Fail | ⚠️ Partial

## Known Issues

*(Document any known issues or edge cases discovered during testing)*

---

**Phase 5 Complete When**: All scenarios pass ✅
