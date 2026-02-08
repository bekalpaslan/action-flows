/**
 * SquadPanel Component
 * Main container for orchestrator + subagents arrangement
 *
 * Layout:
 * - Orchestrator center (1.5x size, highlighted with glow)
 * - Subagents distributed evenly on left and right sides
 * - Expandable log panels for each agent
 * - Responsive layout (horizontal on wide, stacked on narrow)
 *
 * Features:
 * - Single-agent expand state (only one log panel open at a time)
 * - Hover/click state management via useAgentInteractions hook
 * - Mouse tracking for agent eye animations
 * - Audio cue support (optional)
 */

import React, { useCallback } from 'react';
import { useAgentTracking } from './useAgentTracking';
import { useAgentInteractions } from './useAgentInteractions';
import { AgentRow } from './AgentRow';
import type { SquadPanelProps } from './types';
import './SquadPanel.css';
import './animations.css';

/**
 * SquadPanel - Root container component for agent squad visualization
 *
 * Props:
 * - sessionId: Session ID to track agents for
 * - placement: 'left' | 'right' | 'bottom' (affects side positioning)
 * - className: Additional CSS classes
 * - onAgentClick: Callback when an agent card is clicked
 * - audioEnabled: Enable/disable audio cues
 */
export function SquadPanel({
  sessionId,
  placement = 'left',
  className = '',
  onAgentClick,
  audioEnabled = false,
}: SquadPanelProps): React.ReactElement {
  // Track all agents and their state from WebSocket events
  const { orchestrator, subagents } = useAgentTracking(sessionId);

  // Manage hover, click, and expand state
  const { setHoveredAgent, expandedAgentId, toggleExpanded } =
    useAgentInteractions();

  /**
   * Handle agent card click - toggle expand state and call callback
   */
  const handleAgentClick = useCallback(
    (agentId: string) => {
      toggleExpanded(agentId);
      onAgentClick?.(agentId);

      // Optional: play audio cue
      if (audioEnabled && typeof window !== 'undefined') {
        // Could emit sound effect here
      }
    },
    [toggleExpanded, onAgentClick, audioEnabled]
  );

  /**
   * Handle agent card hover
   */
  const handleAgentHover = useCallback(
    (agentId: string, isHovering: boolean) => {
      setHoveredAgent(isHovering ? agentId : null);
    },
    [setHoveredAgent]
  );

  // Empty state
  if (!orchestrator && subagents.length === 0) {
    return (
      <div
        className={`squad-panel placement-${placement} is-empty ${className}`.trim()}
        role="region"
        aria-label="Agent squad panel"
      />
    );
  }

  const placementClass = `placement-${placement}`;
  const containerClasses = `squad-panel ${placementClass} ${className}`.trim();

  return (
    <div
      className={containerClasses}
      role="region"
      aria-label="Agent squad panel"
    >
      {/* Use AgentRow for responsive layout */}
      {orchestrator && (
        <AgentRow
          orchestrator={orchestrator}
          subagents={subagents}
          expandedAgentId={expandedAgentId}
          onAgentHover={handleAgentHover}
          onAgentClick={handleAgentClick}
        />
      )}
    </div>
  );
}
