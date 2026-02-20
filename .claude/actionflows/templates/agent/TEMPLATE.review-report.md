# Review Report Template

**Purpose:** Used by `review/` action agents to produce contract-defined review reports
**Contract Reference:** CONTRACT.md § Format 5.1 (Review Report Structure) — P1 Priority
**Parser:** `parseReviewReport` in `packages/shared/src/contract/parsers/actionParser.ts`
**Zod Schema:** `ReviewReportSchema` in `packages/shared/src/contract/validation/schemas.ts`
**Producer:** See `.claude/actionflows/actions/review/agent.md`

---

## Required Sections

These sections MUST be present in every review report:

1. **Title** — `# Review Report: {scope}`
2. **Verdict** — `## Verdict: {APPROVED | NEEDS_CHANGES}`
3. **Score** — `## Score: {0-100}%`
4. **Summary** — 2-3 sentence overview
5. **Findings** — Table with 6 columns (can be empty if no findings)

---

## Optional Sections

These sections are conditional:

- **Fixes Applied** — Required if `mode = review-and-fix`, otherwise omit or state "N/A"
- **Flags for Human** — Include only if issues require human judgment
- **Learnings** — Optional Issue/Root Cause/Suggestion pattern

---

## Template Structure

```markdown
# Review Report: {scope}

## Verdict: {APPROVED | NEEDS_CHANGES}
## Score: {0-100}%

## Summary

{2-3 sentence overview of review findings}

## Findings

| # | File | Line | Severity | Description | Suggestion |
|---|------|------|----------|-------------|------------|
| 1 | {path} | {line} | {critical|high|medium|low} | {description} | {suggestion} |
| 2 | {path} | {line-range} | {severity} | {description} | {suggestion} |

## Fixes Applied

{List of fixes applied in review-and-fix mode}

Or: N/A — mode is review-only

## Flags for Human

| Issue | Why Human Needed |
|-------|-----------------|
| {issue} | {explanation} |

## Learnings

**Issue:** {Description}

**Root Cause:** {Analysis}

**Suggestion:** {Fix}

**[FRESH EYE]** {Additional insights}
```

---

## Field Descriptions

### Verdict

- **Type:** Enum (`APPROVED` | `NEEDS_CHANGES`)
- **Validation:** Enforced by Zod schema
- **Optional qualifiers:** Can include notes in parentheses (e.g., "APPROVED (with recommendations)")
- **Lowercase allowed:** Parser accepts "APPROVED", "Approved", "approved"

### Score

- **Type:** Integer (0-100)
- **Validation:** Range enforced by Zod schema
- **Format:** Must include `%` symbol (e.g., "85%")
- **Calculation:** Suggested formula: `(files_without_issues / total_files) * 100`

### Summary

- **Length:** 2-3 sentences
- **Purpose:** High-level overview of findings
- **Content:** Brief description of what was reviewed and overall assessment

### Findings Table

**Required columns (in order):**

| Column | Type | Description | Example |
|--------|------|-------------|---------|
| **#** | Integer | Finding number (sequential: 1, 2, 3...) | `1` |
| **File** | String | Relative path from project root | `packages/backend/src/routes/session.ts` |
| **Line** | Integer | Single line number only | `42` |
| **Severity** | Enum | `critical` \| `high` \| `medium` \| `low` (lowercase) | `high` |
| **Description** | String | What the issue is (with code context if helpful) | Missing input validation for sessionId parameter |
| **Suggestion** | String | How to fix it (with code examples if applicable) | Add Zod validation: `z.object({ sessionId: z.string() })` |

**Empty table:** If no findings, include table header with no rows (or a single row stating "No issues found")

### Fixes Applied

**When to include:**
- If `mode = review-and-fix`, list all fixes applied
- If `mode = review-only`, state "N/A — mode is review-only"

**Format:**
```markdown
## Fixes Applied

| File | Fix |
|------|-----|
| packages/backend/src/routes/session.ts | Added Zod validation for sessionId |
| packages/app/src/components/Panel.tsx | Fixed missing key prop in map |
```

### Flags for Human

**When to include:**
- Only if issues require human judgment
- Examples: Architecture changes, API contract changes, feature design decisions

**Format:**
```markdown
## Flags for Human

| Issue | Why Human Needed |
|-------|-----------------|
| Change WebSocket message format | Breaking change requires human approval |
| Rename SessionId to SessionUID | Impacts all packages, requires coordinated migration |
```

### Learnings

- Optional section at the end
- Use the standard Issue/Root Cause/Suggestion pattern
- Include `[FRESH EYE]` insights from second-opinion perspective (if applicable)

---

## Example

```markdown
# Review Report: Auth middleware implementation

## Verdict: NEEDS_CHANGES
## Score: 75%

## Summary

The auth middleware implementation is mostly correct but has 3 critical security issues that must be addressed before approval. The code follows Express patterns and has proper TypeScript types, but input validation and error handling need improvements.

## Findings

| # | File | Line | Severity | Description | Suggestion |
|---|------|------|----------|-------------|------------|
| 1 | packages/backend/src/middleware/auth.ts | 15 | critical | Missing input validation for `Authorization` header | Add Zod validation: `z.string().min(1).startsWith('Bearer ')` |
| 2 | packages/backend/src/middleware/auth.ts | 23 | high | JWT verification doesn't check token expiration | Use `jwt.verify()` with `expiresIn` option |
| 3 | packages/backend/src/middleware/auth.ts | 45 | medium | Error messages expose internal details | Use generic "Unauthorized" message instead of stack traces |

## Fixes Applied

N/A — mode is review-only

## Flags for Human

| Issue | Why Human Needed |
|-------|-----------------|
| Token refresh strategy | Need product decision: automatic refresh vs manual re-auth |

## Learnings

**Issue:** None — execution proceeded as expected.

**Root Cause:** N/A

**Suggestion:** N/A

**[FRESH EYE]** Consider adding rate limiting to prevent brute force attacks on auth endpoints.
```

---

## Validation

This format is validated at three layers:

1. **Parser Layer:** `parseReviewReport()` extracts fields using regex patterns
2. **Schema Layer:** `ReviewReportSchema` validates field types and constraints
3. **Frontend Layer:** Dashboard components display findings with severity badges

**Run validation:**
```bash
pnpm run harmony:check
```

---

## Cross-References

- **Agent Definition:** `.claude/actionflows/actions/review/agent.md`
- **Contract Specification:** `.claude/actionflows/CONTRACT.md` § Format 5.1
- **Parser Implementation:** `packages/shared/src/contract/parsers/actionParser.ts`
- **Zod Schema:** `packages/shared/src/contract/validation/schemas.ts`
- **Frontend Component:** (Planned) `ReviewReportViewer` component
- **Related Templates:** `TEMPLATE.report.md`, `TEMPLATE.changes.md`
