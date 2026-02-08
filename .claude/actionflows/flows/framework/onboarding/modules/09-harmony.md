# Module 9: Harmony & The Living Model

**Level:** Advanced
**Duration:** ~25 min
**Prerequisites:** Modules 1-8

---

## Presentation

Final advanced topic: **Harmony**—how the framework detects and maintains sync between orchestrator and dashboard.

**Harmony means:** Orchestrator output matches contract specification.

---

## How It Works

### Step 1: Orchestrator produces output
```markdown
## Chain: Fix bug
| # | Action | Model | Waits For | Status |
|---|--------|-------|-----------|--------|
| 1 | code/  | haiku | --        | Pending |
```

### Step 2: Backend tries to parse using contract parser
```typescript
const parsed = parseChainCompilation(orchestratorOutput);
```

### Step 3: Parser validates structure
```
Required fields present?
- Title: "Fix bug" ✅
- Table with columns: #, Action, Model, Waits For, Status ✅
- ... ❌ Missing "Key Inputs" column!
```

### Step 4: Harmony status
```
Parse failed → Harmony ❌

Dashboard shows: "Parsing incomplete—some data unavailable"
Backend logs: "Chain compilation validation failed: missing Key Inputs column"
```

### Step 5: Human investigates
```
Was orchestrator wrong? → Update ORCHESTRATOR.md to include column
Was contract outdated? → Update CONTRACT.md to make column optional

After fix:
Parse succeeds → Harmony ✅
```

---

## Harmony States

### 1. In Harmony ✅
- Orchestrator output matches contract
- Dashboard parses successfully
- All features work

### 2. Out of Harmony ❌
- Orchestrator output doesn't match contract
- Dashboard parsing fails (graceful degradation)
- Some features unavailable

### 3. Migration (version mismatch) ⚠️
- Orchestrator uses contract v1.1
- Dashboard supports v1.0 and v1.1
- Both versions work during transition

---

## Living Software Model

ActionFlows is **LIVING SOFTWARE:**

### Traditional software:
- Human writes code
- Code is static
- Changes require manual editing
- Bugs accumulate
- Quality degrades over time

### Living software:
- Human triggers Claude to evolve the system
- System adapts through agent learnings
- Changes happen via orchestrated chains
- Quality improves over time
- Framework evolves based on usage

**The harmony system enables this.**

---

## Evolution Workflow

**Scenario:** You want to add risk scoring to review reports

### Step 1: Define new format in CONTRACT.md
```markdown
### Format 5.4: Review Report with Risk Score

Structure:
## Review Report: {scope}

**Risk Score:** {low | medium | high | critical}

[existing fields...]

Required fields: risk_score (enum)
TypeScript: ReviewReportParsed { riskScore: 'low' | 'medium' | 'high' | 'critical'; ... }
```

### Step 2: Add parser
```typescript
// packages/shared/src/contract/parsers/review.ts

export function parseReviewReport(markdown: string): ReviewReportParsed {
  // Extract risk score
  const riskMatch = markdown.match(/\*\*Risk Score:\*\* (low|medium|high|critical)/);
  const riskScore = riskMatch?.[1] || 'medium';  // default if missing

  return {
    riskScore,
    // ... existing fields
  };
}
```

### Step 3: Update ORCHESTRATOR.md
Add example showing review/ agents must include risk score.

### Step 4: Update dashboard component
```typescript
// packages/app/src/components/ReviewReportViewer.tsx
<RiskBadge level={report.riskScore} />
```

### Step 5: Test harmony
Run review/ action → Check parsing succeeds → Verify risk badge renders

### Step 6: Increment CONTRACT_VERSION if needed
If change breaks old parsers:
```
CONTRACT_VERSION: 1.0 → 1.1
```
Support both versions for 90 days.

**Done!** Risk scoring is now part of the framework.

---

## Sacred vs Not Sacred

### Sacred (contract-defined, harmony-critical):
```
├── Output formats (chain tables, step announcements, reports)
├── Branded types (SessionId, ChainId, StepId)
├── WebSocket events (discriminated unions)
└── Log folder naming patterns
```

### Not sacred (evolve freely):
```
├── ORCHESTRATOR.md philosophy sections
├── Agent instructions (within standards)
├── Flow definitions
├── Department routing
└── project.config.md values
```

**The boundary:** If the dashboard PARSES it → sacred
                 If the dashboard READS it → not sacred

---

## Quiz

**Question:** Dashboard shows "parsing incomplete" for a chain compilation. What do you check?

A. Is ORCHESTRATOR.md correct?
B. Did the orchestrator omit required fields from the contract?
C. Is the contract outdated—should it be updated?
D. All of the above

(Choose the best answer)

---

## Expected Answer

**Correct:** D

---

## Validation Responses

### If Correct
"Perfect! Harmony violations need investigation: Was orchestrator wrong? Was contract outdated? Check both sides, decide which needs updating, make coordinated change."

### If Wrong
"Close! Harmony violations require investigating BOTH sides. Check: (1) Did orchestrator omit contract-required fields? (2) Is contract specification outdated? Then decide which side needs updating and make the change. Sometimes orchestrator is wrong, sometimes contract is outdated."

---

## Key Takeaway

Harmony is ActionFlows' evolution guardrail:

**Living software = Continuous evolution**
**Harmony system = Synchronized evolution**

The contract keeps orchestrator and dashboard in sync while allowing both to evolve freely.

**Key insights:**
1. Evolution is encouraged (not prevented)
2. Guardrails ensure changes are deliberate
3. Harmony detection auto-validates sync
4. Human decides what needs updating

This is what makes ActionFlows different from traditional frameworks—it's designed to evolve through use, with built-in mechanisms to prevent drift.

---

## Transition

"Final module: Completion summary and next steps."

Proceed to Module 10.
