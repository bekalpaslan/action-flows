# Module 5: The Sin Test

**Level:** Beginner
**Duration:** ~10 min
**Prerequisites:** Modules 1-4

---

## Presentation

Time for the most important rule: **The Sin Test**

The orchestrator has ONE job: **coordinate work**.

Before EVERY action, the orchestrator asks itself:

```
┌──────────────────────────────────────────────────┐
│ Am I about to produce content?                   │
│ (write, analyze, review, code, rewrite, document)│
│                                                  │
│         YES → It's a sin. STOP.                  │
│              Compile a chain. Spawn an agent.    │
│                                                  │
│         NO  → Am I coordinating?                 │
│              (routing, compiling chain,          │
│               updating registry line,            │
│               presenting plan)                   │
│                                                  │
│         YES → Proceed. This is your job.         │
└──────────────────────────────────────────────────┘
```

### Why is this rule absolute?

The orchestrator produces LOW-QUALITY work when it does tasks itself. It's optimized for coordination, not creation. Agents are specialized and produce BETTER output.

**Quality difference:**
- Orchestrator writes code directly → 70% quality
- Orchestrator spawns code/ agent → 95% quality

The sin test protects quality.

**The Sin Test in the Living Universe:**

The Sin Test protects the **division of labor** in the physics-brain-will triad:

**Why the Brain Must Not Be the Hands:**

- **The brain (orchestrator)** understands the big picture—dependencies between files, harmony requirements, execution sequencing. When the brain tries to also be the hands (writing code directly), it loses the ability to coordinate properly.

- **The hands (agents)** are specialized workers focused on specific tasks—one agent reviews code, one writes tests, one modifies UI. Each agent can focus because the brain handles coordination.

**Violation = Breakdown of the Triad:**

When the brain produces content instead of coordinating, the triad breaks:
- Human will becomes confused (who's doing what?)
- Brain loses big-picture view (focused on details instead)
- Hands become redundant (why have agents if brain does the work?)

The Sin Test keeps the triad healthy. The brain coordinates. The hands execute. The system remains a **living collaborative intelligence** instead of a monolithic helper.

---

## Examples

### Sin Example 1: Writing Code Directly ❌

**Bad Orchestrator Response:**
```
Human: "Add error handling to login.ts"

Orchestrator: "I'll add try-catch blocks to login.ts..."
[proceeds to edit code directly]

WHY IT'S A SIN: Producing content (writing code)
```

**Correct Response:** ✅
```
## Chain: Add error handling to login.ts

| # | Action | Model | Key Inputs | Waits For | Status |
|---|--------|-------|------------|-----------|--------|
| 1 | code/  | haiku | file=login.ts, task=add-error-handling | -- | Pending |

Execute?

WHY IT'S CORRECT: Coordinating (compiling chain, spawning agent)
```

### Sin Example 2: Analyzing Code Directly ❌

**Bad Orchestrator Response:**
```
Human: "What's the test coverage?"

Orchestrator: "Let me check the test files..."
[reads tests, calculates coverage, writes analysis]

WHY IT'S A SIN: Producing content (analyzing and reporting)
```

**Correct Response:** ✅
```
## Chain: Analyze test coverage

| # | Action | Model | Key Inputs | Waits For | Status |
|---|--------|-------|------------|-----------|--------|
| 1 | analyze/ | sonnet | aspect=coverage | -- | Pending |

Execute?

WHY IT'S CORRECT: Coordinating (spawning analyze agent)
```

---

## Exemptions (Only 2)

### Exemption 1: Registry Line Edits ✅

Orchestrator CAN directly edit single lines in:
- `logs/INDEX.md` (execution history)
- `logs/LEARNINGS.md` (learnings catalog)
- `FLOWS.md` (flow registry)
- `ACTIONS.md` (action registry)

**Why exempt?** These are bookkeeping, not content creation.

**Threshold:** If change exceeds 5 lines or 1 file → compile chain instead.

### Exemption 2: Quick Triage Mode ✅

Solo developer, trivial fix, 1-3 files, obvious change:
Orchestrator CAN implement directly (read, edit, fix)

But MUST still delegate commit to `commit/` action.

**Why exempt?** Full chain compilation is overhead for typo fixes.

**Use sparingly. When in doubt → compile chain.**

---

## Quiz

**Question:** The orchestrator starts writing a detailed analysis report in the conversation. What should you do?

A. Let it finish—it's being helpful
B. Say "it's a sin" to trigger a reset
C. Approve the analysis and ask for changes
D. Ignore it and move on

(Choose the best answer)

---

## Expected Answer

**Correct:** B

---

## Validation Responses

### If Correct
"Perfect! 'It's a sin' is your reset command. The orchestrator will stop, acknowledge the boundary violation, compile a proper chain with an analyze/ agent, and execute correctly."

### If Wrong
"Actually, this is a boundary violation. The orchestrator is producing content (analysis) instead of coordinating. Say 'it's a sin'—this is a reset command. The orchestrator will stop, compile a chain with analyze/, and delegate properly."

---

## Key Takeaway

The Sin Test is the framework's foundation:
- **Orchestrator = coordinator** (never produces content)
- **Agents = specialists** (produce high-quality output)

If orchestrator violates this boundary, say **"it's a sin"** to reset.

Remember: The sin test exists to PROTECT QUALITY. Agents produce better output than the orchestrator because they're specialized.

---

## Beginner Level Complete!

You've completed the Beginner level! You now know:
- ✅ The core cycle (compilation → approval → execution)
- ✅ Sacred formats (don't change these)
- ✅ Safe evolution (change these freely)
- ✅ The sin test (orchestrator coordinates, never produces)

A quick reference card will be generated for you.

Ready for Intermediate level, or would you like to:
- Review beginner concepts
- Skip to Advanced
- Take a break and continue later
- Test my understanding with a quiz

What would you like to do?

---

## Transition

Based on human choice:
- Continue → Module 6 (Context Routing)
- Review → Return to chosen module
- Break → Save progress, offer resume command
- Quiz → Additional validation questions
