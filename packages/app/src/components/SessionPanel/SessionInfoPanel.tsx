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

import React, { useCallback, useState, useEffect } from 'react';
import type { Session, LifecyclePhase } from '@afw/shared';
import { useFreshness } from '../../hooks/useFreshness';
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
  const [lifecyclePhase, setLifecyclePhase] = useState<LifecyclePhase | null>(null);

  // Fetch freshness data for this session
  const { grade, freshness } = useFreshness('session', session.id);

  // Fetch lifecycle phase
  useEffect(() => {
    const fetchLifecyclePhase = async () => {
      try {
        const response = await fetch(`http://localhost:3001/api/lifecycle/session?resourceId=${session.id}`);
        if (response.ok) {
          const data = await response.json();
          setLifecyclePhase(data.phase);
        }
      } catch (error) {
        console.error('Failed to fetch lifecycle phase:', error);
      }
    };

    fetchLifecyclePhase();
    // Poll every 30 seconds to keep phase up to date
    const interval = setInterval(fetchLifecyclePhase, 30000);
    return () => clearInterval(interval);
  }, [session.id]);

  // Check if session is active (has activity within 5 minutes)
  const isActive = React.useMemo(() => {
    if (!session.lastActivityAt) return false;
    const lastActivity = new Date(session.lastActivityAt).getTime();
    const now = Date.now();
    const inactiveDuration = now - lastActivity;
    return inactiveDuration < 5 * 60 * 1000; // 5 minutes
  }, [session.lastActivityAt]);

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
          {/* Row 1: Status + Freshness + Active + Lifecycle + Session ID */}
          <div className="info-row-compact">
            <div className={`status-badge status-${statusColor}`}>
              <span className="status-dot" />
              <span className="status-text">{statusText}</span>
            </div>
            {grade && (
              <div
                className={`freshness-indicator freshness-${grade}`}
                title={freshness ? `Last modified: ${formatRelativeTime(new Date(freshness.lastModifiedAt).getTime())}` : undefined}
              >
                <span className="freshness-dot" />
              </div>
            )}
            {isActive && (
              <div
                className="active-indicator"
                title="Session has recent activity (within 5 minutes)"
              >
                <span className="active-dot" />
                <span className="active-text">Active</span>
              </div>
            )}
            {lifecyclePhase && (
              <div
                className={`session-info__lifecycle-phase session-info__lifecycle-phase--${lifecyclePhase}`}
                title={`Lifecycle phase: ${lifecyclePhase}`}
              >
                {lifecyclePhase === 'active' && '🟢'}
                {lifecyclePhase === 'idle' && '⚪'}
                {lifecyclePhase === 'expiring' && '🟠'}
                {lifecyclePhase === 'evicted' && '🔴'}
                <span className="lifecycle-text">{lifecyclePhase.charAt(0).toUpperCase() + lifecyclePhase.slice(1)}</span>
              </div>
            )}
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
