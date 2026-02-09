# Code Changes: phase5-framework-cleanup

**Task:** Remove legacy department references from framework files
**Scope:** `.claude/actionflows/` directory (excluding logs/ and docs/)
**Date:** 2026-02-09

---

## Files Modified

| File | Change |
|------|--------|
| `.claude/actionflows/actions/onboarding/agent.md` | Line 50: Updated module path reference from `06-department-routing.md` to `06-context-routing.md` |
| `.claude/actionflows/flows/framework/onboarding/modules/02-core-cycle.md` | Line 20: Changed "Engineering department" to "work context" in orchestrator workflow |
| `.claude/actionflows/flows/framework/onboarding/modules/03-sacred-formats.md` | Lines 86, 101, 118, 121: Replaced "ORGANIZATION.md" with "CONTEXTS.md" in 4 locations (registry structure, quiz, validation responses) |
| `.claude/actionflows/flows/framework/onboarding/modules/04-safe-evolution.md` | Lines 24, 67-73, 84: Updated flow example directory from `qa/` to `review/`, routing table from ORGANIZATION.md to CONTEXTS.md, and safe evolution list item "departments" to "contexts" |
| `.claude/actionflows/flows/framework/onboarding/modules/05-sin-test.md` | Line 191: Changed transition text from "Department Routing" to "Context Routing" |
| `.claude/actionflows/flows/framework/onboarding/modules/07-review-pipeline.md` | Line 186: Updated safe evolution checklist from "Department routing (ORGANIZATION.md)" to "Context routing (CONTEXTS.md)" |
| `.claude/actionflows/flows/framework/onboarding/modules/09-harmony.md` | Line 173: Changed safe evolution list item from "Department routing" to "Context routing" |
| `.claude/actionflows/flows/framework/onboarding/modules/10-completion.md` | Lines 26, 49, 97, 120, 183: Updated 5 references from "department/ORGANIZATION.md" to "context/CONTEXTS.md" throughout module |
| `.claude/actionflows/flows/framework/onboarding/templates/quick-reference-card.md` | Lines 27, 57, 69, 79, 121, 128, 135: Updated 7 references in routing examples, help docs, and next steps |
| `.claude/actionflows/flows/framework/onboarding/templates/completion-certificate.md` | Lines 20, 38, 60, 87: Updated 4 references in module list, understanding section, customization steps, and support docs |
| `.claude/actionflows/flows/framework/framework-health/instructions.md` | Line 37: Changed drift check context from "ORGANIZATION.md departments match flow directory structure" to "CONTEXTS.md contexts match flow directory structure" |
| `.claude/actionflows/flows/framework/flow-creation/instructions.md` | Lines 20, 62, 80: Changed input parameter name from "department" to "context" and updated 2 path references from `{department}` to `{context}` |
| `.claude/actionflows/CONTRACT.md` | Lines 233-246: Updated Format 6.2 description fields: changed "Department" to "Context", updated enum values, added legacy note, changed example reference |

---

## Files Created

| File | Purpose |
|------|---------|
| `.claude/actionflows/flows/framework/onboarding/modules/06-context-routing.md` | New 160-line onboarding module teaching context-based routing system. Replaces department routing with explanation of 9 contexts (6 routable, 2 auto-target, 1 manual), context scoring algorithm, customization guide, and quiz validation. |
| `.claude/actionflows/logs/code/phase5-framework-cleanup_2026-02-09/output.md` | Execution log with summary, changes, verification results, and learnings |
| `.claude/actionflows/logs/code/phase5-framework-cleanup_2026-02-09/changes.md` | This file - detailed change manifest |

---

## Files Deleted

| File | Reason |
|------|--------|
| `.claude/actionflows/ORGANIZATION.md` | Replaced by CONTEXTS.md (created in earlier phase) |
| `.claude/actionflows/flows/framework/onboarding/modules/06-department-routing.md` | Replaced by 06-context-routing.md |

---

## Verification

### Type Check
**Status:** SKIPPED (no TypeScript files modified - pure documentation update)

### Manual Verification
**Command:**
```bash
grep -ri "department\|ORGANIZATION\.md" --include="*.md" --exclude-dir=logs --exclude-dir=docs .claude/actionflows/
```

**Results:**
- ✅ Only expected references remain (CONTRACT.md Format 6.2 with legacy note, 06-context-routing.md teaching section)
- ✅ No references in ORCHESTRATOR.md, FLOWS.md, ACTIONS.md, or other core framework files
- ✅ All onboarding modules (02-10) now use "context" terminology
- ✅ Both templates (quick-reference-card.md, completion-certificate.md) updated
- ✅ Both framework flows (framework-health/, flow-creation/) updated

### Coverage
**13 files modified** covering:
- ✅ Onboarding agent definition
- ✅ All 9 onboarding modules (02-10, excluding 01 which has no department refs)
- ✅ Both onboarding templates
- ✅ Both framework flows
- ✅ Contract format description

---

## Notes

### Design Decisions

1. **06-context-routing.md Structure**
   - Kept same pedagogical approach as original (quiz-based validation)
   - Added context scoring explanation (new feature not in department system)
   - Included "Key difference from legacy" section to help users understand transition
   - Maintains 15-minute duration target

2. **CONTRACT.md Format 6.2**
   - Updated description and field list to reflect context terminology
   - Added legacy note explaining TypeScript type will be renamed separately
   - Kept TypeScript type name as-is (handled by separate contract migration agent)

3. **Template Updates**
   - Updated all routing examples to use context names (work, maintenance, review)
   - Changed all file references from ORGANIZATION.md to CONTEXTS.md
   - Preserved template structure and placeholder format

4. **Framework Flow Updates**
   - flow-creation/ now accepts "context" parameter instead of "department"
   - framework-health/ checks CONTEXTS.md alignment with directory structure
   - Both use `{context}` placeholder in path templates

### Edge Cases Handled

- **Historical logs/**: Not modified (per instructions - they're historical records)
- **docs/ directory**: Not modified (per instructions)
- **CONTRACT.md Format 6.2**: Description updated, TypeScript type intentionally not renamed (separate agent task)
- **06-context-routing.md**: Intentionally mentions "legacy departments" for educational context

### Consistency Verification

All 13 modified files now use consistent terminology:
- "context" instead of "department"
- "CONTEXTS.md" instead of "ORGANIZATION.md"
- Specific context names (work, maintenance, explore, review, settings, pm) instead of department names (Framework, Engineering, QA, Human)
- "Context routing" instead of "Department routing"

---

## Impact Analysis

### User-Facing Changes
- Onboarding flow now teaches context-based routing
- All framework documentation references contexts
- Quick reference card uses context examples
- Completion certificate reflects context terminology

### Developer-Facing Changes
- flow-creation/ flow parameter renamed
- framework-health/ checks updated
- Contract documentation updated with legacy note

### Backward Compatibility
- Historical logs remain unchanged (references to departments preserved)
- CONTEXTS.md already existed before this cleanup
- No breaking changes to TypeScript types (handled separately)

---

## Testing Notes

Manual verification performed:
1. ✅ Grep search confirms no unwanted department references
2. ✅ All modified files use consistent context terminology
3. ✅ New module follows existing pedagogical pattern
4. ✅ Templates preserve placeholder format
5. ✅ Flow instructions maintain spawn command structure

TypeScript compilation not needed (documentation-only changes).
