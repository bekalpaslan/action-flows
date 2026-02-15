# Chain-to-Issue Flow

> Convert a completed ActionFlows chain into a Linear issue for documentation and tracking.

---

## When to Use

- Chain has completed successfully
- Work needs to be tracked in Linear for project management
- Creating permanent record of completed work
- Generating issue for stakeholder visibility

---

## Required Inputs From Human

| Input | Description | Example |
|-------|-------------|---------|
| chainId | The completed chain ID | "chain-abc-123" |
| teamId | Linear team to create issue in | "team-engineering" |
| projectId | Optional Linear project to link | "proj-q1-features" |

---

## Action Sequence

### Step 1: Load Linear Teams and Projects

**Action:** Orchestrator-Direct (MCP Tools)

The orchestrator loads Linear MCP tools and fetches teams/projects:

```bash
ToolSearch query="+linear"
mcp__plugin_linear_linear__list_teams
mcp__plugin_linear_linear__list_projects
```

Then pushes data to backend cache via REST API:
```
POST /api/linear/teams (cached teams)
POST /api/linear/projects (cached projects)
```

**Gate:** Teams and projects cached in backend.

---

### Step 2: Analyze Chain Completion Data

**Action:** `analyze/`
**Model:** sonnet

**Spawn with:**
```
Read your definition in .claude/actionflows/actions/analyze/agent.md

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
- aspect: chain-completion
- scope: .claude/actionflows/logs/{chain-log-folder}/
- context: Analyzing completed chain {chainId} to extract issue metadata (title, description, step count, completion time, logs path)
```

**Gate:** Analysis report with issue metadata extracted.

---

### Step 3: Create Linear Issue

**Action:** Orchestrator-Direct (MCP Tools)

The orchestrator uses analysis output to create a Linear issue via MCP:

```bash
mcp__plugin_linear_linear__create_issue with:
  - title: "{Chain completion summary from analysis}"
  - description: "{Detailed description with step breakdown}"
  - teamId: {teamId from input}
  - projectId: {projectId from input or null}
  - labels: ["actionflows", "automation"]
  - Custom field: chainId = {chainId}
```

Then pushes the created issue to backend cache:
```
POST /api/linear/issues (with new issue data)
```

**Gate:** Issue created in Linear and cached in backend.

---

### Step 4: Generate Confirmation Report

**Action:** `code/`
**Model:** haiku

**Spawn to create confirmation doc:**
```
Read your definition in .claude/actionflows/actions/code/agent.md

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
- task: Create issue confirmation at .claude/actionflows/logs/pm/chain-to-issue/{chain-slug}_{YYYY-MM-DD-HH-MM-SS}/confirmation.md
- context: Linear issue {issueIdentifier} created for chain {chainId}, issue URL, metadata
```

**Confirmation doc format:**
```markdown
# Linear Issue Created

## Chain
- **Chain ID:** {chainId}
- **Completed:** {completedAt}
- **Steps:** {stepCount}
- **Log Path:** {logPath}

## Linear Issue
- **Identifier:** {issueIdentifier} (e.g., AFW-123)
- **URL:** {issueUrl}
- **Team:** {teamName}
- **Project:** {projectName or "None"}
- **Created:** {createdAt}

## Next Steps
- View issue in Linear: {issueUrl}
- Track progress in Linear project board
- Add comments or attachments as needed
```

**Gate:** Confirmation saved.

---

## Dependencies

```
Step 1 → Step 2 → Step 3 → Step 4 (fully sequential)
```

**Parallel groups:** None — fully sequential flow.

---

## Chains With

May chain to:
- `roadmap-sync/` — After creating issue, sync full roadmap
- `issue-driven-work/` — Start new work from the created issue

---

## Notes

- **MCP Tools Required:** Linear MCP plugin must be configured in Claude Code
- **Orchestrator Responsibility:** MCP tool calls happen at orchestrator level (not delegated to agents)
- **Backend Cache:** All Linear data is pushed to backend for frontend consumption
- **Chain Metadata:** chainId and chainMetadata are stored in the Linear issue for reverse lookup
