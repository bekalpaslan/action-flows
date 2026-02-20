<!-- Format 4.1: Registry Update (P2) -->
<!-- Purpose: Announce direct registry file modification -->
<!-- Source: CONTRACT.md § Format 4.1 -->
<!-- TypeScript Type: RegistryUpdateParsed -->
<!-- Parser: parseRegistryUpdate(text: string) -->

---

## Required Fields

- `{brief_title}` (string) — Short description of update
- `{file}` (enum) — One of: "INDEX.md" | "FLOWS.md" | "ACTIONS.md" | "LEARNINGS.md"
- `{operation}` (enum) — One of: "added" | "removed" | "updated"
- `{line_content}` (string) — The actual line content in quotes

---

## Optional Fields

None

---

## Validation Rules

- File is commonly INDEX.md, FLOWS.md, ACTIONS.md, or LEARNINGS.md, but any registry file path is valid (extensible)
- Operation must be one of the valid types
- Line content should be the exact text added/removed/updated

---

## Template Structure

```markdown
## Registry Update: {brief_title}

**File:** {file}
**Line:** {operation}: "{line_content}"

Done.
```

---

## Example

```markdown
## Registry Update: Add Authentication Chain

**File:** INDEX.md
**Line:** added: "| 2026-02-12 | User Authentication | code×2 → review → commit | Success — 4 files, APPROVED 95% (a1b2c3d) |"

Done.
```

---

## Cross-References

- **CONTRACT.md:** § Format 4.1 — Registry Update
- **TypeScript Type:** `RegistryUpdateParsed`
- **Parser:** `parseRegistryUpdate(text: string)` in `packages/shared/src/contract/parsers.ts`
- **Pattern:** `/^## Registry Update: (.+)$/m`
