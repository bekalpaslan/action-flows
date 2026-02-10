# ActionFlows Framework Health Report
**Date:** 2026-02-09
**Scope:** .claude/actionflows/
**Analysis Type:** Drift Detection

---

## Executive Summary

**Overall Health Score: 98/100** (Excellent)

The ActionFlows framework structure is in excellent health with only minor documentation drift. All critical functionality is intact:
- All actions spawnable (agent.md files present)
- All flows executable (instructions.md files present)
- No broken references in chains
- No stale registry entries

The framework is production-ready. Identified issues are documentation/discovery improvements, not functional problems.

---

## Detailed Check Results

### ✅ CHECK 1: Action agent.md Files (PASS)

**Status:** All actions in ACTIONS.md have corresponding agent.md files on disk.

Actions verified (12 total):
- analyze/ ✅
- audit/ ✅
- brainstorm/ ✅
- code/ ✅
- code/backend/ ✅
- code/frontend/ ✅
- commit/ ✅
- onboarding/ ✅
- plan/ ✅
- review/ ✅
- second-opinion/ ✅
- test/ ✅

**Finding:** No missing agent.md files. All actions can be spawned.

---

### ✅ CHECK 2: Action instructions.md Files (PASS)

**Status:** All actions listed in ACTIONS.md have corresponding instructions.md files.

Generic actions with instructions.md (10):
- analyze/ ✅
- audit/ ✅
- brainstorm/ ✅
- code/ ✅
- commit/ ✅
- onboarding/ ✅
- plan/ ✅
- review/ ✅
- second-opinion/ ✅
- test/ ✅

Stack-specific actions with instructions.md (2):
- code/backend/ ✅
- code/frontend/ ✅

**Finding:** All actions have instructions.md. Orchestrator can read model and input requirements.

---

### ⚠️ CHECK 3: Flow instructions.md Files (PASS with WARNING)

**Status:** All flows in FLOWS.md have instructions.md, BUT one orphan flow exists.

Flows in FLOWS.md with files verified (11 total):

**work context:**
- code-and-review/ ✅ (engineering/code-and-review/)
- post-completion/ ✅ (engineering/post-completion/)

**maintenance context:**
- bug-triage/ ✅ (engineering/bug-triage/)
- code-and-review/ (shared) ✅

**explore context:**
- doc-reorganization/ ✅ (framework/doc-reorganization/)
- ideation/ ✅ (human/ideation/)

**review context:**
- audit-and-fix/ ✅ (qa/audit-and-fix/)

**settings context:**
- onboarding/ ✅ (framework/onboarding/)
- flow-creation/ ✅ (framework/flow-creation/)
- action-creation/ ✅ (framework/action-creation/)
- action-deletion/ ✅ (framework/action-deletion/)
- framework-health/ ✅ (framework/framework-health/)

**pm context:**
- planning/ ✅ (framework/planning/)

**⚠️ WARNING:** Orphan flow found on disk but NOT in FLOWS.md:
- qa/test-coverage/ (has complete instructions.md)

**Impact:** Low. Flow exists and is complete but not discoverable via FLOWS.md registry.

---

### ✅ CHECK 4: No Stale Registry Entries (PASS)

**Status:** All actions and flows listed in registries exist on disk.

- ACTIONS.md: 12 actions listed, 12 found on disk ✅
- FLOWS.md: 11 flows listed, 11 found on disk ✅

**Finding:** No stale entries. All registry references are valid.

---

### ⚠️ CHECK 5: No Orphan Directories (FAIL - Minor)

**Status:** 1 orphan flow directory found.

**Orphan flows (not in FLOWS.md):**
- qa/test-coverage/ (has instructions.md, appears complete)

**Orphan actions:** None

**Impact:** Low. The orphan flow is complete and functional, just not registered.

**Recommended Action:** Add test-coverage/ to FLOWS.md under appropriate context (likely "review" or "settings").

---

### ℹ️ CHECK 6: Context-to-Directory Mapping (DESIGN CHOICE)

**Status:** CONTEXTS.md uses different naming scheme than flow directory structure.

**CONTEXTS.md contexts (routable):**
- work, maintenance, explore, review, settings, pm

**Flow directory structure:**
- engineering/ (hosts: work, maintenance flows)
- framework/ (hosts: explore, settings, pm flows)
- human/ (hosts: explore flows)
- qa/ (hosts: review flows)

**Analysis:** This is NOT a bug, but an architectural design choice.
- Contexts = user-facing routing layer (how orchestrator understands requests)
- Flow directories = implementation organization (how code is structured)
- Mapping is many-to-many (e.g., "explore" spans framework/ and human/)

**Impact:** Low. This is intentional design, not drift. But documentation could clarify the mapping.

**Recommended Action:** Add a mapping table to CONTEXTS.md showing context to flow directory relationships.

---

### ✅ CHECK 7: Abstract Actions Verification (PASS)

**Status:** All abstract actions have instructions.md files.

Abstract actions verified (4 total):
- _abstract/agent-standards/ ✅
- _abstract/create-log-folder/ ✅
- _abstract/post-completion/ ✅
- _abstract/update-queue/ ✅

**Note:** Abstract actions correctly have NO agent.md files (they are reusable patterns, not spawnable agents).

**Finding:** Abstract action structure correct.

---

### ✅ CHECK 8: Flow Chain Action References (PASS)

**Status:** All actions referenced in flow chains exist in ACTIONS.md.

Flow chains cross-referenced:

**code-and-review/:** code → review → second-opinion
- code/ ✅, review/ ✅, second-opinion/ ✅

**post-completion/:** commit → (registry update)
- commit/ ✅

**bug-triage/:** analyze → code → test → review
- analyze/ ✅, code/ ✅, test/ ✅, review/ ✅

**doc-reorganization/:** analyze → plan → code → review
- analyze/ ✅, plan/ ✅, code/ ✅, review/ ✅

**ideation/:** analyze → brainstorm → code
- analyze/ ✅, brainstorm/ ✅, code/ ✅

**audit-and-fix/:** audit → second-opinion → review
- audit/ ✅, second-opinion/ ✅, review/ ✅

**framework flows:**
- onboarding/ ✅
- flow-creation/ → plan → code → review ✅
- action-creation/ → plan → code → review → second-opinion ✅
- action-deletion/ → analyze → code → review ✅
- framework-health/ → analyze ✅
- planning/ → analyze → plan → code → commit ✅

**Finding:** All action references valid. No broken chains.

---

## Issue Summary

| Check | Status | Severity | Count |
|-------|--------|----------|-------|
| 1. Action agent.md files | ✅ PASS | - | 0 issues |
| 2. Action instructions.md files | ✅ PASS | - | 0 issues |
| 3. Flow instructions.md files | ⚠️ PASS | LOW | 1 orphan |
| 4. No stale registry entries | ✅ PASS | - | 0 issues |
| 5. No orphan directories | ⚠️ FAIL | LOW | 1 orphan |
| 6. Context-directory mapping | ℹ️ DESIGN | INFO | Design choice |
| 7. Abstract actions | ✅ PASS | - | 0 issues |
| 8. Flow chain references | ✅ PASS | - | 0 issues |

**Total Issues:** 2
- **CRITICAL:** 0
- **HIGH:** 0
- **MEDIUM:** 0
- **LOW:** 2 (1 orphan flow, 1 design inconsistency)

---

## Recommendations

### Priority 1: Register Orphan Flow (LOW)

**Action:** Add test-coverage/ flow to FLOWS.md

**Suggested entry in FLOWS.md under "review" or "settings" context:**

```markdown
## review

| Flow | Purpose | Chain |
|------|---------|-------|
| test-coverage/ | Analyze test coverage and address gaps | test → analyze → code (conditional) |
```

**Rationale:** Flow is complete and functional, just not discoverable via registry.

---

### Priority 2: Document Context-to-Directory Mapping (INFO)

**Action:** Add mapping table to CONTEXTS.md

**Suggested addition:**

```markdown
## Context-to-Flow Directory Mapping

| Context | Flow Directories | Rationale |
|---------|------------------|-----------|
| work | engineering/ | Feature dev and new code |
| maintenance | engineering/ | Bug fixes and refactoring |
| explore | framework/, human/ | Research and ideation |
| review | qa/ | Audits and quality checks |
| settings | framework/ | Config and meta-framework |
| pm | framework/ | Planning and coordination |
```

**Rationale:** Clarifies intentional design choice between logical contexts and implementation organization.

---

## Health Score Breakdown

| Category | Score | Weight | Weighted |
|----------|-------|--------|----------|
| Registry Completeness | 100% | 30% | 30 |
| File Integrity | 100% | 30% | 30 |
| Cross-References | 100% | 20% | 20 |
| Orphans/Drift | 90% | 15% | 13.5 |
| Documentation | 80% | 5% | 4 |
| **TOTAL** | | | **97.5/100** |

**Rounded Final Score: 98/100** (Excellent)

---

## Conclusion

The ActionFlows framework structure is in **excellent health** with only minor documentation drift. All critical functionality is intact:

✅ All actions spawnable (agent.md files present)
✅ All flows executable (instructions.md files present)
✅ No broken references in chains
✅ No stale registry entries
✅ Abstract actions properly structured

**The framework is production-ready.** The identified issues are documentation/discovery improvements, not functional problems.

**Next Steps:**
1. Add test-coverage/ to FLOWS.md registry
2. Add context-to-directory mapping table to CONTEXTS.md
3. Continue monitoring for drift as framework evolves

---

**Report Generated By:** analyze/ (drift mode)
**Agent:** Claude Sonnet 4.5
**Framework Version:** ActionFlows Dashboard v1.0
