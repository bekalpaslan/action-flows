/**
 * Zod Schemas for Authentication and Authorization
 *
 * Validates role, permission, user, and permission assignment requests.
 */

import { z } from 'zod';

/**
 * Validate role values
 */
export const RoleSchema = z.enum(['admin', 'editor', 'executor', 'reviewer', 'viewer']);

/**
 * Validate permission values
 */
export const PermissionSchema = z.enum([
  'create_session',
  'execute_chain',
  'spawn_child_chain',
  'approve_step',
  'manage_users',
  'view_analytics',
  'manage_flows',
  'delete_session',
]);

/**
 * Validate user objects
 */
export const UserSchema = z.object({
  userId: z.string().min(1, 'userId is required').max(100, 'userId too long'),
  username: z.string().min(1, 'username is required').max(100, 'username too long'),
  role: RoleSchema,
  email: z.string().email('invalid email').max(255, 'email too long'),
  createdAt: z.string().datetime('invalid createdAt timestamp'),
  lastActive: z.string().datetime('invalid lastActive timestamp'),
});

export type User = z.infer<typeof UserSchema>;

/**
 * Validate role assignment request
 */
export const AssignRoleRequestSchema = z.object({
  userId: z.string().min(1, 'userId is required').max(100, 'userId too long'),
  role: RoleSchema,
});

export type AssignRoleRequest = z.infer<typeof AssignRoleRequestSchema>;

/**
 * Verify permission request
 */
export const VerifyPermissionRequestSchema = z.object({
  permission: PermissionSchema,
});

export type VerifyPermissionRequest = z.infer<typeof VerifyPermissionRequestSchema>;
