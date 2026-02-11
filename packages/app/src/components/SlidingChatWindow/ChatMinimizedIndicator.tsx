/**
 * ChatMinimizedIndicator Component
 *
 * A 40px floating circle that represents the minimized chat.
 * Displays an unread message count badge and can be clicked to restore the chat.
 * Follows cosmic aesthetic with glow effects and smooth animations.
 */

import React from 'react';
import './ChatMinimizedIndicator.css';

interface ChatMinimizedIndicatorProps {
  /** Number of unread messages */
  unreadCount: number;
  /** Click handler to restore chat */
  onClick: () => void;
}

export const ChatMinimizedIndicator: React.FC<ChatMinimizedIndicatorProps> = ({
  unreadCount,
  onClick,
}) => {
  return (
    <button
      className="chat-minimized-indicator"
      onClick={onClick}
      aria-label={`Restore chat. ${unreadCount > 0 ? `${unreadCount} unread message${unreadCount > 1 ? 's' : ''}` : 'No unread messages'}`}
      type="button"
    >
      <div className="chat-minimized-indicator__icon">💬</div>
      {unreadCount > 0 && (
        <div className="chat-minimized-indicator__badge" aria-live="polite">
          {unreadCount > 99 ? '99+' : unreadCount}
        </div>
      )}
    </button>
  );
};
