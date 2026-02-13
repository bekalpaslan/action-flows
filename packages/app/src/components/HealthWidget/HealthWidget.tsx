import React, { useState, useEffect, useRef } from 'react';
import { SessionId } from '@afw/shared';
import { useHarmonyHealth } from '../../hooks/useHarmonyHealth';
import './HealthWidget.css';

interface HealthWidgetProps {
  sessionId: SessionId | null;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

export function HealthWidget({ sessionId, position = 'bottom-right' }: HealthWidgetProps) {
  const { health, loading, error, refresh } = useHarmonyHealth(sessionId);
  const [expanded, setExpanded] = useState(false);
  const widgetRef = useRef<HTMLDivElement>(null);

  // Auto-collapse after 30s of inactivity
  useEffect(() => {
    if (!expanded) return;
    const timer = setTimeout(() => setExpanded(false), 30000);
    return () => clearTimeout(timer);
  }, [expanded]);

  // Click outside to collapse
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (widgetRef.current && !widgetRef.current.contains(e.target as Node)) {
        setExpanded(false);
      }
    };
    if (expanded) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [expanded]);

  const getHealthColor = (score: number): string => {
    if (score >= 90) return 'green';
    if (score >= 70) return 'yellow';
    if (score >= 50) return 'orange';
    return 'red';
  };

  const overallScore = health?.overall ?? 100;
  const colorClass = getHealthColor(overallScore);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (loading && !health) {
    return (
      <div className={`health-widget health-widget--${position}`} ref={widgetRef}>
        <div className="health-widget__compact health-widget__compact--loading">
          <span className="health-widget__spinner" />
        </div>
      </div>
    );
  }

  if (error && !health) {
    return (
      <div className={`health-widget health-widget--${position}`} ref={widgetRef}>
        <div className="health-widget__compact health-widget__compact--error" onClick={refresh}>
          <span className="health-widget__icon">⚠️</span>
          <span className="health-widget__retry">Retry</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`health-widget health-widget--${position}`} ref={widgetRef}>
      {!expanded ? (
        <button
          className={`health-widget__compact health-widget__compact--${colorClass}`}
          onClick={() => setExpanded(true)}
          title="Click to expand health details"
        >
          <span className="health-widget__score">{overallScore}%</span>
        </button>
      ) : (
        <div className={`health-widget__expanded health-widget__expanded--${colorClass}`}>
          <div className="health-widget__header">
            <h4>Harmony Health</h4>
            <button className="health-widget__close" onClick={() => setExpanded(false)}>×</button>
          </div>

          <div className="health-widget__overall">
            <span className={`health-widget__badge health-widget__badge--${colorClass}`}>
              {overallScore}%
            </span>
            <span className="health-widget__label">Overall Health</span>
          </div>

          {health?.byGate && Object.keys(health.byGate).length > 0 && (
            <div className="health-widget__gates">
              <h5>Gate Breakdown</h5>
              {Object.entries(health.byGate).map(([gateId, gate]) => (
                <div key={gateId} className="health-widget__gate">
                  <span className={`health-widget__gate-icon health-widget__gate-icon--${getHealthColor(gate.score)}`}>
                    {gate.score >= 90 ? '✓' : gate.score >= 70 ? '⚠' : '✗'}
                  </span>
                  <span className="health-widget__gate-name">{gateId}</span>
                  <span className="health-widget__gate-score">{gate.score}%</span>
                  {gate.violations > 0 && (
                    <span className="health-widget__gate-violations">({gate.violations})</span>
                  )}
                </div>
              ))}
            </div>
          )}

          {health?.healingRecommendations && health.healingRecommendations.length > 0 && (
            <div className="health-widget__recommendations">
              <h5>Healing Actions</h5>
              {health.healingRecommendations.slice(0, 3).map((rec, idx) => (
                <button
                  key={idx}
                  className="health-widget__recommendation"
                  onClick={() => copyToClipboard(rec.suggestedFlow)}
                  title="Click to copy flow command"
                >
                  <span className="health-widget__rec-icon">•</span>
                  <span className="health-widget__rec-text">{rec.reason}</span>
                </button>
              ))}
            </div>
          )}

          <div className="health-widget__footer">
            <button className="health-widget__refresh" onClick={refresh}>
              ↻ Refresh
            </button>
            {health?.timestamp && (
              <span className="health-widget__timestamp">
                {new Date(health.timestamp).toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default HealthWidget;
