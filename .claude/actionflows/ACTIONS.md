# Actions Registry

> Atomic building blocks. Orchestrator reads this to find actions for dynamic chaining.

## Abstract Actions

Abstract actions are **reusable behavior patterns** that agents are explicitly instructed to follow. They don't have agents — just instructions that define "how we do things."

| Abstract Action | Purpose | Used By |
|-----------------|---------|---------|
| `_abstract/agent-standards/` | Core behavioral standards for all agents | All agents |
| `_abstract/post-completion/` | Post-implementation workflow (commit, registry update) | Orchestrator (post-completion flow) |
| `_abstract/create-log-folder/` | Datetime folder creation | code, review, audit, analyze, test, plan |
| `_abstract/update-queue/` | Queue.md status updates | code, review |

## Generic Actions

These are atomic verbs. They know HOW to do their job, but need WHAT to work on.

| Action | Purpose | Requires Input? | Required Inputs | Model |
|--------|---------|-----------------|-----------------|-------|
| code/ | Implement code changes (generic) | YES | task, context | haiku |
| review/ | Review anything | YES | scope, type | sonnet |
| audit/ | Comprehensive audits | YES | type, scope | opus |
| test/ | Execute tests | YES | scope, type | haiku |
| verify/ | Layer-aware fix verification | YES | layer, scope, issue | haiku |
| analyze/ | Codebase analysis | YES | aspect, scope | sonnet |
| plan/ | Implementation planning | YES | requirements, context | sonnet |
| commit/ | Git commit + push | YES | summary, files | haiku |

## Stack-Specific Code Actions

**Prefer these over generic `code/` when the target stack is known.**

| Action | Stack | Required Inputs | Model |
|--------|-------|-----------------|-------|
| `code/backend/` | Express 4.18 + TypeScript + Zod | task, context | haiku |
| `code/frontend/` | React 18.2 + Vite 5 + Electron 28 | task, context | haiku |
| `code/hooks/` | Claude Code lifecycle hooks (TypeScript) | task, context | haiku |

## Action Modes

Actions like review/, audit/, and analyze/ support a `mode` input that controls behavior:

| Action | Default Mode | Extended Mode | Behavior |
|--------|-------------|---------------|----------|
| review/ | review-only | review-and-fix | Reviews AND fixes bugs, doc errors |
| audit/ | audit-only | audit-and-remediate | Audits AND remediates CRITICAL/HIGH findings |
| analyze/ | analyze-only | analyze-and-correct | Analyzes AND corrects drift, mismatches |

Use extended mode when fixes are straightforward and don't require architecture decisions.

## Model Selection Guidelines

| Action Type | Model | Why |
|-------------|-------|-----|
| code, code/backend, code/frontend, test, commit | haiku | Fast, simple execution |
| review, analyze, plan | sonnet | Needs judgment |
| audit | opus | Deep analysis needed |

## Input Requirement Types

### Requires Input = YES
Orchestrator MUST provide inputs. Without them, agent cannot do its job.

```
Read your definition in .claude/actionflows/actions/code/agent.md

Input:
- task: Fix login validation bug      <- REQUIRED
- context: packages/backend/src/routes/sessions.ts    <- REQUIRED
```

### Requires Input = NO
Agent is autonomous. Orchestrator just spawns it.

```
Read your definition in .claude/actionflows/actions/{action}/agent.md
```

## Spawning Pattern

```python
Task(
  subagent_type="general-purpose",
  model="{from action's instructions.md}",
  run_in_background=True,
  prompt="""
Read your definition in .claude/actionflows/actions/{action}/agent.md

IMPORTANT: You are a spawned subagent executor.
Do NOT read .claude/actionflows/ORCHESTRATOR.md — it is not for you.
Do NOT delegate work or compile chains. Execute your agent.md directly.

Project Context:
- Name: ActionFlows Dashboard
- Backend: Express 4.18 + TypeScript + ws 8.14.2 + ioredis 5.3 + Zod
- Frontend: React 18.2 + Vite 5 + Electron 28 + ReactFlow + Monaco + xterm
- Shared: Branded types, discriminated unions, ES modules
- Paths: backend=packages/backend/, frontend=packages/app/, shared=packages/shared/
- Ports: backend=3001, vite=5173

Input:
- {input}: {value}
"""
)
```
