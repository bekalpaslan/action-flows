# Issue-Driven Work Flow

> Start ActionFlows work from an existing Linear issue, creating chains based on issue description and requirements.

---

## When to Use

- Starting work on a Linear issue
- Converting Linear task into ActionFlows chain
- Tracking Linear issue progress through ActionFlows execution
- Syncing Linear issue state with chain completion

---

## Required Inputs From Human

| Input | Description | Example |
|-------|-------------|---------|
| issueId | Linear issue ID or identifier | "AFW-123" or "issue-uuid" |

---

## Action Sequence

### Step 1: Fetch Issue Details

**Action:** Orchestrator-Direct (MCP Tools + Backend Cache)

First, try loading from backend cache:
```
GET /api/linear/issues/{issueId}
```

If not found, fetch from Linear via MCP:
```bash
ToolSearch query="+linear"
mcp__plugin_linear_linear__get_issue (issueId)
```

Then push to cache:
```
POST /api/linear/issues
```

**Gate:** Issue details loaded.

---

### Step 2: Analyze Issue Requirements

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
- aspect: issue-requirements
- scope: Linear issue {issueIdentifier} — title: "{title}", description: "{description}", labels: {labels}
- context: Analyzing issue requirements to determine work scope, technical approach, and chain structure
```

**Gate:** Requirements analysis delivered.

---

### Step 3: Compile Work Chain

**Action:** Orchestrator-Direct (Chain Compilation)

Based on analysis output, the orchestrator compiles a chain using ACTIONS.md or FLOWS.md:

Example chain structure:
```
Step 1: analyze/ (code analysis if needed)
Step 2: plan/ (detailed implementation plan)
Step 3: code/ (implementation)
Step 4: review/ (code review)
Step 5: commit/ (git commit)
```

Present chain to human for approval.

**Gate:** Chain approved by human.

---

### Step 4: Execute Work Chain

**Action:** Chain Execution (standard ActionFlows execution)

Execute the approved chain. Each step spawns agents as normal.

**Gate:** Chain completed.

---

### Step 5: Update Linear Issue State

**Action:** Orchestrator-Direct (MCP Tools)

Update the Linear issue based on chain outcome:

If chain succeeded:
```bash
mcp__plugin_linear_linear__update_issue (issueId) with:
  - stateId: {completed-state-id}
  - Comment: "Work completed via ActionFlows chain {chainId}. See logs: {logPath}"
```

If chain failed:
```bash
mcp__plugin_linear_linear__create_comment (issueId) with:
  - body: "Work attempted via ActionFlows chain {chainId} but encountered errors. See logs: {logPath}"
```

Then push updated issue to cache:
```
POST /api/linear/issues
```

**Gate:** Issue updated in Linear.

---

### Step 6: Generate Completion Report

**Action:** `code/`
**Model:** haiku

**Spawn to create completion report:**
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
- task: Create completion report at .claude/actionflows/logs/pm/issue-driven-work/{issue-slug}_{YYYY-MM-DD-HH-MM-SS}/completion.md
- context: Issue {issueIdentifier} work completed via chain {chainId}, outcome={outcome}, issue state updated
```

**Completion report format:**
```markdown
# Issue-Driven Work Completion

## Linear Issue
- **Identifier:** {issueIdentifier}
- **Title:** {title}
- **URL:** {issueUrl}
- **Initial State:** {initialState}
- **Final State:** {finalState}

## ActionFlows Chain
- **Chain ID:** {chainId}
- **Steps:** {stepCount}
- **Outcome:** {succeeded/failed}
- **Log Path:** {logPath}
- **Execution Time:** {duration}

## Work Summary
{Analysis summary of what was done}

## Linear Updates
- State: {initialState} → {finalState}
- Comment added: "{comment}"

## Next Steps
- Review work in Linear: {issueUrl}
- View detailed logs: {logPath}
- {Optional: Suggested follow-up work}
```

**Gate:** Completion report saved.

---

## Dependencies

```
Step 1 → Step 2 → Step 3 → Step 4 → Step 5 → Step 6 (fully sequential)
```

**Parallel groups:** None — fully sequential flow.

---

## Chains With

May chain from:
- `roadmap-sync/` — After syncing roadmap, start work on an issue

May chain to:
- `chain-to-issue/` — If work spawns additional issues
- `roadmap-sync/` — Sync to refresh issue state in cache

---

## Notes

- **MCP Tools Required:** Linear MCP plugin must be configured in Claude Code
- **Bidirectional Sync:** Links Linear issues with ActionFlows chains via chainId metadata
- **State Management:** Automatically updates Linear issue state based on chain outcome
- **Comment Trail:** Adds comments to Linear issue with ActionFlows execution details
- **Approval Gate:** Human reviews and approves the compiled chain before execution (Step 3)
