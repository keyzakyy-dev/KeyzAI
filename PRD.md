# KeyzAI - Product Requirements Document

## 1. PROJECT OVERVIEW

**Project Name:** KeyzAI

**Objective:** Build production-ready web chatbot with OpenAI-compatible API. Modern UI using shadcn/ui.

**Scope:** MVP with core chat functionality.

**Timeline:** 1-2 days development + testing

---

## 2. BUSINESS REQUIREMENTS

| Requirement | Detail |
|---|---|
| Target Users | Developers, researchers, general public |
| Use Case | Quick AI interaction without friction |
| Success Metric | Chat end-to-end, <2s response, zero crashes |
| Budget | $0 frontend (Vercel free), $0 backend (Cloudflare free) |
| Brand | KeyzAI — premium, sleek, professional |

---

## 3. FUNCTIONAL REQUIREMENTS

### 3.1 Chat Interface
- Input textarea (shadcn/ui), max 2000 chars
- Send button (disabled during loading)
- Messages: user right-aligned, AI left-aligned
- Timestamps, avatars (User/AI icons)
- Clear chat button
- Loading spinner + "Thinking..."
- Error alert + retry button
- Mobile responsive

### 3.2 API Relay (Worker)
- Endpoint: `POST /api/chat`
- Request: `{message, model}`
- Response: `{success, message, model, tokensUsed}` or `{success: false, error, code}`

### 3.3 Configuration
- Frontend: VITE_WORKER_URL in .env
- Worker: OPENAI_API_KEY (secret), OPENAI_API_URL, OPENAI_MODEL

---

## 4. TECHNICAL REQUIREMENTS

### 4.1 Tech Stack
| Layer | Technology | Reason |
|---|---|---|
| Frontend | React 18+ | Hooks, declarative |
| Build | Vite | Fast, optimized |
| UI | shadcn/ui | Modern, accessible |
| Styling | Tailwind CSS | shadcn/ui uses it |
| Backend | Cloudflare Worker | Edge, free tier |
| Icons | Lucide React | Modern icons |
| Deploy FE | Vercel/Netlify | Free, auto |
| Deploy BE | Cloudflare | Free, 100k req/day |

### 4.2 Browser Support
Chrome/Edge 90+, Firefox 88+, Safari 14+, Mobile

### 4.3 Performance
- Page load: <2s
- Send-to-response: <30s
- Render: <100ms

### 4.4 Security
- API key: never in frontend
- CORS: Worker sets headers
- Input: validate, no XSS
- Errors: no internal leaks

---

## 5. NON-FUNCTIONAL REQUIREMENTS

### 5.1 Scalability
- 100k requests/day (Cloudflare free)
- Stateless design

### 5.2 Reliability
- Graceful errors
- 30s timeout
- Retry logic

### 5.3 Maintainability
- Organized components
- Clear naming
- Comments for logic
- Env externalized

### 5.4 UI/UX
- Consistent spacing
- WCAG 2.1 AA accessible
- Smooth animations
- Professional branding

---

## 6. DATA STRUCTURE

### 6.1 Message Object
```javascript
{
  id: "msg_123",
  role: "user" | "assistant",
  content: "Text",
  timestamp: 1694596401,
  loading: false,
  error: null
}
```

### 6.2 Flow
```
User Input → React → POST /api/chat → Worker
Worker → OpenAI API → Response → Frontend → Render
```

---

## 7. PROJECT PHASES

### PHASE 1: SETUP (1-2 hours)
- Init Vite + React
- Install shadcn/ui
- Init Cloudflare Worker
- Folder structure
- Test locally

### PHASE 2: FRONTEND UI (2-3 hours)
- ChatInterface.jsx (state)
- ChatMessage.jsx (display)
- ChatInput.jsx (input + send)
- App.jsx (integration)
- Tailwind + shadcn/ui styling

### PHASE 3: WORKER (1-2 hours)
- POST /api/chat endpoint
- CORS handling
- Input validation
- OpenAI relay
- Error handling
- 30s timeout

### PHASE 4: INTEGRATION (1-2 hours)
- api.js wrapper
- Connect React to Worker
- Real API testing
- Error scenarios

### PHASE 5: DEPLOYMENT (1-2 hours)
- Deploy Worker
- Set Cloudflare secrets
- Deploy Frontend
- Set env vars
- Live test

### PHASE 6: TESTING & DOCS (1-2 hours)
- Manual tests
- README.md
- .env.example files
- Code cleanup

---

## 8. DESIGN SPECS

### Colors (shadcn/ui defaults)
- Primary: #3b82f6 (Blue)
- Secondary: #8b5cf6 (Purple)
- Muted: #f3f4f6 (Light gray)
- Foreground: #1f2937 (Dark)
- Background: #ffffff (White)
- Destructive: #ef4444 (Red)

### Typography
- H1: 2xl, bold
- Body: sm, regular
- Caption: xs, muted

---

## 9. SUCCESS CRITERIA

- [ ] Frontend renders
- [ ] shadcn/ui styled
- [ ] Chat input sends
- [ ] Worker calls OpenAI
- [ ] AI response displays
- [ ] Error handling works
- [ ] All phases done
- [ ] Deployed (live URLs)
- [ ] README complete
- [ ] All tests pass
- [ ] No console errors
- [ ] Professional appearance

---

## 10. RISKS & MITIGATION

| Risk | Impact | Fix |
|---|---|---|
| API key exposed | Breach | Never commit .env, use Cloudflare secrets |
| CORS errors | Broken | Worker sets CORS headers |
| Timeout | Poor UX | Show loading, reasonable timeout |
| Rate limit | Blocked | Monitor, add later |
| Deploy fails | Down | Test local, follow guide |

---

**Version:** 2.0  
**Status:** Ready for Development  
**Created:** 2026-09-13
