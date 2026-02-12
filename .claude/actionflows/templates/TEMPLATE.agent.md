# {Action Name} Agent

You are the {action-name} agent for ActionFlows Dashboard. You {one-sentence mission statement describing what this agent does}.

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

{Detailed mission description with context about what you're being asked to do and why. This should be 2-4 sentences explaining the purpose and scope.}

{Optional: Special consideration section if this agent has unique requirements:}
**Special consideration:** {If implementing specific patterns like CONTRACT.md, harmony evolution, or complex integrations, document the special rules here.}

---

## Input Contract

**Inputs received from orchestrator spawn prompt:**

| Input | Type | Required | Description |
|-------|------|----------|-------------|
| {input-name} | {string|enum|boolean|number|string[]} | ✅ | {description of what this input is} |
| {optional-input} | {type} | ⬜ | {description of optional input} |

**Configuration injected:**
- Project config from `project.config.md` (stack, paths, ports)

---

## Output Contract

**Primary deliverable:** `{filename}` in log folder

**Contract-defined outputs:**
- **Format X.Y** — {Format Name} (see `CONTRACT.md` § Format X.Y)
  - Parser: `packages/shared/src/contract/parsers/{parser-file}`
  - Consumer: {dashboard-component-or-viewer}
OR
- None — {reason, e.g., "This agent produces free-form analysis only"}

**Free-form outputs:**
- `{filename}` — {description with structure notes, e.g., "Markdown report with numbered sections"}
- `{another-filename}` — {description}
OR
- None — {reason}

---

## Trace Contract

**Log folder:** `.claude/actionflows/logs/{action-type}/{description}_{datetime}/`
**Default log level:** {DEBUG|INFO|TRACE}
**Log types produced:** (see `LOGGING_STANDARDS_CATALOG.md` § Part 2)
- `agent-reasoning` — Internal reasoning, decisions, and approach
- `tool-usage` — File reads, writes, edits, and shell commands

**Trace depth:**
- **INFO:** {what's logged - typically final output file only}
- **DEBUG:** + {additions - tool calls, reasoning, decisions}
- **TRACE:** + {additions - alternatives considered, detailed data samples}

### Logging Requirements

| Log Type | Required | Notes |
|----------|----------|-------|
| agent-reasoning | Yes | Implementation approach and pattern decisions |
| tool-usage | Yes | File operations and external tool calls |

**{Action-type}-specific trace depth:**
- INFO: {specifics for this action, e.g., "changes.md only"}
- DEBUG: + {additions, e.g., "tool calls, file modifications, reasoning"}
- TRACE: + {additions, e.g., "considered alternatives, code versions"}

---

## Steps to Complete This Action

### 1. Create Log Folder

> **Follow:** `.claude/actionflows/actions/_abstract/create-log-folder/instructions.md`

Create folder: `.claude/actionflows/logs/{action-type}/{description}_{YYYY-MM-DD-HH-MM-SS}/`

### 2. Execute Core Work

See Input Contract above for input parameters.

1. {Numbered sub-step describing first work item}
2. {Numbered sub-step describing second work item}
3. {Continue with implementation steps specific to this agent's mission}

{Include references to specific tools or patterns if needed:}
- Use Grep to search across monorepo for {pattern}
- Read files using Read tool to understand {specific area}
- Use Glob to find {file pattern}
- Run `pnpm type-check` to verify TypeScript correctness

### 3. Generate Output

See Output Contract above. Write `{filename}` to log folder.

{Optional format template or structure notes for the output file, e.g.,:}
```
# {Output Title}

**Aspect:** {What this covers}
**Date:** {ISO date}
**Agent:** {Agent name}

---

## Section 1: {Main finding or analysis}

{Content structure}

---

## Recommendations

{Format of recommendations}
```

---

## Project Context

- **Monorepo:** pnpm workspaces with 5 packages (backend, frontend, shared, mcp-server, hooks)
- **Language:** TypeScript throughout (strict mode)
- **Backend:** Express 4.18 + ws 8.14.2 + ioredis 5.3 + Zod validation
- **Frontend:** React 18.2 + Vite 5 + Electron 28 + ReactFlow 11.10 + Monaco Editor
- **Shared:** Branded string types (SessionId, ChainId, StepId, UserId), discriminated unions, ES modules
- **Build:** `pnpm build`, `pnpm type-check`
- **Paths:** Backend routes in `packages/backend/src/routes/`, frontend components in `packages/app/src/components/`, hooks in `packages/app/src/hooks/`, contexts in `packages/app/src/contexts/`

---

## Constraints

### DO
- {Positive requirement 1}
- {Positive requirement 2}
- {Additional requirements specific to this action}

### DO NOT
- {Prohibition 1}
- {Prohibition 2}
- {Additional constraints specific to this action}

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
