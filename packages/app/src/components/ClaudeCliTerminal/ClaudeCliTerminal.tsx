/**
 * Claude CLI Terminal Component
 * Interactive xterm.js terminal for Claude Code CLI sessions
 */

import React, { useEffect, useRef, useState } from 'react';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from '@xterm/addon-fit';
import 'xterm/css/xterm.css';
import { useWebSocketContext } from '../../contexts/WebSocketContext';
import { useClaudeCliControl } from '../../hooks/useClaudeCliControl';
import type { SessionId, ClaudeCliOutputEvent, WorkspaceEvent } from '@afw/shared';
import { DiscussButton, DiscussDialog } from '../DiscussButton';
import { useDiscussButton } from '../../hooks/useDiscussButton';

interface ClaudeCliTerminalProps {
  sessionId: SessionId;
  onClose?: () => void;
}

/**
 * Claude CLI Terminal Component
 * Provides an interactive terminal for Claude CLI sessions
 */
export function ClaudeCliTerminal({ sessionId, onClose }: ClaudeCliTerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const inputBufferRef = useRef<string>('');
  const [isTerminalReady, setIsTerminalReady] = useState(false);
  const { onEvent, subscribe, unsubscribe } = useWebSocketContext();
  const { sendInput, stop, isLoading, error } = useClaudeCliControl(sessionId);

  const { isDialogOpen, openDialog, closeDialog, handleSend } = useDiscussButton({
    componentName: 'ClaudeCliTerminal',
    getContext: () => ({
      sessionId,
      isTerminalReady,
      isLoading,
      hasError: !!error,
    }),
  });

  // Initialize xterm.js with stdin enabled
  useEffect(() => {
    if (!terminalRef.current || xtermRef.current) return;

    const term = new XTerm({
      cursorBlink: true,
      disableStdin: false, // Interactive terminal
      fontSize: 13,
      fontFamily: 'Consolas, "Courier New", monospace',
      theme: {
        background: '#1e1e1e',
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
        brightWhite: '#ffffff',
      },
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);
    fitAddon.fit();

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;
    setIsTerminalReady(true);

    // Welcome message
    term.writeln('\x1b[36mClaude CLI Session\x1b[0m');
    term.writeln('\x1b[90mType your input and press Enter to send to Claude...\x1b[0m');
    term.writeln('');

    // Cleanup
    return () => {
      term.dispose();
      xtermRef.current = null;
      fitAddonRef.current = null;
      setIsTerminalReady(false);
    };
  }, []); // Empty deps - only initialize once

  // Handle user input - separate effect to avoid recreating terminal
  useEffect(() => {
    const term = xtermRef.current;
    if (!term || !isTerminalReady) return;

    const handleData = (data: string) => {
      // Handle Enter key (newline)
      if (data === '\r' || data === '\n') {
        const input = inputBufferRef.current;
        inputBufferRef.current = '';

        // Echo newline
        term.write('\r\n');

        // Send input to Claude CLI
        if (input.trim()) {
          sendInput(input).catch((err) => {
            term.writeln(`\x1b[31mError sending input: ${err.message}\x1b[0m`);
          });
        }
        return;
      }

      // Handle Backspace
      if (data === '\x7f') {
        if (inputBufferRef.current.length > 0) {
          inputBufferRef.current = inputBufferRef.current.slice(0, -1);
          term.write('\b \b');
        }
        return;
      }

      // Handle Ctrl+C
      if (data === '\x03') {
        term.writeln('^C');
        inputBufferRef.current = '';
        return;
      }

      // Regular character - add to buffer and echo
      inputBufferRef.current += data;
      term.write(data);
    };

    const disposable = term.onData(handleData);

    return () => {
      disposable.dispose();
    };
  }, [sendInput, isTerminalReady]);

  // Subscribe to WebSocket events for this session
  useEffect(() => {
    subscribe(sessionId);
    return () => unsubscribe(sessionId);
  }, [sessionId, subscribe, unsubscribe]);

  // Listen for Claude CLI output events
  useEffect(() => {
    if (!onEvent) return;

    const unsubscribeEvents = onEvent((event: WorkspaceEvent) => {
      if (event.sessionId !== sessionId) return;

      // Handle Claude CLI output
      if (event.type === 'claude-cli:output') {
        const outputEvent = event as ClaudeCliOutputEvent;
        const term = xtermRef.current;
        if (!term) return;

        // Write output to terminal
        const lines = outputEvent.output.split('\n');
        lines.forEach((line, index) => {
          if (outputEvent.stream === 'stderr') {
            term.write(`\x1b[31m${line}\x1b[0m`);
          } else {
            term.write(line);
          }
          if (index < lines.length - 1) {
            term.write('\r\n');
          }
        });
      }

      // Handle Claude CLI exited
      if (event.type === 'claude-cli:exited') {
        const term = xtermRef.current;
        if (!term) return;

        term.writeln('');
        term.writeln('\x1b[33mClaude CLI session ended\x1b[0m');
      }
    });

    return unsubscribeEvents;
  }, [onEvent, sessionId]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      fitAddonRef.current?.fit();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle errors
  useEffect(() => {
    if (error && xtermRef.current) {
      xtermRef.current.writeln(`\x1b[31mError: ${error.message}\x1b[0m`);
    }
  }, [error]);

  const handleStop = async () => {
    try {
      await stop();
    } catch (err) {
      console.error('Error stopping Claude CLI session:', err);
    }
  };

  const handleClear = () => {
    xtermRef.current?.clear();
  };

  return (
    <div className="claude-cli-terminal" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="terminal-toolbar" style={{
        display: 'flex',
        gap: '8px',
        padding: '8px',
        backgroundColor: '#2d2d2d',
        borderBottom: '1px solid #3e3e3e',
      }}>
        <DiscussButton componentName="ClaudeCliTerminal" onClick={openDialog} size="small" />
        <button
          onClick={handleStop}
          disabled={isLoading}
          style={{
            padding: '4px 12px',
            backgroundColor: '#c93c37',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            fontSize: '12px',
          }}
        >
          Stop
        </button>
        <button
          onClick={handleClear}
          style={{
            padding: '4px 12px',
            backgroundColor: '#3c3c3c',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
          }}
        >
          Clear
        </button>
        {onClose && (
          <button
            onClick={onClose}
            style={{
              padding: '4px 12px',
              backgroundColor: '#3c3c3c',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              marginLeft: 'auto',
            }}
          >
            Close
          </button>
        )}
      </div>
      <div
        ref={terminalRef}
        style={{
          flex: 1,
          overflow: 'hidden',
          padding: '8px',
        }}
      />

      <DiscussDialog
        isOpen={isDialogOpen}
        componentName="ClaudeCliTerminal"
        componentContext={{
          sessionId,
          isTerminalReady,
          isLoading,
          hasError: !!error,
        }}
        onSend={handleSend}
        onClose={closeDialog}
      />
    </div>
  );
}
