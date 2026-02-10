/**
 * SlidingChatWindow Component
 *
 * A responsive sliding panel for chat interactions.
 * Slides in from the right side with smooth transitions.
 * Provides header with title, source indicator, and close button.
 */

import React from 'react';
import { useChatWindowContext } from '../../contexts/ChatWindowContext';
import './SlidingChatWindow.css';

interface SlidingChatWindowProps {
  children: React.ReactNode;
}

export const SlidingChatWindow: React.FC<SlidingChatWindowProps> = ({ children }) => {
  const { isOpen, chatWidth, source, closeChat } = useChatWindowContext();

  return (
    <div
      className="sliding-chat-window"
      style={{ width: isOpen ? `${chatWidth}%` : '0%' }}
    >
      <div className="sliding-chat-window__header">
        <span className="sliding-chat-window__title">Chat</span>
        {source && (
          <span className="sliding-chat-window__source">{source}</span>
        )}
        <button
          className="sliding-chat-window__close-btn"
          onClick={closeChat}
          aria-label="Close chat panel"
          type="button"
        >
          ×
        </button>
      </div>
      <div className="sliding-chat-window__body">
        {children}
      </div>
    </div>
  );
};
