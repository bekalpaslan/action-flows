/**
 * ChainStatusIndicator - Displays running chain status in Command Center
 *
 * Phase 5 Batch C: Optional enhancement showing current chain execution
 * Example: "Chain: code/frontend (2/5 steps)"
 *
 * Props:
 * - chainTitle: The action path (e.g., "code/frontend")
 * - currentStep: Current step number (1-indexed)
 * - totalSteps: Total number of steps in chain
 */

import React from 'react';
import './ChainStatusIndicator.css';

export interface ChainStatusIndicatorProps {
  /** Chain action path (e.g., "code/frontend", "review/contract") */
  chainTitle: string;

  /** Current step being executed (1-indexed) */
  currentStep: number;

  /** Total steps in the chain */
  totalSteps: number;
}

/**
 * ChainStatusIndicator - Small widget showing running chain progress
 */
export function ChainStatusIndicator({
  chainTitle,
  currentStep,
  totalSteps,
}: ChainStatusIndicatorProps): React.ReactElement {
  // Calculate progress percentage for visual indicator
  const progressPercent = (currentStep / totalSteps) * 100;

  return (
    <div className="chain-status-indicator" role="status" aria-live="polite">
      {/* Animated spinner icon */}
      <svg
        className="chain-status-indicator__spinner"
        width="14"
        height="14"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="8" cy="8" r="6" opacity="0.3" />
        <path d="M8 2 A6 6 0 0 1 14 8" />
      </svg>

      {/* Chain info text */}
      <span className="chain-status-indicator__text">
        Chain: <strong>{chainTitle}</strong> ({currentStep}/{totalSteps})
      </span>

      {/* Progress bar */}
      <div
        className="chain-status-indicator__progress"
        role="progressbar"
        aria-valuenow={currentStep}
        aria-valuemin={1}
        aria-valuemax={totalSteps}
        aria-label={`Chain progress: ${currentStep} of ${totalSteps} steps`}
      >
        <div
          className="chain-status-indicator__progress-fill"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
}
