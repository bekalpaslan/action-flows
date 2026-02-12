# Orchestrator Status Analysis

## Framework Health Summary

| Area | Status | Notes |
|------|--------|-------|
| Core routing pipeline | Healthy | ORCHESTRATOR → ORGANIZATION → FLOWS → ACTIONS works |
| Action catalog | Complete | 7 generic + 2 stack-specific + 4 abstract |
| Flow catalog | Complete | 7 flows across 3 departments |
| Agent definitions | Consistent | All agents follow Extends/Mission/Steps/Context/Constraints/Learnings |
| Execution logs | Empty | Framework has never been exercised (INDEX.md count=0) |
| Checklists | Empty | Scaffolded but no checklists created |
| Learnings | Empty | No learnings accumulated yet |
| Boundary enforcement | Strong | Sin Test + Pre-Action Gate + File Reading Permissions table |

**Overall:** Structurally sound, never used. 15 clarity issues identified below.

---

## Clarity Issues

### Issue 1: Hardcoded Working Directory is Wrong

**Severity:** CRITICAL
**Files:** `project.config.md:12`, `actions/commit/agent.md:72`

`project.config.md` says `Working Directory: D:/ActionFlowsDashboard`. `commit/agent.md` says `Working directory: D:/ActionFlowsDashboard`. The actual working directory is `/home/user/action-flows`. Agents using this value for path resolution or git operations will fail or produce wrong results.

**Suggestion:** Remove the hardcoded working directory from `project.config.md` and `commit/agent.md`. The working directory is environment-dependent and should not be baked into framework files. If needed, the orchestrator can inject it at spawn time from the actual runtime environment.

---

### Issue 2: CLAUDE.md Duplicates project.config.md

**Severity:** HIGH
**Files:** `.claude/CLAUDE.md`, `project.config.md`

CLAUDE.md says "See `actionflows/project.config.md` for detailed project-specific values" then immediately duplicates the tech stack, architecture paths, ports, domain concepts, dev commands, and git conventions. Two sources of truth for the same data will drift.

**Suggestion:** CLAUDE.md should contain only: (1) a pointer to `project.config.md`, (2) the ActionFlows session-start instruction, and (3) any CLAUDE.md-specific settings that don't belong in the framework. Strip all duplicated project data.

---

### Issue 3: Spawning Pattern Duplicated in Two Files

**Severity:** MEDIUM
**Files:** `ORCHESTRATOR.md:320-343`, `ACTIONS.md:79-105`

The Task spawning template appears nearly identically in both files. If the prompt structure changes (e.g., adding a new standard field), both files must be updated.

**Suggestion:** Keep the canonical spawning pattern in ACTIONS.md only. ORCHESTRATOR.md should reference it: "See spawning pattern in ACTIONS.md". The orchestrator already reads ACTIONS.md during routing.

---

### Issue 4: File Reading Permissions Table Contradicts Quick Triage

**Severity:** HIGH
**Files:** `ORCHESTRATOR.md:405-415` (permissions table), `ORCHESTRATOR.md:65-84` (quick triage)

The permissions table states `Project code (packages/**): NEVER` for the orchestrator. But Rule 0 (Quick Triage) says "You MAY read project code files directly" when all criteria land in the Quick Triage column. These contradict each other.

**Suggestion:** Add a footnote to the permissions table: "Exception: Quick Triage qualifiers (Rule 0) may read 1-3 project files directly." Or restructure the table to have a "Quick Triage" column.

---

### Issue 5: post-completion Exists as Both Abstract Action and Flow

**Severity:** MEDIUM
**Files:** `actions/_abstract/post-completion/instructions.md`, `flows/engineering/post-completion/instructions.md`

The abstract action defines "commit + registry update" as a behavior pattern. The flow defines "commit action spawn + registry update" as a 2-step flow. They overlap but aren't equivalent — the abstract is behavioral instructions, the flow is an orchestrator chain. The name collision makes it unclear which to use when.

**Suggestion:** Rename the abstract to `_abstract/post-work-protocol/` and keep the flow as `flows/engineering/post-completion/`. The abstract describes *what happens after work*, the flow describes *how the orchestrator chains it*. Distinct names remove ambiguity.

---

### Issue 6: Department-less Actions Bypass Routing Pipeline

**Severity:** MEDIUM
**Files:** `ORGANIZATION.md:37-42`

Three routing entries have `—` as department: `test/`, `analyze/`, and `plan/`. The orchestrator's reception protocol (Steps 3-4) says "Route to Department → Find Flow". When there's no department, the pipeline breaks — these actions bypass it entirely.

**Suggestion:** Add an explicit "Direct Actions" section to ORGANIZATION.md that explains: "The following actions are invoked directly by the orchestrator without department routing. They are atomic and don't require a flow." List test/, analyze/, plan/ there. Update the reception protocol in ORCHESTRATOR.md to add a check between Step 2 and Step 3: "Is this a direct action? → Spawn directly."

---

### Issue 7: Model Override in Flows vs Action Defaults

**Severity:** LOW
**Files:** `flows/framework/action-creation/instructions.md:30`, `flows/framework/flow-creation/instructions.md:30`, `actions/plan/instructions.md:31`

Both `action-creation/` and `flow-creation/` spawn `plan/` at `Model: opus`. But `plan/instructions.md` says `Model: sonnet`. The flow overrides the action's default, which is a valid pattern, but there's no documented rule for when/why to override.

**Suggestion:** Add a note to ACTIONS.md under "Model Selection Guidelines": "Flows MAY override the default model when their specific context warrants deeper analysis. The flow's instructions.md is authoritative for model selection within that flow."

---

### Issue 8: update-queue Abstract Action is Orphaned

**Severity:** MEDIUM
**Files:** `ACTIONS.md:14`, `actions/_abstract/update-queue/instructions.md`

ACTIONS.md says update-queue is "Used By: code, review". But neither `code/agent.md` nor `review/agent.md` lists `_abstract/update-queue` in their Extends section. No agent references it. The abstract action exists but nothing triggers it.

**Suggestion:** Either (a) add `_abstract/update-queue` to the Extends section of code/ and review/ agent.md files, or (b) remove it from ACTIONS.md since it's unused. If queue tracking is planned for future use, note it as "Reserved" in ACTIONS.md.

---

### Issue 9: Gate Definitions Lack Standard Format

**Severity:** MEDIUM
**Files:** All flow instructions.md files

Gate conditions vary in format:
- `"Root cause identified with affected files list"` (analysis-style)
- `"Code changes implemented, type-check passes"` (implementation-style)
- `"Verdict APPROVED"` (binary verdict)
- `"Audit report delivered. CRITICAL/HIGH findings remediated."` (compound)

There's no defined failure protocol. What happens when a gate fails? The code-and-review flow handles it (loop back), but bug-triage and audit-and-fix don't specify failure behavior.

**Suggestion:** Define a standard gate format in ORCHESTRATOR.md:
```
Gate: {condition}
On fail: {stop-chain | loop-to-step-N | continue-with-flag}
```
Apply to all flow instructions.md files.

---

### Issue 10: Extends Format Differs Between instructions.md and agent.md

**Severity:** LOW
**Files:** All action instructions.md vs agent.md pairs

Instructions.md uses: "This agent is **explicitly instructed** to execute:" followed by a bullet list.
Agent.md uses: "This agent follows these abstract action standards:" followed by bullets, then a "When you need to:" section with file paths.

Since the agent.md is what agents actually read, the instructions.md phrasing is only seen by the orchestrator. But the inconsistency adds cognitive load when maintaining the framework.

**Suggestion:** Standardize on the agent.md format in both files. Or — since instructions.md is for the orchestrator and agent.md is for agents — explicitly state this convention in README.md so maintainers know the two formats are intentionally different.

---

### Issue 11: Checklist System is Scaffolded but Empty

**Severity:** LOW
**Files:** `checklists/INDEX.md`, `checklists/README.md`

The checklist system has categories (technical/, functional/), priority levels (p0-p3), and a naming convention — but zero actual checklists. The review/ agent accepts a `checklist` input that currently can never be provided. The audit/ agent doesn't reference checklists at all.

**Suggestion:** This is fine as scaffolding. Add a note to LEARNINGS.md: "Checklist system is ready but unpopulated. First checklists should be created after the first audit or review reveals recurring validation criteria." This signals intentional deferral rather than an oversight.

---

### Issue 12: Chains-With Semantics are Ambiguous

**Severity:** LOW
**Files:** All flow instructions.md "Chains With" sections

The arrow notation (`→` outputs to, `←` receives from) describes relationships but doesn't specify whether chaining is automatic or suggested. For example, `code-and-review/` says `→ post-completion/ (when review APPROVED)`. Does the orchestrator always chain post-completion after approval, or is it a recommendation?

**Suggestion:** Add a "Chaining Rule" to ORCHESTRATOR.md: "Chains-With entries marked with → are automatic — the orchestrator appends these to the chain without re-asking the human. Entries marked with ← are informational (this flow receives input from another)."

---

### Issue 13: Action Modes Table is Duplicated

**Severity:** LOW
**Files:** `ORCHESTRATOR.md:127-131`, `ACTIONS.md:39-49`

The action modes table (review/audit/analyze with default vs extended modes) appears in both files. ACTIONS.md has the fuller version with behavior descriptions. ORCHESTRATOR.md has a condensed version.

**Suggestion:** Remove the condensed table from ORCHESTRATOR.md and reference ACTIONS.md instead: "See Action Modes in ACTIONS.md." The orchestrator already reads ACTIONS.md during routing.

---

### Issue 14: Git Branch Convention Mismatch

**Severity:** LOW
**Files:** `project.config.md:121-124`, `commit/agent.md:71`

`project.config.md` says `Current branch: master` and `Branch format: feature/*, fix/*, refactor/*`. `commit/agent.md` also says `Current branch: master`. But the actual branch in use may differ per session. Hardcoding the current branch in framework files creates stale data.

**Suggestion:** Remove "Current branch" from project.config.md and commit/agent.md. The commit agent should run `git branch --show-current` to determine the branch dynamically. Keep "Main branch: main" and "Branch format" as those are conventions, not runtime state.

---

### Issue 15: ORCHESTRATOR.md Step Boundary Evaluation References 6 Triggers Without Definitions

**Severity:** LOW
**Files:** `ORCHESTRATOR.md:188-196`

The "Step Boundary Evaluation" section lists 6 triggers (Agent Output Signals, Pattern Recognition, Dependency Discovery, Quality Threshold, Chain Redesign Initiative, Reuse Opportunity) but doesn't define what each means or what constitutes a "trigger firing." An orchestrator following these instructions has to guess.

**Suggestion:** Add a one-line definition for each trigger:
1. **Agent Output Signals** — Agent reports errors, warnings, or blockers in its output
2. **Pattern Recognition** — The completed step reveals the same pattern as a previous execution
3. **Dependency Discovery** — Agent found new files/packages affected beyond the original scope
4. **Quality Threshold** — Agent's quality score or test pass rate falls below acceptable level
5. **Chain Redesign Initiative** — Remaining steps are no longer valid given what was learned
6. **Reuse Opportunity** — Agent output can be reused by a later step (skip redundant work)

---

## Priority Summary

| Priority | Count | Issues |
|----------|-------|--------|
| CRITICAL | 1 | #1 (wrong working directory) |
| HIGH | 2 | #2 (CLAUDE.md duplication), #4 (permissions vs quick triage) |
| MEDIUM | 4 | #3, #5, #6, #8, #9 |
| LOW | 7 | #7, #10, #11, #12, #13, #14, #15 |

---

## Recommendation

Fix Issues #1 and #4 immediately — one produces wrong paths, the other creates contradictory rules. Address #2 when next editing CLAUDE.md. The remaining issues are improvements that prevent drift as the framework scales.
