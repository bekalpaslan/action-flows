# Department ↔ Workbench Unification Touchpoint Inventory

**Metadata:**
- **Aspect:** Inventory
- **Scope:** Department ↔ Workbench unification touchpoint analysis
- **Date:** 2026-02-09
- **Agent:** analyze/

---

## Executive Summary

This report catalogs **every reference to "departments" and "workbenches"** across the ActionFlows Dashboard project to map all touchpoints that would need modification in a unification strategy.

**Key Findings:**
- **4 Departments** currently exist in the orchestrator layer (Framework, Engineering, QA, Human)
- **9 Workbenches** currently exist in the UI layer (work, maintenance, explore, review, archive, settings, pm, harmony, editor)
- **Conceptual overlap** exists for 4 workbenches that map directly to session-capable contexts
- **68 files** reference "department", **19 files** reference "workbench"
- **Estimated touchpoints for unification:** 15 high-impact files requiring significant changes

**Conceptual Gap:** Users see and interact with workbenches in the UI, but the orchestrator routes via departments. This creates a mental model mismatch where "work" is a UI concept but "Engineering" is a routing concept—yet both represent similar domains.

---

## Section 1: Current Department Model

### 1.1 Department Definitions

**Location:** `.claude/actionflows/ORGANIZATION.md`

**The 4 Departments:**

| Department | Owns | Key Triggers | Key Flows |
|------------|------|--------------|-----------|
| **Framework** | ActionFlows maintenance | "create flow", "create action", "onboarding", "check framework health" | onboarding/, flow-creation/, action-creation/, framework-health/, planning/ |
| **Engineering** | Code, features, bug fixes, refactoring | "implement", "add feature", "fix bug", "refactor" | code-and-review/, bug-triage/, post-completion/ |
| **QA** | Audits, quality, security scans | "audit", "security scan", "quality check" | audit-and-fix/ |
| **Human** | Ideation, brainstorming, thinking | "I have an idea", "brainstorm", "ideation" | ideation/ |

### 1.2 Routing Mechanism

**File:** `.claude/actionflows/ORGANIZATION.md` (lines 29-54)

The orchestrator uses a **keyword-trigger-based routing table** that maps human intent phrases to departments:

```
Human Request → Keyword Match → Department → Flow Lookup (FLOWS.md) → Chain Compilation
```

**Example Routing:**
- "implement X" → Engineering → code-and-review/ flow
- "fix bug X" → Engineering → bug-triage/ flow
- "audit security" → QA → audit-and-fix/ flow
- "I have an idea" → Human → ideation/ flow

### 1.3 Department References (All Files)

**Framework Files (CRITICAL):**
1. `.claude/actionflows/ORGANIZATION.md` — **Department definitions** (lines 11-32)
2. `.claude/actionflows/FLOWS.md` — **Flow-to-department mapping** (flows grouped by department)
3. `.claude/actionflows/ACTIONS.md` — Mentions "department routing" in documentation
4. `.claude/actionflows/README.md` — Lists ORGANIZATION.md as "Department routing rules"
5. `.claude/actionflows/ORCHESTRATOR.md` — References department routing in session-start protocol
6. `.claude/actionflows/CONTRACT.md` — **Format 6.2: Department Routing Announcement** (lines 233-246)

**Contract Implementation (MODERATE):**
7. `packages/shared/src/contract/types/statusFormats.ts` — `DepartmentRoutingParsed` interface (lines 40-65)
8. `packages/shared/src/contract/parsers/statusParser.ts` — Parser for department routing format
9. `packages/shared/src/contract/patterns/statusPatterns.ts` — Regex patterns for department parsing
10. `packages/shared/src/contract/guards.ts` — Type guards for `DepartmentRoutingParsed`
11. `packages/shared/src/contract/index.ts` — Exports department routing types

**Onboarding & Documentation (MODERATE):**
12. `.claude/actionflows/flows/framework/onboarding/modules/06-department-routing.md` — **Teaching module** (150 lines)
13. `.claude/actionflows/actions/onboarding/agent.md` — References department routing module
14. `.claude/actionflows/flows/framework/onboarding/templates/quick-reference-card.md` — Lists departments
15. `.claude/actionflows/flows/framework/onboarding/modules/10-completion.md` — Mentions department structure

**Analysis & Planning Logs (LOW PRIORITY):**
16-68. Various log files in `.claude/actionflows/logs/` referencing departments in analysis outputs

### 1.4 How Departments Affect Orchestrator Routing

**Step-by-step routing logic** (from ORCHESTRATOR.md):

1. **Session Start:** Orchestrator reads ORGANIZATION.md
2. **Request Reception:** Parse human intent
3. **Trigger Match:** Scan routing table for keyword triggers
4. **Department Selection:** Map trigger to department
5. **Flow Lookup:** Read FLOWS.md, find flows in selected department
6. **Chain Compilation:** Assemble action sequence from flow or compose dynamically

**Critical Dependency:** Department choice determines which flows are considered. If a flow is in the wrong department, it won't be discovered during routing.

---

## Section 2: Current Workbench Model

### 2.1 The 9 Workbenches

**Location:** `packages/shared/src/workbenchTypes.ts`

| Workbench ID | Icon | Purpose | Session-Capable? | Notifications? | Glow Color |
|--------------|------|---------|------------------|----------------|------------|
| `work` | 🔨 | Active development sessions and current tasks | ✅ Yes | ✅ Yes | Green (#4caf50) |
| `maintenance` | 🔧 | Bug fixes, refactoring, housekeeping | ✅ Yes | ✅ Yes | Orange (#ff9800) |
| `explore` | 🔍 | Research, codebase exploration, learning | ✅ Yes | ✅ Yes | Blue (#2196f3) |
| `review` | 👁️ | Code reviews, PR checks, audits | ✅ Yes | ✅ Yes | Purple (#9c27b0) |
| `archive` | 📦 | Completed and historical sessions | ❌ No | ❌ No | — |
| `settings` | ⚙️ | Configuration, preferences, management | ❌ No | ❌ No | — |
| `pm` | 📋 | Project management, tasks, documentation | ❌ No | ✅ Yes | Cyan (#00bcd4) |
| `harmony` | 🎵 | Violations, sins, remediations | ❌ No | ✅ Yes | Red (#f44336) |
| `editor` | 📝 | Full-screen code editing | ❌ No | ❌ No | — |

**Session-Capable Workbenches:** Only `work`, `maintenance`, `explore`, and `review` can contain sessions.

### 2.2 Workbench Architecture

**Primary Components:**

1. **WorkbenchLayout** — Main shell that replaces AppContent
   - Location: `packages/app/src/components/Workbench/WorkbenchLayout.tsx`
   - Renders TopBar + SessionSidebar + workbench-specific content

2. **TopBar** — Navigation header with 9 tabs
   - Location: `packages/app/src/components/TopBar/TopBar.tsx`
   - Tab switching, notification badges, status display

3. **WorkbenchTab** — Individual tab buttons
   - Location: `packages/app/src/components/TopBar/WorkbenchTab.tsx`
   - Visual styling, active state, notification count

4. **SessionSidebar** — Auto-hide session navigator
   - Location: `packages/app/src/components/SessionSidebar/SessionSidebar.tsx`
   - Only visible on session-capable workbenches

5. **WorkbenchContext** — Global state management
   - Location: `packages/app/src/contexts/WorkbenchContext.tsx`
   - Active workbench, notifications, persistence

### 2.3 Workbench References (All Files)

**Shared Types (CRITICAL):**
1. `packages/shared/src/workbenchTypes.ts` — **Complete type definitions** (224 lines)
   - WorkbenchId type (9 workbenches)
   - WorkbenchConfig, WorkbenchState, WorkbenchNotification types
   - DEFAULT_WORKBENCH_CONFIGS (all 9 configs)
   - Utility functions: canWorkbenchHaveSessions(), getSessionCapableWorkbenches()
2. `packages/shared/src/index.ts` — Exports workbench types

**Frontend Components (HIGH IMPACT):**
3. `packages/app/src/components/Workbench/WorkbenchLayout.tsx` — Main layout shell (152 lines)
4. `packages/app/src/components/Workbench/WorkbenchLayout.css` — Layout styles (157 lines)
5. `packages/app/src/components/Workbench/index.ts` — Barrel export
6. `packages/app/src/components/TopBar/TopBar.tsx` — Navigation header (80 lines)
7. `packages/app/src/components/TopBar/TopBar.css` — Header styles (~100 lines)
8. `packages/app/src/components/TopBar/WorkbenchTab.tsx` — Individual tabs (~80 lines)
9. `packages/app/src/components/TopBar/WorkbenchTab.css` — Tab styles (~100 lines)
10. `packages/app/src/components/TopBar/index.ts` — Barrel export

**Session Components (HIGH IMPACT):**
11. `packages/app/src/components/SessionSidebar/SessionSidebar.tsx` — Sidebar component (151 lines)
12. `packages/app/src/components/SessionSidebar/SessionSidebar.css` — Sidebar styles (~150 lines)
13. `packages/app/src/components/SessionSidebar/SessionSidebarItem.tsx` — Session card (~120 lines)
14. `packages/app/src/components/SessionSidebar/SessionSidebarItem.css` — Card styles (~120 lines)
15. `packages/app/src/components/SessionSidebar/index.ts` — Barrel export
16. `packages/app/src/components/SessionSidebar/README.md` — Documentation (118 lines)

**State Management (CRITICAL):**
17. `packages/app/src/contexts/WorkbenchContext.tsx` — Context provider (169 lines)
18. `packages/app/src/hooks/useSessionSidebar.ts` — Sidebar hook (166 lines)
19. `packages/app/src/hooks/index.ts` — Hook exports

**Integration (HIGH IMPACT):**
20. `packages/app/src/App.tsx` — WorkbenchProvider hierarchy (modified)
21. `packages/app/src/components/AppContent.tsx` — Feature flag + conditional rendering

**Documentation (LOW PRIORITY):**
22. `WORKBENCH_LAYOUT_INTEGRATION.md` — Testing guide (163 lines)
23. `.claude/actionflows/logs/analyze/workbench-concept-inventory_2026-02-09/report.md` — This analysis

### 2.4 How Workbenches Affect UI Rendering

**Rendering Logic** (from WorkbenchLayout.tsx):

1. **Provider Hierarchy:** WebSocketProvider → WorkbenchProvider → AppContent
2. **Active Workbench Selection:** Stored in WorkbenchContext, persisted to localStorage
3. **Tab Navigation:** User clicks tab → setActiveWorkbench() → re-render main content area
4. **Session Sidebar Visibility:** Conditional on `canWorkbenchHaveSessions(activeWorkbench)`
5. **Content Rendering:** Switch statement in `renderWorkbenchContent()` determines what to display

**Critical Dependency:** Workbench ID directly controls which components are mounted. Each workbench has distinct UI requirements.

---

## Section 3: Overlap Analysis

### 3.1 Conceptual Overlap Map

**Direct Conceptual Overlaps:**

| Department | Overlapping Workbench(es) | Alignment | Notes |
|------------|---------------------------|-----------|-------|
| **Engineering** | `work`, `maintenance` | ⚠️ PARTIAL | Engineering owns coding. "Work" contains active dev sessions. "Maintenance" contains bug fixes/refactoring. Both are Engineering activities split across 2 workbenches. |
| **QA** | `review`, `harmony` | ⚠️ PARTIAL | QA owns audits. "Review" contains review sessions. "Harmony" is a specialized audit dashboard. Both are QA activities. |
| **Framework** | `settings`, `pm` | ❌ DIVERGE | Framework owns ActionFlows itself. No direct workbench equivalent. "Settings" and "PM" are UI-only concepts. |
| **Human** | `explore` | ⚠️ PARTIAL | Human owns ideation. "Explore" is research/learning, which could include ideation but also includes technical exploration (more Engineering). |

**Workbenches with No Department Equivalent:**
- `archive` — Pure UI organizational tool (completed sessions)
- `editor` — Pure UI tool (full-screen code editing)
- `pm` — Pure UI tool (project management dashboard)
- `harmony` — Specialized QA dashboard (contract compliance, sin detection)

**Departments with No Direct Workbench:**
- `Framework` — No dedicated workbench for framework maintenance activities

### 3.2 The Four Session-Capable Workbenches

**These are the key overlap candidates:**

| Workbench | Department Mapping | Current Purpose | Potential Unified Purpose |
|-----------|-------------------|-----------------|---------------------------|
| `work` | Engineering (primary) | Active development sessions | **Engineering Department Workbench** — All coding sessions (features, bugs, refactors) |
| `maintenance` | Engineering (subset) | Bug fixes, refactoring | Could be merged into unified Engineering workbench as a session tag/filter |
| `explore` | Engineering + Human | Research, exploration, learning | **Human Department Workbench** OR exploratory sessions could be Engineering |
| `review` | QA (primary) | Code reviews, audits | **QA Department Workbench** — All review/audit sessions |

**Key Insight:** The 4 session-capable workbenches roughly correspond to 3 departments:
- `work` + `maintenance` → Engineering
- `review` → QA
- `explore` → Human (or Engineering research)

### 3.3 Divergence Analysis

**Where they diverge:**

1. **Granularity Mismatch:**
   - Departments: 4 broad categories (Framework, Engineering, QA, Human)
   - Workbenches: 9 specific contexts (including non-session contexts like Archive, Settings, PM, Harmony, Editor)

2. **Scope Difference:**
   - Departments: **Routing logic only** — decides which flow to run
   - Workbenches: **UI organization only** — decides what to display and where

3. **Lifecycle:**
   - Departments: Used at **session start** to route requests
   - Workbenches: Used **throughout session** for navigation and organization

4. **User Visibility:**
   - Departments: **Hidden** — users never see "Engineering Department"
   - Workbenches: **Visible** — primary navigation UI

### 3.4 The Conceptual Gap

**User Mental Model:**
1. User sees 9 workbench tabs in the UI
2. User attaches sessions to workbenches
3. User thinks in terms of "I'm working in the Maintenance workbench"

**Orchestrator Mental Model:**
1. Orchestrator routes based on keyword triggers
2. Orchestrator selects a department
3. Orchestrator compiles a chain from flows in that department

**The Gap:**
- User says "fix bug X" → Orchestrator routes to **Engineering Department** → Creates session → User expects session in **Maintenance Workbench**
- BUT there's no automatic connection between Engineering Department and Maintenance Workbench
- User must manually tag or organize sessions into workbenches

**Result:** User-facing workbenches and orchestrator departments are parallel taxonomies with no synchronization.

---

## Section 4: Touchpoint Inventory

### 4.1 Files Requiring Modification (Unification Scenario)

If departments and workbenches were unified into a single taxonomy:

#### CRITICAL - Framework Registry Files (5 files)

| File | Current State | Required Changes | Complexity |
|------|---------------|------------------|------------|
| `.claude/actionflows/ORGANIZATION.md` | Defines 4 departments | **Rewrite:** Define unified workbench-departments (9 or consolidated to 4-5) | **Significant** |
| `.claude/actionflows/FLOWS.md` | Flows grouped by 4 departments | **Restructure:** Group flows by workbench-departments | **Moderate** |
| `.claude/actionflows/ACTIONS.md` | References department routing | **Update:** Documentation references | **Trivial** |
| `.claude/actionflows/README.md` | References departments | **Update:** Terminology | **Trivial** |
| `.claude/actionflows/ORCHESTRATOR.md` | Department routing logic in session-start | **Update:** Reference workbench-departments instead | **Moderate** |

#### CRITICAL - Shared Type Definitions (2 files)

| File | Current State | Required Changes | Complexity |
|------|---------------|------------------|------------|
| `packages/shared/src/workbenchTypes.ts` | 9 workbenches, session-capable flag | **Decision:** Keep all 9? Consolidate to 4-5? Add department metadata? | **Significant** |
| `packages/shared/src/index.ts` | Exports workbench types | **Update:** Export unified types | **Trivial** |

#### HIGH IMPACT - Contract & Parsing (5 files)

| File | Current State | Required Changes | Complexity |
|------|---------------|------------------|------------|
| `.claude/actionflows/CONTRACT.md` | Format 6.2: Department Routing Announcement | **Rename/Revise:** "Workbench Routing Announcement" or remove if internal | **Moderate** |
| `packages/shared/src/contract/types/statusFormats.ts` | `DepartmentRoutingParsed` interface | **Rename:** `WorkbenchRoutingParsed` with 9 workbench enum values | **Moderate** |
| `packages/shared/src/contract/parsers/statusParser.ts` | `parseDepartmentRouting()` function | **Rename/Update:** Parse workbench names instead | **Moderate** |
| `packages/shared/src/contract/patterns/statusPatterns.ts` | Regex for department names | **Update:** Regex to match 9 workbench names | **Trivial** |
| `packages/shared/src/contract/guards.ts` | Type guard for DepartmentRoutingParsed | **Update:** Guard for new type | **Trivial** |

#### MODERATE IMPACT - Frontend Components (3 files)

| File | Current State | Required Changes | Complexity |
|------|---------------|------------------|------------|
| `packages/app/src/components/Workbench/WorkbenchLayout.tsx` | Renders 9 workbenches | **Update:** Consolidated workbench rendering if count changes | **Moderate** |
| `packages/app/src/components/TopBar/TopBar.tsx` | 9 tabs from WORKBENCH_IDS | **Update:** Tab count/labels if workbenches change | **Moderate** |
| `packages/app/src/contexts/WorkbenchContext.tsx` | WorkbenchId type, 9 configs | **Update:** Type changes, config updates | **Moderate** |

#### LOW IMPACT - Onboarding & Documentation (8+ files)

| File | Current State | Required Changes | Complexity |
|------|---------------|------------------|------------|
| `.claude/actionflows/flows/framework/onboarding/modules/06-department-routing.md` | Teaching module for departments | **Rewrite:** Teach workbench-based routing | **Significant** |
| `.claude/actionflows/actions/onboarding/agent.md` | References department module | **Update:** Module reference | **Trivial** |
| `.claude/actionflows/flows/framework/onboarding/templates/*.md` | Reference departments | **Update:** Terminology | **Trivial** |
| `packages/app/src/components/SessionSidebar/README.md` | References workbenches | **Review:** Ensure consistency with new model | **Trivial** |
| `WORKBENCH_LAYOUT_INTEGRATION.md` | Workbench testing guide | **Review:** Update if workbench count/names change | **Trivial** |
| Analysis logs (50+ files) | Reference departments/workbenches | **No action needed:** Historical documents | **N/A** |

### 4.2 Backend Touchpoints (Currently Minimal)

**Good News:** Backend has NO direct department or workbench logic currently.

**Potential Future Touchpoints:**
- If workbench-department mapping is stored in the backend for persistence
- If session tagging by workbench is backend-driven
- If routing announcements are broadcast via WebSocket (CONTRACT.md Format 6.2)

**Current Backend Files:** 0 files require changes for unification

### 4.3 Summary by Complexity

| Complexity | File Count | Estimated Effort | Key Files |
|------------|------------|------------------|-----------|
| **Significant** | 3 | 8-12 hours | ORGANIZATION.md, workbenchTypes.ts, onboarding module 06 |
| **Moderate** | 10 | 6-8 hours | FLOWS.md, CONTRACT.md, contract parsers, layout components |
| **Trivial** | 10+ | 2-4 hours | README files, documentation, terminal updates |
| **N/A (logs)** | 50+ | 0 hours | Historical analysis logs |

**Total Estimated Effort for Full Unification:** 16-24 hours of focused implementation work

---

## Section 5: Unification Strategy Options

### Option A: Consolidate to 4 Workbench-Departments

**Concept:** Merge workbenches down to match 4 departments

| Workbench-Department | Icon | Purpose | Absorbs |
|----------------------|------|---------|---------|
| **Engineering** | 🔨 | All coding, bugs, refactoring | work + maintenance |
| **QA** | 👁️ | Reviews, audits, harmony checks | review + harmony |
| **Human** | 🔍 | Ideation, exploration, learning | explore |
| **Framework** | ⚙️ | Framework maintenance, settings, PM | settings + pm |

**Non-Session Workbenches Remain:**
- `archive` (historical sessions)
- `editor` (full-screen editing mode)

**Total Workbenches:** 6 (4 session-capable + 2 utility)

**Pros:**
- ✅ Clean 1:1 department-to-workbench mapping
- ✅ Simplified mental model
- ✅ Reduces tab clutter

**Cons:**
- ❌ Loses granularity (work vs maintenance distinction)
- ❌ Requires significant UI refactoring
- ❌ User retraining needed

### Option B: Expand to 9 Departments

**Concept:** Add 5 new departments to match 9 workbenches

| Department | Maps To Workbench | Purpose |
|------------|-------------------|---------|
| Engineering-Work | work | Active development |
| Engineering-Maintenance | maintenance | Bug fixes, refactoring |
| Exploration | explore | Research, learning |
| QA-Review | review | Code reviews, audits |
| Archive | archive | Historical sessions |
| Settings | settings | Configuration |
| PM | pm | Project management |
| Harmony | harmony | Contract compliance |
| Editor | editor | Full-screen editing |

**Pros:**
- ✅ Preserves all existing workbenches
- ✅ 1:1 mapping achieved
- ✅ No UI changes needed

**Cons:**
- ❌ Overkill for routing (9 departments is too granular)
- ❌ ORGANIZATION.md routing table becomes unwieldy
- ❌ Many departments would have minimal/no flows

### Option C: Hybrid Model (Recommended)

**Concept:** Keep 4 departments for routing, add metadata linking to workbenches

**Routing Layer (Departments):**
- Keep existing 4 departments in ORGANIZATION.md
- Each department has a `defaultWorkbench` property

**UI Layer (Workbenches):**
- Keep existing 9 workbenches
- Each workbench has a `department` property (nullable)

**Mapping:**
```typescript
interface WorkbenchConfig {
  id: WorkbenchId;
  department: DepartmentId | null; // NEW
  // ... existing fields
}

const WORKBENCH_DEPARTMENT_MAP = {
  work: 'Engineering',
  maintenance: 'Engineering',
  explore: 'Human',
  review: 'QA',
  archive: null, // No department
  settings: 'Framework',
  pm: null, // No department
  harmony: 'QA',
  editor: null, // No department
};
```

**Session Auto-Tagging:**
When orchestrator creates a session in a department, auto-tag it for the default workbench:
- Engineering → `work` workbench (user can move to `maintenance` manually)
- QA → `review` workbench
- Human → `explore` workbench
- Framework → `settings` workbench

**Pros:**
- ✅ Preserves existing routing logic (4 departments)
- ✅ Preserves existing UI structure (9 workbenches)
- ✅ Adds explicit connection via metadata
- ✅ Minimal code changes
- ✅ Sessions auto-route to appropriate workbench

**Cons:**
- ⚠️ Still maintains two taxonomies (not fully unified)
- ⚠️ Requires session tagging system in backend

**Implementation Touchpoints:**
1. Add `department` field to `WorkbenchConfig` type (1 file)
2. Add `defaultWorkbench` field to department definitions in ORGANIZATION.md (1 file)
3. Update orchestrator to tag sessions with workbench ID when creating (1 file)
4. Update WorkbenchLayout to filter sessions by workbench tag (1 file)
5. Update documentation to explain mapping (3 files)

**Estimated Effort:** 4-6 hours

---

## Recommendations

### Recommendation 1: Adopt Hybrid Model (Option C)

**Rationale:**
- Lowest disruption to existing code
- Preserves both taxonomies while creating explicit links
- Improves user experience (sessions auto-appear in correct workbench)
- Incremental path to full unification later if desired

**Action Items:**
1. Add department metadata to workbenchTypes.ts
2. Update ORGANIZATION.md with defaultWorkbench mappings
3. Implement session tagging in orchestrator
4. Update WorkbenchLayout to filter by tags
5. Document the mapping in CLAUDE.md and WORKBENCH_LAYOUT_INTEGRATION.md

### Recommendation 2: Add Department Context to Contract

**Current Gap:** Format 6.2 (Department Routing Announcement) is defined but never produced.

**Suggestion:** If orchestrator routing becomes user-visible (e.g., "Routing to Engineering Department..."), activate this format and update parsers.

**Otherwise:** Remove Format 6.2 from CONTRACT.md as unused.

### Recommendation 3: Extend Onboarding to Cover Workbenches

**Current State:** Module 06 teaches department routing, but workbenches aren't mentioned.

**Suggestion:** Add Module 12 (or extend Module 06) to teach:
- The 9 workbenches
- How departments map to workbenches
- How to organize sessions across workbenches

### Recommendation 4: Consider Future Full Unification

**Long-term vision:** If the project evolves toward a unified taxonomy, Option A (4 Workbench-Departments) is the cleanest endgame.

**Migration Path:**
1. Start with Hybrid Model (adds metadata)
2. Observe user patterns (do they use all 9 workbenches? or cluster in 4-5?)
3. Consolidate workbenches based on actual usage
4. Rename departments to match consolidated workbenches
5. Remove distinction entirely

**Timeline:** 6-12 months after Hybrid Model is stable

---

## Learnings

**Issue:** Department and workbench concepts exist in parallel but are not connected, creating a mental model mismatch for users.

**Root Cause:** Departments were designed for orchestrator routing (internal), workbenches for UI organization (external), without considering their conceptual overlap.

**Suggestion:** Add explicit metadata linking departments to workbenches (Hybrid Model) to bridge the gap. This preserves both taxonomies while improving user experience.

**[FRESH EYE]** The 4 session-capable workbenches (`work`, `maintenance`, `explore`, `review`) are the natural pivot point for unification. These are the only workbenches that conceptually overlap with departments. The other 5 workbenches (`archive`, `settings`, `pm`, `harmony`, `editor`) are pure UI organizational tools with no department equivalent. This suggests a hybrid approach is not just pragmatic—it's architecturally correct. Departments route work; session-capable workbenches contain work; utility workbenches organize artifacts. Three layers, not two.
