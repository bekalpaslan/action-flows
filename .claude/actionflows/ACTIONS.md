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

| Action | Purpose | Requires Input? | Required Inputs | Model | Contract Output? |
|--------|---------|-----------------|-----------------|-------|------------------|
| code/ | Implement code changes (generic) | YES | task, context | haiku | NO |
| review/ | Review anything | YES | scope, type | sonnet | YES (5.1) |
| audit/ | Comprehensive audits | YES | type, scope | opus | NO |
| test/ | Execute tests | YES | scope, type | haiku | NO |
| analyze/ | Codebase analysis | YES | aspect, scope | sonnet | YES (5.2) |
| plan/ | Implementation planning | YES | requirements, context | sonnet | NO |
| commit/ | Git commit + push | YES | summary, files | haiku | NO |
| brainstorm/ | Interactive ideation facilitation | YES | idea, classification, context | opus | YES (5.3) |
| narrate/ | Write poetic narrative chapters | YES | chapterNumber, analysisPath | opus | NO |
| onboarding/ | Facilitate interactive onboarding questionnaire | NO | (none) | opus | NO |

**Contract Output Column:**
- **YES (X.X)** — Action produces structured output defined in CONTRACT.md (format number shown)
- **NO** — Action output is not contract-defined (internal logs, working files)

Contract-defined outputs are parsed by the dashboard. Deviating from specification causes harmony violations (graceful degradation).

See `.claude/actionflows/CONTRACT.md` for format specifications.

## Stack-Specific Code Actions

**Prefer these over generic `code/` when the target stack is known.**

| Action | Stack | Required Inputs | Model |
|--------|-------|-----------------|-------|
| `code/backend/` | Express 4.18 + TypeScript + Zod | task, context | haiku |
| `code/frontend/` | React 18.2 + Vite 5 + Electron 28 | task, context | haiku |

## Code-Backed Actions

**Code-backed actions have real TypeScript packages backing them.** Unlike generic actions where Claude IS the tool, these actions wrap existing code packages. Claude is a thin wrapper that runs the code and interprets results.

**Key distinction:**
- **Generic Actions:** Pure Claude instructions. Claude performs all logic and produces the output.
- **Code-Backed Actions:** Claude spawns and orchestrates code from packages/. The heavy lifting happens in the package.

| Action | Purpose | Code Package | Required Inputs | Model |
|--------|---------|--------------|-----------------|-------|
| second-opinion/ | Ollama critique of agent output | packages/second-opinion/ | actionType, claudeOutputPath, originalInput | haiku |

## Action Modes

Actions like review/, audit/, and analyze/ support a `mode` input that controls behavior:

| Action | Default Mode | Extended Mode | Behavior |
|--------|-------------|---------------|----------|
| review/ | review-only | review-and-fix | Reviews AND fixes bugs, doc errors |
| audit/ | audit-only | audit-and-remediate | Audits AND remediates CRITICAL/HIGH findings |
| analyze/ | analyze-only | analyze-and-correct | Analyzes AND corrects drift, mismatches |

Use extended mode when fixes are straightforward and don't require architecture decisions.

## Post-Action Steps

Certain actions automatically trigger follow-up steps:

| Trigger Action | Post-Action Step | Trigger Type | Can Suppress? |
|---------------|-----------------|--------------|---------------|
| review/ | second-opinion/ | Auto | Yes ("skip second opinions") |
| audit/ | second-opinion/ | Auto | Yes ("skip second opinions") |
| analyze/ | second-opinion/ | Opt-in (orchestrator flag) | N/A |
| plan/ | second-opinion/ | Opt-in (orchestrator flag) | N/A |

## Model Selection Guidelines

| Action Type | Model | Why |
|-------------|-------|-----|
| code, code/backend, code/frontend, test, commit | haiku | Fast, simple execution |
| review, analyze, plan | sonnet | Needs judgment |
| audit, brainstorm, onboarding | opus | Deep analysis or interactive teaching needed |
| second-opinion | haiku | Lightweight CLI wrapper |

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
