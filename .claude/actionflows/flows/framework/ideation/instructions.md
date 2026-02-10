# Ideation Flow

> Structured ideation sessions for exploring ideas, thinking through decisions, and brainstorming solutions.

---

## When to Use

- Human has an idea and wants to explore it
- Brainstorming needed for a concept
- Thinking through decisions and implications
- Exploring multiple solution approaches

---

## Required Inputs From Human

| Input | Description | Example |
|-------|-------------|---------|
| idea | The idea to explore | "Real-time collaborative editing in the dashboard" |

---

## Action Sequence

### Step 1: Classify Idea Type

**Action:** Orchestrator-Direct Question

Ask human to classify the idea:
- **1. Technical** — Code structure, architecture, implementation patterns
- **2. Functional** — Features, user workflows, business logic
- **3. Framework** — ActionFlows itself, meta-framework improvements

**Gate:** Classification received from human. Store as `{classification}`.

---

### Step 2: Gather Project Context

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
- aspect: inventory
- scope: {scope based on classification}
- context: Preparing context for ideation session about: {idea}
```

**Scope mapping:**
- **Technical** → `packages/backend/src/, packages/app/src/, packages/shared/src/`
- **Functional** → `docs/FRD*.md, docs/SRD*.md, docs/domain/`
- **Framework** → `.claude/actionflows/flows/, .claude/actionflows/actions/`

**Gate:** Context inventory delivered.

---

### Step 3: Interactive Brainstorming

**Action:** `brainstorm/`
**Model:** opus
**Run Mode:** FOREGROUND (not background)

**Spawn with:**
```
Read your definition in .claude/actionflows/actions/brainstorm/agent.md

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
- idea: {idea from human}
- classification: {classification from Step 1}
- context: {context inventory from Step 2}
```

**Gate:** Session completed.

---

### Step 4: Produce Summary

**Action:** `code/`
**Model:** haiku
**Note:** Using code/ for document generation is standard framework practice.

**Spawn to create summary doc:**
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
- task: Create ideation summary document at .claude/actionflows/logs/ideation/{idea-slug}_{YYYY-MM-DD-HH-MM-SS}/summary.md
- context: Session transcript from Step 3, session outputs
```

**Summary doc format:**
```markdown
# Ideation Summary: {idea}

## Idea Description
{Clear description of the idea}

## Classification
{Technical / Functional / Framework}

## Key Decisions
- {Decision 1}
- {Decision 2}
- ...

## Open Questions
- {Question 1}
- {Question 2}
- ...

## Concrete Next Steps
1. {Next step}
2. {Next step}
3. ...

## Session Artifacts
- Session transcript: {path}
- Key insights: {summary}
```

**Gate:** Summary saved.

---

## Dependencies

```
Step 1 → Step 2 → Step 3 → Step 4 (fully sequential)
```

**Parallel groups:** None — fully sequential flow.

---

## Chains With

May chain to relevant flows based on "concrete next steps" from summary:
- Technical ideas → `code-and-review/`
- Functional ideas → `code-and-review/` (after planning)
- Framework ideas → `flow-creation/` or `action-creation/`
