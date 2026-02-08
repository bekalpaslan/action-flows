# Harmony Philosophy Gap Analysis — Quick Summary

**Date:** 2026-02-08
**Files Analyzed:** 13 framework files, 10 agent definitions, 8 project docs, 3 code packages
**Gaps Found:** 31 locations need harmony philosophy integration
**Estimated Fix Effort:** ~4 hours

---

## Key Finding

The Framework Harmony System is **architecturally complete** (all 4 parts implemented and working), but **philosophically invisible** in documentation. Humans reading framework files don't understand why output formats are load-bearing or how to evolve them safely.

---

## Priority Breakdown

### High Priority (6 files)
1. **ORCHESTRATOR.md** — Add "Contract & Harmony" section to Core Philosophy
2. **agent-standards.md** — Add Standard #12: Contract Compliance
3. **README.md** — Add "Framework Harmony" section
4. **review/agent.md** — Add contract compliance warning
5. **code/agent.md** — Add contract change guidance
6. **CONTRACT.md** — Add cross-reference to other 3 harmony components

### Medium Priority (4 files)
7. **ACTIONS.md** — Add "Contract Output?" column
8. **FRD.md** — Expand harmony philosophy section
9. **SRD.md** — Add HarmonyDetector to architecture
10. **onboarding/agent.md** — Add Module 9 context

### Low Priority (3 files)
11. **FLOWS.md** — Note that flows are NOT contract-defined
12. **ORGANIZATION.md** — Note that departments are NOT contract-defined
13. **project.config.md** — Add Contract & Harmony subsection

---

## What Gets Added

### Core Concepts to Embed

1. **The 4-Part Harmony System:**
   - Orchestrator Contract (CONTRACT.md + packages/shared/src/contract/)
   - Onboarding Questionnaire (Module 9)
   - Harmony Detection (HarmonyDetector service)
   - Philosophy Documentation (this gap analysis)

2. **Living Software Philosophy:**
   - Traditional: Static code, manual changes, quality degrades
   - Living: Evolves through use, agent learnings, quality improves
   - Harmony: Enables evolution without breaking sync

3. **Sacred vs Not Sacred:**
   - Sacred (contract-defined): Output formats the dashboard PARSES
   - Not Sacred (evolve freely): Everything the dashboard READS

4. **Evolution Rules:**
   - To add format: Define in CONTRACT.md → Add parser → Update ORCHESTRATOR.md → Update dashboard
   - To modify format: Increment CONTRACT_VERSION → Support both versions → 90-day migration
   - To validate: Run `pnpm run harmony:check`

---

## Cross-Reference Map

```
ORCHESTRATOR.md → CONTRACT.md (format specifications)
CONTRACT.md → Module 9 (interactive teaching)
CONTRACT.md → packages/shared/src/contract/ (implementation)
agent-standards.md → CONTRACT.md (compliance rules)
review/agent.md → CONTRACT.md Format 5.1 (output structure)
code/agent.md → CONTRACT.md (evolution rules)
README.md → CONTRACT.md (system overview)
FRD.md → CONTRACT.md (architecture context)
SRD.md → HarmonyDetector (implementation details)
```

---

## Implementation Plan

### Step 1: High Priority Updates (~2 hours)
- ORCHESTRATOR.md: Add harmony section after line 26
- agent-standards.md: Add Standard #12 after line 46
- README.md: Add harmony section after Architecture
- CONTRACT.md: Add system cross-references after line 42
- review/agent.md: Add compliance warning at line 72
- code/agent.md: Add contract guidance after line 20

### Step 2: Medium Priority Updates (~1.5 hours)
- ACTIONS.md: Add table column
- FRD.md: Expand harmony subsection
- SRD.md: Add architecture details
- onboarding/agent.md: Add Module 9 context

### Step 3: Low Priority Updates (~30 min)
- FLOWS.md, ORGANIZATION.md, project.config.md: Add clarification notes

### Step 4: Validation
- Grep for "CONTRACT.md" → Should find references in 10+ files
- Grep for "harmony" → Should find philosophy in core docs
- Check all cross-references → File paths exist, format numbers match
- Run `pnpm run harmony:check` → No regressions

---

## Files Generated

1. **report.md** — Full gap analysis with recommended content snippets (13 files analyzed, 31 gaps found)
2. **summary.md** — This quick reference (priority breakdown, implementation plan)

---

## Next Steps

1. Review gap analysis with human
2. Compile chain: code/ (implement high-priority updates) → review/ → commit/
3. Validate cross-references and harmony system integrity
4. Update logs/INDEX.md with completion entry
