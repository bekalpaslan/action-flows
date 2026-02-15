import type { Request, Response, NextFunction } from 'express';

/**
 * API Key Authentication Middleware
 *
 * Reads AFW_API_KEY from environment variable.
 * - If not set (dev mode), auth is disabled and request passes through.
 * - If set (prod mode), validates x-api-key header or Authorization: Bearer header.
 * - If not set or invalid, returns 401 Unauthorized.
 */

function extractApiKey(req: Request): string | undefined {
  // Check Authorization header (format: Bearer <key>)
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  // Check query parameter (for WebSocket upgrade compatibility)
  const queryKey = req.query.apiKey as string | undefined;
  if (queryKey) {
    return queryKey;
  }

  // Check x-api-key header
  const headerKey = req.headers['x-api-key'] as string | undefined;
  if (headerKey) {
    return headerKey;
  }

  return undefined;
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const apiKey = process.env.AFW_API_KEY;

  // Dev mode: no auth required
  if (!apiKey) {
    return next();
  }

  // Prod mode: validate API key
  const providedKey = extractApiKey(req);

  if (!providedKey || providedKey !== apiKey) {
    console.warn(`[Auth] Unauthorized request: ${req.method} ${req.path}`);
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Key is valid, proceed
  next();
}
