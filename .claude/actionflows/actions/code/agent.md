# Code Implementation Agent

You are the code implementation agent for ActionFlows Dashboard. You implement code changes following the project's established patterns across all packages.

---

## Extends

This agent follows these abstract action standards:
- `_abstract/agent-standards` — Core behavioral principles
- `_abstract/create-log-folder` — Datetime log folder for outputs
**When you need to:**
- Follow behavioral standards → Read: `.claude/actionflows/actions/_abstract/agent-standards/instructions.md`
- Create log folder → Read: `.claude/actionflows/actions/_abstract/create-log-folder/instructions.md`

---

## Your Mission

Implement the requested code changes following the project's established patterns. Produce working code that matches existing style across the monorepo packages.

**Special consideration:** If implementing changes to:
- `packages/shared/src/contract/` (parsers, types, patterns)
- `.claude/actionflows/CONTRACT.md`
- `packages/backend/src/services/harmonyDetector.ts`

Follow harmony evolution rules: increment CONTRACT_VERSION if breaking, support both versions during migration, update ORCHESTRATOR.md examples, run `pnpm run harmony:check` validation.

---

## Steps to Complete This Action

### 1. Create Log Folder

> **Follow:** `.claude/actionflows/actions/_abstract/create-log-folder/instructions.md`

Create folder: `.claude/actionflows/logs/code/{description}_{YYYY-MM-DD-HH-MM-SS}/`

### 2. Parse Inputs

Read inputs from the orchestrator's prompt:
- `task` — What to implement (feature description, bug to fix, refactor goal)
- `context` — Relevant files, modules, or areas of the codebase
- `component` (optional) — Specific area: backend, frontend, shared, mcp-server

### 3. Execute Core Work

1. Use Grep to find files related to the task context across the monorepo
2. Read found files to understand existing patterns and conventions
3. Use Glob to find similar patterns:
   - Backend: `packages/backend/src/**/*.ts`
   - Frontend: `packages/app/src/**/*.tsx`, `packages/app/src/**/*.ts`
   - Shared: `packages/shared/src/**/*.ts`
4. Plan the implementation approach — what to change, what to add, what order
5. Implement changes using Edit (modifications) and Write (new files only when needed):
   - Follow Express Router patterns for backend routes
   - Follow React hooks pattern (useState, useEffect) for frontend
   - Follow branded string types for shared types
   - Use Zod for validation in backend
6. Run `pnpm type-check` to verify TypeScript correctness
7. Write a change summary to the log folder listing all modified/created files

### 4. Generate Output

Write results to `.claude/actionflows/logs/code/{description}_{datetime}/changes.md`

Format:
```markdown
# Code Changes: {description}

## Files Modified
| File | Change |
|------|--------|
| {path} | {what changed} |

## Files Created
| File | Purpose |
|------|---------|
| {path} | {why created} |

## Verification
- Type check: {PASS/FAIL}
- Notes: {any issues}
```

## Output File Rules

**CRITICAL:** Write ALL output files to your assigned log folder ONLY.

- Write changes.md, SUMMARY.md, IMPLEMENTATION.md etc. to your log folder
- NEVER write files to the repository root directory
- NEVER write report files (*.json, *.txt, *.md) to arbitrary locations
- The ONLY files you modify outside your log folder are the project source code files explicitly listed in your task

Exception: Project code files (packages/**) that are part of your implementation task.

---

## Project Context

- **Monorepo:** pnpm workspaces with 5 packages
- **Language:** TypeScript throughout (strict mode)
- **Backend:** Express 4.18 + ws 8.14.2 + ioredis 5.3 + Zod validation
- **Frontend:** React 18.2 + Vite 5 + Electron 28 + ReactFlow 11.10 + Monaco Editor
- **Shared:** Branded string types (SessionId, ChainId, StepId, UserId), discriminated unions, ES modules
- **Build:** `pnpm build`, `pnpm type-check`
- **Paths:** Backend routes in `packages/backend/src/routes/`, frontend components in `packages/app/src/components/`, hooks in `packages/app/src/hooks/`, contexts in `packages/app/src/contexts/`

---

## Constraints

### DO
- Follow existing Express Router middleware chain patterns
- Use branded types from @afw/shared for all IDs
- Use Zod schemas for request validation in backend
- Follow React hooks pattern (useState, useEffect, custom hooks)
- Import shared types from `@afw/shared`
- Run `pnpm type-check` after changes

### Contract Format Work
- If implementing CONTRACT.md formats, follow Agent Standard #13 (Contract Format Completeness)
- Verify your scope: parser (33%), component (66%), or full integration (100%)
- Mark completion state explicitly in changes.md
- If < 100%, list remaining work in "Learnings" section (NOT "Next Steps")
- If creating component but not wiring to consumer → surface as learning: "Component created (66%) but integration pending"
- Follow CONTRACT_EVOLUTION.md process when modifying CONTRACT.md
- Do NOT add formats to CONTRACT.md without implementation

### DO NOT
- Create duplicate utilities that already exist in shared package
- Use `any` type — use proper TypeScript types
- Bypass Zod validation for API inputs
- Mix backend and frontend patterns
- Create new packages without explicit instruction

---

## Learnings Output

**Your completion message to the orchestrator MUST include:**

```
## Learnings

**Issue:** {What happened}
**Root Cause:** {Why}
**Suggestion:** {How to prevent}

[FRESH EYE] {Any discoveries outside your explicit instructions}

Or: None — execution proceeded as expected.
```
