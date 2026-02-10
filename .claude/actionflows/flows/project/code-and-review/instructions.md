# Code and Review Flow

> Implement code changes and review them for quality.

---

## When to Use

- Feature implementation requests
- Bug fixes requiring code changes
- Refactoring tasks
- Any code modification that needs quality review

---

## Required Inputs From Human

| Input | Description | Example |
|-------|-------------|---------|
| task | What to implement | "Add session expiry with configurable timeout" |
| context | Relevant files/areas | "packages/backend/src/routes/sessions.ts, packages/backend/src/services/cleanup.ts" |
| component | Target area (optional) | "backend" or "frontend" or omit for auto-detect |

---

## Action Sequence

### Step 1: Implement Code

**Action:** `.claude/actionflows/actions/code/` (or `code/backend/` or `code/frontend/` based on component)
**Model:** haiku

**Spawn:**
```
Read your definition in .claude/actionflows/actions/code/agent.md

Input:
- task: {task from human}
- context: {context from human}
- component: {component if specified}
```

**Gate:** Code changes implemented, type-check passes.

---

### Step 2: Review Changes

**Action:** `.claude/actionflows/actions/review/`
**Model:** sonnet

**Spawn after Step 1:**
```
Read your definition in .claude/actionflows/actions/review/agent.md

Input:
- scope: {changed files from Step 1}
- type: code-review
```

**Gate:** Verdict delivered.

---

### Step 3: Handle Verdict

- **APPROVED** → Proceed to post-completion
- **NEEDS_CHANGES** → Back to Step 1 with review feedback as additional context

---

## Dependencies

```
Step 1 → Step 2 → Step 3 (verdict gate)
  ↑_________________________↓ (if NEEDS_CHANGES)
```

**Parallel groups:** None — sequential with possible loop.

---

## Chains With

- → `post-completion/` (when review APPROVED)
- ← Any request for code changes routes here
