import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { SessionId, ClaudeCliStartedEvent, ClaudeCliOutputEvent, ClaudeCliExitedEvent, WorkspaceEvent } from '@afw/shared';
import { brandedTypes } from '@afw/shared';
import { EventEmitter } from 'events';
import type { ChildProcess } from 'child_process';

// Mock child_process before imports
vi.mock('child_process', () => {
  return {
    spawn: vi.fn(),
  };
});

// Mock storage before imports
vi.mock('../../storage/index.js', () => ({
  storage: {
    setSession: vi.fn(),
    getSession: vi.fn(),
    addEvent: vi.fn(),
  },
}));

// Mock fs/promises for validateCwd
vi.mock('fs/promises', () => ({
  realpath: vi.fn(),
}));

// Import after mocking
import { claudeCliManager } from '../claudeCliManager.js';
import * as childProcessModule from 'child_process';
import { storage } from '../../storage/index.js';
import * as fs from 'fs/promises';

interface MockChildProcess {
  stdout: EventEmitter & { on: any };
  stderr: EventEmitter & { on: any };
  stdin: { write: any; writable: boolean };
  kill: any;
  on: any;
  pid?: number;
}

describe('ClaudeCliManager', () => {
  let mockChildProcess: MockChildProcess;
  let mockSpawn: any;
  let sessionId: SessionId;
  let broadcastSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    sessionId = brandedTypes.sessionId('test-manager-session-1');

    // Create mock child process
    mockChildProcess = {
      stdout: Object.assign(new EventEmitter(), { on: vi.fn() }),
      stderr: Object.assign(new EventEmitter(), { on: vi.fn() }),
      stdin: {
        write: vi.fn(),
        writable: true,
      },
      kill: vi.fn(),
      on: vi.fn(),
      pid: 12345,
    };

    // Setup mock spawn
    mockSpawn = vi.fn().mockReturnValue(mockChildProcess);
    // @ts-ignore - Mock doesn't need to match full ChildProcess type
    (childProcessModule.spawn as any) = mockSpawn;

    // Setup fs.realpath mock
    (fs.realpath as any).mockImplementation((path: string) => Promise.resolve(path));

    // Setup broadcast spy
    broadcastSpy = vi.fn();
    // @ts-ignore - Mock function signature is compatible at runtime
    claudeCliManager.setBroadcastFunction(broadcastSpy);

    // Clear any existing sessions from singleton
    claudeCliManager.stopAllSessions();
  });

  afterEach(() => {
    // Cleanup singleton state
    claudeCliManager.stopAllSessions();
  });

  describe('setBroadcastFunction', () => {
    it('should register broadcast function', () => {
      const newBroadcast = vi.fn();

      expect(() => claudeCliManager.setBroadcastFunction(newBroadcast)).not.toThrow();
    });
  });

  describe('startSession', () => {
    beforeEach(() => {
      // @ts-ignore - Mock event handler
      mockChildProcess.on = vi.fn((event, handler) => {
        if (event === 'spawn') {
          setTimeout(() => handler(), 0);
        }
        return mockChildProcess;
      });

      mockChildProcess.stdout.on = vi.fn().mockReturnValue(mockChildProcess.stdout);
      mockChildProcess.stderr.on = vi.fn().mockReturnValue(mockChildProcess.stderr);
    });

    it('should start a new Claude CLI session', async () => {
      const cwd = '/test/workspace';
      const prompt = 'Test prompt';

      const session = await claudeCliManager.startSession(sessionId, cwd, prompt);

      expect(session).toBeDefined();
      expect(session.getInfo().id).toBe(sessionId);
      expect(session.getInfo().cwd).toBe(cwd);
    });

    it('should spawn process with stream-json arguments', async () => {
      await claudeCliManager.startSession(sessionId, '/test', 'prompt');

      expect(mockSpawn).toHaveBeenCalledWith(
        'claude',
        expect.arrayContaining([
          '--print',
          '--input-format', 'stream-json',
          '--output-format', 'stream-json',
          '--include-partial-messages',
        ]),
        expect.objectContaining({
          cwd: '/test',
          stdio: ['pipe', 'pipe', 'pipe'],
        })
      );
    });

    it('should send initial prompt via stdin after spawn', async () => {
      const prompt = 'Initial prompt';

      await claudeCliManager.startSession(sessionId, '/test', prompt);

      const expectedMessage = JSON.stringify({
        type: 'user',
        message: { role: 'user', content: prompt },
      }) + '\n';

      expect(mockChildProcess.stdin.write).toHaveBeenCalledWith(expectedMessage, 'utf8');
    });

    it('should not send stdin if no prompt provided', async () => {
      await claudeCliManager.startSession(sessionId, '/test');

      expect(mockChildProcess.stdin.write).not.toHaveBeenCalled();
    });

    it('should store session in storage', async () => {
      await claudeCliManager.startSession(sessionId, '/test', 'prompt');

      expect(storage.setSession).toHaveBeenCalledWith(
        expect.objectContaining({
          id: sessionId,
          cwd: '/test',
          status: 'in_progress',
        })
      );
    });

    it('should store session:started event', async () => {
      await claudeCliManager.startSession(sessionId, '/test');

      expect(storage.addEvent).toHaveBeenCalledWith(
        sessionId,
        expect.objectContaining({
          type: 'session:started',
          sessionId,
          cwd: '/test',
        })
      );
    });

    it('should broadcast claude-cli:started event', async () => {
      await claudeCliManager.startSession(sessionId, '/test', 'prompt');

      expect(broadcastSpy).toHaveBeenCalledWith(
        sessionId,
        expect.objectContaining({
          type: 'claude-cli:started',
          sessionId,
          pid: 12345,
          cwd: '/test',
          prompt: 'prompt',
        })
      );
    });

    it('should add custom flags to spawn args', async () => {
      const flags = ['--fast', '--debug'];

      await claudeCliManager.startSession(sessionId, '/test', undefined, flags);

      expect(mockSpawn).toHaveBeenCalledWith(
        'claude',
        expect.arrayContaining(['--fast', '--debug']),
        expect.any(Object)
      );
    });

    it('should merge custom env vars', async () => {
      const envVars = { CUSTOM_VAR: 'value' };

      await claudeCliManager.startSession(sessionId, '/test', undefined, undefined, envVars);

      expect(mockSpawn).toHaveBeenCalledWith(
        'claude',
        expect.any(Array),
        expect.objectContaining({
          env: expect.objectContaining({
            CUSTOM_VAR: 'value',
            CI: '1',
          }),
        })
      );
    });

    it('should use custom MCP config path when provided', async () => {
      const mcpConfigPath = '/custom/mcp-config.json';

      await claudeCliManager.startSession(sessionId, '/test', undefined, undefined, undefined, mcpConfigPath);

      expect(mockSpawn).toHaveBeenCalledWith(
        'claude',
        expect.arrayContaining(['--mcp-config', mcpConfigPath]),
        expect.any(Object)
      );
    });

    it('should generate default MCP config when not provided', async () => {
      await claudeCliManager.startSession(sessionId, '/test');

      expect(mockSpawn).toHaveBeenCalledWith(
        'claude',
        expect.arrayContaining(['--mcp-config']),
        expect.any(Object)
      );

      // Check that the MCP config is a JSON string
      const spawnArgs = mockSpawn.mock.calls[0][1];
      const mcpConfigIndex = spawnArgs.indexOf('--mcp-config');
      const mcpConfig = spawnArgs[mcpConfigIndex + 1];

      expect(() => JSON.parse(mcpConfig)).not.toThrow();
      expect(JSON.parse(mcpConfig)).toHaveProperty('mcpServers');
    });

    it('should reject if session already exists', async () => {
      await claudeCliManager.startSession(sessionId, '/test');

      await expect(
        claudeCliManager.startSession(sessionId, '/test')
      ).rejects.toThrow('already exists');
    });

    it('should reject if MAX_SESSIONS limit reached', async () => {
      // Fill up to MAX_SESSIONS (default 5)
      const sessions: SessionId[] = [];
      for (let i = 0; i < 5; i++) {
        sessions.push(brandedTypes.sessionId(`session-${i}`));
      }

      for (const sid of sessions) {
        await claudeCliManager.startSession(sid, '/test');
      }

      const overflowSession = brandedTypes.sessionId('overflow-session');
      await expect(
        claudeCliManager.startSession(overflowSession, '/test')
      ).rejects.toThrow('Maximum number of Claude CLI sessions reached');
    });

    it('should use provided user parameter', async () => {
      await claudeCliManager.startSession(sessionId, '/test', undefined, undefined, undefined, undefined, 'custom-user');

      expect(storage.setSession).toHaveBeenCalledWith(
        expect.objectContaining({
          user: brandedTypes.userId('custom-user'),
        })
      );
    });

    it('should fallback to env USER when user not provided', async () => {
      process.env.USER = 'env-user';

      await claudeCliManager.startSession(sessionId, '/test');

      expect(storage.setSession).toHaveBeenCalledWith(
        expect.objectContaining({
          user: expect.any(String),
        })
      );

      delete process.env.USER;
    });
  });

  describe('Security Validation - validateCwd', () => {
    beforeEach(() => {
      // @ts-ignore - Mock event handler
      mockChildProcess.on = vi.fn((event, handler) => {
        if (event === 'spawn') {
          setTimeout(() => handler(), 0);
        }
        return mockChildProcess;
      });

      mockChildProcess.stdout.on = vi.fn().mockReturnValue(mockChildProcess.stdout);
      mockChildProcess.stderr.on = vi.fn().mockReturnValue(mockChildProcess.stderr);
    });

    it('should reject non-existent directory', async () => {
      (fs.realpath as any).mockRejectedValue(new Error('ENOENT'));

      await expect(
        claudeCliManager.startSession(sessionId, '/nonexistent')
      ).rejects.toThrow('does not exist or is not accessible');
    });

    it('should reject path traversal attempts', async () => {
      // Mock a path that contains '..' as part of a directory name
      // This tests the validation check for suspicious path patterns
      (fs.realpath as any).mockResolvedValue('/home/user/..data');

      await expect(
        claudeCliManager.startSession(sessionId, '/home/user/..data')
      ).rejects.toThrow('Path traversal detected');
    });

    it('should reject access to /etc', async () => {
      (fs.realpath as any).mockResolvedValue('/etc');

      await expect(
        claudeCliManager.startSession(sessionId, '/etc')
      ).rejects.toThrow('Access to system directories is not allowed');
    });

    it('should reject access to /sys', async () => {
      (fs.realpath as any).mockResolvedValue('/sys');

      await expect(
        claudeCliManager.startSession(sessionId, '/sys')
      ).rejects.toThrow('Access to system directories is not allowed');
    });

    it('should reject access to /root', async () => {
      (fs.realpath as any).mockResolvedValue('/root');

      await expect(
        claudeCliManager.startSession(sessionId, '/root')
      ).rejects.toThrow('Access to system directories is not allowed');
    });

    it('should reject access to C:\\Windows', async () => {
      (fs.realpath as any).mockResolvedValue('C:\\Windows');

      await expect(
        claudeCliManager.startSession(sessionId, 'C:\\Windows')
      ).rejects.toThrow('Access to system directories is not allowed');
    });

    it('should reject access to C:\\Program Files', async () => {
      (fs.realpath as any).mockResolvedValue('C:\\Program Files');

      await expect(
        claudeCliManager.startSession(sessionId, 'C:\\Program Files')
      ).rejects.toThrow('Access to system directories is not allowed');
    });

    it('should allow safe user directories', async () => {
      (fs.realpath as any).mockResolvedValue('/home/user/project');

      await expect(
        claudeCliManager.startSession(sessionId, '/home/user/project')
      ).resolves.toBeDefined();
    });
  });

  describe('Security Validation - validateFlags', () => {
    beforeEach(() => {
      // @ts-ignore - Mock event handler
      mockChildProcess.on = vi.fn((event, handler) => {
        if (event === 'spawn') {
          setTimeout(() => handler(), 0);
        }
        return mockChildProcess;
      });

      mockChildProcess.stdout.on = vi.fn().mockReturnValue(mockChildProcess.stdout);
      mockChildProcess.stderr.on = vi.fn().mockReturnValue(mockChildProcess.stderr);
    });

    it('should reject flags without dash prefix', async () => {
      const flags = ['no-dash'];

      await expect(
        claudeCliManager.startSession(sessionId, '/test', undefined, flags)
      ).rejects.toThrow('Invalid flag format');
    });

    it('should reject flags with semicolon (command injection)', async () => {
      const flags = ['--debug;rm -rf /'];

      await expect(
        claudeCliManager.startSession(sessionId, '/test', undefined, flags)
      ).rejects.toThrow('Invalid characters in flag');
    });

    it('should reject flags with pipe (command injection)', async () => {
      const flags = ['--debug|cat /etc/passwd'];

      await expect(
        claudeCliManager.startSession(sessionId, '/test', undefined, flags)
      ).rejects.toThrow('Invalid characters in flag');
    });

    it('should reject flags with backtick (command injection)', async () => {
      const flags = ['--debug`whoami`'];

      await expect(
        claudeCliManager.startSession(sessionId, '/test', undefined, flags)
      ).rejects.toThrow('Invalid characters in flag');
    });

    it('should reject flags with dollar sign (command injection)', async () => {
      const flags = ['--debug$(ls)'];

      await expect(
        claudeCliManager.startSession(sessionId, '/test', undefined, flags)
      ).rejects.toThrow('Invalid characters in flag');
    });

    it('should reject disallowed flags', async () => {
      const flags = ['--malicious-flag'];

      await expect(
        claudeCliManager.startSession(sessionId, '/test', undefined, flags)
      ).rejects.toThrow('Disallowed flag');
    });

    it('should allow --debug flag', async () => {
      const flags = ['--debug'];

      await expect(
        claudeCliManager.startSession(sessionId, '/test', undefined, flags)
      ).resolves.toBeDefined();
    });

    it('should allow --fast flag', async () => {
      const flags = ['--fast'];

      await expect(
        claudeCliManager.startSession(sessionId, '/test', undefined, flags)
      ).resolves.toBeDefined();
    });

    it('should allow --no-session-persistence flag', async () => {
      const flags = ['--no-session-persistence'];

      await expect(
        claudeCliManager.startSession(sessionId, '/test', undefined, flags)
      ).resolves.toBeDefined();
    });

    it('should allow multiple safe flags', async () => {
      const flags = ['--debug', '--fast', '--print'];

      await expect(
        claudeCliManager.startSession(sessionId, '/test', undefined, flags)
      ).resolves.toBeDefined();
    });
  });

  describe('WebSocket Broadcasting', () => {
    let stdoutHandler: (chunk: Buffer) => void;
    let stderrHandler: (chunk: Buffer) => void;
    let exitHandler: (code: number | null, signal: string | null) => void;

    beforeEach(async () => {
      // @ts-ignore - Mock event handler
      mockChildProcess.on = vi.fn((event, handler) => {
        if (event === 'spawn') {
          setTimeout(() => handler(), 0);
        } else if (event === 'exit') {
          exitHandler = handler;
        }
        return mockChildProcess;
      });

      mockChildProcess.stdout.on = vi.fn((event, handler) => {
        if (event === 'data') stdoutHandler = handler;
        return mockChildProcess.stdout;
      });

      mockChildProcess.stderr.on = vi.fn((event, handler) => {
        if (event === 'data') stderrHandler = handler;
        return mockChildProcess.stderr;
      });

      await claudeCliManager.startSession(sessionId, '/test');
      vi.clearAllMocks();
    });

    it('should broadcast claude-cli:output event on stdout', () => {
      const chunk = JSON.stringify({ type: 'assistant', message: { content: 'test output' } }) + '\n';
      stdoutHandler(Buffer.from(chunk));

      expect(broadcastSpy).toHaveBeenCalledWith(
        sessionId,
        expect.objectContaining({
          type: 'claude-cli:output',
          sessionId,
          output: 'test output',
          stream: 'stdout',
        })
      );
    });

    it('should broadcast claude-cli:output event on stderr', () => {
      const chunk = 'stderr output';
      stderrHandler(Buffer.from(chunk));

      expect(broadcastSpy).toHaveBeenCalledWith(
        sessionId,
        expect.objectContaining({
          type: 'claude-cli:output',
          sessionId,
          output: chunk,
          stream: 'stderr',
        })
      );
    });

    it('should broadcast claude-cli:exited event on process exit', () => {
      exitHandler(0, null);

      expect(broadcastSpy).toHaveBeenCalledWith(
        sessionId,
        expect.objectContaining({
          type: 'claude-cli:exited',
          sessionId,
          exitCode: 0,
          exitSignal: null,
        })
      );
    });

    it('should include duration in exit event', () => {
      exitHandler(0, null);

      const exitEvent = broadcastSpy.mock.calls.find(
        (call: any) => call[1].type === 'claude-cli:exited'
      )?.[1];

      expect(exitEvent.duration).toBeGreaterThanOrEqual(0);
    });

    it('should not broadcast when broadcast function not set', async () => {
      claudeCliManager.setBroadcastFunction(null as any);

      const chunk = JSON.stringify({ type: 'assistant', message: { content: 'test' } }) + '\n';
      stdoutHandler(Buffer.from(chunk));

      // Should not throw, just skip broadcast
      expect(broadcastSpy).not.toHaveBeenCalled();
    });
  });

  describe('Storage Integration', () => {
    let exitHandler: (code: number | null, signal: string | null) => void;

    beforeEach(async () => {
      // @ts-ignore - Mock event handler
      mockChildProcess.on = vi.fn((event, handler) => {
        if (event === 'spawn') {
          setTimeout(() => handler(), 0);
        } else if (event === 'exit') {
          exitHandler = handler;
        }
        return mockChildProcess;
      });

      mockChildProcess.stdout.on = vi.fn().mockReturnValue(mockChildProcess.stdout);
      mockChildProcess.stderr.on = vi.fn().mockReturnValue(mockChildProcess.stderr);

      // Mock getSession to return a session
      (storage.getSession as any).mockResolvedValue({
        id: sessionId,
        status: 'in_progress',
        cwd: '/test',
      });

      await claudeCliManager.startSession(sessionId, '/test');
      vi.clearAllMocks();
    });

    it('should update session status to completed on clean exit', async () => {
      exitHandler(0, null);

      // Wait for async storage update
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(storage.setSession).toHaveBeenCalledWith(
        expect.objectContaining({
          id: sessionId,
          status: 'completed',
        })
      );
    });

    it('should update session status to failed on non-zero exit', async () => {
      exitHandler(1, null);

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(storage.setSession).toHaveBeenCalledWith(
        expect.objectContaining({
          id: sessionId,
          status: 'failed',
        })
      );
    });

    it('should store session:ended event on exit', async () => {
      exitHandler(0, null);

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(storage.addEvent).toHaveBeenCalledWith(
        sessionId,
        expect.objectContaining({
          type: 'session:ended',
          sessionId,
        })
      );
    });

    it('should include exit reason in session:ended event', async () => {
      exitHandler(0, null);

      await new Promise(resolve => setTimeout(resolve, 10));

      const endEvent = (storage.addEvent as any).mock.calls.find(
        (call: any) => call[1].type === 'session:ended'
      )?.[1];

      expect(endEvent.reason).toBe('exit:0');
    });

    it('should include signal in session:ended event when killed by signal', async () => {
      exitHandler(null, 'SIGTERM');

      await new Promise(resolve => setTimeout(resolve, 10));

      const endEvent = (storage.addEvent as any).mock.calls.find(
        (call: any) => call[1].type === 'session:ended'
      )?.[1];

      expect(endEvent.reason).toBe('signal:SIGTERM');
    });

    it('should handle storage errors gracefully on exit', async () => {
      (storage.getSession as any).mockRejectedValue(new Error('Storage error'));

      // Should not throw
      expect(() => exitHandler(0, null)).not.toThrow();
    });
  });

  describe('getSession', () => {
    beforeEach(() => {
      // @ts-ignore - Mock event handler
      mockChildProcess.on = vi.fn((event, handler) => {
        if (event === 'spawn') {
          setTimeout(() => handler(), 0);
        }
        return mockChildProcess;
      });

      mockChildProcess.stdout.on = vi.fn().mockReturnValue(mockChildProcess.stdout);
      mockChildProcess.stderr.on = vi.fn().mockReturnValue(mockChildProcess.stderr);
    });

    it('should return session if it exists', async () => {
      await claudeCliManager.startSession(sessionId, '/test');

      const session = claudeCliManager.getSession(sessionId);

      expect(session).toBeDefined();
      expect(session!.getInfo().id).toBe(sessionId);
    });

    it('should return undefined if session does not exist', () => {
      const nonExistent = brandedTypes.sessionId('non-existent');

      const session = claudeCliManager.getSession(nonExistent);

      expect(session).toBeUndefined();
    });
  });

  describe('stopSession', () => {
    beforeEach(async () => {
      // @ts-ignore - Mock event handler
      mockChildProcess.on = vi.fn((event, handler) => {
        if (event === 'spawn') {
          setTimeout(() => handler(), 0);
        }
        return mockChildProcess;
      });

      mockChildProcess.stdout.on = vi.fn().mockReturnValue(mockChildProcess.stdout);
      mockChildProcess.stderr.on = vi.fn().mockReturnValue(mockChildProcess.stderr);

      await claudeCliManager.startSession(sessionId, '/test');
    });

    it('should stop a running session', () => {
      const result = claudeCliManager.stopSession(sessionId);

      expect(result).toBe(true);
      expect(mockChildProcess.kill).toHaveBeenCalledWith('SIGTERM');
    });

    it('should send custom signal when provided', () => {
      claudeCliManager.stopSession(sessionId, 'SIGKILL');

      expect(mockChildProcess.kill).toHaveBeenCalledWith('SIGKILL');
    });

    it('should return false if session does not exist', () => {
      const nonExistent = brandedTypes.sessionId('non-existent');

      const result = claudeCliManager.stopSession(nonExistent);

      expect(result).toBe(false);
    });

    it('should return false on stop error but not throw', () => {
      mockChildProcess.kill = vi.fn().mockImplementation(() => {
        throw new Error('Kill failed');
      });

      const result = claudeCliManager.stopSession(sessionId);

      expect(result).toBe(false);
    });
  });

  describe('listSessions', () => {
    beforeEach(() => {
      // @ts-ignore - Mock event handler
      mockChildProcess.on = vi.fn((event, handler) => {
        if (event === 'spawn') {
          setTimeout(() => handler(), 0);
        }
        return mockChildProcess;
      });

      mockChildProcess.stdout.on = vi.fn().mockReturnValue(mockChildProcess.stdout);
      mockChildProcess.stderr.on = vi.fn().mockReturnValue(mockChildProcess.stderr);
    });

    it('should return empty array when no sessions', () => {
      const sessions = claudeCliManager.listSessions();

      expect(sessions).toEqual([]);
    });

    it('should return all active session IDs', async () => {
      const session1 = brandedTypes.sessionId('session-1');
      const session2 = brandedTypes.sessionId('session-2');

      await claudeCliManager.startSession(session1, '/test1');
      await claudeCliManager.startSession(session2, '/test2');

      const sessions = claudeCliManager.listSessions();

      expect(sessions).toContain(session1);
      expect(sessions).toContain(session2);
      expect(sessions).toHaveLength(2);
    });
  });

  describe('stopAllSessions', () => {
    beforeEach(async () => {
      // @ts-ignore - Mock event handler
      mockChildProcess.on = vi.fn((event, handler) => {
        if (event === 'spawn') {
          setTimeout(() => handler(), 0);
        }
        return mockChildProcess;
      });

      mockChildProcess.stdout.on = vi.fn().mockReturnValue(mockChildProcess.stdout);
      mockChildProcess.stderr.on = vi.fn().mockReturnValue(mockChildProcess.stderr);
    });

    it('should stop all running sessions', async () => {
      const session1 = brandedTypes.sessionId('session-1');
      const session2 = brandedTypes.sessionId('session-2');

      await claudeCliManager.startSession(session1, '/test1');
      await claudeCliManager.startSession(session2, '/test2');

      claudeCliManager.stopAllSessions();

      expect(mockChildProcess.kill).toHaveBeenCalledTimes(2);
      expect(claudeCliManager.getSessionCount()).toBe(0);
    });

    it('should clear all sessions after stopping', async () => {
      await claudeCliManager.startSession(sessionId, '/test');

      claudeCliManager.stopAllSessions();

      expect(claudeCliManager.listSessions()).toEqual([]);
    });

    it('should handle errors gracefully when stopping sessions', async () => {
      await claudeCliManager.startSession(sessionId, '/test');

      mockChildProcess.kill = vi.fn().mockImplementation(() => {
        throw new Error('Kill failed');
      });

      // Should not throw
      expect(() => claudeCliManager.stopAllSessions()).not.toThrow();
    });
  });

  describe('getSessionCount', () => {
    beforeEach(() => {
      // @ts-ignore - Mock event handler
      mockChildProcess.on = vi.fn((event, handler) => {
        if (event === 'spawn') {
          setTimeout(() => handler(), 0);
        }
        return mockChildProcess;
      });

      mockChildProcess.stdout.on = vi.fn().mockReturnValue(mockChildProcess.stdout);
      mockChildProcess.stderr.on = vi.fn().mockReturnValue(mockChildProcess.stderr);
    });

    it('should return 0 when no sessions', () => {
      expect(claudeCliManager.getSessionCount()).toBe(0);
    });

    it('should return correct count after starting sessions', async () => {
      const session1 = brandedTypes.sessionId('session-1');
      const session2 = brandedTypes.sessionId('session-2');

      await claudeCliManager.startSession(session1, '/test1');
      expect(claudeCliManager.getSessionCount()).toBe(1);

      await claudeCliManager.startSession(session2, '/test2');
      expect(claudeCliManager.getSessionCount()).toBe(2);
    });

    it('should decrement after session exits', async () => {
      let exitHandler: (code: number | null, signal: string | null) => void;

      // @ts-ignore - Mock event handler
      mockChildProcess.on = vi.fn((event, handler) => {
        if (event === 'spawn') {
          setTimeout(() => handler(), 0);
        } else if (event === 'exit') {
          exitHandler = handler;
        }
        return mockChildProcess;
      });

      await claudeCliManager.startSession(sessionId, '/test');
      expect(claudeCliManager.getSessionCount()).toBe(1);

      exitHandler!(0, null);

      expect(claudeCliManager.getSessionCount()).toBe(0);
    });
  });

  describe('Session Limits', () => {
    beforeEach(() => {
      // @ts-ignore - Mock event handler
      mockChildProcess.on = vi.fn((event, handler) => {
        if (event === 'spawn') {
          setTimeout(() => handler(), 0);
        }
        return mockChildProcess;
      });

      mockChildProcess.stdout.on = vi.fn().mockReturnValue(mockChildProcess.stdout);
      mockChildProcess.stderr.on = vi.fn().mockReturnValue(mockChildProcess.stderr);
    });

    it('should enforce MAX_SESSIONS limit', async () => {
      // Start 5 sessions (default limit)
      for (let i = 0; i < 5; i++) {
        await claudeCliManager.startSession(
          brandedTypes.sessionId(`session-${i}`),
          '/test'
        );
      }

      // 6th session should fail
      await expect(
        claudeCliManager.startSession(brandedTypes.sessionId('session-6'), '/test')
      ).rejects.toThrow('Maximum number of Claude CLI sessions reached');
    });

    it('should allow new session after one exits', async () => {
      let exitHandler: (code: number | null, signal: string | null) => void;

      // @ts-ignore - Mock event handler
      mockChildProcess.on = vi.fn((event, handler) => {
        if (event === 'spawn') {
          setTimeout(() => handler(), 0);
        } else if (event === 'exit') {
          exitHandler = handler;
        }
        return mockChildProcess;
      });

      // Fill to limit
      for (let i = 0; i < 5; i++) {
        await claudeCliManager.startSession(
          brandedTypes.sessionId(`session-${i}`),
          '/test'
        );
      }

      // Exit one session
      exitHandler!(0, null);

      // Should now allow a new session
      await expect(
        claudeCliManager.startSession(brandedTypes.sessionId('new-session'), '/test')
      ).resolves.toBeDefined();
    });

    it('should prevent duplicate session IDs', async () => {
      await claudeCliManager.startSession(sessionId, '/test');

      await expect(
        claudeCliManager.startSession(sessionId, '/test')
      ).rejects.toThrow('already exists');
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      // @ts-ignore - Mock event handler
      mockChildProcess.on = vi.fn((event, handler) => {
        if (event === 'spawn') {
          setTimeout(() => handler(), 0);
        }
        return mockChildProcess;
      });

      mockChildProcess.stdout.on = vi.fn().mockReturnValue(mockChildProcess.stdout);
      mockChildProcess.stderr.on = vi.fn().mockReturnValue(mockChildProcess.stderr);
    });

    it('should clean up session on spawn error', async () => {
      // @ts-ignore - Mock event handler
      mockChildProcess.on = vi.fn((event, handler) => {
        if (event === 'error') {
          setTimeout(() => handler(new Error('Spawn error')), 0);
        }
        return mockChildProcess;
      });

      await expect(
        claudeCliManager.startSession(sessionId, '/test')
      ).rejects.toThrow('Spawn error');

      expect(claudeCliManager.getSession(sessionId)).toBeUndefined();
    });

    it('should remove session from map on error event', async () => {
      let errorHandler: (error: Error) => void;

      // @ts-ignore - Mock event handler
      mockChildProcess.on = vi.fn((event, handler) => {
        if (event === 'spawn') {
          setTimeout(() => handler(), 0);
        } else if (event === 'error') {
          errorHandler = handler;
        }
        return mockChildProcess;
      });

      await claudeCliManager.startSession(sessionId, '/test');
      expect(claudeCliManager.getSession(sessionId)).toBeDefined();

      errorHandler!(new Error('Process error'));

      expect(claudeCliManager.getSession(sessionId)).toBeUndefined();
    });
  });
});
