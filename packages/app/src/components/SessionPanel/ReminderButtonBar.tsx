/**
 * ReminderButtonBar Component
 * Renders reminder buttons at chain approval gates
 */

import React, { useCallback } from 'react';
import type { SessionId, ChainId, ReminderDefinition, ReminderVariant } from '@afw/shared';
import { useReminderButtons } from '../../hooks/useReminderButtons';
import './ReminderButtonBar.css';

export interface ReminderButtonBarProps {
  /** Session ID for reminder instances */
  sessionId: SessionId;
  /** Chain ID to attach reminders to */
  chainId: ChainId;
  /** Callback when reminder button clicked (for variant-specific actions) */
  onReminderClick: (
    reminder: ReminderDefinition,
    variant: ReminderVariant
  ) => Promise<void>;
}

/**
 * Renders a bar of reminder buttons at approval gates
 * Shows 4 variant buttons per reminder definition
 */
export function ReminderButtonBar({
  sessionId: _sessionId,
  chainId: _chainId,
  onReminderClick,
}: ReminderButtonBarProps): React.ReactElement | null {
  const { definitions, isLoading, error } = useReminderButtons();

  const handleClick = useCallback(
    async (reminder: ReminderDefinition, variant: ReminderVariant) => {
      try {
        await onReminderClick(reminder, variant);
      } catch (err) {
        console.error('[ReminderButtonBar] Error handling click:', err);
      }
    },
    [onReminderClick]
  );

  if (isLoading) {
    return (
      <div className="reminder-button-bar reminder-button-bar--loading">
        Loading reminders...
      </div>
    );
  }

  if (error) {
    console.error('[ReminderButtonBar] Error loading reminders:', error);
    return null; // Graceful degradation
  }

  if (definitions.length === 0) {
    return null; // No reminders configured
  }

  return (
    <div className="reminder-button-bar">
      <div className="reminder-button-bar__header">
        <span className="reminder-button-bar__icon">🔔</span>
        <span className="reminder-button-bar__label">Reminders</span>
      </div>

      <div className="reminder-button-bar__buttons">
        {definitions.map((reminder, index) => (
          <div key={index} className="reminder-button-bar__group">
            <span className="reminder-button-bar__group-label">{reminder.label}</span>

            <button
              className="reminder-button-bar__button reminder-button-bar__button--double-check"
              onClick={() => handleClick(reminder, 'double-check')}
              title="Verify items before proceeding"
            >
              🔍 Double-check
            </button>

            <button
              className="reminder-button-bar__button reminder-button-bar__button--approve"
              onClick={() => handleClick(reminder, 'remind-approve')}
              title="Attach reminder and approve chain"
            >
              ✅ Remind & Approve
            </button>

            <button
              className="reminder-button-bar__button reminder-button-bar__button--restart"
              onClick={() => handleClick(reminder, 'remind-restart')}
              title="Attach reminder and restart chain compilation"
            >
              🔄 Remind & Restart
            </button>

            <button
              className="reminder-button-bar__button reminder-button-bar__button--generic"
              onClick={() => handleClick(reminder, 'remind-generic')}
              title="Store reminder (no chain action)"
            >
              📝 Remind
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
