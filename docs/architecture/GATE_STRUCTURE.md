# Orchestrator Gate Specifications

**Version:** 1.0
**Date:** 2026-02-13
**Phase:** 1 (Routing Foundation)

---

## Overview

This document specifies the input/output/trace contracts for each orchestrator gate. Gates are decision points in the orchestrator where different paths may be taken based on state and metadata.

See `ORCHESTRATOR.md` for full orchestrator logic. This document focuses on gate I/O contracts and trace specifications.

---

## Gate 4: Compile Chain (Routing Enhancement)

### Purpose

Select the best action(s) for a user request and compile them into an executable chain.

### Input Contract

**Sources:**
- Context from Gate 2 routing decision
- FLOWS.md (flow registry)
- ROUTING_RULES.md (routing rules)
- ROUTING_METADATA.md (action metadata)
- User request keywords and scope (if applicable)

**Variables:**
```typescript
interface Gate4Input {
  context: string;           // From Gate 2: work|maintenance|explore|review|settings|pm|intel
  keywords: string[];        // User request keywords
  scope?: string;            // File scope/pattern if applicable
  requiresFlow: boolean;     // Must use a registered flow
  allowComposition: boolean; // Can compose from actions
}
```

### Output Contract

**Primary Output:** Chain Compilation Table (Format 1.1)

```markdown
| # | Action | Model | Inputs | Waits For | Status |
|---|--------|-------|--------|-----------|--------|
| 1 | analyze/ | sonnet | aspect, scope | -- | 🟡 Pending |
| 2 | code/ | haiku | task, context | #1 | 🟡 Pending |
```

**Metadata Output (if routing used):**

When ROUTING_RULES.md is consulted for action selection, include:

```markdown
## Routing Decision (Gate 4)

**Context:** work
**Keywords:** [implement, backend, api]
**Scope:** packages/backend/src/routes/**

**Algorithm Results:**
- Rules considered: 12
- Rules matched: 3
- Selected rule: RR005
- Selected action: code/backend/
- Confidence score: 0.82 (high)
- Confidence threshold: 0.80 (met ✅)

**Rule Matched:** RR005 (Frontend implementation preferred over generic code/)
**Rationale:** Implementation keywords + frontend scope = code/frontend/ is the better choice over generic code/

**Runner-up:**
- Rule: RR004
- Score: 0.75
- Action: code/backend/
```

### Trace Contract

**Log Folder:** `.claude/actionflows/logs/routing/`

**Log Types:**
- `gate-4-decisions.log` — All Gate 4 routing decisions with confidence scores
- `routing-mismatches.log` — Cases where routing selected suboptimal action (manual review)

**Log Format (gate-4-decisions.log):**

```
[2026-02-13 19:45:23] GATE_4_ROUTING
  Context: work
  Keywords: ["implement", "backend"]
  Scope: packages/backend/src/routes/**
  Rules considered: 12
  Rules matched: 3
  Top match: RR005 (score: 0.82)
  Action selected: code/backend/
  Confidence: high (threshold: 0.80, score: 0.82, passed ✅)
  Rule rationale: Implementation keywords + backend scope = use stack-specific code/backend/
  Duration: 15ms
```

**Trace Depth:**
- **INFO** — Action selected, score, confidence status
- **DEBUG** — All matched rules with scores, scoring breakdown
- **TRACE** — Complete algorithm execution, alternative paths

### Error Cases

**Case 1: No Rules Match**
```markdown
## Routing Decision (Gate 4)

**Context:** explore
**Keywords:** [learn, tutorial]

**Algorithm Results:**
- Rules considered: 12
- Rules matched: 0
- Fallback: context default (analyze/)
- Confidence: low (no rules matched)
```

**Case 2: Matched Rule, Score Below Threshold**
```markdown
**Rule Matched:** RR002 (Performance analysis)
**Score:** 0.45 (does not meet confidence threshold of 0.50)
**Selected:** RR002 fallback action (review/)
**Confidence:** low (threshold not met)
```

---

## Routing Algorithm Specification

### Algorithm Reference

**File:** `packages/shared/src/routing/routingAlgorithm.ts`

**Input:**
```typescript
selectAction(
  context: string,
  keywords: string[],
  rules: RoutingRule[],
  actionMetadata?: ActionMetadata[],
  scope?: string
): RoutingDecision
```

**Output:**
```typescript
interface RoutingDecision {
  action: string;           // Selected action
  score: number;            // 0.0-1.0 confidence
  matchedRule: RoutingRule | null;  // Rule that matched
  rationale: string;        // Human readable explanation
  confidence: ConfidenceLevel;  // high|medium|low
}
```

### Scoring Formula

```
raw_score = (keyword_match * 0.5) + (scope_match * 0.3) + (input_match * 0.2)
  where:
    keyword_match = (matched_keywords / total_keywords) * 0.5
    scope_match = 0.3 if any scope_pattern matches, else 0.0
    input_match = reserved for future use

final_score = raw_score * (rule_priority / 100)
```

### Confidence Thresholds

Applied after scoring:

```typescript
CONFIDENCE_THRESHOLDS = {
  high: 0.8,    // 80% - strict routing, fallback if below
  medium: 0.5,  // 50% - moderate confidence needed
  low: 0.0,     // Always route (for learning/discovery actions)
}
```

If `final_score < threshold`, use rule's fallback action or context default.

### Precedence

1. Exact match (context + keywords + scope) → Priority 90-100
2. Partial match (context + keywords OR context + scope) → Priority 50-89
3. Fallback (context only) → Priority 1-49

### Tie-Breaking

When two rules have identical scores:
1. Sort by `routing_priority` from ROUTING_METADATA.md (descending)
2. If still tied, select rule with higher rule_id (alphabetically)

---

## Validation Infrastructure

### Schema Validation

**File:** `packages/shared/src/routing/routingValidator.ts`

Validates before routing:
- ROUTING_RULES.md YAML structure
- ROUTING_METADATA.md YAML structure
- All actions referenced in rules exist
- All dependencies in metadata resolve

### Cyclic Dependency Detection

**File:** `packages/shared/src/routing/cyclicDependencyDetector.ts`

Prevents:
- Circular routing (A → B, B → A)
- Circular dependencies (A depends on B, B depends on A)

Uses depth-first search with recursion stack tracking.

### CLI Validator

**Command:** `pnpm run routing:validate`

Runs:
1. Schema validation (rules + metadata)
2. Circular dependency detection
3. Action reference validation
4. Coverage validation (all actions have metadata)
5. Priority analysis (warns on ties)
6. Graph topology analysis

Exit codes:
- `0` — All validations passed
- `1` — Validation errors found

---

## ROUTING_RULES.md Format

See `.claude/actionflows/ROUTING_RULES.md` for:
- Complete schema definition
- Example rules (RR001-RR010)
- Precedence rules
- Validation requirements

---

## ROUTING_METADATA.md Format

See `.claude/actionflows/ROUTING_METADATA.md` for:
- Complete metadata schema
- All action metadata entries
- Context affinity definitions
- Capability tags
- Trigger specifications

---

## Integration Points

### orchestrator.md Reference

Gate 4 calls the routing algorithm:

```python
# Pseudo-code from ORCHESTRATOR.md § Gate 4
if no_matching_flow:
    decision = selectAction(
        context=context,
        keywords=keywords,
        rules=load_routing_rules(),
        metadata=load_action_metadata(),
        scope=scope
    )
    log_routing_decision(decision)
    selected_action = decision.action
```

### Frontend Integration

Gate 4 decisions accessible via:
- `/api/routing/decisions?chainId={id}` — Retrieve routing decision for a chain
- WebSocket: `routing-decision` event — Real-time updates during chain compilation

---

## Example: Gate 4 in Action

### Request

```
Context: review
Keywords: [security, vulnerabilities, backend]
Scope: packages/backend/src/routes/**
```

### Algorithm Execution

1. **Filter** rules by context: 12 rules match `review` context
2. **Score** each rule:
   - RR001 (Security + backend) → score: 0.85 ✅ top
   - RR009 (Audit broad) → score: 0.72
   - RR002 (Performance) → score: 0.45
3. **Check confidence**: RR001 score 0.85 >= threshold 0.80 ✅
4. **Select action**: audit/ (from RR001)
5. **Log decision**: Record to gate-4-decisions.log

### Output

```markdown
## Routing Decision (Gate 4)

**Context:** review
**Keywords:** [security, vulnerabilities, backend]
**Scope:** packages/backend/src/routes/**

**Results:**
- Rules considered: 12
- Rules matched: 3
- Top match: RR001 (score: 0.85)
- Selected action: audit/
- Confidence: high (threshold: 0.80, passed ✅)

**Rationale:** Security keywords + backend scope → comprehensive audit needed, not just review
```

---

## Future Enhancements

### Phase 2: Discovery UI

Expose routing metadata to dashboard:
- Action capability tags
- Context affinity
- Confidence explanations

### Phase 3: Signals

Use `triggers.situations` to detect mid-chain recompilation:
- Gate 9 integration
- Dynamic routing during execution

### Phase 4: Agent Evolution

Analyze routing logs for patterns:
- Which rules are most effective?
- Which actions are over/under-utilized?
- Suggest new rules based on patterns

---

## See Also

- `ORCHESTRATOR.md` — Full orchestrator logic including Gate 4
- `ROUTING_RULES.md` — Routing rule definitions
- `ROUTING_METADATA.md` — Action metadata
- `GATE_LOGGING.md` — Gate logging implementation details
- `packages/shared/src/routing/` — Implementation code
