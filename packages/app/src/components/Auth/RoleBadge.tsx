import type { Role } from '@afw/shared';
import './Auth.css';

interface RoleBadgeProps {
  role: Role;
  showTooltip?: boolean;
}

const roleDescriptions: Record<Role, string> = {
  admin: 'Full system access. Can manage users and all features.',
  editor: 'Can create sessions, execute chains, and manage flows.',
  executor: 'Can create and execute sessions and chains.',
  reviewer: 'Can approve steps and view analytics.',
  viewer: 'View-only access to analytics.',
};

/**
 * RoleBadge Component
 *
 * Small color-coded badge displaying user role:
 * - admin: red
 * - editor: blue
 * - executor: green
 * - reviewer: yellow
 * - viewer: gray
 *
 * Optional tooltip on hover showing role description
 */
export function RoleBadge({ role, showTooltip = true }: RoleBadgeProps) {
  return (
    <span
      className={`role-badge role-badge--${role}`}
      title={showTooltip ? roleDescriptions[role] : undefined}
      role="status"
      aria-label={`Role: ${role}`}
    >
      <span className="role-badge__dot" aria-hidden="true" />
      {role}
    </span>
  );
}
