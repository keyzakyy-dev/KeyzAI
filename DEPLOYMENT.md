# Deployment Guide

## Prerequisites

- GitHub account + repo pushed
- Cloudflare account (free, needs D1)
- Vercel account (free)
- LLM API key (OpenAI-compatible, e.g. Atria)
- Google OAuth 2.0 Client ID (Web) — authorized origins:
  `http://localhost:5173`, your Vercel domain

## Step 1: Cloudflare Worker + D1

### 1.1 Create D1 database (first time only)

```bash
cd worker
npm install
wrangler login
npx wrangler d1 create keyzai-db
```
Copy the returned `database_id` into `wrangler.toml` (both `[[d1_databases]]`
and `[env.production.d1_databases]`).

### 1.2 Set secrets (not committed, not vars)

```bash
wrangler secret put OPENAI_API_KEY --env production
wrangler secret put SESSION_SECRET --env production
```
`SESSION_SECRET`: any long random string (signs session JWTs).
`GOOGLE_CLIENT_ID`, `OPENAI_API_URL`, `OPENAI_MODEL`, `ALLOWED_ORIGINS`
live in `wrangler.toml` `[vars]` — update `ALLOWED_ORIGINS` with your
production origin before deploying.

### 1.3 Apply migrations & deploy

```bash
npx wrangler d1 migrations apply keyzai-db --remote
npx wrangler deploy --env production
```

Output example:
```
✓ Deployed keyzai-worker-prod
  https://keyzai-worker-prod.<account>.workers.dev
```

**Copy Worker URL.** Smoke test (expect 401 without auth):
```bash
curl -X POST https://keyzai-worker-prod.<account>.workers.dev/api/chat \
  -H "Content-Type: application/json" -d '{"message":"Hello"}'
# {"success":false,"error":"Unauthorized"}
```

## Step 2: Frontend → Vercel

1. Vercel → "Add New..." → "Project" → select GitHub repo
2. Framework: Vite, Root Directory: ./
3. Environment Variables:
   - `VITE_WORKER_URL` = Worker URL from Step 1.3
   - `VITE_GOOGLE_CLIENT_ID` = your Google client ID
4. Deploy (auto-deploys on push afterwards)

## Step 3: Test Live

1. Visit Vercel URL → landing page loads, login button visible
2. Sign in with Google → chat opens
3. Send a message → streaming answer appears, title auto-generated
4. Refresh / login on second device → history synced

## Troubleshooting

| Symptom | Fix |
|---|---|
| CORS error | Add origin to `ALLOWED_ORIGINS` in `wrangler.toml`, redeploy |
| 401 on /api/chat | Session expired → re-login; check `SESSION_SECRET` set |
| No login button | `VITE_GOOGLE_CLIENT_ID` missing in Vercel env |
| Google login fails | Origin not authorized in Google Cloud Console |
| 502/401 upstream | `OPENAI_API_KEY` wrong/expired, check `OPENAI_API_URL` |
| D1 errors | `npx wrangler d1 migrations apply keyzai-db --remote` |
| Env check | `GET /api/debug/env` (booleans only, never values) |

## Updates & Maintenance

```bash
# Worker
cd worker && npx wrangler deploy --env production

# Frontend
git push  # auto-deploys on Vercel
```

Rollback: Worker → Cloudflare dashboard Versions; Vercel → previous deployment.

---

**Last updated:** 2026-09-17
