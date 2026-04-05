/**
 * Custom Workbench Types for Phase 10: Customization & Automation
 *
 * Types for the custom workbench system. Separates the 7 default
 * workbench IDs from user-created custom workbench IDs using branded strings.
 */

/** The 7 default workbench IDs */
export type DefaultWorkbenchId = 'work' | 'explore' | 'review' | 'pm' | 'settings' | 'archive' | 'studio';

/** @internal Unique symbol for CustomWorkbenchId branding */
declare const CustomWorkbenchIdSymbol: unique symbol;
/** Branded string for user-created workbench identifiers */
export type CustomWorkbenchId = string & { readonly [CustomWorkbenchIdSymbol]: true };

/** Union of all workbench identifiers (default + custom) */
export type WorkbenchId = DefaultWorkbenchId | CustomWorkbenchId;

/** All 7 default workbench IDs as a readonly array */
export const DEFAULT_WORKBENCH_IDS: readonly DefaultWorkbenchId[] = [
  'work', 'explore', 'review', 'pm', 'settings', 'archive', 'studio',
];

/** Type guard to check if an ID is one of the 7 default workbenches */
export function isDefaultWorkbench(id: string): id is DefaultWorkbenchId {
  return (DEFAULT_WORKBENCH_IDS as readonly string[]).includes(id);
}

/** Convert a string to a CustomWorkbenchId */
export function toCustomWorkbenchId(id: string): CustomWorkbenchId {
  return id as CustomWorkbenchId;
}

/** A user-created custom workbench definition */
export interface CustomWorkbench {
  id: CustomWorkbenchId;
  name: string;
  iconName: string;
  greeting: string;
  tone: string;
  systemPromptSnippet: string;
  createdAt: string;
}
