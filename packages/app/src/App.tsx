import './App.css'
import { WebSocketProvider } from './contexts/WebSocketContext'
import { WorkbenchProvider } from './contexts/WorkbenchContext'
import { VimNavigationProvider } from './contexts/VimNavigationContext'
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
    <WebSocketProvider url="ws://localhost:3001/ws">
      <WorkbenchProvider>
        <VimNavigationProvider>
          <AppWithVim />
        </VimNavigationProvider>
      </WorkbenchProvider>
    </WebSocketProvider>
  )
}

export default App
