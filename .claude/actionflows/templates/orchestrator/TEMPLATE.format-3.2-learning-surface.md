<!-- Format 3.2: Learning Surface Presentation (P2) -->
<!-- Purpose: Surface agent learnings to orchestrator/human -->
<!-- Source: CONTRACT.md § Format 3.2 -->
<!-- TypeScript Type: LearningSurfaceParsed -->
<!-- Parser: parseLearningSurface(text: string) -->

---

## Required Fields

- `{action}` (string) — Action path with trailing slash
- `{model}` (enum) — "opus" | "sonnet" | "haiku"
- `{issue}` (string) — Description of what happened (quoted string)
- `{root_cause}` (string) — Why it happened (quoted string)
- `{suggested_fix}` (string) — Orchestrator's proposed solution

---

## Optional Fields

None

---

## Validation Rules

- Issue and Root cause should be quoted strings
- Suggested fix should be actionable
- Action path must be valid

---

## Template Structure

```markdown
## Agent Learning

**From:** {action} ({model})
**Issue:** "{issue}"
**Root cause:** "{root_cause}"

**Suggested fix:** {suggested_fix}

Implement?
```

---

## Example

```markdown
## Agent Learning

**From:** code/backend/auth (opus)
**Issue:** "Type check failed: UserId not imported"
**Root cause:** "Agent forgot to add import after creating new type"

**Suggested fix:** Add instruction to code/ agent.md: "After creating types in shared/, verify imports in consuming files"

Implement?
```

---

## Cross-References

- **CONTRACT.md:** § Format 3.2 — Learning Surface Presentation
- **TypeScript Type:** `LearningSurfaceParsed`
- **Parser:** `parseLearningSurface(text: string)` in `packages/shared/src/contract/parsers.ts`
- **Pattern:** `/^## Agent Learning$/m`
