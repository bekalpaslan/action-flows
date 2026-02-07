import { SessionWindowTile } from './SessionWindowTile';
import './SessionWindowGrid.css';
import type { Session } from '@afw/shared';

export interface SessionWindowGridProps {
  sessions: Session[];
  onRemove: (sessionId: string) => void;
}

/**
 * SessionWindowGrid - responsive grid layout for session windows
 *
 * Layout rules:
 * - 1 session: full width
 * - 2 sessions: side-by-side
 * - 3-4 sessions: 2x2 grid
 * - 5+ sessions: scrollable grid
 */
export function SessionWindowGrid({
  sessions,
  onRemove,
}: SessionWindowGridProps) {
  if (sessions.length === 0) {
    return (
      <div className="session-window-grid-empty">
        <div className="empty-state">
          <h3>No sessions followed</h3>
          <p>Follow a session from the sidebar to monitor it here</p>
        </div>
      </div>
    );
  }

  const gridClass = `session-window-grid session-count-${Math.min(sessions.length, 5)}`;

  return (
    <div className={gridClass}>
      {sessions.map((session) => (
        <SessionWindowTile
          key={session.id}
          session={session}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
}
