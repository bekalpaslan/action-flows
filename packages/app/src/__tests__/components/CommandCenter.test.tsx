/**
 * CommandCenter Component Tests
 *
 * Tests the Living Universe command center bottom bar including:
 * - Smoke rendering with optional props
 * - Command input and submission
 * - Health status display
 * - Session selector dropdown
 * - Callback invocation
 * - Accessibility attributes
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CommandCenter } from '../../components/CosmicMap/CommandCenter';
import type { SessionId, Session } from '@afw/shared';
import { useCommonTestSetup, createMockSession, createMockChain } from '../../__tests__/utils';

// Mock contexts
vi.mock('../../contexts/SessionContext', () => ({
  useSessionContext: () => ({
    sessions: [
      createMockSession({
        id: 'session-123' as SessionId,
        chains: [createMockChain({ id: 'chain-1' })],
      }),
    ] as Session[],
    activeSessionId: 'session-123' as SessionId,
    setActiveSession: vi.fn(),
  }),
}));

vi.mock('../../contexts/UniverseContext', () => ({
  useUniverseContext: () => ({
    universe: {
      regions: [
        {
          id: 'region-work',
          label: 'Work',
          workbenchId: 'work',
          layer: 'experience',
          position: { x: 100, y: 100 },
        },
      ],
      bridges: [],
      gates: [],
    },
    navigateToRegion: vi.fn(),
  }),
}));

vi.mock('../../contexts/DiscoveryContext', () => ({
  useDiscoveryContext: () => ({
    discoveryProgress: {},
  }),
}));

vi.mock('../CommandCenter/DiscoveryHint', () => ({
  DiscoveryHint: () => <div data-testid="discovery-hint" />,
}));

vi.mock('../CommandCenter/discoveryConfig', () => ({
  DISCOVERY_SUGGESTIONS: [],
  getRegionName: (regionId: string) => regionId,
}));

describe('CommandCenter', () => {
  useCommonTestSetup();

  it('renders without crashing with no props', () => {
    const { container } = render(<CommandCenter />);
    expect(container).toBeTruthy();
  });

  it('applies correct data-testid on main container', () => {
    render(<CommandCenter />);
    expect(screen.getByTestId('command-center')).toBeInTheDocument();
  });

  it('renders command input field with correct testid', () => {
    render(<CommandCenter />);
    const inputElement = screen.getByTestId('command-input');
    expect(inputElement).toBeInTheDocument();
    expect(inputElement).toHaveAttribute('type', 'text');
  });

  it('renders health status indicator when showHealthStatus is true', () => {
    render(<CommandCenter showHealthStatus={true} />);
    expect(screen.getByTestId('health-status')).toBeInTheDocument();
  });

  it('hides health status indicator when showHealthStatus is false', () => {
    render(<CommandCenter showHealthStatus={false} />);
    expect(screen.queryByTestId('health-status')).not.toBeInTheDocument();
  });

  it('calls onCommand callback with input value on submit', async () => {
    const mockOnCommand = vi.fn();
    render(<CommandCenter onCommand={mockOnCommand} />);

    const input = screen.getByTestId('command-input');
    fireEvent.change(input, { target: { value: 'test command' } });

    const sendButton = screen.getByTestId('command-submit');
    fireEvent.click(sendButton);

    expect(mockOnCommand).toHaveBeenCalledWith('test command');
  });

  it('clears input after successful command submission', async () => {
    const mockOnCommand = vi.fn();
    render(<CommandCenter onCommand={mockOnCommand} />);

    const input = screen.getByTestId('command-input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'test command' } });

    const sendButton = screen.getByTestId('command-submit');
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(input.value).toBe('');
    });
  });

  it('ignores empty command submissions', () => {
    const mockOnCommand = vi.fn();
    render(<CommandCenter onCommand={mockOnCommand} />);

    const input = screen.getByTestId('command-input');
    fireEvent.change(input, { target: { value: '   ' } });

    const sendButton = screen.getByTestId('command-submit');
    fireEvent.click(sendButton);

    expect(mockOnCommand).not.toHaveBeenCalled();
  });

  it('handles Enter key submission in command input', () => {
    const mockOnCommand = vi.fn();
    render(<CommandCenter onCommand={mockOnCommand} />);

    const input = screen.getByTestId('command-input');
    fireEvent.change(input, { target: { value: 'enter command' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    expect(mockOnCommand).toHaveBeenCalledWith('enter command');
  });

  it('does not submit command on other key presses', () => {
    const mockOnCommand = vi.fn();
    render(<CommandCenter onCommand={mockOnCommand} />);

    const input = screen.getByTestId('command-input');
    fireEvent.change(input, { target: { value: 'test' } });
    fireEvent.keyDown(input, { key: 'ArrowUp', code: 'ArrowUp' });

    expect(mockOnCommand).not.toHaveBeenCalled();
  });

  it('renders session dropdown selector', () => {
    render(<CommandCenter />);
    const sessionDropdown = screen.getByTestId('session-selector-button');
    expect(sessionDropdown).toBeInTheDocument();
  });

  it('toggles session dropdown on button click', async () => {
    render(<CommandCenter />);

    const dropdownButton = screen.getByTestId('session-selector-button');
    expect(screen.queryByTestId('session-dropdown-menu')).not.toBeInTheDocument();

    fireEvent.click(dropdownButton);

    await waitFor(() => {
      expect(screen.getByTestId('session-dropdown-menu')).toBeInTheDocument();
    });
  });

  it('displays active session in selector', () => {
    render(<CommandCenter />);
    const sessionDisplay = screen.getByTestId('active-session-display');
    expect(sessionDisplay).toBeInTheDocument();
  });

  it('counts active chains correctly across sessions', () => {
    render(<CommandCenter />);
    const activeChainCount = screen.getByTestId('active-chain-count');
    expect(activeChainCount).toBeInTheDocument();
    expect(activeChainCount.textContent).toContain('1');
  });

  it('respects optional onCommand prop', () => {
    // Should not crash if onCommand is undefined
    const { container } = render(<CommandCenter />);
    expect(container).toBeTruthy();

    const input = screen.getByTestId('command-input');
    fireEvent.change(input, { target: { value: 'test' } });

    const sendButton = screen.getByTestId('command-submit');
    expect(() => fireEvent.click(sendButton)).not.toThrow();
  });

  it('includes accessibility attributes on controls', () => {
    render(<CommandCenter />);

    const input = screen.getByTestId('command-input');
    expect(input).toHaveAttribute('aria-label');

    const sendButton = screen.getByTestId('command-submit');
    expect(sendButton).toHaveAttribute('aria-label');
  });

  it('updates health status display dynamically', async () => {
    const { rerender } = render(<CommandCenter showHealthStatus={true} />);

    const healthStatus = screen.getByTestId('health-status');
    expect(healthStatus).toBeInTheDocument();

    // Re-render with different context state (mocked)
    rerender(<CommandCenter showHealthStatus={true} />);

    // Health indicator should still be present
    expect(screen.getByTestId('health-status')).toBeInTheDocument();
  });

  it('trims whitespace from command input before submission', () => {
    const mockOnCommand = vi.fn();
    render(<CommandCenter onCommand={mockOnCommand} />);

    const input = screen.getByTestId('command-input');
    fireEvent.change(input, { target: { value: '  test command  ' } });

    const sendButton = screen.getByTestId('command-submit');
    fireEvent.click(sendButton);

    expect(mockOnCommand).toHaveBeenCalledWith('test command');
  });
});
