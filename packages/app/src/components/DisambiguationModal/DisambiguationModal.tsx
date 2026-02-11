import React, { useRef, useEffect, useCallback } from 'react';
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
  const modalRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  if (!isOpen) return null;

  // Setup focus management
  useEffect(() => {
    if (!isOpen) return;

    triggerRef.current = document.activeElement as HTMLElement;

    // Handle Escape key
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };

    // Focus trap
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusableElements = modalRef.current?.querySelectorAll(
        'button, [href], [tabindex]:not([tabindex="-1"])'
      );
      if (!focusableElements || focusableElements.length === 0) return;

      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };

    document.addEventListener('keydown', handleEscape);
    modalRef.current?.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleEscape);
      modalRef.current?.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onCancel]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) {
        onCancel();
        // Restore focus
        setTimeout(() => {
          triggerRef.current?.focus();
        }, 100);
      }
    },
    [onCancel]
  );

  const handleSelectOption = useCallback(
    (context: WorkbenchId) => {
      onSelect(context);
      // Restore focus
      setTimeout(() => {
        triggerRef.current?.focus();
      }, 100);
    },
    [onSelect]
  );

  return (
    <div
      className="disambiguation-modal-backdrop"
      onClick={handleBackdropClick}
      role="presentation"
    >
      <div
        ref={modalRef}
        className="disambiguation-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="disambiguation-modal-title"
      >
        <div className="disambiguation-modal-header">
          <h2 id="disambiguation-modal-title">Multiple contexts match your request</h2>
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
                  onClick={() => handleSelectOption(option.context)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSelectOption(option.context);
                    }
                  }}
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
