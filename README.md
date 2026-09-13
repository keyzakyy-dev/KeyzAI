# KeyzAI - Production Web Chatbot

Modern AI chat interface with OpenAI relay. Built with React, Vite, Tailwind CSS, shadcn/ui components, and Cloudflare Workers.

## Features

- Real-time chat with OpenAI API
- Responsive mobile-friendly UI
- Error handling + retry logic
- Message history with timestamps
- Loading indicators
- Clean, professional design
- CORS-protected API relay

## Tech Stack

- **Frontend:** React 18, Vite, Tailwind CSS, Lucide icons
- **Backend:** Cloudflare Worker (serverless)
- **Styling:** Tailwind CSS + custom components
- **Deploy:** Vercel (frontend), Cloudflare (backend)

## Quick Start

### Prerequisites
- Node.js 16+
- npm or yarn
- Cloudflare account (free tier OK)
- Vercel account (free tier OK)
- OpenAI API key

### Setup Local Development

1. **Clone repo**
```bash
git clone <repo>
cd KeyzAI
npm install
```

2. **Frontend env**
Create `.env` file:
```
VITE_WORKER_URL=http://localhost:8787
```

3. **Worker env**
```bash
cd worker
npm install
```

Create `.env.local`:
```
OPENAI_API_KEY=sk-...
OPENAI_API_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-3.5-turbo
```

4. **Dev mode**
```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2: Worker (after npm install)
cd worker && npm run dev
```

Visit `http://localhost:5173`

## Deployment

### Deploy Frontend (Vercel)

1. Push repo to GitHub
2. Create project on Vercel
3. Set env var: `VITE_WORKER_URL=https://your-worker-url.com`
4. Deploy

### Deploy Worker (Cloudflare)

1. Set secrets:
```bash
cd worker
wrangler secret put OPENAI_API_KEY
# Paste your OpenAI API key, press Ctrl+D
```

2. Deploy:
```bash
wrangler deploy
```

3. Copy Worker URL from output
4. Update Vercel env var `VITE_WORKER_URL` with Worker URL

## API Reference

### POST /api/chat

**Request:**
```json
{
  "message": "What is React?",
  "model": "gpt-3.5-turbo"
}
```

**Response (success):**
```json
{
  "success": true,
  "message": "React is a JavaScript library...",
  "model": "gpt-3.5-turbo",
  "tokensUsed": 123
}
```

**Response (error):**
```json
{
  "success": false,
  "error": "Message required"
}
```

## Architecture

```
User Input
    ↓
React (ChatInterface)
    ↓
fetch() → POST /api/chat
    ↓
Cloudflare Worker
    ↓
OpenAI API
    ↓
Response → React State
    ↓
Render (ChatMessage)
```

## File Structure

```
KeyzAI/
├── src/
│   ├── components/
│   │   ├── ChatInterface.jsx
│   │   ├── ChatMessage.jsx
│   │   └── ChatInput.jsx
│   ├── api.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── worker/
│   ├── src/
│   │   └── index.js
│   ├── wrangler.toml
│   └── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── package.json
└── index.html
```

## Component API

### ChatInterface
Main chat container. Manages messages, loading, errors.

### ChatMessage
Displays single message with role, content, timestamp, avatar.

### ChatInput
Textarea input (max 2000 chars) + send button. Ctrl/Cmd+Enter to send.

### api.js
`sendMessage(text, model)` - sends to Worker, validates input, returns response.

## Error Handling

- Input validation (empty, >2000 chars)
- Network errors with user-friendly messages
- Retry button on failures
- CORS errors → check Worker headers
- API key errors → check Cloudflare secrets

## Security

- API key never in frontend code
- API key stored in Cloudflare secrets (not committed)
- CORS headers set in Worker
- Input validation at trust boundary
- No XSS vulnerabilities (React escapes by default)

## Performance

- Page load: <2s (Vite optimized)
- Send-to-response: <30s (OpenAI timeout)
- Render: <100ms (React optimized)
- Gzip: ~48KB (React + deps bundled)

## Testing

1. **Local test:** Send test message, verify response
2. **Error test:** Send empty message, >2000 chars, check errors
3. **Network test:** Disconnect internet, verify error UI
4. **Mobile test:** Test on phone browser, check responsive layout

## Monitoring

- Check Cloudflare Analytics for Worker requests
- Monitor OpenAI API usage in dashboard
- Check Vercel logs for frontend errors
- Browser console for client-side errors

## Troubleshooting

**CORS error:**
- Worker not running or URL wrong in frontend env
- Check `VITE_WORKER_URL` in `.env`

**API key error:**
- Verify key set in Cloudflare secrets
- Test with curl: `curl -H "Authorization: Bearer sk-..." https://api.openai.com/v1/...`

**Timeout:**
- OpenAI slow response. Check API status.
- Increase timeout if needed (currently 30s)

**Messages not sending:**
- Check Network tab in DevTools
- Verify Worker endpoint responding
- Check VITE_WORKER_URL env var

## Contributing

1. Fork repo
2. Create feature branch
3. Test locally
4. Submit PR

## License

MIT

## Support

- GitHub Issues
- OpenAI docs: https://platform.openai.com/docs
- Cloudflare Worker docs: https://developers.cloudflare.com/workers
- React docs: https://react.dev

---

**Version:** 1.0.0  
**Status:** Production ready  
**Last updated:** 2026-09-13
