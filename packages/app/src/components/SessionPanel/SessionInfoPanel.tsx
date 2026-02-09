/**
 * SessionInfoPanel Component
 * Displays session metadata in a narrow vertical panel (refactored from SessionDetailsPanel)
 *
 * Features:
 * - Session ID with copy-to-clipboard
 * - Status badge (in_progress, completed, failed)
 * - Working directory (truncated)
 * - Timestamps (relative and absolute)
 * - Chain count and active chain info
 * - Optimized for narrow 25% panel width (160-280px)
 * - Fixed height (120px) with overflow-y: auto
 * - Collapsible header
 */

import React, { useCallback, useState } from 'react';
import type { Session } from '@afw/shared';
import './SessionInfoPanel.css';

export interface SessionInfoPanelProps {
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
 * SessionInfoPanel - Narrow vertical panel showing session metadata
 * Refactored from SessionDetailsPanel for persistent 25% left panel layout
 */
export function SessionInfoPanel({
  session,
  compact = false,
}: SessionInfoPanelProps): React.ReactElement {
  const [copyTooltip, setCopyTooltip] = useState<string>('Copy');
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

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

  /**
   * Toggle collapse state
   */
  const toggleCollapse = useCallback(() => {
    setIsCollapsed(prev => !prev);
  }, []);

  // Calculate chain metrics
  const chainCount = session.chains.length;
  const activeChain = session.currentChain;
  const duration = session.duration
    ? formatDuration(session.duration)
    : session.status === 'in_progress'
    ? formatDuration(Date.now() - new Date(session.startedAt).getTime())
    : undefined;

  // Status badge color
  const statusColor = getStatusColor(session.status);
  const statusText = getStatusText(session.status);

  return (
    <div
      className={`session-info-panel ${compact ? 'compact' : ''} ${isCollapsed ? 'collapsed' : ''}`.trim()}
      role="complementary"
      aria-label="Session information"
    >
      {/* Collapsible Header */}
      <div className="info-panel-header" onClick={toggleCollapse}>
        <h3 className="panel-title">Session Info</h3>
        <button
          className="collapse-toggle"
          aria-label={isCollapsed ? 'Expand panel' : 'Collapse panel'}
          onClick={(e) => {
            e.stopPropagation();
            toggleCollapse();
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 16 16"
            fill="currentColor"
            className={`collapse-icon ${isCollapsed ? 'collapsed' : ''}`}
          >
            <path d="M4.427 9.573l3.396-3.396a.25.25 0 0 1 .354 0l3.396 3.396a.25.25 0 0 1-.177.427H4.604a.25.25 0 0 1-.177-.427z" />
          </svg>
        </button>
      </div>

      {/* Panel Content — Compact horizontal layout */}
      {!isCollapsed && (
        <div className="info-panel-content">
          {/* Row 1: Status + Session ID */}
          <div className="info-row-compact">
            <div className={`status-badge status-${statusColor}`}>
              <span className="status-dot" />
              <span className="status-text">{statusText}</span>
            </div>
            <button
              className="session-id-button"
              onClick={handleCopyId}
              title={copyTooltip}
              aria-label="Copy session ID"
            >
              <span className="session-id-text">
                {truncateSessionId(session.id)}
              </span>
              <svg className="copy-icon" width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                <path d="M4 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V2z" />
                <path d="M2 6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-1H6a3 3 0 0 1-3-3V6H2z" />
              </svg>
            </button>
          </div>

          {/* Row 2: Path + Time + Chains — compact chips */}
          <div className="info-row-compact">
            <span className="info-chip" title={session.cwd}>
              {truncatePath(session.cwd, 2)}
            </span>
            <span className="info-chip" title={new Date(session.startedAt).toLocaleString()}>
              {formatRelativeTime(new Date(session.startedAt).getTime())}
            </span>
            {duration && <span className="info-chip">{duration}</span>}
            <span className="info-chip">{chainCount} chain{chainCount !== 1 ? 's' : ''}</span>
          </div>

          {/* Active Chain (only when present) */}
          {activeChain && (
            <div className="info-row-compact">
              <span className="info-chip info-chip--active" title={activeChain.title}>
                {activeChain.title}
              </span>
              <span className="info-chip">
                {activeChain.steps.length} step{activeChain.steps.length !== 1 ? 's' : ''}
                {activeChain.currentStep ? ` · Step ${activeChain.currentStep}` : ''}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
