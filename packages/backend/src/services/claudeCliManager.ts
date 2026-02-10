/**
 * Claude CLI Manager
 * Manages multiple Claude Code CLI sessions with MCP auto-configuration
 */

import path from 'path';
import os from 'os';
import type { SessionId, ClaudeCliStartedEvent, ClaudeCliOutputEvent, ClaudeCliExitedEvent, ChatMessageEvent, ChatHistoryEvent, WorkspaceEvent, DurationMs, Timestamp, Session, SessionStartedEvent, SessionEndedEvent, ChatMessage } from '@afw/shared';
import { brandedTypes } from '@afw/shared';
import { ClaudeCliSessionProcess } from './claudeCliSession.js';
import type { StreamJsonMessage } from './claudeCliSession.js';
import { ClaudeCliMessageAggregator } from './claudeCliMessageAggregator.js';
import { storage } from '../storage/index.js';

/**
 * Claude CLI Manager
 * Singleton service for managing all Claude CLI sessions
 */
class ClaudeCliManager {
  private sessions: Map<SessionId, ClaudeCliSessionProcess> = new Map();
  private aggregators: Map<SessionId, ClaudeCliMessageAggregator> = new Map();
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
  private async validateCwd(cwd: string): Promise<void> {
    // Resolve realpath to prevent symlink escapes
    let realCwd: string;
    try {
      const fs = await import('fs/promises');
      realCwd = await fs.realpath(cwd);
    } catch (error) {
      throw new Error('Directory does not exist or is not accessible');
    }

    // Check for path traversal attempts
    const normalizedCwd = path.normalize(realCwd);
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
    flags?: string[],
    envVars?: Record<string, string>,
    mcpConfigPath?: string,
    user?: string
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
    await this.validateCwd(cwd);

    // Validate flags for security
    if (flags && flags.length > 0) {
      this.validateFlags(flags);
    }

    // Build command args
    const args: string[] = [];

    // Use --print with stream-json for bidirectional piped communication
    // --input-format stream-json: accepts JSON messages on stdin
    // --output-format stream-json: emits JSON messages on stdout
    // --include-partial-messages: streams partial response chunks
    // IMPORTANT: Do NOT pass the initial prompt as a CLI argument. Claude CLI's --print mode
    // with an argument is one-shot and rejects stdin follow-ups with "Prompt is too long".
    // Instead, we send the initial prompt as the first stdin message after process start.
    args.push('--print');
    args.push('--input-format', 'stream-json');
    args.push('--output-format', 'stream-json');
    args.push('--include-partial-messages');
    args.push('--verbose');
    args.push('--dangerously-skip-permissions');
    args.push('--no-session-persistence');

    // Add MCP config (use provided path or generate default)
    if (mcpConfigPath) {
      args.push('--mcp-config', mcpConfigPath);
    } else {
      const mcpConfig = this.generateMcpConfig();
      args.push('--mcp-config', mcpConfig);
    }

    // Add user flags
    if (flags && flags.length > 0) {
      args.push(...flags);
    }

    // NOTE: Do NOT add prompt to args. It will be sent via stdin after process starts.
    // See comment at line 161-163 for explanation.

    // Prepare spawn environment (merge with provided env vars)
    const spawnEnv = {
      ...process.env,
      ...(envVars || {}),
    };

    // Create session process
    const session = new ClaudeCliSessionProcess(sessionId, cwd, args, {
      prompt,
      flags: flags ? Object.fromEntries(flags.map((f, i) => [i.toString(), f])) : undefined,
    }, spawnEnv);

    // Register event handlers
    const startTime = Date.now();

    // Create message aggregator for this session
    const aggregator = new ClaudeCliMessageAggregator(sessionId);

    // Register callback BEFORE storing in map (prevents access-before-callback-set)
    aggregator.setMessageCallback((message: ChatMessage) => {
      // Store in chat history
      Promise.resolve(storage.addChatMessage(sessionId, message)).catch(err => {
        console.error(`[ClaudeCliManager] Failed to store chat message:`, err);
      });

      // Broadcast chat:message event
      const chatEvent: ChatMessageEvent = {
        type: 'chat:message',
        sessionId,
        message,
        timestamp: message.timestamp,
      };
      this.broadcast(sessionId, chatEvent);
    });
    this.aggregators.set(sessionId, aggregator);

    // Handle raw-json messages for aggregation (message boundary detection)
    session.on('raw-json', (msg: StreamJsonMessage) => {
      try {
        if (msg.type === 'assistant' && msg.message?.content !== undefined) {
          // Complete assistant message — append content to aggregator
          aggregator.appendChunk(msg.message.content);
          if (msg.message.model) {
            aggregator.setMetadata('model', msg.message.model);
          }
          if (msg.message.stop_reason) {
            aggregator.setMetadata('stopReason', msg.message.stop_reason);
          }
        } else if (msg.type === 'result') {
          // End of assistant turn — finalize message with metadata
          if (msg.result) {
            aggregator.appendChunk(msg.result);
          }
          if (msg.cost_usd !== undefined) {
            aggregator.setMetadata('costUsd', msg.cost_usd);
          }
          if (msg.duration_ms !== undefined) {
            aggregator.setMetadata('durationMs', msg.duration_ms);
          }
          if (msg.stop_reason) {
            aggregator.setMetadata('stopReason', msg.stop_reason);
          }
          aggregator.finalizeMessage();
        } else if (msg.type === 'error' && msg.error) {
          // Error — finalize any buffered content first, then emit error
          if (aggregator.hasBufferedContent()) {
            aggregator.finalizeMessage();
          }
          aggregator.setMessageType('error');
          aggregator.appendChunk(msg.error);
          aggregator.finalizeMessage();
        } else if (msg.type === 'stream_event' && msg.event) {
          // Streaming event — accumulate chunks
          if (msg.event.type === 'content_block_delta' && msg.event.delta?.text) {
            aggregator.appendChunk(msg.event.delta.text);
          } else if (msg.event.type === 'content_block_start' && msg.event.content_block?.type === 'tool_use') {
            // Tool use start
            if (aggregator.hasBufferedContent()) {
              aggregator.finalizeMessage();
            }
            aggregator.setMessageType('tool_use');
            if (msg.event.content_block.name) {
              aggregator.setMetadata('toolName', msg.event.content_block.name);
            }
            if (msg.event.content_block.id) {
              aggregator.setMetadata('toolUseId', msg.event.content_block.id);
            }
            if (msg.event.content_block.input) {
              aggregator.setMetadata('toolInput', msg.event.content_block.input);
              // Special handling for Task tool spawn prompts
              if (
                msg.event.content_block.name === 'Task' &&
                typeof msg.event.content_block.input === 'object' &&
                msg.event.content_block.input !== null &&
                'prompt' in msg.event.content_block.input
              ) {
                const prompt = (msg.event.content_block.input as { prompt?: unknown }).prompt;
                if (typeof prompt === 'string') {
                  aggregator.setMetadata('spawnPrompt', prompt);
                }
              }
            }
          } else if (msg.event.type === 'message_stop') {
            // End of message — finalize
            aggregator.finalizeMessage();
          }
        }
        // Ignore 'system' and other unknown types for aggregation
      } catch (err) {
        console.error(`[ClaudeCliManager] Error processing raw-json for aggregation:`, err);
      }
    });

    // DEPRECATED: claude-cli:output events will be removed in v2.0
    // Use chat:message events instead
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
      const dur = (Date.now() - startTime) as DurationMs;
      const exitTimestamp = new Date().toISOString() as Timestamp;
      const event: ClaudeCliExitedEvent = {
        type: 'claude-cli:exited',
        sessionId,
        exitCode: code,
        exitSignal: signal,
        duration: dur,
        timestamp: exitTimestamp,
      };
      this.broadcast(sessionId, event);

      // Update session in storage with final status
      const updateStorage = async () => {
        try {
          const storedSession = await Promise.resolve(storage.getSession(sessionId));
          if (storedSession) {
            storedSession.status = code === 0 ? 'completed' : 'failed';
            storedSession.endedAt = exitTimestamp;
            storedSession.duration = dur;
            await Promise.resolve(storage.setSession(storedSession));
          }

          // Store session:ended event
          const endEvent: SessionEndedEvent = {
            type: 'session:ended',
            sessionId,
            timestamp: exitTimestamp,
            duration: dur,
            reason: signal ? `signal:${signal}` : `exit:${code}`,
          };
          await Promise.resolve(storage.addEvent(sessionId, endEvent));
        } catch (err) {
          console.error(`[ClaudeCliManager] Failed to update storage on exit:`, err);
        }
      };
      updateStorage();

      // Dispose aggregator (flushes any remaining buffered content)
      const sessionAggregator = this.aggregators.get(sessionId);
      if (sessionAggregator) {
        sessionAggregator.dispose();
        this.aggregators.delete(sessionId);
      }

      // Remove from sessions map
      this.sessions.delete(sessionId);
      console.log(`[ClaudeCliManager] Session ${sessionId} exited (code: ${code}, signal: ${signal})`);
    });

    session.on('error', (error) => {
      console.error(`[ClaudeCliManager] Session ${sessionId} error:`, error);
      // Dispose aggregator on error to prevent memory leaks
      const errAggregator = this.aggregators.get(sessionId);
      if (errAggregator) {
        errAggregator.dispose();
        this.aggregators.delete(sessionId);
      }
      // Remove from sessions map on error
      this.sessions.delete(sessionId);
    });

    // Start the session
    try {
      await session.start();
      this.sessions.set(sessionId, session);

      // If initial prompt provided, send it as the first stdin message
      if (prompt) {
        // Capture prompt as a user chat message
        aggregator.createUserMessage(prompt);
        session.sendInput(prompt);
      }

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

      // Store session in storage so it appears in GET /api/sessions
      const now = brandedTypes.currentTimestamp();
      const resolvedUser = user || process.env.AFW_USER || process.env.USERNAME || process.env.USER || 'local';
      const storageSession: Session = {
        id: sessionId,
        user: brandedTypes.userId(resolvedUser),
        cwd: cwd,
        hostname: os.hostname(),
        platform: os.platform(),
        chains: [],
        status: 'in_progress',
        startedAt: now,
        metadata: { type: 'claude-cli', pid: info.pid },
      };
      await Promise.resolve(storage.setSession(storageSession));

      // Store session:started event
      const sessionStartedEvent: SessionStartedEvent = {
        type: 'session:started',
        sessionId,
        timestamp: now,
        cwd,
        hostname: os.hostname(),
        platform: os.platform(),
      };
      await Promise.resolve(storage.addEvent(sessionId, sessionStartedEvent));

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
   * Get the message aggregator for a session
   */
  getAggregator(sessionId: SessionId): ClaudeCliMessageAggregator | undefined {
    return this.aggregators.get(sessionId);
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
      // Dispose aggregator proactively (exit handler also disposes, but this is a safety net)
      const agg = this.aggregators.get(sessionId);
      if (agg) {
        agg.dispose();
        this.aggregators.delete(sessionId);
      }
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
    // Dispose all aggregators first
    this.aggregators.forEach((agg, sessionId) => {
      try {
        agg.dispose();
      } catch (error) {
        console.error(`[ClaudeCliManager] Error disposing aggregator for ${sessionId}:`, error);
      }
    });
    this.aggregators.clear();

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
