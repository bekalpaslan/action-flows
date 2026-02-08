import { useCallback } from 'react';
import type { RegistryEntry } from '@afw/shared';
import './RegistryBrowser.css';

interface RegistryEntryCardProps {
  entry: RegistryEntry;
  onClick?: () => void;
  onToggle?: (enabled: boolean) => void;
}

/**
 * Display card for a registry entry.
 * Shows: name, type, source layer, status, enable toggle
 */
export function RegistryEntryCard({ entry, onClick, onToggle }: RegistryEntryCardProps) {
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

  return (
    <div
      className={`entry-card ${!entry.enabled ? 'entry-disabled' : ''}`}
      onClick={onClick}
    >
      <div className="entry-header">
        <span className={`entry-type type-${entry.type}`}>{entry.type}</span>
        <span className={sourceBadgeClass}>{sourceLabel}</span>
        <span className={`entry-status status-${entry.status}`}>{entry.status}</span>
      </div>
      <h4 className="entry-name">{entry.name}</h4>
      <p className="entry-description">{entry.description}</p>
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
