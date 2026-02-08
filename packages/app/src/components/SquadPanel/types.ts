/**
 * SquadPanel Types
 * Character-driven agent visualization
 */

import type { SessionId, Timestamp } from '@afw/shared';

export type AgentRole =
  | 'orchestrator'
  | 'explore'
  | 'plan'
  | 'bash'
  | 'read'
  | 'write'
  | 'edit'
  | 'grep'
  | 'glob';

export type AgentStatus =
  | 'idle'
  | 'thinking'
  | 'working'
  | 'success'
  | 'error'
  | 'waiting'
  | 'spawning';

export type LogType =
  | 'info'
  | 'success'
  | 'error'
  | 'thinking'
  | 'warning';

export interface AgentLog {
  id: string;
  type: LogType;
  message: string;
  timestamp: number;
}

export interface AgentCharacter {
  id: string;
  role: AgentRole;
  name: string;
  status: AgentStatus;
  logs: AgentLog[];
  progress?: number;       // 0-100
  currentAction?: string;  // e.g., "Reading file...", "Analyzing..."
  parentId?: string;       // For subagents, points to orchestrator
}

export interface AgentColorScheme {
  primary: string;
  accent: string;
  glow: string;
}

/**
 * SquadPanel Container Props
 * Root component configuration
 */
export interface SquadPanelProps {
  /** Current session ID to track agents for */
  sessionId: SessionId | null;

  /** Placement of the panel (affects layout) */
  placement?: 'left' | 'right' | 'bottom';

  /** Optional CSS className */
  className?: string;

  /** Callback when an agent is clicked */
  onAgentClick?: (agentId: string) => void;

  /** Enable/disable audio cues */
  audioEnabled?: boolean;
}

/**
 * SquadPanel Internal State
 */
export interface SquadPanelState {
  /** Map of agent ID → AgentCharacter */
  agents: Map<string, AgentCharacter>;

  /** ID of currently expanded agent (for log panel) */
  expandedAgentId: string | null;

  /** ID of orchestrator agent (always present) */
  orchestratorId: string;
}

/**
 * AgentRow Component Props
 * Layout component for agent arrangement
 */
export interface AgentRowProps {
  /** The orchestrator agent (center, 1.5x size) */
  orchestrator: AgentCharacter;

  /** Subagents to distribute on left/right */
  subagents: AgentCharacter[];

  /** Currently expanded agent ID (for visual indicator) */
  expandedAgentId: string | null;

  /** Callbacks */
  onAgentHover: (agentId: string, isHovering: boolean) => void;
  onAgentClick: (agentId: string) => void;
}

/**
 * AgentCharacterCard Props
 * Individual agent card with visual character and interactions
 */
export interface AgentCharacterCardProps {
  /** Agent data */
  agent: AgentCharacter;

  /** Size variant */
  size: 'orchestrator' | 'subagent';

  /** Is this agent currently expanded? */
  isExpanded: boolean;

  /** Callbacks */
  onHover: (isHovering: boolean) => void;
  onClick: () => void;

  /** Optional CSS className */
  className?: string;
}

/**
 * AgentCharacterCard Internal State
 */
export interface AgentCharacterCardState {
  /** Is mouse hovering? */
  isHovered: boolean;

  /** Eye tracking position (for hover effect) */
  eyePosition: { x: number; y: number } | null;
}

/**
 * AgentAvatar Props
 * Character visual with expression states and aura
 */
export interface AgentAvatarProps {
  /** Agent role (determines color scheme + artwork) */
  role: AgentRole;

  /** Current status (determines expression) */
  status: AgentStatus;

  /** Is hovering? (affects aura intensity) */
  isHovered: boolean;

  /** Eye tracking target (for hover effect) */
  eyeTarget: { x: number; y: number } | null;

  /** Size variant */
  size: 'orchestrator' | 'subagent';

  /** Optional CSS className */
  className?: string;
}

/**
 * AgentStatusBar Props
 * Status text + progress bar overlay
 */
export interface AgentStatusBarProps {
  /** Agent character data */
  agent: AgentCharacter;

  /** Is hovering? (affects visibility of progress bar) */
  isHovered: boolean;

  /** Is expanded? (keeps status visible) */
  isExpanded: boolean;

  /** Optional CSS className */
  className?: string;
}

/**
 * AgentLogPanel Props
 * Expandable log display
 */
export interface AgentLogPanelProps {
  /** Agent whose logs to display */
  agent: AgentCharacter;

  /** Is this panel expanded? */
  isExpanded: boolean;

  /** Max height before scrolling */
  maxHeight?: number;

  /** Optional CSS className */
  className?: string;
}

/**
 * LogBubble Props
 * Individual log message bubble
 */
export interface LogBubbleProps {
  /** Log entry data */
  log: AgentLog;

  /** Optional CSS className */
  className?: string;
}

/**
 * useAgentTracking Hook Result
 * Result type for the agent tracking hook
 */
export interface UseAgentTrackingResult {
  /** Map of agentId → AgentCharacter */
  agents: Map<string, AgentCharacter>;

  /** Orchestrator agent (always present) */
  orchestrator: AgentCharacter | null;

  /** List of subagents (excludes orchestrator) */
  subagents: AgentCharacter[];
}

/**
 * useAgentInteractions Hook Result
 * Result type for managing hover/click/expand state
 */
export interface UseAgentInteractionsResult {
  /** Currently hovered agent ID */
  hoveredAgentId: string | null;

  /** Set hovered agent */
  setHoveredAgent: (agentId: string | null) => void;

  /** Currently expanded agent ID */
  expandedAgentId: string | null;

  /** Toggle expanded state for an agent */
  toggleExpanded: (agentId: string) => void;

  /** Calculate eye target position from mouse event */
  calculateEyeTarget: (
    event: React.MouseEvent,
    agentElement: HTMLElement
  ) => { x: number; y: number };
}

/**
 * Internal event tracking state
 * Used by useAgentTracking to build agent state from events
 */
export interface AgentTrackingState {
  agents: Map<string, AgentCharacter>;
  orchestratorId: string | null;
  lastEventTime: Timestamp | null;
}

export const AGENT_COLORS: Record<AgentRole, AgentColorScheme> = {
  orchestrator: { primary: '#E8E8E8', accent: '#FFD700', glow: '#FFFAF0' },
  explore:      { primary: '#20B2AA', accent: '#00FFFF', glow: '#7FFFD4' },
  plan:         { primary: '#6A0DAD', accent: '#EE82EE', glow: '#FF00FF' },
  bash:         { primary: '#3C3C3C', accent: '#00FF00', glow: '#39FF14' },
  read:         { primary: '#000080', accent: '#87CEEB', glow: '#FFFAFA' },
  write:        { primary: '#FFFDD0', accent: '#1A1A1A', glow: '#FFBF00' },
  edit:         { primary: '#708090', accent: '#FF6F61', glow: '#FFB6C1' },
  grep:         { primary: '#228B22', accent: '#32CD32', glow: '#FFFF00' },
  glob:         { primary: '#4B0082', accent: '#FFFAFA', glow: '#6495ED' },
};

export const AGENT_NAMES: Record<AgentRole, string> = {
  orchestrator: 'Orchestrator',
  explore: 'Explore',
  plan: 'Plan',
  bash: 'Bash',
  read: 'Read',
  write: 'Write',
  edit: 'Edit',
  grep: 'Grep',
  glob: 'Glob',
};

export const AGENT_ARCHETYPES: Record<AgentRole, string> = {
  orchestrator: 'Team Captain',
  explore: 'Curious Scout',
  plan: 'Chess Master',
  bash: 'Hands-on Mechanic',
  read: 'Gentle Archivist',
  write: 'Artistic Calligrapher',
  edit: 'Precise Surgeon',
  grep: 'Sharp-eyed Tracker',
  glob: 'Pattern Cartographer',
};

/**
 * Action to AgentRole mapping
 * Maps WebSocket event action fields to agent roles
 */
export const ACTION_TO_AGENT_ROLE: Record<string, AgentRole> = {
  // Explore actions
  explore: 'explore',
  search: 'explore',
  discover: 'explore',
  find: 'explore',

  // Plan actions
  plan: 'plan',
  design: 'plan',
  architect: 'plan',
  analyze: 'plan',

  // Bash actions
  bash: 'bash',
  shell: 'bash',
  execute: 'bash',
  run: 'bash',

  // Read actions
  read: 'read',
  parse: 'read',
  fetch: 'read',
  load: 'read',

  // Write actions
  write: 'write',
  create: 'write',
  generate: 'write',
  output: 'write',

  // Edit actions
  edit: 'edit',
  modify: 'edit',
  update: 'edit',
  patch: 'edit',

  // Grep actions
  grep: 'grep',
  grep_search: 'grep',
  scan: 'grep',
  match: 'grep',

  // Glob actions
  glob: 'glob',
  pattern: 'glob',
  match_pattern: 'glob',
  list: 'glob',
};

/**
 * Helper to map action string to AgentRole
 * Falls back to 'orchestrator' for unknown actions
 */
export function mapActionToRole(action: string | undefined | null): AgentRole {
  if (!action) {
    return 'orchestrator';
  }

  const normalized = action.toLowerCase();

  // Direct match
  if (normalized in ACTION_TO_AGENT_ROLE) {
    return ACTION_TO_AGENT_ROLE[normalized];
  }

  // Partial matching for hyphenated actions
  for (const [key, role] of Object.entries(ACTION_TO_AGENT_ROLE)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return role;
    }
  }

  // Fallback to orchestrator
  return 'orchestrator';
}
