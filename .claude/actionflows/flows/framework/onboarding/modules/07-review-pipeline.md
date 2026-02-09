# Module 7: The Review Pipeline

**Level:** Intermediate
**Duration:** ~20 min
**Prerequisites:** Modules 1-6

---

## Presentation

Now let's talk about quality—how ActionFlows maintains high standards through the review pipeline.

The system has TWO quality layers:
1. **Primary review** (review/ or audit/ agent)
2. **Second opinion** (local AI critiques primary review)

Let me show you how this works:

---

## Standard Flow

### Without second opinion:
```
┌─────────┐    ┌────────┐    ┌────────┐
│ code/   │ →  │review/ │ →  │commit/ │
└─────────┘    └────────┘    └────────┘
```

### With second opinion (AUTO-INSERTED):
```
┌─────────┐    ┌────────┐    ┌──────────────────┐    ┌────────┐
│ code/   │ →  │review/ │ →  │second-opinion/   │ →  │commit/ │
└─────────┘    └────────┘    └──────────────────┘    └────────┘
                                      │
                                      │ (critiques review)
                                      │
                                      ↓ (doesn't block commit)
```

---

## Critical Rule

Chain compilation shows:
```markdown
| # | Action | Waits For |
|---|--------|-----------|
| 1 | code/  | --        |
| 2 | review/ | #1       |
| 3 | second-opinion/ | #2 |
| 4 | commit/ | #2       |  ← Waits for #2 (review), NOT #3 (second-opinion)
```

**Why?** Second opinion NEVER blocks workflow. It critiques in parallel, but work continues.

---

## Dual Output Example

After steps 2-3 complete, orchestrator presents:

```markdown
### Dual Output: review/ + Second Opinion

**Original (review/ via Claude Sonnet):**
Verdict: APPROVED
Score: 95%

Summary: Code implements rate limiting correctly. Clean, well-tested, follows conventions.

**Second Opinion (llama3:70b via Ollama):**
Key findings:
- Missed issues: 2 (error message inconsistency, missing edge case test)
- Disagreements: 0
- Notable: Redis connection error handling could be more graceful

**Full reports:**
- Original: `.claude/actionflows/logs/review/rate-limiting_2026-02-08-12-30-45/report.md`
- Critique: `.claude/actionflows/logs/second-opinion/rate-limiting-critique_2026-02-08-12-31-10/critique.md`

Continuing to Step 4...
```

---

## Why Second Opinion?

Primary review (Claude) catches 95% of issues.

Second opinion (local LLM) catches what Claude might miss:
- Different perspective
- Different training data
- Different biases

**Result:** Higher quality, better learning surface for humans.

**Cost:** ~30 seconds per review (runs locally via Ollama)

---

## Skipping Second Opinion

You can suppress when approving chain:

```
Human: "Execute, skip second opinions"
```

Orchestrator removes second-opinion/ steps.

**Use when:**
- Trivial changes
- Time-sensitive fixes
- Ollama not available

---

## Action Modes

Review actions support TWO modes:

### 1. review-only (default)
- Assesses code
- Reports findings
- Doesn't change code

### 2. review-and-fix (extended)
- Assesses code
- Reports findings
- FIXES trivial issues (typos, formatting, doc errors)
- Flags complex issues for human

Orchestrator chooses mode based on fix complexity.

You can override: `"Use review-and-fix mode"`

---

## Quiz

**Question:** You approve a chain with review/ step. What happens with second opinion?

A. Orchestrator asks if you want second opinion
B. Second opinion is auto-inserted and runs after review
C. Second opinion is skipped unless you request it
D. Second opinion blocks commit until critique is done

(Choose the best answer)

---

## Expected Answer

**Correct:** B

---

## Validation Responses

### If Correct
"Perfect! Second opinion is automatically inserted after review/ and audit/ actions. It runs in parallel with commit (doesn't block). You can suppress with 'skip second opinions' when approving."

### If Wrong
"Not quite. Second opinion is AUTO-INSERTED after every review/ or audit/ action. It runs automatically unless you explicitly suppress it ('skip second opinions'). And critically, it NEVER blocks workflow—commit waits for review (#2), not second-opinion (#3)."

---

## Key Takeaway

The review pipeline is ActionFlows' quality mechanism:

- **Primary review** → High-quality baseline (95%)
- **Second opinion** → Catches edge cases (+3-5%)
- **Dual output** → Human sees both perspectives

**Result:** Better code, better learning, evolving quality standards.

This is why the framework produces high-quality output consistently—multiple perspectives, clear reports, actionable findings.

---

## Intermediate Level Complete!

You've completed Intermediate level! You now know:
- ✅ Context routing (CONTEXTS.md)
- ✅ Review pipeline (primary + second opinion)

Ready for Advanced level, or would you like to:
- Review intermediate concepts
- Take a break
- Test understanding

What would you like to do?

---

## Transition

Based on human choice:
- Continue → Module 8 (The Contract)
- Review → Return to chosen module
- Break → Save progress
