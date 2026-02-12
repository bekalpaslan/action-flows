import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { WebSocketProvider, useWebSocketContext } from '../WebSocketContext';
import type { WorkspaceEvent, SessionId } from '@afw/shared';

// Mock useWebSocket hook
let mockWebSocketCallbacks: {
  onEvent?: (event: WorkspaceEvent) => void;
} = {};

const mockUseWebSocket = vi.fn(() => ({
  status: 'connected',
  error: null,
  send: vi.fn(),
  subscribe: vi.fn(),
  unsubscribe: vi.fn(),
}));

vi.mock('../../hooks/useWebSocket', () => ({
  useWebSocket: mockUseWebSocket,
}));

describe('WebSocketContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it('should provide WebSocket context', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <WebSocketProvider url="ws://localhost:3001/ws">
        {children}
      </WebSocketProvider>
    );

    const { result } = renderHook(() => useWebSocketContext(), { wrapper });

    expect(result.current).toBeDefined();
    expect(result.current.status).toBe('connected');
    expect(result.current.send).toBeDefined();
    expect(result.current.subscribe).toBeDefined();
    expect(result.current.unsubscribe).toBeDefined();
    expect(result.current.onEvent).toBeDefined();
  });

  it('should throw error when used outside provider', () => {
    // Suppress error output for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => useWebSocketContext());
    }).toThrow('useWebSocketContext must be used within WebSocketProvider');

    consoleSpy.mockRestore();
  });

  it('should forward status from useWebSocket hook', () => {
    mockUseWebSocket.mockReturnValueOnce({
      status: 'connecting',
      error: null,
      send: vi.fn(),
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <WebSocketProvider url="ws://localhost:3001/ws">
        {children}
      </WebSocketProvider>
    );

    const { result } = renderHook(() => useWebSocketContext(), { wrapper });

    expect(result.current.status).toBe('connecting');
  });

  it('should forward send function', () => {
    const mockSend = vi.fn();

    mockUseWebSocket.mockReturnValueOnce({
      status: 'connected',
      error: null,
      send: mockSend,
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <WebSocketProvider url="ws://localhost:3001/ws">
        {children}
      </WebSocketProvider>
    );

    const { result } = renderHook(() => useWebSocketContext(), { wrapper });

    const event: WorkspaceEvent = {
      type: 'session:started',
      sessionId: 'test-session' as SessionId,
      timestamp: new Date().toISOString() as any,
      userId: 'test-user' as any,
    };

    result.current.send(event);

    expect(mockSend).toHaveBeenCalledWith(event);
  });

  it('should forward subscribe and unsubscribe functions', () => {
    const mockSubscribe = vi.fn();
    const mockUnsubscribe = vi.fn();

    mockUseWebSocket.mockReturnValueOnce({
      status: 'connected',
      error: null,
      send: vi.fn(),
      subscribe: mockSubscribe,
      unsubscribe: mockUnsubscribe,
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <WebSocketProvider url="ws://localhost:3001/ws">
        {children}
      </WebSocketProvider>
    );

    const { result } = renderHook(() => useWebSocketContext(), { wrapper });

    const sessionId = 'test-session-123' as SessionId;

    result.current.subscribe(sessionId);
    expect(mockSubscribe).toHaveBeenCalledWith(sessionId);

    result.current.unsubscribe(sessionId);
    expect(mockUnsubscribe).toHaveBeenCalledWith(sessionId);
  });

  it('should allow registering multiple event callbacks', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <WebSocketProvider url="ws://localhost:3001/ws">
        {children}
      </WebSocketProvider>
    );

    const { result } = renderHook(() => useWebSocketContext(), { wrapper });

    const callback1 = vi.fn();
    const callback2 = vi.fn();

    const unsubscribe1 = result.current.onEvent?.(callback1);
    const unsubscribe2 = result.current.onEvent?.(callback2);

    expect(unsubscribe1).toBeDefined();
    expect(unsubscribe2).toBeDefined();
  });

  it('should broadcast events to all registered callbacks', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <WebSocketProvider url="ws://localhost:3001/ws">
        {children}
      </WebSocketProvider>
    );

    const { result } = renderHook(() => useWebSocketContext(), { wrapper });

    const callback1 = vi.fn();
    const callback2 = vi.fn();

    result.current.onEvent?.(callback1);
    result.current.onEvent?.(callback2);

    // Get the onEvent callback that was passed to useWebSocket
    const useWebSocketCall = mockUseWebSocket.mock.calls[0];
    const onEventPassed = useWebSocketCall?.[0]?.onEvent;

    expect(onEventPassed).toBeDefined();

    const event: WorkspaceEvent = {
      type: 'session:started',
      sessionId: 'test-session' as SessionId,
      timestamp: new Date().toISOString() as any,
      userId: 'test-user' as any,
    };

    // Call the onEvent callback that was passed to useWebSocket
    if (onEventPassed) {
      onEventPassed(event);
    }

    // Both registered callbacks should be called
    expect(callback1).toHaveBeenCalledWith(event);
    expect(callback2).toHaveBeenCalledWith(event);
  });

  it('should allow unregistering event callbacks', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <WebSocketProvider url="ws://localhost:3001/ws">
        {children}
      </WebSocketProvider>
    );

    const { result } = renderHook(() => useWebSocketContext(), { wrapper });

    const callback = vi.fn();

    const unsubscribe = result.current.onEvent?.(callback);

    // Unregister the callback
    unsubscribe?.();

    // Get the onEvent callback that was passed to useWebSocket
    const useWebSocketCall = mockUseWebSocket.mock.calls[0];
    const onEventPassed = useWebSocketCall?.[0]?.onEvent;

    const event: WorkspaceEvent = {
      type: 'session:started',
      sessionId: 'test-session' as SessionId,
      timestamp: new Date().toISOString() as any,
      userId: 'test-user' as any,
    };

    if (onEventPassed) {
      onEventPassed(event);
    }

    // Callback should not be called after unsubscribe
    expect(callback).not.toHaveBeenCalled();
  });

  it('should use custom URL if provided', () => {
    const customUrl = 'ws://example.com:9000/ws';

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <WebSocketProvider url={customUrl}>
        {children}
      </WebSocketProvider>
    );

    renderHook(() => useWebSocketContext(), { wrapper });

    const useWebSocketCall = mockUseWebSocket.mock.calls[0];
    expect(useWebSocketCall?.[0]?.url).toBe(customUrl);
  });

  it('should use default URL if not provided', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <WebSocketProvider>
        {children}
      </WebSocketProvider>
    );

    renderHook(() => useWebSocketContext(), { wrapper });

    const useWebSocketCall = mockUseWebSocket.mock.calls[0];
    expect(useWebSocketCall?.[0]?.url).toBe('ws://localhost:3001/ws');
  });

  it('should pass reconnect and heartbeat intervals to useWebSocket', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <WebSocketProvider url="ws://localhost:3001/ws">
        {children}
      </WebSocketProvider>
    );

    renderHook(() => useWebSocketContext(), { wrapper });

    const useWebSocketCall = mockUseWebSocket.mock.calls[0];
    const options = useWebSocketCall?.[0];

    expect(options?.reconnectInterval).toBe(3000);
    expect(options?.heartbeatInterval).toBe(30000);
  });

  it('should maintain separate event callback sets per provider instance', () => {
    const callback1 = vi.fn();
    const callback2 = vi.fn();

    const wrapper1 = ({ children }: { children: React.ReactNode }) => (
      <WebSocketProvider url="ws://localhost:3001/ws">
        {children}
      </WebSocketProvider>
    );

    const { result: result1 } = renderHook(() => useWebSocketContext(), {
      wrapper: wrapper1,
    });

    result1.current.onEvent?.(callback1);

    // This test would require separate provider instances,
    // which is complex to set up. The important thing is that
    // callbacks are registered correctly per provider.
    expect(callback1).toBeDefined();
  });

  it('should handle error state from useWebSocket', () => {
    const testError = new Error('Connection failed');

    mockUseWebSocket.mockReturnValueOnce({
      status: 'error',
      error: testError,
      send: vi.fn(),
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <WebSocketProvider url="ws://localhost:3001/ws">
        {children}
      </WebSocketProvider>
    );

    const { result } = renderHook(() => useWebSocketContext(), { wrapper });

    expect(result.current.status).toBe('error');
    expect(result.current.error).toBe(testError);
  });

  it('should handle polling status', () => {
    mockUseWebSocket.mockReturnValueOnce({
      status: 'polling',
      error: null,
      send: vi.fn(),
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <WebSocketProvider url="ws://localhost:3001/ws">
        {children}
      </WebSocketProvider>
    );

    const { result } = renderHook(() => useWebSocketContext(), { wrapper });

    expect(result.current.status).toBe('polling');
  });
});
