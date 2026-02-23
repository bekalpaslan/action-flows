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

import React, { useState, useCallback, useRef } from 'react';
import type { RegionId } from '@afw/shared';
import { useDiscoveryContext } from '../../contexts/DiscoveryContext';
import { DiscoveryHint } from '../CommandCenter/DiscoveryHint';
import { DISCOVERY_SUGGESTIONS, getRegionName } from '../CommandCenter/discoveryConfig';
import './CommandCenter.css';

export interface CommandCenterProps {
  /** Callback when user submits a command */
  onCommand?: (command: string) => void;
}

/**
 * CommandCenter - Bottom bar for Living Universe navigation and control
 */
export function CommandCenter({
  onCommand,
}: CommandCenterProps): React.ReactElement {
  const [commandInput, setCommandInput] = useState('');
  const [dismissedHints, setDismissedHints] = useState<Set<RegionId>>(new Set());
  const inputRef = useRef<HTMLInputElement>(null);

  const { discoveryProgress } = useDiscoveryContext();

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

      {/* Discovery Hint (appears above command input when region is 90%+ ready) */}
      {activeHint && (
        <DiscoveryHint
          regionId={activeHint}
          regionName={getRegionName(activeHint)}
          progress={discoveryProgress[activeHint]}
          suggestion={DISCOVERY_SUGGESTIONS[activeHint]}
          onDismiss={handleDismissHint}
        />
      )}

      {/* Control Row — centered input */}
      <div className="command-center__controls">
        <div className="command-center__input-section">
          <div className="command-center__input-icon">
            <svg
              width="16"
              height="16"
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
            data-testid="action-panel"
            value={commandInput}
            onChange={(e) => setCommandInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter orchestrator command..."
            aria-label="Orchestrator command input"
          />
        </div>
      </div>
    </div>
  );
}
