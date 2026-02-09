# Module 6: Context Routing

**Level:** Intermediate
**Duration:** ~15 min
**Prerequisites:** Modules 1-5 (Beginner complete)

---

## Presentation

Welcome to Intermediate level!

You've learned to USE the framework safely. Now let's learn to CUSTOMIZE it.

We'll start with context routing—how requests map to workbench contexts and flows.

---

## Structure

CONTEXTS.md defines contexts and routing:

### Routable Contexts (6):
```
├── work — Active feature development (🔨)
├── maintenance — Bug fixes and refactoring (🔧)
├── explore — Research and learning (🔍)
├── review — Code reviews and audits (👁️)
├── settings — Configuration and framework (⚙️)
└── pm — Project management (📋)
```

### Auto-Target Contexts (2):
```
├── archive — Completed sessions (📦)
└── harmony — Violations and remediations (❤️)
```

### Manual-Only Context (1):
```
└── editor — Full-screen code editing (📝)
```

### Routing Table:
```markdown
| Human Says | Context | Flow/Action |
|------------|---------|-------------|
| "implement X" | work | code-and-review/ |
| "fix bug X" | maintenance | bug-triage/ |
| "audit security" | review | audit-and-fix/ |
| "I have an idea" | explore | ideation/ |
```

This is the FIRST routing decision in the orchestrator's workflow.

---

## Example Walk-Through

**Request:** "implement rate limiting"

### Step 1: Extract keywords
Orchestrator extracts: `["implement", "rate limiting"]`

### Step 2: Score contexts
Based on triggers in CONTEXTS.md:
- `work` → Match: "implement" (trigger word)
- `maintenance` → No match
- `explore` → No match
- `review` → No match
- `settings` → No match
- `pm` → No match

**Winner:** `work` context

### Step 3: Find flow
Orchestrator reads FLOWS.md for flows in `work` context:

```markdown
## work Context

| Flow | Purpose | Chain |
|------|---------|-------|
| code-and-review/ | Implement features with quality checks | code → review → commit |
| post-completion/ | Update docs after changes | docs → commit |
```

Match: `"implement"` + `"feature"` → code-and-review/

### Step 4: Build chain
Orchestrator loads code-and-review/ instructions:

Action sequence: code → review → commit
[Builds chain table as you've seen]

### Step 5: Present for approval
[Shows chain to human]

---

## Context Scoring

When multiple contexts might match, the orchestrator uses a scoring system:

**Keyword extraction:** Identify key verbs and nouns from request

**Trigger matching:** Count matches against each context's trigger list

**Selection:**
- Clear winner (score ≥ 2 and 2× second place) → Auto-select
- Ambiguous (multiple high scores) → Ask human to disambiguate
- No matches → Default to `explore` context (research mode)

---

## Customization

You can customize routing by editing CONTEXTS.md:

### Add new triggers:
```markdown
**Triggers:** implement, build, create, add feature, develop, construct
```
(Add `construct` to `work` context triggers)

### Change context for a phrase:
Move "brainstorm" from `explore` to `pm` if your team treats it as planning.

### Add flows to context:
Create new flow in `.claude/actionflows/flows/{context}/` and register in FLOWS.md.

---

## Quiz

**Question:** You want requests like "check dependencies" to route to the `review` context and trigger a new flow called "dependency-audit/".

What steps would you take?

A. Add "check dependencies" trigger to `review` context in CONTEXTS.md only
B. Create dependency-audit/ flow and register in FLOWS.md only
C. Add trigger to CONTEXTS.md AND create + register the flow in FLOWS.md
D. Edit ORCHESTRATOR.md to add a special routing rule

(Choose the best answer)

---

## Expected Answer

**Correct:** C

---

## Validation Responses

### If Correct
"Exactly! Context routing requires two pieces: 1) The trigger mapping in CONTEXTS.md (so orchestrator knows which context to route to), and 2) The flow definition registered in FLOWS.md (so orchestrator knows what chain to build). Both are needed for a complete routing path."

### If Wrong
"Good thinking, but you need both pieces. CONTEXTS.md tells the orchestrator WHICH context to route to (step 1), and FLOWS.md tells it WHAT chain to build (step 2). Without both, routing would be incomplete. You'd add the trigger to review context AND create/register the dependency-audit/ flow."

---

## Key Takeaway

Context routing is the framework's entry point:
1. Human intent → Keyword extraction
2. Keywords → Context scoring
3. Context winner → Flow selection (or dynamic action composition)

Customize it by editing CONTEXTS.md. Changes take effect at next session-start (no framework restart needed).

**Key difference from legacy:** No more departments (Framework, Engineering, QA, Human). Instead, contexts map directly to workbench UI panels where work happens.

---

## Transition

"Next: The review pipeline—how ActionFlows maintains quality."

Proceed to Module 7.
