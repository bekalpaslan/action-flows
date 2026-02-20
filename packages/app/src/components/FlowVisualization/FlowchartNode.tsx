import React, { useCallback, KeyboardEvent } from 'react';
import { Handle, Position } from 'reactflow';
import './FlowchartNode.css';

export type FlowchartShape = 'start-end' | 'decision' | 'process' | 'input' | 'data' | 'group';

interface FlowchartNodeData {
  label: string;
  shape: FlowchartShape;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped';
  stepNumber: number;
  model?: string;
  duration?: string;
  error?: string;
  isParallel?: boolean;
  onSelect?: (stepNumber: number) => void;
}

interface FlowchartNodeProps {
  data: FlowchartNodeData;
  selected: boolean;
}

const MODEL_DISPLAY_NAMES: Record<string, string> = {
  'claude-opus-4': 'Opus',
  'claude-sonnet-4': 'Sonnet',
  'claude-haiku-4': 'Haiku',
};

const STATUS_ICONS: Record<FlowchartNodeData['status'], string> = {
  pending: '○',
  in_progress: '◐',
  completed: '✓',
  failed: '✕',
  skipped: '⊘',
};

const STATUS_LABELS: Record<FlowchartNodeData['status'], string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
  failed: 'Failed',
  skipped: 'Skipped',
};

export const FlowchartNode: React.FC<FlowchartNodeProps> = ({ data, selected }) => {
  const {
    label,
    shape,
    status,
    stepNumber,
    model,
    duration,
    error,
    isParallel,
    onSelect,
  } = data;

  const handleClick = useCallback(() => {
    if (onSelect) {
      onSelect(stepNumber);
    }
  }, [onSelect, stepNumber]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleClick();
      }
    },
    [handleClick]
  );

  const getModelDisplayName = (modelId?: string): string => {
    if (!modelId) return '';

    // Match model ID against known patterns
    for (const [key, displayName] of Object.entries(MODEL_DISPLAY_NAMES)) {
      if (modelId.includes(key)) {
        return displayName;
      }
    }

    return modelId;
  };

  const getModelClass = (modelId?: string): string => {
    if (!modelId) return '';

    if (modelId.includes('haiku')) return 'afw-flowchart-node__model--haiku';
    if (modelId.includes('sonnet')) return 'afw-flowchart-node__model--sonnet';
    if (modelId.includes('opus')) return 'afw-flowchart-node__model--opus';

    return '';
  };

  const nodeClasses = [
    'afw-flowchart-node',
    `afw-flowchart-node--${shape}`,
    `afw-flowchart-node--${status}`,
    selected && 'afw-flowchart-node--selected',
    isParallel && 'afw-flowchart-node--parallel',
  ]
    .filter(Boolean)
    .join(' ');

  const modelDisplayName = getModelDisplayName(model);
  const modelClass = getModelClass(model);

  const ariaLabel = `Step ${stepNumber}: ${label}, ${STATUS_LABELS[status]}${
    model ? `, using ${modelDisplayName}` : ''
  }${duration ? `, took ${duration}` : ''}${error ? `, error: ${error}` : ''}`;

  return (
    <div
      className={nodeClasses}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={ariaLabel}
    >
      {/* Connection handles - all shapes have top input and bottom output */}
      <Handle
        type="target"
        position={Position.Top}
        className="afw-flowchart-node__handle afw-flowchart-node__handle--target"
      />

      {/* Step number badge */}
      <div className="afw-flowchart-node__badge">{stepNumber}</div>

      {/* Status icon */}
      <div className="afw-flowchart-node__status-icon" aria-hidden="true">
        {status === 'in_progress' ? (
          <div className="afw-flowchart-node__spinner" />
        ) : (
          STATUS_ICONS[status]
        )}
      </div>

      {/* Main content */}
      <div className="afw-flowchart-node__content">
        <div className="afw-flowchart-node__label">{label}</div>

        {model && (
          <div className={`afw-flowchart-node__model ${modelClass}`}>
            {modelDisplayName}
          </div>
        )}

        {duration && status === 'completed' && (
          <div className="afw-flowchart-node__duration">{duration}</div>
        )}

        {error && status === 'failed' && (
          <div className="afw-flowchart-node__error" title={error}>
            {error.length > 40 ? `${error.substring(0, 40)}...` : error}
          </div>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="afw-flowchart-node__handle afw-flowchart-node__handle--source"
      />
    </div>
  );
};

// Export for ReactFlow node types registry
export default FlowchartNode;
