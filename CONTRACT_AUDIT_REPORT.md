# Behavioral Contract Audit Report

**Date:** 2026-02-12
**Scope:** All React components in `packages/app/src/components/`
**Contract Template:** v1.0.0 (7 required sections)

---

## Executive Summary

| Metric | Count | Percentage |
|--------|-------|------------|
| **Total Components** | 141 | 100% |
| **Components with Contracts** | 92 | 65.2% |
| **Components Missing Contracts** | 72 | 51.1% |
| **Contracts with Issues** | 29 | 31.5% of 92 |
| **Contract-Code Drift (Stale Paths)** | 17 | 18.5% of 92 |
| **Incomplete Contracts (Missing Sections)** | 12 | 13.0% of 92 |

**Note:** There is overlap — some components have BOTH missing contracts AND existing contracts with issues. The 72 missing contracts are for components WITHOUT any contract file.

---

## 1. Missing Contracts (72 Components)

Components without `.contract.md` files in `packages/app/src/contracts/`.

### 1.1 P0 — Critical Components (Must Have Contracts)

**Count:** 36 components

These are core architectural components that form the Living Universe experience.

#### Cosmic Map System (16 components)
New Phase 1 visualization components — central to Living Universe experience.

| Component | Path | Notes |
|-----------|------|-------|
| CosmicMap | `CosmicMap/CosmicMap.tsx` | Main container |
| CosmicBackground | `CosmicMap/CosmicBackground.tsx` | Canvas background renderer |
| BigBangAnimation | `CosmicMap/BigBangAnimation.tsx` | Entry animation |
| TraceRenderer | `CosmicMap/TraceRenderer.tsx` | Execution trace visualization |
| RegionStar | `CosmicMap/RegionStar.tsx` | Region node |
| GateCheckpoint | `CosmicMap/GateCheckpoint.tsx` | Gate marker |
| GateCheckpointMarker | `CosmicMap/GateCheckpointMarker.tsx` | Gate visual |
| LiveRegion | `CosmicMap/LiveRegion.tsx` | Active region highlight |
| MoonOrbit | `CosmicMap/MoonOrbit.tsx` | Orbital path |
| LightBridgeEdge | `CosmicMap/LightBridgeEdge.tsx` | Connection edge |
| SparkAnimation | `CosmicMap/SparkAnimation.tsx` | Particle effect |
| SparkParticle | `CosmicMap/SparkParticle.tsx` | Individual particle |
| CommandCenter | `CosmicMap/CommandCenter.tsx` | Cosmic Map command center |
| RegionFocusView | `RegionFocus/RegionFocusView.tsx` | Focused region detail view |
| GateTraceViewer | `Harmony/GateTraceViewer.tsx` | Gate execution trace (2 instances) |

**Effort:** 16 contracts × 3 hours = **48 hours** (full behavioral specification)

#### Star Navigation (10 components)
Main workbench navigation — primary user entry points.

| Component | Path | Notes |
|-----------|------|-------|
| WorkStar | `Stars/WorkStar.tsx` | Work context navigation |
| ReviewStar | `Stars/ReviewStar.tsx` | Review context navigation |
| PMStar | `Stars/PMStar.tsx` | PM context navigation |
| MaintenanceStar | `Stars/MaintenanceStar.tsx` | Maintenance context navigation |
| SettingsStar | `Stars/SettingsStar.tsx` | Settings context navigation |
| ExploreStar | `Stars/ExploreStar.tsx` | Explore context navigation |
| ArchiveStar | `Stars/ArchiveStar.tsx` | Archive context navigation |
| IntelStar | `Stars/IntelStar.tsx` | Intel context navigation |
| RespectStar | `Stars/RespectStar/RespectStar.tsx` | Respect context navigation |
| StoryStar | `Stars/StoryStar/StoryStar.tsx` | Story context navigation |

**Effort:** 10 contracts × 2.5 hours = **25 hours** (medium complexity)

#### SessionPanel & Chat (3 components)
Core session interaction components.

| Component | Path | Notes |
|-----------|------|-------|
| ReminderButtonBar | `SessionPanel/ReminderButtonBar.tsx` | Reminder prompt buttons |
| SessionInfoPanel | `SessionPanel/SessionInfoPanel.tsx` | Session metadata display |
| SlidingChatWindow | `SlidingChatWindow/SlidingChatWindow.tsx` | Minimizable chat overlay |
| ChatMinimizedIndicator | `SlidingChatWindow/ChatMinimizedIndicator.tsx` | Minimized chat indicator |

**Effort:** 4 contracts × 2 hours = **8 hours**

#### Command Center (2 components)

| Component | Path | Notes |
|-----------|------|-------|
| ChainStatusIndicator | `CommandCenter/ChainStatusIndicator.tsx` | Chain execution status |
| DiscoveryHint | `CommandCenter/DiscoveryHint.tsx` | Contextual hints |

**Effort:** 2 contracts × 1.5 hours = **3 hours**

#### CodeEditor (2 components)

| Component | Path | Notes |
|-----------|------|-------|
| ConflictDialog | `CodeEditor/ConflictDialog.tsx` | Merge conflict resolution |
| DiffView | `CodeEditor/DiffView.tsx` | Side-by-side diff viewer |

**Effort:** 2 contracts × 2 hours = **4 hours**

#### OrchestratorButton (1 component)

| Component | Path | Notes |
|-----------|------|-------|
| OrchestratorButton | `OrchestratorButton/OrchestratorButton.tsx` | Main orchestrator control |

**Effort:** 1 contract × 2 hours = **2 hours**

**P0 Total:** 36 contracts, **90 hours**

---

### 1.2 P1 — Supporting Components (Should Have Contracts)

**Count:** 29 components

#### Star Subcomponents (8 components)

##### Story Star (4 components)
| Component | Path |
|-----------|------|
| ChapterList | `Stars/StoryStar/ChapterList.tsx` |
| ChapterViewer | `Stars/StoryStar/ChapterViewer.tsx` |
| ContinueButton | `Stars/StoryStar/ContinueButton.tsx` |
| StoryMetadata | `Stars/StoryStar/StoryMetadata.tsx` |

##### Respect Star (4 components)
| Component | Path |
|-----------|------|
| CategorySection | `Stars/RespectStar/CategorySection.tsx` |
| ComponentHealthCard | `Stars/RespectStar/ComponentHealthCard.tsx` |
| LiveSpatialMonitor | `Stars/RespectStar/LiveSpatialMonitor.tsx` |
| RespectCheckControls | `Stars/RespectStar/RespectCheckControls.tsx` |

**Effort:** 8 contracts × 1.5 hours = **12 hours**

#### Settings Components (4 components)

| Component | Path |
|-----------|------|
| EvolutionSettings | `Settings/EvolutionSettings.tsx` |
| FeatureFlagSettings | `Settings/FeatureFlagSettings.tsx` |
| PerformanceSettings | `Settings/PerformanceSettings.tsx` |
| QuickActionSettings | `Settings/QuickActionSettings.tsx` |

**Effort:** 4 contracts × 1.5 hours = **6 hours**

#### IntelDossier Widgets (5 components)

| Component | Path |
|-----------|------|
| AlertPanelWidget | `IntelDossier/widgets/AlertPanelWidget.tsx` |
| CodeHealthMeterWidget | `IntelDossier/widgets/CodeHealthMeterWidget.tsx` |
| InsightCardWidget | `IntelDossier/widgets/InsightCardWidget.tsx` |
| SnippetPreviewWidget | `IntelDossier/widgets/SnippetPreviewWidget.tsx` |
| StatCardWidget | `IntelDossier/widgets/StatCardWidget.tsx` |

**Effort:** 5 contracts × 1 hour = **5 hours**

#### CommandPalette Subcomponents (2 components)

| Component | Path |
|-----------|------|
| CommandPaletteInput | `CommandPalette/CommandPaletteInput.tsx` |
| CommandPaletteResults | `CommandPalette/CommandPaletteResults.tsx` |

**Effort:** 2 contracts × 1 hour = **2 hours**

#### Tools (3 components)

| Component | Path |
|-----------|------|
| CanvasTool | `Tools/CanvasTool/CanvasTool.tsx` |
| CoverageTool | `Tools/CoverageTool/CoverageTool.tsx` |
| EditorTool | `Tools/EditorTool/EditorTool.tsx` |

**Effort:** 3 contracts × 1.5 hours = **4.5 hours**

#### Harmony Components (2 components)

| Component | Path |
|-----------|------|
| HarmonyHealthDashboard | `HarmonyHealthDashboard.tsx` |
| HarmonySpaceWorkbench | `Harmony/HarmonySpaceWorkbench.tsx` |

**Effort:** 2 contracts × 2 hours = **4 hours**

#### Buttons (3 components)

| Component | Path |
|-----------|------|
| PersistentToolbarButton | `PersistentToolbar/PersistentToolbarButton.tsx` |
| QuickActionButton | `QuickActionBar/QuickActionButton.tsx` |
| InlineButtonItem | `InlineButtons/InlineButtonItem.tsx` |

**Effort:** 3 contracts × 1 hour = **3 hours**

#### Dialogs (2 components)

| Component | Path |
|-----------|------|
| ErrorModal | `ErrorModal/ErrorModal.tsx` |
| StarBookmarkDialog | `StarBookmark/StarBookmarkDialog.tsx` |
| DossierCard | `IntelDossier/DossierCard.tsx` |

**Effort:** 3 contracts × 1.5 hours = **4.5 hours**

**P1 Total:** 29 contracts, **41 hours**

---

### 1.3 P2 — Leaf Components (Nice to Have)

**Count:** 2 components

| Component | Path | Notes |
|-----------|------|-------|
| UniverseOnboarding | `Onboarding/UniverseOnboarding.tsx` | Onboarding flow |

**Effort:** 1 contract × 2 hours = **2 hours**

---

### 1.4 P3 — Deprecated Components (Low Priority)

**Count:** 6 components

| Component | Path | Status |
|-----------|------|--------|
| AppSidebar | `AppSidebar/AppSidebar.tsx` | Replaced by SessionSidebar |
| SidebarNavGroup | `AppSidebar/SidebarNavGroup.tsx` | Deprecated |
| SidebarNavItem | `AppSidebar/SidebarNavItem.tsx` | Deprecated |
| SidebarSearch | `AppSidebar/SidebarSearch.tsx` | Deprecated |
| SidebarUserProfile | `AppSidebar/SidebarUserProfile.tsx` | Deprecated |
| ConversationPanel | `ConversationPanel/ConversationPanel.tsx` | Replaced by ChatPanel |

**Effort:** 6 contracts × 0.5 hours = **3 hours** (minimal documentation for legacy reference)

---

## 2. Incomplete Contracts (12 Files)

Contracts missing required sections per template specification.

### 2.1 Missing "Interactions" Section (12 contracts)

All 12 incomplete contracts are missing the **Interactions** section.

#### IntelDossier Widgets (8 contracts)
| Contract | Path |
|----------|------|
| AlertPanel.contract | `IntelDossier/AlertPanel.contract.md` |
| CodeHealthMeter.contract | `IntelDossier/CodeHealthMeter.contract.md` |
| DossierCreationDialog.contract | `IntelDossier/DossierCreationDialog.contract.md` |
| InsightCard.contract | `IntelDossier/InsightCard.contract.md` |
| SnippetPreview.contract | `IntelDossier/SnippetPreview.contract.md` |
| StatCard.contract | `IntelDossier/StatCard.contract.md` |
| UnknownWidget.contract | `IntelDossier/UnknownWidget.contract.md` |
| WidgetRenderer.contract | `IntelDossier/WidgetRenderer.contract.md` |

#### Terminal Components (4 contracts)
| Contract | Path |
|----------|------|
| ClaudeCliStartDialog.contract | `Terminal/ClaudeCliStartDialog.contract.md` |
| DiscoveredSessionsList.contract | `Terminal/DiscoveredSessionsList.contract.md` |
| ProjectForm.contract | `Terminal/ProjectForm.contract.md` |
| ProjectSelector.contract | `Terminal/ProjectSelector.contract.md` |

**Required Action:** Add "## Interactions" section to 12 contracts with proper subsections:
- Parent Communication
- Child Communication
- Sibling Communication
- Context Interaction

**Effort:** 12 contracts × 0.5 hours = **6 hours**

---

## 3. Contract-Code Drift (17 Files)

Contracts declaring component file paths that no longer exist.

### 3.1 Workbench Consolidation (12 contracts)

These contracts point to individual `*Workbench.tsx` files that were consolidated into `WorkbenchLayout.tsx`.

| Contract | Declared Path | Actual Implementation |
|----------|---------------|----------------------|
| ArchiveWorkbench.contract | `Workbench/ArchiveWorkbench.tsx` | `WorkbenchLayout.tsx` (ArchiveStar) |
| CanvasWorkbench.contract | `Workbench/CanvasWorkbench.tsx` | `WorkbenchLayout.tsx` (CanvasTool) |
| EditorWorkbench.contract | `Workbench/EditorWorkbench.tsx` | `WorkbenchLayout.tsx` (EditorTool) |
| ExploreWorkbench.contract | `Workbench/ExploreWorkbench.tsx` | `WorkbenchLayout.tsx` (ExploreStar) |
| HarmonyWorkbench.contract | `Workbench/HarmonyWorkbench.tsx` | `WorkbenchLayout.tsx` (HarmonySpaceWorkbench) |
| IntelWorkbench.contract | `Workbench/IntelWorkbench.tsx` | `WorkbenchLayout.tsx` (IntelStar) |
| MaintenanceWorkbench.contract | `Workbench/MaintenanceWorkbench.tsx` | `WorkbenchLayout.tsx` (MaintenanceStar) |
| PMWorkbench.contract | `Workbench/PMWorkbench.tsx` | `WorkbenchLayout.tsx` (PMStar) |
| RespectWorkbench.contract | `Workbench/RespectWorkbench/RespectWorkbench.tsx` | `WorkbenchLayout.tsx` (RespectStar) |
| ReviewWorkbench.contract | `Workbench/ReviewWorkbench.tsx` | `WorkbenchLayout.tsx` (ReviewStar) |
| SettingsWorkbench.contract | `Workbench/SettingsWorkbench.tsx` | `WorkbenchLayout.tsx` (SettingsStar) |
| WorkWorkbench.contract | `Workbench/WorkWorkbench.tsx` | `WorkbenchLayout.tsx` (WorkStar) |

**Required Action:**
- **Option A (Recommended):** Archive these 12 contracts and create new contracts for the Star components they now represent.
- **Option B:** Update contracts to point to `WorkbenchLayout.tsx` and document the Star-based architecture.

**Effort:** 12 contracts × 0.5 hours = **6 hours** (archival) OR 12 contracts × 2 hours = **24 hours** (full rewrite)

### 3.2 SessionPanel Reorganization (3 contracts)

| Contract | Declared Path | Status |
|----------|---------------|--------|
| LeftPanelStack.contract | `SessionPanel/LeftPanelStack.tsx` | File not found |
| RightVisualizationArea.contract | `SessionPanel/RightVisualizationArea.tsx` | File not found |
| SessionPanelLayout.contract | `SessionPanel/SessionPanelLayout.tsx` | File not found |

**Investigation Required:** Determine if these were consolidated into another component or deleted.

**Effort:** 3 contracts × 1 hour = **3 hours** (investigation + remediation)

### 3.3 Other Drift (2 contracts)

| Contract | Declared Path | Status |
|----------|---------------|--------|
| CodeEditor.contract | `Workbench/EditorWorkbench.tsx` | Wrong path (should be `CodeEditor/CodeEditor.tsx`?) |
| FileExplorer.contract | `Workbench/ExploreWorkbench.tsx` | Wrong path (should be `FileExplorer/*.tsx`?) |

**Effort:** 2 contracts × 0.5 hours = **1 hour** (path correction)

**Contract-Code Drift Total:** **10 hours** (minimum) to **34 hours** (full rewrite)

---

## 4. Prioritized Remediation Plan

### Phase 1: Critical Foundation (P0)
**Goal:** Cover core Living Universe experience
**Components:** 36 missing contracts
**Effort:** 90 hours (~2.5 weeks for 1 person)

**Breakdown:**
1. Cosmic Map System (16 contracts) — **48 hours**
2. Star Navigation (10 contracts) — **25 hours**
3. SessionPanel & Chat (4 contracts) — **8 hours**
4. Command Center (2 contracts) — **3 hours**
5. CodeEditor (2 contracts) — **4 hours**
6. OrchestratorButton (1 contract) — **2 hours**

### Phase 2: Supporting Infrastructure (P1)
**Goal:** Document supporting components
**Components:** 29 missing contracts + 12 incomplete contracts
**Effort:** 47 hours (~1.5 weeks)

**Breakdown:**
1. Complete missing "Interactions" sections (12 contracts) — **6 hours**
2. Star subcomponents (8 contracts) — **12 hours**
3. Settings (4 contracts) — **6 hours**
4. IntelDossier widgets (5 contracts) — **5 hours**
5. Tools (3 contracts) — **4.5 hours**
6. Harmony (2 contracts) — **4 hours**
7. CommandPalette (2 contracts) — **2 hours**
8. Buttons (3 contracts) — **3 hours**
9. Dialogs (3 contracts) — **4.5 hours**

### Phase 3: Drift Remediation
**Goal:** Fix stale contract references
**Components:** 17 contracts
**Effort:** 10-34 hours (depending on approach)

**Options:**
- **Quick fix:** Archive 12 Workbench contracts, investigate 3 SessionPanel contracts, fix 2 path errors — **10 hours**
- **Complete rewrite:** Rewrite Workbench contracts as Star contracts — **34 hours**

### Phase 4: Leaf & Legacy (P2/P3)
**Goal:** Document edge cases and legacy components
**Components:** 7 contracts
**Effort:** 5 hours

---

## 5. Summary Statistics

| Category | Count | Effort (Hours) | Priority |
|----------|-------|----------------|----------|
| **Missing Contracts (P0)** | 36 | 90 | Critical |
| **Missing Contracts (P1)** | 29 | 41 | High |
| **Missing Contracts (P2)** | 1 | 2 | Medium |
| **Missing Contracts (P3)** | 6 | 3 | Low |
| **Incomplete Contracts** | 12 | 6 | High |
| **Contract-Code Drift** | 17 | 10-34 | Medium |
| **Total** | **101** | **152-176** | — |

**Total Effort Range:** 152-176 hours (4-5 weeks for 1 person, or 2-2.5 weeks for 2 people)

---

## 6. Recommendations

### Immediate Actions (Week 1)
1. **Create P0 Cosmic Map contracts** (16 contracts, 48 hours) — Highest user impact
2. **Create P0 Star contracts** (10 contracts, 25 hours) — Core navigation

### Short-term Actions (Week 2-3)
3. **Complete missing "Interactions" sections** (12 contracts, 6 hours) — Quick wins
4. **Create remaining P0 contracts** (10 contracts, 15 hours) — SessionPanel, Command Center, CodeEditor, OrchestratorButton
5. **Create P1 Star subcomponent contracts** (8 contracts, 12 hours)

### Medium-term Actions (Week 4)
6. **Create P1 Settings, Widgets, Tools contracts** (14 contracts, 18 hours)
7. **Resolve contract-code drift** (17 contracts, 10-34 hours)

### Long-term Actions (Ongoing)
8. **Create P2/P3 contracts** (7 contracts, 5 hours)
9. **Set up automated contract-code drift detection** (CI/CD integration)
10. **Establish contract authoring as mandatory for new components** (PR template update)

---

## 7. Proposed Workflow

### For New Contracts
1. Copy `packages/app/src/contracts/TEMPLATE.contract.md`
2. Read component source code
3. Fill all 7 required sections (Identity, Render Location, Lifecycle, Props Contract, State Ownership, Interactions, Test Hooks)
4. Validate with `pnpm test:contracts`
5. Submit PR with contract + component

### For Drift Remediation
1. Identify actual component location
2. Update `**File:**` metadata field
3. Verify contract content still matches implementation
4. Update contract sections if implementation diverged
5. Run `pnpm test:contracts` to verify

### For Incomplete Contracts
1. Read component source code
2. Add missing section(s) per template
3. Ensure minimum content requirements (5+ lines for Props, 4+ for State, etc.)
4. Run `pnpm test:contracts` to verify

---

## Appendix A: Contract Template Required Sections

Per `packages/app/src/contracts/TEMPLATE.contract.md`:

1. **Identity** — Component name, type, description
2. **Render Location** — Parent components, render conditions, positioning
3. **Lifecycle** — Mount triggers, key effects, cleanup actions, unmount triggers
4. **Props Contract** — Inputs (table), callbacks up, callbacks down
5. **State Ownership** — Local state, context consumption, derived state, custom hooks
6. **Interactions** — Parent/child/sibling communication, context interaction
7. **Test Hooks** — CSS selectors, data-testid, ARIA labels, visual landmarks

**Optional Sections:** Side Effects, Health Checks, Dependencies, Notes

---

## Appendix B: Validation Tools

Existing test suite:
- `packages/app/src/__tests__/contracts/contract-completeness.test.ts` — Checks for required sections
- `packages/app/src/__tests__/contracts/contract-props-match.test.ts` — Validates Props table matches component interface
- `packages/app/src/__tests__/contracts/contract-css-classes.test.ts` — Validates CSS selectors exist in component
- `packages/app/src/__tests__/contracts/contract-health-selectors.test.ts` — Validates health check selectors

**Run with:** `pnpm test:contracts`

---

**End of Report**
