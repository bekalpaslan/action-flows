import './App.css'
import { WebSocketProvider } from './contexts/WebSocketContext'
import { WorkbenchProvider } from './contexts/WorkbenchContext'
import AppContent from './components/AppContent'

function App() {
  return (
    <WebSocketProvider url="ws://localhost:3001/ws">
      <WorkbenchProvider>
        <AppContent />
      </WorkbenchProvider>
    </WebSocketProvider>
  )
}

export default App
