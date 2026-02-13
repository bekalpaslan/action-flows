import type { ReactNode } from 'react';
import type { Permission } from '@afw/shared';
import { usePermission } from '../../hooks/useAuth';
import './Auth.css';

interface PermissionGuardProps {
  permission: Permission;
  children: ReactNode;
  fallback?: ReactNode;
  hideIfDenied?: boolean;
}

/**
 * PermissionGuard Component
 *
 * Wrapper component that only renders children if user has the specified permission.
 * Shows a permission denied message if access is denied (unless hideIfDenied=true).
 *
 * @example
 * <PermissionGuard permission="execute_chain">
 *   <ExecuteButton />
 * </PermissionGuard>
 *
 * @example
 * <PermissionGuard permission="manage_users" hideIfDenied>
 *   Silently hidden if no permission
 * </PermissionGuard>
 */
export function PermissionGuard({
  permission,
  children,
  fallback,
  hideIfDenied = false,
}: PermissionGuardProps) {
  const hasPermission = usePermission(permission);

  if (!hasPermission) {
    if (hideIfDenied) {
      return null;
    }

    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="permission-denied" role="alert">
        <span className="permission-denied__icon">⚠️</span>
        You don't have permission to access this feature ({permission}).
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * PermissionGuardWithFallback Component
 *
 * Renders children if user has permission, otherwise renders fallback.
 * Useful for conditional UI where you want to show an alternative component.
 *
 * @example
 * <PermissionGuardWithFallback permission="execute_chain" fallback={<ViewOnly />}>
 *   <ExecuteButton />
 * </PermissionGuardWithFallback>
 */
interface PermissionGuardWithFallbackProps {
  permission: Permission;
  children: ReactNode;
  fallback: ReactNode;
}

export function PermissionGuardWithFallback({
  permission,
  children,
  fallback,
}: PermissionGuardWithFallbackProps) {
  const hasPermission = usePermission(permission);

  return <>{hasPermission ? children : fallback}</>;
}

/**
 * PermissionGuardButton Component
 *
 * Helper for disabling buttons when user lacks permission.
 * Button shows a tooltip explaining why it's disabled.
 *
 * @example
 * <PermissionGuardButton permission="delete_session">
 *   Delete Session
 * </PermissionGuardButton>
 */
interface PermissionGuardButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  permission: Permission;
  children: ReactNode;
}

export function PermissionGuardButton({
  permission,
  children,
  disabled,
  title,
  ...props
}: PermissionGuardButtonProps) {
  const hasPermission = usePermission(permission);
  const isDisabled = disabled || !hasPermission;
  const tooltip = !hasPermission
    ? `You don't have permission to perform this action (${permission} required)`
    : title;

  return (
    <button
      {...props}
      disabled={isDisabled}
      title={tooltip}
      aria-disabled={isDisabled}
    >
      {children}
    </button>
  );
}
