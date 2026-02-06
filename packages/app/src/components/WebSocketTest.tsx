/**
 * WebSocket Test Component
 *
 * This component demonstrates all WebSocket features and can be used
 * for manual testing of the real-time event system.
 *
 * Usage:
 * - Add to a test route in your app
 * - Create a test session and pass the sessionId
 * - Observe real-time event updates and connection status
 */

import { useState, useCallback } from 'react';
import { useWebSocketContext } from '../contexts/WebSocketContext';
import { useEvents, useLatestEvent, useEventStats } from '../hooks';
import type { SessionId, WorkspaceEvent } from '@afw/shared';
import { brandedTypes } from '@afw/shared';

export function WebSocketTest() {
  // Create a test session ID
  const testSessionId = brandedTypes.sessionId('test-session-' + Date.now()) as SessionId;

  const { status, error, send, subscribe, unsubscribe } = useWebSocketContext();
  const events = useEvents(testSessionId);
  const latestChainEvent = useLatestEvent(testSessionId, 'chain:completed');
  const stats = useEventStats(testSessionId);

  const [customMessage, setCustomMessage] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState('');

  // Filter events if filter is set
  const filteredEvents = eventTypeFilter
    ? events.filter((e) => e.type.includes(eventTypeFilter))
    : events;

  // Send custom message
  const handleSendMessage = useCallback(() => {
    if (customMessage.trim()) {
      send({
        type: 'test',
        message: customMessage,
        timestamp: new Date().toISOString(),
      });
      setCustomMessage('');
    }
  }, [customMessage, send]);

  // Manual subscribe/unsubscribe for testing
  const handleSubscribe = useCallback(() => {
    subscribe(testSessionId);
  }, [testSessionId, subscribe]);

  const handleUnsubscribe = useCallback(() => {
    unsubscribe(testSessionId);
  }, [testSessionId, unsubscribe]);

  const getStatusColor = (s: string): string => {
    switch (s) {
      case 'connected':
        return '#4caf50';
      case 'disconnected':
        return '#ff9800';
      case 'error':
        return '#f44336';
      case 'connecting':
      default:
        return '#2196f3';
    }
  };

  return (
    <div style={styles.container}>
      <h2>WebSocket Test Panel</h2>

      {/* Connection Status Section */}
      <section style={styles.section}>
        <h3>Connection Status</h3>
        <div style={styles.statusBox}>
          <div style={styles.statusRow}>
            <span>Status:</span>
            <span
              style={{
                ...styles.statusBadge,
                backgroundColor: getStatusColor(status),
              }}
            >
              {status}
            </span>
          </div>
          {error && (
            <div style={styles.statusRow}>
              <span>Error:</span>
              <span style={styles.errorText}>{error.message}</span>
            </div>
          )}
          <div style={styles.buttonGroup}>
            <button onClick={handleSubscribe} style={styles.button}>
              Subscribe Test Session
            </button>
            <button onClick={handleUnsubscribe} style={styles.button}>
              Unsubscribe Test Session
            </button>
          </div>
        </div>
      </section>

      {/* Send Message Section */}
      <section style={styles.section}>
        <h3>Send Test Message</h3>
        <div style={styles.inputGroup}>
          <input
            type="text"
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Enter test message..."
            style={styles.input}
          />
          <button onClick={handleSendMessage} style={styles.button}>
            Send
          </button>
        </div>
      </section>

      {/* Event Statistics Section */}
      <section style={styles.section}>
        <h3>Event Statistics</h3>
        <div style={styles.statsBox}>
          <div>Total Events: <strong>{stats.total}</strong></div>
          <div>
            Last Event:{' '}
            <strong>
              {stats.lastEventTime ? new Date(stats.lastEventTime).toLocaleTimeString() : 'None'}
            </strong>
          </div>
          <div style={styles.eventTypeList}>
            <div><strong>By Type:</strong></div>
            {Object.entries(stats.byType).length === 0 ? (
              <div style={styles.emptyState}>No events yet</div>
            ) : (
              <ul style={styles.list}>
                {Object.entries(stats.byType).map(([type, count]) => (
                  <li key={type}>
                    {type}: <strong>{count}</strong>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      {/* Latest Event Section */}
      {latestChainEvent && (
        <section style={styles.section}>
          <h3>Latest Chain Event</h3>
          <pre style={styles.eventPreview}>
            {JSON.stringify(latestChainEvent, null, 2)}
          </pre>
        </section>
      )}

      {/* Event Filter Section */}
      <section style={styles.section}>
        <h3>Event Filter</h3>
        <input
          type="text"
          value={eventTypeFilter}
          onChange={(e) => setEventTypeFilter(e.target.value)}
          placeholder="Filter by event type (e.g., 'chain', 'step')..."
          style={styles.input}
        />
        <p style={styles.hint}>
          Showing {filteredEvents.length} of {events.length} events
        </p>
      </section>

      {/* Events List Section */}
      <section style={styles.section}>
        <h3>Events ({filteredEvents.length})</h3>
        <div style={styles.eventsList}>
          {filteredEvents.length === 0 ? (
            <div style={styles.emptyState}>
              No events received yet. Subscribe to start receiving events.
            </div>
          ) : (
            <ul style={styles.list}>
              {filteredEvents.map((event: WorkspaceEvent, index) => (
                <li
                  key={event.eventId || `${event.timestamp}-${index}`}
                  style={styles.eventItem}
                >
                  <strong>{event.type}</strong> - {event.timestamp}
                  {event.user && <span> (User: {event.user})</span>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Test Session ID Section */}
      <section style={styles.section}>
        <h3>Test Session ID</h3>
        <code style={styles.code}>{testSessionId}</code>
      </section>
    </div>
  );
}

const styles = {
  container: {
    padding: '2rem',
    backgroundColor: '#1a1a1a',
    color: '#e0e0e0',
    fontFamily: 'monospace',
    maxWidth: '1200px',
    margin: '0 auto',
  } as const,
  section: {
    marginBottom: '2rem',
    padding: '1rem',
    backgroundColor: '#242424',
    border: '1px solid #404040',
    borderRadius: '8px',
  } as const,
  statusBox: {
    padding: '1rem',
    backgroundColor: '#1a1a1a',
    borderRadius: '4px',
  } as const,
  statusRow: {
    display: 'flex' as const,
    justifyContent: 'space-between',
    marginBottom: '0.5rem',
    alignItems: 'center',
  } as const,
  statusBadge: {
    padding: '0.25rem 0.75rem',
    borderRadius: '4px',
    color: '#fff',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    fontSize: '0.75rem',
  } as const,
  errorText: {
    color: '#f44336',
  } as const,
  buttonGroup: {
    display: 'flex' as const,
    gap: '0.5rem',
    marginTop: '1rem',
  } as const,
  button: {
    padding: '0.5rem 1rem',
    backgroundColor: '#2196f3',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.875rem',
  } as const,
  inputGroup: {
    display: 'flex' as const,
    gap: '0.5rem',
  } as const,
  input: {
    flex: 1,
    padding: '0.5rem',
    backgroundColor: '#1a1a1a',
    border: '1px solid #404040',
    borderRadius: '4px',
    color: '#e0e0e0',
    fontFamily: 'monospace',
  } as const,
  statsBox: {
    padding: '1rem',
    backgroundColor: '#1a1a1a',
    borderRadius: '4px',
  } as const,
  eventTypeList: {
    marginTop: '1rem',
  } as const,
  list: {
    listStyle: 'none',
    padding: '0',
    margin: '0.5rem 0 0 0',
  } as const,
  eventItem: {
    padding: '0.5rem',
    marginBottom: '0.25rem',
    backgroundColor: '#1a1a1a',
    borderLeft: '3px solid #2196f3',
    fontSize: '0.875rem',
  } as const,
  eventsList: {
    maxHeight: '400px',
    overflowY: 'auto' as const,
    backgroundColor: '#1a1a1a',
    borderRadius: '4px',
    padding: '1rem',
  } as const,
  emptyState: {
    padding: '2rem',
    textAlign: 'center' as const,
    color: '#808080',
    fontStyle: 'italic',
  } as const,
  code: {
    display: 'block',
    padding: '0.5rem',
    backgroundColor: '#1a1a1a',
    border: '1px solid #404040',
    borderRadius: '4px',
    wordBreak: 'break-all' as const,
    fontSize: '0.875rem',
  } as const,
  eventPreview: {
    padding: '1rem',
    backgroundColor: '#1a1a1a',
    border: '1px solid #404040',
    borderRadius: '4px',
    overflow: 'auto',
    maxHeight: '300px',
    fontSize: '0.75rem',
    lineHeight: '1.4',
    margin: '0',
  } as const,
  hint: {
    fontSize: '0.875rem',
    color: '#808080',
    marginTop: '0.5rem',
  } as const,
};
