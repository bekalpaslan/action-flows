import { useState, useCallback } from 'react';
import type { ModifierDefinition } from '@afw/shared';
import './ModifierCard.css';

interface ModifierCardProps {
  /** The modifier definition to display */
  modifier: ModifierDefinition & { id: string; name: string };
  /** Callback when user clicks Apply */
  onApply?: (modifierId: string) => void;
  /** Callback when user clicks Preview */
  onPreview?: (modifierId: string) => void;
  /** Whether the card actions are disabled */
  disabled?: boolean;
  /** Optional confidence score (0-100) */
  confidence?: number;
  /** Current value being modified (for comparison display) */
  currentValue?: string;
  /** Proposed value after modification */
  proposedValue?: string;
}

/**
 * Display card for a self-modification template.
 * Shows modifier details and provides Preview/Apply actions.
 */
export function ModifierCard({
  modifier,
  onApply,
  onPreview,
  disabled = false,
  confidence,
  currentValue,
  proposedValue,
}: ModifierCardProps) {
  const [isApplying, setIsApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePreview = useCallback(() => {
    if (disabled || isApplying) return;
    setError(null);
    onPreview?.(modifier.id);
  }, [disabled, isApplying, modifier.id, onPreview]);

  const handleApply = useCallback(async () => {
    if (disabled || isApplying || applied) return;
    setError(null);
    setIsApplying(true);

    try {
      await onApply?.(modifier.id);
      setApplied(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply modifier');
    } finally {
      setIsApplying(false);
    }
  }, [disabled, isApplying, applied, modifier.id, onApply]);

  const tierClass = `tier-${modifier.targetTier}`;
  const cardClass = `modifier-card ${disabled ? 'modifier-disabled' : ''} ${applied ? 'modifier-applied' : ''} ${error ? 'modifier-error' : ''}`;

  // Build target summary from file change templates
  const targetSummary = modifier.fileChangeTemplates
    .map(t => `${t.package}/${t.filePath.split('/').pop()}`)
    .slice(0, 2)
    .join(', ') + (modifier.fileChangeTemplates.length > 2 ? ` +${modifier.fileChangeTemplates.length - 2} more` : '');

  return (
    <div className={cardClass}>
      <div className="modifier-header">
        <span className={`modifier-tier ${tierClass}`}>{modifier.targetTier}</span>
        {confidence !== undefined && (
          <span className={`confidence-badge ${confidence >= 80 ? 'high' : confidence >= 50 ? 'medium' : 'low'}`}>
            {confidence}% confidence
          </span>
        )}
        {applied && <span className="applied-badge">Applied</span>}
      </div>

      <h4 className="modifier-name">{modifier.name}</h4>
      <p className="modifier-description">{modifier.description}</p>

      <div className="modifier-target">
        <span className="target-label">Target:</span>
        <span className="target-value">{targetSummary}</span>
      </div>

      {(currentValue || proposedValue) && (
        <div className="modifier-comparison">
          {currentValue && (
            <div className="comparison-item current">
              <span className="comparison-label">Current:</span>
              <code className="comparison-value">{currentValue}</code>
            </div>
          )}
          {proposedValue && (
            <div className="comparison-item proposed">
              <span className="comparison-label">Proposed:</span>
              <code className="comparison-value">{proposedValue}</code>
            </div>
          )}
        </div>
      )}

      <div className="modifier-validation">
        <span className={`validation-item ${modifier.validation.typeCheck ? 'enabled' : 'disabled'}`}>
          TypeCheck
        </span>
        <span className={`validation-item ${modifier.validation.lint ? 'enabled' : 'disabled'}`}>
          Lint
        </span>
        <span className={`validation-item ${modifier.validation.test ? 'enabled' : 'disabled'}`}>
          Test
        </span>
      </div>

      {error && <div className="modifier-error-message">{error}</div>}

      <div className="modifier-footer">
        <button
          className="preview-btn"
          onClick={handlePreview}
          disabled={disabled || isApplying}
        >
          Preview
        </button>
        <button
          className="apply-btn"
          onClick={handleApply}
          disabled={disabled || isApplying || applied}
        >
          {isApplying ? (
            <>
              <span className="spinner" />
              Applying...
            </>
          ) : applied ? (
            'Applied'
          ) : (
            'Apply'
          )}
        </button>
      </div>
    </div>
  );
}
