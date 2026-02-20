<!-- Format 4.2: INDEX.md Entry (P3) -->
<!-- Purpose: Add an execution record to INDEX.md -->
<!-- Source: CONTRACT.md § Format 4.2 -->
<!-- TypeScript Type: IndexEntryParsed -->
<!-- Parser: parseIndexEntry(text: string) -->

---

## Required Fields

- `{date}` (YYYY-MM-DD) — Execution date
- `{description}` (string) — Brief work title
- `{pattern}` (string) — Chain signature (e.g., "code×2 → review → commit")
- `{outcome}` (string) — Status, metrics, and commit hash
- `{success}` (boolean, nullable) — Whether execution succeeded
- `{metrics}` (string, nullable) — Key metrics extracted from outcome

---

## Optional Fields

None

---

## Validation Rules

- Date must be in YYYY-MM-DD format
- Description should be < 80 characters
- Pattern should match actual chain structure
- Outcome should include status, metrics, and commit hash (if applicable)
- Success field derived from outcome text (Success/Completed/Done = true, Failed/Error = false)

---

## Template Structure

```markdown
| {date} | {description} | {pattern} | {outcome} |
```

---

## Examples

**Successful feature implementation:**
```markdown
| 2026-02-21 | User Authentication Implementation | code×2 → review → commit | Success — 4 files, 92% APPROVED (a1b2c3d) |
```

**Multi-agent chain with learning:**
```markdown
| 2026-02-20 | API Contract Review & Remediation | analyze → plan → code×3 → review → second-opinion → commit | Completed — 12 files, 18 findings, 8 fixed, 95% score (f4e5d6c) |
```

**Partial completion:**
```markdown
| 2026-02-19 | Database Schema Migration | code/backend → test/vitest → review | Partial — Migration complete, tests need 2 more edge cases (pending) |
```

**Failed execution:**
```markdown
| 2026-02-18 | Feature Branch Cleanup | code/frontend → lint → test/playwright | Failed — Lint errors in component file, requires human review (blocked) |
```

---

## Insertion into INDEX.md

The INDEX.md file is a table with the following structure:

```markdown
| Date | Work Title | Chain Pattern | Outcome |
|------|-----------|--------------|---------|
| {entry} |
```

**When adding a new entry:**
1. Add the row in reverse chronological order (most recent first)
2. Keep all dates in YYYY-MM-DD format
3. Include metrics in parentheses: "Success/Completed/Failed — {metric description} ({commit_hash})"

---

## Cross-References

- **CONTRACT.md:** § Format 4.2 — INDEX.md Entry
- **TypeScript Type:** `IndexEntryParsed`
- **Parser:** `parseIndexEntry(text: string)` in `packages/shared/src/contract/parsers.ts`
- **Pattern:** `/^\| (\d{4}-\d{2}-\d{2}) \|/m`
- **Registry File:** `.claude/actionflows/INDEX.md`
