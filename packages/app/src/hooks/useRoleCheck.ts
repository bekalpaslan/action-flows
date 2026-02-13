import { usePermission } from './useAuth';

/**
 * useCanCreateSession Hook
 *
 * Check if user can create a new session
 * Requires: 'create_session' permission
 */
export function useCanCreateSession(): boolean {
  return usePermission('create_session');
}

/**
 * useCanExecuteChain Hook
 *
 * Check if user can execute a chain
 * Requires: 'execute_chain' permission
 */
export function useCanExecuteChain(): boolean {
  return usePermission('execute_chain');
}

/**
 * useCanSpawnChildChain Hook
 *
 * Check if user can spawn a child chain
 * Requires: 'spawn_child_chain' permission
 */
export function useCanSpawnChildChain(): boolean {
  return usePermission('spawn_child_chain');
}

/**
 * useCanApproveStep Hook
 *
 * Check if user can approve a step
 * Requires: 'approve_step' permission
 */
export function useCanApproveStep(): boolean {
  return usePermission('approve_step');
}

/**
 * useCanManageUsers Hook
 *
 * Check if user can manage other users (assign roles, etc)
 * Requires: 'manage_users' permission
 */
export function useCanManageUsers(): boolean {
  return usePermission('manage_users');
}

/**
 * useCanViewAnalytics Hook
 *
 * Check if user can view analytics and metrics
 * Requires: 'view_analytics' permission
 */
export function useCanViewAnalytics(): boolean {
  return usePermission('view_analytics');
}

/**
 * useCanManageFlows Hook
 *
 * Check if user can create/edit/delete flows
 * Requires: 'manage_flows' permission
 */
export function useCanManageFlows(): boolean {
  return usePermission('manage_flows');
}

/**
 * useCanDeleteSession Hook
 *
 * Check if user can delete a session
 * Requires: 'delete_session' permission
 */
export function useCanDeleteSession(): boolean {
  return usePermission('delete_session');
}
