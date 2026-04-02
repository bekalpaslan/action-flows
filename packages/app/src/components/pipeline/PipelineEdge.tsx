import { BaseEdge, getSmoothStepPath, type EdgeProps } from '@xyflow/react';
import './pipeline.css';

type EdgeStatus = 'default' | 'active' | 'completed' | 'failed';

const EDGE_STYLES: Record<EdgeStatus, React.CSSProperties> = {
  default: {
    stroke: 'var(--color-border-strong)',
    strokeWidth: 2,
  },
  active: {
    stroke: 'var(--color-accent)',
    strokeWidth: 2,
  },
  completed: {
    stroke: 'var(--color-success)',
    strokeWidth: 2,
    opacity: 0.5,
  },
  failed: {
    stroke: 'var(--color-destructive)',
    strokeWidth: 2,
    opacity: 0.5,
  },
};

/**
 * Custom pipeline edge with animated dash for active paths.
 * Uses getSmoothStepPath for clean right-angle routing.
 * Defined at module level per RESEARCH.md Pitfall 1.
 */
export function PipelineEdge(props: EdgeProps) {
  const {
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    data,
    markerEnd,
  } = props;

  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  const status = (data?.status as EdgeStatus | undefined) ?? 'default';
  const computedStyle = EDGE_STYLES[status] ?? EDGE_STYLES.default;
  const edgeClassName = status === 'active' ? 'animate-pipeline-edge-flow' : undefined;

  return (
    <BaseEdge
      path={edgePath}
      style={computedStyle}
      className={edgeClassName}
      markerEnd={markerEnd}
    />
  );
}
