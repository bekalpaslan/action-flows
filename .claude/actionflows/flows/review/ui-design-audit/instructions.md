# UI Design Audit Flow

> Audit actual UI implementation against a design reference (Figma, spec, screenshot, or current tokens).

---

## When to Use

- Verifying UI implementation matches a Figma file or spec document
- Detecting visual drift between design intent and production code
- Auditing design token compliance (color, spacing, typography)
- Checking layout consistency across breakpoints
- Validating accessibility standards (WCAG 2.1) in implemented components
- Running motion/animation audits against design specs
- When human requests "UI audit", "design audit", "visual audit", "layout audit", "color audit", "motion audit", "design drift", or "UI compliance"

---

## Required Inputs From Human

| Input | Description | Example |
|-------|-------------|---------|
| referenceType | What the UI is compared against | "figma", "spec-doc", "screenshot", "tokens" |
| referencePath | Path/URL to the reference | Figma URL, spec file path, or "current" for token-based audits |
| auditType | Dimension(s) to audit | "layout", "color", "motion", "hierarchy", "accessibility", "comprehensive" |
| fixMode | Audit only or audit and fix | "audit-only" (default) or "audit-and-fix" |
| severityThreshold | Minimum severity to fix (audit-and-fix only) | "CRITICAL", "HIGH", "MEDIUM", "LOW" |

---

## Modes

### audit-only (default)
- Analyzes implementation against reference
- Produces compliance report with severity-classified findings
- No changes made to codebase
- Ends after human reviews report

### audit-and-fix
- Analyzes implementation against reference
- Human reviews findings and selects fix strategy
- Fixes findings at or above severity threshold
- Reviews all fixes before commit

---

## Audit Type Dimensions

| Dimension | What It Checks |
|-----------|---------------|
| **layout** | Grid structure, spacing, sizing, positioning, responsive behavior vs reference |
| **color** | Token usage, palette compliance, contrast ratios, hardcoded vs token drift |
| **motion** | Animations, transitions, easing curves, durations, reduced-motion support |
| **hierarchy** | Component tree structure, naming conventions, atomic design compliance |
| **accessibility** | ARIA attributes, keyboard navigation, focus management, screen reader, WCAG 2.1 |
| **comprehensive** | All 5 dimensions in a single pass |

---

## Action Sequence

### Step 1: Analyze Implementation vs Reference

**Action:** `.claude/actionflows/actions/analyze/`
**Model:** sonnet
**Waits for:** None

**Spawn:**
```
Read your definition in .claude/actionflows/actions/analyze/agent.md

Input:
- aspect: ui-design-audit
- scope: packages/app/src/
- context: |
    Reference type: {referenceType}
    Reference path: {referencePath}
    Audit type: {auditType}

    Compare the reference against the actual implementation in packages/app/src/.

    For each finding, provide:
    1. Severity: CRITICAL / HIGH / MEDIUM / LOW
    2. Dimension: layout / color / motion / hierarchy / accessibility
    3. Evidence: file path, line number, expected value vs actual value
    4. Remediation recommendation: what to change and where

    Group findings by audit type dimension.
    Produce a compliance score (percentage) for each dimension and overall.

    Severity guide:
    - CRITICAL: Broken layout, inaccessible content, missing ARIA on interactive elements
    - HIGH: Significant visual mismatch, hardcoded colors bypassing tokens, missing focus styles
    - MEDIUM: Minor spacing deviations, non-standard easing curves, naming convention drift
    - LOW: Cosmetic differences, optional enhancements, minor hierarchy suggestions
- depth: structured
```

**Gate:** Analysis delivered. Compliance score and findings produced.

---

### Step 2: HUMAN GATE

Present findings with compliance score. Offer options:

- **Accept report** (audit-only) -- End here. Report saved to logs.
- **Fix all findings above threshold** -- Proceed to Step 3 with all findings at or above `severityThreshold`
- **Fix selective** -- Human picks specific findings from the report. Proceed to Step 3 with selected findings only.
- **Reject / re-audit** -- Loop back to Step 1 with different reference or audit type

---

### Step 3: Implement Fixes (audit-and-fix only)

**Action:** `.claude/actionflows/actions/code/`
**Model:** sonnet
**Waits for:** Human approves Step 2

**Spawn after Human approves Step 2:**
```
Read your definition in .claude/actionflows/actions/code/agent.md

Input:
- task: Fix UI design audit findings from analysis report
- component: frontend
- context: |
    Fix the following findings from the UI design audit:

    {filtered findings list — only findings at or above severityThreshold, or human-selected findings}

    ## Verified Values
    {exact file paths, line numbers, expected values, and current values from analyze output}

    Rules:
    - Fix only the listed findings. Do not modify unrelated code.
    - Use design tokens where available instead of hardcoded values.
    - Preserve existing component structure unless hierarchy finding requires restructuring.
    - For accessibility fixes, follow WCAG 2.1 AA guidelines.
    - For motion fixes, include reduced-motion media query support.
```

**Gate:** Fixes implemented. Type-check passes.

---

### Step 4: Review Fixes (audit-and-fix only)

**Action:** `.claude/actionflows/actions/review/`
**Model:** sonnet
**Waits for:** Step 3

**Spawn after Step 3:**
```
Read your definition in .claude/actionflows/actions/review/agent.md

Input:
- scope: {modified files from Step 3}
- type: code-review
- context: |
    Review fixes applied for UI design audit findings.
    Verify:
    1. Each finding was addressed correctly
    2. No regressions introduced
    3. Design tokens used where applicable
    4. Accessibility fixes follow WCAG 2.1 AA
    5. Motion fixes include reduced-motion support
```

**Gate:** Fixes reviewed and APPROVED.

---

### Step 5: Second Opinion (audit-and-fix only)

**Action:** `.claude/actionflows/actions/second-opinion/`
**Model:** sonnet
**Waits for:** Step 4

Auto-inserted per second opinion protocol (review context).

**Gate:** Second opinion delivered.

---

### Step 6: Commit (audit-and-fix only)

**Action:** `.claude/actionflows/actions/commit/`
**Model:** haiku
**Waits for:** Step 5

Commit message format: `fix: UI design audit — {auditType} compliance fixes`

**Gate:** Changes committed.

---

## Dependencies

### Mode: audit-only
```
Step 1 (analyze) → Step 2 (HUMAN GATE) → END
```

### Mode: audit-and-fix
```
Step 1 (analyze) → Step 2 (HUMAN GATE) → Step 3 (code/frontend/) → Step 4 (review) → Step 5 (second-opinion/) → Step 6 (commit) → END
```

---

## Chains With

- <- Triggered when human requests "UI audit", "design audit", "visual audit", or "design drift"
- <- Triggered when design tokens are updated (design-system-sync/)
- -> code-and-review/ (to fix additional issues beyond audit scope)
- -> post-completion/ (after audit-and-fix chain completes)

---

## Example: Audit-and-Fix Mode

```
Human: "Run a color audit against our current tokens and fix anything HIGH or above"

Orchestrator Routes to: ui-design-audit/, referenceType=tokens, referencePath=current, auditType=color, fixMode=audit-and-fix, severityThreshold=HIGH

Step 1: Analyze color compliance
- Scans packages/app/src/ for color usage
- Finds 14 hardcoded hex values bypassing design tokens
- Finds 3 contrast ratio failures (< 4.5:1)
- Compliance score: 72%

Findings:
| # | Severity | File | Issue | Expected | Actual |
|---|----------|------|-------|----------|--------|
| 1 | CRITICAL | ChatPanel.tsx:45 | Contrast ratio 2.8:1 | >= 4.5:1 | #999 on #fff |
| 2 | HIGH | Sidebar.tsx:112 | Hardcoded color | var(--color-border) | #e0e0e0 |
| 3 | HIGH | Header.tsx:28 | Hardcoded color | var(--color-primary) | #3b82f6 |
| ... | ... | ... | ... | ... | ... |

Step 2: HUMAN GATE
Present findings. Human selects: "Fix all HIGH and above"

Step 3: Code agent fixes 5 findings (2 CRITICAL + 3 HIGH)
- Replaces hardcoded hex with design tokens
- Fixes contrast ratios by adjusting text color tokens

Step 4: Review — fixes verified, no regressions
Step 5: Second opinion — confirms approach
Step 6: Commit — "fix: UI design audit — color compliance fixes"

Output: 5 findings fixed. Compliance score: 72% → 89%
```

---

## Example: Audit-Only Mode

```
Human: "Do a comprehensive design audit of the dashboard against the Figma mock"

Orchestrator Routes to: ui-design-audit/, referenceType=figma, referencePath={figma-url}, auditType=comprehensive, fixMode=audit-only

Step 1: Analyze all 5 dimensions
- Layout: 91% compliant (2 spacing issues)
- Color: 85% compliant (6 token drift issues)
- Motion: 78% compliant (missing transitions, no reduced-motion)
- Hierarchy: 95% compliant (1 naming convention issue)
- Accessibility: 82% compliant (3 ARIA issues, 1 focus trap)
- Overall: 86% compliant

Step 2: HUMAN GATE
Present report. Human selects: "Accept report"

Flow ends. Report saved to logs.
```

---

## Notes

- **One code agent handles all fixes:** Do not parallelize per finding. One agent receives the full findings list.
- **Token-based audits use "current":** When `referencePath=current`, the analyzer reads the project's existing design tokens as the reference.
- **Figma references require MCP:** When `referenceType=figma`, the orchestrator uses Figma MCP tools to extract design data before spawning the analyze step.
- **Screenshot references:** When `referenceType=screenshot`, the analyzer compares visual layout described in the screenshot against the code implementation.
- **Comprehensive is all 5:** The `comprehensive` audit type runs all 5 dimensions in a single analysis pass, not as separate steps.
- **Severity threshold only applies to fixes:** The analysis always reports ALL findings regardless of threshold. The threshold filters which findings get fixed.
