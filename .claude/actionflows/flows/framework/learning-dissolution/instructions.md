# Learning Dissolution Flow

> Process accumulated learnings into actionable changes: doc updates, agent patches, template fixes, or close as documented.

---

## When to Use

- LEARNINGS.md has accumulated open entries (3+ unprocessed)
- After a major chain completes with multiple learnings surfaced
- Human requests "dissolve learnings", "process learnings", "learning retrospective"
- Periodic hygiene (weekly/biweekly)

---

## Required Inputs From Human

| Input | Description | Example |
|-------|-------------|---------|
| scope | Which learnings to process | "all open", "L009-L011", or omit for all open |

---

## Action Sequence

### Step 1: Analyze Learnings

**Action:** `.claude/actionflows/actions/analyze/`
**Model:** sonnet

**Spawn:**
```
Read your definition in .claude/actionflows/actions/analyze/agent.md

Input:
- aspect: learning-dissolution
- scope: .claude/actionflows/LEARNINGS.md (all entries with Status: Open, or specified range)
- also read: .claude/actionflows/agents/*.agent.md, .claude/actionflows/docs/, TEMPLATE.contract.md, .gitattributes

Categorize each open learning into one of:
1. DOC_UPDATE — Needs a docs/ file updated or created
2. AGENT_PATCH — Needs an agent.md modified (new rule, guard, or pattern)
3. TEMPLATE_FIX — Needs a template file updated (contract template, flow template, etc.)
4. CONFIG_FIX — Needs a config or tooling file updated (.gitattributes, vitest config, etc.)
5. CLOSE_AS_DOCUMENTED — Already captured in MEMORY.md or docs, just close the entry
6. REQUIRES_CODE — Needs actual code changes (escalate to a separate chain)

Output: Categorized manifest with target files for each learning.
```

**Gate:** Manifest delivered.

---

### Step 2: Dissolution Plan

**Action:** `.claude/actionflows/actions/plan/`
**Model:** sonnet

**Spawn after Step 1:**
```
Read your definition in .claude/actionflows/actions/plan/agent.md

Input:
- requirements: For each categorized learning from Step 1, produce specific edit instructions
- context: Analysis manifest from Step 1, current content of target files

For each learning, specify:
- Target file(s) to modify
- Exact section to add/update
- Content to write (or "close" if CLOSE_AS_DOCUMENTED)
- Whether it can be batched with other learnings targeting the same file
```

**Output:** Edit plan grouped by target file, with parallel batches identified.

**Gate:** Plan delivered.

---

### Step 3: HUMAN GATE

Present dissolution plan. Human reviews:
- **Accept:** Proceed to Step 4
- **Modify:** Adjust plan, loop back
- **Reject:** Flow ends

---

### Step 4: Execute Dissolution (parallel batches)

**Action:** `.claude/actionflows/actions/code/`
**Model:** haiku (one agent per batch)

**Spawn after Human approves Step 3:**
```
Read your definition in .claude/actionflows/actions/code/agent.md

Input:
- task: Apply learning dissolution edits per approved plan
- files: {batch-specific target files}
- edits: {specific edits from plan}
```

**Parallel batches** grouped by target file type:
- Batch A: Agent patches (agent.md files)
- Batch B: Doc updates (docs/ files)
- Batch C: Template/config fixes

**Output:** Files updated per plan.

**Gate:** All batches complete.

---

### Step 5: Review Changes

**Action:** `.claude/actionflows/actions/review/`
**Model:** sonnet

**Spawn after Step 4:**
```
Read your definition in .claude/actionflows/actions/review/agent.md

Input:
- scope: All files modified in Step 4
- context: Dissolution plan from Step 2
- verify: Each learning's target was correctly applied
```

**Output:** Review report.

**Gate:** Review approved.

---

### Step 6: Close Learnings + Commit

**Orchestrator direct action (registry edits):**
- Update each processed learning in LEARNINGS.md: `Status: Open` → `Status: Closed (dissolved)`
- Update MEMORY.md count

**Action:** `.claude/actionflows/actions/commit/`
**Model:** haiku

**Spawn:**
```
Read your definition in .claude/actionflows/actions/commit/agent.md

Input:
- summary: chore: dissolve learnings L{start}-L{end} into docs, agents, and templates
- files: All modified files + LEARNINGS.md
```

**Gate:** Commit successful.

---

## Dependencies

```
Step 1 → Step 2 → Step 3 (HUMAN GATE) → Step 4 (parallel) → Step 5 → Step 6
```

**Parallel groups:** Step 4 batches run in parallel (grouped by target file type).

---

## Chains With

- <- Triggered after chains that surface 3+ learnings
- <- Triggered on periodic hygiene schedule
- -> `post-completion/` (after Step 6)

---

## Examples

**Full Dissolution:**
```
Human: "dissolve learnings"
Orchestrator: [Routes to learning-dissolution/]
Step 1: Finds L009 (CRLF), L010 (manifest), L011 (batch collision) are open
Step 2: Plans — L009 already has .gitattributes fix (CLOSE), L010 needs manifest validation doc (DOC_UPDATE), L011 needs batch-dispatch rule in orchestrator docs (AGENT_PATCH)
Step 3: Human approves
Step 4: Two parallel agents update docs and agent.md
Step 5: Review confirms
Step 6: L009-L011 marked Closed, committed
```

**Scoped Dissolution:**
```
Human: "process learnings L001-L003"
Orchestrator: [Routes to learning-dissolution/, scope=L001-L003]
Output: Only those 3 entries processed
```
