/**
 * CustomPromptDialog Component
 *
 * Modal dialog for creating custom prompt buttons with alias and prompt fields.
 * Follows StarBookmarkDialog pattern for consistency.
 * Includes keyboard navigation, focus trapping, and focus restoration.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import './CustomPromptDialog.css';

export interface CustomPromptDialogProps {
  onSubmit: (
    label: string,
    prompt: string,
    icon?: string,
    contextPatterns?: string[],
    alwaysShow?: boolean
  ) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

/**
 * Dialog for creating custom prompt buttons.
 * Two required fields: alias (label) and prompt (payload).
 * Optional fields: icon, context patterns, always show checkbox.
 */
export function CustomPromptDialog({
  onSubmit,
  onCancel,
  isLoading = false,
}: CustomPromptDialogProps) {
  const [label, setLabel] = useState('');
  const [prompt, setPrompt] = useState('');
  const [icon, setIcon] = useState('');
  const [contextPatterns, setContextPatterns] = useState('');
  const [alwaysShow, setAlwaysShow] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  // Setup focus management on mount/unmount
  useEffect(() => {
    triggerRef.current = document.activeElement as HTMLElement;

    // Focus trap
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusableElements = dialogRef.current?.querySelectorAll(
        'button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
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

    // Handle Escape key
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };

    dialogRef.current?.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      dialogRef.current?.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onCancel]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (label.trim() && prompt.trim()) {
        // Parse context patterns: split by newline, trim, filter empty
        const patterns = contextPatterns
          .split('\n')
          .map(p => p.trim())
          .filter(p => p.length > 0);

        onSubmit(
          label.trim(),
          prompt.trim(),
          icon.trim() || undefined,
          patterns.length > 0 ? patterns : undefined,
          alwaysShow
        );
        // Restore focus
        setTimeout(() => {
          triggerRef.current?.focus();
        }, 100);
      }
    },
    [label, prompt, icon, contextPatterns, alwaysShow, onSubmit]
  );

  const handleCancel = useCallback(() => {
    onCancel();
    // Restore focus
    setTimeout(() => {
      triggerRef.current?.focus();
    }, 100);
  }, [onCancel]);

  const isValid = label.trim().length > 0 && prompt.trim().length > 0;

  return (
    <div
      className="custom-prompt-dialog-backdrop"
      role="presentation"
    >
      <div
        ref={dialogRef}
        className="custom-prompt-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="custom-prompt-dialog-title"
      >
        <div className="custom-prompt-dialog-header">
          <h3 id="custom-prompt-dialog-title">Create Custom Prompt Button</h3>
          <button
            className="close-button"
            onClick={handleCancel}
            disabled={isLoading}
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>

        <div className="custom-prompt-dialog-body">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="label" className="form-label">
                Alias (required)
              </label>
              <input
                id="label"
                type="text"
                className="text-input"
                placeholder="e.g., Explain Code"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                disabled={isLoading}
                maxLength={100}
              />
              <div className="field-hint">
                This is the button label shown in the UI
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="prompt" className="form-label">
                Prompt (required)
              </label>
              <textarea
                id="prompt"
                className="textarea-input"
                placeholder="e.g., Please explain this code in detail, including what each function does..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={isLoading}
                rows={6}
                maxLength={2000}
              />
              <div className="field-hint">
                This text will be sent when the button is clicked ({prompt.length}/2000)
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="icon" className="form-label">
                Icon (optional)
              </label>
              <input
                id="icon"
                type="text"
                className="text-input"
                placeholder="e.g., 💬 or 🚀"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                disabled={isLoading}
                maxLength={10}
              />
              <div className="field-hint">
                Emoji or icon name (defaults to 💬 if empty)
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="contextPatterns" className="form-label">
                Context Patterns (optional)
              </label>
              <textarea
                id="contextPatterns"
                className="textarea-input context-patterns-input"
                placeholder="Enter regex patterns, one per line&#10;e.g. .*\.tsx$&#10;.*auth.*"
                value={contextPatterns}
                onChange={(e) => setContextPatterns(e.target.value)}
                disabled={isLoading}
                rows={4}
              />
              <div className="field-hint">
                File path patterns that determine when this button appears
              </div>
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={alwaysShow}
                  onChange={(e) => setAlwaysShow(e.target.checked)}
                  disabled={isLoading}
                />
                <span>Always show (ignore context detection)</span>
              </label>
            </div>

            <div className="custom-prompt-dialog-actions">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isLoading || !isValid}
              >
                {isLoading ? 'Creating...' : 'Create Button'}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleCancel}
                disabled={isLoading}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
