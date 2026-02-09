/**
 * SessionTile Component
 * Container for session visualization and interaction
 *
 * Layout:
 * - Left panel (25%): SessionDetailsPanel (top 40%) + SessionCliPanel (bottom 60%)
 * - Right panel (75%): HybridFlowViz (full height)
 * - SlidingWindow overlay for ConversationPanel
 *
 * Features:
 * - Header bar with session title, status badge, close/detach buttons
 * - Conversation button to open SlidingWindow
 * - Resizable panels (optional)
 * - Compact mode for smaller layouts
 * - Responsive design (vertical stack on narrow screens)
 */

import React, { useState, useCallback, useMemo } from 'react';
import type { Session } from '@afw/shared';
import { SessionDetailsPanel } from './SessionDetailsPanel';
import { SessionCliPanel } from './SessionCliPanel';
import { HybridFlowViz } from './HybridFlowViz';
import { SlidingWindow } from './SlidingWindow';
import { ConversationPanel } from '../ConversationPanel/ConversationPanel';
import './SessionTile.css';

export interface SessionTileProps {
  /** Session data to display */
  session: Session;

  /** Callback when close button is clicked */
  onClose?: () => void;

  /** Callback when detach button is clicked */
  onDetach?: () => void;

  /** Enable compact mode for 3-4 tile layouts */
  compact?: boolean;

  /** Callback when user submits input in conversation panel */
  onSubmitInput?: (input: string) => Promise<void>;

  /** Callback when a node in the flow visualization is clicked */
  onNodeClick?: (nodeId: string) => void;

  /** Callback when an agent avatar is clicked */
  onAgentClick?: (agentId: string) => void;

  /** Show agents overlay on flow visualization (default: true) */
  showAgents?: boolean;
}

/**
 * SessionTile - Main container component for session display
 */
export function SessionTile({
  session,
  onClose,
  onDetach,
  compact = false,
  onSubmitInput,
  onNodeClick,
  onAgentClick,
  showAgents = true,
}: SessionTileProps): React.ReactElement {
  const [isConversationOpen, setIsConversationOpen] = useState(false);
  const [leftPanelWidth, setLeftPanelWidth] = useState(25); // Percentage

  /**
   * Get session title (from current chain or fallback)
   */
  const sessionTitle = useMemo(() => {
    if (session.currentChain?.title) {
      return session.currentChain.title;
    }
    if (session.chains.length > 0 && session.chains[0]?.title) {
      return session.chains[0].title;
    }
    return `Session ${session.id.substring(0, 8)}`;
  }, [session]);

  /**
   * Get status badge color
   */
  const statusColor = useMemo(() => {
    switch (session.status) {
      case 'in_progress':
      case 'active':
        return 'green';
      case 'completed':
        return 'blue';
      case 'failed':
      case 'error':
        return 'red';
      case 'paused':
        return 'yellow';
      default:
        return 'gray';
    }
  }, [session.status]);

  /**
   * Get chain for visualization (use current or first available)
   */
  const activeChain = useMemo(() => {
    return session.currentChain || session.chains[0];
  }, [session]);

  /**
   * Open conversation panel
   */
  const handleOpenConversation = useCallback(() => {
    setIsConversationOpen(true);
  }, []);

  /**
   * Close conversation panel
   */
  const handleCloseConversation = useCallback(() => {
    setIsConversationOpen(false);
  }, []);

  /**
   * Handle conversation input submission
   */
  const handleSubmitInput = useCallback(
    async (input: string) => {
      if (onSubmitInput) {
        await onSubmitInput(input);
      } else {
        console.warn('SessionTile: onSubmitInput prop not provided');
      }
    },
    [onSubmitInput]
  );

  return (
    <div className={`session-tile ${compact ? 'compact' : ''}`.trim()}>
      {/* Header Bar */}
      <div className="session-tile__header">
        <div className="session-tile__header-left">
          <h2 className="session-tile__title" title={sessionTitle}>
            {sessionTitle}
          </h2>
          <div className={`session-tile__status-badge status-${statusColor}`}>
            <span className="status-dot" />
            <span className="status-text">{session.status}</span>
          </div>
        </div>

        <div className="session-tile__header-right">
          {/* Conversation Button */}
          <button
            className="session-tile__header-button"
            onClick={handleOpenConversation}
            title="Open conversation panel"
            aria-label="Open conversation"
          >
            <svg
              className="header-button-icon"
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="currentColor"
            >
              <path d="M2.5 1A1.5 1.5 0 0 0 1 2.5v8A1.5 1.5 0 0 0 2.5 12h1.586l2.707 2.707a1 1 0 0 0 1.414 0L11.414 12H13.5A1.5 1.5 0 0 0 15 10.5v-8A1.5 1.5 0 0 0 13.5 1h-11z" />
            </svg>
            <span className="header-button-label">Conversation</span>
          </button>

          {/* Detach Button */}
          {onDetach && (
            <button
              className="session-tile__header-button"
              onClick={onDetach}
              title="Detach to separate window"
              aria-label="Detach session"
            >
              <svg
                className="header-button-icon"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="currentColor"
              >
                <path d="M6.5 2a.5.5 0 0 0 0 1h3.793L3.146 10.146a.5.5 0 0 0 .708.708L11 3.707V7.5a.5.5 0 0 0 1 0v-5a.5.5 0 0 0-.5-.5h-5z" />
                <path d="M2 3a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V7.5a.5.5 0 0 0-1 0V14H2V4h6.5a.5.5 0 0 0 0-1H2z" />
              </svg>
              <span className="header-button-label">Detach</span>
            </button>
          )}

          {/* Close Button */}
          {onClose && (
            <button
              className="session-tile__header-button session-tile__close-button"
              onClick={onClose}
              title="Close session tile"
              aria-label="Close session"
            >
              <svg
                className="header-button-icon"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="currentColor"
              >
                <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854z" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Main Content - Left/Right Split */}
      <div className="session-tile__content">
        {/* Left Panel - Details + CLI */}
        <div
          className="session-tile__left-panel"
          style={{ width: `${leftPanelWidth}%` }}
        >
          {/* Top - Session Details (40%) */}
          <div className="session-tile__details-section">
            <SessionDetailsPanel session={session} compact={compact} />
          </div>

          {/* Bottom - CLI Terminal (60%) */}
          <div className="session-tile__cli-section">
            <SessionCliPanel sessionId={session.id} height="100%" />
          </div>
        </div>

        {/* Right Panel - Flow Visualization */}
        <div
          className="session-tile__right-panel"
          style={{ width: `${100 - leftPanelWidth}%` }}
        >
          {activeChain ? (
            <HybridFlowViz
              sessionId={session.id}
              chain={activeChain}
              chainId={activeChain.id}
              onNodeClick={onNodeClick}
              onAgentClick={onAgentClick}
              showAgents={showAgents}
              enableAnimations={!compact}
              overlayPosition="bottom-right"
              overlayOpacity={0.9}
            />
          ) : (
            <div className="session-tile__no-chain">
              <p>No active chain to visualize</p>
            </div>
          )}
        </div>
      </div>

      {/* Sliding Window - Conversation Panel */}
      <SlidingWindow
        isOpen={isConversationOpen}
        onClose={handleCloseConversation}
        title="Conversation"
        width={500}
        minWidth={350}
        maxWidth={700}
      >
        <ConversationPanel
          session={session}
          onSubmitInput={handleSubmitInput}
        />
      </SlidingWindow>
    </div>
  );
}
