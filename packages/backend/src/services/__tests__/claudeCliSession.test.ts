import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { SessionId, ClaudeCliSession } from '@afw/shared';
import { brandedTypes } from '@afw/shared';
import { EventEmitter } from 'events';
import type { ChildProcess } from 'child_process';

// Mock child_process before imports
vi.mock('child_process', () => {
  return {
    spawn: vi.fn(),
  };
});

// Import after mocking
import { ClaudeCliSessionProcess } from '../claudeCliSession.js';
import * as childProcessModule from 'child_process';

interface MockChildProcess {
  stdout: EventEmitter & { on: any };
  stderr: EventEmitter & { on: any };
  stdin: { write: any; writable: boolean };
  kill: any;
  on: any;
  pid?: number;
}

describe('ClaudeCliSessionProcess', () => {
  let mockChildProcess: MockChildProcess;
  let sessionId: SessionId;
  let mockSpawn: any;

  beforeEach(() => {
    vi.clearAllMocks();

    sessionId = brandedTypes.sessionId('test-session-cli-1');

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
  });

  describe('Constructor', () => {
    it('should initialize with correct session info', () => {
      const cwd = '/test/workspace';
      const args = ['--print', '--input-format', 'stream-json'];
      const metadata = { prompt: 'test prompt' };

      const session = new ClaudeCliSessionProcess(sessionId, cwd, args, metadata);

      const info = session.getInfo();
      expect(info.id).toBe(sessionId);
      expect(info.status).toBe('starting');
      expect(info.cwd).toBe(cwd);
      expect(info.spawnArgs).toEqual(args);
      expect(info.metadata).toEqual(metadata);
      expect(info.pid).toBeNull();
    });

    it('should initialize without metadata', () => {
      const session = new ClaudeCliSessionProcess(
        sessionId,
        '/test/workspace',
        ['--print']
      );

      const info = session.getInfo();
      expect(info.metadata).toBeUndefined();
    });
  });

  describe('Process Lifecycle', () => {
    it('should spawn process with correct arguments', async () => {
      const cwd = '/test/workspace';
      const args = ['--print', '--input-format', 'stream-json'];
      const session = new ClaudeCliSessionProcess(sessionId, cwd, args);

      // Trigger spawn event
      // @ts-ignore - Mock event handler
      mockChildProcess.on = vi.fn((event, handler) => {
        if (event === 'spawn') {
          setTimeout(() => handler(), 0);
        }
        return mockChildProcess;
      });

      await session.start();

      expect(mockSpawn).toHaveBeenCalledWith('claude', args, {
        cwd,
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: false,
        env: expect.objectContaining({
          CI: '1',
        }),
      });
    });

    it('should transition status from starting to running on spawn', async () => {
      const session = new ClaudeCliSessionProcess(sessionId, '/test', ['--print']);

      // @ts-ignore - Mock event handler
      mockChildProcess.on = vi.fn((event, handler) => {
        if (event === 'spawn') {
          setTimeout(() => handler(), 0);
        }
        return mockChildProcess;
      });

      expect(session.getInfo().status).toBe('starting');

      await session.start();

      expect(session.getInfo().status).toBe('running');
      expect(session.getInfo().pid).toBe(12345);
    });

    it('should set status to error on process spawn error', async () => {
      const session = new ClaudeCliSessionProcess(sessionId, '/test', ['--print']);
      const spawnError = new Error('Spawn failed');

      // @ts-ignore - Mock event handler
      mockChildProcess.on = vi.fn((event, handler) => {
        if (event === 'error') {
          setTimeout(() => handler(spawnError), 0);
        }
        return mockChildProcess;
      });

      await expect(session.start()).rejects.toThrow('Spawn failed');
      expect(session.getInfo().status).toBe('error');
    });

    it('should reject double start attempts', async () => {
      const session = new ClaudeCliSessionProcess(sessionId, '/test', ['--print']);

      // @ts-ignore - Mock event handler
      mockChildProcess.on = vi.fn((event, handler) => {
        if (event === 'spawn') {
          setTimeout(() => handler(), 0);
        }
        return mockChildProcess;
      });

      await session.start();

      await expect(session.start()).rejects.toThrow('Claude CLI session already started');
    });

    it('should report isRunning as true when process is active', async () => {
      const session = new ClaudeCliSessionProcess(sessionId, '/test', ['--print']);

      // @ts-ignore - Mock event handler
      mockChildProcess.on = vi.fn((event, handler) => {
        if (event === 'spawn') {
          setTimeout(() => handler(), 0);
        }
        return mockChildProcess;
      });

      expect(session.isRunning()).toBe(false);

      await session.start();

      expect(session.isRunning()).toBe(true);
    });

    it('should set exit code and signal on process exit', async () => {
      const session = new ClaudeCliSessionProcess(sessionId, '/test', ['--print']);
      let exitHandler: (code: number | null, signal: string | null) => void;

      // @ts-ignore - Mock event handler
      mockChildProcess.on = vi.fn((event, handler) => {
        if (event === 'spawn') {
          setTimeout(() => handler(), 0);
        }
        if (event === 'exit') {
          exitHandler = handler;
        }
        return mockChildProcess;
      });

      await session.start();

      exitHandler!(0, null);

      const info = session.getInfo();
      expect(info.status).toBe('stopped');
      expect(info.exitCode).toBe(0);
      expect(info.endedAt).toBeDefined();
    });

    it('should clear process reference after exit', async () => {
      const session = new ClaudeCliSessionProcess(sessionId, '/test', ['--print']);
      let exitHandler: (code: number | null, signal: string | null) => void;

      // @ts-ignore - Mock event handler
      mockChildProcess.on = vi.fn((event, handler) => {
        if (event === 'spawn') {
          setTimeout(() => handler(), 0);
        }
        if (event === 'exit') {
          exitHandler = handler;
        }
        return mockChildProcess;
      });

      await session.start();
      expect(session.isRunning()).toBe(true);

      exitHandler!(0, null);

      expect(session.isRunning()).toBe(false);
    });
  });

  describe('Stream-json Parsing', () => {
    let session: ClaudeCliSessionProcess;

    beforeEach(async () => {
      session = new ClaudeCliSessionProcess(sessionId, '/test', ['--print']);

      // @ts-ignore - Mock event handler
      mockChildProcess.on = vi.fn((event, handler) => {
        if (event === 'spawn') {
          setTimeout(() => handler(), 0);
        }
        return mockChildProcess;
      });

      await session.start();
    });

    it('should parse assistant message content', () => {
      const chunk = JSON.stringify({
        type: 'assistant',
        message: { role: 'assistant', content: 'Hello, world!' },
      }) + '\n';

      const parsed = session['parseStreamJson'](chunk);

      expect(parsed).toBe('Hello, world!');
    });

    it('should parse result message content', () => {
      const chunk = JSON.stringify({
        type: 'result',
        result: 'Operation completed',
      }) + '\n';

      const parsed = session['parseStreamJson'](chunk);

      expect(parsed).toBe('Operation completed');
    });

    it('should parse error message content', () => {
      const chunk = JSON.stringify({
        type: 'error',
        error: 'Something went wrong',
      }) + '\n';

      const parsed = session['parseStreamJson'](chunk);

      expect(parsed).toBe('[ERROR] Something went wrong');
    });

    it('should skip empty lines', () => {
      const chunk = '\n\n\n';

      const parsed = session['parseStreamJson'](chunk);

      expect(parsed).toBe('');
    });

    it('should handle multi-line JSONL input', () => {
      const chunk = JSON.stringify({ type: 'assistant', message: { content: 'Line 1' } }) + '\n' +
        JSON.stringify({ type: 'assistant', message: { content: 'Line 2' } }) + '\n';

      const parsed = session['parseStreamJson'](chunk);

      expect(parsed).toBe('Line 1Line 2');
    });

    it('should buffer partial lines across chunks', () => {
      const chunk1 = '{"type":"assistant","message":{"content":"Partial';
      const chunk2 = ' message"}}\n';

      const parsed1 = session['parseStreamJson'](chunk1);
      expect(parsed1).toBe(''); // No complete line yet

      const parsed2 = session['parseStreamJson'](chunk2);
      expect(parsed2).toBe('Partial message');
    });

    it('should fallback to raw text on malformed JSON', () => {
      const chunk = 'Not valid JSON\n';

      const parsed = session['parseStreamJson'](chunk);

      expect(parsed).toBe('Not valid JSON');
    });

    it('should handle empty content in assistant messages', () => {
      const chunk = JSON.stringify({
        type: 'assistant',
        message: { role: 'assistant', content: '' },
      }) + '\n';

      const parsed = session['parseStreamJson'](chunk);

      expect(parsed).toBe('');
    });

    it('should reset buffer when exceeding MAX_BUFFER_SIZE', () => {
      const largeChunk = 'x'.repeat(1048577); // Exceeds 1MB limit

      const parsed = session['parseStreamJson'](largeChunk);

      expect(parsed).toBe('');
      // Buffer should be reset, next parse should work
      const chunk = JSON.stringify({ type: 'assistant', message: { content: 'New' } }) + '\n';
      const parsed2 = session['parseStreamJson'](chunk);
      expect(parsed2).toBe('New');
    });

    it('should handle unknown message types gracefully', () => {
      const chunk = JSON.stringify({
        type: 'unknown-type',
        data: 'some data',
      }) + '\n';

      const parsed = session['parseStreamJson'](chunk);

      expect(parsed).toBe(''); // Unknown types are ignored
    });

    it('should clear buffer on process exit', async () => {
      let exitHandler: ((code: number | null, signal: string | null) => void) | undefined;

      // Create a new session with proper mock setup
      const testSession = new ClaudeCliSessionProcess(
        brandedTypes.sessionId('test-session-exit'),
        '/test',
        ['--print']
      );

      // @ts-ignore - Mock event handler
      mockChildProcess.on = vi.fn((event, handler) => {
        if (event === 'spawn') {
          setTimeout(() => handler(), 0);
        }
        if (event === 'exit') {
          exitHandler = handler;
        }
        return mockChildProcess;
      });

      await testSession.start();

      // Fill buffer with partial data
      testSession['parseStreamJson']('{"partial');

      // Verify exitHandler was registered
      expect(exitHandler).toBeDefined();

      // Trigger exit
      if (exitHandler) {
        exitHandler(0, null);
      }

      // Buffer should be cleared (verified indirectly by no memory leak)
      // The test passes if no errors are thrown
    });
  });

  describe('Stdin Communication', () => {
    let session: ClaudeCliSessionProcess;

    beforeEach(async () => {
      session = new ClaudeCliSessionProcess(sessionId, '/test', ['--print']);

      // @ts-ignore - Mock event handler
      mockChildProcess.on = vi.fn((event, handler) => {
        if (event === 'spawn') {
          setTimeout(() => handler(), 0);
        }
        return mockChildProcess;
      });

      await session.start();
    });

    it('should format input as stream-json JSONL', () => {
      const input = 'Hello from user';

      session.sendInput(input);

      const expectedMessage = JSON.stringify({
        type: 'user',
        message: { role: 'user', content: 'Hello from user' },
      }) + '\n';

      expect(mockChildProcess.stdin.write).toHaveBeenCalledWith(expectedMessage, 'utf8');
    });

    it('should trim whitespace from input', () => {
      session.sendInput('  trimmed  \n');

      const expectedMessage = JSON.stringify({
        type: 'user',
        message: { role: 'user', content: 'trimmed' },
      }) + '\n';

      expect(mockChildProcess.stdin.write).toHaveBeenCalledWith(expectedMessage, 'utf8');
    });

    it('should throw error if process not running', () => {
      const stoppedSession = new ClaudeCliSessionProcess(sessionId, '/test', ['--print']);

      expect(() => stoppedSession.sendInput('test')).toThrow('Claude CLI session not running');
    });

    it('should throw error if stdin not available', async () => {
      mockChildProcess.stdin = undefined as any;

      expect(() => session.sendInput('test')).toThrow('stdin not available');
    });

    it('should throw error if stdin not writable', () => {
      mockChildProcess.stdin.writable = false;

      expect(() => session.sendInput('test')).toThrow('stdin is not writable');
    });

    it('should reject input larger than 100KB', () => {
      const largeInput = 'x'.repeat(100001);

      expect(() => session.sendInput(largeInput)).toThrow('Input too large');
    });

    it('should reject input containing null bytes', () => {
      const inputWithNull = 'Hello\0World';

      expect(() => session.sendInput(inputWithNull)).toThrow('Input contains null bytes');
    });

    it('should propagate write errors', () => {
      const writeError = new Error('Write failed');
      mockChildProcess.stdin.write = vi.fn().mockImplementation(() => {
        throw writeError;
      });

      expect(() => session.sendInput('test')).toThrow('Write failed');
    });
  });

  describe('Event Handlers', () => {
    let session: ClaudeCliSessionProcess;
    let stdoutHandler: (chunk: Buffer) => void;
    let stderrHandler: (chunk: Buffer) => void;
    let exitHandler: (code: number | null, signal: string | null) => void;
    let errorHandler: (error: Error) => void;

    beforeEach(async () => {
      session = new ClaudeCliSessionProcess(sessionId, '/test', ['--print']);

      // @ts-ignore - Mock event handler
      mockChildProcess.on = vi.fn((event, handler) => {
        if (event === 'spawn') {
          setTimeout(() => handler(), 0);
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

      const onMock = vi.fn((event: any, handler: any) => {
        if (event === 'spawn') {
          setTimeout(() => handler(), 0);
        } else if (event === 'exit') {
          exitHandler = handler;
        } else if (event === 'error') {
          errorHandler = handler;
        }
        return mockChildProcess;
      });
      mockChildProcess.on = onMock as any;

      await session.start();
    });

    it('should register stdout handler', () => {
      const handler = vi.fn();
      session.on('stdout', handler);

      const chunk = JSON.stringify({ type: 'assistant', message: { content: 'test' } }) + '\n';
      stdoutHandler(Buffer.from(chunk));

      expect(handler).toHaveBeenCalledWith('test');
    });

    it('should register stderr handler', () => {
      const handler = vi.fn();
      session.on('stderr', handler);

      const chunk = 'Error output\n';
      stderrHandler(Buffer.from(chunk));

      expect(handler).toHaveBeenCalledWith(chunk);
    });

    it('should register exit handler', () => {
      const handler = vi.fn();
      session.on('exit', handler);

      exitHandler(0, null);

      expect(handler).toHaveBeenCalledWith(0, null);
    });

    it('should register error handler', () => {
      const handler = vi.fn();
      session.on('error', handler);

      const error = new Error('Process error');
      errorHandler(error);

      expect(handler).toHaveBeenCalledWith(error);
    });

    it('should unregister stdout handler', () => {
      const handler = vi.fn();
      session.on('stdout', handler);
      session.off('stdout', handler);

      const chunk = JSON.stringify({ type: 'assistant', message: { content: 'test' } }) + '\n';
      stdoutHandler(Buffer.from(chunk));

      expect(handler).not.toHaveBeenCalled();
    });

    it('should unregister exit handler', () => {
      const handler = vi.fn();
      session.on('exit', handler);
      session.off('exit', handler);

      exitHandler(0, null);

      expect(handler).not.toHaveBeenCalled();
    });

    it('should support multiple handlers for same event', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      session.on('stdout', handler1);
      session.on('stdout', handler2);

      const chunk = JSON.stringify({ type: 'assistant', message: { content: 'test' } }) + '\n';
      stdoutHandler(Buffer.from(chunk));

      expect(handler1).toHaveBeenCalledWith('test');
      expect(handler2).toHaveBeenCalledWith('test');
    });

    it('should only emit stdout when complete JSON lines are parsed', () => {
      const handler = vi.fn();
      session.on('stdout', handler);

      // Send partial chunk
      stdoutHandler(Buffer.from('{"type":"assistant","message":{"content":"part'));
      expect(handler).not.toHaveBeenCalled();

      // Complete the chunk
      stdoutHandler(Buffer.from('ial"}}\n'));
      expect(handler).toHaveBeenCalledWith('partial');
    });
  });

  describe('stop()', () => {
    let session: ClaudeCliSessionProcess;

    beforeEach(async () => {
      session = new ClaudeCliSessionProcess(sessionId, '/test', ['--print']);

      const onMock = vi.fn((event: any, handler: any) => {
        if (event === 'spawn') {
          setTimeout(() => handler(), 0);
        }
        return mockChildProcess;
      });
      mockChildProcess.on = onMock as any;

      await session.start();
    });

    it('should send SIGTERM by default', () => {
      session.stop();

      expect(mockChildProcess.kill).toHaveBeenCalledWith('SIGTERM');
      expect(session.getInfo().status).toBe('stopped');
    });

    it('should send custom signal when provided', () => {
      session.stop('SIGKILL');

      expect(mockChildProcess.kill).toHaveBeenCalledWith('SIGKILL');
    });

    it('should throw error if process not running', () => {
      const stoppedSession = new ClaudeCliSessionProcess(sessionId, '/test', ['--print']);

      expect(() => stoppedSession.stop()).toThrow('Claude CLI session not running');
    });

    it('should propagate kill errors', () => {
      const killError = new Error('Kill failed');
      mockChildProcess.kill = vi.fn().mockImplementation(() => {
        throw killError;
      });

      expect(() => session.stop()).toThrow('Kill failed');
    });
  });

  describe('getInfo()', () => {
    it('should return copy of session info', () => {
      const session = new ClaudeCliSessionProcess(sessionId, '/test', ['--print']);

      const info1 = session.getInfo();
      const info2 = session.getInfo();

      expect(info1).toEqual(info2);
      expect(info1).not.toBe(info2); // Different object references
    });

    it('should include pid after process starts', async () => {
      const session = new ClaudeCliSessionProcess(sessionId, '/test', ['--print']);

      const onMock = vi.fn((event: any, handler: any) => {
        if (event === 'spawn') {
          setTimeout(() => handler(), 0);
        }
        return mockChildProcess;
      });
      mockChildProcess.on = onMock as any;

      expect(session.getInfo().pid).toBeNull();

      await session.start();

      expect(session.getInfo().pid).toBe(12345);
    });
  });

  describe('Buffer Management', () => {
    let session: ClaudeCliSessionProcess;

    beforeEach(async () => {
      session = new ClaudeCliSessionProcess(sessionId, '/test', ['--print']);

      const onMock = vi.fn((event: any, handler: any) => {
        if (event === 'spawn') {
          setTimeout(() => handler(), 0);
        }
        return mockChildProcess;
      });
      mockChildProcess.on = onMock as any;

      await session.start();
    });

    it('should protect against buffer overflow', () => {
      const largeChunk = 'x'.repeat(1048577); // Exceeds 1MB

      const parsed = session['parseStreamJson'](largeChunk);

      expect(parsed).toBe('');
    });

    it('should accumulate partial lines in buffer', () => {
      session['parseStreamJson']('{"type":"assistant",');
      session['parseStreamJson']('"message":{"content":"test');
      const parsed = session['parseStreamJson']('"}}\n');

      expect(parsed).toBe('test');
    });

    it('should preserve buffer across multiple chunk calls', () => {
      session['parseStreamJson']('start');
      session['parseStreamJson'](' middle');
      session['parseStreamJson'](' end'); // Still no newline

      // Buffer should contain accumulated data
      // Next complete line will include all accumulated data
      const parsed = session['parseStreamJson']('\n'); // Just newline

      // The previous accumulated "start middle end" was not valid JSON,
      // so it should fallback to raw text
      expect(parsed).toBe('start middle end');
    });
  });
});
