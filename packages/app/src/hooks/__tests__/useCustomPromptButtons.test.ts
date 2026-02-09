import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useCustomPromptButtons } from '../useCustomPromptButtons';
import type { ProjectId, WorkspaceEvent, RegistryChangedEvent, ButtonId } from '@afw/shared';
import { brandedTypes } from '@afw/shared';

// Mock WebSocket context
const mockWebSocketContext = {
  status: 'connected' as const,
  error: null,
  send: vi.fn(),
  subscribe: vi.fn(),
  unsubscribe: vi.fn(),
  onEvent: vi.fn((callback: (event: WorkspaceEvent) => void) => {
    // Store callback for later invocation
    mockEventCallback = callback;
    return vi.fn(); // unsubscribe function
  }),
};

let mockEventCallback: ((event: WorkspaceEvent) => void) | null = null;

vi.mock('../../contexts/WebSocketContext', () => ({
  useWebSocketContext: () => mockWebSocketContext,
}));

// Mock fetch
global.fetch = vi.fn();

describe('useCustomPromptButtons', () => {
  const testProjectId = 'test-project-123' as ProjectId;

  beforeEach(() => {
    vi.clearAllMocks();
    mockEventCallback = null;
    (global.fetch as any).mockReset();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('convertPatternsToContexts', () => {
    // We'll test this indirectly through the hook behavior
    // by checking the contexts in returned ButtonDefinitions

    it('should return general context when no patterns provided', async () => {
      const mockResponse = {
        ok: true,
        json: async () => [
          {
            id: 'entry-1' as ButtonId,
            type: 'custom-prompt',
            enabled: true,
            source: 'user',
            data: {
              definition: {
                label: 'Test Button',
                prompt: 'Test prompt',
                icon: '🧪',
                contextPatterns: undefined, // No patterns
              },
            },
          },
        ],
      };
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useCustomPromptButtons(testProjectId));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.buttons).toHaveLength(1);
      expect(result.current.buttons[0].contexts).toEqual(['general']);
    });

    it('should map code file patterns to code-change and file-modification contexts', async () => {
      const mockResponse = {
        ok: true,
        json: async () => [
          {
            id: 'entry-2' as ButtonId,
            type: 'custom-prompt',
            enabled: true,
            source: 'user',
            data: {
              definition: {
                label: 'Code Review',
                prompt: 'Review this code',
                contextPatterns: ['.*\\.ts$', 'src/.*\\.tsx$'],
              },
            },
          },
        ],
      };
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useCustomPromptButtons(testProjectId));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.buttons).toHaveLength(1);
      expect(result.current.buttons[0].contexts).toContain('code-change');
      expect(result.current.buttons[0].contexts).toContain('file-modification');
    });

    it('should map error patterns to error-message context', async () => {
      const mockResponse = {
        ok: true,
        json: async () => [
          {
            id: 'entry-3' as ButtonId,
            type: 'custom-prompt',
            enabled: true,
            source: 'user',
            data: {
              definition: {
                label: 'Debug Error',
                prompt: 'Help debug this error',
                contextPatterns: ['.*error.*', '.*bug.*'],
              },
            },
          },
        ],
      };
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useCustomPromptButtons(testProjectId));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.buttons).toHaveLength(1);
      expect(result.current.buttons[0].contexts).toContain('error-message');
    });

    it('should map analysis patterns to analysis-report context', async () => {
      const mockResponse = {
        ok: true,
        json: async () => [
          {
            id: 'entry-4' as ButtonId,
            type: 'custom-prompt',
            enabled: true,
            source: 'user',
            data: {
              definition: {
                label: 'Review Analysis',
                prompt: 'Analyze this report',
                contextPatterns: ['.*analysis.*', '.*report.*'],
              },
            },
          },
        ],
      };
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useCustomPromptButtons(testProjectId));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.buttons).toHaveLength(1);
      expect(result.current.buttons[0].contexts).toContain('analysis-report');
    });

    it('should map documentation patterns to file-modification context', async () => {
      const mockResponse = {
        ok: true,
        json: async () => [
          {
            id: 'entry-5' as ButtonId,
            type: 'custom-prompt',
            enabled: true,
            source: 'user',
            data: {
              definition: {
                label: 'Update Docs',
                prompt: 'Update documentation',
                contextPatterns: ['.*\\.md$', '.*readme.*'],
              },
            },
          },
        ],
      };
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useCustomPromptButtons(testProjectId));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.buttons).toHaveLength(1);
      expect(result.current.buttons[0].contexts).toContain('file-modification');
    });

    it('should combine multiple contexts from mixed patterns', async () => {
      const mockResponse = {
        ok: true,
        json: async () => [
          {
            id: 'entry-6' as ButtonId,
            type: 'custom-prompt',
            enabled: true,
            source: 'user',
            data: {
              definition: {
                label: 'Multi-Context',
                prompt: 'Handle multiple contexts',
                contextPatterns: ['.*\\.ts$', '.*error.*', '.*analysis.*'],
              },
            },
          },
        ],
      };
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useCustomPromptButtons(testProjectId));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.buttons).toHaveLength(1);
      // Should have code-change, file-modification, error-message, and analysis-report
      expect(result.current.buttons[0].contexts.length).toBeGreaterThan(1);
      expect(result.current.buttons[0].contexts).toContain('code-change');
      expect(result.current.buttons[0].contexts).toContain('error-message');
      expect(result.current.buttons[0].contexts).toContain('analysis-report');
    });

    it('should return general context when patterns do not match any category', async () => {
      const mockResponse = {
        ok: true,
        json: async () => [
          {
            id: 'entry-7' as ButtonId,
            type: 'custom-prompt',
            enabled: true,
            source: 'user',
            data: {
              definition: {
                label: 'Unknown Pattern',
                prompt: 'Handle unknown',
                contextPatterns: ['.*\\.xyz$', '.*randompattern.*'],
              },
            },
          },
        ],
      };
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useCustomPromptButtons(testProjectId));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.buttons).toHaveLength(1);
      expect(result.current.buttons[0].contexts).toEqual(['general']);
    });
  });

  describe('fetchCustomPrompts', () => {
    it('should fetch and convert custom prompt entries successfully', async () => {
      const mockEntries = [
        {
          id: 'button-1' as ButtonId,
          type: 'custom-prompt',
          enabled: true,
          source: 'user',
          data: {
            definition: {
              label: 'Quick Fix',
              prompt: 'Fix this issue quickly',
              icon: '🔧',
              contextPatterns: ['.*\\.ts$'],
              alwaysShow: false,
            },
          },
        },
        {
          id: 'button-2' as ButtonId,
          type: 'custom-prompt',
          enabled: true,
          source: 'generated',
          data: {
            definition: {
              label: 'Analyze',
              prompt: 'Analyze this code',
              icon: '📊',
              contextPatterns: ['.*analysis.*'],
              alwaysShow: true,
            },
          },
        },
      ];

      const mockResponse = {
        ok: true,
        json: async () => mockEntries,
      };
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useCustomPromptButtons(testProjectId));

      // Initially loading
      expect(result.current.isLoading).toBe(true);
      expect(result.current.buttons).toEqual([]);
      expect(result.current.error).toBeNull();

      // Wait for fetch to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Verify buttons were converted correctly
      expect(result.current.buttons).toHaveLength(2);
      expect(result.current.error).toBeNull();

      const button1 = result.current.buttons[0];
      expect(button1.id).toBe('button-1');
      expect(button1.label).toBe('Quick Fix');
      expect(button1.icon).toBe('🔧');
      expect(button1.action.type).toBe('quick-action');
      expect(button1.action.payload?.value).toBe('Fix this issue quickly');
      expect(button1.action.payload?.alwaysShow).toBe(false);
      expect(button1.source).toBe('user');
      expect(button1.priority).toBe(100);
      expect(button1.enabled).toBe(true);

      const button2 = result.current.buttons[1];
      expect(button2.id).toBe('button-2');
      expect(button2.label).toBe('Analyze');
      expect(button2.icon).toBe('📊');
      expect(button2.action.payload?.alwaysShow).toBe(true);
    });

    it('should set default icon when not provided', async () => {
      const mockResponse = {
        ok: true,
        json: async () => [
          {
            id: 'button-no-icon' as ButtonId,
            type: 'custom-prompt',
            enabled: true,
            source: 'user',
            data: {
              definition: {
                label: 'No Icon',
                prompt: 'Test prompt',
              },
            },
          },
        ],
      };
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useCustomPromptButtons(testProjectId));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.buttons[0].icon).toBe('💬');
    });

    it('should filter out entries without definition', async () => {
      const mockResponse = {
        ok: true,
        json: async () => [
          {
            id: 'button-1' as ButtonId,
            type: 'custom-prompt',
            enabled: true,
            source: 'user',
            data: {
              definition: {
                label: 'Valid',
                prompt: 'Valid prompt',
              },
            },
          },
          {
            id: 'button-2' as ButtonId,
            type: 'custom-prompt',
            enabled: true,
            source: 'user',
            data: {}, // Missing definition
          },
          {
            id: 'button-3' as ButtonId,
            type: 'custom-prompt',
            enabled: true,
            source: 'user',
            // Missing data entirely
          },
        ],
      };
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useCustomPromptButtons(testProjectId));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Only the valid entry should be included
      expect(result.current.buttons).toHaveLength(1);
      expect(result.current.buttons[0].id).toBe('button-1');
    });

    it('should filter out entries with wrong type', async () => {
      const mockResponse = {
        ok: true,
        json: async () => [
          {
            id: 'button-1' as ButtonId,
            type: 'custom-prompt',
            enabled: true,
            source: 'user',
            data: {
              definition: {
                label: 'Valid',
                prompt: 'Valid prompt',
              },
            },
          },
          {
            id: 'button-2' as ButtonId,
            type: 'button', // Wrong type
            enabled: true,
            source: 'user',
            data: {
              definition: {
                label: 'Wrong Type',
                prompt: 'Should be filtered',
              },
            },
          },
        ],
      };
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useCustomPromptButtons(testProjectId));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.buttons).toHaveLength(1);
      expect(result.current.buttons[0].id).toBe('button-1');
    });

    it('should handle fetch errors gracefully', async () => {
      const mockError = new Error('Network error');
      (global.fetch as any).mockRejectedValueOnce(mockError);

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() => useCustomPromptButtons(testProjectId));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.buttons).toEqual([]);
      expect(result.current.error).toEqual(mockError);
      expect(consoleSpy).toHaveBeenCalledWith(
        '[useCustomPromptButtons] Failed to fetch:',
        mockError
      );

      consoleSpy.mockRestore();
    });

    it('should handle HTTP error responses', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
      };
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() => useCustomPromptButtons(testProjectId));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.buttons).toEqual([]);
      expect(result.current.error).toBeTruthy();
      expect(result.current.error?.message).toContain('Failed to fetch custom prompts: 500');

      consoleSpy.mockRestore();
    });

    it('should return empty array when projectId is not provided', async () => {
      const { result } = renderHook(() => useCustomPromptButtons(undefined));

      // Should not be loading and should have empty buttons
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.buttons).toEqual([]);
      expect(result.current.error).toBeNull();
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should build correct API URL with query parameters', async () => {
      const mockResponse = {
        ok: true,
        json: async () => [],
      };
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      renderHook(() => useCustomPromptButtons(testProjectId));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });

      const fetchCall = (global.fetch as any).mock.calls[0][0];
      expect(fetchCall).toContain('/api/registry/entries');
      expect(fetchCall).toContain('type=custom-prompt');
      expect(fetchCall).toContain('enabled=true');
      expect(fetchCall).toContain(`projectId=${testProjectId}`);
    });
  });

  describe('WebSocket subscription', () => {
    it('should subscribe to WebSocket events on mount', async () => {
      const mockResponse = {
        ok: true,
        json: async () => [],
      };
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useCustomPromptButtons(testProjectId));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should have registered an event callback
      expect(mockWebSocketContext.onEvent).toHaveBeenCalled();
    });

    it('should refetch when registry:changed event is received', async () => {
      const mockResponse1 = {
        ok: true,
        json: async () => [
          {
            id: 'button-1' as ButtonId,
            type: 'custom-prompt',
            enabled: true,
            source: 'user',
            data: {
              definition: {
                label: 'Initial',
                prompt: 'Initial prompt',
              },
            },
          },
        ],
      };

      const mockResponse2 = {
        ok: true,
        json: async () => [
          {
            id: 'button-1' as ButtonId,
            type: 'custom-prompt',
            enabled: true,
            source: 'user',
            data: {
              definition: {
                label: 'Updated',
                prompt: 'Updated prompt',
              },
            },
          },
          {
            id: 'button-2' as ButtonId,
            type: 'custom-prompt',
            enabled: true,
            source: 'user',
            data: {
              definition: {
                label: 'New Button',
                prompt: 'New prompt',
              },
            },
          },
        ],
      };

      (global.fetch as any)
        .mockResolvedValueOnce(mockResponse1)
        .mockResolvedValueOnce(mockResponse2);

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const { result } = renderHook(() => useCustomPromptButtons(testProjectId));

      // Wait for initial fetch
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.buttons).toHaveLength(1);
      expect(result.current.buttons[0].label).toBe('Initial');

      // Trigger registry:changed event
      const registryEvent: RegistryChangedEvent = {
        type: 'registry:changed',
        timestamp: new Date().toISOString() as any,
        changeType: 'added',
        entryId: 'button-2' as any,
        entryType: 'custom-prompt',
      };

      if (mockEventCallback) {
        mockEventCallback(registryEvent);
      }

      // Wait for refetch
      await waitFor(() => {
        expect(result.current.buttons).toHaveLength(2);
      });

      expect(result.current.buttons[0].label).toBe('Updated');
      expect(result.current.buttons[1].label).toBe('New Button');

      expect(consoleSpy).toHaveBeenCalledWith(
        '[useCustomPromptButtons] Registry changed, refetching custom prompts'
      );

      consoleSpy.mockRestore();
    });

    it('should not refetch on non-registry events', async () => {
      const mockResponse = {
        ok: true,
        json: async () => [],
      };
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useCustomPromptButtons(testProjectId));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Clear the mock to track new calls
      (global.fetch as any).mockClear();

      // Trigger a different event type
      const otherEvent: WorkspaceEvent = {
        type: 'session:started',
        timestamp: new Date().toISOString() as any,
        sessionId: 'test-session' as any,
        userId: 'test-user' as any,
      };

      if (mockEventCallback) {
        mockEventCallback(otherEvent);
      }

      // Wait a bit to ensure no fetch is triggered
      await new Promise(resolve => setTimeout(resolve, 100));

      // Should not have called fetch again
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should unsubscribe from WebSocket events on unmount', async () => {
      const mockResponse = {
        ok: true,
        json: async () => [],
      };
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      const mockUnsubscribe = vi.fn();
      mockWebSocketContext.onEvent.mockReturnValueOnce(mockUnsubscribe);

      const { unmount } = renderHook(() => useCustomPromptButtons(testProjectId));

      await waitFor(() => {
        expect(mockWebSocketContext.onEvent).toHaveBeenCalled();
      });

      unmount();

      expect(mockUnsubscribe).toHaveBeenCalled();
    });
  });

  describe('refetch function', () => {
    it('should allow manual refetch', async () => {
      const mockResponse1 = {
        ok: true,
        json: async () => [
          {
            id: 'button-1' as ButtonId,
            type: 'custom-prompt',
            enabled: true,
            source: 'user',
            data: {
              definition: {
                label: 'Initial',
                prompt: 'Initial prompt',
              },
            },
          },
        ],
      };

      const mockResponse2 = {
        ok: true,
        json: async () => [
          {
            id: 'button-2' as ButtonId,
            type: 'custom-prompt',
            enabled: true,
            source: 'user',
            data: {
              definition: {
                label: 'Refetched',
                prompt: 'Refetched prompt',
              },
            },
          },
        ],
      };

      (global.fetch as any)
        .mockResolvedValueOnce(mockResponse1)
        .mockResolvedValueOnce(mockResponse2);

      const { result } = renderHook(() => useCustomPromptButtons(testProjectId));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.buttons).toHaveLength(1);
      expect(result.current.buttons[0].label).toBe('Initial');

      // Manually trigger refetch
      await result.current.refetch();

      await waitFor(() => {
        expect(result.current.buttons).toHaveLength(1);
        expect(result.current.buttons[0].label).toBe('Refetched');
      });
    });

    it('should clear previous error on successful refetch', async () => {
      const mockError = new Error('Initial error');
      const mockResponse = {
        ok: true,
        json: async () => [
          {
            id: 'button-1' as ButtonId,
            type: 'custom-prompt',
            enabled: true,
            source: 'user',
            data: {
              definition: {
                label: 'Success',
                prompt: 'Success prompt',
              },
            },
          },
        ],
      };

      (global.fetch as any)
        .mockRejectedValueOnce(mockError)
        .mockResolvedValueOnce(mockResponse);

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() => useCustomPromptButtons(testProjectId));

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });

      expect(result.current.error).toEqual(mockError);
      expect(result.current.buttons).toEqual([]);

      // Refetch
      await result.current.refetch();

      await waitFor(() => {
        expect(result.current.error).toBeNull();
      });

      expect(result.current.buttons).toHaveLength(1);
      expect(result.current.buttons[0].label).toBe('Success');

      consoleSpy.mockRestore();
    });
  });

  describe('projectId changes', () => {
    it('should refetch when projectId changes', async () => {
      const mockResponse1 = {
        ok: true,
        json: async () => [
          {
            id: 'button-1' as ButtonId,
            type: 'custom-prompt',
            enabled: true,
            source: 'user',
            data: {
              definition: {
                label: 'Project 1',
                prompt: 'Project 1 prompt',
              },
            },
          },
        ],
      };

      const mockResponse2 = {
        ok: true,
        json: async () => [
          {
            id: 'button-2' as ButtonId,
            type: 'custom-prompt',
            enabled: true,
            source: 'user',
            data: {
              definition: {
                label: 'Project 2',
                prompt: 'Project 2 prompt',
              },
            },
          },
        ],
      };

      (global.fetch as any)
        .mockResolvedValueOnce(mockResponse1)
        .mockResolvedValueOnce(mockResponse2);

      const { result, rerender } = renderHook(
        ({ projectId }) => useCustomPromptButtons(projectId),
        {
          initialProps: { projectId: 'project-1' as ProjectId },
        }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.buttons).toHaveLength(1);
      expect(result.current.buttons[0].label).toBe('Project 1');

      // Change projectId
      rerender({ projectId: 'project-2' as ProjectId });

      await waitFor(() => {
        expect(result.current.buttons).toHaveLength(1);
        expect(result.current.buttons[0].label).toBe('Project 2');
      });
    });

    it('should clear buttons when projectId becomes undefined', async () => {
      const mockResponse = {
        ok: true,
        json: async () => [
          {
            id: 'button-1' as ButtonId,
            type: 'custom-prompt',
            enabled: true,
            source: 'user',
            data: {
              definition: {
                label: 'Project 1',
                prompt: 'Project 1 prompt',
              },
            },
          },
        ],
      };

      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      const { result, rerender } = renderHook(
        ({ projectId }) => useCustomPromptButtons(projectId),
        {
          initialProps: { projectId: testProjectId },
        }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.buttons).toHaveLength(1);

      // Clear projectId
      rerender({ projectId: undefined });

      await waitFor(() => {
        expect(result.current.buttons).toEqual([]);
      });
    });
  });
});
