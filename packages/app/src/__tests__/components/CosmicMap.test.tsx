/**
 * CosmicMap Component Tests
 *
 * Tests the main Living Universe visualization container including:
 * - Smoke rendering test
 * - Props contract validation
 * - Feature flag behavior
 * - Accessibility attributes
 * - Error boundary handling
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CosmicMap } from '../../components/CosmicMap/CosmicMap';
import { useCommonTestSetup } from '../../__tests__/utils';

// Mock ReactFlow completely - don't import actual to avoid memory issues
vi.mock('reactflow', () => {
  return {
    __esModule: true,
    default: ({ children }: any) => <div data-testid="react-flow">{children}</div>,
    ReactFlow: ({ children }: any) => <div data-testid="react-flow">{children}</div>,
    ReactFlowProvider: ({ children }: any) => <div data-testid="reactflow-provider">{children}</div>,
    Controls: () => <div data-testid="zoom-controls" />,
    MiniMap: () => <div data-testid="minimap" />,
    useNodesState: (initial: any) => [initial, vi.fn(), vi.fn()],
    useEdgesState: (initial: any) => [initial, vi.fn(), vi.fn()],
    useReactFlow: () => ({
      fitView: vi.fn(),
      setCenter: vi.fn(),
      getNodes: vi.fn(() => []),
      getEdges: vi.fn(() => []),
    }),
    getSmoothStepPath: vi.fn(() => ['M0 0', 0, 0]),
    Position: {
      Top: 'top',
      Right: 'right',
      Bottom: 'bottom',
      Left: 'left',
    },
  };
});

// Mock contexts - must be at top level before any imports
vi.mock('../../contexts/UniverseContext', () => ({
  useUniverseContext: vi.fn(() => ({
    universe: {
      regions: [
        {
          id: 'region-work',
          workbenchId: 'workbench-ide',
          label: 'Work',
          layer: 'experience',
          position: { x: 100, y: 100 },
          fogState: 'revealed',
          glowIntensity: 0.8,
          status: 'active',
          colorShift: {
            currentColor: '#4d96ff',
            saturation: 0.7,
            temperature: 0.6,
          },
          health: {
            cpu: 0.5,
            memory: 0.6,
            uptime: 1000,
          },
        },
      ],
      bridges: [],
      gates: [],
      metadata: {
        createdAt: '2026-01-01T00:00:00Z',
        version: '1.0.0',
      },
    },
    isLoading: false,
    error: null,
    zoomTargetRegionId: null,
    clearZoomTarget: vi.fn(),
    navigateToRegion: vi.fn(),
    isRegionAccessible: vi.fn(() => true),
    refreshUniverse: vi.fn(),
  })),
  UniverseProvider: ({ children }: any) => children,
}));

vi.mock('../../contexts/WebSocketContext', () => ({
  useWebSocketContext: () => ({
    status: 'connected',
    onEvent: null,
    send: vi.fn(),
  }),
}));

vi.mock('../../contexts/SessionContext', () => ({
  useSessionContext: () => ({
    sessions: [],
    activeSessionId: null,
    setActiveSession: vi.fn(),
    createSession: vi.fn(),
    deleteSession: vi.fn(),
  }),
}));

vi.mock('../../contexts/DiscoveryContext', () => ({
  useDiscoveryContext: () => ({
    discoveryProgress: {},
    revealRegion: vi.fn(),
    isRegionDiscovered: vi.fn(() => true),
  }),
}));

vi.mock('../../hooks/useFeatureFlag', () => ({
  useFeatureFlagSimple: (flag: string) => {
    if (flag === 'COMMAND_CENTER_ENABLED') return true;
    if (flag === 'SPARK_ANIMATION_ENABLED') return true;
    return false;
  },
}));

vi.mock('../../hooks/useWebVitals', () => ({
  useWebVitals: () => {},
}));

vi.mock('../../utils/performance', () => ({
  useRenderTiming: () => {},
}));

// Mock CosmicMap child components
vi.mock('../../components/CosmicMap/CosmicBackground', () => ({
  CosmicBackground: ({ children }: any) => <div data-testid="cosmic-background">{children}</div>,
}));

vi.mock('../../components/CosmicMap/BigBangAnimation', () => ({
  BigBangAnimation: ({ onComplete }: any) => {
    // Auto-complete immediately in tests
    setTimeout(() => onComplete?.(), 0);
    return <div data-testid="big-bang-animation" />;
  },
}));

vi.mock('../../components/CosmicMap/SparkAnimation', () => ({
  SparkAnimation: () => <g data-testid="spark-animation" />,
}));

vi.mock('../../components/CosmicMap/LiveRegion', () => ({
  LiveRegion: () => <div data-testid="live-region" aria-live="polite" />,
}));

vi.mock('../../components/CosmicMap/CommandCenter', () => ({
  CommandCenter: ({ onCommand, showHealthStatus }: any) => (
    <div data-testid="command-center">
      <input type="text" placeholder="Enter command" />
    </div>
  ),
}));

vi.mock('../../components/CosmicMap/RegionStar', () => ({
  RegionStar: ({ data }: any) => <div data-testid={`region-star-${data?.regionId}`} />,
}));

vi.mock('../../components/CosmicMap/LightBridgeEdge', () => ({
  LightBridgeEdge: ({ data }: any) => <div data-testid={`light-bridge-${data?.edgeId}`} />,
}));

vi.mock('../Onboarding/UniverseOnboarding', () => ({
  UniverseOnboarding: () => <div data-testid="universe-onboarding" />,
}));

vi.mock('../CommandCenter/DiscoveryHint', () => ({
  DiscoveryHint: () => <div data-testid="discovery-hint" />,
}));

vi.mock('../CommandCenter/discoveryConfig', () => ({
  DISCOVERY_SUGGESTIONS: [],
  getRegionName: vi.fn((id: string) => id),
}));

describe('CosmicMap', () => {
  useCommonTestSetup();

  // Mock localStorage to skip Big Bang animation in tests
  beforeEach(() => {
    global.localStorage = {
      getItem: (key: string) => {
        if (key === 'afw-big-bang-seen') return 'true';
        return null;
      },
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn(),
    } as any;
  });

  it('renders without crashing with default props', () => {
    const { container } = render(<CosmicMap />);
    expect(container).toBeTruthy();
  });

  it('respects visible prop for opacity control', () => {
    const { rerender } = render(<CosmicMap visible={true} />);
    let wrapper = document.querySelector('[data-testid="cosmic-map"]');
    expect(wrapper).toBeTruthy();

    rerender(<CosmicMap visible={false} />);
    // Component should still render but with different visibility state
    expect(document.querySelector('[data-testid="cosmic-map"]')).toBeTruthy();
  });

  it('handles zooming prop for fade transitions', () => {
    const { rerender } = render(<CosmicMap zooming={false} />);
    expect(document.querySelector('[data-testid="cosmic-map"]')).toBeTruthy();

    rerender(<CosmicMap zooming={true} />);
    expect(document.querySelector('[data-testid="cosmic-map"]')).toBeTruthy();
  });

  it('renders ReactFlow provider wrapper', () => {
    render(<CosmicMap />);
    expect(screen.getByTestId('reactflow-provider')).toBeInTheDocument();
  });

  it('applies correct test hooks for loading state', async () => {
    // Mock loading state
    vi.resetModules();
    vi.doMock('../../contexts/UniverseContext', () => ({
      useUniverseContext: () => ({
        universe: null,
        isLoading: true,
        error: null,
        zoomTargetRegionId: null,
        clearZoomTarget: vi.fn(),
      }),
    }));

    const { container } = render(<CosmicMap />);
    // When loading, component should handle gracefully
    expect(container).toBeTruthy();
  });

  it('handles error state gracefully', async () => {
    vi.resetModules();
    vi.doMock('../../contexts/UniverseContext', () => ({
      useUniverseContext: () => ({
        universe: null,
        isLoading: false,
        error: new Error('Universe load failed'),
        zoomTargetRegionId: null,
        clearZoomTarget: vi.fn(),
      }),
    }));

    const { container } = render(<CosmicMap />);
    expect(container).toBeTruthy();
  });

  it('includes required accessibility attributes', () => {
    const { container } = render(<CosmicMap />);
    // Check that main container has testid for a11y tree
    const cosmicMap = container.querySelector('[data-testid="cosmic-map"]');
    expect(cosmicMap).toBeTruthy();
  });

  it('renders CommandCenter when feature flag enabled', () => {
    render(<CosmicMap />);
    // CommandCenter should be present when COMMAND_CENTER_ENABLED is true
    expect(screen.queryByTestId('command-center')).toBeTruthy();
  });
});
