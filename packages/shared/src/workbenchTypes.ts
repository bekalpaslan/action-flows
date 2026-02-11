/**
 * Workbench System Types
 *
 * Defines the 9 workbenches that form the primary navigation structure
 * of the ActionFlows Dashboard.
 */

// ============================================================================
// Workbench Identifiers (Cosmic Model Taxonomy)
// ============================================================================

/**
 * Stars: workbenches that appear on the cosmic map as celestial bodies.
 * Includes 8 framework defaults + 1+ custom stars.
 */
export type StarId =
  | 'work'
  | 'maintenance'
  | 'explore'
  | 'review'
  | 'archive'
  | 'settings'
  | 'pm'
  | 'intel'      // Custom star (demo)
  | 'respect';   // Custom star (demo)

/**
 * Tools: embedded capabilities within star interiors (NOT stars themselves).
 * These appear inside workbench panels, not on the cosmic map.
 */
export type ToolId = 'editor' | 'canvas' | 'coverage';

/**
 * Harmony: the space itself — the medium through which all bridges pass.
 * This is a singleton dimension, not a star.
 */
export type HarmonySpace = 'harmony';

/**
 * WorkbenchId: backward-compatible union representing a workbench entity.
 * A workbench is either a star or the harmony space. Tools are NOT workbenches.
 *
 * @deprecated Prefer explicit StarId | HarmonySpace for new code.
 *             Use NavigationTarget when you need to include tools.
 */
export type WorkbenchId = StarId | HarmonySpace;

/**
 * NavigationTarget: all possible UI navigation destinations.
 * Used for backward compatibility during gradual migration.
 */
export type NavigationTarget = StarId | HarmonySpace | ToolId;

/**
 * All workbench IDs as an array for iteration
 * @deprecated Use STAR_IDS, TOOL_IDS, or NAVIGATION_TARGETS instead for clarity
 */
export const WORKBENCH_IDS: readonly NavigationTarget[] = [
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
  'respect',
  'canvas',
  'coverage',
] as const;

/**
 * All star IDs (cosmic map entities)
 */
export const STAR_IDS: readonly StarId[] = [
  'work',
  'maintenance',
  'explore',
  'review',
  'archive',
  'settings',
  'pm',
  'intel',
  'respect',
] as const;

/**
 * All tool IDs (embedded capabilities)
 */
export const TOOL_IDS: readonly ToolId[] = [
  'editor',
  'canvas',
  'coverage',
] as const;

/**
 * All navigation targets (stars + harmony + tools)
 */
export const NAVIGATION_TARGETS: readonly NavigationTarget[] = [
  ...STAR_IDS,
  'harmony',
  ...TOOL_IDS,
] as const;

// ============================================================================
// Workbench Configuration
// ============================================================================

/**
 * Configuration for a single workbench tab
 * Phase A: Still accepts all navigation targets for backward compatibility
 */
export interface WorkbenchConfig {
  /** Unique identifier (can be star, harmony, or tool during migration) */
  id: NavigationTarget;
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

// ============================================================================
// Phase B: Entity-Specific Configuration Interfaces
// ============================================================================

/**
 * Star-specific configuration
 * Stars are the primary workbench entities that appear on the cosmic map
 */
export interface StarConfig {
  /** Unique star identifier */
  id: StarId;
  /** Display label for the star */
  label: string;
  /** Icon identifier (emoji or icon name) */
  icon: string;
  /** Whether this star can show notifications */
  hasNotifications: boolean;
  /** Current notification count (0 = no badge) */
  notificationCount: number;
  /** Glow color when notifications are present */
  glowColor?: string;
  /** Whether this star is currently disabled */
  disabled?: boolean;
  /** Tooltip text */
  tooltip: string;
  /** Whether orchestrator can route sessions to this star */
  routable: boolean;
  /** Trigger keywords/phrases that route to this star */
  triggers: string[];
  /** Available flows in this star */
  flows: string[];
  /** Example user requests for this star */
  routingExamples: string[];
  /** Cosmic name for the star (e.g., "The Hearth", "The Observatory") */
  cosmicName: string;
}

/**
 * Tool-specific configuration
 * Tools are embedded capabilities within stars (NOT stars themselves)
 */
export interface ToolConfig {
  /** Unique tool identifier */
  id: ToolId;
  /** Display label for the tool */
  label: string;
  /** Icon identifier (emoji or icon name) */
  icon: string;
  /** Tooltip text */
  tooltip: string;
  /** How the tool embeds within a star */
  embedMode: 'fullscreen' | 'panel' | 'modal';
  /** Which stars can embed this tool */
  availableIn: StarId[];
}

/**
 * Harmony space configuration (singleton)
 * The space itself — the medium through which all bridges pass
 */
export interface HarmonyConfig {
  /** Harmony identifier (always 'harmony') */
  id: HarmonySpace;
  /** Display label */
  label: string;
  /** Icon identifier */
  icon: string;
  /** Tooltip text */
  tooltip: string;
  /** Whether harmony can show notifications (contract violations) */
  hasNotifications: boolean;
  /** Glow color when violations are present */
  glowColor: string;
}

// ============================================================================
// Phase B: Entity-Specific Default Configurations
// ============================================================================

/**
 * Star configurations mapped by StarId
 * These are the primary workbench entities that appear on the cosmic map
 */
export const STAR_CONFIGS: Record<StarId, StarConfig> = {
  work: {
    id: 'work',
    label: 'Work',
    icon: 'W',
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
    cosmicName: 'The Hearth',
  },
  maintenance: {
    id: 'maintenance',
    label: 'Maintenance',
    icon: 'Mt',
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
    cosmicName: 'The Observatory',
  },
  explore: {
    id: 'explore',
    label: 'Explore',
    icon: 'Ex',
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
    cosmicName: "The Cartographer's Table",
  },
  review: {
    id: 'review',
    label: 'Review',
    icon: 'Rv',
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
    cosmicName: 'The Tribunal',
  },
  archive: {
    id: 'archive',
    label: 'Archive',
    icon: 'Ar',
    hasNotifications: false,
    notificationCount: 0,
    tooltip: 'Completed and historical sessions',
    routable: false,
    triggers: [],
    flows: [],
    routingExamples: [],
    cosmicName: 'The Vault',
  },
  settings: {
    id: 'settings',
    label: 'Settings',
    icon: 'St',
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
    cosmicName: 'The Loom',
  },
  pm: {
    id: 'pm',
    label: 'PM',
    icon: 'PM',
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
    cosmicName: 'The War Table',
  },
  intel: {
    id: 'intel',
    label: 'Intel',
    icon: 'In',
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
    cosmicName: 'The Spy Glass',
  },
  respect: {
    id: 'respect',
    label: 'Respect',
    icon: 'Rs',
    hasNotifications: true,
    notificationCount: 0,
    glowColor: '#e91e63',
    tooltip: 'Spatial boundary compliance and component health monitoring',
    routable: false,
    triggers: [],
    flows: [],
    routingExamples: [],
    cosmicName: 'The Guardian',
  },
};

/**
 * Tool configurations mapped by ToolId
 * These are embedded capabilities within stars, not stars themselves
 */
export const TOOL_CONFIGS: Record<ToolId, ToolConfig> = {
  editor: {
    id: 'editor',
    label: 'Editor',
    icon: 'Ed',
    tooltip: 'Full-screen code editing tool',
    embedMode: 'fullscreen',
    availableIn: ['work', 'explore', 'review', 'maintenance'],
  },
  canvas: {
    id: 'canvas',
    label: 'Canvas',
    icon: 'Cv',
    tooltip: 'Live HTML/CSS preview for design collaboration',
    embedMode: 'panel',
    availableIn: ['work', 'explore'],
  },
  coverage: {
    id: 'coverage',
    label: 'Coverage',
    icon: 'Cg',
    tooltip: 'Contract coverage and component health monitoring',
    embedMode: 'panel',
    availableIn: ['work', 'maintenance', 'review'],
  },
};

/**
 * Harmony space configuration (singleton)
 * The space itself — the medium through which all bridges pass
 */
export const HARMONY_CONFIG: HarmonyConfig = {
  id: 'harmony',
  label: 'Harmony',
  icon: 'H',
  tooltip: 'The space between stars — click empty void to view gate logs and contract violations',
  hasNotifications: true,
  glowColor: '#f44336',
};

/**
 * Backward-compatible unified config record
 * @deprecated Use STAR_CONFIGS, TOOL_CONFIGS, HARMONY_CONFIG instead for type-safe access
 */
export const DEFAULT_WORKBENCH_CONFIGS: Record<NavigationTarget, WorkbenchConfig> = {
  // Stars - convert StarConfig to WorkbenchConfig
  work: {
    id: 'work',
    label: STAR_CONFIGS.work.label,
    icon: STAR_CONFIGS.work.icon,
    hasNotifications: STAR_CONFIGS.work.hasNotifications,
    notificationCount: STAR_CONFIGS.work.notificationCount,
    glowColor: STAR_CONFIGS.work.glowColor,
    disabled: STAR_CONFIGS.work.disabled,
    tooltip: STAR_CONFIGS.work.tooltip,
    routable: STAR_CONFIGS.work.routable,
    triggers: STAR_CONFIGS.work.triggers,
    flows: STAR_CONFIGS.work.flows,
    routingExamples: STAR_CONFIGS.work.routingExamples,
  },
  maintenance: {
    id: 'maintenance',
    label: STAR_CONFIGS.maintenance.label,
    icon: STAR_CONFIGS.maintenance.icon,
    hasNotifications: STAR_CONFIGS.maintenance.hasNotifications,
    notificationCount: STAR_CONFIGS.maintenance.notificationCount,
    glowColor: STAR_CONFIGS.maintenance.glowColor,
    disabled: STAR_CONFIGS.maintenance.disabled,
    tooltip: STAR_CONFIGS.maintenance.tooltip,
    routable: STAR_CONFIGS.maintenance.routable,
    triggers: STAR_CONFIGS.maintenance.triggers,
    flows: STAR_CONFIGS.maintenance.flows,
    routingExamples: STAR_CONFIGS.maintenance.routingExamples,
  },
  explore: {
    id: 'explore',
    label: STAR_CONFIGS.explore.label,
    icon: STAR_CONFIGS.explore.icon,
    hasNotifications: STAR_CONFIGS.explore.hasNotifications,
    notificationCount: STAR_CONFIGS.explore.notificationCount,
    glowColor: STAR_CONFIGS.explore.glowColor,
    disabled: STAR_CONFIGS.explore.disabled,
    tooltip: STAR_CONFIGS.explore.tooltip,
    routable: STAR_CONFIGS.explore.routable,
    triggers: STAR_CONFIGS.explore.triggers,
    flows: STAR_CONFIGS.explore.flows,
    routingExamples: STAR_CONFIGS.explore.routingExamples,
  },
  review: {
    id: 'review',
    label: STAR_CONFIGS.review.label,
    icon: STAR_CONFIGS.review.icon,
    hasNotifications: STAR_CONFIGS.review.hasNotifications,
    notificationCount: STAR_CONFIGS.review.notificationCount,
    glowColor: STAR_CONFIGS.review.glowColor,
    disabled: STAR_CONFIGS.review.disabled,
    tooltip: STAR_CONFIGS.review.tooltip,
    routable: STAR_CONFIGS.review.routable,
    triggers: STAR_CONFIGS.review.triggers,
    flows: STAR_CONFIGS.review.flows,
    routingExamples: STAR_CONFIGS.review.routingExamples,
  },
  archive: {
    id: 'archive',
    label: STAR_CONFIGS.archive.label,
    icon: STAR_CONFIGS.archive.icon,
    hasNotifications: STAR_CONFIGS.archive.hasNotifications,
    notificationCount: STAR_CONFIGS.archive.notificationCount,
    glowColor: STAR_CONFIGS.archive.glowColor,
    disabled: STAR_CONFIGS.archive.disabled,
    tooltip: STAR_CONFIGS.archive.tooltip,
    routable: STAR_CONFIGS.archive.routable,
    triggers: STAR_CONFIGS.archive.triggers,
    flows: STAR_CONFIGS.archive.flows,
    routingExamples: STAR_CONFIGS.archive.routingExamples,
  },
  settings: {
    id: 'settings',
    label: STAR_CONFIGS.settings.label,
    icon: STAR_CONFIGS.settings.icon,
    hasNotifications: STAR_CONFIGS.settings.hasNotifications,
    notificationCount: STAR_CONFIGS.settings.notificationCount,
    glowColor: STAR_CONFIGS.settings.glowColor,
    disabled: STAR_CONFIGS.settings.disabled,
    tooltip: STAR_CONFIGS.settings.tooltip,
    routable: STAR_CONFIGS.settings.routable,
    triggers: STAR_CONFIGS.settings.triggers,
    flows: STAR_CONFIGS.settings.flows,
    routingExamples: STAR_CONFIGS.settings.routingExamples,
  },
  pm: {
    id: 'pm',
    label: STAR_CONFIGS.pm.label,
    icon: STAR_CONFIGS.pm.icon,
    hasNotifications: STAR_CONFIGS.pm.hasNotifications,
    notificationCount: STAR_CONFIGS.pm.notificationCount,
    glowColor: STAR_CONFIGS.pm.glowColor,
    disabled: STAR_CONFIGS.pm.disabled,
    tooltip: STAR_CONFIGS.pm.tooltip,
    routable: STAR_CONFIGS.pm.routable,
    triggers: STAR_CONFIGS.pm.triggers,
    flows: STAR_CONFIGS.pm.flows,
    routingExamples: STAR_CONFIGS.pm.routingExamples,
  },
  intel: {
    id: 'intel',
    label: STAR_CONFIGS.intel.label,
    icon: STAR_CONFIGS.intel.icon,
    hasNotifications: STAR_CONFIGS.intel.hasNotifications,
    notificationCount: STAR_CONFIGS.intel.notificationCount,
    glowColor: STAR_CONFIGS.intel.glowColor,
    disabled: STAR_CONFIGS.intel.disabled,
    tooltip: STAR_CONFIGS.intel.tooltip,
    routable: STAR_CONFIGS.intel.routable,
    triggers: STAR_CONFIGS.intel.triggers,
    flows: STAR_CONFIGS.intel.flows,
    routingExamples: STAR_CONFIGS.intel.routingExamples,
  },
  respect: {
    id: 'respect',
    label: STAR_CONFIGS.respect.label,
    icon: STAR_CONFIGS.respect.icon,
    hasNotifications: STAR_CONFIGS.respect.hasNotifications,
    notificationCount: STAR_CONFIGS.respect.notificationCount,
    glowColor: STAR_CONFIGS.respect.glowColor,
    disabled: STAR_CONFIGS.respect.disabled,
    tooltip: STAR_CONFIGS.respect.tooltip,
    routable: STAR_CONFIGS.respect.routable,
    triggers: STAR_CONFIGS.respect.triggers,
    flows: STAR_CONFIGS.respect.flows,
    routingExamples: STAR_CONFIGS.respect.routingExamples,
  },
  // Harmony
  harmony: {
    id: 'harmony',
    label: HARMONY_CONFIG.label,
    icon: HARMONY_CONFIG.icon,
    hasNotifications: HARMONY_CONFIG.hasNotifications,
    notificationCount: 0,
    glowColor: HARMONY_CONFIG.glowColor,
    tooltip: HARMONY_CONFIG.tooltip,
    routable: false,
    triggers: [],
    flows: [],
    routingExamples: [],
  },
  // Tools - convert ToolConfig to WorkbenchConfig
  editor: {
    id: 'editor',
    label: TOOL_CONFIGS.editor.label,
    icon: TOOL_CONFIGS.editor.icon,
    hasNotifications: false,
    notificationCount: 0,
    tooltip: TOOL_CONFIGS.editor.tooltip,
    routable: false,
    triggers: [],
    flows: [],
    routingExamples: [],
  },
  canvas: {
    id: 'canvas',
    label: TOOL_CONFIGS.canvas.label,
    icon: TOOL_CONFIGS.canvas.icon,
    hasNotifications: false,
    notificationCount: 0,
    tooltip: TOOL_CONFIGS.canvas.tooltip,
    routable: false,
    triggers: [],
    flows: [],
    routingExamples: [],
  },
  coverage: {
    id: 'coverage',
    label: TOOL_CONFIGS.coverage.label,
    icon: TOOL_CONFIGS.coverage.icon,
    hasNotifications: false,
    notificationCount: 0,
    tooltip: TOOL_CONFIGS.coverage.tooltip,
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

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard: check if a value is a StarId
 */
export function isStarId(value: unknown): value is StarId {
  return typeof value === 'string' && STAR_IDS.includes(value as StarId);
}

/**
 * Type guard: check if a value is a ToolId
 */
export function isToolId(value: unknown): value is ToolId {
  return typeof value === 'string' && TOOL_IDS.includes(value as ToolId);
}

/**
 * Type guard: check if a value is the Harmony space
 */
export function isHarmonySpace(value: unknown): value is HarmonySpace {
  return value === 'harmony';
}

/**
 * Type guard: check if a value is a NavigationTarget
 */
export function isNavigationTarget(value: unknown): value is NavigationTarget {
  return typeof value === 'string' && NAVIGATION_TARGETS.includes(value as NavigationTarget);
}
