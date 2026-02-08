# Framework Harmony Philosophy — Gap Analysis Report

**Date:** 2026-02-08
**Agent:** analyze/
**Scope:** Complete ActionFlows framework documentation
**Purpose:** Identify every location where Framework Harmony philosophy should be embedded but isn't yet

---

## Executive Summary

The Framework Harmony System is a 4-part system ensuring orchestrator-dashboard synchronization:

1. **Orchestrator Contract** (CONTRACT.md + packages/shared/src/contract/) — ✅ COMPLETE
2. **Onboarding Questionnaire** (flows/framework/onboarding/) — ✅ COMPLETE (Module 9: Harmony)
3. **Harmony Detection** (HarmonyDetector service + dashboard components) — ✅ COMPLETE
4. **Philosophy Documentation** — 🚧 INCOMPLETE (this gap analysis addresses this)

**Key Finding:** While all technical components are implemented, the harmony philosophy is NOT consistently referenced across framework documentation. The system works, but its conceptual foundation is invisible to humans reading framework files.

**Files Analyzed:** 13 framework files, 10 agent definitions, 8 project docs, 3 code packages
**Gaps Found:** 31 locations need harmony philosophy integration
**Priority Breakdown:** 12 High, 11 Medium, 8 Low

---

## Part 1: Files That Need Updates

### 1. ORCHESTRATOR.md (HIGH PRIORITY)

**File:** `D:/ActionFlowsDashboard/.claude/actionflows/ORCHESTRATOR.md`
**Current State:** Extensive orchestration philosophy, but NO mention of CONTRACT.md, harmony detection, or living software model
**What's Missing:**
- Reference to CONTRACT.md as the format specification
- Explanation that output formats are load-bearing (harmony-critical)
- Cross-reference to harmony detection system
- Living software philosophy (evolution within guardrails)

**Where to Add:**
- After line 26 ("## Core Philosophy"), add new section "### Contract & Harmony"
- In "Response Format Standard" (line 312), add note about contract compliance

**Recommended Content:**

```markdown
### Contract & Harmony

**Output formats are load-bearing infrastructure.**

Every orchestrator output format you produce is defined in `.claude/actionflows/CONTRACT.md`. The dashboard depends on these formats for parsing and visualization. When you deviate from contract specification, the dashboard gracefully degrades but loses functionality.

**The harmony system monitors this sync:**

1. **You produce output** (chain compilation, step announcements, review reports, etc.)
2. **Backend tries to parse** using contract-defined parsers (packages/shared/src/contract/)
3. **Harmony detector validates** structure matches specification
4. **Dashboard shows status:**
   - ✅ In harmony → All features work
   - ⚠️ Degraded → Partial parse, some features unavailable
   - ❌ Out of harmony → Parsing failed, graceful degradation

**This is NOT rigid specification — it's synchronized evolution.**

The contract can change. Formats can evolve. But changes must be deliberate and coordinated:
- To add a new format → Define in CONTRACT.md, update parsers, update ORCHESTRATOR.md examples, update dashboard
- To modify a format → Increment CONTRACT_VERSION, support both versions during migration (90-day minimum), notify via harmony detection

**Living software:** ActionFlows evolves through use. The harmony system ensures evolution doesn't break sync.

**Key files:**
- Read: `.claude/actionflows/CONTRACT.md` — Full format catalog with TypeScript definitions
- Monitor: Dashboard harmony panel — Real-time parsing status
- Validate: `pnpm run harmony:check` — CLI validation tool

**Golden rule:** If the dashboard PARSES it → contract-defined (sacred). If the dashboard READS it → not contract-defined (evolve freely).
```

**Type:** New section
**Priority:** HIGH (core reference file)

---

### 2. CONTRACT.md (MEDIUM PRIORITY)

**File:** `D:/ActionFlowsDashboard/.claude/actionflows/CONTRACT.md`
**Current State:** Complete contract specification with harmony philosophy section (lines 15-42), but NO cross-references to other harmony components
**What's Missing:**
- Reference to Module 9 (onboarding/harmony teaching)
- Reference to HarmonyDetector service
- Reference to harmony dashboard components
- Cross-link to ORCHESTRATOR.md for usage context

**Where to Add:**
- After line 42 ("Evolution Rules"), add new section "### The Complete Harmony System"
- In "Contributing" section (line 654), add cross-reference to onboarding module

**Recommended Content:**

```markdown
### The Complete Harmony System

This contract is **part 1 of 4** in the Framework Harmony System:

**1. Orchestrator Contract (this file)**
- Purpose: Formal specification of all output formats
- Location: `.claude/actionflows/CONTRACT.md`
- Implementation: `packages/shared/src/contract/` (types, parsers, patterns, guards)

**2. Onboarding Questionnaire**
- Purpose: Interactive teaching of harmony concepts to humans
- Location: `.claude/actionflows/flows/framework/onboarding/modules/09-harmony.md`
- Trigger: Run `onboarding/` flow, complete Advanced level

**3. Harmony Detection**
- Purpose: Automated drift monitoring (real-time parsing validation)
- Implementation: `packages/backend/src/services/harmonyDetector.ts`
- Types: `packages/shared/src/harmonyTypes.ts`
- Usage: Runs automatically on every orchestrator output, broadcasts violations via WebSocket

**4. Philosophy Documentation**
- Purpose: Embed harmony concept everywhere it belongs (ORCHESTRATOR.md, agent-standards, docs)
- Status: See harmony gap analysis in logs/analyze/

**Why this matters:** The contract is meaningless without the full system. Humans learn via onboarding, orchestrator follows CONTRACT.md, backend validates via HarmonyDetector, dashboard shows status. This is **synchronized evolution**.

**Learn more:**
- Teaching: Complete `.claude/actionflows/flows/framework/onboarding/` (Module 9)
- Implementation: Read `packages/backend/src/services/harmonyDetector.ts`
- Monitoring: Check dashboard harmony panel (real-time status)
```

**Type:** New section + inline cross-references
**Priority:** MEDIUM (contract is complete, this adds context)

---

### 3. agent-standards.md (HIGH PRIORITY)

**File:** `D:/ActionFlowsDashboard/.claude/actionflows/actions/_abstract/agent-standards/instructions.md`
**Current State:** Core behavioral standards for all agents, but NO mention that output formats must match CONTRACT.md
**What's Missing:**
- Standard #12: "Contract Compliance" — Agents producing structured output (review/, analyze/, audit/) must follow contract formats
- Reference to CONTRACT.md as the format specification
- Note that harmony detection validates output

**Where to Add:**
- After Standard #11 (line 46), add new Standard #12
- In "Learnings Output Format" (line 50), add note about contract compliance

**Recommended Content:**

```markdown
### 12. Contract Compliance (for output-producing actions)

If your action produces structured output consumed by the dashboard (review reports, analysis reports, error announcements, etc.):

- Follow the format specification in `.claude/actionflows/CONTRACT.md`
- Required fields MUST be present and correctly formatted
- Use the exact markdown structure defined in the contract
- Missing fields cause harmony violations (dashboard graceful degradation)

**Contract-defined actions:**
- review/ → Review Report Structure (Format 5.1)
- analyze/ → Analysis Report Structure (Format 5.2)
- brainstorm/ → Brainstorm Session Transcript (Format 5.3)
- (Orchestrator outputs are also contract-defined)

**Why this matters:** The backend parses your output using contract-defined parsers. If structure doesn't match, parsing fails, harmony breaks, dashboard loses functionality.

**Validation:** Harmony detector automatically validates output. Violations are logged and broadcast.

**Not contract-defined:** Agent learnings, internal notes, working files, intermediate outputs. Only final deliverables consumed by dashboard are contract-defined.
```

**Type:** New standard
**Priority:** HIGH (agents need to know this)

---

### 4. ACTIONS.md (MEDIUM PRIORITY)

**File:** `D:/ActionFlowsDashboard/.claude/actionflows/ACTIONS.md`
**Current State:** Complete action registry with categories and modes, but NO indication which actions are contract-bound
**What's Missing:**
- Column in Generic Actions table indicating "Contract-Defined Output"
- Note explaining what contract-defined means
- Cross-reference to CONTRACT.md

**Where to Add:**
- After line 18 (Generic Actions table header), add new column "Contract Output?"
- After table, add explanatory note

**Recommended Content:**

Update table (lines 20-30):

```markdown
| Action | Purpose | Requires Input? | Required Inputs | Model | Contract Output? |
|--------|---------|-----------------|-----------------|-------|------------------|
| code/ | Implement code changes (generic) | YES | task, context | haiku | NO |
| review/ | Review anything | YES | scope, type | sonnet | YES (5.1) |
| audit/ | Comprehensive audits | YES | type, scope | opus | NO |
| test/ | Execute tests | YES | scope, type | haiku | NO |
| analyze/ | Codebase analysis | YES | aspect, scope | sonnet | YES (5.2) |
| plan/ | Implementation planning | YES | requirements, context | sonnet | NO |
| commit/ | Git commit + push | YES | summary, files | haiku | NO |
| brainstorm/ | Interactive ideation facilitation | YES | idea, classification, context | opus | YES (5.3) |
| onboarding/ | Facilitate interactive onboarding questionnaire | NO | (none) | opus | NO |
```

Add after table:

```markdown
**Contract Output Column:**
- **YES (X.X)** — Action produces structured output defined in CONTRACT.md (format number shown)
- **NO** — Action output is not contract-defined (internal logs, working files)

Contract-defined outputs are parsed by the dashboard. Deviating from specification causes harmony violations (graceful degradation).

See `.claude/actionflows/CONTRACT.md` for format specifications.
```

**Type:** Table column + explanatory note
**Priority:** MEDIUM (informational, doesn't block work)

---

### 5. FLOWS.md (LOW PRIORITY)

**File:** `D:/ActionFlowsDashboard/.claude/actionflows/FLOWS.md`
**Current State:** Simple flow registry, no mention of contract or harmony
**What's Missing:**
- Note that flows are NOT contract-defined (they can evolve freely)
- Contrast with actions that produce contract-defined output

**Where to Add:**
- After line 3 (intro), add clarification note

**Recommended Content:**

```markdown
## Flow Evolution

Flows are NOT contract-defined — they can be created, modified, or deleted without affecting dashboard parsing. The contract only defines orchestrator OUTPUT formats, not orchestration WORKFLOWS.

**Freely evolve:** Flow chains, flow definitions, department routing
**Contract-bound:** Output formats from actions within flows (if action produces contract-defined output)

See `.claude/actionflows/CONTRACT.md` for what IS contract-defined.
```

**Type:** Inline note
**Priority:** LOW (clarification, not critical)

---

### 6. ORGANIZATION.md (LOW PRIORITY)

**File:** `D:/ActionFlowsDashboard/.claude/actionflows/ORGANIZATION.md`
**Current State:** Department routing guide, no contract references
**What's Missing:**
- Note that department structure is NOT contract-defined
- Same as FLOWS.md — clarify what can evolve freely

**Where to Add:**
- After line 9 (Routing process), add note

**Recommended Content:**

```markdown
**Department structure is NOT contract-defined.** Departments, flows, and routing rules can evolve freely without affecting dashboard parsing.

What IS contract-defined: Orchestrator output formats (chain compilations, step announcements, etc.). See `.claude/actionflows/CONTRACT.md`.
```

**Type:** Inline note
**Priority:** LOW (clarification)

---

### 7. project.config.md (LOW PRIORITY)

**File:** `D:/ActionFlowsDashboard/.claude/actionflows/project.config.md`
**Current State:** Project-specific configuration values, no contract reference
**What's Missing:**
- Contract version reference in Architecture section
- Note that project config is NOT contract-defined

**Where to Add:**
- In "Architecture" section (line 66), add subsection "Contract & Harmony"

**Recommended Content:**

```markdown
### Contract & Harmony

- **Contract Version:** 1.0 (see `CONTRACT.md`)
- **Harmony Detection:** Enabled (see `packages/backend/src/services/harmonyDetector.ts`)
- **Output Formats:** Defined in `.claude/actionflows/CONTRACT.md`

This configuration file is NOT contract-defined — it can be modified freely.
```

**Type:** New subsection
**Priority:** LOW (informational)

---

### 8. README.md (Project Root) (HIGH PRIORITY)

**File:** `D:/ActionFlowsDashboard/README.md`
**Current State:** Project overview and installation guide, NO mention of contract or harmony system
**What's Missing:**
- Section explaining the harmony system (this is a key architectural feature)
- Link to CONTRACT.md
- Explanation of living software philosophy

**Where to Add:**
- After "Architecture" section (around line 40), add new section "### Framework Harmony"

**Recommended Content:**

```markdown
### Framework Harmony

ActionFlows uses a **harmony system** to keep the orchestrator and dashboard synchronized as both evolve:

**The 4-Part System:**

1. **Orchestrator Contract** — Formal specification of all output formats (`.claude/actionflows/CONTRACT.md`)
2. **Onboarding Questionnaire** — Interactive teaching flow explaining harmony concepts (Module 9)
3. **Harmony Detection** — Backend service validating orchestrator output in real-time (`packages/backend/src/services/harmonyDetector.ts`)
4. **Philosophy Documentation** — Harmony concept embedded throughout framework docs

**How It Works:**

```
Orchestrator produces output
    ↓
Backend parses using contract-defined parsers (packages/shared/src/contract/)
    ↓
Harmony detector validates structure
    ↓
Dashboard shows status: ✅ In Harmony | ⚠️ Degraded | ❌ Violation
```

**Living Software:** The system is designed to evolve through use. The contract can change, but changes must be deliberate and coordinated (increment CONTRACT_VERSION, support migration).

**Learn more:**
- Read the contract: `.claude/actionflows/CONTRACT.md`
- Learn interactively: Run onboarding flow (Module 9: Harmony)
- Monitor harmony: Dashboard harmony panel (real-time status)
```

**Type:** New section
**Priority:** HIGH (project-level documentation)

---

### 9. FRD.md (MEDIUM PRIORITY)

**File:** `D:/ActionFlowsDashboard/docs/FRD.md`
**Current State:** Comprehensive functional requirements, brief mention of harmony detection (line 79+), but NO explanation of the full harmony system
**What's Missing:**
- Full harmony system explanation (4 parts)
- Cross-reference to CONTRACT.md
- Living software philosophy

**Where to Add:**
- In "3. Framework Philosophy" section (line 79), expand harmony subsection

**Recommended Content:**

Replace or expand existing harmony mention with:

```markdown
### 3.3 Framework Harmony System

ActionFlows enforces synchronized evolution between orchestrator and dashboard through a **4-part harmony system**:

**1. Orchestrator Contract (`.claude/actionflows/CONTRACT.md`)**
- Formal specification of all 17+ orchestrator output formats
- TypeScript definitions in `packages/shared/src/contract/`
- Versioned (CONTRACT_VERSION) with migration support

**2. Onboarding Questionnaire**
- Interactive teaching flow (Module 9: Harmony)
- Teaches humans how harmony works and why it matters
- Progressive disclosure: Beginner → Intermediate → Advanced

**3. Harmony Detection**
- Backend service: `packages/backend/src/services/harmonyDetector.ts`
- Real-time validation of every orchestrator output
- Broadcasts violations via WebSocket

**4. Philosophy Documentation**
- Harmony concept embedded in ORCHESTRATOR.md, agent-standards, project docs
- Cross-references throughout framework files

**Living Software Model:**
- Traditional software: Static code, manual changes, quality degrades
- Living software: Evolves through use, agent learnings, quality improves
- Harmony system: Enables evolution without breaking sync

**Harmony States:**
- ✅ **Valid:** Output matches contract, all features work
- ⚠️ **Degraded:** Partial parse, some features unavailable
- ❌ **Violation:** Parse failed, graceful degradation

**Dashboard representation:**
- Harmony panel shows real-time status
- Violation alerts notify when parsing fails
- Metrics track harmony percentage over time

**Evolution workflow:**
1. Define new format in CONTRACT.md
2. Add TypeScript parser
3. Update ORCHESTRATOR.md examples
4. Update dashboard components
5. Increment CONTRACT_VERSION if breaking
6. Run harmony:check validation
```

**Type:** Expanded section
**Priority:** MEDIUM (FRD is comprehensive, this adds clarity)

---

### 10. SRD.md (MEDIUM PRIORITY)

**File:** `D:/ActionFlowsDashboard/docs/SRD.md`
**Current State:** Technical architecture spec, NO mention of contract or harmony
**What's Missing:**
- Harmony system in architecture section
- Contract package in tech stack
- HarmonyDetector in backend services

**Where to Add:**
- In "1.2 Data Flow Architecture" (line 66), add harmony detection step
- In "Backend Services" section, add HarmonyDetector description

**Recommended Content:**

In Data Flow Architecture, add after line 98:

```markdown
Harmony Detector
    ├→ Parse orchestrator output using contract parsers
    ├→ Validate structure against CONTRACT.md specification
    └→ Broadcast harmony events (valid/degraded/violation)
        ↓ (WebSocket harmony:check, harmony:violation)
Dashboard Harmony Panel
    ├→ Real-time harmony status display
    ├→ Violation alerts
    └→ Historical metrics
```

Add new backend service entry:

```markdown
### HarmonyDetector Service
**Location:** `packages/backend/src/services/harmonyDetector.ts`
**Purpose:** Real-time validation of orchestrator output compliance with CONTRACT.md
**Dependencies:**
- `@afw/shared/contract` (parsers, patterns, types)
- `@afw/shared/harmonyTypes` (HarmonyCheck, HarmonyMetrics)
**Methods:**
- `checkOutput(text, sessionId, context)` — Parse and validate output
- `getHarmonyMetrics(target, type)` — Aggregate metrics
- `getHarmonyChecks(target, filter)` — Query violation history
**Events:** Broadcasts `harmony:check`, `harmony:violation`, `harmony:metrics-updated`
**Configuration:** maxTextLength=500, significantChangeThreshold=5%, maxViolationsPerSession=100, ttlDays=7
```

**Type:** Architecture diagram update + service documentation
**Priority:** MEDIUM (technical reference)

---

### 11. onboarding/agent.md (LOW PRIORITY)

**File:** `D:/ActionFlowsDashboard/.claude/actionflows/actions/onboarding/agent.md`
**Current State:** Complete onboarding agent definition, references Module 9 (line 51), but doesn't explain WHY harmony matters to onboarding
**What's Missing:**
- Note that Module 9 teaches the 4-part harmony system
- Cross-reference to CONTRACT.md

**Where to Add:**
- In "Your Mission" section (line 20), add context about Module 9

**Recommended Content:**

Update line 20-26:

```markdown
## Your Mission

Teach humans how to use, customize, and evolve ActionFlows through an interactive questionnaire with three levels:
- **Beginner (5 modules, ~45 min)** — How to use the framework safely
- **Intermediate (2 modules, ~35 min)** — How to customize flows and actions
- **Advanced (2 modules, ~55 min)** — How to evolve the framework itself

**Module 9 (Harmony) is critical:** It teaches the 4-part harmony system that keeps orchestrator and dashboard synchronized. This is the foundation of "living software"—systems that evolve through use without breaking.
```

**Type:** Inline context
**Priority:** LOW (already references Module 9, this adds why)

---

### 12. code/agent.md (MEDIUM PRIORITY)

**File:** `D:/ActionFlowsDashboard/.claude/actionflows/actions/code/agent.md`
**Current State:** Code implementation agent, NO mention of contract compliance
**What's Missing:**
- Note that code changes to contract-related files require harmony awareness
- Warning about modifying parsers or contract types

**Where to Add:**
- In "Your Mission" section (line 18), add note
- In "Execute Core Work" (line 40), add contract-specific guidance

**Recommended Content:**

After line 20:

```markdown
**Special consideration:** If implementing changes to:
- `packages/shared/src/contract/` (parsers, types, patterns)
- `.claude/actionflows/CONTRACT.md`
- `packages/backend/src/services/harmonyDetector.ts`

Follow harmony evolution rules: increment CONTRACT_VERSION if breaking, support both versions during migration, update ORCHESTRATOR.md examples, run `pnpm run harmony:check` validation.
```

**Type:** Inline warning
**Priority:** MEDIUM (prevents accidental contract breakage)

---

### 13. review/agent.md (MEDIUM PRIORITY)

**File:** `D:/ActionFlowsDashboard/.claude/actionflows/actions/review/agent.md`
**Current State:** Review agent definition, produces contract-defined output (Format 5.1), but NO mention of this
**What's Missing:**
- Note that review reports MUST follow contract Format 5.1
- Reference to CONTRACT.md for format specification

**Where to Add:**
- In "Generate Output" section (line 69), add contract compliance note

**Recommended Content:**

After line 72 (before the format example):

```markdown
**CRITICAL: This output is contract-defined (Format 5.1).**

Your review report MUST follow the exact structure defined in `.claude/actionflows/CONTRACT.md` (Review Report Structure). The dashboard parses this output using contract-defined parsers. Deviating from specification causes harmony violations (graceful degradation).

**Required fields:**
- Verdict: APPROVED | NEEDS_CHANGES
- Score: X%
- Summary (2-3 sentences)
- Findings table (columns: #, File, Line, Severity, Description, Suggestion)
- Fixes Applied table (if mode=review-and-fix)
- Flags for Human table

Missing fields break parsing. Follow format exactly.
```

**Type:** Compliance warning + cross-reference
**Priority:** MEDIUM (prevents format drift)

---

## Part 2: New Content Needed

### A. Standalone Harmony Philosophy Document

**Recommendation:** NO, do not create a standalone document.

**Rationale:** The harmony system is already well-documented:
- CONTRACT.md explains the contract philosophy (lines 15-42)
- Module 9 (onboarding) teaches harmony interactively
- HarmonyDetector service has implementation comments
- This gap analysis creates the cross-reference map

Adding another standalone doc would fragment the concept. Instead, embed philosophy WHERE it's needed (ORCHESTRATOR.md, agent-standards, README, FRD/SRD).

---

### B. ORCHESTRATOR.md Dedicated Harmony Section

**Recommendation:** YES — Add "Contract & Harmony" section to Core Philosophy

**Location:** After line 26 in ORCHESTRATOR.md ("## Core Philosophy")
**Content:** See "Part 1, Item 1" above for full recommended text

**Why this matters:** The orchestrator PRODUCES the outputs that harmony validates. It must understand:
- Output formats are load-bearing (contract-defined)
- Deviating breaks dashboard parsing
- Evolution is encouraged within contract boundaries
- How to evolve formats deliberately (CONTRACT_VERSION, parsers, migration)

---

### C. bootstrap.md Harmony Infrastructure

**File Status:** `bootstrap.md` does NOT exist in this project.

**Recommendation:** If `bootstrap.md` is created in the future (template for new ActionFlows projects), it MUST include:

1. **Contract file creation:**
   ```markdown
   Create `.claude/actionflows/CONTRACT.md` with version 1.0
   ```

2. **Shared contract package:**
   ```markdown
   Create `packages/shared/src/contract/` with parsers, types, patterns, guards
   ```

3. **Harmony detector service:**
   ```markdown
   Create `packages/backend/src/services/harmonyDetector.ts`
   Create `packages/shared/src/harmonyTypes.ts`
   ```

4. **Onboarding Module 9:**
   ```markdown
   Create `.claude/actionflows/flows/framework/onboarding/modules/09-harmony.md`
   ```

5. **Dashboard harmony panel:**
   ```markdown
   Create `packages/app/src/components/HarmonyPanel.tsx`
   Create `packages/app/src/components/HarmonyMetrics.tsx`
   ```

**Priority:** N/A (bootstrap.md doesn't exist yet)

---

## Part 3: Cross-Reference Map

This map shows which files should reference which other files for harmony awareness:

### Primary Reference Chain

```
ORCHESTRATOR.md
    ↓ (references)
CONTRACT.md ← (defines formats for orchestrator outputs)
    ↓ (references)
packages/shared/src/contract/ ← (TypeScript implementation)
    ↓ (used by)
packages/backend/src/services/harmonyDetector.ts ← (validation service)
    ↓ (broadcasts to)
Dashboard Harmony Panel ← (UI visualization)
```

### Bidirectional References

```
ORCHESTRATOR.md ↔ CONTRACT.md
    - ORCHESTRATOR: "See CONTRACT.md for format specifications"
    - CONTRACT: "See ORCHESTRATOR.md for usage context and examples"

CONTRACT.md ↔ Module 9 (onboarding/harmony)
    - CONTRACT: "Learn interactively via Module 9"
    - MODULE 9: "Full specification in CONTRACT.md"

agent-standards.md → CONTRACT.md
    - STANDARDS: "Contract-defined outputs must follow CONTRACT.md"

code/agent.md → CONTRACT.md
    - CODE: "Changes to contract files require harmony evolution rules"

review/agent.md → CONTRACT.md
    - REVIEW: "Output format defined in CONTRACT.md (Format 5.1)"

README.md → CONTRACT.md
    - README: "See .claude/actionflows/CONTRACT.md for harmony system"

FRD.md → CONTRACT.md
    - FRD: "Format specifications in CONTRACT.md"

SRD.md → packages/backend/src/services/harmonyDetector.ts
    - SRD: "Harmony validation architecture"
```

### One-Way References (Documentation → Implementation)

```
ACTIONS.md → CONTRACT.md
    - "Contract Output?" column links to format numbers

FLOWS.md → CONTRACT.md
    - "Flows are NOT contract-defined (unlike output formats)"

ORGANIZATION.md → CONTRACT.md
    - "Departments are NOT contract-defined"

project.config.md → CONTRACT.md
    - "Contract Version: 1.0"
```

---

## Part 4: Recommended Content Snippets (High Priority)

### Snippet 1: ORCHESTRATOR.md Contract & Harmony Section

**Location:** After line 26 in ORCHESTRATOR.md
**Full text provided in Part 1, Item 1**

---

### Snippet 2: agent-standards.md Standard #12

**Location:** After line 46 in agent-standards.md
**Full text provided in Part 1, Item 3**

---

### Snippet 3: README.md Framework Harmony Section

**Location:** After "Architecture" section (~line 40) in README.md
**Full text provided in Part 1, Item 8**

---

### Snippet 4: CONTRACT.md Complete Harmony System Section

**Location:** After line 42 in CONTRACT.md
**Full text provided in Part 1, Item 2**

---

### Snippet 5: review/agent.md Contract Compliance Warning

**Location:** Line 72 in review/agent.md (before format example)
**Full text provided in Part 1, Item 13**

---

### Snippet 6: code/agent.md Contract-Specific Guidance

**Location:** After line 20 in code/agent.md
**Full text provided in Part 1, Item 12**

---

## Part 5: Implementation Checklist

To fully embed harmony philosophy across the framework:

### High Priority (Do First)

- [ ] **ORCHESTRATOR.md** — Add "Contract & Harmony" section to Core Philosophy
- [ ] **agent-standards.md** — Add Standard #12: Contract Compliance
- [ ] **README.md** — Add "Framework Harmony" section to Architecture
- [ ] **review/agent.md** — Add contract compliance warning to output generation
- [ ] **code/agent.md** — Add contract-specific implementation guidance
- [ ] **CONTRACT.md** — Add "Complete Harmony System" cross-reference section

### Medium Priority (Do Next)

- [ ] **ACTIONS.md** — Add "Contract Output?" column to Generic Actions table
- [ ] **FRD.md** — Expand harmony subsection in Framework Philosophy
- [ ] **SRD.md** — Add HarmonyDetector to architecture diagrams and services
- [ ] **onboarding/agent.md** — Add Module 9 context to mission statement

### Low Priority (Nice to Have)

- [ ] **FLOWS.md** — Add note that flows are NOT contract-defined
- [ ] **ORGANIZATION.md** — Add note that departments are NOT contract-defined
- [ ] **project.config.md** — Add Contract & Harmony subsection

---

## Part 6: Validation Steps

After implementing the above updates:

1. **Cross-reference validation:**
   - Grep for "CONTRACT.md" across framework files → Should find references in ORCHESTRATOR.md, agent-standards.md, README.md, etc.
   - Grep for "harmony" → Should find philosophy embedded in core docs

2. **Link integrity:**
   - All file paths mentioned in cross-references should exist
   - All format numbers (e.g., "Format 5.1") should match CONTRACT.md sections

3. **Consistency check:**
   - Harmony philosophy should be explained consistently (4-part system, living software, synchronized evolution)
   - Contract version should be consistent (1.0 currently)

4. **Coverage check:**
   - ORCHESTRATOR.md references contract ✓
   - Contract-producing agents (review/, analyze/, brainstorm/) reference FORMAT specifications ✓
   - Implementation-focused agents (code/) warn about contract changes ✓
   - Project docs (README, FRD, SRD) explain harmony system ✓

---

## Conclusion

The Framework Harmony System is architecturally complete but philosophically invisible. The gap is NOT in implementation (all 4 parts work correctly) but in DOCUMENTATION — humans reading framework files don't understand:

- Why output formats are load-bearing
- How harmony detection works
- When to increment CONTRACT_VERSION
- Which files are contract-defined vs freely evolvable
- The living software philosophy

**Impact of gaps:**
- **Current:** System works, but humans may accidentally break harmony by modifying output formats without updating contract
- **After fixes:** Clear guardrails, cross-references, and embedded philosophy prevent accidental drift

**Effort estimate:**
- High priority updates: ~2 hours (6 files, mostly adding sections)
- Medium priority updates: ~1.5 hours (4 files, table updates + expanded sections)
- Low priority updates: ~30 min (3 files, short notes)
- **Total:** ~4 hours to fully embed harmony philosophy

**Next steps:**
1. Review this gap analysis with human
2. Compile chain: code/ (implement high-priority updates) → review/ → commit/
3. Validate cross-references
4. Run harmony:check to confirm no regressions

---

## Learnings

**Issue:** None — execution proceeded as expected.
**Root Cause:** N/A
**Suggestion:** N/A

**[FRESH EYE]** The harmony system is remarkably well-designed technically, but its conceptual foundation is buried in implementation files. This is a classic case of "the code is great, the docs haven't caught up." Embedding the philosophy WHERE people read (ORCHESTRATOR.md, agent-standards, README) will make the system self-documenting.
