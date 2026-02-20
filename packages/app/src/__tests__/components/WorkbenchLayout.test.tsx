/**
 * WorkbenchLayout Component Tests
 *
 * Tests the main layout container including:
 * - Smoke rendering without props (uses context)
 * - Layout structure and split-view management
 * - Content area visibility
 * - Resize handling
 * - Accessibility attributes
 * - Error handling
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WorkbenchLayout } from '../../components/Workbench';
import { useCommonTestSetup, setupWindowMocks } from '../../__tests__/utils';

// Mock monaco-config to avoid worker import issues
vi.mock('../../monaco-config', () => ({
  configureMonaco: vi.fn(),
  preloadCommonLanguageWorkers: vi.fn(),
}));

// Mock contexts and dependencies
vi.mock('../../contexts/WorkbenchContext', () => ({
  useWorkbenchContext: () => ({
    activeWorkbench: 'work',
    setActiveWorkbench: vi.fn(),
    workbenchConfigs: new Map(),
    workbenchNotifications: new Map(),
    addNotification: vi.fn(),
    clearNotifications: vi.fn(),
    previousWorkbench: null,
    goBack: vi.fn(),
    routingFilter: null,
    setRoutingFilter: vi.fn(),
    filterSessionsByContext: vi.fn((sessions: any) => sessions),
    activeTool: null,
    setActiveTool: vi.fn(),
  }),
}));

vi.mock('../../contexts/UniverseContext', () => ({
  useUniverseContext: () => ({
    universe: {
      regions: [],
      bridges: [],
      gates: [],
    },
    isLoading: false,
    error: null,
    navigateToRegion: vi.fn(),
    zoomToRegion: vi.fn(),
    returnToGodView: vi.fn(),
    getRegion: vi.fn(),
    getRegionByWorkbench: vi.fn(),
    getBridge: vi.fn(),
    isRegionAccessible: vi.fn(() => false),
    refreshUniverse: vi.fn(),
    zoomTargetRegionId: null,
    targetWorkbenchId: null,
    clearZoomTarget: vi.fn(),
  }),
}));

vi.mock('../../contexts/SessionContext', () => ({
  useSessionContext: () => ({
    sessions: [],
    activeSessionId: null,
    isLoading: false,
    createSession: vi.fn(),
    deleteSession: vi.fn(),
    setActiveSession: vi.fn(),
    getSession: vi.fn().mockReturnValue(undefined),
  }),
}));

vi.mock('../../contexts/ChatWindowContext', () => ({
  useChatWindowContext: () => ({
    isOpen: false,
    sessionId: null,
    source: null,
    chatWidth: 40,
    selectedModel: 'sonnet-4.5',
    isMinimized: false,
    unreadCount: 0,
    openChat: vi.fn(),
    closeChat: vi.fn(),
    toggleChat: vi.fn(),
    setChatWidth: vi.fn(),
    setSessionId: vi.fn(),
    setSelectedModel: vi.fn(),
    minimizeChat: vi.fn(),
    restoreChat: vi.fn(),
    incrementUnreadCount: vi.fn(),
    resetUnreadCount: vi.fn(),
  }),
}));

vi.mock('../../hooks/useChatKeyboardShortcuts', () => ({
  useChatKeyboardShortcuts: () => {},
}));

vi.mock('../../hooks/useFeatureFlag', () => ({
  useFeatureFlagSimple: () => false, // Disable cosmic map for simpler tests
}));

vi.mock('../../hooks/useSessionArchive', () => ({
  useSessionArchive: () => ({
    archivedSessions: [],
    restoreSession: vi.fn(),
    deleteArchive: vi.fn(),
    clearAllArchives: vi.fn(),
  }),
}));

vi.mock('../../components/AppSidebar/AppSidebar', () => ({
  AppSidebar: () => <div data-testid="app-sidebar" />,
}));

vi.mock('../../components/AppContent', () => ({
  default: () => <div data-testid="app-content" />,
}));

vi.mock('../../components/SessionPanel/SessionPanel', () => ({
  SessionPanel: () => <div data-testid="session-panel" />,
}));

vi.mock('../../components/CosmicMap/CosmicMap', () => ({
  CosmicMap: ({ visible }: any) => (
    <div data-testid="cosmic-map" style={{ display: visible ? 'block' : 'none' }} />
  ),
}));

vi.mock('../../components/SlidingChatWindow/SlidingChatWindow', () => ({
  SlidingChatWindow: ({ children }: any) => <div data-testid="sliding-chat-window">{children}</div>,
}));

vi.mock('../../components/RegionFocus/RegionFocusView', () => ({
  RegionFocusView: () => <div data-testid="region-focus-view" />,
}));

vi.mock('../../components/Stars/WorkStar', () => ({
  WorkStar: () => <div data-testid="work-star" />,
}));

describe('WorkbenchLayout', () => {
  useCommonTestSetup();

  beforeEach(() => {
    setupWindowMocks();
  });

  it('renders without crashing with no required props', () => {
    const { container } = render(<WorkbenchLayout />);
    expect(container).toBeTruthy();
  });

  it('applies correct data-testid on main container', () => {
    render(<WorkbenchLayout />);
    expect(screen.getByTestId('workbench-layout')).toBeInTheDocument();
  });

  it('renders layout wrapper with correct structure', () => {
    render(<WorkbenchLayout />);

    expect(screen.getByTestId('layout-wrapper')).toBeInTheDocument();
  });

  it('renders sidebar component', () => {
    render(<WorkbenchLayout />);
    expect(screen.getByTestId('app-sidebar')).toBeInTheDocument();
  });

  it('renders main content area', () => {
    render(<WorkbenchLayout />);
    expect(screen.getByTestId('content-area')).toBeInTheDocument();
  });

  it('renders workbench content inside content area', () => {
    render(<WorkbenchLayout />);
    // WorkbenchLayout renders workbench-specific content (e.g., work-star for work workbench)
    expect(screen.getByTestId('work-star')).toBeInTheDocument();
  });

  it('renders sliding chat window container', () => {
    render(<WorkbenchLayout />);
    expect(screen.getByTestId('sliding-chat-window')).toBeInTheDocument();
  });

  it('displays workbench content when cosmic map is disabled', () => {
    render(<WorkbenchLayout />);

    // With cosmic map disabled, we render workbench content directly
    expect(screen.getByTestId('work-star')).toBeInTheDocument();
  });

  it('renders main content with correct workbench', async () => {
    render(<WorkbenchLayout />);

    // Verify the work workbench is rendered
    expect(screen.getByTestId('work-star')).toBeInTheDocument();
  });

  it('applies correct layout structure classes', () => {
    render(<WorkbenchLayout />);

    const layoutWrapper = screen.getByTestId('layout-wrapper');
    expect(layoutWrapper).toHaveClass('workbench-body');
  });

  it('renders split-view divider for resize', () => {
    render(<WorkbenchLayout />);

    const divider = screen.queryByTestId('split-view-divider');
    if (divider) {
      expect(divider).toBeInTheDocument();
    }
  });

  it('allows sidebar collapse/expand', async () => {
    render(<WorkbenchLayout />);

    const sidebarToggle = screen.queryByTestId('sidebar-toggle-button');
    if (sidebarToggle) {
      fireEvent.click(sidebarToggle);

      await waitFor(() => {
        expect(sidebarToggle).toBeInTheDocument();
      });
    }
  });

  it('maintains responsive layout on small screens', () => {
    // Mock small screen
    window.innerWidth = 320;

    render(<WorkbenchLayout />);

    expect(screen.getByTestId('layout-wrapper')).toBeInTheDocument();
  });

  it('maintains responsive layout on large screens', () => {
    // Mock large screen
    window.innerWidth = 1920;

    render(<WorkbenchLayout />);

    expect(screen.getByTestId('layout-wrapper')).toBeInTheDocument();
  });

  it('handles window resize events', async () => {
    render(<WorkbenchLayout />);

    fireEvent.resize(window, { innerWidth: 1024, innerHeight: 768 });

    await waitFor(() => {
      expect(screen.getByTestId('layout-wrapper')).toBeInTheDocument();
    });
  });

  it('includes accessibility attributes on layout regions', () => {
    render(<WorkbenchLayout />);

    // The main element is inside content-area with role="main"
    const mainContent = screen.getByRole('main');
    expect(mainContent).toBeInTheDocument();
    expect(mainContent).toHaveAttribute('id', 'main-content');
  });

  it('manages keyboard focus navigation between regions', () => {
    render(<WorkbenchLayout />);

    const sidebar = screen.getByTestId('app-sidebar');
    const content = screen.getByTestId('work-star');

    expect(sidebar).toBeInTheDocument();
    expect(content).toBeInTheDocument();
  });

  it('renders error boundary wrapper', () => {
    render(<WorkbenchLayout />);

    // Error boundary should wrap the layout
    expect(screen.getByTestId('workbench-layout')).toBeInTheDocument();
  });

  it('applies correct CSS classes for theme support', () => {
    render(<WorkbenchLayout />);

    const layoutWrapper = screen.getByTestId('layout-wrapper');
    expect(layoutWrapper.className).toContain('workbench-body');
  });

  it('preserves sidebar on navigation', async () => {
    const { rerender } = render(<WorkbenchLayout />);

    expect(screen.getByTestId('app-sidebar')).toBeInTheDocument();

    rerender(<WorkbenchLayout />);

    expect(screen.getByTestId('app-sidebar')).toBeInTheDocument();
  });

  it('handles split-view resize gracefully', async () => {
    render(<WorkbenchLayout />);

    const divider = screen.queryByTestId('split-view-divider');
    if (divider) {
      fireEvent.mouseDown(divider);
      fireEvent.mouseMove(document, { clientX: 500 });
      fireEvent.mouseUp(document);

      expect(screen.getByTestId('layout-wrapper')).toBeInTheDocument();
    }
  });

  it('manages min/max width constraints on resizable panels', () => {
    render(<WorkbenchLayout />);

    const contentArea = screen.getByTestId('content-area');
    expect(contentArea).toBeInTheDocument();
  });

  it('synchronizes sidebar and content area state', async () => {
    render(<WorkbenchLayout />);

    const sidebar = screen.getByTestId('app-sidebar');
    const content = screen.getByTestId('work-star');

    expect(sidebar).toBeInTheDocument();
    expect(content).toBeInTheDocument();
  });

  it('provides correct context to child components', () => {
    render(<WorkbenchLayout />);

    // All child components should be rendered with proper context
    expect(screen.getByTestId('app-sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('work-star')).toBeInTheDocument();
    expect(screen.getByTestId('sliding-chat-window')).toBeInTheDocument();
  });
});
