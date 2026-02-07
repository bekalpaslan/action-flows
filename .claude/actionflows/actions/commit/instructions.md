# Commit Action

> Stage, commit, and push git changes with conventional commit messages.

---

## Requires Input: YES

---

## Extends

This agent is **explicitly instructed** to execute:
- `_abstract/agent-standards` — Core behavioral principles

---

## Inputs

| Input | Required | Description | Default |
|-------|----------|-------------|---------|
| summary | YES | What was done — e.g., "Add WebSocket reconnection with exponential backoff" | — |
| files | YES | Files to stage — e.g., "packages/app/src/hooks/useWebSocket.ts packages/app/src/contexts/WebSocketContext.tsx" | — |
| push | NO | Push after commit | true |

---

## Model

**haiku** — Fast, well-defined mechanical task.

---

## How Orchestrator Spawns This

1. Collect inputs:
   - `summary`: From previous action's output or human description
   - `files`: From previous action's changed files list
   - `push`: From human request (default true)

2. Spawn:

```
Read your definition in .claude/actionflows/actions/commit/agent.md

Input:
- summary: Add WebSocket reconnection with exponential backoff
- files: packages/app/src/hooks/useWebSocket.ts packages/app/src/contexts/WebSocketContext.tsx
- push: true
```

---

## Gate

Commit created with conventional commit message and Co-Authored-By line. Push completed if requested.

---

## Notes

- Always includes `Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>`
- Never force pushes or amends previous commits
- Reports commit hash in output for tracking
