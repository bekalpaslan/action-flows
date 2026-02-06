# Status-Update Action

> Update project progress/status tracking files.

---

## Requires Input: YES

---

## Extends

This agent is **explicitly instructed** to execute:
- `_abstract/agent-standards` — Core behavioral principles
- `_abstract/create-log-folder` → Creates `.claude/actionflows/logs/status-update/{datetime}/`
- `_abstract/post-notification` → Posts status notification (currently not configured)

---

## Inputs

| Input | Required | Description | Default |
|-------|----------|-------------|---------|
| what | YES | What was accomplished. Example: "Completed Phase 6 conversation panel implementation" | — |
| date | NO | Date of the work | Current date |
| files | NO | Specific status files to update. Example: "PHASE_5_COMPLETE.md" | Auto-detect |

---

## Model

**haiku** — Fast, mechanical task. Find status files, update markers.

---

## How Orchestrator Spawns This

1. Collect inputs:
   - `what`: Summary from previous action or human description
   - `files`: Specific files or let agent auto-detect

2. Spawn:

```
Read your definition in .claude/actionflows/actions/status-update/agent.md

Project Context:
- Name: ActionFlows Dashboard
- Status files: PHASE_5_COMPLETE.md, docs/

Input:
- what: Completed Phase 6 conversation panel implementation
```

---

## Gate

Status files updated consistently. Update report written.

---

## Notes

- Agent auto-detects relevant status files if not specified
- Only updates existing files — never creates new status documents
