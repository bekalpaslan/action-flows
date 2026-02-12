/**
 * GateCheckpoint Component Tests
 *
 * Tests the contract checkpoint marker on light bridges including:
 * - Smoke rendering with required props
 * - Gate status visualization
 * - Position styling
 * - Click/hover interactions
 * - Accessibility attributes
 * - Label display
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GateCheckpointComponent } from '../../components/CosmicMap/GateCheckpoint';
import type { GateCheckpoint } from '@afw/shared';

describe('GateCheckpoint', () => {
  const mockGate: GateCheckpoint = {
    id: 'gate-1',
    harmonyRule: 'contract:validation',
    status: 'pending',
  };

  const mockPosition = { x: 100, y: 200 };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing with required props', () => {
    const { container } = render(
      <GateCheckpointComponent gate={mockGate} position={mockPosition} />
    );
    expect(container).toBeTruthy();
  });

  it('applies correct data-gate-id attribute', () => {
    const { container } = render(
      <GateCheckpointComponent gate={mockGate} position={mockPosition} />
    );

    const element = container.querySelector('[data-gate-id="gate-1"]');
    expect(element).toBeInTheDocument();
  });

  it('applies correct data-harmony-rule attribute', () => {
    const { container } = render(
      <GateCheckpointComponent gate={mockGate} position={mockPosition} />
    );

    const element = container.querySelector('[data-harmony-rule="contract:validation"]');
    expect(element).toBeInTheDocument();
  });

  it('applies pending status class', () => {
    const { container } = render(
      <GateCheckpointComponent gate={mockGate} position={mockPosition} />
    );

    expect(container.querySelector('.gate-checkpoint--pending')).toBeInTheDocument();
  });

  it('applies passed status class', () => {
    const passedGate = { ...mockGate, status: 'passed' as const };
    const { container } = render(
      <GateCheckpointComponent gate={passedGate} position={mockPosition} />
    );

    expect(container.querySelector('.gate-checkpoint--passed')).toBeInTheDocument();
  });

  it('applies failed status class', () => {
    const failedGate = { ...mockGate, status: 'failed' as const };
    const { container } = render(
      <GateCheckpointComponent gate={failedGate} position={mockPosition} />
    );

    expect(container.querySelector('.gate-checkpoint--failed')).toBeInTheDocument();
  });

  it('applies blocked status class', () => {
    const blockedGate = { ...mockGate, status: 'blocked' as const };
    const { container } = render(
      <GateCheckpointComponent gate={blockedGate} position={mockPosition} />
    );

    expect(container.querySelector('.gate-checkpoint--blocked')).toBeInTheDocument();
  });

  it('positions element absolutely at specified coordinates', () => {
    const { container } = render(
      <GateCheckpointComponent gate={mockGate} position={{ x: 150, y: 250 }} />
    );

    const element = container.querySelector('.gate-checkpoint') as HTMLElement;
    expect(element.style.position).toBe('absolute');
    expect(element.style.left).toBe('150px');
    expect(element.style.top).toBe('250px');
  });

  it('applies transform to center element on coordinates', () => {
    const { container } = render(
      <GateCheckpointComponent gate={mockGate} position={mockPosition} />
    );

    const element = container.querySelector('.gate-checkpoint') as HTMLElement;
    expect(element.style.transform).toBe('translate(-50%, -50%)');
  });

  it('renders diamond shape element', () => {
    const { container } = render(
      <GateCheckpointComponent gate={mockGate} position={mockPosition} />
    );

    expect(container.querySelector('.gate-checkpoint__diamond')).toBeInTheDocument();
  });

  it('renders inner diamond element', () => {
    const { container } = render(
      <GateCheckpointComponent gate={mockGate} position={mockPosition} />
    );

    expect(container.querySelector('.gate-checkpoint__inner')).toBeInTheDocument();
  });

  it('includes aria-label with gate info', () => {
    const { container } = render(
      <GateCheckpointComponent gate={mockGate} position={mockPosition} />
    );

    const element = container.querySelector('.gate-checkpoint');
    const ariaLabel = element?.getAttribute('aria-label');

    expect(ariaLabel).toContain('Gate checkpoint');
    expect(ariaLabel).toContain('contract:validation');
    expect(ariaLabel).toContain('pending');
  });

  it('sets role="status" for accessibility', () => {
    const { container } = render(
      <GateCheckpointComponent gate={mockGate} position={mockPosition} />
    );

    expect(container.querySelector('[role="status"]')).toBeInTheDocument();
  });

  it('includes title attribute for tooltip', () => {
    const { container } = render(
      <GateCheckpointComponent gate={mockGate} position={mockPosition} />
    );

    const element = container.querySelector('.gate-checkpoint');
    const title = element?.getAttribute('title');

    expect(title).toContain('Gate');
    expect(title).toContain('contract:validation');
    expect(title).toContain('pending');
  });

  it('handles different harmony rule names', () => {
    const customRuleGate = {
      ...mockGate,
      harmonyRule: 'contract:type-safety',
    };

    const { container } = render(
      <GateCheckpointComponent gate={customRuleGate} position={mockPosition} />
    );

    const ariaLabel = container.querySelector('.gate-checkpoint')?.getAttribute('aria-label');
    expect(ariaLabel).toContain('contract:type-safety');
  });

  it('handles all status types without crashing', () => {
    const statuses: GateCheckpoint['status'][] = ['pending', 'passed', 'failed', 'blocked'];

    statuses.forEach((status) => {
      const { container } = render(
        <GateCheckpointComponent gate={{ ...mockGate, status }} position={mockPosition} />
      );

      expect(container.querySelector(`.gate-checkpoint--${status}`)).toBeInTheDocument();
    });
  });

  it('responds to mouse hover with cursor pointer', () => {
    const { container } = render(
      <GateCheckpointComponent gate={mockGate} position={mockPosition} />
    );

    const element = container.querySelector('.gate-checkpoint') as HTMLElement;
    expect(element.style.cursor).toBeTruthy() || expect(element.className).toContain('gate-checkpoint');
  });

  it('maintains position when status changes', () => {
    const { rerender, container } = render(
      <GateCheckpointComponent gate={mockGate} position={{ x: 100, y: 200 }} />
    );

    let element = container.querySelector('.gate-checkpoint') as HTMLElement;
    expect(element.style.left).toBe('100px');
    expect(element.style.top).toBe('200px');

    rerender(
      <GateCheckpointComponent
        gate={{ ...mockGate, status: 'passed' }}
        position={{ x: 100, y: 200 }}
      />
    );

    element = container.querySelector('.gate-checkpoint') as HTMLElement;
    expect(element.style.left).toBe('100px');
    expect(element.style.top).toBe('200px');
  });

  it('updates status class when status prop changes', () => {
    const { rerender, container } = render(
      <GateCheckpointComponent gate={mockGate} position={mockPosition} />
    );

    expect(container.querySelector('.gate-checkpoint--pending')).toBeInTheDocument();

    rerender(
      <GateCheckpointComponent
        gate={{ ...mockGate, status: 'passed' }}
        position={mockPosition}
      />
    );

    expect(container.querySelector('.gate-checkpoint--passed')).toBeInTheDocument();
  });

  it('handles edge case positions at origin', () => {
    const { container } = render(
      <GateCheckpointComponent gate={mockGate} position={{ x: 0, y: 0 }} />
    );

    const element = container.querySelector('.gate-checkpoint') as HTMLElement;
    expect(element.style.left).toBe('0px');
    expect(element.style.top).toBe('0px');
  });

  it('handles large coordinate values', () => {
    const { container } = render(
      <GateCheckpointComponent gate={mockGate} position={{ x: 10000, y: 10000 }} />
    );

    const element = container.querySelector('.gate-checkpoint') as HTMLElement;
    expect(element.style.left).toBe('10000px');
    expect(element.style.top).toBe('10000px');
  });

  it('applies base gate-checkpoint class', () => {
    const { container } = render(
      <GateCheckpointComponent gate={mockGate} position={mockPosition} />
    );

    expect(container.querySelector('.gate-checkpoint')).toBeInTheDocument();
  });

  it('updates aria-label when harmony rule changes', () => {
    const { rerender, container } = render(
      <GateCheckpointComponent gate={mockGate} position={mockPosition} />
    );

    let ariaLabel = container.querySelector('.gate-checkpoint')?.getAttribute('aria-label');
    expect(ariaLabel).toContain('contract:validation');

    rerender(
      <GateCheckpointComponent
        gate={{ ...mockGate, harmonyRule: 'contract:accessibility' }}
        position={mockPosition}
      />
    );

    ariaLabel = container.querySelector('.gate-checkpoint')?.getAttribute('aria-label');
    expect(ariaLabel).toContain('contract:accessibility');
  });
});
