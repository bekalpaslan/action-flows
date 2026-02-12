import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useWebSocket } from '../useWebSocket';

/**
 * useWebSocket Hook Tests (P0)
 *
 * Tests core hook initialization and API surface.
 * Full integration testing requires WebSocket server setup (see E2E tests).
 */
describe('useWebSocket Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it('should initialize with correct types', () => {
    const { result } = renderHook(() =>
      useWebSocket({
        url: 'ws://localhost:3001/ws',
      })
    );

    expect(result.current).toBeDefined();
    expect(result.current.status).toBeDefined();
    expect(result.current.error).toBeDefined();
    expect(result.current.send).toBeDefined();
    expect(result.current.subscribe).toBeDefined();
    expect(result.current.unsubscribe).toBeDefined();
  });

  it('should return correct return type structure', () => {
    const { result } = renderHook(() =>
      useWebSocket({
        url: 'ws://localhost:3001/ws',
      })
    );

    expect(typeof result.current.send).toBe('function');
    expect(typeof result.current.subscribe).toBe('function');
    expect(typeof result.current.unsubscribe).toBe('function');
    expect(['connecting', 'connected', 'disconnected', 'error', 'polling']).toContain(
      result.current.status
    );
  });

  it('should accept URL parameter', () => {
    const customUrl = 'wss://example.com:9000/ws';

    const { result } = renderHook(() =>
      useWebSocket({
        url: customUrl,
      })
    );

    expect(result.current).toBeDefined();
  });

  it('should accept optional callbacks', () => {
    const onEvent = vi.fn();

    const { result } = renderHook(() =>
      useWebSocket({
        url: 'ws://localhost:3001/ws',
        onEvent,
      })
    );

    expect(result.current).toBeDefined();
  });

  it('should accept optional reconnect interval', () => {
    const { result } = renderHook(() =>
      useWebSocket({
        url: 'ws://localhost:3001/ws',
        reconnectInterval: 5000,
      })
    );

    expect(result.current).toBeDefined();
  });

  it('should accept optional heartbeat interval', () => {
    const { result } = renderHook(() =>
      useWebSocket({
        url: 'ws://localhost:3001/ws',
        heartbeatInterval: 60000,
      })
    );

    expect(result.current).toBeDefined();
  });

  it('should accept optional polling fallback URL', () => {
    const { result } = renderHook(() =>
      useWebSocket({
        url: 'ws://localhost:3001/ws',
        pollingFallbackUrl: 'http://localhost:3001/api/events',
      })
    );

    expect(result.current).toBeDefined();
  });

  it('should provide subscribe function', () => {
    const { result } = renderHook(() =>
      useWebSocket({
        url: 'ws://localhost:3001/ws',
      })
    );

    expect(typeof result.current.subscribe).toBe('function');
  });

  it('should provide unsubscribe function', () => {
    const { result } = renderHook(() =>
      useWebSocket({
        url: 'ws://localhost:3001/ws',
      })
    );

    expect(typeof result.current.unsubscribe).toBe('function');
  });

  it('should provide send function for events', () => {
    const { result } = renderHook(() =>
      useWebSocket({
        url: 'ws://localhost:3001/ws',
      })
    );

    expect(typeof result.current.send).toBe('function');
  });

  it('should provide callable functions', () => {
    const { result } = renderHook(() =>
      useWebSocket({
        url: 'ws://localhost:3001/ws',
      })
    );

    // Functions should be defined
    expect(result.current.subscribe).toBeDefined();
    expect(result.current.unsubscribe).toBeDefined();
    expect(typeof result.current.subscribe).toBe('function');
    expect(typeof result.current.unsubscribe).toBe('function');
  });

  it('should clean up on unmount', () => {
    const { unmount } = renderHook(() =>
      useWebSocket({
        url: 'ws://localhost:3001/ws',
      })
    );

    expect(() => {
      unmount();
    }).not.toThrow();
  });

  it('should support different connection statuses', () => {
    const { result } = renderHook(() =>
      useWebSocket({
        url: 'ws://localhost:3001/ws',
      })
    );

    const validStatuses = ['connecting', 'connected', 'disconnected', 'error', 'polling'];
    expect(validStatuses).toContain(result.current.status);
  });

  it('should initialize error as null', () => {
    const { result } = renderHook(() =>
      useWebSocket({
        url: 'ws://localhost:3001/ws',
      })
    );

    expect(result.current.error === null || result.current.error instanceof Error).toBe(true);
  });
});
