# Deployment Guide

## Prerequisites

- GitHub account + repo pushed
- Cloudflare account (free)
- Vercel account (free)
- OpenAI API key (paid account)

## Step 1: Deploy Worker to Cloudflare

### 1.1 Set API Key Secret

```bash
cd worker
npm install  # if not done yet
wrangler login  # authenticate with Cloudflare
wrangler secret put OPENAI_API_KEY
# Paste your OpenAI key and press Ctrl+D twice
```

### 1.2 Deploy

```bash
wrangler deploy
```

Output example:
```
✓ Uploaded keyzai-worker (1.23 sec)
✓ Published keyzai-worker
  https://keyzai-worker.your-account.workers.dev
```

**Copy Worker URL** (e.g., `https://keyzai-worker.your-account.workers.dev`)

### 1.3 Test Worker

```bash
curl -X POST https://keyzai-worker.your-account.workers.dev/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello","model":"gpt-3.5-turbo"}'
```

Expect: `{"success":true,"message":"...","model":"gpt-3.5-turbo","tokensUsed":...}`

## Step 2: Deploy Frontend to Vercel

### 2.1 Connect Repo

1. Go to https://vercel.com
2. Click "Add New..." → "Project"
3. Select GitHub repo
4. Framework: Vite
5. Root Directory: ./

### 2.2 Set Environment Variable

In Vercel project settings → Environment Variables:
- Name: `VITE_WORKER_URL`
- Value: Your Worker URL (from Step 1.2)
- Environments: Production, Preview, Development

### 2.3 Deploy

Click "Deploy". Vercel auto-deploys on git push after this.

Output example:
```
✓ Deployed to https://keyzai.vercel.app
```

## Step 3: Test Live

1. Visit your Vercel URL
2. Type test message
3. Send
4. Verify AI response

## Troubleshooting Deployment

### Worker deploy fails: "wrangler: command not found"
```bash
npm install -g wrangler
wrangler deploy
```

### Worker responds with CORS error
Check Worker code has CORS headers. Should see:
```
Access-Control-Allow-Origin: *
```

### Frontend can't reach Worker
1. Verify `VITE_WORKER_URL` in Vercel env
2. Rebuild + redeploy Vercel (`git push`)
3. Check browser Network tab for actual request URL

### OpenAI API error (401, 429)
- 401: API key wrong or expired
- 429: Rate limited. Upgrade OpenAI account or add retry logic

### Timeout on chat send
- OpenAI slow. Check API status at https://status.openai.com
- Increase timeout in worker/src/index.js if needed

## Monitoring

### Cloudflare Worker Analytics
1. https://dash.cloudflare.com
2. Workers → keyzai-worker → Analytics
3. Monitor requests, errors, latency

### Vercel Logs
1. https://vercel.com/dashboard
2. Select project
3. Deployments → Logs tab
4. View build + runtime errors

### OpenAI Usage
1. https://platform.openai.com/account/usage/overview
2. Monitor API calls, tokens, costs

## Updates & Maintenance

### Update Worker Code
```bash
cd worker
# Edit src/index.js
wrangler deploy
```

### Update Frontend
```bash
# Edit src files
git add .
git commit -m "Update UI"
git push  # Auto-deploys on Vercel
```

### Update Dependencies
```bash
# Frontend
npm update
npm run build
git push

# Worker
cd worker
npm update
wrangler deploy
```

## Rollback

### Worker Rollback
```bash
wrangler rollback --version <version_id>
# Find version_id from Cloudflare dashboard
```

### Frontend Rollback
In Vercel dashboard → Deployments → Select previous → Redeploy

---

**Last updated:** 2026-09-13
