/**
 * Claude CLI Session Process
 * Manages a single Claude Code CLI subprocess with stdio communication
 */

import { spawn, type ChildProcess } from 'child_process';
import type { EventEmitter } from 'events';
import type { SessionId, ClaudeCliSession, Timestamp } from '@afw/shared';

type ClaudeCliEventType = 'stdout' | 'stderr' | 'exit' | 'error';

interface EventHandlers {
  stdout: Set<(data: string) => void>;
  stderr: Set<(data: string) => void>;
  exit: Set<(code: number | null, signal: string | null) => void>;
  error: Set<(error: Error) => void>;
}

/**
 * Claude CLI Session Process
 * Wraps a single Claude CLI subprocess with bidirectional communication
 */
export class ClaudeCliSessionProcess {
  private process: ChildProcess | null = null;
  private sessionInfo: ClaudeCliSession;
  private spawnEnv: NodeJS.ProcessEnv;
  private eventHandlers: EventHandlers = {
    stdout: new Set(),
    stderr: new Set(),
    exit: new Set(),
    error: new Set(),
  };

  constructor(
    sessionId: SessionId,
    cwd: string,
    args: string[],
    metadata?: ClaudeCliSession['metadata'],
    spawnEnv?: NodeJS.ProcessEnv
  ) {
    this.sessionInfo = {
      id: sessionId,
      pid: null,
      status: 'starting',
      cwd,
      startedAt: new Date().toISOString() as Timestamp,
      spawnArgs: args,
      metadata,
    };
    this.spawnEnv = spawnEnv || process.env;
  }

  /**
   * Start the Claude CLI subprocess
   */
  async start(): Promise<void> {
    if (this.process) {
      throw new Error('Claude CLI session already started');
    }

    return new Promise((resolve, reject) => {
      try {
        // Spawn Claude CLI with piped stdio
        const childProcess = spawn('claude', this.sessionInfo.spawnArgs, {
          cwd: this.sessionInfo.cwd,
          stdio: ['pipe', 'pipe', 'pipe'],
          shell: false,
          env: {
            ...this.spawnEnv,
            // Force non-interactive mode for subprocess
            CI: '1',
          },
        });

        this.process = childProcess;
        this.sessionInfo.pid = childProcess.pid ?? null;
        this.sessionInfo.status = 'running';

        // Handle stdout - CRITICAL: immediate data handler to prevent buffering hangs
        childProcess.stdout?.on('data', (chunk: Buffer) => {
          const output = chunk.toString('utf8');
          this.eventHandlers.stdout.forEach(handler => handler(output));
        });

        // Handle stderr - CRITICAL: immediate data handler to prevent buffering hangs
        childProcess.stderr?.on('data', (chunk: Buffer) => {
          const output = chunk.toString('utf8');
          this.eventHandlers.stderr.forEach(handler => handler(output));
        });

        // Handle process exit
        childProcess.on('exit', (code, signal) => {
          this.sessionInfo.exitCode = code ?? undefined;
          this.sessionInfo.exitSignal = signal ?? undefined;
          this.sessionInfo.endedAt = new Date().toISOString() as Timestamp;
          this.sessionInfo.status = 'stopped';
          this.eventHandlers.exit.forEach(handler => handler(code, signal));
          this.process = null;
        });

        // Handle process errors
        childProcess.on('error', (error) => {
          console.error('[ClaudeCliSession] Process error:', error);
          this.sessionInfo.status = 'error';
          this.eventHandlers.error.forEach(handler => handler(error));
          reject(error);
        });

        // Resolve after spawn succeeds
        childProcess.on('spawn', () => {
          console.log(`[ClaudeCliSession] Spawned Claude CLI with PID ${childProcess.pid}`);
          resolve();
        });

      } catch (error) {
        this.sessionInfo.status = 'error';
        const err = error instanceof Error ? error : new Error('Unknown spawn error');
        reject(err);
      }
    });
  }

  /**
   * Send input to Claude CLI stdin
   */
  sendInput(input: string): void {
    if (!this.process || !this.process.stdin) {
      throw new Error('Claude CLI session not running or stdin not available');
    }

    if (!this.process.stdin.writable) {
      throw new Error('Claude CLI stdin is not writable');
    }

    // Validate input length to prevent resource exhaustion
    if (input.length > 100000) {
      throw new Error('Input too large (max 100KB)');
    }

    // Check for null bytes which could cause issues with subprocess communication
    if (input.includes('\0')) {
      throw new Error('Input contains null bytes');
    }

    try {
      // Write input with newline (interactive prompts expect newline-terminated input)
      this.process.stdin.write(input + '\n', 'utf8');
    } catch (error) {
      console.error('[ClaudeCliSession] Error writing to stdin:', error);
      throw error;
    }
  }

  /**
   * Stop the Claude CLI process
   */
  stop(signal: NodeJS.Signals = 'SIGTERM'): void {
    if (!this.process) {
      throw new Error('Claude CLI session not running');
    }

    try {
      this.sessionInfo.status = 'stopped';
      this.process.kill(signal);
      console.log(`[ClaudeCliSession] Sent ${signal} to PID ${this.sessionInfo.pid}`);
    } catch (error) {
      console.error('[ClaudeCliSession] Error stopping process:', error);
      throw error;
    }
  }

  /**
   * Check if process is running
   */
  isRunning(): boolean {
    return this.process !== null && this.sessionInfo.status === 'running';
  }

  /**
   * Get session info
   */
  getInfo(): ClaudeCliSession {
    return { ...this.sessionInfo };
  }

  /**
   * Register event handlers
   */
  on(event: 'stdout', handler: (data: string) => void): void;
  on(event: 'stderr', handler: (data: string) => void): void;
  on(event: 'exit', handler: (code: number | null, signal: string | null) => void): void;
  on(event: 'error', handler: (error: Error) => void): void;
  on(event: ClaudeCliEventType, handler: ((data: string) => void) | ((code: number | null, signal: string | null) => void) | ((error: Error) => void)): void {
    const handlers = this.eventHandlers[event];
    if (handlers) {
      // Type assertion is safe here because we've validated event type via overloads
      (handlers as Set<typeof handler>).add(handler);
    }
  }

  /**
   * Unregister event handlers
   */
  off(event: 'stdout', handler: (data: string) => void): void;
  off(event: 'stderr', handler: (data: string) => void): void;
  off(event: 'exit', handler: (code: number | null, signal: string | null) => void): void;
  off(event: 'error', handler: (error: Error) => void): void;
  off(event: ClaudeCliEventType, handler: ((data: string) => void) | ((code: number | null, signal: string | null) => void) | ((error: Error) => void)): void {
    const handlers = this.eventHandlers[event];
    if (handlers) {
      // Type assertion is safe here because we've validated event type via overloads
      (handlers as Set<typeof handler>).delete(handler);
    }
  }
}
