# Healing Protocol

> Human-initiated, system-wide health remediation — the immune system of the living universe.

---

## What Is Healing?

Healing is the process by which the system recovers when orchestrator outputs drift from CONTRACT.md specifications. Unlike automatic error handling, healing is **human-initiated**: the backend detects and presents violations, but only a human can trigger the healing flow.

**Key principle:** The system informs; the human decides; the orchestrator executes.

---

## Why Human-Initiated?

1. **Sovereignty** — Auto-healing could alter system behavior without consent
2. **Root cause ambiguity** — Is the contract outdated, or is the orchestrator drifting?
3. **Cascade prevention** — One bad auto-fix could trigger more fixes
4. **Learning opportunity** — Human review captures patterns for future prevention

---

## The Healing Triangle

```
                    ┌─────────────┐
                    │   HUMAN     │
                    │   (Will)    │
                    └──────┬──────┘
                           │ decides
              ┌────────────┴────────────┐
              ▼                         ▼
    ┌─────────────────┐       ┌─────────────────┐
    │  ORCHESTRATOR   │       │    BACKEND      │
    │    (Brain)      │       │    (Hands)      │
    │  routes healing │       │ detects drift   │
    └────────┬────────┘       └────────┬────────┘
             │                         │
             └──────────┬──────────────┘
                        ▼
              ┌─────────────────┐
              │    HARMONY      │
              │   (Verify)      │
              │ health restored │
              └─────────────────┘
```

---

## The Three Roles

### Backend: Detect & Present
- Validates orchestrator output at gate checkpoints
- Tracks violation patterns (3+ in 24h = critical)
- Broadcasts `HarmonyViolationEvent` via WebSocket
- Calculates health score (0-100)

### Human: Decide
- Reviews violations in Harmony Workbench
- Options: **Fix Now** | **Investigate** | **Ignore**
- Only human approval triggers healing execution

### Orchestrator: Route & Execute
- Routes "fix" request to appropriate healing flow
- Compiles healing chain (analyze → code → review → commit)
- Spawns agents to execute remediation
- Never self-initiates healing

---

## The Healing Cycle

| Phase | Actor | Action |
|-------|-------|--------|
| 1. Detect | Backend | Validate output, record violation |
| 2. Present | Frontend | Display health score, violations |
| 3. Decide | Human | Click "Fix Now" or investigate |
| 4. Route | Orchestrator | Compile healing chain |
| 5. Execute | Agents | Apply remediation |
| 6. Verify | Backend | Recalculate health, confirm restoration |

---

## Circuit Breaker

Human approval acts as a circuit breaker:
- Prevents cascading automatic fixes
- Ensures each healing is intentional
- Allows human to pause and investigate before proceeding

---

## When Healing Doesn't Apply

- **T0 input validation** — Rejecting invalid user input is not a healing issue
- **Notifications** — Broadcasting violations is informational, not healing
- **Auto-recovery** — Transient errors with automatic retry are not healing

Healing only applies to **contract drift** between orchestrator output and CONTRACT.md spec.

---

## Detailed Scenarios

For step-by-step healing scenarios with expected behaviors, see:
- `test/e2e/harmony/format-drift-gate4.test.md`
- `test/e2e/harmony/contract-drift-new-field.test.md`
- `test/e2e/harmony/websocket-event-mismatch.test.md`

---

## See Also

- `CONTRACT.md` — Format specifications
- `FLOWS.md` — Healing flow definitions (harmony-audit-and-fix/, contract-drift-fix/, parser-update/)
- `SYSTEM.md` — 7-layer architecture and healing cycle
- `packages/backend/src/services/harmonyDetector.ts` — Implementation

---

**Status:** Thin overview (dissolved from 1080-line HEALING_PROTOCOL.md)
