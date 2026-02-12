<!-- Format 2.1: Step Completion Announcement (P0) -->
<!-- Purpose: Announce completion of a single step during chain execution -->
<!-- Source: CONTRACT.md § Format 2.1 -->
<!-- TypeScript Type: StepCompletionParsed -->
<!-- Parser: parseStepCompletion(text: string) -->

---

## Required Fields

- `>>` (literal prefix) — Step completion marker
- `{step_num}` (integer) — Completed step number
- `{action}` (string) — Action path with trailing slash
- `{one_line_result}` (string) — Brief outcome description
- `{next_indicator}` (string) — Either "Continuing to Step {N+1}..." or "Done"

---

## Optional Fields

None

---

## Validation Rules

- Must start with ">>" prefix
- Step number must match chain definition
- Action path must match chain definition
- Next indicator must reference valid next step or indicate completion

---

## Template Structure

```markdown
>> Step {step_num} complete: {action} -- {one_line_result}. {next_indicator}
```

---

## Examples

**Sequential execution (continuing):**
```markdown
>> Step 1 complete: code/shared/types -- Added JWT types. Continuing to Step 2...
```

**Last step (completion):**
```markdown
>> Step 4 complete: commit/ -- feat: add JWT authentication (a1b2c3d). Done.
```

---

## Cross-References

- **CONTRACT.md:** § Format 2.1 — Step Completion Announcement
- **TypeScript Type:** `StepCompletionParsed`
- **Parser:** `parseStepCompletion(text: string)` in `packages/shared/src/contract/parsers.ts`
- **Pattern:** `/^>> Step (\d+) complete:/m`
