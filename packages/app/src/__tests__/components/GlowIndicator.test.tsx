/**
 * GlowIndicator Component Tests
 *
 * Tests the animated glow status indicator including:
 * - Smoke rendering with required props
 * - Status prop validation
 * - Active/inactive state rendering
 * - Animation behavior
 * - CSS class application
 * - Accessibility attributes
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { GlowIndicator, type GlowIndicatorProps } from '../../components/common/GlowIndicator';
import { useCommonTestSetup } from '../../__tests__/utils';

describe('GlowIndicator', () => {
  const requiredProps: GlowIndicatorProps = {
    active: true,
    level: 'info',
    children: <span>Test</span>,
  };

  useCommonTestSetup();

  it('renders without crashing with required props', () => {
    const { container } = render(<GlowIndicator {...requiredProps} />);
    expect(container).toBeTruthy();
  });

  it('applies glow-indicator base class', () => {
    const { container } = render(<GlowIndicator {...requiredProps} />);
    expect(container.querySelector('.glow-indicator')).toBeInTheDocument();
  });

  it('applies active modifier class when active is true', () => {
    const { container } = render(<GlowIndicator {...requiredProps} active={true} />);
    expect(container.querySelector('.glow-indicator--active')).toBeInTheDocument();
  });

  it('does not apply active modifier when active is false', () => {
    const { container } = render(<GlowIndicator {...requiredProps} active={false} />);
    expect(container.querySelector('.glow-indicator--active')).not.toBeInTheDocument();
  });

  it('applies level-specific class for info status', () => {
    const { container } = render(<GlowIndicator {...requiredProps} level="info" active={true} />);
    expect(container.querySelector('.glow-indicator--info')).toBeInTheDocument();
  });

  it('applies level-specific class for success status', () => {
    const { container } = render(<GlowIndicator {...requiredProps} level="success" active={true} />);
    expect(container.querySelector('.glow-indicator--success')).toBeInTheDocument();
  });

  it('applies level-specific class for warning status', () => {
    const { container } = render(<GlowIndicator {...requiredProps} level="warning" active={true} />);
    expect(container.querySelector('.glow-indicator--warning')).toBeInTheDocument();
  });

  it('applies level-specific class for error status', () => {
    const { container } = render(<GlowIndicator {...requiredProps} level="error" active={true} />);
    expect(container.querySelector('.glow-indicator--error')).toBeInTheDocument();
  });

  it('applies pulse animation class when pulse is true and active', () => {
    const { container } = render(<GlowIndicator {...requiredProps} pulse={true} active={true} />);
    expect(container.querySelector('.glow-indicator--pulse')).toBeInTheDocument();
  });

  it('does not apply pulse class when pulse is false', () => {
    const { container } = render(<GlowIndicator {...requiredProps} pulse={false} active={true} />);
    expect(container.querySelector('.glow-indicator--pulse')).not.toBeInTheDocument();
  });

  it('does not apply pulse class when inactive even if pulse is true', () => {
    const { container } = render(<GlowIndicator {...requiredProps} pulse={true} active={false} />);
    expect(container.querySelector('.glow-indicator--pulse')).not.toBeInTheDocument();
  });

  it('applies custom className prop', () => {
    const { container } = render(
      <GlowIndicator {...requiredProps} className="custom-class" />
    );
    expect(container.querySelector('.custom-class')).toBeInTheDocument();
  });

  it('combines multiple classes correctly', () => {
    const { container } = render(
      <GlowIndicator
        {...requiredProps}
        active={true}
        pulse={true}
        className="custom"
      />
    );

    const element = container.querySelector('.glow-indicator');
    expect(element?.className).toContain('glow-indicator');
    expect(element?.className).toContain('glow-indicator--active');
    expect(element?.className).toContain('glow-indicator--pulse');
    expect(element?.className).toContain('custom');
  });

  it('sets CSS custom property for intensity when active', () => {
    const { container } = render(
      <GlowIndicator {...requiredProps} intensity={0.75} active={true} />
    );

    const element = container.querySelector('.glow-indicator') as HTMLElement;
    expect(element.style.getPropertyValue('--glow-intensity')).toBe('0.75');
  });

  it('clamps intensity value between 0 and 1', () => {
    const { rerender, container } = render(
      <GlowIndicator {...requiredProps} intensity={2} active={true} />
    );

    let element = container.querySelector('.glow-indicator') as HTMLElement;
    expect(element.style.getPropertyValue('--glow-intensity')).toBe('1');

    rerender(<GlowIndicator {...requiredProps} intensity={-0.5} active={true} />);
    element = container.querySelector('.glow-indicator') as HTMLElement;
    expect(element.style.getPropertyValue('--glow-intensity')).toBe('0');
  });

  it('applies default intensity of 1 when not specified', () => {
    const { container } = render(<GlowIndicator {...requiredProps} active={true} />);

    const element = container.querySelector('.glow-indicator') as HTMLElement;
    expect(element.style.getPropertyValue('--glow-intensity')).toBe('1');
  });

  it('renders children content correctly', () => {
    const { container } = render(
      <GlowIndicator {...requiredProps}>
        <span>Test Content</span>
      </GlowIndicator>
    );

    expect(container.textContent).toContain('Test Content');
  });

  it('sets role="status" when active', () => {
    const { container } = render(<GlowIndicator {...requiredProps} active={true} />);

    expect(container.querySelector('[role="status"]')).toBeInTheDocument();
  });

  it('does not set role when inactive', () => {
    const { container } = render(<GlowIndicator {...requiredProps} active={false} />);

    expect(container.querySelector('[role="status"]')).not.toBeInTheDocument();
  });

  it('sets aria-live="polite" when active', () => {
    const { container } = render(<GlowIndicator {...requiredProps} active={true} />);

    expect(container.querySelector('[aria-live="polite"]')).toBeInTheDocument();
  });

  it('does not set aria-live when inactive', () => {
    const { container } = render(<GlowIndicator {...requiredProps} active={false} />);

    expect(container.querySelector('[aria-live="polite"]')).not.toBeInTheDocument();
  });

  it('sets appropriate aria-label when active', () => {
    const { container } = render(<GlowIndicator {...requiredProps} level="warning" active={true} />);

    const element = container.querySelector('.glow-indicator');
    expect(element?.getAttribute('aria-label')).toBe('warning notification');
  });

  it('does not set aria-label when inactive', () => {
    const { container } = render(<GlowIndicator {...requiredProps} active={false} />);

    const element = container.querySelector('.glow-indicator');
    expect(element?.getAttribute('aria-label')).not.toBeInTheDocument();
  });

  it('applies default pulse value of true', () => {
    const { container } = render(<GlowIndicator {...requiredProps} active={true} />);

    expect(container.querySelector('.glow-indicator--pulse')).toBeInTheDocument();
  });

  it('applies default size properties', () => {
    const { container } = render(<GlowIndicator {...requiredProps} />);

    expect(container.querySelector('.glow-indicator')).toBeInTheDocument();
  });

  it('handles all level types correctly', () => {
    const levels: GlowIndicatorProps['level'][] = ['info', 'success', 'warning', 'error'];

    levels.forEach((level) => {
      const { container } = render(
        <GlowIndicator {...requiredProps} level={level} active={true} />
      );

      expect(container.querySelector(`.glow-indicator--${level}`)).toBeInTheDocument();
    });
  });

  it('does not style when inactive', () => {
    const { container } = render(
      <GlowIndicator
        {...requiredProps}
        active={false}
        intensity={0.5}
      />
    );

    const element = container.querySelector('.glow-indicator') as HTMLElement;
    expect(element.style.getPropertyValue('--glow-intensity')).toBe('');
  });

  it('re-renders correctly when props change', () => {
    const { rerender, container } = render(
      <GlowIndicator {...requiredProps} active={false} level="info" />
    );

    expect(container.querySelector('.glow-indicator--active')).not.toBeInTheDocument();

    rerender(<GlowIndicator {...requiredProps} active={true} level="info" />);

    expect(container.querySelector('.glow-indicator--active')).toBeInTheDocument();
  });

  it('handles empty className gracefully', () => {
    const { container } = render(
      <GlowIndicator {...requiredProps} className="" />
    );

    expect(container.querySelector('.glow-indicator')).toBeInTheDocument();
  });

  it('handles ReactNode children correctly', () => {
    const { container } = render(
      <GlowIndicator {...requiredProps}>
        <div>
          <p>Nested Content</p>
        </div>
      </GlowIndicator>
    );

    expect(container.textContent).toContain('Nested Content');
  });
});
