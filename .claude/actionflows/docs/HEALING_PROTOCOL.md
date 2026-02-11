# The Healing Initiation Protocol

**The framework for human-initiated, system-wide health remediation.**

> **Living Universe Context:** In a living system, drift between expectations and reality is inevitable. The healing protocol is the immune system's emergency response—not automatic, but human-guided, ensuring the universe evolves safely while maintaining human sovereignty.

**Last Updated:** 2026-02-11

---

## Table of Contents

1. [Overview](#overview)
2. [The Healing Triangle](#the-healing-triangle)
3. [The Healing Initiation Flow](#the-healing-initiation-flow)
4. [Sovereignty Preservation Principles](#sovereignty-preservation-principles)
5. [Examples of Healing Scenarios](#examples-of-healing-scenarios)
6. [Exception Cases](#exception-cases)
7. [Integration with Other Systems](#integration-with-other-systems)

---

## Overview

### What Is the Healing Protocol?

The healing protocol is a **human-initiated remediation system** that activates when the ActionFlows framework detects that its outputs have drifted from their documented specifications. It's not automatic remediation—it's **collaborative problem-solving** where the backend detects violations, the frontend presents them to the human, and the human decides whether to heal.

**Key Characteristic:** Backend detects, human decides, orchestrator routes, agents execute, system learns.

### Why Human-Initiated (Not Automatic)?

Automatic healing seems efficient, but it creates three serious problems:

1. **Loss of Sovereignty** — The system changes itself without human approval. This violates the core principle that humans maintain full control over the physics (code), philosophy (rules), and will (intent).

2. **Ambiguous Root Causes** — When violations occur, the cause might be:
   - Parser bug (fix backend logic)
   - Orchestrator drift (update instruction in ORCHESTRATOR.md)
   - Contract staleness (update CONTRACT.md)
   - New deliberate evolution (do nothing, document the change)

   A human can evaluate context and choose the right healing strategy. An automatic system might fix the wrong thing.

3. **Cascading Fixes** — Automatic healing could trigger a chain reaction:
   - Fix A creates a side effect
   - Auto-fix addresses the side effect
   - The second fix creates another issue
   - Loop repeats until system is corrupted

   Human judgment acts as a circuit breaker.

### How It Fits Into the 7-Layer Living System

The healing protocol operates across multiple layers of the living system:

| Layer | Role in Healing |
|-------|-----------------|
| **1. Routing (Orchestrator Brain)** | Routes human healing requests to appropriate flows |
| **2. Agents (Hands)** | Execute healing steps (code changes, contract updates) |
| **3. Memory (Accumulated Wisdom)** | LEARNINGS.md captures root causes and fixes |
| **4. Contract (Framework Law)** | Defines what "healing" means (format compliance) |
| **5. Physics (Code)** | Changes are applied to backend parsers, orchestrator rules, or contract specs |
| **6. Harmony (Immune System)** | Detects violations and broadcasts health degradation |
| **7. Will (Human Intent)** | Decides whether violation is worth fixing |

---

## The Healing Triangle

The healing protocol involves three active participants:

```
┌─────────────┐
│   HUMAN     │ ← Will (decides to heal)
└──────┬──────┘
       │
       │ "Fix Gate 4 violations"
       │ (human-initiated instruction)
       │
       ▼
┌─────────────────────────────────────┐
│      ORCHESTRATOR                   │ ← Brain (routes to healing flow)
│  (reads FLOWS.md, compiles chain)   │
└──────┬──────────────────────────────┘
       │
       │ Chain: [analyze → code → review → commit]
       │
       ▼
┌──────────────────────────────────────┐
│    BACKEND + AGENTS                  │ ← Hands (execute healing)
│  (detect violations, analyze roots,   │
│   apply fixes, verify resolution)    │
└──────┬───────────────────────────────┘
       │
       │ Healing complete
       │ Health score rises
       │ Violations cleared
       │
       ▼
┌──────────────────────────────────────┐
│    HARMONY (Health Monitor)           │ ← Immune System (verifies healing)
│  (re-validates, broadcasts improvement) │
└──────────────────────────────────────┘
```

### Backend Role: Detect, Analyze, Present, Recommend

The backend runs **passively**—it monitors without acting:

- **Detection:** `harmonyDetector.ts` runs on every orchestrator output at gate checkpoints
- **Pattern Analysis:** Tracks which gates have violations, how frequently, which formats break
- **Threshold Monitoring:** When violations exceed 3 in 24h, flags as "critical"
- **Drift Pattern Analysis:** Groups similar violations (e.g., "3 missing field violations" vs "2 type mismatches")
- **Presentation:** Broadcasts `HarmonyViolationEvent` via WebSocket to frontend with:
  - Gate ID where violation occurred
  - Violation type (format mismatch, missing field, type error)
  - Pattern analysis (first occurrence? recurring?)
  - Severity level (warning, degraded, critical)
  - Recommended healing flow (if applicable)

**Critical Constraint:** Backend never auto-heals without human will.

### Human Role: Decide Whether to Heal

The human evaluates the situation and makes a conscious choice:

- **Observes** the health score in the Harmony workbench
- **Reads** the violation details and pattern analysis
- **Evaluates** the severity and business impact:
  - Is this a real problem or expected evolution?
  - What's the root cause most likely to be?
  - Is now the right time to fix, or should we defer?
- **Decides:**
  - "Yes, fix this now" → Clicks "Fix Now" button or sends instruction
  - "No, this is acceptable" → Ignores and continues working
  - "Investigate first" → Reads logs and gate traces before deciding

### Orchestrator Role: Route to Healing Flow

Once the human initiates healing, the orchestrator takes over:

- **Receives** human instruction: "Fix Gate 4 violations" or "harmony-audit-and-fix/"
- **Routes** to appropriate flow by reading `FLOWS.md`:
  - Format drift → `harmony-audit-and-fix/` (maintenance context)
  - Contract mismatch → `contract-drift-fix/` (settings context)
  - Parser bug → `bug-triage/` (maintenance context)
- **Compiles** healing chain:
  - Step 1: `analyze/harmony-violation` — Investigate root cause
  - Step 2: `code/*` — Apply fix (parser, contract, or orchestrator instruction)
  - Step 3: `review/harmony-fix` — Validate fix resolves violations
  - Step 4: `commit/` — Record the healing in git history
- **Presents** chain for human approval before execution
- **Executes** chain autonomously once approved

---

## The Healing Initiation Flow

The complete healing cycle from detection to verification. **All steps are described with accompanying examples.**

### Phase 1: Backend Detection (Automatic)

**Trigger:** Every orchestrator output passes through gate checkpoints

**What Happens:**

1. **Orchestrator outputs format at gate** (e.g., Chain Compilation Table at Gate 4)
2. **Backend parser runs** in `harmonyDetector.ts`
3. **Parser validates** format against CONTRACT.md specifications
4. **If violation detected:**
   - Record violation details (gate, format, error)
   - Add to violation buffer
5. **If pattern emerges** (3+ violations in 24h):
   - Aggregate violation logs
   - Analyze for common root cause
   - Flag as "critical" if impact is high

**Example (Format Drift):**
```
Orchestrator outputs: ## Chain: Implement feature
| # | Action | Model | Status |
|---|--------|-------|--------|
| 1 | analyze | Opus | pending |

Backend detects: Table has only 4 columns, but CONTRACT.md § Format 1.1 requires 5 columns (missing 'Waits For')
Violation recorded: Gate 4, format mismatch, missing column
```

**Example (Recurring Pattern):**
```
Day 1: Gate 4 violation (missing column)
Day 2: Gate 4 violation (missing column in different chain)
Day 3: Gate 4 violation (missing column again)
→ Pattern detected: "Missing column in 3/3 recent outputs"
→ Flagged: Critical drift pattern
```

**Example (Drift Pattern Analysis):**
```
Violations in last 24h:
- 5 violations: "missing 'Waits For' column"
- 3 violations: "misaligned Status values"
- 2 violations: "extra 'Notes' column"

Analysis: Parser expects old CONTRACT version. Updated format added column but old parser doesn't know about it.
Recommendation: Update parser to handle new CONTRACT version.
```

### Phase 2: Frontend Presentation (Automatic)

**Trigger:** Backend broadcasts `HarmonyViolationEvent`

**What Happens:**

1. **WebSocket event reaches frontend** with violation data
2. **Harmony workbench updates** in real-time:
   - Health score calculation updates (e.g., 100 → 95 → 87)
   - Violation log appends new entries
   - Gate checkpoint marks violation on cosmic map
3. **Visual signals activate:**
   - **Health score drop** — Visible in Harmony panel (87/100)
   - **Severity badge** — Warning (yellow) / Degraded (amber) / Critical (red)
   - **Terrain flicker** — The void between stars flickers (Harmony is degraded)
   - **Recommendation shown** — "Fix with harmony-audit-and-fix/ flow"
4. **User-facing buttons appear:**
   - "Fix Now" — Initiates healing immediately
   - "Investigate" — Opens gate logs and traces
   - "Ignore" — Dismisses this violation (but doesn't fix it)

**Example:**

```
Harmony Health Score: 87/100
[Status: DEGRADED]

Violation: Format drift detected at Gate 4
Type: Missing 'Waits For' column in Chain Table
Severity: Critical (3+ occurrences in 24h)
First seen: 2026-02-11 18:30 UTC
Latest: 2026-02-11 21:15 UTC
Pattern: Recurring in all recent orchestrator outputs

Recommendation: harmony-audit-and-fix/ flow
- Analyze root cause (parser? contract? orchestrator?)
- Apply targeted fix
- Verify resolution

[Fix Now] [Investigate] [Ignore]
```

### Phase 3: Human Decision (Human-Initiated)

**Trigger:** Human clicks "Fix Now" or sends manual instruction

**What Happens:**

1. **Human evaluates the situation:**
   - Does the health score matter right now?
   - Is the violation a real problem or expected evolution?
   - What's the likely root cause? (Backend drift? Parser bug? Contract evolved?)
   - Is this the right time to fix?

2. **Human makes decision:**
   - **"Fix Now"** → Clicks button or types: "Fix Gate 4 violations"
   - **"Ignore for now"** → Dismisses and continues working (system operates degraded)
   - **"Investigate"** → Reads gate logs, reviews traces, then decides

3. **Human sends instruction to orchestrator:**
   - Implicit (click "Fix Now" button) → Orchestrator infers: "harmony-audit-and-fix/"
   - Explicit (type instruction) → "Fix Gate 4 violations using harmony-audit-and-fix/"

**Example Decision Flow:**

```
Human sees: Health score 87/100, Critical violation at Gate 4
Human thinks:
  - This is recurring (3 in 24h) → Not just a typo
  - Pattern is consistent (always missing same column) → Root cause is systematic
  - Impact is high (violates contract) → Worth fixing
  - I'm about to work on something else → Good time to heal first

Human clicks: [Fix Now]
```

### Phase 4: Orchestrator Routing (Automatic)

**Trigger:** Human instruction received (implicit or explicit)

**What Happens:**

1. **Orchestrator receives instruction:**
   - Button click: `"harmony_healing_initiated"` event with gate ID
   - Text instruction: `"Fix Gate 4 violations"`

2. **Orchestrator consults FLOWS.md:**
   - Violation type: Format drift → Healing flow: `harmony-audit-and-fix/`
   - Violation type: Contract mismatch → Healing flow: `contract-drift-fix/`
   - Violation type: Parser bug → Healing flow: `bug-triage/`

3. **Orchestrator compiles healing chain:**
   - Context: `maintenance`
   - Flow: `harmony-audit-and-fix/`
   - Steps:
     * Step 1: `analyze/harmony-violation` — Investigate root cause with gate data
     * Step 2: `code/fix-parser` (or `code/update-contract` or `code/update-orchestrator`)
     * Step 3: `review/harmony-fix` — Validate fix
     * Step 4: `commit/` — Record healing in git

4. **Orchestrator presents chain for approval:**
   ```
   ## Chain: Healing Gate 4 Violations

   Violation: Format drift (missing 'Waits For' column)
   Detected: 3 occurrences in 24h at Gate 4
   Health Impact: Score degraded to 87/100

   Healing Strategy: Analyze root cause → Apply fix → Verify → Commit

   | # | Action | Model | Status |
   |---|--------|-------|--------|
   | 1 | analyze/harmony-violation | Opus | pending |
   | 2 | code/fix-parser | Opus | pending |
   | 3 | review/harmony-fix | Opus | pending |
   | 4 | commit/ | Haiku | pending |

   [Approve] [Modify] [Cancel]
   ```

5. **Human approves:**
   - Evaluates proposed chain
   - Decides if strategy is correct
   - Clicks [Approve] to proceed

### Phase 5: Healing Execution (Automatic)

**Trigger:** Human approves healing chain

**What Happens:**

1. **Step 1: Analyze Root Cause**
   - Agent: `analyze/harmony-violation`
   - Input: Gate ID, violation pattern, traces from last 24h
   - Analysis: Is root cause in backend parser? Orchestrator instruction? Contract?
   - Output: Root cause analysis report

2. **Step 2: Apply Targeted Fix**
   - Agent: `code/fix-parser` (or `code/update-contract` or `code/update-orchestrator`)
   - Input: Root cause analysis from Step 1
   - Action:
     * If parser bug: Update parser logic in `packages/backend/src/services/harmonyDetector.ts` or parser module
     * If contract outdated: Update `CONTRACT.md` to match new format reality
     * If orchestrator drift: Update instruction in `ORCHESTRATOR.md`
   - Output: Code changes ready for review

3. **Step 3: Validate Fix**
   - Agent: `review/harmony-fix`
   - Input: Changes from Step 2
   - Validation: Will this fix resolve the violations?
   - Output: Review report with findings and approval

4. **Step 4: Record Healing**
   - Agent: `commit/`
   - Input: All changes from Step 2
   - Commit Message:
     ```
     fix: resolve Gate 4 format drift (missing 'Waits For' column)

     Updated parser to handle optional 'Waits For' column in Chain Compilation tables.
     Resolves 3 recurring violations detected over 24h period.

     - [harmonyDetector.ts] Added optional column handling
     - [CONTRACT.md] Documented optional field
     - [LEARNINGS.md] Recorded pattern and fix

     Healing initiated by human on 2026-02-11.
     Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
     ```
   - Output: Changes committed to git history

**Example (Actual Fix):**

```
PROBLEM: Parser expects 'Waits For' column but orchestrator sometimes omits it

Step 1 Analysis:
- Violation: Missing column in 3/3 recent Chain Compilation tables
- Root cause: Parser validates column presence strictly, but new orchestrator instruction sometimes omits the column for simple chains
- Fix strategy: Make column optional in parser

Step 2 Fix:
// Before:
if (!row.waitsFor) throw new Error("Missing 'Waits For' column");

// After:
const waitsFor = row.waitsFor || "-";

Step 3 Review:
- Change is minimal and backward-compatible
- Handles the missing column gracefully
- Violations should be cleared
- No side effects

Step 4 Commit:
fix: make 'Waits For' column optional in chain tables
```

### Phase 6: Verification (Automatic)

**Trigger:** Healing execution completes

**What Happens:**

1. **Backend re-validates at gate checkpoints:**
   - Next orchestrator output passes through parser
   - Parser validates format (with updated rules)
   - Validates successfully → Violation cleared
   - If still fails → Healing didn't work (trigger new violation event)

2. **Confirms violations resolved:**
   - Gate 4 violation count resets to 0
   - Pattern analysis shows "issue resolved"
   - Health score recalculates upward (87 → 95 → 100)

3. **Broadcasts `HarmonyHealthUpdatedEvent`:**
   - Health score increased from 87 to 100
   - Violations cleared at Gate 4
   - Terrain no longer flickers
   - Healing success noted in logs

4. **Frontend displays success:**
   - Health score shows: 100/100 (healthy)
   - Violation entries archived
   - Terrain stabilizes (void stops flickering)
   - User can proceed with confidence

**Example Verification:**

```
BEFORE HEALING:
Health Score: 87/100
Gate 4 Violations: 3 (recurring)
Status: Degraded
Terrain: Flickering

HEALING EXECUTED:
Step 1: Root cause identified → Parser too strict
Step 2: Parser updated → Column now optional
Step 3: Review approved → Change is safe
Step 4: Committed to git

AFTER HEALING:
Next orchestrator output arrives...
Parser processes: Successfully parses (column is handled as optional)
Health recalculates: 100/100
Gate 4 Violations: 0
Status: Healthy
Terrain: Stable

Broadcast: HarmonyHealthUpdatedEvent {
  previousScore: 87,
  currentScore: 100,
  clearedViolations: ["Gate 4"],
  learningRecorded: true
}
```

---

## Sovereignty Preservation Principles

The healing protocol is **not** about efficient automation. It's about maintaining human sovereignty over the system while allowing it to evolve safely.

### Principle 1: Full Sovereignty Over All Layers

Users have complete control over five layers:

| Layer | What the Healing Protocol Respects |
|-------|-------------------------------------|
| **Physics (Code)** | Human must approve code changes before healing executes |
| **Health (Harmony)** | Human decides which health violations are worth fixing |
| **Brain (Orchestrator)** | Human can modify ORCHESTRATOR.md rules at any time |
| **Instruction (Flows)** | Human can modify healing flows or add new ones |
| **Will (Intent)** | Human initiates healing—orchestrator never auto-heals |

**Core Rule:** Humans remain the decision-makers. Backend detects, humans decide.

### Principle 2: Healing Has Tradeoffs

Not every violation is worth fixing. Humans must evaluate context:

**Scenario A: Evolution vs Regression**
```
Violation: Orchestrator now outputs 5 fields instead of 4

Human evaluation:
- Is this an improvement? (Yes—new field provides value)
- Is it breaking? (No—new field is optional)
- Should we fix parser to accept new format? (Yes)
- Should we auto-heal? (No—human should approve new CONTRACT first)

Healing decision: Update CONTRACT.md to document new field, then update parser
```

**Scenario B: Root Cause Ambiguity**
```
Violation: Parser fails on unexpected field 'priority' in output

Root cause could be:
1. Orchestrator drift—new instruction added new field intentionally
2. Contract stale—field exists but CONTRACT.md doesn't document it
3. Backend bug—field validation is too strict

Human evaluation:
- Is this intentional evolution or a mistake?
- What's the real root cause?

A human can read logs and understand context. Auto-healing might pick wrong fix.
```

**Scenario C: Resource Allocation**
```
Violation: Gate 7 has 1 violation, health score 99/100

Human evaluation:
- Is this worth fixing right now?
- Should we defer healing until violations accumulate?
- Or is even 1 violation unacceptable in our workflow?

Auto-healing would trigger immediately. Human can decide if now is the right time.
```

### Principle 3: Circuit Breaker

Without human approval, healing can cascade:

```
Auto-heal Scenario:
1. Violation detected: Missing field
   → Auto-fix: Make field optional
2. Side effect: Optional field causes type errors
   → Auto-fix: Add type guard
3. Side effect: Type guard breaks other code
   → Auto-fix: Refactor that code
4. Loop: System auto-heals itself into chaos

Human-Approved Healing Scenario:
1. Violation detected: Missing field
2. Human reviews root cause
3. Human approves: "Make field optional"
4. Change applied, human can VERIFY it worked
5. If new problem emerges, human makes NEW decision

Human acts as circuit breaker preventing cascading failures.
```

---

## Examples of Healing Scenarios

Real-world scenarios that trigger the healing protocol.

### Scenario A: Format Drift at Gate 4

**The Problem:**

Gate 4 (Chain Compilation Table checkpoint) validates the format of orchestrator chain tables. The format is defined in CONTRACT.md § Format 1.1.

```
Expected format (CONTRACT.md § Format 1.1):
| # | Action | Model | Inputs | Waits For | Status |

Actual output from orchestrator:
| # | Action | Model | Status |
```

**Detection (Phase 1):**
```
Timestamp: 2026-02-11 18:30 UTC
Event: Orchestrator outputs chain compilation table
Parser: Validates against CONTRACT § Format 1.1
Result: VIOLATION — Missing columns: 'Inputs', 'Waits For'

Violation recorded: Gate 4, format mismatch, 4 columns instead of 6
```

Violations accumulate over next few hours:
- 2026-02-11 18:30 UTC: Violation 1
- 2026-02-11 19:15 UTC: Violation 2
- 2026-02-11 21:45 UTC: Violation 3 (threshold reached)

**Presentation (Phase 2):**
```
Harmony Health Score: 87/100
[Status: DEGRADED]

Violation: Format drift at Gate 4
Type: Missing columns in Chain Compilation Table
Occurrences: 3 in last 3h (recurring pattern)
Severity: Critical

Details:
- Expected: 6 columns (# | Action | Model | Inputs | Waits For | Status)
- Received: 4 columns (# | Action | Model | Status)
- Missing: 'Inputs', 'Waits For'

Root cause hypothesis:
- Orchestrator instruction changed?
- CONTRACT.md was updated?
- Parser is outdated?

Recommendation: harmony-audit-and-fix/ flow
[Fix Now] [Investigate] [Ignore]
```

**Human Decision (Phase 3):**

Human observes degraded health, reads the violation details, and thinks:
- "This is recurring, not a one-time typo"
- "The pattern is consistent—always same columns missing"
- "Something structural changed"
- "I should fix this before continuing work"

Human clicks: **[Fix Now]**

**Orchestrator Routing (Phase 4):**

```
Human instruction: "Fix Gate 4 violations"
Orchestrator consults FLOWS.md → maintenance/harmony-audit-and-fix/

Chain compilation:
| # | Action | Model | Inputs | Waits For | Status |
|---|--------|-------|--------|-----------|--------|
| 1 | analyze/harmony-violation | Opus | Gate 4 data, violation pattern | — | pending |
| 2 | code/fix-parser | Opus | Analysis from step 1 | step 1 | pending |
| 3 | review/harmony-fix | Opus | Code from step 2 | step 2 | pending |
| 4 | commit/ | Haiku | All changes | step 3 | pending |

Human approves chain.
```

**Healing Execution (Phase 5):**

```
Step 1: Analyze Violation
Agent reads gate logs, examines recent orchestrator outputs, checks CONTRACT.md
Finding: Orchestrator instruction now outputs simple 4-column format for simple chains
(This appears intentional, not a bug)
Recommendation: Update parser to accept both old (6-column) and new (4-column) formats

Step 2: Fix Parser
File: packages/backend/src/services/harmonyDetector.ts
Change: Add logic to handle both 4-column and 6-column formats

Step 3: Review Fix
Agent verifies: Fix allows both formats, maintains backward compatibility
Approval: PASS—fix resolves violations without breaking existing behavior

Step 4: Commit
Message: "fix: support both 4-column and 6-column chain table formats at Gate 4"
```

**Verification (Phase 6):**

```
Next orchestrator output arrives with 4-column format
Parser processes: Successfully validates (both formats now accepted)
Health recalculates: 100/100
Gate 4 violations: Cleared
Terrain: Stable

Success broadcast: HarmonyHealthUpdatedEvent
Health increased from 87 to 100
Violations cleared: Gate 4
```

---

### Scenario B: Contract Drift

**The Problem:**

FORMAT.md documents the structure of orchestrator outputs. But the orchestrator has evolved its output to include a new field that CONTRACT.md doesn't mention.

Real example from our system:
```
CONTRACT.md documents (Format 5.1 — Review Report):
- Verdict: PASS/FAIL/REVIEW
- Score: Numeric
- Summary: Text
- Findings: List

But orchestrator outputs (review/ agent):
- Verdict: PASS/FAIL/REVIEW
- Score: Numeric
- Summary: Text
- Findings: List
- RiskFactors: NEW FIELD (not documented)

Parser sees unknown field → Violation: Unknown field 'RiskFactors'
```

**Detection (Phase 1):**
```
Timestamp: 2026-02-10 20:15 UTC
Event: Agent produces review report with 'RiskFactors' field
Parser: Validates against CONTRACT.md § Format 5.1
Result: VIOLATION — Unknown field 'RiskFactors'

Message: "Field 'RiskFactors' not defined in CONTRACT.md Format 5.1"
```

**Presentation (Phase 2):**
```
Harmony Health Score: 92/100
[Status: DEGRADED]

Violation: Contract drift detected
Type: Unknown field in agent output
Field: 'RiskFactors' in review reports
Severity: Warning

Details:
- Agent produced field not in CONTRACT.md
- Appears intentional (consistently present)
- Agent is adding value (risk assessment)

Root cause hypothesis:
- Agent evolved beyond documented contract
- CONTRACT.md needs update

Recommendation: contract-drift-fix/ flow
[Fix Now] [Investigate] [Ignore]
```

**Human Decision (Phase 3):**

Human evaluates:
- "RiskFactors field is useful—provides additional value"
- "This is clearly intentional evolution, not a bug"
- "We should document this in CONTRACT.md"

Human instruction: **"Sync CONTRACT.md with reality"**

**Orchestrator Routing (Phase 4):**

```
Human instruction: "Sync CONTRACT.md with reality"
Orchestrator consults FLOWS.md → settings/contract-drift-fix/

Chain:
| # | Action | Model | Inputs | Waits For | Status |
|---|--------|-------|--------|-----------|--------|
| 1 | analyze/contract-code-drift | Opus | Comparison of CONTRACT vs actual | — | pending |
| 2 | code/update-contract | Opus | Drift analysis from step 1 | step 1 | pending |
| 3 | review/contract-update | Opus | CONTRACT changes | step 2 | pending |
| 4 | commit/ | Haiku | All changes | step 3 | pending |

Human approves chain.
```

**Healing Execution (Phase 5):**

```
Step 1: Analyze Contract Drift
Agent compares CONTRACT.md Format 5.1 with recent agent outputs
Findings:
- New field 'RiskFactors' consistently present
- Field contains assessment data (high/medium/low risk)
- Not documented in contract

Recommendation: Add 'RiskFactors' to Format 5.1 definition

Step 2: Update CONTRACT.md
File: .claude/actionflows/CONTRACT.md
Change: Add 'RiskFactors' field definition to Format 5.1

BEFORE:
## Format 5.1 — Review Report
- **Verdict:** One of PASS, FAIL, REVIEW
- **Score:** Numeric (0-100)
- **Summary:** Text
- **Findings:** List

AFTER:
## Format 5.1 — Review Report
- **Verdict:** One of PASS, FAIL, REVIEW
- **Score:** Numeric (0-100)
- **Summary:** Text
- **Findings:** List
- **RiskFactors:** (Optional) Risk assessment: HIGH, MEDIUM, LOW

Step 3: Review Changes
Agent verifies: CONTRACT.md now matches actual agent outputs
Approval: PASS—contract now documents the evolved format

Step 4: Commit
Message: "docs: add RiskFactors field to CONTRACT Format 5.1"
```

**Verification (Phase 6):**

```
Next agent output with RiskFactors field arrives
Parser processes: Successfully validates (field now documented in contract)
Health recalculates: 100/100
Contract violations: Cleared
Terrain: Stable

Success broadcast: HarmonyHealthUpdatedEvent
Health increased from 92 to 100
```

---

### Scenario C: WebSocket Type Mismatch (Real Example)

**The Problem:**

Backend emits a WebSocket event with one name, but frontend expects a different name.

Real scenario from our codebase:
```
Backend emits: "chain:gate_checkpoint"
Frontend listens: "chain:gate_updated"
Result: Frontend never receives updates (event names don't match)
```

**Detection (Phase 1):**
```
Timestamp: 2026-02-11 14:20 UTC
Event: Backend emits "chain:gate_checkpoint" event
Frontend: No listener registered for this event name
Parser: Detects orphaned event (emitted but not consumed)

Violation recorded: Gate 8, event type mismatch
Severity: Critical (real-time updates broken)
```

**Presentation (Phase 2):**
```
Harmony Health Score: 45/100
[Status: CRITICAL]

Violation: Event type mismatch
Type: Backend emits event, frontend doesn't receive
Event: "chain:gate_checkpoint" vs expected "chain:gate_updated"
Severity: Critical (breaks real-time updates)

Impact:
- Real-time chain progress not visible to user
- Frontend stuck showing stale chain state
- User can't see agent execution progress

Recommendation: triage-fix/ (1-line fix required)
[Fix Now] [Investigate] [Ignore]
```

**Human Decision (Phase 3):**

Human sees CRITICAL health score and broken real-time updates.

Human clicks: **[Fix Now]** (no hesitation—this breaks core functionality)

**Orchestrator Routing (Phase 4):**

```
Violation type: Type mismatch (critical)
Orchestrator routes to maintenance/bug-triage/ (triaged as critical fix)

Chain:
| # | Action | Model |
|---|--------|-------|
| 1 | analyze/event-type-mismatch | Opus | pending |
| 2 | code/fix-event-name | Opus | pending |
| 3 | review/event-fix | Opus | pending |
| 4 | commit/ | Haiku | pending |

Human approves.
```

**Healing Execution (Phase 5):**

```
Step 1: Analyze
Agent identifies: Backend emits "chain:gate_checkpoint", frontend listens to "chain:gate_updated"
Quick fix: Rename backend event to match frontend listener

Step 2: Fix
File: packages/backend/src/ws/eventEmitter.ts
Change:
- eventEmitter.emit("chain:gate_checkpoint", { ... })
+ eventEmitter.emit("chain:gate_updated", { ... })

Step 3: Review
Change: 1 line (rename event constant)
Impact: Frontend will now receive real-time updates
Approval: PASS—obvious fix, trivial change

Step 4: Commit
Message: "fix: align WebSocket event name with frontend listener"
```

**Verification (Phase 6):**

```
Next chain execution:
Backend emits "chain:gate_updated"
Frontend listener receives event
Real-time updates flow correctly
User sees progress in real time

Health recalculates: 100/100
Critical violation cleared
Terrain: Stable (from bright red to calm green)
```

---

## Exception Cases

Not all violations trigger healing. There are cases where healing doesn't apply.

### T0 (Zero Trust) Input Rejection

**What it is:**

When user provides malformed input (bad JSON, invalid command syntax), the backend rejects it at the T0 (Zero Trust) validation layer before it reaches the orchestrator.

**Example:**
```
User sends: { invalid json ]
Backend validation: Rejects immediately
Error message: "Invalid JSON syntax"
Status: Input validation failure, not a violation

Is healing needed? NO.
Why? Input never reached orchestrator. This is normal input validation.
User learns to provide better input.
```

**Key Distinction:**

Healing only applies to violations of **orchestrator-to-backend** contracts. Input validation is **user-to-backend** and is not a healing issue.

### Automatic Threshold Notifications

**What it is:**

The backend CAN automatically notify the human that health has degraded. But notification ≠ healing.

**Example:**
```
Backend: "Health degraded to 87/100. Recommend harmony-audit-and-fix/"
Frontend: Displays notification in Harmony panel
Status: Human is informed
Next step: Human decides whether to heal

System did NOT auto-heal. System notified and waited for human decision.
```

**Key Distinction:**

- **Notification:** Automatic, informational, human decides what to do
- **Healing:** Always human-initiated, never automatic

**Cascade Prevention:**

Backend notifies → Human reads → Human decides:
- "Fix now" → Healing executes
- "Ignore" → System continues degraded (human choice)
- "Investigate" → Human reads logs before deciding

This prevents the cascade where auto-healing triggers auto-repairs triggers auto-fixes.

---

## Integration with Other Systems

The healing protocol connects to several other framework components.

### Trust Levels (from ORCHESTRATOR_OBSERVABILITY.md)

The healing protocol respects the trust model:

| Trust Level | Application | Healing Role |
|-------------|-------------|--------------|
| **T0 — Zero Trust** | User input | Backend rejects malformed input (not healing issue) |
| **T1 — Validate Always** | Agent outputs | Healing validates agent output formats (Format 5.1/5.2) |
| **T2 — High Trust + Monitor** | Orchestrator outputs | Healing detects drift, human approves fixes |
| **T3 — Complete Trust** | Claude CLI results | Assume correct by design (no healing needed) |

### Gate Checkpoint Catalog

Healing violations are detected at gate checkpoints. Reference the complete catalog in `ORCHESTRATOR_OBSERVABILITY.md` § 3:

| Gate | Name | Monitors | Healing Flow |
|------|------|----------|--------------|
| **Gate 4** | Chain Compilation | Format 1.1 (chain tables) | harmony-audit-and-fix/ |
| **Gate 7** | Execution Start | Format 1.2 (spawn announcements) | harmony-audit-and-fix/ |
| **Gate 8** | Step Completion | Format 2.1 (completion announcements) | harmony-audit-and-fix/ |
| **Gate 11** | Chain Status/Completion | Format 2.2 & 3.1 (updates/summary) | harmony-audit-and-fix/ |
| **Gate 13** | Learning Surface | Format 6.1 (learnings) | harmony-audit-and-fix/ |

### Healing Flows Registry (from FLOWS.md)

Healing flows are registered in FLOWS.md § Healing Flows Philosophy and detailed in § Detailed Flow Specifications:

1. **harmony-audit-and-fix/** (maintenance)
   - Trigger: Format drift, contract violations
   - Chain: analyze → code → review → commit
   - Example: Gate 4 missing column

2. **contract-drift-fix/** (settings)
   - Trigger: CONTRACT.md outdated
   - Chain: analyze → code/update-contract → review → commit
   - Example: New field not documented

3. **bug-triage/** (maintenance)
   - Trigger: Clear bugs (type mismatches, logic errors)
   - Chain: analyze → code → test → review
   - Example: Event name mismatch

### Memory System (LEARNINGS.md)

After each healing cycle, the orchestrator records learnings:

```markdown
| Date | Issue | Root Cause | Suggestion |
|------|-------|-----------|-----------|
| 2026-02-11 | Gate 4 format drift | Orchestrator evolved table format without updating contract | Always update CONTRACT.md when changing output format |
| 2026-02-11 | Event name mismatch | Backend renamed event but frontend listener wasn't updated | Add regression test for event name consistency |
```

These learnings inform future orchestrator decisions and help prevent the same violations from recurring.

### Harmony Workbench

The Harmony workbench displays:
- **Gate logs** — All data flows and violations
- **Health score** — Overall system health
- **Violation browser** — Detailed view of each violation
- **Healing history** — Past healing cycles and their outcomes
- **Compliance dashboards** — Contract compliance status per gate

Access Harmony by clicking empty space on the cosmic map, or by clicking "Investigate" on a violation notification.

---

## Summary

The healing protocol is ActionFlows' immune system. It activates when outputs drift from specifications, but—critically—it waits for human approval before healing.

**The Flow:**
1. Backend detects violations automatically
2. Frontend presents them with recommendations
3. Human decides whether healing is needed
4. Orchestrator routes to appropriate healing flow
5. Agents execute fixes with human oversight
6. System verifies healing worked
7. LEARNINGS.md captures the pattern to prevent recurrence

**Core Principle:** Backend detects. Human decides. Orchestrator routes. Agents execute. System learns.

**Sovereignty Preserved:** At every step, humans maintain control over the physics (code changes), health decisions (which violations to fix), and will (when to heal).

This is collaborative problem-solving, not automated remediation. The system is alive because humans guide its healing.

---

**Related Documentation:**
- **[HARMONY.md](./HARMONY.md)** — Deep dive on the harmony system
- **[SYSTEM.md](./SYSTEM.md)** — The 7-layer living system architecture
- **[ORCHESTRATOR.md](../ORCHESTRATOR.md)** — Brain routing and decision rules
- **[FLOWS.md](../FLOWS.md)** — Healing flows registry (harmony-audit-and-fix/, contract-drift-fix/)
- **[CONTRACT.md](../CONTRACT.md)** — Formal specifications of all 17 output formats
- **[ORCHESTRATOR_OBSERVABILITY.md](../ORCHESTRATOR_OBSERVABILITY.md)** — Complete interaction catalog and trust levels

