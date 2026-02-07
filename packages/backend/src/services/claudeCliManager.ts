/**
 * Claude CLI Manager
 * Manages multiple Claude Code CLI sessions with MCP auto-configuration
 */

import path from 'path';
import type { SessionId, ClaudeCliStartedEvent, ClaudeCliOutputEvent, ClaudeCliExitedEvent, WorkspaceEvent, DurationMs, Timestamp } from '@afw/shared';
import { ClaudeCliSessionProcess } from './claudeCliSession.js';

/**
 * Claude CLI Manager
 * Singleton service for managing all Claude CLI sessions
 */
class ClaudeCliManager {
  private sessions: Map<SessionId, ClaudeCliSessionProcess> = new Map();
  private broadcastFunction: ((sessionId: SessionId, event: WorkspaceEvent) => void) | null = null;
  private readonly MAX_SESSIONS = parseInt(process.env.AFW_CLAUDE_CLI_MAX_SESSIONS || '5', 10);

  /**
   * Set broadcast function for WebSocket event broadcasting
   */
  setBroadcastFunction(fn: (sessionId: SessionId, event: WorkspaceEvent) => void): void {
    this.broadcastFunction = fn;
    console.log('[ClaudeCliManager] Broadcast function registered');
  }

  /**
   * Broadcast event to WebSocket clients
   */
  private broadcast(sessionId: SessionId, event: WorkspaceEvent): void {
    if (this.broadcastFunction) {
      this.broadcastFunction(sessionId, event);
    }
  }

  /**
   * Generate MCP configuration for Claude CLI
   */
  private generateMcpConfig(): string {
    // Resolve MCP server path (prefer env var, fallback to relative path)
    const mcpServerPath = process.env.AFW_MCP_SERVER_PATH
      || path.resolve(process.cwd(), 'packages/mcp-server/dist/index.js');

    const backendUrl = process.env.AFW_BACKEND_URL || 'http://localhost:3001';

    const config = {
      mcpServers: {
        'actionflows-dashboard': {
          command: 'node',
          args: [mcpServerPath],
          env: {
            AFW_BACKEND_URL: backendUrl,
          },
        },
      },
    };

    return JSON.stringify(config);
  }

  /**
   * Validate cwd path for security
   */
  private validateCwd(cwd: string): void {
    // Check for path traversal attempts
    const normalizedCwd = path.normalize(cwd);
    if (normalizedCwd.includes('..')) {
      throw new Error('Path traversal detected in cwd');
    }

    // Deny access to sensitive system directories
    const deniedPaths = [
      '/etc', '/sys', '/proc', '/dev', '/root', '/boot', '/bin', '/sbin',
      '/usr/bin', '/usr/sbin', '/var/log',
      'C:\\Windows', 'C:\\Program Files', 'C:\\Program Files (x86)', 'C:\\ProgramData',
    ];

    const normalizedLower = path.resolve(normalizedCwd).toLowerCase();
    for (const deniedPath of deniedPaths) {
      const normalizedDenied = path.resolve(deniedPath).toLowerCase();
      if (normalizedLower.startsWith(normalizedDenied)) {
        throw new Error('Access to system directories is not allowed');
      }
    }
  }

  /**
   * Validate flags for security (prevent command injection)
   */
  private validateFlags(flags: string[]): void {
    const allowedFlagPrefixes = ['--debug', '--no-session-persistence', '--print', '--mcp-config', '--fast', '--help', '--version'];

    for (const flag of flags) {
      // Check if flag starts with a dash (valid flag format)
      if (!flag.startsWith('-')) {
        throw new Error(`Invalid flag format: ${flag}`);
      }

      // Check for command injection attempts (semicolons, pipes, backticks, etc.)
      if (/[;&|`$(){}[\]<>\\]/.test(flag)) {
        throw new Error(`Invalid characters in flag: ${flag}`);
      }

      // Allow only known safe flags
      const isAllowed = allowedFlagPrefixes.some(prefix => flag.startsWith(prefix));
      if (!isAllowed) {
        throw new Error(`Disallowed flag: ${flag}`);
      }
    }
  }

  /**
   * Start a new Claude CLI session
   */
  async startSession(
    sessionId: SessionId,
    cwd: string,
    prompt?: string,
    flags?: string[]
  ): Promise<ClaudeCliSessionProcess> {
    // Check session limit
    if (this.sessions.size >= this.MAX_SESSIONS) {
      throw new Error(`Maximum number of Claude CLI sessions reached (${this.MAX_SESSIONS})`);
    }

    // Check if session already exists
    if (this.sessions.has(sessionId)) {
      throw new Error(`Claude CLI session ${sessionId} already exists`);
    }

    // Validate cwd for security
    this.validateCwd(cwd);

    // Validate flags for security
    if (flags && flags.length > 0) {
      this.validateFlags(flags);
    }

    // Build command args
    const args: string[] = [];

    // Add MCP config
    const mcpConfig = this.generateMcpConfig();
    args.push('--mcp-config', mcpConfig);

    // Add user flags
    if (flags && flags.length > 0) {
      args.push(...flags);
    }

    // Add prompt if provided
    if (prompt) {
      args.push(prompt);
    }

    // Create session process
    const session = new ClaudeCliSessionProcess(sessionId, cwd, args, {
      prompt,
      flags: flags ? Object.fromEntries(flags.map((f, i) => [i.toString(), f])) : undefined,
    });

    // Register event handlers
    const startTime = Date.now();

    session.on('stdout', (output) => {
      const event: ClaudeCliOutputEvent = {
        type: 'claude-cli:output',
        sessionId,
        output,
        stream: 'stdout',
        timestamp: new Date().toISOString() as Timestamp,
      };
      this.broadcast(sessionId, event);
    });

    session.on('stderr', (output) => {
      const event: ClaudeCliOutputEvent = {
        type: 'claude-cli:output',
        sessionId,
        output,
        stream: 'stderr',
        timestamp: new Date().toISOString() as Timestamp,
      };
      this.broadcast(sessionId, event);
    });

    session.on('exit', (code, signal) => {
      const duration = (Date.now() - startTime) as DurationMs;
      const event: ClaudeCliExitedEvent = {
        type: 'claude-cli:exited',
        sessionId,
        exitCode: code,
        exitSignal: signal,
        duration,
        timestamp: new Date().toISOString() as Timestamp,
      };
      this.broadcast(sessionId, event);

      // Remove from sessions map
      this.sessions.delete(sessionId);
      console.log(`[ClaudeCliManager] Session ${sessionId} exited (code: ${code}, signal: ${signal})`);
    });

    session.on('error', (error) => {
      console.error(`[ClaudeCliManager] Session ${sessionId} error:`, error);
      // Remove from sessions map on error
      this.sessions.delete(sessionId);
    });

    // Start the session
    try {
      await session.start();
      this.sessions.set(sessionId, session);

      // Broadcast started event
      const info = session.getInfo();
      const startedEvent: ClaudeCliStartedEvent = {
        type: 'claude-cli:started',
        sessionId,
        pid: info.pid!,
        cwd: info.cwd,
        args: info.spawnArgs,
        prompt: prompt || null,
        timestamp: new Date().toISOString() as Timestamp,
      };
      this.broadcast(sessionId, startedEvent);

      console.log(`[ClaudeCliManager] Started Claude CLI session ${sessionId} (PID: ${info.pid})`);
      return session;
    } catch (error) {
      this.sessions.delete(sessionId);
      throw error;
    }
  }

  /**
   * Get a Claude CLI session
   */
  getSession(sessionId: SessionId): ClaudeCliSessionProcess | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Stop a Claude CLI session
   */
  stopSession(sessionId: SessionId, signal: NodeJS.Signals = 'SIGTERM'): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return false;
    }

    try {
      session.stop(signal);
      return true;
    } catch (error) {
      console.error(`[ClaudeCliManager] Error stopping session ${sessionId}:`, error);
      return false;
    }
  }

  /**
   * List all active session IDs
   */
  listSessions(): SessionId[] {
    return Array.from(this.sessions.keys());
  }

  /**
   * Stop all Claude CLI sessions (for graceful shutdown)
   */
  stopAllSessions(): void {
    console.log(`[ClaudeCliManager] Stopping all Claude CLI sessions (${this.sessions.size})`);
    this.sessions.forEach((session, sessionId) => {
      try {
        session.stop('SIGTERM');
      } catch (error) {
        console.error(`[ClaudeCliManager] Error stopping session ${sessionId}:`, error);
      }
    });
    this.sessions.clear();
  }

  /**
   * Get session count
   */
  getSessionCount(): number {
    return this.sessions.size;
  }
}

// Singleton instance
export const claudeCliManager = new ClaudeCliManager();
