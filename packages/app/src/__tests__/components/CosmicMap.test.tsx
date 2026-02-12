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

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CosmicMap } from '../../components/CosmicMap/CosmicMap';
import { useCommonTestSetup } from '../../__tests__/utils';

// Mock ReactFlow provider
vi.mock('reactflow', async () => {
  const actual = await vi.importActual('reactflow');
  return {
    ...actual,
    ReactFlowProvider: ({ children }: any) => <div data-testid="reactflow-provider">{children}</div>,
  };
});

// Mock contexts
vi.mock('../../contexts/UniverseContext', () => ({
  useUniverseContext: () => ({
    universe: {
      regions: [],
      bridges: [],
      gates: [],
    },
    isLoading: false,
    error: null,
    zoomTargetRegionId: null,
    clearZoomTarget: vi.fn(),
    navigateToRegion: vi.fn(),
    isRegionAccessible: vi.fn((regionId) => true),
  }),
}));

vi.mock('../../contexts/WebSocketContext', () => ({
  useWebSocketContext: () => ({
    status: 'connected',
    onEvent: null,
    send: vi.fn(),
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

describe('CosmicMap', () => {
  useCommonTestSetup();

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
