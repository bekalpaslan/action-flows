# Onboarding Questionnaire Design — Summary

**Date:** 2026-02-08
**Full Plan:** `plan.md` (in this directory)

---

## What Was Designed

An **interactive flow** that teaches humans the ActionFlows framework through 10 progressive modules, structured as Beginner → Intermediate → Advanced levels.

---

## Key Design Decisions

1. **Format:** Interactive flow (not static document)
   - Claude asks questions, validates understanding
   - Human responds, progresses at own pace
   - One question at a time (MEMORY.md rule)

2. **Structure:** 10 modules in 3 levels
   - Beginner (5 modules, ~45 min): Use safely
   - Intermediate (4 modules, ~95 min): Customize
   - Advanced (5 modules, ~165 min): Evolve framework

3. **Integration with bootstrap:** Wraps around, not replaces
   - Bootstrap creates framework (builder phase)
   - Onboarding teaches human (user phase)
   - Optional: Bootstrap-first if framework doesn't exist

4. **Teaching approach:** Show before tell
   - Present examples
   - Explain concept
   - Quiz understanding
   - Validate answer
   - Synthesize key takeaway

5. **Navigation:** Flexible
   - Skip ahead to Advanced
   - Go back to previous modules
   - Review specific topics
   - Pause and resume later

6. **Outputs:** Practical deliverables
   - Quick reference card (after Beginner)
   - Completion certificate (after Advanced)
   - Session log (transcript of Q&A)

---

## What Gets Implemented

### Files to Create (18 files total)

**Flow structure:**
```
.claude/actionflows/flows/framework/onboarding/
├── instructions.md                    # Flow definition
├── modules/
│   ├── 01-welcome.md
│   ├── 02-core-cycle.md
│   ├── 03-sacred-formats.md
│   ├── 04-safe-evolution.md
│   ├── 05-sin-test.md
│   ├── 06-department-routing.md
│   ├── 07-review-pipeline.md
│   ├── 08-contract.md
│   ├── 09-harmony.md
│   └── 10-completion.md
└── templates/
    ├── quick-reference-card.md
    └── completion-certificate.md
```

**Action:**
```
.claude/actionflows/actions/onboarding/
├── agent.md                          # Agent instructions
└── instructions.md                   # Action metadata
```

**Registry updates:**
- FLOWS.md: Add onboarding/ entry
- ACTIONS.md: Add onboarding/ entry
- ORGANIZATION.md: Add routing triggers

---

## Teaching Progression

### Beginner Level (5 modules)

**Module 1: Welcome & Orientation** (10 min)
- What is ActionFlows?
- Three parts: Orchestrator, Dashboard, Contract
- Three levels of teaching
- Human role assessment

**Module 2: The Core Cycle** (10 min)
- Chain compilation → approval → execution
- Example: "Implement login rate limiting"
- Quiz: What happens when you say "Execute"?

**Module 3: Sacred Formats** (15 min)
- Dashboard PARSES it → Sacred
- Dashboard READS it → Safe
- 14 sacred formats with examples
- Quiz: Which can you safely change?

**Module 4: Safe Evolution** (10 min)
- Adding flows, actions, departments
- Modifying agent instructions
- Customizing routing
- Quiz: How to add a flow?

**Module 5: The Sin Test** (10 min)
- Orchestrator coordinates, never produces
- Examples of sins and correct behavior
- Two exemptions: registry edits, quick triage
- Quiz: What to do when orchestrator violates boundary?

**Deliverable:** Quick reference card

---

### Intermediate Level (4 modules)

**Module 6: Department Routing** (15 min)
- ORGANIZATION.md structure
- Routing workflow: intent → department → flow
- Customizing routing table
- Practice: Add new routing trigger

**Module 7: The Review Pipeline** (20 min)
- Primary review + second opinion
- Dual output format
- Critical rule: Second opinion doesn't block commit
- Action modes: assess vs assess+fix
- Quiz: What happens with second opinion?

**Advanced Level not yet reached at Intermediate completion**

---

### Advanced Level (5 modules)

**Module 8: The Contract** (30 min)
- Harmony bridge concept
- CONTRACT.md structure
- Format anatomy: structure, fields, types, parsers, components
- Example parsing workflow
- Quiz: What to update when adding column?

**Module 9: Harmony & Living Model** (25 min)
- How harmony detection works
- Three harmony states: in sync, out of sync, migration
- Living software philosophy
- Evolution workflow example
- Sacred vs safe boundary
- Quiz: Dashboard shows "parsing incomplete"—what do you check?

**Module 10: Completion** (5 min)
- Summary of all learnings
- Generate completion certificate
- Recommended next steps
- Final choices: review, quiz, start using

**Deliverable:** Completion certificate

---

## Interactive Mechanics

**Standard pattern for each module:**
1. Present concept with examples
2. Explain in 1-2 sentences
3. Demonstrate with concrete walkthrough
4. Quiz with multiple choice question
5. Validate answer (correct/incorrect feedback)
6. Synthesize key takeaway

**Navigation options:**
- "Skip to Advanced" → Jump ahead
- "Go back to sacred formats" → Return to Module 3
- "Explain X again" → Re-present module
- "Take a break" → Save progress, exit
- "Continue onboarding" → Resume from saved position

**One question at a time:** Critical rule from MEMORY.md
- Claude asks ONE question
- WAIT for human response
- Validate
- Proceed to next

---

## How It Relates to Bootstrap

**Bootstrap.md** (builder phase):
- Agent reads project code
- Creates framework structure
- Writes ORCHESTRATOR.md, CLAUDE.md, registries
- Output: Working framework

**Onboarding** (user phase):
- Agent teaches human how to use framework
- Validates understanding through quizzes
- Output: Educated human + reference materials

**Integration point:**
Onboarding checks if framework exists:
- No → Offer to bootstrap first → Run bootstrap → Continue
- Yes → Proceed directly to teaching

---

## Implementation Readiness

This plan is **ready for code/ agent** to implement. It includes:

✅ Exact file paths for all 18 files
✅ Complete module content outlines
✅ Full examples of quiz questions and validation responses
✅ Template structures for outputs
✅ Registry update specifications
✅ Integration logic with bootstrap
✅ Navigation mechanics
✅ Teaching progression details

**Next step:** Compile chain with code/ action to create all files.

---

## Alignment with Teaching Inventory

This design follows the teaching order from the inventory report:
- ✅ Beginner: Sacred formats, safe evolution, sin test, core cycle
- ✅ Intermediate: Department routing, review pipeline, action modes
- ✅ Advanced: Contract, harmony detection, living software model

Progressive disclosure matches the inventory's recommended teaching levels.

---

**Design complete. Plan is implementation-ready.**
