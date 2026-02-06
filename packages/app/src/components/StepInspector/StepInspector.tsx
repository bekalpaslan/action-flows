/**
 * StepInspector - Side panel for detailed step inspection
 * Shows step details, inputs, outputs, and learning information
 */

import { useEffect } from 'react';
import type { ChainStep } from '@afw/shared';
import './StepInspector.css';

interface StepInspectorProps {
  step: ChainStep | null;
  onClose?: () => void;
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

/**
 * Format timestamp to readable date/time
 */
function formatTimestamp(timestamp: string | undefined): string {
  if (!timestamp) return 'N/A';
  try {
    const date = new Date(timestamp);
    return date.toLocaleString();
  } catch {
    return timestamp;
  }
}

/**
 * Format JSON value for display
 */
function formatValue(value: unknown): string {
  if (value === null || value === undefined) {
    return 'N/A';
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }
  if (typeof value === 'number') {
    return value.toString();
  }
  return JSON.stringify(value, null, 2);
}

/**
 * Get status color for header
 */
function getStatusColor(status: string): string {
  switch (status) {
    case 'pending':
      return '#bdbdbd';
    case 'in_progress':
      return '#fbc02d';
    case 'completed':
      return '#4caf50';
    case 'failed':
      return '#f44336';
    case 'skipped':
      return '#9e9e9e';
    default:
      return '#ccc';
  }
}

export const StepInspector: React.FC<StepInspectorProps> = ({ step, onClose }) => {
  // Handle keyboard shortcuts
  useEffect(() => {
    if (!step) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // ESC to close
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [step, onClose]);

  if (!step) {
    return (
      <div className="step-inspector step-inspector-empty">
        <div className="inspector-placeholder">
          <p>Select a step to view details</p>
        </div>
      </div>
    );
  }

  const statusColor = getStatusColor(step.status);

  return (
    <div className="step-inspector">
      {/* Header with status color bar */}
      <div
        className="inspector-header"
        style={{ borderLeftColor: statusColor }}
      >
        <div className="inspector-header-content">
          <div className="inspector-title">
            <span className="inspector-step-number">Step #{step.stepNumber}</span>
            <h3>{step.action}</h3>
          </div>
          <button
            className="inspector-close-btn"
            onClick={onClose}
            aria-label="Close inspector"
            title="Close (ESC)"
          >
            ✕
          </button>
        </div>
        <div className="inspector-status-bar">
          <span
            className={`inspector-status-badge status-${step.status}`}
            style={{ backgroundColor: statusColor }}
          >
            {step.status}
          </span>
          {step.model && (
            <span className={`inspector-model-badge model-${step.model}`}>
              {step.model}
            </span>
          )}
        </div>
      </div>

      {/* Scrollable content */}
      <div className="inspector-content">
        {/* Details Section */}
        <section className="inspector-section">
          <h4 className="inspector-section-title">Details</h4>

          <div className="inspector-details-grid">
            <div className="detail-item">
              <label>Status</label>
              <div className={`status-badge status-${step.status}`}>
                {step.status}
              </div>
            </div>

            <div className="detail-item">
              <label>Model</label>
              <div className={`model-badge model-${step.model}`}>
                {step.model}
              </div>
            </div>

            {step.duration !== undefined && (
              <div className="detail-item">
                <label>Duration</label>
                <span className="duration-value">
                  {formatDuration(step.duration)}
                </span>
              </div>
            )}

            {step.startedAt && (
              <div className="detail-item">
                <label>Started</label>
                <span className="timestamp-value">
                  {formatTimestamp(step.startedAt)}
                </span>
              </div>
            )}

            {step.completedAt && (
              <div className="detail-item">
                <label>Completed</label>
                <span className="timestamp-value">
                  {formatTimestamp(step.completedAt)}
                </span>
              </div>
            )}

            {step.description && (
              <div className="detail-item full-width">
                <label>Description</label>
                <p className="description-text">{step.description}</p>
              </div>
            )}

            {step.waitsFor && step.waitsFor.length > 0 && (
              <div className="detail-item full-width">
                <label>Depends On</label>
                <div className="dependencies-list">
                  {step.waitsFor.map((dep, idx) => (
                    <span key={idx} className="dependency-badge">
                      Step #{dep}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Inputs Section */}
        {Object.keys(step.inputs).length > 0 && (
          <section className="inspector-section">
            <h4 className="inspector-section-title">Inputs</h4>
            <div className="inspector-key-value-list">
              {Object.entries(step.inputs).map(([key, value]) => (
                <div key={key} className="kv-item">
                  <div className="kv-key">{key}</div>
                  <div className="kv-value">
                    {typeof value === 'object' ? (
                      <pre>{JSON.stringify(value, null, 2)}</pre>
                    ) : (
                      <span>{formatValue(value)}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Output Section */}
        {(step.result !== undefined || step.error !== undefined) && (
          <section className="inspector-section">
            <h4 className="inspector-section-title">Output</h4>

            {step.result !== undefined && (
              <div className="output-block output-success">
                <h5>Result</h5>
                <div className="output-content">
                  {typeof step.result === 'object' ? (
                    <pre>{JSON.stringify(step.result, null, 2)}</pre>
                  ) : (
                    <p>{formatValue(step.result)}</p>
                  )}
                </div>
              </div>
            )}

            {step.error && (
              <div className="output-block output-error">
                <h5>Error</h5>
                <div className="output-content error-content">
                  <code>{step.error}</code>
                </div>
              </div>
            )}
          </section>
        )}

        {/* Learning Section */}
        {step.learning && (
          <section className="inspector-section">
            <h4 className="inspector-section-title">Learning</h4>
            <div className="learning-block">
              <p>{step.learning}</p>
            </div>
          </section>
        )}

        {/* Empty state for pending steps */}
        {step.status === 'pending' && (
          <section className="inspector-section">
            <div className="inspector-empty-message">
              <p>This step has not been executed yet.</p>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
