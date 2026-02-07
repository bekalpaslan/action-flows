# Audit Action

> Comprehensive deep-dive audits — security, architecture, performance, dependencies.

---

## Requires Input: YES

---

## Extends

This agent is **explicitly instructed** to execute:
- `_abstract/agent-standards` — Core behavioral principles
- `_abstract/create-log-folder` → Creates `.claude/actionflows/logs/audit/{datetime}/`
---

## Inputs

| Input | Required | Description | Default |
|-------|----------|-------------|---------|
| type | YES | `security`, `architecture`, `performance`, `dependency` | — |
| scope | YES | What to audit — e.g., "packages/backend/src/" or "all" | — |
| focus | NO | Narrow focus — e.g., "WebSocket handlers" | none |
| mode | NO | `audit-only` or `audit-and-remediate` | audit-only |

---

## Model

**opus** — Deep analysis needed for comprehensive security/architecture audits.

---

## How Orchestrator Spawns This

1. Collect inputs:
   - `type`: From human request
   - `scope`: From human request
   - `mode`: From human request (default audit-only)

2. Spawn:

```
Read your definition in .claude/actionflows/actions/audit/agent.md

Input:
- type: security
- scope: packages/backend/src/
- focus: WebSocket handlers and API routes
- mode: audit-and-remediate
```

---

## Gate

Audit report delivered with severity categorization. All findings include file paths, line numbers, and remediation steps.

---

## Notes

- When `mode: audit-and-remediate`, only CRITICAL and HIGH findings are fixed directly. MEDIUM/LOW remain as recommendations.
- Security audits check: injection, XSS, WebSocket spoofing, Electron IPC, secret exposure, CORS, rate limiting
- Comprehensive scan — no sampling. Every file in scope is checked.
