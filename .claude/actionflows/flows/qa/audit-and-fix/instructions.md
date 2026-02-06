# Audit and Fix Flow

> Comprehensive audit with automated remediation and review.

---

## When to Use

- Periodic security sweeps
- Pre-release quality gates
- Architecture compliance checks
- Dependency vulnerability scanning
- "Run a security audit", "Check architecture"

---

## Required Inputs From Human

| Input | Description | Example |
|-------|-------------|---------|
| type | Audit type: security, architecture, performance, dependency | "security" |
| scope | What to audit | "packages/backend/src/" or "all" |
| mode | (optional) audit-only or audit-and-remediate | "audit-and-remediate" |

---

## Action Sequence

### Step 1: Audit

**Action:** `.claude/actionflows/actions/audit/`
**Model:** opus

**Spawn:**
```
Read your definition in .claude/actionflows/actions/audit/agent.md

Project Context:
- Name: ActionFlows Dashboard
- Backend: Express + WebSocket + Redis (packages/backend/)
- Frontend: React + Vite + Electron (packages/app/)

Input:
- type: {from human}
- scope: {from human}
- mode: {from human, default: audit-and-remediate}
```

**Gate:** Audit report delivered with severity categorization.

---

### Step 2: Review Remediations

**Spawn after Step 1 completes (only if mode was audit-and-remediate):**

**Action:** `.claude/actionflows/actions/review/`
**Model:** sonnet

```
Read your definition in .claude/actionflows/actions/review/agent.md

Project Context:
- Name: ActionFlows Dashboard

Input:
- scope: {files remediated in Step 1}
- type: code-review
- mode: review-only
```

**Gate:** Remediations reviewed and approved.

---

### Step 3: Post-Completion

**Chains with:** `engineering/post-completion/` (only if remediations were made)

---

## Dependencies

```
Step 1 → Step 2 → Step 3
```

**Parallel groups:** None — sequential.

---

## Chains With

- → `engineering/post-completion/` (if files were modified)
- Standalone if `audit-only` mode (no post-completion needed)
