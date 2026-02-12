<!-- Format 1.1: Chain Compilation Table (P0) -->
<!-- Purpose: Present compiled action chain for human approval -->
<!-- Source: CONTRACT.md § Format 1.1 -->
<!-- TypeScript Type: ChainCompilationParsed -->
<!-- Parser: parseChainCompilation(text: string) -->

---

## Required Fields

- `{brief_title}` (string) — Short descriptive title
- `{one_line_intent}` (string) — One-line description of human intent
- `{source}` (enum) — One of:
  - Flow name (e.g., "code-and-review/")
  - "Composed from: {action1} + {action2} + ..."
  - "Meta-task"
- Table with 6 columns:
  - `{step_num}` (integer) — Step number (sequential from 1)
  - `{action}` (string) — Action path with trailing slash (e.g., "code/backend/")
  - `{model}` (enum) — "opus" | "sonnet" | "haiku"
  - `{key_inputs}` (string) — Key=value pairs describing inputs
  - `{waits_for}` (string) — "--" for no dependency, or "#{N}" for step dependency
  - `{status}` (enum) — "pending" | "running" | "completed" | "failed" | "skipped"
- `{execution_mode}` (enum) — "Sequential" | "Parallel: [{steps}] -> [{steps}]" | "Single step"
- Numbered list describing what each step does

---

## Optional Fields

None (all fields required)

---

## Validation Rules

- Step numbers must be sequential starting from 1
- Waits For references must point to valid step numbers
- Action paths must end with "/"
- At least 1 step required
- Status values must be valid enum values

---

## Template Structure

```markdown
## Chain: {brief_title}

**Request:** {one_line_intent}
**Source:** {source}

| # | Action | Model | Key Inputs | Waits For | Status |
|---|--------|-------|------------|-----------|--------|
| {step_num} | {action} | {model} | {key_inputs} | {waits_for} | {status} |

**Execution:** {execution_mode}

What each step does:
{step_num}. **{action}** -- {step_description}

Execute?
```

---

## Example

```markdown
## Chain: User Authentication Implementation

**Request:** Add JWT-based user authentication
**Source:** code-and-review/

| # | Action | Model | Key Inputs | Waits For | Status |
|---|--------|-------|------------|-----------|--------|
| 1 | code/shared/types | sonnet | scope=JWT types | -- | pending |
| 2 | code/backend/auth | opus | scope=middleware | #1 | pending |
| 3 | review/ | sonnet | scope=all changes | #2 | pending |
| 4 | commit/ | haiku | -- | #3 | pending |

**Execution:** Sequential

What each step does:
1. **code/shared/types** -- Add JWT token types to shared package
2. **code/backend/auth** -- Implement auth middleware with JWT validation
3. **review/** -- Review all authentication changes for security
4. **commit/** -- Commit changes with conventional commit message

Execute?
```

---

## Cross-References

- **CONTRACT.md:** § Format 1.1 — Chain Compilation Table
- **TypeScript Type:** `ChainCompilationParsed`
- **Parser:** `parseChainCompilation(text: string)` in `packages/shared/src/contract/parsers.ts`
- **Pattern:** `/^## Chain: (.+)$/m`
