/**
 * SlidingChatWindow Component
 *
 * A responsive sliding panel for chat interactions.
 * Slides in from the right side with smooth transitions.
 * Provides header with title, source indicator, and close button.
 * Supports draggable left-edge resize handle with localStorage persistence.
 */

import React, { useRef, useCallback } from 'react';
import { useChatWindowContext } from '../../contexts/ChatWindowContext';
import './SlidingChatWindow.css';

interface SlidingChatWindowProps {
  children: React.ReactNode;
}

export const SlidingChatWindow: React.FC<SlidingChatWindowProps> = ({ children }) => {
  const { isOpen, chatWidth, source, closeChat, setChatWidth } = useChatWindowContext();
  const panelRef = useRef<HTMLDivElement>(null);

  /**
   * Handle resize start - attach mouse move/up listeners and update cursor
   */
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = chatWidth;

    // Get container width for percentage calculation
    const container = panelRef.current?.parentElement;
    const containerWidth = container?.clientWidth || window.innerWidth;

    const handleMouseMove = (moveE: MouseEvent) => {
      // Negative deltaX = moving left = wider panel
      const deltaX = startX - moveE.clientX;
      const deltaPercent = (deltaX / containerWidth) * 100;
      const newWidth = startWidth + deltaPercent;

      // Clamp to 25-60% (matching ChatWindowContext constraints)
      const clampedWidth = Math.min(60, Math.max(25, newWidth));
      setChatWidth(clampedWidth);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [chatWidth, setChatWidth]);

  /**
   * Handle double-click to reset width to default (40%)
   */
  const handleDoubleClick = useCallback(() => {
    setChatWidth(40);
  }, [setChatWidth]);

  return (
    <div
      ref={panelRef}
      className="sliding-chat-window"
      style={{ width: isOpen ? `${chatWidth}%` : '0%' }}
    >
      <div
        className="sliding-chat-window__resize-handle"
        onMouseDown={handleResizeStart}
        onDoubleClick={handleDoubleClick}
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize chat panel"
        aria-valuenow={Math.round(chatWidth)}
        aria-valuemin={25}
        aria-valuemax={60}
      />
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
