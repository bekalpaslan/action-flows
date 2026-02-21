/**
 * Terminal Panel Component
 * Embedded xterm.js terminal for agent output with step attribution
 *
 * NOTE: Rendered by WorkStar via LazyTerminal.
 * This is a session-aware terminal for the active workbench.
 * Terminal state (height, collapsed) is persisted per-workbench via TerminalContext.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from '@xterm/addon-fit';
import { SearchAddon } from '@xterm/addon-search';
import 'xterm/css/xterm.css';
import type { SessionId, StepNumber, TerminalOutputEvent } from '@afw/shared';

export interface TerminalPanelProps {
  sessionId?: SessionId;
  height: number;
  onHeightChange: (height: number) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export function TerminalPanel({
  sessionId,
  height,
  onHeightChange,
  isCollapsed,
  onToggleCollapse,
}: TerminalPanelProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const searchAddonRef = useRef<SearchAddon | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const resizeStartY = useRef<number>(0);
  const resizeStartHeight = useRef<number>(0);

  // Initialize xterm.js
  useEffect(() => {
    if (!terminalRef.current || xtermRef.current) return;

    const term = new XTerm({
      cursorBlink: false,
      disableStdin: true, // Read-only terminal
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
    const searchAddon = new SearchAddon();

    term.loadAddon(fitAddon);
    term.loadAddon(searchAddon);

    term.open(terminalRef.current);
    fitAddon.fit();

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;
    searchAddonRef.current = searchAddon;

    // Welcome message
    term.writeln('\x1b[36mActionFlows Dashboard Terminal\x1b[0m');
    term.writeln('\x1b[90mAgent output will appear here...\x1b[0m');
    term.writeln('');

    // Cleanup
    return () => {
      term.dispose();
      xtermRef.current = null;
      fitAddonRef.current = null;
      searchAddonRef.current = null;
    };
  }, []);

  // Handle resize
  useEffect(() => {
    if (!xtermRef.current || !fitAddonRef.current) return;

    const handleResize = () => {
      fitAddonRef.current?.fit();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fit terminal when height changes
  useEffect(() => {
    if (!isCollapsed && fitAddonRef.current) {
      setTimeout(() => fitAddonRef.current?.fit(), 100);
    }
  }, [height, isCollapsed]);

  // Handle drag resize
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    resizeStartY.current = e.clientY;
    resizeStartHeight.current = height;
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const delta = resizeStartY.current - e.clientY;
      const newHeight = Math.max(100, Math.min(600, resizeStartHeight.current + delta));
      onHeightChange(newHeight);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, onHeightChange]);

  // Write output to terminal
  const writeOutput = (event: TerminalOutputEvent) => {
    if (!xtermRef.current) return;

    const term = xtermRef.current;
    const { output, stream, stepNumber, action } = event;

    // Build prefix
    let prefix = '';
    if (stepNumber !== undefined && action) {
      const stepColor = stream === 'stderr' ? '\x1b[91m' : '\x1b[93m';
      prefix = `${stepColor}[#${stepNumber} ${action}]\x1b[0m `;
    } else if (stepNumber !== undefined) {
      const stepColor = stream === 'stderr' ? '\x1b[91m' : '\x1b[93m';
      prefix = `${stepColor}[#${stepNumber}]\x1b[0m `;
    }

    // Stream color
    const streamColor = stream === 'stderr' ? '\x1b[91m' : '\x1b[0m';

    // Write each line
    const lines = output.split('\n');
    lines.forEach((line, index) => {
      if (index > 0) term.write('\r\n');
      term.write(`${prefix}${streamColor}${line}\x1b[0m`);
    });
    term.write('\r\n');
  };

  // Expose writeOutput via ref (for parent to call)
  useEffect(() => {
    // Store writeOutput in a way parent can access
    // For now, we'll use events from WebSocket handler
  }, []);

  // Clear terminal
  const handleClear = () => {
    if (xtermRef.current) {
      xtermRef.current.clear();
    }
  };

  // Export terminal content
  const handleExport = () => {
    if (!xtermRef.current) return;

    const term = xtermRef.current;
    const buffer = term.buffer.active;
    const lines: string[] = [];

    for (let i = 0; i < buffer.length; i++) {
      const line = buffer.getLine(i);
      if (line) {
        lines.push(line.translateToString(true));
      }
    }

    const content = lines.join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `terminal-${sessionId || 'output'}-${Date.now()}.log`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Search in terminal
  const handleSearch = () => {
    if (!searchAddonRef.current) return;

    const query = prompt('Search terminal:');
    if (query) {
      searchAddonRef.current.findNext(query, { incremental: true });
    }
  };

  if (isCollapsed) {
    return (
      <div className="terminal-panel collapsed" style={{ height: '32px', borderTop: '1px solid #333' }}>
        <div className="terminal-header" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '4px 12px',
          background: '#252526',
          cursor: 'pointer',
        }} onClick={onToggleCollapse}>
          <span style={{ fontSize: '12px', color: '#ccc' }}>Terminal</span>
          <button style={{ background: 'none', border: 'none', color: '#ccc', cursor: 'pointer' }}>
            ▲
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="terminal-panel" style={{ height: `${height}px`, borderTop: '1px solid #333', display: 'flex', flexDirection: 'column' }}>
      {/* Resize handle */}
      <div
        style={{
          height: '4px',
          background: isResizing ? '#007acc' : '#333',
          cursor: 'ns-resize',
          transition: 'background 0.2s',
        }}
        onMouseDown={handleMouseDown}
      />

      {/* Header */}
      <div className="terminal-header" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '4px 12px',
        background: '#252526',
        borderBottom: '1px solid #333',
      }}>
        <span style={{ fontSize: '12px', color: '#ccc' }}>
          Terminal {sessionId && `- ${sessionId.slice(0, 8)}`}
        </span>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleSearch}
            style={{
              background: 'none',
              border: 'none',
              color: '#ccc',
              cursor: 'pointer',
              fontSize: '12px',
              padding: '2px 8px',
            }}
            title="Search (Ctrl+Shift+F)"
          >
            🔍
          </button>
          <button
            onClick={handleClear}
            style={{
              background: 'none',
              border: 'none',
              color: '#ccc',
              cursor: 'pointer',
              fontSize: '12px',
              padding: '2px 8px',
            }}
            title="Clear"
          >
            🗑️
          </button>
          <button
            onClick={handleExport}
            style={{
              background: 'none',
              border: 'none',
              color: '#ccc',
              cursor: 'pointer',
              fontSize: '12px',
              padding: '2px 8px',
            }}
            title="Export"
          >
            📥
          </button>
          <button
            onClick={onToggleCollapse}
            style={{
              background: 'none',
              border: 'none',
              color: '#ccc',
              cursor: 'pointer',
              fontSize: '12px',
              padding: '2px 8px',
            }}
            title="Collapse"
          >
            ▼
          </button>
        </div>
      </div>

      {/* Terminal */}
      <div ref={terminalRef} style={{ flex: 1, padding: '8px' }} />
    </div>
  );
}
