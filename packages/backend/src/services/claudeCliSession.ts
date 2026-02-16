/**
 * Claude CLI Session Process
 * Manages a single Claude Code CLI subprocess with stdio communication
 */

import { spawn, type ChildProcess } from 'child_process';
import type { EventEmitter } from 'events';
import type { SessionId, ClaudeCliSession, Timestamp } from '@afw/shared';

type ClaudeCliEventType = 'stdout' | 'stderr' | 'exit' | 'error' | 'raw-json';

/** Raw parsed JSON message from stream-json output */
export interface StreamJsonMessage {
  type: string;
  message?: { role?: string; content?: string; model?: string; stop_reason?: string };
  result?: string;
  error?: string;
  event?: {
    type?: string;
    delta?: { text?: string; type?: string };
    content_block?: {
      type?: string;
      name?: string;
      id?: string;
      input?: unknown;
    };
  };
  cost_usd?: number;
  duration_ms?: number;
  stop_reason?: string;
  [key: string]: unknown;
}

interface EventHandlers {
  stdout: Set<(data: string) => void>;
  stderr: Set<(data: string) => void>;
  exit: Set<(code: number | null, signal: string | null) => void>;
  error: Set<(error: Error) => void>;
  'raw-json': Set<(msg: StreamJsonMessage) => void>;
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
    'raw-json': new Set(),
  };
  private stdoutBuffer: string = ''; // Buffer for accumulating JSONL lines
  private static readonly MAX_BUFFER_SIZE = 1048576; // 1MB max buffer to prevent memory exhaustion

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
   * Parse stream-json JSONL output from Claude CLI
   * Handles: {"type":"assistant","message":{"role":"assistant","content":"..."}}
   * Extracts clean text content from JSON messages
   */
  private parseStreamJson(chunk: string): string {
    // Accumulate chunk into buffer
    this.stdoutBuffer += chunk;

    // Guard against unbounded buffer growth (malformed input or very long streams)
    if (this.stdoutBuffer.length > ClaudeCliSessionProcess.MAX_BUFFER_SIZE) {
      console.warn('[ClaudeCliSession] Buffer exceeded 1MB limit, resetting');
      this.stdoutBuffer = '';
      return '';
    }

    // Process complete lines (JSONL format: one JSON object per line)
    const lines = this.stdoutBuffer.split('\n');

    // Keep the last incomplete line in buffer for next chunk
    this.stdoutBuffer = lines.pop() || '';

    // Parse each complete line
    const outputs: string[] = [];
    for (const line of lines) {
      const trimmedLine = line.trim();

      // Skip empty lines
      if (!trimmedLine) {
        continue;
      }

      try {
        // Parse JSON message
        const parsed = JSON.parse(trimmedLine) as StreamJsonMessage;

        // Emit raw parsed JSON for message aggregation
        this.eventHandlers['raw-json'].forEach(handler => handler(parsed));

        // Extract content based on message type
        if (parsed.type === 'assistant' && parsed.message?.content !== undefined) {
          // Assistant message: extract content text (including empty strings)
          outputs.push(parsed.message.content);
        } else if (parsed.type === 'result' && parsed.result !== undefined) {
          // Result message: extract result text
          outputs.push(parsed.result);
        } else if (parsed.type === 'error' && parsed.error) {
          // Error message: extract error text
          console.error('[ClaudeCliSession] Stream-json error:', parsed.error);
          outputs.push(`[ERROR] ${parsed.error}`);
        } else {
          // Unknown message type: log but don't display
          console.log('[ClaudeCliSession] Stream-json message:', parsed.type);
        }
      } catch (error) {
        // JSON parse error: log warning and pass raw text as fallback
        console.warn('[ClaudeCliSession] Failed to parse stream-json line:', trimmedLine.substring(0, 100));
        outputs.push(trimmedLine);
      }
    }

    return outputs.join('');
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
            // Remove nested-session guard so dashboard can spawn CLI sessions
            CLAUDECODE: '',
          },
        });

        this.process = childProcess;
        this.sessionInfo.pid = childProcess.pid ?? null;
        this.sessionInfo.status = 'running';

        // Handle stdout - CRITICAL: immediate data handler to prevent buffering hangs
        childProcess.stdout?.on('data', (chunk: Buffer) => {
          const rawChunk = chunk.toString('utf8');
          console.log(`[ClaudeCliSession] Received stdout chunk (${rawChunk.length} bytes)`);

          // Parse stream-json JSONL format and extract clean text content
          const parsedOutput = this.parseStreamJson(rawChunk);

          // Only broadcast if we have content (complete JSON lines were parsed)
          if (parsedOutput) {
            this.eventHandlers.stdout.forEach(handler => handler(parsedOutput));
          }
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
          this.stdoutBuffer = ''; // Clear buffer on exit to prevent memory leak
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
      // Format as stream-json user message (JSONL: one JSON object per line)
      const message = JSON.stringify({
        type: 'user',
        message: { role: 'user', content: input.trim() },
      });
      this.process.stdin.write(message + '\n', 'utf8');
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
  on(event: 'raw-json', handler: (msg: StreamJsonMessage) => void): void;
  on(event: ClaudeCliEventType, handler: ((data: string) => void) | ((code: number | null, signal: string | null) => void) | ((error: Error) => void) | ((msg: StreamJsonMessage) => void)): void {
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
  off(event: 'raw-json', handler: (msg: StreamJsonMessage) => void): void;
  off(event: ClaudeCliEventType, handler: ((data: string) => void) | ((code: number | null, signal: string | null) => void) | ((error: Error) => void) | ((msg: StreamJsonMessage) => void)): void {
    const handlers = this.eventHandlers[event];
    if (handlers) {
      // Type assertion is safe here because we've validated event type via overloads
      (handlers as Set<typeof handler>).delete(handler);
    }
  }
}
