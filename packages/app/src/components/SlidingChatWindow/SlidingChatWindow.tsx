/**
 * SlidingChatWindow Component
 *
 * A responsive sliding panel for chat interactions.
 * Slides in from the right side with smooth transitions.
 * Provides header with title, source indicator, and close button.
 * Supports draggable left-edge resize handle with localStorage persistence.
 */

import React, { useState, useMemo } from 'react';
import { useChatWindowContext } from '../../contexts/ChatWindowContext';
import { useSessionContext } from '../../contexts/SessionContext';
import { useWorkbenchContext } from '../../contexts/WorkbenchContext';
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
  const { isOpen, source, sessionId, closeChat, setSessionId, isMinimized, isCollapsed, unreadCount, minimizeChat, restoreChat, toggleCollapse, expandChat, openChat } = useChatWindowContext();
  const { sessions } = useSessionContext();
  const { activeWorkbench } = useWorkbenchContext();
  const [activeTab, setActiveTab] = useState<'chat' | 'flow' | 'activity'>('chat');

  // Filter sessions to only show those belonging to the active workbench
  const workbenchSessions = useMemo(() => {
    return sessions.filter(s => s.workbenchId === activeWorkbench);
  }, [sessions, activeWorkbench]);

  // Fetch active chain for flow visualization
  const { activeChain, loading: chainLoading } = useActiveChain(sessionId || ('' as SessionId));

  // Fetch activity feed items
  const { items: activityItems, isLoading: activityLoading } = useActivityFeed(sessionId || undefined);

  // If minimized, show floating indicator instead of full chat
  if (isMinimized && !embedded) {
    return <ChatMinimizedIndicator unreadCount={unreadCount} onClick={restoreChat} />;
  }

  // If collapsed and open, show only the collapse strip
  if (isCollapsed && isOpen && !embedded) {
    return (
      <div className="sliding-chat-window sliding-chat-window--collapsed">
        <div className="sliding-chat-window__collapse-strip">
          <button
            className="sliding-chat-window__expand-btn"
            onClick={expandChat}
            aria-label="Expand chat"
            title="Expand chat"
            type="button"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`sliding-chat-window ${embedded ? 'sliding-chat-window--embedded' : ''} ${!isOpen && !embedded ? 'sliding-chat-window--hidden' : ''}`}
    >
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
          {workbenchSessions.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name || `Session ${s.id.slice(-6)}`}
            </option>
          ))}
        </select>
        {!embedded && (
          <>
            <button
              className="sliding-chat-window__collapse-btn"
              onClick={toggleCollapse}
              aria-label="Collapse chat"
              title="Collapse chat"
              type="button"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button
              className="sliding-chat-window__minimize-btn"
              onClick={minimizeChat}
              aria-label="Minimize chat panel"
              type="button"
            >
              −
            </button>
          </>
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
