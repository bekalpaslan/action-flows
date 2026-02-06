# Commit Action

> Stage, commit, and push git changes.

---

## Requires Input: YES

---

## Extends

This agent is **explicitly instructed** to execute:
- `_abstract/agent-standards` — Core behavioral principles
- `_abstract/create-log-folder` → Creates `.claude/actionflows/logs/commit/{datetime}/`
- `_abstract/post-notification` → Posts commit notification (currently not configured)

---

## Inputs

| Input | Required | Description | Default |
|-------|----------|-------------|---------|
| summary | YES | What was done — used to generate commit message. Example: "Add WebSocket reconnection with exponential backoff" | — |
| files | YES | List of changed files to stage. Example: "packages/app/src/hooks/useWebSocket.ts, packages/app/src/contexts/WebSocketContext.tsx" | — |
| push | NO | Whether to push after commit | true |

---

## Model

**haiku** — Fast, mechanical task. Stage files, commit, push.

---

## How Orchestrator Spawns This

1. Collect inputs:
   - `summary`: From human or from previous action's change summary
   - `files`: From previous action's output listing changed files
   - `push`: From human preference or default true

2. Spawn:

```
Read your definition in .claude/actionflows/actions/commit/agent.md

Project Context:
- Name: ActionFlows Dashboard
- Working directory: D:/ActionFlowsDashboard

Input:
- summary: Add WebSocket reconnection with exponential backoff
- files: packages/app/src/hooks/useWebSocket.ts, packages/app/src/contexts/WebSocketContext.tsx
- push: true
```

---

## Gate

Commit created (and pushed if requested). Commit hash reported.

---

## Notes

- Never stages files broadly — always specific file paths
- Follows conventional commits matching project history
- Reports commit hash in output for tracking
