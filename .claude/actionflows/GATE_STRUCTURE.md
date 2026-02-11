# Orchestrator Gate Structure

> Map of all orchestrator execution gates, checkpoints, and logging requirements. Organized by execution phase.

---

## Overview

The orchestrator executes work through **5 phases** with **14 gates** and **12 log points**.

```
REQUEST RECEPTION (Gates 1-3)
    ↓
CHAIN COMPILATION (Gates 4-6)
    ↓
CHAIN EXECUTION (Gates 7-10)
    ↓
COMPLETION (Gates 11-12)
    ↓
POST-EXECUTION (Gates 13-14)
```

---

## Phase 1: REQUEST RECEPTION

Entry: Human message | Exit: Chain compiled for approval

### Gate 1: Parse & Understand Request

**Checkpoint:** Parse human message, identify intent, extract scope

**Produces Log?** ❌ No (internal parsing, no artifact)

**Notes:** This is orchestrator reasoning, not delegated work. No log needed.

---

### Gate 2: Route to Context

**Checkpoint:** Match request to workbench context (work/maintenance/explore/review/settings/pm/intel)

**Produces Log?** ✅ YES

**Log Type:** `routing-decision`

**Expected Location:** `.claude/actionflows/logs/gates/routing-decision_[timestamp]/`

**Log Contents:**
```yaml
Human Request: [exact message]
Context Selected: [work|maintenance|explore|review|settings|pm|intel]
Routing Rationale: [why this context?]
Confidence: [high|medium|low]
Alternatives Considered: [other contexts]
```

**Current Status:** 🔴 NOT LOGGED (internal decision only)

---

### Gate 3: Detect Special Work Types

**Checkpoint:** Detect if request is:
- Format implementation work (route to contract-format-implementation/)
- Harmony/audit work (route to harmony audit flow)
- Flow creation work (route to flow-creation/)
- Registry edit (handle directly)

**Produces Log?** ✅ YES (when special work detected)

**Log Type:** `work-type-detection`

**Expected Location:** `.claude/actionflows/logs/gates/work-type-detection_[timestamp]/`

**Log Contents:**
```yaml
Request Type: [format-work|harmony-work|flow-work|registry-edit|standard-work]
Triggers Matched: [detection criteria]
Routing Decision: [which flow or direct action]
Scope Classification: [simple|complex|infrastructure]
```

**Current Status:** 🔴 NOT LOGGED (internal decision only)

---

## Phase 2: CHAIN COMPILATION

Entry: Context & scope understood | Exit: Chain presented to human

### Gate 4: Compile Action Chain

**Checkpoint:** Compose chain from FLOWS.md or ACTIONS.md, structure steps, determine parallelization

**Produces Log?** ✅ YES

**Log Type:** `chain-compilation`

**Expected Location:** `.claude/actionflows/logs/gates/chain-compilation_[timestamp]/`

**Log Contents:**
```yaml
Chain Name: [human-readable title]
Human Intent: [one-line request]
Source: [flow-name/ | composed-from | meta-task]
Steps:
  1: [action/ | model | inputs | dependencies]
  2: [action/ | model | inputs | dependencies]
Execution Pattern: [sequential | parallel | hybrid]
Rationale: [why this chain?]
Alternative Chains: [if considered]
```

**Current Status:** 🟡 PARTIALLY LOGGED (response format shows structure, but not archived as gate log)

---

### Gate 5: Present Chain to Human

**Checkpoint:** Display chain in response format, request approval

**Produces Log?** ✅ YES

**Log Type:** `chain-approval-request`

**Expected Location:** `.claude/actionflows/logs/gates/chain-approval-request_[timestamp]/`

**Log Contents:**
```yaml
Chain: [from Gate 4]
Presented To: [human]
Timestamp: [presentation time]
Awaiting Response: [yes/no]
Suppression Options: [skip second opinions, etc]
```

**Current Status:** 🟡 IMPLICIT (presented in response, but not archived)

---

### Gate 6: Human Approval/Rejection

**Checkpoint:** Human says "yes", "no", or requests modifications

**Produces Log?** ✅ YES

**Log Type:** `human-approval`

**Expected Location:** `.claude/actionflows/logs/gates/human-approval_[timestamp]/`

**Log Contents:**
```yaml
Decision: [approved|rejected|modified]
Human Response: [exact message]
Chain Presented: [chain from Gate 4]
Modifications Requested: [if any]
Suppression Flags: [skip second opinions, etc]
Timestamp: [decision time]
```

**Current Status:** 🔴 NOT LOGGED (approval is implicit in human message, not captured as artifact)

---

## Phase 3: CHAIN EXECUTION

Entry: Chain approved | Exit: All steps complete

### Gate 7: Execute Step N

**Checkpoint:** Spawn agent/tool for step N, wait for completion

**Produces Log?** ✅ YES

**Log Type:** `step-execution` (per action type)

**Expected Location:** `.claude/actionflows/logs/[action-type]/[session-name]_[timestamp]/`

**Log Contents:** Depends on action type:
- `analyze/` → Analysis report
- `code/` → Code changes, modified files
- `review/` → Review findings, approval scores
- `plan/` → Planning document, roadmap
- `test/` → Test results, pass/fail counts
- `brainstorm/` → Brainstorm output, ideas
- etc.

**Current Status:** 🟢 FULLY LOGGED (each action produces logs in standard locations)

---

### Gate 8: Step Completion Format

**Checkpoint:** Orchestrator logs step completion (informational, not approval)

**Produces Log?** ✅ YES

**Log Type:** `step-completion`

**Expected Location:** `.claude/actionflows/logs/orchestrator/step-completion_[timestamp]/` OR appended to execution log

**Log Format:**
```
>> Step N complete: action/ -- [one-line result]. Continuing to Step N+1...
```

**Current Status:** 🟡 PARTIAL (shown in response format, may not be archived)

---

### Gate 9: Mid-Chain Evaluation (Step Boundary Evaluation)

**Checkpoint:** After step completion, run 6-trigger check:
1. Agent Output Signals (errors, warnings, partial completion)
2. Pattern Recognition (matches known pattern?)
3. Dependency Discovery (new dependencies revealed?)
4. Quality Threshold (passes quality bar?)
5. Chain Redesign Initiative (scope changed?)
6. Reuse Opportunity (pattern for future flow?)

**Produces Log?** ✅ YES (when any trigger fires)

**Log Type:** `mid-chain-evaluation`

**Expected Location:** `.claude/actionflows/logs/gates/mid-chain-evaluation_[timestamp]/`

**Log Contents:**
```yaml
Step Completed: [action/]
Trigger Evaluation:
  1. Output Signals: [detected signals]
  2. Pattern Recognition: [pattern matched?]
  3. Dependency Discovery: [new deps?]
  4. Quality Threshold: [pass/fail]
  5. Chain Redesign: [redesign needed?]
  6. Reuse Opportunity: [new flow candidate?]
Decision: [continue|recompile|halt]
Recompilation: [yes/no, if yes show new steps]
```

**Current Status:** 🔴 NOT LOGGED (internal evaluation, not captured as artifact)

---

### Gate 10: Auto-Trigger Detection

**Checkpoint:** Detect if step output matches auto-trigger criteria:
- After `review/` → insert `second-opinion/`
- After `audit/` → insert `second-opinion/`
- After `analyze/` (optional) → insert `second-opinion/`
- After contract-layer code → insert validation chain
- After agent surfaces partial completion → insert follow-up chain
- etc.

**Produces Log?** ✅ YES

**Log Type:** `auto-trigger-detection`

**Expected Location:** `.claude/actionflows/logs/gates/auto-trigger-detection_[timestamp]/`

**Log Contents:**
```yaml
Step Completed: [action/]
Auto-Trigger Criteria:
  Review Output: [present? yes/no]
  Audit Output: [present? yes/no]
  Analyze Output: [present? yes/no, optional?]
  Partial Completion: [score < 100%? yes/no]
  Contract Changes: [detected? yes/no]
Triggers Fired: [list of triggered auto-rules]
Steps Inserted: [new steps added to chain]
Updated Chain: [revised execution plan]
```

**Current Status:** 🟡 PARTIAL (second-opinion auto-triggers shown in response, but not archived as gate log; other triggers not captured)

---

## Phase 4: COMPLETION

Entry: All chain steps complete | Exit: Results logged & archived

### Gate 11: Chain Completion

**Checkpoint:** All steps completed, results aggregated, learning surface prepared

**Produces Log?** ✅ YES

**Log Type:** `chain-completion`

**Expected Location:** `.claude/actionflows/logs/orchestrator/chain-completion_[timestamp]/` OR linked from execution logs

**Log Contents:**
```yaml
Chain Executed: [chain name]
All Steps: [list with results]
Total Duration: [time]
Quality Assessment: [approval score, concerns]
Learnings Surfaced: [yes/no, count]
Files Modified: [count, lines added/deleted]
Commits Created: [count, hashes]
Status: [success|success-with-changes|needs-work|failed]
Next Steps Auto-Compiled: [yes/no]
```

**Current Status:** 🟡 PARTIAL (step-by-step completion shown, but no aggregate chain completion log)

---

### Gate 12: Archive & Indexing

**Checkpoint:** Log results to INDEX.md, LEARNINGS.md, catalog as needed

**Produces Log?** ✅ YES

**Log Type:** `archive-index-entry`

**Expected Location:** `INDEX.md` entry or `.claude/actionflows/logs/archive/[date]/`

**Log Contents:**
```yaml
Date: [execution date]
Description: [chain name + outcome]
Pattern: [execution pattern used]
Outcome: [success/partial/failure + metrics]
Indexed: [INDEX.md entry created]
Learnings: [linked to LEARNINGS.md]
```

**Current Status:** 🟢 MOSTLY DONE (INDEX.md entries created, but not formalized as gate log)

---

## Phase 5: POST-EXECUTION

Entry: Chain archived | Exit: Follow-up work queued

### Gate 13: Learning Surface

**Checkpoint:** Extract learnings from completion, surface to human

**Produces Log?** ✅ YES

**Log Type:** `learning-surfaced`

**Expected Location:** `LEARNINGS.md` + `.claude/actionflows/logs/learnings/[topic]_[timestamp]/`

**Log Contents:**
```yaml
Issue: [problem discovered]
Root Cause: [why it happened]
Suggestion: [what to do]
Severity: [critical|high|medium|low]
Learning ID: [L###]
Referenced In: [which action surfaced this]
```

**Current Status:** 🟢 FULLY LOGGED (learnings captured in agent outputs, added to LEARNINGS.md)

---

### Gate 14: Flow Candidate Detection

**Checkpoint:** Evaluate if ad-hoc chain is reusable pattern (2+ recurrences or domain value)

**Produces Log?** ✅ YES (when flow candidate detected)

**Log Type:** `flow-candidate-detection`

**Expected Location:** `.claude/actionflows/logs/gates/flow-candidate-detection_[timestamp]/`

**Log Contents:**
```yaml
Chain Executed: [ad-hoc chain]
Pattern Recognized: [yes/no]
Reusability Score: [1-10]
Expected Recurrences: [how many times will this pattern occur?]
Domain Value: [generic|framework|project-specific]
Flow Candidate: [yes/no]
Proposed Flow Name: [if candidate]
Follow-up Chain Queued: [yes/no, flow-creation/]
```

**Current Status:** 🟡 PARTIAL (pattern recognition happens, but not formalized as gate log)

---

## Log Coverage Matrix

| Gate | Checkpoint | Log Produced? | Current Status | Priority |
|------|-----------|---------------|---|---|
| 1 | Parse & understand | ❌ No | — | — |
| 2 | Route to context | ✅ YES | 🔴 NOT LOGGED | 🔴 P0 |
| 3 | Detect special work | ✅ YES | 🔴 NOT LOGGED | 🔴 P0 |
| 4 | Compile chain | ✅ YES | 🟡 PARTIAL | 🟡 P1 |
| 5 | Present chain | ✅ YES | 🟡 IMPLICIT | 🟡 P1 |
| 6 | Human approval | ✅ YES | 🔴 NOT LOGGED | 🔴 P0 |
| 7 | Execute step | ✅ YES | 🟢 FULLY | — |
| 8 | Step completion | ✅ YES | 🟡 PARTIAL | 🟡 P1 |
| 9 | Mid-chain eval | ✅ YES | 🔴 NOT LOGGED | 🔴 P0 |
| 10 | Auto-trigger detect | ✅ YES | 🟡 PARTIAL | 🟡 P1 |
| 11 | Chain completion | ✅ YES | 🟡 PARTIAL | 🟡 P1 |
| 12 | Archive & index | ✅ YES | 🟢 MOSTLY | — |
| 13 | Learning surface | ✅ YES | 🟢 FULLY | — |
| 14 | Flow candidate detect | ✅ YES | 🟡 PARTIAL | 🟡 P1 |

---

## Log Directory Structure (Proposed)

```
.claude/actionflows/logs/
├── gates/                          # New: Orchestrator decision logs
│   ├── routing-decision_*/
│   ├── work-type-detection_*/
│   ├── chain-compilation_*/
│   ├── chain-approval-request_*/
│   ├── human-approval_*/
│   ├── mid-chain-evaluation_*/
│   ├── auto-trigger-detection_*/
│   ├── flow-candidate-detection_*/
│   └── archive-index-entry_*/
│
├── orchestrator/                   # New: Orchestrator execution logs
│   ├── step-completion_*/
│   └── chain-completion_*/
│
├── [action-type]/                  # Existing: Agent execution logs
│   ├── analyze/
│   ├── code/
│   ├── review/
│   ├── second-opinion/
│   ├── plan/
│   ├── test/
│   ├── commit/
│   └── [others]/
│
└── learnings/                      # Existing: Learning logs
    └── [topic]_*/
```

---

## Implementation Roadmap

### Phase 1: Core Gate Logging (P0)
- [ ] Gate 2: Routing decision logs
- [ ] Gate 3: Work type detection logs
- [ ] Gate 6: Human approval logs
- [ ] Gate 9: Mid-chain evaluation logs

**Effort:** 40-50 lines per gate, update ORCHESTRATOR.md

### Phase 2: Execution Logging (P1)
- [ ] Gate 4: Archive chain compilation logs
- [ ] Gate 5: Archive approval request logs
- [ ] Gate 8: Archive step completion logs
- [ ] Gate 10: Improve auto-trigger detection logs
- [ ] Gate 11: Aggregate chain completion logs
- [ ] Gate 14: Formalize flow candidate detection logs

**Effort:** CLI tool to archive logs, update step completion format

### Phase 3: Validation (P2)
- [ ] Create `logs:check` CLI — verify logs exist for all gates
- [ ] Add pre-commit hook to validate log completeness
- [ ] Update INDEX.md to include gate log entries

**Effort:** New CLI tool, ~200 lines

---

## Usage: Finding Missing Logs

**Query:** "What logs should exist for chain execution X?"

```
1. Find chain in INDEX.md
2. Extract pattern: [action1] → [action2] → [action3]
3. For each action, check logs:
   - logs/[action-type]/[session]_[timestamp]/
4. For gates between actions, check:
   - logs/gates/mid-chain-evaluation_*/
   - logs/gates/auto-trigger-detection_*/
5. For final state, check:
   - logs/orchestrator/chain-completion_*/
   - LEARNINGS.md
6. Missing? Report as "Incomplete logs for chain X" (see logs:check CLI)
```

---

## Current Gaps (Summary)

**Completely Missing Logs:**
- Gate 2: Routing decisions (where requests routed, why)
- Gate 3: Work type detection (special work identified, how)
- Gate 6: Human approval (what human approved, when)
- Gate 9: Mid-chain evaluation (why chain modified mid-execution)

**Partially Logged:**
- Gate 4: Chain compilation (visible in response, not archived)
- Gate 5: Approval request (visible in response, not archived)
- Gate 8: Step completion (shown in format, not indexed)
- Gate 10: Auto-triggers (second-opinion logged, others not)
- Gate 11: Chain completion (per-step logged, aggregate missing)
- Gate 14: Flow candidates (detected, not formally logged)

**Fully Logged:**
- Gate 7: Step execution (each action produces logs)
- Gate 12: Archive & indexing (mostly done)
- Gate 13: Learning surface (complete)

---

## Future: Logs Completeness Validator

Once all gates produce logs, create `pnpm run logs:check` CLI:

```bash
$ pnpm run logs:check --commit 9d3bd2b
✅ Commit 9d3bd2b (Harmony Remediation)
  ✅ Gate 2: Routing decision → logs/gates/routing-decision_*/
  ✅ Gate 3: Work type detection → logs/gates/work-type-detection_*/
  ✅ Gate 4: Chain compilation → logs/gates/chain-compilation_*/
  ✅ Gate 6: Human approval → logs/gates/human-approval_*/
  ✅ Gate 7: Step execution → logs/code/, logs/review/, logs/second-opinion/
  ❌ Gate 9: Mid-chain eval → NOT FOUND (expected logs/gates/mid-chain-evaluation_*/?)
  ✅ Gate 11: Chain completion → logs/orchestrator/chain-completion_*/
  ✅ Gate 13: Learnings → LEARNINGS.md + logs/learnings/*/

Result: 8/9 gates logged (missing: mid-chain-evaluation)
```

---

