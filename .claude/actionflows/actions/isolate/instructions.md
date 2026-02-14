# Isolate Action

> Quarantine operations for problematic chains, sessions, and formats — prevent further degradation while healing is prepared.

---

## Requires Input: YES

---

## Extends

This agent is **explicitly instructed** to execute:
- `_abstract/agent-standards` — Core behavioral principles
- `_abstract/create-log-folder` → Creates `.claude/actionflows/logs/isolate/{datetime}/`

---

## Inputs

| Input | Required | Description | Default |
|-------|----------|-------------|---------|
| subcommand | YES | Operation type ("quarantine" \| "release" \| "list") | — |
| targetType | YES (for quarantine/release) | What to quarantine ("chain" \| "session" \| "format") | — |
| targetId | YES (for quarantine/release) | ID of target (ChainId \| SessionId \| FormatName) | — |
| reason | YES (for quarantine only) | Why this target is quarantined (violation description) | — |
| autoRelease | NO | Whether to auto-release after TTL | false |

---

## Model

**haiku** — Simple quarantine operations, no complex reasoning needed.

---

## How Orchestrator Spawns This

1. Collect inputs:
   - `subcommand`: From health protocol decision (quarantine/release/list)
   - `targetType`: From health protocol context
   - `targetId`: From health protocol context
   - `reason`: From classify/diagnose step (for quarantine)

2. Spawn (quarantine example):

```
Read your definition in .claude/actionflows/actions/isolate/agent.md

Input:
- subcommand: quarantine
- targetType: chain
- targetId: chain-20260213-012345
- reason: Repeated Format 1.1 violations (missing status column)
- autoRelease: false
```

3. Spawn (release example):

```
Read your definition in .claude/actionflows/actions/isolate/agent.md

Input:
- subcommand: release
- targetType: chain
- targetId: chain-20260213-012345
```

4. Spawn (list example):

```
Read your definition in .claude/actionflows/actions/isolate/agent.md

Input:
- subcommand: list
```

---

## Gate

Quarantine operation completed with:
- Redis record written (or deleted, for release)
- WebSocket event emitted
- quarantine-record.md generated in log folder
- Impact summary (execution blocked/unblocked, dashboard badge status)

---

## Notes

- Only quarantine for critical violations (severity=critical)
- Uses 7-day TTL for critical quarantines (autoRelease=false)
- Validates all inputs before operations
- Checks if target is already quarantined before adding
- Emits WebSocket events for frontend real-time updates
- Backend integration is pending — currently documents intended operation
