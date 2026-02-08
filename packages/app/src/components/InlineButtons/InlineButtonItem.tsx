import { useState, useCallback } from 'react';
import type { ButtonDefinition, ButtonState, SessionId } from '@afw/shared';
import { useButtonActions } from '../../hooks/useButtonActions';
import './InlineButtons.css';

interface InlineButtonItemProps {
  button: ButtonDefinition;
  sessionId: SessionId;
  projectId?: string;
  onAction?: (button: ButtonDefinition) => void;
}

/**
 * Individual inline button with loading/success/error state management.
 *
 * Features:
 * - State-based styling (idle, loading, success, error)
 * - Icon rendering (if provided)
 * - Automatic state transitions
 * - Action execution via useButtonActions hook
 * - Usage tracking via toolbar API
 */
export function InlineButtonItem({
  button,
  sessionId,
  projectId = 'default',
  onAction,
}: InlineButtonItemProps) {
  const [state, setState] = useState<ButtonState>('idle');
  const { executeAction, trackUsage } = useButtonActions(sessionId);

  const handleClick = useCallback(async () => {
    if (state !== 'idle') return;

    setState('loading');

    try {
      // Log button click
      console.log('[InlineButton]', {
        eventType: 'button_clicked',
        buttonId: button.id,
        label: button.label,
        sessionId,
        action: button.action,
      });

      // Execute the button's action
      await executeAction(button);

      // Track usage after successful action
      await trackUsage(button.id, projectId);

      // Trigger callback if provided
      if (onAction) {
        onAction(button);
      }

      // Show success state
      setState('success');

      // Reset to idle state after 2 seconds
      setTimeout(() => {
        setState('idle');
      }, 2000);
    } catch (error) {
      console.error('[InlineButton] Error:', error);
      setState('error');

      // Reset to idle state after 2 seconds
      setTimeout(() => {
        setState('idle');
      }, 2000);
    }
  }, [state, button, sessionId, projectId, onAction, executeAction, trackUsage]);

  const getIconSvg = (iconName: string | undefined) => {
    if (!iconName) return null;

    // If it's an emoji, just render it directly
    if (iconName.length <= 2 && /\p{Extended_Pictographic}/u.test(iconName)) {
      return <span className="inline-button-emoji">{iconName}</span>;
    }

    // Otherwise, return a generic icon
    return (
      <svg
        className="inline-button-icon"
        width="14"
        height="14"
        viewBox="0 0 14 14"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    );
  };

  return (
    <button
      className={`inline-button-item inline-button-${state}`}
      onClick={handleClick}
      disabled={state !== 'idle'}
      title={`${button.label}${button.shortcut ? ` (${button.shortcut})` : ''}`}
    >
      {state === 'loading' && (
        <svg
          className="inline-button-spinner"
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            cx="7"
            cy="7"
            r="5"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray="8 4"
            strokeLinecap="round"
          >
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="0 7 7"
              to="360 7 7"
              dur="1s"
              repeatCount="indefinite"
            />
          </circle>
        </svg>
      )}
      {state === 'success' && (
        <svg
          className="inline-button-icon"
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M11.6667 3.5L5.25 9.91667L2.33333 7"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
      {state === 'error' && (
        <svg
          className="inline-button-icon"
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M10.5 3.5L3.5 10.5M3.5 3.5L10.5 10.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
      {state === 'idle' && getIconSvg(button.icon)}
      <span className="inline-button-label">{button.label}</span>
    </button>
  );
}
