/**
 * Workbench component barrel export
 *
 * The Workbench system provides the main shell layout for the ActionFlows Dashboard,
 * replacing the legacy AppContent component with a structured 9-tab navigation system.
 */

export { WorkbenchLayout } from './WorkbenchLayout';

// Re-exports from new cosmic structure
export { WorkStar } from '../Stars/WorkStar';
export { MaintenanceStar } from '../Stars/MaintenanceStar';
export { ExploreStar } from '../Stars/ExploreStar';
export type { ExploreStarProps } from '../Stars/ExploreStar';
export { ReviewStar } from '../Stars/ReviewStar';
export { SettingsStar } from '../Stars/SettingsStar';
export { PMStar } from '../Stars/PMStar';
export type {
  PMTask,
  TaskStatus,
  TaskPriority,
  DocLink,
  Milestone,
  PMStarProps,
} from '../Stars/PMStar';
export type {
  PullRequest,
  ReviewFile,
  ReviewComment,
  ReviewStatus,
  DiffViewMode,
} from '../Stars/ReviewStar';
export { ArchiveStar } from '../Stars/ArchiveStar';
export type { ArchiveStarProps } from '../Stars/ArchiveStar';
export { IntelStar } from '../Stars/IntelStar';
export type { IntelStarProps } from '../Stars/IntelStar';
export { RespectStar } from '../Stars/RespectStar/RespectStar';

export { EditorTool } from '../Tools/EditorTool/EditorTool';
export type { EditorToolProps } from '../Tools/EditorTool/EditorTool';
export { CanvasTool } from '../Tools/CanvasTool/CanvasTool';
export type { CanvasToolProps } from '../Tools/CanvasTool/CanvasTool';
export { CoverageTool } from '../Tools/CoverageTool/CoverageTool';
export type { CoverageToolProps } from '../Tools/CoverageTool/CoverageTool';

export { HarmonySpaceWorkbench } from '../Harmony/HarmonySpaceWorkbench';
export type { HarmonySpaceWorkbenchProps } from '../Harmony/HarmonySpaceWorkbench';
