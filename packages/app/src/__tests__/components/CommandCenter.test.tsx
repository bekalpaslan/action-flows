/**
 * CommandCenter Component Tests
 *
 * Tests the streamlined command center bottom bar including:
 * - Smoke rendering
 * - Session selector dropdown behavior
 * - Session -> workbench navigation wiring
 * - Health status display
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CommandCenter } from '../../components/CosmicMap/CommandCenter';
import type { SessionId, Session, WorkbenchId } from '@afw/shared';
import { useCommonTestSetup, createMockSession, createMockChain } from '../../__tests__/utils';

const mockSetActiveSession = vi.fn();
const mockNavigateToRegion = vi.fn();
const mockGetRegionByWorkbench = vi.fn();
const mockSetActiveWorkbench = vi.fn();

// Mock contexts
vi.mock('../../contexts/SessionContext', () => ({
  useSessionContext: () => ({
    sessions: [
      createMockSession({
        id: 'session-123' as SessionId,
        chains: [createMockChain({ id: 'chain-1' })],
        workbenchId: 'review' as WorkbenchId,
      }),
      createMockSession({
        id: 'session-456' as SessionId,
        chains: [createMockChain({ id: 'chain-2' })],
        workbenchId: 'pm' as WorkbenchId,
      }),
    ] as Session[],
    activeSessionId: 'session-123' as SessionId,
    isLoading: false,
    createSession: vi.fn(),
    deleteSession: vi.fn(),
    setActiveSession: mockSetActiveSession,
    getSession: vi.fn(),
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
    isLoading: false,
    error: null,
    navigateToRegion: mockNavigateToRegion,
    zoomToRegion: vi.fn(),
    returnToGodView: vi.fn(),
    getRegion: vi.fn(),
    getRegionByWorkbench: mockGetRegionByWorkbench,
    getBridge: vi.fn(),
    isRegionAccessible: vi.fn(() => false),
    refreshUniverse: vi.fn(),
    zoomTargetRegionId: null,
    targetWorkbenchId: null,
    clearZoomTarget: vi.fn(),
  }),
}));

vi.mock('../../contexts/WorkbenchContext', () => ({
  useWorkbenchContext: () => ({
    activeWorkbench: 'work' as WorkbenchId,
    setActiveWorkbench: mockSetActiveWorkbench,
    workbenchConfigs: new Map(),
    workbenchNotifications: new Map(),
    addNotification: vi.fn(),
    clearNotifications: vi.fn(),
    previousWorkbench: null,
    goBack: vi.fn(),
    routingFilter: null,
    setRoutingFilter: vi.fn(),
    filterSessionsByContext: vi.fn((sessions: Session[]) => sessions),
    activeTool: null,
    setActiveTool: vi.fn(),
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

  beforeEach(() => {
    mockSetActiveSession.mockReset();
    mockNavigateToRegion.mockReset();
    mockGetRegionByWorkbench.mockReset();
    mockSetActiveWorkbench.mockReset();
  });

  it('renders without crashing', () => {
    const { container } = render(<CommandCenter />);
    expect(container).toBeTruthy();
  });

  it('renders command center container and session dropdown selector', () => {
    render(<CommandCenter />);
    expect(screen.getByTestId('command-center')).toBeInTheDocument();
    expect(screen.getByTestId('mode-selector')).toBeInTheDocument();
  });

  it('does not render command input textbox', () => {
    render(<CommandCenter />);
    expect(screen.queryByTestId('action-panel')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Submit command|Execute command/i })
    ).not.toBeInTheDocument();
  });

  it('renders health status indicator when showHealthStatus is true', () => {
    render(<CommandCenter showHealthStatus={true} />);
    expect(screen.getByTestId('health-display')).toBeInTheDocument();
  });

  it('hides health status indicator when showHealthStatus is false', () => {
    render(<CommandCenter showHealthStatus={false} />);
    expect(screen.queryByTestId('health-display')).not.toBeInTheDocument();
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

  it('selecting a session sets active session and navigates to its region when available', async () => {
    mockGetRegionByWorkbench.mockReturnValueOnce({ id: 'region-review' });

    render(<CommandCenter />);
    fireEvent.click(screen.getByTestId('mode-selector'));

    const option = await screen.findByRole('option', { name: /session-456/i });
    fireEvent.click(option);

    expect(mockSetActiveSession).toHaveBeenCalledWith('session-456');
    expect(mockGetRegionByWorkbench).toHaveBeenCalledWith('pm');
    expect(mockNavigateToRegion).toHaveBeenCalledWith('region-review');
    expect(mockSetActiveWorkbench).not.toHaveBeenCalled();
  });

  it('falls back to direct workbench switch when no region exists', async () => {
    mockGetRegionByWorkbench.mockReturnValueOnce(undefined);

    render(<CommandCenter />);
    fireEvent.click(screen.getByTestId('mode-selector'));

    const option = await screen.findByRole('option', { name: /session-456/i });
    fireEvent.click(option);

    expect(mockSetActiveSession).toHaveBeenCalledWith('session-456');
    expect(mockSetActiveWorkbench).toHaveBeenCalledWith('pm');
    expect(mockNavigateToRegion).not.toHaveBeenCalled();
  });
});
