import './App.css'
import './styles/themes/index.css'
import { ThemeProvider } from './contexts/ThemeContext'
import { WebSocketProvider } from './contexts/WebSocketContext'
import { WorkbenchProvider } from './contexts/WorkbenchContext'
import { VimNavigationProvider } from './contexts/VimNavigationContext'
import { NotificationGlowProvider } from './hooks/useNotificationGlow'
import AppContent from './components/AppContent'
import { CommandPalette } from './components/CommandPalette'
import { VimModeIndicator } from './components/VimModeIndicator'
import { useVimNavigation } from './hooks'

function AppWithVim() {
  useVimNavigation()

  return (
    <>
      <AppContent />
      <CommandPalette />
      <VimModeIndicator />
    </>
  )
}

function App() {
  return (
    <ThemeProvider>
      <WebSocketProvider url="ws://localhost:3001/ws">
        <WorkbenchProvider>
          <NotificationGlowProvider>
            <VimNavigationProvider>
              <AppWithVim />
            </VimNavigationProvider>
          </NotificationGlowProvider>
        </WorkbenchProvider>
      </WebSocketProvider>
    </ThemeProvider>
  )
}

export default App
