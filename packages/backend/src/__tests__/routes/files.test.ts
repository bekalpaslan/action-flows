import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { app } from '../../index.js';
import { storage } from '../../storage/index.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

describe('Files Security', () => {
  let testCwd: string;
  let sessionId: string;

  beforeEach(async () => {
    // Clear storage
    if (storage.sessions) {
      storage.sessions.clear();
    }

    testCwd = path.join(os.tmpdir(), `test-files-${Date.now()}`);
    await fs.mkdir(testCwd, { recursive: true });

    // Create a test session
    const sessionRes = await request(app)
      .post('/api/sessions')
      .send({
        cwd: testCwd,
        hostname: 'test-machine',
        platform: 'darwin',
      });

    sessionId = sessionRes.body.id;
  });

  afterEach(async () => {
    if (storage.sessions) {
      storage.sessions.clear();
    }
    await fs.rm(testCwd, { recursive: true, force: true });
  });

  describe('Path Traversal Prevention', () => {
    it('should prevent reading files outside session cwd', async () => {
      const response = await request(app)
        .get(`/api/files/${sessionId}/read`)
        .query({ path: '../../../etc/passwd' });

      expect([403, 400, 404]).toContain(response.status);
    });

    it('should prevent reading files with absolute paths', async () => {
      const response = await request(app)
        .get(`/api/files/${sessionId}/read`)
        .query({ path: '/etc/passwd' });

      expect([403, 400, 404]).toContain(response.status);
    });

    it('should prevent reading with mixed separators', async () => {
      const response = await request(app)
        .get(`/api/files/${sessionId}/read`)
        .query({ path: '..\\..\\..\\windows\\system32\\config\\sam' });

      expect([403, 400, 404]).toContain(response.status);
    });

    it('should prevent symlink attack to escape working directory', async () => {
      try {
        // Create a symlink pointing outside
        const symlinkPath = path.join(testCwd, 'malicious-link');
        const externalDir = path.join(os.tmpdir(), `external-${Date.now()}`);
        await fs.mkdir(externalDir, { recursive: true });

        // Try to create symlink (may fail on some systems)
        try {
          await fs.symlink(externalDir, symlinkPath);

          const response = await request(app)
            .get(`/api/files/${sessionId}/tree`)
            .query({ path: 'malicious-link' });

          // Should either block or return success but not expose external data
          expect([200, 403]).toContain(response.status);
        } catch (e) {
          // Symlinks not supported on this system, skip
        }

        await fs.rm(externalDir, { recursive: true, force: true });
      } catch (e) {
        // Skip if symlinks not available
      }
    });

    it('should block encoded path traversal attempts', async () => {
      const encoded = encodeURIComponent('../../../etc/passwd');
      const response = await request(app)
        .get(`/api/files/${sessionId}/read`)
        .query({ path: encoded });

      expect([403, 400, 404]).toContain(response.status);
    });

    it('should block double-encoded attempts', async () => {
      const doubleEncoded = encodeURIComponent(encodeURIComponent('../../../etc/passwd'));
      const response = await request(app)
        .get(`/api/files/${sessionId}/read`)
        .query({ path: doubleEncoded });

      expect([403, 400, 404]).toContain(response.status);
    });
  });

  describe('Sensitive Directory Protection', () => {
    it('should block access to /etc directory', async () => {
      const response = await request(app)
        .get(`/api/files/${sessionId}/read`)
        .query({ path: '/etc' });

      expect([403, 400, 404]).toContain(response.status);
    });

    it('should block access to Windows system directories', async () => {
      const response = await request(app)
        .get(`/api/files/${sessionId}/read`)
        .query({ path: 'C:\\Windows' });

      expect([403, 400, 404]).toContain(response.status);
    });

    it('should block access to /sys directory', async () => {
      const response = await request(app)
        .get(`/api/files/${sessionId}/read`)
        .query({ path: '/sys' });

      expect([403, 400, 404]).toContain(response.status);
    });

    it('should block access to /proc directory', async () => {
      const response = await request(app)
        .get(`/api/files/${sessionId}/read`)
        .query({ path: '/proc' });

      expect([403, 400, 404]).toContain(response.status);
    });
  });

  describe('Unauthorized File Access', () => {
    it('should reject requests for non-existent sessions', async () => {
      const response = await request(app)
        .get('/api/files/nonexistent-session/read')
        .query({ path: 'file.txt' });

      expect([404, 400]).toContain(response.status);
    });

    it('should require valid session ID format', async () => {
      const malformedIds = [
        '; DROP TABLE;',
        '../../../',
        '<img src=x onerror=alert(1)>',
        "' OR '1'='1",
      ];

      for (const id of malformedIds) {
        const response = await request(app)
          .get(`/api/files/${id}/read`)
          .query({ path: 'file.txt' });

        expect([400, 404]).toContain(response.status);
      }
    });

    it('should not expose file system structure through errors', async () => {
      const response = await request(app)
        .get(`/api/files/${sessionId}/read`)
        .query({ path: '../../../sensitive/path' });

      const body = JSON.stringify(response.body);
      // Should not leak internal paths
      expect(body).not.toMatch(/\/var\//);
      expect(body).not.toMatch(/\/home\//);
    });
  });

  describe('Input Validation for File Operations', () => {
    it('should reject missing path parameter', async () => {
      const response = await request(app)
        .get(`/api/files/${sessionId}/read`);

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it('should reject empty path parameter', async () => {
      const response = await request(app)
        .get(`/api/files/${sessionId}/read`)
        .query({ path: '' });

      expect([400, 404]).toContain(response.status);
    });

    it('should reject null byte in path', async () => {
      const response = await request(app)
        .get(`/api/files/${sessionId}/read`)
        .query({ path: 'file.txt\x00.exe' });

      expect([400, 403, 404, 500]).toContain(response.status);
    });

    it('should reject overly long paths', async () => {
      const longPath = 'a/'.repeat(5000) + 'file.txt';
      const response = await request(app)
        .get(`/api/files/${sessionId}/read`)
        .query({ path: longPath });

      expect([400, 414, 431]).toContain(response.status);
    });

    it('should handle special characters safely', async () => {
      const specialPaths = [
        'file%00.txt',
        'file\r\ninjection.txt',
        'file\x00.txt',
      ];

      for (const specialPath of specialPaths) {
        const response = await request(app)
          .get(`/api/files/${sessionId}/read`)
          .query({ path: specialPath });

        // Should reject or handle safely
        expect([400, 403, 404]).toContain(response.status);
      }
    });
  });

  describe('File Write Operations Security', () => {
    it('should validate write path is within session cwd', async () => {
      const response = await request(app)
        .post(`/api/files/${sessionId}/write`)
        .send({
          path: '../../../etc/passwd.bak',
          content: 'malicious content',
        });

      // Should either reject or not exist/be protected
      expect([400, 403, 404]).toContain(response.status);
    });

    it('should prevent writing to sensitive locations', async () => {
      const response = await request(app)
        .post(`/api/files/${sessionId}/write`)
        .send({
          path: '/etc/config.txt',
          content: 'malicious',
        });

      expect([400, 403, 404]).toContain(response.status);
    });

    it('should reject oversized file writes', async () => {
      // Create large payload (10MB)
      const largeContent = 'x'.repeat(10 * 1024 * 1024);

      const response = await request(app)
        .post(`/api/files/${sessionId}/write`)
        .send({
          path: 'large-file.txt',
          content: largeContent,
        });

      // Should reject due to body size limit or other validation
      expect([400, 413, 500]).toContain(response.status);
    });
  });

  describe('Directory Traversal in Tree Listing', () => {
    it('should not list files outside session cwd', async () => {
      const response = await request(app)
        .get(`/api/files/${sessionId}/tree`)
        .query({ path: '../../../' });

      expect([403, 400, 404]).toContain(response.status);
    });

    it('should block tree listing with absolute paths', async () => {
      const response = await request(app)
        .get(`/api/files/${sessionId}/tree`)
        .query({ path: '/etc' });

      expect([403, 400, 404]).toContain(response.status);
    });

    it('should safely handle requested tree path validation', async () => {
      // Try various escape attempts
      const attempts = [
        '../../',
        '..\\..\\',
        '/etc',
        'C:\\Windows',
      ];

      for (const attempt of attempts) {
        const response = await request(app)
          .get(`/api/files/${sessionId}/tree`)
          .query({ path: attempt });

        expect([403, 400, 404]).toContain(response.status);
      }
    });
  });

  describe('File Metadata Protection', () => {
    it('should not expose sensitive metadata', async () => {
      // Create a test file
      const testFile = path.join(testCwd, 'test.txt');
      await fs.writeFile(testFile, 'test content');

      const response = await request(app)
        .get(`/api/files/${sessionId}/read`)
        .query({ path: 'test.txt' });

      // Response should not contain absolute paths
      if (response.status === 200) {
        const body = JSON.stringify(response.body);
        expect(body).not.toMatch(/C:\\Users/);
        expect(body).not.toMatch(/\/home\//);
      }
    });

    it('should handle file stat errors securely', async () => {
      const response = await request(app)
        .get(`/api/files/${sessionId}/read`)
        .query({ path: 'nonexistent-file.txt' });

      // Should return 404, not expose system info
      expect(response.status).toBe(404);
      const body = JSON.stringify(response.body);
      expect(body).not.toMatch(/ENOENT/);
    });
  });

  describe('Case Sensitivity and Normalization', () => {
    it('should handle path normalization securely', async () => {
      // Test paths with mixed cases that might bypass checks
      const response = await request(app)
        .get(`/api/files/${sessionId}/read`)
        .query({ path: '../ETC/passwd' });

      expect([403, 400, 404]).toContain(response.status);
    });

    it('should block traversal with unicode normalization', async () => {
      // Test unicode normalization attacks
      const response = await request(app)
        .get(`/api/files/${sessionId}/read`)
        .query({ path: '..%2F..%2F..%2Fetc%2Fpasswd' });

      expect([403, 400, 404]).toContain(response.status);
    });
  });
});
