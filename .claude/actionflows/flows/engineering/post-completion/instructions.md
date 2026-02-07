# Post-Completion Flow

> Standardized wrap-up after any work that modifies files: commit and update registry.

---

## When to Use

- After code-and-review/ flow completes with APPROVED verdict
- After bug-triage/ flow completes
- After any chain that produces file changes

---

## Required Inputs From Human

| Input | Description | Example |
|-------|-------------|---------|
| summary | What was accomplished | "Added session expiry with configurable timeout" |
| files | Changed files to commit | "packages/backend/src/routes/sessions.ts packages/backend/src/services/cleanup.ts" |

---

## Action Sequence

### Step 1: Commit Changes

**Action:** `.claude/actionflows/actions/commit/`
**Model:** haiku

**Spawn:**
```
Read your definition in .claude/actionflows/actions/commit/agent.md

Input:
- summary: {summary from input}
- files: {files from input}
- push: true
```

**Gate:** Commit created and pushed.

---

### Step 2: Update Execution Registry

This is handled by the orchestrator as a registry line edit — add entry to `logs/INDEX.md`.

---

## Dependencies

```
Step 1 → Step 2
```

**Parallel groups:** None — sequential.

---

## Chains With

- ← `code-and-review/` (always chains here after APPROVED)
- ← `bug-triage/` (always chains here after APPROVED)
- ← `audit-and-fix/` (always chains here after remediations reviewed)
