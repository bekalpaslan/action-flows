# Orchestrator Observability

> Architectural overview of how orchestrator outputs are observed, validated, and traced.

---

## Trust Requirement Taxonomy

The system operates across four trust boundaries:

| Level | Boundary | Direction | Validation |
|-------|----------|-----------|------------|
| **T0** | User → Backend | Inbound | Zod schemas, rate limiting |
| **T1** | Orchestrator → Backend | Internal | Gate checkpoint validation |
| **T2** | Backend → Frontend | Outbound | TypeScript types, event schemas |
| **T3** | Agent → Orchestrator | Internal | Agent output validation |

**Key principle:** Each boundary has its own validation layer. Gate checkpoints handle T1 (orchestrator-to-backend).

---

## Gate Checkpoint Architecture

```
Orchestrator outputs Format X.Y
         ↓
Backend parses at gate checkpoint
         ↓
Validation: valid | degraded | violation
         ↓
GateTrace stored (Redis, 7d TTL)
         ↓
Frontend displays via GateTraceViewer
```

### Checkpoint Service

**Location:** `packages/backend/src/services/gateCheckpoint.ts`

The checkpoint service:
- Intercepts orchestrator output at gate boundaries
- Parses using CONTRACT.md format definitions
- Records validation result as GateTrace
- Broadcasts violations via WebSocket
- Updates health metrics

### Validated Gates

| Gate | Trigger | Format Parsed |
|------|---------|---------------|
| Gate 2 | Context routing | Prose (keyword extraction) |
| Gate 3 | Special work detection | Prose (work type) |
| Gate 4 | Chain compilation | Format 1.1 |
| Gate 6 | Human approval | Prose (yes/no/modify) |
| Gate 9 | Mid-chain evaluation | Format 2.1 |
| Gate 13 | Learning surface | Format 3.2 |

See `GATE_STRUCTURE.md` for complete gate specifications.

---

## Trace Storage

### GateTrace Schema

**Location:** `packages/shared/src/gateTrace.ts`

```typescript
interface GateTrace {
  gateId: GateId;           // "gate-01" through "gate-14"
  gateName: string;         // Human-readable name
  timestamp: string;        // ISO 8601
  chainId: ChainId;
  stepId?: StepId;
  traceLevel: GateTraceLevel;

  // Validation
  validationResult?: {
    passed: boolean;
    violations: string[];
    harmonyScore: number;   // 0-100
  };

  // Decision context
  selected: string;
  rationale: string;
  confidence: "high" | "medium" | "low";
}
```

### Storage Pattern

- **Backend:** Redis with 7-day TTL
- **Key format:** `gate:{gateId}:{chainId}:{timestamp}`
- **Retrieval:** By session, by gate, by time range
- **Cleanup:** Automatic expiration

---

## Data Flow Diagrams

### Orchestrator → Backend → Frontend

```
┌─────────────────┐     Format X.Y      ┌─────────────────┐
│   ORCHESTRATOR  │ ──────────────────► │     BACKEND     │
│   (Claude)      │                     │  (Express+WS)   │
└─────────────────┘                     └────────┬────────┘
                                                 │
                              ┌──────────────────┼──────────────────┐
                              │                  │                  │
                              ▼                  ▼                  ▼
                     ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
                     │   Parse     │    │   Store     │    │  Broadcast  │
                     │  (parsers/) │    │  (Redis)    │    │    (WS)     │
                     └─────────────┘    └─────────────┘    └─────────────┘
                                                                   │
                                                                   ▼
                                                          ┌─────────────────┐
                                                          │    FRONTEND     │
                                                          │  (React+Flow)   │
                                                          └─────────────────┘
```

### Harmony Detection Flow

```
Orchestrator Output
        │
        ▼
┌───────────────────┐
│  Gate Checkpoint  │
│  (gateCheckpoint) │
└─────────┬─────────┘
          │
    ┌─────┴─────┐
    │           │
    ▼           ▼
 valid      violation
    │           │
    │           ▼
    │    ┌─────────────────┐
    │    │ HarmonyDetector │
    │    │ (record + emit) │
    │    └────────┬────────┘
    │             │
    │             ▼
    │    ┌─────────────────┐
    │    │ HarmonyHealth   │
    │    │ (score update)  │
    │    └────────┬────────┘
    │             │
    └──────┬──────┘
           │
           ▼
    ┌─────────────────┐
    │  GateTrace      │
    │  (stored)       │
    └─────────────────┘
```

---

## See Also

- **Gate definitions:** `GATE_STRUCTURE.md`
- **Contract formats:** `CONTRACT.md`
- **Orchestrator rules:** `ORCHESTRATOR.md`
- **Healing protocol:** `docs/living/HEALING.md`
- **System architecture:** `docs/living/SYSTEM.md`

### Implementation

- **Checkpoint service:** `packages/backend/src/services/gateCheckpoint.ts`
- **Harmony detector:** `packages/backend/src/services/harmonyDetector.ts`
- **Trace types:** `packages/shared/src/types/gateTrace.ts`
- **Parsers:** `packages/shared/src/contract/parsers/`

---

**Status:** Architectural overview (dissolved from 866-line specification)
