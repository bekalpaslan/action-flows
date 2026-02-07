# Frontend Code Action

> Implement frontend code changes following React + TypeScript + Electron patterns.

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
| task | YES | Frontend implementation task — e.g., "Add flow visualization controls" | — |
| context | YES | Relevant frontend files — e.g., "packages/app/src/components/" | — |

---

## Model

**haiku** — Fast, well-defined task execution for frontend code implementation.

---

## How Orchestrator Spawns This

1. Collect inputs:
   - `task`: From human request
   - `context`: From human request or routing knowledge

2. Spawn:

```
Read your definition in .claude/actionflows/actions/code/frontend/agent.md

Input:
- task: Add zoom controls to flow visualization
- context: packages/app/src/components/, packages/app/src/hooks/
```

---

## Gate

Frontend changes implemented, TypeScript check passes, change summary written.

---

## Notes

- Preferred over generic `code/` when work is purely frontend
- Uses React hooks + functional components + TypeScript patterns
- ReactFlow for flow visualization, Monaco for code editing, xterm for terminal
