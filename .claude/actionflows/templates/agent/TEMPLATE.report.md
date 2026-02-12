# Analysis Report Template

**Purpose:** Used by `analyze/` action agents to produce structured analysis reports
**Contract Reference:** CONTRACT.md § Format 5.2 (Analysis Report Structure)
**Parser:** `parseAnalysisReport` in `packages/shared/src/contract/parsers/actionParser.ts`
**Producer:** See `.claude/actionflows/actions/analyze/agent.md`

---

## Required Sections

These sections MUST be present in every analysis report:

1. **Title** (H1) — Describes what is being analyzed
2. **Metadata Header** — Agent, Date, Scope, Aspect
3. **Numbered Sections** — At least one numbered section (## 1., ## 2., etc.)
4. **Recommendations** — Actionable next steps

---

## Optional Sections

These sections are commonly used but not required:

- **Executive Summary** — High-level findings (recommended for complex analyses)
- **Appendix** — File inventory, code samples, references
- **Learnings** — Issue/Root Cause/Suggestion pattern

---

## Template Structure

```markdown
# {Analysis Title}

**Aspect:** {aspect}
**Scope:** {scope description}
**Date:** {YYYY-MM-DD}
**Agent:** analyze/

---

## Executive Summary

{High-level findings in 3-5 bullet points}

**Key Findings:**
- ✅ {Finding 1}
- ✅ {Finding 2}
- ⚠️ {Finding 3 with caveat}

---

## 1. {Section Title}

{Section content with subsections}

### 1.1 {Subsection}

{Content}

**Key Points:**
- Point 1
- Point 2

**Tables (if applicable):**
| Column1 | Column2 | Column3 |
|---------|---------|---------|
| Value   | Value   | Value   |

---

## 2. {Section Title}

{Section content}

---

## Recommendations

### {Priority} (P0/P1/P2)

**Problem:** {Description}

**Solution:** {Approach}

**Implementation:**
1. {Step}
2. {Step}

---

## Appendix: File Inventory

| File Path | Purpose | Lines |
|-----------|---------|-------|
| {path}    | {desc}  | {count} |

---

## Learnings

**Issue:** {Description}

**Root Cause:** {Analysis}

**Suggestion:** {Fix}
```

---

## Field Descriptions

### Metadata Header

- **Aspect:** Analysis type (enum: `coverage`, `dependencies`, `structure`, `drift`, `inventory`, `impact`)
- **Scope:** What is being analyzed (e.g., "packages/backend", "all test files")
- **Date:** Analysis date in YYYY-MM-DD format
- **Agent:** Always "analyze/"

### Executive Summary

- Optional but recommended for complex analyses
- Use emoji indicators: ✅ (positive finding), ⚠️ (caveat/warning), ❌ (issue found)
- 3-5 high-level bullet points

### Numbered Sections

- Use `## 1.`, `## 2.`, etc. for main sections
- Use `### 1.1`, `### 1.2` for subsections
- Tables adapt to analysis domain (no standard columns enforced)
- Common table types: File inventory, gap analysis, metric comparison

### Recommendations

- Use priority levels: P0 (critical), P1 (high), P2 (medium)
- Each recommendation should include: Problem, Solution, Implementation steps
- Be specific with file paths and actionable steps

### Learnings

- Optional section at the end
- Use the standard Issue/Root Cause/Suggestion pattern
- Include `[FRESH EYE]` insights if discovered during analysis

---

## Example

```markdown
# Backend CLI Execution Analysis

**Aspect:** structure
**Scope:** packages/backend/src/cli/
**Date:** 2026-02-13
**Agent:** analyze/

---

## Executive Summary

**Key Findings:**
- ✅ All CLI commands follow Commander.js pattern
- ✅ 100% TypeScript coverage
- ⚠️ Missing integration tests for 3 commands

---

## 1. Directory Structure

### 1.1 File Organization

| File | Purpose | Lines |
|------|---------|-------|
| packages/backend/src/cli/index.ts | CLI entry point | 45 |
| packages/backend/src/cli/commands/start.ts | Start server command | 120 |
| packages/backend/src/cli/commands/health.ts | Health check command | 80 |

---

## 2. Pattern Compliance

All commands follow the Commander.js action handler pattern:
- Type-safe options interfaces
- Zod validation for inputs
- Error handling with process.exit codes

---

## Recommendations

### P1 (High Priority)

**Problem:** Missing integration tests for `start`, `health`, and `migrate` commands

**Solution:** Create CLI integration test suite

**Implementation:**
1. Create `packages/backend/src/__tests__/cli.test.ts`
2. Mock process.exit and console output
3. Test each command with valid/invalid inputs
4. Verify exit codes match expectations

---

## Learnings

**Issue:** None — execution proceeded as expected.

**Root Cause:** N/A

**Suggestion:** N/A
```

---

## Cross-References

- **Agent Definition:** `.claude/actionflows/actions/analyze/agent.md`
- **Contract Specification:** `.claude/actionflows/CONTRACT.md` § Format 5.2
- **Parser Implementation:** `packages/shared/src/contract/parsers/actionParser.ts`
- **Related Templates:** `TEMPLATE.review-report.md`, `TEMPLATE.changes.md`
