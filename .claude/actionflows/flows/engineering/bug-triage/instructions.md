# Bug Triage Flow

> Analyze, fix, test, and review bug fixes.

---

## When to Use

- Complex bugs requiring investigation
- Bugs spanning multiple packages
- Issues with unclear root cause
- "Fix this bug", "Investigate this issue"

---

## Required Inputs From Human

| Input | Description | Example |
|-------|-------------|---------|
| bug | Bug description or symptoms | "WebSocket disconnects don't trigger reconnection" |
| context | Where the bug manifests | "packages/app/src/hooks/useWebSocket.ts, browser console shows connection closed" |

---

## Action Sequence

### Step 1: Analyze

**Action:** `.claude/actionflows/actions/analyze/`
**Model:** sonnet

**Spawn:**
```
Read your definition in .claude/actionflows/actions/analyze/agent.md

Project Context:
- Name: ActionFlows Dashboard
- Backend: Express + WebSocket + Redis (packages/backend/)
- Frontend: React + Vite + Electron (packages/app/)

Input:
- aspect: impact
- scope: {context from human}
- context: Bug: {bug description}. Trace root cause and identify all affected files.
```

**Gate:** Root cause identified, affected files listed.

---

### Step 2: Fix

**Spawn after Step 1 completes:**

**Action:** `.claude/actionflows/actions/code/` (or stack variant based on analysis)
**Model:** haiku

```
Read your definition in .claude/actionflows/actions/code/agent.md

Project Context:
- Name: ActionFlows Dashboard
- Backend: Express + WebSocket + Redis (packages/backend/)
- Frontend: React + Vite + Electron (packages/app/)

Input:
- task: Fix bug: {bug description}. Root cause: {from Step 1}
- context: {affected files from Step 1}
```

**Gate:** Bug fix implemented, type-check passes.

---

### Step 3: Test

**Spawn after Step 2 completes:**

**Action:** `.claude/actionflows/actions/test/`
**Model:** haiku

```
Read your definition in .claude/actionflows/actions/test/agent.md

Project Context:
- Name: ActionFlows Dashboard
- Test framework: Vitest + Supertest

Input:
- scope: {relevant test files or "all"}
- type: integration
- context: Bug fix for: {bug description}
```

**Gate:** Tests pass (or failures documented).

---

### Step 4: Review

**Spawn after Step 3 completes:**

**Action:** `.claude/actionflows/actions/review/`
**Model:** sonnet

```
Read your definition in .claude/actionflows/actions/review/agent.md

Project Context:
- Name: ActionFlows Dashboard

Input:
- scope: {changed files from Step 2}
- type: code-review
- mode: review-and-fix
```

**Gate:** Review APPROVED.

---

### Step 5: Post-Completion

**Chains with:** `engineering/post-completion/`

---

## Dependencies

```
Step 1 → Step 2 → Step 3 → Step 4 → Step 5
```

**Parallel groups:** None — fully sequential (each step depends on previous).

---

## Chains With

- → `engineering/post-completion/` (on APPROVED verdict)
- → `engineering/code-and-review/` (can trigger if fix needs additional implementation)
