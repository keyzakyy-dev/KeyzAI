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
 * Streams the answer; onDelta receives the cumulative text per chunk.
 * Falls back to a single JSON response when browser or backend can't stream.
 * Returns the full text.
 */
export async function sendMessageStream(message, onDelta) {
  const msg = validateMessage(message)

  if (typeof ReadableStream === 'undefined') {
    const fallback = await sendMessage(message)
    onDelta(fallback.message)
    return fallback.message
  }

  const response = await fetch(`${API_URL}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message: msg, stream: true }),
    signal: timeout(120000),
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
}
