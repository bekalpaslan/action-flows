/**
 * AgentRow Component
 * Layout component for responsive agent arrangement
 *
 * Features:
 * - Full layout (≥1200px): orchestrator center, subagents flanking left/right
 * - Compact layout (768-1199px): orchestrator center, subagents in 2 columns below
 * - Icon grid (< 768px): all agents same size in 3-column grid
 */

import React from 'react';
import type { AgentRowProps } from './types';
import { AgentCharacterCard } from './AgentCharacterCard';
import { AgentLogPanel } from './AgentLogPanel';
import './AgentRow.css';
import './animations.css';

/**
 * AgentRow - Responsive layout container for agents
 * Handles orchestrator + subagent positioning across breakpoints
 */
export function AgentRow({
  orchestrator,
  subagents,
  expandedAgentId,
  onAgentHover,
  onAgentClick,
}: AgentRowProps): React.ReactElement {
  // Split subagents into left and right arrays
  const leftAgents = subagents.filter((_, index) => index % 2 === 0);
  const rightAgents = subagents.filter((_, index) => index % 2 === 1);

  return (
    <div className="agent-row">
      {/* LEFT SIDE: Subagents */}
      {leftAgents.length > 0 && (
        <div className="agent-row-side side-left">
          {leftAgents.map((agent) => (
            <div key={agent.id} className="agent-row-slot">
              <AgentCharacterCard
                agent={agent}
                size="subagent"
                isExpanded={expandedAgentId === agent.id}
                onHover={(isHovering) => {
                  onAgentHover(agent.id, isHovering);
                }}
                onClick={() => {
                  onAgentClick(agent.id);
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
      <div className="agent-row-orchestrator">
        <AgentCharacterCard
          agent={orchestrator}
          size="orchestrator"
          isExpanded={expandedAgentId === orchestrator.id}
          onHover={(isHovering) => {
            onAgentHover(orchestrator.id, isHovering);
          }}
          onClick={() => {
            onAgentClick(orchestrator.id);
          }}
        />

        {/* Orchestrator log panel */}
        <AgentLogPanel
          agent={orchestrator}
          isExpanded={expandedAgentId === orchestrator.id}
          maxHeight={400}
        />
      </div>

      {/* RIGHT SIDE: Subagents */}
      {rightAgents.length > 0 && (
        <div className="agent-row-side side-right">
          {rightAgents.map((agent) => (
            <div key={agent.id} className="agent-row-slot">
              <AgentCharacterCard
                agent={agent}
                size="subagent"
                isExpanded={expandedAgentId === agent.id}
                onHover={(isHovering) => {
                  onAgentHover(agent.id, isHovering);
                }}
                onClick={() => {
                  onAgentClick(agent.id);
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
  );
}
