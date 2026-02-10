import { useEffect, useRef, useState, useCallback } from 'react';
import type { WorkspaceEvent, SessionId } from '@afw/shared';

export interface UseWebSocketOptions {
  url: string;
  onEvent?: (event: WorkspaceEvent) => void;
  reconnectInterval?: number; // default 3000ms
  heartbeatInterval?: number; // default 30000ms
}

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export interface UseWebSocketReturn {
  status: ConnectionStatus;
  send: (message: WorkspaceEvent) => void;
  subscribe: (sessionId: SessionId) => void;
  unsubscribe: (sessionId: SessionId) => void;
  error: Error | null;
}

/**
 * React hook for WebSocket real-time event streaming
 *
 * Features:
 * - Auto-reconnect with exponential backoff
 * - Connection status tracking
 * - Session subscription/unsubscription
 * - Heartbeat for stale connection detection
 * - Type-safe event parsing
 */
export function useWebSocket(options: UseWebSocketOptions): UseWebSocketReturn {
  const {
    url,
    onEvent,
    reconnectInterval = 3000,
    heartbeatInterval = 30000,
  } = options;

  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const [error, setError] = useState<Error | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const subscribedSessionsRef = useRef<Set<SessionId>>(new Set());
  const reconnectAttemptsRef = useRef(0);
  const intentionalCloseRef = useRef(false);

  // Keep onEvent in a ref so handleMessage never changes identity.
  // This prevents connect → useEffect cascade from reconnect storms.
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  // Parse and dispatch incoming events — stable identity (empty deps)
  const handleMessage = useCallback(
    (event: MessageEvent) => {
      try {
        let data = JSON.parse(event.data);

        // Handle non-event messages (connection confirmations, pong, errors)
        if (data.type === 'subscription_confirmed' || data.type === 'pong' || data.type === 'error') {
          if (data.type === 'error') {
            console.warn('[WS] Server error:', data.payload);
          }
          return;
        }

        // Handle registry events (system-level, no sessionId required)
        if (data.type === 'registry-event' && data.payload) {
          onEventRef.current?.(data.payload as WorkspaceEvent);
          return;
        }

        // Unwrap broadcast wrapper: { type: 'event', sessionId, payload: <actual event> }
        if (data.type === 'event' && data.payload) {
          data = data.payload;
        }

        // Validate required fields for workspace events
        if (!data.type || !data.sessionId || !data.timestamp) {
          console.warn('Invalid event structure received:', data);
          return;
        }

        // Session lifecycle events bypass subscription check (needed for global session list)
        const isSessionLifecycleEvent = data.type.startsWith('session:');

        // Process if it's a session lifecycle event OR if client is subscribed to this session
        if (isSessionLifecycleEvent || subscribedSessionsRef.current.has(data.sessionId)) {
          onEventRef.current?.(data as WorkspaceEvent);
        }
      } catch (err) {
        const parseError = err instanceof Error ? err : new Error('Failed to parse WebSocket message');
        console.error('Failed to parse WebSocket message:', parseError);
        setError(parseError);
      }
    },
    []
  );

  // Reset heartbeat timer
  const resetHeartbeat = useCallback(() => {
    if (heartbeatTimeoutRef.current) {
      clearTimeout(heartbeatTimeoutRef.current);
    }
    heartbeatTimeoutRef.current = setTimeout(() => {
      console.warn('WebSocket heartbeat timeout - connection may be stale');
      if (wsRef.current) {
        wsRef.current.close();
      }
    }, heartbeatInterval);
  }, [heartbeatInterval]);

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      setStatus('connecting');
      setError(null);

      const ws = new WebSocket(url);

      ws.addEventListener('open', () => {
        console.log('WebSocket connected');
        wsRef.current = ws;
        setStatus('connected');
        setError(null);
        reconnectAttemptsRef.current = 0;
        resetHeartbeat();

        // Send subscribe messages for all currently subscribed sessions
        subscribedSessionsRef.current.forEach((sessionId) => {
          ws.send(
            JSON.stringify({
              type: 'subscribe',
              sessionId,
            })
          );
        });

        // Start periodic ping (every 25 seconds)
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
        }
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 25000);
      });

      ws.addEventListener('message', (event) => {
        resetHeartbeat();
        handleMessage(event);
      });

      ws.addEventListener('error', (event) => {
        console.error('WebSocket error:', event);
        setStatus('error');
        setError(new Error('WebSocket connection error'));
      });

      ws.addEventListener('close', () => {
        console.log('WebSocket disconnected');
        wsRef.current = null;
        setStatus('disconnected');

        // Stop ping interval
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }

        // Only auto-reconnect for unexpected closes (not effect cleanup)
        if (!intentionalCloseRef.current) {
          const delay = Math.min(
            reconnectInterval * Math.pow(2, reconnectAttemptsRef.current),
            30000 // Max 30 second delay
          );
          reconnectAttemptsRef.current += 1;

          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        }
      });

      wsRef.current = ws;
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err : new Error('Failed to connect'));
      console.error('WebSocket connection error:', err);
    }
  }, [url, reconnectInterval, handleMessage, resetHeartbeat]);

  // Subscribe to session events
  const subscribe = useCallback(
    (sessionId: SessionId) => {
      subscribedSessionsRef.current.add(sessionId);

      // If already connected, send subscribe message
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'subscribe',
            sessionId,
          })
        );
      }
    },
    []
  );

  // Unsubscribe from session events
  const unsubscribe = useCallback(
    (sessionId: SessionId) => {
      subscribedSessionsRef.current.delete(sessionId);

      // If connected, send unsubscribe message
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'unsubscribe',
            sessionId,
          })
        );
      }
    },
    []
  );

  // Send custom message
  const send = useCallback((message: WorkspaceEvent) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected');
    }
  }, []);

  // Effect: Initialize connection and cleanup
  useEffect(() => {
    intentionalCloseRef.current = false;
    connect();

    return () => {
      intentionalCloseRef.current = true;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (heartbeatTimeoutRef.current) {
        clearTimeout(heartbeatTimeoutRef.current);
      }
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  return {
    status,
    send,
    subscribe,
    unsubscribe,
    error,
  };
}
