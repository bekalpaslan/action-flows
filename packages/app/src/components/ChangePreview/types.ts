/**
 * Represents a single change to be previewed
 */
export interface ChangePreviewData {
  /** Display name of the field being changed */
  field: string;
  /** JSON path or location of the change (e.g., "config.settings.theme") */
  path: string;
  /** Current value before the change (null for additions) */
  currentValue: unknown;
  /** New value after the change (null for removals) */
  newValue: unknown;
  /** Type of change operation (aligned with backend: create/modify/delete) */
  changeType: 'create' | 'modify' | 'delete';
  /** Whether this change is destructive and requires extra confirmation */
  isDestructive?: boolean;
}

/**
 * Props for the ChangePreview component
 */
export interface ChangePreviewProps {
  /** Array of changes to display */
  changes: ChangePreviewData[];
  /** Callback when user confirms the changes */
  onConfirm?: () => void;
  /** Callback when user cancels the changes */
  onCancel?: () => void;
  /** Whether an action is in progress */
  isLoading?: boolean;
}

/**
 * Summary of changes by type
 */
export interface ChangeSummary {
  additions: number;
  modifications: number;
  removals: number;
  destructive: number;
  total: number;
}
