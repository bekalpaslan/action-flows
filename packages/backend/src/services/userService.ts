/**
 * User Service for ActionFlows Dashboard
 *
 * Manages user lifecycle, role assignment, and user queries.
 */

import { storage } from '../storage/index.js';
import type { UserId, User, Role } from '@afw/shared';
import { toUserId, toTimestamp } from '@afw/shared';

/**
 * Create a new user
 */
export async function createUser(
  userId: UserId,
  username: string,
  email: string,
  role: Role = 'viewer'
): Promise<User> {
  const now = toTimestamp(new Date().toISOString());

  const user: User = {
    userId,
    username,
    role,
    email,
    createdAt: now,
    lastActive: now,
  };

  await Promise.resolve(storage.setUser(user));
  return user;
}

/**
 * Get a user by ID
 */
export async function getUser(userId: UserId): Promise<User | undefined> {
  return Promise.resolve(storage.getUser(userId));
}

/**
 * Update a user's role (admin only)
 */
export async function updateUserRole(userId: UserId, role: Role): Promise<void> {
  const user = await Promise.resolve(storage.getUser(userId));
  if (!user) {
    throw new Error(`User not found: ${userId}`);
  }

  user.role = role;
  user.lastActive = toTimestamp(new Date().toISOString());
  await Promise.resolve(storage.setUser(user));
}

/**
 * Get all users with a specific role
 */
export async function getUsersWithRole(role: Role): Promise<User[]> {
  return Promise.resolve(storage.getUsersByRole(role));
}

/**
 * Ensure admin user exists (creates default admin if needed)
 */
export async function ensureAdminExists(): Promise<void> {
  // Check if system admin exists
  const systemAdminId = toUserId('system');
  const systemAdmin = await Promise.resolve(storage.getUser(systemAdminId));

  if (!systemAdmin) {
    // Create default system admin
    await createUser(
      systemAdminId,
      'System Admin',
      'admin@actionflows.local',
      'admin'
    );

    console.log('[UserService] Created default system admin user');
  }
}

/**
 * Update user's lastActive timestamp
 */
export async function updateUserActivity(userId: UserId): Promise<void> {
  const user = await Promise.resolve(storage.getUser(userId));
  if (user) {
    user.lastActive = toTimestamp(new Date().toISOString());
    await Promise.resolve(storage.setUser(user));
  }
}
