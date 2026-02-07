/**
 * Claude CLI Start Dialog
 * Dialog for starting a new Claude CLI session
 */

import React, { useState } from 'react';
import type { SessionId } from '@afw/shared';
import { useClaudeCliSessions } from '../../hooks/useClaudeCliSessions';

interface ClaudeCliStartDialogProps {
  onClose: () => void;
  onSessionStarted?: (sessionId: SessionId) => void;
}

/**
 * Claude CLI Start Dialog
 * Form for configuring and starting a new Claude CLI session
 */
export function ClaudeCliStartDialog({ onClose, onSessionStarted }: ClaudeCliStartDialogProps) {
  // Safely get current working directory (Electron context)
  const initialCwd = typeof process !== 'undefined' && process.cwd ? process.cwd() : '';
  const [cwd, setCwd] = useState(initialCwd);
  const [prompt, setPrompt] = useState('');
  const [selectedFlags, setSelectedFlags] = useState<string[]>([]);
  const { startSession, isLoading, error } = useClaudeCliSessions();

  const availableFlags = [
    { value: '--debug', label: 'Debug Mode', description: 'Enable debug output' },
    { value: '--no-session-persistence', label: 'No Persistence', description: 'Ephemeral session (no state saved)' },
    { value: '--print', label: 'Print Mode', description: 'Non-interactive mode' },
  ];

  const handleFlagToggle = (flag: string) => {
    setSelectedFlags(prev =>
      prev.includes(flag)
        ? prev.filter(f => f !== flag)
        : [...prev, flag]
    );
  };

  const handleStart = async () => {
    if (!cwd.trim()) {
      alert('Working directory is required');
      return;
    }

    try {
      const sessionId = crypto.randomUUID() as SessionId;
      await startSession(sessionId, cwd, prompt || undefined, selectedFlags.length > 0 ? selectedFlags : undefined);
      onSessionStarted?.(sessionId);
      onClose();
    } catch (err) {
      console.error('Failed to start Claude CLI session:', err);
      // Error is already set by the hook
    }
  };

  return (
    <div className="claude-cli-start-dialog" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        backgroundColor: '#1e1e1e',
        border: '1px solid #3e3e3e',
        borderRadius: '8px',
        padding: '24px',
        maxWidth: '600px',
        width: '100%',
        maxHeight: '80vh',
        overflow: 'auto',
      }}>
        <h2 style={{ margin: '0 0 16px 0', color: '#d4d4d4' }}>Start Claude CLI Session</h2>

        {error && (
          <div style={{
            padding: '12px',
            backgroundColor: '#5a1d1d',
            border: '1px solid #c93c37',
            borderRadius: '4px',
            marginBottom: '16px',
            color: '#f48771',
            fontSize: '14px',
          }}>
            {error.message}
          </div>
        )}

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '4px', color: '#d4d4d4', fontSize: '14px' }}>
            Working Directory *
          </label>
          <input
            type="text"
            value={cwd}
            onChange={(e) => setCwd(e.target.value)}
            placeholder="/path/to/project"
            style={{
              width: '100%',
              padding: '8px',
              backgroundColor: '#2d2d2d',
              border: '1px solid #3e3e3e',
              borderRadius: '4px',
              color: '#d4d4d4',
              fontSize: '14px',
              fontFamily: 'Consolas, monospace',
            }}
          />
          <small style={{ color: '#858585', fontSize: '12px' }}>
            Absolute path to the directory where Claude CLI will run
          </small>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '4px', color: '#d4d4d4', fontSize: '14px' }}>
            Initial Prompt (optional)
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="What would you like Claude to help you with?"
            rows={4}
            style={{
              width: '100%',
              padding: '8px',
              backgroundColor: '#2d2d2d',
              border: '1px solid #3e3e3e',
              borderRadius: '4px',
              color: '#d4d4d4',
              fontSize: '14px',
              resize: 'vertical',
            }}
          />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '8px', color: '#d4d4d4', fontSize: '14px' }}>
            Flags (optional)
          </label>
          {availableFlags.map(flag => (
            <div key={flag.value} style={{ marginBottom: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={selectedFlags.includes(flag.value)}
                  onChange={() => handleFlagToggle(flag.value)}
                  style={{ marginTop: '2px', marginRight: '8px' }}
                />
                <div>
                  <div style={{ color: '#d4d4d4', fontSize: '14px' }}>{flag.label}</div>
                  <div style={{ color: '#858585', fontSize: '12px' }}>{flag.description}</div>
                </div>
              </label>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            disabled={isLoading}
            style={{
              padding: '8px 16px',
              backgroundColor: '#3c3c3c',
              color: '#d4d4d4',
              border: 'none',
              borderRadius: '4px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleStart}
            disabled={isLoading || !cwd.trim()}
            style={{
              padding: '8px 16px',
              backgroundColor: isLoading || !cwd.trim() ? '#3c3c3c' : '#0e639c',
              color: isLoading || !cwd.trim() ? '#858585' : 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isLoading || !cwd.trim() ? 'not-allowed' : 'pointer',
              fontSize: '14px',
            }}
          >
            {isLoading ? 'Starting...' : 'Start Session'}
          </button>
        </div>
      </div>
    </div>
  );
}
