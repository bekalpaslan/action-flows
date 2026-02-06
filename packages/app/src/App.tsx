import './App.css'
import { WebSocketProvider } from './contexts/WebSocketContext'
import AppContent from './components/AppContent'

function App() {
  return (
    <WebSocketProvider url="ws://localhost:3001/ws">
      <AppContent />
    </WebSocketProvider>
  )
}

export default App
