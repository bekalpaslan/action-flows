# Plan Action

> Create detailed implementation plans before coding begins.

---

## Requires Input: YES

---

## Extends

This agent is **explicitly instructed** to execute:
- `_abstract/agent-standards` — Core behavioral principles
- `_abstract/create-log-folder` → Creates `.claude/actionflows/logs/plan/{datetime}/`
---

## Inputs

| Input | Required | Description | Default |
|-------|----------|-------------|---------|
| requirements | YES | What needs to be planned — e.g., "Add real-time chain status updates via WebSocket" | — |
| context | YES | Constraints, related areas — e.g., "packages/shared/src/events.ts, packages/backend/src/ws/" | — |
| depth | NO | `high-level` or `detailed` | detailed |

---

## Model

**sonnet** — Good reasoning for architectural planning and risk assessment.

---

## How Orchestrator Spawns This

1. Collect inputs:
   - `requirements`: From human request
   - `context`: From human request or routing knowledge

2. Spawn:

```
Read your definition in .claude/actionflows/actions/plan/agent.md

Input:
- requirements: Add real-time chain status updates via WebSocket
- context: packages/shared/src/events.ts, packages/backend/src/ws/handler.ts, packages/app/src/hooks/useWebSocket.ts
- depth: detailed
```

---

## Gate

Plan delivered with actionable, ordered steps. Each step has file paths, change descriptions, and dependencies.

---

## Notes

- Plans follow data flow order: shared types → backend → frontend
- Cross-package dependencies are always identified
- Risk assessment included for breaking changes
