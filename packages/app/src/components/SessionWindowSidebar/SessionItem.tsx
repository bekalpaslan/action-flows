import type { Session } from '@afw/shared';

export interface SessionItemProps {
  session: Session;
  isFollowed: boolean;
  onFollow: (sessionId: string) => void;
  onUnfollow: (sessionId: string) => void;
}

/**
 * SessionItem - individual session in sidebar with follow button
 */
export function SessionItem({
  session,
  isFollowed,
  onFollow,
  onUnfollow,
}: SessionItemProps) {
  const handleFollowClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isFollowed) {
      onUnfollow(session.id);
    } else {
      onFollow(session.id);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'in_progress':
        return 'status-badge-active';
      case 'completed':
        return 'status-badge-completed';
      case 'failed':
        return 'status-badge-failed';
      default:
        return 'status-badge-pending';
    }
  };

  // Truncate session ID for display
  const displayId = session.id.length > 20
    ? `${session.id.slice(0, 17)}...`
    : session.id;

  const hasCurrentChain = session.currentChain !== undefined;

  return (
    <div className={`session-item ${isFollowed ? 'followed' : ''}`}>
      <div className="session-item-header">
        <span className="session-id" title={session.id}>
          {displayId}
        </span>
        <button
          className={`follow-btn ${isFollowed ? 'followed' : ''}`}
          onClick={handleFollowClick}
          title={isFollowed ? 'Unfollow' : 'Follow'}
        >
          {isFollowed ? '★' : '☆'}
        </button>
      </div>

      <div className="session-item-meta">
        <span className={`status-badge ${getStatusBadgeClass(session.status)}`}>
          {session.status}
        </span>
        {hasCurrentChain && (
          <span className="cli-indicator" title="CLI session active">
            CLI
          </span>
        )}
      </div>
    </div>
  );
}
