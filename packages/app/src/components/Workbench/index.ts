/**
 * Workbench component barrel export
 *
 * The Workbench system provides the main shell layout for the ActionFlows Dashboard,
 * replacing the legacy AppContent component with a structured 9-tab navigation system.
 */

export { WorkbenchLayout } from './WorkbenchLayout';
export { WorkWorkbench } from './WorkWorkbench';
export { CanvasWorkbench } from './CanvasWorkbench';
export type { CanvasWorkbenchProps } from './CanvasWorkbench';
export { EditorWorkbench } from './EditorWorkbench';
export type { EditorWorkbenchProps } from './EditorWorkbench';
export { ArchiveWorkbench } from './ArchiveWorkbench';
export type { ArchiveWorkbenchProps } from './ArchiveWorkbench';
export { ExploreWorkbench } from './ExploreWorkbench';
export type { ExploreWorkbenchProps } from './ExploreWorkbench';
export { PMWorkbench } from './PMWorkbench';
export { MaintenanceWorkbench } from './MaintenanceWorkbench';
export { ReviewWorkbench } from './ReviewWorkbench';
export type {
  PMTask,
  TaskStatus,
  TaskPriority,
  DocLink,
  Milestone,
  PMWorkbenchProps,
} from './PMWorkbench';
export type {
  ReviewWorkbenchProps,
  PullRequest,
  ReviewFile,
  ReviewComment,
  ReviewStatus,
  DiffViewMode,
} from './ReviewWorkbench';
export { HarmonyWorkbench } from './HarmonyWorkbench';
export type { HarmonyWorkbenchProps } from './HarmonyWorkbench';
export { SettingsWorkbench } from './SettingsWorkbench';
export { IntelWorkbench } from './IntelWorkbench';
export type { IntelWorkbenchProps } from './IntelWorkbench';
