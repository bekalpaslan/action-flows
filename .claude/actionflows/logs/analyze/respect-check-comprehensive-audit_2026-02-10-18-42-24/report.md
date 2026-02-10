# RESPECT Check Script - Comprehensive Coverage Audit

**Aspect:** coverage
**Scope:** All dashboard components vs. current RESPECT_CHECK_SCRIPT selectors
**Date:** 2026-02-10
**Agent:** analyze/

---

## Executive Summary

The RESPECT_CHECK_SCRIPT in `useRespectCheck.ts` currently monitors **24 selectors** across **9 component categories**. After scanning **48 component directories** and **1,517 unique CSS classes** across 88 CSS files, the coverage gap is **significant**.

**Key Findings:**
- **Currently Checked:** 24 selectors (9 categories)
- **Total Component Directories:** 48
- **Total Unique CSS Classes:** 1,517
- **Estimated Coverage:** ~12% of major layout components
- **Unchecked Critical Areas:** 35+ components with spatial concerns

---

## 1. Current Coverage Analysis

### 1.1 Current RESPECT_CHECK_SCRIPT Selectors (24 total)

| # | Selector | Category | Check Type | Expected Constraints |
|---|----------|----------|------------|---------------------|
| 1 | `.workbench-layout` | layout-shell | viewport match, overflow, containment | width: viewport, height: viewport |
| 2 | `.top-bar` | topbar | fixed height, viewport containment | height: 52px |
| 3 | `.session-sidebar` | sidebar | fixed width | width: 240px |
| 4 | `.workbench-body` | layout-shell | overflow, containment | — |
| 5 | `.workbench-main` | layout-shell | overflow, containment | — |
| 6 | `.workbench-content` | layout-shell | overflow, containment | — |
| 7 | `.session-panel-layout` | panel | overflow, parent containment | — |
| 8 | `.session-panel-layout__left` | panel | min/max width, parent containment | minWidth: 280px, maxWidthPercent: 50% |
| 9 | `.session-panel-layout__right` | panel | parent containment | — |
| 10 | `.chat-panel` | panel | min width, parent containment | minWidth: 280px |
| 11 | `.chat-panel__messages` | content-area | overflow, parent containment | — |
| 12 | `.chat-panel__info-bar` | content-area | overflow, parent containment | — |
| 13 | `.chat-panel__input-field` | input | min/max height | minHeight: 36px, maxHeight: 120px |
| 14 | `.chat-panel__send-btn` | input | fixed dimensions | width: 36px, height: 36px |
| 15 | `.chat-bubble` | widget | max width percent | maxWidthPercent: 85% |
| 16 | `.right-visualization-area` | visualization | overflow, containment | — |
| 17 | `.flow-visualization` | visualization | overflow, containment | — |
| 18 | `.chain-dag-container` | visualization | overflow, containment | — |
| 19 | `.squad-panel` | widget | overflow, parent containment | — |
| 20 | `.workbench-bottom` | layout-shell | (known overflow visible) | — |
| 21 | `.left-panel-stack` | panel | overflow, parent containment | — |
| 22 | `.command-palette-modal` | modal | max dimensions | maxWidth: 600px, maxHeight: 500px |
| 23 | `.sidebar-content` | content-area | overflow, parent containment | — |
| 24 | `.top-bar-tabs` | topbar | viewport containment | — |

### 1.2 Category Distribution (Current)

| Category | Count | Components Checked |
|----------|-------|-------------------|
| layout-shell | 5 | workbench-layout, workbench-body, workbench-main, workbench-content, workbench-bottom |
| topbar | 2 | top-bar, top-bar-tabs |
| sidebar | 1 | session-sidebar |
| panel | 5 | session-panel-layout, left/right splits, chat-panel, left-panel-stack |
| content-area | 3 | chat-panel__messages, chat-panel__info-bar, sidebar-content |
| input | 2 | chat-panel__input-field, chat-panel__send-btn |
| widget | 2 | chat-bubble, squad-panel |
| visualization | 3 | right-visualization-area, flow-visualization, chain-dag-container |
| modal | 1 | command-palette-modal |

---

## 2. Component Inventory

### 2.1 All Component Directories (48 total)

```
./AppSidebar
./ChainBadge
./ChainDAG
./ChainViz
./ChangePreview
./ClaudeCliTerminal
./CodeEditor
./CommandPalette
./common
./ControlButtons
./ConversationPanel
./CustomPromptButton
./Dashboard
./DisambiguationModal
./DiscussButton
./FileExplorer
./FlowVisualization
./HarmonyBadge
./HarmonyIndicator
./HarmonyPanel
./InlineButtons
./Inspector
./IntelDossier
./IntelDossier/widgets
./ModifierCard
./Notifications
./PersistentToolbar
./QuickActionBar
./RegistryBrowser
./SessionArchive
./SessionPane
./SessionPanel
./SessionSidebar
./SessionTile
./SessionTree
./Settings
./Sidebar
./SquadPanel
./StarBookmark
./StepInspector
./TelemetryViewer
./Terminal
./ThemeToggle
./TimelineView
./Toast
./VimModeIndicator
./Workbench
./Workbench/RespectWorkbench
```

### 2.2 CSS File Count by Category

| Category | File Count | Example Files |
|----------|-----------|---------------|
| Component-specific | 68 | ChatPanel.css, SquadPanel.css, FlowVisualization.css |
| Layout/shell | 8 | WorkbenchLayout.css, SessionPanelLayout.css, LeftPanelStack.css |
| Shared/utilities | 6 | design-tokens.css, animations/, themes/ |
| Global | 2 | App.css, index.css |
| Workbench variants | 8 | WorkWorkbench.css, ReviewWorkbench.css, HarmonyWorkbench.css, etc. |

**Total CSS Files:** 88

---

## 3. CSS Class Inventory

### 3.1 Selector Statistics

- **Total unique CSS classes:** 1,517
- **Layout/container classes:** ~180
- **Component-specific classes:** ~1,200
- **State modifiers (--active, --hover, etc.):** ~120
- **Trivial classes (skipped in analysis):** ~17

### 3.2 Significant Unchecked Classes (Sample)

**AppSidebar (not checked):**
```
.app-sidebar (fixed position, z-index concerns)
.app-sidebar__header
.app-sidebar__nav-section (scrollable overflow)
.app-sidebar__search-input
.app-sidebar__footer
```

**SessionSidebar (partially checked):**
```
.session-sidebar (checked ✓)
.sidebar-header (not checked — fixed height)
.sidebar-content (checked ✓)
.sidebar-footer (not checked — fixed height)
.session-list (not checked — overflow)
```

**SquadPanel (widget-level only):**
```
.squad-panel (checked ✓)
.squad-panel-orchestrator (not checked — size constraints)
.squad-panel-side (not checked — min/max width)
.agent-character-card (not checked — fixed dimensions)
.agent-log-panel (not checked — max dimensions)
```

**CommandPalette:**
```
.command-palette-backdrop (not checked — viewport overlay)
.command-palette-modal (checked ✓)
.command-palette-input (not checked — input dimensions)
.command-palette-results (not checked — overflow, max-height)
```

**FlowVisualization:**
```
.flow-visualization (checked ✓)
.react-flow__controls (not checked — fixed position)
.react-flow__minimap (not checked — fixed dimensions)
.swimlane-panel (not checked — overlay z-index)
```

**CodeEditor (entirely unchecked):**
```
.editor-tabs-container
.editor-tab
.diff-view
.monaco-editor-container
.conflict-dialog
```

**ChangePreview (entirely unchecked):**
```
.change-preview
.change-preview__header
.change-preview__content
.change-preview__footer
```

**HarmonyPanel (entirely unchecked):**
```
.harmony-panel
.harmony-violations-list
.harmony-chart-container
```

**RegistryBrowser (entirely unchecked):**
```
.registry-browser
.registry-browser__tree
.registry-browser__content
```

**SessionArchive (entirely unchecked):**
```
.archive-workbench
.archive-table
.archive-filters
.archive-actions
```

**StepInspector (entirely unchecked):**
```
.step-inspector
.step-inspector__header
.step-inspector__logs
.step-inspector__metadata
```

**TelemetryViewer (entirely unchecked):**
```
.telemetry-viewer
.telemetry-charts
.telemetry-metrics-grid
```

**IntelDossier (entirely unchecked):**
```
.dossier-list
.dossier-view
.dossier-creation-dialog
.widget-renderer
```

**Workbench Variants (8 workbenches, partially checked):**
```
.work-workbench (not checked)
.review-workbench (not checked)
.explore-workbench (not checked)
.pm-workbench (not checked)
.maintenance-workbench (not checked)
.archive-workbench (not checked)
.harmony-workbench (not checked)
.canvas-workbench (not checked)
.intel-workbench (not checked)
.settings-workbench (not checked)
.respect-workbench (not checked — meta!)
```

---

## 4. Gap Analysis

### 4.1 Unchecked Components with Spatial Concerns

| Component | Primary CSS Selector | Missing Check Type | Proposed Rule | Priority |
|-----------|---------------------|-------------------|---------------|----------|
| **AppSidebar** | `.app-sidebar` | fixed positioning, z-index layering, width constraints | width: 64px (collapsed) / 240px (expanded), left: 0, top: 0, height: 100vh | **HIGH** |
| AppSidebar Header | `.app-sidebar__header` | fixed height | height: 60px | MED |
| AppSidebar Nav | `.app-sidebar__nav-section` | vertical overflow, scroll containment | overflow-y: auto, parent containment | MED |
| AppSidebar Footer | `.app-sidebar__footer` | fixed height | height: 60px | MED |
| **SessionSidebar Header** | `.sidebar-header` | fixed height | height: 60px | MED |
| SessionSidebar Footer | `.sidebar-footer` | fixed height | min-height: 48px | MED |
| Session List | `.session-list` | overflow containment | overflow-y: auto | LOW |
| **Squad Panel Orchestrator** | `.squad-panel-orchestrator .agent-character-card` | fixed dimensions (1.5x subagent) | width: 200px (desktop), 180px (tablet), 160px (mobile) | **HIGH** |
| Squad Panel Subagent | `.squad-panel-side .agent-character-card` | fixed dimensions | width: 140px (desktop), 130px (mobile) | MED |
| Agent Log Panel | `.agent-log-panel` | max dimensions, overflow | maxWidth: 400px (orchestrator), 320px (subagent), maxHeight: varies | MED |
| **Command Palette Backdrop** | `.command-palette-backdrop` | viewport coverage, z-index | width: 100vw, height: 100vh, z-index: 9999 | **HIGH** |
| Command Palette Input | `.command-palette-input` | height constraints | height: 48px | LOW |
| Command Palette Results | `.command-palette-results` | max-height, overflow | maxHeight: 400px, overflow-y: auto | MED |
| **Flow Controls** | `.react-flow__controls` | fixed position, dimensions | fixed bottom-left, dimensions vary | MED |
| Flow MiniMap | `.react-flow__minimap` | fixed position, dimensions | fixed bottom-right, 150x100px | MED |
| Swimlane Panel | `.swimlane-panel` | z-index layering | z-index: 0 (background), pointer-events: none | LOW |
| **CodeEditor Tabs** | `.editor-tabs-container` | horizontal overflow, tab sizing | overflow-x: auto, tab min-width constraints | MED |
| Editor Tab | `.editor-tab` | min/max width | minWidth: 100px, maxWidth: 200px | LOW |
| Monaco Container | `.monaco-editor-container` | containment, overflow | width: 100%, height: 100%, overflow: hidden | **HIGH** |
| Diff View | `.diff-view` | split dimensions | 50/50 split or custom | MED |
| Conflict Dialog | `.conflict-dialog` | modal dimensions | maxWidth: 600px, maxHeight: 400px | LOW |
| **Change Preview** | `.change-preview` | panel dimensions, overflow | height: 100%, overflow-y: auto | MED |
| Change Preview Header | `.change-preview__header` | fixed height | height: 48px | LOW |
| Change Preview Footer | `.change-preview__footer` | fixed height | height: 52px | LOW |
| **Harmony Panel** | `.harmony-panel` | panel dimensions | width: 100%, min-height: 400px | MED |
| Harmony Violations List | `.harmony-violations-list` | vertical overflow | maxHeight: 300px, overflow-y: auto | MED |
| Harmony Chart | `.harmony-chart-container` | fixed dimensions | height: 200px | LOW |
| **Registry Browser** | `.registry-browser` | full-height layout | height: 100%, overflow: hidden | MED |
| Registry Tree | `.registry-browser__tree` | vertical overflow | flex: 1, overflow-y: auto | MED |
| Registry Content | `.registry-browser__content` | vertical overflow | flex: 2, overflow-y: auto | MED |
| **Session Archive Table** | `.archive-table` | table overflow | overflow-x: auto, min-width: 800px | MED |
| Archive Filters | `.archive-workbench__filters` | horizontal layout constraints | flex-wrap: wrap | LOW |
| **Step Inspector** | `.step-inspector` | panel dimensions | width: 100%, height: 100% | MED |
| Step Logs | `.step-inspector__logs` | vertical overflow | maxHeight: 400px, overflow-y: auto | MED |
| **Telemetry Viewer** | `.telemetry-viewer` | full-height layout | height: 100%, overflow: hidden | MED |
| Telemetry Charts | `.telemetry-charts` | grid layout constraints | display: grid, gap: 16px | LOW |
| Telemetry Metrics Grid | `.telemetry-metrics-grid` | overflow containment | overflow-y: auto | LOW |
| **IntelDossier List** | `.dossier-list` | vertical overflow | overflow-y: auto, max-height: calc(100vh - 200px) | MED |
| Dossier View | `.dossier-view` | full-height layout | height: 100%, overflow-y: auto | MED |
| Dossier Dialog | `.dossier-creation-dialog` | modal dimensions | maxWidth: 600px, maxHeight: 500px | LOW |
| Widget Renderer | `.widget-renderer` | widget containment | overflow: hidden, max dimensions vary | LOW |
| **Workbench Variants** | `.work-workbench`, `.review-workbench`, etc. (11 total) | full-height layout, overflow | height: 100%, overflow-y: auto | MED |
| **Discuss Button** | `.discuss-button` | fixed position, z-index | z-index: 100, position: absolute | LOW |
| Discuss Dialog | `.discuss-dialog` | modal dimensions | maxWidth: 500px, maxHeight: 400px | LOW |
| **Toast Notification** | `.toast` | fixed position, stacking | position: fixed, top-right, z-index: 10000 | LOW |
| **Theme Toggle** | `.theme-toggle` | fixed dimensions | width: 40px, height: 40px | LOW |
| **Vim Mode Indicator** | `.vim-mode-indicator` | fixed position | position: fixed, bottom-right | LOW |
| **Persistent Toolbar** | `.persistent-toolbar` | fixed position, height | position: fixed, bottom: 0, height: 48px | MED |
| **Quick Action Bar** | `.quick-action-bar` | fixed position, dimensions | position: fixed, width: 100%, height: 56px | MED |

### 4.2 Priority Breakdown

**HIGH Priority (9 components):**
1. `.app-sidebar` — Fixed position, z-index layering, critical layout
2. `.squad-panel-orchestrator .agent-character-card` — Fixed dimensions, visual prominence
3. `.command-palette-backdrop` — Viewport overlay, z-index
4. `.monaco-editor-container` — Critical containment for code editing
5. `.work-workbench` (and 10 other workbench variants) — Full-height layout

**MEDIUM Priority (28 components):**
- Panel headers/footers with fixed heights
- Scrollable content areas (nav sections, logs, lists)
- Modal dialogs with max dimensions
- Grid/table layouts with overflow concerns
- Split panels with dimension constraints

**LOW Priority (16 components):**
- State modifiers (hover, active, focus)
- Trivial widgets (badges, icons, indicators)
- Decorative elements without spatial impact
- Elements with no fixed dimensions or overflow

---

## 5. Recommended New Check Categories

Based on the gap analysis, the following new categories should be added to the RESPECT_CHECK_SCRIPT:

### 5.1 New Categories

| Category | Purpose | Example Components | Proposed Checks |
|----------|---------|-------------------|----------------|
| **fixed-overlay** | Fixed position overlays (z-index, viewport coverage) | `.command-palette-backdrop`, `.toast`, `.discuss-button` | z-index layering, viewport coverage, position: fixed validation |
| **editor** | Code editor containers (critical containment) | `.monaco-editor-container`, `.diff-view`, `.editor-tabs-container` | 100% width/height, overflow: hidden, tab min/max width |
| **data-grid** | Tables and data grids (horizontal overflow) | `.archive-table`, `.telemetry-metrics-grid` | overflow-x: auto, min-width constraints |
| **tree-view** | Hierarchical tree structures | `.registry-browser__tree`, `.session-tree` | vertical overflow, nested indentation containment |
| **inspector** | Detail panels with logs/metadata | `.step-inspector`, `.telemetry-viewer`, `.harmony-panel` | full-height layout, log overflow, max-height constraints |
| **card** | Fixed-dimension cards/avatars | `.agent-character-card`, `.session-tile`, `.modifier-card` | fixed width/height, responsive breakpoints |
| **toolbar** | Fixed position toolbars | `.persistent-toolbar`, `.quick-action-bar` | fixed position, height constraints, z-index |
| **workbench-variant** | Context-specific workbenches | `.work-workbench`, `.review-workbench`, etc. | full-height layout, overflow-y: auto |
| **dialog** | All modal dialogs | `.conflict-dialog`, `.dossier-creation-dialog`, `.disambiguation-modal` | max dimensions, backdrop coverage |
| **badge** | Status indicators (z-index, position) | `.harmony-badge`, `.chain-badge`, `.status-badge` | fixed position, z-index stacking |

### 5.2 Check Type Expansion

**New check types to add:**

1. **z-index Stacking Validation**
   - Verify z-index hierarchy is maintained (no stacking context violations)
   - Check: `.command-palette-backdrop` (z-index: 9999) > `.toast` (z-index: 10000) > modals (z-index varies)

2. **Fixed Position Validation**
   - Verify `position: fixed` elements don't escape viewport
   - Check: `.app-sidebar`, `.session-sidebar`, `.persistent-toolbar`, `.toast`

3. **Aspect Ratio Validation**
   - For card/avatar components with fixed dimensions
   - Check: `.agent-character-card`, `.session-tile`

4. **Grid/Flexbox Layout Validation**
   - Verify flex children don't overflow parent
   - Check: `.telemetry-metrics-grid`, `.archive-table`, `.squad-panel-agents-wrapper`

5. **Responsive Breakpoint Validation**
   - Test dimension constraints at mobile/tablet/desktop breakpoints
   - Check: All major panels, modals, toolbars

---

## 6. Proposed Additions (Prioritized)

### 6.1 HIGH Priority Additions (Immediate)

**Add these 9 selectors to RESPECT_CHECK_SCRIPT immediately:**

```javascript
// Fixed-position sidebars and shells
{ selector: '.app-sidebar', type: 'sidebar', expected: { width: 240, minWidthCollapsed: 64, height: 'viewport' } },

// Squad Panel detail checks
{ selector: '.squad-panel-orchestrator .agent-character-card', type: 'card', expected: { width: 200 } },
{ selector: '.squad-panel-side .agent-character-card', type: 'card', expected: { width: 140 } },

// Command Palette overlay
{ selector: '.command-palette-backdrop', type: 'fixed-overlay', expected: { width: 'viewport', height: 'viewport' } },

// Code Editor critical containment
{ selector: '.monaco-editor-container', type: 'editor', expected: { width: '100%', height: '100%' } },

// Workbench variants (sample 3 most-used)
{ selector: '.work-workbench', type: 'workbench-variant', expected: { height: '100%' } },
{ selector: '.review-workbench', type: 'workbench-variant', expected: { height: '100%' } },
{ selector: '.harmony-workbench', type: 'workbench-variant', expected: { height: '100%' } },

// Registry Browser panels
{ selector: '.registry-browser__tree', type: 'tree-view' },
```

### 6.2 MEDIUM Priority Additions (Phase 2)

**Add these 20 selectors in next iteration:**

```javascript
// AppSidebar subcomponents
{ selector: '.app-sidebar__header', type: 'header', expected: { height: 60 } },
{ selector: '.app-sidebar__nav-section', type: 'content-area' },
{ selector: '.app-sidebar__footer', type: 'footer', expected: { minHeight: 60 } },

// SessionSidebar subcomponents
{ selector: '.sidebar-header', type: 'header', expected: { height: 60 } },
{ selector: '.sidebar-footer', type: 'footer', expected: { minHeight: 48 } },
{ selector: '.session-list', type: 'content-area' },

// Squad Panel detail panels
{ selector: '.agent-log-panel', type: 'inspector', expected: { maxWidth: 400 } },

// Command Palette subcomponents
{ selector: '.command-palette-results', type: 'content-area', expected: { maxHeight: 400 } },

// Flow Visualization controls
{ selector: '.react-flow__controls', type: 'toolbar' },
{ selector: '.react-flow__minimap', type: 'widget' },

// CodeEditor subcomponents
{ selector: '.editor-tabs-container', type: 'toolbar' },
{ selector: '.diff-view', type: 'editor' },

// Change Preview
{ selector: '.change-preview', type: 'panel' },
{ selector: '.change-preview__header', type: 'header', expected: { height: 48 } },

// Harmony Panel
{ selector: '.harmony-panel', type: 'inspector' },
{ selector: '.harmony-violations-list', type: 'content-area', expected: { maxHeight: 300 } },

// Step Inspector
{ selector: '.step-inspector', type: 'inspector' },
{ selector: '.step-inspector__logs', type: 'content-area', expected: { maxHeight: 400 } },

// Telemetry Viewer
{ selector: '.telemetry-viewer', type: 'inspector' },
{ selector: '.telemetry-charts', type: 'data-grid' },
```

### 6.3 LOW Priority Additions (Phase 3)

**Add these 16 selectors in future iterations:**

```javascript
// Discuss Button
{ selector: '.discuss-button', type: 'fixed-overlay' },
{ selector: '.discuss-dialog', type: 'dialog', expected: { maxWidth: 500, maxHeight: 400 } },

// Toast
{ selector: '.toast', type: 'fixed-overlay' },

// Persistent Toolbar
{ selector: '.persistent-toolbar', type: 'toolbar', expected: { height: 48 } },

// Quick Action Bar
{ selector: '.quick-action-bar', type: 'toolbar', expected: { height: 56 } },

// IntelDossier
{ selector: '.dossier-list', type: 'content-area' },
{ selector: '.dossier-view', type: 'inspector' },
{ selector: '.dossier-creation-dialog', type: 'dialog', expected: { maxWidth: 600, maxHeight: 500 } },

// Additional Workbenches (8 more)
{ selector: '.explore-workbench', type: 'workbench-variant', expected: { height: '100%' } },
{ selector: '.pm-workbench', type: 'workbench-variant', expected: { height: '100%' } },
{ selector: '.maintenance-workbench', type: 'workbench-variant', expected: { height: '100%' } },
{ selector: '.archive-workbench', type: 'workbench-variant', expected: { height: '100%' } },
{ selector: '.canvas-workbench', type: 'workbench-variant', expected: { height: '100%' } },
{ selector: '.intel-workbench', type: 'workbench-variant', expected: { height: '100%' } },
{ selector: '.settings-workbench', type: 'workbench-variant', expected: { height: '100%' } },
{ selector: '.respect-workbench', type: 'workbench-variant', expected: { height: '100%' } },

// Session Archive
{ selector: '.archive-table', type: 'data-grid', expected: { minWidth: 800 } },
```

---

## 7. Summary Statistics

### 7.1 Current State

- **Currently Checked Selectors:** 24
- **Current Categories:** 9
- **Coverage:** ~12% of major layout components

### 7.2 After HIGH Priority Additions

- **Total Selectors:** 33 (+9)
- **Total Categories:** 14 (+5)
- **Estimated Coverage:** ~22% of major layout components

### 7.3 After MEDIUM Priority Additions

- **Total Selectors:** 53 (+20)
- **Total Categories:** 14 (no new categories)
- **Estimated Coverage:** ~38% of major layout components

### 7.4 After LOW Priority Additions

- **Total Selectors:** 69 (+16)
- **Total Categories:** 14 (no new categories)
- **Estimated Coverage:** ~52% of major layout components

### 7.5 Full Coverage Target

- **Total Significant Components:** ~130 (estimated)
- **Total Selectors Needed for 100% Coverage:** ~130
- **Current Gap:** 106 selectors unchecked
- **Proposed Additions (all phases):** 45 selectors
- **Remaining Gap After All Phases:** 61 selectors (~47% coverage)

---

## 8. Implementation Recommendations

### 8.1 Phased Rollout

**Phase 1: HIGH Priority (Week 1)**
- Add 9 critical selectors
- Add 5 new categories (fixed-overlay, editor, card, workbench-variant, tree-view)
- Test on desktop/tablet/mobile breakpoints
- Validate z-index stacking for overlays

**Phase 2: MEDIUM Priority (Week 2-3)**
- Add 20 panel/header/footer selectors
- Expand data-grid and inspector categories
- Add responsive breakpoint validation
- Test scrollable content areas

**Phase 3: LOW Priority (Week 4+)**
- Add 16 remaining selectors
- Complete workbench variant coverage
- Add all dialog/modal checks
- Add toolbar and badge checks

**Phase 4: Full Coverage (Future)**
- Evaluate remaining 61 selectors
- Add niche components (animations, transitions, state modifiers)
- Add performance checks (paint/layout thrashing)

### 8.2 Check Rule Expansion

**New check types to implement:**

1. **z-index Stacking Validation**
   ```javascript
   // Check z-index hierarchy
   if (element.style.zIndex) {
     const expectedZIndex = expected.zIndex;
     if (parseInt(element.style.zIndex) !== expectedZIndex) {
       violations.push({ type: 'z_index_mismatch', ... });
     }
   }
   ```

2. **Fixed Position Validation**
   ```javascript
   // Check position: fixed elements stay within viewport
   if (computed.position === 'fixed') {
     if (rect.right > vw || rect.bottom > vh || rect.left < 0 || rect.top < 0) {
       violations.push({ type: 'fixed_position_escape', ... });
     }
   }
   ```

3. **Aspect Ratio Validation**
   ```javascript
   // Check aspect ratio for cards/avatars
   if (expected.aspectRatio) {
     const actualRatio = rect.width / rect.height;
     if (Math.abs(actualRatio - expected.aspectRatio) > 0.1) {
       violations.push({ type: 'aspect_ratio_mismatch', ... });
     }
   }
   ```

4. **Responsive Breakpoint Validation**
   ```javascript
   // Check different constraints at different breakpoints
   if (vw < 768) {
     // Mobile constraints
   } else if (vw < 1024) {
     // Tablet constraints
   } else {
     // Desktop constraints
   }
   ```

### 8.3 Test Coverage Metrics

**Add these metrics to the RESPECT report:**

```javascript
return {
  // ... existing fields ...
  coverage: {
    totalComponents: KNOWN_COMPONENT_COUNT, // ~130
    checkedComponents: totalChecked,
    coveragePercent: (totalChecked / KNOWN_COMPONENT_COUNT) * 100,
    uncheckedComponents: KNOWN_COMPONENT_COUNT - totalChecked
  },
  categories: {
    'layout-shell': { checked: 5, total: 8 },
    'topbar': { checked: 2, total: 3 },
    // ... etc for all categories
  }
};
```

---

## 9. Learnings

**Issue:** RESPECT_CHECK_SCRIPT was created early (24 selectors) but never audited against the full component inventory (48 directories, 1517 CSS classes).

**Root Cause:** Incremental development without systematic inventory. Components added ad-hoc without corresponding RESPECT checks.

**Suggestion:**
1. Create a `RESPECT_COVERAGE.md` file listing all components and their check status
2. Add a CI check: "RESPECT coverage must be >= 50%" (fail builds if drops below)
3. Add a dashboard widget showing RESPECT coverage percentage in real-time
4. Require RESPECT checks as part of component creation checklist

**Fresh Eye Discoveries:**
1. **11 Workbench variants exist but none are checked** — All follow same pattern (height: 100%, overflow-y: auto), perfect candidate for a single category
2. **AppSidebar is entirely unchecked** — This is a critical layout shell with fixed positioning, z-index: 1100, and collapse/expand states
3. **Monaco Editor has no containment checks** — This is a critical risk area (external dependency, complex overflow behavior)
4. **z-index stacking is not validated** — Command palette (z-index: 9999), toast (z-index: 10000), modals (vary) could conflict
5. **No responsive breakpoint validation** — Current checks assume single breakpoint, but many components have 3-4 breakpoint rules (mobile/tablet/desktop)
6. **Overlay mode Squad Panel has different dimensions** — `.squad-panel.placement-overlay` uses smaller avatars (100px vs 140px) but not checked separately

---

**End of Report**
