# Plan Action

> Create detailed implementation plans before coding begins.

---

## Requires Input: YES

---

## Extends

This agent is **explicitly instructed** to execute:
- `_abstract/agent-standards` — Core behavioral principles
- `_abstract/create-log-folder` → Creates `.claude/actionflows/logs/plan/{datetime}/`
- `_abstract/post-notification` → Posts planning notification (currently not configured)

---

## Inputs

| Input | Required | Description | Default |
|-------|----------|-------------|---------|
| requirements | YES | What needs to be planned. Example: "Phase 6 conversation interface with user input injection" | — |
| context | YES | Constraints and related code. Example: "Must integrate with WebSocketContext, SessionPane component, existing command infrastructure" | — |
| depth | NO | `high-level` or `detailed` | detailed |

---

## Model

**opus** — Deep reasoning needed for comprehensive planning and risk assessment.

---

## How Orchestrator Spawns This

1. Collect inputs:
   - `requirements`: From human request
   - `context`: From human request or framework knowledge
   - `depth`: From human or default detailed

2. Spawn:

```
Read your definition in .claude/actionflows/actions/plan/agent.md

Project Context:
- Name: ActionFlows Dashboard
- Backend: Express + WebSocket + Redis (packages/backend/)
- Frontend: React + Vite + Electron (packages/app/)
- Shared: TypeScript types (packages/shared/)
- Current phase: Phase 5 complete

Input:
- requirements: Phase 6 conversation interface with user input injection
- context: Must integrate with WebSocketContext, SessionPane component, existing command infrastructure
- depth: detailed
```

---

## Gate

Plan delivered with actionable, ordered steps. Each step includes file paths, change descriptions, and dependencies.

---

## Notes

- Planning agent explores codebase extensively — may take longer than other actions
- Output includes a suggested ActionFlows chain for implementing the plan
- Risk assessment considers cross-package impacts
