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
  const sessionsByUser = new Map<string, Session[]>();
  for (const session of sessions) {
    const userId = session.user || 'unknown';
    const group = sessionsByUser.get(userId);
    if (group) {
      group.push(session);
    } else {
      sessionsByUser.set(userId, [session]);
    }
  }

  const userIds = Array.from(sessionsByUser.keys());

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
                sessions={sessionsByUser.get(userId) ?? []}
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
