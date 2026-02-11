/**
 * CommandCenter - Living Universe command center bottom bar
 *
 * Phase 2: Command Center for Living Universe
 * Provides primary user controls positioned at bottom of cosmic map:
 * - Input field for orchestrator commands
 * - Session dropdown selector
 * - Health status link
 *
 * Integrates with:
 * - SessionContext for session management
 * - UniverseContext for universe-level commands
 * - Cosmic design tokens for visual consistency
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { SessionId, Session } from '@afw/shared';
import { useSessionContext } from '../../contexts/SessionContext';
import { useUniverseContext } from '../../contexts/UniverseContext';
import './CommandCenter.css';

export interface CommandCenterProps {
  /** Callback when user submits a command */
  onCommand?: (command: string) => void;
  /** Show health status link */
  showHealthStatus?: boolean;
}

/**
 * CommandCenter - Bottom bar for Living Universe navigation and control
 */
export function CommandCenter({
  onCommand,
  showHealthStatus = true,
}: CommandCenterProps): React.ReactElement {
  const [commandInput, setCommandInput] = useState('');
  const [isSessionDropdownOpen, setIsSessionDropdownOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { sessions, activeSessionId, setActiveSession } = useSessionContext();
  const { universe } = useUniverseContext();

  /**
   * Get active session object
   */
  const activeSession = sessions.find((s) => s.id === activeSessionId);

  /**
   * Handle command submission
   */
  const handleSubmitCommand = useCallback(() => {
    if (!commandInput.trim()) return;

    if (onCommand) {
      onCommand(commandInput.trim());
    }

    // Clear input after submission
    setCommandInput('');
  }, [commandInput, onCommand]);

  /**
   * Handle Enter key in command input
   */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSubmitCommand();
      }
    },
    [handleSubmitCommand]
  );

  /**
   * Handle session selection
   */
  const handleSessionSelect = useCallback(
    (sessionId: SessionId) => {
      setActiveSession(sessionId);
      setIsSessionDropdownOpen(false);
    },
    [setActiveSession]
  );

  /**
   * Toggle session dropdown
   */
  const toggleSessionDropdown = useCallback(() => {
    setIsSessionDropdownOpen((prev) => !prev);
  }, []);

  /**
   * Close dropdown on outside click
   */
  useEffect(() => {
    if (!isSessionDropdownOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsSessionDropdownOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsSessionDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isSessionDropdownOpen]);

  /**
   * Format session label for dropdown
   */
  const formatSessionLabel = (session: Session): string => {
    const id = session.id.length > 12
      ? `${session.id.substring(0, 8)}...`
      : session.id;
    const timestamp = new Date(session.startedAt).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
    return `${id} • ${timestamp}`;
  };

  /**
   * Calculate overall universe health
   * Combines contract compliance, activity level, and error rate
   */
  const calculateUniverseHealth = (): number => {
    if (!universe || universe.regions.length === 0) return 100;

    const healthMetrics = universe.regions
      .filter((r) => r.health !== undefined)
      .map((r) => r.health);

    if (healthMetrics.length === 0) return 100;

    // Calculate average health across all regions
    // Health formula: (contractCompliance * 0.4 + activityLevel * 0.3 + (1 - errorRate) * 0.3) * 100
    const totalHealth = healthMetrics.reduce((sum, h) => {
      const regionHealth =
        h.contractCompliance * 0.4 +
        h.activityLevel * 0.3 +
        (1 - h.errorRate) * 0.3;
      return sum + regionHealth;
    }, 0);

    const avgHealth = totalHealth / healthMetrics.length;
    return Math.round(avgHealth * 100);
  };

  const universeHealth = calculateUniverseHealth();

  /**
   * Get health color class
   */
  const getHealthColorClass = (health: number): string => {
    if (health >= 80) return 'high';
    if (health >= 40) return 'medium';
    return 'low';
  };

  return (
    <div className="command-center" role="region" aria-label="Command Center">
      {/* Left: Command Input */}
      <div className="command-center__input-section">
        <div className="command-center__input-icon">
          <svg
            width="18"
            height="18"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 8L8 4L4 8" />
            <path d="M8 4V14" />
          </svg>
        </div>
        <input
          ref={inputRef}
          type="text"
          className="command-center__input"
          value={commandInput}
          onChange={(e) => setCommandInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter orchestrator command..."
          aria-label="Orchestrator command input"
        />
        <button
          className="command-center__submit-btn"
          onClick={handleSubmitCommand}
          disabled={!commandInput.trim()}
          aria-label="Submit command"
          title="Execute command (Enter)"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="currentColor"
          >
            <path d="M8 0a.5.5 0 01.5.5v11.793l3.146-3.147a.5.5 0 01.708.708l-4 4a.5.5 0 01-.708 0l-4-4a.5.5 0 01.708-.708L7.5 12.293V.5A.5.5 0 018 0z" />
          </svg>
        </button>
      </div>

      {/* Middle: Session Selector */}
      <div className="command-center__session-section" ref={dropdownRef}>
        <button
          className="command-center__session-trigger"
          onClick={toggleSessionDropdown}
          aria-label="Select session"
          aria-haspopup="listbox"
          aria-expanded={isSessionDropdownOpen}
        >
          <svg
            className="command-center__session-icon"
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="currentColor"
          >
            <path d="M8 8a3 3 0 100-6 3 3 0 000 6zM2 14s-1 0-1-1 1-4 7-4 7 3 7 4-1 1-1 1H2z" />
          </svg>
          <span className="command-center__session-label">
            {activeSession
              ? formatSessionLabel(activeSession)
              : 'No Session'}
          </span>
          <svg
            className={`command-center__session-caret ${isSessionDropdownOpen ? 'open' : ''}`}
            width="12"
            height="12"
            viewBox="0 0 16 16"
            fill="currentColor"
          >
            <path d="M4.427 9.573l3.396-3.396a.25.25 0 0 1 .354 0l3.396 3.396a.25.25 0 0 1-.177.427H4.604a.25.25 0 0 1-.177-.427z" />
          </svg>
        </button>

        {/* Session Dropdown Menu */}
        {isSessionDropdownOpen && (
          <div
            className="command-center__session-dropdown"
            role="listbox"
            aria-label="Available sessions"
          >
            {sessions.length === 0 ? (
              <div className="command-center__session-empty">
                No sessions available
              </div>
            ) : (
              sessions.map((session) => (
                <button
                  key={session.id}
                  role="option"
                  aria-selected={activeSessionId === session.id}
                  className={`command-center__session-option ${
                    activeSessionId === session.id ? 'selected' : ''
                  }`}
                  onClick={() => handleSessionSelect(session.id)}
                >
                  <div className="command-center__session-option-label">
                    {formatSessionLabel(session)}
                  </div>
                  {session.status && (
                    <div
                      className={`command-center__session-status command-center__session-status--${session.status}`}
                    >
                      {session.status}
                    </div>
                  )}
                  {activeSessionId === session.id && (
                    <svg
                      className="command-center__session-checkmark"
                      width="14"
                      height="14"
                      viewBox="0 0 16 16"
                      fill="currentColor"
                    >
                      <path d="M13.854 3.646a.5.5 0 010 .708l-7 7a.5.5 0 01-.708 0l-3.5-3.5a.5.5 0 11.708-.708L6.5 10.293l6.646-6.647a.5.5 0 01.708 0z" />
                    </svg>
                  )}
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Right: Health Status */}
      {showHealthStatus && (
        <div className="command-center__health-section">
          <div
            className={`command-center__health-indicator command-center__health-indicator--${getHealthColorClass(
              universeHealth
            )}`}
            title={`Universe health: ${universeHealth}%`}
            aria-label={`Universe health: ${universeHealth}%`}
          >
            <svg
              className="command-center__health-icon"
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="currentColor"
            >
              <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 13A6 6 0 118 2a6 6 0 010 12z" />
              <path d="M8 4.5a.5.5 0 01.5.5v3.5H12a.5.5 0 010 1H8.5v3.5a.5.5 0 01-1 0V9H4a.5.5 0 010-1h3.5V4.5a.5.5 0 01.5-.5z" />
            </svg>
            <span className="command-center__health-value">
              {universeHealth}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
