import './App.css'
import './styles/themes/index.css'
import { ThemeProvider } from './contexts/ThemeContext'
import { FeatureFlagsProvider } from './contexts/FeatureFlagsContext'
import { WebSocketProvider } from './contexts/WebSocketContext'
import { SessionProvider } from './contexts/SessionContext'
import { WorkbenchProvider } from './contexts/WorkbenchContext'
import { UniverseProvider } from './contexts/UniverseContext'
import { DiscoveryProvider } from './contexts/DiscoveryContext'
import { ChatWindowProvider } from './contexts/ChatWindowContext'
import { VimNavigationProvider } from './contexts/VimNavigationContext'
import { DiscussProvider } from './contexts/DiscussContext'
import { NotificationGlowProvider } from './hooks/useNotificationGlow'
import { ToastProvider } from './contexts/ToastContext'
import AppContent from './components/AppContent'
import { CommandPalette } from './components/CommandPalette'
import { VimModeIndicator } from './components/VimModeIndicator'
import { useVimNavigation } from './hooks'
import { useServiceWorker } from './hooks/useServiceWorker'

function AppWithVim() {
  useVimNavigation()

  // Register service worker for offline caching
  useServiceWorker()

  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <AppContent />
      <CommandPalette />
      <VimModeIndicator />
    </>
  )
}

function App() {
  return (
    <ThemeProvider>
      <FeatureFlagsProvider>
        <ToastProvider>
          <WebSocketProvider url="ws://localhost:3001/ws">
            <SessionProvider>
              <WorkbenchProvider>
                <UniverseProvider>
                  <DiscoveryProvider>
                    <ChatWindowProvider>
                      <DiscussProvider>
                        <NotificationGlowProvider>
                          <VimNavigationProvider>
                            <AppWithVim />
                          </VimNavigationProvider>
                        </NotificationGlowProvider>
                      </DiscussProvider>
                    </ChatWindowProvider>
                  </DiscoveryProvider>
                </UniverseProvider>
              </WorkbenchProvider>
            </SessionProvider>
          </WebSocketProvider>
        </ToastProvider>
      </FeatureFlagsProvider>
    </ThemeProvider>
  )
}

export default App
