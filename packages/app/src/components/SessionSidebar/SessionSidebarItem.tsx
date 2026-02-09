import type { Session } from '@afw/shared';
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

  const statusClass = getStatusClass(session.status);
  const relativeTime = formatRelativeTime(session.startedAt);
  const sessionName = getSessionName();
  const hasNotifications = notificationCount > 0;

  return (
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

      {/* Notification badge */}
      {hasNotifications && (
        <div className="notification-badge" aria-label={`${notificationCount} notifications`}>
          {notificationCount > 99 ? '99+' : notificationCount}
        </div>
      )}
    </div>
  );
}
