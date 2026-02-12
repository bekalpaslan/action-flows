/**
 * Mock Providers for Component Tests
 *
 * Provides reusable mock context providers to reduce duplication across
 * component test files. Each provider wraps context setup with sensible defaults.
 */

import React, { ReactNode } from 'react';
import { vi } from 'vitest';
import type { WorkbenchId, SessionId, Session } from '@afw/shared';

// ============================================================================
// WebSocketContext Mock Provider
// ============================================================================

export const MockWebSocketProvider: React.FC<{
  children: ReactNode;
  status?: 'connected' | 'disconnected' | 'connecting';
  send?: (message: any) => void;
  onEvent?: ((event: any) => void) | null;
}> = ({
  children,
  status = 'connected',
  send = vi.fn(),
  onEvent = null,
}) => {
  vi.doMock('../../contexts/WebSocketContext', () => ({
    useWebSocketContext: () => ({
      status,
      send,
      onEvent,
    }),
  }));
  return <>{children}</>;
};

// ============================================================================
// WorkbenchContext Mock Provider
// ============================================================================

export const MockWorkbenchProvider: React.FC<{
  children: ReactNode;
  activeWorkbench?: WorkbenchId;
  setActiveWorkbench?: (id: WorkbenchId) => void;
  workbenchNotifications?: Map<string, number>;
}> = ({
  children,
  activeWorkbench = 'work' as WorkbenchId,
  setActiveWorkbench = vi.fn(),
  workbenchNotifications = new Map([
    ['work', 0],
    ['maintenance', 0],
    ['explore', 0],
    ['review', 0],
    ['pm', 0],
    ['archive', 0],
  ]),
}) => {
  vi.doMock('../../contexts/WorkbenchContext', () => ({
    useWorkbenchContext: () => ({
      activeWorkbench,
      setActiveWorkbench,
      workbenchNotifications,
    }),
  }));
  return <>{children}</>;
};

// ============================================================================
// UniverseContext Mock Provider
// ============================================================================

export const MockUniverseProvider: React.FC<{
  children: ReactNode;
  universe?: any;
  isLoading?: boolean;
  error?: Error | null;
  zoomTargetRegionId?: string | null;
  clearZoomTarget?: () => void;
  navigateToRegion?: (regionId: string) => void;
  isRegionAccessible?: (regionId: string) => boolean;
}> = ({
  children,
  universe = { regions: [], bridges: [], gates: [] },
  isLoading = false,
  error = null,
  zoomTargetRegionId = null,
  clearZoomTarget = vi.fn(),
  navigateToRegion = vi.fn(),
  isRegionAccessible = vi.fn((regionId) => true),
}) => {
  vi.doMock('../../contexts/UniverseContext', () => ({
    useUniverseContext: () => ({
      universe,
      isLoading,
      error,
      zoomTargetRegionId,
      clearZoomTarget,
      navigateToRegion,
      isRegionAccessible,
    }),
  }));
  return <>{children}</>;
};

// ============================================================================
// SessionContext Mock Provider
// ============================================================================

export const MockSessionProvider: React.FC<{
  children: ReactNode;
  sessions?: Session[];
  activeSessionId?: SessionId;
  setActiveSession?: (id: SessionId) => void;
}> = ({
  children,
  sessions = [],
  activeSessionId = 'session-123' as SessionId,
  setActiveSession = vi.fn(),
}) => {
  vi.doMock('../../contexts/SessionContext', () => ({
    useSessionContext: () => ({
      sessions,
      activeSessionId,
      setActiveSession,
    }),
  }));
  return <>{children}</>;
};

// ============================================================================
// DiscussContext Mock Provider
// ============================================================================

export const MockDiscussProvider: React.FC<{
  children: ReactNode;
  sessionId?: SessionId;
  model?: string;
}> = ({
  children,
  sessionId = 'session-test' as SessionId,
  model = 'claude-3-sonnet',
}) => {
  vi.doMock('../../contexts/DiscussContext', () => ({
    useDiscussContext: () => ({
      sessionId,
      model,
    }),
  }));
  return <>{children}</>;
};

// ============================================================================
// DiscoveryContext Mock Provider
// ============================================================================

export const MockDiscoveryProvider: React.FC<{
  children: ReactNode;
  discoveryProgress?: Record<string, unknown>;
}> = ({
  children,
  discoveryProgress = {},
}) => {
  vi.doMock('../../contexts/DiscoveryContext', () => ({
    useDiscoveryContext: () => ({
      discoveryProgress,
    }),
  }));
  return <>{children}</>;
};

// ============================================================================
// Feature Flag Mock Provider
// ============================================================================

export const MockFeatureFlagProvider: React.FC<{
  children: ReactNode;
  flagMap?: Record<string, boolean>;
}> = ({
  children,
  flagMap = {
    COMMAND_CENTER_ENABLED: true,
    SPARK_ANIMATION_ENABLED: true,
  },
}) => {
  vi.doMock('../../hooks/useFeatureFlag', () => ({
    useFeatureFlagSimple: (flag: string) => flagMap[flag] ?? false,
  }));
  return <>{children}</>;
};
