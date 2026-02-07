# Audit and Fix Flow

> Run a comprehensive audit and remediate findings.

---

## When to Use

- Periodic security/quality sweeps
- Before major releases
- After significant architecture changes
- When human requests "audit" or "security scan"

---

## Required Inputs From Human

| Input | Description | Example |
|-------|-------------|---------|
| type | Audit type | "security", "architecture", "performance", "dependency" |
| scope | What to audit | "packages/backend/src/" or "all" |
| focus | Narrow focus (optional) | "WebSocket handlers" |

---

## Action Sequence

### Step 1: Audit with Remediation

**Action:** `.claude/actionflows/actions/audit/`
**Model:** opus

**Spawn:**
```
Read your definition in .claude/actionflows/actions/audit/agent.md

Input:
- type: {type from human}
- scope: {scope from human}
- focus: {focus if provided}
- mode: audit-and-remediate
```

**Gate:** Audit report delivered. CRITICAL/HIGH findings remediated. MEDIUM/LOW documented.

---

### Step 2: Review Remediations

**Action:** `.claude/actionflows/actions/review/`
**Model:** sonnet

**Spawn after Step 1:**
```
Read your definition in .claude/actionflows/actions/review/agent.md

Input:
- scope: {remediated files from Step 1}
- type: code-review
```

**Gate:** Remediations reviewed and APPROVED.

---

## Dependencies

```
Step 1 → Step 2
```

**Parallel groups:** None — sequential.

---

## Chains With

- → `post-completion/` (after remediations are reviewed and approved)
- ← Security/quality audit requests route here
