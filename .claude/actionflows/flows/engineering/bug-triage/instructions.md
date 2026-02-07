# Bug Triage Flow

> Analyze, fix, test, and review bug fixes with structured triage.

---

## When to Use

- Bug reports requiring investigation
- Errors that span multiple packages
- Complex bugs needing root cause analysis before fixing

---

## Required Inputs From Human

| Input | Description | Example |
|-------|-------------|---------|
| bug | Bug description or error message | "WebSocket disconnects after 30s idle, no reconnection" |
| context | Where the bug manifests | "packages/app/src/hooks/useWebSocket.ts, packages/backend/src/ws/handler.ts" |

---

## Action Sequence

### Step 1: Analyze Root Cause

**Action:** `.claude/actionflows/actions/analyze/`
**Model:** sonnet

**Spawn:**
```
Read your definition in .claude/actionflows/actions/analyze/agent.md

Input:
- aspect: impact
- scope: {context from human}
- context: Bug: {bug description}. Investigate root cause and identify all affected files.
```

**Gate:** Root cause identified with affected files list.

---

### Step 2: Implement Fix

**Action:** `.claude/actionflows/actions/code/`
**Model:** haiku

**Spawn after Step 1:**
```
Read your definition in .claude/actionflows/actions/code/agent.md

Input:
- task: Fix bug: {bug description}. Root cause: {from Step 1 analysis}
- context: {affected files from Step 1}
```

**Gate:** Bug fix implemented, type-check passes.

---

### Step 3: Run Tests

**Action:** `.claude/actionflows/actions/test/`
**Model:** haiku

**Spawn after Step 2:**
```
Read your definition in .claude/actionflows/actions/test/agent.md

Input:
- scope: {test files related to affected areas}
- type: integration
- context: Bug fix for {bug description}. Changed files: {from Step 2}
```

**Gate:** Tests executed, results reported.

---

### Step 4: Review Fix

**Action:** `.claude/actionflows/actions/review/`
**Model:** sonnet

**Spawn after Step 3:**
```
Read your definition in .claude/actionflows/actions/review/agent.md

Input:
- scope: {changed files from Step 2}
- type: code-review
```

**Gate:** Verdict APPROVED.

---

## Dependencies

```
Step 1 → Step 2 → Step 3 → Step 4
```

**Parallel groups:** None — sequential (each step depends on previous).

---

## Chains With

- → `post-completion/` (when review APPROVED)
- ← Bug fix requests route here
