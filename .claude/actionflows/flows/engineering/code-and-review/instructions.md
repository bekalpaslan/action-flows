# Code and Review Flow

> Implement code changes with automated review and post-completion.

---

## When to Use

- Bug fixes requiring code changes
- Feature implementation
- Refactoring work
- Any code change that should be reviewed before committing

---

## Required Inputs From Human

| Input | Description | Example |
|-------|-------------|---------|
| task | What to implement | "Add conversation panel component for Phase 6" |
| context | Relevant files and modules | "packages/app/src/components/SessionPane/" |
| component | (optional) backend, frontend, or both | "frontend" |

---

## Action Sequence

### Step 1: Implement

**Action:** `.claude/actionflows/actions/code/` (or `code/backend/` or `code/frontend/` based on component)
**Model:** haiku

**Spawn:**
```
Read your definition in .claude/actionflows/actions/code/agent.md

Project Context:
- Name: ActionFlows Dashboard
- Backend: Express + WebSocket + Redis (packages/backend/)
- Frontend: React + Vite + Electron (packages/app/)
- Shared: TypeScript types (packages/shared/)
- Ports: Backend 3001, Vite 5173

Input:
- task: {from human}
- context: {from human}
- component: {from human or inferred}
```

**Gate:** Code changes implemented, type-check passes.

---

### Step 2: Review

**Spawn after Step 1 completes:**

**Action:** `.claude/actionflows/actions/review/`
**Model:** sonnet

```
Read your definition in .claude/actionflows/actions/review/agent.md

Project Context:
- Name: ActionFlows Dashboard
- Backend: Express + WebSocket + Redis (packages/backend/)
- Frontend: React + Vite + Electron (packages/app/)

Input:
- scope: {changed files from Step 1 output}
- type: code-review
- mode: review-and-fix
```

**Gate:** Verdict APPROVED or NEEDS_CHANGES.

---

### Step 3: Handle Verdict

- **APPROVED** → Proceed to Step 4 (post-completion)
- **NEEDS_CHANGES** → Loop: Spawn code/ again with review feedback, then review/ again

---

### Step 4: Post-Completion

**Chains with:** `engineering/post-completion/`

Spawn after review APPROVED:
- commit/ with summary and changed files
- status-update/ with accomplishment summary

---

## Dependencies

```
Step 1 → Step 2 → Step 3 (verdict) → Step 4
                  ↑                ↓ (if NEEDS_CHANGES)
                  └────────────────┘
```

**Parallel groups:** Steps 4a (commit) and 4b (status-update) run in parallel.

---

## Chains With

- → `engineering/post-completion/` (on APPROVED verdict)
- ← Can be triggered by `engineering/bug-triage/` after analysis
