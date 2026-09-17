import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { LandingPage } from './pages/LandingPage'
import { ChatInterface } from './components/ChatInterface'
import { ErrorBoundary } from './components/error-boundary'

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/chat" element={<ChatInterface />} />
          <Route path="/chat/:convId" element={<ChatInterface />} />
          <Route path="*" element={<LandingPage />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  )
}

export default App



