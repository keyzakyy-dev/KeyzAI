/**
 * API client for chat endpoint
 */

const API_URL = import.meta.env?.VITE_WORKER_URL || 'http://localhost:8787'

function validateMessage(message) {
  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    throw new Error('Pesan tidak boleh kosong')
  }
  if (message.length > 2000) {
    throw new Error('Pesan terlalu panjang (maks 2000 karakter)')
  }
  return message.trim()
}

async function httpError(response) {
  let msg = `Error server: ${response.status}`
  try {
    const data = await response.json()
    if (data.error) msg = data.error
  } catch {
    // keep generic message
  }
  return new Error(msg)
}

function timeout(ms) {
  return typeof AbortSignal !== 'undefined' && AbortSignal.timeout ? AbortSignal.timeout(ms) : undefined
}

export async function sendMessage(message, model, history) {
  const msg = validateMessage(message)

  const body = { message: msg }
  if (model) body.model = model
  if (history?.length) body.messages = history

  const response = await fetch(`${API_URL}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    signal: timeout(30000),
  })

  if (!response.ok) throw await httpError(response)

  const data = await response.json()

  if (!data.success) {
    throw new Error(data.error || 'Permintaan gagal')
  }

  return {
    message: data.message,
    model: data.model,
    tokensUsed: data.tokensUsed,
  }
}

/**
 * Asks the model to name the conversation. Returns a short clean title,
 * or null if the call fails (caller should fall back).
 */
export async function generateTitle(userText, aiText, model) {
  const prompt =
    'Ringkas percakapan berikut jadi judul sangat pendek (maks 4 kata). ' +
    'Hanya keluar judul, tanpa kutip, tanpa tanda baca di akhir.\n\n' +
    `User: ${String(userText).slice(0, 300)}\n\n` +
    `Assistant: ${String(aiText).slice(0, 500)}`

  try {
    const { message } = await sendMessage(prompt, model)
    const clean = String(message)
      .trim()
      .split('\n')[0]
      .replace(/^["'`\s]+|["'`\s]+$/g, '')
      .replace(/[.!?]+$/, '')
      .trim()
    return clean.slice(0, 40) || null
  } catch {
    return null
  }
}

/**
 * Streams the answer; onDelta receives the cumulative text per chunk.
 * Falls back to a single JSON response when browser or backend can't stream.
 * Optional `signal` lets the caller abort generation (throws AbortError).
 * Returns the full text.
 */
export async function sendMessageStream(message, onDelta, signal, model, history) {
  const msg = validateMessage(message)

  if (typeof ReadableStream === 'undefined') {
    const fallback = await sendMessage(message, model, history)
    onDelta(fallback.message)
    return fallback.message
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 120000)
  const relayAbort = () => controller.abort()
  if (signal) {
    if (signal.aborted) relayAbort()
    else signal.addEventListener('abort', relayAbort, { once: true })
  }

  try {
    const response = await fetch(`${API_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: msg, stream: true, ...(model ? { model } : {}), ...(history?.length ? { messages: history } : {}) }),
      signal: controller.signal,
    })

    if (!response.ok) throw await httpError(response)

    const contentType = response.headers.get('Content-Type') || ''
    if (!contentType.includes('text/event-stream') || !response.body) {
      const data = await response.json()
      if (!data.success) throw new Error(data.error || 'Permintaan gagal')
      onDelta(data.message)
      return data.message
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let full = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop()
      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed.startsWith('data:')) continue
        const payload = trimmed.slice(5).trim()
        if (payload === '[DONE]') continue
        try {
          const json = JSON.parse(payload)
          const delta = json.choices?.[0]?.delta?.content
          if (delta) {
            full += delta
            onDelta(full)
          }
        } catch {
          // keepalives / non-JSON lines — ignore
        }
      }
    }

    return full
  } finally {
    clearTimeout(timer)
    if (signal) signal.removeEventListener('abort', relayAbort)
  }
}
