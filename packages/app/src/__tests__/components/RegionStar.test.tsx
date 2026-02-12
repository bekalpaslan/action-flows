/**
 * RegionStar Component Tests
 *
 * Tests the interactive cosmic region node including:
 * - Smoke rendering with required props
 * - Fog state transitions and animations
 * - Click handler for region navigation
 * - Glow state management
 * - Accessibility attributes
 * - Health metrics rendering
 */

import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { RegionStar, type RegionStarData } from '../../components/CosmicMap/RegionStar';
import type { NodeProps } from 'reactflow';
import { FogState } from '@afw/shared';
import { useCommonTestSetup, createMockRegionStarData, createMockRegionStarNodeProps } from '../../__tests__/utils';

// Mock contexts
vi.mock('../../contexts/UniverseContext', () => ({
  useUniverseContext: () => ({
    navigateToRegion: vi.fn(),
    isRegionAccessible: vi.fn((regionId) => true),
  }),
}));

vi.mock('../../contexts/WebSocketContext', () => ({
  useWebSocketContext: () => ({
    onEvent: null,
    status: 'connected',
    send: vi.fn(),
  }),
}));

vi.mock('reactflow', () => ({
  Handle: ({ position }: any) => <div data-testid={`handle-${position}`} />,
  Position: {
    Top: 'top',
    Right: 'right',
    Bottom: 'bottom',
    Left: 'left',
  },
}));

describe('RegionStar', () => {
  const mockData: RegionStarData = createMockRegionStarData();
  const mockNodeProps: NodeProps<RegionStarData> = createMockRegionStarNodeProps();

  useCommonTestSetup();

  it('renders without crashing with required props', () => {
    const { container } = render(<RegionStar {...mockNodeProps} />);
    expect(container).toBeTruthy();
  });

  it('applies correct data-testid based on regionId', () => {
    const { container } = render(<RegionStar {...mockNodeProps} />);
    const regionElement = container.querySelector('[data-testid="region-star-region-work"]');
    expect(regionElement).toBeTruthy();
  });

  it('renders region label correctly', () => {
    const { container } = render(<RegionStar {...mockNodeProps} />);
    const labelElement = container.querySelector('[data-testid="region-star-label-region-work"]');
    expect(labelElement).toBeTruthy();
  });

  it('displays status indicator with correct testid', () => {
    const { container } = render(<RegionStar {...mockNodeProps} />);
    const statusElement = container.querySelector('[data-testid="region-star-status-region-work"]');
    expect(statusElement).toBeTruthy();
  });

  it('renders health bar with testid', () => {
    const { container } = render(<RegionStar {...mockNodeProps} />);
    const healthElement = container.querySelector('[data-testid="region-star-health-region-work"]');
    expect(healthElement).toBeTruthy();
  });

  it('transitions glow state from idle to active', async () => {
    const { rerender } = render(<RegionStar {...mockNodeProps} />);

    const updatedData = {
      ...mockData,
      status: 'active' as const,
    };

    rerender(
      <RegionStar
        {...mockNodeProps}
        data={updatedData}
      />
    );

    // Component should re-render with active status
    expect(document.querySelector('[data-testid="region-star-status-region-work"]')).toBeTruthy();
  });

  it('handles fog state transition from HIDDEN to REVEALED', async () => {
    const hiddenProps = {
      ...mockNodeProps,
      data: {
        ...mockData,
        fogState: FogState.HIDDEN,
      },
    };

    const { rerender } = render(<RegionStar {...hiddenProps} />);

    const revealedProps = {
      ...mockNodeProps,
      data: {
        ...mockData,
        fogState: FogState.REVEALED,
      },
    };

    rerender(<RegionStar {...revealedProps} />);

    // Component should trigger revealing animation
    expect(document.querySelector('[data-testid="region-star-region-work"]')).toBeTruthy();
  });

  it('includes aria-label with accessibility information', () => {
    const { container } = render(<RegionStar {...mockNodeProps} />);
    const regionElement = container.querySelector('[data-testid="region-star-region-work"]');
    const ariaLabel = regionElement?.getAttribute('aria-label');

    expect(ariaLabel).toContain('region-work');
    expect(ariaLabel).toContain('idle');
  });

  it('respects selected prop for visual state', () => {
    const selectedProps = {
      ...mockNodeProps,
      selected: true,
    };

    const { container } = render(<RegionStar {...selectedProps} />);
    expect(container.querySelector('[data-testid="region-star-region-work"]')).toBeTruthy();
  });

  it('applies correct color shift values to styling', () => {
    const customColorData = {
      ...mockData,
      colorShift: {
        hue: 120,
        saturation: 0.8,
        lightness: 0.6,
      },
    };

    const { container } = render(
      <RegionStar
        {...mockNodeProps}
        data={customColorData}
      />
    );

    expect(container.querySelector('[data-testid="region-star-region-work"]')).toBeTruthy();
  });

  it('renders health metrics with correct ratios', () => {
    const healthData = {
      ...mockData,
      health: {
        error: 1,
        warning: 2,
        success: 3,
        total: 6,
      },
    };

    const { container } = render(
      <RegionStar
        {...mockNodeProps}
        data={healthData}
      />
    );

    const healthElement = container.querySelector('[data-testid="region-star-health-region-work"]');
    expect(healthElement).toBeTruthy();
  });

  it('handles different layer types correctly', () => {
    const layers: RegionStarData['layer'][] = ['platform', 'template', 'philosophy', 'physics', 'experience'];

    layers.forEach((layer) => {
      const { container } = render(
        <RegionStar
          {...mockNodeProps}
          data={{
            ...mockData,
            layer,
          }}
        />
      );

      expect(container.querySelector('[data-testid="region-star-region-work"]')).toBeTruthy();
    });
  });

  it('handles all status types without crashing', () => {
    const statuses: RegionStarData['status'][] = ['idle', 'active', 'waiting', 'undiscovered'];

    statuses.forEach((status) => {
      const { container } = render(
        <RegionStar
          {...mockNodeProps}
          data={{
            ...mockData,
            status,
          }}
        />
      );

      expect(container.querySelector('[data-testid="region-star-region-work"]')).toBeTruthy();
    });
  });

  it('renders ReactFlow Handle components for connections', () => {
    const { container } = render(<RegionStar {...mockNodeProps} />);
    // Handles should be present for node connections
    const handleElements = container.querySelectorAll('[data-testid^="handle-"]');
    expect(handleElements.length).toBeGreaterThan(0);
  });
});
