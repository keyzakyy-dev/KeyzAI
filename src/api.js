/**
 * API client for chat endpoint
 */

const API_URL = import.meta.env.VITE_WORKER_URL || 'http://localhost:8787'

export async function sendMessage(message, model = 'deepseek-v4.1-flash') {
  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    throw new Error('Message required')
  }

  if (message.length > 2000) {
    throw new Error('Message too long (max 2000 chars)')
  }

  const response = await fetch(`${API_URL}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: message.trim(),
      model,
    }),
  })

  if (!response.ok) {
    try {
      const data = await response.json()
      throw new Error(data.error || `Server error: ${response.status}`)
    } catch (e) {
      throw new Error(`Server error: ${response.status}`)
    }
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
