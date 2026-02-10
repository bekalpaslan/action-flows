/**
 * ComponentHealthCard Component
 * Displays health status for a single component with violation details
 */

import React, { useState } from 'react';
import type { RespectViolation } from '@afw/shared';

export interface ComponentHealthCardProps {
  /** Component selector */
  selector: string;
  /** Health status */
  status: 'pass' | 'warn' | 'fail';
  /** Violations (if any) */
  violations?: RespectViolation[];
  /** Component metrics */
  metrics?: {
    width: number;
    height: number;
    scrollWidth: number;
    scrollHeight: number;
    clientWidth: number;
    clientHeight: number;
  };
}

export function ComponentHealthCard({
  selector,
  status,
  violations = [],
  metrics,
}: ComponentHealthCardProps): React.ReactElement {
  const [expanded, setExpanded] = useState(status !== 'pass');

  const statusIcon = status === 'pass' ? '✓' : status === 'warn' ? '⚠' : '✗';
  const statusClass = `respect-component--${status}`;

  return (
    <div className={`respect-component ${statusClass}`}>
      <div
        className="respect-component__header"
        onClick={() => violations.length > 0 && setExpanded(!expanded)}
        style={{ cursor: violations.length > 0 ? 'pointer' : 'default' }}
      >
        <span className="respect-component__status-icon">{statusIcon}</span>
        <span className="respect-component__selector">{selector}</span>
        {violations.length > 0 && (
          <span className="respect-component__expand-icon">
            {expanded ? '▼' : '▶'}
          </span>
        )}
      </div>

      {expanded && violations.length > 0 && (
        <div className="respect-component__violations">
          {violations.map((violation, idx) => (
            <div key={idx} className="respect-violation">
              <div className="respect-violation__header">
                <span
                  className={`respect-violation__badge respect-violation__badge--${violation.severity}`}
                >
                  {violation.severity}
                </span>
                <span className="respect-violation__type">{violation.type}</span>
              </div>

              <div className="respect-violation__message">{violation.message}</div>

              <div className="respect-violation__comparison">
                <div className="respect-violation__expected">
                  <strong>Expected:</strong> {violation.expected}
                </div>
                <div className="respect-violation__actual">
                  <strong>Actual:</strong> {violation.actual}
                </div>
              </div>
            </div>
          ))}

          {metrics && (
            <div className="respect-component__metrics">
              <div className="respect-component__metrics-title">Metrics</div>
              <div className="respect-component__metrics-grid">
                <div>Width: {Math.round(metrics.width)}px</div>
                <div>Height: {Math.round(metrics.height)}px</div>
                <div>Scroll W: {metrics.scrollWidth}px</div>
                <div>Scroll H: {metrics.scrollHeight}px</div>
                <div>Client W: {metrics.clientWidth}px</div>
                <div>Client H: {metrics.clientHeight}px</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
