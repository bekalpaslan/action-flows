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
 * The 11 workbench identifiers
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
  | 'editor'
  | 'intel'
  | 'canvas';

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
  'intel',
  'canvas',
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

  // Routing Metadata (Context-Native Routing)
  /** Whether orchestrator can route sessions to this context */
  routable: boolean;
  /** Trigger keywords/phrases that route to this context */
  triggers: string[];
  /** Available flows in this context */
  flows: string[];
  /** Example user requests for this context */
  routingExamples: string[];
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
    routable: true,
    triggers: ['implement', 'build', 'create', 'add feature', 'develop', 'code', 'write', 'generate', 'construct', 'design'],
    flows: ['code-and-review/', 'post-completion/'],
    routingExamples: [
      'implement user authentication',
      'build a dashboard component',
      'add export functionality',
      'create a new API endpoint',
    ],
  },
  maintenance: {
    id: 'maintenance',
    label: 'Maintenance',
    icon: '🔧',
    hasNotifications: true,
    notificationCount: 0,
    glowColor: '#ff9800',
    tooltip: 'Bug fixes, refactoring, and housekeeping',
    routable: true,
    triggers: ['fix bug', 'resolve issue', 'patch', 'refactor', 'optimize', 'cleanup', 'improve performance', 'technical debt', 'debug', 'repair'],
    flows: ['bug-triage/', 'code-and-review/'],
    routingExamples: [
      'fix the login bug',
      'refactor the session storage',
      'optimize database queries',
      'cleanup unused imports',
    ],
  },
  explore: {
    id: 'explore',
    label: 'Explore',
    icon: '🔍',
    hasNotifications: true,
    notificationCount: 0,
    glowColor: '#2196f3',
    tooltip: 'Research, codebase exploration, and learning',
    routable: true,
    triggers: ['explore', 'investigate', 'research', 'learn', 'understand', 'explain', 'how does', 'study', 'analyze', 'discover'],
    flows: ['doc-reorganization/', 'ideation/'],
    routingExamples: [
      'explore the WebSocket implementation',
      'research best practices for state management',
      'how does the contract parser work',
      'investigate performance bottlenecks',
    ],
  },
  review: {
    id: 'review',
    label: 'Review',
    icon: '👁️',
    hasNotifications: true,
    notificationCount: 0,
    glowColor: '#9c27b0',
    tooltip: 'Code reviews, PR checks, and audits',
    routable: true,
    triggers: ['review', 'code review', 'audit', 'check quality', 'security scan', 'inspect', 'examine', 'validate', 'verify'],
    flows: ['audit-and-fix/'],
    routingExamples: [
      'review the auth implementation',
      'audit security vulnerabilities',
      'check code quality of backend routes',
      'inspect the database schema',
    ],
  },
  archive: {
    id: 'archive',
    label: 'Archive',
    icon: '📦',
    hasNotifications: false,
    notificationCount: 0,
    tooltip: 'Completed and historical sessions',
    routable: false,
    triggers: [],
    flows: [],
    routingExamples: [],
  },
  settings: {
    id: 'settings',
    label: 'Settings',
    icon: '⚙️',
    hasNotifications: false,
    notificationCount: 0,
    tooltip: 'Configuration, preferences, and system management',
    routable: true,
    triggers: ['configure', 'set up', 'change settings', 'create flow', 'create action', 'onboard me', 'framework health', 'setup', 'initialize'],
    flows: ['onboarding/', 'flow-creation/', 'action-creation/', 'framework-health/'],
    routingExamples: [
      'configure backend port',
      'create a new testing flow',
      'onboard me to ActionFlows',
      'check framework health',
    ],
  },
  pm: {
    id: 'pm',
    label: 'PM',
    icon: '📋',
    hasNotifications: true,
    notificationCount: 0,
    glowColor: '#00bcd4',
    tooltip: 'Project management, tasks, and documentation',
    routable: true,
    triggers: ['plan', 'roadmap', 'organize', 'track tasks', 'project management', 'what\'s next', 'priorities', 'schedule', 'coordinate'],
    flows: ['planning/'],
    routingExamples: [
      'plan the next sprint',
      'create a roadmap for Q2',
      'what are the current priorities',
      'organize upcoming tasks',
    ],
  },
  harmony: {
    id: 'harmony',
    label: 'Harmony',
    icon: '🎵',
    hasNotifications: true,
    notificationCount: 0,
    glowColor: '#f44336',
    tooltip: 'Violations, sins, and remediations',
    routable: false,
    triggers: [],
    flows: [],
    routingExamples: [],
  },
  editor: {
    id: 'editor',
    label: 'Editor',
    icon: '📝',
    hasNotifications: false,
    notificationCount: 0,
    tooltip: 'Full-screen code editing',
    routable: false,
    triggers: [],
    flows: [],
    routingExamples: [],
  },
  intel: {
    id: 'intel',
    label: 'Intel',
    icon: '🕵️',
    hasNotifications: true,
    notificationCount: 0,
    glowColor: '#673ab7',
    tooltip: 'Intelligence dossiers and persistent monitoring',
    routable: true,
    triggers: ['dossier', 'intel', 'intelligence', 'monitor', 'watch', 'track', 'insight'],
    flows: ['intel-analysis/'],
    routingExamples: [
      'create a dossier for auth system',
      'monitor the database layer',
      'track changes in the API routes',
      'intelligence on WebSocket implementation',
    ],
  },
  canvas: {
    id: 'canvas',
    label: 'Canvas',
    icon: '🎨',
    hasNotifications: false,
    notificationCount: 0,
    tooltip: 'Live HTML/CSS preview for design collaboration',
    routable: false,
    triggers: [],
    flows: [],
    routingExamples: [],
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

// ============================================================================
// Context-Native Routing
// ============================================================================

/**
 * Workbenches that can receive orchestrator-routed sessions
 */
export const ROUTABLE_WORKBENCHES: readonly WorkbenchId[] = [
  'work',
  'maintenance',
  'explore',
  'review',
  'settings',
  'pm',
  'intel',
] as const;

/**
 * Check if a workbench is routable (can receive orchestrator sessions)
 */
export function isRoutable(workbenchId: WorkbenchId): boolean {
  return ROUTABLE_WORKBENCHES.includes(workbenchId);
}
