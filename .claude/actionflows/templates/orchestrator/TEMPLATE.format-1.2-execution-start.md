<!-- Format 1.2: Chain Execution Start (P3) -->
<!-- Purpose: Announce the start of chain execution -->
<!-- Source: CONTRACT.md § Format 1.2 -->
<!-- TypeScript Type: ExecutionStartParsed -->
<!-- Parser: parseExecutionStart(text: string) -->

---

## Required Fields

- `{brief_title}` (string) — Same title from chain compilation
- `{step_num}` (integer) — Step number being executed
- `{action}` (string) — Action path with trailing slash
- `{model}` (enum) — "opus" | "sonnet" | "haiku"

---

## Optional Fields

- Timestamp (number, milliseconds since epoch) — Not shown in text but captured in backend

---

## Validation Rules

- Step number must match a step from compiled chain
- Action path must match compiled chain entry
- Model must match compiled chain entry

---

## Template Structure

```markdown
## Executing: {brief_title}

Spawning Step {step_num}: {action} ({model})...
```

---

## Example

```markdown
## Executing: User Authentication Implementation

Spawning Step 1: code/shared/types (sonnet)...
```

---

## Cross-References

- **CONTRACT.md:** § Format 1.2 — Chain Execution Start
- **TypeScript Type:** `ExecutionStartParsed`
- **Parser:** `parseExecutionStart(text: string)` in `packages/shared/src/contract/parsers.ts`
- **Pattern:** `/^Spawning Step (\d+): (.+) \((.+)\)$/m`
