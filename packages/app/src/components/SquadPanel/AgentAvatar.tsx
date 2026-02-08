/**
 * AgentAvatar Component
 * Character visual with expression states and aura
 *
 * Features:
 * - Role-based color scheme and character styling
 * - Status-driven expression animations
 * - Eye tracking on hover (follows cursor)
 * - Aura glow that pulses with activity
 * - Size variants (orchestrator 1.5x, subagent standard)
 */

import { useMemo } from 'react';
import type { AgentAvatarProps } from './types';
import { AGENT_COLORS } from './types';
import './AgentAvatar.css';
import './animations.css';

/**
 * Render emoji character for agent role
 * Fallback to colored circle if no specific character available
 */
function getCharacterEmoji(role: string): string {
  const emojis: Record<string, string> = {
    orchestrator: '🎼',
    explore: '🔍',
    plan: '♟️',
    bash: '⚙️',
    read: '📖',
    write: '✍️',
    edit: '✏️',
    grep: '🔎',
    glob: '🗺️',
  };
  return emojis[role] || '●';
}

/**
 * Calculate eye position based on cursor position relative to avatar
 * Returns normalized coordinates for eye positioning in SVG
 */
function calculateEyePosition(
  eyeTarget: { x: number; y: number } | null,
  isHovered: boolean
): { x: number; y: number } {
  if (!eyeTarget || !isHovered) {
    return { x: 0, y: 0 };
  }

  // Clamp eye movement to subtle range (-0.3 to 0.3)
  const maxDeviation = 0.3;
  const clampedX = Math.max(-maxDeviation, Math.min(maxDeviation, eyeTarget.x));
  const clampedY = Math.max(-maxDeviation, Math.min(maxDeviation, eyeTarget.y));

  return { x: clampedX, y: clampedY };
}

/**
 * Get expression state class based on agent status
 * Controls face/body animation and aura behavior
 */
function getExpressionState(status: string): string {
  switch (status) {
    case 'thinking':
      return 'expression-thinking';
    case 'working':
      return 'expression-working';
    case 'error':
      return 'expression-error';
    case 'success':
      return 'expression-success';
    case 'waiting':
      return 'expression-waiting';
    case 'spawning':
      return 'expression-spawning';
    default:
      return 'expression-idle';
  }
}

/**
 * Get aura animation state based on agent status
 * Determines pulse rate and intensity
 */
function getAuraState(status: string): string {
  switch (status) {
    case 'thinking':
      return 'aura-thinking';
    case 'working':
      return 'aura-working';
    case 'error':
      return 'aura-error';
    case 'success':
      return 'aura-success';
    case 'waiting':
      return 'aura-waiting';
    case 'spawning':
      return 'aura-spawning';
    default:
      return 'aura-idle';
  }
}

export function AgentAvatar({
  role,
  status,
  isHovered,
  eyeTarget,
  size,
  className = '',
}: AgentAvatarProps) {
  const colors = AGENT_COLORS[role as keyof typeof AGENT_COLORS] || AGENT_COLORS.orchestrator;
  const characterEmoji = getCharacterEmoji(role);
  const eyePos = useMemo(
    () => calculateEyePosition(eyeTarget, isHovered),
    [eyeTarget, isHovered]
  );

  const sizeClass = size === 'orchestrator' ? 'size-orchestrator' : 'size-subagent';
  const expressionClass = getExpressionState(status);
  const auraClass = getAuraState(status);
  const hoverClass = isHovered ? 'is-hovered' : '';

  // Status-based animation classes
  const statusAnimationClass = `agent-avatar-${status}`;
  const auraAnimationClass = `agent-aura-${status}`;

  return (
    <div
      className={`agent-avatar ${sizeClass} ${expressionClass} ${hoverClass} ${statusAnimationClass} ${className}`}
      role="img"
      aria-label={`${role} agent character`}
      style={{
        '--glow-color': colors.glow,
      } as React.CSSProperties}
    >
      {/* Aura layer - dynamic pulse with status */}
      <div
        className={`avatar-aura ${auraClass} ${auraAnimationClass}`}
        style={{
          borderColor: colors.glow,
          boxShadow: `0 0 ${isHovered ? 20 : 12}px ${colors.glow}`,
        }}
      />

      {/* Main character container with floating animation */}
      <div className="avatar-character">
        {/* SVG-based face/body for scalable, crisp rendering */}
        <svg
          viewBox="0 0 100 140"
          className="avatar-svg"
          style={{
            filter: `drop-shadow(0 0 8px ${colors.glow})`,
          }}
        >
          {/* Background circle (body) */}
          <circle
            cx="50"
            cy="90"
            r="28"
            fill={colors.primary}
            stroke={colors.accent}
            strokeWidth="2"
            opacity="0.85"
          />

          {/* Head circle */}
          <circle
            cx="50"
            cy="40"
            r="35"
            fill={colors.primary}
            stroke={colors.accent}
            strokeWidth="2"
          />

          {/* Left eye base */}
          <circle
            cx={35 + eyePos.x * 5}
            cy={35 + eyePos.y * 5}
            r="6"
            fill="white"
            stroke={colors.accent}
            strokeWidth="1.5"
          />

          {/* Right eye base */}
          <circle
            cx={65 + eyePos.x * 5}
            cy={35 + eyePos.y * 5}
            r="6"
            fill="white"
            stroke={colors.accent}
            strokeWidth="1.5"
          />

          {/* Left pupil - tracks eye position */}
          <circle
            cx={35 + eyePos.x * 6}
            cy={35 + eyePos.y * 6}
            r="3"
            fill={colors.accent}
          />

          {/* Right pupil - tracks eye position */}
          <circle
            cx={65 + eyePos.x * 6}
            cy={35 + eyePos.y * 6}
            r="3"
            fill={colors.accent}
          />

          {/* Eye shine highlight */}
          <circle cx="37" cy="33" r="2" fill="white" opacity="0.7" />
          <circle cx="67" cy="33" r="2" fill="white" opacity="0.7" />

          {/* Mouth - varies by expression class (CSS controls) */}
          <path
            className="avatar-mouth"
            d="M 40 55 Q 50 65 60 55"
            stroke={colors.accent}
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
          />

          {/* Accent mark (cheek blush or marking) */}
          <circle cx="25" cy="50" r="4" fill={colors.accent} opacity="0.4" />
          <circle cx="75" cy="50" r="4" fill={colors.accent} opacity="0.4" />
        </svg>

        {/* Emoji fallback for accessibility and flavor */}
        <div className="avatar-emoji" aria-hidden="true">
          {characterEmoji}
        </div>
      </div>

      {/* Status indicator dot - color matches agent role */}
      <div
        className="avatar-status-dot"
        style={{
          backgroundColor: colors.accent,
          boxShadow: `0 0 8px ${colors.accent}`,
        }}
      />
    </div>
  );
}
