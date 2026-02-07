# Backend Code Action

> Implement backend code changes following Express + TypeScript + Zod patterns.

---

## Requires Input: YES

---

## Extends

This agent is **explicitly instructed** to execute:
- `_abstract/agent-standards` — Core behavioral principles
- `_abstract/create-log-folder` → Creates `.claude/actionflows/logs/code/{datetime}/`
---

## Inputs

| Input | Required | Description | Default |
|-------|----------|-------------|---------|
| task | YES | Backend implementation task — e.g., "Add session expiry endpoint" | — |
| context | YES | Relevant backend files — e.g., "packages/backend/src/routes/sessions.ts" | — |

---

## Model

**haiku** — Fast, well-defined task execution for backend code implementation.

---

## How Orchestrator Spawns This

1. Collect inputs:
   - `task`: From human request
   - `context`: From human request or routing knowledge

2. Spawn:

```
Read your definition in .claude/actionflows/actions/code/backend/agent.md

Input:
- task: Add session expiry cleanup endpoint
- context: packages/backend/src/routes/sessions.ts, packages/backend/src/services/cleanup.ts
```

---

## Gate

Backend changes implemented, `pnpm -F @afw/backend type-check` passes, change summary written.

---

## Notes

- Preferred over generic `code/` when work is purely backend
- Uses Express Router + Zod + StorageProvider patterns
- All IDs use branded types from @afw/shared
