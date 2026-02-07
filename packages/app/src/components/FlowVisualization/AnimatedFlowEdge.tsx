/**
 * AnimatedFlowEdge - Custom ReactFlow edge with data flow visualization
 * Shows traveling particles and data labels
 */

import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath, type EdgeProps } from 'reactflow';
import type { FlowEdgeData } from '@afw/shared';
import './AnimatedFlowEdge.css';

export interface AnimatedFlowEdgeData extends FlowEdgeData {
  dataLabel?: string;
  active?: boolean;
}

export const AnimatedFlowEdge: React.FC<EdgeProps<AnimatedFlowEdgeData>> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data,
  markerEnd,
}) => {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const isActive = data?.active ?? false;
  const dataLabel = data?.dataLabel;

  return (
    <>
      {/* Main edge path */}
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          strokeWidth: 2,
          stroke: isActive ? '#fbc02d' : '#bdbdbd',
          strokeDasharray: isActive ? undefined : '5, 5',
        }}
      />

      {/* Traveling dots for active edges */}
      {isActive && (
        <>
          <circle
            r="3"
            fill="#fbc02d"
            className="edge-particle particle-1"
          >
            <animateMotion
              dur="2s"
              repeatCount="indefinite"
              path={edgePath}
            />
          </circle>
          <circle
            r="3"
            fill="#fbc02d"
            className="edge-particle particle-2"
          >
            <animateMotion
              dur="2s"
              repeatCount="indefinite"
              path={edgePath}
              begin="0.5s"
            />
          </circle>
        </>
      )}

      {/* Data label */}
      {dataLabel && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: 'all',
            }}
            className="edge-label"
          >
            <div className={`edge-label-content ${isActive ? 'active' : ''}`}>
              {dataLabel}
            </div>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};
