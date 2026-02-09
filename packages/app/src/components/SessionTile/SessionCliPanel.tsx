/**
 * SessionCliPanel Component
 * Terminal panel for Claude CLI sessions with xterm.js integration
 *
 * Features:
 * - xterm.js terminal display
 * - WebSocket connection to session CLI
 * - Command input field
 * - Auto-scroll to bottom on new output
 * - Full height within container
 */

import React, { useEffect, useRef, useCallback, useState } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from '@xterm/addon-fit';
import type { SessionId, ClaudeCliOutputEvent, WorkspaceEvent } from '@afw/shared';
import { useWebSocketContext } from '../../contexts/WebSocketContext';
import 'xterm/css/xterm.css';
import './SessionCliPanel.css';

export interface SessionCliPanelProps {
  /** Session ID to connect to */
  sessionId: SessionId;
  /** Height of the terminal panel */
  height?: number | string;
  /** Working directory for Claude CLI session */
  cwd?: string;
  /** Callback when command is sent */
  onCommand?: (command: string) => void;
}

/**
 * SessionCliPanel - Terminal panel for Claude CLI sessions
 */
export function SessionCliPanel({
  sessionId,
  height = '100%',
  cwd,
  onCommand,
}: SessionCliPanelProps): React.ReactElement {
  const terminalRef = useRef<HTMLDivElement>(null);
  const terminalInstanceRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const lineBufferRef = useRef('');
  const [commandInput, setCommandInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [cliStarted, setCliStarted] = useState(false);
  const { onEvent, subscribe, unsubscribe, send } = useWebSocketContext();

  /**
   * Initialize xterm.js terminal
   */
  useEffect(() => {
    if (!terminalRef.current) return;

    // Create terminal instance
    const terminal = new Terminal({
      cursorBlink: true,
      cursorStyle: 'block',
      fontSize: 14,
      fontFamily: '"Cascadia Code", "Fira Code", "Consolas", monospace',
      theme: {
        background: '#0a0a0a',
        foreground: '#d4d4d4',
        cursor: '#d4d4d4',
        black: '#000000',
        red: '#cd3131',
        green: '#0dbc79',
        yellow: '#e5e510',
        blue: '#2472c8',
        magenta: '#bc3fbc',
        cyan: '#11a8cd',
        white: '#e5e5e5',
        brightBlack: '#666666',
        brightRed: '#f14c4c',
        brightGreen: '#23d18b',
        brightYellow: '#f5f543',
        brightBlue: '#3b8eea',
        brightMagenta: '#d670d6',
        brightCyan: '#29b8db',
        brightWhite: '#e5e5e5',
      },
      allowProposedApi: true,
      scrollback: 10000,
      convertEol: true,
    });

    // Create fit addon for responsive sizing
    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);

    // Mount terminal
    terminal.open(terminalRef.current);
    fitAddon.fit();

    // Store refs
    terminalInstanceRef.current = terminal;
    fitAddonRef.current = fitAddon;

    // Welcome message
    terminal.writeln('\x1b[1;36m╔═══════════════════════════════════════╗\x1b[0m');
    terminal.writeln('\x1b[1;36m║  Claude CLI Session Terminal          ║\x1b[0m');
    terminal.writeln('\x1b[1;36m╚═══════════════════════════════════════╝\x1b[0m');
    terminal.writeln('');
    terminal.writeln(`\x1b[90mSession: ${sessionId}\x1b[0m`);
    terminal.writeln('\x1b[90mType commands below and press Enter to send.\x1b[0m');
    terminal.writeln('');

    // Handle window resize
    const handleResize = () => {
      fitAddon.fit();
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      terminal.dispose();
      terminalInstanceRef.current = null;
      fitAddonRef.current = null;
    };
  }, [sessionId]);

  /**
   * Subscribe to WebSocket events for this session
   * Must run before event listener to ensure events are received
   */
  useEffect(() => {
    if (!sessionId) return;

    subscribe(sessionId);

    return () => {
      unsubscribe(sessionId);
    };
  }, [sessionId, subscribe, unsubscribe]);

  /**
   * Auto-start Claude CLI session on mount
   */
  useEffect(() => {
    if (!sessionId || cliStarted) return;

    const startCli = async () => {
      const terminal = terminalInstanceRef.current;
      if (!terminal) return;

      try {
        terminal.writeln('\x1b[1;36m[Starting Claude CLI...]\x1b[0m');

        const res = await fetch('http://localhost:3001/api/claude-cli/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: sessionId,
            cwd: cwd || 'D:/ActionFlowsDashboard',
          }),
        });

        if (res.ok) {
          const data = await res.json();
          terminal.writeln('\x1b[1;32m[Claude CLI started successfully]\x1b[0m');
          terminal.writeln(`\x1b[90mPID: ${data.session?.pid || 'unknown'}\x1b[0m`);
          terminal.writeln('');
          setCliStarted(true);
        } else {
          const error = await res.json();
          // "already exists" means CLI is already running — treat as success
          if (String(error.error || '').includes('already exists')) {
            terminal.writeln('\x1b[1;32m[Claude CLI already running]\x1b[0m');
            terminal.writeln('');
            setCliStarted(true);
          } else {
            terminal.writeln(
              `\x1b[1;31m[Failed to start Claude CLI: ${error.error || 'Unknown error'}]\x1b[0m`
            );
          }
        }
      } catch (err) {
        console.error('Failed to start Claude CLI:', err);
        if (terminal) {
          terminal.writeln(
            `\x1b[1;31m[Failed to start Claude CLI: ${err instanceof Error ? err.message : 'Unknown error'}]\x1b[0m`
          );
        }
      }
    };

    startCli();
  }, [sessionId, cwd, cliStarted]);

  // Note: CLI session lifecycle is managed by the backend claudeCliManager.
  // We don't stop on unmount to avoid StrictMode double-mount race conditions.
  // The manager handles cleanup on server shutdown and enforces max sessions.

  /**
   * Handle terminal output events from WebSocket
   */
  useEffect(() => {
    if (!onEvent) return;

    const unsubscribe = onEvent((event: WorkspaceEvent) => {
      // Filter events for this session
      if (event.sessionId !== sessionId) return;

      // Handle CLI started events
      if (event.type === 'claude-cli:started') {
        const terminal = terminalInstanceRef.current;
        if (!terminal) return;

        terminal.writeln('');
        terminal.writeln('\x1b[1;32m[Claude CLI ready]\x1b[0m');
        terminal.writeln('');
        setCliStarted(true);
      }

      // Handle CLI output events — parse stream-json into clean terminal output
      if (event.type === 'claude-cli:output') {
        const outputEvent = event as ClaudeCliOutputEvent;
        const terminal = terminalInstanceRef.current;
        if (!terminal) return;

        const raw = outputEvent.output;
        const isError = outputEvent.stream === 'stderr';

        // stderr: show as-is in red
        if (isError) {
          terminal.write('\x1b[31m' + raw + '\x1b[0m');
          terminal.scrollToBottom();
          return;
        }

        // stdout: parse stream-json JSONL (may contain partial lines across chunks)
        const buffered = lineBufferRef.current + raw;
        const lines = buffered.split('\n');
        // Last element is either empty (complete line) or partial (incomplete)
        lineBufferRef.current = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          try {
            const msg = JSON.parse(trimmed);

            switch (msg.type) {
              case 'system':
                if (msg.subtype === 'init') {
                  terminal.writeln(`\x1b[90m[Claude initialized — ${(msg.tools || []).length} tools available]\x1b[0m`);
                }
                break;

              case 'stream_event': {
                const ev = msg.event;
                if (!ev) break;

                // Text streaming — write each delta directly
                if (ev.type === 'content_block_delta' && ev.delta?.type === 'text_delta' && ev.delta.text) {
                  terminal.write(ev.delta.text);
                }
                // Tool use start — show tool name
                if (ev.type === 'content_block_start' && ev.content_block?.type === 'tool_use') {
                  terminal.writeln('');
                  terminal.write(`\x1b[1;33m[Tool: ${ev.content_block.name}]\x1b[0m `);
                }
                // Tool input delta — skip (noisy JSON fragments)
                // Message stop — add newline after streamed text
                if (ev.type === 'message_stop') {
                  terminal.writeln('');
                }
                break;
              }

              case 'assistant':
                // Full message — skip (redundant with stream deltas)
                break;

              case 'result':
                terminal.writeln('');
                if (msg.is_error) {
                  terminal.writeln(`\x1b[1;31m[Error: ${msg.result || 'Unknown'}]\x1b[0m`);
                } else {
                  const cost = msg.total_cost_usd != null ? `$${msg.total_cost_usd.toFixed(4)}` : '';
                  const dur = msg.duration_ms != null ? `${(msg.duration_ms / 1000).toFixed(1)}s` : '';
                  const meta = [dur, cost].filter(Boolean).join(' | ');
                  terminal.writeln(`\x1b[90m[${meta}]\x1b[0m`);
                }
                break;

              default:
                // Unknown type — skip silently
                break;
            }
          } catch {
            // Not valid JSON — write raw (fallback)
            terminal.writeln(trimmed);
          }
        }

        terminal.scrollToBottom();
      }

      // Handle CLI exit events
      if (event.type === 'claude-cli:exited') {
        const terminal = terminalInstanceRef.current;
        if (!terminal) return;

        terminal.writeln('');
        terminal.writeln('\x1b[90m─────────────────────────────────────────\x1b[0m');
        terminal.writeln('\x1b[1;33mClaude CLI session ended\x1b[0m');
        terminal.writeln('\x1b[90m─────────────────────────────────────────\x1b[0m');
        setCliStarted(false);
      }
    });

    return unsubscribe;
  }, [sessionId, onEvent]);

  /**
   * Send command to Claude CLI via WebSocket
   */
  const handleSendCommand = useCallback(async () => {
    if (!commandInput.trim() || isSending) return;

    setIsSending(true);
    const command = commandInput.trim();

    try {
      // Echo command to terminal
      const terminal = terminalInstanceRef.current;
      if (terminal) {
        terminal.writeln(`\x1b[1;32m$ ${command}\x1b[0m`);
      }

      // Send command via WebSocket
      send({
        type: 'input',
        sessionId: sessionId,
        payload: command + '\n',
        timestamp: new Date().toISOString(),
      });

      // Notify parent
      onCommand?.(command);

      // Clear input
      setCommandInput('');
    } catch (error) {
      const terminal = terminalInstanceRef.current;
      if (terminal) {
        terminal.writeln(
          `\x1b[1;31mError sending command: ${error instanceof Error ? error.message : 'Unknown error'}\x1b[0m`
        );
      }
    } finally {
      setIsSending(false);
    }
  }, [commandInput, isSending, sessionId, onCommand, send]);

  /**
   * Handle Enter key in input field
   */
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        handleSendCommand();
      }
    },
    [handleSendCommand]
  );

  return (
    <div
      className="session-cli-panel"
      style={{ height }}
      role="region"
      aria-label="Claude CLI terminal"
    >
      {/* Terminal display */}
      <div className="cli-terminal-container" ref={terminalRef} />

      {/* Command input */}
      <div className="cli-input-container">
        <div className="cli-input-prompt">$</div>
        <input
          type="text"
          className="cli-input-field"
          value={commandInput}
          onChange={(e) => setCommandInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type command and press Enter..."
          disabled={isSending}
          aria-label="Command input"
        />
        <button
          className="cli-send-button"
          onClick={handleSendCommand}
          disabled={!commandInput.trim() || isSending}
          aria-label="Send command"
        >
          {isSending ? (
            <svg
              className="send-icon spinning"
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="currentColor"
            >
              <path d="M8 1a7 7 0 1 0 7 7h-2a5 5 0 1 1-5-5V1z" />
            </svg>
          ) : (
            <svg
              className="send-icon"
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="currentColor"
            >
              <path d="M15.854 7.854l-5-5a.5.5 0 0 0-.708.708L14.293 7.5H.5a.5.5 0 0 0 0 1h13.793l-4.147 4.146a.5.5 0 0 0 .708.708l5-5a.5.5 0 0 0 0-.708z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
