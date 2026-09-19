import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { LandingPage } from './pages/LandingPage'
import { ChatInterface } from './components/ChatInterface'
import { ErrorBoundary } from './components/error-boundary'
import { PrivacyPage, TermsPage } from './pages/LegalPage'
import { ChangelogPage } from './pages/ChangelogPage'

// /chat terbuka untuk semua — login (Google) diminta lewat popup saat user
// mencoba mengirim pesan tanpa session.
function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/chat" element={<ChatInterface />} />
          <Route path="/chat/:convId" element={<ChatInterface />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/changelog" element={<ChangelogPage />} />
          <Route path="*" element={<LandingPage />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  )
}

export default App
