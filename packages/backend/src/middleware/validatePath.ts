import { Request, Response, NextFunction } from 'express';
import * as path from 'path';
import { sanitizeError } from './errorHandler.js';

/**
 * Sensitive system directories that should not be accessible
 * Includes common Unix and Windows system paths
 */
const DENIED_PATHS = [
  // Unix system directories
  '/etc',
  '/sys',
  '/proc',
  '/dev',
  '/root',
  '/boot',
  '/bin',
  '/sbin',
  '/usr/bin',
  '/usr/sbin',
  '/usr/local/bin',
  '/lib',
  '/lib64',
  '/usr/lib',
  '/var/log',
  '/var/www',

  // Windows system directories
  'C:\\Windows',
  'C:\\Program Files',
  'C:\\Program Files (x86)',
  'C:\\ProgramData',
  'C:\\System Volume Information',
  'C:\\$Recycle.Bin',
];

/**
 * Normalize a path to handle both Unix and Windows paths consistently
 */
function normalizePath(filePath: string): string {
  // Convert to absolute path and normalize separators
  const normalized = path.resolve(filePath);
  // On Windows, also handle UNC paths and drive letters consistently
  return normalized.toLowerCase();
}

/**
 * Check if a path is in the denied list
 */
function isPathDenied(filePath: string): boolean {
  const normalizedPath = normalizePath(filePath);

  return DENIED_PATHS.some(deniedPath => {
    const normalizedDenied = normalizePath(deniedPath);
    // Check if the path starts with a denied directory
    return normalizedPath.startsWith(normalizedDenied) &&
           (normalizedPath.length === normalizedDenied.length ||
            normalizedPath[normalizedDenied.length] === path.sep);
  });
}

/**
 * Reusable middleware to validate file paths
 * Prevents directory traversal and access to sensitive system directories
 *
 * Usage: router.get('/:sessionId/read', validateFilePath('path'), handler)
 *
 * @param paramName The query parameter name containing the file path (default: 'path')
 * @returns Express middleware function
 */
export function validateFilePath(paramName: string = 'path') {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { sessionId } = req.params;
      const filePath = req.query[paramName];

      if (!sessionId) {
        return res.status(400).json({
          error: 'Missing sessionId parameter',
        });
      }

      if (!filePath || typeof filePath !== 'string') {
        return res.status(400).json({
          error: `Missing or invalid ${paramName} parameter`,
        });
      }

      // Import storage here to avoid circular dependencies
      const { storage } = await import('../storage/index.js');

      // Get session to validate cwd
      const session = await Promise.resolve(storage.getSession(sessionId as any));

      if (!session) {
        return res.status(404).json({
          error: 'Session not found',
          sessionId,
        });
      }

      // Resolve the absolute path
      const absolutePath = path.resolve(session.cwd, filePath);

      // Verify the path is within the session's working directory
      if (!normalizePath(absolutePath).startsWith(normalizePath(session.cwd))) {
        console.warn(`[Security] Path traversal attempt blocked:`, {
          sessionId,
          cwd: session.cwd,
          requestedPath: filePath,
          resolvedPath: absolutePath,
        });

        return res.status(403).json({
          error: 'Access denied: path outside session working directory',
          requestedPath: filePath,
        });
      }

      // Check if path is in denied system directories (Fix 5)
      if (isPathDenied(absolutePath)) {
        console.warn(`[Security] Access to sensitive directory blocked:`, {
          sessionId,
          deniedPath: absolutePath,
        });

        return res.status(403).json({
          error: 'Access denied: system directory is protected',
          requestedPath: filePath,
        });
      }

      // Attach validated path to request for use in route handlers
      (req as any).validatedPath = absolutePath;
      (req as any).session = session;

      next();
    } catch (error) {
      console.error('[Path Validation] Error validating path:', error);
      res.status(500).json({
        error: 'Failed to validate path',
        message: sanitizeError(error),
      });
    }
  };
}
