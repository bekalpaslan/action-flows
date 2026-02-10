/**
 * RightVisualizationArea Component
 *
 * Container for HybridFlowViz, isolating visualization from left panel concerns.
 * Renders flow visualization at full width/height with empty state when no chains exist.
 */

import React from 'react';
import type { Session } from '@afw/shared';
import { HybridFlowViz } from '../SessionTile/HybridFlowViz';
import { useActiveChain } from '../../hooks/useActiveChain';
import './RightVisualizationArea.css';

export interface RightVisualizationAreaProps {
  /** Session to display */
  session: Session;

  /** Callback when a node is clicked */
  onNodeClick?: (nodeId: string) => void;

  /** Callback when an agent is clicked */
  onAgentClick?: (agentId: string) => void;

  /** Show agents overlay */
  showAgents?: boolean;
}

/**
 * RightVisualizationArea - Main component
 */
export const RightVisualizationArea: React.FC<RightVisualizationAreaProps> = ({
  session,
  onNodeClick,
  onAgentClick,
  showAgents = true,
}) => {
  // Fetch chains from backend using the new hook
  const { activeChain, loading, error } = useActiveChain(session.id);

  return (
    <div className="right-visualization-area">
      {loading ? (
        <div className="right-visualization-area__empty-state">
          <div className="empty-state__icon">⏳</div>
          <div className="empty-state__title">Loading Chain...</div>
          <div className="empty-state__message">
            Fetching flow visualization data from backend.
          </div>
        </div>
      ) : error ? (
        <div className="right-visualization-area__empty-state">
          <div className="empty-state__icon">⚠️</div>
          <div className="empty-state__title">Error Loading Chain</div>
          <div className="empty-state__message">
            {error}
          </div>
        </div>
      ) : activeChain ? (
        <HybridFlowViz
          sessionId={session.id}
          chain={activeChain}
          chainId={activeChain.id}
          onNodeClick={onNodeClick}
          onAgentClick={onAgentClick}
          showAgents={showAgents}
          enableAnimations={true}
        />
      ) : (
        <div className="right-visualization-area__empty-state">
          <div className="empty-state__icon">📊</div>
          <div className="empty-state__title">No Active Chain</div>
          <div className="empty-state__message">
            Flow visualization will appear here once a chain is compiled.
          </div>
        </div>
      )}
    </div>
  );
};
