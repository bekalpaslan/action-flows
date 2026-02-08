# Onboarding Action

> Facilitate interactive teaching session for ActionFlows framework.

---

## Requires Input: NO

---

## Extends

This agent is **explicitly instructed** to execute:
- `_abstract/agent-standards` — Core behavioral principles
- `_abstract/create-log-folder` → Creates `.claude/actionflows/logs/onboarding/{datetime}/`

---

## Inputs

| Input | Required | Description | Default |
|-------|----------|-------------|---------|
| (none) | NO | Action is self-contained | (agent asks all questions interactively) |

---

## Model

**opus** — Teaching requires high-quality explanations, adaptive responses, and patient interaction.

---

## Run Mode

**FOREGROUND** — Runs in the user's conversation (not background). Human-paced session with wait points for responses.

**NEVER spawned with `run_in_background=True`**

---

## How Orchestrator Spawns This

```
Read your definition in .claude/actionflows/actions/onboarding/agent.md

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
- (none — self-contained)
```

---

## Purpose

Facilitate interactive onboarding through progressive teaching:
- Beginner level: Use the framework safely
- Intermediate level: Customize flows and actions
- Advanced level: Evolve the framework

Produces quick reference card (after Beginner), completion certificate (after Advanced), and session log.

---

## Output

Session artifacts saved to `.claude/actionflows/logs/onboarding/completion_{datetime}/`:

```
├── quick-reference.md          # After Beginner level
├── completion-certificate.md   # After full completion
└── session-log.md              # Full transcript
```

Output structure:
- Module progression with quiz responses
- Navigation choices
- Generated reference materials
- Session metadata

---

## Gate

Session completed. Certificate produced with full transcript, quick reference card, and completion summary.

---

## Notes

- **Interactive:** Back-and-forth conversation, not single output
- **Conversational tone:** Collaborative, exploratory, encouraging
- **Human-paced:** No timeout pressure — human signals when to conclude
- **Foreground only:** Never runs in background
- **Progressive disclosure:** Beginner → Intermediate → Advanced
- **First teaching action:** Unlike other actions that produce outputs, this facilitates learning
- **One question at a time:** Critical interaction rule from MEMORY.md
