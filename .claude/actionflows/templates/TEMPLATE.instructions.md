# {Flow Name} Flow

> {One-line flow purpose - concise statement of what this flow achieves}

---

## When to Use

- {Trigger condition 1 - describe situation when orchestrator routes here}
- {Trigger condition 2}
- {Trigger condition 3}

---

## Prerequisites (optional)

**CRITICAL:** Before execution, verify:
1. {Prerequisite check 1, e.g., "Backend is running on port 3001"}
2. {Prerequisite check 2, e.g., "All dependencies installed via pnpm install"}

If any prerequisite fails → Flow errors. Human must fix and re-run.

---

## Required Inputs From Human

| Input | Description | Example |
|-------|-------------|---------|
| {input-name} | {description of what this input is and why it's needed} | `"actual example value"` |
| {another-input} | {description} | `"concrete example in quotes"` |

---

## Action Sequence

### Step 1: {Step Name}

**Action:** `.claude/actionflows/actions/{action-name}/`
**Model:** {opus|sonnet|haiku}
**Waits for:** None

**Spawn:**
```
Read your definition in .claude/actionflows/actions/{action-name}/agent.md

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
- {input-name}: {value or reference to previous step output}
- {another-input}: {value or reference}
```

**Gate:** {Completion criteria or expected deliverable, e.g., "Step 1 completes when analysis.md is generated in log folder"}

---

### Step 2: {Step Name}

**Action:** `.claude/actionflows/actions/{action-name}/`
**Model:** {opus|sonnet|haiku}
**Waits for:** Step 1

**Spawn:**
```
Read your definition in .claude/actionflows/actions/{action-name}/agent.md

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
- {input-name}: {output from Step 1 or human input}
```

**Gate:** {Completion criteria}

---

### Step N: HUMAN GATE (if applicable)

{Description of what human reviews, e.g., "Human reviews changes.md from Step 2 and approves the implementation approach"}

{Optional approval logic: "If human approves → continue to Step 4. If human requests changes → orchestrator routes back to code/ action with feedback."}

---

{Repeat steps as needed for complete flow}

---

## Dependencies

```
Step 1 → Step 2 → Step 3
  ↑________________↓ (if there's a loop condition, describe it here)
```

**Parallel groups:** {Description of any steps that can run in parallel, e.g., "Steps 4 and 5 can run in parallel" or "None"}

---

## Chains With (optional)

- ← {Upstream flow that chains TO this flow, e.g., "← plan/ (before implementation starts)"}
- → {Downstream flow this flow chains TO, e.g., "→ review/ (after code changes)"}
- ↔ {Bidirectional relationship if applicable}

---

## Example (optional)

```
Human: "{Example request that would trigger this flow}"

Orchestrator Routes to: {flow-name}/, mode={execution-mode}

Step 1: {action-name}/ generates {output-description}
  Result: {brief description of what happened}

Step 2: {action-name}/ processes {input-from-step-1}
  Result: {brief description of output}

Step N: HUMAN GATE
  Human reviews {deliverable}
  Human approves / requests changes

Output: {Final result of flow, e.g., "Implementation complete, changes merged to master"}
```

---

## Common Issues & Fixes (optional)

| Issue | Fix |
|-------|-----|
| {Issue description, e.g., "Agent timeout on large files"} | {Fix description, e.g., "Increase timeout or split into smaller batches"} |
| {Another issue} | {How to resolve it} |

---

## Notes (optional)

- **{Topic}:** {Note, e.g., "This flow requires manual review because contract definitions are involved"}
- **{Another topic}:** {Additional context}
