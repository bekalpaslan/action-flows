# Diagnose Action

> Root cause analysis for harmony violations — diagnose why violations occurred and recommend healing flows.

---

## Requires Input: YES

---

## Extends

This agent is **explicitly instructed** to execute:
- `_abstract/agent-standards` — Core behavioral principles
- `_abstract/create-log-folder` → Creates `.claude/actionflows/logs/diagnose/{datetime}/`

---

## Inputs

| Input | Required | Description | Default |
|-------|----------|-------------|---------|
| gateId | YES | Gate that failed validation (e.g., "Gate 4", "Gate 9") | — |
| violationPattern | YES | Description of violation pattern (e.g., "missing status column") | — |
| gateTraces | YES | Path to gate trace data file from health survey (JSON or markdown) | — |
| severityLevel | YES | Severity from classification step ("critical" \| "high" \| "medium" \| "low") | — |

---

## Model

**sonnet** — Needs reasoning for root cause inference and evidence evaluation.

---

## How Orchestrator Spawns This

1. Collect inputs:
   - `gateId`: From health survey/classify step
   - `violationPattern`: From health survey/classify step
   - `gateTraces`: Path to gate trace file
   - `severityLevel`: From classify step

2. Spawn:

```
Read your definition in .claude/actionflows/actions/diagnose/agent.md

Input:
- gateId: Gate 4
- violationPattern: missing status column
- gateTraces: .claude/actionflows/logs/health-survey/gate-traces.json
- severityLevel: high
```

---

## Gate

Root cause analysis report delivered with:
- Evidence (timing, code history, pattern analysis)
- Root cause classification (parser_bug, orchestrator_drift, contract_outdated, agent_drift, template_mismatch)
- Healing recommendation with confidence level
- Prevention suggestion

---

## Notes

- Uses git log to check file modification timestamps
- Compares violation start time to code change timing
- Considers multiple potential root causes before settling on one
- High-confidence + low-severity diagnoses may trigger auto-triage
- Medium/low-confidence diagnoses always require human approval for healing
- Suggests prevention patterns to avoid recurrence
