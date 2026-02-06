# Code/Backend Action

> Implement backend code changes in Express + WebSocket + Redis stack.

---

## Requires Input: YES

---

## Extends

This agent is **explicitly instructed** to execute:
- `_abstract/agent-standards` — Core behavioral principles
- `_abstract/create-log-folder` → Creates `.claude/actionflows/logs/code/{datetime}/`
- `_abstract/post-notification` → Posts completion notification (currently not configured)

---

## Inputs

| Input | Required | Description | Default |
|-------|----------|-------------|---------|
| task | YES | Backend feature/fix to implement. Example: "Add rate limiting middleware for command endpoints" | — |
| context | YES | Relevant backend files. Example: "packages/backend/src/routes/commands.ts, packages/backend/src/ws/" | — |
| component | NO | Specific area: routes, storage, ws, middleware | — |

---

## Model

**haiku** — Fast, well-defined backend implementation tasks.

---

## How Orchestrator Spawns This

1. Collect inputs:
   - `task`: From human request (backend-specific portion)
   - `context`: Backend files from human request or plan/ output

2. Spawn:

```
Read your definition in .claude/actionflows/actions/code/backend/agent.md

Project Context:
- Name: ActionFlows Dashboard
- Backend: Express + WebSocket + Redis (packages/backend/)
- Port: 3001

Input:
- task: Add rate limiting middleware for command endpoints
- context: packages/backend/src/routes/commands.ts
```

---

## Gate

Backend changes implemented, `pnpm -F @afw/backend type-check` passes, change summary written.

---

## Notes

- Always implement both MemoryStorage and RedisStorage when adding data operations
- WebSocket broadcasts should use existing ws handler pattern
- Test files in packages/backend/src/__tests__/ may need updates
