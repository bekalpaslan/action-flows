import { useState, useEffect, useMemo } from 'react';
import type { SessionId, QuickActionDefinition, SessionLifecycleState } from '@afw/shared';
import { QuickActionButton } from './QuickActionButton';
import './QuickActionBar.css';

export interface QuickActionBarProps {
  /** Session ID */
  sessionId: SessionId;

  /** Lifecycle state for UI rendering */
  lifecycleState: SessionLifecycleState;

  /** Quick action definitions */
  quickActions: QuickActionDefinition[];

  /** Callback when action clicked */
  onActionClick: (value: string) => void;

  /** Callback when manual input submitted */
  onManualInput: (value: string) => void;

  /** Last terminal output for context detection */
  lastOutput?: string;

  /** Disabled state */
  disabled?: boolean;
}

/**
 * QuickActionBar - bottom bar on session tile
 *
 * Shows context-aware quick action buttons + manual input field
 * Pulses when session enters waiting-for-input state
 */
export function QuickActionBar({
  sessionId,
  lifecycleState,
  quickActions,
  onActionClick,
  onManualInput,
  lastOutput = '',
  disabled = false,
}: QuickActionBarProps) {
  const [manualInputValue, setManualInputValue] = useState('');
  const [isWaitingForInput, setIsWaitingForInput] = useState(false);

  // Detect waiting-for-input state
  useEffect(() => {
    const wasWaiting = isWaitingForInput;
    const nowWaiting = lifecycleState === 'waiting-for-input';

    setIsWaitingForInput(nowWaiting);

    // Trigger pulse animation when state changes to waiting
    if (!wasWaiting && nowWaiting) {
      // CSS animation will handle the pulse
    }
  }, [lifecycleState, isWaitingForInput]);

  // Pre-compile regex patterns (only recomputed when quickActions change)
  const compiledPatterns = useMemo(() => {
    const map = new Map<string, RegExp[]>();
    for (const action of quickActions) {
      if (action.contextPatterns && action.contextPatterns.length > 0) {
        const regexes: RegExp[] = [];
        for (const pattern of action.contextPatterns) {
          try {
            regexes.push(new RegExp(pattern, 'i'));
          } catch {
            // Skip invalid regex
          }
        }
        map.set(action.id, regexes);
      }
    }
    return map;
  }, [quickActions]);

  // Filter quick actions based on context (alwaysShow or matching pattern)
  const visibleActions = useMemo(() => {
    return quickActions.filter(action => {
      if (action.alwaysShow) return true;

      const patterns = compiledPatterns.get(action.id);
      // If no patterns defined, show by default
      if (!patterns || patterns.length === 0) return true;

      // Check if any pre-compiled pattern matches last output
      return patterns.some(regex => regex.test(lastOutput));
    });
  }, [quickActions, lastOutput, compiledPatterns]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInputValue.trim() || disabled) return;

    onManualInput(manualInputValue);
    setManualInputValue('');
  };

  return (
    <div
      className={`quick-action-bar ${isWaitingForInput ? 'pulse-animation' : ''} ${disabled ? 'disabled' : ''}`}
      data-session-id={sessionId}
    >
      <div className="quick-actions-buttons">
        {visibleActions.map((action) => (
          <QuickActionButton
            key={action.id}
            label={action.label}
            icon={action.icon}
            value={action.value}
            onClick={onActionClick}
            disabled={disabled}
          />
        ))}
      </div>

      <form className="manual-input-form" onSubmit={handleManualSubmit}>
        <input
          type="text"
          className="manual-input-field"
          value={manualInputValue}
          onChange={(e) => setManualInputValue(e.target.value)}
          placeholder="Type response..."
          disabled={disabled}
        />
        <button
          type="submit"
          className="manual-input-submit"
          disabled={disabled || !manualInputValue.trim()}
          title="Send input"
        >
          →
        </button>
      </form>
    </div>
  );
}
