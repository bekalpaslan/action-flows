# Phase 5 Framework Cleanup: Department → Context Migration

**Date:** 2026-02-09
**Agent:** code/
**Task:** Clean up all legacy department references from framework files

---

## Summary

Successfully removed all legacy department references from active framework files and replaced them with context-based routing terminology. This completes Phase 5 of Context-Native Routing migration.

---

## Files Modified

| File | Changes Made |
|------|--------------|
| `.claude/actionflows/actions/onboarding/agent.md` | Updated module reference from `06-department-routing.md` → `06-context-routing.md` |
| `.claude/actionflows/flows/framework/onboarding/modules/02-core-cycle.md` | Changed "Engineering department" → "work context" |
| `.claude/actionflows/flows/framework/onboarding/modules/03-sacred-formats.md` | Updated 3 references: ORGANIZATION.md → CONTEXTS.md in registry list, quiz, and validation responses |
| `.claude/actionflows/flows/framework/onboarding/modules/04-safe-evolution.md` | Updated example flow directory (qa/ → review/), routing table references, and safe evolution list |
| `.claude/actionflows/flows/framework/onboarding/modules/05-sin-test.md` | Updated transition text: "Department Routing" → "Context Routing" |
| `.claude/actionflows/flows/framework/onboarding/modules/07-review-pipeline.md` | Changed "Department routing (ORGANIZATION.md)" → "Context routing (CONTEXTS.md)" |
| `.claude/actionflows/flows/framework/onboarding/modules/09-harmony.md` | Updated safe evolution list: "Department routing" → "Context routing" |
| `.claude/actionflows/flows/framework/onboarding/modules/10-completion.md` | Updated 5 references throughout module (summary, file list, next steps) |
| `.claude/actionflows/flows/framework/onboarding/templates/quick-reference-card.md` | Updated 7 references in routing examples, help section, next steps |
| `.claude/actionflows/flows/framework/onboarding/templates/completion-certificate.md` | Updated 4 references in modules list, understanding section, next steps, support |
| `.claude/actionflows/flows/framework/framework-health/instructions.md` | Updated drift check from "ORGANIZATION.md departments" → "CONTEXTS.md contexts" |
| `.claude/actionflows/flows/framework/flow-creation/instructions.md` | Changed input parameter "department" → "context", updated 3 path references |
| `.claude/actionflows/CONTRACT.md` | Updated Format 6.2 description with context terminology and legacy note |

## Files Created

| File | Purpose |
|------|---------|
| `.claude/actionflows/flows/framework/onboarding/modules/06-context-routing.md` | New module teaching context-based routing (replaces department routing) |

## Files Deleted

| File | Reason |
|------|--------|
| `.claude/actionflows/ORGANIZATION.md` | Replaced by CONTEXTS.md |
| `.claude/actionflows/flows/framework/onboarding/modules/06-department-routing.md` | Replaced by 06-context-routing.md |

---

## New Module: 06-context-routing.md

Created comprehensive replacement for department routing module with:

### Key Content:
- Explains 9 workbench contexts (6 routable, 2 auto-target, 1 manual-only)
- Details context scoring algorithm (keyword extraction → trigger matching → selection/disambiguation)
- Provides routing examples with new context system
- Includes quiz teaching both trigger mapping AND flow registration
- Notes the key difference from legacy department system

### Structure:
- Presentation (context types, routing table)
- Example walk-through (5-step routing process)
- Context scoring explanation
- Customization guide
- Quiz with validation responses
- Key takeaway and transition

---

## Verification Results

### Active Framework Files
✅ **PASS** - No department references in active framework files (excluding logs/ and docs/)

### Remaining References (Expected)
1. **CONTRACT.md Format 6.2** - Kept with legacy note (TypeScript type migration handled separately)
2. **06-context-routing.md** - Intentionally mentions "legacy department system" for teaching purposes
3. **logs/** directory - Historical records (not modified per instructions)
4. **docs/** directory - Excluded per instructions

### Grep Results
```bash
# Only expected references found:
- CONTRACT.md: Format 6.2 with legacy note
- 06-context-routing.md: "Key difference from legacy" teaching point
```

---

## Migration Impact

### Onboarding Flow
- Module 6 now teaches context-native routing
- All 10 modules reference contexts consistently
- Templates updated for context-based workflow
- Certificate reflects new terminology

### Framework Flows
- flow-creation/ now uses "context" parameter
- framework-health/ checks CONTEXTS.md alignment
- All framework instructions use context terminology

### Philosophy
- Completes shift from organizational departments to workbench contexts
- Aligns framework with actual UI structure
- Prepares for full context-native routing system

---

## Type-Check

Status: **SKIPPED** (no TypeScript changes - pure documentation update)

---

## Next Steps

This agent focused on framework documentation. The companion agent working on Phase 5 contract migration will handle:
1. TypeScript type rename: `DepartmentRoutingParsed` → `ContextRoutingParsed`
2. Parser rename: `parseDepartmentRouting` → `parseContextRouting`
3. Enum update: `Framework | Engineering | QA | Human` → `work | maintenance | explore | review | settings | pm | archive | harmony | editor`
4. Backend type exports and usage

---

## Learnings

**Issue:** None — execution proceeded as expected.

**Root Cause:** N/A

**Suggestion:** N/A

[FRESH EYE] The onboarding module structure is well-designed for progressive disclosure. The new 06-context-routing.md follows the same quiz-based validation pattern as other modules, maintaining consistency. The addition of the "context scoring" explanation helps users understand the more sophisticated routing logic compared to the simple department-based system.
