# KeyzAI - Product Requirements Document

## 1. PROJECT OVERVIEW

**Project Name:** KeyzAI

**Objective:** Production-ready AI chat web app: streaming chat with message-tree
history (edit/regenerate branches), Google login, and cross-device cloud sync.
Modern UI using shadcn/ui.

**Status:** Implemented (v2)

---

## 2. BUSINESS REQUIREMENTS

| Requirement | Detail |
|---|---|
| Target Users | Developers, researchers, general public |
| Use Case | Daily AI interaction with full conversation history |
| Success Metric | Chat end-to-end, streaming <2s first token, zero crashes |
| Budget | $0 hosting (Vercel free + Cloudflare free incl. D1) |
| Brand | KeyzAI — premium, sleek, professional |

---

## 3. FUNCTIONAL REQUIREMENTS

### 3.1 Chat
- Streaming answers (SSE relay), stop button, partial save on abort
- Message tree: edit user message or regenerate AI answer → new branch,
  sibling navigation (`<`/`>`), active path rendered
- Interactive option cards: model may emit a `keyzai-options` fenced JSON block
  rendered as a card (1 question, 2–4 options, multiple optional); strict
  prompt rules keep it out of normal answers; greetings get a plain prompt
- Empty-response recovery: bubble removed, retry offered
- AI-generated titles (skeleton pulse while pending, fallback excerpt)

### 3.2 History & Sync
- Multi-conversation sidebar: new, pin, rename, delete (undo), export/import JSON backup
- localStorage always (offline cache); D1 sync (debounced, sig-based) when signed in
- Anon visitors: no account data shown; login via Google popup on first send

### 3.3 Account
- Google sign-in (ID token → worker-issued session JWT)
- Preferences: default model, sidebar width, display name (cloud-synced)

### 3.4 API Relay (Worker)
- `POST /api/chat` — relay, auth required, `stream` + `messages` transcript support
- Auth: `POST /api/auth/google`, `GET /api/auth/me`
- Conversations CRUD + `DELETE all` (data & privacy)
- Preferences GET/PUT
- Validation: message ≤2000, transcript ≤40 (user 2000 / assistant 32000 chars)
- Timeouts: 30s non-stream, 120s stream

---

## 4. TECHNICAL REQUIREMENTS

### 4.1 Tech Stack
| Layer | Technology | Reason |
|---|---|---|
| Frontend | React 18 | Hooks, declarative |
| Build | Vite | Fast, optimized |
| UI | shadcn/ui (Radix) | Modern, accessible |
| Styling | Tailwind CSS | Utility-first |
| State | useReducer + pure tree model | Testable without side effects |
| Backend | Cloudflare Worker | Edge, free tier |
| DB | Cloudflare D1 | Free SQLite, same account |
| Auth | Google OIDC + signed session JWT | No user passwords stored |
| LLM | OpenAI-compatible API (Atria) | Swap via env |
| Icons | Lucide React | Modern icons |
| Deploy FE | Vercel | Free, auto |
| Deploy BE | Cloudflare | Free |

### 4.2 Performance
- Page load <2s, first token <2s (streaming), render <100ms

### 4.3 Security
- LLM key: Cloudflare secret only
- Session JWT signed with `SESSION_SECRET`; data queries scoped to session `uid`
- CORS allowlist (`ALLOWED_ORIGINS`)
- Input validation at worker boundary; no internal error leaks

### 4.4 Maintainability
- Pure state logic (`src/state/`, worker validation) covered by assert-based tests (`npm test`)
- Env externalized (`wrangler.toml` vars + secrets, frontend `.env`)

---

## 5. DATA MODEL

### 5.1 Message Tree
```
message:      { id, role, content, timestamp, parentId, children: [id], state }
conversation: { id, title, titlePending, createdAt, updatedAt, pinned,
                rootId, activeLeafId, messages: { [id]: message } }
```
Rendered conversation = root → `activeLeafId` path. Whole tree stored as JSON
in D1 (`messages_json`); relational columns (title, pinned, timestamps) for list queries.

### 5.2 D1 Schema
- `users(id, google_sub UNIQUE, email, name, picture, settings_json, created_at)`
- `conversations(id, user_id, title, title_pending, created_at, updated_at, pinned, root_id, active_leaf_id, messages_json)` + index `(user_id, updated_at DESC)`
- Migrations: `worker/migrations/0001_init.sql`, `0002_preferences.sql`

### 5.3 Sync
- Local: debounced localStorage save (quota error surfaced as toast)
- Cloud: per-conversation signature `id:updatedAt`; changed sigs upserted after debounce; hydration seeds signatures to avoid re-upload loop

---

## 6. SUCCESS CRITERIA

- [x] Streaming chat works (stop, partial save, empty recovery)
- [x] Branching history (edit/regenerate) persists across devices
- [x] Google login + session lifecycle (401 → re-login)
- [x] Conversations + preferences sync (D1)
- [x] Option cards parse/render; greeting guard prevents false cards
- [x] Preferences (model, sidebar width, display name)
- [x] Backup export/import
- [x] `npm test` green (tree, reducer, flow, options, prefs, worker validation)
- [x] Deployed (Vercel + Cloudflare) with CORS allowlist

---

## 7. RISKS & MITIGATION

| Risk | Impact | Fix |
|---|---|---|
| LLM key exposed | Breach | Cloudflare secret only |
| CORS misconfig | Broken | `ALLOWED_ORIGINS` allowlist |
| Upstream drop mid-stream | Truncated answer | Partial save + error state (upgrade: SSE error event) |
| Reasoning budget eats output | Empty answer | Empty-bubble removal + retry message |
| localStorage quota | New chats lost | Quota error toast + export backup |
| D1 sync conflict (2 devices) | Last-write-wins | Acceptable now; upgrade: per-merge revision check |

---

**Version:** 2.1
**Status:** Implemented
**Updated:** 2026-09-17
