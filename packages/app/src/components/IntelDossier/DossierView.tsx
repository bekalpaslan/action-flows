/**
 * DossierView Component
 *
 * Displays a full dossier with header, metadata, targets, context, and widget layout.
 * Shows empty state if dossier hasn't been analyzed yet.
 */

import { useState } from 'react';
import type { IntelDossier } from '@afw/shared';
import { WidgetRenderer } from './WidgetRenderer';
import './DossierView.css';

export interface DossierViewProps {
  /** The dossier to display */
  dossier: IntelDossier;
  /** Callback when re-analyze is requested */
  onAnalyze: () => void;
  /** Callback when delete is requested */
  onDelete: () => void;
}

/**
 * Full dossier view with header, collapsible sections, and widget rendering.
 */
export function DossierView({ dossier, onAnalyze, onDelete }: DossierViewProps) {
  const [targetsExpanded, setTargetsExpanded] = useState(false);
  const [contextExpanded, setContextExpanded] = useState(false);

  // Format dates
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  // Determine status badge class
  const statusClass = `dossier-view__status-badge dossier-view__status-badge--${dossier.status}`;

  return (
    <div className="dossier-view">
      {/* Header Section */}
      <div className="dossier-view__header">
        <div className="dossier-view__header-top">
          <h2 className="dossier-view__name">{dossier.name}</h2>
          <div className="dossier-view__header-actions">
            <button
              className="dossier-view__action-btn dossier-view__action-btn--primary"
              onClick={onAnalyze}
              disabled={dossier.status === 'analyzing'}
            >
              {dossier.status === 'analyzing' ? 'Analyzing...' : 'Re-analyze'}
            </button>
            <button
              className="dossier-view__action-btn dossier-view__action-btn--danger"
              onClick={onDelete}
              disabled={dossier.status === 'analyzing'}
            >
              Delete
            </button>
          </div>
        </div>

        <div className="dossier-view__header-meta">
          <span className={statusClass}>{dossier.status}</span>
          <span className="dossier-view__meta-item">
            Last updated: {formatDate(dossier.updatedAt)}
          </span>
          <span className="dossier-view__meta-item">
            Analyses: {dossier.analysisCount}
          </span>
        </div>
      </div>

      {/* Error Display */}
      {dossier.error && (
        <div className="dossier-view__error">
          <strong>Error:</strong> {dossier.error}
        </div>
      )}

      {/* Collapsible Targets Section */}
      <div className="dossier-view__section">
        <button
          className="dossier-view__section-header"
          onClick={() => setTargetsExpanded(!targetsExpanded)}
        >
          <span className="dossier-view__section-icon">
            {targetsExpanded ? '▼' : '▶'}
          </span>
          <span className="dossier-view__section-title">
            Targets ({dossier.targets.length})
          </span>
        </button>
        {targetsExpanded && (
          <div className="dossier-view__section-content">
            <ul className="dossier-view__targets-list">
              {dossier.targets.map((target, index) => (
                <li key={index} className="dossier-view__target-item">
                  <code>{target}</code>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Collapsible Context Section */}
      <div className="dossier-view__section">
        <button
          className="dossier-view__section-header"
          onClick={() => setContextExpanded(!contextExpanded)}
        >
          <span className="dossier-view__section-icon">
            {contextExpanded ? '▼' : '▶'}
          </span>
          <span className="dossier-view__section-title">Context</span>
        </button>
        {contextExpanded && (
          <div className="dossier-view__section-content">
            <p className="dossier-view__context-text">{dossier.context}</p>
          </div>
        )}
      </div>

      {/* Widget Layout or Empty State */}
      <div className="dossier-view__content">
        {dossier.layoutDescriptor === null ? (
          <div className="dossier-view__empty-state">
            <div className="dossier-view__empty-icon">📊</div>
            <h3 className="dossier-view__empty-title">No Analysis Yet</h3>
            <p className="dossier-view__empty-message">
              This dossier hasn't been analyzed yet. Click "Re-analyze" to start.
            </p>
          </div>
        ) : (
          <WidgetRenderer layoutDescriptor={dossier.layoutDescriptor} />
        )}
      </div>
    </div>
  );
}
