# Code Action

> Implement code changes — features, bug fixes, refactors — across the ActionFlows Dashboard monorepo.

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
| task | YES | What to implement — e.g., "Add WebSocket reconnection logic" | — |
| context | YES | Relevant files or areas — e.g., "packages/backend/src/ws/" | — |
| component | NO | Specific area: backend, frontend, shared, mcp-server | auto-detect |

---

## Model

**haiku** — Fast, well-defined task execution for code implementation.

---

## How Orchestrator Spawns This

1. Collect inputs:
   - `task`: From human request
   - `context`: From human request or orchestrator's routing knowledge
   - `component`: From human request (optional)

2. Spawn:

```
Read your definition in .claude/actionflows/actions/code/agent.md

Input:
- task: Add retry logic to WebSocket reconnection
- context: packages/app/src/hooks/useWebSocket.ts, packages/app/src/contexts/WebSocketContext.tsx
- component: frontend
```

---

## Gate

Changes implemented, no TypeScript errors from `pnpm type-check`, change summary written to log folder.

---

## Notes

- For stack-specific work, prefer `code/backend/` or `code/frontend/` variants when the target is clear
- This generic `code/` action works across all packages when scope spans multiple areas
- Always runs type-check as verification step
