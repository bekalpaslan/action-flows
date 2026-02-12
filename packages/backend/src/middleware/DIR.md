# middleware/

- auth.ts — exports: authMiddleware
- errorHandler.ts — exports: globalErrorHandler, sanitizeError
- rateLimit.ts — exports: generalLimiter, readLimiter, sessionCreateLimiter, writeLimiter
- validate.ts — exports: validateBody, validateQuery, validateSessionIdParam
- validatePath.ts — exports: validateFilePath
