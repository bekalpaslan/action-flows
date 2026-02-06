import { useEffect, useState } from 'react'
import type { Session, WorkspaceEvent } from '@afw/shared'
import type { SessionSnapshot } from '../../../backend/src/storage/file-persistence'

interface HistoryBrowserProps {
  backendUrl: string
  onSessionSelect?: (snapshot: SessionSnapshot) => void
}

/**
 * History Browser component for viewing past execution sessions
 *
 * Features:
 * - Lists available dates (up to 7 days)
 * - Shows sessions for selected date
 * - Displays session details (chains, events, timing)
 * - Supports searching within history
 */
export function HistoryBrowser({ backendUrl, onSessionSelect }: HistoryBrowserProps) {
  const [availableDates, setAvailableDates] = useState<string[]>([])
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [sessionIds, setSessionIds] = useState<string[]>([])
  const [selectedSession, setSelectedSession] = useState<SessionSnapshot | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load available dates on mount
  useEffect(() => {
    loadAvailableDates()
  }, [backendUrl])

  // Load sessions when date selected
  useEffect(() => {
    if (selectedDate) {
      loadSessionsForDate(selectedDate)
    }
  }, [selectedDate, backendUrl])

  const loadAvailableDates = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`${backendUrl}/api/history/dates`)
      const data = await response.json()
      setAvailableDates(data.dates || [])

      // Auto-select most recent date
      if (data.dates && data.dates.length > 0) {
        setSelectedDate(data.dates[0])
      }
    } catch (err: any) {
      setError(`Failed to load dates: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const loadSessionsForDate = async (date: string) => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`${backendUrl}/api/history/sessions/${date}`)
      const data = await response.json()
      setSessionIds(data.sessionIds || [])
    } catch (err: any) {
      setError(`Failed to load sessions: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const loadSession = async (sessionId: string, date: string) => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`${backendUrl}/api/history/session/${sessionId}?date=${date}`)
      const snapshot = await response.json()
      setSelectedSession(snapshot)
      onSessionSelect?.(snapshot)
    } catch (err: any) {
      setError(`Failed to load session: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatDuration = (start: string, end?: string): string => {
    if (!end) return 'In progress'
    const duration = new Date(end).getTime() - new Date(start).getTime()
    const seconds = Math.floor(duration / 1000)
    const minutes = Math.floor(seconds / 60)
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`
    }
    return `${seconds}s`
  }

  return (
    <div className="history-browser">
      <div className="history-header">
        <h2>Session History</h2>
        <span className="retention-note">7-day retention</span>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="history-content">
        {/* Date selector */}
        <div className="date-list">
          <h3>Available Dates</h3>
          {loading && availableDates.length === 0 ? (
            <div className="loading">Loading dates...</div>
          ) : availableDates.length === 0 ? (
            <div className="empty-state">No history available</div>
          ) : (
            <ul>
              {availableDates.map((date) => (
                <li
                  key={date}
                  className={selectedDate === date ? 'selected' : ''}
                  onClick={() => setSelectedDate(date)}
                >
                  {formatDate(date)}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Session list */}
        {selectedDate && (
          <div className="session-list">
            <h3>Sessions on {formatDate(selectedDate)}</h3>
            {loading && sessionIds.length === 0 ? (
              <div className="loading">Loading sessions...</div>
            ) : sessionIds.length === 0 ? (
              <div className="empty-state">No sessions on this date</div>
            ) : (
              <ul>
                {sessionIds.map((sessionId) => (
                  <li
                    key={sessionId}
                    className={selectedSession?.session.id === sessionId ? 'selected' : ''}
                    onClick={() => loadSession(sessionId, selectedDate)}
                  >
                    <div className="session-id">{sessionId}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Session details */}
        {selectedSession && (
          <div className="session-details">
            <h3>Session Details</h3>
            <div className="details-grid">
              <div className="detail-item">
                <strong>ID:</strong> {selectedSession.session.id}
              </div>
              <div className="detail-item">
                <strong>Status:</strong> {selectedSession.session.status}
              </div>
              <div className="detail-item">
                <strong>CWD:</strong> {selectedSession.session.cwd}
              </div>
              <div className="detail-item">
                <strong>User:</strong> {selectedSession.session.user || 'Unknown'}
              </div>
              <div className="detail-item">
                <strong>Started:</strong>{' '}
                {new Date(selectedSession.session.startedAt).toLocaleString()}
              </div>
              {selectedSession.session.endedAt && (
                <div className="detail-item">
                  <strong>Ended:</strong>{' '}
                  {new Date(selectedSession.session.endedAt).toLocaleString()}
                </div>
              )}
              <div className="detail-item">
                <strong>Duration:</strong>{' '}
                {formatDuration(
                  selectedSession.session.startedAt,
                  selectedSession.session.endedAt
                )}
              </div>
              <div className="detail-item">
                <strong>Chains:</strong> {selectedSession.session.chains.length}
              </div>
              <div className="detail-item">
                <strong>Events:</strong> {selectedSession.events.length}
              </div>
            </div>

            {selectedSession.session.summary && (
              <div className="session-summary">
                <strong>Summary:</strong>
                <p>{selectedSession.session.summary}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
