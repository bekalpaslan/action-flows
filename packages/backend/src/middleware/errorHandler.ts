import type { Request, Response, NextFunction } from 'express';

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

  // Send sanitized response to client
  res.status(500).json({
    error: 'Internal server error',
    message: sanitizeError(err),
  });
}
