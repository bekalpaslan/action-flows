# Diagnosis Report Template

**Purpose:** Used by `diagnose/` action agents to analyze root causes of harmony violations
**Contract Reference:** CONTRACT.md § Format 5.4 (Diagnosis Report) — P4 Priority
**Parser:** `parseDiagnosisReport` in `packages/shared/src/contract/parsers/actionParser.ts`
**Zod Schema:** `DiagnosisReportSchema` in `packages/shared/src/contract/validation/schemas.ts`
**Producer:** See `.claude/actionflows/actions/diagnose/agent.md`

---

## Required Sections

These sections MUST be present in every diagnosis report:

1. **Title** — `# Root Cause Analysis`
2. **Metadata** — Gate, Pattern, Severity, Confidence, Auto-Triage Candidate
3. **Evidence** — Timing Analysis, Code History, Pattern Analysis
4. **Root Cause** — Classification, Explanation, Alternative Causes
5. **Healing Recommendation** — Flow, Confidence, Steps, Target Files
6. **Prevention Suggestion** — Learning Entry, Immediate Prevention, Long-Term Prevention

---

## Optional Sections

- **Additional Analysis** — Deep dives into specific patterns
- **Learnings** — Issue/Root Cause/Suggestion pattern

---

## Template Structure

```markdown
# Root Cause Analysis

**Gate:** {gateId}
**Pattern:** {violationPattern}
**Severity:** {critical | high | medium | low}
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

---

## Field Descriptions

### Gate
- **Type:** String
- **Format:** Gate ID (e.g., "Gate 4", "Gate 9")
- **Purpose:** Identifies which validation gate detected the violation

### Pattern
- **Type:** String
- **Purpose:** Violation pattern description (e.g., "missing status column")
- **Specificity:** Should be concrete, not vague

### Severity
- **Type:** Enum (`critical` | `high` | `medium` | `low`)
- **Definition:** Impact on system if not fixed
  - **Critical:** System-wide impact, blocks deployments
  - **High:** Feature-level impact, affects users
  - **Medium:** Local impact, affects specific component
  - **Low:** Cosmetic or edge-case impact

### Confidence
- **Type:** Enum (`high` | `medium` | `low`)
- **Definition:** Confidence in root cause diagnosis
  - **High:** Clear evidence, diagnosis certain
  - **Medium:** Probable cause, evidence supports but alternatives possible
  - **Low:** Multiple possible causes, diagnosis uncertain

### Auto-Triage Candidate
- **Type:** Enum (`yes` | `no`)
- **Definition:** Whether fix is trivial enough for orchestrator auto-triage
  - **Yes:** Single file, mechanical fix, low risk
  - **No:** Complex fix, multiple files, architectural decision needed

### Timing Analysis
- **Violations started:** Timestamp (from gate traces) when violation pattern first appeared
- **Violation frequency:** Occurrence count (24h and 7d windows)
- **Affected gates:** List of gates that detected the violation

### Code History
- **File modifications:** Git timestamps for relevant source files
- **Temporal relationship:** Whether changes correlate with violation start

### Pattern Analysis
- **Detail level:** Specific examples from gate traces
- **Scope:** All occurrences, not just first instance
- **Context:** Code snippets, gate trace excerpts if helpful

### Classification
- **parser_bug:** Parser implementation error
- **orchestrator_drift:** Orchestrator output doesn't match contract
- **contract_outdated:** CONTRACT.md doesn't reflect reality
- **agent_drift:** Agent template incorrect
- **template_mismatch:** Filename/format mismatch in template

### Explanation
- **Length:** 2-3 sentences
- **Evidence:** Reference specific findings above
- **Clarity:** Should be understandable to non-experts

### Alternative Causes
- **List format:** Bullet points
- **Elimination:** Explain why each alternative is ruled out
- **Evidence:** Point to specific evidence

### Healing Recommendation
- **Flow:** Specific flow name (e.g., "audit-and-fix/")
- **Confidence:** High if flow has been tested, lower if experimental
- **Steps:** Numbered list of actions
- **Target Files:** Specific files that need changes

### Prevention Suggestion
- **Learning Entry:** Structured format for LEARNINGS.md
- **Immediate:** Action to prevent this specific recurrence
- **Long-Term:** Systemic fix to prevent class of violations

---

## Example

```markdown
# Root Cause Analysis

**Gate:** Gate 4
**Pattern:** Missing "Key Inputs" column in chain compilation table
**Severity:** high
**Confidence:** high
**Auto-Triage Candidate:** yes

---

## Evidence

### Timing Analysis
- **Violations started:** 2026-02-18 14:30:00Z
- **Violation frequency:** 4 violations in 24h, 12 violations in 7d
- **Affected gates:** Gate 4 (Chain Compilation validation)

### Code History
- **ORCHESTRATOR.md last modified:** 2026-02-17 10:00:00Z (before violations)
- **CONTRACT.md last modified:** 2026-02-18 14:00:00Z (just before violations)
- **orchestratorOutputFormatter.ts last modified:** 2026-02-16 09:30:00Z (before violations)

### Pattern Analysis

The violation occurs in orchestrator Format 1.1 (Chain Compilation Table). All affected compilations are missing a "Key Inputs" column between "Model" and "Waits For" columns. For example:

```
| # | Action | Model | Waits For | Status |
```

Should be:

```
| # | Action | Model | Key Inputs | Waits For | Status |
```

---

## Root Cause

**Classification:** contract_outdated

**Explanation:**

CONTRACT.md was updated on 2026-02-18 to add "Key Inputs" as a required column in Format 1.1, but ORCHESTRATOR.md was not updated with the new column specification. The orchestrator is still formatting tables according to the old contract. This is a specification/implementation mismatch.

**Alternative Causes Considered:**
- Parser bug: Unlikely, gate validation is working (detecting the violation)
- Orchestrator code error: Possible, but code hasn't changed since before violation start
- Template drift: No, orchestrator doesn't use templates

---

## Healing Recommendation

**Flow:** audit-and-fix/
**Confidence:** high

**Steps:**
1. Read current CONTRACT.md Format 1.1 specification
2. Update ORCHESTRATOR.md table formatting to include "Key Inputs" column
3. Test format with sample orchestrator output
4. Run contract validation to confirm fix

**Target Files:**
- ORCHESTRATOR.md — Update Format 1.1 example table and formatting specification

**If Auto-Triage Candidate:**
Trivial fix detected: Add "Key Inputs" column to table format in ORCHESTRATOR.md example section. This is a single-file, mechanical documentation fix with zero production risk.
Orchestrator can apply directly without human gate.

---

## Prevention Suggestion

**Learning Entry:**
```
L015 | 2026-02-21 | CONTRACT format column addition not reflected in ORCHESTRATOR.md
     | Root cause: Specification update (CONTRACT.md) not synchronized with orchestrator documentation (ORCHESTRATOR.md)
     | Fix: Added "Key Inputs" column to ORCHESTRATOR.md table formatting
     | Prevention: When modifying contract format specifications, update ORCHESTRATOR.md examples and follow the 4-layer verification checklist in CONTRACT.md § Alignment Verification Gate
```

**Immediate Prevention:**
When updating CONTRACT.md format specifications, immediately update corresponding examples in ORCHESTRATOR.md and run `pnpm run contract:validate` to catch spec/impl drift.

**Long-Term Prevention:**
Implement automated test that parses ORCHESTRATOR.md examples as part of CI pipeline, validating against CONTRACT.md definitions. This would catch format drift automatically.

---

**Diagnosis Complete**
```

---

## Validation

This format is validated at three layers:

1. **Specification Layer:** CONTRACT.md § Format 5.4
2. **Parser Layer:** `packages/shared/src/contract/parsers/actionParser.ts` — `parseDiagnosisReport()`
3. **Harmony Layer:** Backend validates sections are present and enums are valid

---

## Cross-References

- **Contract Specification:** `.claude/actionflows/CONTRACT.md` § Format 5.4 (Diagnosis Report)
- **Parser Implementation:** `packages/shared/src/contract/parsers/actionParser.ts`
- **Zod Schema:** `packages/shared/src/contract/validation/schemas.ts`
- **Agent Definition:** `.claude/actionflows/actions/diagnose/agent.md`
- **Related Templates:** `TEMPLATE.format-5.5-healing-verification-report.md` (follow-up after healing)
