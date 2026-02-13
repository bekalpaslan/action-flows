import { useAuth } from '../../hooks/useAuth';
import type { Permission, Role } from '@afw/shared';
import './Auth.css';

interface UnauthorizedPageProps {
  requiredPermission?: Permission;
  message?: string;
  onGoHome?: () => void;
}

/**
 * UnauthorizedPage Component
 *
 * Displayed when user lacks required permission to access a feature.
 * Shows:
 * - Required permission
 * - User's current role
 * - User's available permissions
 * - Link back to home
 */
export function UnauthorizedPage({
  requiredPermission,
  message,
  onGoHome,
}: UnauthorizedPageProps) {
  const { user } = useAuth();

  const handleGoHome = () => {
    if (onGoHome) {
      onGoHome();
    } else {
      // Fallback: navigate to home by reloading or using window.location
      window.location.href = '/';
    }
  };

  const rolePermissions: Record<Role, string[]> = {
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

  const userPermissions = user ? rolePermissions[user.role] : [];

  return (
    <div className="unauthorized-page">
      <div className="unauthorized-page__icon">🔒</div>

      <h1 className="unauthorized-page__heading">Access Denied</h1>

      <p className="unauthorized-page__message">
        {message || "You don't have permission to perform this action"}
      </p>

      {user && (
        <div className="unauthorized-page__details">
          <div className="unauthorized-page__detail-row">
            <span className="unauthorized-page__detail-label">Your Role:</span>
            <span>{user.role.toUpperCase()}</span>
          </div>

          {requiredPermission && (
            <div className="unauthorized-page__detail-row">
              <span className="unauthorized-page__detail-label">Required Permission:</span>
              <span>{requiredPermission.replace(/_/g, ' ')}</span>
            </div>
          )}

          <div className="unauthorized-page__detail-row">
            <span className="unauthorized-page__detail-label">Your Permissions:</span>
            <span>
              {userPermissions.length > 0
                ? userPermissions.map(p => p.replace(/_/g, ' ')).join(', ')
                : 'None'}
            </span>
          </div>
        </div>
      )}

      <button className="unauthorized-page__link" onClick={handleGoHome}>
        ← Back to Home
      </button>

      {!user && (
        <p className="unauthorized-page__message" style={{ fontSize: '0.875rem' }}>
          <a href="/login" style={{ color: 'inherit', textDecoration: 'underline' }}>
            Sign in
          </a>{' '}
          with appropriate permissions to access this feature.
        </p>
      )}
    </div>
  );
}
