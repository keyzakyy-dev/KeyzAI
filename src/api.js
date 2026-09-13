/**
 * API client for chat endpoint
 */

const API_URL = import.meta.env.VITE_WORKER_URL || 'http://localhost:8787'

export async function sendMessage(message, model) {
  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    throw new Error('Message required')
  }

  if (message.length > 2000) {
    throw new Error('Message too long (max 2000 chars)')
  }

  const body = { message: message.trim() }
  if (model) body.model = model

  const response = await fetch(`${API_URL}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    signal: typeof AbortSignal !== 'undefined' && AbortSignal.timeout ? AbortSignal.timeout(30000) : undefined,
  })

  if (!response.ok) {
    let msg = `Server error: ${response.status}`
    try {
      const data = await response.json()
      if (data.error) msg = data.error
    } catch {
      // keep generic message
    }
    throw new Error(msg)
  }

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
