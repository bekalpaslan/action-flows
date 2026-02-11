import './App.css'
import './styles/themes/index.css'
import { ThemeProvider } from './contexts/ThemeContext'
import { WebSocketProvider } from './contexts/WebSocketContext'
import { SessionProvider } from './contexts/SessionContext'
import { WorkbenchProvider } from './contexts/WorkbenchContext'
import { UniverseProvider } from './contexts/UniverseContext'
import { ChatWindowProvider } from './contexts/ChatWindowContext'
import { VimNavigationProvider } from './contexts/VimNavigationContext'
import { DiscussProvider } from './contexts/DiscussContext'
import { NotificationGlowProvider } from './hooks/useNotificationGlow'
import { ToastProvider } from './contexts/ToastContext'
import AppContent from './components/AppContent'
import { CommandPalette } from './components/CommandPalette'
import { VimModeIndicator } from './components/VimModeIndicator'
import { useVimNavigation } from './hooks'

function AppWithVim() {
  useVimNavigation()

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
      <ToastProvider>
        <WebSocketProvider url="ws://localhost:3001/ws">
          <SessionProvider>
            <WorkbenchProvider>
              <UniverseProvider>
                <ChatWindowProvider>
                  <DiscussProvider>
                    <NotificationGlowProvider>
                      <VimNavigationProvider>
                        <AppWithVim />
                      </VimNavigationProvider>
                    </NotificationGlowProvider>
                  </DiscussProvider>
                </ChatWindowProvider>
              </UniverseProvider>
            </WorkbenchProvider>
          </SessionProvider>
        </WebSocketProvider>
      </ToastProvider>
    </ThemeProvider>
  )
}

export default App
