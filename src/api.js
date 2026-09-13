/**
 * API client for chat endpoint
 */

const API_URL = import.meta.env?.VITE_WORKER_URL || 'http://localhost:8787'

function validateMessage(message) {
  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    throw new Error('Message required')
  }
  if (message.length > 2000) {
    throw new Error('Message too long (max 2000 chars)')
  }
  return message.trim()
}

async function httpError(response) {
  let msg = `Server error: ${response.status}`
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

export async function sendMessage(message, model) {
  const msg = validateMessage(message)

  const body = { message: msg }
  if (model) body.model = model

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
    throw new Error(data.error || 'Request failed')
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
export async function generateTitle(userText, aiText) {
  const prompt =
    'Summarize the following conversation as a very short title ' +
    '(max 5 words). Output ONLY the title, no quotes, no trailing punctuation.\n\n' +
    `User: ${String(userText).slice(0, 300)}\n\n` +
    `Assistant: ${String(aiText).slice(0, 500)}`

  try {
    const { message } = await sendMessage(prompt)
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
export async function sendMessageStream(message, onDelta, signal) {
  const msg = validateMessage(message)

  if (typeof ReadableStream === 'undefined') {
    const fallback = await sendMessage(message)
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
      body: JSON.stringify({ message: msg, stream: true }),
      signal: controller.signal,
    })

    if (!response.ok) throw await httpError(response)

    const contentType = response.headers.get('Content-Type') || ''
    if (!contentType.includes('text/event-stream') || !response.body) {
      const data = await response.json()
      if (!data.success) throw new Error(data.error || 'Request failed')
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
