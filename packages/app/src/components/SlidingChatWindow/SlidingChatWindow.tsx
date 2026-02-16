/**
 * SlidingChatWindow Component
 *
 * A responsive sliding panel for chat interactions.
 * Slides in from the right side with smooth transitions.
 * Provides header with title, source indicator, and close button.
 * Supports draggable left-edge resize handle with localStorage persistence.
 */

import React, { useRef, useCallback, useState } from 'react';
import { useChatWindowContext } from '../../contexts/ChatWindowContext';
import { useSessionContext } from '../../contexts/SessionContext';
import { useActiveChain } from '../../hooks/useActiveChain';
import { useActivityFeed } from '../../hooks/useActivityFeed';
import type { SessionId } from '@afw/shared';
import { HybridFlowViz } from '../SessionTile/HybridFlowViz';
import { ReactFlowProvider } from 'reactflow';
import { ChatMinimizedIndicator } from './ChatMinimizedIndicator';
import { ActivityFeed } from '../shared/ActivityFeed';
import './SlidingChatWindow.css';

interface SlidingChatWindowProps {
  children: React.ReactNode;
  /** Embedded mode disables sliding mechanics, renders as full-width panel */
  embedded?: boolean;
}

export const SlidingChatWindow: React.FC<SlidingChatWindowProps> = ({ children, embedded = false }) => {
  const { isOpen, chatWidth, source, sessionId, closeChat, setChatWidth, setSessionId, isMinimized, unreadCount, minimizeChat, restoreChat, openChat } = useChatWindowContext();
  const { sessions } = useSessionContext();
  const panelRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<'chat' | 'flow' | 'activity'>('chat');

  // Fetch active chain for flow visualization
  const { activeChain, loading: chainLoading } = useActiveChain(sessionId || ('' as SessionId));

  // Fetch activity feed items
  const { items: activityItems, isLoading: activityLoading } = useActivityFeed(sessionId || undefined);

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
    setChatWidth(30);
  }, [setChatWidth]);

  // In embedded mode, always render at full width without sliding mechanics
  const effectiveWidth = embedded ? '100%' : (isOpen ? `${chatWidth}%` : '0%');
  const showResizeHandle = !embedded;

  // If minimized, show floating indicator instead of full chat
  if (isMinimized && !embedded) {
    return <ChatMinimizedIndicator unreadCount={unreadCount} onClick={restoreChat} />;
  }

  return (
    <div
      ref={panelRef}
      className={`sliding-chat-window ${embedded ? 'sliding-chat-window--embedded' : ''}`}
      style={{ width: effectiveWidth }}
    >
      {showResizeHandle && (
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
      )}
      <div className="sliding-chat-window__header">
        <span className="sliding-chat-window__title">Chat</span>
        {source && (
          <span className="sliding-chat-window__source">{source}</span>
        )}
        <select
          className="sliding-chat-window__session-select"
          value={sessionId || ''}
          onChange={(e) => {
            const val = e.target.value ? e.target.value as SessionId : null;
            setSessionId(val);
            if (val && !isOpen) openChat('session-select');
          }}
          aria-label="Select chat session"
        >
          <option value="">No session</option>
          {sessions.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name || s.id}
            </option>
          ))}
        </select>
        {!embedded && (
          <button
            className="sliding-chat-window__minimize-btn"
            onClick={minimizeChat}
            aria-label="Minimize chat panel"
            type="button"
          >
            −
          </button>
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

      {/* Tab Navigation */}
      <div className="sliding-chat-window__tabs">
        <button
          className={`sliding-chat-window__tab ${activeTab === 'chat' ? 'sliding-chat-window__tab--active' : ''}`}
          onClick={() => setActiveTab('chat')}
          aria-selected={activeTab === 'chat'}
          role="tab"
          type="button"
        >
          Chat
        </button>
        <button
          className={`sliding-chat-window__tab ${activeTab === 'flow' ? 'sliding-chat-window__tab--active' : ''}`}
          onClick={() => setActiveTab('flow')}
          aria-selected={activeTab === 'flow'}
          role="tab"
          type="button"
        >
          Flow
        </button>
        <button
          className={`sliding-chat-window__tab ${activeTab === 'activity' ? 'sliding-chat-window__tab--active' : ''}`}
          onClick={() => setActiveTab('activity')}
          aria-selected={activeTab === 'activity'}
          role="tab"
          type="button"
        >
          Activity
        </button>
      </div>

      {/* Tab Content */}
      <div className="sliding-chat-window__body" role="tabpanel">
        {activeTab === 'chat' ? (
          children
        ) : activeTab === 'flow' ? (
          <div className="sliding-chat-window__flow-container">
            {chainLoading ? (
              <div className="sliding-chat-window__empty-state">
                <div className="empty-state__icon">⏳</div>
                <div className="empty-state__title">Loading Flow...</div>
              </div>
            ) : activeChain && sessionId ? (
              <ReactFlowProvider>
                <HybridFlowViz
                  sessionId={sessionId}
                  chain={activeChain}
                  chainId={activeChain.id}
                  enableAnimations={true}
                  showAgents={true}
                />
              </ReactFlowProvider>
            ) : (
              <div className="sliding-chat-window__empty-state">
                <div className="empty-state__icon">📊</div>
                <div className="empty-state__title">No Active Chain</div>
                <div className="empty-state__message">
                  Flow visualization will appear here once a chain is compiled.
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="sliding-chat-window__activity-container">
            {activityLoading ? (
              <div className="sliding-chat-window__empty-state">
                <div className="empty-state__icon">⏳</div>
                <div className="empty-state__title">Loading Activity...</div>
              </div>
            ) : (
              <ActivityFeed items={activityItems} emptyMessage="No recent activity" />
            )}
          </div>
        )}
      </div>
    </div>
  );
};
