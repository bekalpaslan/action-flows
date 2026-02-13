/**
 * Role-Based Permissions System for ActionFlows Dashboard
 *
 * Defines roles, permissions, and the permission matrix that governs
 * who can perform which operations in the system.
 */

import type { UserId, Timestamp } from '../types.js';

/**
 * System roles - define access levels
 */
export type Role = 'admin' | 'editor' | 'executor' | 'reviewer' | 'viewer';

/**
 * Permission granularity - specific actions that require authorization
 */
export type Permission =
  | 'create_session'
  | 'execute_chain'
  | 'spawn_child_chain'
  | 'approve_step'
  | 'manage_users'
  | 'view_analytics'
  | 'manage_flows'
  | 'delete_session';

/**
 * Role to permissions mapping
 */
export type RolePermissions = Record<Role, Permission[]>;

/**
 * Default permission matrix - each role gets specific permissions
 */
export const DEFAULT_ROLE_PERMISSIONS: RolePermissions = {
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

/**
 * Verify if a role exists
 */
export function isValidRole(role: unknown): role is Role {
  const validRoles: Role[] = ['admin', 'editor', 'executor', 'reviewer', 'viewer'];
  return typeof role === 'string' && validRoles.includes(role as Role);
}

/**
 * Verify if a permission exists
 */
export function isValidPermission(permission: unknown): permission is Permission {
  const validPermissions: Permission[] = [
    'create_session',
    'execute_chain',
    'spawn_child_chain',
    'approve_step',
    'manage_users',
    'view_analytics',
    'manage_flows',
    'delete_session',
  ];
  return typeof permission === 'string' && validPermissions.includes(permission as Permission);
}

/**
 * User - represents a system user with role and metadata
 */
export interface User {
  /** Unique identifier for this user (branded UserId) */
  userId: UserId;

  /** Human-readable username */
  username: string;

  /** User's role in the system */
  role: Role;

  /** User's email address */
  email: string;

  /** When the user was created */
  createdAt: Timestamp;

  /** Last time the user was active */
  lastActive: Timestamp;
}
