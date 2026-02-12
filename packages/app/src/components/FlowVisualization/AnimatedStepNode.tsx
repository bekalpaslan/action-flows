/**
 * AnimatedStepNode - Custom ReactFlow node with animations
 * Compact card design with status-based animations
 */

import type { ChainStep } from '@afw/shared';
import { Handle, Position, type NodeProps } from 'reactflow';
import type { FlowNodeData } from '@afw/shared';
import './AnimatedStepNode.css';

export interface AnimatedStepNodeData extends FlowNodeData {
  step: ChainStep;
  onInspect?: (stepNumber: number) => void;
}

interface AnimatedStepNodeProps extends NodeProps {
  data: AnimatedStepNodeData;
}

export const AnimatedStepNode: React.FC<AnimatedStepNodeProps> = ({ data }) => {
  const { step, onInspect, animationState } = data;

  const handleClick = () => {
    const stepNum = typeof step.stepNumber === 'number' ? step.stepNumber : Number(step.stepNumber);
    if (!isNaN(stepNum)) {
      onInspect?.(stepNum);
    }
  };

  // Determine animation class
  const animationClass = animationState ? `anim-${animationState}` : '';

  // Determine status class
  const statusClass = `status-${step.status}`;

  // Determine status label for accessibility
  const statusLabel = {
    'completed': 'Completed',
    'failed': 'Failed',
    'in_progress': 'In Progress',
    'skipped': 'Skipped',
    'pending': 'Pending'
  }[step.status] || step.status;

  return (
    <div
      className={`animated-step-node ${statusClass} ${animationClass}`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleClick();
        }
      }}
      title={step.description || step.action}
      aria-label={`Step ${step.stepNumber}: ${step.action} - ${statusLabel}`}
    >
      {/* Input handle */}
      {step.waitsFor.length > 0 && (
        <Handle type="target" position={Position.Top} />
      )}

      {/* Node content */}
      <div className="node-content">
        <div className="node-header">
          <span className="step-number">#{step.stepNumber}</span>
          <StatusIcon status={step.status} />
        </div>

        <div className="node-action">
          {step.action}
        </div>

        {step.model && (
          <div className="node-model">
            <span className={`model-badge model-${step.model}`}>
              {step.model}
            </span>
          </div>
        )}

        {step.status === 'completed' && step.duration && (
          <div className="node-duration">
            {formatDuration(step.duration)}
          </div>
        )}

        {step.status === 'failed' && (
          <div className="node-error" title={step.error}>
            Error
          </div>
        )}

        {step.status === 'in_progress' && (
          <div className="node-spinner">
            <div className="spinner"></div>
          </div>
        )}
      </div>

      {/* Output handle */}
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};

/**
 * Status icon component
 */
function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'completed':
      return <span className="status-icon completed">✓</span>;
    case 'failed':
      return <span className="status-icon failed">✗</span>;
    case 'in_progress':
      return <span className="status-icon running">⟳</span>;
    case 'skipped':
      return <span className="status-icon skipped">⊘</span>;
    default:
      return <span className="status-icon pending">○</span>;
  }
}

/**
 * Format duration in milliseconds to human-readable string
 */
function formatDuration(durationMs: number): string {
  if (durationMs < 1000) {
    return `${Math.round(durationMs)}ms`;
  }
  if (durationMs < 60000) {
    return `${(durationMs / 1000).toFixed(1)}s`;
  }
  const minutes = Math.floor(durationMs / 60000);
  const seconds = Math.round((durationMs % 60000) / 1000);
  return `${minutes}m ${seconds}s`;
}
