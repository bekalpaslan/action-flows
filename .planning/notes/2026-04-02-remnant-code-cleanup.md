---
date: "2026-04-02 03:00"
promoted: false
---

Concerns about remnant code from previous version:
1. docs/ folder — PROJECT_DASHBOARD.md, DOCS_INDEX.md reference old cosmic UI and features. Stale and misleading.
2. Irrelevant test files — old backend tests may reference cosmic-specific behavior or patterns that no longer exist.
3. ActionFlows framework (.claude/actionflows/) — ORCHESTRATOR.md, CONTEXTS.md, FLOWS.md, CONTRACT.md, project.config.md all reference cosmic model (stars, harmony, sparks). Contexts route to removed workbenches (Maintenance, Respect). Agent instructions reference cosmic patterns. Framework instructions need a full revisit to align with the new agentic OS direction.
