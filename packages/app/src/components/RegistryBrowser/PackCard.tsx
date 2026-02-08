import { useState, useCallback } from 'react';
import type { BehaviorPack } from '@afw/shared';
import './RegistryBrowser.css';

interface PackCardProps {
  pack: BehaviorPack;
  onToggle?: (enabled: boolean) => void;
  onUninstall?: () => void;
}

/**
 * Display card for a behavior pack.
 * Shows: name, description, author, version, entry count, tags
 * Features: Enable/disable toggle, uninstall with confirmation
 */
export function PackCard({ pack, onToggle, onUninstall }: PackCardProps) {
  const [confirmingUninstall, setConfirmingUninstall] = useState(false);

  const handleToggle = useCallback(() => {
    onToggle?.(!pack.enabled);
  }, [pack.enabled, onToggle]);

  const handleUninstallClick = useCallback(() => {
    if (confirmingUninstall) {
      onUninstall?.();
      setConfirmingUninstall(false);
    } else {
      setConfirmingUninstall(true);
    }
  }, [confirmingUninstall, onUninstall]);

  const handleCancelUninstall = useCallback(() => {
    setConfirmingUninstall(false);
  }, []);

  return (
    <div className={`pack-card ${!pack.enabled ? 'pack-disabled' : ''}`}>
      <div className="pack-header">
        <h3>{pack.name}</h3>
        <span className="pack-version">v{pack.version}</span>
      </div>
      <p className="pack-description">{pack.description}</p>
      <div className="pack-meta">
        <span className="pack-author">by {pack.author}</span>
        <span className="pack-entries">{pack.entries.length} entries</span>
      </div>
      {pack.tags.length > 0 && (
        <div className="pack-tags">
          {pack.tags.map(tag => (
            <span key={tag} className="tag">{tag}</span>
          ))}
        </div>
      )}
      <div className="pack-actions">
        <label className="toggle-switch">
          <input
            type="checkbox"
            checked={pack.enabled}
            onChange={handleToggle}
          />
          <span className="toggle-slider" />
          <span className="toggle-label">{pack.enabled ? 'Enabled' : 'Disabled'}</span>
        </label>
        <div className="pack-action-buttons">
          {confirmingUninstall ? (
            <>
              <button className="confirm-uninstall-btn" onClick={handleUninstallClick}>
                Confirm
              </button>
              <button className="cancel-uninstall-btn" onClick={handleCancelUninstall}>
                Cancel
              </button>
            </>
          ) : (
            <button className="uninstall-btn" onClick={handleUninstallClick}>
              Uninstall
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
