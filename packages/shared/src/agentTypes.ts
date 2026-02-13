// Agent personality types for Phase 1 — Agent Personalities (Thread 5)

/** Agent personality tone */
export type AgentTone = 'bold' | 'cautious' | 'curious' | 'skeptical' | 'decisive' | 'balanced';

/** Agent speed preference */
export type AgentSpeed = 'fast' | 'balanced' | 'slow';

/** Agent risk tolerance */
export type AgentRisk = 'high' | 'medium' | 'low';

/** Agent communication style */
export type AgentCommunicationStyle = 'terse' | 'detailed' | 'poetic';

/** Full personality profile for an agent */
export interface AgentPersonality {
  tone: AgentTone;
  speedPreference: AgentSpeed;
  riskTolerance: AgentRisk;
  communicationStyle: AgentCommunicationStyle;
}

/** Metadata extracted from agent.md files */
export interface AgentMetadata {
  actionType: string;
  personality: AgentPersonality;
  preferredModel?: string;
  estimatedDuration?: number;
}

/** Default personality applied when agent.md has no ## Personality section */
export const DEFAULT_PERSONALITY: AgentPersonality = {
  tone: 'balanced',
  speedPreference: 'balanced',
  riskTolerance: 'medium',
  communicationStyle: 'detailed',
};

/** Color associations for personality tones (used in UI badges) */
export const PERSONALITY_COLORS: Record<AgentTone, string> = {
  bold: '#f97316',      // orange
  cautious: '#3b82f6',  // blue
  curious: '#14b8a6',   // teal
  skeptical: '#a855f7', // purple
  decisive: '#ef4444',  // red
  balanced: '#6b7280',  // gray
};

/** Emoji associations for personality traits */
export const PERSONALITY_ICONS: Record<AgentTone, string> = {
  bold: '⚡',
  cautious: '🛡️',
  curious: '🔍',
  skeptical: '🧐',
  decisive: '🎯',
  balanced: '⚖️',
};

/**
 * User preference for agent personality
 * Allows users to customize agent behavior globally or per-context
 */
export interface UserPersonalityPreference {
  /** User identifier */
  userId: string;
  /** Full personality profile (if user wants complete customization) */
  personality?: AgentPersonality;
  /** Optional context filters - if specified, only applies to these contexts */
  contexts?: string[];
  /** Timestamp when preference was last updated */
  updatedAt?: string;
}
