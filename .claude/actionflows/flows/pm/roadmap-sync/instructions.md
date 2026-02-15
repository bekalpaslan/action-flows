# Roadmap-Sync Flow

> Synchronize Linear roadmap data (teams, projects, issues) with ActionFlows backend cache for dashboard visibility.

---

## When to Use

- Need to refresh Linear data in dashboard
- After creating/updating issues in Linear
- Setting up Linear integration for the first time
- Periodic background sync (if auto-sync enabled)

---

## Required Inputs From Human

| Input | Description | Example |
|-------|-------------|---------|
| scope | Sync scope (teams, projects, issues, all) | "all" |
| teamId | Optional team filter for issues/projects | "team-engineering" (optional) |

---

## Action Sequence

### Step 1: Load Linear MCP Tools

**Action:** Orchestrator-Direct (MCP Tools)

Load Linear MCP tools for API access:
```bash
ToolSearch query="+linear"
```

**Gate:** Linear MCP tools loaded.

---

### Step 2: Fetch Teams (if scope includes teams or all)

**Action:** Orchestrator-Direct (MCP Tools)

Fetch all teams from Linear:
```bash
mcp__plugin_linear_linear__list_teams
```

Then push to backend cache:
```
POST /api/linear/teams
```

**Gate:** Teams synced.

---

### Step 3: Fetch Projects (if scope includes projects or all)

**Action:** Orchestrator-Direct (MCP Tools)

Fetch projects (optionally filtered by teamId):
```bash
mcp__plugin_linear_linear__list_projects (with teamId filter if provided)
```

Then push to backend cache:
```
POST /api/linear/projects
```

**Gate:** Projects synced.

---

### Step 4: Fetch Issues (if scope includes issues or all)

**Action:** Orchestrator-Direct (MCP Tools)

Fetch issues (optionally filtered by teamId):
```bash
mcp__plugin_linear_linear__list_issues (with teamId filter if provided)
```

Then push to backend cache:
```
POST /api/linear/issues
```

Update metadata with sync timestamp:
```
GET /api/linear/metadata (to get current metadata)
POST /api/linear/issues (pushes issues and updates lastSyncAt)
```

**Gate:** Issues synced.

---

### Step 5: Fetch Users and Labels (if scope is all)

**Action:** Orchestrator-Direct (MCP Tools)

Fetch users and labels:
```bash
mcp__plugin_linear_linear__list_users
mcp__plugin_linear_linear__list_issue_labels (with teamId if provided)
```

Then push to backend cache:
```
POST /api/linear/users
POST /api/linear/labels
```

**Gate:** Users and labels synced.

---

### Step 6: Generate Sync Report

**Action:** `code/`
**Model:** haiku

**Spawn to create sync report:**
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
- task: Create sync report at .claude/actionflows/logs/pm/roadmap-sync/{YYYY-MM-DD-HH-MM-SS}/sync-report.md
- context: Sync completed with counts: teams={teamsCount}, projects={projectsCount}, issues={issuesCount}, users={usersCount}, labels={labelsCount}
```

**Sync report format:**
```markdown
# Linear Roadmap Sync Report

## Sync Details
- **Timestamp:** {timestamp}
- **Scope:** {scope}
- **Team Filter:** {teamId or "All teams"}

## Synced Data
- **Teams:** {teamsCount}
- **Projects:** {projectsCount}
- **Issues:** {issuesCount}
- **Users:** {usersCount}
- **Labels:** {labelsCount}

## Backend Cache Status
- **Last Sync:** {lastSyncAt}
- **Total Issues Cached:** {syncedIssueCount}
- **Total Projects Cached:** {syncedProjectCount}

## Next Steps
- View synced data in dashboard Linear components
- Create issues from completed chains: `chain-to-issue/`
- Start work from Linear issues: `issue-driven-work/`
```

**Gate:** Sync report saved.

---

## Dependencies

```
Step 1 → Step 2 (teams)
Step 1 → Step 3 (projects) [depends on Step 2 if teamId filter]
Step 1 → Step 4 (issues) [depends on Step 2 if teamId filter]
Step 1 → Step 5 (users, labels)
Steps 2-5 → Step 6 (report)
```

**Parallel groups:**
- Group 1: Steps 2, 3, 4, 5 can run in parallel if no teamId dependency
- Sequential: Step 6 waits for all data fetching

---

## Chains With

May chain from:
- `chain-to-issue/` — After creating issue, sync to refresh cache

May chain to:
- `issue-driven-work/` — Start work from freshly synced issues

---

## Notes

- **MCP Tools Required:** Linear MCP plugin must be configured in Claude Code
- **Orchestrator Responsibility:** All MCP tool calls happen at orchestrator level
- **Cache-First Architecture:** Frontend reads from backend cache, orchestrator syncs via MCP
- **Incremental Sync:** Can sync just teams, projects, or issues instead of full sync
- **Auto-Sync:** If LinearConfig.autoSync is enabled, this flow runs on a schedule (controlled by syncInterval)
