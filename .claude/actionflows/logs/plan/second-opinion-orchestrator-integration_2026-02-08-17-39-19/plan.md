# Implementation Plan: Second Opinion Orchestrator Integration

## Overview

Wire the existing `packages/second-opinion/` CLI into the ActionFlows framework so the orchestrator automatically inserts a `second-opinion/` step after eligible action steps (`review/`, `audit/`). The second-opinion step is a proper spawned agent that runs the CLI, formats the critique, and returns it to the orchestrator for dual-output presentation. The design is minimal: one new action definition, one new ORCHESTRATOR.md section, one ACTIONS.md registry entry, one response format addition, and zero modifications to existing action agents.

---

## Steps

### Step 1: Create `second-opinion/` action directory structure

- **Package:** `.claude/actionflows/actions/second-opinion/`
- **Files:**
  - `.claude/actionflows/actions/second-opinion/agent.md` (CREATE)
  - `.claude/actionflows/actions/second-opinion/instructions.md` (CREATE)
- **Changes:** Define the second-opinion agent. This is a lightweight agent that:
  1. Receives inputs: `actionType`, `claudeOutputPath` (path to the file containing the original agent's output), `originalInput` (description of what was reviewed/audited), and `modelOverride` (optional)
  2. Runs the second-opinion CLI via Bash: `npx tsx packages/second-opinion/src/cli.ts --action <type> --input <desc> --claude-output <path> --output <output-path>`
  3. Reads the CLI's markdown output
  4. Returns the structured critique to the orchestrator in its completion message
  5. If the CLI exits with a skip (Ollama unavailable, no model, timeout), reports `SKIPPED` with reason -- never fails the chain
- **Depends on:** Nothing

#### Exact content for `agent.md`:

```markdown
# Second Opinion Agent

You are the second-opinion agent for ActionFlows Dashboard. You invoke a local Ollama model to provide an independent critique of another agent's output.

---

## Extends

This agent follows these abstract action standards:
- `_abstract/agent-standards` -- Core behavioral principles
- `_abstract/create-log-folder` -- Datetime log folder for outputs
**When you need to:**
- Follow behavioral standards -> Read: `.claude/actionflows/actions/_abstract/agent-standards/instructions.md`
- Create log folder -> Read: `.claude/actionflows/actions/_abstract/create-log-folder/instructions.md`

---

## Your Mission

Run the second-opinion CLI against a previous agent's output and return the structured critique. If Ollama is unavailable or any error occurs, report SKIPPED -- never fail the chain.

---

## Steps to Complete This Action

### 1. Create Log Folder

> **Follow:** `.claude/actionflows/actions/_abstract/create-log-folder/instructions.md`

Create folder: `.claude/actionflows/logs/second-opinion/{description}_{YYYY-MM-DD-HH-MM-SS}/`

### 2. Parse Inputs

Read inputs from the orchestrator's prompt:
- `actionType` -- The action that produced the original output (`review`, `audit`, `analyze`, `plan`)
- `claudeOutputPath` -- Absolute path to the file containing the original agent's output
- `originalInput` -- Brief description of what was reviewed/audited (e.g., file paths, scope description)
- `modelOverride` (optional) -- Specific Ollama model to use instead of configured default

### 3. Verify Prerequisites

1. Check that `claudeOutputPath` exists and is non-empty using Read tool
2. If the file does not exist or is empty, report SKIPPED with reason "no_claude_output" and complete

### 4. Execute Second Opinion CLI

Run the CLI from the project root:

```bash
npx tsx packages/second-opinion/src/cli.ts \
  --action {actionType} \
  --input "{originalInput}" \
  --claude-output "{claudeOutputPath}" \
  --output "{logFolder}/second-opinion-report.md"
```

If `modelOverride` is provided, add `--model {modelOverride}`.

**Timeout:** Allow up to 5 minutes for 32B models. The CLI handles its own per-model timeouts internally.

**Exit handling:**
- Exit code 0: CLI succeeded (may still contain a SKIPPED result in the output)
- Exit code 1: CLI fatal error -- report SKIPPED with the error message

### 5. Read and Validate Output

1. Read `{logFolder}/second-opinion-report.md`
2. Check if the report starts with `# Second Opinion - SKIPPED`
   - If SKIPPED: Extract the reason, report it in completion message
   - If NOT skipped: Continue to formatting

### 6. Generate Output

The CLI writes the full report to the log folder. No additional formatting needed.

Report file: `{logFolder}/second-opinion-report.md`

---

## Completion Message Format

### Successful Critique

```
## Second Opinion Complete

**Action critiqued:** {actionType}/
**Model used:** {model from report metadata}
**Confidence:** {HIGH/MEDIUM/LOW}

### Key Findings
- **Missed issues:** {count}
- **Disagreements:** {count}
- **Strong agreements:** {count}
- **Additional observations:** {count}

### Notable Items (top 3 by severity)
1. {highest severity finding}
2. {next finding}
3. {next finding}

**Full report:** `{logFolder}/second-opinion-report.md`
```

### Skipped

```
## Second Opinion Skipped

**Action:** {actionType}/
**Reason:** {reason}
**Detail:** {error message if any}

No second opinion was produced. The original output stands as-is.
```

---

## Project Context

- **CLI location:** `packages/second-opinion/src/cli.ts`
- **Eligible actions:** review, audit (auto-trigger); analyze, plan (opt-in)
- **Model configs:** 32B for review/audit, 7B for analyze/plan (with fallback chains)
- **Never-throw:** The CLI and this agent both guarantee graceful degradation

---

## Constraints

### DO
- Always use the CLI -- never import or run SecondOpinionRunner directly
- Read the CLI output file to extract key findings for your completion message
- Respect the timeout (5 minutes max)
- Report SKIPPED gracefully for any failure

### DO NOT
- Modify the original agent's output
- Interpret or editorialize the critique -- present it factually
- Fail the chain for any reason -- always complete with either critique or SKIPPED
- Read ORCHESTRATOR.md or delegate to other agents

---

## Learnings Output

**Your completion message to the orchestrator MUST include:**

```
## Learnings

**Issue:** {What happened}
**Root Cause:** {Why}
**Suggestion:** {How to prevent}

[FRESH EYE] {Any discoveries outside your explicit instructions}

Or: None -- execution proceeded as expected.
```
```

#### Exact content for `instructions.md`:

```markdown
# Second Opinion Action

> Invoke local Ollama model for independent critique of agent output.

## Model

haiku (agent is lightweight -- just runs a CLI and reads output)

## Required Inputs

| Input | Description | Example |
|-------|-------------|---------|
| actionType | Action that produced original output | `review`, `audit` |
| claudeOutputPath | Absolute path to the agent's output file | `.claude/actionflows/logs/review/.../review-report.md` |
| originalInput | Brief description of what was reviewed/audited | `packages/backend/src/routes/sessions.ts` |

## Optional Inputs

| Input | Description | Default |
|-------|-------------|---------|
| modelOverride | Specific Ollama model name | (uses config default for action type) |

## Output

Writes: `.claude/actionflows/logs/second-opinion/{description}_{datetime}/second-opinion-report.md`

## Extends

- `_abstract/agent-standards`
- `_abstract/create-log-folder`

## Notes

- Never blocks workflow -- all errors become SKIPPED
- Auto-triggered by orchestrator after review/ and audit/ steps
- Opt-in triggered for analyze/ and plan/ steps (orchestrator must add explicitly)
```

---

### Step 2: Add "Second Opinion Protocol" section to ORCHESTRATOR.md

- **Package:** `.claude/actionflows/`
- **Files:** `.claude/actionflows/ORCHESTRATOR.md` (MODIFY)
- **Changes:** Insert a new section after the "Action Modes" rule (Rule 7) and before "Compose First, Propose Later" (Rule 8). This section defines when and how the orchestrator auto-inserts second-opinion steps.
- **Depends on:** Step 1 (the action must exist to be referenced)

#### Exact additions (insert after Rule 7, before Rule 8):

```markdown
### 7a. Second Opinion Protocol

The orchestrator auto-inserts a `second-opinion/` step after specific actions in compiled chains.

**Auto-trigger (always inserted):**
- After `review/` steps
- After `audit/` steps

**Opt-in trigger (inserted only when orchestrator adds `secondOpinion: true` flag):**
- After `analyze/` steps
- After `plan/` steps

**Never triggered:**
- After `code/`, `test/`, `commit/` steps

#### Step Insertion Rule

When compiling a chain that contains an auto-trigger action, the orchestrator MUST insert a `second-opinion/` step immediately after it:

**Before (without second opinion):**
```
| # | Action   | Waits For |
|---|----------|-----------|
| 1 | analyze/ | --        |
| 2 | code/    | #1        |
| 3 | review/  | #2        |
| 4 | commit/  | #3        |
```

**After (with auto-inserted second opinion):**
```
| # | Action            | Waits For |
|---|-------------------|-----------|
| 1 | analyze/          | --        |
| 2 | code/             | #1        |
| 3 | review/           | #2        |
| 4 | second-opinion/   | #3        |
| 5 | commit/           | #3 (NOT #4) |
```

**Critical: The commit step waits for the ORIGINAL action (#3), NOT the second-opinion step (#4).** The second opinion is informational and never blocks subsequent workflow steps. The orchestrator presents both outputs together before moving to the next human-visible checkpoint.

#### Spawning the Second Opinion Agent

When spawning `second-opinion/`, the orchestrator passes these inputs:
- `actionType`: The action type of the step being critiqued (e.g., `review`)
- `claudeOutputPath`: The absolute path to the critiqued agent's output file (from its log folder)
- `originalInput`: The scope/input that was given to the original action

```python
Task(
  subagent_type="general-purpose",
  model="haiku",
  run_in_background=True,
  prompt="""
Read your definition in .claude/actionflows/actions/second-opinion/agent.md

IMPORTANT: You are a spawned subagent executor.
Do NOT read .claude/actionflows/ORCHESTRATOR.md -- it is not for you.
Do NOT delegate work or compile chains. Execute your agent.md directly.

Project Context:
- Name: ActionFlows Dashboard
- Paths: backend=packages/backend/, frontend=packages/app/, shared=packages/shared/

Input:
- actionType: {action type, e.g., review}
- claudeOutputPath: {absolute path to the output file}
- originalInput: {scope description}
"""
)
```

#### Presenting Dual Output

When both the original action and the second-opinion step complete, the orchestrator presents them together in the step completion format:

```
>> Step {N} complete: {action/} -- {one-line result}.
>> Step {N+1} complete: second-opinion/ -- {critique summary or SKIPPED}.

### Dual Output: {action/} + Second Opinion

**Original ({action/}):**
{Verdict/score from original agent's completion message}

**Second Opinion ({model name} via Ollama):**
{Key findings summary from second-opinion agent's completion message}
- Missed issues: {count}
- Disagreements: {count}
- Notable: {top finding if any}

**Full reports:**
- Original: `{original log path}`
- Critique: `{second-opinion log path}`

Continuing to Step {N+2}...
```

If the second opinion was SKIPPED, present:

```
>> Step {N} complete: {action/} -- {one-line result}.
>> Step {N+1} complete: second-opinion/ -- SKIPPED ({reason}).

Continuing to Step {N+2}...
```

#### Suppressing Second Opinion

The human can suppress auto-triggering by saying "skip second opinions" or "no second opinion" when approving a chain. The orchestrator removes the second-opinion steps before executing.
```

---

### Step 3: Register `second-opinion/` in ACTIONS.md

- **Package:** `.claude/actionflows/`
- **Files:** `.claude/actionflows/ACTIONS.md` (MODIFY)
- **Changes:** Add `second-opinion/` to the Generic Actions table. Add a note in the Action Modes section about auto-triggering.
- **Depends on:** Step 1

#### Exact additions:

**In the Generic Actions table, add a new row:**

```
| second-opinion/ | Ollama critique of agent output | YES | actionType, claudeOutputPath, originalInput | haiku |
```

**After the Action Modes section, add a new section:**

```markdown
## Post-Action Steps

Certain actions automatically trigger follow-up steps:

| Trigger Action | Post-Action Step | Trigger Type | Can Suppress? |
|---------------|-----------------|--------------|---------------|
| review/ | second-opinion/ | Auto | Yes ("skip second opinions") |
| audit/ | second-opinion/ | Auto | Yes ("skip second opinions") |
| analyze/ | second-opinion/ | Opt-in (orchestrator flag) | N/A |
| plan/ | second-opinion/ | Opt-in (orchestrator flag) | N/A |
```

**In the Model Selection Guidelines table, add:**

```
| second-opinion | haiku | Lightweight CLI wrapper |
```

---

### Step 4: Verify review/ and audit/ output consumability

- **Package:** `.claude/actionflows/actions/`
- **Files:** `.claude/actionflows/actions/review/agent.md` (VERIFY - no changes needed), `.claude/actionflows/actions/audit/agent.md` (VERIFY - no changes needed)
- **Changes:** Verify that review/ and audit/ agent outputs are written to deterministic, absolute file paths that the orchestrator can pass to `second-opinion/`. **No modifications required.**
- **Depends on:** Nothing

#### Verification:

**review/agent.md** (line 70): Output is written to `.claude/actionflows/logs/review/{description}_{datetime}/review-report.md`. The orchestrator knows this path because it creates the description and the agent creates the datetime-stamped folder. The orchestrator can observe the agent's completion message which references the log path.

**audit/agent.md** (line 99): Output is written to `.claude/actionflows/logs/audit/{description}_{datetime}/audit-report.md`. Same pattern.

**How the orchestrator gets the path:** The orchestrator reads the agent's completion message, which includes the log folder path. The orchestrator passes this path to the `second-opinion/` agent as `claudeOutputPath`.

**No modifications needed to review/ or audit/ agents.** Their output format (markdown reports in log folders) is already consumable by the second-opinion CLI's `--claude-output` flag, which reads any file.

---

### Step 5: Update FLOWS.md with second-opinion in chain patterns

- **Package:** `.claude/actionflows/`
- **Files:** `.claude/actionflows/FLOWS.md` (MODIFY)
- **Changes:** Update flow chains that contain review/ or audit/ steps to reflect the auto-inserted second-opinion step.
- **Depends on:** Step 2

#### Exact modifications:

**Engineering section -- update `code-and-review/`:**
```
| code-and-review/ | Implement and review code | code -> review -> second-opinion/ -> (loop if needed) |
```

**QA section -- update `audit-and-fix/`:**
```
| audit-and-fix/ | Audit and remediate | audit -> second-opinion/ -> review |
```

**Framework section -- update `action-creation/`:**
```
| action-creation/ | Create a new action | plan -> human gate -> code -> review -> second-opinion/ |
```

**Note:** Not all flows need updating. Only flows where the second opinion adds value for the specific chain's purpose. The orchestrator still auto-inserts for ad-hoc chains.

---

## Dependency Graph

```
Step 1 (create action definition) -> Step 2 (ORCHESTRATOR.md section)
                                  -> Step 3 (ACTIONS.md registration)
                                  -> Step 4 (verify review/audit consumability) [parallel]
Step 2 -> Step 5 (FLOWS.md update)
```

Visual:
```
Step 1 (action def) -+-> Step 2 (orchestrator rules) --> Step 5 (flows update)
                     |-> Step 3 (actions registry)
                     |-> Step 4 (verify existing agents) [parallel with 2,3]
```

---

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Orchestrator can't extract log path from agent completion message | second-opinion/ receives wrong claudeOutputPath, CLI fails to read file | Agent standards require completion messages to include log paths. Enforce in review/audit agent.md. If path extraction fails, second-opinion CLI exits gracefully with SKIPPED. |
| Ollama unavailable in CI/CD or remote environments | second-opinion/ steps always SKIPPED in those environments | By design -- never-throw ensures graceful skip. No workflow impact. |
| 32B model timeout causes chain delays | Chain appears stalled while waiting for slow model | second-opinion/ never blocks commit or subsequent steps (commit waits for original action, not second-opinion). Internal fallback chain drops to 7B -> 4B if primary times out. |
| Orchestrator forgets to insert second-opinion step | Lost coverage on judgment-heavy actions | Clear rule in ORCHESTRATOR.md 7a. Could add a framework-health check that validates chains contain second-opinion after eligible steps. |
| Second opinion disagrees with original -- human confused | Conflicting outputs create decision paralysis | Dual Output format explicitly labels critique as "informational." The original output is authoritative. |
| Chain step numbering changes break "Waits For" references | Steps wait for wrong predecessors | Orchestrator compiles chains dynamically -- numbering is always recalculated. The key rule is: commit waits for the original action, not second-opinion. |

---

## Verification

- [ ] `second-opinion/` action directory exists with agent.md and instructions.md
- [ ] ORCHESTRATOR.md contains "Second Opinion Protocol" section (Rule 7a)
- [ ] ACTIONS.md lists `second-opinion/` in Generic Actions table
- [ ] ACTIONS.md contains "Post-Action Steps" section
- [ ] FLOWS.md chains updated for code-and-review/, audit-and-fix/, action-creation/
- [ ] review/ agent.md is unchanged (output already consumable)
- [ ] audit/ agent.md is unchanged (output already consumable)
- [ ] second-opinion CLI can read review-report.md format (verified by existing --demo mode)
- [ ] Type check passes: `pnpm type-check` (no package changes needed)

---

## Design Rationale

### Why a spawned agent instead of direct CLI call from orchestrator?

The orchestrator's core rule is "it's a sin to produce content." Running a CLI and reading its output IS content production. The second-opinion agent is a proper agent with its own log folder, completion message, and learnings output. This keeps the orchestrator clean.

### Why haiku model for the agent?

The agent itself does almost nothing -- it runs a CLI command, reads a file, and formats a completion message. The heavy lifting (Ollama inference) happens in the CLI process, not in the Claude agent. Haiku is sufficient and fast.

### Why commit doesn't wait for second-opinion?

The critique is informational. It should never delay the workflow. If the critique surfaces a critical missed issue, the human decides whether to act on it -- potentially starting a new chain. The second opinion never auto-modifies anything.

### Why not modify review/ or audit/ agents?

Their output is already in markdown files in log folders. The CLI reads any file via `--claude-output <path>`. No coupling needed. If the output format ever changes, only the CLI's parser needs updating, not the agents.

### Why the "skip second opinions" escape hatch?

For fast iteration during development, waiting for Ollama (even with a 4B model) adds latency. The human should be able to suppress it when speed matters more than coverage.
