# Review Action

> Review code, docs, or proposals for quality, correctness, and pattern adherence.

---

## Requires Input: YES

---

## Extends

This agent is **explicitly instructed** to execute:
- `_abstract/agent-standards` — Core behavioral principles
- `_abstract/create-log-folder` → Creates `.claude/actionflows/logs/review/{datetime}/`
- `_abstract/post-notification` → Posts verdict notification (currently not configured)

**You don't need to spawn a separate `notify` action after this action.**

---

## Inputs

| Input | Required | Description | Default |
|-------|----------|-------------|---------|
| scope | YES | What to review — file paths, git diff output, or change description. Example: "packages/app/src/components/SessionPane/SessionPane.tsx, packages/app/src/hooks/useSessionControls.ts" | — |
| type | YES | Review type: `code-review`, `doc-review`, `migration-review`, `proposal-review` | — |
| checklist | NO | Specific checklist file from `checklists/` to validate against | — |
| mode | NO | `review-only` or `review-and-fix` | review-only |

---

## Model

**sonnet** — Needs pattern recognition for quality assessment and nuanced code evaluation.

---

## How Orchestrator Spawns This

1. Collect inputs:
   - `scope`: Changed files from previous code/ action or from human request
   - `type`: Usually `code-review` for implementation work
   - `checklist`: From human if specific validation needed
   - `mode`: From human or default to `review-only`

2. Spawn:

```
Read your definition in .claude/actionflows/actions/review/agent.md

Project Context:
- Name: ActionFlows Dashboard
- Backend: Express + WebSocket + Redis (packages/backend/)
- Frontend: React + Vite + Electron (packages/app/)

Input:
- scope: packages/app/src/components/SessionPane/SessionPane.tsx, packages/app/src/hooks/useSessionControls.ts
- type: code-review
- mode: review-only
```

---

## Gate

Verdict delivered (APPROVED or NEEDS_CHANGES). If NEEDS_CHANGES, findings include file paths, line numbers, and fix suggestions.

---

## Notes

- When mode is `review-and-fix`, fixes only clear-cut issues. Subjective improvements are flagged for human.
- If scope files don't exist, report "File Not Found" and continue with remaining files.
- Critical findings automatically result in NEEDS_CHANGES verdict regardless of score.
