# Code Changes: respect-check-expansion

## Files Modified
| File | Change |
|------|--------|
| `packages/shared/src/models.ts` | Added 10 new values to `RespectComponentType`, 3 new values to `RespectViolationType`, added `RespectCoverageMetrics` interface, added optional `coverage` field to `RespectCheckResult` |
| `packages/shared/src/index.ts` | Added `RespectCoverageMetrics` to exports |
| `packages/app/src/components/Workbench/RespectWorkbench/useRespectCheck.ts` | Expanded RESPECT_CHECK_SCRIPT from 24 to 69 selectors (9 HIGH, 20 MEDIUM, 16 LOW priority), added 3 new violation checks (z-index, fixed-position-escape, aspect-ratio), added coverage metrics to return object |
| `packages/app/src/components/Workbench/RespectWorkbench/LiveSpatialMonitor.tsx` | Added 10 new category titles, expanded category order, added catch-all rendering for unlisted categories |
| `packages/app/src/components/Workbench/RespectWorkbench/ComponentHealthCard.tsx` | Added human-readable labels for all 10 violation types, imported `RespectViolationType` |
| `packages/app/src/components/Workbench/RespectWorkbench/RespectCheckControls.tsx` | Added coverage metrics chip display (foundSelectors/totalKnownComponents with percentage) |

## Files Created
| File | Purpose |
|------|---------|
| (none) | No new files created |

## Verification
- Type check: PASS (all errors are pre-existing in `src/contracts/parse.ts`, unrelated to these changes)
- Notes: The RESPECT_CHECK_SCRIPT now checks 69 selectors across 19 categories (up from 24 selectors across 9 categories). Coverage metrics track found vs. known components (estimated 130 total).

## Details

### New Selectors Added (45)

**HIGH Priority (9):**
- `.app-sidebar` (sidebar)
- `.squad-panel-orchestrator .agent-character-card` (card)
- `.squad-panel-side .agent-character-card` (card)
- `.command-palette-backdrop` (fixed-overlay)
- `.monaco-editor-container` (editor)
- `.work-workbench` (workbench-variant)
- `.review-workbench` (workbench-variant)
- `.harmony-workbench` (workbench-variant)
- `.registry-browser__tree` (tree-view)

**MEDIUM Priority (20):**
- `.app-sidebar__header`, `.app-sidebar__nav-section`, `.app-sidebar__footer`
- `.sidebar-header`, `.sidebar-footer`, `.session-list`
- `.agent-log-panel`, `.command-palette-results`
- `.react-flow__controls`, `.react-flow__minimap`
- `.editor-tabs-container`, `.diff-view`
- `.change-preview`, `.change-preview__header`
- `.harmony-panel`, `.harmony-violations-list`
- `.step-inspector`, `.step-inspector__logs`
- `.telemetry-viewer`, `.telemetry-charts`

**LOW Priority (16):**
- `.discuss-button`, `.discuss-dialog`, `.toast`
- `.persistent-toolbar`, `.quick-action-bar`
- `.dossier-list`, `.dossier-view`, `.dossier-creation-dialog`
- 8 workbench variants (explore, pm, maintenance, archive, canvas, intel, settings, respect)

### New Violation Types (3)
1. `z_index_mismatch` - z-index value doesn't match expected
2. `fixed_position_escape` - position:fixed element extends outside viewport
3. `aspect_ratio_mismatch` - width/height ratio doesn't match expected

### New Categories (10)
fixed-overlay, editor, data-grid, tree-view, inspector, card, toolbar, workbench-variant, dialog, badge

### New Check Logic Added
- Percent-based height/width checks (`heightPercent`, `widthPercent`) for editors and workbench variants
- z-index validation for fixed-overlay and badge types
- Fixed position escape detection for fixed-overlay and toolbar types
- Aspect ratio validation for card types
- Extended parent containment checks to include tree-view, inspector, editor, and data-grid types
- Coverage metrics calculation (foundSelectors / totalKnownComponents)
