/**
 * Cloudflare Worker - OpenAI API Relay
 * POST /api/chat - relay messages to OpenAI
 */

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
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  }
  return {}
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

export default {
  async fetch(request, env, ctx) {
    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders(request, env) })
    }

    // POST /api/chat
    if (request.method === 'POST' && new URL(request.url).pathname === '/api/chat') {
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

        const apiKey = env.OPENAI_API_KEY
        const apiUrl = env.OPENAI_API_URL || 'https://api.openai.com/v1'
        const ALLOWED_MODELS = ['Atria-Dawn-Preview']
        if (model && !ALLOWED_MODELS.includes(model)) {
          return response(false, 'Unknown model', 400, { error: `Model tidak dikenal: ${model}` }, corsHeaders(request, env))
        }
        const modelName = model || env.OPENAI_MODEL || ALLOWED_MODELS[0]

        // Konteks: `messages` = transkrip penuh (termasuk pesan user terbaru) dari client.
        // ponytail: cap 40 msg; user 2000 char, assistant 32000 (batas max_tokens); upgrade = summarisasi turn lama
        let chatMessages = [{ role: 'user', content: message }]
        if (Array.isArray(messages) && messages.length > 0) {
          const ok =
            messages.length <= 40 &&
            messages[messages.length - 1]?.role === 'user' &&
            messages.every(
              (m) =>
                m &&
                (m.role === 'user' || m.role === 'assistant') &&
                typeof m.content === 'string' &&
                m.content.length <= (m.role === 'user' ? 2000 : 32000)
            )
          if (!ok) {
            return response(false, 'Invalid messages', 400, { error: 'Invalid messages' }, corsHeaders(request, env))
          }
          chatMessages = messages
        }

        // Instruksi kartu pilihan (keyzai-options) hanya untuk chat.
        // Panggilan non-chat (mis. generate judul) mengirim system: false.
        if (system !== false) {
          chatMessages = [{ role: 'system', content: OPTIONS_SYSTEM_PROMPT }, ...chatMessages]
        }

        if (!apiKey) {
          return response(false, 'API key not configured', 500, { error: 'Server error: OPENAI_API_KEY secret is not set' }, corsHeaders(request, env))
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
              max_tokens: Number(env.OPENAI_MAX_TOKENS) || 8192,
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
            max_tokens: Number(env.OPENAI_MAX_TOKENS) || 8192,
          }),
          signal: AbortSignal.timeout(30000),
        })

        if (!openaiRes.ok) {
          const error = await openaiRes.text()
          console.error('OpenAI error:', error)
          return response(false, 'OpenAI error', 500, { error: `Service error (${openaiRes.status})` }, corsHeaders(request, env))
        }

        const data = await openaiRes.json()
        const aiMessage = data.choices?.[0]?.message?.content || 'No response'
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
