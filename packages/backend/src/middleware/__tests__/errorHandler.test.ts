/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { sanitizeError, globalErrorHandler } from '../errorHandler.js';

describe('errorHandler', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    mockReq = {
      method: 'GET',
      path: '/api/test',
    } as any;

    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    mockNext = vi.fn();

    // Spy on console.error to verify logging
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('sanitizeError', () => {
    describe('in development mode', () => {
      beforeEach(() => {
        vi.stubEnv('NODE_ENV', 'development');
      });

      afterEach(() => {
        vi.unstubAllEnvs();
      });

      it('should return error message for Error instances', () => {
        const error = new Error('Something went wrong');
        const result = sanitizeError(error);

        expect(result).toBe('Something went wrong');
      });

      it('should return generic message for non-Error objects', () => {
        const error = { code: 'ERR_123', message: 'bad request' };
        const result = sanitizeError(error);

        expect(result).toBe('An internal error occurred');
      });

      it('should return generic message for string errors', () => {
        const error = 'string error';
        const result = sanitizeError(error);

        expect(result).toBe('An internal error occurred');
      });

      it('should return generic message for null', () => {
        const result = sanitizeError(null);

        expect(result).toBe('An internal error occurred');
      });

      it('should return generic message for undefined', () => {
        const result = sanitizeError(undefined);

        expect(result).toBe('An internal error occurred');
      });
    });

    describe('in production mode', () => {
      beforeEach(() => {
        vi.stubEnv('NODE_ENV', 'production');
      });

      afterEach(() => {
        vi.unstubAllEnvs();
      });

      it('should return generic message even for Error instances', () => {
        const error = new Error('Sensitive database error with connection string');
        const result = sanitizeError(error);

        expect(result).toBe('An internal error occurred');
      });

      it('should return generic message for non-Error objects', () => {
        const error = { code: 'ERR_123', message: 'bad request' };
        const result = sanitizeError(error);

        expect(result).toBe('An internal error occurred');
      });
    });

    describe('with no NODE_ENV set', () => {
      beforeEach(() => {
        vi.stubEnv('NODE_ENV', '');
      });

      afterEach(() => {
        vi.unstubAllEnvs();
      });

      it('should return generic message (defaults to production behavior)', () => {
        const error = new Error('Some error');
        const result = sanitizeError(error);

        expect(result).toBe('An internal error occurred');
      });
    });
  });

  describe('globalErrorHandler', () => {
    it('should log the full error server-side', () => {
      const error = new Error('Database connection failed');

      globalErrorHandler(
        error,
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[Error Handler] GET /api/test:',
        error
      );
    });

    it('should respond with 500 status code', () => {
      const error = new Error('Some error');

      globalErrorHandler(
        error,
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });

    it('should respond with JSON error object', () => {
      vi.stubEnv('NODE_ENV', 'development');

      const error = new Error('User not found');

      globalErrorHandler(
        error,
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Internal server error',
        message: 'User not found',
      });

      vi.unstubAllEnvs();
    });

    it('should sanitize error message in production', () => {
      vi.stubEnv('NODE_ENV', 'production');

      const error = new Error('Sensitive: password=abc123');

      globalErrorHandler(
        error,
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Internal server error',
        message: 'An internal error occurred',
      });

      vi.unstubAllEnvs();
    });

    it('should include method and path in log', () => {
      (mockReq as any).method = 'POST';
      (mockReq as any).path = '/api/sessions';
      const error = new Error('Validation failed');

      globalErrorHandler(
        error,
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[Error Handler] POST /api/sessions:',
        error
      );
    });

    it('should not call next middleware', () => {
      const error = new Error('Some error');

      globalErrorHandler(
        error,
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});
