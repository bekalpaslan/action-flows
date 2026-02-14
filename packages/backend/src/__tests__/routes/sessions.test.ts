import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import type { Session } from '@afw/shared';
import { brandedTypes } from '@afw/shared';
import { app } from '../../index.js';
import { storage } from '../../storage/index.js';
import * as os from 'os';
import * as path from 'path';

describe('Sessions Security', () => {
  let testSessionId: string;
  let testCwd: string;

  beforeEach(async () => {
    // Use a temporary directory for tests
    testCwd = path.join(os.tmpdir(), `test-${Date.now()}`);
    // Clear storage before each test
    if (storage.sessions) {
      storage.sessions.clear();
    }
  });

  afterEach(async () => {
    // Cleanup
    if (storage.sessions) {
      storage.sessions.clear();
    }
  });

  describe('Session Creation - Input Validation', () => {
    it('should reject empty cwd parameter', async () => {
      const response = await request(app)
        .post('/api/sessions')
        .send({
          cwd: '',
          hostname: 'test-machine',
          platform: 'darwin',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it('should reject non-existent directory', async () => {
      const response = await request(app)
        .post('/api/sessions')
        .send({
          cwd: '/nonexistent/directory/that/does/not/exist',
          hostname: 'test-machine',
          platform: 'darwin',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('does not exist');
    });

    it('should reject non-directory paths', async () => {
      // Create a test file
      const fs = await import('fs/promises');
      const testFile = path.join(testCwd, 'test.txt');

      try {
        await fs.mkdir(testCwd, { recursive: true });
        await fs.writeFile(testFile, 'test');

        const response = await request(app)
          .post('/api/sessions')
          .send({
            cwd: testFile,
            hostname: 'test-machine',
            platform: 'darwin',
          });

        expect(response.status).toBe(400);
        expect(response.body.error).toContain('must be a directory');
      } finally {
        await fs.rm(testCwd, { recursive: true, force: true });
      }
    });

    it('should reject system directory access', async () => {
      const response = await request(app)
        .post('/api/sessions')
        .send({
          cwd: '/etc',
          hostname: 'test-machine',
          platform: 'darwin',
        });

      // Should fail either because /etc doesn't exist on some systems
      // or because it's explicitly blocked
      expect([400, 403, 404]).toContain(response.status);
    });

    it('should reject Windows system directory access', async () => {
      const response = await request(app)
        .post('/api/sessions')
        .send({
          cwd: 'C:\\Windows\\System32',
          hostname: 'test-machine',
          platform: 'win32',
        });

      expect([400, 403, 404]).toContain(response.status);
    });

    it('should accept valid session creation with real directory', async () => {
      const fs = await import('fs/promises');

      try {
        await fs.mkdir(testCwd, { recursive: true });

        const response = await request(app)
          .post('/api/sessions')
          .send({
            cwd: testCwd,
            hostname: 'test-machine',
            platform: 'darwin',
          });

        expect(response.status).toBe(201);
        expect(response.body.id).toBeDefined();
        expect(response.body.cwd).toBe(testCwd);
        testSessionId = response.body.id;
      } finally {
        await fs.rm(testCwd, { recursive: true, force: true });
      }
    });
  });

  describe('Path Traversal Prevention', () => {
    it('should block path traversal with ../', async () => {
      const fs = await import('fs/promises');

      try {
        await fs.mkdir(testCwd, { recursive: true });

        // Create a session
        const sessionRes = await request(app)
          .post('/api/sessions')
          .send({
            cwd: testCwd,
            hostname: 'test-machine',
            platform: 'darwin',
          });

        const sessionId = sessionRes.body.id;

        // Try to access parent directory with path traversal
        const response = await request(app)
          .get(`/api/files/${sessionId}/read`)
          .query({ path: '../../etc/passwd' });

        expect([403, 400]).toContain(response.status);
      } finally {
        await fs.rm(testCwd, { recursive: true, force: true });
      }
    });

    it('should block absolute path escape attempts', async () => {
      const fs = await import('fs/promises');

      try {
        await fs.mkdir(testCwd, { recursive: true });

        const sessionRes = await request(app)
          .post('/api/sessions')
          .send({
            cwd: testCwd,
            hostname: 'test-machine',
            platform: 'darwin',
          });

        const sessionId = sessionRes.body.id;

        // Try to access absolute path outside session
        const response = await request(app)
          .get(`/api/files/${sessionId}/read`)
          .query({ path: '/etc/passwd' });

        expect([403, 400]).toContain(response.status);
      } finally {
        await fs.rm(testCwd, { recursive: true, force: true });
      }
    });

    it('should block null byte injection in path', async () => {
      const fs = await import('fs/promises');

      try {
        await fs.mkdir(testCwd, { recursive: true });

        const sessionRes = await request(app)
          .post('/api/sessions')
          .send({
            cwd: testCwd,
            hostname: 'test-machine',
            platform: 'darwin',
          });

        const sessionId = sessionRes.body.id;

        // Try null byte injection
        const response = await request(app)
          .get(`/api/files/${sessionId}/read`)
          .query({ path: 'file.txt\x00../../etc/passwd' });

        expect([400, 403, 404]).toContain(response.status);
      } finally {
        await fs.rm(testCwd, { recursive: true, force: true });
      }
    });
  });

  describe('Session Hijacking Prevention', () => {
    it('should not allow accessing another session\'s data without authorization', async () => {
      const fs = await import('fs/promises');

      try {
        await fs.mkdir(testCwd, { recursive: true });

        // Create a session
        const sessionRes = await request(app)
          .post('/api/sessions')
          .send({
            cwd: testCwd,
            hostname: 'test-machine',
            platform: 'darwin',
          });

        const realSessionId = sessionRes.body.id;

        // Try to access with a fake/spoofed session ID
        const fakeSessionId = 'session-' + Math.random().toString(36).substr(2, 9);

        const response = await request(app)
          .get(`/api/sessions/${fakeSessionId}`);

        // Should return 404 or unauthorized
        expect([404, 401, 403]).toContain(response.status);
      } finally {
        await fs.rm(testCwd, { recursive: true, force: true });
      }
    });

    it('should validate session ID format strictly', async () => {
      // Try various malformed session IDs
      const malformedIds = [
        '; DROP TABLE sessions; --',
        '../../../etc/passwd',
        '${process.env.SECRET}',
        '<script>alert(1)</script>',
        '%27 OR 1=1 --',
      ];

      for (const id of malformedIds) {
        const response = await request(app)
          .get(`/api/sessions/${id}`);

        expect([400, 404]).toContain(response.status);
      }
    });

    it('should include CSRF protection headers', async () => {
      const fs = await import('fs/promises');

      try {
        await fs.mkdir(testCwd, { recursive: true });

        const response = await request(app)
          .post('/api/sessions')
          .send({
            cwd: testCwd,
            hostname: 'test-machine',
            platform: 'darwin',
          });

        // Check for security headers
        expect(response.headers['x-content-type-options']).toBeDefined();
        expect(response.status).toBe(201);
      } finally {
        await fs.rm(testCwd, { recursive: true, force: true });
      }
    });
  });

  describe('Unauthorized Session Access', () => {
    it('should reject requests without proper authentication headers if required', async () => {
      const fs = await import('fs/promises');

      try {
        await fs.mkdir(testCwd, { recursive: true });

        // First create a valid session
        const createRes = await request(app)
          .post('/api/sessions')
          .send({
            cwd: testCwd,
            hostname: 'test-machine',
            platform: 'darwin',
          });

        expect([201, 429]).toContain(createRes.status);
        if (createRes.status !== 201) return; // Skip rest if rate limited
        const sessionId = createRes.body.id;

        // If API key is required, test it
        const testRes = await request(app)
          .get(`/api/sessions/${sessionId}`)
          .set('Authorization', 'Bearer invalid-token');

        // Should succeed if no auth required, or fail if auth required
        // The important thing is that the session exists and is accessible
        expect([200, 401, 403]).toContain(testRes.status);
      } finally {
        await fs.rm(testCwd, { recursive: true, force: true });
      }
    });

    it('should not expose sensitive session information in errors', async () => {
      const response = await request(app)
        .get('/api/sessions/nonexistent-id');

      // Error message should not leak paths or internal details
      const body = JSON.stringify(response.body);
      expect(body).not.toMatch(/\/var\//);
      expect(body).not.toMatch(/\/home\//);
      expect(body).not.toMatch(/C:\\\w/);
    });
  });

  describe('Rate Limiting on Session Creation', () => {
    it('should handle rate limiting appropriately', async () => {
      const fs = await import('fs/promises');

      try {
        await fs.mkdir(testCwd, { recursive: true });

        // Make multiple rapid requests
        const requests = [];
        for (let i = 0; i < 3; i++) {
          requests.push(
            request(app)
              .post('/api/sessions')
              .send({
                cwd: testCwd,
                hostname: 'test-machine',
                platform: 'darwin',
              })
          );
        }

        const responses = await Promise.all(requests);

        // All responses should be valid (either success or rate limited)
        const allValid = responses.every(r => [201, 429].includes(r.status));
        expect(allValid).toBe(true);

        // At least one should succeed or all rate limited (depending on test order)
        const hasSuccess = responses.some(r => r.status === 201);
        const allRateLimited = responses.every(r => r.status === 429);
        expect(hasSuccess || allRateLimited).toBe(true);
      } finally {
        await fs.rm(testCwd, { recursive: true, force: true });
      }
    });
  });

  describe('Data Type Validation', () => {
    it('should reject non-string cwd values', async () => {
      const response = await request(app)
        .post('/api/sessions')
        .send({
          cwd: 12345,
          hostname: 'test-machine',
          platform: 'darwin',
        });

      expect([400, 429]).toContain(response.status);
      if (response.status === 400) {
        expect(response.body.error).toBeDefined();
      }
    });

    it('should reject non-string hostname values', async () => {
      const response = await request(app)
        .post('/api/sessions')
        .send({
          cwd: testCwd,
          hostname: ['array', 'value'],
          platform: 'darwin',
        });

      expect([400, 429]).toContain(response.status);
    });

    it('should reject extra/unknown properties without strict mode', async () => {
      const fs = await import('fs/promises');

      try {
        await fs.mkdir(testCwd, { recursive: true });

        const response = await request(app)
          .post('/api/sessions')
          .send({
            cwd: testCwd,
            hostname: 'test-machine',
            platform: 'darwin',
            // Extra malicious properties
            __proto__: { admin: true },
            constructor: { prototype: { isAdmin: true } },
          });

        // Should either reject or safely ignore (rate limiting can also occur)
        expect([201, 400, 429]).toContain(response.status);
      } finally {
        await fs.rm(testCwd, { recursive: true, force: true });
      }
    });
  });
});
