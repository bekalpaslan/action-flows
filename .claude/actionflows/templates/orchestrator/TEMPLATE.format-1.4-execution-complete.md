<!-- Format 1.4: Execution Complete Summary (P4) -->
<!-- Purpose: Show final chain completion status -->
<!-- Source: CONTRACT.md § Format 1.4 -->
<!-- TypeScript Type: ExecutionCompleteParsed -->
<!-- Parser: parseExecutionComplete(text: string) -->

---

## Required Fields

- `{brief_title}` (string) — Chain title
- Table with 4 columns:
  - `{step_num}` (integer) — Step number
  - `{action}` (string) — Action path
  - `{status}` (enum) — "completed" | "failed" | "skipped"
  - `{result}` (string) — One-line outcome description
- `{logs_path}` (string) — Path to log folder (relative to project root)
- `{learnings}` (string) — Summary of key learnings or "None"

---

## Optional Fields

- `{total_steps}` (integer) — Total step count
- `{completed_steps}` (integer) — Completed count
- `{failed_steps}` (integer) — Failed count

---

## Validation Rules

- All steps from chain must be listed
- Log path must exist
- Status must be one of the enum values

---

## Template Structure

```markdown
## Done: {brief_title}

| # | Action | Status | Result |
|---|--------|--------|--------|
| {step_num} | {action} | {status} | {result} |

**Logs:** `{logs_path}`
**Learnings:** {learnings}
```

---

## Example

```markdown
## Done: User Authentication Implementation

| # | Action | Status | Result |
|---|--------|--------|--------|
| 1 | code/shared/types | completed | Added JWT types to shared/src/types/auth.ts |
| 2 | code/backend/auth | completed | Implemented middleware in backend/src/middleware/auth.ts |
| 3 | review/ | completed | APPROVED 95% - Minor suggestions only |
| 4 | commit/ | completed | feat: add JWT authentication (a1b2c3d) |

**Logs:** `.claude/actionflows/logs/2026-02-12_user-auth/`
**Learnings:** Remember to add types before implementation to avoid circular dependencies
```

---

## Cross-References

- **CONTRACT.md:** § Format 1.4 — Execution Complete Summary
- **TypeScript Type:** `ExecutionCompleteParsed`
- **Parser:** `parseExecutionComplete(text: string)` in `packages/shared/src/contract/parsers.ts`
- **Pattern:** `/^## Done: (.+)$/m`
