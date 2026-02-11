import type { Request, Response, NextFunction } from 'express';
import type { SessionId } from '@afw/shared';
import { getDiscoveryService } from '../services/discoveryService.js';

/**
 * Error Sanitization Utility
 *
 * Sanitizes error messages for client responses.
 * - In development: includes error message (but never stack traces)
 * - In production: generic error message only
 */
export function sanitizeError(error: unknown): string {
  // In dev mode, include the error message (but never stack traces)
  if (process.env.NODE_ENV === 'development' && error instanceof Error) {
    return error.message;
  }

  // In production or for non-Error objects, return generic message
  return 'An internal error occurred';
}

/**
 * Global Error Handler Middleware
 *
 * Must be registered LAST in the middleware chain (after all routes).
 * Catches and sanitizes errors, logs them server-side.
 */
export function globalErrorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  // Log full error server-side for debugging
  console.error(`[Error Handler] ${req.method} ${req.path}:`, err);

  // Record error for discovery (Phase 3)
  // Extract sessionId from request (might be in body, params, or query)
  const sessionId = req.body?.sessionId || req.params?.sessionId || req.params?.id || req.query?.sessionId;

  if (sessionId) {
    try {
      const discoveryService = getDiscoveryService();
      if (discoveryService) {
        discoveryService.recordError(sessionId as SessionId).catch(error => {
          // Silent fail - don't compound errors
          console.debug('[Discovery] Failed to record error:', error);
        });
      }
    } catch (error) {
      // Silent fail - don't compound errors
      console.debug('[Discovery] Failed to record error:', error);
    }
  }

  // Send sanitized response to client
  res.status(500).json({
    error: 'Internal server error',
    message: sanitizeError(err),
  });
}
