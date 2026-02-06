# Post-Completion Flow

> Standardized wrap-up after implementation work: commit + status update.

---

## When to Use

- After `engineering/code-and-review/` produces APPROVED changes
- After `qa/audit-and-fix/` remediations are reviewed
- After any flow that modifies project files and needs committing

---

## Required Inputs From Human

| Input | Description | Example |
|-------|-------------|---------|
| summary | What was accomplished | "Phase 6 conversation panel implemented and reviewed" |
| files | Changed files to commit | "packages/app/src/components/ConversationPanel/*.tsx" |

---

## Action Sequence

### Step 1: Commit

**Action:** `.claude/actionflows/actions/commit/`
**Model:** haiku

**Spawn:**
```
Read your definition in .claude/actionflows/actions/commit/agent.md

Project Context:
- Name: ActionFlows Dashboard
- Working directory: D:/ActionFlowsDashboard

Input:
- summary: {from flow input}
- files: {from flow input}
- push: true
```

**Gate:** Commit created and pushed. Hash reported.

---

### Step 2: Status Update (parallel with nothing — runs after Step 1)

**Action:** `.claude/actionflows/actions/status-update/`
**Model:** haiku

**Spawn after Step 1:**
```
Read your definition in .claude/actionflows/actions/status-update/agent.md

Project Context:
- Name: ActionFlows Dashboard
- Status files: PHASE_5_COMPLETE.md, docs/

Input:
- what: {summary from flow input}
```

**Gate:** Status files updated.

---

## Dependencies

```
Step 1 → Step 2
```

**Parallel groups:** Step 2 depends on Step 1 (needs commit hash for status update).

---

## Chains With

- ← `engineering/code-and-review/` (primary trigger)
- ← `qa/audit-and-fix/` (after audit remediations)
- ← `engineering/bug-triage/` (after bug fix)
