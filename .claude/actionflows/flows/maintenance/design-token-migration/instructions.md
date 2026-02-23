# Design Token Migration

> Systematic replacement of hardcoded CSS colors with design system tokens — audit-driven, file-by-file, verified.

---

## When to Use

- UI consistency audit reports hardcoded colors in CSS files
- New design token system introduced and existing styles need migration
- Theme support requires replacing hardcoded values with CSS custom properties
- `pnpm ui:audit:strict` fails due to hardcoded color count
- Manual observation of hex/rgba values that should reference the token system

---

## Required Inputs From Human

| Input | Description | Example |
|-------|-------------|---------|
| audit-command | Command that produces the audit report | `pnpm -F @afw/app ui:audit:strict` |
| category | Which audit category to tackle | `Hardcoded colors in CSS` |
| batch-size | How many files per execution cycle (optional) | `4` (default: top offenders first) |

---

## Action Sequence

### Step 1: Audit Current State

**Action:** `.claude/actionflows/actions/analyze/`
**Model:** sonnet

**Spawn:**
```
Read your definition in .claude/actionflows/actions/analyze/agent.md

Input:
- aspect: inventory
- scope: {audit-command output}
- context: Run the UI consistency audit. Parse the output to build a prioritized file list for the "{category}" category. For each file, count violations. Also inventory the design token system: read the token definition files (design-tokens.css, themes/dark.css, themes/light.css) and produce a token mapping reference — available tokens organized by category (colors, spacing, typography, shadows, etc.) with their values.

Output:
1. Prioritized file list (highest violation count first)
2. Token mapping reference (available tokens by category)
3. Total violation count (baseline)
```

**Gate:** Prioritized file list and token reference delivered.

---

### Step 2: HUMAN GATE — Approve Migration Order

Present the prioritized file list. Human reviews and decides:
- **APPROVE** — proceed with top N files (batch-size)
- **REORDER** — adjust priority or skip specific files
- **CANCEL** — abort migration

---

### Step 3: Migrate Batch (repeatable)

**Action:** `.claude/actionflows/actions/code/frontend/`
**Model:** haiku

**Spawn per file (parallelize across batch):**
```
Read your definition in .claude/actionflows/actions/code/frontend/agent.md

Input:
- task: Replace all hardcoded colors in {file} with design system tokens. Apply these rules in order:
  1. Strip hex/rgba fallback values from var() calls where the token is defined in the theme system
  2. Replace non-standard/legacy token names with standard design system equivalents
  3. Replace standalone hex colors (#xxx, #xxxxxx) with the closest semantic token
  4. Replace standalone rgba()/rgb() values with color-mix(in srgb, var(--token) N%, transparent) where appropriate
  5. Replace raw "white"/"black" with var(--btn-text-primary)/var(--palette-white) etc.
  6. Remove redundant [data-theme="dark"] overrides that become identical to base rules after token migration
  7. Replace magic pixel values with spacing/radius/font tokens where applicable
  8. Replace hardcoded z-index with z-index tokens (--z-modal, --z-dropdown, etc.)
  9. Replace hardcoded shadows with shadow tokens (--shadow-sm through --shadow-2xl)
  10. Replace hardcoded font stacks with --font-sans / --font-mono
- context: Token reference from Step 1. File: {file path}. Target: zero hardcoded color matches against the audit regex: /#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(/
```

**Gate:** File rewritten. Verify by re-running audit — file should no longer appear in top offenders.

---

### Step 4: Verify Batch

**Action:** `.claude/actionflows/actions/analyze/`
**Model:** haiku

**Spawn after Step 3 batch completes:**
```
Read your definition in .claude/actionflows/actions/analyze/agent.md

Input:
- aspect: drift
- scope: {migrated files from this batch}
- context: Re-run the UI audit command. Compare new total against baseline. Verify migrated files no longer appear in the category. Report: files cleared, new total, remaining top offenders.
```

**Gate:** Batch verification shows reduction. Updated file list for next batch.

---

### Step 5: Review Batch

**Action:** `.claude/actionflows/actions/review/`
**Model:** sonnet

**Spawn after Step 4:**
```
Read your definition in .claude/actionflows/actions/review/agent.md

Input:
- scope: All CSS files modified in this batch
- type: migration-review
- checklist: Verify:
  1. No visual regressions (token values match original intent)
  2. No undefined tokens referenced (every var() points to a defined custom property)
  3. Dark/light theme behavior preserved
  4. No audit regex matches remain in migrated files
  5. Responsive/media query styles preserved
  6. Accessibility styles (prefers-reduced-motion, prefers-contrast) preserved
```

**Gate:** Verdict delivered (APPROVED or NEEDS_CHANGES).

---

### Step 6: Batch Decision Gate

- **APPROVED** → HUMAN GATE: "Batch N complete. {X} colors removed ({baseline} → {new total}). Continue to next batch?"
  - **YES** → Return to Step 3 with next batch of files
  - **COMMIT** → Proceed to post-completion/
  - **STOP** → Halt, leave changes uncommitted for manual review
- **NEEDS_CHANGES** → Return to Step 3 for affected files with review feedback

---

## Dependencies

```
Step 1 → Step 2 (HUMAN GATE) → Step 3 → Step 4 → Step 5 → Step 6 (decision)
                                  ↑________________________________↓ (next batch or fix)
```

**Parallel groups:** Step 3 spawns parallel code agents per file within a batch (deduplicated — no file appears in multiple batches).

---

## Chains With

- → `post-completion/` (when human says COMMIT at batch decision gate)
- ← `review/ui-design-audit/` may surface the need for this flow
- ← `ui:audit:strict` CI failure triggers this flow

---

## Token Mapping Quick Reference

Common migration patterns (project-specific):

| Hardcoded Pattern | Design Token |
|-------------------|-------------|
| `var(--token, #hex)` | `var(--token)` (strip fallback) |
| `color: white` | `var(--btn-text-primary)` or `var(--palette-white)` |
| `rgba(R, G, B, A)` status colors | `color-mix(in srgb, var(--system-*) N%, transparent)` |
| `0 0 Npx rgba(...)` glow | `color-mix()` in box-shadow, or `var(--glow-*)` tokens |
| `rgba(0, 0, 0, 0.N)` overlays | `var(--overlay-dark-50)` / `var(--glass-bg-*)` |
| `#hex` standalone | Map to closest `var(--color-*)`, `var(--system-*)`, or `var(--btn-*)` |
| `z-index: N` | `var(--z-modal)`, `var(--z-dropdown)`, etc. |
| `0 Npx Npx rgba(...)` shadow | `var(--shadow-sm)` through `var(--shadow-2xl)` |
| Raw font stack | `var(--font-sans)` / `var(--font-mono)` |
| `[data-theme="dark"] .foo { same-token }` | Delete (redundant when tokens are theme-aware) |

---

## Safety Guardrails

1. **Never change design intent** — token must match the original color's purpose
2. **Verify `color-mix()` browser support** — supported in all modern browsers (2024+)
3. **Preserve SVG data URI colors** — URL-encoded hex (`%23`) doesn't match audit regex, leave as-is
4. **Batch isolation** — no file appears in more than one parallel batch (L011 learning)
5. **Re-run audit after each batch** — regression detection before proceeding
6. **Visual spot-check** — human should verify appearance after each batch if possible

---

## Output Artifacts

- `.claude/actionflows/logs/analyze/token-migration-{datetime}/analysis.md` — Baseline audit + token reference
- `.claude/actionflows/logs/code/token-migration-batch-N-{datetime}/changes.md` — Per-batch changes
- `.claude/actionflows/logs/analyze/token-migration-verify-N-{datetime}/report.md` — Per-batch verification
- `.claude/actionflows/logs/review/token-migration-batch-N-{datetime}/review.md` — Per-batch review
