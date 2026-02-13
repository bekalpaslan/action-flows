/**
 * Authentication & Authorization Routes for ActionFlows Dashboard
 *
 * Provides endpoints for:
 * - Getting current user info
 * - Verifying authentication token
 * - Assigning roles to users (admin only)
 */

import { Router } from 'express';
import type { Request, Response } from 'express';
import type { UserId } from '@afw/shared';
import { validateBody } from '../middleware/validate.js';
import { AssignRoleRequestSchema } from '@afw/shared';
import { userHasPermission, assignRoleToUser, getRolePermissions } from '../services/permissionService.js';
import { getUser, updateUserActivity } from '../services/userService.js';
import { requirePermission } from '../middleware/authorize.js';

const router = Router();

/**
 * GET /api/auth/user
 * Get current user info
 * Requires: Authentication
 */
router.get('/user', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId as UserId | undefined;

    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User authentication required',
      });
    }

    // Get user from storage
    const user = await getUser(userId);

    if (!user) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found',
      });
    }

    // Update activity timestamp
    await updateUserActivity(userId);

    res.json(user);
  } catch (error) {
    console.error('[Auth] Error getting user:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get user info',
    });
  }
});

/**
 * GET /api/auth/verify
 * Verify authentication token and return user role
 * Requires: Authentication
 */
router.get('/verify', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId as UserId | undefined;

    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User authentication required',
      });
    }

    // Get user from storage
    const user = await getUser(userId);

    if (!user) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found',
      });
    }

    // Get user's permissions
    const permissions = getRolePermissions(user.role);

    res.json({
      userId: user.userId,
      username: user.username,
      role: user.role,
      permissions,
      authenticated: true,
    });
  } catch (error) {
    console.error('[Auth] Error verifying token:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to verify authentication',
    });
  }
});

/**
 * POST /api/auth/assign-role
 * Assign a role to a user (admin only)
 * Requires: 'manage_users' permission
 * Body: { userId: string, role: 'admin' | 'editor' | 'executor' | 'reviewer' | 'viewer' }
 */
router.post(
  '/assign-role',
  requirePermission('manage_users'),
  validateBody(AssignRoleRequestSchema),
  async (req: Request, res: Response) => {
    try {
      const { userId, role } = req.body;

      // Verify target user exists
      const user = await getUser(userId as UserId);
      if (!user) {
        return res.status(404).json({
          error: 'Not Found',
          message: `User not found: ${userId}`,
        });
      }

      // Assign new role
      await assignRoleToUser(userId as UserId, role);

      // Get updated user
      const updatedUser = await getUser(userId as UserId);

      res.json({
        message: `Role assigned successfully`,
        user: updatedUser,
      });
    } catch (error) {
      console.error('[Auth] Error assigning role:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to assign role',
      });
    }
  }
);

export default router;
