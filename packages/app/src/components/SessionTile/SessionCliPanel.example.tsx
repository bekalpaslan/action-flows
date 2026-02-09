/**
 * SessionCliPanel Usage Examples
 * Demonstrates various ways to use the SessionCliPanel component
 */

import React from 'react';
import { SessionCliPanel } from './SessionCliPanel';
import type { SessionId } from '@afw/shared';

/**
 * Example 1: Basic Usage
 * Minimal setup with required props only
 */
export function BasicCliPanel() {
  const sessionId = 'session-123' as SessionId;

  return (
    <div style={{ height: '600px', width: '100%' }}>
      <SessionCliPanel sessionId={sessionId} />
    </div>
  );
}

/**
 * Example 2: With Command Callback
 * Handle command events from the terminal
 */
export function CliPanelWithCallback() {
  const sessionId = 'session-456' as SessionId;

  const handleCommand = (command: string) => {
    console.log('Command sent to Claude CLI:', command);

    // You could:
    // - Log commands to analytics
    // - Show a toast notification
    // - Update UI state
    // - Trigger side effects
  };

  return (
    <div style={{ height: '400px', width: '100%' }}>
      <SessionCliPanel
        sessionId={sessionId}
        onCommand={handleCommand}
      />
    </div>
  );
}

/**
 * Example 3: Custom Height
 * Set specific height for the terminal panel
 */
export function CliPanelCustomHeight() {
  const sessionId = 'session-789' as SessionId;

  return (
    <SessionCliPanel
      sessionId={sessionId}
      height="300px"
    />
  );
}

/**
 * Example 4: Full Page Terminal
 * Terminal that takes up entire viewport
 */
export function FullPageCliPanel() {
  const sessionId = 'session-full' as SessionId;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ flex: 1, minHeight: 0 }}>
        <SessionCliPanel
          sessionId={sessionId}
          height="100%"
        />
      </div>
    </div>
  );
}

/**
 * Example 5: Split View with Details
 * Terminal alongside session details panel
 */
export function SplitViewWithCli() {
  const sessionId = 'session-split' as SessionId;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '300px 1fr',
        gap: '16px',
        height: '600px',
      }}
    >
      {/* Session details would go here */}
      <div style={{ background: '#1a1a1a', borderRadius: '6px', padding: '16px' }}>
        <h3>Session Details</h3>
        <p>ID: {sessionId}</p>
      </div>

      {/* Terminal panel */}
      <SessionCliPanel sessionId={sessionId} />
    </div>
  );
}

/**
 * Example 6: Tabbed Interface
 * Switch between multiple CLI sessions
 */
export function TabbedCliPanels() {
  const [activeTab, setActiveTab] = React.useState(0);

  const sessions = [
    'session-tab-1' as SessionId,
    'session-tab-2' as SessionId,
    'session-tab-3' as SessionId,
  ];

  return (
    <div style={{ height: '600px', display: 'flex', flexDirection: 'column' }}>
      {/* Tab buttons */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          padding: '8px',
          background: '#1a1a1a',
          borderRadius: '6px 6px 0 0',
        }}
      >
        {sessions.map((sessionId, index) => (
          <button
            key={sessionId}
            onClick={() => setActiveTab(index)}
            style={{
              padding: '8px 16px',
              background: activeTab === index ? '#0dbc79' : '#2a2a2a',
              color: activeTab === index ? '#0a0a0a' : '#d4d4d4',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Session {index + 1}
          </button>
        ))}
      </div>

      {/* Active terminal panel */}
      <div style={{ flex: 1, minHeight: 0 }}>
        <SessionCliPanel
          sessionId={sessions[activeTab]}
          height="100%"
        />
      </div>
    </div>
  );
}

/**
 * Example 7: With WebSocket Status
 * Show connection status alongside terminal
 */
export function CliPanelWithStatus() {
  const sessionId = 'session-status' as SessionId;
  const [isConnected, setIsConnected] = React.useState(true);

  return (
    <div style={{ height: '600px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {/* Connection status banner */}
      <div
        style={{
          padding: '8px 16px',
          background: isConnected ? '#0dbc79' : '#cd3131',
          color: '#0a0a0a',
          borderRadius: '6px',
          fontWeight: 600,
          textAlign: 'center',
        }}
      >
        {isConnected ? '● Connected to WebSocket' : '○ Disconnected from WebSocket'}
      </div>

      {/* Terminal panel */}
      <div style={{ flex: 1, minHeight: 0 }}>
        <SessionCliPanel
          sessionId={sessionId}
          height="100%"
        />
      </div>
    </div>
  );
}

/**
 * Example 8: Resizable Terminal
 * User can drag to resize terminal height
 */
export function ResizableCliPanel() {
  const sessionId = 'session-resize' as SessionId;
  const [height, setHeight] = React.useState(400);

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Height control */}
      <div style={{ padding: '16px', background: '#1a1a1a', marginBottom: '8px' }}>
        <label htmlFor="height-slider" style={{ color: '#d4d4d4', marginRight: '12px' }}>
          Terminal Height: {height}px
        </label>
        <input
          id="height-slider"
          type="range"
          min="200"
          max="800"
          value={height}
          onChange={(e) => setHeight(Number(e.target.value))}
          style={{ width: '300px' }}
        />
      </div>

      {/* Terminal with dynamic height */}
      <SessionCliPanel
        sessionId={sessionId}
        height={`${height}px`}
      />
    </div>
  );
}

/**
 * Example 9: With Command History
 * Track and display recent commands
 */
export function CliPanelWithHistory() {
  const sessionId = 'session-history' as SessionId;
  const [commandHistory, setCommandHistory] = React.useState<string[]>([]);

  const handleCommand = (command: string) => {
    setCommandHistory((prev) => [...prev, command].slice(-10)); // Keep last 10
  };

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 250px',
        gap: '16px',
        height: '600px',
      }}
    >
      {/* Terminal */}
      <SessionCliPanel
        sessionId={sessionId}
        height="100%"
        onCommand={handleCommand}
      />

      {/* Command history sidebar */}
      <div
        style={{
          background: '#1a1a1a',
          borderRadius: '6px',
          padding: '16px',
          overflow: 'auto',
        }}
      >
        <h3 style={{ color: '#d4d4d4', margin: '0 0 12px 0' }}>Command History</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {commandHistory.length === 0 ? (
            <p style={{ color: '#666666', fontSize: '14px' }}>No commands yet</p>
          ) : (
            commandHistory.map((cmd, index) => (
              <div
                key={index}
                style={{
                  padding: '6px 8px',
                  background: '#0a0a0a',
                  borderRadius: '4px',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  color: '#d4d4d4',
                }}
              >
                {cmd}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
