import type { Permission } from '@afw/shared';
import { useAuthContext } from '../contexts/AuthContext';

/**
 * useAuth Hook
 *
 * Provides current user info and auth operations:
 * - user: Current authenticated user
 * - loading: Whether auth is initializing
 * - error: Auth error message
 * - hasPermission: Check if user has permission
 * - refreshUser: Refresh user info from API
 */
export function useAuth() {
  const { user, isLoading, error, hasPermission, refreshUser } = useAuthContext();

  return {
    user,
    loading: isLoading,
    error,
    hasPermission,
    refreshUser,
  };
}

/**
 * usePermission Hook
 *
 * Check if current user has a specific permission
 */
export function usePermission(permission: Permission): boolean {
  const { hasPermission } = useAuthContext();
  return hasPermission(permission);
}

/**
 * useRole Hook
 *
 * Get the current user's role
 */
export function useRole() {
  const { user } = useAuthContext();
  return user?.role ?? null;
}

/**
 * useAuthLoading Hook
 *
 * Check if auth is still initializing
 * Useful for conditional rendering of loading spinners
 */
export function useAuthLoading(): boolean {
  const { isLoading } = useAuthContext();
  return isLoading;
}

/**
 * useAuthError Hook
 *
 * Get the current auth error message
 */
export function useAuthError(): string | null {
  const { error } = useAuthContext();
  return error;
}

/**
 * useIsAuthenticated Hook
 *
 * Check if user is currently authenticated
 */
export function useIsAuthenticated(): boolean {
  const { user } = useAuthContext();
  return user !== null;
}
