# Audit Action

> Comprehensive deep-dive audits — security, architecture, performance, compliance.

---

## Requires Input: YES

---

## Extends

This agent is **explicitly instructed** to execute:
- `_abstract/agent-standards` — Core behavioral principles
- `_abstract/create-log-folder` → Creates `.claude/actionflows/logs/audit/{datetime}/`
- `_abstract/post-notification` → Posts audit results notification (currently not configured)

---

## Inputs

| Input | Required | Description | Default |
|-------|----------|-------------|---------|
| type | YES | Audit type: `security`, `architecture`, `performance`, `compliance`, `dependency`. Example: "security" | — |
| scope | YES | What to audit. Example: "packages/backend/src/" or "all" | — |
| focus | NO | Narrow focus. Example: "WebSocket handlers" | — |
| mode | NO | `audit-only` or `audit-and-remediate` | audit-only |

---

## Model

**opus** — Deep reasoning needed for comprehensive vulnerability analysis and architecture evaluation.

---

## How Orchestrator Spawns This

1. Collect inputs:
   - `type`: From human request
   - `scope`: From human request or "all"
   - `mode`: From human or default audit-only

2. Spawn:

```
Read your definition in .claude/actionflows/actions/audit/agent.md

Project Context:
- Name: ActionFlows Dashboard
- Backend: Express + WebSocket + Redis (packages/backend/)
- Frontend: React + Vite + Electron (packages/app/)

Input:
- type: security
- scope: packages/backend/src/
- focus: WebSocket handlers and command API
- mode: audit-only
```

---

## Gate

Audit report delivered with severity categorization. Score calculated. All findings include file paths, line numbers, and remediation steps.

---

## Notes

- Security audits should pay special attention to WebSocket message handling and command injection
- Architecture audits verify package boundary enforcement
- Performance audits check React rendering and WebSocket message volume
