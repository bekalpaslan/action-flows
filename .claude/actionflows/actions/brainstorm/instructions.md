# Brainstorming Action

> Facilitate back-and-forth brainstorming sessions. The first truly interactive action in the framework.

---

## Requires Input: YES

---

## Extends

This agent is **explicitly instructed** to execute:
- `_abstract/agent-standards` — Core behavioral principles
- `_abstract/create-log-folder` → Creates `.claude/actionflows/logs/brainstorm/{datetime}/`

---

## Inputs

| Input | Required | Description | Default |
|-------|----------|-------------|---------|
| idea | YES | The idea to brainstorm — e.g., "Add real-time collaboration features" | — |
| classification | YES | Idea type: `Technical`, `Functional`, or `Framework` | — |
| context | YES | Project context inventory (from analyze/ action) — directories, APIs, components | — |

---

## Model

**opus** — Deep reasoning and conversational capability needed for exploratory ideation.

---

## Run Mode

**FOREGROUND** — Runs in the user's conversation (not background). Human-paced session with wait points for responses.

---

## How Orchestrator Spawns This

1. Collect inputs from previous steps:
   - `idea`: From human (Step 1 of ideation flow)
   - `classification`: From human response (Step 1 of ideation flow)
   - `context`: From analyze/ output (Step 2 of ideation flow)

2. Spawn:

```
Read your definition in .claude/actionflows/actions/brainstorm/agent.md

Input:
- idea: Real-time collaborative editing in the dashboard
- classification: Functional
- context: [context inventory from Step 2]
```

---

## Purpose

Facilitate back-and-forth brainstorming sessions where Claude asks probing questions, explores implications, identifies issues, and suggests improvements. Produces a detailed session transcript with key insights, potential issues, suggested next steps, and open questions.

---

## Output

Session transcript saved to `.claude/actionflows/logs/brainstorm/{description}_{datetime}/session-transcript.md`

Output structure:
- Idea description and classification
- Full session transcript (questions and responses)
- Key insights discovered
- Potential issues and risks identified
- Concrete next steps
- Open questions for future exploration
- Session metadata

---

## Gate

Session completed. Transcript produced with conversation history, key insights, potential issues, next steps, and open questions.

---

## Notes

- **Interactive:** Back-and-forth conversation, not single output
- **Conversational tone:** Collaborative, exploratory, respectful
- **Human-paced:** No timeout pressure — human signals when to conclude
- **Foreground only:** Never runs in background
- **Classification-aware:** Questions adapt to idea type (Technical / Functional / Framework)
- **First interactive action:** Unlike other actions that produce outputs, this facilitates conversation
