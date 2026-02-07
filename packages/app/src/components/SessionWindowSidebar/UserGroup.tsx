import { useState } from 'react';
import { SessionItem } from './SessionItem';
import type { Session } from '@afw/shared';

export interface UserGroupProps {
  userId: string;
  sessions: Session[];
  followedSessionIds: string[];
  onFollow: (sessionId: string) => void;
  onUnfollow: (sessionId: string) => void;
}

/**
 * UserGroup - collapsible group of sessions for a user
 */
export function UserGroup({
  userId,
  sessions,
  followedSessionIds,
  onFollow,
  onUnfollow,
}: UserGroupProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const getInitials = (id: string): string => {
    return id.slice(0, 2).toUpperCase();
  };

  return (
    <div className="user-group">
      <div
        className="user-group-header"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="user-avatar">{getInitials(userId)}</div>
        <span className="user-name">{userId}</span>
        <span className="session-count-badge">{sessions.length}</span>
        <span className={`expand-icon ${isExpanded ? 'expanded' : ''}`}>
          ▼
        </span>
      </div>

      {isExpanded && (
        <div className="user-group-sessions">
          {sessions.map((session) => (
            <SessionItem
              key={session.id}
              session={session}
              isFollowed={followedSessionIds.includes(session.id)}
              onFollow={onFollow}
              onUnfollow={onUnfollow}
            />
          ))}
        </div>
      )}
    </div>
  );
}
