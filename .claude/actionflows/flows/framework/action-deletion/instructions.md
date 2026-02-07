# Action Deletion Flow

> Safely remove an action and update all references.

---

## When to Use

- An action is obsolete or replaced by another
- Framework health check identifies orphaned actions
- Human explicitly requests action removal

---

## Required Inputs From Human

| Input | Description | Example |
|-------|-------------|---------|
| action | Which action to delete | "cleanup/" |

---

## Action Sequence

### Step 1: Impact Analysis

**Action:** `.claude/actionflows/actions/analyze/`
**Model:** sonnet

**Spawn:**
```
Read your definition in .claude/actionflows/actions/analyze/agent.md

Input:
- aspect: impact
- scope: .claude/actionflows/
- context: Find all references to action {action} in flows, registries, and other actions
```

**Gate:** Impact report delivered with all references to the action identified.

---

### Step 2: Remove Action and Update References

**Action:** `.claude/actionflows/actions/code/`
**Model:** haiku

**Spawn after Step 1:**
```
Read your definition in .claude/actionflows/actions/code/agent.md

Input:
- task: Remove action {action} files + update ACTIONS.md + update all referencing flows from impact analysis
- context: .claude/actionflows/actions/{action}/, impact analysis from Step 1
```

**Gate:** Action files deleted, ACTIONS.md updated, all referencing flows updated.

---

### Step 3: Review Deletion

**Action:** `.claude/actionflows/actions/review/`
**Model:** sonnet

**Spawn after Step 2:**
```
Read your definition in .claude/actionflows/actions/review/agent.md

Input:
- scope: All changes from Step 2 (deleted files, updated registries, updated flows)
- type: code-review
```

**Gate:** No dangling references remain. ACTIONS.md accurate.

---

## Dependencies

```
Step 1 → Step 2 → Step 3
```

**Parallel groups:** None — fully sequential.

---

## Chains With

- → `post-completion/` (after deletion is verified)
