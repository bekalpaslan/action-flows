/**
 * Test Utilities
 *
 * Provides custom render function with all required context providers.
 * This ensures components that depend on context hooks can be tested properly.
 */

import { ReactElement, ReactNode } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { ThemeProvider } from '../contexts/ThemeContext';
import { FeatureFlagsProvider } from '../contexts/FeatureFlagsContext';
import { ToastProvider } from '../contexts/ToastContext';
import { WebSocketProvider } from '../contexts/WebSocketContext';
import { DashboardCapabilityProvider } from '../capabilities/DashboardCapabilityProvider';
import { AuthProvider } from '../contexts/AuthContext';
import { SessionProvider } from '../contexts/SessionContext';
import { WorkbenchProvider } from '../contexts/WorkbenchContext';
import { UniverseProvider } from '../contexts/UniverseContext';
import { DiscoveryProvider } from '../contexts/DiscoveryContext';
import { ChatWindowProvider } from '../contexts/ChatWindowContext';
import { DiscussProvider } from '../contexts/DiscussContext';
import { NotificationGlowProvider } from '../hooks/useNotificationGlow';
import { VimNavigationProvider } from '../contexts/VimNavigationContext';

/**
 * Test provider wrapper props
 */
interface TestProvidersProps {
  children: ReactNode;
}

/**
 * Wraps components with all required providers for testing
 * Mirrors the provider tree in App.tsx to ensure components behave
 * the same way in tests as they do in the actual application.
 */
function TestProviders({ children }: TestProvidersProps) {
  return (
    <ThemeProvider>
      <FeatureFlagsProvider>
        <ToastProvider>
          <WebSocketProvider url="ws://localhost:3001/ws">
            <DashboardCapabilityProvider>
              <AuthProvider>
                <SessionProvider>
                  <WorkbenchProvider>
                    <UniverseProvider>
                      <DiscoveryProvider>
                        <ChatWindowProvider>
                          <DiscussProvider>
                            <NotificationGlowProvider>
                              <VimNavigationProvider>
                                {children}
                              </VimNavigationProvider>
                            </NotificationGlowProvider>
                          </DiscussProvider>
                        </ChatWindowProvider>
                      </DiscoveryProvider>
                    </UniverseProvider>
                  </WorkbenchProvider>
                </SessionProvider>
              </AuthProvider>
            </DashboardCapabilityProvider>
          </WebSocketProvider>
        </ToastProvider>
      </FeatureFlagsProvider>
    </ThemeProvider>
  );
}

/**
 * Custom render function that wraps components with test providers
 *
 * Usage:
 * ```tsx
 * import { renderWithProviders } from '@/__tests__/test-utils';
 *
 * const { container } = renderWithProviders(<YourComponent />);
 * ```
 */
function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { wrapper: TestProviders, ...options });
}

// Re-export everything from @testing-library/react
export * from '@testing-library/react';

// Export custom render as both named and default
export { renderWithProviders };
export { renderWithProviders as render };
