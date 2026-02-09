import { useCallback } from 'react';
import type { RegistryEntry } from '@afw/shared';
import './RegistryBrowser.css';

interface RegistryEntryCardProps {
  entry: RegistryEntry;
  onClick?: () => void;
  onToggle?: (enabled: boolean) => void;
  onDelete?: (entryId: string) => void;
}

/**
 * Display card for a registry entry.
 * Shows: name, type, source layer, status, enable toggle
 */
export function RegistryEntryCard({ entry, onClick, onToggle, onDelete }: RegistryEntryCardProps) {
  const sourceLabel = entry.source.type === 'core'
    ? 'Core'
    : entry.source.type === 'pack'
      ? `Pack: ${entry.source.packId}`
      : `Project`;

  const sourceBadgeClass = `source-badge source-${entry.source.type}`;

  const handleCheckboxChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    onToggle?.(e.target.checked);
  }, [onToggle]);

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(entry.id);
  }, [onDelete, entry.id]);

  // Render custom-prompt-specific details
  const renderCustomPromptDetails = () => {
    if (entry.type !== 'custom-prompt') {
      return null;
    }

    // Type narrowing for custom-prompt entry
    if (!('definition' in entry.data)) {
      return null;
    }

    const def = entry.data.definition as import('@afw/shared').CustomPromptDefinition;
    const promptPreview = def.prompt.length > 100
      ? def.prompt.substring(0, 100) + '...'
      : def.prompt;

    return (
      <div className="custom-prompt-details">
        <div className="prompt-icon">{def.icon || '💬'}</div>
        <div className="prompt-preview">{promptPreview}</div>
        {def.alwaysShow && (
          <div className="always-show-badge">Always Visible</div>
        )}
      </div>
    );
  };

  return (
    <div
      className={`entry-card ${!entry.enabled ? 'entry-disabled' : ''}`}
      onClick={onClick}
    >
      <div className="entry-header">
        <span className={`entry-type type-${entry.type}`}>{entry.type}</span>
        <span className={sourceBadgeClass}>{sourceLabel}</span>
        <span className={`entry-status status-${entry.status}`}>{entry.status}</span>
        {entry.type === 'custom-prompt' && onDelete && (
          <button
            className="entry-delete-button"
            onClick={handleDelete}
            title="Delete this custom prompt"
            aria-label="Delete entry"
          >
            ×
          </button>
        )}
      </div>
      <h4 className="entry-name">{entry.name}</h4>
      <p className="entry-description">{entry.description}</p>
      {renderCustomPromptDetails()}
      <div className="entry-footer">
        <span className="entry-version">v{entry.version}</span>
        <label className="toggle-switch toggle-small" onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={entry.enabled}
            onChange={handleCheckboxChange}
          />
          <span className="toggle-slider" />
        </label>
      </div>
    </div>
  );
}
