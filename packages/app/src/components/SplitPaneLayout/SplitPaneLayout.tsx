import type { Session } from '@afw/shared';
import { SessionPane } from '../SessionPane';
import './SplitPaneLayout.css';

export interface SplitPaneLayoutProps {
  sessions: Session[];
  onSessionDetach: (sessionId: string) => void;
}

/**
 * SplitPaneLayout component - manages dynamic grid layout for attached sessions
 *
 * Layout logic:
 * - 1 session: Full width/height
 * - 2 sessions: 50%/50% horizontal split
 * - 3 sessions: 50%/50% top row, 100% bottom row
 * - 4 sessions: 2x2 grid
 * - 5+ sessions: Warning displayed, 2x3 grid if forced
 *
 * Features:
 * - Automatic grid calculation
 * - Empty state when no sessions attached
 * - Warning for excessive sessions (>4)
 * - Responsive pane sizing
 */
export function SplitPaneLayout({ sessions, onSessionDetach }: SplitPaneLayoutProps) {
  const count = sessions.length;

  // Empty state
  if (count === 0) {
    return (
      <div className="split-pane-layout-empty">
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <h2>No Sessions Attached</h2>
          <p>Click a session in the sidebar to view its visualization</p>
        </div>
      </div>
    );
  }

  // Warning for excessive sessions
  const showWarning = count > 4;

  // Calculate grid layout
  const layout = calculateLayout(count);

  return (
    <div className="split-pane-layout-container">
      {showWarning && (
        <div className="layout-warning">
          <span className="warning-icon">⚠</span>
          <span className="warning-text">
            Maximum 4 sessions recommended for optimal viewing. Layout may be crowded.
          </span>
        </div>
      )}
      <div
        className="split-pane-layout"
        style={{
          gridTemplateRows: `repeat(${layout.rows}, 1fr)`,
          gridTemplateColumns: `repeat(${layout.cols}, 1fr)`,
        }}
      >
        {sessions.map((session, index) => {
          const position = getSessionPosition(index, layout);
          return (
            <SessionPane
              key={session.id}
              session={session}
              onDetach={onSessionDetach}
              position={position}
            />
          );
        })}
      </div>
    </div>
  );
}

/**
 * Layout configuration for grid
 */
interface LayoutConfig {
  rows: number;
  cols: number;
  positions: Array<{ row: number; col: number; rowSpan?: number; colSpan?: number }>;
}

/**
 * Calculate optimal grid layout based on session count
 */
function calculateLayout(count: number): LayoutConfig {
  switch (count) {
    case 1:
      return {
        rows: 1,
        cols: 1,
        positions: [{ row: 1, col: 1 }],
      };
    case 2:
      return {
        rows: 1,
        cols: 2,
        positions: [
          { row: 1, col: 1 },
          { row: 1, col: 2 },
        ],
      };
    case 3:
      return {
        rows: 2,
        cols: 2,
        positions: [
          { row: 1, col: 1 },
          { row: 1, col: 2 },
          { row: 2, col: 1, colSpan: 2 },
        ],
      };
    case 4:
      return {
        rows: 2,
        cols: 2,
        positions: [
          { row: 1, col: 1 },
          { row: 1, col: 2 },
          { row: 2, col: 1 },
          { row: 2, col: 2 },
        ],
      };
    case 5:
      return {
        rows: 2,
        cols: 3,
        positions: [
          { row: 1, col: 1 },
          { row: 1, col: 2 },
          { row: 1, col: 3 },
          { row: 2, col: 1 },
          { row: 2, col: 2 },
        ],
      };
    case 6:
      return {
        rows: 2,
        cols: 3,
        positions: [
          { row: 1, col: 1 },
          { row: 1, col: 2 },
          { row: 1, col: 3 },
          { row: 2, col: 1 },
          { row: 2, col: 2 },
          { row: 2, col: 3 },
        ],
      };
    default:
      // For 7+ sessions, use 3-column grid with calculated rows
      const rows = Math.ceil(count / 3);
      const positions = Array.from({ length: count }, (_, i) => ({
        row: Math.floor(i / 3) + 1,
        col: (i % 3) + 1,
      }));
      return {
        rows,
        cols: 3,
        positions,
      };
  }
}

/**
 * Get position for a session at given index
 */
function getSessionPosition(
  index: number,
  layout: LayoutConfig
): { row: number; col: number; totalRows: number; totalCols: number } {
  const position = layout.positions[index] || { row: 1, col: 1 };
  return {
    row: position.row,
    col: position.col,
    totalRows: layout.rows,
    totalCols: layout.cols,
  };
}
