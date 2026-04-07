---
date: "2026-04-02 20:00"
promoted: false
---

PRODUCT CONCEPT: Flows-OS ships team templates — pre-configured workbench setups for different team types.

Team classifications:
1. Early-stage startup (1-3 eng) — max autonomy, minimal gates, speed above all
2. Consumer mobile/web (4-8 eng) — fast iteration, heavy frontend, A/B testing flows
3. Developer tools/infra (3-10 eng, senior) — deep technical, API-focused, performance flows
4. B2B SaaS platform (10-30 eng, squads) — longer cycles, reliability, compliance flows
5. Data/ML products (5-15 hybrid) — training vs serving, experiment tracking flows
6. Enterprise/regulated (20-50+ eng) — approval gates everywhere, audit trails, security reviews
7. Hardware-adjacent/embedded (3-8 eng) — long validation, physical constraints

What a template configures:
- Which workbenches are active (startup doesn't need Archive, enterprise needs everything)
- Autonomy levels per workbench (startup = YOLO, enterprise = human-in-the-loop everywhere)
- Default flows registered (startup = code-and-review, enterprise = code-review-security-audit-compliance)
- Agent personality per workbench (startup Review agent = fast glance, enterprise Review agent = thorough audit)
- Pipeline complexity (startup = linear chains, enterprise = multi-agent parallel with approval gates)
- Neural validation strictness (startup = warnings only, enterprise = blocking on every violation)

Key insight: at what team size does agent-to-agent coordination matter more than agent-to-human?
- Solo/2-person: agent serves the human
- 5-10: agents serve the team (shared context, cross-workbench awareness)
- 10+: agents coordinate with each other (team workbenches, shared state, conflict resolution)

This ties into custom workbench creation (Phase 10) and the community workbench repo idea.
