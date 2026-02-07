import { useState } from 'react';
import { UserGroup } from './UserGroup';
import './SessionWindowSidebar.css';
import type { Session } from '@afw/shared';

export interface SessionWindowSidebarProps {
  sessions: Session[];
  followedSessionIds: string[];
  onFollow: (sessionId: string) => void;
  onUnfollow: (sessionId: string) => void;
}

/**
 * SessionWindowSidebar - collapsible sidebar for session management
 *
 * Features:
 * - User groups with expandable session lists
 * - Follow/unfollow session buttons
 * - Status indicators
 * - CLI attached badges
 */
export function SessionWindowSidebar({
  sessions,
  followedSessionIds,
  onFollow,
  onUnfollow,
}: SessionWindowSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Group sessions by user
  const sessionsByUser = sessions.reduce((acc, session) => {
    const userId = session.user || 'unknown';
    if (!acc[userId]) {
      acc[userId] = [];
    }
    acc[userId].push(session);
    return acc;
  }, {} as Record<string, Session[]>);

  const userIds = Object.keys(sessionsByUser);

  return (
    <aside className={`session-window-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="session-window-sidebar-header">
        <h3 className="session-window-sidebar-title">Sessions</h3>
        <button
          className="sidebar-toggle-btn"
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? 'Expand' : 'Collapse'}
        >
          {isCollapsed ? '→' : '←'}
        </button>
      </div>

      {!isCollapsed && (
        <div className="session-window-sidebar-content">
          {userIds.length === 0 ? (
            <div className="sidebar-empty">
              <p>No sessions available</p>
            </div>
          ) : (
            userIds.map((userId) => (
              <UserGroup
                key={userId}
                userId={userId}
                sessions={sessionsByUser[userId]}
                followedSessionIds={followedSessionIds}
                onFollow={onFollow}
                onUnfollow={onUnfollow}
              />
            ))
          )}
        </div>
      )}
    </aside>
  );
}
