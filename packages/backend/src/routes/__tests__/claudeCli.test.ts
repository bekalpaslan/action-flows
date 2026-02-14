import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import express from 'express';
import type { Express } from 'express';
import request from 'supertest';
import type { SessionId } from '@afw/shared';
import { brandedTypes } from '@afw/shared';
import claudeCliRoutes from '../claudeCli.js';
import { claudeCliManager } from '../../services/claudeCliManager.js';
import { projectStorage } from '../../services/projectStorage.js';
import { EventEmitter } from 'events';

// Mock dependencies
vi.mock('../../services/claudeCliManager.js', () => ({
  claudeCliManager: {
    startSession: vi.fn(),
    getSession: vi.fn(),
    stopSession: vi.fn(),
    listSessions: vi.fn(),
  },
}));

vi.mock('../../services/projectStorage.js', () => ({
  projectStorage: {
    updateLastUsed: vi.fn(),
  },
}));

vi.mock('child_process', () => ({
  spawn: vi.fn(),
}));

interface MockSession {
  getInfo: () => any;
  sendInput: (input: string) => void;
  isRunning: () => boolean;
}

describe('Claude CLI Routes Integration', () => {
  let app: Express;
  let sessionId: SessionId;

  beforeEach(() => {
    vi.clearAllMocks();

    sessionId = brandedTypes.sessionId('test-session-route-1');

    // Setup Express app with routes
    app = express();
    app.use(express.json());
    app.use('/api/claude-cli', claudeCliRoutes);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/claude-cli/start', () => {
    it('should start a new Claude CLI session with valid request', async () => {
      const mockSession: MockSession = {
        getInfo: () => ({
          id: sessionId,
          status: 'running',
          cwd: '/test/workspace',
          pid: 12345,
          startedAt: new Date().toISOString(),
        }),
        sendInput: vi.fn(),
        isRunning: () => true,
      };

      (claudeCliManager.startSession as any).mockResolvedValue(mockSession);

      const response = await request(app)
        .post('/api/claude-cli/start')
        .send({
          sessionId,
          cwd: '/test/workspace',
          prompt: 'Test prompt',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.session.id).toBe(sessionId);
      expect(claudeCliManager.startSession).toHaveBeenCalledWith(
        sessionId,
        '/test/workspace',
        'Test prompt',
        undefined,
        undefined,
        undefined,
        undefined
      );
    });

    it('should reject request with missing sessionId', async () => {
      const response = await request(app)
        .post('/api/claude-cli/start')
        .send({
          cwd: '/test/workspace',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it('should reject request with missing cwd', async () => {
      const response = await request(app)
        .post('/api/claude-cli/start')
        .send({
          sessionId,
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it('should reject request with relative cwd path', async () => {
      const response = await request(app)
        .post('/api/claude-cli/start')
        .send({
          sessionId,
          cwd: './relative/path',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it('should reject request with cwd path too long', async () => {
      const longPath = '/test' + '/dir'.repeat(200);

      const response = await request(app)
        .post('/api/claude-cli/start')
        .send({
          sessionId,
          cwd: longPath,
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it('should reject request with prompt too long', async () => {
      const longPrompt = 'x'.repeat(10001);

      const response = await request(app)
        .post('/api/claude-cli/start')
        .send({
          sessionId,
          cwd: '/test/workspace',
          prompt: longPrompt,
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it('should accept custom flags', async () => {
      const mockSession: MockSession = {
        getInfo: () => ({ id: sessionId, status: 'running', cwd: '/test' }),
        sendInput: vi.fn(),
        isRunning: () => true,
      };

      (claudeCliManager.startSession as any).mockResolvedValue(mockSession);

      const response = await request(app)
        .post('/api/claude-cli/start')
        .send({
          sessionId,
          cwd: '/test/workspace',
          flags: ['--debug', '--fast'],
        });

      expect(response.status).toBe(200);
      expect(claudeCliManager.startSession).toHaveBeenCalledWith(
        sessionId,
        '/test/workspace',
        undefined,
        ['--debug', '--fast'],
        undefined,
        undefined,
        undefined
      );
    });

    it('should reject request with too many flags', async () => {
      const tooManyFlags = Array(51).fill('--flag');

      const response = await request(app)
        .post('/api/claude-cli/start')
        .send({
          sessionId,
          cwd: '/test/workspace',
          flags: tooManyFlags,
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it('should accept environment variables', async () => {
      const mockSession: MockSession = {
        getInfo: () => ({ id: sessionId, status: 'running', cwd: '/test' }),
        sendInput: vi.fn(),
        isRunning: () => true,
      };

      (claudeCliManager.startSession as any).mockResolvedValue(mockSession);

      const response = await request(app)
        .post('/api/claude-cli/start')
        .send({
          sessionId,
          cwd: '/test/workspace',
          envVars: { TEST_VAR: 'value' },
        });

      expect(response.status).toBe(200);
      expect(claudeCliManager.startSession).toHaveBeenCalledWith(
        sessionId,
        '/test/workspace',
        undefined,
        undefined,
        { TEST_VAR: 'value' },
        undefined,
        undefined
      );
    });

    it('should reject invalid environment variable keys', async () => {
      const response = await request(app)
        .post('/api/claude-cli/start')
        .send({
          sessionId,
          cwd: '/test/workspace',
          envVars: { 'INVALID;KEY': 'value' },
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid environment variable key');
    });

    it('should reject invalid environment variable values', async () => {
      const response = await request(app)
        .post('/api/claude-cli/start')
        .send({
          sessionId,
          cwd: '/test/workspace',
          envVars: { TEST_VAR: '\x00null byte' },
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid environment variable value');
    });

    it('should update project lastUsedAt when projectId provided', async () => {
      const mockSession: MockSession = {
        getInfo: () => ({ id: sessionId, status: 'running', cwd: '/test' }),
        sendInput: vi.fn(),
        isRunning: () => true,
      };

      (claudeCliManager.startSession as any).mockResolvedValue(mockSession);
      (projectStorage.updateLastUsed as any).mockResolvedValue(undefined);

      const response = await request(app)
        .post('/api/claude-cli/start')
        .send({
          sessionId,
          cwd: '/test/workspace',
          projectId: 'test-project',
        });

      expect(response.status).toBe(200);
      expect(projectStorage.updateLastUsed).toHaveBeenCalledWith('test-project');
    });

    it('should handle startSession errors gracefully', async () => {
      (claudeCliManager.startSession as any).mockRejectedValue(
        new Error('Failed to spawn process')
      );

      const response = await request(app)
        .post('/api/claude-cli/start')
        .send({
          sessionId,
          cwd: '/test/workspace',
        });

      expect(response.status).toBe(500);
      expect(response.body.error).toContain('Failed to spawn process');
    });
  });

  describe('POST /api/claude-cli/:sessionId/input', () => {
    it('should send input to existing session', async () => {
      const mockSession: MockSession = {
        getInfo: () => ({ id: sessionId, status: 'running', cwd: '/test' }),
        sendInput: vi.fn(),
        isRunning: () => true,
      };

      (claudeCliManager.getSession as any).mockReturnValue(mockSession);

      const response = await request(app)
        .post(`/api/claude-cli/${sessionId}/input`)
        .send({
          input: 'Test input',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(mockSession.sendInput).toHaveBeenCalledWith('Test input');
    });

    it('should return 404 for non-existent session', async () => {
      (claudeCliManager.getSession as any).mockReturnValue(undefined);

      const response = await request(app)
        .post(`/api/claude-cli/${sessionId}/input`)
        .send({
          input: 'Test input',
        });

      expect(response.status).toBe(404);
      expect(response.body.error).toContain('not found');
    });

    it('should reject request with missing input', async () => {
      const response = await request(app)
        .post(`/api/claude-cli/${sessionId}/input`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it('should reject input larger than 100KB', async () => {
      const largeInput = 'x'.repeat(100001);

      const response = await request(app)
        .post(`/api/claude-cli/${sessionId}/input`)
        .send({
          input: largeInput,
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it('should handle sendInput errors gracefully', async () => {
      const mockSession: MockSession = {
        getInfo: () => ({ id: sessionId, status: 'running', cwd: '/test' }),
        sendInput: vi.fn(() => {
          throw new Error('stdin not writable');
        }),
        isRunning: () => true,
      };

      (claudeCliManager.getSession as any).mockReturnValue(mockSession);

      const response = await request(app)
        .post(`/api/claude-cli/${sessionId}/input`)
        .send({
          input: 'Test input',
        });

      expect(response.status).toBe(500);
      expect(response.body.error).toContain('stdin not writable');
    });
  });

  describe('POST /api/claude-cli/:sessionId/stop', () => {
    it('should stop existing session with default signal', async () => {
      (claudeCliManager.stopSession as any).mockReturnValue(true);

      const response = await request(app)
        .post(`/api/claude-cli/${sessionId}/stop`)
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(claudeCliManager.stopSession).toHaveBeenCalledWith(sessionId, 'SIGTERM');
    });

    it('should stop session with custom signal', async () => {
      (claudeCliManager.stopSession as any).mockReturnValue(true);

      const response = await request(app)
        .post(`/api/claude-cli/${sessionId}/stop`)
        .send({
          signal: 'SIGKILL',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(claudeCliManager.stopSession).toHaveBeenCalledWith(sessionId, 'SIGKILL');
    });

    it('should return 404 for non-existent session', async () => {
      (claudeCliManager.stopSession as any).mockReturnValue(false);

      const response = await request(app)
        .post(`/api/claude-cli/${sessionId}/stop`)
        .send({});

      expect(response.status).toBe(404);
      expect(response.body.error).toContain('not found');
    });

    it('should reject invalid signal values', async () => {
      const response = await request(app)
        .post(`/api/claude-cli/${sessionId}/stop`)
        .send({
          signal: 'INVALID',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it('should handle stop errors gracefully', async () => {
      (claudeCliManager.stopSession as any).mockImplementation(() => {
        throw new Error('Failed to stop process');
      });

      const response = await request(app)
        .post(`/api/claude-cli/${sessionId}/stop`)
        .send({});

      expect(response.status).toBe(500);
      expect(response.body.error).toContain('Failed to stop process');
    });
  });

  describe('GET /api/claude-cli/:sessionId/status', () => {
    it('should return status for existing session', async () => {
      const mockSession: MockSession = {
        getInfo: () => ({
          id: sessionId,
          status: 'running',
          cwd: '/test',
          pid: 12345,
          startedAt: new Date('2024-01-01T00:00:00Z').toISOString(),
        }),
        sendInput: vi.fn(),
        isRunning: () => true,
      };

      (claudeCliManager.getSession as any).mockReturnValue(mockSession);

      const response = await request(app).get(`/api/claude-cli/${sessionId}/status`);

      expect(response.status).toBe(200);
      expect(response.body.session.id).toBe(sessionId);
      expect(response.body.session.status).toBe('running');
      expect(response.body.isRunning).toBe(true);
      expect(response.body.uptime).toBeGreaterThan(0);
    });

    it('should return 404 for non-existent session', async () => {
      (claudeCliManager.getSession as any).mockReturnValue(undefined);

      const response = await request(app).get(`/api/claude-cli/${sessionId}/status`);

      expect(response.status).toBe(404);
      expect(response.body.error).toContain('not found');
    });

    it('should calculate uptime correctly for running session', async () => {
      const startTime = Date.now() - 5000; // 5 seconds ago
      const mockSession: MockSession = {
        getInfo: () => ({
          id: sessionId,
          status: 'running',
          cwd: '/test',
          startedAt: new Date(startTime).toISOString(),
        }),
        sendInput: vi.fn(),
        isRunning: () => true,
      };

      (claudeCliManager.getSession as any).mockReturnValue(mockSession);

      const response = await request(app).get(`/api/claude-cli/${sessionId}/status`);

      expect(response.status).toBe(200);
      expect(response.body.uptime).toBeGreaterThanOrEqual(5000);
      expect(response.body.uptime).toBeLessThan(6000);
    });

    it('should return uptime 0 for stopped session', async () => {
      const mockSession: MockSession = {
        getInfo: () => ({
          id: sessionId,
          status: 'stopped',
          cwd: '/test',
          startedAt: new Date().toISOString(),
          endedAt: new Date().toISOString(),
        }),
        sendInput: vi.fn(),
        isRunning: () => false,
      };

      (claudeCliManager.getSession as any).mockReturnValue(mockSession);

      const response = await request(app).get(`/api/claude-cli/${sessionId}/status`);

      expect(response.status).toBe(200);
      expect(response.body.uptime).toBe(0);
    });

    it('should handle getSession errors gracefully', async () => {
      (claudeCliManager.getSession as any).mockImplementation(() => {
        throw new Error('Internal error');
      });

      const response = await request(app).get(`/api/claude-cli/${sessionId}/status`);

      expect(response.status).toBe(500);
      expect(response.body.error).toContain('Internal error');
    });
  });

  describe('GET /api/claude-cli/sessions', () => {
    it('should list all active sessions', async () => {
      const session1 = brandedTypes.sessionId('session-1');
      const session2 = brandedTypes.sessionId('session-2');

      const mockSession1: MockSession = {
        getInfo: () => ({ id: session1, status: 'running', cwd: '/test1' }),
        sendInput: vi.fn(),
        isRunning: () => true,
      };

      const mockSession2: MockSession = {
        getInfo: () => ({ id: session2, status: 'running', cwd: '/test2' }),
        sendInput: vi.fn(),
        isRunning: () => true,
      };

      (claudeCliManager.listSessions as any).mockReturnValue([session1, session2]);
      (claudeCliManager.getSession as any).mockImplementation((id: SessionId) => {
        if (id === session1) return mockSession1;
        if (id === session2) return mockSession2;
        return undefined;
      });

      const response = await request(app).get('/api/claude-cli/sessions');

      expect(response.status).toBe(200);
      expect(response.body.sessions).toHaveLength(2);
      expect(response.body.count).toBe(2);
      expect(response.body.sessions[0].id).toBe(session1);
      expect(response.body.sessions[1].id).toBe(session2);
    });

    it('should return empty array when no sessions', async () => {
      (claudeCliManager.listSessions as any).mockReturnValue([]);

      const response = await request(app).get('/api/claude-cli/sessions');

      expect(response.status).toBe(200);
      expect(response.body.sessions).toEqual([]);
      expect(response.body.count).toBe(0);
    });

    it('should filter out null sessions', async () => {
      const session1 = brandedTypes.sessionId('session-1');
      const session2 = brandedTypes.sessionId('session-2');

      const mockSession1: MockSession = {
        getInfo: () => ({ id: session1, status: 'running', cwd: '/test1' }),
        sendInput: vi.fn(),
        isRunning: () => true,
      };

      (claudeCliManager.listSessions as any).mockReturnValue([session1, session2]);
      (claudeCliManager.getSession as any).mockImplementation((id: SessionId) => {
        if (id === session1) return mockSession1;
        return undefined; // session2 not found
      });

      const response = await request(app).get('/api/claude-cli/sessions');

      expect(response.status).toBe(200);
      expect(response.body.sessions).toHaveLength(1);
      expect(response.body.sessions[0].id).toBe(session1);
    });

    it('should handle listSessions errors gracefully', async () => {
      (claudeCliManager.listSessions as any).mockImplementation(() => {
        throw new Error('Internal error');
      });

      const response = await request(app).get('/api/claude-cli/sessions');

      expect(response.status).toBe(500);
      expect(response.body.error).toContain('Internal error');
    });
  });
});
