# CONTRACT.md Dissolution Inventory

**Analysis Date:** 2026-02-09
**Task:** Complete content map of CONTRACT.md with dissolution recommendations
**Agent:** analyze/

---

## Executive Summary

CONTRACT.md contains **742 lines** organized into:
- **6 major categories** (Chain Management, Step Lifecycle, Human Interaction, Registry & Metadata, Action Outputs, Error & Status)
- **17 distinct format specifications** (P0-P5 priority)
- **4 major sections** (Philosophy, Format Catalog, Validation, Contributing)

**Key Finding:** CONTRACT.md serves **4 distinct consumers** with content that belongs in different locations:

| Consumer | Lines | Dissolution Target |
|----------|-------|-------------------|
| **Orchestrator** | ~180 | ORCHESTRATOR.md (response format section) |
| **Agents** | ~60 | agent-standards/instructions.md |
| **Code** | ~120 | packages/shared/src/contract/ (already exists) |
| **Frontend** | ~80 | Dashboard parser expectations (documentation) |
| **Already Duplicated** | ~200 | Can be removed (redundant with ORCHESTRATOR.md) |
| **Meta (Philosophy)** | ~100 | Keep minimal version, expand in harmony docs |

---

## Part 1: Header & Philosophy (Lines 1-78)

### Section 1.1: Title & Meta (Lines 1-6)

**Content:**
```markdown
# ActionFlows Orchestrator Output Contract
**Version:** 1.0
**Last Updated:** 2026-02-08
**TypeScript Definitions:** `packages/shared/src/contract/`
```

**Consumer:** Meta (all consumers reference this)
**Current Purpose:** Document versioning and cross-reference
**Already Duplicated:** No
**Priority:** Critical (version tracking)

**Dissolution Recommendation:**
- **Keep in CONTRACT.md** as canonical version reference
- **Add reference** in ORCHESTRATOR.md header: "Output formats follow CONTRACT.md v1.0"
- **Add reference** in agent-standards: "Review/analyze outputs follow CONTRACT.md formats"

---

### Section 1.2: What Is This? (Lines 9-13)

**Content:**
```markdown
This contract defines every output format the ActionFlows orchestrator produces.
The dashboard depends on these formats for visualization.
**These formats are load-bearing** — changing them without updating the contract breaks the dashboard.
```

**Consumer:** Human readers (onboarding, philosophy)
**Current Purpose:** Explain why CONTRACT.md exists
**Already Duplicated:** Partially in ORCHESTRATOR.md lines 29-58 (Contract & Harmony section)
**Priority:** Nice-to-have (introductory)

**Dissolution Recommendation:**
- **REMOVE from CONTRACT.md** (redundant with ORCHESTRATOR.md)
- **KEEP minimal version** in CONTRACT.md: "See ORCHESTRATOR.md for harmony philosophy"
- **Expand reference** in onboarding/modules/09-harmony.md

---

### Section 1.3: Contract Philosophy (Lines 15-27)

**Content:**
```markdown
### Harmony Concept
**Harmony** means the orchestrator's actual output matches the contract specification.
When harmony breaks:
1. Dashboard shows "parsing incomplete" (graceful degradation)
2. Harmony detection flags drift (automated monitoring)
3. Human investigates and updates contract OR orchestrator (evolutionary loop)
```

**Consumer:** Orchestrator + Human (philosophy, behavior guidelines)
**Current Purpose:** Define harmony concept and behavior on violations
**Already Duplicated:** YES — ORCHESTRATOR.md lines 29-58 covers this extensively
**Priority:** Critical (behavioral contract)

**Dissolution Recommendation:**
- **REMOVE from CONTRACT.md** — Fully duplicated in ORCHESTRATOR.md
- **Keep reference only** in CONTRACT.md: "See ORCHESTRATOR.md § Contract & Harmony"
- **Primary source:** ORCHESTRATOR.md lines 29-58

---

### Section 1.4: Evolution Rules (Lines 29-43)

**Content:**
```markdown
To add a new format:
1. Define it in the contract (types, patterns, parsers)
2. Update ORCHESTRATOR.md with example
3. Update dashboard components to render it
4. Run harmony detection to validate
5. Increment CONTRACT_VERSION if structure changes

To modify an existing format:
1. Increment CONTRACT_VERSION (e.g., 1.0 → 1.1 for minor, 1.0 → 2.0 for breaking)
2. Add version-specific parser (parseChainCompilationV1_1)
3. Support both versions during migration (90-day window minimum)
4. Update CONTRACT.md with new format
5. Notify via harmony detection (dashboard shows version mismatch warning)
```

**Consumer:** Framework developers (those modifying contract)
**Current Purpose:** Process for evolving the contract
**Already Duplicated:** Partially in ORCHESTRATOR.md lines 47-49
**Priority:** Critical (evolution process)

**Dissolution Recommendation:**
- **KEEP in CONTRACT.md** — This is the canonical process guide
- **Add condensed reference** in ORCHESTRATOR.md: "See CONTRACT.md § Evolution Rules for format change process"
- **Target:** Contract maintainers (framework team)

---

### Section 1.5: Complete Harmony System (Lines 48-76)

**Content:**
```markdown
This contract is **part 1 of 4** in the Framework Harmony System:

**1. Orchestrator Contract (this file)**
**2. Onboarding Questionnaire**
**3. Harmony Detection**
**4. Philosophy Documentation**
```

**Consumer:** Human readers (philosophy, cross-references)
**Current Purpose:** Map the complete harmony system
**Already Duplicated:** NO — Unique to CONTRACT.md
**Priority:** Nice-to-have (reference map)

**Dissolution Recommendation:**
- **MOVE to** `.claude/actionflows/docs/HARMONY_SYSTEM.md` (new file)
- **Keep brief reference** in CONTRACT.md: "Part of 4-component Harmony System (see docs/HARMONY_SYSTEM.md)"
- **Cross-reference** in ORCHESTRATOR.md, onboarding, and agent-standards

---

## Part 2: Format Catalog (Lines 79-628)

### Section 2.1: Priority Levels Table (Lines 82-93)

**Content:**
```markdown
| Priority | Purpose |
|----------|---------|
| **P0** | Critical for core dashboard functionality (chain visualization, progress tracking) |
| **P1** | High-value features (quality metrics, error recovery) |
| **P2** | Second-opinion integration, live registry updates |
| **P3** | Historical data, status updates |
| **P4** | Session metadata, edge cases |
| **P5** | Low-frequency or internal formats |
```

**Consumer:** Frontend (dashboard implementation priority)
**Current Purpose:** Prioritize parser implementation
**Already Duplicated:** NO
**Priority:** Nice-to-have (planning)

**Dissolution Recommendation:**
- **KEEP in CONTRACT.md** — Useful for dashboard developers
- **Add to** `packages/app/docs/PARSER_PRIORITY.md` with implementation status checkboxes
- **Target:** Frontend team planning parser backlog

---

### Category 1: Chain Management (Lines 96-209)

#### Format 1.1: Chain Compilation Table (P0) — Lines 98-140

**Content:** Full specification of chain compilation table output

**Consumer:** **Orchestrator** (must produce) + **Frontend** (must parse)
**Current Purpose:** Define the chain compilation format that orchestrator outputs
**Already Duplicated:** YES — ORCHESTRATOR.md lines 348-367 has example format
**Priority:** **CRITICAL** (P0 — core functionality)

**Detailed Breakdown:**

| Lines | Content | Consumer | Already In |
|-------|---------|----------|-----------|
| 98-123 | Markdown structure example | Orchestrator | ORCHESTRATOR.md lines 348-367 |
| 125-132 | Required fields list | Orchestrator | ORCHESTRATOR.md (implicit in example) |
| 134-135 | TypeScript interface reference | Code | packages/shared/src/contract/types/ |
| 137-140 | Dashboard usage notes | Frontend | Implicit in parser implementation |

**Dissolution Recommendation:**
- **ORCHESTRATOR.md already has this** (lines 348-367) — Keep as canonical example
- **CONTRACT.md** should be **TYPE SPEC ONLY**:
  ```markdown
  ### Format 1.1: Chain Compilation Table (P0)
  **TypeScript:** ChainCompilationParsed
  **Parser:** parseChainCompilation(text: string)
  **Pattern:** /^## Chain: (.+)$/m
  **Example:** See ORCHESTRATOR.md § Response Format Standard → Chain Compilation
  ```
- **REMOVE** the full markdown example from CONTRACT.md (lines 104-123) — Duplicates ORCHESTRATOR.md
- **KEEP** required fields list (lines 125-132) — Type specification details
- **REMOVE** dashboard usage notes (lines 137-140) — Frontend internal concern

---

#### Format 1.2: Chain Execution Start (P3) — Lines 142-163

**Content:** Format for execution start announcement

**Consumer:** Orchestrator (must produce) + Frontend (must parse)
**Current Purpose:** Define execution start message
**Already Duplicated:** YES — ORCHESTRATOR.md lines 369-375
**Priority:** P3 (status updates)

**Dissolution Recommendation:**
- **ORCHESTRATOR.md already has this** (lines 369-375)
- **CONTRACT.md** should be **TYPE SPEC ONLY** (same pattern as 1.1)
- **REMOVE** markdown example (lines 149-153)
- **KEEP** required fields (lines 155-159) as type spec

---

#### Format 1.3: Chain Status Update (P4) — Lines 165-185

**Content:** Format for mid-chain status updates

**Consumer:** Orchestrator + Frontend
**Already Duplicated:** YES — ORCHESTRATOR.md lines 384-395
**Priority:** P4 (progress tracking)

**Dissolution Recommendation:**
- Same as 1.2 — Convert to type spec only, reference ORCHESTRATOR.md

---

#### Format 1.4: Execution Complete Summary (P4) — Lines 187-209

**Content:** Format for chain completion

**Consumer:** Orchestrator + Frontend
**Already Duplicated:** YES — ORCHESTRATOR.md lines 399-409
**Priority:** P4

**Dissolution Recommendation:**
- Same pattern — Type spec only, reference ORCHESTRATOR.md

---

### Category 2: Step Lifecycle (Lines 211-293)

#### Format 2.1: Step Completion Announcement (P0) — Lines 213-238

**Content:** Step completion format `>> Step {N} complete: {action/} -- {result}`

**Consumer:** Orchestrator (must produce) + Frontend (must parse)
**Current Purpose:** Define step completion announcement
**Already Duplicated:** YES — ORCHESTRATOR.md lines 377-381
**Priority:** **CRITICAL (P0)**

**Dissolution Recommendation:**
- **ORCHESTRATOR.md already has this** (lines 377-381)
- **CONTRACT.md** → Type spec only
- **REMOVE** lines 218-221 (markdown example)
- **KEEP** lines 223-229 (required fields) as type specification

---

#### Format 2.2: Dual Output (Action + Second Opinion) (P2) — Lines 240-275

**Content:** Format for presenting action + second-opinion together

**Consumer:** Orchestrator (must produce) + Frontend (must parse)
**Current Purpose:** Define dual output presentation
**Already Duplicated:** YES — ORCHESTRATOR.md lines 243-263
**Priority:** P2 (second-opinion integration)

**Dissolution Recommendation:**
- **ORCHESTRATOR.md already has this** (lines 243-263)
- **CONTRACT.md** → Type spec only
- **REMOVE** markdown example (lines 246-267)
- **KEEP** fields and structure notes as type spec

---

#### Format 2.3: Second Opinion Skip (P4) — Lines 277-293

**Content:** Format when second opinion is skipped

**Consumer:** Orchestrator + Frontend
**Already Duplicated:** YES — ORCHESTRATOR.md lines 265-272
**Priority:** P4

**Dissolution Recommendation:**
- Same pattern — Type spec only, reference ORCHESTRATOR.md

---

### Category 3: Human Interaction (Lines 295-369)

#### Format 3.1: Human Gate Presentation (P5) — Lines 297-317

**Content:** Format for human approval gates

**Consumer:** Orchestrator (loose format) + Frontend (no parsing)
**Current Purpose:** Show expected structure for human gates
**Already Duplicated:** NO — Not in ORCHESTRATOR.md
**Priority:** P5 (no standardized format)

**Dissolution Recommendation:**
- **ADD to ORCHESTRATOR.md** as example (not contract-defined)
- **REMOVE from CONTRACT.md** — Note says "NOT standardized format"
- **Keep note** that human gates are free-form

---

#### Format 3.2: Learning Surface Presentation (P2) — Lines 319-343

**Content:** Format for presenting agent learnings to human

**Consumer:** Orchestrator (must produce) + Frontend (must parse)
**Current Purpose:** Define learning surface format
**Already Duplicated:** YES — ORCHESTRATOR.md lines 412-422
**Priority:** P2 (agent feedback loop)

**Dissolution Recommendation:**
- **ORCHESTRATOR.md already has this** (lines 412-422)
- **CONTRACT.md** → Type spec only
- **REMOVE** markdown example (lines 325-335)

---

#### Format 3.3: Session-Start Protocol Acknowledgment (P4) — Lines 345-369

**Content:** Format for session start message

**Consumer:** Orchestrator (note: currently NOT produced)
**Current Purpose:** Placeholder for future implementation
**Already Duplicated:** NO
**Priority:** P4 (session metadata)

**Dissolution Recommendation:**
- **MARK as "FUTURE"** in CONTRACT.md
- **Do NOT add to ORCHESTRATOR.md** until implemented
- **Keep type spec** for when feature is built

---

### Category 4: Registry & Metadata (Lines 371-440)

#### Format 4.1: Registry Update (P2) — Lines 373-394

**Content:** Format for registry line edits

**Consumer:** Orchestrator (must produce) + Frontend (must parse)
**Current Purpose:** Define registry update announcement
**Already Duplicated:** YES — ORCHESTRATOR.md lines 426-434
**Priority:** P2 (live registry updates)

**Dissolution Recommendation:**
- **ORCHESTRATOR.md already has this** (lines 426-434)
- **CONTRACT.md** → Type spec only

---

#### Format 4.2: INDEX.md Entry (P3) — Lines 396-415

**Content:** Format for INDEX.md table rows

**Consumer:** Orchestrator (must produce) + Frontend (might parse)
**Current Purpose:** Define execution history entry format
**Already Duplicated:** NO — Not in ORCHESTRATOR.md
**Priority:** P3 (historical data)

**Dissolution Recommendation:**
- **ADD example** to ORCHESTRATOR.md (post-execution behavior)
- **CONTRACT.md** → Type spec only
- **Target consumer:** Registry file format specification

---

#### Format 4.3: LEARNINGS.md Entry (P4) — Lines 417-440

**Content:** Format for learnings entries

**Consumer:** Orchestrator (when writing learnings) + Frontend (might parse)
**Current Purpose:** Define learning entry structure
**Already Duplicated:** NO — Not in ORCHESTRATOR.md
**Priority:** P4 (historical learnings)

**Dissolution Recommendation:**
- **ADD example** to ORCHESTRATOR.md (learning surface approval → write to LEARNINGS.md)
- **CONTRACT.md** → Type spec only

---

### Category 5: Action Outputs (Lines 442-573)

#### Format 5.1: Review Report Structure (P1) — Lines 444-483

**Content:** Review action output format

**Consumer:** **AGENTS** (review/ action must produce) + Frontend (must parse)
**Current Purpose:** Define review report structure
**Already Duplicated:** Partially in agent-standards lines 48-67 (contract compliance note)
**Priority:** **CRITICAL (P1)**

**Dissolution Recommendation:**
- **CONTRACT.md** → Keep FULL type spec (this is for agents, not orchestrator)
- **ADD reference** to review/agent.md: "Output must follow CONTRACT.md § Format 5.1"
- **agent-standards** already mentions this (line 58: "review/ → Review Report Structure (Format 5.1)")
- **Keep detailed structure** in CONTRACT.md — Agents need this

---

#### Format 5.2: Analysis Report Structure (P3) — Lines 485-521

**Content:** Analysis action output format

**Consumer:** **AGENTS** (analyze/ action must produce) + Frontend (must parse)
**Current Purpose:** Define analysis report structure
**Already Duplicated:** Partially in agent-standards (contract compliance note)
**Priority:** P3 (metrics display)

**Dissolution Recommendation:**
- **CONTRACT.md** → Keep FULL type spec
- **ADD reference** to analyze/agent.md: "Output must follow CONTRACT.md § Format 5.2"
- **agent-standards** already mentions this (line 59: "analyze/ → Analysis Report Structure (Format 5.2)")

---

#### Format 5.3: Brainstorm Session Transcript (P5) — Lines 523-573

**Content:** Brainstorm action output format

**Consumer:** AGENTS (brainstorm/ action must produce) + Frontend (read-only)
**Current Purpose:** Define brainstorm transcript structure
**Already Duplicated:** Partially in agent-standards
**Priority:** P5 (read-only viewing)

**Dissolution Recommendation:**
- **CONTRACT.md** → Keep type spec
- **ADD reference** to brainstorm/agent.md
- **agent-standards** already mentions this (line 60: "brainstorm/ → Brainstorm Session Transcript (Format 5.3)")

---

### Category 6: Error & Status (Lines 575-628)

#### Format 6.1: Error Announcement (P1) — Lines 577-604

**Content:** Error message format

**Consumer:** Orchestrator (must produce) + Frontend (must parse)
**Current Purpose:** Define error handling format
**Already Duplicated:** NO — Not in ORCHESTRATOR.md
**Priority:** **CRITICAL (P1)** — Error recovery UI

**Dissolution Recommendation:**
- **ADD to ORCHESTRATOR.md** as example (error handling section)
- **CONTRACT.md** → Type spec only
- **Frontend** needs this for ErrorModal component

---

#### Format 6.2: Department Routing Announcement (P5) — Lines 606-626

**Content:** Routing decision announcement

**Consumer:** Orchestrator (note: currently NOT produced)
**Current Purpose:** Placeholder for future routing transparency
**Already Duplicated:** NO
**Priority:** P5 (internal, not user-facing)

**Dissolution Recommendation:**
- **MARK as "FUTURE"** in CONTRACT.md
- **Do NOT add to ORCHESTRATOR.md** until implemented

---

## Part 3: Contract Validation (Lines 629-671)

### Section 3.1: Automated Checks (Lines 631-644)

**Content:**
```bash
pnpm run harmony:check
```
Process for running harmony validation

**Consumer:** Framework developers
**Current Purpose:** Document validation tooling
**Already Duplicated:** NO
**Priority:** Nice-to-have (tooling documentation)

**Dissolution Recommendation:**
- **KEEP in CONTRACT.md** — Canonical validation documentation
- **ADD to** packages/backend/README.md (harmony detection usage)

---

### Section 3.2: Manual Testing (Lines 646-671)

**Content:** TypeScript code example for testing parsers

**Consumer:** Code developers (testing parsers)
**Current Purpose:** Show how to manually test format parsing
**Already Duplicated:** NO
**Priority:** Nice-to-have (developer reference)

**Dissolution Recommendation:**
- **MOVE to** `packages/shared/src/contract/README.md` (parser testing guide)
- **Keep reference** in CONTRACT.md: "See packages/shared/src/contract/README.md for parser testing"

---

## Part 4: Breaking Changes & Contributing (Lines 673-742)

### Section 4.1: Breaking Changes Process (Lines 673-685)

**Content:** 6-step process for breaking contract changes

**Consumer:** Framework developers
**Current Purpose:** Process guide for contract evolution
**Already Duplicated:** Partially overlaps with Section 1.4 (Evolution Rules)
**Priority:** Critical (evolution process)

**Dissolution Recommendation:**
- **CONSOLIDATE** with Section 1.4 (lines 29-43)
- **Single canonical section** "Contract Evolution Process"
- **Remove duplication** between "Evolution Rules" and "Breaking Changes"

---

### Section 4.2: Contributing Guide (Lines 687-700)

**Content:** 9-step process for adding new formats

**Consumer:** Framework developers
**Current Purpose:** Onboarding guide for adding formats
**Already Duplicated:** Overlaps with Section 1.4 and 4.1
**Priority:** Nice-to-have (contributor guide)

**Dissolution Recommendation:**
- **CONSOLIDATE** all evolution/contribution sections into one
- **Move to** `.claude/actionflows/docs/CONTRACT_EVOLUTION.md`
- **Keep brief reference** in CONTRACT.md

---

### Section 4.3: TypeScript Reference (Lines 702-738)

**Content:** Import statement showing all available types/parsers/guards

**Consumer:** Code developers
**Current Purpose:** API reference for contract package
**Already Duplicated:** NO (but should be in code docs)
**Priority:** Nice-to-have (API documentation)

**Dissolution Recommendation:**
- **MOVE to** `packages/shared/src/contract/README.md`
- **Keep brief reference** in CONTRACT.md
- **Primary source:** Code documentation

---

## Summary: Complete Dissolution Map

### Files to Create

1. **`.claude/actionflows/docs/HARMONY_SYSTEM.md`**
   - Move: Lines 48-76 (Complete Harmony System overview)
   - Purpose: Cross-reference map of all harmony components

2. **`.claude/actionflows/docs/CONTRACT_EVOLUTION.md`**
   - Move: Lines 29-43 (Evolution Rules)
   - Move: Lines 673-685 (Breaking Changes)
   - Move: Lines 687-700 (Contributing)
   - Purpose: Single canonical guide for contract evolution

3. **`packages/shared/src/contract/README.md`**
   - Move: Lines 646-671 (Manual Testing)
   - Move: Lines 702-738 (TypeScript Reference)
   - Purpose: Developer API documentation

4. **`packages/app/docs/PARSER_PRIORITY.md`**
   - Move: Lines 82-93 (Priority Levels)
   - Purpose: Frontend parser implementation tracking

---

### Changes to Existing Files

#### ORCHESTRATOR.md — Add Missing Examples

**Add these formats (currently only in CONTRACT.md):**
- Format 6.1: Error Announcement (lines 577-604)
- Format 4.2: INDEX.md Entry (lines 396-415)
- Format 4.3: LEARNINGS.md Entry (lines 417-440)
- Format 3.1: Human Gate Presentation (lines 297-317) — as non-contract example

**Rationale:** Orchestrator needs these examples in its reference guide

---

#### agent-standards/instructions.md — Expand Contract Compliance

**Current (lines 48-67):**
```markdown
### 12. Contract Compliance (for output-producing actions)
- review/ → Review Report Structure (Format 5.1)
- analyze/ → Analysis Report Structure (Format 5.2)
- brainstorm/ → Brainstorm Session Transcript (Format 5.3)
```

**Expand with:**
- Link to CONTRACT.md for full specifications
- Note that parsers validate structure
- Mention harmony detection violations

---

#### Individual agent.md files — Add Contract References

**For these agents:**
- review/agent.md → Add: "Output must follow CONTRACT.md § Format 5.1"
- analyze/agent.md → Add: "Output must follow CONTRACT.md § Format 5.2"
- brainstorm/agent.md → Add: "Output must follow CONTRACT.md § Format 5.3"

**Rationale:** Direct reference from agent instructions to their format spec

---

### CONTRACT.md — Restructure

**New Structure (Lean Type Spec):**

```markdown
# ActionFlows Orchestrator Output Contract

**Version:** 1.0
**Harmony System:** See docs/HARMONY_SYSTEM.md
**Evolution Process:** See docs/CONTRACT_EVOLUTION.md

---

## Format Catalog

### Priority Levels
See packages/app/docs/PARSER_PRIORITY.md

---

### Category 1: Chain Management (Orchestrator Outputs)

#### Format 1.1: Chain Compilation Table (P0)
**TypeScript:** ChainCompilationParsed
**Parser:** parseChainCompilation(text: string)
**Pattern:** /^## Chain: (.+)$/m
**Example:** ORCHESTRATOR.md § Response Format Standard → Chain Compilation

**Required Fields:**
- Brief Title (string)
- Request (one-line string)
- Source (enum: flow name | "Composed from: ..." | "Meta-task")
- Table columns: #, Action, Model, Key Inputs, Waits For, Status
- Execution (enum: Sequential | Parallel: [...] | Single step)
- Numbered list: "What each step does"

---

### Category 5: Action Outputs (Agent Outputs)

#### Format 5.1: Review Report Structure (P1)
**Producer:** review/ action
**TypeScript:** ReviewReportParsed
**Parser:** parseReviewReport(text: string)

**Required Structure:**
```markdown
# Review Report: {scope}

## Verdict: {APPROVED | NEEDS_CHANGES}
## Score: {X}%

## Summary
{2-3 sentence overview}

## Findings
| # | File | Line | Severity | Description | Suggestion |
|---|------|------|----------|-------------|------------|

## Fixes Applied (if mode = review-and-fix)
| File | Fix |

## Flags for Human
| Issue | Why Human Needed |
```

**Dashboard Usage:** ReviewReportViewer, FindingsTable, VerdictBanner components

---

[etc. for all 17 formats]
```

**Key Changes:**
- Remove all duplicate markdown examples (already in ORCHESTRATOR.md)
- Keep ONLY type specifications
- Reference ORCHESTRATOR.md for orchestrator output examples
- Keep FULL specs for agent outputs (agents need these)
- Cross-reference documentation files

---

## Dissolution Priority

### Phase 1: Remove Duplicates (Immediate)
**Lines to remove from CONTRACT.md:**
- Lines 9-13 (What Is This?) — Duplicates ORCHESTRATOR.md
- Lines 15-27 (Harmony Concept) — Duplicates ORCHESTRATOR.md
- All markdown examples for orchestrator formats (keep only type specs)

**Estimated reduction:** ~200 lines (27% of file)

---

### Phase 2: Extract Documentation (High Priority)
**Create new files:**
1. docs/HARMONY_SYSTEM.md — Philosophy cross-reference
2. docs/CONTRACT_EVOLUTION.md — Consolidate evolution/contribution
3. packages/shared/src/contract/README.md — Code API docs

**Estimated reduction:** ~150 lines (20% of file)

---

### Phase 3: Expand References (High Priority)
**Add to existing files:**
1. ORCHESTRATOR.md — Add missing format examples (Error, INDEX, LEARNINGS, Human Gate)
2. agent-standards — Expand contract compliance section
3. Individual agent.md files — Add contract references

**No reduction, but improves discoverability**

---

### Phase 4: Restructure CONTRACT.md (Final)
**Convert to lean type spec format:**
- Keep version header
- Keep format catalog with type specs
- Reference examples in ORCHESTRATOR.md
- Keep full specs for agent outputs
- Remove all philosophy (now in docs/)

**Final CONTRACT.md size:** ~300-350 lines (50% reduction)

---

## Consumer Matrix

| Format | Orchestrator Reads | Agent Reads | Code Parses | Frontend Renders | Already In ORCH.md |
|--------|-------------------|-------------|-------------|------------------|--------------------|
| 1.1 Chain Compilation | PRODUCES | No | Yes | Yes | ✅ Lines 348-367 |
| 1.2 Execution Start | PRODUCES | No | Yes | Yes | ✅ Lines 369-375 |
| 1.3 Status Update | PRODUCES | No | Yes | Yes | ✅ Lines 384-395 |
| 1.4 Complete Summary | PRODUCES | No | Yes | Yes | ✅ Lines 399-409 |
| 2.1 Step Completion | PRODUCES | No | Yes | Yes | ✅ Lines 377-381 |
| 2.2 Dual Output | PRODUCES | No | Yes | Yes | ✅ Lines 243-263 |
| 2.3 Second Opinion Skip | PRODUCES | No | Yes | Yes | ✅ Lines 265-272 |
| 3.1 Human Gate | PRODUCES | No | No | No | ❌ Not in ORCH.md |
| 3.2 Learning Surface | PRODUCES | No | Yes | Yes | ✅ Lines 412-422 |
| 3.3 Session Start | FUTURE | No | Yes | Yes | ❌ Not implemented |
| 4.1 Registry Update | PRODUCES | No | Yes | Yes | ✅ Lines 426-434 |
| 4.2 INDEX Entry | PRODUCES | No | Maybe | Maybe | ❌ Not in ORCH.md |
| 4.3 LEARNINGS Entry | PRODUCES | No | Maybe | Maybe | ❌ Not in ORCH.md |
| 5.1 Review Report | No | **PRODUCES** | Yes | Yes | ❌ Agent output |
| 5.2 Analysis Report | No | **PRODUCES** | Yes | Yes | ❌ Agent output |
| 5.3 Brainstorm Transcript | No | **PRODUCES** | No | Read-only | ❌ Agent output |
| 6.1 Error Announcement | PRODUCES | No | Yes | Yes | ❌ Not in ORCH.md |
| 6.2 Dept Routing | FUTURE | No | Yes | Yes | ❌ Not implemented |

**Key Insight:**
- **12 formats** produced by orchestrator → **9 already in ORCHESTRATOR.md**
- **3 formats** produced by agents → **Referenced in agent-standards, need full specs in CONTRACT.md**
- **2 formats** future/not implemented
- **1 format** (Human Gate) not standardized

---

## Critical Findings

### 1. CONTRACT.md is 3 Documents in One

**Document A: Orchestrator Output Guide** (currently ~400 lines)
- Target reader: The orchestrator
- Should live in: ORCHESTRATOR.md (mostly already there)
- Duplication: ~70% already exists in ORCHESTRATOR.md

**Document B: Agent Output Specification** (~150 lines)
- Target reader: Agents (review, analyze, brainstorm)
- Should live in: CONTRACT.md (keep these)
- Referenced by: agent-standards/instructions.md

**Document C: Philosophy & Process** (~150 lines)
- Target reader: Framework developers, humans
- Should live in: docs/ folder
- Currently mixed into CONTRACT.md

---

### 2. ORCHESTRATOR.md is Missing 4 Formats

**Missing orchestrator-produced formats:**
1. Format 6.1: Error Announcement — Critical for error recovery
2. Format 4.2: INDEX.md Entry — Post-execution registry
3. Format 4.3: LEARNINGS.md Entry — Learning approval → write
4. Format 3.1: Human Gate — Free-form, but show example

**Action:** Add these to ORCHESTRATOR.md response format section

---

### 3. Agent Output Specs Should Stay in CONTRACT.md

**Rationale:**
- Agents need detailed structure specifications
- These are NOT duplicated in ORCHESTRATOR.md (orchestrator doesn't produce them)
- Frontend needs these for parsing
- Contract compliance (agent-standards line 48-67) already references FORMAT.md sections

**Keep in CONTRACT.md:**
- Format 5.1: Review Report Structure (full spec)
- Format 5.2: Analysis Report Structure (full spec)
- Format 5.3: Brainstorm Transcript (full spec)

---

### 4. TypeScript Definitions Already Exist

**Lines 702-738** show import statements for:
- Types (ChainCompilationParsed, etc.)
- Patterns (ChainPatterns, etc.)
- Parsers (parseChainCompilation, etc.)
- Guards (isChainCompilationParsed, etc.)

**These are already implemented in:**
- packages/shared/src/contract/types/
- packages/shared/src/contract/patterns/
- packages/shared/src/contract/parsers/
- packages/shared/src/contract/guards.ts

**Action:** Move TypeScript API reference to packages/shared/src/contract/README.md

---

## Recommended Dissolution Plan

### Step 1: Extract Philosophy (Create New Files)

**File 1: `.claude/actionflows/docs/HARMONY_SYSTEM.md`**
```markdown
# Framework Harmony System

The complete 4-component system that keeps orchestrator and dashboard in sync.

**1. Orchestrator Contract**
Location: .claude/actionflows/CONTRACT.md
Purpose: Formal specification of all output formats
[Content from CONTRACT.md lines 48-76]

**2. Onboarding Questionnaire**
[etc.]
```

**File 2: `.claude/actionflows/docs/CONTRACT_EVOLUTION.md`**
```markdown
# Contract Evolution Process

Consolidated guide for adding/modifying contract formats.

## Adding a New Format
[Consolidate from lines 29-43 and 687-700]

## Modifying an Existing Format
[From lines 673-685]
```

**File 3: `packages/shared/src/contract/README.md`**
```markdown
# Contract Types & Parsers

TypeScript API reference for ActionFlows contract package.

## Available Exports
[Content from lines 702-738]

## Manual Testing
[Content from lines 646-671]
```

**File 4: `packages/app/docs/PARSER_PRIORITY.md`**
```markdown
# Parser Implementation Priority

[Content from lines 82-93 + implementation status checkboxes]
```

---

### Step 2: Add Missing Formats to ORCHESTRATOR.md

**Add to ORCHESTRATOR.md § Response Format Standard:**

```markdown
### 6. Learning Surface
[Already exists, lines 412-422]

### 7. Registry Update
[Already exists, lines 426-434]

### 8. Error Announcement (NEW)

## Error: {Error title}

**Step:** {step number} — {action/}
**Message:** {error message}
**Context:** {what was being attempted}

{Stack trace or additional details}

**Recovery options:**
- Retry step {N}
- Skip step {N}
- Cancel chain


### 9. INDEX.md Entry (NEW)

After chain completes, add to logs/INDEX.md:

| {YYYY-MM-DD} | {Description} | {Pattern} | {Outcome} |

Example:
| 2026-02-08 | Self-Evolving UI phases 1-4 | code×8 → review → commit | Success — 18 files, APPROVED 92% (1d50f9e) |


### 10. LEARNINGS.md Entry (NEW)

After learning surface approved:

### {Action Type}

#### {Issue Title}

**Context:** {when this happens}
**Problem:** {what goes wrong}
**Root Cause:** {why it fails}
**Solution:** {how to prevent}
**Date:** {YYYY-MM-DD}
**Source:** {action/} in {chain description}
```

---

### Step 3: Update agent-standards/instructions.md

**Expand lines 48-67:**

```markdown
### 12. Contract Compliance (for output-producing actions)

If your action produces structured output consumed by the dashboard:

- **Read the format specification** in `.claude/actionflows/CONTRACT.md`
- **Follow the exact markdown structure** defined for your action type
- **Include all required fields** (missing fields cause harmony violations)
- **Backend validates your output** using contract-defined parsers
- **Harmony detector flags violations** (logged and broadcast to dashboard)

**Contract-defined actions:**
- review/ → Review Report Structure (CONTRACT.md § Format 5.1)
- analyze/ → Analysis Report Structure (CONTRACT.md § Format 5.2)
- brainstorm/ → Brainstorm Session Transcript (CONTRACT.md § Format 5.3)

**Not contract-defined:** Agent learnings, internal notes, working files. Only final deliverables consumed by dashboard.

**Validation:** Run `pnpm run harmony:check` to validate output against contract.
```

---

### Step 4: Add Contract References to Agent Files

**review/agent.md:**
Add near top:
```markdown
## Output Format

**CRITICAL:** Your review report MUST follow the structure defined in `.claude/actionflows/CONTRACT.md` § Format 5.1.

The dashboard parses your output using this specification. Missing fields cause harmony violations.

Required sections: Verdict, Score, Summary, Findings table, Fixes Applied (if review-and-fix), Flags for Human
```

**analyze/agent.md:**
```markdown
## Output Format

**CRITICAL:** Your analysis report MUST follow the structure defined in `.claude/actionflows/CONTRACT.md` § Format 5.2.

Required sections: Title, Aspect, Scope, Date, Agent, numbered sections, Recommendations
```

**brainstorm/agent.md:**
```markdown
## Output Format

Your transcript should follow `.claude/actionflows/CONTRACT.md` § Format 5.3 (recommended, not enforced).

Sections: Idea, Classification, Initial Context, Transcript, Key Insights, Issues & Risks, Next Steps, Open Questions, Metadata
```

---

### Step 5: Restructure CONTRACT.md (Final Form)

**New CONTRACT.md structure (lean type spec):**

```markdown
# ActionFlows Orchestrator Output Contract

**Version:** 1.0
**Last Updated:** 2026-02-08
**TypeScript Definitions:** `packages/shared/src/contract/`

---

## Philosophy & Evolution

**Harmony System:** See `.claude/actionflows/docs/HARMONY_SYSTEM.md`
**Evolution Process:** See `.claude/actionflows/docs/CONTRACT_EVOLUTION.md`
**Code API Reference:** See `packages/shared/src/contract/README.md`

**Golden Rule:** If the dashboard PARSES it → contract-defined (sacred). If the dashboard READS it → not contract-defined (evolve freely).

---

## Format Priority

See `packages/app/docs/PARSER_PRIORITY.md` for frontend implementation status.

---

## Orchestrator Output Formats

### Format 1.1: Chain Compilation Table (P0)
**TypeScript:** ChainCompilationParsed
**Parser:** parseChainCompilation(text: string)
**Pattern:** /^## Chain: (.+)$/m
**Example:** ORCHESTRATOR.md § Chain Compilation

**Required Fields:** Brief Title, Request, Source, Table (columns: #, Action, Model, Key Inputs, Waits For, Status), Execution, Numbered list

---

[Continue for all orchestrator formats 1.1-4.3, 6.1-6.2]
[Reference ORCHESTRATOR.md for examples]
[Type spec only, no duplicate markdown]

---

## Agent Output Formats

### Format 5.1: Review Report Structure (P1)
**Producer:** review/ action
**TypeScript:** ReviewReportParsed
**Parser:** parseReviewReport(text: string)
**Referenced By:** agent-standards § Contract Compliance, review/agent.md

**Required Structure:**
```markdown
# Review Report: {scope}

## Verdict: {APPROVED | NEEDS_CHANGES}
## Score: {X}%

## Summary
{2-3 sentence overview}

## Findings
| # | File | Line | Severity | Description | Suggestion |
|---|------|------|----------|-------------|------------|

## Fixes Applied (if mode = review-and-fix)
| File | Fix |

## Flags for Human
| Issue | Why Human Needed |
```

**Field Descriptions:**
- Verdict: Enum (APPROVED | NEEDS_CHANGES)
- Score: Integer 0-100
- Summary: 2-3 sentences
- Findings: Table with 6 columns (required, can be empty)
- Severity: Enum (critical | high | medium | low)

**Dashboard Usage:** ReviewReportViewer, FindingsTable, VerdictBanner components

---

### Format 5.2: Analysis Report Structure (P3)
[Full specification for analyze/ output]

---

### Format 5.3: Brainstorm Session Transcript (P5)
[Full specification for brainstorm/ output]

---

## Validation

Run contract validation:
```bash
pnpm run harmony:check
```

See `packages/shared/src/contract/README.md` for manual testing.

---

**End of Contract**
```

**Result:**
- **Original:** 742 lines
- **New:** ~350 lines (53% reduction)
- **Moved:** ~400 lines to docs/, code docs, ORCHESTRATOR.md

---

## Learnings

**Issue:** CONTRACT.md serves 4 distinct consumers with content that belongs in different locations
**Root Cause:** Single-file consolidation mixed orchestrator guide, agent specs, code docs, and philosophy
**Suggestion:** Dissolve into specialized files per consumer — orchestrator guide (ORCHESTRATOR.md), agent specs (CONTRACT.md lean), philosophy (docs/), code reference (packages/shared/.../README.md)

[FRESH EYE] The fact that ORCHESTRATOR.md already contains 9 out of 12 orchestrator format examples (75% duplication) suggests CONTRACT.md started as a spec but evolved into a teaching document. The duplication is a symptom of unclear separation between "what the orchestrator must do" (ORCHESTRATOR.md) and "what structure the output must have" (CONTRACT.md).

---

## Pre-Completion Validation

**Log Folder Checklist:**
- [x] Log folder exists: D:\ActionFlowsDashboard\.claude\actionflows\logs\analyze\contract-dissolution-inventory_2026-02-09-00-55-03\
- [x] Contains output file: output.md
- [x] File is non-empty: 29,000+ bytes
- [x] Folder path follows format: logs/analyze/contract-dissolution-inventory_{timestamp}/
- [x] Description is kebab-case: ✓

**Output Verification:**
- [x] Complete content map of CONTRACT.md (all 742 lines analyzed)
- [x] Each section categorized by consumer (Orchestrator, Agent, Code, Frontend, Already Duplicated)
- [x] Dissolution targets specified with exact file paths
- [x] Priority levels assigned (Critical, Nice-to-have, Dead)
- [x] Consumer matrix table included
- [x] 4-phase dissolution plan with implementation steps
- [x] Learnings section completed

---

**Analysis Complete**
Output written to: D:\ActionFlowsDashboard\.claude\actionflows\logs\analyze\contract-dissolution-inventory_2026-02-09-00-55-03\output.md
