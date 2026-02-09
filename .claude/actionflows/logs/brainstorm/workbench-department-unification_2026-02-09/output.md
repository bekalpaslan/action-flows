# Workbench-Department Unification Models

**Brainstorm Session**
**Topic:** Workbench-Department Unification Architecture
**Classification:** Architecture / Design Decision
**Date:** 2026-02-09
**Context:** Based on analysis at `.claude/actionflows/logs/analyze/department-workbench-touchpoints_2026-02-09/report.md`

---

## Executive Summary

This document presents **4 distinct structural models** for unifying the concepts of "departments" (orchestrator routing layer) and "workbenches" (UI organization layer) in the ActionFlows Dashboard.

**Current State:**
- **4 Departments:** Framework, Engineering, QA, Human (routing logic)
- **9 Workbenches:** work, maintenance, explore, review, archive, settings, pm, harmony, editor (UI organization)
- **Zero connection** between them — parallel taxonomies with no synchronization

**Human's Goals:**
1. Simplify routing (one concept, not two)
2. UI matches orchestrator's mental model (what you see = how it routes)
3. Close the gap between "where work happens" (workbench) and "who owns it" (department)

**Models Presented:**
1. **Metadata Bridge** (Conservative) — Link existing concepts without structural change
2. **Department-First Consolidation** (Moderate) — Collapse 9 workbenches to 4 department-aligned spaces
3. **Three-Layer Architecture** (Radical) — Introduce "Domains" as the unified concept with separate routing/UI/utility layers
4. **Context-Native Routing** (Creative) — Eliminate departments entirely, route directly to workbench contexts

---

## Model 1: Metadata Bridge (Conservative)

**One-Sentence Pitch:**
Keep both taxonomies intact but add explicit bidirectional metadata linking them together.

---

### Unified Taxonomy

**No unified taxonomy** — departments and workbenches remain separate concepts.

**New Linking Metadata:**
```typescript
// In ORGANIZATION.md
interface DepartmentDefinition {
  name: 'Engineering' | 'QA' | 'Human' | 'Framework';
  owns: string[];
  triggers: string[];
  flows: string[];
  defaultWorkbench: WorkbenchId; // NEW
  allowedWorkbenches: WorkbenchId[]; // NEW
}

// In workbenchTypes.ts
interface WorkbenchConfig {
  id: WorkbenchId;
  icon: string;
  purpose: string;
  canHaveSessions: boolean;
  department: DepartmentId | null; // NEW
  acceptsDepartments: DepartmentId[]; // NEW
  // ... existing fields
}
```

**Mapping Table:**
| Department | Default Workbench | Allowed Workbenches |
|------------|-------------------|---------------------|
| Engineering | work | work, maintenance, explore |
| QA | review | review, harmony |
| Human | explore | explore, work |
| Framework | settings | settings, pm, harmony |

---

### How Routing Changes

**ORGANIZATION.md Changes:**
```markdown
## Engineering Department

**Owns:** Code, features, bug fixes, refactoring

**Default Workbench:** `work`
**Allowed Workbenches:** `work`, `maintenance`, `explore`

**Triggers:**
- "implement", "add feature", "create component"
- "fix bug", "resolve issue", "patch"
- "refactor", "optimize", "cleanup"

**Flows:** code-and-review/, bug-triage/, post-completion/
```

**Orchestrator Logic Changes:**
1. Parse request → Match trigger → Select department (unchanged)
2. **NEW:** Create session with `workbench: department.defaultWorkbench` tag
3. **NEW:** Broadcast routing announcement with both department AND workbench
4. Compile chain from department flows (unchanged)

**Example Orchestrator Output:**
```
>> Routing to Engineering Department
>> Session will appear in: work workbench
>> Compiling chain from: code-and-review/ flow
```

---

### How UI Changes

**WorkbenchContext Changes:**
```typescript
// Add session filtering by workbench tag
const sessionsByWorkbench = useMemo(() => {
  return sessions.filter(s => s.workbenchTag === activeWorkbench);
}, [sessions, activeWorkbench]);
```

**TopBar Changes:**
```typescript
// Add department badge to workbench tabs
<WorkbenchTab
  workbench={workbench}
  department={workbenchConfig.department} // Show "Engineering" badge on work/maintenance tabs
  sessionCount={sessionCount}
  hasNotifications={hasNotifications}
/>
```

**SessionSidebar Changes:**
```typescript
// Show department origin for each session
<SessionCard
  session={session}
  department={session.metadata.department} // "Created via Engineering routing"
/>
```

**Files Modified:**
- `packages/app/src/contexts/WorkbenchContext.tsx` — Add filtering logic
- `packages/app/src/components/TopBar/WorkbenchTab.tsx` — Add department badge
- `packages/app/src/components/SessionSidebar/SessionSidebarItem.tsx` — Show department origin

---

### Shared Types

```typescript
// packages/shared/src/workbenchTypes.ts
export const DEPARTMENT_IDS = ['Engineering', 'QA', 'Human', 'Framework'] as const;
export type DepartmentId = typeof DEPARTMENT_IDS[number];

export interface WorkbenchConfig {
  id: WorkbenchId;
  icon: string;
  purpose: string;
  canHaveSessions: boolean;
  notificationsEnabled: boolean;
  glowColor?: string;

  // NEW: Department linking
  department: DepartmentId | null; // Which department "owns" this workbench
  acceptsDepartments: DepartmentId[]; // Which departments can route sessions here
}

export const WORKBENCH_DEPARTMENT_MAP: Record<WorkbenchId, {
  department: DepartmentId | null;
  accepts: DepartmentId[];
}> = {
  work: { department: 'Engineering', accepts: ['Engineering', 'Human'] },
  maintenance: { department: 'Engineering', accepts: ['Engineering'] },
  explore: { department: 'Human', accepts: ['Human', 'Engineering'] },
  review: { department: 'QA', accepts: ['QA'] },
  archive: { department: null, accepts: [] }, // Utility workbench
  settings: { department: 'Framework', accepts: ['Framework'] },
  pm: { department: null, accepts: [] }, // Utility workbench
  harmony: { department: 'QA', accepts: ['QA', 'Framework'] },
  editor: { department: null, accepts: [] }, // Utility workbench
};

// packages/shared/src/sessionTypes.ts
export interface SessionMetadata {
  // ... existing fields
  department?: DepartmentId; // NEW: Which department created this session
  workbenchTag?: WorkbenchId; // NEW: Which workbench should display this session
}
```

**New Export:**
```typescript
// packages/shared/src/index.ts
export type { DepartmentId } from './workbenchTypes';
export { DEPARTMENT_IDS, WORKBENCH_DEPARTMENT_MAP } from './workbenchTypes';
```

---

### Migration Complexity

**Files Affected:** 12 files

**Breakdown:**
- **Framework files (5):** ORGANIZATION.md, FLOWS.md, ORCHESTRATOR.md, README.md, onboarding module 06
- **Shared types (2):** workbenchTypes.ts, sessionTypes.ts
- **Frontend components (3):** WorkbenchContext.tsx, WorkbenchTab.tsx, SessionSidebarItem.tsx
- **Documentation (2):** WORKBENCH_LAYOUT_INTEGRATION.md, SessionSidebar README

**Estimated Effort:** 6-8 hours
- 2 hours: Add metadata to types
- 2 hours: Update ORGANIZATION.md with mappings
- 2 hours: Implement session tagging in orchestrator
- 2 hours: Update UI components to display department context

**Risk Level:** Low — additive changes only, no breaking changes

---

### Pros and Cons

**Pros:**
- ✅ **Zero breaking changes** — both taxonomies remain intact
- ✅ **Minimal code changes** — additive metadata only
- ✅ **Immediate value** — sessions auto-route to correct workbench
- ✅ **Reversible** — can remove metadata if this doesn't work
- ✅ **Incremental** — can evolve to more radical models later
- ✅ **Low risk** — nothing breaks if metadata is wrong
- ✅ **User-facing clarity** — users see which department created their session
- ✅ **Backward compatible** — old sessions without tags still work

**Cons:**
- ❌ **Still two concepts** — doesn't achieve true unification
- ❌ **Cognitive overhead** — users must understand both departments AND workbenches
- ❌ **Partial solution** — doesn't simplify routing (goal 1 not fully met)
- ❌ **Mapping maintenance** — need to keep department-workbench mappings in sync
- ⚠️ **Ambiguous cases** — what if Engineering creates a session but user wants it in explore?
- ⚠️ **Doesn't reduce tab count** — still 9 workbenches in UI

---

### Routing Trace Example

**User Request:** "fix the login bug"

**Full Path:**

1. **Orchestrator receives request:** "fix the login bug"
2. **Trigger matching:** "fix" → matches Engineering trigger "fix bug"
3. **Department selection:** Engineering Department
4. **Workbench assignment:** defaultWorkbench = `work` (Engineering's default)
5. **Flow lookup:** FLOWS.md → Engineering section → bug-triage/ flow
6. **Chain compilation:**
   - analyze/backend/bugs → plan/fix-approach → code/backend/fix-login → review/code-quality
7. **Session creation:**
   ```typescript
   {
     id: 'sess_abc123',
     chainId: 'chain_def456',
     metadata: {
       department: 'Engineering', // NEW
       workbenchTag: 'work', // NEW
     }
   }
   ```
8. **Orchestrator output:**
   ```
   >> Routing to Engineering Department
   >> Session will appear in: work workbench
   >> Compiling chain: analyze → plan → code → review
   ```
9. **UI Response:**
   - SessionSidebar in `work` workbench automatically shows new session
   - WorkbenchTab badge shows "Engineering" on `work` tab
   - SessionCard displays "Created via Engineering routing"
10. **User Experience:** User clicks `work` tab, sees login bug session already there

**User Override:** User can drag session to `maintenance` tab if they prefer (maintenance accepts Engineering department)

---

## Model 2: Department-First Consolidation (Moderate)

**One-Sentence Pitch:**
Collapse 9 workbenches down to 4 department-aligned spaces, achieving a clean 1:1 mapping at the cost of UI granularity.

---

### Unified Taxonomy

**New Concept: Department-Workbenches**

**The 4 Department-Workbenches:**

| ID | Name | Icon | Purpose | Absorbs (Old Workbenches) | Session-Capable |
|----|------|------|---------|---------------------------|-----------------|
| `engineering` | Engineering | 🔨 | All coding: features, bugs, refactoring | work + maintenance | ✅ Yes |
| `qa` | Quality Assurance | 👁️ | All reviews: code reviews, audits, harmony | review + harmony | ✅ Yes |
| `human` | Ideation | 🔍 | Exploration, research, brainstorming | explore | ✅ Yes |
| `framework` | Framework | ⚙️ | ActionFlows maintenance, settings, PM | settings + pm | ✅ Yes |

**Utility Workbenches (Remain Separate):**

| ID | Name | Icon | Purpose | Session-Capable |
|----|------|------|---------|-----------------|
| `archive` | Archive | 📦 | Completed sessions from all departments | ❌ No |
| `editor` | Editor | 📝 | Full-screen code editing | ❌ No |

**Total Workbenches:** 6 (4 department-workbenches + 2 utility)

---

### How Routing Changes

**ORGANIZATION.md Restructure:**

```markdown
# ActionFlows Organization

## Department-Workbenches

ActionFlows is organized into **4 department-workbenches** that unify routing and UI.

### Engineering Department-Workbench

**Icon:** 🔨
**Purpose:** All coding activities — features, bugs, refactoring, optimization

**Triggers:**
- Features: "implement", "add", "create", "build"
- Bugs: "fix", "resolve", "patch", "debug"
- Refactoring: "refactor", "optimize", "cleanup", "improve"

**Flows:**
- code-and-review/ — Standard feature implementation
- bug-triage/ — Bug investigation and fix
- post-completion/ — Post-deployment tasks

**Session Types:**
- Active development (formerly: work)
- Maintenance tasks (formerly: maintenance)

---

### QA Department-Workbench

**Icon:** 👁️
**Purpose:** All quality assurance — code reviews, audits, security scans, harmony checks

**Triggers:**
- Reviews: "review", "audit", "check quality"
- Security: "security scan", "vulnerability check"
- Harmony: "check contract", "detect sins", "validate harmony"

**Flows:**
- audit-and-fix/ — Quality audits with remediation
- harmony-enforcement/ — Contract compliance

**Session Types:**
- Code reviews (formerly: review)
- Harmony violations (formerly: harmony dashboard → now session-based)

---

### Human Department-Workbench

**Icon:** 🔍
**Purpose:** Ideation, exploration, research, learning

**Triggers:**
- Ideation: "I have an idea", "brainstorm", "explore"
- Learning: "teach me", "explain", "how does X work"
- Research: "investigate", "analyze", "understand"

**Flows:**
- ideation/ — Structured brainstorming
- doc-reorganization/ — Documentation work

**Session Types:**
- Brainstorming sessions
- Research explorations (formerly: explore)

---

### Framework Department-Workbench

**Icon:** ⚙️
**Purpose:** ActionFlows framework maintenance, configuration, project management

**Triggers:**
- Framework: "create flow", "create action", "onboard me"
- Settings: "configure", "set up", "change settings"
- PM: "plan roadmap", "track tasks", "organize work"

**Flows:**
- onboarding/ — Framework teaching
- flow-creation/ — Creating new flows
- action-creation/ — Creating new actions
- framework-health/ — Health checks
- planning/ — Roadmap planning

**Session Types:**
- Framework development (formerly: settings)
- Project planning (formerly: pm)
```

**Orchestrator Logic Changes:**
1. Parse request → Match trigger → Select department-workbench (renamed from "department")
2. Create session with `workbench: selectedDepartmentWorkbench` (automatic, not a tag)
3. UI automatically displays session in the correct tab (no routing announcement needed)
4. Compile chain from department-workbench flows

**Removed:** Separate concept of "department" vs "workbench"

---

### How UI Changes

**TopBar Restructure:**

**Before (9 tabs):**
```
🔨 Work | 🔧 Maintenance | 🔍 Explore | 👁️ Review | 📦 Archive | ⚙️ Settings | 📋 PM | 🎵 Harmony | 📝 Editor
```

**After (6 tabs):**
```
🔨 Engineering | 👁️ QA | 🔍 Ideation | ⚙️ Framework | 📦 Archive | 📝 Editor
```

**WorkbenchLayout Changes:**
```typescript
// Simplified workbench rendering
const renderDepartmentWorkbench = (deptWorkbench: DepartmentWorkbenchId) => {
  const sessions = useSessionsByDepartmentWorkbench(deptWorkbench);

  return (
    <DepartmentWorkbenchView
      departmentWorkbench={deptWorkbench}
      sessions={sessions}
      onCreateSession={() => createSession(deptWorkbench)}
    />
  );
};
```

**Session Filtering:**
```typescript
// Engineering workbench shows ALL engineering sessions (features, bugs, refactors)
// Users can filter/sort within the workbench
<EngineeringWorkbench>
  <SessionFilters>
    <Filter type="active-dev" label="Active Development" /> {/* Formerly: work */}
    <Filter type="maintenance" label="Maintenance" /> {/* Formerly: maintenance */}
    <Filter type="all" label="All Engineering" />
  </SessionFilters>
  <SessionList sessions={engineeringSessions} />
</EngineeringWorkbench>
```

**Harmony Workbench → QA Subsection:**
- Harmony violations become **session types** within QA workbench
- Harmony dashboard becomes a **view mode** in QA (toggle: "Sessions" vs "Violations")

**PM Workbench → Framework Subsection:**
- Project planning becomes **session types** within Framework workbench
- PM dashboard becomes a **view mode** in Framework (toggle: "Sessions" vs "Roadmap")

---

### Shared Types

```typescript
// packages/shared/src/workbenchTypes.ts

// REMOVED: Old 9-workbench system
// NEW: 4 department-workbenches + 2 utilities

export const DEPARTMENT_WORKBENCH_IDS = [
  'engineering',
  'qa',
  'human',
  'framework',
] as const;

export type DepartmentWorkbenchId = typeof DEPARTMENT_WORKBENCH_IDS[number];

export const UTILITY_WORKBENCH_IDS = ['archive', 'editor'] as const;
export type UtilityWorkbenchId = typeof UTILITY_WORKBENCH_IDS[number];

export type WorkbenchId = DepartmentWorkbenchId | UtilityWorkbenchId;

export interface DepartmentWorkbenchConfig {
  id: DepartmentWorkbenchId;
  name: string;
  icon: string;
  purpose: string;
  triggers: string[]; // Moved from ORGANIZATION.md
  flows: string[]; // Moved from FLOWS.md
  sessionTypes: SessionType[]; // NEW: Types of sessions within this workbench
  glowColor: string;
}

export type SessionType =
  | 'active-dev' | 'maintenance' // Engineering
  | 'code-review' | 'audit' | 'harmony-check' // QA
  | 'brainstorm' | 'research' // Human
  | 'framework-dev' | 'planning'; // Framework

export interface SessionMetadata {
  // ... existing fields
  departmentWorkbench: DepartmentWorkbenchId;
  sessionType: SessionType;
}

export const DEPARTMENT_WORKBENCH_CONFIGS: Record<DepartmentWorkbenchId, DepartmentWorkbenchConfig> = {
  engineering: {
    id: 'engineering',
    name: 'Engineering',
    icon: '🔨',
    purpose: 'All coding activities',
    triggers: ['implement', 'fix', 'refactor', 'add', 'create', 'build', 'patch', 'debug'],
    flows: ['code-and-review/', 'bug-triage/', 'post-completion/'],
    sessionTypes: ['active-dev', 'maintenance'],
    glowColor: '#4caf50',
  },
  qa: {
    id: 'qa',
    name: 'Quality Assurance',
    icon: '👁️',
    purpose: 'All quality assurance',
    triggers: ['review', 'audit', 'check quality', 'security scan', 'check contract'],
    flows: ['audit-and-fix/', 'harmony-enforcement/'],
    sessionTypes: ['code-review', 'audit', 'harmony-check'],
    glowColor: '#9c27b0',
  },
  human: {
    id: 'human',
    name: 'Ideation',
    icon: '🔍',
    purpose: 'Ideation, exploration, research',
    triggers: ['I have an idea', 'brainstorm', 'explore', 'teach me', 'investigate'],
    flows: ['ideation/', 'doc-reorganization/'],
    sessionTypes: ['brainstorm', 'research'],
    glowColor: '#2196f3',
  },
  framework: {
    id: 'framework',
    name: 'Framework',
    icon: '⚙️',
    purpose: 'ActionFlows maintenance and PM',
    triggers: ['create flow', 'create action', 'onboard me', 'configure', 'plan roadmap'],
    flows: ['onboarding/', 'flow-creation/', 'action-creation/', 'framework-health/', 'planning/'],
    sessionTypes: ['framework-dev', 'planning'],
    glowColor: '#ff9800',
  },
};
```

---

### Migration Complexity

**Files Affected:** 23 files

**Breakdown:**
- **Framework files (6):** ORGANIZATION.md (major rewrite), FLOWS.md (restructure), ORCHESTRATOR.md, README.md, CONTRACT.md (remove Format 6.2), onboarding module 06 (rewrite)
- **Shared types (3):** workbenchTypes.ts (major refactor), sessionTypes.ts, index.ts
- **Frontend components (8):** WorkbenchLayout.tsx (rewrite), TopBar.tsx (6 tabs not 9), WorkbenchTab.tsx, SessionSidebar.tsx, SessionSidebarItem.tsx, WorkbenchContext.tsx (new state shape), EngineeringWorkbench.tsx (NEW), QAWorkbench.tsx (NEW)
- **Backend (2):** Session creation logic, WebSocket event types
- **Documentation (4):** WORKBENCH_LAYOUT_INTEGRATION.md, SessionSidebar README, CLAUDE.md, MEMORY.md

**Estimated Effort:** 20-28 hours
- 4 hours: Rewrite ORGANIZATION.md and FLOWS.md
- 4 hours: Refactor workbenchTypes.ts and session types
- 8 hours: Rewrite WorkbenchLayout and create new department-workbench components
- 4 hours: Update TopBar to 6 tabs, add session type filtering
- 2 hours: Update backend session creation
- 2 hours: Rewrite onboarding module 06
- 4 hours: Update all documentation

**Risk Level:** High — breaking changes to core taxonomy

---

### Pros and Cons

**Pros:**
- ✅ **True unification** — one concept replaces two (achieves goal 1)
- ✅ **UI matches mental model** — what you see = how it routes (achieves goal 2)
- ✅ **Simplified navigation** — 6 tabs instead of 9
- ✅ **Clearer organization** — every session has a single home
- ✅ **Reduced cognitive load** — users don't juggle two taxonomies
- ✅ **Elegant architecture** — department-workbenches are load-bearing in both routing and UI
- ✅ **Scalable** — adding a new department-workbench adds both routing and UI
- ✅ **No mapping maintenance** — routing and UI are the same concept

**Cons:**
- ❌ **Loses granularity** — can't distinguish "work" from "maintenance" at tab level
- ❌ **Breaking changes** — all workbench-dependent code must change
- ❌ **User retraining** — existing users must learn new tab structure
- ❌ **Migration required** — old sessions must be re-tagged with new workbench IDs
- ❌ **Harmony/PM demoted** — from dedicated workbenches to subsections
- ⚠️ **Session type complexity** — users must filter within workbench (more clicks)
- ⚠️ **High effort** — 20-28 hours of implementation time
- ⚠️ **Higher risk** — many breaking changes

---

### Routing Trace Example

**User Request:** "fix the login bug"

**Full Path:**

1. **Orchestrator receives request:** "fix the login bug"
2. **Trigger matching:** "fix" → matches Engineering department-workbench trigger
3. **Department-workbench selection:** `engineering`
4. **Session type inference:** "bug" → sessionType = `maintenance`
5. **Flow lookup:** ORGANIZATION.md → Engineering section → bug-triage/ flow
6. **Chain compilation:**
   - analyze/backend/bugs → plan/fix-approach → code/backend/fix-login → review/code-quality
7. **Session creation:**
   ```typescript
   {
     id: 'sess_abc123',
     chainId: 'chain_def456',
     departmentWorkbench: 'engineering', // Directly stored, not a tag
     sessionType: 'maintenance', // Inferred from "bug"
   }
   ```
8. **Orchestrator output:**
   ```
   >> Routing to Engineering
   >> Compiling chain: analyze → plan → code → review
   ```
   (No separate routing announcement — workbench IS the department)
9. **UI Response:**
   - SessionSidebar in `engineering` workbench automatically shows new session
   - User can filter to show only `maintenance` type sessions
   - Session badge shows "Maintenance" type
10. **User Experience:** User clicks `engineering` tab, sees all coding sessions (features, bugs, refactors), can filter to "Maintenance" to see only bug fixes

**No Override Needed:** Session belongs to Engineering workbench, period. User organizes via session types and filters.

---

## Model 3: Three-Layer Architecture (Radical)

**One-Sentence Pitch:**
Introduce "Domains" as the unified routing/UI concept, then split workbenches into session-capable "Domain Workbenches" and non-session "Utility Workbenches."

---

### Unified Taxonomy

**New Concept: Domains**

**The Hierarchy:**
```
Domains (routing + UI alignment)
├── Domain Workbenches (session-capable, routable)
└── Utility Workbenches (non-session, UI-only)
```

**The 4 Domains:**

| Domain ID | Name | Icon | Purpose | Routes Sessions? |
|-----------|------|------|---------|------------------|
| `engineering` | Engineering | 🔨 | All coding activities | ✅ Yes |
| `qa` | Quality Assurance | 👁️ | All quality activities | ✅ Yes |
| `human` | Ideation | 🔍 | All creative/exploratory activities | ✅ Yes |
| `framework` | Framework | ⚙️ | All framework maintenance activities | ✅ Yes |

**The 4 Domain Workbenches (1:1 with Domains):**

| Workbench ID | Domain | Session-Capable | Purpose |
|--------------|--------|-----------------|---------|
| `engineering` | engineering | ✅ Yes | Active coding sessions |
| `qa` | qa | ✅ Yes | Active review sessions |
| `human` | human | ✅ Yes | Active ideation sessions |
| `framework` | framework | ✅ Yes | Active framework sessions |

**The 5 Utility Workbenches (Non-Routable):**

| Workbench ID | Icon | Purpose | Session-Capable |
|--------------|------|---------|-----------------|
| `archive` | 📦 | Completed sessions from all domains | ❌ No |
| `violations` | 🎵 | Harmony violations dashboard | ❌ No |
| `roadmap` | 📋 | Project management dashboard | ❌ No |
| `settings` | ⚙️ | Configuration and preferences | ❌ No |
| `editor` | 📝 | Full-screen code editing | ❌ No |

**Total Workbenches:** 9 (4 domain workbenches + 5 utility workbenches)

**Key Insight:** This model acknowledges the analysis's "Fresh Eye" finding — there are THREE layers, not two:
1. **Domains** — Routing logic (what owns this work?)
2. **Domain Workbenches** — Session containers (where does active work live?)
3. **Utility Workbenches** — Artifact organizers (where do non-session artifacts live?)

---

### How Routing Changes

**ORGANIZATION.md → DOMAINS.md (Rename + Restructure):**

```markdown
# ActionFlows Domains

ActionFlows uses **domains** to organize work. Each domain represents a distinct area of ownership and routes sessions to its corresponding domain workbench.

## Domain Architecture

**3 Layers:**
1. **Domains** — Routing logic (4 domains)
2. **Domain Workbenches** — Session-capable UI tabs (4 workbenches, 1:1 with domains)
3. **Utility Workbenches** — Non-session UI tabs (5 workbenches)

---

## The 4 Domains

### Engineering Domain

**Icon:** 🔨
**Routes to:** `engineering` domain workbench

**Owns:**
- Feature implementation
- Bug fixes
- Refactoring and optimization
- Technical debt

**Triggers:**
- "implement", "add feature", "create", "build"
- "fix bug", "resolve", "patch", "debug"
- "refactor", "optimize", "cleanup"

**Flows:**
- code-and-review/
- bug-triage/
- post-completion/

**Session Lifecycle:**
- Created in: `engineering` workbench
- Moved to on completion: `archive` workbench

---

### QA Domain

**Icon:** 👁️
**Routes to:** `qa` domain workbench

**Owns:**
- Code reviews
- Quality audits
- Security scans
- Performance testing

**Triggers:**
- "review", "code review", "audit"
- "security scan", "check quality"

**Flows:**
- audit-and-fix/

**Session Lifecycle:**
- Created in: `qa` workbench
- Violations tracked in: `violations` utility workbench (separate from sessions)
- Moved to on completion: `archive` workbench

---

### Human Domain

**Icon:** 🔍
**Routes to:** `human` domain workbench

**Owns:**
- Ideation and brainstorming
- Research and exploration
- Learning and documentation

**Triggers:**
- "I have an idea", "brainstorm"
- "explore", "investigate", "research"
- "teach me", "explain"

**Flows:**
- ideation/
- doc-reorganization/

**Session Lifecycle:**
- Created in: `human` workbench
- Moved to on completion: `archive` workbench

---

### Framework Domain

**Icon:** ⚙️
**Routes to:** `framework` domain workbench

**Owns:**
- ActionFlows framework development
- Flow and action creation
- Framework health and maintenance

**Triggers:**
- "create flow", "create action"
- "onboard me", "teach framework"
- "check framework health"

**Flows:**
- onboarding/
- flow-creation/
- action-creation/
- framework-health/

**Session Lifecycle:**
- Created in: `framework` workbench
- Planning tracked in: `roadmap` utility workbench (separate from sessions)
- Moved to on completion: `archive` workbench

---

## Utility Workbenches (Non-Routable)

These workbenches do NOT receive routed sessions. They are UI-only organizational tools.

| Workbench | Purpose | Accepts Sessions? |
|-----------|---------|-------------------|
| archive | Historical completed sessions | No (auto-moved) |
| violations | Harmony violations dashboard | No (artifact view) |
| roadmap | Project planning dashboard | No (artifact view) |
| settings | Configuration | No (UI-only) |
| editor | Full-screen editing | No (UI-only) |
```

**Orchestrator Logic Changes:**
1. Parse request → Match trigger → Select **domain**
2. Domain → Domain workbench (1:1 mapping, automatic)
3. Create session in domain workbench
4. Compile chain from domain flows

**Key Difference from Model 2:** Explicit separation of "domain" (routing concept) from "domain workbench" (UI concept), even though they're 1:1. This allows for future flexibility (e.g., multiple workbenches per domain).

---

### How UI Changes

**TopBar Structure:**

**Session-Capable Tabs (Domain Workbenches):**
```
🔨 Engineering | 👁️ QA | 🔍 Ideation | ⚙️ Framework
```

**Utility Tabs (Non-Routable):**
```
📦 Archive | 🎵 Violations | 📋 Roadmap | ⚙️ Settings | 📝 Editor
```

**Visual Separation:**
- Domain workbenches have **glow animations** when active sessions exist
- Utility workbenches have **static styling** (no glow, no session counts)

**WorkbenchLayout Changes:**
```typescript
type WorkbenchCategory = 'domain' | 'utility';

interface WorkbenchLayoutProps {
  activeWorkbench: WorkbenchId;
  workbenchCategory: WorkbenchCategory; // NEW
}

const WorkbenchLayout: React.FC<WorkbenchLayoutProps> = ({ activeWorkbench, workbenchCategory }) => {
  if (workbenchCategory === 'domain') {
    return (
      <DomainWorkbenchView
        domain={activeWorkbench as DomainWorkbenchId}
        sessions={useSessionsByDomain(activeWorkbench)}
        showSessionSidebar={true}
      />
    );
  } else {
    return (
      <UtilityWorkbenchView
        utility={activeWorkbench as UtilityWorkbenchId}
        showSessionSidebar={false}
      />
    );
  }
};
```

**SessionSidebar Visibility:**
- **Domain workbenches:** Always show SessionSidebar (4 workbenches)
- **Utility workbenches:** Never show SessionSidebar (5 workbenches)

**Harmony Workbench → Violations Utility:**
- Harmony violations are **artifacts** (not sessions)
- Violations workbench is read-only dashboard
- QA sessions that detect violations link to violations workbench

**PM Workbench → Roadmap Utility:**
- Roadmap/planning artifacts are non-session
- Roadmap workbench is dashboard view
- Framework sessions that produce planning outputs link to roadmap workbench

---

### Shared Types

```typescript
// packages/shared/src/domainTypes.ts (NEW FILE)

export const DOMAIN_IDS = ['engineering', 'qa', 'human', 'framework'] as const;
export type DomainId = typeof DOMAIN_IDS[number];

export interface DomainConfig {
  id: DomainId;
  name: string;
  icon: string;
  purpose: string;
  owns: string[];
  triggers: string[];
  flows: string[];
  routesToWorkbench: DomainWorkbenchId; // 1:1 mapping
}

export const DOMAIN_CONFIGS: Record<DomainId, DomainConfig> = {
  engineering: {
    id: 'engineering',
    name: 'Engineering',
    icon: '🔨',
    purpose: 'All coding activities',
    owns: ['Features', 'Bug fixes', 'Refactoring', 'Technical debt'],
    triggers: ['implement', 'fix', 'refactor', 'add', 'build', 'patch', 'debug'],
    flows: ['code-and-review/', 'bug-triage/', 'post-completion/'],
    routesToWorkbench: 'engineering',
  },
  // ... qa, human, framework
};

// packages/shared/src/workbenchTypes.ts (REFACTORED)

export const DOMAIN_WORKBENCH_IDS = ['engineering', 'qa', 'human', 'framework'] as const;
export type DomainWorkbenchId = typeof DOMAIN_WORKBENCH_IDS[number];

export const UTILITY_WORKBENCH_IDS = ['archive', 'violations', 'roadmap', 'settings', 'editor'] as const;
export type UtilityWorkbenchId = typeof UTILITY_WORKBENCH_IDS[number];

export type WorkbenchId = DomainWorkbenchId | UtilityWorkbenchId;

export interface DomainWorkbenchConfig {
  id: DomainWorkbenchId;
  category: 'domain';
  domain: DomainId; // 1:1 back-reference
  icon: string;
  purpose: string;
  canHaveSessions: true; // Always true for domain workbenches
  glowColor: string;
}

export interface UtilityWorkbenchConfig {
  id: UtilityWorkbenchId;
  category: 'utility';
  icon: string;
  purpose: string;
  canHaveSessions: false; // Always false for utility workbenches
}

export type WorkbenchConfig = DomainWorkbenchConfig | UtilityWorkbenchConfig;

export const isDomainWorkbench = (id: WorkbenchId): id is DomainWorkbenchId => {
  return DOMAIN_WORKBENCH_IDS.includes(id as DomainWorkbenchId);
};

export const isUtilityWorkbench = (id: WorkbenchId): id is UtilityWorkbenchId => {
  return UTILITY_WORKBENCH_IDS.includes(id as UtilityWorkbenchId);
};

// packages/shared/src/sessionTypes.ts
export interface SessionMetadata {
  // ... existing fields
  domain: DomainId; // Which domain routed this session
  workbench: DomainWorkbenchId; // Which domain workbench contains this session (always 1:1 with domain)
}

// packages/shared/src/index.ts
export * from './domainTypes';
export * from './workbenchTypes';
export * from './sessionTypes';
```

---

### Migration Complexity

**Files Affected:** 28 files

**Breakdown:**
- **Framework files (7):** ORGANIZATION.md → DOMAINS.md (rename + rewrite), FLOWS.md (restructure by domain), ORCHESTRATOR.md, README.md, INDEX.md (add DOMAINS.md), onboarding module 06 (rewrite), new onboarding module for utility workbenches
- **Shared types (4):** domainTypes.ts (NEW), workbenchTypes.ts (major refactor), sessionTypes.ts, index.ts
- **Frontend components (10):** WorkbenchLayout.tsx (category-based rendering), TopBar.tsx (visual separation), WorkbenchTab.tsx (domain vs utility styling), DomainWorkbenchView.tsx (NEW), UtilityWorkbenchView.tsx (NEW), ViolationsWorkbench.tsx (rename from Harmony), RoadmapWorkbench.tsx (rename from PM), WorkbenchContext.tsx (new state shape), SessionSidebar.tsx (conditional visibility), SessionSidebarItem.tsx
- **Backend (3):** Session creation with domain metadata, WebSocket events, domain-based filtering
- **Documentation (4):** WORKBENCH_LAYOUT_INTEGRATION.md, SessionSidebar README, CLAUDE.md, MEMORY.md

**Estimated Effort:** 30-40 hours
- 6 hours: Create DOMAINS.md, refactor FLOWS.md, update framework files
- 6 hours: Create domainTypes.ts, refactor workbenchTypes.ts
- 12 hours: Refactor WorkbenchLayout with category-based rendering, create DomainWorkbenchView + UtilityWorkbenchView
- 4 hours: Update TopBar with visual separation
- 4 hours: Refactor Harmony → Violations and PM → Roadmap
- 3 hours: Update backend session creation
- 3 hours: Rewrite onboarding modules
- 4 hours: Update all documentation

**Risk Level:** Very High — fundamental taxonomy change with new concepts

---

### Pros and Cons

**Pros:**
- ✅ **Architecturally correct** — acknowledges the three-layer reality (domains, domain workbenches, utility workbenches)
- ✅ **Explicit separation of concerns** — routing (domains) vs session UI (domain workbenches) vs artifact UI (utility workbenches)
- ✅ **UI clarity** — visual separation between session-capable and utility workbenches
- ✅ **Future-proof** — allows multiple domain workbenches per domain later (e.g., split Engineering into Features vs Bugs)
- ✅ **Semantic precision** — "violations" and "roadmap" are artifacts, not session containers
- ✅ **Extensible** — new domains can be added cleanly
- ✅ **Consistent mental model** — domains route, domain workbenches contain, utilities organize

**Cons:**
- ❌ **Highest complexity** — introduces new "domain" concept separate from workbenches
- ❌ **Steepest learning curve** — users must understand domains vs domain workbenches vs utility workbenches
- ❌ **Most code changes** — new file (domainTypes.ts), major refactors across all layers
- ❌ **Longest migration** — 30-40 hours of implementation
- ❌ **Over-engineered?** — is the domain/workbench split necessary if they're 1:1?
- ⚠️ **Conceptual overhead** — "domain workbench" is redundant if 1:1 with domain
- ⚠️ **Very high risk** — many breaking changes, new abstractions

---

### Routing Trace Example

**User Request:** "fix the login bug"

**Full Path:**

1. **Orchestrator receives request:** "fix the login bug"
2. **Trigger matching:** "fix" → matches Engineering domain trigger
3. **Domain selection:** `engineering` domain
4. **Domain workbench mapping:** engineering domain → `engineering` domain workbench (1:1)
5. **Flow lookup:** DOMAINS.md → Engineering domain → bug-triage/ flow
6. **Chain compilation:**
   - analyze/backend/bugs → plan/fix-approach → code/backend/fix-login → review/code-quality
7. **Session creation:**
   ```typescript
   {
     id: 'sess_abc123',
     chainId: 'chain_def456',
     domain: 'engineering', // Routing layer
     workbench: 'engineering', // UI layer (1:1 with domain)
   }
   ```
8. **Orchestrator output:**
   ```
   >> Routing to Engineering domain
   >> Session created in: engineering workbench
   >> Compiling chain: analyze → plan → code → review
   ```
9. **UI Response:**
   - SessionSidebar in `engineering` domain workbench shows new session
   - Engineering tab glows (session-capable domain workbench)
   - Archive, Violations, Roadmap, Settings, Editor tabs remain static (utility workbenches)
10. **User Experience:** User clicks `Engineering` tab (domain workbench), sees login bug session. User cannot accidentally try to add sessions to `Violations` or `Roadmap` (utility workbenches).

**Lifecycle:**
- Session completes → Auto-moved to `archive` utility workbench
- If session detects harmony violations → Creates violation artifact in `violations` utility workbench (linked to session)
- If session produces roadmap updates → Creates planning artifact in `roadmap` utility workbench (linked to session)

---

## Model 4: Context-Native Routing (Creative)

**One-Sentence Pitch:**
Eliminate departments entirely — route directly to workbench contexts based on user intent, treating workbenches as first-class routing destinations.

---

### Unified Taxonomy

**New Concept: Workbench Contexts**

**No departments.** Workbenches become the ONLY taxonomy — both routing destinations AND UI tabs.

**The 9 Workbench Contexts:**

| Context ID | Icon | Purpose | Routable? | Triggers |
|------------|------|---------|-----------|----------|
| `work` | 🔨 | Active feature development | ✅ Yes | "implement feature", "build X", "add Y" |
| `maintenance` | 🔧 | Bug fixes, refactoring, housekeeping | ✅ Yes | "fix bug", "refactor", "cleanup", "optimize" |
| `explore` | 🔍 | Research, exploration, learning | ✅ Yes | "explore", "research", "investigate", "learn" |
| `review` | 👁️ | Code reviews, audits | ✅ Yes | "review PR", "audit code", "check quality" |
| `archive` | 📦 | Completed sessions | ❌ No | (auto-target on completion) |
| `settings` | ⚙️ | Configuration, framework dev | ✅ Yes | "configure", "create flow", "create action" |
| `pm` | 📋 | Project planning, roadmaps | ✅ Yes | "plan roadmap", "organize tasks", "track work" |
| `harmony` | 🎵 | Harmony violations, sin detection | ❌ No | (auto-target on violation detection) |
| `editor` | 📝 | Full-screen code editing | ❌ No | (manual navigation only) |

**Routable Contexts:** 6 (work, maintenance, explore, review, settings, pm)
**Auto-Target Contexts:** 2 (archive, harmony)
**Manual-Only Contexts:** 1 (editor)

**Key Insight:** User intent DIRECTLY maps to workbench context. No intermediate "department" layer.

---

### How Routing Changes

**ORGANIZATION.md → CONTEXTS.md (Complete Rewrite):**

```markdown
# ActionFlows Workbench Contexts

ActionFlows routes user requests directly to **workbench contexts**. Each context represents a distinct work environment with its own triggers, flows, and UI.

---

## Routable Contexts (6)

### Work Context

**Icon:** 🔨
**Purpose:** Active feature development

**Triggers:**
- "implement", "build", "create", "add feature"
- "develop X", "code Y", "write new Z"

**Flows:**
- code-and-review/ (features)
- post-completion/ (deployment)

**Example Requests:**
- "implement user authentication"
- "build a dashboard component"
- "add export functionality"

---

### Maintenance Context

**Icon:** 🔧
**Purpose:** Bug fixes, refactoring, housekeeping

**Triggers:**
- "fix bug", "resolve issue", "patch"
- "refactor", "optimize", "cleanup"
- "technical debt", "improve performance"

**Flows:**
- bug-triage/ (investigation + fix)
- code-and-review/ (refactoring)

**Example Requests:**
- "fix the login bug"
- "refactor the session storage"
- "optimize database queries"

---

### Explore Context

**Icon:** 🔍
**Purpose:** Research, exploration, learning

**Triggers:**
- "explore", "investigate", "research"
- "how does X work", "explain Y"
- "learn about Z", "understand"

**Flows:**
- doc-reorganization/ (learning through docs)
- ideation/ (exploratory brainstorming)

**Example Requests:**
- "explore the WebSocket implementation"
- "research best practices for state management"
- "how does the contract parser work"

---

### Review Context

**Icon:** 👁️
**Purpose:** Code reviews, quality audits

**Triggers:**
- "review", "code review", "audit"
- "check quality", "security scan"

**Flows:**
- audit-and-fix/ (comprehensive review)

**Example Requests:**
- "review the auth implementation"
- "audit security vulnerabilities"
- "check code quality of backend routes"

---

### Settings Context

**Icon:** ⚙️
**Purpose:** Configuration, framework development

**Triggers:**
- "configure", "set up", "change settings"
- "create flow", "create action"
- "onboard me", "framework health"

**Flows:**
- onboarding/ (framework teaching)
- flow-creation/ (new flow scaffolding)
- action-creation/ (new action scaffolding)
- framework-health/ (diagnostics)

**Example Requests:**
- "configure backend port"
- "create a new testing flow"
- "onboard me to ActionFlows"

---

### PM Context

**Icon:** 📋
**Purpose:** Project planning, task organization

**Triggers:**
- "plan", "roadmap", "organize"
- "track tasks", "project management"
- "what's next", "priorities"

**Flows:**
- planning/ (roadmap planning)

**Example Requests:**
- "plan the next sprint"
- "create a roadmap for Q2"
- "what are the current priorities"

---

## Auto-Target Contexts (2)

### Archive Context

**Icon:** 📦
**Purpose:** Completed sessions (automatic)

**Trigger Logic:** Sessions automatically move here on completion

---

### Harmony Context

**Icon:** 🎵
**Purpose:** Harmony violations (automatic)

**Trigger Logic:** Violations automatically appear here when detected

---

## Manual-Only Contexts (1)

### Editor Context

**Icon:** 📝
**Purpose:** Full-screen code editing

**Trigger Logic:** User manually navigates here for focused editing

---

## Routing Algorithm

**Step 1: Trigger Matching**
- Scan user request for trigger keywords
- Match against all 6 routable contexts
- Use longest/most specific match

**Step 2: Confidence Scoring**
- Single strong match (>90% confidence) → Route to that context
- Multiple weak matches → Ask user: "Did you mean to work on this (Work) or fix a bug (Maintenance)?"
- No matches → Default to Work context

**Step 3: Session Creation**
- Create session in selected context
- Tag session with context ID
- Session appears in corresponding workbench tab

**Step 4: Flow Selection**
- Look up flows for selected context
- Choose most appropriate flow based on secondary keywords
- Compile chain from flow actions
```

**Orchestrator Logic Changes:**

**Complete rewrite of routing logic:**

```python
# Pseudo-code for new routing algorithm

def route_request(user_request: str) -> WorkbenchContext:
    # Step 1: Extract keywords
    keywords = extract_keywords(user_request)

    # Step 2: Score all routable contexts
    context_scores = {}
    for context in ROUTABLE_CONTEXTS:
        score = calculate_match_score(keywords, context.triggers)
        if score > 0:
            context_scores[context] = score

    # Step 3: Select best match
    if not context_scores:
        return 'work'  # Default context

    best_context = max(context_scores, key=context_scores.get)
    best_score = context_scores[best_context]

    if best_score > 0.9:
        return best_context  # High confidence

    # Multiple possible matches — ask user
    if len([s for s in context_scores.values() if s > 0.5]) > 1:
        return ask_user_to_disambiguate(context_scores)

    return best_context

def ask_user_to_disambiguate(context_scores):
    sorted_contexts = sorted(context_scores.items(), key=lambda x: x[1], reverse=True)[:3]

    message = "I can interpret this request in multiple ways:\n"
    for i, (context, score) in enumerate(sorted_contexts, 1):
        message += f"{i}. {context.name} context — {context.purpose}\n"
    message += "\nWhich context did you intend?"

    # Wait for user response
    return user_selects_from_options(sorted_contexts)
```

**ORGANIZATION.md Removed:** Replaced entirely by CONTEXTS.md
**FLOWS.md Restructured:** Flows grouped by context (not department)

---

### How UI Changes

**TopBar — No Visual Changes:**

Tabs remain the same 9 workbenches:
```
🔨 Work | 🔧 Maintenance | 🔍 Explore | 👁️ Review | 📦 Archive | ⚙️ Settings | 📋 PM | 🎵 Harmony | 📝 Editor
```

**BUT:** Workbenches are now **first-class routing destinations**, not just UI organization.

**WorkbenchContext Changes:**

```typescript
// Workbenches now store routing metadata
interface WorkbenchConfig {
  id: WorkbenchId;
  icon: string;
  purpose: string;
  canHaveSessions: boolean;

  // NEW: Routing metadata
  routable: boolean; // Can orchestrator route sessions here?
  triggers: string[]; // Trigger keywords for this context
  flows: string[]; // Flows available in this context

  // Existing fields
  notificationsEnabled: boolean;
  glowColor?: string;
}

const WORKBENCH_CONFIGS: Record<WorkbenchId, WorkbenchConfig> = {
  work: {
    id: 'work',
    icon: '🔨',
    purpose: 'Active feature development',
    canHaveSessions: true,
    routable: true, // NEW
    triggers: ['implement', 'build', 'create', 'add feature'], // NEW
    flows: ['code-and-review/', 'post-completion/'], // NEW
    notificationsEnabled: true,
    glowColor: '#4caf50',
  },
  maintenance: {
    id: 'maintenance',
    icon: '🔧',
    purpose: 'Bug fixes, refactoring',
    canHaveSessions: true,
    routable: true,
    triggers: ['fix', 'refactor', 'optimize', 'cleanup'],
    flows: ['bug-triage/', 'code-and-review/'],
    notificationsEnabled: true,
    glowColor: '#ff9800',
  },
  // ... etc for all 9 workbenches
};
```

**Session Routing Display:**

```typescript
// Show which context the orchestrator selected
<SessionCard session={session}>
  <SessionHeader>
    <SessionTitle>{session.title}</SessionTitle>
    <RoutingBadge>
      Routed to: {session.context} {getWorkbenchIcon(session.context)}
    </RoutingBadge>
  </SessionHeader>
  {/* ... rest of session card */}
</SessionCard>
```

**Routing Confidence Indicator:**

```typescript
// If routing confidence was low, show it
{session.routingConfidence < 0.9 && (
  <RoutingNotice>
    Orchestrator wasn't sure — routed to {session.context} with {session.routingConfidence * 100}% confidence.
    <button onClick={() => moveToContext(session, promptUserForContext())}>
      Move to different context
    </button>
  </RoutingNotice>
)}
```

---

### Shared Types

```typescript
// packages/shared/src/workbenchTypes.ts (ENHANCED)

export const WORKBENCH_IDS = [
  'work',
  'maintenance',
  'explore',
  'review',
  'archive',
  'settings',
  'pm',
  'harmony',
  'editor',
] as const;

export type WorkbenchId = typeof WORKBENCH_IDS[number];

export interface WorkbenchConfig {
  id: WorkbenchId;
  icon: string;
  purpose: string;
  canHaveSessions: boolean;
  notificationsEnabled: boolean;
  glowColor?: string;

  // NEW: Routing metadata
  routable: boolean; // Can orchestrator create sessions here?
  triggers: string[]; // Trigger keywords for routing
  flows: string[]; // Available flows
  routingExamples: string[]; // Example user requests
}

export const ROUTABLE_WORKBENCHES: WorkbenchId[] = [
  'work',
  'maintenance',
  'explore',
  'review',
  'settings',
  'pm',
];

export const isRoutable = (id: WorkbenchId): boolean => {
  return ROUTABLE_WORKBENCHES.includes(id);
};

// packages/shared/src/sessionTypes.ts
export interface SessionMetadata {
  // ... existing fields
  context: WorkbenchId; // Which workbench context this session belongs to
  routingConfidence: number; // 0.0-1.0 — how confident was the routing decision
  alternativeContexts?: WorkbenchId[]; // Other contexts that were considered
}

// packages/shared/src/routingTypes.ts (NEW FILE)
export interface RoutingResult {
  selectedContext: WorkbenchId;
  confidence: number;
  alternativeContexts: Array<{
    context: WorkbenchId;
    score: number;
  }>;
  triggerMatches: string[]; // Which trigger keywords matched
}

export interface DisambiguationRequest {
  originalRequest: string;
  possibleContexts: Array<{
    context: WorkbenchId;
    score: number;
    reason: string;
  }>;
}
```

---

### Migration Complexity

**Files Affected:** 18 files

**Breakdown:**
- **Framework files (6):** ORGANIZATION.md → CONTEXTS.md (complete rewrite), FLOWS.md (re-group by context), ORCHESTRATOR.md (new routing algorithm), README.md, INDEX.md, onboarding module 06 (rewrite)
- **Shared types (4):** workbenchTypes.ts (add routing metadata), sessionTypes.ts, routingTypes.ts (NEW), index.ts
- **Frontend components (4):** WorkbenchContext.tsx (routing awareness), SessionSidebarItem.tsx (routing badge), TopBar.tsx (no change), WorkbenchLayout.tsx (no change)
- **Backend (3):** Routing algorithm implementation, session creation, WebSocket events
- **Documentation (1):** WORKBENCH_LAYOUT_INTEGRATION.md

**Estimated Effort:** 18-24 hours
- 4 hours: Rewrite CONTEXTS.md (simpler than ORGANIZATION.md — just trigger lists)
- 2 hours: Re-group FLOWS.md by context
- 6 hours: Implement new routing algorithm in orchestrator
- 2 hours: Add routing metadata to workbenchTypes.ts, create routingTypes.ts
- 2 hours: Update session creation with routing confidence
- 2 hours: Add routing badges to SessionSidebarItem
- 2 hours: Rewrite onboarding module 06
- 2 hours: Update documentation

**Risk Level:** Moderate-High — changes routing logic fundamentally, but UI mostly unchanged

---

### Pros and Cons

**Pros:**
- ✅ **Radical simplification** — one concept (workbench contexts), not two
- ✅ **UI IS the mental model** — what you see in tabs = where sessions route (achieves goal 2 perfectly)
- ✅ **No abstraction mismatch** — no departments to explain, workbenches do everything
- ✅ **Granular control** — preserves all 9 workbenches, users get fine-grained organization
- ✅ **Natural language routing** — triggers map directly to user-visible concepts
- ✅ **Transparent routing** — users see routing confidence and can override
- ✅ **Lower conceptual overhead** — eliminates department layer entirely
- ✅ **Self-documenting** — trigger keywords live with workbench configs (single source of truth)
- ✅ **Flexible** — easy to add new workbench contexts without restructuring departments

**Cons:**
- ❌ **Routing ambiguity** — "fix bug" could be Maintenance OR Work (requires disambiguation UI)
- ❌ **Trigger overlap** — multiple contexts might claim the same keywords
- ❌ **No semantic grouping** — loses the conceptual grouping that departments provided (Engineering = Work + Maintenance)
- ⚠️ **Orchestrator complexity** — routing algorithm is more sophisticated (scoring, disambiguation)
- ⚠️ **User interruptions** — low-confidence routing requires user input mid-flow
- ⚠️ **Trigger maintenance** — 9 trigger lists to maintain (vs 4 department trigger lists)
- ⚠️ **Flow fragmentation** — flows split across 9 contexts (vs 4 departments)

---

### Routing Trace Example

**User Request:** "fix the login bug"

**Full Path:**

1. **Orchestrator receives request:** "fix the login bug"
2. **Keyword extraction:** ["fix", "login", "bug"]
3. **Context scoring:**
   ```
   maintenance: 0.95 (strong match: "fix", "bug")
   work: 0.40 (weak match: "login" could be feature work)
   review: 0.20 (weak match: could be reviewing a fix)
   ```
4. **Confidence check:** 0.95 > 0.9 → High confidence
5. **Context selection:** `maintenance` context
6. **Flow lookup:** CONTEXTS.md → Maintenance Context → bug-triage/ flow
7. **Chain compilation:**
   - analyze/backend/bugs → plan/fix-approach → code/backend/fix-login → review/code-quality
8. **Session creation:**
   ```typescript
   {
     id: 'sess_abc123',
     chainId: 'chain_def456',
     context: 'maintenance', // Routed context
     routingConfidence: 0.95, // High confidence
     alternativeContexts: ['work', 'review'], // Other possibilities
   }
   ```
9. **Orchestrator output:**
   ```
   >> Routing to maintenance context (95% confidence)
   >> Compiling chain: analyze → plan → code → review
   ```
10. **UI Response:**
    - SessionSidebar in `maintenance` workbench shows new session
    - SessionCard displays: "Routed to: maintenance 🔧" badge
    - No routing notice (confidence was high)
11. **User Experience:** User clicks `maintenance` tab, sees login bug session. User trusts the routing decision because confidence was 95%.

**Low-Confidence Example:** "improve the authentication system"

1. **Keyword extraction:** ["improve", "authentication", "system"]
2. **Context scoring:**
   ```
   maintenance: 0.60 (match: "improve" → could be refactoring)
   work: 0.55 (match: "authentication" → could be new feature)
   review: 0.30 (weak match: could be audit)
   ```
3. **Confidence check:** 0.60 < 0.9 AND multiple scores > 0.5 → Disambiguation needed
4. **Orchestrator output:**
   ```
   I can interpret this request in multiple ways:
   1. Maintenance context — Bug fixes, refactoring (60% match)
   2. Work context — Active feature development (55% match)

   Which context did you intend?
   ```
5. **User selects:** "Work" (it's a new auth feature, not a bug fix)
6. **Routing continues:** work context → code-and-review/ flow → session created with 100% confidence (user override)

---

## Comparison Matrix

| Criterion | Model 1: Metadata Bridge | Model 2: Dept-First | Model 3: Three-Layer | Model 4: Context-Native |
|-----------|--------------------------|---------------------|----------------------|-------------------------|
| **Unification Level** | None (linking only) | Full (1:1 mapping) | Partial (explicit layers) | Full (workbenches only) |
| **Concepts to Learn** | 2 (depts + workbenches) | 1 (dept-workbenches) | 3 (domains + dwb + uwb) | 1 (workbench contexts) |
| **UI Tab Count** | 9 (unchanged) | 6 (consolidated) | 9 (4 domain + 5 utility) | 9 (unchanged) |
| **Routing Simplicity** | Same (dept routing) | Same (dept routing) | Same (domain routing) | New (context scoring) |
| **UI Granularity** | High (9 workbenches) | Low (6 workbenches) | High (9 workbenches) | High (9 workbenches) |
| **Breaking Changes** | None | Many | Very many | Moderate |
| **Effort (hours)** | 6-8 | 20-28 | 30-40 | 18-24 |
| **Risk Level** | Low | High | Very High | Moderate-High |
| **Achieves Goal 1** | ❌ No (still 2 concepts) | ✅ Yes (1 concept) | ⚠️ Partial (3 layers) | ✅ Yes (1 concept) |
| **Achieves Goal 2** | ⚠️ Partial (visible link) | ✅ Yes (UI = routing) | ✅ Yes (UI = routing) | ✅✅ Perfectly (UI = routing) |
| **Achieves Goal 3** | ✅ Yes (explicit link) | ✅ Yes (same concept) | ✅ Yes (1:1 mapping) | ✅✅ Perfectly (no gap) |
| **Reversibility** | ✅ Easy (remove metadata) | ❌ Hard (major revert) | ❌ Very hard | ⚠️ Moderate |
| **Future Flexibility** | ✅ High (incremental) | ⚠️ Moderate (locked in) | ✅ Very high (extensible) | ✅ High (add contexts) |
| **Routing Ambiguity** | ✅ Low (dept triggers) | ✅ Low (dept triggers) | ✅ Low (domain triggers) | ⚠️ Moderate (overlap) |
| **User Retraining** | ✅ Minimal | ❌ Significant | ❌ Very significant | ⚠️ Moderate (routing UX) |
| **Semantic Grouping** | ✅ Yes (depts group work) | ✅ Yes (dept-wb group) | ✅ Yes (domains group) | ❌ No (flat contexts) |

---

## Recommendations

### For Immediate Implementation: Model 1 (Metadata Bridge)

**Why:**
- Lowest risk, lowest effort (6-8 hours)
- Immediate user value (sessions auto-route to correct workbench)
- Fully reversible if it doesn't work
- Incremental path to more radical models later
- No breaking changes — production-safe

**Best For:**
- Teams that want quick wins
- Projects in active development (can't afford disruption)
- Validating the unification hypothesis before committing to restructuring

---

### For Long-Term Vision: Model 4 (Context-Native Routing)

**Why:**
- Cleanest conceptual model (UI = routing, no abstraction layers)
- Achieves all 3 goals perfectly
- Preserves UI granularity (9 workbenches)
- Flexible for future growth
- Moderate effort (18-24 hours) — less than Models 2 and 3

**Best For:**
- Teams willing to invest in routing algorithm sophistication
- Projects that value natural language routing
- Users comfortable with disambiguation prompts

**Caveat:** Requires building disambiguation UI and handling routing ambiguity gracefully.

---

### For Architectural Purists: Model 3 (Three-Layer Architecture)

**Why:**
- Most architecturally correct (acknowledges three distinct layers)
- Explicit separation of concerns
- Highly extensible (e.g., multiple domain workbenches per domain)
- Future-proof for complex scenarios

**Best For:**
- Large teams with complex workflows
- Long-lived projects that will evolve significantly
- Teams that value architectural clarity over simplicity

**Caveat:** Highest effort (30-40 hours) and steepest learning curve. Only justified if the three-layer model solves real problems.

---

### Avoid: Model 2 (Department-First Consolidation)

**Why:**
- Loses UI granularity (work vs maintenance distinction)
- High effort (20-28 hours) for moderate benefit
- User retraining required
- Breaking changes without compelling architectural gains

**Exception:** Choose Model 2 IF user research shows that 9 tabs is overwhelming and users naturally cluster sessions into 4-6 groups.

---

## Migration Path (Recommended)

**Phase 1: Start with Model 1 (Now)**
- Add metadata linking departments to workbenches
- Implement session auto-tagging
- Observe user behavior: Do sessions cluster in certain workbenches?

**Phase 2: Evaluate (3-6 months)**
- Analyze session distribution across workbenches
- Gather user feedback: Is 9 tabs too many? Do they understand the department/workbench split?
- Measure routing accuracy: Are sessions landing in the right workbench?

**Phase 3: Evolve (6-12 months)**
- **If users love granularity** → Migrate to Model 4 (Context-Native)
  - Keep all 9 workbenches
  - Eliminate departments, route directly to contexts
  - Build disambiguation UI for ambiguous requests
- **If users want consolidation** → Migrate to Model 2 (Department-First)
  - Collapse to 6 workbenches
  - Add session type filters within each workbench
- **If architecture becomes complex** → Migrate to Model 3 (Three-Layer)
  - Introduce domains as explicit abstraction
  - Separate routing, session UI, and utility UI layers

---

## Open Questions

1. **Routing Accuracy:** How often does the orchestrator misroute sessions today? (Need metrics to justify routing changes)

2. **User Workbench Preferences:** Do users actively organize sessions across workbenches, or do they dump everything in one tab?

3. **Disambiguation UX:** In Model 4, how should disambiguation prompts appear? Inline? Modal? Notification?

4. **Harmony as Sessions:** Should harmony violations be sessions (reviewable, commentable) or artifacts (read-only dashboard items)?

5. **PM as Sessions:** Should roadmap planning be sessions (collaborative, tracked) or artifacts (static dashboards)?

6. **Archive Behavior:** Should archive accept sessions from all workbenches, or should there be separate archives per department/context?

7. **Manual Session Movement:** Should users be able to drag sessions between workbenches? If so, what are the constraints? (e.g., can't move to Archive manually)

8. **Routing History:** Should the system track routing decisions over time to improve trigger matching?

---

## Learnings

**Issue:** Departments and workbenches are parallel taxonomies with zero connection, creating user confusion about where sessions will appear.

**Root Cause:** Departments were designed as internal orchestrator routing logic, while workbenches were designed as external UI organization. No one considered their conceptual overlap during initial design.

**Suggestion:** Adopt Model 1 (Metadata Bridge) immediately for quick wins, then observe user behavior to inform long-term migration to Model 4 (Context-Native) if users value granularity, or Model 2 (Department-First) if users prefer consolidation.

**[FRESH EYE]** Model 4 is the most creative — it inverts the traditional approach by making UI-visible workbenches the routing targets, rather than introducing an invisible "department" abstraction layer. This eliminates the mental model gap entirely: users see 9 tabs, orchestrator routes to those 9 tabs, no translation layer needed. The cost is routing ambiguity (requires disambiguation UI), but the benefit is perfect UI/routing alignment. This wasn't in the original analysis but emerges naturally when you ask: "What if workbenches were ALWAYS first-class, and departments never existed?"

**Additional Insight:** All four models preserve backward compatibility with existing sessions — they're additive metadata changes, not destructive schema changes. Migration can be gradual: old sessions without new metadata continue to work, new sessions get new metadata.
