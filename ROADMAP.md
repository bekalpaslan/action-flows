# ActionFlows Dashboard Roadmap

> Single source of truth for "what's next"
> Last Updated: 2026-02-08 23:50:00 UTC
> Updated By: Initial Import from Project State Inventory

---

## Quick Wins (Low-Effort, Ready to Go)

| ID | Title | Priority | Effort | Status |
|----|-------|----------|--------|--------|
| R-001 | WebSocket broadcast for awaiting input | P0 | 1 day | not-started |
| R-002 | Redis session listing via SCAN | P0 | 1 day | not-started |
| R-003 | Duplicate user routes consolidation | P2 | 1 day | not-started |
| R-004 | API key enforcement (header-only) | P1 | 1 day | not-started |
| R-005 | Remove type assertions in shared types | P1 | 2 days | not-started |
| R-006 | Complete per-session ACL implementation | P0 | 2 days | not-started |

**Selection Criteria:** Effort ≤ 2 days, no blockers, clear scope, high value

---

## Immediate (0-2 weeks)

| ID | Title | Priority | Effort | Dependencies | Owner | Status |
|----|-------|----------|--------|--------------|-------|--------|
| R-001 | WebSocket broadcast for awaiting input | P0 | 1 day | — | unassigned | not-started |
| R-002 | Redis session listing via SCAN | P0 | 1 day | — | unassigned | not-started |
| R-003 | Duplicate user routes consolidation | P2 | 1 day | — | unassigned | not-started |
| R-004 | API key enforcement (header-only) | P1 | 1 day | — | unassigned | not-started |
| R-005 | Remove type assertions in shared types | P1 | 2 days | — | unassigned | not-started |
| R-006 | Complete per-session ACL implementation | P0 | 2 days | — | unassigned | not-started |
| R-007 | Command ACK persistence | P1 | 1 week | — | unassigned | not-started |
| R-008 | File diff snapshots | P1 | 1 week | — | unassigned | not-started |
| R-009 | InlineButtons → ConversationPanel integration | P1 | 2 days | — | unassigned | not-started |
| R-010 | PersistentToolbar → AppContent integration | P1 | 2 days | — | unassigned | not-started |
| R-011 | StarBookmark → ConversationPanel integration | P1 | 1 day | — | unassigned | not-started |
| R-012 | HarmonyPanel → Dashboard/Settings tab | P1 | 2 days | — | unassigned | not-started |
| R-013 | SquadPanel → Main dashboard/session view | P1 | 3 days | — | unassigned | not-started |

---

## Short-Term (2-6 weeks)

| ID | Title | Priority | Effort | Dependencies | Owner | Status |
|----|-------|----------|--------|--------------|-------|--------|
| R-020 | Path traversal security tests | P0 | 1 week | — | unassigned | not-started |
| R-021 | Load tests (1K sessions, 1K clients) | P0 | 2 days | — | unassigned | not-started |
| R-022 | Redis failover and recovery tests | P0 | 1 week | — | unassigned | not-started |
| R-023 | Backend services unit tests | P1 | 1 week | — | unassigned | not-started |
| R-024 | Frontend hooks unit tests | P1 | 1 week | — | unassigned | not-started |
| R-025 | Self-Evolving UI integration tests | P1 | 1 week | R-009, R-010, R-011 | unassigned | not-started |
| R-026 | Harmony Detection Phase 2 Integration | P0 | 3 weeks | — | unassigned | not-started |
| R-027 | OrchestratorParser service | P0 | 3 days | — | unassigned | not-started |
| R-028 | WebSocket parser integration | P0 | 2 days | R-027 | unassigned | not-started |
| R-029 | Dashboard screen foundation | P0 | 4 weeks | R-012, R-026 | unassigned | not-started |
| R-030 | Key metrics display (sessions, chains, harmony) | P1 | 1 week | R-029 | unassigned | not-started |
| R-031 | Active sessions overview with status cards | P1 | 1 week | R-029 | unassigned | not-started |
| R-032 | Recent chains timeline | P1 | 1 week | R-029 | unassigned | not-started |

---

## Medium-Term (6-12 weeks)

| ID | Title | Priority | Effort | Dependencies | Owner | Status |
|----|-------|----------|--------|--------------|-------|--------|
| R-040 | Flows Screen Implementation | P1 | 4 weeks | R-029 | unassigned | not-started |
| R-041 | Flow list with descriptions | P1 | 1 week | R-040 | unassigned | not-started |
| R-042 | Chain structure diagrams (ReactFlow) | P1 | 1 week | R-040 | unassigned | not-started |
| R-043 | Execution history per flow | P1 | 1 week | R-040 | unassigned | not-started |
| R-044 | Flow creation wizard integration | P1 | 1 week | R-040 | unassigned | not-started |
| R-045 | Actions Screen Implementation | P1 | 4 weeks | R-029 | unassigned | not-started |
| R-046 | Action list with agent definitions | P1 | 1 week | R-045 | unassigned | not-started |
| R-047 | Model selection display (haiku/sonnet/opus) | P1 | 1 week | R-045 | unassigned | not-started |
| R-048 | Action usage statistics | P1 | 1 week | R-045 | unassigned | not-started |
| R-049 | Logs Screen Implementation | P1 | 4 weeks | R-029 | unassigned | not-started |
| R-050 | Execution logs browser | P1 | 1 week | R-049 | unassigned | not-started |
| R-051 | LEARNINGS.md searchable integration | P1 | 1 week | R-049 | unassigned | not-started |
| R-052 | Audit trail with git log | P1 | 1 week | R-049 | unassigned | not-started |
| R-053 | Settings Screen Implementation | P1 | 4 weeks | R-029 | unassigned | not-started |
| R-054 | User preferences UI | P1 | 1 week | R-053 | unassigned | not-started |
| R-055 | Global configuration panel | P1 | 1 week | R-053 | unassigned | not-started |
| R-056 | Theme customization system | P2 | 1 week | R-053 | unassigned | not-started |
| R-057 | Complete Self-Evolving UI Phase 4 | P2 | 6 weeks | R-025 | unassigned | not-started |
| R-058 | ApprovalDialog component | P2 | 1 week | R-057 | unassigned | not-started |
| R-059 | ModificationHistory component | P2 | 1 week | R-057 | unassigned | not-started |
| R-060 | Modification executor service | P2 | 1 week | R-057 | unassigned | not-started |
| R-061 | Git integration for modifications | P2 | 1 week | R-057 | unassigned | not-started |

---

## Long-Term (12+ weeks)

| ID | Title | Priority | Effort | Dependencies | Owner | Status |
|----|-------|----------|--------|--------------|-------|--------|
| R-070 | Session Replay & Debugging | P2 | 2 weeks | — | unassigned | not-started |
| R-071 | Step-level replay execution | P2 | 1 week | R-070 | unassigned | not-started |
| R-072 | Breakpoints and time-travel debugging | P2 | 1 week | R-070 | unassigned | not-started |
| R-073 | Multi-User Collaboration Features | P2 | 3 weeks | — | unassigned | not-started |
| R-074 | Session sharing and ACL | P2 | 1 week | R-073 | unassigned | not-started |
| R-075 | Threaded comments on chains/steps | P2 | 1 week | R-073 | unassigned | not-started |
| R-076 | User presence indicators | P2 | 1 week | R-073 | unassigned | not-started |
| R-077 | Metrics & Analytics Dashboard | P2 | 2 weeks | — | unassigned | not-started |
| R-078 | Success rate tracking by action/flow | P2 | 1 week | R-077 | unassigned | not-started |
| R-079 | Duration distribution analysis | P2 | 1 week | R-077 | unassigned | not-started |
| R-080 | Performance Optimization (Virtualization) | P2 | 2 weeks | — | unassigned | not-started |
| R-081 | FileExplorer virtualization (react-window) | P2 | 1 week | R-080 | unassigned | not-started |
| R-082 | SessionTree virtualization | P2 | 1 week | R-080 | unassigned | not-started |
| R-083 | Accessibility Improvements (WCAG) | P3 | 2 weeks | — | unassigned | not-started |
| R-084 | ARIA labels on all interactive elements | P3 | 1 week | R-083 | unassigned | not-started |
| R-085 | Keyboard navigation and screen readers | P3 | 1 week | R-083 | unassigned | not-started |
| R-086 | MCP Server Expansion | P2 | 3 weeks | — | unassigned | not-started |
| R-087 | Add list_sessions, get_session tools | P2 | 1 week | R-086 | unassigned | not-started |
| R-088 | Add event subscription tools | P2 | 1 week | R-086 | unassigned | not-started |
| R-089 | Zod validation for MCP parameters | P2 | 1 week | R-086 | unassigned | not-started |

---

## Milestones

### M1: Production-Ready Core (Weeks 1-2)
**Goal:** Fix critical backend gaps and security issues for production deployment
**Items:** R-001, R-002, R-004, R-005, R-006, R-007, R-008, R-020
**Success Criteria:**
- [ ] Redis fully operational with session listing (SCAN)
- [ ] All WebSocket state changes broadcast properly
- [ ] Per-session ACL enforced at all endpoints
- [ ] API keys enforced in headers only, not query params
- [ ] Path traversal security tests passing
- [ ] Type assertions removed from codebase
- [ ] Command ACK results persisted to storage
- [ ] File diff snapshots functional

---

### M2: Self-Evolving UI Integration (Weeks 2-3)
**Goal:** Wire up existing Phase 1-3 components into main UI
**Items:** R-009, R-010, R-011, R-012, R-013
**Success Criteria:**
- [ ] InlineButtons render in ConversationPanel
- [ ] PersistentToolbar visible in main AppContent layout
- [ ] StarBookmark icon appears on conversation messages
- [ ] HarmonyPanel accessible in Dashboard/Settings
- [ ] SquadPanel displays in session view with agent cards
- [ ] All components receive WebSocket events correctly

---

### M3: Harmony System Complete (Weeks 3-5)
**Goal:** Full Harmony Detection Phase 2 integration with live visualization
**Items:** R-026, R-027, R-028
**Success Criteria:**
- [ ] OrchestratorParser service operational
- [ ] WebSocket handler parses all output formats correctly
- [ ] Dashboard displays harmony violations in real-time
- [ ] ChainTable and StepTimeline components functional
- [ ] Metrics tracking shows harmony percentage over time
- [ ] Graceful degradation UI handles parse failures

---

### M4: Dashboard Foundation (Weeks 5-8)
**Goal:** First complete dashboard screen with key metrics and harmony monitoring
**Items:** R-029, R-030, R-031, R-032
**Success Criteria:**
- [ ] Key metrics display (sessions, chains, harmony percentage)
- [ ] Active sessions overview with status cards
- [ ] Recent chains timeline visualization
- [ ] Harmony status panel integrated and live
- [ ] Recent learnings feed from LEARNINGS.md
- [ ] Real-time WebSocket updates to all widgets

---

### M5: Complete Dashboard Screens (Weeks 9-20)
**Goal:** All 5 main navigation tabs fully functional
**Items:** R-040, R-045, R-049, R-053, R-057
**Success Criteria:**
- [ ] Flows screen: visualize FLOWS.md, execution history, creation wizard
- [ ] Actions screen: visualize ACTIONS.md, agent definitions, model display
- [ ] Logs screen: INDEX.md browser, LEARNINGS.md search, audit trail
- [ ] Settings screen: user preferences, quick actions, global config, themes
- [ ] Self-Evolving UI Phase 4: approval flow, execution, rollback complete

---

### M6: Production Deployment (Week 20+)
**Goal:** Fully tested, production-ready deployment
**Items:** R-021, R-022, R-023, R-024, R-025
**Success Criteria:**
- [ ] Load tests passed (1K sessions, 1K clients)
- [ ] Redis failover tests passing
- [ ] Unit test coverage ≥ 80% (backend, frontend)
- [ ] Integration test coverage for self-evolving UI complete
- [ ] E2E test coverage ≥ 80%
- [ ] Full security audit checklist completed
- [ ] Deployment runbook finalized

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
| 4-6 weeks | 20+ files, 3000+ LOC, cross-package changes | Major system feature, multi-phase implementation |

---

## How to Use This Roadmap

### For Orchestrators
1. **Daily:** Check "Quick Wins" for immediate tasks (low effort, ready to go)
2. **Weekly:** Review "Immediate" tier for sprint planning
3. **Biweekly:** Re-evaluate "Short-Term" tier, move completed items to "Done"
4. **Monthly:** Update "Medium-Term" and "Long-Term" based on new learnings
5. **After milestones:** Run `planning/` flow in "update" mode to reprioritize

### For Humans
1. Use `planning/` flow in "review" mode to see status updates
2. Use `planning/` flow in "update" mode to reprioritize after major milestones
3. Reference IDs (R-XXX) in discussions and commits for traceability
4. Update "Updated By" field when manually editing

### For Status Updates
After completing an item:
1. Change Status from "not-started" to "in-progress" when starting work
2. Change Status to "done" when complete
3. Update Last Updated timestamp
4. Move to appropriate completed section (or remove from active tiers)
5. Check if any dependent items are now unblocked
6. Update LEARNINGS.md if applicable

---

## Metadata

**Project:** ActionFlows Dashboard
**Current Phase:** Core infrastructure complete, UI screens in progress
**Overall Progress:** ~80% backend, ~20% dashboard screens, 100% framework
**Last Reviewed:** 2026-02-08
**Next Review Scheduled:** Weekly

---

## References

- **Project State Inventory:** `.claude/actionflows/logs/analyze/project-state-inventory_2026-02-08-23-40-08/analysis.md`
- **Implementation Status:** `docs/status/IMPLEMENTATION_STATUS.md`
- **Frontend Status:** `docs/status/FRONTEND_IMPLEMENTATION_STATUS.md`
- **Execution History:** `.claude/actionflows/logs/INDEX.md`
- **Learnings:** `.claude/actionflows/LEARNINGS.md`
- **Framework:** `.claude/actionflows/FLOWS.md`, `.claude/actionflows/ACTIONS.md`
