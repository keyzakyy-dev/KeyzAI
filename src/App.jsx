import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { LandingPage } from './pages/LandingPage'
import { ChatInterface } from './components/ChatInterface'
import { ErrorBoundary } from './components/error-boundary'
import { PrivacyPage, TermsPage } from './pages/LegalPage'
import { ChangelogPage } from './pages/ChangelogPage'
import { PrdBuilderPage } from './pages/PrdBuilderPage'
import { PrdHistoryProvider } from './hooks/usePrdHistory'

// /chat terbuka untuk semua — login (Google) diminta lewat popup saat user
// mencoba mengirim pesan tanpa session.
function App() {
  return (
    <ErrorBoundary>
      <Router>
        <PrdHistoryProvider>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/chat" element={<ChatInterface />} />
            <Route path="/chat/:convId" element={<ChatInterface />} />
            <Route path="/prd-builder" element={<PrdBuilderPage />} />
            <Route path="/prd-builder/:projectId" element={<PrdBuilderPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/changelog" element={<ChangelogPage />} />
            <Route path="*" element={<LandingPage />} />
          </Routes>
        </PrdHistoryProvider>
      </Router>
    </ErrorBoundary>
  )
}

export default App
