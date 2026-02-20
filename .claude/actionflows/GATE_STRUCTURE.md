# Orchestrator Gate Structure

> Quick reference for orchestrator execution gates. See also: `docs/architecture/GATE_STRUCTURE.md` for detailed I/O contracts and trace specs.

---

## Overview

**5 phases, 14 gates, 12 log points.**

```
REQUEST_RECEPTION → CHAIN_COMPILATION → CHAIN_EXECUTION → COMPLETION → POST_EXECUTION
    (Gates 1-3)         (Gates 4-6)        (Gates 7-10)    (Gates 11-12)  (Gates 13-14)
```

---

## Gate Index

| Gate | Name | Phase | Log? | Validated By |
|------|------|-------|------|--------------|
| 1 | Parse & Understand | Reception | No | Internal reasoning |
| 2 | Route to Context | Reception | Yes | gateCheckpoint.ts |
| 3 | Detect Special Work | Reception | Yes | gateCheckpoint.ts |
| 4 | Compile Chain | Compilation | Yes | gateCheckpoint.ts |
| 5 | Present Chain | Compilation | Implicit | Response format |
| 6 | Human Approval | Compilation | Yes | gateCheckpoint.ts |
| 7 | Execute Step | Execution | Yes | Agent logs |
| 8 | Step Completion | Execution | Implicit | Response format |
| 9 | Mid-Chain Evaluation | Execution | Yes | gateCheckpoint.ts |
| 10 | Auto-Trigger Detection | Execution | Partial | Response format |
| 11 | Chain Completion | Completion | Partial | Response format |
| 12 | Archive & Indexing | Completion | Yes | INDEX.md |
| 13 | Learning Surface | Post-Exec | Yes | gateCheckpoint.ts, LEARNINGS.md |
| 14 | Flow Candidate | Post-Exec | Partial | FLOWS.md |

---

## Log Coverage

| Status | Count | Gates |
|--------|-------|-------|
| Fully logged | 3 | 7, 12, 13 |
| Checkpoint validated | 6 | 2, 3, 4, 6, 9, 13 |
| Implicit/Partial | 5 | 5, 8, 10, 11, 14 |
| No log | 1 | 1 |

---

## Implementation

| Component | Location |
|-----------|----------|
| Checkpoint service | `packages/backend/src/services/gateCheckpoint.ts` |
| Gate trace types | `packages/shared/src/gateTrace.ts` |
| Gate log output | `.claude/actionflows/logs/` |
| Observability overview | `ORCHESTRATOR_OBSERVABILITY.md` |

---

## See Also

- `ORCHESTRATOR.md` — Gate contracts and orchestrator rules
- `CONTRACT.md` — Format specifications parsed at gates
- `docs/living/HEALING.md` — Healing protocol for violations

---

**Status:** Gate index (dissolved from 537-line specification)
