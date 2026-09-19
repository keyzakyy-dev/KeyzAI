# KeyzAI - Production Web Chatbot

Modern AI chat interface with streaming, message-tree history, Google login, and cloud sync. Built with React, Vite, Tailwind CSS, shadcn/ui components, and Cloudflare Workers + D1.

## Features

- Streaming chat responses (SSE) with stop/partial-save
- Message tree: edit & regenerate create branches (ChatGPT-style `<` `>` navigation)
- Interactive option cards (`keyzai-options` blocks rendered as clickable cards)
- Google sign-in (ID token → session JWT, httpless storage in localStorage)
- Cloud sync: conversations + preferences to Cloudflare D1, localStorage as offline cache
- Multi-conversation sidebar: pin, rename, delete (with undo), search-free lightweight list
- AI-generated conversation titles (fallback to first-message excerpt)
- Account preferences: default model, sidebar width, display name
- Export/import chat backup (JSON)
- Markdown rendering with copy buttons
- Error handling + retry, loading indicators, empty-response recovery
- Responsive, mobile-friendly, light/dark theme
- CORS allowlist via `ALLOWED_ORIGINS`

## Tech Stack

- **Frontend:** React 18, Vite, Tailwind CSS, Radix UI, Lucide icons, React Router
- **Backend:** Cloudflare Worker (serverless) + Cloudflare D1 (SQLite)
- **Auth:** Google Identity Services → worker-signed session JWT
- **LLM:** OpenAI-compatible relay (default: `qwen3.8-flash` via `api.b.ai`)
- **Deploy:** Vercel (frontend), Cloudflare (backend)

## Quick Start

### Prerequisites
- Node.js 18+
- Cloudflare account (free tier OK, needs D1)
- Vercel account (free tier OK)
- LLM provider API key (OpenAI-compatible)
- Google OAuth 2.0 Client ID (Web)

### Setup Local Development

1. **Clone repo**
```bash
git clone <repo>
cd KeyzAI
npm install
```

2. **Frontend env** — create `.env`:
```
VITE_WORKER_URL=http://localhost:8787
VITE_GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com
```

3. **Worker**
```bash
cd worker
npm install
```

Create `.dev.vars` (Wrangler loads it automatically in dev):
```
OPENAI_API_KEY=...
SESSION_SECRET=random-long-string
```
(`OPENAI_API_URL`, `OPENAI_MODEL`, `GOOGLE_CLIENT_ID`, `ALLOWED_ORIGINS` are set in `wrangler.toml`.)

Apply migrations to local D1:
```bash
npx wrangler d1 migrations apply keyzai-db --local
```

4. **Dev mode**
```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2: Worker
cd worker && npm run dev
```

Visit `http://localhost:5173`

## API Reference

All `/api/chat` and `/api/conversations*` / `/api/preferences` routes require
`Authorization: Bearer <session JWT>`.

### POST /api/chat

**Request:**
```json
{
  "message": "What is React?",
  "model": "qwen3.8-flash",
  "stream": true,
  "messages": [{ "role": "user", "content": "..." }],
  "system": false
}
```
- `messages` (optional): full transcript from client (max 40; user ≤2000, assistant ≤32000 chars)
- `system: false`: skip the option-card system prompt (used for title generation)

**Response:** JSON `{ success, message, model, tokensUsed }`, or SSE stream when `stream: true`.

### Auth
- `POST /api/auth/google` `{ idToken }` → `{ token, expiresAt, user }`
- `GET /api/auth/me` → `{ user }`

### Conversations
- `GET /api/conversations` — list (metadata only, no message tree)
- `GET /api/conversations/:id` — full message tree
- `PUT /api/conversations/:id` — upsert full conversation object
- `PATCH /api/conversations/:id` — `{ title?, titlePending?, pinned? }`
- `DELETE /api/conversations` — delete all
- `DELETE /api/conversations/:id`

### Preferences
- `GET /api/preferences` → `{ preferences: { default_model, sidebar_width }, user }`
- `PUT /api/preferences` `{ default_model?, sidebar_width?, display_name? }`

## Architecture

```
User Input
    ↓
React (ChatInterface) → chatReducer (pure) → message tree (state/tree.js)
    ↓
fetch() → Worker /api/chat (JWT auth)
    ↓
OpenAI-compatible API (Atria) — SSE relay
    ↓
Stream deltas → reducer → render (ChatMessage + markdown)
    ↓
Debounced sync: localStorage (always) + D1 PUT /api/conversations (signed-in)
```

## File Structure

```
KeyzAI/
├── src/
│   ├── components/        # ChatInterface, ChatMessage, ChatInput, Sidebar,
│   │                      # LoginDialog, PreferencesDialog, OptionCard, ui/*
│   ├── hooks/             # useChatStore, useChatStream, useAuth, usePreferences,
│   │                      # useResizableSidebar, useToast
│   ├── lib/               # auth, sync, markdown, options, models, preferences,
│   │                      # backup, greetings, donate, seo, utils
│   ├── state/             # tree.js (message tree), chat-reducer.js, persistence.js, ids.js
│   ├── pages/LandingPage.jsx
│   └── api.js             # sendMessage / sendMessageStream / generateTitle
├── worker/
│   ├── src/               # index.js (routes), db.js (D1), crypto.js (JWT + Google verify)
│   ├── migrations/        # 0001_init.sql, 0002_preferences.sql
│   ├── test/validation.mjs
│   └── wrangler.toml      # D1 binding, vars, production env
├── test/                  # state-tree, chat-reducer, chat-flow, options, preferences
├── vite.config.js / tailwind.config.js / postcss.config.js
└── index.html
```

## Testing

```bash
npm test
```
Runs pure-logic tests (message tree, reducer, send flow, option-card parser,
preferences) and worker validation tests — no framework, assert-based.

## Security

- LLM API key never in frontend; stored as Cloudflare secret
- Google ID token verified server-side; session is a signed JWT (`SESSION_SECRET`)
- All data endpoints scoped to `user_id` from verified session
- CORS restricted via `ALLOWED_ORIGINS` allowlist
- Input validation at trust boundary (length, role, count limits)
- No XSS: React escapes by default; markdown renderer is allowlist-based

## Troubleshooting

**CORS error:** origin missing from `ALLOWED_ORIGINS` in `wrangler.toml`.

**401 Unauthorized:** session expired — `authFetch` clears token and prompts re-login.

**No login button:** `VITE_GOOGLE_CLIENT_ID` not set in frontend `.env`.

**D1 errors:** run `npx wrangler d1 migrations apply keyzai-db --remote`.

**Empty model response:** reasoning ate the token budget — frontend drops the
empty bubble and asks the user to resend.

---

**Version:** 2.0
**Last updated:** 2026-09-17
