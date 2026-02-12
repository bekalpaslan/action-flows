import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { SessionProvider, useSessionContext } from '../SessionContext';
import type { Session, SessionId } from '@afw/shared';

describe('SessionContext', () => {
  const mockSession: Session = {
    id: 'session-123' as SessionId,
    userId: 'user-1' as any,
    createdAt: new Date().toISOString(),
    startedAt: new Date().toISOString(),
    metadata: {},
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    // Mock fetch
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it('should throw error when used outside provider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => useSessionContext());
    }).toThrow('useSessionContext must be used within a SessionProvider');

    consoleSpy.mockRestore();
  });

  it('should initialize with empty sessions', async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({ sessions: [] }),
    };
    (global.fetch as any).mockResolvedValueOnce(mockResponse);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <SessionProvider>{children}</SessionProvider>
    );

    const { result } = renderHook(() => useSessionContext(), { wrapper });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.sessions).toEqual([]);
    expect(result.current.activeSessionId).toBeNull();
  });

  it('should fetch sessions on mount', async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({ sessions: [mockSession] }),
    };
    (global.fetch as any).mockResolvedValueOnce(mockResponse);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <SessionProvider>{children}</SessionProvider>
    );

    renderHook(() => useSessionContext(), { wrapper });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/sessions')
      );
    });
  });

  it('should restore activeSessionId from localStorage', async () => {
    localStorage.setItem('afw-active-session', mockSession.id);

    const mockResponse = {
      ok: true,
      json: async () => ({ sessions: [mockSession] }),
    };
    (global.fetch as any).mockResolvedValueOnce(mockResponse);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <SessionProvider>{children}</SessionProvider>
    );

    const { result } = renderHook(() => useSessionContext(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.activeSessionId).toBe(mockSession.id);
  });

  it('should not restore activeSessionId if session no longer exists', async () => {
    localStorage.setItem('afw-active-session', 'non-existent-session');

    const mockResponse = {
      ok: true,
      json: async () => ({ sessions: [mockSession] }),
    };
    (global.fetch as any).mockResolvedValueOnce(mockResponse);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <SessionProvider>{children}</SessionProvider>
    );

    const { result } = renderHook(() => useSessionContext(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.activeSessionId).toBeNull();
  });

  it('should prune sessions to max 20', async () => {
    const sessions = Array.from({ length: 25 }, (_, i) => ({
      id: `session-${i}` as SessionId,
      userId: 'user-1' as any,
      createdAt: new Date().toISOString(),
      startedAt: new Date(Date.now() - i * 1000).toISOString(),
      metadata: {},
    }));

    const mockResponse = {
      ok: true,
      json: async () => ({ sessions }),
    };
    (global.fetch as any).mockResolvedValueOnce(mockResponse);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <SessionProvider>{children}</SessionProvider>
    );

    const { result } = renderHook(() => useSessionContext(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.sessions.length).toBeLessThanOrEqual(20);
  });

  it('should create new session', async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({ sessions: [] }),
    };
    const newSession: Session = {
      id: 'new-session-456' as SessionId,
      userId: 'user-1' as any,
      createdAt: new Date().toISOString(),
      startedAt: new Date().toISOString(),
      metadata: {},
    };
    const mockCreateResponse = {
      ok: true,
      json: async () => newSession,
    };

    (global.fetch as any)
      .mockResolvedValueOnce(mockResponse)
      .mockResolvedValueOnce(mockCreateResponse);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <SessionProvider>{children}</SessionProvider>
    );

    const { result } = renderHook(() => useSessionContext(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const sessionId = await result.current.createSession();

    await waitFor(() => {
      expect(result.current.sessions).toContainEqual(newSession);
    });

    expect(sessionId).toBe(newSession.id);
    expect(result.current.activeSessionId).toBe(newSession.id);
  });

  it('should set new session as active after creation', async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({ sessions: [] }),
    };
    const newSession: Session = {
      id: 'new-session-456' as SessionId,
      userId: 'user-1' as any,
      createdAt: new Date().toISOString(),
      startedAt: new Date().toISOString(),
      metadata: {},
    };
    const mockCreateResponse = {
      ok: true,
      json: async () => newSession,
    };

    (global.fetch as any)
      .mockResolvedValueOnce(mockResponse)
      .mockResolvedValueOnce(mockCreateResponse);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <SessionProvider>{children}</SessionProvider>
    );

    const { result } = renderHook(() => useSessionContext(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await result.current.createSession();

    await waitFor(() => {
      expect(result.current.activeSessionId).toBe(newSession.id);
    });

    expect(localStorage.getItem('afw-active-session')).toBe(newSession.id);
  });

  it('should delete session', async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({ sessions: [mockSession] }),
    };
    const mockDeleteResponse = {
      ok: true,
      json: async () => ({}),
    };

    (global.fetch as any)
      .mockResolvedValueOnce(mockResponse)
      .mockResolvedValueOnce(mockDeleteResponse);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <SessionProvider>{children}</SessionProvider>
    );

    const { result } = renderHook(() => useSessionContext(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.sessions).toHaveLength(1);
    });

    await result.current.deleteSession(mockSession.id);

    await waitFor(() => {
      expect(result.current.sessions).toHaveLength(0);
    });
  });

  it('should clear activeSessionId when deleted session is active', async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({ sessions: [mockSession] }),
    };
    const mockDeleteResponse = {
      ok: true,
      json: async () => ({}),
    };

    localStorage.setItem('afw-active-session', mockSession.id);

    (global.fetch as any)
      .mockResolvedValueOnce(mockResponse)
      .mockResolvedValueOnce(mockDeleteResponse);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <SessionProvider>{children}</SessionProvider>
    );

    const { result } = renderHook(() => useSessionContext(), { wrapper });

    await waitFor(() => {
      expect(result.current.activeSessionId).toBe(mockSession.id);
    });

    await result.current.deleteSession(mockSession.id);

    await waitFor(() => {
      expect(result.current.activeSessionId).toBeNull();
    });

    expect(localStorage.getItem('afw-active-session')).toBeNull();
  });

  it('should set active session', async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({ sessions: [mockSession] }),
    };
    (global.fetch as any).mockResolvedValueOnce(mockResponse);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <SessionProvider>{children}</SessionProvider>
    );

    const { result } = renderHook(() => useSessionContext(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    result.current.setActiveSession(mockSession.id);

    expect(result.current.activeSessionId).toBe(mockSession.id);
    expect(localStorage.getItem('afw-active-session')).toBe(mockSession.id);
  });

  it('should clear active session', async () => {
    localStorage.setItem('afw-active-session', mockSession.id);

    const mockResponse = {
      ok: true,
      json: async () => ({ sessions: [mockSession] }),
    };
    (global.fetch as any).mockResolvedValueOnce(mockResponse);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <SessionProvider>{children}</SessionProvider>
    );

    const { result } = renderHook(() => useSessionContext(), { wrapper });

    await waitFor(() => {
      expect(result.current.activeSessionId).toBe(mockSession.id);
    });

    result.current.setActiveSession(null);

    expect(result.current.activeSessionId).toBeNull();
    expect(localStorage.getItem('afw-active-session')).toBeNull();
  });

  it('should get session by ID', async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({ sessions: [mockSession] }),
    };
    (global.fetch as any).mockResolvedValueOnce(mockResponse);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <SessionProvider>{children}</SessionProvider>
    );

    const { result } = renderHook(() => useSessionContext(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const session = result.current.getSession(mockSession.id);

    expect(session).toEqual(mockSession);
  });

  it('should return undefined for non-existent session', async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({ sessions: [mockSession] }),
    };
    (global.fetch as any).mockResolvedValueOnce(mockResponse);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <SessionProvider>{children}</SessionProvider>
    );

    const { result } = renderHook(() => useSessionContext(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const session = result.current.getSession('non-existent' as SessionId);

    expect(session).toBeUndefined();
  });

  it('should handle fetch error gracefully', async () => {
    const mockError = new Error('Network error');
    (global.fetch as any).mockRejectedValueOnce(mockError);

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <SessionProvider>{children}</SessionProvider>
    );

    const { result } = renderHook(() => useSessionContext(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.sessions).toEqual([]);
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('should handle create error', async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({ sessions: [] }),
    };
    const mockErrorResponse = {
      ok: false,
      json: async () => ({ message: 'Creation failed' }),
    };

    (global.fetch as any)
      .mockResolvedValueOnce(mockResponse)
      .mockResolvedValueOnce(mockErrorResponse);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <SessionProvider>{children}</SessionProvider>
    );

    const { result } = renderHook(() => useSessionContext(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(result.current.createSession()).rejects.toThrow();

    consoleSpy.mockRestore();
  });

  it('should handle delete error', async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({ sessions: [mockSession] }),
    };
    const mockErrorResponse = {
      ok: false,
      json: async () => ({ message: 'Deletion failed' }),
    };

    (global.fetch as any)
      .mockResolvedValueOnce(mockResponse)
      .mockResolvedValueOnce(mockErrorResponse);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <SessionProvider>{children}</SessionProvider>
    );

    const { result } = renderHook(() => useSessionContext(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(result.current.deleteSession(mockSession.id)).rejects.toThrow();

    consoleSpy.mockRestore();
  });
});
