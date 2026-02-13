import { useState, useCallback } from 'react';
import type { FlowHubEntry } from '@afw/shared';
import './FlowHub.css';

interface InstallFlowDialogProps {
  flow: FlowHubEntry;
  onConfirm: (overrideExisting: boolean) => void;
  onCancel: () => void;
  isInstalled?: boolean;
}

/**
 * Confirmation dialog before installing a flow.
 * Shows: what will be installed, security warning for external flows
 * Features: Override existing checkbox, confirm/cancel buttons
 */
export function InstallFlowDialog({ flow, onConfirm, onCancel, isInstalled }: InstallFlowDialogProps) {
  const [overrideExisting, setOverrideExisting] = useState(false);

  const handleConfirm = useCallback(() => {
    onConfirm(overrideExisting);
  }, [overrideExisting, onConfirm]);

  return (
    <div className="install-dialog-overlay" onClick={onCancel}>
      <div className="install-dialog-modal" onClick={e => e.stopPropagation()}>
        <div className="install-dialog-header">
          <h3>Install Flow</h3>
          <button className="close-dialog-btn" onClick={onCancel}>
            ✕
          </button>
        </div>

        <div className="install-dialog-content">
          <div className="flow-install-info">
            <h4 className="install-flow-name">{flow.name}</h4>
            <p className="install-flow-author">by {flow.author} • v{flow.version}</p>
          </div>

          <div className="install-details">
            <h4>What will be installed:</h4>
            <ul className="install-items-list">
              <li>Flow definition will be added to FLOWS.md registry</li>
              <li>Agent configuration files (agent.md) for flow actions</li>
              {flow.requiresCapabilities.length > 0 && (
                <li className="requirements-item">
                  Required capabilities: {flow.requiresCapabilities.join(', ')}
                </li>
              )}
              {flow.requiresSurfaces.length > 0 && (
                <li className="requirements-item">Required surfaces: {flow.requiresSurfaces.join(', ')}</li>
              )}
            </ul>
          </div>

          {flow.source !== 'local' && (
            <div className="install-security-warning">
              <span className="warning-icon">⚠</span>
              <div className="warning-content">
                <strong>Security Warning</strong>
                <p>This flow is from an external source ({flow.source}). Review the flow carefully before installing.</p>
              </div>
            </div>
          )}

          {isInstalled && (
            <div className="override-option">
              <label className="override-checkbox-label">
                <input
                  type="checkbox"
                  checked={overrideExisting}
                  onChange={e => setOverrideExisting(e.target.checked)}
                  className="override-checkbox"
                />
                <span>Override existing files</span>
              </label>
              <p className="override-help-text">
                This flow appears to be already installed. Check this box to replace existing agent files.
              </p>
            </div>
          )}
        </div>

        <div className="install-dialog-footer">
          <button className="cancel-install-btn" onClick={onCancel}>
            Cancel
          </button>
          <button className="confirm-install-btn" onClick={handleConfirm}>
            Confirm Install
          </button>
        </div>
      </div>
    </div>
  );
}
