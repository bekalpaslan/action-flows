# Implementation Plan: ROADMAP.md & planning/ Flow

**Date:** 2026-02-08
**Purpose:** Design project management infrastructure for ActionFlows Dashboard
**Context:** Project currently has backward-looking INDEX.md/status docs but no forward-looking planning system

---

## Overview

This plan delivers two complementary project management deliverables:

1. **ROADMAP.md** — A living document at project root that serves as the single source of truth for "what's next", with tiered prioritization (immediate/short/medium/long-term), effort estimates, dependencies, and milestone tracking.

2. **planning/ flow** — An ActionFlows flow in the Framework department that enables structured roadmap review sessions, supporting two modes: "review" (status-only) and "update" (reprioritize and update ROADMAP.md).

Together, these create forward-looking planning infrastructure that complements existing backward-looking documentation (INDEX.md, LEARNINGS.md, status docs).

---

## Steps

### Step 1: Design ROADMAP.md Format Specification

**Package:** Root (project-level documentation)
**Files:** Plan document specifying format only (ROADMAP.md itself will be created in a subsequent implementation step)
**Changes:**
- Design markdown table-heavy format optimized for parseability by agents
- Define tier structure: IMMEDIATE (0-2 weeks), SHORT-TERM (2-6 weeks), MEDIUM-TERM (6-12 weeks), LONG-TERM (12+ weeks)
- Define item schema: ID (R-001 format), Title, Status (not-started/in-progress/done), Priority (P0-P3), Effort (days/weeks), Dependencies, Owner
- Define milestone structure: groupings of items representing meaningful deliverables
- Include Quick Wins section for low-effort ready items
- Include Blocked Items section with blocking reasons
- Add metadata fields: Last Updated timestamp, Updated By
- Design to reference project-state-inventory analysis for initial backlog population

**Depends on:** Nothing (foundational)

**Rationale:** Start with format specification so the planning flow can reference it when reading/writing ROADMAP.md.

---

### Step 2: Design planning/ Flow Structure

**Package:** ActionFlows Framework (.claude/actionflows/flows/framework/planning/)
**Files:** Flow design specification (instructions.md content designed, not yet written)
**Changes:**
- Define flow purpose: Structured roadmap review sessions ("what shipped, what's next, what's blocked")
- Define action sequence: analyze → plan → human gate → code → commit
- Define two modes:
  - `review` mode: analyze current state, present status update, no changes
  - `update` mode: analyze, reprioritize, update ROADMAP.md, commit
- Define inputs: mode (review/update), context (optional focus area)
- Define outputs: status report (review mode) or updated ROADMAP.md (update mode)
- Specify which registries need updates: FLOWS.md (add planning/), ORGANIZATION.md (add to Framework section)

**Depends on:** Step 1 (needs ROADMAP.md format to reference)

**Rationale:** Design the flow structure before writing agent definitions, ensuring clear action sequence and mode handling.

---

### Step 3: Design planning Action Agent Definition

**Package:** ActionFlows Framework (.claude/actionflows/actions/planning/)
**Files:** Agent definition specification (agent.md content designed)
**Changes:**
- Create planning-specific agent (alternative: could reuse plan/ action with specialized context)
- **Decision Point:** This step will determine if we need a NEW action called `planning/` OR if we should use the existing `plan/` action with specialized inputs
- If new action needed:
  - Define agent mission: Analyze roadmap state and produce prioritization recommendations
  - Define inputs: mode (review/update), roadmapPath (ROADMAP.md), logsPath (INDEX.md, LEARNINGS.md)
  - Define output format: status report or reprioritization plan
  - Extends: agent-standards, create-log-folder
- If reusing plan/ action:
  - Document how to use plan/ with specialized requirements/context for roadmap work

**Depends on:** Step 2 (needs flow structure to understand action requirements)

**Rationale:** Determine if specialized agent is needed or if existing plan/ action suffices.

---

### Step 4: Define Registry Updates

**Package:** ActionFlows Framework registries
**Files:** FLOWS.md, ORGANIZATION.md update specifications
**Changes:**

**FLOWS.md additions:**
```markdown
## Framework

| Flow | Purpose | Chain |
|------|---------|-------|
| planning/ | Roadmap review and prioritization | analyze → plan → human gate → code → commit |
```

**ORGANIZATION.md additions:**
```markdown
### Framework
**Owns:** ActionFlows framework maintenance
**Key Flows:** onboarding/, flow-creation/, action-creation/, action-deletion/, framework-health/, planning/
**Triggers:** "create a new flow", "create a new action", "check framework health", "delete action", "teach me ActionFlows", "onboarding", "review roadmap", "update roadmap", "what's next"
```

**Routing Guide additions:**
```markdown
| "review roadmap" / "what's next" / "show priorities" | Framework | planning/ (review mode) |
| "update roadmap" / "reprioritize" | Framework | planning/ (update mode) |
```

**Depends on:** Step 2, Step 3 (needs complete flow/action design)

**Rationale:** Define exact registry changes needed for orchestrator routing.

---

## ROADMAP.md Format Specification

### Structure

```markdown
# ActionFlows Dashboard Roadmap

> Single source of truth for "what's next"
> Last Updated: YYYY-MM-DD HH:MM:SS
> Updated By: [orchestrator/human name]

---

## Quick Wins (Low-Effort, Ready to Go)

| ID | Title | Priority | Effort | Status |
|----|-------|----------|--------|--------|
| R-001 | WebSocket broadcast for awaiting input | P0 | 1 day | not-started |
| R-002 | Redis session listing via SCAN | P0 | 1 day | not-started |
| R-003 | Duplicate user routes consolidation | P2 | 1 day | not-started |

**Selection Criteria:** Effort ≤ 2 days, no blockers, clear scope, high value

---

## Immediate (0-2 weeks)

| ID | Title | Priority | Effort | Dependencies | Owner | Status |
|----|-------|----------|--------|--------------|-------|--------|
| R-001 | WebSocket broadcast for awaiting input | P0 | 1 day | — | unassigned | not-started |
| R-002 | Redis session listing via SCAN | P0 | 1 day | — | unassigned | not-started |
| R-004 | Command ACK persistence | P1 | 1 week | — | unassigned | not-started |
| R-005 | File diff snapshots | P1 | 1 week | — | unassigned | not-started |
| R-010 | InlineButtons → ConversationPanel integration | P1 | 2 days | — | unassigned | not-started |
| R-011 | PersistentToolbar → AppContent integration | P1 | 2 days | — | unassigned | not-started |
| R-012 | StarBookmark → ConversationPanel integration | P1 | 1 day | — | unassigned | not-started |
| R-013 | HarmonyPanel → Dashboard/Settings tab | P1 | 2 days | — | unassigned | not-started |
| R-014 | SquadPanel → Main dashboard/session view | P1 | 3 days | — | unassigned | not-started |

---

## Short-Term (2-6 weeks)

| ID | Title | Priority | Effort | Dependencies | Owner | Status |
|----|-------|----------|--------|--------------|-------|--------|
| R-020 | Harmony Detection Phase 2 Integration | P0 | 2-3 weeks | — | unassigned | not-started |
| R-021 | Dashboard Screen Implementation | P0 | 4 weeks | R-020, R-013 | unassigned | not-started |
| R-022 | Backend Services Unit Tests | P1 | 1 week | — | unassigned | not-started |
| R-023 | Frontend Hooks Unit Tests | P1 | 1 week | — | unassigned | not-started |
| R-024 | Self-Evolving UI Integration Tests | P1 | 1 week | R-010, R-011, R-012 | unassigned | not-started |
| R-025 | Per-Session ACL Implementation | P0 | 2 days | — | unassigned | not-started |
| R-026 | Security Audit (Path Traversal, API Keys) | P0 | 1 week | R-025 | unassigned | not-started |
| R-027 | Load Tests (1K Sessions, 1K Clients) | P1 | 2 days | — | unassigned | not-started |

---

## Medium-Term (6-12 weeks)

| ID | Title | Priority | Effort | Dependencies | Owner | Status |
|----|-------|----------|--------|--------------|-------|--------|
| R-030 | Flows Screen Implementation | P1 | 3-4 weeks | R-021 | unassigned | not-started |
| R-031 | Actions Screen Implementation | P1 | 3-4 weeks | R-021 | unassigned | not-started |
| R-032 | Logs Screen Implementation | P1 | 3-4 weeks | R-021 | unassigned | not-started |
| R-033 | Settings Screen Implementation | P1 | 3-4 weeks | R-021 | unassigned | not-started |
| R-034 | Complete Self-Evolving UI Phase 4 | P2 | 4-6 weeks | R-024 | unassigned | not-started |
| R-035 | Session Replay & Debugging | P2 | 2 weeks | — | unassigned | not-started |
| R-036 | Multi-User Collaboration | P2 | 3 weeks | — | unassigned | not-started |

---

## Long-Term (12+ weeks)

| ID | Title | Priority | Effort | Dependencies | Owner | Status |
|----|-------|----------|--------|--------------|-------|--------|
| R-040 | Metrics & Analytics Dashboard | P2 | 2 weeks | R-021 | unassigned | not-started |
| R-041 | Performance Optimization (Virtualization) | P2 | 1-2 weeks | R-027 | unassigned | not-started |
| R-042 | Accessibility Improvements (WCAG) | P3 | 1-2 weeks | — | unassigned | not-started |
| R-043 | Theme Customization System | P3 | 1 week | — | unassigned | not-started |
| R-044 | MCP Server Expansion | P2 | 2-3 weeks | — | unassigned | not-started |

---

## Milestones

### M1: Production-Ready Core (Weeks 1-2)
**Goal:** Fix critical backend gaps and security issues for production deployment
**Items:** R-001, R-002, R-004, R-005, R-025, R-026
**Success Criteria:**
- [ ] Redis fully operational with session listing
- [ ] All WebSocket state changes broadcast
- [ ] Per-session ACL enforced
- [ ] Security audit passed (no HIGH/CRITICAL findings)

---

### M2: Self-Evolving UI Integration (Weeks 2-3)
**Goal:** Wire up existing Phase 1-3 components into main UI
**Items:** R-010, R-011, R-012, R-013, R-014
**Success Criteria:**
- [ ] InlineButtons render in ConversationPanel
- [ ] PersistentToolbar visible in main layout
- [ ] StarBookmark icon appears on messages
- [ ] HarmonyPanel accessible in Dashboard/Settings
- [ ] SquadPanel displays in session view

---

### M3: Harmony System Complete (Weeks 3-5)
**Goal:** Full Harmony Detection Phase 2 integration with live visualization
**Items:** R-020
**Success Criteria:**
- [ ] OrchestratorParser service operational
- [ ] WebSocket handler parses all output formats
- [ ] Dashboard displays harmony violations in real-time
- [ ] ChainTable and StepTimeline components functional

---

### M4: Dashboard Foundation (Weeks 5-8)
**Goal:** First complete dashboard screen with key metrics and harmony monitoring
**Items:** R-021
**Success Criteria:**
- [ ] Key metrics display (sessions, chains, harmony %)
- [ ] Active sessions overview with status cards
- [ ] Recent chains timeline
- [ ] Harmony status panel integrated
- [ ] Recent learnings feed from LEARNINGS.md

---

### M5: Complete Dashboard Screens (Weeks 9-20)
**Goal:** All 5 main navigation tabs fully functional
**Items:** R-030, R-031, R-032, R-033
**Success Criteria:**
- [ ] Flows screen: visualize FLOWS.md, execution history
- [ ] Actions screen: visualize ACTIONS.md, usage stats
- [ ] Logs screen: INDEX.md browser, LEARNINGS.md search
- [ ] Settings screen: user preferences, global config

---

### M6: Production Deployment (Week 20+)
**Goal:** Fully tested, production-ready deployment
**Items:** R-027, R-026 (revalidation)
**Success Criteria:**
- [ ] Load tests passed (1K sessions, 1K clients)
- [ ] E2E test coverage ≥ 80%
- [ ] Security audit revalidated
- [ ] Deployment runbook complete

---

## Blocked Items

| ID | Title | Blocking Issue | Resolution Required |
|----|-------|----------------|---------------------|
| (none) | — | — | — |

**Note:** When items become blocked, move them here with clear blocking reasons. Re-evaluate weekly.

---

## Priority Definitions

| Priority | Meaning | When to Use |
|----------|---------|-------------|
| **P0** | Critical blocker | Prevents production deployment or causes data loss |
| **P1** | High priority | Core functionality, user-facing features, major improvements |
| **P2** | Medium priority | Nice-to-have features, performance improvements, usability enhancements |
| **P3** | Low priority | Polish, minor improvements, future considerations |

---

## Effort Estimation Guidelines

| Effort | Typical Scope | Examples |
|--------|---------------|----------|
| 1 day | Single file, < 100 LOC, no dependencies | Small bug fix, config change, route addition |
| 2-3 days | 2-3 files, < 300 LOC, minor dependencies | Small feature, component integration, service extension |
| 1 week | 5-10 files, 500-1000 LOC, moderate dependencies | Medium feature, new service, API module |
| 2-3 weeks | 10-20 files, 1000-3000 LOC, complex dependencies | Large feature, screen implementation, major refactor |
| 4+ weeks | 20+ files, 3000+ LOC, cross-package changes | Major system feature, multi-phase implementation |

---

## How to Use This Roadmap

### For Orchestrators
1. **Daily:** Check "Quick Wins" for immediate tasks
2. **Weekly:** Review "Immediate" tier for sprint planning
3. **Biweekly:** Re-evaluate "Short-Term" tier, move completed items to "Done"
4. **Monthly:** Update "Medium-Term" and "Long-Term" based on new learnings

### For Humans
1. Use `planning/` flow in "review" mode to see status updates
2. Use `planning/` flow in "update" mode to reprioritize after major milestones
3. Reference IDs (R-XXX) in discussions and commits
4. Update "Updated By" field when manually editing

### For Status Updates
After completing an item:
1. Change Status to "done"
2. Update Last Updated timestamp
3. Move to appropriate completed section (or remove)
4. Check if any dependent items are now unblocked
5. Update LEARNINGS.md if applicable

---
```

### Format Rationale

**Table-Heavy Design:** Orchestrators scan tables faster than prose. Every major section uses markdown tables for structured data.

**Clear Tiers:** Four time-based tiers (Immediate/Short/Medium/Long) with explicit week ranges prevent ambiguity about "when to work on this."

**Rich Item Metadata:** Each item has 7 fields (ID, Title, Priority, Effort, Dependencies, Owner, Status) enabling sophisticated filtering and dependency tracking.

**Quick Wins Section:** Optimizes for low-hanging fruit — agents can immediately find high-value, low-effort tasks.

**Milestone Tracking:** Groups related items into meaningful deliverables, provides completion criteria, prevents "infinite progress without shipping."

**Blocked Items Section:** Makes blockers visible and trackable instead of hidden in item descriptions.

**Metadata Fields:** Last Updated + Updated By enable audit trail and conflict resolution when multiple agents/humans edit.

**Initial Population:** Format references project-state-inventory analysis, ensuring first version is comprehensive and accurate.

---

## planning/ Flow Specification

### Flow Purpose

Enable structured roadmap review sessions with two distinct modes:

1. **Review Mode:** Read-only analysis of current roadmap state. Produces status update showing what shipped, what's in progress, what's blocked, what's next.

2. **Update Mode:** Full reprioritization workflow. Analyzes current state, proposes priority changes, updates ROADMAP.md, commits changes.

### Flow Location

`.claude/actionflows/flows/framework/planning/instructions.md`

**Rationale:** Belongs in Framework department because it maintains project management infrastructure (similar to how framework-health/ maintains ActionFlows structure).

### Action Sequence

```
analyze (current state) → plan (prioritize) → HUMAN GATE → code (update ROADMAP) → commit
```

**Modes:**
- **Review mode:** Stop after `plan` step, present status report
- **Update mode:** Execute full sequence through `commit`

### instructions.md Content

```markdown
# Planning Flow

> Structured roadmap review and prioritization sessions.

---

## When to Use

- Orchestrator needs to understand "what's next"
- Human requests roadmap status ("what's next?", "show priorities", "review roadmap")
- Human requests reprioritization ("update roadmap", "reprioritize", "adjust priorities")
- After major milestone completion (check if priorities shifted)
- Weekly/biweekly roadmap review sessions

---

## Required Inputs From Human

| Input | Description | Example |
|-------|-------------|---------|
| mode | Operation mode | "review" or "update" |
| context | Optional focus area | "backend", "frontend", "security", or omit for full roadmap |

---

## Action Sequence

### Step 1: Analyze Current State

**Action:** `.claude/actionflows/actions/analyze/`
**Model:** sonnet

**Spawn:**
```
Read your definition in .claude/actionflows/actions/analyze/agent.md

Input:
- aspect: roadmap-status
- scope: ROADMAP.md, .claude/actionflows/logs/INDEX.md, .claude/actionflows/LEARNINGS.md
- context: {context from human if provided, else "full roadmap"}
```

**Output:** Analysis of:
- What shipped since last update (check INDEX.md for recent completions)
- What's in progress (items with status=in-progress)
- What's blocked (items in Blocked section)
- What's next (items in Immediate tier, not-started)
- Priority drift (items that should move tiers based on new learnings)

**Gate:** Current state analysis delivered.

---

### Step 2: Prioritization Plan

**Action:** `.claude/actionflows/actions/plan/`
**Model:** sonnet

**Spawn after Step 1:**
```
Read your definition in .claude/actionflows/actions/plan/agent.md

Input:
- requirements: Based on analysis from Step 1, produce prioritization recommendations for ROADMAP.md
- context: Current ROADMAP.md content, analysis from Step 1
- depth: high-level
```

**Output:** Recommendations for:
- Items to move between tiers (e.g., "R-020 should move from Short-Term to Immediate")
- Items to mark as done (completed since last update)
- Items to mark as blocked (new blockers discovered)
- New items to add (from LEARNINGS.md or recent discoveries)
- Priority changes (P0 → P1, etc.)

**Gate:** Prioritization plan delivered.

---

### Step 3: Mode Branch

**If mode = "review":**
- Present analysis and plan to human
- Flow ends (no changes to ROADMAP.md)

**If mode = "update":**
- Proceed to Step 4 (HUMAN GATE)

---

### Step 4: HUMAN GATE (update mode only)

Present prioritization plan for approval. Human reviews proposed changes, can accept/modify/reject.

- **Accept:** Proceed to Step 5
- **Modify:** Human provides adjustments, loop back to Step 2 with modifications
- **Reject:** Flow ends (no changes)

---

### Step 5: Update ROADMAP.md (update mode only)

**Action:** `.claude/actionflows/actions/code/`
**Model:** haiku

**Spawn after Human approves Step 4:**
```
Read your definition in .claude/actionflows/actions/code/agent.md

Input:
- task: Update ROADMAP.md per approved prioritization plan from Step 4
- context: Approved plan, current ROADMAP.md, guidelines in ROADMAP.md "How to Use" section
```

**Output:** ROADMAP.md updated with:
- Items moved between tiers
- Status changes (not-started → in-progress → done)
- Priority changes
- New items added
- Blocked items moved to/from Blocked section
- Last Updated timestamp updated
- Updated By field set to orchestrator name

**Gate:** ROADMAP.md updated successfully.

---

### Step 6: Commit Changes (update mode only)

**Action:** `.claude/actionflows/actions/commit/`
**Model:** haiku

**Spawn after Step 5:**
```
Read your definition in .claude/actionflows/actions/commit/agent.md

Input:
- summary: Roadmap update: {brief summary of changes}
- files: ROADMAP.md
```

**Output:** Changes committed to git with descriptive message.

**Gate:** Commit successful.

---

## Dependencies

**Review Mode:**
```
Step 1 → Step 2 → (present and end)
```

**Update Mode:**
```
Step 1 → Step 2 → Step 3 (branch) → Step 4 (HUMAN GATE) → Step 5 → Step 6
```

**Parallel groups:** None — fully sequential.

---

## Chains With

- ← Triggered after major milestone completions
- ← Triggered on weekly/biweekly review schedule
- → `post-completion/` (after Step 6 in update mode)

---

## Examples

**Review Mode Example:**
```
Human: "What's next on the roadmap?"
Orchestrator: [Routes to planning/ flow, review mode]
Output: Status report showing current priorities, what shipped, what's blocked
```

**Update Mode Example:**
```
Human: "We just shipped Dashboard screen (M4). Update roadmap priorities."
Orchestrator: [Routes to planning/ flow, update mode]
Output: Updated ROADMAP.md with M4 items marked done, priorities reshuffled, next milestone items promoted to Immediate tier
```

---

## Mode Selection Guidelines

| Scenario | Mode | Rationale |
|----------|------|-----------|
| "What's next?" | review | Human wants information, no changes needed |
| "Show priorities" | review | Read-only status check |
| "Review roadmap" | review | General status inquiry |
| "Update roadmap" | update | Human explicitly requests changes |
| "Reprioritize" | update | Implies changes to priorities |
| "Mark X as done" | update | Requires ROADMAP.md modification |
| After milestone completion | update | Priorities likely shifted, update needed |
| Weekly review | review | Regular status check, changes only if needed |

---
```

### Planning Action Design Decision

**RECOMMENDATION:** Reuse existing `plan/` action instead of creating a new `planning/` action.

**Rationale:**
1. **Single Responsibility:** The `plan/` action already does "create implementation plans from requirements." Roadmap prioritization is a planning task.
2. **Code Reuse:** No need to duplicate agent logic and behavioral standards.
3. **Consistency:** All planning work uses the same action, agents learn one pattern.
4. **Maintainability:** Fewer actions to maintain, update, and document.

**Implementation:** Use `plan/` action with specialized inputs:
- `requirements`: "Based on analysis from Step 1, produce prioritization recommendations for ROADMAP.md"
- `context`: Current ROADMAP.md + analysis + LEARNINGS.md

The `plan/` action's existing agent.md already supports high-level planning (via `depth: high-level` input), making it suitable for roadmap prioritization.

**Alternative (NOT Recommended):** Create a new `planning/` action if roadmap-specific logic becomes complex enough to warrant specialization. Current requirements do not justify this complexity.

---

## Dependency Graph

```
Step 1 (ROADMAP.md format spec)
  ↓
Step 2 (planning/ flow structure design)
  ↓
Step 3 (agent definition decision: reuse plan/)
  ↓
Step 4 (registry updates: FLOWS.md, ORGANIZATION.md)
```

All steps are sequential — each depends on the previous.

---

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| ROADMAP.md becomes stale (not updated regularly) | Roadmap loses value as priorities drift | Establish weekly review cadence, orchestrator proactively checks |
| Merge conflicts when multiple agents update ROADMAP.md | Lost changes, inconsistent state | Use git conflict resolution, Last Updated field for audit trail |
| ROADMAP.md grows too large (100+ items) | Hard to scan, loses "single source of truth" clarity | Archive completed items monthly, keep active items < 50 |
| Human manually edits ROADMAP.md without using flow | Orchestrator unaware of changes, no learnings captured | Add "Updated By" field requirement, document manual edit protocol |
| Effort estimates inaccurate | Poor planning, missed deadlines | Calibrate estimates based on historical data from INDEX.md |

---

## Verification

### ROADMAP.md Format Verification
- [ ] All sections present (Quick Wins, Immediate, Short-Term, Medium-Term, Long-Term, Milestones, Blocked)
- [ ] All items have required fields (ID, Title, Priority, Effort, Dependencies, Owner, Status)
- [ ] IDs follow R-XXX format
- [ ] Priorities use P0-P3 scheme
- [ ] Effort estimates use defined units (days/weeks)
- [ ] Dependencies reference valid item IDs
- [ ] Last Updated and Updated By fields present
- [ ] Markdown tables properly formatted

### planning/ Flow Verification
- [ ] instructions.md follows existing flow template structure
- [ ] Action sequence clearly defined (analyze → plan → human gate → code → commit)
- [ ] Mode branching logic explicit (review vs update)
- [ ] Inputs clearly documented (mode, context)
- [ ] Dependencies graph correct
- [ ] Spawning prompts follow ACTIONS.md pattern
- [ ] Gates defined for each step

### Registry Updates Verification
- [ ] FLOWS.md entry added in Framework section
- [ ] ORGANIZATION.md updated with planning/ in Key Flows
- [ ] ORGANIZATION.md triggers updated with roadmap keywords
- [ ] Routing table includes planning/ examples
- [ ] All changes follow existing format conventions

---

## File Manifest

### Files to Create (Implementation Phase)

**Root Documentation:**
- `ROADMAP.md` — The living roadmap document (populate using project-state-inventory analysis)

**Flow Definition:**
- `.claude/actionflows/flows/framework/planning/instructions.md` — Flow definition and action sequence

**Registry Updates (Modifications):**
- `.claude/actionflows/FLOWS.md` — Add planning/ entry
- `.claude/actionflows/ORGANIZATION.md` — Add planning/ to Framework section, add triggers

**No New Actions Needed:**
- Reuse `.claude/actionflows/actions/plan/` (existing)
- Reuse `.claude/actionflows/actions/analyze/` (existing)
- Reuse `.claude/actionflows/actions/code/` (existing)
- Reuse `.claude/actionflows/actions/commit/` (existing)

### File Count Summary
- **New files:** 2 (ROADMAP.md, planning/instructions.md)
- **Modified files:** 2 (FLOWS.md, ORGANIZATION.md)
- **Total affected files:** 4

---

## Implementation Notes

### Initial ROADMAP.md Population

When creating ROADMAP.md for the first time:

1. Read `/.claude/actionflows/logs/analyze/project-state-inventory_2026-02-08-23-40-08/analysis.md`
2. Extract all items from Section E (Suggested Priorities) and Section I (Next Steps Recommendations)
3. Assign IDs (R-001, R-002, etc.) sequentially
4. Map items to tiers based on time estimates:
   - Immediate: 0-2 weeks items
   - Short-Term: 2-6 weeks items
   - Medium-Term: 6-12 weeks items
   - Long-Term: 12+ weeks items
5. Assign priorities based on impact + urgency:
   - P0: Critical blockers, security issues
   - P1: Core functionality, user-facing features
   - P2: Nice-to-have, performance improvements
   - P3: Polish, future considerations
6. Map milestones from analysis (M1-M6 already defined in analysis)
7. Populate Quick Wins from "High-Impact, Low-Effort" section (E.1)
8. Set Last Updated to creation date
9. Set Updated By to "Initial Import from Project State Inventory"

### Flow Usage Examples

**Scenario 1: Weekly Status Check**
```
Human: "What's next this week?"
Orchestrator: [Routes to planning/, mode=review, context=omitted]
→ Analyzes ROADMAP.md Immediate tier
→ Presents items with status=not-started, sorted by priority
→ Highlights blockers from Blocked section
→ Shows recently completed items from INDEX.md
```

**Scenario 2: Post-Milestone Reprioritization**
```
Human: "We shipped M4 (Dashboard Foundation). Update roadmap."
Orchestrator: [Routes to planning/, mode=update, context=omitted]
→ Analyzes INDEX.md for M4 completions
→ Proposes marking R-021 as done, moving M5 items to Short-Term
→ Human approves
→ Updates ROADMAP.md with new priorities
→ Commits changes with message "roadmap: post-M4 reprioritization"
```

**Scenario 3: Focused Backend Review**
```
Human: "Review backend roadmap items"
Orchestrator: [Routes to planning/, mode=review, context="backend"]
→ Filters ROADMAP.md for backend-related items (via title keyword matching)
→ Presents backend-only status report
→ Highlights backend blockers and dependencies
```

### Registry Update Timing

Registry updates (FLOWS.md, ORGANIZATION.md) should happen AFTER flow implementation but BEFORE first usage:

1. Create planning/instructions.md
2. Test flow manually once
3. Update registries
4. Commit all changes together

This ensures the flow is functional before orchestrator starts routing to it.

---

## Next Steps After This Plan

**Implementation Sequence:**
1. **Create ROADMAP.md** (code/ action, populate from analysis)
2. **Create planning/instructions.md** (code/ action, use this plan's specification)
3. **Update registries** (code/ action, FLOWS.md + ORGANIZATION.md)
4. **Review all files** (review/ action)
5. **Commit changes** (commit/ action)
6. **Test flow** (Human triggers "review roadmap" to verify routing and execution)

**Estimated Total Effort:** 1-2 days
- ROADMAP.md creation: 2-3 hours (mostly data extraction from analysis)
- planning/instructions.md: 1-2 hours (template-based)
- Registry updates: 30 minutes (line additions)
- Review: 1 hour
- Testing: 1 hour

**Dependencies:** None — all prerequisites exist (analysis complete, actions defined, framework operational)

---

## Success Criteria

**ROADMAP.md:**
- [ ] All sections present and properly formatted
- [ ] 40-50 items populated from project-state-inventory analysis
- [ ] All items have complete metadata (ID, Title, Priority, Effort, Dependencies, Owner, Status)
- [ ] 6 milestones defined with success criteria
- [ ] Quick Wins section has 5-10 items
- [ ] Markdown tables render correctly
- [ ] Last Updated and Updated By fields set

**planning/ Flow:**
- [ ] instructions.md follows template structure
- [ ] Action sequence clearly defined
- [ ] Mode branching logic explicit
- [ ] Example scenarios provided
- [ ] Spawning prompts correct
- [ ] Dependencies and gates defined

**Registry Updates:**
- [ ] FLOWS.md has planning/ entry in Framework section
- [ ] ORGANIZATION.md lists planning/ in Key Flows
- [ ] ORGANIZATION.md has roadmap triggers
- [ ] Routing table includes planning/ examples
- [ ] All entries follow existing format

**Integration Test:**
- [ ] Orchestrator routes "what's next" to planning/ flow
- [ ] Review mode executes and produces status report
- [ ] Update mode executes full sequence (with human approval)
- [ ] ROADMAP.md updates correctly
- [ ] Commit messages follow conventions

---

**Plan Complete**
**Log Folder:** `/d/ActionFlowsDashboard/.claude/actionflows/logs/plan/roadmap-planning-flow-design_2026-02-08-23-47-11/`
**Files:** plan.md (this file)
**Status:** Ready for review and implementation
