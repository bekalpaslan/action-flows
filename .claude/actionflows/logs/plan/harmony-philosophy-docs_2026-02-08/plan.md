# Framework Harmony Philosophy Documentation Plan

**Date:** 2026-02-08
**Agent:** plan/
**Purpose:** Design exact content updates to embed harmony philosophy across framework documentation

---

## Executive Summary

This plan provides the EXACT content to add to 10 files to complete the Framework Harmony System documentation. All technical components (Contract, Onboarding, Detection, Implementation) are complete. This addresses the 4th pillar: Philosophy Documentation.

**Gap:** Harmony philosophy is architecturally complete but conceptually invisible in documentation.
**Solution:** Embed cross-references, explanations, and warnings in 10 key files.
**Effort:** ~4 hours total (2 hours high priority, 1.5 hours medium priority, 30 min low priority)

---

## Priority High: Must Do (6 Files)

### 1. ORCHESTRATOR.md — Contract & Harmony Section

**File:** `D:/ActionFlowsDashboard/.claude/actionflows/ORCHESTRATOR.md`
**Location:** After line 26 ("## Core Philosophy"), insert new section
**Why:** Orchestrator produces the outputs that harmony validates. Must understand formats are load-bearing.

**EXACT CONTENT TO ADD:**

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

---

### 2. agent-standards/instructions.md — Standard #12: Contract Compliance

**File:** `D:/ActionFlowsDashboard/.claude/actionflows/actions/_abstract/agent-standards/instructions.md`
**Location:** After existing standards (around line 46), add new Standard #12
**Why:** Agents that produce structured output (review/, analyze/) must know their output is contract-bound.

**EXACT CONTENT TO ADD:**

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

---

### 3. CONTRACT.md — Complete Harmony System Section

**File:** `D:/ActionFlowsDashboard/.claude/actionflows/CONTRACT.md`
**Location:** After line 42 ("Evolution Rules"), insert new section
**Why:** CONTRACT.md is the source of truth but doesn't explain how it fits into the larger harmony system.

**EXACT CONTENT TO ADD:**

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

---

### 4. README.md — Framework Harmony Section

**File:** `D:/ActionFlowsDashboard/README.md`
**Location:** After "Architecture" section (around line 40), insert new section
**Why:** Project-level documentation must introduce harmony as a key architectural feature.

**EXACT CONTENT TO ADD:**

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

---

### 5. review/agent.md — Contract Compliance Warning

**File:** `D:/ActionFlowsDashboard/.claude/actionflows/actions/review/agent.md`
**Location:** After line 72, before the format example in "### 5. Generate Output"
**Why:** review/ produces contract-defined output (Format 5.1). Agent must know to follow exact structure.

**EXACT CONTENT TO ADD:**

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

---

### 6. code/agent.md — Contract Change Guidance

**File:** `D:/ActionFlowsDashboard/.claude/actionflows/actions/code/agent.md`
**Location:** After line 20, in "Your Mission" section
**Why:** code/ agent may modify contract-related files. Must know evolution rules.

**EXACT CONTENT TO ADD:**

```markdown
**Special consideration:** If implementing changes to:
- `packages/shared/src/contract/` (parsers, types, patterns)
- `.claude/actionflows/CONTRACT.md`
- `packages/backend/src/services/harmonyDetector.ts`

Follow harmony evolution rules: increment CONTRACT_VERSION if breaking, support both versions during migration, update ORCHESTRATOR.md examples, run `pnpm run harmony:check` validation.
```

---

## Priority Medium: Should Do (4 Files)

### 7. ACTIONS.md — Contract Output Column

**File:** `D:/ActionFlowsDashboard/.claude/actionflows/ACTIONS.md`
**Location:** Update table at lines 20-30, add explanatory note after table
**Why:** Action registry should indicate which actions produce contract-defined output.

**EXACT CONTENT TO ADD:**

**Update table header (line 20):**
```markdown
| Action | Purpose | Requires Input? | Required Inputs | Model | Contract Output? |
```

**Update table rows (lines 21-30):**
```markdown
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

**Add after table (after line 30):**
```markdown
**Contract Output Column:**
- **YES (X.X)** — Action produces structured output defined in CONTRACT.md (format number shown)
- **NO** — Action output is not contract-defined (internal logs, working files)

Contract-defined outputs are parsed by the dashboard. Deviating from specification causes harmony violations (graceful degradation).

See `.claude/actionflows/CONTRACT.md` for format specifications.
```

---

### 8. FRD.md — Expand Harmony Philosophy Section

**File:** `D:/ActionFlowsDashboard/docs/FRD.md`
**Location:** In "3. Framework Philosophy" section (around line 79), expand existing harmony mention
**Why:** FRD is comprehensive functional requirements. Harmony is a key architectural feature.

**EXACT CONTENT TO REPLACE/EXPAND:**

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

---

### 9. SRD.md — HarmonyDetector Architecture

**File:** `D:/ActionFlowsDashboard/docs/SRD.md`
**Location:** In "1.2 Data Flow Architecture" section (around line 98), add harmony detection step
**Why:** SRD is technical architecture spec. HarmonyDetector is a backend service.

**EXACT CONTENT TO ADD:**

**In Data Flow Architecture (after line 98):**

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

**Add new backend service entry (in backend services section):**

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

---

### 10. onboarding/agent.md — Module 9 Context

**File:** `D:/ActionFlowsDashboard/.claude/actionflows/actions/onboarding/agent.md`
**Location:** In "Your Mission" section (line 20-26), update to add Module 9 context
**Why:** Onboarding agent should explain WHY Module 9 (Harmony) is critical.

**EXACT CONTENT TO REPLACE:**

Replace lines 20-26 with:

```markdown
## Your Mission

Teach humans how to use, customize, and evolve ActionFlows through an interactive questionnaire with three levels:
- **Beginner (5 modules, ~45 min)** — How to use the framework safely
- **Intermediate (2 modules, ~35 min)** — How to customize flows and actions
- **Advanced (2 modules, ~55 min)** — How to evolve the framework itself

**Module 9 (Harmony) is critical:** It teaches the 4-part harmony system that keeps orchestrator and dashboard synchronized. This is the foundation of "living software"—systems that evolve through use without breaking.
```

---

## Priority Low: Nice to Have (Not Included)

These were in the original gap analysis but are clarification notes, not critical:

- **FLOWS.md** — Note that flows are NOT contract-defined
- **ORGANIZATION.md** — Note that departments are NOT contract-defined
- **project.config.md** — Add Contract & Harmony subsection
- **bootstrap.md** — Harmony infrastructure for new projects (file doesn't exist yet)

These can be deferred or added later if needed.

---

## Implementation Instructions for code/ Agent

### File Modification Pattern

For each file above:

1. **Read the file first** to confirm line numbers and structure
2. **Use Edit tool** to insert content at specified location
3. **Preserve existing indentation** and markdown formatting
4. **Do NOT modify** any other sections of the file
5. **Verify** file still parses correctly after edit

### Order of Operations

**Sequential (dependencies):**
1. CONTRACT.md (defines the system)
2. ORCHESTRATOR.md (references CONTRACT.md)
3. agent-standards (references CONTRACT.md)
4. review/agent.md and code/agent.md (reference contract compliance)

**Parallel (no dependencies):**
5-10. README.md, FRD.md, SRD.md, ACTIONS.md, onboarding/agent.md (all independent)

### Validation

After all edits:
1. Grep for "CONTRACT.md" across framework files → Should find references in 10+ files
2. Grep for "harmony" → Should find philosophy in core docs
3. Check all file paths mentioned exist
4. Check all format numbers (5.1, 5.2, 5.3) match CONTRACT.md
5. Run `pnpm run harmony:check` (if command exists) to validate no regressions

---

## Expected Outcomes

**Before:** Harmony system works but philosophy is invisible in docs
**After:**
- Orchestrator knows output formats are load-bearing (ORCHESTRATOR.md)
- Agents know which outputs are contract-defined (agent-standards, review/agent.md, code/agent.md)
- Humans understand the 4-part harmony system (README.md, FRD.md, CONTRACT.md)
- Technical documentation includes harmony architecture (SRD.md)
- Action registry shows which actions produce contract-defined output (ACTIONS.md)
- Onboarding explains why harmony matters (onboarding/agent.md)

**Cross-reference map:**
```
ORCHESTRATOR.md → CONTRACT.md (format specifications)
CONTRACT.md → Module 9, HarmonyDetector (system components)
agent-standards.md → CONTRACT.md (compliance rules)
review/agent.md → CONTRACT.md Format 5.1 (output structure)
code/agent.md → CONTRACT.md (evolution rules)
README.md → CONTRACT.md (system overview)
FRD.md → CONTRACT.md (architecture context)
SRD.md → HarmonyDetector (implementation)
ACTIONS.md → CONTRACT.md (output column)
onboarding/agent.md → Module 9 (harmony teaching)
```

---

## Learnings

**Issue:** None — planning proceeded as expected.
**Root Cause:** N/A
**Suggestion:** N/A

**[FRESH EYE]** The harmony system is remarkably well-designed technically, but its conceptual foundation was buried in implementation files. This plan surfaces that philosophy WHERE people read it (ORCHESTRATOR.md, agent-standards, README). The result will be a self-documenting system where the "why" is as visible as the "how."

---

## Files Generated

1. **plan.md** (this file) — Complete implementation plan with exact content for all 10 files

---

## Next Steps

1. Human reviews plan
2. Compile chain: code/ (implement updates) → review/ → commit/
3. Validate cross-references and harmony system integrity
4. Update logs/INDEX.md with completion entry
