# Contract Drift Fix Flow

> Update CONTRACT.md when orchestrator/agent formats evolve beyond documented spec.

---

## When to Use

- Human says "sync CONTRACT.md with reality"
- Human says "fix contract drift"
- Recommendations from analysis suggest contract-drift-fix/
- Orchestrator/agent formats have naturally evolved beyond CONTRACT.md documentation

---

## Required Inputs From Human

| Input | Description | Example |
|-------|-------------|---------|
| context | (optional) Specific formats or sections known to be drifted | "Format 1.1 now includes priority field" or "Chain Compilation section outdated" |

---

## Action Sequence

### Step 1: Analyze Contract-Code Drift

**Action:** `.claude/actionflows/actions/analyze/`
**Model:** sonnet

**Spawn:**
```
Read your definition in .claude/actionflows/actions/analyze/agent.md

Input:
- aspect: contract-code-drift
- scope: .claude/actionflows/CONTRACT.md vs packages/shared/src/contract/ + actual orchestrator output
- context: {human context, or "comprehensive drift audit"}. Compare CONTRACT.md Format definitions against: (1) parser implementations in packages/shared/src/contract/parsers/, (2) actual orchestrator/agent output examples. Identify: missing fields, deprecated formats, new optional fields, structure changes, type mismatches.
```

**Gate:** Drift analysis delivered with:
- Complete list of format mismatches (missing fields, new formats, deprecated sections)
- Which formats are affected
- Impact assessment (critical vs minor drift)

---

### Step 2: Code Update

**Action:** `.claude/actionflows/actions/code/`
**Model:** sonnet

**Spawn after Step 1:**
```
Read your definition in .claude/actionflows/actions/code/agent.md

Input:
- task: Update CONTRACT.md to match actual orchestrator/agent output. Based on drift analysis from Step 1, sync all Format X.Y definitions with reality. Add missing fields, deprecate obsolete sections, update type definitions. Preserve backward compatibility notes where applicable. After updating CONTRACT.md, update any affected parsers in packages/shared/src/contract/parsers/ to validate against the new spec.
- context: Complete drift analysis from Step 1
- component: framework
```

**Gate:** CONTRACT.md updated and matches current code; related parsers updated if needed.

---

### Step 3: Review Contract Update

**Action:** `.claude/actionflows/actions/review/`
**Model:** sonnet

**Spawn after Step 2:**
```
Read your definition in .claude/actionflows/actions/review/agent.md

Input:
- scope: CONTRACT.md changes and any parser updates from Step 2
- type: contract-update
- context: Drift analysis from Step 1 showed mismatches. Verify that CONTRACT.md now accurately documents the format reality. Check: all fields documented, types correct, examples match actual output, parsers validate.
```

**Review focuses on:**
- CONTRACT.md now matches actual orchestrator/agent output
- No fields missing or incorrectly documented
- Examples in CONTRACT.md produce valid output when tested
- Parsers updated if format changed
- Backward compatibility notes clear where applicable

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
- focus: Verify CONTRACT.md now matches reality. Check: documented formats align with orchestrator output, no critical formats missed, examples are accurate.
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
- scope: Updated CONTRACT.md and any parser files from Step 2
- message_type: contract-sync
- context: Sync CONTRACT.md documentation with current orchestrator/agent output. Briefly note major format changes (e.g., "Added optional priority field to Format 1.1", "Updated Chain Compilation section").
```

**Commit includes:**
- Updated CONTRACT.md
- Updated parser files (if applicable)
- Tag: `contract-sync`

---

## Dependencies

```
Step 1 → Step 2 → Step 3 → Step 4 → Step 5 (verdict gate) → Step 6
                                      ↑_________________↓ (if NEEDS_CHANGES/DISSENT)
```

**Parallel groups:** None — sequential with approval gate and possible loop.

---

## Chains With

- ← Triggered from: Human request or analysis recommendation
- → `parser-update/` (if parsers need updates to validate new contract formats)
- → `framework-health/` (to verify contract drift is resolved)

---

## Safety Guardrails

1. **Always analyze before updating** — Drift must be documented before contract changes
2. **Document becomes source of truth** — CONTRACT.md should document reality, not prescribe it
3. **Review before commit** — All contract changes validated by review + second opinion
4. **Keep examples accurate** — CONTRACT.md examples should match actual output
5. **Update related parsers** — If format changes, ensure parsers validate against new spec
6. **Backward compatibility** — Note in CONTRACT.md if changes break existing format versions

---

## Output Artifacts

- `.claude/actionflows/logs/analyze/contract-code-drift-{datetime}/analysis.md` — Drift analysis
- `.claude/actionflows/logs/code/contract-sync-{datetime}/changes.md` — Contract update log
- `.claude/actionflows/logs/review/contract-update-{datetime}/review.md` — Review results
- `.claude/actionflows/logs/second-opinion/contract-update-{datetime}/opinion.md` — Second opinion
