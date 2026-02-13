# Health-Protocol Flow

> 7-phase immune response system for detecting, diagnosing, and healing ActionFlows contract violations

---

## When to Use

- Health score drops below 90 (dashboard recommendation displays)
- Critical violations detected (3+ in 24 hours across gates)
- Human observes degraded behavior (parsing failures, missing UI elements)
- Human says "run health protocol" or clicks "Fix Now" in dashboard
- Gate failure patterns indicate systemic drift

---

## Prerequisites

**CRITICAL:** Before execution, verify:
1. Backend is running on port 3001 (`pnpm dev:backend`)
2. Redis is accessible (health monitoring requires gate trace history)
3. Git working directory is clean (healing may create commits)

If any prerequisite fails → Flow errors. Human must fix and re-run.

---

## Required Inputs From Human

| Input | Description | Example |
|-------|-------------|---------|
| mode | Execution depth | `"full"` (all 7 phases), `"standard"` (skip quarantine), `"quick"` (low-severity auto-triage) |
| targetGate | Optional gate filter | `"Gate 4"` (focus on specific gate), `null` (all gates) |

---

## The 7-Phase Immune Response

```
DETECT → CLASSIFY → ISOLATE → DIAGNOSE → HEAL → VERIFY → LEARN
  (1)       (2)        (3)         (4)      (5)     (6)     (7)
                                          ↑
                                    HUMAN GATE
```

**Core Philosophy:** Human-initiated healing with full sovereignty. The system detects and presents violations, but only a human can trigger remediation.

---

## Action Sequence

### Phase 1: DETECT

**Action:** `.claude/actionflows/actions/analyze/`
**Model:** sonnet
**Waits for:** None

**Spawn:**
```
Read your definition in .claude/actionflows/actions/analyze/agent.md

IMPORTANT: You are a spawned subagent executor.
Do NOT read .claude/actionflows/ORCHESTRATOR.md — it is not for you.
Do NOT delegate work or compile chains. Execute your agent.md directly.

Project Context:
- Name: ActionFlows Dashboard
- Backend: Express 4.18 + TypeScript + ws 8.14.2 + ioredis 5.3 + Zod
- Frontend: React 18.2 + Vite 5 + Electron 28 + ReactFlow + Monaco + xterm
- Shared: Branded types, discriminated unions, ES modules
- Paths: backend=packages/backend/, frontend=packages/app/, shared=packages/shared/
- Ports: backend=3001, vite=5173

Input:
- aspect: "health"
- scope: "system"
- includeHistory: true
- timeRange: "7d"
```

**Gate:** Step 1 completes when health-report.md is generated with:
- Current health score (0-100)
- Violations grouped by gate (2, 4, 6, 8, 9, 11)
- Frequency analysis (24h, 7d)
- Pattern detection results

---

### Phase 2: CLASSIFY

**Action:** `.claude/actionflows/actions/analyze/`
**Model:** sonnet
**Waits for:** Step 1

**Spawn:**
```
Read your definition in .claude/actionflows/actions/analyze/agent.md

IMPORTANT: You are a spawned subagent executor.
Do NOT read .claude/actionflows/ORCHESTRATOR.md — it is not for you.
Do NOT delegate work or compile chains. Execute your agent.md directly.

Project Context:
- Name: ActionFlows Dashboard
- Backend: Express 4.18 + TypeScript + ws 8.14.2 + ioredis 5.3 + Zod
- Frontend: React 18.2 + Vite 5 + Electron 28 + ReactFlow + Monaco + xterm
- Shared: Branded types, discriminated unions, ES modules
- Paths: backend=packages/backend/, frontend=packages/app/, shared=packages/shared/
- Ports: backend=3001, vite=5173

Input:
- aspect: "severity"
- scope: {health-report.md path from Step 1}
- gateTraces: {gate trace data from Step 1}
```

**Gate:** Step 2 completes when severity-classification.md is generated with:
- Critical violations (10+ occurrences OR 3+ gates affected)
- High violations (5-9 occurrences OR 2+ gates)
- Medium violations (2-4 occurrences)
- Low violations (1 occurrence)

**Branching Logic:**
- IF critical → proceed to Step 3 (quarantine)
- IF high/medium → skip to Step 4 (diagnosis)
- IF low only → skip to Step 5 (auto-triage or direct to healing)

---

### Phase 3: ISOLATE (conditional — critical violations only)

**Action:** `.claude/actionflows/actions/isolate/`
**Model:** haiku
**Waits for:** Step 2
**Trigger:** Only if Step 2 found critical violations

**Spawn:**
```
Read your definition in .claude/actionflows/actions/isolate/agent.md

IMPORTANT: You are a spawned subagent executor.
Do NOT read .claude/actionflows/ORCHESTRATOR.md — it is not for you.
Do NOT delegate work or compile chains. Execute your agent.md directly.

Project Context:
- Name: ActionFlows Dashboard
- Backend: Express 4.18 + TypeScript + ws 8.14.2 + ioredis 5.3 + Zod
- Frontend: React 18.2 + Vite 5 + Electron 28 + ReactFlow + Monaco + xterm
- Shared: Branded types, discriminated unions, ES modules
- Paths: backend=packages/backend/, frontend=packages/app/, shared=packages/shared/
- Ports: backend=3001, vite=5173

Input:
- subcommand: "quarantine"
- targetType: {determined from violation pattern — "chain" | "session" | "format"}
- targetId: {ChainId | SessionId | FormatName from Step 2}
- reason: {violation pattern description from Step 2}
- autoRelease: false
```

**Gate:** Step 3 completes when quarantine record is written to Redis (`quarantine:*`) and WebSocket event is broadcast.

**Side Effect:** Dashboard displays quarantine badge, blocks new steps for quarantined targets.

---

### Phase 4: DIAGNOSE

**Action:** `.claude/actionflows/actions/diagnose/`
**Model:** sonnet
**Waits for:** Step 2 (or Step 3 if quarantine executed)

**Spawn:**
```
Read your definition in .claude/actionflows/actions/diagnose/agent.md

IMPORTANT: You are a spawned subagent executor.
Do NOT read .claude/actionflows/ORCHESTRATOR.md — it is not for you.
Do NOT delegate work or compile chains. Execute your agent.md directly.

Project Context:
- Name: ActionFlows Dashboard
- Backend: Express 4.18 + TypeScript + ws 8.14.2 + ioredis 5.3 + Zod
- Frontend: React 18.2 + Vite 5 + Electron 28 + ReactFlow + Monaco + xterm
- Shared: Branded types, discriminated unions, ES modules
- Paths: backend=packages/backend/, frontend=packages/app/, shared=packages/shared/
- Ports: backend=3001, vite=5173

Input:
- gateId: {from Step 1}
- violationPattern: {from Step 2}
- gateTraces: {from Step 1}
- severityLevel: {from Step 2 — "critical" | "high" | "medium" | "low"}
```

**Gate:** Step 4 completes when root-cause-analysis.md is generated with:
- Root cause classification (parser_bug | orchestrator_drift | contract_outdated | agent_drift | template_mismatch)
- Suggested healing flow (harmony-audit-and-fix/ | contract-drift-fix/ | parser-update/)
- Confidence level (high | medium | low)
- Evidence (file paths, code snippets, violation frequency)
- Prevention suggestion (pattern to add to LEARNINGS.md)

---

### Phase 5: HEAL ⚠️ HUMAN APPROVAL GATE

**Trigger:** Orchestrator presents healing chain compiled from Step 4 suggestion

**Healing Flow Selection (based on root cause from Step 4):**

| Root Cause | Suggested Flow | Chain Steps |
|------------|---------------|-------------|
| `parser_bug` | `parser-update/` | analyze/parser-gap → code/backend/parser → test/parser → review → commit |
| `orchestrator_drift` | `harmony-audit-and-fix/` | code/update-orchestrator-instruction → review/harmony-fix → commit |
| `contract_outdated` | `contract-drift-fix/` | analyze/contract-code-drift → code/update-contract → review → commit |
| `agent_drift` | `harmony-audit-and-fix/` | code/update-agent-instruction → review/harmony-fix → commit |
| `template_mismatch` | `cleanup/` | analyze → plan → code → review → commit |

**Human Decision Point:**
- **Approve** → Execute healing chain (proceed to healing flow execution)
- **Reject** → Exit protocol, log rejection reason
- **Investigate** → Pause protocol, spawn exploratory analyze/ agent

**Auto-Triage Exception (Quick Triage Rule 0):**
- IF `severityLevel == "low"` AND `confidence == "high"` AND fix is trivial (typo, path correction)
- THEN orchestrator applies fix directly (Quick Triage)
- SKIP human approval gate for low-severity trivial fixes

**Orchestrator Compilation Logic:**
After Step 4 completes, orchestrator:
1. Reads root-cause-analysis.md
2. Maps root cause to healing flow (table above)
3. Compiles healing chain steps
4. Presents chain to human in Format 1.1 (Chain Compilation Table)
5. Waits for human approval

---

### Phase 6: VERIFY

**Action:** `.claude/actionflows/actions/verify-healing/`
**Model:** sonnet
**Waits for:** Step 5 (healing chain execution completes)

**Spawn:**
```
Read your definition in .claude/actionflows/actions/verify-healing/agent.md

IMPORTANT: You are a spawned subagent executor.
Do NOT read .claude/actionflows/ORCHESTRATOR.md — it is not for you.
Do NOT delegate work or compile chains. Execute your agent.md directly.

Project Context:
- Name: ActionFlows Dashboard
- Backend: Express 4.18 + TypeScript + ws 8.14.2 + ioredis 5.3 + Zod
- Frontend: React 18.2 + Vite 5 + Electron 28 + ReactFlow + Monaco + xterm
- Shared: Branded types, discriminated unions, ES modules
- Paths: backend=packages/backend/, frontend=packages/app/, shared=packages/shared/
- Ports: backend=3001, vite=5173

Input:
- healingChainId: {ChainId from Step 5}
- targetGateId: {from Step 1 — gate that was failing}
- expectedScore: 95
- preHealingScore: {health score from Step 1}
```

**Gate:** Step 6 completes when healing-verification.md is generated with:
- Health score before/after
- Violations before/after
- Pass/fail verdict (SUCCESS | PARTIAL | FAILED | ESCALATE)
- Remaining violations (if any)

**Verification Logic:**
1. Call `GET /api/harmony/health` (post-healing)
2. Compare to pre-healing snapshot (from Step 1)
3. Check target gate violations count
4. Verdict:
   - **SUCCESS:** Health score ≥95 AND target gate violations = 0
   - **PARTIAL:** Health improved but violations remain → suggest re-run
   - **FAILED:** Health score unchanged → investigate healing chain
   - **ESCALATE:** Health score degraded → rollback + human investigation (future: auto-revert)

---

### Phase 7: LEARN

**Action:** `.claude/actionflows/actions/analyze/`
**Model:** sonnet
**Waits for:** Step 6

**Spawn:**
```
Read your definition in .claude/actionflows/actions/analyze/agent.md

IMPORTANT: You are a spawned subagent executor.
Do NOT read .claude/actionflows/ORCHESTRATOR.md — it is not for you.
Do NOT delegate work or compile chains. Execute your agent.md directly.

Project Context:
- Name: ActionFlows Dashboard
- Backend: Express 4.18 + TypeScript + ws 8.14.2 + ioredis 5.3 + Zod
- Frontend: React 18.2 + Vite 5 + Electron 28 + ReactFlow + Monaco + xterm
- Shared: Branded types, discriminated unions, ES modules
- Paths: backend=packages/backend/, frontend=packages/app/, shared=packages/shared/
- Ports: backend=3001, vite=5173

Input:
- aspect: "learning"
- scope: {violation patterns from Step 1, root cause from Step 4, healing outcome from Step 6}
```

**Gate:** Step 7 completes when learning-suggestions.md is generated with:
- Suggested LEARNINGS.md entry (ID, date, issue, root cause, fix)
- Prevention pattern (e.g., "Add pre-commit hook for X")
- Related existing learnings (cross-reference)

**Orchestrator Action:**
1. Present suggested learning to human
2. Human approves → orchestrator appends to LEARNINGS.md (registry edit, permitted direct action)
3. Human rejects → log rejection, exit protocol

---

## Dependencies

```
Step 1 (DETECT) → Step 2 (CLASSIFY) → Step 3 (ISOLATE — if critical)
                                     ↓
                            Step 4 (DIAGNOSE)
                                     ↓
                          [HUMAN APPROVAL GATE]
                                     ↓
                            Step 5 (HEAL — healing flow execution)
                                     ↓
                            Step 6 (VERIFY)
                                     ↓
                            Step 7 (LEARN)
```

**Parallel groups:** None — all steps are sequential with conditional branching

**Conditional Skip Logic:**
- Step 3 (ISOLATE) — Only executes if Step 2 finds critical violations
- Step 5 (HEAL) — Skips human gate if low-severity + high-confidence + trivial fix

---

## Execution Patterns

### Pattern 1: Full Protocol (Critical Violations)
**Trigger:** mode="full" OR critical violations detected
```
detect → classify → isolate → diagnose → [HUMAN GATE] → heal → verify → learn
  (1)      (2)        (3)        (4)         [APPROVE]      (5)     (6)     (7)
```

### Pattern 2: Standard Protocol (High/Medium Violations)
**Trigger:** mode="standard" OR high/medium violations (no critical)
```
detect → classify → diagnose → [HUMAN GATE] → heal → verify → learn
  (1)      (2)        (4)         [APPROVE]      (5)     (6)     (7)
```

### Pattern 3: Quick Triage (Low Severity, High Confidence)
**Trigger:** mode="quick" OR low-severity + high-confidence + trivial fix
```
detect → classify → diagnose → auto-triage → verify → learn
  (1)      (2)        (4)      (quick fix)    (6)     (7)
```
**Note:** Auto-triage bypasses human gate (orchestrator applies fix directly per Quick Triage Rule 0)

### Pattern 4: Investigation Mode (Human Chooses "Investigate")
**Trigger:** Human rejects healing chain at Step 5 gate, chooses "Investigate"
```
detect → classify → diagnose → [HUMAN GATE] → analyze (exploratory) → [EXIT]
  (1)      (2)        (4)      [INVESTIGATE]
```

---

## Chains With

- ← None (entry point flow — human-initiated)
- → `harmony-audit-and-fix/`, `contract-drift-fix/`, `parser-update/`, `cleanup/` (healing flows triggered at Step 5)

**Flow Relationship:** health-protocol/ is a **meta-flow** that routes to healing flows based on diagnosis. It doesn't chain TO other flows — it SPAWNS them conditionally.

---

## Example

```
Human: "run health protocol"

Orchestrator Routes to: health-protocol/, mode=standard (default)

Step 1: analyze/health-survey generates health-report.md
  Result: Health score 72, 12 Gate 4 violations (missing 'status' column)

Step 2: analyze/severity-classification generates severity-classification.md
  Result: 12 violations = HIGH severity (no critical threshold reached)
  Branch: Skip Step 3 (no quarantine), proceed to Step 4

Step 4: diagnose/root-cause generates root-cause-analysis.md
  Result: Root cause = orchestrator_drift, confidence = high
  Suggested flow: harmony-audit-and-fix/
  Evidence: ORCHESTRATOR.md last modified 2026-02-08, violations started 2026-02-10 14:32

Step 5: HUMAN GATE
  Orchestrator presents healing chain:
  | # | Action | Model | Inputs | Waits For | Status |
  |---|--------|-------|--------|-----------|--------|
  | 1 | code/update-orchestrator-instruction | haiku | file=ORCHESTRATOR.md, fix=add status column to Format 1.1 example | None | PENDING |
  | 2 | review/harmony-fix | sonnet | scope=ORCHESTRATOR.md | Step 1 | PENDING |
  | 3 | commit/ | haiku | summary=fix: add status column to chain compilation format | Step 2 | PENDING |

  Human approves → Healing chain executes

Step 6: verify-healing/ generates healing-verification.md
  Result: Health before=72, after=98, verdict=SUCCESS
  Gate 4 violations: before=12, after=0

Step 7: analyze/learning generates learning-suggestions.md
  Suggested LEARNINGS.md entry:
  L012 | 2026-02-13 | Format 1.1 missing status column in orchestrator output
       | Root cause: ORCHESTRATOR.md example didn't show status column explicitly
       | Fix: Added explicit note to Format 1.1 example in ORCHESTRATOR.md

  Human approves → Orchestrator appends to LEARNINGS.md

Output: Health protocol complete. Health restored to 98. Learning L012 logged.
```

---

## Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| Step 1 timeout (Redis unavailable) | Verify Redis is running, check backend connection string |
| Step 3 quarantine fails (WebSocket not connected) | Ensure frontend is connected to backend WebSocket |
| Step 4 diagnose low confidence | Increase gate trace history (extend timeRange from 7d to 30d) |
| Step 5 healing chain fails | Check logs in healing flow execution, may need manual intervention |
| Step 6 verdict = ESCALATE | Health degraded after healing — investigate healing chain, consider rollback |

---

## Notes

- **Detection Frequency:** Backend proactive drift monitor runs every 5 minutes (future enhancement)
- **Quarantine TTL:** 7 days (or manual release via `isolate/release` subcommand)
- **Health Score Calculation:** See `packages/backend/src/services/healthScoreCalculator.ts`
- **Gate Trace Storage:** Redis keys `gate:trace:{gateId}:{timestamp}` with 7-day TTL
- **Learning Approval:** Gate 13 (learning surface protocol) always requires human approval
- **Rollback Mechanism:** Future enhancement — auto-revert if verdict = ESCALATE
