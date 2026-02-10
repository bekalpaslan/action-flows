import type { Session, SessionId, WorkbenchId } from '@afw/shared';
import { GlowIndicator } from '../common';
import { useNotificationGlowContext } from '../../hooks/useNotificationGlow';
import './SessionSidebarItem.css';

export interface SessionSidebarItemProps {
  /** The session to display */
  session: Session;
  /** Notification count (0 = no badge) */
  notificationCount: number;
  /** Whether this session is currently attached */
  isActive: boolean;
  /** Handler for click-to-attach */
  onClick: () => void;
  /** Handler for session deletion */
  onDelete?: (sessionId: SessionId) => void;
  /** Optional routing context from session metadata */
  routingContext?: WorkbenchId;
  /** Optional routing confidence score (0-1) */
  routingConfidence?: number;
  /** Optional routing method */
  routingMethod?: 'automatic' | 'disambiguated' | 'manual';
}

/**
 * SessionSidebarItem component - displays a compact session item in the sidebar
 *
 * Features:
 * - Status indicator dot (green=in_progress, gray=completed, red=failed)
 * - Session name/id with ellipsis truncation
 * - Relative time indicator ("2m ago", "1h ago")
 * - Notification badge with pulsing glow
 * - Active state highlight
 * - Hover state with smooth transitions
 * - Full keyboard accessibility
 */
export function SessionSidebarItem({
  session,
  notificationCount,
  isActive,
  onClick,
  onDelete,
  routingContext,
  routingConfidence,
  routingMethod,
}: SessionSidebarItemProps) {
  /**
   * Get status CSS class based on session status
   */
  const getStatusClass = (status: string): string => {
    switch (status) {
      case 'in_progress':
        return 'status-in-progress';
      case 'completed':
        return 'status-completed';
      case 'failed':
        return 'status-failed';
      default:
        return 'status-idle';
    }
  };

  /**
   * Format timestamp as relative time
   */
  const formatRelativeTime = (timestamp: string): string => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diff = now.getTime() - date.getTime();

      // Less than a minute ago
      if (diff < 60000) {
        return 'now';
      }

      // Less than an hour ago
      if (diff < 3600000) {
        const minutes = Math.floor(diff / 60000);
        return `${minutes}m ago`;
      }

      // Less than a day ago
      if (diff < 86400000) {
        const hours = Math.floor(diff / 3600000);
        return `${hours}h ago`;
      }

      // Less than a week ago
      if (diff < 604800000) {
        const days = Math.floor(diff / 86400000);
        return `${days}d ago`;
      }

      // More than a week ago - show date
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return '';
    }
  };

  /**
   * Get session display name (use metadata.name or truncated ID)
   */
  const getSessionName = (): string => {
    if (session.metadata?.name && typeof session.metadata.name === 'string') {
      return session.metadata.name;
    }
    // Truncate session ID for display
    return session.id.length > 12 ? `${session.id.substring(0, 12)}...` : session.id;
  };

  /**
   * Handle keyboard activation
   */
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick();
    }
  };

  /**
   * Handle session deletion
   */
  const handleDelete = (event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent session click

    const sessionName = getSessionName();
    const confirmed = window.confirm(
      `Are you sure you want to delete session "${sessionName}"?\n\nThis action cannot be undone.`
    );

    if (confirmed && onDelete) {
      onDelete(session.id);
    }
  };

  /**
   * Get confidence level CSS class for routing badge
   */
  const getConfidenceClass = (confidence?: number): string => {
    if (!confidence) return 'confidence-low';
    if (confidence >= 0.9) return 'confidence-high';
    if (confidence >= 0.5) return 'confidence-medium';
    return 'confidence-low';
  };

  /**
   * Format context display name
   */
  const formatContextName = (context: WorkbenchId): string => {
    return context.charAt(0).toUpperCase() + context.slice(1);
  };

  const statusClass = getStatusClass(session.status);
  const relativeTime = formatRelativeTime(session.startedAt);
  const sessionName = getSessionName();
  const hasNotifications = notificationCount > 0;
  const hasRouting = !!routingContext;
  const confidenceClass = getConfidenceClass(routingConfidence);

  // Get session-level glow state from notification context
  const { getSessionGlow } = useNotificationGlowContext();
  const glowState = getSessionGlow(session.id);

  return (
    <GlowIndicator
      active={glowState.active}
      level={glowState.level}
      intensity={glowState.intensity}
      pulse={glowState.active}
      className="session-sidebar-glow-wrapper"
    >
      <div
        className={`session-sidebar-item ${isActive ? 'active' : ''} ${statusClass}`}
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={handleKeyDown}
        aria-label={`Session ${sessionName}, ${session.status}, ${relativeTime}${hasNotifications ? `, ${notificationCount} notifications` : ''}`}
      >
        {/* Status indicator dot */}
        <div className={`status-dot ${statusClass}`} aria-hidden="true" />

        {/* Session content */}
        <div className="session-info">
          <div className="session-name" title={session.id}>
            {sessionName}
          </div>
          <div className="session-time">{relativeTime}</div>
        </div>

        {/* Routing badge */}
        {hasRouting && (
          <div
            className={`routing-badge ${confidenceClass}`}
            title={`Routed to ${routingContext} (confidence: ${Math.round((routingConfidence || 0) * 100)}%)${routingMethod ? ` via ${routingMethod}` : ''}`}
            aria-label={`Routed to ${routingContext} context`}
          >
            {formatContextName(routingContext)}
          </div>
        )}

        {/* Notification badge */}
        {hasNotifications && (
          <div className="notification-badge" aria-label={`${notificationCount} notifications`}>
            {notificationCount > 99 ? '99+' : notificationCount}
          </div>
        )}

        {/* Delete button */}
        {onDelete && (
          <button
            className="session-delete-btn"
            onClick={handleDelete}
            aria-label={`Delete session ${sessionName}`}
            title="Delete session"
          >
            ×
          </button>
        )}
      </div>
    </GlowIndicator>
  );
}
