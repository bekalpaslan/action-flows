/**
 * DossierCreationDialog Component
 *
 * Modal dialog for creating Intel Dossiers with name, targets, and context.
 * Follows CustomPromptDialog pattern for consistency.
 */

import { useState, useCallback } from 'react';
import './DossierCreationDialog.css';

export interface DossierCreationDialogProps {
  onSubmit: (name: string, targets: string[], context: string) => void;
  onClose: () => void;
  isLoading?: boolean;
}

/**
 * Dialog for creating Intel Dossiers.
 * Three fields: name (required), targets (multi-input list, at least one required), context (optional).
 */
export function DossierCreationDialog({
  onSubmit,
  onClose,
  isLoading = false,
}: DossierCreationDialogProps) {
  const [name, setName] = useState('');
  const [targets, setTargets] = useState<string[]>(['']);
  const [context, setContext] = useState('');

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmedName = name.trim();
      const trimmedTargets = targets
        .map((t) => t.trim())
        .filter((t) => t.length > 0);
      const trimmedContext = context.trim();

      if (trimmedName && trimmedTargets.length > 0) {
        onSubmit(trimmedName, trimmedTargets, trimmedContext);
      }
    },
    [name, targets, context, onSubmit]
  );

  const handleAddTarget = useCallback(() => {
    setTargets((prev) => [...prev, '']);
  }, []);

  const handleRemoveTarget = useCallback((index: number) => {
    setTargets((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleTargetChange = useCallback((index: number, value: string) => {
    setTargets((prev) => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  }, []);

  const isValid =
    name.trim().length > 0 &&
    targets.some((t) => t.trim().length > 0);

  return (
    <div className="dossier-creation-dialog-backdrop">
      <div className="dossier-creation-dialog">
        <div className="dossier-creation-dialog-header">
          <h3>Create Intel Dossier</h3>
          <button
            className="close-button"
            onClick={onClose}
            disabled={isLoading}
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>

        <div className="dossier-creation-dialog-body">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name" className="form-label">
                Name (required)
              </label>
              <input
                id="name"
                type="text"
                className="text-input"
                placeholder="e.g., Backend Services"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
                maxLength={100}
              />
              <div className="field-hint">
                A descriptive name for this dossier
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                Targets (at least one required)
              </label>
              <div className="targets-list">
                {targets.map((target, index) => (
                  <div key={index} className="target-input-row">
                    <input
                      type="text"
                      className="text-input target-input"
                      placeholder="e.g., packages/backend/src/**/*.ts"
                      value={target}
                      onChange={(e) => handleTargetChange(index, e.target.value)}
                      disabled={isLoading}
                    />
                    {targets.length > 1 && (
                      <button
                        type="button"
                        className="btn-remove-target"
                        onClick={() => handleRemoveTarget(index)}
                        disabled={isLoading}
                        aria-label="Remove target"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                type="button"
                className="btn btn-add-target"
                onClick={handleAddTarget}
                disabled={isLoading}
              >
                + Add Path
              </button>
              <div className="field-hint">
                File paths or glob patterns to analyze
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="context" className="form-label">
                Context (optional)
              </label>
              <textarea
                id="context"
                className="textarea-input"
                placeholder="Tell the agent what to focus on..."
                value={context}
                onChange={(e) => setContext(e.target.value)}
                disabled={isLoading}
                rows={4}
                maxLength={1000}
              />
              <div className="field-hint">
                Natural language instructions for the analysis ({context.length}/1000)
              </div>
            </div>

            <div className="dossier-creation-dialog-actions">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isLoading || !isValid}
              >
                {isLoading ? 'Creating...' : 'Create Dossier'}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
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
