import { useState, useCallback, useRef, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useAuthContext } from '../../contexts/AuthContext';
import { RoleBadge } from './RoleBadge';
import './Auth.css';

/**
 * UserProfile Component
 *
 * Displays current user info in top-right corner:
 * - Username and role badge
 * - Expandable permissions list
 * - Sign out button (if available)
 */
export function UserProfile() {
  const { user } = useAuth();
  const { signOut } = useAuthContext();
  const [isExpanded, setIsExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    };

    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isExpanded]);

  const handleSignOut = useCallback(() => {
    signOut();
    setIsExpanded(false);
  }, [signOut]);

  if (!user) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className={`user-profile ${isExpanded ? 'permissions-expanded' : ''}`}
      role="region"
      aria-label="User profile"
    >
      <div className="user-profile__info">
        <h3 className="user-profile__username" title={user.username}>
          {user.username}
        </h3>
        <p className="user-profile__role">{user.role.toUpperCase()}</p>
      </div>

      <RoleBadge role={user.role} />

      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="user-profile__sign-out"
        aria-label="Toggle permissions menu"
        aria-expanded={isExpanded}
      >
        ⋮
      </button>

      <div className="user-profile__permissions-list" role="menu">
        <div className="user-profile__permissions-label">Your Permissions</div>
        {/* Permissions are derived from role in the auth context */}
        {/* We'll list the 8 possible permissions and show which ones the user has */}
        <PermissionsList user={user} />
      </div>

      <button
        onClick={handleSignOut}
        className="user-profile__sign-out"
        title="Sign out"
        aria-label="Sign out"
      >
        Sign Out
      </button>
    </div>
  );
}

/**
 * PermissionsList Component
 * Shows which permissions the user has based on their role
 */
function PermissionsList({ user }: { user: any }) {
  const rolePermissions: Record<string, string[]> = {
    admin: [
      'create_session',
      'execute_chain',
      'spawn_child_chain',
      'approve_step',
      'manage_users',
      'view_analytics',
      'manage_flows',
      'delete_session',
    ],
    editor: [
      'create_session',
      'execute_chain',
      'spawn_child_chain',
      'manage_flows',
      'view_analytics',
    ],
    executor: [
      'create_session',
      'execute_chain',
      'spawn_child_chain',
    ],
    reviewer: [
      'approve_step',
      'view_analytics',
    ],
    viewer: [
      'view_analytics',
    ],
  };

  const permissions = rolePermissions[user.role] || [];

  return (
    <>
      {permissions.map(perm => (
        <div key={perm} className="user-profile__permission-item" role="menuitem">
          ✓ {perm.replace(/_/g, ' ')}
        </div>
      ))}
    </>
  );
}
