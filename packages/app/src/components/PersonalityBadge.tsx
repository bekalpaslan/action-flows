/**
 * PersonalityBadge Component
 * Displays an agent's personality as a visual badge
 *
 * Part of Phase 1 - Agent Personalities (Thread 5)
 */

import type { AgentPersonality } from '@afw/shared';
import { PERSONALITY_COLORS, PERSONALITY_ICONS } from '@afw/shared';

interface PersonalityBadgeProps {
  personality: AgentPersonality;
  /** Show just the icon or icon + label */
  compact?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
}

export function PersonalityBadge({
  personality,
  compact = false,
  size = 'sm'
}: PersonalityBadgeProps) {
  const color = PERSONALITY_COLORS[personality.tone];
  const icon = PERSONALITY_ICONS[personality.tone];

  const fontSize = size === 'sm' ? '11px' : size === 'md' ? '13px' : '15px';
  const padding = compact ? '2px 4px' : '2px 8px';

  return (
    <span
      className="personality-badge"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding,
        borderRadius: '12px',
        backgroundColor: `${color}20`,  // 12% opacity
        border: `1px solid ${color}40`, // 25% opacity
        color: color,
        fontSize,
        fontWeight: 500,
        whiteSpace: 'nowrap',
      }}
      title={`${personality.tone} tone | ${personality.speedPreference} speed | ${personality.riskTolerance} risk`}
    >
      <span>{icon}</span>
      {!compact && <span style={{ textTransform: 'capitalize' }}>{personality.tone}</span>}
    </span>
  );
}

/**
 * PersonalityDetails Component
 * Shows detailed personality information (for tooltips or expanded views)
 */
export function PersonalityDetails({ personality }: { personality: AgentPersonality }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px' }}>
      <div><strong>Tone:</strong> {personality.tone}</div>
      <div><strong>Speed:</strong> {personality.speedPreference}</div>
      <div><strong>Risk:</strong> {personality.riskTolerance}</div>
      <div><strong>Style:</strong> {personality.communicationStyle}</div>
    </div>
  );
}
