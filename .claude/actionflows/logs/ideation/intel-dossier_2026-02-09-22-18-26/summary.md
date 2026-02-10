# Intel Dossier Feature — Ideation Summary

**Date:** 2026-02-09
**Agent:** code/agent
**Task:** Write design document for Intel Dossier feature

---

## Overview

Intel Dossier is a proposed first-class workbench feature that provides **living intelligence dossiers** on code paths. Unlike static analysis, dossiers are persistent entities that watch for file changes, accumulate insights over time, and build temporal intelligence.

---

## Outputs

1. **Log Summary:** `.claude/actionflows/logs/ideation/intel-dossier_2026-02-09-22-18-26/summary.md` (this file)
2. **Design Specification:** `docs/design/INTEL_DOSSIER.md`

---

## Key Concepts Captured

### Positioning
- First-class workbench (alongside Sessions, Registry, etc.)
- Own context in CONTEXTS.md (new "intel" context)
- Own TopBar entry
- Triggers: "intel on...", "create dossier", "gather intel"

### Lifecycle Model
1. **Birth** — User creates with name + paths + intent
2. **Life** — File watchers detect changes, trigger re-analysis
3. **Growth** — Accumulates insights with temporal depth
4. **Memory** — Prior dossier state informs future analysis (Claude builds on existing knowledge)

### Creation Interface
- Three inputs: name (string), paths (array of file/folder paths), intent (free-form natural language)
- No templates, no dropdowns, no wizards
- Emphasis on simplicity and flexibility

### Widget System
- Agent composes pages from pre-built widget catalog
- Frontend renders via `WidgetRenderer` component
- Layout descriptor JSON (agent outputs, frontend interprets)
- 10 initial widgets: StatCard, FileTree, DependencyGraph, ChangeTimeline, CodeHealthMeter, AlertPanel, RelationshipMap, TrendChart, InsightCard, SnippetPreview

### Suggestion Box Pattern
- When agent needs missing widget → builds MVP fallback + files suggestion
- Evolution cycle: need → fallback → suggest → review → proper build → catalog addition
- Integrates with Self-Evolving UI Registry system

### Stack Integration Points
- **chokidar** — File watching for change detection
- **MemoryStorage/Redis** — Dossier persistence
- **Claude CLI** — Analysis execution (stream-json protocol)
- **Self-Evolving UI Registry** — Widget catalog governance
- **Context routing** — New "intel" context triggers dossier workflows

---

## Open Topics (12 Total)

These are design questions that require further exploration:

1. **Re-analysis triggers** — File change only? Scheduled cron? Manual? Hybrid with user control?
2. **Dossier versioning/history** — Can users rewind to last week's intelligence? Full version history or snapshots?
3. **Insight accumulation strategy** — Append new insights? Replace outdated? Score decay over time?
4. **Cross-dossier intelligence** — Shared knowledge graph? Can one dossier reference another's insights?
5. **Suggestion box → Pattern Detection pipeline** — How do widget suggestions flow into Pattern Detection system?
6. **Widget catalog governance** — Who approves promoted widgets? Automatic vs. manual review?
7. **External folder support** — Can users create dossiers on competitor repos outside project root?
8. **Dossier sharing** — Multi-user collaboration? Export/import formats?
9. **Agent prompt engineering** — How much prior context on re-analysis? Token budget management?
10. **Performance budget** — Max concurrent watchers? Debouncing strategy? Memory limits?
11. **Dossier templates** — Pre-configured templates for common patterns (auth flow, API route, component family)?
12. **Offline dossiers** — Behavior when watched folders deleted/unavailable? Archive? Alert?

---

## Next Steps

1. Review design document at `docs/design/INTEL_DOSSIER.md`
2. Prioritize open topics for resolution (Phase 1 vs. Future)
3. Create implementation plan (likely multi-phase)
4. Prototype widget system architecture
5. Design dossier data model (TypeScript types)
6. Plan Context routing integration
7. Consider MCP server integration (external analysis tools?)

---

## Notes

- Feature aligns with Self-Evolving UI philosophy (agent-driven composition)
- Fills gap between static docs and real-time monitoring
- Intelligence division metaphor provides clear mental model
- Widget catalog approach balances flexibility with maintainability
- Open topics indicate substantial design exploration needed before implementation
