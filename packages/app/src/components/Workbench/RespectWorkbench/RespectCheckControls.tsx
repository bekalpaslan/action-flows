/**
 * RespectCheckControls Component
 * Top controls bar for respect workbench showing summary stats and run button
 */

import React from 'react';
import type { RespectCheckResult } from '@afw/shared';

export interface RespectCheckControlsProps {
  /** Callback when run check button is clicked */
  onRunCheck: () => void;
  /** Whether a check is currently running */
  isRunning: boolean;
  /** Current check result (if any) */
  result: RespectCheckResult | null;
}

export function RespectCheckControls({
  onRunCheck,
  isRunning,
  result,
}: RespectCheckControlsProps): React.ReactElement {
  // Calculate summary stats
  const total = result?.totalChecked ?? 0;
  const passing = result?.clean.length ?? 0;
  const warnings = result?.summary.medium ?? 0;
  const violations = result?.summary.high ?? 0;
  const coverage = result?.coverage ?? null;

  // Determine overall status color
  const getStatusClass = (): string => {
    if (!result) return 'respect-controls__stats--neutral';
    if (violations > 0) return 'respect-controls__stats--danger';
    if (warnings > 0) return 'respect-controls__stats--warning';
    return 'respect-controls__stats--success';
  };

  return (
    <div className="respect-controls">
      <div className="respect-controls__left">
        <button
          className="respect-controls__run-btn"
          onClick={onRunCheck}
          disabled={isRunning}
        >
          {isRunning ? (
            <>
              <span className="respect-controls__spinner">⟳</span>
              Running...
            </>
          ) : (
            <>▶ Run Check</>
          )}
        </button>
      </div>

      <div className={`respect-controls__stats ${getStatusClass()}`}>
        <div className="respect-controls__chip">
          <span className="respect-controls__chip-label">Total</span>
          <span className="respect-controls__chip-value">{total}</span>
        </div>

        <div className="respect-controls__chip respect-controls__chip--success">
          <span className="respect-controls__chip-label">✓ Pass</span>
          <span className="respect-controls__chip-value">{passing}</span>
        </div>

        {warnings > 0 && (
          <div className="respect-controls__chip respect-controls__chip--warning">
            <span className="respect-controls__chip-label">⚠ Warn</span>
            <span className="respect-controls__chip-value">{warnings}</span>
          </div>
        )}

        {violations > 0 && (
          <div className="respect-controls__chip respect-controls__chip--danger">
            <span className="respect-controls__chip-label">✗ Fail</span>
            <span className="respect-controls__chip-value">{violations}</span>
          </div>
        )}

        {coverage && (
          <div className="respect-controls__chip respect-controls__chip--coverage">
            <span className="respect-controls__chip-label">Coverage</span>
            <span className="respect-controls__chip-value">
              {coverage.foundSelectors}/{coverage.totalKnownComponents} ({coverage.coveragePercent}%)
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
