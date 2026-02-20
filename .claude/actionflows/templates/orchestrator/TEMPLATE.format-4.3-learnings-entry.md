<!-- Format 4.3: LEARNINGS.md Entry (P4) -->
<!-- Purpose: Document a discovered pattern, issue, or solution -->
<!-- Source: CONTRACT.md § Format 4.3 -->
<!-- TypeScript Type: LearningEntryParsed -->
<!-- Parser: parseLearningEntry(text: string) -->

---

## Required Fields

- `{action_type}` (string) — Action type that discovered the learning (e.g., "code/", "review/")
- `{issue_title}` (string) — Title of the discovered issue
- `{when}` (string) — Context when this happens
- `{problem}` (string) — What goes wrong
- `{root_cause}` (string) — Why it fails
- `{solution}` (string) — How to prevent
- `{date}` (YYYY-MM-DD) — Discovery date
- `{source}` (string) — Action or chain that discovered this learning

---

## Optional Fields

- Severity indicator
- Frequency metrics
- Related learnings

---

## Validation Rules

- Must follow pattern: `### {action_type}` heading
- Followed by `#### {issue_title}` detail heading
- All required fields must be present
- Date must be YYYY-MM-DD format
- Action type should match ACTIONS.md entries

---

## Template Structure

```markdown
### {action_type}

#### {issue_title}

**When This Happens:**
{Specific conditions under which the issue occurs}

**Problem:**
{What goes wrong}

**Root Cause:**
{Why it fails}

**Solution:**
{How to prevent or fix}

**Discovered:** {date}
**Source:** {action_or_chain}
```

---

## Examples

**Parser drift issue:**
```markdown
### code/

#### CONTRACT.md Regex Drift in Template

**When This Happens:**
When a template structure is updated without updating the corresponding regex patterns, orchestrator output won't match parser expectations.

**Problem:**
Output fails to parse, creating harmony violations. Dashboard shows "parsing incomplete" for valid output.

**Root Cause:**
Templates and regex patterns stored in same file but not cross-checked during edits. Single developer can update structure without noticing pattern mismatch.

**Solution:**
1. When editing a template, search for ALL mentions of that field label within the same file
2. Update template structure, regex, examples, and documentation in lockstep
3. Run `pnpm run harmony:check` to validate before committing
4. For complex fields, maintain a "Canonical Label Forms" section at template top

**Discovered:** 2026-02-21
**Source:** template-content-audit
```

**Test flakiness pattern:**
```markdown
### test/playwright/

#### Chrome Profile Lock Blocks Parallel Test Runs

**When This Happens:**
When running multiple E2E test chains in parallel, Chrome MCP fails with "profile in use by another process" errors.

**Problem:**
Tests fail intermittently. CI can't run parallel test chains. Local development blocked when another Chrome window is open.

**Root Cause:**
Chrome enforces exclusive profile lock. Multiple MCP instances competing for same profile directory.

**Solution:**
1. Before starting test chains, check for running Chrome/Chromium processes: `pkill -f "chrome|chromium"`
2. Use separate profile directories per test run: `--user-data-dir=/tmp/chrome-profile-{uuid}`
3. Document in test agent README: "Close all Chrome windows before running E2E tests"
4. Future: Implement profile cleanup in MCP teardown

**Discovered:** 2026-02-15
**Source:** test/playwright chain failures
```

**Performance optimization:**
```markdown
### code/backend/

#### Harmony Detector Early Exit Optimization

**When This Happens:**
Harmony violations detected in large gate traces (10k+ violations) cause slow parsing and memory pressure.

**Problem:**
Detection runs are slow (>30s), consume significant memory, visible lag in dashboard.

**Root Cause:**
Detector processes entire violation history even after max violations reached. No early exit condition.

**Solution:**
Implement early exit: Stop processing violations after threshold (e.g., 100 violations per gate). Return "Violations exceed diagnostic threshold — escalate for manual review" instead of full trace.

**Discovered:** 2026-02-10
**Source:** harmony/detector code review
```

---

## Insertion into LEARNINGS.md

The LEARNINGS.md file is organized by action type with detail sections:

```markdown
## LEARNINGS

### {action_type}

#### {issue_title}

{Content}
```

**When adding a new learning:**
1. Find or create the `### {action_type}` section
2. Add the learning entry under that section
3. Keep entries sorted by discovery date (most recent first, within section)
4. Include the exact date and source action/chain

---

## Cross-References

- **CONTRACT.md:** § Format 4.3 — LEARNINGS.md Entry
- **TypeScript Type:** `LearningEntryParsed`
- **Parser:** `parseLearningEntry(text: string)` in `packages/shared/src/contract/parsers.ts`
- **Pattern:** `/^### (.+)$/m` (followed by `#### {Issue Title}`)
- **Registry File:** `.claude/actionflows/LEARNINGS.md`
- **Related Format:** Format 3.2 (Learning Surface Presentation)
