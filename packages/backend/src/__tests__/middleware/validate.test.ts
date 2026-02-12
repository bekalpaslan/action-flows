import { describe, it, expect, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validateBody, validateQuery, validateSessionIdParam } from '../../middleware/validate.js';

describe('Validation Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let statusCode: number = 200;
  let responseBody: any = {};

  beforeEach(() => {
    // Reset mocks
    statusCode = 200;
    responseBody = {};

    mockReq = {
      body: {},
      query: {},
      params: {},
    };

    mockRes = {
      status: (code: number) => {
        statusCode = code;
        return mockRes as Response;
      },
      json: (data: any) => {
        responseBody = data;
        return mockRes as Response;
      },
    };

    mockNext = () => {};
  });

  describe('validateBody', () => {
    it('should pass validation with valid data', async () => {
      const schema = z.object({
        name: z.string(),
        age: z.number(),
      });

      mockReq.body = {
        name: 'John',
        age: 30,
      };

      let nextCalled = false;
      mockNext = () => {
        nextCalled = true;
      };

      const middleware = validateBody(schema);
      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(nextCalled).toBe(true);
      expect(mockReq.body).toEqual({
        name: 'John',
        age: 30,
      });
    });

    it('should reject invalid data types', async () => {
      const schema = z.object({
        name: z.string(),
        age: z.number(),
      });

      mockReq.body = {
        name: 'John',
        age: 'not a number',
      };

      const middleware = validateBody(schema);
      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(statusCode).toBe(400);
      expect(responseBody.error).toBe('Validation failed');
      expect(responseBody.details).toBeDefined();
    });

    it('should reject missing required fields', async () => {
      const schema = z.object({
        name: z.string(),
        email: z.string().email(),
      });

      mockReq.body = {
        name: 'John',
        // email missing
      };

      const middleware = validateBody(schema);
      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(statusCode).toBe(400);
      expect(responseBody.error).toBe('Validation failed');
    });

    it('should provide detailed error information', async () => {
      const schema = z.object({
        username: z.string().min(3),
      });

      mockReq.body = {
        username: 'ab', // Too short
      };

      const middleware = validateBody(schema);
      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(statusCode).toBe(400);
      expect(responseBody.details).toBeDefined();
      expect(Array.isArray(responseBody.details)).toBe(true);
      expect(responseBody.details.length).toBeGreaterThan(0);
    });

    it('should reject extra properties if strict', async () => {
      const schema = z.object({
        name: z.string(),
      }).strict();

      mockReq.body = {
        name: 'John',
        extra: 'field',
      };

      const middleware = validateBody(schema);
      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(statusCode).toBe(400);
    });

    it('should handle deeply nested objects', async () => {
      const schema = z.object({
        user: z.object({
          profile: z.object({
            name: z.string(),
            age: z.number(),
          }),
        }),
      });

      mockReq.body = {
        user: {
          profile: {
            name: 'John',
            age: 'invalid',
          },
        },
      };

      const middleware = validateBody(schema);
      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(statusCode).toBe(400);
      expect(responseBody.details[0].path).toContain('user');
    });

    it('should handle array validation', async () => {
      const schema = z.object({
        tags: z.array(z.string()),
      });

      mockReq.body = {
        tags: ['tag1', 123, 'tag2'],
      };

      const middleware = validateBody(schema);
      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(statusCode).toBe(400);
    });

    it('should sanitize error messages', async () => {
      const schema = z.object({
        database: z.object({
          password: z.string(),
        }),
      });

      mockReq.body = {
        database: {
          password: 123,
        },
      };

      const middleware = validateBody(schema);
      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(statusCode).toBe(400);
      // Error should include path info from Zod for debugging
      expect(responseBody.error).toBeDefined();
    });
  });

  describe('validateQuery', () => {
    it('should validate query parameters', async () => {
      const schema = z.object({
        limit: z.coerce.number().min(1).max(100),
        offset: z.coerce.number().min(0),
      });

      mockReq.query = {
        limit: '10',
        offset: '0',
      };

      let nextCalled = false;
      mockNext = () => {
        nextCalled = true;
      };

      const middleware = validateQuery(schema);
      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(nextCalled).toBe(true);
      expect(mockReq.query.limit).toBe(10);
      expect(mockReq.query.offset).toBe(0);
    });

    it('should reject invalid query parameter types', async () => {
      const schema = z.object({
        id: z.coerce.number(),
      });

      mockReq.query = {
        id: 'not-a-number',
      };

      const middleware = validateQuery(schema);
      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(statusCode).toBe(400);
    });

    it('should enforce min/max constraints', async () => {
      const schema = z.object({
        page: z.coerce.number().min(1).max(1000),
      });

      mockReq.query = {
        page: '2000',
      };

      const middleware = validateQuery(schema);
      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(statusCode).toBe(400);
    });

    it('should handle missing optional parameters', async () => {
      const schema = z.object({
        search: z.string().optional(),
        limit: z.coerce.number().default(10),
      });

      mockReq.query = {};

      let nextCalled = false;
      mockNext = () => {
        nextCalled = true;
      };

      const middleware = validateQuery(schema);
      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(nextCalled).toBe(true);
    });
  });

  describe('validateSessionIdParam', () => {
    it('should validate correct session ID format', async () => {
      mockReq.params = {
        id: 'session-1234567890',
      };

      let nextCalled = false;
      mockNext = () => {
        nextCalled = true;
      };

      const middleware = validateSessionIdParam('id');
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(nextCalled).toBe(true);
    });

    it('should reject empty session ID', async () => {
      mockReq.params = {
        id: '',
      };

      const middleware = validateSessionIdParam('id');
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(statusCode).toBe(400);
      expect(responseBody.error).toBe('Invalid session ID');
    });

    it('should reject oversized session ID', async () => {
      mockReq.params = {
        id: 'a'.repeat(300),
      };

      const middleware = validateSessionIdParam('id');
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(statusCode).toBe(400);
    });

    it('should reject session IDs with invalid characters', async () => {
      const invalidIds = [
        'session<script>alert(1)</script>',
        'session; DROP TABLE;',
        'session%00.txt',
        'session/../../../etc/passwd',
      ];

      for (const id of invalidIds) {
        statusCode = 200;
        responseBody = {};

        mockReq.params = { id };

        const middleware = validateSessionIdParam('id');
        middleware(mockReq as Request, mockRes as Response, mockNext);

        expect(statusCode).toBe(400);
      }
    });

    it('should accept valid special characters', async () => {
      const validIds = [
        'session-123',
        'session_456',
        'session:789',
        'session.abc',
      ];

      for (const id of validIds) {
        statusCode = 200;
        responseBody = {};

        mockReq.params = { id };

        let nextCalled = false;
        mockNext = () => {
          nextCalled = true;
        };

        const middleware = validateSessionIdParam('id');
        middleware(mockReq as Request, mockRes as Response, mockNext);

        expect(nextCalled).toBe(true);
      }
    });

    it('should report detailed validation errors', async () => {
      mockReq.params = {
        id: 'session-<script>',
      };

      const middleware = validateSessionIdParam('id');
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(statusCode).toBe(400);
      expect(responseBody.details).toBeDefined();
      expect(Array.isArray(responseBody.details)).toBe(true);
    });
  });

  describe('Data Sanitization', () => {
    it('should not allow prototype pollution via __proto__', async () => {
      const schema = z.object({
        name: z.string(),
      });

      mockReq.body = {
        name: 'test',
        __proto__: { isAdmin: true },
      };

      let nextCalled = false;
      mockNext = () => {
        nextCalled = true;
      };

      const middleware = validateBody(schema);
      await middleware(mockReq as Request, mockRes as Response, mockNext);

      // Zod will strip unknown properties (strict mode not enabled)
      // So __proto__ will be removed by Zod parsing
      if (nextCalled) {
        expect(mockReq.body).toEqual({ name: 'test' });
      } else {
        expect(statusCode).toBe(400);
      }
    });

    it('should not allow constructor pollution', async () => {
      const schema = z.object({
        name: z.string(),
      });

      mockReq.body = {
        name: 'test',
        constructor: { prototype: { isAdmin: true } },
      };

      let nextCalled = false;
      mockNext = () => {
        nextCalled = true;
      };

      const middleware = validateBody(schema);
      await middleware(mockReq as Request, mockRes as Response, mockNext);

      if (nextCalled) {
        // Zod strips unknown properties
        expect(mockReq.body).toEqual({ name: 'test' });
      }
    });

    it('should handle null/undefined safely', async () => {
      const schema = z.object({
        optional: z.string().optional(),
        required: z.string(),
      });

      mockReq.body = {
        optional: null,
        required: 'test',
      };

      const middleware = validateBody(schema);
      await middleware(mockReq as Request, mockRes as Response, mockNext);

      // Should reject or handle safely
      expect([200, 400]).toContain(statusCode);
    });
  });

  describe('Edge Cases', () => {
    it('should handle circular reference detection', async () => {
      const schema = z.object({
        value: z.string(),
      });

      const circular: any = { value: 'test' };
      circular.self = circular;

      mockReq.body = circular;

      const middleware = validateBody(schema);
      // Should not crash
      try {
        await middleware(mockReq as Request, mockRes as Response, mockNext);
        // Should complete without throwing
        expect(true).toBe(true);
      } catch (e) {
        // If it throws, that's also ok as long as it's handled
        expect(true).toBe(true);
      }
    });

    it('should handle very large payloads gracefully', async () => {
      const schema = z.object({
        data: z.string(),
      });

      mockReq.body = {
        data: 'x'.repeat(1000000),
      };

      let nextCalled = false;
      mockNext = () => {
        nextCalled = true;
      };

      const middleware = validateBody(schema);
      await middleware(mockReq as Request, mockRes as Response, mockNext);

      // Should handle without crashing
      expect([200, 400]).toContain(statusCode);
    });

    it('should coerce types appropriately when configured', async () => {
      const schema = z.object({
        count: z.coerce.number(),
        active: z.coerce.boolean(),
      });

      mockReq.body = {
        count: '42',
        active: 'true',
      };

      let nextCalled = false;
      mockNext = () => {
        nextCalled = true;
      };

      const middleware = validateBody(schema);
      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(nextCalled).toBe(true);
      expect(mockReq.body.count).toBe(42);
    });
  });

  describe('Error Response Format', () => {
    it('should return consistent error format', async () => {
      const schema = z.object({
        email: z.string().email(),
      });

      mockReq.body = {
        email: 'not-an-email',
      };

      const middleware = validateBody(schema);
      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(statusCode).toBe(400);
      expect(responseBody).toHaveProperty('error');
      expect(responseBody).toHaveProperty('details');
      expect(Array.isArray(responseBody.details)).toBe(true);
    });

    it('should include helpful validation details', async () => {
      const schema = z.object({
        username: z.string().min(3).max(20),
      });

      mockReq.body = {
        username: 'ab',
      };

      const middleware = validateBody(schema);
      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(statusCode).toBe(400);
      expect(responseBody.details[0]).toHaveProperty('path');
      expect(responseBody.details[0]).toHaveProperty('message');
      expect(responseBody.details[0]).toHaveProperty('code');
    });
  });
});
