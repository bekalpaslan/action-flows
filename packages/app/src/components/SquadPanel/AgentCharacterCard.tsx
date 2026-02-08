/**
 * AgentCharacterCard Component
 * Card with character avatar, name, status, and interactions
 *
 * Features:
 * - Character avatar with expression states
 * - Status badge with progress indicator
 * - Hover effects: scale, aura brightens, status shows
 * - Click to expand: toggles log panel
 * - Eye tracking on hover
 * - Size variants (orchestrator 1.5x, subagent standard)
 */

import React, { useState, useRef, useCallback } from 'react';
import type { AgentCharacterCardProps } from './types';
import { AGENT_NAMES, AGENT_ARCHETYPES, AGENT_COLORS } from './types';
import { AgentAvatar } from './AgentAvatar';
import './AgentCharacterCard.css';

/**
 * Format progress percentage for display
 * Shows full progress for working agents, empty for idle
 */
function formatProgress(agent: AgentCharacterCardProps['agent']): number {
  if (agent.progress === undefined) {
    return agent.status === 'working' ? 50 : 0;
  }
  return Math.min(100, Math.max(0, agent.progress));
}

/**
 * Get status display text
 * Shows current action if available, otherwise shows status
 */
function getStatusText(agent: AgentCharacterCardProps['agent']): string {
  if (agent.currentAction) {
    return agent.currentAction;
  }
  return agent.status.charAt(0).toUpperCase() + agent.status.slice(1);
}

/**
 * Calculate eye target position from mouse event
 * Returns normalized coordinates relative to agent avatar
 */
function calculateEyeTarget(
  event: React.MouseEvent,
  avatarElement: HTMLElement
): { x: number; y: number } {
  const rect = avatarElement.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  const mouseX = event.clientX;
  const mouseY = event.clientY;

  const deltaX = mouseX - centerX;
  const deltaY = mouseY - centerY;

  // Normalize to -1 to 1 range
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  const maxDistance = Math.max(rect.width, rect.height) * 1.5;

  return {
    x: distance > 0 ? (deltaX / maxDistance) * 0.8 : 0,
    y: distance > 0 ? (deltaY / maxDistance) * 0.8 : 0,
  };
}

/**
 * AgentCharacterCard - Interactive card for individual agent
 * Displays character, status, and provides click-to-expand interface
 */
export function AgentCharacterCard({
  agent,
  size,
  isExpanded,
  onHover,
  onClick,
  className = '',
}: AgentCharacterCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [eyeTarget, setEyeTarget] = useState<{ x: number; y: number } | null>(null);
  const avatarRef = useRef<HTMLDivElement>(null);

  const agentName = AGENT_NAMES[agent.role] || agent.name;
  const agentArchetype = AGENT_ARCHETYPES[agent.role];
  const colors = AGENT_COLORS[agent.role];
  const progress = formatProgress(agent);
  const statusText = getStatusText(agent);

  const handleMouseEnter = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      setIsHovered(true);
      if (avatarRef.current) {
        const target = calculateEyeTarget(e, avatarRef.current);
        setEyeTarget(target);
      }
      onHover(true);
    },
    [onHover]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (isHovered && avatarRef.current) {
        const target = calculateEyeTarget(e, avatarRef.current);
        setEyeTarget(target);
      }
    },
    [isHovered]
  );

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    setEyeTarget(null);
    onHover(false);
  }, [onHover]);

  const handleClick = useCallback(() => {
    onClick();
  }, [onClick]);

  const sizeClass = size === 'orchestrator' ? 'size-orchestrator' : 'size-subagent';
  const statusClass = `status-${agent.status}`;
  const expandedClass = isExpanded ? 'is-expanded' : '';
  const hoverClass = isHovered ? 'is-hovered' : '';

  return (
    <div
      className={`agent-character-card ${sizeClass} ${statusClass} ${expandedClass} ${hoverClass} ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      aria-label={`${agentName} agent - ${agent.status} status`}
      aria-expanded={isExpanded}
    >
      {/* Avatar section with character visual */}
      <div className="card-avatar-container" ref={avatarRef}>
        <AgentAvatar
          role={agent.role}
          status={agent.status}
          isHovered={isHovered}
          eyeTarget={eyeTarget}
          size={size}
          className="card-avatar"
        />
      </div>

      {/* Name and archetype label */}
      <div className="card-info">
        <h3 className="card-name">{agentName}</h3>
        <p className="card-archetype">{agentArchetype}</p>
      </div>

      {/* Status section - shows on hover or when expanded */}
      <div className="card-status-section">
        <div className="status-badge" style={{ borderColor: colors.glow }}>
          <span className="status-text">{statusText}</span>
          <span className="status-indicator" style={{ backgroundColor: colors.accent }} />
        </div>

        {/* Progress bar - visible on hover or when active */}
        {(isHovered || isExpanded || agent.status === 'working') && (
          <div className="progress-container">
            <div className="progress-label">
              <span className="progress-text">Progress</span>
              <span className="progress-value">{progress}%</span>
            </div>
            <div
              className="progress-bar"
              style={{
                '--progress-amount': `${progress}%`,
                '--progress-color': colors.accent,
              } as React.CSSProperties & { '--progress-amount': string; '--progress-color': string }}
            >
              <div className="progress-fill" />
            </div>
          </div>
        )}
      </div>

      {/* Expand indicator - shows it's clickable */}
      <div className="card-expand-indicator">
        <div className="expand-icon" style={{ color: colors.glow }}>
          {isExpanded ? '▼' : '▶'}
        </div>
      </div>

      {/* Interaction hint - visible on hover */}
      {isHovered && (
        <div className="card-hint">
          Click to {isExpanded ? 'collapse' : 'expand'} logs
        </div>
      )}
    </div>
  );
}
