/**
 * StepNode - Custom node renderer for React Flow
 * Displays a single step in the DAG with status indicators
 */

import type { ChainStep } from '@afw/shared';
import { Handle, Position, type NodeProps } from 'reactflow';
import './ChainDAG.css';

export interface StepNodeData {
  step: ChainStep;
  isSelected: boolean;
  onSelect: (stepNumber: number) => void;
  parallelGroupSize: number;
}

interface StepNodeProps extends NodeProps {
  data: StepNodeData;
}

export const StepNode: React.FC<StepNodeProps> = ({ data }) => {
  const { step, isSelected, onSelect, parallelGroupSize } = data;

  const statusClass = `status-${step.status}`;

  // Apply fade-in animation on status change
  const fadeInClass =
    step.status === 'in_progress' || step.status === 'completed'
      ? 'fade-in'
      : '';

  const handleClick = () => {
    onSelect(Number(step.stepNumber));
  };

  return (
    <div
      className={`step-node ${statusClass} ${isSelected ? 'selected' : ''} ${
        parallelGroupSize > 1 ? 'parallel' : ''
      } ${fadeInClass}`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleClick();
        }
      }}
    >
      {/* Input handles for dependencies */}
      {step.waitsFor.length > 0 && (
        <Handle type="target" position={Position.Top} />
      )}

      {/* Node content */}
      <div className="step-node-content">
        <div className="step-node-header">
          <span className="step-number">#{step.stepNumber}</span>
          {parallelGroupSize > 1 && (
            <span className="parallel-indicator" title={`Part of ${parallelGroupSize} parallel steps`}>
              ∥
            </span>
          )}
        </div>

        <div className="step-node-action">{step.action}</div>

        <div className="step-node-model">
          <span className={`model-badge model-${step.model}`}>{step.model}</span>
        </div>

        {step.status === 'completed' && step.duration && (
          <div className="step-node-duration">
            {formatDuration(step.duration)}
          </div>
        )}

        {step.status === 'failed' && step.error && (
          <div className="step-node-error" title={step.error}>
            Error
          </div>
        )}

        {step.status === 'in_progress' && (
          <div className="step-node-spinner">
            <div className="spinner"></div>
          </div>
        )}
      </div>

      {/* Output handles for dependent steps */}
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};

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
