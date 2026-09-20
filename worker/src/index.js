/**
 * Cloudflare Worker - KeyzAI backend
 * POST /api/chat            - relay ke OpenAI (butuh auth)
 * POST /api/auth/google     - login via Google ID token
 * GET  /api/auth/me         - cek session
 * GET/PUT /api/preferences  - preferensi akun (butuh auth)
 * GET  /api/conversations   - list percakapan user
 * GET  /api/conversations/:id - detail pohon pesan
 * PUT  /api/conversations/:id - simpan/upsert percakapan
 * PATCH /api/conversations/:id - pin/rename
 * DELETE /api/conversations   - hapus semua percakapan user
 * DELETE /api/conversations/:id
 */

import { verifyGoogleIdToken, signSession, verifySession } from './crypto.js'
import {
  upsertUser,
  listConversations,
  getConversation,
  saveConversation,
  patchConversation,
  deleteConversation,
  getPreferences,
  updatePreferences,
  deleteAllConversations,
} from './db.js'
import { buildPrdMessages, extractPrdJson, isValidPrdStage } from './prd.js'

// If ALLOWED_ORIGINS is unset, all origins are allowed (backwards compatible).
// When set (comma-separated), only listed origins get CORS headers.
function corsHeaders(request, env) {
  const origin = request.headers.get('Origin')
  const allowed = (env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  if (allowed.length === 0 || (origin && allowed.includes(origin))) {
    return {
      'Access-Control-Allow-Origin': origin || '*',
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
    }
  }
  return {}
}

// Ambil userId dari Authorization: Bearer <session jwt>.
// Mengembalikan { uid } atau null.
async function sessionUser(request, env) {
  const auth = request.headers.get('Authorization') || ''
  const m = /^Bearer\s+(.+)$/i.exec(auth.trim())
  if (!m) return null
  const payload = await verifySession(m[1], env.SESSION_SECRET)
  return payload && typeof payload.uid === 'string' ? { uid: payload.uid } : null
}

function unauthorized(env, request) {
  return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
    status: 401,
    headers: { ...corsHeaders(request, env), 'Content-Type': 'application/json' },
  })
}

// Instruksi untuk "kartu pilihan" interaktif. Model hanya perlu menulis fenced block
// berisi JSON; frontend (src/lib/markdown.jsx + src/components/OptionCard.jsx) yang
// me-render-nya jadi kartu. Fence dibuat dari konstanta supaya tidak perlu escape
// backtick di dalam template literal.
const FENCE = '```'
const OPTIONS_SYSTEM_PROMPT = [
  'Kamu adalah KeyzAI. Jawab dengan Bahasa Indonesia yang natural.',
  '',
  'ATURAN UTAMA: default kamu adalah langsung menjawab pertanyaan pengguna — tanpa kartu pilihan. Pengguna tidak ingin setiap pesan dibalas dengan form pilihan.',
  '',
  'Kartu pilihan adalah PENGECUALIAN: hanya tampilkan jika SEMUA syarat ini terpenuhi.',
  '1. Permintaan pengguna benar-benar terlalu ambigu atau terbuka, sehingga kamu tidak bisa memberi jawaban yang berguna tanpa mempersempitnya lebih dulu, DAN',
  '2. Mempersempit pilihan akan sangat memperbaiki jawabanmu (bukan sekadar bertanya "mau tanya apa?").',
  '',
  'TIDAK perlu kartu (langsung jawab saja):',
  '- Sapaan atau obrolan ringan ("halo", "apa kabar")',
  '- Pertanyaan spesifik sekecil apa pun; permintaan fakta, penjelasan, atau panduan langkah',
  '- Permintaan rekomendasi atau pendapat atas hal yang sudah disebut',
  '- Pertanyaan susulan atau lanjutan percakapan',
  '',
  'Boleh kartu (hanya jika benar-benar ambigu):',
  '- "Aku mau mulai bisnis" → arah/topik yang mungkin',
  '- "Bikinin aku sesuatu" → bentuk hasil yang mungkin',
  '- "Gimana cara belajarnya?" tanpa konteks → bidang yang dimaksud',
  '',
  'Pilihan kartu HARUS relevan dengan topik pengguna — domain apa pun, bukan hanya bisnis. Maksimal 1 pertanyaan dan 2-4 opsi singkat. Format:',
  '',
  `${FENCE}keyzai-options`,
  '{"questions":[{"id":"topik","question":"Pertanyaan klarifikasi yang singkat dan natural?","options":[{"label":"Pilihan A","description":"Opsional: keterangan pendek"},{"label":"Pilihan B"}],"multiple":false}]}',
  FENCE,
  '',
  'Jangan tambah opsi "Lainnya" atau "Lewati" — frontend otomatis menyediakannya. Setelah pengguna menjawab kartu, langsung beri jawaban penuh tanpa kartu lagi. Jika ragu perlu kartu atau tidak: tidak perlu, jawab saja.',
].join('\n')

// Prompt tanpa instruksi kartu untuk sapaan/chit-chat. Prompt saja tidak bisa
// diandalkan — model tetap doyen menampilkan kartu di "halo", jadi ini penjaga
// deterministik: pesan kecilan tidak disuntik kontrak kartu sama sekali.
const PLAIN_PROMPT = [
  'Kamu adalah KeyzAI. Jawab dengan Bahasa Indonesia yang natural.',
  '',
  'Pesan pengguna adalah sapaan atau obrolan ringan. Balas hangat dan singkat saja.',
  'DILARANG menampilkan kartu pilihan (blok ```keyzai-options) dalam bentuk apa pun.',
].join('\n')

const GREETING_RE =
  /^(halo+|hallo+|hai+|hi+|hello+|pagi|siang|sore|malam|selamat (pagi|siang|sore|malam)|apa+kabar|apa kabar|gimana|gmn|ada apa|lagi apa|assalamualaikum|salam|tes+|test+|kamu siapa|siapa kamu|bisa bantu apa)([!.,? ]*)$/i

function isSmallTalk(message) {
  const t = message.trim().toLowerCase()
  if (t.length > 60) return false
  return GREETING_RE.test(t)
}

// Alasan penolakan eksplisit (bukan boolean generik) supaya masalah di sisi
// client mudah dilacak dari response saja.
function invalidMessages(messages) {
  if (messages.length > 40) return 'Invalid messages: too many (max 40)'
  if (messages[messages.length - 1]?.role !== 'user') return 'Invalid messages: last message must be from user'
  for (let i = 0; i < messages.length; i++) {
    const m = messages[i]
    if (!m) return `Invalid messages: empty entry at ${i}`
    if (m.role !== 'user' && m.role !== 'assistant') return `Invalid messages: bad role at ${i}`
    if (typeof m.content !== 'string') return `Invalid messages: content must be string at ${i}`
    const max = m.role === 'user' ? 2000 : 32000
    if (m.content.length > max) return `Invalid messages: ${m.role} content too long at ${i}`
  }
  return null
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)
    const path = url.pathname

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders(request, env) })
    }

    // ---------------- DEBUG ENV (cek keberadaan env, tanpa bocorkan nilai)
    if (request.method === 'GET' && path === '/api/debug/env') {
      return response(true, 'OK', 200, {
        hasGoogleClientId: !!env.GOOGLE_CLIENT_ID,
        hasSessionSecret: !!env.SESSION_SECRET,
        hasApiKey: !!env.OPENAI_API_KEY,
        dbBound: !!env.DB,
      }, corsHeaders(request, env))
    }

    // ---------------- AUTH (publik)
    // POST /api/auth/google { idToken }
    if (request.method === 'POST' && path === '/api/auth/google') {
      let body
      try {
        body = await request.json()
      } catch {
        return response(false, 'Bad request', 400, { error: 'Invalid JSON' }, corsHeaders(request, env))
      }
      try {
        const profile = await verifyGoogleIdToken(body.idToken, env.GOOGLE_CLIENT_ID)
        const user = await upsertUser(env.DB, profile)
        const session = await signSession(user.id, env.SESSION_SECRET)
        return response(true, 'Login success', 200, {
          token: session.token,
          expiresAt: session.exp,
          user: { id: user.id, email: user.email, name: user.name, picture: user.picture },
        }, corsHeaders(request, env))
      } catch (e) {
        console.error('Google auth error:', e.message)
        return response(false, 'Auth failed', 401, { error: 'Login gagal: token Google tidak valid', details: e.message }, corsHeaders(request, env))
      }
    }

    // GET /api/auth/me
    if (request.method === 'GET' && path === '/api/auth/me') {
      const session = await sessionUser(request, env)
      if (!session) return unauthorized(env, request)
      const row = await env.DB.prepare('SELECT id, email, name, picture FROM users WHERE id = ?')
        .bind(session.uid)
        .first()
      if (!row) return unauthorized(env, request)
      return response(true, 'OK', 200, { user: row }, corsHeaders(request, env))
    }

    // ---------------- PREFERENSI AKUN (butuh auth)
    // GET /api/preferences  -> { preferences, user }
    // PUT /api/preferences  -> body { default_model?, sidebar_width?, display_name? }
    if (path === '/api/preferences') {
      const session = await sessionUser(request, env)
      if (!session) return unauthorized(env, request)

      if (request.method === 'GET') {
        const data = await getPreferences(env.DB, session.uid)
        if (!data) return unauthorized(env, request)
        return response(true, 'OK', 200, data, corsHeaders(request, env))
      }

      if (request.method === 'PUT') {
        let body
        try {
          body = await request.json()
        } catch {
          return response(false, 'Bad request', 400, { error: 'Invalid JSON' }, corsHeaders(request, env))
        }
        const patch = {}
        if (body.default_model !== undefined) {
          if (typeof body.default_model !== 'string' || !body.default_model.trim()) {
            return response(false, 'Bad request', 400, { error: 'Model tidak valid' }, corsHeaders(request, env))
          }
          patch.default_model = body.default_model.trim().slice(0, 64)
        }
        if (body.sidebar_width !== undefined) {
          const w = Number(body.sidebar_width)
          if (!Number.isFinite(w)) {
            return response(false, 'Bad request', 400, { error: 'Lebar sidebar tidak valid' }, corsHeaders(request, env))
          }
          patch.sidebar_width = w
        }
        if (body.display_name !== undefined) {
          if (typeof body.display_name !== 'string') {
            return response(false, 'Bad request', 400, { error: 'Nama tidak valid' }, corsHeaders(request, env))
          }
          patch.display_name = body.display_name
        }
        if (!Object.keys(patch).length) {
          return response(false, 'Bad request', 400, { error: 'Tidak ada perubahan' }, corsHeaders(request, env))
        }
        const data = await updatePreferences(env.DB, session.uid, patch)
        if (!data) return unauthorized(env, request)
        return response(true, 'Saved', 200, data, corsHeaders(request, env))
      }
    }

    // ---------------- PERCAKAPAN (butuh auth)
    const convMatch = /^\/api\/conversations(?:\/([^/]+))?$/.exec(path)
    if (convMatch) {
      const session = await sessionUser(request, env)
      if (!session) return unauthorized(env, request)
      const convId = convMatch[1] || null
      const db = env.DB

      // GET /api/conversations — list ringan (tanpa messages_json)
      if (request.method === 'GET' && !convId) {
        const convs = await listConversations(db, session.uid)
        return response(true, 'OK', 200, { conversations: convs }, corsHeaders(request, env))
      }

      // DELETE /api/conversations — hapus SEMUA percakapan user (data & privasi)
      if (request.method === 'DELETE' && !convId) {
        const deleted = await deleteAllConversations(db, session.uid)
        return response(true, 'Deleted', 200, { deleted }, corsHeaders(request, env))
      }

      if (convId) {
        // GET /api/conversations/:id — pohon pesan utuh
        if (request.method === 'GET') {
          const conv = await getConversation(db, session.uid, convId)
          if (!conv) return response(false, 'Not found', 404, { error: 'Percakapan tidak ditemukan' }, corsHeaders(request, env))
          return response(true, 'OK', 200, { conversation: conv }, corsHeaders(request, env))
        }

        // PUT /api/conversations/:id — upsert penuh
        if (request.method === 'PUT') {
          let body
          try {
            body = await request.json()
          } catch {
            return response(false, 'Bad request', 400, { error: 'Invalid JSON' }, corsHeaders(request, env))
          }
          if (!body?.id || body.id !== convId) {
            return response(false, 'Bad request', 400, { error: 'ID tidak cocok' }, corsHeaders(request, env))
          }
          await saveConversation(db, session.uid, body)
          return response(true, 'Saved', 200, {}, corsHeaders(request, env))
        }

        // PATCH /api/conversations/:id — pin/rename
        if (request.method === 'PATCH') {
          let body
          try {
            body = await request.json()
          } catch {
            return response(false, 'Bad request', 400, { error: 'Invalid JSON' }, corsHeaders(request, env))
          }
          const ok = await patchConversation(db, session.uid, convId, body)
          return response(true, ok ? 'Patched' : 'No changes', 200, { updated: ok }, corsHeaders(request, env))
        }

        // DELETE /api/conversations/:id
        if (request.method === 'DELETE') {
          const ok = await deleteConversation(db, session.uid, convId)
          if (!ok) return response(false, 'Not found', 404, { error: 'Percakapan tidak ditemukan' }, corsHeaders(request, env))
          return response(true, 'Deleted', 200, {}, corsHeaders(request, env))
        }
      }
    }

    // ---------------- CHAT (butuh auth)
    // POST /api/chat
    if (request.method === 'POST' && path === '/api/chat') {
      const session = await sessionUser(request, env)
      if (!session) return unauthorized(env, request)

      try {
        let body
        try {
          const rawBody = await request.text()
          body = JSON.parse(rawBody.replace(/^\uFEFF/, ''))
        } catch {
          return response(false, 'Bad request', 400, { error: 'Invalid JSON' }, corsHeaders(request, env))
        }
        const { message, model, stream, messages, system } = body

        // Validate input
        if (!message || typeof message !== 'string' || message.trim().length === 0) {
          return response(false, 'Message required', 400, { error: 'Invalid message' }, corsHeaders(request, env))
        }

        if (message.length > 2000) {
          return response(false, 'Message too long', 400, { error: 'Max 2000 chars' }, corsHeaders(request, env))
        }

        // Routing per model: model -> { url, key } provider.
        // Key di env (secret): OPENAI_API_KEY (b.ai), ATRIA_API_KEY (atria).
        const providers = {
          bai: { url: env.OPENAI_API_URL || 'https://api.openai.com/v1', key: env.OPENAI_API_KEY },
          atria: { url: 'https://api.atria-asi.ai/v1', key: env.ATRIA_API_KEY },
        }
        const ALLOWED_MODELS = ['qwen3.8-flash', 'deepseek-v4-flash', 'Atria-Dawn-Preview']
        const MODEL_PROVIDER = { 'qwen3.8-flash': 'bai', 'deepseek-v4-flash': 'bai', 'Atria-Dawn-Preview': 'atria' }
        if (model && !ALLOWED_MODELS.includes(model)) {
          return response(false, 'Unknown model', 400, { error: `Model tidak dikenal: ${model}` }, corsHeaders(request, env))
        }
        const modelName = model || env.OPENAI_MODEL || ALLOWED_MODELS[0]
        const provider = providers[MODEL_PROVIDER[modelName]] || providers.bai
        const apiKey = provider.key
        const apiUrl = provider.url

        // Konteks: `messages` = transkrip penuh (termasuk pesan user terbaru) dari client.
        // ponytail: cap 40 msg; user 2000 char, assistant 32000 (batas max_tokens); upgrade = summarisasi turn lama
        let chatMessages = [{ role: 'user', content: message }]
        if (Array.isArray(messages) && messages.length > 0) {
          const reason = invalidMessages(messages)
          if (reason) {
            return response(false, 'Invalid messages', 400, { error: reason }, corsHeaders(request, env))
          }
          chatMessages = messages
        }

        // Instruksi kartu pilihan (keyzai-options) hanya untuk chat.
        // Panggilan non-chat (mis. generate judul) mengirim system: false.
        // Sapaan/chit-chat pendek dapat prompt tanpa kartu (lihat PLAIN_PROMPT).
        if (system !== false) {
          const prompt = isSmallTalk(message) ? PLAIN_PROMPT : OPTIONS_SYSTEM_PROMPT
          chatMessages = [{ role: 'system', content: prompt }, ...chatMessages]
        }

        if (!apiKey) {
          return response(false, 'API key not configured', 500, { error: `Server error: API key for ${modelName} is not set` }, corsHeaders(request, env))
        }

        // Streaming: relay upstream SSE body as-is
        // ponytail: mid-stream upstream drop shows as truncated answer; upgrade path = emit an SSE error event
        if (stream) {
          const upstream = await fetch(`${apiUrl}/chat/completions`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: modelName,
              messages: chatMessages,
              temperature: 0.7,
              max_tokens: Number(env.OPENAI_MAX_TOKENS) || 16384,
              stream: true,
            }),
            signal: AbortSignal.timeout(120000),
          })

          if (!upstream.ok) {
            const error = await upstream.text()
            console.error('OpenAI stream error:', error)
            return response(false, 'OpenAI error', 500, { error: `Service error (${upstream.status})` }, corsHeaders(request, env))
          }

          return new Response(upstream.body, {
            headers: {
              ...corsHeaders(request, env),
              'Content-Type': upstream.headers.get('Content-Type') || 'text/event-stream',
              'Cache-Control': 'no-cache',
            },
          })
        }

        // Call OpenAI
        const openaiRes = await fetch(`${apiUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: modelName,
            messages: chatMessages,
            temperature: 0.7,
            max_tokens: Number(env.OPENAI_MAX_TOKENS) || 16384,
          }),
          signal: AbortSignal.timeout(30000),
        })

        if (!openaiRes.ok) {
          const error = await openaiRes.text()
          console.error('OpenAI error:', error)
          return response(false, 'OpenAI error', 500, { error: `Service error (${openaiRes.status})` }, corsHeaders(request, env))
        }

        const data = await openaiRes.json()
        // Model reasoning bisa habiskan budget di reasoning_content sampai content
        // kosong; reasoning tidak ditampilkan ke pengguna — minta kirim ulang.
        const aiMessage = data.choices?.[0]?.message?.content || 'Tidak ada respons dari model.'
        const tokensUsed = data.usage?.total_tokens || 0

        return response(true, aiMessage, 200, {
          message: aiMessage,
          model: modelName,
          tokensUsed,
        }, corsHeaders(request, env))
      } catch (error) {
        console.error('Error:', error)
        return response(false, 'Server error', 500, { error: 'Server error' }, corsHeaders(request, env))
      }
    }

    // ---------------- PRD BUILDER (butuh auth)
    // POST /api/prd { stage, project, instruction?, sectionTitle?, sectionContent? }
    // Dipakai frontend src/lib/prd-api.js. Prompt per-stage ada di prd.js;
    // model menjawab JSON yang diparse + divalidasi di sini sebelum dikirim
    // balik ke client (data model tidak pernah dipercaya mentah).
    if (request.method === 'POST' && path === '/api/prd') {
      const session = await sessionUser(request, env)
      if (!session) return unauthorized(env, request)

      let body
      try {
        const rawBody = await request.text()
        body = JSON.parse(rawBody.replace(/^\uFEFF/, ''))
      } catch {
        return response(false, 'Bad request', 400, { error: 'Invalid JSON' }, corsHeaders(request, env))
      }

      const { stage, project, instruction, sectionTitle, sectionContent } = body || {}
      if (!isValidPrdStage(stage)) {
        return response(false, 'Bad request', 400, { error: `Unknown stage: ${stage}` }, corsHeaders(request, env))
      }
      if (!project || typeof project !== 'object' || typeof project.projectIdea !== 'string') {
        return response(false, 'Bad request', 400, { error: 'Invalid project context' }, corsHeaders(request, env))
      }

      let messages
      try {
        messages = buildPrdMessages(stage, project, { instruction, sectionTitle, sectionContent })
      } catch (e) {
        return response(false, 'Bad request', 400, { error: e.message || 'Invalid stage input' }, corsHeaders(request, env))
      }

      // Routing provider sama dengan /api/chat.
      const providers = {
        bai: { url: env.OPENAI_API_URL || 'https://api.openai.com/v1', key: env.OPENAI_API_KEY },
        atria: { url: 'https://api.atria-asi.ai/v1', key: env.ATRIA_API_KEY },
      }
      const ALLOWED_MODELS = ['qwen3.8-flash', 'deepseek-v4-flash', 'Atria-Dawn-Preview']
      const MODEL_PROVIDER = { 'qwen3.8-flash': 'bai', 'deepseek-v4-flash': 'bai', 'Atria-Dawn-Preview': 'atria' }
      const modelName = ALLOWED_MODELS.includes(project.model) ? project.model : env.OPENAI_MODEL || ALLOWED_MODELS[0]
      // qwen3.8-flash (reasoning) butuh >5 menit untuk menulis PRD penuh — selalu
      // timeout. Tahap berat dipaksa ke deepseek-v4-flash (terukur ±40-90s).
      const HEAVY_PRD_STAGES = ['prd', 'regenerate']
      const effectiveModel = HEAVY_PRD_STAGES.includes(stage) && modelName === 'qwen3.8-flash' ? 'deepseek-v4-flash' : modelName
      const provider = providers[MODEL_PROVIDER[effectiveModel]] || providers.bai
      const apiKey = provider.key
      const apiUrl = provider.url
      if (!apiKey) {
        return response(false, 'API key not configured', 500, { error: `Server error: API key for ${effectiveModel} is not set` }, corsHeaders(request, env))
      }

      try {
        const upstream = await fetch(`${apiUrl}/chat/completions`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: effectiveModel,
            messages,
            temperature: 0.5,
            max_tokens: Number(env.OPENAI_MAX_TOKENS) || 16384,
          }),
          signal: AbortSignal.timeout(300000),
        })

        if (!upstream.ok) {
          console.error('PRD upstream error:', await upstream.text())
          return response(false, 'AI error', 500, { error: `Service error (${upstream.status})` }, corsHeaders(request, env))
        }

        const data = await upstream.json()
        const raw = data.choices?.[0]?.message?.content || ''
        const parsed = extractPrdJson(raw)
        if (parsed == null) {
          console.error('PRD parse failed:', raw.slice(0, 500))
          return response(false, 'AI error', 502, { error: 'Respons AI tidak dapat dibaca. Coba lagi.' }, corsHeaders(request, env))
        }

        return response(true, 'OK', 200, { data: parsed }, corsHeaders(request, env))
      } catch (error) {
        console.error('PRD error:', error)
        return response(false, 'Server error', 500, { error: 'Server error' }, corsHeaders(request, env))
      }
    }

    // 404
    return new Response('Not Found', { status: 404, headers: corsHeaders(request, env) })
  },
}

function response(success, msg, status, data, headers) {
  return new Response(JSON.stringify({ success, ...data }), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json' },
  })
}
