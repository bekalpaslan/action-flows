import type { ArchivedSession } from '../../hooks/useSessionArchive';
import { DiscussButton, DiscussDialog } from '../DiscussButton';
import { useDiscussButton } from '../../hooks/useDiscussButton';
import './SessionArchive.css';

export interface SessionArchiveProps {
  /** Archived sessions */
  archivedSessions: ArchivedSession[];

  /** Callback when restore clicked */
  onRestore: (sessionId: string) => void;

  /** Callback when delete clicked */
  onDelete: (sessionId: string) => void;

  /** Callback when close clicked */
  onClose: () => void;
}

/**
 * SessionArchive - modal/panel showing archived sessions
 *
 * Allows restoring or permanently deleting archived sessions
 */
export function SessionArchive({
  archivedSessions,
  onRestore,
  onDelete,
  onClose,
}: SessionArchiveProps) {
  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const { isDialogOpen, openDialog, closeDialog, handleSend } = useDiscussButton({
    componentName: 'SessionArchive',
    getContext: () => ({
      archivedCount: archivedSessions.length,
      selectedSession: null,
      dateRange: archivedSessions.length > 0 ? {
        earliest: Math.min(...archivedSessions.map(s => s.archivedAt)),
        latest: Math.max(...archivedSessions.map(s => s.archivedAt)),
      } : null,
    }),
  });

  return (
    <div className="session-archive-overlay" onClick={onClose}>
      <div className="session-archive-panel" onClick={(e) => e.stopPropagation()}>
        <div className="archive-header">
          <h2>Archived Sessions</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <DiscussButton componentName="SessionArchive" onClick={openDialog} size="small" />
            <button className="archive-close-btn" onClick={onClose} title="Close">
              ×
            </button>
          </div>
        </div>

        <div className="archive-content">
          {archivedSessions.length === 0 ? (
            <div className="archive-empty">
              <p>No archived sessions</p>
            </div>
          ) : (
            <div className="archive-list">
              {archivedSessions.map((archived) => (
                <div key={archived.sessionId} className="archive-item">
                  <div className="archive-item-header">
                    <span className="archive-session-id" title={archived.sessionData.id}>
                      {archived.sessionData.id.length > 40
                        ? `${archived.sessionData.id.slice(0, 37)}...`
                        : archived.sessionData.id}
                    </span>
                    <span className="archive-status-badge">
                      {archived.sessionData.status}
                    </span>
                  </div>

                  <div className="archive-item-details">
                    <div className="detail-row">
                      <span className="detail-label">User:</span>
                      <span className="detail-value">{archived.sessionData.user}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Chains:</span>
                      <span className="detail-value">{archived.sessionData.chainsCount}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Started:</span>
                      <span className="detail-value">
                        {new Date(archived.sessionData.startedAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Archived:</span>
                      <span className="detail-value">
                        {formatTimestamp(archived.archivedAt)}
                      </span>
                    </div>
                  </div>

                  <div className="archive-item-actions">
                    <button
                      className="archive-btn restore-btn"
                      onClick={() => onRestore(archived.sessionId)}
                      title="Restore to grid"
                    >
                      Restore
                    </button>
                    <button
                      className="archive-btn delete-btn"
                      onClick={() => onDelete(archived.sessionId)}
                      title="Delete permanently"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <DiscussDialog
        isOpen={isDialogOpen}
        componentName="SessionArchive"
        componentContext={{
          archivedCount: archivedSessions.length,
          selectedSession: null,
          dateRange: archivedSessions.length > 0 ? {
            earliest: Math.min(...archivedSessions.map(s => s.archivedAt)),
            latest: Math.max(...archivedSessions.map(s => s.archivedAt)),
          } : null,
        }}
        onSend={handleSend}
        onClose={closeDialog}
      />
    </div>
  );
}
