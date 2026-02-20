# ActionFlows Orchestrator Output Contract

**Version:** 1.0
**Last Updated:** 2026-02-09
**TypeScript Definitions:** `packages/shared/src/contract/`

**⚠️ ENFORCEMENT:** Adding or modifying formats in this contract MUST follow the evolution process in `docs/architecture/CONTRACT_EVOLUTION.md`. Formats without paired parser + frontend implementations create spec-without-implementation drift. See ORCHESTRATOR.md § CONTRACT_EVOLUTION.md Process Validation.

---

## Implementation Status Definitions

A format progresses through these states. **A format is COMPLETE only when all three layers are functional.**

| State | Spec | Parser | Frontend | Score |
|-------|------|--------|----------|-------|
| 📝 Planned | ✓ | ❌ | ❌ | 0% |
| 🚧 In Progress (Parser) | ✓ | ✓ | ❌ | 33% |
| 🚧 In Progress (Frontend) | ✓ | ✓ | 🚧 Created but not wired | 66% |
| ✅ Complete | ✓ | ✓ | ✓ Wired & tested | 100% |

**Terminology:**
- **Specified** — Format exists in this document with examples
- **Parsed** — Parser implemented, Zod schema exists, exports integrated
- **Consumed** — Frontend component exists, wired to dashboard, WebSocket connected
- **Complete = Specified + Parsed + Consumed** (all three required)

When agents or orchestrator refer to "implementing Format X", the target is 100% (Complete) unless explicitly scoped otherwise. Partial completions (33%/66%) MUST be surfaced as learnings to trigger follow-up chains.

---

## Cross-References

**Philosophy & System:** See `.claude/actionflows/docs/living/HARMONY.md`
**Evolution Process:** See `docs/architecture/CONTRACT_EVOLUTION.md`
**Code API Reference:** See `packages/shared/src/contract/README.md`
**Parser Priority:** See `packages/app/docs/PARSER_PRIORITY.md`
**Gate Checkpoints & Verification:** See `docs/architecture/GATE_LOGGING.md`
**Orchestrator Observability:** See `.claude/actionflows/ORCHESTRATOR_OBSERVABILITY.md`

**Golden Rule:** If the dashboard PARSES it → contract-defined (sacred). If the dashboard READS it → not contract-defined (evolve freely).

---

## Alignment Verification Gate

**CRITICAL:** Before committing any contract change, verify 4-layer alignment for ALL modified fields.

This section implements L021 (Contract Drift Prevention) - the root cause fix that makes drift impossible to commit.

### Mandatory Pre-Commit Checklist

For each field you modified in any contract format:

- [ ] **Layer 1 (Spec):** Field documented in this file (CONTRACT.md) with correct type/nullability
- [ ] **Layer 2 (Type):** Field exists in TypeScript type definition (`packages/shared/src/contract/types/`)
- [ ] **Layer 3 (Schema):** Field exists in Zod schema (`packages/shared/src/contract/validation/schemas.ts`)
- [ ] **Layer 4 (Parser):** Field extracted by parser (`packages/shared/src/contract/parsers/`)
- [ ] **Layer 5 (Pattern, if applicable):** Regex pattern exists (`packages/shared/src/contract/patterns/`)
- [ ] **Automated validation:** Ran `pnpm run contract:validate` and ALL formats passed (exit code 0)
- [ ] **Pre-commit hook:** Registered hook will block commit if drift detected

### Validation Command

```bash
# Run from repository root
pnpm run contract:validate

# Or from packages/shared
cd packages/shared
pnpm run contract:validate
```

**Exit codes:**
- `0` — All formats aligned, commit allowed
- `1` — Drift detected, commit blocked
- `2` — Validation script error

### Failure Modes Prevented

The 4-layer verification prevents these common drift patterns:

- ❌ **Field in spec but not in type** → Caught by validation + pre-commit
- ❌ **Field in type but parser doesn't extract it** → Caught by validation + pre-commit
- ❌ **Field name differs between layers** → Caught by review checklist + validation
- ❌ **Zod schema uses wrong nullability** (`.optional()` vs `.nullable()`) → Caught by validation
- ❌ **Field added to schema but missing from type** → Caught by validation + type-check

### Defense in Depth

The drift prevention system has 4 enforcement layers:

1. **Manual Review Checklist** (`.claude/actionflows/actions/review/agent.md`)
   - Field-level verification matrix for contract changes
   - Human catches architectural issues and design decisions

2. **Automated Validation Script** (`packages/shared/scripts/validate-contract.ts`)
   - Field-level tracing across spec → type → schema → parser
   - Detects missing fields, type mismatches, nullability errors

3. **Pre-Commit Hook** (`packages/hooks/src/pre-commit-contract.ts`)
   - Blocks commits when contract files modified with drift
   - Runs validation automatically, no manual step required

4. **CI Validation** (future enhancement)
   - Final safety net in CI pipeline
   - Prevents drift from reaching main branch

**Principle:** If human review misses it, automation catches it. If pre-commit hook bypassed, CI catches it.

### See Also

- **L021 Learning:** `.claude/actionflows/LEARNINGS.md` § L021 — Why field-level verification is required
- **Evolution Process:** `docs/architecture/CONTRACT_EVOLUTION.md` — How to evolve contracts safely
- **Review Methodology:** `.claude/actionflows/actions/review/agent.md` § Contract Change Verification

---

## Gate Checkpoint References

**Backend Verification Architecture:**

All orchestrator outputs defined in this contract are validated at backend gate checkpoints. Formats with P-priority values indicate which gates perform validation:

| Format | Gate | Validation | Trace Storage |
|--------|------|-----------|---|
| **1.1** Chain Compilation Table | Gate 4 | Parse table structure, validate step counts | Harmony (7d TTL) |
| **1.2** Chain Execution Start | Gate 7 | Parse step metadata, validate action paths | Harmony (7d TTL) |
| **2.1** Step Completion Announcement | Gate 6 | Parse completion, check 6-trigger signals | Harmony (7d TTL) |
| **3.2** Learning Surface Presentation | Gate 13 | Validate Issue/Root/Suggestion structure | Harmony (7d TTL) |
| **4.1** Registry Update | Gate 12 | Verify INDEX.md entry format | Harmony (7d TTL) |

**Validation Architecture:**
- **Orchestrator Role:** Produce contract-compliant outputs naturally (zero burden)
- **Backend Role:** Parse outputs at gate checkpoints, validate format compliance
- **Harmony Role:** Store gate traces for auditability, detect violations (→ healing)
- **Frontend Role:** Display gate traces and validation results in dashboard

**Graceful Degradation:** If backend cannot parse an orchestrator output, it logs a violation but does NOT block execution. This creates a maintenance signal (visible in Harmony workbench) rather than a cascade failure.

See `docs/architecture/GATE_LOGGING.md` § Zero-Burden Architecture for complete explanation.

---

## Orchestrator Output Formats

These formats are produced by the orchestrator. Examples are in ORCHESTRATOR.md.

### Category 1: Chain Management

#### Format 1.1: Chain Compilation Table (P0)
**TypeScript:** `ChainCompilationParsed`
**Parser:** `parseChainCompilation(text: string)`
**Pattern:** `/^## Chain: (.+)$/m`
**Example:** ORCHESTRATOR.md § Response Format Standard → Chain Compilation

**Required Fields:**
- Brief Title (string)
- Request (one-line string)
- Source (enum: flow name | "Composed from: ..." | "Meta-task")
- Table columns: #, Action, Model, Key Inputs, Waits For, Status
  - Status enum: "pending", "running", "completed", "failed", "skipped"
- Execution (enum: Sequential | Parallel: [...] | Single step)
- Numbered list: "What each step does"

---

#### Format 1.2: Chain Execution Start (P3)
**TypeScript:** `ExecutionStartParsed`
**Parser:** `parseExecutionStart(text: string)`
**Pattern:** `/^Spawning Step (\d+): (.+) \((.+)\)$/m`
**Example:** ORCHESTRATOR.md § Execution Start

**Required Fields:**
- Step number (integer)
- Action path (string, e.g., "code/backend/auth")
- Model (string, enum: "opus", "sonnet", "haiku")
- Timestamp (optional, number)

---

#### Format 1.3: Chain Status Update (P4)
**TypeScript:** `ChainStatusUpdateParsed`
**Parser:** `parseChainStatusUpdate(text: string)`
**Pattern:** `/^## Chain: (.+) -- Updated$/m`
**Example:** ORCHESTRATOR.md § Chain Status Update

**Required Fields:**
- Brief Title (string)
- Changes (description string, free-form text explaining what changed)
- Steps (array of step objects with fields: stepNumber, action, model, keyInputs, waitsFor, status)
- Updated table with columns: #, Action, Model, Key Inputs, Waits For, Status

---

#### Format 1.4: Execution Complete Summary (P4)
**TypeScript:** `ExecutionCompleteParsed`
**Parser:** `parseExecutionComplete(text: string)`
**Pattern:** `/^## Done: (.+)$/m`
**Example:** ORCHESTRATOR.md § Execution Complete

**Required Fields:**
- Brief Title (string)
- Steps (array of completed step summaries with fields: stepNumber, action, status, result)
- Table columns: #, Action, Status, Result
- Logs (path to log folder)
- Learnings (summary string, free-form text with key discoveries)
- Optional metrics: totalSteps, completedSteps, failedSteps (integers)

---

### Category 2: Step Lifecycle

#### Format 2.1: Step Completion Announcement (P0)
**TypeScript:** `StepCompletionParsed`
**Parser:** `parseStepCompletion(text: string)`
**Pattern:** `/^>> Step (\d+) complete:/m`
**Example:** ORCHESTRATOR.md § Step Completion

**Required Fields:**
- >> (prefix marker)
- Step number (integer)
- Action path (string with trailing slash)
- One-line result (string)
- Next step number or "Done"

---

#### Format 2.2: Dual Output (Action + Second Opinion) (P2)
**TypeScript:** `DualOutputParsed`
**Parser:** `parseDualOutput(text: string)`
**Pattern:** `/^### Dual Output: (.+) \+ Second Opinion$/m`
**Example:** ORCHESTRATOR.md § Dual Output

**Required Fields:**
- Action name (string)
- Original verdict/score (from action)
- Second opinion summary (findings, missed issues, disagreements)
- Full report paths (original and critique)

---

#### Format 2.3: Second Opinion Skip (P4)
**TypeScript:** `SecondOpinionSkipParsed`
**Parser:** `parseSecondOpinionSkip(text: string)`
**Pattern:** `/^>> Step (\d+) complete: second-opinion\/ -- SKIPPED/m`
**Example:** ORCHESTRATOR.md § Second Opinion Skip

**Required Fields:**
- Step number (integer)
- Reason (string, in parentheses)

---

### Category 3: Human Interaction

#### Format 3.1: Human Gate Presentation (P5)
**TypeScript:** `HumanGateParsed`
**Parser:** `parseHumanGate(text: string)`
**Pattern:** `/### Step (\d+): HUMAN GATE/m`
**Example:** ORCHESTRATOR.md § Human Gate Presentation

**Required Fields:**
- Step number (integer)
- Free-form content (not strictly enforced)

**Note:** Human gates do NOT have standardized content format. Dashboard displays as read-only markdown.

---

#### Format 3.2: Learning Surface Presentation (P2)
**TypeScript:** `LearningSurfaceParsed`
**Parser:** `parseLearningSurface(text: string)`
**Pattern:** `/^## Agent Learning$/m`
**Example:** ORCHESTRATOR.md § Learning Surface

**Required Fields:**
- From (action/ and model)
- Issue (string)
- Root cause (string)
- Suggested fix (string)

---

#### Format 3.3: Session-Start Protocol Acknowledgment (P4)
**TypeScript:** `SessionStartProtocolParsed`
**Parser:** `parseSessionStartProtocol(text: string)`
**Pattern:** `/^## Session Started$/m`
**Example:** ORCHESTRATOR.md § Session Start

**Required Fields:**
- Loaded configuration summary (project, contexts, flows, actions, past executions)

**Note:** Currently NOT produced by orchestrator (internal read).

---

### Category 4: Registry & Metadata

#### Format 4.1: Registry Update (P2)
**TypeScript:** `RegistryUpdateParsed`
**Parser:** `parseRegistryUpdate(text: string)`
**Pattern:** `/^## Registry Update: (.+)$/m`
**Example:** ORCHESTRATOR.md § Registry Update

**Required Fields:**
- Brief Title (string)
- File (enum: INDEX.md | FLOWS.md | ACTIONS.md | LEARNINGS.md, or any registry file path — extensible)
- Line (operation: added/removed/updated + the line content)

---

#### Format 4.2: INDEX.md Entry (P3)
**TypeScript:** `IndexEntryParsed`
**Parser:** `parseIndexEntry(text: string)`
**Pattern:** `/^\| (\d{4}-\d{2}-\d{2}) \|/m`
**Example:** ORCHESTRATOR.md § INDEX.md Entry

**Required Fields:**
- Date (YYYY-MM-DD)
- Description (brief work title)
- Pattern (chain signature, e.g., "code×8 → review → commit")
- Outcome (status + metrics + commit hash)
- Success (boolean, nullable) — Whether the chain execution succeeded. Derived from outcome text.
- Metrics (string, nullable) — Key metrics extracted from outcome (e.g., "18 files, 92%").

---

#### Format 4.3: LEARNINGS.md Entry (P4)
**TypeScript:** `LearningEntryParsed`
**Parser:** `parseLearningEntry(text: string)`
**Pattern:** `/^### (.+)$/m` (followed by `#### {Issue Title}`)
**Example:** ORCHESTRATOR.md § LEARNINGS.md Entry

**Required Fields:**
- Action Type (string, e.g., "code/", "review/")
- Issue Title (string)
- Context (when this happens)
- Problem (what goes wrong)
- Root Cause (why it fails)
- Solution (how to prevent)
- Date (YYYY-MM-DD)
- Source (action/ in chain description)

---

### Category 6: Error & Status

#### Format 6.1: Error Announcement (P1)
**TypeScript:** `ErrorAnnouncementParsed`
**Parser:** `parseErrorAnnouncement(text: string)`
**Pattern:** `/^## Error: (.+)$/m`
**Example:** ORCHESTRATOR.md § Error Announcement

**Required Fields:**
- Error title (string)
- Step (step number and action/)
- Message (error message)
- Context (what was being attempted)
- Stack trace or details (optional)
- Recovery options (list: Retry, Skip, Cancel)

---

#### Format 6.2: Department Routing Announcement (P5)
**TypeScript:** `DepartmentRoutingParsed`
**Parser:** `parseDepartmentRouting(text: string)`
**Pattern:** `/^## Routing: (.+)$/m`
**Example:** ORCHESTRATOR.md § Context Routing

**Required Fields:**
- Request brief (string)
- Context (enum: work | maintenance | explore | review | settings | pm | archive | harmony | editor, or custom workbench IDs — extensible)
- Flow (flow name or "Composed from actions" or "No match")
- Actions (list of actions)
- Explanation (why this routing)
- Confidence (number 0.0-1.0, nullable) — Routing confidence score. Higher values indicate stronger keyword match.
- Disambiguated (boolean) — Whether human disambiguation was required. True if multiple contexts scored equally.

**Note:** Currently NOT produced by orchestrator (internal routing). Legacy name "Department" will be renamed to "Context" in future contract version.

---

## Agent Output Formats

These formats are produced by agents. Full specifications included because agents need them.

### Category 5: Action Outputs

#### Format 5.1: Review Report Structure (P1)
**Producer:** review/ action
**TypeScript:** `ReviewReportParsed`
**Parser:** `parseReviewReport(text: string)`
**Referenced By:** agent-standards § Contract Compliance, review/agent.md

**Required Structure:**
```markdown
# Review Report: {scope}

## Verdict: {APPROVED | NEEDS_CHANGES}
## Score: {X}%

## Summary
{2-3 sentence overview}

## Findings
| # | File | Line | Severity | Description | Suggestion |
|---|------|------|----------|-------------|------------|

## Fixes Applied (if mode = review-and-fix)
| File | Fix |

## Flags for Human
| Issue | Why Human Needed |
```

**Field Descriptions:**
- **Verdict:** Enum (`APPROVED` | `NEEDS_CHANGES`) — May include optional qualifiers in parentheses (e.g., "APPROVED (with recommendations)")
- **Score:** Integer 0-100 — Quality percentage
- **Summary:** 2-3 sentences — High-level overview of findings
- **Findings:** Table with 6 columns (can be empty if no findings)
  - **#:** Finding number (integer)
  - **File:** Relative path from project root
  - **Line:** Line number (integer). Single line number only — ranges are not supported. (e.g., 42)
  - **Severity:** Enum (`critical` | `high` | `medium` | `low`) — Lowercase
  - **Description:** What the issue is
  - **Suggestion:** How to fix it
- **Fixes Applied:** Table (only if mode = review-and-fix)
  - **File:** Relative path
  - **Fix:** What was changed
- **Flags for Human:** Table (only if issues need human judgment)
  - **Issue:** What needs human decision
  - **Why Human Needed:** Reason for escalation

**Dashboard Usage:**
- `ReviewReportViewer` component displays full report
- `FindingsTable` component renders findings with severity badges
- `VerdictBanner` component shows APPROVED/NEEDS_CHANGES with score

**Validation:** Harmony detector validates Verdict enum, Score range (0-100), required sections present

---

#### Format 5.2: Analysis Report Structure (P3)
**Producer:** analyze/ action
**TypeScript:** `AnalysisReportParsed`
**Parser:** `parseAnalysisReport(text: string)`
**Referenced By:** agent-standards § Contract Compliance, analyze/agent.md

**Required Structure:**
```markdown
# {Analysis Title}

**Aspect:** {what aspect is being analyzed}
**Scope:** {what is being analyzed}
**Date:** {YYYY-MM-DD}
**Agent:** analyze/

---

## 1. {First Analysis Section}
{Content}

## 2. {Second Analysis Section}
{Content}

[... additional numbered sections ...]

---

## Recommendations
{Actionable next steps}
```

**Field Descriptions:**
- **Title:** Markdown H1 heading
- **Aspect:** What aspect is being analyzed (e.g., "Contract duplication", "Security vulnerabilities") — Extensible, not a strict enum
- **Scope:** What is being analyzed (e.g., "CONTRACT.md", "Authentication system")
- **Date:** Analysis date (YYYY-MM-DD format)
- **Agent:** Action type that produced the report (e.g., "analyze/", "review/", "diagnose/", or any action/ type)
- **Numbered Sections:** At least 1 section, numbered with ##
- **Recommendations:** Actionable next steps section

**Dashboard Usage:**
- `AnalysisReportViewer` component displays full report
- `MetricsDisplay` component extracts and visualizes metrics (if present)

---

#### Format 5.3: Brainstorm Session Transcript (P5)
**Producer:** brainstorm/ action
**TypeScript:** `BrainstormTranscriptParsed`
**Parser:** `parseBrainstormTranscript(text: string)`
**Referenced By:** agent-standards § Contract Compliance, brainstorm/agent.md

**Note:** This format is **recommended but not strictly enforced**. Dashboard displays brainstorm transcripts as read-only markdown.

**Recommended Structure:**
```markdown
# Brainstorm: {Idea Title}

**Classification:** {category}
**Date:** {YYYY-MM-DD}

## Initial Context
{What prompted this brainstorm}

## Transcript
{Question-answer style conversation}

## Key Insights
{Bullet points of main discoveries}

## Issues & Risks
{Potential problems identified}

## Next Steps
{Actionable follow-up tasks}

## Open Questions
{Unresolved questions}

## Metadata
- Duration: {minutes}
- Participants: Human + Agent
```

**Dashboard Usage:**
- `BrainstormViewer` component displays as read-only markdown
- No parsing required (free-form content)

---

#### Format 5.4: Diagnosis Report (P4)
**Producer:** diagnose/ action
**TypeScript:** `DiagnosisReportParsed`
**Parser:** `parseDiagnosisReport(text: string)`
**Referenced By:** agent-standards § Contract Compliance, diagnose/agent.md

**Required Structure:**
```markdown
# Root Cause Analysis

**Gate:** {gateId}
**Pattern:** {violationPattern}
**Severity:** {severityLevel}
**Confidence:** {high | medium | low}
**Auto-Triage Candidate:** {yes | no}

---

## Evidence

### Timing Analysis
- **Violations started:** {timestamp from gate traces}
- **Violation frequency:** {count in 24h, 7d}
- **Affected gates:** {list of gates from traces}

### Code History
- **CONTRACT.md last modified:** {timestamp} ({before | after} violations started)
- **ORCHESTRATOR.md last modified:** {timestamp} ({before | after} violations started)
- **Relevant parser last modified:** {timestamp} ({before | after} violations started)
- **Agent {name} last modified:** {timestamp} (if agent-specific)

### Pattern Analysis
{Detailed description of what the violation looks like, with examples from gate traces}

---

## Root Cause

**Classification:** {parser_bug | orchestrator_drift | contract_outdated | agent_drift | template_mismatch}

**Explanation:**
{2-3 sentence explanation of why this is the root cause, referencing evidence above}

**Alternative Causes Considered:**
- {Alternative 1}: {Why ruled out}
- {Alternative 2}: {Why ruled out}

---

## Healing Recommendation

**Flow:** {healing-flow-name}/
**Confidence:** {high | medium | low}

**Steps:**
1. {Step 1 action} — {what it does}
2. {Step 2 action} — {what it does}
3. ...

**Target Files:**
- {file-path-1} — {what needs to change}
- {file-path-2} — {what needs to change}

**If Auto-Triage Candidate:**
Trivial fix detected: {description of simple fix}
Orchestrator can apply directly without human gate.

---

## Prevention Suggestion

**Learning Entry:**
```
LXXX | {date} | {issue-title}
     | Root cause: {brief root cause}
     | Fix: {what was done to heal}
     | Prevention: {pattern to avoid in future}
```

**Immediate Prevention:**
{Specific action to prevent recurrence}

**Long-Term Prevention:**
{Systemic improvement}

---

**Diagnosis Complete**
```

**Field Descriptions:**
- **Gate:** String — Gate ID that failed validation (e.g., "Gate 4", "Gate 9")
- **Pattern:** String — Violation pattern description (e.g., "missing status column")
- **Severity:** Enum (`critical` | `high` | `medium` | `low`) — From classification step
- **Confidence:** Enum (`high` | `medium` | `low`) — Confidence in root cause diagnosis
- **Auto-Triage Candidate:** Enum (`yes` | `no`) — Whether fix is trivial enough for auto-triage
- **Timing Analysis:** Section with violation timestamps and frequency data
- **Code History:** Section with git log timestamps for relevant files
- **Pattern Analysis:** Free-form description of violation pattern
- **Classification:** Enum (`parser_bug` | `orchestrator_drift` | `contract_outdated` | `agent_drift` | `template_mismatch`)
- **Explanation:** 2-3 sentences explaining root cause
- **Alternative Causes:** List of ruled-out alternatives
- **Healing Recommendation:** Structured recommendation with flow name, steps, target files
- **Prevention Suggestion:** Immediate and long-term prevention patterns

**Dashboard Usage:**
- `DiagnosisReportViewer` component displays full diagnosis
- `HealingRecommendationPanel` component shows suggested flow and target files
- `ConfidenceBadge` component shows diagnosis confidence level

**Validation:** Harmony detector validates Classification enum, Confidence enum, Severity enum, required sections present

**Implementation Status:** Spec: done | Parser: pending | Frontend: pending

---

#### Format 5.5: Healing Verification Report (P3)
**Producer:** verify-healing/ action
**TypeScript:** `HealingVerificationParsed`
**Parser:** `parseHealingVerification(text: string)`
**Referenced By:** agent-standards § Contract Compliance, verify-healing/agent.md

**Required Structure:**
```markdown
# Healing Verification Report

**Healing Chain:** {healingChainId}
**Target Gate:** {targetGateId}
**Expected Score:** {expectedScore}
**Executed At:** {ISO timestamp}

---

## Health Score Comparison

| Metric | Before Healing | After Healing | Delta | Status |
|--------|----------------|---------------|-------|--------|
| **Overall Score** | {preHealingScore} | {postHealingScore} | {delta} | {status} |
| **Target Gate Violations** | {preViolationCount} | {postViolationCount} | {delta} | {status} |

---

## Detailed Gate Analysis

### Target Gate: {targetGateId}

**Before Healing:**
- Violations: {count}
- Pass Rate: {percentage}%
- Pattern: {violation pattern description}

**After Healing:**
- Violations: {count}
- Pass Rate: {percentage}%
- Pattern: {violation pattern description OR "No violations detected"}

**Change:** {status}

---

### Other Gates

| Gate | Violations Before | Violations After | Change |
|------|-------------------|------------------|--------|
| Gate 2 | {count} | {count} | {status} |
| ... | ... | ... | ... |

**New Violations Introduced:** {yes/no — if yes, list gates}

---

## Verdict

**Verdict:** {SUCCESS | PARTIAL | FAILED | ESCALATE}

**Reasoning:**
{2-3 sentence explanation of verdict based on thresholds and evidence}

**Evidence:**
- Health score {met | did not meet} expected threshold
- Target gate violations {cleared | reduced | unchanged | increased}
- Other gates {stable | improved | degraded}

---

## Recommendations

### Immediate Action
{Recommendation based on verdict}

### Next Steps
{Action-specific next steps}

---

## Remaining Violations

**Total Remaining:** {count}

**By Gate:**
- {gateId}: {count} violations
  - Pattern: {description}

**Suggested Next Action:** {action}

---

**Verification Complete**

**Status:** {SUCCESS | PARTIAL | FAILED | ESCALATE}
**Health Delta:** {delta} points
**Protocol Next Step:** {LEARN | RE-RUN | INVESTIGATE | ROLLBACK}
```

**Field Descriptions:**
- **Healing Chain:** String — ChainId of healing chain that executed
- **Target Gate:** String — Gate that was failing (e.g., "Gate 4")
- **Expected Score:** Number — Minimum acceptable health score (default: 95)
- **Executed At:** String — ISO timestamp
- **Health Score Comparison:** Table with before/after metrics
  - **Overall Score:** Before, after, delta, status
  - **Target Gate Violations:** Before, after, delta, status
- **Detailed Gate Analysis:** Section with target gate details
  - **Before Healing:** Violations count, pass rate, pattern
  - **After Healing:** Violations count, pass rate, pattern
  - **Change:** Status indicator
- **Other Gates:** Table showing all gates with before/after violation counts
- **Verdict:** Enum (`SUCCESS` | `PARTIAL` | `FAILED` | `ESCALATE`)
- **Reasoning:** 2-3 sentence explanation of verdict
- **Evidence:** Bullet points supporting verdict
- **Recommendations:** Immediate action and next steps
- **Remaining Violations:** Count and breakdown by gate (if PARTIAL or FAILED)
- **Protocol Next Step:** Enum (`LEARN` | `RE-RUN` | `INVESTIGATE` | `ROLLBACK`)

**Dashboard Usage:**
- `HealingVerificationViewer` component displays full report
- `VerdictBanner` component shows SUCCESS/PARTIAL/FAILED/ESCALATE with color coding
- `HealthScoreChart` component visualizes before/after comparison
- `GateComparisonTable` component shows detailed gate-by-gate analysis

**Validation:** Harmony detector validates Verdict enum, health score range (0-100), required sections present

**Implementation Status:** Spec: done | Parser: pending | Frontend: pending

---

#### Format 5.6: Quarantine Operations Report (P4)
**Producer:** isolate/ action
**TypeScript:** `QuarantineOperationsReportParsed`
**Parser:** `parseQuarantineOperations(text: string)`
**Referenced By:** agent-standards § Contract Compliance, isolate/agent.md

**Note:** This format is for the human-readable markdown report. Quarantine data is stored in Redis as JSON (not parsed from orchestrator output).

**Required Structure (quarantine subcommand):**
```markdown
# Quarantine Record

**Subcommand:** quarantine
**Target Type:** {targetType}
**Target ID:** {targetId}
**Reason:** {reason}
**Quarantined At:** {ISO timestamp}
**Auto-Release:** {yes | no}
**TTL:** {7 days | 24 hours}

---

## Redis Record

**Key:** `quarantine:{targetType}:{targetId}`

**Payload:**
```json
{
  "targetType": "{targetType}",
  "targetId": "{targetId}",
  "reason": "{reason}",
  "quarantinedAt": "{ISO timestamp}",
  "autoRelease": {true | false},
  "ttl": {604800 | 86400},
  "suggestedFlow": "{flow-name}/"
}
```

---

## WebSocket Event

**Type:** QuarantineEvent
**Action:** add

**Payload:**
```json
{
  "type": "QuarantineEvent",
  "action": "add",
  "targetType": "{targetType}",
  "targetId": "{targetId}",
  "reason": "{reason}",
  "timestamp": "{ISO timestamp}"
}
```

---

## Impact

- **Execution Blocked:** New steps for this {targetType} will be blocked until released
- **Dashboard Badge:** Quarantine icon displayed in frontend
- **Suggested Action:** Run {suggestedFlow} to heal, then release quarantine

---

**Quarantine Active**

**Status:** {status description}
**Next Step:** {next action}
```

**Required Structure (release subcommand):**
```markdown
# Quarantine Release

**Subcommand:** release
**Target Type:** {targetType}
**Target ID:** {targetId}
**Released At:** {ISO timestamp}

---

## Redis Operation

**Key Deleted:** `quarantine:{targetType}:{targetId}`

---

## WebSocket Event

**Type:** QuarantineEvent
**Action:** remove

**Payload:**
```json
{
  "type": "QuarantineEvent",
  "action": "remove",
  "targetType": "{targetType}",
  "targetId": "{targetId}",
  "timestamp": "{ISO timestamp}"
}
```

---

## Impact

- **Execution Unblocked:** {targetType} can now execute new steps
- **Dashboard Updated:** Quarantine icon removed from frontend

---

**Quarantine Released**

**Status:** {status description}
```

**Required Structure (list subcommand):**
```markdown
# Active Quarantines

**Subcommand:** list
**Executed At:** {ISO timestamp}
**Total Quarantines:** {count}

---

## Quarantine Records

| Target Type | Target ID | Reason | Quarantined At | TTL Remaining | Suggested Flow |
|-------------|-----------|--------|----------------|---------------|----------------|
| {type} | {id} | {reason} | {timestamp} | {ttl} | {flow} |

---

**List Complete**

**Status:** {count} active quarantines found
```

**Field Descriptions:**
- **Subcommand:** Enum (`quarantine` | `release` | `list`) — Operation type
- **Target Type:** Enum (`chain` | `session` | `format`) — What is quarantined
- **Target ID:** String — ChainId, SessionId, or FormatName
- **Reason:** String — Violation description (quarantine only)
- **Quarantined At / Released At:** String — ISO timestamp
- **Auto-Release:** Enum (`yes` | `no`) — Whether TTL-based auto-release enabled
- **TTL:** String — Time-to-live description (e.g., "7 days", "24 hours")
- **Redis Record:** Code block with Redis key and JSON payload
- **WebSocket Event:** Code block with event structure
- **Impact:** Bullet points describing quarantine effects
- **Total Quarantines:** Number — Count of active quarantines (list only)
- **Quarantine Records:** Table — All active quarantines (list only)

**Dashboard Usage:**
- `QuarantineViewer` component displays quarantine records
- `QuarantineBadge` component shows quarantine status icon
- `QuarantineNotification` component alerts user of new quarantines
- `QuarantineListPanel` component displays all active quarantines

**Validation:** Harmony detector validates Subcommand enum, Target Type enum, required sections present

**Implementation Status:** Spec: done | Parser: pending | Frontend: pending

---

## Validation

Run contract validation:
```bash
pnpm run harmony:check
```

See `packages/shared/src/contract/README.md` for manual testing examples.

---

**End of Contract**
