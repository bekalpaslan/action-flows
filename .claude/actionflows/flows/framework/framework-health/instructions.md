# Framework Health Flow

> Validate framework structure and catch drift.

---

## When to Use

- Periodic health check
- After major framework changes
- When something seems wrong with routing or action execution
- "Check framework health"

---

## Required Inputs From Human

| Input | Description | Example |
|-------|-------------|---------|
| *(none)* | Autonomous — no inputs required | — |

---

## Action Sequence

### Step 1: Framework Analysis

**Action:** `.claude/actionflows/actions/analyze/`
**Model:** sonnet

**Spawn:**
```
Read your definition in .claude/actionflows/actions/analyze/agent.md

Project Context:
- Name: ActionFlows Dashboard

Input:
- aspect: drift
- scope: .claude/actionflows/
- context: Verify framework structure matches registries. Check: (1) Every action in ACTIONS.md has agent.md + instructions.md on disk, (2) Every flow in FLOWS.md has instructions.md on disk, (3) No stale registry entries, (4) No orphan directories, (5) ORGANIZATION.md departments match flow directory structure
```

**Gate:** Health report delivered with pass/fail for each check.

---

## Dependencies

```
Step 1 (single step)
```

**Parallel groups:** None — single step.

---

## Chains With

- Standalone flow — does not chain with post-completion (read-only)
