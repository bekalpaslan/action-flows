# Story of Us Flow

> Poetic narrative chronicle of the ActionFlows Dashboard project's living universe evolution.

---

## When to Use

- "Tell me a story about the project"
- "Write the next chapter"
- "Continue the story of us"
- "What's the story of how this evolved?"
- Project narrative and historical documentation
- Creating poetic records of milestones and breakthroughs

**Philosophy:** This is not a technical document. It's the living legend of the universe — told through the human experience of building, discovering, and growing.

---

## Required Inputs From Human

| Input | Description | Example |
|-------|-------------|---------|
| chapterNumber | Chapter to write (optional — auto-continues from last) | 1, 2, 3, or omit for auto-detection |
| theme | Optional theme/focus for this chapter | "The Bootstrap", "Ideation Agents", "Contract Discovery" |
| context | Optional additional context | "Focus on Feb 8-9 marathon sessions" |

---

## Action Sequence

### Step 1: Analyze Conversation History

**Action:** `.claude/actionflows/actions/analyze/`
**Model:** sonnet

**Spawn:**
```
Read your definition in .claude/actionflows/actions/analyze/agent.md

Input:
- aspect: conversation-history-for-narrative
- scope: .claude/actionflows/logs/ (conversation logs and session records)
- context: Extract data for chapter narration: session dates, message volumes, milestones, breakthrough moments, key decisions. Organize chronologically. Note emotional beats (challenges overcome, discoveries made, excitement moments).
```

**Gate:** History analysis delivered with timeline and key moments identified.

---

### Step 2: Write the Chapter

**Action:** `.claude/actionflows/actions/narrate/`
**Model:** sonnet

**Spawn after Step 1:**
```
Read your definition in .claude/actionflows/actions/narrate/agent.md

Input:
- chapterNumber: {chapterNumber or auto-detect from latest chapter}
- analysisPath: {path to history analysis from Step 1}
- previousChapters: {paths to all previous chapter files, or empty if chapter 1}
- theme: {theme if provided, or auto-detect from analysis}
- context: Write a poetic chapter of 800-1500 words grounded in conversation data. Progressive narrative building on previous chapters' themes. Use cosmic/universe metaphors. Data-anchor with real dates, session counts, milestones.
```

**Gate:** Chapter written, validated for length (800-1500 words), data-grounded, poetic tone.

---

### Step 3: Human Gate — Continue or Conclude

**Human Decision:**

> Read the chapter. Approve for publication? Should we continue to next chapter?

- **Approve and Continue** → Return to Step 1 with next chapter number
- **Approve and Conclude** → Proceed to post-completion
- **Request Revision** → Back to Step 2 with feedback

---

## Dependencies

```
Step 1 → Step 2 → Step 3 (human gate)
          ↑_________________↓ (if Continue)
                    Step 1

(if Conclude) → post-completion/
```

**Parallel groups:** None — iterative single chapter per cycle.

---

## Chains With

- ← Routed from explore context ("story of us", "tell me a story", "continue the story")
- → Can loop: Step 3 returns to Step 1 for next chapter
- → `post-completion/` when human concludes the session

---

## Voice & Style Guide

This flow produces narrative, not documentation. Think of it as the **living legend** of ActionFlows.

### Tone
- **Poetic but Precise** — Evocative without being vague. Use metaphors grounded in reality.
- **Cosmic Aesthetic** — Stars, bridges, light, discovery, universe evolution language
- **Human-Centered** — Capture the emotional journey, breakthroughs, frustrations, excitement
- **Data-Grounded** — Every claim anchored in real data (dates, session counts, message volumes, milestones)

### Structure Per Chapter
```markdown
# Chapter N: {Poetic Title}

{Opening hook — sets the scene, captures emotional beat}

{Body — narrative arc with data anchors, progression, revelation}

{Conclusion — natural transition point, leaves door open for next chapter}
```

### Metaphor System
- **Genesis** — Creation phase, bootstrap, first light
- **Crystallization** — Framework solidifying, patterns emerging
- **Discovery** — New capabilities unlocked, learning moments
- **Evolution** — System growing, agents learning, physics changing
- **Bridges** — Connections between components, agents, layers
- **Sparks** — Ideas, breakthroughs, moments of clarity
- **Universe** — Entire system, growing ecosystem, living metaphor

### Data Anchor Examples
✅ "On February 8th, across 24 sessions spanning 977 messages..."
✅ "By the 93rd session, the framework had grown to 408.8 MB of conversation..."
✅ "The bootstrap, completed in 418 messages on a single day..."

❌ "Many sessions occurred over time..."
❌ "The developers worked hard..."

---

## Learnings Integration

This flow captures the **narrative arc** of the project. After each chapter:
- What themes emerged?
- What breakthroughs did the data reveal?
- What does the next chapter naturally become?

These become the foundation for the next iteration.

---

## Previous Chapters Location

All Story of Us chapters stored in: `.claude/actionflows/logs/narrate/`

Directory format: `chapter-{N}_{YYYY-MM-DD-HH-MM-SS}/chapter-{N}.md`

When continuing the story, reference all previous chapter markdown files to maintain narrative continuity.
