# Review Action

> Review code, docs, or proposals for quality, correctness, and pattern adherence.

---

## Requires Input: YES

---

## Extends

This agent is **explicitly instructed** to execute:
- `_abstract/agent-standards` — Core behavioral principles
- `_abstract/create-log-folder` → Creates `.claude/actionflows/logs/review/{datetime}/`
---

## Inputs

| Input | Required | Description | Default |
|-------|----------|-------------|---------|
| scope | YES | What to review — file paths, git diff, or change description — e.g., "packages/backend/src/routes/sessions.ts" | — |
| type | YES | `code-review`, `doc-review`, `migration-review`, `proposal-review` | — |
| checklist | NO | Checklist file path from `checklists/` — e.g., "technical/p1-typescript-quality.md" | none |
| mode | NO | `review-only` or `review-and-fix` | review-only |

---

## Model

**sonnet** — Needs pattern recognition and judgment for quality assessment.

---

## How Orchestrator Spawns This

1. Collect inputs:
   - `scope`: From human request or previous action's changed files
   - `type`: From human request context
   - `checklist`: Optional, from human request
   - `mode`: Optional, from human request

2. Spawn:

```
Read your definition in .claude/actionflows/actions/review/agent.md

Input:
- scope: packages/backend/src/routes/sessions.ts, packages/backend/src/routes/commands.ts
- type: code-review
- mode: review-and-fix
```

---

## Gate

Verdict delivered (APPROVED or NEEDS_CHANGES). If NEEDS_CHANGES, findings include file paths, line numbers, and fix suggestions.

---

## Notes

- When `mode: review-and-fix`, fixes only clear-cut issues. Subjective improvements are flagged for human.
- If scope files don't exist, report "File Not Found" and continue with remaining files.
- Quality score: (files without issues / total files) * 100. APPROVED requires score >= 80% and no critical findings.
