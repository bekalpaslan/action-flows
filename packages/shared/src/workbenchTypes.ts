/**
 * Workbench System Types
 *
 * Defines the 9 workbenches that form the primary navigation structure
 * of the ActionFlows Dashboard.
 */

// ============================================================================
// Workbench Identifiers
// ============================================================================

/**
 * The 9 workbench identifiers
 */
export type WorkbenchId =
  | 'work'
  | 'maintenance'
  | 'explore'
  | 'review'
  | 'archive'
  | 'settings'
  | 'pm'
  | 'harmony'
  | 'editor';

/**
 * All workbench IDs as an array for iteration
 */
export const WORKBENCH_IDS: readonly WorkbenchId[] = [
  'work',
  'maintenance',
  'explore',
  'review',
  'archive',
  'settings',
  'pm',
  'harmony',
  'editor',
] as const;

// ============================================================================
// Workbench Configuration
// ============================================================================

/**
 * Configuration for a single workbench tab
 */
export interface WorkbenchConfig {
  /** Unique workbench identifier */
  id: WorkbenchId;
  /** Display label for the tab */
  label: string;
  /** Icon identifier (emoji or icon name) */
  icon: string;
  /** Whether this workbench can show notifications */
  hasNotifications: boolean;
  /** Current notification count (0 = no badge) */
  notificationCount: number;
  /** Glow color when notifications are present */
  glowColor?: string;
  /** Whether this workbench is currently disabled */
  disabled?: boolean;
  /** Tooltip text */
  tooltip?: string;
}

/**
 * Default configurations for all workbenches
 */
export const DEFAULT_WORKBENCH_CONFIGS: Record<WorkbenchId, WorkbenchConfig> = {
  work: {
    id: 'work',
    label: 'Work',
    icon: '🔨',
    hasNotifications: true,
    notificationCount: 0,
    glowColor: '#4caf50',
    tooltip: 'Active development sessions and current tasks',
  },
  maintenance: {
    id: 'maintenance',
    label: 'Maintenance',
    icon: '🔧',
    hasNotifications: true,
    notificationCount: 0,
    glowColor: '#ff9800',
    tooltip: 'Bug fixes, refactoring, and housekeeping',
  },
  explore: {
    id: 'explore',
    label: 'Explore',
    icon: '🔍',
    hasNotifications: true,
    notificationCount: 0,
    glowColor: '#2196f3',
    tooltip: 'Research, codebase exploration, and learning',
  },
  review: {
    id: 'review',
    label: 'Review',
    icon: '👁️',
    hasNotifications: true,
    notificationCount: 0,
    glowColor: '#9c27b0',
    tooltip: 'Code reviews, PR checks, and audits',
  },
  archive: {
    id: 'archive',
    label: 'Archive',
    icon: '📦',
    hasNotifications: false,
    notificationCount: 0,
    tooltip: 'Completed and historical sessions',
  },
  settings: {
    id: 'settings',
    label: 'Settings',
    icon: '⚙️',
    hasNotifications: false,
    notificationCount: 0,
    tooltip: 'Configuration, preferences, and system management',
  },
  pm: {
    id: 'pm',
    label: 'PM',
    icon: '📋',
    hasNotifications: true,
    notificationCount: 0,
    glowColor: '#00bcd4',
    tooltip: 'Project management, tasks, and documentation',
  },
  harmony: {
    id: 'harmony',
    label: 'Harmony',
    icon: '🎵',
    hasNotifications: true,
    notificationCount: 0,
    glowColor: '#f44336',
    tooltip: 'Violations, sins, and remediations',
  },
  editor: {
    id: 'editor',
    label: 'Editor',
    icon: '📝',
    hasNotifications: false,
    notificationCount: 0,
    tooltip: 'Full-screen code editing',
  },
};

// ============================================================================
// Workbench State
// ============================================================================

/**
 * Global workbench navigation state
 */
export interface WorkbenchState {
  /** Currently active workbench */
  activeWorkbench: WorkbenchId;
  /** Configuration for all workbenches (allows overrides) */
  workbenchConfigs: Map<WorkbenchId, WorkbenchConfig>;
  /** Queue of pending notifications */
  notificationQueue: WorkbenchNotification[];
  /** Last active workbench (for back navigation) */
  previousWorkbench?: WorkbenchId;
}

/**
 * A notification targeting a specific workbench
 */
export interface WorkbenchNotification {
  /** Unique notification ID */
  id: string;
  /** Target workbench */
  workbenchId: WorkbenchId;
  /** Notification type for styling */
  type: 'info' | 'warning' | 'error' | 'success';
  /** Brief message */
  message: string;
  /** When the notification was created */
  timestamp: string;
  /** Whether the notification has been read/dismissed */
  read: boolean;
  /** Optional source session ID */
  sessionId?: string;
  /** Optional source chain ID */
  chainId?: string;
}

// ============================================================================
// Session-Workbench Mapping
// ============================================================================

/**
 * Tags that can be applied to sessions to categorize them into workbenches
 */
export type SessionWorkbenchTag =
  | 'work'
  | 'maintenance'
  | 'explore'
  | 'review';

/**
 * Maps a session tag to its corresponding workbench
 */
export function getWorkbenchForSessionTag(tag: SessionWorkbenchTag): WorkbenchId {
  return tag;
}

/**
 * Get workbenches that can contain sessions
 */
export function getSessionCapableWorkbenches(): WorkbenchId[] {
  return ['work', 'maintenance', 'explore', 'review'];
}

/**
 * Check if a workbench can contain sessions
 */
export function canWorkbenchHaveSessions(workbenchId: WorkbenchId): boolean {
  return getSessionCapableWorkbenches().includes(workbenchId);
}
