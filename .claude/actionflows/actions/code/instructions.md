# Code Action

> Implement code changes — features, bug fixes, refactors.

---

## Requires Input: YES

---

## Extends

This agent is **explicitly instructed** to execute:
- `_abstract/agent-standards` — Core behavioral principles
- `_abstract/create-log-folder` → Creates `.claude/actionflows/logs/code/{datetime}/`
- `_abstract/post-notification` → Posts completion notification (currently not configured)

**You don't need to spawn a separate `notify` action after this action.**

---

## Inputs

| Input | Required | Description | Default |
|-------|----------|-------------|---------|
| task | YES | What to implement — feature description, bug to fix, refactor goal. Example: "Add WebSocket reconnection with exponential backoff" | — |
| context | YES | Relevant files, modules, or areas. Example: "packages/app/src/hooks/useWebSocket.ts, packages/app/src/contexts/" | — |
| component | NO | Specific area: backend, frontend, shared, mcp-server, hooks | — |

---

## Model

**haiku** — Fast, well-defined task execution. Code implementation follows clear patterns.

---

## How Orchestrator Spawns This

1. Collect inputs:
   - `task`: From human request
   - `context`: From human request or from a previous plan/ action's output
   - `component`: Inferred from context paths or specified by human

2. Spawn:

```
Read your definition in .claude/actionflows/actions/code/agent.md

Project Context:
- Name: ActionFlows Dashboard
- Backend: Express + WebSocket + Redis (packages/backend/)
- Frontend: React + Vite + Electron (packages/app/)
- Shared: TypeScript types (packages/shared/)
- Ports: Backend 3001, Vite 5173

Input:
- task: Add WebSocket reconnection with exponential backoff
- context: packages/app/src/hooks/useWebSocket.ts, packages/app/src/contexts/
- component: frontend
```

---

## Gate

Changes implemented, no TypeScript errors (type-check passes), change summary written to log folder.

---

## Notes

- For multi-package changes, prefer spawning stack-specific variants (code/backend/, code/frontend/) in parallel
- Agent runs `pnpm type-check` after implementation to verify compilation
- If type-check fails, agent attempts to fix the errors before reporting
