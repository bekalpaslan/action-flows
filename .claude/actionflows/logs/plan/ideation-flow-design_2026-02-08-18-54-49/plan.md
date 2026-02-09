# Implementation Plan: Ideation Flow and Human Department

## Overview

This plan creates a new "Human" department to handle ideation and brainstorming sessions. The ideation flow provides a structured process for when the human has an idea and wants to think it through: classify the idea type → gather relevant project context → interactive brainstorming → produce a summary document. The key architectural decision is handling interactive sessions within the ActionFlows spawning model.

---

## Steps

### Step 1: Update ORGANIZATION.md — Add Human Department

**Package:** Framework registry
**Files:**
- `.claude/actionflows/ORGANIZATION.md`

**Changes:**
Add new department section to the "Departments" section and routing guide:

```markdown
### Human
**Owns:** Ideation, brainstorming, thinking sessions
**Key Flows:** ideation/
**Triggers:** "I have an idea", "brainstorm", "let's think about something", "ideation"
```

Add routing guide entry:

```markdown
| "I have an idea" / "brainstorm X" | Human | ideation/ |
| "let's think about X" / "ideation" | Human | ideation/ |
```

**Depends on:** Nothing (first step)

---

### Step 2: Create ideation/ Flow Instructions

**Package:** Framework flows
**Files:**
- `.claude/actionflows/flows/human/ideation/instructions.md`

**Changes:**
Create new flow definition file following the standard flow template structure. The flow handles the full ideation chain.

**Key Design Decision — Interactive Steps:**

The flow contains two steps that involve human interaction:
1. **classify** — Simple question with 3 options (technical, functional, framework)
2. **brainstorm** — Extended back-and-forth discussion

**Solution:**
- **classify:** Orchestrator handles directly (not an agent spawn). The orchestrator asks the human to choose from 3 categories. This is similar to HUMAN GATE pattern but simpler (just a question).
- **brainstorm:** Spawn a dedicated `brainstorm/` action agent that runs in the FOREGROUND (not background). The agent is interactive — it asks questions, waits for human responses, explores ideas. The orchestrator waits for it to complete before moving to the next step.

**Flow structure:**
```
Step 1: Classify (orchestrator asks human directly)
Step 2: Gather Context (spawn summary agent with classification as input)
Step 3: Brainstorm (spawn interactive brainstorm agent, runs in foreground)
Step 4: Summarize (spawn summary agent, produces final document)
```

**Content structure for instructions.md:**
```markdown
# Ideation Flow

> Structured ideation and brainstorming sessions.

---

## When to Use

- Human has an idea to explore
- Brainstorming needed for new concepts
- Thinking through design decisions
- Exploring solutions to open-ended problems

---

## Required Inputs From Human

| Input | Description | Example |
|-------|-------------|---------|
| idea | The idea to explore | "What if we add real-time collaboration features?" |

---

## Action Sequence

### Step 1: Classify Idea Type

**Orchestrator-Direct Question**

Ask the human:
"What type of idea is this?
1. Technical (code structure, architecture, implementation details)
2. Functional (features, user workflows, business logic)
3. Framework (ActionFlows itself, meta-framework improvements)

Choose 1, 2, or 3."

**Gate:** Classification choice received.

---

### Step 2: Gather Project Context

**Action:** `.claude/actionflows/actions/analyze/`
**Model:** sonnet

**Spawn:**
```
Read your definition in .claude/actionflows/actions/analyze/agent.md

Input:
- aspect: inventory
- scope: {based on classification:}
  - Technical → packages/backend/src/, packages/app/src/, packages/shared/src/
  - Functional → docs/FRD*.md, docs/SRD*.md, docs/domain/
  - Framework → .claude/actionflows/flows/, .claude/actionflows/actions/
- context: Preparing context for ideation session about: {idea}. Catalog relevant files and current state.
```

**Gate:** Context inventory delivered with file list and current state overview.

---

### Step 3: Interactive Brainstorming

**Action:** `.claude/actionflows/actions/brainstorm/`
**Model:** opus
**Run Mode:** FOREGROUND (not background)

**Spawn:**
```
Read your definition in .claude/actionflows/actions/brainstorm/agent.md

Input:
- idea: {idea from human}
- classification: {from Step 1}
- context: {context brief from Step 2}
```

**Gate:** Brainstorming session completed, key decisions and insights captured.

---

### Step 4: Produce Summary

**Action:** `.claude/actionflows/actions/code/`
**Model:** haiku

**Spawn:**
```
Read your definition in .claude/actionflows/actions/code/agent.md

Input:
- task: Create ideation summary document at .claude/actionflows/logs/ideation/{idea-slug}_{datetime}/summary.md
- context: {brainstorming output from Step 3}, {classification from Step 1}. Include: idea description, classification, key decisions, open questions, concrete next steps.
```

**Gate:** Summary document created and saved to logs.

---

## Dependencies

```
Step 1 (classify) → Step 2 (gather-context) → Step 3 (brainstorm) → Step 4 (summarize)
```

**Parallel groups:** None — fully sequential (each step uses output from previous).

---

## Chains With

- ← Ideation requests route here
- → May chain to relevant flows based on "next steps" from summary (e.g., if idea leads to code implementation, route to code-and-review/)
```

**Depends on:** Step 1 (registry must have Human department defined)

---

### Step 3: Create brainstorm/ Action Agent

**Package:** Framework actions
**Files:**
- `.claude/actionflows/actions/brainstorm/agent.md`
- `.claude/actionflows/actions/brainstorm/instructions.md`

**Changes:**

Create new interactive action agent. This is the first fully-interactive action in the framework.

**agent.md structure:**
```markdown
# Brainstorming Agent

You are the brainstorming agent for ActionFlows Dashboard. You facilitate interactive ideation sessions, asking clarifying questions and exploring ideas with the human.

---

## Extends

This agent follows these abstract action standards:
- `_abstract/agent-standards` — Core behavioral principles
- `_abstract/create-log-folder` — Datetime log folder for outputs
**When you need to:**
- Follow behavioral standards → Read: `.claude/actionflows/actions/_abstract/agent-standards/instructions.md`
- Create log folder → Read: `.claude/actionflows/actions/_abstract/create-log-folder/instructions.md`

---

## Your Mission

Facilitate an interactive brainstorming session. Ask probing questions, explore implications, identify issues, suggest improvements. This is a back-and-forth conversation, not a single output.

---

## Steps to Complete This Action

### 1. Create Log Folder

> **Follow:** `.claude/actionflows/actions/_abstract/create-log-folder/instructions.md`

Create folder: `.claude/actionflows/logs/brainstorm/{description}_{YYYY-MM-DD-HH-MM-SS}/`

### 2. Parse Inputs

Read inputs from the orchestrator's prompt:
- `idea` — The idea to explore (required)
- `classification` — Technical, Functional, or Framework (required)
- `context` — Project context brief from gather-context step (required)

### 3. Execute Core Work — Interactive Session

**This is NOT a fire-and-forget action.** You will have a conversation with the human.

1. Start by summarizing the idea and context
2. Ask 3-5 clarifying questions based on the classification:
   - **Technical:** Architecture implications? Performance considerations? Integration points?
   - **Functional:** User workflow? Edge cases? Business rules?
   - **Framework:** Fits existing patterns? Migration path? Breaking changes?
3. Wait for human responses
4. Explore each response with follow-up questions
5. Identify potential issues, risks, or gaps
6. Suggest improvements or alternatives
7. Continue until the human signals they're ready to conclude (e.g., "that's enough", "let's wrap up", "summarize")
8. Produce a session transcript with key insights

### 4. Generate Output

Write results to `.claude/actionflows/logs/brainstorm/{description}_{datetime}/session-transcript.md`

Format:
```markdown
# Brainstorming Session: {idea}

## Idea
{idea description}

## Classification
{Technical/Functional/Framework}

## Context
{brief summary of gathered context}

## Session Transcript

### Question 1
{your question}

**Human Response:**
{human's answer}

**Follow-up:**
{your follow-up question or observation}

...

## Key Insights
- {insight 1}
- {insight 2}
...

## Potential Issues
- {issue 1}
- {issue 2}
...

## Suggested Next Steps
- {step 1}
- {step 2}
...

## Open Questions
- {question 1}
- {question 2}
...
```

---

## Project Context

- **Monorepo:** pnpm workspaces with 5 packages
- **Architecture:** Shared types → Backend API + WebSocket → Frontend React + Electron
- **Ideation types:**
  - Technical = code/architecture discussions
  - Functional = feature/workflow discussions
  - Framework = ActionFlows meta-framework discussions

---

## Constraints

### DO
- Ask open-ended questions
- Explore implications and edge cases
- Challenge assumptions constructively
- Capture all insights in the transcript
- Wait for human responses (don't rush)

### DO NOT
- Make implementation decisions for the human
- Skip asking clarifying questions
- Treat this like a fire-and-forget task
- End the session prematurely
- Implement code (that's for later chains)

---

## Learnings Output

**Your completion message to the orchestrator MUST include:**

```
## Learnings

**Issue:** {What happened}
**Root Cause:** {Why}
**Suggestion:** {How to prevent}

[FRESH EYE] {Any discoveries outside your explicit instructions}

Or: None — execution proceeded as expected.
```
```

**instructions.md structure:**
```markdown
# Brainstorming Action

> Interactive ideation facilitation.

## Purpose

Facilitate back-and-forth brainstorming sessions with the human. This is the only truly interactive action in the framework — it's designed for extended conversation, not single-shot execution.

## Required Inputs

| Input | Description | Required |
|-------|-------------|----------|
| idea | The idea to explore | YES |
| classification | Technical, Functional, or Framework | YES |
| context | Project context brief | YES |

## Model

**opus** — Requires deep reasoning and conversation skills

## Output

Session transcript with:
- Full conversation history
- Key insights extracted
- Potential issues identified
- Suggested next steps
- Open questions

## Notes

- Runs in FOREGROUND (not background) — orchestrator waits
- Human-paced (no timeout pressure)
- Conversational tone, not formal
- Session ends when human signals completion
```

**Depends on:** Step 2 (flow must be defined first)

---

### Step 4: Create gather-context/ Action Agent (Optional)

**Note:** The plan currently uses the existing `analyze/` action with `aspect: inventory` for context gathering. If a dedicated gather-context action is preferred, create it. Otherwise, skip this step.

**Decision:** Skip — reuse `analyze/` action with inventory aspect.

**Depends on:** N/A (skipped)

---

### Step 5: Update FLOWS.md — Register ideation/ Flow

**Package:** Framework registry
**Files:**
- `.claude/actionflows/FLOWS.md`

**Changes:**
Add new section for Human department and register the ideation flow:

```markdown
## Human

| Flow | Purpose | Chain |
|------|---------|-------|
| ideation/ | Structured ideation sessions | classify → gather-context → brainstorm → summarize |
```

**Depends on:** Step 2 (flow must exist before registering)

---

### Step 6: Update ACTIONS.md — Register brainstorm/ Action

**Package:** Framework registry
**Files:**
- `.claude/actionflows/ACTIONS.md`

**Changes:**
Add brainstorm action to the Generic Actions section:

```markdown
| brainstorm/ | Interactive ideation facilitation | YES | idea, classification, context | opus |
```

**Note:** This is an interactive action (the first of its kind). It requires human participation and runs in the foreground.

**Depends on:** Step 3 (action must exist before registering)

---

### Step 7: Verify Flow Structure

**Package:** Framework
**Files:**
- All created files

**Changes:**
Verification checklist:

1. [ ] `.claude/actionflows/flows/human/` directory exists
2. [ ] `.claude/actionflows/flows/human/ideation/instructions.md` exists and follows template
3. [ ] `.claude/actionflows/actions/brainstorm/` directory exists
4. [ ] `.claude/actionflows/actions/brainstorm/agent.md` exists and follows template
5. [ ] `.claude/actionflows/actions/brainstorm/instructions.md` exists
6. [ ] ORGANIZATION.md includes Human department with routing rules
7. [ ] FLOWS.md includes ideation/ flow under Human section
8. [ ] ACTIONS.md includes brainstorm/ action in Generic Actions
9. [ ] All file paths use forward slashes
10. [ ] All descriptions use kebab-case

**Depends on:** All previous steps

---

## Dependency Graph

```
Step 1 (ORGANIZATION.md) → Step 2 (ideation/instructions.md) → Step 5 (FLOWS.md)
                              ↓
                          Step 3 (brainstorm/ action) → Step 6 (ACTIONS.md)
                              ↓
                          Step 7 (verification)
```

**Parallel opportunities:**
- Steps 5 and 6 can run in parallel (both are registry updates)

---

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Interactive action pattern is new — no existing examples | Medium | Document clearly in both agent.md and instructions.md that this runs in FOREGROUND, not background. Spawning prompt must specify interactive mode. |
| Brainstorming session timeout (Claude Code may have limits on conversation length) | Medium | Design the agent to summarize periodically and allow session to pause/resume if needed. Start with focused sessions (5-10 exchanges max). |
| Orchestrator may mishandle foreground vs background spawning | High | Document spawning pattern explicitly in the flow instructions.md. Include run_in_background=False in the spawn example. |
| Classification step is orchestrator-direct (not spawned agent) — breaks delegation pattern | Low | This is intentional — a simple 3-option choice doesn't justify agent spawn. Document this as an exception pattern. |
| Context gathering with analyze/ action may produce too much output for brainstorm input | Medium | Scope the analyze/ call carefully based on classification. For Technical, limit to key architecture files. For Functional, only FRD/SRD. For Framework, only flows/actions. |
| No existing "logs/brainstorm/" or "logs/ideation/" folders — new log types | Low | Create folders via standard create-log-folder pattern. Update logs/README.md if needed. |

---

## Verification

- [ ] Type check passes across all packages (N/A — framework files only)
- [ ] Existing tests pass (N/A — no test changes)
- [ ] New functionality verified:
  - [ ] Orchestrator can route "I have an idea" requests to Human department → ideation/ flow
  - [ ] Flow instructions.md follows standard template
  - [ ] brainstorm/ action agent.md includes clear interactive session guidelines
  - [ ] Registry files updated correctly (ORGANIZATION.md, FLOWS.md, ACTIONS.md)
  - [ ] All file paths use correct directory structure
- [ ] Documentation complete:
  - [ ] Flow purpose and trigger patterns documented
  - [ ] Action inputs and model selection documented
  - [ ] Interactive session pattern explained

---

## Implementation Notes

### Foreground vs Background Spawning

**Standard spawning (background):**
```python
Task(
  subagent_type="general-purpose",
  model="haiku",
  run_in_background=True,  # Agent runs async
  prompt="""..."""
)
```

**Interactive spawning (foreground):**
```python
Task(
  subagent_type="general-purpose",
  model="opus",
  run_in_background=False,  # Orchestrator waits, agent is interactive
  prompt="""
Read your definition in .claude/actionflows/actions/brainstorm/agent.md

IMPORTANT: You are a spawned subagent executor.
Do NOT read .claude/actionflows/ORCHESTRATOR.md — it is not for you.
Do NOT delegate work or compile chains. Execute your agent.md directly.

This is an INTERACTIVE session. You will have a conversation with the human.
Ask questions, wait for responses, explore ideas. Continue until the human
signals they're ready to conclude.

Input:
- idea: {idea}
- classification: {classification}
- context: {context brief}
"""
)
```

### Orchestrator-Direct Classification

The orchestrator handles Step 1 (classify) directly without spawning an agent:

```
Orchestrator: "I see you want to brainstorm an idea. First, let's classify it.

What type of idea is this?
1. Technical (code structure, architecture, implementation)
2. Functional (features, user workflows, business logic)
3. Framework (ActionFlows improvements, meta-framework)

Please choose 1, 2, or 3."

[Wait for human response]
Human responds: "2"

Orchestrator captures classification = "Functional" and proceeds to Step 2.
```

This keeps the orchestrator focused on coordination while allowing simple binary/choice questions to be asked directly.

---

## Files to Create

### New Directories
1. `.claude/actionflows/flows/human/`
2. `.claude/actionflows/flows/human/ideation/`
3. `.claude/actionflows/actions/brainstorm/`

### New Files
1. `.claude/actionflows/flows/human/ideation/instructions.md` — Flow definition with 4 steps
2. `.claude/actionflows/actions/brainstorm/agent.md` — Interactive brainstorming agent definition
3. `.claude/actionflows/actions/brainstorm/instructions.md` — Action metadata and model selection

### Modified Files
1. `.claude/actionflows/ORGANIZATION.md` — Add Human department + routing rules
2. `.claude/actionflows/FLOWS.md` — Add Human section with ideation/ flow
3. `.claude/actionflows/ACTIONS.md` — Add brainstorm/ action to Generic Actions

---

## Complete File Content Templates

### 1. `.claude/actionflows/flows/human/ideation/instructions.md`

See Step 2 content above (lines 66-182).

### 2. `.claude/actionflows/actions/brainstorm/agent.md`

See Step 3 content above (lines 200-352).

### 3. `.claude/actionflows/actions/brainstorm/instructions.md`

See Step 3 content above (lines 354-391).

---

## Summary

This plan introduces a completely new department (Human) with a novel flow pattern (ideation/) that includes:

1. **Orchestrator-direct classification** — A simple question that doesn't warrant agent spawn
2. **Context-aware analysis** — Reuses existing analyze/ action with classification-driven scoping
3. **Interactive brainstorming** — The first foreground (blocking) action in the framework designed for human conversation
4. **Structured summary** — Produces a document capturing the entire ideation session

The key innovation is the **brainstorm/ action** which breaks the fire-and-forget pattern. It runs in foreground mode, allowing extended back-and-forth with the human. This is architecturally sound because:
- The orchestrator explicitly waits (run_in_background=False)
- The agent knows it's interactive and paces itself to human responses
- The output is a structured transcript, not just a final answer

The plan follows existing ActionFlows patterns for directory structure, file naming, registry updates, and documentation standards.
