# Contract Dissolution Phase 3: Agent References

**Action:** code/
**Date:** 2026-02-09
**Task:** Expand agent instructions with explicit CONTRACT.md references
**Plan:** D:\ActionFlowsDashboard\.claude\actionflows\logs\plan\contract-dissolution_2026-02-09-00-59-39\output.md

---

## Summary

Successfully expanded agent instruction files with explicit CONTRACT.md references per Phase 3 of the contract dissolution plan. All four agent files now have clear references to output format specifications in CONTRACT.md.

---

## Files Modified

| File | Change |
|------|--------|
| `.claude/actionflows/actions/_abstract/agent-standards/instructions.md` | Expanded Contract Compliance section (§12) with explicit CONTRACT.md links, validation command, evolution process reference, and detailed format requirements |
| `.claude/actionflows/actions/review/agent.md` | Added "Output Format (CRITICAL)" section after mission, referencing CONTRACT.md § Format 5.1 with required sections and validation command |
| `.claude/actionflows/actions/analyze/agent.md` | Added "Output Format (CRITICAL)" section after mission, referencing CONTRACT.md § Format 5.2 with required sections and validation command |
| `.claude/actionflows/actions/brainstorm/agent.md` | Added "Output Format (Recommended)" section after mission, referencing CONTRACT.md § Format 5.3 with note about optional enforcement |

---

## Changes Detail

### 1. agent-standards/instructions.md (lines 48-67 expanded)

**Before:** Basic contract compliance note with minimal detail

**After:** Comprehensive section including:
- Explicit link to `.claude/actionflows/CONTRACT.md`
- Link to `.claude/actionflows/docs/CONTRACT_EVOLUTION.md` for evolution process
- Validation command: `pnpm run harmony:check`
- Detailed breakdown of all 3 contract-defined actions (review, analyze, brainstorm)
- Each action lists specific required fields with enum values
- Clear explanation of why contract compliance matters (parsing, harmony, dashboard degradation)
- Preserved existing content while expanding with new details

### 2. review/agent.md (new section after line 17)

**Added:** "Output Format (CRITICAL)" section with:
- Reference to CONTRACT.md § Format 5.1
- Complete list of required sections (Verdict, Score, Summary, Findings, Fixes Applied, Flags for Human)
- Enum values for Verdict (APPROVED | NEEDS_CHANGES)
- Severity levels (critical, high, medium, low)
- Validation command
- Explanation of harmony violations impact

### 3. analyze/agent.md (new section after mission)

**Added:** "Output Format (CRITICAL)" section with:
- Reference to CONTRACT.md § Format 5.2
- Complete list of required sections (Title, Metadata, Analysis Body, Recommendations)
- Markdown H1 requirement for title
- Numbered sections requirement
- Validation command

### 4. brainstorm/agent.md (new section after mission)

**Added:** "Output Format (Recommended)" section with:
- Reference to CONTRACT.md § Format 5.3
- Note that format is recommended but NOT enforced
- List of recommended sections
- Clarification that dashboard displays as read-only markdown

---

## Impact

### Before
- Agents had minimal guidance on output format compliance
- No explicit CONTRACT.md references in agent files
- No validation command guidance
- Limited understanding of harmony system impact

### After
- All contract-defined agents now have explicit CONTRACT.md references
- Clear validation command in all relevant files
- Link to evolution process for framework developers
- Detailed required fields and enum values for each format
- Clear explanation of harmony violations and dashboard impact
- Differentiation between enforced (review, analyze) and recommended (brainstorm) formats

---

## Verification

### File Existence Check
- [x] `.claude/actionflows/actions/_abstract/agent-standards/instructions.md` — EXISTS, modified
- [x] `.claude/actionflows/actions/review/agent.md` — EXISTS, modified
- [x] `.claude/actionflows/actions/analyze/agent.md` — EXISTS, modified
- [x] `.claude/actionflows/actions/brainstorm/agent.md` — EXISTS, modified

### Content Validation
- [x] agent-standards expanded Contract Compliance section with CONTRACT.md reference
- [x] agent-standards includes validation command (`pnpm run harmony:check`)
- [x] agent-standards includes evolution process link (CONTRACT_EVOLUTION.md)
- [x] review/agent.md has explicit CONTRACT.md § Format 5.1 reference
- [x] analyze/agent.md has explicit CONTRACT.md § Format 5.2 reference
- [x] brainstorm/agent.md has explicit CONTRACT.md § Format 5.3 reference
- [x] All required sections and enum values documented
- [x] Clear distinction between CRITICAL (enforced) and Recommended (optional)

### Location Validation
- [x] All sections added in correct locations (after mission, before steps)
- [x] agent-standards expanded existing section (no new section added)
- [x] Existing content preserved in all files
- [x] No duplicate sections created

---

## Cross-References Added

### In agent-standards/instructions.md
- `.claude/actionflows/CONTRACT.md` (format specifications)
- `.claude/actionflows/docs/CONTRACT_EVOLUTION.md` (evolution process)
- `pnpm run harmony:check` (validation command)

### In review/agent.md
- `.claude/actionflows/CONTRACT.md` § Format 5.1
- `pnpm run harmony:check` (validation command)

### In analyze/agent.md
- `.claude/actionflows/CONTRACT.md` § Format 5.2
- `pnpm run harmony:check` (validation command)

### In brainstorm/agent.md
- `.claude/actionflows/CONTRACT.md` § Format 5.3

---

## Next Steps

This completes **Phase 3** of the contract dissolution plan. The remaining phase is:

**Phase 4: Restructure CONTRACT.md** (Sequential, LAST)
- Depends on: Phases 1, 2, 3 complete
- Remove duplicates, convert to lean type spec, add cross-references to new docs
- Reduce CONTRACT.md from 742 → ~350 lines

---

## Learnings

**Issue:** Agent instruction files lacked explicit CONTRACT.md references, making it unclear where format specifications live

**Root Cause:** Contract compliance was mentioned in agent-standards but not surfaced in individual agent.md files where agents actually read their instructions

**Suggestion:** When creating contract-defined actions, add explicit "Output Format" sections in agent.md files immediately after defining the mission. This makes format requirements visible at the point of consumption rather than requiring agents to remember to check abstract standards.

**[FRESH EYE]** The brainstorm agent path was different than expected (`.claude/actionflows/actions/brainstorm/agent.md` not `.claude/actionflows/flows/framework/brainstorm/agent.md`). This suggests there may be inconsistency in action vs flow organization. The plan document referenced the wrong path, but the correct file was found via Glob search.
