# Contract Compliance Roadmap

**Executed:** 2026-02-12
**Validation Command:** `pnpm contracts:validate`
**Baseline:** 244 violations across 42 contracts (0 valid contracts)

---

## Executive Summary

The ActionFlows Dashboard currently has **245 total contract violations** affecting **41 of 42 component contracts**. These violations fall into three primary categories:

| Category | Count | % of Total |
|----------|-------|-----------|
| **Missing Test Hooks** (data-testid attributes) | 93 | 38% |
| **Props Mismatches** (Missing or Extra props) | 139 | 57% |
| **Missing Component Files** | 11 | 4% |
| **Summary Violation** | 2 | 1% |
| **TOTAL** | **245** | **100%** |

### Key Findings

1. **Most Violated Components:** LightBridgeEdge (20 violations), RegionStar (14), GlowIndicator (14), CodeEditor (14), ChatPanel (14)
2. **Highest Impact:** 11 *Workbench variants* and SessionPanel components are not yet implemented
3. **Systemic Issues:** Missing test hooks are pervasive (38% of all violations); props mismatches indicate contract drift
4. **Quick Wins:** Many violations are isolated test hooks that can be added independently

---

## Violation Breakdown by Category

### 1. Missing Test Hooks (93 violations, 38%)

**What This Means:** Components don't have `data-testid` attributes for E2E testing. This blocks test automation for critical workflows.

**Affected Components by Hook Count:**
- LightBridgeEdge: 3 missing hooks
- RegionStar: 4 missing hooks
- GlowIndicator: 3 missing hooks
- CodeEditor: 3 missing hooks
- ChatPanel: 7 missing hooks
- Terminal: 5 missing hooks
- ChangePreview: 4 missing hooks
- ControlButtons: 6 missing hooks
- GateCheckpointMarker: 2 missing hooks
- FolderHierarchy: 3 missing hooks
- ReminderButtonBar: 2 missing hooks
- ChainDAG: 3 missing hooks
- SparkAnimation: 2 missing hooks
- CommandPalette: 4 missing hooks
- and 21 other components

**Why This Matters:**
- Blocks E2E test creation and maintenance
- Makes debugging production issues harder
- Prevents reliable automation of critical workflows

**Effort to Fix:** Quick wins (< 30 minutes per component on average)

---

### 2. Props Mismatches (139 violations, 57%)

**What This Means:** Components have props that don't match the contract specification. Divided into two subcategories:

#### 2a. Missing Props (83 violations)
Contract specifies props that component implementation doesn't have.

**Top Components by Missing Props:**
| Component | Missing Props | Status |
|-----------|---------------|--------|
| LightBridgeEdge | 7 | CosmicMap extension |
| RegionStar | 10 | Living Universe core |
| CodeEditor | 5 | Workbench integration |
| Terminal | 3 | Workbench integration |
| ChangePreview | 5 | File editor feature |
| GlowIndicator | 3 | Common component |
| ChainDAG | 3 | Execution monitoring |
| ChainLiveMonitor | 2 | Execution monitoring |

**Common Patterns:**
- Contracts have aspirational props for features not yet built
- Example: `ChainLiveMonitor` contract expects `chainId` and `showAll` but component uses `sessionId` and `initialChain`
- Example: `RegionStar` contract lists 10 props (regionId, workbenchId, label, layer, fogState, glowIntensity, status, colorShift, health, selected) but component doesn't accept all of them

**Why This Matters:**
- Contract-code drift makes contracts unreliable for future implementation
- Consumers can't rely on promised API
- Manual reconciliation needed before fixing violations

**Effort to Fix:** Moderate (1-2 hours per component) — requires contract review and implementation update

#### 2b. Extra Props (56 violations)
Component implementation has props that contract doesn't specify.

**Top Components by Extra Props:**
| Component | Extra Props | Example |
|-----------|-------------|---------|
| ChatPanel | 7 | session, onSendMessage, collapsible, cwd, onClose, prefillMessage, showCloseButton |
| Terminal | 5 | sessionId, height, onHeightChange, isCollapsed, onToggleCollapse |
| CodeEditor | 6 | sessionId, initialFiles, fileToOpen, onFileOpened |
| FolderHierarchy | 3 | workspaceRoot, onFileSelect, height |
| GlowIndicator | 6 | active, level, default, intensity, pulse, children, className |
| ReminderButtonBar | 4 | sessionId, chainId, onReminderClick, reminder, variant |
| ChainDAG | 3 | chain, onStepSelected, onStepUpdate |
| Terminal | 5 | (see above) |

**Why This Matters:**
- Component has undocumented capabilities
- Consumers don't know about useful props
- Makes API surface area unclear
- May indicate feature creep

**Effort to Fix:** Low (30-60 minutes per component) — update contracts to match reality

---

### 3. Missing Component Files (11 violations, 4%)

**What This Means:** Contracts exist but component files haven't been implemented yet.

**Missing Components (All Workbench Variants + SessionPanel):**
```
packages/app/src/components/Workbench/
  ❌ WorkStarWorkbench.tsx
  ❌ StoryStarWorkbench.tsx
  ❌ SettingsStarWorkbench.tsx
  ❌ ReviewStarWorkbench.tsx
  ❌ RespectStarWorkbench.tsx
  ❌ PMStarWorkbench.tsx
  ❌ MaintenanceStarWorkbench.tsx
  ❌ IntelStarWorkbench.tsx
  ❌ ExploreStarWorkbench.tsx
  ❌ ArchiveStarWorkbench.tsx

packages/app/src/components/SessionPanel/
  ❌ SessionPanel.tsx
```

**Why This Matters:**
- These are critical components for the Living Universe architecture
- Workbench variants are the primary UI for each context (work, maintenance, explore, etc.)
- SessionPanel manages session state and lifecycle
- These 11 components block full dashboard functionality

**Implementation Status:**
- **Work context:** Partial implementation (may use generic Workbench)
- **Other contexts:** Not started or using placeholder components
- **SessionPanel:** Listed but not found; likely needs creation

**Effort to Fix:** Epic-level (4+ hours per component = 44+ hours total)

---

## Priority Matrix

### P0: Critical Path Blockers (33 violations, 13%)

**These violations prevent core features from functioning correctly.**

#### P0.1: Missing Component Files (11 violations)
**Components:** WorkStarWorkbench, StoryStarWorkbench, SettingsStarWorkbench, ReviewStarWorkbench, RespectStarWorkbench, PMStarWorkbench, MaintenanceStarWorkbench, IntelStarWorkbench, ExploreStarWorkbench, ArchiveStarWorkbench, SessionPanel

**Why P0:**
- All missing components are listed in ORCHESTRATOR.md or architecture documentation as implemented
- Dashboard layout depends on these components
- UI is broken/incomplete without them

**Risk:** Medium/High
- If these exist but are named differently → quick registry fix
- If these are truly not implemented → major feature work needed

**Effort:** 1-5 hours per component (investigation required)

**Recommended Action:**
1. Verify actual implementation status (may be under different names or paths)
2. If not implemented, prioritize based on usage frequency:
   - **Tier 1:** SessionPanel (session lifecycle)
   - **Tier 2:** WorkStarWorkbench (primary work context)
   - **Tier 3:** Remaining workbenches (secondary contexts)

---

#### P0.2: Major Props Drift (22 violations)
**Components:** ChainLiveMonitor (4), Terminal (8), FolderHierarchy (7), ChangePreview (3)

**Why P0:**
- These components have fundamental contract-code mismatches
- Contracts are aspirational (define how they *should* work)
- Current implementation diverges significantly
- Fixing requires reconciliation decision: adjust contract or update implementation

**Pattern Example - ChainLiveMonitor:**
```
CONTRACT expects:      chainId?, showAll?
IMPLEMENTATION has:    sessionId (required), initialChain?
MISMATCH:              Different data model (chain-centric vs session-centric)
```

**Effort:** 2-4 hours per component (decision + implementation)

**Recommended Action:**
1. Review each component's actual usage patterns
2. Decide: update contract or update implementation
3. Implement decision consistently
4. Add test hooks after props are reconciled

---

### P1: High-Traffic Components with Missing Test Hooks (74 violations, 30%)

**These violations block E2E testing and automation but don't prevent functionality.**

**Components by Test Hook Count:**
| Component | Missing Hooks | Violation Count | Usage |
|-----------|---------------|-----------------|-------|
| ChatPanel | 7 | 14 total | High — Core messaging |
| ControlButtons | 6 | 11 total | High — Execution control |
| CommandPalette | 4 | 4 total | Medium — Command entry |
| LightBridgeEdge | 3 | 20 total | Medium — Cosmic visualization |
| CodeEditor | 3 | 14 total | Medium — File editing |
| Terminal | 5 | 13 total | Medium — Command execution |
| ChangePreview | 4 | 12 total | Medium — File diffing |
| GateCheckpointMarker | 2 | 10 total | Low — Visualization |

**Why P1:**
- Test hooks are isolated fixes (don't affect functionality)
- Can be added in parallel
- Unblocks E2E test creation for critical workflows

**Effort:** 15-30 minutes per component (~40 hours total if doing all at once)

**Quick Win Strategy:** Batch these by feature area and add all hooks for a feature in one PR

---

### P2: Components with Moderate Props Drift (68 violations, 28%)

**These violations indicate contract-code inconsistency but don't break anything.**

**Components:**
- GlowIndicator (11 violations: 3 missing + 8 extra props)
- RegionStar (14 violations: 10 missing + 4 extra props)
- CosmicMap components (MoonOrbit, GateCheckpoint, LiveRegion, CosmicBackground, CosmicMap, BigBangAnimation)
- ConversationPanel (9 violations)
- SparkAnimation (7 violations)

**Why P2:**
- Extra props = undocumented but working features
- Missing props = aspirational or refactored features
- Fixing requires updating contracts to reflect reality

**Effort:** 30-60 minutes per component (~35 hours total)

**Recommended Action:**
1. Add extra props to contract (document actual behavior)
2. Remove missing props from contract (or implement them)
3. Add missing test hooks

---

### P3: Lower-Priority Components (5 violations, 2%)

**Minor violations or single-component issues that can be deferred.**

**Components:**
- CosmicBackground (1 violation: missing test hook)
- LiveRegion (1 violation: missing test hook)
- LoadingSpinner (4 violations: 2 missing props + 2 missing hooks)
- TraceRenderer (2 violations: 1 missing prop + 1 missing hook)
- OrchestratorButton (2 violations: missing hooks)
- DiscussButton (3 violations: missing hooks)

**Why P3:**
- Lower usage frequency
- Limited impact on core workflows
- Can be addressed in maintenance cycles

**Effort:** 15-30 minutes per component (~30 minutes total)

---

## Compliance Roadmap: Effort Estimation

### Quick Wins (< 1 hour to fix)

**Action:** Add test hooks to low-complexity components
**Components:** CosmicBackground, LiveRegion, OrchestratorButton, DiscussButton, TraceRenderer (5 components)
**Time:** ~2.5 hours (30 mins each)
**Impact:** 13 violations fixed (~5% of total)
**Recommendation:** Do this as warm-up or filler work

```
Targets:
- Add 2 hooks to OrchestratorButton
- Add 3 hooks to DiscussButton
- Add 1 hook to TraceRenderer
- Add 1 hook to CosmicBackground
- Add 1 hook to LiveRegion
```

---

### Sprint Work (1–4 hours to fix)

**Action:** Reconcile props + add test hooks for mid-tier components
**Components:** 12 components (ChatPanel, ControlButtons, CodeEditor, Terminal, ChangePreview, LightBridgeEdge, CommandPalette, GlowIndicator, ChainDAG, FolderHierarchy, ReminderButtonBar, ConversationPanel)
**Time:** ~36 hours (3 hours per component average)
**Impact:** 140 violations fixed (~57% of total)
**Phases:**

**Phase 1: Props Reconciliation (18 hours)**
- Decide for each component: update contract or implementation
- Update based on decision
- Verify no breaking changes

**Phase 2: Test Hook Addition (18 hours)**
- Add all remaining test hooks
- Verify hooks work in test automation

**Phase 3: Validation (2 hours)**
- Run `pnpm contracts:validate`
- Verify all components in this tier pass

---

### Epic Work (> 4 hours to fix)

#### Epic 1: Missing Components Implementation (44+ hours)
**Action:** Create or locate missing Workbench variants and SessionPanel
**Components:** 11 missing files

**Decision Gate:**
1. **Investigation (2 hours):** Verify these aren't implemented under different names
   - Search codebase for partial implementations
   - Check imports in main layout components
   - Review git history for deleted files

2. **If Not Found — Create (42+ hours):**
   - SessionPanel: 2-4 hours (session lifecycle UI)
   - Each Workbench variant: 4-6 hours × 10 = 40-60 hours
   - Total: ~42-64 hours

3. **If Found — Redirect (30 mins):**
   - Update contracts with correct file paths
   - Run validation again

**Recommendation:**
- Make this a separate epic tracked independently
- Coordinate with UI/UX team on Workbench design
- Prioritize SessionPanel first (foundation for all sessions)

#### Epic 2: CosmicMap Component Suite Props Reconciliation (8 hours)
**Action:** Reconcile props for Living Universe visualization components
**Components:** RegionStar (14), MoonOrbit (7), GateCheckpoint (6), CosmicMap (6), LightBridgeEdge (20 total violations but 17 from props)

**Subcategories:**
1. RegionStar: 10 missing props (probably aspirational for future phases)
2. LightBridgeEdge: 7 missing props (edge rendering features)
3. MoonOrbit: 6 missing props (orbital animation)
4. GateCheckpoint: 4 missing props (checkpoint rendering)

**Decision Process:**
- Are missing props needed now? → Add to implementation
- Are they future features? → Keep in contract, mark as "Phase N"
- Are they mistakes? → Remove from contract

**Effort:** 2 hours per component (investigation + implementation)

#### Epic 3: ChainLiveMonitor & ChainDAG Architecture Reconciliation (4 hours)
**Action:** Align execution monitoring components with session model
**Components:** ChainLiveMonitor (8 violations), ChainDAG (9 violations)

**Core Issue:**
- Contracts assume chain-centric data model
- Implementation uses session-centric model
- Mismatch prevents proper integration

**Tasks:**
1. Review architecture decision: which model is canonical? (2 hours)
2. Update contracts or implementation to match (2 hours)
3. Add test hooks (1 hour)

---

## Recommended Implementation Sequence

### Phase 1: Foundation (Weeks 1-2)
**Goal:** Quick wins + investigation + decision gates

**Week 1:**
- [ ] Investigation: Verify missing components (P0.1) — 2 hours
- [ ] Quick wins: Add test hooks to 5 low-complexity components (P3) — 2.5 hours
- [ ] Architecture decision: ChainLiveMonitor/ChainDAG model (Epic 3) — 2 hours

**Week 2:**
- [ ] Decision gate: Missing components — create or redirect? (decision log)
- [ ] Start Props Reconciliation Phase (Epic 2) — begin RegionStar (Epic 2)
- [ ] Complete ChainDAG reconciliation (Epic 3) — 4 hours

**Cumulative:** ~10.5 hours of work, 13+ violations fixed

**Metrics:**
- violations remaining: ~232
- % compliance: 5%

---

### Phase 2: Core Fixes (Weeks 3-4)
**Goal:** Eliminate P0 and P1 violations

**Week 3:**
- [ ] Complete Sprint Work Phase 1: Props Reconciliation — 18 hours
- [ ] Verify no breaking changes
- [ ] Update contracts/implementations

**Week 4:**
- [ ] Complete Sprint Work Phase 2: Test Hook Addition — 18 hours
- [ ] Run `pnpm contracts:validate`
- [ ] Fix any remaining issues

**Cumulative:** ~36 hours of work, 140+ violations fixed

**Metrics:**
- violations remaining: ~92
- % compliance: 62%

---

### Phase 3: Missing Components (Weeks 5-8)
**Goal:** Implement or redirect 11 missing components

**Approach:**
1. SessionPanel (Tier 1): 3-4 hours
2. WorkStarWorkbench (Tier 2): 5-6 hours
3. Remaining 9 Workbench variants (Tier 3): 40-50 hours (can be parallelized)

**Recommendation:**
- Parallelize Workbench variant creation (1 developer per variant = 1 week)
- SessionPanel can be done first to unblock layout work

**Cumulative:** ~44-64 hours of work, 11 violations fixed

**Metrics:**
- violations remaining: ~81
- % compliance: 67%

---

### Phase 4: Cosmic Architecture (Week 9)
**Goal:** Complete Living Universe component integration

**Tasks:**
- [ ] RegionStar implementation — 2 hours
- [ ] LightBridgeEdge reconciliation — 2 hours
- [ ] MoonOrbit reconciliation — 1 hour
- [ ] GateCheckpoint reconciliation — 1 hour
- [ ] Final test hooks — 2 hours

**Cumulative:** ~8 hours of work, remaining violations fixed

**Metrics:**
- violations remaining: 0
- % compliance: 100%

---

## Effort Summary

| Phase | Duration | Hours | Violations Fixed | Cumulative Fixed | % Compliance |
|-------|----------|-------|------------------|------------------|--------------|
| Investigation | 2 days | 10.5 | 13 | 13 | 5% |
| Quick Wins + Reconciliation | 10 days | 36 | 140 | 153 | 62% |
| Missing Components | 20 days | 54 | 11 | 164 | 67% |
| Living Universe Suite | 5 days | 8 | 81 | 245 | 100% |
| **TOTAL** | **~6 weeks** | **~109 hours** | **~245** | **~245** | **100%** |

---

## Risk Assessment

### High Risk
- **Missing Components Investigation:** If these are actually implemented but mislabeled, investigation is cheap. If they're truly not implemented, this is a major feature gap.
- **Props Reconciliation:** Decision between "fix contract" vs "fix implementation" could be contentious — need architecture consensus.

### Medium Risk
- **Test Hook Addition:** Generally safe but time-consuming if done serially.
- **CosmicMap Components:** Part of new Living Universe feature — may have aspirational specs.

### Low Risk
- **Quick Wins:** Isolated test hook additions, no functional changes.

---

## Recommended Next Steps

### Immediate (Today)
1. [ ] Review this roadmap with architecture team
2. [ ] Decision gate: P0.1 — are the 11 missing components actually missing?
3. [ ] Decision gate: Epic 3 — confirm execution monitoring architecture

### This Week
1. [ ] Complete investigation: 2 hours
2. [ ] Log architecture decisions (decision log in actionflows/)
3. [ ] Create Epic 1 task for missing components
4. [ ] Assign Quick Wins batch (2.5 hours)

### Next Week
1. [ ] Start Phase 2: Props Reconciliation
2. [ ] Parallelize where possible (multiple developers on different components)
3. [ ] Weekly validation runs to track progress

---

## Success Criteria

- [ ] All 42 components pass contract validation
- [ ] 100% of test hooks implemented and verified
- [ ] All props mismatches reconciled (contract or implementation)
- [ ] No missing component files
- [ ] `pnpm contracts:validate` returns: "✅ Valid contracts: 42/42"

---

## Appendix: Component Violation Details

### Detailed Violations by Component

```
LightBridgeEdge (20 violations)
├── Missing props: 7 (points, animated, waveEffect, intensity, pulseDelay, colorGradient, zIndex)
├── Extra props: 0
└── Missing hooks: 3

RegionStar (14 violations)
├── Missing props: 10 (regionId, workbenchId, label, layer, fogState, glowIntensity, status, colorShift, health, selected)
├── Extra props: 0
└── Missing hooks: 4

GlowIndicator (14 violations)
├── Missing props: 3 (status, size, animated, label)
├── Extra props: 8 (active, level, default, intensity, pulse, children, className)
└── Missing hooks: 3

CodeEditor (14 violations)
├── Missing props: 5 (filePath, content, language, readOnly, onChange, onSave)
├── Extra props: 6 (sessionId, initialFiles, fileToOpen, onFileOpened)
└── Missing hooks: 3

ChatPanel (14 violations)
├── Missing props: 0
├── Extra props: 7 (session, onSendMessage, collapsible, cwd, onClose, prefillMessage, showCloseButton)
└── Missing hooks: 7

Terminal (13 violations)
├── Missing props: 3 (initialCommand, theme, enableHistory)
├── Extra props: 5 (sessionId, height, onHeightChange, isCollapsed, onToggleCollapse)
└── Missing hooks: 5

ChangePreview (12 violations)
├── Missing props: 5 (originalContent, modifiedContent, filePath, format, readOnly)
├── Extra props: 3 (change, isExpanded, onToggle)
└── Missing hooks: 4

ControlButtons (11 violations)
├── Missing props: 2 (onPause, onResume, onCancel, onRetry, onSkip)
├── Extra props: 3 (disabled, loading, size)
└── Missing hooks: 6

GateCheckpointMarker (10 violations)
├── Missing props: 4 (checkpointId, x, y, status)
├── Extra props: 4 (gateId, position, active, color)
└── Missing hooks: 2

FolderHierarchy (10 violations)
├── Missing props: 4 (root, onSelectFile, expandedFolders, onToggleFolder)
├── Extra props: 3 (workspaceRoot, onFileSelect, height)
└── Missing hooks: 3

[... truncated for brevity ...]
```

---

**Generated by Contract Validation Analysis
DateTime: 2026-02-12
Validator Version: Wave 3**
