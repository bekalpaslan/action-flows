# Logging Check Flow

> End-to-end gate logging verification. Runs a minimal chain and validates all 14 gates fire.

---

## Approach

The orchestrator operates through a 5-phase, 14-gate execution model (defined in `GATE_STRUCTURE.md`). Each gate is a checkpoint in the execution pipeline, and proper logging at each gate is critical for:

- **Observability** — Understanding what the orchestrator is doing at each step
- **Debugging** — Tracing execution flow when things go wrong
- **Contract validation** — Ensuring gates fire in the correct order and with valid data
- **Healing** — Detecting violations and triggering recovery protocols

This flow doesn't test the orchestrator's ability to execute complex work — it validates that the **logging infrastructure itself is healthy**. The approach is:

1. **Trigger a minimal chain** — Run the simplest possible 2-step chain (analyze → review) internally
2. **Verify gate logs** — Check that all 14 gates logged their checkpoints to the backend

The chain is intentionally trivial. Its purpose is to exercise the gate pipeline, not produce meaningful output. If any gate fails to log, the logging infrastructure is broken and must be fixed before relying on any orchestrator execution traces.

---

## When to Use

- After modifying gate checkpoint code (`packages/backend/src/services/gateCheckpoint.ts`)
- After adding new gates or validators
- Periodic verification that the logging pipeline is healthy (recommended: weekly, or after backend infrastructure changes)
- After backend dependency updates (ws, ioredis, chokidar)

---

## Required Inputs From Human

| Input | Description | Example |
|-------|-------------|---------|
| *(none)* | Autonomous — no inputs required | — |

---

## Action Sequence

### Step 1: Trigger Minimal Chain

**Action:** *(Internal orchestrator action — not a delegated step)*
**Model:** *(orchestrator self-execution)*

The orchestrator runs a trivial 2-step chain internally:

- **Step A:** `analyze/` — analyze a single small file (e.g., `.claude/actionflows/GATE_STRUCTURE.md`)
  - aspect: "structure summary"
  - scope: single file
  - context: "Summarize the gate structure."

- **Step B:** `review/` — review the analysis output
  - aspect: "quality check"
  - scope: analysis output from Step A
  - context: "Validate the analysis is coherent."

This chain is intentionally minimal and autonomous — it requires no human input and produces no actionable output. Its sole purpose is to exercise the gate pipeline.

**Gate:** Both steps complete successfully (output content is irrelevant).

---

### Step 2: Verify Gate Logs

**Action:** `.claude/actionflows/actions/analyze/`
**Model:** sonnet

**Spawn:**
```
Read your definition in .claude/actionflows/actions/analyze/agent.md

Input:
- aspect: gate-logging
- scope: packages/backend/
- context: After Step 1 (minimal chain) completes, analyze the backend logs (stdout or log files in .claude/actionflows/logs/) for gate checkpoint entries. Check for all 14 gates defined in GATE_STRUCTURE.md. Expected log entries per gate:

| Gate | Expected Pattern | Phase |
|------|-----------------|-------|
| gate-01 | `[GateCheckpoint] gate-01 (Parse & Understand)` | Reception |
| gate-02 | `[GateCheckpoint] gate-02 (Route to Context)` | Reception |
| gate-03 | `[GateCheckpoint] gate-03 (Detect Special Work)` | Reception |
| gate-04 | `[GateCheckpoint] gate-04 (Compile Chain)` | Compilation |
| gate-05 | `[GateCheckpoint] gate-05 (Present Chain)` | Compilation |
| gate-06 | `[GateCheckpoint] gate-06 (Human Approval)` | Compilation |
| gate-07 | `[GateCheckpoint] gate-07 (Execute Step)` | Execution |
| gate-08 | `[GateCheckpoint] gate-08 (Execution Complete)` | Execution |
| gate-09 | `[GateCheckpoint] gate-09 (Agent Output)` | Execution |
| gate-10 | `[GateCheckpoint] gate-10 (Auto-Trigger Detection)` | Execution |
| gate-11 | `[GateCheckpoint] gate-11 (Registry Update)` | Completion |
| gate-12 | `[GateCheckpoint] gate-12 (Archive & Indexing)` | Completion |
| gate-13 | `[GateCheckpoint] gate-13 (Learning Surface)` | Post-Exec |
| gate-14 | `[GateCheckpoint] gate-14 (Flow Candidate)` | Post-Exec |

Report: pass/fail per gate, total coverage percentage (e.g., "12/14 gates logged = 85.7% coverage"). List missing gates explicitly. If any gate is missing, flag the logging infrastructure as degraded.
```

**Gate:** Gate logging report delivered with pass/fail per gate and total coverage percentage.

---

## Dependencies

```
┌──────────────────────────┐
│  Step 1: Minimal Chain   │
│  (internal orchestrator) │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│  Step 2: Verify Logs     │
│  (analyze/ agent)        │
└──────────────────────────┘
```

**Sequential:** Step 2 depends on Step 1 completing (logs must exist before verification).

---

## Chains With

- ← `framework-health/` can trigger this as a follow-up
- → Manual remediation if gates are missing:
  - Check `packages/backend/src/services/gateCheckpoint.ts` — ensure all 14 gates are defined
  - Check `packages/backend/src/ws/conversationWatcher.ts` — ensure watcher calls `logGateCheckpoint()` at correct points
  - Check backend stdout/log file paths — ensure logs are being written to the correct location
  - Restart backend if necessary to re-initialize gate checkpoint service
