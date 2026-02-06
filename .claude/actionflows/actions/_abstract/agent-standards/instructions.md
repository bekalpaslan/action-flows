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
- Communication actions (notify): Notification only, write nothing

### 8. Graceful Degradation
- Step fails: Continue with remaining, report failures
- File not found: Note "Not Configured", continue
- MCP timeout: Retry once, then document and continue

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
