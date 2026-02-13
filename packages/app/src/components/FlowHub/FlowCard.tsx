import { useState, useCallback } from 'react';
import type { FlowHubEntry } from '@afw/shared';
import './FlowHub.css';

interface FlowCardProps {
  flow: FlowHubEntry;
  onInstall?: (flowId: string) => void;
  onViewDetails?: (flow: FlowHubEntry) => void;
  isInstalled?: boolean;
}

/**
 * Compact card for displaying a flow in the FlowHub browser.
 * Shows: name, author, description (truncated), version, rating, downloads, source badge
 * Features: Install button, click to expand for details
 */
export function FlowCard({ flow, onInstall, onViewDetails, isInstalled }: FlowCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const handleCardClick = useCallback(() => {
    onViewDetails?.(flow);
  }, [flow, onViewDetails]);

  const handleInstallClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onInstall?.(flow.flowId);
    },
    [flow.flowId, onInstall]
  );

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

  const truncateDescription = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div
      className={`flow-card ${isInstalled ? 'flow-installed' : ''}`}
      onClick={handleCardClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flow-card-header">
        <h3 className="flow-name">{flow.name}</h3>
        <span className={`flow-source-badge ${getSourceBadgeClass(flow.source)}`}>
          {flow.source === 'flow-hub' ? 'FlowHub' : flow.source === 'community' ? 'Community' : 'Local'}
        </span>
      </div>

      <p className="flow-description">{truncateDescription(flow.description, 100)}</p>

      <div className="flow-meta">
        <span className="flow-author">by {flow.author}</span>
        <span className="flow-version">v{flow.version}</span>
      </div>

      <div className="flow-stats">
        <span className="flow-rating">
          <span className="stat-icon">⭐</span>
          {flow.rating.toFixed(1)}
        </span>
        <span className="flow-downloads">
          <span className="stat-icon">⬇</span>
          {flow.downloads.toLocaleString()}
        </span>
      </div>

      {flow.tags.length > 0 && (
        <div className="flow-tags">
          {flow.tags.slice(0, 3).map(tag => (
            <span key={tag} className="flow-tag">
              {tag}
            </span>
          ))}
          {flow.tags.length > 3 && <span className="flow-tag-more">+{flow.tags.length - 3}</span>}
        </div>
      )}

      <div className="flow-card-footer">
        {isInstalled ? (
          <span className="installed-badge">Installed</span>
        ) : (
          <button
            className="install-flow-btn"
            onClick={handleInstallClick}
            disabled={isHovered === false}
          >
            Install
          </button>
        )}
        <button className="view-details-btn" onClick={handleCardClick}>
          Details
        </button>
      </div>
    </div>
  );
}
