import { useCallback } from 'react';
import type { FlowHubEntry } from '@afw/shared';
import './FlowHub.css';

interface FlowDetailsProps {
  flow: FlowHubEntry;
  onClose: () => void;
  onInstall?: (flowId: string) => void;
  onUninstall?: (flowId: string) => void;
  isInstalled?: boolean;
}

/**
 * Detailed view of a flow from FlowHub.
 * Shows: full description, agent list, capability requirements, surface requirements
 * Features: Install/Uninstall button, close button
 */
export function FlowDetails({ flow, onClose, onInstall, onUninstall, isInstalled }: FlowDetailsProps) {
  const handleInstallClick = useCallback(() => {
    onInstall?.(flow.flowId);
  }, [flow.flowId, onInstall]);

  const handleUninstallClick = useCallback(() => {
    onUninstall?.(flow.flowId);
  }, [flow.flowId, onUninstall]);

  const getSourceBadgeClass = (source: string): string => {
    switch (source) {
      case 'local':
        return 'source-local';
      case 'flow-hub':
        return 'source-flow-hub';
      case 'community':
        return 'source-community';
      default:
        return 'source-local';
    }
  };

  return (
    <div className="flow-details-overlay" onClick={onClose}>
      <div className="flow-details-modal" onClick={e => e.stopPropagation()}>
        <div className="flow-details-header">
          <div>
            <h2 className="flow-details-title">{flow.name}</h2>
            <p className="flow-details-author">by {flow.author} • v{flow.version}</p>
          </div>
          <button className="close-details-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="flow-details-content">
          <div className="flow-details-section">
            <div className="flow-source-info">
              <span className={`flow-source-badge ${getSourceBadgeClass(flow.source)}`}>
                {flow.source === 'flow-hub' ? 'FlowHub' : flow.source === 'community' ? 'Community' : 'Local'}
              </span>
              <span className="flow-stats-inline">
                ⭐ {flow.rating.toFixed(1)} • ⬇ {flow.downloads.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="flow-details-section">
            <h3>Description</h3>
            <p className="flow-full-description">{flow.description}</p>
          </div>

          {flow.tags.length > 0 && (
            <div className="flow-details-section">
              <h3>Tags</h3>
              <div className="flow-tags-list">
                {flow.tags.map(tag => (
                  <span key={tag} className="flow-tag">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {flow.categories.length > 0 && (
            <div className="flow-details-section">
              <h3>Categories</h3>
              <div className="flow-categories-list">
                {flow.categories.map(category => (
                  <span key={category} className="flow-category-badge">
                    {category}
                  </span>
                ))}
              </div>
            </div>
          )}

          {flow.requiresCapabilities.length > 0 && (
            <div className="flow-details-section">
              <h3>Required Capabilities</h3>
              <ul className="flow-requirements-list">
                {flow.requiresCapabilities.map(cap => (
                  <li key={cap} className="requirement-item">
                    {cap}
                  </li>
                ))}
              </ul>
              <p className="requirements-warning">
                ⚠ Ensure these capabilities are available before installation
              </p>
            </div>
          )}

          {flow.requiresSurfaces.length > 0 && (
            <div className="flow-details-section">
              <h3>Required Surfaces</h3>
              <ul className="flow-requirements-list">
                {flow.requiresSurfaces.map(surface => (
                  <li key={surface} className="requirement-item">
                    {surface}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {flow.personalityMetadata && (
            <div className="flow-details-section">
              <h3>Agent Personalities</h3>
              {flow.personalityMetadata.defaultPersonality && (
                <div className="personality-info">
                  <strong>Default:</strong> {flow.personalityMetadata.defaultPersonality.tone} •{' '}
                  {flow.personalityMetadata.defaultPersonality.speed} •{' '}
                  {flow.personalityMetadata.defaultPersonality.risk}
                </div>
              )}
              {flow.personalityMetadata.perActionPersonalities && (
                <div className="per-action-personalities">
                  {Object.entries(flow.personalityMetadata.perActionPersonalities).map(([action, personality]) => (
                    <div key={action} className="action-personality">
                      <strong>{action}:</strong> {personality.tone} • {personality.speed} • {personality.risk}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flow-details-section">
            <h3>Metadata</h3>
            <div className="flow-metadata-grid">
              <div className="metadata-item">
                <span className="metadata-label">Created:</span>
                <span className="metadata-value">{new Date(flow.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="metadata-item">
                <span className="metadata-label">Updated:</span>
                <span className="metadata-value">{new Date(flow.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {flow.source !== 'local' && (
            <div className="flow-security-warning">
              <span className="warning-icon">⚠</span>
              <span>This flow is from an external source. Review carefully before installing.</span>
            </div>
          )}
        </div>

        <div className="flow-details-footer">
          <button className="cancel-btn" onClick={onClose}>
            Close
          </button>
          {isInstalled ? (
            <button className="uninstall-btn-large" onClick={handleUninstallClick}>
              Uninstall
            </button>
          ) : (
            <button className="install-btn-large" onClick={handleInstallClick}>
              Install Flow
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
