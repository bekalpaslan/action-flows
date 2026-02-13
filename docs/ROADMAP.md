# ActionFlows Universe — Product Roadmap

**Last Updated:** 2026-02-13
**Status:** In Development
**Time Horizon:** 12-16 weeks (Q1-Q2 2026)

---

## Executive Summary

This roadmap charts the evolution of ActionFlows from a sophisticated orchestration platform with dashboard to a **living software universe** — a spatial interface where work, wisdom, and tools converge into an explorable cosmos.

### Strategic Vision

ActionFlows transforms how humans collaborate with AI agents. Instead of command-line prompts or chat interfaces, you navigate a **cosmic map** where each star represents a different mode of work. The universe reflects your accumulated patterns, learning from how you work and evolving to support your workflows.

### Design Philosophy

The roadmap balances four strategic pillars:

1. **Quick Wins** — Instruction-level improvements that enhance orchestrator intelligence immediately (no code changes)
2. **Critical Unlocks** — Core infrastructure that unblocks downstream features (cosmic map rendering enables 11+ features)
3. **Growth Foundations** — Self-evolution capabilities (automatic pattern learning, progressive discovery)
4. **Visual Evolution** — The cosmos as living memory (color shifts, glow states, trace accumulation)

### Two Product Modes

During development, ActionFlows will maintain two modes:

- **ActionFlows Classic** — Traditional CLI + dashboard interface (current stable mode)
- **ActionFlows Universe** — Spatial cosmic interface (future default)

Users can toggle between modes during the transition. Once Universe mode reaches stability (estimated Phase 3), Classic mode will be deprecated over a 6-month sunset period.

---

## Phase Overview

| Phase | Timeline | Focus | Key Deliverables |
|-------|----------|-------|------------------|
| **Phase 0** | Week 1 (2-3 days) | Instruction Patches | Orchestrator behavior improvements, learning consultation, flow detection |
| **Phase 1** | Weeks 2-4 (2.5 weeks) | Critical Unlocks | Cosmic map as primary view, zoom navigation, health dashboard |
| **Phase 2** | Weeks 5-7 (3 weeks) | Growth Foundations | Fog of war discovery, chain auto-promotion, session tracking |
| **Phase 3** | Weeks 8-10 (3 weeks) | Visual Evolution | Color shifts, reactive glow, trace visualization, harmony terrain |
| **Phase 4** | Weeks 11-16 (5-6 weeks) | Ecosystem Growth | Tool embedding, contract evolution, moon orbits, workbench emergence |

**Total Duration:** 12-16 weeks (3-4 months)
**Effort Estimate:** 74 person-days

---

## Phase 0: Instruction Patches

**Timeline:** Week 1 (2-3 days)
**Effort:** 2 person-days
**Risk Level:** Low

### Objective

Improve orchestrator intelligence through instruction-level changes only. No code modifications required — these are updates to the orchestrator's behavioral framework files.

### Key Improvements

1. **Learning Consultation** — Orchestrator reads accumulated learnings at session start, preventing repeat mistakes
2. **License Verification** — Ensure open-source license file exists (MIT License)
3. **Mid-Chain Evaluation Logging** — Track orchestrator's decision-making when recompiling chains mid-execution
4. **Flow Candidate Detection** — Automatically surface reusable patterns for registration
5. **Second-Opinion Enforcement** — Ensure automated second reviews trigger consistently
6. **Audience Detection** — Tailor responses to user expertise level (coder, explorer, regular user)
7. **Agent Identity Guards** — Strengthen subagent boundaries to prevent orchestrator behavior leakage

### Success Criteria

- ✅ Orchestrator consults `LEARNINGS.md` at every session start
- ✅ License file verified (or created if missing)
- ✅ Mid-chain decisions logged and traceable
- ✅ Flow candidate suggestions surface after 3+ chain reuses

### Testing Approach

- Start new session, verify learning consultation in trace logs
- Compile ad-hoc chain, verify flow-candidate suggestion appears
- Trigger mid-chain recompilation, verify reasoning logged

---

## Phase 1: Critical Unlocks

**Timeline:** Weeks 2-4 (2.5 weeks)
**Effort:** 12 person-days
**Risk Level:** High (paradigm shift)

### Objective

Transform ActionFlows from dashboard-first to **cosmic-map-first** experience. This phase unlocks 11 downstream features that depend on spatial visualization.

### Major Features

#### 1. Cosmic Map as Primary View

**What:** Replace traditional dashboard with a spatial cosmic map showing 8 framework stars (Work, Maintenance, Review, Settings, Explore, PM, Archive, Harmony)

**Why:** The cosmic map makes the "living universe" metaphor tangible. Users see the entire system at once, understand spatial relationships, and navigate by intention rather than menus.

**Includes:**
- Redesigned app routing (cosmic map = default view)
- Full-screen spatial layout (no sidebar by default)
- Floating command center (top-right corner)
- Dashboard fallback toggle (preserve Classic mode)

**Complexity:** High (routing + layout paradigm shift)

---

#### 2. Zoom-Based Navigation

**What:** Click a star → zoom into its interior view. Click back → return to cosmic map.

**Why:** Navigation becomes spatial and intuitive. Each star's interior contains relevant tools, workflows, and context — organized by purpose, not file structure.

**Includes:**
- Camera controller with smooth zoom animations (2-3 second transitions)
- 8 star interior views (WorkInterior.tsx, MaintenanceInterior.tsx, etc.)
- State management for current view (`cosmic` vs. `star:WORK`)

**Complexity:** High (camera system + interior layout design)

---

#### 3. Health Score Dashboard Widget

**What:** Real-time system health score (0-100) visible in UI, updated automatically

**Why:** Users shouldn't need manual API calls to check system health. Proactive visibility encourages healthy practices.

**Includes:**
- Polling health endpoint every 30 seconds
- Color-coded indicators (green ≥90, yellow 80-89, red <80)
- Click to expand → component breakdown
- "Heal Now" button when score drops below 80

**Complexity:** Low (simple polling widget)

---

### Dependencies Unlocked

Completing Phase 1 enables:
- Fog of war discovery system (Phase 2)
- Color/glow/trace visualizations (Phase 3)
- Tool embedding in star interiors (Phase 4)
- Moon orbits, spark animations (Phase 4)
- 11 total dependent features

### Success Criteria

- ✅ App launches into cosmic map by default
- ✅ Click star → smooth zoom animation into interior
- ✅ Zoom out → return to cosmic overview
- ✅ Traditional dashboard accessible via toggle
- ✅ Health score visible without manual endpoint checks
- ✅ 80%+ of sessions start in cosmic mode (not dashboard fallback)

### Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Camera animations janky on low-end hardware | Medium | Provide "reduced motion" accessibility toggle |
| Star interiors feel empty initially | High | Start with WorkInterior (most content), iterate based on usage |
| Users prefer dashboard mode | Low | Keep dashboard toggle, track analytics to inform future decisions |
| Electron-specific rendering issues | Medium | Test early on Windows, Mac, and Linux |

---

## Phase 2: Growth Foundations

**Timeline:** Weeks 5-7 (3 weeks)
**Effort:** 13 person-days
**Risk Level:** Medium

### Objective

Enable **self-evolution capabilities**. The system learns from usage patterns, promotes recurring workflows, and guides users through progressive discovery.

### Major Features

#### 1. Fog of War Discovery System

**What:** Stars transition through three states (HIDDEN → FAINT → REVEALED) based on readiness conditions

**Why:** Progressive disclosure reduces overwhelm for new users while preserving depth for power users. Advanced features "emerge" when you're ready.

**Discovery Rules:**
- **REVEALED by default:** Work, Maintenance, Settings (core framework)
- **FAINT → REVEALED:** Review (after 1 session), Explore (after 10 sessions)
- **HIDDEN initially:** Intel, Respect (manual unlock)
- **Session-based thresholds:** PM/Archive appear after 5-20 sessions

**Includes:**
- Discovery rules engine (condition evaluation)
- Fog state tracking per user per star
- `RegionDiscoveredEvent` when states transition
- Toast notifications: "New star discovered: EXPLORE"

---

#### 2. Session Count Tracking

**What:** Track how many times each star has been visited per user

**Why:** Enables fog of war triggers and chain promotion logic. Foundation for adaptive behavior.

**Includes:**
- Session counter increments on star entry
- `/api/analytics/session-counts` endpoint
- Persistent storage (in-memory for dev, Redis for prod)

---

#### 3. Chain Auto-Promotion

**What:** When a chain pattern is used 3+ times, automatically suggest registering it as a reusable flow

**Why:** Users shouldn't manually catalog patterns. The system learns your workflows and offers to formalize them.

**Pattern Detection:**
- Hash chain action sequences: `analyze→plan→code→review→commit`
- Threshold: 3 uses across 2+ sessions
- Exclude trivial chains (<2 steps)
- Auto-generate flow names: `{context}/{primary-action}-pattern`

**Includes:**
- Flow candidate notification modal ("Register this as a flow?")
- `/api/flows/candidates` endpoint
- Promotion workflow (approve/reject/defer)

---

#### 4. Healing Recommendation Auto-Surface

**What:** When system health drops below 80%, orchestrator proactively suggests running the healing flow

**Why:** Preventive maintenance. Catch contract drift before it accumulates.

**Includes:**
- Session-start health check
- Warning surface: "⚠️ System health at 72%. Recommend healing flow?"
- "Heal Now" button in health widget
- Auto-compile `maintenance/health-protocol/` flow

---

### Success Criteria

- ✅ New users see only 3 stars initially (Work, Maintenance, Settings)
- ✅ Review star appears (FAINT) after first session
- ✅ Chains used 3+ times trigger promotion notification
- ✅ Health score <80 surfaces healing recommendation
- ✅ Discovery notifications viewed (not immediately dismissed)

### Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Chain promotion too aggressive (spam) | Medium | Raise threshold to 5 uses if noisy, add "never suggest" option |
| Fog of war hides needed features | High | Conservative defaults (most stars REVEALED early), user testing |
| Healing recommendations ignored | Low | Track dismissal rates, adjust surfacing logic |

---

## Phase 3: Visual Evolution

**Timeline:** Weeks 8-10 (3 weeks)
**Effort:** 12 person-days
**Risk Level:** Medium

### Objective

The cosmos becomes a **living memory system**. Visual state reflects accumulated wisdom — colors shift with activity, stars glow with notifications, well-worn paths brighten over time.

### Major Features

#### 1. Color Shift Based on Activity

**What:** Star colors shift warmer (toward purple) with high activity, cooler (toward cyan) with low activity

**Why:** At a glance, users see where work is happening. The universe reflects reality.

**Calculation:**
- Track activity metrics: recent sessions, total steps, success rate
- Map to HSL hue shift: -180 (cool) to +180 (warm)
- Smooth CSS transitions (1-2 second gradients)

---

#### 2. Glow Intensity (Reactive State)

**What:** Stars glow brighter when they have pending notifications or active sessions

**Why:** Pre-signals state before entry. "REVIEW is glowing — something needs attention."

**Calculation:**
- Base glow: 0.3 (ambient)
- +0.2 per pending notification
- +0.1 per active session
- Max glow: 1.0

---

#### 3. Trace Accumulation Visualization

**What:** Connections between stars brighten and thicken as more work flows through them

**Why:** Well-worn paths become visible. Workflow patterns emerge organically.

**Tracking:**
- Edge usage counter: `WORK → REVIEW` used 12 times
- Opacity: 1 use = 0.2, 10+ uses = 1.0
- Fade over time: unused paths dim after 30 days

---

#### 4. Harmony as Spatial Layer

**What:** Click empty space (not on a star) → zoom into "the space between stars" (Harmony terrain)

**Why:** Harmony isn't a sidebar — it's the fabric of the universe. Positioned spatially, not hierarchically.

**Includes:**
- Harmony interior view (gate checkpoints, health metrics, violation logs)
- Dark nebula visual metaphor (gates glow like checkpoints)
- Back button → return to cosmic map

---

### Success Criteria

- ✅ Stars shift color within first week of activity
- ✅ Users notice glow before clicking (informal feedback)
- ✅ Trace accumulation visible (well-worn paths obvious)
- ✅ Harmony accessed via spatial click (not just sidebar tab)

### Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Color shifts too subtle | Low | Exaggerate during beta, tune based on feedback |
| Glow effects cause visual noise | Medium | Cap max glow, add "reduced effects" setting |
| Trace rendering performance issues | Medium | Limit to top 20 paths, use canvas rendering |
| Harmony terrain metaphor confusing | High | Onboarding tooltip: "Click space to view system health" |

---

## Phase 4: Ecosystem Growth

**Timeline:** Weeks 11-16 (5-6 weeks)
**Effort:** 35 person-days
**Risk Level:** Low-Medium (mature features)

### Objective

Advanced features, tooling maturity, and contract evolution. This phase completes the vision — all identified gaps closed.

### Feature Batches

#### Batch A: Tooling Integration (11 days)

**Tool Embedding in Star Interiors**
- Stars can embed Editor, Canvas, Coverage tools
- Drag-and-drop or config-based attachment
- Example: Work star embeds Code Editor

**Coverage Tool Implementation**
- Visualize contract compliance per format
- Show parser status (complete/partial/missing)
- Interactive click-through to harmony violations

**Universal DIR.md Generation**
- Auto-generate directory manifests for all code directories
- Script: `pnpm run generate:dir-manifests`
- Reduces agent token consumption by 80%+ during code navigation

---

#### Batch B: Contract Evolution (11 days)

**Contract Version Migration**
- Implement version negotiation (backend checks contract version)
- Support dual-version parsing (current + previous)
- 90-day migration window before sunsetting old versions

**Format Deprecation Tracking**
- Add `deprecated: boolean` to format metadata
- Emit warnings when deprecated formats used
- Auto-sunset after 90 days

**Violation Pattern Grouping**
- Aggregate similar violations (same format, same error type)
- Show patterns in harmony dashboard
- Example: "12 instances of Format 5.1 missing 'Score' field"

---

#### Batch C: Cosmic Details (8 days)

**Moon Orbits (Data Sources)**
- Define external data sources (MCP servers, APIs)
- Render as moons orbiting stars
- Example: Postgres MCP orbits Work star

**Spark Traveling Events**
- Emit events when agents start/complete
- Render as particles traveling between stars
- Visual feedback for active chains

**Region Discovery Events**
- Emit events when fog states transition
- Toast notifications for new discoveries

---

#### Batch D: Emergence System (5 days)

**Workbench Emergence**
- New stars appear when readiness conditions met
- Example: Frequent `analyze→visualize` chains → DATAVIZ star emerges
- Custom stars reflect user-specific patterns

---

### Success Criteria

- ✅ Tools embeddable in ≥3 star interiors
- ✅ Coverage tool used weekly
- ✅ Contract version migration tested (no breakage)
- ✅ At least 1 custom star emerges per user after 30 sessions

### Parallelization Opportunities

Phase 4 batches are independent and can run in parallel with multiple developers:

| Batch | Duration (sequential) | Developer |
|-------|----------------------|-----------|
| Batch A (Tooling) | 11 days | Dev 1 |
| Batch B (Contract) | 11 days | Dev 2 |
| Batch C (Cosmic) | 8 days | Dev 3 |
| Batch D (Emergence) | 5 days | Dev 1/2/3 (after earlier work) |

**Total Calendar Time (parallel):** 3 weeks (vs. 6 weeks sequential)

---

## Dependencies Visualization

```
Phase 0 (Instruction Patches)
   └─ No dependencies → Immediate execution

Phase 1 (Critical Unlocks)
   ├─ Cosmic Map (GAP-1)
   │    └─ Unlocks: Fog of War, Color/Glow/Traces, Zoom, Harmony Terrain, Tool Embedding, Moons, Sparks (11 features)
   ├─ Zoom Navigation (GAP-5)
   │    └─ Depends: Cosmic Map
   │    └─ Unlocks: Harmony Terrain, Tool Embedding
   └─ Health Widget (GAP-12)
        └─ Unlocks: Healing Recommendations

Phase 2 (Growth Foundations)
   ├─ Fog of War (GAP-2)
   │    └─ Depends: Cosmic Map
   │    └─ Unlocks: Workbench Emergence, Discovery Events
   ├─ Session Tracking (GAP-10)
   │    └─ Unlocks: Chain Auto-Promotion
   ├─ Chain Auto-Promotion (GAP-8)
   │    └─ Depends: Session Tracking
   └─ Healing Recommendations (GAP-13)
        └─ Depends: Health Widget

Phase 3 (Visual Evolution)
   ├─ Color/Glow/Traces (GAP-3, GAP-4, GAP-11)
   │    └─ Depends: Cosmic Map
   └─ Harmony Terrain (GAP-6)
        └─ Depends: Cosmic Map + Zoom Navigation

Phase 4 (Ecosystem Growth)
   ├─ Tool Embedding (GAP-17) → Depends: Zoom Navigation
   ├─ Moons/Sparks (GAP-7, GAP-28) → Depends: Cosmic Map
   ├─ Discovery Events (GAP-29) → Depends: Fog of War
   ├─ Workbench Emergence (GAP-9) → Depends: Fog of War
   └─ Coverage, Contract Evolution, DIR.md → No dependencies
```

---

## Time Estimates

| Phase | Duration | Effort (person-days) | Parallelizable? |
|-------|----------|---------------------|-----------------|
| Phase 0 | 2-3 days | 2 days | No (orchestrator-only) |
| Phase 1 | 2.5 weeks | 12 days | No (foundational) |
| Phase 2 | 3 weeks | 13 days | Partially (backend + frontend split) |
| Phase 3 | 3 weeks | 12 days | Yes (4 independent features) |
| Phase 4 | 5-6 weeks | 35 days | Yes (4 batches) |
| **Total** | **12-16 weeks** | **74 days** | — |

### Assumptions

- 1 developer full-time (or equivalent)
- 5 working days per week
- Includes testing, iteration, and polish
- Phase 4 batches can reduce calendar time significantly if parallelized

### Scenarios

- **Optimistic (1 dev):** 12 weeks (3 months)
- **Realistic (1 dev):** 14 weeks (3.5 months)
- **Pessimistic (1 dev):** 16 weeks (4 months, includes scope adjustments)
- **Aggressive (3 devs):** 8 weeks (2 months, Phase 4 parallelized)

---

## Risk Assessment

### High-Risk Items

| Feature | Risk | Impact | Mitigation |
|---------|------|--------|-----------|
| Cosmic Map (Phase 1) | Large routing paradigm shift | High | Keep dashboard fallback, A/B test, gradual rollout |
| Zoom Navigation (Phase 1) | Animation complexity | High | Use battle-tested library (React Spring), performance profiling |
| Fog of War (Phase 2) | Hiding features frustrates power users | High | Conservative defaults (most stars visible early), analytics |
| Tool Embedding (Phase 4) | Many edge cases | High | Incremental rollout (Editor only first), expand iteratively |
| Contract Migration (Phase 4) | Breaking changes | High | Extensive testing, canary deployment, dual-version support |

### Medium-Risk Items

| Feature | Risk | Impact | Mitigation |
|---------|------|--------|-----------|
| Chain Auto-Promotion (Phase 2) | Too noisy | Medium | Threshold tuning, "never suggest" option |
| Trace Rendering (Phase 3) | Performance issues | Medium | Limit rendered traces (top 20), canvas optimization |
| Harmony Terrain (Phase 3) | Metaphor confusing | Medium | Onboarding tooltips, documentation |
| Moon Orbits (Phase 4) | Visual clutter | Medium | Limit to 3 moons per star, collapsible |

### Low-Risk Items

All instruction-only patches (Phase 0), session tracking, health widget, minor visual polish, DIR.md generation.

---

## Success Metrics

### Phase 1 Metrics
- **Cosmic map adoption:** 80%+ sessions start in cosmic mode
- **Zoom engagement:** Average time-to-first-star-click < 10 seconds
- **Health visibility:** Widget viewed ≥1x per session

### Phase 2 Metrics
- **Flow promotion:** 50%+ of recurring chains auto-promote within 2 weeks
- **Discovery engagement:** Discovery notifications not immediately dismissed
- **Healing compliance:** Healing flow triggered ≥60% when health <80

### Phase 3 Metrics
- **Color awareness:** Users notice color changes (informal feedback)
- **Glow effectiveness:** Reduces clicks-to-health-check by 30%
- **Harmony access:** Accessed via spatial click, not just sidebar

### Phase 4 Metrics
- **Tool embedding:** Tools embedded in ≥3 star interiors
- **Coverage usage:** Coverage tool viewed weekly
- **Contract stability:** Version migration tested with zero breakage
- **Emergence:** At least 1 custom star per user after 30 sessions

---

## Recommendations

### Start Here

1. **Execute Phase 0 immediately** — Quick wins with zero code changes
2. **Prioritize Cosmic Map (Phase 1)** — Critical unlock for 11+ downstream features
3. **Test early and often** — Phase 1 is high-risk; validate on real users ASAP
4. **Defer Workbench Emergence (Phase 4)** — Cool feature but not essential for core vision

### Parallelization Strategy

If working with multiple developers:

- **Phase 1-2:** Sequential (foundational work)
- **Phase 3:** Split visual features across 2 devs (color/glow + traces/harmony)
- **Phase 4:** Run batches A/B/C in parallel (3 devs → 3 weeks vs. 6 weeks)

### Two-Mode Shipping Strategy

Consider maintaining **ActionFlows Classic** alongside **ActionFlows Universe** during development:

- **Benefits:** Preserves existing workflows, reduces migration risk, allows gradual adoption
- **Timeline:** Universe becomes default after Phase 3 (estimated Week 10)
- **Sunset:** Classic deprecated 6 months after Universe stability (if adoption >80%)

---

## Next Steps

### Immediate Actions

1. **Review & Approve** — Present this roadmap to stakeholders for feedback
2. **Execute Phase 0** — Start instruction patches (2-3 days, zero risk)
3. **Spike Phase 1** — Prototype cosmic map routing (1 week validation spike)
4. **Kickoff Phase 1** — If spike succeeds, commit to full Phase 1 (2.5 weeks)

### Long-Term Planning

- **Q1 2026:** Phases 0-2 (Weeks 1-7)
- **Q2 2026:** Phases 3-4 (Weeks 8-16)
- **Q3 2026:** Polish, performance tuning, user onboarding
- **Q4 2026:** Public beta, Classic mode sunset planning

---

## Open Questions

1. **Performance targets:** What frame rates for zoom animations? (Target: 60fps)
2. **Discovery defaults:** Should power users skip fog of war entirely? (Configurable?)
3. **Classic sunset timeline:** 6 months after Universe stable, or longer?
4. **Mobile support:** Is cosmic map viable on mobile, or desktop-only? (Future consideration)

---

## Contributing

This roadmap is a living document. As development progresses, phases may be reordered based on:

- User feedback
- Technical discoveries
- Dependency changes
- Resource availability

Updates will be versioned and announced in project changelogs.

For questions or suggestions, open an issue with the `roadmap` label or contact the maintainers.

---

## License

ActionFlows Dashboard is released under the MIT License. See [LICENSE](../LICENSE) for details.
