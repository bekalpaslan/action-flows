/**
 * Authorization Middleware for ActionFlows Dashboard
 *
 * Checks if a user has required permissions before allowing access to protected routes.
 * Returns 403 Forbidden if the user lacks permission.
 */

import type { Request, Response, NextFunction } from 'express';
import type { Permission, SessionId } from '@afw/shared';
import { userHasPermission } from '../services/permissionService.js';
import { storage } from '../storage/index.js';

/**
 * Extract user ID from request context
 * Assumes it's set by authMiddleware
 */
function getUserIdFromRequest(req: Request): string | undefined {
  // Could come from various sources depending on auth implementation
  return (req as any).userId;
}

/**
 * Create authorization middleware for a specific permission
 */
export function requirePermission(permission: Permission) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userId = getUserIdFromRequest(req);

    // If no user ID, return 401 Unauthorized
    if (!userId) {
      console.warn(`[Auth] Missing user ID for permission check: ${permission}`);
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User authentication required',
      });
    }

    // Check if user has the required permission
    const hasPermission = await userHasPermission(userId as any, permission);

    if (!hasPermission) {
      console.warn(
        `[Auth] Permission denied for user ${userId} - required: ${permission}`
      );
      return res.status(403).json({
        error: 'Forbidden',
        message: `User lacks required permission: ${permission}`,
      });
    }

    // User has permission, proceed
    next();
  };
}

/**
 * Require that the requesting user owns the session
 * Extract sessionId from route parameter (e.g., /sessions/:sessionId)
 * Returns 403 Forbidden if user doesn't own the session
 *
 * Usage: router.get('/sessions/:sessionId', requireSessionOwnership, handler)
 */
export function requireSessionOwnership(req: Request, res: Response, next: NextFunction) {
  const sessionIdParam = req.params.sessionId as SessionId | undefined;
  const userId = getUserIdFromRequest(req);

  // Validate inputs
  if (!sessionIdParam) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Session ID required in route parameter',
    });
  }

  if (!userId) {
    console.warn('[Auth] Missing user ID for session ownership check');
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'User authentication required',
    });
  }

  // Get session and verify ownership
  const session = storage.getSession(sessionIdParam);

  // Handle async storage
  if (session instanceof Promise) {
    session
      .then((s) => {
        if (!s) {
          return res.status(404).json({
            error: 'Not Found',
            message: 'Session not found',
          });
        }

        // Verify ownership
        if (s.user && s.user !== userId) {
          console.warn(
            `[Auth] Session ownership denied for user ${userId} on session ${sessionIdParam}`
          );
          return res.status(403).json({
            error: 'Forbidden',
            message: 'Not the session owner',
          });
        }

        // User owns the session, proceed
        next();
      })
      .catch((err) => {
        console.error('[Auth] Error checking session ownership:', err);
        res.status(500).json({
          error: 'Internal Server Error',
          message: 'Failed to verify session ownership',
        });
      });
  } else {
    // Synchronous storage
    if (!session) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Session not found',
      });
    }

    // Verify ownership
    if (session.user && session.user !== userId) {
      console.warn(
        `[Auth] Session ownership denied for user ${userId} on session ${sessionIdParam}`
      );
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Not the session owner',
      });
    }

    // User owns the session, proceed
    next();
  }
}
