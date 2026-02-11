# Gate Logging & Checkpoint Verification Architecture

**Version:** 1.0
**Date:** 2026-02-11
**Context:** Backend verification infrastructure for orchestrator output compliance

---

## Overview

**Purpose:** Enable auditable verification of orchestrator outputs at backend gate checkpoints without imposing observability burden on the orchestrator.

**Core Principle:** **"Zero Orchestrator Burden"**
- Orchestrator produces contract-compliant outputs naturally (already trained behavior)
- Backend parses outputs passively at decision boundaries
- Harmony stores traces for auditability
- Frontend displays verification results in dashboard

**Result:** Complete traceability + zero extra work for orchestrator

---

## Architecture Pattern

### High-Level Data Flow

```
┌─────────────────┐
│  Orchestrator   │
│                 │
│ Outputs Format  │
│ 1.1 (Chain      │
│ Compilation)    │
└────────┬────────┘
         │
         │ (Contract-compliant
         │  markdown table)
         ▼
┌─────────────────────────────────┐
│  Backend Service                │
│                                 │
│  OrchestrationMonitor tails     │
│  conversation JSONL in real-time│
└────────┬────────────────────────┘
         │
         │ Detects Format 1.1
         │ output
         ▼
┌──────────────────────────────────────┐
│  Gate Checkpoint Validator (Gate 4)  │
│                                      │
│  1. Parse orchestrator output        │
│     (Format 1.1)                     │
│  2. Validate structure               │
│  3. Check required fields            │
│  4. Create GateTrace record          │
└────────┬─────────────────────────────┘
         │
         │ Validation
         │ result
         ▼
┌────────────────────────────────────┐
│  Harmony Storage (Redis/Memory)    │
│                                    │
│  Key: gate:gate-04:{chainId}      │
│       :{timestamp}                 │
│  Value: GateTrace JSON (7d TTL)   │
└────────┬──────────────────────────┘
         │
         │ Store +
         │ WebSocket
         │ broadcast
         ▼
┌────────────────────────────────────┐
│  Frontend Dashboard                │
│                                    │
│  GateTraceViewer component:        │
│  - Displays gate checkpoint info   │
│  - Shows validation results        │
│  - Real-time updates via WS        │
└────────────────────────────────────┘
```

---

## Components

### 1. Gate Checkpoint Service

**File:** `packages/backend/src/services/gateCheckpoint.ts`

**Responsibilities:**
- Record gate checkpoint passages
- Store gate traces in Harmony (Redis)
- Emit WebSocket events for frontend
- Log to console at appropriate levels

**Interface:**
```typescript
export class GateCheckpoint extends EventEmitter {
  recordCheckpoint(trace: GateTrace): Promise<void>;
  getGateTraces(chainId: ChainId, gateId?: GateId): Promise<GateTrace[]>;
  getGateStats(gateId: GateId): Promise<GateStats>;
}
```

**Singleton Pattern:**
```typescript
// Initialize once at backend startup
initGateCheckpoint(storage);

// Use globally
const gateCheckpoint = getGateCheckpoint();
```

---

### 2. Individual Gate Validators

**Pattern:** One validator per gate (P0 gates prioritized)

**Example: Gate 4 Validator**
```
File: packages/backend/src/services/checkpoints/gate04-chain-compilation.ts

Process:
  1. Detect orchestrator outputs Format 1.1 (Chain Compilation)
  2. Parse using parseChainCompilation() from @afw/shared
  3. Validate: title, table structure, execution mode
  4. Calculate violations and harmony score
  5. Record checkpoint via GateCheckpoint service
  6. If violations: store in Harmony violation log
```

**Validators Implemented (Phase 1 Focus):**
- Gate 2: Route to Context (extract & validate context enum)
- Gate 4: Compile Chain (parse & validate Format 1.1)
- Gate 6: Step Boundary (parse Format 2.1, check 6-triggers)
- Gate 9: Agent Output Validation (delegate to AgentValidator)

---

### 3. Agent Validator Service

**File:** `packages/backend/src/services/agentValidator.ts`

**Purpose:** Validate agent output files against CONTRACT.md specifications

**Validates Against:**
- Format 5.1 (Review Report) — required verdict + score
- Format 5.2 (Analysis Report) — required title + sections + recommendations
- Format 5.3 (Brainstorm Transcript) — recommended structure (not enforced)

**Returns:** ValidationResult with violations list and harmony score

**Integration:** Called by Gate 9 checkpoint validator

---

### 4. Gate Trace Schema

**File:** `packages/shared/src/types/gateTrace.ts`

**Purpose:** Shared type definition for gate traces (backend ↔ Redis ↔ frontend)

**Key Fields:**
```typescript
interface GateTrace {
  gateId: GateId;              // "gate-01" through "gate-14"
  gateName: string;            // "Route to Context"
  timestamp: number;           // Unix timestamp
  chainId: ChainId;            // Chain context
  stepId?: StepId;             // Step context (optional)

  traceLevel: GateTraceLevel;  // TRACE | DEBUG | INFO | WARN | ERROR

  orchestratorOutput: string;  // First 500 chars of output
  parsedFormat?: string;       // "Format 1.1"

  input: string;               // What triggered this gate
  alternatives?: string[];     // Other options considered
  selected: string;            // What was chosen
  rationale: string;           // Why this decision
  confidence: "high" | "medium" | "low";

  validationResult?: {
    passed: boolean;
    violations: string[];      // Error messages
    harmonyScore: number;      // 0-100
  };

  duration?: number;           // Execution time (ms)
  metadata?: Record<string, unknown>;
}
```

---

### 5. WebSocket Broadcasting

**File:** `packages/backend/src/ws/broadcastService.ts`

**Event Pattern:**
```typescript
gateCheckpoint.on('gate:checkpoint', (trace: GateTrace) => {
  broadcastToSession(trace.chainId, {
    type: 'chain:gate_checkpoint',
    gateId: trace.gateId,
    gateName: trace.gateName,
    selected: trace.selected,
    confidence: trace.confidence,
    validationResult: trace.validationResult,
    timestamp: trace.timestamp
  });
});
```

**Frontend Receives:**
```json
{
  "type": "chain:gate_checkpoint",
  "gateId": "gate-04",
  "gateName": "Compile Chain",
  "selected": "3 steps, Sequential execution",
  "confidence": "high",
  "validationResult": {
    "passed": true,
    "violations": [],
    "harmonyScore": 100
  },
  "timestamp": 1707582211000
}
```

---

### 6. Frontend Display Component

**File:** `packages/app/src/components/GateTraceViewer.tsx`

**Purpose:** Display gate checkpoint traces in dashboard

**Features:**
- List all gate passages for a chain
- Filter by gate ID
- Show validation results (passed/failed)
- Display harmony score (0-100)
- Real-time updates via WebSocket

**Integration Points:**
- Harmony workbench (main display)
- Session detail view (contextual display)
- Cosmic map (gate checkpoints marked on timeline)

---

## Zero-Burden Architecture Explained

### Why "Zero Burden"?

**The Orchestrator Doesn't Know About Gates:**

The orchestrator follows `.claude/actionflows/ORCHESTRATOR.md` instructions and naturally outputs contract-compliant formats. It has NO awareness that these outputs are being validated.

Example:
```markdown
## Chain: Implement User Authentication

| # | Action | Model | Key Inputs | Waits For | Status |
|---|--------|-------|-----------|-----------|--------|
| 1 | code/backend | claude-opus | JWT, Express | - | Pending |
| 2 | code/frontend | claude-opus | React auth | Step 1 | Pending |
| 3 | review/code | claude-sonnet | Code quality | Step 2 | Pending |

Sequential execution

1. **Step 1 (code/backend):** Implement Express routes for user login, registration, token refresh
2. **Step 2 (code/frontend):** Build React login form and context for auth state
3. **Step 3 (review/code):** Security audit and code quality review
```

The orchestrator outputs this because it's trained to follow CONTRACT.md Format 1.1. No extra work.

**The Backend Does the Observation:**

When the orchestrator outputs the above, the backend:

1. Detects the output in real-time (via JSONL tailing or frontend API call)
2. Extracts Format 1.1 (the markdown table)
3. Parses it using `parseChainCompilation()`
4. Validates: title, columns, execution mode
5. Creates a GateTrace record
6. Stores in Harmony
7. Broadcasts to frontend

**All Zero Knowledge to Orchestrator.** Backend acts passively. No orchestrator instructions to modify. No burden on orchestrator.

---

## Data Flow: Orchestrator → Backend → Harmony → Frontend

### 1. Orchestrator Outputs (Natural Behavior)

```
Orchestrator decision: "I should compile a chain"
↓
Orchestrator outputs Format 1.1 (Chain Compilation Table)
  - This is standard, trained behavior
  - No awareness of validation happening
  - No extra work or observability calls
```

### 2. Backend Observes (Passive Parsing)

```
Backend monitors orchestrator output stream
↓
Detects Format 1.1 pattern: "## Chain: ..."
↓
Calls parseChainCompilation() parser
↓
Validates parsed structure (title, table, execution)
↓
Creates GateTrace record with validation result
```

### 3. Harmony Stores (Auditability)

```
Backend stores GateTrace in Redis with key:
  gate:{gateId}:{chainId}:{timestamp}

Record expires after 7 days (TTL)
↓
Also stored in violation log if validation failed:
  harmony:violations → list of GateViolation records
```

### 4. Frontend Displays (User Visibility)

```
Frontend receives WebSocket event:
  { type: "chain:gate_checkpoint", gateId: "gate-04", ... }
↓
GateTraceViewer component renders in dashboard
↓
User sees:
  - Gate 4: Compile Chain ✅ PASS
  - Harmony Score: 100/100
  - Details: 3 steps, Sequential execution
```

---

## Graceful Degradation

### What Happens If Parsing Fails?

**Scenario:** Orchestrator outputs something that doesn't match Format 1.1

**Backend Behavior:**
```typescript
try {
  const parsed = parseChainCompilation(orchestratorOutput);
  // ... validate and store trace ...
} catch (error) {
  // Parsing failed - store violation instead
  await harmonyStorage.storeViolation({
    gateId: 'gate-04',
    reason: error.message,
    rawOutput: orchestratorOutput,
    status: 'violated'
  });

  // Important: DO NOT block execution
  // DO NOT throw error
  // Just create maintenance signal
  console.warn('[Gate 4] Format mismatch detected, creating harmony violation');
}
```

**Result:**
- Execution continues (no cascade failure)
- Violation logged in Harmony
- Maintenance signal appears in dashboard (terrain flicker)
- Human can investigate via Harmony workbench
- If threshold met (3+ violations in 24h), trigger healing flow

---

## Trust Model

### Orchestrator is "Light and Trusted"

- **Light:** Produces outputs naturally, zero observability overhead
- **Trusted:** Expected to follow CONTRACT.md, but failures are gracefully handled
- **Unaware:** Has no knowledge of validation infrastructure

### Backend is "Strict but Graceful"

- **Strict:** Expects CONTRACT.md compliance
- **Graceful:** Degrades on failures (stores violations, doesn't crash)
- **Transparent:** Creates maintenance signals visible to humans

### Harmony is "Health Layer"

- **Storage:** Traces retained for 7 days (auditability window)
- **Monitoring:** Detects violation patterns
- **Healing:** Triggers remediation flows when thresholds met

---

## Implementation Checklist

### Phase 1: Gate Checkpoint Infrastructure (P0)

- [x] Define GateTrace schema in `packages/shared/src/types/gateTrace.ts`
- [x] Implement GateCheckpoint service in `packages/backend/src/services/gateCheckpoint.ts`
- [ ] Implement Gate 2 validator (Route to Context)
- [ ] Implement Gate 4 validator (Compile Chain)
- [ ] Implement Gate 6 validator (Step Boundary)
- [ ] Implement Gate 9 validator (Agent Output Validation)
- [ ] Integrate with WebSocket broadcasting
- [ ] Create GateTraceViewer frontend component

### Phase 2: Agent Behavior Validator (P0)

- [ ] Implement AgentValidator service in `packages/backend/src/services/agentValidator.ts`
- [ ] Add Format 5.1 (Review Report) validation
- [ ] Add Format 5.2 (Analysis Report) validation
- [ ] Add Format 5.3 (Brainstorm Transcript) validation
- [ ] Integrate with Gate 9 checkpoint

### Phase 3: Contract Compliance Tests (P1)

- [ ] Expand contract test coverage for agent outputs
- [ ] Add agent-output-compliance.test.ts
- [ ] Add agent-output-completeness.test.ts
- [ ] Integrate into CI pipeline

### Phase 4: E2E Verification (P1)

- [ ] E2E test: complete chain with all gates logging
- [ ] E2E test: agent validation failure surfaces learning
- [ ] Documentation complete
- [ ] System maturity L2.6 → L4.0

---

## Metrics & Observability

### Gate Checkpoint Coverage

| Gate | Status | Priority | Validation |
|------|--------|----------|------------|
| Gate 2 | TODO | P0 | Context enum validation |
| Gate 4 | TODO | P0 | Format 1.1 parsing |
| Gate 6 | TODO | P0 | Format 2.1 + 6-triggers |
| Gate 9 | TODO | P0 | Agent output validation |
| Gate 13 | TODO | P1 | Learning surface validation |
| (Others) | TODO | P2+ | Format validation |

### Harmony Score

**Calculation:**
```
harmonyScore = 100 - (criticalViolations × 20) - (warningViolations × 5)
Range: 0-100
```

**Interpretation:**
- 100: Perfect (no violations)
- 80-99: Healthy (minor warnings)
- 60-79: Degraded (fixable issues)
- <60: Critical (blocking issues)

---

## Future Enhancements

### 1. Gate Performance Analytics
- Track gate passage duration (avg, p50, p95, p99)
- Identify bottleneck gates
- Dashboard visualization

### 2. Gate Replay & Debugging
- Record all gate inputs/outputs
- Replay gate decisions with modified inputs
- Simulate "what if" scenarios

### 3. Harmony Trend Visualization
- Line chart: harmony score over time
- Heatmap: violation frequency by format
- Anomaly detection

---

## References

**Core Documentation:**
- `.claude/actionflows/CONTRACT.md` — Format specifications
- `.claude/actionflows/ORCHESTRATOR_OBSERVABILITY.md` — Observability catalog
- `.claude/actionflows/LOGGING_STANDARDS_CATALOG.md` — Logging standards

**Implementation:**
- `packages/shared/src/types/gateTrace.ts` — Type definitions
- `packages/backend/src/services/gateCheckpoint.ts` — Checkpoint service
- `packages/app/src/components/GateTraceViewer.tsx` — Display component

**Related Plans:**
- `.claude/actionflows/logs/plan/auditable-verification-system-revised_2026-02-11-21-59-55/plan.md` — Architecture plan

---

**End of Gate Logging Documentation**
