/**
 * Permission Service for ActionFlows Dashboard
 *
 * Handles permission checks, role management, and permission caching.
 * Uses a 1-minute TTL cache to avoid frequent storage lookups.
 */

import { storage } from '../storage/index.js';
import type { UserId, Permission, Role } from '@afw/shared';
import { DEFAULT_ROLE_PERMISSIONS, toTimestamp } from '@afw/shared';

/**
 * Cache entry for user permissions
 */
interface PermissionCacheEntry {
  permissions: Permission[];
  expiresAt: number;
}

/**
 * In-memory cache for user permissions (1-minute TTL)
 */
const permissionCache = new Map<UserId, PermissionCacheEntry>();
const PERMISSION_CACHE_TTL_MS = 60 * 1000; // 1 minute

/**
 * Get all permissions allowed for a role
 */
export function getRolePermissions(role: Role): Permission[] {
  return DEFAULT_ROLE_PERMISSIONS[role] || [];
}

/**
 * Check if a user has a specific permission
 * Uses cache to avoid storage hits on every request
 */
export async function userHasPermission(userId: UserId, permission: Permission): Promise<boolean> {
  // Check cache first
  const cached = permissionCache.get(userId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.permissions.includes(permission);
  }

  // Cache miss - get user from storage
  const user = await Promise.resolve(storage.getUser(userId));
  if (!user) {
    return false;
  }

  // Get permissions for user's role
  const permissions = getRolePermissions(user.role);

  // Update cache
  permissionCache.set(userId, {
    permissions,
    expiresAt: Date.now() + PERMISSION_CACHE_TTL_MS,
  });

  return permissions.includes(permission);
}

/**
 * Assign a role to a user (admin only)
 */
export async function assignRoleToUser(userId: UserId, role: Role): Promise<void> {
  const user = await Promise.resolve(storage.getUser(userId));
  if (!user) {
    throw new Error(`User not found: ${userId}`);
  }

  // Update user role
  user.role = role;
  user.lastActive = toTimestamp(new Date().toISOString());
  await Promise.resolve(storage.setUser(user));

  // Invalidate cache for this user
  permissionCache.delete(userId);
}

/**
 * Get the default permission matrix
 */
export function getDefaultRolePermissions() {
  return DEFAULT_ROLE_PERMISSIONS;
}

/**
 * Clear the permission cache (useful for testing)
 */
export function clearPermissionCache(): void {
  permissionCache.clear();
}

/**
 * Invalidate cache for a specific user
 */
export function invalidateUserPermissionCache(userId: UserId): void {
  permissionCache.delete(userId);
}
