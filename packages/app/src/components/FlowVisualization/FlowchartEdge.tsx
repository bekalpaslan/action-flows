import React, { useMemo } from 'react';
import { BaseEdge, EdgeProps, getSmoothStepPath } from 'reactflow';
import './FlowchartEdge.css';

interface FlowchartEdgeData {
  variant?: 'default' | 'conditional' | 'error';
  label?: string;
  active?: boolean;
}

type FlowchartEdgeProps = EdgeProps<FlowchartEdgeData>;

export const FlowchartEdge: React.FC<FlowchartEdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data = {},
  markerEnd,
  style = {},
}) => {
  const { variant = 'default', label, active = false } = data;

  // Compute the smooth step path
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 8,
  });

  // Determine stroke properties
  const strokeDasharray = variant === 'conditional' ? '6 4' : undefined;
  const strokeColor = active ? 'var(--system-yellow)' : variant === 'error' ? 'var(--system-red)' : variant === 'conditional' ? 'var(--system-blue)' : 'var(--text-tertiary)';

  // Calculate particle positions for animation (if active)
  const particles = useMemo(() => {
    if (!active) return null;

    // Parse the path to get total length approximation
    // For smooth step paths, we'll place particles at 1/3 and 2/3 positions
    // This is a simplified approach - for precise animation, we'd use path.getTotalLength()

    // Calculate approximate positions along the path
    const midX = (sourceX + targetX) / 2;
    const midY = (sourceY + targetY) / 2;

    const particle1X = (sourceX + midX) / 2;
    const particle1Y = (sourceY + midY) / 2;

    const particle2X = (midX + targetX) / 2;
    const particle2Y = (midY + targetY) / 2;

    return [
      { cx: particle1X, cy: particle1Y, key: `${id}-particle-1` },
      { cx: particle2X, cy: particle2Y, key: `${id}-particle-2` },
    ];
  }, [active, id, sourceX, sourceY, targetX, targetY]);

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          strokeDasharray,
          stroke: strokeColor,
          strokeWidth: active ? 2.5 : 2,
        }}
      />

      {/* Animated particles for active edges */}
      {particles && (
        <g className="afw-flowchart-edge__particles">
          {particles.map((particle) => (
            <circle
              key={particle.key}
              cx={particle.cx}
              cy={particle.cy}
              r={3}
              className="afw-flowchart-edge__particle"
            >
              <animate
                attributeName="opacity"
                values="0;1;1;0"
                dur="2s"
                repeatCount="indefinite"
              />
              <animateMotion
                dur="2s"
                repeatCount="indefinite"
                path={edgePath}
              />
            </circle>
          ))}
        </g>
      )}

      {/* Edge label */}
      {label && (
        <foreignObject
          x={labelX - 50}
          y={labelY - 12}
          width={100}
          height={24}
          className="afw-flowchart-edge__label-wrapper"
          requiredExtensions="http://www.w3.org/1999/xhtml"
        >
          <div className="afw-flowchart-edge__label">{label}</div>
        </foreignObject>
      )}
    </>
  );
};

// Export for ReactFlow edge types registry
export default FlowchartEdge;
