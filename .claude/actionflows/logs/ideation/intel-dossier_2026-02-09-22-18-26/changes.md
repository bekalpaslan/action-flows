# Code Changes: Intel Dossier Design Document

**Agent:** code/agent
**Date:** 2026-02-09
**Task:** Write Intel Dossier feature design specification

---

## Files Modified

_None — This was a documentation-only task_

---

## Files Created

| File | Purpose |
|------|---------|
| `.claude/actionflows/logs/ideation/intel-dossier_2026-02-09-22-18-26/summary.md` | Execution summary for orchestrator |
| `docs/design/INTEL_DOSSIER.md` | Comprehensive design specification (38KB) |
| `.claude/actionflows/logs/ideation/intel-dossier_2026-02-09-22-18-26/changes.md` | This file |

---

## Verification

- **Type check:** SKIPPED (no code changes, only documentation)
- **Pre-existing errors:** Frontend has TypeScript errors unrelated to this task
- **Files created:** ✅ 2 deliverables + 1 changes log
- **File sizes:** summary.md (4.4KB), INTEL_DOSSIER.md (38KB)

---

## Design Document Contents

The `INTEL_DOSSIER.md` specification includes:

### Core Sections
1. **Executive Summary** — High-level concept and vision
2. **Vision** — Problem statement and solution approach
3. **Architecture** — System position, stack integration, component paths
4. **Core Concepts** — Dossier lifecycle, creation interface, widget system, suggestion box
5. **Data Model** — TypeScript interfaces for Dossier, Insight, Layout, Widgets
6. **User Workflows** — 4 complete workflows (create, view, re-analyze, suggest widget)
7. **Technical Implementation** — Backend routes, services, watchers, frontend components
8. **Open Design Questions** — 12 questions with options and recommendations
9. **Implementation Phases** — 4-phase roadmap (Phase 1-3 + Future)
10. **Success Metrics** — Usage, quality, performance indicators
11. **Risks & Mitigations** — 5 key risks with mitigation strategies
12. **Future Vision** — Intelligence graph, AI-driven creation, predictive analytics

### Key Features Designed
- **Living Dossiers** — Persistent entities with lifecycles (birth, life, growth, memory)
- **Widget Catalog** — 10 initial widgets for agent-driven page composition
- **Suggestion Box** — Pattern for evolving widget catalog based on agent needs
- **File Watching** — chokidar integration for change detection and auto re-analysis
- **Insight Accumulation** — Temporal depth with superseding logic
- **Context Integration** — New "intel" context for routing dossier workflows

### Technical Stack Integration
- Backend: Express routes, intelService, dossierWatcher (chokidar)
- Frontend: IntelWorkbench, WidgetRenderer, widget catalog components
- Shared: Branded types (DossierId, InsightId, WidgetId), layout descriptor schema
- Storage: Redis keys for dossiers, insights, watchers
- MCP: Future external analysis tool integration

### Open Topics (All 12 Included)
1. Re-analysis triggers (recommendation: hybrid with debouncing)
2. Dossier versioning/history (recommendation: sliding window in Phase 2)
3. Insight accumulation strategy (recommendation: superseding with `supersededBy` field)
4. Cross-dossier intelligence (recommendation: isolated Phase 1, auto-linking future)
5. Suggestion box → Pattern Detection pipeline (detailed flow designed)
6. Widget catalog governance (recommendation: manual Phase 1, hybrid later)
7. External folder support (recommendation: Phase 2 with security constraints)
8. Dossier sharing (recommendation: export/import Phase 2)
9. Agent prompt engineering (strategy with token budget management)
10. Performance budget (constraints: 100 watchers, 1000 files/dossier, 5min debounce)
11. Dossier templates (recommendation: Phase 2 after usage pattern analysis)
12. Offline dossiers (recommendation: 24h grace period + user prompt)

---

## Notes

- **Task Context:** This was assigned to the `code/` agent, but the task was actually ideation/design work. The code agent executed it successfully, but this would typically be routed to `ideation/` or `plan/` agent.
- **Deliverable Quality:** 38KB comprehensive design document covering all requested topics
- **All Requirements Met:** Both output files created, all 12 open topics addressed with recommendations
- **Ready for Review:** Design spec is draft stage, requires team review before implementation planning
