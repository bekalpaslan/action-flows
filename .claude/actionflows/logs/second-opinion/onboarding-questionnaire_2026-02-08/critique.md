# Second Opinion: Onboarding Questionnaire Implementation

**Date:** 2026-02-08
**Reviewed by:** second-opinion/ agent
**Confidence:** High (5 files reviewed, 2,500+ lines analyzed)

---

## Executive Summary

The onboarding questionnaire is **production-ready with strong pedagogy**, but has one **hidden over-engineering risk** and one **practical usability gap** the primary review missed.

**Verdict:** APPROVED with caution notes for deployment.

---

## What the Review Got Right

1. **Teaching structure is excellent** — The progression from sacred/safe boundary (Module 3) to sin test (Module 5) to harmony (Module 9) builds conceptual scaffolding well.

2. **Real examples throughout** — Not generic placeholders. Module 3 uses actual CONTRACT.md formats, Module 5 references real ORCHESTRATOR.md rules.

3. **Quiz design is fair** — Each has one correct answer, not gotchas. Validation responses guide wrong answers toward understanding rather than just correcting.

4. **Framework integration solid** — Proper agent-standards extends, spawn guards, learnings output format.

---

## What the Review Missed

### 1. Hidden Complexity: Module 9 is Too Dense for Advanced Level

**Module 9: Harmony & Living Model** is 235 lines covering:
- Harmony detection mechanism (steps 1-5)
- Harmony states (3 variants)
- Living software philosophy
- Evolution workflow (6 detailed steps with code examples)
- Sacred vs not sacred boundary
- Quiz with 4-option answer

**Problem:** This is actually **two modules worth of content** (harmony mechanics + living software philosophy) compressed into one. The code parsing example (lines 28-46) and TypeScript parser example (lines 120-133) are intermediate-level, not advanced.

**Teaching impact:** Learners reaching Module 9 are fatigued from 8 prior modules. Dumping both "how harmony works" AND "why living software matters" risks cognitive overload. The quiz (line 182-189) tests comprehension of the entire workflow, which is ambitious for a single sitting.

**Recommendation:** Split Module 9 into:
- Module 9a: "Harmony Detection" (mechanics, how to troubleshoot)
- Module 9b: "Living Software Model" (philosophy, evolution workflow)

This keeps individual module effort ~20-30 min (consistent with others).

### 2. Practical Usability Gap: No Progress Indicator

**Agent.md Line 65** says "ONE QUESTION AT A TIME" and lines 76-81 offer skip/back/review/break options, but **no implementation of "where am I in the sequence?"**

**Missing:** Explicit progress display like:
```
Module 3 of 10: Sacred Formats (Beginner Level)
Time: ~15 min | Completed: 2 | Remaining: 8
[====---] 20% of Beginner level
```

**Why it matters:**
- Humans lose motivation without progress signals
- After Module 5 (45 min in), learners need to know "halfway through Beginner, can I finish today?"
- The agent offers "take a break" but without progress saved explicitly, it's unclear if resuming works

**The quick reference card mentions this implicitly** (line 136: "Resume anytime"), but agent.md never specifies HOW to display progress or HOW to store/resume session state.

**Recommendation:** Add to agent.md:
```markdown
### Progress Display (after each module)
Show: "Module N of 10 | Level: {Beginner|Intermediate|Advanced} | Elapsed: {time}"
```

---

## Over-Engineering Observations

1. **Session log format is over-specified** (agent.md lines 115-145). The detailed structure with timestamps, navigation choices, and quiz score tracking is good, but **never used downstream**. No evidence that logs feed into learnings or recommendations. Consider: either use it meaningfully (analytics, personalization) or simplify.

2. **Three different output artifacts at different completion points** (quick reference, certificate, session log) is appropriate, but the templates don't reference each other. A learner who completes Module 5 gets a quick reference card but has no link to where to find the completion certificate later if they continue. Minor, but adds friction.

3. **Quiz score tracking** (mentioned in review as future enhancement) is correct to defer. But if deferred, remove the session log line "Quiz Score: {correct}/{total}" to avoid creating expectations.

---

## Practical Usability Strengths

1. **Navigation commands are clear** (agent.md lines 76-81). Skip, back, review, break are genuinely useful for different learning styles.

2. **Validation responses are differentiated** — Wrong-answer responses don't just say "wrong," they explain the misconception. Module 9 example: incorrect answers still get directed toward the dual-investigation approach.

3. **Quick reference card is usable** — It fits the Beginner mental model and includes actual command examples (lines 50-82), not just theory.

---

## Recommendations

**Immediate (before deployment):**
- Split Module 9 into two modules (harmony mechanics + living software philosophy)
- Add explicit progress display formula to agent.md

**Later (v2):**
- Clarify session resumption mechanism (how is state persisted between breaks?)
- Decide whether session logs feed into any downstream analytics or just archive
- Consider linking artifacts to each other (certificate should reference quick reference card)

---

## Bottom Line

**Approve for deployment.** The over-engineering (session log, artifact count) is harmless—nice to have even if underutilized. The pedagogical concern (Module 9 density) is real but not blocking; many learners will reach it with fresh motivation. The usability gap (missing progress indicator) is a minor friction point but won't break the experience.

The implementation successfully teaches the ActionFlows mental model through show-before-tell, real examples, and fair quizzes. It's genuinely well-designed teaching, not just content dump.
