/**
 * Terminal Tabs Component
 * Manages multiple session terminal outputs with tab switching
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from '@xterm/addon-fit';
import { SearchAddon } from '@xterm/addon-search';
import 'xterm/css/xterm.css';
import type { SessionId, TerminalOutputEvent } from '@afw/shared';
import { useTerminalEvents } from '../../hooks/useTerminalEvents';

interface TerminalTab {
  sessionId: SessionId;
  terminal: XTerm;
  fitAddon: FitAddon;
  searchAddon: SearchAddon;
  scrollPosition: number;
}

interface TerminalTabsProps {
  sessionIds: SessionId[];
  height: number;
  onHeightChange: (height: number) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  combinedMode: boolean;
  onToggleCombinedMode: () => void;
}

export function TerminalTabs({
  sessionIds,
  height,
  onHeightChange,
  isCollapsed,
  onToggleCollapse,
  combinedMode,
  onToggleCombinedMode,
}: TerminalTabsProps) {
  const [activeSessionId, setActiveSessionId] = useState<SessionId | null>(
    sessionIds[0] || null
  );
  const [tabs, setTabs] = useState<Map<SessionId, TerminalTab>>(new Map());
  const tabsRef = useRef<Map<SessionId, TerminalTab>>(new Map());
  const [isResizing, setIsResizing] = useState(false);
  const resizeStartY = useRef<number>(0);
  const resizeStartHeight = useRef<number>(0);
  const terminalContainerRef = useRef<HTMLDivElement>(null);
  const combinedTerminalRef = useRef<XTerm | null>(null);
  const combinedFitAddonRef = useRef<FitAddon | null>(null);

  // Keep tabsRef in sync with tabs state
  useEffect(() => {
    tabsRef.current = tabs;
  }, [tabs]);

  // Initialize terminals for each session
  useEffect(() => {
    const newTabs = new Map<SessionId, TerminalTab>();

    sessionIds.forEach((sessionId) => {
      if (tabs.has(sessionId)) {
        newTabs.set(sessionId, tabs.get(sessionId)!);
        return;
      }

      const term = new XTerm({
        cursorBlink: false,
        disableStdin: true,
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

      newTabs.set(sessionId, {
        sessionId,
        terminal: term,
        fitAddon,
        searchAddon,
        scrollPosition: 0,
      });
    });

    // Clean up removed sessions
    tabs.forEach((tab, sessionId) => {
      if (!sessionIds.includes(sessionId)) {
        tab.terminal.dispose();
      }
    });

    setTabs(newTabs);

    // Update active session if needed
    if (activeSessionId && !sessionIds.includes(activeSessionId)) {
      setActiveSessionId(sessionIds[0] || null);
    }
  }, [sessionIds]);

  // Render active terminal
  useEffect(() => {
    if (!terminalContainerRef.current || !activeSessionId || combinedMode) return;

    const tab = tabs.get(activeSessionId);
    if (!tab) return;

    // Clear container
    terminalContainerRef.current.innerHTML = '';

    // Mount terminal
    tab.terminal.open(terminalContainerRef.current);
    tab.fitAddon.fit();

    // Restore scroll position
    if (tab.scrollPosition > 0) {
      tab.terminal.scrollToLine(tab.scrollPosition);
    }
  }, [activeSessionId, tabs, combinedMode]);

  // Initialize combined terminal
  useEffect(() => {
    if (!combinedMode || !terminalContainerRef.current) return;

    if (!combinedTerminalRef.current) {
      const term = new XTerm({
        cursorBlink: false,
        disableStdin: true,
        fontSize: 13,
        fontFamily: 'Consolas, "Courier New", monospace',
        theme: {
          background: '#1e1e1e',
          foreground: '#d4d4d4',
        },
      });

      const fitAddon = new FitAddon();
      term.loadAddon(fitAddon);

      terminalContainerRef.current.innerHTML = '';
      term.open(terminalContainerRef.current);
      fitAddon.fit();

      combinedTerminalRef.current = term;
      combinedFitAddonRef.current = fitAddon;

      term.writeln('\x1b[36mCombined Terminal Output\x1b[0m');
      term.writeln('\x1b[90mAll sessions interleaved chronologically...\x1b[0m');
      term.writeln('');
    }

    // Cleanup: dispose terminal when unmounting or toggling off combined mode
    return () => {
      if (combinedTerminalRef.current) {
        combinedTerminalRef.current.dispose();
        combinedTerminalRef.current = null;
        combinedFitAddonRef.current = null;
      }
    };
  }, [combinedMode]);

  // Handle resize
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

  // Fit terminals when height changes
  useEffect(() => {
    if (isCollapsed) return;

    if (combinedMode && combinedFitAddonRef.current) {
      setTimeout(() => combinedFitAddonRef.current?.fit(), 100);
    } else if (activeSessionId) {
      const tab = tabs.get(activeSessionId);
      if (tab) {
        setTimeout(() => tab.fitAddon.fit(), 100);
      }
    }
  }, [height, isCollapsed, combinedMode, activeSessionId, tabs]);

  // Write output to appropriate terminal (useCallback with stable dependencies)
  const writeOutput = useCallback((event: TerminalOutputEvent) => {
    const { sessionId, output, stream, stepNumber, action } = event;

    // Build prefix
    let prefix = '';
    if (stepNumber !== undefined && action) {
      const stepColor = stream === 'stderr' ? '\x1b[91m' : '\x1b[93m';
      prefix = `${stepColor}[#${stepNumber} ${action}]\x1b[0m `;
    } else if (stepNumber !== undefined) {
      const stepColor = stream === 'stderr' ? '\x1b[91m' : '\x1b[93m';
      prefix = `${stepColor}[#${stepNumber}]\x1b[0m `;
    }

    const streamColor = stream === 'stderr' ? '\x1b[91m' : '\x1b[0m';

    if (combinedTerminalRef.current) {
      // Combined mode: add session ID prefix
      const sessionPrefix = `\x1b[36m[${sessionId.slice(0, 8)}]\x1b[0m `;
      const lines = output.split('\n');
      lines.forEach((line, index) => {
        if (index > 0) combinedTerminalRef.current!.write('\r\n');
        combinedTerminalRef.current!.write(`${sessionPrefix}${prefix}${streamColor}${line}\x1b[0m`);
      });
      combinedTerminalRef.current.write('\r\n');
    } else {
      // Session-specific mode: use ref instead of state to avoid stale closures
      const tab = tabsRef.current.get(sessionId);
      if (tab) {
        const lines = output.split('\n');
        lines.forEach((line, index) => {
          if (index > 0) tab.terminal.write('\r\n');
          tab.terminal.write(`${prefix}${streamColor}${line}\x1b[0m`);
        });
        tab.terminal.write('\r\n');
      }
    }
  }, []); // No dependencies - uses refs for stable callback

  // Hook up to WebSocket events
  useTerminalEvents({
    sessionIds,
    onTerminalOutput: writeOutput,
  });

  if (isCollapsed) {
    return (
      <div style={{ height: '32px', borderTop: '1px solid #333' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '4px 12px',
            background: '#252526',
            cursor: 'pointer',
          }}
          onClick={onToggleCollapse}
        >
          <span style={{ fontSize: '12px', color: '#ccc' }}>Terminal</span>
          <button style={{ background: 'none', border: 'none', color: '#ccc', cursor: 'pointer' }}>
            ▲
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: `${height}px`, borderTop: '1px solid #333', display: 'flex', flexDirection: 'column' }}>
      {/* Resize handle */}
      <div
        style={{
          height: '4px',
          background: isResizing ? '#007acc' : '#333',
          cursor: 'ns-resize',
        }}
        onMouseDown={handleMouseDown}
      />

      {/* Header with tabs */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        background: '#252526',
        borderBottom: '1px solid #333',
      }}>
        {/* Tabs */}
        <div style={{ display: 'flex', flex: 1, overflowX: 'auto' }}>
          {sessionIds.map((sessionId) => (
            <button
              key={sessionId}
              onClick={() => !combinedMode && setActiveSessionId(sessionId)}
              style={{
                padding: '6px 12px',
                background: activeSessionId === sessionId && !combinedMode ? '#1e1e1e' : 'transparent',
                border: 'none',
                borderRight: '1px solid #333',
                color: '#ccc',
                cursor: 'pointer',
                fontSize: '12px',
                whiteSpace: 'nowrap',
              }}
            >
              {sessionId.slice(0, 8)}
            </button>
          ))}
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', gap: '8px', padding: '0 12px' }}>
          <button
            onClick={onToggleCombinedMode}
            style={{
              background: combinedMode ? '#007acc' : 'none',
              border: '1px solid #666',
              color: '#ccc',
              cursor: 'pointer',
              fontSize: '11px',
              padding: '2px 8px',
              borderRadius: '3px',
            }}
            title="Combined output"
          >
            🌐
          </button>
          <button
            onClick={onToggleCollapse}
            style={{
              background: 'none',
              border: 'none',
              color: '#ccc',
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            ▼
          </button>
        </div>
      </div>

      {/* Terminal container */}
      <div ref={terminalContainerRef} style={{ flex: 1, padding: '8px' }} />
    </div>
  );
}
