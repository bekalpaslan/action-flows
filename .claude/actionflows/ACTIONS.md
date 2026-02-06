# Action Registry

> Orchestrator reads this to compose chains.

## Actions

| Action | Purpose | Model | Required Inputs | Extends |
|--------|---------|-------|-----------------|---------|
| code/ | Implement code changes — features, bug fixes, refactors | haiku | task, context | agent-standards, create-log-folder, post-notification |
| code/backend/ | Backend implementation — Express, WebSocket, Redis | haiku | task, context | agent-standards, create-log-folder, post-notification |
| code/frontend/ | Frontend implementation — React, Vite, Electron | haiku | task, context | agent-standards, create-log-folder, post-notification |
| review/ | Review code/docs for quality and pattern adherence | sonnet | scope, type | agent-standards, create-log-folder, post-notification |
| test/ | Execute tests and report results | haiku | scope, type | agent-standards, create-log-folder, post-notification |
| commit/ | Stage, commit, and push git changes | haiku | summary, files | agent-standards, create-log-folder, post-notification |
| plan/ | Create detailed implementation plans | opus | requirements, context | agent-standards, create-log-folder, post-notification |
| audit/ | Comprehensive deep-dive audits | opus | type, scope | agent-standards, create-log-folder, post-notification |
| analyze/ | Data-driven analysis and metrics | sonnet | aspect, scope | agent-standards, create-log-folder, post-notification |
| status-update/ | Update project progress/status files | haiku | what | agent-standards, create-log-folder, post-notification |

## Action Modes

| Action | Default | Extended | Behavior |
|--------|---------|----------|----------|
| review/ | review-only | review-and-fix | Reviews AND fixes bugs, typos, missing imports |
| audit/ | audit-only | audit-and-remediate | Audits AND remediates CRITICAL/HIGH findings |
| analyze/ | analyze-only | analyze-and-correct | Analyzes AND corrects drift, stale data |

## Abstract Actions

| Abstract | Purpose | Used By |
|----------|---------|---------|
| _abstract/agent-standards | Core behavioral standards (8 rules) | All agents |
| _abstract/create-log-folder | Datetime log folder creation | All actions |
| _abstract/post-notification | Completion notifications | All actions |
| _abstract/update-queue | Queue status tracking | code, review |
| _abstract/post-completion | Commit + notify + update status | Implementation actions |

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
- Notification: Not configured
- Backend: Express + WebSocket + Redis (packages/backend/, port 3001)
- Frontend: React + Vite + Electron (packages/app/, port 5173)
- Shared: TypeScript types (packages/shared/)
- MCP Server: packages/mcp-server/

Input:
- {input}: {value}
"""
)
```
