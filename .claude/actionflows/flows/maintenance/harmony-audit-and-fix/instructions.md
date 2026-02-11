# Harmony Audit and Fix Flow

> Remediate format drift and contract violations detected at gate checkpoints.

---

## When to Use

- Human says "fix harmony violations"
- Human says "fix Gate N violations" (where N is gate number)
- Human clicks "Fix Now" in Harmony Health Dashboard
- Gates report persistent parsing or contract validation failures

---

## Required Inputs From Human

| Input | Description | Example |
|-------|-------------|---------|
| gate_id | (optional) Specific gate to target, or "all" for comprehensive check | "Gate 4" or "all gates" |
| context | (optional) Background on violations observed | "Missing status column in chain compilation output" |

---

## Action Sequence

### Step 1: Analyze Harmony Violation

**Action:** `.claude/actionflows/actions/analyze/`
**Model:** sonnet

**Spawn:**
```
Read your definition in .claude/actionflows/actions/analyze/agent.md

Input:
- aspect: harmony-violation
- scope: {gate_id from human, or "all gates" if unspecified}
- context: {human context, or auto-fetch last 24h traces from Gate dashboard}. Identify root cause: parser bug? orchestrator drift? contract outdated? Analyze which formats fail validation, which steps produce malformed output, which gates consistently reject.
```

**Gate:** Root cause analysis delivered with:
- Specific formats/fields that fail validation
- Which gates are affected
- Whether issue is parser (backend), orchestrator (instructions), or contract (specification)

---

### Step 2: Apply Fix (Branching)

After Step 1 analysis, ONE of these three actions executes based on root cause:

#### Option A: Parser Fix

**Action:** `.claude/actionflows/actions/code/backend/`
**Model:** haiku

**Spawn if root cause = parser bug:**
```
Read your definition in .claude/actionflows/actions/code/agent.md

Input:
- task: Fix parser to handle format variants. Root cause from Step 1 identified the failing format. Update the parser in packages/shared/src/contract/parsers/ to gracefully handle the variant while maintaining backward compatibility.
- context: Violation analysis from Step 1
- component: backend
```

**Gate:** Parser updated and type-checks cleanly.

---

#### Option B: Orchestrator Instruction Fix

**Action:** `.claude/actionflows/actions/code/`
**Model:** haiku

**Spawn if root cause = orchestrator instruction drift:**
```
Read your definition in .claude/actionflows/actions/code/agent.md

Input:
- task: Clarify or correct orchestrator instruction that generates malformed output. Root cause from Step 1 identified the drift. Update .claude/actionflows/ORCHESTRATOR.md section to produce format that matches current CONTRACT.md.
- context: Violation analysis from Step 1
- component: framework
```

**Gate:** Instruction updated and examples in ORCHESTRATOR.md produce valid contract format.

---

#### Option C: Contract Update

**Action:** `.claude/actionflows/actions/code/`
**Model:** haiku

**Spawn if root cause = contract outdated:**
```
Read your definition in .claude/actionflows/actions/code/agent.md

Input:
- task: Update CONTRACT.md to match actual orchestrator/agent output. Root cause from Step 1 identified that contract documentation is stale. Sync CONTRACT.md Format X.Y with reality, then update related parsers to validate against the new spec.
- context: Violation analysis from Step 1
- component: framework
```

**Gate:** CONTRACT.md updated and validator passes sample outputs.

---

### Step 3: Review Harmony Fix

**Action:** `.claude/actionflows/actions/review/`
**Model:** sonnet

**Spawn after Step 2 (any branch):**
```
Read your definition in .claude/actionflows/actions/review/agent.md

Input:
- scope: Code changes from Step 2
- type: harmony-fix
- context: Original violations from Step 1. Verify that the fix resolves the root cause without introducing new violations. Test: does the previously-failing format now validate? Do gates report success?
```

**Review focuses on:**
- Does fix resolve the root cause violation?
- Are any new violations introduced?
- Does change maintain backward compatibility?
- Are examples/documentation updated?

**Gate:** Verdict delivered (APPROVED or NEEDS_CHANGES).

---

### Step 4: Second Opinion

**Action:** `.claude/actionflows/actions/second-opinion/`
**Model:** opus

**Spawn after Step 3:**
```
Read your definition in .claude/actionflows/actions/second-opinion/agent.md

Input:
- review-log: {log path from Step 3}
- focus: Verify fix resolves harmony violations without regressions. Check: does the format now validate? Are gates passing? Is backward compatibility maintained?
```

**Gate:** Second opinion delivered (CONCUR or DISSENT).

---

### Step 5: Handle Verdict

- **APPROVED + CONCUR** → Proceed to Step 6 (commit)
- **NEEDS_CHANGES or DISSENT** → Back to Step 2 with feedback

---

### Step 6: Commit

**Action:** `.claude/actionflows/actions/commit/`
**Model:** haiku

**Spawn after verdict approval:**
```
Read your definition in .claude/actionflows/actions/commit/agent.md

Input:
- scope: Parser, orchestrator instruction, or contract changes from Step 2
- message_type: harmony-fix
- context: Briefly note root cause and fix applied
```

**Commit includes:**
- Fixed parser/orchestrator/contract file(s)
- Updated CONTRACT.md or examples if applicable
- Tag: `harmony-fix`

---

## Dependencies

```
Step 1 → Step 2 (branching: A | B | C) → Step 3 → Step 4 → Step 5 (verdict gate) → Step 6
                                                                ↑________________↓ (if NEEDS_CHANGES/DISSENT)
```

**Parallel groups:** None — sequential with approval gate and possible loop.

---

## Chains With

- ← Triggered from: Harmony Health Dashboard or human request
- → `framework-health/` (to verify drift is cleared post-fix)
- → `code-and-review/` (for additional follow-up work if needed)

---

## Safety Guardrails

1. **Always analyze before fixing** — Root cause must be clear before applying patch
2. **Backward compatibility required** — Parser/orchestrator changes must not break existing formats
3. **Review before commit** — All fixes validated by review + second opinion
4. **Verify gates pass** — After fix, violations should clear at target gate(s)
5. **Document in CONTRACT.md** — If contract updated, include rationale in comments

---

## Output Artifacts

- `.claude/actionflows/logs/analyze/harmony-violation-{datetime}/analysis.md` — Root cause analysis
- `.claude/actionflows/logs/code/{fix-type}-{datetime}/changes.md` — Fix implementation log
- `.claude/actionflows/logs/review/harmony-fix-{datetime}/review.md` — Review results
- `.claude/actionflows/logs/second-opinion/harmony-fix-{datetime}/opinion.md` — Second opinion
