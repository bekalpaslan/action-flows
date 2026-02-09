import './App.css'
import { WebSocketProvider } from './contexts/WebSocketContext'
import { WorkbenchProvider } from './contexts/WorkbenchContext'
import AppContent from './components/AppContent'
import { CommandPalette } from './components/CommandPalette'

function App() {
  return (
    <WebSocketProvider url="ws://localhost:3001/ws">
      <WorkbenchProvider>
        <AppContent />
        <CommandPalette />
      </WorkbenchProvider>
    </WebSocketProvider>
  )
}

export default App
