# Healing Verification Report Template

**Purpose:** Used by `verify-healing/` action agents to confirm that healing chains fixed violations
**Contract Reference:** CONTRACT.md § Format 5.5 (Healing Verification Report) — P3 Priority
**Parser:** `parseHealingVerification` in `packages/shared/src/contract/parsers/actionParser.ts`
**Zod Schema:** `HealingVerificationSchema` in `packages/shared/src/contract/validation/schemas.ts`
**Producer:** See `.claude/actionflows/actions/verify-healing/agent.md`

---

## Required Sections

These sections MUST be present in every healing verification report:

1. **Title** — `# Healing Verification Report`
2. **Metadata** — Healing Chain ID, Target Gate, Expected Score, Executed At
3. **Health Score Comparison** — Table with before/after metrics
4. **Detailed Gate Analysis** — Target gate analysis + other gates
5. **Verdict** — SUCCESS | PARTIAL | FAILED | ESCALATE
6. **Recommendations** — Immediate Action, Next Steps
7. **Remaining Violations** — If applicable

---

## Optional Sections

- **Learnings** — Issue/Root Cause/Suggestion pattern

---

## Template Structure

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

## Learning (Optional)

**Issue:** {Description}

**Root Cause:** {Analysis}

**Suggestion:** {How to prevent}

---

**Verification Complete**

**Status:** {SUCCESS | PARTIAL | FAILED | ESCALATE}
**Health Delta:** {delta} points
**Protocol Next Step:** {LEARN | RE-RUN | INVESTIGATE | ROLLBACK}
```

---

## Field Descriptions

### Healing Chain
- **Type:** String (ChainId)
- **Purpose:** Identifies the healing chain that executed
- **Format:** UUID or chain identifier

### Target Gate
- **Type:** String
- **Format:** Gate identifier (e.g., "Gate 4")
- **Purpose:** The gate that was failing before healing

### Expected Score
- **Type:** Number (0-100)
- **Default:** 95
- **Purpose:** Minimum acceptable health score threshold
- **Note:** If post-healing score meets or exceeds this, verdict is SUCCESS

### Executed At
- **Type:** String (ISO 8601 timestamp)
- **Format:** `YYYY-MM-DDTHH:MM:SSZ`
- **Purpose:** When the healing verification ran

### Health Score Comparison Table
- **Overall Score:** Before, after, delta, status
- **Target Gate Violations:** Before, after, delta, status
- **Status field:** `improved`, `degraded`, `stable`
- **Delta:** Number of points change

### Detailed Gate Analysis
- **Target Gate section:** Before/after analysis for gate that was failing
- **Other Gates section:** Table showing all gates (to detect regressions)
- **New Violations Introduced:** Boolean, yes/no

### Verdict
- **Type:** Enum (`SUCCESS` | `PARTIAL` | `FAILED` | `ESCALATE`)
- **SUCCESS:** All violations cleared, health score meets threshold
- **PARTIAL:** Some violations reduced but not all cleared
- **FAILED:** Violations unchanged or worsened
- **ESCALATE:** Healing caused new violations (regression)

### Reasoning
- **Length:** 2-3 sentences
- **Evidence:** Based on score changes and gate analysis
- **Clarity:** Explain verdict decision

### Evidence
- **Bullet points:** Supporting facts
- **Specificity:** Concrete numbers, not vague assessments
- **Scope:** Overall trends + target gate + other gates

### Recommendations
- **Immediate Action:** What to do based on verdict
  - If SUCCESS: Deploy, close healing chain
  - If PARTIAL: Continue healing (re-run or different approach)
  - If FAILED: Investigate why healing didn't work
  - If ESCALATE: Roll back changes, root-cause regression
- **Next Steps:** Follow-up actions

### Remaining Violations
- **Count:** Total violations still present (if PARTIAL/FAILED)
- **By Gate:** Breakdown of remaining violations per gate
- **Patterns:** Descriptions of what's still failing

### Protocol Next Step
- **LEARN:** Record outcome in LEARNINGS.md
- **RE-RUN:** Re-execute healing chain with different approach
- **INVESTIGATE:** Diagnose why healing failed
- **ROLLBACK:** Revert healing changes, restore previous state

---

## Example

```markdown
# Healing Verification Report

**Healing Chain:** chain-abc123def456
**Target Gate:** Gate 4
**Expected Score:** 95
**Executed At:** 2026-02-21T15:45:30Z

---

## Health Score Comparison

| Metric | Before Healing | After Healing | Delta | Status |
|--------|----------------|---------------|-------|--------|
| **Overall Score** | 73 | 98 | +25 | improved |
| **Target Gate Violations** | 12 | 0 | -12 | improved |

---

## Detailed Gate Analysis

### Target Gate: Gate 4

**Before Healing:**
- Violations: 12
- Pass Rate: 42%
- Pattern: Missing "Key Inputs" column in chain compilation tables

**After Healing:**
- Violations: 0
- Pass Rate: 100%
- Pattern: No violations detected

**Change:** RESOLVED ✅

---

### Other Gates

| Gate | Violations Before | Violations After | Change |
|------|-------------------|------------------|--------|
| Gate 2 | 3 | 3 | stable |
| Gate 5 | 8 | 8 | stable |
| Gate 7 | 2 | 2 | stable |
| Gate 9 | 1 | 1 | stable |

**New Violations Introduced:** no

---

## Verdict

**Verdict:** SUCCESS

**Reasoning:**

The healing chain successfully cleared all Gate 4 violations by updating ORCHESTRATOR.md with the "Key Inputs" column specification. Health score improved from 73 to 98, exceeding the expected threshold of 95. No regressions detected in other gates.

**Evidence:**
- Health score met expected threshold (98 >= 95)
- Target gate violations cleared (12 → 0)
- Other gates stable (no new violations)

---

## Recommendations

### Immediate Action

Deploy the healing changes. The ORCHESTRATOR.md update is safe and backward-compatible. Gate 4 violations are now resolved.

### Next Steps

1. Commit the healing changes to git
2. Close the diagnosis issue (LEARNING: L015)
3. Monitor Gate 4 for regressions in next 24h
4. Update LEARNINGS.md with healing outcome

---

## Learning

**Issue:** Specification/implementation mismatch between CONTRACT.md and ORCHESTRATOR.md

**Root Cause:** CONTRACT.md was updated with new "Key Inputs" column, but ORCHESTRATOR.md documentation was not synchronized

**Suggestion:** Implement automated CI check that validates ORCHESTRATOR.md examples against CONTRACT.md definitions, catching spec/impl drift immediately

---

**Verification Complete**

**Status:** SUCCESS ✅
**Health Delta:** +25 points
**Protocol Next Step:** LEARN
```

---

## Validation

This format is validated at three layers:

1. **Specification Layer:** CONTRACT.md § Format 5.5
2. **Parser Layer:** `packages/shared/src/contract/parsers/actionParser.ts` — `parseHealingVerification()`
3. **Harmony Layer:** Backend validates Verdict enum, score ranges, required sections

---

## Cross-References

- **Contract Specification:** `.claude/actionflows/CONTRACT.md` § Format 5.5 (Healing Verification Report)
- **Parser Implementation:** `packages/shared/src/contract/parsers/actionParser.ts`
- **Zod Schema:** `packages/shared/src/contract/validation/schemas.ts`
- **Agent Definition:** `.claude/actionflows/actions/verify-healing/agent.md`
- **Related Templates:** `TEMPLATE.format-5.4-diagnosis-report.md` (precedes healing verification)
