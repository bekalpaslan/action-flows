# Test Action

> Execute tests and report results.

---

## Requires Input: YES

---

## Extends

This agent is **explicitly instructed** to execute:
- `_abstract/agent-standards` — Core behavioral principles
- `_abstract/create-log-folder` → Creates `.claude/actionflows/logs/test/{datetime}/`
- `_abstract/post-notification` → Posts test results notification (currently not configured)

**You don't need to spawn a separate `notify` action after this action.**

---

## Inputs

| Input | Required | Description | Default |
|-------|----------|-------------|---------|
| scope | YES | What to test — file paths, test directory, module name, or "all". Example: "packages/backend/src/__tests__/" | — |
| type | YES | Test type: `unit`, `integration`, `e2e`, `smoke`. Example: "integration" | — |
| coverage | NO | Report coverage metrics | false |
| context | NO | What was changed — helps identify relevant failures. Example: "Modified session route handlers" | — |

---

## Model

**haiku** — Fast, well-defined task. Run command, parse output, report.

---

## How Orchestrator Spawns This

1. Collect inputs:
   - `scope`: From human request or inferred from code/ action output
   - `type`: From human or inferred from scope
   - `context`: From previous code/ action summary

2. Spawn:

```
Read your definition in .claude/actionflows/actions/test/agent.md

Project Context:
- Name: ActionFlows Dashboard
- Test framework: Vitest + Supertest
- Test location: packages/backend/src/__tests__/

Input:
- scope: packages/backend/src/__tests__/
- type: integration
- context: Modified session route handlers
```

---

## Gate

Tests executed and results reported (even if some fail). Report includes pass/fail counts and failure details.

---

## Notes

- Currently only backend has automated tests (Vitest + Supertest)
- E2E tests are specification documents, not automated suites
- Type checking via `pnpm type-check` serves as a smoke test
