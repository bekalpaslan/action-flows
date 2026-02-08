/**
 * SquadPanel - Public Exports
 * Character-driven agent visualization panel
 */

// Types
export type {
  AgentRole,
  AgentStatus,
  LogType,
  AgentLog,
  AgentCharacter,
  AgentColorScheme,
  SquadPanelProps,
  SquadPanelState,
  AgentRowProps,
  AgentCharacterCardProps,
  AgentCharacterCardState,
  AgentAvatarProps,
  AgentStatusBarProps,
  AgentLogPanelProps,
  LogBubbleProps,
  UseAgentTrackingResult,
  UseAgentInteractionsResult,
  AgentTrackingState,
} from './types';

// Constants
export {
  AGENT_COLORS,
  AGENT_NAMES,
  AGENT_ARCHETYPES,
  ACTION_TO_AGENT_ROLE,
  mapActionToRole,
} from './types';

// Components
export { SquadPanel } from './SquadPanel';
export { AgentRow } from './AgentRow';
export { AgentCharacterCard } from './AgentCharacterCard';
export { AgentAvatar } from './AgentAvatar';
export { AgentLogPanel } from './AgentLogPanel';
export { LogBubble } from './LogBubble';

// Hooks
export { useAgentTracking } from './useAgentTracking';
export { useAgentInteractions } from './useAgentInteractions';
