# Action Deletion Flow

> Safely remove an action and update all references.

---

## When to Use

- An action is no longer needed
- An action is being replaced by a better alternative
- Framework cleanup

---

## Required Inputs From Human

| Input | Description | Example |
|-------|-------------|---------|
| action | The action to delete | "cleanup/" |
| reason | Why it's being removed | "No longer needed — log management handled differently" |

---

## Action Sequence

### Step 1: Impact Analysis

**Action:** `.claude/actionflows/actions/analyze/`
**Model:** sonnet

**Spawn:**
```
Read your definition in .claude/actionflows/actions/analyze/agent.md

Project Context:
- Name: ActionFlows Dashboard

Input:
- aspect: impact
- scope: .claude/actionflows/
- context: Find all references to {action} in flows, registries, and other action files
```

**Gate:** Impact report listing all files that reference the action.

---

### Step 2: Remove Action

**Spawn after Step 1 completes:**
```
Read your definition in .claude/actionflows/actions/code/agent.md

Project Context:
- Name: ActionFlows Dashboard

Input:
- task: Remove action files at .claude/actionflows/actions/{action}/, update ACTIONS.md to remove the entry, update all referencing flows from Step 1's impact report
- context: Impact analysis from Step 1 listing all references
```

**Gate:** Action files deleted, ACTIONS.md updated, referencing flows updated.

---

### Step 3: Review Deletion

**Spawn after Step 2 completes:**
```
Read your definition in .claude/actionflows/actions/review/agent.md

Project Context:
- Name: ActionFlows Dashboard

Input:
- scope: All files changed during deletion (ACTIONS.md, affected flow instructions.md files)
- type: code-review
```

**Gate:** No dangling references, registries consistent.

---

## Dependencies

```
Step 1 → Step 2 → Step 3
```

**Parallel groups:** None — fully sequential.

---

## Chains With

- → `engineering/post-completion/` (after deletion is complete)
