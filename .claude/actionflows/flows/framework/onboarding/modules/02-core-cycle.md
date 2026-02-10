# Module 2: The Core Cycle

**Level:** Beginner
**Duration:** ~10 min
**Prerequisites:** Module 1

---

## Presentation

Let me show you how a request flows through the system.

**Example:** You say "implement login rate limiting"

Here's what happens:

### Phase 1: Compilation

Orchestrator:
1. Reads routing tables → "implement" = work context
2. Finds matching flow → code-and-review/
3. Builds chain table:

```markdown
## Chain: Implement login rate limiting

**Request:** Implement login rate limiting
**Source:** code-and-review/

| # | Action | Model | Key Inputs | Waits For | Status |
|---|--------|-------|------------|-----------|--------|
| 1 | code/    | haiku | task=rate-limiting | -- | Pending |
| 2 | review/  | sonnet | changes from #1 | #1 | Pending |
| 3 | commit/  | haiku | approved changes | #2 | Pending |

**Execution:** Sequential

What each step does:
1. **code/** -- Implements rate limiting middleware and tests
2. **review/** -- Reviews code for security, correctness, and standards
3. **commit/** -- Commits approved changes with conventional commit message

Execute?
```

### Phase 2: Approval

You review this plan. You can:
- Say "Execute" → orchestrator runs all steps
- Say "Add a test step" → orchestrator recompiles with test/
- Say "Cancel" → orchestrator aborts

### Phase 3: Execution

After you approve:
- Orchestrator spawns agents for each step
- Progress appears in real-time:

```
>> Step 1 complete: code/ -- Implemented rate limiting. Continuing to Step 2...
>> Step 2 complete: review/ -- APPROVED 95%. Continuing to Step 3...
>> Step 3 complete: commit/ -- Changes committed (a1b2c3d).
```

Done!

**The Living Universe in Action:**

This core cycle is the **heartbeat** of a living universe:

**The Triad in the Cycle:**

1. **Human expresses will** — You say "implement feature X"
2. **Brain (orchestrator) compiles a plan** — Determines which laws (code) need rewriting, which hands (agents) to use
3. **Human approves** — You validate the plan matches your intention
4. **Hands (agents) reshape the physics** — Execute the code modifications
5. **Brain verifies harmony** — Ensures the universe remains in sync
6. **System records wisdom** — Learnings accumulate in memory (Layer 0)

Each cycle makes the universe smarter. Today's chain becomes tomorrow's reusable flow. Today's mistakes become tomorrow's avoided pitfalls. This is **evolution through usage**.

---

## Quiz

**Question:** What happens when you say "Execute"?

A. Orchestrator writes code immediately
B. Orchestrator compiles a more detailed plan
C. Orchestrator spawns agents to run each step
D. Orchestrator asks for more input

(Choose A, B, C, or D)

---

## Expected Answer

**Correct:** C

---

## Validation Responses

### If Correct
"Exactly! The orchestrator COORDINATES but NEVER produces content. It spawns specialized agents for each step."

### If Wrong
"Not quite. The orchestrator is a coordinator, not a worker. It spawns agents to execute each step. The orchestrator itself never writes code or produces content—that's called 'The Sin Test' and we'll cover it soon."

---

## Key Takeaway

This three-phase cycle is the foundation:
1. **Compilation** → See the plan before work starts
2. **Approval** → You control what happens
3. **Execution** → Orchestrator handles it autonomously

The key benefit: You get visibility and control BEFORE work starts, then trust the system to execute correctly.

---

## Transition

"Now for something critical: sacred formats."

Proceed to Module 3.
