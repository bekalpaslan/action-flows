# Flow Drift Audit

> Systematic cross-reference audit of all registered flows for instruction accuracy and consistency.

---

## Purpose

Performs a comprehensive audit of ALL registered flows in the ActionFlows framework. Verifies that each flow's instructions.md accurately reflects its registered chain in FLOWS.md, that all referenced actions exist with proper agent.md files, that actions are registered in ACTIONS.md, and that abstract extensions are correctly applied.

This is a deep health check of the flow registry to detect drift between documentation, action implementations, and framework contracts.

## When to Use

- Human says "audit flows"
- Human says "check flow drift"
- Human says "flow health deep scan"
- Human says "flow instructions audit"
- Periodic maintenance (monthly or after significant framework changes)
- After creating or modifying multiple flows
- When flow execution behavior doesn't match instructions.md documentation

## Chain Pattern

analyze (full sweep) → plan (fixes) → human gate → code×N (batch fix) → review → second-opinion/ → commit

## Inputs

| Input | Required | Description | Default |
|-------|----------|-------------|---------|
| focus | No | Narrow to specific context or flow | "all flows" |
| depth | No | Analysis depth | "comprehensive" |

## Action Sequence

### Step 1: Analyze Flow Registry

**Action:** `.claude/actionflows/actions/analyze/`
**Model:** sonnet

**Spawn:**
```
Read your definition in .claude/actionflows/actions/analyze/agent.md

Input:
- aspect: flow-registry-drift
- scope: All flows in .claude/actionflows/flows/**/instructions.md vs FLOWS.md, ACTIONS.md, action agent.md files
- context: {human context, or "comprehensive flow audit"}. For EACH registered flow, verify the 7-point checklist: (1) instructions.md exists and describes correct purpose, (2) Chain in instructions.md matches chain in FLOWS.md, (3) Each action referenced exists in actions/ with agent.md, (4) Each action is registered in ACTIONS.md, (5) Abstract extensions (agent-standards, create-log-folder, etc.) are correctly referenced in agent.md files, (6) Model assignments are valid and match ACTIONS.md defaults, (7) Input/output contracts between steps are coherent (step N output feeds step N+1 input). Report all drift instances by flow name.
```

**Gate:** Drift analysis delivered with:
- Complete list of flows audited
- Drift instances categorized by type (missing instructions.md, chain mismatch, missing action, unregistered action, incorrect extensions, invalid model, broken contracts)
- Severity classification (CRITICAL → HIGH → MEDIUM → LOW)
- Recommended fix plan

---

### Step 2: Plan Fixes

**Action:** `.claude/actionflows/actions/plan/`
**Model:** sonnet

**Spawn after Step 1:**
```
Read your definition in .claude/actionflows/actions/plan/agent.md

Input:
- scope: Flow drift remediation based on Step 1 analysis
- context: Create fix plan for all drift instances. Group fixes into batches: (1) instructions.md updates, (2) FLOWS.md corrections, (3) ACTIONS.md additions, (4) agent.md abstract reference fixes. For each batch, specify files to modify, changes to apply, and validation criteria. Output structured plan with parallel batches where safe.
```

**Gate:** Fix plan delivered with:
- Batched file modifications (grouped by fix type)
- Parallel-safe vs sequential requirements
- Validation checklist per batch

---

### Step 3: Human Gate

**Orchestrator presents compiled plan from Step 2 and waits for human approval.**

Options:
- "approve" → Proceed to Step 4
- "modify: {changes}" → Re-plan with adjustments
- "cancel" → Halt execution

---

### Step 4: Batch Code Fixes (Parallel)

**Action:** `.claude/actionflows/actions/code/` (×N batches)
**Model:** sonnet

**Spawn after human approval (parallel batches):**

Each batch gets a separate code agent:

**Batch 1 — instructions.md updates:**
```
Read your definition in .claude/actionflows/actions/code/agent.md

Input:
- task: Update flow instructions.md files per drift analysis. Fix: chain descriptions, action references, model assignments, abstract extensions. Ensure instructions.md matches FLOWS.md registry and actual action implementations.
- context: Drift report batch 1 from Step 2 plan
- component: framework
```

**Batch 2 — FLOWS.md corrections:**
```
Read your definition in .claude/actionflows/actions/code/agent.md

Input:
- task: Correct FLOWS.md registry entries. Fix: chain patterns, flow purposes, context assignments. Ensure FLOWS.md matches actual instructions.md files.
- context: Drift report batch 2 from Step 2 plan
- component: framework
```

**Batch 3 — ACTIONS.md additions:**
```
Read your definition in .claude/actionflows/actions/code/agent.md

Input:
- task: Register missing actions in ACTIONS.md. Add registry entries for actions referenced in flows but not registered. Include: action name, type, default model, purpose.
- context: Drift report batch 3 from Step 2 plan
- component: framework
```

**Gate:** All batches complete. All drift fixes applied.

---

### Step 5: Review Fixes

**Action:** `.claude/actionflows/actions/review/`
**Model:** sonnet

**Spawn after Step 4:**
```
Read your definition in .claude/actionflows/actions/review/agent.md

Input:
- scope: All flow drift fixes from Step 4 (instructions.md, FLOWS.md, ACTIONS.md changes)
- type: framework-audit-remediation
- context: Drift analysis from Step 1 showed mismatches. Verify all fixes applied correctly: (1) instructions.md now matches FLOWS.md, (2) All actions exist and are registered, (3) Abstract extensions correct, (4) Model assignments valid, (5) Input/output contracts coherent. Check that no new drift introduced.
```

**Review focuses on:**
- All identified drift instances addressed
- No new inconsistencies introduced
- Registry files (FLOWS.md, ACTIONS.md) accurate
- instructions.md files match reality
- Abstract extensions properly referenced
- Model assignments valid

**Gate:** Verdict delivered (APPROVED or NEEDS_CHANGES).

---

### Step 6: Second Opinion

**Action:** `.claude/actionflows/actions/second-opinion/`
**Model:** opus

**Spawn after Step 5:**
```
Read your definition in .claude/actionflows/actions/second-opinion/agent.md

Input:
- review-log: {log path from Step 5}
- focus: Verify flow drift remediation complete. Check: all flows now consistent between instructions.md and FLOWS.md, no missing actions, registry accurate, abstract extensions correct.
```

**Gate:** Second opinion delivered (CONCUR or DISSENT).

---

### Step 7: Handle Verdict

- **APPROVED + CONCUR** → Proceed to Step 8 (commit)
- **NEEDS_CHANGES or DISSENT** → Back to Step 4 with feedback (recompile affected batches)

---

### Step 8: Commit

**Action:** `.claude/actionflows/actions/commit/`
**Model:** haiku

**Spawn after verdict approval:**
```
Read your definition in .claude/actionflows/actions/commit/agent.md

Input:
- scope: All flow drift fixes from Step 4 (instructions.md, FLOWS.md, ACTIONS.md files)
- message_type: framework-audit
- context: Flow drift audit remediation. Fixed inconsistencies across flow registry: instructions.md corrections, FLOWS.md updates, ACTIONS.md additions. All flows now align with action implementations and framework contracts.
```

**Commit includes:**
- Updated instructions.md files
- Corrected FLOWS.md entries
- Added ACTIONS.md registrations
- Tag: `flow-audit`

---

## Dependencies

```
Step 1 → Step 2 → Step 3 (human gate) → Step 4 (parallel batches) → Step 5 → Step 6 → Step 7 (verdict gate) → Step 8
                                                                                            ↑___________________↓ (if NEEDS_CHANGES/DISSENT)
```

**Parallel groups:** Step 4 (code batches — safe because each batch modifies different files)

---

## Chains With

- ← Triggered from: Human request, periodic maintenance schedule
- → `framework-health/` (to verify audit resolved all drift)
- → `action-creation/` (if missing actions discovered during audit)
- → `flow-creation/` (if new flows needed to address gaps)

---

## Safety Guardrails

1. **Analyze before fixing** — Complete drift audit before any modifications
2. **Human approval gate** — Plan must be approved before batch fixes
3. **Parallel batches isolated** — Each batch modifies different files to avoid conflicts
4. **Review + second opinion** — All fixes validated before commit
5. **No action deletions** — Audit only adds/corrects, never removes actions/flows
6. **Preserve backward compatibility** — Fixes maintain existing flow functionality

---

## Output Artifacts

- `.claude/actionflows/logs/analyze/flow-registry-drift_{datetime}/analysis.md` — Complete drift analysis
- `.claude/actionflows/logs/plan/flow-drift-fixes_{datetime}/plan.md` — Fix plan
- `.claude/actionflows/logs/code/instructions-md-fixes_{datetime}/changes.md` — instructions.md updates
- `.claude/actionflows/logs/code/flows-md-fixes_{datetime}/changes.md` — FLOWS.md corrections
- `.claude/actionflows/logs/code/actions-md-additions_{datetime}/changes.md` — ACTIONS.md additions
- `.claude/actionflows/logs/review/flow-audit-remediation_{datetime}/review.md` — Review results
- `.claude/actionflows/logs/second-opinion/flow-audit-critique_{datetime}/opinion.md` — Second opinion

---

## 7-Point Flow Drift Checklist

For reference, here's what the analyze step checks per flow:

1. **instructions.md exists** — Flow directory contains instructions.md with correct purpose
2. **Chain matches FLOWS.md** — Chain in instructions.md matches chain in FLOWS.md registry
3. **Actions exist** — Each action referenced has an agent.md file in actions/
4. **Actions registered** — Each action appears in ACTIONS.md registry
5. **Abstract extensions correct** — agent.md files properly reference agent-standards, create-log-folder, etc.
6. **Model assignments valid** — Model specified matches ACTIONS.md defaults and is valid (sonnet, opus, haiku)
7. **Input/output contracts coherent** — Step N output feeds step N+1 input with correct data shape
