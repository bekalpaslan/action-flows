<!-- Format 1.3: Chain Status Update (P4) -->
<!-- Purpose: Show updated chain state mid-execution -->
<!-- Source: CONTRACT.md § Format 1.3 -->
<!-- TypeScript Type: ChainStatusUpdateParsed -->
<!-- Parser: parseChainStatusUpdate(text: string) -->

---

## Required Fields

- `{brief_title}` (string) — Chain title
- `{changes_description}` (string) — Free-form description of what changed
- Updated table with same structure as Format 1.1 but with updated Status values
  - `{step_num}` (integer) — Step number
  - `{action}` (string) — Action path with trailing slash
  - `{model}` (enum) — "opus" | "sonnet" | "haiku"
  - `{key_inputs}` (string) — Key=value pairs
  - `{waits_for}` (string) — "--" or "#{N}"
  - `{status}` (enum) — "pending" | "running" | "completed" | "failed" | "skipped"

---

## Optional Fields

None

---

## Validation Rules

- Must contain at least one status change from original chain
- Status values must be valid enum values
- All steps from original chain must be present

---

## Template Structure

```markdown
## Chain: {brief_title} -- Updated

{changes_description}

| # | Action | Model | Key Inputs | Waits For | Status |
|---|--------|-------|------------|-----------|--------|
| {step_num} | {action} | {model} | {key_inputs} | {waits_for} | {status} |

Continuing execution...
```

---

## Example

```markdown
## Chain: User Authentication Implementation -- Updated

Steps 1-2 completed. Review in progress.

| # | Action | Model | Key Inputs | Waits For | Status |
|---|--------|-------|------------|-----------|--------|
| 1 | code/shared/types | sonnet | scope=JWT types | -- | completed |
| 2 | code/backend/auth | opus | scope=middleware | #1 | completed |
| 3 | review/ | sonnet | scope=all changes | #2 | running |
| 4 | commit/ | haiku | -- | #3 | pending |

Continuing execution...
```

---

## Cross-References

- **CONTRACT.md:** § Format 1.3 — Chain Status Update
- **TypeScript Type:** `ChainStatusUpdateParsed`
- **Parser:** `parseChainStatusUpdate(text: string)` in `packages/shared/src/contract/parsers.ts`
- **Pattern:** `/^## Chain: (.+) -- Updated$/m`
