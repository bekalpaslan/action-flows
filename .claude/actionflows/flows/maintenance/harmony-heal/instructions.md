# Harmony Heal Flow

> Layer-aware healing: diagnose root cause, classify the layer, fix with the right tool, verify with the right proof.

---

## When to Use

- Harmony violations detected at gate checkpoints
- Human says "fix harmony violations" or "heal"
- Gates report persistent parsing or contract validation failures
- Backend parser rejects orchestrator output
- Hook lifecycle fails silently
- Framework instructions produce output that doesn't match CONTRACT.md

---

## Required Inputs From Human

| Input | Description | Example |
|-------|-------------|---------|
| issue | What's broken or violated | "Gate 4 rejects chain compilation — missing status column" |
| context | (optional) Where it manifests | "Parser returns null on Format 1.1 output" |

---

## Action Sequence

### Step 1: Root Cause Analysis + Layer Classification

**Action:** `.claude/actionflows/actions/analyze/`
**Model:** sonnet

**Spawn:**
```
Read your definition in .claude/actionflows/actions/analyze/agent.md

Input:
- aspect: impact
- scope: .claude/actionflows/, packages/shared/src/contract/, packages/hooks/src/, packages/backend/src/
- context: Harmony violation: {issue from human}. {context if provided}.

Your analysis MUST classify the root cause into exactly ONE of these layers:

  LAYER: backend
  Meaning: The bug is in TypeScript code — a parser, detector, Zod schema, route handler, or storage logic
  is wrong. The code compiles and runs but produces incorrect results or rejects valid input.
  Signals: Parser returns null/undefined on valid input. Zod schema too strict/loose. Type mismatch
  between shared types and backend usage. Test failures. Runtime errors in deterministic code.
  Fix target: packages/backend/src/, packages/shared/src/

  LAYER: framework
  Meaning: The bug is in markdown instructions — ORCHESTRATOR.md, an agent.md, a flow instructions.md,
  or CONTRACT.md is wrong or stale. The instructions cause Claude to produce output that doesn't match
  what the backend expects.
  Signals: Orchestrator output doesn't match CONTRACT.md format spec. Agent.md instructions reference
  wrong paths. Flow instructions.md has incorrect step ordering. CONTRACT.md spec is outdated vs actual
  parser behavior.
  Fix target: .claude/actionflows/

  LAYER: hooks
  Meaning: The bug is in a Claude Code lifecycle hook — a TypeScript script in packages/hooks/ that
  fires on events but produces wrong output, fails silently, or isn't registered in settings.json.
  Signals: Hook doesn't fire (missing registration). Hook fires but sends wrong data to backend.
  Hook crashes silently. Hook utils (http/parser/settings) have bugs.
  Fix target: packages/hooks/src/

Output format — your analysis report MUST end with:

## Layer Classification
- **Layer:** {backend | framework | hooks}
- **Root cause:** {one sentence}
- **Fix target:** {specific file path(s)}
- **Confidence:** {high | medium | low}
```

**Gate:** Root cause analysis delivered with layer classification. MUST include Layer, Root cause, Fix target, and Confidence.

---

### Step 2: Apply Fix (Layer-Branching)

After Step 1, exactly ONE branch executes based on the classified layer.

#### Branch A: Backend Fix

**Action:** `.claude/actionflows/actions/code/backend/`
**Model:** haiku

**Spawn if Layer = backend:**
```
Read your definition in .claude/actionflows/actions/code/backend/agent.md

Input:
- task: Fix: {root cause from Step 1}. Target: {fix target files from Step 1}.
- context: {full analysis from Step 1}. Ensure backward compatibility — the fix must handle both the previously-failing input AND all existing valid inputs.
```

**Gate:** Code change implemented, `pnpm -F @afw/backend type-check` passes.

---

#### Branch B: Framework Fix

**Action:** `.claude/actionflows/actions/code/`
**Model:** haiku

**Spawn if Layer = framework:**
```
Read your definition in .claude/actionflows/actions/code/agent.md

Input:
- task: Fix: {root cause from Step 1}. Target: {fix target files from Step 1}. Update the markdown instructions/contract so that the output they describe matches what the backend parser actually expects. Include or update examples.
- context: {full analysis from Step 1}
- component: framework
```

**Gate:** Instruction or contract file updated. Examples in the file produce output matching CONTRACT.md format patterns.

---

#### Branch C: Hooks Fix

**Action:** `.claude/actionflows/actions/code/hooks/`
**Model:** haiku

**Spawn if Layer = hooks:**
```
Read your definition in .claude/actionflows/actions/code/hooks/agent.md

Input:
- task: Fix: {root cause from Step 1}. Target: {fix target files from Step 1}.
- context: {full analysis from Step 1}. Ensure the hook builds, is registered in settings.json, and handles the event data shape correctly.
```

**Gate:** Hook code updated, `pnpm -F @afw/hooks build` passes, settings registration verified.

---

### Step 3: Layer-Aware Verification

**Action:** `.claude/actionflows/actions/verify/`
**Model:** haiku

**Spawn after Step 2 (any branch):**
```
Read your definition in .claude/actionflows/actions/verify/agent.md

Input:
- layer: {layer from Step 1: backend | framework | hooks}
- scope: {changed files from Step 2}
- issue: {original issue from human + root cause from Step 1}
```

**Gate:** Verdict is VERIFIED. If FAILED or PARTIAL → loop back to Step 2 with verification failure details (max 2 retries).

---

### Step 4: Review Fix

**Action:** `.claude/actionflows/actions/review/`
**Model:** sonnet

**Spawn after Step 3 (VERIFIED):**
```
Read your definition in .claude/actionflows/actions/review/agent.md

Input:
- scope: {changed files from Step 2}
- type: code-review
- context: Harmony healing fix. Layer: {layer}. Original issue: {issue}. Root cause: {root cause from Step 1}. Verification: VERIFIED (see Step 3 report). Focus on: Does fix resolve the root cause without introducing new issues? Is backward compatibility maintained?
```

**Gate:** Verdict APPROVED.

---

### Step 5: Commit

**Action:** `.claude/actionflows/actions/commit/`
**Model:** haiku

**Spawn after Step 4 (APPROVED):**
```
Read your definition in .claude/actionflows/actions/commit/agent.md

Input:
- summary: fix({layer}): {one-line root cause summary from Step 1}
- files: {changed files from Step 2}
```

**Gate:** Commit created.

---

## Dependencies

```
Step 1 → Step 2 (branch: A | B | C) → Step 3 → Step 4 → Step 5
                                         ↑          |
                                         └──────────┘ (if FAILED/PARTIAL, max 2 retries)
```

**Parallel groups:** None — sequential with verification gate and retry loop.

---

## Chains With

- ← Triggered from: Harmony Health Dashboard, gate violations, human request
- → `framework-health/` (to confirm drift is cleared post-fix)
- → `post-completion/` (after commit for registry update)

---

## Safety Guardrails

1. **Classify before fixing** — Layer classification is mandatory. Wrong layer = wrong fix = wasted work.
2. **Verify before reviewing** — The verify/ action provides **proof**, not opinion. Review comes after proof.
3. **Layer-appropriate proof:**
   - Backend: type-check + tests + parser sample = deterministic proof
   - Framework: contract cross-reference + synthetic parse = best-effort validation
   - Hooks: build + registration + type-check = structural proof
4. **Retry limit** — Max 2 verification retries. If fix fails verification twice, escalate to human.
5. **Backward compatibility** — All fixes must handle existing valid inputs, not just the failing case.
6. **No cross-layer contamination** — A backend fix should not require framework changes (and vice versa). If analysis reveals cross-layer issues, spawn separate healing chains per layer.

---

## Output Artifacts

- `.claude/actionflows/logs/analyze/{description}_{datetime}/report.md` — Root cause + layer classification
- `.claude/actionflows/logs/code/{description}_{datetime}/changes.md` — Fix implementation log
- `.claude/actionflows/logs/verify/{description}_{datetime}/verification-report.md` — Layer-specific verification
- `.claude/actionflows/logs/review/{description}_{datetime}/review-report.md` — Review results
