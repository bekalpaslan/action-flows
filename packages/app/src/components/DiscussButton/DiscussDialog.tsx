/**
 * DiscussDialog Component
 *
 * Modal dialog for discussing a specific UI component.
 * Includes:
 * - Pre-filled message textarea
 * - Collapsible context details section (native <details>/<summary>)
 * - Send to Chat / Cancel actions
 * - Escape key to close, backdrop click to close
 * - Focus trap and ARIA attributes
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import './DiscussDialog.css';

export interface DiscussDialogProps {
  /** Whether the dialog is open */
  isOpen: boolean;
  /** Name of the component being discussed */
  componentName: string;
  /** Optional context data for the component */
  componentContext?: Record<string, unknown>;
  /** Callback when user sends the message */
  onSend: (message: string) => void;
  /** Callback when dialog is closed */
  onClose: () => void;
  /** Whether the send operation is in progress */
  isSending?: boolean;
}

/**
 * DiscussDialog - Modal for discussing a component
 */
export function DiscussDialog({
  isOpen,
  componentName,
  componentContext,
  onSend,
  onClose,
  isSending = false,
}: DiscussDialogProps): React.ReactElement | null {
  const [message, setMessage] = useState('');
  const dialogRef = useRef<HTMLDivElement>(null);
  const messageTextareaRef = useRef<HTMLTextAreaElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  // Initialize message when dialog opens
  useEffect(() => {
    if (isOpen) {
      setMessage(`I want to discuss this ${componentName} element`);
      // Save the element that triggered the dialog for focus restoration
      triggerRef.current = document.activeElement as HTMLElement;
      // Focus the textarea after render
      setTimeout(() => {
        messageTextareaRef.current?.focus();
      }, 100);
    }
  }, [isOpen, componentName]);

  // Handle Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent body scroll when dialog is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Focus trap - keep focus within dialog when open
  useEffect(() => {
    if (!isOpen || !dialogRef.current) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusableElements = dialogRef.current?.querySelectorAll(
        'button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])'
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

    dialogRef.current.addEventListener('keydown', handleKeyDown);
    return () => dialogRef.current?.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onClose();
        // Restore focus to trigger element
        setTimeout(() => {
          triggerRef.current?.focus();
        }, 100);
      }
    },
    [onClose]
  );

  const handleCloseClick = useCallback(() => {
    onClose();
    // Restore focus to trigger element
    setTimeout(() => {
      triggerRef.current?.focus();
    }, 100);
  }, [onClose]);

  const handleSend = useCallback(() => {
    if (message.trim() && !isSending) {
      onSend(message.trim());
      onClose();
      // Restore focus to trigger element
      setTimeout(() => {
        triggerRef.current?.focus();
      }, 100);
    }
  }, [message, isSending, onSend, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="discuss-dialog__backdrop"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="discuss-dialog-title"
    >
      <div className="discuss-dialog" ref={dialogRef}>
        {/* Header */}
        <div className="discuss-dialog__header">
          <h3 id="discuss-dialog-title">Discuss {componentName}</h3>
          <button
            className="discuss-dialog__close-btn"
            onClick={handleCloseClick}
            disabled={isSending}
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="discuss-dialog__body">
          {/* Message textarea */}
          <label htmlFor="discuss-message" className="discuss-dialog__label">
            Message
          </label>
          <textarea
            id="discuss-message"
            ref={messageTextareaRef}
            className="discuss-dialog__message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={isSending}
            rows={4}
            placeholder={`I want to discuss this ${componentName} element`}
          />

          {/* Context section (collapsible via native details/summary) */}
          {componentContext && Object.keys(componentContext).length > 0 && (
            <details className="discuss-dialog__context">
              <summary className="discuss-dialog__context-summary">
                Component Context
              </summary>
              <pre className="discuss-dialog__context-content">
                {JSON.stringify(componentContext, null, 2)}
              </pre>
            </details>
          )}
        </div>

        {/* Actions */}
        <div className="discuss-dialog__actions">
          <button
            className="discuss-dialog__btn discuss-dialog__btn--primary"
            onClick={handleSend}
            disabled={!message.trim() || isSending}
          >
            {isSending ? 'Sending...' : 'Send to Chat'}
          </button>
          <button
            className="discuss-dialog__btn discuss-dialog__btn--secondary"
            onClick={onClose}
            disabled={isSending}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
