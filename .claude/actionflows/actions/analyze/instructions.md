# Analyze Action

> Data-driven analysis — metrics, patterns, inventories, gap detection, drift checking.

---

## Requires Input: YES

---

## Extends

This agent is **explicitly instructed** to execute:
- `_abstract/agent-standards` — Core behavioral principles
- `_abstract/create-log-folder` → Creates `.claude/actionflows/logs/analyze/{datetime}/`
- `_abstract/post-notification` → Posts analysis notification (currently not configured)

---

## Inputs

| Input | Required | Description | Default |
|-------|----------|-------------|---------|
| aspect | YES | What to analyze: `coverage`, `dependencies`, `structure`, `drift`, `inventory`, `impact`. Example: "coverage" | — |
| scope | YES | What to analyze. Example: "packages/backend/" or "all" | — |
| context | NO | Additional context. Example: "Focus on untested route handlers" | — |
| mode | NO | `analyze-only` or `analyze-and-correct` | analyze-only |

---

## Model

**sonnet** — Needs pattern recognition for identifying anomalies and drift.

---

## How Orchestrator Spawns This

1. Collect inputs:
   - `aspect`: From human request
   - `scope`: From human request or "all"
   - `mode`: From human or default analyze-only

2. Spawn:

```
Read your definition in .claude/actionflows/actions/analyze/agent.md

Project Context:
- Name: ActionFlows Dashboard
- Packages: app, backend, shared, hooks, mcp-server

Input:
- aspect: coverage
- scope: all
- context: Focus on untested route handlers
```

---

## Gate

Analysis report delivered with quantitative metrics, patterns, and actionable recommendations.

---

## Notes

- Coverage analysis currently limited to backend (only package with tests)
- Drift analysis compares phase docs against actual code state
- Impact analysis traces cross-package dependencies through @afw/shared types
