/**
 * HarmonyPanel Component
 * Full harmony metrics dashboard
 */

import React, { useState } from 'react';
import { useHarmonyMetrics } from '../../hooks/useHarmonyMetrics';
import { HarmonyBadge } from '../HarmonyBadge/HarmonyBadge';
import type { SessionId, ProjectId } from '@afw/shared';
import './HarmonyPanel.css';

interface HarmonyPanelProps {
  /** Target ID (session or project) */
  target: SessionId | ProjectId;

  /** Target type */
  targetType: 'session' | 'project';

  /** Optional className */
  className?: string;
}

export const HarmonyPanel: React.FC<HarmonyPanelProps> = ({
  target,
  targetType,
  className = '',
}) => {
  const { metrics, recentChecks, loading, error, refresh } = useHarmonyMetrics(target, targetType);
  const [expandedViolation, setExpandedViolation] = useState<string | null>(null);

  if (loading) {
    return (
      <div className={`harmony-panel harmony-panel--loading ${className}`}>
        <div className="harmony-panel__spinner">Loading harmony metrics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`harmony-panel harmony-panel--error ${className}`}>
        <div className="harmony-panel__error">
          <strong>Error loading harmony metrics:</strong> {error}
          <button onClick={refresh} className="harmony-panel__retry">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className={`harmony-panel harmony-panel--empty ${className}`}>
        <p>No harmony metrics available yet.</p>
      </div>
    );
  }

  const toggleViolation = (checkId: string) => {
    setExpandedViolation(expandedViolation === checkId ? null : checkId);
  };

  return (
    <div className={`harmony-panel ${className}`}>
      {/* Header */}
      <div className="harmony-panel__header">
        <h3 className="harmony-panel__title">Harmony Status</h3>
        <HarmonyBadge percentage={metrics.harmonyPercentage} showLabel size="large" />
      </div>

      {/* Metrics Overview */}
      <div className="harmony-panel__metrics">
        <div className="harmony-metric">
          <div className="harmony-metric__label">Total Checks</div>
          <div className="harmony-metric__value">{metrics.totalChecks}</div>
        </div>

        <div className="harmony-metric harmony-metric--success">
          <div className="harmony-metric__label">Valid</div>
          <div className="harmony-metric__value">{metrics.validCount}</div>
        </div>

        <div className="harmony-metric harmony-metric--warning">
          <div className="harmony-metric__label">Degraded</div>
          <div className="harmony-metric__value">{metrics.degradedCount}</div>
        </div>

        <div className="harmony-metric harmony-metric--danger">
          <div className="harmony-metric__label">Violations</div>
          <div className="harmony-metric__value">{metrics.violationCount}</div>
        </div>
      </div>

      {/* Format Breakdown */}
      <div className="harmony-panel__section">
        <h4 className="harmony-panel__section-title">Format Breakdown</h4>
        <div className="harmony-panel__format-list">
          {Object.entries(metrics.formatBreakdown).map(([format, count]) => (
            <div key={format} className="harmony-format-item">
              <span className="harmony-format-item__name">{format}</span>
              <span className="harmony-format-item__count">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Violations */}
      {metrics.recentViolations.length > 0 && (
        <div className="harmony-panel__section">
          <h4 className="harmony-panel__section-title">
            Recent Violations ({metrics.recentViolations.length})
          </h4>
          <div className="harmony-panel__violations">
            {metrics.recentViolations.map((violation) => (
              <div key={violation.id} className="harmony-violation">
                <div
                  className="harmony-violation__header"
                  onClick={() => toggleViolation(violation.id)}
                >
                  <span className="harmony-violation__icon">✗</span>
                  <span className="harmony-violation__timestamp">
                    {new Date(violation.timestamp).toLocaleString()}
                  </span>
                  <span className="harmony-violation__expand">
                    {expandedViolation === violation.id ? '▼' : '▶'}
                  </span>
                </div>

                {expandedViolation === violation.id && (
                  <div className="harmony-violation__details">
                    <pre className="harmony-violation__text">{violation.text}</pre>
                    {violation.context && (
                      <div className="harmony-violation__context">
                        <strong>Context:</strong>
                        {violation.context.stepNumber && (
                          <span> Step {violation.context.stepNumber}</span>
                        )}
                        {violation.context.chainId && (
                          <span> Chain {violation.context.chainId}</span>
                        )}
                        {violation.context.actionType && (
                          <span> Action: {violation.context.actionType}</span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="harmony-panel__footer">
        <span className="harmony-panel__last-check">
          Last check: {new Date(metrics.lastCheck).toLocaleString()}
        </span>
        <button onClick={refresh} className="harmony-panel__refresh">
          Refresh
        </button>
      </div>
    </div>
  );
};
