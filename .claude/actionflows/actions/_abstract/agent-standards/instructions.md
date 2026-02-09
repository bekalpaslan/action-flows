# Agent Standards

> Core behavioral standards for all agents.

## Core Principles

### 1. Single Responsibility
Each agent does one thing well. One clear mission per agent. Split complex workflows into phases.

### 2. Token Efficiency
- **Grep before Read:** Find what you need, then read only those files
- Skip files that pass validation
- Summarize findings in tables, not prose

### 3. Fresh Eye Discovery
Notice issues OUTSIDE your explicit instructions. Tag with `[FRESH EYE]` in output.

### 4. Parallel Safety
Each parallel agent writes to its OWN file. Never assume exclusive access to shared files.

### 5. Verify, Don't Assume
Never trust filenames — always check contents before referencing.

### 6. Explicit Over Implicit
Use concrete file paths, not relative references. Provide examples for complex concepts.

### 7. Output Boundaries
- Assessment actions (analyze, review, audit): Write to `logs/{action}/{datetime}/`
- Implementation actions (code, test, commit): Write to project directories

### 8. Graceful Degradation
- Step fails: Continue with remaining, report failures
- File not found: Note "Not Configured", continue

### 9. Identity Boundary
- You are a task executor, not an orchestrator. Never read ORCHESTRATOR.md. Never route, delegate, or compile chains. Execute your agent.md instructions directly.

### 10. Pre-Completion Validation
- Before finalizing, validate all output files exist and are non-empty
- If you created a log folder, ensure it contains required output files
- Empty log folders break the execution registry — verify before completing

### 11. Output Boundary
- Assessment actions (analyze, review, audit) write to `logs/{action}/{datetime}/`
- Implementation actions (code, test, commit) write to project directories
- Never write outside your designated output location

### 12. Contract Compliance (for output-producing actions)

If your action produces structured output consumed by the dashboard (review reports, analysis reports, brainstorm transcripts):

- **Read the format specification** in `.claude/actionflows/CONTRACT.md` for your action type
- **Follow the exact markdown structure** defined in the contract
- **Include all required fields** — Missing fields cause harmony violations
- **Use correct enums/types** — Backend validates using contract-defined parsers
- **Test your output** — Run `pnpm run harmony:check` to validate output format

**Contract-defined actions:**
- **review/** → Review Report Structure (CONTRACT.md § Format 5.1)
  - Required: Verdict (APPROVED | NEEDS_CHANGES), Score (0-100), Summary, Findings table, Fixes Applied (if mode=review-and-fix), Flags for Human
- **analyze/** → Analysis Report Structure (CONTRACT.md § Format 5.2)
  - Required: Title, Aspect, Scope, Date, Agent, numbered analysis sections, Recommendations
- **brainstorm/** → Brainstorm Session Transcript (CONTRACT.md § Format 5.3)
  - Recommended structure (not strictly enforced): Idea, Classification, Transcript, Key Insights, Issues & Risks, Next Steps

**Why this matters:**
- The backend **parses your output** using contract-defined parsers
- If structure doesn't match → parsing fails → harmony violation logged
- Dashboard shows **"parsing incomplete"** and degrades gracefully
- Harmony detector **broadcasts violations** via WebSocket (visible in dashboard)

**Evolution process:** See `.claude/actionflows/docs/CONTRACT_EVOLUTION.md` for adding/modifying formats

**Validation command:**
```bash
pnpm run harmony:check
```

**Not contract-defined:** Agent learnings, internal notes, working files, intermediate outputs. Only final deliverables consumed by dashboard are contract-defined.

---

## Learnings Output Format

Every agent MUST include:
```
## Learnings
**Issue:** {What happened}
**Root Cause:** {Why}
**Suggestion:** {How to prevent}
[FRESH EYE] {Discovery if any}
Or: None — execution proceeded as expected.
```

---

## Pre-Completion Validation

Before finishing, ALL agents must verify:

**Log Folder Checklist:**
- [ ] Log folder exists and contains output files
- [ ] Files are non-empty (> 0 bytes)
- [ ] Folder path follows `logs/{action-type}/{description}_{datetime}/` format
- [ ] Description is kebab-case, no spaces or special chars

**Why this matters:** Empty log folders corrupt the execution registry (INDEX.md). Agents MUST validate their output exists before completing.
