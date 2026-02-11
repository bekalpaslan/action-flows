/**
 * DiscoveryHint - Proactive discovery suggestion when region is 90%+ ready
 *
 * Phase 3: Living Universe Discovery System
 * Appears above command input when a region is close to unlocking (≥90% progress).
 * Provides actionable suggestions to guide users toward discovering new regions.
 *
 * Design Decision: Chat panel hints (deferred cosmic map overlay to Phase 6)
 */

import React from 'react';
import type { RegionId } from '@afw/shared';
import './DiscoveryHint.css';

export interface DiscoveryHintProps {
  /** Region ID for the hint */
  regionId: RegionId;
  /** Human-readable region name */
  regionName: string;
  /** Discovery progress (0.0 - 1.0) */
  progress: number;
  /** Actionable suggestion text */
  suggestion: string;
  /** Callback when user dismisses the hint */
  onDismiss: (regionId: RegionId) => void;
  /** Optional callback when user clicks on the hint (future use) */
  onActionClick?: (regionId: RegionId) => void;
}

/**
 * DiscoveryHint Component
 *
 * Renders a dismissible hint when a region is close to being discovered.
 * Shows progress bar, suggestion text, and dismiss button.
 */
export function DiscoveryHint({
  regionId,
  regionName,
  progress,
  suggestion,
  onDismiss,
  onActionClick,
}: DiscoveryHintProps): React.ReactElement {
  const progressPercent = Math.round(progress * 100);

  const handleHintClick = () => {
    if (onActionClick) {
      onActionClick(regionId);
    }
  };

  const handleDismissClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDismiss(regionId);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onDismiss(regionId);
    }
  };

  return (
    <div
      className="discovery-hint"
      role="alert"
      aria-live="polite"
      onClick={handleHintClick}
      onKeyDown={handleKeyDown}
      tabIndex={onActionClick ? 0 : -1}
    >
      <div className="discovery-hint__icon" aria-hidden="true">
        💡
      </div>

      <div className="discovery-hint__content">
        <h4 className="discovery-hint__title">
          You're close to discovering {regionName}!
        </h4>
        <p className="discovery-hint__suggestion">
          Try: {suggestion}
        </p>

        {/* Progress Bar */}
        <div
          className="discovery-hint__progress"
          role="progressbar"
          aria-valuenow={progressPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Discovery progress: ${progressPercent}%`}
        >
          <div className="discovery-hint__progress-track">
            <div
              className="discovery-hint__progress-fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="discovery-hint__progress-label">
            {progressPercent}%
          </span>
        </div>
      </div>

      <button
        className="discovery-hint__dismiss"
        onClick={handleDismissClick}
        onKeyDown={(e) => e.stopPropagation()}
        aria-label={`Dismiss hint for ${regionName}`}
        title="Dismiss this hint"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 16 16"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M4.646 4.646a.5.5 0 01.708 0L8 7.293l2.646-2.647a.5.5 0 01.708.708L8.707 8l2.647 2.646a.5.5 0 01-.708.708L8 8.707l-2.646 2.647a.5.5 0 01-.708-.708L7.293 8 4.646 5.354a.5.5 0 010-.708z" />
        </svg>
      </button>
    </div>
  );
}
