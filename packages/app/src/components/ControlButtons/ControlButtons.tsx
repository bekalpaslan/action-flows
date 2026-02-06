/**
 * Control Buttons Component
 * Provides UI controls for pause, resume, and cancel commands
 */

import { useState } from 'react';
import type { Session } from '@afw/shared';
import { useSessionControls } from '../../hooks/useSessionControls';
import './ControlButtons.css';

export interface ControlButtonsProps {
  session: Session;
  disabled?: boolean;
}

export function ControlButtons({ session, disabled = false }: ControlButtonsProps) {
  const controls = useSessionControls();
  const [isPausing, setIsPausing] = useState(false);
  const [isResuming, setIsResuming] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const isPaused = session.status === 'paused';
  const isRunning = session.status === 'in_progress';
  const hasActiveChain = !!session.currentChain;

  const handlePause = async () => {
    if (!session.id || isPausing || !isRunning) return;

    setIsPausing(true);
    try {
      await controls.pause(session.id);
      console.log('[ControlButtons] Pause command sent');
    } catch (error) {
      console.error('[ControlButtons] Failed to pause:', error);
      alert('Failed to pause session. See console for details.');
    } finally {
      setIsPausing(false);
    }
  };

  const handleResume = async () => {
    if (!session.id || isResuming || !isPaused) return;

    setIsResuming(true);
    try {
      await controls.resume(session.id);
      console.log('[ControlButtons] Resume command sent');
    } catch (error) {
      console.error('[ControlButtons] Failed to resume:', error);
      alert('Failed to resume session. See console for details.');
    } finally {
      setIsResuming(false);
    }
  };

  const handleCancelClick = () => {
    setShowCancelConfirm(true);
  };

  const handleCancelConfirm = async () => {
    if (!session.id || isCancelling) return;

    setIsCancelling(true);
    setShowCancelConfirm(false);

    try {
      await controls.cancel(session.id, 'User cancelled from Dashboard');
      console.log('[ControlButtons] Cancel command sent');
    } catch (error) {
      console.error('[ControlButtons] Failed to cancel:', error);
      alert('Failed to cancel session. See console for details.');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleCancelDismiss = () => {
    setShowCancelConfirm(false);
  };

  if (!hasActiveChain) {
    return null;
  }

  return (
    <div className="control-buttons">
      {isRunning && (
        <button
          className="control-btn pause-btn"
          onClick={handlePause}
          disabled={disabled || isPausing}
          title="Pause chain execution after current step"
        >
          {isPausing ? 'Pausing...' : '⏸ Pause'}
        </button>
      )}

      {isPaused && (
        <button
          className="control-btn resume-btn"
          onClick={handleResume}
          disabled={disabled || isResuming}
          title="Resume chain execution"
        >
          {isResuming ? 'Resuming...' : '▶ Resume'}
        </button>
      )}

      <button
        className="control-btn cancel-btn"
        onClick={handleCancelClick}
        disabled={disabled || isCancelling}
        title="Cancel chain execution"
      >
        {isCancelling ? 'Cancelling...' : '⏹ Cancel'}
      </button>

      {showCancelConfirm && (
        <div className="cancel-confirm-overlay" onClick={handleCancelDismiss}>
          <div className="cancel-confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <h3>Cancel Chain?</h3>
            <p>
              This will stop the chain execution and abort any remaining steps.
              Completed steps will be preserved.
            </p>
            <div className="cancel-confirm-actions">
              <button className="confirm-btn danger" onClick={handleCancelConfirm}>
                Yes, Cancel Chain
              </button>
              <button className="confirm-btn secondary" onClick={handleCancelDismiss}>
                No, Go Back
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
