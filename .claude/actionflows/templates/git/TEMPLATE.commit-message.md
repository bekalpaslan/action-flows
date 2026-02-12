<!-- Format G.1: Conventional Commit Message -->
<!-- Purpose: Standard git commit message format -->
<!-- Source: CLAUDE.md, ORCHESTRATOR.md § Git Conventions -->

---

## Required Fields

- `{type}` (enum) — One of: "feat" | "fix" | "refactor" | "docs" | "test" | "chore"
- `{description}` (string) — Brief one-line summary (lowercase, no period)
- `Co-Authored-By` line (literal) — Always include this exact line

---

## Optional Fields

- `{body}` (string) — Multi-line description with context and reasoning

---

## Validation Rules

- Type must be lowercase
- Description should be concise (<72 characters)
- Description should be lowercase (except for proper nouns)
- Description should NOT end with a period
- Co-author line must be exact format: `Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>`

---

## Template Structure

```
{type}: {description}

{body}

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```

---

## Examples

**Simple commit (no body):**
```
feat: add JWT authentication

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```

**Detailed commit (with body):**
```
feat: add JWT authentication

Implemented JWT-based user authentication with:
- Token generation and validation
- Auth middleware for protected routes
- Login/logout endpoints

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```

**Bug fix:**
```
fix: prevent duplicate session creation

Check for existing session before creating new one to avoid
race condition in WebSocket connection handler.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```

**Refactoring:**
```
refactor: extract auth validation into shared function

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```

---

## Commit Type Guide

| Type | When to Use | Example |
|------|-------------|---------|
| `feat` | New feature or capability | feat: add user profile editor |
| `fix` | Bug fix | fix: resolve null pointer in auth handler |
| `refactor` | Code restructuring (no behavior change) | refactor: extract validation logic |
| `docs` | Documentation only | docs: update API reference |
| `test` | Test additions or changes | test: add auth middleware tests |
| `chore` | Build, deps, tooling | chore: update dependencies |

---

## Cross-References

- **CLAUDE.md:** Git Conventions section
- **ORCHESTRATOR.md:** Commit Message Format
- **Git Hook:** `packages/hooks/prepare-commit-msg.sh`
