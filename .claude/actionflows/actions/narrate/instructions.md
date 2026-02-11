# Narrate Action

> Write poetic chapters about the project's journey, grounded in conversation history data and analysis.

---

## Requires Input: YES

---

## Extends

This agent is **explicitly instructed** to execute:
- `_abstract/agent-standards` — Core behavioral principles
- `_abstract/create-log-folder` → Creates `.claude/actionflows/logs/narrate/{datetime}/`

---

## Inputs

| Input | Required | Description | Default |
|-------|----------|-------------|---------|
| chapterNumber | YES | Chapter number to write (1, 2, 3, ...) | — |
| analysisPath | YES | Path to CONVERSATION_HISTORY_ANALYSIS.md or similar analysis file | — |
| previousChapters | NO | Array of paths to previous chapter markdown files | [] |
| theme | NO | Optional theme/focus for this chapter (e.g., "The Bootstrap", "Framework Crystallization") | auto-detect |
| context | NO | Additional context from orchestrator | — |

---

## Model

**opus** — Deep creative writing and poetic narrative capability needed for chapter composition.

---

## How Orchestrator Spawns This

1. Collect inputs:
   - `chapterNumber`: From human request or orchestrator's planning
   - `analysisPath`: Path to generated analysis file
   - `previousChapters`: List of completed chapter files (empty for chapter 1)
   - `theme`: From human request (optional)
   - `context`: From orchestrator (optional)

2. Spawn:

```
Read your definition in .claude/actionflows/actions/narrate/agent.md

Input:
- chapterNumber: 1
- analysisPath: .claude/actionflows/logs/analyze/story-of-us_2026-02-11-14-30-00/CONVERSATION_HISTORY_ANALYSIS.md
- previousChapters: []
- theme: Genesis — The Bootstrap
- context: First chapter of the story-of-us narrative arc
```

---

## Purpose

Write ONE poetic chapter about the ActionFlows Dashboard's journey, grounded in real conversation data. Each chapter builds progressively on previous ones, using cosmic metaphors and emotional narrative while anchoring to specific dates, session counts, and milestones extracted from conversation history analysis.

---

## Output

Chapter markdown file saved to `.claude/actionflows/logs/narrate/chapter-{N}_{datetime}/chapter-{N}.md`

Output specification:
- Chapter number and poetic title
- 800-1500 words of narrative prose
- Data-grounded (dates, sessions, message counts)
- Progressive narrative building on previous chapters
- Natural transition point to next chapter
- Cosmic/universe aesthetic throughout

---

## Gate

Chapter written and validated:
- [ ] File exists: `chapter-{N}.md`
- [ ] Word count: 800-1500 words
- [ ] Title is poetic (not generic)
- [ ] At least 3 data references
- [ ] References previous chapters (if applicable)
- [ ] Ends with natural transition

---

## Notes

- **Foreground execution:** Runs as a direct execution step, not background
- **Single responsibility:** One chapter per execution
- **Data-driven:** All facts grounded in provided analysis
- **Progressive:** Each chapter builds on previous narrative arcs
- **Creative fidelity:** Poetic voice is essential—not a summary document
- **Cosmic aesthetic:** Universe/star/bridge/light metaphors are foundational to voice
