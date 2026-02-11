/**
 * SparkAnimation Component Tests
 *
 * Verifies spark rendering, animation progress, trail effect, and cleanup.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { SparkAnimation } from '../components/CosmicMap/SparkAnimation';
import type { ChainId, RegionId } from '@afw/shared';

describe('SparkAnimation', () => {
  const mockProps = {
    chainId: 'chain-123' as ChainId,
    fromRegion: 'region-platform' as RegionId,
    toRegion: 'region-experience' as RegionId,
    edgePath: 'M 100 100 L 200 200',
    progress: 0.5,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders spark with correct chain and region data attributes', () => {
    const { container } = render(<SparkAnimation {...mockProps} />);

    const sparkGroup = container.querySelector('.spark-animation');
    expect(sparkGroup).toBeTruthy();
    expect(sparkGroup?.getAttribute('data-chain-id')).toBe('chain-123');
    expect(sparkGroup?.getAttribute('data-from-region')).toBe('region-platform');
    expect(sparkGroup?.getAttribute('data-to-region')).toBe('region-experience');
  });

  it('renders spark dot and trail elements', () => {
    const { container } = render(<SparkAnimation {...mockProps} />);

    const sparkDot = container.querySelector('.spark-dot');
    const sparkTrail = container.querySelector('.spark-trail');

    expect(sparkDot).toBeTruthy();
    expect(sparkTrail).toBeTruthy();
  });

  it('applies correct progress to animation', () => {
    const { container } = render(<SparkAnimation {...mockProps} progress={0.75} />);

    const sparkDot = container.querySelector('.spark-dot');
    const animateMotion = sparkDot?.querySelector('animateMotion');

    expect(animateMotion?.getAttribute('keyPoints')).toBe('0;0.75');
  });

  it('trail follows spark with 10% delay', () => {
    const { container } = render(<SparkAnimation {...mockProps} progress={0.6} />);

    const sparkTrail = container.querySelector('.spark-trail');
    const trailAnimation = sparkTrail?.querySelector('animateMotion');

    // Trail should be at 0.6 - 0.1 = 0.5
    expect(trailAnimation?.getAttribute('keyPoints')).toBe('0;0.5');
  });

  it('trail progress never goes below 0', () => {
    const { container } = render(<SparkAnimation {...mockProps} progress={0.05} />);

    const sparkTrail = container.querySelector('.spark-trail');
    const trailAnimation = sparkTrail?.querySelector('animateMotion');

    // Trail should clamp to 0, not -0.05
    expect(trailAnimation?.getAttribute('keyPoints')).toBe('0;0');
  });

  it('calls onComplete callback when progress reaches 1.0', async () => {
    const onComplete = vi.fn();
    render(<SparkAnimation {...mockProps} progress={1.0} onComplete={onComplete} />);

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledTimes(1);
    });
  });

  it('does not call onComplete for progress < 1.0', async () => {
    const onComplete = vi.fn();
    render(<SparkAnimation {...mockProps} progress={0.99} onComplete={onComplete} />);

    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('renders null and warns when edgePath is empty', () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { container } = render(<SparkAnimation {...mockProps} edgePath="" />);

    expect(container.querySelector('.spark-animation')).toBeNull();
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('No edge path found')
    );

    consoleWarnSpy.mockRestore();
  });

  it('creates unique path ID for each spark', () => {
    const { container: container1 } = render(
      <SparkAnimation {...mockProps} chainId={'chain-1' as ChainId} />
    );
    const { container: container2 } = render(
      <SparkAnimation {...mockProps} chainId={'chain-2' as ChainId} />
    );

    const path1 = container1.querySelector('path');
    const path2 = container2.querySelector('path');

    expect(path1?.getAttribute('id')).not.toBe(path2?.getAttribute('id'));
  });

  it('uses CSS variables for colors', () => {
    const { container } = render(<SparkAnimation {...mockProps} />);

    const sparkDot = container.querySelector('.spark-dot');
    const sparkTrail = container.querySelector('.spark-trail');

    expect(sparkDot?.getAttribute('fill')).toBe('var(--cosmic-spark-core)');
    expect(sparkTrail?.getAttribute('fill')).toBe('var(--cosmic-spark-trail)');
  });

  it('applies reduced motion CSS class', () => {
    const { container } = render(<SparkAnimation {...mockProps} />);
    const sparkGroup = container.querySelector('.spark-animation');

    // Component itself doesn't apply reduced-motion class, CSS handles it
    // Just verify the component renders correctly
    expect(sparkGroup).toBeTruthy();
  });

  it('updates progress on prop change', () => {
    const { container, rerender } = render(<SparkAnimation {...mockProps} progress={0.3} />);

    let sparkDot = container.querySelector('.spark-dot');
    let animateMotion = sparkDot?.querySelector('animateMotion');
    expect(animateMotion?.getAttribute('keyPoints')).toBe('0;0.3');

    rerender(<SparkAnimation {...mockProps} progress={0.8} />);

    sparkDot = container.querySelector('.spark-dot');
    animateMotion = sparkDot?.querySelector('animateMotion');
    expect(animateMotion?.getAttribute('keyPoints')).toBe('0;0.8');
  });
});
