import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useChatMessages } from '../useChatMessages';
import type { SessionId } from '@afw/shared';

// Mock WebSocketContext
let mockEventCallback: ((event: any) => void) | null = null;

const mockWebSocketContext = {
  status: 'connected' as const,
  error: null,
  send: vi.fn(),
  subscribe: vi.fn(),
  unsubscribe: vi.fn(),
  onEvent: vi.fn((callback: (event: any) => void) => {
    mockEventCallback = callback;
    return vi.fn();
  }),
};

vi.mock('../../contexts/WebSocketContext', () => ({
  useWebSocketContext: () => mockWebSocketContext,
}));

/**
 * useChatMessages Hook Tests (P0)
 *
 * Tests core hook initialization and message state management.
 * Full integration testing with WebSocket server is covered by E2E tests.
 */
describe('useChatMessages Hook', () => {
  const testSessionId = 'test-session-123' as SessionId;

  beforeEach(() => {
    vi.clearAllMocks();
    mockEventCallback = null;
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it('should initialize with empty messages', () => {
    const { result } = renderHook(() => useChatMessages(testSessionId));

    expect(result.current.messages).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should return correct hook structure', () => {
    const { result } = renderHook(() => useChatMessages(testSessionId));

    expect(result.current).toBeDefined();
    expect(Array.isArray(result.current.messages)).toBe(true);
    expect(typeof result.current.isLoading).toBe('boolean');
    expect(result.current.error === null || result.current.error instanceof Error).toBe(true);
  });

  it('should provide addUserMessage function', () => {
    const { result } = renderHook(() => useChatMessages(testSessionId));

    expect(typeof result.current.addUserMessage).toBe('function');
  });

  it('should provide clearMessages function', () => {
    const { result } = renderHook(() => useChatMessages(testSessionId));

    expect(typeof result.current.clearMessages).toBe('function');
  });

  it('should subscribe to WebSocket on mount', () => {
    renderHook(() => useChatMessages(testSessionId));

    expect(mockWebSocketContext.subscribe).toHaveBeenCalledWith(testSessionId);
  });

  it('should unsubscribe from WebSocket on unmount', () => {
    const { unmount } = renderHook(() => useChatMessages(testSessionId));

    unmount();

    expect(mockWebSocketContext.unsubscribe).toHaveBeenCalledWith(testSessionId);
  });

  it('should add user message locally', () => {
    const { result } = renderHook(() => useChatMessages(testSessionId));

    result.current.addUserMessage('Test message');

    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0].role).toBe('user');
    expect(result.current.messages[0].content).toBe('Test message');
  });

  it('should clear messages', () => {
    const { result } = renderHook(() => useChatMessages(testSessionId));

    result.current.addUserMessage('Test message');
    expect(result.current.messages).toHaveLength(1);

    result.current.clearMessages();
    expect(result.current.messages).toHaveLength(0);
  });

  it('should handle user messages', () => {
    const { result } = renderHook(() => useChatMessages(testSessionId));

    result.current.addUserMessage('Hello');
    result.current.addUserMessage('World');

    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[0].content).toBe('Hello');
    expect(result.current.messages[1].content).toBe('World');
  });

  it('should generate unique message IDs', () => {
    const { result } = renderHook(() => useChatMessages(testSessionId));

    result.current.addUserMessage('Message 1');
    result.current.addUserMessage('Message 2');

    expect(result.current.messages[0].id).not.toBe(result.current.messages[1].id);
  });

  it('should preserve message timestamps', () => {
    const { result } = renderHook(() => useChatMessages(testSessionId));

    const beforeTimestamp = new Date().toISOString();
    result.current.addUserMessage('Test');
    const afterTimestamp = new Date().toISOString();

    const msg = result.current.messages[0];
    expect(msg.timestamp).toBeDefined();
    expect(msg.timestamp >= beforeTimestamp).toBe(true);
    expect(msg.timestamp <= afterTimestamp).toBe(true);
  });

  it('should clear messages when session changes', () => {
    const { result, rerender } = renderHook(
      ({ sessionId }) => useChatMessages(sessionId),
      { initialProps: { sessionId: testSessionId } }
    );

    result.current.addUserMessage('Test');
    expect(result.current.messages).toHaveLength(1);

    const newSessionId = 'new-session' as SessionId;
    rerender({ sessionId: newSessionId });

    expect(result.current.messages).toHaveLength(0);
  });

  it('should handle register/unregister event callbacks', () => {
    renderHook(() => useChatMessages(testSessionId));

    expect(mockWebSocketContext.onEvent).toHaveBeenCalled();
  });

  it('should not throw on unmount without errors', () => {
    const { unmount } = renderHook(() => useChatMessages(testSessionId));

    expect(() => {
      unmount();
    }).not.toThrow();
  });

  it('should not throw when adding empty messages', () => {
    const { result } = renderHook(() => useChatMessages(testSessionId));

    expect(() => {
      result.current.addUserMessage('');
    }).not.toThrow();

    expect(result.current.messages).toHaveLength(1);
  });

  it('should maintain message order', () => {
    const { result } = renderHook(() => useChatMessages(testSessionId));

    result.current.addUserMessage('First');
    result.current.addUserMessage('Second');
    result.current.addUserMessage('Third');

    expect(result.current.messages[0].content).toBe('First');
    expect(result.current.messages[1].content).toBe('Second');
    expect(result.current.messages[2].content).toBe('Third');
  });

  it('should have message type properties', () => {
    const { result } = renderHook(() => useChatMessages(testSessionId));

    result.current.addUserMessage('Test');

    const msg = result.current.messages[0];
    expect(msg.id).toBeDefined();
    expect(msg.role).toBeDefined();
    expect(msg.content).toBeDefined();
    expect(msg.timestamp).toBeDefined();
  });
});
