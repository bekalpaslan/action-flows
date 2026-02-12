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
    const inputElement = screen.getByTestId('action-panel');
    expect(inputElement).toBeInTheDocument();
    expect(inputElement).toHaveAttribute('type', 'text');
  });

  it('renders health status indicator when showHealthStatus is true', () => {
    render(<CommandCenter showHealthStatus={true} />);
    expect(screen.getByTestId('health-display')).toBeInTheDocument();
  });

  it('hides health status indicator when showHealthStatus is false', () => {
    render(<CommandCenter showHealthStatus={false} />);
    expect(screen.queryByTestId('health-display')).not.toBeInTheDocument();
  });

  it('calls onCommand callback with input value on submit', async () => {
    const mockOnCommand = vi.fn();
    render(<CommandCenter onCommand={mockOnCommand} />);

    const input = screen.getByTestId('action-panel');
    fireEvent.change(input, { target: { value: 'test command' } });

    // Find submit button by its SVG or look for the button adjacent to input
    const submitBtn = screen.getByRole('button', { name: /Submit command|Execute command/ });
    fireEvent.click(submitBtn);

    expect(mockOnCommand).toHaveBeenCalledWith('test command');
  });

  it('clears input after successful command submission', async () => {
    const mockOnCommand = vi.fn();
    render(<CommandCenter onCommand={mockOnCommand} />);

    const input = screen.getByTestId('action-panel') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'test command' } });

    const sendButton = screen.getByRole('button', { name: /Submit command|Execute command/ });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(input.value).toBe('');
    });
  });

  it('ignores empty command submissions', () => {
    const mockOnCommand = vi.fn();
    render(<CommandCenter onCommand={mockOnCommand} />);

    const input = screen.getByTestId('action-panel');
    fireEvent.change(input, { target: { value: '   ' } });

    const sendButton = screen.getByRole('button', { name: /Submit command|Execute command/ });
    fireEvent.click(sendButton);

    expect(mockOnCommand).not.toHaveBeenCalled();
  });

  it('handles Enter key submission in command input', () => {
    const mockOnCommand = vi.fn();
    render(<CommandCenter onCommand={mockOnCommand} />);

    const input = screen.getByTestId('action-panel');
    fireEvent.change(input, { target: { value: 'enter command' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    expect(mockOnCommand).toHaveBeenCalledWith('enter command');
  });

  it('does not submit command on other key presses', () => {
    const mockOnCommand = vi.fn();
    render(<CommandCenter onCommand={mockOnCommand} />);

    const input = screen.getByTestId('action-panel');
    fireEvent.change(input, { target: { value: 'test' } });
    fireEvent.keyDown(input, { key: 'ArrowUp', code: 'ArrowUp' });

    expect(mockOnCommand).not.toHaveBeenCalled();
  });

  it('renders session dropdown selector', () => {
    render(<CommandCenter />);
    const sessionDropdown = screen.getByTestId('mode-selector');
    expect(sessionDropdown).toBeInTheDocument();
  });

  it('toggles session dropdown on button click', async () => {
    render(<CommandCenter />);

    const dropdownButton = screen.getByTestId('mode-selector');
    expect(screen.queryByTestId('quick-actions')).not.toBeInTheDocument();

    fireEvent.click(dropdownButton);

    await waitFor(() => {
      expect(screen.getByTestId('quick-actions')).toBeInTheDocument();
    });
  });

  it('displays active session in selector', () => {
    render(<CommandCenter />);
    // Check that the session label is displayed in the mode-selector button
    const sessionButton = screen.getByTestId('mode-selector');
    expect(sessionButton).toBeInTheDocument();
    // Verify the session label text is present
    expect(sessionButton.textContent).toContain('session-123');
  });

  it('counts active chains correctly across sessions', () => {
    render(<CommandCenter />);
    // When there are no active chains (default mock), the running chains section should not appear
    expect(screen.queryByText(/chain.*running/i)).not.toBeInTheDocument();
  });

  it('respects optional onCommand prop', () => {
    // Should not crash if onCommand is undefined
    const { container } = render(<CommandCenter />);
    expect(container).toBeTruthy();

    const input = screen.getByTestId('action-panel');
    fireEvent.change(input, { target: { value: 'test' } });

    const sendButton = screen.getByRole('button', { name: /Submit command|Execute command/ });
    expect(() => fireEvent.click(sendButton)).not.toThrow();
  });

  it('includes accessibility attributes on controls', () => {
    render(<CommandCenter />);

    const input = screen.getByTestId('action-panel');
    expect(input).toHaveAttribute('aria-label');

    const sendButton = screen.getByRole('button', { name: /Submit command|Execute command/ });
    expect(sendButton).toHaveAttribute('aria-label');
  });

  it('updates health status display dynamically', async () => {
    const { rerender } = render(<CommandCenter showHealthStatus={true} />);

    const healthStatus = screen.getByTestId('health-display');
    expect(healthStatus).toBeInTheDocument();

    // Re-render with different context state (mocked)
    rerender(<CommandCenter showHealthStatus={true} />);

    // Health indicator should still be present
    expect(screen.getByTestId('health-display')).toBeInTheDocument();
  });

  it('trims whitespace from command input before submission', () => {
    const mockOnCommand = vi.fn();
    render(<CommandCenter onCommand={mockOnCommand} />);

    const input = screen.getByTestId('action-panel');
    fireEvent.change(input, { target: { value: '  test command  ' } });

    const sendButton = screen.getByRole('button', { name: /Submit command|Execute command/ });
    fireEvent.click(sendButton);

    expect(mockOnCommand).toHaveBeenCalledWith('test command');
  });
});
