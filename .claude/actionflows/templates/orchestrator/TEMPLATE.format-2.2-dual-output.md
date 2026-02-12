# Format 2.2: Dual Output Template

**Purpose:** Orchestrator produces this format when combining review/audit + second-opinion outputs
**Contract Reference:** CONTRACT.md § Format 2.2 (Dual Output: Action + Second Opinion) — P2 Priority
**Parser:** `parseDualOutput` in `packages/shared/src/contract/parsers/stepParser.ts`
**Zod Schema:** `DualOutputSchema` in `packages/shared/src/contract/validation/schemas.ts`
**TypeScript Type:** `DualOutputParsed` in `packages/shared/src/contract/types/stepFormats.ts`
**Producer:** Orchestrator (NOT agents — this format aggregates agent outputs)

---

## Required Fields

These fields MUST be present in every dual output:

1. **Heading** — `### Dual Output: {action} + Second Opinion`
2. **Step Complete** — `>> Step {N} complete: {action}/ -- {result}.`
3. **Original Label** — `**Original ({review|audit}):**`
4. **Original Result** — Content between original label and second opinion label
5. **Second Opinion Label** — `**Second Opinion ({model} via Ollama):**`
6. **Second Opinion Summary** — Content between second opinion label and missed issues
7. **Missed Issues Count** — `- Missed issues: {N}`
8. **Disagreements Count** — `- Disagreements: {N}`
9. **Full Reports Label** — `**Full reports:**`
10. **Original Report Path** — `- Original: \`{path}\``
11. **Critique Report Path** — `- Critique: \`{path}\``
12. **Continuing** — `Continuing to Step {N}...`

---

## Optional Fields

These fields are optional:

- **Notable** — `- Notable: {finding}` (only if second-opinion found something significant)

---

## Template Structure

```markdown
### Dual Output: {action-name} + Second Opinion

>> Step {N} complete: {action-name}/ -- {one-line-result}.

**Original ({review|audit}):**

{Original action result — verdict, score, key findings}

**Second Opinion ({model-name} via Ollama):**

{Second opinion summary — what the critique agent found}

- Missed issues: {count}
- Disagreements: {count}
- Notable: {notable-finding}

**Full reports:**
- Original: `{path-to-original-report}`
- Critique: `{path-to-critique-report}`

Continuing to Step {N}...
```

---

## Field Descriptions

### Heading

- **Pattern:** `### Dual Output: {action} + Second Opinion`
- **Action Name:** Usually "review" or "audit"
- **Example:** `### Dual Output: review + Second Opinion`

### Step Complete

- **Pattern:** `>> Step {N} complete: {action}/ -- {result}`
- **Step Number:** Integer (e.g., 3)
- **Action:** Action path with trailing slash (e.g., "review/")
- **Result:** One-line summary (e.g., "NEEDS_CHANGES (score: 75%)")
- **Example:** `>> Step 3 complete: review/ -- NEEDS_CHANGES (score: 75%)`

### Original Label

- **Pattern:** `**Original {review|audit}**`
- **Action Type:** Must match the action being reviewed ("review" or "audit")
- **Example:** `**Original review**`

### Original Result

- **Content:** Free-form text summarizing the original agent's findings
- **Location:** Between original label and second opinion label
- **Typical Contents:**
  - Verdict (APPROVED/NEEDS_CHANGES)
  - Score percentage
  - Key findings summary
  - Critical issues highlighted

### Second Opinion Label

- **Pattern:** `**Second Opinion ({model})**`
- **Model Name:** Name of the model used for second opinion (e.g., "Haiku 3.5", "Sonnet 3.7")
- **Example:** `**Second Opinion (Haiku 3.5)**`

### Second Opinion Summary

- **Content:** Free-form text from the critique agent
- **Location:** Between second opinion label and "- Missed issues:"
- **Typical Contents:**
  - Critique of original review
  - Additional issues found
  - Points of disagreement
  - Quality assessment

### Missed Issues

- **Pattern:** `- Missed issues: {N}`
- **Count:** Integer (number of issues the original review missed)
- **Example:** `- Missed issues: 2`
- **Note:** Can be 0 if second opinion found no new issues

### Disagreements

- **Pattern:** `- Disagreements: {N}`
- **Count:** Integer (number of points where second opinion disagrees with original)
- **Example:** `- Disagreements: 1`
- **Note:** Can be 0 if full agreement

### Notable

- **Pattern:** `- Notable: {finding}`
- **Optional:** Only include if second opinion found something particularly significant
- **Example:** `- Notable: Critical security vulnerability in auth middleware missed by original review`

### Report Paths

- **Original Report Pattern:** `Original report: {path}`
- **Critique Report Pattern:** `Critique report: {path}`
- **Path Format:** Relative to project root (e.g., `.claude/actionflows/logs/review/{name}/review-report.md`)
- **Example:**
  ```
  Original report: .claude/actionflows/logs/review/auth-middleware_2026-02-13-14-30-45/review-report.md
  Critique report: .claude/actionflows/logs/review/auth-middleware_2026-02-13-14-30-45/second-opinion-critique.md
  ```

### Continuing

- **Pattern:** `Continuing with Step {N}...`
- **Step Number:** Integer (next step number)
- **Example:** `Continuing with Step 4...`

---

## Dual-Report Pattern

### Files Produced

The dual output format references TWO report files:

1. **Original Report** — `{log-folder}/review-report.md` (agent's output)
   - Full review report following Format 5.1
   - Contains findings table, verdict, score, suggestions

2. **Critique Report** — `{log-folder}/second-opinion-critique.md` (second-opinion agent's output)
   - Critique of the original review
   - Lists missed issues with severity and suggestions
   - Points of disagreement
   - Notable findings

### Orchestrator Role

The orchestrator:
1. Spawns the review/audit agent (Step N)
2. Waits for Step N to complete
3. Spawns the second-opinion agent (Step N+1)
4. Waits for Step N+1 to complete
5. **Aggregates both reports into Format 2.2 Dual Output**
6. Presents summary with missed issues + disagreements count

### Dashboard Consumption

- **Format 2.2 parser** extracts summary stats (missed issues, disagreements)
- Frontend displays both reports (side-by-side or tabbed view)
- Highlights missed issues and disagreements for human review
- Links to full reports for detailed inspection

---

## Example

```markdown
### Dual Output: review + Second Opinion

>> Step 3 complete: review/ -- NEEDS_CHANGES (score: 75%).

**Original (review):**

Verdict: NEEDS_CHANGES (75%)

Found 3 issues:
- 1 critical: Missing input validation in auth middleware
- 2 high: JWT verification doesn't check expiration, error messages expose internals

**Second Opinion (Haiku 3.5 via Ollama):**

The original review correctly identified the critical input validation issue and JWT expiration check. However, it missed two additional security concerns:

1. **Critical**: Auth middleware doesn't verify token signature algorithm, vulnerable to "none" algorithm attack
2. **High**: Session storage lacks rate limiting, enabling brute force attacks

The original review's severity assessment for error message exposure is appropriate.

- Missed issues: 2
- Disagreements: 0
- Notable: Critical security vulnerability (algorithm verification) was completely missed

**Full reports:**
- Original: `.claude/actionflows/logs/review/auth-middleware_2026-02-13-14-30-45/review-report.md`
- Critique: `.claude/actionflows/logs/review/auth-middleware_2026-02-13-14-30-45/second-opinion-critique.md`

Continuing to Step 4...
```

---

## Validation

This format is validated at three layers:

1. **Parser Layer:** `parseDualOutput()` extracts fields using regex patterns (StepPatterns.dualOutput)
2. **Schema Layer:** `DualOutputSchema` validates field types and constraints
3. **Frontend Layer:** Dashboard components display dual output with visual indicators

**Regex Patterns Used:**
```typescript
StepPatterns.dualOutput = {
  heading: /^### Dual Output: (.+) \+ Second Opinion$/m,
  stepComplete: /^>> Step (\d+) complete:/m,
  secondOpinionComplete: /^>> Step (\d+) complete: second-opinion\//m,
  originalLabel: /^\*\*Original (review|audit)\*\*$/m,
  secondOpinionLabel: /^\*\*Second Opinion \((.+)\)\*\*$/m,
  missedIssues: /^- Missed issues: (\d+)/m,
  disagreements: /^- Disagreements: (\d+)/m,
  notable: /^- Notable: (.+)/m,
  originalReport: /^Original report: (.+)/m,
  critiqueReport: /^Critique report: (.+)/m,
  continuing: /^Continuing with Step (\d+)/m,
};
```

**Run validation:**
```bash
pnpm run harmony:check
```

---

## Relationship to Format 2.1

**Format 2.1** (Step Completion Announcement) is for **single-agent steps**.

**Format 2.2** (Dual Output) is for **two-agent steps** (review + second-opinion).

**Key Difference:**
- Format 2.1: `>> Step N complete: action/ -- result. Continuing...`
- Format 2.2: `### Dual Output: action + Second Opinion` (includes both agent outputs)

**When to use:**
- Use Format 2.1 for all single-agent steps (code, analyze, test, plan, commit, etc.)
- Use Format 2.2 ONLY for review/audit steps with second-opinion enabled

---

## Cross-References

- **Contract Specification:** `.claude/actionflows/CONTRACT.md` § Format 2.2
- **Parser Implementation:** `packages/shared/src/contract/parsers/stepParser.ts`
- **TypeScript Type:** `packages/shared/src/contract/types/stepFormats.ts`
- **Zod Schema:** `packages/shared/src/contract/validation/schemas.ts`
- **Patterns:** `packages/shared/src/contract/patterns/stepPatterns.ts`
- **Related Formats:** Format 2.1 (Step Completion), Format 5.1 (Review Report)
- **Related Templates:** `agent/TEMPLATE.review-report.md`
