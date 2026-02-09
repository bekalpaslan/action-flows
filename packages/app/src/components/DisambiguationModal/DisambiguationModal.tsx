import React from 'react';
import { DisambiguationRequest, WorkbenchId, DEFAULT_WORKBENCH_CONFIGS } from '@afw/shared';
import './DisambiguationModal.css';

interface DisambiguationModalProps {
  isOpen: boolean;
  request: DisambiguationRequest;
  onSelect: (context: WorkbenchId) => void;
  onCancel: () => void;
}

export const DisambiguationModal: React.FC<DisambiguationModalProps> = ({
  isOpen,
  request,
  onSelect,
  onCancel,
}) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  return (
    <div className="disambiguation-modal-backdrop" onClick={handleBackdropClick}>
      <div className="disambiguation-modal">
        <div className="disambiguation-modal-header">
          <h2>Multiple contexts match your request</h2>
        </div>

        <div className="disambiguation-modal-body">
          <div className="disambiguation-request">
            <p className="request-label">Your request:</p>
            <p className="request-text">{request.originalRequest}</p>
          </div>

          <p className="disambiguation-instructions">
            Select the context that best matches your intent:
          </p>

          <div className="context-options">
            {request.possibleContexts.map((option) => {
              const config = DEFAULT_WORKBENCH_CONFIGS[option.context];
              const confidencePercent = Math.round(option.score * 100);

              return (
                <button
                  key={option.context}
                  className="context-option"
                  onClick={() => onSelect(option.context)}
                >
                  <div className="context-icon">{config.icon}</div>
                  <div className="context-details">
                    <div className="context-header">
                      <span className="context-name">{config.label}</span>
                      <span className="context-confidence">{confidencePercent}%</span>
                    </div>
                    <p className="context-purpose">
                      {option.purpose || config.tooltip || ''}
                    </p>
                    <div className="confidence-bar-container">
                      <div
                        className="confidence-bar"
                        style={{ width: `${confidencePercent}%` }}
                      />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="disambiguation-modal-footer">
          <button className="btn-cancel" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
