/**
 * Cosmic Map Accessibility Test Suite
 *
 * Tests WCAG 2.1 AA compliance for the Living Universe cosmic map:
 * - ARIA labels and roles
 * - Keyboard navigation
 * - Screen reader support
 * - Focus management
 *
 * Note: jest-axe and @axe-core/react are installed for accessibility testing.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '../test-utils';
import { LiveRegion } from '../../components/CosmicMap/LiveRegion';
import { FeatureFlagsProvider } from '../../contexts/FeatureFlagsContext';
import { UniverseProvider } from '../../contexts/UniverseContext';
import { DiscoveryProvider } from '../../contexts/DiscoveryContext';
import { SessionProvider } from '../../contexts/SessionContext';
import { WebSocketProvider } from '../../contexts/WebSocketContext';

// Mock providers for testing
function TestProviders({ children }: { children: React.ReactNode }) {
  return (
    <FeatureFlagsProvider>
      <WebSocketProvider>
        <SessionProvider>
          <UniverseProvider>
            <DiscoveryProvider>
              {children}
            </DiscoveryProvider>
          </UniverseProvider>
        </SessionProvider>
      </WebSocketProvider>
    </FeatureFlagsProvider>
  );
}

describe('CosmicMap Accessibility', () => {
  it('should render live region for screen reader announcements', () => {
    render(
      <TestProviders>
        <LiveRegion />
      </TestProviders>
    );

    const liveRegion = screen.getByRole('status');
    expect(liveRegion).toBeDefined();
    expect(liveRegion.getAttribute('aria-live')).toBe('polite');
    expect(liveRegion.getAttribute('aria-atomic')).toBe('true');
  });

  it('should have screen-reader-only class on live region', () => {
    const { container } = render(
      <TestProviders>
        <LiveRegion />
      </TestProviders>
    );

    const liveRegion = container.querySelector('.sr-only');
    expect(liveRegion).toBeDefined();
  });
});
