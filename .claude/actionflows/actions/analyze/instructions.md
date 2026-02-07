# Analyze Action

> Data-driven analysis — metrics, patterns, inventories, gap detection, drift checking.

---

## Requires Input: YES

---

## Extends

This agent is **explicitly instructed** to execute:
- `_abstract/agent-standards` — Core behavioral principles
- `_abstract/create-log-folder` → Creates `.claude/actionflows/logs/analyze/{datetime}/`
---

## Inputs

| Input | Required | Description | Default |
|-------|----------|-------------|---------|
| aspect | YES | `coverage`, `dependencies`, `structure`, `drift`, `inventory`, `impact` | — |
| scope | YES | What to analyze — e.g., "packages/backend/" or "all" | — |
| context | NO | What to look for — e.g., "Focus on unused exports in shared package" | none |
| mode | NO | `analyze-only` or `analyze-and-correct` | analyze-only |

---

## Model

**sonnet** — Needs pattern recognition for quantitative analysis.

---

## How Orchestrator Spawns This

1. Collect inputs:
   - `aspect`: From human request
   - `scope`: From human request

2. Spawn:

```
Read your definition in .claude/actionflows/actions/analyze/agent.md

Input:
- aspect: coverage
- scope: all
- context: Focus on backend test coverage gaps
```

---

## Gate

Analysis report delivered with quantitative metrics, patterns, and actionable recommendations.

---

## Notes

- Coverage analysis compares test files to source files per package
- Drift analysis compares docs/registries against actual filesystem state
- Impact analysis traces cross-package dependencies for proposed changes
- When `mode: analyze-and-correct`, fixes drift and stale data directly
