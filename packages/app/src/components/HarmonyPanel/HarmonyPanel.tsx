/**
 * HarmonyPanel Component
 * Full harmony metrics dashboard
 */

import React, { useState } from 'react';
import { useHarmonyMetrics } from '../../hooks/useHarmonyMetrics';
import { HarmonyBadge } from '../HarmonyBadge/HarmonyBadge';
import { Button, Panel, PanelHeader } from '../primitives';
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
  const { metrics, loading, error, refresh } = useHarmonyMetrics(target, targetType);
  const [expandedViolation, setExpandedViolation] = useState<string | null>(null);
  const basePanelClassName = ['harmony-panel', className].filter(Boolean).join(' ');

  if (loading) {
    return (
      <Panel className={`${basePanelClassName} harmony-panel--loading`} padding="lg">
        <div className="harmony-panel__spinner">Loading harmony metrics...</div>
      </Panel>
    );
  }

  if (error) {
    return (
      <Panel className={`${basePanelClassName} harmony-panel--error`} padding="lg">
        <div className="harmony-panel__error">
          <strong>Error loading harmony metrics:</strong> {error}
          <Button onClick={refresh} variant="danger" size="sm">
            Retry
          </Button>
        </div>
      </Panel>
    );
  }

  if (!metrics) {
    return (
      <Panel className={`${basePanelClassName} harmony-panel--empty`} padding="lg">
        <p>No harmony metrics available yet.</p>
      </Panel>
    );
  }

  const toggleViolation = (checkId: string) => {
    setExpandedViolation(expandedViolation === checkId ? null : checkId);
  };

  return (
    <>
      <Panel
        className={basePanelClassName}
        variant="elevated"
        padding="lg"
        header={(
          <PanelHeader
            title="Harmony Status"
            actions={(
              <div className="harmony-panel__header-actions">
                <HarmonyBadge percentage={metrics.harmonyPercentage} showLabel size="large" />
                
              </div>
            )}
          />
        )}
        footer={(
          <>
            <span className="harmony-panel__last-check">
              Last check: {new Date(metrics.lastCheck).toLocaleString()}
            </span>
            <Button onClick={refresh} variant="primary" size="sm">
              Refresh
            </Button>
          </>
        )}
      >
        <div className="harmony-panel__content">
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

          {metrics.recentViolations.length > 0 && (
            <div className="harmony-panel__section">
              <h4 className="harmony-panel__section-title">
                Recent Violations ({metrics.recentViolations.length})
              </h4>
              <div className="harmony-panel__violations">
                {metrics.recentViolations.map((violation) => (
                  <div key={violation.id} className="harmony-violation">
                    <button
                      type="button"
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
                    </button>

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
        </div>
      </Panel>
    </>
  );
};
