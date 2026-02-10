# Contract Compliance Audit Flow

> Audit behavioral contracts for quality, code drift, and compliance with templates. Remediate inconsistencies and create compliance test suites.

---

## Purpose

Performs a comprehensive audit of behavioral contract specifications against contract templates, actual component implementations, and compliance standards. Detects missing sections, stale selectors, props mismatches, file path errors, and creates automated compliance test suites to prevent future drift.

## When to Use

- Periodic contract quality sweeps (weekly/biweekly)
- Before releases (ensure all contracts current)
- After major component refactoring (selectors may have changed)
- When compliance test suite reports failures
- When human requests "audit contracts", "check contract quality", or "verify contract compliance"

## Chain Pattern

analyze×2 (parallel) → plan → human gate → code×2 (parallel) → review → second-opinion/ → commit

## Inputs

| Input | Required | Description | Default |
|-------|----------|-------------|---------|
| scope | No | Narrow audit scope | "all" (all 99 contracts) |
| categories | No | Comma-separated audit categories | "quality,drift" (both) |
| remediate | No | Auto-fix detected issues? | false (report-only) |

### Scope Examples
- "all" — Audit all 99 contracts
- "components/Button" — Audit Button component and descendants
- "hooks/" — Audit all hook contracts
- "contexts/SessionContext" — Audit specific context

### Categories
- "quality" — Internal completeness vs TEMPLATE
- "drift" — Code mismatch (props, CSS, selectors vs actual implementation)

---

## Action Sequence

### Steps 1-2: Layer Analysis (Parallel)

Two analyze/ agents run in parallel:

#### Step 1 — Quality Audit (analyze/, sonnet)

**Scope:** packages/app/src/contracts/ + TEMPLATE.contract.md

**Task:** Internal quality audit across all contracts in scope.

For each contract file, verify:
- All sections present (Selector, Props, Events, Context, Accessibility, etc. per TEMPLATE)
- No placeholder text ("TODO", "FIXME")
- Props descriptions complete and accurate
- CSS selectors match section format (e.g., "`.chat-panel__input`")
- Event documentation complete (trigger, payload)
- File path in header correct (matches actual file location)
- Links to implementation files valid (packages/app/src/{component-path}.tsx)
- Grammar, formatting, consistency

Produce: Manifest of inconsistencies (section-by-section) with severity (CRITICAL, HIGH, MEDIUM, LOW).

**Spawn:**
```
Read your definition in .claude/actionflows/actions/analyze/agent.md

Input:
- aspect: contract-quality-audit
- scope: {scope from human, default "all"}
- baseline: packages/app/src/contracts/TEMPLATE.contract.md
- contracts-dir: packages/app/src/contracts/

Task:
Compare each contract against TEMPLATE. Document:
1. Missing sections or incomplete documentation
2. Stale placeholders or TODOs
3. Props descriptions mismatches (missing, vague, typos)
4. File path errors (contract header vs actual file)
5. Selector format violations (not markdown code-quoted)
6. Broken internal links to implementation files
7. Grammar, consistency issues

Output JSON structure:
{
  "summary": "N issues found: C critical, H high, M medium, L low",
  "contracts": [
    {
      "file": "components/Button.contract.md",
      "issues": [
        {"category": "missing-section", "section": "Accessibility", "severity": "HIGH"},
        {"category": "placeholder", "text": "TODO", "location": "Props.description", "severity": "CRITICAL"},
        ...
      ]
    }
  ],
  "manifest": {...}
}
```

**Gate:** Quality audit report delivered.

---

#### Step 2 — Code Drift Detection (analyze/, sonnet)

**Scope:** packages/app/src/components/, packages/app/src/contexts/, packages/app/src/hooks/ + corresponding .contract.md files

**Task:** Compare contract specs against actual implementation code.

For each contract, extract documented props/events/selectors, then inspect actual component:
- Props: verify all documented props exist in component interface
- CSS selectors: verify all documented selectors exist in component JSX/CSS
- Events: verify all documented event types match actual emitted events
- Context: verify context shape matches documented structure
- Deprecated props: flag if contract documents props no longer in code

Produce: Manifest of code drift (what's in contract but not code, what's in code but not documented).

**Spawn:**
```
Read your definition in .claude/actionflows/actions/analyze/agent.md

Input:
- aspect: contract-code-drift-audit
- scope: {scope from human, default "all"}
- contracts-dir: packages/app/src/contracts/
- components-dir: packages/app/src/components/
- contexts-dir: packages/app/src/contexts/
- hooks-dir: packages/app/src/hooks/

Task:
For each contract in scope:
1. Parse contract: extract Props (name, type), Events, Selectors, Context shape
2. Locate implementation file
3. Compare:
   - Props: check component TypeScript interface vs documented props
   - Selectors: grep for CSS class names in component JSX vs documented selectors
   - Events: identify event emissions (custom events, callbacks) vs documented Events
   - Context: verify context shape vs documented Context section
4. Report mismatch (missing, added, modified) with file locations and line numbers

Output JSON structure:
{
  "summary": "N drifts detected: C critical, H high, M medium, L low",
  "drifts": [
    {
      "file": "components/Button.contract.md",
      "type": "props",
      "issues": [
        {"issue": "missing-in-code", "prop": "aria-label", "contract-line": 45},
        {"issue": "missing-in-contract", "prop": "data-testid", "impl-line": 123},
        ...
      ]
    }
  ],
  "manifest": {...}
}
```

**Gate:** Code drift report delivered.

---

### Step 3: Synthesis Plan (plan/, sonnet)

Waits for Steps 1-2. Reads both audit reports and synthesizes into prioritized remediation plan.

**Spawn:**
```
Read your definition in .claude/actionflows/actions/plan/agent.md

Input:
- quality-audit-report: {Step 1 output}
- code-drift-report: {Step 2 output}
- contracts-dir: packages/app/src/contracts/
- template: packages/app/src/contracts/TEMPLATE.contract.md

Task:
Synthesize both reports into a single prioritized remediation plan.

For each issue from both reports:
1. Assign priority:
   - P0 CRITICAL: Contract has placeholder text, file path broken, or references non-existent implementation
   - P1 HIGH: Missing section vs TEMPLATE, prop/selector mismatch affecting functionality
   - P2 MEDIUM: Grammar, formatting, minor documentation gaps
   - P3 LOW: Consistency improvements, style refinements

2. Group by target file and remediation type:
   - CONTRACT_FIX: Update .contract.md content
   - TEST_CREATION: Add compliance test

Output:
- Prioritized list of contracts to fix (sorted P0 → P3)
- For each contract: exact remediation steps
- List of new compliance tests to create (test file, test cases)
- Suggested test scope (completeness, props-match, css-classes, file-paths, health-selectors)
```

**Gate:** Synthesis plan delivered.

---

### Step 4: HUMAN GATE

Present remediation plan. Human chooses:
- **Accept All:** Proceed with full remediation (P0+P1+P2+P3)
- **P0 Only:** Fix only critical issues
- **P0+P1:** Fix critical and high issues
- **Modify:** Adjust plan (remove/add items), loop back to Step 3
- **Reject:** Flow ends

---

### Steps 5-6: Remediation (Parallel Batches)

Two code/ agents run in parallel after human approval:

#### Step 5 — Contract Content Fixes (code/, haiku)

**Task:** Update .contract.md files per plan.

For each approved contract fix:
- Fix missing sections (add from TEMPLATE with filled-in values)
- Remove placeholder text (complete documentation)
- Correct file paths (update header to match actual file location)
- Fix selector format (ensure markdown code-quoting)
- Update props/events descriptions (per drift report findings)
- Verify grammar, consistency

**Spawn:**
```
Read your definition in .claude/actionflows/actions/code/agent.md

Input:
- task: Update contract files per remediation plan
- remediation-plan: {Step 3 plan, approved in Step 4}
- target-fixes: {P0, P0+P1, or all per human choice}
- contracts-dir: packages/app/src/contracts/
- template: packages/app/src/contracts/TEMPLATE.contract.md
- line-endings: LF (enforced by .gitattributes)

Specific instructions:
- For each contract fix in plan:
  1. Read current contract file
  2. Apply fixes (sections, text, paths, selectors)
  3. Verify line endings are LF (not CRLF)
  4. Write updated file
- Do NOT create new contracts, only update existing
- Do NOT modify test files
```

**Gate:** All approved contract fixes complete.

---

#### Step 6 — Compliance Test Suite Creation (code/, haiku)

**Task:** Create/update compliance test suites per plan.

Compliance test suites live in packages/app/src/__tests__/contracts/ and test:
1. **completeness-test.ts** — Each contract has all TEMPLATE sections
2. **file-paths-test.ts** — Contract file paths match actual files
3. **props-match-test.ts** — Documented props exist in component code
4. **css-classes-test.ts** — Documented selectors exist in component JSX
5. **health-selectors-test.ts** — Selectors follow naming conventions (BEM, aria-*, data-*)

**Spawn:**
```
Read your definition in .claude/actionflows/actions/code/agent.md

Input:
- task: Create/update compliance test suites
- remediation-plan: {Step 3 plan, approved in Step 4}
- test-categories: {from plan Step 3, e.g., "completeness, props-match, css-classes"}
- contracts-dir: packages/app/src/contracts/
- tests-dir: packages/app/src/__tests__/contracts/
- template: packages/app/src/contracts/TEMPLATE.contract.md
- test-command: pnpm -F @afw/app test -- contract

For each test category:
1. Update or create test file (e.g., packages/app/src/__tests__/contracts/props-match-test.ts)
2. For each contract in scope:
   - Add test case covering the compliance rule
   - Use contract manifest data to validate
3. Ensure tests run via `pnpm -F @afw/app test -- contract`
4. Ensure tests pass (if failures, fix contract first, then test)

Test structure:
- Use Vitest
- Each test case: contract file → parse contract → extract expected values → validate against actual code/file
- Clear error messages (e.g., "Button.contract.md missing 'Accessibility' section")
- Focus on the 5 compliance dimensions (completeness, file-paths, props-match, css-classes, health-selectors)
```

**Gate:** All compliance tests created/updated and passing.

---

### Step 7: Review Changes

**Action:** `.claude/actionflows/actions/review/`
**Model:** sonnet

Waits for Steps 5-6.

**Spawn:**
```
Read your definition in .claude/actionflows/actions/review/agent.md

Input:
- scope: All updated contract files + new/updated test files from Steps 5-6
- type: code-review
- focus:
  - Contract fixes follow TEMPLATE and remediation plan
  - Test coverage: all contracts tested against compliance rules
  - Line endings: all files use LF (not CRLF)
  - No regressions: test suite passes
```

**Gate:** All changes reviewed and approved.

---

### Step 8: Second Opinion

**Action:** `.claude/actionflows/actions/second-opinion/`
**Model:** haiku

Auto-inserted after Step 7. Critiques review findings.

**Gate:** Second opinion delivered.

---

### Step 9: Commit Changes

**Action:** `.claude/actionflows/actions/commit/`
**Model:** haiku

Waits for Step 8.

**Spawn:**
```
Read your definition in .claude/actionflows/actions/commit/agent.md

Input:
- summary: chore: audit and fix contract compliance issues
- detail: |
  - Quality audit: N contracts fixed (missing sections, placeholders removed, paths corrected)
  - Code drift: N contracts updated (props, selectors, events synced with code)
  - Compliance tests: M test suites created/updated (completeness, props-match, css-classes, file-paths, health-selectors)
  - All tests passing
- files: All modified contract files + all modified/new test files
```

**Gate:** Commit successful.

---

## Dependencies

```
[Step 1: Quality]  ──┐
[Step 2: Drift]    ──┼──→ [Step 3: Plan] → [Step 4: HUMAN GATE] ──┬──→ [Step 5: Fix Contracts]
                      └──────────────────────────────────────────┼──→ [Step 6: Create Tests] ──┐
                                                                 ├──→ [Step 7: Review] → [Step 8: Second Opinion] → [Step 9: Commit]
                                                                 └────────────────────────────────────────────────────────────┘
```

**Parallel groups:**
- Steps 1-2: Parallel analyze agents
- Steps 5-6: Parallel code agents (after human gate)

---

## Chains With

- → `code-and-review/` (if complex fixes needed beyond plan scope)
- → `post-completion/` (after Step 9 commit)
- ← Manual trigger from human
- ← Can chain after `contract-index/` to verify new contracts

---

## Verified Selectors/Values

**CLI Tool:**
```bash
pnpm -F @afw/app ts-node src/contracts/check-compliance.ts
```

**Test Command:**
```bash
pnpm -F @afw/app test -- contract
```

**Contract Directories:**
- contracts: packages/app/src/contracts/
- tests: packages/app/src/__tests__/contracts/
- template: packages/app/src/contracts/TEMPLATE.contract.md

**Line Endings:** LF only (enforced by .gitattributes, CRLF breaks regex in test suite)

---

## Examples

**Full Audit (All Contracts, All Categories):**
```
Human: "audit contracts"
Orchestrator: [Routes to contract-compliance-audit/, scope="all", categories="quality,drift", remediate=false]
Step 1: Quality audit finds 12 issues (3 P0, 5 P1, 4 P2)
Step 2: Code drift audit finds 8 mismatches (2 P0, 4 P1, 2 P2)
Step 3: Plan synthesizes: 20 total items, grouped by contract
Step 4: Human approves all (P0+P1+P2)
Step 5: 20 contracts fixed, compliance tests updated
Step 7: Review confirms all fixes applied correctly
Step 9: All changes committed
```

**Scoped Audit (Button Component Only):**
```
Human: "audit contracts for Button components"
Orchestrator: [Routes to contract-compliance-audit/, scope="components/Button"]
Output: Audits only Button and Button-related contracts (Button, ButtonGroup, etc.)
```

**P0-Only Remediation:**
```
Human: "audit contracts and fix only critical issues"
Orchestrator: [Routes to contract-compliance-audit/, scope="all", remediate=true]
Step 4: Human chooses "P0 Only"
Result: Only 3 critical contracts fixed, no P1/P2 work done
```

---

## Related Documentation

- **TEMPLATE:** packages/app/src/contracts/TEMPLATE.contract.md (source of truth for contract structure)
- **CLI Tool:** packages/app/src/contracts/check-compliance.ts (runs compliance checks)
- **Test Suites:** packages/app/src/__tests__/contracts/ (compliance test definitions)
- **Contract Index:** contracts/contract-index/ flow (create new contracts)
