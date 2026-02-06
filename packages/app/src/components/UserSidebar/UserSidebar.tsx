import { useState, useMemo } from 'react';
import { SessionTree } from '../SessionTree';
import { useUserSessions } from '../../hooks/useUserSessions';
import './UserSidebar.css';
import type { Session } from '@afw/shared';

export interface User {
  id: string;
  sessionCount: number;
  isOnline: boolean;
  name?: string;
}

export interface UserSidebarProps {
  users: User[];
  selectedUserId?: string;
  onUserSelect: (userId: string) => void;
  currentUserId?: string;
  attachedSessionIds?: string[];
  onSessionAttach?: (sessionId: string) => void;
  onSessionDetach?: (sessionId: string) => void;
}

/**
 * UserSidebar component displaying active users with online status and session counts
 *
 * Features:
 * - List of users with initials-based avatars
 * - Session count badges
 * - Online/offline status indicators
 * - Selected user highlighting
 * - "You" label for current user
 * - Expandable session trees for each user
 * - Collapsible sidebar for space efficiency
 */
export function UserSidebar({
  users,
  selectedUserId,
  onUserSelect,
  currentUserId,
  attachedSessionIds = [],
  onSessionAttach = () => {},
  onSessionDetach = () => {},
}: UserSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());

  // Sort users: online first, then by session count
  const sortedUsers = useMemo(() => {
    return [...users].sort((a, b) => {
      // Online users first
      if (a.isOnline !== b.isOnline) {
        return a.isOnline ? -1 : 1;
      }
      // Then by session count (descending)
      return b.sessionCount - a.sessionCount;
    });
  }, [users]);

  // Get initials for avatar
  const getInitials = (id: string, name?: string): string => {
    if (name) {
      return name
        .split(' ')
        .map((part) => part[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return (id.slice(0, 2)).toUpperCase();
  };

  // Toggle user expansion
  const toggleUserExpansion = (userId: string) => {
    const newExpanded = new Set(expandedUsers);
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId);
    } else {
      newExpanded.add(userId);
    }
    setExpandedUsers(newExpanded);
  };

  return (
    <aside className={`user-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="user-sidebar-header">
        <h3 className="user-sidebar-title">Users</h3>
        <button
          className="sidebar-toggle-btn"
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? 'Expand' : 'Collapse'}
          aria-label={isCollapsed ? 'Expand user list' : 'Collapse user list'}
        >
          {isCollapsed ? '→' : '←'}
        </button>
      </div>

      <div className="user-sidebar-content">
        {sortedUsers.length === 0 ? (
          <div className="user-sidebar-empty">
            <p>No active users</p>
          </div>
        ) : (
          <ul className="user-list">
            {sortedUsers.map((user) => {
              const initials = getInitials(user.id, user.name);
              const isSelected = selectedUserId === user.id;
              const isCurrent = currentUserId === user.id;
              const isUserExpanded = expandedUsers.has(user.id);

              return (
                <UserListItem
                  key={user.id}
                  user={user}
                  isSelected={isSelected}
                  isCurrent={isCurrent}
                  isCollapsed={isCollapsed}
                  initials={initials}
                  isUserExpanded={isUserExpanded}
                  onSelect={() => onUserSelect(user.id)}
                  onToggleExpand={() => toggleUserExpansion(user.id)}
                  attachedSessionIds={attachedSessionIds}
                  onSessionAttach={onSessionAttach}
                  onSessionDetach={onSessionDetach}
                />
              );
            })}
          </ul>
        )}
      </div>

      <div className="user-sidebar-footer">
        <div className="user-count">
          {sortedUsers.length} user{sortedUsers.length !== 1 ? 's' : ''}
        </div>
        <div className="online-count">
          {sortedUsers.filter((u) => u.isOnline).length} online
        </div>
      </div>
    </aside>
  );
}

/**
 * Internal component for rendering a single user item with session tree
 */
interface UserListItemProps {
  user: User;
  isSelected: boolean;
  isCurrent: boolean;
  isCollapsed: boolean;
  initials: string;
  isUserExpanded: boolean;
  onSelect: () => void;
  onToggleExpand: () => void;
  attachedSessionIds: string[];
  onSessionAttach: (sessionId: string) => void;
  onSessionDetach: (sessionId: string) => void;
}

function UserListItem({
  user,
  isSelected,
  isCurrent,
  isCollapsed,
  initials,
  isUserExpanded,
  onSelect,
  onToggleExpand,
  attachedSessionIds,
  onSessionAttach,
  onSessionDetach,
}: UserListItemProps) {
  const { sessions } = useUserSessions(user.id);

  return (
    <li className={`user-item ${isSelected ? 'selected' : ''}`}>
      <div className="user-item-content">
        <button
          className="user-button"
          onClick={onSelect}
          title={`${user.name || user.id}${isCurrent ? ' (You)' : ''}`}
          aria-label={`Select user ${user.name || user.id}${isCurrent ? ' (You)' : ''}`}
        >
          <div className="user-avatar">
            <span className="avatar-text">{initials}</span>
            {user.isOnline && (
              <div className="online-indicator" title="Online"></div>
            )}
          </div>

          {!isCollapsed && (
            <div className="user-info">
              <div className="user-name">
                {user.name || user.id}
                {isCurrent && <span className="current-badge">You</span>}
              </div>
              <div className="user-sessions">
                {user.sessionCount} {user.sessionCount === 1 ? 'session' : 'sessions'}
              </div>
            </div>
          )}

          <div className="session-badge">
            {user.sessionCount}
          </div>
        </button>

        {!isCollapsed && sessions.length > 0 && (
          <div className="user-sessions-tree">
            <SessionTree
              userId={user.id}
              sessions={sessions}
              attachedSessionIds={attachedSessionIds}
              onSessionAttach={onSessionAttach}
              onSessionDetach={onSessionDetach}
              expanded={isUserExpanded}
              onToggle={onToggleExpand}
            />
          </div>
        )}
      </div>
    </li>
  );
}
