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

import React, { useCallback, useMemo } from 'react';
import { useAgentTracking } from './useAgentTracking';
import { useAgentInteractions } from './useAgentInteractions';
import { AgentCharacterCard } from './AgentCharacterCard';
import { AgentLogPanel } from './AgentLogPanel';
import type { SquadPanelProps } from './types';
import './SquadPanel.css';

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
    (agentId: string | null) => {
      setHoveredAgent(agentId);
    },
    [setHoveredAgent]
  );

  /**
   * Distribute subagents evenly between left and right sides
   * If odd number, right side gets the extra agent
   */
  const { leftAgents, rightAgents } = useMemo(() => {
    const leftArr: typeof subagents = [];
    const rightArr: typeof subagents = [];

    subagents.forEach((agent, index) => {
      if (index % 2 === 0) {
        leftArr.push(agent);
      } else {
        rightArr.push(agent);
      }
    });

    return { leftAgents: leftArr, rightAgents: rightArr };
  }, [subagents]);

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
      {/* Main agents container */}
      <div className="squad-panel-agents-wrapper">
        {/* LEFT SIDE: Subagents */}
        {(placement === 'left' || placement === 'bottom') && leftAgents.length > 0 && (
          <div className="squad-panel-side side-left">
            {leftAgents.map((agent) => (
              <div key={agent.id} className="squad-panel-agent-slot">
                <AgentCharacterCard
                  agent={agent}
                  size="subagent"
                  isExpanded={expandedAgentId === agent.id}
                  onHover={(isHovering) => {
                    handleAgentHover(isHovering ? agent.id : null);
                  }}
                  onClick={() => {
                    handleAgentClick(agent.id);
                  }}
                />

                {/* Log panel appears inline below the card */}
                <AgentLogPanel
                  agent={agent}
                  isExpanded={expandedAgentId === agent.id}
                  maxHeight={320}
                />
              </div>
            ))}
          </div>
        )}

        {/* CENTER: Orchestrator */}
        {orchestrator && (
          <div className="squad-panel-orchestrator">
            <AgentCharacterCard
              agent={orchestrator}
              size="orchestrator"
              isExpanded={expandedAgentId === orchestrator.id}
              onHover={(isHovering) => {
                handleAgentHover(isHovering ? orchestrator.id : null);
              }}
              onClick={() => {
                handleAgentClick(orchestrator.id);
              }}
            />

            {/* Orchestrator log panel */}
            <AgentLogPanel
              agent={orchestrator}
              isExpanded={expandedAgentId === orchestrator.id}
              maxHeight={400}
            />
          </div>
        )}

        {/* RIGHT SIDE: Subagents */}
        {(placement === 'right' || placement === 'bottom') && rightAgents.length > 0 && (
          <div className="squad-panel-side side-right">
            {rightAgents.map((agent) => (
              <div key={agent.id} className="squad-panel-agent-slot">
                <AgentCharacterCard
                  agent={agent}
                  size="subagent"
                  isExpanded={expandedAgentId === agent.id}
                  onHover={(isHovering) => {
                    handleAgentHover(isHovering ? agent.id : null);
                  }}
                  onClick={() => {
                    handleAgentClick(agent.id);
                  }}
                />

                {/* Log panel appears inline below the card */}
                <AgentLogPanel
                  agent={agent}
                  isExpanded={expandedAgentId === agent.id}
                  maxHeight={320}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
