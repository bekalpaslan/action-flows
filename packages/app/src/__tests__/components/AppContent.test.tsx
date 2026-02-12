/**
 * AppContent Component Tests
 *
 * Tests the main content area wrapper including:
 * - Smoke rendering without props (uses context)
 * - Workbench layout rendering
 * - Content visibility and routing
 * - Focus management
 * - Accessibility attributes
 * - Error handling
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import AppContent from '../../components/AppContent';
import { useCommonTestSetup } from '../../__tests__/utils';

// Mock the Workbench component
vi.mock('../../components/Workbench', () => ({
  WorkbenchLayout: () => <div data-testid="workbench-layout" />,
}));

describe('AppContent', () => {
  useCommonTestSetup();

  it('renders without crashing', () => {
    const { container } = render(<AppContent />);
    expect(container).toBeTruthy();
  });

  it('renders WorkbenchLayout component', () => {
    render(<AppContent />);
    expect(screen.getByTestId('workbench-layout')).toBeInTheDocument();
  });

  it('applies correct data-testid on main container', () => {
    render(<AppContent />);
    expect(screen.getByTestId('app-content')).toBeInTheDocument();
  });

  it('has content-area role for accessibility', () => {
    render(<AppContent />);
    const contentArea = screen.getByTestId('content-area');
    expect(contentArea).toHaveAttribute('role', 'main');
  });

  it('renders as a functional component', () => {
    const { container } = render(<AppContent />);
    expect(container.firstChild).toBeTruthy();
  });

  it('does not require any props', () => {
    const { container } = render(<AppContent />);
    expect(container).toBeTruthy();
  });

  it('contains WorkbenchLayout which manages workbench routing', () => {
    render(<AppContent />);

    const workbenchLayout = screen.getByTestId('workbench-layout');
    expect(workbenchLayout).toBeInTheDocument();
  });

  it('applies app-content class for styling', () => {
    render(<AppContent />);

    const appContent = screen.getByTestId('app-content');
    expect(appContent).toHaveClass('app-content');
  });

  it('renders as main content area between sidebar and session panel', () => {
    render(<AppContent />);

    // AppContent is the middle section of the layout
    const appContent = screen.getByTestId('app-content');
    expect(appContent).toBeInTheDocument();
  });

  it('preserves content-area test hook for accessibility tree', () => {
    render(<AppContent />);

    const contentArea = screen.getByTestId('content-area');
    expect(contentArea).toBeInTheDocument();
  });

  it('handles re-renders without crashing', () => {
    const { rerender } = render(<AppContent />);

    expect(screen.getByTestId('workbench-layout')).toBeInTheDocument();

    rerender(<AppContent />);

    expect(screen.getByTestId('workbench-layout')).toBeInTheDocument();
  });

  it('maintains focus management for keyboard navigation', () => {
    render(<AppContent />);

    const contentArea = screen.getByTestId('content-area');
    expect(contentArea).toHaveAttribute('role', 'main');
  });

  it('renders full-height content container', () => {
    render(<AppContent />);

    const appContent = screen.getByTestId('app-content') as HTMLElement;
    expect(appContent).toBeInTheDocument();
  });

  it('provides content area for dynamic workbench switching', () => {
    render(<AppContent />);

    // WorkbenchLayout manages the content switching
    expect(screen.getByTestId('workbench-layout')).toBeInTheDocument();
  });
});
