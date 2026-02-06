# Code/Frontend Action

> Implement frontend code changes in React + Vite + Electron stack.

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
| task | YES | Frontend feature/fix to implement. Example: "Add conversation panel component for Phase 6" | — |
| context | YES | Relevant frontend files. Example: "packages/app/src/components/SessionPane/, packages/app/src/hooks/" | — |
| component | NO | Specific area: components, hooks, contexts, electron | — |

---

## Model

**haiku** — Fast, well-defined frontend implementation tasks.

---

## How Orchestrator Spawns This

1. Collect inputs:
   - `task`: From human request (frontend-specific portion)
   - `context`: Frontend files from human request or plan/ output

2. Spawn:

```
Read your definition in .claude/actionflows/actions/code/frontend/agent.md

Project Context:
- Name: ActionFlows Dashboard
- Frontend: React + Vite + Electron (packages/app/)
- Port: Vite 5173

Input:
- task: Add conversation panel component for Phase 6
- context: packages/app/src/components/SessionPane/
```

---

## Gate

Frontend changes implemented, `pnpm -F @afw/app type-check` passes, change summary written.

---

## Notes

- Always co-locate CSS files with their component TSX files
- Use existing hook patterns — check packages/app/src/hooks/ for conventions
- ReactFlow nodes/edges follow patterns in ChainDAG component
