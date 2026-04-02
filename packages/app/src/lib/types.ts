/** The 7 default workbench identifiers */
export type WorkbenchId = 'work' | 'explore' | 'review' | 'pm' | 'settings' | 'archive' | 'studio';

/** Workbench metadata for sidebar rendering */
export interface WorkbenchMeta {
  id: WorkbenchId;
  label: string;
}

/** All default workbenches in sidebar order */
export const WORKBENCHES: readonly WorkbenchMeta[] = [
  { id: 'work', label: 'Work' },
  { id: 'explore', label: 'Explore' },
  { id: 'review', label: 'Review' },
  { id: 'pm', label: 'PM' },
  { id: 'settings', label: 'Settings' },
  { id: 'archive', label: 'Archive' },
  { id: 'studio', label: 'Studio' },
] as const;
