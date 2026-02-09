# Review Report: Phase 3 Context-Native Routing Documentation Rewrite

## Verdict: NEEDS_CHANGES
## Score: 72%

## Summary

The Phase 3 Context-Native Routing documentation rewrite successfully replaces the department abstraction with context-native routing in the core framework files (CONTEXTS.md, FLOWS.md, ORCHESTRATOR.md, README.md). However, critical issues remain: (1) CONTRACT.md still contains a deprecated department-based format specification (Format 6.2), (2) the onboarding flow module 06-department-routing.md is now completely out of sync with the new routing model and requires a complete rewrite, and (3) ORGANIZATION.md is preserved but still referenced from active onboarding materials. The core routing infrastructure is correct, but documentation dependencies need updates to achieve full harmony.

## Findings

| # | File | Line | Severity | Description | Suggestion |
|---|------|------|----------|-------------|------------|
| 1 | .claude/actionflows/CONTRACT.md | 233-246 | high | Format 6.2 "Department Routing Announcement" still specifies department-based routing with enum "Framework \| Engineering \| QA \| Human" | Either remove Format 6.2 entirely (if never implemented) or update to "Context Routing Announcement" with new enum "work \| maintenance \| explore \| review \| settings \| pm" |
| 2 | .claude/actionflows/flows/framework/onboarding/modules/06-department-routing.md | 1-150 | critical | Entire onboarding module teaches deprecated department routing system with references to ORGANIZATION.md departments | Rewrite module as "06-context-routing.md" teaching the context-native routing model from CONTEXTS.md. Update all examples, routing tables, and quiz questions to reference contexts instead of departments |
| 3 | .claude/actionflows/flows/framework/onboarding/modules/06-department-routing.md | 21, 54, 80 | high | Module explicitly instructs users to read and edit ORGANIZATION.md | Update to instruct reading and editing CONTEXTS.md instead |
| 4 | .claude/actionflows/CONTEXTS.md | 99-118 | medium | Routing guide table is complete and correct, but could benefit from explicit note that this replaces the old department-based routing | Add introductory note: "This routing table replaces the deprecated department-based routing (Framework, Engineering, QA, Human). Requests now route directly to workbench contexts." |
| 5 | .claude/actionflows/ORCHESTRATOR.md | 12-16 | low | Session-start protocol mentions CONTEXTS.md but doesn't explicitly state this replaces ORGANIZATION.md | Add comment after step 1: "# (Replaces ORGANIZATION.md from Phase 1-2)" for clarity during transition period |
| 6 | .claude/actionflows/README.md | 26 | low | Key Files section lists CONTEXTS.md without explanation of what it is | Change "CONTEXTS.md — Context routing rules" to "CONTEXTS.md — Context routing rules (replaces department-based routing)" |
| 7 | .claude/actionflows/flows/framework/onboarding/modules/07-review-pipeline.md | N/A | low | Module doesn't reference departments directly, but flows from module 06 which is now outdated | Verify transition language in module 06 correctly sets up module 07 after rewrite |

## Fixes Applied

N/A (mode = review-only)

## Flags for Human

| Issue | Why Human Needed |
|-------|-----------------|
| Format 6.2 in CONTRACT.md | Decision needed: Should this format be removed entirely (if never implemented in dashboard) or updated to context-based routing? Requires checking dashboard parser implementation and deciding on contract evolution strategy |
| Onboarding module rewrite scope | Module 06 needs complete rewrite, not just updates. Should this be part of Phase 3 or a separate Phase 4 deliverable? May require updating multiple onboarding modules that reference department concepts |
| ORGANIZATION.md preservation strategy | File is preserved but creates confusion when onboarding materials reference it. Should it be moved to `.claude/actionflows/archive/ORGANIZATION.md` with a redirect notice, or kept in place with deprecation warning at top? |
| Transition period documentation | Consider adding `.claude/actionflows/docs/MIGRATION-phase3-contexts.md` explaining the department→context migration for users transitioning from Phase 1-2 |

## Verification Results

### ✅ Passed Checks

1. **CONTEXTS.md structure** — All 9 workbenches present with correct metadata:
   - 6 routable contexts (work, maintenance, explore, review, settings, pm)
   - 2 auto-target contexts (archive, harmony)
   - 1 manual-only context (editor)

2. **Context trigger keywords** — Complete and non-overlapping:
   - work: implement, build, create, add feature, develop, code, write, generate
   - maintenance: fix bug, resolve issue, patch, refactor, optimize, cleanup
   - explore: explore, investigate, research, learn, understand, explain
   - review: review, code review, audit, check quality, security scan
   - settings: configure, set up, create flow, create action, onboard me
   - pm: plan, roadmap, organize, track tasks, project management

3. **FLOWS.md organization** — Correctly grouped by context (not department):
   - work: code-and-review/, post-completion/
   - maintenance: bug-triage/, code-and-review/
   - explore: doc-reorganization/, ideation/
   - review: audit-and-fix/
   - settings: onboarding/, flow-creation/, action-creation/, action-deletion/, framework-health/
   - pm: planning/

4. **ORCHESTRATOR.md routing** — No department references in active routing logic:
   - Session-start protocol references CONTEXTS.md (line 13)
   - Request reception protocol uses "context" terminology (lines 641-665)
   - File reading permissions correct (line 693: CONTEXTS.md readable by orchestrator)

5. **README.md structure** — Updated with CONTEXTS.md as key file (line 26)

6. **Cross-references** — Routing guide table (CONTEXTS.md lines 100-118) is complete with all major request patterns mapped to correct context + flow/action

### ❌ Failed Checks

1. **ORGANIZATION.md references** — Still present in active files:
   - onboarding/modules/06-department-routing.md (lines 21, 54, 80)
   - Not moved to archive or marked deprecated

2. **CONTRACT.md alignment** — Format 6.2 uses old department enum:
   - Department (enum: Framework | Engineering | QA | Human) — should be Context enum

3. **Onboarding material sync** — Module 06 teaches deprecated system:
   - All examples use department-based routing
   - Quiz questions reference ORGANIZATION.md structure
   - No mention of context-native routing

4. **Department terminology grep** — Found 5 references in CONTRACT.md (all Format 6.2):
   - Lines 233, 234, 235, 237, 241

## Recommendations

### Priority 1: Contract Alignment
Update CONTRACT.md Format 6.2 to align with Phase 3 or remove if unimplemented. This breaks contract harmony if dashboard still expects department-based routing announcements.

### Priority 2: Onboarding Rewrite
Rewrite onboarding module 06 to teach context-native routing. This is critical user-facing documentation that currently teaches a deprecated system.

### Priority 3: ORGANIZATION.md Deprecation
Move ORGANIZATION.md to archive with redirect notice, or add prominent deprecation warning at top of file explaining it's preserved for reference only.

### Priority 4: Transition Documentation
Create migration guide explaining Phase 1-2 → Phase 3 transition for users who learned the old department system.

## Next Steps

1. **Immediate:** Fix CONTRACT.md Format 6.2 (requires dashboard parser check)
2. **High priority:** Rewrite onboarding module 06-department-routing.md → 06-context-routing.md
3. **Medium priority:** Archive or deprecate ORGANIZATION.md with clear notice
4. **Low priority:** Add transition comments to ORCHESTRATOR.md and README.md for clarity

## Learnings

**Issue:** Phase 3 documentation rewrite correctly updated core routing files but missed downstream dependencies (onboarding materials, contract formats) that reference the old system.

**Root Cause:** The rewrite focused on the routing infrastructure (CONTEXTS.md, FLOWS.md, ORCHESTRATOR.md) but didn't trace all references to the deprecated department concept across the entire `.claude/actionflows/` tree. Onboarding materials and contract formats were overlooked.

**Suggestion:** When performing major architectural changes (like routing model rewrites), create a reference dependency graph first:
1. Grep for all occurrences of deprecated terminology
2. Map files into categories: (a) core infrastructure, (b) downstream docs, (c) teaching materials, (d) contract specifications
3. Plan rewrite phases to handle all categories, not just core infrastructure

[FRESH EYE] The CONTRACT.md file has a Format 6.2 "Department Routing Announcement" with TypeScript type `DepartmentRoutingParsed` and parser `parseDepartmentRouting()`. This suggests either: (1) this format was planned but never implemented in the dashboard (check `packages/shared/src/contract/` for parser), or (2) it exists but is unused because orchestrator routing is internal (not outputted). Before updating Format 6.2, verify whether this parser exists in the codebase. If it doesn't exist, Format 6.2 should be removed entirely rather than updated.
