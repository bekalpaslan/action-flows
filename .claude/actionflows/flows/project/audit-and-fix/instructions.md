# Audit and Fix Flow

> Run a comprehensive audit with optional remediation.

---

## When to Use

- Periodic security/quality sweeps
- Before major releases
- After significant architecture changes
- Quick project health checks (`/fact-check`)
- When human requests "audit", "security scan", or "health check"

---

## Required Inputs From Human

| Input | Description | Example |
|-------|-------------|---------|
| type | Audit type(s) | "security", "deps", "tests", "docs", "build", "git", "bundle", "all" |
| scope | What to audit | "packages/backend/src/" or "all" |
| mode | Report or fix | "report-only" (default) or "remediate" |
| focus | Narrow focus (optional) | "WebSocket handlers" |

---

## Modes

### report-only (default)
- Runs all checks in parallel (fast)
- Outputs findings to plan agent
- No changes made to codebase
- Triggered by `/fact-check`

### remediate
- Runs checks sequentially
- Fixes CRITICAL/HIGH issues immediately
- Documents MEDIUM/LOW for later
- Reviews all remediations before commit

---

## Action Sequence

### Mode: report-only

#### Steps 1-6: Parallel Checks (Group A)

All run with **Model:** haiku (except docs: sonnet)

| Step | Type | Check |
|------|------|-------|
| 1 | deps | `pnpm outdated`, `pnpm audit`, unused deps |
| 2 | tests | `pnpm test`, coverage thresholds |
| 3 | docs | API routes vs docs, types vs docs, README commands |
| 4 | build | `pnpm type-check`, `pnpm lint` |
| 5 | git | Uncommitted changes, branch status, ahead/behind |
| 6 | bundle | Frontend bundle sizes vs thresholds |

**Spawn (each check):**
```
Run {type} check for project health.

Output as structured JSON:
{
  "status": "pass" | "warn" | "fail",
  "issues": [...],
  "summary": "..."
}
```

**Gate:** All checks complete.

---

#### Step 7: Compile Report

**Action:** `plan/`
**Model:** sonnet
**Waits for:** Steps 1-6

**Spawn:**
```
Compile audit findings into prioritized action plan:

Findings:
- Dependencies: {Step 1}
- Tests: {Step 2}
- Documentation: {Step 3}
- Build: {Step 4}
- Git: {Step 5}
- Bundle: {Step 6}

Prioritize:
1. CRITICAL — Security vulnerabilities, failing tests, build errors
2. HIGH — Outdated major versions, doc mismatches
3. MEDIUM — Outdated minor versions, lint warnings
4. LOW — Style, minor cleanup

Output executable chain for orchestrator.
```

**Gate:** Action plan generated.

---

### Mode: remediate

#### Step 1: Audit with Remediation

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

#### Step 2: Review Remediations

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

### report-only
```
[Step 1: deps]   ──┐
[Step 2: tests]  ──┤
[Step 3: docs]   ──┼──→ [Step 7: Compile]
[Step 4: build]  ──┤
[Step 5: git]    ──┤
[Step 6: bundle] ──┘
```

### remediate
```
Step 1 (audit) → Step 2 (review)
```

---

## Chains With

- → `code-and-review/` (to fix issues from report)
- → `post-completion/` (after remediations reviewed)
- ← `/fact-check` routes here with mode=report-only
- ← `/audit` routes here with mode=remediate

---

## Example Output (report-only)

```
## Project Health Report

### Summary
| Category | Status | Issues |
|----------|--------|--------|
| Dependencies | ⚠️ | 3 outdated, 1 vulnerability |
| Tests | ✅ | 47/47 passing, 82% coverage |
| Documentation | ⚠️ | 2 API mismatches |
| Build | ✅ | Clean |
| Git | ✅ | Clean, up to date |
| Bundle | ⚠️ | Main bundle 523KB (threshold: 500KB) |

### Recommended Action Chain
1. [CRITICAL] Fix lodash vulnerability (CVE-2024-xxxx)
2. [HIGH] Update @types/node 18.x → 22.x
3. [MEDIUM] Fix API route mismatch in docs/API.md
4. [LOW] Reduce bundle size by 23KB

Execute chain? (y/n)
```
