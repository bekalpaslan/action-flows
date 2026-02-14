# Verify-Healing Action

> Post-healing validation — compare before/after health scores and issue verdict on healing success.

---

## Requires Input: YES

---

## Extends

This agent is **explicitly instructed** to execute:
- `_abstract/agent-standards` — Core behavioral principles
- `_abstract/create-log-folder` → Creates `.claude/actionflows/logs/verify-healing/{datetime}/`

---

## Inputs

| Input | Required | Description | Default |
|-------|----------|-------------|---------|
| healingChainId | YES | ChainId of healing chain that executed (for audit trail) | — |
| targetGateId | YES | Gate that was failing (e.g., "Gate 4") | — |
| expectedScore | YES | Minimum acceptable health score after healing | 95 |
| preHealingScore | YES | Health score before healing (from DETECT phase) | — |
| preHealingViolations | YES | Path to violation data from DETECT phase (for comparison) | — |

---

## Model

**sonnet** — Needs reasoning for verdict determination and evidence evaluation.

---

## How Orchestrator Spawns This

1. Collect inputs:
   - `healingChainId`: From healing chain execution context
   - `targetGateId`: From health protocol context
   - `expectedScore`: From health protocol config (default 95)
   - `preHealingScore`: From DETECT phase output
   - `preHealingViolations`: Path to DETECT phase violation data file

2. Spawn:

```
Read your definition in .claude/actionflows/actions/verify-healing/agent.md

Input:
- healingChainId: chain-harmony-fix-20260213-012345
- targetGateId: Gate 4
- expectedScore: 95
- preHealingScore: 78
- preHealingViolations: .claude/actionflows/logs/health-survey/violations.json
```

---

## Gate

Healing verification report delivered with:
- Before/after health score comparison
- Target gate violation count analysis
- Other gates stability check (new violations introduced?)
- Verdict (SUCCESS | PARTIAL | FAILED | ESCALATE)
- Recommendations for next action

---

## Notes

- SUCCESS: score ≥ expectedScore AND target violations = 0
- PARTIAL: score improved BUT below expectedScore OR violations reduced but not cleared
- FAILED: score unchanged (within ±2 point noise margin)
- ESCALATE: score degraded OR new critical violations introduced
- False SUCCESS allows degraded health to persist — use clear thresholds
- False ESCALATE triggers unnecessary rollback — verdict must be evidence-based
- Backend health API integration is pending — currently documents expected contract
