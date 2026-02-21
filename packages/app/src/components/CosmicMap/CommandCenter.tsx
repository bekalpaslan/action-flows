/**
 * CommandCenter - Living Universe command center bottom bar
 *
 * Phase 2: Command Center for Living Universe
 * Provides primary user controls positioned at bottom of cosmic map:
 * - Session dropdown selector
 * - Health status link
 *
 * Integrates with:
 * - SessionContext for session management
 * - UniverseContext for universe-level commands
 * - Cosmic design tokens for visual consistency
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { SessionId, Session, RegionId, WorkbenchId } from '@afw/shared';
import { useSessionContext } from '../../contexts/SessionContext';
import { useUniverseContext } from '../../contexts/UniverseContext';
import { useDiscoveryContext } from '../../contexts/DiscoveryContext';
import { useWorkbenchContext } from '../../contexts/WorkbenchContext';
import { DiscoveryHint } from '../CommandCenter/DiscoveryHint';
import { DISCOVERY_SUGGESTIONS, getRegionName } from '../CommandCenter/discoveryConfig';
import './CommandCenter.css';

export interface CommandCenterProps {
  /** Legacy callback retained for compatibility (textbox removed) */
  onCommand?: (command: string) => void;
  /** Show health status link */
  showHealthStatus?: boolean;
}

/**
 * CommandCenter - Bottom bar for Living Universe navigation and control
 */
export function CommandCenter({
  onCommand: _onCommand,
  showHealthStatus = true,
}: CommandCenterProps): React.ReactElement {
  const [isSessionDropdownOpen, setIsSessionDropdownOpen] = useState(false);
  const [dismissedHints, setDismissedHints] = useState<Set<RegionId>>(new Set());
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { sessions, activeSessionId, setActiveSession } = useSessionContext();
  const { universe, navigateToRegion, getRegionByWorkbench } = useUniverseContext();
  const { discoveryProgress } = useDiscoveryContext();
  const { setActiveWorkbench } = useWorkbenchContext();

  /**
   * Calculate active chains across all sessions
   * A chain is "active" if it has status "in_progress" or "pending"
   */
  const activeChains = sessions
    .flatMap((s) => s.chains)
    .filter((chain) => chain.status === 'in_progress' || chain.status === 'pending');

  /**
   * Get active session object
   */
  const activeSession = sessions.find((s) => s.id === activeSessionId);

  const resolveSessionWorkbench = useCallback((session: Session): WorkbenchId | null => {
    if (session.workbenchId) {
      return session.workbenchId;
    }
    const metadataWorkbench = session.metadata?.routingContext;
    return typeof metadataWorkbench === 'string'
      ? (metadataWorkbench as WorkbenchId)
      : null;
  }, []);

  /**
   * Handle session selection
   */
  const handleSessionSelect = useCallback(
    (sessionId: SessionId) => {
      setActiveSession(sessionId);
      const selectedSession = sessions.find((s) => s.id === sessionId);
      const targetWorkbench = selectedSession ? resolveSessionWorkbench(selectedSession) : null;

      if (targetWorkbench) {
        const targetRegion = getRegionByWorkbench(targetWorkbench);
        if (targetRegion) {
          navigateToRegion(targetRegion.id);
        } else {
          setActiveWorkbench(targetWorkbench);
        }
      }

      setIsSessionDropdownOpen(false);
    },
    [
      setActiveSession,
      sessions,
      resolveSessionWorkbench,
      getRegionByWorkbench,
      navigateToRegion,
      setActiveWorkbench,
    ]
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

  /**
   * Find regions that are near discovery (≥90% progress, not yet revealed)
   * Only show the highest progress region to avoid spam
   */
  const nearDiscoveryRegions = Object.entries(discoveryProgress)
    .filter(([regionId, progress]) => {
      // Must be ≥90% progress
      if (progress < 0.9) return false;

      // Must not be fully discovered (100%)
      if (progress >= 1.0) return false;

      // Must not be dismissed
      if (dismissedHints.has(regionId as RegionId)) return false;

      return true;
    })
    .sort(([, progressA], [, progressB]) => progressB - progressA) // Highest progress first
    .map(([regionId]) => regionId as RegionId);

  // Show only the first hint (highest progress)
  const activeHint = nearDiscoveryRegions[0];

  /**
   * Handle hint dismissal
   */
  const handleDismissHint = useCallback((regionId: RegionId) => {
    setDismissedHints((prev) => {
      const newSet = new Set(prev);
      newSet.add(regionId);
      return newSet;
    });
  }, []);

  return (
    <div className="command-center" data-testid="command-center" role="region" aria-label="Command Center">
      {/* Running chain indicator */}
      {activeChains.length > 0 && (
        <div className="command-center__running-chains">
          <div className="running-chain-indicator">
            <span className="running-chain-spinner" />
            <span className="running-chain-text">
              {activeChains.length} chain{activeChains.length > 1 ? 's' : ''} running
            </span>
          </div>
        </div>
      )}

      {/* Discovery Hint (appears when region is 90%+ ready) */}
      {activeHint && (
        <DiscoveryHint
          regionId={activeHint}
          regionName={getRegionName(activeHint)}
          progress={discoveryProgress[activeHint]}
          suggestion={DISCOVERY_SUGGESTIONS[activeHint]}
          onDismiss={handleDismissHint}
        />
      )}

      {/* Control Row */}
      <div className="command-center__controls" role="toolbar" aria-label="Session controls">
        {/* Session Selector */}
        <div className="command-center__session-section" ref={dropdownRef}>
          <button
            className="command-center__session-trigger"
            data-testid="mode-selector"
            onClick={toggleSessionDropdown}
            aria-label="Select session - Switch between active sessions"
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
              data-testid="quick-actions"
              role="listbox"
              aria-label="Quick actions menu - Available sessions"
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

        {/* Health Status */}
        {showHealthStatus && (
          <div className="command-center__health-section" data-testid="status-indicator">
            <div
              className={`command-center__health-indicator command-center__health-indicator--${getHealthColorClass(
                universeHealth
              )}`}
              data-testid="health-display"
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
    </div>
  );
}
