import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { LandingPage } from './pages/LandingPage'
import { ChatInterface } from './components/ChatInterface'
import { ErrorBoundary } from './components/error-boundary'
import { isAuthenticated } from './lib/auth'

// /chat butuh session token. Tanpa token, pengguna dikembalikan ke landing
// tempat tombol "Masuk dengan Google" tersedia.
function ProtectedChat() {
  if (!isAuthenticated()) return <Navigate to="/" replace />
  return <ChatInterface />
}

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/chat" element={<ProtectedChat />} />
          <Route path="/chat/:convId" element={<ProtectedChat />} />
          <Route path="*" element={<LandingPage />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  )
}

export default App
