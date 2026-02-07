import { createContext, useContext, useRef, useCallback, type ReactNode } from 'react';
import { useWebSocket, type ConnectionStatus } from '../hooks/useWebSocket';
import type { WorkspaceEvent, SessionId } from '@afw/shared';

interface WebSocketContextType {
  status: ConnectionStatus;
  error: Error | null;
  send: (message: WorkspaceEvent) => void;
  subscribe: (sessionId: SessionId) => void;
  unsubscribe: (sessionId: SessionId) => void;
  onEvent: ((callback: (event: WorkspaceEvent) => void) => () => void) | null;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

interface WebSocketProviderProps {
  children: ReactNode;
  url?: string;
}

/**
 * WebSocket provider component for real-time event streaming
 *
 * Wraps the useWebSocket hook and provides context for child components
 * Default URL: ws://localhost:3001/ws
 */
export function WebSocketProvider({
  children,
  url = 'ws://localhost:3001/ws',
}: WebSocketProviderProps) {
  // Store multiple event callbacks
  const eventCallbacksRef = useRef<Set<(event: WorkspaceEvent) => void>>(new Set());

  const handleEvent = useCallback((event: WorkspaceEvent) => {
    eventCallbacksRef.current.forEach(callback => callback(event));
  }, []);

  const { status, error, send, subscribe, unsubscribe } = useWebSocket({
    url,
    onEvent: handleEvent,
    reconnectInterval: 3000,
    heartbeatInterval: 30000,
  });

  const registerEventCallback = useCallback(
    (callback: (event: WorkspaceEvent) => void) => {
      eventCallbacksRef.current.add(callback);

      // Return unregister function
      return () => {
        eventCallbacksRef.current.delete(callback);
      };
    },
    []
  );

  const value: WebSocketContextType = {
    status,
    error,
    send,
    subscribe,
    unsubscribe,
    onEvent: registerEventCallback,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}

/**
 * Hook to access WebSocket context
 * Must be used within WebSocketProvider
 */
export function useWebSocketContext(): WebSocketContextType {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocketContext must be used within WebSocketProvider');
  }
  return context;
}
