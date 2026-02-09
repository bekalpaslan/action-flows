/**
 * SessionTileGrid Component
 * Reusable grid component for displaying SessionTiles
 *
 * Layout Logic:
 * - 1 tile: Full width/height
 * - 2 tiles: 50%/50% horizontal split
 * - 3 tiles: 50%/50% top row, 100% bottom row
 * - 4 tiles: 2x2 grid
 *
 * Features:
 * - Dynamic grid calculation based on session count
 * - Compact mode for 3+ sessions
 * - Responsive grid layout
 * - Session callbacks (close, detach, input)
 */

import React from 'react';
import type { Session } from '@afw/shared';
import { SessionTile } from '../SessionTile';
import './SessionTileGrid.css';

export interface SessionTileGridProps {
  /** Sessions to display in grid */
  sessions: Session[];

  /** Callback when a session tile's close button is clicked */
  onSessionClose?: (sessionId: string) => void;

  /** Callback when a session tile's detach button is clicked */
  onSessionDetach?: (sessionId: string) => void;

  /** Callback when user submits input in a session's conversation panel */
  onSessionInput?: (sessionId: string, input: string) => Promise<void>;

  /** Callback when a node in a session's flow is clicked */
  onNodeClick?: (sessionId: string, nodeId: string) => void;

  /** Callback when an agent avatar in a session is clicked */
  onAgentClick?: (sessionId: string, agentId: string) => void;
}

/**
 * Layout configuration for grid
 */
interface LayoutConfig {
  rows: number;
  cols: number;
  compact: boolean;
}

/**
 * Calculate grid layout based on session count
 */
function calculateLayout(count: number): LayoutConfig {
  switch (count) {
    case 1:
      return { rows: 1, cols: 1, compact: false };
    case 2:
      return { rows: 1, cols: 2, compact: false };
    case 3:
      return { rows: 2, cols: 2, compact: true };
    case 4:
      return { rows: 2, cols: 2, compact: true };
    default:
      // 5+ sessions - fall back to 2x2 and warn
      return { rows: 2, cols: 2, compact: true };
  }
}

/**
 * SessionTileGrid - Grid layout for multiple SessionTiles
 */
export function SessionTileGrid({
  sessions,
  onSessionClose,
  onSessionDetach,
  onSessionInput,
  onNodeClick,
  onAgentClick,
}: SessionTileGridProps): React.ReactElement {
  const count = sessions.length;

  // Empty state
  if (count === 0) {
    return (
      <div className="session-tile-grid-empty">
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <h2>No Sessions Attached</h2>
          <p>Select a session from the sidebar to view it here</p>
        </div>
      </div>
    );
  }

  // Calculate layout
  const layout = calculateLayout(count);

  // Warning for excessive sessions
  const showWarning = count > 4;

  return (
    <div className="session-tile-grid-container">
      {showWarning && (
        <div className="session-tile-grid-warning">
          <span className="warning-icon">⚠</span>
          <span className="warning-text">
            Maximum 4 sessions recommended. Showing first 4 of {count} attached sessions.
          </span>
        </div>
      )}

      <div
        className="session-tile-grid"
        style={{
          gridTemplateRows: `repeat(${layout.rows}, 1fr)`,
          gridTemplateColumns: `repeat(${layout.cols}, 1fr)`,
        }}
      >
        {/* Show first 4 sessions only */}
        {sessions.slice(0, 4).map((session) => {
          // For 3 sessions, last one spans 2 columns
          const isLastOfThree = count === 3 && sessions.indexOf(session) === 2;
          const gridColumnStyle = isLastOfThree ? { gridColumn: '1 / -1' } : undefined;

          return (
            <div key={session.id} className="session-tile-grid-item" style={gridColumnStyle}>
              <SessionTile
                session={session}
                compact={layout.compact}
                onClose={
                  onSessionClose
                    ? () => onSessionClose(session.id)
                    : undefined
                }
                onDetach={
                  onSessionDetach
                    ? () => onSessionDetach(session.id)
                    : undefined
                }
                onSubmitInput={
                  onSessionInput
                    ? (input) => onSessionInput(session.id, input)
                    : undefined
                }
                onNodeClick={
                  onNodeClick
                    ? (nodeId) => onNodeClick(session.id, nodeId)
                    : undefined
                }
                onAgentClick={
                  onAgentClick
                    ? (agentId) => onAgentClick(session.id, agentId)
                    : undefined
                }
                showAgents
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
