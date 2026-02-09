# Code Changes: Framework Docs Context-Native

## Files Modified

| File | Change |
|------|--------|
| `.claude/actionflows/FLOWS.md` | Reorganized flows by context (work, maintenance, explore, review, settings, pm) instead of departments (Framework, Engineering, QA, Human) |
| `.claude/actionflows/ORCHESTRATOR.md` | Replaced all "department" references with "context", updated ORGANIZATION.md references to CONTEXTS.md (6 occurrences) |
| `.claude/actionflows/README.md` | Updated routing flow to reference CONTEXTS.md, changed "department" to "context" in directory descriptions |
| `.claude/actionflows/CONTRACT.md` | Updated session-start protocol field from "departments" to "contexts" |

## Files Created

| File | Purpose |
|------|---------|
| `.claude/actionflows/CONTEXTS.md` | New context routing reference - replaces ORGANIZATION.md concept. Maps user intent to 6 routable contexts (work, maintenance, explore, review, settings, pm), 2 auto-target contexts (archive, harmony), and 1 manual-only context (editor). Includes triggers, flows, examples, and routing guide. |

## Verification

- Type check: PASS
- Notes: All changes completed successfully. ORGANIZATION.md was NOT deleted as instructed (Phase 5). All references to "department" and "ORGANIZATION.md" in core framework files (ORCHESTRATOR.md, FLOWS.md, README.md, CONTRACT.md) have been replaced with "context" and "CONTEXTS.md".

## Verification: Remaining References

Grepped for any remaining "department" or "ORGANIZATION.md" references in `.claude/actionflows/` (excluding ORGANIZATION.md itself):
- Core framework files (ORCHESTRATOR.md, FLOWS.md, README.md, CONTRACT.md, CONTEXTS.md): All updated ✓
- Historical log files and docs: Contain references but are historical records (expected)
- Onboarding modules: May need updates in future phase (out of scope for this task)

## Summary

Successfully implemented Phase 3 of Context-Native Routing. The framework now uses workbench contexts as the sole routing taxonomy. Department abstraction has been eliminated from all active framework documentation while preserving ORGANIZATION.md as a fallback reference per instructions.
