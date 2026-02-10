/**
 * OrchestratorButton Component
 *
 * A wrapper component that adds a visual badge indicator to any child element,
 * signaling that clicking it will open the orchestrator chat window.
 * Fully keyboard accessible with Enter/Space support.
 */

import React, { useCallback } from 'react';
import { useChatWindowContext } from '../../contexts/ChatWindowContext';
import './OrchestratorButton.css';

export interface OrchestratorButtonProps {
  /** The element(s) to wrap with the orchestrator badge */
  children: React.ReactNode;
  /** Source identifier for the orchestrator chat (e.g., "harmony-recheck", "respect-rescore") */
  source: string;
  /** Additional context passed to openChat */
  context?: Record<string, unknown>;
  /** Accessibility label for the indicator badge */
  label?: string;
  /** Whether to show the visual indicator badge (default true) */
  showIndicator?: boolean;
  /** Additional CSS classes applied to the wrapper */
  className?: string;
  /** Optional callback invoked before opening chat */
  onClick?: () => void;
}

/**
 * OrchestratorButton
 * Wraps child elements with a click handler that opens the orchestrator chat,
 * and optionally displays a pulsing badge indicator.
 */
export const OrchestratorButton: React.FC<OrchestratorButtonProps> = ({
  children,
  source,
  context,
  label,
  showIndicator = true,
  className,
  onClick,
}) => {
  const { openChat } = useChatWindowContext();

  const handleClick = useCallback(() => {
    onClick?.();
    openChat(source, context);
  }, [onClick, source, context, openChat]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleClick();
      }
    },
    [handleClick]
  );

  const wrapperClasses = [
    'orchestrator-button',
    className || '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={wrapperClasses}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={label || `Open orchestrator chat: ${source}`}
    >
      {children}
      {showIndicator && (
        <span
          className="orchestrator-button__indicator"
          aria-hidden="true"
          title="Opens orchestrator chat"
        />
      )}
    </div>
  );
};

export default OrchestratorButton;
