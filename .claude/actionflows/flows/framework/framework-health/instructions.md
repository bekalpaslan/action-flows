# Framework Health Flow

> Validate framework structure and catch drift.

---

## When to Use

- Periodic health check (recommended: after every 5-10 chain executions)
- After bulk framework changes
- When orchestrator suspects structural inconsistencies

---

## Required Inputs From Human

| Input | Description | Example |
|-------|-------------|---------|
| *(none)* | Autonomous — no inputs required | — |

---

## Action Sequence

### Step 1: Drift Analysis

**Action:** `.claude/actionflows/actions/analyze/`
**Model:** sonnet

**Spawn:**
```
Read your definition in .claude/actionflows/actions/analyze/agent.md

Input:
- aspect: drift
- scope: .claude/actionflows/
- context: Verify structure matches registries. Check: every action in ACTIONS.md has agent.md + instructions.md on disk; every flow in FLOWS.md has instructions.md on disk; no stale entries; no orphan directories; CONTEXTS.md contexts match flow directory structure.
```

**Gate:** Health report delivered with pass/fail for each check.

---

## Dependencies

```
Step 1
```

**Parallel groups:** None — single step.

---

## Chains With

- ← Any flow can trigger this as a follow-up
- → `action-creation/` or `action-deletion/` if drift is found
