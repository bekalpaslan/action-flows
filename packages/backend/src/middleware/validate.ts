import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema } from 'zod';
import { z } from 'zod';

/**
 * Generic Zod Validation Middleware Factory
 *
 * Validates req.body or req.query against a Zod schema.
 * On validation failure, returns 400 with sanitized error details.
 * On success, replaces req.body/query with parsed (cleaned) data.
 */

/**
 * SessionId param validator — rejects empty, oversized, or malformed IDs
 */
const sessionIdSchema = z.string().min(1, 'Session ID required').max(200, 'Session ID too long').regex(
  /^[a-zA-Z0-9_\-:.]+$/,
  'Session ID contains invalid characters'
);

export function validateSessionIdParam(paramName = 'id') {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = sessionIdSchema.safeParse(req.params[paramName]);
    if (!result.success) {
      return res.status(400).json({
        error: 'Invalid session ID',
        details: result.error.issues.map((issue) => ({
          path: paramName,
          message: issue.message,
          code: issue.code,
        })),
      });
    }
    next();
  };
}

export function validateBody<T extends ZodSchema>(schema: T) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: result.error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
          code: issue.code,
        })),
      });
    }

    req.body = result.data;
    next();
  };
}

export function validateQuery<T extends ZodSchema>(schema: T) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: result.error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
          code: issue.code,
        })),
      });
    }

    // Cast is safe because Zod validates and transforms the data
    req.query = result.data as typeof req.query;
    next();
  };
}
