# Context-Native Routing Design Document

**Model 4: Context-Native Routing**

---

## Document Metadata

- **Decision Date:** 2026-02-09
- **Status:** Design Specification (Not Yet Implemented)
- **Owner:** ActionFlows Framework Team
- **Source:** [Workbench-Department Unification Brainstorm](../logs/brainstorm/workbench-department-unification_2026-02-09/output.md)
- **Related:** [Department-Workbench Touchpoint Analysis](../logs/analyze/department-workbench-touchpoints_2026-02-09/report.md)

---

## 1. Decision Record

### 1.1 What Was Decided

**Adopt Model 4: Context-Native Routing** — Eliminate the department abstraction layer entirely and route user requests directly to workbench contexts.

### 1.2 Why This Model

This model achieves all three unification goals:

1. **Simplify Routing** — One concept (workbench contexts) replaces two (departments + workbenches)
2. **UI = Mental Model** — What users see in tabs is exactly how the orchestrator routes
3. **Close the Gap** — No translation layer between "where work happens" (UI) and "who owns it" (routing)

**Key Insight:** Workbenches become first-class routing destinations, not just UI organization. The orchestrator routes directly to the contexts users already see and understand.

### 1.3 Alternatives Considered

| Model | Summary | Why Not Selected |
|-------|---------|------------------|
| **Model 1: Metadata Bridge** | Link departments to workbenches via metadata | Doesn't achieve true unification; still two concepts |
| **Model 2: Department-First** | Collapse 9 workbenches to 4 department-aligned spaces | Loses UI granularity; users lose work/maintenance distinction |
| **Model 3: Three-Layer** | Introduce "domains" as separate abstraction | Over-engineered; adds a third concept instead of reducing to one |

### 1.4 Trade-offs

**Gained:**
- ✅ Perfect UI/routing alignment
- ✅ Single unified concept
- ✅ Natural language routing (triggers match visible tab labels)
- ✅ Preserves all 9 workbenches (no lost granularity)

**Lost:**
- ❌ Semantic grouping (departments provided conceptual clusters)
- ❌ Simpler routing logic (now requires scoring/disambiguation)

**Accepted Risk:** Routing ambiguity (e.g., "fix bug" could be Maintenance OR Work) requires disambiguation UX.

---

## 2. The Model

### 2.1 Core Concept

**Workbench Contexts** are the ONLY taxonomy. Each of the 9 workbenches becomes a routing destination with:
- **Triggers** — Keyword phrases that route to this context
- **Flows** — Action sequences available in this context
- **Purpose** — What type of work happens here

**No departments.** The orchestrator routes directly from user intent → workbench context.

### 2.2 The 9 Workbench Contexts

#### Routable Contexts (6)

These contexts can receive orchestrator-routed sessions:

| Context | Icon | Purpose | Triggers | Flows |
|---------|------|---------|----------|-------|
| **work** | 🔨 | Active feature development | "implement", "build", "create", "add feature" | code-and-review/, post-completion/ |
| **maintenance** | 🔧 | Bug fixes, refactoring, housekeeping | "fix bug", "refactor", "cleanup", "optimize" | bug-triage/, code-and-review/ |
| **explore** | 🔍 | Research, exploration, learning | "explore", "research", "investigate", "learn" | doc-reorganization/, ideation/ |
| **review** | 👁️ | Code reviews, audits | "review PR", "audit code", "check quality" | audit-and-fix/ |
| **settings** | ⚙️ | Configuration, framework dev | "configure", "create flow", "create action" | onboarding/, flow-creation/, action-creation/, framework-health/ |
| **pm** | 📋 | Project planning, roadmaps | "plan roadmap", "organize tasks", "track work" | planning/ |

#### Auto-Target Contexts (2)

These contexts receive sessions automatically based on system events:

| Context | Icon | Purpose | Auto-Target Rule |
|---------|------|---------|------------------|
| **archive** | 📦 | Completed sessions | Sessions move here on completion |
| **harmony** | 🎵 | Harmony violations | Violations appear here when detected |

#### Manual-Only Contexts (1)

This context requires explicit user navigation:

| Context | Icon | Purpose | Access Method |
|---------|------|---------|---------------|
| **editor** | 📝 | Full-screen code editing | User clicks tab |

### 2.3 Example Routing Classifications

**Clear Triggers:**
- "implement user authentication" → **work** (95% confidence)
- "fix the login bug" → **maintenance** (95% confidence)
- "review the auth implementation" → **review** (95% confidence)
- "explore the WebSocket implementation" → **explore** (90% confidence)
- "create a new testing flow" → **settings** (95% confidence)
- "plan the next sprint" → **pm** (95% confidence)

**Ambiguous Triggers (Require Disambiguation):**
- "improve the authentication system" → work (55%) OR maintenance (60%)
- "check the database code" → review (60%) OR explore (50%)
- "organize the auth module" → maintenance (50%) OR pm (45%)

---

## 3. Routing Algorithm

### 3.1 Overview

```
User Request → Keyword Extraction → Context Scoring → Confidence Check → Selection or Disambiguation
```

### 3.2 Detailed Steps

#### Step 1: Keyword Extraction

Extract meaningful keywords from the user request, filtering out stop words:

```typescript
function extractKeywords(request: string): string[] {
  const stopWords = ['the', 'a', 'an', 'to', 'in', 'on', 'at', 'for', 'is', 'are', 'was', 'were'];
  const words = request.toLowerCase().split(/\s+/);
  return words.filter(word => !stopWords.includes(word) && word.length > 2);
}
```

**Example:**
- Input: "fix the login bug"
- Output: `["fix", "login", "bug"]`

#### Step 2: Context Scoring

For each routable context, calculate a match score based on trigger keyword overlap:

```typescript
function calculateMatchScore(
  keywords: string[],
  contextTriggers: string[]
): number {
  let score = 0;
  let maxScore = 0;

  for (const trigger of contextTriggers) {
    const triggerWords = trigger.toLowerCase().split(/\s+/);
    maxScore += 1;

    // Check if trigger phrase appears in keywords
    const matches = triggerWords.filter(word => keywords.includes(word));
    const matchRatio = matches.length / triggerWords.length;

    score += matchRatio;
  }

  return maxScore > 0 ? score / maxScore : 0;
}
```

**Example Scoring:**
```
Request: "fix the login bug"
Keywords: ["fix", "login", "bug"]

maintenance triggers: ["fix bug", "refactor", "cleanup", "optimize"]
  - "fix bug" → 100% match (both "fix" and "bug" present) → 1.0
  - Other triggers → 0% match
  - Total: 1.0 / 4 = 0.25 base, weighted to 0.95 (strong match)

work triggers: ["implement", "build", "create", "add feature"]
  - No strong matches → 0.10

review triggers: ["review PR", "audit code", "check quality"]
  - No matches → 0.0
```

#### Step 3: Confidence Check

```typescript
const CONFIDENCE_THRESHOLD = 0.9;
const DISAMBIGUATION_THRESHOLD = 0.5;

function selectContext(contextScores: Map<WorkbenchId, number>): RoutingResult {
  const sortedContexts = Array.from(contextScores.entries())
    .sort((a, b) => b[1] - a[1]);

  const [topContext, topScore] = sortedContexts[0];

  // High confidence — route immediately
  if (topScore > CONFIDENCE_THRESHOLD) {
    return {
      selectedContext: topContext,
      confidence: topScore,
      alternativeContexts: sortedContexts.slice(1, 3),
      requiresDisambiguation: false,
    };
  }

  // Multiple viable options — disambiguate
  const viableContexts = sortedContexts.filter(([_, score]) => score > DISAMBIGUATION_THRESHOLD);
  if (viableContexts.length > 1) {
    return {
      selectedContext: null,
      confidence: 0,
      alternativeContexts: viableContexts,
      requiresDisambiguation: true,
    };
  }

  // Low confidence fallback
  return {
    selectedContext: topContext || 'work', // Default to work
    confidence: topScore,
    alternativeContexts: [],
    requiresDisambiguation: false,
  };
}
```

#### Step 4: Disambiguation (If Needed)

When confidence is low, prompt the user:

```
I can interpret this request in multiple ways:

1. maintenance context (60% match) — Bug fixes, refactoring
2. work context (55% match) — Active feature development

Which context did you intend? (Reply with number or context name)
```

User responds → Route to selected context with 100% confidence (user override).

### 3.3 Pseudo-code

```python
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

    # High confidence — route immediately
    if best_score > 0.9:
        return best_context

    # Multiple possible matches — ask user
    viable = [ctx for ctx, score in context_scores.items() if score > 0.5]
    if len(viable) > 1:
        return ask_user_to_disambiguate(context_scores)

    # Low confidence — route with warning
    return best_context

def ask_user_to_disambiguate(context_scores):
    sorted_contexts = sorted(context_scores.items(), key=lambda x: x[1], reverse=True)[:3]

    message = "I can interpret this request in multiple ways:\n"
    for i, (context, score) in enumerate(sorted_contexts, 1):
        message += f"{i}. {context.name} context — {context.purpose} ({score * 100:.0f}% match)\n"
    message += "\nWhich context did you intend?"

    # Wait for user response
    user_choice = wait_for_user_input()
    return sorted_contexts[user_choice - 1][0]
```

---

## 4. Type System Changes

### 4.1 Enhanced WorkbenchConfig

**File:** `packages/shared/src/workbenchTypes.ts`

```typescript
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
  flows: string[]; // Available flows in this context
  routingExamples: string[]; // Example user requests
}

export const WORKBENCH_CONFIGS: Record<WorkbenchId, WorkbenchConfig> = {
  work: {
    id: 'work',
    icon: '🔨',
    purpose: 'Active feature development',
    canHaveSessions: true,
    notificationsEnabled: true,
    glowColor: '#4caf50',
    routable: true, // NEW
    triggers: ['implement', 'build', 'create', 'add feature', 'develop', 'code', 'write'], // NEW
    flows: ['code-and-review/', 'post-completion/'], // NEW
    routingExamples: [ // NEW
      'implement user authentication',
      'build a dashboard component',
      'add export functionality',
    ],
  },
  maintenance: {
    id: 'maintenance',
    icon: '🔧',
    purpose: 'Bug fixes, refactoring, housekeeping',
    canHaveSessions: true,
    notificationsEnabled: true,
    glowColor: '#ff9800',
    routable: true,
    triggers: ['fix bug', 'resolve issue', 'patch', 'refactor', 'optimize', 'cleanup', 'improve performance'],
    flows: ['bug-triage/', 'code-and-review/'],
    routingExamples: [
      'fix the login bug',
      'refactor the session storage',
      'optimize database queries',
    ],
  },
  // ... remaining 7 workbenches
};

export const ROUTABLE_WORKBENCHES: WorkbenchId[] = [
  'work',
  'maintenance',
  'explore',
  'review',
  'settings',
  'pm',
];

export function isRoutable(id: WorkbenchId): boolean {
  return ROUTABLE_WORKBENCHES.includes(id);
}
```

### 4.2 Enhanced SessionMetadata

**File:** `packages/shared/src/sessionTypes.ts`

```typescript
export interface SessionMetadata {
  // ... existing fields (title, description, userId, etc.)

  // NEW: Routing context
  context: WorkbenchId; // Which workbench context this session belongs to
  routingConfidence: number; // 0.0-1.0 — how confident was the routing decision
  alternativeContexts?: WorkbenchId[]; // Other contexts that were considered
  routingMethod: 'automatic' | 'disambiguated' | 'manual'; // How context was selected
}
```

### 4.3 New RoutingTypes

**File:** `packages/shared/src/routingTypes.ts` (NEW)

```typescript
export interface RoutingResult {
  selectedContext: WorkbenchId | null;
  confidence: number;
  alternativeContexts: Array<{
    context: WorkbenchId;
    score: number;
  }>;
  triggerMatches: string[]; // Which trigger keywords matched
  requiresDisambiguation: boolean;
}

export interface DisambiguationRequest {
  originalRequest: string;
  possibleContexts: Array<{
    context: WorkbenchId;
    score: number;
    purpose: string;
  }>;
}

export interface RoutingDecision {
  context: WorkbenchId;
  confidence: number;
  method: 'automatic' | 'disambiguated' | 'manual';
  timestamp: string;
}
```

### 4.4 Updated Exports

**File:** `packages/shared/src/index.ts`

```typescript
// Existing exports
export * from './sessionTypes';
export * from './chainTypes';
export * from './commandTypes';
export * from './eventTypes';
export * from './workbenchTypes';

// NEW
export * from './routingTypes';
```

---

## 5. File Changes Required

### 5.1 Framework Files (6 files)

| File | Change | Complexity | Est. Hours |
|------|--------|------------|------------|
| `.claude/actionflows/ORGANIZATION.md` → `.claude/actionflows/CONTEXTS.md` | **Rename + Complete Rewrite** — Replace department definitions with workbench context definitions (triggers, flows, examples per context) | **Significant** | 3 |
| `.claude/actionflows/FLOWS.md` | **Restructure** — Re-group flows by context instead of department | **Moderate** | 1.5 |
| `.claude/actionflows/ORCHESTRATOR.md` | **Update** — Replace department routing references with context routing | **Moderate** | 1 |
| `.claude/actionflows/README.md` | **Update** — Reference CONTEXTS.md instead of ORGANIZATION.md | **Trivial** | 0.25 |
| `.claude/actionflows/INDEX.md` | **Update** — Add CONTEXTS.md to index | **Trivial** | 0.25 |
| `.claude/actionflows/flows/framework/onboarding/modules/06-department-routing.md` → `06-context-routing.md` | **Rewrite** — Teach context-based routing instead of departments | **Significant** | 2 |

**Subtotal:** 8 hours

### 5.2 Shared Types (3 files)

| File | Change | Complexity | Est. Hours |
|------|--------|------------|------------|
| `packages/shared/src/workbenchTypes.ts` | **Enhance** — Add `routable`, `triggers`, `flows`, `routingExamples` to WorkbenchConfig | **Moderate** | 2 |
| `packages/shared/src/sessionTypes.ts` | **Enhance** — Add `context`, `routingConfidence`, `alternativeContexts`, `routingMethod` to SessionMetadata | **Moderate** | 1 |
| `packages/shared/src/routingTypes.ts` | **Create** — New file with RoutingResult, DisambiguationRequest, RoutingDecision types | **Moderate** | 1 |
| `packages/shared/src/index.ts` | **Update** — Export routingTypes | **Trivial** | 0.25 |

**Subtotal:** 4.25 hours

### 5.3 Backend (3 files)

| File | Change | Complexity | Est. Hours |
|------|--------|------------|------------|
| `packages/backend/src/routing/contextRouter.ts` | **Create** — New module implementing routing algorithm (keyword extraction, scoring, disambiguation) | **Significant** | 4 |
| `packages/backend/src/services/sessionService.ts` | **Enhance** — Create sessions with routing metadata (context, confidence, method) | **Moderate** | 1.5 |
| `packages/backend/src/ws/eventTypes.ts` | **Enhance** — Add `routingDecision` WebSocket event type | **Trivial** | 0.5 |

**Subtotal:** 6 hours

### 5.4 Frontend (4 files)

| File | Change | Complexity | Est. Hours |
|------|--------|------------|------------|
| `packages/app/src/contexts/WorkbenchContext.tsx` | **Enhance** — Add routing awareness (track routing decisions, filter sessions by context) | **Moderate** | 1.5 |
| `packages/app/src/components/SessionSidebar/SessionSidebarItem.tsx` | **Enhance** — Add routing badge showing context + confidence | **Moderate** | 1.5 |
| `packages/app/src/components/TopBar/TopBar.tsx` | **Review** — No changes (9 tabs remain) | **N/A** | 0 |
| `packages/app/src/components/Workbench/WorkbenchLayout.tsx` | **Review** — No changes (same rendering logic) | **N/A** | 0 |

**Subtotal:** 3 hours

### 5.5 Documentation (2 files)

| File | Change | Complexity | Est. Hours |
|------|--------|------------|------------|
| `WORKBENCH_LAYOUT_INTEGRATION.md` | **Update** — Document routing system, disambiguation UX | **Moderate** | 1 |
| `.claude/CLAUDE.md` | **Update** — Replace department references with context references | **Trivial** | 0.5 |

**Subtotal:** 1.5 hours

### 5.6 Total Effort Estimate

**Total Files Affected:** 21 files (6 framework, 4 shared, 3 backend, 4 frontend, 2 docs, 2 configs)

**Total Estimated Effort:** 22.75 hours (~3 days)

**Breakdown:**
- Framework files: 8 hours
- Shared types: 4.25 hours
- Backend: 6 hours
- Frontend: 3 hours
- Documentation: 1.5 hours

---

## 6. Migration Plan

### Phase 1: Prepare (Non-Breaking)

**Goal:** Add routing metadata to workbench configs without changing behavior.

**Tasks:**
1. Enhance `WorkbenchConfig` with `routable`, `triggers`, `flows`, `routingExamples`
2. Create `routingTypes.ts` with new types
3. Populate trigger lists for all 9 workbenches in WORKBENCH_CONFIGS
4. No routing logic changes — department routing still active

**Duration:** 4 hours

**Deliverables:**
- Updated `packages/shared/src/workbenchTypes.ts`
- New `packages/shared/src/routingTypes.ts`
- Type-check passes

**Validation:**
- Existing code compiles without errors
- No behavior changes

### Phase 2: Implement Routing (Backend)

**Goal:** Build context routing algorithm, keep it inactive.

**Tasks:**
1. Create `packages/backend/src/routing/contextRouter.ts`
2. Implement keyword extraction, scoring, disambiguation logic
3. Add unit tests for routing algorithm
4. Create feature flag: `USE_CONTEXT_ROUTING=false`

**Duration:** 6 hours

**Deliverables:**
- New `contextRouter.ts` module
- Unit tests in `__tests__/routing/`
- Feature flag in backend config

**Validation:**
- Tests pass for various routing scenarios
- Algorithm correctly scores example requests

### Phase 3: Rewrite Framework Docs (Content)

**Goal:** Create CONTEXTS.md to replace ORGANIZATION.md.

**Tasks:**
1. Rename `ORGANIZATION.md` → `CONTEXTS.md`
2. Rewrite with 9 context definitions (routable, auto-target, manual-only)
3. Add trigger lists, flows, examples per context
4. Update FLOWS.md to group by context
5. Update ORCHESTRATOR.md references

**Duration:** 5 hours

**Deliverables:**
- New `.claude/actionflows/CONTEXTS.md`
- Updated FLOWS.md
- Updated ORCHESTRATOR.md

**Validation:**
- All framework files reference CONTEXTS.md
- No broken references to ORGANIZATION.md

### Phase 4: Wire to UI (Frontend + Backend)

**Goal:** Connect routing system to session creation and UI display.

**Tasks:**
1. Update `sessionService.ts` to create sessions with routing metadata
2. Add routing badges to `SessionSidebarItem.tsx`
3. Update `WorkbenchContext.tsx` to filter sessions by context
4. Add disambiguation modal component (if routing requires user input)
5. Enable feature flag: `USE_CONTEXT_ROUTING=true`

**Duration:** 5 hours

**Deliverables:**
- Sessions display routing context + confidence
- Disambiguation modal appears for ambiguous requests
- Sessions auto-route to correct workbench

**Validation:**
- User requests route to expected contexts
- Disambiguation modal shows for ambiguous cases
- Session cards display routing badges

### Phase 5: Cleanup (Remove Legacy)

**Goal:** Remove all department references.

**Tasks:**
1. Delete old ORGANIZATION.md if renamed
2. Remove department routing from ORCHESTRATOR.md
3. Update onboarding module 06 (department-routing → context-routing)
4. Remove `USE_CONTEXT_ROUTING` feature flag (now default)
5. Update CLAUDE.md and MEMORY.md

**Duration:** 2.75 hours

**Deliverables:**
- No department references remain
- Onboarding teaches context routing
- Feature flag removed

**Validation:**
- Grep for "department" returns no framework/code references (only logs)
- Onboarding module teaches context routing

### Phase 6: Polish (Optional Enhancements)

**Goal:** Improve routing accuracy over time.

**Ideas:**
- Track routing decisions → build training data
- User feedback: "Was this the right context?" → improve triggers
- Context suggestion: "This looks like Maintenance work — move it?"

**Duration:** TBD (future enhancement)

---

## 7. Open Questions

### 7.1 Disambiguation UX Design

**Question:** How should disambiguation prompts appear in the UI?

**Options:**
1. **Modal Dialog** — Block session creation until user selects context
2. **Inline Notification** — Create session in top-scored context, show notification with "Move to different context?" option
3. **Orchestrator Prompt** — Orchestrator asks in chat before creating session

**Recommendation:** Option 3 (Orchestrator Prompt) — Most aligned with ActionFlows flow. Orchestrator asks user before compiling chain.

**Example Flow:**
```
User: "improve the authentication system"
Orchestrator: I can interpret this request in multiple ways:
  1. maintenance context (60%) — Bug fixes, refactoring
  2. work context (55%) — Active feature development
  Which context did you intend? (Reply with number or name)

User: "1"
Orchestrator: >> Routing to maintenance context (user override)
>> Compiling chain: analyze → plan → code → review
```

### 7.2 Archive Behavior

**Question:** Should archive accept sessions from all contexts, or should there be separate archives per context?

**Current Model:** Single archive for all completed sessions.

**Alternative:** Context-specific archives (work-archive, maintenance-archive, etc.).

**Recommendation:** Keep single archive. Use session metadata (`context` field) to filter archived sessions by original context if needed.

### 7.3 Manual Session Movement

**Question:** Should users be able to drag sessions between workbenches?

**Current Model:** Sessions are tied to workbench via `context` field in metadata.

**Scenarios:**
- User manually moves session from `work` to `maintenance` → Update `context` field, set `routingMethod: 'manual'`
- Constraint: Cannot move to `archive` manually (auto-target only)
- Constraint: Cannot move to `editor` (not session-capable)

**Recommendation:** Allow manual movement between routable contexts. Update session metadata to reflect manual override.

**UI:**
- Drag-and-drop sessions between compatible workbench tabs
- Show toast: "Moved to Maintenance context"

### 7.4 Harmony and PM as Sessions

**Question:** Should harmony violations and PM tasks be sessions (reviewable, commentable) or artifacts (read-only dashboard items)?

**Current Model:**
- Harmony: Dashboard view (non-session artifacts)
- PM: Dashboard view (non-session artifacts)

**Alternative:** Make them session-capable contexts where violations/tasks become sessions.

**Recommendation:** Keep current model (non-session). Harmony violations and PM tasks are **artifacts** that link to sessions but are not themselves sessions.

**Rationale:**
- Harmony violations are **detected**, not **routed** — auto-target context
- PM tasks are **tracked**, not **executed** — manual-only context for viewing roadmap

### 7.5 Context History and Learning

**Question:** Should the system track routing decisions over time to improve trigger matching?

**Potential Features:**
- Store routing decisions in database
- Analyze patterns: "User always moves sessions from X to Y — improve triggers"
- Surface insights: "80% of 'fix' requests go to maintenance — keep trigger"

**Recommendation:** Phase 6 enhancement (not MVP). Start with static trigger lists, evolve based on usage data.

### 7.6 Default Context

**Question:** What happens when no triggers match?

**Current Algorithm:** Default to `work` context.

**Alternative:** Ask user every time ("No clear match — which context?").

**Recommendation:** Default to `work` with low confidence. User sees routing notice and can override.

---

## 8. Routing Examples

### 8.1 High-Confidence Routing

**Request:** "implement user authentication"

**Routing Trace:**
1. Keywords: `["implement", "user", "authentication"]`
2. Context Scores:
   - work: 0.95 (strong match: "implement")
   - maintenance: 0.10
   - settings: 0.15
3. Confidence: 0.95 > 0.9 threshold → High confidence
4. **Selected Context:** `work`
5. Orchestrator Output:
   ```
   >> Routing to work context (95% confidence)
   >> Compiling chain: code-and-review/ flow
   ```
6. Session Metadata:
   ```typescript
   {
     context: 'work',
     routingConfidence: 0.95,
     routingMethod: 'automatic',
     alternativeContexts: ['settings', 'maintenance'],
   }
   ```

### 8.2 Disambiguation Routing

**Request:** "improve the authentication system"

**Routing Trace:**
1. Keywords: `["improve", "authentication", "system"]`
2. Context Scores:
   - maintenance: 0.60 (match: "improve" → refactor/optimize)
   - work: 0.55 (match: "system" → feature work)
   - review: 0.30
3. Confidence: 0.60 < 0.9 threshold AND multiple > 0.5 → Disambiguation needed
4. Orchestrator Prompt:
   ```
   I can interpret this request in multiple ways:
   1. maintenance context (60%) — Bug fixes, refactoring
   2. work context (55%) — Active feature development

   Which context did you intend? (Reply with number or name)
   ```
5. User Responds: "maintenance"
6. **Selected Context:** `maintenance` (user override)
7. Session Metadata:
   ```typescript
   {
     context: 'maintenance',
     routingConfidence: 1.0, // User override = 100% confidence
     routingMethod: 'disambiguated',
     alternativeContexts: ['work'],
   }
   ```

### 8.3 Low-Confidence Fallback

**Request:** "something is broken"

**Routing Trace:**
1. Keywords: `["something", "broken"]`
2. Context Scores:
   - maintenance: 0.40 (weak match: "broken" → bug?)
   - work: 0.10
   - review: 0.05
3. Confidence: 0.40 < 0.9 AND no multiple > 0.5 → Low confidence
4. **Selected Context:** `work` (default fallback)
5. Orchestrator Output:
   ```
   >> Routing to work context (default — low confidence)
   >> Compiling chain: code-and-review/ flow
   ```
6. Session Metadata:
   ```typescript
   {
     context: 'work',
     routingConfidence: 0.40,
     routingMethod: 'automatic',
     alternativeContexts: ['maintenance'],
   }
   ```
7. UI Display: Routing notice in session card
   ```
   ⚠️ Low confidence routing (40%)
   [Move to different context?]
   ```

### 8.4 Manual Override

**Request:** User drags session from `work` to `maintenance` tab

**Effect:**
1. Update session metadata:
   ```typescript
   {
     context: 'maintenance', // Changed from 'work'
     routingConfidence: 1.0, // User action = 100% confidence
     routingMethod: 'manual', // Override
     alternativeContexts: ['work'], // Original context
   }
   ```
2. UI Display: Badge shows "Manually moved to Maintenance"

---

## 9. Success Metrics

### 9.1 Routing Accuracy

**Metric:** Percentage of sessions that remain in their routed context (not manually moved).

**Target:** >85% of sessions stay in routed context.

**Measurement:**
```sql
SELECT
  COUNT(*) FILTER (WHERE routingMethod != 'manual') * 100.0 / COUNT(*) AS accuracy
FROM sessions
WHERE created_at > NOW() - INTERVAL '30 days';
```

### 9.2 Disambiguation Rate

**Metric:** Percentage of requests requiring user disambiguation.

**Target:** <15% of requests require disambiguation.

**Measurement:**
```sql
SELECT
  COUNT(*) FILTER (WHERE routingMethod = 'disambiguated') * 100.0 / COUNT(*) AS disambiguation_rate
FROM sessions
WHERE created_at > NOW() - INTERVAL '30 days';
```

### 9.3 User Override Rate

**Metric:** Percentage of sessions manually moved to different context.

**Target:** <10% of sessions are manually moved.

**Measurement:**
```sql
SELECT
  COUNT(*) FILTER (WHERE routingMethod = 'manual') * 100.0 / COUNT(*) AS override_rate
FROM sessions
WHERE created_at > NOW() - INTERVAL '30 days';
```

---

## 10. Future Enhancements

### 10.1 Machine Learning Trigger Refinement

Train a simple classifier on routing decisions:
- Input: User request text
- Output: Context probabilities
- Training data: Historical routing decisions + user corrections

Replace keyword matching with ML model for improved accuracy.

### 10.2 Context Suggestions

Proactively suggest context changes based on session content:
- Session in `work` contains many bug fixes → Suggest moving to `maintenance`
- Session in `explore` generates code → Suggest moving to `work`

### 10.3 Multi-Context Sessions

Allow sessions to span multiple contexts:
- Session starts in `explore` (research)
- Transitions to `work` (implementation)
- Transitions to `review` (self-review)

Track context transitions in session timeline.

### 10.4 Custom User Triggers

Allow users to define personal trigger keywords:
- User prefers "create" → always route to `work`
- User prefers "fix" → always route to `maintenance`

Store per-user trigger overrides.

---

## 11. Appendix: Complete Context Definitions

### Work Context

**Icon:** 🔨
**Purpose:** Active feature development

**Triggers:**
- implement, build, create, add feature, develop, code, write, generate, construct, design

**Flows:**
- code-and-review/
- post-completion/

**Examples:**
- "implement user authentication"
- "build a dashboard component"
- "add export functionality"
- "create a new API endpoint"

---

### Maintenance Context

**Icon:** 🔧
**Purpose:** Bug fixes, refactoring, housekeeping

**Triggers:**
- fix bug, resolve issue, patch, refactor, optimize, cleanup, improve performance, technical debt, debug, repair

**Flows:**
- bug-triage/
- code-and-review/

**Examples:**
- "fix the login bug"
- "refactor the session storage"
- "optimize database queries"
- "cleanup unused imports"

---

### Explore Context

**Icon:** 🔍
**Purpose:** Research, exploration, learning

**Triggers:**
- explore, investigate, research, learn, understand, explain, how does, study, analyze, discover

**Flows:**
- doc-reorganization/
- ideation/

**Examples:**
- "explore the WebSocket implementation"
- "research best practices for state management"
- "how does the contract parser work"
- "investigate performance bottlenecks"

---

### Review Context

**Icon:** 👁️
**Purpose:** Code reviews, audits

**Triggers:**
- review, code review, audit, check quality, security scan, inspect, examine, validate, verify

**Flows:**
- audit-and-fix/

**Examples:**
- "review the auth implementation"
- "audit security vulnerabilities"
- "check code quality of backend routes"
- "inspect the database schema"

---

### Settings Context

**Icon:** ⚙️
**Purpose:** Configuration, framework development

**Triggers:**
- configure, set up, change settings, create flow, create action, onboard me, framework health, setup, initialize

**Flows:**
- onboarding/
- flow-creation/
- action-creation/
- framework-health/

**Examples:**
- "configure backend port"
- "create a new testing flow"
- "onboard me to ActionFlows"
- "check framework health"

---

### PM Context

**Icon:** 📋
**Purpose:** Project planning, task organization

**Triggers:**
- plan, roadmap, organize, track tasks, project management, what's next, priorities, schedule, coordinate

**Flows:**
- planning/

**Examples:**
- "plan the next sprint"
- "create a roadmap for Q2"
- "what are the current priorities"
- "organize upcoming tasks"

---

### Archive Context

**Icon:** 📦
**Purpose:** Completed sessions

**Routable:** No (auto-target)
**Auto-Target Rule:** Sessions automatically move here on completion

---

### Harmony Context

**Icon:** 🎵
**Purpose:** Harmony violations

**Routable:** No (auto-target)
**Auto-Target Rule:** Violations automatically appear here when detected

---

### Editor Context

**Icon:** 📝
**Purpose:** Full-screen code editing

**Routable:** No (manual-only)
**Access Method:** User manually navigates to this tab for focused editing

---

## 12. Implementation Checklist

### Pre-Implementation
- [ ] Review this design document with team
- [ ] Approve routing algorithm approach
- [ ] Decide on disambiguation UX (modal vs prompt vs notification)
- [ ] Create feature branch: `feature/context-native-routing`

### Phase 1: Prepare (4 hours)
- [ ] Add routing fields to WorkbenchConfig
- [ ] Create routingTypes.ts
- [ ] Populate trigger lists for 9 workbenches
- [ ] Run type-check
- [ ] Commit: "feat: add routing metadata to workbench configs"

### Phase 2: Implement (6 hours)
- [ ] Create contextRouter.ts with routing algorithm
- [ ] Add unit tests for keyword extraction
- [ ] Add unit tests for context scoring
- [ ] Add unit tests for disambiguation logic
- [ ] Add feature flag USE_CONTEXT_ROUTING
- [ ] Commit: "feat: implement context routing algorithm"

### Phase 3: Docs (5 hours)
- [ ] Rename ORGANIZATION.md → CONTEXTS.md
- [ ] Rewrite with 9 context definitions
- [ ] Update FLOWS.md grouping
- [ ] Update ORCHESTRATOR.md references
- [ ] Update INDEX.md
- [ ] Commit: "docs: rewrite framework docs for context routing"

### Phase 4: Wire (5 hours)
- [ ] Update sessionService.ts with routing metadata
- [ ] Add routing badge to SessionSidebarItem
- [ ] Update WorkbenchContext for routing awareness
- [ ] Create disambiguation modal (if needed)
- [ ] Enable USE_CONTEXT_ROUTING flag
- [ ] Commit: "feat: wire context routing to session creation and UI"

### Phase 5: Cleanup (2.75 hours)
- [ ] Delete old ORGANIZATION.md
- [ ] Update onboarding module 06
- [ ] Remove USE_CONTEXT_ROUTING flag
- [ ] Update CLAUDE.md
- [ ] Update MEMORY.md
- [ ] Commit: "refactor: remove department references"

### Post-Implementation
- [ ] Manual testing: route various requests
- [ ] Test disambiguation flow
- [ ] Test manual session movement
- [ ] Update LEARNINGS.md with discoveries
- [ ] Create PR: "feat: implement context-native routing (Model 4)"

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-02-09 | code/ agent | Initial design document |

