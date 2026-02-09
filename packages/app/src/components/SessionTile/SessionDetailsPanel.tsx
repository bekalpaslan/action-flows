/**
 * SessionDetailsPanel Component
 * Displays session metadata and status in the left panel of a SessionTile
 *
 * Features:
 * - Session ID with copy-to-clipboard
 * - Status badge (in_progress, completed, failed)
 * - Working directory (truncated)
 * - Timestamps (relative and absolute)
 * - Chain count and active chain info
 * - Compact mode for smaller tiles
 */

import React, { useCallback, useState } from 'react';
import type { Session } from '@afw/shared';
import './SessionDetailsPanel.css';

export interface SessionDetailsPanelProps {
  /** Session data to display */
  session: Session;
  /** Enable compact layout for smaller tiles */
  compact?: boolean;
}

/**
 * Format timestamp as relative time (e.g., "5m ago", "2h ago")
 */
function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'just now';
}

/**
 * Format duration in milliseconds to human-readable string
 */
function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}

/**
 * Truncate path for display (show last 2 segments)
 */
function truncatePath(path: string, maxSegments = 2): string {
  const segments = path.split(/[/\\]/);
  if (segments.length <= maxSegments) return path;
  return '...' + segments.slice(-maxSegments).join('/');
}

/**
 * Truncate session ID for display
 */
function truncateSessionId(id: string): string {
  if (id.length <= 12) return id;
  return `${id.substring(0, 8)}...${id.substring(id.length - 4)}`;
}

/**
 * Get status badge color
 */
function getStatusColor(status: string): string {
  switch (status) {
    case 'in_progress':
    case 'active':
      return 'green';
    case 'completed':
      return 'gray';
    case 'failed':
    case 'error':
      return 'red';
    case 'paused':
      return 'yellow';
    default:
      return 'gray';
  }
}

/**
 * Get status display text
 */
function getStatusText(status: string): string {
  switch (status) {
    case 'in_progress':
      return 'In Progress';
    case 'completed':
      return 'Completed';
    case 'failed':
      return 'Failed';
    case 'paused':
      return 'Paused';
    case 'active':
      return 'Active';
    default:
      return status;
  }
}

/**
 * SessionDetailsPanel - Left panel of SessionTile showing session metadata
 */
export function SessionDetailsPanel({
  session,
  compact = false,
}: SessionDetailsPanelProps): React.ReactElement {
  const [copyTooltip, setCopyTooltip] = useState<string>('Copy');

  /**
   * Copy session ID to clipboard
   */
  const handleCopyId = useCallback(() => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(session.id).then(() => {
        setCopyTooltip('Copied!');
        setTimeout(() => setCopyTooltip('Copy'), 2000);
      });
    }
  }, [session.id]);

  // Calculate chain metrics
  const chainCount = session.chains.length;
  const activeChain = session.currentChain;
  const duration = session.duration
    ? formatDuration(session.duration)
    : session.status === 'in_progress'
    ? formatDuration(Date.now() - session.startedAt)
    : undefined;

  // Status badge color
  const statusColor = getStatusColor(session.status);
  const statusText = getStatusText(session.status);

  return (
    <div
      className={`session-details-panel ${compact ? 'compact' : ''}`.trim()}
      role="complementary"
      aria-label="Session details"
    >
      {/* Header - Session ID */}
      <div className="details-section details-header">
        <div className="session-id-row">
          <span className="label">ID</span>
          <button
            className="session-id-button"
            onClick={handleCopyId}
            title={copyTooltip}
            aria-label="Copy session ID"
          >
            <span className="session-id-text">
              {truncateSessionId(session.id)}
            </span>
            <svg
              className="copy-icon"
              width="14"
              height="14"
              viewBox="0 0 16 16"
              fill="currentColor"
            >
              <path d="M4 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V2z" />
              <path d="M2 6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-1H6a3 3 0 0 1-3-3V6H2z" />
            </svg>
          </button>
        </div>

        {/* Status Badge */}
        <div className={`status-badge status-${statusColor}`}>
          <span className="status-dot" />
          <span className="status-text">{statusText}</span>
        </div>
      </div>

      {/* Working Directory */}
      <div className="details-section">
        <div className="detail-row">
          <svg
            className="detail-icon"
            width="14"
            height="14"
            viewBox="0 0 16 16"
            fill="currentColor"
          >
            <path d="M1 3.5A1.5 1.5 0 0 1 2.5 2h3.879a1.5 1.5 0 0 1 1.06.44l1.122 1.12A.5.5 0 0 0 9.207 4H13.5A1.5 1.5 0 0 1 15 5.5v7a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 1 12.5v-9z" />
          </svg>
          <span className="detail-label">CWD</span>
          <span className="detail-value" title={session.cwd}>
            {truncatePath(session.cwd, compact ? 1 : 2)}
          </span>
        </div>
      </div>

      {/* Timestamps */}
      <div className="details-section">
        <div className="detail-row">
          <svg
            className="detail-icon"
            width="14"
            height="14"
            viewBox="0 0 16 16"
            fill="currentColor"
          >
            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
            <path d="M8 4.5a.5.5 0 0 0-1 0v4a.5.5 0 0 0 .146.354l2.5 2.5a.5.5 0 0 0 .708-.708L8 8.293V4.5z" />
          </svg>
          <span className="detail-label">Started</span>
          <span className="detail-value" title={new Date(session.startedAt).toLocaleString()}>
            {formatRelativeTime(session.startedAt)}
          </span>
        </div>

        {duration && (
          <div className="detail-row">
            <svg
              className="detail-icon"
              width="14"
              height="14"
              viewBox="0 0 16 16"
              fill="currentColor"
            >
              <path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71V3.5z" />
              <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0z" />
            </svg>
            <span className="detail-label">Duration</span>
            <span className="detail-value">{duration}</span>
          </div>
        )}
      </div>

      {/* Chain Metrics */}
      <div className="details-section">
        <div className="detail-row">
          <svg
            className="detail-icon"
            width="14"
            height="14"
            viewBox="0 0 16 16"
            fill="currentColor"
          >
            <path d="M4.879 4.515a.5.5 0 0 1 .606.364l1.5 6a.5.5 0 0 1-.97.242l-1.5-6a.5.5 0 0 1 .364-.606zm6.242 0a.5.5 0 0 0-.606.364l-1.5 6a.5.5 0 1 0 .97.242l1.5-6a.5.5 0 0 0-.364-.606zM7 9.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 0 1h-1a.5.5 0 0 1-.5-.5z" />
          </svg>
          <span className="detail-label">Chains</span>
          <span className="detail-value">{chainCount}</span>
        </div>

        {/* Active Chain Info */}
        {activeChain && (
          <div className="active-chain-section">
            <div className="active-chain-header">
              <svg
                className="detail-icon"
                width="12"
                height="12"
                viewBox="0 0 16 16"
                fill="currentColor"
              >
                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
                <path d="M5 6.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5zm0 3a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5z" />
              </svg>
              <span className="active-chain-label">Active Chain</span>
            </div>
            <div className="active-chain-info">
              <div className="active-chain-title" title={activeChain.title}>
                {compact
                  ? activeChain.title.substring(0, 20) + (activeChain.title.length > 20 ? '...' : '')
                  : activeChain.title}
              </div>
              <div className="active-chain-metrics">
                <span className="metric">
                  {activeChain.steps.length} step{activeChain.steps.length !== 1 ? 's' : ''}
                </span>
                {activeChain.currentStep && (
                  <>
                    <span className="metric-separator">·</span>
                    <span className="metric">
                      Step {activeChain.currentStep}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Platform Info (only in non-compact mode) */}
      {!compact && session.platform && (
        <div className="details-section details-footer">
          <div className="detail-row">
            <svg
              className="detail-icon"
              width="14"
              height="14"
              viewBox="0 0 16 16"
              fill="currentColor"
            >
              <path d="M5 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm4 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 1a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" />
            </svg>
            <span className="detail-value platform-value">
              {session.platform}
              {session.hostname && ` · ${session.hostname}`}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
