/**
 * HybridFlowViz Component
 * Combines FlowVisualization DAG with SquadPanel agents overlay
 *
 * This component integrates:
 * - ReactFlow DAG visualization showing chain execution flow
 * - SquadPanel overlay with anime-style agent avatars
 * - Agents positioned to float over the visualization
 *
 * Layout:
 * - Full container: ReactFlow visualization
 * - Overlay: SquadPanel with placement="overlay" at bottom-right
 * - Dark theme compatible with smooth transitions
 */

import React, { useMemo } from 'react';
import { ReactFlowProvider } from 'reactflow';
import type { SessionId, ChainId, Chain } from '@afw/shared';
import { FlowVisualization } from '../FlowVisualization/FlowVisualization';
import { SquadPanel } from '../SquadPanel';
import './HybridFlowViz.css';

export interface HybridFlowVizProps {
  /** Session ID to display */
  sessionId: SessionId;

  /** Chain to visualize (required for FlowVisualization) */
  chain: Chain;

  /** Specific chain ID (optional, for tracking) */
  chainId?: ChainId;

  /** Callback when a node is clicked */
  onNodeClick?: (nodeId: string) => void;

  /** Callback when an agent is clicked */
  onAgentClick?: (agentId: string) => void;

  /** Show agents overlay (default: true) */
  showAgents?: boolean;

  /** Enable flow animations (default: true) */
  enableAnimations?: boolean;

  /** Overlay position for SquadPanel */
  overlayPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

  /** Overlay opacity (0-1, default: 0.9) */
  overlayOpacity?: number;
}

/**
 * HybridFlowViz - Main component
 *
 * Renders a ReactFlow DAG with SquadPanel agents floating on top.
 * Wraps FlowVisualization with ReactFlowProvider and adds SquadPanel overlay.
 */
export const HybridFlowViz: React.FC<HybridFlowVizProps> = ({
  sessionId,
  chain,
  chainId: _chainId, // Reserved for future use (e.g., chain-specific tracking)
  onNodeClick,
  onAgentClick,
  showAgents = true,
  enableAnimations = true,
  overlayPosition = 'bottom-right',
  overlayOpacity = 0.9,
}) => {
  /**
   * Handle step click from FlowVisualization
   * Convert stepNumber to nodeId format expected by onNodeClick
   */
  const handleStepClick = useMemo(
    () =>
      onNodeClick
        ? (stepNumber: number) => {
            onNodeClick(`step-${stepNumber}`);
          }
        : undefined,
    [onNodeClick]
  );

  return (
    <div className="hybrid-flow-viz">
      {/* ReactFlow DAG Visualization */}
      <div className="hybrid-flow-viz__flow-container">
        <ReactFlowProvider>
          <FlowVisualization
            chain={chain}
            onStepClick={handleStepClick}
            enableAnimations={enableAnimations}
          />
        </ReactFlowProvider>
      </div>

      {/* SquadPanel Overlay */}
      {showAgents && (
        <div className="hybrid-flow-viz__squad-overlay">
          <SquadPanel
            sessionId={sessionId}
            placement="overlay"
            overlayPosition={overlayPosition}
            overlayOpacity={overlayOpacity}
            onAgentClick={onAgentClick}
            audioEnabled={false}
          />
        </div>
      )}
    </div>
  );
};
