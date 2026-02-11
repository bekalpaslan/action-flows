# Post-Completion

> Standard workflow after completing implementation work.

## Instructions

After core work is done:
1. **Commit** — Stage changed files, commit with descriptive message following project conventions
2. **Update Execution Registry** — Add entry to `actionflows/logs/INDEX.md` with chain details and outcome

Each step is independent — if one fails, continue with the others.

## Pre-Completion Validation

Before marking completion, validate:

**Checklist:**
- [ ] All files staged in git
- [ ] Commit message written and follows project conventions
- [ ] Log folder contains all expected output files
- [ ] INDEX.md entry prepared with chain signature

**If validation fails:** Fix issues and retry completion steps.

## Execution Registry Update

After successful completion:
1. **Generate chain signature:** {action1}-{action2}-{action3}
2. **Record in INDEX.md:**
   - Chain signature
   - Timestamp
   - Outcome (succeeded/partial/failed)
   - Key metrics (duration, steps completed)

---

## Contract Contributions

This abstract extends agent contracts with:

**Output Contract additions:**
- INDEX.md entry with chain signature format: `{action1}-{action2}-{action3}`
- Execution registry update after commit

**Trace Contract additions:**
- Commit hash logged as completion trace
- INDEX.md entry serves as permanent execution trace
