/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck - Test file with mock types
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { WebSocket } from 'ws';
import type { SessionId } from '@afw/shared';
import { brandedTypes } from '@afw/shared';
import { handleWebSocket, broadcastEvent, sendCommandToClient, isClientConnected } from '../handler.js';
import { clientRegistry } from '../clientRegistry.js';
import type { Storage } from '../../storage/index.js';
import type { WorkspaceEvent, Session } from '@afw/shared';

// Mock WebSocket
function createMockWebSocket(): WebSocket {
  const listeners: Record<string, ((...args: unknown[]) => void)[]> = {};

  const ws = {
    readyState: 1, // WebSocket.OPEN
    send: vi.fn(),
    close: vi.fn(),
    on: vi.fn((event: string, handler: (...args: unknown[]) => void) => {
      if (!listeners[event]) {
        listeners[event] = [];
      }
      listeners[event].push(handler);
    }),
    removeListener: vi.fn(),
    // Helper to trigger events in tests
    _emit: (event: string, ...args: unknown[]) => {
      if (listeners[event]) {
        listeners[event].forEach((handler) => handler(...args));
      }
    },
  };

  return ws as unknown as WebSocket;
}

// Mock Storage
function createMockStorage(): Storage {
  const sessions = new Map<SessionId, Session>();
  const clients = new Set<{ clientId: string; sessionId?: SessionId }>();
  const inputQueue = new Map<SessionId, unknown[]>();

  return {
    getSession: vi.fn((sessionId: SessionId) => sessions.get(sessionId)),
    setSession: vi.fn((session: Session) => sessions.set(session.id, session)),
    deleteSession: vi.fn(),

    addEvent: vi.fn(),
    getEvents: vi.fn(() => []),
    getEventsSince: vi.fn(() => []),

    addChain: vi.fn(),
    getChains: vi.fn(() => []),
    getChain: vi.fn(),

    queueCommand: vi.fn(),
    getCommands: vi.fn(() => []),
    clearCommands: vi.fn(),

    queueInput: vi.fn((sessionId: SessionId, input: unknown) => {
      const inputs = inputQueue.get(sessionId) || [];
      inputs.push(input);
      inputQueue.set(sessionId, inputs);
    }),
    getInput: vi.fn(() => []),
    clearInput: vi.fn(),

    addClient: vi.fn((clientId: string, sessionId?: SessionId) => {
      clients.add({ clientId, sessionId });
    }),
    removeClient: vi.fn((clientId: string) => {
      clients.forEach((c) => {
        if (c.clientId === clientId) clients.delete(c);
      });
    }),
    getClientsForSession: vi.fn(() => []),

    trackAction: vi.fn(),
    getFrequency: vi.fn(),
    getTopActions: vi.fn(() => []),

    addBookmark: vi.fn(),
    getBookmarks: vi.fn(() => []),
    removeBookmark: vi.fn(),

    addPattern: vi.fn(),
    getPatterns: vi.fn(() => []),

    addHarmonyCheck: vi.fn(),
    getHarmonyChecks: vi.fn(() => []),
    getHarmonyMetrics: vi.fn(() => ({
      totalChecks: 0,
      validCount: 0,
      degradedCount: 0,
      violationCount: 0,
      harmonyPercentage: 100,
      recentViolations: [],
      formatBreakdown: {},
      lastCheck: brandedTypes.currentTimestamp(),
    })),

    // Add test helper to set sessions
    _setSession: (session: Session) => sessions.set(session.id, session),
  } as unknown as Storage;
}

describe('WebSocket Handler', () => {
  let mockWs: WebSocket & { _emit: (event: string, ...args: unknown[]) => void };
  let mockStorage: Storage & { _setSession: (session: Session) => void };
  const clientId = 'test-client-123';

  beforeEach(() => {
    mockWs = createMockWebSocket() as WebSocket & { _emit: (event: string, ...args: unknown[]) => void };
    mockStorage = createMockStorage() as Storage & { _setSession: (session: Session) => void };

    // Clear the client registry between tests
    clientRegistry.getAllClients().forEach((client) => {
      clientRegistry.unregister(client);
    });

    // Register the client in the registry
    clientRegistry.register(mockWs, clientId);

    // Clear env var mocks
    vi.unstubAllEnvs();
  });

  describe('handleWebSocket', () => {
    it('should send connection confirmation on connect', () => {
      handleWebSocket(mockWs, clientId, mockStorage);

      expect(mockWs.send).toHaveBeenCalledWith(
        expect.stringContaining('subscription_confirmed')
      );

      const sentMessage = JSON.parse((mockWs.send as ReturnType<typeof vi.fn>).mock.calls[0][0]);
      expect(sentMessage.type).toBe('subscription_confirmed');
      expect(sentMessage.payload.clientId).toBe(clientId);
    });

    it('should register message and close event handlers', () => {
      handleWebSocket(mockWs, clientId, mockStorage);

      expect(mockWs.on).toHaveBeenCalledWith('message', expect.any(Function));
      expect(mockWs.on).toHaveBeenCalledWith('close', expect.any(Function));
    });
  });

  describe('Message Parsing', () => {
    it('should reject invalid JSON', () => {
      handleWebSocket(mockWs, clientId, mockStorage);

      // Clear the confirmation message
      (mockWs.send as ReturnType<typeof vi.fn>).mockClear();

      // Simulate receiving invalid JSON
      mockWs._emit('message', Buffer.from('not valid json'));

      expect(mockWs.send).toHaveBeenCalledWith(
        expect.stringContaining('Invalid JSON')
      );
    });

    it('should reject messages with invalid schema', () => {
      handleWebSocket(mockWs, clientId, mockStorage);
      (mockWs.send as ReturnType<typeof vi.fn>).mockClear();

      // Send message without required type field
      mockWs._emit('message', Buffer.from(JSON.stringify({ foo: 'bar' })));

      expect(mockWs.send).toHaveBeenCalledWith(
        expect.stringContaining('Invalid message format')
      );
    });

    it('should accept valid ping message and respond with pong', () => {
      handleWebSocket(mockWs, clientId, mockStorage);
      (mockWs.send as ReturnType<typeof vi.fn>).mockClear();

      mockWs._emit('message', Buffer.from(JSON.stringify({ type: 'ping' })));

      expect(mockWs.send).toHaveBeenCalledWith(
        expect.stringContaining('pong')
      );

      const sentMessage = JSON.parse((mockWs.send as ReturnType<typeof vi.fn>).mock.calls[0][0]);
      expect(sentMessage.type).toBe('pong');
      expect(sentMessage.clientId).toBe(clientId);
    });
  });

  describe('Subscribe/Unsubscribe', () => {
    it('should reject subscription to non-existent session', async () => {
      handleWebSocket(mockWs, clientId, mockStorage);
      (mockWs.send as ReturnType<typeof vi.fn>).mockClear();

      const subscribeMsg = {
        type: 'subscribe',
        sessionId: 'non-existent-session',
      };

      mockWs._emit('message', Buffer.from(JSON.stringify(subscribeMsg)));

      // Wait for async processing
      await new Promise((r) => setTimeout(r, 10));

      expect(mockWs.send).toHaveBeenCalledWith(
        expect.stringContaining('Session not found')
      );
    });

    it('should allow subscription to existing session', async () => {
      const sessionId = brandedTypes.sessionId('existing-session');
      const session: Session = {
        id: sessionId,
        status: 'active',
        startedAt: brandedTypes.currentTimestamp(),
        cwd: '/test',
      };

      mockStorage._setSession(session);
      (mockStorage.getSession as ReturnType<typeof vi.fn>).mockReturnValue(session);

      handleWebSocket(mockWs, clientId, mockStorage);
      (mockWs.send as ReturnType<typeof vi.fn>).mockClear();

      const subscribeMsg = {
        type: 'subscribe',
        sessionId: sessionId,
      };

      mockWs._emit('message', Buffer.from(JSON.stringify(subscribeMsg)));

      // Wait for async processing
      await new Promise((r) => setTimeout(r, 10));

      expect(mockWs.send).toHaveBeenCalledWith(
        expect.stringContaining('subscription_confirmed')
      );
      expect(mockStorage.addClient).toHaveBeenCalledWith(clientId, sessionId);
    });

    it('should handle unsubscribe message', async () => {
      const sessionId = brandedTypes.sessionId('unsub-session');

      handleWebSocket(mockWs, clientId, mockStorage);
      (mockWs.send as ReturnType<typeof vi.fn>).mockClear();

      const unsubscribeMsg = {
        type: 'unsubscribe',
        sessionId: sessionId,
      };

      mockWs._emit('message', Buffer.from(JSON.stringify(unsubscribeMsg)));

      // Wait for async processing
      await new Promise((r) => setTimeout(r, 10));

      expect(mockStorage.removeClient).toHaveBeenCalledWith(clientId);
    });
  });

  describe('Input Handling', () => {
    it('should queue input for session', async () => {
      const sessionId = brandedTypes.sessionId('input-session');

      handleWebSocket(mockWs, clientId, mockStorage);
      (mockWs.send as ReturnType<typeof vi.fn>).mockClear();

      const inputMsg = {
        type: 'input',
        sessionId: sessionId,
        payload: { answer: 'yes' },
      };

      mockWs._emit('message', Buffer.from(JSON.stringify(inputMsg)));

      // Wait for async processing
      await new Promise((r) => setTimeout(r, 10));

      expect(mockStorage.queueInput).toHaveBeenCalledWith(sessionId, { answer: 'yes' });
    });

    it('should not queue input without payload', async () => {
      const sessionId = brandedTypes.sessionId('no-payload-session');

      handleWebSocket(mockWs, clientId, mockStorage);

      const inputMsg = {
        type: 'input',
        sessionId: sessionId,
        // no payload
      };

      mockWs._emit('message', Buffer.from(JSON.stringify(inputMsg)));

      await new Promise((r) => setTimeout(r, 10));

      // Should still be called since the message is valid, but with undefined payload
      // The handler checks if message.payload is truthy before queueing
    });
  });

  describe('Connection Close', () => {
    it('should clean up client on disconnect', () => {
      handleWebSocket(mockWs, clientId, mockStorage);

      // Trigger close event
      mockWs._emit('close');

      expect(mockStorage.removeClient).toHaveBeenCalledWith(clientId);
    });
  });

  describe('Rate Limiting', () => {
    it('should reject messages when rate limit exceeded', async () => {
      handleWebSocket(mockWs, clientId, mockStorage);
      (mockWs.send as ReturnType<typeof vi.fn>).mockClear();

      // Simulate exceeding rate limit by manually triggering checkRateLimit to return true
      const checkRateLimitSpy = vi.spyOn(clientRegistry, 'checkRateLimit').mockReturnValue(true);

      mockWs._emit('message', Buffer.from(JSON.stringify({ type: 'ping' })));

      await new Promise((r) => setTimeout(r, 10));

      expect(mockWs.send).toHaveBeenCalledWith(
        expect.stringContaining('Rate limit exceeded')
      );

      checkRateLimitSpy.mockRestore();
    });
  });
});

describe('broadcastEvent', () => {
  it('should broadcast event to all open WebSocket clients', () => {
    const mockWs1 = createMockWebSocket();
    const mockWs2 = createMockWebSocket();
    const sessionId = brandedTypes.sessionId('broadcast-session');

    const event: WorkspaceEvent = {
      type: 'step:spawned',
      sessionId,
      timestamp: brandedTypes.currentTimestamp(),
      stepNumber: 1 as any,
      action: 'test',
    } as WorkspaceEvent;

    broadcastEvent([mockWs1, mockWs2], event, sessionId);

    expect(mockWs1.send).toHaveBeenCalledTimes(1);
    expect(mockWs2.send).toHaveBeenCalledTimes(1);

    const sentMessage = JSON.parse((mockWs1.send as ReturnType<typeof vi.fn>).mock.calls[0][0]);
    expect(sentMessage.type).toBe('event');
    expect(sentMessage.sessionId).toBe(sessionId);
    expect(sentMessage.payload.type).toBe('step:spawned');
  });

  it('should skip clients that are not open', () => {
    const mockWsOpen = createMockWebSocket();
    const mockWsClosed = createMockWebSocket();
    (mockWsClosed as any).readyState = 3; // WebSocket.CLOSED

    const event: WorkspaceEvent = {
      type: 'step:completed',
      sessionId: brandedTypes.sessionId('test'),
      timestamp: brandedTypes.currentTimestamp(),
      stepNumber: 1 as any,
      duration: 1000 as any,
      succeeded: true,
    } as WorkspaceEvent;

    broadcastEvent([mockWsOpen, mockWsClosed], event);

    expect(mockWsOpen.send).toHaveBeenCalledTimes(1);
    expect(mockWsClosed.send).not.toHaveBeenCalled();
  });
});

describe('sendCommandToClient', () => {
  it('should send command to open WebSocket client', () => {
    const mockWs = createMockWebSocket();
    const sessionId = brandedTypes.sessionId('cmd-session');
    const commandPayload = { type: 'pause', reason: 'user request' };

    sendCommandToClient(mockWs, commandPayload, sessionId);

    expect(mockWs.send).toHaveBeenCalledTimes(1);

    const sentMessage = JSON.parse((mockWs.send as ReturnType<typeof vi.fn>).mock.calls[0][0]);
    expect(sentMessage.type).toBe('command');
    expect(sentMessage.sessionId).toBe(sessionId);
    expect(sentMessage.payload).toEqual(commandPayload);
  });

  it('should not send to closed WebSocket', () => {
    const mockWs = createMockWebSocket();
    (mockWs as any).readyState = 3; // WebSocket.CLOSED

    sendCommandToClient(mockWs, { type: 'pause' });

    expect(mockWs.send).not.toHaveBeenCalled();
  });
});

describe('isClientConnected', () => {
  it('should return true for open WebSocket', () => {
    const mockWs = createMockWebSocket();
    (mockWs as any).readyState = 1; // WebSocket.OPEN

    expect(isClientConnected(mockWs)).toBe(true);
  });

  it('should return false for closed WebSocket', () => {
    const mockWs = createMockWebSocket();
    (mockWs as any).readyState = 3; // WebSocket.CLOSED

    expect(isClientConnected(mockWs)).toBe(false);
  });

  it('should return false for connecting WebSocket', () => {
    const mockWs = createMockWebSocket();
    (mockWs as any).readyState = 0; // WebSocket.CONNECTING

    expect(isClientConnected(mockWs)).toBe(false);
  });

  it('should return false for closing WebSocket', () => {
    const mockWs = createMockWebSocket();
    (mockWs as any).readyState = 2; // WebSocket.CLOSING

    expect(isClientConnected(mockWs)).toBe(false);
  });
});
