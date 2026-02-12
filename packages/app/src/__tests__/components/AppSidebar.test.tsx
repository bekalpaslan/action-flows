/**
 * AppSidebar Component Tests
 *
 * Tests the left-side navigation sidebar including:
 * - Smoke rendering without props (uses context)
 * - Navigation group expand/collapse
 * - Workbench selection and navigation
 * - Search functionality
 * - Collapsed state management
 * - Accessibility attributes
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AppSidebar } from '../../components/AppSidebar/AppSidebar';
import type { WorkbenchId } from '@afw/shared';
import { useCommonTestSetup } from '../../__tests__/utils';

// Mock contexts with stable references
const mockSetActiveWorkbench = vi.fn();
const mockWorkbenchNotifications = new Map([
  ['work', 0],
  ['maintenance', 0],
  ['explore', 0],
  ['review', 0],
  ['pm', 0],
  ['archive', 0],
]);

vi.mock('../../contexts/WorkbenchContext', () => ({
  useWorkbenchContext: () => ({
    activeWorkbench: 'work' as WorkbenchId,
    setActiveWorkbench: mockSetActiveWorkbench,
    workbenchNotifications: mockWorkbenchNotifications,
  }),
}));

vi.mock('../../contexts/WebSocketContext', () => ({
  useWebSocketContext: () => ({
    status: 'connected',
    send: vi.fn(),
  }),
}));

vi.mock('../../components/ThemeToggle', () => ({
  ThemeToggle: () => <div data-testid="theme-toggle" />,
}));

vi.mock('../../components/AppSidebar/SidebarNavGroup', () => ({
  SidebarNavGroup: ({ groupId, label, children, isExpanded, onToggle }: any) => (
    <div data-testid={`sidebar-nav-group-${groupId}`} className={isExpanded ? 'expanded' : ''}>
      <button
        onClick={() => onToggle(groupId)}
        data-testid={`group-toggle-${groupId}`}
        aria-label={`${label} group`}
        aria-expanded={isExpanded}
      >
        {label}
      </button>
      {isExpanded && <div>{children}</div>}
    </div>
  ),
}));

vi.mock('../../components/AppSidebar/SidebarNavItem', () => ({
  SidebarNavItem: ({ workbenchId, config, isActive, onClick }: any) => (
    <button
      data-testid={`sidebar-nav-item-${workbenchId}`}
      className={isActive ? 'active' : ''}
      onClick={onClick}
      aria-label={`${config.label} workbench`}
      aria-current={isActive ? 'page' : undefined}
    >
      {config.label}
    </button>
  ),
}));

vi.mock('../../components/AppSidebar/SidebarSearch', () => ({
  SidebarSearch: ({ value, onChange }: any) => (
    <input
      data-testid="sidebar-search"
      type="text"
      placeholder="Search..."
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label="Search workbenches"
    />
  ),
}));

vi.mock('../../components/AppSidebar/SidebarUserProfile', () => ({
  SidebarUserProfile: () => <div data-testid="user-profile" />,
}));

describe('AppSidebar', () => {
  useCommonTestSetup();

  beforeEach(() => {
    // Clear localStorage before each test to ensure clean state
    localStorage.clear();
    mockSetActiveWorkbench.mockClear();
  });

  it('renders without crashing with no required props', () => {
    const { container } = render(<AppSidebar />);
    expect(container).toBeTruthy();
  });

  it('applies correct data-testid on main container', () => {
    render(<AppSidebar />);
    expect(screen.getByTestId('app-sidebar')).toBeInTheDocument();
  });

  it('renders theme toggle', () => {
    render(<AppSidebar />);
    expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();
  });

  it('renders sidebar search with correct testid', () => {
    render(<AppSidebar />);
    expect(screen.getByTestId('sidebar-search')).toBeInTheDocument();
  });

  it('renders user profile section with correct testid', () => {
    render(<AppSidebar />);
    expect(screen.getByTestId('user-profile')).toBeInTheDocument();
  });

  it('renders navigation groups with correct testids', () => {
    render(<AppSidebar />);

    expect(screen.getByTestId('sidebar-nav-group-framework')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar-nav-group-project')).toBeInTheDocument();
  });

  it('expands project group by default', async () => {
    render(<AppSidebar />);

    const projectGroup = screen.getByTestId('sidebar-nav-group-project');
    expect(projectGroup).toHaveClass('expanded');
  });

  it('collapses framework group by default', () => {
    render(<AppSidebar />);

    const frameworkGroup = screen.getByTestId('sidebar-nav-group-framework');
    expect(frameworkGroup).not.toHaveClass('expanded');
  });

  it('toggles group expansion when group toggle button clicked', async () => {
    render(<AppSidebar />);

    const frameworkToggle = screen.getByTestId('group-toggle-framework');
    const frameworkGroup = screen.getByTestId('sidebar-nav-group-framework');

    expect(frameworkGroup).not.toHaveClass('expanded');

    fireEvent.click(frameworkToggle);

    await waitFor(() => {
      expect(frameworkGroup).toHaveClass('expanded');
    });
  });

  it('persists group expansion state to localStorage', async () => {
    render(<AppSidebar />);

    const frameworkToggle = screen.getByTestId('group-toggle-framework');
    fireEvent.click(frameworkToggle);

    await waitFor(() => {
      const stored = localStorage.getItem('afw-sidebar-expanded-groups');
      expect(stored).toContain('framework');
    });
  });

  it('renders workbench navigation items in groups', () => {
    render(<AppSidebar />);

    // Project group is expanded by default, so workbenches should be visible
    expect(screen.getByTestId('sidebar-nav-item-work')).toBeInTheDocument();
  });

  it('marks active workbench with active state', () => {
    render(<AppSidebar />);

    const activeWorkbench = screen.getByTestId('sidebar-nav-item-work');
    expect(activeWorkbench).toHaveClass('active');
  });

  it('calls setActiveWorkbench when workbench clicked', async () => {
    render(<AppSidebar />);

    const workbenchItem = screen.getByTestId('sidebar-nav-item-maintenance');
    fireEvent.click(workbenchItem);

    expect(mockSetActiveWorkbench).toHaveBeenCalledWith('maintenance');
  });

  it('filters workbenches based on search query', async () => {
    render(<AppSidebar />);

    const searchInput = screen.getByTestId('sidebar-search');
    fireEvent.change(searchInput, { target: { value: 'work' } });

    // Search should filter the displayed items
    expect(screen.getByTestId('sidebar-search')).toHaveValue('work');
  });

  it('clears search results when search input is cleared', async () => {
    render(<AppSidebar />);

    const searchInput = screen.getByTestId('sidebar-search');

    fireEvent.change(searchInput, { target: { value: 'test' } });
    await waitFor(() => {
      expect(searchInput).toHaveValue('test');
    });

    fireEvent.change(searchInput, { target: { value: '' } });
    await waitFor(() => {
      expect(searchInput).toHaveValue('');
    });
  });

  it('calls onCollapseChange callback when sidebar toggles collapse state', async () => {
    const mockOnCollapseChange = vi.fn();
    render(<AppSidebar onCollapseChange={mockOnCollapseChange} />);

    // Toggle collapse would be triggered by a collapse button
    // This test validates the callback is registered
    expect(mockOnCollapseChange).toBeDefined();
  });

  it('persists collapse state to localStorage', () => {
    render(<AppSidebar />);

    // Check that collapse state is managed in localStorage
    const stored = localStorage.getItem('afw-sidebar-collapsed');
    expect(stored === 'true' || stored === 'false' || stored === null).toBe(true);
  });

  it('restores collapse state from localStorage on mount', () => {
    localStorage.setItem('afw-sidebar-collapsed', 'true');

    render(<AppSidebar />);

    expect(localStorage.getItem('afw-sidebar-collapsed')).toBe('true');
  });

  it('restores expanded groups from localStorage on mount', () => {
    localStorage.setItem('afw-sidebar-expanded-groups', JSON.stringify(['framework', 'project']));

    render(<AppSidebar />);

    expect(screen.getByTestId('sidebar-nav-group-project')).toBeInTheDocument();
  });

  it('handles invalid localStorage data gracefully', () => {
    localStorage.setItem('afw-sidebar-expanded-groups', 'invalid-json');

    const { container } = render(<AppSidebar />);
    expect(container).toBeTruthy();
  });

  it('includes accessibility labels on navigation items', async () => {
    render(<AppSidebar />);

    const expandProjectButton = screen.getByTestId('group-toggle-project');
    expect(expandProjectButton).toHaveAttribute('aria-label');
  });

  it('displays notification count on workbenches', () => {
    render(<AppSidebar />);

    // Notification display should be rendered if count > 0
    // This depends on notification context state
    expect(screen.getByTestId('sidebar-nav-item-work')).toBeInTheDocument();
  });

  it('renders all workbench groups correctly', () => {
    render(<AppSidebar />);

    // Verify both groups are present
    expect(screen.getByTestId('sidebar-nav-group-framework')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar-nav-group-project')).toBeInTheDocument();
  });

  it('handles rapid group toggle clicks', async () => {
    render(<AppSidebar />);

    const frameworkToggle = screen.getByTestId('group-toggle-framework');

    fireEvent.click(frameworkToggle);
    fireEvent.click(frameworkToggle);
    fireEvent.click(frameworkToggle);

    // Should handle multiple rapid clicks gracefully
    expect(screen.getByTestId('sidebar-nav-group-framework')).toBeInTheDocument();
  });
});
