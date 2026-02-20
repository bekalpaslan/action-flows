<!-- Format 2.3: Second Opinion Skip (P4) -->
<!-- Purpose: Announce that second-opinion step was skipped -->
<!-- Source: CONTRACT.md § Format 2.3 -->
<!-- TypeScript Type: SecondOpinionSkipParsed -->
<!-- Parser: parseSecondOpinionSkip(text: string) -->

---

## Required Fields

- `>>` (literal prefix) — Step completion marker
- `{step_num}` (integer) — Step number of second-opinion action
- `{reason}` (string) — Reason for skip (in parentheses)

---

## Optional Fields

None

---

## Validation Rules

- Must start with ">>" prefix
- Step number must be valid
- Reason must explain why second-opinion was skipped
- Pattern must match: `>> Step {N} complete: second-opinion/ -- SKIPPED ({reason})`

---

## Template Structure

```markdown
>> Step {step_num} complete: second-opinion/ -- SKIPPED ({reason})
```

---

## Examples

**Second opinion disabled:**
```markdown
>> Step 3 complete: second-opinion/ -- SKIPPED (second-opinion disabled in chain)
```

**Previous step already approved:**
```markdown
>> Step 3 complete: second-opinion/ -- SKIPPED (review already APPROVED, second-opinion not needed)
```

**Insufficient time:**
```markdown
>> Step 3 complete: second-opinion/ -- SKIPPED (execution timeout approaching)
```

---

## Cross-References

- **CONTRACT.md:** § Format 2.3 — Second Opinion Skip
- **TypeScript Type:** `SecondOpinionSkipParsed`
- **Parser:** `parseSecondOpinionSkip(text: string)` in `packages/shared/src/contract/parsers.ts`
- **Pattern:** `/^>> Step (\d+) complete: second-opinion\/ -- SKIPPED/m`
