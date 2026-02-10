# Intel Dossier — Brainstorming Session Summary

**Date:** 2026-02-09
**Session Type:** Ideation
**Status:** Concept Complete — Ready for Design Phase

---

## Concept Overview

**Intel Dossier** is a first-class workbench feature in the ActionFlows Dashboard that provides **living dossiers** — persistent, evolving intelligence pages about code folders/paths. Unlike static analysis reports, dossiers are born, watch for changes, grow over time, and accumulate insights.

### Core Philosophy

The application is a living organism. Intel is its **intelligence division** — active knowledge gathering. The dashboard shifts from **observer** (monitoring AI work) to **active intelligence gatherer** (initiating analysis). This connects to the core framework value of "evolution" — the app continuously learns and grows.

---

## What Is Intel?

Intel is **not** a one-time code analysis tool. It is:

- **Persistent** — Dossiers live permanently, accumulating insights over time
- **Active** — Watches for file changes and triggers re-analysis automatically
- **Evolutionary** — New analysis builds ON TOP of prior knowledge (temporal depth)
- **Multi-path** — A single dossier can track multiple folders/files as a domain
- **Intent-driven** — User provides free-form natural language context to guide analysis
- **Self-composing** — Agent selects widgets from a catalog to build the dossier page

---

## Position in Application

### UI Placement
- **First-class workbench** in TopBar alongside Work, Review, Explore, Settings, PM
- **Own context** in CONTEXTS.md for orchestrator routing
- **Icon concept:** Radar/satellite dish

### Routing Triggers
User phrases that route to Intel context:
- "intel on..."
- "watch this folder"
- "create dossier"
- "analyze project"
- "gather intel"

---

## Dossier Lifecycle

### 1. Birth
User creates dossier via creation UI:
- **Name** — Human-readable identifier (e.g., "Auth System", "Backend Services")
- **Targets** — Multiple paths to watch (folders and/or files)
- **Context** — Free-form natural language: "Tell the agent what to focus on..."

No templates. No dropdowns. Pure intent-driven creation.

### 2. Life
File watcher (chokidar) detects changes in watched paths. Triggers incremental re-analysis. Dossier entries get added/updated, never just overwritten.

### 3. Growth
Over time the dossier accumulates insights with temporal depth:
- "This folder's test coverage dropped 3 times this week."
- Previous analysis informs future ones.
- Temporal data enables trend detection.

### 4. Memory
The prompt includes prior dossier state so Claude builds ON TOP of what it already knows. Not a fresh analysis every time — an **incremental knowledge update**.

---

## Dossier Creation Flow (UI)

```
[+ New Dossier]
  ├── Name: ____________
  ├── Targets: [+ Add Path] [+ Add Path]
  ├── Context: [                          ]
  │            [ Tell the agent what to    ]
  │            [ focus on...               ]
  └── [Create Dossier]
```

**Three inputs:**
1. **Name** — User-facing identifier
2. **Paths** — Multiple targets (multiple paths per dossier)
3. **Intent** — Free-form natural language context

### Multiple Paths Per Dossier

A dossier watches a **domain**, not a single folder.

**Example:** "Auth System" dossier watches:
- `packages/backend/src/middleware/auth.ts`
- `packages/app/src/contexts/AuthContext.tsx`
- `packages/shared/src/types/user.ts`

Agent sees the full picture across package boundaries. This is key to understanding cross-cutting concerns.

---

## Widget Catalog — Self-Composing Dossiers

The agent composes dossier pages from a **pre-built widget catalog**. Agent never touches React — it outputs a **layout descriptor** (JSON) that the frontend renders via a `<WidgetRenderer>`.

### Initial Widget Catalog

| Widget | Purpose | Data Source |
|--------|---------|-------------|
| **StatCard** | Single metric (file count, LOC, coverage %) | Analysis |
| **FileTree** | Interactive folder structure | Direct read |
| **DependencyGraph** | Package/import relationships | Analysis |
| **ChangeTimeline** | Recent file changes over time | File watcher |
| **CodeHealthMeter** | Quality score (complexity, duplication) | Analysis |
| **AlertPanel** | Issues, warnings, anomalies | Analysis |
| **RelationshipMap** | How watched paths connect to each other | Analysis |
| **TrendChart** | Metric changes over time | Historical |
| **InsightCard** | Natural language observation from Claude | Analysis |
| **SnippetPreview** | Key code excerpts with annotations | Analysis |

### Layout Descriptor Format

Agent outputs JSON:

```json
{
  "layout": "grid-2col",
  "widgets": [
    { "type": "StatCard", "span": 1, "data": { "label": "Files", "value": 47 } },
    { "type": "DependencyGraph", "span": 2, "data": { ... } },
    { "type": "InsightCard", "span": 2, "data": { "text": "..." } }
  ]
}
```

Frontend renders this via `<WidgetRenderer>` without agent touching React code.

---

## Suggestion Box — Self-Aware Gap Detection

**What happens when the agent needs a widget that doesn't exist?**

### The Evolution Cycle

```
Agent needs widget → Not in catalog → Builds MVP fallback → Files suggestion
     ↓
Human reviews suggestion box → Approves → Proper widget gets built → Added to catalog
     ↓
Next time agent needs it → Widget exists → Uses polished version
```

### Suggestion Entry Format

When the agent encounters a gap:

1. **Build a minimum viable fallback** (basic rendering within design constraints)
2. **File a suggestion** with this structure:

```json
{
  "type": "widget_suggestion",
  "requestedBy": "intel-dossier:backend-services",
  "needed": "ComparisonTable",
  "reason": "Needed to compare test coverage across 3 packages side-by-side",
  "fallback": { "type": "raw", "html": "...", "css": "..." },
  "frequency": 1,
  "timestamp": "..."
}
```

### Connection to Self-Evolving UI

Suggestion box entries feed the **Self-Evolving UI Phase 2 (Pattern Detection)** system. The system:
- Tracks widget request frequency
- Identifies recurring patterns
- Surfaces high-value widget candidates for promotion
- Enables the framework to evolve its own capabilities

---

## Existing Stack Connections

Intel leverages existing infrastructure:

| Component | Current Use | Intel Use |
|-----------|-------------|-----------|
| **chokidar** | Watch files per session | Watch dossier target paths |
| **MemoryStorage/Redis** | Persist session state | Persist dossier state + history |
| **Claude CLI sessions** | Bidirectional streaming | Re-analysis execution |
| **Self-Evolving UI Registry** | Custom prompt buttons | Widget catalog storage |
| **Context routing** | Route to Work, Review, etc. | New Intel context |
| `.auto-claude/` | Proves output schema pattern | Layout descriptor validation |

---

## Information Architecture

```
TopBar: [Work] [Review] [Explore] [Intel] [Settings] [PM]
                                    │
                          Intel Workbench
                           ├── Dossier List (sidebar or grid)
                           ├── Dossier View (widget layout)
                           └── Dossier Creation (path picker + name + context)
```

---

## Key Design Decisions

### 1. Multiple Paths Per Dossier
**Decision:** A dossier can watch multiple paths (folders and/or files).
**Rationale:** Real systems span package boundaries. "Auth System" includes backend middleware, frontend context, and shared types. Agent needs the full picture.

### 2. Free-Form Context (No Templates)
**Decision:** User provides natural language intent, not dropdown selections.
**Rationale:** Every dossier serves a unique purpose. Templates constrain. Free-form enables flexibility.

### 3. Agent Outputs JSON, Not React
**Decision:** Agent outputs layout descriptor JSON. Frontend renders via `<WidgetRenderer>`.
**Rationale:** Agent never touches React code. Clean separation. Widget catalog is reusable. `.auto-claude/` proves this pattern works.

### 4. Suggestion Box for Missing Widgets
**Decision:** When widget doesn't exist, agent builds MVP fallback + files suggestion.
**Rationale:** Enables graceful degradation. Feeds pattern detection. Framework evolves its own capabilities over time.

### 5. Temporal Depth (Build On Prior Knowledge)
**Decision:** Re-analysis prompt includes prior dossier state.
**Rationale:** Not a fresh analysis every time. Incremental knowledge updates. "This changed since last analysis." Trend detection.

---

## Open Topics

These are flagged for future phases. Not blocking initial implementation.

### 1. Re-Analysis Triggers
**Question:** When does a dossier re-analyze?
- On file change (automatic)?
- Scheduled intervals (e.g., daily)?
- Manual only (user-triggered)?
- Hybrid (automatic + manual override)?

**Impact:** Performance budget, freshness guarantees, user control.

### 2. Dossier Versioning / History
**Question:** Can you "rewind" a dossier to see what it looked like last week?
- Full state snapshots at intervals?
- Diff-based history (like git)?
- Append-only log with temporal queries?

**Impact:** Storage requirements, UI complexity, debugging capabilities.

### 3. Insight Accumulation Strategy
**Question:** How do new insights relate to old ones?
- Append new insights to existing list?
- Replace stale insights with fresh ones?
- Score decay for aging insights?
- Tag insights with confidence/recency?

**Impact:** Dossier page length, relevance over time, signal-to-noise ratio.

### 4. Cross-Dossier Intelligence
**Question:** Can one dossier reference another's findings?
- Shared knowledge graph across dossiers?
- Explicit cross-references in layout descriptor?
- Auto-detect related dossiers?

**Impact:** System-wide intelligence, complexity, potential for circular references.

### 5. Suggestion Box → Pattern Detection Pipeline
**Question:** How does the suggestion box feed into the Self-Evolving UI system?
- Automatic promotion after N requests?
- Human review gate?
- ML-based pattern clustering?

**Impact:** Widget catalog evolution speed, quality control, automation level.

### 6. Widget Catalog Governance
**Question:** Who approves promoted widgets?
- Human review required?
- Auto-promote after threshold?
- Community voting (multi-user)?

**Impact:** Quality control, evolution speed, trust in auto-generated widgets.

### 7. External Folder Support
**Question:** Can dossiers watch repos outside the project?
- Competitor analysis use case
- Cloned repos for comparison
- Security/sandboxing concerns

**Impact:** File watcher scope, security model, use case expansion.

### 8. Dossier Sharing
**Question:** In multi-user deployments, can dossiers be shared between team members?
- Per-user dossiers only?
- Team-wide shared dossiers?
- Read-only vs. edit permissions?

**Impact:** Collaboration features, storage model, access control.

### 9. Agent Prompt Engineering
**Question:** How much prior context to feed on re-analysis?
- Full prior state (token-heavy)?
- Summarized prior state?
- Only changed sections?
- Sliding window (last N analyses)?

**Impact:** Token budget, analysis quality, cost optimization.

### 10. Performance Budget
**Question:** How many concurrent file watchers can the system support?
- Limit per user?
- Debouncing strategy?
- Priority system for active dossiers?

**Impact:** System performance, scalability, user experience.

### 11. Dossier Templates (Despite Free-Form Design)
**Question:** Should common patterns be offered as starting points?
- "API Service" template (common paths pre-filled)
- "Frontend App" template
- "Library" template
- Still allow full customization

**Impact:** Onboarding friction, standardization vs. flexibility.

### 12. Offline Dossiers
**Question:** What happens when watched folders go offline or get deleted?
- Mark as "offline" but preserve history?
- Auto-archive?
- Notify user for manual intervention?

**Impact:** Error handling, user experience, data retention policy.

---

## Next Steps

### Phase 1: Design Specification
**Output:** `docs/design/INTEL_DOSSIER.md` (this document)
**Status:** Complete

### Phase 2: Data Model Design
**Tasks:**
- Define dossier state schema (storage)
- Define layout descriptor schema (widget rendering)
- Define suggestion entry schema
- Design storage integration (MemoryStorage + Redis)

### Phase 3: Backend Implementation
**Tasks:**
- Dossier CRUD API endpoints
- File watcher integration
- Re-analysis trigger system
- Suggestion box storage

### Phase 4: Frontend Implementation
**Tasks:**
- Intel workbench UI shell
- Dossier creation flow
- Widget renderer system
- Initial widget catalog (10 widgets)
- Dossier list/grid view

### Phase 5: Agent Integration
**Tasks:**
- Intel action agent (`.claude/actionflows/actions/intel/`)
- Layout descriptor generation logic
- Suggestion filing logic
- Incremental analysis prompt design

### Phase 6: Testing & Iteration
**Tasks:**
- E2E flow (create → watch → re-analyze → render)
- Widget catalog expansion based on usage
- Performance testing (file watcher load)
- Suggestion box workflow validation

---

## Key Insights

### 1. Intelligence Division Metaphor
The dashboard becomes an **active intelligence gatherer**, not just a passive observer. This elevates the framework's role from monitoring to participation.

### 2. Temporal Depth Creates Value
Static reports are snapshots. Living dossiers accumulate context over time. "This test coverage trend" is more valuable than "this test coverage number."

### 3. Self-Aware Gap Detection
The suggestion box enables the framework to **identify its own limitations** and propose solutions. This is true self-evolution.

### 4. Domain-Centric (Not Path-Centric)
Multi-path dossiers let users think in **problem domains** (Auth, Payments, Analytics) rather than technical boundaries (backend, frontend, shared).

### 5. Intent-Driven Analysis
Free-form context means every dossier serves a unique purpose. No forced templates. Maximum flexibility.

---

## Related Features

- **Self-Evolving UI** — Widget catalog lives in registry
- **Context Routing** — Intel context added to CONTEXTS.md
- **Session Management** — Re-analysis runs as Claude CLI session
- **File Watching** — chokidar already integrated per session
- **Storage System** — MemoryStorage/Redis already persist state

---

## Success Metrics

How do we know Intel is working?

1. **Dossiers created** — Users find it valuable enough to set up
2. **Re-analysis frequency** — Dossiers stay fresh (not stale)
3. **Widget reuse** — High overlap between dossier layouts (catalog is useful)
4. **Suggestion box activity** — Framework identifies gaps and proposes widgets
5. **Cross-package insights** — Dossiers span boundaries (multi-path usage)
6. **Temporal insights** — "Changed since..." observations appear in dossiers

---

## Risks & Mitigations

### Risk 1: Performance Degradation
**Problem:** Too many file watchers slow down the system.
**Mitigation:** Performance budget per user, debouncing, priority system for active dossiers.

### Risk 2: Stale Dossiers
**Problem:** Dossiers created but never updated (one-time use).
**Mitigation:** Auto-archive inactive dossiers, notification when changes detected.

### Risk 3: Widget Catalog Sprawl
**Problem:** Suggestion box fills with one-off widget requests.
**Mitigation:** Frequency threshold for promotion, human review gate, pattern clustering.

### Risk 4: Prompt Context Explosion
**Problem:** Full prior state in re-analysis prompt exceeds token budget.
**Mitigation:** Summarization, sliding window, only feed changed sections.

### Risk 5: User Confusion (What Is This?)
**Problem:** Intel workbench purpose unclear to new users.
**Mitigation:** Onboarding flow, example dossiers, clear UI messaging.

---

## Design Principles

1. **Living Over Static** — Dossiers evolve, not snapshot
2. **Intent Over Template** — Free-form context, not dropdowns
3. **Domain Over Path** — Multi-path dossiers for cross-cutting concerns
4. **Build Over Block** — Missing widget? Build MVP, file suggestion, continue
5. **Memory Over Amnesia** — Re-analysis builds on prior knowledge

---

**End of Summary**
