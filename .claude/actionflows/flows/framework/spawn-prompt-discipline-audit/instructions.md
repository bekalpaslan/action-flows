# Spawn Prompt Discipline Audit Flow

> Audit all flow instructions.md files for spawn prompt discipline violations and strip ad-hoc constraint patching.

---

## When to Use

- Suspicion that flows are duplicating constraints that belong in agent.md
- After template changes that might have propagated boilerplate
- Periodic framework hygiene sweep
- Human reports "this spawn prompt looks wrong"

---

## Required Inputs From Human

| Input | Description | Example |
|-------|-------------|---------|
| (none) | Flow is self-contained — audits all `flows/**/instructions.md` | — |

---

## Action Sequence

### Step 1: Audit

**Action:** `.claude/actionflows/actions/analyze/`
**Model:** opus
**Waits for:** None

**Spawn:**
```
Read your definition in .claude/actionflows/actions/analyze/agent.md

Input:
- task: Audit spawn prompt discipline across all flow instructions.md files
- scope: .claude/actionflows/flows/**/instructions.md
- rule: Spawn prompts must provide ONLY (1) agent.md read instruction, (2) project config injection (optional), (3) task-specific inputs. Two classes of violation apply:
    - Over-provisioning: subagent identity warnings ("you are a spawned subagent executor"), "do not delegate", "do not read ORCHESTRATOR.md", restated format rules, restated agent.md constraints. If a subagent needs that info, it belongs in agent.md.
    - Under-provisioning (Rule 7 — Complete Spawn Prompt Structure): a spawn block MUST contain (a) the "Read your definition in .claude/actionflows/actions/{action}/agent.md" read directive AND (b) an Input: block with task-specific inputs. Missing either element is a violation. A spawn block that contains only free-form prose (no read directive, no structured Input: block) is under-provisioned regardless of its content.
- output: Per-file list of {path, line range, violating text, violation type, suggested fix (strip | migrate-to-agent.md | migrate-to-template)} plus cross-flow patterns. Report both over-provisioning and under-provisioning violations.
```

**Gate:** Structured audit report with files, line ranges, and fix classification.

---

### Step 2: HUMAN GATE

Present the audit report for approval. Human reviews violations and confirms fix approach (strip vs. migrate-to-agent.md per finding).

---

### Step 3: Apply Fixes

**Action:** `.claude/actionflows/actions/code/`
**Model:** sonnet
**Waits for:** Step 2

**Spawn:**
```
Read your definition in .claude/actionflows/actions/code/agent.md

Input:
- task: Apply approved fixes from audit report — strip violating blocks and/or migrate constraints into agent.md
- scope: Files listed in audit report
- rule: Do not modify unrelated content. No refactoring, no "while I'm here" edits.
```

**Gate:** All approved fixes applied. Report files edited, occurrences removed, any anomalies.

---

### Step 4: Verify

**Action:** `.claude/actionflows/actions/review/`
**Model:** sonnet
**Waits for:** Step 3

**Spawn:**
```
Read your definition in .claude/actionflows/actions/review/agent.md

Input:
- scope: Files edited in Step 3 + grep across flows/**/instructions.md for residual violations
- type: post-fix-verification
- checks: (1) zero residual violations, (2) structure preserved (agent.md read + config + inputs still intact), (3) only target files modified
```

**Gate:** PASS with evidence, or FAIL with residual issues listed.

---

### Step 5: Commit

**Action:** `.claude/actionflows/actions/commit/`
**Model:** haiku
**Waits for:** Step 3 (not Step 4 — commit is for original work)

---

## Dependencies

```
Step 1 → Step 2 (HUMAN GATE) → Step 3 → Step 4
                                    ↓
                                 Step 5 (parallel with Step 4)
```

**Parallel groups:** Steps 4 and 5 run in parallel after Step 3.

---

## Chains With

- ← Triggered by hygiene sweeps, template changes, or human reports
- → `framework-health/` (if residual structural issues surface)

---

## Notes

- **Root-cause check:** If violations are uniform and widespread, inspect `templates/TEMPLATE.instructions.md` — a bad template propagates the anti-pattern to every new flow.
- **Lint hook candidate (over-provisioning):** Grep for `You are a spawned subagent executor` in `flows/**/instructions.md` as a pre-commit or framework-health check.
- **Lint hook candidate (under-provisioning / Rule 7):** Grep for files that contain a `**Spawn` marker but do NOT contain `Read your definition in`. These are under-provisioned spawn blocks. See `framework-health/instructions.md` for the active lint check.
- **Rule 7 — Complete Spawn Prompt Structure:** A spawn block MUST contain (a) the agent.md read directive and (b) a structured `Input:` block. Missing either = under-provisioning violation. Under-provisioned spawns are arguably worse than over-provisioned ones: the subagent never learns its mission, output contract, or learnings format.
  - **ORDERING CONSTRAINT:** The `Read your definition in .claude/actionflows/actions/{action}/agent.md` directive must be the first non-empty line of the spawn block (i.e., the first line inside the triple-backtick fence or after the `**Spawn` marker, excluding blank lines and inline comments).
  - **INPUT BLOCK DEFINITION:** A valid `Input:` block is a key-value structure labeled `Input:` containing at least one task-specific key such as `task`, `scope`, `type`, or `aspect`. Prose-only task descriptions do not satisfy this requirement; a future analyze agent should flag them as under-provisioning.
