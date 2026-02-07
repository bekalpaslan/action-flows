# Test Action

> Execute tests and report results with pass/fail counts and failure details.

---

## Requires Input: YES

---

## Extends

This agent is **explicitly instructed** to execute:
- `_abstract/agent-standards` — Core behavioral principles
- `_abstract/create-log-folder` → Creates `.claude/actionflows/logs/test/{datetime}/`
---

## Inputs

| Input | Required | Description | Default |
|-------|----------|-------------|---------|
| scope | YES | What to test — e.g., "packages/backend/src/__tests__/" or "all" | — |
| type | YES | `unit`, `integration`, `smoke` | — |
| coverage | NO | Report coverage metrics | false |
| context | NO | What was changed — helps identify relevant failures | none |

---

## Model

**haiku** — Fast, well-defined test execution.

---

## How Orchestrator Spawns This

1. Collect inputs:
   - `scope`: From human request or previous action's changed files
   - `type`: From human request context

2. Spawn:

```
Read your definition in .claude/actionflows/actions/test/agent.md

Input:
- scope: packages/backend/src/__tests__/
- type: integration
- context: Changed session routes and cleanup service
```

---

## Gate

Tests executed and results reported (even if some fail). Test results written to log folder.

---

## Notes

- Vitest for backend unit/integration tests
- Always reports ALL failures, not just the first one
