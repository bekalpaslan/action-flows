import React from 'react';
import type { ErrorInstance } from '@afw/shared';
import './ErrorModal.css';

interface ErrorModalProps {
  isOpen: boolean;
  error: ErrorInstance | null;
  onDismiss: (errorId: string) => void;
  onRetry: (errorId: string) => void;
  onSkip: (errorId: string) => void;
  onCancel: (errorId: string) => void;
}

export const ErrorModal: React.FC<ErrorModalProps> = ({
  isOpen,
  error,
  onDismiss,
  onRetry,
  onSkip,
  onCancel,
}) => {
  if (!isOpen || !error) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onDismiss(error.id);
    }
  };

  // Determine severity styling
  const severityClass = `error-modal--severity-${error.severity}`;

  // Filter available actions based on what's offered
  const hasRetry = error.recoveryOptions.includes('retry');
  const hasSkip = error.recoveryOptions.includes('skip');
  const hasCancel = error.recoveryOptions.includes('cancel');

  return (
    <div className="error-modal-backdrop" onClick={handleBackdropClick}>
      <div className={`error-modal ${severityClass}`}>
        {/* Header */}
        <div className="error-modal-header">
          <div className="error-modal-icon">
            {error.severity === 'critical' && '🚨'}
            {error.severity === 'high' && '⚠️'}
            {error.severity === 'medium' && '⚡'}
            {error.severity === 'low' && 'ℹ️'}
          </div>
          <div className="error-modal-title-section">
            <h2 className="error-modal-title">{error.title}</h2>
            <p className="error-modal-severity">{error.severity.toUpperCase()}</p>
          </div>
          <button
            className="error-modal-close"
            onClick={() => onDismiss(error.id)}
            aria-label="Close error"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="error-modal-body">
          {/* Message */}
          <div className="error-section">
            <h3 className="error-label">Message</h3>
            <p className="error-message">{error.message}</p>
          </div>

          {/* Context */}
          <div className="error-section">
            <h3 className="error-label">Context</h3>
            <p className="error-context">{error.context}</p>
          </div>

          {/* Step/Action info */}
          {(error.stepNumber || error.action) && (
            <div className="error-section">
              <h3 className="error-label">Execution Info</h3>
              <div className="error-details">
                {error.stepNumber && (
                  <div className="error-detail-item">
                    <span className="error-detail-key">Step:</span>
                    <span className="error-detail-value">{error.stepNumber}</span>
                  </div>
                )}
                {error.action && (
                  <div className="error-detail-item">
                    <span className="error-detail-key">Action:</span>
                    <span className="error-detail-value">{error.action}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Stack trace (if available) */}
          {error.stackTrace && (
            <div className="error-section">
              <h3 className="error-label">Technical Details</h3>
              <pre className="error-stacktrace">{error.stackTrace}</pre>
            </div>
          )}

          {/* Metadata (if available) */}
          {error.metadata && Object.keys(error.metadata).length > 0 && (
            <div className="error-section">
              <h3 className="error-label">Metadata</h3>
              <pre className="error-metadata">
                {JSON.stringify(error.metadata, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Footer with recovery actions */}
        <div className="error-modal-footer">
          {hasRetry && (
            <button
              className="btn-error-action btn-retry"
              onClick={() => onRetry(error.id)}
              title="Retry the failed step"
            >
              Retry
            </button>
          )}
          {hasSkip && (
            <button
              className="btn-error-action btn-skip"
              onClick={() => onSkip(error.id)}
              title="Skip the current step"
            >
              Skip
            </button>
          )}
          {hasCancel && (
            <button
              className="btn-error-action btn-cancel"
              onClick={() => onCancel(error.id)}
              title="Cancel the entire chain"
            >
              Cancel
            </button>
          )}
          {!hasRetry && !hasSkip && !hasCancel && (
            <button
              className="btn-error-action btn-acknowledge"
              onClick={() => onDismiss(error.id)}
              title="Acknowledge this error"
            >
              Acknowledge
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
